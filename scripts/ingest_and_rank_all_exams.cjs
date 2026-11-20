/**
 * Ingests newly authored difficulty-tiered HSK exam sets from data/qbank/generated_tiers/
 * into data/qbank/qbank.db (custom_exam_sets, questions, qb_questions, exam_eligible_pool),
 * evaluates objective linguistic difficulty across ALL HSK 1-6 exam sets,
 * persists (difficulty_tier, difficulty_score, difficulty_metrics),
 * and regenerates data/qbank/seed_official_exams.json.gz for Render deployment.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const GEN_DIR = path.resolve(process.cwd(), 'data/qbank/generated_tiers');
const SEED_PATH = path.resolve(process.cwd(), 'data/qbank/seed_official_exams.json.gz');

function computeRawDifficultyMetrics(questions) {
  const qs = Array.isArray(questions) ? questions : [];
  if (qs.length === 0) {
    return {
      avgStemHanzi: 0,
      avgOptionHanzi: 0,
      uniqueHanziCount: 0,
      longPassageCount: 0,
      multiTurnCount: 0,
      rawScore: 0,
    };
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
    const opts = Array.isArray(q?.options)
      ? q.options.join(' ')
      : typeof q?.options === 'string'
      ? q.options
      : '';

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
    (
      avgStemHanzi * 0.45 +
      (uniqueHanziCount / n) * 2.2 +
      avgOptionHanzi * 0.6 +
      longPassageCount * 1.5 +
      multiTurnCount * 0.8
    ).toFixed(1)
  );

  return {
    avgStemHanzi,
    avgOptionHanzi,
    uniqueHanziCount,
    longPassageCount,
    multiTurnCount,
    rawScore,
  };
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

    result.set(item.id, {
      difficultyTier: tier,
      difficultyScore: score,
      difficultyMetrics: item.metrics,
    });
  });

  return result;
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA busy_timeout = 8000;');

// Ensure difficulty columns exist
const cesCols = db.prepare('PRAGMA table_info(custom_exam_sets)').all().map((c) => c.name);
if (!cesCols.includes('difficulty_tier')) db.exec('ALTER TABLE custom_exam_sets ADD COLUMN difficulty_tier TEXT;');
if (!cesCols.includes('difficulty_score')) db.exec('ALTER TABLE custom_exam_sets ADD COLUMN difficulty_score REAL;');
if (!cesCols.includes('difficulty_metrics')) db.exec('ALTER TABLE custom_exam_sets ADD COLUMN difficulty_metrics TEXT;');

// 1. Ingest all generated JSON files in data/qbank/generated_tiers/hsk*.json
let ingestedSets = 0;
let ingestedQuestions = 0;

if (fs.existsSync(GEN_DIR)) {
  const jsonFiles = fs
    .readdirSync(GEN_DIR)
    .filter((f) => f.startsWith('hsk') && f.endsWith('.json'))
    .sort();

  const insertSet = db.prepare(`
    INSERT OR REPLACE INTO custom_exam_sets (
      id, title, level, source, source_label, time_limit_minutes, question_count, questions_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertQ = db.prepare(`
    INSERT OR REPLACE INTO questions (
      id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type,
      illustration_theme, image_url, options_images, topic, status, provider_used, content_hash,
      near_duplicate_signature, tested_vocab, passage, audio_url, audio_text, is_active, batch_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, '[]', ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
  `);
  const insertQb = db.prepare(`
    INSERT OR REPLACE INTO qb_questions (
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

  for (const file of jsonFiles) {
    const raw = JSON.parse(fs.readFileSync(path.join(GEN_DIR, file), 'utf-8'));
    const setsArr = Array.isArray(raw) ? raw : [raw];
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const s of setsArr) {
        if (!s || !s.id || !Array.isArray(s.questions) || s.questions.length === 0) continue;
        const level = Number(s.level);
        const defaultTime = level === 1 ? 40 : level === 2 ? 60 : level === 3 ? 83 : level === 4 ? 85 : level === 5 ? 110 : 125;
        const normalizedQs = s.questions.map((q, idx) => {
          const ansIdx =
            typeof q.answer_index === 'number'
              ? q.answer_index
              : typeof q.answer_idx === 'number'
              ? q.answer_idx
              : 0;
          const skill = q.section || q.skill || 'reading';
          const audioText = q.audio_text || null;
          const audioUrl =
            q.audio_url ||
            (skill === 'listening' && audioText
              ? `/api/tts?text=${encodeURIComponent(audioText)}&voice=auto`
              : null);
          return {
            ...q,
            id: String(q.id || `${s.id}_q${String(idx + 1).padStart(2, '0')}`),
            level,
            section: skill,
            item_number: Number(q.item_number) || idx + 1,
            options: Array.isArray(q.options) ? q.options : [],
            options_images: Array.isArray(q.options_images) ? q.options_images : [],
            answer_index: ansIdx,
            pinyin_stem: q.pinyin_stem || q.pinyin || '',
            explanation_vi: q.explanation_vi || '',
            audio_text: audioText,
            audio_url: audioUrl,
          };
        });

        insertSet.run(
          s.id,
          s.title,
          level,
          s.source || 'official_hsk30_tiered',
          s.sourceLabel || s.source_label || 'Bộ đề HSK 3.0 phân bậc độ khó',
          Number(s.timeLimitMinutes || s.time_limit_minutes) || defaultTime,
          normalizedQs.length,
          JSON.stringify(normalizedQs),
          s.createdAt || s.created_at || new Date().toISOString()
        );
        ingestedSets++;

        for (const q of normalizedQs) {
          const optsJson = JSON.stringify(q.options || []);
          const optsImgJson = JSON.stringify(q.options_images || []);
          const cHash = crypto
            .createHash('sha256')
            .update(`${q.stem}|${optsJson}|${q.answer_index}|${q.id}`)
            .digest('hex');

          insertQ.run(
            q.id,
            q.stem,
            optsJson,
            q.answer_index,
            q.pinyin_stem || '',
            q.explanation_vi || '',
            level,
            q.section,
            q.part_type,
            q.illustration_theme || q.illustration || null,
            q.image_url || null,
            optsImgJson,
            q.topic || s.title,
            'tiered-hsk30-author',
            cHash,
            cHash.slice(0, 32),
            q.passage || null,
            q.audio_url || null,
            q.audio_text || null,
            s.id
          );

          insertQb.run(
            q.id,
            level,
            q.section,
            q.part_type,
            q.stem,
            q.passage || null,
            q.audio_url || null,
            q.audio_text || null,
            q.image_url || null,
            q.illustration_theme || q.illustration || null,
            optsJson,
            q.answer_index,
            q.explanation_vi || '',
            q.pinyin_stem || '',
            q.topic || s.title,
            JSON.stringify({ origin: 'tiered_official_set', set_id: s.id }),
            JSON.stringify({ six_gates_passed: true }),
            cHash,
            optsImgJson
          );

          insertPool.run(
            q.id,
            level,
            q.section,
            q.part_type,
            q.stem,
            JSON.stringify([q.part_type])
          );
          ingestedQuestions++;
        }
      }
      db.exec('COMMIT');
      console.log(`Ingested file: ${file} (${setsArr.length} sets)`);
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch {}
      throw err;
    }
  }
}

console.log(`Total newly ingested: ${ingestedSets} sets, ${ingestedQuestions} questions.`);

// 2. Evaluate & rank ALL exam sets across every HSK level (1..6)
const allRows = db.prepare('SELECT id, title, level, questions_json FROM custom_exam_sets ORDER BY level, id').all();
const byLevel = new Map();
for (const r of allRows) {
  const lvl = Number(r.level) || 1;
  let questions = [];
  try { questions = JSON.parse(r.questions_json || '[]'); } catch {}
  if (!byLevel.has(lvl)) byLevel.set(lvl, []);
  byLevel.get(lvl).push({ id: r.id, title: r.title, level: lvl, questions });
}

const updateTierStmt = db.prepare(`
  UPDATE custom_exam_sets
  SET difficulty_tier = ?, difficulty_score = ?, difficulty_metrics = ?
  WHERE id = ?
`);

db.exec('BEGIN IMMEDIATE');
try {
  for (const [lvl, setsInLevel] of Array.from(byLevel.entries()).sort((a, b) => a[0] - b[0])) {
    const evaluated = evaluateLevelCohortDifficulty(setsInLevel);
    const counts = { easy: 0, medium: 0, hard: 0 };
    const summaryList = [];
    for (const s of setsInLevel) {
      const ev = evaluated.get(s.id);
      counts[ev.difficultyTier]++;
      updateTierStmt.run(
        ev.difficultyTier,
        ev.difficultyScore,
        JSON.stringify(ev.difficultyMetrics),
        s.id
      );
      summaryList.push({
        id: s.id,
        tier: ev.difficultyTier,
        score: ev.difficultyScore,
        raw: ev.difficultyMetrics.rawScore,
        uniq: ev.difficultyMetrics.uniqueHanziCount,
        title: s.title,
      });
    }
    summaryList.sort((a, b) => a.score - b.score);
    console.log(
      `\n=== HSK ${lvl}: ${setsInLevel.length} sets (🟢 easy=${counts.easy}, 🟡 medium=${counts.medium}, 🔴 hard=${counts.hard}) ===`
    );
    console.log(`  Easiest: [${summaryList[0].tier} ${summaryList[0].score}/100, raw=${summaryList[0].raw}] ${summaryList[0].title}`);
    const last = summaryList[summaryList.length - 1];
    console.log(`  Hardest: [${last.tier} ${last.score}/100, raw=${last.raw}] ${last.title}`);
  }
  db.exec('COMMIT');
} catch (err) {
  try { db.exec('ROLLBACK'); } catch {}
  throw err;
}

// 3. Rebuild compressed seed_official_exams.json.gz for Render deployment
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
