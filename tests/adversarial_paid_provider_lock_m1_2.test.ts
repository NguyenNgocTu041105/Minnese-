import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import {
  generateWaterfallQuestions,
  WATERFALL_PROVIDERS,
  isFreeTierOnly,
  getFreeProviderAllowlist,
} from '../src/server/llm/waterfallGenerator.js';

describe('Challenger M1-2: Adversarial Paid Provider Lock & Zero-Cost Invariants', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.QBANK_LLM_FREE_ONLY = 'true';
    process.env.QBANK_LLM_ALLOW_PAID = 'false';
    process.env.DEEPSEEK_API_KEY = 'sk-synthetic-live-deepseek-paid-key-must-never-leak';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Invariant 1: Structural Provider Metadata
  // -------------------------------------------------------------------------
  it('strictly designates deepseek-v3 as isFreeTier: false', () => {
    const deepseek = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
    expect(deepseek).toBeDefined();
    expect(deepseek?.isFreeTier).toBe(false);
  });

  it('fails closed in isFreeTierOnly() regardless of QBANK_LLM_MODE or QBANK_LLM_ALLOW_PAID', () => {
    process.env.QBANK_LLM_MODE = 'paid';
    process.env.QBANK_LLM_ALLOW_PAID = 'true';
    expect(isFreeTierOnly()).toBe(true);

    process.env.QBANK_LLM_MODE = 'anything_else';
    expect(isFreeTierOnly()).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Invariant 2: Zero Sockets / Zero HTTP / Zero Fetch on Paid Provider Requests
  // -------------------------------------------------------------------------
  it('guarantees 0 fetch, 0 http.request, 0 https.request, 0 net.connect when deepseek-v3 is targeted', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const httpRequestSpy = vi.spyOn(http, 'request');
    const httpsRequestSpy = vi.spyOn(https, 'request');
    const netConnectSpy = vi.spyOn(net, 'connect');
    const tlsConnectSpy = vi.spyOn(tls, 'connect');

    let thrownError: any = null;
    try {
      await generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        count: 1,
        provider: 'deepseek-v3',
        mock: false,
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.message).toMatch(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);
    expect(thrownError.callsCount).toBe(0);

    // Hard verification: zero socket / network attempts
    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(httpRequestSpy).toHaveBeenCalledTimes(0);
    expect(httpsRequestSpy).toHaveBeenCalledTimes(0);
    expect(netConnectSpy).toHaveBeenCalledTimes(0);
    expect(tlsConnectSpy).toHaveBeenCalledTimes(0);
  });

  // -------------------------------------------------------------------------
  // Invariant 3: Adversarial Aliases & Casing Fuzzing
  // -------------------------------------------------------------------------
  const adversarialAliases = [
    'deepseek-v3',
    'DeepSeek-V3',
    'DEEPSEEK-V3',
    'deepseek',
    'DeepSeek',
    'DEEPSEEK',
    '  deepseek-v3  ',
    '  DeepSeek  ',
    'v3',
    'deepseek-chat',
    'deepseek-reasoner',
    'unknown-paid-vendor',
    'openai',
    'claude',
  ];

  for (const alias of adversarialAliases) {
    it(`strictly blocks adversarial provider alias "${alias}" without network transmission`, async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await expect(
        generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          count: 1,
          provider: alias,
          mock: false,
        })
      ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });
  }

  // -------------------------------------------------------------------------
  // Invariant 4: Caller attempts to force freeOnly: false
  // -------------------------------------------------------------------------
  it('strictly blocks deepseek-v3 even when caller passes freeOnly: false', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        count: 1,
        provider: 'deepseek-v3',
        freeOnly: false,
        mock: false,
      })
    ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  // -------------------------------------------------------------------------
  // Invariant 5: QBANK_LLM_FREE_PROVIDERS spoofing attempt
  // -------------------------------------------------------------------------
  it('refuses to allow deepseek-v3 even if explicitly named in QBANK_LLM_FREE_PROVIDERS', async () => {
    process.env.QBANK_LLM_FREE_PROVIDERS = 'deepseek-v3,deepseek';
    const allowlist = getFreeProviderAllowlist();
    expect(allowlist?.has('deepseek-v3')).toBe(true);

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        count: 1,
        provider: 'deepseek-v3',
        mock: false,
      })
    ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  // -------------------------------------------------------------------------
  // Invariant 6: Auto Mode Fallback Exhaustion Never Hits DeepSeek
  // -------------------------------------------------------------------------
  it('exhausts gracefully in auto mode when all free providers fail, NEVER touching deepseek', async () => {
    // Mock fetch to simulate failure on free providers (Gemini & Groq)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = String(input);
      if (url.includes('deepseek')) {
        throw new Error('CRITICAL SECURITY VIOLATION: DeepSeek API was invoked in free mode!');
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({ error: { message: 'Rate limit exceeded' } }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    process.env.GEMINI_API_KEY = 'AQ.dummy-key';
    process.env.GROQ_API_KEY = 'gsk_dummy-key';
    process.env.DEEPSEEK_API_KEY = 'sk-synthetic-live-deepseek-paid-key';

    let error: any = null;
    try {
      await generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        count: 1,
        provider: 'auto',
        mock: false,
        timeoutMs: 1000,
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe('NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE');

    // Confirm that fetch was called ONLY for free providers and NEVER for deepseek
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(0);
    for (const call of fetchSpy.mock.calls) {
      const targetUrl = String(call[0]);
      expect(targetUrl).not.toContain('deepseek');
      expect(targetUrl).toMatch(/generativelanguage\.googleapis\.com|api\.groq\.com|(?:localhost|127\.0\.0\.1):11434/);
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 7: Concurrent Stress Test (Race Condition Immunity)
  // -------------------------------------------------------------------------
  it('resists race conditions under 20 concurrent requests with mixed providers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const tasks = Array.from({ length: 20 }, (_, idx) => {
      const provider = idx % 2 === 0 ? 'deepseek-v3' : 'DeepSeek';
      return generateWaterfallQuestions({
        level: 1,
        skill: 'reading',
        count: 1,
        provider,
        mock: false,
      });
    });

    const results = await Promise.allSettled(tasks);

    // Every single promise must be rejected
    for (const res of results) {
      expect(res.status).toBe('rejected');
      if (res.status === 'rejected') {
        expect(res.reason.message).toMatch(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);
      }
    }

    // Absolutely zero network calls dispatched across all 20 concurrent tasks
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });
});
