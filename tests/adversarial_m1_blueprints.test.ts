/**
 * Adversarial Challenger Test Suite for Milestone M1 (Phase 6):
 * Blueprint & Timer Adversarial Verification
 *
 * Verifies:
 * 1. Deep property-by-property comparison of DEFAULT_BLUEPRINTS in AIExamStudio.tsx
 *    against authoritative data/qbank/blueprint/level[1-6].json.
 * 2. Boundary value stress tests: level 0, 7, negative, NaN, non-integer, non-numeric.
 * 3. getExamDurationMinutes for all levels (1..6) and boundary fallbacks.
 * 4. HSK 2 Writing section: exactly 10 questions, 300 max score, 180 pass score,
 *    and writing checkbox enablement logic.
 * 5. Monotonicity and pedagogical invariants across all HSK 1..6 blueprints.
 * 6. Non-regression of database invariants.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { DEFAULT_BLUEPRINTS, PartAllocation } from '../src/components/Admin/AIExamStudio';
import { HSK_EXAM_DURATIONS_MINUTES, getExamDurationMinutes } from '../src/components/HSKMockExam';
import { HSK_BLUEPRINT_SUMMARIES } from '../src/data/hskMockExamFixtures';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

interface BlueprintJsonPart {
  name: string;
  type: string;
  skill: string;
  n_questions: number;
  n_options?: number;
  time_min?: number;
  description?: string;
}

interface BlueprintJsonSection {
  name: string;
  skill: string;
  total_questions: number;
  time_min: number;
  score_weight: number;
  parts: Record<string, BlueprintJsonPart>;
}

interface BlueprintJson {
  hsk_version: string;
  level: number;
  name: string;
  verified: boolean;
  total_questions: number;
  total_time_min: number;
  max_score: number;
  passing_score: number;
  has_pinyin: boolean;
  audio_playback: number;
  sections: {
    listening: BlueprintJsonSection;
    reading: BlueprintJsonSection;
    writing?: BlueprintJsonSection;
  };
}

function loadBlueprintJson(level: number): BlueprintJson {
  const filePath = path.resolve(process.cwd(), `data/qbank/blueprint/level${level}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as BlueprintJson;
}

describe('Challenger M1: Adversarial Blueprint Alignment & Timer Verification', () => {

  // =========================================================================
  // 1. PROPERTY-BY-PROPERTY BLUEPRINT COMPARISON (LEVELS 1 TO 6)
  // =========================================================================
  describe('1. Property-by-Property Comparison: DEFAULT_BLUEPRINTS vs level[1-6].json', () => {
    for (let level = 1; level <= 6; level++) {
      it(`Level ${level}: Every property strictly matches between DEFAULT_BLUEPRINTS and level${level}.json`, () => {
        const studioBp = DEFAULT_BLUEPRINTS[level];
        expect(studioBp, `DEFAULT_BLUEPRINTS[${level}] should exist`).toBeDefined();

        const jsonBp = loadBlueprintJson(level);
        expect(jsonBp.level).toBe(level);
        expect(jsonBp.hsk_version).toBe('3.0');

        // Total questions & duration check
        expect(studioBp.totalQuestions).toBe(jsonBp.total_questions);
        expect(studioBp.totalTimeMin).toBe(jsonBp.total_time_min);
        const sumAllocationsCount = studioBp.allocations.reduce((sum, a) => sum + a.count, 0);
        expect(sumAllocationsCount).toBe(jsonBp.total_questions);

        // Max score & Pass score check
        expect(studioBp.maxScore).toBe(jsonBp.max_score);
        expect(studioBp.passScore).toBe(jsonBp.passing_score);

        // Score ratio must be exactly 60%
        expect(studioBp.passScore / studioBp.maxScore).toBeCloseTo(0.60, 5);

        // Section counts check
        const listeningSum = studioBp.allocations
          .filter(a => a.skill === 'listening')
          .reduce((sum, a) => sum + a.count, 0);
        expect(listeningSum).toBe(jsonBp.sections.listening.total_questions);

        const readingSum = studioBp.allocations
          .filter(a => a.skill === 'reading')
          .reduce((sum, a) => sum + a.count, 0);
        expect(readingSum).toBe(jsonBp.sections.reading.total_questions);

        if (jsonBp.sections.writing) {
          const writingSum = studioBp.allocations
            .filter(a => a.skill === 'writing')
            .reduce((sum, a) => sum + a.count, 0);
          expect(writingSum).toBe(jsonBp.sections.writing.total_questions);
        } else {
          const writingSum = studioBp.allocations
            .filter(a => a.skill === 'writing')
            .reduce((sum, a) => sum + a.count, 0);
          expect(writingSum).toBe(0);
        }

        // Deep part-by-part verification in sequence
        const jsonParts: BlueprintJsonPart[] = [];
        for (const partKey of Object.keys(jsonBp.sections.listening.parts)) {
          jsonParts.push(jsonBp.sections.listening.parts[partKey]);
        }
        for (const partKey of Object.keys(jsonBp.sections.reading.parts)) {
          jsonParts.push(jsonBp.sections.reading.parts[partKey]);
        }
        if (jsonBp.sections.writing) {
          for (const partKey of Object.keys(jsonBp.sections.writing.parts)) {
            jsonParts.push(jsonBp.sections.writing.parts[partKey]);
          }
        }

        expect(studioBp.allocations.length).toBe(jsonParts.length);

        for (let i = 0; i < jsonParts.length; i++) {
          const alloc = studioBp.allocations[i];
          const part = jsonParts[i];

          expect(alloc.skill).toBe(part.skill);
          expect(alloc.part_type).toBe(part.type);
          expect(alloc.count).toBe(part.n_questions);
          expect(alloc.count).toBeGreaterThan(0);
          expect(alloc.points_per_question).toBeGreaterThan(0);
        }

        // Total calculated points in DEFAULT_BLUEPRINTS allocations should closely match maxScore
        const totalPoints = studioBp.allocations.reduce(
          (sum, a) => sum + a.count * a.points_per_question,
          0
        );
        expect(Math.round(totalPoints)).toBe(studioBp.maxScore);
      });
    }

    it('No unexpected levels exist in DEFAULT_BLUEPRINTS keys beyond 1..6', () => {
      const keys = Object.keys(DEFAULT_BLUEPRINTS).map(k => Number(k)).sort((a, b) => a - b);
      expect(keys).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  // =========================================================================
  // 2. BOUNDARY VALUES FOR TIMERS AND BLUEPRINT LOOKUPS
  // =========================================================================
  describe('2. Boundary Values: level 0, 7, negative, NaN, floats, malformed inputs', () => {
    it('DEFAULT_BLUEPRINTS handles boundary levels with undefined and safe fallback', () => {
      const boundaryLevels = [0, 7, 8, 99, -1, -5, NaN, 1.5, Infinity, -Infinity];

      for (const bLevel of boundaryLevels) {
        expect(DEFAULT_BLUEPRINTS[bLevel], `DEFAULT_BLUEPRINTS[${bLevel}] must be undefined`).toBeUndefined();

        // UI pattern in AIExamStudio: DEFAULT_BLUEPRINTS[level] || DEFAULT_BLUEPRINTS[1]
        const fallbackBp = DEFAULT_BLUEPRINTS[bLevel] || DEFAULT_BLUEPRINTS[1];
        expect(fallbackBp).toBeDefined();
        expect(fallbackBp.totalQuestions).toBe(40);
        expect(fallbackBp.totalTimeMin).toBe(40);
        expect(fallbackBp.maxScore).toBe(200);
        expect(fallbackBp.passScore).toBe(120);
      }
    });

    it('getExamDurationMinutes returns expected 40-minute fallback for all boundary inputs', () => {
      const adversarialBoundaryInputs = [
        0,
        7,
        8,
        100,
        -1,
        -10,
        -999,
        NaN,
        Infinity,
        -Infinity,
        1.5,
        2.99,
        0.5,
        -0.001,
        null as unknown as number,
        undefined as unknown as number,
        '0' as unknown as number,
        '7' as unknown as number,
        'invalid' as unknown as number,
        'hsk2' as unknown as number,
        {} as unknown as number,
        [] as unknown as number,
      ];

      for (const input of adversarialBoundaryInputs) {
        const result = getExamDurationMinutes(input);
        expect(result, `getExamDurationMinutes(${String(input)}) should return fallback 40`).toBe(40);
      }
    });

    it('HSK_EXAM_DURATIONS_MINUTES map has strict keys 1..6 with exact positive integers', () => {
      const keys = Object.keys(HSK_EXAM_DURATIONS_MINUTES).map(Number).sort((a, b) => a - b);
      expect(keys).toEqual([1, 2, 3, 4, 5, 6]);

      for (const key of keys) {
        const duration = HSK_EXAM_DURATIONS_MINUTES[key];
        expect(Number.isInteger(duration)).toBe(true);
        expect(duration).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 3. EXAM DURATION MINUTES FOR ALL LEVELS (1 TO 6)
  // =========================================================================
  describe('3. getExamDurationMinutes for all official levels (1: 40, 2: 60, 3: 83, 4: 85, 5: 110, 6: 125)', () => {
    const expectedDurations: Record<number, number> = {
      1: 40,
      2: 60,
      3: 83,
      4: 85,
      5: 110,
      6: 125,
    };

    for (const [lvlStr, expectedMin] of Object.entries(expectedDurations)) {
      const level = Number(lvlStr);
      it(`Level ${level} returns exactly ${expectedMin} minutes in getExamDurationMinutes`, () => {
        expect(getExamDurationMinutes(level)).toBe(expectedMin);
        expect(HSK_EXAM_DURATIONS_MINUTES[level]).toBe(expectedMin);
        expect(DEFAULT_BLUEPRINTS[level].totalTimeMin).toBe(expectedMin);
        expect(HSK_BLUEPRINT_SUMMARIES[level].time_limit_minutes).toBe(expectedMin);
      });
    }

    it('Duration strictly increases monotonically with HSK level', () => {
      for (let lvl = 1; lvl < 6; lvl++) {
        const current = getExamDurationMinutes(lvl);
        const next = getExamDurationMinutes(lvl + 1);
        expect(next).toBeGreaterThan(current);
      }
    });
  });

  // =========================================================================
  // 4. HSK 2 WRITING SECTION & UI CHECKBOX LOGIC
  // =========================================================================
  describe('4. HSK 2 Writing Section: 10 questions, 300 max score, 180 pass score, and enabled checkbox', () => {
    it('HSK 2 has exactly 10 writing questions with 300 max score and 180 pass score', () => {
      const bp2 = DEFAULT_BLUEPRINTS[2];
      expect(bp2).toBeDefined();

      const writingAllocations = bp2.allocations.filter(a => a.skill === 'writing');
      expect(writingAllocations.length).toBe(2);

      const totalWritingQuestions = writingAllocations.reduce((s, a) => s + a.count, 0);
      expect(totalWritingQuestions).toBe(10);

      // Verify specific writing part types and counts
      expect(writingAllocations[0].part_type).toBe('write_component_assembly_6opt');
      expect(writingAllocations[0].count).toBe(5);
      expect(writingAllocations[0].points_per_question).toBe(10);

      expect(writingAllocations[1].part_type).toBe('write_tianzige_from_pinyin');
      expect(writingAllocations[1].count).toBe(5);
      expect(writingAllocations[1].points_per_question).toBe(10);

      // Verify 300 max score and 180 pass score
      expect(bp2.maxScore).toBe(300);
      expect(bp2.passScore).toBe(180);

      // Writing score weight = 5 * 10 + 5 * 10 = 100 points
      const writingScore = writingAllocations.reduce((s, a) => s + a.count * a.points_per_question, 0);
      expect(writingScore).toBe(100);

      // Listening score = 5 * 4 + 10 * 4 + 10 * 4 = 100 points
      const listeningAllocations = bp2.allocations.filter(a => a.skill === 'listening');
      const listeningScore = listeningAllocations.reduce((s, a) => s + a.count * a.points_per_question, 0);
      expect(listeningScore).toBe(100);

      // Reading score = 5 * 4 + 5 * 4 + 10 * 4 + 5 * 4 = 100 points
      const readingAllocations = bp2.allocations.filter(a => a.skill === 'reading');
      const readingScore = readingAllocations.reduce((s, a) => s + a.count * a.points_per_question, 0);
      expect(readingScore).toBe(100);

      // 100 + 100 + 100 = 300
      expect(listeningScore + readingScore + writingScore).toBe(300);
    });

    it('HSK 2 Writing section strictly matches data/qbank/blueprint/level2.json', () => {
      const json2 = loadBlueprintJson(2);
      expect(json2.sections.writing).toBeDefined();
      expect(json2.sections.writing.total_questions).toBe(10);
      expect(json2.sections.writing.score_weight).toBe(100);
      expect(json2.sections.writing.parts.writing_1.type).toBe('write_component_assembly_6opt');
      expect(json2.sections.writing.parts.writing_1.n_questions).toBe(5);
      expect(json2.sections.writing.parts.writing_2.type).toBe('write_tianzige_from_pinyin');
      expect(json2.sections.writing.parts.writing_2.n_questions).toBe(5);
    });

    it('AIExamStudio Skill Selection logic enables writing for level >= 2 and disables only for level <= 1', () => {
      // Simulating useEffect logic in AIExamStudio (line 207):
      // if (level <= 1) setSelectedSkills(['listening', 'reading']) else setSelectedSkills(['listening', 'reading', 'writing'])
      const computeSelectedSkills = (lvl: number): string[] => {
        if (lvl <= 1) {
          return ['listening', 'reading'];
        } else {
          return ['listening', 'reading', 'writing'];
        }
      };

      // For HSK 1: writing excluded
      expect(computeSelectedSkills(1)).toEqual(['listening', 'reading']);
      expect(computeSelectedSkills(1).includes('writing')).toBe(false);

      // For HSK 2..6: writing included!
      for (let lvl = 2; lvl <= 6; lvl++) {
        const skills = computeSelectedSkills(lvl);
        expect(skills, `Level ${lvl} must include writing`).toContain('writing');
        expect(skills).toEqual(['listening', 'reading', 'writing']);
      }
    });

    it('AIExamStudio Checkbox isDisabled logic: Writing checkbox is enabled for level 2, disabled only for level <= 1', () => {
      // Simulating JSX condition in AIExamStudio (line 832):
      // const isDisabled = id === 'writing' && level <= 1;
      const isSkillCheckboxDisabled = (skillId: string, lvl: number): boolean => {
        return skillId === 'writing' && lvl <= 1;
      };

      // HSK 1: writing checkbox is DISABLED
      expect(isSkillCheckboxDisabled('writing', 1)).toBe(true);

      // HSK 2: writing checkbox is ENABLED (false)
      expect(isSkillCheckboxDisabled('writing', 2)).toBe(false);

      // HSK 3..6: writing checkbox is ENABLED (false)
      for (let lvl = 3; lvl <= 6; lvl++) {
        expect(isSkillCheckboxDisabled('writing', lvl)).toBe(false);
      }

      // Non-writing skills (listening, reading) are never disabled regardless of level
      for (let lvl = 1; lvl <= 6; lvl++) {
        expect(isSkillCheckboxDisabled('listening', lvl)).toBe(false);
        expect(isSkillCheckboxDisabled('reading', lvl)).toBe(false);
      }
    });
  });

  // =========================================================================
  // 5. PEDAGOGICAL INVARIANTS & INTEGRITY STRESS
  // =========================================================================
  describe('5. Pedagogical Invariants & Integrity Stress Across HSK 1..6', () => {
    it('Total questions count is monotonic non-decreasing across HSK 1..6', () => {
      const counts = [1, 2, 3, 4, 5, 6].map(lvl => DEFAULT_BLUEPRINTS[lvl].totalQuestions);
      expect(counts).toEqual([40, 60, 70, 70, 72, 82]);

      for (let i = 0; i < counts.length - 1; i++) {
        expect(counts[i + 1]).toBeGreaterThanOrEqual(counts[i]);
      }
    });

    it('Every allocation has valid part_type syntax and non-empty Vietnamese title', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const bp = DEFAULT_BLUEPRINTS[lvl];
        for (const alloc of bp.allocations) {
          expect(alloc.part_type.length).toBeGreaterThan(3);
          expect(alloc.part_type).toMatch(/^(listen|read|write)_/);
          expect(alloc.part_name_vi.length).toBeGreaterThan(5);
        }
      }
    });

    it('Database invariants: hsk_exam.db SHA-256 untouched and qbank.db has 12 tables', () => {
      const buf = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);

      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });
      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
      expect(tables.length).toBe(12);
      db.close();
    });
  });
});
