/**
 * 5-Tier 0-Cost Image Waterfall Resolution Service
 *
 * Provides a resilient, ordered 5-tier fallback cascade:
 * Tier 1: Local Cache (`public/uploads/qbank-images/`, SHA-256 hash filenames)
 * Tier 2: Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`) when configured
 * Tier 3: Free Stock Photo Search (Openverse & Wikimedia Commons, with Pexels fallback)
 * Tier 4: Pollinations.ai Free Image Generation with anti-leak negative prompts
 * Tier 5: 27 Built-in SVG Vector Scenes (100% offline guarantee)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  normalizeImagePrompt,
  NormalizedImagePrompt,
} from '../llm/imagePromptNormalizer.js';
import {
  VALID_ILLUSTRATION_THEMES,
  isValidIllustrationTheme,
  IllustrationTheme,
} from '../llm/promptTemplates.js';

export type WaterfallTier =
  | 'tier1_cache'
  | 'tier2_cloudflare'
  | 'tier3_stock'
  | 'tier4_pollinations'
  | 'tier5_builtin_svg';

export interface WaterfallResult {
  /** Which tier successfully resolved the image */
  tier: WaterfallTier;
  /** Public accessible URL path (e.g. /uploads/qbank-images/...) or null for SVG fallback */
  imageUrl: string | null;
  /** Guaranteed valid theme from VALID_ILLUSTRATION_THEMES */
  theme: IllustrationTheme;
  /** Total latency in milliseconds */
  latencyMs: number;
  /** Byte size of the local cached image file (0 for SVG) */
  byteSize: number;
  /** Explanatory note or fallback reason if prior tiers were skipped/failed */
  fallbackReason?: string;
  /** Source or provider attribution if applicable */
  attribution?: string;
}

export interface WaterfallOptions {
  /** Force resolution to a specific tier (useful for testing) */
  forceTier?: WaterfallTier;
  /** Skip specific tiers (e.g. skip online tiers in offline tests) */
  skipTiers?: WaterfallTier[];
  /** Maximum timeout for external HTTP calls */
  timeoutMs?: number;
  /** Custom base storage directory override */
  storageDir?: string;
  /** Custom public URL prefix (default: /uploads/qbank-images) */
  publicPrefix?: string;
}

export interface CacheMetadata {
  cacheKey: string;
  rawPrompt: string;
  imagePromptEn: string;
  stockQueryEn: string;
  theme: string;
  tier: WaterfallTier;
  byteSize: number;
  createdAt: string;
  attribution?: string;
}

/**
 * Default local storage directory under public/uploads/qbank-images
 */
export function getDefaultStorageDir(): string {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'qbank-images');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generates a deterministic SHA-256 cache key from the normalized English prompt.
 */
export function getPromptCacheKey(promptText: string): string {
  const normalized = String(promptText || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Returns cache statistics for the local image storage directory.
 */
export function getCacheStats(customDir?: string): { count: number; totalSizeBytes: number } {
  try {
    const dir = customDir || getDefaultStorageDir();
    if (!fs.existsSync(dir)) return { count: 0, totalSizeBytes: 0 };

    const files = fs.readdirSync(dir);
    const imageFiles = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    let totalSizeBytes = 0;

    for (const f of imageFiles) {
      try {
        const stat = fs.statSync(path.join(dir, f));
        totalSizeBytes += stat.size;
      } catch {
        // Ignore stat errors for deleted files
      }
    }

    return {
      count: imageFiles.length,
      totalSizeBytes,
    };
  } catch {
    return { count: 0, totalSizeBytes: 0 };
  }
}

/**
 * Clears the local image cache (used in testing).
 */
export function clearCache(customDir?: string): void {
  try {
    const dir = customDir || getDefaultStorageDir();
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (/\.(jpe?g|png|webp|json)$/i.test(f)) {
        try {
          fs.unlinkSync(path.join(dir, f));
        } catch {
          // Ignore unlink errors
        }
      }
    }
  } catch {
    // Ignore clear errors
  }
}

/**
 * Internal helper: Save an image buffer to the local disk cache and write companion metadata.
 */
function saveBufferToCache(
  dir: string,
  cacheKey: string,
  buffer: Buffer,
  normalized: NormalizedImagePrompt,
  tier: WaterfallTier,
  attribution?: string
): { filePath: string; byteSize: number } {
  const filename = `${cacheKey}.jpg`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);

  const metaFilename = `${cacheKey}.meta.json`;
  const metaPath = path.join(dir, metaFilename);
  const metadata: CacheMetadata = {
    cacheKey,
    rawPrompt: normalized.rawPrompt,
    imagePromptEn: normalized.imagePromptEn,
    stockQueryEn: normalized.stockQueryEn,
    theme: normalized.fallbackSvgTheme,
    tier,
    byteSize: buffer.length,
    createdAt: new Date().toISOString(),
    attribution,
  };

  try {
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
  } catch {
    // Non-fatal if metadata fails to write
  }

  return { filePath, byteSize: buffer.length };
}

/**
 * TIER 1: Check Local Disk Cache
 */
function checkTier1LocalCache(
  dir: string,
  cacheKey: string,
  normalized: NormalizedImagePrompt,
  publicPrefix: string
): WaterfallResult | null {
  const filePath = path.join(dir, `${cacheKey}.jpg`);
  if (fs.existsSync(filePath)) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 0) {
        return {
          tier: 'tier1_cache',
          imageUrl: `${publicPrefix}/${cacheKey}.jpg`,
          theme: normalized.fallbackSvgTheme,
          latencyMs: 0,
          byteSize: stat.size,
          attribution: 'Local disk cache',
        };
      }
    } catch {
      // Fall through on stat error
    }
  }
  return null;
}

/**
 * TIER 1B: Theme-matched Cloudflare Tier 2 cache fallback when Cloudflare API is rate-limited (HTTP 429)
 */
function checkThemeMatchedCloudflareCache(
  dir: string,
  normalized: NormalizedImagePrompt,
  publicPrefix: string
): WaterfallResult | null {
  try {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.meta.json'));
    let bestCandidate: { cacheKey: string; byteSize: number; rawLen: number } | null = null;
    for (const mf of files) {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(dir, mf), 'utf8')) as CacheMetadata;
        if (meta.tier !== 'tier2_cloudflare' || meta.theme !== normalized.fallbackSvgTheme) continue;
        const imgPath = path.join(dir, `${meta.cacheKey}.jpg`);
        if (!fs.existsSync(imgPath)) continue;
        const stat = fs.statSync(imgPath);
        if (stat.size <= 1024) continue;
        const rawLen = String(meta.rawPrompt || '').trim().length;
        if (!bestCandidate || rawLen > bestCandidate.rawLen) {
          bestCandidate = { cacheKey: meta.cacheKey, byteSize: stat.size, rawLen };
        }
      } catch {}
    }
    if (bestCandidate) {
      return {
        tier: 'tier1_cache',
        imageUrl: `${publicPrefix}/${bestCandidate.cacheKey}.jpg`,
        theme: normalized.fallbackSvgTheme,
        latencyMs: 0,
        byteSize: bestCandidate.byteSize,
        attribution: 'Local disk cache (Cloudflare Tier 2 theme match)',
      };
    }
  } catch {}
  return null;
}

/**
 * TIER 2: Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)
 */
async function tryTier2Cloudflare(
  dir: string,
  cacheKey: string,
  normalized: NormalizedImagePrompt,
  publicPrefix: string,
  timeoutMs: number
): Promise<WaterfallResult | null> {
  const cfAccountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfApiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

  if (!cfAccountId || !cfApiToken) {
    // Graceful skip when unconfigured
    return null;
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(timeoutMs, 15000));

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: normalized.imagePromptEn,
        steps: 4,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      let errText = '';
      try {
        errText = (await res.text()).slice(0, 200);
      } catch {}
      console.warn(`[ImageWaterfall] Tier 2 Cloudflare returned HTTP ${res.status}: ${errText}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;

    if (contentType.includes('application/json')) {
      const data = (await res.json()) as any;
      const b64 = data?.result?.image || data?.image;
      if (typeof b64 === 'string' && b64.length > 100) {
        imageBuffer = Buffer.from(b64, 'base64');
      }
    } else {
      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength > 1024) {
        imageBuffer = Buffer.from(arrayBuffer);
      }
    }

    if (imageBuffer && imageBuffer.length > 1024) {
      const saved = saveBufferToCache(
        dir,
        cacheKey,
        imageBuffer,
        normalized,
        'tier2_cloudflare',
        'Cloudflare Workers AI flux-1-schnell'
      );
      return {
        tier: 'tier2_cloudflare',
        imageUrl: `${publicPrefix}/${cacheKey}.jpg`,
        theme: normalized.fallbackSvgTheme,
        latencyMs: 0,
        byteSize: saved.byteSize,
        attribution: 'Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)',
      };
    }
  } catch {
    clearTimeout(timer);
    return null;
  }

  return null;
}

/**
 * TIER 3: Free Stock Photo Search (Openverse -> Wikimedia Commons -> Pexels)
 */
async function tryTier3StockSearch(
  dir: string,
  cacheKey: string,
  normalized: NormalizedImagePrompt,
  publicPrefix: string,
  timeoutMs: number
): Promise<WaterfallResult | null> {
  const query = encodeURIComponent(normalized.stockQueryEn);

  // 3a. Openverse API (Creative Commons search, no auth required)
  try {
    const openverseUrl = `https://api.openverse.org/v1/images/?q=${query}&page_size=5&license_type=commercial,modification`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 6000));

    const res = await fetch(openverseUrl, {
      headers: {
        'User-Agent': 'Minnese-HSK-Platform/1.0 (educational; open-source)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as any;
      const results = Array.isArray(data?.results) ? data.results : [];
      for (const item of results) {
        const candidateUrl = item.url || item.thumbnail;
        if (!candidateUrl) continue;

        try {
          const imgCtrl = new AbortController();
          const imgTimer = setTimeout(() => imgCtrl.abort(), 6000);
          const imgRes = await fetch(candidateUrl, { signal: imgCtrl.signal });
          clearTimeout(imgTimer);

          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.length > 1024) {
              const saved = saveBufferToCache(
                dir,
                cacheKey,
                buf,
                normalized,
                'tier3_stock',
                `Openverse / ${item.creator || 'CC License'} (${item.license || 'CC'})`
              );
              return {
                tier: 'tier3_stock',
                imageUrl: `${publicPrefix}/${cacheKey}.jpg`,
                theme: normalized.fallbackSvgTheme,
                latencyMs: 0,
                byteSize: saved.byteSize,
                attribution: `Openverse: ${item.title || normalized.stockQueryEn} (${item.license || 'CC'})`,
              };
            }
          }
        } catch {
          // Try next candidate
        }
      }
    }
  } catch {
    // Fall through to Wikimedia Commons
  }

  // 3b. Wikimedia Commons API (Public domain / CC, no auth required)
  try {
    const wikimediaUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 6000));

    const res = await fetch(wikimediaUrl, {
      headers: {
        'User-Agent': 'Minnese-HSK-Platform/1.0 (educational; contact@minnese.local)',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as any;
      const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
      for (const page of pages as any[]) {
        const imageinfo = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;
        const candidateUrl = imageinfo?.url;
        const mime = String(imageinfo?.mime || '');
        if (!candidateUrl || (!mime.includes('jpeg') && !mime.includes('png') && !mime.includes('webp'))) {
          continue;
        }

        try {
          const imgCtrl = new AbortController();
          const imgTimer = setTimeout(() => imgCtrl.abort(), 6000);
          const imgRes = await fetch(candidateUrl, {
            headers: {
              'User-Agent': 'Minnese-HSK-Platform/1.0 (educational; contact@minnese.local)',
            },
            signal: imgCtrl.signal,
          });
          clearTimeout(imgTimer);

          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.length > 1024) {
              const saved = saveBufferToCache(
                dir,
                cacheKey,
                buf,
                normalized,
                'tier3_stock',
                `Wikimedia Commons: ${page.title || 'Public Domain / CC'}`
              );
              return {
                tier: 'tier3_stock',
                imageUrl: `${publicPrefix}/${cacheKey}.jpg`,
                theme: normalized.fallbackSvgTheme,
                latencyMs: 0,
                byteSize: saved.byteSize,
                attribution: `Wikimedia Commons: ${page.title || normalized.stockQueryEn}`,
              };
            }
          }
        } catch {
          // Try next page
        }
      }
    }
  } catch {
    // Fall through to Pexels
  }

  // 3c. Pexels API (if PEXELS_API_KEY is configured)
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=3`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 6000));

      const res = await fetch(pexelsUrl, {
        headers: { Authorization: pexelsKey },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = (await res.json()) as any;
        const photos = Array.isArray(data?.photos) ? data.photos : [];
        if (photos.length > 0) {
          const candidateUrl = photos[0].src?.medium || photos[0].src?.large || photos[0].src?.original;
          if (candidateUrl) {
            const imgRes = await fetch(candidateUrl);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (buf.length > 1024) {
                const saved = saveBufferToCache(
                  dir,
                  cacheKey,
                  buf,
                  normalized,
                  'tier3_stock',
                  `Pexels: ${photos[0].photographer || 'Photographer'}`
                );
                return {
                  tier: 'tier3_stock',
                  imageUrl: `${publicPrefix}/${cacheKey}.jpg`,
                  theme: normalized.fallbackSvgTheme,
                  latencyMs: 0,
                  byteSize: saved.byteSize,
                  attribution: `Pexels: ${photos[0].photographer || 'Pexels License'}`,
                };
              }
            }
          }
        }
      }
    } catch {
      // Fall through to Pollinations
    }
  }

  return null;
}

/**
 * TIER 4: Pollinations.ai 0-Cost Vector Illustration Generation
 */
async function tryTier4Pollinations(
  dir: string,
  cacheKey: string,
  normalized: NormalizedImagePrompt,
  publicPrefix: string,
  timeoutMs: number
): Promise<WaterfallResult | null> {
  // Deterministic seed derived from cacheKey
  let seed = 42;
  for (let i = 0; i < cacheKey.length; i++) {
    seed = (seed * 31 + cacheKey.charCodeAt(i)) >>> 0;
  }
  seed = seed % 1000000;

  const stylePrefix = 'Minimalist 2D vector art, clean lines, educational illustration, ';
  const fullPrompt = `${stylePrefix}${normalized.imagePromptEn}`;
  const encodedPrompt = encodeURIComponent(fullPrompt.slice(0, 300));
  const encodedNeg = encodeURIComponent(normalized.negativePrompt.slice(0, 200));

  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${seed}&negative=${encodedNeg}`;

  // Execute with retry logic (1 retry on transient failure)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Minnese-HSK-Platform/1.0 (educational)',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('image') || contentType.includes('octet-stream')) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 512) {
            const saved = saveBufferToCache(
              dir,
              cacheKey,
              buf,
              normalized,
              'tier4_pollinations',
              'Pollinations.ai 2D vector illustration'
            );
            return {
              tier: 'tier4_pollinations',
              imageUrl: `${publicPrefix}/${cacheKey}.jpg`,
              theme: normalized.fallbackSvgTheme,
              latencyMs: 0,
              byteSize: saved.byteSize,
              attribution: 'Pollinations.ai (0-cost educational illustration)',
            };
          }
        }
      }

      if (attempt === 1) {
        // Short backoff before single retry
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch {
      clearTimeout(timer);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  return null;
}

/**
 * TIER 5: 27 Built-In SVG Vector Scenes Fallback (100% Offline Guarantee)
 */
function resolveTier5BuiltinSvg(
  normalized: NormalizedImagePrompt,
  fallbackReason?: string
): WaterfallResult {
  return {
    tier: 'tier5_builtin_svg',
    imageUrl: null,
    theme: normalized.fallbackSvgTheme,
    latencyMs: 0,
    byteSize: 0,
    fallbackReason: fallbackReason || 'Offline guaranteed SVG fallback from 27 built-in scenes',
    attribution: 'Minnese Built-in SVG Vectors',
  };
}

/**
 * Resolves an image prompt through the 5-tier Image Waterfall pipeline.
 *
 * Sequence:
 * Tier 1: Local Cache
 * Tier 2: Cloudflare Workers AI (if configured)
 * Tier 3: Free Stock Photo Search (Openverse / Wikimedia Commons / Pexels)
 * Tier 4: Pollinations.ai 0-cost generation
 * Tier 5: 27 Built-in SVG Vector Scenes (Guaranteed offline fallback)
 */
export async function resolveImageWaterfall(
  input: string | NormalizedImagePrompt,
  options: WaterfallOptions = {}
): Promise<WaterfallResult> {
  const startTime = Date.now();
  const storageDir = options.storageDir || getDefaultStorageDir();
  const publicPrefix = options.publicPrefix || '/uploads/qbank-images';
  const timeoutMs = options.timeoutMs || 8000;
  const skipTiers = new Set<WaterfallTier>(options.skipTiers || []);
  const forceTier = options.forceTier;

  // Step 0: Prompt Normalization & Anti-Leak Filtering
  const normalized: NormalizedImagePrompt =
    typeof input === 'string' ? normalizeImagePrompt(input) : input;

  const cacheKey = getPromptCacheKey(normalized.imagePromptEn);

  // If a specific tier is forced (for test suites)
  if (forceTier) {
    if (forceTier === 'tier5_builtin_svg') {
      const res = resolveTier5BuiltinSvg(normalized, 'Forced Tier 5 testing mode');
      res.latencyMs = Date.now() - startTime;
      return res;
    }
    if (forceTier === 'tier1_cache') {
      const cached = checkTier1LocalCache(storageDir, cacheKey, normalized, publicPrefix);
      if (cached) {
        cached.latencyMs = Date.now() - startTime;
        return cached;
      }
    }
  }

  // Tier 1: Local Cache
  if (!skipTiers.has('tier1_cache')) {
    const cached = checkTier1LocalCache(storageDir, cacheKey, normalized, publicPrefix);
    if (cached) {
      cached.latencyMs = Date.now() - startTime;
      return cached;
    }
  }

  // Tier 2: Cloudflare Workers AI
  if (!skipTiers.has('tier2_cloudflare')) {
    const cfResult = await tryTier2Cloudflare(storageDir, cacheKey, normalized, publicPrefix, timeoutMs);
    if (cfResult) {
      cfResult.latencyMs = Date.now() - startTime;
      return cfResult;
    }
    if (!options.storageDir && !forceTier && !skipTiers.has('tier1_cache')) {
      const themeCached = checkThemeMatchedCloudflareCache(storageDir, normalized, publicPrefix);
      if (themeCached) {
        themeCached.latencyMs = Date.now() - startTime;
        return themeCached;
      }
    }
  }

  // Tier 3: Free Stock Photo Search
  if (!skipTiers.has('tier3_stock')) {
    const stockResult = await tryTier3StockSearch(storageDir, cacheKey, normalized, publicPrefix, timeoutMs);
    if (stockResult) {
      stockResult.latencyMs = Date.now() - startTime;
      return stockResult;
    }
  }

  // Tier 4: Pollinations.ai Fallback
  if (!skipTiers.has('tier4_pollinations')) {
    const pollResult = await tryTier4Pollinations(storageDir, cacheKey, normalized, publicPrefix, timeoutMs);
    if (pollResult) {
      pollResult.latencyMs = Date.now() - startTime;
      return pollResult;
    }
  }

  // Tier 5: 27 Built-In SVG Vector Scenes Fallback (100% offline guarantee)
  const svgResult = resolveTier5BuiltinSvg(
    normalized,
    'Resolved through Tier 5 offline built-in vector SVG scenes'
  );
  svgResult.latencyMs = Date.now() - startTime;
  return svgResult;
}

/**
 * Resolves images across a batch of questions (e.g. from QBank or question parser).
 * Processes stem illustration requirements and option image requirements.
 */
export async function batchResolveQuestionImages(
  questions: any[],
  options: WaterfallOptions = {}
): Promise<any[]> {
  if (!Array.isArray(questions)) return [];

  const results: any[] = [];

  for (const q of questions) {
    if (!q || typeof q !== 'object') {
      results.push(q);
      continue;
    }

    const updated = { ...q };

    // 1. Resolve stem illustration if needed
    const stemPromptRaw = updated.image_prompt || updated.illustration_theme;
    if (stemPromptRaw) {
      const themeVal = String(stemPromptRaw).trim();
      const isAlreadyUrl =
        themeVal.startsWith('/') ||
        themeVal.startsWith('http://') ||
        themeVal.startsWith('https://') ||
        themeVal.startsWith('data:image/');

      if (isAlreadyUrl) {
        updated.image_url = themeVal;
        updated.illustration_resolved_url = themeVal;
        if (!isValidIllustrationTheme(updated.illustration_theme)) {
          updated.illustration_theme = normalizeImagePrompt(themeVal).fallbackSvgTheme;
        }
      } else {
        const resolved = await resolveImageWaterfall(themeVal, options);
        if (resolved.imageUrl) {
          updated.image_url = resolved.imageUrl;
          updated.illustration_resolved_url = resolved.imageUrl;
        }
        updated.illustration_theme = resolved.theme;
        updated.illustration_resolved_tier = resolved.tier;
        updated.illustration_latency_ms = resolved.latencyMs;
      }
    }

    // 2. Resolve options images if present
    if (Array.isArray(updated.options_images) && updated.options_images.length > 0) {
      const resolvedOptionsImages: string[] = [];
      for (const optImg of updated.options_images) {
        if (!optImg) {
          resolvedOptionsImages.push('');
          continue;
        }
        const optVal = String(optImg).trim();
        const isAlreadyUrl =
          optVal.startsWith('/') ||
          optVal.startsWith('http://') ||
          optVal.startsWith('https://') ||
          optVal.startsWith('data:image/');

        if (isAlreadyUrl) {
          resolvedOptionsImages.push(optVal);
        } else {
          const resolved = await resolveImageWaterfall(optVal, options);
          resolvedOptionsImages.push(resolved.imageUrl || resolved.theme);
        }
      }
      updated.options_images = resolvedOptionsImages;
    }

    results.push(updated);
  }

  return results;
}
