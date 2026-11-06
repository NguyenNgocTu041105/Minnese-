import { isOptionCountCompatible } from '../src/server/qbankFormatSync.js';

const requiredList = [0, 3, 4, 5, 6, 8];
const actualList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const partTypes = [
  'read_comprehension_4opt',
  'listen_dialogue_qa_3opt',
  'read_fill_blank_word_bank_6opt',
  'read_fill_blank_word_bank_split',
  'listen_dialogue_picture_match_6opt',
  'read_sentence_picture_match_6opt',
  'read_fill_blank_4opt',
  'fill_blank',
  'read_reorder_sentence',
  'read_paragraph_sentence_ordering',
  'write_short_essay_80chars',
  'write_component_assembly_6opt',
  'generic_reading_5opt',
  'generic_matching_8opt',
  ''
];

console.log('=== Permutation Stress Testing isOptionCountCompatible ===');
let totalTests = 0;
let trueCount = 0;
let falseCount = 0;

const anomalies: any[] = [];

for (const bpType of partTypes) {
  for (const req of requiredList) {
    for (const act of actualList) {
      totalTests++;
      const result = isOptionCountCompatible(bpType, req, act);
      if (result) trueCount++;
      else falseCount++;

      // Invariant checks:
      // 1. If req === 0, must be true iff act === 0 (unless reorder)
      if (req === 0) {
        if (!bpType.includes('reorder') && !bpType.includes('ordering')) {
          if (act === 0 && !result) {
            anomalies.push({ bpType, req, act, result, expected: true, reason: 'req 0, act 0 should be true' });
          }
          if (act !== 0 && result) {
            anomalies.push({ bpType, req, act, result, expected: false, reason: 'req 0, act > 0 should be false' });
          }
        }
      }

      // 2. Reordering should ALWAYS be true for any options count
      if (bpType.includes('reorder') || bpType.includes('ordering')) {
        if (!result) {
          anomalies.push({ bpType, req, act, result, expected: true, reason: 'reordering parts should always be true' });
        }
      }

      // 3. Exact match (req === act) should ALWAYS be true when req > 0
      if (req > 0 && req === act) {
        if (!result) {
          anomalies.push({ bpType, req, act, result, expected: true, reason: 'exact match should always be true' });
        }
      }

      // 4. req === 3: only act === 3 or act === 4 should be true (unless reorder)
      if (req === 3 && !bpType.includes('reorder') && !bpType.includes('ordering')) {
        if (act !== 3 && act !== 4 && result) {
          anomalies.push({ bpType, req, act, result, expected: false, reason: 'req 3 only allows act 3 or 4' });
        }
        if (act === 4 && !result) {
          anomalies.push({ bpType, req, act, result, expected: true, reason: 'req 3 act 4 pedagogical equivalence should be true' });
        }
      }

      // 5. req === 6:
      // if bpType includes picture/word_bank/fill_blank:
      // act === 6, 5, 4 are true. Other acts must be false.
      if (req === 6 && !bpType.includes('reorder') && !bpType.includes('ordering')) {
        const isFlexible6 = bpType.includes('picture') || bpType.includes('word_bank') || bpType.includes('fill_blank');
        if (isFlexible6) {
          if ((act === 4 || act === 5 || act === 6) && !result) {
            anomalies.push({ bpType, req, act, result, expected: true, reason: 'req 6 flexible part should allow 4, 5, 6' });
          }
          if (act !== 4 && act !== 5 && act !== 6 && result) {
            anomalies.push({ bpType, req, act, result, expected: false, reason: 'req 6 flexible part should not allow other than 4, 5, 6' });
          }
        } else {
          // Non-flexible 6 (e.g. write_component_assembly_6opt)
          if (act === 6 && !result) {
            anomalies.push({ bpType, req, act, result, expected: true, reason: 'non-flexible 6 should allow exact match 6' });
          }
          if (act !== 6 && result) {
            anomalies.push({ bpType, req, act, result, expected: false, reason: 'non-flexible 6 should reject non-6' });
          }
        }
      }

      // 6. req === 8:
      // Only act === 8 should be true (unless reorder)
      if (req === 8 && !bpType.includes('reorder') && !bpType.includes('ordering')) {
        if (act === 8 && !result) {
          anomalies.push({ bpType, req, act, result, expected: true, reason: 'req 8 exact match 8 should be true' });
        }
        if (act !== 8 && result) {
          anomalies.push({ bpType, req, act, result, expected: false, reason: 'req 8 non-8 should be false' });
        }
      }

      // 7. req === 5:
      // Only act === 5 should be true (unless reorder)
      if (req === 5 && !bpType.includes('reorder') && !bpType.includes('ordering')) {
        if (act === 5 && !result) {
          anomalies.push({ bpType, req, act, result, expected: true, reason: 'req 5 exact match 5 should be true' });
        }
        if (act !== 5 && result) {
          anomalies.push({ bpType, req, act, result, expected: false, reason: 'req 5 non-5 should be false' });
        }
      }
    }
  }
}

console.log(`Total permutation tests evaluated: ${totalTests}`);
console.log(`Compatible (true): ${trueCount}`);
console.log(`Incompatible (false): ${falseCount}`);
console.log(`Anomalies detected: ${anomalies.length}`);
if (anomalies.length > 0) {
  console.log('Anomalies:', anomalies);
} else {
  console.log('ALL INVARIANTS SATISFIED 100% across all 990 permutations!');
}
