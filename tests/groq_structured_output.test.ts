import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildQuestionResponseFormat,
  generateWaterfallQuestions,
  parseRetryAfterMs,
} from '../src/server/llm/waterfallGenerator.js';

const envKeys = [
  'GROQ_API_KEY',
  'QBANK_LLM_MODE',
  'QBANK_LLM_FREE_ONLY',
  'QBANK_LLM_ALLOW_PAID',
  'QBANK_LLM_FREE_PROVIDERS',
];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function enableGroqOnly() {
  process.env.GROQ_API_KEY = 'gsk_test_not_a_real_key';
  process.env.QBANK_LLM_MODE = 'free';
  process.env.QBANK_LLM_FREE_ONLY = 'true';
  process.env.QBANK_LLM_ALLOW_PAID = 'false';
  process.env.QBANK_LLM_FREE_PROVIDERS = 'groq-llama-3.3';
}

const validQuestion = {
  stem: '小明为什么去学校？',
  completed_stem: '小明为什么去学校？',
  options: ['借书', '看病', '坐飞机'],
  options_images: [],
  answer_idx: 0,
  explanation_vi: '小明去学校借书。',
  level: 1,
  skill: 'reading',
  part_type: 'read_comprehension_short_3opt',
  pinyin: 'xiǎo míng wèi shén me qù xué xiào?',
  illustration_theme: null,
  topic: null,
  difficulty_tier: 'tier1_difficult',
  trap_type: 'context_scope',
  target_grammar: '为什么问句',
  target_vocabulary: '学校',
  distractor_rationales: [
    { option_idx: 1, rationale_vi: 'Không có nội dung nói đi khám bệnh.' },
    { option_idx: 2, rationale_vi: 'Không có nội dung nói đi máy bay.' },
  ],
};

describe('Groq structured output and quota handling', () => {
  it('builds strict JSON Schema output matching the one-question HSK contract', () => {
    const format: any = buildQuestionResponseFormat(1, 'reading', 'read_comprehension_short_3opt', 1);
    expect(format.type).toBe('json_schema');
    expect(format.json_schema.strict).toBe(true);
    expect(format.json_schema.schema.properties.questions.minItems).toBe(1);
    expect(format.json_schema.schema.properties.questions.items.properties.options.minItems).toBe(3);
    expect(format.json_schema.schema.properties.questions.items.properties.part_type.enum).toEqual([
      'read_comprehension_short_3opt',
    ]);
  });

  it('sends strict schema once, parses the envelope, and records actual usage', async () => {
    enableGroqOnly();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ questions: [validQuestion] }) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 80, completion_tokens: 210, total_tokens: 290 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_comprehension_short_3opt',
      count: 1,
      provider: 'groq',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(payload.response_format.type).toBe('json_schema');
    expect(payload.response_format.json_schema.strict).toBe(true);
    expect(payload.max_completion_tokens).toBe(900);
    expect(payload.reasoning_format).toBe('hidden');
    expect(result.questions).toHaveLength(1);
    expect(result.tokenUsage).toEqual({ promptTokens: 80, completionTokens: 210, totalTokens: 290 });
    expect(result.finishReason).toBe('stop');
    expect(result.maxCompletionTokens).toBe(900);
  });

  it('fails closed on 429, records a safe retry interval, and makes no repair/retry call', async () => {
    enableGroqOnly();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'Rate limit reached for model in organization org_private: Limit 1000, Used 997, Requested 104. Try again in 6.06s.' },
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'retry-after': '6.06' },
    }));

    let caught: any;
    try {
      await generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        count: 1,
        provider: 'groq',
      });
    } catch (error) {
      caught = error;
    }

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(caught).toMatchObject({ retryAfterMs: 6060, tokenLimit: 1000, tokensUsed: 997, tokensRequested: 104 });
    expect(caught.message).not.toContain('org_private');
  });

  it('surfaces finish_reason length and the completion cap without retrying or falling back', async () => {
    enableGroqOnly();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '{"questions":[' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 90, completion_tokens: 900, total_tokens: 990 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    let caught: any;
    try {
      await generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        count: 1,
        provider: 'groq',
      });
    } catch (error) {
      caught = error;
    }

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(caught).toMatchObject({ finishReason: 'length', maxCompletionTokens: 900 });
    expect(caught.tokenUsage).toEqual({ promptTokens: 90, completionTokens: 900, totalTokens: 990 });
  });

  it('parses provider retry hints without making a retry decision itself', () => {
    expect(parseRetryAfterMs('6.06')).toBe(6060);
    expect(parseRetryAfterMs(null, 'Try again in 6.06s')).toBe(6060);
  });
});
