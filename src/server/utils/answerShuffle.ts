/**
 * src/server/utils/answerShuffle.ts
 *
 * Fisher-Yates (Durstenfeld) Answer Shuffle Utility for Minnese HSK QBank.
 * Remediation for Phase 8.2: Hardened RNG, Strict answer_idx validation & Unicode Explanation Synchronization.
 *
 * Core Guarantees:
 * 1. Strict RNG validation: accepts finite numbers in [0, 1), rejects non-finite/non-numbers with TypeError,
 *    rejects < 0 or >= 1 with RangeError. No silent clamping, no silent Math.random fallback.
 * 2. Strict answer_idx validation: requires integer in [0, options.length - 1] for MCQ (>= 2 options).
 *    Rejects non-integers with TypeError, out-of-bounds with RangeError.
 * 3. Graceful handling of open-ended / writing tasks (0 or 1 options) returning shuffled: false.
 * 4. Purity & Immutability: input objects and arrays remain completely unmodified even if an error is thrown.
 * 5. Safe explanation synchronization: eliminates ASCII \b false matches on Vietnamese accented letters (Cà phê, Bác sĩ),
 *    protects negation clauses ("Không nên chọn A...", "loại trừ..."), protects multi-option breakdowns ("A đúng, B sai vì..."),
 *    and updates only standard affirmative single-letter designations.
 */

export interface ShuffleableQuestion {
  options: string[];
  answer_idx?: number;
  answer_index?: number;
  explanation_vi?: string;
  part_type?: string;
  task_type?: string;
  group_id?: string | null;
  shared_passage_id?: string | null;
  [key: string]: any;
}

export interface ExplanationSyncDiagnostic {
  explanation: string;
  synced: boolean;
  status:
    | 'synced_affirmative'
    | 'preserved_no_letter'
    | 'preserved_negation'
    | 'preserved_conflict'
    | 'preserved_vietnamese_word';
  details?: string;
}

export interface CanShuffleResult {
  canShuffle: boolean;
  category: 1 | 2 | 3 | 4 | 5;
  reason: string;
}

export interface ShuffledQuestionResult<T extends ShuffleableQuestion = ShuffleableQuestion> {
  question: T;
  original_answer_idx: number;
  new_answer_idx: number;
  shuffled: boolean;
  shuffle_reason?: string;
  mapping: number[]; // mapping[oldIndex] = newIndex
  explanation_diagnostic?: ExplanationSyncDiagnostic;
}

export interface ShuffleOptions {
  /**
   * Whether to synchronize explicit letter references in explanation_vi.
   * Defaults to true.
   */
  syncExplanation?: boolean;
}

/**
 * Feature flag helper for serving answer shuffle (Phase 8.4 R2).
 * Strictly checks process.env.ENABLE_SERVING_ANSWER_SHUFFLE.
 * Returns true ONLY if explicitly set to 'true'. Default: false.
 */
export function isServingAnswerShuffleEnabled(): boolean {
  const val = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
  if (typeof val !== 'string') return false;
  return val.trim() === 'true';
}

/**
 * Regex matching any Latin or Vietnamese accented letter.
 * Covers basic Latin [a-zA-Z], Latin Extended-A/B [\u00C0-\u024F],
 * and Vietnamese specific characters [\u1EA0-\u1EF9].
 */
const VIETNAMESE_LETTER_REGEX = /[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]/;

/**
 * Regex detecting negation, warning, or distractor elimination phrases in Vietnamese explanations.
 * Hardened for Phase 8.2 with Unicode lookaround boundaries (?<![...]) and (?![...])
 * instead of ASCII \b which fails on accented vowels (ừ, ỏ, ì).
 * Covers: không (nên), chưa, đừng, tránh, loại (trừ|bỏ|đáp án|phương án),
 * sai (vì|do|lầm), chẳng, chớ, cấm, từ chối, lỗi, nhầm.
 */
export const NEGATION_INDICATOR_REGEX =
  /(?<![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])(?:không\s*(?:nên)?|chưa|đừng|tránh|loại\s*(?:trừ|bỏ|đáp\s*án|phương\s*án)|sai\s*(?:vì|do|lầm)?|chẳng|chớ|cấm|từ\s*chối|lỗi|nhầm)(?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])/iu;

/**
 * Checks whether an uppercase option letter (A-F) at a specific character index
 * in text is an isolated option label rather than part of a Vietnamese/Latin word
 * (e.g. distinguishing option 'C' from 'C' in "Cà phê", or 'B' from 'B' in "Bác sĩ").
 */
export function isIsolatedOptionLetter(
  text: string,
  matchIndex: number,
  letterLength = 1
): boolean {
  const prevChar = matchIndex > 0 ? text[matchIndex - 1] : '';
  const nextChar =
    matchIndex + letterLength < text.length ? text[matchIndex + letterLength] : '';

  if (prevChar && VIETNAMESE_LETTER_REGEX.test(prevChar)) return false;
  if (nextChar && VIETNAMESE_LETTER_REGEX.test(nextChar)) return false;

  return true;
}

/**
 * Low-level Fisher-Yates (Durstenfeld) shuffle for generic arrays.
 * Iterates backwards from n - 1 down to 1, swapping array[i] with array[j]
 * where j is uniformly chosen in [0, i].
 *
 * Strict mathematical contract:
 * - items must be an Array.
 * - rng(): must return a finite number in the semi-open interval [0, 1).
 *   * Throws TypeError if rng() returns NaN, +Infinity, -Infinity, string, undefined, or non-number.
 *   * Throws RangeError if rng() returns < 0 or >= 1.
 *   * 0.0 is strictly valid.
 * - Absolute immutability: items array is never mutated on error.
 */
export function shuffleOptionsArray<T>(
  items: T[],
  rng: () => number = Math.random
): { shuffled: T[]; mapping: number[] } {
  if (!Array.isArray(items)) {
    throw new TypeError('shuffleOptionsArray: items must be an array');
  }

  const n = items.length;
  if (n <= 1) {
    const safeItems = [...items];
    return {
      shuffled: safeItems,
      mapping: safeItems.map((_, i) => i),
    };
  }

  // Work exclusively on local index array to preserve items immutability if RNG throws
  const indices: number[] = Array.from({ length: n }, (_, i) => i);

  for (let i = n - 1; i > 0; i--) {
    const rawR = rng();

    // 1. Strict type and finiteness validation
    if (typeof rawR !== 'number' || Number.isNaN(rawR) || !Number.isFinite(rawR)) {
      throw new TypeError(
        `shuffleOptionsArray: RNG returned invalid non-finite value: ${String(rawR)}`
      );
    }

    // 2. Strict semi-open interval [0, 1) validation
    if (rawR < 0 || rawR >= 1) {
      throw new RangeError(
        `shuffleOptionsArray: RNG value must be in semi-open interval [0, 1), received: ${rawR}`
      );
    }

    const j = Math.floor(rawR * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }

  const shuffled: T[] = indices.map((oldIdx) => items[oldIdx]);

  // mapping: old index -> new index
  const mapping: number[] = new Array(n);
  for (let newPos = 0; newPos < n; newPos++) {
    mapping[indices[newPos]] = newPos;
  }

  return { shuffled, mapping };
}

/**
 * Safely synchronizes option letter references in explanation_vi with comprehensive
 * linguistic analysis and semantic preservation.
 *
 * Rules:
 * 1. Preserves original text if explanation contains negation or elimination phrasing ("Không nên chọn A...", "loại trừ...").
 * 2. Preserves original text if explanation contains multi-option rationale breakdown ("A đúng. B sai vì... C sai vì...").
 * 3. Prevents ASCII \b false matches on Vietnamese words starting with A-F ("Cà phê", "Bác sĩ", "Cơm", "câu").
 * 4. Safely updates only standard affirmative single-letter designations.
 */
export function syncExplanationLetterSafe(
  explanation: string,
  oldIdx: number,
  newIdx: number
): ExplanationSyncDiagnostic {
  if (!explanation || typeof explanation !== 'string') {
    return { explanation, synced: false, status: 'preserved_no_letter' };
  }

  if (oldIdx === newIdx || oldIdx < 0 || newIdx < 0) {
    return { explanation, synced: false, status: 'preserved_no_letter' };
  }

  const oldLetter = String.fromCharCode(65 + oldIdx); // e.g. 'A'
  const newLetter = String.fromCharCode(65 + newIdx); // e.g. 'C'

  // Rule 1: Check for multi-option breakdown (presence of other option letters)
  const allOptionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const otherLetters = allOptionLetters.filter((l) => l !== oldLetter);

  for (let i = 0; i < explanation.length; i++) {
    const char = explanation[i];
    if (otherLetters.includes(char) && isIsolatedOptionLetter(explanation, i, 1)) {
      return {
        explanation,
        synced: false,
        status: 'preserved_conflict',
        details: `Explanation contains other option letter '${char}'. Preserved safely to avoid multi-option rationale corruption.`,
      };
    }
  }

  // Rule 2: Check for negation or distractor elimination phrasing
  if (NEGATION_INDICATOR_REGEX.test(explanation)) {
    return {
      explanation,
      synced: false,
      status: 'preserved_negation',
      details: 'Explanation contains negative or distractor elimination phrasing. Preserved safely to avoid contradiction.',
    };
  }

  // Rule 3: Affirmative pattern replacement with Unicode letter boundary protection
  // Note: We use strictly uppercase [A-F] so lowercase Vietnamese words ("câu", "có", "cả") are never matched.
  const affirmativePatterns = [
    // Pattern 1: (đáp án đúng là / chọn đáp án / chọn đúng / phương án đúng là / đáp án chính xác là / chọn) [:：]? [Letter]
    /((?:[đĐ][áÁ]p\s*[áÁ]n\s*(?:[đĐ]úng|[cC]hính\s*xác)?\s*là|[cC]họn\s+[đĐ][áÁ]p\s*[áÁ]n(?:\s+(?:[đĐ]úng|[cC]hính\s*xác))?|[cC]họn\s+(?:[đĐ]úng|[cC]hính\s*xác)|[cC]họn|[pP]hương\s*[áÁ]n\s*(?:[đĐ]úng|[cC]hính\s*xác)?\s*là)\s*[:：]?\s*)([A-F])(?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])/gu,

    // Pattern 2: [Letter] là (đáp án / phương án) (đúng / chính xác)
    // Strictly requires (đúng / chính xác) to eliminate matches on "A là phương án sai" or "A là đáp án sai lầm"
    /(?<![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])([A-F])(\s*là\s*(?:[đĐ][áÁ]p\s*[áÁ]n|[pP]hương\s*[áÁ]n)\s+(?:[đĐ]úng|[cC]hính\s*xác))(?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])/gu,

    // Pattern 3: (đáp án / phương án) [Letter] (đúng / chính xác / phù hợp)
    // Strictly requires (đúng / chính xác / phù hợp), removing loose |là to prevent "Phương án A là sai"
    /((?:[đĐ][áÁ]p\s*[áÁ]n|[pP]hương\s*[áÁ]n)\s*)([A-F])(\s+(?:[đĐ]úng|[cC]hính\s*xác|[pP]hù\s*hợp))(?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])/gu,

    // Pattern 4: (Đáp án / Phương án) [:：] [Letter]
    // Protected against trailing negation/error words (sai, lỗi, nhầm, không, chưa)
    /((?:[đĐ][áÁ]p\s*[áÁ]n|[pP]hương\s*[áÁ]n)\s*[:：]\s*)([A-F])(?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])(?!\s*(?:sai|lỗi|nhầm|không|chưa))/gu,
  ];

  let currentText = explanation;
  let didReplace = false;

  // Execute Pattern 1
  currentText = currentText.replace(affirmativePatterns[0], (match, prefix, letter) => {
    if (letter === oldLetter) {
      didReplace = true;
      return prefix + newLetter;
    }
    return match;
  });

  // Execute Pattern 2
  currentText = currentText.replace(affirmativePatterns[1], (match, letter, suffix) => {
    if (letter === oldLetter) {
      didReplace = true;
      return newLetter + suffix;
    }
    return match;
  });

  // Execute Pattern 3
  currentText = currentText.replace(affirmativePatterns[2], (match, prefix, letter, suffix) => {
    if (letter === oldLetter) {
      didReplace = true;
      return prefix + newLetter + suffix;
    }
    return match;
  });

  // Execute Pattern 4
  currentText = currentText.replace(affirmativePatterns[3], (match, prefix, letter) => {
    if (letter === oldLetter) {
      didReplace = true;
      return prefix + newLetter;
    }
    return match;
  });

  if (didReplace) {
    return {
      explanation: currentText,
      synced: true,
      status: 'synced_affirmative',
    };
  }

  return {
    explanation,
    synced: false,
    status: 'preserved_no_letter',
  };
}

/**
 * 100% backward-compatible wrapper for syncExplanationLetter.
 * Returns the synchronized or safely preserved explanation string.
 */
export function syncExplanationLetter(
  explanation: string,
  oldIdx: number,
  newIdx: number
): string {
  return syncExplanationLetterSafe(explanation, oldIdx, newIdx).explanation;
}

/**
 * Reverses mapping to find the original index from a shuffled index.
 */
export function getOriginalAnswerIndex(
  newAnswerIdx: number,
  mapping: number[]
): number {
  if (!Array.isArray(mapping) || newAnswerIdx < 0) return newAnswerIdx;
  return mapping.indexOf(newAnswerIdx);
}

/**
 * Comprehensive safety predicate determining whether a question can be safely shuffled
 * during practice or mock serving without pedagogical contradiction or answer corruption (Phase 8.4 R6).
 *
 * Implements 5-category classification:
 * - Category 1: Safe semantic explanation (no letter references) -> canShuffle: true
 * - Category 2: Safe standard affirmative letter designation -> canShuffle: true (with letter sync)
 * - Category 3: Multi-distractor explanation breakdown -> canShuffle: false
 * - Category 4: Negation / distractor elimination phrasing -> canShuffle: false
 * - Category 5: Ambiguous, mismatched letter, or fixed-order question type -> canShuffle: false
 */
export function canShuffle(question: any): CanShuffleResult {
  if (!question || typeof question !== 'object') {
    return { canShuffle: false, category: 5, reason: 'Question is not a valid object' };
  }

  // 1. Option count validation: strictly 2, 3, 4, or 6 options
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length < 2) {
    return { canShuffle: false, category: 5, reason: 'Less than 2 options (writing or open-ended task)' };
  }
  if (![2, 3, 4, 6].includes(options.length)) {
    return {
      canShuffle: false,
      category: 5,
      reason: `Unsupported option count (${options.length}); only 2, 3, 4, or 6 options supported`,
    };
  }

  // 2. Answer index validation: extract rawIdx, verify integer in bounds [0, options.length - 1]
  const rawIdx =
    typeof question.answer_index === 'number'
      ? question.answer_index
      : typeof question.answer_idx === 'number'
        ? question.answer_idx
        : -1;

  if (!Number.isInteger(rawIdx) || rawIdx < 0 || rawIdx >= options.length) {
    return { canShuffle: false, category: 5, reason: 'Invalid answer index' };
  }

  // 3. Question type & fixed structure check
  const partType = typeof question.part_type === 'string' ? question.part_type.toLowerCase() : '';
  const taskType = typeof question.task_type === 'string' ? question.task_type.toLowerCase() : '';

  if (
    partType.includes('reorder') ||
    partType.includes('tf') ||
    partType.includes('true_false') ||
    partType.includes('judge') ||
    taskType.includes('reorder') ||
    taskType.includes('tf') ||
    taskType.includes('true_false') ||
    taskType.includes('judge') ||
    question.part_type === 'read_reorder_sentence'
  ) {
    return { canShuffle: false, category: 5, reason: 'Fixed order question type' };
  }

  // Fixed order True/False question: 2 options ['对', '错'] or ['正确', '错误']
  if (options.length === 2) {
    const [opt0, opt1] = options;
    if (
      (opt0 === '对' && opt1 === '错') ||
      (opt0 === '正确' && opt1 === '错误')
    ) {
      return { canShuffle: false, category: 5, reason: 'Fixed order True/False question' };
    }
  }

  // Shared word bank check: A-F shared 6-word bank
  const isWordBank = Boolean(
    question.is_word_bank ||
    question.shared_word_bank ||
    question.is_shared_word_bank ||
    partType.includes('word_bank') ||
    partType.includes('wordbank') ||
    taskType.includes('word_bank') ||
    taskType.includes('wordbank') ||
    (typeof question.group_id === 'string' &&
      (question.group_id.toLowerCase().includes('word_bank') ||
        question.group_id.toLowerCase().includes('wordbank')))
  );
  if (isWordBank) {
    return { canShuffle: false, category: 5, reason: 'Shared word bank A-F group' };
  }

  // Shared passage check: group-level questions where options cannot be independently shuffled
  const isSharedPassage = Boolean(
    question.is_shared_passage_group ||
    (typeof question.group_id === 'string' && question.group_id.toLowerCase().includes('passage'))
  );
  if (isSharedPassage) {
    return { canShuffle: false, category: 5, reason: 'Shared group restriction' };
  }

  // 4. Explanation Linguistic Analysis
  const explanation =
    typeof question.explanation_vi === 'string' ? question.explanation_vi.trim() : '';
  if (!explanation) {
    return { canShuffle: true, category: 1, reason: 'No explanation text -> 100% safe to shuffle' };
  }

  // Scan for isolated option letters A..F corresponding to option count
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, options.length);
  const foundLetters: string[] = [];
  for (let i = 0; i < explanation.length; i++) {
    const char = explanation[i];
    if (optionLetters.includes(char) && isIsolatedOptionLetter(explanation, i, 1)) {
      if (!foundLetters.includes(char)) {
        foundLetters.push(char);
      }
    }
  }

  // Category 1: 0 isolated option letters found -> purely semantic explanation
  if (foundLetters.length === 0) {
    return {
      canShuffle: true,
      category: 1,
      reason: 'Group 1: Semantic explanation without letter references',
    };
  }

  // Category 3: Multiple isolated letters found (> 1 letter) -> multi-distractor rationale
  if (foundLetters.length > 1) {
    return {
      canShuffle: false,
      category: 3,
      reason: `Group 3: Multi-distractor explanation (${foundLetters.join(', ')})`,
    };
  }

  // Category 4: Negation / elimination phrases
  if (
    NEGATION_INDICATOR_REGEX.test(explanation) ||
    /(?<![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])(?:không\s*chọn|loại\s*trừ)(?![a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])/iu.test(explanation)
  ) {
    return {
      canShuffle: false,
      category: 4,
      reason: 'Group 4: Explanation contains negation/elimination',
    };
  }

  // Category 5: Exactly 1 letter found but it does NOT match expected correct answer letter
  const expectedOldLetter = String.fromCharCode(65 + rawIdx);
  if (foundLetters[0] !== expectedOldLetter) {
    return {
      canShuffle: false,
      category: 5,
      reason: `Group 5: Mentioned letter (${foundLetters[0]}) does not match correct answer (${expectedOldLetter})`,
    };
  }

  // Category 2: Exactly 1 letter matching correct answer: test affirmative pattern synchronization
  const dummyNewIdx = (rawIdx + 1) % options.length;
  const testDiag = syncExplanationLetterSafe(explanation, rawIdx, dummyNewIdx);
  if (testDiag.status === 'synced_affirmative') {
    return {
      canShuffle: true,
      category: 2,
      reason: 'Group 2: Standard affirmative pattern -> safe letter sync',
    };
  }

  // Otherwise: Ambiguous explanation structure
  return {
    canShuffle: false,
    category: 5,
    reason: `Group 5: Ambiguous explanation structure (${testDiag.status})`,
  };
}

/**
 * Shuffles question options using Fisher-Yates algorithm, maps the answer index accurately,
 * and maintains full immutability of the original question object.
 *
 * @param question Input question containing options and answer_idx / answer_index
 * @param rng Optional custom PRNG returning [0, 1) (defaults to Math.random)
 * @param options Optional configuration (e.g. syncExplanation)
 * @returns ShuffledQuestionResult containing cloned question, mappings, and status
 */
export function shuffleQuestionAnswers<T extends ShuffleableQuestion>(
  question: T,
  rng: () => number = Math.random,
  options: ShuffleOptions = {}
): ShuffledQuestionResult<T> & T {
  if (!question || typeof question !== 'object') {
    throw new TypeError('shuffleQuestionAnswers: question must be a valid non-null object');
  }

  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const n = rawOptions.length;

  // Extract raw answer index: dual-field compatibility (never default to 0 if missing/invalid!)
  const rawAnswerIdx =
    typeof question.answer_index === 'number'
      ? question.answer_index
      : typeof question.answer_idx === 'number'
        ? question.answer_idx
        : undefined;

  // Case 1: Open-ended / writing tasks with 0 or 1 options -> return shuffled: false safely
  if (n <= 1) {
    const originalAnswerIdx = typeof rawAnswerIdx === 'number' ? rawAnswerIdx : -1;
    const clonedQuestion: T = {
      ...question,
      options: [...rawOptions],
      answer_idx: originalAnswerIdx,
      answer_index: originalAnswerIdx,
    };

    return Object.assign({}, clonedQuestion, {
      question: clonedQuestion,
      original_answer_idx: originalAnswerIdx,
      new_answer_idx: originalAnswerIdx,
      shuffled: false,
      shuffle_reason: 'Less than 2 options (writing/open-ended task)',
      mapping: rawOptions.map((_, i) => i),
    });
  }

  // Case 2: MCQ questions (n >= 2, e.g. 2, 3, 4, 6 options)
  if (
    typeof rawAnswerIdx !== 'number' ||
    Number.isNaN(rawAnswerIdx) ||
    !Number.isFinite(rawAnswerIdx) ||
    !Number.isInteger(rawAnswerIdx)
  ) {
    throw new TypeError(
      `shuffleQuestionAnswers: answer_idx must be an integer, received: ${String(rawAnswerIdx)}`
    );
  }

  if (rawAnswerIdx < 0 || rawAnswerIdx >= n) {
    throw new RangeError(
      `shuffleQuestionAnswers: answer_idx (${rawAnswerIdx}) is out of bounds for options length ${n} [0, ${n - 1}]`
    );
  }

  // Safety predicate check via canShuffle()
  const guard = canShuffle(question);
  if (!guard.canShuffle) {
    const clonedQuestion: T = {
      ...question,
      options: [...rawOptions],
      answer_idx: rawAnswerIdx,
      answer_index: rawAnswerIdx,
    };

    return Object.assign({}, clonedQuestion, {
      question: clonedQuestion,
      original_answer_idx: rawAnswerIdx,
      new_answer_idx: rawAnswerIdx,
      shuffled: false,
      shuffle_reason: guard.reason,
      mapping: rawOptions.map((_, i) => i),
    });
  }

  // Perform Fisher-Yates shuffle on options (throws TypeError / RangeError if RNG is invalid)
  const { shuffled: newOptions, mapping } = shuffleOptionsArray(rawOptions, rng);

  // Direct safe index mapping: guaranteed to be in [0, n - 1], never undefined
  const newAnswerIdx = mapping[rawAnswerIdx];

  // Synchronize explanation if enabled and question is in Category 2
  const shouldSyncExplanation = options.syncExplanation !== false;
  let updatedExplanation = question.explanation_vi;
  let explanationDiag: ExplanationSyncDiagnostic | undefined;

  if (
    shouldSyncExplanation &&
    guard.category === 2 &&
    typeof question.explanation_vi === 'string' &&
    newAnswerIdx !== rawAnswerIdx
  ) {
    explanationDiag = syncExplanationLetterSafe(
      question.explanation_vi,
      rawAnswerIdx,
      newAnswerIdx
    );
    if (explanationDiag.synced) {
      updatedExplanation = explanationDiag.explanation;
    }
  }

  // Create immutable clone with both answer_idx and answer_index
  const clonedQuestion: T = {
    ...question,
    options: newOptions,
    answer_idx: newAnswerIdx,
    answer_index: newAnswerIdx,
    ...(typeof updatedExplanation === 'string' ? { explanation_vi: updatedExplanation } : {}),
  };

  return Object.assign({}, clonedQuestion, {
    question: clonedQuestion,
    original_answer_idx: rawAnswerIdx,
    new_answer_idx: newAnswerIdx,
    shuffled: true,
    mapping,
    ...(explanationDiag ? { explanation_diagnostic: explanationDiag } : {}),
  });
}
