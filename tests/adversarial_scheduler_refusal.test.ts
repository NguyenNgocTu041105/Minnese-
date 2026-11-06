import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { runScheduledBatch, initAutoQuestionScheduler, getAutoSchedulerStatus } from '../src/server/cron/autoQuestionScheduler';

function computeSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

describe('Adversarial Scheduler Safeguard & Refusal Invariants', () => {
  const originalEnv = { ...process.env };
  const qbankPath = path.resolve('data/qbank/qbank.db');
  let baselineHash: string;

  beforeEach(() => {
    baselineHash = computeSha256(qbankPath);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    const currentHash = computeSha256(qbankPath);
    expect(currentHash).toBe(baselineHash);
  });

  afterAll(() => {
    const walPath = path.resolve('data/qbank/qbank.db-wal');
    const shmPath = path.resolve('data/qbank/qbank.db-shm');
    try {
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {}
  });

  it('refuses to execute scheduled batch when scheduler is disabled by default', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_AUTO_QUESTION_GENERATION;
    delete process.env.ALLOW_OPERATIONAL_CRON_WRITE;

    const result = await runScheduledBatch();
    expect(result.success).toBe(false);
    expect(result.savedCount).toBe(0);
    expect(result.error).toBe('Scheduler is disabled');
  });

  it('refuses to execute scheduled batch against operational database in development mode when enabled without explicit override', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_AUTO_QUESTION_GENERATION = 'true';
    delete process.env.ALLOW_OPERATIONAL_CRON_WRITE;

    const result = await runScheduledBatch();
    expect(result.success).toBe(false);
    expect(result.savedCount).toBe(0);
    expect(result.error).toContain('Scheduler refused to mutate operational database in non-production environment');
  });

  it('refuses to execute scheduled batch against operational database in test mode even if enabled and ALLOW_OPERATIONAL_CRON_WRITE is true', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_AUTO_QUESTION_GENERATION = 'true';
    process.env.ALLOW_OPERATIONAL_CRON_WRITE = 'true';

    const result = await runScheduledBatch();
    expect(result.success).toBe(false);
    expect(result.savedCount).toBe(0);
    expect(result.error).toContain('Scheduler refused to mutate operational database in non-production environment');
  });

  it('initAutoQuestionScheduler strictly refuses to start timer or schedule runs in test mode', () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_AUTO_QUESTION_GENERATION = 'true';

    initAutoQuestionScheduler();
    const status = getAutoSchedulerStatus();
    expect(status.nextRunTime).toBeNull();
  });

  it('initAutoQuestionScheduler strictly refuses to start when DISABLE_AUTO_SCHEDULER is true', () => {
    process.env.NODE_ENV = 'development';
    process.env.DISABLE_AUTO_SCHEDULER = 'true';
    process.env.ENABLE_AUTO_QUESTION_GENERATION = 'true';

    initAutoQuestionScheduler();
    const status = getAutoSchedulerStatus();
    expect(status.nextRunTime).toBeNull();
  });
});
