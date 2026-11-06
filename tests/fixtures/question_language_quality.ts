import type { CandidateQuestion } from '../../src/server/llm/types.js';

export const coherentHsk1Candidate: CandidateQuestion = {
  stem: '今天的晚餐____。',
  completed_stem: '今天的晚餐很好吃。',
  options: ['很好吃', '学校', '出租车', '苹果'],
  answer_idx: 0,
  pinyin: 'jīn tiān de wǎn cān hěn hǎo chī。',
  explanation_vi: [
    'Dịch nghĩa: Bữa tối hôm nay rất ngon.',
    '- Đáp án đúng: “很好吃” mô tả tự nhiên mùi vị của bữa tối.',
    '- Phân tích phương án nhiễu:',
    '  + Phương án B (学校) là địa điểm, không thể mô tả bữa tối.',
    '  + Phương án C (出租车) là phương tiện, không phù hợp ngữ cảnh.',
    '  + Phương án D (苹果) là một món ăn riêng, không hoàn thành câu này.',
    'Cấu trúc bẫy là kết hợp từ.',
  ].join('\n'),
  level: 1,
  skill: 'reading',
  part_type: 'read_fill_blank_4opt',
  illustration_theme: null,
  topic: 'dining',
  distractor_rationales: {
    '1': '学校 là địa điểm, không diễn tả mùi vị.',
    '2': '出租车 là phương tiện, không phù hợp.',
    '3': '苹果 không hoàn thành câu về bữa tối.',
  },
  naturalness_review: {
    status: 'natural',
    rationale_vi: 'Câu hoàn chỉnh đủ thành phần và tự nhiên trong ngữ cảnh bữa tối.',
  },
};

export const observedGroqCandidate: CandidateQuestion = {
  stem: '今天晚餐____。',
  completed_stem: '今天晚餐很好吃。',
  options: ['学校', '好吃', '出租车', '苹果'],
  answer_idx: 1,
  pinyin: 'jīn tiān wǎn cān hěn hào chī.',
  explanation_vi: "Dịch nghĩa: Bữa tối hôm nay thật ngon.\n- Đáp án đúng: '好吃' là cụm từ tính từ thường dùng để đánh giá hương vị của thức ăn. Trong câu '晚餐____', '好吃' kết hợp hoàn hảo.\n- Phân tích phương án nhiễu:\n  + Phương án A (学校): Là danh từ chỉ địa điểm.\n  + Phương án C (出租车): Là danh từ chỉ phương tiện.\n  + Phương án D (苹果): Là danh từ chỉ trái cây, không thể đứng sau '晚餐' làm vị ngữ hoặc bổ ngữ tính",
  level: 1,
  skill: 'reading',
  part_type: 'read_fill_blank_4opt',
  illustration_theme: null,
  topic: 'dining',
};
