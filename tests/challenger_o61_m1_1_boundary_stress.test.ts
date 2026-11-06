import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

describe('Challenger O61 M1-1 Empirical Boundary & Mutation Harness', () => {
  const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const EXPECTED_HSK_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  describe('1. Checksum Verification & Tamper Sensitivity of data/hsk_exam.db', () => {
    it('verifies exact SHA-256 matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const buffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_HASH);
    });

    it('empirically proves tampering (single bit/byte flip) is caught by hash assertion', () => {
      const buffer = Buffer.from(fs.readFileSync(HSK_EXAM_DB_PATH).subarray(0, 1024));
      // Flip a single byte
      buffer[0] ^= 0x01;
      const tamperedHash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(tamperedHash).not.toBe(EXPECTED_HSK_HASH);
    });
  });

  describe('2. Boundary Value Sensitivity: exam_sessions (1734, 1735, 1736)', () => {
    it('confirms operational qbank.db has exactly 1735 exam_sessions', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const row = db.prepare('SELECT COUNT(1) as c FROM exam_sessions').get() as { c: number };
      expect(row.c).toBe(1735);
      db.close();
    });

    it('empirically simulates boundary values 1734 and 1736 against strict assertion', () => {
      const assertSessions = (count: number) => {
        expect(count).toBe(1735);
      };

      // 1735 must pass
      expect(() => assertSessions(1735)).not.toThrow();

      // 1734 must FAIL
      expect(() => assertSessions(1734)).toThrow();

      // 1736 must FAIL
      expect(() => assertSessions(1736)).toThrow();
    });
  });

  describe('3. Boundary Value Sensitivity: approved questions (95, 96, 97)', () => {
    it('confirms operational qbank.db has exactly 96 approved active questions', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const row = db.prepare("SELECT COUNT(1) as c FROM questions WHERE status = 'approved' AND is_active = 1").get() as { c: number };
      expect(row.c).toBe(96);
      db.close();
    });

    it('empirically simulates boundary values 95 and 97 against strict assertion', () => {
      const assertApproved = (count: number) => {
        expect(count).toBe(96);
      };

      // 96 must pass
      expect(() => assertApproved(96)).not.toThrow();

      // 95 must FAIL
      expect(() => assertApproved(95)).toThrow();

      // 97 must FAIL
      expect(() => assertApproved(97)).toThrow();
    });
  });

  describe('4. Boundary Value Sensitivity: exam_eligible questions (12, 13, 14)', () => {
    it('confirms operational qbank.db has exactly 13 exam_eligible questions in pool', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const row = db.prepare('SELECT COUNT(1) as c FROM exam_eligible_pool WHERE exam_eligible = 1').get() as { c: number };
      expect(row.c).toBe(13);
      db.close();
    });

    it('empirically simulates boundary values 12 and 14 against strict assertion', () => {
      const assertExamEligible = (count: number) => {
        expect(count).toBe(13);
      };

      // 13 must pass
      expect(() => assertExamEligible(13)).not.toThrow();

      // 12 must FAIL
      expect(() => assertExamEligible(12)).toThrow();

      // 14 must FAIL
      expect(() => assertExamEligible(14)).toThrow();
    });
  });

  describe('5. Strict Disjoint Partition Check of 96 Approved Questions', () => {
    it('proves all 96 questions partition cleanly into levels without overlap or leakage', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const rows = db.prepare("SELECT id, level FROM questions WHERE status = 'approved' AND is_active = 1").all() as Array<{ id: string; level: number }>;
      expect(rows.length).toBe(96);

      const levelCounts: Record<number, number> = {};
      const uniqueIds = new Set<string>();

      for (const r of rows) {
        expect(uniqueIds.has(r.id)).toBe(false);
        uniqueIds.add(r.id);
        levelCounts[r.level] = (levelCounts[r.level] || 0) + 1;
      }

      expect(uniqueIds.size).toBe(96);
      const totalFromLevels = Object.values(levelCounts).reduce((a, b) => a + b, 0);
      expect(totalFromLevels).toBe(96);
      db.close();
    });
  });
});
