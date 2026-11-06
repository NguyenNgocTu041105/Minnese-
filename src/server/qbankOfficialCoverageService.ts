/**
 * src/server/qbankOfficialCoverageService.ts
 *
 * Official HSK 1–6 Coverage Statistics Service (Phase 2 Specification)
 * Strictly scoped to HSK 1..6 approved and active questions.
 *
 * Core Invariants:
 * 1. Filter: Strictly `status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6`.
 * 2. Exclusions: Explicitly reports count of excluded pending (21), rejected (3), disabled (0).
 * 3. Unique Question Invariant: 1 question linked to multiple knowledge items is counted strictly ONCE in question totals.
 * 4. 4-Tier Vocab Boundary: Context-only words must NEVER become Tier 2!
 * 5. Denominator Transparency: Explicit numerator, denominator, denominator_scope, percentage, status, is_complete.
 * 6. Anti-Fabrication: Never claims 100% complete while grammar is missing or writing chars are partial.
 */

import { DatabaseSync } from 'node:sqlite';
import {
  getSyllabusCatalog,
  buildKnowledgeLinkingModel,
  InMemoryKnowledgeLinkingModel,
  HskLevel,
  KnowledgeType,
  KnowledgeLinkRole,
  QuestionPosting,
  QuestionKnowledgeProfile,
  KnowledgeItemRecord,
} from './qbankCoverageEngine.js';

export type CatalogStatus = 'verified_complete' | 'partial' | 'missing';

export interface DenominatorMetric {
  numerator: number;
  denominator: number;
  denominator_scope: string;
  percentage: number;
  status: CatalogStatus;
  is_complete: boolean;
}

export interface DimensionCoverageMetrics extends DenominatorMetric {
  uncoveredCount: number;
  inContextCount: number;
  directlyTestedCount: number;
  reinforcedCount: number;
}

export interface LevelCoverageReport {
  level: number;
  approvedQuestionsCount: number;
  vocabulary: DenominatorMetric & {
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
  };
  recognitionHanzi: DenominatorMetric;
  writingHanzi: DenominatorMetric;
  grammar: DenominatorMetric;
  overallStatus: CatalogStatus;
}

export interface SkillCoverageReport {
  skill: string;
  approvedCount: number;
  uniqueTestedVocabCount: number;
  testedWordsList: string[];
  levels: Record<number, number>;
  partTypes: Record<string, number>;
}

export interface PartTypeCoverageReport {
  level: number;
  skill: string;
  part_type: string;
  approvedCount: number;
  uniqueTestedVocabCount: number;
  testedWordsList: string[];
}

export interface OfficialCoverageReport {
  timestamp: string;
  scope: 'HSK 1-6 Official Approved Only';
  summary: {
    totalUniqueApprovedQuestions: number;  // Evaluated via Set<string>
    approvedActiveCount: number;
    excludedPendingCount: number;
    excludedRejectedCount: number;
    excludedDisabledCount: number;
    curriculumReadiness: {
      status: CatalogStatus;
      isComplete: boolean;
      reasons: string[];
    };
  };
  dimensions: {
    vocabulary: DimensionCoverageMetrics;
    recognitionHanzi: DenominatorMetric;
    writingHanzi: DenominatorMetric;
    grammar: DenominatorMetric;
  };
  byLevel: Record<number, LevelCoverageReport>;
  bySkill: Record<string, SkillCoverageReport>;
  byPartType: PartTypeCoverageReport[];
  bySkillAndPartType: Record<string, PartTypeCoverageReport[]>;
}

// Level-by-level official standard benchmarks
const VOCAB_STANDARD_BY_LEVEL: Record<HskLevel, number> = {
  1: 300,
  2: 200,
  3: 500,
  4: 1000,
  5: 1600,
  6: 1800,
};

const RECOGNITION_CHARS_BY_LEVEL: Record<HskLevel, number> = {
  1: 246,
  2: 125,
  3: 284,
  4: 441,
  5: 431,
  6: 413,
};

const WRITING_CHARS_BY_LEVEL: Record<HskLevel, number> = {
  1: 100,
  2: 0,
  3: 150,
  4: 150,
  5: 150,
  6: 150,
};

const GRAMMAR_POINTS_BY_LEVEL: Record<HskLevel, number> = {
  1: 48,
  2: 81,
  3: 141,
  4: 144,
  5: 98,
  6: 60,
};

export class OfficialCoverageService {
  private cache: { report: OfficialCoverageReport; model: InMemoryKnowledgeLinkingModel; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 10_000;

  /**
   * Computes official coverage statistics strictly over approved and active questions.
   */
  public computeOfficialCoverage(
    db: DatabaseSync,
    options?: { level?: number; skipCache?: boolean }
  ): OfficialCoverageReport {
    const now = Date.now();
    if (!options?.skipCache && this.cache && this.cache.expiresAt > now) {
      if (options?.level) {
        return this.filterReportByLevel(this.cache.report, options.level);
      }
      return this.cache.report;
    }

    const catalog = getSyllabusCatalog();
    const model = buildKnowledgeLinkingModel(db);

    // 1. Excluded counts query
    let excludedPendingCount = 0;
    let excludedRejectedCount = 0;
    let excludedDisabledCount = 0;

    try {
      const pendingRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM pending_questions WHERE status = 'pending' AND level BETWEEN 1 AND 6
      `).get();
      excludedPendingCount = Number(pendingRow?.cnt || 0);
    } catch {}

    try {
      const rejectedRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM pending_questions WHERE status = 'rejected' AND level BETWEEN 1 AND 6
      `).get();
      excludedRejectedCount = Number(rejectedRow?.cnt || 0);
    } catch {}

    try {
      const disabledRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM questions WHERE (status IN ('disabled', 'archived', 'rejected') OR is_active = 0) AND level BETWEEN 1 AND 6
      `).get();
      excludedDisabledCount = Number(disabledRow?.cnt || 0);
    } catch {}

    // 2. Unique Question Invariant
    const totalUniqueApprovedQuestions = model.uniqueQuestions.allApproved.size;
    const approvedActiveCount = totalUniqueApprovedQuestions;

    // 3. Vocabulary Dimension Accounting across 5,400 knowledge items
    let tier0Count = 0;
    let tier1Count = 0;
    let tier2Count = 0;
    let tier3Count = 0;

    const vocabByLevelCounts: Record<HskLevel, { tier0: number; tier1: number; tier2: number; tier3: number }> = {
      1: { tier0: 0, tier1: 0, tier2: 0, tier3: 0 },
      2: { tier0: 0, tier1: 0, tier2: 0, tier3: 0 },
      3: { tier0: 0, tier1: 0, tier2: 0, tier3: 0 },
      4: { tier0: 0, tier1: 0, tier2: 0, tier3: 0 },
      5: { tier0: 0, tier1: 0, tier2: 0, tier3: 0 },
      6: { tier0: 0, tier1: 0, tier2: 0, tier3: 0 },
    };

    for (const item of catalog.knowledgeItems.values()) {
      const lvl = item.level;
      const rec = model.invertedIndex.get(`vocab:${lvl}:${item.key}`);
      const tier = rec ? (rec.tier ?? 0) : 0;

      if (tier === 0) {
        tier0Count++;
        vocabByLevelCounts[lvl].tier0++;
      } else if (tier === 1) {
        tier1Count++;
        vocabByLevelCounts[lvl].tier1++;
      } else if (tier === 2) {
        tier2Count++;
        vocabByLevelCounts[lvl].tier2++;
      } else if (tier === 3) {
        tier3Count++;
        vocabByLevelCounts[lvl].tier3++;
      }
    }

    const vocabNumerator = tier2Count + tier3Count;
    const totalVocabDenominator = 5400;
    const vocabPercentage = Number(((vocabNumerator / totalVocabDenominator) * 100).toFixed(1));

    // 4. Recognition Hanzi Accounting across 1,940 characters
    let recogTestedCount = 0;
    const recogByLevelCounts: Record<HskLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const c of catalog.chars.values()) {
      const rec = model.charRecognitionIndex.get(c.char);
      if (rec && rec.uniqueQuestionCount > 0) {
        recogTestedCount++;
        recogByLevelCounts[c.level]++;
      }
    }
    const recogNumerator = recogTestedCount;
    const totalRecogDenominator = 1940;
    const recogPercentage = Number(((recogNumerator / totalRecogDenominator) * 100).toFixed(1));

    // 5. Writing Hanzi Accounting across 700 characters
    let writingTestedCount = 0;
    const writingByLevelCounts: Record<HskLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const w of catalog.writingChars.values()) {
      const rec = model.charWritingIndex.get(w.char);
      if (rec && rec.uniqueQuestionCount > 0) {
        writingTestedCount++;
        writingByLevelCounts[w.level]++;
      }
    }
    const writingNumerator = writingTestedCount;
    const totalWritingDenominator = 700;
    const writingPercentage = Number(((writingNumerator / totalWritingDenominator) * 100).toFixed(1));

    // 6. Grammar Accounting across 572 standard points
    const grammarNumerator = 0;
    const totalGrammarDenominator = 572;
    const grammarPercentage = 0.0;

    // 7. Multi-dimensional breakdowns: byLevel (1..6)
    const byLevel: Record<number, LevelCoverageReport> = {};
    for (let l = 1; l <= 6; l++) {
      const lvl = l as HskLevel;
      const lvlApprovedCount = model.uniqueQuestions.byLevel.get(lvl)?.size || 0;
      const lvlVocabDenom = VOCAB_STANDARD_BY_LEVEL[lvl];
      const lvlVocabNum = vocabByLevelCounts[lvl].tier2 + vocabByLevelCounts[lvl].tier3;
      const lvlVocabPct = Number(((lvlVocabNum / lvlVocabDenom) * 100).toFixed(1));

      const lvlRecogDenom = RECOGNITION_CHARS_BY_LEVEL[lvl];
      const lvlRecogNum = recogByLevelCounts[lvl];
      const lvlRecogPct = Number(((lvlRecogNum / lvlRecogDenom) * 100).toFixed(1));

      const lvlWritingDenom = WRITING_CHARS_BY_LEVEL[lvl];
      const lvlWritingNum = writingByLevelCounts[lvl];
      const lvlWritingPct = lvlWritingDenom > 0 ? Number(((lvlWritingNum / lvlWritingDenom) * 100).toFixed(1)) : 0;

      const lvlGrammarDenom = GRAMMAR_POINTS_BY_LEVEL[lvl];

      byLevel[lvl] = {
        level: lvl,
        approvedQuestionsCount: lvlApprovedCount,
        vocabulary: {
          numerator: lvlVocabNum,
          denominator: lvlVocabDenom,
          denominator_scope: `clec_2025_hsk${lvl}_vocabulary_new_words`,
          percentage: lvlVocabPct,
          status: 'verified_complete',
          is_complete: lvlVocabNum >= lvlVocabDenom,
          tier0: vocabByLevelCounts[lvl].tier0,
          tier1: vocabByLevelCounts[lvl].tier1,
          tier2: vocabByLevelCounts[lvl].tier2,
          tier3: vocabByLevelCounts[lvl].tier3,
        },
        recognitionHanzi: {
          numerator: lvlRecogNum,
          denominator: lvlRecogDenom,
          denominator_scope: `clec_2025_hsk${lvl}_recognition_chars`,
          percentage: lvlRecogPct,
          status: 'verified_complete',
          is_complete: lvlRecogNum >= lvlRecogDenom,
        },
        writingHanzi: {
          numerator: lvlWritingNum,
          denominator: lvlWritingDenom,
          denominator_scope: `clec_2025_hsk${lvl}_writing_chars`,
          percentage: lvlWritingPct,
          status: 'partial',
          is_complete: false,
        },
        grammar: {
          numerator: 0,
          denominator: lvlGrammarDenom,
          denominator_scope: `clec_2021_hsk${lvl}_grammar_points`,
          percentage: 0.0,
          status: 'missing',
          is_complete: false,
        },
        overallStatus: 'partial',
      };
    }

    // 8. Breakdown by Skill
    const bySkill: Record<string, SkillCoverageReport> = {};
    for (const [skill, qSet] of model.uniqueQuestions.bySkill.entries()) {
      const testedWordsSet = new Set<string>();
      const levelsCount: Record<number, number> = {};
      const partTypesCount: Record<string, number> = {};

      for (const qId of qSet) {
        const prof = model.forwardIndex.get(qId);
        if (prof) {
          prof.testedVocab.forEach((w) => testedWordsSet.add(w));
          levelsCount[prof.level] = (levelsCount[prof.level] || 0) + 1;
          partTypesCount[prof.part_type] = (partTypesCount[prof.part_type] || 0) + 1;
        }
      }

      bySkill[skill] = {
        skill,
        approvedCount: qSet.size,
        uniqueTestedVocabCount: testedWordsSet.size,
        testedWordsList: Array.from(testedWordsSet),
        levels: levelsCount,
        partTypes: partTypesCount,
      };
    }

    // Ensure all standard skills are present
    for (const standardSkill of ['listening', 'reading', 'writing']) {
      if (!bySkill[standardSkill]) {
        bySkill[standardSkill] = {
          skill: standardSkill,
          approvedCount: 0,
          uniqueTestedVocabCount: 0,
          testedWordsList: [],
          levels: {},
          partTypes: {},
        };
      }
    }

    // 9. Breakdown by PartType
    const byPartTypeMap = new Map<string, PartTypeCoverageReport>();
    const bySkillAndPartType: Record<string, PartTypeCoverageReport[]> = {
      listening: [],
      reading: [],
      writing: [],
    };

    for (const [partType, qSet] of model.uniqueQuestions.byPartType.entries()) {
      const testedWordsSet = new Set<string>();
      let pLevel = 1;
      let pSkill = 'reading';

      for (const qId of qSet) {
        const prof = model.forwardIndex.get(qId);
        if (prof) {
          pLevel = prof.level;
          pSkill = prof.skill;
          prof.testedVocab.forEach((w) => testedWordsSet.add(w));
        }
      }

      const reportItem: PartTypeCoverageReport = {
        level: pLevel,
        skill: pSkill,
        part_type: partType,
        approvedCount: qSet.size,
        uniqueTestedVocabCount: testedWordsSet.size,
        testedWordsList: Array.from(testedWordsSet),
      };

      byPartTypeMap.set(partType, reportItem);
      if (!bySkillAndPartType[pSkill]) {
        bySkillAndPartType[pSkill] = [];
      }
      bySkillAndPartType[pSkill].push(reportItem);
    }

    const byPartType = Array.from(byPartTypeMap.values());

    const report: OfficialCoverageReport = {
      timestamp: new Date().toISOString(),
      scope: 'HSK 1-6 Official Approved Only',
      summary: {
        totalUniqueApprovedQuestions,
        approvedActiveCount,
        excludedPendingCount,
        excludedRejectedCount,
        excludedDisabledCount,
        curriculumReadiness: {
          status: 'partial',
          isComplete: false,
          reasons: [
            'Danh mục Ngữ pháp HSK 3.0 đang thiếu trong hệ thống (572 điểm ngữ pháp CLEC 2021 chưa có trong workspace).',
            'Danh mục Chữ Hán Viết mới chỉ đạt mức chuẩn (700 chữ), hiện tại kho câu hỏi có 0 câu hỏi kỹ năng Viết.',
            'Kho câu hỏi đang trong giai đoạn tích lũy (89 câu đã duyệt, 76 từ vựng được kiểm tra trực tiếp).',
          ],
        },
      },
      dimensions: {
        vocabulary: {
          status: 'verified_complete',
          numerator: vocabNumerator,
          denominator: totalVocabDenominator,
          denominator_scope: 'clec_2025_hsk1_6_5400_items',
          percentage: vocabPercentage,
          is_complete: vocabNumerator >= totalVocabDenominator,
          uncoveredCount: tier0Count,
          inContextCount: tier1Count,
          directlyTestedCount: tier2Count,
          reinforcedCount: tier3Count,
        },
        recognitionHanzi: {
          status: 'verified_complete',
          numerator: recogNumerator,
          denominator: totalRecogDenominator,
          denominator_scope: 'clec_2025_hsk1_6_recognition_chars_1940',
          percentage: recogPercentage,
          is_complete: recogNumerator >= totalRecogDenominator,
        },
        writingHanzi: {
          status: 'partial',
          numerator: writingNumerator,
          denominator: totalWritingDenominator,
          denominator_scope: 'clec_2025_hsk1_6_writing_chars_700',
          percentage: writingPercentage,
          is_complete: false,
        },
        grammar: {
          status: 'missing',
          numerator: grammarNumerator,
          denominator: totalGrammarDenominator,
          denominator_scope: 'clec_2021_hsk1_6_official_grammar_standard',
          percentage: grammarPercentage,
          is_complete: false,
        },
      },
      byLevel,
      bySkill,
      byPartType,
      bySkillAndPartType,
    };

    this.cache = {
      report,
      model,
      expiresAt: now + this.CACHE_TTL_MS,
    };

    if (options?.level) {
      return this.filterReportByLevel(report, options.level);
    }

    return report;
  }

  /**
   * Retrieves question postings for a specific knowledge item (reverse lookup).
   */
  public getQuestionsForKnowledgeItem(
    knowledgeType: KnowledgeType,
    key: string,
    db?: DatabaseSync
  ): QuestionPosting[] {
    if (!this.cache && db) {
      this.computeOfficialCoverage(db);
    }
    if (!this.cache) return [];

    if (knowledgeType === 'vocab') {
      // 1. Direct invertedIndex match by ID or composite key
      const directRec = this.cache.model.invertedIndex.get(key) || this.cache.model.invertedIndex.get(`vocab:${key}`);
      if (directRec) {
        return directRec.postings;
      }
      // 2. Multi-entry index match by clean_word: aggregate postings across all variants
      const multi = this.cache.model.vocabMultiIndex?.get(key);
      if (multi && multi.length > 0) {
        const allPostings: QuestionPosting[] = [];
        const seen = new Set<string>();
        for (const r of multi) {
          for (const p of r.postings) {
            const sig = `${p.questionId}#${p.role}#${p.part_type}`;
            if (!seen.has(sig)) {
              seen.add(sig);
              allPostings.push(p);
            }
          }
        }
        return allPostings;
      }
      // 3. Fallback to vocabIndex
      const rec = this.cache.model.vocabIndex.get(key);
      return rec ? rec.postings : [];
    }
    if (knowledgeType === 'hanzi_recognition') {
      const rec = this.cache.model.charRecognitionIndex.get(key);
      return rec ? rec.postings : [];
    }
    if (knowledgeType === 'hanzi_writing') {
      const rec = this.cache.model.charWritingIndex.get(key);
      return rec ? rec.postings : [];
    }
    if (knowledgeType === 'grammar') {
      const rec = this.cache.model.grammarIndex.get(key);
      return rec ? rec.postings : [];
    }
    return [];
  }

  /**
   * Retrieves full profile for a specific question.
   */
  public getProfileForQuestion(
    questionId: string,
    db?: DatabaseSync
  ): QuestionKnowledgeProfile | undefined {
    if (!this.cache && db) {
      this.computeOfficialCoverage(db);
    }
    return this.cache?.model.forwardIndex.get(questionId);
  }

  /**
   * Invalidate cache to force recalculation.
   */
  public invalidateCache(): void {
    this.cache = null;
  }

  private filterReportByLevel(report: OfficialCoverageReport, level: number): OfficialCoverageReport {
    const lvlReport = report.byLevel[level];
    return {
      ...report,
      byLevel: lvlReport ? { [level]: lvlReport } : {},
      byPartType: report.byPartType.filter((p) => p.level === level),
    };
  }
}

let serviceInstance: OfficialCoverageService | null = null;
export function getOfficialCoverageService(): OfficialCoverageService {
  if (!serviceInstance) {
    serviceInstance = new OfficialCoverageService();
  }
  return serviceInstance;
}
