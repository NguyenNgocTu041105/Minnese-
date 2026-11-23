/**
 * Custom Exam Sets ("Kho Đề Của Tôi") & Instant CBT Converter (R5)
 *
 * Converts imported/parsed questions (from raw text, Gemini/DeepSeek/Claude/Grok chat output,
 * or .xlsx/.csv/.docx/.pdf files) into interactive Computer-Based Test (CBT) sessions
 * compatible with HSKMockExam.tsx.
 *
 * Also manages persistent Custom Exam Sets in localStorage (`minnese_custom_exam_sets_v1`)
 * and optional backend API (`/api/custom-exams`) without ever touching operational SQLite DBs.
 */

import { HSKExamQuestion } from '../data/hskMockExamFixtures';
import { getExamDurationMinutes } from '../components/HSKMockExam';
import { splitHanziAndPinyin, getSentencePinyin } from './pinyinUtils';

export const STORAGE_KEY_CUSTOM_EXAM_SETS = 'minnese_custom_exam_sets_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CustomExamSet {
  id: string;
  title: string;
  level: number;
  source: string;
  sourceLabel: string;
  timeLimitMinutes: number;
  questionCount: number;
  difficultyTier?: 'easy' | 'medium' | 'hard';
  difficultyScore?: number;
  difficultyLabelVi?: string;
  difficultyMetrics?: {
    avgStemHanzi?: number;
    avgOptionHanzi?: number;
    uniqueHanziCount?: number;
    longPassageCount?: number;
    multiTurnCount?: number;
    rawScore?: number;
  } | null;
  createdAt: string;
  questions: HSKExamQuestion[];
}

/**
 * Converts a single imported/parsed question object into a playable HSKExamQuestion
 * for the Computer-Based Test (CBT) studio.
 */
export function convertImportedToCbtQuestion(
  raw: any,
  index: number,
  defaultLevel: number = 1
): HSKExamQuestion {
  const level = Number(raw.level) >= 1 && Number(raw.level) <= 6 ? Number(raw.level) : defaultLevel;
  const rawStem = String(raw.stem || '').trim();
  const { hanzi: cleanStemHanzi, pinyin: inlineStemPinyin } = splitHanziAndPinyin(rawStem);
  const stem = cleanStemHanzi || rawStem;
  const pinyinStem =
    String(raw.pinyin || raw.pinyin_stem || inlineStemPinyin || '').trim() ||
    getSentencePinyin(stem);

  const isWritingTask =
    raw.skill === 'writing' ||
    raw.section === 'writing' ||
    Boolean(raw.part_type && String(raw.part_type).startsWith('write_'));

  const rawOptions: string[] = Array.isArray(raw.options)
    ? raw.options.map((o: any) => String(o ?? '').trim())
    : isWritingTask
    ? []
    : ['✓ 对 (Đúng)', '✗ 错 (Sai)'];

  const options: string[] = [];
  const optionsPinyin: string[] = [];

  const isTrueFalsePair =
    rawOptions.length === 2 &&
    rawOptions.some((o) => /Đúng|对|√|True/i.test(o)) &&
    rawOptions.some((o) => /Sai|错|×|False/i.test(o));

  if (isTrueFalsePair) {
    options.push('✓ 对 (Đúng)', '✗ 错 (Sai)');
    optionsPinyin.push('duì', 'cuò');
  } else {
    for (let i = 0; i < rawOptions.length; i++) {
      const opt = rawOptions[i].replace(/^[A-F][.、)\s]+/, '').trim();
      const { hanzi, pinyin } = splitHanziAndPinyin(opt);
      const letter = String.fromCharCode(65 + i);
      const cleanChoice = hanzi || opt;
      const formattedChoice =
        rawOptions.length >= 5 && !/^[A-F]\.\s/.test(cleanChoice)
          ? `${letter}. ${cleanChoice}`
          : cleanChoice;
      options.push(formattedChoice);
      optionsPinyin.push(pinyin || getSentencePinyin(cleanChoice));
    }
  }

  const answerIndex =
    typeof raw.answer_idx === 'number'
      ? raw.answer_idx
      : typeof raw.answer_index === 'number'
      ? raw.answer_index
      : 0;

  const hasDialogueMarkers = /(?:^|\s|\n)(男|女|A|B)\s*[:：]/.test(stem);
  const rawSkill = String(raw.skill || raw.section || '').toLowerCase();
  const section: 'listening' | 'reading' | 'writing' =
    rawSkill === 'listening' || raw.part_type?.startsWith('listen_')
      ? 'listening'
      : rawSkill === 'writing' || raw.part_type?.startsWith('write_')
      ? 'writing'
      : rawSkill === 'reading' || raw.part_type?.startsWith('read_')
      ? 'reading'
      : hasDialogueMarkers
      ? 'listening'
      : 'reading';

  let partType = String(raw.part_type || '').trim();
  if (!partType) {
    if (options.length === 2) {
      partType = section === 'listening' ? 'listen_true_false_2opt' : 'read_true_false_2opt';
    } else if (options.length === 5) {
      partType = stem.includes('____') ? 'read_word_bank_5opt' : 'read_sentence_match_5opt';
    } else {
      partType = section === 'listening' ? 'listen_dialogue_qa_4opt' : 'read_fill_blank_4opt';
    }
  }

  // Ensure listening questions have audio_text so the multi-voice AI player speaks them
  const audioText =
    section === 'listening'
      ? String(raw.audio_text || stem).trim()
      : raw.audio_text
      ? String(raw.audio_text).trim()
      : undefined;

  return {
    id: String(raw.id || `cbt_q_${Date.now()}_${index + 1}`),
    level,
    section,
    part_type: partType,
    item_number: index + 1,
    stem,
    pinyin_stem: pinyinStem,
    options,
    options_pinyin: optionsPinyin,
    answer_index: Math.max(0, Math.min(options.length - 1, answerIndex)),
    explanation_vi:
      String(raw.explanation_vi || raw.answer_rationale_vi || '').trim() ||
      (options.length > 0 ? `Đáp án đúng là ${options[answerIndex] || options[0]}.` : ''),
    audio_text: audioText,
    audio_url: raw.audio_url || undefined,
    image_url: raw.image_url || raw.illustration_resolved_url || undefined,
    passage: raw.passage || undefined,
    illustration: raw.illustration || raw.illustration_theme || undefined,
    options_images: Array.isArray(raw.options_images) ? raw.options_images : undefined,
  };
}

/**
 * Detects top 2-3 Vietnamese topic labels from Chinese question stems/options (0-API).
 */
const TOPIC_KEYWORD_BUCKETS: Array<{ label: string; regex: RegExp }> = [
  { label: 'Học tập & Giáo dục', regex: /学校|老师|学生|考试|作业|大学|图书馆|课程|专业|毕业|学习|汉语|教育|留学/g },
  { label: 'Công việc & Sự nghiệp', regex: /公司|经理|同事|会议|工作|上班|加班|老板|面试|项目|职业|办公室|实习|职场/g },
  { label: 'Du lịch & Giao thông', regex: /旅游|飞机|机场|火车|高铁|地铁|公交|出租车|酒店|机票|风景|景点|护照|旅行|自驾/g },
  { label: 'Ẩm thực & Mua sắm', regex: /餐厅|饭馆|菜单|咖啡|水果|超市|打折|价格|衣服|外套|牛奶|做饭|美食|商场|购物/g },
  { label: 'Sức khỏe & Y học', regex: /医院|医生|感冒|发烧|吃药|身体|健康|营养|睡眠|饮食|预防|病人|治疗|养生/g },
  { label: 'Thể thao & Giải trí', regex: /锻炼|跑步|运动|健身|游泳|足球|篮球|爬山|电影|音乐会|演出|吉他|摄影|旅游/g },
  { label: 'Gia đình & Bạn bè', regex: /爸爸|妈妈|父母|爷爷|奶奶|哥哥|姐姐|弟弟|妹妹|朋友|邻居|结婚|生日|聚会|家庭/g },
  { label: 'Công nghệ & AI', regex: /电脑|手机|网络|软件|人工智能|算法|数据|智能|互联网|机器人|自动化|科技|芯片/g },
  { label: 'Kinh doanh & Tài chính', regex: /经济|市场|消费|银行|投资|理财|创业|品牌|企业|盈利|商业|客户|成本|电商/g },
  { label: 'Môi trường & Sinh thái', regex: /环境|环保|生态|气候|垃圾|能源|绿色|污染|森林|海洋|碳|节约|低碳|自然/g },
  { label: 'Nhà ở & Đô thị', regex: /房子|租房|小区|社区|城市|建筑|交通|公园|广场|设施|搬家|装修|房东|都市/g },
  { label: 'Văn hóa & Di sản', regex: /博物馆|历史|文化|文物|传统|古迹|书法|京剧|茶道|艺术|遗产|民俗|工艺/g },
  { label: 'Lễ hội & Phong tục', regex: /春节|中秋|端午|节日|习俗|饺子|月饼|红包|过年|庆祝|假期|传统节日/g },
  { label: 'Tâm lý & Cảm xúc', regex: /心理|压力|情绪|幸福|焦虑|自信|坚持|沟通|习惯|心态|耐心|鼓励|成长/g },
  { label: 'Truyền thông & Đọc sách', regex: /阅读|读书|书籍|新闻|媒体|短视频|文章|出版|记者|广播|专栏|信息|深度/g },
  { label: 'Thiên nhiên & Thú cưng', regex: /动物|小猫|小狗|宠物|植物|花|树|鸟|天气|季节|春天|秋天|下雨|阳光/g },
  { label: 'Xã hội & Cộng đồng', regex: /社会|志愿|公益|法律|规定|政策|安全|公民|合作|养老|信任|服务|公共/g },
  { label: 'Khoa học & Khám phá', regex: /科学|研究|实验|发现|技术|探索|太空|海洋|地理|物理|医学|创新|发明/g },
];

export function detectExamThemesVi(questions: any[]): string {
  const qs = Array.isArray(questions) ? questions : [];
  if (qs.length === 0) return 'Giao tiếp & Đời sống';
  const combined = qs
    .map((q) => `${q?.stem || ''} ${q?.passage || ''} ${Array.isArray(q?.options) ? q.options.join(' ') : ''}`)
    .join(' ');
  const scored = TOPIC_KEYWORD_BUCKETS.map((b) => ({
    label: b.label,
    hits: (combined.match(b.regex) || []).length,
  }))
    .filter((x) => x.hits >= 2)
    .sort((a, b) => b.hits - a.hits);

  if (scored.length === 0) return 'Giao tiếp & Đời sống';
  const top = scored.slice(0, 2).map((x) => x.label.split(' & ')[0]);
  if (scored.length >= 3) {
    return `${top[0]}, ${top[1]} & ${scored[2].label.split(' & ')[0]}`;
  }
  if (scored.length === 2) {
    return `${top[0]} & ${top[1]}`;
  }
  return scored[0].label;
}

/**
 * Generates an official catalog-matching title such as:
 * "Đề Thi Thử HSK 3 (3.0) — Đề số 25 (Công việc, Học tập & Du lịch - 80 câu)"
 */
export function suggestOfficialExamTitle(params: {
  level: number;
  questions: any[];
  existingSets?: Array<{ level: number; title?: string }>;
  topic?: string;
  difficultyTier?: 'auto' | 'easy' | 'medium' | 'hard';
}): string {
  const level = Math.min(6, Math.max(1, Number(params.level) || 1));
  const qs = Array.isArray(params.questions) ? params.questions : [];
  const sameLevelSets = (params.existingSets || []).filter((s) => Number(s.level) === level);

  let maxNum = 0;
  for (const s of sameLevelSets) {
    const m = String(s.title || '').match(/Đề\s*số\s*(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxNum) maxNum = n;
    }
  }
  const nextNum = Math.max(maxNum + 1, sameLevelSets.length + 1);
  const numStr = String(nextNum).padStart(2, '0');

  // Detect if single-skill exam vs full mixed mock exam
  const skillSet = new Set(
    qs.map((q) => {
      const sk = String(q?.section || q?.skill || '').toLowerCase();
      if (sk === 'listening' || String(q?.part_type || '').startsWith('listen_')) return 'listening';
      if (sk === 'writing' || String(q?.part_type || '').startsWith('write_')) return 'writing';
      return 'reading';
    })
  );
  const prefix =
    skillSet.size === 1 && skillSet.has('listening')
      ? `Đề Luyện Nghe HSK ${level} (3.0)`
      : skillSet.size === 1 && skillSet.has('reading')
      ? `Đề Luyện Đọc HSK ${level} (3.0)`
      : skillSet.size === 1 && skillSet.has('writing')
      ? `Đề Luyện Viết HSK ${level} (3.0)`
      : `Đề Thi Thử HSK ${level} (3.0)`;

  const cleanTopic = (params.topic || '').trim();
  const theme = cleanTopic || detectExamThemesVi(qs);
  const tierPrefix =
    params.difficultyTier === 'easy'
      ? 'Khởi động: '
      : params.difficultyTier === 'hard'
      ? 'Thử thách: '
      : '';

  return `${prefix} — Đề số ${numStr} (${tierPrefix}${theme} - ${qs.length} câu)`;
}

/**
 * Converts an array of imported items or candidate questions into a CustomExamSet.
 */
export function createCustomExamSet(params: {
  id?: string;
  title: string;
  level: number;
  source?: string;
  sourceLabel?: string;
  timeLimitMinutes?: number;
  difficultyTier?: 'easy' | 'medium' | 'hard';
  difficultyScore?: number;
  rawQuestions: any[];
}): CustomExamSet {
  const level = Math.min(6, Math.max(1, Number(params.level) || 1));
  const questions = (params.rawQuestions || []).map((item, idx) => {
    const qObj = item?.question ? item.question : item;
    return convertImportedToCbtQuestion(qObj, idx, level);
  });

  const timeLimitMinutes =
    params.timeLimitMinutes && params.timeLimitMinutes > 0
      ? params.timeLimitMinutes
      : getExamDurationMinutes(level);

  const resolvedSource = (params.sourceLabel || params.source || 'Multi-Source Import').trim();
  const explicitTier =
    params.difficultyTier === 'easy' || params.difficultyTier === 'medium' || params.difficultyTier === 'hard'
      ? params.difficultyTier
      : undefined;
  const defaultTierScore =
    explicitTier === 'easy' ? 28 : explicitTier === 'medium' ? 58 : explicitTier === 'hard' ? 84 : undefined;

  return {
    id: params.id || `custom_exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: params.title?.trim() || `Đề thi HSK ${level} (${questions.length} câu)`,
    level,
    source: resolvedSource,
    sourceLabel: resolvedSource,
    timeLimitMinutes,
    questionCount: questions.length,
    difficultyTier: explicitTier,
    difficultyScore:
      typeof params.difficultyScore === 'number' && Number.isFinite(params.difficultyScore)
        ? params.difficultyScore
        : defaultTierScore,
    createdAt: new Date().toISOString(),
    questions,
  };
}

function resolveStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

/**
 * Loads all saved Custom Exam Sets from localStorage.
 */
export function loadCustomExamSets(customStorage?: StorageLike): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY_CUSTOM_EXAM_SETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a Custom Exam Set to localStorage and returns the updated list.
 */
export function saveCustomExamSetToStorage(
  examSet: CustomExamSet,
  customStorage?: StorageLike
): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  const existing = loadCustomExamSets(customStorage).filter((item) => item.id !== examSet.id);
  const updated = [examSet, ...existing];
  if (store) {
    try {
      store.setItem(STORAGE_KEY_CUSTOM_EXAM_SETS, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  }
  return updated;
}

/**
 * Updates the difficulty tier/score of a saved Custom Exam Set in localStorage.
 */
export function updateCustomExamSetDifficultyInStorage(
  examId: string,
  difficultyTier: 'easy' | 'medium' | 'hard',
  difficultyScore?: number,
  customStorage?: StorageLike
): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  const fallbackScore = difficultyTier === 'easy' ? 28 : difficultyTier === 'hard' ? 84 : 58;
  const updated = loadCustomExamSets(customStorage).map((item) =>
    item.id === examId
      ? {
          ...item,
          difficultyTier,
          difficultyScore:
            typeof difficultyScore === 'number' && Number.isFinite(difficultyScore)
              ? difficultyScore
              : fallbackScore,
        }
      : item
  );
  if (store) {
    try {
      store.setItem(STORAGE_KEY_CUSTOM_EXAM_SETS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

/**
 * Updates the title of a saved Custom Exam Set in localStorage.
 */
export function updateCustomExamSetTitleInStorage(
  examId: string,
  title: string,
  customStorage?: StorageLike
): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  const cleanTitle = title.trim();
  if (!cleanTitle) return loadCustomExamSets(customStorage);
  const updated = loadCustomExamSets(customStorage).map((item) =>
    item.id === examId ? { ...item, title: cleanTitle } : item
  );
  if (store) {
    try {
      store.setItem(STORAGE_KEY_CUSTOM_EXAM_SETS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

/**
 * Deletes a Custom Exam Set by ID from localStorage and returns the updated list.
 */
export function deleteCustomExamSetFromStorage(
  examId: string,
  customStorage?: StorageLike
): CustomExamSet[] {
  const store = resolveStorage(customStorage);
  const updated = loadCustomExamSets(customStorage).filter((item) => item.id !== examId);
  if (store) {
    try {
      store.setItem(STORAGE_KEY_CUSTOM_EXAM_SETS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}
