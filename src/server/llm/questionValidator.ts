import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import { generateAccuratePinyin, isPinyinAligned } from '../../utils/pinyinEngine.js';
import { getQBankDbPath } from '../dbPaths.js';
import { CandidateQuestion, ValidationResult, QuestionLifecycleStatus } from './types.js';
import { isValidIllustrationTheme, VALID_ILLUSTRATION_THEMES } from './promptTemplates.js';
import {
  getPartTypeContract,
  isFillBlankPartType,
  isReadingComprehensionPartType,
} from './partTypeContract.js';
import {
  computeNearDuplicateSignature as engineNearDupSig,
  verifyQuestionVocab,
  loadApprovedNames,
  parseExplanationDistractorRationales,
  DistractorRationaleItem,
} from '../qbankCoverageEngine.js';

/**
 * Computes deterministic SHA-256 content hash on normalized NFC text.
 */
export function computeContentHash(stem: string, options: string[], answerIdx: number, optionsImages?: string[]): string {
  const normStem = (typeof stem === 'string' ? stem : '').trim().normalize('NFC');
  const normOptions = (Array.isArray(options) ? options : []).map((opt) => (typeof opt === 'string' ? opt : '').trim().normalize('NFC')).join('|');
  const normImages = (Array.isArray(optionsImages) ? optionsImages : []).map((image) => (image || '').trim().toLowerCase()).join('|');
  const payload = `${normStem}##${normOptions}##${answerIdx}${normImages ? `##${normImages}` : ''}`;
  return crypto.createHash('sha256').update(payload, 'utf-8').digest('hex');
}

/**
 * Computes near-duplicate signature: Normalized stem + alphabetically sorted option tokens.
 * Catches shuffled A/B/C/D choices where stem and choices are identical but option order differs.
 */
export function computeNearDuplicateSignature(stem: string, options: string[]): string {
  const safeStem = typeof stem === 'string' ? stem : '';
  const safeOpts = Array.isArray(options) ? options.filter((o) => typeof o === 'string') : [];
  return engineNearDupSig(safeStem, safeOpts);
}

/**
 * Determines whether a question part_type requires visual SVG illustration.
 * Visual types include: listen_picture_match_4opt, listen_picture_match_3opt,
 * listen_dialogue_picture_match_6opt, read_sentence_picture_match_6opt, listen_choose_pic, etc.
 */
export function isVisualQuestionType(partType?: string | null): boolean {
  if (!partType || typeof partType !== 'string') return false;
  if (/^write_/i.test(partType.trim())) return false;
  return /picture|image|tranh|choose_pic/i.test(partType.trim());
}

/**
 * Replaces blank placeholders (____, ___, __, （）, (), 【】, []) in stem with the correct option text
 * for semantic comparison, preventing blank placements from masking duplicates.
 */
export function getComparableStem(stem: string, options?: string[], answerIdx?: number): string {
  if (options && typeof answerIdx === 'number' && answerIdx >= 0 && answerIdx < options.length) {
    const ans = (options[answerIdx] || '').trim();
    return (stem || '').replace(/(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/g, ans);
  }
  return stem || '';
}

/**
 * Strips punctuation, whitespace, and special characters from Chinese text.
 */
export function cleanChineseText(text: string): string {
  return (typeof text === 'string' ? text : '')
    .normalize('NFC')
    .replace(/[\s\d_\-—–…\.,\?!;:\"'“”‘’（）\(\)\[\]\{\}《》〈〉·、。，？！：；／\\~]+/g, '');
}

/**
 * Extracts character n-grams from cleaned Chinese text.
 * Uses n=2 for <=4 chars, n=3 for <=7 chars, n=4 for >7 chars.
 */
export function getCharNgrams(text: string): Set<string> {
  const clean = cleanChineseText(text);
  const n = clean.length <= 4 ? 2 : clean.length <= 7 ? 3 : 4;
  const ngrams = new Set<string>();

  if (clean.length < n) {
    if (clean.length > 0) ngrams.add(clean);
    return ngrams;
  }

  for (let i = 0; i <= clean.length - n; i++) {
    ngrams.add(clean.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Calculates Jaccard similarity between two Chinese texts using character N-grams.
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const ngramsA = getCharNgrams(textA);
  const ngramsB = getCharNgrams(textB);

  if (ngramsA.size === 0 && ngramsB.size === 0) return 1.0;
  if (ngramsA.size === 0 || ngramsB.size === 0) return 0.0;

  let intersection = 0;
  for (const item of ngramsA) {
    if (ngramsB.has(item)) intersection++;
  }

  const union = ngramsA.size + ngramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface BlueprintPartSpec {
  level: number;
  skill: string;
  type: string;
  n_options: number;
  n_questions?: number;
  name?: string;
}

let blueprintPartsCache: Map<string, BlueprintPartSpec> | null = null;

export function loadAllBlueprintSpecs(): Map<string, BlueprintPartSpec> {
  if (blueprintPartsCache) return blueprintPartsCache;
  const map = new Map<string, BlueprintPartSpec>();

  for (let lvl = 1; lvl <= 6; lvl++) {
    const bpPath = path.resolve(process.cwd(), `data/qbank/blueprint/level${lvl}.json`);
    if (fs.existsSync(bpPath)) {
      try {
        const bp = JSON.parse(fs.readFileSync(bpPath, 'utf-8'));
        const sections = bp.sections || {};
        for (const sKey of Object.keys(sections)) {
          const sec = sections[sKey];
          const parts = sec.parts || {};
          for (const pKey of Object.keys(parts)) {
            const p = parts[pKey];
            const spec: BlueprintPartSpec = {
              level: lvl,
              skill: sec.skill || sKey,
              type: p.type || pKey,
              n_options: typeof p.n_options === 'number' ? p.n_options : 4,
              n_questions: typeof p.n_questions === 'number' ? p.n_questions : 5,
              name: p.name || pKey,
            };
            map.set(`${lvl}:${spec.type}`, spec);
            if (!map.has(spec.type)) {
              map.set(spec.type, spec);
            }
          }
        }
      } catch {}
    }
  }

  blueprintPartsCache = map;
  return map;
}

export function getBlueprintPartSpec(level?: number, partType?: string): BlueprintPartSpec | null {
  if (!partType) return null;
  const map = loadAllBlueprintSpecs();
  if (level && map.has(`${level}:${partType}`)) {
    return map.get(`${level}:${partType}`)!;
  }
  return map.get(partType) || null;
}

export function getExpectedOptionCount(levelOrPartType?: number | string, partType?: string): number | null {
  let level: number | undefined;
  let pType: string | undefined;

  if (typeof levelOrPartType === 'string') {
    pType = levelOrPartType;
  } else if (typeof levelOrPartType === 'number') {
    level = levelOrPartType;
    pType = partType;
  } else {
    pType = partType;
  }

  if (!pType) return null;

  const spec = getBlueprintPartSpec(level, pType);
  if (spec && typeof spec.n_options === 'number') return spec.n_options;

  // Specific explicit option counts
  const optSuffixMatch = pType.match(/_(\d+)opt/i);
  if (optSuffixMatch) return parseInt(optSuffixMatch[1], 10);
  if (/true_false/i.test(pType)) return 2;
  if (pType === 'read_paragraph_sentence_ordering') return 5;
  if (pType === 'read_sentence_picture_match_6opt') return 6;

  // Open-ended writing tasks & explicit 0opt tasks
  if (/^write_/i.test(pType) || /_(?:0opt|0_opt)/i.test(pType)) return 0;

  return null;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type IssueClassification =
  | 'auto_fixable'
  | 'regenerate'
  | 'needs_admin_review'
  | 'invalid_quarantine';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  classification: IssueClassification;
}

export interface DistractorQualityResult {
  allPosMatch: boolean;
  targetPos: string[];
  incompatibleDistractors: { word: string; pos: string[] }[];
  hasRationales: boolean;
  rationalesCount: number;
}

export type SemanticUniquenessStatus =
  | 'UNIQUE_ANSWER_CONFIRMED'
  | 'MULTIPLE_VALID_OPTIONS'
  | 'INSUFFICIENT_CONTEXT'
  | 'UNRESOLVED_SEMANTICS'
  | 'INVALID';

export interface SolverAnalysisResult {
  isUnambiguous: boolean;
  reason?: string;
  disambiguatingTokens?: string[];
  semantic_uniqueness_status?: SemanticUniquenessStatus;
  competingOptions?: string[];
}

export interface ExtendedValidationResult extends ValidationResult {
  issues?: ValidationIssue[];
  actionRecommendation?: 'accept' | 'regenerate' | 'needs_admin_review' | 'quarantine';
  hasSolverAmbiguity?: boolean;
  solverAnalysis?: SolverAnalysisResult;
  distractorQuality?: DistractorQualityResult;
}

export interface ValidateCandidateOptions {
  expectedLevel?: number;
  expectedSkill?: string;
  expectedPartType?: string;
  level?: number;
  skill?: string;
  part_type?: string;
  existingContentHashes?: Set<string> | string[];
  existingNearDupSignatures?: Set<string> | string[];
  targetVocabs?: string[];
  requireTargetVocab?: boolean;
  strictLevel?: boolean;
  requireDistractorRationales?: boolean;
  checkBlindSolve?: boolean;
  requireLanguageQuality?: boolean;
  lenientImport?: boolean;
}

let wordPosDictionaryCache: Map<string, string[]> | null = null;

export function normalizePosTag(raw: string): string[] {
  if (!raw) return [];
  const tokens = raw.toLowerCase().split(/[\/,\s、|]+/);
  const res = new Set<string>();
  for (const t of tokens) {
    if (t.startsWith('n') || t === '名' || t === '名词') res.add('noun');
    else if (t.startsWith('v') || t === '动' || t === '动词') res.add('verb');
    else if (t.startsWith('adj') || t === 'a' || t === '形' || t === '形容词') res.add('adjective');
    else if (t.startsWith('adv') || t === 'd' || t === '副' || t === '副词') res.add('adverb');
    else if (t.startsWith('num') || t === '数' || t === '数词') res.add('numeral');
    else if (t.startsWith('m') || t === 'q' || t === '量' || t === '量词') res.add('measure');
    else if (t.startsWith('prep') || t === 'p' || t === '介' || t === '介词') res.add('preposition');
    else if (t.startsWith('conj') || t === 'c' || t === '连' || t === '连词') res.add('conjunction');
    else if (t.startsWith('aux') || t.startsWith('part') || t === 'u' || t === '助' || t === '助词') res.add('particle');
    else if (t.startsWith('pron') || t === 'r' || t === '代' || t === '代词') res.add('pronoun');
  }
  return Array.from(res);
}

export function loadWordPosDictionary(): Map<string, string[]> {
  if (wordPosDictionaryCache) return wordPosDictionaryCache;
  const dict = new Map<string, string[]>();
  const csvPath = path.resolve(process.cwd(), 'data/inbox/hsk30.csv');
  if (fs.existsSync(csvPath)) {
    try {
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 5) {
          const simplified = parts[1].trim();
          const rawPos = parts[4].trim();
          if (simplified && rawPos) {
            const normalized = normalizePosTag(rawPos);
            if (normalized.length > 0) {
              const variants = simplified.split('|');
              for (const v of variants) {
                const word = v.trim();
                if (word) {
                  const existing = dict.get(word) || [];
                  dict.set(word, Array.from(new Set([...existing, ...normalized])));
                }
              }
            }
          }
        }
      }
    } catch {}
  }
  wordPosDictionaryCache = dict;
  return dict;
}

export const COMMON_WORD_POS_FALLBACK: Record<string, string[]> = {
  '跑步': ['verb'],
  '睡觉': ['verb'],
  '游泳': ['verb'],
  '唱歌': ['verb'],
  '跳舞': ['verb'],
  '散步': ['verb'],
  '见面': ['verb'],
  '结婚': ['verb'],
  '旅游': ['verb'],
  '买东西': ['verb'],
  '看书': ['verb'],
  '做饭': ['verb'],
};

export function getWordPos(word: string, fallbackPos?: string): string[] {
  const trimmed = word.trim();
  const dict = loadWordPosDictionary();
  const fromDict = dict.get(trimmed);
  if (fromDict && fromDict.length > 0) return fromDict;
  if (COMMON_WORD_POS_FALLBACK[trimmed]) return COMMON_WORD_POS_FALLBACK[trimmed];
  if (fallbackPos) return normalizePosTag(fallbackPos);
  return [];
}

/**
 * Lightweight Blind-Solve Heuristic:
 * Evaluates contextual constraints (measure words, verbs, complements, conjunctions)
 * to ensure exactly ONE option is unambiguously supported by the stem.
 */
export function evaluateBlindSolveHeuristic(
  q: Partial<CandidateQuestion>
): {
  hasAmbiguity: boolean;
  reason?: string;
  disambiguatingTokens?: string[];
  semantic_uniqueness_status: SemanticUniquenessStatus;
  competingOptions?: string[];
} {
  if (!q.stem || !Array.isArray(q.options) || q.options.length < 2 || typeof q.answer_idx !== 'number') {
    return { hasAmbiguity: false, semantic_uniqueness_status: 'INVALID' };
  }

  const contract = getPartTypeContract(q.part_type);

  // 1. Reading Comprehension Blind-Solve & Multiple-Support Evaluation
  if (contract.category === 'reading_comprehension') {
    const parts = q.stem.split(/(?:★|问[：:]|\?|？)/);
    const passage = parts[0] || '';
    const cleanPassage = cleanChineseText(passage);
    if (cleanPassage.length < 6) {
      return {
        hasAmbiguity: true,
        reason: `Reading comprehension passage is too short (${cleanPassage.length} Hanzi) to establish sufficient context`,
        semantic_uniqueness_status: 'INSUFFICIENT_CONTEXT',
      };
    }
    const correctOpt = (q.options[q.answer_idx] || '').trim();
    const cleanOpt = cleanChineseText(correctOpt);
    const isHighLevelComprehension = (q.level || 1) >= 3;
    if (cleanOpt.length >= 1 && !cleanPassage.includes(cleanOpt)) {
      const hasOverlap = [...cleanOpt].some((c) => cleanPassage.includes(c));
      // For HSK 3+, allow valid synonymous paraphrasing (Anti-verbatim) without false INSUFFICIENT_CONTEXT rejections
      if (!hasOverlap && !isHighLevelComprehension) {
        return {
          hasAmbiguity: true,
          reason: `Reading comprehension passage does not contain context or keywords supporting the target answer '${correctOpt}'`,
          semantic_uniqueness_status: 'INSUFFICIENT_CONTEXT',
        };
      }
    }

    // Check if any other option is directly stated and supported by the passage
    // Filter out negated or superseded distractor mentions from competingSupported:
    // Check prefix window (12 chars before distractor keyword) for negation/twist markers
    const NEGATION_OR_TWIST_PREFIXES = /(?:本来|原定|原以为|原打算|以为|并不是|不是|并非|放弃|不用|不会|不能|没|不|改到|改在|其实|实际上|难道|像|像是)/;

    const competingSupported = q.options.filter((opt, idx) => {
      if (idx === q.answer_idx) return false;
      const cleanDist = cleanChineseText(String(opt || '').trim());
      if (cleanDist.length < 2) return false;

      let searchIdx = 0;
      let hasUnnegatedOccurrence = false;
      while (searchIdx < cleanPassage.length) {
        const found = cleanPassage.indexOf(cleanDist, searchIdx);
        if (found === -1) break;
        const prefixWindow = cleanPassage.slice(Math.max(0, found - 12), found);
        if (!NEGATION_OR_TWIST_PREFIXES.test(prefixWindow)) {
          hasUnnegatedOccurrence = true;
          break;
        }
        searchIdx = found + cleanDist.length;
      }
      return hasUnnegatedOccurrence;
    });

    if (competingSupported.length > 0) {
      return {
        hasAmbiguity: true,
        reason: `Passage simultaneously supports target '${correctOpt}' and competing option(s) (${competingSupported.join(', ')}) without distinguishing criteria`,
        semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
        competingOptions: [correctOpt, ...competingSupported],
      };
    }

    return {
      hasAmbiguity: false,
      disambiguatingTokens: [`Passage context uniquely supports target option '${correctOpt}'`],
      semantic_uniqueness_status: 'UNIQUE_ANSWER_CONFIRMED',
    };
  }

  // 1B. Listening Dialogue Blind-Solve & Structure Evaluation
  if (contract.category === 'listening_dialogue') {
    if (contract.requiresVisual) {
      return { hasAmbiguity: false, semantic_uniqueness_status: 'UNIQUE_ANSWER_CONFIRMED' };
    }
    const stem = q.stem || '';
    const hasDialogueTurns = /(?:男|女|A|B)[：:]/.test(stem);
    const hasQuestion = /(?:问|★)[：:]|\?|？/.test(stem);

    if (!hasDialogueTurns || !hasQuestion) {
      return {
        hasAmbiguity: true,
        reason: 'Listening dialogue must contain structured speaker turns (男：... 女：...) and a clear question (问：...)',
        semantic_uniqueness_status: 'INSUFFICIENT_CONTEXT',
      };
    }

    const correctOpt = (q.options[q.answer_idx] || '').trim();
    const cleanOpt = cleanChineseText(correctOpt);

    // Ensure question prompt does not leak the target answer
    const questionMatch = stem.match(/(?:问|★)[：:]([\s\S]*)$/);
    if (questionMatch && cleanOpt.length >= 2) {
      const cleanQuestion = cleanChineseText(questionMatch[1]);
      if (cleanQuestion.includes(cleanOpt)) {
        return {
          hasAmbiguity: true,
          reason: `Question prompt leaks the exact correct answer '${correctOpt}'`,
          semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
        };
      }
    }

    const dialogueBody = questionMatch ? stem.slice(0, questionMatch.index) : stem;
    const cleanDialogue = cleanChineseText(dialogueBody);
    const NEGATION_OR_TWIST_PREFIXES = /(?:本来|原定|原以为|原打算|以为|并不是|不是|并非|放弃|不用|不会|不能|没|不|改到|改在|其实|实际上|难道|像|像是)/;

    const competingSupported = q.options.filter((opt, idx) => {
      if (idx === q.answer_idx) return false;
      const cleanDist = cleanChineseText(String(opt || '').trim());
      if (cleanDist.length < 2) return false;

      let searchIdx = 0;
      let hasUnnegatedOccurrence = false;
      while (searchIdx < cleanDialogue.length) {
        const found = cleanDialogue.indexOf(cleanDist, searchIdx);
        if (found === -1) break;
        const prefixWindow = cleanDialogue.slice(Math.max(0, found - 12), found);
        if (!NEGATION_OR_TWIST_PREFIXES.test(prefixWindow)) {
          hasUnnegatedOccurrence = true;
          break;
        }
        searchIdx = found + cleanDist.length;
      }
      return hasUnnegatedOccurrence;
    });

    if (competingSupported.length > 0) {
      return {
        hasAmbiguity: true,
        reason: `Dialogue simultaneously supports target '${correctOpt}' and competing option(s) (${competingSupported.join(', ')}) without distinguishing criteria`,
        semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
        competingOptions: [correctOpt, ...competingSupported],
      };
    }

    return {
      hasAmbiguity: false,
      disambiguatingTokens: [`Listening dialogue uniquely supports target option '${correctOpt}'`],
      semantic_uniqueness_status: 'UNIQUE_ANSWER_CONFIRMED',
    };
  }

  // 2. Fill-in-the-Blank Blind-Solve & Option-in-Context Evaluation
  const blankPattern = /(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/g;
  if (!blankPattern.test(q.stem)) {
    return { hasAmbiguity: false, semantic_uniqueness_status: 'UNIQUE_ANSWER_CONFIRMED' };
  }

  const stemWithoutBlank = q.stem.replace(blankPattern, ' ');
  const cleanContext = cleanChineseText(stemWithoutBlank);
  const disambiguatingTokens: string[] = [];
  const options = q.options.map((o) => String(o || '').trim());
  const correctOpt = options[q.answer_idx] || '';

  // 2A. Quantifier & Number Ambiguity before Measure Word: "____本书", "____个苹果", "____只狗"
  const blankBeforeMeasureMatch = q.stem.match(/(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])\s*([个张本只条双件把只块瓶杯碗顶部辆支根道座间首封匹台门位家口])\s*([\u4e00-\u9fa5]{1,4})?/);
  if (blankBeforeMeasureMatch) {
    const measureWord = blankBeforeMeasureMatch[1];
    const cardinalNums = ['一', '二', '两', '三', '四', '五', '六', '七', '八', '九', '十', '几', '多', '半'];
    const numberOptions = options.filter((opt) => cardinalNums.includes(opt));
    
    // In Chinese before a single measure word, '两' is valid, and '一', '三', '四', '五', etc. are ALSO valid.
    // '二' is invalid before a single measure word (e.g. *二本书).
    const validNums = numberOptions.filter((n) => n !== '二');
    if (validNums.length >= 2) {
      // Check if stem contains numerical or situational constraints specifying the quantity
      const hasNumericalConstraint =
        /(?:[0-9]{1,2}|一人一|各买一|各拿一|各有一|一共|两个|一双|一对|还有一|不是一|第[一二两三四五六七八九十]|买[一二两三]送[一二两三])/i.test(q.stem);
      
      if (!hasNumericalConstraint) {
        return {
          hasAmbiguity: true,
          reason: `Stem '${q.stem}' tests quantifier before measure word '${measureWord}', but lacks numerical or situational context; multiple options (${validNums.join(', ')}) form valid, natural sentences`,
          semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
          competingOptions: validNums,
        };
      } else {
        disambiguatingTokens.push(`Numerical constraint for measure word '${measureWord}'`);
      }
    }
  }

  // 2B. Preceding Measure Word: e.g. "三个____", "一碗____", "两只____", "一张____"
  const measureMatch = q.stem.match(/([0-9一二两三四五六七八九十几多半])\s*([个张本只条双件把只块瓶杯碗顶部辆支根道座间首封匹台门])\s*(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/);
  if (measureMatch) {
    const mw = measureMatch[2];
    const compatibleOpts = options.filter((opt) => {
      const allowedMws = HSK_CLASSIFIER_NOUN_MAP[opt];
      return Array.isArray(allowedMws) && allowedMws.includes(mw);
    });
    if (compatibleOpts.length >= 2 && cleanContext.length < 7) {
      return {
        hasAmbiguity: true,
        reason: `Underspecified stem '${q.stem}' (${cleanContext.length} Hanzi) with measure word '${mw}' allows multiple compatible noun options (${compatibleOpts.join(', ')}) without differentiating context`,
        semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
        competingOptions: compatibleOpts,
      };
    }
    disambiguatingTokens.push(`Measure word: '${mw}'`);
  }

  // 2C. Action Verbs Collocation Ambiguity: e.g. "喝____", "看____", "写____", "坐____", "买____"
  const verbMatch = q.stem.match(/([喝看听写穿戴开住骑坐买借吃玩洗刷打爬游唱跑跳])\s*(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/);
  if (verbMatch) {
    const verb = verbMatch[1];
    disambiguatingTokens.push(`Action verb: '${verb}'`);

    const commonCollocations: Record<string, string[]> = {
      '看': ['书', '电影', '电视', '报纸', '医生', '朋友'],
      '听': ['音乐', '歌', '广播', '录音', '课'],
      '吃': ['饭', '苹果', '米饭', '面条', '菜', '水果', '包子', '饺子'],
      '买': ['东西', '衣服', '书', '苹果', '电脑', '自行车'],
      '做': ['饭', '菜', '作业', '工作'],
      '喝': ['水', '茶', '咖啡', '牛奶', '果汁'],
      '穿': ['衣服', '鞋子', '裤子', '裙子'],
      '骑': ['自行车', '马'],
      '开': ['车', '出租车', '飞机', '会'],
      '坐': ['出租车', '飞机', '火车', '公共汽车', '地铁', '椅子'],
    };

    if (commonCollocations[verb]) {
      const matchingCount = options.filter((opt) => commonCollocations[verb].includes(opt)).length;
      if (matchingCount >= 2) {
        const topicalClues: Record<string, string[]> = {
          '书': ['书店', '图书馆', '借', '本', '页', '读'],
          '电影': ['电影院', '票', '好看', '张'],
          '电视': ['电视机', '节目', '频道', '遥控器', '台'],
          '医生': ['医院', '病', '生病', '看病'],
          '苹果': ['水果', '水果店', '个', '甜', '斤'],
          '米饭': ['饭店', '碗', '饿', '香'],
          '衣服': ['商场', '件', '穿', '暖和', '颜色'],
          '水': ['渴', '杯', '瓶', '温', '凉'],
          '茶': ['茶馆', '杯', '泡', '热', '绿茶'],
          '咖啡': ['咖啡馆', '杯', '苦', '糖', '加'],
        };
        const supportedByClues = options.filter((opt) => {
          const clues = topicalClues[opt] || [];
          return clues.some((clue) => cleanContext.includes(clue));
        });

        if (supportedByClues.length === 0 && cleanContext.length < 8) {
          return {
            hasAmbiguity: true,
            reason: `Underspecified stem '${q.stem}' (${cleanContext.length} Hanzi) allows multiple options (${matchingCount} options collocate with '${verb}') without differentiating context`,
            semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
            competingOptions: options.filter((opt) => commonCollocations[verb].includes(opt)),
          };
        } else if (supportedByClues.length === 1) {
          disambiguatingTokens.push(`Contextual clue for '${supportedByClues[0]}'`);
        }
      }
    }
  }

  // 2D. Resultative / Directional Complements: e.g. "放在____", "听到____", "看到____"
  const compMatch = q.stem.match(/([放听看走跑开搬移寄写送])(?:在|到|进|出|回|过|起|好|完|懂|清|见)\s*(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/);
  if (compMatch) {
    disambiguatingTokens.push(`Complement: '${compMatch[0]}'`);
  }

  // 2E. Paired Conjunctions: "因为...所以", "虽然...但是", "不仅...而且", "无论...都"
  const conjMatch = q.stem.match(/(?:因为|虽然|不仅|无论|不管|只要|如果|既然|哪怕)/);
  if (conjMatch) {
    disambiguatingTokens.push(`Conjunction: '${conjMatch[0]}'`);
  }

  // 2F. 把/被 Structures
  if (/把.+?(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/.test(q.stem)) {
    disambiguatingTokens.push(`把-construction`);
  }
  if (/被.+?(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/.test(q.stem)) {
    disambiguatingTokens.push(`被-construction`);
  }

  // 2G. Ambiguous Generic Stem Detector
  const isGenericStem = /^(?:我|你|他|她|我们|他们|爸爸|妈妈|小明|老师)?\s*(?:很|非常|最|经常)?\s*(?:想|要|打算)?\s*(?:喜欢|爱|想|要|买|有)\s*(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])\s*。?$/.test(q.stem.trim());
  if (isGenericStem) {
    return {
      hasAmbiguity: true,
      reason: 'Generic stem without disambiguating modifiers allows multiple options to be equally valid',
      disambiguatingTokens: [],
      semantic_uniqueness_status: 'INSUFFICIENT_CONTEXT',
    };
  }

  // 2H. Underspecified context without disambiguating constraints
  if (cleanContext.length < 5 && disambiguatingTokens.length === 0) {
    return {
      hasAmbiguity: true,
      reason: `Stem context is too short (${cleanContext.length} Hanzi) without sufficient disambiguating constraints`,
      semantic_uniqueness_status: 'INSUFFICIENT_CONTEXT',
    };
  }

  // 2I. Short stem with generic intensifier lacking semantic boundary
  if (cleanContext.length < 7 && disambiguatingTokens.length <= 1 && /(?:真|很|非常)\s*(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/.test(q.stem)) {
    const optionsText = options.join('');
    if (optionsText.includes('好') && (optionsText.includes('好吃') || optionsText.includes('好看'))) {
      const matchCount = ['好吃', '好看'].filter((opt) => options.includes(opt)).length;
      if (matchCount >= 2) {
        return {
          hasAmbiguity: true,
          reason: `Stem context '${q.stem}' is ambiguous between visual and sensory options ('好吃' vs '好看') without sensory context (e.g. 吃了一口/闻到)`,
          semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
          competingOptions: ['好吃', '好看'],
        };
      }
    }
  }

  // 2J. Blank followed by sensory predicate (好吃, 好喝, 好看, 好听) with interchangeable options
  if (/(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])\s*(?:很|非常|真)?(?:好吃|好喝|好看|好听)/.test(q.stem)) {
    const foodWords = ['苹果', '西瓜', '米饭', '面条', '菜', '包子', '饺子', '水果', '香蕉'];
    const matchingFoods = options.filter((opt) => foodWords.includes(opt));
    if (matchingFoods.length >= 2 && cleanContext.length <= 6) {
      return {
        hasAmbiguity: true,
        reason: `Underspecified stem '${q.stem}' (${cleanContext.length} Hanzi) allows multiple interchangeable items (${matchingFoods.join(', ')}) without differentiating context`,
        semantic_uniqueness_status: 'INSUFFICIENT_CONTEXT',
        competingOptions: matchingFoods,
      };
    }
  }

  return {
    hasAmbiguity: false,
    disambiguatingTokens,
    semantic_uniqueness_status: 'UNIQUE_ANSWER_CONFIRMED',
  };
}

function normalizePinyinForAlignment(value: string): string {
  // Ignore only separators and punctuation. NFC preserves tone marks; compaction
  // keeps syllable order and count, so added/missing syllables still mismatch.
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s.,;:!?，。；：！？、…·"'“”‘’]/gu, '');
}

function normalizeSentenceForAlignment(value: string): string {
  return value.normalize('NFC').trim();
}

function addsContentAroundSelectedOption(stem: string, option: string, completedStem: string): boolean {
  const normalizedStem = stem.normalize('NFC');
  const normalizedOption = option.normalize('NFC');
  const normalizedCompleted = completedStem.normalize('NFC').trim();
  const blankPattern = /(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/gu;
  const blanks = [...normalizedStem.matchAll(blankPattern)];
  if (blanks.length !== 1) return false;
  const blank = blanks[0];
  const prefix = normalizedStem.slice(0, blank.index);
  const suffix = normalizedStem.slice((blank.index || 0) + blank[0].length);
  if (!normalizedCompleted.startsWith(prefix) || !normalizedCompleted.endsWith(suffix)) return false;
  const end = suffix.length ? normalizedCompleted.length - suffix.length : normalizedCompleted.length;
  const inserted = normalizedCompleted.slice(prefix.length, end);
  return inserted !== normalizedOption && inserted.includes(normalizedOption);
}

export function hasTerminalPunctuation(value: string): boolean {
  // Strip trailing metadata tag like [Cấu trúc bẫy: ...] if present
  const withoutMeta = value.trim().replace(/\n?\[Cấu trúc bẫy:[^\]]*\]$/i, '').trimEnd();
  // Permit Markdown emphasis/strike closers after the sentence mark, but require
  // punctuation to remain the final substantive character.
  const text = withoutMeta.replace(/(?:\*\*|__|~~|[*_~])+$/u, '').trimEnd();
  return /[.!?。！？]["'”’」』）)\]]*$/u.test(text);
}

/**
 * Checks deterministic language-quality contracts for LLM-generated candidates.
 * Mandarin naturalness itself is a model self-review and must still be assessed by a human reviewer.
 */
export function validateQuestionLanguageQuality(q: Partial<CandidateQuestion>): string[] {
  const errors: string[] = [];
  if (!q || typeof q !== 'object' || typeof q.stem !== 'string') return errors;

  const options = Array.isArray(q.options) ? q.options : [];
  const answerIsValid = Number.isInteger(q.answer_idx) && Number(q.answer_idx) >= 0 && Number(q.answer_idx) < options.length;
  const correctOption = answerIsValid ? String(options[Number(q.answer_idx)] || '').trim() : '';
  const expectedCompletedStem = answerIsValid ? getComparableStem(q.stem, options, Number(q.answer_idx)) : q.stem;
  const isReadingComprehension = isReadingComprehensionPartType(q.part_type);
  const isFillBlank = isFillBlankPartType(q.part_type);

  if (isReadingComprehension) {
    // Reading comprehension contract: requires statement (>= 6 Hanzi) and a question marked with ★
    if (!q.stem.includes('★')) {
      errors.push('read_comprehension requires a statement and a question marked with ★');
    } else {
      const parts = q.stem.split('★');
      const statement = parts[0] || '';
      const cleanStmt = cleanChineseText(statement);
      if (cleanStmt.length < 6) {
        errors.push('read_comprehension statement must contain at least 6 Hanzi');
      }
      const questionPart = parts[1] || '';
      const cleanQ = cleanChineseText(questionPart);
      if (cleanQ.length < 2) {
        errors.push('read_comprehension question marked with ★ must contain at least 2 Hanzi');
      }
    }

    if (/\p{Script=Han}/u.test(q.stem)) {
      if (!q.pinyin || typeof q.pinyin !== 'string') {
        errors.push('pinyin is required to verify the completed Chinese sentence');
      } else {
        try {
          const expectedPinyin = generateAccuratePinyin(q.stem);
          if (!isPinyinAligned(q.pinyin, expectedPinyin)) {
            errors.push(`pinyin does not match the completed sentence (expected ${expectedPinyin})`);
          }
        } catch {
          errors.push('pinyin could not be checked against the completed sentence');
        }
      }
    }
  } else if (answerIsValid && !/^write_/i.test(q.part_type || '')) {
    const blankPattern = /(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;
    const rawVal = q.raw_completed_stem;
    const compVal = q.completed_stem;

    // Distinguish missing vs empty string vs placeholder-retaining string
    if (compVal === undefined) {
      errors.push('completed_stem is required for multiple-choice Chinese questions');
    } else if (
      (rawVal !== undefined && typeof rawVal === 'string' && !rawVal.trim()) ||
      (compVal !== undefined && typeof compVal === 'string' && !compVal.trim())
    ) {
      errors.push('completed_stem must not be empty');
      errors.push('completed_stem is required for multiple-choice Chinese questions');
    } else if (
      (rawVal && blankPattern.test(rawVal)) ||
      (compVal && blankPattern.test(compVal)) ||
      (q.canonical_completed_stem && blankPattern.test(q.canonical_completed_stem))
    ) {
      errors.push('completed_stem contains unreplaced blank placeholder');
    } else {
      const targetToCompare = rawVal !== undefined ? rawVal : compVal;
      if (
        targetToCompare &&
        expectedCompletedStem &&
        normalizeSentenceForAlignment(targetToCompare) !== normalizeSentenceForAlignment(expectedCompletedStem)
      ) {
        if (addsContentAroundSelectedOption(q.stem, correctOption, targetToCompare)) {
          errors.push('completed_stem adds content beyond the exact answer_idx option substitution');
        } else {
          errors.push('completed_stem does not match stem with the answer_idx option inserted');
        }
      }
    }

    const compactCompleted = String(q.canonical_completed_stem || compVal || rawVal || '').replace(/[\s，。！？、,.!?]/gu, '');
    if (/[这那](?:苹果|西瓜|香蕉|出租车|医院)/u.test(compactCompleted)) {
      errors.push('completed_stem has a likely missing Mandarin classifier after demonstrative');
    }

    if (/\p{Script=Han}/u.test(q.stem)) {
      if (!q.pinyin || typeof q.pinyin !== 'string') {
        errors.push('pinyin is required to verify the completed Chinese sentence');
      } else {
        try {
          const expectedPinyin = generateAccuratePinyin(expectedCompletedStem);
          if (!isPinyinAligned(q.pinyin, expectedPinyin)) {
            errors.push(`pinyin does not match the completed sentence (expected ${expectedPinyin})`);
          }
        } catch {
          errors.push('pinyin could not be checked against the completed sentence');
        }
      }
    }
  }

  const naturalnessReview = (q as any).naturalness_review;
  if (!naturalnessReview || naturalnessReview.status !== 'natural') {
    errors.push('naturalness_review must explicitly pass the completed sentence as natural');
  }
  if (typeof naturalnessReview?.rationale_vi !== 'string' || naturalnessReview.rationale_vi.trim().length < 12) {
    errors.push('naturalness_review must include a Vietnamese rationale of at least 12 characters');
  }

  const explanation = typeof q.explanation_vi === 'string' ? q.explanation_vi.trim() : '';
  if (correctOption) {
    const answerSection = explanation.match(/đáp\s*án\s*đúng\s*[:：]([\s\S]*?)(?=\n\s*-\s*phân\s*tích\s*phương\s*án\s*nhiễu|$)/i)?.[1];
    if (!answerSection || !answerSection.includes(correctOption)) {
      errors.push('explanation_vi correct-answer section must identify the answer_idx option text');
    }
  }

  const distractorSection = explanation.match(/phân\s*tích\s*phương\s*án\s*nhiễu\s*[:：]?([\s\S]*?)(?=\n\s*\[Cấu trúc bẫy|$)/i)?.[1];
  if (options.length > 1 && answerIsValid) {
    if (!distractorSection) {
      errors.push('explanation_vi must include a distractor-analysis section');
    } else {
      options.forEach((option, index) => {
        const text = String(option || '').trim();
        if (index !== Number(q.answer_idx) && text && !distractorSection.includes(text)) {
          errors.push(`explanation_vi distractor section does not account for option ${String.fromCharCode(65 + index)} (${text})`);
        }
      });
    }
  }

  if (explanation && !hasTerminalPunctuation(explanation)) {
    errors.push('explanation_vi must end with terminal punctuation');
  }

  // Contradiction safeguard: Check if explanation names a different option as correct
  if (explanation && answerIsValid) {
    const correctLetter = String.fromCharCode(65 + Number(q.answer_idx));
    const letterMatch = explanation.match(/phương\s*án\s*([A-F])\s*là\s*câu\s*trả\s*lời\s*đúng/i);
    if (letterMatch && letterMatch[1].toUpperCase() !== correctLetter) {
      errors.push(`explanation_vi designates option ${letterMatch[1].toUpperCase()} as correct, contradicting answer_idx ${correctLetter}`);
    }
  }

  // Dialogue safeguard: Standalone 问: question must contain dialogue context
  if (q.stem && /^\s*问[\s:：]/.test(q.stem)) {
    const hasDialogue = Boolean(
      (q.passage && q.passage.trim().length > 5) ||
      (q.stem.includes('\n') && (q.stem.includes('男') || q.stem.includes('女') || q.stem.includes('：') || q.stem.includes(':')))
    );
    if (!hasDialogue) {
      errors.push('Question stem starting with 问: must provide dialogue context in passage or multi-line stem');
    }
  }

  // R2: Classifier-noun collocation check & Rationale entity check
  validateClassifierNounCollocation(q, errors, []);

  // R2: Semantic/pragmatic collocation check (e.g. tea + 好吃)
  validateSemanticPragmaticCollocation(q, errors, []);

  return errors;
}

/**
 * Authoritative HSK 1–4 Classifier-Noun Collocation Map.
 * Maps standard Chinese head nouns to permitted measure words (量词).
 * Classifies checks as CODE (structural), HEURISTIC (dictionary/collocation), or MANUAL (expert review).
 */
export const HSK_CLASSIFIER_NOUN_MAP: Record<string, string[]> = {
  '笔': ['支', '枝'],
  '铅笔': ['支', '枝'],
  '书': ['本', '部', '套'],
  '书本': ['本'],
  '词典': ['本', '部'],
  '杂志': ['本', '期'],
  '本子': ['本', '个'],
  '茶': ['杯', '壶', '碗', '种'],
  '水': ['杯', '瓶', '碗', '滴', '桶'],
  '咖啡': ['杯', '壶'],
  '牛奶': ['杯', '瓶', '盒', '袋'],
  '酒': ['杯', '瓶'],
  '狗': ['只', '条'],
  '猫': ['只'],
  '鸟': ['只'],
  '鱼': ['条', '尾'],
  '衣服': ['件'],
  '衬衫': ['件'],
  '大衣': ['件'],
  '毛衣': ['件'],
  '裤子': ['条'],
  '裙子': ['条'],
  '鞋': ['双', '只'],
  '鞋子': ['双', '只'],
  '筷子': ['双', '根'],
  '车': ['辆'],
  '出租车': ['辆'],
  '自行车': ['辆'],
  '飞机': ['架'],
  '船': ['条', '艘', '只'],
  '人': ['个', '位', '名'],
  '老师': ['位', '个', '名'],
  '学生': ['个', '名', '位'],
  '医生': ['位', '个', '名'],
  '朋友': ['个', '位'],
  '桌子': ['张'],
  '床': ['张'],
  '纸': ['张'],
  '票': ['张'],
  '照片': ['张'],
  '椅子': ['把'],
  '雨伞': ['把'],
  '伞': ['把'],
  '雨': ['场', '阵'],
  '钱': ['块', '元', '毛', '角', '分'],
  '苹果': ['个', '块'],
  '香蕉': ['个', '根', '把'],
  '西瓜': ['个', '块'],
  '包子': ['个'],
  '米饭': ['碗', '粒'],
  '面条': ['碗', '根'],
  '树': ['棵'],
  '苹果树': ['棵'],
};

/**
 * Validates classifier-noun collocations, option pool viability, and explanation entity agreement.
 * Classification: HEURISTIC (Collocation Dictionary).
 */
export function validateClassifierNounCollocation(
  q: Partial<CandidateQuestion>,
  errors: string[],
  warnings: string[]
): void {
  // Defensive guard 1: ensure stem, options, answerIdx, and explanation are well-typed
  const stem = typeof q.stem === 'string' ? q.stem : '';
  const options = Array.isArray(q.options) ? q.options : [];
  const answerIdx = typeof q.answer_idx === 'number' && Number.isInteger(q.answer_idx) ? q.answer_idx : -1;
  const explanation = typeof q.explanation_vi === 'string' ? q.explanation_vi : '';

  if (!stem) return;

  // Pattern: [Numeral/Demonstrative] + [Blank] + [Noun]
  const classifierSlotPattern = /(?:[0-9一二两三四五六七八九十百千万几多每这那哪]|第[一二两三四五六七八九十]+)\s*(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])\s*([\u4e00-\u9fa5]{1,4})/u;
  const match = stem.match(classifierSlotPattern);
  if (!match) return;

  const nounSubstring = match[1];

  // Defensive guard 2: match full noun tokens where applicable
  // Prioritize exact token match. Fallback to prefix match ONLY when followed by non-noun
  // syntactic continuations (conjunction, preposition, adverb, verb, particle, or punctuation),
  // preventing compound noun prefix collisions (e.g. '苹果树' or '苹果手机' matching '苹果').
  const validContinuationPattern = /^[和跟同与及在到给从向对比把被很也都真太不没常就又再更最只放看买吃喝写穿来去坐走听说是有的了着过吗呢吧，。！？；：、\s]/u;

  const sortedNounKeys = Object.keys(HSK_CLASSIFIER_NOUN_MAP).sort((a, b) => b.length - a.length);

  let matchedNounKey = sortedNounKeys.find((k) => nounSubstring === k);

  if (!matchedNounKey) {
    matchedNounKey = sortedNounKeys.find((k) => {
      if (!nounSubstring.startsWith(k)) return false;
      const trailing = nounSubstring.slice(k.length);
      return trailing.length === 0 || validContinuationPattern.test(trailing);
    });
  }

  if (!matchedNounKey) return;

  const allowedClassifiers = HSK_CLASSIFIER_NOUN_MAP[matchedNounKey];

  // Defensive guard 3: safely retrieve selected option
  const rawSelected = answerIdx >= 0 && answerIdx < options.length ? options[answerIdx] : '';
  const selectedOption = typeof rawSelected === 'string' ? rawSelected.trim() : '';

  // 1. Selected Answer Validity: selected option must be a standard classifier for the noun
  if (selectedOption && !allowedClassifiers.includes(selectedOption)) {
    const err = `Invalid classifier collocation: '${selectedOption}' is not a standard classifier for '${matchedNounKey}' (expected: ${allowedClassifiers.join('/')})`;
    if (!errors.includes(err)) errors.push(err);
  }

  // 2. Option Pool Validity: at least one option must be a valid classifier for the noun
  // Defensive guard 4: filter options defensively checking typeof opt === 'string'
  const validOptionsInPool = options.filter(
    (opt) => typeof opt === 'string' && allowedClassifiers.includes(opt.trim())
  );
  if (validOptionsInPool.length === 0) {
    const err = `No valid classifier option exists for noun '${matchedNounKey}' in options pool`;
    if (!errors.includes(err)) errors.push(err);
  }

  // 3. Explanation Entity Mismatch Check:
  // Detect if explanation discusses a completely different classifier noun (e.g., discusses "书" when stem has "笔").
  // Scope the check to the correct-answer section (ignore text in distractor analysis section after "Phân tích phương án nhiễu").
  const distractorSectionIdx = explanation.search(
    /(?:-\s*)?phân\s*tích\s*(?:phương\s*án\s*nhiễu|các\s*đáp\s*án\s*sai|đáp\s*án\s*sai|phương\s*án\s*sai)|cấu\s*trúc\s*bẫy/i
  );
  const targetExplanation = distractorSectionIdx >= 0
    ? explanation.slice(0, distractorSectionIdx)
    : explanation;

  for (const [otherNoun] of Object.entries(HSK_CLASSIFIER_NOUN_MAP)) {
    if (otherNoun === matchedNounKey) continue;
    if (!stem.includes(otherNoun)) {
      const entityRegex = new RegExp(
        `(?:đối tượng(?:\\s*là)?|dùng cho|cho|áp dụng cho)[^.!?\\n]*[('"]?${otherNoun}[)'"]?|\\(${otherNoun}\\)`,
        'iu'
      );
      if (entityRegex.test(targetExplanation)) {
        const err = `Explanation entity mismatch: explanation refers to '${otherNoun}' which is not in the stem (stem noun is '${matchedNounKey}')`;
        if (!errors.includes(err)) errors.push(err);
        break;
      }
    }
  }
}

// ============================================================================
// Semantic / Pragmatic Collocation Heuristics (Beverages / Liquids)
// ============================================================================

/**
 * Liquid / beverage nouns: 茶, 水, 咖啡, 牛奶, 酒, 汤.
 * Excludes:
 * - Edible items containing 水: 水果 (fruit - HSK 1 food!), 水饺 (dumplings), 水煮 (dishes).
 * - Non-drink words: 水平, 水准, 水手, 香水, 墨水, 药水, 流水, 泥水, 雨水.
 * - Establishments/utensils/non-beverage compounds:
 *   茶馆, 茶店, 茶楼, 茶几, 茶杯, 茶壶, 茶叶;
 *   咖啡馆, 咖啡店, 咖啡厅, 咖啡杯, 咖啡机, 咖啡壶;
 *   牛奶糖, 牛奶饼干;
 *   酒店, 酒吧, 酒楼, 酒家, 酒席, 酒精, 酒窝;
 *   汤圆, 汤匙, 汤锅.
 */
const BEVERAGE_NOUN_PATTERN =
  /(?:茶(?!馆|店|楼|几|壶|杯|叶|水间)|(?:(?<![香墨药泥雨流水风])水(?!果|饺|煮|平|准|手))|咖啡(?!馆|店|厅|杯|机|壶)|牛奶(?!糖|饼干)|酒(?!店|吧|楼|家|席|精|窝)|汤(?!圆|匙|锅))/u;

const ADVERBIAL_MODIFIERS =
  '(?:很|非常|真(?:的)?|太|比较|特别|十分|挺|也|都|还|更|不(?:怎么)?|并不(?:怎么)?|一点也(?:不|没))';

const BLANK_PLACEHOLDER_PATTERN =
  /(?:_{1,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;

// Matches beverage noun directly predicated by 好吃 (e.g. 这杯茶很好吃, 水太好吃了, 茶的味道很好吃)
const BEVERAGE_PREDICATED_BY_EAT = new RegExp(
  `${BEVERAGE_NOUN_PATTERN.source}(?:[^\\u4e00-\\u9fa5，。！？；：\\n\\r,!?;:]*|(?:的(?:味道)?)?)[，、]?\\s*${ADVERBIAL_MODIFIERS}*\\s*好吃`,
  'u'
);

// Matches verb 喝 directly followed by 好吃 (e.g. 我想喝好吃, 喝起来很好吃, 喝得真好吃)
const DRINK_VERB_FOLLOWED_BY_EAT = new RegExp(
  `喝\\s*(?:得|起来|着)?\\s*${ADVERBIAL_MODIFIERS}*\\s*好吃`,
  'u'
);

// Matches attributive 好吃 modifying beverage noun (e.g. 好吃的茶, 好吃的水)
const EAT_ATTRIBUTIVE_BEVERAGE = new RegExp(
  `好吃\\s*的\\s*(?:[^\\u4e00-\\u9fa5，。！？；：\\n\\r,!?;:]*)\\s*${BEVERAGE_NOUN_PATTERN.source}`,
  'u'
);

// Matches a blank predicated of a beverage noun (e.g. 这杯茶很____, 这杯水____)
const BEVERAGE_BLANK_PREDICATE = new RegExp(
  `${BEVERAGE_NOUN_PATTERN.source}(?:[^\\u4e00-\\u9fa5]*|(?:的(?:味道)?)?)[，、]?\\s*${ADVERBIAL_MODIFIERS}*\\s*${BLANK_PLACEHOLDER_PATTERN.source}`,
  'u'
);

// Matches a blank directly after verb 喝 (e.g. 我想喝____)
const DRINK_BLANK_PREDICATE = new RegExp(
  `喝\\s*(?:得|起来|着)?\\s*${ADVERBIAL_MODIFIERS}*\\s*${BLANK_PLACEHOLDER_PATTERN.source}`,
  'u'
);

// Matches a blank attributively modifying a beverage noun (e.g. 这是____的茶)
const BEVERAGE_BLANK_ATTRIBUTIVE = new RegExp(
  `${BLANK_PLACEHOLDER_PATTERN.source}\\s*的\\s*(?:[^\\u4e00-\\u9fa5]*)\\s*${BEVERAGE_NOUN_PATTERN.source}`,
  'u'
);

/**
 * Validates semantic/pragmatic collocations (e.g. beverages/liquids + 好吃 vs 好喝).
 * Classification: HEURISTIC (Semantic Compatibility).
 *
 * Ensures:
 * 1. 好吃 directly modifying or predicating a beverage/liquid (茶, 水, 咖啡, 牛奶, 酒, 汤) or verb 喝 is rejected.
 * 2. Cross-clause contrasts (e.g. "苹果很好吃，茶很____。" with key "好喝") are NOT falsely rejected.
 * 3. Compound sentences with food target (e.g. "那里的菜很____，茶也很好喝。" with key "好吃") are NOT falsely rejected.
 * 4. Edible compounds with 水 (e.g. "水果", "水饺") are NOT mistakenly treated as beverages.
 */
export function validateSemanticPragmaticCollocation(
  q: Partial<CandidateQuestion>,
  errors: string[],
  warnings: string[]
): void {
  const stem = typeof q?.stem === 'string' ? q.stem : '';
  const canonicalOrCompleted =
    typeof q?.canonical_completed_stem === 'string'
      ? q.canonical_completed_stem
      : typeof q?.completed_stem === 'string'
        ? q.completed_stem
        : '';
  const rawOpt =
    typeof q?.answer_idx === 'number' && Array.isArray(q?.options)
      ? q.options[q.answer_idx]
      : '';
  const selectedOption = typeof rawOpt === 'string' ? rawOpt.trim() : '';

  // Construct substituted text if a blank exists in stem and an option was selected
  const substituted =
    BLANK_PLACEHOLDER_PATTERN.test(stem) && selectedOption
      ? stem.replace(BLANK_PLACEHOLDER_PATTERN, selectedOption)
      : '';

  const candidatesToCheck = [canonicalOrCompleted, substituted].filter(Boolean);
  if (candidatesToCheck.length === 0 && stem) candidatesToCheck.push(stem);

  // Check if any completed representation has 好吃 modifying or predicating a beverage
  const hasDirectMismatch = candidatesToCheck.some(
    (t) =>
      BEVERAGE_PREDICATED_BY_EAT.test(t) ||
      DRINK_VERB_FOLLOWED_BY_EAT.test(t) ||
      EAT_ATTRIBUTIVE_BEVERAGE.test(t)
  );

  // Check if stem has a blank in beverage/drink slot and selectedOption is '好吃'
  const isSelectedEatForBeverageBlank =
    selectedOption === '好吃' &&
    (BEVERAGE_BLANK_PREDICATE.test(stem) ||
      DRINK_BLANK_PREDICATE.test(stem) ||
      BEVERAGE_BLANK_ATTRIBUTIVE.test(stem));

  if (hasDirectMismatch || isSelectedEatForBeverageBlank) {
    const err = `Semantic collocation mismatch: '好吃' is used with beverage/liquid context ('茶'/'喝'), expected '好喝'`;
    if (!errors.includes(err)) errors.push(err);
  }

  // 1. Ambiguous beverage options in fill-in-the-blank drink context
  if (
    BLANK_PLACEHOLDER_PATTERN.test(stem) &&
    /(?:喝|一杯|一瓶|一碗|一壶)/.test(stem) &&
    Array.isArray(q?.options)
  ) {
    const commonDrinks = ['水', '牛奶', '茶', '咖啡', '果汁', '可乐', '啤酒', '红茶', '绿茶'];
    const presentDrinks = q.options.filter((opt) => typeof opt === 'string' && commonDrinks.includes(opt.trim()));
    if (presentDrinks.length >= 2) {
      const err = `Ambiguous beverage options in fill-in-the-blank: multiple plausible drinks (${presentDrinks.join(', ')}) without distinguishing context`;
      if (!errors.includes(err)) errors.push(err);
    }
  }

  // 2. Location category consistency check
  if (/(?:在哪儿|在哪|去哪儿|去哪里|在什么地方|在哪个)/.test(stem)) {
    const nonLocationActions = ['打电话', '看书', '工作', '游泳', '跑步', '做饭', '睡觉', '那些', '这些', '一下', '小时', '分钟'];
    if (selectedOption && nonLocationActions.includes(selectedOption)) {
      const err = `Location question ('${stem}') cannot have action or non-location answer '${selectedOption}'`;
      if (!errors.includes(err)) errors.push(err);
    }
  }

  // 3. Counting consistency check
  if (/(?:爸爸、妈妈和我|爸爸妈妈和我|我和爸爸妈妈)/.test(stem) && /(?:一共|总共)/.test(stem)) {
    if (['八', '8', '十', '七', '六', '五'].includes(selectedOption)) {
      const err = `Logic error: family members mentioned (爸爸、妈妈和我) cannot total '${selectedOption}'`;
      if (!errors.includes(err)) errors.push(err);
    }
  }
}

/**
 * Independent candidate question multi-layer validator:
 * 1. Structural layer: input type, bounds, options count & uniqueness, answer_idx, level 1-6 integer, skill.
 * 2. Semantic Chinese layer: Hanzi presence, zero Latin/Vietnamese in Chinese text, prohibited bracketed hints.
 * 3. Meaningful explanation: Vietnamese pedagogical rationale.
 * 4. Visual workflow decoupling: illustration_theme required only for visual part_types; null/none valid for non-visual.
 * 5. Deduplication layer: exact content_hash, sorted-options near_duplicate_signature (catches reordered A/B/C/D options), and character n-gram Jaccard similarity > 0.85 against existing stems.
 * 6. Target & Syllabus Verification layer: expected level/skill/part_type and actual text vocabulary check.
 */
export function validateCandidate(
  q: Partial<CandidateQuestion>,
  existingStems: string[] = [],
  validationOptions?: ValidateCandidateOptions
): ExtendedValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 0. Base object verification
  if (!q || typeof q !== 'object') {
    return {
      valid: false,
      errors: ['Candidate question must be a non-null object'],
      warnings: [],
      jaccardSimilarity: 0,
      lifecycleStatus: 'validation_failed',
    };
  }

  const parserShapeErrors = (q as any).__structuredShapeErrors;
  if (Array.isArray(parserShapeErrors)) {
    errors.push(...parserShapeErrors.filter((error: unknown) => typeof error === 'string'));
  }

  // 1. Required stem check
  if (!q.stem || typeof q.stem !== 'string' || q.stem.trim().length === 0) {
    errors.push('Missing or empty stem');
  } else if (q.stem.trim().length < 2) {
    errors.push('stem must be at least 2 characters');
  }

  // 1a. completed_stem placeholder & empty check
  const completedBlankPattern = /(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;
  if (
    (q.raw_completed_stem && completedBlankPattern.test(q.raw_completed_stem)) ||
    (q.completed_stem && completedBlankPattern.test(q.completed_stem)) ||
    (q.canonical_completed_stem && completedBlankPattern.test(q.canonical_completed_stem))
  ) {
    errors.push('completed_stem contains unreplaced blank placeholder');
  }

  // 1b. difficulty_tier check (if provided)
  const VALID_DIFFICULTY_TIERS = new Set([
    'tier1_difficult',
    'tier2_very_difficult',
    'tier3_challenge',
    'easy',
    'medium',
    'hard',
  ]);
  const rawTier = (q as any).difficulty_tier ?? q.difficulty;
  if (rawTier !== undefined && rawTier !== null) {
    const tier = String(rawTier).trim().toLowerCase();
    if (!VALID_DIFFICULTY_TIERS.has(tier)) {
      errors.push(
        `Invalid difficulty_tier '${rawTier}': must be one of 'tier1_difficult', 'tier2_very_difficult', 'tier3_challenge'`
      );
    }
  }

  // 1c. trap_type check (if provided)
  const VALID_TRAP_TYPES = new Set([
    'near_synonym',
    'collocation',
    'grammar_rule',
    'context_scope',
    'word_order',
    'near_synonym_collocation',
    'word_order_trap',
    'complement_boundary',
    'ba_bei_structure',
    'clause_logic',
    'anti_verbatim',
    'self_correction',
    'rhetorical_attitude',
    'numerical_twist',
  ]);
  if ((q as any).trap_type !== undefined && (q as any).trap_type !== null) {
    const trap = String((q as any).trap_type).trim().toLowerCase();
    if (!VALID_TRAP_TYPES.has(trap)) {
      warnings.push(`Unrecognized trap_type '${(q as any).trap_type}'`);
    }
  }

  // 2. Options check: dynamically validated against task-type blueprints
  const expectedOptions = q.part_type ? getExpectedOptionCount(q.level, q.part_type) : null;

  if (expectedOptions === 0) {
    // Direct writing questions (e.g. write_tianzige_from_pinyin, write_sentence_from_picture_word)
    if (Array.isArray(q.options) && q.options.length > 0) {
      errors.push(`Options must be empty for writing task type '${q.part_type}' (expected 0 options, got ${q.options.length})`);
    }
  } else {
    if (expectedOptions !== null) {
      if (!Array.isArray(q.options) || q.options.length !== expectedOptions) {
        errors.push(`Options must contain exactly ${expectedOptions} items for task type '${q.part_type}' (got ${Array.isArray(q.options) ? q.options.length : 0})`);
      }
    } else {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
        errors.push('Options must be an array of 2 to 6 items');
      }
    }

    if (Array.isArray(q.options)) {
      for (let i = 0; i < q.options.length; i++) {
        if (typeof q.options[i] !== 'string' || q.options[i].trim().length === 0) {
          errors.push(typeof q.options[i] === 'string'
            ? `options[${i}] must be a non-empty string (Option at index ${i} is empty)`
            : `options[${i}] must be a non-empty string (got ${typeof q.options[i]})`);
        }
      }
      const uniqueOptions = new Set(q.options.map((opt) => typeof opt === 'string' ? opt.trim() : `__invalid_type_${typeof opt}__`));
      if (uniqueOptions.size !== q.options.length) {
        errors.push('Options must be unique');
      }

      // Detect hallucinated stuttering or unnatural repetitive compound suffixes in options
      for (let i = 0; i < q.options.length; i++) {
        const opt = typeof q.options[i] === 'string' ? q.options[i].trim() : '';
        if (opt.length >= 4 && opt.length % 2 === 0) {
          const half = opt.slice(0, opt.length / 2);
          if (half + half === opt && !/^(谢谢|天天|常常|再见|看看|试试|等等|慢慢|快快|人人|家家)/.test(opt)) {
            errors.push(`Option[${i}] contains unnatural duplicate stuttering: '${opt}'`);
          }
        }
        if (/[一二两三四五六七八九十][个张本只条双件把块瓶杯碗顶部辆支根道座间首封匹台门]{2,}/.test(opt)) {
          errors.push(`Option[${i}] contains stacked/duplicated measure words: '${opt}'`);
        }
        if (/[个张本只条双件把块瓶杯碗顶部辆支根道座间首封匹台门](?:个|件|部|棵|堆|跑)/.test(opt)) {
          errors.push(`Option[${i}] contains invalid compound suffixes: '${opt}'`);
        }
      }
    }
  }

  // Malformed JSON option values are structural errors. Stop before semantic,
  // POS, hash, or explanation checks that require string options.
  if (Array.isArray(q.options) && q.options.some((option) => typeof option !== 'string')) {
    return {
      valid: false,
      errors,
      warnings,
      jaccardSimilarity: 0,
      lifecycleStatus: 'validation_failed',
    };
  }

  // 3. answer_idx bounds check
  if (expectedOptions === 0) {
    if (typeof q.answer_idx === 'number' && !Number.isInteger(q.answer_idx)) {
      errors.push('answer_idx must be an integer');
    }
  } else {
    if (
      typeof q.answer_idx !== 'number' ||
      !Number.isInteger(q.answer_idx) ||
      !q.options ||
      q.answer_idx < 0 ||
      q.answer_idx >= q.options.length
    ) {
      const actualType = q.answer_idx === null ? 'null' : typeof q.answer_idx;
      errors.push(`answer_idx must be an integer between 0 and ${(q.options?.length ?? 1) - 1} (got ${actualType})`);
    }
  }

  // 3b. Deterministic Single-Answer & MCQ Quality: Stem answer leakage & context sufficiency
  const blankPattern = /(?:_{2,}|（\s*）|\(\s*\)|【\s*】|\[\s*\])/g;
  const hasBlank = Boolean(typeof q.stem === 'string' && blankPattern.test(q.stem));
  const effectivePartType =
    validationOptions?.lenientImport &&
    !hasBlank &&
    /fill_blank|cloze/i.test(q.part_type || '') &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.length <= 6
      ? `read_dialogue_matching_${q.options.length}opt`
      : q.part_type;
  const contract = getPartTypeContract(effectivePartType);

  if (contract.requiresPlaceholder) {
    if (!hasBlank) {
      errors.push(`Task type '${q.part_type}' requires exactly one blank placeholder (____)`);
    } else {
      const blankMatches = (typeof q.stem === 'string' ? q.stem.match(blankPattern) : []) || [];
      if (!/bank|word_bank/i.test(q.part_type || '') && blankMatches.length !== 1) {
        errors.push(`Fill-in-the-blank question must contain exactly one blank placeholder (found ${blankMatches.length})`);
      }
    }
  }

  if (contract.prohibitsPlaceholder && hasBlank) {
    errors.push(`Task type '${q.part_type}' must not contain blank placeholders (____)`);
  }

  // Mandatory Listening Standard: Listening questions must never contain fill-in-the-blank placeholders
  const isListeningType =
    q.skill === 'listening' ||
    (typeof q.part_type === 'string' && q.part_type.startsWith('listen_'));
  if (isListeningType && hasBlank) {
    errors.push(`Listening question ('${q.part_type}') must not contain fill-in-the-blank placeholders (____)`);
  }

  // Mandatory Dialogue Turn Verification for dialogue listening questions
  const isDialogueListening =
    typeof q.part_type === 'string' &&
    q.part_type.startsWith('listen_') &&
    q.part_type.includes('dialogue');
  if (isDialogueListening && typeof q.stem === 'string') {
    const hasSpeakerTurn =
      /(?:^|\n|\s)(?:男|女|甲|乙|A|B)\s*[:：]/.test(q.stem) ||
      (typeof q.audio_text === 'string' && /(?:^|\n|\s)(?:男|女|甲|乙|A|B)\s*[:：]/.test(q.audio_text));
    if (!hasSpeakerTurn) {
      errors.push(`Dialogue listening task '${q.part_type}' requires speaker turns (e.g. 男：... 女：... or 甲：... 乙：...)`);
    }
    if (/(?:男|女)\s*[:：]\s*(?:老师|学生|朋友|我|A|B)\s*[:：]/.test(q.stem)) {
      errors.push(`Dialogue listening task contains redundant nested speaker labels (e.g. '男：老师：')`);
    }
    if (q.stem.includes('好的，我知道了')) {
      errors.push(`Dialogue listening task contains artificial filler turn '好的，我知道了'`);
    }
  }

  // Mandatory Monologue Verification for listen_talks_qa_4opt & listen_monologue_qa_3opt
  const isMonologueListening =
    typeof q.part_type === 'string' &&
    (q.part_type === 'listen_talks_qa_4opt' || q.part_type === 'listen_monologue_qa_3opt');
  if (isMonologueListening && typeof q.stem === 'string') {
    const cleanStem = cleanChineseText(q.stem);
    const lvl = Number(q.level) || 1;
    const minLen = q.part_type === 'listen_talks_qa_4opt'
      ? (lvl >= 6 ? 90 : 70)
      : (lvl === 1 ? 20 : (lvl === 2 ? 28 : (lvl === 3 ? 35 : 40)));
    if (cleanStem.length < minLen) {
      errors.push(`Monologue listening task '${q.part_type}' stem is too short (${cleanStem.length} chars, expected >= ${minLen} for HSK ${lvl})`);
    }
    const hasQuestionMarker = /问[：:]|[？?]/.test(q.stem);
    if (!hasQuestionMarker) {
      errors.push(`Monologue listening task '${q.part_type}' must include a question prompt (e.g. '问：...' or question mark)`);
    }
  }

  if (contract.requiresQuestionMarkStar && !validationOptions?.lenientImport) {
    const hasPassageQuestion = Boolean(
      typeof q.passage === 'string' && q.passage.trim().length >= 6 &&
      typeof q.stem === 'string' && q.stem.trim().length > 0
    );
    if (!hasPassageQuestion && (typeof q.stem !== 'string' || !q.stem.includes('★'))) {
      errors.push(`Task type '${q.part_type}' requires a question marked with ★`);
    }
  }

  if (isReadingComprehensionPartType(q.part_type) && typeof q.stem === 'string') {
    const hasPassage = typeof q.passage === 'string' && cleanChineseText(q.passage).length >= 6;
    if (!hasPassage) {
      const parts = q.stem.split('★');
      const statement = parts[0] || '';
      const cleanStatement = cleanChineseText(statement);
      if (cleanStatement.length < 6) {
        errors.push(`Reading comprehension statement must contain at least 6 Hanzi (got ${cleanStatement.length})`);
      }
    }
  }

  if (hasBlank && typeof q.stem === 'string') {
    const stemWithoutBlank = q.stem.replace(blankPattern, '');
    const cleanContext = cleanChineseText(stemWithoutBlank);
    if (cleanContext.length < 4) {
      errors.push(`Stem context is underspecified (${cleanContext.length} Hanzi); insufficient context for a deterministic single answer`);
    }

    if (
      Array.isArray(q.options) &&
      typeof q.answer_idx === 'number' &&
      q.answer_idx >= 0 &&
      q.answer_idx < q.options.length
    ) {
      const correctOpt = (q.options[q.answer_idx] || '').trim();
      if (correctOpt.length >= 1 && stemWithoutBlank.includes(correctOpt)) {
        errors.push(`Stem answer leakage detected: correct option '${correctOpt}' already appears in the stem outside the blank placeholder`);
      }
    }
  }

  // 4. Explanation check: constructive pedagogical rationale in Vietnamese
  if (!q.explanation_vi || typeof q.explanation_vi !== 'string' || q.explanation_vi.trim().length < 5) {
    errors.push('explanation_vi must be at least 5 characters');
  } else {
    const vietnameseWordRegex = /[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
    if (!vietnameseWordRegex.test(q.explanation_vi)) {
      errors.push('explanation_vi must contain meaningful Vietnamese text');
    }
    if (q.explanation_vi.trim().length < 10) {
      warnings.push('explanation_vi is brief; consider providing a more detailed grammar/collocation explanation');
    }

    // 4b. Explanation-to-Answer Consistency
    if (
      Array.isArray(q.options) &&
      typeof q.answer_idx === 'number' &&
      q.answer_idx >= 0 &&
      q.answer_idx < q.options.length
    ) {
      const correctOpt = (q.options[q.answer_idx] || '').trim();
      const correctLetter = String.fromCharCode(65 + q.answer_idx); // 0 -> A, 1 -> B, etc.

      // Detect explicit option letter contradictions (e.g. "đáp án đúng là B" when answer_idx is 0)
      const letterMatches =
        q.explanation_vi.match(/(?:đáp\s*án\s*đúng\s*là|chọn|phương\s*án\s*đúng\s*là)\s*[:：]?\s*([A-Fa-f])\b/i) ||
        q.explanation_vi.match(/\b([A-Fa-f])\s*là\s*đáp\s*án\s*đúng/i) ||
        q.explanation_vi.match(/phương\s*án\s*([A-Fa-f])\s*là\s*câu\s*trả\s*lời\s*đúng/i);
      if (letterMatches && letterMatches[1]) {
        const designatedLetter = letterMatches[1].toUpperCase();
        if (designatedLetter !== correctLetter) {
          errors.push(
            `Explanation contradicts answer_idx: explanation designates option ${designatedLetter} as correct, but answer_idx is ${q.answer_idx} (${correctLetter})`
          );
        }
      }

      // Detect distractor designated as correct
      for (let idx = 0; idx < q.options.length; idx++) {
        if (idx !== q.answer_idx) {
          const distractor = (q.options[idx] || '').trim();
          if (distractor.length >= 1) {
            // Must strictly catch designation of distractor as correct answer:
            // "đáp án đúng là [distractor]", "phương án đúng là [distractor]", "cần/phải chọn [distractor]"
            // NEVER falsely match "lựa chọn [distractor] là phương án sai" or "không chọn [distractor]"
            const distractorRegex = new RegExp(
              `(?:đáp\\s*án\\s*(?:đúng|chính\\s*xác)\\s*là|phương\\s*án\\s*(?:đúng|chính\\s*xác)\\s*là|(?:cần|nên|phải)\\s+chọn)\\s*[:：]?\\s*["'“‘]?${escapeRegex(distractor)}["'”’]?`,
              'i'
            );
            const pickRegex = new RegExp(
              `(?<!lựa\\s+|không\\s+|không\\s+thể\\s+|không\\s+được\\s+|không\\s+nên\\s+|chưa\\s+|chưa\\s+thể\\s+|loại\\s+bỏ\\s+|tránh\\s+)\\bchọn\\s*[:：]?\\s*["'“‘]?${escapeRegex(distractor)}["'”’]?`,
              'i'
            );
            if (distractorRegex.test(q.explanation_vi) || pickRegex.test(q.explanation_vi)) {
              errors.push(
                `Explanation designates distractor '${distractor}' as correct instead of '${correctOpt}'`
              );
            }
          }
        }
      }
    }
  }

  if (validationOptions?.requireLanguageQuality) {
    errors.push(...validateQuestionLanguageQuality(q));
  }

  // Always enforce classifier-noun collocation and semantic collocation contracts
  validateClassifierNounCollocation(q, errors, warnings);
  validateSemanticPragmaticCollocation(q, errors, warnings);

  // 4c. Distractor Rationales Verification
  let distractorRationales: DistractorRationaleItem[] = [];
  let hasDistractorRationales = false;
  const rawRationales = (q as any).distractor_rationales;

  if (Array.isArray(rawRationales) && rawRationales.length > 0) {
    hasDistractorRationales = true;
    distractorRationales = rawRationales.map((dr: any, idx: number) => ({
      optionIdx: dr.option_idx ?? dr.optionIdx,
      optionText: dr.option_text ?? dr.optionText ?? '',
      rationaleVi: dr.rationale_vi ?? dr.rationaleVi ?? '',
      isCorrect: dr.is_correct ?? dr.isCorrect ?? false,
    }));
  } else if (rawRationales && typeof rawRationales === 'object') {
    const entries = Object.entries(rawRationales);
    if (entries.length > 0) {
      hasDistractorRationales = true;
      distractorRationales = entries.map(([key, val]) => {
        let optIdx = -1;
        const letter = key.trim().toUpperCase();
        if (/^[A-F]$/.test(letter)) optIdx = letter.charCodeAt(0) - 65;
        else if (/^\d+$/.test(key.trim())) optIdx = parseInt(key.trim(), 10);
        return {
          optionIdx: optIdx,
          optionText: q.options && optIdx >= 0 && optIdx < q.options.length ? q.options[optIdx] : '',
          rationaleVi: String(val || ''),
          isCorrect: q.answer_idx !== undefined ? optIdx === q.answer_idx : false,
        };
      });
    }
  }

  if (!hasDistractorRationales && q.explanation_vi) {
    const parsed = parseExplanationDistractorRationales(q.explanation_vi, q.options, q.answer_idx);
    if (parsed.hasDistractorRationales) {
      hasDistractorRationales = true;
      distractorRationales = parsed.distractors;
    }
  }

  const isMcq = Array.isArray(q.options) && q.options.length >= 2;
  if (isMcq) {
    if (validationOptions?.requireDistractorRationales) {
      if (!Array.isArray(rawRationales)) {
        errors.push('distractor_rationales must be an indexed array');
      } else if (Number.isInteger(q.answer_idx) && q.answer_idx >= 0 && q.answer_idx < q.options.length) {
        const expected = q.options.map((_, index) => index).filter((index) => index !== q.answer_idx);
        const seen = new Set<number>();
        for (const [position, item] of rawRationales.entries()) {
          const idx = item?.option_idx ?? item?.optionIdx;
          const path = `distractor_rationales[${position}]`;
          if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
            errors.push(`${path}.option_idx must be a valid option index`);
            continue;
          }
          if (idx === q.answer_idx) errors.push(`${path}.option_idx must not reference the correct answer`);
          if (seen.has(idx)) errors.push(`${path}.option_idx duplicates another distractor rationale`);
          seen.add(idx);
          const optionText = item?.option_text ?? item?.optionText;
          if (optionText !== q.options[idx]) errors.push(`${path}.option_text must exactly match options[option_idx]`);
          const rationale = String(item?.rationale_vi ?? item?.rationaleVi ?? '').trim();
          if (rationale && !rationale.includes(q.options[idx])) {
            errors.push(`${path}.rationale_vi must identify its indexed option text`);
            if (optionText && !rationale.includes(optionText)) {
              errors.push(`${path}.rationale_vi mentions a different option text than declared`);
            }
          }
          // Cross-distractor contamination check:
          // A distractor rationale must not erroneously explain a DIFFERENT incorrect distractor.
          // Note: Contrasting with the correct answer (q.options[q.answer_idx]) or source text is valid.
          const selfOption = String(q.options[idx] ?? '').trim();
          const correctOption = Number.isInteger(q.answer_idx) && q.answer_idx >= 0 && q.answer_idx < q.options.length
            ? String(q.options[q.answer_idx] ?? '').trim()
            : '';

          for (let otherIdx = 0; otherIdx < q.options.length; otherIdx++) {
            if (otherIdx === idx || otherIdx === q.answer_idx) continue;
            const otherDistractor = String(q.options[otherIdx] ?? '').trim();
            if (!otherDistractor) continue;

            if (rationale.includes(otherDistractor)) {
              // Substring safety: only mask selfOption / correctOption if they strictly contain otherDistractor
              const maskTokens = [selfOption, correctOption].filter(
                (tok) => tok.length > otherDistractor.length && tok.includes(otherDistractor)
              );
              maskTokens.sort((a, b) => b.length - a.length);

              let testText = rationale;
              for (const tok of maskTokens) {
                testText = testText.split(tok).join('\u0000');
              }

              if (testText.includes(otherDistractor)) {
                errors.push(`${path}.rationale_vi mentions a different option text (cross-distractor contamination: '${otherDistractor}')`);
              }
            }
          }
        }
        for (const idx of expected) if (!seen.has(idx)) errors.push(`distractor_rationales is missing option index ${idx}`);
        if (rawRationales.length !== expected.length) errors.push('distractor_rationales must contain exactly one rationale per incorrect option');
      }
    }
    if (hasDistractorRationales) {
      for (const dr of distractorRationales) {
        if (!dr.isCorrect && (!dr.rationaleVi || dr.rationaleVi.trim().length < 5)) {
          warnings.push(`Distractor rationale for option ${String.fromCharCode(65 + dr.optionIdx)} is too brief`);
        }
      }
    } else if (validationOptions?.requireDistractorRationales) {
      errors.push('Question requires distractor rationales explaining why incorrect options are rejected');
    }
  }

  // 4d. Distractor Part-of-Speech Verification
  let distractorQuality: DistractorQualityResult | undefined;
  const isWordBankOrMatching = Boolean(
    q.part_type && /word_bank|matching/i.test(q.part_type)
  );
  if (isMcq && typeof q.answer_idx === 'number' && Number.isInteger(q.answer_idx) && q.answer_idx >= 0 && q.answer_idx < q.options.length) {
    if (isWordBankOrMatching) {
      distractorQuality = {
        allPosMatch: true,
        targetPos: [],
        incompatibleDistractors: [],
        hasRationales: hasDistractorRationales,
        rationalesCount: distractorRationales.length,
      };
    } else {
      const correctOpt = q.options[q.answer_idx].trim();
      const targetPos = getWordPos(correctOpt, (q as any).pos);
      const distractors = q.options.filter((_, idx) => idx !== q.answer_idx);
      const incompatible: { word: string; pos: string[] }[] = [];

      if (targetPos.length > 0) {
        for (const d of distractors) {
          const dTrim = d.trim();
          const dPos = getWordPos(dTrim);
          if (dPos.length > 0) {
            const sharesPos = dPos.some((p) => targetPos.includes(p));
            if (!sharesPos) {
              incompatible.push({ word: dTrim, pos: dPos });
            }
          }
        }
        if (incompatible.length > 0) {
          warnings.push(
            `Distractor POS mismatch (target '${correctOpt}' is ${targetPos.join('/')}): ${incompatible.map((i) => `'${i.word}' (${i.pos.join('/')})`).join(', ')}`
          );
        }
      }

      distractorQuality = {
        allPosMatch: incompatible.length === 0,
        targetPos,
        incompatibleDistractors: incompatible,
        hasRationales: hasDistractorRationales,
        rationalesCount: distractorRationales.length,
      };
    }
  }

  // 6d. Lightweight Blind-Solve Heuristic & Semantic Uniqueness Evaluation
  let hasSolverAmbiguity = false;
  let solverAnalysis: SolverAnalysisResult = {
    isUnambiguous: true,
    semantic_uniqueness_status: 'UNIQUE_ANSWER_CONFIRMED',
  };
  const shouldEvaluateBlindSolve =
    (hasBlank && isMcq) ||
    contract.category === 'reading_comprehension' ||
    contract.category === 'listening_dialogue';
  if (shouldEvaluateBlindSolve) {
    const blindSolve = evaluateBlindSolveHeuristic(q);
    hasSolverAmbiguity = blindSolve.hasAmbiguity;
    solverAnalysis = {
      isUnambiguous: !blindSolve.hasAmbiguity,
      reason: blindSolve.reason,
      disambiguatingTokens: blindSolve.disambiguatingTokens,
      semantic_uniqueness_status: blindSolve.semantic_uniqueness_status,
      competingOptions: blindSolve.competingOptions,
    };
    if (blindSolve.semantic_uniqueness_status === 'MULTIPLE_VALID_OPTIONS') {
      if (validationOptions?.lenientImport) {
        warnings.push(`Multiple valid options detected (answer not unique): ${blindSolve.reason}`);
      } else {
        errors.push(`Multiple valid options detected (answer not unique): ${blindSolve.reason}`);
      }
    } else if (
      blindSolve.semantic_uniqueness_status === 'INSUFFICIENT_CONTEXT' ||
      blindSolve.semantic_uniqueness_status === 'UNRESOLVED_SEMANTICS'
    ) {
      warnings.push(`Blind-solve heuristic detected potential answer ambiguity: ${blindSolve.reason}`);
    } else if (hasSolverAmbiguity) {
      warnings.push(`Blind-solve heuristic detected potential answer ambiguity: ${blindSolve.reason}`);
    }
  }

  // 5. Level check (HSK 1 to 6 integer)
  const expLevel = validationOptions?.expectedLevel ?? validationOptions?.level;
  const expSkill = validationOptions?.expectedSkill ?? validationOptions?.skill;
  if (typeof q.level !== 'number' || !Number.isInteger(q.level) || q.level < 1 || q.level > 6) {
    errors.push('level must be an integer between 1 and 6');
  } else if (
    expLevel !== undefined &&
    q.level !== expLevel
  ) {
    errors.push(`level (${q.level}) does not match expected HSK level (${expLevel})`);
  }

  // 6. Skill check
  if (!q.skill || !['listening', 'reading', 'writing'].includes(q.skill)) {
    errors.push("skill must be 'listening', 'reading', or 'writing'");
  } else if (
    expSkill &&
    expSkill !== 'all' &&
    q.skill !== expSkill
  ) {
    errors.push(`skill ('${q.skill}') does not match expected skill ('${expSkill}')`);
  }

  // 6b. Listening Audio & Transcript Verification
  if (q.skill === 'listening') {
    const audioText = (q as any).audio_text || (q as any).transcript || q.passage || '';
    const hasAudioText = typeof audioText === 'string' && audioText.trim().length > 0;
    const stemHasAudio =
      typeof q.stem === 'string' &&
      cleanChineseText(q.stem).length >= 2 &&
      !/请听|根据|选择正确|听录音/i.test(q.stem);

    if (!hasAudioText && !stemHasAudio) {
      errors.push('Listening question requires audio text, transcript, or dialogue passage');
    } else {
      const fullAudio = `${audioText} ${q.stem || ''}`;
      if (q.part_type && /dialogue|talks|conversation/i.test(q.part_type)) {
        const hasSpokenTurns =
          (fullAudio.includes('男') && fullAudio.includes('女')) || /(?:男|女|A|B)[：:]/i.test(fullAudio);
        if (!hasSpokenTurns) {
          warnings.push(
            `Listening dialogue question ('${q.part_type}') should contain spoken dialogue turns (e.g. 男：... 女：...)`
          );
        }
      }
    }
  }

  // 6b. Expected part_type check
  if (
    validationOptions?.expectedPartType &&
    q.part_type &&
    q.part_type !== validationOptions.expectedPartType
  ) {
    errors.push(`part_type ('${q.part_type}') does not match expected part_type ('${validationOptions.expectedPartType}')`);
  }

  // 7. Semantic Chinese Quality Layer
  // 7a. Hanzi presence check: stem must contain >= 1 Hanzi character
  const hanziRegex = /[\u4e00-\u9fa5]/;
  if (q.stem && typeof q.stem === 'string' && !hanziRegex.test(q.stem)) {
    errors.push('stem must contain at least one Chinese character (Hanzi)');
  }

  // 7b. Clean character check: stem and options must not contain Latin or Vietnamese characters
  // (Exempts pinyin prompts in writing tasks and single-letter option labels A-F in picture matching.
  // Strips inline Latin/pinyin in parentheses so parenthesized pinyin annotations are properly handled)
  const latinVietnameseRegex = /[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
  const isPinyinPrompt = Boolean(q.part_type && /pinyin/i.test(q.part_type));
  const stemForLatinCheck = typeof q.stem === 'string'
    ? q.stem
        .replace(/[\(\uff08][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+[\)\uff09]/g, '')
        .replace(/[\[【][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+[\]】]/g, '')
        .trim()
    : q.stem;
  if (stemForLatinCheck && !isPinyinPrompt && latinVietnameseRegex.test(stemForLatinCheck)) {
    errors.push('stem contains invalid Latin or Vietnamese characters');
  }
  if (q.options && Array.isArray(q.options)) {
    for (const opt of q.options) {
      if (typeof opt === 'string') {
        const isLetterOrTfLabel = /^(?:[A-Fa-f]|对|错|√|×|✓|✗|Đúng|Sai|True|False|✓\s*Đúng|✗\s*Sai)$/i.test(opt.trim());
        const optForLatinCheck = opt
          .replace(/[\(\uff08][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+[\)\uff09]/g, '')
          .replace(/[\[【][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+[\]】]/g, '')
          .trim();
        if (latinVietnameseRegex.test(optForLatinCheck) && !isLetterOrTfLabel) {
          errors.push(`option '${opt}' contains invalid Latin or Vietnamese characters`);
        }
      }
    }
  }

  // 8. Bracketed hints check (supports standard and full-width Chinese brackets)
  if (q.stem && /(?:[\(\uff08][^\)\uff09]*(?:đáp án|gợi ý|answer|hint|答案)[^\)\uff09]*[\)\uff09])/i.test(q.stem)) {
    errors.push('stem contains prohibited bracketed hint');
  }

  // 9. Visual Workflow & Theme Decoupling
  const requiresVisual = isVisualQuestionType(q.part_type);
  const imageOptionPartTypes = new Set([
    'listen_picture_match_3opt',
    'listen_dialogue_picture_match_6opt',
    'listen_dialogue_picture_match_split',
    'read_sentence_picture_match_6opt',
    'read_sentence_picture_match_split',
  ]);
  const requiresImageOptions = Boolean(q.part_type && imageOptionPartTypes.has(q.part_type));
  const optionImages = Array.isArray(q.options_images) ? q.options_images : [];
  if (requiresImageOptions && expectedOptions !== null && optionImages.length !== expectedOptions) {
    errors.push(`options_images must contain exactly ${expectedOptions} images for task type '${q.part_type}'`);
  }
  if (optionImages.length > 0) {
    if (!Array.isArray(q.options_images) || optionImages.length !== (q.options || []).length) {
      errors.push('options_images must have one image per answer option');
    }
    const normalizedImages = optionImages.map((image) => String(image || '').trim().toLowerCase());
    if (new Set(normalizedImages).size !== normalizedImages.length) {
      errors.push('options_images must contain distinct image choices');
    }
    for (const image of normalizedImages) {
      if (!isValidIllustrationTheme(image)) {
        errors.push(`options_images contains unsupported SVG scene '${image}'`);
      }
    }
  }
  if (requiresVisual) {
    // Picture choices may be represented by a complete option image bank.
    const hasValidImageBank = optionImages.length > 0 &&
      optionImages.length === (q.options || []).length &&
      optionImages.every((image) => isValidIllustrationTheme(String(image || '').trim().toLowerCase()));

    // Anti-leakage: when options are text choices for a single illustration, stem must not speak or display the correct option verbatim
    if (!hasValidImageBank && typeof q.answer_idx === 'number' && Array.isArray(q.options) && q.options[q.answer_idx]) {
      const correctOpt = String(q.options[q.answer_idx] || '').trim();
      const cleanStem = cleanChineseText(q.stem || '');
      const cleanOpt = cleanChineseText(correctOpt);
      if (cleanOpt.length >= 2 && cleanStem.includes(cleanOpt)) {
        errors.push(`Picture matching stem verbatim leaks the correct answer option '${correctOpt}'`);
      }
    }

    if (requiresImageOptions && !hasValidImageBank) {
      if (validationOptions?.lenientImport && Array.isArray(q.options) && q.options.length > 0) {
        const fallbackThemes = ['apple', 'banana', 'watermelon', 'taxi', 'train', 'airplane'];
        q.options_images = fallbackThemes.slice(0, q.options.length);
      } else {
        errors.push('options_images is required for this picture-choice task');
      }
    } else if (!hasValidImageBank && (
      !q.illustration_theme ||
      typeof q.illustration_theme !== 'string' ||
      q.illustration_theme.trim().length === 0 ||
      q.illustration_theme.trim().toLowerCase() === 'none' ||
      q.illustration_theme.trim().toLowerCase() === 'null'
    )) {
      if (validationOptions?.lenientImport) {
        q.illustration_theme = 'reading';
      } else {
        errors.push('illustration_theme is required for picture-matching questions');
      }
    } else if (!hasValidImageBank && !isValidIllustrationTheme(q.illustration_theme)) {
      if (validationOptions?.lenientImport) {
        q.illustration_theme = 'reading';
      } else {
        errors.push(`illustration_theme '${q.illustration_theme}' is not one of the 27 supported SVG scenes`);
      }
    }
  } else {
    // Non-visual question: illustration_theme may be null, undefined, "", "none", or "null"
    const rawTheme = q.illustration_theme ? q.illustration_theme.trim().toLowerCase() : null;
    if (rawTheme && rawTheme !== 'none' && rawTheme !== 'null') {
      if (!isValidIllustrationTheme(rawTheme)) {
        if (validationOptions?.lenientImport) {
          q.illustration_theme = null;
        } else {
          errors.push(`illustration_theme '${q.illustration_theme}' is not one of the 27 supported SVG scenes`);
        }
      }
    }
  }

  // 10. Deduplication layer: Exact content_hash, Sorted-Options Near-Duplicate Signature, and Stem Jaccard (>85%)
  let maxSimilarity = 0;
  let matchedExisting: string | undefined;
  let contentHash: string | undefined;
  let nearDuplicateSignature: string | undefined;

  if (typeof q.stem === 'string' && Array.isArray(q.options)) {
    nearDuplicateSignature = computeNearDuplicateSignature(q.stem, q.options);
    if (typeof q.answer_idx === 'number') {
      contentHash = computeContentHash(q.stem, q.options, q.answer_idx, q.options_images);
    }

    if (contentHash && validationOptions?.existingContentHashes) {
      const hashSet = validationOptions.existingContentHashes instanceof Set
        ? validationOptions.existingContentHashes
        : new Set(validationOptions.existingContentHashes);
      if (hashSet.has(contentHash)) {
        errors.push('Exact duplicate detected (matching content_hash)');
      }
    }

    if (nearDuplicateSignature && validationOptions?.existingNearDupSignatures) {
      const sigSet = validationOptions.existingNearDupSignatures instanceof Set
        ? validationOptions.existingNearDupSignatures
        : new Set(validationOptions.existingNearDupSignatures);
      if (sigSet.has(nearDuplicateSignature)) {
        errors.push('Near-duplicate detected (matching normalized stem and sorted options signature, including shuffled option order)');
      }
    }
  }

  if (typeof q.stem === 'string' && Array.isArray(q.options) && typeof q.answer_idx === 'number' && q.answer_idx >= 0 && q.answer_idx < q.options.length) {
    const candidateFilled = getComparableStem(q.stem, q.options, q.answer_idx);
    const candidateRawClean = cleanChineseText(q.stem);
    for (const existing of existingStems) {
      if (!existing || existing.trim().length === 0) continue;
      // Check both filled stem and raw stem (catches shuffled options where blank was filled with a different index or raw stem was stored)
      const simFilled = calculateJaccardSimilarity(candidateFilled, existing);
      const simRaw = candidateRawClean.length >= 4 ? calculateJaccardSimilarity(q.stem, existing) : 0;
      const sim = Math.max(simFilled, simRaw);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        matchedExisting = existing;
      }
      if (sim > 0.85) {
        errors.push(`Stem similarity (${(sim * 100).toFixed(1)}%) exceeds 85% threshold with existing stem`);
        break;
      }
    }
  }

  // 11. Target Vocabulary & Syllabus Verification
  let verifiedTestedVocab: string[] = [];
  let verifiedContextualVocab: string[] = [];
  let verified: ReturnType<typeof verifyQuestionVocab> | null = null;
  if (typeof q.stem === 'string' && Array.isArray(q.options) && typeof q.level === 'number' && q.level >= 1 && q.level <= 6) {
    verified = verifyQuestionVocab(
      {
        stem: q.stem,
        options: q.options,
        answer_idx: q.answer_idx,
        passage: q.passage || undefined,
        transcript: (q as any).transcript || (q as any).audio_text || undefined,
        audio_text: (q as any).audio_text || undefined,
        tested_vocab: q.tested_vocab || q.vocab_tags,
        part_type: q.part_type,
      },
      q.level
    );
    verifiedTestedVocab = verified.tested;
    verifiedContextualVocab = verified.contextual;

    // Surface errors for over-level vocabulary in HSK 1 or when strictLevel is active
    if (verified.aboveLevel && verified.aboveLevel.length > 0) {
      const isMultiPartTask = Boolean(
        q.part_type && /word_bank|matching|true_false/i.test(q.part_type)
      );
      // In True/False questions (e.g. read_true_false_2opt), options '对' (HSK 1) and '错' (HSK 2)
      // are standard structural task indicators, not tested vocabulary.
      const relevantAbove = (q.part_type === 'read_true_false_2opt' || /true_false/i.test(q.part_type || ''))
        ? verified.aboveLevel.filter((a) => a.word !== '错' && a.word !== '对')
        : verified.aboveLevel;

      if (relevantAbove.length > 0) {
        const details = relevantAbove.map((a) => `${a.word} (HSK ${a.wordLevel}${a.source ? ` [${a.source}]` : ''})`).join(', ');
        const hasTestedAbove = relevantAbove.some((a) => a.source === 'tested' || !a.source);
        const msg = hasTestedAbove
          ? `Tested vocabulary exceeds HSK Level ${q.level} (exceeding HSK Level ${q.level}): ${details}`
          : `Question contains vocabulary exceeding HSK Level ${q.level}: ${details}`;
        const hardExceeding = relevantAbove.filter((a) => {
          if (validationOptions?.lenientImport || (q as any).is_imported) {
            return false;
          }
          if (validationOptions?.strictLevel === false) {
            return false;
          }
          // In multi-part tasks, context/dialogue matching may include conversational phrases
          if (isMultiPartTask && a.source === 'context' && a.wordLevel <= (q.level ?? 1) + 2) {
            return false;
          }
          // When distractor rationales are required, contextual distractor words are pedagogical traps, not hard errors
          if (validationOptions?.requireDistractorRationales && a.source === 'context') {
            return false;
          }
          // Tier-1 difficult questions intentionally allow advanced contextual distractors and vocabulary
          if (q.difficulty_tier === 'tier1_difficult' && a.source === 'context') {
            return false;
          }
          // Strict level enforcement: promote over-level words to blocking errors
          if (validationOptions?.strictLevel === true) {
            return true;
          }
          // Normal validation: over-level words generate warnings for admin review, not blocking errors
          return false;
        });

        if (hardExceeding.length > 0) {
          errors.push(msg);
        } else {
          warnings.push(msg);
        }
      }
    }

    // Minimum Level Difficulty Floor Gatekeeper:
    // Ensure advanced questions (HSK 5 & 6) are not simplistic elementary questions disguised under high level
    if (q.level === 6) {
      const maxLvl = verified.maxWordLevel ?? 1;
      const cleanStem = cleanChineseText(q.stem || '');
      const hasPassage = typeof q.passage === 'string' && q.passage.trim().length > 30;
      if (maxLvl < 6 && !hasPassage && cleanStem.length < 80) {
        errors.push(
          `Question marked as HSK 6 does not meet minimum level difficulty: contains only elementary/intermediate HSK 1–${maxLvl} vocabulary (stem length: ${cleanStem.length} chars). Requires HSK 6 advanced vocabulary, idioms, or comprehensive discourse.`
        );
      }
    } else if (q.level === 5) {
      const maxLvl = verified.maxWordLevel ?? 1;
      const cleanStem = cleanChineseText(q.stem || '');
      const hasPassage = typeof q.passage === 'string' && q.passage.trim().length > 30;
      if (maxLvl < 5 && !hasPassage && cleanStem.length < 50) {
        errors.push(
          `Question marked as HSK 5 does not meet minimum level difficulty: contains only elementary HSK 1–${maxLvl} vocabulary (stem length: ${cleanStem.length} chars). Requires HSK 5 vocabulary or discourse.`
        );
      }
    }

    // Surface review errors/warnings for out-of-catalog items
    if (verified.outOfSyllabus && verified.outOfSyllabus.length > 0) {
      const msg = `Question contains out-of-syllabus items requiring review: ${verified.outOfSyllabus.join(', ')}`;
      if (validationOptions?.strictLevel === true) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }

    // Surface discrepancies if LLM declared tested words absent from text
    if (verified.discrepancies?.falseClaims && verified.discrepancies.falseClaims.length > 0) {
      warnings.push(
        `Declared tested vocabulary not found in question: ${verified.discrepancies.falseClaims.join(', ')}`
      );
    }

    if (validationOptions?.targetVocabs && validationOptions.targetVocabs.length > 0) {
      const fullText = `${q.stem || ''} ${q.passage || ''} ${(q.options || []).join(' ')}`;
      const matchedTargets = validationOptions.targetVocabs.filter((tv) => tv && fullText.includes(tv));
      if (matchedTargets.length === 0) {
        if (validationOptions.requireTargetVocab) {
          errors.push(
            `Question does not contain any required target vocabulary (${validationOptions.targetVocabs.join(', ')})`
          );
        } else {
          warnings.push(
            `Question does not contain planned target vocabulary (${validationOptions.targetVocabs.join(', ')})`
          );
        }
      }
    }
  }

  const valid = errors.length === 0;
  const lifecycleStatus: QuestionLifecycleStatus = valid ? 'pending' : 'validation_failed';

  // Classify issues cleanly: auto_fixable, regenerate, needs_admin_review, or invalid_quarantine
  const issues: ValidationIssue[] = [];
  for (const err of errors) {
    let classification: IssueClassification = 'invalid_quarantine';
    if (/options must contain exactly|options must be an array|near-duplicate|exact duplicate|similarity/i.test(err)) {
      classification = 'regenerate';
    } else if (/leakage|contradicts|underspecified|invalid.*characters|prohibited|exceeds HSK Level|Multiple valid options/i.test(err)) {
      classification = 'invalid_quarantine';
    } else if (/out-of-syllabus/i.test(err)) {
      classification = 'needs_admin_review';
    }
    issues.push({
      field: 'general',
      message: err,
      severity: 'error',
      classification,
    });
  }

  for (const warn of warnings) {
    let classification: IssueClassification = 'needs_admin_review';
    if (/brief/i.test(warn)) {
      classification = 'auto_fixable';
    } else if (/out-of-syllabus|above.*level|discrepancies|dialogue turns|exceeds HSK Level/i.test(warn)) {
      classification = 'needs_admin_review';
    }
    issues.push({
      field: 'general',
      message: warn,
      severity: 'warning',
      classification,
    });
  }

  let actionRecommendation: 'accept' | 'regenerate' | 'needs_admin_review' | 'quarantine' = 'accept';
  if (!valid) {
    if (issues.some((i) => i.classification === 'invalid_quarantine')) {
      actionRecommendation = 'quarantine';
    } else if (verified?.outOfSyllabus && verified.outOfSyllabus.length > 0 && q.explanation_vi && q.explanation_vi.length >= 5) {
      actionRecommendation = 'needs_admin_review';
    } else if (issues.some((i) => i.classification === 'needs_admin_review')) {
      actionRecommendation = 'needs_admin_review';
    } else {
      actionRecommendation = 'regenerate';
    }
  } else if (warnings.length > 0) {
    actionRecommendation = 'needs_admin_review';
  }

  return {
    valid,
    errors,
    warnings,
    jaccardSimilarity: maxSimilarity,
    matchedExistingStem: matchedExisting,
    contentHash,
    nearDuplicateSignature,
    lifecycleStatus,
    verifiedTestedVocab,
    verifiedContextualVocab,
    issues,
    actionRecommendation,
    hasSolverAmbiguity,
    solverAnalysis,
    distractorQuality,
  };
}

/**
 * Alias for multi-layer validation contract in PROJECT.md
 */
export const validateQuestionCandidate = validateCandidate;

/**
 * Standard test-friendly and generator-friendly validator wrapper.
 * Returns ExtendedValidationResult with an added .isValid boolean property.
 */
export function validateGeneratedQuestion(
  q: Partial<CandidateQuestion>,
  optionsOrStems?: string[] | ValidateCandidateOptions,
  validationOptions?: ValidateCandidateOptions
): ExtendedValidationResult & { isValid: boolean } {
  let stems: string[] = [];
  let opts: ValidateCandidateOptions | undefined;

  if (Array.isArray(optionsOrStems)) {
    stems = optionsOrStems;
    opts = validationOptions;
  } else if (optionsOrStems && typeof optionsOrStems === 'object') {
    opts = optionsOrStems;
  }

  const res = validateCandidate(q, stems, opts);
  return {
    ...res,
    isValid: res.valid,
  };
}

/**
 * Loads all existing stems from data/qbank/qbank.db (from both qb_questions and pending_questions).
 */
export function loadExistingStemsFromDb(dbPath = getQBankDbPath()): string[] {
  if (!fs.existsSync(dbPath)) {
    return [];
  }

  const stems: string[] = [];
  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });

    // 1. From qb_questions
    try {
      const qbRows = db.prepare('SELECT stem, options, answer_index FROM qb_questions').all() as any[];
      for (const row of qbRows) {
        if (!row.stem) continue;
        let opts: string[] = [];
        try {
          opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
        } catch {}
        stems.push(getComparableStem(row.stem, opts, Number(row.answer_index)));
      }
    } catch {}

    // 2. From pending_questions
    try {
      const pendRows = db.prepare('SELECT stem, options, answer_idx FROM pending_questions').all() as any[];
      for (const row of pendRows) {
        if (!row.stem) continue;
        let opts: string[] = [];
        try {
          opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
        } catch {}
        stems.push(getComparableStem(row.stem, opts, Number(row.answer_idx)));
      }
    } catch {}

    // 3. From questions table if present
    try {
      const activeRows = db.prepare('SELECT stem, options, answer_idx FROM questions').all() as any[];
      for (const row of activeRows) {
        if (!row.stem) continue;
        let opts: string[] = [];
        try {
          opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
        } catch {}
        stems.push(getComparableStem(row.stem, opts, Number(row.answer_idx)));
      }
    } catch {}
  } catch {
    // If DB read fails, return collected stems
  } finally {
    if (db) {
      try {
        db.close();
      } catch {}
    }
  }

  return stems;
}

export function loadApprovedStemsFromDb(dbPath = getQBankDbPath()): string[] {
  return loadExistingStemsFromDb(dbPath);
}

export interface SixGateEvaluation {
  gate1_schema: { passed: boolean; details: string };
  gate2_rationales_coherence: { passed: boolean; details: string };
  gate2_explanation: { passed: boolean; details: string };
  gate3_vocab_coverage: { passed: boolean; details: string };
  gate3_vocab: { passed: boolean; details: string };
  gate4_distractor_quality: { passed: boolean; details: string };
  gate4_distractor: { passed: boolean; details: string };
  gate5_uniqueness: { passed: boolean; details: string };
  gate6_blind_solve: { passed: boolean; details: string };
  allPassed: boolean;
}

export function evaluateCandidateSixGates(
  q: Partial<CandidateQuestion>,
  existingStems: string[] = [],
  options?: ValidateCandidateOptions
): SixGateEvaluation {
  const res = validateCandidate(q, existingStems, options);

  // Gate 1: Schema / Structure (exclude vocabulary and syllabus errors, and rationale text content)
  const g1Errors = res.errors.filter((e) =>
    !/exceed(?:s|ing) HSK Level|out-of-syllabus|syllabus/i.test(e) &&
    !/rationale_vi/i.test(e) &&
    /stem|options?|answer_idx|difficulty_tier|part_type|skill|level|characters|bracketed|audio|transcript|passage/i.test(e)
  );
  const gate1Passed = g1Errors.length === 0;

  // Gate 2: Explanation & Distractor Rationales & Semantic/Collocation Coherence
  const g2Errors = res.errors.filter((e) =>
    /explanation|contradicts|designates|rationale|distractor|collocation|mismatch/i.test(e)
  );
  const g2Warns = (res.warnings || []).filter((w) => /rationale|explanation/i.test(w));
  const gate2Passed = g2Errors.length === 0;

  // Gate 3: Vocab Syllabus Alignment (matches exceeds HSK, exceeding HSK, and minimum level difficulty)
  const g3Errors = res.errors.filter((e) => /syllabus|exceeds HSK|exceeding HSK|minimum level difficulty/i.test(e));
  const g3Warns = (res.warnings || []).filter((w) => /syllabus|exceeds HSK|exceeding HSK|minimum level difficulty/i.test(w));
  const gate3Passed = g3Errors.length === 0 && (options?.strictLevel ? g3Warns.length === 0 : true);

  // Gate 4: Distractor Quality & POS
  const g4Warns = (res.warnings || []).filter((w) => /POS mismatch/i.test(w));
  const gate4Passed = (res.distractorQuality?.allPosMatch ?? true) && g4Warns.length === 0;

  // Gate 5: Uniqueness
  const g5Errors = res.errors.filter((e) => /duplicate|similarity/i.test(e));
  const gate5Passed = g5Errors.length === 0;

  // Gate 6: Blind Solve & Answer Uniqueness Heuristic
  const hasClassifierPoolError = res.errors.some((e) => /No valid classifier option/i.test(e));
  const hasMultipleValidOptions =
    res.solverAnalysis?.semantic_uniqueness_status === 'MULTIPLE_VALID_OPTIONS' ||
    res.errors.some((e) => /Multiple valid options/i.test(e));
  const isUniquelyConfirmed =
    !res.solverAnalysis?.semantic_uniqueness_status ||
    res.solverAnalysis?.semantic_uniqueness_status === 'UNIQUE_ANSWER_CONFIRMED';
  const gate6Passed =
    !res.hasSolverAmbiguity &&
    !hasClassifierPoolError &&
    !hasMultipleValidOptions &&
    isUniquelyConfirmed;

  const allPassed = options?.lenientImport
    ? gate1Passed && gate2Passed && gate5Passed
    : gate1Passed && gate2Passed && gate3Passed && gate4Passed && gate5Passed && gate6Passed;

  return {
    gate1_schema: {
      passed: gate1Passed,
      details: gate1Passed ? 'Passed schema and option bounds' : g1Errors.join('; '),
    },
    gate2_rationales_coherence: {
      passed: gate2Passed,
      details: gate2Passed
        ? `Passed explanation coherence (${res.distractorQuality?.hasRationales ? 'distractor rationales present' : 'standard explanation'})`
        : g2Errors.join('; '),
    },
    gate2_explanation: {
      passed: gate2Passed,
      details: gate2Passed
        ? `Passed explanation coherence (${res.distractorQuality?.hasRationales ? 'distractor rationales present' : 'standard explanation'})`
        : g2Errors.join('; '),
    },
    gate3_vocab_coverage: {
      passed: gate3Passed,
      details: gate3Passed
        ? `Verified vocabulary for HSK Level ${q.level || 1}`
        : (g3Errors.length > 0 ? g3Errors.join('; ') : g3Warns.join('; ')),
    },
    gate3_vocab: {
      passed: gate3Passed,
      details: gate3Passed
        ? `Verified vocabulary for HSK Level ${q.level || 1}`
        : (g3Errors.length > 0 ? g3Errors.join('; ') : g3Warns.join('; ')),
    },
    gate4_distractor_quality: {
      passed: gate4Passed,
      details: gate4Passed
        ? 'Distractors share matching part-of-speech with target'
        : (res.distractorQuality?.incompatibleDistractors?.map((i) => `'${i.word}' (${i.pos.join('/')})`).join(', ') || 'POS mismatch'),
    },
    gate4_distractor: {
      passed: gate4Passed,
      details: gate4Passed
        ? 'Distractors share matching part-of-speech with target'
        : (res.distractorQuality?.incompatibleDistractors?.map((i) => `'${i.word}' (${i.pos.join('/')})`).join(', ') || 'POS mismatch'),
    },
    gate5_uniqueness: {
      passed: gate5Passed,
      details: gate5Passed ? 'Unique content hash and stem signature' : g5Errors.join('; '),
    },
    gate6_blind_solve: {
      passed: gate6Passed,
      details: gate6Passed
        ? `Unambiguous single answer supported by context tokens (${res.solverAnalysis?.disambiguatingTokens?.join(', ') || 'context'})`
        : (res.solverAnalysis?.reason ? `Ambiguity detected [${res.solverAnalysis.semantic_uniqueness_status || 'AMBIGUOUS'}]: ${res.solverAnalysis.reason}` : 'Potential ambiguity detected'),
    },
    allPassed,
  };
}
