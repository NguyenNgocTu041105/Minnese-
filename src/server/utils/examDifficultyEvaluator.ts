export type ExamDifficultyTier = 'easy' | 'medium' | 'hard';

export interface ExamDifficultyMetrics {
  avgStemHanzi: number;
  avgOptionHanzi: number;
  uniqueHanziCount: number;
  longPassageCount: number;
  multiTurnCount: number;
  rawScore: number;
}

export interface ExamDifficultyEvaluation {
  difficultyTier: ExamDifficultyTier;
  difficultyScore: number; // 1..100 normalized within the HSK level
  difficultyLabelVi: string;
  difficultyMetrics: ExamDifficultyMetrics;
}

export const DIFFICULTY_LABELS_VI: Record<ExamDifficultyTier, string> = {
  easy: 'Khởi động (Vừa sức)',
  medium: 'Chuẩn thi (Vừa phải)',
  hard: 'Thử thách (Khó)',
};

export const DIFFICULTY_TIER_ORDER: Record<ExamDifficultyTier, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Calibrated baseline complexity bands (rawScore) per HSK level based on empirical analysis
 * of all official HSK 1–6 exam sets (min/easyCut/hardCut/max).
 * Used when evaluating a single exam set independently (e.g. newly imported or custom-saved).
 */
const LEVEL_COMPLEXITY_BANDS: Record<
  number,
  { min: number; easyMax: number; hardMin: number; max: number }
> = {
  1: { min: 38, easyMax: 49.5, hardMin: 58.0, max: 70 },
  2: { min: 66, easyMax: 81.5, hardMin: 90.5, max: 100 },
  3: { min: 92, easyMax: 132.5, hardMin: 145.0, max: 168 },
  4: { min: 135, easyMax: 188.5, hardMin: 206.0, max: 232 },
  5: { min: 200, easyMax: 274.0, hardMin: 292.0, max: 318 },
  6: { min: 210, easyMax: 252.0, hardMin: 280.0, max: 340 },
};

/**
 * Measures objective linguistic & structural complexity metrics for a list of HSK exam questions.
 */
export function computeRawDifficultyMetrics(questions: any[]): ExamDifficultyMetrics {
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
  const uniqueChars = new Set<string>();

  for (const q of qs) {
    const stem = String(q?.stem || '');
    const audioText = String(q?.audio_text || '');
    const passage = String(q?.passage || '');
    // Avoid double-counting when stem already includes audio_text
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

/**
 * Evaluates a single exam set independently using calibrated per-level bands.
 */
export function evaluateSingleExamDifficulty(
  level: number,
  questions: any[]
): ExamDifficultyEvaluation {
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 1));
  const metrics = computeRawDifficultyMetrics(questions);
  const band = LEVEL_COMPLEXITY_BANDS[safeLevel] || LEVEL_COMPLEXITY_BANDS[3];

  let difficultyTier: ExamDifficultyTier = 'medium';
  if (metrics.rawScore <= band.easyMax) {
    difficultyTier = 'easy';
  } else if (metrics.rawScore >= band.hardMin) {
    difficultyTier = 'hard';
  }

  const span = Math.max(1, band.max - band.min);
  const normalized = Math.round(((metrics.rawScore - band.min) / span) * 84 + 12);
  const difficultyScore = Math.max(10, Math.min(98, normalized));

  return {
    difficultyTier,
    difficultyScore,
    difficultyLabelVi: DIFFICULTY_LABELS_VI[difficultyTier],
    difficultyMetrics: metrics,
  };
}

/**
 * Evaluates and ranks a cohort of exam sets belonging to the SAME HSK level using
 * relative quantile stratification (ensuring a clear, fair spread of Easy / Medium / Hard
 * while honoring real linguistic complexity scores).
 */
export function evaluateLevelCohortDifficulty<T extends { id: string; level: number; questions: any[] }>(
  setsInLevel: T[]
): Map<string, ExamDifficultyEvaluation> {
  const result = new Map<string, ExamDifficultyEvaluation>();
  if (!setsInLevel || setsInLevel.length === 0) return result;

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

  // Split into ~33% Easy (Khởi động), ~37% Medium (Chuẩn thi), ~30% Hard (Thử thách)
  const easyCount = n <= 2 ? 1 : Math.max(1, Math.round(n * 0.34));
  const hardCount = n <= 2 ? (n === 2 ? 1 : 0) : Math.max(1, Math.round(n * 0.30));
  const mediumEndIdx = Math.max(easyCount, n - hardCount);

  measured.forEach((item, idx) => {
    let tier: ExamDifficultyTier;
    if (idx < easyCount) {
      tier = 'easy';
    } else if (idx >= mediumEndIdx) {
      tier = 'hard';
    } else {
      tier = 'medium';
    }

    // Smooth 15..96 normalized score blending raw linguistic distance & rank position
    const rawPct = n > 1 ? (item.metrics.rawScore - minRaw) / rawSpan : 0.5;
    const rankPct = n > 1 ? idx / (n - 1) : 0.5;
    const blended = rawPct * 0.65 + rankPct * 0.35;
    const score = Math.max(12, Math.min(96, Math.round(blended * 80 + 14)));

    result.set(item.id, {
      difficultyTier: tier,
      difficultyScore: score,
      difficultyLabelVi: DIFFICULTY_LABELS_VI[tier],
      difficultyMetrics: item.metrics,
    });
  });

  return result;
}
