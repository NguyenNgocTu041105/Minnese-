/**
 * Advanced Chinese Voice & Speech Synthesis Manager
 * Supports:
 * 1. High-Fidelity Studio Neural AI Voices (Gemini TTS API)
 * 2. Smart Browser Voice Selection (Edge Natural / Google / Apple Neural voices)
 * 3. Graceful instant fallback upon rate-limits or offline state
 * 4. In-memory audio caching for zero-latency instant replays.
 */

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male' | 'unknown';
  accent: 'Standard (Bắc Kinh)' | 'Taiwanese (Đài Loan)' | 'Hong Kong (Quảng Đông)' | 'General';
  description: string;
  isNative: boolean;
  isAIStudio?: boolean;
  voiceObj?: SpeechSynthesisVoice;
}

export interface VoiceSettings {
  voiceId: string; // Voice URI, Gemini Voice ID, or 'default'
  rate: number; // 0.5 to 1.5, default 0.85
  pitch: number; // 0.8 to 1.2, default 1.0
  volume: number; // 0 to 1, default 1.0
  autoPinyinTone: boolean;
  preferNeuralAI: boolean; // Prefer Studio Neural AI TTS when available
}

const VOICE_SETTINGS_STORAGE_KEY = 'minnese_chinese_voice_settings_v2';

export const GEMINI_AI_VOICES: VoiceOption[] = [
  {
    id: 'gemini-kore',
    name: 'Gemini Kore (Giọng Nữ Truyền Cảm - Studio AI)',
    lang: 'zh-CN',
    gender: 'female',
    accent: 'Standard (Bắc Kinh)',
    description: '👩 Giọng Nữ • Phát âm chuẩn xác, ngữ điệu tự nhiên truyền cảm',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'gemini-puck',
    name: 'Gemini Puck (Giọng Nữ Sinh Động - Studio AI)',
    lang: 'zh-CN',
    gender: 'female',
    accent: 'Standard (Bắc Kinh)',
    description: '👩 Giọng Nữ • Trong trẻo, ngữ điệu vui tươi, sống động',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'gemini-zephyr',
    name: 'Gemini Zephyr (Giọng Nam Trầm Ấm - Studio AI)',
    lang: 'zh-CN',
    gender: 'male',
    accent: 'Standard (Bắc Kinh)',
    description: '👨 Giọng Nam • Trầm ấm, tròn vành rõ chữ, chuẩn bản xứ',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'gemini-charon',
    name: 'Gemini Charon (Giọng Nam Chuẩn Bản Xứ - Studio AI)',
    lang: 'zh-CN',
    gender: 'male',
    accent: 'Standard (Bắc Kinh)',
    description: '👨 Giọng Nam • Giọng đọc phát thanh viên, uy lực & rõ ràng',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'gemini-fenrir',
    name: 'Gemini Fenrir (Giọng Nam Đĩnh Đạc - Studio AI)',
    lang: 'zh-CN',
    gender: 'male',
    accent: 'Standard (Bắc Kinh)',
    description: '👨 Giọng Nam • Phong thái đĩnh đạc, tốc độ tự nhiên',
    isNative: true,
    isAIStudio: true,
  },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceId: 'default', // Instant zero-delay native device voice
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
  autoPinyinTone: true,
  preferNeuralAI: false, // Default to instant zero-delay playback (no network latency)
};

// Eagerly preload browser voices on module initialization to eliminate first-click lag
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          window.speechSynthesis.getVoices();
        } catch {}
      };
    }
  } catch {}
}

// In-memory audio PCM cache for fast replays
const audioCache = new Map<string, string>();
let activeAudioSource: AudioBufferSourceNode | null = null;
let activeAudioContext: AudioContext | null = null;
let geminiQuotaCooldownUntil = 0; // Temporary cooldown when cloud free quota is reached
let activeUtterance: SpeechSynthesisUtterance | null = null; // Prevent Chrome garbage collection bug
let speechKeepAliveTimer: any = null;

function clearKeepAliveTimer() {
  if (speechKeepAliveTimer) {
    clearInterval(speechKeepAliveTimer);
    speechKeepAliveTimer = null;
  }
}

function startKeepAliveTimer() {
  clearKeepAliveTimer();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechKeepAliveTimer = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearKeepAliveTimer();
      }
    }, 4000);
  }
}

/**
 * Loads saved voice settings from localStorage with automatic migration for snappy playback
 */
export function getSavedVoiceSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-migrate old default 'gemini-kore' causing unwanted 2-4s delay on word audio clicks
      if (
        (parsed.voiceId === 'gemini-kore' || parsed.voiceId === 'default') &&
        !parsed.userExplicitlySelectedAiVoice
      ) {
        parsed.voiceId = 'default';
        parsed.preferNeuralAI = false;
      }
      return { ...DEFAULT_VOICE_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse voice settings', e);
  }
  return DEFAULT_VOICE_SETTINGS;
}

/**
 * Saves voice settings to localStorage
 */
export function saveVoiceSettings(settings: Partial<VoiceSettings> & { userExplicitlySelectedAiVoice?: boolean }): VoiceSettings {
  const current = getSavedVoiceSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save voice settings', e);
    }
  }
  return updated;
}

/**
 * Analyzes voice properties to categorize gender, region, and natural description
 */
function categorizeVoice(voice: SpeechSynthesisVoice): VoiceOption {
  const nameLower = voice.name.toLowerCase();
  const langLower = voice.lang.toLowerCase();

  let gender: 'female' | 'male' | 'unknown' = 'unknown';
  if (
    nameLower.includes('female') ||
    nameLower.includes('xiaoxiao') ||
    nameLower.includes('xiaoyi') ||
    nameLower.includes('huihui') ||
    nameLower.includes('yaoyao') ||
    nameLower.includes('tingting') ||
    nameLower.includes('sinji') ||
    nameLower.includes('meijia') ||
    nameLower.includes('zhiwei') ||
    nameLower.includes('hanhan') ||
    nameLower.includes('siri')
  ) {
    gender = 'female';
  } else if (
    nameLower.includes('male') ||
    nameLower.includes('yunxi') ||
    nameLower.includes('yunyang') ||
    nameLower.includes('yunjian') ||
    nameLower.includes('kangkang') ||
    nameLower.includes('limu') ||
    nameLower.includes('danny') ||
    nameLower.includes('brian')
  ) {
    gender = 'male';
  } else {
    gender = 'female';
  }

  let accent: 'Standard (Bắc Kinh)' | 'Taiwanese (Đài Loan)' | 'Hong Kong (Quảng Đông)' | 'General' =
    'Standard (Bắc Kinh)';
  if (langLower.includes('tw') || nameLower.includes('taiwan') || nameLower.includes('hanhan') || nameLower.includes('zhiwei')) {
    accent = 'Taiwanese (Đài Loan)';
  } else if (langLower.includes('hk') || nameLower.includes('hong kong') || nameLower.includes('cantonese')) {
    accent = 'Hong Kong (Quảng Đông)';
  } else if (langLower.includes('cn') || langLower.includes('hans') || nameLower.includes('mandarin') || nameLower.includes('chinese')) {
    accent = 'Standard (Bắc Kinh)';
  }

  let description = `${gender === 'female' ? '👩 Giọng Nữ' : '👨 Giọng Nam'} • ${accent}`;
  if (nameLower.includes('natural') || nameLower.includes('neural') || nameLower.includes('online')) {
    description += ' (Trình duyệt AI Neural)';
  }

  return {
    id: voice.voiceURI || voice.name,
    name: voice.name,
    lang: voice.lang,
    gender,
    accent,
    description,
    isNative: !voice.localService || voice.name.includes('Google') || voice.name.includes('Microsoft'),
    voiceObj: voice,
  };
}

/**
 * Retrieves all available Chinese voices (both Gemini Studio Neural AI + Browser Voices)
 */
export function getAvailableChineseVoices(): Promise<VoiceOption[]> {
  return new Promise((resolve) => {
    // 1. Always start with high-quality Gemini Studio Neural AI voices
    const options: VoiceOption[] = [...GEMINI_AI_VOICES];

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(options);
      return;
    }

    const loadBrowserVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const chineseVoices = allVoices.filter((v) => {
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();
        return (
          lang.startsWith('zh') ||
          lang.includes('cmn') ||
          lang.includes('mandarin') ||
          name.includes('chinese') ||
          name.includes('mandarin') ||
          name.includes('xiaoxiao') ||
          name.includes('yunxi') ||
          name.includes('tingting') ||
          name.includes('huihui')
        );
      });

      // Sort natural and high quality voices to the top
      chineseVoices.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore =
          (aName.includes('natural') ? 10 : 0) +
          (aName.includes('xiaoxiao') || aName.includes('yunxi') ? 8 : 0) +
          (aName.includes('google') || aName.includes('tingting') ? 5 : 0);
        const bScore =
          (bName.includes('natural') ? 10 : 0) +
          (bName.includes('xiaoxiao') || bName.includes('yunxi') ? 8 : 0) +
          (bName.includes('google') || bName.includes('tingting') ? 5 : 0);
        return bScore - aScore;
      });

      const browserOptions: VoiceOption[] = chineseVoices.map(categorizeVoice);
      resolve([...options, ...browserOptions]);
    };

    const initialVoices = window.speechSynthesis.getVoices();
    if (initialVoices.length > 0) {
      loadBrowserVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        loadBrowserVoices();
      };
      setTimeout(loadBrowserVoices, 300);
    }
  });
}

/**
 * Stops any actively playing audio (both Web Audio API & Web Speech)
 */
export function stopChineseAudio(): void {
  clearKeepAliveTimer();
  if (activeAudioSource) {
    try {
      activeAudioSource.stop();
      activeAudioSource.disconnect();
    } catch {
      // Ignore
    }
    activeAudioSource = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
  activeUtterance = null;
}

/**
 * Plays base64 PCM 24000Hz audio buffer via Web Audio API
 */
async function playPCMBase64(base64: string, sampleRate = 24000): Promise<void> {
  stopChineseAudio();

  return new Promise((resolve, reject) => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit signed PCM to Float32 array
      const int16Array = new Int16Array(bytes.buffer);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      if (!activeAudioContext || activeAudioContext.state === 'closed') {
        activeAudioContext = new AudioContextClass();
      }

      if (activeAudioContext.state === 'suspended') {
        activeAudioContext.resume();
      }

      const buffer = activeAudioContext.createBuffer(1, int16Array.length, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      const source = activeAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(activeAudioContext.destination);

      activeAudioSource = source;

      source.onended = () => {
        if (activeAudioSource === source) {
          activeAudioSource = null;
        }
        resolve();
      };

      source.start(0);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Plays Chinese audio using browser Web Speech Synthesis as reliable fallback
 */
function playBrowserUtterance(
  cleanText: string,
  settings: VoiceSettings,
  overrideRate?: number,
  overridePitch?: number
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      stopChineseAudio();

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = overrideRate ?? settings.rate ?? 0.85;
      utterance.pitch = overridePitch ?? settings.pitch ?? 1.0;
      utterance.volume = settings.volume ?? 1.0;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;

      // 1. If user chose a specific browser voice ID
      if (settings.voiceId && !settings.voiceId.startsWith('gemini-') && settings.voiceId !== 'default') {
        selectedVoice = voices.find((v) => (v.voiceURI || v.name) === settings.voiceId);
      }

      // 2. If fallback from Gemini voice, match requested gender
      if (!selectedVoice) {
        const isMaleGemini = ['gemini-zephyr', 'gemini-charon', 'gemini-fenrir'].includes(settings.voiceId);

        if (isMaleGemini) {
          selectedVoice = voices.find((v) => {
            const n = v.name.toLowerCase();
            return (
              (v.lang.startsWith('zh') || n.includes('chinese')) &&
              (n.includes('yunxi') || n.includes('yunjian') || n.includes('male') || n.includes('kangkang'))
            );
          });
        } else {
          selectedVoice = voices.find((v) => {
            const n = v.name.toLowerCase();
            return (
              (v.lang.startsWith('zh') || n.includes('chinese')) &&
              (n.includes('xiaoxiao') || n.includes('xiaoyi') || n.includes('tingting') || n.includes('female') || n.includes('google'))
            );
          });
        }
      }

      // 3. Fallback to any high-quality standard Chinese voice
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (v) =>
            v.lang === 'zh-CN' ||
            v.lang === 'cmn-Hans-CN' ||
            v.lang.startsWith('zh') ||
            v.name.includes('Chinese') ||
            v.name.includes('Mandarin')
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'zh-CN';
      }

      // Hold module-level reference to prevent GC
      activeUtterance = utterance;
      startKeepAliveTimer();

      utterance.onend = () => {
        clearKeepAliveTimer();
        activeUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        clearKeepAliveTimer();
        activeUtterance = null;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      clearKeepAliveTimer();
      activeUtterance = null;
      resolve();
    }
  });
}

/**
 * Main audio player with automatic Gemini Neural AI & Instant Browser Fallback
 * Supports Chinese (zh), English (en), and Vietnamese (vi).
 * Defaults to 'zh' so Pinyin or Chinese terms are always voiced using Chinese pronunciation.
 */
export async function playChineseAudio(
  text: string,
  overrideRate?: number,
  overridePitch?: number,
  forcedLang: 'zh' | 'en' | 'vi' = 'zh'
): Promise<void> {
  return playMultilingualVoice(text, forcedLang, overrideRate, overridePitch);
}

/**
 * Detect language of text automatically
 */
export function detectTextLanguage(text: string): 'zh' | 'en' | 'vi' {
  if (!text || !text.trim()) return 'zh';
  const trimmed = text.trim();

  // If contains Chinese characters
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return 'zh';
  }

  // If contains Vietnamese specific diacritics
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
    return 'vi';
  }

  // If contains Pinyin tone marks (ā, á, ǎ, à, etc.), definitely Chinese
  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(trimmed)) {
    return 'zh';
  }

  // Default to English if predominantly Latin alphabet without VN or Pinyin diacritics
  if (/^[a-zA-Z0-9\s.,!?'"():;\-_/]+$/.test(trimmed)) {
    return 'en';
  }

  return 'zh';
}

/**
 * Clean text for audio synthesis while preserving Chinese, Latin (including Pinyin tones),
 * Vietnamese characters, numbers, and standard punctuation.
 */
function cleanAudioText(text: string): string {
  if (!text) return '';
  // Strip markdown formatting symbols like **, ##, __, `, etc.
  const unmarkdown = text
    .replace(/[*_#`~>\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Keep all unicode letters (\p{L}), numbers (\p{N}), spaces, and standard punctuation marks
  const cleaned = unmarkdown.replace(/[^\p{L}\p{N}\s，。！？、…—,.\?!;:'"-]/gu, '').trim();
  return cleaned || text.trim();
}

/**
 * High-quality multilingual voice synthesizer for Live Calls
 */
export async function playMultilingualVoice(
  text: string,
  lang: 'zh' | 'en' | 'vi' | 'auto' = 'auto',
  overrideRate?: number,
  overridePitch?: number,
  preferInstantNative: boolean = false
): Promise<void> {
  if (!text || !text.trim()) return;

  const targetLang = lang === 'auto' ? detectTextLanguage(text) : lang;
  const settings = getSavedVoiceSettings();

  // Instant 0ms speech for real-time interactive live conversation
  if (preferInstantNative && targetLang === 'zh') {
    const cleanText = cleanAudioText(text);
    await playBrowserUtterance(cleanText, settings, overrideRate, overridePitch);
    return;
  }

  // For Chinese with Neural Gemini Voices
  if (targetLang === 'zh') {
    const cleanText = cleanAudioText(text);
    // Only use Gemini TTS if user explicitly enabled preferNeuralAI AND selected a gemini-* voice
    const isExplicitGemini = Boolean(settings.preferNeuralAI && settings.voiceId && settings.voiceId.startsWith('gemini-'));
    const isCooldown = Date.now() < geminiQuotaCooldownUntil;

    // For single vocabulary words / short cards (<= 8 chars), prioritize instant 0ms native device speech
    // so clicking volume button or cards plays immediately without network lag
    const isShortWord = cleanText.length <= 8;

    if (isExplicitGemini && !isCooldown) {
      const voiceName = settings.voiceId.replace('gemini-', '');
      const formattedVoiceName = voiceName.charAt(0).toUpperCase() + voiceName.slice(1);
      const cacheKey = `${formattedVoiceName}_${cleanText}`;

      if (audioCache.has(cacheKey)) {
        try {
          await playPCMBase64(audioCache.get(cacheKey)!, 24000);
          return;
        } catch {
          // Fallback to browser
        }
      }

      // If short word and not cached yet, play instant browser voice immediately to avoid click delay
      if (isShortWord) {
        await playBrowserUtterance(cleanText, settings, overrideRate, overridePitch);
        // Silently pre-fetch neural audio in background for future plays
        fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voice: formattedVoiceName }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.audioBase64) audioCache.set(cacheKey, data.audioBase64);
          })
          .catch(() => {});
        return;
      }

      // For longer paragraphs, fetch Gemini TTS with a strict 1.8s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voice: formattedVoiceName }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            audioCache.set(cacheKey, data.audioBase64);
            await playPCMBase64(data.audioBase64, data.sampleRate || 24000);
            return;
          }
        } else {
          // If 429 quota or server error, cool down
          const cooldownDuration = res.status === 429 ? 25000 : 15000;
          geminiQuotaCooldownUntil = Date.now() + cooldownDuration;
        }
      } catch {
        geminiQuotaCooldownUntil = Date.now() + 15000;
      }
    }

    // Default fast path: Instant 0-delay native speech
    await playBrowserUtterance(cleanText, settings, overrideRate, overridePitch);
    return;
  }

  // For English (en) or Vietnamese (vi) browser voice synthesis
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      stopChineseAudio();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = overrideRate ?? 0.95;
      utterance.pitch = overridePitch ?? 1.0;
      utterance.volume = settings.volume ?? 1.0;

      const voices = window.speechSynthesis.getVoices();

      if (targetLang === 'en') {
        utterance.lang = 'en-US';
        const enVoice =
          voices.find((v) => v.lang.startsWith('en-US') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny'))) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      } else if (targetLang === 'vi') {
        utterance.lang = 'vi-VN';
        const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.name.includes('Vietnamese'));
        if (viVoice) utterance.voice = viVoice;
      }

      activeUtterance = utterance;
      startKeepAliveTimer();

      utterance.onend = () => {
        clearKeepAliveTimer();
        activeUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        clearKeepAliveTimer();
        activeUtterance = null;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      clearKeepAliveTimer();
      activeUtterance = null;
      resolve();
    }
  });
}

