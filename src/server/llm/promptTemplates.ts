/**
 * HSK 3.0 Standardized Prompt Templates & Few-Shot Specifications
 * Following Chinese Proficiency Grading Standards for International Chinese Language Education (CLEC/CTI 2021).
 *
 * Requirements:
 * 1. HSK Level 1 to HSK Level 5 vocabulary and grammar boundaries.
 * 2. Question types:
 *    - read_fill_blank_4opt (Điền từ vào chỗ trống)
 *    - read_comprehension_4opt (Đọc hiểu đoạn văn chọn đáp án)
 *    - listen_picture_match_4opt (Nghe / nhìn tranh chọn đáp án)
 *    - write_sentence_reorder_4opt (Sắp xếp câu)
 * 3. Enforce STRICTLY 4 distinct options with 1 grounded correct answer and 3 high-quality distractors of the SAME part of speech (POS).
 * 4. Comprehensive Vietnamese explanation (explanation_vi) and tone-marked standard Pinyin.
 * 5. Strict mapping of illustration_theme to the 27 high-fidelity SVG scenes from HSKIllustrationCanvas.tsx.
 */

import { VocabItem } from './vocabRotator.js';
import { DifficultyTier, TrapType } from './types.js';
import { formatGrammarPromptGuidance } from './grammarMap.js';
import { getPartTypeContract } from './partTypeContract.js';
import { getExpectedOptionCount } from './questionValidator.js';

/**
 * The exact 27 vector illustration themes supported by HSKIllustrationCanvas.tsx
 */
export const VALID_ILLUSTRATION_THEMES = [
  'taxi',
  'apple',
  'reading',
  'rain',
  'writing',
  'airplane',
  'train',
  'banana',
  'watermelon',
  'sleeping',
  'water',
  'sunny',
  'wind',
  'singing',
  'dance',
  'coffee',
  'tea',
  'movie',
  'phone',
  'cat',
  'hospital',
  'rice',
  'bookshelf',
  'running',
  'swimming',
  'soccer',
  'handshake',
] as const;

export type IllustrationTheme = (typeof VALID_ILLUSTRATION_THEMES)[number];

/**
 * Checks if a string is one of the 27 valid illustration themes
 */
export function isValidIllustrationTheme(theme: string | null | undefined): theme is IllustrationTheme {
  if (!theme) return false;
  return VALID_ILLUSTRATION_THEMES.includes(theme.trim().toLowerCase() as IllustrationTheme);
}

export const THEME_KEYWORD_MAP: Array<{ keyword: string; theme: IllustrationTheme }> = [
  { keyword: '看书', theme: 'reading' },
  { keyword: '小说', theme: 'reading' },
  { keyword: '图书馆', theme: 'reading' },
  { keyword: '书', theme: 'reading' },
  { keyword: '喝茶', theme: 'tea' },
  { keyword: '热茶', theme: 'tea' },
  { keyword: '茶', theme: 'tea' },
  { keyword: '咖啡', theme: 'coffee' },
  { keyword: '苹果', theme: 'apple' },
  { keyword: '香蕉', theme: 'banana' },
  { keyword: '西瓜', theme: 'watermelon' },
  { keyword: '出租车', theme: 'taxi' },
  { keyword: '打车', theme: 'taxi' },
  { keyword: '飞机', theme: 'airplane' },
  { keyword: '机场', theme: 'airplane' },
  { keyword: '火车', theme: 'train' },
  { keyword: '火车站', theme: 'train' },
  { keyword: '医院', theme: 'hospital' },
  { keyword: '看病', theme: 'hospital' },
  { keyword: '医生', theme: 'hospital' },
  { keyword: '大夫', theme: 'hospital' },
  { keyword: '电影', theme: 'movie' },
  { keyword: '影院', theme: 'movie' },
  { keyword: '游泳', theme: 'swimming' },
  { keyword: '足球', theme: 'soccer' },
  { keyword: '跑步', theme: 'running' },
  { keyword: '睡觉', theme: 'sleeping' },
  { keyword: '唱歌', theme: 'singing' },
  { keyword: '跳舞', theme: 'dance' },
  { keyword: '猫', theme: 'cat' },
  { keyword: '做饭', theme: 'rice' },
  { keyword: '米饭', theme: 'rice' },
  { keyword: '晴天', theme: 'sunny' },
  { keyword: '太阳', theme: 'sunny' },
  { keyword: '下雨', theme: 'rain' },
  { keyword: '雨伞', theme: 'rain' },
  { keyword: '雨', theme: 'rain' },
  { keyword: '刮风', theme: 'wind' },
  { keyword: '大风', theme: 'wind' },
  { keyword: '风', theme: 'wind' },
];

export function inferThemeFromText(text: string): IllustrationTheme | null {
  if (!text || typeof text !== 'string') return null;
  for (const entry of THEME_KEYWORD_MAP) {
    if (text.includes(entry.keyword)) {
      return entry.theme;
    }
  }
  return null;
}

/**
 * Normalizes dialogue speaker prefixes in Chinese listening tasks.
 * Removes boilerplate, resolves nested labels (e.g. 男：老师：), and ensures standard 男：/ 女： turns.
 */
export function normalizeDialogueSpeakers(stem: string): string {
  if (!stem || typeof stem !== 'string') return stem;
  let text = stem.trim();
  // Strip artificial filler turns
  text = text.replace(/\n?女：\s*好的，我知道了。[。.]?/g, '').trim();
  // Strip nested prefixes like "男：老师：" -> "男："
  text = text.replace(/男：\s*(?:老师|学生|朋友|我|人物A|人物B|A|B|甲|乙)\s*[:：]\s*/g, '男：');
  text = text.replace(/女：\s*(?:老师|学生|朋友|我|人物A|人物B|A|B|甲|乙)\s*[:：]\s*/g, '女：');

  // If already standard 男： and 女：
  if (text.includes('男：') && text.includes('女：')) {
    return text;
  }

  // Split lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const turn1 = lines[0].replace(/^(?:男|女|甲|乙|A|B|老师|学生|朋友|我|人物A|人物B)\s*[:：]\s*/, '');
    const turn2 = lines[1].replace(/^(?:男|女|甲|乙|A|B|老师|学生|朋友|我|人物A|人物B)\s*[:：]\s*/, '');
    const rest = lines.slice(2).join('\n');
    return `男：${turn1}\n女：${turn2}${rest ? '\n' + rest : ''}`;
  }

  // If single line with two speaker turns
  const multiSpeakerMatch = text.match(/^(?:男|女|甲|乙|A|老师|朋友|人物A)\s*[:：]\s*(.*?)[。\?!？！]\s*(?:女|男|乙|甲|B|学生|我|人物B)\s*[:：]\s*(.*)$/);
  if (multiSpeakerMatch) {
    return `男：${multiSpeakerMatch[1].trim()}。\n女：${multiSpeakerMatch[2].trim()}`;
  }

  return text;
}

/**
 * HSK 3.0 Level Guidelines & Boundaries (CLEC/CTI 2021)
 */
export interface HskLevelSpec {
  level: number;
  wordCountTarget: string;
  hanziTarget: string;
  scopeDescription: string;
  exampleWords: string[];
}

export const HSK_LEVEL_SPECS: Record<number, HskLevelSpec> = {
  1: {
    level: 1,
    wordCountTarget: '300 headwords (CLEC HSK 3.0 Band 1; 300 cumulative)',
    hanziTarget: '246 characters (CLEC recognition standard)',
    scopeDescription:
      'Elementary Chinese: basic personal introductions, daily greetings, family members, simple numbers, time, basic dining, weather, and common transport.',
    exampleWords: [
      '爸爸', '妈妈', '老师', '学生', '朋友', '医生', '医院', '学校',
      '苹果', '米饭', '茶', '水', '出租车', '飞机', '火车', '下雨',
      '天气', '睡觉', '说话', '工作', '买', '在', '做饭', '手机'
    ],
  },
  2: {
    level: 2,
    wordCountTarget: '200 new headwords (CLEC HSK 3.0 Band 2; 500 cumulative HSK 1-2)',
    hanziTarget: '125 new characters (371 cumulative recognition)',
    scopeDescription:
      'Elementary Progression: simple social interactions, shopping transactions, asking and giving directions, discussing personal hobbies, weather changes, and basic daily routines.',
    exampleWords: [
      '不错', '事情', '准备', '出来', '出门', '跑步', '游泳', '机场',
      '咖啡', '肉', '每', '笔', '考试', '离', '远', '近', '走', '进'
    ],
  },
  3: {
    level: 3,
    wordCountTarget: '500 new headwords (CLEC HSK 3.0 Band 3; 1,000 cumulative HSK 1-3)',
    hanziTarget: '284 new characters (655 cumulative recognition)',
    scopeDescription:
      'Intermediate Gateway: practical communication in work, study, travel, expressing opinions, giving advice, comparing situations, and compound sentence structures.',
    exampleWords: [
      '世界', '主要', '了解', '为了', '习惯', '张', '方便', '香蕉',
      '西瓜', '帮助', '相信', '简单', '解决', '必须', '同意', '机会',
      '决定', '清楚', '检查', '照顾'
    ],
  },
  4: {
    level: 4,
    wordCountTarget: '1,000 new headwords (CLEC HSK 3.0 Band 4; 2,000 cumulative HSK 1-4)',
    hanziTarget: '441 new characters (1,096 cumulative recognition)',
    scopeDescription:
      'Intermediate Proficiency: broad social and cultural discussions, expressing abstract viewpoints, analyzing cause and effect, discussing career, technology, health, and lifestyle.',
    exampleWords: [
      '专业', '专门', '世纪', '严格', '严重', '主意', '举办', '举行',
      '餐厅', '客厅', '甚至', '经验', '态度', '关键', '压力', '普遍',
      '随着', '优秀', '丰富', '详细'
    ],
  },
  5: {
    level: 5,
    wordCountTarget: '1,600 new headwords (CLEC HSK 3.0 Band 5; 3,600 cumulative HSK 1-5)',
    hanziTarget: '431 new characters (1,527 cumulative recognition)',
    scopeDescription:
      'Advanced Intermediate: reading newspapers, essays, formal business communication, cultural commentaries, scientific summaries, nuanced grammatical connectives, and common idioms.',
    exampleWords: [
      '不利', '严肃', '个别', '个性', '中介', '深刻', '把握', '趋势',
      '措施', '促进', '广泛', '从而', '毕竟', '体现', '逻辑', '综合',
      '原则', '持续', '掌握', '专心'
    ],
  },
  6: {
    level: 6,
    wordCountTarget: '1,800 new headwords (CLEC HSK 3.0 Band 6; 5,400 cumulative HSK 1-6)',
    hanziTarget: '413 new characters (1,940 cumulative recognition)',
    scopeDescription:
      'Mastery & High Proficiency: comprehensive understanding of complex discourse, academic papers, literary works, economic/business analyses, philosophical debates, socio-political commentaries, advanced rhetorical structures, nuanced idioms (chengyu), and subtle communicative nuances.',
    exampleWords: [
      '一道', '万物', '上进', '上市', '上述', '不料', '决策', '协调',
      '借鉴', '倾向', '探索', '进而', '策略', '保障', '规范', '一流',
      '一系列', '一贯'
    ],
  },
};

/**
 * Returns prompt guidance for a specific question type, calibrated by HSK level.
 */
export function getQuestionTypeInstructions(partType: string, level = 1): string {
  switch (partType) {
    case 'listen_question_answer_3opt':
      return `QUESTION TYPE: Listening question and response (HSK 1 sample format)
- The stem contains only one short spoken Chinese question; the application will play it as audio.
- Provide exactly 3 concise spoken-response options. One response must be the only natural, direct answer.
- Do not add a written question after the audio script.`;

    case 'listen_true_false_2opt':
    case 'read_true_false_2opt':
      if (level <= 2) {
        return `QUESTION TYPE: Picture True/False Judgment (Nhìn tranh phán đoán Đúng/Sai - HSK 1-2)
- The Chinese stem is a single spoken word, phrase, or short sentence (e.g. "看书" or "他在坐出租车去学校。").
- "illustration_theme" MUST be strictly ONE valid SVG scene key from:
  [${VALID_ILLUSTRATION_THEMES.join(', ')}]
- "options" MUST be exactly 2 choices: ["正确", "错误"] (hoặc ["对", "错"]).
- If answer_idx is 0 (Đúng), the stem MUST accurately describe the illustration_theme scene.
- If answer_idx is 1 (Sai), the stem MUST clearly contradict the illustration_theme scene (e.g. theme is "taxi" but stem says "他在跑步").
- "explanation_vi" MUST clearly explain whether the content matches or contradicts the picture.`;
      }
      return `QUESTION TYPE: Statement True/False Judgment (Nghe/Đọc đoạn văn ngắn phán đoán câu khẳng định Đúng/Sai - HSK 3-4)
- The Chinese stem consists of 1 short monologue or passage (1-3 sentences) followed on a new line by a target statement marked with "★":
  Example:
  "我想买几件新衣服，但是今天商店关门了。
  ★ 他今天买了衣服。"
- "options" MUST be exactly 2 choices: ["正确", "错误"] (hoặc ["对", "错"]).
- If answer_idx is 0 (Đúng), the ★ statement is fully supported by the text.
- If answer_idx is 1 (Sai), the ★ statement is contradicted or refuted by the text.
- "explanation_vi" MUST contrast the statement against the passage and explain why it is correct or incorrect.`;

    case 'listen_monologue_qa_3opt':
      return `QUESTION TYPE: Listening short utterance / monologue and answer (HSK 1-3 format - 3 Options: A, B, C)
- The stem contains ONE short, clear spoken narrative (1-2 sentences) followed by one clear spoken question ("问：...").
  * For HSK 1: Length 20 to 35 Chinese characters. Strictly HSK 1 words only! NO comparative structures (比, 更, 厚, 薄). NO double questions.
  * For HSK 2-3: Length 30 to 60 Chinese characters. Exactly 1 question.
- ABSOLUTELY NEVER include blank placeholders ("____") in the stem.
- Provide EXACTLY 3 concise Chinese answer choices (A, B, C); exactly one is supported by the audio script.
- Distractors must be contextually plausible within target level scope.`;

    case 'listen_dialogue_picture_match_6opt':
    case 'listen_dialogue_picture_match_split':
      return `QUESTION TYPE: Listening dialogue matched to picture (HSK 1/2/3 format - 6 Options: A–F)
- DIALOGUE MANDATE: The Chinese stem MUST be an authentic spoken dialogue between two speakers with exactly 2 speech turns on separate lines:
  "男：..."
  "女：..."
  Length: 25 to 50 Chinese characters. Only use "男：" and "女：" as speaker labels!
- ABSOLUTELY NEVER include blank placeholders ("____") in the stem.
- SVG SCENE MAPPING MANDATE:
  "options_images" MUST be selected strictly from these 22 supported SVG scene keys, and "options" MUST accurately describe the corresponding scene:
  * "reading" -> 看书 / 图书馆
  * "tea" -> 喝茶 / 热茶
  * "coffee" -> 喝咖啡 / 咖啡馆
  * "apple" -> 买苹果 / 吃苹果
  * "banana" -> 香蕉
  * "watermelon" -> 西瓜
  * "taxi" -> 坐出租车 / 打车
  * "airplane" -> 坐飞机 / 飞机场
  * "train" -> 坐火车 / 火车站
  * "hospital" -> 去医院 / 看医生
  * "movie" -> 看电影 / 电影院
  * "swimming" -> 游泳 / 游泳池
  * "soccer" -> 踢足球 / 足球比赛
  * "running" -> 跑步 / 晨跑
  * "sleeping" -> 睡觉 / 休息
  * "singing" -> 唱歌 / 唱歌比赛
  * "dance" -> 跳舞
  * "cat" -> 小猫 / 喂猫
  * "rice" -> 吃米饭 / 做饭
  * "sunny" -> 天气晴朗 / 出太阳
  * "rain" -> 下雨 / 带雨伞
  * "wind" -> 刮大风
  NEVER invent unsupported scenes like "mountain", "shoes", "skirt", "pencil", "hat", "delicious", "big", "quiet".
- ZERO STEM LEAKAGE (CRITICAL ANTI-CHEAT MANDATE):
  * The spoken dialogue MUST NOT speak the exact words of the correct option!
  * FORBIDDEN: Dialogue says "你在看书吗？我在看书。" with option "看书". That completely leaks the answer!
  * FORBIDDEN: Dialogue says "我想去爬山。" with option "去爬山".
  * CORRECT: Describe the situation, actions, feelings, or items contextually without giving away the option label:
    - Picture "reading": "男：这本新小说真有意思，你看了多少？\n女：我已经看到最后一页了，打算今天看完。"
    - Picture "tea": "男：外面天气真冷，快进屋暖和暖和。\n女：谢谢，请给我倒一杯热的吧。"
    - Picture "movie": "男：今晚有新片上映，两张票我已经买好了。\n女：太好了，下班后我们在影院门口见。"
    - Picture "swimming": "男：夏天太热了，今天下午有什么安排吗？\n女：我们一起去水上乐园运动运动吧。"
- Exactly one option matches the dialogue; the other 5 options describe completely different activities.`;

    case 'read_sentence_picture_match_6opt':
    case 'read_sentence_picture_match_split':
      return `QUESTION TYPE: Reading sentence matched to picture (HSK 1/2/3 format - 6 Options: A–F)
- SENTENCE MANDATE: The Chinese stem MUST be a single natural sentence (10-25 characters) describing a scene or action.
- ABSOLUTELY NEVER include blank placeholders ("____") in the stem. This is NOT a fill-in-the-blank question!
- SVG SCENE MAPPING MANDATE:
  "options_images" MUST be selected strictly from these 22 supported SVG scene keys, and "options" MUST accurately describe the corresponding scene:
  * "reading" -> 看书 / 图书馆
  * "tea" -> 喝茶 / 热茶
  * "coffee" -> 喝咖啡 / 咖啡馆
  * "apple" -> 买苹果 / 吃苹果
  * "banana" -> 香蕉
  * "watermelon" -> 西瓜
  * "taxi" -> 坐出租车 / 打车
  * "airplane" -> 坐飞机 / 飞机场
  * "train" -> 坐火车 / 火车站
  * "hospital" -> 去医院 / 看医生
  * "movie" -> 看电影 / 电影院
  * "swimming" -> 游泳 / 游泳池
  * "soccer" -> 踢足球 / 足球比赛
  * "running" -> 跑步 / 晨跑
  * "sleeping" -> 睡觉 / 休息
  * "singing" -> 唱歌 / 唱歌比赛
  * "dance" -> 跳舞
  * "cat" -> 小猫 / 喂猫
  * "rice" -> 吃米饭 / 做饭
  * "sunny" -> 天气晴朗 / 出太阳
  * "rain" -> 下雨 / 带雨伞
  * "wind" -> 刮大风
  NEVER invent unsupported scenes like "wonton", "mantou", "baozi", "mountain", "shoes".
- ZERO STEM LEAKAGE:
  * Do NOT repeat the exact option text verbatim in the stem.
  * E.g. For "reading", stem can be: "他在安静的房间里认真地读小说。" (Option: 看书, Image: reading).
- Exactly one option matches the sentence; the other 5 options describe completely different scenes.`;

    case 'listen_dialogue_qa_3opt':
      return `QUESTION TYPE: Elementary Listening Dialogue Q&A (3 Options: A, B, C)
- The Chinese stem consists of 2 short conversational turns with speaker labels (e.g. 男：... \n女：...) followed by a question ("问：...").
- ABSOLUTELY NEVER include blank placeholders ("____") in the stem. This is a listening dialogue test, NOT a fill-in-the-blank test!
- Provide EXACTLY 3 concise Chinese answer choices (A, B, C); exactly one is supported by the dialogue.
- Distractors must be plausible alternatives within the target HSK syllabus.`;

    case 'read_comprehension_short_and_medium_3opt':
      return `QUESTION TYPE: Short & Medium Reading Comprehension with Question (3 Options: A, B, C)
- STRUCTURE CONTRACT:
  * "stem" MUST consist of a passage of 30 to 60 Chinese characters followed by "★" and a clear question.
    Canonical format: "<Passage>。★ <Question>？"
- ABSOLUTELY NEVER include blank placeholders ("____") in the stem (this is reading comprehension, not fill-in-the-blank).
- Provide EXACTLY 3 concise Chinese choices (A, B, C). Exactly one choice is undeniably supported by the text.
- "completed_stem" MUST be identical to "stem".`;

    case 'write_component_assembly_6opt':
      return `QUESTION TYPE: Character Component Assembly (HSK 2 Writing Part 1 - 6 Options: A–F)
- The Chinese stem presents a character assembly task with radicals/components (e.g. "组字题：将给出的部件组合成正确的汉字").
- Provide EXACTLY 6 distinct Chinese character options (A, B, C, D, E, F) that could be formed or selected.
- Exactly one option correctly combines the target components.`;

    case 'read_fill_blank_word_bank_6opt':
    case 'read_fill_blank_word_bank_split':
      return `QUESTION TYPE: Reading Fill-in-the-Blank Word Bank (6 Options: A–F)
- The Chinese stem is a complete sentence with exactly ONE blank "____".
- Provide EXACTLY 6 distinct word options (A, B, C, D, E, F) of appropriate HSK Level.
- Exactly one option fits naturally into the blank in grammar and context.`;

    case 'read_sentence_matching_split':
    case 'read_dialogue_matching_split':
    case 'read_dialogue_matching_6opt':
      return `QUESTION TYPE: Reading Sentence / Dialogue Matching (6 Options: A–F)
- The Chinese stem is a spoken statement or question requiring a corresponding match.
- Provide EXACTLY 6 distinct Chinese response options (A, B, C, D, E, F).
- Exactly one option forms the natural, logical pairing.`;

    case 'read_comprehension_short_3opt':
      return `QUESTION TYPE: Short Reading Comprehension with Question (HSK 1 Official Part 4 Format)
- STRUCTURE CONTRACT:
  * "stem" MUST consist of two distinct parts in a single string:
    1. A short, complete statement or 1-2 sentence passage in Chinese.
    2. Followed by a space, the special question marker symbol "★", and a concise question directly testing the statement.
    Canonical format: "<Statement>。★ <Question>？"
  * STRICT NEGATIVE CONSTRAINT (CRITICAL AUDIT):
    - ABSOLUTELY NEVER include "____", "___", or any blank placeholder in "stem"!
    - This is a reading comprehension task, NOT a fill-in-the-blank task. Any placeholder will cause instant rejection by automated quality gates.
  * "options" MUST contain EXACTLY 3 concise Chinese choices.
  * Exactly ONE choice is undeniably supported by the statement. The other 2 choices are plausible distractors contradicted or unsupported by the text.
  * The statement MUST contain complete factual evidence to answer the question without external knowledge or speculation.
  * "completed_stem" MUST be exactly identical to "stem" (since there is no blank to fill).
  * Tone-marked Pinyin must map 1-to-1 to the Chinese characters in "stem".
- VALID EXAMPLE (GOOD):
  Stem: "我上午去学校看书。★ 我什么时候去学校？"
  Options: ["上午", "下午", "晚上"]
  Answer Index: 0 ("上午")
  Completed Stem: "我上午去学校看书。★ 我什么时候去学校？"
- INVALID EXAMPLES (BAD - INSTANT QUALITY GATE REJECTION):
  * BAD 1 (Contains blank placeholder): "我现在想打电话给朋友，然后晚上八点____。" -> REJECTED: Contains "____".
  * BAD 2 (Missing ★ question): "爸爸在医院工作，他是医生。" -> REJECTED: Missing question marked with "★".
  * BAD 3 (Contradictory / Ungrounded logic): "爸爸在客厅里打电话，他的手机响了。" -> REJECTED: Contradictory action / ungrounded details.`;

    case 'read_fill_blank_4opt':
      return `QUESTION TYPE: Fill in the Blank with 4 Options (HSK Reading Part 3 Format)
- STRUCTURE CONTRACT:
  * "stem" MUST contain EXACTLY ONE blank placeholder written as "____" (four underscore characters) where the target word fits naturally.
  * "options" MUST contain EXACTLY 4 distinct choices of the EXACT SAME grammatical part of speech (POS).
    Example: 4 nouns, OR 4 verbs, OR 4 measure words, OR 4 adjectives.
    If the target is a noun (e.g. 医院), all 3 distractors MUST be nouns (e.g. 学校, 商店, 书店).
    Do NOT mix verbs, nouns, and adjectives together.
  * Exactly ONE choice is undeniably correct in grammar, semantics, and authentic Chinese collocations.
  * The backend generates "canonical_completed_stem" by literal string substitution of "____" with "options[answer_idx]".
- LINGUISTIC & COLLOCATION DISCIPLINE (STRICT AUDIT):
  * AUTHENTIC CHINESE COLLOCATIONS ONLY:
    - Measure Word + Noun pairings:
      * "桌子上有一____书。" -> Correct: "本"; Distractors: "个", "只", "块" (all measure words, only "本" pairs with "书").
      * "我喝了一杯____。" -> Correct: "水" (beverage); Distractors: "饭", "菜", "苹果" (solid foods cannot follow "喝了一杯").
  * STRICT GRAMMAR INTEGRITY (NO NOUN-AS-VERB HALLUCINATIONS):
    - NEVER use a noun as a transitive verb!
      * BAD: "想手机给妈妈" (using noun "手机" as a verb is fatal ungrammatical Chinese).
      * GOOD: "想打电话给妈妈" (verb phrase "打电话").
  * HSK 1 VOCABULARY BOUNDARY DISCIPLINE:
    - Places: Use "饭店", "商店", "超市", "学校", "家" (NEVER "餐厅" which is HSK 4).
    - Foods: Use "米饭", "包子", "饺子", "菜", "水果", "苹果" (NEVER "肉" which is HSK 2).
    - Destinations: Use "学校", "商店", "医院", "北京", "家" (NEVER "机场" which is HSK 2).
- VALID EXAMPLE (GOOD):
  Stem: "中午我们去饭店吃____。"
  Options: ["米饭", "水", "茶", "杯子"]
  Answer Index: 0 ("米饭" - food paired with verb "吃")
- SINGLE VALID ANSWER & CONTEXTUAL DISAMBIGUATION MANDATE (CRITICAL):
  * Exactly ONE choice must be defensible in the sentence. The other 3 choices MUST be impossible (either grammatically ungrammatical, collocationally incompatible, or factually excluded by clues in the stem).
  * NEVER create underspecified sentences where multiple options are equally valid Chinese sentences!
    - FATAL AMBIGUITY EXAMPLE: "我想在商店买____本书。" with options ["二", "一", "两", "三"].
      In this sentence, "买一本书" and "买三本书" are just as correct and natural as "买两本书". The question has multiple valid answers and will be REJECTED by Gate 6!
    - GOOD UNAMBIGUOUS FIX: Provide numerical/factual context! E.g. "我和弟弟想买____本书，一人一本。" -> Only "两" fits! Distractors: ["二", "几", "半"]. Or "桌子上有2本书，小明想买____本。"
    - FATAL AMBIGUITY EXAMPLE: "他在家看____。" with options ["书", "电视", "电影", "苹果"].
      "看书" and "看电视" are both valid. The question is underspecified!
    - GOOD UNAMBIGUOUS FIX: "他在图书馆借了一本____。" -> Only "书" fits! Distractors: ["电视", "电影", "苹果"].
- INVALID EXAMPLES (BAD - INSTANT QUALITY GATE REJECTION):
  * BAD 1 (No blank or multiple blanks): "我喜欢喝茶。" or "我____去____。" -> REJECTED.
  * BAD 2 (Impossible semantic collocation): "这杯茶很好吃。" -> REJECTED: "茶" cannot pair with "好吃".
  * BAD 3 (Noun-as-verb hallucination): "我坐出租车，想手机给妈妈。" -> REJECTED.`;

    case 'read_comprehension_4opt':
    case 'read_comprehension_passages_4opt':
    case 'read_comprehension_long_articles_4opt':
      if (level >= 6) {
        return `QUESTION TYPE: Advanced Reading Comprehension (Đọc hiểu đoạn văn HSK 6 - Chuẩn đoạn văn 150-200 chữ & chiều sâu học thuật)
- The Chinese stem MUST be a rich, sophisticated passage of 150 to 200 Chinese characters on economics, sociology, literature, or philosophy, followed by a specific question (e.g. "根据这段话，下列哪项正确？" or "作者主要想表达什么观点？").
- Traps: 偷换概念 (Subject/concept swap), 以偏概全 (Overgeneralization from isolated examples), 无中生有 (Unsubstantiated deduction), 逻辑倒置 (Reversed premise and conclusion). Correct option synthesizes deep meaning using HSK 6 synonymous phrasing.`;
      }
      if (level === 5) {
        return `QUESTION TYPE: Advanced Reading Comprehension (Đọc hiểu đoạn văn chọn đáp án HSK 5 - Chuẩn đề thi thật CTI/CLEC 120-180 chữ)
- STRUCTURE CONTRACT & LENGTH:
  * The Chinese stem MUST consist of a rich, cohesive passage of 120 to 180 Chinese characters followed by a specific question (e.g. "根据这段话，下列哪项正确？" or "关于……，可以知道什么？" or "作者最赞同的观点是：").
  * DO NOT write short 1-2 sentence paragraphs! Incorporate advanced discourse connectives (e.g. 与其...不如..., 尽管...然而..., 在很大程度上取决于, 从长远来看, 往往容易被忽视).
- AUTHENTIC DISTRACTOR TRAPS & RIGOROUS CALIBRATION (Bẫy tư duy đọc hiểu cao cấp):
  * DISTRACTOR 1 (偷换概念 - Concept Swap): Attributes an action, condition, or consequence of Subject A to Subject B mentioned in the text.
  * DISTRACTOR 2 (绝对化 / 夸大其词 - Overgeneralization): Converts a nuanced tendency or possibility stated in the text (often qualified by 往往, 可能, 在一定程度上) into an absolute assertion (完全, 必定, 所有人, 只要...就...).
  * DISTRACTOR 3 (因果倒置 / 无中生有 - Causal Inversion or Unsupported Claim): Reverses the causal relationship in the passage, or introduces a plausible common-sense claim that is never stated or implied by the passage.
  * CORRECT OPTION: Must be an undeniable fact supported by the text, expressed through authentic synonymous paraphrasing (同义替换) rather than crude verbatim sentence copying.
- The 4 options MUST be parallel Chinese clauses of balanced length and syntactic structure.`;
      }
      if (level === 4) {
        return `QUESTION TYPE: Intermediate Reading Comprehension (Đọc hiểu đoạn văn HSK 4 - Đoạn văn 80-120 chữ)
- The Chinese stem consists of a cohesive paragraph of 80 to 120 Chinese characters discussing career insights, lifestyle habits, or cultural observations, followed by a question (e.g. "根据这段话，下列哪项正确？").
- Distractors must feature plausible near-synonyms or common misconceptions. Avoid trivial word-matching; the correct option requires understanding cause and effect.`;
      }
      if (level === 3) {
        return `QUESTION TYPE: Reading Comprehension (Đọc hiểu HSK 3 - Đoạn văn 50-80 chữ)
- The Chinese stem consists of a passage of 50 to 80 Chinese characters (2 to 3 sentences) followed by a question ("根据这段话，可以知道什么？").
- Vocabulary strictly within HSK 1-3. Only 1 option is supported by text; 3 distractors are contradicted or unmentioned.`;
      }
      return `QUESTION TYPE: Basic Reading Comprehension (Đọc hiểu HSK 1-2 - Đoạn văn 25-50 chữ)
- The Chinese stem consists of 1 to 2 simple sentences followed by a question.
- All vocabulary strictly within HSK 1 or HSK 2 syllabus.`;

    case 'listen_picture_match_4opt':
    case 'listen_picture_match_3opt':
      return `QUESTION TYPE: Listening & Picture Matching (Nghe / nhìn tranh chọn đáp án)
- The stem contains only a short spoken Chinese phrase or sentence; it must not expose the answer as text.
- "options" must have exactly ${partType.endsWith('_3opt') ? 3 : 4} unique Chinese review labels.
- "options_images" must contain exactly ${partType.endsWith('_3opt') ? 3 : 4} distinct SVG scene keys, one per choice, selected from the 27 allowed keys below.
- Do not use one shared "illustration_theme" for all answer choices.
- Allowed SVG scene keys:
  [${VALID_ILLUSTRATION_THEMES.join(', ')}]
- Exactly one option image must match the audio; distractor images must be distinct and clearly incompatible.`;

    case 'write_sentence_reorder_4opt':
      if (level >= 5) {
        return `QUESTION TYPE: Advanced HSK 5 Multi-Tier Sentence Reordering (连词成句 - Sắp xếp câu phức đa tầng HSK 5)
- STEM CONTRACT:
  * The Chinese stem presents 4 to 5 scrambled words or functional clauses separated by slashes (" / ").
  * Format: "把下列词语排列成一句通顺的话：[mảnh ghép 1] / [mảnh ghép 2] / [mảnh ghép 3] / [mảnh ghép 4] / [mảnh ghép 5]"
  * Grammar & Complexity: MUST feature authentic HSK 5 multi-tier grammatical structures:
    - Concessive/Hypothetical conjunctions: 哪怕...也..., 与其...不如..., 既然...就..., 除非...才...
    - Rhetorical & Emphasis constructions: 难道...吗, 不得不..., 甚至/索性/究竟
    - Extended attributive/complement phrases or prepositional frames: 在...看来, 为...所..., 围绕...展开
- 4 FULL SENTENCE CANDIDATE OPTIONS CONTRACT:
  * Options A, B, C, D MUST be 4 complete candidate sentences assembled from the stem parts, ending with punctuation ("。" or "？").
  * Exactly ONE option is the standard, natural, grammatically correct sentence adhering to standard Chinese syntax.
  * The other 3 options MUST be realistic distractors with typical learner errors (e.g., misplacing adverbials/time words, inversion of 把/被 objects, or broken complement order).
- EXPLANATION CONTRACT:
  * "explanation_vi" MUST break down the full grammar pattern (e.g. S + Liên từ + Trạng ngữ + Động từ + Bổ ngữ + O), translate the correct sentence into Vietnamese, and explain why each distractor is ungrammatical.`;
      }
      return `QUESTION TYPE: Sentence Reordering (Sắp xếp câu đúng trật tự ngữ pháp)
- The Chinese stem presents a scrambled sentence puzzle (e.g. "把下列词语排列成一句通顺的话：词语1 / 词语2 / 词语3 / 词语4").
- The 4 options are 4 candidate sentences or order sequences.
- Only 1 order satisfies standard Chinese SOV/SVO and adverbial placement rules.`;

    case 'listen_dialogue_qa_4opt':
      if (level >= 6) {
        return `QUESTION TYPE: Advanced Listening Dialogue Q&A (Nghe đối thoại HSK 6 - Chuẩn đối thoại dài 4-5 lượt & chiều sâu tư duy)
- CRITICAL FORMAT & NEGATIVE CONSTRAINTS:
  * ABSOLUTELY NEVER include blank placeholders ("____") or cloze brackets. This is a LISTENING DIALOGUE test!
  * The Chinese stem MUST be an authentic dialogue with 4 to 5 speech turns (140 to 190 Chinese characters) followed by a question ("问：...").
  * Tone & Style: Formal academic, socio-economic, cultural, or philosophical debates featuring nuanced chengyu (成语) and sophisticated rhetoric.
  * Complex cognitive traps: Test implicit thesis, ironic attitude, trade-off compromise, and logical deduction. Correct option uses synonymous paraphrasing (同义替换); distractors exploit concept-swap or partial truth.`;
      }
      if (level === 5) {
        return `QUESTION TYPE: Advanced Listening Dialogue Q&A (Nghe đối thoại chọn đáp án đúng HSK 5 - Chuẩn đề thi thật dài & bẫy lươn lẹo đa tầng)
- MANDATORY MULTI-TURN DIALOGUE STRUCTURE (BẮT BUỘC ĐỐI THOẠI 3-4 LƯỢT THOẠI ĐẦY ĐỦ):
  * The Chinese stem MUST be formatted as an authentic multi-turn conversational dialogue between two speakers with AT LEAST 3 to 4 speech turns, followed by a specific spoken question ("问：...").
  * Canonical format:
    "男：...\\n女：...\\n男：...\\n女：...\\n问：..."
  * TOTAL DIALOGUE LENGTH: The dialogue MUST be between 100 and 160 Chinese characters (excluding the question). ABSOLUTELY DO NOT write short 1-2 sentence dialogues!
- REALISTIC COMPLEX THEMES & SCENARIOS:
  * Situations must involve workplace dilemmas, corporate budget negotiations, contract adjustments, career choices, market analysis, apartment leasing disputes, or scientific/management decision trade-offs.
- MULTI-STAGE COGNITIVE TRAPS & TWISTS (BẪY LƯƠN LẸO & CHUYỂN BIẾN PHỨC TẠP):
  * TURN 1 (Speaker A): Proposes an initial plan, numbers, or perspective (Plan A) e.g., đề xuất tăng ngân sách hoặc dời lịch hoặc giảm giá.
  * TURN 2 (Speaker B): Objects or raises an important counter-condition, rejecting Plan A and proposing Plan B (e.g., chỉ ra nguy cơ chi phí, đề xuất giải pháp thay thế).
  * TURN 3 (Speaker A): Hesitates, introduces another variable/constraint, or questions feasibility (e.g., nêu ý kiến của khách hàng hoặc hạn chót dự án).
  * TURN 4 (Speaker B): Makes the FINAL subtle compromise, pragmatic decision, or reveals real attitude using natural connective markers or rhetorical structures (e.g., 与其...不如..., 既然...那就..., 看来只能..., 哪能...呢).
  * QUESTION ("问：..."): Asks about the FINAL decision, speaker's true attitude, or real reason for the decision (e.g., "关于这个项目，他们最终决定怎么做？", "女的对男的的提议持什么态度？", "他们最终达成了什么共识？").
- STRICT ANTI-VERBATIM & DISTRACTOR CALIBRATION:
  * NO VERBATIM KEYWORD MATCH (Tuyệt đối không trùng khít từ khóa): The correct answer MUST NOT simply repeat the exact words heard in the audio. It must synthesize overall communicative intent, speaker attitude, or final consensus through authentic synonymous paraphrasing (同义替换) at HSK 5 level.
  * MANDATORY TEMPTING DISTRACTORS:
    - Distractor 1: The abandoned initial proposal (Plan A) from Turn 1 (bẫy người nghe vội vàng).
    - Distractor 2: The rejected alternative or literal trap mentioned in Turn 2 (được nhắc tới nhưng bị phủ định).
    - Distractor 3: An inverted cause-effect or misattributed opinion (bẫy tráo đổi chủ ngữ).
  * ALL 4 OPTIONS must be parallel, sophisticated Chinese phrases strictly within the target HSK syllabus.`;
      }
      if (level === 4) {
        return `QUESTION TYPE: Intermediate Listening Dialogue Q&A (Nghe đối thoại HSK 4 - Đối thoại 3 lượt 80-120 chữ)
- DIALOGUE STRUCTURE & LENGTH:
  * The Chinese stem MUST consist of 3 authentic speech turns (e.g. "男：...\\n女：...\\n男：...\\n问：...") or 2 rich turns with 80 to 120 Chinese characters, followed by a specific question ("问：...").
  * Topics: Workplace discussions, job interviews, travel changes, customer inquiries, interpersonal dilemmas.
  * Structure: Include natural transitions and conversational twists (e.g. 本来打算...后来..., 可是, 另外, 不仅...而且...).
  * Distractor rules: At least 1 distractor must feature the abandoned intention (Plan A) heard in the opening line. Correct option reflects the final updated status.`;
      }
      if (level === 3) {
        return `QUESTION TYPE: Listening Dialogue Q&A (Nghe đối thoại HSK 3 - 2-3 lượt thoại 50-80 chữ)
- DIALOGUE STRUCTURE & LENGTH:
  * The Chinese stem consists of 2 to 3 speech turns (50 to 80 Chinese characters) followed by a question ("问：...").
  * Topics: Practical daily communication (shopping, booking, making appointments, weather, study routines).
  * Distractor rules: Include simple conversational reversals (本来...但是..., 改变决定). Avoid verbatim keyword traps.`;
      }
      if (level === 2) {
        return `QUESTION TYPE: Elementary Listening Dialogue Q&A (Nghe đối thoại HSK 2 - 2 lượt thoại 25-45 chữ)
- The Chinese stem consists of 2 short conversational turns (25 to 45 Chinese characters) followed by a question ("问：...").
- Simple, authentic social interactions (asking directions, simple shopping, meeting friends, illness/hospital).
- All vocabulary strictly within HSK 1-2. Distractors must be plausible alternatives of the same category.`;
      }
      return `QUESTION TYPE: Basic Listening Dialogue Q&A (Nghe đối thoại HSK 1 - 2 lượt thoại ngắn 15-30 chữ)
- The Chinese stem consists of 2 very concise turns (15 to 30 Chinese characters) followed by a question ("问：...").
- Vocabulary strictly limited to HSK 1 verified 300 words. Straightforward and unambiguous.`;

    case 'listen_talks_qa_4opt':
      if (level >= 6) {
        return `QUESTION TYPE: Advanced Monologue / Speech Q&A (Nghe bài nói HSK 6 - Đoạn văn dài 160-220 chữ)
- CRITICAL FORMAT & NEGATIVE CONSTRAINTS:
  * This is a LISTENING COMPREHENSION task. The stem MUST NEVER contain blank underlines or fill-in-the-blank placeholders ('____', '（ ）', '【 】'). ABSOLUTELY NEVER generate a fill-in-the-blank question!
  * NEVER generate a short 1-2 sentence prompt. Stem MUST be at least 150 to 220 Chinese characters.
  * Question prompt: Stem MUST end with a spoken question prompt ("问：这段话主要想告诉我们什么？", "问：根据这段话，这项研究所揭示的核心规律是什么？", etc.).
- LEVEL & VOCABULARY STANDARD:
  * Must utilize authentic HSK 5-6 advanced vocabulary, idioms (成语), and complex discourse syntax.
  * Topics: Epistemology, psychology, sociology, art appreciation, ecological balance, or historical perspectives.
- DISTRACTORS:
  * Subtle logical distortions (偷换概念, 以偏概全, 无中生有, 夸大影响). All 4 options must be formal, grammatically parallel statements.`;
      }
      if (level === 5) {
        return `QUESTION TYPE: Advanced Listening Monologue / Speech Q&A (Nghe bài nói / diễn thuyết HSK 5 - Đoạn văn dài 130-180 chữ)
- CRITICAL FORMAT & NEGATIVE CONSTRAINTS:
  * This is a LISTENING COMPREHENSION task. The stem MUST NEVER contain blank underlines or fill-in-the-blank placeholders ('____', '（ ）', '【 】'). ABSOLUTELY NEVER generate a fill-in-the-blank question!
  * Stem MUST be a continuous passage of spoken discourse of 130 to 180 Chinese characters followed by a spoken question ("问：...").
- AUTHENTIC DISTRACTOR & INFERENCE DESIGN:
  * The question must test core comprehension, implicit attitude, or reason rather than superficial rote memorization of isolated numbers or words (e.g., "问：这段话主要想告诉我们什么？", "问：作者认为成功的关键是什么？", "问：根据这段话，这项研究表明了什么？").
  * Distractor options must feature words mentioned in the talk that were negated, secondary, or superseded, requiring real listening comprehension.
- Exactly 1 option is undeniably correct.`;
      }
      if (level === 4) {
        return `QUESTION TYPE: Listening Monologue / Speech Q&A (Nghe bài nói HSK 4 - 80-120 chữ)
- Continuous spoken passage of 80 to 120 Chinese characters on health habits, workplace tips, or cultural traditions, followed by a question ("问：...").
- Question tests overall message or specific reason. Distractors are contextually plausible within HSK 4.`;
      }
      return `QUESTION TYPE: Listening Monologue / Speech Q&A (Nghe đoạn văn ngắn 50-80 chữ)
- Short spoken story or personal experience followed by a clear question ("问：...").`;

    case 'read_find_faulty_sentence_4opt':
      return `QUESTION TYPE: Find Faulty Sentence (Bệnh cú — Tìm câu có lỗi ngữ pháp)
- The Chinese stem asks the examinee to identify the grammatically faulty sentence (e.g. "请选出下列4个句子中存在语病的一项。").
- The 4 options are 4 complete Chinese sentences (labeled A, B, C, D or plain sentences).
- Exactly ONE sentence contains a classic Chinese grammatical error:
  * 搭配不当 (Improper collocation)
  * 成分残缺 (Missing subject or object, e.g., due to "通过...使...")
  * 语序混乱 (Faulty word order)
  * 逻辑矛盾 (Contradictory logic)
- The other 3 sentences MUST be completely natural and grammatically sound.`;

    case 'read_cloze_passages_4opt':
    case 'read_cloze_passage_sentence_insertion':
      return `QUESTION TYPE: Cloze Passage (Điền từ vào đoạn văn dài)
- The Chinese stem is a cohesive paragraph containing multiple blanks marked with "____".
- The 4 options provide groups of 3-4 target words/chengyu corresponding to each blank (e.g., "A. 搭配 别有洞天 凝结 企及").
- Only 1 group forms idiomatic, natural, and grammatically perfect collocations for all blanks in the passage.`;

    case 'read_paragraph_sentence_ordering':
      return `QUESTION TYPE: Paragraph Sentence Ordering (Sắp xếp thứ tự 5 câu thành đoạn văn - 5 Options: A–E)
- The Chinese stem presents a paragraph ordering task (e.g. "把下列5个句子排列成连贯的一段话：").
- Provide EXACTLY 5 distinct Chinese sentences labeled A, B, C, D, E in scrambled, non-sequential order.
- The correct order must form a logically cohesive, authentic Chinese paragraph (covering time sequence, cause-and-effect, or discourse progression).
- Provide the correct permutation sequence (e.g., "B-A-E-C-D") and thorough rationale in "answer_rationale_vi".
- "completed_stem" MUST be identical to "stem".`;

    case 'write_short_essay_80chars':
      return `QUESTION TYPE: HSK 5 Short Essay with 5 Given Words (Viết đoạn văn ngắn 80 chữ kết hợp 5 từ - HSK 5 Writing Part 2)
- STEM CONTRACT:
  * The Chinese stem MUST provide exactly 5 target HSK 5 words in brackets, followed by the essay prompt:
    Format: "请结合以下5个词语写一篇80字左右的短文：[词语1, 词语2, 词语3, 词语4, 词语5]。"
  * The 5 words MUST be strictly from the HSK 5 syllabus, including at least 1-2 abstract words, verbs, or common idioms (e.g., [缓解, 压力, 适应, 措施, 积极] or [沟通, 信任, 合作, 克服, 难关]).
- ZERO OPTIONS CONTRACT:
  * Open-ended writing tasks do NOT use multiple-choice options: "options" MUST be strictly an empty array [].
  * "answer_idx" MUST be set to 0.
- EXPLANATION CONTRACT (MODEL ESSAY & SCORING RUBRIC):
  * "answer_rationale_vi" MUST provide an exemplary model response (~80 Chinese characters) seamlessly integrating all 5 target words in natural, cohesive Chinese.
  * "explanation_summary_vi" MUST explain the thematic coherence, grammatical structure, and scoring criteria in Vietnamese.`;

    case 'write_sentence_from_picture_word':
      return `QUESTION TYPE: HSK Writing from Picture & Keyword (Nhìn tranh và từ khóa viết câu/đoạn văn)
- The Chinese stem provides the clear scenario/picture prompt and the target keyword.
- Open-ended writing tasks do NOT use multiple-choice options: "options" MUST be an empty array [].
- "answer_idx" should be set to 0.
- Explanation must specify scoring rubric, model response sentence/short essay (~80 characters for HSK 5), and key grammatical/lexical requirements in Vietnamese.`;

    case 'write_summary_shortening_400chars':
    case 'write_topic_essay_300chars':
    case 'write_story_from_4pictures_100chars':
    case 'write_topic_essay_200chars':
    case 'write_tianzige_from_pinyin':
      return `QUESTION TYPE: Open-Ended Writing Task (Bài thi viết tự luận / hoàn thành chữ / câu)
- The Chinese stem provides the clear prompt, stimulus text, character requirements, or picture instruction.
- Open-ended writing tasks do NOT use multiple-choice options: "options" MUST be an empty array [].
- "answer_idx" should be set to 0.
- Explanation must specify scoring rubric, model response/character, and key grammatical/lexical requirements in Vietnamese.`;

    default:
      return `QUESTION TYPE: Standard HSK Multiple Choice
- The Chinese stem is a complete question or sentence with a blank "____".
- Provide exactly 4 distinct options with 1 grounded correct answer and 3 same-POS distractors.`;
  }
}

/**
 * Checks whether a given part_type represents an open-ended writing task expecting 0 options.
 */
export function isOpenEndedWritingTask(partType?: string): boolean {
  if (!partType) return false;
  if (/_4opt/i.test(partType) || /_6opt/i.test(partType) || /_3opt/i.test(partType) || /_5opt/i.test(partType)) {
    return false;
  }
  return /^write_/i.test(partType) || /_(?:0opt|0_opt)/i.test(partType);
}

export const HSK_GRAMMAR_LEVEL_GUIDELINES: Record<number, string> = {
  1: 'Basic SVO word order, degree adverb 很, negative adverb 不, structural particle 的, measure words (个, 本, 只), simple interrogatives (吗, 呢, 什么, 谁).',
  2: 'State/degree complement 得 (V+得+Adj), causal conjunction 因为...所以..., concessive 虽然...但是..., prepositions 给, 向, comparison 比, basic progressive 在/正在.',
  3: 'Disposal 把-construction (处理/支配: S + 把 + O + V + 其他成分, verb MUST NOT be bare), directional complements 来/去, result complements (完, 到, 见, 好, 懂), conditional conjunction 如果...就..., comparative 没有/不如.',
  4: 'Passive 被-construction (S + 被 + Agent + V + 其他成分), progressive conjunction 不仅...而且..., unconditional 无论...都..., potential complements (V+得/不+C, e.g., 看得懂/做不完), aspect markers 着/过/了.',
  5: 'Nuanced chengyu (成语), complex conjunctions (哪怕...也, 既然...就, 与其...不如), abstract near-synonym discrimination (e.g., 深刻 vs 深入, 把握 vs 掌握, 从而 vs 进而), inverted rhetorical sentences.',
  6: 'Faulty sentence patterns (语病辨析: 搭配不当, 成分残缺, 语序混乱, 句式杂糅, 逻辑矛盾), subtle academic & discourse connectives, sophisticated stylistic register.',
};

export function getDifficultyTierInstructions(tier?: DifficultyTier): string {
  switch (tier) {
    case 'tier1_difficult':
      return `DIFFICULTY TIER: Tier 1 (Difficult - Contextual Collocation)
- Options MUST belong to the same Part of Speech, but only the correct answer forms an authentic, native collocation with the specific surrounding context (verb-object or modifier-noun).
- Test sentence comprehension rather than surface word recognition.`;
    case 'tier2_very_difficult':
      return `DIFFICULTY TIER: Tier 2 (Very Difficult - Near-Synonym & Structural Discrimination)
- At least 2 distractors MUST be authentic near-synonyms (近义词) that Vietnamese learners frequently confuse (e.g., 了解 vs 理解, 逐渐 vs 逐步, 适合 vs 合适, 经历 vs 经验, 往往 vs 常常).
- The sentence stem MUST provide a mandatory disambiguating context token (e.g., specific object register, syntactic transitivity, or aspect constraint) making ONLY the correct answer valid.`;
    case 'tier3_challenge':
      return `DIFFICULTY TIER: Tier 3 (Challenge - Deep Grammar & Multi-Clause Logic)
- Focus on multi-clause sentences testing complex syntactic constraints: 把/被 constructions, directional/result complements, potential complements, or paired connectives (不仅...而且, 无论...都, 哪怕...也).
- Distractors must represent typical learner errors (faulty object placement, forbidden bare verbs in 把-sentences, incorrect complement particles).`;
    default:
      return '';
  }
}

export function getTrapTypeInstructions(trapType?: TrapType | string): string {
  switch (trapType) {
    case 'near_synonym':
    case 'near_synonym_collocation':
      return `TRAP STRATEGY: Near-Synonym Discrimination (近义词辨析)
- Distractors must be close synonyms sharing core definitions but differing in semantic scope, transitivity, formality, or habitual collocation partners.
- Explanation MUST contrast each distractor's usage against the correct answer in Vietnamese.`;
    case 'collocation':
      return `TRAP STRATEGY: Collocation Mismatch (搭配不当)
- Distractors are semantically plausible in isolation, but violate natural native Chinese collocations with the adjacent head word in the stem.`;
    case 'grammar_rule':
    case 'ba_bei_structure':
    case 'complement_boundary':
      return `TRAP STRATEGY: Grammatical Structural Constraint (语法规则约束)
- Test structural syntax rules (e.g., 把-sentence requires result/disposal; 被-sentence agent constraints; complement particles 得 vs 的 vs 地; V+完/到/见). Distractors must violate the grammatical rule.`;
    case 'word_order':
    case 'word_order_trap':
      return `TRAP STRATEGY: Word Order Trap (语序陷阱)
- Distractors exploit common word-order errors (e.g., placing time/place adverbials after the verb, incorrect placement of prepositions or negation before 把).`;
    case 'context_scope':
    case 'clause_logic':
      return `TRAP STRATEGY: Clause Logic / Contextual Scope (逻辑关联与语境范围)
- Distractors appear locally plausible within a single clause but contradict the logical relation (causal, concessive, conditional) established across the entire sentence.`;
    case 'anti_verbatim':
      return `TRAP STRATEGY: Anti-Verbatim Matching (Triệt tiêu bẫy trùng khít từ khóa bề mặt kiểu IELTS)
- CRITICAL MANDATE: The correct answer MUST NOT repeat key phrases from the stem word-for-word. It must use authentic synonymous paraphrasing (同义替换), conceptual summary, or pragmatic deduction strictly within the target HSK syllabus.
- TEMPTING DISTRACTORS: At least 1-2 distractors MUST deliberately feature exact words or phrases heard in the text, but placed in a negated, superseded, or misattributed context to catch superficial test-takers.
- RATIONALE REQUIREMENT: Distractor rationales must explicitly contrast the superficial mention against the actual factual context in Vietnamese.`;
    case 'self_correction':
      return `TRAP STRATEGY: Self-Correction & Informational Twists (Bẫy đổi ý phút chót / Chuyển biến quyết định)
- DISCOURSE STRUCTURE: The speaker/passage must introduce an initial plan, thought, or number (e.g. 本来想..., 原定..., 原以为...), followed by a realistic conversational turn where they change their mind, postpone, or correct themselves using natural transition markers (不过, 可是, 其实, 实际上, 改在, 还是...吧).
- MANDATORY TRAP OPTION: The initial abandoned intention/figure MUST be included as one of the 3 distractors!
- The correct option must be the FINAL confirmed decision or real fact.`;
    case 'rhetorical_attitude':
      return `TRAP STRATEGY: Rhetorical Question & Indirect Attitude Implication (Hàm ý câu hỏi tu từ & Thái độ gián tiếp)
- COMMUNICATIVE PRAGMATICS: The speaker expresses their stance (agreement, hesitation, refusal, sarcasm, or helplessness) indirectly via rhetorical questions (难道...吗, ...不是...吗, 怎么会...呢, 谁说不是呢, 你看我像有空的人吗) rather than flat statements.
- The correct answer must decode the implicit communicative meaning. Distractors must misinterpret the literal words.`;
    case 'numerical_twist':
      return `TRAP STRATEGY: Numerical Twist & Calculation (Bẫy tính toán mốc thời gian / số lượng / dời lịch)
- NUMERICAL LOGIC: The text provides initial numbers or scheduled times along with alterations (postponed by X minutes, added/subtracted amount, discount applied).
- Distractors must include the initial unadjusted numbers or intermediate calculation errors.`;
    default:
      return '';
  }
}

/**
 * Verified Level 1 domain clusters extracted directly from data/qbank/syllabus/vocab.jsonl (CLEC HSK 3.0 Band 1).
 * Every headword is strictly verified against allWordLevels === 1.
 */
export const HSK1_VERIFIED_TOPIC_VOCAB: Record<string, { words: string[]; prohibitedLookalikes: string[] }> = {
  food_dining: {
    words: ['吃', '喝', '水', '茶', '米饭', '菜', '苹果', '水果', '饭', '饭店', '杯子', '面包', '包子', '饺子', '鸡蛋', '牛奶', '早饭', '午饭', '晚饭', '做饭', '好吃'],
    prohibitedLookalikes: ['餐厅 (HSK 4 -> use 饭店 or 家)', '肉 (HSK 2 -> use 米饭, 菜, 鸡蛋, 包子)', '咖啡 (HSK 2)', '饭馆 (HSK 2 -> use 饭店)'],
  },
  family_location: {
    words: ['爸爸', '妈妈', '哥哥', '弟弟', '姐姐', '妹妹', '儿子', '女儿', '老师', '学生', '医生', '朋友', '家', '家人', '学校', '医院', '商店', '书店', '超市', '电影院', '饭店', '在', '里', '工作', '看病', '住', '房间'],
    prohibitedLookalikes: ['客厅 (HSK 4 -> use 房间 or 家)', '响 (HSK 4)', '离 (HSK 2)', '远 (HSK 2)', '近 (HSK 2)'],
  },
  transport_travel: {
    words: ['坐', '去', '来', '到', '回', '开', '开车', '车', '出租车', '飞机', '火车', '想', '买'],
    prohibitedLookalikes: ['机场 (HSK 2 -> use 学校, 商店, 北京, 家)', '站 (HSK 2)', '票 (HSK 2)', '船 (HSK 2)'],
  },
  daily_activity_time: {
    words: ['上午', '中午', '下午', '早上', '晚上', '白天', '今天', '明天', '昨天', '今年', '去年', '明年', '现在', '时间', '时候', '点', '分', '分钟', '小时', '年', '月', '日', '号', '星期', '星期天', '看', '书', '读书', '打电话', '听', '说', '说话', '写', '买', '做', '学', '学习', '工作', '睡觉', '起床'],
    prohibitedLookalikes: ['然后 (HSK 3)', '部 (HSK 4)', '游泳 (HSK 2)', '跑步 (HSK 2)', '运动 (HSK 2)'],
  },
  weather_status: {
    words: ['天', '天气', '冷', '热', '下雨', '雪', '雨', '大', '小', '好', '很', '不', '太', '非常', '多', '少', '水'],
    prohibitedLookalikes: ['晴天 (not catalog headword -> use 天气好 or 晴)', '阴天 (HSK 2)', '暖和 (HSK 3)', '刮风 (HSK 3)'],
  },
  school_stationery: {
    words: ['本', '个', '只', '块', '件', '些', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十', '书', '书店', '字', '汉字', '中文', '汉语', '学', '学习', '学校', '老师', '学生', '同学', '桌子', '椅子'],
    prohibitedLookalikes: ['笔 (HSK 2 -> use 书, 汉字, 本)', '张 (HSK 3 -> use 本, 个, 只, 块)', '每 (HSK 2 -> use 都, 这个)'],
  },
};

/**
 * Returns deterministic Level-specific vocabulary boundary and topic guidance directly from the syllabus catalog.
 */
export function getTopicVocabularyContext(level: number, topic?: string): string {
  if (level === 1) {
    const normalizedTopic = (topic || '').trim().toLowerCase();
    let matchedClusterKey: string | undefined;

    for (const key of Object.keys(HSK1_VERIFIED_TOPIC_VOCAB)) {
      if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
        matchedClusterKey = key;
        break;
      }
    }

    // Common aliases
    if (!matchedClusterKey) {
      if (normalizedTopic.includes('dining') || normalizedTopic.includes('food') || normalizedTopic.includes('beverage')) {
        matchedClusterKey = 'food_dining';
      } else if (normalizedTopic.includes('family') || normalizedTopic.includes('profession') || normalizedTopic.includes('location')) {
        matchedClusterKey = 'family_location';
      } else if (normalizedTopic.includes('transport') || normalizedTopic.includes('travel')) {
        matchedClusterKey = 'transport_travel';
      } else if (normalizedTopic.includes('time') || normalizedTopic.includes('schedule') || normalizedTopic.includes('activity')) {
        matchedClusterKey = 'daily_activity_time';
      } else if (normalizedTopic.includes('weather') || normalizedTopic.includes('clothing')) {
        matchedClusterKey = 'weather_status';
      } else if (normalizedTopic.includes('school') || normalizedTopic.includes('stationery') || normalizedTopic.includes('counting')) {
        matchedClusterKey = 'school_stationery';
      }
    }

    const cluster = matchedClusterKey ? HSK1_VERIFIED_TOPIC_VOCAB[matchedClusterKey] : undefined;

    let out = `\n======================================================================\n`;
    out += `1.1 HSK 1 VERIFIED VOCABULARY & SYLLABUS BOUNDARY POLICY (CLEC HSK 3.0)\n`;
    out += `======================================================================\n`;
    out += `- HSK 1 SYLLABUS SPECIFICATION: In HSK 3.0 Band 1, the syllabus defines exactly 300 verified headwords.\n`;
    out += `- ABSOLUTE LEVEL BOUNDARY: Every single Chinese word across stem, passage, options, and distractors MUST be within HSK 1 or an approved proper noun. The automated runtime validator strictly tests every word against the catalog.\n`;

    if (cluster) {
      out += `- Verified Topic-Relevant HSK 1 Words (Recommended for context & distractors):\n`;
      out += `  [${cluster.words.join(', ')}]\n`;
      out += `- FORBIDDEN OVER-LEVEL LOOKALIKES FOR THIS TOPIC (DO NOT USE - INSTANT VALIDATION FAILURE):\n`;
      for (const p of cluster.prohibitedLookalikes) {
        out += `  * NEVER USE: ${p}\n`;
      }
    } else {
      out += `- AUTHORIZED HSK 1 CORE VOCABULARY BANK (Choose words EXCLUSIVELY from these verified HSK 1 words):\n`;
      out += `  * People & Family: 爸爸, 妈妈, 哥哥, 弟弟, 姐姐, 妹妹, 儿子, 女儿, 老师, 学生, 同学, 朋友, 医生, 人, 名字\n`;
      out += `  * Food & Dining: 水, 茶, 米饭, 菜, 苹果, 水果, 饭, 包子, 饺子, 鸡蛋, 牛奶, 面包, 早饭, 午饭, 晚饭, 饭店, 吃, 喝, 做饭, 好吃\n`;
      out += `  * Places: 家, 学校, 医院, 商店, 书店, 饭店, 超市, 电影院, 北京, 中国, 房间\n`;
      out += `  * Objects: 书, 桌子, 椅子, 电脑, 电视, 电影, 飞机, 出租车, 火车, 车, 猫, 狗, 衣服, 杯子, 钱, 汉字, 字\n`;
      out += `  * Common Verbs: 吃, 喝, 看, 听, 说, 读, 写, 看见, 叫, 买, 开, 开车, 坐, 住, 学习, 工作, 想, 爱, 喜欢, 会, 能, 是, 有, 来, 去, 回, 做, 睡觉, 起床, 打电话, 说话\n`;
      out += `  * Common Adjectives: 好, 大, 小, 多, 少, 冷, 热, 高, 高兴, 漂亮\n`;
      out += `  * Time & Numbers: 今天, 明天, 昨天, 上午, 中午, 下午, 早上, 晚上, 白天, 现在, 年, 月, 日, 号, 星期, 点, 分, 分钟, 小时, 一, 两, 三, 四, 五, 六, 七, 八, 九, 十\n`;
      out += `  * Classifiers: 个, 本, 只, 块, 件, 些\n`;
      out += `  * Pronouns & Particles: 我, 你, 他, 她, 我们, 你们, 他们, 这, 那, 哪, 谁, 什么, 多少, 几, 怎么, 怎么样, 很, 太, 非常, 都, 不, 没, 和, 在, 里, 的, 了, 吗, 呢, 吧\n`;
    }

    out += `- APPROVED PROPER NOUNS WHITELIST (Allowed for subjects and locations):\n`;
    out += `  [北京, 上海, 中国, 李华, 王老师, 李老师, 张老师, 小明, 小红, 小李, 小王, 小张]\n`;
    out += `- COMMON GENERAL OVER-LEVEL WORDS TO AVOID FOR HSK 1 (STRICTLY FORBIDDEN - INSTANT FAILURE):\n`;
    out += `  * Family: NEVER use 爷爷 (HSK 2), 奶奶 (HSK 2), 叔叔 (HSK 2), 阿姨 (HSK 2), 邻居 (HSK 3).\n`;
    out += `  * Places & School: NEVER use 公园 (HSK 2), 动物园 (HSK 2), 餐厅 (HSK 4), 客厅 (HSK 4), 机场 (HSK 2), 车站 (HSK 2), 饭馆 (HSK 2), 教室 (HSK 2), 书店 (HSK 2).\n`;
    out += `  * Activities & Arts: NEVER use 骑 (HSK 2), 跑/跑步 (HSK 2), 游泳 (HSK 2), 运动 (HSK 2), 散步 (HSK 2), 玩/玩耍 (HSK 2), 唱歌 (HSK 2), 跳舞 (HSK 2), 旅游 (HSK 2), 音乐 (HSK 3), 画/画儿 (HSK 2), 打 (HSK 2 bare verb - only full compound 打电话 is allowed).\n`;
    out += `  * Food/Drink: NEVER use 果汁 (HSK 3), 咖啡 (HSK 2), 啤酒 (HSK 2), 可乐 (HSK 2), 面条 (HSK 2), 肉 (HSK 2), 羊肉 (HSK 2), 牛肉 (HSK 2).\n`;
    out += `  * Items: NEVER use 书包 (HSK 2), 作业 (HSK 2), 笔/铅笔 (HSK 2), 报纸 (HSK 2), 手表 (HSK 2), 手机 (HSK 2), 票 (HSK 2).\n`;
    out += `  * Weather & Sensations: NEVER use 晴朗 (HSK 4), 晴天, 阴天 (HSK 2), 刮风 (HSK 3), 暖和 (HSK 3), 困 (HSK 4), 累 (HSK 2), 饿 (HSK 2), 渴 (HSK 2), 生病 (HSK 2), 难受 (HSK 3).\n`;
    out += `  * Modifiers & Connectives: NEVER use 每 (HSK 2), 离 (HSK 2), 远 (HSK 2), 近 (HSK 2), 旁边 (HSK 2), 然后 (HSK 3), 比较 (HSK 2), 已经 (HSK 2), 经常 (HSK 2), 总是 (HSK 2), 突然 (HSK 3), 一共 (HSK 3), 因为 (HSK 2), 所以 (HSK 2), 虽然 (HSK 2), 但是 (HSK 2), 如果 (HSK 3). Keep sentences simple in HSK 1.\n`;
    out += `  * NEVER use a noun as a verb (e.g. NEVER "想手机给妈妈", use "打电话给妈妈").\n`;

    return out;
  }

  if (level === 2) {
    let out = `\n======================================================================\n`;
    out += `1.1 HSK 2 VERIFIED VOCABULARY & SYLLABUS BOUNDARY POLICY (CLEC HSK 3.0)\n`;
    out += `======================================================================\n`;
    out += `- HSK 2 SYLLABUS SPECIFICATION: HSK 2 includes all 300 words of HSK 1 PLUS 200 new HSK 2 headwords (cumulative 500 words).\n`;
    out += `- Allowed words in HSK 2: All HSK 1 words AND common HSK 2 words such as:\n`;
    out += `  [不错, 事情, 准备, 出来, 出门, 跑步, 游泳, 机场, 咖啡, 肉, 每, 笔, 铅笔, 考试, 离, 远, 近, 走, 进, 懂, 错, 找, 问, 送, 帮助, 旅游, 完, 旁边, 爷爷, 奶奶, 便宜, 贵, 已经, 经常, 开始, 介绍, 欢迎, 希望, 问题, 题, 题目, 时间, 休息, 身体, 眼睛, 手表, 报纸, 运动, 唱歌, 跳舞, 骑, 自行车, 票, 船, 站, 晴, 阴, 慢, 快, 忙, 累, 新, 穿, 洗, 卖, 给, 向, 比, 得, 因为, 所以, 虽然, 但是, 正在]\n`;
    out += `- FORBIDDEN HSK 3+ WORDS (DO NOT USE IN HSK 2 - INSTANT VALIDATION FAILURE):\n`;
    out += `  * NEVER use: 晴朗 (HSK 4), 解决 (HSK 3), 方便 (HSK 3), 习惯 (HSK 3), 认真 (HSK 3), 努力 (HSK 3), 遇到 (HSK 3), 检查 (HSK 3), 简单 (HSK 3), 热情 (HSK 3), 奇怪 (HSK 3), 保护 (HSK 4), 适合 (HSK 3), 决定 (HSK 3), 相信 (HSK 3), 机会 (HSK 3), 果汁 (HSK 3), 暖和 (HSK 3), 刮风 (HSK 3), 然后 (HSK 3), 必须 (HSK 3), 同意 (HSK 3), 照顾 (HSK 3), 清楚 (HSK 3), 世界 (HSK 3), 主要 (HSK 3), 了解 (HSK 3), 为了 (HSK 3), 一共 (HSK 3), 铅笔 (HSK 3), 张 (HSK 3).\n`;
    return out;
  }

  if (level === 3) {
    let out = `\n======================================================================\n`;
    out += `1.1 HSK 3 VERIFIED VOCABULARY & SYLLABUS BOUNDARY POLICY (CLEC HSK 3.0)\n`;
    out += `======================================================================\n`;
    out += `- HSK 3 SYLLABUS SPECIFICATION: 1,000 cumulative headwords (HSK 1-2 + 500 new HSK 3 headwords).\n`;
    out += `- Allowed words in HSK 3: All HSK 1-2 words AND HSK 3 words such as:\n`;
    out += `  [世界, 主要, 了解, 为了, 习惯, 方便, 香蕉, 西瓜, 帮助, 相信, 简单, 解决, 必须, 同意, 机会, 决定, 清楚, 检查, 照顾, 热情, 遇到, 认真, 努力, 奇怪, 然后, 一共, 难受, 暖和, 刮风, 极了, 突然, 经常, 总是, 比较, 刚才, 马上, 借, 试, 算, 打算, 作业, 练习, 越...越..., 看起来, 站起来, 想出来, 把].\n`;
    out += `- FORBIDDEN HSK 4+ WORDS: NEVER use words exclusive to HSK 4+ (e.g. 无论, 甚至, 普遍, 压力, 关键, 经验, 态度, 优秀, 丰富, 详细, 严重, 严格, 深刻, 从而, 毕竟).\n`;
    return out;
  }

  if (level === 4) {
    let out = `\n======================================================================\n`;
    out += `1.1 HSK 4 VERIFIED VOCABULARY & SYLLABUS BOUNDARY POLICY (CLEC HSK 3.0)\n`;
    out += `======================================================================\n`;
    out += `- HSK 4 SYLLABUS SPECIFICATION: 2,000 cumulative headwords (HSK 1-3 + 1,000 new HSK 4 headwords).\n`;
    out += `- Allowed words in HSK 4: All HSK 1-3 words AND HSK 4 words such as:\n`;
    out += `  [专业, 专门, 世纪, 严格, 严重, 主意, 举办, 举行, 餐厅, 客厅, 甚至, 经验, 态度, 关键, 压力, 普遍, 随着, 优秀, 丰富, 详细, 合适, 适合, 经历, 考虑, 效果, 影响, 基础, 顺利, 坚持, 成功, 无论...都..., 不仅...而且..., 被, 得/不 (看得懂/做不完)].\n`;
    out += `- FORBIDDEN HSK 5+ WORDS: NEVER use words exclusive to HSK 5+ (e.g. 从而, 毕竟, 把握, 综合, 深刻, 体现, 原则, 持续, 措施, 促进, 趋势, 逻辑, 专心).\n`;
    return out;
  }

  if (level === 5) {
    let out = `\n======================================================================\n`;
    out += `1.1 HSK 5 VERIFIED VOCABULARY & SYLLABUS BOUNDARY POLICY (CLEC HSK 3.0)\n`;
    out += `======================================================================\n`;
    out += `- HSK 5 SYLLABUS SPECIFICATION: 3,600 cumulative headwords (HSK 1-4 + 1,600 new HSK 5 headwords).\n`;
    out += `- Allowed words in HSK 5: All HSK 1-4 words AND HSK 5 words such as:\n`;
    out += `  [不利, 严肃, 个别, 个性, 中介, 深刻, 把握, 趋势, 措施, 促进, 广泛, 从而, 毕竟, 展现, 体现, 逻辑, 综合, 原则, 持续, 掌握, 缓解, 摆脱, 克服, 沟通, 信任, 合作, 难关, 决策, 疲劳, 与其...不如..., 既然...就..., 哪怕...也...].\n`;
    out += `- FORBIDDEN HSK 6 WORDS: NEVER use words exclusive to HSK 6 (e.g. 协调, 借鉴, 倾向, 探索, 进而, 策略, 保障, 规范, 一流, 企及, 别有洞天, 虚伪, 苛刻).\n`;
    return out;
  }

  if (level === 6) {
    let out = `\n======================================================================\n`;
    out += `1.1 HSK 6 VERIFIED VOCABULARY & SYLLABUS BOUNDARY POLICY (CLEC HSK 3.0)\n`;
    out += `======================================================================\n`;
    out += `- HSK 6 SYLLABUS SPECIFICATION: 5,400+ cumulative headwords (full HSK 3.0 mastery band).\n`;
    out += `- Discourse level: Advanced socio-economic, philosophical, academic, literary, and formal register.\n`;
    out += `- Faulty sentence patterns (语病辨析): Improper collocations (搭配不当), missing subjects/objects (成分残缺), faulty word order (语序混乱), blended clauses (句式杂糅), logical contradictions (逻辑矛盾).\n`;
    return out;
  }

  return '';
}

function getExampleOptionsForPrompt(
  partType: string,
  boundedLevel: number,
  expectedOptions: number,
  isWriting: boolean
): string[] {
  if (isWriting) return [];
  if (partType.includes('true_false')) {
    return ['正确', '错误'];
  }
  if (partType.startsWith('read_sentence_picture_match')) {
    return ['热茶', '苹果', '看书', '医院', '出租车', '飞机'].slice(0, expectedOptions);
  }
  if (partType.includes('picture_match') || partType.includes('choose_pic')) {
    return ['喝茶', '吃苹果', '看书', '去医院', '坐出租车', '坐飞机'].slice(0, expectedOptions);
  }
  if (partType.startsWith('listen_talks_qa') || partType.startsWith('listen_monologue')) {
    if (boundedLevel >= 5) {
      return ['适度自主权更能促进企业长远发展', '严格制度能最大程度激发员工潜能', '领导应当对所有细节实行实时监控', '试错只会给企业带来难以承担的损失'].slice(0, expectedOptions);
    }
    if (boundedLevel === 4) {
      return ['适度活动并喝一杯温水', '多喝浓茶或咖啡提神', '马上卧床睡一个小时', '继续坚持长时间工作'].slice(0, expectedOptions);
    }
    return ['去公园锻炼身体', '在家里看电视', '去医院看医生'].slice(0, expectedOptions);
  }
  if (partType.startsWith('listen_dialogue_qa')) {
    if (boundedLevel >= 5) {
      return ['集中做线上精准营销', '按原计划削减两成预算', '盲目追加线下广告投入', '全面铺开新产品宣传'].slice(0, expectedOptions);
    }
    if (boundedLevel === 4) {
      return ['面试时间被推迟了', '今天下午面试通过了', '负责面试的主管生病了', '决定放弃这次面试机会'].slice(0, expectedOptions);
    }
    if (boundedLevel === 3) {
      return ['完成老师留的作业', '去公园骑车', '在家里睡觉', '去医院看医生'].slice(0, expectedOptions);
    }
    return ['明天下午两点一刻', '明天上午九点半', '明天下午三点', '今天下午两点'].slice(0, expectedOptions);
  }
  if (partType.startsWith('read_comprehension')) {
    if (boundedLevel >= 5) {
      return ['选项过多容易增加决策难度', '商品种类越多顾客越满意', '面临选择时人们绝不会放弃', '权衡成本高能促进消费欲望'].slice(0, expectedOptions);
    }
    if (boundedLevel === 4) {
      return ['日常小麻烦也会带来严重影响', '只有大挫折才会带来心理压力', '生活中的小麻烦完全没有影响', '遇到困难时绝不需要主动调整'].slice(0, expectedOptions);
    }
    if (boundedLevel === 3) {
      return ['为了健康需要经常锻炼', '工作繁忙完全没有时间', '每天跑步容易感到疲劳', '从来不去户外运动'].slice(0, expectedOptions);
    }
    return ['十分繁忙', '喜欢运动', '经常迟到', '工作轻松'].slice(0, expectedOptions);
  }
  if (boundedLevel === 1) {
    return (expectedOptions === 6 ? ['书', '水', '茶', '苹果', '飞机', '学校'] : ['书', '水', '茶', '苹果']).slice(0, expectedOptions);
  }
  if (boundedLevel === 2) {
    return (expectedOptions === 6 ? ['进', '走', '出', '跑', '买', '看'] : ['进', '走', '出', '跑']).slice(0, expectedOptions);
  }
  if (boundedLevel >= 5) {
    return (expectedOptions === 6 ? ['缓解', '推卸', '摆脱', '消除', '克服', '适应'] : ['缓解', '推卸', '摆脱', '消除']).slice(0, expectedOptions);
  }
  if (boundedLevel === 4) {
    return (expectedOptions === 6 ? ['合适', '适合', '符合', '配合', '安排', '调整'] : ['合适', '适合', '符合', '配合']).slice(0, expectedOptions);
  }
  return (expectedOptions === 6 ? ['解决', '解释', '决定', '检查', '照顾', '清楚'] : ['解决', '解释', '决定', '检查']).slice(0, expectedOptions);
}

/**
 * Builds the comprehensive HSK 3.0 system and user prompt for LLM question generation.
 */
export function buildHskPrompt(
  level: number,
  skill: string,
  count: number,
  targetVocabs: VocabItem[] = [],
  partType = 'read_fill_blank_4opt',
  topic?: string,
  difficultyTier?: DifficultyTier,
  targetGrammar?: string,
  trapType?: TrapType | string
): string {
  const boundedLevel = Math.max(1, Math.min(level, 6));
  const spec = HSK_LEVEL_SPECS[boundedLevel] || HSK_LEVEL_SPECS[1];
  const grammarGuideline = HSK_GRAMMAR_LEVEL_GUIDELINES[boundedLevel] || HSK_GRAMMAR_LEVEL_GUIDELINES[1];

  const vocabListStr = targetVocabs.length > 0
    ? targetVocabs.map((v) => `${v.word} (${v.pinyin || ''})`).join(', ')
    : spec.exampleWords.slice(0, 10).join(', ');

  const topicVocabContext = getTopicVocabularyContext(boundedLevel, topic);
  const grammarGuidance = formatGrammarPromptGuidance(boundedLevel, targetGrammar);
  const typeInstructions = getQuestionTypeInstructions(partType, boundedLevel);
  const topicInstruction = topic && topic.trim().length > 0
    ? `\n- Contextual Topic / Thematic Focus: All questions and scenarios MUST focus on the theme "${topic.trim()}". Align terminology and situational context to this topic while respecting the HSK ${boundedLevel} linguistic constraints.`
    : '';

  const tierInstructions = getDifficultyTierInstructions(difficultyTier);
  const trapInstructions = getTrapTypeInstructions(trapType);
  const grammarInstruction = targetGrammar && targetGrammar.trim().length > 0
    ? `\n- Explicit Target Grammar Focus: You MUST construct questions specifically testing "${targetGrammar.trim()}".`
    : '';

  const listeningDistractorGuidance = partType.startsWith('listen_') && boundedLevel >= 3
    ? `\n- Authentic Listening Distractor Mandate: For HSK ${boundedLevel} listening, design authentic indirect responses and distractors (like IELTS listening: multi-turn dialogue, conversational reversals, trade-offs, rhetorical attitude, and anti-verbatim options) so listeners must genuinely understand context rather than matching verbatim words.`
    : '';

  const isWriting = isOpenEndedWritingTask(partType);
  const bpExpected = getExpectedOptionCount(boundedLevel, partType);
  const expectedOptionsMatch = partType.match(/_(\d+)opt/i);
  const expectedOptions = isWriting
    ? 0
    : (partType.includes('true_false')
        ? 2
        : (bpExpected !== null
            ? bpExpected
            : (expectedOptionsMatch
                ? Number(expectedOptionsMatch[1])
                : (boundedLevel <= 2 && (skill === 'listening' || skill === 'reading' || /^listen_|^read_/i.test(partType))
                    ? (/6opt|split|word_bank|matching/i.test(partType) ? 6 : 3)
                    : 4))));
  const imageOptionPartTypes = new Set([
    'listen_picture_match_3opt',
    'listen_picture_match_4opt',
    'listen_dialogue_picture_match_6opt',
    'listen_dialogue_picture_match_split',
    'read_sentence_picture_match_6opt',
  ]);
  const usesImageOptions = imageOptionPartTypes.has(partType);
  const exampleOptions = getExampleOptionsForPrompt(partType, boundedLevel, expectedOptions, isWriting);
  const exampleImageOptions = ['tea', 'apple', 'reading', 'hospital', 'taxi', 'airplane'].slice(0, expectedOptions);

  // Dynamically select 100% syllabus-aligned example fields based on partType and boundedLevel
  let sampleStem = '"遇到困难时，我们必须想办法____问题。"';
  let sampleCompletedStem = '"遇到困难时，我们必须想办法解决问题。"';
  let samplePinyin = '"yù dào kùn nán shí, wǒ men bì xū xiǎng bàn fǎ jiě jué wèn tí."';
  let sampleTargetVocab = '"解决"';
  let sampleRationales = expectedOptions === 6
    ? `[
      {"option_idx": 1, "option_text": "解释", "rationale_vi": "解释: Mang nghĩa là giải thích, không kết hợp với '办法...问题'."},
      {"option_idx": 2, "option_text": "决定", "rationale_vi": "决定: Mang nghĩa là quyết định, không phải giải quyết vấn đề."},
      {"option_idx": 3, "option_text": "检查", "rationale_vi": "检查: Mang nghĩa là kiểm tra, không mang nghĩa giải quyết dứt điểm vấn đề."},
      {"option_idx": 4, "option_text": "照顾", "rationale_vi": "照顾: Mang nghĩa là chăm sóc, không kết hợp với '办法...问题'."},
      {"option_idx": 5, "option_text": "清楚", "rationale_vi": "清楚: Mang nghĩa là rõ ràng, không phải động từ giải quyết vấn đề."}
    ]`
    : (expectedOptions === 3
        ? `[
          {"option_idx": 1, "option_text": "解释", "rationale_vi": "解释: Mang nghĩa là giải thích, không kết hợp với '办法...问题'."},
          {"option_idx": 2, "option_text": "决定", "rationale_vi": "决定: Mang nghĩa là quyết định, không phải giải quyết vấn đề."}
        ]`
        : `[
          {"option_idx": 1, "option_text": "解释", "rationale_vi": "解释: Mang nghĩa là giải thích, không kết hợp với '办法...问题'."},
          {"option_idx": 2, "option_text": "决定", "rationale_vi": "决定: Mang nghĩa là quyết định, không phải giải quyết vấn đề."},
          {"option_idx": 3, "option_text": "检查", "rationale_vi": "检查: Mang nghĩa là kiểm tra, không mang nghĩa giải quyết dứt điểm vấn đề."}
        ]`);
  let sampleExplanationSummary = '"Dịch nghĩa: Khi gặp khó khăn, chúng ta phải nghĩ cách giải quyết vấn đề."';
  let sampleAnswerRationale = '"解决: Kết hợp chuẩn tạo thành cụm từ cố định [解决问题] (giải quyết vấn đề)."';

  if (usesImageOptions) {
    if (partType.startsWith('read_sentence_picture_match')) {
      sampleStem = '"桌子上有两杯热茶。"';
      sampleCompletedStem = '"桌子上有两杯热茶。"';
      samplePinyin = '"zhuō zi shang yǒu liǎng bēi rè chá."';
      sampleTargetVocab = '"茶"';
      sampleExplanationSummary = '"Dịch nghĩa: Trên bàn có hai tách trà nóng. Tranh tách trà nóng (tea) khớp chính xác với câu miêu tả."';
      sampleAnswerRationale = '"热茶: Khớp chính xác với hình ảnh tách trà nóng (tea)."';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "苹果", "rationale_vi": "苹果: Quả táo (apple), không khớp với câu nói về trà nóng trên bàn."},
        {"option_idx": 2, "option_text": "看书", "rationale_vi": "看书: Đọc sách (reading), không nhắc đến trong câu."},
        {"option_idx": 3, "option_text": "医院", "rationale_vi": "医院: Bệnh viện (hospital), địa điểm không phù hợp."},
        {"option_idx": 4, "option_text": "出租车", "rationale_vi": "出租车: Xe taxi (taxi), phương tiện giao thông không phù hợp."},
        {"option_idx": 5, "option_text": "飞机", "rationale_vi": "飞机: Máy bay (airplane), không liên quan đến đồ uống trên bàn."}
      ]`;
    } else {
      sampleStem = JSON.stringify("男：外面天气真冷，快进屋暖和一下。\n女：谢谢您，请给我倒一杯热的吧。");
      sampleCompletedStem = sampleStem;
      samplePinyin = '"nán: wài miàn tiān qì zhēn lěng, kuài jìn wū nuǎn huo yí xià. nǚ: xiè xie nín, qǐng gěi wǒ dào yì bēi rè de ba."';
      sampleTargetVocab = '"茶"';
      sampleExplanationSummary = '"Dịch nghĩa: Nam bảo trời bên ngoài lạnh, khuyên vào nhà sưởi ấm. Nữ cảm ơn và xin một cốc nước nóng, phù hợp nhất với hình ảnh tách trà nóng (tea)."';
      sampleAnswerRationale = '"喝茶 (tea): Ngữ cảnh trời lạnh muốn uống đồ nóng để làm ấm người phù hợp với hình ảnh tách trà (tea). Đối thoại không lộ nguyên văn từ khóa nhằm rèn luyện tư duy ngữ cảnh."';
      sampleRationales = expectedOptions === 3
        ? `[
          {"option_idx": 1, "option_text": "看书", "rationale_vi": "看书: Đọc sách (reading), không liên quan đến việc uống trà."},
          {"option_idx": 2, "option_text": "坐出租车", "rationale_vi": "坐出租车: Đi taxi (taxi), không liên quan đến ăn uống."}
        ]`
        : (expectedOptions === 4
            ? `[
              {"option_idx": 1, "option_text": "看书", "rationale_vi": "看书: Đọc sách (reading), không liên quan đến việc uống trà."},
              {"option_idx": 2, "option_text": "坐出租车", "rationale_vi": "坐出租车: Đi taxi (taxi), không liên quan đến ăn uống."},
              {"option_idx": 3, "option_text": "去医院", "rationale_vi": "去医院: Đi bệnh viện (hospital), đoạn thoại không nhắc đến ốm đau."}
            ]`
            : `[
              {"option_idx": 1, "option_text": "吃苹果", "rationale_vi": "吃苹果: Ăn táo (apple), không khớp với việc uống trà."},
              {"option_idx": 2, "option_text": "看书", "rationale_vi": "看书: Đọc sách (reading), không liên quan đến nội dung đối thoại."},
              {"option_idx": 3, "option_text": "去医院", "rationale_vi": "去医院: Đi bệnh viện (hospital), đoạn thoại không nhắc đến ốm đau."},
              {"option_idx": 4, "option_text": "坐出租车", "rationale_vi": "坐出租车: Đi taxi (taxi), không liên quan đến ăn uống."},
              {"option_idx": 5, "option_text": "飞机", "rationale_vi": "飞机: Đi máy bay (airplane), không liên quan đến đối thoại."}
            ]`);
    }
  } else if (partType.includes('true_false')) {
    if (boundedLevel <= 2) {
      sampleStem = '"他在坐出租车去学校。"';
      sampleCompletedStem = '"他在坐出租车去学校。"';
      samplePinyin = '"tā zài zuò chū zū chē qù xué xiào."';
      sampleTargetVocab = '"出租车"';
      sampleExplanationSummary = '"Dịch nghĩa: Anh ấy đang đi taxi đến trường. Nội dung audio khớp hoàn toàn với hình ảnh chiếc xe taxi (taxi)."';
      sampleAnswerRationale = '"正确: Hoạt động trong câu nói và hình ảnh minh họa xe taxi là hoàn toàn thống nhất."';
    } else {
      sampleStem = '"我想买几件新衣服，但是今天商店关门了。\\n★ 他今天买了衣服。"';
      sampleCompletedStem = '"我想买几件新衣服，但是今天商店关门了。\\n★ 他今天买了衣服。"';
      samplePinyin = '"wǒ xiǎng mǎi jǐ jiàn xīn yī fu, dàn shì jīn tiān shāng diàn guān mén le. ★ tā jīn tiān mǎi le yī fu."';
      sampleTargetVocab = '"衣服"';
      sampleExplanationSummary = '"Dịch nghĩa: Tôi muốn mua vài bộ quần áo mới, nhưng hôm nay cửa hàng đóng cửa rồi. ★ Hôm nay anh ấy đã mua quần áo."';
      sampleAnswerRationale = '"错误: Bài phát biểu nêu rõ cửa hàng đóng cửa nên người nói chưa mua được quần áo, câu khẳng định là sai."';
    }
    sampleRationales = `[
      {"option_idx": 1, "option_text": "错误", "rationale_vi": "错误: Thông tin hoàn toàn chuẩn xác, lựa chọn 'sai' là không đúng."}
    ]`;
  } else if (isWriting) {
    if (partType === 'write_topic_essay_300chars') {
      sampleStem = '"近年来，随着数字技术与人工智能的飞速发展，\'终身学习\'成为了社会热议的焦点。请结合自身经历或社会现象，以\'终身学习的意义\'为题，写一篇300字左右的议论文，观点明确，条理清晰。"';
      sampleCompletedStem = sampleStem;
      samplePinyin = '"jìn nián lái, suí zhe shù zì jì shù yǔ rén gōng zhì néng de fēi sù fā zhǎn, zhōng shēn xué xí chéng wéi le shè huì rè yì de jiāo diǎn. qǐng jié hé zì shēn jīng lì huò shè huì xiàn xiàng, yǐ zhōng shēn xué xí de yì yì wèi tí, xiě yì piān 300 zì zuǒ yòu de yì lùn wén, guān diǎn míng què, tiáo lǐ qīng xī."';
      sampleTargetVocab = '"终身"';
      sampleRationales = '[]';
      sampleExplanationSummary = '"Yêu cầu đề thi viết nghị luận xã hội HSK 6 (300 chữ): Trình bày quan điểm mạch lạc về ý nghĩa của việc học tập suốt đời trong kỷ nguyên số. Tiêu chí chấm: 1. Luận điểm rõ ràng & lập luận chặt chẽ (40đ); 2. Vốn từ vựng HSK 6 & ngữ pháp cao cấp (30đ); 3. Dung lượng ~300 chữ (20đ); 4. Chữ viết & liên kết đoạn (10đ)."';
      sampleAnswerRationale = '"Bài viết mẫu chuẩn điểm cao (~300 chữ): 在当今知识更新极其迅速的信息时代，\'终身学习\'已不再是一句口号，而是每个人必须具备的核心素养。首先，科技的日新月异使得许多传统技能迅速过时，唯有保持持续学习的习惯，才能在竞争激烈的职场中立于不败之地。其次，终身学习能够拓宽我们的认知边界，帮助我们更好地理解多元化的世界，提升个人内在素养与幸福感。总之，学习不是人生某一阶段的任务，而是一场永无止境的自我探索与提升之旅。"';
    } else {
      sampleStem = boundedLevel >= 6
        ? '"阅读下文并在400字内进行缩写，保留故事主旨与核心脉络：古时候，有一位技艺精湛的工匠名叫鲁班。有一次，他上山砍伐树木建造房屋，手指不慎被一种野草的叶子划破了。他仔细观察这种叶子，发现边缘长着许多锋利的细齿。鲁班从中受到启发，反复试验后发明了铁锯，大大提高了伐木与建筑的效率……请在400字内进行缩写。"'
        : (boundedLevel === 5
            ? '"请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。"'
            : (boundedLevel === 4
                ? '"看图并结合词语写一句话：[打扫]。"'
                : '"在田字格中写出正确的汉字：他正在看____(shū)。"'));
      sampleCompletedStem = sampleStem;
      samplePinyin = boundedLevel >= 6
        ? '"yuè dú xià wén bìng zài 400 zì nèi jìn xíng suō xiě, bǎo liú gù shì zhǔ zhǐ yǔ hé xīn mài luò."'
        : (boundedLevel === 5
            ? '"qǐng jié hé yǐ xià 5 gè cí yǔ xiě yì piān 80 zì zuǒ yòu de duǎn wén: [huǎn jiě, yā lì, cuò shī, jī jí, xiào guǒ]."'
            : (boundedLevel === 4
                ? '"kàn tú bìng jié hé cí yǔ xiě yí jù huà: [dǎ sǎo]."'
                : '"zài tián zì gé zhōng xiě chū zhèng què de hàn zì: tā zhèng zài kàn shū."'));
      sampleTargetVocab = boundedLevel >= 6 ? '"启发"' : (boundedLevel === 5 ? '"缓解"' : (boundedLevel === 4 ? '"打扫"' : '"书"'));
      sampleRationales = '[]';
      sampleExplanationSummary = boundedLevel >= 6
        ? '"Tiêu chí chấm điểm CTI (Thang 100): 1. Độ đầy đủ ý chính (40đ); 2. Độ chuẩn xác ngữ pháp & liên kết (30đ); 3. Dung lượng 400 chữ ±10% (20đ); 4. Chữ viết & chính tả (10đ)."'
        : (boundedLevel === 5
            ? '"Yêu cầu đề thi viết tự luận HSK 5: Vận dụng linh hoạt 5 từ khóa [缓解, 压力, 措施, 积极, 效果] vào một văn cảnh thống nhất, dung lượng khoảng 80 chữ. Tiêu chí chấm điểm CTI: 1. Sử dụng đúng đủ 5 từ (40đ); 2. Ngữ pháp & câu cú tự nhiên (30đ); 3. Bố cục & liên kết đoạn (20đ); 4. Dung lượng ~80 chữ (10đ)."'
            : (boundedLevel === 4
                ? '"Đề thi yêu cầu nhìn tranh và từ khóa [打扫] để viết một câu hoàn chỉnh. Tiêu chí chấm điểm CTI: Đặt câu đúng ngữ cảnh tranh, đủ chủ vị ngữ pháp, dùng đúng từ khóa."'
                : '"Điền đúng chữ Hán [书] tương ứng với phiên âm shū."'));
      sampleAnswerRationale = boundedLevel >= 6
        ? '"Bài viết mẫu chuẩn điểm tối đa (~400 chữ): [Tóm tắt mẫu súc tích phản ánh đầy đủ mở đầu, diễn biến, bước ngoặt và bài học nhân sinh của tác phẩm]..."'
        : (boundedLevel === 5
            ? '"Bài viết mẫu chuẩn điểm tối đa (~80 chữ): 面对快节奏的现代生活，我们常常感到巨大的心理压力。为了有效缓解这种压力，公司采取了一系列积极措施，例如举办户外拓展活动。员工们积极参与其中，取得了显著效果，工作效率与幸福感也大幅提升。"'
            : (boundedLevel === 4
                ? '"Câu mẫu chuẩn ngữ pháp: 周末我们在家里打扫房间，到处都很干净。"'
                : '"Chữ Hán chính xác là [书], tạo thành cụm từ 看书 (đọc sách)."'));
    }
  } else if (partType.startsWith('listen_dialogue_qa')) {
    if (boundedLevel >= 5) {
      sampleStem = JSON.stringify(
        "男：王经理，关于新产品的推广预算，如果按原计划削减两成，恐怕很难达到预期的市场反响。\n" +
        "女：我理解你的顾虑，但目前公司资金链紧张，盲目追加投入风险太大。\n" +
        "男：那不如我们把传统的线下广告砍掉，集中资金做线上精准营销，你看怎么样？\n" +
        "女：与其全面铺开，不如集中突破。我看就按你的新提议办，尽快把调整后的方案交上来吧。\n" +
        "问：女的最终同意采取什么措施？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"nán: wáng jīng lǐ, guān yú xīn chǎn pǐn de tuī guǎng yù suàn, rú guǒ àn yuán jì huà xuē jiǎn liǎng chéng, kǒng pà hěn nán dá dào yù qī de shì chǎng fǎn xiǎng. nǚ: wǒ lǐ jiě nǐ de gù lǜ, dàn mù qián gōng sī zī jīn liàn jǐn zhāng, máng mù zhuī jiā tóu rù fēng xiǎn tài dà. nán: nà bù rú wǒ men bǎ chuán tǒng de xià xiàn guǎng gào kǎn diào, jí zhōng zī jīn zuò xiàn shàng jīng zhǔn yíng xiāo, nǐ kàn zěn me yàng? nǚ: yǔ qí quán miàn pū kāi, bù rú jí zhōng tū pò. wǒ kàn jiù àn nǐ de xīn tí yì bàn, jǐn kuài bǎ tiáo zhěng hòu de fāng àn jiāo shàng lái ba. wèn: nǚ de zuì zhōng tóng yì cǎi qǔ shén me cuò shī?"';
      sampleTargetVocab = '"与其...不如..."';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "按原计划削减两成预算", "rationale_vi": "按原计划削减两成预算: Đây là kế hoạch ban đầu (原计划) mà nam bày tỏ lo ngại không hiệu quả, không phải quyết định cuối cùng."},
        {"option_idx": 2, "option_text": "盲目追加线下广告投入", "rationale_vi": "盲目追加线下广告投入: Nữ đã bác bỏ việc追加投入 vì rủi ro lớn, và nam đề xuất cắt bỏ hoàn toàn quảng cáo offline (线下广告)."},
        {"option_idx": 3, "option_text": "全面铺开新产品宣传", "rationale_vi": "全面铺开新产品宣传: Trái ngược với câu kết luận của nữ [与其全面铺开，不如集中突破] (thay vì dàn trải thì nên tập trung đột phá)."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nam lo ngại cắt giảm 20% ngân sách quảng bá sẽ không đạt hiệu quả. Nữ ban đầu e ngại rủi ro tài chính. Nam đề xuất hủy bỏ quảng cáo offline để dồn vốn tiếp thị trực tuyến chính xác. Nữ đồng ý với đề xuất tập trung đột phá này."';
      sampleAnswerRationale = '"集中做线上精准营销: Nữ chốt lại [与其全面铺开，不如集中突破。我看就按你的新提议办], đồng ý phương án dồn lực làm tiếp thị trực tuyến của nam."';
    } else if (boundedLevel === 4) {
      sampleStem = JSON.stringify(
        "男：小李，你不是说今天下午去面试吗？怎么还坐在办公室里？\n" +
        "女：招聘单位临时通知，负责面试的王总正在开紧急会议，改到明天上午九点了。\n" +
        "男：那正好，你可以抓紧时间再把自我介绍多准备一下。\n" +
        "问：关于女的，可以知道什么？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"nán: xiǎo lǐ, nǐ bú shì shuō jīn tiān xià wǔ qù miàn shì ma? zěn me hái zuò zài bàn gōng shì lǐ? nǚ: zhāo pìn dān wèi lín shí tōng zhī, fù zé miàn shì de wáng zǒng zhèng zài kāi jǐn jí huì yì, gǎi dào míng tiān shàng wǔ jiǔ diǎn le. nán: nà zhèng hǎo, nǐ kě yǐ zhuā jǐn shí jiān zài bǎ zì wǒ jiè shào duō zhǔn bèi yí xià. wèn: guān yú nǚ de, kě yǐ zhī dào shén me?"';
      sampleTargetVocab = '"推迟"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "今天下午面试通过了", "rationale_vi": "今天下午面试通过了: Buổi phỏng vấn bị dời sang sáng mai chứ chưa diễn ra."},
        {"option_idx": 2, "option_text": "负责面试的主管生病了", "rationale_vi": "负责面试的主管生病了: Giám đốc Vương bận họp khẩn cấp chứ không phải bị ốm."},
        {"option_idx": 3, "option_text": "决定放弃这次面试机会", "rationale_vi": "决定放弃这次面试机会: Nữ vẫn tham gia vào sáng mai và đang chuẩn bị thêm phần giới thiệu bản thân."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nam hỏi sao Tiểu Lý chưa đi phỏng vấn chiều nay. Nữ trả lời đơn vị tuyển dụng thông báo dời sang 9 giờ sáng mai vì sếp bận họp khẩn. Nam bảo vậy càng có thêm thời gian chuẩn bị giới thiệu bản thân."';
      sampleAnswerRationale = '"面试时间被推迟了: Nữ nêu rõ cuộc phỏng vấn chiều nay được dời sang 9h sáng mai do sếp bận họp khẩn."';
    } else if (boundedLevel === 3) {
      sampleStem = JSON.stringify(
        "男：今天天气这么好，我们一起骑自行车去公园吧。\n" +
        "女：我本来也想去，可是刚才老师发消息说，下午两点要把作业交上去，我得先做完。\n" +
        "问：女的下午要做什么？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"nán: jīn tiān tiān qì zhè me hǎo, wǒ men yì qǐ qí zì xíng chē qù gōng yuán ba. nǚ: wǒ běn lái yě xiǎng qù, kě shì gāng cái lǎo shī fā xiāo xi shuō, xià wǔ liǎng diǎn yào bǎ zuò yè jiāo shàng qù, wǒ děi xiān zuò wán. wèn: nǚ de xià wǔ yào zuò shén me?"';
      sampleTargetVocab = '"作业"';
      sampleRationales = expectedOptions === 3
        ? `[
        {"option_idx": 1, "option_text": "去公园骑车", "rationale_vi": "去公园骑车: Đây là lời mời của bạn nam và ý định ban đầu (本来想去), nhưng nữ đã từ chối vì bận làm bài tập."},
        {"option_idx": 2, "option_text": "在家里睡觉", "rationale_vi": "在家里睡觉: Đoạn thoại không hề nhắc tới việc đi ngủ."}
      ]`
        : `[
        {"option_idx": 1, "option_text": "去公园骑车", "rationale_vi": "去公园骑车: Đây là lời mời của bạn nam và ý định ban đầu (本来想去), nhưng nữ đã từ chối vì bận làm bài tập."},
        {"option_idx": 2, "option_text": "在家里睡觉", "rationale_vi": "在家里睡觉: Đoạn thoại không hề nhắc tới việc đi ngủ."},
        {"option_idx": 3, "option_text": "去医院看医生", "rationale_vi": "去医院看医生: Nữ không bị ốm, chỉ phải làm bài tập nộp cho giáo viên."}
      ]`;
      sampleRationales = `[
        {"option_idx": 1, "option_text": "去公园骑车", "rationale_vi": "去公园骑车: Đây là lời mời của bạn nam và ý định ban đầu (本来想去), nhưng nữ đã từ chối vì bận làm bài tập."},
        {"option_idx": 2, "option_text": "在家里睡觉", "rationale_vi": "在家里睡觉: Đoạn thoại không hề nhắc tới việc đi ngủ."},
        {"option_idx": 3, "option_text": "去医院看医生", "rationale_vi": "去医院看医生: Nữ không bị ốm, chỉ phải làm bài tập nộp cho giáo viên."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nam rủ nữ đạp xe đi công viên. Nữ vốn định đi nhưng giáo viên nhắn 2h chiều phải nộp bài tập nên phải ở nhà làm xong trước."';
      sampleAnswerRationale = '"完成老师留的作业: Nữ nói rõ [下午两点要把作业交上去，我得先做完]. Bẫy [去公园骑车] là ý định ban đầu bị hủy bỏ."';
    } else {
      sampleStem = JSON.stringify("男：李老师，原定明天上午九点半的部门会议，需要推迟吗？\n女：张校长临时要接待外宾，会议改到明天下午两点一刻吧。\n问：会议改在什么时候举行？");
      sampleCompletedStem = sampleStem;
      samplePinyin = '"nán: lǐ lǎo shī, yuán dìng míng tiān shàng wǔ jiǔ diǎn bàn de bù mén huì yì, xū yào tuī chí ma? nǚ: zhāng xiào zhǎng lín shí yào jiē dài wài bīn, huì yì gǎi dào míng tiān xià wǔ liǎng diǎn yí kè ba. wèn: huì yì gǎi zài shén me shí hou jǔ xíng?"';
      sampleTargetVocab = '"推迟"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "明天上午九点半", "rationale_vi": "明天上午九点半: Là thời gian dự kiến ban đầu (原定), nhưng sau đó đã bị hoãn do lãnh đạo bận tiếp khách, không phải thời gian họp thực tế."},
        {"option_idx": 2, "option_text": "明天下午三点", "rationale_vi": "明天下午三点: Thời gian không được nhắc tới trong bài thoại."},
        {"option_idx": 3, "option_text": "今天下午两点", "rationale_vi": "今天下午两点: Sai cả về ngày (họp vào ngày mai) lẫn giờ họp."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nam hỏi cuộc họp 9:30 sáng mai có bị hoãn không. Nữ thông báo đổi sang 2:15 chiều mai vì hiệu trưởng tiếp khách."';
      sampleAnswerRationale = '"明天下午两点一刻: Nữ nói rõ [会议改到明天下午两点一刻吧], đây là quyết định cuối cùng."';
    }
  } else if (partType === 'listen_talks_qa_4opt' || partType === 'listen_monologue_qa_3opt') {
    if (boundedLevel >= 5) {
      sampleStem = JSON.stringify(
        "在传统观念中，很多管理者认为严格的规章制度是提升团队执行力的唯一保障。然而，最新的一项组织心理学研究却得出了出人意料的结论：过度严苛的考核机制反而会严重抑制员工的创新意识和主动担当精神。相反，那些给予员工适度自主权并鼓励试错的企业，其长期业绩表现和核心竞争力往往显著优于前者。真正的领导力，绝非体现在细枝末节的监控上，而在于能否为团队营造一个充满信任与安全感的成长空间。\n问：这项研究的核心发现是什么？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"zài chuán tǒng guān niàn zhōng, hěn duō guǎn lǐ zhě rèn wéi yán gé de guī zhāng zhì dù shì tí shēng tuán duì zhí xíng lì de wéi yī bǎo zhàng. rán ér, zuì xīn de yí xiàng zǔ zhī xīn lǐ xué yán jiū què dé chū le chū rén yì liào de jié lùn: guò dù yán kē de kǎo hé jī zhì fǎn ér huì yán zhòng yì zhì yuán gōng de chuàng xīn yì shí hé zhǔ dòng dān dāng jīng shén. xiāng fǎn, nà xiē jǐ yǔ yuán gōng shì dù zì zhǔ quán bìng gǔ lì shì cuò de qǐ yè, qí cháng qī yè jì biǎo xiàn hé hé xīn jìng zhēng lì wǎng wǎng xiǎn zhù yōu yú qián zhě. zhēn zhèng de lǐng dǎo lì, jué fēi tǐ xiàn zài xì zhī mò jié de jiān kòng shàng, ér zài yú néng fǒu wèi tuán duì yíng zào yí gè chōng mǎn xìn rèn yǔ ān quán gǎn de chéng zhǎng kōng jiān. wèn: zhè xiàng yán jiū de hé xīn fā xiàn shì shén me?"';
      sampleTargetVocab = '"适度"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "严格制度能最大程度激发员工潜能", "rationale_vi": "严格制度能最大程度激发员工潜能: Bẫy ngược nghĩa. Đoạn nói nêu rõ kiểm soát quá ngặt nghèo sẽ ức chế tinh thần đổi mới và gánh vác."},
        {"option_idx": 2, "option_text": "领导应当对所有细节实行实时监控", "rationale_vi": "领导应当对所有细节实行实时监控: Trái ngược với kết luận của tác giả [真正的领导力绝非体现在细枝末节的监控上]."},
        {"option_idx": 3, "option_text": "试错只会给企业带来难以承担的损失", "rationale_vi": "试错只会给企业带来难以承担的损失: Trái ngược với nội dung khuyến khích dám thử và sai [鼓励试错的企业表现往往优于前者]."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nghiên cứu tâm lý học tổ chức chỉ ra quản chế quá hà khắc sẽ kìm hãm sự sáng tạo của nhân viên; trao quyền tự chủ và khuyến khích thử sai mang lại thành tích lâu dài vượt trội."';
      sampleAnswerRationale = '"适度自主权更能促进企业长远发展: Bài nói nhấn mạnh doanh nghiệp trao quyền tự chủ phù hợp cho nhân viên đạt hiệu quả và sức cạnh tranh cao hơn."';
    } else if (boundedLevel === 4) {
      sampleStem = JSON.stringify(
        "很多人在工作或学习感到疲劳时，习惯喝浓茶或者咖啡来提神。虽然这些饮品能在短时间内让我们恢复精力，但如果长期过度依赖，不仅会影响晚上的睡眠质量，还可能导致身体更加疲倦。专家建议，感到困倦时不妨站起来活动五分钟，或者喝一杯温开水，这样既健康又能有效缓解疲劳。\n问：感到疲劳时，专家建议怎么做？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"hěn duō rén zài gōng zuò huò xué xí gǎn dào pí láo shí, xí guàn hē nóng chá huò zhě kā fēi lái tí shén. suī rán zhè xiē yǐn pǐn néng zài duǎn shí jiān nèi ràng wǒ men huī fù jīng lì, dàn rú guǒ cháng qī guò dù yī lài, bù jǐn huì yǐng xiǎng wǎn shang de shuì mián zhì liàng, hái kě néng dǎo zhì shēn tǐ gèng jiā pí juàn. zhuān jiā jiàn yì, gǎn dào kùn juàn shí bù fáng zhàn qǐ lái huó dòng wǔ fēn zhōng, huò zhě hē yì bēi wēn kāi shuǐ, zhè yàng jì jiàn kāng yòu néng yǒu xiào huǎn jiě pí láo. wèn: gǎn dào pí láo shí, zhuān jiā jiàn yì zěn me zuò?"';
      sampleTargetVocab = '"缓解"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "多喝浓茶或咖啡提神", "rationale_vi": "多喝浓茶或咖啡提神: Đây là thói quen của nhiều người nhưng chuyên gia cảnh báo lạm dụng sẽ ảnh hưởng giấc ngủ."},
        {"option_idx": 2, "option_text": "马上卧床睡一个小时", "rationale_vi": "马上卧床睡一个小时: Chuyên gia khuyên nên đứng dậy vận động 5 phút hoặc uống nước ấm, không khuyên đi ngủ ngay."},
        {"option_idx": 3, "option_text": "继续坚持长时间工作", "rationale_vi": "继续坚持长时间工作: Không phù hợp với lời khuyên khoa học về việc giải tỏa mệt mỏi."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Khi mệt mỏi, nhiều người uống trà đặc hoặc cà phê nhưng lạm dụng sẽ hại giấc ngủ. Chuyên gia khuyên đứng dậy vận động 5 phút hoặc uống nước ấm."';
      sampleAnswerRationale = '"适度活动并喝温水: Đoạn văn khuyên rõ [感到困倦时不妨站起来活动五分钟，或者喝一杯温开水]. Bẫy uống cà phê/trà đặc là thói quen cũ bị bác bỏ."';
    } else if (boundedLevel === 3) {
      sampleStem = JSON.stringify(
        "我爷爷今年七十多岁了，每天早上都坚持去公园打太极拳。他说，经常运动不仅身体健康，心情也会变得非常愉快。今天早上天气很好，他又早早地出门了。\n问：爷爷每天早上做什么？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"wǒ yé ye jīn nián qī shí duō suì le, měi tiān zǎo shang dōu jiān chí qù gōng yuán dǎ tài jí quán. tā shuō, jīng cháng yùn dòng bù jǐn shēn tǐ jiàn kāng, xīn qíng yě huì biàn de fēi cháng yú kuài. jīn tiān zǎo shang tiān qì hěn hǎo, tā yòu zǎo zǎo de chū mén le. wèn: yé ye měi tiān zǎo shang zuò shén me?"';
      sampleTargetVocab = '"坚持"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "在家里看电视", "rationale_vi": "在家里看电视: Không được nhắc đến, ông cụ ra công viên vận động."},
        {"option_idx": 2, "option_text": "去医院看医生", "rationale_vi": "去医院看医生: Ông cụ sức khỏe rất tốt nhờ tập luyện thường xuyên."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Ông nội hơn 70 tuổi, sáng nào cũng đi công viên tập Thái Cực Quyền để rèn luyện sức khỏe."';
      sampleAnswerRationale = '"去公园锻炼身体: Đoạn văn nêu rõ [每天早上都坚持去公园打太极拳]."';
    } else if (boundedLevel === 2) {
      sampleStem = JSON.stringify(
        "今天外面很冷，最高气温只有零下五度，出门一定要多穿一件衣服。\n问：今天天气怎么样？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"jīn tiān wài miàn hěn lěng, zuì gāo qì wēn zhǐ yǒu líng xià wǔ dù, chū mén yí dìng yào duō chuān yí jiàn yī fu. wèn: jīn tiān tiān qì zěn me yàng?"';
      sampleTargetVocab = '"冷"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "很热", "rationale_vi": "很热: Trái ngược với thông tin trong bài nói rằng bên ngoài rất lạnh."},
        {"option_idx": 2, "option_text": "下雨", "rationale_vi": "下雨: Bài nói chỉ đề cập nhiệt độ thấp và trời lạnh, không nói trời mưa."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Hôm nay ngoài trời rất lạnh, nhiệt độ cao nhất chỉ có âm năm độ, ra ngoài nhất định phải mặc thêm một cái áo."';
      sampleAnswerRationale = '"很冷: Bài nói nêu rõ [今天外面很冷]."';
    } else {
      sampleStem = JSON.stringify(
        "我在北京住了三年，我很喜欢这里的中国菜。\n问：他在北京住了几年？"
      );
      sampleCompletedStem = sampleStem;
      samplePinyin = '"wǒ zài běi jīng zhù le sān nián, wǒ hěn xǐ huan zhè lǐ de zhōng guó cài. wèn: tā zài běi jīng zhù le jǐ nián?"';
      sampleTargetVocab = '"住"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "一年", "rationale_vi": "一年: Không đúng với số năm trong bài nói (三年)."},
        {"option_idx": 2, "option_text": "两年", "rationale_vi": "两年: Không đúng với số năm trong bài nói (三年)."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Tôi sống ở Bắc Kinh được ba năm rồi, tôi rất thích món ăn Trung Quốc ở đây. Hỏi: Anh ấy đã sống ở Bắc Kinh mấy năm?"';
      sampleAnswerRationale = '"三年: Đoạn nói ngắn gọn nêu rõ [我在北京住了三年]. Toàn bộ từ vựng nằm trọn trong 150 từ cơ bản của HSK 1."';
    }
  } else if (
    partType === 'read_comprehension_4opt' ||
    partType === 'read_comprehension_passages_4opt' ||
    partType === 'read_comprehension_long_articles_4opt'
  ) {
    if (boundedLevel >= 5) {
      sampleStem = '"心理学研究表明，当人们面临过多选择时，反而更容易陷入决策疲劳，甚至最终放弃选择。这种现象在商业领域尤为明显。很多商家以为商品种类越丰富，顾客的购买欲望就越强，然而事实往往恰恰相反：过多的选项不仅增加了顾客的权衡成本，还会引发对错过更好选择的焦虑，从而降低消费满意度。★ 根据这段话，下列哪项正确？"';
      sampleCompletedStem = sampleStem;
      samplePinyin = '"xīn lǐ xué yán jiū biǎo míng, dāng rén men miàn lín guò duō xuǎn zé shí, fǎn ér gèng róng yì xiàn rù jué cè pí láo, shèn zhì zuì zhōng fàng qì xuǎn zé. zhè zhǒng xiàn xiàng zài shāng yè lǐng yù yóu wéi míng xiǎn. hěn duō shāng jiā yǐ wéi shāng pǐn zhǒng lèi yuè fēng fù, gù kè de gòu mǎi yù wàng jiù yuè qiáng, rán ér shì shí wǎng wǎng qià qià xiāng fǎn: guò duō de xuǎn xiàng bù jǐn zēng jiā le gù kè de quán héng chéng běn, hái huì yǐn fā duì cuò guò gèng hǎo xuǎn zé de jiāo lǜ, cóng ér jiàng dī xiāo fèi mǎn yì dù. gēn jù zhè duàn huà, xià liè nǎ xiàng zhèng què?"';
      sampleTargetVocab = '"往往"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "商品种类越多顾客越满意", "rationale_vi": "商品种类越多顾客越满意: Bẫy ngược nghĩa (因果相反). Đoạn văn nêu rõ nhiều lựa chọn khiến khách mệt mỏi, làm giảm mức độ hài lòng (降低消费满意度)."},
        {"option_idx": 2, "option_text": "面临选择时人们绝不会放弃", "rationale_vi": "面临选择时人们绝不会放弃: Bẫy tuyệt đối hóa (绝对化). Đoạn văn nói khi có quá nhiều lựa chọn, người ta thậm chí từ bỏ lựa chọn (甚至最终放弃选择)."},
        {"option_idx": 3, "option_text": "权衡成本高能促进消费欲望", "rationale_vi": "权衡成本高能促进消费欲望: Bẫy đánh tráo khái niệm (偷换概念). Chi phí cân nhắc tăng lên làm khách lo lắng và giảm sút sự hài lòng chứ không thúc đẩy ham muốn mua sắm."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nghiên cứu tâm lý chỉ ra khi có quá nhiều lựa chọn, con người dễ kiệt sức khi ra quyết định, thậm chí bỏ cuộc. Thương gia tưởng càng nhiều hàng hóa thì khách càng thích, nhưng thực tế quá nhiều lựa chọn làm tăng chi phí đắn đo và giảm độ thỏa mãn của khách."';
      sampleAnswerRationale = '"选项过多容易增加决策难度: Đoạn văn chứng minh việc có quá nhiều phương án làm tăng chi phí cân nhắc và gây mệt mỏi khi quyết định."';
    } else if (boundedLevel === 4) {
      sampleStem = '"很多人以为只有遇到大挫折才会感到压力，其实日常生活中不断积累的小麻烦，对心理健康的负面影响往往更加严重。如果不能及时找到合适的方法进行调整，就容易让人产生焦虑和疲惫感。★ 根据这段话，下列哪项正确？"';
      sampleCompletedStem = sampleStem;
      samplePinyin = '"hěn duō rén yǐ wéi zhǐ yǒu yù dào dà cuò zhé cái huì gǎn dào yā lì, qí shí rì cháng shēng huó zhōng bú duàn jī lěi de xiǎo má fan, duì xīn lǐ jiàn kāng de fù miàn yǐng xiǎng wǎng wǎng gèng jiā yán zhòng. rú guǒ bù néng jí shí zhǎo dào hé shì de fāng fǎ jìn xíng tiáo zhěng, jiù róng yì ràng rén chǎn shēng jiāo lǜ hé pí bèi gǎn. gēn jù zhè duàn huà, xià liè nǎ xiàng zhèng què?"';
      sampleTargetVocab = '"压力"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "只有大挫折才会带来心理压力", "rationale_vi": "只有大挫折才会带来心理压力: Bẫy tuyệt đối hóa. Đoạn văn chỉ rõ nhiều người lầm tưởng như vậy, thực tế rắc rối nhỏ tích tụ còn nghiêm trọng hơn."},
        {"option_idx": 2, "option_text": "生活中的小麻烦完全没有影响", "rationale_vi": "生活中的小麻烦完全没有影响: Ngược với nội dung đoạn văn [对心理健康的负面影响往往更加严重]."},
        {"option_idx": 3, "option_text": "遇到困难时绝不需要主动调整", "rationale_vi": "遇到困难时绝不需要主动调整: Đoạn văn nhấn mạnh cần kịp thời tìm phương pháp phù hợp để điều chỉnh [及时找到合适的方法进行调整]."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Nhiều người tưởng chỉ có biến cố lớn mới gây áp lực, thực ra rắc rối nhỏ nhặt tích tụ hàng ngày lại ảnh hưởng tâm lý nghiêm trọng hơn. Cần kịp thời điều chỉnh để tránh mệt mỏi và lo âu."';
      sampleAnswerRationale = '"日常小麻烦也会带来严重影响: Đoạn văn khẳng định rắc rối nhỏ tích lũy hàng ngày có ảnh hưởng tiêu cực nghiêm trọng đến tâm lý."';
    } else {
      sampleStem = '"王经理工作十分认真，每天都工作到很晚，几乎没有时间休息。★ 关于王经理，可以知道什么？"';
      sampleCompletedStem = sampleStem;
      samplePinyin = '"wáng jīng lǐ gōng zuò shí fēn rèn zhēn, měi tiān dōu gōng zuò dào hěn wǎn, jī hū méi yǒu shí jiān xiū xi. guān yú wáng jīng lǐ, kě yǐ zhī dào shén me?"';
      sampleTargetVocab = '"认真"';
      sampleRationales = `[
        {"option_idx": 1, "option_text": "喜欢运动", "rationale_vi": "喜欢运动: Đoạn văn không hề nhắc tới sở thích thể thao của Vương giám đốc."},
        {"option_idx": 2, "option_text": "经常迟到", "rationale_vi": "经常迟到: Trái ngược với thực tế Vương giám đốc làm việc rất chăm chỉ, cẩn thận."},
        {"option_idx": 3, "option_text": "工作轻松", "rationale_vi": "工作轻松: Trái ngược với việc ông phải làm việc đến rất muộn và hầu như không có thời gian nghỉ ngơi."}
      ]`;
      sampleExplanationSummary = '"Dịch nghĩa: Vương giám đốc làm việc rất nghiêm túc, ngày nào cũng làm đến rất muộn, hầu như không có thời gian nghỉ ngơi. ★ Về Vương giám đốc, có thể biết được điều gì? Đáp án là rất bận rộn (十分繁忙)."';
      sampleAnswerRationale = '"十分繁忙: Đoạn văn miêu tả [每天都工作到很晚，几乎没有时间休息], diễn đạt đồng nghĩa tổng quát là rất bận rộn (十分繁忙)."';
    }
  } else if (boundedLevel === 1) {
    sampleStem = '"我想去商店买两本____。"';
    sampleCompletedStem = '"我想去商店买两本书。"';
    samplePinyin = '"wǒ xiǎng qù shāng diàn mǎi liǎng běn shū."';
    sampleTargetVocab = '"书"';
    sampleRationales = expectedOptions === 3
      ? `[
      {"option_idx": 1, "option_text": "水", "rationale_vi": "水: Lượng từ '本' dùng cho sách vở, không dùng cho đồ uống như '水'."},
      {"option_idx": 2, "option_text": "茶", "rationale_vi": "茶: Lượng từ '本' không thể đi với '茶', '茶' dùng lượng từ '杯'."}
    ]`
      : (expectedOptions === 6
          ? `[
      {"option_idx": 1, "option_text": "水", "rationale_vi": "水: Lượng từ '本' dùng cho sách vở, không dùng cho đồ uống như '水'."},
      {"option_idx": 2, "option_text": "茶", "rationale_vi": "茶: Lượng từ '本' không thể đi với '茶', '茶' dùng lượng từ '杯'."},
      {"option_idx": 3, "option_text": "苹果", "rationale_vi": "苹果: Lượng từ '本' không dùng cho hoa quả, '苹果' dùng lượng từ '个'."},
      {"option_idx": 4, "option_text": "飞机", "rationale_vi": "飞机: Lượng từ '本' không dùng cho máy bay, '飞机' dùng lượng từ '架'."},
      {"option_idx": 5, "option_text": "学校", "rationale_vi": "学校: Lượng từ '本' không dùng cho trường học, '学校' dùng lượng từ '所'."}
    ]`
          : `[
      {"option_idx": 1, "option_text": "水", "rationale_vi": "水: Lượng từ '本' dùng cho sách vở, không dùng cho đồ uống như '水'."},
      {"option_idx": 2, "option_text": "茶", "rationale_vi": "茶: Lượng từ '本' không thể đi với '茶', '茶' dùng lượng từ '杯'."},
      {"option_idx": 3, "option_text": "苹果", "rationale_vi": "苹果: Lượng từ '本' không dùng cho hoa quả, '苹果' dùng lượng từ '个'."}
    ]`);
    sampleExplanationSummary = '"Dịch nghĩa: Tôi muốn đến cửa hàng mua hai cuốn sách."';
    sampleAnswerRationale = '"书: Đi kèm với lượng từ [本] (cuốn/quyển) để chỉ sách vở."';
  } else if (boundedLevel === 2) {
    sampleStem = '"门外太冷了，你快____来吧。"';
    sampleCompletedStem = '"门外太冷了，你快进来吧。"';
    samplePinyin = '"mén wài tài lěng le, nǐ kuài jìn lái ba."';
    sampleTargetVocab = '"进"';
    sampleRationales = expectedOptions === 3
      ? `[
      {"option_idx": 1, "option_text": "走", "rationale_vi": "走: Không kết hợp thành cụm xu hướng thích hợp khi yêu cầu vào trong nhà."},
      {"option_idx": 2, "option_text": "出", "rationale_vi": "出: '出来' có nghĩa là ra ngoài, trái với ngữ cảnh bên ngoài đang lạnh."}
    ]`
      : (expectedOptions === 6
          ? `[
      {"option_idx": 1, "option_text": "走", "rationale_vi": "走: Không kết hợp thành cụm xu hướng thích hợp khi yêu cầu vào trong nhà."},
      {"option_idx": 2, "option_text": "出", "rationale_vi": "出: '出来' có nghĩa là ra ngoài, trái với ngữ cảnh bên ngoài đang lạnh."},
      {"option_idx": 3, "option_text": "跑", "rationale_vi": "跑: '跑来' chỉ chạy lại đây, không diễn đạt rõ hành động vào trong nhà để tránh lạnh."},
      {"option_idx": 4, "option_text": "买", "rationale_vi": "买: '买' có nghĩa là mua, không kết hợp với '来' trong ngữ cảnh tránh rét."},
      {"option_idx": 5, "option_text": "看", "rationale_vi": "看: '看' có nghĩa là nhìn/xem, không diễn đạt hành động vào nhà."}
    ]`
          : `[
      {"option_idx": 1, "option_text": "走", "rationale_vi": "走: Không kết hợp thành cụm xu hướng thích hợp khi yêu cầu vào trong nhà."},
      {"option_idx": 2, "option_text": "出", "rationale_vi": "出: '出来' có nghĩa là ra ngoài, trái với ngữ cảnh bên ngoài đang lạnh."},
      {"option_idx": 3, "option_text": "跑", "rationale_vi": "跑: '跑来' chỉ chạy lại đây, không diễn đạt rõ hành động vào trong nhà để tránh lạnh."}
    ]`);
    sampleExplanationSummary = '"Dịch nghĩa: Ngoài cửa lạnh quá, bạn mau vào đây đi."';
    sampleAnswerRationale = '"进: Kết hợp với [来] tạo thành bổ ngữ xu hướng [进来] (vào đây), phù hợp ngữ cảnh tránh rét."';
  }

  return `You are Minnese's Chief HSK Exam Architect, certified by CLEC/CTI under the HSK 3.0 Standard (2021).
Your mission is to generate exactly ${count} authentic, blueprint-compliant HSK Level ${boundedLevel} exam questions.

======================================================================
1. HSK LEVEL ${boundedLevel} SPECIFICATIONS (HSK 3.0 Standard)
======================================================================
- Vocabulary Band: ${spec.wordCountTarget}
- Character Band: ${spec.hanziTarget}
- Linguistic Scope: ${spec.scopeDescription}
- CUMULATIVE VOCABULARY SCOPE POLICY:
  * Generating for HSK ${boundedLevel}.
  * Allowed vocabulary: All verified headwords from HSK 1 up to HSK ${boundedLevel}.
  * PROHIBITION: Do NOT use vocabulary from HSK ${boundedLevel + 1} or higher. Any over-level word will cause immediate rejection by automated quality gates.
- Core Grammar Benchmark for Level ${boundedLevel}:
  ${grammarGuideline}${grammarInstruction}${topicInstruction}${listeningDistractorGuidance}
- MANDATORY TARGET VOCABULARY SELECTION (DIVERSITY MANDATE):
  * You MUST construct questions specifically testing words from this priority UNTESTED syllabus list:
    ${vocabListStr}
  * For EACH question in this batch, select a DIFFERENT target word from the list above as the correct answer choice (options[answer_idx]).
  * AVOID REPETITION: DO NOT default to repetitive clichés like "猫" (cat), "狗" (dog), "书" (book), "喝水/喝茶" (drink water/tea), or "打电话" (make a call) unless that specific word is in the target list above. Expand vocabulary breadth across diverse topics, actions, adjectives, and daily contexts.
${topicVocabContext}
${grammarGuidance}
======================================================================
2. QUESTION FORMAT & PART TYPE
======================================================================
${typeInstructions}

======================================================================
3. CRITICAL DISTRACTOR & SCHEMA QUALITY RULES (STRICT AUDIT)
======================================================================
${
  isWriting
    ? `1. OPEN-ENDED WRITING (0 OPTIONS):
   - "options" MUST be an empty array [] ("options" MUST be strictly an empty array: []).
   - Do NOT provide multiple-choice options or distractors.
   - "answer_idx" MUST be 0.

2. WRITING PROMPT & CONTEXT INTEGRITY:
   - "stem" must provide a rich, clear prompt, topic statement, or contextual instruction.
   - Any required keywords must be explicitly marked within brackets (e.g. [坚持, 成功, 经验]).`
    : `1. EXACTLY ${expectedOptions} DISTINCT OPTIONS:
   - "options" MUST contain exactly ${expectedOptions} non-empty, unique strings.
   - For word-bank or matching tasks, repeat the same shared choice bank in every question in this generated batch.
   ${usesImageOptions ? `- "options_images" MUST contain exactly ${expectedOptions} distinct allowed SVG theme keys, one per image choice.\n   - These labels are for reviewer metadata; exam mode displays only the images and A-F labels.` : ''}
   - Exactly 1 option is the grounded, undeniable correct answer.
   - "answer_idx" MUST be the exact integer index of the correct answer (0 through ${Math.max(0, expectedOptions - 1)}).

2. SAME PART-OF-SPEECH (POS) DISTRACTORS & MANDATORY CONTEXTUAL DISAMBIGUATION:
   - Provide exactly ${Math.max(0, expectedOptions - 1)} distractors. For text-choice tasks, distractors must match the correct answer's part of speech.
   ${usesImageOptions ? '- For picture-choice tasks, use exactly one Chinese reviewer label per image and ensure the images are distinct; do not expose the correct choice in the spoken/printed stem.' : ''}
   ${tierInstructions ? `\n   ${tierInstructions}\n` : ''}${trapInstructions ? `\n   ${trapInstructions}\n` : ''}
   - Distractors must be plausible, authentic traps, but undeniably excluded by the context token.
   - UNIVERSAL CONTEXTUAL DISAMBIGUATION (STRICT ENFORCEMENT):
     * The stem MUST contain sufficient situational, relational, temporal, contrastive, or arithmetic clues so that EXACTLY ONE option is natural and correct.
     * NEVER generate open/underspecified stems where multiple options could be plausible.
     * ALL ${expectedOptions} OPTIONS MUST BE COMPLETELY DISTINCT UNIQUE WORDS (never repeat the same word or character in multiple options; e.g. NEVER ["不", "没", "不", "很"]).
     * When testing numbers, quantifiers, synonyms, or actions, provide definitive context that rules out all distractors (e.g. for numbers: '小明上午借了1本书，下午又借了1本，今天他借了____本书。' -> 两; or '这不是第一名，是第____名。' -> 二).
     * If two or more options make a natural sentence, add distinguishing context or replace options; never rely on likelihood alone.
   - CONCISE VIETNAMESE EXPLANATIONS & RATIONALES (TOKEN EFFICIENCY):
     * Keep 'explanation_summary_vi' and 'answer_rationale_vi' concise, clear, and direct (1-2 sentences each).
     * For each item in 'distractor_rationales', write exactly 1 concise sentence explaining why that specific choice fails in this context (e.g. '二: Đứng trước lượng từ "本" để biểu thị số lượng 2 phải dùng "两", không dùng "二".').
     * Do NOT write repetitive long paragraphs; concise and grammatically precise rationales are strictly preferred.
   - CLASSIFIER-NOUN COLLOCATIONS & DISTRACTOR VALIDITY:
     * When testing measure words (量词, e.g. "我有两____铅笔。"), the correct answer MUST strictly pair with the noun (e.g. 笔/铅笔 -> 支/枝; 书/词典 -> 本; 衣服 -> 件; 苹果 -> 个; 桌子/照片 -> 张; 猫/狗 -> 只; 水/茶 -> 杯/瓶).
     * NEVER generate invalid collocations such as "三本笔" or "这杯茶很好吃".
     * Distractors must be real measure words for OTHER nouns, so that exactly ONE option is valid in context.
     * The Vietnamese explanation must discuss the ACTUAL object in the stem (e.g. if stem has 笔, discuss 笔, do NOT discuss 书).
   - VOCABULARY LEVEL DISCIPLINE (HSK ${boundedLevel}):
     * Every word in stem, options, target, and completed sentence MUST strictly belong to HSK ${boundedLevel} or below. Under HSK 1, words like 每 (HSK 2), 笔 (HSK 2), 张 (HSK 3) are strictly prohibited.
   - Do not use interchangeable options from the same semantic class unless the context clearly distinguishes them. Self-review does not replace backend validation or human review.`
}

3. ABSOLUTE LANGUAGE PURITY & ZERO STEM LEAKAGE (CRITICAL):
   - "stem" and "options" MUST contain ONLY Chinese characters, Chinese punctuation, numbers, and "____".
   - NEVER include any Latin letters (a-z, A-Z) or Vietnamese words inside "stem" or "options".
   - NEVER include bracketed hints such as (đáp án A), (gợi ý), (答案), or (hint) in the stem.
   - ZERO STEM ANSWER LEAKAGE (MANDATORY): For fill-in-the-blank questions ("____"), the correct answer choice string MUST NEVER appear anywhere in the stem sentence outside the blank placeholder "____"! (e.g. NEVER write "每天在学校学习，下午去____" with answer "学习").

4. COMPLETED STEM INTEGRITY & DISTINCTION (REQUIRED):
   - For fill-in-the-blank tasks (e.g. read_fill_blank_4opt, read_fill_blank_word_bank_6opt):
     * "stem" MUST contain the single "____" placeholder.
     * Construct "completed_stem" by replacing the "____" in "stem" with EXACTLY "options[answer_idx]".
     * NEVER leave "____" or empty placeholders inside "completed_stem".
     * Literal substitution only: do not add, remove, reorder, or alter any other character or word.
   - For reading comprehension tasks (e.g. read_comprehension_short_3opt, read_comprehension_4opt):
     * "stem" has NO blank placeholder and MUST NOT contain "____".
     * "completed_stem" MUST be exactly identical to "stem".
   - Provide tone-marked Pinyin for that exact completed sentence. Do not add, omit, or infer Chinese words in Pinyin.
   - Check that every Pinyin syllable maps to a character/word in the completed sentence.

5. COMPLETED-SENTENCE NATURALNESS REVIEW (REQUIRED):
   - Reconstruct the completed sentence before writing the options and read it as natural Mandarin, not merely guessable from the options.
   - If it needs an unprovided word (for example 的, 很, 是, or a measure word), revise the stem/options before returning it.
   - Return "naturalness_review" with status "natural" only after this check; use "unnatural" if it remains awkward or incomplete. Give a concise Vietnamese rationale.

6. STRUCTURED VIETNAMESE RATIONALES:
   - Return "explanation_summary_vi" and "answer_rationale_vi" as complete Vietnamese text.
   - "distractor_rationales" must contain exactly one object for every wrong option and none for the correct option. Each object has the exact zero-based "option_idx", exact matching "option_text" copied from options, and a concise "rationale_vi" explaining why that specific option fails in this context (must explicitly include the Chinese option text, e.g. "好看: ...").
   - Do not include A/B/C/D labels or name other options in rationale_vi; the backend generates the final labeled explanation from the option indices and actual options. Never invent, rename, omit, or reorder option text in rationales.
   - Complete a final self-check: grammar/naturalness, exactly one defensible answer, option-index/text alignment, complete rationales, and pinyin for the exact literal completed_stem. This self-check never replaces backend validation or human review.
   - Every Vietnamese field must be complete, coherent, and end with suitable punctuation. Output truncation is not acceptable.

7. 27 ALLOWED SVG ILLUSTRATION THEMES:
   - If a picture-choice task has "options_images", use null for "illustration_theme"; do not assign a shared scene to all choices.
   - Otherwise, if part_type is picture-based, "illustration_theme" MUST be strictly one of these 27 keys:
     ${VALID_ILLUSTRATION_THEMES.join(', ')}
   - For non-picture questions, "illustration_theme" MUST be null.

======================================================================
4. JSON OUTPUT CONTRACT
======================================================================
Output ONLY a strictly valid JSON object containing EXACTLY ${count} question objects in its "questions" array.
CRITICAL: The "questions" array MUST have length === ${count}. Generate all ${count} unique, distinct questions in this single JSON response!
CRITICAL ORIGINALITY & DIVERSITY:
- The example in the schema below is STRICTLY for demonstrating JSON structure and formatting.
- DO NOT copy, reuse, or paraphrase the example sentences, characters, or scenario!
- Generate 100% original, brand-new Chinese sentences across diverse topics (workplace, daily life, nature, study, travel, health, technology).
No markdown wrappers, no commentary, no trailing commas.

SCHEMA (containing ${count} distinct items in "questions"):
{
  "questions": [
  {
    "stem": ${
      partType === 'read_comprehension_short_3opt'
        ? '"我上午去学校看书。★ 我什么时候去学校？"'
        : sampleStem
    },
    "completed_stem": ${
      partType === 'read_comprehension_short_3opt'
        ? '"我上午去学校看书。★ 我什么时候去学校？"'
        : sampleCompletedStem
    },
    "options": ${
      isWriting
        ? '[]'
        : (partType === 'read_comprehension_short_3opt'
            ? JSON.stringify(['上午', '下午', '晚上'])
            : JSON.stringify(exampleOptions))
    },
    "options_images": ${JSON.stringify(usesImageOptions ? exampleImageOptions : [])},
    "answer_idx": 0,
    "pinyin": ${
      partType === 'read_comprehension_short_3opt'
        ? '"wǒ shàng wǔ qù xué xiào kàn shū. wǒ shén me shí hou qù xué xiào?"'
        : samplePinyin
    },
    "difficulty_tier": "${difficultyTier || (boundedLevel >= 5 ? 'tier2_very_difficult' : (boundedLevel >= 3 ? 'tier1_difficult' : 'tier1_difficult'))}",
    "trap_type": "${trapType || (partType.startsWith('listen_') ? (boundedLevel >= 5 ? 'anti_verbatim' : 'self_correction') : (partType.startsWith('read_comprehension') ? (boundedLevel >= 5 ? 'anti_verbatim' : 'context_scope') : 'collocation'))}",
    "target_grammar": "${targetGrammar || (boundedLevel >= 5 ? '复句逻辑与转折关联词 (与其...不如...)' : (partType === 'listen_dialogue_qa_4opt' ? '时间状语与转折复句' : (partType.startsWith('read_comprehension') ? '同义转述与态度推断' : '基本SVO与处所词')))}",
    "target_vocabulary": ${isWriting ? '"缓解"' : (partType === 'read_comprehension_short_3opt' ? '"上午"' : sampleTargetVocab)},
    "distractor_rationales": ${
      isWriting
        ? '[]'
        : (partType === 'read_comprehension_short_3opt'
            ? `[
      {"option_idx": 1, "option_text": "下午", "rationale_vi": "Văn bản nêu rõ thời gian là buổi sáng (上午), không phải buổi chiều (下午)."},
      {"option_idx": 2, "option_text": "晚上", "rationale_vi": "Văn bản nêu rõ thời gian là buổi sáng (上午), không phải buổi tối (晚上)."}
    ]`
            : sampleRationales)
    },
    "naturalness_review": {"status":"natural","rationale_vi":"Câu hoàn chỉnh tự nhiên, đúng trật tự từ và đủ thành phần trong ngữ cảnh."},
    "explanation_summary_vi": ${
      partType === 'read_comprehension_short_3opt'
        ? '"Dịch nghĩa: Tôi buổi sáng đến trường đọc sách. ★ Tôi khi nào đến trường? Đáp án là buổi sáng (上午)."'
        : sampleExplanationSummary
    },
    "answer_rationale_vi": ${
      partType === 'read_comprehension_short_3opt'
        ? '"Đoạn văn nêu rõ hoạt động diễn ra vào buổi sáng (上午)."'
        : sampleAnswerRationale
    },
    "level": ${boundedLevel},
    "skill": "${skill === 'all' ? (isWriting ? 'writing' : (partType.startsWith('listen_') ? 'listening' : 'reading')) : skill}",
    "part_type": "${partType}",
    "illustration_theme": ${
      (partType === 'listen_true_false_2opt' || partType === 'read_true_false_2opt' || partType === 'write_sentence_from_picture_word') && boundedLevel <= 2
        ? '"taxi"'
        : 'null'
    },
    "topic": ${topic ? JSON.stringify(topic.trim()) : 'null'}
  }
  ]
}`;
}
