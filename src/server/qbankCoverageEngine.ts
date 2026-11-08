/**
 * QBank Multi-Dimensional Coverage Engine & Syllabus Catalog Loader
 * Strictly scoped to HSK 1, 2, 3, 4, 5, and 6 (Excluding HSK 7-9).
 *
 * Implements:
 * 1. Official HSK 3.0 Syllabus Ingestion (5,334 words, 1,940 recognition characters)
 * 2. High-Performance Forward Maximum Matching (FMM) Chinese Tokenizer (Window 1..4)
 * 3. 4-Tier Vocabulary Coverage Tracker (Tier 0: Uncovered, Tier 1: Contextual, Tier 2: Directly Tested, Tier 3: Reinforced)
 * 4. Pre-Generation Vocabulary Planner (60% Tier 0/1, 25% Tier 2, 15% Review 1..L, Overused Threshold 5, 1-2 words/item)
 * 5. Actual Text Syllabus Verification (Cross-checks text against syllabus, rejects false claims, downgrades context words)
 * 6. Configurable Coverage Targets & 8 Group Statuses (no_data, accumulating, below_quantity_target, etc.)
 * 7. Coverage Matrix & Priority Deficit Calculator
 * 8. Safe Additive SQLite Migrations (PRAGMA table_info checks, non-destructive schema evolution)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

// ============================================================================
// 1. Interfaces & Type Definitions (Strict HSK 1–6)
// ============================================================================

export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SyllabusWord {
  id: string;              // Deterministic key: `w_${level}_${word}`
  word: string;            // Simplified Chinese headword (e.g. "亲自")
  pinyin: string;          // Full pinyin with tone marks (e.g. "qīn zì")
  pos?: string;            // Part of speech if annotated
  level: HskLevel;         // Strict HSK level 1..6
  topics: string[];        // Semantic categories/topics
  source: string;          // Provenance citation
  license_status: string;  // Licensing tag
  category?: string;
  restore_decision?: string;
  restore_reason?: string;
}

export interface SyllabusChar {
  char: string;            // Single Chinese character (e.g. "亲")
  level: HskLevel;         // Strict HSK level 1..6
  is_recognition: boolean; // Always true for all 1,940 syllabus chars
  writing_target?: number; // Official cumulative writing target benchmark for level
}

export interface SyllabusKnowledgeItem {
  id: string;              // Deterministic key: `k_${level}_${clean_word}_${pinyin}_${raw_word}`
  key: string;             // Composite lookup key: `${clean_word}#${level}#${pinyin}#${raw_word}`
  clean_word: string;      // Simplified Chinese word (e.g. "点")
  raw_word: string;        // Disambiguated or original word (e.g. "点2" or "点")
  word: string;            // Standard display word
  pinyin: string;          // Full pinyin
  pos?: string;            // Part of speech
  level: HskLevel;         // Strict HSK level 1..6
  topics: string[];        // Semantic categories/topics
  source: string;          // Provenance citation
  license_status: string;  // Licensing tag
  category?: string;       // E.g. A_polyphone, B_polyseme, C_particle, standard
  restore_decision?: string;
  restore_reason?: string;
}

export interface SyllabusWritingChar {
  char: string;
  level: HskLevel;
  is_writing: boolean;
}

export interface SyllabusCatalog {
  words: Map<string, SyllabusWord>;                              // Fast O(1) lookup by word (5,334 headwords) - Tier 1
  wordsByLevel: Map<HskLevel, SyllabusWord[]>;                   // Partitioned by level 1..6
  knowledgeItems: Map<string, SyllabusKnowledgeItem>;            // Fast O(1) lookup by composite key (5,400 items) - Tier 2
  knowledgeItemsByLevel: Map<HskLevel, SyllabusKnowledgeItem[]>;  // Partitioned by level 1..6
  chars: Map<string, SyllabusChar>;                              // Fast O(1) lookup by char (1,940 items)
  charsByLevel: Map<HskLevel, SyllabusChar[]>;                   // Partitioned by level 1..6
  writingChars: Map<string, SyllabusWritingChar>;                // Fast O(1) lookup by char (700 items)
  writingCharsByLevel: Map<HskLevel, SyllabusWritingChar[]>;     // Partitioned by level 1..6
  maxWordLength: number;                                         // Empirically determined = 4
  allWordLevels?: Map<string, Set<number>>;                      // Set of all HSK levels for each word (including restored polyphones)
  properNouns?: Set<string>;                                     // Approved proper nouns and place names from names.txt
}


export type VocabTier = 0 | 1 | 2 | 3;
export type VocabTierLabel = 'uncovered' | 'contextual_appearance' | 'directly_tested' | 'reinforced';

export interface QuestionDirectTestRecord {
  questionId: string;
  level: HskLevel;
  skill: string;
  part_type: string;
  stem: string;
}

export interface QuestionContextRecord {
  questionId: string;
  level: HskLevel;
  skill: string;
  part_type: string;
}

export interface WordCoverageSummary {
  word: string;
  level: HskLevel;
  pinyin: string;
  pos?: string;
  tier: VocabTier;
  tierLabel: VocabTierLabel;
  directlyTestedCount: number;
  contextualCount: number;
  distinctPartTypes: string[];
  distinctStemsCount: number;
  isOverused: boolean;
}

export interface VocabCoverageReport {
  timestamp: string;
  totalWords: number;
  overall: {
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
    percentCoveredTier2Plus: number;
  };
  byLevel: Record<HskLevel, {
    totalWords: number;
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
    percentCoveredTier2Plus: number;
  }>;
  wordDetails: Map<string, WordCoverageSummary>;
  priorityMissingWords: SyllabusWord[]; // Tier 0 and Tier 1 words for scheduling
  overusedWords: string[];
}

// ============================================================================
// 1.1. In-Memory Knowledge Linking Model & Inverted Index Interfaces
// ============================================================================

export type KnowledgeType = 'vocab' | 'grammar' | 'hanzi_recognition' | 'hanzi_writing' | 'topic';

export type KnowledgeLinkRole =
  | 'context'          // Appears in stem, passage, distractors
  | 'directly_tested'  // Target focus, correct option, tested_vocab
  | 'reinforced'       // Reinforced across >= 2 part_types or stems
  | 'appearing'        // Grammar appearing in sentence
  | 'applied'          // Grammar applied across >= 2 part_types
  | 'recognized'       // Hanzi appearing in question text
  | 'written';         // Hanzi required in writing skill

export interface KnowledgeLink {
  questionId: string;
  knowledgeType: KnowledgeType;
  knowledgeId: string;
  knowledgeKey: string;
  level: HskLevel;
  role: KnowledgeLinkRole;
  evidence: string;
  weight?: number;
}

export interface QuestionPosting {
  questionId: string;
  level: HskLevel;
  skill: string;
  part_type: string;
  stem: string;
  role: KnowledgeLinkRole;
  evidence: string;
}

export interface KnowledgeItemRecord {
  id: string;
  type: KnowledgeType;
  key: string;
  level: HskLevel;
  pinyin?: string;
  pos?: string;
  postings: QuestionPosting[];
  uniqueQuestionCount: number;
  directlyTestedCount: number;
  contextualCount: number;
  distinctPartTypes: string[];
  distinctStemsCount: number;
  tier?: VocabTier;
  tierLabel?: VocabTierLabel;
  grammarRole?: 'untested' | 'appearing' | 'directly_tested' | 'applied';
  isOverused?: boolean;
}

export interface QuestionKnowledgeProfile {
  questionId: string;
  level: HskLevel;
  skill: string;
  part_type: string;
  stem: string;
  passage?: string;
  options: string[];
  answerIdx: number;
  correctOption: string;
  testedVocab: string[];
  contextVocab: string[];
  recognitionChars: string[];
  writingChars: string[];
  grammarPoints: string[];
  topics: string[];
  links: KnowledgeLink[];
}

export interface InMemoryKnowledgeLinkingModel {
  forwardIndex: Map<string, QuestionKnowledgeProfile>;
  invertedIndex: Map<string, KnowledgeItemRecord>;
  uniqueQuestions: {
    allApproved: Set<string>;
    byLevel: Map<HskLevel, Set<string>>;
    bySkill: Map<string, Set<string>>;
    byPartType: Map<string, Set<string>>;
  };
  vocabIndex: Map<string, KnowledgeItemRecord>;
  vocabMultiIndex: Map<string, KnowledgeItemRecord[]>;
  charRecognitionIndex: Map<string, KnowledgeItemRecord>;
  charWritingIndex: Map<string, KnowledgeItemRecord>;
  grammarIndex: Map<string, KnowledgeItemRecord>;
}

export interface QBankCoverageTargets {
  /** Initial baseline target for approved active questions per supported skill per level (default: 200) */
  initialSkillTarget: number;
  /** Extended target for high-depth skill practice pool (default: 500) */
  extendedSkillTarget: number;
  /** Initial baseline target for approved active questions per blueprint part_type (default: 30) */
  initialPartTypeTarget: number;
  /** Extended target per part_type (default: 75) */
  extendedPartTypeTarget: number;
  /** Minimum independent blueprint-compliant mock exam sets required (default: 3) */
  initialExamSetsTarget: number;
  /** Extended target for independent mock exam sets (default: 5..10, default value: 5) */
  extendedExamSetsTarget: number;
  /** Seed/accumulation threshold below which a group is considered 'accumulating' (default: 5) */
  accumulatingThreshold: number;
  /** Minimum unique tested vocabulary ratio for a part_type to satisfy diversity (default: 0.40) */
  minVocabDiversityRatio: number;
  /** Maximum number of approved questions testing the same word before word is deemed overused (default: 5) */
  overusedVocabThreshold: number;
  /** Target percentage of level vocabulary at Tier 2 or 3 (default: 0.60) */
  vocabTier2PlusRatioMin: number;
}

export const DEFAULT_COVERAGE_TARGETS: Readonly<QBankCoverageTargets> = Object.freeze({
  initialSkillTarget: 200,
  extendedSkillTarget: 500,
  initialPartTypeTarget: 30,
  extendedPartTypeTarget: 75,
  initialExamSetsTarget: 3,
  extendedExamSetsTarget: 5,
  accumulatingThreshold: 5,
  minVocabDiversityRatio: 0.40,
  overusedVocabThreshold: 5,
  vocabTier2PlusRatioMin: 0.60,
});

export type QBankGroupStatus =
  | 'no_data'
  | 'accumulating'
  | 'below_quantity_target'
  | 'quantity_met_lacks_diversity_or_types'
  | 'minimum_coverage_met'
  | 'extended_target_met'
  | 'exam_ready'
  | 'blocked';

export interface GroupClassificationInput {
  level: number;
  skill: string;
  part_type?: string;
  approvedCount: number;          // Count with status='approved' AND is_active=1
  pendingCount: number;           // Count with status='pending'
  blueprintQuestionQuota: number; // Blueprint n_questions for 1 exam set
  uniqueTestedVocabCount?: number;
  childParts?: {
    part_type: string;
    approvedCount: number;
    target: number;
  }[];
  isExplicitlyBlocked?: boolean;
  blockedReason?: string;
  config?: Partial<QBankCoverageTargets>;
}

export interface GroupClassificationResult {
  status: QBankGroupStatus;
  blockedReason?: string;
  approvedCount: number;
  pendingCount: number;
  targetCount: number;
  deficit: number;
  examSetsRequiredCount: number;
  examSetsDeficit: number;
  isExamReady: boolean;
  details: string;
}

export interface CoverageMatrixRow {
  level: HskLevel;
  skill: string;
  part_type: string;
  part_name?: string;
  targetQuantity: number;
  approvedCount: number;
  pendingCount: number;
  deficit: number;
  examSetsTarget: number;
  examSetsRequiredCount: number;
  examSetsDeficit: number;
  uniqueTestedVocabCount: number;
  vocabCoveredRatio: number;
  status: QBankGroupStatus;
  lastTaskStatus?: 'completed' | 'failed' | 'partial' | 'none';
  blockReason?: string;
  details: string;
}

export interface CoverageMatrixReport {
  timestamp: string;
  targets: QBankCoverageTargets;
  rows: CoverageMatrixRow[];
  summary: {
    totalApproved: number;
    totalPending: number;
    totalDeficit: number;
    byLevel: Record<number, {
      approved: number;
      target: number;
      deficit: number;
      examReadyParts: number;
      totalParts: number;
      isLevelExamReady: boolean;
    }>;
  };
}

export interface PlannedTargetWord {
  word: string;
  pinyin: string;
  level: number;
  tier: VocabTier;
  category: 'tier0_1' | 'tier2_reinforce' | 'review';
  testedCount: number;
  contextCount: number;
  pos?: string;
}

export interface PlanBatchVocabOptions {
  overusedThreshold?: number; // Default: 5
  weights?: {
    tier0_1: number;          // Default: 0.60
    tier2: number;            // Default: 0.25
    review: number;           // Default: 0.15
  };
  wordsPerQuestion?: number;  // 1 to 2, Default: 1.0
  seed?: number;
}

export interface PlannedVocab {
  level: number;
  questionCount: number;
  totalTargetWords: number;
  targets: PlannedTargetWord[];
  perQuestionTargets: PlannedTargetWord[][];
  breakdown: {
    tier0_1Count: number;
    tier2ReinforceCount: number;
    reviewCount: number;
    excludedOverusedCount: number;
    targetTier0_1Quota: number;
    targetTier2Quota: number;
    targetReviewQuota: number;
    reallocatedDeficit: number;
  };
  promptSummary: string;
}

export interface QuestionVocabVerificationResult {
  tested: string[];        // Verified words directly tested (correct answer / blank target)
  contextual: string[];    // Verified words appearing only in context (stem/passage/distractors)
  outOfSyllabus: string[]; // Words/characters not found in official HSK 1–6 syllabus
  aboveLevel: { word: string; wordLevel: number; questionLevel: number; source?: 'tested' | 'context' }[];
  maxWordLevel: number;    // Highest HSK level (1-6) of any verified word in the question
  wordLevelBreakdown: Record<number, number>; // Count of words per HSK level
  discrepancies: {
    declaredTested: string[];
    verifiedTested: string[];
    falseClaims: string[];             // Claimed by LLM, absent from text
    downgradedToContextual: string[];  // Claimed by LLM, but only appears in stem/distractors
  };
  isValidForLevel: boolean;            // True if tested words do not exceed question level
}

export interface DeficitGroup {
  level: HskLevel;
  skill: string;
  part_type: string;
  deficit: number;
  examSetsDeficit: number;
  priorityScore: number;
  status: QBankGroupStatus;
  reason: string;
}

// In-memory cache for syllabus
let catalogCache: SyllabusCatalog | null = null;
const coverageReportCacheByDb = new WeakMap<DatabaseSync, { report: VocabCoverageReport; expiresAt: number }>();

// ============================================================================
// 2. Authoritative HSK 1–6 Syllabus Loader
// ============================================================================

/**
 * Loads and returns the authoritative HSK 1-6 Syllabus Catalog.
 * Strictly filters levels 1 to 6. Excludes HSK 7-9 completely.
 */
export function getSyllabusCatalog(): SyllabusCatalog {
  if (catalogCache) {
    return catalogCache;
  }

  const vocabPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab.jsonl');
  const vocabRestoredPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab_restored.jsonl');
  const charsPath = path.resolve(process.cwd(), 'data/qbank/syllabus/chars.jsonl');
  const charsWritingPath = path.resolve(process.cwd(), 'data/qbank/syllabus/chars_writing.jsonl');

  if (!fs.existsSync(vocabPath)) {
    throw new Error(`[SyllabusLoader] Missing critical syllabus file: ${vocabPath}`);
  }
  if (!fs.existsSync(charsPath)) {
    throw new Error(`[SyllabusLoader] Missing critical syllabus file: ${charsPath}`);
  }

  const words = new Map<string, SyllabusWord>();
  const wordsByLevel = new Map<HskLevel, SyllabusWord[]>([
    [1, []], [2, []], [3, []], [4, []], [5, []], [6, []],
  ]);

  const knowledgeItems = new Map<string, SyllabusKnowledgeItem>();
  const knowledgeItemsByLevel = new Map<HskLevel, SyllabusKnowledgeItem[]>([
    [1, []], [2, []], [3, []], [4, []], [5, []], [6, []],
  ]);

  const chars = new Map<string, SyllabusChar>();
  const charsByLevel = new Map<HskLevel, SyllabusChar[]>([
    [1, []], [2, []], [3, []], [4, []], [5, []], [6, []],
  ]);

  const writingChars = new Map<string, SyllabusWritingChar>();
  const writingCharsByLevel = new Map<HskLevel, SyllabusWritingChar[]>([
    [1, []], [2, []], [3, []], [4, []], [5, []], [6, []],
  ]);

  const allWordLevels = new Map<string, Set<number>>();
  let maxWordLength = 0;

  // 1. Ingest vocab.jsonl (Tier 1: 5,334 headwords & Tier 2: 5,334 knowledge items)
  const vocabRaw = fs.readFileSync(vocabPath, 'utf-8');
  const vocabLines = vocabRaw.split('\n');
  for (const line of vocabLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      const level = Number(obj.level) as HskLevel;
      // Strict guardrail: only levels 1 to 6
      if (level >= 1 && level <= 6 && obj.word) {
        const cleanWord = String(obj.clean_word || obj.word).trim();
        const rawWord = String(obj.raw_word || obj.word).trim();
        const pinyin = String(obj.pinyin || '').trim();

        if (!allWordLevels.has(cleanWord)) {
          allWordLevels.set(cleanWord, new Set());
        }
        allWordLevels.get(cleanWord)!.add(level);

        const entry: SyllabusWord = {
          id: `w_${level}_${cleanWord}`,
          word: cleanWord,
          pinyin,
          pos: obj.pos ? String(obj.pos).trim() : undefined,
          level,
          topics: Array.isArray(obj.topics) ? obj.topics.map(String) : [],
          source: String(obj.source || 'hsk30'),
          license_status: String(obj.license_status || 'permitted'),
        };
        words.set(cleanWord, entry);
        wordsByLevel.get(level)!.push(entry);
        if (cleanWord.length > maxWordLength) {
          maxWordLength = cleanWord.length;
        }

        const kKey = `${cleanWord}#${level}#${pinyin}#${rawWord}`;
        const kItem: SyllabusKnowledgeItem = {
          id: `k_${level}_${cleanWord}_${pinyin}_${rawWord}`,
          key: kKey,
          clean_word: cleanWord,
          raw_word: rawWord,
          word: cleanWord,
          pinyin,
          pos: obj.pos ? String(obj.pos).trim() : undefined,
          level,
          topics: Array.isArray(obj.topics) ? obj.topics.map(String) : [],
          source: String(obj.source || 'hsk30'),
          license_status: String(obj.license_status || 'permitted'),
          category: obj.category ? String(obj.category) : 'standard',
        };
        knowledgeItems.set(kKey, kItem);
        knowledgeItemsByLevel.get(level)!.push(kItem);
      }
    } catch {}
  }

  // 1.1 Ingest vocab_restored.jsonl (Tier 2: 66 restored items -> 5,400 total knowledge items)
  // Also ensure catalog.words and allWordLevels include all verified HSK items
  if (fs.existsSync(vocabRestoredPath)) {
    const restoredRaw = fs.readFileSync(vocabRestoredPath, 'utf-8');
    const restoredLines = restoredRaw.split('\n');
    for (const line of restoredLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed);
        const level = Number(obj.level) as HskLevel;
        if (level >= 1 && level <= 6) {
          const cleanWord = String(obj.clean_word || obj.word).trim();
          const rawWord = String(obj.raw_word || obj.word).trim();
          const pinyin = String(obj.pinyin || '').trim();

          if (!allWordLevels.has(cleanWord)) {
            allWordLevels.set(cleanWord, new Set());
          }
          allWordLevels.get(cleanWord)!.add(level);

          if (!words.has(cleanWord)) {
            const entry: SyllabusWord = {
              id: `w_${level}_${cleanWord}`,
              word: cleanWord,
              pinyin,
              pos: obj.pos ? String(obj.pos).trim() : undefined,
              level,
              topics: Array.isArray(obj.topics) ? obj.topics.map(String) : [],
              source: String(obj.source || 'clec_2025_restored'),
              license_status: String(obj.license_status || 'permitted'),
              category: obj.category ? String(obj.category) : undefined,
              restore_decision: obj.restore_decision ? String(obj.restore_decision) : undefined,
              restore_reason: obj.restore_reason ? String(obj.restore_reason) : undefined,
            };
            words.set(cleanWord, entry);
            wordsByLevel.get(level)!.push(entry);
            if (cleanWord.length > maxWordLength) {
              maxWordLength = cleanWord.length;
            }
          }

          const kKey = `${cleanWord}#${level}#${pinyin}#${rawWord}`;
          const kItem: SyllabusKnowledgeItem = {
            id: `k_${level}_${cleanWord}_${pinyin}_${rawWord}`,
            key: kKey,
            clean_word: cleanWord,
            raw_word: rawWord,
            word: cleanWord,
            pinyin,
            pos: obj.pos ? String(obj.pos).trim() : undefined,
            level,
            topics: Array.isArray(obj.topics) ? obj.topics.map(String) : [],
            source: String(obj.source || 'clec_2025_restored'),
            license_status: String(obj.license_status || 'permitted'),
            category: obj.category ? String(obj.category) : undefined,
            restore_decision: obj.restore_decision ? String(obj.restore_decision) : undefined,
            restore_reason: obj.restore_reason ? String(obj.restore_reason) : undefined,
          };
          knowledgeItems.set(kKey, kItem);
          knowledgeItemsByLevel.get(level)!.push(kItem);
        }
      } catch {}
    }
  }

  // Official cumulative writing targets benchmark per level
  const writingTargets: Record<HskLevel, number> = {
    1: 100, 2: 100, 3: 250, 4: 400, 5: 550, 6: 700,
  };

  // 2. Ingest chars.jsonl (Strict Level <= 6, strictly excluding Level 7+)
  const charsRaw = fs.readFileSync(charsPath, 'utf-8');
  const charsLines = charsRaw.split('\n');
  for (const line of charsLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      const level = Number(obj.level) as HskLevel;
      // Strict exclusion of level 7+
      if (level >= 1 && level <= 6 && obj.char) {
        const cleanChar = String(obj.char).trim();
        const entry: SyllabusChar = {
          char: cleanChar,
          level,
          is_recognition: true,
          writing_target: writingTargets[level],
        };
        chars.set(cleanChar, entry);
        charsByLevel.get(level)!.push(entry);
      }
    } catch {}
  }

  // 3. Ingest chars_writing.jsonl (700 writing characters HSK 1-6)
  if (fs.existsSync(charsWritingPath)) {
    const writingRaw = fs.readFileSync(charsWritingPath, 'utf-8');
    const writingLines = writingRaw.split('\n');
    for (const line of writingLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed);
        const level = Number(obj.level) as HskLevel;
        if (level >= 1 && level <= 6 && obj.char) {
          const cleanChar = String(obj.char).trim();
          const entry: SyllabusWritingChar = {
            char: cleanChar,
            level,
            is_writing: true,
          };
          writingChars.set(cleanChar, entry);
          writingCharsByLevel.get(level)!.push(entry);
        }
      } catch {}
    }
  }

  // 3. Load proper nouns from data/qbank/syllabus/names.txt
  const namesPath = path.resolve(process.cwd(), 'data/qbank/syllabus/names.txt');
  const properNouns = new Set<string>();
  if (fs.existsSync(namesPath)) {
    const namesRaw = fs.readFileSync(namesPath, 'utf-8');
    for (const line of namesRaw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        properNouns.add(trimmed);
      }
    }
  }

  catalogCache = {
    words,
    wordsByLevel,
    knowledgeItems,
    knowledgeItemsByLevel,
    chars,
    charsByLevel,
    writingChars,
    writingCharsByLevel,
    maxWordLength: Math.max(4, maxWordLength),
    allWordLevels,
    properNouns,
  };

  return catalogCache;
}

/**
 * Returns map of all 5,334 syllabus words (HSK 1–6) - Tier 1 for FMM Tokenizer.
 */
export function loadSyllabusVocab(): Map<string, SyllabusWord> {
  return getSyllabusCatalog().words;
}

/**
 * Returns set of approved proper nouns and place names (from names.txt).
 */
export function loadApprovedNames(): Set<string> {
  return getSyllabusCatalog().properNouns || new Set<string>();
}

/**
 * Returns map of all 5,400 syllabus knowledge items (HSK 1–6) - Tier 2 Knowledge Items.
 */
export function loadSyllabusKnowledgeItems(): Map<string, SyllabusKnowledgeItem> {
  return getSyllabusCatalog().knowledgeItems;
}

/**
 * Returns map of all 1,940 syllabus recognition characters (HSK 1–6).
 */
export function loadSyllabusChars(): Map<string, SyllabusChar> {
  return getSyllabusCatalog().chars;
}

/**
 * Returns map of all 700 syllabus writing characters (HSK 1–6).
 */
export function loadSyllabusWritingChars(): Map<string, SyllabusWritingChar> {
  return getSyllabusCatalog().writingChars;
}

/**
 * Returns metadata of the HSK 3.0 official grammar catalog standard (CLEC 2021).
 */
export function getGrammarCatalogMetadata() {
  return {
    status: 'missing' as const,
    totalItems: 572,
    denominatorScope: 'clec_2021_hsk1_6_official_grammar_standard',
    byLevel: {
      1: 48,
      2: 81,
      3: 141,
      4: 144,
      5: 98,
      6: 60,
    },
  };
}

export interface GrammarVerificationResult {
  status: 'missing' | 'unverified';
  isComplete: boolean;
  coveragePercentage: number;
  totalStandardItems: number;
  unverifiedDeclaredPoints: string[];
  reason: string;
}

/**
 * Evaluates grammar metadata against the CLEC 2021 standard.
 * Because the official catalog is not yet digitized in the workspace,
 * all declared grammar points are explicitly flagged as 'unverified',
 * coverage percentage remains 0.0%, and isComplete is strictly false.
 */
export function verifyGrammarMetadata(
  declaredGrammarPoints?: string | string[]
): GrammarVerificationResult {
  const points: string[] = [];
  if (Array.isArray(declaredGrammarPoints)) {
    points.push(...declaredGrammarPoints.map(String).filter((s) => s.trim().length > 0));
  } else if (typeof declaredGrammarPoints === 'string' && declaredGrammarPoints.trim()) {
    points.push(...declaredGrammarPoints.split(/[,;|，、]+/).map((s) => s.trim()).filter(Boolean));
  }

  return {
    status: points.length > 0 ? 'unverified' : 'missing',
    isComplete: false,
    coveragePercentage: 0.0,
    totalStandardItems: 572,
    unverifiedDeclaredPoints: points,
    reason: 'Danh mục ngữ pháp chính thức (CLEC 2021: 572 điểm) chưa được số hóa trong hệ thống.',
  };
}

// ============================================================================
// 3. High-Performance Forward Maximum Matching (FMM) Chinese Tokenizer
// ============================================================================

/**
 * Scans Chinese text using Forward Maximum Matching (window size 1..4)
 * against the official 5,334 HSK syllabus dictionary.
 */
export function scanChineseWords(
  text: string,
  vocabMap?: Map<string, SyllabusWord>
): SyllabusWord[] {
  if (!text || typeof text !== 'string') return [];
  const map = vocabMap || loadSyllabusVocab();
  const results: SyllabusWord[] = [];
  const clean = text.normalize('NFC');
  let i = 0;

  while (i < clean.length) {
    let matched: SyllabusWord | null = null;
    let matchLen = 0;
    const window = Math.min(4, clean.length - i);
    for (let len = window; len >= 1; len--) {
      const sub = clean.slice(i, i + len);
      const entry = map.get(sub);
      if (entry) {
        matched = entry;
        matchLen = len;
        break;
      }
    }
    if (matched) {
      results.push(matched);
      i += matchLen;
    } else {
      i++;
    }
  }
  return results;
}

/**
 * Segments Chinese text using Forward Maximum Matching against the 5,334 syllabus dictionary.
 * Guaranteed O(L) time complexity where L is text length.
 */
export function segmentSyllabusTokens(
  text: string,
  vocabSet?: Set<string>,
  maxWordLen = 4
): string[] {
  if (!text || typeof text !== 'string') return [];
  const set = vocabSet || new Set(loadSyllabusVocab().keys());
  // Normalize and remove punctuation/whitespace
  const clean = text.normalize('NFC').replace(/[\s\p{P}\p{S}\d]+/gu, '');
  const tokens: string[] = [];
  let i = 0;

  while (i < clean.length) {
    let matched: string | null = null;
    const window = Math.min(maxWordLen, clean.length - i);
    for (let len = window; len >= 1; len--) {
      const sub = clean.slice(i, i + len);
      if (set.has(sub)) {
        matched = sub;
        break;
      }
    }
    if (matched) {
      tokens.push(matched);
      i += matched.length;
    } else {
      i++;
    }
  }
  return tokens;
}

// ============================================================================
// 4. Safe Additive SQLite Migrations & Hash Signatures
// ============================================================================

/**
 * Computes deterministic SHA-256 content hash on normalized NFC text matching Python QbQuestion.compute_hash
 */
export function computeContentHash(stem: string, options: string[], answerIdx: number): string {
  const normStem = (stem || '').trim().normalize('NFC');
  const normOpts = (options || []).map((opt) => (opt || '').trim().normalize('NFC')).join('|');
  const raw = `${normStem}##${normOpts}##${answerIdx}`;
  return crypto.createHash('sha256').update(raw, 'utf-8').digest('hex');
}

/**
 * Computes near-duplicate signature: Normalized stem + sorted option tokens.
 * Catches shuffled A/B/C/D choices where stem and choices are identical but order differs.
 */
export function computeNearDuplicateSignature(stem: string, options: string[]): string {
  const cleanStem = (stem || '')
    .normalize('NFC')
    .replace(/[\s\p{P}\p{S}\d]+/gu, '');

  const cleanSortedOpts = (options || [])
    .map((opt) =>
      (opt || '')
        .normalize('NFC')
        .replace(/[\s\p{P}\p{S}\d]+/gu, '')
    )
    .sort()
    .join('||');

  const payload = `${cleanStem}##${cleanSortedOpts}`;
  return crypto.createHash('sha256').update(payload, 'utf-8').digest('hex');
}

/**
 * Safe additive SQLite migrations:
 * Inspects existing columns via PRAGMA table_info, safely executes ALTER TABLE ADD COLUMN,
 * creates high-performance indexes, and backfills legacy null columns.
 */
export function applyAdditiveQBankMigrations(db: DatabaseSync): void {
  // 0. Ensure base tables exist if fresh database
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        pinyin TEXT,
        explanation_vi TEXT NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        illustration_theme TEXT,
        options_images TEXT DEFAULT '[]',
        topic TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        provider_used TEXT,
        content_hash TEXT,
        near_duplicate_signature TEXT,
        tested_vocab TEXT,
        passage TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        rejection_note TEXT,
        batch_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS pending_questions (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        pinyin TEXT,
        explanation_vi TEXT NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        illustration_theme TEXT,
        options_images TEXT DEFAULT '[]',
        topic TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        provider_used TEXT,
        rejection_note TEXT,
        content_hash TEXT,
        near_duplicate_signature TEXT,
        tested_vocab TEXT,
        passage TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('[Migrations] Warning ensuring base tables exist:', err);
  }

  // 1. Column Migration for table `questions`
  try {
    const qCols = (db.prepare('PRAGMA table_info(questions)').all() as any[]).map((c) => c.name);

    if (!qCols.includes('options_images')) {
      db.exec("ALTER TABLE questions ADD COLUMN options_images TEXT DEFAULT '[]';");
    }
    if (!qCols.includes('content_hash')) {
      db.exec('ALTER TABLE questions ADD COLUMN content_hash TEXT;');
    }
    if (!qCols.includes('near_duplicate_signature')) {
      db.exec('ALTER TABLE questions ADD COLUMN near_duplicate_signature TEXT;');
    }
    if (!qCols.includes('tested_vocab')) {
      db.exec('ALTER TABLE questions ADD COLUMN tested_vocab TEXT;');
    }
    if (!qCols.includes('passage')) {
      db.exec('ALTER TABLE questions ADD COLUMN passage TEXT;');
    }
    if (!qCols.includes('is_active')) {
      db.exec('ALTER TABLE questions ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;');
    }
    if (!qCols.includes('rejection_note')) {
      db.exec('ALTER TABLE questions ADD COLUMN rejection_note TEXT;');
    }
    if (!qCols.includes('batch_id')) {
      db.exec('ALTER TABLE questions ADD COLUMN batch_id TEXT;');
    }
  } catch (err) {
    console.warn('[Migrations] Warning altering table questions:', err);
  }

  // 2. Column Migration for table `pending_questions`
  try {
    const pCols = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);

    if (!pCols.includes('options_images')) {
      db.exec("ALTER TABLE pending_questions ADD COLUMN options_images TEXT DEFAULT '[]';");
    }
    if (!pCols.includes('content_hash')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN content_hash TEXT;');
    }
    if (!pCols.includes('near_duplicate_signature')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN near_duplicate_signature TEXT;');
    }
    if (!pCols.includes('tested_vocab')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN tested_vocab TEXT;');
    }
    if (!pCols.includes('passage')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN passage TEXT;');
    }
    if (!pCols.includes('is_active')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;');
    }
    if (!pCols.includes('rejection_note')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN rejection_note TEXT;');
    }
    if (!pCols.includes('batch_id')) {
      db.exec('ALTER TABLE pending_questions ADD COLUMN batch_id TEXT;');
    }
  } catch (err) {
    console.warn('[Migrations] Warning altering table pending_questions:', err);
  }

  // 3. Performance & Integrity Indexes
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_questions_hash ON questions(content_hash);
      CREATE INDEX IF NOT EXISTS idx_questions_near_dup ON questions(near_duplicate_signature);
      CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
      CREATE INDEX IF NOT EXISTS idx_questions_active_status ON questions(is_active, status);
      CREATE INDEX IF NOT EXISTS idx_questions_level_active ON questions(level, is_active, status);
      CREATE INDEX IF NOT EXISTS idx_questions_level_skill_part ON questions(level, skill, part_type);
      CREATE INDEX IF NOT EXISTS idx_questions_batch ON questions(batch_id);

      CREATE INDEX IF NOT EXISTS idx_pending_hash ON pending_questions(content_hash);
      CREATE INDEX IF NOT EXISTS idx_pending_near_dup ON pending_questions(near_duplicate_signature);
      CREATE INDEX IF NOT EXISTS idx_pending_active ON pending_questions(is_active);
      CREATE INDEX IF NOT EXISTS idx_pending_level_skill_part ON pending_questions(level, skill, part_type);
      CREATE INDEX IF NOT EXISTS idx_pending_batch_id ON pending_questions(batch_id);
    `);
  } catch (err) {
    console.warn('[Migrations] Warning creating indexes:', err);
  }

  // 4. Safe Backfill for legacy rows
  try {
    db.exec('UPDATE questions SET is_active = 1 WHERE is_active IS NULL;');
    db.exec('UPDATE pending_questions SET is_active = 1 WHERE is_active IS NULL;');

    // Backfill content_hash and near_duplicate_signature for questions where missing
    const nullHashRows: any[] = db.prepare(
      'SELECT id, stem, options, answer_idx FROM questions WHERE content_hash IS NULL OR near_duplicate_signature IS NULL'
    ).all();

    if (nullHashRows.length > 0) {
      const updateStmt = db.prepare(
        'UPDATE questions SET content_hash = ?, near_duplicate_signature = ? WHERE id = ?'
      );
      for (const row of nullHashRows) {
        let opts: string[] = [];
        try {
          opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
        } catch {
          opts = [];
        }
        const hash = computeContentHash(row.stem, opts, Number(row.answer_idx));
        const nearDup = computeNearDuplicateSignature(row.stem, opts);
        updateStmt.run(hash, nearDup, row.id);
      }
    }

    // Backfill near_duplicate_signature for pending_questions where missing
    const nullPendingNearDup: any[] = db.prepare(
      'SELECT id, stem, options FROM pending_questions WHERE near_duplicate_signature IS NULL'
    ).all();

    if (nullPendingNearDup.length > 0) {
      const updatePendingStmt = db.prepare(
        'UPDATE pending_questions SET near_duplicate_signature = ? WHERE id = ?'
      );
      for (const row of nullPendingNearDup) {
        let opts: string[] = [];
        try {
          opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
        } catch {
          opts = [];
        }
        const nearDup = computeNearDuplicateSignature(row.stem, opts);
        updatePendingStmt.run(nearDup, row.id);
      }
    }
  } catch (err) {
    console.warn('[Migrations] Warning backfilling legacy data:', err);
  }
}

// ============================================================================
// 4.1. Tested Vocab Heuristics & Knowledge Linking Model
// ============================================================================

export const HIGH_FREQUENCY_FUNCTION_WORDS = new Set<string>([
  '我', '你', '他', '她', '它', '我们', '你们', '他们',
  '的', '地', '得', '了', '着', '过',
  '吗', '呢', '吧', '啊',
  '很', '在', '有', '是', '这', '那', '点', '后', '前', '边',
]);

export function isWordInStemBlank(stem: string, word: string): boolean {
  return stem.includes(word) || /_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\]/.test(stem);
}

export function resolveTestedVocab(
  question: {
    stem: string;
    options: string[];
    answerIdx: number;
    tested_vocab?: string | null;
    level: HskLevel;
    skill: string;
    part_type: string;
    passage?: string | null;
  },
  vocabMap: Map<string, SyllabusWord>
): { testedWords: Set<string>; evidence: string } {
  const testedWords = new Set<string>();
  const correctOption = (question.options[question.answerIdx] || '').trim();

  // STEP 1: If question has explicit tested_vocab column
  if (question.tested_vocab) {
    try {
      const parsed = JSON.parse(question.tested_vocab);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of candidates) {
        const w = String(item).trim();
        if (vocabMap.has(w)) {
          if (correctOption.includes(w) || isWordInStemBlank(question.stem, w) || question.options.includes(w)) {
            testedWords.add(w);
          }
        }
      }
    } catch {
      const parts = question.tested_vocab.split(/[,，|||]/).map((s) => s.trim());
      for (const p of parts) {
        if (vocabMap.has(p) && (correctOption.includes(p) || isWordInStemBlank(question.stem, p) || question.options.includes(p))) {
          testedWords.add(p);
        }
      }
    }
    if (testedWords.size > 0) {
      return { testedWords, evidence: 'explicit_tested_vocab_column' };
    }
  }

  // STEP 2: Cloze / Fill in the blank heuristic
  const isClozeQuestion =
    /_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\]/.test(question.stem) ||
    question.part_type.includes('fill_blank');

  if (isClozeQuestion && correctOption) {
    if (vocabMap.has(correctOption)) {
      testedWords.add(correctOption);
      return { testedWords, evidence: 'cloze_exact_option_match' };
    }
    const scanned = scanChineseWords(correctOption, vocabMap);
    const contentWords = scanned.filter((w) => !HIGH_FREQUENCY_FUNCTION_WORDS.has(w.word));
    if (contentWords.length > 0) {
      const matchingLevel = contentWords.find((w) => w.level === question.level);
      testedWords.add(matchingLevel ? matchingLevel.word : contentWords[0].word);
      return { testedWords, evidence: 'cloze_content_word_extracted' };
    }
  }

  // STEP 3: Single Word / Picture Match Discrimination
  const isSingleWordDiscrimination =
    question.options.length > 0 &&
    question.options.every((opt) => opt.length <= 4 && !opt.includes('。') && !opt.includes('？'));

  if (isSingleWordDiscrimination && vocabMap.has(correctOption)) {
    testedWords.add(correctOption);
    return { testedWords, evidence: 'picture_match_single_word_target' };
  }

  // STEP 4: Reading Comprehension / Long Sentence Options
  if (correctOption) {
    const scanned = scanChineseWords(correctOption, vocabMap);
    const contentWords = scanned.filter((w) => !HIGH_FREQUENCY_FUNCTION_WORDS.has(w.word));

    const exactLevelWords = contentWords.filter((w) => w.level === question.level);
    if (exactLevelWords.length > 0) {
      exactLevelWords.slice(0, 2).forEach((w) => testedWords.add(w.word));
      return { testedWords, evidence: 'reading_comprehension_filtered_content_word' };
    }

    if (contentWords.length > 0) {
      const sorted = [...contentWords].sort((a, b) => b.level - a.level);
      testedWords.add(sorted[0].word);
      return { testedWords, evidence: 'reading_comprehension_fallback_content_word' };
    }
  }

  return { testedWords, evidence: 'heuristic_empty' };
}

export function extractContextVocab(
  question: {
    stem: string;
    passage?: string | null;
    options: string[];
    answerIdx: number;
  },
  testedWords: Set<string>,
  vocabMap: Map<string, SyllabusWord>
): Set<string> {
  const contextWords = new Set<string>();
  const distractorText = question.options.filter((_, idx) => idx !== question.answerIdx).join(' ');
  const fullContextText = `${question.stem || ''} ${question.passage || ''} ${distractorText}`;

  const scanned = scanChineseWords(fullContextText, vocabMap);
  for (const item of scanned) {
    if (!testedWords.has(item.word)) {
      contextWords.add(item.word);
    }
  }

  return contextWords;
}

export function extractHanziLinks(
  question: {
    id: string;
    stem: string;
    passage?: string | null;
    options: string[];
    answerIdx: number;
    skill: string;
    part_type: string;
    level: HskLevel;
  },
  charsCatalog: Map<string, SyllabusChar>,
  writingCharsCatalog: Map<string, SyllabusWritingChar>
): {
  recognitionLinks: KnowledgeLink[];
  writingLinks: KnowledgeLink[];
} {
  const recognitionLinks: KnowledgeLink[] = [];
  const writingLinks: KnowledgeLink[] = [];

  const fullText = `${question.stem || ''} ${question.passage || ''} ${question.options.join(' ')}`;
  const hanziMatches = fullText.match(/[\u4e00-\u9fa5]/g) || [];
  const uniqueChars = new Set(hanziMatches);

  for (const char of uniqueChars) {
    const sylChar = charsCatalog.get(char);
    if (sylChar) {
      recognitionLinks.push({
        questionId: question.id,
        knowledgeType: 'hanzi_recognition',
        knowledgeId: `char_rec_${sylChar.level}_${char}`,
        knowledgeKey: char,
        level: sylChar.level,
        role: 'recognized',
        evidence: 'char_appearance_in_question_text',
      });
    }
  }

  // Writing characters: strictly require skill === 'writing' or writing part_type
  if (question.skill === 'writing' || question.part_type.includes('write')) {
    const correctOpt = (question.options[question.answerIdx] || '').trim();
    const writeCandidates = correctOpt || question.stem;
    const writeMatches = writeCandidates.match(/[\u4e00-\u9fa5]/g) || [];
    for (const char of new Set(writeMatches)) {
      const wChar = writingCharsCatalog.get(char);
      if (wChar) {
        writingLinks.push({
          questionId: question.id,
          knowledgeType: 'hanzi_writing',
          knowledgeId: `char_wri_${wChar.level}_${char}`,
          knowledgeKey: char,
          level: wChar.level,
          role: 'written',
          evidence: 'writing_skill_production_target',
        });
      }
    }
  }

  return { recognitionLinks, writingLinks };
}

/**
 * Strips tone marks and diacritics from pinyin for robust polyphone matching.
 */
export function stripPinyinTones(pinyin: string): string {
  if (!pinyin) return '';
  return pinyin
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/ü/g, 'v');
}

/**
 * Checks whether two pinyin strings match (exact tone or tone-insensitive).
 */
export function isPinyinMatch(pinyinA: string, pinyinB: string): boolean {
  if (!pinyinA || !pinyinB) return false;
  const aNorm = pinyinA.trim().toLowerCase();
  const bNorm = pinyinB.trim().toLowerCase();
  if (aNorm === bNorm) return true;
  return stripPinyinTones(aNorm) === stripPinyinTones(bNorm);
}

/**
 * Disambiguates candidate KnowledgeItemRecords for a word (e.g. polyphones/polysemes)
 * using the question's level, pinyin column, options, and tested_vocab metadata.
 */
export function matchKnowledgeRecords(
  candidates: KnowledgeItemRecord[],
  questionContext: {
    level: HskLevel;
    pinyin?: string | null;
    stem?: string;
    options?: string[];
    answerIdx?: number;
    tested_vocab?: string | null;
  }
): KnowledgeItemRecord[] {
  if (candidates.length <= 1) return candidates;

  // 1. Direct level filter
  const levelMatches = candidates.filter((c) => c.level === questionContext.level);

  // 2. Extract potential pinyin clues from question
  const pinyinClues: string[] = [];
  if (questionContext.pinyin) {
    pinyinClues.push(questionContext.pinyin);
  }
  if (questionContext.tested_vocab) {
    try {
      const parsed = JSON.parse(questionContext.tested_vocab);
      if (typeof parsed === 'object' && parsed !== null && parsed.pinyin) {
        pinyinClues.push(String(parsed.pinyin));
      }
    } catch {}
  }
  if (questionContext.options && questionContext.options.length > 0) {
    const correctOpt = questionContext.options[questionContext.answerIdx ?? 0] || '';
    if (/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(correctOpt)) {
      pinyinClues.push(correctOpt);
    }
  }

  // 3. If pinyin clues exist, check candidate pinyins
  if (pinyinClues.length > 0) {
    const clueText = pinyinClues.join(' ');
    const pool = levelMatches.length > 0 ? levelMatches : candidates;
    const pinyinMatches = pool.filter((c) => {
      if (!c.pinyin) return false;
      if (clueText.includes(c.pinyin)) return true;
      const strippedClue = stripPinyinTones(clueText);
      const strippedTarget = stripPinyinTones(c.pinyin);
      const tokens = strippedClue.split(/[\s,.;:!?'"()-]+/);
      return tokens.includes(strippedTarget);
    });
    if (pinyinMatches.length > 0) {
      return pinyinMatches;
    }
  }

  // 4. If level matched, return level matches
  if (levelMatches.length > 0) {
    return levelMatches;
  }

  // 5. Fallback: closest level
  const sorted = [...candidates].sort((a, b) => Math.abs(a.level - questionContext.level) - Math.abs(b.level - questionContext.level));
  return [sorted[0]];
}

export interface DistractorRationaleItem {
  optionIdx: number;
  optionText: string;
  rationaleVi: string;
  isCorrect?: boolean;
}

export interface FormattedExplanationPayload {
  summaryVi: string;
  correctExplanationVi: string;
  distractorRationales: DistractorRationaleItem[];
}

/**
 * Formats Vietnamese explanation text with structured distractor rationales
 * suitable for storage inside the existing explanation_vi column without schema mutation.
 */
export function formatExplanationWithDistractorRationales(
  payload: FormattedExplanationPayload
): string {
  const lines: string[] = [];
  if (payload.summaryVi) {
    lines.push(payload.summaryVi.trim());
  }
  if (payload.correctExplanationVi) {
    lines.push(`- Đáp án đúng: ${payload.correctExplanationVi.trim()}`);
  }
  if (payload.distractorRationales && payload.distractorRationales.length > 0) {
    lines.push(`- Phân tích phương án nhiễu:`);
    for (const d of payload.distractorRationales) {
      const label = String.fromCharCode(65 + d.optionIdx);
      let rat = String(d.rationaleVi ?? (d as any).rationale_vi ?? '').trim();
      if (rat && !/[.!?。！？]$/.test(rat)) {
        rat += '.';
      }
      lines.push(`  + Phương án ${label} (${d.optionText}): ${rat}`);
    }
  }
  const result = lines.join('\n');
  if (result && !/[.!?。！？]$/.test(result.trim())) {
    return result.trim() + '.';
  }
  return result;
}

/**
 * Parses distractor rationales out of explanation_vi text.
 */
export function parseExplanationDistractorRationales(
  explanationVi: string,
  options?: string[],
  answerIdx?: number
): {
  summaryVi: string;
  correctExplanationVi?: string;
  distractors: DistractorRationaleItem[];
  hasDistractorRationales: boolean;
} {
  if (!explanationVi || typeof explanationVi !== 'string') {
    return { summaryVi: '', distractors: [], hasDistractorRationales: false };
  }

  const distractors: DistractorRationaleItem[] = [];
  const lines = explanationVi.split('\n').map((l) => l.trim()).filter(Boolean);

  const optPattern = /(?:[+\-*•\[]\s*)?Phương án(?:\s+sai)?\s+([A-D])(?:\s*\((.*?)\))?[\]:]*[:：\-]\s*(.+)/i;

  for (const line of lines) {
    const match = line.match(optPattern);
    if (match) {
      const letter = match[1].toUpperCase();
      const optIdx = letter.charCodeAt(0) - 65;
      const text = match[2] || (options && options[optIdx]) || '';
      const rationale = match[3] || '';
      distractors.push({
        optionIdx: optIdx,
        optionText: text,
        rationaleVi: rationale,
        isCorrect: answerIdx !== undefined ? optIdx === answerIdx : false,
      });
    }
  }

  if (distractors.length === 0 && Array.isArray(options) && options.length > 0) {
    options.forEach((opt, idx) => {
      if (idx !== answerIdx && opt && explanationVi.includes(opt)) {
        distractors.push({
          optionIdx: idx,
          optionText: opt,
          rationaleVi: `Phương án '${opt}' được phân tích là không phù hợp trong ngữ cảnh câu.`,
          isCorrect: false,
        });
      }
    });
  }

  const hasDistractorRationales = distractors.length > 0;
  return {
    summaryVi: lines[0] || explanationVi,
    distractors,
    hasDistractorRationales,
  };
}

export interface ParsedExplanationMetadata {
  difficulty_tier?: 'tier1_difficult' | 'tier2_very_difficult' | 'tier3_challenge';
  trap_type?: string;
  target_grammar?: string;
  target_vocabulary?: string;
}

/**
 * Extracts structured pedagogical metadata tags embedded in explanation_vi.
 */
export function parseExplanationMetadata(explanationVi: string): ParsedExplanationMetadata {
  if (!explanationVi || typeof explanationVi !== 'string') {
    return {};
  }
  const result: ParsedExplanationMetadata = {};

  // Pattern tag block: [Cấu trúc bẫy: X | Độ khó: Y | Ngữ pháp: Z]
  const tagBlockMatch = explanationVi.match(
    /\[(?:Cấu trúc bẫy|Bẫy|Trap):\s*([^|\]]+)(?:\|\s*(?:Độ khó|Difficulty):\s*([^|\]]+))?(?:\|\s*(?:Ngữ pháp|Grammar):\s*([^|\]]+))?\]/i
  );
  if (tagBlockMatch) {
    if (tagBlockMatch[1]) result.trap_type = tagBlockMatch[1].trim();
    if (tagBlockMatch[2]) result.difficulty_tier = tagBlockMatch[2].trim() as any;
    if (tagBlockMatch[3]) result.target_grammar = tagBlockMatch[3].trim();
  }

  // Fallbacks
  if (!result.difficulty_tier) {
    const diffMatch = explanationVi.match(/(?:Độ khó|Cấp độ khó|difficulty_tier|difficulty):\s*(tier[123]_[a-z_]+)/i);
    if (diffMatch) result.difficulty_tier = diffMatch[1].trim() as any;
  }
  if (!result.trap_type) {
    const trapMatch = explanationVi.match(/(?:Cấu trúc bẫy|Loại bẫy|trap_type|trap):\s*([a-z0-9_]+)/i);
    if (trapMatch) result.trap_type = trapMatch[1].trim();
  }
  if (!result.target_grammar) {
    const gramMatch = explanationVi.match(/(?:Ngữ pháp mục tiêu|Ngữ pháp|target_grammar|grammar):\s*([^|\n\]]+)/i);
    if (gramMatch) result.target_grammar = gramMatch[1].replace(/[\.;,\s]+$/, '').trim();
  }

  return result;
}

export function buildKnowledgeLinkingModel(db: DatabaseSync): InMemoryKnowledgeLinkingModel {
  const catalog = getSyllabusCatalog();
  const forwardIndex = new Map<string, QuestionKnowledgeProfile>();
  const invertedIndex = new Map<string, KnowledgeItemRecord>();

  const uniqueQuestions = {
    allApproved: new Set<string>(),
    byLevel: new Map<HskLevel, Set<string>>([
      [1, new Set()], [2, new Set()], [3, new Set()], [4, new Set()], [5, new Set()], [6, new Set()],
    ]),
    bySkill: new Map<string, Set<string>>(),
    byPartType: new Map<string, Set<string>>(),
  };

  const vocabIndex = new Map<string, KnowledgeItemRecord>();
  const vocabMultiIndex = new Map<string, KnowledgeItemRecord[]>();
  const charRecognitionIndex = new Map<string, KnowledgeItemRecord>();
  const charWritingIndex = new Map<string, KnowledgeItemRecord>();
  const grammarIndex = new Map<string, KnowledgeItemRecord>();

  // Initialize invertedIndex with all 5,400 knowledgeItems
  for (const item of catalog.knowledgeItems.values()) {
    const record: KnowledgeItemRecord = {
      id: `vocab:${item.level}:${item.key}`,
      type: 'vocab',
      key: item.clean_word,
      level: item.level,
      pinyin: item.pinyin,
      pos: item.pos,
      postings: [],
      uniqueQuestionCount: 0,
      directlyTestedCount: 0,
      contextualCount: 0,
      distinctPartTypes: [],
      distinctStemsCount: 0,
      tier: 0,
      tierLabel: 'uncovered',
      isOverused: false,
    };
    invertedIndex.set(`vocab:${item.level}:${item.key}`, record);

    if (!vocabMultiIndex.has(item.clean_word)) {
      vocabMultiIndex.set(item.clean_word, []);
    }
    vocabMultiIndex.get(item.clean_word)!.push(record);

    if (!vocabIndex.has(item.clean_word)) {
      vocabIndex.set(item.clean_word, record);
    }
  }

  // Initialize recognition chars in invertedIndex
  for (const c of catalog.chars.values()) {
    const recId = `char_rec:${c.level}:${c.char}`;
    const record: KnowledgeItemRecord = {
      id: recId,
      type: 'hanzi_recognition',
      key: c.char,
      level: c.level,
      postings: [],
      uniqueQuestionCount: 0,
      directlyTestedCount: 0,
      contextualCount: 0,
      distinctPartTypes: [],
      distinctStemsCount: 0,
    };
    invertedIndex.set(recId, record);
    charRecognitionIndex.set(c.char, record);
  }

  // Initialize writing chars in invertedIndex
  for (const w of catalog.writingChars.values()) {
    const wriId = `char_wri:${w.level}:${w.char}`;
    const record: KnowledgeItemRecord = {
      id: wriId,
      type: 'hanzi_writing',
      key: w.char,
      level: w.level,
      postings: [],
      uniqueQuestionCount: 0,
      directlyTestedCount: 0,
      contextualCount: 0,
      distinctPartTypes: [],
      distinctStemsCount: 0,
    };
    invertedIndex.set(wriId, record);
    charWritingIndex.set(w.char, record);
  }

  // Query approved questions
  let rows: any[] = [];
  try {
    let hasPinyin = false;
    try {
      const cols = db.prepare("PRAGMA table_info(questions)").all() as any[];
      hasPinyin = cols.some((c) => c.name === 'pinyin');
    } catch {}

    const selectQuery = hasPinyin
      ? `SELECT id, stem, passage, options, answer_idx, tested_vocab, level, skill, part_type, topic, pinyin
         FROM questions
         WHERE status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6
         ORDER BY level, skill, part_type, id`
      : `SELECT id, stem, passage, options, answer_idx, tested_vocab, level, skill, part_type, topic
         FROM questions
         WHERE status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6
         ORDER BY level, skill, part_type, id`;

    rows = db.prepare(selectQuery).all() as any[];
  } catch {
    rows = [];
  }

  for (const row of rows) {
    const qId = String(row.id);
    const qLevel = Number(row.level) as HskLevel;
    const skill = String(row.skill || 'reading');
    const partType = String(row.part_type || '');
    const stem = String(row.stem || '');
    const passage = row.passage ? String(row.passage) : undefined;
    const answerIdx = Number(row.answer_idx ?? 0);
    const pinyin = row.pinyin ? String(row.pinyin) : undefined;

    let options: string[] = [];
    try {
      options = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
    } catch {
      options = [];
    }
    const correctOption = (options[answerIdx] || '').trim();

    // Track unique question invariant
    uniqueQuestions.allApproved.add(qId);
    if (uniqueQuestions.byLevel.has(qLevel)) {
      uniqueQuestions.byLevel.get(qLevel)!.add(qId);
    }
    if (!uniqueQuestions.bySkill.has(skill)) {
      uniqueQuestions.bySkill.set(skill, new Set());
    }
    uniqueQuestions.bySkill.get(skill)!.add(qId);
    if (!uniqueQuestions.byPartType.has(partType)) {
      uniqueQuestions.byPartType.set(partType, new Set());
    }
    uniqueQuestions.byPartType.get(partType)!.add(qId);

    // Resolve tested and context vocab
    const { testedWords, evidence: testedEvidence } = resolveTestedVocab(
      {
        stem,
        options,
        answerIdx,
        tested_vocab: row.tested_vocab,
        level: qLevel,
        skill,
        part_type: partType,
        passage,
      },
      catalog.words
    );

    const contextWords = extractContextVocab(
      {
        stem,
        passage,
        options,
        answerIdx,
      },
      testedWords,
      catalog.words
    );

    const links: KnowledgeLink[] = [];

    // Tested vocab links (Multi-entry inverted index for polyphones/polysemes)
    for (const tw of testedWords) {
      const candidates = vocabMultiIndex.get(tw) || [];
      const matchedRecords = matchKnowledgeRecords(candidates, {
        level: qLevel,
        pinyin,
        stem,
        options,
        answerIdx,
        tested_vocab: row.tested_vocab,
      });

      if (matchedRecords.length > 0) {
        for (const rec of matchedRecords) {
          rec.postings.push({
            questionId: qId,
            level: qLevel,
            skill,
            part_type: partType,
            stem,
            role: 'directly_tested',
            evidence: testedEvidence,
          });

          const link: KnowledgeLink = {
            questionId: qId,
            knowledgeType: 'vocab',
            knowledgeId: rec.id,
            knowledgeKey: tw,
            level: rec.level,
            role: 'directly_tested',
            evidence: testedEvidence,
          };
          links.push(link);
        }
      } else {
        const sylWord = catalog.words.get(tw);
        const linkLevel = sylWord ? sylWord.level : qLevel;
        links.push({
          questionId: qId,
          knowledgeType: 'vocab',
          knowledgeId: `vocab:${linkLevel}:${tw}`,
          knowledgeKey: tw,
          level: linkLevel,
          role: 'directly_tested',
          evidence: testedEvidence,
        });
      }
    }

    // Context vocab links (Multi-entry inverted index for polyphones/polysemes)
    for (const cw of contextWords) {
      const candidates = vocabMultiIndex.get(cw) || [];
      const matchedRecords = matchKnowledgeRecords(candidates, {
        level: qLevel,
        pinyin,
        stem,
        options,
        answerIdx,
        tested_vocab: row.tested_vocab,
      });

      if (matchedRecords.length > 0) {
        for (const rec of matchedRecords) {
          rec.postings.push({
            questionId: qId,
            level: qLevel,
            skill,
            part_type: partType,
            stem,
            role: 'context',
            evidence: 'context_in_question_text',
          });

          const link: KnowledgeLink = {
            questionId: qId,
            knowledgeType: 'vocab',
            knowledgeId: rec.id,
            knowledgeKey: cw,
            level: rec.level,
            role: 'context',
            evidence: 'context_in_question_text',
          };
          links.push(link);
        }
      } else {
        const sylWord = catalog.words.get(cw);
        const linkLevel = sylWord ? sylWord.level : qLevel;
        links.push({
          questionId: qId,
          knowledgeType: 'vocab',
          knowledgeId: `vocab:${linkLevel}:${cw}`,
          knowledgeKey: cw,
          level: linkLevel,
          role: 'context',
          evidence: 'context_in_question_text',
        });
      }
    }

    // Hanzi recognition & writing links
    const { recognitionLinks, writingLinks } = extractHanziLinks(
      {
        id: qId,
        stem,
        passage,
        options,
        answerIdx,
        skill,
        part_type: partType,
        level: qLevel,
      },
      catalog.chars,
      catalog.writingChars
    );

    for (const rl of recognitionLinks) {
      links.push(rl);
      const rec = charRecognitionIndex.get(rl.knowledgeKey);
      if (rec) {
        rec.postings.push({
          questionId: qId,
          level: qLevel,
          skill,
          part_type: partType,
          stem,
          role: 'recognized',
          evidence: rl.evidence,
        });
      }
    }

    for (const wl of writingLinks) {
      links.push(wl);
      const rec = charWritingIndex.get(wl.knowledgeKey);
      if (rec) {
        rec.postings.push({
          questionId: qId,
          level: qLevel,
          skill,
          part_type: partType,
          stem,
          role: 'written',
          evidence: wl.evidence,
        });
      }
    }

    const profile: QuestionKnowledgeProfile = {
      questionId: qId,
      level: qLevel,
      skill,
      part_type: partType,
      stem,
      passage,
      options,
      answerIdx,
      correctOption,
      testedVocab: Array.from(testedWords),
      contextVocab: Array.from(contextWords),
      recognitionChars: recognitionLinks.map((l) => l.knowledgeKey),
      writingChars: writingLinks.map((l) => l.knowledgeKey),
      grammarPoints: [],
      topics: row.topic ? [String(row.topic)] : [],
      links,
    };

    forwardIndex.set(qId, profile);
  }

  // Finalize inverted index metrics
  for (const record of invertedIndex.values()) {
    const qIds = new Set(record.postings.map((p) => p.questionId));
    record.uniqueQuestionCount = qIds.size;

    const directPostings = record.postings.filter((p) => p.role === 'directly_tested');
    const directQIds = new Set(directPostings.map((p) => p.questionId));
    record.directlyTestedCount = directQIds.size;

    const contextPostings = record.postings.filter((p) => p.role === 'context');
    const contextQIds = new Set(contextPostings.map((p) => p.questionId));
    record.contextualCount = contextQIds.size;

    record.distinctPartTypes = Array.from(new Set(directPostings.map((p) => p.part_type)));
    record.distinctStemsCount = new Set(directPostings.map((p) => p.stem.trim().normalize('NFC'))).size;

    if (record.type === 'vocab') {
      if (record.directlyTestedCount >= 2) {
        if (record.distinctPartTypes.length >= 2 || record.distinctStemsCount >= 2) {
          record.tier = 3;
          record.tierLabel = 'reinforced';
        } else {
          record.tier = 2;
          record.tierLabel = 'directly_tested';
        }
      } else if (record.directlyTestedCount === 1) {
        record.tier = 2;
        record.tierLabel = 'directly_tested';
      } else if (record.contextualCount > 0) {
        record.tier = 1;
        record.tierLabel = 'contextual_appearance';
      } else {
        record.tier = 0;
        record.tierLabel = 'uncovered';
      }
      record.isOverused = record.directlyTestedCount >= 5;
    }
  }

  return {
    forwardIndex,
    invertedIndex,
    uniqueQuestions,
    vocabIndex,
    vocabMultiIndex,
    charRecognitionIndex,
    charWritingIndex,
    grammarIndex,
  };
}

// ============================================================================
// 5. 4-Tier Vocabulary Coverage Tracker
// ============================================================================

/**
 * Computes the 4-Tier Vocabulary Coverage report across all 5,334 words.
 * Strictly queries approved active questions: `status = 'approved' AND is_active = 1`.
 */
export function computeVocabCoverage(
  db: DatabaseSync,
  options?: { overusedThreshold?: number; skipCache?: boolean }
): VocabCoverageReport {
  const now = Date.now();
  const overusedThreshold = options?.overusedThreshold ?? DEFAULT_COVERAGE_TARGETS.overusedVocabThreshold;

  // Use cached report if fresh (within 10s)
  if (!options?.skipCache) {
    const cached = coverageReportCacheByDb.get(db);
    if (cached && cached.expiresAt > now) {
      return cached.report;
    }
  }

  const catalog = getSyllabusCatalog();
  const vocabMap = catalog.words;

  // Inverted postings
  const directPostings = new Map<string, QuestionDirectTestRecord[]>();
  const contextPostings = new Map<string, QuestionContextRecord[]>();

  for (const word of vocabMap.keys()) {
    directPostings.set(word, []);
    contextPostings.set(word, []);
  }

  // Strictly query active approved questions
  let rows: any[] = [];
  try {
    const query = `
      SELECT id, stem, passage, options, answer_idx, tested_vocab, level, skill, part_type
      FROM questions
      WHERE status = 'approved' AND is_active = 1
    `;
    rows = db.prepare(query).all() as any[];
  } catch {
    rows = [];
  }

  for (const row of rows) {
    const qLevel = Number(row.level) as HskLevel;
    if (qLevel < 1 || qLevel > 6) continue;

    let optionsArr: string[] = [];
    try {
      optionsArr = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
    } catch {
      optionsArr = [];
    }
    const answerIdx = Number(row.answer_idx ?? 0);
    const correctOption = (optionsArr[answerIdx] || '').trim();

    // 1. Direct Tested extraction via robust heuristic
    const { testedWords } = resolveTestedVocab(
      {
        stem: String(row.stem || ''),
        options: optionsArr,
        answerIdx,
        tested_vocab: row.tested_vocab,
        level: qLevel,
        skill: String(row.skill || ''),
        part_type: String(row.part_type || ''),
        passage: row.passage ? String(row.passage) : undefined,
      },
      vocabMap
    );

    for (const tw of testedWords) {
      const list = directPostings.get(tw);
      if (list) {
        list.push({
          questionId: String(row.id),
          level: qLevel,
          skill: String(row.skill || ''),
          part_type: String(row.part_type || ''),
          stem: String(row.stem || ''),
        });
      }
    }

    // 2. Contextual Words extraction
    const contextSet = extractContextVocab(
      {
        stem: String(row.stem || ''),
        passage: row.passage ? String(row.passage) : undefined,
        options: optionsArr,
        answerIdx,
      },
      testedWords,
      vocabMap
    );

    for (const cw of contextSet) {
      const list = contextPostings.get(cw);
      if (list) {
        list.push({
          questionId: String(row.id),
          level: qLevel,
          skill: String(row.skill || ''),
          part_type: String(row.part_type || ''),
        });
      }
    }
  }

  // Aggregate into WordCoverageSummary
  const wordDetails = new Map<string, WordCoverageSummary>();
  const priorityMissingWords: SyllabusWord[] = [];
  const overusedWords: string[] = [];

  const overall = { tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 };
  const byLevel: Record<HskLevel, {
    totalWords: number;
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
    percentCoveredTier2Plus: number;
  }> = {
    1: { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 },
    2: { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 },
    3: { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 },
    4: { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 },
    5: { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 },
    6: { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 },
  };

  for (const [word, sylWord] of vocabMap.entries()) {
    const lvl = sylWord.level;
    const directList = directPostings.get(word) || [];
    const contextList = contextPostings.get(word) || [];

    const directlyTestedCount = directList.length;
    const contextualCount = contextList.length;
    const isOverused = directlyTestedCount >= overusedThreshold;

    if (isOverused) {
      overusedWords.push(word);
    }

    const distinctPartTypes = Array.from(new Set(directList.map((d) => d.part_type)));
    const distinctStems = new Set(directList.map((d) => d.stem.trim().normalize('NFC')));
    const distinctStemsCount = distinctStems.size;

    let tier: VocabTier = 0;
    let tierLabel: VocabTierLabel = 'uncovered';

    if (directlyTestedCount >= 2) {
      // Tier 3 requires diversity: distinct part types >= 2 OR distinct stems >= 2
      if (distinctPartTypes.length >= 2 || distinctStemsCount >= 2) {
        tier = 3;
        tierLabel = 'reinforced';
      } else {
        tier = 2;
        tierLabel = 'directly_tested';
      }
    } else if (directlyTestedCount === 1) {
      tier = 2;
      tierLabel = 'directly_tested';
    } else if (contextualCount > 0) {
      tier = 1;
      tierLabel = 'contextual_appearance';
    } else {
      tier = 0;
      tierLabel = 'uncovered';
    }

    if (tier === 0 || tier === 1) {
      priorityMissingWords.push(sylWord);
    }

    wordDetails.set(word, {
      word,
      level: lvl,
      pinyin: sylWord.pinyin,
      pos: sylWord.pos,
      tier,
      tierLabel,
      directlyTestedCount,
      contextualCount,
      distinctPartTypes,
      distinctStemsCount,
      isOverused,
    });

    // Counts
    byLevel[lvl].totalWords++;
    if (tier === 0) {
      overall.tier0++;
      byLevel[lvl].tier0++;
    } else if (tier === 1) {
      overall.tier1++;
      byLevel[lvl].tier1++;
    } else if (tier === 2) {
      overall.tier2++;
      byLevel[lvl].tier2++;
    } else if (tier === 3) {
      overall.tier3++;
      byLevel[lvl].tier3++;
    }
  }

  // Calculate percentages
  const totalWords = vocabMap.size;
  const coveredTier2Plus = overall.tier2 + overall.tier3;
  overall.percentCoveredTier2Plus = totalWords > 0 ? Math.round((coveredTier2Plus / totalWords) * 1000) / 10 : 0;

  for (let lvl = 1; lvl <= 6; lvl++) {
    const lData = byLevel[lvl as HskLevel];
    const lCovered = lData.tier2 + lData.tier3;
    lData.percentCoveredTier2Plus = lData.totalWords > 0 ? Math.round((lCovered / lData.totalWords) * 1000) / 10 : 0;
  }

  // Sort priority missing words: Tier 0 first, then lower level first
  priorityMissingWords.sort((a, b) => {
    const tA = wordDetails.get(a.word)?.tier ?? 0;
    const tB = wordDetails.get(b.word)?.tier ?? 0;
    if (tA !== tB) return tA - tB;
    return a.level - b.level;
  });

  const report: VocabCoverageReport = {
    timestamp: new Date().toISOString(),
    totalWords,
    overall,
    byLevel,
    wordDetails,
    priorityMissingWords,
    overusedWords,
  };

  coverageReportCacheByDb.set(db, {
    report,
    expiresAt: now + 10000, // 10 seconds TTL
  });

  return report;
}

/**
 * Invalidates the in-memory vocabulary coverage cache.
 */
export function invalidateVocabCoverageCache(db?: DatabaseSync): void {
  if (db) {
    coverageReportCacheByDb.delete(db);
  }
}

// ============================================================================
// 6. Pre-Generation Vocabulary Planner (`planBatchVocab`)
// ============================================================================

/**
 * Pre-Generation Vocabulary Planner.
 * Strictly enforces 60% Tier 0/1, 25% Tier 2 (Reinforcement), 15% Review (Levels 1..L).
 * Applies overused threshold (= 5) to target words, partitions 1-2 words per slot,
 * and handles graceful reallocation when pools are under-populated.
 */
export function planBatchVocab(
  level: number,
  count: number,
  db: DatabaseSync,
  options: PlanBatchVocabOptions = {}
): PlannedVocab {
  const boundedLevel = Math.max(1, Math.min(6, Math.floor(level))) as HskLevel;
  const questionCount = Math.max(1, Math.floor(count));
  const overusedThreshold = options.overusedThreshold ?? DEFAULT_COVERAGE_TARGETS.overusedVocabThreshold;
  const weights = options.weights ?? { tier0_1: 0.60, tier2: 0.25, review: 0.15 };
  const wordsPerQ = Math.max(1, Math.min(2, options.wordsPerQuestion ?? 1));

  const catalog = getSyllabusCatalog();
  const coverageReport = computeVocabCoverage(db, { overusedThreshold });

  const totalNeeded = Math.round(questionCount * wordsPerQ);
  const targetTier0_1Quota = Math.round(totalNeeded * weights.tier0_1);
  const targetTier2Quota = Math.round(totalNeeded * weights.tier2);
  const targetReviewQuota = totalNeeded - targetTier0_1Quota - targetTier2Quota;

  const poolTier0_1: WordCoverageSummary[] = [];
  const poolTier2: WordCoverageSummary[] = [];
  const poolReview: WordCoverageSummary[] = [];
  let excludedOverusedCount = 0;

  for (const s of coverageReport.wordDetails.values()) {
    if (s.isOverused) {
      excludedOverusedCount++;
      continue;
    }

    // Pool 1 & Pool 2: Level L words
    if (s.level === boundedLevel) {
      if (s.tier === 0 || s.tier === 1) {
        poolTier0_1.push(s);
      } else if (s.tier === 2) {
        poolTier2.push(s);
      }
    }

    // Pool 3: Review words (1..L)
    if (boundedLevel === 1) {
      // For Level 1, review words can be Level 1 words that are at Tier 1 or Tier 2
      if (s.level === 1 && (s.tier === 1 || s.tier === 2)) {
        poolReview.push(s);
      }
    } else {
      // For Level > 1, review words come from levels 1..(L-1)
      if (s.level < boundedLevel && (s.tier === 1 || s.tier === 2 || s.tier === 3)) {
        poolReview.push(s);
      }
    }
  }

  // Sort Pool 1: Tier 0 first (highest deficit), then Tier 1 (lowest context)
  poolTier0_1.sort((a, b) => a.tier - b.tier || a.contextualCount - b.contextualCount);

  // Sort Pool 2: Tier 2 lowest context count first (diverse reinforcement)
  poolTier2.sort((a, b) => a.contextualCount - b.contextualCount);

  // Sort Pool 3: Review lowest total exposure
  poolReview.sort((a, b) => (a.directlyTestedCount + a.contextualCount) - (b.directlyTestedCount + b.contextualCount));

  // Selection with graceful reallocation
  const selectedTier0_1 = poolTier0_1.slice(0, targetTier0_1Quota);
  let deficit = targetTier0_1Quota - selectedTier0_1.length;

  const selectedTier2 = poolTier2.slice(0, targetTier2Quota);
  deficit += (targetTier2Quota - selectedTier2.length);

  const selectedReview = poolReview.slice(0, targetReviewQuota);
  deficit += (targetReviewQuota - selectedReview.length);

  let reallocatedDeficit = 0;
  if (deficit > 0) {
    const extraTier0_1 = poolTier0_1.slice(selectedTier0_1.length, selectedTier0_1.length + deficit);
    selectedTier0_1.push(...extraTier0_1);
    reallocatedDeficit = extraTier0_1.length;
    deficit -= extraTier0_1.length;
  }

  // If still deficit and Level > 1, fallback to any available words of level
  if (deficit > 0) {
    const remainingLvl = (catalog.wordsByLevel.get(boundedLevel) || [])
      .map((w) => coverageReport.wordDetails.get(w.word)!)
      .filter((w) => w && !selectedTier0_1.includes(w) && !selectedTier2.includes(w));
    const extra = remainingLvl.slice(0, deficit);
    selectedTier0_1.push(...extra);
  }

  const allTargets: PlannedTargetWord[] = [
    ...selectedTier0_1.map((w) => ({
      word: w.word,
      pinyin: w.pinyin,
      level: w.level,
      tier: w.tier,
      category: 'tier0_1' as const,
      testedCount: w.directlyTestedCount,
      contextCount: w.contextualCount,
      pos: w.pos,
    })),
    ...selectedTier2.map((w) => ({
      word: w.word,
      pinyin: w.pinyin,
      level: w.level,
      tier: w.tier,
      category: 'tier2_reinforce' as const,
      testedCount: w.directlyTestedCount,
      contextCount: w.contextualCount,
      pos: w.pos,
    })),
    ...selectedReview.map((w) => ({
      word: w.word,
      pinyin: w.pinyin,
      level: w.level,
      tier: w.tier,
      category: 'review' as const,
      testedCount: w.directlyTestedCount,
      contextCount: w.contextualCount,
      pos: w.pos,
    })),
  ];

  // Distribute across question slots (1 to 2 words per question slot)
  const perQuestionTargets: PlannedTargetWord[][] = Array.from({ length: questionCount }, () => []);
  allTargets.forEach((item, idx) => {
    const slot = idx % questionCount;
    perQuestionTargets[slot].push(item);
  });

  // Build clean prompt injection string
  const summaryLines: string[] = [
    `=== PRE-PLANNED HSK LEVEL ${boundedLevel} TARGET VOCABULARY (${allTargets.length} words for ${questionCount} items) ===`,
    `Distribution: ${selectedTier0_1.length} new/under-covered (Tier 0/1), ${selectedTier2.length} reinforcement (Tier 2), ${selectedReview.length} review.`,
    `Assignment by Item (Strict 1–2 target words per question; avoid keyword stuffing):`,
  ];
  perQuestionTargets.forEach((words, idx) => {
    const line = words.map((w) => `${w.word} (${w.pinyin || ''}) [${w.category}]`).join('; ');
    summaryLines.push(`  - Item #${idx + 1}: ${line}`);
  });
  summaryLines.push(`Instruction: Integrate each item's assigned target word naturally into the blank or correct answer.`);

  return {
    level: boundedLevel,
    questionCount,
    totalTargetWords: allTargets.length,
    targets: allTargets,
    perQuestionTargets,
    breakdown: {
      tier0_1Count: selectedTier0_1.length,
      tier2ReinforceCount: selectedTier2.length,
      reviewCount: selectedReview.length,
      excludedOverusedCount,
      targetTier0_1Quota,
      targetTier2Quota,
      targetReviewQuota,
      reallocatedDeficit,
    },
    promptSummary: summaryLines.join('\n'),
  };
}

// ============================================================================
// 7. Actual Text Syllabus Verification Engine (`verifyQuestionVocab`)
// ============================================================================

/**
 * Cross-checks question text against the official 5,334 HSK 1–6 syllabus.
 * Accepts either a question candidate object, a JSON-serialized question, or a plain Chinese text string.
 */
export function verifyQuestionVocab(
  input: string | {
    stem?: string;
    options?: string[];
    answer_idx?: number;
    passage?: string;
    transcript?: string;
    audio_text?: string;
    tested_vocab?: string[];
    part_type?: string;
  },
  questionLevel: number
): QuestionVocabVerificationResult {
  const boundedLevel = Math.max(1, Math.min(6, Math.floor(questionLevel))) as HskLevel;
  const catalog = getSyllabusCatalog();
  const vocabMap = catalog.words;
  const charsMap = catalog.chars;
  const properNouns = catalog.properNouns || loadApprovedNames();
  const allWordLevels = catalog.allWordLevels;

  let stem = '';
  let options: string[] = [];
  let answerIdx = 0;
  let declaredTested: string[] = [];
  let passage = '';
  let transcript = '';

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      stem = parsed.stem || '';
      options = Array.isArray(parsed.options) ? parsed.options : [];
      answerIdx = typeof parsed.answer_idx === 'number' ? parsed.answer_idx : 0;
      declaredTested = Array.isArray(parsed.tested_vocab) ? parsed.tested_vocab : [];
      passage = parsed.passage || '';
      transcript = parsed.transcript || parsed.audio_text || '';
    } catch {
      // Plain text input: all detected words are contextual
      stem = input;
    }
  } else if (typeof input === 'object' && input !== null) {
    stem = input.stem || '';
    options = Array.isArray(input.options) ? input.options : [];
    answerIdx = typeof input.answer_idx === 'number' ? input.answer_idx : 0;
    declaredTested = Array.isArray(input.tested_vocab) ? input.tested_vocab : [];
    passage = input.passage || '';
    transcript = input.transcript || input.audio_text || (input as any).audio_script || '';
  }

  const correctOption = (options[answerIdx] || '').trim();
  const distractorText = options.filter((_, idx) => idx !== answerIdx).join(' ');

  // 1. Scan target tested text (if correctOption is an approved proper noun, it is not an over-level syllabus word)
  let testedScanned: SyllabusWord[] = [];
  const isTargetProperNoun = properNouns.has(correctOption);
  if (!isTargetProperNoun) {
    testedScanned = scanChineseWords(correctOption, vocabMap);
  }
  const verifiedTestedSet = new Set<string>(testedScanned.map((w) => w.word));

  // 2. Audit LLM declared metadata
  const falseClaims: string[] = [];
  const downgradedToContextual: string[] = [];

  for (const rawDeclared of declaredTested) {
    const dec = (rawDeclared || '').trim();
    if (!dec) continue;

    const inCorrectOption = correctOption.includes(dec);
    const inStemBlank = (stem.includes('____') || stem.includes('（）') || stem.includes('()') || stem.includes('【】') || stem.includes('[]')) && correctOption.includes(dec);

    if (inCorrectOption || inStemBlank) {
      if (vocabMap.has(dec)) {
        verifiedTestedSet.add(dec);
      }
    } else {
      const inContext = stem.includes(dec) || passage.includes(dec) || transcript.includes(dec) || distractorText.includes(dec);
      if (inContext) {
        downgradedToContextual.push(dec);
      } else {
        falseClaims.push(dec);
      }
    }
  }

  // 3. Scan contextual components (mask approved proper nouns so their sub-characters are not erroneously matched)
  const maskNames = (text: string): string => {
    let res = text || '';
    for (const name of properNouns) {
      if (name && res.includes(name)) {
        res = res.replaceAll(name, ' '.repeat(name.length));
      }
    }
    return res;
  };

  const stemScanned = scanChineseWords(stem, vocabMap);
  const passageScanned = scanChineseWords(passage, vocabMap);
  const transcriptScanned = scanChineseWords(transcript, vocabMap);
  const distractorScanned = scanChineseWords(distractorText, vocabMap);

  const contextualSet = new Set<string>();
  for (const item of [...stemScanned, ...passageScanned, ...transcriptScanned, ...distractorScanned]) {
    if (!verifiedTestedSet.has(item.word)) {
      contextualSet.add(item.word);
    }
  }
  for (const d of downgradedToContextual) {
    if (vocabMap.has(d) && !verifiedTestedSet.has(d)) {
      contextualSet.add(d);
    }
  }

  // 4. Level check & syllabus boundary audit for tested words and contextual words
  const aboveLevel: { word: string; wordLevel: number; questionLevel: number; source?: 'tested' | 'context' }[] = [];
  for (const tw of verifiedTestedSet) {
    if (allWordLevels && allWordLevels.has(tw)) {
      const levels = Array.from(allWordLevels.get(tw)!);
      const minLevel = Math.min(...levels);
      if (minLevel > boundedLevel) {
        aboveLevel.push({ word: tw, wordLevel: minLevel, questionLevel: boundedLevel, source: 'tested' });
      }
    } else {
      const entry = vocabMap.get(tw);
      if (entry && entry.level > boundedLevel) {
        aboveLevel.push({ word: tw, wordLevel: entry.level, questionLevel: boundedLevel, source: 'tested' });
      }
    }
  }

  const fullNamesList = Array.from(properNouns);
  const fullTextWithNames = `${stem} ${passage} ${transcript} ${distractorText}`;
  const presentProperNouns = fullNamesList.filter((n) => n && fullTextWithNames.includes(n)).join(' ');

  for (const cw of contextualSet) {
    if (presentProperNouns.includes(cw)) {
      // Sub-character of an approved proper name present in text is not an over-level violation
      continue;
    }
    if (allWordLevels && allWordLevels.has(cw)) {
      const levels = Array.from(allWordLevels.get(cw)!);
      const minLevel = Math.min(...levels);
      if (minLevel > boundedLevel) {
        aboveLevel.push({ word: cw, wordLevel: minLevel, questionLevel: boundedLevel, source: 'context' });
      }
    } else {
      const entry = vocabMap.get(cw);
      if (entry && entry.level > boundedLevel) {
        aboveLevel.push({ word: cw, wordLevel: entry.level, questionLevel: boundedLevel, source: 'context' });
      }
    }
  }

  // 5. Out-of-syllabus detection:
  // Detect Chinese characters/words not present in HSK 1–6 syllabus and not approved proper nouns
  const outOfSyllabusSet = new Set<string>();
  const fullText = `${stem} ${passage} ${transcript} ${options.join(' ')}`;

  // Mask approved proper nouns so their characters are not flagged
  let textWithoutNames = fullText;
  for (const name of properNouns) {
    if (textWithoutNames.includes(name)) {
      textWithoutNames = textWithoutNames.replaceAll(name, ' ');
    }
  }

  // Check declared tested words and options
  for (const opt of options) {
    const trimmedOpt = opt.trim();
    if (trimmedOpt && /[\u4e00-\u9fa5]/.test(trimmedOpt) && !properNouns.has(trimmedOpt)) {
      if (trimmedOpt.length >= 2 && !vocabMap.has(trimmedOpt)) {
        // Multi-char option not in syllabus dictionary
        const matched = scanChineseWords(trimmedOpt, vocabMap);
        const coveredLen = matched.reduce((acc, m) => acc + m.word.length, 0);
        const hanziOnly = trimmedOpt.replace(/[^\u4e00-\u9fa5]/g, '');
        if (coveredLen < hanziOnly.length) {
          outOfSyllabusSet.add(trimmedOpt);
        }
      } else if (trimmedOpt.length === 1 && !charsMap.has(trimmedOpt) && !vocabMap.has(trimmedOpt)) {
        outOfSyllabusSet.add(trimmedOpt);
      }
    }
  }

  // Check remaining Chinese text in stem, passage, transcript
  const hanziBlocks = textWithoutNames.match(/[\u4e00-\u9fa5]+/g) || [];
  for (const block of hanziBlocks) {
    const matched = scanChineseWords(block, vocabMap);
    let remaining = block;
    for (const m of matched) {
      remaining = remaining.replace(m.word, ' ');
    }
    const unrec = remaining.match(/[\u4e00-\u9fa5]+/g) || [];
    for (const item of unrec) {
      if (!properNouns.has(item)) {
        for (const ch of item) {
          if (!charsMap.has(ch) && !properNouns.has(ch)) {
            outOfSyllabusSet.add(ch);
          }
        }
      }
    }
  }

  // 6. Compute maximum word level & level breakdown across all encountered words
  let maxWordLevel = 1;
  const wordLevelBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const allEncounteredWords = new Set([...verifiedTestedSet, ...contextualSet]);
  for (const w of allEncounteredWords) {
    let wLevel = 1;
    if (allWordLevels && allWordLevels.has(w)) {
      const levels = Array.from(allWordLevels.get(w)!);
      wLevel = Math.max(...levels);
    } else {
      const entry = vocabMap.get(w);
      if (entry) wLevel = entry.level;
    }
    if (wLevel >= 1 && wLevel <= 6) {
      wordLevelBreakdown[wLevel] = (wordLevelBreakdown[wLevel] || 0) + 1;
      if (wLevel > maxWordLevel) maxWordLevel = wLevel;
    }
  }

  return {
    tested: Array.from(verifiedTestedSet),
    contextual: Array.from(contextualSet),
    outOfSyllabus: Array.from(outOfSyllabusSet),
    aboveLevel,
    maxWordLevel,
    wordLevelBreakdown,
    discrepancies: {
      declaredTested,
      verifiedTested: Array.from(verifiedTestedSet),
      falseClaims,
      downgradedToContextual,
    },
    isValidForLevel: aboveLevel.length === 0,
  };
}

// ============================================================================
// 8. Configurable Coverage Targets & 8 Group Statuses
// ============================================================================

/**
 * Loads coverage configuration with environment variable override support
 */
export function getCoverageTargets(overrides?: Partial<QBankCoverageTargets>): QBankCoverageTargets {
  return {
    initialSkillTarget: parseInt(
      process.env.QBANK_INITIAL_SKILL_TARGET || String(DEFAULT_COVERAGE_TARGETS.initialSkillTarget),
      10
    ),
    extendedSkillTarget: parseInt(
      process.env.QBANK_EXTENDED_SKILL_TARGET || String(DEFAULT_COVERAGE_TARGETS.extendedSkillTarget),
      10
    ),
    initialPartTypeTarget: parseInt(
      process.env.QBANK_INITIAL_PART_TYPE_TARGET || String(DEFAULT_COVERAGE_TARGETS.initialPartTypeTarget),
      10
    ),
    extendedPartTypeTarget: parseInt(
      process.env.QBANK_EXTENDED_PART_TYPE_TARGET || String(DEFAULT_COVERAGE_TARGETS.extendedPartTypeTarget),
      10
    ),
    initialExamSetsTarget: parseInt(
      process.env.QBANK_INITIAL_EXAM_SETS_TARGET || String(DEFAULT_COVERAGE_TARGETS.initialExamSetsTarget),
      10
    ),
    extendedExamSetsTarget: parseInt(
      process.env.QBANK_EXTENDED_EXAM_SETS_TARGET || String(DEFAULT_COVERAGE_TARGETS.extendedExamSetsTarget),
      10
    ),
    accumulatingThreshold: parseInt(
      process.env.QBANK_ACCUMULATING_THRESHOLD || String(DEFAULT_COVERAGE_TARGETS.accumulatingThreshold),
      10
    ),
    minVocabDiversityRatio: parseFloat(
      process.env.QBANK_MIN_VOCAB_DIVERSITY_RATIO || String(DEFAULT_COVERAGE_TARGETS.minVocabDiversityRatio)
    ),
    overusedVocabThreshold: parseInt(
      process.env.QBANK_OVERUSED_VOCAB_THRESHOLD || String(DEFAULT_COVERAGE_TARGETS.overusedVocabThreshold),
      10
    ),
    vocabTier2PlusRatioMin: parseFloat(
      process.env.QBANK_VOCAB_TIER2_PLUS_RATIO_MIN || String(DEFAULT_COVERAGE_TARGETS.vocabTier2PlusRatioMin)
    ),
    ...overrides,
  };
}

/**
 * Pure function evaluating a question group against the 8 required group statuses.
 */
export function classifyGroupStatus(input: GroupClassificationInput): GroupClassificationResult {
  const cfg = getCoverageTargets(input.config);
  const isPartLevel = Boolean(input.part_type);
  const targetCount = isPartLevel ? cfg.initialPartTypeTarget : cfg.initialSkillTarget;
  const extTargetCount = isPartLevel ? cfg.extendedPartTypeTarget : cfg.extendedSkillTarget;
  const examSetsRequiredCount = input.blueprintQuestionQuota * cfg.initialExamSetsTarget;

  const deficit = Math.max(0, targetCount - input.approvedCount);
  const examSetsDeficit = Math.max(0, examSetsRequiredCount - input.approvedCount);
  const isExamReady = input.approvedCount >= examSetsRequiredCount && examSetsRequiredCount > 0;

  // Rule 1: Guardrails & Blockers
  if (input.level < 1 || input.level > 6) {
    return {
      status: 'blocked',
      blockedReason: `Cấp HSK ${input.level} nằm ngoài phạm vi hỗ trợ (chỉ HSK 1–6).`,
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit,
      examSetsRequiredCount,
      examSetsDeficit,
      isExamReady: false,
      details: 'HSK 7–9 bị loại trừ khỏi hệ thống.',
    };
  }

  if (input.level === 1 && input.skill.toLowerCase() === 'writing') {
    return {
      status: 'blocked',
      blockedReason: 'HSK 1 không có phần thi Viết trong đại cương HSK 3.0.',
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount: 0,
      deficit: 0,
      examSetsRequiredCount: 0,
      examSetsDeficit: 0,
      isExamReady: false,
      details: 'Kỹ năng Viết không áp dụng cho HSK 1.',
    };
  }

  if (input.isExplicitlyBlocked || input.blockedReason) {
    return {
      status: 'blocked',
      blockedReason: input.blockedReason || 'Nhóm bị khóa bởi quản trị viên hoặc thiếu tài nguyên.',
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit,
      examSetsRequiredCount,
      examSetsDeficit,
      isExamReady: false,
      details: input.blockedReason || 'Bị chặn.',
    };
  }

  if (isPartLevel && input.blueprintQuestionQuota <= 0) {
    return {
      status: 'blocked',
      blockedReason: `Dạng bài '${input.part_type}' không tồn tại trong blueprint HSK ${input.level}.`,
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit,
      examSetsRequiredCount: 0,
      examSetsDeficit: 0,
      isExamReady: false,
      details: 'Thiếu định nghĩa blueprint.',
    };
  }

  // Rule 2: No Data
  if (input.approvedCount === 0 && input.pendingCount === 0) {
    return {
      status: 'no_data',
      approvedCount: 0,
      pendingCount: 0,
      targetCount,
      deficit: targetCount,
      examSetsRequiredCount,
      examSetsDeficit,
      isExamReady: false,
      details: 'Chưa có dữ liệu (0 câu đã duyệt, 0 câu chờ duyệt).',
    };
  }

  // Rule 3: Accumulating
  if (input.approvedCount === 0 && input.pendingCount > 0) {
    return {
      status: 'accumulating',
      approvedCount: 0,
      pendingCount: input.pendingCount,
      targetCount,
      deficit: targetCount,
      examSetsRequiredCount,
      examSetsDeficit,
      isExamReady: false,
      details: `Đang tích lũy: ${input.pendingCount} câu đang chờ duyệt, 0 câu đã duyệt.`,
    };
  }

  if (input.approvedCount > 0 && input.approvedCount < cfg.accumulatingThreshold) {
    return {
      status: 'accumulating',
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit,
      examSetsRequiredCount,
      examSetsDeficit,
      isExamReady: false,
      details: `Giai đoạn ươm mầm: ${input.approvedCount}/${cfg.accumulatingThreshold} câu khởi tạo.`,
    };
  }

  // Rule 4: Below Quantity Target
  if (input.approvedCount < targetCount) {
    return {
      status: 'below_quantity_target',
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit,
      examSetsRequiredCount,
      examSetsDeficit,
      isExamReady,
      details: `Đạt một phần: ${input.approvedCount}/${targetCount} câu (thiếu ${deficit} câu).`,
    };
  }

  // Quantity target is met (approvedCount >= targetCount). Now check diversity.

  // Rule 5: Diversity & Type Checks (quantity_met_lacks_diversity_or_types)
  if (!isPartLevel && input.childParts && input.childParts.length > 0) {
    const deficientParts = input.childParts.filter((p) => p.approvedCount < p.target);
    if (deficientParts.length > 0) {
      const missingNames = deficientParts.map((p) => `${p.part_type} (${p.approvedCount}/${p.target})`).join(', ');
      return {
        status: 'quantity_met_lacks_diversity_or_types',
        approvedCount: input.approvedCount,
        pendingCount: input.pendingCount,
        targetCount,
        deficit: 0,
        examSetsRequiredCount,
        examSetsDeficit,
        isExamReady: false,
        details: `Đạt tổng số lượng kỹ năng (${input.approvedCount}/${targetCount}), nhưng thiếu dạng bài: ${missingNames}.`,
      };
    }
  }

  if (isPartLevel && input.uniqueTestedVocabCount !== undefined) {
    const minVocabExpected = Math.ceil(targetCount * cfg.minVocabDiversityRatio);
    if (input.uniqueTestedVocabCount < minVocabExpected) {
      return {
        status: 'quantity_met_lacks_diversity_or_types',
        approvedCount: input.approvedCount,
        pendingCount: input.pendingCount,
        targetCount,
        deficit: 0,
        examSetsRequiredCount,
        examSetsDeficit,
        isExamReady,
        details: `Đạt số lượng (${input.approvedCount} câu) nhưng thiếu đa dạng từ vựng: chỉ có ${input.uniqueTestedVocabCount} từ duy nhất (yêu cầu tối thiểu ${minVocabExpected}).`,
      };
    }
  }

  // Rule 6: Extended Target Met
  if (input.approvedCount >= extTargetCount) {
    return {
      status: 'extended_target_met',
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit: 0,
      examSetsRequiredCount,
      examSetsDeficit: 0,
      isExamReady: true,
      details: `Đạt mục tiêu mở rộng: ${input.approvedCount}/${extTargetCount} câu đã duyệt.`,
    };
  }

  // Rule 7: Exam Ready
  if (isExamReady && input.approvedCount >= targetCount) {
    return {
      status: 'exam_ready',
      approvedCount: input.approvedCount,
      pendingCount: input.pendingCount,
      targetCount,
      deficit: 0,
      examSetsRequiredCount,
      examSetsDeficit: 0,
      isExamReady: true,
      details: `Đủ điều kiện tạo ${cfg.initialExamSetsTarget} đề thi blueprint (${input.approvedCount}/${examSetsRequiredCount} câu).`,
    };
  }

  // Rule 8: Minimum Coverage Met
  return {
    status: 'minimum_coverage_met',
    approvedCount: input.approvedCount,
    pendingCount: input.pendingCount,
    targetCount,
    deficit: 0,
    examSetsRequiredCount,
    examSetsDeficit,
    isExamReady,
    details: `Đạt độ bao phủ tối thiểu: ${input.approvedCount}/${targetCount} câu đã duyệt.`,
  };
}

// ============================================================================
// 9. Coverage Matrix & Priority Deficit Engine
// ============================================================================

interface BlueprintPartInfo {
  level: HskLevel;
  skill: string;
  part_type: string;
  name: string;
  n_questions: number;
}

let loadedBlueprints: Map<number, BlueprintPartInfo[]> | null = null;

function getBlueprintParts(): Map<number, BlueprintPartInfo[]> {
  if (loadedBlueprints) return loadedBlueprints;
  const map = new Map<number, BlueprintPartInfo[]>();

  for (let lvl = 1; lvl <= 6; lvl++) {
    const bpPath = path.resolve(process.cwd(), `data/qbank/blueprint/level${lvl}.json`);
    const partsList: BlueprintPartInfo[] = [];
    if (fs.existsSync(bpPath)) {
      try {
        const bp = JSON.parse(fs.readFileSync(bpPath, 'utf-8'));
        const sections = bp.sections || {};
        for (const sKey of Object.keys(sections)) {
          const sec = sections[sKey];
          const parts = sec.parts || {};
          for (const pKey of Object.keys(parts)) {
            const p = parts[pKey];
            partsList.push({
              level: lvl as HskLevel,
              skill: sec.skill,
              part_type: p.type,
              name: p.name || pKey,
              n_questions: Number(p.n_questions || 5),
            });
          }
        }
      } catch {}
    }
    map.set(lvl, partsList);
  }

  loadedBlueprints = map;
  return map;
}

/**
 * Normalizes compatible question part_types with official exam blueprint part_types.
 * Supports HSK 1–6 question variants (e.g. read_fill_blank_4opt <-> read_fill_blank_word_bank_6opt,
 * listen_picture_match_4opt <-> listen_picture_match_3opt, fill_blank <-> read_fill_blank_word_bank_split).
 */
export function isCompatiblePartType(blueprintPartType: string, questionPartType: string): boolean {
  const bp = (blueprintPartType || '').toLowerCase().trim();
  const q = (questionPartType || '').toLowerCase().trim();
  if (!bp || !q) return false;
  if (bp === q) return true;

  // Dialogue picture match
  const bpIsDialoguePic = bp.includes('dialogue') && bp.includes('picture_match');
  const qIsDialoguePic = q.includes('dialogue') && q.includes('picture_match');
  if (bpIsDialoguePic || qIsDialoguePic) {
    return bpIsDialoguePic && qIsDialoguePic;
  }

  // Simple picture match (non-dialogue)
  if (bp.includes('picture_match') && q.includes('picture_match')) {
    return true;
  }

  // Fill in the blank / cloze
  const bpIsBlank = bp.includes('fill_blank') || bp.includes('cloze_passages') || bp.includes('cloze');
  const qIsBlank = q.includes('fill_blank') || q === 'fill_blank' || q.includes('cloze');
  if (bpIsBlank && qIsBlank) {
    // 4-option fill-in-the-blank is bidirectionally compatible with 4-option cloze passages in HSK 5/6 blueprints
    if (bp.includes('cloze_passages') !== q.includes('cloze_passages')) {
      const is4OptPair = (bp.includes('4opt') || !/_\d+opt/.test(bp)) && (q.includes('4opt') || !/_\d+opt/.test(q));
      if (!is4OptPair) return false;
    }
    return true;
  }

  // Reading comprehension
  if (bp.includes('comprehension') && q.includes('comprehension')) {
    return true;
  }

  // Sentence / dialogue matching
  if (bp.includes('matching') && q.includes('matching')) {
    return true;
  }

  // Reorder / sentence ordering
  if ((bp.includes('reorder') || bp.includes('ordering')) && (q.includes('reorder') || q.includes('ordering'))) {
    return true;
  }

  // QA question answer
  if (bp.includes('qa') && q.includes('qa')) {
    return true;
  }

  // Faulty sentence / error detection
  if (bp.includes('faulty') && q.includes('faulty')) {
    return true;
  }

  // Essay / writing tasks
  if (bp.includes('essay') && q.includes('essay')) {
    return true;
  }

  // Summary / shortening writing tasks (HSK 6)
  if ((bp.includes('summary') || bp.includes('shortening')) && (q.includes('summary') || q.includes('shortening'))) {
    return true;
  }

  // True / false judgments
  if (bp.includes('true_false') && q.includes('true_false')) {
    return true;
  }

  // Sentence writing from picture/words (HSK 4)
  if ((bp.includes('picture_word') || bp.includes('picture') && bp.includes('sentence')) &&
      (q.includes('picture_word') || q.includes('picture') && q.includes('sentence'))) {
    return true;
  }

  return false;
}

interface TaskStatusHelper {
  getStatusForPart(level: number, skill: string, bpPartType: string): 'completed' | 'failed' | 'partial' | 'none';
}

function getLatestTaskStatusHelper(db: DatabaseSync): TaskStatusHelper {
  const batchPartMap = new Map<string, string>();
  try {
    const pRows: any[] = db.prepare(`SELECT batch_id, part_type FROM pending_questions WHERE batch_id IS NOT NULL`).all() as any[];
    for (const r of pRows) {
      if (r.batch_id && r.part_type && !batchPartMap.has(r.batch_id)) {
        batchPartMap.set(r.batch_id, r.part_type);
      }
    }
  } catch {}
  try {
    const qRows: any[] = db.prepare(`SELECT batch_id, part_type FROM questions WHERE batch_id IS NOT NULL`).all() as any[];
    for (const r of qRows) {
      if (r.batch_id && r.part_type && !batchPartMap.has(r.batch_id)) {
        batchPartMap.set(r.batch_id, r.part_type);
      }
    }
  } catch {}

  interface TaskEvent {
    level: number;
    skill: string;
    part_type: string;
    status: 'completed' | 'failed' | 'partial' | 'none';
    createdAt: string;
  }
  const events: TaskEvent[] = [];

  // 1. Read from qbank_tasks
  try {
    const tasks: any[] = db.prepare(`
      SELECT idempotency_key, task_type, status, result_json, error_message, created_at
      FROM qbank_tasks
      ORDER BY created_at DESC
    `).all() as any[];

    for (const t of tasks) {
      if (!t.result_json) continue;
      try {
        const res = JSON.parse(t.result_json);
        const level = Number(res.level);
        const skill = String(res.skill || '').toLowerCase().trim();
        const partType = String(res.part_type || res.partType || '').trim();
        if (level >= 1 && level <= 6 && partType) {
          let s: 'completed' | 'failed' | 'partial' = 'completed';
          if (t.status === 'failed' || res.status === 'all_rejected' || res.status === 'failed') {
            s = 'failed';
          } else if (t.status === 'partial' || res.status === 'partial') {
            s = 'partial';
          } else if (res.savedCount !== undefined && res.requestedCount !== undefined && res.savedCount < res.requestedCount && res.savedCount > 0) {
            s = 'partial';
          }
          events.push({ level, skill, part_type: partType, status: s, createdAt: t.created_at || '' });
        }
      } catch {}
    }
  } catch {}

  // 2. Read from generation_runs
  try {
    const runs: any[] = db.prepare(`
      SELECT id, batch_id, level, skill, status, details, count_requested, count_saved_pending, created_at
      FROM generation_runs
      WHERE level BETWEEN 1 AND 6
      ORDER BY created_at DESC, id DESC
    `).all() as any[];

    for (const r of runs) {
      const level = Number(r.level);
      const skill = String(r.skill || '').toLowerCase().trim();
      let partType = '';
      if (r.details) {
        try {
          const d = JSON.parse(r.details);
          partType = String(d.part_type || d.partType || '').trim();
        } catch {}
      }
      if (!partType && r.batch_id && batchPartMap.has(r.batch_id)) {
        partType = batchPartMap.get(r.batch_id)!;
      }
      if (level >= 1 && level <= 6 && partType) {
        let s: 'completed' | 'failed' | 'partial' = 'completed';
        if (r.status === 'failed' || r.status === 'all_rejected' || r.status === 'quota_exhausted') {
          s = 'failed';
        } else if (r.status === 'partial') {
          s = 'partial';
        } else if (r.status === 'success' || r.status === 'completed') {
          s = 'completed';
        } else if (r.count_saved_pending > 0 && r.count_saved_pending < r.count_requested) {
          s = 'partial';
        } else if (r.count_saved_pending === 0 && r.count_requested > 0) {
          s = 'failed';
        }
        events.push({ level, skill, part_type: partType, status: s, createdAt: r.created_at || '' });
      }
    }
  } catch {}

  events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    getStatusForPart(level: number, skill: string, bpPartType: string): 'completed' | 'failed' | 'partial' | 'none' {
      for (const ev of events) {
        if (ev.level === level && (ev.skill === skill || ev.skill === 'all' || !ev.skill)) {
          if (isCompatiblePartType(bpPartType, ev.part_type)) {
            return ev.status;
          }
        }
      }
      return 'none';
    },
  };
}

/**
 * Computes coverage matrix for all HSK 1–6 blueprint part types and skills.
 */
export function computeCoverageMatrix(
  db: DatabaseSync,
  configOverrides?: Partial<QBankCoverageTargets>
): CoverageMatrixReport {
  const cfg = getCoverageTargets(configOverrides);
  const blueprints = getBlueprintParts();
  const vocabReport = computeVocabCoverage(db);
  const taskStatusHelper = getLatestTaskStatusHelper(db);

  // Query approved counts grouped by level, skill, part_type
  let approvedRows: any[] = [];
  try {
    approvedRows = db.prepare(`
      SELECT level, skill, part_type, COUNT(*) as cnt, GROUP_CONCAT(COALESCE(tested_vocab, ''), '|||') as vocabs
      FROM questions
      WHERE status = 'approved' AND is_active = 1
      GROUP BY level, skill, part_type
    `).all() as any[];
  } catch {
    approvedRows = [];
  }

  // Pre-aggregate approved questions per blueprint part
  const approvedMap = new Map<string, { count: number; uniqueVocabCount: number }>();
  // Pre-aggregate pending questions per blueprint part
  const pendingMap = new Map<string, number>();

  // Query pending counts
  let pendingRows: any[] = [];
  try {
    pendingRows = db.prepare(`
      SELECT level, skill, part_type, COUNT(*) as cnt
      FROM pending_questions
      WHERE status = 'pending'
      GROUP BY level, skill, part_type
    `).all() as any[];
  } catch {
    pendingRows = [];
  }

  for (let lvl = 1; lvl <= 6; lvl++) {
    const parts = blueprints.get(lvl) || [];

    // Map approved questions for this level to best matching blueprint part
    for (const r of approvedRows.filter((row: any) => Number(row.level) === lvl)) {
      const skill = String(r.skill || '').toLowerCase().trim();
      const qPartType = String(r.part_type || '').trim();

      // Find exact match first, then compatible match
      let matchedPart = parts.find((p) => p.skill === skill && p.part_type === qPartType);
      if (!matchedPart) {
        matchedPart = parts.find((p) => p.skill === skill && isCompatiblePartType(p.part_type, qPartType));
      }

      const bpPartType = matchedPart ? matchedPart.part_type : qPartType;
      const key = `${lvl}_${skill}_${bpPartType}`;

      const existing = approvedMap.get(key) || { count: 0, uniqueVocabCount: 0 };
      const uniqueVocabs = new Set<string>();

      if (r.vocabs) {
        const partsList = String(r.vocabs).split('|||');
        for (const p of partsList) {
          const trimmed = p.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsed.forEach((w) => {
                const sw = String(w).trim();
                if (sw) uniqueVocabs.add(sw);
              });
            } else if (typeof parsed === 'string') {
              const sw = parsed.trim();
              if (sw) uniqueVocabs.add(sw);
            }
          } catch {
            if (trimmed.includes(',')) {
              trimmed.split(',').forEach((w) => {
                const sw = w.trim();
                if (sw) uniqueVocabs.add(sw);
              });
            } else {
              uniqueVocabs.add(trimmed);
            }
          }
        }
      }

      approvedMap.set(key, {
        count: existing.count + Number(r.cnt),
        uniqueVocabCount: existing.uniqueVocabCount + uniqueVocabs.size,
      });
    }

    // Map pending questions for this level
    for (const r of pendingRows.filter((row: any) => Number(row.level) === lvl)) {
      const skill = String(r.skill || '').toLowerCase().trim();
      const qPartType = String(r.part_type || '').trim();

      let matchedPart = parts.find((p) => p.skill === skill && p.part_type === qPartType);
      if (!matchedPart) {
        matchedPart = parts.find((p) => p.skill === skill && isCompatiblePartType(p.part_type, qPartType));
      }

      const bpPartType = matchedPart ? matchedPart.part_type : qPartType;
      const key = `${lvl}_${skill}_${bpPartType}`;
      const existingCnt = pendingMap.get(key) || 0;
      pendingMap.set(key, existingCnt + Number(r.cnt));
    }
  }

  const rows: CoverageMatrixRow[] = [];
  const levelSummary: Record<number, {
    approved: number;
    target: number;
    deficit: number;
    examReadyParts: number;
    totalParts: number;
    isLevelExamReady: boolean;
  }> = {};

  for (let lvl = 1; lvl <= 6; lvl++) {
    levelSummary[lvl] = {
      approved: 0,
      target: 0,
      deficit: 0,
      examReadyParts: 0,
      totalParts: 0,
      isLevelExamReady: false,
    };

    const parts = blueprints.get(lvl) || [];
    levelSummary[lvl].totalParts = parts.length;

    for (const part of parts) {
      const key = `${lvl}_${part.skill}_${part.part_type}`;
      const appInfo = approvedMap.get(key) || { count: 0, uniqueVocabCount: 0 };
      const pendCount = pendingMap.get(key) || 0;

      const classification = classifyGroupStatus({
        level: lvl,
        skill: part.skill,
        part_type: part.part_type,
        approvedCount: appInfo.count,
        pendingCount: pendCount,
        blueprintQuestionQuota: part.n_questions,
        uniqueTestedVocabCount: appInfo.uniqueVocabCount,
        config: cfg,
      });

      const lvlVocab = vocabReport.byLevel[lvl as HskLevel];
      const vocabCoveredRatio = lvlVocab.totalWords > 0 ? (lvlVocab.tier2 + lvlVocab.tier3) / lvlVocab.totalWords : 0;
      const lastTaskStatus = taskStatusHelper.getStatusForPart(lvl, part.skill, part.part_type);

      rows.push({
        level: lvl as HskLevel,
        skill: part.skill,
        part_type: part.part_type,
        part_name: part.name,
        targetQuantity: classification.targetCount,
        approvedCount: classification.approvedCount,
        pendingCount: classification.pendingCount,
        deficit: classification.deficit,
        examSetsTarget: cfg.initialExamSetsTarget,
        examSetsRequiredCount: classification.examSetsRequiredCount,
        examSetsDeficit: classification.examSetsDeficit,
        uniqueTestedVocabCount: appInfo.uniqueVocabCount,
        vocabCoveredRatio: Math.round(vocabCoveredRatio * 100) / 100,
        status: classification.status,
        lastTaskStatus,
        blockReason: classification.blockedReason,
        details: classification.details,
      });

      levelSummary[lvl].approved += appInfo.count;
      levelSummary[lvl].target += classification.targetCount;
      levelSummary[lvl].deficit += classification.deficit;
      if (classification.isExamReady) {
        levelSummary[lvl].examReadyParts++;
      }
    }

    levelSummary[lvl].isLevelExamReady =
      levelSummary[lvl].totalParts > 0 &&
      levelSummary[lvl].examReadyParts === levelSummary[lvl].totalParts;
  }

  let totalApproved = 0;
  let totalPending = 0;
  let totalDeficit = 0;

  for (const r of rows) {
    totalApproved += r.approvedCount;
    totalPending += r.pendingCount;
    totalDeficit += r.deficit;
  }

  return {
    timestamp: new Date().toISOString(),
    targets: cfg,
    rows,
    summary: {
      totalApproved,
      totalPending,
      totalDeficit,
      byLevel: levelSummary,
    },
  };
}

/**
 * Deterministically calculates the next priority deficit group for the cron scheduler / generator.
 * Ranking rules:
 * 1. Groups with largest exam set deficit (to make blueprints exam-ready)
 * 2. Groups with largest relative quantity deficit
 * 3. Levels with highest Tier 0 vocab ratio
 */
export function getPriorityDeficitGroup(
  db: DatabaseSync,
  configOverrides?: Partial<QBankCoverageTargets>,
  targetLevel?: number
): DeficitGroup | null {
  const matrix = computeCoverageMatrix(db, configOverrides);
  const vocabReport = computeVocabCoverage(db);

  let eligibleRows = matrix.rows.filter(
    (r) => r.status !== 'blocked' && r.status !== 'extended_target_met' && (r.deficit > 0 || (r.examSetsDeficit || 0) > 0)
  );

  if (targetLevel && targetLevel >= 1 && targetLevel <= 6) {
    eligibleRows = eligibleRows.filter((r) => r.level === targetLevel);
  }

  if (eligibleRows.length === 0) {
    return null;
  }

  // Circuit-breaker: query recent failures from generation_runs in the last 30 minutes
  const failureCountMap = new Map<string, number>();
  try {
    const recentFails: any[] = db.prepare(`
      SELECT level, skill, COUNT(*) as fail_count
      FROM generation_runs
      WHERE created_at >= datetime('now', '-30 minutes')
        AND status IN ('failed', 'quota_exhausted')
      GROUP BY level, skill
    `).all() as any[];

    for (const f of recentFails) {
      if (f.level && f.skill) {
        failureCountMap.set(`${f.level}_${f.skill}`, Number(f.fail_count) || 0);
      }
    }
  } catch {
    // If generation_runs table does not exist yet in mock db, silently ignore
  }

  // Cross-level and cross-skill balancing statistics
  const levelTotals = new Map<number, number>();
  const levelSkillTotals = new Map<string, number>();

  for (let lvl = 1; lvl <= 6; lvl++) {
    levelTotals.set(lvl, 0);
  }

  for (const r of matrix.rows) {
    const tot = r.approvedCount + (r.pendingCount || 0);
    levelTotals.set(r.level, (levelTotals.get(r.level) || 0) + tot);
    const lsKey = `${r.level}_${r.skill}`;
    levelSkillTotals.set(lsKey, (levelSkillTotals.get(lsKey) || 0) + tot);
  }

  const maxLevelTotal = Math.max(...Array.from(levelTotals.values()));

  const scored = eligibleRows.map((row) => {
    const totalInFlight = row.approvedCount + (row.pendingCount || 0);

    // 1. Cross-Level Balancing: Give major priority to levels with fewer total questions
    const currentLvlTotal = levelTotals.get(row.level) || 0;
    const levelDeficit = Math.max(0, maxLevelTotal - currentLvlTotal);
    const levelBalanceScore = !targetLevel ? Math.round(levelDeficit * 1200) : 0;

    // 2. Cross-Skill Balancing within the level: Balance listening, reading, writing
    const skillsInLevel = ['listening', 'reading', 'writing'].filter((s) => row.level > 1 || s !== 'writing');
    const skillTotals = skillsInLevel.map((s) => levelSkillTotals.get(`${row.level}_${s}`) || 0);
    const maxSkillInLevel = Math.max(...skillTotals);
    const currentSkillTotal = levelSkillTotals.get(`${row.level}_${row.skill}`) || 0;
    const skillDeficit = Math.max(0, maxSkillInLevel - currentSkillTotal);
    const skillBalanceScore = Math.round(skillDeficit * 800);

    // 3. Progressive Backpressure Penalty: Heavily suppress part types with high pending backlog
    const pendingCount = row.pendingCount || 0;
    let pendingBackpressurePenalty = 0;
    if (pendingCount >= 100) pendingBackpressurePenalty = 2500000;
    else if (pendingCount >= 50) pendingBackpressurePenalty = 1200000;
    else if (pendingCount >= 30) pendingBackpressurePenalty = 500000;
    else if (pendingCount >= 15) pendingBackpressurePenalty = 180000;
    else if (pendingCount >= 5) pendingBackpressurePenalty = 40000;

    // 4. In-Flight Dampening: slightly suppress parts that already have more questions
    const inFlightDampening = Math.round(totalInFlight * 1500);

    // Critical Priority Brackets with in-flight queue awareness (R3)
    let criticalBoost = 0;
    if (row.skill === 'listening' && row.level >= 2 && totalInFlight === 0) {
      criticalBoost += 250000;
    } else if (row.skill === 'writing' && totalInFlight === 0) {
      criticalBoost += 150000;
    }
    if (totalInFlight === 0) {
      criticalBoost += 50000;
    } else if (row.approvedCount === 0 && (row.pendingCount || 0) < 5) {
      criticalBoost += 25000;
    }

    // 1. Blueprint exam ready deficit
    const examDeficitScore = (row.examSetsDeficit || 0) * 500;

    // 2. Deficit ratio against targets (30 part_type, 200 skill)
    const targetQty = Math.max(1, row.targetQuantity || 30);
    const deficitRatio = Math.max(0, row.deficit) / targetQty;
    const ratioScore = Math.round(deficitRatio * 10000);

    // 3. Highest Tier 0 vocab ratio for level
    const lvlVocab = vocabReport.byLevel[row.level as HskLevel];
    const tier0Ratio = lvlVocab && lvlVocab.totalWords > 0
      ? lvlVocab.tier0 / lvlVocab.totalWords
      : 0;
    const tier0Score = Math.round(tier0Ratio * 50);

    // Minor foundation preference: slightly favor lower levels when ratios are close
    const foundationTieBreaker = (7 - row.level) * 10;
    const skillTieBreaker = row.skill === 'listening' ? 30 : row.skill === 'writing' ? 20 : 10;

    // Circuit-breaker cooldown penalty from recent failure runs
    const failKey = `${row.level}_${row.skill}`;
    const failCount = failureCountMap.get(failKey) || 0;
    const cooldownPenalty = failCount * 200000;

    const priorityScore = (levelBalanceScore + skillBalanceScore + criticalBoost + ratioScore + examDeficitScore + tier0Score + foundationTieBreaker + skillTieBreaker) - cooldownPenalty - pendingBackpressurePenalty - inFlightDampening;

    return {
      level: row.level,
      skill: row.skill,
      part_type: row.part_type,
      deficit: row.deficit,
      examSetsDeficit: row.examSetsDeficit,
      approvedCount: row.approvedCount,
      pendingCount: row.pendingCount,
      totalInFlight,
      priorityScore,
      status: row.status,
      reason: `Boost: ${criticalBoost} | InFlight: ${totalInFlight} (App: ${row.approvedCount}, Pend: ${row.pendingCount}) | Deficit: ${row.deficit}/${row.targetQuantity} | Penalty: ${pendingBackpressurePenalty} | Fails: ${failCount}`,
    };
  });

  // Deterministic sorting with Round-Robin Balancing:
  // priorityScore desc -> level asc -> totalInFlight asc (prefer part with fewest questions) -> skill rank -> part_type asc
  scored.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (a.level !== b.level) return a.level - b.level;
    if (a.totalInFlight !== b.totalInFlight) return a.totalInFlight - b.totalInFlight;
    const sRank = (s: string) => (s === 'listening' ? 1 : s === 'writing' ? 2 : 3);
    if (sRank(a.skill) !== sRank(b.skill)) return sRank(a.skill) - sRank(b.skill);
    return a.part_type.localeCompare(b.part_type);
  });

  return scored[0] || null;
}
