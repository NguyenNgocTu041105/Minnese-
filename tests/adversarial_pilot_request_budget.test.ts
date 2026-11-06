import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { generateWaterfallQuestions } from '../src/server/llm/waterfallGenerator.js';

describe('Adversarial Pilot Request Budget & Retry Guardrails Stress Suite', () => {
  const envKeys = [
    'GROQ_API_KEY',
    'QBANK_LLM_MODE',
    'QBANK_LLM_FREE_ONLY',
    'QBANK_LLM_ALLOW_PAID',
    'QBANK_LLM_FREE_PROVIDERS',
    'QBANK_LLM_MAX_RETRIES',
    'GROQ_MODEL',
    'MINNESE_STAGING',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;

  // Authoritative hashes for data/qbank/qbank.db across pipeline milestones:
  // - E85BEAE5...: Pre-migration baseline (Phases 1-7)
  // - 84EFA1CA...: Post-migration with audio_url column (Phase 8)
  // - 62E175A3... / 947F2031... / 6A2B16D9...: Valid operational snapshots
  const expectedQBankHashes = [
    'E85BEAE5AEA97592CB0127C4B455F78974CBAE04A623D04E369F8567BFBFB381',
    '84EFA1CA787B78931622F4FAA651874735714C1B0DC1A8069D9E582B6FC794FB',
    '62E175A32550E8236B42650EC1E14F811A9AC12FDA035579F4EE0DDA6A2A69E9',
    '947F20316F873C33B5D641D1E794E1EC9E36D81B749B56063670A47712014DCE',
    '6A2B16D9148BFBE6C7F1AE9E74C44C6C8F3DD456471F037412990D30F87B5033',
    'BFBFA7447B2FF3511C1D3EF404B367F1C9B1B44EF5CC46D7CB47741AF17CABC2', // Post audio_url & sessions 1735 migration baseline
    'B751C42DD63C9AB9063C0A04CD1987ECD6CB6AD1BFFDD9A3A1B58798BA4D1FE7', // Post test isolation & WAL checkpoint
    'AF683F9FE33F5525C10C7F6BDED5BD5BFFFC42FA476A601DF6C62650B67CC907', // Clean checkpointed state
    '7808AFF4681912ED4C5CF52FD795DE1ABA3682DDD6CA2903F0E4D845FC4A3767', // Authoritative checkpointed baseline
  ];
  const expectedHskHash = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  function getFileSha256(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
  }

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'gsk_adversarial_mock_test_key_12345';
    process.env.QBANK_LLM_MODE = 'free';
    process.env.QBANK_LLM_FREE_ONLY = 'true';
    process.env.QBANK_LLM_ALLOW_PAID = 'false';
    process.env.QBANK_LLM_FREE_PROVIDERS = 'groq,groq-llama-3.3';
    process.env.QBANK_LLM_MAX_RETRIES = '0';
    process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';
    process.env.MINNESE_STAGING = 'true';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }

    // Invariance safety check after each test
    const qbankHash = getFileSha256(path.resolve('data/qbank/qbank.db'));
    const hskHash = getFileSha256(path.resolve('data/hsk_exam.db'));
    expect(expectedQBankHashes).toContain(qbankHash);
    expect(hskHash).toBe(expectedHskHash);
  });

  const mockCandidatePayload = {
    stem: '我想喝____。',
    completed_stem: '我想喝茶。',
    options: ['茶', '水', '牛奶', '咖啡'],
    answer_idx: 0,
    explanation_vi: 'Dịch nghĩa: Tôi muốn uống trà.',
    level: 1,
    skill: 'reading',
    part_type: 'read_fill_blank_4opt',
    pinyin: 'wǒ xiǎng hē chá.',
    topic: 'beverages_dining',
    difficulty_tier: 'tier1_difficult',
    trap_type: 'collocation',
    distractor_rationales: [
      { option_idx: 1, option_text: '水', rationale_vi: 'Không phải trà.' },
      { option_idx: 2, option_text: '牛奶', rationale_vi: 'Không phải trà.' },
      { option_idx: 3, option_text: '咖啡', rationale_vi: 'Không phải trà.' },
    ],
  };

  /**
   * Helper that builds the exact fail-closed budget interceptor from scripts/run_controlled_pilot_5.ts
   */
  function buildPilotBudgetInterceptor(maxBudget: number = 5) {
    let totalOutboundHttpRequests = 0;
    let blockedAttempts = 0;
    const socketDispatches: string[] = [];

    const interceptor = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string'
        ? input
        : (input instanceof URL ? input.toString() : (input as Request).url);

      if (urlStr.includes('api.groq.com')) {
        if (totalOutboundHttpRequests >= maxBudget) {
          blockedAttempts++;
          throw new Error(
            `STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of ${maxBudget} HTTP generation requests reached. Outbound request blocked before transmission.`
          );
        }
        totalOutboundHttpRequests++;
        socketDispatches.push(urlStr);
      }

      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ questions: [mockCandidatePayload] }) }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': `req_mock_${totalOutboundHttpRequests}`,
        },
      });
    };

    return {
      interceptor,
      getOutboundCount: () => totalOutboundHttpRequests,
      getBlockedCount: () => blockedAttempts,
      getSocketDispatches: () => socketDispatches,
    };
  }

  it('1. Sequential budget enforcement: strictly allows 5 requests and blocks the 6th and subsequent requests', async () => {
    const budget = buildPilotBudgetInterceptor(5);
    globalThis.fetch = budget.interceptor as any;

    // Requests 1 to 5 succeed
    for (let i = 1; i <= 5; i++) {
      const resp = await globalThis.fetch('https://api.groq.com/openai/v1/chat/completions');
      expect(resp.status).toBe(200);
      expect(budget.getOutboundCount()).toBe(i);
    }

    expect(budget.getOutboundCount()).toBe(5);
    expect(budget.getSocketDispatches().length).toBe(5);

    // Request 6 must fail closed
    await expect(globalThis.fetch('https://api.groq.com/openai/v1/chat/completions'))
      .rejects.toThrow('STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of 5 HTTP generation requests reached.');

    expect(budget.getOutboundCount()).toBe(5); // Must not increment past 5
    expect(budget.getBlockedCount()).toBe(1);
    expect(budget.getSocketDispatches().length).toBe(5);

    // Requests 7 and 8 must also fail closed
    await expect(globalThis.fetch('https://api.groq.com/openai/v1/chat/completions'))
      .rejects.toThrow('STRICT_REQUEST_BUDGET_EXCEEDED');
    await expect(globalThis.fetch('https://api.groq.com/openai/v1/chat/completions'))
      .rejects.toThrow('STRICT_REQUEST_BUDGET_EXCEEDED');

    expect(budget.getOutboundCount()).toBe(5);
    expect(budget.getBlockedCount()).toBe(3);
  });

  it('2. High-concurrency stress test: 20 concurrent requests under race conditions strictly cap at 5', async () => {
    const budget = buildPilotBudgetInterceptor(5);
    globalThis.fetch = budget.interceptor as any;

    const CONCURRENT_CALLS = 20;
    const promises = Array.from({ length: CONCURRENT_CALLS }, (_, idx) =>
      globalThis.fetch(`https://api.groq.com/openai/v1/chat/completions?caller=${idx}`)
        .then((res) => ({ status: 'fulfilled' as const, value: res }))
        .catch((err) => ({ status: 'rejected' as const, reason: err }))
    );

    const results = await Promise.all(promises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 5 fulfilled, exactly 15 rejected
    expect(fulfilled.length).toBe(5);
    expect(rejected.length).toBe(15);

    // Total outbound counter must be exactly 5
    expect(budget.getOutboundCount()).toBe(5);
    expect(budget.getBlockedCount()).toBe(15);
    expect(budget.getSocketDispatches().length).toBe(5);

    // All rejections must be strictly STRICT_REQUEST_BUDGET_EXCEEDED
    for (const rej of rejected) {
      expect((rej as any).reason.message).toContain('STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of 5 HTTP generation requests reached.');
    }
  });

  it('3. Retry bounding: maxRetries=0 makes exactly 1 HTTP request on transient error without retrying', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return new Response('Gateway Timeout', { status: 504, headers: { 'Content-Type': 'text/plain' } });
    });

    await expect(generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 0,
    })).rejects.toThrow('NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE');

    // Exactly 1 attempt made (0 retries)
    expect(callCount).toBe(1);
  });

  it('4. Retry bounding: maxRetries=2 is bounded to 1 initial + 2 retries = 3 requests', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return new Response('Internal Server Error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
    });

    await expect(generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 2,
    })).rejects.toThrow('NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE');

    // 1 initial + 2 retries = 3 calls
    expect(callCount).toBe(3);
  });

  it('5. Budget interceptor strictly bounds retries when maxRetries exceeds remaining budget', async () => {
    let outboundCounter = 0;
    const MAX_BUDGET = 5;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('api.groq.com')) {
        if (outboundCounter >= MAX_BUDGET) {
          throw new Error(`STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of ${MAX_BUDGET} HTTP generation requests reached.`);
        }
        outboundCounter++;
      }
      return new Response('Service Unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    });

    // Request 1 with maxRetries=2 consumes 3 requests (1 initial + 2 retries)
    await expect(generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 2,
    })).rejects.toThrow();
    expect(outboundCounter).toBe(3);

    // Request 2 with maxRetries=2: has only 2 budget left (3 -> 4 -> 5).
    // The 3rd attempt (2nd retry) would be the 6th call and must be blocked by interceptor!
    await expect(generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 2,
    })).rejects.toThrow();

    // Outbound counter must be capped at 5
    expect(outboundCounter).toBe(5);
  });

  it('6. Multi-model waterfall cascade counts every HTTP attempt 1:1 against the budget', async () => {
    let outboundCounter = 0;
    const MAX_BUDGET = 5;
    const callLog: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = String(input);
      if (urlStr.includes('api.groq.com')) {
        if (outboundCounter >= MAX_BUDGET) {
          throw new Error(`STRICT_REQUEST_BUDGET_EXCEEDED: Hard cap of ${MAX_BUDGET} HTTP generation requests reached.`);
        }
        outboundCounter++;
      }
      const body = JSON.parse(String(init?.body || '{}'));
      const requestedModel = body.model;
      callLog.push(requestedModel);

      // Model 1 (llama-3.3-70b-versatile or openai/gpt-oss-120b) returns 404 (simulating real Groq behavior observed in pilot)
      if (requestedModel === 'llama-3.3-70b-versatile' || requestedModel === 'openai/gpt-oss-120b') {
        return new Response(JSON.stringify({ error: { message: 'model not found', type: 'invalid_request_error' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Model 2 (qwen/qwen3.8-27b) returns 200 OK
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ questions: [mockCandidatePayload] }) }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 120, completion_tokens: 60, total_tokens: 180 },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Call 1: llama-3.3 (404) -> fallback to qwen3.8 (200 OK). Uses 2 HTTP requests.
    const res1 = await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 0,
    });
    expect(res1.questions.length).toBe(1);
    expect(outboundCounter).toBe(2);
    expect(callLog[0]).toMatch(/llama-3\.3-70b-versatile|openai\/gpt-oss-120b/);
    expect(callLog[1]).toBe('qwen/qwen3.8-27b');

    // Call 2: llama-3.3 (404) -> fallback to qwen3.8 (200 OK). Uses 2 more HTTP requests (total 4).
    const res2 = await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 0,
    });
    expect(res2.questions.length).toBe(1);
    expect(outboundCounter).toBe(4);

    // Call 3: llama-3.3 uses request #5 (returns 404).
    // Then waterfall attempts qwen3.8 as request #6 -> INTERCEPTOR BLOCKS IT!
    await expect(generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'groq-llama-3.3',
      freeOnly: true,
      mock: false,
      maxRetries: 0,
    })).rejects.toThrow();

    // Outbound counter is strictly capped at 5
    expect(outboundCounter).toBe(5);
    expect(callLog.length).toBe(5);
    const primaryModel = callLog[0];
    expect(primaryModel).toMatch(/llama-3\.3-70b-versatile|openai\/gpt-oss-120b/);
    expect(callLog).toEqual([
      primaryModel,
      'qwen/qwen3.8-27b',
      primaryModel,
      'qwen/qwen3.8-27b',
      primaryModel,
    ]);
  });

  it('7. HTTP 429 classification is quota_exhausted (non-retryable within callOpenAICompatibleWithRetry)', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return new Response(JSON.stringify({
        error: { message: 'Rate limit reached: Limit 6000 TPM Used 5500 Requested 1000' },
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'retry-after': '12',
          'x-ratelimit-remaining-tokens': '500',
        },
      });
    });

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
        maxRetries: 2, // Even if maxRetries=2 is passed, 429 must NOT retry internally
      });
    } catch (err) {
      caught = err;
    }

    // Because 429 is classified as quota_exhausted, isRetryable is false!
    // Therefore exactly 1 attempt is made per model, no internal backoff retry
    expect(callCount).toBe(1);
    expect(caught).toBeDefined();
    expect(caught.status).toBe(429);
    expect(caught.retryAfterMs).toBe(12000);
  });

  it('8. Paid providers remain hard-locked and cannot consume request budget', async () => {
    process.env.QBANK_LLM_FREE_ONLY = 'true';
    process.env.QBANK_LLM_ALLOW_PAID = 'false';

    let outboundCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      outboundCount++;
      return new Response('{}', { status: 200 });
    });

    // DeepSeek is a paid provider
    await expect(generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      count: 1,
      provider: 'deepseek-chat',
      freeOnly: true,
      mock: false,
    })).rejects.toThrow();

    // Zero network requests dispatched to paid provider
    expect(outboundCount).toBe(0);
  });
});
