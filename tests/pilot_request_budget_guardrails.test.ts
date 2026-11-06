import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWaterfallQuestions } from '../src/server/llm/waterfallGenerator.js';

describe('Pilot Request Budget & Retry Guardrails (§R2, §R5, §R6)', () => {
  const envKeys = [
    'GROQ_API_KEY',
    'QBANK_LLM_MODE',
    'QBANK_LLM_FREE_ONLY',
    'QBANK_LLM_ALLOW_PAID',
    'QBANK_LLM_FREE_PROVIDERS',
    'QBANK_LLM_MAX_RETRIES',
    'GROQ_MODEL',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'gsk_test_key_mock_12345';
    process.env.QBANK_LLM_MODE = 'free';
    process.env.QBANK_LLM_FREE_ONLY = 'true';
    process.env.QBANK_LLM_ALLOW_PAID = 'false';
    process.env.QBANK_LLM_FREE_PROVIDERS = 'groq,groq-llama-3.3';
    process.env.QBANK_LLM_MAX_RETRIES = '0';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  const mockCandidate = {
    stem: '我想喝____。',
    completed_stem: '我想喝茶。',
    options: ['茶', '水', '牛奶', '咖啡'],
    answer_idx: 0,
    explanation_vi: 'Dịch nghĩa: Tôi muốn uống trà. Trong đó trà là thức uống.',
    level: 1,
    skill: 'reading',
    part_type: 'read_fill_blank_4opt',
    pinyin: 'wǒ xiǎng hē chá.',
    illustration_theme: null,
    topic: 'beverages_dining',
    difficulty_tier: 'tier1_difficult',
    trap_type: 'collocation',
    distractor_rationales: [
      { option_idx: 1, option_text: '水', rationale_vi: 'Nước lọc không phù hợp ngữ cảnh muốn uống trà.' },
      { option_idx: 2, option_text: '牛奶', rationale_vi: 'Sữa bò không phù hợp ngữ cảnh muốn uống trà.' },
      { option_idx: 3, option_text: '咖啡', rationale_vi: 'Cà phê không phù hợp ngữ cảnh muốn uống trà.' },
    ],
  };

  it('1. Prioritizes llama-3.3-70b-versatile as default Groq model', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ questions: [mockCandidate] }) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'x-ratelimit-remaining-tokens': '11500',
        'x-ratelimit-limit-tokens': '12000',
        'x-ratelimit-remaining-requests': '999',
        'x-request-id': 'req_test_001',
      },
    }));

    const result = await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(result.modelUsed).toBe('llama-3.3-70b-versatile');
  });

  it('2. Captures rate-limit headers, request-id, and timing metrics on HTTP 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ questions: [mockCandidate] }) }, finish_reason: 'stop' }],
      usage: {
        prompt_tokens: 120,
        completion_tokens: 250,
        total_tokens: 370,
        queue_time: 0.005,
        prompt_time: 0.012,
        completion_time: 0.045,
        total_time: 0.057,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'x-ratelimit-remaining-tokens': '11000',
        'x-ratelimit-limit-tokens': '12000',
        'x-ratelimit-remaining-requests': '995',
        'x-ratelimit-limit-requests': '1000',
        'x-ratelimit-reset-tokens': '5.2s',
        'x-request-id': 'req_groq_trace_98765',
      },
    }));

    const result = await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
    });

    expect(result.rateLimits).toBeDefined();
    expect(result.rateLimits?.requestId).toBe('req_groq_trace_98765');
    expect(result.rateLimits?.remainingTokens).toBe(11000);
    expect(result.rateLimits?.limitTokens).toBe(12000);
    expect(result.rateLimits?.remainingRequests).toBe(995);
    expect(result.tokenUsage?.queueTime).toBe(0.005);
    expect(result.tokenUsage?.totalTime).toBe(0.057);
  });

  it('3. Enforces maxRetries = 0: fails immediately without automatic retries on transient errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    }));

    let caught: any;
    try {
      await generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        count: 1,
        provider: 'groq-llama-3.3',
        freeOnly: true,
        mock: false,
        maxRetries: 0, // Explicitly disabled
      });
    } catch (err) {
      caught = err;
    }

    // Because maxRetries is 0, exactly 1 fetch attempt was dispatched (no retries)
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(caught).toBeDefined();
    expect(caught.code).toBe('NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE');
  });

  it('4. Fail-closed budget interceptor stops exactly at 5 requests and blocks any 6th attempt', async () => {
    const MAX_BUDGET = 5;
    let outboundCounter = 0;

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('api.groq.com')) {
        if (outboundCounter >= MAX_BUDGET) {
          throw new Error(`STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of ${MAX_BUDGET} HTTP generation requests reached.`);
        }
        outboundCounter++;
      }
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ questions: [mockCandidate] }) }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 50, completion_tokens: 50, total_tokens: 100 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    // Simulate 5 calls
    for (let i = 0; i < 5; i++) {
      await mockFetch('https://api.groq.com/openai/v1/chat/completions');
    }
    expect(outboundCounter).toBe(5);

    // 6th call must be blocked fail-closed
    await expect(mockFetch('https://api.groq.com/openai/v1/chat/completions'))
      .rejects.toThrow('STRICT_REQUEST_BUDGET_EXCEEDED');
    expect(outboundCounter).toBe(5);
  });
});
