import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { generateAccuratePinyin } from '../src/utils/pinyinEngine.js';
import { verifyQuestionVocab } from '../src/server/qbankCoverageEngine.js';
import { cleanChineseText } from '../src/server/llm/questionValidator.js';

const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
console.log(`[QBank Audit] Opening database at ${dbPath}...`);

const db = new DatabaseSync(dbPath);

interface QuestionRow {
  id: string;
  stem: string;
  options: string;
  answer_idx: number;
  pinyin: string | null;
  explanation_vi: string;
  level: number;
  skill: string;
  part_type: string;
  status: string;
  rejection_note: string | null;
}

function runAudit() {
  const pendingStmt = db.prepare('SELECT id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, rejection_note FROM pending_questions');
  const allPending = pendingStmt.all() as unknown as QuestionRow[];
  
  console.log(`[QBank Audit] Total pending_questions found: ${allPending.length}`);

  const updatePinyinStmt = db.prepare('UPDATE pending_questions SET pinyin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const rejectStmt = db.prepare("UPDATE pending_questions SET status = 'rejected', rejection_note = ?, pinyin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");

  let pinyinFixedCount = 0;
  let newlyRejectedCount = 0;
  const rejectReasons: Record<string, number> = {};
  const levelStats: Record<number, { total: number; pending: number; rejected: number; approved: number }> = {
    1: { total: 0, pending: 0, rejected: 0, approved: 0 },
    2: { total: 0, pending: 0, rejected: 0, approved: 0 },
    3: { total: 0, pending: 0, rejected: 0, approved: 0 },
    4: { total: 0, pending: 0, rejected: 0, approved: 0 },
    5: { total: 0, pending: 0, rejected: 0, approved: 0 },
    6: { total: 0, pending: 0, rejected: 0, approved: 0 },
  };

  const blankPattern = /(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;

  for (const row of allPending) {
    const lvl = row.level >= 1 && row.level <= 6 ? row.level : 1;
    if (!levelStats[lvl]) {
      levelStats[lvl] = { total: 0, pending: 0, rejected: 0, approved: 0 };
    }
    levelStats[lvl].total++;

    let parsedOptions: string[] = [];
    try {
      parsedOptions = JSON.parse(row.options || '[]');
    } catch {
      parsedOptions = [];
    }

    // 1. Pinyin standardization using deterministic GB/T 16159-2012 pinyin-pro engine
    const accuratePinyin = generateAccuratePinyin(row.stem);
    if (!row.pinyin || row.pinyin.trim() !== accuratePinyin.trim()) {
      pinyinFixedCount++;
    }

    // 2. Strict Quality & Contract Audits
    let rejectReason: string | null = null;

    const isListening = row.skill === 'listening' || (row.part_type && row.part_type.startsWith('listen_'));
    const hasBlank = blankPattern.test(row.stem);

    // Check A: Listening questions must never have fill-in-the-blank placeholders
    if (isListening && hasBlank) {
      rejectReason = `[Audit Vi phạm Cấu trúc Nghe] Dạng bài nghe '${row.part_type}' chứa chỗ trống (____). Đề thi nghe phải là hội thoại hoặc đoạn văn hoàn chỉnh kèm câu hỏi.`;
    }

    // Check B: Dialogue listening questions must have speaker turns
    if (!rejectReason && isListening && row.part_type.includes('dialogue')) {
      const hasSpeakerTurn = /(?:^|\n|\s)(?:男|女|甲|乙|A|B)\s*[:：]/.test(row.stem);
      if (!hasSpeakerTurn) {
        rejectReason = `[Audit Vi phạm Đối thoại] Dạng bài nghe đối thoại '${row.part_type}' thiếu lượt thoại nhân vật (男/女/甲/乙...).`;
      }
    }

    // Check C: Monologue listening questions length and question prompt
    if (!rejectReason && (row.part_type === 'listen_talks_qa_4opt' || row.part_type === 'listen_monologue_qa_3opt')) {
      const cleanStem = cleanChineseText(row.stem);
      const minLen = row.part_type === 'listen_talks_qa_4opt' ? (row.level >= 6 ? 90 : 70) : 40;
      if (cleanStem.length < minLen) {
        rejectReason = `[Audit Vi phạm Độ dài Bài nói] Dạng bài '${row.part_type}' quá ngắn (${cleanStem.length} chữ, yêu cầu >= ${minLen} chữ cho HSK ${row.level}).`;
      } else if (!/问[：:]|[？?]/.test(row.stem)) {
        rejectReason = `[Audit Thiếu Câu hỏi Bài nói] Dạng bài '${row.part_type}' thiếu câu hỏi chốt ("问：...").`;
      }
    }

    // Check D: Minimum Level Difficulty Floor for advanced levels
    if (!rejectReason) {
      const verified = verifyQuestionVocab({
        stem: row.stem,
        options: parsedOptions,
        answer_idx: row.answer_idx,
        part_type: row.part_type,
      }, row.level);

      const cleanStem = cleanChineseText(row.stem);

      if (row.level === 6) {
        const maxLvl = verified.maxWordLevel ?? 1;
        if (maxLvl < 6 && cleanStem.length < 80) {
          rejectReason = `[Audit Vi phạm Chuẩn cấp độ HSK 6] Câu hỏi chỉ chứa từ vựng HSK 1–${maxLvl} (sơ/trung cấp), stem ngắn (${cleanStem.length} chữ), không đạt độ khó HSK 6 thực tế.`;
        }
      } else if (row.level === 5) {
        const maxLvl = verified.maxWordLevel ?? 1;
        if (maxLvl < 5 && cleanStem.length < 50) {
          rejectReason = `[Audit Vi phạm Chuẩn cấp độ HSK 5] Câu hỏi chỉ chứa từ vựng HSK 1–${maxLvl}, stem ngắn (${cleanStem.length} chữ), không đạt độ khó HSK 5 thực tế.`;
        }
      }
    }

    // Check E: Specific target pend_6_1793603776618_18c0d1
    if (row.id === 'pend_6_1793603776618_18c0d1') {
      console.log(`[Target Audit] Question pend_6_1793603776618_18c0d1 detected! Stem: "${row.stem}", RejectReason: ${rejectReason}`);
    }

    // Apply update or rejection
    if (rejectReason) {
      if (row.status !== 'rejected') {
        newlyRejectedCount++;
      }
      const category = rejectReason.split(']')[0] + ']';
      rejectReasons[category] = (rejectReasons[category] || 0) + 1;
      rejectStmt.run(rejectReason, accuratePinyin, row.id);
      levelStats[lvl].rejected++;
    } else {
      updatePinyinStmt.run(accuratePinyin, row.id);
      if (row.status === 'approved') {
        levelStats[lvl].approved++;
      } else if (row.status === 'rejected') {
        levelStats[lvl].rejected++;
      } else {
        levelStats[lvl].pending++;
      }
    }
  }

  // 3. Also check and standardize 'questions' table (approved questions pool)
  const questionsStmt = db.prepare('SELECT id, stem, pinyin, level FROM questions');
  const allApproved = questionsStmt.all() as unknown as { id: string; stem: string; pinyin: string | null; level: number }[];
  console.log(`[QBank Audit] Total approved questions in 'questions' pool: ${allApproved.length}`);

  const updateApprovedPinyinStmt = db.prepare('UPDATE questions SET pinyin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  let approvedPinyinFixed = 0;
  for (const q of allApproved) {
    const accPinyin = generateAccuratePinyin(q.stem);
    if (!q.pinyin || q.pinyin.trim() !== accPinyin.trim()) {
      updateApprovedPinyinStmt.run(accPinyin, q.id);
      approvedPinyinFixed++;
    }
  }

  console.log('\n================ AUDIT & STANDARDIZATION SUMMARY ================');
  console.log(`Pinyin standardized across pending_questions: ${pinyinFixedCount}`);
  console.log(`Pinyin standardized across approved questions: ${approvedPinyinFixed}`);
  console.log(`Newly rejected malformed/under-level questions: ${newlyRejectedCount}`);
  console.log('\nBreakdown of Rejection Reasons:');
  for (const [k, v] of Object.entries(rejectReasons)) {
    console.log(` - ${k}: ${v} questions`);
  }
  console.log('\nStatistics by HSK Level in pending_questions:');
  for (let l = 1; l <= 6; l++) {
    const s = levelStats[l];
    console.log(` HSK ${l}: Total=${s.total} | Valid Pending=${s.pending} | Rejected=${s.rejected} | Approved=${s.approved}`);
  }
  console.log('=================================================================\n');
}

runAudit();
