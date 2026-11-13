import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Users,
  MessageSquare,
  GraduationCap,
  Award,
  Layers,
  Flame,
  FileText,
  Lightbulb,
  Lock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Loader2,
  Pause,
  Radio,
  Mic,
  PenTool,
  Shuffle,
} from 'lucide-react';
import { NEW_HSK1_FULL_LESSONS, DetailedTextbookLesson, LessonText } from '../../data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../../data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../../data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../../data/newHsk4BookData';
import { NEW_HSK5_FULL_LESSONS } from '../../data/newHsk5BookData';
import { NEW_HSK6_FULL_LESSONS } from '../../data/newHsk6BookData';
import { COURSEBOOK_AUDIO_MANIFEST } from '../../data/coursebookAudioManifest';
import { COURSEBOOK_CHARACTER_ANCHORS, CharacterAnchor2D } from '../../data/coursebookCharacterAnchors';
import {
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
  resolveSmartBubbleBox,
  CharacterBubbleConfig,
} from '../../data/hsk1BubbleLayouts';
import { LessonExercisesStudio } from './LessonExercisesStudio';
import { WorkbookView } from './WorkbookView';
import { playChineseAudio, stopChineseAudio } from '../../utils/chineseAudio';
import { formatPartOfSpeechVietnamese } from '../../utils/radicalUtils';
import { WordItem, UserProfile, SRSCardState, CoursebookTab, CoursebookReturnOrigin } from '../../types';
import { joinClassByCode } from '../../lib/firebase';
import { WordDetailModal } from '../Dictionary/WordDetailModal';
import { PronunciationFlashcardsModal } from './PronunciationFlashcardsModal';
import { VocabularyWhiteboardModal } from './VocabularyWhiteboardModal';
import { logStudyActivity } from '../../utils/activityLogger';

interface CoursebookViewProps {
  userProfile?: UserProfile;
  onSaveProfile?: (updated: Partial<UserProfile>) => void;
  onStartFlashcards?: (
    words: WordItem[],
    lessonNumber?: number,
    level?: 1 | 2 | 3 | 4 | 5 | 6,
    originTab?: CoursebookTab
  ) => void;
  onOpenAiTutorWithTopic?: (topic: string) => void;
  srsCards?: Record<string, SRSCardState>;
  onAddWordToSRS?: (wordId: string) => void;
  initialHskLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  initialLessonIndex?: number;
  initialTab?: CoursebookTab;
  onClearInitialCoursebookState?: () => void;
}


const LESSON_ILLUSTRATIONS: Record<string, { src: string; caption: string }> = {
  // ============================================================================
  // HSK 1 (Chuẩn giáo trình HSK 1 3.0 - 45 bài khóa minh họa chân thực)
  // ============================================================================
  // Bài 1
  'hsk1-l1-t1': {
    src: '/textbook_art/hsk1_30_l1_t1.png',
    caption: '在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: "AI小语，你好！")',
  },
  'hsk1-l1-t2': {
    src: '/textbook_art/hsk1_30_l1_t2.png',
    caption: '在课堂上，学生们向老师问好。(Trong lớp học, các bạn học sinh chào cô giáo và AI Tiểu Ngữ: "老师，您好！ - 你们好！")',
  },
  'hsk1-l1-t3': {
    src: '/textbook_art/hsk1_30_l1_t3.png',
    caption: '在课堂上，学生们致谢与告别。(Cuối buổi học, học sinh cảm ơn và chào tạm biệt: "谢谢！ - 不客气！ - 老师，再见！")',
  },

  // Bài 2
  'hsk1-l2-t1': {
    src: '/textbook_art/hsk1_30_l2_t1.png',
    caption: '在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh: "请问，你叫什么名字？ - 我叫陈天中。")',
  },
  'hsk1-l2-t2': {
    src: '/textbook_art/hsk1_30_l2_t2.png',
    caption: '在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt thành Annie: "对不起！ - 没关系！")',
  },
  'hsk1-l2-t3': {
    src: '/textbook_art/hsk1_30_l2_t3.png',
    caption: '在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau: "你好！我叫李文。 - 很高兴认识你。")',
  },

  // Bài 3
  'hsk1-l3-t1': {
    src: '/textbook_art/hsk1_30_l3_t1.png',
    caption: '在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau, hai người tiếp tục trò chuyện).',
  },
  'hsk1-l3-t2': {
    src: '/textbook_art/hsk1_30_l3_t2.png',
    caption: '在教室里，下课后，安妮在看陈天中手机里的照片。(Trong lớp học, sau giờ học, Annie xem ảnh trên điện thoại của Trần Thiên Trung).',
  },
  'hsk1-l3-t3': {
    src: '/textbook_art/hsk1_30_l3_t3.png',
    caption: '在家里，王一雪给王一飞打视频电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại video cho cô giáo Vương Nhất Phi).',
  },

  // Bài 4
  'hsk1-l4-t1': {
    src: '/textbook_art/hsk1_30_l4_t1.png',
    caption: '在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).',
  },
  'hsk1-l4-t2': {
    src: '/textbook_art/hsk1_30_l4_t2.png',
    caption: '在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Lạc nghỉ giải lao trò chuyện).',
  },
  'hsk1-l4-t3': {
    src: '/textbook_art/hsk1_30_l4_t3.png',
    caption: '在街上，王一雪带着儿子偶遇杨同乐。(Trên đường, Vương Nhất Tuyết dắt con trai tình cờ gặp Dương Đồng Lạc).',
  },

  // Bài 5
  'hsk1-l5-t1': {
    src: '/textbook_art/hsk1_30_l5_t1.png',
    caption: '在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang trò chuyện.)',
  },
  'hsk1-l5-t2': {
    src: '/textbook_art/hsk1_30_l5_t2.png',
    caption: '在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao.)',
  },
  'hsk1-l5-t3': {
    src: '/textbook_art/hsk1_30_l5_t3.png',
    caption: '在公司里，王一雪和杨同乐下班时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói chuyện lúc tan ca.)',
  },

  // Bài 6
  'hsk1-l6-t1': {
    src: '/textbook_art/hsk1_30_l6_t1.png',
    caption: '在校园里，李文向白家月要手机号。(Trong khuôn viên trường, Lý Văn hỏi xin số điện thoại của Bạch Gia Nguyệt.)',
  },
  'hsk1-l6-t2': {
    src: '/textbook_art/hsk1_30_l6_t2.png',
    caption: '在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)',
  },
  'hsk1-l6-t3': {
    src: '/textbook_art/hsk1_30_l6_t3.png',
    caption: '在家里，王一雪全家在讨论周末晚餐安排。(Ở nhà, cả gia đình Vương Nhất Tuyết bàn về kế hoạch ăn tối cuối tuần.)',
  },

  // Bài 7
  'hsk1-l7-t1': {
    src: '/textbook_art/hsk1_30_l7_t1.png',
    caption: '白家月和安妮在打电话。(Bạch Gia Nguyệt và An Ni đang gọi điện thoại cho nhau.)',
  },
  'hsk1-l7-t2': {
    src: '/textbook_art/hsk1_30_l7_t2.png',
    caption: '在校园里，李文遇到白家月。(Trong khuôn viên trường, Lý Văn tình cờ gặp Bạch Gia Nguyệt.)',
  },
  'hsk1-l7-t3': {
    src: '/textbook_art/hsk1_30_l7_t3.png',
    caption: '王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho chồng là Lưu Minh.)',
  },

  // Bài 8
  'hsk1-l8-t1': {
    src: '/textbook_art/hsk1_30_l8_t1.png',
    caption: '在王一飞家，白家月和陈天中来做客。(Ở nhà Vương Nhất Phi, Bạch Gia Nguyệt và Trần Thiên Trung đến thăm.)',
  },
  'hsk1-l8-t2': {
    src: '/textbook_art/hsk1_30_l8_t2.png',
    caption: '在教室里，下课后，白家月给李文打电话。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt gọi điện cho Lý Văn.)',
  },
  'hsk1-l8-t3': {
    src: '/textbook_art/hsk1_30_l8_t3.png',
    caption: '在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, Lưu Minh trò chuyện với đồng nghiệp là tiểu Hồ.)',
  },

  // Bài 9
  'hsk1-l9-t1': {
    src: '/textbook_art/hsk1_30_l9_t1.png',
    caption: '在校园里，李文和白家月在聊天儿。(Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt đang trò chuyện.)',
  },
  'hsk1-l9-t2': {
    src: '/textbook_art/hsk1_30_l9_t2.png',
    caption: '在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)',
  },
  'hsk1-l9-t3': {
    src: '/textbook_art/hsk1_30_l9_t3.png',
    caption: '在公司里，王一雪和杨同乐休息时聊天儿，谈论周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao về cuộc sống cuối tuần.)',
  },

  // Bài 10
  'hsk1-l10-t1': {
    src: '/textbook_art/hsk1_30_l10_t1.png',
    caption: '在小店里，王一雪在买杯子。(Ở cửa hàng nhỏ, Vương Nhất Tuyết đang mua cốc.)',
  },
  'hsk1-l10-t2': {
    src: '/textbook_art/hsk1_30_l10_t2.png',
    caption: '在集市上，王一雪在买水果。(Ở chợ, Vương Nhất Tuyết đang mua hoa quả.)',
  },
  'hsk1-l10-t3': {
    src: '/textbook_art/hsk1_30_l10_t3.png',
    caption: '在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm thương mại, Lưu Minh và Vương Nhất Tuyết đang mua quần áo cho các con.)',
  },

  // Bài 11
  'hsk1-l11-t1': {
    src: '/textbook_art/hsk1_30_l11_t1.png',
    caption: '在路上，李文正在找饭店，王一飞给他打电话。(Trên đường, Lý Văn đang tìm nhà hàng, Vương Nhất Phi gọi điện cho anh.)',
  },
  'hsk1-l11-t2': {
    src: '/textbook_art/hsk1_30_l11_t2.png',
    caption: '在饭店里，王一飞和李文见面后聊天儿。(Ở nhà hàng, Vương Nhất Phi và Lý Văn gặp nhau và trò chuyện.)',
  },
  'hsk1-l11-t3': {
    src: '/textbook_art/hsk1_30_l11_t3.png',
    caption: '星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy, Lưu Minh sắp đi làm thêm giờ ở bệnh viện, trước khi ra ngoài trò chuyện với con gái.)',
  },

  // Bài 12
  'hsk1-l12-t1': {
    src: '/textbook_art/hsk1_30_l12_t1.png',
    caption: '王一雪给王一飞打电话，问那边的情况。(Vương Nhất Tuyết gọi điện cho Vương Nhất Phi, hỏi về tình hình bên đó.)',
  },
  'hsk1-l12-t2': {
    src: '/textbook_art/hsk1_30_l12_t2.png',
    caption: '在公司电梯里，王一雪和杨同乐在聊天儿。(Trong thang máy công ty, Vương Nhất Tuyết và Dương Đồng Nhạc đang trò chuyện.)',
  },
  'hsk1-l12-t3': {
    src: '/textbook_art/hsk1_30_l12_t3.png',
    caption: '昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc.)',
  },

  // Bài 13
  'hsk1-l13-t1': {
    src: '/textbook_art/hsk1_30_l13_t1.png',
    caption: '在教室里，下课后，白家月向王老师问问题。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt hỏi cô giáo Vương một câu hỏi.)',
  },
  'hsk1-l13-t2': {
    src: '/textbook_art/hsk1_30_l13_t2.png',
    caption: '在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết muốn ăn sáng.)',
  },
  'hsk1-l13-t3': {
    src: '/textbook_art/hsk1_30_l13_t3.png',
    caption: '在餐厅里，刘明在点餐。(Ở nhà hàng, Lưu Minh đang gọi đồ ăn.)',
  },

  // Bài 14
  'hsk1-l14-t1': {
    src: '/textbook_art/hsk1_30_l14_t1.png',
    caption: '在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang nói về chuyến dã ngoại vừa rồi.)',
  },
  'hsk1-l14-t2': {
    src: '/textbook_art/hsk1_30_l14_t2.png',
    caption: '在课堂上，王一飞在询问学生们的学习情况。(Trong lớp học, Vương Nhất Phi đang hỏi về tình hình học tập của học sinh.)',
  },
  'hsk1-l14-t3': {
    src: '/textbook_art/hsk1_30_l14_t3.png',
    caption: '在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang nói về việc con cái lên cấp học mới.)',
  },

  // Bài 15
  'hsk1-l15-t1': {
    src: '/textbook_art/hsk1_30_l15_t1.png',
    caption: '在李文家，李文邀请陈天中、白家月等朋友品尝中餐。(Ở nhà Lý Văn, Lý Văn mời Trần Thiên Trung, Bạch Gia Nguyệt và các bạn thưởng thức ẩm thực Trung Quốc.)',
  },
  'hsk1-l15-t2': {
    src: '/textbook_art/hsk1_30_l15_t2.png',
    caption: '在李文家，大家边吃饭边谈论假期计划。(Ở nhà Lý Văn, mọi người vừa ăn vừa bàn về kế hoạch nghỉ lễ.)',
  },
  'hsk1-l15-t3': {
    src: '/textbook_art/hsk1_30_l15_t3.png',
    caption: '在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, Bạch Gia Nguyệt, An Ni và cô giáo Vương đang nói về chuyện đi du lịch Bắc Kinh.)',
  },


  // HSK 2 - Bài 1: 她请我们吃了北京烤鸭
  'hsk2-l1-t1': {
    src: '/textbook_art/hsk2_30_l1_t1.png',
    caption: '在机场，王一雪接到了白家月和安妮。(Ở sân bay, Vương Nhất Tuyết nồng nhiệt vẫy tay đón Bạch Gia Nguyệt và Annie).',
  },
  'hsk2-l1-t2': {
    src: '/textbook_art/hsk2_30_l1_t2.png',
    caption: '在王一雪的车里，白家月、安妮和王一雪在聊天儿。(Trong xe của Vương Nhất Tuyết trên đường phố Bắc Kinh, mọi người vui vẻ trò chuyện).',
  },
  'hsk2-l1-t3': {
    src: '/textbook_art/hsk2_30_l1_t3.png',
    caption: '在王一雪的车里，白家月接到了陈天中的电话。(Trong xe, Bạch Gia Nguyệt nghe điện thoại của Trần Thiên Trung báo tin đã đến Bắc Kinh).',
  },
  'hsk2-l1-t4': {
    src: '/textbook_art/hsk2_30_l1_t4.png',
    caption: '在酒店，白家月给王一飞老师发信息。(Ở khách sạn buổi tối, Bạch Gia Nguyệt vui vẻ nhắn tin cho cô giáo kể về món vịt quay Bắc Kinh).',
  },
  // HSK 2 - Bài 2: 还是打车去北大吧
  'hsk2-l2-t1': {
    src: '/textbook_art/hsk2_30_l2_t1.png',
    caption: '在宾馆前台，白家月和安妮向服务员咨询。(Ở quầy lễ tân khách sạn, Bạch Gia Nguyệt và Annie hỏi đường đi Đại học Bắc Kinh).',
  },
  'hsk2-l2-t2': {
    src: '/textbook_art/hsk2_30_l2_t2.png',
    caption: '在北京大学，白家月和安妮在参观校园。(Ở Đại học Bắc Kinh, Bạch Gia Nguyệt và Annie đi dạo ngắm khuôn viên trường rộng lớn).',
  },
  'hsk2-l2-t3': {
    src: '/textbook_art/hsk2_30_l2_t3.png',
    caption: '在北京大学，白家月和安妮在参观校园。(Ở khuôn viên trường, Annie chỉ vào rạp chiếu phim Bách Niên Kỷ Niệm Đường bên trong trường).',
  },
  'hsk2-l2-t4': {
    src: '/textbook_art/hsk2_30_l2_t4.png',
    caption: '在北京大学门口，白家月给陈天中发信息。(Ở cổng Đại học Bắc Kinh, Bạch Gia Nguyệt gửi tin nhắn chia sẻ về ngôi trường cho Trần Thiên Trung).',
  },
  // HSK 2 - Bài 3: 我想去西安旅游
  'hsk2-l3-t1': {
    src: '/textbook_art/hsk2_30_l3_t1.png',
    caption: '在家门口，刘明开门进到家里。(Ở cửa nhà, bác sĩ Lưu Minh mở cửa bước vào nhà sau ngày làm việc vất vả).',
  },
  'hsk2-l3-t2': {
    src: '/textbook_art/hsk2_30_l3_t2.png',
    caption: '在客厅，刘明和王一雪在聊天儿。(Ở phòng khách, Lưu Minh và Vương Nhất Tuyết bàn về việc thu xếp thời gian đi du lịch).',
  },
  'hsk2-l3-t3': {
    src: '/textbook_art/hsk2_30_l3_t3.png',
    caption: '在客厅，刘明和王一雪在聊天儿。(Lưu Minh mời vợ ăn táo đã rửa sạch, Vương Nhất Tuyết đề xuất đi du lịch Tây An).',
  },
  'hsk2-l3-t4': {
    src: '/textbook_art/hsk2_30_l3_t4.png',
    caption: '在家里，王一雪给好朋友打电话。(Ở nhà, Vương Nhất Tuyết gọi điện chia sẻ với bạn thân mong muốn chồng được nghỉ ngơi).',
  },
  // HSK 2 - Bài 4: 你穿红色的很好看
  'hsk2-l4-t1': {
    src: '/textbook_art/hsk2_30_l4_t1.png',
    caption: '在商场外，王一雪和刘小雪在走路。(Bên ngoài trung tâm thương mại mới mở, hai mẹ con vui vẻ cùng nhau đi dạo sắm đồ).',
  },
  'hsk2-l4-t2': {
    src: '/textbook_art/hsk2_30_l4_t2.png',
    caption: '在服装店，王一雪和刘小雪在买裤子。(Ở tiệm thời trang, mẹ gợi ý Tiểu Tuyết thử chiếc quần màu đỏ tươi tắn).',
  },
  'hsk2-l4-t3': {
    src: '/textbook_art/hsk2_30_l4_t3.png',
    caption: '在商场店里，王一雪和刘小雪在买书包。(Trong cửa hàng, Tiểu Tuyết chọn chiếc ba lô màu xanh lá cây rất ưng ý).',
  },
  'hsk2-l4-t4': {
    src: '/textbook_art/hsk2_30_l4_t4.png',
    caption: '在房间，刘小雪在写日记。(Trong phòng ngủ ấm cúng, Lưu Tiểu Tuyết vui vẻ viết nhật ký về chiếc ba lô xanh và quần đỏ vừa mua).',
  },
  // HSK 2 - Bài 5: 第一次去中国朋友家
  'hsk2-l5-t1': {
    src: '/textbook_art/hsk2_30_l5_t1.png',
    caption: '在宾馆楼下，安妮给白家月打电话。(Ở dưới sảnh khách sạn, Annie gọi điện hối Bạch Gia Nguyệt xuống để kịp sang nhà bạn Trung Quốc).',
  },
  'hsk2-l5-t2': {
    src: '/textbook_art/hsk2_30_l5_t2.png',
    caption: '在王一雪家，白家月和安妮来做客。(Tại nhà chị Nhất Tuyết, Bạch Gia Nguyệt và Annie chào hỏi và tặng quà ông bà nội).',
  },
  'hsk2-l5-t3': {
    src: '/textbook_art/hsk2_30_l5_t3.png',
    caption: '在王一雪家，白家月和安妮在吃饭。(Tại bàn ăn, mọi người quây quần thưởng thức bữa cơm ấm cúng và trà sữa thơm ngon).',
  },
  'hsk2-l5-t4': {
    src: '/textbook_art/hsk2_30_l5_t4.png',
    caption: '在宾馆，白家月给李文发信息。(Ở khách sạn, Bạch Gia Nguyệt vui vẻ nhắn tin cho Lý Văn kể về chuyến thăm nhà và đi bộ về khách sạn).',
  },
  // HSK 2 - Bài 6: 小雪，生日快乐！
  'hsk2-l6-t1': {
    src: '/textbook_art/hsk2_30_l6_t1.png',
    caption: '在家里，刘明和王一雪在聊天儿。(Ở phòng khách ấm áp, bác sĩ Lưu Minh và Vương Nhất Tuyết bàn nhau tặng bút vẽ và đặt bánh sinh nhật thật to cho con gái).',
  },
  'hsk2-l6-t2': {
    src: '/textbook_art/hsk2_30_l6_t2.png',
    caption: '在客厅，刘明一家人在聊天儿。(Ở phòng khách, cả nhà chúc mừng sinh nhật Lưu Tiểu Tuyết, em trai Tiểu Minh háo hức nhìn chị mở hộp quà toàn bút vẽ màu mới).',
  },
  'hsk2-l6-t3': {
    src: '/textbook_art/hsk2_30_l6_t3.png',
    caption: '在客厅，刘明一家人在给刘小雪过生日。(Bữa tiệc sinh nhật ấm cúng bên bàn ăn với bánh kem cắm nến, bát mì trường thọ dài và các món cá thịt thơm ngon).',
  },
  'hsk2-l6-t4': {
    src: '/textbook_art/hsk2_30_l6_t4.png',
    caption: '在房间，王一雪在写日记。(Đêm muộn trong phòng ngủ bên ánh đèn bàn, Vương Nhất Tuyết hạnh phúc viết nhật ký khi hai con đã ngủ say giấc).',
  },
  // HSK 2 - Bài 7: 你想不想跟我一起去？
  'hsk2-l7-t1': {
    src: '/textbook_art/hsk2_30_l7_t1.png',
    caption: '在教室门外，安妮和陈天中在聊天儿。(Ngoài phòng học, Trần Thiên Trung cầm bóng rổ chuẩn bị ra sân, Annie gọi hỏi thăm xem bạn đi đâu).',
  },
  'hsk2-l7-t2': {
    src: '/textbook_art/hsk2_30_l7_t2.png',
    caption: '在校园路上，安妮和陈天中在散步聊天儿。(Trên đường dạo rợp bóng cây trong khuôn viên trường, Thiên Trung chia sẻ thói quen chạy bộ và bơi lội mỗi ngày).',
  },
  'hsk2-l7-t3': {
    src: '/textbook_art/hsk2_30_l7_t3.png',
    caption: '在篮球场边，陈天中和安妮在聊天儿。(Bên sân thể thao, Thiên Trung hào hứng rủ Annie cùng tham gia chơi bóng rổ để rèn luyện sức khỏe).',
  },
  'hsk2-l7-t4': {
    src: '/textbook_art/hsk2_30_l7_t4.png',
    caption: '在宿舍房间，陈天中在写日记。(Trong phòng ký túc xá bên ánh đèn bàn, Thiên Trung vui vẻ viết nhật ký ghi lại một ngày vận động thể thao bổ ích).',
  },
  // HSK 2 - Bài 8: 虽然你忘了，但是我记得
  'hsk2-l8-t1': {
    src: '/textbook_art/hsk2_30_l8_t1.png',
    caption: '在商场，王一雪和刘明在挑选精美的手表。(Ở trung tâm thương mại sang trọng, Vương Nhất Tuyết thích thú chỉ vào chiếc đồng hồ bên trái, Lưu Minh mỉm cười tán thành).',
  },
  'hsk2-l8-t2': {
    src: '/textbook_art/hsk2_30_l8_t2.png',
    caption: '在电影院外，王一雪和刘明商量看电影并用手机网购电影票。(Trước sảnh rạp chiếu phim ấm cúng, Vương Nhất Tuyết cầm điện thoại vui vẻ gợi ý mua vé qua mạng vừa rẻ vừa tiện).',
  },
  'hsk2-l8-t3': {
    src: '/textbook_art/hsk2_30_l8_t3.png',
    caption: '在饭馆，刘明 bất ngờ tặng đồng hồ chúc mừng sinh nhật Vương Nhất Tuyết。(Bên bàn tiệc nhà hàng lung linh ấm áp, Lưu Minh bất ngờ trao hộp đồng hồ quý giá chúc mừng sinh nhật vợ khiến cô xúc động nghẹn ngào).',
  },
  'hsk2-l8-t4': {
    src: '/textbook_art/hsk2_30_l8_t4.png',
    caption: '晚上在家，夫妻俩 hạnh phúc ngắm nhìn chiếc đồng hồ mới。(Buổi tối đầm ấm ở phòng khách, Vương Nhất Tuyết hạnh phúc đeo chiếc đồng hồ mới trên tay bên cạnh người chồng chu đáo).',
  },
  'hsk2-l9-t1': {
    src: '/textbook_art/hsk2_30_l9_t1.png',
    caption: '在服装店，王一雪和刘明在认真为儿子挑选新裤子。(Trong tiệm trang phục, vợ chồng Vương Nhất Tuyết và Lưu Minh chu đáo chọn lựa chiếc quần đen mới cho cậu con trai).',
  },
  'hsk2-l9-t2': {
    src: '/textbook_art/hsk2_30_l9_t2.png',
    caption: '在商店门口，王一雪拿着奶茶，刘明端着热咖啡开心交谈。(Trước cửa tiệm mua sắm, vợ vui vẻ cầm ly trà sữa, chồng cầm ly cà phê thơm cùng trò chuyện thân mật).',
  },
  'hsk2-l9-t3': {
    src: '/textbook_art/hsk2_30_l9_t3.png',
    caption: '在绿树成荫的路上，夫妻俩迎着夕阳一边散步一边聊天走回家。(Dưới hàng cây xanh ngập nắng chiều, hai vợ chồng thong thả tản bộ tập thể dục trên đường về nhà).',
  },
  'hsk2-l9-t4': {
    src: '/textbook_art/hsk2_30_l9_t4.png',
    caption: '夜晚在温馨的书房里，王一雪在台灯下幸福地写下生活日记。(Buổi tối trong góc phòng yên ả bên ánh đèn bàn, Vương Nhất Tuyết hạnh phúc ghi lại từng dòng nhật ký gia đình).',
  },
  'hsk2-l10-t1': {
    src: '/textbook_art/hsk2_30_l10_t1.png',
    caption: '在早晨的房间里，刘明看着手表叮嘱准备出发。(Trong căn phòng buổi sáng, bác sĩ Lưu Minh xem đồng hồ chu đáo nhắc nhở chuẩn bị đồ đạc sẵn sàng xuất phát).',
  },
  'hsk2-l10-t2': {
    src: '/textbook_art/hsk2_30_l10_t2.png',
    caption: '在书房里，王一雪温和地陪伴女儿刘小雪复习功课准备考试。(Trong phòng học sáng rực, Vương Nhất Tuyết dịu dàng đồng hành cùng con gái Lưu Tiểu Tuyết xem lại bài vở chuẩn bị thi cử).',
  },
  'hsk2-l10-t3': {
    src: '/textbook_art/hsk2_30_l10_t3.png',
    caption: '在餐厅里，妈妈端出奶茶与饭菜，姐姐考完试开心回家，弟弟自豪地举起洗干净的双手。(Trong phòng ăn gia đình, mẹ dọn trà sữa và cơm nóng, con gái thi tốt về nhà, cậu em trai khoe đôi bàn tay đã rửa sạch tinh).',
  },
  'hsk2-l10-t4': {
    src: '/textbook_art/hsk2_30_l10_t4.png',
    caption: '夜晚窗外月色皎洁，在书桌前静心写下一天的生活日记。(Đêm về dưới ánh trăng dịu êm qua khung cửa sổ, bên bàn học khẽ ghi lại từng khoảnh khắc gia đình yêu thương).',
  },
  'hsk2-l11-t1': {
    src: '/textbook_art/hsk2_30_l11_t1.png',
    caption: '在明亮的教室里，老师和学生亲切交流，关切询问。(Trong lớp học ngập tràn ánh nắng, cô giáo ân cần trò chuyện và hỏi thăm học trò thân yêu).',
  },
  'hsk2-l11-t2': {
    src: '/textbook_art/hsk2_30_l11_t2.png',
    caption: '在行驶的汽车上，大家一边看窗外风景一边通电话。(Trên chuyến xe ô tô êm ả, mọi người vừa ngắm phố xá vừa vui vẻ trao đổi qua điện thoại).',
  },
  'hsk2-l11-t3': {
    src: '/textbook_art/hsk2_30_l11_t3.png',
    caption: '在老师温暖的家中，大家围坐在摆满中国美食的餐桌旁。(Tại phòng ăn ấm cúng nhà cô giáo, mọi người cùng quây quần bên bàn tiệc đầy ắp món ngon truyền thống).',
  },
  'hsk2-l11-t4': {
    src: '/textbook_art/hsk2_30_l11_t4.png',
    caption: '夜晚在温馨的房间里，白家月在台灯下感动地写日记。(Đêm về trong căn phòng yên bình bên ánh đèn ấm áp, Bạch Gia Nguyệt xúc động ghi lại từng dòng nhật ký biết ơn cô giáo và bạn bè).',
  },
  'hsk2-l12-t1': {
    src: '/textbook_art/hsk2_30_l12_t1.png',
    caption: '在阳光明媚的房间里，王一雪接听电话关切询问天气。(Bên khung cửa sổ ngập tràn nắng vàng Bắc Kinh, Vương Nhất Tuyết ấm áp nghe điện thoại hỏi han thời tiết).',
  },
  'hsk2-l12-t2': {
    src: '/textbook_art/hsk2_30_l12_t2.png',
    caption: '雪花纷飞的窗前，王一飞老师手握电话温暖交谈。(Bên khung cửa sổ tuyết trắng lất phất bay, cô giáo Vương Nhất Phi ấm áp trò chuyện và dặn dò em gái).',
  },
  'hsk2-l12-t3': {
    src: '/textbook_art/hsk2_30_l12_t3.png',
    caption: '阳光灿烂的公园小道上，李文手握手机开心地约朋友跑步。(Trên con đường công viên ngập nắng, Lý Văn tươi cười cầm điện thoại rủ bạn bè cùng chạy bộ).',
  },
  'hsk2-l12-t4': {
    src: '/textbook_art/hsk2_30_l12_t4.png',
    caption: '绿树成荫的林荫道上，李文和白家月并肩快乐地跑步锻炼。(Dưới vòm cây xanh ngập tràn nắng mai, Lý Văn và Bạch Gia Nguyệt vui vẻ đồng hành chạy bộ bên nhau).',
  },
  'hsk2-l13-t1': {
    src: '/textbook_art/hsk2_30_l13_t1.png',
    caption: '明亮的教室里，白家月和陈天中开心地商量为老师挑选新年花束。(Trong phòng học sáng rực ánh nắng, Bạch Gia Nguyệt và Trần Thiên Trung vui vẻ bàn nhau chọn hoa tươi tặng cô giáo dịp năm mới).',
  },
  'hsk2-l13-t2': {
    src: '/textbook_art/hsk2_30_l13_t2.png',
    caption: '讲台前王老师悉心指导，同学们认真练习汉字笔画。(Trước bục giảng, cô giáo Vương Nhất Phi tận tình hướng dẫn, các bạn học sinh chăm chú nắn nót từng nét chữ Hán).',
  },
  'hsk2-l13-t3': {
    src: '/textbook_art/hsk2_30_l13_t3.png',
    caption: '明亮的教室讲台前，王老师亲切微笑，白家月在课桌前认真听讲。(Tại phòng học ngập nắng, cô giáo Vương Nhất Phi mỉm cười thân thiện bên bục giảng, Bạch Gia Nguyệt chăm chú lắng nghe).',
  },
  'hsk2-l13-t4': {
    src: '/textbook_art/hsk2_30_l13_t4.png',
    caption: '温馨的书房里，台灯散发柔和暖光，白家月在书桌前静静写下日记。(Trong căn phòng ấm áp, đèn bàn tỏa ánh sáng dịu nhẹ, Bạch Gia Nguyệt tĩnh lặng ghi nhật ký bên bình hoa tươi).',
  },
  'hsk2-l14-t1': {
    src: '/textbook_art/hsk2_30_l14_t1.png',
    caption: '冬日黄昏的林荫道上，李文微笑着指向前方公寓楼下等待的身影，王老师惊喜地认出了男朋友杨同乐。(Trên đường phố mùa đông lúc hoàng hôn, Lý Văn chỉ tay về phía sảnh tòa nhà phía xa, cô giáo Vương Nhất Phi mỉm cười nhận ra bạn trai Dương Đồng Nhạc).',
  },
  'hsk2-l14-t2': {
    src: '/textbook_art/hsk2_30_l14_t2.png',
    caption: '公寓楼下现代化的玻璃大堂门前，王老师亲切地把学生李文介绍给捧着公文包等待的男朋友杨同乐。(Trước sảnh kính tòa nhà chung cư, cô giáo Vương Nhất Phi vui vẻ giới thiệu học trò Lý Văn với bạn trai Dương Đồng Nhạc).',
  },
  'hsk2-l14-t3': {
    src: '/textbook_art/hsk2_30_l14_t3.png',
    caption: '温馨雅致的客厅里，王老师和杨同乐坐在沙发上喝热茶吃橘子，愉快地聊起邻里家庭与新年请客。(Trong phòng khách ấm áp, cô giáo Vương và Dương Đồng Nhạc ngồi uống trà ăn quýt, vui vẻ trò chuyện về gia đình người hàng xóm).',
  },
  'hsk2-l14-t4': {
    src: '/textbook_art/hsk2_30_l14_t4.png',
    caption: '静谧的书房里，台灯映照着书桌上的热茶与合影，王老师满怀幸福地在日记本里记录甜蜜的心意。(Trong phòng làm việc tĩnh lặng, đèn bàn chiếu sáng tách trà nóng và bức ảnh chụp chung, cô giáo Vương hạnh phúc ghi lại tâm tư ngọt ngào).',
  },
  'hsk2-l15-t1': {
    src: '/textbook_art/hsk2_30_l15_t1.png',
    caption: '明亮的大学考场里期末考试顺利结束，王老师在讲台前欣慰收卷，白家月与陈天中如释重负，开心讨论假期。(Trong phòng thi sáng rực ánh nắng, cô giáo Vương vui mừng thu bài thi, Bạch Gia Nguyệt và Trần Thiên Trung vui vẻ bàn về kế hoạch kỳ nghỉ).',
  },
  'hsk2-l15-t2': {
    src: '/textbook_art/hsk2_30_l15_t2.png',
    caption: '阳光洒入温馨的咖啡店，白家月开心地拿出手机向李文展示买好的颐和园门票，期待品尝北京烤鸭与奶茶。(Trong quán cà phê ngập tràn nắng ấm, Bạch Gia Nguyệt khoe Lý Văn vé Di Hòa Viên đã đặt trên mạng, hào hứng nói về vịt quay và trà sữa).',
  },
  'hsk2-l15-t3': {
    src: '/textbook_art/hsk2_30_l15_t3.png',
    caption: '咖啡馆明亮的落地窗前，白家月和李文围着平板电脑查看周五飞往北京的航班，满心欢喜准备一同回家过年。(Bên khung cửa kính quán cà phê, Bạch Gia Nguyệt và Lý Văn cùng xem lịch bay thứ Sáu về Bắc Kinh, hân hoan chuẩn bị về quê ăn Tết).',
  },
  'hsk2-l15-t4': {
    src: '/textbook_art/hsk2_30_l15_t4.png',
    caption: '静谧的书房卧室里，李文收拾好回北京过年的行李箱，望向窗外夜空，满怀深情地记下与好友一同飞向北京的喜悦。(Trong phòng ngủ tĩnh lặng, Lý Văn xếp xong vali đồ ấm về quê ăn Tết, hướng mắt nhìn bầu trời đêm đầy xúc động ghi lại niềm vui cùng bay về Bắc Kinh).',
  },
};

// Helper to determine exact speaker head position percentage (X%, Y%)
// Guarantees speech bubble bottom pointer lands directly onto the speaker's head with custom height per person
const getSpeakerCoords = (
  textId: string,
  speakerName: string,
  textLines: { speaker: string }[],
  speakerAnchors?: Record<string, CharacterAnchor2D | number>
): CharacterAnchor2D => {
  const cleanName = speakerName.replace(/\s*\(.*?\)/, '').trim();
  const sceneMap = speakerAnchors || COURSEBOOK_CHARACTER_ANCHORS[textId];
  if (sceneMap) {
    const matchedKey = Object.keys(sceneMap).find((k) => cleanName.includes(k) || k.includes(cleanName));
    if (matchedKey && sceneMap[matchedKey] !== undefined) {
      const val = sceneMap[matchedKey];
      if (typeof val === 'number') {
        return { x: val, y: 28 };
      }
      return val;
    }
  }

  // Fallback if not specified in anchor dictionary
  const uniqueSpeakers = Array.from(new Set(textLines.map((l) => l.speaker)));
  const sIdx = uniqueSpeakers.indexOf(speakerName);

  let defaultY = 28;
  if (cleanName.includes('小明') || cleanName.includes('小雪')) {
    defaultY = 38; // Children / teenagers are shorter
  } else if (cleanName.includes('白家月') || cleanName.includes('安妮')) {
    defaultY = 34; // College girls
  } else if (cleanName.includes('陈天中')) {
    defaultY = 22; // Tall athlete boy
  } else if (cleanName.includes('刘爷爷') || cleanName.includes('爷爷') || cleanName.includes('刘奶奶') || cleanName.includes('奶奶')) {
    defaultY = 32; // Elderly seated / shorter
  }

  if (uniqueSpeakers.length <= 2) {
    return {
      x: sIdx === 0 ? 36 : 68,
      y: defaultY,
    };
  }
  return {
    x: sIdx === 0 ? 28 : sIdx === 1 ? 50 : 72,
    y: defaultY,
  };
};

// Compute dynamic directional tail geometry connecting bubble perimeter to speaker mouth
function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top',
  containerWidth: number = 896
) {
  const { left, top, right, bottom, width, height } = bubbleBox;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const scale = Math.max(0.45, Math.min(1.15, containerWidth / 896));

  // Determine origin edge if not explicitly provided
  let origin = tailOriginPref;
  if (!origin) {
    if (mouthPx.y > bottom) {
      if (mouthPx.x < left + width * 0.35) origin = 'bottom-left';
      else if (mouthPx.x > right - width * 0.35) origin = 'bottom-right';
      else origin = 'bottom';
    } else if (mouthPx.y < top) {
      origin = 'top';
    } else if (mouthPx.x < left) {
      origin = 'left';
    } else {
      origin = 'right';
    }
  } else {
    // Safety check: if origin is inverted relative to mouthTarget, adapt to avoid backwards tail
    if ((origin === 'bottom' || origin === 'bottom-left' || origin === 'bottom-right') && mouthPx.y < bottom) {
      if (mouthPx.y < top) origin = 'top';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    } else if (origin === 'top' && mouthPx.y > top) {
      if (mouthPx.y > bottom) origin = 'bottom';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    }
  }

  const baseWidth = Math.min(15 * scale, width * 0.32);
  const halfBase = baseWidth / 2;
  const overlap = 2.2; // Extension into the card to seamlessly mask the 1.5px card border
  const cornerPadX = Math.max(12 * scale, Math.min(24 * scale, width * 0.22));
  const cornerPadY = Math.max(10 * scale, Math.min(18 * scale, height * 0.25));

  let baseMidX = centerX;
  let baseMidY = bottom;
  let base1 = { x: 0, y: 0 };
  let base2 = { x: 0, y: 0 };
  let baseEdge1 = { x: 0, y: 0 };
  let baseEdge2 = { x: 0, y: 0 };

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + cornerPadX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom-right': {
      baseMidX = right - cornerPadX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + cornerPadX, Math.min(right - cornerPadX, centerX * 0.4 + mouthPx.x * 0.6));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + cornerPadY, Math.min(bottom - cornerPadY, centerY * 0.45 + mouthPx.y * 0.55));
      base1 = { x: left + overlap, y: baseMidY - halfBase };
      base2 = { x: left + overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: left, y: baseMidY - halfBase };
      baseEdge2 = { x: left, y: baseMidY + halfBase };
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + cornerPadY, Math.min(bottom - cornerPadY, centerY * 0.45 + mouthPx.y * 0.55));
      base1 = { x: right - overlap, y: baseMidY - halfBase };
      base2 = { x: right - overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: right, y: baseMidY - halfBase };
      baseEdge2 = { x: right, y: baseMidY + halfBase };
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + cornerPadX, Math.min(right - cornerPadX, centerX * 0.4 + mouthPx.x * 0.6));
      baseMidY = top;
      base1 = { x: baseMidX + halfBase, y: top + overlap };
      base2 = { x: baseMidX - halfBase, y: top + overlap };
      baseEdge1 = { x: baseMidX + halfBase, y: top };
      baseEdge2 = { x: baseMidX - halfBase, y: top };
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
  }

  // Flexible natural comic tail length: compact pointer, never a long spindly antenna
  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  const maxTailLen = 19 * scale;
  const minTailLen = 10 * scale;
  const tailLen = Math.min(maxTailLen, Math.max(minTailLen, dist * 0.22));

  const unitX = dist > 0 ? vx / dist : 0;
  const unitY = dist > 0 ? vy / dist : 1;

  const tip = {
    x: baseMidX + unitX * tailLen,
    y: baseMidY + unitY * tailLen,
  };

  return {
    origin,
    base1,
    base2,
    baseEdge1,
    baseEdge2,
    tip,
    dist,
  };
}

interface Hsk1SpeechBubbleProps {
  textItem: LessonText;
  activeLine: { speaker: string; hanzi: string; vietnamese?: string };
  activeLineIdx: number;
  onPlayLine: () => void;
}

const Hsk1SpeechBubble: React.FC<Hsk1SpeechBubbleProps> = ({
  textItem,
  activeLine,
  activeLineIdx,
  onPlayLine,
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleMetrics, setBubbleMetrics] = useState<{
    bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number };
    containerWidth: number;
    containerHeight: number;
    scale: number;
  } | null>(null);

  const config = getHsk1BubbleConfig(textItem.id, activeLine.speaker) || {
    mouthTarget: { x: 50, y: 35 },
    placement: 'top' as const,
  };

  const bubblePos = config.bubblePos || calculateFallbackBubblePos(config.mouthTarget, config.placement);

  useLayoutEffect(() => {
    const updateMetrics = () => {
      const bubbleEl = bubbleRef.current;
      const containerEl = bubbleEl?.parentElement;
      if (!bubbleEl || !containerEl) return;

      const cRect = containerEl.getBoundingClientRect();
      if (cRect.width === 0 || cRect.height === 0) return;

      // Canvas-proportional scale factor (reference 896px desktop illustration container)
      // Guarantees identical percentage footprint on Desktop, PC, Laptop, Tablet, and Smartphone
      const scale = Math.max(0.42, Math.min(1.15, cRect.width / 896));
      const baseMaxWidth = config.maxWidth || 230;
      const responsiveMaxWidth = Math.max(
        92,
        Math.min(Math.round(baseMaxWidth * scale), Math.round(cRect.width * 0.46))
      );

      bubbleEl.style.setProperty('--bscale', String(scale));
      bubbleEl.style.maxWidth = `${responsiveMaxWidth}px`;

      const bRect = bubbleEl.getBoundingClientRect();
      const cardW = bRect.width;
      const cardH = bRect.height;

      const smartBox = resolveSmartBubbleBox({
        textId: textItem.id,
        bubblePos,
        mouthTarget: config.mouthTarget,
        cardWidth: cardW,
        cardHeight: cardH,
        containerWidth: cRect.width,
        containerHeight: cRect.height,
      });

      setBubbleMetrics({
        bubbleBox: smartBox,
        containerWidth: cRect.width,
        containerHeight: cRect.height,
        scale,
      });
    };

    updateMetrics();

    const containerEl = bubbleRef.current?.parentElement;
    if (!containerEl) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateMetrics());
      ro.observe(containerEl);
      if (bubbleRef.current) ro.observe(bubbleRef.current);
    }

    window.addEventListener('resize', updateMetrics);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [textItem.id, activeLineIdx, activeLine.speaker, bubblePos.x, bubblePos.y, config.maxWidth, config.mouthTarget]);

  let tailGeom: ReturnType<typeof computeTailGeometry> | null = null;
  if (bubbleMetrics) {
    const mouthPx = {
      x: (config.mouthTarget.x / 100) * bubbleMetrics.containerWidth,
      y: (config.mouthTarget.y / 100) * bubbleMetrics.containerHeight,
    };
    tailGeom = computeTailGeometry(
      bubbleMetrics.bubbleBox,
      mouthPx,
      config.tailOrigin,
      bubbleMetrics.containerWidth
    );
  }

  const baseMaxWidth = config.maxWidth || 230;
  const currentScale = bubbleMetrics ? bubbleMetrics.scale : 1;
  const currentMaxWidth = bubbleMetrics
    ? Math.max(
        92,
        Math.min(
          Math.round(baseMaxWidth * currentScale),
          Math.round(bubbleMetrics.containerWidth * 0.46)
        )
      )
    : baseMaxWidth;

  // Compact excerpt for long monologue paragraphs (e.g. HSK 2 T4 diary/message entries)
  // Full text remains displayed in the dialogue list below the illustration
  const bubbleHanzi =
    activeLine.hanzi.length > 32
      ? (() => {
          const firstClause = activeLine.hanzi.split(/[。！？；]/)[0];
          if (firstClause && firstClause.length >= 6 && firstClause.length <= 28) {
            const punct = activeLine.hanzi[firstClause.length] || '。';
            return `${firstClause}${punct}…`;
          }
          return `${activeLine.hanzi.slice(0, 26)}…`;
        })()
      : activeLine.hanzi;

  const bubbleViet =
    activeLine.vietnamese && activeLine.vietnamese.length > 78
      ? (() => {
          const firstClause = activeLine.vietnamese.split(/[.!?;]/)[0];
          if (firstClause && firstClause.length >= 15 && firstClause.length <= 68) {
            return `${firstClause}. …`;
          }
          return `${activeLine.vietnamese.slice(0, 64)}…`;
        })()
      : activeLine.vietnamese;

  return (
    <>
      {/* Speech Bubble Card */}
      <div
        ref={bubbleRef}
        key={`bubble-${textItem.id}-${activeLineIdx}`}
        className="absolute z-20 pointer-events-auto select-none"
        style={{
          top: bubbleMetrics ? `${bubbleMetrics.bubbleBox.top}px` : `${bubblePos.y}%`,
          left: bubbleMetrics ? `${bubbleMetrics.bubbleBox.left}px` : `${bubblePos.x}%`,
          transform: bubbleMetrics ? 'none' : 'translate(-50%, -50%)',
          maxWidth: `${currentMaxWidth}px`,
          ['--bscale' as any]: currentScale,
        }}
      >
        <div
          onClick={onPlayLine}
          style={{
            padding: 'calc(6px * var(--bscale, 1)) calc(11px * var(--bscale, 1))',
            borderRadius: 'calc(16px * var(--bscale, 1))',
            minWidth: 'calc(80px * var(--bscale, 1))',
          }}
          className="relative bg-white/95 text-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.18)] border-[1.5px] border-slate-800/85 whitespace-normal text-center max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
          title="Bấm để nghe đọc lại câu thoại này"
        >
          <div key={activeLineIdx} className="animate-in fade-in duration-200">
            <div
              style={{
                fontSize: 'clamp(9.5px, calc(13.5px * var(--bscale, 1)), 15px)',
                lineHeight: 1.28,
              }}
              className="font-bold font-chinese text-slate-900 tracking-normal"
            >
              {bubbleHanzi}
            </div>
            {bubbleViet && (
              <div
                style={{
                  fontSize: 'clamp(8px, calc(10.5px * var(--bscale, 1)), 12px)',
                  lineHeight: 1.22,
                }}
                className="text-slate-500 font-medium mt-0.5"
              >
                {bubbleViet}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Directional Tail connecting bubble edge to mouthTarget */}
      {bubbleMetrics && tailGeom && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          viewBox={`0 0 ${bubbleMetrics.containerWidth} ${bubbleMetrics.containerHeight}`}
        >
          {/* Seamless white wedge with drop shadow */}
          <polygon
            points={`${tailGeom.base1.x},${tailGeom.base1.y} ${tailGeom.tip.x},${tailGeom.tip.y} ${tailGeom.base2.x},${tailGeom.base2.y}`}
            fill="#ffffff"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
          />
          {/* Overlap white fill to seamlessly mask card border at base */}
          <polygon
            points={`${tailGeom.base1.x},${tailGeom.base1.y} ${tailGeom.tip.x},${tailGeom.tip.y} ${tailGeom.base2.x},${tailGeom.base2.y}`}
            fill="#ffffff"
          />
          {/* Ink border strokes on left and right sides of tail */}
          <path
            d={`M ${tailGeom.baseEdge1.x} ${tailGeom.baseEdge1.y} L ${tailGeom.tip.x} ${tailGeom.tip.y} L ${tailGeom.baseEdge2.x} ${tailGeom.baseEdge2.y}`}
            stroke="rgba(30,41,59,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </>
  );
};


export const CoursebookView: React.FC<CoursebookViewProps> = ({
  userProfile,
  onSaveProfile,
  onStartFlashcards,
  onOpenAiTutorWithTopic,
  srsCards,
  onAddWordToSRS,
  initialHskLevel,
  initialLessonIndex,
  initialTab,
  onClearInitialCoursebookState,
}) => {
  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'babysharkkk123@gmail.com';
  const hasEnrolledClass = Boolean(userProfile?.class_code);

  const [selectedWordForDetail, setSelectedWordForDetail] = useState<WordItem | null>(null);

  // Practice Modals (R3 & R4) & Randomization (R5)
  const [isPronunciationModalOpen, setIsPronunciationModalOpen] = useState<boolean>(false);
  const [isWhiteboardModalOpen, setIsWhiteboardModalOpen] = useState<boolean>(false);
  const [isRandomizePractice, setIsRandomizePractice] = useState<boolean>(false);

  const [selectedHskLevel, setSelectedHskLevel] = useState<1 | 2 | 3 | 4 | 5 | 6>(() => {
    if (initialHskLevel) return initialHskLevel;
    return (userProfile?.current_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
  });
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(() => {
    if (typeof initialLessonIndex === 'number' && initialLessonIndex >= 0) {
      return initialLessonIndex;
    }
    if (!hasEnrolledClass && !isAdmin) return 0;
    try {
      const lvl = (userProfile?.current_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
      const userPrefix = userProfile?.id ? `minnie_${userProfile.id}_` : 'minnie_';
      const savedUser = localStorage.getItem(`${userPrefix}current_lesson_hsk_${lvl}`);
      if (savedUser !== null) {
        const val = parseInt(savedUser, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
      const saved = localStorage.getItem(`minnie_current_lesson_hsk_${lvl}`);
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {}
    return 0;
  });
  const [completedLessonNums, setCompletedLessonNums] = useState<number[]>(() => {
    if (!hasEnrolledClass && !isAdmin) return [];
    try {
      const lvl = initialHskLevel || (userProfile?.current_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
      const userPrefix = userProfile?.id ? `minnie_${userProfile.id}_` : 'minnie_';
      const savedUser = localStorage.getItem(`${userPrefix}completed_lessons_hsk_${lvl}`);
      if (savedUser) return JSON.parse(savedUser);
      const saved = localStorage.getItem(`minnie_completed_lessons_hsk_${lvl}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeTab, setActiveTab] = useState<CoursebookTab>(initialTab || 'text');

  useEffect(() => {
    let shouldClear = false;
    if (initialTab) {
      setActiveTab(initialTab);
      shouldClear = true;
    }
    if (typeof initialLessonIndex === 'number' && initialLessonIndex >= 0) {
      setSelectedLessonIndex(initialLessonIndex);
      shouldClear = true;
    }
    if (initialHskLevel) {
      setSelectedHskLevel(initialHskLevel);
      try {
        const savedCompleted = localStorage.getItem(`minnie_completed_lessons_hsk_${initialHskLevel}`);
        setCompletedLessonNums(savedCompleted ? JSON.parse(savedCompleted) : []);
      } catch {}
      shouldClear = true;
    }
    if (shouldClear && onClearInitialCoursebookState) {
      onClearInitialCoursebookState();
    }
  }, [initialTab, initialLessonIndex, initialHskLevel, onClearInitialCoursebookState]);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSpeechBubbles, setShowSpeechBubbles] = useState<boolean>(true);
  const [selectedLineMap, setSelectedLineMap] = useState<Record<string, number>>({});

  const [activePlayingTextId, setActivePlayingTextId] = useState<string | null>(null);
  const coursebookAudioRef = useRef<HTMLAudioElement | null>(null);
  const playLineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (playLineTimerRef.current) {
        clearTimeout(playLineTimerRef.current);
        playLineTimerRef.current = null;
      }
      if (coursebookAudioRef.current) {
        coursebookAudioRef.current.pause();
        coursebookAudioRef.current = null;
      }
      stopChineseAudio();
    };
  }, []);

  useEffect(() => {
    if (playLineTimerRef.current) {
      clearTimeout(playLineTimerRef.current);
      playLineTimerRef.current = null;
    }
    if (coursebookAudioRef.current) {
      coursebookAudioRef.current.pause();
      coursebookAudioRef.current = null;
    }
    stopChineseAudio();
    setActivePlayingTextId(null);
    setPlayingLineId(null);
  }, [selectedLessonIndex, selectedHskLevel, activeTab]);

  const stopAllCoursebookAudio = () => {
    if (playLineTimerRef.current) {
      clearTimeout(playLineTimerRef.current);
      playLineTimerRef.current = null;
    }
    if (coursebookAudioRef.current) {
      coursebookAudioRef.current.pause();
      coursebookAudioRef.current = null;
    }
    stopChineseAudio();
    setActivePlayingTextId(null);
    setPlayingLineId(null);
  };

  const handleToggleFullAudio = (textId: string, fallbackText: string) => {
    if (activePlayingTextId === textId) {
      stopAllCoursebookAudio();
      return;
    }

    stopAllCoursebookAudio();
    const manifestItem = COURSEBOOK_AUDIO_MANIFEST[textId];
    if (manifestItem?.fullAudioUrl) {
      const audio = new Audio(`${manifestItem.fullAudioUrl}?v=20261107_v11`);
      audio.playbackRate = playbackSpeed;
      coursebookAudioRef.current = audio;
      setActivePlayingTextId(textId);

      audio.ontimeupdate = () => {
        const cur = audio.currentTime;
        const currentLine = manifestItem.lineTimings.find(
          (t) => cur >= t.start && cur <= t.end
        );
        if (currentLine) {
          setPlayingLineId(`${textId}-${currentLine.lineIndex}`);
        }
      };

      audio.onended = () => {
        setActivePlayingTextId(null);
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.onerror = () => {
        setActivePlayingTextId(null);
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.play().catch(() => {
        stopAllCoursebookAudio();
      });
    } else {
      setActivePlayingTextId(textId);
      playChineseAudio(fallbackText, playbackSpeed);
      setTimeout(() => {
        setActivePlayingTextId(null);
        setPlayingLineId(null);
      }, 4000);
    }
  };

  const handlePlayLineAudio = (textId: string, lineIndex: number, fallbackHanzi: string) => {
    stopAllCoursebookAudio();
    const lineKey = `${textId}-${lineIndex}`;
    setPlayingLineId(lineKey);

    const manifestItem = COURSEBOOK_AUDIO_MANIFEST[textId];
    const lineAudio = manifestItem?.lines?.[lineIndex];

    if (lineAudio?.audioUrl) {
      const audio = new Audio(`${lineAudio.audioUrl}?v=20261107_v11`);
      audio.playbackRate = playbackSpeed;
      coursebookAudioRef.current = audio;

      audio.onended = () => {
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.play().catch(() => {
        setPlayingLineId(null);
      });
    } else {
      playChineseAudio(fallbackHanzi, playbackSpeed);
      setTimeout(() => setPlayingLineId(null), 2500);
    }
  };

  // Activation Screen State
  const [inputClassCode, setInputClassCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [lockedLevelNotice, setLockedLevelNotice] = useState<string | null>(null);

  const handleActivateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClassCode.trim()) {
      setActivationError('Vui lòng nhập mã lớp do giáo viên cung cấp.');
      return;
    }

    setIsActivating(true);
    setActivationError(null);
    try {
      const res = await joinClassByCode(inputClassCode, userProfile?.id || 'demo-user-123');
      setIsActivating(false);
      if (res.success && res.classData) {
        setActivationSuccess(res.message);
        const updatedLevel = (res.classData.hsk_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
        setSelectedHskLevel(updatedLevel);
        setSelectedLessonIndex(0);
        if (onSaveProfile) {
          onSaveProfile({
            class_id: res.classData.id,
            class_code: res.classData.class_code,
            current_level: res.classData.hsk_level,
          });
        }
      } else {
        setActivationError(res.message);
      }
    } catch (err: any) {
      setIsActivating(false);
      setActivationError(err?.message || 'Có lỗi xảy ra khi xác thực mã lớp.');
    }
  };

  // If user has not enrolled in a class and is not an Admin, require class code entry to protect curriculum
  if (!hasEnrolledClass && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Giáo Trình Bản Quyền 《新HSK教程》
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Yêu Cầu Kích Hoạt Mã Lớp Học
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Để bảo mật tài liệu bài giảng và đảm bảo bạn được học đúng tiến độ, giáo trình được phân quyền riêng biệt cho từng lớp học. Vui lòng nhập <strong>Mã lớp học (Class Code)</strong> do giáo viên hoặc trung tâm cung cấp.
            </p>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivateClass} className="max-w-md mx-auto space-y-4 pt-2">
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Nhập Mã Lớp Học (Class Code)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VD: HSK1-A7X2"
                  value={inputClassCode}
                  onChange={(e) => setInputClassCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-base font-bold focus:outline-none focus:border-[var(--color-primary)] uppercase tracking-widest shadow-inner"
                />
              </div>
            </div>

            {/* Error or Success feedback */}
            {activationError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-start gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{activationError}</span>
              </div>
            )}

            {activationSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs flex items-start gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-bold">{activationSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivating || !inputClassCode.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isActivating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Kích hoạt giáo trình ngay</span>
            </button>

            {/* Quick sample codes hint */}
            <div className="pt-4 border-t border-[var(--color-border)] text-center space-y-2">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                Mã lớp học mẫu thử nghiệm có sẵn:
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { code: 'HSK1-A7X2', label: 'Lớp HSK 1' },
                  { code: 'HSK2-B9K4', label: 'Lớp HSK 2' },
                  { code: 'HSK3-C4M8', label: 'Lớp HSK 3' },
                  { code: 'HSK4-D5V9', label: 'Lớp HSK 4' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setInputClassCode(item.code)}
                    className="px-2.5 py-1 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    {item.code} ({item.label})
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeLessonsList: DetailedTextbookLesson[] =
    selectedHskLevel === 1
      ? NEW_HSK1_FULL_LESSONS
      : selectedHskLevel === 2
      ? NEW_HSK2_FULL_LESSONS
      : selectedHskLevel === 3
      ? NEW_HSK3_FULL_LESSONS
      : selectedHskLevel === 4
      ? NEW_HSK4_FULL_LESSONS
      : selectedHskLevel === 5
      ? NEW_HSK5_FULL_LESSONS
      : NEW_HSK6_FULL_LESSONS;

  const currentLesson: DetailedTextbookLesson =
    activeLessonsList[selectedLessonIndex] || activeLessonsList[0];

  const handlePlayAudio = (text: string, id?: string) => {
    if (!text || !text.trim()) return;
    stopAllCoursebookAudio();
    if (id) {
      setPlayingLineId(id);
      playLineTimerRef.current = setTimeout(() => {
        setPlayingLineId((curr) => (curr === id ? null : curr));
        playLineTimerRef.current = null;
      }, 3000);
    }
    Promise.resolve(playChineseAudio(text))
      .catch(() => {})
      .finally(() => {
        if (id) {
          if (playLineTimerRef.current) {
            clearTimeout(playLineTimerRef.current);
            playLineTimerRef.current = null;
          }
          setPlayingLineId((curr) => (curr === id ? null : curr));
        }
      });
  };

  const handleSelectLesson = (idx: number) => {
    setSelectedLessonIndex(idx);
    try {
      if (userProfile?.id) {
        localStorage.setItem(`minnie_${userProfile.id}_current_lesson_hsk_${selectedHskLevel}`, String(idx));
      }
      localStorage.setItem(`minnie_current_lesson_hsk_${selectedHskLevel}`, String(idx));
      window.dispatchEvent(new Event('minnie_lesson_progress_updated'));
      logStudyActivity('new_lesson', `Mở bài học mới: HSK ${selectedHskLevel} - Bài ${idx + 1}`);
    } catch {}
  };

  const toggleCompleteLesson = (lessonNum: number) => {
    let next: number[];
    if (completedLessonNums.includes(lessonNum)) {
      next = completedLessonNums.filter((n) => n !== lessonNum);
    } else {
      next = [...completedLessonNums, lessonNum];
      logStudyActivity('new_lesson', `Hoàn thành bài học: HSK ${selectedHskLevel} - Bài ${lessonNum}`);
    }
    setCompletedLessonNums(next);
    try {
      if (userProfile?.id) {
        localStorage.setItem(`minnie_${userProfile.id}_completed_lessons_hsk_${selectedHskLevel}`, JSON.stringify(next));
      }
      localStorage.setItem(`minnie_completed_lessons_hsk_${selectedHskLevel}`, JSON.stringify(next));
      window.dispatchEvent(new Event('minnie_lesson_progress_updated'));
    } catch {}
  };

  const handleLevelSelect = (lvl: 1 | 2 | 3 | 4 | 5 | 6) => {
    // If regular student, they can only view the level matching their enrolled class
    if (!isAdmin && userProfile?.current_level && userProfile.current_level !== lvl) {
      setLockedLevelNotice(
        `🔒 Giáo trình New HSK ${lvl} được bảo mật riêng cho lớp học HSK ${lvl}. Bạn hiện đang tham gia lớp "${userProfile.class_code}" (Trình độ: HSK ${userProfile.current_level}). Hãy liên hệ giáo viên phụ trách để chuyển lớp khi hoàn thành khóa học.`
      );
      return;
    }
    setLockedLevelNotice(null);
    setSelectedHskLevel(lvl);
    try {
      const userPrefix = userProfile?.id ? `minnie_${userProfile.id}_` : 'minnie_';
      const savedUserIdx = localStorage.getItem(`${userPrefix}current_lesson_hsk_${lvl}`);
      const savedIdx = savedUserIdx !== null ? savedUserIdx : localStorage.getItem(`minnie_current_lesson_hsk_${lvl}`);
      setSelectedLessonIndex(savedIdx !== null ? parseInt(savedIdx, 10) || 0 : 0);

      const savedUserCompleted = localStorage.getItem(`${userPrefix}completed_lessons_hsk_${lvl}`);
      const savedCompleted = savedUserCompleted || localStorage.getItem(`minnie_completed_lessons_hsk_${lvl}`);
      setCompletedLessonNums(savedCompleted ? JSON.parse(savedCompleted) : []);
    } catch {
      setSelectedLessonIndex(0);
    }
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8 animate-fade-in">
      {/* Locked Level Notice Modal / Alert */}
      {lockedLevelNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{lockedLevelNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setLockedLevelNotice(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-bold shrink-0 cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-slate-950 border border-red-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Bar: Tags & Role status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md text-red-100 border border-red-400/30 text-xs font-bold tracking-wider uppercase">
                <BookOpen className="w-4 h-4 text-red-200" />
                Giáo Trình Chuẩn 《新HSK教程》 • Tiêu Chuẩn HSK 3.0 Mới Nhất
              </div>
              {userProfile?.class_code && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Lớp: {userProfile.class_code} (HSK {userProfile.current_level})
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
                👑 Quản Trị / Giáo Viên (Xem tất cả)
              </div>
            )}
          </div>

          {/* Main Content Area: Title & Summary on Left, Action Cards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-2.5">
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold font-chinese tracking-tight text-white leading-tight">
                Khóa Học Toàn Diện Theo Giáo Trình New HSK {selectedHskLevel} (HSK 3.0)
              </h1>
              <p className="text-sm sm:text-base text-red-100/90 font-medium leading-relaxed max-w-2xl">
                Học trọn vẹn <strong className="text-white font-bold">{activeLessonsList.length} Bài khóa hội thoại</strong>, <strong className="text-white font-bold">Ngữ pháp trọng điểm</strong>, <strong className="text-white font-bold">Luyện tập tương tác</strong> và <strong className="text-white font-bold">Kiến thức Văn hóa & 绕口令</strong>.
              </p>
            </div>

            {/* Quick Action Buttons Grouped Nicely on the right */}
            <div className="lg:col-span-5 flex flex-wrap gap-2.5 lg:justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('workbook')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                  activeTab === 'workbook'
                    ? 'bg-teal-400 text-slate-950 font-black ring-2 ring-white/50'
                    : 'bg-teal-600/90 hover:bg-teal-500 text-white border border-teal-300/40 backdrop-blur-sm'
                }`}
              >
                <BookOpen className="w-4 h-4 text-teal-200" />
                <span>Sách Bài Tập (SBT) & Đề Thi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onStartFlashcards && currentLesson.vocabulary) {
                    onStartFlashcards(
                      currentLesson.vocabulary,
                      currentLesson.lessonNumber,
                      selectedHskLevel,
                      activeTab || 'vocab'
                    );
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-white text-rose-950 hover:bg-rose-50 text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-rose-700" />
                <span>Luyện Thẻ Bài Này ({currentLesson.vocabulary.length} từ)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAiTutorWithTopic) {
                    onOpenAiTutorWithTopic(
                      `Hãy đóng vai luyện hội thoại bài ${currentLesson.lessonNumber}: ${currentLesson.titleHanzi} (${currentLesson.titleVietnamese}) cho trình độ New HSK ${selectedHskLevel} chuẩn 3.0`
                    );
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-red-400/40 text-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Hội Thoại Gia Sư AI</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Level Switcher - Clean, full-width, perfectly balanced */}
          <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-red-200/90 shrink-0">Cấp độ giáo trình:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {([1, 2, 3, 4, 5, 6] as const).map((lvl) => {
                const isUserEnrolledLevel = userProfile?.current_level === lvl;
                const isLevelLocked = !isAdmin && userProfile?.current_level && !isUserEnrolledLevel;

                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelSelect(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedHskLevel === lvl
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black scale-105 ring-2 ring-white/40'
                        : isLevelLocked
                        ? 'bg-black/30 text-red-200/60 hover:bg-black/40 border border-white/10 opacity-75'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {isLevelLocked && <Lock className="w-3 h-3 text-amber-300" />}
                    <span>New HSK {lvl}</span>
                    <span className="text-[10px] opacity-80 font-normal">
                      ({lvl === 1 ? '15 bài' : lvl === 2 ? '15 bài' : lvl === 3 ? '10 bài' : lvl === 4 ? '20 bài (Tập 1&2)' : lvl === 5 ? 'Bài khóa' : 'Cao cấp'})
                    </span>
                    {isUserEnrolledLevel && (
                      <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full font-bold ml-0.5">
                        Lớp của bạn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Lessons List Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Lessons Navigation - Sticky when scrolling */}
        <div className="lg:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-[68px] sm:lg:top-[72px] z-20 self-start">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                Mục lục New HSK {selectedHskLevel}
              </h3>
              <span className="text-[11px] font-bold text-[var(--color-primary)]">
                Bài {currentLesson.lessonNumber} / {activeLessonsList.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 custom-scrollbar">
              {activeLessonsList.map((lesson, idx) => {
                const isSelected = idx === selectedLessonIndex;
                const isDone = completedLessonNums.includes(lesson.lessonNumber);
                return (
                  <button
                    key={lesson.lessonNumber}
                    type="button"
                    onClick={() => {
                      handleSelectLesson(idx);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isDone
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] group-hover:scale-105'
                        }`}
                      >
                        {isDone && !isSelected ? '✓' : lesson.lessonNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate font-chinese flex items-center gap-1.5">
                          <span>{lesson.titleHanzi}</span>
                          {isDone && (
                            <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-emerald-500 font-semibold'}`}>
                              (Đã xong)
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-rose-100' : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {lesson.titleVietnamese}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-white' : 'text-[var(--color-text-secondary)] group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lesson Modules */}
        <div className="lg:col-span-8 2xl:col-span-9 space-y-6">
          {/* Lesson Header Card */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold">
                    Bài {currentLesson.lessonNumber} • Trang {currentLesson.pageStart}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {currentLesson.titlePinyin}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text-primary)] font-chinese flex items-center gap-3">
                  {currentLesson.titleHanzi}
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentLesson.titleHanzi)}
                    className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-primary)] transition-colors cursor-pointer"
                    title="Nghe phát âm tiêu đề bài học"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {currentLesson.titleVietnamese}
                </p>
              </div>

              {/* Objectives Capsule */}
              <div className="bg-[var(--color-bg-secondary)] p-3.5 rounded-xl border border-[var(--color-border)] max-w-sm space-y-1">
                <div className="text-[11px] font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Trọng tâm bài học:
                </div>
                <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
                  {currentLesson.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sticky Lesson Module Navigation Tabs Bar */}
          </div>

          <div id="lesson-module-tabs" className="sticky top-[60px] sm:top-[64px] z-30 transition-all">
            <div className="bg-[var(--color-surface)]/95 backdrop-blur-md rounded-2xl border border-[var(--color-border)] p-2 shadow-md transition-all">
              <div className="flex items-center justify-between gap-3">
                {/* Module Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
                  {[
                    { key: 'text', label: `Bài Khóa (${currentLesson.texts.length})`, icon: MessageSquare },
                    { key: 'grammar', label: `Ngữ Pháp (${currentLesson.grammarPoints.length})`, icon: Lightbulb },
                    { key: 'vocab', label: `Từ Vựng (${currentLesson.vocabulary.length})`, icon: FileText },
                    { key: 'exercises', label: `Luyện Tập (${currentLesson.exercises.length})`, icon: HelpCircle },
                    { key: 'workbook', label: 'Sách Bài Tập (SBT)', icon: BookOpen },
                    ...(currentLesson.cultureBonus || currentLesson.tongueTwister
                      ? [{ key: 'culture', label: 'Văn Hóa & Vè', icon: Sparkles }]
                      : []),
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.key as any);
                          const el = document.getElementById('lesson-module-tabs');
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.pageYOffset - 68;
                            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                          }
                        }}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Indicator: Current Lesson Title Pill (Visible on Desktop) */}
                <div className="hidden xl:flex items-center gap-2 shrink-0 border-l border-[var(--color-border)] pl-3 pr-2 text-xs">
                  <span className="font-bold text-[var(--color-primary)]">
                    Bài {currentLesson.lessonNumber}:
                  </span>
                  <span className="font-chinese font-bold text-[var(--color-text-primary)] truncate max-w-[170px]" title={currentLesson.titleHanzi}>
                    {currentLesson.titleHanzi}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: TEXTS (BÀI KHÓA) */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              {/* Studio Audio Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      Giọng Đọc Studio Neural (Edge-TTS Bắc Kinh)
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Đa vai đối thoại
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      Phát âm tròn vành rõ chữ • Ngắt nghỉ tự nhiên giữa các nhân vật • Karaoke đồng bộ
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">Tốc độ:</span>
                  <div className="inline-flex rounded-xl p-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(0.8)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === 0.8
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Tốc độ 0.8x cho người mới luyện nghe rõ từng thanh điệu"
                    >
                      0.8x Chậm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(1.0)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === 1.0
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Tốc độ 1.0x bản xứ tự nhiên"
                    >
                      1.0x Chuẩn
                    </button>
                  </div>
                </div>
              </div>

              {currentLesson.texts.map((textItem) => {
                const manifest = COURSEBOOK_AUDIO_MANIFEST[textItem.id];
                const illustration = LESSON_ILLUSTRATIONS[textItem.id];
                const isFullPlaying = activePlayingTextId === textItem.id;
                const isHsk1 = textItem.id.startsWith('hsk1-') || textItem.id.startsWith('hsk2-');
                const isWidescreenHsk1 = [
                  'hsk1-l14-t2', 'hsk1-l14-t3', 'hsk1-l15-t1', 'hsk1-l15-t2', 'hsk1-l15-t3',
                  'hsk2-l11-t1', 'hsk2-l11-t2', 'hsk2-l11-t3', 'hsk2-l11-t4',
                  'hsk2-l12-t2', 'hsk2-l12-t3', 'hsk2-l12-t4',
                  'hsk2-l13-t1', 'hsk2-l13-t2', 'hsk2-l13-t3',
                  'hsk2-l14-t1', 'hsk2-l14-t2', 'hsk2-l14-t3', 'hsk2-l14-t4',
                  'hsk2-l15-t1', 'hsk2-l15-t2', 'hsk2-l15-t3', 'hsk2-l15-t4',
                ].includes(textItem.id);

                // Active speaking line detection (supports full dialogue audio or single line audio)
                const playingIdx =
                  playingLineId && playingLineId.startsWith(`${textItem.id}-`)
                    ? parseInt(playingLineId.split('-').pop() || '-1', 10)
                    : -1;

                // Use playing line if audio is active, otherwise default to selected line (or line 0)
                const activeLineIdx = playingIdx >= 0 ? playingIdx : (selectedLineMap[textItem.id] ?? 0);
                const activeLine =
                  activeLineIdx >= 0 && activeLineIdx < textItem.lines.length
                    ? textItem.lines[activeLineIdx]
                    : null;
                const activeManifestLine = activeLineIdx >= 0 ? manifest?.lines?.[activeLineIdx] : null;

                // Calculate exact 2D speaker head coordinate (X%, Y%) and natural comic balloon placement
                const coords = activeLine
                  ? getSpeakerCoords(textItem.id, activeLine.speaker, textItem.lines, textItem.speakerAnchors as Record<string, CharacterAnchor2D | number> | undefined)
                  : { x: 50, y: 28 };

                const headX = coords.x;
                // Minimum top clearance so dialogue card doesn't clip off the top boundary
                const headY = Math.max(16, coords.y);

                // Smart comic balloon alignment:
                // When character is on left (<=38%), balloon shifts rightward into open space with tail on the left pointing down to speaker
                // When character is on right (>=62%), balloon shifts leftward into open space with tail on the right pointing down to speaker
                const cardShiftPercent =
                  headX <= 38
                    ? 22
                    : headX >= 62
                    ? 78
                    : 50;

                const pointerLeftPercent = `${cardShiftPercent}%`;

                return (
                  <div
                    key={textItem.id}
                    className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 sm:p-5 shadow-xs space-y-4"
                  >
                    {/* Centered Scene Illustration with Natural Comic Speech Balloon */}
                    {illustration && (
                      <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-xs bg-[var(--color-bg-secondary)] relative">
                        {/* Balanced aspect ratio: compact height so lesson content below remains visible without endless scrolling */}
                        <div
                          className={`relative w-full overflow-hidden bg-slate-900/5 dark:bg-slate-900/40 flex items-center justify-center ${
                            isWidescreenHsk1
                              ? 'aspect-[1024/572]'
                              : isHsk1
                              ? 'aspect-[1024/765]'
                              : 'aspect-[4/3] sm:aspect-[16/10] max-h-[340px] sm:max-h-[380px] md:max-h-[420px]'
                          }`}
                        >
                          {/* Frozen stable artwork: no transitions or lazy reload on dialogue progression */}
                          <img
                            src={`${illustration.src}?v=20261107_v11`}
                            alt={textItem.title}
                            className={`w-full h-full pointer-events-none select-none ${
                              isHsk1 ? 'object-cover' : 'object-contain sm:object-cover'
                            }`}
                            loading="eager"
                            decoding="async"
                          />

                          {/* Top Controls Overlay: Subtle toggle for speech bubbles */}
                          <div className="absolute top-2 right-2 z-20">
                            <button
                              type="button"
                              onClick={() => setShowSpeechBubbles(!showSpeechBubbles)}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/40 hover:bg-black/60 text-white/90 backdrop-blur-xs transition-all flex items-center gap-1 cursor-pointer select-none"
                              title={showSpeechBubbles ? 'Ẩn bong bóng lời thoại' : 'Hiện bong bóng lời thoại'}
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-white/80" />
                              <span>{showSpeechBubbles ? 'Bóng thoại: BẬT' : 'Bóng thoại: TẮT'}</span>
                            </button>
                          </div>

                          {/* Authentic Comic Speech Balloon (Integrated organically into the artwork, NOT a generic UI card) */}
                          {activeLine && showSpeechBubbles && (
                            isHsk1 ? (
                              <Hsk1SpeechBubble
                                textItem={textItem}
                                activeLine={activeLine}
                                activeLineIdx={activeLineIdx}
                                onPlayLine={() => handlePlayLineAudio(textItem.id, activeLineIdx, activeLine.hanzi)}
                              />
                            ) : (
                              <div
                                key={`bubble-${textItem.id}`}
                                className="absolute z-20 pointer-events-auto transition-[top,left,transform] duration-300 ease-out"
                                style={{
                                  top: `${headY}%`,
                                  left: `${headX}%`,
                                  transform: `translate(-${cardShiftPercent}%, calc(-100% - 10px))`,
                                }}
                              >
                                {/* Organic rounded comic speech balloon with continuous comic ink border */}
                                <div
                                  onClick={() => handlePlayLineAudio(textItem.id, activeLineIdx, activeLine.hanzi)}
                                  className="relative bg-white/95 text-slate-900 rounded-[18px] sm:rounded-[20px] px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_3px_10px_rgba(0,0,0,0.18)] border-[1.5px] border-slate-800/85 whitespace-normal text-center min-w-[90px] max-w-[190px] sm:max-w-[230px] cursor-pointer hover:scale-[1.02] transition-transform select-none"
                                  title="Bấm để nghe đọc lại câu thoại này"
                                >
                                  <div key={activeLineIdx} className="animate-in fade-in duration-200">
                                    {/* Text tiếng Trung (chữ Hán tự nhiên, nét mực thanh gọn, không che mặt) */}
                                    <div className="text-xs sm:text-sm font-bold font-chinese text-slate-900 tracking-normal leading-snug">
                                      {activeLine.hanzi}
                                    </div>

                                    {/* Nghĩa tiếng Việt ở dưới (phụ đề mộc mạc, không kẻ vạch ngăn cách thô cứng) */}
                                    {activeLine.vietnamese && (
                                      <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                                        {activeLine.vietnamese}
                                      </div>
                                    )}
                                  </div>

                                  {/* Đuôi thoại nối liền tự nhiên vào bong bóng (Seamless Comic Pointer Tail) */}
                                  <div
                                    className="absolute -bottom-[9px] pointer-events-none"
                                    style={{
                                      left: pointerLeftPercent,
                                      transform: 'translateX(-50%)',
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="10"
                                      viewBox="0 0 16 10"
                                      className="overflow-visible"
                                    >
                                      {/* Lớp nền trắng che đường viền đáy của card tạo sự liền mạch */}
                                      <path d="M1,-1 L15,-1 L8,9.5 Z" fill="#ffffff" />
                                      {/* Hai nét mực viền đuôi thoại tiếp nối chuẩn xác nét viền bóng thoại */}
                                      <path
                                        d="M1,0 L8,9.5 L15,0"
                                        stroke="rgba(30,41,59,0.85)"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text Header with Title & Full Audio Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[var(--color-text-primary)] font-chinese">
                            {textItem.title}
                          </h3>
                          {manifest && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                              {manifest.lines.length} lượt thoại
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] italic">
                          {textItem.context}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFullAudio(
                            textItem.id,
                            textItem.lines.map((l) => l.hanzi).join('。 ')
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isFullPlaying
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white'
                        }`}
                        title="Nghe toàn bộ hội thoại giữa các nhân vật với ngữ điệu tự nhiên"
                      >
                        {isFullPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            Đang đọc (Bấm để dừng)
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            Nghe toàn đoạn ({playbackSpeed}x)
                          </>
                        )}
                      </button>
                    </div>

                    {/* Dialogue Lines: Clean, airy and focused with natural speaker indicators */}
                    <div className="space-y-2.5 pt-1">
                      {textItem.lines.map((line, lIdx) => {
                        const lineKey = `${textItem.id}-${lIdx}`;
                        const isSpeaking = playingLineId === lineKey;
                        const lineManifest = manifest?.lines?.[lIdx];

                        return (
                          <div
                            key={lineKey}
                            onClick={() => {
                              setSelectedLineMap((prev) => ({ ...prev, [textItem.id]: lIdx }));
                              handlePlayLineAudio(textItem.id, lIdx, line.hanzi);
                            }}
                            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${
                              isSpeaking
                                ? 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/40 dark:border-rose-700/60 shadow-xs'
                                : activeLineIdx === lIdx
                                ? 'bg-[var(--color-surface)] border-[var(--color-primary)]/50 shadow-2xs'
                                : 'bg-[var(--color-bg-secondary)]/60 border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              {/* Clean Speaker Badge with Vocal Persona / Chorus Tag */}
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-sm select-none">
                                  {lineManifest?.avatar || (lIdx % 2 === 0 ? '👨' : '👩')}
                                </span>
                                <span className="font-bold text-[var(--color-primary)]">
                                  {line.speaker}
                                </span>
                                {lineManifest?.voice === 'zh-CN-Chorus-Students' ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                    👥 Đồng thanh cả lớp (4 giọng hòa âm)
                                  </span>
                                ) : lineManifest?.voice === 'zh-CN-Chorus-JiayueAnnie' ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                    👥 Đồng thanh 2 nhân vật (Gia Nguyệt & An Ni)
                                  </span>
                                ) : lineManifest?.persona ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-[var(--color-text-secondary)]">
                                    🎙️ {lineManifest.persona.includes('(') ? lineManifest.persona.split('(')[1].replace(')', '') : lineManifest.persona}
                                  </span>
                                ) : null}
                                {isSpeaking && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 ml-1.5">
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                    Đang đọc
                                  </span>
                                )}
                              </div>

                              {/* Hanzi (Chinese Characters) */}
                              <div className="text-base sm:text-lg font-bold font-chinese text-[var(--color-text-primary)] tracking-wide leading-snug">
                                {line.hanzi}
                              </div>

                              {/* Pinyin */}
                              <div className="text-xs sm:text-[13px] font-mono text-[var(--color-primary)]/80 font-medium leading-tight">
                                {line.pinyin}
                              </div>

                              {/* Vietnamese Translation */}
                              <div className="text-xs text-[var(--color-text-secondary)] leading-snug">
                                {line.vietnamese}
                              </div>
                            </div>

                            {/* Individual Line Voice Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLineMap((prev) => ({ ...prev, [textItem.id]: lIdx }));
                                handlePlayLineAudio(textItem.id, lIdx, line.hanzi);
                              }}
                              className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                                isSpeaking
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-[var(--color-surface)] hover:bg-rose-50 hover:text-rose-600 text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                              }`}
                              title={`Luyện nghe câu này (${lineManifest?.persona || 'Giọng nhân vật'})`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: GRAMMAR (NGỮ PHÁP (NGỮ PHÁP 小语讲堂) */}
          {activeTab === 'grammar' && (
            <div className="space-y-6">
              {currentLesson.grammarPoints.map((gp) => (
                <div
                  key={gp.id}
                  className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] font-chinese">
                      {gp.title}
                    </h3>
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {gp.explanation}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      Ví dụ minh họa:
                    </div>
                    {gp.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold font-chinese text-[var(--color-text-primary)]">
                            {ex.hanzi}
                          </div>
                          <div className="text-xs font-mono text-[var(--color-text-secondary)]">
                            {ex.pinyin}
                          </div>
                          <div className="text-xs text-[var(--color-text-primary)]/80">
                            {ex.vietnamese}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(ex.hanzi)}
                          title="Nghe ví dụ ngữ pháp"
                          className="p-1.5 rounded-lg hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {gp.tip && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{gp.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: VOCABULARY */}
          {activeTab === 'vocab' && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Bảng từ vựng bài {currentLesson.lessonNumber} ({currentLesson.vocabulary.length} từ)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Companion SRS Flashcards Review (R1 Compatibility) */}
                  {onStartFlashcards && (
                    <button
                      type="button"
                      onClick={() =>
                        onStartFlashcards(
                          currentLesson.vocabulary,
                          currentLesson.lessonNumber,
                          selectedHskLevel,
                          'vocab'
                        )
                      }
                      className="order-4 px-3 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Luyện thẻ SRS toàn bài theo lộ trình học"
                    >
                      <Layers className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline">Thẻ SRS</span>
                    </button>
                  )}

                  {/* Card Randomization Toggle (R5) */}
                  <button
                    type="button"
                    onClick={() => setIsRandomizePractice((prev) => !prev)}
                    className={`order-1 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isRandomizePractice
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]'
                    }`}
                    title={
                      isRandomizePractice
                        ? 'Đang bật xáo trộn ngẫu nhiên thứ tự thẻ (Bấm để tắt)'
                        : 'Bật xáo trộn thứ tự từ vựng khi bắt đầu luyện tập'
                    }
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${isRandomizePractice ? 'text-amber-500' : ''}`} />
                    <span>{isRandomizePractice ? 'Xáo trộn: Bật' : 'Xáo trộn'}</span>
                  </button>

                  {/* Pronunciation Flashcards Practice Mode (R3) */}
                  <button
                    type="button"
                    onClick={() => setIsPronunciationModalOpen(true)}
                    disabled={!currentLesson.vocabulary || currentLesson.vocabulary.length === 0}
                    className="order-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Luyện phát âm nhận diện giọng nói AI với hàng đợi lặp lại từ sai (R3)"
                  >
                    <Mic className="w-4 h-4 text-emerald-100" />
                    <span>Luyện phát âm</span>
                  </button>

                  {/* Handwriting Whiteboard Practice Mode (R4) */}
                  <button
                    type="button"
                    onClick={() => setIsWhiteboardModalOpen(true)}
                    disabled={!currentLesson.vocabulary || currentLesson.vocabulary.length === 0}
                    className="order-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Luyện viết chữ Hán nét tự do trên bảng vẽ (R4)"
                  >
                    <PenTool className="w-4 h-4 text-blue-100" />
                    <span>Luyện viết chữ</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLesson.vocabulary.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWordForDetail(w)}
                    className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    title="Bấm để xem chi tiết, diễn họa nét chuẩn & luyện viết chữ Hán"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-chinese text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          {w.hanzi}
                        </span>
                        <span className="text-xs font-mono text-[var(--color-primary)]">
                          {w.pinyin}
                        </span>
                        {w.partOfSpeech && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-secondary)]">
                            {formatPartOfSpeechVietnamese(w.partOfSpeech)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {w.vietnamese || w.english}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(w.hanzi);
                        }}
                        className="p-2 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors shadow-xs cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXERCISES */}
          {activeTab === 'exercises' && (
            <LessonExercisesStudio
              lesson={currentLesson}
              hskLevel={selectedHskLevel}
              onUpdateUserXp={(additionalXp) => {
                if (onSaveProfile && userProfile) {
                  onSaveProfile({
                    exp_points: (userProfile.exp_points || 0) + additionalXp,
                  });
                }
              }}
            />
          )}

          {/* TAB 4.5: WORKBOOK (SÁCH BÀI TẬP & ĐỀ THI THỬ) */}
          {activeTab === 'workbook' && (
            <WorkbookView
              currentLesson={currentLesson}
              hskLevel={selectedHskLevel}
              currentLessonNumber={currentLesson.lessonNumber}
              onUpdateUserXp={(additionalXp) => {
                if (onSaveProfile && userProfile) {
                  onSaveProfile({
                    exp_points: (userProfile.exp_points || 0) + additionalXp,
                  });
                }
              }}
            />
          )}

          {/* TAB 5: CULTURE & BONUS */}
          {activeTab === 'culture' && (
            <div className="space-y-6">
              {currentLesson.tongueTwister && (
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                    <div className="flex items-center gap-2 text-[var(--color-primary)]">
                      <Flame className="w-5 h-5" />
                      <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                        Luyện bẻ giọng: {currentLesson.tongueTwister.title} (绕口令)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentLesson.tongueTwister!.hanzi)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Nghe phát âm chuẩn
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2">
                    <div className="text-base sm:text-lg font-bold font-chinese text-[var(--color-text-primary)] leading-relaxed">
                      {currentLesson.tongueTwister.hanzi}
                    </div>
                    <div className="text-xs font-mono text-[var(--color-text-secondary)]">
                      {currentLesson.tongueTwister.pinyin}
                    </div>
                    <div className="text-xs text-[var(--color-text-primary)]/80 italic pt-1">
                      {currentLesson.tongueTwister.vietnamese}
                    </div>
                  </div>
                </div>
              )}

              {currentLesson.cultureBonus && (
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {currentLesson.cultureBonus.title}
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {currentLesson.cultureBonus.summary}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
                    {currentLesson.cultureBonus.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Completion Action Bar */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm flex items-center justify-center mt-8">
            {/* Mark as Completed Button */}
            <button
              type="button"
              onClick={() => toggleCompleteLesson(currentLesson.lessonNumber)}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                completedLessonNums.includes(currentLesson.lessonNumber)
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                  : 'bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white border border-[var(--color-primary)]/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {completedLessonNums.includes(currentLesson.lessonNumber)
                  ? '✓ Đã học xong bài này'
                  : 'Đánh dấu đã học xong bài'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Word Detail & Hanzi Stroke Studio Modal */}
      <WordDetailModal
        isOpen={Boolean(selectedWordForDetail)}
        word={selectedWordForDetail}
        onClose={() => setSelectedWordForDetail(null)}
        srsCards={srsCards}
        onAddWordToSRS={onAddWordToSRS}
      />

      {/* R3 & R5: Pronunciation Flashcards Practice Modal */}
      <PronunciationFlashcardsModal
        isOpen={isPronunciationModalOpen}
        onClose={() => setIsPronunciationModalOpen(false)}
        words={currentLesson.vocabulary || []}
        lessonTitle={`Bài ${currentLesson.lessonNumber}: ${currentLesson.titleHanzi} (${currentLesson.titleVietnamese})`}
        lessonNumber={currentLesson.lessonNumber}
        hskLevel={selectedHskLevel}
        initialRandomize={isRandomizePractice}
      />

      {/* R4 & R5: Freehand Handwriting Whiteboard Canvas Modal */}
      <VocabularyWhiteboardModal
        isOpen={isWhiteboardModalOpen}
        onClose={() => setIsWhiteboardModalOpen(false)}
        words={currentLesson.vocabulary || []}
        lessonTitle={`Bài ${currentLesson.lessonNumber}: ${currentLesson.titleHanzi} (${currentLesson.titleVietnamese})`}
        lessonNumber={currentLesson.lessonNumber}
        hskLevel={selectedHskLevel}
        initialRandomize={isRandomizePractice}
      />
    </div>
  );
};
