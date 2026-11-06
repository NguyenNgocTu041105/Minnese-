import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';

const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const db = new DatabaseSync(dbPath, { readOnly: true });

const rows = db.prepare(`
  SELECT *
  FROM questions
  WHERE status = 'approved' AND COALESCE(is_active, 1) = 1
  ORDER BY rowid ASC
`).all() as any[];

console.log(`Total approved active questions: ${rows.length}`);

let practiceEligibleCount = 0;
let examEligibleCount = 0;
let examIneligibleCount = 0;

const ineligibleList: any[] = [];
const eligibleList: any[] = [];

for (const q of rows) {
  const result = validateFormatCompatibility(q, q.level);

  const isApproved = (q.status || '').toLowerCase() === 'approved' && (q.is_active === undefined || q.is_active === null || Number(q.is_active) === 1);
  const practiceEligible = Boolean(isApproved && result.practice_eligible);
  const examEligible = Boolean(isApproved && result.exam_eligible);

  if (practiceEligible) {
    practiceEligibleCount++;
  }
  if (examEligible) {
    examEligibleCount++;
    eligibleList.push({ id: q.id, level: q.level, skill: q.skill, part_type: q.part_type });
  } else {
    examIneligibleCount++;
    ineligibleList.push({
      id: q.id,
      level: q.level,
      skill: q.skill,
      part_type: q.part_type,
      reasons: result.ineligible_reasons,
    });
  }
}

console.log(`\nSimulation Results across all ${rows.length} approved questions:`);
console.log(`- Practice Eligible: ${practiceEligibleCount}`);
console.log(`- Exam Eligible: ${examEligibleCount}`);
console.log(`- Exam Ineligible: ${examIneligibleCount}`);

console.log(`\nIneligible Questions Details (${ineligibleList.length}):`);
ineligibleList.forEach((item, idx) => {
  console.log(`[${idx + 1}] ID: ${item.id} | Level: ${item.level} | Skill: ${item.skill} | PartType: ${item.part_type}`);
  console.log(`    Reasons: ${JSON.stringify(item.reasons)}`);
});

// Also check current exam_eligible_pool in qbank.db
const poolRows = db.prepare(`
  SELECT practice_eligible, exam_eligible, COUNT(*) as c
  FROM exam_eligible_pool
  GROUP BY practice_eligible, exam_eligible
`).all();
console.log(`\nCurrent exam_eligible_pool table in qbank.db:`, poolRows);

// Check if pend_2_1793518492737_b06308 exists in questions
const targetQ = db.prepare(`SELECT * FROM questions WHERE id = 'pend_2_1793518492737_b06308'`).get() as any;
console.log(`\npend_2_1793518492737_b06308 in questions:`, targetQ ? {
  id: targetQ.id,
  level: targetQ.level,
  skill: targetQ.skill,
  part_type: targetQ.part_type,
  stem: targetQ.stem,
  status: targetQ.status,
  is_active: targetQ.is_active
} : 'NOT FOUND');

if (targetQ) {
  const targetRes = validateFormatCompatibility(targetQ, targetQ.level);
  console.log(`validateFormatCompatibility for pend_2_1793518492737_b06308:`, {
    practice_eligible: targetRes.practice_eligible,
    exam_eligible: targetRes.exam_eligible,
    reasons: targetRes.ineligible_reasons
  });
}

db.close();
