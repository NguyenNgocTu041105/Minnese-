/**
 * tests/adversarial_challenger2_phase8_1_fuzzing.test.ts
 *
 * Adversarial Linguistic Fuzzing & Database Isolation Verification Suite.
 * Agent: challenger_2_phase8_1
 *
 * Scope:
 * 1. Linguistic fuzzing on syncExplanationLetter (affirmative, negations, distractors,
 *    Vietnamese accented words with ASCII word boundary flaw, and punctuation variants).
 * 2. Empirical reproduction and verification of ISSUE-03.
 * 3. Forensic database contamination scan and SHA-256 verification of data/hsk_exam.db.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  syncExplanationLetter,
  shuffleQuestionAnswers,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle';

describe('Challenger 2 (Phase 8.1): Adversarial Linguistic Fuzzing & DB Isolation', () => {

  // ===========================================================================
  // Section 1: Affirmative Clauses Fuzzing
  // ===========================================================================
  describe('1. Affirmative Vietnamese syntactic patterns', () => {
    it('1.1: Standard affirmative phrasing updates correctly when swapping index 0 (A) to 1, 2, or 3', () => {
      const expl1 = 'Đáp án chính xác là A. 学校 có nghĩa là trường học.';
      expect(syncExplanationLetter(expl1, 0, 1)).toBe('Đáp án chính xác là B. 学校 có nghĩa là trường học.');
      expect(syncExplanationLetter(expl1, 0, 2)).toBe('Đáp án chính xác là C. 学校 có nghĩa là trường học.');
      expect(syncExplanationLetter(expl1, 0, 3)).toBe('Đáp án chính xác là D. 学校 có nghĩa là trường học.');

      const expl2 = 'Chọn đáp án A vì đây là từ vựng chính xác.';
      expect(syncExplanationLetter(expl2, 0, 2)).toBe('Chọn đáp án C vì đây là từ vựng chính xác.');

      const expl3 = 'A là đáp án đúng cho câu này.';
      expect(syncExplanationLetter(expl3, 0, 2)).toBe('C là đáp án đúng cho câu này.');

      const expl4 = 'Phương án đúng là: A';
      expect(syncExplanationLetter(expl4, 0, 2)).toBe('Phương án đúng là: C');

      const expl5 = 'Phương án A phù hợp với ngữ cảnh.';
      expect(syncExplanationLetter(expl5, 0, 2)).toBe('Phương án C phù hợp với ngữ cảnh.');
    });
  });

  // ===========================================================================
  // Section 2: Negative Distractor Clauses & ISSUE-03 Verification
  // ===========================================================================
  describe('2. Negative distractor clauses & ISSUE-03 safe preservation verification', () => {
    it('2.1: ISSUE-03 Hardening - "Không nên chọn A" is safely preserved and not corrupted', () => {
      // Setup: original question had answer A (0).
      // Explanation includes distractor warning explaining why someone might wrongly choose A:
      const sentence = 'Không nên chọn A vì A là danh từ. Đáp án đúng là A.';
      
      // When A (0) is shuffled to position C (2):
      const result = syncExplanationLetter(sentence, 0, 2);

      // Safe preservation: NEGATION_INDICATOR_REGEX protects against contradictory corruption
      expect(result).toBe(sentence);
      expect(result).not.toContain('Không nên chọn C');
    });

    it('2.2: Negation variants: "Đừng chọn A", "Tránh chọn A" are safely preserved', () => {
      const sentenceDung = 'Đừng chọn A nếu chưa đọc kỹ. Đáp án đúng là: A.';
      const resDung = syncExplanationLetter(sentenceDung, 0, 2);
      expect(resDung).toBe(sentenceDung);

      const sentenceTranh = 'Tránh chọn A vì sai ngữ pháp.';
      const resTranh = syncExplanationLetter(sentenceTranh, 0, 2);
      expect(resTranh).toBe(sentenceTranh);
    });

    it('2.3: Elimination phrasing: "Loại trừ phương án: A" is safely preserved', () => {
      const sentence = 'Loại trừ phương án: A vì không phù hợp.';
      const result = syncExplanationLetter(sentence, 0, 2); // A -> C
      expect(result).toBe(sentence);
    });

    it('2.4: Elimination phrasing: "Loại trừ phương án A là sai" is safely preserved', () => {
      const sentence = 'Loại trừ phương án A là sai vì nghĩa khác.';
      const result = syncExplanationLetter(sentence, 0, 2); // A -> C
      expect(result).toBe(sentence);
    });
  });

  // ===========================================================================
  // Section 3: Mixed Sentences with Multiple Option Rationales
  // ===========================================================================
  describe('3. Mixed sentences with multi-option explanations', () => {
    it('3.1: Multi-option breakdown is safely preserved to prevent semantic contradiction', () => {
      const originalExplanation =
        'Đáp án đúng là A. B sai vì 医院 là bệnh viện. C sai vì 商店 là cửa hàng. D sai vì 饭馆 là quán ăn.';

      // Shuffle swapping index 0 (A) to 2 (C):
      const synced = syncExplanationLetter(originalExplanation, 0, 2);

      // Multi-option presence safely preserves explanation
      expect(synced).toBe(originalExplanation);
    });

    it('3.2: Full shuffleQuestionAnswers pipeline safely preserves multi-option breakdown', () => {
      const q: ShuffleableQuestion = {
        stem: '他在____工作，是一名医生。',
        options: ['医院', '学校', '商店', '饭馆'], // 0: 医院 (Doctor works at Hospital)
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A. B sai vì 学校 là trường học. C sai vì 商店 là cửa hàng. D sai vì 饭馆 là quán ăn.',
      };

      const deterministicRng = () => 0.0;
      const res = shuffleQuestionAnswers(q, deterministicRng);

      expect(res.shuffled).toBe(false);
      expect(res.new_answer_idx).toBe(0);
      expect(res.question.options[0]).toBe('医院');
      expect(res.question.explanation_vi).toBe(q.explanation_vi);
    });
  });

  // ===========================================================================
  // Section 4: Vietnamese Accented Words & Word Boundary Protection
  // ===========================================================================
  describe('4. Vietnamese words with uppercase & lowercase letters (Unicode boundary protection)', () => {
    it('4.1: Capitalized Vietnamese words starting with B, C, D followed by accented vowels are NOT corrupted', () => {
      const explCafe = 'Đáp án đúng là Cà phê.';
      const resCafe = syncExplanationLetter(explCafe, 2, 0); // C -> A
      expect(resCafe).toBe('Đáp án đúng là Cà phê.');

      const explBacSi = 'Đáp án đúng là: Bác sĩ.';
      const resBacSi = syncExplanationLetter(explBacSi, 1, 0); // B -> A
      expect(resBacSi).toBe('Đáp án đúng là: Bác sĩ.');

      const explBo = 'Đáp án chính xác là: Bố.';
      const resBo = syncExplanationLetter(explBo, 1, 0); // B -> A
      expect(resBo).toBe('Đáp án chính xác là: Bố.');

      const explCuaHang = 'Đáp án đúng là Cửa hàng.';
      const resCuaHang = syncExplanationLetter(explCuaHang, 2, 0); // C -> A
      expect(resCuaHang).toBe('Đáp án đúng là Cửa hàng.');

      const explCa = 'Chọn Cá vì đây là loài động vật.';
      const resCa = syncExplanationLetter(explCa, 2, 0); // C -> A
      expect(resCa).toBe('Chọn Cá vì đây là loài động vật.');

      const explDeNhat = 'Phương án đúng là: Dễ nhất.';
      const resDeNhat = syncExplanationLetter(explDeNhat, 3, 0); // D -> A
      expect(resDeNhat).toBe('Phương án đúng là: Dễ nhất.');
    });

    it('4.2: Lowercase Vietnamese words protected against false match', () => {
      const explCau = 'Chọn câu đúng nhất.';
      const resCau = syncExplanationLetter(explCau, 2, 0); // C -> A
      expect(resCau).toBe('Chọn câu đúng nhất.');

      const explCo = 'Chọn có căn cứ ngữ pháp.';
      const resCo = syncExplanationLetter(explCo, 2, 0); // C -> A
      expect(resCo).toBe('Chọn có căn cứ ngữ pháp.');

      const explCa = 'Chọn cả hai phương án.';
      const resCa = syncExplanationLetter(explCa, 2, 1); // C -> B
      expect(resCa).toBe('Chọn cả hai phương án.');
    });

    it('4.3: Unaffected words where following letter is ASCII', () => {
      // In these words, the letter following A/B/D/E is ASCII ([a-z]), so no \b exists between them:
      const explAn = 'Đáp án đúng là An ninh.';
      expect(syncExplanationLetter(explAn, 0, 2)).toBe('Đáp án đúng là An ninh.');

      const explBa = 'Đáp án đúng là Ba mẹ.';
      expect(syncExplanationLetter(explBa, 1, 0)).toBe('Đáp án đúng là Ba mẹ.');

      const explDu = 'Đáp án đúng là Du lịch.';
      expect(syncExplanationLetter(explDu, 3, 0)).toBe('Đáp án đúng là Du lịch.');

      const explEm = 'Đáp án đúng là Em bé.';
      expect(syncExplanationLetter(explEm, 4, 0)).toBe('Đáp án đúng là Em bé.');

      const explPhap = 'Đáp án đúng là Pháp.';
      expect(syncExplanationLetter(explPhap, 0, 2)).toBe('Đáp án đúng là Pháp.');
    });
  });

  // ===========================================================================
  // Section 5: Punctuation Patterns & Missing Coverage
  // ===========================================================================
  describe('5. Punctuation patterns & missed synchronization', () => {
    it('5.1: Non-standard punctuation formats are ignored by syncExplanationLetter', () => {
      // 1. "A: đúng" - Missing prefix, colon after letter
      const expl1 = 'A: đúng, vì ngữ cảnh rõ ràng.';
      expect(syncExplanationLetter(expl1, 0, 2)).toBe('A: đúng, vì ngữ cảnh rõ ràng.'); // UNCHANGED

      // 2. "(A) là đáp án" - Parentheses around letter
      const expl2 = '(A) là đáp án đúng.';
      expect(syncExplanationLetter(expl2, 0, 2)).toBe('(A) là đáp án đúng.'); // UNCHANGED

      // 3. "A. Đúng" - Period after letter
      const expl3 = 'A. Đúng ngữ pháp.';
      expect(syncExplanationLetter(expl3, 0, 2)).toBe('A. Đúng ngữ pháp.'); // UNCHANGED

      // 4. "Đáp án đúng là: (A)" - Parentheses after prefix
      const expl4 = 'Đáp án đúng là: (A)';
      expect(syncExplanationLetter(expl4, 0, 2)).toBe('Đáp án đúng là: (A)'); // UNCHANGED

      // 5. "[A] là phương án chính xác" - Square brackets
      const expl5 = '[A] là phương án chính xác';
      expect(syncExplanationLetter(expl5, 0, 2)).toBe('[A] là phương án chính xác'); // UNCHANGED
    });
  });

  // ===========================================================================
  // Section 6: Production Database Contamination & Hash Verification
  // ===========================================================================
  describe('6. Production Database Safety & Integrity Verification', () => {
    const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

    it('6.1: data/hsk_exam.db SHA-256 matches baseline DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(HSK_EXAM_DB_PATH))
        .digest('hex')
        .toUpperCase();
      expect(hash).toBe(EXPECTED_HASH);
    });

    it('6.2: Comprehensive forensic scan of all tables in data/qbank/qbank.db shows zero contamination', () => {
      expect(fs.existsSync(QBANK_DB_PATH)).toBe(true);
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        const tables = [
          'questions',
          'pending_questions',
          'exam_sessions',
          'qbank_tasks',
          'generation_runs',
          'generation_history',
          'exam_eligible_pool',
          'qb_questions',
          'qb_reports',
          'qb_sync_log',
          'qb_export_log',
        ];

        const testTokens = [
          '%pilot%',
          '%phase8%',
          '%shuffle%',
          '%adversarial%',
          '%hostile%',
          '%test_probe%',
          '%dirty%',
        ];

        for (const table of tables) {
          const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((c) => c.name);
          for (const token of testTokens) {
            // In exam_sessions, session_json legitimately records production "shuffled": false/true field
            const targetCols = table === 'exam_sessions' && token === '%shuffle%'
              ? cols.filter((c) => c !== 'session_json' && c !== 'score_result_json')
              : cols;
            const whereClause = targetCols.map((col) => `${col} LIKE ?`).join(' OR ');
            const query = `SELECT COUNT(1) as cnt FROM ${table} WHERE ${whereClause}`;
            const args = targetCols.map(() => token);
            const row = db.prepare(query).get(...args) as { cnt: number };
            expect(row.cnt).toBe(0);
          }
        }
      } finally {
        db.close();
      }
    });

    it('6.3: Strict baseline table invariants hold', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      try {
        // exam sessions
        const sessions = db.prepare('SELECT COUNT(1) as cnt FROM exam_sessions').get() as { cnt: number };
        expect(sessions.cnt).toBeGreaterThanOrEqual(1699);

        // approved active questions
        const approved = db.prepare("SELECT COUNT(1) as cnt FROM questions WHERE status = 'approved' AND is_active = 1").get() as { cnt: number };
        expect(approved.cnt).toBeGreaterThanOrEqual(89);

        // 0 pending in main questions table
        const pendingMain = db.prepare("SELECT COUNT(1) as cnt FROM questions WHERE status = 'pending'").get() as { cnt: number };
        expect(pendingMain.cnt).toBe(0);

        // staging pending_questions
        const pendingStaging = db.prepare('SELECT COUNT(1) as cnt FROM pending_questions').get() as { cnt: number };
        expect(pendingStaging.cnt).toBeGreaterThanOrEqual(111);

        // exam_eligible in pool
        const eligible = db.prepare('SELECT COUNT(1) as cnt FROM exam_eligible_pool WHERE exam_eligible = 1').get() as { cnt: number };
        expect(eligible.cnt).toBeGreaterThanOrEqual(0);

        // Timestamps invariant
        const qMax = db.prepare('SELECT MAX(updated_at) as max_up FROM questions').get() as { max_up: string };
        expect(typeof qMax.max_up).toBe('string');
        expect(qMax.max_up.length).toBeGreaterThan(0);

        const taskMax = db.prepare('SELECT MAX(updated_at) as max_up FROM qbank_tasks').get() as { max_up: string };
        expect(typeof taskMax.max_up).toBe('string');
        expect(taskMax.max_up.length).toBeGreaterThan(0);
      } finally {
        db.close();
      }
    });
  });
});
