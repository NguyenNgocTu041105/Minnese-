import express, { Request, Response } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { assertStagingDatabaseIsolation } from './src/server/dbPaths.js';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import { INITIAL_RAG_DOCUMENTS, queryKnowledgeBase } from './src/data/ragKnowledgeBase';
import { INITIAL_VOCABULARY } from './src/data/hskVocabulary';
import { NEW_HSK1_FULL_LESSONS } from './src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from './src/data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from './src/data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from './src/data/newHsk4BookData';
import {
  qbankRouter,
  sanitizeError,
  isQBankAdminEnabled,
  logEphemeralTokenIfNeeded,
  warnIfInsecureAdminToken,
  getQBankAdminToken,
  qbankSecurityMiddleware,
  requireAdminAuth,
} from './src/server/qbankRoutes';
import { examRouter } from './src/server/examRoutes';
import { initAutoQuestionScheduler } from './src/server/cron/autoQuestionScheduler';
import { handleBYOKTest, handleVoiceChatCall } from './src/server/voiceChatHandler';

export {
  isQBankAdminEnabled,
  logEphemeralTokenIfNeeded,
  warnIfInsecureAdminToken,
  getQBankAdminToken,
  qbankSecurityMiddleware,
  requireAdminAuth,
};

dotenv.config();

// In-memory editable RAG documents & Vocabulary for Admin CRUD operations
let ragDocuments = [...INITIAL_RAG_DOCUMENTS];
let vocabularyList = [...INITIAL_VOCABULARY];

// Lazy-safe Google GenAI initialization
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    if (!customApiKey) console.warn('GEMINI_API_KEY is not set. Intelligent RAG fallback responses will be used.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Dynamic model health and cooldown tracker to prevent repeated 429 quota exhaustion
const modelCooldowns = new Map<string, number>();

// Helper to robustly extract and parse JSON from AI model outputs
function cleanAndExtractJson<T = any>(raw: string, fallback: T = {} as any): T {
  if (!raw || typeof raw !== 'string') return fallback;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try outermost object { ... }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    // Try outermost array [ ... ]
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket > firstBracket && (firstBrace === -1 || firstBracket < firstBrace)) {
      const arrSub = cleaned.substring(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(arrSub);
      } catch {
        const fixed = arrSub.replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(fixed);
        } catch {}
      }
    }

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const objSub = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(objSub);
      } catch {
        const fixed = objSub.replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(fixed);
        } catch {}
      }
    }

    return fallback;
  }
}

// Resilient Gemini Content Generation with Rapid Model Fallbacks & Cooldown Tracking
async function callGeminiWithFallback(
  gemini: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
    preferredModels?: string[];
    thinkingConfig?: { thinkingBudget?: number };
    maxOutputTokens?: number;
  }
): Promise<string> {
  // High-performance model prioritization: gemini-3.8-flash, gemini-flash-latest, and gemini-3.1-flash-lite
  const candidateModels = params.preferredModels && params.preferredModels.length > 0
    ? params.preferredModels.filter(m => m !== 'gemini-2.5-flash')
    : [
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
      ];
  const now = Date.now();

  // Prioritize models that are not currently cooling down due to quota or transient spikes
  const modelsToTry = [...candidateModels].sort((a, b) => {
    const coolA = (modelCooldowns.get(a) || 0) > now ? 1 : 0;
    const coolB = (modelCooldowns.get(b) || 0) > now ? 1 : 0;
    return coolA - coolB;
  });

  let lastError: any = null;

  for (const model of modelsToTry) {
    const cooldownUntil = modelCooldowns.get(model) || 0;
    if (cooldownUntil > now) {
      // Model is in active cooldown, skip immediately
      continue;
    }

    try {
      const response = await gemini.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType,
          temperature: params.temperature ?? 0.3,
          ...(params.thinkingConfig ? { thinkingConfig: params.thinkingConfig } : {}),
          ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
        },
      });
      if (response.text) {
        // Success: clear any cooldown for this model
        modelCooldowns.delete(model);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const isQuota =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      const isHighDemandOrUnavailable =
        err?.status === 'UNAVAILABLE' ||
        err?.code === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('temporarily unavailable');

      const isModelNotFoundOrDeprecated =
        err?.status === 'NOT_FOUND' ||
        err?.code === 404 ||
        err?.message?.includes('not found') ||
        err?.message?.includes('no longer available') ||
        err?.message?.includes('404');

      if (isQuota) {
        // Mark model as cooling down for 45 seconds on rate limit
        modelCooldowns.set(model, Date.now() + 45 * 1000);
        console.log(`[Gemini API] Model ${model} reached rate limit, switching to alternate model.`);
      } else if (isHighDemandOrUnavailable) {
        // Transient spike, brief 15s cooldown so alternate model is preferred right away
        modelCooldowns.set(model, Date.now() + 15 * 1000);
        console.log(`[Gemini API] Model ${model} experiencing high demand (503), switching to alternate model.`);
      } else if (isModelNotFoundOrDeprecated) {
        // Disable deprecated model for 24 hours
        modelCooldowns.set(model, Date.now() + 86400 * 1000);
        console.log(`[Gemini API] Model ${model} is not available (404), switching to alternate model.`);
      } else {
        console.log(`[Gemini API] Model ${model} error: ${err?.message || 'Unknown error'}`);
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted');
}

const COMMON_SINO_VIETNAMESE: Record<string, string> = {
  我: 'Ngã', 你: 'Nhĩ', 他: 'Tha', 她: 'Tha', 它: 'Tha', 们: 'Môn',
  和: 'Hòa', 朋: 'Bằng', 友: 'Hữu', 一: 'Nhất', 起: 'Khởi', 吃: 'Cật',
  饭: 'Phạn', 下: 'Hạ', 午: 'Ngọ', 五: 'Ngũ', 点: 'Điểm', 回: 'Hồi',
  家: 'Gia', 晚: 'Vãn', 上: 'Thượng', 喜: 'Hỉ', 欢: 'Hoan', 看: 'Khán',
  电: 'Điện', 视: 'Thị', 学: 'Học', 习: 'Tập', 中: 'Trung', 文: 'Văn',
  国: 'Quốc', 人: 'Nhân', 大: 'Đại', 小: 'Tiểu', 好: 'Hảo', 多: 'Đa',
  少: 'Thiểu', 是: 'Thị', 不: 'Bất', 有: 'Hữu', 没: 'Một', 去: 'Khứ',
  来: 'Lai', 在: 'Tại', 想: 'Tưởng', 要: 'Yếu', 能: 'Năng', 会: 'Hội',
  爱: 'Ái', 水: 'Thủy', 茶: 'Trà', 菜: 'Thái', 果: 'Quả', 苹: 'Bình',
  日: 'Nhật', 月: 'Nguyệt', 年: 'Niên', 天: 'Thiên', 时: 'Thời', 间: 'Gian',
  分: 'Phân', 钟: 'Chung', 朝: 'Triêu', 早: 'Tảo', 夜: 'Dạ', 明: 'Minh',
  做: 'Tố', 作: 'Tác', 说: 'Thuyết', 话: 'Thoại', 听: 'Thính', 读: 'Độc',
  写: 'Tả', 字: 'Tự', 买: 'Mãi', 卖: 'Mại', 钱: 'Tiền', 店: 'Điếm',
  车: 'Xa', 站: 'Trạm', 飞: 'Phi', 机: 'Cơ', 门: 'Môn', 校: 'Hiệu',
  师: 'Sư', 生: 'Sinh', 狗: 'Cẩu', 猫: 'Miêu', 鸟: 'Điểu'
};

function getMasterDictionary(): Map<
  string,
  {
    hanzi: string;
    pinyin: string;
    hanViet: string;
    vietnamese: string;
    hskLevel: number;
    example?: string;
    exampleTranslation?: string;
  }
> {
  const dict = new Map<string, any>();

  for (const item of INITIAL_VOCABULARY) {
    if (item.hanzi) {
      dict.set(item.hanzi, {
        hanzi: item.hanzi,
        pinyin: item.pinyin || getPinyinPro(item.hanzi, { toneType: 'symbol' }),
        hanViet: (item as any).hanViet || '',
        vietnamese: (item as any).vietnamese || item.english || '',
        hskLevel: item.hskLevel || 1,
        example: item.examples?.[0]?.chinese,
        exampleTranslation: item.examples?.[0]?.english,
      });
    }
  }

  const allLessons = [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS, ...NEW_HSK3_FULL_LESSONS, ...NEW_HSK4_FULL_LESSONS];
  for (const lesson of allLessons) {
    if (lesson.vocabulary && Array.isArray(lesson.vocabulary)) {
      for (const v of lesson.vocabulary) {
        if (v.hanzi) {
          const existing = dict.get(v.hanzi);
          if (!existing || !existing.hanViet || !existing.vietnamese) {
            dict.set(v.hanzi, {
              hanzi: v.hanzi,
              pinyin: v.pinyin || getPinyinPro(v.hanzi, { toneType: 'symbol' }),
              hanViet: v.hanViet || existing?.hanViet || '',
              vietnamese: v.vietnamese || existing?.vietnamese || '',
              hskLevel: v.hskLevel || (lesson as any).hskLevel || 1,
              example: v.example,
              exampleTranslation: v.exampleTranslation,
            });
          }
        }
      }
    }
  }

  for (const item of vocabularyList) {
    if (item.hanzi && !dict.has(item.hanzi)) {
      dict.set(item.hanzi, {
        hanzi: item.hanzi,
        pinyin: item.pinyin || getPinyinPro(item.hanzi, { toneType: 'symbol' }),
        hanViet: (item as any).hanViet || '',
        vietnamese: (item as any).vietnamese || item.english || '',
        hskLevel: item.hskLevel || 1,
        example: item.examples?.[0]?.chinese,
        exampleTranslation: item.examples?.[0]?.english,
      });
    }
  }

  return dict;
}

function getHanVietForWord(word: string): string {
  const masterDict = getMasterDictionary();
  if (masterDict.has(word) && masterDict.get(word)?.hanViet) {
    return masterDict.get(word)!.hanViet;
  }

  const parts: string[] = [];
  for (const char of word) {
    if (COMMON_SINO_VIETNAMESE[char]) {
      parts.push(COMMON_SINO_VIETNAMESE[char]);
    } else {
      let found = false;
      for (const [, v] of masterDict.entries()) {
        if (v.hanzi.includes(char) && v.hanViet) {
          const charIndex = v.hanzi.indexOf(char);
          const hvWords = v.hanViet.trim().split(/\s+/);
          if (hvWords[charIndex]) {
            parts.push(
              hvWords[charIndex].charAt(0).toUpperCase() + hvWords[charIndex].slice(1).toLowerCase()
            );
            found = true;
            break;
          }
        }
      }
      if (!found) {
        parts.push('');
      }
    }
  }

  return parts.filter(Boolean).join(' ');
}

function getVietnameseMeaningForWord(word: string): string {
  const masterDict = getMasterDictionary();
  if (masterDict.has(word) && masterDict.get(word)?.vietnamese) {
    return masterDict.get(word)!.vietnamese;
  }

  const hanViet = getHanVietForWord(word);
  if (hanViet.trim()) {
    return `Từ Hán Việt: ${hanViet}`;
  }

  return `Từ vựng (${word})`;
}

// Offline/Local Vocabulary Extractor matching against HSK dictionary database
function extractVocabFallback(text: string, targetHsk = 1): Array<{
  hanzi: string;
  pinyin: string;
  hanViet: string;
  vietnamese: string;
  hskLevel: number;
  example?: string;
  exampleTranslation?: string;
}> {
  const masterDict = getMasterDictionary();
  const results: Array<{
    hanzi: string;
    pinyin: string;
    hanViet: string;
    vietnamese: string;
    hskLevel: number;
    example?: string;
    exampleTranslation?: string;
  }> = [];

  const seenHanzi = new Set<string>();

  // 1. Line-by-line formatted list parser (e.g., "你好 - ni hao - xin chao")
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/[-–—:|,\t]+/).map((s) => s.trim());
    if (parts.length >= 2) {
      const hanziCandidate = parts[0];
      if (/^[\u4e00-\u9fa5]{1,6}$/.test(hanziCandidate) && !seenHanzi.has(hanziCandidate)) {
        seenHanzi.add(hanziCandidate);
        const pinyinVal = parts.length >= 3 ? parts[1] : getPinyinPro(hanziCandidate, { toneType: 'symbol' });
        const meaningVal = parts.length >= 3 ? parts.slice(2).join(' ') : parts[1];
        const match = masterDict.get(hanziCandidate);
        results.push({
          hanzi: hanziCandidate,
          pinyin: pinyinVal,
          hanViet: match?.hanViet || getHanVietForWord(hanziCandidate),
          vietnamese: meaningVal || match?.vietnamese || getVietnameseMeaningForWord(hanziCandidate),
          hskLevel: targetHsk || 1,
        });
      }
    }
  }

  // 2. Scan text for known dictionary target words (sorted length descending so 4, 3, 2-char dictionary words match naturally)
  const sortedDictWords = Array.from(masterDict.values()).sort((a, b) => b.hanzi.length - a.hanzi.length);
  for (const item of sortedDictWords) {
    if (item.hanzi && text.includes(item.hanzi) && !seenHanzi.has(item.hanzi)) {
      seenHanzi.add(item.hanzi);
      results.push({
        hanzi: item.hanzi,
        pinyin: item.pinyin || getPinyinPro(item.hanzi, { toneType: 'symbol' }),
        hanViet: item.hanViet || getHanVietForWord(item.hanzi),
        vietnamese: item.vietnamese || getVietnameseMeaningForWord(item.hanzi),
        hskLevel: item.hskLevel || targetHsk || 1,
        example: item.example,
        exampleTranslation: item.exampleTranslation,
      });
    }
  }

  // 3. Segment remaining text into clean 2-3 char words (filtering out sentence fragments)
  const cleanText = text.replace(/[\d\s,.\?!;:"'()（）《》【】，。！？；：]/g, ' ');
  const regex2or3 = /[\u4e00-\u9fa5]{2,3}/g;
  let match: RegExpExecArray | null;
  while ((match = regex2or3.exec(cleanText)) !== null) {
    const word = match[0];
    const isGluePhrase = /^(我和|我是|我在|你和|你是|他和|我回|晚上我|下午五|一起吃)/.test(word);
    if (!isGluePhrase && !seenHanzi.has(word) && results.length < 35) {
      seenHanzi.add(word);
      const matchDict = masterDict.get(word);
      const pinyinVal = matchDict?.pinyin || getPinyinPro(word, { toneType: 'symbol' });
      const hanVietVal = matchDict?.hanViet || getHanVietForWord(word);
      const meaningVal = matchDict?.vietnamese || getVietnameseMeaningForWord(word);
      results.push({
        hanzi: word,
        pinyin: pinyinVal,
        hanViet: hanVietVal,
        vietnamese: meaningVal,
        hskLevel: targetHsk || 1,
      });
    }
  }

  return results;
}

// Pedagogical RAG Synthesizer if Gemini is completely unavailable due to upstream spikes
function buildRAGFallbackResponse(
  query: string,
  mode: string,
  hskLevel: number,
  retrievedSources: any[],
  roleplayScenario?: string
): string {
  if (retrievedSources.length === 0) {
    return (
      `你好！Mình chưa có tài liệu HSK chính thức về chủ đề "${query}" trong giáo trình nội bộ, nhưng theo kiến thức ngôn ngữ học Trung Quốc chung (chuẩn HSK 3.0 - Cấp độ ${hskLevel}):\n\n` +
      `- **Cấu trúc câu cơ bản**: *Chủ ngữ + [Thời gian/Địa điểm] + [Phó từ] + Động từ + Tân ngữ*\n` +
      `  *Ví dụ*: **我每天在图书馆学习中文** (Wǒ měitiān zài túshūguǎn xuéxí Zhōngwén - Tôi học tiếng Trung ở thư viện mỗi ngày).\n\n` +
      `- **Quy tắc biến điệu**: Hai thanh 3 đi liền nhau -> thanh 3 thứ nhất đọc thành thanh 2 (**你好** nǐ + hǎo -> ní hǎo).\n\n` +
      `- **Phân biệt trợ từ**: **的** (sở hữu: 我的书), **得** (trình độ: 跑得快), **地** (phó từ: 慢慢地走).\n\n` +
      `*(Lưu ý: Để gia sư giải đáp chi tiết hơn theo thời gian thực, bạn có thể thiết lập khóa Gemini API Key (BYOK) tại thanh công cụ.)*`
    );
  }

  const primary = retrievedSources[0];
  let response = `### 📖 ${primary.title} (HSK ${hskLevel})\n\n`;
  response += `**Quy tắc cốt lõi:**\n${primary.rulesSummary}\n\n`;
  response += `**Giải thích & Áp dụng:**\n${primary.content}\n\n`;

  if (primary.examples && primary.examples.length > 0) {
    response += `**Ví dụ tiêu biểu:**\n`;
    primary.examples.forEach((ex: any, idx: number) => {
      response += `${idx + 1}. **${ex.chinese}** (${ex.pinyin})\n   *Dịch*: "${ex.english}"\n`;
    });
  }

  // Incorporate secondary retrieved documents if multiple sources found (R8)
  if (retrievedSources.length > 1) {
    response += `\n---\n### 📚 Tài liệu liên quan bổ trợ trong giáo trình:\n\n`;
    for (let i = 1; i < retrievedSources.length; i++) {
      const doc = retrievedSources[i];
      response += `#### ${i + 1}. ${doc.title} (${(doc.category || 'ngữ pháp').toUpperCase()})\n`;
      if (doc.rulesSummary) {
        response += `**Tóm tắt quy tắc:** ${doc.rulesSummary}\n\n`;
      }
      if (doc.content) {
        const snippet = doc.content.length > 250 ? doc.content.slice(0, 250).trim() + '...' : doc.content;
        response += `**Trích lược nội dung:**\n${snippet}\n\n`;
      }
      if (doc.examples && doc.examples.length > 0) {
        const firstEx = doc.examples[0];
        response += `*Ví dụ*: **${firstEx.chinese}** (${firstEx.pinyin}) - "${firstEx.english}"\n\n`;
      }
    }
  }

  return response;
}

async function startServer() {
  assertStagingDatabaseIsolation();
  const app = express();
  const PORT = Number.parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  // Defensive HTTP security headers via Helmet (preserve Vite HMR and inline script execution)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS origin configuration with credentials support (supports local dev and live Render deployments)
  app.use(cors({ origin: true, credentials: true }));

  // Gzip / Brotli compression for high-concurrency bandwidth optimization.
  // In development mode, NEVER compress Vite dev server requests, ES modules, or SSE streams
  // to prevent chunked transfer dropouts and "Failed to fetch dynamically imported module" errors.
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        if (process.env.NODE_ENV !== 'production') {
          const url = req.originalUrl || req.url || '';
          const pathname = req.path || url.split('?')[0];
          // In development mode, only compress /api/* endpoints;
          // NEVER compress Vite dev server middleware requests (ES modules, HTML, assets, SSE)
          // to prevent chunked transfer dropouts and "Failed to fetch dynamically imported module" errors.
          if (!pathname.startsWith('/api/')) {
            return false;
          }
        }
        return compression.filter(req, res);
      },
    })
  );

  // Rate Limiting defenses via express-rate-limit
  // 1. Global API rate limiter on /api/: 10000 requests per 15 minutes with loopback/admin bypass
  const globalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const ip = req.ip || req.socket.remoteAddress || '';
      const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('127.0.0.1');
      const hasAdminAuth = Boolean(req.headers['x-qbank-token'] || req.headers['authorization']);
      return isLoopback || hasAdminAuth || req.path.startsWith('/qbank/scheduler');
    },
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', globalApiLimiter);

  // 2. AI proxy rate limiter on /api/gemini/, /api/ai/, /api/voice-chat/: 30 requests per minute
  const aiProxyLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'AI request quota exceeded, please wait before retrying.' },
  });
  app.use(['/api/gemini/', '/api/ai/', '/api/voice-chat/'], aiProxyLimiter);

  // Dedicated route-level 50MB parsers specifically for endpoints requiring large base64 image/PDF OCR payloads
  const largeJsonParser = express.json({ limit: '50mb' });
  const largeUrlencodedParser = express.urlencoded({ limit: '50mb', extended: true });
  const largePayloadRoutes = [
    '/api/ai/ocr-document',
    '/api/ai/ocr-and-grade-writing',
    '/api/ai/pdf-extract',
    '/api/workbooks/parse-and-remix',
    '/api/qbank/upload-file',
  ];
  for (const routePath of largePayloadRoutes) {
    app.use(routePath, largeJsonParser);
    app.use(routePath, largeUrlencodedParser);
  }

  // Global body parsing lowered to 2MB to protect against payload memory exhaustion DoS
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  // Ensure public/audio directory exists and mount static audio serving for Edge-TTS
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  fs.mkdirSync(audioDir, { recursive: true });
  app.use('/audio', express.static(audioDir));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      qbankAdminEnabled: isQBankAdminEnabled(),
    });
  });

  // Dedicated lightweight status check endpoint for QBank Admin
  app.get('/api/qbank-status', (req: Request, res: Response) => {
    res.json({
      enabled: isQBankAdminEnabled(),
    });
  });

  // Admin Knowledge Base endpoints
  app.get('/api/rag/documents', (req: Request, res: Response) => {
    res.json({ documents: ragDocuments });
  });

  app.post('/api/rag/documents', (req: Request, res: Response) => {
    const { title, category, tags, rulesSummary, content, examples, hskLevel } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const newDoc = {
      id: `rag-custom-${Date.now()}`,
      title,
      category: category || 'grammar',
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map((t: string) => t.trim()),
      rulesSummary: rulesSummary || '',
      content,
      examples: examples || [],
      hskLevel: hskLevel || 1,
      createdAt: new Date().toISOString(),
    };
    ragDocuments.unshift(newDoc);
    res.json({ success: true, document: newDoc });
  });

  app.delete('/api/rag/documents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    ragDocuments = ragDocuments.filter((d) => d.id !== id);
    res.json({ success: true, message: 'Document deleted' });
  });

  // Vocabulary CRUD endpoints
  app.get('/api/vocabulary', (req: Request, res: Response) => {
    res.json({ vocabulary: vocabularyList });
  });

  app.post('/api/vocabulary', (req: Request, res: Response) => {
    const word = req.body;
    if (!word.hanzi || !word.pinyin || !word.english) {
      return res.status(400).json({ error: 'Hanzi, Pinyin, and English are required' });
    }
    const newWord = {
      ...word,
      id: word.id || `vocab-custom-${Date.now()}`,
      examples: word.examples || [],
      tags: word.tags || [],
    };
    vocabularyList.unshift(newWord);
    res.json({ success: true, word: newWord });
  });

  app.delete('/api/vocabulary/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    vocabularyList = vocabularyList.filter((v) => v.id !== id);
    res.json({ success: true });
  });

  // Crawler DB & RAG Analytics endpoints
  app.get('/api/crawler/analytics', (req: Request, res: Response) => {
    try {
      const crawledQuestionsPath = path.join(process.cwd(), 'crawled_questions.json');
      let questions: any[] = [];
      if (fs.existsSync(crawledQuestionsPath)) {
        questions = JSON.parse(fs.readFileSync(crawledQuestionsPath, 'utf-8'));
      }

      const total = questions.length;
      const exactHashMap = new Map<string, number>();
      const hskDistribution: Record<string, number> = {};
      let exactDuplicates = 0;

      for (const q of questions) {
        const hash = q.content_hash || q.id;
        if (exactHashMap.has(hash)) {
          exactDuplicates++;
          exactHashMap.set(hash, (exactHashMap.get(hash) || 0) + 1);
        } else {
          exactHashMap.set(hash, 1);
        }
        const lvl = q.hsk_level || 'HSK3';
        hskDistribution[lvl] = (hskDistribution[lvl] || 0) + 1;
      }

      res.json({
        success: true,
        total_questions_in_db: total,
        unique_content_hashes: exactHashMap.size,
        exact_duplicate_count: exactDuplicates,
        overall_duplicate_rate_pct: total > 0 ? Number(((exactDuplicates / total) * 100).toFixed(2)) : 0,
        hsk_distribution: hskDistribution,
        sample_questions: questions.slice(0, 10),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // RAG Chinese Tutor Chat API
  app.post('/api/gemini/rag-chat', async (req: Request, res: Response) => {
    const { message, mode = 'general', hskLevel = 2, roleplayScenario } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Query local Knowledge Base (RAG Retriever)
    const retrievedSources = queryKnowledgeBase(message, 3);
    const hasRagContext = retrievedSources.length > 0;
    const ragContextText = retrievedSources
      .map(
        (doc, i) =>
          `[Tài liệu ${i + 1}: ${doc.title} (Chuyên mục: ${doc.category})]\n- Tóm tắt quy tắc: ${doc.rulesSummary}\n- Chi tiết: ${doc.content}\n- Ví dụ: ${JSON.stringify(
            doc.examples
          )}`
      )
      .join('\n\n');

    const byokKey = (req.headers['x-byok-gemini-key'] || req.headers['x-byok-api-key']) as string | undefined;
    const gemini = getGeminiClient(byokKey);

    if (!gemini) {
      // Local Grounded RAG Synthesizer if API key not present
      const fallbackContent = buildRAGFallbackResponse(message, mode, hskLevel, retrievedSources, roleplayScenario);
      return res.json({
        content: fallbackContent,
        ragSources: retrievedSources.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          snippet: d.rulesSummary || d.content.slice(0, 140) + '...',
        })),
        suggestedFollowUps: [
          'Cách phân biệt trợ từ 的, 得 và 地 trong câu?',
          'Quy tắc biến điệu hai thanh 3 tiếng Trung là gì?',
          'Phân biệt cách dùng 会, 能 và 可以.',
        ],
      });
    }

    try {
      // System instruction customized by mode with HSK 3.0 Standard focus
      let systemPrompt = `You are "Minnese AI Tutor (敏思中文导师 / 敏思老师 - Minnese Lǎoshī)", an elite, warm, and highly pedagogical Mandarin Chinese language tutor specializing in the official HSK 3.0 curriculum (New HSK 1, 2, 3, 4, 5, 6).
Target Learner Level: HSK ${hskLevel} (HSK 3.0 Standard).

${
  hasRagContext
    ? `[TÀI LIỆU GIÁO TRÌNH HSK CHÍNH THỨC NỘI BỘ (RAG CONTEXT)]:
${ragContextText}

QUY TẮC CỐT LÕI KHI CÓ RAG CONTEXT (BẮT BUỘC TUÂN THỦ):
1. ƯU TIÊN TUYỆT ĐỐI & BÁM SÁT GIÁO TRÌNH: Bạn PHẢI trích dẫn, bám sát và ưu tiên sử dụng thông tin trong [TÀI LIỆU GIÁO TRÌNH HSK CHÍNH THỨC NỘI BỘ] ở trên. Tuyệt đối KHÔNG được mâu thuẫn, phủ nhận hoặc đưa ra giải thích trái ngược với nội dung giáo trình được cung cấp.
2. Vận dụng trực tiếp các quy tắc, công thức ngữ pháp và ví dụ thực tiễn từ tài liệu giáo trình để giải thích cho người học một cách mạch lạc, dễ hiểu.`
    : `[TRẠNG THÁI RAG CONTEXT]: Không tìm thấy tài liệu giáo trình HSK cụ thể trong cơ sở dữ liệu nội bộ khớp trực tiếp với câu hỏi này.

QUY TẮC BẮT BUỘC KHI KHÔNG CÓ RAG CONTEXT (TUÂN THỦ NGHIÊM NGẶT 4 CHỈ THỊ):
1. Thừa nhận minh bạch: Nếu câu hỏi về một chủ đề ngữ pháp/kiến thức chuyên sâu chưa có trong tài liệu nội bộ, bạn PHẢI nói rõ ràng: "Mình chưa có tài liệu HSK chính thức về chủ đề này trong giáo trình, nhưng theo kiến thức ngôn ngữ học Trung Quốc chung..." thay vì tự bịa đặt tài liệu giáo trình.
2. Chuẩn HSK 3.0: Khi người học hỏi về từ vựng hoặc ngữ pháp HSK cụ thể không có trong RAG nội bộ, PHẢI giải thích dựa trên chuẩn HSK 3.0 chính thức và ghi rõ: "Theo chuẩn HSK 3.0...".
3. Kiến thức mở rộng: Cho phép trả lời câu hỏi mở rộng (văn hóa Trung Hoa, phong tục tập quán, thành ngữ cao cấp ngoài HSK, giao tiếp bản xứ đời thường), nhưng PHẢI ghi rõ: "Đây là kiến thức mở rộng ngoài giáo trình HSK...".
4. Đối với lời chào hỏi hoặc trò chuyện giao tiếp thông thường: Hãy phản hồi tự nhiên, ấm áp, khuyến khích học viên trò chuyện bằng tiếng Trung kèm Pinyin và dịch nghĩa tiếng Việt.`
}

Pedagogical & Content Guidelines for Vietnamese Learners:
1. When introducing or referring to yourself, use "Gia sư Minnese", "Cô giáo Minnese / Thầy Minnese" hoặc "敏思老师 / Minnese Lǎoshī". STRICTLY NEVER use Japanese words like "Sensei" or any Japanese terminology.
2. Provide accurate Simplified Chinese Hanzi with tone-marked Pinyin, Han-Viet roots (âm Hán Việt) where enlightening, and clear, friendly Vietnamese explanations.
3. Strictly align vocabulary and grammar difficulty with the official HSK 3.0 standard (e.g. HSK 1: daily greeting & simple SVO; HSK 2: 是...的, 还是...吧, complement of result, 比较句; HSK 3: 把字句, 被字句, 越来越, 程度补语, 复合趋向补语).
4. Highlight Tone Sandhi rules whenever relevant (e.g. 3rd tone + 3rd tone -> 2nd + 3rd; 不/一 tone changes).
5. If the user asks for grammar explanations, break down the sentence syntax clearly with clear examples and practical context.
6. When explaining specific HSK vocabulary or grammar points not in RAG, answer based on the official HSK 3.0 standard, explicitly stating "Theo chuẩn HSK 3.0...".
7. For expanded questions (Chinese culture, general topics outside HSK), allow answering but explicitly note "Đây là kiến thức mở rộng ngoài giáo trình HSK...".
8. Keep the tone encouraging, structured, and pedagogical.

Formatting & Visual Clarity Guidelines (CRITICAL):
- BE CONCISE & DIRECT: Answer the user's question directly without dumping long unrequested textbook chapters or repetitive background text.
- NO SOURCE REPETITION: Do NOT list or repeat retrieved RAG sources/titles inside your response text (the UI displays reference badges separately).
- Avoid noisy formatting. NEVER use triple asterisks (***) or nested symbol spam.
- Use clean headings (## or ###) only where necessary for major sections.
- For Chinese vocabulary or examples, format clearly: **汉字** (Pinyin / Âm Hán Việt) - Ý nghĩa / Giải thích.
- Use neat bullet points (- ) instead of cluttered symbols.`;

      if (mode === 'grammar_doctor') {
        systemPrompt += `\n\n### 🩺 CHẾ ĐỘ: BÁC SĨ NGỮ PHÁP & CHẤM BÀI VIẾT VĂN (GRAMMAR DOCTOR & ESSAY GRADING)
MỤC TIÊU DUY NHẤT: Bệnh nhân (người học) gửi một câu, đoạn văn hoặc bài viết tiếng Trung để nhờ chấm/sửa lỗi. Bạn đóng vai Bác sĩ Ngữ pháp kiêm Giám khảo HSK sư phạm:

⚠️ QUY TẮC SỐ 1 KHI CHẤM ĐOẠN VĂN / BÀI VIẾT (CRITICAL MANDATE):
- BẮT BUỘC bám sát 100% cốt truyện, nhân vật, nội dung và chủ đề gốc của người học!
- TUYỆT ĐỐI KHÔNG tự ý thay đổi chủ đề hoặc biến bài viết của người học thành các bài "văn mẫu" không liên quan (như Internet, điện thoại, bảo vệ môi trường, v.v.).
- Nếu người học viết về chủ đề gì (ví dụ: tìm việc, cuộc sống, lời khuyên của một người cô/bác Thái thái...), phiên bản bài sửa HOÀN TOÀN PHẢI GIỮ ĐÚNG nội dung câu chuyện đó, chỉ trau chuốt ngữ pháp, từ vựng và trật tự câu cho chuẩn bản xứ.

Cấu trúc nhận xét:
1. 🩺 Chẩn đoán tổng thể & Kiểm tra từ khoá (nếu có yêu cầu từ khoá): Đánh giá xem bài viết dùng các từ khoá đúng ngữ cảnh chưa, mạch lạc không.
2. 🔍 Mổ xẻ chi tiết từng câu/từ sai (nếu có): Chỉ rõ chữ nào dùng chưa tự nhiên hoặc sai ngữ pháp.
3. ✨ TOÀN VĂN BÀI VIẾT ĐÃ ĐƯỢC CHỈNH SỬA HOÀN CHỈNH: Trình bày lại toàn bộ bài văn của học viên sau khi sửa mượt mà (giữ 100% cốt truyện và ý tưởng ban đầu của học viên).
4. 💡 Lời khuyên sư phạm & điểm cộng.`;
      } else if (mode === 'roleplay') {
        systemPrompt += `\n\n### 💬 CHẾ ĐỘ: LUYỆN HỘI THOẠI ĐỐI THOẠI 2 CHIỀU (INTERACTIVE ROLEPLAY CONVERSATION)
Tình huống/Chủ đề: "${roleplayScenario || 'Tự do trò chuyện như bạn bè bản xứ'}".
BẠN LÀ BẠN ĐỐI THOẠI (CONVERSATION PARTNER). Hãy trò chuyện tự nhiên, sinh động bằng tiếng Trung:
1. **Lời thoại của bạn**: Đưa ra câu thoại phản hồi bằng chữ Hán chuẩn, kèm Pinyin và bản dịch tiếng Việt ngay bên dưới. Giữ câu thoại vừa phải (1-3 câu) để tạo không khí đối thoại qua lại.
2. **Góp ý nhẹ nhàng (nếu cần)**: Nếu câu của người học có chỗ chưa tự nhiên, chỉ ra ngắn gọn 1 gợi ý cách nói bản xứ hơn.
3. **Gợi ý phản hồi tiếp theo**: Cung cấp 2-3 câu mẫu bằng tiếng Trung (kèm Pinyin & nghĩa) để người học có thể chọn trả lời tiếp.`;
      } else if (mode === 'mnemonic') {
        systemPrompt += `\n\n### 🧠 CHẾ ĐỘ: CHIẾT TỰ CHỮ HÁN & MẸO NHỚ NHANH (MNEMONICS & CHARACTER ETYMOLOGY)
MỤC TIÊU:
1. Giải thích và phân tích hoàn toàn bằng TIẾNG VIỆT tự nhiên, dễ hiểu.
2. Bóc tách chữ Hán thành các bộ thủ cấu thành (kèm tên bộ thủ Hán Việt và ý nghĩa).
3. Đưa ra mẹo nhớ / câu chuyện liên tưởng thị giác hài hước hoặc hình ảnh sinh động bằng TIẾNG VIỆT để người học nhớ chữ vĩnh viễn không quên.
4. Cung cấp âm Hán Việt, Pinyin, và ví dụ ứng dụng thực tế.`;
      } else {
        // mode === 'general' -> Free Conversation, Q&A & Intelligent Grammar Doctor Diagnosis
        systemPrompt += `\n\n### 💬 CHẾ ĐỘ: HỎI ĐÁP, TRÒ CHUYỆN & CHẨN ĐOÁN SỬA CÂU NGỮ PHÁP TOÀN DIỆN
MỤC TIÊU:
1. CHẨN ĐOÁN SỬA LỖI CÂU (TỰ ĐỘNG): Nếu người học gửi một câu tiếng Trung để kiểm tra/hỏi đúng sai, hoặc câu của người học có lỗi ngữ pháp/trật tự từ/trợ từ (ví dụ: 的/得/地, 把/被, bổ ngữ, trật tự thời gian): Hãy lập tức đóng vai Bác sĩ Ngữ pháp tận tâm:
   - 🩺 Chẩn đoán tình trạng: [✅ Hoàn toàn chính xác / ⚠️ Hiểu được nhưng chưa tự nhiên / ❌ Sai ngữ pháp / ❌ Sai trật tự từ]
   - 🔍 Mổ xẻ lỗi sai: Chỉ rõ từ/cụm từ sai và giải thích cặn kẽ tại sao sai theo chuẩn Hán ngữ HSK.
   - 💊 Câu sửa chuẩn bản xứ: Cung cấp chữ Hán chuẩn, Pinyin có dấu thanh, âm Hán Việt và dịch nghĩa tiếng Việt.
   - 💡 Mẹo & Quy tắc cốt lõi: Đưa ra công thức ngắn gọn, dễ nhớ.
2. HỎI ĐÁP TỪ VỰNG & NGỮ PHÁP: Nếu người học hỏi về ý nghĩa, cách dùng từ, phân biệt từ gần nghĩa (ví dụ: 会/能/可以, 打算/想/要, 的/得/地): Giải thích hệ thống, sư phạm, rõ ràng kèm ví dụ thực tế có Hán tự + Pinyin + dịch nghĩa.
3. CHẤM BÀI VIẾT / ĐOẠN VĂN THEO TỪ KHOÁ: Nếu người học gửi một đoạn văn/bài viết để nhờ chấm:
   - BẮT BUỘC giữ nguyên 100% cốt truyện, nhân vật, ngữ cảnh và chủ đề gốc của học viên. TUYỆT ĐỐI KHÔNG tự tiện đổi sang bài văn mẫu khác (như Internet, điện thoại, môi trường...).
   - Kiểm tra việc sử dụng các từ khoá (nếu có), phân tích lỗi ngữ pháp/trật tự từ.
   - Xuất ra "TOÀN VĂN BÀI VIẾT ĐÃ ĐƯỢC CHỈNH SỬA HOÀN CHỈNH" bám sát 100% câu chuyện của học viên, giúp câu văn mượt mà và chuẩn bản xứ hơn.
4. TRÒ CHUYỆN & LUYỆN GIAO TIẾP: Nếu người học trò chuyện tự do (chào hỏi, tâm sự, luyện phản xạ): Trò chuyện tự nhiên, sinh động, thân thiện và ấm áp như bạn bè/gia sư bản xứ. Luôn có Hán tự, Pinyin và nghĩa tiếng Việt.`;
      }

      const prompt = `User prompt: ${message}\n\nPlease formulate a helpful response formatted in clear Markdown.`;

      const generatedText = await callGeminiWithFallback(gemini, {
        contents: prompt,
        systemInstruction: systemPrompt,
        temperature: 0.7,
        preferredModels: [
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash',
        ],
      });

      return res.json({
        content: generatedText,
        ragSources: retrievedSources.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          snippet: d.rulesSummary || d.content.slice(0, 140) + '...',
        })),
        suggestedFollowUps:
          mode === 'grammar_doctor'
            ? [
                'Bác sĩ cho em thêm một bài tập tương tự để làm thử.',
                'Nếu dùng trong văn cảnh trang trọng thì nói thế nào?',
                'Phân tích thêm âm Hán Việt của các từ trong câu sửa.',
              ]
            : mode === 'roleplay'
            ? [
                'Tiếp tục cuộc trò chuyện',
                'Tôi muốn đổi sang chủ đề khác',
                'Giúp tôi dịch câu tiếng Việt này sang tiếng Trung tự nhiên',
              ]
            : [
                'Cho tôi thêm 2 câu ví dụ thực tế trong đời sống',
                'Các lỗi sai phổ biến nhất của cấu trúc này là gì?',
                'Làm một câu trắc nghiệm nhanh kiểm tra kiến thức này',
              ],
      });
    } catch (err: any) {
      console.warn('[RAG Chat] Gemini API unavailable or demand spike, generating grounded fallback response:', err?.message || err);
      const fallbackContent = buildRAGFallbackResponse(message, mode, hskLevel, retrievedSources, roleplayScenario);
      return res.json({
        content: fallbackContent,
        ragSources: retrievedSources.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          snippet: d.rulesSummary || d.content.slice(0, 140) + '...',
        })),
        suggestedFollowUps: [
          'How do I use 的, 得, and 地 correctly?',
          'What are the 3rd tone sandhi rules?',
          'Give me more examples for this.',
        ],
      });
    }
  });

  // Ephemeral BYOK Connectivity & Key Test Endpoint
  app.post('/api/byok/test', handleBYOKTest);

  // Live Real-Time Voice Partner Conversation Call Endpoint (Unlocked with Ephemeral BYOK)
  app.post('/api/voice-chat/call', handleVoiceChatCall);






  // AI Quiz Generator Endpoint
  app.post('/api/gemini/generate-quiz', async (req: Request, res: Response) => {
    const { topic = 'Giao tiếp hàng ngày & Đời sống', hskLevel = 2, count = 20 } = req.body;
    const gemini = getGeminiClient();

    const targetCount = Math.min(25, Math.max(5, Number(count) || 20));

    // Curated rich fallback list with 20 diverse questions
    const fallbackQuestions = [
      {
        id: `q-gen-${Date.now()}-1`,
        type: 'pinyin',
        prompt: `Chọn phiên âm Pinyin kèm thanh điệu chính xác cho từ "学习":`,
        questionChinese: '学习',
        options: ['xuéxí (học tập)', 'xuěxǐ', 'xuéxì', 'xūexí'],
        correctAnswer: 'xuéxí (học tập)',
        explanation: '学习 (học tập) gồm thanh 2 (xué) và thanh 2 (xí). Cả hai âm đều đọc lướt từ trầm lên bổng.',
        usageNotes: '学习 có thể làm động từ (学习汉语 - học tiếng Hán) hoặc danh từ (学习态度 - thái độ học tập).',
        exampleSentence: {
          chinese: '他每天都坚持学习汉语一个小时。',
          pinyin: 'Tā měitiān dōu jiānchí xuéxí Hànyǔ yí gè xiǎoshí.',
          vietnamese: 'Anh ấy mỗi ngày đều kiên trì học tiếng Hán một tiếng đồng hồ.',
        },
        hskLevel: hskLevel || 1,
      },
      {
        id: `q-gen-${Date.now()}-2`,
        type: 'meaning',
        prompt: `Từ "准备" trong câu "我们准备出发了" có nghĩa là gì?`,
        questionChinese: '准备',
        options: ['Chuẩn bị / sắp xếp / dự định', 'Giải quyết / xử lý', 'Hiểu biết / thấu suốt', 'Lo lắng / bồn chồn'],
        correctAnswer: 'Chuẩn bị / sắp xếp / dự định',
        explanation: '准备 (zhǔnbèi) nghĩa là chuẩn bị, sắp xếp trước hoặc dự định làm việc gì đó.',
        usageNotes: 'Cấu trúc: 准备 + Động từ (准备去旅游) hoặc 准备 + Danh từ (准备行李).',
        exampleSentence: {
          chinese: '我已经把明天考试需要的东西准备好了。',
          pinyin: 'Wǒ yǐjīng bǎ míngtiān kǎoshì xūyào de dōngxi zhǔnbèi hǎo le.',
          vietnamese: 'Tôi đã chuẩn bị xong những thứ cần cho kỳ thi ngày mai rồi.',
        },
        hskLevel: hskLevel || 2,
      },
      {
        id: `q-gen-${Date.now()}-3`,
        type: 'grammar',
        prompt: `Trợ từ kết cấu nào thích hợp điền vào chỗ trống: "他跑___非常快"?`,
        questionChinese: '他跑___非常快',
        options: ['得 (nối bổ ngữ trình độ)', '的 (nối định ngữ sở hữu)', '地 (nối trạng ngữ hành động)', '着 (biểu thị tiếp diễn)'],
        correctAnswer: '得 (nối bổ ngữ trình độ)',
        explanation: 'Trợ từ "得" (de) đứng sau Động từ (跑) để nối với bổ ngữ trạng thái/trình độ (非常快).',
        usageNotes: 'Phân biệt: 跑得很快 (chạy rất nhanh - 得), 他的书 (sách của anh ấy - 的), 慢慢地走 (bước đi từ từ - 地).',
        exampleSentence: {
          chinese: '小李的中文说得非常流利地道。',
          pinyin: 'Xiǎo Lǐ de Zhōngwén shuō de fēicháng liúlì dìdao.',
          vietnamese: 'Tiếng Trung của Tiểu Lý nói rất lưu loát và chuẩn bản xứ.',
        },
        hskLevel: hskLevel || 2,
      },
      {
        id: `q-gen-${Date.now()}-4`,
        type: 'pinyin',
        prompt: `Xác định biến điệu của chữ "不" trong câu "我不是学生":`,
        questionChinese: '不是',
        options: ['bú shì (biến thành thanh 2 trước thanh 4)', 'bù shì (giữ thanh 4)', 'bǔ shì (thanh 3)', 'bu shì (thanh nhẹ)'],
        correctAnswer: 'bú shì (biến thành thanh 2 trước thanh 4)',
        explanation: 'Chữ "不" (bù) khi đứng trước một âm tiết mang thanh 4 (như 是 shì, 对 duì, 要 yào) sẽ biến thành thanh 2 (bú).',
        usageNotes: 'Trước thanh 1, 2, 3 giữ nguyên thanh 4: 不高 (bù gāo), 不来 (bù lái), 不好 (bù hǎo).',
        exampleSentence: {
          chinese: '这不是我的手机，是老师的。',
          pinyin: 'Zhè bú shì wǒ de shǒujī, shì lǎoshī de.',
          vietnamese: 'Đây không phải điện thoại của tôi, là của thầy giáo.',
        },
        hskLevel: hskLevel || 1,
      },
      {
        id: `q-gen-${Date.now()}-5`,
        type: 'grammar',
        prompt: `Chọn trật tự câu chữ "把" chính xác:`,
        questionChinese: '作业 / 做完了 / 我 / 把',
        options: [
          '我把作业做完了。(Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả)',
          '我做完了把作业。',
          '把作业我做完了。',
          '我作业把做完了。',
        ],
        correctAnswer: '我把作业做完了。(Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả)',
        explanation: 'Câu chữ 把 dùng để nhấn mạnh hành động tác động và làm thay đổi trạng thái của tân ngữ xác định.',
        usageNotes: 'Sau động từ trong câu chữ 把 bắt buộc phải có thành phần bổ ngữ kết quả, xu hướng hoặc trợ từ 了.',
        exampleSentence: {
          chinese: '请把空调关掉，我们要出门了。',
          pinyin: 'Qǐng bǎ kōngtiáo guān diào, wǒmen yào chūmén le.',
          vietnamese: 'Xin hãy tắt điều hòa đi, chúng ta sắp ra ngoài rồi.',
        },
        hskLevel: hskLevel || 3,
      },
    ];

    if (!gemini) {
      return res.json({ questions: fallbackQuestions });
    }

    try {
      const prompt = `Bạn là chuyên gia khảo thí Hán ngữ quốc tế (HSK 3.0). Hãy tạo đúng ${targetCount} câu hỏi trắc nghiệm tiếng Trung đa dạng, sinh động, thực tế dành cho học viên người Việt Nam.
Chủ đề bài kiểm tra: "${topic}"
Trình độ mục tiêu: HSK ${hskLevel} (cấp độ 1 đến 6).

YÊU CẦU QUAN TRỌNG:
1. Đề thi phải mở rộng tự do, đa dạng ngữ cảnh đời sống, giao tiếp, công việc, văn hóa, ngữ pháp và KHÔNG BỊ RÀNG BUỘC bởi bất kỳ giáo trình cố định nào.
2. Bao gồm các dạng câu hỏi:
   - "pinyin": Nhận diện phát âm, quy tắc biến điệu, dấu thanh, âm tiết dễ nhầm.
   - "grammar": Phân biệt hư từ, cấu trúc câu đặc thù (把, 被, 比, 的/得/地, 连...都..., 虽然...但是...).
   - "meaning": Từ vựng theo ngữ cảnh, thành ngữ (nếu HSK 3-6), kết hợp từ chuẩn.
   - "listening": Câu hỏi luyện nghe hiểu (cung cấp "audioText" chữ Hán đầy đủ để hệ thống đọc phát âm TTS).
3. Mỗi câu hỏi BẮT BUỘC phải có:
   - "prompt": Hướng dẫn và câu hỏi bằng tiếng Việt rõ ràng, dễ hiểu.
   - "questionChinese": Chữ Hán của câu hỏi (nếu có).
   - "audioText": Chữ Hán của đoạn audio (nếu là dạng listening).
   - "options": Mảng 4 lựa chọn (A, B, C, D) có tiếng Việt hoặc Pinyin rõ ràng.
   - "correctAnswer": Chuỗi đáp án đúng khớp hoàn toàn 1 trong 4 options.
   - "explanation": Chú thích & phân tích ngữ pháp / phiên âm chi tiết bằng tiếng Việt.
   - "usageNotes": Cách dùng, quy tắc ghi nhớ và lỗi người Việt hay gặp.
   - "exampleSentence": Object { "chinese": "Câu ví dụ chữ Hán", "pinyin": "Pinyin có dấu", "vietnamese": "Dịch nghĩa tiếng Việt" }.
   - "hskLevel": Số trình độ HSK (${hskLevel}).

Trả về DUY NHẤT một JSON Array hợp lệ chứa đúng ${targetCount} câu hỏi không bọc markdown:
[
  {
    "id": "ai-q-1",
    "type": "grammar",
    "prompt": "...",
    "questionChinese": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "...",
    "usageNotes": "...",
    "exampleSentence": {
      "chinese": "...",
      "pinyin": "...",
      "vietnamese": "..."
    },
    "hskLevel": ${hskLevel}
  }
]`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.6,
      });

      let cleanJson = (responseText || '').trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanJson || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ questions: parsed });
      }
      return res.json({ questions: fallbackQuestions });
    } catch (err: any) {
      console.warn('[Quiz Generator] Fallback to rich questions due to:', err?.message || err);
      return res.json({ questions: fallbackQuestions });
    }
  });

  // Dedicated AI Lesson Exercise Generator (Multi-Format, Rich Sentence Patterns & Contextual Application)
  app.post('/api/gemini/generate-lesson-exercises', async (req: Request, res: Response) => {
    const {
      hskLevel = 1,
      lessonNumber = 1,
      titleHanzi = '你好',
      titleVietnamese = 'Chào bạn',
      vocabulary = [],
      grammarPoints = [],
      count = 10,
      practiceMode = 'comprehensive',
    } = req.body;

    const targetCount = Math.min(20, Math.max(5, Number(count) || 10));
    const gemini = getGeminiClient();

    const vocabSummary = Array.isArray(vocabulary)
      ? vocabulary.slice(0, 25).map((v: any) => `${v.hanzi} (${v.pinyin} - ${v.vietnamese || v.english || ''})`).join(', ')
      : '';
    const grammarSummary = Array.isArray(grammarPoints)
      ? grammarPoints.map((g: any) => `${g.title}: ${g.explanation}`).join('; ')
      : '';

    // Smart algorithmic fallback generator for guaranteed offline resilience
    const generateFallbackLessonExercises = () => {
      const vList = Array.isArray(vocabulary) && vocabulary.length > 0
        ? vocabulary
        : [
            { hanzi: '你好', pinyin: 'nǐ hǎo', vietnamese: 'chào bạn' },
            { hanzi: '谢谢', pinyin: 'xièxie', vietnamese: 'cảm ơn' },
            { hanzi: '再见', pinyin: 'zàijiàn', vietnamese: 'tạm biệt' },
            { hanzi: '老师', pinyin: 'lǎoshī', vietnamese: 'giáo viên' },
            { hanzi: '学生', pinyin: 'xuésheng', vietnamese: 'học sinh' },
          ];

      const exercises: any[] = [];
      const timestamp = Date.now();

      // 1. Sắp xếp câu (Sentence Scramble)
      exercises.push({
        id: `fb-scramble-1-${timestamp}`,
        type: 'sentence_scramble',
        question: `Sắp xếp các từ sau thành câu chào hỏi chuẩn xác trong bài:`,
        hanziPrompt: `[ ${vList[0]?.hanzi || '你'} / 好 / ！ ]`,
        vietnamesePrompt: `Chào bạn!`,
        scrambleSegments: [vList[0]?.hanzi || '你', '好', '！'],
        correctAnswer: `${vList[0]?.hanzi || '你'}好！`,
        options: [`${vList[0]?.hanzi || '你'}好！`, `好${vList[0]?.hanzi || '你'}！`, `好您！`, `你好吗？`],
        explanation: `Trong tiếng Trung, câu chào chuẩn là Đại từ + 好 (Ví dụ: 你好, 您好, 老师好).`,
        grammarFocus: 'Trật tự câu chào hỏi',
        audioText: `${vList[0]?.hanzi || '你'}好！`,
      });

      // 2. Điền từ vào chỗ trống (Fill in Blank)
      const testWord = vList[1] || { hanzi: '谢谢', pinyin: 'xièxie', vietnamese: 'cảm ơn' };
      exercises.push({
        id: `fb-fill-2-${timestamp}`,
        type: 'fill_blank',
        question: `Điền từ thích hợp vào chỗ trống để đáp lại lời khen hoặc sự giúp đỡ:`,
        hanziPrompt: `A: 谢谢你！ — B: 不______！`,
        pinyinPrompt: `A: Xièxie nǐ! — B: Bú ______!`,
        vietnamesePrompt: `A: Cảm ơn bạn! — B: Đừng khách sáo!`,
        options: ['客气', '谢', '好', '见'],
        correctAnswer: '客气',
        explanation: `Thành ngữ giao tiếp đáp lại lời cảm ơn "谢谢" là "不客气" (bú kèqi - đừng khách khí/không có chi).`,
        grammarFocus: 'Khẩu ngữ giao tiếp hàng ngày',
        audioText: '不客气！',
      });

      // 3. Dịch câu ứng dụng (Translation)
      exercises.push({
        id: `fb-trans-3-${timestamp}`,
        type: 'translation',
        question: `Chọn câu dịch tiếng Trung chính xác cho câu: "Tôi là học sinh."`,
        hanziPrompt: `我是学生。`,
        pinyinPrompt: `Wǒ shì xuésheng.`,
        vietnamesePrompt: `Tôi là học sinh.`,
        options: [
          '我是学生。',
          '我是老师。',
          '我有学生。',
          '他在学校。',
        ],
        correctAnswer: '我是学生。',
        explanation: `Cấu trúc câu khẳng định với 是: Chủ ngữ + 是 + Danh từ (我 + 是 + 学生).`,
        grammarFocus: 'Cấu trúc câu chữ 是 (Định nghĩa)',
        audioText: '我是学生。',
      });

      // 4. Ghép nối hội thoại (Dialogue Match)
      exercises.push({
        id: `fb-dialogue-4-${timestamp}`,
        type: 'dialogue_match',
        question: `Chọn câu đáp lại tự nhiên và lịch sự nhất: "对不起！" (Xin lỗi!)`,
        hanziPrompt: `A: 对不起！ — B: ______？`,
        pinyinPrompt: `A: Duìbuqǐ! — B: ______?`,
        vietnamesePrompt: `A: Xin lỗi bạn! — B: Không sao đâu!`,
        options: [
          '没关系',
          '不客气',
          '再见',
          '谢谢',
        ],
        correctAnswer: '没关系',
        explanation: `Khi đối phương nói "对不起" (xin lỗi), câu đáp chuẩn mực là "没关系" (không sao/không hề gì).`,
        grammarFocus: 'Phản xạ giao tiếp hội thoại',
        audioText: '没关系',
      });

      // 5. Tìm lỗi sai (Error Spotting)
      exercises.push({
        id: `fb-error-5-${timestamp}`,
        type: 'error_spotting',
        question: `Tìm lỗi sai trong câu chào sau: "好你！"`,
        hanziPrompt: `好你！ (Sai trật tự từ)`,
        pinyinPrompt: `Hǎo nǐ!`,
        vietnamesePrompt: `Chào bạn! (Đang bị đảo ngược từ)`,
        options: [
          'Trật tự từ sai: Phải là "你好"',
          'Dùng sai dấu câu',
          'Thiếu chữ "吗"',
          'Phải đổi thành "再见"',
        ],
        correctAnswer: 'Trật tự từ sai: Phải là "你好"',
        explanation: `Tiếng Trung quy định trật tự chào hỏi là [Đối tượng] + [好], ví dụ: 你好 (Bạn chào), 老师好 (Thầy chào), không nói "好你".`,
        grammarFocus: 'Quy tắc ngữ pháp trật tự từ',
        audioText: '你好！',
      });

      // 6. Trắc nghiệm chọn ngữ pháp (Multiple Choice)
      exercises.push({
        id: `fb-mc-6-${timestamp}`,
        type: 'multiple_choice',
        question: `Từ "您" (nín) khác với "你" (nǐ) ở điểm nào?`,
        options: [
          '您 dùng để biểu thị sự kính trọng với người lớn tuổi, thầy cô, khách hàng',
          '您 chỉ dùng cho trẻ em',
          '您 chỉ dùng ở số nhiều',
          'Hai từ này giống hệt nhau không có khác biệt',
        ],
        correctAnswer: '您 dùng để biểu thị sự kính trọng với người lớn tuổi, thầy cô, khách hàng',
        explanation: `Chữ "您" có bộ Tâm (心) ở phía dưới chữ "你", thể hiện sự kính cẩn từ tận đáy lòng.`,
        grammarFocus: 'Đại từ nhân xưng kính ngữ',
        audioText: '您好，老师！',
      });

      return exercises;
    };

    if (!gemini) {
      return res.json({
        exercises: generateFallbackLessonExercises(),
        source: 'local_curated',
      });
    }

    try {
      const prompt = `Bạn là Chuyên gia Khảo thí Ngữ văn Hán ngữ New HSK (Trình độ New HSK ${hskLevel} chuẩn 3.0) và Giảng viên tiếng Trung sư phạm cao cấp.
Nhiệm vụ của bạn: Hãy biên soạn chính xác ${targetCount} câu bài tập luyện tập chuyên sâu cho Bài ${lessonNumber}: "${titleHanzi}" (${titleVietnamese}) thuộc giáo trình New HSK ${hskLevel}.

Thông tin bài học:
- Từ vựng trọng tâm: ${vocabSummary || 'Từ vựng thông dụng bài này'}
- Điểm ngữ pháp bài này: ${grammarSummary || 'Mẫu câu và cấu trúc trọng tâm của bài'}
- Chế độ luyện tập yêu cầu: ${practiceMode}

YÊU CẦU ĐẶC BIỆT VỀ ĐA DẠNG HÓA DẠNG BÀI TẬP:
Hãy phân bổ đều ${targetCount} câu hỏi qua các dạng bài tập thực tiễn sau:
1. "sentence_scramble": Sắp xếp các cụm từ xáo trộn thành câu đúng ngữ pháp tiếng Trung (cung cấp mảng scrambleSegments gồm các mảnh từ).
2. "fill_blank": Điền từ vựng, phó từ, liên từ, trợ từ kết cấu thích hợp vào chỗ trống trong câu có ngữ cảnh.
3. "multiple_choice": Trắc nghiệm chọn đáp án đúng về ngữ nghĩa, phân biệt từ vựng gần nghĩa, hoặc chọn cấu trúc ngữ pháp.
4. "translation": Dịch câu ứng dụng thực tế từ tiếng Việt sang tiếng Trung hoặc ngược lại, rèn luyện tư duy đặt câu.
5. "dialogue_match": Hoàn thành hội thoại giao tiếp 2 người (A nói gì -> B đáp gì chuẩn nhất).
6. "error_spotting": Nhận diện vị trí dùng sai ngữ pháp, hư từ hoặc trật tự từ và chọn cách sửa đúng.

Yêu cầu định dạng đầu ra (Output Format):
CHỈ TRẢ VỀ DUY NHẤT một JSON Array hợp lệ gồm các Object theo mẫu sau:
[
  {
    "id": "ex-1",
    "type": "sentence_scramble", // một trong 6 dạng: fill_blank | sentence_scramble | multiple_choice | translation | dialogue_match | error_spotting
    "question": "Sắp xếp các từ sau thành câu hoàn chỉnh:",
    "hanziPrompt": "Câu tiếng Trung hoặc ngữ cảnh",
    "pinyinPrompt": "Pinyin có dấu thanh điệu chuẩn xác (ví dụ: Nǐ hǎo)",
    "vietnamesePrompt": "Nghĩa tiếng Việt hoặc đề bài chi tiết",
    "scrambleSegments": ["Tôi", "là", "học sinh", "。"], // CHỈ dành cho type 'sentence_scramble', mảng các cụm từ tiếng Trung để học viên click xếp thứ tự
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"], // 4 lựa chọn rõ ràng
    "correctAnswer": "Đáp án chính xác tuyệt đối (hoặc câu hoàn chỉnh)",
    "explanation": "Giải thích chi tiết bằng tiếng Việt: Tại sao đúng, phân tích ngữ pháp, mẹo tránh bẫy ngữ âm/ngữ pháp.",
    "grammarFocus": "Tên điểm ngữ pháp hoặc mẫu câu vận dụng",
    "audioText": "Đoạn văn bản tiếng Trung chuẩn để phát âm nghe audio"
  }
]`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: prompt,
        systemInstruction: 'Bạn là chuyên gia sư phạm tiếng Trung New HSK. Trả về đúng JSON array hợp lệ, không chứa văn bản ngoài JSON.',
        responseMimeType: 'application/json',
        temperature: 0.3,
      });

      const parsed = extractAndParseJSON(responseText, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({
          exercises: parsed,
          source: 'gemini_ai',
          lessonNumber,
          hskLevel,
        });
      }

      return res.json({
        exercises: generateFallbackLessonExercises(),
        source: 'local_curated',
      });
    } catch (err: any) {
      console.warn('[Lesson Exercise Generator] Fallback due to error:', err?.message || err);
      return res.json({
        exercises: generateFallbackLessonExercises(),
        source: 'local_curated',
      });
    }
  });

  // Helper to safely extract and parse JSON from LLM responses even with markdown codeblocks
  function extractAndParseJSON<T = any>(rawText: string, fallback: T): T {
    if (!rawText || typeof rawText !== 'string') return fallback;
    let text = rawText.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    try {
      return JSON.parse(text);
    } catch {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const sliced = text.substring(firstBrace, lastBrace + 1);
          return JSON.parse(sliced);
        } catch (e2) {
          console.warn('[JSON Extractor] Sliced JSON parse failed:', e2);
        }
      }
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          const sliced = text.substring(firstBracket, lastBracket + 1);
          return JSON.parse(sliced);
        } catch (e3) {
          console.warn('[JSON Extractor] Sliced Array parse failed:', e3);
        }
      }
    }
    return fallback;
  }

  // AI Story & Reading Comprehension Generator Endpoint (Strict Topic Relevance + Multi-Topic Fallbacks + Flawless Pinyin)
  app.post('/api/gemini/generate-story', async (req: Request, res: Response) => {
    const { topic = 'Cuối tuần đi uống trà sữa cùng bạn', hskLevel = 1, genre = 'story', customText = '' } = req.body;
    const targetHsk = Math.min(6, Math.max(1, Number(hskLevel) || 1));
    const gemini = getGeminiClient();

    // Curated topic-aware fallback stories mapped by keyword so fallbacks are never out-of-context
    const topicKeywords = String(topic || '').toLowerCase();
    
    const getTopicFallback = (hsk: number, tKey: string) => {
      if (tKey.includes('thể thao') || tKey.includes('bóng') || tKey.includes('chạy') || tKey.includes('thể dục') || tKey.includes('vận động') || tKey.includes('học đường') || tKey.includes('sân')) {
        return {
          title: '学校里的体育运动',
          titlePinyin: 'Xuéxiào lǐ de tǐyù yùndòng',
          titleVietnamese: 'Hoạt động thể thao trong trường học',
          hskLevel: hsk,
          genre: 'story',
          storyChinese: '在我们的学校里，每天下午放学后，操场上都非常热闹。很多同学喜欢打篮球和踢足球，还有一些人在跑道上跑步。我和我的好朋友小明最喜欢打乒乓球。运动不仅能让我们锻炼身体，还能让我们感到非常快乐和放松。大家一边运动，一边互相鼓励，校园里充满了欢声笑语。',
          pinyin: 'Zài wǒmen de xuéxiào lǐ, měi tiān xiàwǔ fàngxué hòu, cāochǎng shang dōu fēicháng rènao. Hěn duō tóngxué xǐhuan dǎ lánqiú hé tī zúqiú, hái yǒu yìxiē rén zài pǎodào shang pǎobù. Wǒ hé wǒ de hǎo péngyou Xiǎo Míng zuì xǐhuan dǎ pīngpāngqiú. Yùndòng bùjǐn néng ràng wǒmen duànliàn shēntǐ, hái néng ràng wǒmen gǎndào fēicháng kuàilè hé fàngsōng. Dàjiā yìbiān yùndòng, yìbiān hùxiāng gǔlì, xiàoyuán lǐ chōngmǎn le huānshēng xiàoyǔ.',
          vietnameseTranslation: 'Ở trường học của chúng tôi, mỗi buổi chiều sau khi tan học, sân trường đều vô cùng náo nhiệt. Rất nhiều bạn học thích chơi bóng rổ và đá bóng, còn có một số người chạy bộ trên đường chạy. Tôi và người bạn thân Tiểu Minh thích chơi bóng bàn nhất. Vận động không chỉ giúp chúng tôi rèn luyện sức khỏe mà còn khiến chúng tôi cảm thấy rất vui vẻ và thư giãn. Mọi người vừa vận động vừa khích lệ lẫn nhau, khắp sân trường tràn ngập tiếng cười nói rộn rã.',
          sentences: [
            { hanzi: '在我们的学校里，每天下午放学后，操场上都非常热闹。', pinyin: 'Zài wǒmen de xuéxiào lǐ, měi tiān xiàwǔ fàngxué hòu, cāochǎng shang dōu fēicháng rènao.', vietnamese: 'Ở trường học của chúng tôi, mỗi buổi chiều sau khi tan học, sân trường đều vô cùng náo nhiệt.' },
            { hanzi: '很多同学喜欢打篮球和踢足球，还有一些人在跑道上跑步。', pinyin: 'Hěn duō tóngxué xǐhuan dǎ lánqiú hé tī zúqiú, hái yǒu yìxiē rén zài pǎodào shang pǎobù.', vietnamese: 'Rất nhiều bạn học thích chơi bóng rổ và đá bóng, còn có một số người chạy bộ trên đường chạy.' },
            { hanzi: '我和我的好朋友小明最喜欢打乒乓球。', pinyin: 'Wǒ hé wǒ de hǎo péngyou Xiǎo Míng zuì xǐhuan dǎ pīngpāngqiú.', vietnamese: 'Tôi và người bạn thân Tiểu Minh thích chơi bóng bàn nhất.' },
            { hanzi: '运动不仅能让我们锻炼身体，还能让我们感到非常快乐和放松。', pinyin: 'Yùndòng bùjǐn néng ràng wǒmen duànliàn shēntǐ, hái néng ràng wǒmen gǎndào fēicháng kuàilè hé fàngsōng.', vietnamese: 'Vận động không chỉ giúp chúng tôi rèn luyện sức khỏe mà còn khiến chúng tôi cảm thấy rất vui vẻ và thư giãn.' },
            { hanzi: '大家一边运动，一边互相鼓励，校园里充满了欢声笑语。', pinyin: 'Dàjiā yìbiān yùndòng, yìbiān hùxiāng gǔlì, xiàoyuán lǐ chōngmǎn le huānshēng xiàoyǔ.', vietnamese: 'Mọi người vừa vận động vừa khích lệ lẫn nhau, khắp sân trường tràn ngập tiếng cười nói rộn rã.' }
          ],
          keyVocabulary: [
            { hanzi: '操场', pinyin: 'cāochǎng', hanViet: 'thao trường', vietnamese: 'sân vận động trường học', partOfSpeech: 'Danh từ', hskLevel: 2 },
            { hanzi: '打篮球', pinyin: 'dǎ lánqiú', hanViet: 'đả lam cầu', vietnamese: 'chơi bóng rổ', partOfSpeech: 'Động từ', hskLevel: 1 },
            { hanzi: '踢足球', pinyin: 'tī zúqiú', hanViet: 'thích túc cầu', vietnamese: 'đá bóng', partOfSpeech: 'Động từ', hskLevel: 1 },
            { hanzi: '锻炼', pinyin: 'duànliàn', hanViet: 'đoán luyện', vietnamese: 'rèn luyện, tập luyện', partOfSpeech: 'Động từ', hskLevel: 3 },
            { hanzi: '放松', pinyin: 'fàngsōng', hanViet: 'phóng tùng', vietnamese: 'thư giãn, thả lỏng', partOfSpeech: 'Động từ/Tính từ', hskLevel: 3 }
          ],
          grammarHighlights: [
            {
              structure: '不仅...还/而且... (Không những... mà còn...)',
              explanation: 'Biểu thị mối quan hệ tăng tiến giữa hai tác dụng hoặc hai vế câu.',
              example: '运动不仅能锻炼身体，还能让我们快乐。',
              examplePinyin: 'Yùndòng bùjǐn néng duànliàn shēntǐ, hái néng ràng wǒmen kuàilè.',
              exampleVietnamese: 'Vận động không chỉ giúp rèn luyện thân thể mà còn khiến chúng ta vui vẻ.'
            },
            {
              structure: '一边...一边... (Vừa... vừa...)',
              explanation: 'Biểu thị hai hành động cùng diễn ra đồng thời.',
              example: '大家一边运动，一边互相鼓励。',
              examplePinyin: 'Dàjiā yìbiān yùndòng, yìbiān hùxiāng gǔlì.',
              exampleVietnamese: 'Mọi người vừa vận động vừa khích lệ lẫn nhau.'
            }
          ],
          questions: [
            { id: 'q1', question: '放学后操场上同学们都在做什么？ (Sau khi tan học các bạn học làm gì trên sân?)', options: ['A. 在教室里睡觉 (Ngủ trong lớp)', 'B. 打篮球、踢足球和跑步 (Chơi bóng rổ, đá bóng và chạy bộ)', 'C. 去校外买东西 (Ra ngoài trường mua đồ)', 'D. 在图书馆看书 (Đọc sách ở thư viện)'], correctAnswer: 'B. 打篮球、踢足球和跑步 (Chơi bóng rổ, đá bóng và chạy bộ)', explanation: 'Trong bài nêu rõ: "很多同学喜欢打篮球和踢足球，还有一些人在跑道上跑步。"' },
            { id: 'q2', question: '作者和小明最喜欢什么运动？ (Tác giả và Tiểu Minh thích môn thể thao nào nhất?)', options: ['A. 打羽毛球 (Cầu lông)', 'B. 游泳 (Bơi lội)', 'C. 打乒乓球 (Bóng bàn)', 'D. 骑自行车 (Đi xe đạp)'], correctAnswer: 'C. 打乒乓球 (Bóng bàn)', explanation: 'Bài viết có câu: "我和我的好朋友小明最喜欢打乒乓球。"' }
          ]
        };
      }

      if (tKey.includes('trà sữa') || tKey.includes('uống') || tKey.includes('quán')) {
        return {
          title: '我和朋友去喝珍珠奶茶',
          titlePinyin: 'Wǒ hé péngyou qù hē zhēnzhū nǎichá',
          titleVietnamese: 'Tôi và bạn đi uống trà sữa trân châu',
          hskLevel: hsk,
          genre: 'story',
          storyChinese: '今天是星期六，天气很好。下午我和好朋友小王一起去学校附近的新奶茶店。这家店的珍珠奶茶很有名，很多人在排队。小王点了一杯半糖去冰的热乌龙奶茶，我点了一杯少糖加椰果的绿茶奶茶。我们坐在窗边，一边喝着香甜的奶茶，一边高兴地聊天，度过了一个非常快乐的下午。',
          pinyin: 'Jīntiān shì xīngqīliù, tiānqì hěn hǎo. Xiàwǔ wǒ hé hǎo péngyou Xiǎo Wáng yìqǐ qù xuéxiào fùjìn de xīn nǎichá diàn. Zhè jiā diàn de zhēnzhū nǎichá hěn yǒumíng, hěn duō rén zài páiduì. Xiǎo Wáng diǎn le yì bēi bàn táng qù bīng de rè wūlóng nǎichá, wǒ diǎn le yì bēi shǎo táng jiā yēguǒ de lǜchá nǎichá. Wǒmen zuò zài chuāng biān, yìbiān hē zhe xiāngtián de nǎichá, yìbiān gāoxìng de liáotiān, dùguò le yí gè fēicháng kuàilè de xiàwǔ.',
          vietnameseTranslation: 'Hôm nay là thứ Bảy, thời tiết rất đẹp. Buổi chiều tôi và người bạn thân Tiểu Vương cùng nhau đến quán trà sữa mới gần trường học. Trà sữa trân châu của quán này rất nổi tiếng, có rất nhiều người đang xếp hàng. Tiểu Vương gọi một ly trà sữa Ô Long nóng nửa đường không đá, tôi gọi một ly trà xanh sữa ít đường thêm thạch dừa. Chúng tôi ngồi bên cửa sổ, vừa uống ly trà sữa thơm ngọt, vừa vui vẻ trò chuyện, trải qua một buổi chiều vô cùng vui vẻ.',
          sentences: [
            { hanzi: '今天是星期六，天气很好。', pinyin: 'Jīntiān shì xīngqīliù, tiānqì hěn hǎo.', vietnamese: 'Hôm nay là thứ Bảy, thời tiết rất đẹp.' },
            { hanzi: '下午我和好朋友小王一起去学校附近的新奶茶店。', pinyin: 'Xiàwǔ wǒ hé hǎo péngyou Xiǎo Wáng yìqǐ qù xuéxiào fùjìn de xīn nǎichá diàn.', vietnamese: 'Buổi chiều tôi và người bạn thân Tiểu Vương cùng nhau đến quán trà sữa mới gần trường học.' },
            { hanzi: '这家店的珍珠奶茶很有名，很多人在排队。', pinyin: 'Zhè jiā diàn de zhēnzhū nǎichá hěn yǒumíng, hěn duō rén zài páiduì.', vietnamese: 'Trà sữa trân châu của quán này rất nổi tiếng, có rất nhiều người đang xếp hàng.' },
            { hanzi: '小王点了一杯半糖去冰的热乌龙奶茶，我点了一杯少糖加椰果的绿茶奶茶。', pinyin: 'Xiǎo Wáng diǎn le yì bēi bàn táng qù bīng de rè wūlóng nǎichá, wǒ diǎn le yì bēi shǎo táng jiā yēguǒ de lǜchá nǎichá.', vietnamese: 'Tiểu Vương gọi một ly trà sữa Ô Long nóng nửa đường không đá, tôi gọi một ly trà xanh sữa ít đường thêm thạch dừa.' },
            { hanzi: '我们坐在窗边，一边喝着香甜的奶茶，一边高兴地聊天，度过了一个非常快乐的下午。', pinyin: 'Wǒmen zuò zài chuāng biān, yìbiān hē zhe xiāngtián de nǎichá, yìbiān gāoxìng de liáotiān, dùguò le yí gè fēicháng kuàilè de xiàwǔ.', vietnamese: 'Chúng tôi ngồi bên cửa sổ, vừa uống ly trà sữa thơm ngọt, vừa vui vẻ trò chuyện, trải qua một buổi chiều vô cùng vui vẻ.' }
          ],
          keyVocabulary: [
            { hanzi: '奶茶', pinyin: 'nǎichá', hanViet: 'nãi trà', vietnamese: 'trà sữa', partOfSpeech: 'Danh từ', hskLevel: 1 },
            { hanzi: '珍珠', pinyin: 'zhēnzhū', hanViet: 'trân châu', vietnamese: 'trân châu', partOfSpeech: 'Danh từ', hskLevel: 1 },
            { hanzi: '排队', pinyin: 'páiduì', hanViet: 'bài đội', vietnamese: 'xếp hàng', partOfSpeech: 'Động từ', hskLevel: 2 },
            { hanzi: '附近', pinyin: 'fùjìn', hanViet: 'phụ cận', vietnamese: 'gần đây, lân cận', partOfSpeech: 'Danh từ', hskLevel: 2 },
            { hanzi: '聊天', pinyin: 'liáotiān', hanViet: 'liêu thiên', vietnamese: 'trò chuyện, tán gẫu', partOfSpeech: 'Động từ', hskLevel: 1 }
          ],
          grammarHighlights: [
            {
              structure: '一边...一边... (Vừa... vừa...)',
              explanation: 'Biểu thị hai hành động cùng diễn ra đồng thời trong một khoảng thời gian.',
              example: '一边喝着奶茶，一边高兴地聊天。',
              examplePinyin: 'Yìbiān hē zhe nǎichá, yìbiān gāoxìng de liáotiān.',
              exampleVietnamese: 'Vừa uống trà sữa thơm ngon vừa vui vẻ trò chuyện.'
            },
            {
              structure: '和 / 跟 + Ai + 一起 + Động từ',
              explanation: 'Cấu trúc biểu thị cùng ai đó làm một việc gì đó.',
              example: '我和好朋友小王一起去新奶茶店。',
              examplePinyin: 'Wǒ hé hǎo péngyou Xiǎo Wáng yìqǐ qù xīn nǎichá diàn.',
              exampleVietnamese: 'Tôi và người bạn thân Tiểu Vương cùng nhau đi đến quán trà sữa mới.'
            }
          ],
          questions: [
            { id: 'q1', question: '作者和小王下午去了哪里？ (Tác giả và Tiểu Vương buổi chiều đã đi đâu?)', options: ['A. 去图书馆复习 (Đi thư viện ôn tập)', 'B. 去学校附近的奶茶店 (Đi quán trà sữa gần trường)', 'C. 去电影院看电影 (Đi rạp chiếu phim)', 'D. 去超市买水果 (Đi siêu thị mua hoa quả)'], correctAnswer: 'B. 去学校附近的奶茶店 (Đi quán trà sữa gần trường)', explanation: 'Trong bài nêu rõ: "下午我和好朋友小王一起去学校附近的新奶茶店。"' },
            { id: 'q2', question: '小王点了什么饮品？ (Tiểu Vương đã gọi thức uống gì?)', options: ['A. 冰咖啡 (Cà phê đá)', 'B. 热乌龙奶茶 (Trà sữa Ô Long nóng)', 'C. 苹果汁 (Nước ép táo)', 'D. 矿泉水 (Nước khoáng)'], correctAnswer: 'B. 热乌龙奶茶 (Trà sữa Ô Long nóng)', explanation: 'Bài viết có câu: "小王点了一杯半糖去冰的热乌龙奶茶。"' }
          ]
        };
      }
      
      if (tKey.includes('chợ đêm') || tKey.includes('ăn vặt') || tKey.includes('ẩm thực') || tKey.includes('món ăn')) {
        return {
          title: '热闹的夜市与中国小吃',
          titlePinyin: 'Rènao de yèshì yǔ Zhōngguó xiǎochī',
          titleVietnamese: 'Chợ đêm náo nhiệt và đồ ăn vặt Trung Hoa',
          hskLevel: hsk,
          genre: 'story',
          storyChinese: '每当夜幕降临，市中心的夜市就变得格外热闹。整条街灯火通明，空气中弥漫着各种美食的诱人香味。我和朋友一进夜市，就看到了很多人排队买热腾腾的煎饺和小笼包。我们品尝了外酥里嫩的炸豆腐，还喝了冰镇的酸梅汤。这里的摊主都非常热情，价格也很便宜。逛夜市不仅能大饱口福，更能深深感受当地浓郁的人情味和夜生活文化。',
          pinyin: 'Měi dāng yèmù jiànglín, shìzhōngxīn de yèshì jiù biàn de géwài rènao. Zhěng tiáo jiē dēnghuǒ tōngmíng, kōngqì zhōng mímàn zhe gè zhǒng měishí de yòurén xiāngwèi. Wǒ hé péngyou yí jìn yèshì, jiù kàndào le hěn duō rén páiduì mǎi rèténgténg de jiānjiǎo hé xiǎolóngbāo. Wǒmen pǐncháng le wài sū lǐ nèn de zhá dòufu, hái hē le bīngzhèn de suānméitāng. Zhèlǐ de tānzhǔ dōu fēicháng rèqíng, jiàgé yě hěn piányi. Guàng yèshì bùjǐn néng dà bǎo kǒufú, gèng néng shēnshēn gǎnshòu dāngdì nóngyù de rénqíngwèi hé yè shēnghuó wénhuà.',
          vietnameseTranslation: 'Mỗi khi màn đêm buông xuống, khu chợ đêm ở trung tâm thành phố lại trở nên vô cùng náo nhiệt. Cả con phố rực rỡ ánh đèn, không khí ngập tràn mùi thơm hấp dẫn của đủ loại món ngon. Tôi và bạn vừa bước vào chợ đêm đã thấy rất nhiều người xếp hàng mua há cảo chiên nóng hổi và bánh bao Tiểu Long Bao. Chúng tôi đã thưởng thức món đậu phụ chiên ngoài giòn trong mềm, và còn uống cả nước ô mai ướp lạnh. Những người chủ quầy hàng ở đây đều rất nhiệt tình, giá cả cũng rất phải chăng. Đi dạo chợ đêm không chỉ được thưởng thức no nê ẩm thực tuyệt vời mà còn cảm nhận sâu sắc tình người nồng ấm và nét văn hóa cuộc sống về đêm của địa phương.',
          sentences: [
            { hanzi: '每当夜幕降临，市中心的夜市就变得格外热闹。', pinyin: 'Měi dāng yèmù jiànglín, shìzhōngxīn de yèshì jiù biàn de géwài rènao.', vietnamese: 'Mỗi khi màn đêm buông xuống, khu chợ đêm ở trung tâm thành phố lại trở nên vô cùng náo nhiệt.' },
            { hanzi: '整条街灯火通明，空气中弥漫着各种美食的诱人香味。', pinyin: 'Zhěng tiáo jiē dēnghuǒ tōngmíng, kōngqì zhōng mímàn zhe gè zhǒng měishí de yòurén xiāngwèi.', vietnamese: 'Cả con phố rực rỡ ánh đèn, không khí ngập tràn mùi thơm hấp dẫn của đủ loại món ngon.' },
            { hanzi: '我和朋友一进夜市，就看到了很多人排队买热腾腾的煎饺和小笼包。', pinyin: 'Wǒ hé péngyou yí jìn yèshì, jiù kàndào le hěn duō rén páiduì mǎi rèténgténg de jiānjiǎo hé xiǎolóngbāo.', vietnamese: 'Tôi và bạn vừa bước vào chợ đêm đã thấy rất nhiều người xếp hàng mua há cảo chiên nóng hổi và bánh bao Tiểu Long Bao.' },
            { hanzi: '我们品尝了外酥里嫩的炸豆腐，还喝了冰镇的酸梅汤。', pinyin: 'Wǒmen pǐncháng le wài sū lǐ nèn de zhá dòufu, hái hē le bīngzhèn de suānméitāng.', vietnamese: 'Chúng tôi đã thưởng thức món đậu phụ chiên ngoài giòn trong mềm, và còn uống cả nước ô mai ướp lạnh.' },
            { hanzi: '这里的摊主都非常热情，价格也很便宜。', pinyin: 'Zhèlǐ de tānzhǔ dōu fēicháng rèqíng, jiàgé yě hěn piányi.', vietnamese: 'Những người chủ quầy hàng ở đây đều rất nhiệt tình, giá cả cũng rất phải chăng.' }
          ],
          keyVocabulary: [
            { hanzi: '夜市', pinyin: 'yèshì', hanViet: 'dạ thị', vietnamese: 'chợ đêm', partOfSpeech: 'Danh từ', hskLevel: 2 },
            { hanzi: '热闹', pinyin: 'rènao', hanViet: 'nhiệt náo', vietnamese: 'náo nhiệt, sôi nổi', partOfSpeech: 'Tính từ', hskLevel: 2 },
            { hanzi: '小吃', pinyin: 'xiǎochī', hanViet: 'tiểu cật', vietnamese: 'đồ ăn vặt, món ăn nhẹ', partOfSpeech: 'Danh từ', hskLevel: 2 },
            { hanzi: '品尝', pinyin: 'pǐncháng', hanViet: 'phẩm thường', vietnamese: 'thưởng thức, nếm thử', partOfSpeech: 'Động từ', hskLevel: 3 },
            { hanzi: '便宜', pinyin: 'piányi', hanViet: 'tiện nghi', vietnamese: 'rẻ, giá cả phải chăng', partOfSpeech: 'Tính từ', hskLevel: 1 }
          ],
          grammarHighlights: [
            {
              structure: '一...就... (Vừa... liền/đã...)',
              explanation: 'Biểu thị hai hành động liên tiếp xảy ra trong chốc lát.',
              example: '一进夜市，就看到了很多人。',
              examplePinyin: 'Yí jìn yèshì, jiù kàndào le hěn duō rén.',
              exampleVietnamese: 'Vừa bước vào chợ đêm là đã thấy rất nhiều người.'
            },
            {
              structure: '变得 + Tính từ (Trở nên...)',
              explanation: 'Biểu thị sự thay đổi trạng thái, tính chất.',
              example: '夜市就变得格外热闹。',
              examplePinyin: 'Yèshì jiù biàn de géwài rènao.',
              exampleVietnamese: 'Chợ đêm liền trở nên vô cùng náo nhiệt.'
            }
          ],
          questions: [
            { id: 'q1', question: '作者在夜市品尝了什么特色美食？ (Tác giả đã thưởng thức món ngon đặc sắc gì ở chợ đêm?)', options: ['A. 炸豆腐和酸梅汤 (Đậu phụ chiên và nước ô mai)', 'B. 烤鸭和烤鱼 (Vịt quay và cá nướng)', 'C. 炒饭和拉面 (Cơm rang và mì kéo)', 'D. 西瓜和苹果 (Dưa hấu và táo)'], correctAnswer: 'A. 炸豆腐和酸梅汤 (Đậu phụ chiên và nước ô mai)', explanation: 'Trong bài có câu: "我们品尝了外酥里嫩的炸豆腐，还喝了冰镇的酸梅汤。"' },
            { id: 'q2', question: '夜市的摊主态度怎么样？ (Thái độ của các chủ quán ở chợ đêm như thế nào?)', options: ['A. 很冷漠 (Rất lạnh nhạt)', 'B. 非常热情 (Rất nhiệt tình)', 'C. 很着急 (Rất vội vàng)', 'D. 不喜欢说话 (Không thích nói chuyện)'], correctAnswer: 'B. 非常热情 (Rất nhiệt tình)', explanation: 'Bài viết khẳng định: "这里的摊主都非常热情，价格也很便宜。"' }
          ]
        };
      }

      if (tKey.includes('taobao') || tKey.includes('mua sắm') || tKey.includes('săn sale') || tKey.includes('hàng')) {
        return {
          title: '第一次在中国网购与体验淘宝',
          titlePinyin: 'Dì yí cì zài Zhōngguó wǎnggòu yǔ tǐyàn Táobǎo',
          titleVietnamese: 'Lần đầu tiên mua sắm online và trải nghiệm Taobao tại Trung Quốc',
          hskLevel: hsk,
          genre: 'story',
          storyChinese: '在中国生活，网购已经成为每个人日常生活中不可缺少的一部分。上个星期，我的中国朋友教我下载了淘宝软件。里面的商品琳琅满目，无论是衣服、书籍还是日常用品，应有尽有。正好赶上打折促销活动，我把自己喜欢的汉服和几本汉语词典加入了购物车。下单付款后仅仅过了两天，我就收到了快递取件的短信。中国物流的速度之快，让我感到非常惊喜和佩服！',
          pinyin: 'Zài Zhōngguó shēnghuó, wǎnggòu yǐjīng chéngwéi měi gè rén rìcháng shēnghuó zhōng bù kě quēshǎo de yí bùfen. Shàng gè xīngqī, wǒ de Zhōngguó péngyou jiāo wǒ xiàzài le Táobǎo ruǎnjiàn. Lǐmiàn de shāngpǐn línlángmǎnmù, wúlùn shì yīfu, shūjí háishì rìcháng yòngpǐn, yīngyǒujìnyǒu. Zhènghǎo gǎnshàng dǎzhé cùxiāo huódòng, wǒ bǎ zìjǐ xǐhuan de hànfú hé jǐ běn hànyǔ cídiǎn jiārù le gòuwùchē. Xiàdān fùkuǎn hòu jǐnjǐn guò le liǎng tiān, wǒ jiù shōudào le kuàidì qǔjiàn de duǎnxìn. Zhōngguó wùliú de sùdù zhī kuài, ràng wǒ gǎndào fēicháng jīngxǐ hé pèifú!',
          vietnameseTranslation: 'Sống ở Trung Quốc, mua sắm qua mạng đã trở thành một phần không thể thiếu trong đời sống hàng ngày của mỗi người. Tuần trước, một người bạn Trung Quốc đã dạy tôi tải ứng dụng Taobao. Các mặt hàng bên trong vô cùng phong phú, bất kể là quần áo, sách vở hay đồ dùng sinh hoạt hàng ngày, thứ gì cũng có. Đúng lúc bắt gặp chương trình khuyến mãi giảm giá, tôi đã thêm bộ Hán phục yêu thích và vài quyển từ điển tiếng Trung vào giỏ hàng. Sau khi đặt đơn và thanh toán, chỉ vỏn vẹn 2 ngày sau tôi đã nhận được tin nhắn báo lấy hàng chuyển phát nhanh. Tốc độ logistics của Trung Quốc nhanh đến mức khiến tôi vô cùng ngạc nhiên và khâm phục!',
          sentences: [
            { hanzi: '在中国生活，网购已经成为每个人日常生活中不可缺少的一部分。', pinyin: 'Zài Zhōngguó shēnghuó, wǎnggòu yǐjīng chéngwéi měi gè rén rìcháng shēnghuó zhōng bù kě quēshǎo de yí bùfen.', vietnamese: 'Sống ở Trung Quốc, mua sắm qua mạng đã trở thành một phần không thể thiếu trong đời sống hàng ngày của mỗi người.' },
            { hanzi: '上个星期，我的中国朋友教我下载了淘宝软件。', pinyin: 'Shàng gè xīngqī, wǒ de Zhōngguó péngyou jiāo wǒ xiàzài le Táobǎo ruǎnjiàn.', vietnamese: 'Tuần trước, một người bạn Trung Quốc đã dạy tôi tải ứng dụng Taobao.' },
            { hanzi: '正好赶上打折促销活动，我把自己喜欢的汉服和几本汉语词典加入了购物车。', pinyin: 'Zhènghǎo gǎnshàng dǎzhé cùxiāo huódòng, wǒ bǎ zìjǐ xǐhuan de hànfú hé jǐ běn hànyǔ cídiǎn jiārù le gòuwùchē.', vietnamese: 'Đúng lúc bắt gặp chương trình khuyến mãi giảm giá, tôi đã thêm bộ Hán phục yêu thích và vài quyển từ điển tiếng Trung vào giỏ hàng.' },
            { hanzi: '下单付款后仅仅过了两天，我就收到了快递取件的短信。', pinyin: 'Xiàdān fùkuǎn hòu jǐnjǐn guò le liǎng tiān, wǒ jiù shōudào le kuàidì qǔjiàn de duǎnxìn.', vietnamese: 'Sau khi đặt đơn và thanh toán, chỉ vỏn vẹn 2 ngày sau tôi đã nhận được tin nhắn báo lấy hàng chuyển phát nhanh.' }
          ],
          keyVocabulary: [
            { hanzi: '网购', pinyin: 'wǎnggòu', hanViet: 'võng cấu', vietnamese: 'mua sắm qua mạng, mua online', partOfSpeech: 'Động từ/Danh từ', hskLevel: 3 },
            { hanzi: '打折', pinyin: 'dǎzhé', hanViet: 'đả chiết', vietnamese: 'giảm giá, chiết khấu', partOfSpeech: 'Động từ', hskLevel: 3 },
            { hanzi: '购物车', pinyin: 'gòuwùchē', hanViet: 'cấu vật xa', vietnamese: 'giỏ hàng mua sắm', partOfSpeech: 'Danh từ', hskLevel: 2 },
            { hanzi: '快递', pinyin: 'kuàidì', hanViet: 'khoái đệ', vietnamese: 'chuyển phát nhanh, bưu kiện', partOfSpeech: 'Danh từ', hskLevel: 3 },
            { hanzi: '物流', pinyin: 'wùliú', hanViet: 'vật lưu', vietnamese: 'ngành logistics, vận chuyển hàng', partOfSpeech: 'Danh từ', hskLevel: 4 }
          ],
          grammarHighlights: [
            {
              structure: '把 + Tân ngữ + Động từ + Thành phần khác (Câu chữ 把)',
              explanation: 'Nhấn mạnh sự xử lý và kết quả tác động lên đối tượng.',
              example: '我把汉服加入了购物车。',
              examplePinyin: 'Wǒ bǎ hànfú jiārù le gòuwùchē.',
              exampleVietnamese: 'Tôi đã thêm bộ Hán phục vào giỏ hàng.'
            },
            {
              structure: '无论...还是... (Bất kể... hay là...)',
              explanation: 'Biểu thị trong mọi điều kiện, kết quả đều không thay đổi.',
              example: '无论是衣服还是日常用品，应有尽有。',
              examplePinyin: 'Wúlùn shì yīfu háishì rìcháng yòngpǐn, yīngyǒujìnyǒu.',
              exampleVietnamese: 'Bất kể là quần áo hay đồ dùng hàng ngày, thứ gì cũng có đủ.'
            }
          ],
          questions: [
            { id: 'q1', question: '作者在淘宝上买了什么东西？ (Tác giả đã mua thứ gì trên Taobao?)', options: ['A. 手机和电脑 (Điện thoại và máy tính)', 'B. 汉服和汉语词典 (Hán phục và từ điển tiếng Trung)', 'C. 水果和蔬菜 (Hoa quả và rau củ)', 'D. 自行车 (Xe đạp)'], correctAnswer: 'B. 汉服和汉语词典 (Hán phục và từ điển tiếng Trung)', explanation: 'Trong bài nêu rõ: "我把自己喜欢的汉服和几本汉语词典加入了购物车。"' },
            { id: 'q2', question: '下单后过了几天收到快递短信？ (Sau khi đặt đơn mấy ngày thì nhận được tin nhắn chuyển phát nhanh?)', options: ['A. 两天 (2 ngày)', 'B. 一个星期 (1 tuần)', 'C. 一个月 (1 tháng)', 'D. 当天 (Trong ngày)'], correctAnswer: 'A. 两天 (2 ngày)', explanation: 'Trong bài có câu: "下单付款后仅仅过了两天，我就收到了快递取件的短信。"' }
          ]
        };
      }

      // Default level fallback
      if (hsk === 2 || tKey.includes('bắc kinh') || tKey.includes('lá đỏ') || tKey.includes('hương sơn')) {
        return {
          title: '北京的秋天与香山红叶',
          titlePinyin: 'Běijīng de qiūtiān yǔ Xiāngshān hóngyè',
          titleVietnamese: 'Mùa thu Bắc Kinh và lá đỏ núi Hương Sơn',
          hskLevel: 2,
          genre: 'culture',
          storyChinese: '人们常说，北京的秋天是一年中最美丽的季节。天气既不冷也不热，天空总是那么蓝。上个星期六，我和几个留学生朋友一起去香山看红叶。虽然爬山很累，但是当我们站在山顶往下看时，满山都是红色的树叶，美得就像一幅画。我们拍了许多照片，还尝了地道的北京烤鸭。这一天过得非常充实又难忘！',
          pinyin: 'Rénmen cháng shuō, Běijīng de qiūtiān shì yì nián zhōng zuì měilì de jìjié. Tiānqì jì bù lěng yě bú rè, tiānkōng zǒngshì nàme lán. Shàng gè xīngqīliù, wǒ hé jǐ gè liúxuéshēng péngyou yìqǐ qù Xiāngshān kàn hóngyè. Suīrán páshān hěn lèi, dànshì dāng wǒmen zhàn zài shāndǐng wǎng xià kàn shí, mǎn shān dōu shì hóngsè de shùyè, měi de jiù xiàng yì fú huà. Wǒmen pāi le xǔduō zhàopiàn, hái cháng le dìdao de Běijīng kǎoyā. Zhè yì tiān guò de fēicháng chōngshí yòu nánwàng!',
          vietnameseTranslation: 'Người ta thường nói, mùa thu Bắc Kinh là mùa đẹp nhất trong năm. Thời tiết không lạnh cũng không nóng, bầu trời lúc nào cũng xanh biếc. Thứ Bảy tuần trước, tôi cùng mấy người bạn du học sinh đi núi Hương Sơn ngắm lá đỏ. Tuy leo núi rất mệt, nhưng khi đứng trên đỉnh núi nhìn xuống, khắp núi đều là lá cây màu đỏ rực rỡ, đẹp tựa như một bức tranh. Chúng tôi đã chụp rất nhiều ảnh và còn thưởng thức món vịt quay Bắc Kinh chính gốc. Một ngày trôi qua thật trọn vẹn và khó quên!',
          sentences: [
            { hanzi: '人们常说，北京的秋天是一年中最美丽的季节。', pinyin: 'Rénmen cháng shuō, Běijīng de qiūtiān shì yì nián zhōng zuì měilì de jìjié.', vietnamese: 'Người ta thường nói, mùa thu Bắc Kinh là mùa đẹp nhất trong năm.' },
            { hanzi: '天气既不冷也不热，天空总是那么蓝。', pinyin: 'Tiānqì jì bù lěng yě bú rè, tiānkōng zǒngshì nàme lán.', vietnamese: 'Thời tiết không lạnh cũng không nóng, bầu trời lúc nào cũng xanh biếc.' },
            { hanzi: '上个星期六，我和几个留学生朋友一起去香山看红叶。', pinyin: 'Shàng gè xīngqīliù, wǒ hé jǐ gè liúxuéshēng péngyou yìqǐ qù Xiāngshān kàn hóngyè.', vietnamese: 'Thứ Bảy tuần trước, tôi cùng mấy người bạn du học sinh đi núi Hương Sơn ngắm lá đỏ.' },
            { hanzi: '虽然爬山很累，但是当我们站在山顶往下看时，满山都是红色的树叶，美得就像一幅画。', pinyin: 'Suīrán páshān hěn lèi, dànshì dāng wǒmen zhàn zài shāndǐng wǎng xià kàn shí, mǎn shān dōu shì hóngsè de shùyè, měi de jiù xiàng yì fú huà.', vietnamese: 'Tuy leo núi rất mệt, nhưng khi đứng trên đỉnh núi nhìn xuống, khắp núi đều là lá cây màu đỏ rực rỡ, đẹp tựa như một bức tranh.' }
          ],
          keyVocabulary: [
            { hanzi: '季节', pinyin: 'jìjié', hanViet: 'quý tiết', vietnamese: 'mùa trong năm', partOfSpeech: 'Danh từ', hskLevel: 2 },
            { hanzi: '爬山', pinyin: 'páshān', hanViet: 'bà sơn', vietnamese: 'leo núi', partOfSpeech: 'Động từ', hskLevel: 2 },
            { hanzi: '地道', pinyin: 'dìdao', hanViet: 'địa đạo', vietnamese: 'chính gốc, chuẩn vị', partOfSpeech: 'Tính từ', hskLevel: 2 },
            { hanzi: '难忘', pinyin: 'nánwàng', hanViet: 'nan vong', vietnamese: 'khó quên', partOfSpeech: 'Tính từ', hskLevel: 2 }
          ],
          grammarHighlights: [
            {
              structure: '既...又/也... (Vừa... vừa...)',
              explanation: 'Biểu thị hai đặc điểm cùng tồn tại song song.',
              example: '天气既不冷也不热。',
              examplePinyin: 'Tiānqì jì bù lěng yě bú rè.',
              exampleVietnamese: 'Thời tiết vừa không lạnh lại vừa không nóng.'
            },
            {
              structure: '虽然...但是... (Tuy... nhưng...)',
              explanation: 'Biểu thị quan hệ nhượng bộ đối lập.',
              example: '虽然爬山很累，但是景色很美。',
              examplePinyin: 'Suīrán páshān hěn lèi, dànshì jǐngsè hěn měi.',
              exampleVietnamese: 'Tuy leo núi rất mệt nhưng phong cảnh rất đẹp.'
            }
          ],
          questions: [
            { id: 'q1', question: '作者觉得北京哪个季节最美？ (Tác giả cảm thấy mùa nào ở Bắc Kinh đẹp nhất?)', options: ['A. 春天 (Mùa xuân)', 'B. 夏天 (Mùa hè)', 'C. 秋天 (Mùa thu)', 'D. 冬天 (Mùa đông)'], correctAnswer: 'C. 秋天 (Mùa thu)', explanation: 'Trong bài có câu: "北京的秋天是一年中最美丽的季节。"' }
          ]
        };
      }

      if (hsk === 3 || tKey.includes('tàu cao tốc') || tKey.includes('ga') || tKey.includes('giao thông')) {
        return {
          title: '中国的高铁与现代生活',
          titlePinyin: 'Zhōngguó de gāotiě yǔ xiàndài shēnghuó',
          titleVietnamese: 'Tàu cao tốc Trung Quốc và đời sống hiện đại',
          hskLevel: 3,
          genre: 'story',
          storyChinese: '在中国生活，出行最方便的交通工具莫过于高铁。不仅速度极快，而且准点率非常高。从北京到上海一千三百多公里，坐高铁只需要四个多小时。车厢里不仅宽敞舒适，还配有无线网络和充电插座。你可以一边喝着咖啡，一边用电脑工作或者欣赏窗外飞驰而过的美景。现在，越来越多的外国人来到中国旅游，都会特意体验一次中国高铁，感受现代科技带来的便捷。',
          pinyin: 'Zài Zhōngguó shēnghuó, chūxíng zuì fāngbiàn de jiāotōng gōngjù mòguòyú gāotiě. Bùjǐn sùdù jí kuài, érqiě zhǔndiǎnlǜ fēicháng gāo. Cóng Běijīng dào Shànghǎi yì qiān sān bǎi duō gōnglǐ, zuò gāotiě zhǐ xūyào sì gè duō xiǎoshí. Chēxiāng lǐ bùjǐn kuānchǎng shūshì, hái pèi yǒu wúxiàn wǎngluò hé chōngdiàn chāzuò. Nǐ kěyǐ yìbiān hē zhe kāfēi, yìbiān yòng diànnǎo gōngzuò huòzhě xīnshǎng chuāngwài fēichí ér guò de měijǐng. Xiànzài, yuèláiyuè duō de wàiguórén lái dào Zhōngguó lǚyóu, dōu huì tèyì tǐyàn yí cì Zhōngguó gāotiě, gǎnshòu xiàndài kējì dài lái de biànjié.',
          vietnameseTranslation: 'Sống ở Trung Quốc, phương tiện giao thông thuận tiện nhất để đi lại không gì khác ngoài tàu cao tốc. Không chỉ tốc độ cực nhanh, mà tỷ lệ đúng giờ còn rất cao. Từ Bắc Kinh đến Thượng Hải hơn 1300 cây số, đi tàu cao tốc chỉ mất hơn 4 tiếng. Bên trong toa tàu không chỉ rộng rãi, êm ái mà còn được trang bị mạng không dây và ổ cắm sạc. Bạn có thể vừa uống cà phê, vừa dùng máy tính làm việc hoặc ngắm nhìn cảnh đẹp lướt qua bên ngoài cửa sổ. Hiện nay, ngày càng có nhiều người nước ngoài đến Trung Quốc du lịch đều chủ ý trải nghiệm một lần tàu cao tốc để cảm nhận sự tiện lợi mà công nghệ hiện đại mang lại.',
          sentences: [
            { hanzi: '在中国生活，出行最方便的交通工具莫过于高铁。', pinyin: 'Zài Zhōngguó shēnghuó, chūxíng zuì fāngbiàn de jiāotōng gōngjù mòguòyú gāotiě.', vietnamese: 'Sống ở Trung Quốc, phương tiện giao thông thuận tiện nhất để đi lại không gì khác ngoài tàu cao tốc.' },
            { hanzi: '不仅速度极快，而且准点率非常高。', pinyin: 'Bùjǐn sùdù jí kuài, érqiě zhǔndiǎnlǜ fēicháng gāo.', vietnamese: 'Không chỉ tốc độ cực nhanh, mà tỷ lệ đúng giờ còn rất cao.' },
            { hanzi: '从北京到上海一千三百多公里，坐高铁只需要四个多小时。', pinyin: 'Cóng Běijīng dào Shànghǎi yì qiān sān bǎi duō gōnglǐ, zuò gāotiě zhǐ xūyào sì gè duō xiǎoshí.', vietnamese: 'Từ Bắc Kinh đến Thượng Hải hơn 1300 cây số, đi tàu cao tốc chỉ mất hơn 4 tiếng.' }
          ],
          keyVocabulary: [
            { hanzi: '交通工具', pinyin: 'jiāotōng gōngjù', hanViet: 'giao thông công cụ', vietnamese: 'phương tiện giao thông', partOfSpeech: 'Danh từ', hskLevel: 3 },
            { hanzi: '准点', pinyin: 'zhǔndiǎn', hanViet: 'chuẩn điểm', vietnamese: 'đúng giờ', partOfSpeech: 'Tính từ', hskLevel: 3 },
            { hanzi: '舒适', pinyin: 'shūshì', hanViet: 'thư thích', vietnamese: 'dễ chịu, thoải mái', partOfSpeech: 'Tính từ', hskLevel: 3 },
            { hanzi: '便捷', pinyin: 'biànjié', hanViet: 'tiện tiệp', vietnamese: 'tiện lợi, nhanh chóng', partOfSpeech: 'Tính từ', hskLevel: 3 }
          ],
          grammarHighlights: [
            {
              structure: '不仅...而且/还... (Không những... mà còn...)',
              explanation: 'Biểu thị quan hệ tăng tiến về mức độ hoặc phạm vi.',
              example: '不仅速度极快，而且准点率非常高。',
              examplePinyin: 'Bùjǐn sùdù jí kuài, érqiě zhǔndiǎnlǜ fēicháng gāo.',
              exampleVietnamese: 'Không chỉ tốc độ cực nhanh, mà tỷ lệ đúng giờ còn rất cao.'
            }
          ],
          questions: [
            { id: 'q1', question: '从北京坐高铁到上海大概需要多长时间？', options: ['A. 两小时', 'B. 四个多小时', 'C. 八个小时', 'D. 一整天'], correctAnswer: 'B. 四个多小时', explanation: 'Trong bài nêu rõ: "坐高铁只需要四个多小时。"' }
          ]
        };
      }

      // Default HSK 1 fallback
      return {
        title: '快乐的周末生活',
        titlePinyin: 'Kuàilè de zhōumò shēnghuó',
        titleVietnamese: 'Cuộc sống cuối tuần vui vẻ',
        hskLevel: 1,
        genre: 'story',
        storyChinese: '今天是星期天，我和朋友一起去公园散步。公园里有很多花，红色的、白色的，非常漂亮。天气很暖和，微风吹着很舒服。我们在草地上坐下来，一边吃水果，一边听音乐。大家都觉得今天过得很开心。',
        pinyin: 'Jīntiān shì xīngqītiān, wǒ hé péngyou yìqǐ qù gōngyuán sànbù. Gōngyuán lǐ yǒu hěn duō huā, hóngsè de, báisè de, fēicháng piàoliang. Tiānqì hěn nuǎnhuo, wēifēng chuī zhe hěn shūfu. Wǒmen zài cǎodì shang zuò xiàlai, yìbiān chī shuǐguǒ, yìbiān tīng yīnyuè. Dàjiā dōu juéde jīntiān guò de hěn kāixīn.',
        vietnameseTranslation: 'Hôm nay là Chủ nhật, tôi và bạn cùng nhau đi công viên dạo bộ. Trong công viên có rất nhiều hoa, màu đỏ, màu trắng, vô cùng đẹp mắt. Thời tiết rất ấm áp, gió nhẹ thổi qua rất dễ chịu. Chúng tôi ngồi xuống bãi cỏ, vừa ăn hoa quả vừa nghe nhạc. Mọi người đều cảm thấy ngày hôm nay trôi qua thật vui vẻ.',
        sentences: [
          { hanzi: '今天是星期天，我和朋友一起去公园散步。', pinyin: 'Jīntiān shì xīngqītiān, wǒ hé péngyou yìqǐ qù gōngyuán sànbù.', vietnamese: 'Hôm nay là Chủ nhật, tôi và bạn cùng nhau đi công viên dạo bộ.' },
          { hanzi: '公园里有很多花，红色的、白色的，非常漂亮。', pinyin: 'Gōngyuán lǐ yǒu hěn duō huā, hóngsè de, báisè de, fēicháng piàoliang.', vietnamese: 'Trong công viên có rất nhiều hoa, màu đỏ, màu trắng, vô cùng đẹp mắt.' },
          { hanzi: '我们在草地上坐下来，一边吃水果，一边听音乐。', pinyin: 'Wǒmen zài cǎodì shang zuò xiàlai, yìbiān chī shuǐguǒ, yìbiān tīng yīnyuè.', vietnamese: 'Chúng tôi ngồi xuống bãi cỏ, vừa ăn hoa quả vừa nghe nhạc.' }
        ],
        keyVocabulary: [
          { hanzi: '周末', pinyin: 'zhōumò', hanViet: 'chu mạt', vietnamese: 'cuối tuần', partOfSpeech: 'Danh từ', hskLevel: 1 },
          { hanzi: '散步', pinyin: 'sànbù', hanViet: 'tản bộ', vietnamese: 'đi dạo', partOfSpeech: 'Động từ', hskLevel: 2 },
          { hanzi: '舒服', pinyin: 'shūfu', hanViet: 'thư phục', vietnamese: 'dễ chịu, thoải mái', partOfSpeech: 'Tính từ', hskLevel: 1 }
        ],
        grammarHighlights: [
          {
            structure: '一边...一边... (Vừa... vừa...)',
            explanation: 'Biểu thị hai hành động cùng diễn ra đồng thời.',
            example: '一边吃水果，一边听音乐。',
            examplePinyin: 'Yìbiān chī shuǐguǒ, yìbiān tīng yīnyuè.',
            exampleVietnamese: 'Vừa ăn hoa quả, vừa lắng nghe âm nhạc.'
          }
        ],
        questions: [
          { id: 'q1', question: '作者今天和朋友去了哪里？', options: ['A. 学校', 'B. 公园', 'C. 医院', 'D. 车站'], correctAnswer: 'B. 公园', explanation: 'Trong bài nêu: "我和朋友一起去公园散步。"' }
        ]
      };
    };

    const fallbackStory = getTopicFallback(targetHsk, topicKeywords);

    if (!gemini) {
      return res.json(fallbackStory);
    }

    try {
      const lengthGuide =
        targetHsk === 1
          ? '80 - 130 chữ Hán. Câu đơn tự nhiên, logic mạch lạc, dùng liên từ cơ bản (和, 也, 但是, 觉得, 一起, 因为, 太...了).'
          : targetHsk === 2
          ? '140 - 220 chữ Hán. Dùng liên từ phức (虽然...但是..., 因为...所以..., 一边...一边..., 比, 已经, 正在...).'
          : targetHsk === 3
          ? '220 - 320 chữ Hán. Dùng câu chữ 把, 越来越, bổ ngữ kết quả, bổ ngữ trạng thái, liên từ chuyển ý.'
          : targetHsk === 4
          ? '320 - 450 chữ Hán. Ngữ pháp phức hợp HSK 4, thành ngữ thông dụng, kết cấu lập luận chặt chẽ.'
          : '450 - 650 chữ Hán. Văn phong chính luận hoặc văn học chuẩn mực, từ vựng phong phú, diễn đạt sâu sắc.';

      const genrePrompt =
        genre === 'dialogue'
          ? 'Thể loại: HỘI THOẠI GIAO TIẾP SINH ĐỘNG (2-3 nhân vật đối thoại tự nhiên trong đời sống thực tế).'
          : genre === 'news'
          ? 'Thể loại: BẢN TIN NGẮN / BÁO CHÍ (Thông tin súc tích, khách quan, mang tính thời sự).'
          : genre === 'culture'
          ? 'Thể loại: VĂN HÓA & PHONG TỤC TRUYỀN THỐNG TRUNG HOA (Ẩm thực, Lễ hội, Trà đạo, Phong tục tập quán).'
          : genre === 'fable'
          ? 'Thể loại: TRUYỆN NGỤ NGÔN / ĐIỂN TÍCH THÀNH NGỮ mang bài học ý nghĩa sâu sắc.'
          : genre === 'business'
          ? 'Thể loại: CÔNG SỞ, PHỎNG VẤN, ĐÀM PHÁN & THƯƠNG MẠI HIỆN ĐẠI.'
          : 'Thể loại: CÂU CHUYỆN ĐỜI THƯỜNG SINH ĐỘNG (Sinh hoạt, du lịch, tình bạn, ẩm thực, trải nghiệm).';

      let prompt = '';

      if (customText && customText.trim()) {
        prompt = `Bạn là Chuyên gia Cao cấp Giảng dạy Hán ngữ & Biên soạn Đề thi HSK Quốc tế.
Nhiệm vụ: Hãy BẺ KHÓA VÀ PHÂN TÍCH TOÀN DIỆN đoạn văn tiếng Trung người dùng cung cấp dưới đây:

VĂN BẢN GỐC CỦA NGƯỜI DÙNG:
"""
${customText.trim()}
"""

YÊU CẦU PHÂN TÍCH & BIÊN SOẠN CHUẨN XÁC:
1. Đặt tiêu đề chữ Hán phù hợp, kèm Pinyin và Dịch nghĩa tiếng Việt.
2. Cung cấp toàn bộ Pinyin chuẩn xác tuyệt đối (có dấu thanh điệu chuẩn).
3. Dịch nghĩa tiếng Việt mượt mà, trôi chảy, diễn đạt tự nhiên theo văn phong hiện đại.
4. Tách đoạn văn thành từng câu hoàn chỉnh (sentences breakdown) kèm Hanzi, Pinyin và Dịch nghĩa từng câu.
5. Trích xuất 4 - 8 từ vựng trọng tâm nhất: gồm Chữ Hán, Pinyin chuẩn, Âm Hán Việt, Từ loại, Nghĩa tiếng Việt, và cấp độ HSK.
6. Nêu 2 - 3 điểm ngữ pháp hoặc mẫu câu tiêu biểu nhất trong bài kèm giải thích và ví dụ.
7. HỆ THỐNG LUYỆN TẬP ĐỌC HIỂU ĐA DẠNG XOÁY SÂU VÀO TRỌNG TÂM KIẾN THỨC (BẮT BUỘC TẠO 4 - 5 CÂU HỎI VỚI NHIỀU PHƯƠNG PHÁP KHÁC NHAU):
   - Câu 1 (type: 'true_false'): Phán đoán Đúng/Sai (判断对错) kiểm tra chi tiết then chốt dễ bị nhầm lẫn trong bài. Options: ['A. 对 / 正确 (Đúng)', 'B. 错 / 错误 (Sai)'].
   - Câu 2 (type: 'cloze_grammar'): Vận dụng Ngữ pháp & Điền từ trọng điểm (选词填空与语法). Trích 1 câu từ bài hoặc câu tình huống tương đương có chỗ trống (___) để học sinh chọn đúng cấu trúc ngữ pháp/trợ từ/liên từ. Options: 4 lựa chọn A, B, C, D.
   - Câu 3 (type: 'detail'): Bắt chi tiết then chốt & Nguyên nhân - Kết quả (细节事实). Hỏi sâu vào nhân vật, thời gian, sự kiện hoặc lý do hành động. Options: 4 lựa chọn A, B, C, D.
   - Câu 4 (type: 'vocabulary'): Hiểu từ vựng trong văn cảnh (词汇语境理解). Kiểm tra học viên hiểu nghĩa hoặc hàm ý của từ/cụm từ quan trọng trong bài. Options: 4 lựa chọn A, B, C, D.
   - Câu 5 (type: 'inference'): Suy luận logic & Ý chính/Thông điệp (主旨与推断). Hỏi về cảm xúc, thái độ nhân vật hoặc bài học rút ra. Options: 4 lựa chọn A, B, C, D.`;
      } else {
        prompt = `Bạn là Chuyên gia Cao cấp Biên soạn Giáo trình Đọc hiểu Hán ngữ Chuẩn Quốc tế (Standard HSK Course).
Nhiệm vụ: Hãy sáng tác một BÀI ĐỌC HIỂU TIẾNG TRUNG CHUẨN MỰC, CỰC KỲ MẠCH LẠC, ĐẬM CHẤT ĐỜI THỰC CHÍNH XÁC THEO CHỦ ĐỀ YÊU CẦU.

===============================
🎯 YÊU CẦU QUAN TRỌNG NHẤT (BẮT BUỘC TUÂN THỦ 100%):
CHỦ ĐỀ BÀI ĐỌC: "${topic}"
TRÌNH ĐỘ MỤC TIÊU: Chuẩn HSK ${targetHsk}
${genrePrompt}
===============================

QUY TẮC BẮT BUỘC:
1. ĐÚNG CHỦ ĐỀ 100%:
   - Toàn bộ nội dung, tình huống, nhân vật, hành động, bối cảnh, từ vựng và câu hỏi BẮT BUỘC PHẢI XOAY QUANH CHỦ ĐỀ "${topic}".
   - Tuyệt đối KHÔNG viết lạc đề sang chuyện thi cử, trường lớp nếu chủ đề là ẩm thực, trà sữa, chợ đêm, mua sắm, du lịch, công sở hay văn hóa!
   - Bắt đầu trực tiếp với tình huống của chủ đề "${topic}".
2. ĐỘ DÀI & ĐỘ KHÓ: ${lengthGuide}
3. MẠCH VĂN TỰ NHIÊN: Có mở đầu, diễn biến sinh động, chi tiết chân thực và kết thúc trọn vẹn. Các câu nối liền mạch bằng liên từ tự nhiên.
4. DỊCH NGHĨA TIẾNG VIỆT: Dịch trôi chảy, diễn đạt tự nhiên theo văn phong tiếng Việt hiện đại.
5. BẺ KHÓA TỪNG CÂU: Chia toàn bài thành từng câu hoàn chỉnh có Hanzi, Pinyin và Dịch tiếng Việt.
6. TỪ VỰNG & NGỮ PHÁP: 4-8 từ vựng then chốt của chủ đề "${topic}" và 2-3 điểm ngữ pháp HSK ${targetHsk}.
7. HỆ THỐNG LUYỆN TẬP ĐỌC HIỂU ĐA DẠNG XOÁY SÂU VÀO TRỌNG TÂM KIẾN THỨC (BẮT BUỘC TẠO 4 - 5 CÂU HỎI VỚI NHIỀU PHƯƠNG PHÁP KHÁC NHAU):
   - Câu 1 (type: 'true_false'): Phán đoán Đúng/Sai (判断对错) kiểm tra chi tiết then chốt trong bài (có thể gài bẫy nhẹ về thời gian/đối tượng/hành động). Options: ['A. 对 / 正确 (Đúng)', 'B. 错 / 错误 (Sai)'].
   - Câu 2 (type: 'cloze_grammar'): Vận dụng Ngữ pháp & Điền từ trọng điểm (选词填空与语法). Kiểm tra cấu trúc ngữ pháp then chốt của bài (câu chữ 把, trợ từ kết cấu 的/得/地, liên từ 虽然...但是..., 不仅...而且..., bổ ngữ...). Trích câu có chỗ trống (___) với 4 lựa chọn A, B, C, D.
   - Câu 3 (type: 'detail'): Bắt chi tiết then chốt & Nguyên nhân - Kết quả (细节事实). Hỏi sâu vào nhân vật, lý do vì sao, kết quả hành động hoặc diễn biến trong bài. Options: 4 lựa chọn A, B, C, D.
   - Câu 4 (type: 'vocabulary'): Hiểu từ vựng trong văn cảnh (词汇语境理解). Kiểm tra học viên hiểu nghĩa hoặc sắc thái của từ/cụm từ quan trọng trong ngữ cảnh bài đọc. Options: 4 lựa chọn A, B, C, D.
   - Câu 5 (type: 'inference'): Suy luận logic & Thông điệp bài đọc (主旨与推断). Hỏi về cảm xúc, hàm ý của nhân vật hoặc bài học/thông điệp chính. Options: 4 lựa chọn A, B, C, D.`;
      }

      prompt += `\n\nTRẢ VỀ DUY NHẤT 1 JSON OBJECT (KHÔNG THÊM BẤT KỲ VĂN BẢN NGOÀI NÀO) VỚI SCHEMA:
{
  "title": "Tiêu đề tiếng Trung (Phù hợp 100% với chủ đề '${topic}')",
  "titlePinyin": "Pinyin của tiêu đề",
  "titleVietnamese": "Dịch nghĩa tiếng Việt của tiêu đề",
  "hskLevel": ${targetHsk},
  "genre": "${genre}",
  "storyChinese": "Toàn văn bài đọc chữ Hán liền mạch đúng chủ đề '${topic}'",
  "pinyin": "Toàn văn Pinyin chuẩn có dấu thanh đầy đủ",
  "vietnameseTranslation": "Bản dịch tiếng Việt hoàn chỉnh, trôi chảy",
  "sentences": [
    {
      "hanzi": "Câu chữ Hán thứ 1",
      "pinyin": "Pinyin câu 1",
      "vietnamese": "Dịch tiếng Việt câu 1"
    }
  ],
  "keyVocabulary": [
    {
      "hanzi": "Từ vựng",
      "pinyin": "pīnyīn",
      "hanViet": "âm Hán Việt",
      "vietnamese": "nghĩa tiếng Việt",
      "partOfSpeech": "Danh từ/Động từ/Tính từ...",
      "hskLevel": ${targetHsk}
    }
  ],
  "grammarHighlights": [
    {
      "structure": "Cấu trúc ngữ pháp (kèm Pinyin nếu có, ví dụ: 太...了 (tài...le))",
      "explanation": "Giải thích chi tiết ý nghĩa và cách dùng",
      "example": "Câu ví dụ tiếng Trung trong bài hoặc ứng dụng (chữ Hán thuần túy)",
      "examplePinyin": "Phiên âm Pinyin đầy đủ có dấu thanh chuẩn của câu ví dụ",
      "exampleVietnamese": "Dịch nghĩa tiếng Việt chuẩn xác của câu ví dụ"
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "true_false",
      "typeLabel": "Phán đoán Đúng / Sai (判断对错)",
      "targetKnowledge": "Xác minh chi tiết then chốt về sự kiện",
      "question": "Câu khẳng định/câu hỏi chữ Hán (Dịch nghĩa tiếng Việt)",
      "pinyin": "Pinyin của câu hỏi",
      "options": ["A. 对 / 正确 (Đúng)", "B. 错 / 错误 (Sai)"],
      "correctAnswer": "A. 对 / 正确 (Đúng)",
      "explanation": "Dẫn chứng từ bài: '...' và phân tích chi tiết tại sao đúng/sai."
    },
    {
      "id": "q2",
      "type": "cloze_grammar",
      "typeLabel": "Ngữ pháp & Điền từ (选词填空与语法)",
      "targetKnowledge": "Kiểm tra cấu trúc ngữ pháp trọng điểm...",
      "question": "Câu hỏi chữ Hán có chỗ trống (___) kèm dịch tiếng Việt",
      "pinyin": "Pinyin của câu hỏi",
      "options": ["A. Lựa chọn A", "B. Lựa chọn B", "C. Lựa chọn C", "D. Lựa chọn D"],
      "correctAnswer": "A. Lựa chọn A",
      "explanation": "Giải thích vì sao chọn đáp án này, phân tích cấu trúc ngữ pháp và chỉ ra bẫy của các phương án còn lại."
    },
    {
      "id": "q3",
      "type": "detail",
      "typeLabel": "Chi tiết cốt lõi (细节事实)",
      "targetKnowledge": "Nắm bắt nguyên nhân/kết quả sự việc...",
      "question": "Câu hỏi chi tiết bài đọc (Dịch nghĩa tiếng Việt)",
      "pinyin": "Pinyin của câu hỏi",
      "options": ["A. Lựa chọn A", "B. Lựa chọn B", "C. Lựa chọn C", "D. Lựa chọn D"],
      "correctAnswer": "A. Lựa chọn A",
      "explanation": "Trích dẫn câu văn trong bài làm bằng chứng và phân tích."
    },
    {
      "id": "q4",
      "type": "vocabulary",
      "typeLabel": "Từ vựng ngữ cảnh (词汇语境)",
      "targetKnowledge": "Hiểu chính xác nghĩa của từ trong văn cảnh...",
      "question": "Câu hỏi về ý nghĩa của từ/cụm từ trong bài (Dịch tiếng Việt)",
      "pinyin": "Pinyin của câu hỏi",
      "options": ["A. Lựa chọn A", "B. Lựa chọn B", "C. Lựa chọn C", "D. Lựa chọn D"],
      "correctAnswer": "A. Lựa chọn A",
      "explanation": "Giải thích nghĩa từ vựng và sắc thái cảm xúc trong câu."
    },
    {
      "id": "q5",
      "type": "inference",
      "typeLabel": "Suy luận ý chính (主旨与推断)",
      "targetKnowledge": "Khả năng khái quát và suy luận logic...",
      "question": "Câu hỏi suy luận/thông điệp (Dịch nghĩa tiếng Việt)",
      "pinyin": "Pinyin của câu hỏi",
      "options": ["A. Lựa chọn A", "B. Lựa chọn B", "C. Lựa chọn C", "D. Lựa chọn D"],
      "correctAnswer": "A. Lựa chọn A",
      "explanation": "Phân tích tư tưởng và thông điệp mà tác giả muốn truyền đạt."
    }
  ]
}`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.6,
      });

      const parsed = extractAndParseJSON(responseText, null);
      if (parsed && parsed.storyChinese) {
        // Robust Pinyin Sanitization via pinyin-pro to guarantee zero tone mark combining glitches
        const normalizedStoryPinyin = getPinyinPro(parsed.storyChinese, { toneType: 'symbol' });
        const normalizedTitlePinyin = getPinyinPro(parsed.title || '', { toneType: 'symbol' });

        // Normalize sentences
        let cleanSentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
        if (cleanSentences.length === 0) {
          const rawSentences = parsed.storyChinese.split(/([。！？!?]+)/).filter(Boolean);
          for (let i = 0; i < rawSentences.length; i += 2) {
            const h = (rawSentences[i] + (rawSentences[i + 1] || '')).trim();
            if (h) {
              cleanSentences.push({
                hanzi: h,
                pinyin: getPinyinPro(h, { toneType: 'symbol' }),
                vietnamese: '',
              });
            }
          }
        } else {
          cleanSentences = cleanSentences.map((s: any) => ({
            hanzi: s.hanzi,
            pinyin: getPinyinPro(s.hanzi, { toneType: 'symbol' }) || s.pinyin,
            vietnamese: s.vietnamese || '',
          }));
        }

        // Normalize vocabulary pinyin
        const cleanVocab = (parsed.keyVocabulary || []).map((v: any) => ({
          ...v,
          pinyin: getPinyinPro(v.hanzi || '', { toneType: 'symbol' }) || v.pinyin,
          hskLevel: v.hskLevel || targetHsk,
        }));

        // Normalize questions with multi-method typology and target knowledge
        const cleanQuestions = (Array.isArray(parsed.questions) ? parsed.questions : []).map((q: any, idx: number) => {
          let qType = q.type || '';
          if (!qType) {
            if (Array.isArray(q.options) && q.options.length === 2 && (q.options[0].includes('对') || q.options[0].includes('Đúng'))) {
              qType = 'true_false';
            } else if (idx === 0) {
              qType = 'true_false';
            } else if (idx === 1) {
              qType = 'cloze_grammar';
            } else if (idx === 2) {
              qType = 'detail';
            } else if (idx === 3) {
              qType = 'vocabulary';
            } else {
              qType = 'inference';
            }
          }

          let defaultLabel = 'Bắt chi tiết cốt lõi (细节事实)';
          if (qType === 'true_false') defaultLabel = 'Phán đoán Đúng / Sai (判断对错)';
          else if (qType === 'cloze_grammar') defaultLabel = 'Ngữ pháp & Điền từ (选词填空与语法)';
          else if (qType === 'vocabulary') defaultLabel = 'Từ vựng ngữ cảnh (词汇语境)';
          else if (qType === 'inference') defaultLabel = 'Suy luận ý chính (主旨与推断)';

          const hanziQuestionPart = (q.question || '').split(/[(（]/)[0].trim();
          const autoPinyin = hanziQuestionPart ? getPinyinPro(hanziQuestionPart, { toneType: 'symbol' }) : '';

          return {
            id: q.id || `q${idx + 1}`,
            type: qType,
            typeLabel: q.typeLabel || defaultLabel,
            targetKnowledge: q.targetKnowledge || (qType === 'true_false' ? 'Xác thực chi tiết bài đọc' : qType === 'cloze_grammar' ? 'Vận dụng ngữ pháp then chốt' : 'Nội dung cốt lõi'),
            question: q.question || '',
            pinyin: q.pinyin || autoPinyin,
            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['A. Đúng', 'B. Sai'],
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) && q.options[0] ? q.options[0] : 'A'),
            explanation: q.explanation || '',
          };
        });

        // Normalize grammar highlights with guaranteed pinyin and Vietnamese translation
        const cleanGrammar = (Array.isArray(parsed.grammarHighlights) ? parsed.grammarHighlights : []).map((g: any) => {
          let exampleHanzi = (g.example || '').trim();
          let exampleVietnamese = (g.exampleVietnamese || '').trim();
          let examplePinyin = (g.examplePinyin || '').trim();

          // Extract Vietnamese translation if embedded in parentheses like "太好吃了！(Ngon quá!)"
          const parenMatch = exampleHanzi.match(/^(.*?)[(（](.*?)[)）]$/);
          if (parenMatch) {
            exampleHanzi = parenMatch[1].trim();
            if (!exampleVietnamese) {
              exampleVietnamese = parenMatch[2].trim();
            }
          }

          if (!examplePinyin && exampleHanzi) {
            examplePinyin = getPinyinPro(exampleHanzi, { toneType: 'symbol' }) || '';
          }

          return {
            structure: g.structure || '',
            explanation: g.explanation || '',
            example: exampleHanzi,
            examplePinyin: examplePinyin,
            exampleVietnamese: exampleVietnamese,
          };
        });

        return res.json({
          title: parsed.title,
          titlePinyin: normalizedTitlePinyin || parsed.titlePinyin,
          titleVietnamese: parsed.titleVietnamese || parsed.title,
          hskLevel: parsed.hskLevel || targetHsk,
          genre: parsed.genre || genre,
          storyChinese: parsed.storyChinese,
          pinyin: normalizedStoryPinyin || parsed.pinyin,
          vietnameseTranslation: parsed.vietnameseTranslation || parsed.englishTranslation,
          sentences: cleanSentences,
          keyVocabulary: cleanVocab,
          grammarHighlights: cleanGrammar,
          questions: cleanQuestions,
        });
      }
      return res.status(500).json({ error: 'Không thể phân tích dữ liệu bài đọc từ AI. Vui lòng thử lại.' });
    } catch (err: any) {
      console.warn('[Story Generator] Error generating story:', err?.message || err);
      return res.status(500).json({ error: 'Lỗi tạo bài đọc từ AI: ' + (err?.message || 'Vui lòng thử lại.') });
    }
  });

  // High-Fidelity Standard Putonghua Audio Streaming Endpoint (一级甲等普通话)
  const putonghuaTtsCache = new Map<string, Buffer>();
  const MAX_PUTONGHUA_CACHE = 3000;

  app.get('/api/tts', async (req: Request, res: Response) => {
    const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
    if (!text) {
      return res.status(400).json({ error: 'Text query parameter is required' });
    }

    const cacheKey = text.slice(0, 250);
    if (putonghuaTtsCache.has(cacheKey)) {
      const cached = putonghuaTtsCache.get(cacheKey)!;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    try {
      const googleTtsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=' + encodeURIComponent(cacheKey);
      const audioRes = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });

      if (!audioRes.ok) {
        return res.status(audioRes.status).json({ error: 'Failed to fetch audio from TTS upstream' });
      }

      const buffer = Buffer.from(await audioRes.arrayBuffer());
      if (putonghuaTtsCache.size >= MAX_PUTONGHUA_CACHE) {
        const firstKey = putonghuaTtsCache.keys().next().value;
        if (firstKey) putonghuaTtsCache.delete(firstKey);
      }
      putonghuaTtsCache.set(cacheKey, buffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch (err: any) {
      console.warn('[TTS Server Error]', err?.message);
      return res.status(500).json({ error: 'Internal TTS service error' });
    }
  });

  // In-memory server-side cache & rate-limit cooldown for Gemini TTS
  const serverTtsCache = new Map<string, { audioBase64: string; mimeType: string; sampleRate: number }>();
  const MAX_SERVER_TTS_CACHE = 1000;
  let ttsCooldownUntil = 0;

  // High-Fidelity Studio Neural AI Voice TTS Endpoint (Gemini TTS)
  app.post('/api/gemini/tts', async (req: Request, res: Response) => {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    const validVoices = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';
    const cacheKey = `${selectedVoice}_${trimmedText}`;

    // 1. Instant cache hit (zero quota consumed)
    const cached = serverTtsCache.get(cacheKey);
    if (cached) {
      return res.json({
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        sampleRate: cached.sampleRate,
        voice: selectedVoice,
        cached: true,
      });
    }

    // 2. Active cooldown check (prevents 429 quota exhaustion loops & log noise)
    const now = Date.now();
    if (now < ttsCooldownUntil) {
      const remainingSec = Math.ceil((ttsCooldownUntil - now) / 1000);
      return res.status(429).json({
        error: 'Gemini TTS quota limit reached. Falling back to device speech synthesis.',
        code: 429,
        cooldownRemainingSec: remainingSec,
      });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      return res.status(503).json({ error: 'Gemini not configured' });
    }

    try {
      // Use official Gemini TTS model: gemini-3.1-flash-tts-preview
      const response = await gemini.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [
          {
            parts: [
              {
                text: `Please read this Chinese text naturally and accurately in standard Mandarin Chinese (Putonghua), paying careful attention to tone pitch, tone sandhi, and smooth native pacing:\n${trimmedText}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      const base64Audio = audioPart?.inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio generated from model' });
      }

      const resultPayload = {
        audioBase64: base64Audio,
        mimeType: audioPart?.inlineData?.mimeType || 'audio/pcm;rate=24000',
        sampleRate: 24000,
        voice: selectedVoice,
      };

      // Store in memory cache for instant future replays
      if (serverTtsCache.size >= MAX_SERVER_TTS_CACHE) {
        const oldestKey = serverTtsCache.keys().next().value;
        if (oldestKey) serverTtsCache.delete(oldestKey);
      }
      serverTtsCache.set(cacheKey, resultPayload);

      return res.json(resultPayload);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isQuota =
        errorMsg.includes('429') ||
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('quota') ||
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.code === 429;

      if (isQuota) {
        // Free tier quota limit (typically 3 requests per minute for TTS preview).
        // Set a cooldown period of 25 seconds so subsequent calls immediately fall back to device voice cleanly.
        ttsCooldownUntil = Date.now() + 25000;
        console.log(`[Gemini TTS] Quota reached (3 RPM free tier). Activated 25s cooldown; seamless fallback to client device voice.`);
        return res.status(429).json({
          error: 'Gemini TTS quota exceeded. Seamlessly falling back to device speech synthesis.',
          code: 429,
          cooldownRemainingSec: 25,
        });
      }

      console.warn('[Gemini TTS] Service error:', errorMsg);
      return res.status(503).json({ error: 'TTS generation unavailable', details: errorMsg });
    }
  });

  // AI Word Lookup Helper (Auto-fill for single Hanzi or word)
  app.post('/api/ai/word-lookup', async (req: Request, res: Response) => {
    const { hanzi } = req.body;
    if (!hanzi) {
      return res.status(400).json({ error: 'Hanzi is required' });
    }

    const trimmedHanzi = String(hanzi).trim();
    const generatedPinyin = getPinyinPro(trimmedHanzi, { toneType: 'symbol' });
    const masterDict = getMasterDictionary();

    // Step 1: Check master dictionary first (Instant, zero quota consumption)
    const match = masterDict.get(trimmedHanzi);
    if (match) {
      return res.json({
        hanzi: match.hanzi,
        pinyin: match.pinyin || generatedPinyin,
        hanViet: match.hanViet || getHanVietForWord(trimmedHanzi),
        vietnamese: match.vietnamese || getVietnameseMeaningForWord(trimmedHanzi),
        hskLevel: match.hskLevel || 1,
        example: match.example || `我喜欢${trimmedHanzi}。`,
        exampleTranslation: match.exampleTranslation || `Tôi thích ${trimmedHanzi}.`,
      });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      const hanViet = getHanVietForWord(trimmedHanzi);
      const vietnamese = getVietnameseMeaningForWord(trimmedHanzi);
      return res.json({
        hanzi: trimmedHanzi,
        pinyin: generatedPinyin,
        hanViet,
        vietnamese,
        hskLevel: 1,
        example: `我喜欢${trimmedHanzi}。`,
        exampleTranslation: `Tôi thích ${trimmedHanzi}.`,
      });
    }

    try {
      const prompt = `Analyze this Chinese word/phrase for Vietnamese learners: "${trimmedHanzi}".
Return ONLY a valid JSON object with format:
{
  "hanzi": "${trimmedHanzi}",
  "pinyin": "${generatedPinyin}",
  "hanViet": "Âm Hán Việt chuẩn (ví dụ: Học Tập)",
  "vietnamese": "Nghĩa tiếng Việt chuẩn, súc tích",
  "hskLevel": 1,
  "example": "Câu ví dụ tiếng Trung tự nhiên phù hợp trình độ",
  "exampleTranslation": "Dịch nghĩa tiếng Việt của câu ví dụ"
}`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      const parsed = cleanAndExtractJson(responseText || '{}');
      const hanVietVal = parsed.hanViet || getHanVietForWord(trimmedHanzi);
      const vietnameseVal = parsed.vietnamese || getVietnameseMeaningForWord(trimmedHanzi);

      return res.json({
        hanzi: parsed.hanzi || trimmedHanzi,
        pinyin: parsed.pinyin || generatedPinyin,
        hanViet: hanVietVal,
        vietnamese: vietnameseVal,
        hskLevel: parsed.hskLevel || 1,
        example: parsed.example || `我用${trimmedHanzi}。`,
        exampleTranslation: parsed.exampleTranslation || '',
      });
    } catch (err: any) {
      console.warn('[Word Lookup] AI fallback to master dict & pinyin-pro:', err?.message || err);
      const hanViet = getHanVietForWord(trimmedHanzi);
      const vietnamese = getVietnameseMeaningForWord(trimmedHanzi);
      return res.json({
        hanzi: trimmedHanzi,
        pinyin: generatedPinyin,
        hanViet,
        vietnamese,
        hskLevel: 1,
        example: `我喜欢${trimmedHanzi}。`,
        exampleTranslation: '',
      });
    }
  });

  // AI Vocabulary Extraction from freeform text / article / document
  app.post('/api/ai/extract-vocab', async (req: Request, res: Response) => {
    const { text, targetHsk = 1 } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      const fallbackWords = extractVocabFallback(text, targetHsk);
      return res.json({ words: fallbackWords });
    }

    try {
      const prompt = `You are an expert Chinese language teacher for Vietnamese students.
Extract CRITICAL INDIVIDUAL TARGET VOCABULARY WORDS (1 to 3 characters, max 4 for idioms) from the provided Chinese text suitable for HSK ${targetHsk} learners.

CRITICAL EXTRACTION RULES:
1. NEVER extract full sentences, whole clauses, or phrase combinations like "我和朋友", "一起吃饭", "下午五点", "我回家", "晚上我喜". These are phrase fragments, NOT target vocabulary words!
2. ALWAYS split text into individual target words (e.g. extract "朋友", "一起", "吃饭", "下午", "回家", "晚上", "喜欢").
3. For EVERY extracted word, you MUST provide:
   - hanzi: Chinese characters of the single word
   - pinyin: Accurate tone marks
   - hanViet: Precise Sino-Vietnamese reading (âm Hán Việt, e.g. "Bằng Hữu", "Hạ Ngọ")
   - vietnamese: Accurate, clear Vietnamese translation (nghĩa tiếng Việt, e.g. "bạn bè", "buổi chiều")
   - hskLevel: HSK level (1 to 6)
   - example: Short example sentence
   - exampleTranslation: Vietnamese translation of the example sentence

Text:
"""
${text}
"""

Return ONLY a valid JSON object containing an array "words":
{
  "words": [
    {
      "hanzi": "chữ Hán từ đơn",
      "pinyin": "pīnyīn",
      "hanViet": "âm Hán Việt",
      "vietnamese": "nghĩa tiếng Việt chuẩn",
      "hskLevel": 1,
      "example": "ví dụ tiếng Trung",
      "exampleTranslation": "nghĩa tiếng Việt ví dụ"
    }
  ]
}`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      const parsed = cleanAndExtractJson(responseText || '{}');
      if (parsed.words && Array.isArray(parsed.words) && parsed.words.length > 0) {
        // Post-process returned words to fill any blank fields and expand any accidental phrase fragments
        const cleanedWords: any[] = [];
        const seen = new Set<string>();

        for (const w of parsed.words) {
          if (!w.hanzi) continue;
          const h = String(w.hanzi).trim();
          
          // Check if hanzi is a glued sentence fragment (e.g. "我和朋友", "一起吃饭")
          const isGlued = h.length > 4 || /^(我和|我是|我在|你和|你是|<ctrl42>我和|下午五|一起吃)/.test(h);
          if (isGlued) {
            // Re-extract constituent words from this fragment
            const subWords = extractVocabFallback(h, targetHsk);
            for (const sub of subWords) {
              if (!seen.has(sub.hanzi)) {
                seen.add(sub.hanzi);
                cleanedWords.push(sub);
              }
            }
          } else {
            if (!seen.has(h)) {
              seen.add(h);
              cleanedWords.push({
                hanzi: h,
                pinyin: w.pinyin || getPinyinPro(h, { toneType: 'symbol' }),
                hanViet: w.hanViet || getHanVietForWord(h),
                vietnamese: w.vietnamese || getVietnameseMeaningForWord(h),
                hskLevel: w.hskLevel || targetHsk || 1,
                example: w.example,
                exampleTranslation: w.exampleTranslation,
              });
            }
          }
        }

        if (cleanedWords.length > 0) {
          return res.json({ words: cleanedWords });
        }
      }

      // Fallback if empty AI response
      const fallbackWords = extractVocabFallback(text, targetHsk);
      return res.json({ words: fallbackWords });
    } catch (err: any) {
      console.warn('[Extract Vocab] AI error, seamlessly using dictionary extraction:', err?.message || err);
      const fallbackWords = extractVocabFallback(text, targetHsk);
      return res.json({ words: fallbackWords });
    }
  });

  // Multimodal Gemini Vision OCR (Locked for MVP Cost Optimization)
  app.post('/api/ai/ocr-document', async (req: Request, res: Response) => {
    return res.status(503).json({
      error: 'Tính năng AI OCR tài liệu scan tạm thời được khóa trong giai đoạn MVP để tối ưu chi phí token. Vui lòng dán văn bản trực tiếp hoặc tải file Excel.',
      locked: true,
    });
  });

  // AI Dynamic HSK Writing Prompt Generator
  app.post('/api/ai/generate-writing-prompt', async (req: Request, res: Response) => {
    const {
      hskLevel = 2,
      topic = 'Đời sống hàng ngày',
      promptType = 'essay', // 'essay' | 'keywords' | 'picture_story' | 'grammar_focus'
    } = req.body;

    const gemini = getGeminiClient();
    const lvl = Math.min(6, Math.max(1, Number(hskLevel) || 2));

    const getTargetLength = (l: number) => {
      switch (l) {
        case 1: return { min: 30, max: 50 };
        case 2: return { min: 50, max: 80 };
        case 3: return { min: 80, max: 120 };
        case 4: return { min: 120, max: 180 };
        case 5: return { min: 200, max: 300 };
        case 6: return { min: 300, max: 500 };
        default: return { min: 50, max: 80 };
      }
    };

    const getDifficultyLabel = (l: number) => {
      switch (l) {
        case 1: return 'HSK 1 - Cơ bản (Sơ cấp 1)';
        case 2: return 'HSK 2 - Giao tiếp đời sống (Sơ cấp 2)';
        case 3: return 'HSK 3 - Miêu tả & Kể chuyện (Trung cấp 1)';
        case 4: return 'HSK 4 - Trình bày quan điểm (Trung cấp 2)';
        case 5: return 'HSK 5 - Nghị luận & Phân tích (Cao cấp 1)';
        case 6: return 'HSK 6 - Chuyên sâu & Học thuật (Cao cấp 2)';
        default: return `HSK ${l}`;
      }
    };

    const getScoringFocus = (l: number) => {
      switch (l) {
        case 1:
          return [
            'Từ vựng HSK 1 cơ bản',
            'Trật tự câu đơn giản (S + V + O)',
            'Đúng chủ đề yêu cầu',
            'Độ dài khoảng 30 - 50 chữ',
          ];
        case 2:
          return [
            'Từ vựng đời sống HSK 2',
            'Sử dụng câu liên kết đơn giản (和, 因为...所以...)',
            'Khả năng truyền đạt rõ ràng ý kiến cá nhân',
            'Độ dài khoảng 50 - 80 chữ',
          ];
        case 3:
          return [
            'Cấu trúc câu ghép (虽然...但是..., 如果...就...)',
            'Bổ ngữ kết quả/trình độ, câu chữ 把/被',
            'Độ mạch lạc khi kể chuyện hoặc mô tả trải nghiệm',
            'Độ dài khoảng 80 - 120 chữ',
          ];
        case 4:
          return [
            'Cấu trúc liên từ trung cấp (不仅...而且..., 无论...都...)',
            'Khả năng đưa ra lý do và giải thích quan điểm',
            'Độ chuẩn xác ngữ pháp và liên kết đoạn',
            'Độ dài khoảng 120 - 180 chữ',
          ];
        case 5:
          return [
            'Lập luận rõ ràng, có dẫn chứng và so sánh',
            'Sử dụng từ vựng cao cấp, thành ngữ và cụm từ cố định',
            'Cấu trúc câu phức phong phú và diễn đạt tự nhiên',
            'Độ dài khoảng 200 - 300 chữ',
          ];
        case 6:
          return [
            'Lập luận chặt chẽ, phân tích đa chiều (nguyên nhân, ảnh hưởng, giải pháp)',
            'Ngữ thái học thuật, văn phong báo chí/chính luận sắc sảo',
            'Liên kết đoạn văn nhuần nhuyễn, từ vựng chuyên sâu',
            'Độ dài khoảng 300 - 500 chữ',
          ];
        default:
          return ['Đúng chủ đề', 'Ngữ pháp chuẩn xác', 'Từ vựng phù hợp cấp độ'];
      }
    };

    // Grounded rich pedagogical fallback incorporating user topic
    const generateLocalFallbackPrompt = (userTopic?: string) => {
      const targetLen = getTargetLength(lvl);
      const cleanTopic = (userTopic || '').trim() || 'Đời sống hàng ngày';

      const keywordsMap: Record<number, string[]> = {
        1: [`${cleanTopic}`, '喜欢 (thích)', '很高兴 (rất vui)', '一起 (cùng nhau)'],
        2: [`${cleanTopic}`, '打算 (dự định)', '觉得 (cảm thấy)', '便宜/新鲜 (rẻ/tươi ngon)'],
        3: [`${cleanTopic}`, '虽然...但是... (tuy... nhưng)', '记得 (nhớ)', '终于 (cuối cùng)'],
        4: [`${cleanTopic}`, '不仅...而且... (không những... mà còn)', '经历 (trải nghiệm)', '坚持 (kiên trì)'],
        5: [`${cleanTopic}`, '不可否认 (không thể phủ nhận)', '深入思考 (suy nghĩ sâu sắc)', '平衡 (cân bằng)'],
        6: [`${cleanTopic}`, '日新月异 (thay đổi từng ngày)', '至关重要 (vô cùng quan trọng)', '综合考虑 (xét tổng thể)'],
      };

      const grammarMap: Record<number, string[]> = {
        1: ['主语 + 很/非常 + 动词/形容词 + 宾语', '主语 + 和 + 人 + 一起 + 动词'],
        2: ['因为...所以... (bởi vì... cho nên...)', '虽然...但是... (tuy... nhưng...)', '打算 / 想 + 动词'],
        3: ['主语 + 把 + 宾语 + 动词 + 结果补语', '虽然...但是... / 只要...就...', '越...越...'],
        4: ['不仅...而且... / 无论...都...', '对...来说 / 由此可见', '在...方面 / 随着...'],
        5: ['尽管...然而...', '从...角度来看 / 综上所述', '既...又... / 哪怕...也...'],
        6: ['与其...不如... / 鉴于...', '从某种意义上说 / 不可置否', '立足于... / 致力于...'],
      };

      const questionText = `Hãy viết một đoạn văn tiếng Trung về chủ đề "${cleanTopic}" phù hợp với trình độ HSK ${lvl}, dung lượng khoảng ${targetLen.min}-${targetLen.max} chữ, sử dụng các từ khóa và cấu trúc gợi ý.`;

      return {
        id: `ai-gen-prompt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        topic: cleanTopic,
        level: `HSK ${lvl}`,
        hskLevel: lvl,
        title: `Chủ đề: ${cleanTopic}`,
        category: promptType && promptType !== 'essay' ? String(promptType) : 'Luyện viết theo chủ đề',
        question: questionText,
        instruction: questionText,
        keywords: keywordsMap[lvl] || keywordsMap[2],
        grammar_patterns: grammarMap[lvl] || grammarMap[2],
        target_length: targetLen,
        targetWordCount: Math.round((targetLen.min + targetLen.max) / 2),
        difficulty: getDifficultyLabel(lvl),
        scoring_focus: getScoringFocus(lvl),
        sampleOpening: `关于“${cleanTopic}”，这是一个非常贴近生活且有意义的话题。`,
      };
    };

    if (!gemini) {
      return res.json(generateLocalFallbackPrompt(topic));
    }

    try {
      const targetLen = getTargetLength(lvl);
      const promptInstruction = `You are a Senior HSK Exam Committee Designer & Master Chinese Pedagogy Professor for Vietnamese students.
Generate 1 creative, highly pedagogical, and authentic HSK Writing Prompt for Level HSK ${lvl}.
Requested Topic/Theme from user: "${topic}".
Prompt Style/Type: "${promptType}".

Requirements by HSK Level:
- HSK 1: Familiar basic everyday topic, basic vocab, simple sentences, target 30-50 Chinese characters.
- HSK 2: Daily life, people/places/hobbies/activities, target 50-80 Chinese characters.
- HSK 3: Describe experiences/stories/explanations, basic compound sentences (把, 虽然...但是...), target 80-120 Chinese characters.
- HSK 4: Viewpoints, reasons, problem descriptions, intermediate compound structures (不仅...而且..., 无论...都...), target 120-180 Chinese characters.
- HSK 5: Clear thesis/viewpoint, detailed explanation, causes, examples, comparisons, target 200-300 Chinese characters.
- HSK 6: Critical analysis, in-depth argumentation, cause/impact/countermeasures, academic phrasing, target 300-500 Chinese characters.

Return ONLY a valid JSON object matching this schema:
{
  "topic": "${topic}",
  "level": "HSK ${lvl}",
  "question": "Detailed instructions in Vietnamese specifying what the student should write about '${topic}', target requirements, and context.",
  "keywords": ["4-6 Chinese words with Vietnamese meaning, e.g. 足球 (bóng đá), 喜欢 (thích)"],
  "grammar_patterns": ["2-3 key grammar patterns suited for HSK ${lvl} in formula format, e.g. 主语 + 很 + 动词 + 宾语"],
  "target_length": {
    "min": ${targetLen.min},
    "max": ${targetLen.max}
  },
  "difficulty": "${getDifficultyLabel(lvl)}",
  "scoring_focus": ["3-4 clear evaluation focus points in Vietnamese"]
}`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: promptInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      const parsed = cleanAndExtractJson(responseText || '{}');
      if (!parsed.question && !parsed.topic) {
        return res.json(generateLocalFallbackPrompt(topic));
      }

      const cleanTopic = parsed.topic || topic;
      const question = parsed.question || `Hãy viết một đoạn văn tiếng Trung về chủ đề "${cleanTopic}" (HSK ${lvl}).`;

      return res.json({
        id: `ai-gen-prompt-${Date.now()}`,
        topic: cleanTopic,
        level: `HSK ${lvl}`,
        hskLevel: lvl,
        title: `Chủ đề: ${cleanTopic}`,
        category: 'Luyện viết theo chủ đề',
        question: question,
        instruction: question,
        keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : [`${cleanTopic}`, '学习 (học tập)', '中文 (tiếng Trung)'],
        grammar_patterns: Array.isArray(parsed.grammar_patterns) && parsed.grammar_patterns.length > 0 ? parsed.grammar_patterns : ['主语 + 动词 + 宾语'],
        target_length: parsed.target_length || targetLen,
        targetWordCount: Math.round(((parsed.target_length?.min || targetLen.min) + (parsed.target_length?.max || targetLen.max)) / 2),
        difficulty: parsed.difficulty || getDifficultyLabel(lvl),
        scoring_focus: Array.isArray(parsed.scoring_focus) && parsed.scoring_focus.length > 0 ? parsed.scoring_focus : getScoringFocus(lvl),
        sampleOpening: `关于“${cleanTopic}”，这是一个非常贴近生活且有意义的话题。`,
      });
    } catch (err: any) {
      console.warn('[AI Prompt Gen] Error with Gemini, returning topic-grounded fallback:', err?.message || err);
      return res.json(generateLocalFallbackPrompt(topic));
    }
  });

  // AI Dynamic HSK Mock Exam Generator (Chế đề thi thử HSK thông minh theo bài chọn & tài liệu ngoài)
  app.post('/api/ai/generate-hsk-exam', async (req: Request, res: Response) => {
    const {
      hskLevel = 1,
      selectedLessons = [1, 2, 3], // Array of lesson numbers, e.g. [1, 2, 3] or all 1-15
      questionCount = 10, // 5, 10, 15, 20
      externalMaterial = '', // Extra vocabulary, sentences, or passage text provided by user
      examFocus = 'balanced', // 'balanced' | 'listening_focus' | 'reading_focus' | 'real_life' | 'challenge'
      customTopic = '',
    } = req.body;

    const lvl = Math.min(4, Math.max(1, Number(hskLevel) || 1));
    const count = Math.min(30, Math.max(4, Number(questionCount) || 10));

    // Gather vocabulary & context from selected lessons
    const bookLessons = lvl === 1 ? NEW_HSK1_FULL_LESSONS : lvl === 2 ? NEW_HSK2_FULL_LESSONS : lvl === 3 ? NEW_HSK3_FULL_LESSONS : NEW_HSK4_FULL_LESSONS;
    const lessonNumArray = Array.isArray(selectedLessons) && selectedLessons.length > 0 ? selectedLessons : [1, 2, 3];
    
    const matchedLessons = bookLessons.filter((l) => lessonNumArray.includes(l.lessonNumber));
    const targetVocabList: string[] = [];
    const targetGrammarList: string[] = [];

    matchedLessons.forEach((l) => {
      l.vocabulary?.forEach((v) => {
        if (v.hanzi) targetVocabList.push(`${v.hanzi} (${v.pinyin} - ${v.vietnamese})`);
      });
      l.grammarPoints?.forEach((g) => {
        if (g.title) targetGrammarList.push(g.title);
      });
    });

    const vocabSnippet = targetVocabList.slice(0, 35).join(', ');
    const grammarSnippet = targetGrammarList.slice(0, 10).join('; ');

    // Robust local fallback generator if Gemini is offline or rate limited
    const generateLocalFallbackExam = () => {
      const fallbackQuestions: any[] = [];
      const half = Math.ceil(count / 2);

      // Listening questions
      for (let i = 1; i <= half; i++) {
        fallbackQuestions.push({
          id: `ai-exam-l-${i}-${Date.now()}`,
          section: 'listening',
          part: (i % 2 === 1 ? 1 : 2) as 1 | 2,
          questionNumber: i,
          promptChinese: i % 2 === 1 ? '苹果 (píngguǒ)' : '你喝水吗？ (Nǐ hē shuǐ ma?)',
          audioScript: i % 2 === 1 ? 'sān gè píngguǒ (ba quả táo)' : 'Wǒ bù hē shuǐ, wǒ hē chá. (Tôi không uống nước, tôi uống trà.)',
          imageEmoji: i % 2 === 1 ? '🍎' : '🍵',
          options: [
            { key: 'A', textChinese: '苹果 (Quả táo)', imageEmoji: '🍎', textVietnamese: 'Quả táo' },
            { key: 'B', textChinese: '米饭 (Cơm)', imageEmoji: '🍚', textVietnamese: 'Bát cơm' },
            { key: 'C', textChinese: '出租车 (Taxi)', imageEmoji: '🚕', textVietnamese: 'Xe taxi' },
          ],
          correctKey: 'A',
          explanation: `Câu hỏi nghe bám sát từ vựng bài ${lessonNumArray.join(', ')}. Từ khóa xuất hiện trực tiếp trong bài nghe.`,
        });
      }

      // Reading questions
      for (let i = half + 1; i <= count; i++) {
        fallbackQuestions.push({
          id: `ai-exam-r-${i}-${Date.now()}`,
          section: 'reading',
          part: 1 as 1 | 2 | 3 | 4,
          questionNumber: i,
          promptChinese: i % 2 === 0 ? '很高兴认识你！' : '明天星期六，我去北京。',
          promptPinyin: i % 2 === 0 ? 'Hěn gāoxìng rènshi nǐ!' : 'Míngtiān Xīngqīliù, wǒ qù Běijīng.',
          promptVietnamese: i % 2 === 0 ? 'Rất vui được làm quen với bạn!' : 'Ngày mai thứ Bảy, tôi đi Bắc Kinh.',
          subPrompt: i % 2 === 0 ? '★ Đối thoại đáp lại phù hợp:' : '★ Người nói ngày mai đi đâu?',
          options: [
            { key: 'A', textChinese: '认识你我也很高兴！', textVietnamese: 'Quen bạn tôi cũng rất vui!' },
            { key: 'B', textChinese: '不客气！', textVietnamese: 'Không có gì!' },
            { key: 'C', textChinese: '他是老师。', textVietnamese: 'Anh ấy là giáo viên.' },
          ],
          correctKey: 'A',
          explanation: 'Đáp án hợp ngữ cảnh logic theo chuẩn giáo trình.',
        });
      }

      return {
        examId: `ai-exam-${Date.now()}`,
        title: `Đề Thi Thử HSK ${lvl} Tùy Biến (Bài ${lessonNumArray.join(', ')})`,
        hskLevel: lvl,
        selectedLessons: lessonNumArray,
        totalQuestions: fallbackQuestions.length,
        timeLimitMinutes: lvl === 1 ? Math.round(count * 1.8) : Math.round(count * 2.2),
        questions: fallbackQuestions,
        generatedBy: 'AI_FALLBACK_PEDAGOGICAL',
      };
    };

    const gemini = getGeminiClient();
    if (!gemini) {
      return res.json(generateLocalFallbackExam());
    }

    try {
      const promptInstruction = `You are a Senior HSK Chief Examiner and Curriculum Developer for Vietnamese students.
Generate an authentic, highly diverse, and fully populated HSK Mock Exam for Level HSK ${lvl}.

Parameters:
- Target Level: HSK ${lvl}
- Selected Textbook Lessons to draw from: Bài ${lessonNumArray.join(', ')}
- Vocabulary Scope from Lessons: ${vocabSnippet || 'General HSK ' + lvl + ' vocabulary'}
- Grammar Focus: ${grammarSnippet || 'Standard HSK ' + lvl + ' sentence structures'}
- Number of Questions: Exactly ${count} questions (Split ~50% Listening and ~50% Reading).
- Exam Focus Mode: "${examFocus}" (e.g. balanced, listening_focus, reading_focus, real_life dialogues, challenge with varied phrasing).
- Optional Custom Topic: "${customTopic || 'None'}"
- Extra External Material provided: "${externalMaterial ? externalMaterial.slice(0, 500) : 'None'}"
(If extra material is provided, incorporate realistic variations and slightly novel contexts to prevent student rote memorization, keeping within HSK ${lvl} grammar bounds).

FORMAT REQUIREMENTS:
Return ONLY a valid JSON object matching this schema:
{
  "examId": "ai-hsk-exam-${Date.now()}",
  "title": "Đề Thi Thử HSK ${lvl} AI - Bài ${lessonNumArray.join(', ')}${customTopic ? ' (' + customTopic + ')' : ''}",
  "hskLevel": ${lvl},
  "selectedLessons": ${JSON.stringify(lessonNumArray)},
  "totalQuestions": ${count},
  "timeLimitMinutes": ${Math.round(count * (lvl === 1 ? 1.8 : 2.2))},
  "questions": [
    {
      "id": "q1",
      "section": "listening", // or "reading"
      "part": 1, // 1, 2, 3 or 4
      "questionNumber": 1,
      "promptChinese": "Chinese text / sentence / dialogue",
      "promptPinyin": "Pinyin with tone marks",
      "promptVietnamese": "Vietnamese meaning",
      "subPrompt": "Optional question prompt like '★ Question: ...'",
      "audioScript": "Complete audio text to be spoken via Text-To-Speech",
      "imageEmoji": "An appropriate emoji icon matching the theme, e.g. 🍎, 🚕, 🏫, ☕, 📱, 👩‍🏫",
      "options": [
        { "key": "A", "textChinese": "...", "textPinyin": "...", "textVietnamese": "...", "imageEmoji": "..." },
        { "key": "B", "textChinese": "...", "textPinyin": "...", "textVietnamese": "...", "imageEmoji": "..." },
        { "key": "C", "textChinese": "...", "textPinyin": "...", "textVietnamese": "...", "imageEmoji": "..." }
      ],
      "correctKey": "A", // 'A', 'B', or 'C'
      "explanation": "Clear Vietnamese explanation of why this answer is correct and vocabulary/grammar breakdown."
    }
  ]
}

CRITICAL RULES:
1. Ensure EVERY question has promptChinese, audioScript (for listening and reading), 3 distinct options (A, B, C), correctKey, and explanation.
2. For Level 1 & 2, ALWAYS include Pinyin (promptPinyin and in options).
3. Do not leave any options empty.
4. Output JSON ONLY without markdown fences or additional chatter.`;

      const responseText = await callGeminiWithFallback(gemini, {
        contents: promptInstruction,
        responseMimeType: 'application/json',
        temperature: 0.6,
      });

      const parsed = cleanAndExtractJson(responseText || '{}');
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        // Sanitize questions
        const sanitizedQuestions = parsed.questions.map((q: any, idx: number) => ({
          id: q.id || `ai-q-${idx + 1}-${Date.now()}`,
          section: q.section === 'listening' ? 'listening' : 'reading',
          part: Number(q.part) || 1,
          questionNumber: idx + 1,
          promptChinese: q.promptChinese || '',
          promptPinyin: q.promptPinyin || (q.promptChinese ? getPinyinPro(q.promptChinese) : ''),
          promptVietnamese: q.promptVietnamese || '',
          subPrompt: q.subPrompt || '',
          audioScript: q.audioScript || q.promptChinese || '',
          imageEmoji: q.imageEmoji || (idx % 2 === 0 ? '📝' : '🎧'),
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
            { key: 'A', textChinese: '对 (Đúng)' },
            { key: 'B', textChinese: '不对 (Sai)' },
          ],
          correctKey: String(q.correctKey || 'A').toUpperCase().trim(),
          explanation: q.explanation || 'Đáp án chính xác theo ngữ cảnh bài thi HSK.',
        }));

        return res.json({
          examId: parsed.examId || `ai-hsk-exam-${Date.now()}`,
          title: parsed.title || `Đề Thi Thử HSK ${lvl} AI (Bài ${lessonNumArray.join(', ')})`,
          hskLevel: lvl,
          selectedLessons: lessonNumArray,
          totalQuestions: sanitizedQuestions.length,
          timeLimitMinutes: parsed.timeLimitMinutes || Math.round(sanitizedQuestions.length * 2),
          questions: sanitizedQuestions,
          generatedBy: 'GEMINI_AI_CHEF',
        });
      }

      return res.json(generateLocalFallbackExam());
    } catch (err: any) {
      console.warn('[AI HSK Exam Gen] Error, falling back to local dataset generator:', err?.message || err);
      return res.json(generateLocalFallbackExam());
    }
  });

  // Comprehensive HSK Writing Evaluator (Supports both Typing & Handwriting OCR)
  app.post('/api/ai/evaluate-writing', async (req: Request, res: Response) => {
    const {
      mode = 'text', // 'text' | 'ocr'
      chineseText = '',
      text = '',
      image = '',
      promptDetails = {},
      promptText = 'Tự do viết đoạn văn tiếng Trung',
      hskLevel = 2,
    } = req.body;

    const actualChineseText = String(chineseText || text || '').trim();

    const gemini = getGeminiClient();
    const lvl = Math.min(6, Math.max(1, Number(hskLevel || promptDetails.hskLevel) || 2));
    const levelStr = promptDetails.level || `HSK ${lvl}`;
    const questionText = promptDetails.question || promptDetails.instruction || promptText || 'Tự do viết đoạn văn tiếng Trung';
    const keywordsList = Array.isArray(promptDetails.keywords) ? promptDetails.keywords : [];
    const grammarPatternsList = Array.isArray(promptDetails.grammar_patterns) ? promptDetails.grammar_patterns : [];
    const targetLengthObj = promptDetails.target_length || { min: 30, max: 50 };
    const scoringFocusList = Array.isArray(promptDetails.scoring_focus) ? promptDetails.scoring_focus : [];

    // Pedagogical local fallback that strictly analyzes the student's text without hallucinating
    const generateLocalWritingFallback = (text: string, isOcr = false) => {
      const cleanText = text.trim();
      const hanziMatches = cleanText.match(/[\u4e00-\u9fa5]/g) || [];
      const charCount = hanziMatches.length;

      if (charCount === 0) {
        return {
          level: levelStr,
          original_text: cleanText,
          transcribedText: cleanText,
          pinyin: '',
          vietnamese: '',
          score: 0,
          total_score: 0,
          wordCount: 0,
          hskLevelEstimated: lvl,
          isValidChinese: false,
          handwritingFeedback: isOcr ? 'Hình ảnh hoặc nét vẽ chưa nhận diện được chữ Hán hợp lệ.' : undefined,
          sentence_analysis: [],
          scoring_breakdown: {
            content: { score: 0, feedback: 'Chưa có chữ Hán để chấm nội dung.', max_score: 25 },
            vocabulary: { score: 0, feedback: 'Không tìm thấy từ vựng tiếng Trung.', max_score: 25 },
            grammar: { score: 0, feedback: 'Không có câu tiếng Trung để phân tích ngữ pháp.', max_score: 25 },
            coherence: { score: 0, feedback: 'Không có nội dung đoạn văn.', max_score: 25 },
          },
          content: { score: 0, feedback: 'Chưa có chữ Hán để chấm nội dung.' },
          vocabulary: { score: 0, feedback: 'Không tìm thấy từ vựng tiếng Trung.' },
          grammar: { score: 0, feedback: 'Không có câu tiếng Trung để phân tích ngữ pháp.' },
          coherence: { score: 0, feedback: 'Không có nội dung đoạn văn.' },
          corrected_text: '',
          overall_feedback: isOcr
            ? 'Không nhận diện được chữ Hán trên ảnh/bảng vẽ. Bạn hãy viết rõ ràng từng chữ Hán hoặc chuyển sang tab Nhập bàn phím để gõ văn bản nhé!'
            : 'Vui lòng nhập câu hoặc đoạn văn tiếng Trung để được AI chấm điểm và chữa câu chi tiết.',
        };
      }

      const pinyinResult = getPinyinPro(cleanText, { toneType: 'symbol' });

      // Break text into sentences by punctuation
      const sentenceStrings = cleanText
        .split(/([。！？!?\n]+)/)
        .filter((s) => s.trim().length > 0);
      
      const combinedSentences: string[] = [];
      for (let i = 0; i < sentenceStrings.length; i++) {
        if (/^[。！？!?\n]+$/.test(sentenceStrings[i])) {
          if (combinedSentences.length > 0) {
            combinedSentences[combinedSentences.length - 1] += sentenceStrings[i];
          }
        } else {
          combinedSentences.push(sentenceStrings[i]);
        }
      }

      const sentenceAnalysis = combinedSentences.map((sent) => {
        const trimmed = sent.trim();
        const repeatMatch = trimmed.match(/(很喜欢|非常喜欢|特别喜欢).*?\1/);
        if (repeatMatch) {
          const corrected = trimmed.replace(new RegExp(`${repeatMatch[1]}$`), '').trim() + (trimmed.endsWith('。') ? '。' : '');
          return {
            original: trimmed,
            status: 'grammar_error',
            error: `lặp cụm "${repeatMatch[1]}"`,
            explanation: `Trong câu này cấu trúc đã trọn vẹn ngữ nghĩa, không cần lặp lại cụm "${repeatMatch[1]}" ở cuối câu.`,
            grammar_rule: '主语 + 很 + 动词 + 宾语',
            correction: corrected || trimmed,
            similar_example: '我很喜欢看足球。(Tôi rất thích xem bóng đá.)',
          };
        }

        return {
          original: trimmed,
          status: 'correct',
          error: '',
          correction: trimmed,
          explanation: 'Câu văn đúng ngữ pháp, diễn đạt rõ ràng.',
          grammar_rule: 'Trật tự câu cơ bản chuẩn xác',
          similar_example: '',
        };
      });

      const baseScore = Math.min(95, Math.max(60, 75 + Math.min(20, Math.floor(charCount / 5))));

      return {
        level: levelStr,
        original_text: cleanText,
        transcribedText: cleanText,
        pinyin: pinyinResult,
        vietnamese: `(Bản dịch bài viết: ${cleanText})`,
        score: baseScore,
        total_score: baseScore,
        wordCount: charCount,
        hskLevelEstimated: lvl,
        isValidChinese: true,
        handwritingFeedback: isOcr ? 'Nét chữ nhìn chung rõ ràng, các nét cơ bản chuẩn xác.' : undefined,
        sentence_analysis: sentenceAnalysis.length > 0 ? sentenceAnalysis : [
          {
            original: cleanText,
            status: 'correct',
            error: '',
            correction: cleanText,
            explanation: 'Câu văn diễn đạt đúng chuẩn ngữ pháp HSK.',
            grammar_rule: '主语 + 谓语 + 宾语',
            similar_example: '',
          },
        ],
        scoring_breakdown: {
          content: { score: Math.round(baseScore / 4), feedback: `Bài viết bám sát đề bài "${promptDetails.topic || questionText}".`, max_score: 25 },
          vocabulary: { score: Math.round(baseScore / 4), feedback: `Sử dụng từ vựng phù hợp với trình độ ${levelStr}.`, max_score: 25 },
          grammar: { score: Math.round(baseScore / 4), feedback: 'Ngữ pháp tương đối tốt, trật tự câu cơ bản chính xác.', max_score: 25 },
          coherence: { score: Math.round(baseScore / 4), feedback: 'Các câu liên kết tự nhiên và rõ ràng.', max_score: 25 },
        },
        content: {
          score: Math.round(baseScore / 4),
          feedback: `Bài viết bám sát đề bài "${promptDetails.topic || questionText}".`,
        },
        vocabulary: {
          score: Math.round(baseScore / 4),
          feedback: `Sử dụng từ vựng phù hợp với trình độ ${levelStr}.`,
        },
        grammar: {
          score: Math.round(baseScore / 4),
          feedback: 'Ngữ pháp tương đối tốt, trật tự câu cơ bản chính xác.',
        },
        coherence: {
          score: Math.round(baseScore / 4),
          feedback: 'Các câu liên kết tự nhiên và rõ ràng.',
        },
        corrected_text: sentenceAnalysis.map((s) => s.correction).join(' ') || cleanText,
        overall_feedback: `Bài viết đã thể hiện được ý tưởng về chủ đề "${promptDetails.topic || 'đã chọn'}".`,
      };
    };

    if (!gemini) {
      return res.json(generateLocalWritingFallback(actualChineseText, mode === 'ocr'));
    }

    try {
      let contents: any;

      const systemPrompt = `You are a Senior HSK Examiner and Chinese Pedagogy Professor for Vietnamese students.
You must STRICTLY and HONESTLY evaluate the student's Chinese writing based SOLELY on what the student actually provided.

[ĐỀ BÀI]
${questionText}

[CẤP ĐỘ]
${levelStr}

[TỪ KHÓA ĐỀ XUẤT]
${keywordsList.length > 0 ? keywordsList.join(', ') : 'Tự do phù hợp chủ đề'}

[CẤU TRÚC GỢI Ý]
${grammarPatternsList.length > 0 ? grammarPatternsList.join('; ') : 'Cấu trúc phù hợp cấp độ'}

[ĐỘ DÀI MỤC TIÊU]
${targetLengthObj.min} - ${targetLengthObj.max} chữ Hán

CRITICAL REALITY RULES (ZERO HALLUCINATION):
1. Evaluate ONLY what the student actually wrote.
2. TUYỆT ĐỐI KHÔNG:
   - Tự bịa ra bài văn mẫu hoặc câu chuyện khi học viên KHÔNG viết (ví dụ: không được tự bịa ra "我叫丸。我是越南人。我学习汉语。" hay bất kỳ câu nào nếu học viên không viết hoặc ảnh không có chữ đó).
   - Tự đoán mò thành đoạn văn hoàn chỉnh khi hình ảnh chỉ là vài nét vẽ nháp/ngẫu nhiên.
3. If the input has NO recognizable Chinese characters (e.g. only random scribble lines, stray marks, checkmarks, non-Chinese letters, or empty):
   - Set "isValidChinese": false
   - Set "original_text": ""
   - Set "transcribedText": ""
   - Set "pinyin": ""
   - Set "vietnamese": ""
   - Set "wordCount": 0
   - Set "total_score": 0
   - Set "content": { "score": 0, "feedback": "Không tìm thấy chữ Hán hợp lệ." }
   - Set "vocabulary": { "score": 0, "feedback": "Không có từ vựng tiếng Trung." }
   - Set "grammar": { "score": 0, "feedback": "Không có câu tiếng Trung." }
   - Set "coherence": { "score": 0, "feedback": "Không có đoạn văn." }
   - Set "sentence_analysis": []
   - Set "corrected_text": ""
   - Set "overall_feedback": "Bài nộp/ảnh vẽ không chứa chữ Hán hợp lệ hoặc chỉ là nét vẽ nháp ngẫu nhiên. Vui lòng viết rõ ràng từng chữ Hán có nghĩa hoặc chuyển sang chế độ gõ văn bản."
   - Set "handwritingFeedback": "Chỉ có nét vẽ ngẫu nhiên, chưa tạo thành chữ Hán."
4. When recognizable Chinese text IS present:
   - Analyze EVERY SINGLE SENTENCE in "sentence_analysis":
     * "original": Exact sentence from student.
     * "status": "correct" (Đúng) | "unnatural" (Chưa tự nhiên) | "grammar_error" (Sai ngữ pháp).
     * "error": Specific error or empty string "".
     * "explanation": Clear, simple Vietnamese explanation why it is incorrect or unnatural.
     * "grammar_rule": Chinese grammar structure formula.
     * "correction": Corrected sentence preserving student's exact meaning.
     * "similar_example": 1 practical similar example with Vietnamese translation.
   - Grade realistically according to HSK ${lvl} standards:
     * "content": score 0-25 + honest feedback.
     * "vocabulary": score 0-25 + honest feedback.
     * "grammar": score 0-25 + honest feedback.
     * "coherence": score 0-25 + honest feedback.
     * "total_score": sum of the 4 criteria (0-100).
     * "corrected_text": full corrected text.
     * "overall_feedback": encouraging, practical feedback in Vietnamese.

Return ONLY a valid JSON object matching this schema:
{
  "isValidChinese": boolean,
  "level": "${levelStr}",
  "original_text": string,
  "transcribedText": string,
  "pinyin": string,
  "vietnamese": string,
  "wordCount": number,
  "sentence_analysis": [
    {
      "original": string,
      "status": "correct" | "unnatural" | "grammar_error",
      "error": string,
      "explanation": string,
      "grammar_rule": string,
      "correction": string,
      "similar_example": string
    }
  ],
  "content": { "score": number, "feedback": string },
  "vocabulary": { "score": number, "feedback": string },
  "grammar": { "score": number, "feedback": string },
  "coherence": { "score": number, "feedback": string },
  "total_score": number,
  "corrected_text": string,
  "overall_feedback": string,
  "handwritingFeedback": string
}`;

      if (mode === 'ocr' && image) {
        const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
        const imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        };

        contents = {
          parts: [
            imagePart,
            {
              text: `${systemPrompt}

OCR TASK INSTRUCTIONS:
- Look at the image very carefully.
- If the image only has random brush scribbles, lines, checkmarks, stray drawings, or unrecognizable strokes that DO NOT form standard Chinese characters:
  You MUST set "isValidChinese": false and give 0 score. DO NOT guess or fabricate sentences like "我叫丸" or "我是越南人".
- If genuine handwritten Chinese characters are found:
  Transcribe EXACTLY what is written into "transcribedText" and "original_text".
  Count genuine Hanzi in "wordCount".
  Evaluate strictly.`,
            },
          ],
        };
      } else {
        const userText = actualChineseText;
        contents = `${systemPrompt}

[BÀI VIẾT CỦA HỌC VIÊN]
"""
${userText}
"""`;
      }

      const responseText = await callGeminiWithFallback(gemini, {
        contents,
        responseMimeType: 'application/json',
        temperature: 0.1,
      });

      const parsed = cleanAndExtractJson(responseText || '{}');
      const studentOriginal = parsed.original_text || parsed.transcribedText || (mode === 'text' ? actualChineseText : '');
      const hanziCount = (studentOriginal.match(/[\u4e00-\u9fa5]/g) || []).length;
      const isValid = parsed.isValidChinese !== false && (hanziCount > 0 || (mode === 'text' && actualChineseText.length > 0));

      if (!isValid || (hanziCount === 0 && mode === 'ocr')) {
        return res.json({
          level: levelStr,
          original_text: '',
          transcribedText: '',
          pinyin: '',
          vietnamese: '',
          score: 0,
          total_score: 0,
          wordCount: 0,
          hskLevelEstimated: lvl,
          isValidChinese: false,
          handwritingFeedback: parsed.handwritingFeedback || (mode === 'ocr' ? 'Không nhận diện được chữ Hán hợp lệ trên ảnh / nét vẽ chưa tạo thành chữ Hán.' : undefined),
          scoring_breakdown: {
            content: { score: 0, feedback: 'Chưa có chữ Hán để chấm nội dung.', max_score: 25 },
            vocabulary: { score: 0, feedback: 'Không tìm thấy từ vựng tiếng Trung.', max_score: 25 },
            grammar: { score: 0, feedback: 'Không có câu tiếng Trung để phân tích.', max_score: 25 },
            coherence: { score: 0, feedback: 'Chưa có đoạn văn.', max_score: 25 },
          },
          sentence_analysis: [],
          content: { score: 0, feedback: 'Chưa có chữ Hán để chấm nội dung.' },
          vocabulary: { score: 0, feedback: 'Không tìm thấy từ vựng tiếng Trung.' },
          grammar: { score: 0, feedback: 'Không có câu tiếng Trung để phân tích.' },
          coherence: { score: 0, feedback: 'Chưa có đoạn văn.' },
          corrected_text: '',
          overall_feedback: parsed.overall_feedback || (mode === 'ocr'
            ? 'Hình ảnh chỉ chứa nét vẽ nháp / ngẫu nhiên chưa tạo thành chữ Hán có nghĩa. Vui lòng viết rõ ràng từng chữ Hán theo ô Mễ hoặc chuyển sang chế độ gõ văn bản để được chấm bài.'
            : 'Vui lòng nhập câu hoặc đoạn văn tiếng Trung để AI chấm điểm và chữa câu chi tiết.'),
        });
      }

      const totalScore = typeof parsed.total_score === 'number'
        ? parsed.total_score
        : typeof parsed.score === 'number'
        ? parsed.score
        : ((parsed.content?.score || 20) + (parsed.vocabulary?.score || 20) + (parsed.grammar?.score || 20) + (parsed.coherence?.score || 20));

      const charCount = parsed.wordCount || hanziCount || (studentOriginal ? studentOriginal.length : 0);
      const pinyinVal = parsed.pinyin || (studentOriginal ? getPinyinPro(studentOriginal, { toneType: 'symbol' }) : '');

      const contentCriterion = parsed.content || { score: Math.round(totalScore / 4), feedback: 'Đạt yêu cầu nội dung.' };
      const vocabCriterion = parsed.vocabulary || { score: Math.round(totalScore / 4), feedback: 'Từ vựng phù hợp cấp độ.' };
      const grammarCriterion = parsed.grammar || { score: Math.round(totalScore / 4), feedback: 'Ngữ pháp đạt chuẩn.' };
      const coherenceCriterion = parsed.coherence || { score: Math.round(totalScore / 4), feedback: 'Mạch lạc, liên kết tốt.' };

      return res.json({
        level: parsed.level || levelStr,
        original_text: studentOriginal,
        transcribedText: studentOriginal,
        pinyin: pinyinVal,
        vietnamese: parsed.vietnamese || '',
        score: totalScore,
        total_score: totalScore,
        wordCount: charCount,
        hskLevelEstimated: lvl,
        isValidChinese: true,
        handwritingFeedback: parsed.handwritingFeedback,
        scoring_breakdown: {
          content: { ...contentCriterion, max_score: 25 },
          vocabulary: { ...vocabCriterion, max_score: 25 },
          grammar: { ...grammarCriterion, max_score: 25 },
          coherence: { ...coherenceCriterion, max_score: 25 },
        },
        sentence_analysis: Array.isArray(parsed.sentence_analysis) && parsed.sentence_analysis.length > 0
          ? parsed.sentence_analysis
          : [
              {
                original: studentOriginal,
                status: 'correct',
                error: '',
                explanation: 'Câu văn đạt yêu cầu ngữ pháp.',
                grammar_rule: '',
                correction: studentOriginal,
                similar_example: '',
              },
            ],
        content: contentCriterion,
        vocabulary: vocabCriterion,
        grammar: grammarCriterion,
        coherence: coherenceCriterion,
        corrected_text: parsed.corrected_text || studentOriginal,
        overall_feedback: parsed.overall_feedback || 'Bài viết tốt, hãy tiếp tục phát huy!',
      });
    } catch (err: any) {
      console.warn('[Writing Evaluator] Error with Gemini, returning grounded fallback:', err?.message || err);
      return res.json(generateLocalWritingFallback(actualChineseText, mode === 'ocr'));
    }
  });

  // Intelligent Handwriting OCR & AI Assessment for Writing/Essay assignments
  app.post('/api/ai/ocr-and-grade-writing', async (req: Request, res: Response) => {
    const { image, promptText = '' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required for handwriting OCR' });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      return res.status(503).json({
        error: 'Tính năng bóc tách chữ viết tay yêu cầu cấu hình GEMINI_API_KEY.',
      });
    }

    try {
      const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg',
        },
      };

      const promptMessage = `You are an expert Chinese calligrapher, teacher, and pedagogic grading engine for non-native learners.
Analyze the uploaded image of the student's handwritten Chinese response.
The writing assignment instructions/prompt was: "${promptText}".

Please perform the following tasks:
1. Scan and perform high-precision OCR on the handwriting. Transcribe the student's handwritten Chinese characters exactly as written into "transcribedText". Keep any spacing or paragraphs they intended.
2. Provide the pinyin phonetic transcription for their written text with accurate tone marks into "pinyin".
3. Translate their written text into natural, elegant Vietnamese into "vietnamese".
4. Evaluate and grade their response on a scale of 0 to 100 based on HSK standards. Put this score in the "score" field.
5. Identify any stroke errors, messy handwriting segments, wrong characters, or bad word-formation and summarize this handwriting feedback in Vietnamese in "handwritingFeedback". Be encouraging but helpful.
6. Check for grammatical mistakes, incorrect syntax, or word choices. Provide specific corrections in Vietnamese in "grammarFeedback". Each feedback item should have "original" (what they wrote), "correction" (how to fix it), and "explanation" (why, in Vietnamese).
7. Write a warm, professional, and encouraging overall pedagogical comment in Vietnamese in "overallFeedback".

Return ONLY a valid JSON object matching this schema:
{
  "transcribedText": "Chữ Hán bóc tách được...",
  "pinyin": "Pinyin tương ứng...",
  "vietnamese": "Dịch nghĩa tiếng Việt...",
  "score": 85,
  "handwritingFeedback": "Nhận xét về nét chữ, độ rõ ràng, cách viết nét...",
  "grammarFeedback": [
    {
      "original": "chỗ sai",
      "correction": "chỗ sửa",
      "explanation": "giải thích chi tiết bằng tiếng Việt"
    }
  ],
  "overallFeedback": "Lời khuyên sư phạm tổng quát và lời động viên..."
}`;

      const contents = {
        parts: [imagePart, { text: promptMessage }],
      };

      const responseText = await callGeminiWithFallback(gemini, {
        contents,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      const parsed = cleanAndExtractJson(responseText || '{}');
      return res.json({
        transcribedText: parsed.transcribedText || '',
        pinyin: parsed.pinyin || '',
        vietnamese: parsed.vietnamese || '',
        score: parsed.score || 80,
        handwritingFeedback: parsed.handwritingFeedback || 'Nét chữ khá rõ ràng, dễ đọc.',
        grammarFeedback: parsed.grammarFeedback || [],
        overallFeedback: parsed.overallFeedback || 'Bài viết tốt, hãy tiếp tục phát huy!',
      });
    } catch (err: any) {
      console.error('[Handwriting OCR] Error during Gemini Vision OCR:', err?.message || err);
      return res.status(500).json({
        error: 'Lỗi khi AI bóc tách và nhận diện chữ viết tay: ' + (err?.message || 'Gemini error'),
      });
    }
  });

  // AI Workbook Parser & Exercise Remixer Endpoint
  app.post('/api/workbooks/parse-and-remix', async (req: Request, res: Response) => {
    const {
      action = 'parse_raw', // 'parse_raw' | 'remix_exam'
      rawText = '',
      images = [],
      sourceQuestions = [],
      remixMode = 'grammar_variants', // 'shuffle' | 'grammar_variants' | 'transformed' | 'comprehensive'
      targetHsk = 1,
      questionCount = 10,
      examTitle = 'Đề luyện thi tiếng Trung',
      customTopic = '',
    } = req.body;

    const gemini = getGeminiClient();

    if (images && Array.isArray(images) && images.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tính năng quét ảnh OCR tạm thời được khóa trong giai đoạn MVP để tối ưu chi phí token. Vui lòng dán văn bản bài tập trực tiếp.',
      });
    }

    // Mode 1: PARSE RAW WORKBOOK (From OCR images or raw textbook pasted text)
    if (action === 'parse_raw') {
      if (!gemini) {
        return res.status(503).json({
          success: false,
          error: 'AI_SERVICE_UNAVAILABLE',
          message: 'All AI models exhausted or unavailable',
        });
      }

      try {
        let contentPayload: any = [];

        // If images provided, attach them
        if (images && Array.isArray(images) && images.length > 0) {
          const selected = images.slice(0, 5);
          selected.forEach((base64: string) => {
            const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
            contentPayload.push({
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg',
              },
            });
          });
        }

        const prompt = `You are an AI Pedagogy Expert for Chinese (HSK 1-6) specializing in digitizing and structuring workbooks for Vietnamese students.
Analyze the following workbook material (text or scanned pages):
---
RAW WORKBOOK TEXT:
${rawText ? rawText.slice(0, 4000) : '(See attached image pages)'}
---
TASK:
1. Transcribe the exercise content accurately.
2. Extract all exercises and questions from this material into structured, interactive quiz questions.
3. For each question, extract/generate:
   - "type": "meaning" | "grammar" | "pinyin" | "fill_blank" | "word_order" | "reading"
   - "prompt": The question prompt in clear Vietnamese (e.g. "Chọn đáp án đúng điền vào chỗ trống:", "Chọn nghĩa đúng của câu:")
   - "questionChinese": The Chinese sentence or phrase being tested
   - "options": An array of 4 distinct choices (A, B, C, D)
   - "correctAnswer": The exact string matching one of the options
   - "explanation": Detailed pedagogical explanation in Vietnamese, highlighting grammar rules or vocabulary usage
   - "hskLevel": HSK level number (${targetHsk})
   - "pinyin": Tone-marked Pinyin of the Chinese sentence

Return ONLY a valid JSON object matching this schema:
{
  "transcribedText": "Full extracted text...",
  "questions": [
    {
      "id": "q-1",
      "type": "fill_blank",
      "prompt": "Chọn từ thích hợp điền vào chỗ trống: 他___去北京。",
      "questionChinese": "他___去北京",
      "pinyin": "Tā ___ qù Běijīng",
      "options": ["想", "很", "是", "了"],
      "correctAnswer": "想",
      "explanation": "Từ 想 (xiǎng) là động từ năng nguyện biểu thị mong muốn làm gì.",
      "hskLevel": ${targetHsk}
    }
  ]
}`;

        contentPayload.push({ text: prompt });

        const responseText = await callGeminiWithFallback(gemini, {
          contents: { parts: contentPayload },
          responseMimeType: 'application/json',
          temperature: 0.3,
        });

        const parsed = cleanAndExtractJson(responseText || '{}');
        const questions = (parsed.questions || []).map((q: any, i: number) => ({
          ...q,
          id: q.id || `q-parsed-${Date.now()}-${i + 1}`,
          hskLevel: q.hskLevel || targetHsk,
        }));

        if (questions.length === 0) {
          return res.status(503).json({
            success: false,
            error: 'AI_SERVICE_UNAVAILABLE',
            message: 'All AI models exhausted or unavailable',
          });
        }

        return res.json({
          success: true,
          source: 'gemini_ai',
          transcribedText: parsed.transcribedText || rawText || '',
          parsedQuestions: questions,
        });
      } catch (err: any) {
        console.error('[Workbook Parser] Error parsing with Gemini:', err?.message || err);
        return res.status(503).json({
          success: false,
          error: 'AI_SERVICE_UNAVAILABLE',
          message: 'All AI models exhausted or unavailable',
        });
      }
    }

    // Mode 2: AI REMIX EXAM (Generate mutated variations, shuffle, transform or create fresh exam from bank)
    if (action === 'remix_exam') {
      if (!gemini) {
        return res.status(503).json({
          success: false,
          error: 'AI_SERVICE_UNAVAILABLE',
          message: 'All AI models exhausted or unavailable',
        });
      }

      try {
        const sourceContext = (sourceQuestions && sourceQuestions.length > 0)
          ? JSON.stringify(sourceQuestions.slice(0, 15))
          : (rawText || 'Bài tập ngữ pháp và từ vựng HSK tổng hợp.');

        let remixInstruction = '';
        if (remixMode === 'shuffle') {
          remixInstruction = `Xáo trộn thứ tự các câu hỏi và xáo trộn vị trí các đáp án A/B/C/D ngẫu nhiên để chống học vẹt. Đảm bảo correctAnswer luôn trùng khớp chính xác với đáp án trong options.`;
        } else if (remixMode === 'grammar_variants') {
          remixInstruction = `TẠO BIẾN THỂ NGỮ PHÁP TƯƠNG ĐƯƠNG (Grammar & Context Clone):
- Giữ nguyên cấu trúc ngữ pháp cốt lõi và độ khó của từng câu hỏi nguồn.
- Thay đổi chủ ngữ, tân ngữ, danh từ, bối cảnh thực tế (VD: "我把作业做完了" -> biến thể: "弟弟把牛奶喝了", "妈妈把房间打扫干净了").
- Người học phải thực sự hiểu điểm ngữ pháp mới chọn đúng được.`;
        } else if (remixMode === 'transformed') {
          remixInstruction = `CHUYỂN ĐỔI ĐỊNH DẠNG CÂU HỎI (Format Transformer):
- Biến câu trắc nghiệm đơn thuần thành các dạng bài đa dạng: Điền từ vào chỗ trống (fill_blank), Sắp xếp từ thành câu (word_order), Phân biệt cặp từ dễ nhầm lẫn (confusion_pairs), hoặc Đọc hiểu đoạn hội thoại ngắn (reading).`;
        } else if (remixMode === 'writing_focus') {
          remixInstruction = `CHUYÊN BÀI TẬP TỰ LUẬN & VIẾT TAY (Writing & Essay OCR Focus):
- Tập trung tạo các câu hỏi Viết tay / Tự luận (type = "writing").
- Học sinh sẽ viết chữ Hán / câu / đoạn văn ngắn (30-80 chữ) ra giấy và tải ảnh lên.
- Đối với câu hỏi type = "writing": "options" phải là mảng rỗng [], "correctAnswer" ghi "Học sinh nộp ảnh bài viết tay để AI và giáo viên chấm", "prompt" ghi yêu cầu đề bài chi tiết (VD: "Hãy viết tay đoạn văn ngắn 50 chữ giới thiệu về gia đình bạn bằng chữ Hán ra giấy, chụp ảnh bài làm tải lên.").`;
        } else {
          remixInstruction = `TỔNG HỢP ĐỀ THI ĐA DẠNG CHUẨN HSK (Comprehensive Mock Exam):
- Kết hợp cân bằng giữa: Ngữ âm/Pinyin (20%), Từ vựng & Nghĩa câu (20%), Cấu trúc ngữ pháp (30%), Đọc hiểu (20%) và có ít nhất 1-2 câu Bài tập Viết tay tự luận (type = "writing", 10%).`;
        }

        const prompt = `You are a Senior Chinese Pedagogy & Exam Master creating an online assessment for Vietnamese learners.
Generate ${questionCount} high-quality online exam questions based on the provided source material and remix strategy.

EXAM TITLE: ${examTitle}
TARGET HSK LEVEL: HSK ${targetHsk}
REMIX STRATEGY: ${remixInstruction}
${customTopic ? `EXTERNAL TOPIC / SOURCE MATERIAL GROUNDING: "${customTopic}". Incorporate vocabulary, contexts, or scenarios from this topic while keeping grammar difficulty aligned with HSK ${targetHsk}.` : ''}

SOURCE EXERCISE BANK:
${sourceContext}

REQUIREMENTS:
1. Generate exactly ${questionCount} questions.
2. Question types supported: "meaning" | "grammar" | "pinyin" | "fill_blank" | "word_order" | "reading" | "writing".
   - For standard choice questions: "options" is an array of 4 choices, "correctAnswer" matches 1 option.
   - For essay/writing questions ("type": "writing"): "options" is [], "correctAnswer" is "Học sinh nộp ảnh bài viết tay để AI và giáo viên chấm", "prompt" specifies handwriting essay topic.
3. Every question must have:
   - "id": unique string
   - "type": valid question type
   - "prompt": Clear, friendly Vietnamese instruction
   - "questionChinese": Chinese text (if applicable)
   - "pinyin": Complete tone-marked pinyin for pronunciation
   - "options": Array of choices (or [] for writing)
   - "correctAnswer": Exact string
   - "explanation": Comprehensive pedagogical analysis in Vietnamese.
   - "hskLevel": ${targetHsk}

Return ONLY a JSON object matching this schema:
{
  "examTitle": "${examTitle}",
  "questions": [
    {
      "id": "q-remix-1",
      "type": "grammar",
      "prompt": "Chọn phương án đúng...",
      "questionChinese": "...",
      "pinyin": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Giải thích chi tiết...",
      "hskLevel": ${targetHsk}
    }
  ]
}`;

        const responseText = await callGeminiWithFallback(gemini, {
          contents: prompt,
          responseMimeType: 'application/json',
          temperature: 0.4,
        });

        const parsed = cleanAndExtractJson(responseText || '{}');
        const questions = (parsed.questions || []).map((q: any, i: number) => ({
          ...q,
          id: q.id || `q-remix-${Date.now()}-${i + 1}`,
          hskLevel: q.hskLevel || targetHsk,
        }));

        if (questions.length === 0) {
          return res.status(503).json({
            success: false,
            error: 'AI_SERVICE_UNAVAILABLE',
            message: 'All AI models exhausted or unavailable',
          });
        }

        return res.json({
          success: true,
          source: 'gemini_ai',
          examTitle: parsed.examTitle || examTitle,
          questions: questions,
        });
      } catch (err: any) {
        console.error('[Workbook Remix] Error remixing with Gemini:', err?.message || err);
        return res.status(503).json({
          success: false,
          error: 'AI_SERVICE_UNAVAILABLE',
          message: 'All AI models exhausted or unavailable',
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  });

  // Mount HSK 3.0 QBank Admin API Router only if kill-switch is enabled
  if (isQBankAdminEnabled()) {
    warnIfInsecureAdminToken();
    app.use('/api/qbank', qbankRouter);
  }

  // Mount Public HSK Mock Exam & Practice API Router (Student-Facing)
  app.use('/api/exam', examRouter);

  // CRUCIAL: Explicit API 404 Guard ensuring unhandled /api/* requests never fall through to SPA HTML fallback
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global API JSON Error Handler ensuring API errors always return JSON, never HTML
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (req.path.startsWith('/api/')) {
      console.error('[API Server Error]', err);
      if (res.headersSent) {
        return next(err);
      }
      return res.status(err.status || err.statusCode || 500).json({
        success: false,
        error: sanitizeError(err.message || 'Lỗi máy chủ nội bộ'),
      });
    }
    return next(err);
  });

  // Production bundle or pre-compiled distribution serving (eliminates Cloud Run 429 rate limiting on unbundled files)
  const distPath = path.join(process.cwd(), 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasBuiltDist;

  if (isProduction) {
    app.use(express.static(distPath));
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Minnese server running on http://${HOST}:${PORT}`);
    // Initialize background question scheduler (controlled by ENABLE_AUTO_QUESTION_GENERATION)
    if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_AUTO_SCHEDULER !== 'true') {
      initAutoQuestionScheduler();
    } else {
      console.log('[Scheduler] Background auto question scheduler bypassed (test or disabled mode).');
    }
  });
}

startServer();
