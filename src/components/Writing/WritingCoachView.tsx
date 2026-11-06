import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  PenTool,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trophy,
  BookOpen,
  Volume2,
  RotateCcw,
  RefreshCw,
  Eye,
  Layers,
  FileText,
  Clock,
  ChevronRight,
  ArrowRight,
  Sliders,
  Maximize2,
  Trash2,
  Wand2,
  Dice5,
  Tag,
  Lightbulb,
  Copy,
  Check,
  Undo2,
  Eraser,
  Grid,
} from 'lucide-react';
import { HSKLevel, UserProfile, UserStats } from '../../types';
import { playChineseAudio } from '../../utils/chineseAudio';
import { CartoonLoader } from '../CartoonLoader';
import { logStudyActivity } from '../../utils/activityLogger';

export interface WritingPromptPreset {
  id: string;
  hskLevel: HSKLevel;
  title: string;
  topic?: string;
  level?: string;
  category: string;
  question?: string;
  instruction: string;
  targetWordCount: number;
  keywords: string[];
  grammar_patterns?: string[];
  target_length?: {
    min: number;
    max: number;
  };
  difficulty?: string;
  scoring_focus?: string[];
  sampleTheme?: string;
  sampleOpening?: string;
  imagePromptUrl?: string;
}

export interface SentenceAnalysisItem {
  sentence_index?: number;
  original?: string;
  original_sentence?: string;
  status: 'correct' | 'unnatural' | 'grammar_error';
  error?: string;
  explanation: string;
  grammar_rule?: string;
  correction?: string;
  corrected_sentence?: string;
  similar_example?: string;
}

export interface ScoreCriterion {
  score: number;
  max_score?: number;
  feedback: string;
}

export interface WritingEvaluationResult {
  level?: string;
  original_text?: string;
  transcribedText: string;
  pinyin: string;
  vietnamese: string;
  score: number;
  total_score?: number;
  wordCount: number;
  hskLevelEstimated: number;
  isValidChinese?: boolean;
  handwritingFeedback?: string;
  scoring_breakdown?: {
    content?: ScoreCriterion;
    vocabulary?: ScoreCriterion;
    grammar?: ScoreCriterion;
    coherence?: ScoreCriterion;
  };
  sentence_analysis?: SentenceAnalysisItem[];
  content?: ScoreCriterion;
  vocabulary?: ScoreCriterion;
  grammar?: ScoreCriterion;
  coherence?: ScoreCriterion;
  corrected_text?: string;
  grammarFeedback?: {
    original: string;
    correction: string;
    explanation: string;
  }[];
  vocabularySuggestions?: {
    originalWord: string;
    betterAlternative: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }[];
  nativeModelEssay?: {
    chinese: string;
    pinyin: string;
    vietnamese: string;
    highlightTip: string;
  };
  overall_feedback?: string;
  overallFeedback?: string;
}

export const HSK_WRITING_PROMPTS: WritingPromptPreset[] = [
  // HSK 1
  {
    id: 'prompt-hsk1-intro',
    hskLevel: 1,
    title: 'Giới thiệu bản thân cơ bản',
    topic: 'Giới thiệu bản thân (自我介绍)',
    level: 'HSK 1',
    category: 'Giao tiếp',
    question: 'Hãy viết 3-5 câu ngắn đơn giản giới thiệu tên, quốc tịch, tuổi và việc bạn học tiếng Trung.',
    instruction: 'Hãy viết 3-5 câu ngắn (khoảng 20-35 chữ) giới thiệu tên, quốc tịch, tuổi và việc bạn học tiếng Trung.',
    targetWordCount: 30,
    target_length: { min: 20, max: 40 },
    difficulty: 'Cơ bản - Câu đơn S + V + O',
    keywords: ['我叫 (tên tôi là)', '中国人/越南人 (quốc tịch)', '岁 (tuổi)', '学习汉语 (học tiếng Trung)', '认识你很高兴 (rất vui quen bạn)'],
    grammar_patterns: ['S + 是 + N (Phán đoán)', 'S + 叫 + Tên', 'S + 在 + Nơi chốn + V'],
    scoring_focus: ['Dùng đúng từ vựng HSK 1', 'Trật tự câu phán đoán 是', 'Không viết sai chữ Hán cơ bản'],
    sampleOpening: '你好！我叫明安，我是越南人，今年二十岁。(Chào bạn! Tôi tên là Minh An, tôi là người Việt Nam, năm nay 20 tuổi.)',
  },
  {
    id: 'prompt-hsk1-family',
    hskLevel: 1,
    title: 'Gia đình thân yêu của tôi',
    topic: 'Gia đình (我的家)',
    level: 'HSK 1',
    category: 'Giao tiếp',
    question: 'Viết đoạn văn ngắn 20-30 chữ giới thiệu gia đình bạn có mấy người và tình cảm với nhau.',
    instruction: 'Viết đoạn văn ngắn 20-30 chữ giới thiệu gia đình bạn có mấy người và nghề nghiệp cơ bản.',
    targetWordCount: 30,
    target_length: { min: 20, max: 35 },
    difficulty: 'Cơ bản - Lượng từ & Số từ',
    keywords: ['我家有...口人 (nhà có... người)', '爸爸/妈妈 (bố/mẹ)', '老师/医生 (nghề nghiệp)', '很爱 (rất yêu)'],
    grammar_patterns: ['S + 有 + Số từ + 口人', 'S + 是 + Nghề nghiệp'],
    scoring_focus: ['Dùng đúng lượng từ 口', 'Cấu trúc sở hữu 的'],
    sampleOpening: '我家有四口人：爸爸、妈妈、哥哥和我。(Nhà tôi có 4 người: bố, mẹ, anh trai và tôi.)',
  },
  {
    id: 'prompt-hsk1-food',
    hskLevel: 1,
    title: 'Món ăn & Đồ uống yêu thích',
    topic: 'Ẩm thực (喜欢吃的东西)',
    level: 'HSK 1',
    category: 'Ẩm thực',
    question: 'Kể về món ăn hoặc thức uống bạn thích nhất bằng các câu đơn giản.',
    instruction: 'Kể về món ăn hoặc thức uống bạn thích nhất bằng các câu đơn giản.',
    targetWordCount: 30,
    target_length: { min: 20, max: 35 },
    difficulty: 'Cơ bản - Động từ tâm lý 喜欢',
    keywords: ['喜欢吃 (thích ăn)', '米饭/苹果 (cơm/táo)', '喝茶/水 (uống trà/nước)', '很好吃 (rất ngon)'],
    grammar_patterns: ['S + 喜欢 + V / N', 'S + 很 + Tính từ (很好吃)'],
    scoring_focus: ['Không dùng 是 trước tính từ', 'Dùng đúng vị ngữ tính từ'],
    sampleOpening: '我很喜欢吃中国菜，米饭和茶都非常好吃。(Tôi rất thích ăn món Trung Quốc, cơm và trà đều rất ngon.)',
  },

  // HSK 2
  {
    id: 'prompt-hsk2-daily',
    hskLevel: 2,
    title: 'Một ngày cuối tuần của tôi',
    topic: 'Một ngày cuối tuần (我的周末)',
    level: 'HSK 2',
    category: 'Đời sống',
    question: 'Hãy viết đoạn văn 40-60 chữ miêu tả bạn thường làm gì vào sáng, chiều và tối thứ Bảy hoặc Chủ nhật.',
    instruction: 'Hãy viết đoạn văn 40-60 chữ miêu tả bạn thường làm gì vào sáng, chiều và tối thứ Bảy hoặc Chủ nhật.',
    targetWordCount: 50,
    target_length: { min: 40, max: 65 },
    difficulty: 'Sơ cấp - Trạng ngữ chỉ thời gian',
    keywords: ['早上/下午 (sáng/chiều)', '一起 (cùng nhau)', '运动/看书 (thể thao/đọc sách)', '已经...了 (đã... rồi)'],
    grammar_patterns: ['Thời gian + S + V / S + Thời gian + V', 'S + 和 + Ai đó + 一起 + V', 'S + 比 + O + Adj'],
    scoring_focus: ['Vị trí trạng ngữ thời gian đứng trước vị ngữ', 'Sử dụng liên từ nối câu'],
    sampleOpening: '每到周末，我常常早上八点起床，然后和朋友去公园打篮球。(Mỗi dịp cuối tuần, tôi thường thức dậy lúc 8h sáng, sau đó đi công viên chơi bóng rổ với bạn.)',
  },
  {
    id: 'prompt-hsk2-shopping',
    hskLevel: 2,
    title: 'Trải nghiệm mua sắm ở siêu thị',
    topic: 'Mua sắm (去超市买东西)',
    level: 'HSK 2',
    category: 'Đời sống',
    question: 'Viết đoạn văn ngắn 45-55 chữ kể về việc bạn đi siêu thị mua hoa quả hoặc quần áo, so sánh giá cả.',
    instruction: 'Viết đoạn văn ngắn 45-55 chữ kể về việc bạn đi siêu thị mua hoa quả hoặc quần áo, so sánh giá cả.',
    targetWordCount: 50,
    target_length: { min: 40, max: 60 },
    difficulty: 'Sơ cấp - So sánh & Giá cả',
    keywords: ['超市 (siêu thị)', '西瓜/苹果 (hoa quả)', '便宜/贵 (rẻ/đắt)', '斤/块 (lượng từ tiền/cân)'],
    grammar_patterns: ['又...又... (vừa... vừa...)', 'A + 比 + B + Adj (So sánh 比)'],
    scoring_focus: ['Dùng đúng câu so sánh 比', 'Kết hợp cặp từ 又...又...'],
    sampleOpening: '昨天下午我和妈妈去超市买东西，那里的苹果又便宜又新鲜。(Chiều hôm qua tôi cùng mẹ đi siêu thị mua đồ, táo ở đó vừa rẻ vừa tươi ngon.)',
  },

  // HSK 3
  {
    id: 'prompt-hsk3-ba-sentence',
    hskLevel: 3,
    title: 'Dọn dẹp phòng & Câu chữ 把',
    topic: 'Dọn dẹp phòng (打扫房间)',
    level: 'HSK 3',
    category: 'Ngữ pháp',
    question: 'Viết một đoạn văn 60-80 chữ kể về việc bạn dọn dẹp nhà cửa/phòng ngủ, có sử dụng ít nhất 2 câu chữ 把 (Bǎ) và bổ ngữ kết quả.',
    instruction: 'Viết một đoạn văn 60-80 chữ kể về việc bạn dọn dẹp nhà cửa/phòng ngủ, có sử dụng ít nhất 2 câu chữ 把 (Bǎ) và bổ ngữ kết quả.',
    targetWordCount: 75,
    target_length: { min: 60, max: 90 },
    difficulty: 'Trung cấp sơ - Câu chữ 把 & Bổ ngữ',
    keywords: ['把...打扫干净 (dọn sạch)', '把...放好 (cất gọn)', '作业 (bài tập)', '准备 (chuẩn bị)'],
    grammar_patterns: ['S + 把 + O + V + Kết quả (好/完/干净)', '虽然...但是... (tuy... nhưng)'],
    scoring_focus: ['Vị trí tân ngữ sau 把 và bổ ngữ bắt buộc sau động từ', 'Không dùng câu chữ 把 cho động từ tri giác'],
    sampleOpening: '今天早上，我花了一个小时把我的房间打扫得干干净净。(Sáng nay, tôi dành một tiếng để dọn dẹp phòng mình sạch sẽ tinh tươm.)',
  },
  {
    id: 'prompt-hsk3-chinese-experience',
    hskLevel: 3,
    title: 'Kỷ niệm đáng nhớ khi học tiếng Trung',
    topic: 'Học tiếng Trung (学汉语的经历)',
    level: 'HSK 3',
    category: 'Kể chuyện',
    question: 'Kể lại một lần bạn gặp khó khăn khi học chữ Hán hoặc phát âm, và bạn đã vượt qua ra sao.',
    instruction: 'Kể lại một lần bạn gặp khó khăn khi học chữ Hán hoặc phát âm, và bạn đã vượt qua ra sao.',
    targetWordCount: 80,
    target_length: { min: 65, max: 95 },
    difficulty: 'Trung cấp sơ - Bổ ngữ khả năng / trạng thái',
    keywords: ['记得 (nhớ)', '虽然...但是... (tuy... nhưng)', '遇到困难 (gặp khó khăn)', '提高 (tiến bộ)'],
    grammar_patterns: ['V + 得 + Adj (Bổ ngữ trạng thái)', '只要...就... (chỉ cần... là...)'],
    scoring_focus: ['Phân biệt 得/地/的', 'Diễn đạt dòng thời gian liền mạch'],
    sampleOpening: '开始学中文时，我总觉得汉字很难记，但每天坚持练习后，我的水平提高了不少。(Lúc mới học tiếng Trung, tôi luôn thấy chữ Hán khó nhớ, nhưng sau khi kiên trì luyện mỗi ngày, trình độ đã tiến bộ nhiều.)',
  },

  // HSK 4
  {
    id: 'prompt-hsk4-picture-story',
    hskLevel: 4,
    title: 'Đề thi HSK 4: Viết đoạn văn 80 chữ theo từ cho trước',
    topic: 'Nỗ lực & Thành công (坚持与成功)',
    level: 'HSK 4',
    category: 'Luyện thi HSK',
    question: 'Sử dụng đủ 5 từ khóa sau để viết một đoạn văn ngắn mạch lạc khoảng 80 chữ: 坚持, 成功, 困难, 无论, 经验.',
    instruction: 'Sử dụng đủ 5 từ khóa sau để viết một đoạn văn ngắn mạch lạc khoảng 80 chữ: 坚持 (kiên trì), 成功 (thành công), 困难 (khó khăn), 无论...都... (bất kể), 经验 (kinh nghiệm).',
    targetWordCount: 80,
    target_length: { min: 70, max: 100 },
    difficulty: 'Trung cấp - Đề chuẩn phần thi Viết HSK 4',
    keywords: ['坚持', '成功', '困难', '无论', '经验'],
    grammar_patterns: ['无论...都... (bất kể... đều...)', '不仅...而且... (không những... mà còn...)', '通过... (thông qua...)'],
    scoring_focus: ['Sử dụng chính xác cả 5 từ khóa cho trước', 'Bố cục chặt chẽ có mở - thân - kết'],
    sampleOpening: '在人生的道路上，无论遇到多大的困难，只要坚持努力，就一定会积累宝贵的经验并获得成功。(Trên đường đời, bất kể gặp khó khăn lớn đến đâu, chỉ cần kiên trì nỗ lực là nhất định tích lũy kinh nghiệm quý báu và thành công.)',
  },
  {
    id: 'prompt-hsk4-travel',
    hskLevel: 4,
    title: 'Kỷ niệm một chuyến đi đáng nhớ',
    topic: 'Du lịch (一次难忘的旅行)',
    level: 'HSK 4',
    category: 'Du lịch',
    question: 'Hãy viết đoạn văn khoảng 80-100 chữ miêu tả một địa điểm du lịch bạn từng đến, thời tiết, phong cảnh và cảm nhận.',
    instruction: 'Hãy viết đoạn văn khoảng 80-100 chữ miêu tả một địa điểm du lịch bạn từng đến, thời tiết, phong cảnh và cảm nhận của bạn.',
    targetWordCount: 90,
    target_length: { min: 80, max: 110 },
    difficulty: 'Trung cấp - Miêu tả cảnh sắc và tâm trạng',
    keywords: ['风景 (phong cảnh)', '特别 (đặc biệt)', '不仅...而且... (không những... mà còn)', '留下深刻印象 (ấn tượng sâu sắc)'],
    grammar_patterns: ['给...留下深刻的印象', '由于...因此...'],
    scoring_focus: ['Từ vựng miêu tả phong phú', 'Sử dụng cấu trúc câu phức liên hợp'],
    sampleOpening: '去年的夏天，我有机会去了一趟美丽的三亚，那里的海景给我留下了深刻的印象。(Mùa hè năm ngoái, tôi có dịp đến Tam Á xinh đẹp, cảnh biển nơi đó để lại cho tôi ấn tượng sâu sắc.)',
  },

  // HSK 5
  {
    id: 'prompt-hsk5-opinion',
    hskLevel: 5,
    title: 'Nghị luận: Ảnh hưởng của mạng xã hội',
    topic: 'Mạng xã hội và Đời sống (社交网络的影响)',
    level: 'HSK 5',
    category: 'Nghị luận',
    question: 'Viết bài luận ngắn 120-150 chữ bày tỏ quan điểm của bạn về mặt tích cực và tiêu cực của điện thoại thông minh/mạng xã hội trong học tập.',
    instruction: 'Viết bài luận ngắn 120-150 chữ bày tỏ quan điểm của bạn về mặt tích cực và tiêu cực của điện thoại thông minh/mạng xã hội trong học tập.',
    targetWordCount: 130,
    target_length: { min: 110, max: 160 },
    difficulty: 'Cao cấp sơ - Nghị luận xã hội 2 chiều (利与弊)',
    keywords: ['互联网 (internet)', '提高效率 (nâng cao hiệu suất)', '依赖 (phụ thuộc)', '利与弊 (lợi và hại)', '不可否认 (không thể phủ nhận)'],
    grammar_patterns: ['不可否认...然而...', '一方面...另一方面... (một mặt... mặt khác...)', '取决于 (quyết định bởi)'],
    scoring_focus: ['Lập luận logic 2 chiều', 'Từ vựng thư diện 书面语', 'Liên kết đoạn văn chặt chẽ'],
    sampleOpening: '随着科技的飞速发展，智能手机与社交媒体已经深入到我们日常生活的每一个角落。(Cùng với sự phát triển thần tốc của công nghệ, điện thoại thông minh và MXH đã thâm nhập vào mọi ngõ ngách đời sống.)',
  },
  {
    id: 'prompt-hsk5-work-life',
    hskLevel: 5,
    title: 'Cân bằng công việc và cuộc sống',
    topic: 'Cân bằng cuộc sống (工作与生活的平衡)',
    level: 'HSK 5',
    category: 'Nghị luận',
    question: 'Viết 120-150 chữ phân tích áp lực của người trẻ hiện đại và cách thiết lập lối sống lành mạnh, bền vững.',
    instruction: 'Viết 120-150 chữ phân tích áp lực của người trẻ hiện đại và cách thiết lập lối sống lành mạnh, bền vững.',
    targetWordCount: 140,
    target_length: { min: 120, max: 160 },
    difficulty: 'Cao cấp sơ - Phân tích nguyên nhân & giải pháp',
    keywords: ['平衡 (cân bằng)', '身心健康 (sức khỏe thân tâm)', '缓解压力 (giải tỏa áp lực)', '不可忽视 (không thể xem nhẹ)'],
    grammar_patterns: ['如何...已成为...', '与其...不如... (thà rằng... còn hơn...)', '为了...必须...'],
    scoring_focus: ['Văn phong trang trọng', 'Sử dụng thành ngữ Thành ngữ 成语 phù hợp'],
    sampleOpening: '在节奏日益加快的现代社会中，如何平衡繁重的工作与个人生活已成为每个人必须面对的挑战。(Trong xã hội hiện đại nhịp sống ngày càng nhanh, cân bằng công việc bộn bề và cuộc sống là thử thách ai cũng phải đối mặt.)',
  },

  // HSK 6
  {
    id: 'prompt-hsk6-ai-future',
    hskLevel: 6,
    title: 'Trí tuệ Nhân tạo (AI) & Tương lai Nhân loại',
    topic: 'Trí tuệ nhân tạo (人工智能与未来)',
    level: 'HSK 6',
    category: 'Nghị luận',
    question: 'Viết bài văn nghị luận sâu sắc 200-250 chữ phân tích cả cơ hội và thách thức của AI đối với thị trường lao động và giáo dục toàn cầu.',
    instruction: 'Viết bài văn nghị luận sâu sắc 200-250 chữ phân tích cả cơ hội và thách thức của AI đối với thị trường lao động và giáo dục toàn cầu.',
    targetWordCount: 220,
    target_length: { min: 180, max: 260 },
    difficulty: 'Cao cấp thuần thục - Nghị luận chuyên sâu HSK 6',
    keywords: ['人工智能 (trí tuệ nhân tạo)', '日新月异 (thay đổi từng ngày)', '颠覆性 (tính đột phá)', '机遇与挑战 (cơ hội & thách thức)', '未雨绸缪 (lo liệu trước)'],
    grammar_patterns: ['伴随着...人类正站在...', '既要...又要...', '势在必行 / 当务之急'],
    scoring_focus: ['Văn phong học thuật chuẩn mực', 'Cụm từ 4 chữ 成语 cao cấp', 'Tư duy phản biện logic'],
    sampleOpening: '伴随着人工智能技术的爆发式突破，人类文明正站在一个崭新的历史转折点上。(Song hành cùng sự bùng nổ của công nghệ AI, văn minh nhân loại đang đứng trước bước ngoặt lịch sử hoàn toàn mới.)',
  },
  {
    id: 'prompt-hsk6-green-economy',
    hskLevel: 6,
    title: 'Kinh tế Xanh & Phát triển Bền vững',
    topic: 'Bảo vệ môi trường (绿色经济与可持续发展)',
    level: 'HSK 6',
    category: 'Nghị luận',
    question: 'Viết bài nghị luận 200-250 chữ về vai trò của phát triển bền vững và chuyển dịch năng lượng sạch.',
    instruction: 'Viết bài nghị luận 200-250 chữ về vai trò của phát triển bền vững và chuyển dịch năng lượng sạch.',
    targetWordCount: 220,
    target_length: { min: 180, max: 260 },
    difficulty: 'Cao cấp thuần thục - Luận đề kinh tế & môi trường',
    keywords: ['可持续发展 (phát triển bền vững)', '环境保护 (bảo vệ môi trường)', '刻不容缓 (không thể chậm trễ)', '协同共赢 (hợp tác cùng thắng)'],
    grammar_patterns: ['面对...已成当务之急', '不仅关乎...更直接决定...'],
    scoring_focus: ['Cấu trúc nghị luận chặt chẽ', 'Tính học thuật và tính chính xác cao'],
    sampleOpening: '面对全球气候变暖等严峻生态危机，倡导绿色低碳转型与可持续发展已成当务之急。(Đối mặt với khủng hoảng sinh thái nghiêm trọng như nóng lên toàn cầu, thúc đẩy chuyển dịch xanh là yêu cầu cấp bách.)',
  },
];

export const PROMPT_CATEGORIES = ['Tất cả', 'Giao tiếp', 'Đời sống', 'Du lịch', 'Ẩm thực', 'Ngữ pháp', 'Luyện thi HSK', 'Kể chuyện', 'Nghị luận'];

export const SUGGESTED_THEMES = [
  '⚽ Bóng đá Việt Nam & Thể thao',
  '🍲 Ẩm thực & Gọi món',
  '💼 Phỏng vấn việc làm',
  '✈️ Du lịch Trung Quốc',
  '📱 Mạng xã hội & AI',
  '🌿 Bảo vệ môi trường',
  '🏥 Đi khám bệnh',
  '☕ Hẹn bạn tại quán cafe',
];

interface SavedWritingEntry {
  id: string;
  date: string;
  promptTitle: string;
  hskLevel: number;
  inputMode: 'text' | 'ocr';
  studentText: string;
  score: number;
  result: WritingEvaluationResult;
}

const WRITING_HISTORY_KEY = 'minnese_writing_history_v1';

interface WritingCoachViewProps {
  stats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  userProfile?: UserProfile;
}

export const WritingCoachView: React.FC<WritingCoachViewProps> = ({
  stats,
  onUpdateStats,
  userProfile,
}) => {
  const [selectedHsk, setSelectedHsk] = useState<HSKLevel>(
    (userProfile?.current_level as HSKLevel) || 2
  );
  const [activePrompt, setActivePrompt] = useState<WritingPromptPreset>(() => {
    return (
      HSK_WRITING_PROMPTS.find((p) => p.hskLevel === (userProfile?.current_level || 2)) ||
      HSK_WRITING_PROMPTS[1]
    );
  });

  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');

  // Input Mode: 'text' (Keyboard typing) | 'ocr' (Handwriting photo / Drawing canvas)
  const [inputMode, setInputMode] = useState<'text' | 'ocr'>('text');
  const [typedText, setTypedText] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

  // Canvas drawing state & tools
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCanvasPainting, setIsCanvasPainting] = useState(false);
  const [brushColor, setBrushColor] = useState<string>('#0f172a');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; isInside: boolean }>({
    x: 0,
    y: 0,
    isInside: false,
  });
  const canvasHistoryRef = useRef<ImageData[]>([]);
  const [strokeCount, setStrokeCount] = useState<number>(0);

  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalProgressText, setEvalProgressText] = useState('Đang đối chiếu đề bài...');
  const [evaluationResult, setEvaluationResult] = useState<WritingEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  // History Log
  const [writingHistory, setWritingHistory] = useState<SavedWritingEntry[]>(() => {
    try {
      const saved = localStorage.getItem(WRITING_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [isGeneratingAIPrompt, setIsGeneratingAIPrompt] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [copiedOpening, setCopiedOpening] = useState(false);
  const [dynamicPrompts, setDynamicPrompts] = useState<WritingPromptPreset[]>(HSK_WRITING_PROMPTS);
  const [promptSuccessMessage, setPromptSuccessMessage] = useState<string | null>(null);

  // Filtered presets by HSK Level and Category
  const currentLevelPrompts = dynamicPrompts.filter((p) => {
    const matchHsk = p.hskLevel === selectedHsk;
    const matchCat = selectedCategory === 'Tất cả' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchHsk && matchCat;
  });

  // Realtime Character Count
  const chineseCharsInText = (typedText.match(/[\u4e00-\u9fa5]/g) || []).length;

  const handleSelectPrompt = (prompt: WritingPromptPreset) => {
    setActivePrompt(prompt);
    setIsCustomPrompt(false);
    setEvaluationResult(null);
    setEvalError(null);
    setPromptSuccessMessage(null);
  };

  const handleGenerateAIPrompt = async (topicOverride?: string) => {
    const rawTopic = topicOverride !== undefined ? topicOverride : aiTopicInput;
    const topicToUse = rawTopic.trim() || undefined;
    setIsGeneratingAIPrompt(true);
    setEvalError(null);
    setPromptSuccessMessage(null);
    try {
      const res = await fetch('/api/ai/generate-writing-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hskLevel: selectedHsk,
          topic: topicToUse || 'Đời sống hàng ngày',
          promptType: selectedCategory === 'Tất cả' ? undefined : selectedCategory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Mã lỗi máy chủ: ${res.status}`);
      }

      const generated: WritingPromptPreset = await res.json();
      
      // Ensure HSK level matches current selected
      generated.hskLevel = selectedHsk;

      // Add to dynamic prompts and select it immediately
      setDynamicPrompts((prev) => [generated, ...prev.filter((p) => p.id !== generated.id)]);
      setActivePrompt(generated);
      setIsCustomPrompt(false);
      setSelectedCategory('Tất cả'); // Ensure prompt is immediately visible in list
      setEvaluationResult(null);
      setAiTopicInput('');
      setPromptSuccessMessage(`Đã tạo thành công đề bài mới: "${generated.title}"!`);
      setTimeout(() => setPromptSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error('Error generating writing prompt:', err);
      setEvalError('Không thể tạo đề bài AI: ' + (err?.message || 'Vui lòng thử lại.'));
    } finally {
      setIsGeneratingAIPrompt(false);
    }
  };

  const handleInsertOpeningSentence = () => {
    if (!activePrompt?.sampleOpening) return;
    // Extract only the Chinese part if possible (before parentheses or full string)
    const chineseMatch = activePrompt.sampleOpening.split('(')[0].trim();
    setTypedText((prev) => {
      if (!prev.trim()) return chineseMatch;
      return prev + ' ' + chineseMatch;
    });
    setCopiedOpening(true);
    setTimeout(() => setCopiedOpening(false), 2000);
  };

  // Canvas Grid & Drawing Handlers
  const drawGridOnContext = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, withGrid: boolean) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (!withGrid) return;

    // Draw Chinese square grid (Mễ tự cách / Tian-zi-ge)
    const cellSize = 80;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    const offsetX = (width - cols * cellSize) / 2;
    const offsetY = (height - rows * cellSize) / 2;

    ctx.save();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;

        // Outer box
        ctx.strokeStyle = '#fca5a5'; // light rose border
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Cross dashed lines (+)
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        // Horizontal mid
        ctx.moveTo(x, y + cellSize / 2);
        ctx.lineTo(x + cellSize, y + cellSize / 2);
        // Vertical mid
        ctx.moveTo(x + cellSize / 2, y);
        ctx.lineTo(x + cellSize / 2, y + cellSize);

        // Diagonal dashed lines (X)
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
    }
    ctx.restore();
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGridOnContext(ctx, canvas.width, canvas.height, showGrid);
    canvasHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    setStrokeCount(0);
  }, [drawGridOnContext, showGrid]);

  useEffect(() => {
    if (inputMode === 'ocr') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [inputMode, initCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, rawX: 0, rawY: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
        rawX: touch.clientX - rect.left,
        rawY: touch.clientY - rect.top,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        rawX: e.clientX - rect.left,
        rawY: e.clientY - rect.top,
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.rawX, y: coords.rawY, isInside: true });
    if (isCanvasPainting) {
      draw(e);
    }
  };

  const handleCanvasMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.rawX, y: coords.rawY, isInside: true });
  };

  const handleCanvasMouseLeave = () => {
    setCursorPos((prev) => ({ ...prev, isInside: false }));
    if (isCanvasPainting) {
      stopDrawing();
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsCanvasPainting(true);
    const coords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isCanvasPainting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isCanvasPainting && canvasRef.current) {
      setIsCanvasPainting(false);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvasHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        setStrokeCount((prev) => prev + 1);
      }
      setUploadedImageBase64(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  const undoCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasHistoryRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvasHistoryRef.current.pop();
    const prevData = canvasHistoryRef.current[canvasHistoryRef.current.length - 1];
    ctx.putImageData(prevData, 0, 0);

    setStrokeCount((prev) => Math.max(0, prev - 1));
    if (canvasHistoryRef.current.length <= 1) {
      setUploadedImageBase64(null);
    } else {
      setUploadedImageBase64(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  const clearCanvas = () => {
    initCanvas();
    setUploadedImageBase64(null);
  };

  // Image Upload Handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setUploadedImageBase64(base64);
      setEvaluationResult(null);
      setEvalError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEvaluation = async () => {
    if (inputMode === 'text' && !typedText.trim()) {
      setEvalError('Vui lòng nhập bài viết tiếng Trung của bạn trước khi chấm điểm.');
      return;
    }
    if (inputMode === 'ocr') {
      if (!uploadedImageBase64) {
        setEvalError('Vui lòng tải ảnh chụp bài viết tay hoặc viết lên bảng trước khi chấm điểm.');
        return;
      }
      if (strokeCount > 0 && strokeCount < 3) {
        setEvalError('Nét vẽ trên bảng còn quá ít (chưa tạo thành chữ Hán). Vui lòng viết rõ ít nhất 1-2 chữ Hán hoàn chỉnh trước khi bấm chấm bài.');
        return;
      }
    }

    setEvalError(null);
    setIsEvaluating(true);
    setEvaluationResult(null);
    setEvalProgressText(inputMode === 'ocr' ? 'Đang đọc chữ viết tay qua OCR...' : 'Đang đối chiếu với đề bài...');

    const stages = inputMode === 'ocr'
      ? [
          'Đang quét OCR chữ viết tay...',
          'Đang phân tích cấu trúc câu HSK...',
          'Đang kiểm tra từ vựng & ngữ pháp...',
          'Đang chấm điểm 4 tiêu chí HSK...',
        ]
      : [
          'Đang phân tích ngữ pháp & trật tự câu...',
          'Đang kiểm tra từ vựng & cấu trúc HSK...',
          'Đang chấm điểm 4 tiêu chí & chữa câu...',
          'Đang hoàn tất kết quả...',
        ];

    let currentStage = 0;
    const progressTimer = setInterval(() => {
      currentStage = (currentStage + 1) % stages.length;
      setEvalProgressText(stages[currentStage]);
    }, 850);

    const promptTitle = isCustomPrompt
      ? customPromptText || 'Đề bài tự do'
      : `${activePrompt.title} (HSK ${activePrompt.hskLevel}): ${activePrompt.instruction}`;

    const promptDetails = isCustomPrompt
      ? {
          topic: customPromptText || 'Đề tài tự do',
          level: `HSK ${selectedHsk}`,
          hskLevel: selectedHsk,
          question: customPromptText || 'Tự do viết đoạn văn tiếng Trung',
          keywords: [],
          grammar_patterns: [],
          target_length: { min: 20, max: 80 },
          scoring_focus: ['Đúng chủ đề', 'Ngữ pháp chuẩn xác'],
        }
      : {
          topic: activePrompt.topic || activePrompt.title,
          level: activePrompt.level || `HSK ${activePrompt.hskLevel}`,
          hskLevel: activePrompt.hskLevel,
          question: activePrompt.question || activePrompt.instruction,
          keywords: activePrompt.keywords || [],
          grammar_patterns: activePrompt.grammar_patterns || [],
          target_length: activePrompt.target_length || {
            min: Math.max(20, (activePrompt.targetWordCount || 30) - 10),
            max: (activePrompt.targetWordCount || 30) + 15,
          },
          difficulty: activePrompt.difficulty || `HSK ${activePrompt.hskLevel}`,
          scoring_focus: activePrompt.scoring_focus || [
            'Từ vựng phù hợp cấp độ',
            'Trật tự câu chuẩn xác',
            'Đúng chủ đề yêu cầu',
          ],
        };

    try {
      const res = await fetch('/api/ai/evaluate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: inputMode,
          chineseText: typedText,
          image: uploadedImageBase64,
          promptText: promptTitle,
          hskLevel: selectedHsk,
          promptDetails,
        }),
      });

      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi: ${res.status}`);
      }

      const data: WritingEvaluationResult = await res.json();
      setEvaluationResult(data);

      const finalScore = data.total_score ?? data.score ?? 80;

      // Trigger celebration confetti for good scores
      if (finalScore >= 80) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      // Update user stats
      const xpEarned = Math.round(finalScore * 1.5);
      onUpdateStats({
        xp: stats.xp + xpEarned,
        studyTimeMinutes: stats.studyTimeMinutes + 10,
      });

      const currentPrompt = activePrompt;
      logStudyActivity('review', 'Luyện viết chữ Hán AI: ' + (currentPrompt?.title || 'Bài viết'));

      // Save to local writing history
      const newEntry: SavedWritingEntry = {
        id: `write-${Date.now()}`,
        date: new Date().toISOString(),
        promptTitle: isCustomPrompt ? customPromptText || 'Tự do' : activePrompt.title,
        hskLevel: selectedHsk,
        inputMode,
        studentText: data.transcribedText || typedText,
        score: finalScore,
        result: data,
      };
      const updatedHistory = [newEntry, ...writingHistory.slice(0, 19)];
      setWritingHistory(updatedHistory);
      localStorage.setItem(WRITING_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (err: any) {
      console.error('Error evaluating writing:', err);
      setEvalError('Không thể hoàn thành chấm bài: ' + (err?.message || 'Lỗi mạng hoặc AI quá tải.'));
    } finally {
      clearInterval(progressTimer);
      setIsEvaluating(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider">
              <PenTool className="w-3.5 h-3.5" />
              Phòng Luyện Viết & Chấm Điểm Chuẩn HSK
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              HSK Writing Evaluator & OCR Chữ Viết Tay
            </h1>
            <p className="text-emerald-50 text-sm max-w-2xl leading-relaxed">
              Luyện viết đoạn văn theo chuẩn đề thi HSK 1 - 6. Hỗ trợ gõ trực tiếp hoặc chụp ảnh bài viết tay để AI bóc tách chữ Hán, chấm điểm thang 100 và phân tích ngữ pháp chuẩn bản xứ.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-sm transition-all cursor-pointer shadow-xs"
            >
              <Clock className="w-4 h-4" />
              Lịch sử bài viết ({writingHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* HSK Level Quick Selector Bar (Full Width Top Bar) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Cấp độ HSK mục tiêu
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                {activePrompt?.target_length ? `${activePrompt.target_length.min} - ${activePrompt.target_length.max} chữ` : `~${activePrompt?.targetWordCount || 40} chữ`}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-primary)] font-medium">
              Đang luyện: <b>HSK {selectedHsk}</b> • {activePrompt?.title || activePrompt?.topic || 'Luyện viết đoạn văn'}
            </p>
          </div>
        </div>

        {/* 6 HSK Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] overflow-x-auto">
          {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setSelectedHsk(lvl);
                const prompt = HSK_WRITING_PROMPTS.find((p) => p.hskLevel === lvl);
                if (prompt) setActivePrompt(prompt);
                setEvaluationResult(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedHsk === lvl
                  ? 'bg-emerald-600 text-white shadow-xs font-black scale-105'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Side Prompts & Options / Right Side Writing Pad & Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Prompt Card & Topic Options (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Prompt Details Card - The primary reference for writing */}
          {!isCustomPrompt && activePrompt && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border border-emerald-500/30 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Đề bài đang luyện viết:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                    {activePrompt.level || `HSK ${activePrompt.hskLevel}`}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300/80 dark:border-cyan-800">
                    {activePrompt.target_length ? `${activePrompt.target_length.min} - ${activePrompt.target_length.max} chữ` : `~${activePrompt.targetWordCount} chữ`}
                  </span>
                </div>
              </div>

              {/* Title & Full Instruction */}
              <div className="space-y-2">
                <h4 className="text-base sm:text-lg font-black text-[var(--color-text-primary)]">
                  {activePrompt.topic || activePrompt.title}
                </h4>
                <div className="p-4 rounded-2xl bg-white dark:bg-[var(--color-background)] border border-emerald-200 dark:border-emerald-800/60 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    Yêu cầu bài viết:
                  </span>
                  <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed font-medium">
                    {activePrompt.question || activePrompt.instruction}
                  </p>
                </div>
              </div>

              {/* Difficulty details */}
              {activePrompt.difficulty && (
                <div className="text-xs text-[var(--color-text-primary)] flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 shrink-0">🎯 Mức độ:</span>
                  <span className="leading-relaxed font-medium">{activePrompt.difficulty}</span>
                </div>
              )}

              {/* Suggested Keywords with Hanzi & Meaning */}
              {activePrompt.keywords && activePrompt.keywords.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Từ khóa gợi ý nên dùng trong bài:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activePrompt.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[var(--color-background)] border border-emerald-300 dark:border-emerald-700/60 text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200 shadow-2xs hover:border-emerald-500 transition-colors"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar patterns */}
              {activePrompt.grammar_patterns && activePrompt.grammar_patterns.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Cấu trúc ngữ pháp trọng tâm:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activePrompt.grammar_patterns.map((gm, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200 shadow-2xs"
                      >
                        {gm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scoring Focus */}
              {activePrompt.scoring_focus && activePrompt.scoring_focus.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Tiêu chí chấm điểm trọng tâm:
                  </span>
                  <ul className="text-xs text-[var(--color-text-primary)] space-y-1.5 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                    {activePrompt.scoring_focus.map((focus, i) => (
                      <li key={i} className="leading-relaxed flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span className="font-medium">{focus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample opening sentence insertion helper */}
              {activePrompt.sampleOpening && (
                <div className="pt-2 border-t border-[var(--color-border)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      Gợi ý câu mở đầu bài viết:
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertOpeningSentence}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700/60 transition-colors shadow-2xs"
                    >
                      {copiedOpening ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Đã chèn vào bài!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-600" />
                          Chèn vào bài viết
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text-primary)] italic bg-white dark:bg-[var(--color-background)] p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 leading-relaxed font-serif shadow-2xs">
                    "{activePrompt.sampleOpening}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preset & AI Prompt Generator Tool (Đổi chủ đề / Kho đề mẫu) */}
          <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
                Đổi đề bài khác (HSK {selectedHsk})
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPrompt(!isCustomPrompt);
                    setEvaluationResult(null);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                    isCustomPrompt
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white dark:bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {isCustomPrompt ? '← Dùng đề có sẵn / AI' : '+ Tự nhập đề tự do'}
                </button>
              </div>
            </div>

            {isCustomPrompt ? (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Đề bài / Yêu cầu viết tự do của bạn:
                </label>
                <textarea
                  rows={4}
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="Ví dụ: Hãy viết 4-6 câu tiếng Trung kể về một lần em đi khám bệnh ở bệnh viện. Bác sĩ đã nói gì và khuyên em uống thuốc như thế nào..."
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 leading-relaxed shadow-2xs"
                />
                <p className="text-[11px] text-[var(--color-text-secondary)] italic">
                  💡 Bạn có thể viết bất kỳ đề tài nào, AI sẽ chấm điểm và phân tích dựa trên đề bài bạn nhập.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* AI Generator Interactive Prompt Box */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[var(--color-background)] border border-emerald-500/20 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Nhập chủ đề bạn muốn AI tạo đề:
                    </span>
                    {isGeneratingAIPrompt && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse font-normal">
                        Đang tạo đề...
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiTopicInput}
                      onChange={(e) => setAiTopicInput(e.target.value)}
                      placeholder="Ví dụ: Y tế, Đi khám bệnh, Gọi đồ ăn, Phỏng vấn..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGenerateAIPrompt();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateAIPrompt()}
                      disabled={isGeneratingAIPrompt}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      {isGeneratingAIPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      {isGeneratingAIPrompt ? 'Đang tạo...' : 'Tạo đề'}
                    </button>
                  </div>

                  {/* Success Banner */}
                  {promptSuccessMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="leading-snug">{promptSuccessMessage}</span>
                    </div>
                  )}

                  {/* Quick theme suggestions */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                      Gợi ý chủ đề nhanh:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_THEMES.map((theme, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isGeneratingAIPrompt}
                          onClick={() => {
                            const cleanTheme = theme.replace(/[^\p{L}\p{N}\s&]/gu, '').trim();
                            handleGenerateAIPrompt(cleanTheme);
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-400 border border-[var(--color-border)] transition-colors cursor-pointer disabled:opacity-50 font-medium"
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Presets Dropdown/Toggle */}
                <details className="group rounded-2xl bg-white dark:bg-[var(--color-background)] border border-[var(--color-border)] p-3 transition-all">
                  <summary className="text-xs font-bold text-[var(--color-text-secondary)] group-open:text-emerald-700 cursor-pointer flex items-center justify-between select-none list-none">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Kho đề mẫu có sẵn ({currentLevelPrompts.length} đề HSK {selectedHsk})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1 pt-1 border-t border-[var(--color-border)]">
                    {currentLevelPrompts.map((p) => {
                      const isSelected = !isCustomPrompt && activePrompt.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPrompt(p)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-[var(--color-text-primary)] ring-1 ring-emerald-400/40'
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-400/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">
                              {p.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                              ~{p.targetWordCount} chữ
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                            {p.instruction}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Writing Area & AI Feedback (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dual Input Mode Selector */}
          <div className="p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Gõ bàn phím (Typewriting)
              </button>

              <button
                type="button"
                onClick={() => setInputMode('ocr')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'ocr'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Viết tay & Quét OCR (AI Vision)
              </button>
            </div>

            {inputMode === 'text' && (
              <div className="px-3 py-1 rounded-xl bg-[var(--color-background)] text-[11px] font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <span>Số chữ Hán:</span>
                <span
                  className={`font-mono text-xs ${
                    chineseCharsInText >= (activePrompt?.targetWordCount || 30)
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-amber-500'
                  }`}
                >
                  {chineseCharsInText}
                </span>
                {!isCustomPrompt && (
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    / ~{activePrompt?.targetWordCount || 30} chữ
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mode 1: Keyboard Typing Pad */}
          {inputMode === 'text' && (
            <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Khu vực soạn thảo bài viết chữ Hán:
                </span>
                <button
                  type="button"
                  onClick={() => setTypedText('')}
                  className="text-xs text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Xóa bài viết
                </button>
              </div>

              <textarea
                rows={7}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Nhập bài viết bằng chữ Hán giản thể tại đây (Ví dụ: 今天是星期六，早上下着小雨，我和朋友一起去中餐厅吃饭...)..."
                className="w-full p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-base sm:text-lg text-[var(--color-text-primary)] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
              />

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  disabled={isEvaluating || !typedText.trim()}
                  onClick={handleSubmitEvaluation}
                  className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{evalProgressText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Chấm bài AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Handwriting OCR & Drawing Pad */}
          {inputMode === 'ocr' && (
            <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  Nộp ảnh chụp bài viết tay hoặc viết trực tiếp:
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Sub-tabs: Upload Image or Draw on Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Upload Photo of Paper Writing */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-emerald-500/50 bg-[var(--color-background)] hover:bg-emerald-500/5 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group min-h-[180px]"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-text-primary)]">
                      Tải ảnh chụp giấy viết tay
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      Hỗ trợ định dạng JPG, PNG (Chụp rõ nét trang vở)
                    </p>
                  </div>
                </div>

                {/* Option B: Interactive Drawing Canvas */}
                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] flex flex-col justify-between gap-3">
                  {/* Canvas Header & Tools */}
                  <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[var(--color-border)]">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-emerald-500" />
                      Bảng viết tay trực tiếp
                      {strokeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold">
                          {strokeCount} nét
                        </span>
                      )}
                    </span>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Grid Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowGrid(!showGrid);
                          setTimeout(() => initCanvas(), 20);
                        }}
                        title="Bật/Tắt ô kẻ Mễ tự cách"
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          showGrid
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Ô Mễ</span>
                      </button>

                      {/* Eraser Tool */}
                      <button
                        type="button"
                        onClick={() => setIsEraser(!isEraser)}
                        title="Bút tẩy"
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          isEraser
                            ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                        }`}
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Tẩy</span>
                      </button>

                      {/* Undo Button */}
                      <button
                        type="button"
                        onClick={undoCanvas}
                        disabled={strokeCount === 0}
                        title="Hoàn tác nét vừa vẽ"
                        className="p-1.5 rounded-lg text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-40 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Lùi lại</span>
                      </button>

                      {/* Clear Canvas */}
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="p-1.5 rounded-lg text-[11px] text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>

                  {/* Brush Color & Size Toolbar */}
                  <div className="w-full flex items-center justify-between gap-2 px-1 py-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-xs">
                    {/* Brush Colors */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-medium pl-1 hidden sm:inline">Màu:</span>
                      {[
                        { color: '#0f172a', label: 'Đen' },
                        { color: '#1d4ed8', label: 'Xanh' },
                        { color: '#dc2626', label: 'Đỏ' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => {
                            setBrushColor(c.color);
                            setIsEraser(false);
                          }}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                            brushColor === c.color && !isEraser
                              ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={`Màu ${c.label}`}
                        />
                      ))}
                    </div>

                    {/* Brush Sizes */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-medium hidden sm:inline">Cỡ nét:</span>
                      {[
                        { size: 3, label: 'Mảnh' },
                        { size: 5, label: 'Vừa' },
                        { size: 8, label: 'Đậm' },
                      ].map((s) => (
                        <button
                          key={s.size}
                          type="button"
                          onClick={() => setBrushSize(s.size)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                            brushSize === s.size
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Drawing Canvas Container with High-Visibility Visual Pointer */}
                  <div className="w-full relative border-2 border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white shadow-inner select-none">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={320}
                      onMouseDown={startDrawing}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseEnter={handleCanvasMouseEnter}
                      onMouseLeave={handleCanvasMouseLeave}
                      onMouseUp={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[180px] sm:h-[200px] cursor-crosshair block"
                      style={{ touchAction: 'none' }}
                    />

                    {/* High-Visibility Custom Brush / Pen Pointer Cursor */}
                    {cursorPos.isInside && (
                      <div
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
                        style={{
                          left: `${cursorPos.x}px`,
                          top: `${cursorPos.y}px`,
                        }}
                      >
                        {isEraser ? (
                          <div
                            className="rounded-full border-2 border-rose-500 bg-rose-500/20 shadow-md flex items-center justify-center"
                            style={{
                              width: `${brushSize * 4}px`,
                              height: `${brushSize * 4}px`,
                            }}
                          >
                            <span className="w-1 h-1 rounded-full bg-rose-600" />
                          </div>
                        ) : (
                          <div className="relative flex items-center justify-center">
                            {/* Brush Outer Ring */}
                            <div
                              className="rounded-full border-2 shadow-xs transition-all animate-pulse"
                              style={{
                                width: `${Math.max(14, brushSize * 2.8)}px`,
                                height: `${Math.max(14, brushSize * 2.8)}px`,
                                borderColor: brushColor === '#0f172a' ? '#2563eb' : brushColor,
                                backgroundColor: `${brushColor}22`,
                              }}
                            />
                            {/* Center Precision Dot */}
                            <div
                              className="absolute w-2 h-2 rounded-full ring-1.5 ring-white shadow-sm"
                              style={{ backgroundColor: brushColor }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--color-text-secondary)] text-center font-medium">
                    Di chuột để thấy đầu bút tròn rõ nét & vẽ trực tiếp chữ Hán theo ô Mễ tự cách
                  </p>
                </div>
              </div>

              {/* Uploaded Preview */}
              {uploadedImageBase64 && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={uploadedImageBase64}
                      alt="Handwriting Preview"
                      className="w-14 h-14 object-cover rounded-xl border border-emerald-500/30"
                    />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Đã nạp hình ảnh bài viết tay
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        Sẵn sàng để Gemini Vision OCR bóc tách và chấm điểm
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImageBase64(null)}
                    className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  disabled={isEvaluating || !uploadedImageBase64}
                  onClick={handleSubmitEvaluation}
                  className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{evalProgressText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Quét OCR & Chấm bài AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {evalError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {evalError}
            </div>
          )}

          {/* Loader when Evaluating */}
          {isEvaluating && (
            <div className="p-10 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-center">
              <CartoonLoader
                message="Chuyên gia AI Minnese đang đọc kỹ bài viết, đối soát ngữ pháp HSK và biên soạn bài văn mẫu..."
                size="md"
              />
            </div>
          )}

          {/* Evaluation Results Card */}
          {evaluationResult && !isEvaluating && (
            evaluationResult.isValidChinese === false || (!evaluationResult.transcribedText && (evaluationResult.total_score ?? evaluationResult.score) === 0) ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--color-surface)] border-2 border-amber-500/40 shadow-xl space-y-5 animate-in fade-in duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {inputMode === 'ocr' ? 'Chưa nhận diện được chữ Hán hợp lệ' : 'Chưa có văn bản chữ Hán để chấm điểm'}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {evaluationResult.overall_feedback || evaluationResult.overallFeedback || 'Hình ảnh hoặc bảng vẽ chỉ chứa nét vẽ nháp / ngẫu nhiên và chưa tạo thành chữ Hán có nghĩa.'}
                    </p>
                  </div>
                </div>

                {/* Guidance for Student */}
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2 text-xs">
                  <p className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Hướng dẫn để AI đọc chữ và chấm điểm chính xác:
                  </p>
                  <ul className="space-y-1.5 text-[var(--color-text-secondary)] pl-5 list-disc leading-relaxed">
                    <li><b>Viết tay trên bảng:</b> Hãy viết rõ ràng từng chữ Hán vào giữa các ô Mễ tự cách (米字格) theo đúng quy tắc bút thuận.</li>
                    <li><b>Tải ảnh viết tay:</b> Chụp ảnh góc thẳng, đủ ánh sáng, nét chữ rõ ràng trên giấy kẻ ô hoặc vở tập viết.</li>
                    <li><b>Nhập bàn phím:</b> Chuyển sang tab <b>"Nhập bàn phím"</b> để gõ trực tiếp chữ Hán nhanh và chuẩn xác 100%.</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (inputMode === 'ocr') clearCanvas();
                      setEvaluationResult(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Viết lại lên bảng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('text');
                      setEvaluationResult(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold border border-[var(--color-border)] transition-all cursor-pointer"
                  >
                    Chuyển sang gõ văn bản
                  </button>
                </div>
              </div>
            ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-6 animate-in fade-in duration-300">
              {/* Top Score Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Kết quả đánh giá bài viết HSK {evaluationResult.hskLevelEstimated || selectedHsk}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Độ dài bài viết: <b>{evaluationResult.wordCount} chữ Hán</b> • Cấp độ kiểm định: <b>HSK {evaluationResult.hskLevelEstimated || selectedHsk}</b>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {evaluationResult.total_score ?? evaluationResult.score}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-secondary)]">/100</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (evaluationResult.total_score ?? evaluationResult.score) >= 85
                        ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                        : (evaluationResult.total_score ?? evaluationResult.score) >= 70
                        ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                    }`}
                  >
                    {(evaluationResult.total_score ?? evaluationResult.score) >= 85
                      ? 'Xuất sắc (优秀)'
                      : (evaluationResult.total_score ?? evaluationResult.score) >= 70
                      ? 'Đạt yêu cầu (良好)'
                      : 'Cần cải thiện (需努力)'}
                  </span>
                </div>
              </div>

              {/* 4-Criteria Score Breakdown Grid */}
              {evaluationResult.scoring_breakdown && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                    Chi tiết điểm theo 4 tiêu chí chuẩn HSK:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-text-secondary)]">Nội dung đề tài</span>
                        <span className="font-bold text-emerald-600 font-mono">
                          {evaluationResult.scoring_breakdown.content?.score ?? 20}/{evaluationResult.scoring_breakdown.content?.max_score ?? 25}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {evaluationResult.scoring_breakdown.content?.feedback || 'Đáp ứng đúng yêu cầu chủ đề bài viết'}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-text-secondary)]">Vốn từ vựng</span>
                        <span className="font-bold text-indigo-600 font-mono">
                          {evaluationResult.scoring_breakdown.vocabulary?.score ?? 20}/{evaluationResult.scoring_breakdown.vocabulary?.max_score ?? 25}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {evaluationResult.scoring_breakdown.vocabulary?.feedback || 'Độ phong phú và chuẩn xác của từ vựng'}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-text-secondary)]">Cấu trúc ngữ pháp</span>
                        <span className="font-bold text-cyan-600 font-mono">
                          {evaluationResult.scoring_breakdown.grammar?.score ?? 20}/{evaluationResult.scoring_breakdown.grammar?.max_score ?? 25}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {evaluationResult.scoring_breakdown.grammar?.feedback || 'Trật tự từ và các mẫu câu HSK'}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-text-secondary)]">Độ liên kết & Mạch lạc</span>
                        <span className="font-bold text-amber-600 font-mono">
                          {evaluationResult.scoring_breakdown.coherence?.score ?? 20}/{evaluationResult.scoring_breakdown.coherence?.max_score ?? 25}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {evaluationResult.scoring_breakdown.coherence?.feedback || 'Tính trôi chảy và liên kết đoạn văn'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transcribed Text & Pinyin Section */}
              <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    {inputMode === 'ocr' ? 'Chữ Hán bóc tách từ ảnh OCR' : 'Bài viết gốc của học viên'}
                  </span>
                  <button
                    type="button"
                    onClick={() => playChineseAudio(evaluationResult.transcribedText)}
                    className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-emerald-500/10 text-emerald-600 transition-colors cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)] leading-relaxed">
                  {evaluationResult.transcribedText}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  {evaluationResult.pinyin}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] italic border-t border-[var(--color-border)] pt-2">
                  Dịch nghĩa tiếng Việt: "{evaluationResult.vietnamese}"
                </p>
              </div>

              {/* Handwriting Feedback if OCR */}
              {evaluationResult.handwritingFeedback && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    ✍️ Nhận xét nét chữ viết tay:
                  </p>
                  <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                    {evaluationResult.handwritingFeedback}
                  </p>
                </div>
              )}

              {/* Sentence-by-Sentence Pedagogical Analysis */}
              {evaluationResult.sentence_analysis && evaluationResult.sentence_analysis.length > 0 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Mổ xẻ & Phân tích chi tiết từng câu:
                    </h4>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      {evaluationResult.sentence_analysis.length} câu phân tích
                    </span>
                  </div>

                  <div className="space-y-3">
                    {evaluationResult.sentence_analysis.map((st, sIdx) => {
                      const isCorrect = st.status === 'correct';
                      const isUnnatural = st.status === 'unnatural';
                      return (
                        <div
                          key={sIdx}
                          className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                            isCorrect
                              ? 'bg-emerald-500/5 border-emerald-500/25'
                              : isUnnatural
                              ? 'bg-amber-500/5 border-amber-500/25'
                              : 'bg-rose-500/5 border-rose-500/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">
                              Câu {st.sentence_index || sIdx + 1}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : isUnnatural
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {isCorrect
                                ? '✅ Chuẩn ngữ pháp'
                                : isUnnatural
                                ? '⚠️ Chưa tự nhiên'
                                : '❌ Lỗi ngữ pháp'}
                            </span>
                          </div>

                          {/* Original sentence */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Câu gốc:</span>
                              <button
                                type="button"
                                onClick={() => playChineseAudio(st.original_sentence || st.original || '')}
                                className="text-emerald-600 hover:text-emerald-700 text-xs p-1"
                                title="Nghe câu gốc"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {st.original_sentence || st.original}
                            </p>
                          </div>

                          {/* Corrected sentence if not perfect */}
                          {!isCorrect && (st.corrected_sentence || st.correction) && (
                            <div className="space-y-1 bg-white dark:bg-[var(--color-surface)] p-3 rounded-xl border border-emerald-500/25 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-600">Sửa thành:</span>
                                <button
                                  type="button"
                                  onClick={() => playChineseAudio(st.corrected_sentence || st.correction || '')}
                                  className="text-emerald-600 hover:text-emerald-700 text-xs p-1"
                                  title="Nghe câu chuẩn"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                                {st.corrected_sentence || st.correction}
                              </p>
                            </div>
                          )}

                          {/* Explanation */}
                          {st.explanation && (
                            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                              💡 <b>Phân tích:</b> {st.explanation}
                            </p>
                          )}

                          {/* Grammar rule */}
                          {st.grammar_rule && (
                            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                              📘 <b>Quy tắc ngữ pháp:</b> {st.grammar_rule}
                            </div>
                          )}

                          {/* Similar example */}
                          {st.similar_example && (
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                              ✨ <b>Câu ví dụ tương tự:</b> {st.similar_example}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grammar Corrections fallback if no sentence_analysis */}
              {(!evaluationResult.sentence_analysis || evaluationResult.sentence_analysis.length === 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Mổ xẻ lỗi sai & Chẩn đoán ngữ pháp:
                  </h4>

                  {evaluationResult.grammarFeedback.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 font-semibold">
                      🎉 Hoàn hảo! Không phát hiện lỗi ngữ pháp hay trật tự từ nào nghiêm trọng.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {evaluationResult.grammarFeedback.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2"
                        >
                          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 line-through">
                              {item.original}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 font-bold">
                              {item.correction}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            💡 <b>Giải thích</b>: {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Polished & Corrected Full Text */}
              {evaluationResult.corrected_text && (
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Toàn văn bài viết đã được chỉnh sửa hoàn chỉnh:
                    </span>
                    <button
                      type="button"
                      onClick={() => playChineseAudio(evaluationResult.corrected_text || '')}
                      className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-emerald-500/10 text-emerald-600 transition-colors cursor-pointer"
                      title="Nghe bài đã sửa"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-base font-medium text-[var(--color-text-primary)] leading-relaxed">
                    {evaluationResult.corrected_text}
                  </p>
                </div>
              )}

              {/* Vocabulary Upgrades */}
              {evaluationResult.vocabularySuggestions &&
                evaluationResult.vocabularySuggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Gợi ý nâng cấp từ vựng đạt Band điểm cao:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {evaluationResult.vocabularySuggestions.map((v, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--color-text-secondary)] line-through">
                              {v.originalWord}
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                              {v.betterAlternative}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)]">
                            {v.meaning} • {v.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Native Model Exemplar Essay (100/100) */}
              {evaluationResult.nativeModelEssay && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Bài văn mẫu chuẩn bản xứ (Band điểm 100/100)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        playChineseAudio(evaluationResult.nativeModelEssay.chinese)
                      }
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Nghe đọc bài mẫu"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                    {evaluationResult.nativeModelEssay.chinese}
                  </p>
                  <p className="text-xs text-emerald-300 font-mono">
                    {evaluationResult.nativeModelEssay.pinyin}
                  </p>
                  <p className="text-xs text-slate-300 italic border-t border-white/10 pt-2">
                    Dịch: "{evaluationResult.nativeModelEssay.vietnamese}"
                  </p>
                  {evaluationResult.nativeModelEssay.highlightTip && (
                    <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      💡 <b>Bài học rút ra</b>: {evaluationResult.nativeModelEssay.highlightTip}
                    </p>
                  )}
                </div>
              )}

              {/* Overall Feedback */}
              <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Lời khuyên sư phạm tổng thể:
                </span>
                <p className="leading-relaxed">{evaluationResult.overall_feedback || evaluationResult.overallFeedback}</p>
              </div>
            </div>
            )
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Lịch sử bài viết & Điểm số của bạn
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {writingHistory.length === 0 ? (
                <div className="text-center py-10 text-xs text-[var(--color-text-secondary)] italic">
                  Chưa có bài viết nào được lưu. Hãy làm bài đầu tiên ngay!
                </div>
              ) : (
                writingHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setEvaluationResult(item.result);
                      setShowHistoryModal(false);
                    }}
                    className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-emerald-500/30 space-y-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {item.promptTitle}
                      </span>
                      <span className="font-bold text-emerald-600 font-mono text-sm">
                        {item.score}/100 điểm
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                      {item.studentText}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)]">
                      <span>HSK {item.hskLevel}</span>
                      <span>•</span>
                      <span>{item.inputMode === 'ocr' ? '📷 Ảnh viết tay' : '⌨️ Gõ phím'}</span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
