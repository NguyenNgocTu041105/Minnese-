import { afterEach, describe, expect, it } from 'vitest';
import path from 'path';
import { assertStagingDatabaseIsolation, getHskExamDbPath, getQBankDbPath } from '../src/server/dbPaths.js';

const originalDbEnv = {
  qbank: process.env.QBANK_DB_PATH,
  hsk: process.env.HSK_EXAM_DB_PATH,
};

afterEach(() => {
  if (originalDbEnv.qbank === undefined) delete process.env.QBANK_DB_PATH;
  else process.env.QBANK_DB_PATH = originalDbEnv.qbank;
  if (originalDbEnv.hsk === undefined) delete process.env.HSK_EXAM_DB_PATH;
  else process.env.HSK_EXAM_DB_PATH = originalDbEnv.hsk;
});

function stagingEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    MINNESE_STAGING: 'true',
    QBANK_LLM_FREE_ONLY: 'true',
    QBANK_LLM_ALLOW_PAID: 'false',
    QBANK_DB_PATH: 'artifacts/staging/qbank.db',
    HSK_EXAM_DB_PATH: 'artifacts/staging/hsk_exam.db',
    HOST: '127.0.0.1',
    ...overrides,
  };
}

describe('staging database isolation', () => {
  it('resolves independently configured QBank and HSK exam database paths', () => {
    const cwd = path.resolve('fixture-workspace');
    process.env.QBANK_DB_PATH = 'artifacts/staging/qbank.db';
    process.env.HSK_EXAM_DB_PATH = 'artifacts/staging/hsk_exam.db';
    try {
      expect(getQBankDbPath(cwd)).toBe(path.resolve(cwd, 'artifacts/staging/qbank.db'));
      expect(getHskExamDbPath(cwd)).toBe(path.resolve(cwd, 'artifacts/staging/hsk_exam.db'));
    } finally {
      if (originalDbEnv.qbank === undefined) delete process.env.QBANK_DB_PATH;
      else process.env.QBANK_DB_PATH = originalDbEnv.qbank;
      if (originalDbEnv.hsk === undefined) delete process.env.HSK_EXAM_DB_PATH;
      else process.env.HSK_EXAM_DB_PATH = originalDbEnv.hsk;
    }
  });

  it('allows separate non-operational DB paths with strict free-only policy', () => {
    expect(() => assertStagingDatabaseIsolation(stagingEnv())).not.toThrow();
  });

  it('rejects either operational DB path', () => {
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ QBANK_DB_PATH: 'data/qbank/qbank.db' }))).toThrow(/must not point/);
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ HSK_EXAM_DB_PATH: 'data/hsk_exam.db' }))).toThrow(/must not point/);
  });

  it('rejects shared staging DB paths and non-free or automatic modes', () => {
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ HSK_EXAM_DB_PATH: 'artifacts/staging/qbank.db' }))).toThrow(/must be separate/);
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ QBANK_LLM_FREE_ONLY: 'false' }))).toThrow(/FREE_ONLY/);
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ QBANK_LLM_ALLOW_PAID: 'true' }))).toThrow(/FREE_ONLY/);
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ ENABLE_AUTO_QUESTION_GENERATION: 'true' }))).toThrow(/automatic generation/);
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ QBANK_AUTO_APPROVE: 'true' }))).toThrow(/automatic generation/);
    expect(() => assertStagingDatabaseIsolation(stagingEnv({ HOST: '0.0.0.0' }))).toThrow(/HOST/);
  });
});
