import crypto from 'crypto';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface EdgeVoiceMeta {
  id: string;
  gender: 'male' | 'female';
  role: string;
  baseRateOffset: number; // subtle percentage offset to make every voice sound equally clear & natural
}

export const EDGE_ZH_VOICES: Record<string, EdgeVoiceMeta> = {
  'zh-CN-XiaoxiaoNeural': {
    id: 'zh-CN-XiaoxiaoNeural',
    gender: 'female',
    role: 'standard_warm_female',
    baseRateOffset: -2,
  },
  'zh-CN-XiaoyiNeural': {
    id: 'zh-CN-XiaoyiNeural',
    gender: 'female',
    role: 'lively_young_female',
    baseRateOffset: -3,
  },
  'zh-CN-liaoning-XiaobeiNeural': {
    id: 'zh-CN-liaoning-XiaobeiNeural',
    gender: 'female',
    role: 'conversational_female',
    baseRateOffset: -2,
  },
  'zh-CN-shaanxi-XiaoniNeural': {
    id: 'zh-CN-shaanxi-XiaoniNeural',
    gender: 'female',
    role: 'expressive_female',
    baseRateOffset: -2,
  },
  'zh-CN-YunxiNeural': {
    id: 'zh-CN-YunxiNeural',
    gender: 'male',
    role: 'lively_young_male',
    baseRateOffset: -2,
  },
  'zh-CN-YunjianNeural': {
    id: 'zh-CN-YunjianNeural',
    gender: 'male',
    role: 'mature_steady_male',
    baseRateOffset: -2,
  },
  'zh-CN-YunyangNeural': {
    id: 'zh-CN-YunyangNeural',
    gender: 'male',
    role: 'broadcast_professional_male',
    baseRateOffset: -2,
  },
  'zh-CN-YunxiaNeural': {
    id: 'zh-CN-YunxiaNeural',
    gender: 'male',
    role: 'youth_student_male',
    baseRateOffset: -4,
  },
};

export const ALLOWED_EDGE_VOICE_IDS = new Set(Object.keys(EDGE_ZH_VOICES));

/**
 * 8 high-contrast Male + Female pairs so dialogues across an exam always sound
 * unmistakably distinct between speakers AND varied from question to question.
 */
const DIALOGUE_CAST_PAIRS: Array<{ male: string; female: string; narrator: string }> = [
  { male: 'zh-CN-YunxiNeural', female: 'zh-CN-XiaoxiaoNeural', narrator: 'zh-CN-YunjianNeural' },
  { male: 'zh-CN-YunjianNeural', female: 'zh-CN-XiaoyiNeural', narrator: 'zh-CN-YunyangNeural' },
  { male: 'zh-CN-YunyangNeural', female: 'zh-CN-XiaoxiaoNeural', narrator: 'zh-CN-YunjianNeural' },
  { male: 'zh-CN-YunxiNeural', female: 'zh-CN-XiaoyiNeural', narrator: 'zh-CN-XiaoxiaoNeural' },
  { male: 'zh-CN-YunjianNeural', female: 'zh-CN-XiaoxiaoNeural', narrator: 'zh-CN-YunyangNeural' },
  { male: 'zh-CN-YunyangNeural', female: 'zh-CN-XiaoyiNeural', narrator: 'zh-CN-XiaoxiaoNeural' },
  { male: 'zh-CN-YunxiNeural', female: 'zh-CN-liaoning-XiaobeiNeural', narrator: 'zh-CN-YunjianNeural' },
  { male: 'zh-CN-YunjianNeural', female: 'zh-CN-shaanxi-XiaoniNeural', narrator: 'zh-CN-YunyangNeural' },
];

/**
 * Diverse pool for monologues, picture-match sentences, and short listening talks.
 * Alternates female and male voices so consecutive questions never sound monotone.
 */
const MONOLOGUE_VOICE_POOL_STANDARD = [
  'zh-CN-XiaoxiaoNeural',
  'zh-CN-YunxiNeural',
  'zh-CN-XiaoyiNeural',
  'zh-CN-YunjianNeural',
  'zh-CN-liaoning-XiaobeiNeural',
  'zh-CN-YunyangNeural',
];

const MONOLOGUE_VOICE_POOL_ADVANCED = [
  'zh-CN-XiaoxiaoNeural',
  'zh-CN-YunyangNeural',
  'zh-CN-XiaoyiNeural',
  'zh-CN-YunjianNeural',
  'zh-CN-YunxiNeural',
];

const CHARACTER_VOICE_MAP: Record<string, string> = {
  '王老师': 'zh-CN-XiaoxiaoNeural',
  '李老师': 'zh-CN-XiaoxiaoNeural',
  '张老师': 'zh-CN-XiaoxiaoNeural',
  '女老师': 'zh-CN-XiaoxiaoNeural',
  '老师': 'zh-CN-XiaoxiaoNeural',
  '刘老师': 'zh-CN-YunjianNeural',
  '陈老师': 'zh-CN-YunjianNeural',
  '男老师': 'zh-CN-YunjianNeural',
  'ai小语': 'zh-CN-XiaoyiNeural',
  '小语': 'zh-CN-XiaoyiNeural',
  '小红': 'zh-CN-XiaoyiNeural',
  '小丽': 'zh-CN-XiaoyiNeural',
  '玛丽': 'zh-CN-XiaoyiNeural',
  '安娜': 'zh-CN-XiaoyiNeural',
  '女学生': 'zh-CN-XiaoyiNeural',
  '妹妹': 'zh-CN-XiaoyiNeural',
  '女儿': 'zh-CN-XiaoyiNeural',
  '妈妈': 'zh-CN-XiaoxiaoNeural',
  '母亲': 'zh-CN-XiaoxiaoNeural',
  '姐姐': 'zh-CN-XiaoxiaoNeural',
  '奶奶': 'zh-CN-shaanxi-XiaoniNeural',
  '外婆': 'zh-CN-shaanxi-XiaoniNeural',
  '小明': 'zh-CN-YunxiaNeural',
  '儿子': 'zh-CN-YunxiaNeural',
  '弟弟': 'zh-CN-YunxiaNeural',
  '男学生': 'zh-CN-YunxiNeural',
  '学生': 'zh-CN-YunxiNeural',
  '大卫': 'zh-CN-YunxiNeural',
  '麦克': 'zh-CN-YunxiNeural',
  '哥哥': 'zh-CN-YunxiNeural',
  '爸爸': 'zh-CN-YunjianNeural',
  '父亲': 'zh-CN-YunjianNeural',
  '爷爷': 'zh-CN-YunjianNeural',
  '医生': 'zh-CN-YunjianNeural',
  '大夫': 'zh-CN-YunjianNeural',
  '经理': 'zh-CN-YunyangNeural',
  '老板': 'zh-CN-YunyangNeural',
  '服务员': 'zh-CN-liaoning-XiaobeiNeural',
  '售货员': 'zh-CN-liaoning-XiaobeiNeural',
};

const FEMALE_TAG_PATTERNS = [
  /^女$/,
  /^乙$/,
  /^w$/i,
  /^f$/i,
  /^b$/i,
  /女|妈|姐|妹|婆|奶|姨|姑|婶|妻|太太|小姐|女士|小美|小红|小丽|玛丽|安娜|小语|服务员|售货员/,
];

const MALE_TAG_PATTERNS = [
  /^男$/,
  /^甲$/,
  /^m$/i,
  /^a$/i,
  /男|爸|哥|弟|爷|叔|伯|舅|夫|先生|小明|小刚|大卫|麦克|医生|经理|老板|儿子/,
];

export interface ParsedSegment {
  voice: string;
  text: string;
  pauseBeforeMs: number;
  role: 'male' | 'female' | 'narrator';
}

export interface SynthesizedTtsResult {
  buffer: Buffer;
  voicesUsed: string[];
  turnCount: number;
  provider: 'edge-neural-node';
}

function deterministicIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  const digest = crypto.createHash('md5').update(seed).digest();
  const num = digest.readUInt32BE(0);
  return num % length;
}

/**
 * Generates valid MPEG-2 Layer III (24kHz, 48kbps, Mono) silent MP3 frames.
 * Header 0xFF 0xF3 0x64 0xC4 = 144 bytes per 24ms frame — matches
 * OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3 byte-for-byte with zero pops/clicks.
 */
function createSilentMp3Buffer(durationMs: number): Buffer {
  if (durationMs <= 0) return Buffer.alloc(0);
  const frameCount = Math.max(1, Math.round(durationMs / 24));
  const silentFrame = Buffer.alloc(144, 0);
  silentFrame[0] = 0xff;
  silentFrame[1] = 0xf3;
  silentFrame[2] = 0x64;
  silentFrame[3] = 0xc4;
  const out = Buffer.allocUnsafe(frameCount * 144);
  for (let i = 0; i < frameCount; i++) {
    silentFrame.copy(out, i * 144);
  }
  return out;
}

/**
 * Strips Vietnamese headers, parenthetical Pinyin, fill-in blanks, and non-spoken metadata.
 */
export function cleanSpokenChineseText(raw: string): string {
  if (!raw) return '';
  let s = String(raw)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .trim();

  if (/[\u4e00-\u9fff]/.test(s)) {
    s = s
      .replace(/^(?:Câu|Bài|Question|Part|Phần)\s*\d+\s*[:：.\-)\]]\s*/i, '')
      .replace(
        /^(?:Đọc|Nghe)\s+(?:đoạn\s+)?(?:hội\s+thoại|câu|đoạn\s+văn)(?:\s+sau)?(?:\s+và\s+trả\s+lời(?:\s+câu\s+hỏi)?)?\s*[:：]?\s*/i,
        ''
      )
      .replace(
        /(?:^|[\r\n\s]+)(?:Nhân\s*vật(?:\s*tham\s*gia)?|Tuyến\s*nhân\s*vật|Người\s*tham\s*gia|Bối\s*cảnh|Tình\s*huống|Ngữ\s*cảnh|Gợi\s*ý|Chú\s*thích|人物|参与人物|对话人物|角色|背景|场景)\s*[:：][^\r\n]*/gi,
        ' '
      )
      .replace(/\([^()\u4e00-\u9fff]*\)/g, ' ')
      .replace(/（[^（）\u4e00-\u9fff]*）/g, ' ')
      .replace(/_{2,}|\(\s*\)|（\s*）/g, '，')
      .replace(/[*#`~>]/g, ' ');
  }

  return s.replace(/[ \t]{2,}/g, ' ').trim();
}

/**
 * Splits a long Chinese monologue into natural sentence chunks (<= maxChars)
 * so Edge TTS never truncates or loses prosody on long HSK 4–6 passages.
 */
function splitLongSentenceChunks(text: string, maxChars = 240): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return [clean];

  const sentences = clean
    .split(/(?<=[。！？!?；;])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    // Hard split on commas if no sentence-ending punctuation
    const clauses = clean
      .split(/(?<=[，,、])/)
      .map((s) => s.trim())
      .filter(Boolean);
    const out: string[] = [];
    let cur = '';
    for (const c of clauses) {
      if (cur && cur.length + c.length > maxChars) {
        out.push(cur);
        cur = c;
      } else {
        cur += c;
      }
    }
    if (cur) out.push(cur);
    return out.length > 0 ? out : [clean];
  }

  const chunks: string[] = [];
  let current = '';
  for (const sent of sentences) {
    if (current && current.length + sent.length > maxChars) {
      chunks.push(current);
      current = sent;
    } else {
      current += sent;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Selects a natural, context-appropriate (male, female, narrator) voice cast
 * for a dialogue, varying deterministically across different exam questions.
 */
export function resolveDialogueCast(
  scriptText: string,
  requestedVoice = 'auto',
  seedKey?: string,
  hskLevel?: number
): { male: string; female: string; narrator: string } {
  const hashSeed = `${seedKey || ''}|${scriptText}`;
  const idx = deterministicIndex(hashSeed, DIALOGUE_CAST_PAIRS.length);

  if (requestedVoice && requestedVoice !== 'auto' && EDGE_ZH_VOICES[requestedVoice]) {
    const meta = EDGE_ZH_VOICES[requestedVoice];
    if (meta.gender === 'male') {
      const fPool = ['zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-liaoning-XiaobeiNeural'];
      const female = fPool[deterministicIndex(hashSeed, fPool.length)];
      const narrator = requestedVoice === 'zh-CN-YunjianNeural' ? 'zh-CN-YunyangNeural' : 'zh-CN-YunjianNeural';
      return { male: requestedVoice, female, narrator };
    } else {
      const mPool = ['zh-CN-YunxiNeural', 'zh-CN-YunjianNeural', 'zh-CN-YunyangNeural'];
      const male = mPool[deterministicIndex(hashSeed, mPool.length)];
      const narrator = male === 'zh-CN-YunjianNeural' ? 'zh-CN-YunyangNeural' : 'zh-CN-YunjianNeural';
      return { male, female: requestedVoice, narrator };
    }
  }

  // Context-aware casting for authentic HSK scenarios
  if (/(?:男|甲|学生|同学|小明)\s*[:：][^。\n]*老师/.test(scriptText)) {
    return {
      male:
        hskLevel && hskLevel <= 2 && idx % 2 === 0
          ? 'zh-CN-YunxiaNeural'
          : 'zh-CN-YunxiNeural',
      female: 'zh-CN-XiaoxiaoNeural',
      narrator: 'zh-CN-YunjianNeural',
    };
  }
  if (/(?:女|乙|小红|玛丽)\s*[:：][^。\n]*老师/.test(scriptText)) {
    return {
      male: 'zh-CN-YunjianNeural',
      female: 'zh-CN-XiaoyiNeural',
      narrator: 'zh-CN-YunyangNeural',
    };
  }
  if (/(?:^|[\r\n])\s*(?:奶奶|外婆)\s*[:：]/.test(scriptText)) {
    return {
      male: idx % 2 === 0 ? 'zh-CN-YunxiNeural' : 'zh-CN-YunjianNeural',
      female: 'zh-CN-shaanxi-XiaoniNeural',
      narrator: 'zh-CN-YunyangNeural',
    };
  }
  if (/(?:^|[\r\n])\s*(?:爸爸|妈妈|爷爷|儿子|女儿)\s*[:：]/.test(scriptText)) {
    return {
      male: 'zh-CN-YunjianNeural',
      female: idx % 2 === 0 ? 'zh-CN-XiaoxiaoNeural' : 'zh-CN-liaoning-XiaobeiNeural',
      narrator: 'zh-CN-YunyangNeural',
    };
  }
  if (/(?:经理|公司|上班|面试|会议|汇报|医生|医院|机场|航班)/.test(scriptText)) {
    return {
      male: idx % 2 === 0 ? 'zh-CN-YunyangNeural' : 'zh-CN-YunjianNeural',
      female: idx % 2 === 0 ? 'zh-CN-XiaoxiaoNeural' : 'zh-CN-XiaoyiNeural',
      narrator: 'zh-CN-YunxiNeural',
    };
  }

  return DIALOGUE_CAST_PAIRS[idx];
}

export function resolveMonologueVoice(
  text: string,
  requestedVoice = 'auto',
  seedKey?: string,
  hskLevel?: number
): string {
  if (requestedVoice && requestedVoice !== 'auto' && EDGE_ZH_VOICES[requestedVoice]) {
    return requestedVoice;
  }
  const pool =
    hskLevel && hskLevel >= 4 ? MONOLOGUE_VOICE_POOL_ADVANCED : MONOLOGUE_VOICE_POOL_STANDARD;
  const hashSeed = `${seedKey || ''}|${text}`;
  return pool[deterministicIndex(hashSeed, pool.length)];
}

/**
 * Parses a listening script (dialogue or monologue) into ordered (voice, text, pauseBeforeMs) segments.
 * Strips ALL speaker labels (男：, 女：, 甲：, 乙：, A:, B:, 王老师：, etc.) so they are never read aloud.
 */
export function parseListeningSegments(
  rawText: string,
  options: {
    requestedVoice?: string;
    seedKey?: string;
    hskLevel?: number;
    includeQuestion?: boolean;
  } = {}
): ParsedSegment[] {
  const { requestedVoice = 'auto', seedKey, hskLevel, includeQuestion = false } = options;
  const cleaned = cleanSpokenChineseText(rawText);
  if (!cleaned) return [];

  // Split trailing question (问：... / Question: ... / ★ ...)
  let bodyText = cleaned;
  let questionText = '';
  const qSplitMatch = cleaned.match(/(?:^|[\r\n]+|(?<=[。！？!?]))\s*(?:问|Question|Hỏi|★)\s*[:：]?\s*(.+)$/is);
  if (qSplitMatch && qSplitMatch.index !== undefined) {
    const before = cleaned.slice(0, qSplitMatch.index).trim();
    const qPart = (qSplitMatch[1] || '').trim();
    if (before && /[\u4e00-\u9fff]/.test(before)) {
      bodyText = before;
      questionText = qPart;
    } else if (!before && qPart) {
      bodyText = qPart;
    }
  }

  const cast = resolveDialogueCast(bodyText, requestedVoice, seedKey, hskLevel);

  // Normalize inline speaker turns (supports newline, spaces, OR directly after 。！？!?)
  const speakerPrefix =
    /(?:^|[\r\n\s]+|(?<=[。！？!?]))(?=(?:男|女|甲|乙|AI小语|小语|王老师|李老师|张老师|刘老师|陈老师|男老师|女老师|老师|男学生|女学生|学生|同学们|同学|爸爸|父亲|妈妈|母亲|爷爷|奶奶|外婆|哥哥|姐姐|弟弟|妹妹|儿子|女儿|小明|小红|小丽|大卫|玛丽|安娜|麦克|医生|大夫|服务员|售货员|经理|老板|客人|A|B|M|W|F)\s*[:：])/gi;

  const normalized = bodyText.replace(speakerPrefix, '\n');
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const speakerLineRegex =
    /^([\u4e00-\u9fa5A-Za-z0-9_]{1,8}(?:说|的说|声)?)\s*[:：]\s*(.+)$/;

  const matchedSpeakerLines = lines.filter((line) => speakerLineRegex.test(line));
  const turnPauseMs = hskLevel && hskLevel <= 2 ? 480 : hskLevel && hskLevel >= 5 ? 360 : 420;

  // Case A: Single-speaker monologue / sentence (no dialogue markers)
  if (matchedSpeakerLines.length === 0) {
    const singleVoice = resolveMonologueVoice(bodyText, requestedVoice, seedKey, hskLevel);
    const singleRole = EDGE_ZH_VOICES[singleVoice]?.gender === 'male' ? 'male' : 'female';
    const chunks = splitLongSentenceChunks(bodyText, 240);
    const segments: ParsedSegment[] = chunks.map((chunk, idx) => ({
      voice: singleVoice,
      text: chunk,
      pauseBeforeMs: idx === 0 ? 0 : 220,
      role: singleRole,
    }));

    if (includeQuestion && questionText && /[\u4e00-\u9fff]/.test(questionText)) {
      const qVoice =
        singleRole === 'male'
          ? 'zh-CN-XiaoxiaoNeural'
          : 'zh-CN-YunjianNeural';
      segments.push({
        voice: qVoice,
        text: questionText,
        pauseBeforeMs: 650,
        role: 'narrator',
      });
    }
    return segments;
  }

  // Case B: Multi-speaker dialogue — cast distinct voices per speaker
  const segments: ParsedSegment[] = [];
  const speakerVoiceMap = new Map<string, { voice: string; role: 'male' | 'female' | 'narrator' }>();
  const usedVoices = new Set<string>();

  const fallbackPool = [
    cast.male,
    cast.female,
    'zh-CN-YunxiNeural',
    'zh-CN-XiaoxiaoNeural',
    'zh-CN-YunjianNeural',
    'zh-CN-XiaoyiNeural',
    'zh-CN-YunyangNeural',
    'zh-CN-liaoning-XiaobeiNeural',
    'zh-CN-shaanxi-XiaoniNeural',
  ];

  const assignVoiceForSpeaker = (rawTag: string): { voice: string; role: 'male' | 'female' | 'narrator' } => {
    const tag = rawTag.replace(/(?:说|的说|声)$/, '').trim();
    const key = tag.toLowerCase();
    const existing = speakerVoiceMap.get(key);
    if (existing) return existing;

    let chosenVoice: string | null = null;
    let role: 'male' | 'female' | 'narrator' = 'narrator';

    const isFemale = FEMALE_TAG_PATTERNS.some((re) => re.test(tag));
    const isMale = !isFemale && MALE_TAG_PATTERNS.some((re) => re.test(tag));

    if (CHARACTER_VOICE_MAP[key] && !usedVoices.has(CHARACTER_VOICE_MAP[key])) {
      chosenVoice = CHARACTER_VOICE_MAP[key];
      role = EDGE_ZH_VOICES[chosenVoice]?.gender === 'male' ? 'male' : 'female';
    } else if (isFemale) {
      role = 'female';
      if (!usedVoices.has(cast.female)) {
        chosenVoice = cast.female;
      } else {
        chosenVoice =
          fallbackPool.find((v) => EDGE_ZH_VOICES[v]?.gender === 'female' && !usedVoices.has(v)) ||
          cast.female;
      }
    } else if (isMale) {
      role = 'male';
      if (!usedVoices.has(cast.male)) {
        chosenVoice = cast.male;
      } else {
        chosenVoice =
          fallbackPool.find((v) => EDGE_ZH_VOICES[v]?.gender === 'male' && !usedVoices.has(v)) ||
          cast.male;
      }
    } else {
      chosenVoice = fallbackPool.find((v) => !usedVoices.has(v)) || fallbackPool[speakerVoiceMap.size % fallbackPool.length];
      role = EDGE_ZH_VOICES[chosenVoice]?.gender === 'male' ? 'male' : 'female';
    }

    usedVoices.add(chosenVoice);
    const assigned = { voice: chosenVoice, role };
    speakerVoiceMap.set(key, assigned);
    return assigned;
  };

  for (const line of lines) {
    const m = line.match(speakerLineRegex);
    if (m) {
      const speakerTag = m[1].trim();
      const spoken = m[2]
        .replace(speakerLineRegex, '$2')
        .trim();
      if (!spoken || !/[\u4e00-\u9fff0-9A-Za-z]/.test(spoken)) continue;

      const { voice, role } = assignVoiceForSpeaker(speakerTag);
      const chunks = splitLongSentenceChunks(spoken, 240);
      chunks.forEach((chunk, chunkIdx) => {
        segments.push({
          voice,
          text: chunk,
          pauseBeforeMs: segments.length === 0 ? 0 : chunkIdx === 0 ? turnPauseMs : 200,
          role,
        });
      });
    } else if (/[\u4e00-\u9fff0-9]/.test(line)) {
      const voice = cast.narrator;
      segments.push({
        voice,
        text: line,
        pauseBeforeMs: segments.length === 0 ? 0 : turnPauseMs,
        role: 'narrator',
      });
    }
  }

  if (includeQuestion && questionText && /[\u4e00-\u9fff]/.test(questionText)) {
    const lastVoice = segments[segments.length - 1]?.voice;
    const qVoice =
      cast.narrator !== lastVoice
        ? cast.narrator
        : EDGE_ZH_VOICES[lastVoice]?.gender === 'male'
        ? 'zh-CN-XiaoxiaoNeural'
        : 'zh-CN-YunjianNeural';
    segments.push({
      voice: qVoice,
      text: questionText,
      pauseBeforeMs: 650,
      role: 'narrator',
    });
  }

  return segments;
}

/**
 * Converts a rate param (numeric e.g. 0.92 or percentage string e.g. '-8%')
 * plus voice base offset into a valid Edge SSML prosody rate string like '-6%' or '+4%'.
 */
export function formatEdgeRatePercent(
  requestedRate: number | string | undefined,
  voiceId: string,
  hskLevel?: number
): string {
  let pct = 0;

  if (typeof requestedRate === 'string' && requestedRate.trim()) {
    const trimmed = requestedRate.trim();
    if (trimmed.endsWith('%')) {
      const parsed = parseFloat(trimmed.slice(0, -1));
      if (Number.isFinite(parsed)) pct = parsed;
    } else {
      const num = parseFloat(trimmed);
      if (Number.isFinite(num)) pct = Math.round((num - 1) * 100);
    }
  } else if (typeof requestedRate === 'number' && Number.isFinite(requestedRate)) {
    pct = Math.round((requestedRate - 1) * 100);
  } else if (hskLevel && hskLevel >= 1 && hskLevel <= 6) {
    // Gentle native-clarity HSK level pacing when caller didn't override speed
    const levelDefaults: Record<number, number> = {
      1: -6,
      2: -4,
      3: -2,
      4: 0,
      5: 0,
      6: 2,
    };
    pct = levelDefaults[hskLevel] ?? 0;
  }

  const baseOffset = EDGE_ZH_VOICES[voiceId]?.baseRateOffset ?? 0;
  const total = Math.max(-28, Math.min(28, Math.round(pct + baseOffset)));
  return total >= 0 ? `+${total}%` : `${total}%`;
}

/**
 * Synthesizes a single segment via Microsoft Edge Read Aloud WebSocket (pure Node.js)
 * with timeout protection and automatic retry.
 */
async function synthesizeSingleSegmentOnce(
  voice: string,
  text: string,
  rateStr: string,
  timeoutMs = 11000
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  const safeClose = () => {
    if (!closed) {
      closed = true;
      try {
        tts.close();
      } catch {}
    }
  };

  try {
    return await new Promise<Buffer>(async (resolve, reject) => {
      timer = setTimeout(() => {
        safeClose();
        reject(new Error(`EdgeTTS timeout after ${timeoutMs}ms (${voice})`));
      }, timeoutMs);

      try {
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(text, { rate: rateStr });
        const chunks: Buffer[] = [];

        audioStream.on('data', (chunk: Buffer | Uint8Array) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        audioStream.on('end', () => {
          if (timer) clearTimeout(timer);
          safeClose();
          const buf = Buffer.concat(chunks);
          if (buf.length < 128) {
            reject(new Error(`EdgeTTS returned empty audio (${buf.length} bytes)`));
          } else {
            resolve(buf);
          }
        });
        audioStream.on('error', (err: Error) => {
          if (timer) clearTimeout(timer);
          safeClose();
          reject(err);
        });
      } catch (err) {
        if (timer) clearTimeout(timer);
        safeClose();
        reject(err);
      }
    });
  } finally {
    if (timer) clearTimeout(timer);
    safeClose();
  }
}

async function synthesizeSingleSegmentWithRetry(
  voice: string,
  text: string,
  rateStr: string
): Promise<Buffer> {
  try {
    return await synthesizeSingleSegmentOnce(voice, text, rateStr, 11000);
  } catch (firstErr) {
    // Brief jittered retry once on transient Edge WebSocket hiccup
    await new Promise((r) => setTimeout(r, 250));
    try {
      return await synthesizeSingleSegmentOnce(voice, text, rateStr, 12000);
    } catch {
      throw firstErr;
    }
  }
}

/**
 * Full pure-Node multi-speaker Neural TTS synthesis pipeline.
 * Synthesizes dialogue turns in parallel (bounded concurrency), stitches with
 * true MPEG-2 silent MP3 pauses, and returns a single seamless MP3 Buffer.
 */
export async function synthesizeEdgeNeuralTts(
  rawText: string,
  options: {
    voice?: string;
    rate?: number | string;
    seed?: string;
    level?: number;
    includeQuestion?: boolean;
  } = {}
): Promise<SynthesizedTtsResult> {
  const segments = parseListeningSegments(rawText, {
    requestedVoice: options.voice || 'auto',
    seedKey: options.seed,
    hskLevel: options.level,
    includeQuestion: Boolean(options.includeQuestion),
  });

  if (segments.length === 0) {
    throw new Error('No speakable Chinese content found for TTS synthesis');
  }

  // Synthesize segments in parallel (up to 4 concurrent WebSockets per request)
  const MAX_CONCURRENCY = 4;
  const buffers: Buffer[] = new Array(segments.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, segments.length) },
    async () => {
      while (cursor < segments.length) {
        const idx = cursor++;
        const seg = segments[idx];
        const rateStr = formatEdgeRatePercent(options.rate, seg.voice, options.level);
        buffers[idx] = await synthesizeSingleSegmentWithRetry(seg.voice, seg.text, rateStr);
      }
    }
  );

  await Promise.all(workers);

  const stitchedParts: Buffer[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].pauseBeforeMs > 0) {
      stitchedParts.push(createSilentMp3Buffer(segments[i].pauseBeforeMs));
    }
    stitchedParts.push(buffers[i]);
  }

  const voicesUsed = Array.from(new Set(segments.map((s) => s.voice)));

  return {
    buffer: Buffer.concat(stitchedParts),
    voicesUsed,
    turnCount: segments.length,
    provider: 'edge-neural-node',
  };
}
