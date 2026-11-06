/**
 * tests/adversarial_phase6_database_safety_invariants.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE — PHASE 6 POST-ACCEPTANCE REMEDIATION
 * Challenger: challenger_m2_2 (teamwork_preview_challenger)
 * Role: Critic & Specialist (Empirical Challenger)
 *
 * Mandatory Verification Invariants:
 * 1. data/hsk_exam.db SHA-256 matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1 with 0 mutations.
 * 2. data/qbank/qbank.db strictly 12 tables, zero unapproved migrations applied
 *    (proposal_20261025_question_knowledge_links.sql & proposal_20261025_distractor_rationales.sql).
 * 3. 89 approved active questions preserved in data/qbank/qbank.db, exam_sessions history preserved (>= 1372 sessions).
 * 4. 0 LLM calls during exam assembly from DB (mock and practice mode).
 * 5. deepseek-v3 classified as non-free (isFreeTier: false) and strictly blocked under free-tier policy even if API key exists.
 * 6. Zero token leaks in bundle/dist, logs, or codebase.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

import {
  WATERFALL_PROVIDERS,
  isFreeTierOnly,
  generateWaterfallQuestions,
} from '../src/server/llm/waterfallGenerator.js';
import {
  examRouter,
  createTestExamDb,
  setExamDbForTesting,
  clearAllSessionsForTesting,
} from '../src/server/examRoutes.js';

describe('Adversarial Verification — Phase 6 Database Safety & Invariants', () => {
  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');

  // ---------------------------------------------------------------------------
  // 1. data/hsk_exam.db Immutability & Hash
  // ---------------------------------------------------------------------------
  describe('1. data/hsk_exam.db Hash & Immutability Invariant', () => {
    it('MUST match exact SHA-256 hash DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const buffer = fs.readFileSync(hskExamDbPath);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

      expect(sha256).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('MUST be a healthy SQLite database passing PRAGMA integrity_check', () => {
      const db = new DatabaseSync(hskExamDbPath, { readOnly: true });
      const check: any = db.prepare('PRAGMA integrity_check').get();
      expect(check.integrity_check).toBe('ok');
      db.close();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. data/qbank/qbank.db Schema & Migration Proposals
  // ---------------------------------------------------------------------------
  describe('2. data/qbank/qbank.db Schema Integrity & 0 Unapproved Migrations', () => {
    const EXPECTED_12_TABLES = [
      'qb_questions',
      'qb_sync_log',
      'qb_export_log',
      'sqlite_sequence',
      'qb_reports',
      'pending_questions',
      'questions',
      'generation_runs',
      'generation_history',
      'exam_eligible_pool',
      'qbank_tasks',
      'exam_sessions',
    ].sort();

    it('MUST contain strictly 12 tables in sqlite_master', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tables: any[] = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all();
      const tableNames = tables.map((t) => t.name).sort();

      expect(tableNames.length).toBe(12);
      expect(tableNames).toEqual(EXPECTED_12_TABLES);
      db.close();
    });

    it('MUST NOT have executed proposal_20261025_question_knowledge_links.sql', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tableExists: any = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'question_knowledge_links'")
        .get();
      expect(tableExists).toBeUndefined();
      db.close();
    });

    it('MUST NOT have executed proposal_20261025_distractor_rationales.sql', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tableExists: any = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'question_distractor_rationales'")
        .get();
      expect(tableExists).toBeUndefined();
      db.close();
    });

    it('MUST pass PRAGMA integrity_check', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const check: any = db.prepare('PRAGMA integrity_check').get();
      expect(check.integrity_check).toBe('ok');
      db.close();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Approved Active Questions and Historical Exam Sessions Preserved
  // ---------------------------------------------------------------------------
  describe('3. Questions and Historical Sessions Invariant', () => {
    it('MUST preserve exactly 96 approved active questions in questions table', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const row: any = db
        .prepare("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1")
        .get();
      // 96 approved active questions (89 baseline + 7 admin-approved rowids 90-96)
      expect(Number(row.cnt)).toBe(96);

      // Verify unique IDs
      const uniqueRows: any = db
        .prepare("SELECT COUNT(DISTINCT id) as cnt FROM questions WHERE status = 'approved' AND is_active = 1")
        .get();
      expect(Number(uniqueRows.cnt)).toBe(96);

      // Verify all are in HSK 1-6
      const outOfScope: any = db
        .prepare("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1 AND (level < 1 OR level > 6)")
        .get();
      expect(Number(outOfScope.cnt)).toBe(0);
      db.close();
    });

    it('MUST preserve historical exam_sessions (>= 1372 sessions)', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const countRow: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get();
      expect(Number(countRow.cnt)).toBeGreaterThanOrEqual(1372);

      // Sample sessions and check validity of session_json
      const sampleSessions: any[] = db
        .prepare('SELECT session_id, level, mode, session_json FROM exam_sessions LIMIT 10')
        .all();
      expect(sampleSessions.length).toBe(10);
      for (const s of sampleSessions) {
        expect(s.session_id).toBeTruthy();
        expect(typeof s.session_json).toBe('string');
        const parsed = JSON.parse(s.session_json);
        expect(parsed).toBeTruthy();
      }
      db.close();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Zero LLM Calls During Exam Assembly
  // ---------------------------------------------------------------------------
  describe('4. Zero LLM Calls Invariant During Exam Assembly', () => {
    let server: http.Server;
    let baseUrl: string;
    let outboundLlmCalls: string[] = [];
    const originalFetch = globalThis.fetch;

    let memDb: DatabaseSync;

    beforeAll(async () => {
      memDb = createTestExamDb({ seedPool: true });
      setExamDbForTesting(memDb);

      const app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address() as any;
          baseUrl = `http://127.0.0.1:${addr.port}/api/exam`;
          resolve();
        });
      });
    });

    afterAll(async () => {
      clearAllSessionsForTesting();
      setExamDbForTesting(null);
      try {
        memDb?.close();
      } catch {}
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    beforeEach(() => {
      outboundLlmCalls = [];
      // Intercept any outbound LLM/cloud calls
      globalThis.fetch = async (input: any, init?: any) => {
        const urlStr = typeof input === 'string' ? input : input?.url || String(input);
        if (
          urlStr.includes('api.openai.com') ||
          urlStr.includes('generativelanguage.googleapis.com') ||
          urlStr.includes('api.deepseek.com') ||
          urlStr.includes('api.groq.com') ||
          urlStr.includes(':11434')
        ) {
          outboundLlmCalls.push(urlStr);
          throw new Error(`VIOLATION: Outbound LLM call detected to: ${urlStr}`);
        }
        return originalFetch(input, init);
      };
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('examRoutes.ts source code MUST NOT import or reference waterfallGenerator or LLM providers', () => {
      const examRoutesContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/server/examRoutes.ts'),
        'utf-8'
      );
      expect(examRoutesContent.includes('waterfallGenerator')).toBe(false);
      expect(examRoutesContent.includes('generateWaterfallQuestions')).toBe(false);
      expect(examRoutesContent.includes('callOpenAICompatible')).toBe(false);
    });

    it('POST /api/exam/generate-mock (mock mode) MUST make 0 LLM calls across HSK 1-6', async () => {
      for (let level = 1; level <= 6; level++) {
        const res = await fetch(`${baseUrl}/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, mode: 'mock' }),
        });

        // In development/test, pool lacks full blueprint questions so returns 400 shortage
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.total_missing).toBeGreaterThan(0);
        expect(outboundLlmCalls.length).toBe(0);
      }
    });

    it('POST /api/exam/generate-mock (practice mode) MUST make 0 LLM calls while assembling from DB', async () => {
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', count: 5 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      expect(outboundLlmCalls.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. DeepSeek-V3 Blocked Under Free-Tier Policy
  // ---------------------------------------------------------------------------
  describe('5. Strict Free-Tier Quota & DeepSeek-V3 Blocking', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('deepseek-v3 MUST have isFreeTier: false in WATERFALL_PROVIDERS', () => {
      const deepseek = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
      expect(deepseek).toBeDefined();
      expect(deepseek?.isFreeTier).toBe(false);
    });

    it('isFreeTierOnly() returns true by default and when QBANK_LLM_FREE_ONLY=true', () => {
      delete process.env.QBANK_LLM_ALLOW_PAID;
      process.env.QBANK_LLM_FREE_ONLY = 'true';
      expect(isFreeTierOnly()).toBe(true);
    });

    it('MUST strictly exclude and block deepseek-v3 when QBANK_LLM_FREE_ONLY=true even if DEEPSEEK_API_KEY is present', async () => {
      delete process.env.QBANK_LLM_ALLOW_PAID;
      process.env.QBANK_LLM_FREE_ONLY = 'true';
      process.env.DEEPSEEK_API_KEY = 'sk-synthetic-paid-key-must-be-blocked';

      // Attempting to generate with provider deepseek-v3 under free-only policy
      await expect(
        generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          count: 1,
          provider: 'deepseek-v3',
          mock: false,
        })
      ).rejects.toThrow('LLM_ALL_PROVIDERS_EXHAUSTED');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Zero Token Leaks
  // ---------------------------------------------------------------------------
  describe('6. Zero Token / Credential Leaks Invariant', () => {
    it('MUST have 0 raw API keys matching sk-[a-zA-Z0-9_-]{20,} in dist/ folder', () => {
      const distPath = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distPath)) return;

      const scanDirectory = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (/\.(js|cjs|mjs|html|json)$/i.test(file) && !file.endsWith('.map')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const matches = content.match(/sk-[a-zA-Z0-9_-]{20,}/g);
            expect(matches).toBeNull();
          }
        }
      };

      scanDirectory(distPath);
    });

    it('MUST NOT contain default password "admin123456" in dist/assets', () => {
      const assetsPath = path.resolve(process.cwd(), 'dist/assets');
      if (!fs.existsSync(assetsPath)) return;

      const files = fs.readdirSync(assetsPath);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(assetsPath, file), 'utf-8');
          expect(content.includes('admin123456')).toBe(false);
        }
      }
    });
  });
});
