import { describe, it, expect } from 'vitest';
import {
  evaluateBlindSolveHeuristic,
  validateCandidate,
} from '../src/server/llm/questionValidator.js';

describe('Adversarial Gate 6 Blind-Solve Heuristics & Traps Challenge', () => {
  // =========================================================================
  // Dimension 1: Anti-verbatim reading comprehension across HSK 1, 2 vs 3, 4, 5, 6
  // =========================================================================
  describe('1. Anti-verbatim reading comprehension candidates across HSK levels', () => {
    it('HSK 1: Rejects anti-verbatim paraphrase when there is ZERO character overlap', () => {
      // At HSK 1, answer cannot be a complete synonymous abstraction with no anchor words in passage
      const hsk1ParaphraseCandidate = {
        stem: '小明在商店买了一件红色的衣服。★ 小明买了什么？',
        options: ['运动鞋', '一本书', '一个杯子', '一台电脑'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '运动鞋' has 0 characters in '小明在商店买了一件红色的衣服。'
      const blindSolve = evaluateBlindSolveHeuristic(hsk1ParaphraseCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
      expect(blindSolve.reason).toContain('does not contain context or keywords');
    });

    it('HSK 2: Rejects anti-verbatim paraphrase when there is ZERO character overlap', () => {
      const hsk2ParaphraseCandidate = {
        stem: '今天外面的风很大，小李决定留在家里看电视。★ 小李今天打算做什么？',
        options: ['室内休息', '出门跑步', '去超市', '找朋友玩'],
        answer_idx: 0,
        level: 2,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '室内休息' has 0 characters in the passage
      const blindSolve = evaluateBlindSolveHeuristic(hsk2ParaphraseCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
    });

    it('HSK 1: Accepts candidate with partial character overlap', () => {
      const hsk1OverlapCandidate = {
        stem: '桌子上有一只黑色的猫。★ 桌子上有什么？',
        options: ['大猫', '小狗', '小鸟', '苹果'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '大猫' shares '猫' with passage
      const blindSolve = evaluateBlindSolveHeuristic(hsk1OverlapCandidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('HSK 1: Accepts candidate with exact verbatim match', () => {
      const hsk1VerbatimCandidate = {
        stem: '桌子上有三个红色的苹果。★ 桌子上有什么？',
        options: ['苹果', '米饭', '茶杯', '书包'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(hsk1VerbatimCandidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('HSK 3: Allows pure anti-verbatim synonymous paraphrase with ZERO character overlap', () => {
      const hsk3AntiVerbatim = {
        stem: '王经理每天工作到深夜从不休息，桌上的文件堆得像小山一样。★ 关于王经理，下列哪项正确？',
        options: ['十分繁忙', '生活悠闲', '经常请假', '喜欢旅游'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '十分繁忙' has 0 characters in the passage
      const blindSolve = evaluateBlindSolveHeuristic(hsk3AntiVerbatim);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('HSK 4: Allows pure anti-verbatim paraphrase with ZERO character overlap', () => {
      const hsk4AntiVerbatim = {
        stem: '这项新技术不仅大幅降低了企业成本，还显著改善了产品质量。★ 这项技术的推广带来了什么？',
        options: ['效益显著', '费时耗力', '污染环境', '严重亏损'],
        answer_idx: 0,
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '效益显著' has 0 characters in the passage
      const blindSolve = evaluateBlindSolveHeuristic(hsk4AntiVerbatim);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('HSK 5: Allows high-level abstract inference with ZERO character overlap', () => {
      const hsk5AntiVerbatim = {
        stem: '无论面对多么严峻的挑战，他始终保持乐观，从未放弃最初的理想。★ 这段话主要赞扬了他的什么品质？',
        options: ['意志坚定', '墨守成规', '优柔寡断', '斤斤计较'],
        answer_idx: 0,
        level: 5,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '意志坚定' has 0 characters in the passage
      const blindSolve = evaluateBlindSolveHeuristic(hsk5AntiVerbatim);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('HSK 6: Allows advanced discourse inference with ZERO character overlap', () => {
      const hsk6AntiVerbatim = {
        stem: '该理论虽在学术界引起广泛争议，但其跨学科的视角无疑为后续研究开辟了全新的途径。★ 作者对该理论的态度是？',
        options: ['予以肯定', '全盘否定', '不置可否', '冷嘲热讽'],
        answer_idx: 0,
        level: 6,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '予以肯定' has 0 characters in the passage
      const blindSolve = evaluateBlindSolveHeuristic(hsk6AntiVerbatim);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Edge case: Missing level defaults to HSK 1 and enforces overlap constraint', () => {
      const noLevelCandidate = {
        stem: '小明在商店买了一件红色的衣服。★ 小明买了什么？',
        options: ['运动鞋', '一本书', '一个杯子', '一台电脑'],
        answer_idx: 0,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(noLevelCandidate as any);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
    });

    it('Passage too short (<6 Hanzi) fails INSUFFICIENT_CONTEXT even at HSK 6', () => {
      const shortPassageCandidate = {
        stem: '你看书。★ 谁看书？',
        options: ['你', '我', '他', '谁'],
        answer_idx: 0,
        level: 6,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(shortPassageCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
      expect(blindSolve.reason).toContain('too short');
    });
  });

  // =========================================================================
  // Dimension 2: Distractor negation traps with varied markers
  // Markers: 本来, 原以为, 改在, 其实, 并非, 不是, 不用 (and related: 原定, 实际上)
  // =========================================================================
  describe('2. Distractor negation traps with varied markers', () => {
    it('Marker [本来]: Distractor under 本来 does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '我们本来打算去爬山，但由于下大雨，最终改去省博物馆参观。★ 他们最后去了哪里？',
        options: ['省博物馆', '去爬山', '游乐场', '电影院'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(candidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Marker [原以为]: Distractor within 12 chars under 原以为 does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '我原以为这次考试特别难，拿到试卷才发现题量很少，做起来非常轻松。★ 这次考试怎么样？',
        options: ['非常轻松', '特别难', '完全不会', '题目写错'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '特别难' is in passage but preceded by '我原以为这次考试' (8 chars <= 12 chars)
      const blindSolve = evaluateBlindSolveHeuristic(candidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Marker [原以为] Boundary: Distractor separated by >12 chars from 原以为 triggers FALSE MULTIPLE_VALID_OPTIONS', () => {
      const candidateFarMarker = {
        stem: '我原以为这本由外国专家编写的高级语法书特别难懂，仔细阅读后发现其实写得通俗易懂。★ 这本书怎么样？',
        options: ['通俗易懂', '特别难懂', '毫无用处', '印刷模糊'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // Between '原以为' and '特别难懂' there is '这本由外国专家编写的高级语法书' (15 chars) -> distance > 12 chars!
      // The 12-char prefix window cuts off '原以为', causing a false positive MULTIPLE_VALID_OPTIONS!
      const blindSolve = evaluateBlindSolveHeuristic(candidateFarMarker);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blindSolve.competingOptions).toContain('特别难懂');
    });

    it('Marker [改在]: Superseded time distractor does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '原定今天上午九点开会，因为经理出差未归，改在下午三点半举行。★ 会议最终定在什么时候？',
        options: ['下午三点半', '上午九点', '明天上午', '后天下午'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '上午九点' preceded by '原定今天'
      const blindSolve = evaluateBlindSolveHeuristic(candidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Marker [其实]: Twist distractor debunked by 其实 does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '大家都以为他是南方人，平时喜欢喝茶，其实他是正宗的北方人。★ 他来自哪里？',
        options: ['北方人', '南方人', '外国人', '西方人'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '南方人' preceded by '大家都以为他是'
      const blindSolve = evaluateBlindSolveHeuristic(candidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Marker [并非]: Negated distractor under 并非 does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '这项实验的成功并非偶然所致，而是整个团队数年坚持不懈的成果。★ 这项实验成功的关键是什么？',
        options: ['坚持不懈', '偶然所致', '资金充足', '运气很好'],
        answer_idx: 0,
        level: 4,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '偶然所致' preceded by '并非'
      const blindSolve = evaluateBlindSolveHeuristic(candidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Marker [不是]: Negated distractor under 不是 does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '我们需要的是实际行动，不是空洞的口号。★ 我们需要什么？',
        options: ['实际行动', '空洞口号', '热烈讨论', '物质奖励'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '空洞口号' / '空洞的口号': let's test exact distractor '空洞'
      const candidate2 = {
        stem: '我们需要的是实际行动，不是空洞口号。★ 我们需要什么？',
        options: ['实际行动', '空洞口号', '热烈讨论', '物质奖励'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(candidate2);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Marker [不用]: Negated requirement distractor under 不用 does not trigger false MULTIPLE_VALID_OPTIONS', () => {
      const candidate = {
        stem: '参观这个艺术展览不用买票，凭学生证就可以直接免费入场。★ 怎样才能进场参观？',
        options: ['学生证', '买票', '工作证', '提前预约'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '买票' preceded by '不用'
      const blindSolve = evaluateBlindSolveHeuristic(candidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('True positive: UNNEGATED competing distractor in passage triggers MULTIPLE_VALID_OPTIONS', () => {
      const competingCandidate = {
        stem: '图书馆一层有中文杂志，同时二层也提供了大量的外文图书。★ 图书馆里能借阅什么？',
        options: ['中文杂志', '外文图书', '电子游戏', '电影光盘'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // Both '中文杂志' and '外文图书' are unnegated and explicitly affirmed in the passage!
      const blindSolve = evaluateBlindSolveHeuristic(competingCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blindSolve.competingOptions).toContain('外文图书');
    });

    it('Multiple mentions: Distractor mentioned once negated and once affirmed is correctly caught as competing', () => {
      const doubleMentionCandidate = {
        stem: '他本来打算买苹果，后来又改变主意买了苹果和西瓜。★ 他买了什么水果？',
        options: ['西瓜', '苹果', '香蕉', '葡萄'],
        answer_idx: 0,
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_comprehension_4opt',
      };
      // '苹果' was negated first ('本来打算买苹果'), but then unnegated ('买了苹果和西瓜')!
      const blindSolve = evaluateBlindSolveHeuristic(doubleMentionCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blindSolve.competingOptions).toContain('苹果');
    });
  });

  // =========================================================================
  // Dimension 3: Listening dialogue questions
  // Speaker turns, missing prompts, prompt leakage
  // =========================================================================
  describe('3. Listening dialogue questions: speaker turns, missing prompts, answer leakage', () => {
    it('Rejects listening dialogue with completely missing speaker turns', () => {
      const noTurnsCandidate = {
        stem: '我们明天下午两点在图书馆门口见吧。问：他们打算几点见面？',
        options: ['下午两点', '上午九点', '明天晚上', '大后天'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(noTurnsCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
      expect(blindSolve.reason).toContain('must contain structured speaker turns');
    });

    it('Rejects listening dialogue with malformed speaker markers (e.g. 男说 / 女说 instead of colons)', () => {
      const malformedCandidate = {
        stem: '男说我们明天下午两点在图书馆门口见。女说好的不见不散。问：他们打算几点见面？',
        options: ['下午两点', '上午九点', '明天晚上', '大后天'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(malformedCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
      expect(blindSolve.reason).toContain('must contain structured speaker turns');
    });

    it('Supports both Chinese colon （：） and ASCII colon (:) for speaker turns', () => {
      const asciiCandidate = {
        stem: 'A: 你好，请问王经理在吗？\nB: 他正在开会，请稍等。\n问: 王经理在做什么？',
        options: ['正在开会', '外出吃饭', '出差北京', '在家休息'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(asciiCandidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Rejects listening dialogue with completely missing question prompt (no 问 and no question mark anywhere)', () => {
      const missingPromptCandidate = {
        stem: '男：今天晚上一起去看电影吧。\n女：太好了，我很想看那部新电影。',
        options: ['看电影', '去跑步', '吃烤鸭', '去购物'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(missingPromptCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('INSUFFICIENT_CONTEXT');
      expect(blindSolve.reason).toContain('clear question');
    });

    it('Exposes Blind-Spot: Dialogue containing internal conversational ? without 问 prompt bypasses Gate 6', () => {
      // In real HSK listening dialogues, speakers frequently ask questions: '怎么样？', '行吗？', '好吗？'
      // Because worker uses /(?:问|★)[：:]|\?|？/.test(stem), internal '？' satisfies hasQuestion,
      // and questionMatch is null, so Gate 6 passes a candidate with NO test question for the student!
      const internalQuestionCandidate = {
        stem: '男：今天晚上一起去看电影怎么样？\n女：太好了，我很想去。',
        options: ['看电影', '去跑步', '吃烤鸭', '去购物'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(internalQuestionCandidate);
      // Demonstrates empirical flaw: passes as UNIQUE_ANSWER_CONFIRMED despite lacking an exam prompt
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Rejects listening dialogue when question prompt leaks the exact correct answer', () => {
      const leakingCandidate = {
        stem: '男：小李，你周末打算去哪儿旅游？\n女：我打算坐高铁去杭州西湖游玩。\n问：女的周末打算坐高铁去杭州西湖做什么？',
        options: ['游玩', '工作', '开会', '探望亲戚'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      // Answer '游玩' is in prompt: '问：女的周末打算坐高铁去杭州西湖做什么？' -> wait, does it have '游玩'?
      // Let's create an explicit leak:
      const explicitLeakingCandidate = {
        stem: '男：下午有空一起喝茶吗？\n女：不行，我得去图书馆看书准备考试。\n问：女的为什么要去图书馆看书准备考试？',
        options: ['准备考试', '找朋友', '借电脑', '买文具'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      // Answer is '准备考试', and prompt is '问：女的为什么要去图书馆看书准备考试？'
      const blindSolve = evaluateBlindSolveHeuristic(explicitLeakingCandidate);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blindSolve.reason).toContain('Question prompt leaks the exact correct answer');
    });

    it('Accepts listening dialogue when question prompt asks cleanly without answer leakage', () => {
      const cleanCandidate = {
        stem: '男：下午有空一起喝茶吗？\n女：不行，我得去图书馆看书准备考试。\n问：女的下午要做什么？',
        options: ['准备考试', '找朋友', '借电脑', '买文具'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(cleanCandidate);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Listening dialogue with distractor twist in dialogue passes Gate 6', () => {
      const dialogueTwistCandidate = {
        stem: '男：我们本来约在校门口碰面，你现在到哪儿了？\n女：我刚出地铁站，改在咖啡馆见吧。\n问：他们最后决定在哪里碰面？',
        options: ['咖啡馆', '校门口', '地铁站', '图书馆'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      // '校门口' preceded by '本来约在'
      // '地铁站' is where female just exited ('刚出地铁站'), not meeting place
      // Wait: in '我刚出地铁站', is '地铁站' preceded by negation prefix?
      // Notice: '刚出' is not in NEGATION_OR_TWIST_PREFIXES!
      // Let's see if '地铁站' is caught as competing if not negated, or if we ensure it has twist prefix:
      const dialogueWithNegatedDistractor = {
        stem: '男：我们本来打算在校门口碰面，后来改在咖啡馆见行吗？\n女：好的，没问题，那就不去校门口了，去咖啡馆吧。\n问：他们最后决定在哪里碰面？',
        options: ['咖啡馆', '校门口', '书店', '体育馆'],
        answer_idx: 0,
        level: 3,
        skill: 'listening' as const,
        part_type: 'listen_dialogue_qa_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(dialogueWithNegatedDistractor);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });
  });

  // =========================================================================
  // Dimension 4: End-to-end integration via validateCandidate
  // =========================================================================
  describe('4. Full candidate validation integration', () => {
    it('Validates Gate 6 status propagation into validateCandidate', () => {
      const validHsk4Candidate = {
        stem: '很多人以为经常跑步一定会损伤膝盖，但科学研究表明，合理运动其实对关节有保护作用。★ 科学研究说明了什么？',
        options: ['保护关节', '损伤膝盖', '耗费精力', '加重病情'],
        answer_idx: 0,
        pinyin: 'hěnduō rén yǐwéi jīngcháng pǎobù yídìng huì sǔnshāng xīgài...',
        explanation_vi: 'Giải thích: Nghiên cứu khoa học chỉ ra vận động hợp lý thực tế có tác dụng bảo vệ khớp (保护关节).',
        level: 4,
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
        trap_type: 'anti_verbatim',
      };

      const result = validateCandidate(validHsk4Candidate as any, [], {
        expectedLevel: 4,
        expectedSkill: 'reading',
        expectedPartType: 'read_comprehension_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('Fails validation when candidate has unnegated competing options', () => {
      const ambiguousCandidate = {
        stem: '张老师今天买了香蕉，同时也买了很多苹果。★ 张老师今天买了什么？',
        options: ['香蕉', '苹果', '西瓜', '葡萄'],
        answer_idx: 0,
        pinyin: 'zhāng lǎoshī jīntiān mǎile xiāngjiāo...',
        explanation_vi: 'Giải thích: Trương lão sư mua chuối.',
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
      };

      const result = validateCandidate(ambiguousCandidate as any, [], {
        expectedLevel: 2,
        expectedSkill: 'reading',
        expectedPartType: 'read_comprehension_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Multiple valid options detected'))).toBe(true);
      expect(result.solverAnalysis.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
    });
  });
});
