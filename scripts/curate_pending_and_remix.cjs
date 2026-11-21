/**
 * 1. Strictly audits & filters all pending_questions (~7.5k) through 8 production quality gates:
 *    - Valid level (1-6) & official HSK 3.0 part_type
 *    - Clean Chinese stem, no test/junk/bracket leaks, level-appropriate length
 *    - Real Vietnamese explanation (>=25 Latin/VN chars, Hanzi ratio <= 45%, no Chinese-only header)
 *    - Valid non-duplicate options & answer_idx, no single-char vocab-injection bug
 *    - Real verified /uploads/ JPG files on disk for visual/picture-match questions
 *    - Near-duplicate 14-Hanzi opening deduplication against approved bank & within pending
 *    - Excludes unreliable local Ollama/Qwen generations
 * 2. Promotes all GOLD-PASSED questions into approved questions / qb_questions / exam_eligible_pool
 *    with balanced A/B/C/D option shuffling and clean /api/tts audio URLs for listening items.
 *    Marks defective pending items as rejected with exact rejection_note.
 * 3. Renames HSK 1 Set 01 cleanly (removes "(ChatGPT - 40 câu)").
 * 4. Assembles fresh Blueprint-Strict Remixed Official HSK 3.0 Exam Sets maximizing newly promoted gold questions.
 * 5. Re-evaluates objective difficulty scores (Easy → Medium → Hard) across ALL official exam sets
 *    and rebuilds data/qbank/seed_official_exams.json.gz for Render deployment.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const SEED_PATH = path.resolve(process.cwd(), 'data/qbank/seed_official_exams.json.gz');

const VALID_PART_TYPES = new Set([
  'listen_true_false_2opt', 'listen_picture_match_4opt', 'listen_dialogue_picture_match_6opt',
  'listen_dialogue_picture_match_split', 'listen_dialogue_qa_4opt', 'listen_monologue_qa_4opt',
  'listen_talks_qa_4opt', 'listen_question_answer_4opt',
  'read_true_false_2opt', 'read_sentence_picture_match_4opt', 'read_sentence_picture_match_6opt',
  'read_dialogue_matching_6opt', 'read_dialogue_matching_split', 'read_sentence_matching_split',
  'read_fill_blank_4opt', 'read_fill_blank_word_bank_6opt', 'read_fill_blank_word_bank_split',
  'read_comprehension_4opt', 'read_comprehension_passages_4opt', 'read_comprehension_long_articles_4opt',
  'read_cloze_passage_sentence_insertion', 'read_cloze_passages_4opt', 'read_paragraph_sentence_ordering',
  'read_find_faulty_sentence_4opt',
  'write_component_assembly_6opt', 'write_sentence_reorder_4opt', 'write_tianzige_from_pinyin',
  'write_sentence_from_picture_word', 'write_short_essay_80chars', 'write_summary_shortening_400chars',
  'write_topic_essay_300chars',
]);

const OPEN_WRITING_TYPES = new Set([
  'write_short_essay_80chars',
  'write_summary_shortening_400chars',
  'write_topic_essay_300chars',
  'write_sentence_from_picture_word',
]);

const SINGLE_IMG_TYPES = new Set([
  'listen_true_false_2opt',
  'read_true_false_2opt',
  'write_sentence_from_picture_word',
]);

const MAX_HANZI_BY_LEVEL = {
  1: 75,
  2: 120,
  3: 240,
  4: 420,
  5: 650,
  6: 1400,
};

function extractHanzi(str) {
  return (String(str || '').match(/[\u4e00-\u9fff]/g) || []).join('');
}

function deterministicShuffleIndices(seed, len) {
  const arr = Array.from({ length: len }, (_, i) => i);
  const hash = crypto.createHash('md5').update(seed).digest();
  for (let i = len - 1; i > 0; i--) {
    const j = hash[i % hash.length] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function extractCleanAudioText(stem) {
  const s = String(stem || '').trim();
  const before = s.split(/(?:[\r\n\s]+|^)(?:问|Question|★)\s*[:：]?/i)[0].trim();
  return before || s;
}

function computeRawDifficultyMetrics(questions) {
  const qs = Array.isArray(questions) ? questions : [];
  if (qs.length === 0) {
    return { avgStemHanzi: 0, avgOptionHanzi: 0, uniqueHanziCount: 0, longPassageCount: 0, multiTurnCount: 0, rawScore: 0 };
  }
  let totalStemHanzi = 0;
  let totalOptionHanzi = 0;
  let longPassageCount = 0;
  let multiTurnCount = 0;
  const uniqueChars = new Set();

  for (const q of qs) {
    const stem = String(q?.stem || '');
    const audioText = String(q?.audio_text || '');
    const passage = String(q?.passage || '');
    const combinedPrompt =
      audioText && !stem.includes(audioText.slice(0, 16)) ? `${audioText} ${stem}` : stem || audioText;
    const opts = Array.isArray(q?.options) ? q.options.join(' ') : typeof q?.options === 'string' ? q.options : '';

    const stemHanzi = combinedPrompt.match(/[\u4e00-\u9fff]/g) || [];
    const passageHanzi = passage.match(/[\u4e00-\u9fff]/g) || [];
    const optHanzi = opts.match(/[\u4e00-\u9fff]/g) || [];

    const promptLen = stemHanzi.length + passageHanzi.length;
    totalStemHanzi += promptLen;
    totalOptionHanzi += optHanzi.length;
    for (const ch of stemHanzi) uniqueChars.add(ch);
    for (const ch of passageHanzi) uniqueChars.add(ch);
    for (const ch of optHanzi) uniqueChars.add(ch);

    const turns = (combinedPrompt.match(/(?:男|女|甲|乙)\s*[:：]/g) || []).length;
    if (turns >= 3) multiTurnCount++;
    if (promptLen >= 145) longPassageCount++;
  }

  const n = qs.length;
  const avgStemHanzi = Number((totalStemHanzi / n).toFixed(1));
  const avgOptionHanzi = Number((totalOptionHanzi / n).toFixed(1));
  const uniqueHanziCount = uniqueChars.size;
  const rawScore = Number(
    (avgStemHanzi * 0.45 + (uniqueHanziCount / n) * 2.2 + avgOptionHanzi * 0.6 + longPassageCount * 1.5 + multiTurnCount * 0.8).toFixed(1)
  );
  return { avgStemHanzi, avgOptionHanzi, uniqueHanziCount, longPassageCount, multiTurnCount, rawScore };
}

function evaluateLevelCohortDifficulty(setsInLevel) {
  const result = new Map();
  if (!setsInLevel.length) return result;
  const measured = setsInLevel.map((s) => ({
    id: s.id,
    level: s.level,
    metrics: computeRawDifficultyMetrics(s.questions),
  }));
  measured.sort((a, b) => a.metrics.rawScore - b.metrics.rawScore || a.id.localeCompare(b.id));

  const n = measured.length;
  const minRaw = measured[0].metrics.rawScore;
  const maxRaw = measured[n - 1].metrics.rawScore;
  const rawSpan = Math.max(1, maxRaw - minRaw);

  const easyCount = n <= 2 ? 1 : Math.max(1, Math.round(n * 0.34));
  const hardCount = n <= 2 ? (n === 2 ? 1 : 0) : Math.max(1, Math.round(n * 0.30));
  const mediumEndIdx = Math.max(easyCount, n - hardCount);

  measured.forEach((item, idx) => {
    let tier = 'medium';
    if (idx < easyCount) tier = 'easy';
    else if (idx >= mediumEndIdx) tier = 'hard';
    const rawPct = n > 1 ? (item.metrics.rawScore - minRaw) / rawSpan : 0.5;
    const rankPct = n > 1 ? idx / (n - 1) : 0.5;
    const blended = rawPct * 0.65 + rankPct * 0.35;
    const score = Math.max(12, Math.min(96, Math.round(blended * 80 + 14)));
    result.set(item.id, { difficultyTier: tier, difficultyScore: score, difficultyMetrics: item.metrics });
  });
  return result;
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA busy_timeout = 8000;');

// =========================================================================
// STEP 1: STRICT 8-GATE CURATION OF ALL PENDING QUESTIONS
// =========================================================================
const approvedRows = db.prepare(`SELECT id, level, part_type, stem FROM questions WHERE status='approved'`).all();
const approvedExactStems = new Set(approvedRows.map((r) => `${r.level}|${String(r.stem || '').replace(/\s+/g, '')}`));
const approvedPrefixCounts = new Map();
for (const r of approvedRows) {
  const hz = extractHanzi(r.stem);
  if (hz.length >= 14) {
    const pk = `${r.level}|${r.part_type}|${hz.slice(0, 14)}`;
    approvedPrefixCounts.set(pk, (approvedPrefixCounts.get(pk) || 0) + 1);
  }
}

const pendingRows = db.prepare(`SELECT * FROM pending_questions WHERE status='pending' ORDER BY id ASC`).all();
const promoted = [];
const rejected = [];
const rejectCounts = {};
const seenExact = new Set();
const seenPrefixCounts = new Map();

function reject(row, reason) {
  rejected.push({ id: row.id, reason });
  rejectCounts[reason] = (rejectCounts[reason] || 0) + 1;
}

for (const q of pendingRows) {
  const prov = String(q.provider_used || 'unknown');
  const lvl = Number(q.level);
  const pt = String(q.part_type || '').trim();
  const stem = String(q.stem || '').trim();
  const exp = String(q.explanation_vi || '').trim();

  if (!Number.isInteger(lvl) || lvl < 1 || lvl > 6) { reject(q, 'bad_level'); continue; }
  if (prov.includes('ollama') || prov.includes('qwen')) { reject(q, 'unreliable_local_ollama_model'); continue; }
  if (!VALID_PART_TYPES.has(pt)) { reject(q, 'nonstandard_part_type'); continue; }
  if (/e2e|test|mock|dummy|placeholder|lorem|fuzz/i.test(`${q.id} ${stem} ${q.batch_id || ''}`)) { reject(q, 'test_or_junk'); continue; }
  if (/\[[\u4e00-\u9fff]+\]/.test(stem)) { reject(q, 'bracket_leak_in_stem'); continue; }

  const stemHz = extractHanzi(stem);
  if (stemHz.length < 4) { reject(q, 'too_few_hanzi'); continue; }
  if (stemHz.length > (MAX_HANZI_BY_LEVEL[lvl] || 600)) { reject(q, 'level_length_mismatch'); continue; }

  // Strict Vietnamese explanation validation
  const expHz = extractHanzi(exp).length;
  const expVi = (exp.match(/[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi) || []).length;
  if (exp.length < 25 || expVi < 25 || expHz > expVi * 0.45 || /^解释摘要|^解析[：:]/.test(exp)) {
    reject(q, 'non_vi_or_short_explanation');
    continue;
  }

  let opts = [];
  try { opts = JSON.parse(q.options || '[]'); } catch { reject(q, 'bad_options_json'); continue; }
  const isOpen = OPEN_WRITING_TYPES.has(pt);
  const isFill = pt.includes('fill_blank') || pt.includes('cloze');
  const isPicMatch = pt.includes('picture_match');
  const isSingleImg = SINGLE_IMG_TYPES.has(pt);

  let ansIdx = Number(q.answer_idx);
  if (!isOpen) {
    if (!Array.isArray(opts) || opts.length < 2) { reject(q, 'missing_options'); continue; }
    const cleanOpts = opts.map((o) => String(o || '').trim());
    if (cleanOpts.some((o) => !o) || new Set(cleanOpts).size < cleanOpts.length) { reject(q, 'duplicate_or_empty_options'); continue; }
    if (!Number.isInteger(ansIdx) || ansIdx < 0 || ansIdx >= cleanOpts.length) { reject(q, 'bad_answer_idx'); continue; }
    if ((pt.includes('comprehension') || pt.includes('qa_4opt') || pt.includes('talks_qa')) && cleanOpts[ansIdx].length === 1 && !stem.includes('___')) {
      reject(q, 'single_char_vocab_injection_bug');
      continue;
    }
    opts = cleanOpts;
  } else {
    ansIdx = 0;
  }

  if (isFill && !/_{2,}|（\s*）|\(\s*\)|\[?\s*空\s*\]?/.test(stem + ' ' + String(q.passage || ''))) {
    reject(q, 'fill_blank_missing_blank');
    continue;
  }

  let optsImages = [];
  try { optsImages = JSON.parse(q.options_images || '[]'); } catch { optsImages = []; }
  if (isPicMatch) {
    const okImgs =
      Array.isArray(optsImages) &&
      optsImages.length === opts.length &&
      optsImages.every((u) => typeof u === 'string' && u.startsWith('/uploads/') && fs.existsSync(path.join('d:/minnese/public', u)));
    if (!okImgs) { reject(q, 'pic_match_missing_real_images'); continue; }
  }
  if (isSingleImg) {
    const imgU = String(q.image_url || '');
    if (!imgU.startsWith('/uploads/') || !fs.existsSync(path.join('d:/minnese/public', imgU))) {
      reject(q, 'single_img_missing_real_file');
      continue;
    }
  }

  const skill = pt.startsWith('listen_') ? 'listening' : pt.startsWith('write_') ? 'writing' : 'reading';
  if (skill === 'listening' && stemHz.length < 12) { reject(q, 'listening_too_short'); continue; }
  if (pt === 'listen_dialogue_qa_4opt' && !(stem.includes('男') && stem.includes('女'))) { reject(q, 'dialogue_missing_mf'); continue; }

  // Deduplication (exact + near-duplicate 14-Hanzi opening limit <= 1 per level+part_type)
  const exactKey = `${lvl}|${stem.replace(/\s+/g, '')}`;
  if (approvedExactStems.has(exactKey) || seenExact.has(exactKey)) {
    reject(q, 'duplicate_stem');
    continue;
  }
  if (stemHz.length >= 14) {
    const pk = `${lvl}|${pt}|${stemHz.slice(0, 14)}`;
    const prevCount = (approvedPrefixCounts.get(pk) || 0) + (seenPrefixCounts.get(pk) || 0);
    if (prevCount >= 1) {
      reject(q, 'near_duplicate_opening_template');
      continue;
    }
    seenPrefixCounts.set(pk, (seenPrefixCounts.get(pk) || 0) + 1);
  }
  seenExact.add(exactKey);

  // Shuffle MCQ options cleanly so A/B/C/D answers are balanced (only if explanation doesn't hardcode letter A/B/C/D and not true/false)
  const hasHardcodedLetter = /(?:Đáp án|Phương án|Chọn)\s+[A-F]\b/i.test(exp) || /^[A-F]\s*[:：]/m.test(exp);
  if (!isOpen && !isPicMatch && opts.length >= 4 && !hasHardcodedLetter && !pt.includes('true_false')) {
    const perm = deterministicShuffleIndices(q.id, opts.length);
    const newOpts = perm.map((oldIdx) => opts[oldIdx]);
    const newAnsIdx = perm.indexOf(ansIdx);
    opts = newOpts;
    ansIdx = newAnsIdx;
  }

  const audioText = skill === 'listening' ? (String(q.audio_text || '').trim() || extractCleanAudioText(stem)) : null;
  const audioUrl = skill === 'listening' && audioText ? `/api/tts?text=${encodeURIComponent(audioText)}&voice=auto` : null;

  promoted.push({
    ...q,
    level: lvl,
    skill,
    part_type: pt,
    stem,
    optionsArr: opts,
    optionsJson: JSON.stringify(opts),
    optionsImagesArr: Array.isArray(optsImages) ? optsImages : [],
    optionsImagesJson: JSON.stringify(Array.isArray(optsImages) ? optsImages : []),
    answer_idx: ansIdx,
    explanation_vi: exp,
    audio_text: audioText,
    audio_url: audioUrl,
  });
}

console.log('=== STEP 1: PENDING CURATION SUMMARY ===');
console.log(`Total pending audited : ${pendingRows.length}`);
console.log(`GOLD PASSED (promoted): ${promoted.length}`);
console.log(`REJECTED (defective)  : ${rejected.length}`);
console.log('Reject breakdown:', JSON.stringify(rejectCounts, null, 2));

const promotedByLvlSkill = {};
for (const p of promoted) {
  const k = `HSK ${p.level} | ${p.skill}`;
  promotedByLvlSkill[k] = (promotedByLvlSkill[k] || 0) + 1;
}
console.log('Promoted by Level & Skill:', promotedByLvlSkill);

// Persist promotions & rejections atomically into SQLite
const insertQ = db.prepare(`
  INSERT OR IGNORE INTO questions (
    id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
    illustration_theme, image_url, options_images, topic, status, provider_used, content_hash,
    near_duplicate_signature, tested_vocab, passage, audio_url, audio_text, is_active, batch_id,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, '[]', ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
`);
const insertQb = db.prepare(`
  INSERT OR IGNORE INTO qb_questions (
    question_id, level, skill, part_type, stem, passage, audio_url, audio_text,
    image_url, illustration_theme, options, answer_index, explanation_vi, pinyin_stem,
    topic, status, provenance, qa, content_hash, vocab_tags, options_images
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, '[]', ?)
`);
const insertPool = db.prepare(`
  INSERT OR REPLACE INTO exam_eligible_pool (
    question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, ineligible_reasons
  ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, '[]')
`);
const markPendingApproved = db.prepare(`UPDATE pending_questions SET status='approved', updated_at=datetime('now') WHERE id=?`);
const markPendingRejected = db.prepare(`UPDATE pending_questions SET status='rejected', rejection_note=?, updated_at=datetime('now') WHERE id=?`);

db.exec('BEGIN IMMEDIATE');
try {
  for (const p of promoted) {
    const cHash = crypto.createHash('sha256').update(`${p.stem}|${p.optionsJson}|${p.answer_idx}|${p.id}`).digest('hex');
    insertQ.run(
      p.id, p.stem, p.optionsJson, p.answer_idx, p.pinyin || '', p.explanation_vi,
      p.level, p.skill, p.part_type, p.illustration_theme || null, p.image_url || null,
      p.optionsImagesJson, p.topic || '', p.provider_used || 'curated-gold', cHash, cHash.slice(0, 32),
      p.passage || null, p.audio_url, p.audio_text, p.batch_id || 'curated_gold_7500'
    );
    insertQb.run(
      p.id, p.level, p.skill, p.part_type, p.stem, p.passage || null, p.audio_url, p.audio_text,
      p.image_url || null, p.illustration_theme || null, p.optionsJson, p.answer_idx,
      p.explanation_vi, p.pinyin || '', p.topic || '',
      JSON.stringify({ origin: 'curated_pending_gold', provider: p.provider_used }),
      JSON.stringify({ six_gates_passed: true }),
      cHash, p.optionsImagesJson
    );
    insertPool.run(p.id, p.level, p.skill, p.part_type, p.stem, JSON.stringify([p.part_type]));
    markPendingApproved.run(p.id);
  }
  for (const r of rejected) {
    markPendingRejected.run(`Auto-filtered: ${r.reason}`, r.id);
  }
  // Also sync any single approved question missing from qb_questions
  db.exec(`
    INSERT OR IGNORE INTO qb_questions (
      question_id, level, skill, part_type, stem, passage, audio_url, audio_text,
      image_url, illustration_theme, options, answer_index, explanation_vi, pinyin_stem,
      topic, status, provenance, qa, content_hash, vocab_tags, options_images
    )
    SELECT id, level, skill, part_type, stem, passage, audio_url, audio_text,
           image_url, illustration_theme, options, answer_idx, explanation_vi, COALESCE(pinyin,''),
           COALESCE(topic,''), 'approved', '{"origin":"sync"}', '{"six_gates_passed":true}',
           content_hash, '[]', COALESCE(options_images,'[]')
    FROM questions WHERE status='approved' AND is_active=1
  `);

  // Step 2: Cleanly rename HSK 1 Set 01 (remove internal "(ChatGPT - 40 câu)")
  db.prepare(`
    UPDATE custom_exam_sets
    SET title = 'Đề Thi Thử HSK 1 (3.0) — Đề số 01 (Giao tiếp cơ bản - 40 câu)',
        source_label = 'Bộ đề chuẩn HSK 3.0'
    WHERE id = 'custom_exam_chatgpt_hsk1_40q'
  `).run();

  db.exec('COMMIT');
} catch (err) {
  try { db.exec('ROLLBACK'); } catch {}
  throw err;
}

// =========================================================================
// STEP 3: ASSEMBLE FRESH REMIXED OFFICIAL EXAM SETS MAXIMIZING NEW GOLD QUESTIONS
// =========================================================================
const LEVEL_BLUEPRINTS = {
  1: {
    time: 40,
    count: 2,
    startNum: 11,
    slots: [
      ['listening', 'listen_true_false_2opt', 5],
      ['listening', 'listen_picture_match_4opt', 5],
      ['listening', 'listen_dialogue_picture_match_6opt', 5],
      ['listening', 'listen_dialogue_qa_4opt', 5],
      ['reading', 'read_true_false_2opt', 5],
      ['reading', 'read_sentence_picture_match_6opt', 5],
      ['reading', 'read_dialogue_matching_6opt', 5],
      ['reading', 'read_comprehension_4opt', 5],
    ],
  },
  2: {
    time: 60,
    count: 2,
    startNum: 21,
    slots: [
      ['listening', 'listen_picture_match_4opt', 5],
      ['listening', 'listen_dialogue_picture_match_split', 10],
      ['listening', 'listen_dialogue_qa_4opt', 10],
      ['reading', 'read_sentence_picture_match_6opt', 5],
      ['reading', 'read_dialogue_matching_split', 10],
      ['reading', 'read_fill_blank_word_bank_6opt', 5],
      ['reading', 'read_comprehension_4opt', 5],
      ['writing', 'write_component_assembly_6opt', 10],
    ],
  },
  3: {
    time: 83,
    count: 2,
    startNum: 23,
    slots: [
      ['listening', 'listen_dialogue_picture_match_split', 10],
      ['listening', 'listen_dialogue_qa_4opt', 10],
      ['listening', 'listen_talks_qa_4opt', 10],
      ['reading', 'read_sentence_matching_split', 10],
      ['reading', 'read_fill_blank_word_bank_split', 10],
      ['reading', 'read_comprehension_4opt', 10],
      ['writing', 'write_sentence_reorder_4opt', 5],
      ['writing', 'write_tianzige_from_pinyin', 5],
    ],
  },
  4: {
    time: 85,
    count: 3,
    startNum: 23,
    slots: [
      ['listening', 'listen_dialogue_qa_4opt', 14],
      ['listening', 'listen_talks_qa_4opt', 18],
      ['reading', 'read_fill_blank_word_bank_split', 10],
      ['reading', 'read_comprehension_passages_4opt', 15],
      ['reading', 'read_cloze_passage_sentence_insertion', 7],
      ['writing', 'write_sentence_reorder_4opt', 10],
      ['writing', 'write_sentence_from_picture_word', 5],
    ],
  },
  5: {
    time: 110,
    count: 2,
    startNum: 23,
    slots: [
      ['listening', 'listen_dialogue_qa_4opt', 19],
      ['listening', 'listen_talks_qa_4opt', 16],
      ['reading', 'read_cloze_passages_4opt', 10],
      ['reading', 'read_paragraph_sentence_ordering', 10],
      ['reading', 'read_comprehension_long_articles_4opt', 15],
      ['writing', 'write_sentence_reorder_4opt', 8],
      ['writing', 'write_short_essay_80chars', 1],
      ['writing', 'write_sentence_from_picture_word', 1],
    ],
  },
  6: {
    time: 125,
    count: 2,
    startNum: 7,
    slots: [
      ['listening', 'listen_dialogue_qa_4opt', 20],
      ['listening', 'listen_talks_qa_4opt', 20],
      ['reading', 'read_find_faulty_sentence_4opt', 10],
      ['reading', 'read_cloze_passages_4opt', 10],
      ['reading', 'read_comprehension_long_articles_4opt', 20],
      ['writing', 'write_summary_shortening_400chars', 1],
      ['writing', 'write_topic_essay_300chars', 1],
    ],
  },
};

const promotedIdSet = new Set(promoted.map((p) => p.id));
const insertExamSetStmt = db.prepare(`
  INSERT OR REPLACE INTO custom_exam_sets (
    id, title, level, source, source_label, time_limit_minutes, question_count, questions_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let remixedSetsCreated = 0;
const usedAcrossRemixes = new Set();

db.exec('BEGIN IMMEDIATE');
try {
  for (const lvl of [1, 2, 3, 4, 5, 6]) {
    const cfg = LEVEL_BLUEPRINTS[lvl];
    const poolRows = db
      .prepare(`SELECT * FROM questions WHERE status='approved' AND is_active=1 AND level=?`)
      .all(lvl);

    const byPart = new Map();
    for (const r of poolRows) {
      if (!byPart.has(r.part_type)) byPart.set(r.part_type, []);
      byPart.get(r.part_type).push(r);
    }

    for (let sIdx = 0; sIdx < cfg.count; sIdx++) {
      const setNum = cfg.startNum + sIdx;
      const setNumStr = String(setNum).padStart(2, '0');
      const assembled = [];
      const usedInThisSet = new Set();
      let newGoldCount = 0;

      for (const [skill, pt, needed] of cfg.slots) {
        const candidates = [...(byPart.get(pt) || [])];
        // Priority 1: newly promoted gold questions not yet used in any remix
        // Priority 2: existing bank questions not yet used in any remix
        // Deterministic spread by set index so each remixed set is distinct
        candidates.sort((a, b) => {
          const aNew = promotedIdSet.has(a.id) ? 0 : 1;
          const bNew = promotedIdSet.has(b.id) ? 0 : 1;
          if (aNew !== bNew) return aNew - bNew;
          const aUsed = usedAcrossRemixes.has(a.id) ? 1 : 0;
          const bUsed = usedAcrossRemixes.has(b.id) ? 1 : 0;
          if (aUsed !== bUsed) return aUsed - bUsed;
          const ha = crypto.createHash('md5').update(`${lvl}_${setNum}_${a.id}`).digest('hex');
          const hb = crypto.createHash('md5').update(`${lvl}_${setNum}_${b.id}`).digest('hex');
          return ha.localeCompare(hb);
        });

        let picked = 0;
        for (const c of candidates) {
          if (picked >= needed) break;
          if (usedInThisSet.has(c.id)) continue;
          usedInThisSet.add(c.id);
          usedAcrossRemixes.add(c.id);
          if (promotedIdSet.has(c.id)) newGoldCount++;

          let opts = [];
          let optsImg = [];
          try { opts = JSON.parse(c.options || '[]'); } catch {}
          try { optsImg = JSON.parse(c.options_images || '[]'); } catch {}
          const audioText = skill === 'listening' ? (c.audio_text || extractCleanAudioText(c.stem)) : undefined;
          const audioUrl =
            skill === 'listening'
              ? c.audio_url || (audioText ? `/api/tts?text=${encodeURIComponent(audioText)}&voice=auto` : undefined)
              : undefined;

          assembled.push({
            id: c.id,
            level: lvl,
            section: skill,
            part_type: pt,
            item_number: assembled.length + 1,
            stem: c.stem,
            pinyin_stem: c.pinyin || '',
            passage: c.passage || undefined,
            options: opts,
            options_images: optsImg,
            image_url: c.image_url || undefined,
            illustration: c.illustration_theme || undefined,
            answer_index: Number(c.answer_idx) || 0,
            explanation_vi: c.explanation_vi || '',
            audio_text: audioText,
            audio_url: audioUrl,
          });
          picked++;
        }
      }

      const totalExpected = cfg.slots.reduce((acc, x) => acc + x[2], 0);
      if (assembled.length === totalExpected) {
        const setId = `custom_exam_hsk${lvl}_remix${setNumStr}_${assembled.length}q`;
        const title = `Đề Thi Thử HSK ${lvl} (3.0) — Đề số ${setNumStr} (Tổng hợp trộn chuẩn ngân hàng - ${assembled.length} câu)`;
        insertExamSetStmt.run(
          setId,
          title,
          lvl,
          'curated_bank_remix',
          'Đề trộn chuẩn từ ngân hàng QBank',
          cfg.time,
          assembled.length,
          JSON.stringify(assembled),
          new Date().toISOString()
        );
        remixedSetsCreated++;
        console.log(`  Created ${setId} (${assembled.length}q, includes ${newGoldCount} newly promoted gold questions)`);
      } else {
        console.log(`  Skipped HSK ${lvl} remix #${setNumStr}: got ${assembled.length}/${totalExpected}`);
      }
    }
  }
  db.exec('COMMIT');
} catch (err) {
  try { db.exec('ROLLBACK'); } catch {}
  throw err;
}

// =========================================================================
// STEP 4: RE-EVALUATE OBJECTIVE DIFFICULTY FOR ALL EXAM SETS & REBUILD SEED
// =========================================================================
const allExamRows = db.prepare('SELECT id, title, level, questions_json FROM custom_exam_sets ORDER BY level, id').all();
const byLevelSets = new Map();
for (const r of allExamRows) {
  const lvl = Number(r.level) || 1;
  let qs = [];
  try { qs = JSON.parse(r.questions_json || '[]'); } catch {}
  if (!byLevelSets.has(lvl)) byLevelSets.set(lvl, []);
  byLevelSets.get(lvl).push({ id: r.id, title: r.title, level: lvl, questions: qs });
}

const updateTierStmt = db.prepare(`
  UPDATE custom_exam_sets
  SET difficulty_tier = ?, difficulty_score = ?, difficulty_metrics = ?
  WHERE id = ?
`);

db.exec('BEGIN IMMEDIATE');
try {
  for (const [lvl, setsInLevel] of Array.from(byLevelSets.entries()).sort((a, b) => a[0] - b[0])) {
    const evaluated = evaluateLevelCohortDifficulty(setsInLevel);
    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const s of setsInLevel) {
      const ev = evaluated.get(s.id);
      counts[ev.difficultyTier]++;
      updateTierStmt.run(ev.difficultyTier, ev.difficultyScore, JSON.stringify(ev.difficultyMetrics), s.id);
    }
    console.log(`HSK ${lvl}: ${setsInLevel.length} total sets (🟢 easy=${counts.easy}, 🟡 medium=${counts.medium}, 🔴 hard=${counts.hard})`);
  }
  db.exec('COMMIT');
} catch (err) {
  try { db.exec('ROLLBACK'); } catch {}
  throw err;
}

const finalSkillCounts = db
  .prepare(`SELECT level, skill, COUNT(*) as c FROM questions WHERE status='approved' AND is_active=1 GROUP BY level, skill ORDER BY level, skill`)
  .all();
console.log('\n=== FINAL APPROVED SKILL BANK COUNTS ===');
for (const r of finalSkillCounts) {
  console.log(`  HSK ${r.level} | ${String(r.skill).padEnd(10)} : ${r.c}`);
}

const allSets = db
  .prepare(
    `SELECT id, title, level, source, source_label, time_limit_minutes, question_count, questions_json,
            difficulty_tier, difficulty_score, difficulty_metrics, created_at
     FROM custom_exam_sets ORDER BY level ASC, difficulty_score ASC, id ASC`
  )
  .all();
const allApprovedQs = db
  .prepare(
    `SELECT id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
            illustration_theme, image_url, options_images, topic, provider_used, content_hash,
            near_duplicate_signature, passage, audio_url, audio_text, batch_id
     FROM questions WHERE status = 'approved' AND is_active = 1`
  )
  .all();

const seedPayload = JSON.stringify({ sets: allSets, qs: allApprovedQs });
const gz = zlib.gzipSync(Buffer.from(seedPayload, 'utf-8'), { level: 9 });
fs.writeFileSync(SEED_PATH, gz);
console.log(
  `\nRebuilt seed_official_exams.json.gz: ${allSets.length} exam sets, ${allApprovedQs.length} approved questions (${(
    gz.length /
    (1024 * 1024)
  ).toFixed(2)} MB)`
);
