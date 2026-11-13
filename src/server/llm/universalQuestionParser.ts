/**
 * Universal Question Parser for Minnese QBank.
 *
 * Supports importing questions from multiple heterogeneous sources:
 * 1. JSON arrays and objects (raw JSON or within Markdown code fences) from AI APIs.
 * 2. Unformatted raw text / chat scripts from external AI chat interfaces
 *    (Claude, ChatGPT, DeepSeek, Gemini, Groq).
 * 3. Multi-part HSK reading exam formats (True/False 2-opt, Dialogue matching 5-opt,
 *    Word bank cloze 5-opt, shared option pools, run-on tables, inline pinyin separation).
 * 4. Standard Chinese HSK exam formats (dialogue turns, question stems, A-D options, answer keys, Vietnamese explanations).
 *
 * Automatically extracts:
 * - Stem (dialogue turns, questions, passages) cleaned of parenthesized Latin/Pinyin
 * - Pinyin preserved in separate pinyin field (or auto-derived via pinyin-pro if omitted)
 * - Options (A, B, C, D, E)
 * - Auto-solved or key-matched answer index (0-based)
 * - Explanation and distractor rationales in Vietnamese
 * - Normalizes to standard CandidateQuestion objects
 */

import { pinyin as getPinyinPro } from 'pinyin-pro';
import { CandidateQuestion } from './types.js';
import {
  robustJsonParse,
  normalizeQuestionAliases,
  stripOptionPrefix,
} from './jsonParser.js';
import {
  solveTrueFalseQuestion,
  solveDialogueMatchingGroup,
  solveWordBankGroup,
  solveSingleQuestionSync,
} from './autoAnswerSolver.js';

export interface UniversalParseOptions {
  default_level?: number;
  default_skill?: 'listening' | 'reading' | 'writing' | string;
  default_part_type?: string;
  default_topic?: string;
}

interface ExtractedAnswerKey {
  letterOrText: string;
  answerIdx?: number;
  explanationVi?: string;
}

/**
 * Normalizes full-width Unicode characters (Ａ-Ｆ: \uFF21-\uFF26, ａ-ｆ: \uFF41-\uFF46) to standard ASCII A-F / a-f.
 */
export function normalizeFullWidthLetters(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, (ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 0xFF21 && code <= 0xFF3A) {
        return String.fromCharCode(code - 0xFF21 + 0x41); // Ａ-Ｚ -> A-Z
      }
      if (code >= 0xFF41 && code <= 0xFF5A) {
        return String.fromCharCode(code - 0xFF41 + 0x61); // ａ-ｚ -> a-z
      }
      return ch;
    })
    .replace(/\uFF0E/g, '.')
    .replace(/\uFF1A/g, ':');
}

/**
 * Resolves an option label token (letter, full-width, circled number, or numeric) to a 0-based index.
 */
export function parseOptionLabelToIdx(label: string): number | null {
  if (!label || typeof label !== 'string') return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  // Circled numbers ① - ⑥ (0x2460 - 0x2465)
  const code = trimmed.charCodeAt(0);
  if (code >= 0x2460 && code <= 0x2465) {
    return code - 0x2460;
  }
  // Black circled numbers ❶ - ❻ (0x2776 - 0x277B)
  if (code >= 0x2776 && code <= 0x277B) {
    return code - 0x2776;
  }
  // Circled letters Ⓐ - Ⓕ (0x24B6 - 0x24BB)
  if (code >= 0x24B6 && code <= 0x24BB) {
    return code - 0x24B6;
  }
  // Full-width Latin Ａ - Ｆ (0xFF21 - 0xFF26)
  if (code >= 0xFF21 && code <= 0xFF26) {
    return code - 0xFF21;
  }
  // Full-width Latin ａ - ｆ (0xFF41 - 0xFF46)
  if (code >= 0xFF41 && code <= 0xFF46) {
    return code - 0xFF41;
  }
  // Standard ASCII letters A - F / a - f
  const upper = trimmed.toUpperCase();
  if (upper >= 'A' && upper <= 'F') {
    return upper.charCodeAt(0) - 65;
  }
  // Numeric labels 1 - 6
  if (/^[1-6]$/.test(trimmed)) {
    return parseInt(trimmed, 10) - 1;
  }
  return null;
}

/**
 * Parses raw text or JSON into normalized CandidateQuestion objects.
 */
export function parseUniversalQuestions(
  input: string,
  options?: UniversalParseOptions
): CandidateQuestion[] {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return [];
  }

  // Feature 1: Normalize full-width Latin letters \uFF21-\uFF26 to ASCII A-F
  const normalizedInput = normalizeFullWidthLetters(input);

  const trimmed = normalizedInput.trim();
  const defaultLevel = options?.default_level && options.default_level >= 1 && options.default_level <= 6
    ? options.default_level
    : 1;
  const defaultSkill = (options?.default_skill === 'listening' || options?.default_skill === 'writing'
    ? options.default_skill
    : 'reading') as 'listening' | 'reading' | 'writing';
  const defaultPartType = options?.default_part_type?.trim() || 'read_fill_blank_4opt';
  const defaultTopic = options?.default_topic?.trim() || null;

  // =========================================================================
  // Strategy 1: Attempt JSON Parse (Direct JSON or Markdown Fenced JSON)
  // =========================================================================
  const jsonCandidates = tryParseJsonQuestions(trimmed, defaultLevel, defaultSkill, defaultPartType, defaultTopic);
  if (jsonCandidates.length > 0) {
    return jsonCandidates;
  }

  // =========================================================================
  // Strategy 2: Multi-Part & Heterogeneous Text Parser (4-Stage Pipeline)
  // =========================================================================
  return parseRawTextQuestions(trimmed, defaultLevel, defaultSkill, defaultPartType, defaultTopic);
}

/**
 * Attempts to parse input as JSON array or object.
 */
function tryParseJsonQuestions(
  rawText: string,
  defaultLevel: number,
  defaultSkill: 'listening' | 'reading' | 'writing',
  defaultPartType: string,
  defaultTopic: string | null
): CandidateQuestion[] {
  const hasJsonMarkers =
    rawText.includes('```') ||
    (rawText.includes('{') && rawText.includes('}')) ||
    (rawText.includes('[') && rawText.includes(']'));

  if (!hasJsonMarkers) {
    return [];
  }

  try {
    const parsed = robustJsonParse(rawText);

    // High-fidelity roundtrip for structured Minnese Exam Export JSON
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed.$schema?.includes('hsk-exam') || parsed.metadata?.generator?.includes('Minnese')) &&
      Array.isArray(parsed.questions)
    ) {
      return parsed.questions.map((q: any) => ({
        id: q.id,
        stem: q.stem,
        pinyin: q.pinyin,
        passage: q.passage,
        options: Array.isArray(q.options) ? q.options.map((opt: any) => stripOptionPrefix(String(opt ?? ''))).filter(Boolean) : [],
        answer_idx: typeof q.answer_idx === 'number' ? q.answer_idx : 0,
        explanation_vi: q.explanation_vi || '',
        level: q.level || defaultLevel,
        skill: q.skill || defaultSkill,
        part_type: q.part_type || defaultPartType,
        topic: q.topic,
        target_grammar: q.target_grammar,
        tested_vocab: q.tested_vocab,
        difficulty_tier: q.difficulty_tier,
        trap_type: q.trap_type,
        illustration_theme: q.illustration_theme,
        options_images: q.options_images,
      }));
    }

    const rawList: any[] = [];

    if (Array.isArray(parsed)) {
      rawList.push(...parsed);
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.questions)) {
        rawList.push(...parsed.questions);
      } else if (Array.isArray(parsed.items)) {
        rawList.push(...parsed.items);
      } else if (Array.isArray(parsed.data)) {
        rawList.push(...parsed.data);
      } else if (parsed.stem || parsed.question) {
        rawList.push(parsed);
      }
    }

    const results: CandidateQuestion[] = [];
    for (const rawItem of rawList) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const normalized = normalizeQuestionAliases(
        {
          ...rawItem,
          part_type: rawItem.part_type || rawItem.partType || defaultPartType,
          topic: rawItem.topic || defaultTopic,
        },
        defaultLevel,
        defaultSkill,
        false
      );
      if (normalized && normalized.stem && Array.isArray(normalized.options) && normalized.options.length >= 2) {
        results.push(normalized);
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Stage 1: Document Preprocessor & Bottom Answer Key Extractor
 *
 * Restricts answer key detection to whole-document footer/section boundary.
 * Does not falsely match single inline question answers like `Đáp án: B`.
 */
function extractBottomAnswerKey(text: string): {
  examText: string;
  answerKeyMap: Map<number, ExtractedAnswerKey>;
} {
  const answerKeyMap = new Map<number, ExtractedAnswerKey>();

  const headerRegex = /(?:^|\n+|(?<=[。！？\.\!\?\]\)]))\s*(?:[-*=~_#\s]+)?(?:ĐÁP\s*ÁN\s*(?:VÀ|&)\s*GIẢI\s*THÍCH\s*CHI\s*TIẾT(?:\s*\(ANSWER\s*KEY\))?|BẢNG\s*ĐÁP\s*ÁN(?:\s*(?:VÀ|&)\s*GIẢI\s*THÍCH\s*CHI\s*TIẾT)?(?:\s*\(ANSWER\s*KEY\))?|ANSWER\s*KEY|参考答案|答案及解析|LỜI\s*GIẢI\s*CHI\s*TIẾT|KEY\s*[:：]?(?=\s*(?:\n|\d+[\.\:\-]))|ĐÁP\s*ÁN\s*[:：]?(?=\s*(?:[-*=~_#]*\n\s*(?:Câu\s*)?\d+[\.\:、\s\-]|(?:\d+[\.\:\-]))))(?:\s*[:：])?(?:\s*[-*=~_#]+)?/i;
  const match = text.match(headerRegex);
  if (!match || match.index === undefined) {
    return { examText: text, answerKeyMap };
  }

  const examText = text.substring(0, match.index).trim();
  const answerKeyText = text.substring(match.index + match[0].length).trim();

  if (!answerKeyText) {
    return { examText, answerKeyMap };
  }

  const resolveKeyTokenToIdx = (ansRaw: string): number | undefined => {
    const raw = ansRaw.trim();
    const optIdx = parseOptionLabelToIdx(raw);
    if (optIdx !== null && optIdx >= 0 && optIdx <= 5) return optIdx;
    if (/(?:对|✓|√|True|正确|Đúng)/i.test(raw)) return 0;
    if (/(?:错|✗|×|False|错误|Sai)/i.test(raw)) return 1;
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      return n > 0 && n <= 6 ? n - 1 : n;
    }
    return undefined;
  };

  // Pass 1: Extract compact inline multi-key sequences like "Câu 1: B | Câu 2: A" or "1.A 2.B 3.C 4.D" or "1-A, 2-B"
  const compactMultiMatches = Array.from(
    answerKeyText.matchAll(/(?:Câu|第|Question|Q)?\s*(\d+)\s*[\.\:、\-]\s*(?:(?:Đáp\s*án(?:\s*chính\s*xác\s*là|\s*đúng\s*là|\s*đúng|\s*là)?|Chọn\s*đáp\s*án|Ans|Key|Answer|=>|->)\s*[:：\-]?\s*)?([A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ]|对|错|√|×|✓|✗|Đúng|Sai|True|False)\b/gi)
  );
  for (const cm of compactMultiMatches) {
    const qNum = parseInt(cm[1], 10);
    const ansRaw = cm[2].trim();
    const ansIdx = resolveKeyTokenToIdx(ansRaw);
    if (!isNaN(qNum) && ansIdx !== undefined && !answerKeyMap.has(qNum)) {
      answerKeyMap.set(qNum, {
        letterOrText: ansRaw,
        answerIdx: ansIdx,
      });
    }
  }

  // Pass 2: Line-by-line detailed answer & explanation extraction
  const lines = answerKeyText.split('\n').map((l) => l.trim()).filter(Boolean);
  let lastQuestionNum: number | null = null;

  for (const line of lines) {
    // Skip multiple-key summary lines already handled in Pass 1
    if ((line.match(/(?:Câu|第|Q)?\s*\d+\s*[\.\:、\-]/gi) || []).length >= 2) {
      continue;
    }

    const itemMatch = line.match(
      /^(?:[-*•+]\s*)?(?:Câu|第|Question|Q)?\s*(\d+)[\.\:、\s\-]+(?:(?:Đáp\s*án(?:\s*chính\s*xác\s*là|\s*đúng\s*là|\s*đúng|\s*là)?|Chọn\s*đáp\s*án|Ans|Key|Answer|=>|->)\s*[:：\-]?\s*)?([A-Fa-f0-9\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ对错√×✓✗TrueFalseĐúngSai]+)(?:\s*\([^\)]*\))?(?:[\.\s:：\-]+(.*))?$/i
    );
    if (itemMatch) {
      const qNum = parseInt(itemMatch[1], 10);
      const ansRaw = itemMatch[2].trim();
      const expl = itemMatch[3]
        ?.replace(/^(?:\*\*)?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*\*)?[:：\s]*(?:\*\*)?\s*/i, '')
        .replace(/\*\*$/, '')
        .trim();
      const ansIdx = resolveKeyTokenToIdx(ansRaw);

      const existing = answerKeyMap.get(qNum);
      answerKeyMap.set(qNum, {
        letterOrText: ansRaw,
        answerIdx: ansIdx ?? existing?.answerIdx,
        explanationVi: expl || existing?.explanationVi,
      });
      lastQuestionNum = qNum;
      continue;
    }

    // Continuation explanation line (e.g. "Giải thích: ...") for the immediately preceding question number
    if (lastQuestionNum !== null && /^(?:[-*•+]\s*)?(?:\*{1,2})?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*{1,2})?[:：\s]/i.test(line)) {
      const explText = line
        .replace(/^(?:[-*•+]\s*)?(?:\*{1,2})?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*{1,2})?[:：\s]*(?:\*\*)?\s*/i, '')
        .replace(/\*\*$/, '')
        .trim();
      const existing = answerKeyMap.get(lastQuestionNum);
      if (existing && explText) {
        existing.explanationVi = existing.explanationVi
          ? `${existing.explanationVi} ${explText}`
          : explText;
      }
    }
  }

  return { examText, answerKeyMap };
}

interface SectionSegment {
  header: string;
  ruleText: string;
  bodyText: string;
  sectionLevel?: number;
}

/**
 * Stage 2: Section & Multi-Part Segmenter
 *
 * Consumes optional dual Vietnamese labels e.g. `(Phần 1: Câu 1 - 5)` so rule text
 * does not bleed into Question 1 stem.
 */
function segmentMultiPartSections(text: string): SectionSegment[] {
  const sectionHeaderRegex = /(?:^|\n+|(?<=[。！？\.\!\?\]\)]))\s*(?:#+\s*)?(?:第\s*([一二三四五六七八九十1-6])\s*部分|Phần\s*([1-6I-VI]+)|Part\s*([1-6])|Section\s*([1-6]))(?:\s*[:：\-\s]*(?:(?:第|Câu|Questions?)\s*\d+\s*[-–至到\s]+\d+\s*(?:题|câu)?)?(?:\s*\((?:Phần|Part)[^\)]*\))*)?/gi;

  const matches: Array<{ index: number; matchStr: string; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = sectionHeaderRegex.exec(text)) !== null) {
    matches.push({
      index: m.index,
      matchStr: m[0],
      end: m.index + m[0].length,
    });
  }

  if (matches.length === 0) {
    return [];
  }

  const sections: SectionSegment[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    let fullSectionText = text.substring(cur.end, nextIndex).trim();

    // Strip any lingering parenthesized section label like "(Phần 1: Câu 1 - 5)" or "(Phần 1)"
    fullSectionText = fullSectionText.replace(/^\s*\((?:Phần|Part)\s*[1-6I-VI]+[^\)]*\)\s*/i, '').trim();

    let ruleText = '';
    let bodyText = fullSectionText;

    // Rule ends with period/punctuation followed by question marker, table marker, bank marker, option letter, or Chinese characters
    const ruleMatch = fullSectionText.match(
      /^(?:Quy tắc|Hướng dẫn|Instructions|规则)[:：\s]*([\s\S]+?[。\.])\s*(?=(?:(?:Câu|Bài|题|Q|Question)\s*\d+|Ký hiệu|Câu lựa chọn|Câu phản hồi|Bảng|ABCDE|ABC\b|\||[A-F][\.\:、\s]|[\u4e00-\u9fa5]))/i
    );

    if (ruleMatch && ruleMatch.index !== undefined) {
      ruleText = ruleMatch[1].trim();
      const cutIdx = ruleMatch.index + ruleMatch[0].length;
      bodyText = fullSectionText.substring(cutIdx).trim();
    } else {
      const fallbackRule = fullSectionText.match(/^(?:Quy tắc|Hướng dẫn|Instructions|规则)[:：\s]*([^。！？\n]+[。！？\n])/i);
      if (fallbackRule && fallbackRule.index !== undefined) {
        ruleText = fallbackRule[1].trim();
        bodyText = fullSectionText.substring(fallbackRule.index + fallbackRule[0].length).trim();
      }
    }

    let sectionLevel: number | undefined;
    const lvlMatch = cur.matchStr.match(/(?:HSK|Cấp|Level)\s*([1-6])/i);
    if (lvlMatch) {
      sectionLevel = parseInt(lvlMatch[1], 10);
    }

    sections.push({
      header: cur.matchStr.trim(),
      ruleText,
      bodyText,
      sectionLevel,
    });
  }

  return sections;
}

/**
 * Smart Pinyin Separation: extracts all parenthesized Latin/Pinyin,
 * and strips them from the Chinese text to leave a pristine Hanzi stem.
 */
function cleanStemAndExtractPinyin(rawPiece: string): { stem: string; pinyin: string | null } {
  // Extract all parenthesized Latin/Pinyin containing at least one Latin or Tone letter:
  // e.g. (píngguǒ), (Zhuōzi shang...), (Wǒ fēicháng ______ chī...), but NOT cloze blanks like (____)
  const pinyinMatches = Array.from(
    rawPiece.matchAll(/[\(\uff08\[\u3010](?=[^\)\uff09\]\u3011]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-_]+)[\)\uff09\]\u3011]/g)
  );
  const pinyinList = pinyinMatches.map((m) => m[1].trim()).filter(Boolean);
  const explicitPinyin = pinyinList.length > 0 ? pinyinList.join(' ') : null;

  // Replace parenthesized pinyin with space, clean answer brackets, normalize blanks
  let cleanStem = rawPiece
    .replace(/[\(\uff08\[\u3010](?=[^\)\uff09\]\u3011]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-_]+)[\)\uff09\]\u3011]/g, ' ')
    .replace(/(?:→|->)?\s*\[\s*\]|(?:→|->)?\s*\(\s*\)/g, '')
    .replace(/^(?:(?:Câu|第|Question|Q)\s*\d+\s*(?:题|cau|câu)?[\.:\s]*|\d+[\.\)]\s*)/i, '')
    .replace(/^\s*\((?:Phần|Part)\s*[1-6I-VI]+[^\)]*\)\s*/i, '')
    .replace(/^(?:Quy tắc|Hướng dẫn|Instructions|规则)[:：\s]*[^。！？\n]*[。！？\n]\s*/i, '')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Normalize placeholder blanks: （ ）、( ) or (____) to ____
  if (/（[\s\u3000]*）|\([\s\u3000]*\)|[\(（]\s*_{1,}\s*[\)）]|_{2,}/.test(cleanStem)) {
    cleanStem = cleanStem
      .replace(/\s*(?:（[\s\u3000]*）|\([\s\u3000]*\)|[\(（]\s*_{1,}\s*[\)）]|_{2,})\s*/g, '____')
      .trim();
  }

  return {
    stem: cleanStem,
    pinyin: explicitPinyin,
  };
}

/**
 * Extracts sequential contiguous options: A..., B..., C...
 * Uses lookbehind on punctuation and pinyin closing parentheses so options B and D
 * are not skipped in run-on contiguous text.
 */
function extractContiguousOptionPool(text: string): { options: string[]; optionsPinyin: string[]; remainingText: string } {
  const options: string[] = [];
  const optionsPinyin: string[] = [];
  const poolRegex = /(?<=^|[\n\s\)）\.。！？]|Ký hiệu|Câu lựa chọn|Câu phản hồi)([A-F])[\.\:、\s]*([\u4e00-\u9fa5\s，,]+[。！？\.\!\?](?:\s*[\(\uff08][^\)\uff09]+[\)\uff09])?)/g;

  let m: RegExpExecArray | null;
  let lastEnd = 0;
  let expectedIndex = 0;

  while ((m = poolRegex.exec(text)) !== null) {
    const letter = m[1].toUpperCase();
    const ltrIdx = letter.charCodeAt(0) - 65;

    if (ltrIdx === expectedIndex) {
      const optRaw = m[2].trim();
      const pinyinMatch = optRaw.match(/[\(\uff08\[\u3010]([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+)[\)\uff09\]\u3011]/);
      const rawCleanOpt = optRaw.replace(/[\(\uff08\[\u3010][a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+[\)\uff09\]\u3011]/g, '').trim();
      const cleanOpt = rawCleanOpt || optRaw.replace(/^[\[\(【]\s*|\s*[\]\)】]$/g, '').trim();
      options.push(cleanOpt);
      const optPinyin = pinyinMatch ? pinyinMatch[1].trim() : (cleanOpt && /[\u4e00-\u9fa5]/.test(cleanOpt) ? getPinyinPro(cleanOpt, { toneType: 'symbol' }) : '');
      optionsPinyin.push(optPinyin);
      lastEnd = m.index + m[0].length;
      expectedIndex++;
    } else if (expectedIndex > 0) {
      // Non-sequential letter encountered after we already started collecting options
      break;
    }
  }

  const remainingText = text.substring(lastEnd).trim();
  return { options, optionsPinyin, remainingText };
}

/**
 * Extracts options from a markdown table e.g.:
 * | Ký hiệu | Câu phản hồi |
 * | A | 不客气。 |
 * | B | 好的，明天见。 |
 */
function extractOptionsFromMarkdownTable(text: string): { options: string[]; optionsPinyin: string[]; remainingText: string } {
  const optionsMap: Map<number, string> = new Map();
  const optionsPinyinMap: Map<number, string> = new Map();
  const nonTableLines: string[] = [];

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const first = cells[0].toUpperCase();
        if (/^[A-F]$/.test(first)) {
          const idx = first.charCodeAt(0) - 65;
          const pinyinMatch = cells[1].match(/[\(\uff08\[\u3010]([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+)[\)\uff09\]\u3011]/);
          const rawCleanOpt = cells[1].replace(/[\(\uff08\[\u3010][^\)\uff09\]\u3011]+[\)\uff09\]\u3011]/g, '').trim();
          const optText = rawCleanOpt || cells[1].replace(/^[\[\(【]\s*|\s*[\]\)】]$/g, '').trim();
          optionsMap.set(idx, optText);
          const optPinyin = pinyinMatch ? pinyinMatch[1].trim() : (optText && /[\u4e00-\u9fa5]/.test(optText) ? getPinyinPro(optText, { toneType: 'symbol' }) : '');
          optionsPinyinMap.set(idx, optPinyin);
          continue;
        }
      }
    } else {
      nonTableLines.push(line);
    }
  }

  const options: string[] = [];
  const optionsPinyin: string[] = [];
  if (optionsMap.size >= 2) {
    const maxIdx = Math.max(...Array.from(optionsMap.keys()));
    for (let i = 0; i <= maxIdx; i++) {
      if (optionsMap.has(i)) {
        options.push(optionsMap.get(i)!);
        optionsPinyin.push(optionsPinyinMap.get(i) || '');
      }
    }
  }

  return {
    options,
    optionsPinyin,
    remainingText: nonTableLines.join('\n').trim(),
  };
}

/**
 * Splits the question stream into individual question items.
 */
function splitSectionQuestions(streamText: string): string[] {
  if (/(?:→|->)?\s*\[\s*\]|(?:→|->)?\s*\(\s*\)/.test(streamText)) {
    const rawSplits = streamText
      .split(/(?:→|->)\s*\[\s*\]|(?:→|->)\s*\(\s*\)|(?<=[。！？\.\!\?])\s*\[\s*\]/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && /[\u4e00-\u9fa5]/.test(s));

    if (rawSplits.length >= 1) {
      return rawSplits;
    }
  }

  const delimiterPattern = /(?:^|\n+)(?=(?:(?:Câu|第|Question|Q)\s*\d+\s*(?:题|cau|câu)?[\.:\s]|(?:\d+[\.\)]\s*(?:[\u4e00-\u9fa5A-Za-z]|对话|Passage|问|Đề|Chọn))))/i;
  const numSplits = streamText.split(delimiterPattern).map((s) => s.trim()).filter((s) => s.length > 0);
  if (numSplits.length > 1) {
    return numSplits;
  }

  const lineSplits = streamText.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 0);
  if (lineSplits.length > 1) {
    return lineSplits;
  }

  return [streamText];
}

/**
 * Parses a multi-part exam document using the 4-Stage Pipeline.
 */
function parseMultiPartExamDocument(
  examText: string,
  answerKeyMap: Map<number, ExtractedAnswerKey>,
  defaultLevel: number,
  defaultSkill: 'listening' | 'reading' | 'writing',
  defaultTopic: string | null
): CandidateQuestion[] {
  const sections = segmentMultiPartSections(examText);
  if (sections.length === 0) {
    return [];
  }

  const results: CandidateQuestion[] = [];
  let globalQuestionIndex = 0;

  for (const sec of sections) {
    const level = sec.sectionLevel || defaultLevel;
    const body = sec.bodyText.trim();
    const rule = sec.ruleText.toLowerCase();

    // Determine section type:
    // 1. True/False: requires contrasting true/false pattern in rule/body, or answer key indicating true/false
    const nextKey = answerKeyMap.get(globalQuestionIndex + 1);
    const isTrueFalse =
      /(?:đúng\s*(?:\(?[√✓]\)?|\/|hoặc|hay)\s*sai(?:\s*\(?[×✗x]\)?)?)|(?:[√✓]\s*(?:\/|hoặc|hay|,)\s*[×✗x])|(?:true\s*(?:\/|or)\s*false)|(?:判断对错|对错|正误)|(?:đúng\s*\(√\)\s*hoặc\s*sai\s*\(×\))/i.test(rule) ||
      (/(?:đúng\s*(?:\(?[√✓]\)?|\/|hoặc|hay)\s*sai(?:\s*\(?[×✗x]\)?)?)|(?:[√✓]\s*(?:\/|hoặc|hay|,)\s*[×✗x])|(?:判断对错|对错|正误)/i.test(body) && !/^[A-F][\.\:、\s]/m.test(body)) ||
      (Boolean(nextKey) && /^(?:[√✓×✗]|对|错|true|false|đúng|sai)$/i.test(nextKey?.letterOrText?.trim() || ''));

    // 2. Cloze / Word Bank: must involve fill-in-blank or placeholders
    const isWordBank = !isTrueFalse && (/(?:điền\s*từ|chỗ\s*trống|điền\s*vào|cloze|fill)/i.test(rule) || /_{2,}/.test(body));

    let sectionOptions: string[] = [];
    let sectionOptionsPinyin: string[] = [];
    let questionStreamText = body;
    let partType = 'generic_mcq';

    if (isTrueFalse) {
      sectionOptions = ['对', '错'];
      sectionOptionsPinyin = ['duì', 'cuò'];
      partType = 'read_true_false_2opt';
      questionStreamText = body;
    } else if (isWordBank) {
      // 1. Try Word Bank Header: e.g. "ABCDE多少 (duōshao)听 (tīng)..." or "ABC\n买 (mǎi) 多少 (duōshao)..."
      const wbMarkerMatch = body.match(/^[\s\n]*(?:Ký hiệu[\s\S]*?)?([A-F]{2,6}|[A-F](?:\s+[A-F]){1,5})\s*([\s\S]+)$/i);
      if (wbMarkerMatch) {
        const letterSeq = wbMarkerMatch[1].replace(/\s+/g, '').toUpperCase();
        const letterCount = letterSeq.length;
        const remainder = wbMarkerMatch[2].trim();

        const wordTokens = Array.from(remainder.matchAll(/([\u4e00-\u9fa5]+)(?:\s*[\(\uff08]([^\)\uff09]+)[\)\uff09])?/g));
        if (wordTokens.length >= letterCount) {
          sectionOptions = wordTokens.slice(0, letterCount).map((wt) => wt[1].trim());
          sectionOptionsPinyin = wordTokens.slice(0, letterCount).map((wt) => {
            if (wt[2] && wt[2].trim()) return wt[2].trim();
            const hanzi = wt[1].trim();
            return hanzi && /[\u4e00-\u9fa5]/.test(hanzi) ? getPinyinPro(hanzi, { toneType: 'symbol' }) : '';
          });
          const lastMatchedToken = wordTokens[letterCount - 1];
          const cutIdx = (lastMatchedToken.index ?? 0) + lastMatchedToken[0].length;
          questionStreamText = remainder.substring(cutIdx).trim();
        }
      }

      if (sectionOptions.length === 0) {
        const tableRows = extractOptionsFromMarkdownTable(body);
        if (tableRows.options.length > 0) {
          sectionOptions = tableRows.options;
          sectionOptionsPinyin = tableRows.optionsPinyin;
          questionStreamText = tableRows.remainingText;
        }
      }

      if (sectionOptions.length === 0) {
        const optLineRegex = /^[A-F][\.\:、\s]\s*([\u4e00-\u9fa5]+)(?:\s*[\(\uff08]([^\)\uff09]+)[\)\uff09])?/gm;
        const matches = Array.from(body.matchAll(optLineRegex));
        if (matches.length >= 2) {
          sectionOptions = matches.map((m) => m[1].trim());
          sectionOptionsPinyin = matches.map((m) => {
            if (m[2] && m[2].trim()) return m[2].trim();
            const h = m[1].trim();
            return h && /[\u4e00-\u9fa5]/.test(h) ? getPinyinPro(h, { toneType: 'symbol' }) : '';
          });
          const lastMatch = matches[matches.length - 1];
          const cutIdx = (lastMatch.index ?? 0) + lastMatch[0].length;
          questionStreamText = body.substring(cutIdx).trim();
        }
      }

      partType = `read_fill_blank_word_bank_${sectionOptions.length}opt`;
    } else {
      // Check if the section contains individual questions each having their own options (multiple A. occurrences)
      const aMatches = body.match(/(?:^|[\n\s\t])A[\.\:：\s]/g) || [];
      const hasMultipleOptionSets = aMatches.length >= 2;

      // Dialogue Matching / Shared Option Pool (only if NOT multiple distinct option sets)
      if (!hasMultipleOptionSets) {
        const tableRows = extractOptionsFromMarkdownTable(body);
        if (tableRows.options.length >= 2) {
          sectionOptions = tableRows.options;
          sectionOptionsPinyin = tableRows.optionsPinyin;
          questionStreamText = tableRows.remainingText;
        } else {
          const contiguous = extractContiguousOptionPool(body);
          if (contiguous.options.length >= 2) {
            sectionOptions = contiguous.options;
            sectionOptionsPinyin = contiguous.optionsPinyin;
            questionStreamText = contiguous.remainingText;
          }
        }
      }

      if (sectionOptions.length < 2) {
        // Not a shared option pool section! The questions inside this section have their own individual options.
        const individualBlocks = splitIntoQuestionBlocks(body);
        for (const block of individualBlocks) {
          globalQuestionIndex++;
          const keyItem = answerKeyMap.get(globalQuestionIndex);
          const q = parseSingleQuestionBlock(
            block,
            level,
            defaultSkill,
            'read_fill_blank_4opt',
            defaultTopic,
            keyItem
          );
          if (q) {
            results.push(q);
          }
        }
        continue;
      }

      partType = `read_dialogue_matching_${sectionOptions.length}opt`;
    }

    // Split questionStreamText into individual question blocks
    const questionPieces = splitSectionQuestions(questionStreamText);

    // Extract questions data
    const sectionQuestionsData: Array<{
      stem: string;
      pinyin: string | null;
    }> = [];

    for (const piece of questionPieces) {
      if (!piece.trim()) continue;
      const { stem, pinyin } = cleanStemAndExtractPinyin(piece);
      if (stem && stem.length >= 2 && /[\u4e00-\u9fa5]/.test(stem)) {
        sectionQuestionsData.push({ stem, pinyin });
      }
    }

    if (sectionQuestionsData.length === 0) continue;

    // Stage 4: Solve / Match Answers
    if (isTrueFalse) {
      for (const qData of sectionQuestionsData) {
        globalQuestionIndex++;
        const keyItem = answerKeyMap.get(globalQuestionIndex);

        let answerIdx = 0;
        let explanationVi = '';
        let distractorRationales: any = undefined;

        if (keyItem && typeof keyItem.answerIdx === 'number') {
          answerIdx = keyItem.answerIdx;
          explanationVi = keyItem.explanationVi || `Đáp án đúng là ${sectionOptions[answerIdx]}, theo bảng đáp án của đề bài.`;
        } else {
          const solved = solveTrueFalseQuestion(qData.stem, sectionOptions);
          answerIdx = solved.answer_idx;
          explanationVi = solved.explanation_vi;
          distractorRationales = solved.distractor_rationales;
        }

        let pinyin = qData.pinyin;
        if (!pinyin) {
          try {
            pinyin = getPinyinPro(qData.stem, { toneType: 'symbol' });
          } catch {
            pinyin = null;
          }
        }

        const candidate: any = {
          stem: qData.stem,
          stem_pinyin: pinyin,
          options: sectionOptions,
          options_pinyin: sectionOptionsPinyin.length === sectionOptions.length ? sectionOptionsPinyin : undefined,
          answer_idx: answerIdx,
          explanation_vi: explanationVi,
          explanation_summary_vi: explanationVi,
          answer_rationale_vi: explanationVi,
          distractor_rationales: distractorRationales,
          level,
          skill: defaultSkill,
          part_type: partType,
          pinyin,
          topic: defaultTopic,
        };

        const normalized = normalizeQuestionAliases(candidate, level, defaultSkill, false);
        if (normalized) results.push(normalized);
      }
    } else if (isWordBank) {
      let solvedList: any[] = [];
      const hasAllKeys = sectionQuestionsData.every((_, idx) => answerKeyMap.has(globalQuestionIndex + idx + 1));

      if (!hasAllKeys) {
        solvedList = solveWordBankGroup(sectionQuestionsData, sectionOptions);
      }

      for (let i = 0; i < sectionQuestionsData.length; i++) {
        globalQuestionIndex++;
        const qData = sectionQuestionsData[i];
        const keyItem = answerKeyMap.get(globalQuestionIndex);

        let answerIdx = 0;
        let explanationVi = '';
        let distractorRationales: any = undefined;

        if (keyItem && typeof keyItem.answerIdx === 'number') {
          answerIdx = keyItem.answerIdx;
          explanationVi = keyItem.explanationVi || `Đáp án đúng là ${String.fromCharCode(65 + answerIdx)} (${sectionOptions[answerIdx]}), theo bảng đáp án của đề bài.`;
        } else if (solvedList[i]) {
          answerIdx = solvedList[i].answer_idx;
          explanationVi = solvedList[i].explanation_vi;
          distractorRationales = solvedList[i].distractor_rationales;
        }

        const chosenWord = sectionOptions[answerIdx] || '';
        const completedStem = /_{2,}|（\s*）|\(\s*\)/.test(qData.stem)
          ? qData.stem.replace(/_{2,}|（\s*）|\(\s*\)/g, chosenWord)
          : (qData.stem.includes('____') ? qData.stem.replace(/____/g, chosenWord) : `${qData.stem} (${chosenWord})`);

        let pinyin = qData.pinyin;
        if (!pinyin) {
          try {
            // Keep placeholder ____ in pinyin to prevent answer leakage to student
            pinyin = getPinyinPro(qData.stem, { toneType: 'symbol' });
          } catch {
            pinyin = null;
          }
        }

        const candidate: any = {
          stem: qData.stem,
          stem_pinyin: pinyin,
          options: sectionOptions,
          options_pinyin: sectionOptionsPinyin.length === sectionOptions.length ? sectionOptionsPinyin : undefined,
          answer_idx: answerIdx,
          explanation_vi: explanationVi,
          explanation_summary_vi: explanationVi,
          answer_rationale_vi: explanationVi,
          distractor_rationales: distractorRationales,
          completed_stem: completedStem,
          canonical_completed_stem: completedStem,
          level,
          skill: defaultSkill,
          part_type: partType,
          pinyin,
          topic: defaultTopic,
        };

        const normalized = normalizeQuestionAliases(candidate, level, defaultSkill, false);
        if (normalized) results.push(normalized);
      }
    } else {
      let solvedList: any[] = [];
      const hasAllKeys = sectionQuestionsData.every((_, idx) => answerKeyMap.has(globalQuestionIndex + idx + 1));

      if (!hasAllKeys) {
        solvedList = solveDialogueMatchingGroup(sectionQuestionsData, sectionOptions);
      }

      for (let i = 0; i < sectionQuestionsData.length; i++) {
        globalQuestionIndex++;
        const qData = sectionQuestionsData[i];
        const keyItem = answerKeyMap.get(globalQuestionIndex);

        let answerIdx = 0;
        let explanationVi = '';
        let distractorRationales: any = undefined;

        if (keyItem && typeof keyItem.answerIdx === 'number') {
          answerIdx = keyItem.answerIdx;
          explanationVi = keyItem.explanationVi || `Đáp án đúng là ${String.fromCharCode(65 + answerIdx)}: ${sectionOptions[answerIdx]}, theo bảng đáp án của đề bài.`;
        } else if (solvedList[i]) {
          answerIdx = solvedList[i].answer_idx;
          explanationVi = solvedList[i].explanation_vi;
          distractorRationales = solvedList[i].distractor_rationales;
        }

        let pinyin = qData.pinyin;
        if (!pinyin) {
          try {
            pinyin = getPinyinPro(qData.stem, { toneType: 'symbol' });
          } catch {
            pinyin = null;
          }
        }

        const candidate: any = {
          stem: qData.stem,
          stem_pinyin: pinyin,
          options: sectionOptions,
          options_pinyin: sectionOptionsPinyin.length === sectionOptions.length ? sectionOptionsPinyin : undefined,
          answer_idx: answerIdx,
          explanation_vi: explanationVi,
          explanation_summary_vi: explanationVi,
          answer_rationale_vi: explanationVi,
          distractor_rationales: distractorRationales,
          level,
          skill: defaultSkill,
          part_type: partType,
          pinyin,
          topic: defaultTopic,
        };

        const normalized = normalizeQuestionAliases(candidate, level, defaultSkill, false);
        if (normalized) results.push(normalized);
      }
    }
  }

  return results;
}

/**
 * Splits unformatted raw text into individual question blocks and parses each one.
 */
function parseRawTextQuestions(
  text: string,
  defaultLevel: number,
  defaultSkill: 'listening' | 'reading' | 'writing',
  defaultPartType: string,
  defaultTopic: string | null
): CandidateQuestion[] {
  let cleaned = text;
  const fenceMatch = cleaned.match(/```(?:markdown|text)?\s*([\s\S]+?)\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  } else {
    cleaned = cleaned.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  cleaned = cleaned.replace(/^[ \t]*>[ \t]?/gm, '');

  // Stage 1: Extract bottom answer key
  const { examText, answerKeyMap } = extractBottomAnswerKey(cleaned);

  // Stage 2: Check for Multi-Part Sections
  const multiPartCandidates = parseMultiPartExamDocument(
    examText,
    answerKeyMap,
    defaultLevel,
    defaultSkill,
    defaultTopic
  );

  if (multiPartCandidates.length > 0) {
    return multiPartCandidates;
  }

  // Fallback: Standard Block Parser for isolated / single questions
  const blocks = splitIntoQuestionBlocks(examText);
  const questions: CandidateQuestion[] = [];

  for (const block of blocks) {
    const qNumMatch = block.match(/^(?:(?:###\s*|\*\*)?(?:Câu|第|Question|Q|Bài)\s*(\d+)|[\(\[（]?(\d+)[\.\:、\)\]）])/i);
    const explicitQNum = qNumMatch ? parseInt(qNumMatch[1] || qNumMatch[2], 10) : null;
    const lookupIdx = explicitQNum && !isNaN(explicitQNum) ? explicitQNum : questions.length + 1;
    const keyItem = answerKeyMap.get(lookupIdx);
    const q = parseSingleQuestionBlock(block, defaultLevel, defaultSkill, defaultPartType, defaultTopic, keyItem);
    if (q) {
      questions.push(q);
    }
  }

  return questions;
}

/**
 * Splits a raw document into individual question text blocks.
 */
export function splitIntoQuestionBlocks(text: string): string[] {
  const cleanedText = text.replace(/^[ \t]*>[ \t]?/gm, '');
  const delimiterPattern = /(?:^|\n+)(?=(?:(?:###\s*|\*\*)?(?:Câu|第|Question|Q|Bài)\s*\d+\s*(?:题|cau|câu)?[\.:\s、\)\]\*]|(?:[Ⅰ-Ⅻ]|(?:I[XV]|V?I{1,3}|X{1,2}(?:I[XV]|V?I{0,3})?))[\.\:、\)\]）]\s*(?:[\u4e00-\u9fa5A-Za-z]|Passage|问|Đề|Chọn)))|(?:\n\s*\n+|\n(?<=(?:Đáp\s*án|Answer|Ans|Key|Giải\s*thích|Explanation|正确答案|答案|=>|->|[A-Fa-f4-6][\.\:、\)\s][^\n]+)\s*))(?=[\(\[（]?\d+[\.\:、\)\]）]\s*(?:[\u4e00-\u9fa5A-Za-z]|Passage|问|Đề|Chọn))/i;

  const rawSplits = cleanedText.split(delimiterPattern).map((s) => s.trim()).filter((s) => s.length > 0);

  if (rawSplits.length > 1) {
    return rawSplits;
  }

  const paragraphSplits = text.split(/\n\s*\n+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const selfContainedParagraphs = paragraphSplits.filter(
    (p) => /[\u4e00-\u9fa5]/.test(p) && /(?:^|\s)[\(\[]?A[\)\]\.\:、\s]/i.test(p) && /(?:^|\s)[\(\[]?B[\)\]\.\:、\s]/i.test(p)
  );
  if (paragraphSplits.length > 1 && selfContainedParagraphs.length > 1) {
    return paragraphSplits;
  }

  return [text];
}

/**
 * Parses a single text block representing one question.
 */
export function parseSingleQuestionBlock(
  block: string,
  defaultLevel: number,
  defaultSkill: 'listening' | 'reading' | 'writing',
  defaultPartType: string,
  defaultTopic: string | null,
  keyItem?: ExtractedAnswerKey
): CandidateQuestion | null {
  if (!block || !block.trim()) return null;

  const cleanedBlock = block.replace(/^[ \t]*>[ \t]?/gm, '');
  const lines = cleanedBlock.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  let level = defaultLevel;
  const levelMatch = block.match(/(?:HSK|Cấp|Level)\s*([1-6])/i);
  if (levelMatch) {
    const parsedLvl = parseInt(levelMatch[1], 10);
    if (!isNaN(parsedLvl) && parsedLvl >= 1 && parsedLvl <= 6) {
      level = parsedLvl;
    }
  }

  let skill = defaultSkill;
  if (/kỹ năng:\s*(?:nghe|listening)|nghe hiểu/i.test(block)) {
    skill = 'listening';
  } else if (/kỹ năng:\s*(?:viết|writing)|viết/i.test(block)) {
    skill = 'writing';
  } else if (/kỹ năng:\s*(?:đọc|reading)|đọc hiểu/i.test(block)) {
    skill = 'reading';
  }

  let hasExplicitAnswerKey = Boolean(keyItem && typeof keyItem.answerIdx === 'number');
  let answerIdx = keyItem?.answerIdx ?? 0;
  let rawAnswerText: string | null = keyItem?.letterOrText && keyItem?.answerIdx === undefined ? keyItem.letterOrText : null;

  const answerMatch = block.match(
    /(?:\[ĐÁP_ÁN:\s*([^\]]+)\]|(?:\*\*)?(?:Đáp\s*án(?:\s*chính\s*xác\s*là|\s*đúng\s*là|\s*đúng|\s*là)?|Chọn\s*đáp\s*án|Correct\s*Answer|Answer|Ans|Key|正确答案|答案|=>|->)(?:\*\*)?[:：\s]*(?:\*\*)?[:：\s]*(?:(?:\*\*)?(?:(?:Câu|第|Q)?\s*\d+[\.\:\s、\-]+)?)?(?:\*\*)?([^\n\r]+))/i
  );
  if (answerMatch) {
    const rawAns = (answerMatch[1] || answerMatch[2] || '')
      .replace(/^\*\*|\*\*$/g, '')
      .trim();
    const tokenMatch = rawAns.match(/^([A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ]|[0-5](?!\.))(?:[\)\]）\.\:、\/\-–—\s]+.*)?$/);
    if (tokenMatch) {
      const resolved = parseOptionLabelToIdx(tokenMatch[1]);
      if (resolved !== null && resolved >= 0 && resolved <= 5) {
        answerIdx = resolved;
        hasExplicitAnswerKey = true;
      }
    } else if (/^(?:对|√|✓|ĐÚNG|TRUE)$/i.test(rawAns)) {
      answerIdx = 0;
      hasExplicitAnswerKey = true;
    } else if (/^(?:错|×|✗|SAI|FALSE)$/i.test(rawAns)) {
      answerIdx = 1;
      hasExplicitAnswerKey = true;
    } else if (!isNaN(parseInt(rawAns, 10)) && /^\d+$/.test(rawAns.trim())) {
      const n = parseInt(rawAns.trim(), 10);
      answerIdx = n > 0 && n <= 6 ? n - 1 : n;
      hasExplicitAnswerKey = true;
    } else if (rawAns.length > 0) {
      rawAnswerText = rawAns;
    }
  }

  let explanationVi = keyItem?.explanationVi || '';
  const explPrefixPattern = /^(?:[-*•+]\s*)?(?:\*{1,2})?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*{1,2})?[:：\s]/i;
  const explCleanPattern = /^(?:[-*•+]\s*)?(?:\*{1,2})?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*{1,2})?[:：\s]*(?:\*{1,2})?\s*/i;

  const explIdx = lines.findIndex((l) => explPrefixPattern.test(l));
  if (explIdx !== -1) {
    const firstLine = lines[explIdx]
      .replace(explCleanPattern, '')
      .replace(/\*\*$/, '')
      .trim();
    const remainingLines = lines.slice(explIdx + 1).filter((l) =>
      !/^(?:(?:###\s*|\*\*)?(?:Câu|第|Question|Q|Bài)|\d+[\.\)])/i.test(l)
    );
    explanationVi = [firstLine, ...remainingLines].filter(Boolean).join('\n').trim();
  } else if (!explanationVi) {
    const explMatch = block.match(
      /(?:^|\n)(?:[-*•+]\s*)?(?:\*{1,2})?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*{1,2})?[:：\s]*(?:\*{1,2})?\s*([\s\S]+)$/i
    );
    if (explMatch) {
      explanationVi = explMatch[1].replace(/\*\*$/, '').trim();
    }
  }

  let explicitPinyin: string | null = null;
  const pinyinMatch = block.match(/(?:(?:\*\*)?(?:Pinyin|Phiên\s*âm)(?:\*\*)?)[:\s]*([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’]+)/i);
  if (pinyinMatch) {
    explicitPinyin = pinyinMatch[1].trim();
  }

  const optionsMap: Map<number, string> = new Map();
  let inlineMarkedAnswerIdx: number | null = null;
  const optionLineRegex = /^(?:[-*•+]\s*)?(?:(\[xX✓✔\]|[✓✔]|\*(?!\*))\s*)?(?:\*\*)?(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?([A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ]|[1-6])(?:\*\*|[\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]+(?:\*\*)?)\s*(.+)$/;
  const inlineOptionRegex = /(?:^|[\s\t]+|(?<=[。！？，；：,.!?;:\)\]）]))(\*|\[\s*[xX✓✔]\s*\]|[✓✔])?\s*(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?([A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ]|[1-6])[\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]\s*([^\n]+?)(?=(?:[\s\t]+(?:\*|\[\s*[xX✓✔]\s*\]|[✓✔])?\s*(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?[A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ1-6][\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]|(?<=[。！？\.\!\?\)）])(?:\*|\[\s*[xX✓✔]\s*\]|[✓✔])?\s*(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?[A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ1-6][\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]|[\s\t]+(?:Đáp\s*án|Chọn\s*đáp\s*án|Correct\s*Answer|Answer|Ans|Key|Giải\s*thích|Lời\s*giải|Pinyin|Explanation|Dịch\s*nghĩa|Tạm\s*dịch|正确答案|答案|解析)[:：\s]|$))/gi;

  // Pre-scan: Identify dialogue speaker turns (e.g. A: / B:) vs real question options
  let questionPromptIdx = -1;
  for (let idx = 0; idx < lines.length; idx++) {
    if (/^(?:\*\*)?(?:问|Question|Câu hỏi|Đề bài|Stem)[:：\s]/i.test(lines[idx].trim())) {
      questionPromptIdx = idx;
      break;
    }
  }

  let lastOptionAIdx = -1;
  for (let idx = lines.length - 1; idx >= 0; idx--) {
    const l = lines[idx];
    if (
      optionLineRegex.test(l) &&
      /^(?:[-*•+]\s*)?(?:(\[xX✓✔\]|[✓✔]|\*(?!\*))\s*)?(?:\*\*)?(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?[Aa\uFF21\uFF41①❶Ⓐ1](?:\*\*|[\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s])/.test(l)
    ) {
      lastOptionAIdx = idx;
      break;
    }
  }

  const dialogueLineIndices = new Set<number>();
  const speakerLineRegex = /^(?:[-*•+]\s*)?(?:\*\*)?(?:[A-Za-z]|男|女)(?:\*\*)?[:：]\s*.+$/;

  for (let idx = 0; idx < lines.length; idx++) {
    const l = lines[idx];
    if (!speakerLineRegex.test(l)) continue;

    const isBeforeQuestionPrompt = questionPromptIdx !== -1 && idx < questionPromptIdx;
    const isBeforeLastOptionA = lastOptionAIdx !== -1 && idx < lastOptionAIdx;

    if (isBeforeQuestionPrompt || isBeforeLastOptionA) {
      dialogueLineIndices.add(idx);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (dialogueLineIndices.has(i)) continue;
    const line = lines[i];
    // Check if single line contains multiple horizontal options (e.g. A. ... B. ... C. ... D. ... or 2x2 grid line 2: C. ... D. ...)
    if (/(?:^|[\s\t]+|[。！？，；：,.!?;:\)\]）])(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?[A-F\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ1-6][\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s].+?[\s\t]+(?:(?:Option|选项|Phương\s*án|Lựa\s*chọn)\s*)?[\(\[（]?[A-F\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ1-6][\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]/i.test(line)) {
      let m: RegExpExecArray | null;
      inlineOptionRegex.lastIndex = 0;
      while ((m = inlineOptionRegex.exec(line)) !== null) {
        const leadingMark = m[1];
        const rawLabel = m[2];
        const optIdx = parseOptionLabelToIdx(rawLabel);
        if (optIdx === null) continue;
        let optText = m[3]
          .replace(/\s*(?:\[ĐÁP_ÁN:[^\]]+\]|(?:Đáp\s*án|Chọn\s*đáp\s*án|Giải\s*thích|Pinyin|Answer|Ans|Key|Explanation|Dịch\s*nghĩa|Tạm\s*dịch).*)$/i, '')
          .replace(/^[\-–—\/:：\.\s]+/, '')
          .replace(/[\-–—\/:：\s]+$/, '')
          .trim();
        const trailingMark = /(?:\(\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\)|\[\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\]|\*+)$/i.test(optText);
        if (leadingMark || trailingMark) {
          inlineMarkedAnswerIdx = optIdx;
          optText = optText
            .replace(/(?:\(\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\)|\[\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\]|\*+)$/i, '')
            .replace(/^[\-–—\/:：\.\s]+/, '')
            .replace(/[\-–—\/:：\s]+$/, '')
            .trim();
        }
        if (optIdx >= 0 && optIdx < 6 && optText) {
          optionsMap.set(optIdx, optText);
        }
      }
      continue;
    }

    // Plain digits [1-6] cannot be options on line 0 (to avoid capturing question numbers)
    const isPlainDigitOnLineZero = i === 0 && /^(?:[-*•+]\s*)?[\(\[（]?[1-6][\.\:、\)\s]/.test(line);
    const lineMatch = !isPlainDigitOnLineZero ? line.match(optionLineRegex) : null;
    if (lineMatch) {
      const leadingMark = lineMatch[1];
      const rawLabel = lineMatch[2];
      const optIdx = parseOptionLabelToIdx(rawLabel);
      if (optIdx !== null) {
        let optText = lineMatch[3]
          .replace(/\s*(?:\[ĐÁP_ÁN:[^\]]+\]|(?:Đáp\s*án|Chọn\s*đáp\s*án|Giải\s*thích|Pinyin|Answer|Ans|Key|Explanation|Dịch\s*nghĩa|Tạm\s*dịch).*)$/i, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .replace(/^[\-–—\/:：\.\s]+/, '')
          .replace(/[\-–—\/:：\s]+$/, '')
          .trim();
        const trailingMark = /(?:\(\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\)|\[\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\]|\*+)$/i.test(optText);
        if (leadingMark || trailingMark) {
          inlineMarkedAnswerIdx = optIdx;
          optText = optText
            .replace(/(?:\(\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\)|\[\s*(?:Đúng|Sai|Correct|Incorrect|True|False|x|X|✓|✔|√|×|✗|正确|错误)\s*\]|\*+)$/i, '')
            .replace(/^\*\*/, '')
            .replace(/\*\*$/, '')
            .replace(/^[\-–—\/:：\.\s]+/, '')
            .replace(/[\-–—\/:：\s]+$/, '')
            .trim();
        }
        if (optIdx >= 0 && optIdx < 6 && optText) {
          optionsMap.set(optIdx, optText);
        }
      }
    }
  }

  if (optionsMap.size < 2) {
    let match: RegExpExecArray | null;
    inlineOptionRegex.lastIndex = 0;
    while ((match = inlineOptionRegex.exec(block)) !== null) {
      const leadingMark = match[1];
      const rawLabel = match[2];
      const optIdx = parseOptionLabelToIdx(rawLabel);
      if (optIdx === null) continue;
      let optText = match[3]
        .replace(/\s*(?:\[ĐÁP_ÁN:[^\]]+\]|(?:Đáp\s*án|Chọn\s*đáp\s*án|Giải\s*thích|Pinyin|Answer|Ans|Key|Explanation|Dịch\s*nghĩa|Tạm\s*dịch).*)$/i, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/^[\-–—\/:：\.\s]+/, '')
        .replace(/[\-–—\/:：\s]+$/, '')
        .trim();
      const trailingMark = /(?:\(\s*(?:Đúng|Correct|✓|✔|√)\s*\)|\[\s*(?:Đúng|Correct|x|X|✓|✔)\s*\]|\*+)$/i.test(optText);
      if (leadingMark || trailingMark) {
        inlineMarkedAnswerIdx = optIdx;
        optText = optText
          .replace(/(?:\(\s*(?:Đúng|Correct|✓|✔|√)\s*\)|\[\s*(?:Đúng|Correct|x|X|✓|✔)\s*\]|\*+)$/i, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .replace(/^[\-–—\/:：\.\s]+/, '')
          .replace(/[\-–—\/:：\s]+$/, '')
          .trim();
      }
      if (optIdx >= 0 && optIdx < 6 && optText) {
        optionsMap.set(optIdx, optText);
      }
    }
  }

  if (!hasExplicitAnswerKey && inlineMarkedAnswerIdx !== null) {
    answerIdx = inlineMarkedAnswerIdx;
    hasExplicitAnswerKey = true;
  }

  const options: string[] = [];
  const optionsPinyin: string[] = [];
  const maxIdx = Math.max(...Array.from(optionsMap.keys()), 3);
  for (let i = 0; i <= maxIdx; i++) {
    if (optionsMap.has(i)) {
      const rawOpt = optionsMap.get(i)!;
      const pMatch = rawOpt.match(/[\(\uff08\[\u3010]([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+)[\)\uff09\]\u3011]/);
      const rawCleanOpt = rawOpt.replace(/[\(\uff08\[\u3010](?:[a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-]+|[√✓✔×✗xX对错ĐúngSaiTrueFalse正确错误])[\)\uff09\]\u3011]/g, '').trim();
      const cleanOpt = (rawCleanOpt || rawOpt.replace(/^[\[\(【]\s*|\s*[\]\)】]$/g, ''))
        .replace(/^[\-–—\/:：\.\s]+/, '')
        .replace(/[\-–—\/:：\s]+$/, '')
        .trim();
      options.push(cleanOpt);
      const optPinyin = pMatch ? pMatch[1].trim() : (cleanOpt && /[\u4e00-\u9fa5]/.test(cleanOpt) ? getPinyinPro(cleanOpt, { toneType: 'symbol' }) : '');
      optionsPinyin.push(optPinyin);
    }
  }

  // Feature 5: Text/word-based answer matching against parsed options
  if (!hasExplicitAnswerKey && rawAnswerText && options.length > 0) {
    const cleanTarget = rawAnswerText
      .replace(/^[\(\[]?(?:Đáp\s*án(?:\s*chính\s*xác\s*là|\s*đúng\s*là|\s*đúng|\s*là)?|Answer|Key)[:：\s]*/i, '')
      .replace(/^[A-Fa-f\uFF21-\uFF26\uFF41-\uFF46①-⑥❶-❻Ⓐ-Ⓕ1-6][\)\]）\.\:、\/\-–—\uFF0E\uFF1A\s]+/, '')
      .replace(/[)\]]$/, '')
      .replace(/[。！？\.\!\?]$/, '')
      .trim();

    if (cleanTarget) {
      let matchedIdx = options.findIndex((opt) => opt.trim().toLowerCase() === cleanTarget.toLowerCase());
      if (matchedIdx === -1) {
        matchedIdx = options.findIndex((opt) => {
          const cleanOpt = opt.replace(/[。！？\.\!\?]$/, '').trim().toLowerCase();
          return cleanOpt === cleanTarget.toLowerCase();
        });
      }
      if (matchedIdx === -1) {
        matchedIdx = options.findIndex((opt) => {
          const cleanOpt = opt.replace(/[。！？\.\!\?]$/, '').trim().toLowerCase();
          const target = cleanTarget.toLowerCase();
          return cleanOpt.length > 0 && (cleanOpt.includes(target) || target.includes(cleanOpt));
        });
      }
      if (matchedIdx !== -1) {
        answerIdx = matchedIdx;
        hasExplicitAnswerKey = true;
      }
    }
  }

  // Normalize 2-option True/False labels to ['对', '错']
  if (
    options.length === 2 &&
    options.every((o) => /^(?:对|错|√|×|✓|✗|Đúng|Sai|True|False|正确|错误)(?:\s*[\(\uff08\[\u3010]?[√✓×✗xX对错ĐúngSaiTrueFalse正确错误]?[\)\uff09\]\u3011]?)?$/i.test(o.trim()))
  ) {
    const isFirstFalse = /^(?:错|×|✗|Sai|False|错误)/i.test(options[0].trim());
    if (isFirstFalse) {
      answerIdx = answerIdx === 0 ? 1 : answerIdx === 1 ? 0 : answerIdx;
    }
    options[0] = '对';
    options[1] = '错';
    optionsPinyin[0] = 'duì';
    optionsPinyin[1] = 'cuò';
  }

  // Fallback for True/False single question without A/B options
  if (
    options.length < 2 &&
    (/(?:→|->)\s*\[\s*[√✓×✗对错]?\s*\]|\(\s*[√✓×✗对错]\s*\)|(?:Đáp án|Answer|答案)[:\s]*(?:√|✓|×|✗|对|错|Đúng|Sai|True|False)/i.test(block) ||
      defaultPartType === 'read_true_false_2opt')
  ) {
    options.length = 0;
    options.push('对', '错');
    optionsPinyin.length = 0;
    optionsPinyin.push('duì', 'cuò');
    const inlineTfMatch = block.match(/(?:→|->)?\s*[\[\(]\s*([√✓×✗对错])\s*[\]\)]/);
    if (!hasExplicitAnswerKey && inlineTfMatch) {
      answerIdx = /^[√✓对]$/.test(inlineTfMatch[1]) ? 0 : 1;
      hasExplicitAnswerKey = true;
    }
  }

  if (options.length < 2) {
    return null;
  }

  if (answerIdx >= options.length || answerIdx < 0) {
    answerIdx = 0;
  }

  const stemLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (dialogueLineIndices.has(i)) {
      let cleanedSpeakerLine = line
        .replace(/^(?:[-*•+]\s*)?(?:###\s*)?(?:\*\*)?(?:[-*•+]\s*)?(?:(?:Câu|第|Question|Q|Bài)\s*\d+\s*(?:题|cau|câu)?[\.:\s、\)\]\*]*|[\(\[（]?(?:\d+|[Ⅰ-Ⅻ]|(?:I[XV]|V?I{1,3}|X{1,2}(?:I[XV]|V?I{0,3})?))[\.\:、\)\]）]\s*)(?:\*\*)?/i, '')
        .replace(/\s*\[ĐÁP_ÁN:[^\]]+\]/gi, '')
        .replace(/\s*[\(\[]\s*(?:Đáp\s*án(?:\s*chính\s*xác|\s*đúng)?|Correct\s*Answer|Answer|Key|正确答案|答案)\s*[:：\s]*[A-Fa-f0-9\uFF21-\uFF26对错√×✓✗TrueFalseĐúngSai]+\s*[)\]]/gi, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/^[-*•+]\s*/, '')
        .trim();
      if (cleanedSpeakerLine) {
        stemLines.push(cleanedSpeakerLine);
      }
      continue;
    }
    const isOptionLine = (i > 0 || !/^(?:[-*•+]\s*)?[\(\[（]?[1-6][\.\:、\)\s]/.test(line)) && optionLineRegex.test(line);
    if (isOptionLine && !/[\u4e00-\u9fa5].+[\s\t]+(?:(?:Option|选项)\s*)?[\(\[（]?[A\uFF21][\)\]）\.\:、\/\uFF0E\uFF1A\s]/i.test(line)) break;
    if (/^(?:[-*•+]\s*)?(?:\*{1,2})?(?:\[ĐÁP_ÁN:|(?:Đáp\s*án(?:\s*chính\s*xác\s*là|\s*đúng\s*là|\s*đúng|\s*là)?|Chọn\s*đáp\s*án|Correct\s*Answer|Answer|Ans|Key|正确答案|答案|=>|->)(?:\*{1,2})?[:：\s])/i.test(line)) break;
    if (/^(?:[-*•+]\s*)?(?:\*{1,2})?(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải|Explanation|Rationale|Phân\s*tích(?:\s*câu)?|Dịch\s*nghĩa|Tạm\s*dịch|Nghĩa(?:\s*của)?\s*câu|解析|Lý\s*do)(?:\*{1,2})?[:：\s]/i.test(line)) break;
    if (/^(?:[-*•+]\s*)?(?:\*{1,2})?(?:Pinyin|Phiên\s*âm)(?:\*{1,2})?[:：\s]/i.test(line)) break;

    // Feature 3: Stem & Header Sanitization
    // Strip inline answer leaks on stem line (e.g. `(Answer: A)`, `(Đáp án: B)`, `[Answer: C]`)
    const inlineAnswerLeakMatch = line.match(/\s*[\(\[]\s*(?:Đáp\s*án(?:\s*chính\s*xác|\s*đúng)?|Correct\s*Answer|Answer|Key|正确答案|答案)\s*[:：\s]*([A-Fa-f0-9\uFF21-\uFF26对错√×✓✗TrueFalseĐúngSai]+)\s*[)\]]/i);
    if (!hasExplicitAnswerKey && inlineAnswerLeakMatch) {
      const leakToken = inlineAnswerLeakMatch[1].trim();
      const resolved = parseOptionLabelToIdx(leakToken);
      if (resolved !== null) {
        answerIdx = resolved;
        hasExplicitAnswerKey = true;
      }
    }

    let cleanedLine = line
      .replace(/^(?:[-*•+]\s*)?(?:###\s*)?(?:\*\*)?(?:[-*•+]\s*)?(?:(?:Câu|第|Question|Q|Bài)\s*\d+\s*(?:题|cau|câu)?[\.:\s、\)\]\*]*|[\(\[（]?(?:\d+|[Ⅰ-Ⅻ]|(?:I[XV]|V?I{1,3}|X{1,2}(?:I[XV]|V?I{0,3})?))[\.\:、\)\]）]\s*)(?:\*\*)?/i, '')
      .replace(/^(?:[-*•+]\s*)?(?:\*\*)?(?:Đề\s*bài|Câu\s*hỏi|Question|Stem)(?:\*\*)?[:：\s]*/i, '')
      .replace(/\s*\[ĐÁP_ÁN:[^\]]+\]/gi, '')
      .replace(/\s*[\(\[]\s*(?:Đáp\s*án(?:\s*chính\s*xác|\s*đúng)?|Correct\s*Answer|Answer|Key|正确答案|答案)\s*[:：\s]*[A-Fa-f0-9\uFF21-\uFF26对错√×✓✗TrueFalseĐúngSai]+\s*[)\]]/gi, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .replace(/^[-*•+]\s*/, '')
      .trim();

    // Strip inline options and trailing Đáp án / Giải thích from single-line stem
    if (/(?:^|[\s\t]+|[。！？，；：,.!?;:\)\]）])(?:(?:Option|选项)\s*)?[\(\[（]?[A\uFF21][\)\]）\.\:、\/\uFF0E\uFF1A\s].+?[\s\t]+(?:(?:Option|选项)\s*)?[\(\[（]?[B\uFF22][\)\]）\.\:、\/\uFF0E\uFF1A\s]/i.test(cleanedLine)) {
      cleanedLine = cleanedLine
        .replace(/(?:[\s\t]+|(?<=[。！？，；：,.!?;:\)\]）]))(?:\*|\[\s*[xX✓✔]\s*\]|[✓✔])?\s*(?:(?:Option|选项)\s*)?[\(\[（]?[A\uFF21][\)\]）\.\:、\/\uFF0E\uFF1A\s][\s\S]*$/i, '')
        .trim();
    }
    cleanedLine = cleanedLine
      .replace(/[\s\t]+(?:Đáp\s*án(?:\s*chính\s*xác\s*là|\s*đúng\s*là|\s*đúng|\s*là)?|Chọn\s*đáp\s*án|Correct\s*Answer|Answer|Ans|Key|Giải\s*thích|Lời\s*giải|Explanation|Dịch\s*nghĩa|Tạm\s*dịch|正确答案|答案|解析)[:：\s][\s\S]*$/i, '')
      .trim();

    if (cleanedLine) {
      stemLines.push(cleanedLine);
    }
  }

  // If multiple stemLines exist and some contain Hanzi while others are pure English/Vietnamese metadata headers, keep Hanzi lines
  const hanziStemLines = stemLines.filter((l) => /[\u4e00-\u9fa5]/.test(l));
  let stem = (hanziStemLines.length > 0 ? hanziStemLines : stemLines).join('\n').trim();
  if (!stem) {
    stem = lines[0]
      .replace(/^(?:[-*•+]\s*)?(?:###\s*)?(?:\*\*)?(?:[-*•+]\s*)?(?:(?:Câu|第|Question|Q|Bài)\s*\d+\s*(?:题|cau|câu)?[\.:\s、\)\]\*]*|[\(\[（]?(?:\d+|[Ⅰ-Ⅻ]|(?:I[XV]|V?I{1,3}|X{1,2}(?:I[XV]|V?I{0,3})?))[\.\:、\)\]）]\s*)(?:\*\*)?/i, '')
      .replace(/^(?:[-*•+]\s*)?(?:\*\*)?(?:Đề\s*bài|Câu\s*hỏi|Question|Stem)(?:\*\*)?[:：\s]*/i, '')
      .replace(/\s*\[ĐÁP_ÁN:[^\]]+\]/gi, '')
      .replace(/\s*[\(\[]\s*(?:Đáp\s*án(?:\s*chính\s*xác|\s*đúng)?|Correct\s*Answer|Answer|Key|正确答案|答案)\s*[:：\s]*[A-Fa-f0-9\uFF21-\uFF26对错√×✓✗TrueFalseĐúngSai]+\s*[)\]]/gi, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .replace(/^[-*•+]\s*/, '')
      .trim();
  }

  if (!stem) return null;

  // Clean inline parenthesized and bracketed pinyin from stem if present (extract all matches containing Latin letters)
  const stemPinyinMatches = Array.from(
    stem.matchAll(/[\(\uff08\[\u3010](?=[^\)\uff09\]\u3011]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-_]+)[\)\uff09\]\u3011]/g)
  );
  const stemPinyinList = stemPinyinMatches
    .map((m) => m[1].trim())
    .filter((p) => Boolean(p) && !/^(?:please|select|choose|chọn|điền|note|hint)/i.test(p));
  stem = stem
    .replace(/\s*[\(\uff08\[\u3010](?=[^\)\uff09\]\u3011]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])([a-zA-Z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s,.\?!'’\-_]+)[\)\uff09\]\u3011]\s*/g, '')
    .replace(/(?:→|->)\s*[\[\(]\s*[√✓×✗对错]?\s*[\]\)]|[\[\(]\s*[√✓×✗对错]\s*[\]\)]/g, '')
    .replace(/\s*[\(\[]\s*(?:Đáp\s*án(?:\s*chính\s*xác|\s*đúng)?|Correct\s*Answer|Answer|Key|正确答案|答案)\s*[:：\s]*[A-Fa-f0-9\uFF21-\uFF26对错√×✓✗TrueFalseĐúngSai]+\s*[)\]]/gi, '')
    .replace(/\s+([，。！？,.!?；;:])/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (/（[\s\u3000]*）|\([\s\u3000]*\)|\[[\s\u3000\.]*\]|【[\s\u3000\.]*】|[\(（]\s*_{1,}\s*[\)）]|\[\s*_{1,}\s*\]|_{2,}/.test(stem)) {
    stem = stem
      .replace(/(?:（[\s\u3000]*）|\([\s\u3000]*\)|\[[\s\u3000\.]*\]|【[\s\u3000\.]*】|[\(（]\s*_{1,}\s*[\)）]|\[\s*_{1,}\s*\]|_{2,})/g, '____')
      .trim();
  }

  // Auto-solve if no explicit answer key was provided
  if (!hasExplicitAnswerKey) {
    if (options.length === 2 && options[0] === '对' && options[1] === '错') {
      const solvedTf = solveTrueFalseQuestion(stem, options);
      answerIdx = solvedTf.answer_idx;
      if (!explanationVi) explanationVi = solvedTf.explanation_vi;
    } else {
      const solvedSingle = solveSingleQuestionSync(stem, options);
      if (solvedSingle && typeof solvedSingle.answer_idx === 'number' && solvedSingle.confidence >= 0.6) {
        answerIdx = solvedSingle.answer_idx;
        if (!explanationVi && solvedSingle.explanation_vi) {
          explanationVi = solvedSingle.explanation_vi;
        }
      }
    }
  }

  const correctOptionText = options[answerIdx] || '';
  if (!explanationVi) {
    explanationVi = `Đáp án đúng là ${correctOptionText}, phù hợp ngữ pháp và ngữ cảnh HSK ${level}.`;
  } else if (explanationVi.length < 10) {
    explanationVi = `${explanationVi} — Đáp án đúng là ${correctOptionText} (HSK ${level}).`;
  }

  let pinyin = explicitPinyin;
  if (!pinyin) {
    try {
      // Keep placeholder ____ in pinyin to prevent answer leakage
      pinyin = getPinyinPro(stem, { toneType: 'symbol' });
    } catch {
      pinyin = null;
    }
    if (!pinyin && stemPinyinList.length > 0) {
      pinyin = stemPinyinList.join(' ');
    }
  }

  let partType = defaultPartType;
  const hasDialogueSpeakerMarkers =
    stem.includes('男:') || stem.includes('女:') || stem.includes('男：') || stem.includes('女：') ||
    stem.includes('问:') || stem.includes('问：') ||
    /(?:^|\n)\s*(?:[A-B][:：]|男[:：]|女[:：]|问[:：])/.test(stem) ||
    dialogueLineIndices.size > 0 ||
    /(?:^|\n)\s*(?:男|女|问)[:：]/.test(block);

  if (hasDialogueSpeakerMarkers) {
    skill = 'listening';
  }

  if (options.length === 2 && options[0] === '对' && options[1] === '错') {
    partType = skill === 'listening' ? 'listen_true_false_2opt' : 'read_true_false_2opt';
  } else if (stem.includes('____')) {
    if (options.length === 4) {
      partType = 'read_fill_blank_4opt';
    } else if (options.length >= 3 && options.length <= 6) {
      partType = `read_fill_blank_word_bank_${options.length}opt`;
    }
  } else {
    // Question does NOT have a blank placeholder (____)
    if (stem.includes('★') && options.length === 3) {
      partType = 'read_comprehension_short_3opt';
    } else if (stem.includes('★') && options.length === 4) {
      partType = 'read_comprehension_4opt';
    } else if (hasDialogueSpeakerMarkers && options.length === 3) {
      partType = 'listen_dialogue_qa_3opt';
    } else if (hasDialogueSpeakerMarkers && options.length === 4) {
      partType = 'listen_dialogue_qa_4opt';
    } else if (/fill_blank|cloze/i.test(partType) && options.length >= 2 && options.length <= 6) {
      partType = `read_dialogue_matching_${options.length}opt`;
    }
  }

  let completedStem: string | undefined = undefined;
  if (stem.includes('____')) {
    completedStem = stem.replace(/\s*____\s*/g, correctOptionText);
  }

  const rawQuestion: any = {
    stem,
    stem_pinyin: pinyin,
    options,
    options_pinyin: optionsPinyin.length === options.length ? optionsPinyin : undefined,
    answer_idx: answerIdx,
    explanation_vi: explanationVi,
    explanation_summary_vi: explanationVi,
    answer_rationale_vi: explanationVi,
    level,
    skill,
    part_type: partType,
    pinyin,
    topic: defaultTopic,
    completed_stem: completedStem,
    canonical_completed_stem: completedStem,
    is_imported: true,
  };

  return normalizeQuestionAliases(rawQuestion, level, skill, false);
}
