import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  assertStagingDatabaseIsolation,
  getHskExamDbPath,
  getQBankDbPath,
} from '../src/server/dbPaths.js';
import {
  getDbSync,
  setDbSyncForTesting,
} from '../src/server/qbankRoutes.js';
import {
  assertSafeTestDb,
  isOperationalDbPath,
  DatabaseGuardError,
} from '../src/server/examRoutes.js';

// Authoritative hashes for data/qbank/qbank.db across pipeline milestones:
// - E85BEAE5...: Pre-migration baseline (Phases 1-7)
// - 84EFA1CA...: Post-migration with audio_url column (Phase 8)
// - 62E175A3... / 947F2031... / 6A2B16D9...: Valid operational snapshots
const OPERATIONAL_QBANK_HASHES = [
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
const OPERATIONAL_HSK_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

function computeSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function normalize(p: string): string {
  return path.resolve(p).toLowerCase().replace(/\\/g, '/');
}

describe('Milestone 1 Adversarial Verification Part 2', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    setDbSyncForTesting(null);
  });

  afterEach(() => {
    setDbSyncForTesting(null);
    process.env = { ...originalEnv };
  });

  describe('1. Empirical Staging & Operational Filesystem Verification', () => {
    const stagingDir = 'D:\\minnese-staging-20261027';
    const stagingQbankPath = path.join(stagingDir, 'qbank-staging.db');
    const stagingHskPath = path.join(stagingDir, 'hsk-exam-staging.db');
    const operationalQbankPath = path.resolve('data/qbank/qbank.db');
    const operationalHskPath = path.resolve('data/hsk_exam.db');

    it('empirically verifies physical existence of staging and operational databases', () => {
      expect(fs.existsSync(stagingDir)).toBe(true);
      expect(fs.existsSync(stagingQbankPath)).toBe(true);
      expect(fs.existsSync(stagingHskPath)).toBe(true);
      expect(fs.existsSync(operationalQbankPath)).toBe(true);
      expect(fs.existsSync(operationalHskPath)).toBe(true);

      const qbankStat = fs.statSync(stagingQbankPath);
      const hskStat = fs.statSync(stagingHskPath);
      expect(qbankStat.size).toBeGreaterThan(0);
      expect(hskStat.size).toBeGreaterThan(0);
    });

    it('calculates and records SHA-256 hashes of staging and operational databases', () => {
      const stagingQbankHash = computeSha256(stagingQbankPath);
      const stagingHskHash = computeSha256(stagingHskPath);
      const opQbankHash = computeSha256(operationalQbankPath);
      const opHskHash = computeSha256(operationalHskPath);

      expect(stagingQbankHash).toBeDefined();
      expect(stagingHskHash).toBeDefined();
      expect(stagingQbankHash.length).toBe(64);
      expect(stagingHskHash.length).toBe(64);

      // Operational DBs must match baseline bit-for-bit
      expect(OPERATIONAL_QBANK_HASHES).toContain(opQbankHash);
      expect(opHskHash).toBe(OPERATIONAL_HSK_HASH);

      // Staging DBs must be separate distinct files
      expect(stagingQbankHash).not.toBe(opQbankHash);
      expect(stagingHskHash).not.toBe(opHskHash);
    });
  });

  describe('2. Empirical Programmatic Binding via PRAGMA database_list', () => {
    const stagingQbank = 'D:\\minnese-staging-20261027\\qbank-staging.db';
    const stagingHsk = 'D:\\minnese-staging-20261027\\hsk-exam-staging.db';

    it('binds getDbSync strictly to staging qbank database via PRAGMA database_list', () => {
      process.env.MINNESE_STAGING = 'true';
      process.env.QBANK_DB_PATH = stagingQbank;
      process.env.HSK_EXAM_DB_PATH = stagingHsk;
      process.env.QBANK_LLM_FREE_ONLY = 'true';
      process.env.QBANK_LLM_ALLOW_PAID = 'false';
      process.env.HOST = '127.0.0.1';
      process.env.ENABLE_AUTO_QUESTION_GENERATION = 'false';
      process.env.QBANK_AUTO_APPROVE = 'false';

      expect(() => assertStagingDatabaseIsolation()).not.toThrow();
      expect(normalize(getQBankDbPath())).toBe(normalize(stagingQbank));
      expect(normalize(getHskExamDbPath())).toBe(normalize(stagingHsk));

      const db = getDbSync();
      const list = db.prepare('PRAGMA database_list').all() as Array<{ seq: number; name: string; file: string }>;

      expect(list.length).toBeGreaterThanOrEqual(1);
      const mainDb = list.find((d) => d.name === 'main');
      expect(mainDb).toBeDefined();
      expect(normalize(mainDb!.file)).toBe(normalize(stagingQbank));

      // Assert zero connection to operational DB
      const opQbank = normalize(path.resolve('data/qbank/qbank.db'));
      const opHsk = normalize(path.resolve('data/hsk_exam.db'));
      for (const entry of list) {
        expect(normalize(entry.file)).not.toBe(opQbank);
        expect(normalize(entry.file)).not.toBe(opHsk);
      }
    });

    it('binds HSK exam database connection strictly to staging via PRAGMA database_list', () => {
      process.env.MINNESE_STAGING = 'true';
      process.env.QBANK_DB_PATH = stagingQbank;
      process.env.HSK_EXAM_DB_PATH = stagingHsk;
      process.env.QBANK_LLM_FREE_ONLY = 'true';
      process.env.QBANK_LLM_ALLOW_PAID = 'false';
      process.env.HOST = '127.0.0.1';
      process.env.ENABLE_AUTO_QUESTION_GENERATION = 'false';
      process.env.QBANK_AUTO_APPROVE = 'false';

      const hskPath = getHskExamDbPath();
      const hskDb = new DatabaseSync(hskPath, { readOnly: true });
      try {
        const list = hskDb.prepare('PRAGMA database_list').all() as Array<{ seq: number; name: string; file: string }>;
        const mainDb = list.find((d) => d.name === 'main');
        expect(mainDb).toBeDefined();
        expect(normalize(mainDb!.file)).toBe(normalize(stagingHsk));
      } finally {
        hskDb.close();
      }
    });
  });

  describe('3. Adversarial Staging Guardrail Stress-Testing', () => {
    const validStagingEnv = {
      MINNESE_STAGING: 'true',
      QBANK_DB_PATH: 'D:\\minnese-staging-20261027\\qbank-staging.db',
      HSK_EXAM_DB_PATH: 'D:\\minnese-staging-20261027\\hsk-exam-staging.db',
      QBANK_LLM_FREE_ONLY: 'true',
      QBANK_LLM_ALLOW_PAID: 'false',
      HOST: '127.0.0.1',
    };

    it('rejects operational QBANK_DB_PATH (relative path)', () => {
      const env = { ...validStagingEnv, QBANK_DB_PATH: 'data/qbank/qbank.db' };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects operational QBANK_DB_PATH (absolute windows path)', () => {
      const absPath = path.resolve('data/qbank/qbank.db');
      const env = { ...validStagingEnv, QBANK_DB_PATH: absPath };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects operational QBANK_DB_PATH with forward slashes and mixed casing', () => {
      const sneakyPath = path.resolve('data/qbank/qbank.db').replace(/\\/g, '/').toUpperCase();
      const env = { ...validStagingEnv, QBANK_DB_PATH: sneakyPath };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects operational HSK_EXAM_DB_PATH (relative path)', () => {
      const env = { ...validStagingEnv, HSK_EXAM_DB_PATH: 'data/hsk_exam.db' };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects operational HSK_EXAM_DB_PATH (absolute windows path)', () => {
      const absPath = path.resolve('data/hsk_exam.db');
      const env = { ...validStagingEnv, HSK_EXAM_DB_PATH: absPath };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects cross-assignment of operational paths (QBank set to operational HSK)', () => {
      const env = { ...validStagingEnv, QBANK_DB_PATH: 'data/hsk_exam.db' };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects cross-assignment of operational paths (HSK set to operational QBank)', () => {
      const env = { ...validStagingEnv, HSK_EXAM_DB_PATH: 'data/qbank/qbank.db' };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must not point to either operational database/);
    });

    it('rejects empty or whitespace-only database paths', () => {
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, QBANK_DB_PATH: '' })).toThrow(/explicit QBANK_DB_PATH and HSK_EXAM_DB_PATH are required/);
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, QBANK_DB_PATH: '   ' })).toThrow(/explicit QBANK_DB_PATH and HSK_EXAM_DB_PATH are required/);
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, HSK_EXAM_DB_PATH: '' })).toThrow(/explicit QBANK_DB_PATH and HSK_EXAM_DB_PATH are required/);
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, HSK_EXAM_DB_PATH: '   ' })).toThrow(/explicit QBANK_DB_PATH and HSK_EXAM_DB_PATH are required/);
    });

    it('rejects sharing identical path for both QBank and HSK exam databases', () => {
      const env = { ...validStagingEnv, HSK_EXAM_DB_PATH: validStagingEnv.QBANK_DB_PATH };
      expect(() => assertStagingDatabaseIsolation(env)).toThrow(/must be separate files/);
    });

    it('rejects non-free or paid LLM settings on staging', () => {
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, QBANK_LLM_FREE_ONLY: 'false' })).toThrow(/FREE_ONLY=true and QBANK_LLM_ALLOW_PAID=false/);
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, QBANK_LLM_ALLOW_PAID: 'true' })).toThrow(/FREE_ONLY=true and QBANK_LLM_ALLOW_PAID=false/);
    });

    it('rejects automatic generation or auto-approval on staging', () => {
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, ENABLE_AUTO_QUESTION_GENERATION: 'true' })).toThrow(/automatic generation and automatic approval/);
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, QBANK_AUTO_APPROVE: 'true' })).toThrow(/automatic generation and automatic approval/);
    });

    it('rejects non-loopback host on staging', () => {
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, HOST: '0.0.0.0' })).toThrow(/HOST must be 127.0.0.1/);
      expect(() => assertStagingDatabaseIsolation({ ...validStagingEnv, HOST: '192.168.1.100' })).toThrow(/HOST must be 127.0.0.1/);
    });

    it('verifies DatabaseGuard in examRoutes throws on operational DB in test environment', () => {
      expect(isOperationalDbPath('data/qbank/qbank.db')).toBe(true);
      expect(isOperationalDbPath('data/hsk_exam.db')).toBe(true);
      expect(() => assertSafeTestDb('data/qbank/qbank.db')).toThrow(DatabaseGuardError);
      expect(() => assertSafeTestDb('data/hsk_exam.db')).toThrow(DatabaseGuardError);
      expect(() => assertSafeTestDb(path.resolve('data/qbank/qbank.db'))).toThrow(DatabaseGuardError);
      expect(() => assertSafeTestDb(path.resolve('data/hsk_exam.db'))).toThrow(DatabaseGuardError);
    });
  });
});
