import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateWaterfallQuestions,
  WATERFALL_PROVIDERS,
  isFreeTierOnly,
} from '../src/server/llm/waterfallGenerator.js';

describe('Paid Provider Preflight Lock & Zero-Cost Security', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.QBANK_LLM_ALLOW_PAID;
    process.env.QBANK_LLM_FREE_ONLY = 'true';
    process.env.DEEPSEEK_API_KEY = 'sk-synthetic-paid-key-must-be-blocked';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('correctly reports isFreeTierOnly() = true when QBANK_LLM_FREE_ONLY=true', () => {
    expect(isFreeTierOnly()).toBe(true);
  });

  it('identifies deepseek-v3 as isFreeTier: false in WATERFALL_PROVIDERS', () => {
    const deepseek = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
    expect(deepseek).toBeDefined();
    expect(deepseek?.isFreeTier).toBe(false);
  });

  it('MUST strictly reject paid provider (deepseek) before sending any network request', async () => {
    // Spy on global fetch to prove 0 network calls are dispatched
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        count: 1,
        provider: 'deepseek-v3',
        freeOnly: true,
        mock: false,
      })
    ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

    // Verify ZERO network requests were sent
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('MUST strictly reject when provider is set to "deepseek" alias without network transmission', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      generateWaterfallQuestions({
        level: 2,
        skill: 'reading',
        count: 1,
        provider: 'deepseek',
        freeOnly: true,
        mock: false,
      })
    ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('MUST exclude deepseek-v3 in auto mode when freeOnly is active', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    questions: [
                      {
                        stem: '测试题目',
                        options: ['A', 'B', 'C', 'D'],
                        answer_idx: 0,
                        explanation_vi: 'Giải thích',
                      },
                    ],
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    // Set Gemini and Groq dummy keys so free tier works
    process.env.GEMINI_API_KEY = 'AQ.dummy-free-key';
    process.env.GROQ_API_KEY = 'gsk_dummy-free-key';

    const res = await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      count: 1,
      provider: 'auto',
      freeOnly: true,
      mock: false,
    });

    // Verify provider used was NOT deepseek
    expect(res.providerUsed).not.toBe('deepseek-v3');
    expect(res.providerUsed).not.toContain('deepseek');

    // Any fetch calls made must NOT target deepseek API
    for (const call of fetchSpy.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toContain('api.deepseek.com');
    }
  });
});
