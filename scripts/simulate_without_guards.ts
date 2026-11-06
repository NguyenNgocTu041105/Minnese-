import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { isOptionCountCompatible, loadBlueprintData } from '../src/server/qbankFormatSync.js';
import { isValidIllustrationTheme } from '../src/server/llm/promptTemplates.js';
import { isVisualQuestionType, cleanChineseText } from '../src/server/llm/questionValidator.js';
import { isCompatiblePartType } from '../src/server/qbankCoverageEngine.js';

const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const db = new DatabaseSync(dbPath, { readOnly: true });

const rows = db.prepare(`
  SELECT *
  FROM questions
  WHERE status = 'approved' AND COALESCE(is_active, 1) = 1
  ORDER BY rowid ASC
`).all() as any[];

console.log(`Analyzing ${rows.length} questions without artificial isDbQuestion guards...`);

function validateWithoutArtificialGuards(q: any, targetLevel: number) {
  const ineligible_reasons: string[] = [];
  const compatible_formats: string[] = [];

  let optionsArr: any[] = [];
  if (Array.isArray(q.options)) {
    optionsArr = q.options;
  } else if (typeof q.options === 'string') {
    try {
      const parsed = JSON.parse(q.options);
      if (Array.isArray(parsed)) optionsArr = parsed;
    } catch {}
  }

  const rawSkill = (q.skill || q.section || 'reading').toLowerCase().trim();
  const rawPartType = (q.part_type || '').toLowerCase().trim();
  const hasValidStem = typeof q.stem === 'string' && q.stem.trim().length > 0;

  const blueprint = loadBlueprintData(targetLevel);
  let exam_format_compatible = false;
  let matched_blueprint_part: string | undefined = undefined;

  if (blueprint) {
    const section = blueprint.sections?.[rawSkill];
    if (section && section.parts) {
      let foundMatchingType = false;
      for (const [partKey, partDef] of Object.entries<any>(section.parts)) {
        const bpType = (partDef.type || '').toLowerCase().trim();
        const isTypeMatch = bpType === rawPartType || isCompatiblePartType(bpType, rawPartType);

        if (isTypeMatch) {
          foundMatchingType = true;
          const optMatch = /_(\d+)opt$/.exec(bpType);
          const requiredOptions = partDef.n_options ?? (optMatch ? parseInt(optMatch[1], 10) : 0);

          // PURE option count compatibility without isDbWordBankMismatch or isWordBankSplitWithWrongOptions
          if (!isOptionCountCompatible(bpType, requiredOptions, optionsArr.length)) {
            ineligible_reasons.push(
              `Dạng bài ${bpType} yêu cầu chính xác ${requiredOptions} phương án (câu hiện có ${optionsArr.length})`
            );
            continue;
          }

          // Audio check WITHOUT !isDbQuestion
          let hasAudioDeficit = false;
          if (rawSkill === 'listening') {
            const hasDialogueAudio = typeof q.stem === 'string' && /(?:男|女|甲|乙|A|B)\s*[:：]|问[：:]/.test(q.stem);
            const isPictureMatch = (bpType.includes('picture') || rawPartType.includes('picture')) && Boolean(q.illustration_theme || q.illustration || (Array.isArray(q.options_images) && q.options_images.length > 0));
            const isQuestionPrompt = typeof q.stem === 'string' && (q.stem.includes('？') || q.stem.includes('?') || /(?:做什么|怎么|谁|哪|什么|为什么)/.test(q.stem));
            // Notice: no !isDbQuestion
            const hasSentenceAudio = hasValidStem && (isPictureMatch || (targetLevel <= 2 && !isQuestionPrompt));
            const hasExamAudio = Boolean(q.audio_text || q.audio_url || q.audio_playback || hasDialogueAudio || hasSentenceAudio);
            if (!hasExamAudio) {
              hasAudioDeficit = true;
              if (!ineligible_reasons.some((r) => r.includes('audio_text'))) {
                ineligible_reasons.push('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc audio_url)');
              }
            }
          }

          // Passage check WITHOUT isDbQuestion
          if (bpType.includes('cloze_passages') && !rawPartType.includes('fill_blank')) {
            const hasPassage = Boolean(q.passage && q.passage.trim().length >= 20);
            if (!hasPassage && typeof q.stem === 'string' && q.stem.trim().length < 50) {
              ineligible_reasons.push(`Dạng bài ${bpType} yêu cầu bài đọc văn bản (passage)`);
              continue;
            }
          }

          // Visual check
          let hasVisualDeficit = false;
          if (isVisualQuestionType(rawPartType) || isVisualQuestionType(bpType)) {
            const theme = q.illustration_theme || q.illustration;
            let hasImageBank = false;
            if (Array.isArray(q.options_images) && q.options_images.length > 0) {
              hasImageBank = true;
            } else if (typeof q.options_images === 'string') {
              try {
                const parsed = JSON.parse(q.options_images);
                if (Array.isArray(parsed) && parsed.length > 0) hasImageBank = true;
              } catch {}
            }
            const hasTheme = isValidIllustrationTheme(theme) || hasImageBank;
            if (!hasTheme) {
              hasVisualDeficit = true;
              if (!ineligible_reasons.some((r) => r.includes('hình minh họa'))) {
                ineligible_reasons.push('Dạng bài nhìn tranh thiếu chủ đề hình minh họa SVG hợp lệ');
              }
            }
          }

          if (hasAudioDeficit || hasVisualDeficit) {
            continue;
          }

          exam_format_compatible = true;
          matched_blueprint_part = partKey;
          break;
        }
      }

      if (!foundMatchingType) {
        ineligible_reasons.push(
          `Loại bài ${q.part_type || 'không xác định'} không thuộc bất kỳ phần nào trong blueprint HSK ${targetLevel}`
        );
      }
    } else {
      ineligible_reasons.push(`Blueprint HSK ${targetLevel} không có phần thi kỹ năng '${rawSkill}'`);
    }
  }

  return {
    exam_eligible: exam_format_compatible,
    ineligible_reasons,
    matched_blueprint_part
  };
}

let eligibleCount = 0;
let ineligibleCount = 0;
const ineligibles: any[] = [];

for (const q of rows) {
  const res = validateWithoutArtificialGuards(q, q.level);
  if (res.exam_eligible) {
    eligibleCount++;
  } else {
    ineligibleCount++;
    ineligibles.push({
      id: q.id,
      level: q.level,
      skill: q.skill,
      part_type: q.part_type,
      reasons: res.ineligible_reasons
    });
  }
}

console.log(`Result WITHOUT artificial guards:`);
console.log(`- Exam Eligible: ${eligibleCount}`);
console.log(`- Exam Ineligible: ${ineligibleCount}`);
console.log(`Ineligible items:`, ineligibles);

db.close();
