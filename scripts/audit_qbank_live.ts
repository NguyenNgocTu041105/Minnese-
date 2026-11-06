import { DatabaseSync } from 'node:sqlite';
import { loadBlueprintData } from '../src/server/qbankFormatSync';

const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });

// 1. Level by level approved counts and practice vs exam eligible
const poolRows = db.prepare('SELECT * FROM exam_eligible_pool ORDER BY level, skill, part_type').all() as any[];

console.log('=== POOL TOTAL ROWS ===', poolRows.length);

const statsByLevel: Record<number, {
  approvedActive: number;
  practiceEligible: number;
  examEligible: number;
  byPartType: Record<string, { total: number; practice: number; exam: number; reasons: Set<string> }>;
}> = {};

for (let lvl = 1; lvl <= 6; lvl++) {
  statsByLevel[lvl] = { approvedActive: 0, practiceEligible: 0, examEligible: 0, byPartType: {} };
}

for (const row of poolRows) {
  const lvl = Number(row.level);
  if (!statsByLevel[lvl]) {
    statsByLevel[lvl] = { approvedActive: 0, practiceEligible: 0, examEligible: 0, byPartType: {} };
  }
  statsByLevel[lvl].approvedActive++;
  if (row.practice_eligible) statsByLevel[lvl].practiceEligible++;
  if (row.exam_eligible) statsByLevel[lvl].examEligible++;

  const pt = row.part_type || 'unknown';
  if (!statsByLevel[lvl].byPartType[pt]) {
    statsByLevel[lvl].byPartType[pt] = { total: 0, practice: 0, exam: 0, reasons: new Set() };
  }
  statsByLevel[lvl].byPartType[pt].total++;
  if (row.practice_eligible) statsByLevel[lvl].byPartType[pt].practice++;
  if (row.exam_eligible) statsByLevel[lvl].byPartType[pt].exam++;

  try {
    const reasons = JSON.parse(row.ineligible_reasons || '[]');
    for (const r of reasons) {
      statsByLevel[lvl].byPartType[pt].reasons.add(r);
    }
  } catch {}
}

console.log('=== LEVEL BREAKDOWN WITH BLUEPRINT REQUIREMENTS ===');
for (let lvl = 1; lvl <= 6; lvl++) {
  const bp = loadBlueprintData(lvl);
  const st = statsByLevel[lvl];
  const totalRequired = bp ? bp.total_questions : 0;
  const missing = totalRequired - st.examEligible;
  console.log(`\n================================================================`);
  console.log(`HSK ${lvl}: Total Required=${totalRequired}, Approved Active=${st.approvedActive}, Practice Eligible=${st.practiceEligible}, Exam Eligible=${st.examEligible}, Deficit=${missing}`);
  console.log(`================================================================`);
  
  // Section breakdown
  if (bp && bp.sections) {
    for (const [secKey, sec] of Object.entries(bp.sections) as any[]) {
      console.log(`\n  [Section] ${secKey.toUpperCase()} (Total Required: ${sec.total_questions}):`);
      for (const [pKey, p] of Object.entries(sec.parts) as any[]) {
        const pt = p.type || p.part_type;
        const ptStat = st.byPartType[pt] || { total: 0, practice: 0, exam: 0, reasons: new Set() };
        console.log(`    - Part ${pKey} (${pt}): req=${p.n_questions}, opt=${p.n_options}, avail_approved=${ptStat.total}, exam_eligible=${ptStat.exam}`);
        if (ptStat.reasons.size > 0) {
          console.log(`      Diagnostic reasons: ${Array.from(ptStat.reasons).join('; ')}`);
        }
      }
    }
  }

  // Any questions with part_type not in blueprint
  let notInBpFound = false;
  for (const [pt, ptStat] of Object.entries(st.byPartType)) {
    let inBp = false;
    if (bp && bp.sections) {
      for (const sec of Object.values(bp.sections) as any[]) {
        for (const p of Object.values(sec.parts) as any[]) {
          if (p.part_type === pt) inBp = true;
        }
      }
    }
    if (!inBp) {
      if (!notInBpFound) {
        console.log(`\n  [Part Types NOT matched to any blueprint section]:`);
        notInBpFound = true;
      }
      console.log(`    - ${pt}: count=${ptStat.total}, reasons: ${Array.from(ptStat.reasons).join('; ')}`);
    }
  }
}

// 2. Also examine the questions table directly to see what skills/part_types are present
console.log('\n=== DIRECT QUESTIONS TABLE SUMMARY BY LEVEL & SKILL ===');
const qSummary = db.prepare(`
  SELECT level, skill, part_type, COUNT(*) as cnt 
  FROM questions 
  WHERE status = 'approved' AND COALESCE(is_active, 1) = 1
  GROUP BY level, skill, part_type
  ORDER BY level, skill, part_type
`).all() as any[];

for (const row of qSummary) {
  console.log(`HSK ${row.level} | Skill: ${row.skill} | PartType: ${row.part_type} | Count: ${row.cnt}`);
}

db.close();
