/**
 * Adversarial Challenger 2 Verification Suite:
 * Blueprint Schemas, Verification Metadata, API Endpoints, and Database Safety Invariants
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';

import {
  examRouter,
  assertSafeTestDb,
  DatabaseGuardError,
  setExamDbForTesting,
  closeReadOnlyDbForTesting,
  clearAllSessionsForTesting,
} from '../src/server/examRoutes';

describe('Challenger 2: Empirical Verification & Invariant Challenges', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Isolate test database
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    closeReadOnlyDbForTesting();

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
    closeReadOnlyDbForTesting();
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  // =========================================================================
  // Challenge 1: Blueprint JSON Files Integrity & Per-Field Metadata
  // =========================================================================
  describe('Challenge 1: Blueprint JSON Files Integrity & Per-Field Metadata', () => {
    const expectedDurations = [40, 60, 83, 85, 110, 125];
    const expectedQuestions = [40, 60, 70, 70, 72, 82];

    for (let lvl = 1; lvl <= 6; lvl++) {
      it(`HSK ${lvl} Blueprint JSON: NO overall verified:true, per-field metadata strictly configured`, () => {
        const filePath = path.resolve(process.cwd(), `data/qbank/blueprint/level${lvl}.json`);
        expect(fs.existsSync(filePath), `Blueprint file level${lvl}.json must exist`).toBe(true);

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Requirement 1: NO file has bp.verified === true (it should be undefined)
        expect(content.verified, `level${lvl}.json must not have top-level verified: true`).toBeUndefined();

        // Requirement 2: verification block exists
        expect(content.verification, `level${lvl}.json must contain verification block`).toBeDefined();

        // Requirement 3: verified_fields contains exactly total_questions and time_limit_minutes
        expect(content.verification.verified_fields).toEqual([
          'total_questions',
          'time_limit_minutes',
        ]);

        // Requirement 4: unverified_fields contains the rest
        const expectedUnverified = ['section_breakdown', 'part_detail', 'skill_duration', 'scoring'];
        for (const uf of expectedUnverified) {
          expect(content.verification.unverified_fields).toContain(uf);
        }

        // Requirement 5: Sources must be cited with valid URL and sample paper title
        expect(content.verification.verification_sources).toBeInstanceOf(Array);
        expect(content.verification.verification_sources.length).toBeGreaterThanOrEqual(2);
        for (const src of content.verification.verification_sources) {
          expect(src.url).toContain('https://www.chinesetest.cn/');
          expect(src.source).toContain('CTI/CLEC official sample paper');
        }

        // Invariant: Duration and total questions match authoritative spec
        expect(content.total_questions).toBe(expectedQuestions[lvl - 1]);
        expect(content.total_time_min).toBe(expectedDurations[lvl - 1]);
      });
    }

    it('HSK 6 Blueprint JSON: Subparts strictly remain unverified', () => {
      const filePath = path.resolve(process.cwd(), 'data/qbank/blueprint/level6.json');
      const bp6 = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // In level6.json, subparts must remain unverified
      const listeningParts = bp6.sections.listening.parts;
      expect(listeningParts.listening_1.status).toBe('unverified');
      expect(listeningParts.listening_1.verified).toBe(false);
      expect(listeningParts.listening_2.status).toBe('unverified');
      expect(listeningParts.listening_2.verified).toBe(false);

      const readingParts = bp6.sections.reading.parts;
      expect(readingParts.reading_3.status).toBe('unverified');
      expect(readingParts.reading_3.verified).toBe(false);

      const writingParts = bp6.sections.writing.parts;
      expect(writingParts.writing_2.status).toBe('unverified');
      expect(writingParts.writing_2.verified).toBe(false);

      // Verify no subpart has verified === true
      for (const sec of Object.values(bp6.sections) as any[]) {
        for (const [pKey, part] of Object.entries(sec.parts || {}) as any[]) {
          expect(part.verified, `HSK 6 subpart ${pKey} must not be verified: true`).not.toBe(true);
        }
      }
    });

    it('Mathematical Invariant across all 6 blueprints: sum(parts) === section, sum(sections) === level', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const filePath = path.resolve(process.cwd(), `data/qbank/blueprint/level${lvl}.json`);
        const bp = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        let sumSections = 0;
        for (const [sKey, sec] of Object.entries(bp.sections) as any[]) {
          let sumParts = 0;
          for (const part of Object.values(sec.parts || {}) as any[]) {
            sumParts += Number(part.n_questions) || 0;
          }
          expect(sumParts, `Level ${lvl} section ${sKey} parts sum`).toBe(sec.total_questions);
          sumSections += sec.total_questions;
        }
        expect(sumSections, `Level ${lvl} sections sum`).toBe(bp.total_questions);
      }
    });
  });

  // =========================================================================
  // Challenge 2: Endpoint GET /api/exam/blueprints
  // =========================================================================
  describe('Challenge 2: Endpoint GET /api/exam/blueprints Output Conformance', () => {
    it('returns HTTP 200 with structured per-field verification metadata for all levels 1..6', async () => {
      const res = await fetch(`${baseUrl}/blueprints`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.blueprints).toBeDefined();

      for (let lvl = 1; lvl <= 6; lvl++) {
        const bp = data.blueprints[lvl];
        expect(bp, `Blueprint for level ${lvl} should exist`).toBeDefined();

        // Must not have overall verified: true
        expect(bp.verified, `Endpoint level ${lvl} must not return verified: true`).toBeUndefined();

        // Must return verification object
        expect(bp.verification, `Endpoint level ${lvl} must return verification`).toBeDefined();
        expect(bp.verification.verified_fields).toEqual([
          'total_questions',
          'time_limit_minutes',
        ]);
        expect(bp.verification.unverified_fields).toEqual([
          'section_breakdown',
          'part_detail',
          'skill_duration',
          'scoring',
        ]);

        // Verification sources array
        expect(bp.verification.verification_sources).toBeInstanceOf(Array);
        expect(bp.verification.verification_sources.length).toBe(2);

        // Timers match calibrated values
        const expectedDurations = [40, 60, 83, 85, 110, 125];
        expect(bp.time_limit_minutes).toBe(expectedDurations[lvl - 1]);
      }
    });
  });

  // =========================================================================
  // Challenge 3: Live Database Safeguards & Invariants
  // =========================================================================
  describe('Challenge 3: Database Safety & Frozen Invariants', () => {
    it('confirms data/hsk_exam.db SHA-256 remains exactly DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('confirms data/qbank/qbank.db exam_sessions row count is strictly 1735 via read-only connection', () => {
      const qbankPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const db = new DatabaseSync(qbankPath, { readOnly: true });
      try {
        // 1699 historical sessions preserved + 36 legitimate practice sessions added in Phases 8-16
        const row = db.prepare('SELECT count(*) as cnt FROM exam_sessions').get() as { cnt: number };
        expect(row.cnt).toBe(1735);

        // 89 baseline + 7 questions approved during Phase 5/6 reviews
        const qRow = db.prepare('SELECT count(*) as cnt FROM questions WHERE status=\'approved\' AND is_active=1').get() as { cnt: number };
        expect(qRow.cnt).toBe(96);

        const tables = db.prepare('SELECT count(*) as cnt FROM sqlite_master WHERE type=\'table\'').get() as { cnt: number };
        expect(tables.cnt).toBe(12);
      } finally {
        db.close();
      }
    });

    it('confirms guard rail aborts any attempt to open operational DB in write mode during tests', () => {
      expect(() => {
        assertSafeTestDb('data/qbank/qbank.db');
      }).toThrow(DatabaseGuardError);

      expect(() => {
        assertSafeTestDb('data/hsk_exam.db');
      }).toThrow(DatabaseGuardError);
    });
  });
});
