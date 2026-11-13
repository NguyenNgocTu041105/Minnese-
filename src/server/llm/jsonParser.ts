/**
 * Robust JSON Parser, Sanitizer, and Self-Repair Module for Minnese QBank.
 *
 * Responsibilities:
 * 1. Strips markdown fences (```json ... ``` or ``` ... ```) and trims surrounding text.
 * 2. Robust syntax cleanup: eliminates trailing commas in objects and arrays while preserving string content.
 * 3. Normalizes field aliases:
 *    - answer_index -> answer_idx
 *    - explanation / explanationVi -> explanation_vi
 *    - theme / illustration -> illustration_theme
 *    - pinyin_text -> pinyin
 * 4. Self-Repair mechanism: invokes 1-shot repair prompt to LLM provider if parsing fails before cascading.
 */

import { pinyin as getPinyinPro } from 'pinyin-pro';
import { generateAccuratePinyin } from '../../utils/pinyinEngine.js';
import { CandidateQuestion, DifficultyTier, DistractorRationaleItem } from './types.js';
import {
  isFillBlankPartType,
  isReadingComprehensionPartType,
} from './partTypeContract.js';
import {
  formatExplanationWithDistractorRationales,
  parseExplanationDistractorRationales,
  parseExplanationMetadata,
} from '../qbankCoverageEngine.js';

/**
 * Strips markdown code blocks and locates the outermost JSON array or object.
 */
export function stripMarkdownCodeBlocks(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let cleaned = rawText.trim();

  // Strip leading and trailing markdown fence headers (e.g. ```json ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // If there are internal code fences, remove them
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  // Find outermost JSON array [...] or object {...} bounds
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  return cleaned.trim();
}

/**
 * Strips leading option label prefixes from an option string.
 * Examples:
 *   "A. 老师" -> "老师"
 *   "Option A: 医生" -> "医生"
 *   "选项A: 机场" -> "机场"
 *   "A - 苹果" -> "苹果"
 *   "A/ 喝水" -> "喝水"
 *   "① 苹果" -> "苹果"
 *   "1. 学习" -> "学习"
 */
export function stripOptionPrefix(opt: string): string {
  if (!opt || typeof opt !== 'string') {
    return '';
  }
  const trimmed = opt.trim();
  const cleaned = trimmed
    .replace(
      /^(?:[-*•+]\s*)?(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?(?:[\(\[（]?([A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ]|[1-6])[\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]+|\([A-Fa-f0-9\uFF21-\uFF26]\)\s*|\[[A-Fa-f0-9\uFF21-\uFF26]\]\s*|（[A-Fa-f0-9\uFF21-\uFF26]）\s*)/i,
      ''
    )
    .replace(/^[\-–—\/:：\.\uFF0E\uFF1A\s]+/, '')
    .replace(/[\-–—\/:：\s]+$/, '')
    .trim();
  return cleaned || trimmed;
}

/**
 * Safely removes trailing commas before closing braces } or brackets ]
 * without corrupting commas inside double-quoted string literals.
 */
export function removeTrailingCommas(jsonString: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < jsonString.length; i++) {
    const ch = jsonString[i];

    if (inString) {
      result += ch;
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      continue;
    }

    // Outside string: look ahead if current char is a comma
    if (ch === ',') {
      // Look ahead past whitespace to see if the next non-whitespace char is } or ]
      let nextIdx = i + 1;
      while (nextIdx < jsonString.length && /\s/.test(jsonString[nextIdx])) {
        nextIdx++;
      }

      if (nextIdx < jsonString.length && (jsonString[nextIdx] === '}' || jsonString[nextIdx] === ']')) {
        // Skip this trailing comma
        continue;
      }
    }

    result += ch;
  }

  return result;
}

/**
 * Robust JSON parser with multi-stage fallback cleanup:
 * 1. Fast path: Direct JSON.parse after stripping markdown fences.
 * 2. Stage 2: Trailing comma elimination outside strings.
 * 3. Stage 3: Regex-based fallback for unescaped newlines in JSON strings.
 */
export function robustJsonParse<T = any>(rawText: string): T {
  const cleaned = stripMarkdownCodeBlocks(rawText);
  if (!cleaned) {
    throw new Error('Empty JSON content after stripping markdown code fences');
  }

  // 1. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // 2. Trailing comma removal
    try {
      const sanitized = removeTrailingCommas(cleaned);
      return JSON.parse(sanitized);
    } catch (err2) {
      // 3. Regex fallback: fix unescaped control chars / newlines inside string literals
      try {
        const withoutControlChars = removeTrailingCommas(cleaned)
          .replace(/[\u0000-\u001F]+/g, (match) => {
            if (match.includes('\n')) return '\\n';
            if (match.includes('\r')) return '\\r';
            if (match.includes('\t')) return '\\t';
            return ' ';
          });
        return JSON.parse(withoutControlChars);
      } catch (err3: any) {
        throw new Error(`Failed to parse JSON: ${err3.message}`);
      }
    }
  }
}

/**
 * Normalizes a single raw question object to conform to CandidateQuestion.
 * Handles aliases: answer_index -> answer_idx, explanation -> explanation_vi,
 * theme/illustration -> illustration_theme, and auto-derives pinyin if missing.
 */
export function normalizeQuestionAliases(
  raw: any,
  defaultLevel = 1,
  defaultSkill: 'listening' | 'reading' | 'writing' = 'reading',
  strictStructured = false
): CandidateQuestion | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  let stem = String(raw.stem || raw.question || raw.sentence || '').trim();
  if (!stem) {
    return null;
  }

  const blankPattern = /(?:\s*_{2,}\s*|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;

  // Normalize part_type
  const rawPartType = raw.part_type || raw.partType;
  const partType = String(rawPartType || (blankPattern.test(stem) ? 'read_fill_blank_4opt' : 'read_comprehension_short_3opt')).trim();

  // Normalize options array
  let options: string[] = [];
  const structuredShapeErrors: string[] = [];
  if (strictStructured) {
    // Preserve malformed provider data for the validator; never coerce, filter, or
    // reshape a structured response before structural validation sees it.
    if (Array.isArray(raw.options)) {
      options = raw.options as string[];
    } else {
      const actualType = raw.options === null ? 'null' : Array.isArray(raw.options) ? 'array' : typeof raw.options;
      structuredShapeErrors.push(`$.options must be an array (got ${actualType})`);
    }
    if (typeof raw.completed_stem !== 'string' && isFillBlankPartType(partType)) {
      structuredShapeErrors.push('$.completed_stem must be a string');
    }
    if (!Number.isInteger(raw.answer_idx)) structuredShapeErrors.push('$.answer_idx must be an integer');
    if (typeof raw.explanation_summary_vi !== 'string') structuredShapeErrors.push('$.explanation_summary_vi must be a string');
    if (typeof raw.answer_rationale_vi !== 'string') structuredShapeErrors.push('$.answer_rationale_vi must be a string');
    if (!Array.isArray(raw.distractor_rationales)) structuredShapeErrors.push('$.distractor_rationales must be an array');
    if (Array.isArray(raw.distractor_rationales)) raw.distractor_rationales.forEach((item: any, index: number) => {
      if (!item || typeof item !== 'object') structuredShapeErrors.push(`$.distractor_rationales[${index}] must be an object`);
      else {
        if (!Number.isInteger(item.option_idx)) structuredShapeErrors.push(`$.distractor_rationales[${index}].option_idx must be an integer`);
        if (typeof item.option_text !== 'string') structuredShapeErrors.push(`$.distractor_rationales[${index}].option_text must be a string`);
        if (typeof item.rationale_vi !== 'string') structuredShapeErrors.push(`$.distractor_rationales[${index}].rationale_vi must be a string`);
      }
    });
  } else if (Array.isArray(raw.options)) {
    options = raw.options.map((opt: any) => stripOptionPrefix(String(opt ?? ''))).filter((s) => s.length > 0);
  } else if (raw.options && typeof raw.options === 'object') {
    // If options is an object like { A: '...', B: '...' }
    options = Object.values(raw.options).map((opt: any) => stripOptionPrefix(String(opt ?? ''))).filter((s) => s.length > 0);
  }

  // Normalize answer_idx
  let answerIdx: any = strictStructured
    ? raw.answer_idx
    : 0;
  if (strictStructured) {
    // The structured provider contract requires an actual JSON integer. Keep
    // strings, floats, out-of-range values and missing values intact so the
    // validator rejects them instead of silently converting them to index 0.
  } else if (raw.answer_idx !== undefined && raw.answer_idx !== null && !isNaN(Number(raw.answer_idx))) {
    answerIdx = Number(raw.answer_idx);
  } else if (raw.answer_index !== undefined && raw.answer_index !== null && !isNaN(Number(raw.answer_index))) {
    answerIdx = Number(raw.answer_index);
  } else if (typeof raw.answer === 'string') {
    // Handle 'A', 'B', 'C', 'D'
    const letter = raw.answer.trim().toUpperCase();
    if (letter === 'A') answerIdx = 0;
    else if (letter === 'B') answerIdx = 1;
    else if (letter === 'C') answerIdx = 2;
    else if (letter === 'D') answerIdx = 3;
    else if (!isNaN(parseInt(letter, 10))) answerIdx = parseInt(letter, 10);
  } else if (typeof raw.answer === 'number') {
    answerIdx = raw.answer;
  }

  // Normalize explanation_vi
  const explanationSummaryVi = String(raw.explanation_summary_vi || '').trim();
  const answerRationaleVi = String(raw.answer_rationale_vi || '').trim();
  const explanationVi = String(
    raw.explanation_vi || raw.explanation || raw.explanationVi || raw.explain || ''
  ).trim();

  // Normalize level
  const levelNum = Number(raw.level);
  const level = !isNaN(levelNum) && levelNum >= 1 && levelNum <= 6 ? levelNum : defaultLevel;

  // Normalize skill
  let skill = defaultSkill;
  const rawSkill = String(raw.skill || '').toLowerCase().trim();
  if (rawSkill === 'listening' || rawSkill === 'reading' || rawSkill === 'writing') {
    skill = rawSkill;
  }

  const optionsImages = Array.isArray(raw.options_images)
    ? raw.options_images.map((item: any) => String(item ?? '').trim()).filter((item: string) => item.length > 0)
    : [];

  // Normalize illustration_theme
  let illustrationTheme: string | null = null;
  const rawTheme = raw.illustration_theme || raw.theme || raw.illustration || null;
  if (rawTheme && typeof rawTheme === 'string' && rawTheme.trim().length > 0 && rawTheme.trim() !== 'null') {
    illustrationTheme = rawTheme.trim().toLowerCase();
  }

  // Normalize topic
  let topic: string | null = null;
  const rawTopic = raw.topic || null;
  if (rawTopic && typeof rawTopic === 'string' && rawTopic.trim().length > 0 && rawTopic.trim() !== 'null') {
    topic = rawTopic.trim();
  }

  // Standardize Pinyin: Preserve explicit pinyin if provided; otherwise derive authentic tone-marked Pinyin directly from the Chinese stem using PinyinEngine.
  // This eliminates LLM hallucinations (wrong syllables, tones, or missing words) across all HSK levels.
  let pinyin: string | null = null;
  const rawProvidedPinyin = raw.pinyin || raw.pinyin_text || raw.stem_pinyin;
  if (typeof rawProvidedPinyin === 'string' && rawProvidedPinyin.trim().length > 0) {
    pinyin = rawProvidedPinyin.trim();
  } else if (stem) {
    const blankPatternForPinyin = /(?:\s*_{2,}\s*|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;
    let targetStemForPinyin = stem;
    if (typeof raw.completed_stem === 'string' && raw.completed_stem.trim().length > 0) {
      targetStemForPinyin = raw.completed_stem.trim();
    } else if (blankPatternForPinyin.test(stem) && Array.isArray(options) && typeof answerIdx === 'number' && answerIdx >= 0 && answerIdx < options.length) {
      targetStemForPinyin = stem.replace(blankPatternForPinyin, (options[answerIdx] || '').trim());
    }
    try {
      pinyin = generateAccuratePinyin(targetStemForPinyin);
    } catch {}
  }

  // Derive standardized options_pinyin
  let optionsPinyin: string[] | undefined = undefined;
  if (Array.isArray(raw.options_pinyin) && raw.options_pinyin.length === options.length) {
    optionsPinyin = raw.options_pinyin;
  } else if (Array.isArray(options) && options.length > 0) {
    try {
      optionsPinyin = options.map((opt) => generateAccuratePinyin(opt));
    } catch {
      if (Array.isArray(raw.options_pinyin)) {
        optionsPinyin = raw.options_pinyin;
      }
    }
  }

  // Extract difficulty_tier
  let difficultyTier: DifficultyTier | undefined = undefined;
  const rawTier = raw.difficulty_tier || raw.difficultyTier || raw.difficulty;
  if (rawTier === 'tier1_difficult' || rawTier === 'tier2_very_difficult' || rawTier === 'tier3_challenge') {
    difficultyTier = rawTier;
  }

  // Extract trap_type
  let trapType: string | undefined = undefined;
  const rawTrap = raw.trap_type || raw.trapType;
  if (rawTrap && typeof rawTrap === 'string' && rawTrap.trim().length > 0) {
    trapType = rawTrap.trim();
  }

  // Extract target_grammar
  let targetGrammar: string | undefined = undefined;
  const rawGrammar = raw.target_grammar || raw.targetGrammar || raw.grammar;
  if (rawGrammar && typeof rawGrammar === 'string' && rawGrammar.trim().length > 0) {
    targetGrammar = rawGrammar.trim();
  }

  // Extract target_vocabulary
  let targetVocabulary: string | undefined = undefined;
  const rawVocab = raw.target_vocabulary || raw.targetVocabulary || raw.target_word;
  if (rawVocab && typeof rawVocab === 'string' && rawVocab.trim().length > 0) {
    targetVocabulary = rawVocab.trim();
  }

  // Extract metadata tags from explanation_vi early if present in raw text
  if (!difficultyTier || !trapType || !targetGrammar) {
    const meta = parseExplanationMetadata(explanationVi);
    if (!difficultyTier && meta.difficulty_tier) difficultyTier = meta.difficulty_tier;
    if (!trapType && meta.trap_type) trapType = meta.trap_type;
    if (!targetGrammar && meta.target_grammar) targetGrammar = meta.target_grammar;
  }

  // Normalize distractor_rationales with full auto-repair and coverage guarantee
  let distractorRationales: DistractorRationaleItem[] | Record<string, string> | undefined = undefined;
  if (options && options.length > 1 && Number.isInteger(answerIdx) && answerIdx >= 0 && answerIdx < options.length) {
    const expectedIndices = options.map((_, i) => i).filter((i) => i !== answerIdx);
    const existingMap = new Map<number, string>();

    if (raw.distractor_rationales) {
      if (Array.isArray(raw.distractor_rationales)) {
        for (const item of raw.distractor_rationales) {
          const text = String(item?.option_text ?? item?.optionText ?? '').trim();
          let idx = item?.option_idx ?? item?.optionIdx;
          if (!Number.isInteger(idx) || idx < 0 || idx >= options.length || idx === answerIdx) {
            idx = options.findIndex((opt, oi) => oi !== answerIdx && opt === text);
          }
          if (Number.isInteger(idx) && idx >= 0 && idx < options.length && idx !== answerIdx) {
            const rat = String(item?.rationale_vi ?? item?.rationaleVi ?? '').trim();
            if (rat) existingMap.set(idx, rat);
          }
        }
      } else if (typeof raw.distractor_rationales === 'object') {
        for (const [k, v] of Object.entries(raw.distractor_rationales)) {
          const text = String(k).trim();
          const rat = String(v).trim();
          let idx: number = /^\d+$/.test(text) ? parseInt(text, 10) : -1;
          if (idx === -1) {
            idx = options.findIndex((opt, oi) => oi !== answerIdx && opt === text);
          }
          if (idx !== -1 && idx !== answerIdx) {
            existingMap.set(idx, rat);
          }
        }
      }
    }

    const items = expectedIndices.map((idx) => {
      const optText = options[idx];
      let ratVi = existingMap.get(idx) || '';

      // Prevent cross-distractor contamination: remove occurrences of other options from this rationale
      for (let oi = 0; oi < options.length; oi++) {
        if (oi !== idx && options[oi]) {
          const otherOpt = String(options[oi]).trim();
          if (otherOpt.length > 0 && ratVi.includes(otherOpt)) {
            ratVi = ratVi.split(otherOpt).join('phương án khác');
          }
        }
      }

      if (!ratVi || ratVi.length < 5) {
        ratVi = `${optText}: Phương án này không phù hợp với ngữ cảnh câu hỏi HSK ${level}.`;
      } else if (optText && !ratVi.includes(optText)) {
        ratVi = `${optText}: ${ratVi}`;
      }

      return {
        option_idx: idx,
        optionIdx: idx,
        option_text: optText,
        optionText: optText,
        rationale_vi: ratVi,
        rationaleVi: ratVi,
      } as any;
    });

    distractorRationales = items;
  }

  const naturalnessReview = raw.naturalness_review && typeof raw.naturalness_review === 'object'
    ? {
        status: raw.naturalness_review.status,
        rationale_vi: String(raw.naturalness_review.rationale_vi || '').trim(),
      }
    : undefined;

  // Synchronize bi-directionally: embed distractor rationales into explanation_vi if absent
  let enrichedExplanationVi = explanationVi;
  const alreadyHasFormattedDistractors = explanationVi.includes('Phân tích phương án nhiễu');
  if (!alreadyHasFormattedDistractors && (explanationSummaryVi || answerRationaleVi || (Array.isArray(distractorRationales) && raw.distractor_rationales))) {
      const items: DistractorRationaleItem[] = Array.isArray(distractorRationales)
        ? distractorRationales.map((item) => ({
            ...item,
            optionText: Number.isInteger(item.optionIdx) && item.optionIdx >= 0 && item.optionIdx < options.length
              ? options[item.optionIdx]
              : item.optionText,
            rationaleVi: String(item.rationaleVi || item.rationale_vi || '').trim(),
            isCorrect: item.optionIdx === answerIdx,
          }))
        : [];
      const formatted = formatExplanationWithDistractorRationales({
        summaryVi: explanationSummaryVi || explanationVi,
        correctExplanationVi: options[answerIdx] ? `${options[answerIdx]}: ${answerRationaleVi || 'Phương án đúng'}` : answerRationaleVi,
        distractorRationales: items,
      });
      enrichedExplanationVi = formatted;
  } else if (!alreadyHasFormattedDistractors && distractorRationales && !Array.isArray(distractorRationales) && Object.keys(distractorRationales).length > 0) {
    const items: DistractorRationaleItem[] = Object.entries(distractorRationales).map(([key, rationaleVi]) => {
      const optionIdx = /^\d+$/.test(key) ? Number(key) : key.toUpperCase().charCodeAt(0) - 65;
      return { optionIdx, optionText: options[optionIdx] || '', rationaleVi: String(rationaleVi || ''), isCorrect: optionIdx === answerIdx };
    });
    enrichedExplanationVi = formatExplanationWithDistractorRationales({
      summaryVi: enrichedExplanationVi,
      correctExplanationVi: options[answerIdx] ? `${options[answerIdx]} là đáp án đúng.` : '',
      distractorRationales: items.filter((item) => !item.isCorrect),
    });
  }

  // Auto-extract distractor rationales from explanation_vi if not provided directly in raw
  if (alreadyHasFormattedDistractors && (!raw.distractor_rationales || Object.keys(raw.distractor_rationales).length === 0)) {
    const parsed = parseExplanationDistractorRationales(enrichedExplanationVi, options, answerIdx);
    if (parsed.hasDistractorRationales && parsed.distractors.length > 0) {
      const map: Record<string, string> = {};
      for (const d of parsed.distractors) {
        if (!d.isCorrect) {
          map[String(d.optionIdx)] = d.rationaleVi;
        }
      }
      distractorRationales = map;
    }
  }

  // Ensure metadata tag is embedded in explanation_vi when pedagogical properties are present
  if (trapType || difficultyTier || targetGrammar) {
    if (!enrichedExplanationVi.includes('[Cấu trúc bẫy:')) {
      const tag = `[Cấu trúc bẫy: ${trapType || 'collocation'} | Độ khó: ${difficultyTier || 'tier1_difficult'} | Ngữ pháp: ${targetGrammar || '基本'}]`;
      enrichedExplanationVi = enrichedExplanationVi ? `${enrichedExplanationVi.trim()}\n${tag}` : tag;
    }
  }

  // Extract metadata tags from explanation_vi if missing
  if (!difficultyTier || !trapType || !targetGrammar) {
    const meta = parseExplanationMetadata(enrichedExplanationVi);
    if (!difficultyTier && meta.difficulty_tier) difficultyTier = meta.difficulty_tier;
    if (!trapType && meta.trap_type) trapType = meta.trap_type;
    if (!targetGrammar && meta.target_grammar) targetGrammar = meta.target_grammar;
  }

  // Deterministic backend construction of canonical_completed_stem based on part_type contract
  
  // Distinguish missing (undefined) vs empty string ("") for raw.completed_stem
  let rawCompletedStem: string | undefined = undefined;
  if (typeof raw.completed_stem === 'string') {
    rawCompletedStem = raw.completed_stem.trim();
  } else if (raw.completed_stem === null) {
    rawCompletedStem = '';
  } else if (raw.completed_stem === undefined) {
    rawCompletedStem = undefined;
  } else {
    rawCompletedStem = String(raw.completed_stem).trim();
  }

  let canonicalCompletedStem: string | undefined = undefined;

  if (isReadingComprehensionPartType(partType)) {
    // For reading comprehension, stem is canonical; no placeholder replacement.
    canonicalCompletedStem = stem;
  } else if (rawPartType && isFillBlankPartType(partType) && !blankPattern.test(stem)) {
    if (options && typeof answerIdx === 'number' && answerIdx >= 0 && answerIdx < options.length) {
      const targetWord = (options[answerIdx] || '').trim();
      if (targetWord && stem.includes(targetWord)) {
        canonicalCompletedStem = stem;
        stem = stem.replace(targetWord, '____');
      }
    }
  } else if (isFillBlankPartType(partType) || blankPattern.test(stem)) {
    if (options && typeof answerIdx === 'number' && answerIdx >= 0 && answerIdx < options.length) {
      canonicalCompletedStem = stem.replace(blankPattern, (options[answerIdx] || '').trim());
    }
  }

  // Canonical substitution replaces placeholder with options[answer_idx].
  // completed_stem holds canonical substitution; raw_completed_stem holds verbatim model output.
  let completedStem = canonicalCompletedStem ?? (rawCompletedStem !== undefined ? rawCompletedStem : stem);
  if (!completedStem && isReadingComprehensionPartType(partType)) {
    completedStem = stem;
  }

  return {
    stem,
    raw_completed_stem: rawCompletedStem,
    completed_stem: completedStem,
    canonical_completed_stem: canonicalCompletedStem,
    options,
    answer_idx: answerIdx,
    explanation_vi: enrichedExplanationVi,
    explanation_summary_vi: explanationSummaryVi,
    answer_rationale_vi: answerRationaleVi,
    level,
    skill,
    part_type: partType,
    pinyin: pinyin || (stem ? generateAccuratePinyin(stem) : null),
    stem_pinyin: pinyin || (stem ? generateAccuratePinyin(stem) : null),
    options_pinyin: optionsPinyin || (Array.isArray(raw.options_pinyin) ? raw.options_pinyin : undefined),
    passage_pinyin: raw.passage_pinyin || (raw.passage ? generateAccuratePinyin(raw.passage) : null),
    audio_text_pinyin: raw.audio_text_pinyin || (raw.audio_text ? generateAccuratePinyin(raw.audio_text) : null),
    illustration_theme: illustrationTheme,
    options_images: optionsImages,
    topic,
    difficulty_tier: difficultyTier,
    trap_type: trapType,
    target_grammar: targetGrammar,
    target_vocabulary: targetVocabulary,
    distractor_rationales: distractorRationales,
    naturalness_review: naturalnessReview,
    is_imported: Boolean(raw.is_imported || raw.imported),
    audio_url: raw.audio_url || null,
    passage: raw.passage || null,
    audio_text: raw.audio_text || null,
    transcript: raw.transcript || null,
    ...(strictStructured ? { __structuredShapeErrors: structuredShapeErrors } : {}),
  };
}

/**
 * Normalizes an arbitrary parsed JSON structure into a list of CandidateQuestion objects.
 * Supports:
 * - Array of question objects: [ {...}, {...} ]
 * - Object with questions array: { questions: [ {...} ] }
 * - Object with data array: { data: [ {...} ] }
 * - Single question object: { stem: "...", options: [...] }
 */
export function normalizeQuestionList(
  parsed: any,
  defaultLevel = 1,
  defaultSkill: 'listening' | 'reading' | 'writing' = 'reading',
  strictStructured = false
): CandidateQuestion[] {
  if (!parsed) return [];

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) {
      rawList = parsed.questions;
    } else if (!strictStructured && Array.isArray(parsed.data)) {
      rawList = parsed.data;
    } else if (!strictStructured && Array.isArray(parsed.items)) {
      rawList = parsed.items;
    } else if (!strictStructured && parsed.stem) {
      rawList = [parsed];
    }
  }

  const results: CandidateQuestion[] = [];
  for (const item of rawList) {
    const norm = normalizeQuestionAliases(item, defaultLevel, defaultSkill, strictStructured);
    if (norm) {
      results.push(norm);
    }
  }

  return results;
}

/**
 * Builds standard 1-shot self-repair prompt for LLM provider.
 */
export function buildRepairPrompt(rawOutput: string, errorMessage: string): string {
  return `You previously output a JSON response that could not be parsed by our JSON parser.
Parse Error: ${errorMessage}

Your previous raw output was:
${rawOutput.slice(0, 3000)}

TASK:
Fix all JSON syntax errors (such as unescaped quotes, trailing commas, missing brackets/braces, or malformed strings).
Return ONLY the corrected JSON object with a "questions" array matching the required question schema.
Do NOT include any markdown code fences, commentary, or conversational text.`;
}

/**
 * Executes JSON parsing with 1-shot Self-Repair fallback:
 * 1. Tries robustJsonParse + normalizeQuestionList.
 * 2. If parsing fails AND repairFn is provided, sends exactly 1 repair request to the LLM.
 * 3. Returns the normalized questions or throws if repair also fails.
 */
export async function parseWithSelfRepair(
  rawContent: string,
  repairFn?: (repairPrompt: string) => Promise<string>,
  defaultLevel = 1,
  defaultSkill: 'listening' | 'reading' | 'writing' = 'reading',
  strictStructured = false
): Promise<{ questions: CandidateQuestion[]; repaired: boolean }> {
  try {
    const parsed = robustJsonParse(rawContent);
    if (strictStructured && (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.questions))) {
      throw new Error('$.questions: required top-level array is missing or has the wrong type');
    }
    const questions = normalizeQuestionList(parsed, defaultLevel, defaultSkill, strictStructured);
    if (questions.length > 0) {
      return { questions, repaired: false };
    }
    throw new Error('Parsed JSON contained no valid candidate questions');
  } catch (initialError: any) {
    // If no repair function provided, rethrow immediately
    if (!repairFn) {
      throw initialError;
    }

    console.warn(`[Self-Repair] Initial JSON parse failed (${initialError.message}). Attempting 1-shot repair with provider...`);

    const repairPrompt = buildRepairPrompt(rawContent, initialError.message);
    const repairedRaw = await repairFn(repairPrompt);
    const repairedParsed = robustJsonParse(repairedRaw);
    if (strictStructured && (!repairedParsed || typeof repairedParsed !== 'object' || !Array.isArray(repairedParsed.questions))) {
      throw new Error('$.questions: required top-level array is missing or has the wrong type after repair');
    }
    const questions = normalizeQuestionList(repairedParsed, defaultLevel, defaultSkill, strictStructured);

    if (questions.length === 0) {
      throw new Error('Self-repair succeeded in parsing JSON but yielded 0 valid questions');
    }

    console.log(`[Self-Repair] 1-shot repair succeeded! Recovered ${questions.length} questions.`);
    return { questions, repaired: true };
  }
}
