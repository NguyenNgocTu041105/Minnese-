import path from 'path';

const DEFAULT_QBANK_DB_PATH = path.join('data', 'qbank', 'qbank.db');
const DEFAULT_HSK_EXAM_DB_PATH = path.join('data', 'hsk_exam.db');

export function getQBankDbPath(cwd = process.cwd()): string {
  return path.resolve(cwd, process.env.QBANK_DB_PATH?.trim() || DEFAULT_QBANK_DB_PATH);
}

export function getHskExamDbPath(cwd = process.cwd()): string {
  return path.resolve(cwd, process.env.HSK_EXAM_DB_PATH?.trim() || DEFAULT_HSK_EXAM_DB_PATH);
}

export function assertStagingDatabaseIsolation(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): void {
  if (env.MINNESE_STAGING !== 'true') return;

  if (env.QBANK_LLM_FREE_ONLY !== 'true' || env.QBANK_LLM_ALLOW_PAID !== 'false') {
    throw new Error('Staging startup blocked: QBANK_LLM_FREE_ONLY=true and QBANK_LLM_ALLOW_PAID=false are required.');
  }

  if (env.ENABLE_AUTO_QUESTION_GENERATION === 'true' || env.QBANK_AUTO_APPROVE === 'true') {
    throw new Error('Staging startup blocked: automatic generation and automatic approval must remain disabled.');
  }

  if (env.HOST !== '127.0.0.1') {
    throw new Error('Staging startup blocked: HOST must be 127.0.0.1 to keep the staging server local.');
  }

  if (!env.QBANK_DB_PATH?.trim() || !env.HSK_EXAM_DB_PATH?.trim()) {
    throw new Error('Staging startup blocked: explicit QBANK_DB_PATH and HSK_EXAM_DB_PATH are required.');
  }

  const normalize = (value: string) => path.resolve(cwd, value).toLowerCase();
  const qbank = normalize(env.QBANK_DB_PATH);
  const hskExam = normalize(env.HSK_EXAM_DB_PATH);
  const operationalQBank = normalize(DEFAULT_QBANK_DB_PATH);
  const operationalHsk = normalize(DEFAULT_HSK_EXAM_DB_PATH);

  if (qbank === operationalQBank || qbank === operationalHsk || hskExam === operationalQBank || hskExam === operationalHsk) {
    throw new Error('Staging startup blocked: staging database paths must not point to either operational database.');
  }

  if (qbank === hskExam) {
    throw new Error('Staging startup blocked: QBank and HSK exam databases must be separate files.');
  }
}
