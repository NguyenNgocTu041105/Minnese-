/**
 * Advanced Chinese Voice & Speech Synthesis Manager
 * Supports:
 * 1. High-Fidelity Studio Neural AI Voices (Gemini TTS API)
 * 2. Smart Browser Voice Selection (Edge Natural / Google / Apple Neural voices)
 * 3. Graceful instant fallback upon rate-limits or offline state
 * 4. In-memory audio caching for zero-latency instant replays.
 */

import { resolveChineseTtsPayload, sanitizeDialogueScript } from './pinyinConverter';

export { resolveChineseTtsPayload, sanitizeDialogueScript };

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

export const EDGE_TTS_VOICES: VoiceOption[] = [
  {
    id: 'zh-CN-XiaoxiaoNeural',
    name: 'Hiểu Hiểu (Xiaoxiao) - Nữ Chuẩn Giáo Trình HSK',
    lang: 'zh-CN',
    gender: 'female',
    accent: 'Standard (Bắc Kinh)',
    description: '👩 Giọng Nữ Chuẩn Giáo Trình Bắc Ngữ / HSK - Tự nhiên, truyền cảm, chuẩn phát thanh viên',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'zh-CN-XiaoyiNeural',
    name: 'Hiểu Y (Xiaoyi) - Nữ Trẻ Trung, Tươi Vui',
    lang: 'zh-CN',
    gender: 'female',
    accent: 'Standard (Bắc Kinh)',
    description: '👩 Giọng Nữ Trẻ Trung • Phát âm trong trẻo, sinh động',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'zh-CN-YunxiNeural',
    name: 'Vân Hy (Yunxi) - Nam Tự Nhiên, Trầm Ấm',
    lang: 'zh-CN',
    gender: 'male',
    accent: 'Standard (Bắc Kinh)',
    description: '👨 Giọng Nam Chuẩn • Trầm ấm, tròn vành rõ chữ',
    isNative: true,
    isAIStudio: true,
  },
  {
    id: 'zh-CN-YunjianNeural',
    name: 'Vân Kiện (Yunjian) - Nam Chuẩn Khảo Thí HSK',
    lang: 'zh-CN',
    gender: 'male',
    accent: 'Standard (Bắc Kinh)',
    description: '👨 Giọng Nam Khảo Thí • Đĩnh đạc, phong thái bài thi khảo thí',
    isNative: true,
    isAIStudio: true,
  },
];


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
  voiceId: 'zh-CN-XiaoxiaoNeural', // Default to Xiaoxiao Neural (Nữ Chuẩn Giáo Trình HSK)
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
  autoPinyinTone: true,
  preferNeuralAI: false,
};

/**
 * CLEC Standard HSK Level Speed & Pitch Audio Pacing Matrix
 * Lower HSK levels are articulated slower with slightly higher pitch for clarity,
 * while advanced levels reflect authentic real-world native Mandarin speed.
 */
export const HSK_LEVEL_AUDIO_PACING: Record<number, { rate: number; pitch: number }> = {
  1: { rate: 0.78, pitch: 1.05 },
  2: { rate: 0.82, pitch: 1.03 },
  3: { rate: 0.86, pitch: 1.00 },
  4: { rate: 0.90, pitch: 1.00 },
  5: { rate: 0.95, pitch: 0.98 },
  6: { rate: 1.00, pitch: 0.98 },
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
let activeHtmlAudio: HTMLAudioElement | null = null;
let activeAudioContext: AudioContext | null = null;
let geminiQuotaCooldownUntil = 0; // Temporary cooldown when cloud free quota is reached
let activeUtterance: SpeechSynthesisUtterance | null = null; // Prevent Chrome garbage collection bug
let speechKeepAliveTimer: any = null;
let dialogueAbortController: AbortController | null = null;

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
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-migrate old default 'gemini-kore' causing unwanted 2-4s delay on word audio clicks
      if (
        (parsed.voiceId === 'gemini-kore' || parsed.voiceId === 'default' || !parsed.voiceId) &&
        !parsed.userExplicitlySelectedAiVoice
      ) {
        parsed.voiceId = 'zh-CN-XiaoxiaoNeural';
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
    const options: VoiceOption[] = [...EDGE_TTS_VOICES, ...GEMINI_AI_VOICES];

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

let activePutonghuaStreamCancel: (() => void) | null = null;

/**
 * Stops any actively playing audio (both Web Audio API & Web Speech)
 */
export function stopChineseAudio(): void {
  if (dialogueAbortController) {
    dialogueAbortController.abort();
    dialogueAbortController = null;
  }
  if (activePutonghuaStreamCancel) {
    const cancel = activePutonghuaStreamCancel;
    activePutonghuaStreamCancel = null;
    try {
      cancel();
    } catch {
      // Ignore cleanup errors
    }
  }
  clearKeepAliveTimer();
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {}
    activeHtmlAudio = null;
  }
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

export interface DialogueTurn {
  role: 'male' | 'female' | 'narrator';
  text: string;
}

/**
 * Parses structured dialogue transcripts into speaker turns (男, 女, 问, 甲, 乙, ★)
 */
export function parseDialogueTurns(raw: string): DialogueTurn[] | null {
  if (!raw || typeof raw !== 'string') return null;
  const sanitized = sanitizeDialogueScript(raw);

  const regex = /(?:^|\s|\n)(男|女|问|甲|乙|★)\s*[:：]\s*/g;
  const matches = [...sanitized.matchAll(regex)];
  if (matches.length === 0) {
    return null;
  }

  // If only 1 match and it's not a question tag or star prompt, not a multi-role dialogue
  if (matches.length === 1 && matches[0][1] !== '问' && matches[0][1] !== '★') {
    return null;
  }

  const turns: DialogueTurn[] = [];

  // Preamble before first role tag (e.g., short monologue before question)
  if (matches[0].index! > 0) {
    const preamble = sanitized.slice(0, matches[0].index!).trim();
    if (preamble) {
      turns.push({ role: 'narrator', text: preamble });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const roleTag = m[1];
    const startIdx = m.index! + m[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : sanitized.length;
    let turnText = sanitized.slice(startIdx, endIdx).trim();

    if (turnText) {
      let role: DialogueTurn['role'] = 'narrator';
      if (roleTag === '男' || roleTag === '甲') role = 'male';
      else if (roleTag === '女' || roleTag === '乙') role = 'female';
      else if (roleTag === '问') {
        role = 'narrator';
        if (!turnText.startsWith('问')) {
          turnText = '问：' + turnText;
        }
      } else if (roleTag === '★') {
        role = 'narrator';
        if (!turnText.startsWith('★')) {
          turnText = '★ ' + turnText;
        }
      }
      turns.push({ role, text: turnText });
    }
  }

  return turns.length > 0 ? turns : null;
}

function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Plays dialogue turns sequentially with natural multi-role voice alternating,
 * authentic pauses between turns (650ms), and 1200ms before question prompt.
 */
export async function playDialogueSequence(
  turns: DialogueTurn[],
  settings: VoiceSettings,
  overrideRate?: number,
  overridePitch?: number
): Promise<void> {
  stopChineseAudio();
  const controller = new AbortController();
  dialogueAbortController = controller;

  for (let i = 0; i < turns.length; i++) {
    if (controller.signal.aborted) break;

    const turn = turns[i];
    if (i > 0) {
      const pauseDuration = turn.role === 'narrator' ? 1200 : 650;
      await sleepWithAbort(pauseDuration, controller.signal);
      if (controller.signal.aborted) break;
    }

    const cleanText = cleanAudioText(turn.text);
    if (!cleanText) continue;

    let turnPitch = overridePitch ?? settings.pitch ?? 1.0;
    if (turn.role === 'male') {
      turnPitch = overridePitch ? overridePitch * 0.88 : 0.88;
    } else if (turn.role === 'female') {
      turnPitch = overridePitch ? overridePitch * 1.12 : 1.12;
    }

    await playBrowserUtterance(cleanText, settings, overrideRate, turnPitch, turn.role, true);
    if (controller.signal.aborted) break;
  }

  if (dialogueAbortController === controller) {
    dialogueAbortController = null;
  }
}

/**
 * Ranks speech synthesis voices to prioritize high-fidelity Neural Natural Chinese voices
 * (e.g. Xiaoxiao, Yunxi, Yunjian) over legacy robotic SAPI5 desktop voices (e.g. Huihui, Kangkang).
 */
export function rankVoice(
  v: SpeechSynthesisVoice,
  targetGender?: 'male' | 'female' | 'narrator'
): number {
  if (!v) return -1;
  const n = (v.name || '').toLowerCase();
  const lang = (v.lang || '').toLowerCase();

  // Voice must support Chinese/Mandarin
  const isChinese =
    lang.startsWith('zh') ||
    lang.includes('cmn') ||
    lang.includes('mandarin') ||
    n.includes('chinese') ||
    n.includes('mandarin');

  if (!isChinese) return -1;

  let score = 10; // Baseline for any valid Chinese voice

  // Major bonus for Neural / Natural / Online cloud-synthesized voices
  if (n.includes('natural') || n.includes('neural') || n.includes('online')) {
    score += 100;
  }

  if (targetGender === 'male') {
    // Top male neural voices
    if (n.includes('yunxi')) score += 60;
    else if (n.includes('yunjian') || n.includes('yunyang')) score += 50;
    else if (n.includes('male') || n.includes('danny') || n.includes('brian')) score += 20;
    else if (n.includes('kangkang')) score -= 5; // Valid male SAPI5 fallback, always below Neural (+100)

    // Heavily penalize female voices when searching for male
    if (
      n.includes('female') ||
      n.includes('xiaoxiao') ||
      n.includes('huihui') ||
      n.includes('tingting') ||
      n.includes('yaoyao') ||
      n.includes('xiaoyi')
    ) {
      score -= 80;
    }
  } else if (targetGender === 'female') {
    // Top female neural voices
    if (n.includes('xiaoxiao')) score += 60;
    else if (n.includes('xiaoyi') || n.includes('tingting')) score += 50;
    else if (n.includes('female') || n.includes('google') || n.includes('meijia')) score += 20;
    else if (n.includes('huihui') || n.includes('yaoyao')) score -= 5; // Valid female SAPI5 fallback, always below Neural (+100)

    // Heavily penalize male voices when searching for female
    if (
      n.includes('male') ||
      n.includes('yunxi') ||
      n.includes('yunjian') ||
      n.includes('yunyang') ||
      n.includes('kangkang')
    ) {
      score -= 80;
    }
  } else {
    // Narrator / default: Prioritize best natural neural voices (Xiaoxiao, Yunxi, etc.)
    if (n.includes('xiaoxiao') || n.includes('yunxi')) score += 60;
    else if (n.includes('yunjian') || n.includes('xiaoyi') || n.includes('tingting')) score += 50;
    else if (n.includes('google')) score += 30;
    else if (n.includes('huihui') || n.includes('kangkang') || n.includes('yaoyao')) score -= 5;
  }

  // Bonus for modern non-local web service voices (Edge Natural voices have localService === false)
  if (!v.localService) {
    score += 5;
  }

  return score;
}

/**
 * Plays Chinese audio using browser Web Speech Synthesis as reliable fallback
 */
function playBrowserUtterance(
  cleanText: string,
  settings: VoiceSettings,
  overrideRate?: number,
  overridePitch?: number,
  role?: 'male' | 'female' | 'narrator',
  skipGlobalStop: boolean = false
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      if (!skipGlobalStop) {
        stopChineseAudio();
      } else {
        if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {}
    activeHtmlAudio = null;
  }
  if (activeAudioSource) {
          try {
            activeAudioSource.stop();
            activeAudioSource.disconnect();
          } catch {}
          activeAudioSource = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
        }
        activeUtterance = null;
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = overrideRate ?? settings.rate ?? 0.85;
      utterance.volume = settings.volume ?? 1.0;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;

      // 0. If user chose a specific browser voice ID (and no role override)
      if (!role && settings.voiceId && !settings.voiceId.startsWith('gemini-') && settings.voiceId !== 'default') {
        selectedVoice = voices.find((v) => (v.voiceURI || v.name) === settings.voiceId);
      }

      // 1. Sort voices using rankVoice prioritizing Neural Natural Chinese voices
      if (!selectedVoice) {
        let targetGender: 'male' | 'female' | 'narrator' = 'narrator';
        if (role === 'male') {
          targetGender = 'male';
        } else if (role === 'female') {
          targetGender = 'female';
        } else {
          const isMaleGemini = ['gemini-zephyr', 'gemini-charon', 'gemini-fenrir'].includes(settings.voiceId);
          targetGender = isMaleGemini ? 'male' : 'narrator';
        }

        const candidateVoices = [...voices]
          .filter((v) => rankVoice(v, targetGender) > 0)
          .sort((a, b) => rankVoice(b, targetGender) - rankVoice(a, targetGender));

        if (candidateVoices.length > 0) {
          selectedVoice = candidateVoices[0];
        }
      }

      // 2. Fallback to any high-quality standard Chinese voice if still none selected
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

      // Pitch adjustment: If role is specified and no dedicated gender voice found on OS,
      // shift pitch so male sounds deep and female sounds clear!
      let effectivePitch = overridePitch ?? settings.pitch ?? 1.0;
      if (role === 'male' && (!selectedVoice || (!selectedVoice.name.toLowerCase().includes('yun') && !selectedVoice.name.toLowerCase().includes('male')))) {
        effectivePitch = overridePitch ? overridePitch * 0.88 : 0.88;
      } else if (role === 'female' && (!selectedVoice || (!selectedVoice.name.toLowerCase().includes('xiao') && !selectedVoice.name.toLowerCase().includes('ting') && !selectedVoice.name.toLowerCase().includes('female')))) {
        effectivePitch = overridePitch ? overridePitch * 1.12 : 1.12;
      }
      utterance.pitch = effectivePitch;

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
const ttsAudioCache = new Map<string, HTMLAudioElement>();

/**
 * High-Fidelity National Standard Putonghua Audio Stream (一级甲等普通话)
 * Plays studio-grade, pleasant, crystal-clear Mandarin audio across Grammar, Vocabulary, and Dictionary.
 */
export async function playPutonghuaAudioStream(
  text: string,
  rate: number = 1.0,
  voice: string = 'zh-CN-XiaoxiaoNeural'
): Promise<void> {
  stopChineseAudio();

  const trimmed = text.trim();
  if (!trimmed) return;

  const url = `/api/tts?text=${encodeURIComponent(trimmed)}&voice=${encodeURIComponent(voice)}`;
  const cacheKey = `${voice}:${trimmed}`;

  return new Promise((resolve, reject) => {
    const cached = ttsAudioCache.get(cacheKey);
    let audio: HTMLAudioElement;
    if (cached && !cached.error) {
      audio = cached;
      try {
        audio.currentTime = 0;
      } catch {}
    } else {
      if (cached) {
        ttsAudioCache.delete(cacheKey);
      }
      audio = new Audio(url);
      if (ttsAudioCache.size < 600) {
        ttsAudioCache.set(cacheKey, audio);
      }
    }

    activeHtmlAudio = audio;
    audio.playbackRate = rate || 1.0;

    let settled = false;
    let startupTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (settled) return;
      settled = true;
      ttsAudioCache.delete(cacheKey);
      if (activeHtmlAudio === audio) {
        activeHtmlAudio = null;
      }
      if (activePutonghuaStreamCancel === cancelPlayback) {
        activePutonghuaStreamCancel = null;
      }
      cleanupHandlers();
      try {
        audio.pause();
      } catch {}
      reject(new Error('TTS timeout'));
    }, 5000);

    const clearStartupTimer = () => {
      if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = null;
      }
    };

    const cleanupHandlers = () => {
      audio.onplaying = null;
      audio.oncanplay = null;
      audio.onended = null;
      audio.onerror = null;
    };

    const cancelPlayback = () => {
      if (settled) return;
      settled = true;
      clearStartupTimer();
      cleanupHandlers();
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      if (activeHtmlAudio === audio) {
        activeHtmlAudio = null;
      }
      resolve();
    };

    activePutonghuaStreamCancel = cancelPlayback;

    // Clear buffering timeout once playback starts so longer sentences never abort mid-flight
    audio.onplaying = () => {
      clearStartupTimer();
    };
    audio.oncanplay = () => {
      clearStartupTimer();
    };

    audio.onended = () => {
      if (settled) return;
      settled = true;
      clearStartupTimer();
      cleanupHandlers();
      if (activeHtmlAudio === audio) {
        activeHtmlAudio = null;
      }
      if (activePutonghuaStreamCancel === cancelPlayback) {
        activePutonghuaStreamCancel = null;
      }
      resolve();
    };

    audio.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearStartupTimer();
      cleanupHandlers();
      ttsAudioCache.delete(cacheKey);
      if (activeHtmlAudio === audio) {
        activeHtmlAudio = null;
      }
      if (activePutonghuaStreamCancel === cancelPlayback) {
        activePutonghuaStreamCancel = null;
      }
      reject(e);
    };

    audio.play().catch((err) => {
      if (settled) return;
      settled = true;
      clearStartupTimer();
      cleanupHandlers();
      if (err?.name !== 'AbortError') {
        ttsAudioCache.delete(cacheKey);
      }
      if (activeHtmlAudio === audio) {
        activeHtmlAudio = null;
      }
      if (activePutonghuaStreamCancel === cancelPlayback) {
        activePutonghuaStreamCancel = null;
      }
      if (err?.name === 'AbortError') {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

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

  // 1. If contains Chinese characters anywhere, it's Chinese
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return 'zh';
  }

  // 2. Sanitize dialogue tags and non-Hanzi parenthetical annotations (e.g. "(ba quả táo)", "(Bạn có khỏe không?)")
  const sanitized = sanitizeDialogueScript(trimmed);

  // If sanitized version now contains Hanzi (e.g. converted from dialogue tags or question prompt)
  if (/[\u4e00-\u9fa5]/.test(sanitized)) {
    return 'zh';
  }

  // 3. Uniquely Pinyin tone marks: Macron (tone 1: ā, ē, ī, ō, ū, ǖ), Caron (tone 3: ǎ, ě, ǐ, ǒ, ǔ, ǚ), Umlaut (ü, ǖ, ǘ, ǚ, ǜ)
  if (/[āēīōūǖǎěǐǒǔǚü]/.test(sanitized)) {
    return 'zh';
  }

  // 4. Uniquely Vietnamese characters (NEVER used in standard Pinyin)
  // Horn (ơ, ư), Circumflex tones (â, ê, ô with accents), Breve (ă), đ, dot below, hook above, tilde, y with accents
  if (/[ạảãâầấậẩẫăằắặẳẵẹẻẽêềếệểễịỉĩọỏõôồốộổỗơờớợởỡụủũưừứựửữỳýỵỷỹđ]/i.test(sanitized)) {
    return 'vi';
  }

  // 5. Shared acute/grave accents: á, à, é, è, í, ó, ò, ú, ù
  // Check if it resolves to valid Chinese Hanzi via resolveChineseTtsPayload
  if (/[áàéèíóòúù]/i.test(sanitized)) {
    const resolved = resolveChineseTtsPayload(sanitized);
    if (/[\u4e00-\u9fa5]/.test(resolved)) {
      return 'zh';
    }
    return 'vi';
  }

  // 6. Check if pure unaccented Latin words are standard Pinyin (e.g. "ni hao", "xie xie", "ma", "ba")
  const resolved = resolveChineseTtsPayload(sanitized);
  if (/[\u4e00-\u9fa5]/.test(resolved)) {
    return 'zh';
  }

  // 7. Default to English if predominantly Latin alphabet without diacritics
  if (/^[a-zA-Z0-9\s.,!?'"():;\-_/]+$/.test(sanitized)) {
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

  // For Chinese speech: First check if text is a structured dialogue with turns (男, 女, 问, 甲, 乙)
  let sourceText = text;
  if (targetLang === 'zh') {
    const turns = parseDialogueTurns(text);
    if (turns && turns.length > 1) {
      await playDialogueSequence(turns, settings, overrideRate, overridePitch);
      return;
    }

    const resolved = resolveChineseTtsPayload(text);
    if (resolved) {
      sourceText = resolved;
    } else if (/[\u4e00-\u9fa50-9]/.test(text)) {
      sourceText = text;
    } else {
      // No speakable Chinese content (e.g. untranslatable Vietnamese/English note)
      return;
    }
  }

  // Instant 0ms speech for real-time interactive live conversation
  if (preferInstantNative && targetLang === 'zh') {
    const cleanText = cleanAudioText(sourceText);
    await playBrowserUtterance(cleanText, settings, overrideRate, overridePitch);
    return;
  }

  // For Chinese with Neural Gemini Voices
  if (targetLang === 'zh') {
    const cleanText = cleanAudioText(sourceText);
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

    // Default High-Fidelity National First-Class Putonghua Audio Stream (一级甲等普通话)
    // Plays studio-quality standard Putonghua across Vocabulary, Grammar, and Dictionary
    try {
      const voiceToUse =
        settings.voiceId && settings.voiceId !== 'default' && !settings.voiceId.startsWith('gemini-')
          ? settings.voiceId
          : 'zh-CN-XiaoxiaoNeural';
      await playPutonghuaAudioStream(cleanText, overrideRate, voiceToUse);
      return;
    } catch {
      // Seamless fallback to browser speech synthesis if offline or network error
      await playBrowserUtterance(cleanText, settings, overrideRate, overridePitch);
      return;
    }
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

/**
 * Speaks a dialogue or listening script with automatic speaker turn detection,
 * gender-alternating natural neural voices (Xiaoxiao/Yunxi), authentic CLEC pauses
 * (650ms between turns, 1200ms before prompt), and HSK level-calibrated pacing.
 */
export async function speakDialogueScript(
  script: string,
  level: number = 3,
  overrideRate?: number,
  overridePitch?: number
): Promise<void> {
  if (!script || !script.trim()) return;

  const turns = parseDialogueTurns(script);
  const pacing = HSK_LEVEL_AUDIO_PACING[level] || { rate: 0.86, pitch: 1.0 };
  const rate = overrideRate ?? pacing.rate;
  const pitch = overridePitch ?? pacing.pitch;
  const settings = getSavedVoiceSettings();

  if (turns && turns.length > 1) {
    await playDialogueSequence(turns, settings, rate, pitch);
  } else {
    const sanitized = sanitizeDialogueScript(script);
    await playChineseAudio(sanitized, rate, pitch);
  }
}

/**
 * Plays an audio file from a URL with playback rate control and stops cleanly with stopChineseAudio.
 */
export function playAudioUrl(url: string, playbackRate = 1.0): Promise<void> {
  stopChineseAudio();
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === "undefined") return resolve();
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      activeHtmlAudio = audio;
      audio.onended = () => {
        activeHtmlAudio = null;
        resolve();
      };
      audio.onerror = (err) => {
        activeHtmlAudio = null;
        reject(err);
      };
      audio.play().catch((err) => {
        activeHtmlAudio = null;
        reject(err);
      });
    } catch (err) {
      activeHtmlAudio = null;
      reject(err);
    }
  });
}
