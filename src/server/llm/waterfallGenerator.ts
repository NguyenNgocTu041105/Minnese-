import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import { CandidateQuestion, GenerationOptions, LLMProviderConfig } from './types.js';
import { getRotatedVocab, VocabItem } from './vocabRotator.js';
import { robustJsonParse, parseWithSelfRepair } from './jsonParser.js';
import { buildHskPrompt, VALID_ILLUSTRATION_THEMES } from './promptTemplates.js';
import { getExpectedOptionCount } from './questionValidator.js';

// Load local .env if available
dotenv.config();

/**
 * Priority Chain Configuration:
 * 1. DeepSeek-V3
 * 2. Gemini 1.5 Flash
 * 3. Groq Cloud
 * 4. Local Ollama
 */
export const WATERFALL_PROVIDERS: LLMProviderConfig[] = [
  {
    id: 'deepseek-v3',
    name: 'DeepSeek',
    displayName: 'DeepSeek-V3',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-flash', 'deepseek-chat'],
    getApiKey: () => process.env.DEEPSEEK_API_KEY?.trim(),
    isFreeTier: false,
    status: 'free_tier_not_eligible',
    statusReason: 'Zero granted free balance (0.00 USD). Blocked in free-only mode to prevent consuming topped-up funds.',
    paidModeAllowed: process.env.DEEPSEEK_ALLOW_PAID === 'true',
    maxBudgetUsd: Number(process.env.DEEPSEEK_MAX_BUDGET_USD || 1.0),
    maxTokenLimit: Number(process.env.DEEPSEEK_MAX_TOKEN_LIMIT || 4000),
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini',
    displayName: 'Gemini 1.5 Flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'],
    getApiKey: () => (process.env.GEMINI_API_KEY || process.env.QBANK_LLM_API_KEY)?.trim(),
    isFreeTier: true,
    status: 'eligible',
    statusReason: 'Google AI Studio Free Tier (15 RPM). Note: May encounter capacity spikes (HTTP 503).',
  },
  {
    id: 'groq-llama-3.3',
    name: 'Groq',
    displayName: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    getApiKey: () => process.env.GROQ_API_KEY?.trim(),
    isFreeTier: true,
    supportsStrictJsonSchema: true,
    status: 'eligible',
    statusReason: 'Groq Cloud Free Tier active with rolling 1000-token TPM limit.',
  },
  {
    id: 'ollama-qwen2.5',
    name: 'Local Ollama',
    displayName: 'Local Ollama (Qwen 2.5 7B)',
    baseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1').replace('localhost', '127.0.0.1'),
    models: ['qwen2.5:7b'],
    getApiKey: () => 'ollama',
    isLocal: true,
    isFreeTier: true,
    status: 'eligible',
    statusReason: 'Local Ollama offline engine, 0 cost.',
  },
];

export interface DeepSeekBalanceInfo {
  currency: string;
  totalBalance: string;
  grantedBalance: string;
  toppedUpBalance: string;
}

export interface DeepSeekBalanceReport {
  isAvailable: boolean;
  balances: DeepSeekBalanceInfo[];
  grantedBalance: number;
  toppedUpBalance: number;
  totalBalance: number;
  eligibleForFree: boolean;
  status: string;
  statusReason: string;
}

/**
 * Checks DeepSeek official balance endpoint GET https://api.deepseek.com/user/balance.
 * Differentiates granted_balance vs topped_up_balance.
 */
export async function checkDeepSeekBalance(apiKey?: string): Promise<DeepSeekBalanceReport> {
  const key = apiKey || process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    return {
      isAvailable: false,
      balances: [],
      grantedBalance: 0,
      toppedUpBalance: 0,
      totalBalance: 0,
      eligibleForFree: false,
      status: 'disabled',
      statusReason: 'No DEEPSEEK_API_KEY configured in environment.',
    };
  }

  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
    });
    const data = (await res.json()) as any;
    const balances: DeepSeekBalanceInfo[] = (data.balance_infos || []).map((b: any) => ({
      currency: b.currency || 'USD',
      totalBalance: b.total_balance || '0.00',
      grantedBalance: b.granted_balance || '0.00',
      toppedUpBalance: b.topped_up_balance || '0.00',
    }));

    const granted = balances.reduce((sum, b) => sum + parseFloat(b.grantedBalance || '0'), 0);
    const toppedUp = balances.reduce((sum, b) => sum + parseFloat(b.toppedUpBalance || '0'), 0);
    const total = balances.reduce((sum, b) => sum + parseFloat(b.totalBalance || '0'), 0);

    const eligibleForFree = Boolean(data.is_available && granted > 0);

    return {
      isAvailable: Boolean(data.is_available),
      balances,
      grantedBalance: granted,
      toppedUpBalance: toppedUp,
      totalBalance: total,
      eligibleForFree,
      status: eligibleForFree ? 'eligible' : 'free_tier_not_eligible',
      statusReason: eligibleForFree
        ? `Has granted free balance (${granted} USD).`
        : `Zero granted free balance (granted=${granted}, topped_up=${toppedUp}). Blocked in free-only mode to prevent consuming topped-up funds.`,
    };
  } catch (err: any) {
    return {
      isAvailable: false,
      balances: [],
      grantedBalance: 0,
      toppedUpBalance: 0,
      totalBalance: 0,
      eligibleForFree: false,
      status: 'billing_blocked',
      statusReason: `Failed to query DeepSeek balance: ${err.message}`,
    };
  }
}

/**
 * Checks if the system is configured for free-tier-only operation.
 * Defaults to true unless explicitly allowed via QBANK_LLM_ALLOW_PAID=true.
 */
export function isFreeTierOnly(): boolean {
  const allowPaid = process.env.DEEPSEEK_ALLOW_PAID === 'true';
  if (allowPaid && process.env.DEEPSEEK_API_KEY) {
    return false;
  }
  return true;
}

export function getFreeProviderAllowlist(): Set<string> | null {
  const raw = process.env.QBANK_LLM_FREE_PROVIDERS?.trim();
  if (!raw) return null;
  return new Set(raw.split(',').map((provider) => provider.trim().toLowerCase()).filter(Boolean));
}

function isAllowedFreeProvider(provider: LLMProviderConfig): boolean {
  if (provider.isFreeTier !== true) return false;
  const allowlist = getFreeProviderAllowlist();
  if (!allowlist) return true;
  return allowlist.has(provider.id.toLowerCase()) || allowlist.has(provider.name.toLowerCase());
}

export function buildQuestionResponseFormat(level: number, skill: string, partType: string, count: number) {
  const boundedLevel = Math.max(1, Math.min(level || 1, 6));
  const boundedCount = Math.max(1, Math.min(count || 1, 50));
  const bpExpected = getExpectedOptionCount(boundedLevel, partType);
  const optionMatch = partType.match(/_(\d+)opt/i);
  const optionCount = bpExpected !== null
    ? bpExpected
    : /^write_/i.test(partType) && !optionMatch
    ? 0
    : optionMatch
    ? Number(optionMatch[1])
    : (boundedLevel <= 2 && (skill === 'listening' || skill === 'reading' || /^listen_|^read_/i.test(partType))
        ? (/6opt|split|word_bank|matching/i.test(partType) ? 6 : 3)
        : 4);
  const isImageOptions = new Set([
    'listen_picture_match_3opt',
    'listen_picture_match_4opt',
    'listen_dialogue_picture_match_6opt',
    'listen_dialogue_picture_match_split',
    'read_sentence_picture_match_6opt',
  ]).has(partType);
  const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
  const questionSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      stem: { type: 'string' },
      completed_stem: { type: 'string' },
      options: { type: 'array', minItems: optionCount, maxItems: optionCount, items: { type: 'string' } },
      options_images: {
        type: 'array',
        minItems: isImageOptions ? optionCount : 0,
        maxItems: isImageOptions ? optionCount : 0,
        items: { type: 'string' },
      },
      answer_idx: { type: 'integer', minimum: 0, maximum: Math.max(0, optionCount - 1) },
      explanation_summary_vi: { type: 'string' },
      answer_rationale_vi: { type: 'string' },
      level: { type: 'integer', enum: [boundedLevel] },
      skill: { type: 'string', enum: ['listening', 'reading', 'writing'] },
      part_type: { type: 'string', enum: [partType] },
      pinyin: nullableString,
      illustration_theme: nullableString,
      topic: nullableString,
      difficulty_tier: { type: 'string', enum: ['tier1_difficult', 'tier2_very_difficult', 'tier3_challenge'] },
      trap_type: { type: 'string' },
      target_grammar: { type: 'string' },
      target_vocabulary: { type: 'string' },
      distractor_rationales: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            option_idx: { type: 'integer', minimum: 0, maximum: Math.max(0, optionCount - 1) },
            option_text: { type: 'string' },
            rationale_vi: { type: 'string' },
          },
          required: ['option_idx', 'option_text', 'rationale_vi'],
        },
      },
      naturalness_review: {
        type: 'object',
        additionalProperties: false,
        properties: {
          status: { type: 'string', enum: ['natural', 'unnatural'] },
          rationale_vi: { type: 'string' },
        },
        required: ['status', 'rationale_vi'],
      },
    },
    required: [
      'stem', 'completed_stem', 'options', 'options_images', 'answer_idx', 'explanation_summary_vi', 'answer_rationale_vi', 'level', 'skill', 'part_type',
      'pinyin', 'illustration_theme', 'topic', 'difficulty_tier', 'trap_type', 'target_grammar', 'target_vocabulary',
      'distractor_rationales', 'naturalness_review',
    ],
  };

  return {
    type: 'json_schema',
    json_schema: {
      name: 'hsk_question_batch',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          questions: {
            type: 'array',
            minItems: boundedCount,
            maxItems: boundedCount,
            items: questionSchema,
          },
        },
        required: ['questions'],
      },
    },
  };
}

export function parseRetryAfterMs(value: string | null, errorMessage = ''): number | undefined {
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
    const duration = value.match(/([\d.]+)\s*(ms|s|m)/i);
    if (duration) {
      const amount = Number(duration[1]);
      const unit = duration[2].toLowerCase();
      return Math.ceil(amount * (unit === 'm' ? 60000 : unit === 's' ? 1000 : 1));
    }
  }
  const bodyDelay = errorMessage.match(/(?:try again in|retry after)\s*([\d.]+)\s*(ms|seconds?|s)/i);
  if (!bodyDelay) return undefined;
  const amount = Number(bodyDelay[1]);
  return Math.ceil(amount * (/ms/i.test(bodyDelay[2]) ? 1 : 1000));
}

/**
 * Loads blueprint for a given HSK level
 */
export function loadBlueprint(level: number): any {
  const bpPath = path.resolve(process.cwd(), `data/qbank/blueprint/level${level}.json`);
  if (fs.existsSync(bpPath)) {
    try {
      return JSON.parse(fs.readFileSync(bpPath, 'utf-8'));
    } catch {
      // Return default blueprint
    }
  }
  return {
    level,
    sections: {
      reading: {
        parts: {
          reading_1: { type: 'read_fill_blank_4opt', n_options: 4 },
        },
      },
    },
  };
}

/**
 * Extracts and parses JSON from raw LLM text using robust parser.
 * Retained for backwards compatibility with tests and external callers.
 */
export function extractJsonFromText(rawText: string): any {
  return robustJsonParse(rawText);
}

/**
 * 27 Vector illustration themes matching HSKIllustrationCanvas.tsx
 */
export const ILLUSTRATION_THEMES = [...VALID_ILLUSTRATION_THEMES];

/**
 * Pluggable mock provider handler hook for Vitest and offline testing.
 */
export type MockLLMHandler = (
  options: GenerationOptions & {
    targetVocabs?: VocabItem[];
    maxCallsPerTask?: number;
    batchSize?: number;
    maxDurationMs?: number;
  }
) => Promise<CandidateQuestion[]> | CandidateQuestion[] | null;

let customMockHandler: MockLLMHandler | null = null;

export function setMockLLMHandler(handler: MockLLMHandler | null): void {
  customMockHandler = handler;
}

export function resetMockLLMHandler(): void {
  customMockHandler = null;
}

/**
 * Generates realistic mock questions strictly adhering to HSK 1-6 schemas
 * for isolated offline test fixtures and dry-runs.
 * Strict rules: 4 options, same POS distractors, valid 27 illustration themes.
 */
export function generateMockQuestions(
  level: number,
  skill: string,
  count: number,
  targetVocabs: VocabItem[] = [],
  partType?: string
): CandidateQuestion[] {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MOCK_FORBIDDEN_IN_PRODUCTION: Mock question generator is strictly prohibited in production.');
  }
  const mockTemplates = [
    {
      stem: '今天天气很好，我想去____借两本书。',
      options: ['学校', '医院', '机场', '商店'],
      answer_idx: 0,
      explanation_vi: 'Ngữ cảnh mượn sách thì địa điểm phù hợp là 学校 (trường học). Các phương án 医院 (bệnh viện), 机场 (sân bay), 商店 (cửa hàng) đều không dùng để mượn sách.',
      part_type: 'read_fill_blank_4opt',
      theme: null,
      skill: 'reading',
    },
    {
      stem: '他身体不太舒服，现在要去____看医生。',
      options: ['医院', '商店', '机场', '茶馆'],
      answer_idx: 0,
      explanation_vi: 'Người không khỏe đi khám bác sĩ thì đến 医院 (bệnh viện). Các địa điểm khác không phù hợp ngữ cảnh khám bệnh.',
      part_type: 'read_fill_blank_4opt',
      theme: 'hospital',
      skill: 'reading',
    },
    {
      stem: '桌子上有三个新鲜的____。',
      options: ['苹果', '香蕉', '西瓜', '米饭'],
      answer_idx: 0,
      explanation_vi: 'Trên bàn có 3 quả táo tươi ngon (苹果). Cả 4 phương án đều là danh từ chỉ đồ ăn hoa quả, nhưng 苹果 phù hợp nhất với lượng từ 个.',
      part_type: 'listen_picture_match_4opt',
      theme: 'apple',
      skill: 'listening',
    },
    {
      stem: '外面正在下雨，我们坐____去火车站吧。',
      options: ['出租车', '自行车', '飞机', '火车'],
      answer_idx: 0,
      explanation_vi: 'Trời đang mưa đi ga tàu thì đi bằng 出租车 (taxi) là tiện lợi và hợp lý nhất.',
      part_type: 'listen_picture_match_4opt',
      theme: 'taxi',
      skill: 'listening',
    },
    {
      stem: '晚上十点了，他要准备去____。',
      options: ['睡觉', '工作', '买菜', '跑步'],
      answer_idx: 0,
      explanation_vi: 'Mười giờ tối là thời gian chuẩn bị đi ngủ (睡觉). Các động từ khác không phù hợp với thói quen sinh hoạt buổi tối.',
      part_type: 'read_fill_blank_4opt',
      theme: 'sleeping',
      skill: 'reading',
    },
    {
      stem: '老师正在教室里教学生____。',
      options: ['写字', '唱歌', '跳舞', '游泳'],
      answer_idx: 0,
      explanation_vi: 'Giáo viên trong lớp học dạy học sinh viết chữ (写字). Cả 4 phương án đều là động từ hoạt động.',
      part_type: 'read_fill_blank_4opt',
      theme: 'writing',
      skill: 'reading',
    },
    {
      stem: '小猫在椅子下面睡觉，它非常____。',
      options: ['可爱', '难过', '漂亮', '高兴'],
      answer_idx: 0,
      explanation_vi: 'Chú mèo con ngủ dưới ghế trông rất đáng yêu (可爱). Cả 4 phương án đều là tính từ cùng từ loại.',
      part_type: 'listen_picture_match_4opt',
      theme: 'cat',
      skill: 'listening',
    },
    {
      stem: '妈妈在厨房里做____，味道真香。',
      options: ['米饭', '面条', '包子', '饺子'],
      answer_idx: 0,
      explanation_vi: 'Mẹ đang ở trong bếp nấu cơm (米饭), mùi thơm nức. Cả 4 lựa chọn đều là danh từ chỉ món ăn.',
      part_type: 'read_fill_blank_4opt',
      theme: 'rice',
      skill: 'reading',
    },
    {
      stem: '请把下面的词语排列成一个完整的句子：',
      options: ['昨天', '我们', '去公园', '散步'],
      answer_idx: 0,
      explanation_vi: 'Thứ tự đúng của câu tiếng Trung là: Thời gian (昨天) + Chủ ngữ (我们) + Cụm động từ chỉ nơi chốn (去公园) + Động từ hành động (散步).',
      part_type: 'write_sentence_reorder_4opt',
      theme: null,
      skill: 'writing',
    },
    {
      stem: '请把给出的词语组合成正确的汉语句子：',
      options: ['妹妹', '喜欢', '一边听音乐', '一边做作业'],
      answer_idx: 0,
      explanation_vi: 'Cấu trúc liên từ 一边...一边... diễn tả hai hành động song song: Chủ ngữ (妹妹) + 喜欢 + 一边听音乐 + 一边做作业.',
      part_type: 'write_sentence_reorder_4opt',
      theme: null,
      skill: 'writing',
    },
  ];

  let pool = mockTemplates;
  if (partType) {
    const matched = mockTemplates.filter((t) => t.part_type === partType);
    if (matched.length > 0) pool = matched;
  } else if (skill && skill !== 'all') {
    const matched = mockTemplates.filter((t) => t.skill === skill);
    if (matched.length > 0) pool = matched;
  }

  const results: CandidateQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const targetWord = targetVocabs[i % targetVocabs.length]?.word;
    const matchingTmpl = pool.find((t) => targetWord && t.options.includes(targetWord));
    const tmpl = matchingTmpl || pool[(i + (level - 1) * 2) % pool.length];

    const stem = tmpl.stem;
    const options = [...tmpl.options];
    let explanation = tmpl.explanation_vi;
    let answerIdx = targetWord && tmpl.options.includes(targetWord) ? tmpl.options.indexOf(targetWord) : 0;

    if (targetWord && !options.includes(targetWord)) {
      options[0] = targetWord;
      answerIdx = 0;
      explanation = `Đáp án đúng là ${targetWord}, phù hợp hoàn hảo với ngữ cảnh câu hỏi HSK cấp ${level}.`;
    }

    // Auto-compute tone-marked pinyin with pinyin-pro
    const pinyinText = getPinyinPro(stem.replace(/_{2,}|（\s*）|\(\s*\)/g, options[answerIdx]), { toneType: 'symbol' });

    results.push({
      stem,
      options,
      answer_idx: answerIdx,
      explanation_vi: explanation,
      level,
      skill: (skill === 'all' ? (tmpl.skill as any) : skill) as any,
      part_type: tmpl.part_type,
      pinyin: pinyinText,
      illustration_theme: tmpl.theme,
      provider_used: 'mock-llm',
    });
  }

  return results;
}

export interface LLMCallOutput {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    queueTime?: number;
    promptTime?: number;
    completionTime?: number;
    totalTime?: number;
  };
  rateLimits?: {
    limitRequests?: number;
    remainingRequests?: number;
    resetRequests?: string;
    limitTokens?: number;
    remainingTokens?: number;
    resetTokens?: string;
    retryAfter?: number;
    requestId?: string;
  };
}

/**
 * Calls a single OpenAI-compatible endpoint with timeout, status handling,
 * and token usage recording.
 */
async function callOpenAICompatible(
  provider: LLMProviderConfig,
  model: string,
  prompt: string,
  timeoutMs = 45000,
  responseFormat?: any,
  maxCompletionTokens = 900,
): Promise<LLMCallOutput> {
  const apiKey = provider.getApiKey();
  if (!apiKey && !provider.isLocal) {
    throw new Error(`Missing or empty API key for provider ${provider.displayName}`);
  }

  // Strict Preflight Guard: If freeOnly policy is active, strictly reject paid providers before opening network sockets
  if (isFreeTierOnly() && !isAllowedFreeProvider(provider)) {
    const blockedErr: any = new Error(
      `PREFLIGHT_BLOCKED_PAID_PROVIDER: Network request to paid provider '${provider.displayName}' was blocked before transmission (Zero-Cost Policy active).`
    );
    blockedErr.code = 'PAID_PROVIDER_BLOCKED_PREFLIGHT';
    blockedErr.provider = provider.id;
    throw blockedErr;
  }

  const isOllamaLocal = Boolean(provider.isLocal || /11434/i.test(provider.baseUrl));
  const endpointUrl = isOllamaLocal
    ? `${provider.baseUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '')}/api/chat`
    : `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const authHeader = provider.isLocal
    ? 'Bearer ollama'
    : `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Minnese/1.0',
  };
  if (!isOllamaLocal) {
    requestHeaders.Authorization = authHeader;
  }

  const requestBody = isOllamaLocal
    ? JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You generate authentic HSK exam questions in strictly valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        format: 'json',
        options: {
          num_ctx: 8192,
          temperature: 0.7,
        },
      })
    : JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You generate authentic HSK exam questions in strictly valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        ...(responseFormat
          ? { response_format: responseFormat, reasoning_format: 'hidden' }
          : (provider.isLocal ? { response_format: { type: 'json_object' } } : {})),
        ...(model.startsWith('o1') || model.startsWith('o3')
          ? { max_completion_tokens: maxCompletionTokens }
          : { max_tokens: maxCompletionTokens }),
      });

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    const rateLimits = {
      limitRequests: response.headers.get('x-ratelimit-limit-requests') ? Number(response.headers.get('x-ratelimit-limit-requests')) : undefined,
      remainingRequests: response.headers.get('x-ratelimit-remaining-requests') ? Number(response.headers.get('x-ratelimit-remaining-requests')) : undefined,
      resetRequests: response.headers.get('x-ratelimit-reset-requests') || undefined,
      limitTokens: response.headers.get('x-ratelimit-limit-tokens') ? Number(response.headers.get('x-ratelimit-limit-tokens')) : undefined,
      remainingTokens: response.headers.get('x-ratelimit-remaining-tokens') ? Number(response.headers.get('x-ratelimit-remaining-tokens')) : undefined,
      resetTokens: response.headers.get('x-ratelimit-reset-tokens') || undefined,
      retryAfter: response.headers.get('retry-after') ? Number(response.headers.get('retry-after')) : undefined,
      requestId: response.headers.get('x-request-id') || response.headers.get('x-groq-id') || undefined,
    };

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 400) {
        console.warn(`[Waterfall HTTP 400 Detail] ${provider.displayName} (${model}):`, errText);
      }
      const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'), errText);
      const remainingTokens = Number(response.headers.get('x-ratelimit-remaining-tokens'));
      const resetTokens = response.headers.get('x-ratelimit-reset-tokens') || undefined;
      const usageMatch = errText.match(/Limit\s+(\d+)[\s\S]{0,80}?Used\s+(\d+)[\s\S]{0,80}?Requested\s+(\d+)/i);
      let safeMessage = `HTTP ${response.status} from ${provider.displayName} (${model})`;
      if (response.status === 429) {
        safeMessage += `: rate limited${retryAfterMs === undefined ? '' : `; retry after ${retryAfterMs}ms`}`;
        if (usageMatch) safeMessage += `; output-token window ${usageMatch[2]}/${usageMatch[1]} used, ${usageMatch[3]} requested`;
      } else if (response.status === 401 || response.status === 403) {
        safeMessage += ': authentication rejected';
      } else if (response.status === 404) {
        safeMessage += ': model or endpoint not found';
      }
      const err: any = new Error(safeMessage);
      err.status = response.status;
      err.provider = provider.id;
      if (retryAfterMs !== undefined) err.retryAfterMs = retryAfterMs;
      if (Number.isFinite(remainingTokens)) err.remainingTokens = remainingTokens;
      if (resetTokens) err.resetTokens = resetTokens;
      if (rateLimits.requestId) err.requestId = rateLimits.requestId;
      err.rateLimits = rateLimits;
      if (usageMatch) {
        err.tokenLimit = Number(usageMatch[1]);
        err.tokensUsed = Number(usageMatch[2]);
        err.tokensRequested = Number(usageMatch[3]);
      }
      throw err;
    }

    const data: any = await response.json();
    const content = isOllamaLocal ? data?.message?.content : data?.choices?.[0]?.message?.content;
    const finishReason = isOllamaLocal ? (data?.done ? 'stop' : undefined) : data?.choices?.[0]?.finish_reason;
    if (!content || typeof content !== 'string') {
      throw new Error(`Empty content received from ${provider.displayName}`);
    }

    let usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      queueTime?: number;
      promptTime?: number;
      completionTime?: number;
      totalTime?: number;
    } | undefined;
    if (isOllamaLocal && (data?.prompt_eval_count || data?.eval_count)) {
      usage = {
        promptTokens: Number(data.prompt_eval_count || 0),
        completionTokens: Number(data.eval_count || 0),
        totalTokens: Number((data.prompt_eval_count || 0) + (data.eval_count || 0)),
        promptTime: data.prompt_eval_duration ? Number(data.prompt_eval_duration) / 1e6 : undefined,
        completionTime: data.eval_duration ? Number(data.eval_duration) / 1e6 : undefined,
        totalTime: data.total_duration ? Number(data.total_duration) / 1e6 : undefined,
      };
    } else if (data?.usage) {
      usage = {
        promptTokens: Number(data.usage.prompt_tokens || 0),
        completionTokens: Number(data.usage.completion_tokens || 0),
        totalTokens: Number(data.usage.total_tokens || 0),
      };
      if (data.usage.queue_time !== undefined) usage.queueTime = Number(data.usage.queue_time);
      if (data.usage.prompt_time !== undefined) usage.promptTime = Number(data.usage.prompt_time);
      if (data.usage.completion_time !== undefined) usage.completionTime = Number(data.usage.completion_time);
      if (data.usage.total_time !== undefined) usage.totalTime = Number(data.usage.total_time);
    }

    return { content, usage, finishReason, rateLimits };
  } finally {
    clearTimeout(timer);
  }
}

export type LLMErrorCategory =
  | 'transient_error'
  | 'auth_error'
  | 'config_error'
  | 'validation_error'
  | 'quota_exhausted';

/**
 * Classifies any LLM or HTTP error into one of 5 standard categories.
 */
export function classifyLLMError(err: any): {
  category: LLMErrorCategory;
  message: string;
  status?: number;
  isRetryable: boolean;
} {
  const status = err?.status ?? err?.statusCode;
  const msg = String(err?.message || '').toLowerCase();

  // 1. Auth Error
  if (
    status === 401 ||
    status === 403 ||
    msg.includes('api key') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('authentication')
  ) {
    return { category: 'auth_error', message: err?.message || 'Authentication error', status, isRetryable: false };
  }

  // 2. Config Error
  if (
    status === 404 ||
    msg.includes('model not found') ||
    msg.includes('not found') ||
    msg.includes('invalid model') ||
    msg.includes('deprecated model')
  ) {
    return { category: 'config_error', message: err?.message || 'Configuration error', status, isRetryable: false };
  }

  // 3. Quota Exhausted
  if (
    status === 429 ||
    status === 402 ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('insufficient_quota') ||
    msg.includes('too many requests')
  ) {
    return { category: 'quota_exhausted', message: err?.message || 'Quota exhausted', status, isRetryable: false };
  }

  // 4. Validation Error
  if (
    msg.includes('json') ||
    msg.includes('schema') ||
    msg.includes('self-repair failed') ||
    msg.includes('parse')
  ) {
    return { category: 'validation_error', message: err?.message || 'Validation error', status, isRetryable: false };
  }

  // 5. Transient Error (Default for 500-504, timeouts, network socket drops, abort)
  return { category: 'transient_error', message: err?.message || 'Transient network error', status, isRetryable: true };
}

/**
 * Calls OpenAI-compatible API with bounded retries and exponential backoff on transient errors.
 */
async function callOpenAICompatibleWithRetry(
  provider: LLMProviderConfig,
  model: string,
  prompt: string,
  timeoutMs: number,
  maxRetries: number = 2,
  responseFormat?: any,
  maxCompletionTokens = 900,
): Promise<LLMCallOutput> {
  let attempt = 0;
  while (true) {
    try {
      return await callOpenAICompatible(provider, model, prompt, timeoutMs, responseFormat, maxCompletionTokens);
    } catch (err: any) {
      attempt++;
      const classified = classifyLLMError(err);
      if (!classified.isRetryable || attempt > maxRetries) {
        throw err;
      }
      const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
      const baseBackoff = isTestEnv ? 10 : 1000;
      const delay = Math.min(8000, baseBackoff * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 50);
      console.warn(
        `[Waterfall Backoff] Transient error on ${provider.displayName} (${model}), retrying in ${delay}ms (attempt ${attempt}/${maxRetries}): ${err.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export interface WaterfallOptions extends GenerationOptions {
  maxCallsPerTask?: number;
  batchSize?: number;
  maxDurationMs?: number;
  targetVocabs?: (VocabItem | { word: string; pinyin?: string; level?: number; pos?: string } | any)[];
  freeOnly?: boolean;
  maxRetries?: number;
  model?: string;
  maxCompletionTokens?: number;
  preferredProvider?: string;
}

export interface WaterfallResult {
  questions: CandidateQuestion[];
  providerUsed: string;
  modelUsed: string;
  finishReason?: string;
  maxCompletionTokens?: number;
  fallbackOccurred: boolean;
  fallbackLog: string[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    queueTime?: number;
    promptTime?: number;
    completionTime?: number;
    totalTime?: number;
  };
  rateLimits?: {
    limitRequests?: number;
    remainingRequests?: number;
    resetRequests?: string;
    limitTokens?: number;
    remainingTokens?: number;
    resetTokens?: string;
    retryAfter?: number;
    requestId?: string;
  };
  callsCount?: number;
  errorCategory?: LLMErrorCategory;
  quotaExhausted?: boolean;
}

/**
 * Multi-LLM Waterfall Generator:
 * Tries DeepSeek-V3 -> Gemini 1.5 Flash -> Groq Cloud -> Local Ollama.
 * Automatically falls back on:
 * - Empty / missing API key
 * - HTTP 402, 429, 404, 500-504
 * - Network timeouts / connection refused
 *
 * If all providers fail, strictly throws Error('LLM_ALL_PROVIDERS_EXHAUSTED').
 * Mock generator is ONLY reachable when explicitly requested via options.mock === true or customMockHandler.
 */
export async function generateWaterfallQuestions(
  options: WaterfallOptions
): Promise<WaterfallResult> {
  const level = Math.max(1, Math.min(options.level || 1, 6));
  const skill = options.skill || 'all';
  const count = Math.max(1, Math.min(options.batchSize || options.count || 5, 50));
  const maxCallsPerTask = Math.max(1, options.maxCallsPerTask || parseInt(process.env.QBANK_MAX_CALLS_PER_TASK || '10', 10));
  const maxDurationMs = Math.max(1000, options.maxDurationMs || parseInt(process.env.QBANK_MAX_DURATION_MS || '60000', 10));
  const startTime = Date.now();
  let callsCount = 0;
  let lastErrorCategory: LLMErrorCategory | null = null;
  let lastProviderError: any = null;

  // Production Zero-Mock Rule: mock mode is strictly prohibited when NODE_ENV === 'production'
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (options.mock || process.env.QBANK_BRIDGE_MOCK === '1' || customMockHandler)) {
    console.warn('[Waterfall Security] Mock generation requested but strictly suppressed in production mode.');
  }

  // In test / non-production: custom mock handler takes precedence
  if (!isProduction && customMockHandler) {
    const customResult = await customMockHandler({ ...options, count, level, skill });
    if (customResult !== null) {
      return {
        questions: customResult,
        providerUsed: 'mock-llm',
        modelUsed: 'mock-custom-handler',
        fallbackOccurred: false,
        fallbackLog: [],
        callsCount: 1,
      };
    }
  }

  const isMock = !isProduction && Boolean(options.mock || process.env.QBANK_BRIDGE_MOCK === '1');

  // Load target rotated vocabulary with generous coverage for 1-click generation
  const targetVocabs = options.targetVocabs && options.targetVocabs.length > 0
    ? options.targetVocabs
    : getRotatedVocab(level, Math.max(30, count * 6));

  // If mock mode explicitly requested, return simulated blueprint questions immediately
  if (isMock) {
    const mockQuestions = generateMockQuestions(level, skill, count, targetVocabs, options.part_type);
    return {
      questions: mockQuestions,
      providerUsed: 'mock-llm',
      modelUsed: 'mock-hsk-engine',
      fallbackOccurred: false,
      fallbackLog: [],
      callsCount: 1,
    };
  }

  // Provider chain resolution:
  const freeOnly = isFreeTierOnly() || options.freeOnly === true;
  let providersToTry = WATERFALL_PROVIDERS;

  if (freeOnly) {
    if (options.provider && options.provider !== 'auto') {
      const requested = options.provider.toLowerCase().trim();
      const matched = WATERFALL_PROVIDERS.filter((p) =>
        p.id.toLowerCase().includes(requested) ||
        p.name.toLowerCase().includes(requested)
      );
      const paidMatched = matched.filter((p) => p.isFreeTier === false);
      if (paidMatched.length > 0) {
        console.warn(`[Waterfall Security] Paid provider '${paidMatched.map(p => p.displayName).join(', ')}' strictly blocked before sending request under QBANK_LLM_FREE_ONLY policy.`);
        const err: any = new Error(
          `LLM_ALL_PROVIDERS_EXHAUSTED: NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE - PROVIDER_PAID_BLOCKED: Paid provider '${paidMatched[0].displayName}' is strictly rejected before sending request under QBANK_LLM_FREE_ONLY policy.`
        );
        err.code = 'NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE';
        err.exhaustionCode = 'LLM_ALL_PROVIDERS_EXHAUSTED: NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE';
        err.category = 'quota_exhausted';
        err.callsCount = 0;
        throw err;
      }
      providersToTry = matched.filter(isAllowedFreeProvider);
    } else {
      // In auto mode, exclude all paid providers
      providersToTry = providersToTry.filter(isAllowedFreeProvider);
    }
  } else {
    if (options.provider && options.provider !== 'auto') {
      const requested = options.provider.toLowerCase().trim();
      if (requested === 'none') {
        providersToTry = [];
      } else {
        providersToTry = providersToTry.filter((p) =>
          p.id.toLowerCase().includes(requested) ||
          p.name.toLowerCase().includes(requested)
        );
      }
    }
  }

  if (options.preferredProvider && options.preferredProvider !== 'auto') {
    const pref = options.preferredProvider.toLowerCase().trim();
    providersToTry = [...providersToTry].sort((a, b) => {
      const aMatch = a.id.toLowerCase().includes(pref) || a.name.toLowerCase().includes(pref);
      const bMatch = b.id.toLowerCase().includes(pref) || b.name.toLowerCase().includes(pref);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  const prompt = buildHskPrompt(
    level,
    skill,
    count,
    targetVocabs,
    options.part_type,
    options.topic,
    options.difficulty_tier,
    options.target_grammar,
    options.trap_type
  );
  const fallbackLog: string[] = [];
  let fallbackOccurred = false;

  for (let i = 0; i < providersToTry.length; i++) {
    const provider = providersToTry[i];
    const apiKey = provider.getApiKey();

    // Check if API key is missing or empty for cloud providers
    if (!provider.isLocal && (!apiKey || apiKey.trim().length === 0)) {
      const nextProvider = providersToTry[i + 1];
      if (nextProvider) {
        fallbackOccurred = true;
        const msg = `[Fallback] Switching to ${nextProvider.name}`;
        console.log(msg);
        fallbackLog.push(msg);
      }
      continue;
    }

    const configuredMaxRetries = options.maxRetries !== undefined
      ? options.maxRetries
      : (process.env.QBANK_LLM_MAX_RETRIES !== undefined
          ? parseInt(process.env.QBANK_LLM_MAX_RETRIES, 10)
          : 2);

    const modelsToTry = (options.model && provider.models.includes(options.model))
      ? [options.model, ...provider.models.filter((m) => m !== options.model)]
      : (provider.id.startsWith('gemini') && process.env.GEMINI_MODEL && provider.models.includes(process.env.GEMINI_MODEL)
          ? [process.env.GEMINI_MODEL, ...provider.models.filter((m) => m !== process.env.GEMINI_MODEL)]
          : (provider.id.startsWith('groq') && process.env.GROQ_MODEL && provider.models.includes(process.env.GROQ_MODEL)
              ? [process.env.GROQ_MODEL, ...provider.models.filter((m) => m !== process.env.GROQ_MODEL)]
              : provider.models));

    // Try available models for this provider
    for (const model of modelsToTry) {
      if (callsCount >= maxCallsPerTask) {
        console.warn(`[Waterfall] maxCallsPerTask (${maxCallsPerTask}) reached. Halting calls.`);
        lastErrorCategory = 'quota_exhausted';
        break;
      }
      if (Date.now() - startTime >= maxDurationMs) {
        console.warn(`[Waterfall] maxDurationMs (${maxDurationMs}ms) exceeded. Halting calls.`);
        lastErrorCategory = 'transient_error';
        break;
      }

      try {
        callsCount++;
        console.log(`[Waterfall] Trying ${provider.displayName} with model ${model} (Call #${callsCount}/${maxCallsPerTask})...`);
        const effectiveProviderCount = provider.isLocal ? Math.min(count, 5) : count;
        const providerVocabs = provider.isLocal
          ? targetVocabs.slice(0, Math.min(targetVocabs.length, Math.max(8, effectiveProviderCount * 3)))
          : targetVocabs;
        const providerPrompt =
          effectiveProviderCount !== count || provider.isLocal
            ? buildHskPrompt(
                level,
                skill,
                effectiveProviderCount,
                providerVocabs,
                options.part_type,
                options.topic,
                options.difficulty_tier,
                options.target_grammar,
                options.trap_type
              )
            : prompt;
        const responseFormat = provider.supportsStrictJsonSchema
          ? buildQuestionResponseFormat(level, skill, options.part_type || 'read_fill_blank_4opt', effectiveProviderCount)
          : undefined;
        const maxCompletionTokens =
          options.maxCompletionTokens ||
          (effectiveProviderCount === 1
            ? (level >= 5 ? 2500 : 1800)
            : Math.min(16_000, Math.max(3000, effectiveProviderCount * (level >= 5 ? 2000 : 1500))));
        const effectiveTimeoutMs = options.timeoutMs || (provider.isLocal ? 180000 : 45000);
        const llmOutput = await callOpenAICompatibleWithRetry(
          provider,
          model,
          providerPrompt,
          effectiveTimeoutMs,
          configuredMaxRetries,
          responseFormat,
          maxCompletionTokens,
        );

        if (llmOutput.finishReason === 'length') {
          const truncated: any = new Error(`LLM_OUTPUT_TRUNCATED: ${provider.displayName} response reached max_completion_tokens (${maxCompletionTokens}).`);
          truncated.code = 'LLM_OUTPUT_TRUNCATED';
          truncated.provider = provider.id;
          truncated.status = 422;
          truncated.finishReason = llmOutput.finishReason;
          truncated.maxCompletionTokens = maxCompletionTokens;
          truncated.tokenUsage = llmOutput.usage;
          throw truncated;
        }

        // Parse JSON output with 1-shot Self-Repair fallback
        const { questions: candidates } = await parseWithSelfRepair(
          llmOutput.content,
          responseFormat ? undefined : async (repairPrompt) => {
            if (callsCount >= maxCallsPerTask) {
              throw new Error('Max calls limit reached during repair');
            }
            callsCount++;
            console.log(`[Self-Repair] Requesting syntax repair from ${provider.displayName} (${model})...`);
            const rep = await callOpenAICompatibleWithRetry(provider, model, repairPrompt, options.timeoutMs || 30000, configuredMaxRetries);
            return rep.content;
          },
          level,
          skill === 'all' ? 'reading' : (skill as any),
          Boolean(responseFormat)
        );

        if (candidates.length > 0) {
          // Tag provider and topic on each candidate
          candidates.forEach((c) => {
            c.provider_used = provider.id;
            if (options.topic && !c.topic) {
              c.topic = options.topic;
            }
          });

          return {
            questions: candidates,
            providerUsed: provider.id,
            modelUsed: model,
            finishReason: llmOutput.finishReason,
            maxCompletionTokens,
            fallbackOccurred,
            fallbackLog,
            tokenUsage: llmOutput.usage,
            rateLimits: llmOutput.rateLimits,
            callsCount,
          };
        }
      } catch (err: any) {
        const classified = classifyLLMError(err);
        lastProviderError = err;
        lastErrorCategory = classified.category;
        console.warn(`[Waterfall Warning] ${provider.displayName} (${model}) failed (${classified.category}): ${err.message}`);

        // If this was a 404 (model not found) or config_error, we can try the next model within the same provider
        const is404 = err.status === 404 || classified.category === 'config_error';
        const hasMoreModels = provider.models.indexOf(model) < provider.models.length - 1;
        if (is404 && hasMoreModels) {
          continue;
        }

        // Otherwise advance to next provider
        break;
      }
    }

    // Provider exhausted -> Log fallback to next provider
    const nextProvider = providersToTry[i + 1];
    if (nextProvider) {
      fallbackOccurred = true;
      const msg = `[Fallback] Switching to ${nextProvider.name}`;
      console.log(msg);
      fallbackLog.push(msg);
    }
  }

  // All providers failed or offline -> STRICT ERROR (NO MOCK FALLBACK)
  console.error('[Waterfall] All external LLM providers exhausted or offline.');
  let exhaustionCode = freeOnly
    ? 'LLM_ALL_PROVIDERS_EXHAUSTED: NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE'
    : 'LLM_ALL_PROVIDERS_EXHAUSTED';

  if (options.provider === 'ollama' || options.provider?.toLowerCase().includes('ollama')) {
    exhaustionCode = 'LLM_ALL_PROVIDERS_EXHAUSTED: NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE — Không thể kết nối với máy chủ Local Ollama (http://localhost:11434). Vui lòng mở ứng dụng Ollama trên máy tính hoặc chọn "⚡ Tự động (Free Waterfall)" / "Google Gemini" / "Groq Cloud".';
  } else if (options.provider === 'deepseek' || options.provider?.toLowerCase().includes('deepseek')) {
    exhaustionCode = 'LLM_ALL_PROVIDERS_EXHAUSTED: NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE — Tài khoản DeepSeek hiện không có số dư miễn phí (0.00 USD). Vui lòng chuyển sang "⚡ Tự động" / "Google Gemini" / "Groq Cloud" để sử dụng miễn phí.';
  }

  const err: any = new Error(exhaustionCode);
  err.code = freeOnly ? 'NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE' : 'LLM_ALL_PROVIDERS_EXHAUSTED';
  err.exhaustionCode = exhaustionCode;
  err.category = lastErrorCategory || 'quota_exhausted';
  err.callsCount = callsCount;
  if (lastProviderError?.provider) err.provider = lastProviderError.provider;
  if (lastProviderError?.status) err.status = lastProviderError.status;
  if (lastProviderError?.retryAfterMs !== undefined) err.retryAfterMs = lastProviderError.retryAfterMs;
  if (lastProviderError?.remainingTokens !== undefined) err.remainingTokens = lastProviderError.remainingTokens;
  if (lastProviderError?.resetTokens) err.resetTokens = lastProviderError.resetTokens;
  if (lastProviderError?.tokenLimit !== undefined) err.tokenLimit = lastProviderError.tokenLimit;
  if (lastProviderError?.tokensUsed !== undefined) err.tokensUsed = lastProviderError.tokensUsed;
  if (lastProviderError?.tokensRequested !== undefined) err.tokensRequested = lastProviderError.tokensRequested;
  if (lastProviderError?.finishReason !== undefined) err.finishReason = lastProviderError.finishReason;
  if (lastProviderError?.maxCompletionTokens !== undefined) err.maxCompletionTokens = lastProviderError.maxCompletionTokens;
  if (lastProviderError?.tokenUsage !== undefined) err.tokenUsage = lastProviderError.tokenUsage;
  if (lastProviderError?.rateLimits) err.rateLimits = lastProviderError.rateLimits;
  if (lastProviderError?.requestId) err.requestId = lastProviderError.requestId;
  throw err;
}
