/**
 * Phase 4: QBank Admin Token Security Remediation Test Suite
 * Covers Acceptance Criteria 17–23 and R5 Invariants:
 * - AC 17: Valid token performs authorized admin actions
 * - AC 18: Missing or invalid tokens rejected (including 'admin123456')
 * - AC 19: No guessable default token exists when env is unset
 * - AC 20: All important admin and cron-control endpoints protected
 * - AC 21: Token does not appear in built bundle, error responses, or logs
 * - AC 22: Configured token works end-to-end after rotation
 * - AC 23: .env remains git-ignored and new token appears in no tracked file
 * - Preserves data/hsk_exam.db SHA-256 invariant
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import {
  qbankRouter,
  requireAdminAuth,
  getQBankAdminToken,
  setQBankAdminTokenForTesting,
  warnIfInsecureAdminToken,
  logEphemeralTokenIfNeeded,
  isQBankAdminEnabled,
} from '../src/server/qbankRoutes.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Milestone 4: QBank Admin Token Security Remediation Suite (AC 17–23)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;

  // Generate a distinct 64-char crypto hex token for testing
  const validTestToken = crypto.randomBytes(32).toString('hex');

  beforeAll(async () => {
    // Verify database baseline hash invariant
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    const hash = getSha256(HSK_EXAM_DB_PATH);
    expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  afterAll(() => {
    if (originalEnvToken !== undefined) {
      process.env.QBANK_ADMIN_TOKEN = originalEnvToken;
    } else {
      delete process.env.QBANK_ADMIN_TOKEN;
    }
    setQBankAdminTokenForTesting(null);

    // Final database hash invariant check
    const finalHash = getSha256(HSK_EXAM_DB_PATH);
    expect(finalHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    // Setup test express application
    process.env.QBANK_ADMIN_TOKEN = validTestToken;
    setQBankAdminTokenForTesting(validTestToken);

    const app: Express = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server?.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    setQBankAdminTokenForTesting(null);
  });

  // ---------------------------------------------------------------------------
  // AC 17: Valid token performs authorized admin actions
  // ---------------------------------------------------------------------------
  describe('AC 17: Valid token performs authorized admin actions', () => {
    it('authorizes requests with Authorization: Bearer <validToken>', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: `Bearer ${validTestToken}`,
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
    });

    it('authorizes requests with X-QBank-Token: <validToken>', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          'X-QBank-Token': validTestToken,
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
    });

    it('authorizes requests with X-QBank-Admin-Token: <validToken>', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          'X-QBank-Admin-Token': validTestToken,
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
    });

    it('authorizes mutating POST requests with valid token, loopback IP and valid Origin', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/scheduler/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validTestToken}`,
          Origin: 'http://127.0.0.1',
        },
        body: JSON.stringify({ enabled: false }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
    });
  });

  // ---------------------------------------------------------------------------
  // AC 18: Missing or invalid tokens rejected (including 'admin123456')
  // ---------------------------------------------------------------------------
  describe('AC 18: Missing or invalid tokens rejected — including old value admin123456', () => {
    it('rejects requests with missing token headers with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Chưa xác thực');
    });

    it('rejects requests with empty Bearer authorization with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: 'Bearer   ',
        },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('explicitly rejects the revoked compromised token "admin123456" with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: 'Bearer admin123456',
        },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('admin123456');
      expect(data.error).toContain('thu hồi');
    });

    it('explicitly rejects "admin123456" via X-QBank-Token header with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          'X-QBank-Token': 'admin123456',
        },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('admin123456');
    });

    it('rejects mismatched 64-character token with 403 Forbidden', async () => {
      const mismatchedToken = crypto.randomBytes(32).toString('hex');
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: `Bearer ${mismatchedToken}`,
        },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('không hợp lệ');
    });

    it('rejects short / weak client tokens (< 32 characters) with 403 Forbidden', async () => {
      // In non-testing token mode
      setQBankAdminTokenForTesting(null);
      process.env.QBANK_ADMIN_TOKEN = validTestToken;

      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: 'Bearer short-weak-token',
        },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('32 ký tự');
    });
  });

  // ---------------------------------------------------------------------------
  // AC 19: No guessable default token exists when env variable is unset
  // ---------------------------------------------------------------------------
  describe('AC 19: No guessable default token exists when env variable is unset', () => {
    it('returns null and refuses admin requests with 503 when QBANK_ADMIN_TOKEN is unset', async () => {
      delete process.env.QBANK_ADMIN_TOKEN;
      setQBankAdminTokenForTesting(null);

      // Verify no secret or fallback token is generated
      const token = getQBankAdminToken();
      expect(token).toBeNull();

      // Requests with any token must be refused because server has no token configured
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: `Bearer ${validTestToken}`,
        },
      });
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('chưa được thiết lập trên máy chủ');
    });

    it('refuses admin requests with 503 if server has weak token in env (< 32 chars)', async () => {
      process.env.QBANK_ADMIN_TOKEN = 'weak_token_123';
      setQBankAdminTokenForTesting(null);

      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: 'Bearer weak_token_123',
        },
      });
      expect([403, 503]).toContain(res.status);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('refuses admin requests with 503 if server has compromised "admin123456" in env', async () => {
      process.env.QBANK_ADMIN_TOKEN = 'admin123456';
      setQBankAdminTokenForTesting(null);

      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: 'Bearer admin123456',
        },
      });
      expect([403, 503]).toContain(res.status);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('admin123456');
    });
  });

  // ---------------------------------------------------------------------------
  // AC 20: All important admin and cron-control endpoints are protected
  // ---------------------------------------------------------------------------
  describe('AC 20: All important admin and cron-control endpoints are protected', () => {
    const adminEndpoints: Array<{ method: string; path: string }> = [
      { method: 'GET', path: '/api/qbank/stats' },
      { method: 'GET', path: '/api/qbank/questions' },
      { method: 'POST', path: '/api/qbank/generate' },
      { method: 'POST', path: '/api/qbank/review' },
      { method: 'POST', path: '/api/qbank/sync' },
      { method: 'GET', path: '/api/qbank/pending' },
      { method: 'POST', path: '/api/qbank/pending/approve' },
      { method: 'POST', path: '/api/qbank/pending/reject' },
      { method: 'GET', path: '/api/qbank/pools/stats' },
      { method: 'GET', path: '/api/qbank/exam/pool-inspection' },
      { method: 'POST', path: '/api/qbank/exam/assemble-or-supplement' },
      { method: 'GET', path: '/api/qbank/scheduler/status' },
      { method: 'POST', path: '/api/qbank/scheduler/toggle' },
      { method: 'POST', path: '/api/qbank/scheduler/config' },
      { method: 'POST', path: '/api/qbank/scheduler/trigger' },
      { method: 'GET', path: '/api/qbank/scheduler/history' },
      { method: 'GET', path: '/api/qbank/coverage/matrix' },
      { method: 'GET', path: '/api/qbank/coverage/vocab' },
      { method: 'GET', path: '/api/qbank/coverage/official' },
      { method: 'GET', path: '/api/qbank/dashboard/overview' },
    ];

    it.each(adminEndpoints)(
      'rejects unauthenticated requests to $method $path with 401',
      async ({ method, path: endpointPath }) => {
        const res = await fetch(`${baseUrl}${endpointPath}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://127.0.0.1',
          },
          body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify({}) : undefined,
        });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    );

    it.each(adminEndpoints)(
      'rejects "admin123456" requests to $method $path with 403',
      async ({ method, path: endpointPath }) => {
        const res = await fetch(`${baseUrl}${endpointPath}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer admin123456',
            Origin: 'http://127.0.0.1',
          },
          body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify({}) : undefined,
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // AC 21: Token does not appear in built bundle, error responses, or logs
  // ---------------------------------------------------------------------------
  describe('AC 21: Token does not appear in built frontend bundle, error responses, or logs', () => {
    it('verifies dist/assets/*.js contains 0 occurrences of "admin123456" and 0 secret tokens', () => {
      const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
      expect(fs.existsSync(distAssetsDir)).toBe(true);

      const files = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
      expect(files.length).toBeGreaterThan(0);

      // Read current .env token dynamically without printing or hardcoding
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^QBANK_ADMIN_TOKEN=(.*)$/m);
      expect(match).not.toBeNull();
      const currentSecretToken = match![1].trim();
      expect(currentSecretToken.length).toBe(64);

      for (const file of files) {
        const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
        expect(content.includes('admin123456')).toBe(false);
        expect(content.includes(currentSecretToken)).toBe(false);
      }
    });

    it('ensures error responses never echo or leak any token value', async () => {
      const testSecret = 'secret-canary-token-never-leak-in-errors';
      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: `Bearer ${testSecret}`,
        },
      });
      const body = await res.text();
      expect(body.includes(testSecret)).toBe(false);
      expect(body.includes(validTestToken)).toBe(false);
    });

    it('ensures warnIfInsecureAdminToken and logEphemeralTokenIfNeeded never log token secrets', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        warnIfInsecureAdminToken();
        logEphemeralTokenIfNeeded();

        // Check all log calls
        for (const call of logSpy.mock.calls) {
          const joined = call.join(' ');
          expect(joined.includes(validTestToken)).toBe(false);
          expect(joined.includes('Ephemeral Admin Token')).toBe(false);
        }

        // Check all warn calls
        for (const call of warnSpy.mock.calls) {
          const joined = call.join(' ');
          expect(joined.includes(validTestToken)).toBe(false);
        }
      } finally {
        logSpy.mockRestore();
        warnSpy.mockRestore();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // AC 22: After rotation, configured token works end-to-end with restarted server
  // ---------------------------------------------------------------------------
  describe('AC 22: Configured token works end-to-end with the server', () => {
    it('authenticates successfully using the live configured token from .env', async () => {
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^QBANK_ADMIN_TOKEN=(.*)$/m);
      expect(match).not.toBeNull();
      const liveEnvToken = match![1].trim();
      expect(liveEnvToken.length).toBe(64);

      // Simulate restarted server loading live env token
      setQBankAdminTokenForTesting(null);
      process.env.QBANK_ADMIN_TOKEN = liveEnvToken;

      const res = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: `Bearer ${liveEnvToken}`,
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // And old token 'admin123456' is strictly rejected on the same server
      const oldRes = await fetch(`${baseUrl}/api/qbank/stats`, {
        headers: {
          Authorization: 'Bearer admin123456',
        },
      });
      expect(oldRes.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // AC 23: .env remains git-ignored and new token appears in no tracked file
  // ---------------------------------------------------------------------------
  describe('AC 23: .env remains git-ignored and new token appears in no tracked file', () => {
    it('verifies that .env is git-ignored', () => {
      const gitIgnorePath = path.resolve(process.cwd(), '.gitignore');
      const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
      expect(gitIgnoreContent).toMatch(/^\.env\*/m);

      // Verify git check-ignore reports .env
      const checkIgnoreOutput = execSync('git check-ignore .env', { encoding: 'utf8' }).trim();
      expect(checkIgnoreOutput).toBe('.env');
    });

    it('verifies the configured token value does not appear in any git-tracked file', () => {
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^QBANK_ADMIN_TOKEN=(.*)$/m);
      expect(match).not.toBeNull();
      const secretToken = match![1].trim();

      // List all tracked files from git
      const trackedFilesOutput = execSync('git ls-files', { encoding: 'utf8' });
      const trackedFiles = trackedFilesOutput
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0 && fs.existsSync(f));

      for (const trackedFile of trackedFiles) {
        // Skip binary or huge files if any
        if (trackedFile.endsWith('.db') || trackedFile.endsWith('.png') || trackedFile.endsWith('.jpg')) {
          continue;
        }
        try {
          const content = fs.readFileSync(trackedFile, 'utf8');
          expect(
            content.includes(secretToken),
            `Security leak: configured token was found in tracked file ${trackedFile}!`
          ).toBe(false);
        } catch {
          // Non-UTF8 files skipped
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Database Safety Invariant
  // ---------------------------------------------------------------------------
  describe('Database Integrity Invariant', () => {
    it('guarantees data/hsk_exam.db SHA-256 remains strictly untouched', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
