/**
 * Pre-generated High-Fidelity Edge-TTS Studio Audio Manifest for Coursebook Lessons
 * Auto-generated with multi-role character persona casting, conversational pauses & timing synchronization.
 */

export interface CoursebookLineTiming {
  lineIndex: number;
  start: number;
  end: number;
  duration: number;
}

export interface CoursebookLineAudio {
  lineIndex: number;
  speaker: string;
  speakerName: string;
  gender: 'male' | 'female';
  avatar: string;
  persona: string;
  voice: string;
  audioUrl: string;
  duration: number;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface CoursebookTextAudio {
  id: string;
  lesson: number;
  textIndex: number;
  title: string;
  context: string;
  fullAudioUrl: string;
  totalDuration: number;
  lineTimings: CoursebookLineTiming[];
  lines: CoursebookLineAudio[];
}

export const COURSEBOOK_AUDIO_MANIFEST: Record<string, CoursebookTextAudio> = {
  "hsk1-l1-t1": {
    "id": "hsk1-l1-t1",
    "lesson": 1,
    "textIndex": 1,
    "title": "课文 1: 在办公室 (Trong văn phòng)",
    "context": "开学第一天，在办公室里，王一飞和AI助教小语打招呼。(Trong văn phòng, cô giáo Vương Nhất Phi chào trợ lý AI Tiểu Ngữ: 'AI小语，你好！')",
    "fullAudioUrl": "/audio/coursebook/hsk1-l1-t1_full.mp3",
    "totalDuration": 4.93,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.26,
        "duration": 2.26
      },
      {
        "lineIndex": 1,
        "start": 2.66,
        "end": 4.87,
        "duration": 2.21
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t1_line0.mp3",
        "duration": 2.26,
        "hanzi": "AI小语，你好！",
        "pinyin": "AI Xiǎoyǔ, nǐ hǎo!",
        "vietnamese": "Chào trợ lý AI Tiểu Ngữ!"
      },
      {
        "lineIndex": 1,
        "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
        "speakerName": "小语 (Trợ lý AI Tiểu Ngữ)",
        "gender": "female",
        "avatar": "🤖",
        "persona": "Trợ lý AI Tiểu Ngữ",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t1_line1.mp3",
        "duration": 2.21,
        "hanzi": "王老师，你好！",
        "pinyin": "Wáng lǎoshī, nǐ hǎo!",
        "vietnamese": "Chào cô giáo Vương ạ!"
      }
    ]
  },
  "hsk1-l1-t2": {
    "id": "hsk1-l1-t2",
    "lesson": 1,
    "textIndex": 2,
    "title": "课文 2: 在课堂上 (Trong lớp học)",
    "context": "开学第一天，课堂上，学生们学习打招呼用语。(Trong lớp học, các bạn học sinh học cách chào hỏi).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l1-t2_full.mp3",
    "totalDuration": 9.84,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.87,
        "duration": 1.87
      },
      {
        "lineIndex": 1,
        "start": 2.27,
        "end": 4.65,
        "duration": 2.38
      },
      {
        "lineIndex": 2,
        "start": 5.05,
        "end": 6.92,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 7.32,
        "end": 9.65,
        "duration": 2.33
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t2_line0.mp3",
        "duration": 1.87,
        "hanzi": "大家好！",
        "pinyin": "Dàjiā hǎo!",
        "vietnamese": "Chào cả lớp!"
      },
      {
        "lineIndex": 1,
        "speaker": "学生们 (Các bạn học sinh)",
        "speakerName": "学生们 (Các bạn học sinh)",
        "gender": "female",
        "avatar": "👥",
        "persona": "Các bạn học sinh",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t2_line1.mp3",
        "duration": 2.38,
        "hanzi": "老师，您好！",
        "pinyin": "Lǎoshī, nín hǎo!",
        "vietnamese": "Chúng em kính chào cô giáo ạ!"
      },
      {
        "lineIndex": 2,
        "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
        "speakerName": "小语 (Trợ lý AI Tiểu Ngữ)",
        "gender": "female",
        "avatar": "🤖",
        "persona": "Trợ lý AI Tiểu Ngữ",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t2_line2.mp3",
        "duration": 1.87,
        "hanzi": "你们好！",
        "pinyin": "Nǐmen hǎo!",
        "vietnamese": "Chào các bạn!"
      },
      {
        "lineIndex": 3,
        "speaker": "学生们 (Các bạn học sinh)",
        "speakerName": "学生们 (Các bạn học sinh)",
        "gender": "female",
        "avatar": "👥",
        "persona": "Các bạn học sinh",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t2_line3.mp3",
        "duration": 2.33,
        "hanzi": "你好，小语！",
        "pinyin": "Nǐ hǎo, Xiǎoyǔ!",
        "vietnamese": "Chào bạn Tiểu Ngữ!"
      }
    ]
  },
  "hsk1-l1-t3": {
    "id": "hsk1-l1-t3",
    "lesson": 1,
    "textIndex": 3,
    "title": "课文 3: 课堂致谢与告别 (Cảm ơn và Tạm biệt)",
    "context": "开学第一天，课堂上，学生们学习致谢语、告别语。(Cuối buổi học, học sinh nói lời cảm ơn và chào tạm biệt).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l1-t3_full.mp3",
    "totalDuration": 9.67,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.87,
        "duration": 1.87
      },
      {
        "lineIndex": 1,
        "start": 2.27,
        "end": 4.14,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 4.54,
        "end": 6.7,
        "duration": 2.16
      },
      {
        "lineIndex": 3,
        "start": 7.1,
        "end": 9.48,
        "duration": 2.38
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "学生们 (Các bạn học sinh)",
        "speakerName": "学生们 (Các bạn học sinh)",
        "gender": "female",
        "avatar": "👥",
        "persona": "Các bạn học sinh",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t3_line0.mp3",
        "duration": 1.87,
        "hanzi": "谢谢！",
        "pinyin": "Xièxie!",
        "vietnamese": "Cảm ơn ạ!"
      },
      {
        "lineIndex": 1,
        "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
        "speakerName": "小语 (Trợ lý AI Tiểu Ngữ)",
        "gender": "female",
        "avatar": "🤖",
        "persona": "Trợ lý AI Tiểu Ngữ",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t3_line1.mp3",
        "duration": 1.87,
        "hanzi": "不客气！",
        "pinyin": "Bú kèqi!",
        "vietnamese": "Không có chi!"
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t3_line2.mp3",
        "duration": 2.16,
        "hanzi": "同学们，再见！",
        "pinyin": "Tóngxuémen, zàijiàn!",
        "vietnamese": "Tạm biệt các em!"
      },
      {
        "lineIndex": 3,
        "speaker": "学生们 (Các bạn học sinh)",
        "speakerName": "学生们 (Các bạn học sinh)",
        "gender": "female",
        "avatar": "👥",
        "persona": "Các bạn học sinh",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l1-t3_line3.mp3",
        "duration": 2.38,
        "hanzi": "老师，再见！",
        "pinyin": "Lǎoshī, zàijiàn!",
        "vietnamese": "Chúng em chào cô ạ!"
      }
    ]
  },
  "hsk1-l2-t1": {
    "id": "hsk1-l2-t1",
    "lesson": 2,
    "textIndex": 1,
    "title": "课文 1: 在教室里 (Trong lớp học)",
    "context": "在教室里，王一飞在认识学生。(Trong lớp học, cô Vương Nhất Phi làm quen và hỏi tên học sinh).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l2-t1_full.mp3",
    "totalDuration": 4.86,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.52,
        "duration": 2.52
      },
      {
        "lineIndex": 1,
        "start": 2.92,
        "end": 4.79,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t1_line0.mp3",
        "duration": 2.52,
        "hanzi": "请问，你叫什么名字？",
        "pinyin": "Qǐngwèn, nǐ jiào shénme míngzi?",
        "vietnamese": "Xin hỏi, em tên là gì?"
      },
      {
        "lineIndex": 1,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t1_line1.mp3",
        "duration": 1.87,
        "hanzi": "我叫陈天中。",
        "pinyin": "Wǒ jiào Chén Tiānzhōng.",
        "vietnamese": "Em tên là Trần Thiên Trung ạ."
      }
    ]
  },
  "hsk1-l2-t2": {
    "id": "hsk1-l2-t2",
    "lesson": 2,
    "textIndex": 2,
    "title": "课文 2: 在校园里 (Trên sân trường)",
    "context": "在校园里，陈天中和白家月打招呼时认错了人。(Trên sân trường, Trần Thiên Trung chào nhầm Bạch Gia Nguyệt thành Annie).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l2-t2_full.mp3",
    "totalDuration": 12.36,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.87,
        "duration": 1.87
      },
      {
        "lineIndex": 1,
        "start": 2.27,
        "end": 7.53,
        "duration": 5.26
      },
      {
        "lineIndex": 2,
        "start": 7.93,
        "end": 9.8,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 10.2,
        "end": 12.17,
        "duration": 1.97
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t2_line0.mp3",
        "duration": 1.87,
        "hanzi": "你好，安妮！",
        "pinyin": "Nǐ hǎo, Ānnī!",
        "vietnamese": "Chào Annie!"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t2_line1.mp3",
        "duration": 5.26,
        "hanzi": "你好，陈天中！我不是安妮，我是白家月。",
        "pinyin": "Nǐ hǎo, Chén Tiānzhōng! Wǒ bú shì Ānnī, wǒ shì Bái Jiāyuè.",
        "vietnamese": "Chào Trần Thiên Trung! Mình không phải Annie, mình là Bạch Gia Nguyệt."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t2_line2.mp3",
        "duration": 1.87,
        "hanzi": "对不起！",
        "pinyin": "Duìbuqǐ!",
        "vietnamese": "Xin lỗi bạn nhé!"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t2_line3.mp3",
        "duration": 1.97,
        "hanzi": "没关系！",
        "pinyin": "Méi guānxi!",
        "vietnamese": "Không sao đâu!"
      }
    ]
  },
  "hsk1-l2-t3": {
    "id": "hsk1-l2-t3",
    "lesson": 2,
    "textIndex": 3,
    "title": "课文 3: 初次相遇 (Lần đầu gặp mặt)",
    "context": "在校园里，李文和白家月第一次相遇。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l2-t3_full.mp3",
    "totalDuration": 12.84,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.22,
        "duration": 3.22
      },
      {
        "lineIndex": 1,
        "start": 3.62,
        "end": 7.03,
        "duration": 3.41
      },
      {
        "lineIndex": 2,
        "start": 7.43,
        "end": 9.59,
        "duration": 2.16
      },
      {
        "lineIndex": 3,
        "start": 9.99,
        "end": 12.65,
        "duration": 2.66
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t3_line0.mp3",
        "duration": 3.22,
        "hanzi": "你好！我叫李文。",
        "pinyin": "Nǐ hǎo! Wǒ jiào Lǐ Wén.",
        "vietnamese": "Chào bạn! Tôi tên là Lý Văn."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t3_line1.mp3",
        "duration": 3.41,
        "hanzi": "你好！我叫白家月。",
        "pinyin": "Nǐ hǎo! Wǒ jiào Bái Jiāyuè.",
        "vietnamese": "Chào bạn! Tôi tên là Bạch Gia Nguyệt."
      },
      {
        "lineIndex": 2,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t3_line2.mp3",
        "duration": 2.16,
        "hanzi": "很高兴认识你。",
        "pinyin": "Hěn gāoxìng rènshi nǐ.",
        "vietnamese": "Rất vui được làm quen với bạn."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l2-t3_line3.mp3",
        "duration": 2.66,
        "hanzi": "认识你我也很高兴。",
        "pinyin": "Rènshi nǐ wǒ yě hěn gāoxìng.",
        "vietnamese": "Tôi cũng rất vui được làm quen với bạn."
      }
    ]
  },
  "hsk2-l1-t1": {
    "id": "hsk2-l1-t1",
    "lesson": 1,
    "textIndex": 1,
    "title": "课文 1: 在机场 (Bài khóa 1: Ở sân bay)",
    "context": "在机场，王一雪接到了白家月和安妮。(Ở sân bay, Vương Nhất Tuyết đón Bạch Gia Nguyệt và Annie).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l1-t1_full.mp3",
    "totalDuration": 23.89,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.7,
        "duration": 3.7
      },
      {
        "lineIndex": 1,
        "start": 4.1,
        "end": 7.56,
        "duration": 3.46
      },
      {
        "lineIndex": 2,
        "start": 7.96,
        "end": 12.06,
        "duration": 4.1
      },
      {
        "lineIndex": 3,
        "start": 12.46,
        "end": 19.04,
        "duration": 6.58
      },
      {
        "lineIndex": 4,
        "start": 19.44,
        "end": 21.31,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 21.71,
        "end": 23.58,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t1_line0.mp3",
        "duration": 3.7,
        "hanzi": "请问，您是王一飞老师的姐姐吗？",
        "pinyin": "Qǐngwèn, nín shì Wáng Yīfēi lǎoshī de jiějie ma?",
        "vietnamese": "Xin hỏi, chị có phải là chị gái của cô giáo Vương Nhất Phi không ạ?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t1_line1.mp3",
        "duration": 3.46,
        "hanzi": "是的，你们就是她的学生吧？",
        "pinyin": "Shì de, nǐmen jiù shì tā de xuésheng ba?",
        "vietnamese": "Đúng vậy, các em chắc hẳn là học sinh của cô ấy đúng không?"
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t1_line2.mp3",
        "duration": 4.1,
        "hanzi": "对。我是白家月，她是安妮。",
        "pinyin": "Duì. Wǒ shì Bái Jiāyuè, tā shì Ānnī.",
        "vietnamese": "Vâng ạ. Em là Bạch Gia Nguyệt, đây là Annie."
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t1_line3.mp3",
        "duration": 6.58,
        "hanzi": "你们好，我叫王一雪。一飞给我打电话了，让我来接你们。",
        "pinyin": "Nǐmen hǎo, wǒ jiào Wáng Yīxuě. Yīfēi gěi wǒ dǎ diànhuà le, ràng wǒ lái jiē nǐmen.",
        "vietnamese": "Chào các em, chị là Vương Nhất Tuyết. Nhất Phi đã gọi điện cho chị, bảo chị đến đón các em."
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 & 安妮",
        "speakerName": "白家月 & 安妮",
        "gender": "female",
        "avatar": "👯‍♀️",
        "persona": "Bạch Gia Nguyệt & Annie (Đồng thanh)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t1_line4.mp3",
        "duration": 1.87,
        "hanzi": "谢谢您。",
        "pinyin": "Xièxie nín.",
        "vietnamese": "Cảm ơn chị ạ."
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t1_line5.mp3",
        "duration": 1.87,
        "hanzi": "不客气。",
        "pinyin": "Bú kèqi.",
        "vietnamese": "Không có gì đâu."
      }
    ]
  },
  "hsk2-l1-t2": {
    "id": "hsk2-l1-t2",
    "lesson": 1,
    "textIndex": 2,
    "title": "课文 2: 在王一雪的车里 (Bài khóa 2: Trong xe của Vương Nhất Tuyết)",
    "context": "在王一雪的车里，白家月、安妮和王一雪在聊天儿。(Trong xe của Vương Nhất Tuyết, Bạch Gia Nguyệt, Annie và Vương Nhất Tuyết trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l1-t2_full.mp3",
    "totalDuration": 21.06,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.12,
        "duration": 3.12
      },
      {
        "lineIndex": 1,
        "start": 3.52,
        "end": 6.81,
        "duration": 3.29
      },
      {
        "lineIndex": 2,
        "start": 7.21,
        "end": 10.04,
        "duration": 2.83
      },
      {
        "lineIndex": 3,
        "start": 10.44,
        "end": 13.27,
        "duration": 2.83
      },
      {
        "lineIndex": 4,
        "start": 13.67,
        "end": 17.82,
        "duration": 4.15
      },
      {
        "lineIndex": 5,
        "start": 18.22,
        "end": 20.74,
        "duration": 2.52
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t2_line0.mp3",
        "duration": 3.12,
        "hanzi": "你们是第一次来北京吗？",
        "pinyin": "Nǐmen shì dì-yī cì lái Běijīng ma?",
        "vietnamese": "Các em là lần đầu tiên đến Bắc Kinh à?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t2_line1.mp3",
        "duration": 3.29,
        "hanzi": "是的，我们都是第一次来。",
        "pinyin": "Shì de, wǒmen dōu shì dì-yī cì lái.",
        "vietnamese": "Vâng ạ, chúng em đều là lần đầu tiên tới."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t2_line2.mp3",
        "duration": 2.83,
        "hanzi": "你们是来学中文的吗？",
        "pinyin": "Nǐmen shì lái xué Zhōngwén de ma?",
        "vietnamese": "Các em đến để học tiếng Trung à?"
      },
      {
        "lineIndex": 3,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t2_line3.mp3",
        "duration": 2.83,
        "hanzi": "不是，我们是来旅游的。",
        "pinyin": "Bú shì, wǒmen shì lái lǚyóu de.",
        "vietnamese": "Không ạ, chúng em đến để du lịch."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t2_line4.mp3",
        "duration": 4.15,
        "hanzi": "我这几天都不忙，你们有事就找我。",
        "pinyin": "Wǒ zhè jǐ tiān dōu bù máng, nǐmen yǒu shì jiù zhǎo wǒ.",
        "vietnamese": "Chị mấy ngày này đều không bận, các em có việc gì cứ tìm chị nhé."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t2_line5.mp3",
        "duration": 2.52,
        "hanzi": "好的，谢谢您。",
        "pinyin": "Hǎo de, xièxie nín.",
        "vietnamese": "Vâng ạ, cảm ơn chị nhiều."
      }
    ]
  },
  "hsk2-l1-t3": {
    "id": "hsk2-l1-t3",
    "lesson": 1,
    "textIndex": 3,
    "title": "课文 3: 在王一雪的车里，白家月接电话 (Bài khóa 3: Bạch Gia Nguyệt nghe điện thoại)",
    "context": "在王一雪的车里，白家月接了个电话。(Trong xe của Vương Nhất Tuyết, Bạch Gia Nguyệt nhận một cuộc điện thoại).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l1-t3_full.mp3",
    "totalDuration": 23.82,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.54,
        "duration": 4.54
      },
      {
        "lineIndex": 1,
        "start": 4.94,
        "end": 8.95,
        "duration": 4.01
      },
      {
        "lineIndex": 2,
        "start": 9.35,
        "end": 11.27,
        "duration": 1.92
      },
      {
        "lineIndex": 3,
        "start": 11.67,
        "end": 18.15,
        "duration": 6.48
      },
      {
        "lineIndex": 4,
        "start": 18.55,
        "end": 20.97,
        "duration": 2.42
      },
      {
        "lineIndex": 5,
        "start": 21.37,
        "end": 23.51,
        "duration": 2.14
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t3_line0.mp3",
        "duration": 4.54,
        "hanzi": "喂，家月，你明天有时间吗？我想请你帮个忙。",
        "pinyin": "Wèi, Jiāyuè, nǐ míngtiān yǒu shíjiān ma? Wǒ xiǎng qǐng nǐ bāng gè máng.",
        "vietnamese": "A lô, Gia Nguyệt, ngày mai cậu có thời gian không? Mình muốn nhờ cậu giúp một việc."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t3_line1.mp3",
        "duration": 4.01,
        "hanzi": "不好意思，天中，我已经到北京了。",
        "pinyin": "Bù hǎoyìsi, Tiānzhōng, wǒ yǐjīng dào Běijīng le.",
        "vietnamese": "Ngại quá, Thiên Trung, mình đã tới Bắc Kinh rồi."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t3_line2.mp3",
        "duration": 1.92,
        "hanzi": "你是什么时候到的？",
        "pinyin": "Nǐ shì shénme shíhou dào de?",
        "vietnamese": "Cậu tới lúc nào vậy?"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t3_line3.mp3",
        "duration": 6.48,
        "hanzi": "我是今天早上到的。你有事可以叫李文帮忙，他还在学校呢。",
        "pinyin": "Wǒ shì jīntiān zǎoshang dào de. Nǐ yǒu shì kěyǐ jiào Lǐ Wén bāngmáng, tā hái zài xuéxiào ne.",
        "vietnamese": "Mình tới sáng nay. Cậu có việc có thể nhờ Lý Văn giúp, cậu ấy vẫn còn ở trường đấy."
      },
      {
        "lineIndex": 4,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t3_line4.mp3",
        "duration": 2.42,
        "hanzi": "好的，那我给他打个电话。",
        "pinyin": "Hǎo de, nà wǒ gěi tā dǎ gè diànhuà.",
        "vietnamese": "Được rồi, thế để mình gọi cho cậu ấy."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t3_line5.mp3",
        "duration": 2.14,
        "hanzi": "好，再见！",
        "pinyin": "Hǎo, zàijiàn!",
        "vietnamese": "Ừ, tạm biệt nhé!"
      }
    ]
  },
  "hsk2-l1-t4": {
    "id": "hsk2-l1-t4",
    "lesson": 1,
    "textIndex": 4,
    "title": "课文 4: 在酒店 (Bài khóa 4: Ở khách sạn)",
    "context": "在酒店，白家月给王一飞发信息。(Ở khách sạn, Bạch Gia Nguyệt gửi tin nhắn cho cô Vương Nhất Phi).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l1-t4_full.mp3",
    "totalDuration": 13.8,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 13.8,
        "duration": 13.8
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l1-t4_line0.mp3",
        "duration": 13.8,
        "hanzi": "王老师，我们已经到北京了，是您姐姐来接的我们。她请我们吃了北京烤鸭，还给我们介绍了很多东西。我们的中文不太好，有时不太懂她的意思。",
        "pinyin": "Wáng lǎoshī, wǒmen yǐjīng dào Běijīng le, shì nín jiějie lái jiē de wǒmen. Tā qǐng wǒmen chīle Běijīng Kǎoyā, hái gěi wǒmen jièshào le hěn duō dōngxi. Wǒmen de Zhōngwén bú tài hǎo, yǒushí bú tài dǒng tā de yìsi.",
        "vietnamese": "Thưa cô Vương, chúng em đã đến Bắc Kinh rồi, là chị gái của cô đến đón chúng em. Chị ấy đã mời chúng em ăn vịt quay Bắc Kinh, còn giới thiệu cho chúng em rất nhiều điều. Tiếng Trung của chúng em chưa tốt lắm, đôi khi không hiểu lắm ý của chị ấy."
      }
    ]
  },
  "hsk2-l2-t1": {
    "id": "hsk2-l2-t1",
    "lesson": 2,
    "textIndex": 1,
    "title": "课文 1: 在宾馆前台 (Bài khóa 1: Ở quầy lễ tân khách sạn)",
    "context": "在宾馆前台，白家月和安妮向服务员咨询。(Ở quầy lễ tân khách sạn, Bạch Gia Nguyệt và Annie hỏi thăm nhân viên phục vụ).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l2-t1_full.mp3",
    "totalDuration": 19.67,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.06,
        "duration": 4.06
      },
      {
        "lineIndex": 1,
        "start": 4.46,
        "end": 7.32,
        "duration": 2.86
      },
      {
        "lineIndex": 2,
        "start": 7.72,
        "end": 9.9,
        "duration": 2.18
      },
      {
        "lineIndex": 3,
        "start": 10.3,
        "end": 12.17,
        "duration": 1.87
      },
      {
        "lineIndex": 4,
        "start": 12.57,
        "end": 16.87,
        "duration": 4.3
      },
      {
        "lineIndex": 5,
        "start": 17.27,
        "end": 19.36,
        "duration": 2.09
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t1_line0.mp3",
        "duration": 4.06,
        "hanzi": "请问，这儿有到北京大学的公交车吗？",
        "pinyin": "Qǐngwèn, zhèr yǒu dào Běijīng Dàxué de gōngjiāochē ma?",
        "vietnamese": "Xin hỏi, ở đây có xe buýt đi đến Đại học Bắc Kinh không ạ?"
      },
      {
        "lineIndex": 1,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍💼",
        "persona": "Nhân viên phục vụ lịch thiệp, ân cần",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t1_line1.mp3",
        "duration": 2.86,
        "hanzi": "有，但车站有点儿远。",
        "pinyin": "Yǒu, dàn chēzhàn yǒudiǎnr yuǎn.",
        "vietnamese": "Có, nhưng trạm xe buýt hơi xa một chút."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t1_line2.mp3",
        "duration": 2.18,
        "hanzi": "这儿好打车吗？",
        "pinyin": "Zhèr hǎo dǎchē ma?",
        "vietnamese": "Ở đây có dễ bắt taxi không ạ?"
      },
      {
        "lineIndex": 3,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍💼",
        "persona": "Nhân viên phục vụ lịch thiệp, ân cần",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t1_line3.mp3",
        "duration": 1.87,
        "hanzi": "好打车。",
        "pinyin": "Hǎo dǎchē.",
        "vietnamese": "Dễ bắt taxi lắm ạ."
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t1_line4.mp3",
        "duration": 4.3,
        "hanzi": "谢谢。安妮，我们还是打车去吧。",
        "pinyin": "Xièxie. Ānnī, wǒmen háishi dǎchē qù ba.",
        "vietnamese": "Cảm ơn chị. Annie, chúng mình hay là đi taxi đi."
      },
      {
        "lineIndex": 5,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t1_line5.mp3",
        "duration": 2.09,
        "hanzi": "好，没问题。",
        "pinyin": "Hǎo, méi wèntí.",
        "vietnamese": "Được, không thành vấn đề."
      }
    ]
  },
  "hsk2-l2-t2": {
    "id": "hsk2-l2-t2",
    "lesson": 2,
    "textIndex": 2,
    "title": "课文 2: 在北京大学 (Bài khóa 2: Ở Đại học Bắc Kinh)",
    "context": "在北京大学，白家月和安妮在参观校园。(Ở Đại học Bắc Kinh, Bạch Gia Nguyệt và Annie đi tham quan khuôn viên trường).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l2-t2_full.mp3",
    "totalDuration": 23.0,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.62,
        "duration": 2.62
      },
      {
        "lineIndex": 1,
        "start": 3.02,
        "end": 7.12,
        "duration": 4.1
      },
      {
        "lineIndex": 2,
        "start": 7.52,
        "end": 9.92,
        "duration": 2.4
      },
      {
        "lineIndex": 3,
        "start": 10.32,
        "end": 15.89,
        "duration": 5.57
      },
      {
        "lineIndex": 4,
        "start": 16.29,
        "end": 18.71,
        "duration": 2.42
      },
      {
        "lineIndex": 5,
        "start": 19.11,
        "end": 22.69,
        "duration": 3.58
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t2_line0.mp3",
        "duration": 2.62,
        "hanzi": "学校里人真多啊！",
        "pinyin": "Xuéxiào li rén zhēn duō a!",
        "vietnamese": "Trong trường đông người thật đấy!"
      },
      {
        "lineIndex": 1,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t2_line1.mp3",
        "duration": 4.1,
        "hanzi": "是啊，北京大学有四万多名学生呢！",
        "pinyin": "Shì a, Běijīng Dàxué yǒu sìwàn duō míng xuésheng ne!",
        "vietnamese": "Đúng vậy, Đại học Bắc Kinh có hơn bốn vạn sinh viên lận đó!"
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t2_line2.mp3",
        "duration": 2.4,
        "hanzi": "你是怎么知道的？",
        "pinyin": "Nǐ shì zěnme zhīdào de?",
        "vietnamese": "Sao cậu biết được vậy?"
      },
      {
        "lineIndex": 3,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t2_line3.mp3",
        "duration": 5.57,
        "hanzi": "是网上说的，网上还说北京大学有三千多名外国学生。",
        "pinyin": "Shì wǎngshang shuō de, wǎngshang hái shuō Běijīng Dàxué yǒu sānqiān duō míng wàiguó xuésheng.",
        "vietnamese": "Là trên mạng nói đó, trên mạng còn nói Đại học Bắc Kinh có hơn ba nghìn lưu học sinh nước ngoài."
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t2_line4.mp3",
        "duration": 2.42,
        "hanzi": "我也想来这儿学习。",
        "pinyin": "Wǒ yě xiǎng lái zhèr xuéxí.",
        "vietnamese": "Mình cũng muốn đến đây học ghê."
      },
      {
        "lineIndex": 5,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t2_line5.mp3",
        "duration": 3.58,
        "hanzi": "那边就有一间教室，我们去看一下吧。",
        "pinyin": "Nàbian jiù yǒu yì jiān jiàoshì, wǒmen qù kàn yíxià ba.",
        "vietnamese": "Đằng kia có một phòng học kìa, chúng mình qua xem thử đi."
      }
    ]
  },
  "hsk2-l2-t3": {
    "id": "hsk2-l2-t3",
    "lesson": 2,
    "textIndex": 3,
    "title": "课文 3: 在北京大学 (Bài khóa 3: Ở Đại học Bắc Kinh)",
    "context": "在北京大学，白家月和安妮在参观校园。(Ở Đại học Bắc Kinh, Bạch Gia Nguyệt và Annie tham quan khuôn viên trường).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l2-t3_full.mp3",
    "totalDuration": 23.34,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.72,
        "duration": 3.72
      },
      {
        "lineIndex": 1,
        "start": 4.12,
        "end": 7.07,
        "duration": 2.95
      },
      {
        "lineIndex": 2,
        "start": 7.47,
        "end": 10.64,
        "duration": 3.17
      },
      {
        "lineIndex": 3,
        "start": 11.04,
        "end": 15.07,
        "duration": 4.03
      },
      {
        "lineIndex": 4,
        "start": 15.47,
        "end": 18.16,
        "duration": 2.69
      },
      {
        "lineIndex": 5,
        "start": 18.56,
        "end": 23.02,
        "duration": 4.46
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t3_line0.mp3",
        "duration": 3.72,
        "hanzi": "家月，你看，学校里有家电影院！",
        "pinyin": "Jiāyuè, nǐ kàn, xuéxiào li yǒu jiā diànyǐngyuàn!",
        "vietnamese": "Gia Nguyệt, cậu nhìn kìa, trong trường có cả rạp chiếu phim này!"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t3_line1.mp3",
        "duration": 2.95,
        "hanzi": "是啊，电影院还不小。",
        "pinyin": "Shì a, diànyǐngyuàn hái bù xiǎo.",
        "vietnamese": "Đúng thế, rạp chiếu phim này cũng không hề nhỏ đâu."
      },
      {
        "lineIndex": 2,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t3_line2.mp3",
        "duration": 3.17,
        "hanzi": "他们卖的电影票也很便宜。",
        "pinyin": "Tāmen mài de diànyǐngpiào yě hěn piányi.",
        "vietnamese": "Vé xem phim họ bán cũng rẻ lắm."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t3_line3.mp3",
        "duration": 4.03,
        "hanzi": "天啊！有的还不到二十块钱。",
        "pinyin": "Tiān a! Yǒude hái bú dào èrshí kuài qián.",
        "vietnamese": "Trời ơi! Có vé còn chưa tới hai mươi tệ nữa."
      },
      {
        "lineIndex": 4,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t3_line4.mp3",
        "duration": 2.69,
        "hanzi": "那你想不想去看个电影？",
        "pinyin": "Nà nǐ xiǎng bu xiǎng qù kàn gè diànyǐng?",
        "vietnamese": "Thế cậu có muốn đi xem một bộ phim không?"
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t3_line5.mp3",
        "duration": 4.46,
        "hanzi": "还是别看电影了，北京大学就很好看！",
        "pinyin": "Háishi bié kàn diànyǐng le, Běijīng Dàxué jiù hěn hǎokàn!",
        "vietnamese": "Thôi đừng xem phim nữa, chỉ riêng Đại học Bắc Kinh thôi đã ngắm mê ly rồi!"
      }
    ]
  },
  "hsk2-l2-t4": {
    "id": "hsk2-l2-t4",
    "lesson": 2,
    "textIndex": 4,
    "title": "课文 4: 在北京大学门口 (Bài khóa 4: Trước cổng Đại học Bắc Kinh)",
    "context": "在北京大学门口，白家月给陈天中发信息。(Ở cổng Đại học Bắc Kinh, Bạch Gia Nguyệt gửi tin nhắn cho Trần Thiên Trung).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l2-t4_full.mp3",
    "totalDuration": 12.05,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 12.05,
        "duration": 12.05
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l2-t4_line0.mp3",
        "duration": 12.05,
        "hanzi": "北京大学很大，有四万多名学生。学校很漂亮，里边还有家电影院，电影票也不贵，我们有时间还想再过来看个电影。",
        "pinyin": "Běijīng Dàxué hěn dà, yǒu sìwàn duō míng xuésheng. Xuéxiào hěn piàoliang, lǐbian hái yǒu jiā diànyǐngyuàn, diànyǐngpiào yě bú guì, wǒmen yǒu shíjiān hái xiǎng zài guòlái kàn gè diànyǐng.",
        "vietnamese": "Đại học Bắc Kinh rất rộng lớn, có hơn bốn vạn sinh viên. Trường rất đẹp, bên trong còn có rạp chiếu phim, vé phim cũng không đắt, chúng tớ nếu có thời gian còn muốn quay lại đây xem một bộ phim."
      }
    ]
  },
  "hsk2-l3-t1": {
    "id": "hsk2-l3-t1",
    "lesson": 3,
    "textIndex": 1,
    "title": "课文 1: 在家门口 (Bài khóa 1: Ở cửa nhà)",
    "context": "在家门口，刘明开门进到家里。(Ở cửa nhà, Lưu Minh mở cửa bước vào nhà).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l3-t1_full.mp3",
    "totalDuration": 17.05,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.69,
        "duration": 2.69
      },
      {
        "lineIndex": 1,
        "start": 3.09,
        "end": 7.07,
        "duration": 3.98
      },
      {
        "lineIndex": 2,
        "start": 7.47,
        "end": 10.97,
        "duration": 3.5
      },
      {
        "lineIndex": 3,
        "start": 11.37,
        "end": 14.51,
        "duration": 3.14
      },
      {
        "lineIndex": 4,
        "start": 14.91,
        "end": 16.78,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t1_line0.mp3",
        "duration": 2.69,
        "hanzi": "今天回来这么晚啊！",
        "pinyin": "Jīntiān huílái zhème wǎn a!",
        "vietnamese": "Hôm nay anh về muộn thế này à!"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t1_line1.mp3",
        "duration": 3.98,
        "hanzi": "工作太多了，下班的时候没做完。",
        "pinyin": "Gōngzuò tài duō le, xiàbān de shíhou méi zuòwán.",
        "vietnamese": "Công việc nhiều quá, lúc tan làm chưa làm xong."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t1_line2.mp3",
        "duration": 3.5,
        "hanzi": "菜都做好了，过来吃饭吧。",
        "pinyin": "Cài dōu zuòhǎo le, guòlái chī fàn ba.",
        "vietnamese": "Cơm canh nấu xong hết cả rồi, anh qua ăn cơm đi."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t1_line3.mp3",
        "duration": 3.14,
        "hanzi": "我想休息一下，喝杯水。",
        "pinyin": "Wǒ xiǎng xiūxi yíxià, hē bēi shuǐ.",
        "vietnamese": "Anh muốn nghỉ ngơi một lát, uống cốc nước đã."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t1_line4.mp3",
        "duration": 1.87,
        "hanzi": "好的。",
        "pinyin": "Hǎo de.",
        "vietnamese": "Vâng ạ."
      }
    ]
  },
  "hsk2-l3-t2": {
    "id": "hsk2-l3-t2",
    "lesson": 3,
    "textIndex": 2,
    "title": "课文 2: 在客厅 (Bài khóa 2: Ở phòng khách)",
    "context": "在客厅，刘明和王一雪在聊天儿。(Ở phòng khách, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l3-t2_full.mp3",
    "totalDuration": 17.53,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.46,
        "duration": 3.46
      },
      {
        "lineIndex": 1,
        "start": 3.86,
        "end": 7.63,
        "duration": 3.77
      },
      {
        "lineIndex": 2,
        "start": 8.03,
        "end": 10.0,
        "duration": 1.97
      },
      {
        "lineIndex": 3,
        "start": 10.4,
        "end": 12.66,
        "duration": 2.26
      },
      {
        "lineIndex": 4,
        "start": 13.06,
        "end": 17.28,
        "duration": 4.22
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t2_line0.mp3",
        "duration": 3.46,
        "hanzi": "我们找个时间去旅游，怎么样？",
        "pinyin": "Wǒmen zhǎo gè shíjiān qù lǚyóu, zěnmeyàng?",
        "vietnamese": "Chúng mình tìm thời gian đi du lịch đi, thấy thế nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t2_line1.mp3",
        "duration": 3.77,
        "hanzi": "好啊，我也很想一起出去玩。",
        "pinyin": "Hǎo a, wǒ yě hěn xiǎng yìqǐ chūqù wán.",
        "vietnamese": "Hay quá, em cũng rất muốn cùng nhau ra ngoài đi chơi."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t2_line2.mp3",
        "duration": 1.97,
        "hanzi": "你想去哪儿？",
        "pinyin": "Nǐ xiǎng qù nǎr?",
        "vietnamese": "Em muốn đi đâu?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t2_line3.mp3",
        "duration": 2.26,
        "hanzi": "我还没想好呢。",
        "pinyin": "Wǒ hái méi xiǎnghǎo ne.",
        "vietnamese": "Em vẫn chưa nghĩ xong nữa."
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t2_line4.mp3",
        "duration": 4.22,
        "hanzi": "那你再想一想，你想好了，我来买票。",
        "pinyin": "Nà nǐ zài xiǎng yi xiǎng, nǐ xiǎnghǎo le, wǒ lái mǎi piào.",
        "vietnamese": "Thế em nghĩ thêm xem sao, em nghĩ xong rồi thì để anh mua vé."
      }
    ]
  },
  "hsk2-l3-t3": {
    "id": "hsk2-l3-t3",
    "lesson": 3,
    "textIndex": 3,
    "title": "课文 3: 在客厅 (Bài khóa 3: Ở phòng khách)",
    "context": "在客厅，刘明和王一雪在聊天儿。(Ở phòng khách, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l3-t3_full.mp3",
    "totalDuration": 23.6,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.31,
        "duration": 3.31
      },
      {
        "lineIndex": 1,
        "start": 3.71,
        "end": 5.58,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 5.98,
        "end": 9.22,
        "duration": 3.24
      },
      {
        "lineIndex": 3,
        "start": 9.62,
        "end": 15.33,
        "duration": 5.71
      },
      {
        "lineIndex": 4,
        "start": 15.73,
        "end": 18.06,
        "duration": 2.33
      },
      {
        "lineIndex": 5,
        "start": 18.46,
        "end": 23.28,
        "duration": 4.82
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t3_line0.mp3",
        "duration": 3.31,
        "hanzi": "吃个苹果吧，我都洗好了。",
        "pinyin": "Chī gè píngguǒ ba, wǒ dōu xǐhǎo le.",
        "vietnamese": "Ăn quả táo đi, anh rửa sạch cả rồi."
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t3_line1.mp3",
        "duration": 1.87,
        "hanzi": "好的。",
        "pinyin": "Hǎo de.",
        "vietnamese": "Vâng."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t3_line2.mp3",
        "duration": 3.24,
        "hanzi": "就在桌子上，你自己拿。",
        "pinyin": "Jiù zài zhuōzi shang, nǐ zìjǐ ná.",
        "vietnamese": "Ở ngay trên bàn đấy, em tự lấy nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t3_line3.mp3",
        "duration": 5.71,
        "hanzi": "我去洗洗手。对了，我们去西安旅游，怎么样？",
        "pinyin": "Wǒ qù xǐxishǒu. Duìle, wǒmen qù Xī'ān lǚyóu, zěnmeyàng?",
        "vietnamese": "Em đi rửa tay đã. Đúng rồi, chúng mình đi Tây An du lịch nhé, thấy sao anh?"
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t3_line4.mp3",
        "duration": 2.33,
        "hanzi": "为什么想去西安？",
        "pinyin": "Wèi shénme xiǎng qù Xī'ān?",
        "vietnamese": "Sao lại muốn đi Tây An?"
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t3_line5.mp3",
        "duration": 4.82,
        "hanzi": "我看了看网上的介绍，这个时候去西安很不错！",
        "pinyin": "Wǒ kànle kàn wǎngshang de jièshào, zhège shíhou qù Xī'ān hěn búcuò!",
        "vietnamese": "Em vừa xem qua lời giới thiệu trên mạng, tầm này đi Tây An tuyệt lắm!"
      }
    ]
  },
  "hsk2-l3-t4": {
    "id": "hsk2-l3-t4",
    "lesson": 3,
    "textIndex": 4,
    "title": "课文 4: 在家里 (Bài khóa 4: Ở nhà)",
    "context": "在家里，王一雪给好朋友打电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại cho bạn thân).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l3-t4_full.mp3",
    "totalDuration": 14.18,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 14.18,
        "duration": 14.18
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l3-t4_line0.mp3",
        "duration": 14.18,
        "hanzi": "早上，刘明开车送孩子去学校，送完孩子回家后，医院就来电话了，让他回去上班。我觉得他这个月每天都很累，真想让他休息休息。",
        "pinyin": "Zǎoshang, Liú Míng kāichē sòng háizi qù xuéxiào, sòngwán háizi huí jiā hòu, yīyuàn jiù lái diànhuà le, ràng tā huíqù shàngbān. Wǒ juéde tā zhège yuè měitiān dōu hěn lèi, zhēn xiǎng ràng tā xiūxi xiūxi.",
        "vietnamese": "Buổi sáng, Lưu Minh lái xe đưa các con đi học, đưa con xong về tới nhà thì bệnh viện lại gọi điện bảo anh ấy quay lại làm việc. Em thấy tháng này ngày nào anh ấy cũng rất mệt, thật sự muốn anh ấy được nghỉ ngơi một chút."
      }
    ]
  },
  "hsk2-l4-t1": {
    "id": "hsk2-l4-t1",
    "lesson": 4,
    "textIndex": 1,
    "title": "课文 1: 在商场门口 (Bài khóa 1: Ở cửa trung tâm thương mại)",
    "context": "在商场门口，王一雪和刘小雪在聊天儿。(Ở cửa trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l4-t1_full.mp3",
    "totalDuration": 17.39,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.98,
        "duration": 2.98
      },
      {
        "lineIndex": 1,
        "start": 3.38,
        "end": 6.52,
        "duration": 3.14
      },
      {
        "lineIndex": 2,
        "start": 6.92,
        "end": 8.84,
        "duration": 1.92
      },
      {
        "lineIndex": 3,
        "start": 9.24,
        "end": 12.38,
        "duration": 3.14
      },
      {
        "lineIndex": 4,
        "start": 12.78,
        "end": 14.8,
        "duration": 2.02
      },
      {
        "lineIndex": 5,
        "start": 15.2,
        "end": 17.07,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t1_line0.mp3",
        "duration": 2.98,
        "hanzi": "妈妈，我们来过这家商场吗？",
        "pinyin": "Māma, wǒmen láiguo zhè jiā shāngchǎng ma?",
        "vietnamese": "Mẹ ơi, chúng ta đã từng đến trung tâm thương mại này chưa?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t1_line1.mp3",
        "duration": 3.14,
        "hanzi": "没来过，这是新开的。",
        "pinyin": "Méi láiguo, zhè shì xīn kāi de.",
        "vietnamese": "Chưa từng đến, đây là chỗ mới mở."
      },
      {
        "lineIndex": 2,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t1_line2.mp3",
        "duration": 1.92,
        "hanzi": "我们进去看看吧。",
        "pinyin": "Wǒmen jìnqù kànkan ba.",
        "vietnamese": "Chúng mình vào trong xem thử đi mẹ."
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t1_line3.mp3",
        "duration": 3.14,
        "hanzi": "好啊！你想买点儿什么？",
        "pinyin": "Hǎo a! Nǐ xiǎng mǎi diǎnr shénme?",
        "vietnamese": "Được chứ! Con muốn mua gì nào?"
      },
      {
        "lineIndex": 4,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t1_line4.mp3",
        "duration": 2.02,
        "hanzi": "我想买条裤子。",
        "pinyin": "Wǒ xiǎng mǎi tiáo kùzi.",
        "vietnamese": "Con muốn mua một chiếc quần dài."
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t1_line5.mp3",
        "duration": 1.87,
        "hanzi": "没问题。",
        "pinyin": "Méi wèntí.",
        "vietnamese": "Không vấn đề gì."
      }
    ]
  },
  "hsk2-l4-t2": {
    "id": "hsk2-l4-t2",
    "lesson": 4,
    "textIndex": 2,
    "title": "课文 2: 在商场 (Bài khóa 2: Ở trung tâm thương mại)",
    "context": "在商场，王一雪和刘小雪在看衣服。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết chọn quần áo).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l4-t2_full.mp3",
    "totalDuration": 26.46,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.34,
        "duration": 3.34
      },
      {
        "lineIndex": 1,
        "start": 3.74,
        "end": 8.37,
        "duration": 4.63
      },
      {
        "lineIndex": 2,
        "start": 8.77,
        "end": 10.93,
        "duration": 2.16
      },
      {
        "lineIndex": 3,
        "start": 11.33,
        "end": 17.71,
        "duration": 6.38
      },
      {
        "lineIndex": 4,
        "start": 18.11,
        "end": 21.49,
        "duration": 3.38
      },
      {
        "lineIndex": 5,
        "start": 21.89,
        "end": 26.14,
        "duration": 4.25
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t2_line0.mp3",
        "duration": 3.34,
        "hanzi": "妈妈，我想买这条白色的裤子。",
        "pinyin": "Māma, wǒ xiǎng mǎi zhè tiáo báisè de kùzi.",
        "vietnamese": "Mẹ ơi, con muốn mua chiếc quần màu trắng này."
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t2_line1.mp3",
        "duration": 4.63,
        "hanzi": "你有很多白色的衣服，为什么还买白色的？",
        "pinyin": "Nǐ yǒu hěn duō báisè de yīfu, wèi shénme hái mǎi báisè de?",
        "vietnamese": "Con có rất nhiều quần áo màu trắng rồi, sao lại mua màu trắng nữa?"
      },
      {
        "lineIndex": 2,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t2_line2.mp3",
        "duration": 2.16,
        "hanzi": "因为我喜欢白色啊！",
        "pinyin": "Yīnwèi wǒ xǐhuan báisè a!",
        "vietnamese": "Bởi vì con thích màu trắng mà mẹ!"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t2_line3.mp3",
        "duration": 6.38,
        "hanzi": "我觉得这条白色的不太好看，你试试那条红色的吧。",
        "pinyin": "Wǒ juéde zhè tiáo báisè de bú tài hǎokàn, nǐ shìshi nà tiáo hóngsè de ba.",
        "vietnamese": "Mẹ thấy chiếc màu trắng này không được đẹp lắm, con thử chiếc màu đỏ kia xem sao."
      },
      {
        "lineIndex": 4,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t2_line4.mp3",
        "duration": 3.38,
        "hanzi": "我没穿过红色的，红色的好看吗？",
        "pinyin": "Wǒ méi chuānguo hóngsè de, hóngsè de hǎokàn ma?",
        "vietnamese": "Con chưa từng mặc màu đỏ, màu đỏ có đẹp không mẹ?"
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t2_line5.mp3",
        "duration": 4.25,
        "hanzi": "就是因为没穿过，所以要试试啊！",
        "pinyin": "Jiù shì yīnwèi méi chuānguo, suǒyǐ yào shìshi a!",
        "vietnamese": "Chính vì chưa từng mặc nên mới cần thử chứ!"
      }
    ]
  },
  "hsk2-l4-t3": {
    "id": "hsk2-l4-t3",
    "lesson": 4,
    "textIndex": 3,
    "title": "课文 3: 在商场 (Bài khóa 3: Ở trung tâm thương mại)",
    "context": "在商场，王一雪和刘小雪在看书包。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Tiểu Tuyết chọn ba lô).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l4-t3_full.mp3",
    "totalDuration": 23.27,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.76,
        "duration": 2.76
      },
      {
        "lineIndex": 1,
        "start": 3.16,
        "end": 7.36,
        "duration": 4.2
      },
      {
        "lineIndex": 2,
        "start": 7.76,
        "end": 9.92,
        "duration": 2.16
      },
      {
        "lineIndex": 3,
        "start": 10.32,
        "end": 15.91,
        "duration": 5.59
      },
      {
        "lineIndex": 4,
        "start": 16.31,
        "end": 18.18,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 18.58,
        "end": 22.95,
        "duration": 4.37
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t3_line0.mp3",
        "duration": 2.76,
        "hanzi": "妈妈，我想买个新书包。",
        "pinyin": "Māma, wǒ xiǎng mǎi gè xīn shūbāo.",
        "vietnamese": "Mẹ ơi, con muốn mua một chiếc ba lô mới."
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t3_line1.mp3",
        "duration": 4.2,
        "hanzi": "好，那边卖书包，我们过去看看吧。",
        "pinyin": "Hǎo, nàbian mài shūbāo, wǒmen guòqù kànkan ba.",
        "vietnamese": "Được, đằng kia bán ba lô, chúng mình qua xem thử nhé."
      },
      {
        "lineIndex": 2,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t3_line2.mp3",
        "duration": 2.16,
        "hanzi": "这么多漂亮的书包！",
        "pinyin": "Zhème duō piàoliang de shūbāo!",
        "vietnamese": "Nhiều ba lô đẹp quá chừng!"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t3_line3.mp3",
        "duration": 5.59,
        "hanzi": "红色的、绿色的、黑色的，你想买哪个？",
        "pinyin": "Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge?",
        "vietnamese": "Cái màu đỏ, cái màu xanh lá, cái màu đen, con muốn mua cái nào?"
      },
      {
        "lineIndex": 4,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t3_line4.mp3",
        "duration": 1.87,
        "hanzi": "绿色的吧。",
        "pinyin": "Lǜsè de ba.",
        "vietnamese": "Cái màu xanh lá đi mẹ."
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t3_line5.mp3",
        "duration": 4.37,
        "hanzi": "不错，我也觉得绿色的更好看。",
        "pinyin": "Búcuò, wǒ yě juéde lǜsè de gèng hǎokàn.",
        "vietnamese": "Tốt đấy, mẹ cũng thấy cái màu xanh lá đẹp hơn."
      }
    ]
  },
  "hsk2-l4-t4": {
    "id": "hsk2-l4-t4",
    "lesson": 4,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
    "context": "在房间，刘小雪在写日记。(Trong phòng, Lưu Tiểu Tuyết viết nhật ký).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l4-t4_full.mp3",
    "totalDuration": 15.26,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 15.26,
        "duration": 15.26
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l4-t4_line0.mp3",
        "duration": 15.26,
        "hanzi": "我和妈妈去了一家商场。因为是新开的，所以这几天东西很便宜。商场里的衣服颜色很多。我没穿过红色的裤子，妈妈让我试了试，我觉得我穿红色的也很好看。",
        "pinyin": "Wǒ hé māma qùle yì jiā shāngchǎng. Yīnwèi shì xīn kāi de, suǒyǐ zhè jǐ tiān dōngxi hěn piányi. Shāngchǎng li de yīfu yánsè hěn duō. Wǒ méi chuānguo hóngsè de kùzi, māma ràng wǒ shìleshì, wǒ juéde wǒ chuān hóngsè de yě hěn hǎokàn.",
        "vietnamese": "Tôi cùng mẹ đến một trung tâm thương mại. Vì mới khai trương nên mấy hôm nay đồ đạc rất rẻ. Quần áo trong đó màu sắc rất đa dạng. Tôi chưa từng mặc quần màu đỏ bao giờ, mẹ bảo tôi thử một chút, tôi thấy mình mặc màu đỏ cũng rất đẹp."
      }
    ]
  },
  "hsk2-l5-t1": {
    "id": "hsk2-l5-t1",
    "lesson": 5,
    "textIndex": 1,
    "title": "课文 1: 在宾馆楼下 (Bài khóa 1: Ở dưới tầng khách sạn)",
    "context": "在宾馆楼下，安妮给白家月打电话。(Ở dưới tầng khách sạn, Annie gọi điện thoại cho Bạch Gia Nguyệt).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l5-t1_full.mp3",
    "totalDuration": 22.45,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 5.28,
        "duration": 5.28
      },
      {
        "lineIndex": 1,
        "start": 5.68,
        "end": 8.58,
        "duration": 2.9
      },
      {
        "lineIndex": 2,
        "start": 8.98,
        "end": 11.98,
        "duration": 3.0
      },
      {
        "lineIndex": 3,
        "start": 12.38,
        "end": 14.71,
        "duration": 2.33
      },
      {
        "lineIndex": 4,
        "start": 15.11,
        "end": 16.98,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 17.38,
        "end": 22.13,
        "duration": 4.75
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t1_line0.mp3",
        "duration": 5.28,
        "hanzi": "家月，快下来吧，第一次去中国朋友家，别晚了。",
        "pinyin": "Jiāyuè, kuài xiàlái ba, dì-yī cì qù Zhōngguó péngyou jiā, bié wǎn le.",
        "vietnamese": "Gia Nguyệt, mau xuống đi thôi, lần đầu tiên đến nhà bạn Trung Quốc chơi, đừng để muộn nhé."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t1_line1.mp3",
        "duration": 2.9,
        "hanzi": "还有时间，你上来吧。",
        "pinyin": "Hái yǒu shíjiān, nǐ shànglái ba.",
        "vietnamese": "Vẫn còn thời gian mà, bạn lên đây đi."
      },
      {
        "lineIndex": 2,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t1_line2.mp3",
        "duration": 3.0,
        "hanzi": "我不上去了，就在下面等你。",
        "pinyin": "Wǒ bú shàngqù le, jiù zài xiàmiàn děng nǐ.",
        "vietnamese": "Mình không lên đâu, mình đứng dưới này đợi bạn."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t1_line3.mp3",
        "duration": 2.33,
        "hanzi": "那我一会儿就下去。",
        "pinyin": "Nà wǒ yíhuìr jiù xiàqù.",
        "vietnamese": "Thế lát nữa mình xuống ngay."
      },
      {
        "lineIndex": 4,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t1_line4.mp3",
        "duration": 1.87,
        "hanzi": "你快点儿吧。",
        "pinyin": "Nǐ kuài diǎnr ba.",
        "vietnamese": "Bạn nhanh lên một chút nhé."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t1_line5.mp3",
        "duration": 4.75,
        "hanzi": "没事，一雪姐说11点前到就可以。",
        "pinyin": "Méishì, Yīxué jiě shuō shíyī diǎn qián dào jiù kěyǐ.",
        "vietnamese": "Không sao đâu, chị Nhất Tuyết bảo trước 11 giờ đến là được rồi."
      }
    ]
  },
  "hsk2-l5-t2": {
    "id": "hsk2-l5-t2",
    "lesson": 5,
    "textIndex": 2,
    "title": "课文 2: 在王一雪家 (Bài khóa 2: Tại nhà Vương Nhất Tuyết)",
    "context": "在王一雪家，白家月和安妮来做客。(Tại nhà Vương Nhất Tuyết, Bạch Gia Nguyệt và Annie đến làm khách).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l5-t2_full.mp3",
    "totalDuration": 38.5,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 8.02,
        "duration": 8.02
      },
      {
        "lineIndex": 1,
        "start": 8.42,
        "end": 10.29,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 10.69,
        "end": 17.75,
        "duration": 7.06
      },
      {
        "lineIndex": 3,
        "start": 18.15,
        "end": 21.85,
        "duration": 3.7
      },
      {
        "lineIndex": 4,
        "start": 22.25,
        "end": 24.72,
        "duration": 2.47
      },
      {
        "lineIndex": 5,
        "start": 25.12,
        "end": 29.46,
        "duration": 4.34
      },
      {
        "lineIndex": 6,
        "start": 29.86,
        "end": 33.8,
        "duration": 3.94
      },
      {
        "lineIndex": 7,
        "start": 34.2,
        "end": 38.06,
        "duration": 3.86
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line0.mp3",
        "duration": 8.02,
        "hanzi": "家月、安妮，快进来！我给你们介绍一下，这是孩子们的爷爷、奶奶。",
        "pinyin": "Jiāyuè, Ānnī, kuài jìnlái! Wǒ gěi nǐmen jièshào yíxià, zhè shì háizimen de yéye, nǎinai.",
        "vietnamese": "Gia Nguyệt, Annie, mau vào đi! Chị giới thiệu với các em một chút, đây là ông nội, bà nội của bọn trẻ."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 & 安妮",
        "speakerName": "白家月 & 安妮",
        "gender": "female",
        "avatar": "👯‍♀️",
        "persona": "Bạch Gia Nguyệt & Annie (Đồng thanh)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line1.mp3",
        "duration": 1.87,
        "hanzi": "你们好！",
        "pinyin": "Nǐmen hǎo!",
        "vietnamese": "Cháu chào hai bác ạ!"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line2.mp3",
        "duration": 7.06,
        "hanzi": "爸、妈，这是白家月，这是安妮。她们都是一飞的学生。",
        "pinyin": "Bà, mā, zhè shì Bái Jiāyuè, zhè shì Ānnī. Tāmen dōu shì Yīfēi de xuésheng.",
        "vietnamese": "Bố, mẹ, đây là Bạch Gia Nguyệt, còn đây là Annie. Hai em ấy đều là học sinh của Nhất Phi."
      },
      {
        "lineIndex": 3,
        "speaker": "刘爷爷 (Ông nội Lưu)",
        "speakerName": "刘爷爷 (Ông nội Lưu)",
        "gender": "male",
        "avatar": "👴",
        "persona": "Lưu Gia Gia (Vân Kiện trầm đậm - Ông nội 68t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line3.mp3",
        "duration": 3.7,
        "hanzi": "家月、安妮，你们好！",
        "pinyin": "Jiāyuè, Ānnī, nǐmen hǎo!",
        "vietnamese": "Chào Gia Nguyệt, chào Annie nhé!"
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line4.mp3",
        "duration": 2.47,
        "hanzi": "这是送你们的礼物。",
        "pinyin": "Zhè shì sòng nǐmen de lǐwù.",
        "vietnamese": "Đây là quà chúng cháu biếu hai bác ạ."
      },
      {
        "lineIndex": 5,
        "speaker": "刘爷爷 (Ông nội Lưu)",
        "speakerName": "刘爷爷 (Ông nội Lưu)",
        "gender": "male",
        "avatar": "👴",
        "persona": "Lưu Gia Gia (Vân Kiện trầm đậm - Ông nội 68t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line5.mp3",
        "duration": 4.34,
        "hanzi": "你们太客气了，还拿这么多礼物来！",
        "pinyin": "Nǐmen tài kèqi le, hái ná zhème duō lǐwù lái!",
        "vietnamese": "Các cháu khách khí quá, lại còn mang nhiều quà đến thế này!"
      },
      {
        "lineIndex": 6,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line6.mp3",
        "duration": 3.94,
        "hanzi": "一雪姐，这是给孩子们准备的礼物。",
        "pinyin": "Yīxué jiě, zhè shì gěi háizimen zhǔnbèi de lǐwù.",
        "vietnamese": "Chị Nhất Tuyết ơi, đây là quà chúng em chuẩn bị cho các bé ạ."
      },
      {
        "lineIndex": 7,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t2_line7.mp3",
        "duration": 3.86,
        "hanzi": "谢谢！你们别客气，快坐吧！",
        "pinyin": "Xièxie! Nǐmen bié kèqi, kuài zuò ba!",
        "vietnamese": "Cảm ơn các em nhé! Các em đừng khách sáo, mau ngồi xuống đi!"
      }
    ]
  },
  "hsk2-l5-t3": {
    "id": "hsk2-l5-t3",
    "lesson": 5,
    "textIndex": 3,
    "title": "课文 3: 在王一雪家 (Bài khóa 3: Tại nhà Vương Nhất Tuyết)",
    "context": "在王一雪家，白家月和安妮在吃饭。(Tại nhà Vương Nhất Tuyết, Bạch Gia Nguyệt và Annie đang ăn cơm).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l5-t3_full.mp3",
    "totalDuration": 30.98,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.46,
        "duration": 3.46
      },
      {
        "lineIndex": 1,
        "start": 3.86,
        "end": 7.34,
        "duration": 3.48
      },
      {
        "lineIndex": 2,
        "start": 7.74,
        "end": 11.46,
        "duration": 3.72
      },
      {
        "lineIndex": 3,
        "start": 11.86,
        "end": 15.75,
        "duration": 3.89
      },
      {
        "lineIndex": 4,
        "start": 16.15,
        "end": 19.56,
        "duration": 3.41
      },
      {
        "lineIndex": 5,
        "start": 19.96,
        "end": 25.05,
        "duration": 5.09
      },
      {
        "lineIndex": 6,
        "start": 25.45,
        "end": 30.61,
        "duration": 5.16
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line0.mp3",
        "duration": 3.46,
        "hanzi": "都12点了，我们吃饭吧。",
        "pinyin": "Dōu shí'èr diǎn le, wǒmen chī fàn ba.",
        "vietnamese": "Đã 12 giờ rồi, chúng ta ăn cơm thôi nào."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line1.mp3",
        "duration": 3.48,
        "hanzi": "这么多好吃的，您太客气了！",
        "pinyin": "Zhème duō hǎochī de, nín tài kèqi le!",
        "vietnamese": "Nhiều món ngon thế này, chị chu đáo và khách sáo quá ạ!"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line2.mp3",
        "duration": 3.72,
        "hanzi": "都是我自己做的，你们多吃点儿。",
        "pinyin": "Dōu shì wǒ zìjǐ zuò de, nǐmen duō chī diǎnr.",
        "vietnamese": "Đều là chị tự tay nấu đấy, các em ăn nhiều vào nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line3.mp3",
        "duration": 3.89,
        "hanzi": "奶茶也很好喝，是您自己做的吗？",
        "pinyin": "Nǎichá yě hěn hǎohē, shì nín zìjǐ zuò de ma?",
        "vietnamese": "Trà sữa cũng ngon tuyệt, là chị tự pha đấy ạ?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line4.mp3",
        "duration": 3.41,
        "hanzi": "不是，奶茶是爷爷买的。",
        "pinyin": "Bú shì, nǎichá shì yéye mǎi de.",
        "vietnamese": "Không phải đâu, trà sữa là ông nội mua đấy."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line5.mp3",
        "duration": 5.09,
        "hanzi": "在哪儿买的？我还没喝过这么好喝的奶茶。",
        "pinyin": "Zài nǎr mǎi de? Wǒ hái méi hēguo zhème hǎohē de nǎichá.",
        "vietnamese": "Mua ở đâu vậy ạ? Em chưa từng được uống trà sữa nào ngon đến thế."
      },
      {
        "lineIndex": 6,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t3_line6.mp3",
        "duration": 5.16,
        "hanzi": "就在前边的商场，吃完饭你们可以跟我去看看。",
        "pinyin": "Jiù zài qiánbian de shāngchǎng, chīwán fàn nǐmen kěyǐ gēn wǒ qù kànkan.",
        "vietnamese": "Ngay trung tâm thương mại phía trước thôi, ăn xong các em có thể đi cùng chị ra xem."
      }
    ]
  },
  "hsk2-l5-t4": {
    "id": "hsk2-l5-t4",
    "lesson": 5,
    "textIndex": 4,
    "title": "课文 4: 在宾馆 (Bài khóa 4: Tại khách sạn)",
    "context": "在宾馆，白家月给李文发信息。(Ở khách sạn, Bạch Gia Nguyệt gửi tin nhắn cho Lý Văn).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l5-t4_full.mp3",
    "totalDuration": 14.26,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 14.26,
        "duration": 14.26
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l5-t4_line0.mp3",
        "duration": 14.26,
        "hanzi": "回国前一天，我们去一雪姐家了。到她家的时候，饭菜都做好了。刘爷爷还准备了奶茶。因为吃了太多东西，我们吃完饭是走回酒店的。",
        "pinyin": "Huí guó qián yì tiān, wǒmen qù Yīxué jiě jiā le. Dào tā jiā de shíhou, fàncài dōu zuòhǎo le. Liú yéye hái zhǔnbèile nǎichá. Yīnwèi chīle tài duō dōngxi, wǒmen chīwán fàn shì zǒuhuí jiǔdiàn de.",
        "vietnamese": "Một ngày trước khi về nước, chúng mình đã đến nhà chị Nhất Tuyết chơi. Lúc đến nhà chị ấy, cơm canh đã được nấu xong tinh tươm rồi. Ông nội Lưu còn chuẩn bị cả trà sữa nữa. Vì ăn quá nhiều đồ ngon, nên ăn cơm xong bọn mình đã đi bộ về khách sạn."
      }
    ]
  },
  "hsk2-l6-t1": {
    "id": "hsk2-l6-t1",
    "lesson": 6,
    "textIndex": 1,
    "title": "课文 1: 在家里 (Bài khóa 1: Ở nhà)",
    "context": "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l6-t1_full.mp3",
    "totalDuration": 24.83,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.93,
        "duration": 2.93
      },
      {
        "lineIndex": 1,
        "start": 3.33,
        "end": 8.95,
        "duration": 5.62
      },
      {
        "lineIndex": 2,
        "start": 9.35,
        "end": 13.45,
        "duration": 4.1
      },
      {
        "lineIndex": 3,
        "start": 13.85,
        "end": 16.18,
        "duration": 2.33
      },
      {
        "lineIndex": 4,
        "start": 16.58,
        "end": 19.39,
        "duration": 2.81
      },
      {
        "lineIndex": 5,
        "start": 19.79,
        "end": 24.52,
        "duration": 4.73
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t1_line0.mp3",
        "duration": 2.93,
        "hanzi": "明天就是女儿的生日了。",
        "pinyin": "Míngtiān jiù shì nǚ'ér de shēngrì le.",
        "vietnamese": "Ngày mai là sinh nhật con gái rồi đấy."
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t1_line1.mp3",
        "duration": 5.62,
        "hanzi": "你不说，我还真忘了。我们给她准备个什么礼物呢？",
        "pinyin": "Nǐ bù shuō, wǒ hái zhēn wàng le. Wǒmen gěi tā zhǔnbèi gè shénme lǐwù ne?",
        "vietnamese": "Em không nhắc thì anh suýt quên mất. Chúng mình chuẩn bị món quà gì cho con bé nhỉ?"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t1_line2.mp3",
        "duration": 4.1,
        "hanzi": "她喜欢画画，你觉得画笔怎么样？",
        "pinyin": "Tā xǐhuan huà huà, nǐ juéde huàbǐ zěnmeyàng?",
        "vietnamese": "Con thích vẽ tranh, anh thấy tặng bút vẽ được không?"
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t1_line3.mp3",
        "duration": 2.33,
        "hanzi": "就送画笔吧！",
        "pinyin": "Jiù sòng huàbǐ ba!",
        "vietnamese": "Tặng bút vẽ đi em!"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t1_line4.mp3",
        "duration": 2.81,
        "hanzi": "那我明天上午就去买。",
        "pinyin": "Nà wǒ míngtiān shàngwǔ jiù qù mǎi.",
        "vietnamese": "Thế sáng mai em sẽ đi mua."
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t1_line5.mp3",
        "duration": 4.73,
        "hanzi": "好的！我再给她买个大大的生日蛋糕。",
        "pinyin": "Hǎo de! Wǒ zài gěi tā mǎi gè dàdà de shēngrì dàngāo.",
        "vietnamese": "Được rồi! Anh sẽ mua thêm cho con một chiếc bánh sinh nhật thật to."
      }
    ]
  },
  "hsk2-l6-t2": {
    "id": "hsk2-l6-t2",
    "lesson": 6,
    "textIndex": 2,
    "title": "课文 2: 在客厅 (Bài khóa 2: Ở phòng khách)",
    "context": "在客厅，刘明一家人在聊天儿。(Ở phòng khách, cả nhà Lưu Minh trò chuyện mở quà).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l6-t2_full.mp3",
    "totalDuration": 31.9,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.81,
        "duration": 2.81
      },
      {
        "lineIndex": 1,
        "start": 3.21,
        "end": 5.85,
        "duration": 2.64
      },
      {
        "lineIndex": 2,
        "start": 6.25,
        "end": 10.4,
        "duration": 4.15
      },
      {
        "lineIndex": 3,
        "start": 10.8,
        "end": 13.87,
        "duration": 3.07
      },
      {
        "lineIndex": 4,
        "start": 14.27,
        "end": 16.96,
        "duration": 2.69
      },
      {
        "lineIndex": 5,
        "start": 17.36,
        "end": 19.78,
        "duration": 2.42
      },
      {
        "lineIndex": 6,
        "start": 20.18,
        "end": 27.26,
        "duration": 7.08
      },
      {
        "lineIndex": 7,
        "start": 27.66,
        "end": 31.45,
        "duration": 3.79
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line0.mp3",
        "duration": 2.81,
        "hanzi": "小雪，生日快乐！",
        "pinyin": "Xiǎoxuě, shēngrì kuàilè!",
        "vietnamese": "Tiểu Tuyết, sinh nhật vui vẻ con nhé!"
      },
      {
        "lineIndex": 1,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line1.mp3",
        "duration": 2.64,
        "hanzi": "姐姐，生日快乐！",
        "pinyin": "Jiějie, shēngrì kuàilè!",
        "vietnamese": "Chị ơi, chúc mừng sinh nhật chị!"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line2.mp3",
        "duration": 4.15,
        "hanzi": "小雪，这是爸爸、妈妈送你的礼物。",
        "pinyin": "Xiǎoxuě, zhè shì bàba, māma sòng nǐ de lǐwù.",
        "vietnamese": "Tiểu Tuyết, đây là quà bố mẹ tặng con."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line3.mp3",
        "duration": 3.07,
        "hanzi": "你打开看看喜欢不喜欢。",
        "pinyin": "Nǐ dǎkāi kànkan xǐhuan bù xǐhuan.",
        "vietnamese": "Con mở ra xem có thích không nào."
      },
      {
        "lineIndex": 4,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line4.mp3",
        "duration": 2.69,
        "hanzi": "画笔！我很喜欢！",
        "pinyin": "Huàbǐ! Wǒ hěn xǐhuan!",
        "vietnamese": "Bút vẽ màu! Con thích lắm ạ!"
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line5.mp3",
        "duration": 2.42,
        "hanzi": "那你想画点儿什么？",
        "pinyin": "Nà nǐ xiǎng huà diǎnr shénme?",
        "vietnamese": "Thế con muốn vẽ gì nào?"
      },
      {
        "lineIndex": 6,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line6.mp3",
        "duration": 7.08,
        "hanzi": "画我们的家！有爸爸、妈妈、弟弟，还有黑色的狗、白色的猫什么的。",
        "pinyin": "Huà wǒmen de jiā! Yǒu bàba, māma, dìdi, hái yǒu hēisè de gǒu, báisè de māo shénmede.",
        "vietnamese": "Vẽ ngôi nhà của chúng mình ạ! Có bố, mẹ, em trai, và cả chú chó đen, chú mèo trắng nữa."
      },
      {
        "lineIndex": 7,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t2_line7.mp3",
        "duration": 3.79,
        "hanzi": "那我要画一个穿白色衣服的姐姐。",
        "pinyin": "Nà wǒ yào huà yí gè chuān báisè yīfu de jiějie.",
        "vietnamese": "Thế em muốn vẽ chị gái mặc chiếc áo màu trắng."
      }
    ]
  },
  "hsk2-l6-t3": {
    "id": "hsk2-l6-t3",
    "lesson": 6,
    "textIndex": 3,
    "title": "课文 3: 在客厅 (Bài khóa 3: Ở phòng khách)",
    "context": "在客厅，刘明一家人在给刘小雪过生日。(Ở phòng khách, cả nhà Lưu Minh chúc mừng sinh nhật Lưu Tiểu Tuyết).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l6-t3_full.mp3",
    "totalDuration": 30.52,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.62,
        "duration": 3.62
      },
      {
        "lineIndex": 1,
        "start": 4.02,
        "end": 7.14,
        "duration": 3.12
      },
      {
        "lineIndex": 2,
        "start": 7.54,
        "end": 12.36,
        "duration": 4.82
      },
      {
        "lineIndex": 3,
        "start": 12.76,
        "end": 15.18,
        "duration": 2.42
      },
      {
        "lineIndex": 4,
        "start": 15.58,
        "end": 20.98,
        "duration": 5.4
      },
      {
        "lineIndex": 5,
        "start": 21.38,
        "end": 23.52,
        "duration": 2.14
      },
      {
        "lineIndex": 6,
        "start": 23.92,
        "end": 30.14,
        "duration": 6.22
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line0.mp3",
        "duration": 3.62,
        "hanzi": "小雪，看看今天有什么好吃的。",
        "pinyin": "Xiǎoxuě, kànkan jīntiān yǒu shénme hǎochī de.",
        "vietnamese": "Tiểu Tuyết, xem hôm nay có món gì ngon nào."
      },
      {
        "lineIndex": 1,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line1.mp3",
        "duration": 3.12,
        "hanzi": "长长的面条儿，大大的蛋糕。",
        "pinyin": "Chángcháng de miàntiáor, dàdà de dàngāo.",
        "vietnamese": "Bát mì trường thọ thật dài, chiếc bánh kem thật to."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line2.mp3",
        "duration": 4.82,
        "hanzi": "你看，还有鱼啊肉啊什么的，都是你喜欢吃的。",
        "pinyin": "Nǐ kàn, hái yǒu yú a ròu a shénmede, dōu shì nǐ xǐhuan chī de.",
        "vietnamese": "Con xem, còn có cả cá cả thịt này, đều là món con thích ăn nhất."
      },
      {
        "lineIndex": 3,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line3.mp3",
        "duration": 2.42,
        "hanzi": "谢谢爸爸、妈妈！",
        "pinyin": "Xièxie bàba, māma!",
        "vietnamese": "Con cảm ơn bố, cảm ơn mẹ!"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line4.mp3",
        "duration": 5.4,
        "hanzi": "快去叫弟弟过来吃饭吧，吃完饭我们还要出去玩呢。",
        "pinyin": "Kuài qù jiào dìdi guòlái chī fàn ba, chīwán fàn wǒmen hái yào chūqù wán ne.",
        "vietnamese": "Con mau gọi em trai qua ăn cơm đi, ăn xong cả nhà mình còn đi chơi nữa đấy."
      },
      {
        "lineIndex": 5,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line5.mp3",
        "duration": 2.14,
        "hanzi": "过生日真好啊！",
        "pinyin": "Guò shēngrì zhēn hǎo a!",
        "vietnamese": "Được đón sinh nhật thích thật đấy ạ!"
      },
      {
        "lineIndex": 6,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t3_line6.mp3",
        "duration": 6.22,
        "hanzi": "是的，过生日就要吃好吃的，还要高高兴兴地玩。",
        "pinyin": "Shì de, guò shēngrì jiù yào chī hǎochī de, hái yào gāogāoxìngxìng de wán.",
        "vietnamese": "Đúng vậy, sinh nhật là phải ăn món ngon, và phải vui chơi thật là thỏa thích."
      }
    ]
  },
  "hsk2-l6-t4": {
    "id": "hsk2-l6-t4",
    "lesson": 6,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
    "context": "在房间，王一雪在写日记。(Trong phòng ngủ, Vương Nhất Tuyết viết nhật ký).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l6-t4_full.mp3",
    "totalDuration": 26.28,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 26.28,
        "duration": 26.28
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l6-t4_line0.mp3",
        "duration": 26.28,
        "hanzi": "今天是女儿的生日。我们买了蛋糕，做了面条儿，还做了鱼啊肉啊什么的。吃完晚饭，一家人去看了个电影。回家后，孩子们早早地就上床了。明天不上学，他们说要舒舒服服地睡一觉，让我们晚点儿叫他们起床。这是很忙、很累，但很快乐的一天。",
        "pinyin": "Jīntiān shì nǚ'ér de shēngrì. Wǒmen mǎile dàngāo, zuòle miàntiáor, hái zuòle yú a ròu a shénmede. Chīwán wǎnfàn, yì jiā rén qù kànle gè diànyǐng. Huí jiā hòu, háizimen zǎozǎo de jiù shàng chuáng le. Míngtiān bú shàngxué, tāmen shuō yào shūshūfúfú de shuì yí jiào, ràng wǒmen wǎn diǎnr jiào tāmen qǐchuáng. Zhè shì hěn máng, hěn lèi, dàn hěn kuàilè de yì tiān.",
        "vietnamese": "Hôm nay là sinh nhật của con gái. Bố mẹ đã mua bánh kem, nấu mì, lại còn làm cả cá và thịt nữa. Ăn tối xong, cả nhà cùng nhau đi xem một bộ phim. Về đến nhà, bọn trẻ đã lên giường đi ngủ từ rất sớm. Ngày mai không phải đi học, chúng bảo muốn ngủ một giấc thật thoải mái, dặn bố mẹ hãy gọi chúng dậy muộn một chút. Đây quả là một ngày bận rộn, thấm mệt, nhưng ngập tràn niềm vui."
      }
    ]
  },
  "hsk2-l7-t1": {
    "id": "hsk2-l7-t1",
    "lesson": 7,
    "textIndex": 1,
    "title": "课文 1: 在教室 (Bài khóa 1: Ở trong lớp học)",
    "context": "在教室，安妮和陈天中在聊天儿。(Trong lớp học, Annie và Trần Thiên Trung trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l7-t1_full.mp3",
    "totalDuration": 17.24,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.19,
        "duration": 3.19
      },
      {
        "lineIndex": 1,
        "start": 3.59,
        "end": 8.34,
        "duration": 4.75
      },
      {
        "lineIndex": 2,
        "start": 8.74,
        "end": 11.88,
        "duration": 3.14
      },
      {
        "lineIndex": 3,
        "start": 12.28,
        "end": 14.66,
        "duration": 2.38
      },
      {
        "lineIndex": 4,
        "start": 15.06,
        "end": 16.98,
        "duration": 1.92
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t1_line0.mp3",
        "duration": 3.19,
        "hanzi": "安妮，你是什么时候从北京回来的？",
        "pinyin": "Ānnī, nǐ shì shénme shíhou cóng Běijīng huílái de?",
        "vietnamese": "Annie, cậu từ Bắc Kinh về lúc nào thế?"
      },
      {
        "lineIndex": 1,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t1_line1.mp3",
        "duration": 4.75,
        "hanzi": "昨天下午。天中，你怎么一下课就往外跑？",
        "pinyin": "Zuótiān xiàwǔ. Tiānzhōng, nǐ zěnme yí xiàkè jiù wǎng wài pǎo?",
        "vietnamese": "Chiều hôm qua. Thiên Trung, sao cậu vừa tan học là chạy tót ra ngoài thế?"
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t1_line2.mp3",
        "duration": 3.14,
        "hanzi": "我跟同学说好了，一起去打篮球。",
        "pinyin": "Wǒ gēn tóngxué shuōhǎo le, yìqǐ qù dǎ lánqiú.",
        "vietnamese": "Tớ hẹn với các bạn cùng lớp rồi, cùng nhau đi chơi bóng rổ."
      },
      {
        "lineIndex": 3,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t1_line3.mp3",
        "duration": 2.38,
        "hanzi": "我也想跟你们一起玩。",
        "pinyin": "Wǒ yě xiǎng gēn nǐmen yìqǐ wán.",
        "vietnamese": "Tớ cũng muốn đi chơi cùng các cậu."
      },
      {
        "lineIndex": 4,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t1_line4.mp3",
        "duration": 1.92,
        "hanzi": "没问题，走吧。",
        "pinyin": "Méi wèntí, zǒu ba.",
        "vietnamese": "Không vấn đề gì, đi thôi nào."
      }
    ]
  },
  "hsk2-l7-t2": {
    "id": "hsk2-l7-t2",
    "lesson": 7,
    "textIndex": 2,
    "title": "课文 2: 在校园 (Bài khóa 2: Trong khuôn viên trường)",
    "context": "在校园，安妮和陈天中边走边聊。(Trong khuôn viên trường, Annie và Trần Thiên Trung vừa đi vừa trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l7-t2_full.mp3",
    "totalDuration": 18.23,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.46,
        "duration": 3.46
      },
      {
        "lineIndex": 1,
        "start": 3.86,
        "end": 5.73,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 6.13,
        "end": 8.46,
        "duration": 2.33
      },
      {
        "lineIndex": 3,
        "start": 8.86,
        "end": 13.37,
        "duration": 4.51
      },
      {
        "lineIndex": 4,
        "start": 13.77,
        "end": 15.64,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 16.04,
        "end": 17.91,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t2_line0.mp3",
        "duration": 3.46,
        "hanzi": "天中，你是不是很喜欢打篮球？",
        "pinyin": "Tiānzhōng, nǐ shì bu shì hěn xǐhuan dǎ lánqiú?",
        "vietnamese": "Thiên Trung, có phải cậu thích chơi bóng rổ lắm đúng không?"
      },
      {
        "lineIndex": 1,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t2_line1.mp3",
        "duration": 1.87,
        "hanzi": "没错。",
        "pinyin": "Méi cuò.",
        "vietnamese": "Đúng thế đấy."
      },
      {
        "lineIndex": 2,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t2_line2.mp3",
        "duration": 2.33,
        "hanzi": "你还喜欢什么运动？",
        "pinyin": "Nǐ hái xǐhuan shénme yùndòng?",
        "vietnamese": "Cậu còn thích môn thể thao nào nữa?"
      },
      {
        "lineIndex": 3,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t2_line3.mp3",
        "duration": 4.51,
        "hanzi": "我还喜欢踢足球，一到星期天就跟朋友们去踢球。",
        "pinyin": "Wǒ hái xǐhuan tī zúqiú, yí dào Xīngqītiān jiù gēn péngyoumen qù tī qiú.",
        "vietnamese": "Tớ còn thích đá bóng nữa, cứ hễ đến chủ nhật là đi đá bóng với bạn bè."
      },
      {
        "lineIndex": 4,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t2_line4.mp3",
        "duration": 1.87,
        "hanzi": "你踢得怎么样？",
        "pinyin": "Nǐ tī de zěnmeyàng?",
        "vietnamese": "Cậu đá bóng thế nào?"
      },
      {
        "lineIndex": 5,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t2_line5.mp3",
        "duration": 1.87,
        "hanzi": "我踢得还可以。",
        "pinyin": "Wǒ tī de hái kěyǐ.",
        "vietnamese": "Tớ đá cũng tạm ổn."
      }
    ]
  },
  "hsk2-l7-t3": {
    "id": "hsk2-l7-t3",
    "lesson": 7,
    "textIndex": 3,
    "title": "课文 3: 在校园 (Bài khóa 3: Trong khuôn viên trường)",
    "context": "在校园，安妮和陈天中边走边聊。(Trong khuôn viên trường, Annie và Trần Thiên Trung vừa đi vừa trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l7-t3_full.mp3",
    "totalDuration": 17.51,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.92,
        "duration": 1.92
      },
      {
        "lineIndex": 1,
        "start": 2.32,
        "end": 4.26,
        "duration": 1.94
      },
      {
        "lineIndex": 2,
        "start": 4.66,
        "end": 7.64,
        "duration": 2.98
      },
      {
        "lineIndex": 3,
        "start": 8.04,
        "end": 11.35,
        "duration": 3.31
      },
      {
        "lineIndex": 4,
        "start": 11.75,
        "end": 13.72,
        "duration": 1.97
      },
      {
        "lineIndex": 5,
        "start": 14.12,
        "end": 17.19,
        "duration": 3.07
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t3_line0.mp3",
        "duration": 1.92,
        "hanzi": "你篮球打得怎么样？",
        "pinyin": "Nǐ lánqiú dǎ de zěnmeyàng?",
        "vietnamese": "Cậu chơi bóng rổ thế nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t3_line1.mp3",
        "duration": 1.94,
        "hanzi": "打得还可以。",
        "pinyin": "Dǎ de hái kěyǐ.",
        "vietnamese": "Chơi cũng tạm được."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t3_line2.mp3",
        "duration": 2.98,
        "hanzi": "跑步呢？你跑得快不快？",
        "pinyin": "Pǎobù ne? Nǐ pǎo de kuài bu kuài?",
        "vietnamese": "Thế còn chạy bộ? Cậu chạy có nhanh không?"
      },
      {
        "lineIndex": 3,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t3_line3.mp3",
        "duration": 3.31,
        "hanzi": "我跑得不快，也不太喜欢跑步。",
        "pinyin": "Wǒ pǎo de bú kuài, yě bú tài xǐhuan pǎobù.",
        "vietnamese": "Tớ chạy không nhanh, cũng chẳng thích chạy bộ lắm."
      },
      {
        "lineIndex": 4,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t3_line4.mp3",
        "duration": 1.97,
        "hanzi": "那你喜欢游泳吗？",
        "pinyin": "Nà nǐ xǐhuan yóuyǒng ma?",
        "vietnamese": "Thế cậu có thích bơi lội không?"
      },
      {
        "lineIndex": 5,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t3_line5.mp3",
        "duration": 3.07,
        "hanzi": "喜欢，但我游泳游得不快。",
        "pinyin": "Xǐhuan, dàn wǒ yóuyǒng yóu de bú kuài.",
        "vietnamese": "Thích chứ, nhưng tớ bơi không được nhanh."
      }
    ]
  },
  "hsk2-l7-t4": {
    "id": "hsk2-l7-t4",
    "lesson": 7,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng ký túc xá)",
    "context": "在房间，陈天中在写日记。(Trong phòng, Trần Thiên Trung viết nhật ký).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l7-t4_full.mp3",
    "totalDuration": 13.15,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 13.15,
        "duration": 13.15
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l7-t4_line0.mp3",
        "duration": 13.15,
        "hanzi": "我的爱好是运动。从上小学开始，我每天都跟爸爸去运动。现在我篮球打得很好，足球踢得不错，游泳游得也很快。我一有时间就去运动。",
        "pinyin": "Wǒ de àihào shì yùndòng. Cóng shàng xiǎoxué kāishǐ, wǒ měi tiān dōu gēn bàba qù yùndòng. Xiànzài wǒ lánqiú dǎ de hěn hǎo, zúqiú tī de búcuò, yóuyǒng yóu de yě hěn kuài. Wǒ yí yǒu shíjiān jiù qù yùndòng.",
        "vietnamese": "Sở thích của tôi là thể thao. Từ khi bắt đầu học tiểu học, ngày nào tôi cũng cùng bố đi rèn luyện thân thể. Hiện giờ tôi chơi bóng rổ rất cừ, đá bóng khá cừ, bơi cũng rất nhanh. Hễ có thời gian rảnh là tôi lại đi chơi thể thao."
      }
    ]
  },
  "hsk2-l8-t1": {
    "id": "hsk2-l8-t1",
    "lesson": 8,
    "textIndex": 1,
    "title": "课文 1: 在商场 (Bài khóa 1: Ở trung tâm thương mại)",
    "context": "在商场，王一雪和刘明在购物。(Ở trung tâm thương mại, Vương Nhất Tuyết và Lưu Minh đang mua sắm).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l8-t1_full.mp3",
    "totalDuration": 19.24,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.07,
        "duration": 3.07
      },
      {
        "lineIndex": 1,
        "start": 3.47,
        "end": 5.34,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 5.74,
        "end": 8.33,
        "duration": 2.59
      },
      {
        "lineIndex": 3,
        "start": 8.73,
        "end": 12.38,
        "duration": 3.65
      },
      {
        "lineIndex": 4,
        "start": 12.78,
        "end": 15.06,
        "duration": 2.28
      },
      {
        "lineIndex": 5,
        "start": 15.46,
        "end": 18.92,
        "duration": 3.46
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t1_line0.mp3",
        "duration": 3.07,
        "hanzi": "你看，这两块手表怎么样？",
        "pinyin": "Nǐ kàn, zhè liǎng kuài shǒubiǎo zěnmeyàng?",
        "vietnamese": "Anh nhìn xem, hai chiếc đồng hồ này thế nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t1_line1.mp3",
        "duration": 1.87,
        "hanzi": "都不错！",
        "pinyin": "Dōu búcuò!",
        "vietnamese": "Đều đẹp cả!"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t1_line2.mp3",
        "duration": 2.59,
        "hanzi": "我喜欢左边这个。",
        "pinyin": "Wǒ xǐhuan zuǒbian zhège.",
        "vietnamese": "Em thích cái bên trái này."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t1_line3.mp3",
        "duration": 3.65,
        "hanzi": "我也觉得左边的比右边的好看。",
        "pinyin": "Wǒ yě juéde zuǒbian de bǐ yòubian de hǎokàn.",
        "vietnamese": "Anh cũng thấy cái bên trái đẹp hơn cái bên phải."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t1_line4.mp3",
        "duration": 2.28,
        "hanzi": "你看看要多少钱！",
        "pinyin": "Nǐ kànkan yào duōshao qián!",
        "vietnamese": "Anh xem thử giá bao nhiêu tiền kìa!"
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t1_line5.mp3",
        "duration": 3.46,
        "hanzi": "真不便宜！八千八！",
        "pinyin": "Zhēn bù piányi! Bā qiān bā!",
        "vietnamese": "Thật chẳng rẻ chút nào! Tận tám nghìn tám trăm tệ!"
      }
    ]
  },
  "hsk2-l8-t2": {
    "id": "hsk2-l8-t2",
    "lesson": 8,
    "textIndex": 2,
    "title": "课文 2: 在电影院外 (Bài khóa 2: Ngoài rạp chiếu phim)",
    "context": "在电影院外，刘明和王一雪在商量看电影。(Trước rạp chiếu phim, Lưu Minh và Vương Nhất Tuyết bàn nhau xem phim gì).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l8-t2_full.mp3",
    "totalDuration": 28.74,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.72,
        "duration": 3.72
      },
      {
        "lineIndex": 1,
        "start": 4.12,
        "end": 7.24,
        "duration": 3.12
      },
      {
        "lineIndex": 2,
        "start": 7.64,
        "end": 13.26,
        "duration": 5.62
      },
      {
        "lineIndex": 3,
        "start": 13.66,
        "end": 20.38,
        "duration": 6.72
      },
      {
        "lineIndex": 4,
        "start": 20.78,
        "end": 23.73,
        "duration": 2.95
      },
      {
        "lineIndex": 5,
        "start": 24.13,
        "end": 28.43,
        "duration": 4.3
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t2_line0.mp3",
        "duration": 3.72,
        "hanzi": "今天有不少电影，我们看个电影吧。",
        "pinyin": "Jīntiān yǒu bù shǎo diànyǐng, wǒmen kàn gè diànyǐng ba.",
        "vietnamese": "Hôm nay có khá nhiều phim, chúng ta xem một bộ phim đi."
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t2_line1.mp3",
        "duration": 3.12,
        "hanzi": "好啊！我们看哪个？",
        "pinyin": "Hǎo a! Wǒmen kàn nǎge?",
        "vietnamese": "Được thôi! Mình xem phim nào đây anh?"
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t2_line2.mp3",
        "duration": 5.62,
        "hanzi": "我记得你喜欢看爱情片，我们看那个爱情片，怎么样？",
        "pinyin": "Wǒ jìde nǐ xǐhuan kàn àiqíngpiān, wǒmen kàn nàge àiqíngpiān, zěnmeyàng?",
        "vietnamese": "Anh nhớ em thích xem phim tình cảm, chúng ta xem bộ phim tình cảm kia thế nào?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t2_line3.mp3",
        "duration": 6.72,
        "hanzi": "还是看这个吧，我看网上说这个电影比那个爱情片更有意思。",
        "pinyin": "Háishi kàn zhège ba, wǒ kàn wǎngshang shuō zhège diànyǐng bǐ nàge àiqíngpiān gèng yǒu yìsi.",
        "vietnamese": "Hay là xem phim này đi, em thấy trên mạng bảo phim này hay hơn phim tình cảm kia đấy."
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t2_line4.mp3",
        "duration": 2.95,
        "hanzi": "好。我去买票。",
        "pinyin": "Hǎo. Wǒ qù mǎi piào.",
        "vietnamese": "Được, để anh đi mua vé."
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t2_line5.mp3",
        "duration": 4.3,
        "hanzi": "到网上买吧，网上买比在这里买便宜。",
        "pinyin": "Dào wǎngshang mǎi ba, wǎngshang mǎi bǐ zài zhèlǐ mǎi piányi.",
        "vietnamese": "Lên mạng mua đi anh, mua trên mạng rẻ hơn mua ở đây đấy."
      }
    ]
  },
  "hsk2-l8-t3": {
    "id": "hsk2-l8-t3",
    "lesson": 8,
    "textIndex": 3,
    "title": "课文 3: 在饭馆 (Bài khóa 3: Ở nhà hàng)",
    "context": "在饭馆，刘明给王一雪庆祝生日。(Ở nhà hàng ấm cúng, Lưu Minh bất ngờ tặng đồng hồ chúc mừng sinh nhật Vương Nhất Tuyết).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l8-t3_full.mp3",
    "totalDuration": 35.66,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.37,
        "duration": 4.37
      },
      {
        "lineIndex": 1,
        "start": 4.77,
        "end": 7.27,
        "duration": 2.5
      },
      {
        "lineIndex": 2,
        "start": 7.67,
        "end": 11.13,
        "duration": 3.46
      },
      {
        "lineIndex": 3,
        "start": 11.53,
        "end": 15.95,
        "duration": 4.42
      },
      {
        "lineIndex": 4,
        "start": 16.35,
        "end": 23.14,
        "duration": 6.79
      },
      {
        "lineIndex": 5,
        "start": 23.54,
        "end": 30.07,
        "duration": 6.53
      },
      {
        "lineIndex": 6,
        "start": 30.47,
        "end": 35.29,
        "duration": 4.82
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line0.mp3",
        "duration": 4.37,
        "hanzi": "您好！就要这几个菜吧，谢谢！",
        "pinyin": "Nínhǎo! Jiù yào zhè jǐ gè cài ba, xièxie!",
        "vietnamese": "Chào anh/chị! Chúng tôi lấy mấy món này nhé, cảm ơn!"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line1.mp3",
        "duration": 2.5,
        "hanzi": "怎么点这么多菜？",
        "pinyin": "Zěnme diǎn zhème duō cài?",
        "vietnamese": "Sao anh lại gọi nhiều món thế này?"
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line2.mp3",
        "duration": 3.46,
        "hanzi": "你想想，今天是几月几号？",
        "pinyin": "Nǐ xiǎngxiang, jīntiān shì jǐ yuè jǐ hào?",
        "vietnamese": "Em nghĩ xem, hôm nay là ngày mấy tháng mấy nào?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line3.mp3",
        "duration": 4.42,
        "hanzi": "8月27号。啊！我的生日！",
        "pinyin": "Bā yuè èrshíqī hào. À! Wǒ de shēngrì!",
        "vietnamese": "Ngày 27 tháng 8. A! Sinh nhật của em!"
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line4.mp3",
        "duration": 6.79,
        "hanzi": "生日快乐！虽然你忘了，但是我记得。看看这是什么？",
        "pinyin": "Shēngrì kuàilè! Suīrán nǐ wàng le, dànshì wǒ jìde. Kànkan zhè shì shénme?",
        "vietnamese": "Sinh nhật vui vẻ em nhé! Tuy em quên rồi, nhưng anh vẫn luôn nhớ. Em xem đây là cái gì này?"
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line5.mp3",
        "duration": 6.53,
        "hanzi": "手表！吃饭、看电影、买手表，今天花了不少钱吧？",
        "pinyin": "Shǒubiǎo! Chī fàn, kàn diànyǐng, mǎi shǒubiǎo, jīntiān huāle bù shǎo qián ba?",
        "vietnamese": "Đồng hồ đeo tay! Ăn cơm, xem phim, lại còn mua đồng hồ, hôm nay tiêu tốn không ít tiền rồi nhỉ anh?"
      },
      {
        "lineIndex": 6,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t3_line6.mp3",
        "duration": 4.82,
        "hanzi": "虽然花了一些钱，但是我们过了一个快乐的生日。",
        "pinyin": "Suīrán huāle yìxiē qián, dànshì wǒmen guòle yí gè kuàilè de shēngrì.",
        "vietnamese": "Tuy tốn một chút tiền, nhưng chúng ta đã đón một ngày sinh nhật thật hạnh phúc."
      }
    ]
  },
  "hsk2-l8-t4": {
    "id": "hsk2-l8-t4",
    "lesson": 8,
    "textIndex": 4,
    "title": "课文 4: 小语讲述 (Bài khóa 4: Tiểu Ngữ kể chuyện)",
    "context": "小语在讲述王一雪和刘明的一天。(Trợ lý Tiểu Ngữ kể lại một ngày đầy bất ngờ và ấm áp của vợ chồng Lưu Minh - Vương Nhất Tuyết).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l8-t4_full.mp3",
    "totalDuration": 14.09,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 14.09,
        "duration": 14.09
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "小语 (Trợ lý AI Tiểu Ngữ)",
        "speakerName": "小语 (Trợ lý AI Tiểu Ngữ)",
        "gender": "female",
        "avatar": "🤖",
        "persona": "Trợ lý ảo AI Tiểu Ngữ",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l8-t4_line0.mp3",
        "duration": 14.09,
        "hanzi": "虽然妻子忘了今天是自己的生日，但是丈夫记得。丈夫请妻子去饭馆吃饭、去电影院看电影，还给妻子买了一块非常漂亮的手表。妻子觉得今天很快乐。",
        "pinyin": "Suīrán qīzi wàngle jīntiān shì zìjǐ de shēngrì, dànshì zhàngfu jìde. Zhàngfu qǐng qīzi qù fànguǎn chī fàn, qù diànyǐngyuàn kàn diànyǐng, hái gěi qīzi mǎile yí kuài fēicháng piàoliang de shǒubiǎo. Qīzi juéde jīntiān hěn kuàilè.",
        "vietnamese": "Tuy người vợ quên mất hôm nay là sinh nhật mình, nhưng người chồng vẫn nhớ. Chồng mời vợ đi nhà hàng ăn cơm, đi rạp chiếu phim xem phim, lại còn mua tặng vợ một chiếc đồng hồ đeo tay rất đẹp. Người vợ cảm thấy hôm nay vô cùng vui vẻ và hạnh phúc."
      }
    ]
  },
  "hsk2-l9-t1": {
    "id": "hsk2-l9-t1",
    "lesson": 9,
    "textIndex": 1,
    "title": "课文 1: 在商店 (Bài khóa 1: Ở cửa hàng quần áo)",
    "context": "在商店，王一雪和刘明在看裤子。(Trong cửa hàng, Vương Nhất Tuyết và Lưu Minh đang xem quần cho con trai).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l9-t1_full.mp3",
    "totalDuration": 29.71,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.61,
        "duration": 4.61
      },
      {
        "lineIndex": 1,
        "start": 5.01,
        "end": 6.88,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 7.28,
        "end": 10.26,
        "duration": 2.98
      },
      {
        "lineIndex": 3,
        "start": 10.66,
        "end": 13.83,
        "duration": 3.17
      },
      {
        "lineIndex": 4,
        "start": 14.23,
        "end": 20.35,
        "duration": 6.12
      },
      {
        "lineIndex": 5,
        "start": 20.75,
        "end": 25.79,
        "duration": 5.04
      },
      {
        "lineIndex": 6,
        "start": 26.19,
        "end": 29.33,
        "duration": 3.14
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line0.mp3",
        "duration": 4.61,
        "hanzi": "儿子的裤子坏了，我们给他买条新的吧。",
        "pinyin": "Érzi de kùzi huài le, wǒmen gěi tā mǎi tiáo xīn de ba.",
        "vietnamese": "Quần của con trai bị rách rồi, chúng ta mua cho con một chiếc mới nhé."
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line1.mp3",
        "duration": 1.87,
        "hanzi": "好啊。",
        "pinyin": "Hǎo a.",
        "vietnamese": "Được thôi."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line2.mp3",
        "duration": 2.98,
        "hanzi": "你看这条黑色的怎么样？",
        "pinyin": "Nǐ kàn zhè tiáo hēisè de zěnmeyàng?",
        "vietnamese": "Anh nhìn chiếc màu đen này thế nào?"
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line3.mp3",
        "duration": 3.17,
        "hanzi": "没有你上次买的那条好看。",
        "pinyin": "Méiyǒu nǐ shàngcì mǎi de nà tiáo hǎokàn.",
        "vietnamese": "Không đẹp bằng chiếc lần trước em mua đâu."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line4.mp3",
        "duration": 6.12,
        "hanzi": "旁边那个男孩儿就穿了这样的裤子，我觉得很好看啊！",
        "pinyin": "Pángbiān nàge nánháir jiù chuānle zhèyàng de kùzi, wǒ juéde hěn hǎokàn a!",
        "vietnamese": "Cậu bé bên cạnh đang mặc chiếc quần như thế này này, em thấy rất đẹp mà!"
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line5.mp3",
        "duration": 5.04,
        "hanzi": "儿子的个子没有他那么高，穿上就不会太好看。",
        "pinyin": "Érzi de gèzi méiyǒu tā nàme gāo, chuānshang jiù bú huì tài hǎokàn.",
        "vietnamese": "Vóc dáng con trai mình không cao bằng cậu ấy, mặc vào sẽ không được đẹp lắm."
      },
      {
        "lineIndex": 6,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t1_line6.mp3",
        "duration": 3.14,
        "hanzi": "好吧，我们再去那边看看。",
        "pinyin": "Hǎo ba, wǒmen zài qù nàbiān kànkan.",
        "vietnamese": "Thôi được, chúng mình sang bên kia xem thử tiếp nhé."
      }
    ]
  },
  "hsk2-l9-t2": {
    "id": "hsk2-l9-t2",
    "lesson": 9,
    "textIndex": 2,
    "title": "课文 2: 在商店门口 (Bài khóa 2: Trước cửa tiệm)",
    "context": "在商店门口，王一雪和刘明往外走。(Trước cửa tiệm, Vương Nhất Tuyết và Lưu Minh vừa bước ra ngoài vừa trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l9-t2_full.mp3",
    "totalDuration": 27.12,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.68,
        "duration": 4.68
      },
      {
        "lineIndex": 1,
        "start": 5.08,
        "end": 8.54,
        "duration": 3.46
      },
      {
        "lineIndex": 2,
        "start": 8.94,
        "end": 11.56,
        "duration": 2.62
      },
      {
        "lineIndex": 3,
        "start": 11.96,
        "end": 15.68,
        "duration": 3.72
      },
      {
        "lineIndex": 4,
        "start": 16.08,
        "end": 19.68,
        "duration": 3.6
      },
      {
        "lineIndex": 5,
        "start": 20.08,
        "end": 22.55,
        "duration": 2.47
      },
      {
        "lineIndex": 6,
        "start": 22.95,
        "end": 26.74,
        "duration": 3.79
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line0.mp3",
        "duration": 4.68,
        "hanzi": "门口有家奶茶店。你想喝杯奶茶吗？",
        "pinyin": "Ménkǒu yǒu jiā nǎichádiàn. Nǐ xiǎng hē bēi nǎichá ma?",
        "vietnamese": "Trước cổng có một quán trà sữa. Anh có muốn uống một ly trà sữa không?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line1.mp3",
        "duration": 3.46,
        "hanzi": "我想喝咖啡，还是去咖啡店吧。",
        "pinyin": "Wǒ xiǎng hē kāfēi, háishi qù kāfēidiàn ba.",
        "vietnamese": "Anh muốn uống cà phê hơn, hay là đến quán cà phê đi."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line2.mp3",
        "duration": 2.62,
        "hanzi": "咖啡店离这儿有点儿远。",
        "pinyin": "Kāfēidiàn lí zhèr yǒudiǎnr yuǎn.",
        "vietnamese": "Quán cà phê cách đây hơi xa đấy."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line3.mp3",
        "duration": 3.72,
        "hanzi": "没关系，那家店的咖啡很好喝。",
        "pinyin": "Méi guānxi, nà jiā diàn de kāfēi hěn hǎohē.",
        "vietnamese": "Không sao, cà phê ở quán đó ngon lắm."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line4.mp3",
        "duration": 3.6,
        "hanzi": "那你等一下，我去买杯奶茶。",
        "pinyin": "Nà nǐ děng yíxià, wǒ qù mǎi bēi nǎichá.",
        "vietnamese": "Vậy anh đợi em một chút, em đi mua ly trà sữa nhé."
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line5.mp3",
        "duration": 2.47,
        "hanzi": "你不想喝咖啡吗？",
        "pinyin": "Nǐ bù xiǎng hē kāfēi ma?",
        "vietnamese": "Em không muốn uống cà phê à?"
      },
      {
        "lineIndex": 6,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t2_line6.mp3",
        "duration": 3.79,
        "hanzi": "喝了咖啡，晚上就别想睡觉了。",
        "pinyin": "Hēle kāfēi, wǎnshang jiù bié xiǎng shuìjiào le.",
        "vietnamese": "Uống cà phê vào thì tối nay khỏi nghĩ đến chuyện ngủ luôn."
      }
    ]
  },
  "hsk2-l9-t3": {
    "id": "hsk2-l9-t3",
    "lesson": 9,
    "textIndex": 3,
    "title": "课文 3: 在路上 (Bài khóa 3: Trên đường về nhà)",
    "context": "在路上，刘明和王一雪在散步。(Trên con đường rợp bóng cây, Lưu Minh và Vương Nhất Tuyết vừa đi dạo vừa trò chuyện về việc đi bộ về nhà).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l9-t3_full.mp3",
    "totalDuration": 18.7,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.3,
        "duration": 2.3
      },
      {
        "lineIndex": 1,
        "start": 2.7,
        "end": 6.3,
        "duration": 3.6
      },
      {
        "lineIndex": 2,
        "start": 6.7,
        "end": 9.27,
        "duration": 2.57
      },
      {
        "lineIndex": 3,
        "start": 9.67,
        "end": 12.36,
        "duration": 2.69
      },
      {
        "lineIndex": 4,
        "start": 12.76,
        "end": 18.45,
        "duration": 5.69
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t3_line0.mp3",
        "duration": 2.3,
        "hanzi": "我们打车回去吧。",
        "pinyin": "Wǒmen dǎchē huíqù ba.",
        "vietnamese": "Chúng ta bắt taxi về nhé."
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t3_line1.mp3",
        "duration": 3.6,
        "hanzi": "这里离家很近，还是走路吧。",
        "pinyin": "Zhèlǐ lí jiā hěn jìn, háishi zǒulù ba.",
        "vietnamese": "Chỗ này cách nhà rất gần, hay là mình đi bộ đi."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t3_line2.mp3",
        "duration": 2.57,
        "hanzi": "要走多长时间？",
        "pinyin": "Yào zǒu duō cháng shíjiān?",
        "vietnamese": "Đi bộ mất bao lâu em?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t3_line3.mp3",
        "duration": 2.69,
        "hanzi": "走半个多小时就到了。",
        "pinyin": "Zǒu bàn gè duō xiǎoshí jiù dào le.",
        "vietnamese": "Đi bộ hơn nửa tiếng là tới nơi rồi."
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t3_line4.mp3",
        "duration": 5.69,
        "hanzi": "好的。每天上下班都坐车，今天运动运动吧。",
        "pinyin": "Hǎo de. Měi tiān shàng xià bān dōu zuò chē, jīntiān yùndòng yùndòng ba.",
        "vietnamese": "Được thôi. Ngày nào đi làm cũng đi xe, hôm nay tranh thủ vận động rèn luyện một chút."
      }
    ]
  },
  "hsk2-l9-t4": {
    "id": "hsk2-l9-t4",
    "lesson": 9,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
    "context": "在房间，王一雪在写日记。(Trong phòng ngủ bên bàn viết, Vương Nhất Tuyết nắn nót ghi nhật ký).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l9-t4_full.mp3",
    "totalDuration": 20.02,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 20.02,
        "duration": 20.02
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l9-t4_line0.mp3",
        "duration": 20.02,
        "hanzi": "这周刘明休息，我下班后跟他去了一家商店。商店里边的衣服没有大商场里好看。我们没有买到喜欢的衣服，从商店出来就到咖啡店坐了坐。因为想运动运动，所以喝完东西，我们就走回家了。",
        "pinyin": "Zhè zhōu Liú Míng xiūxi, wǒ xiàbān hòu gēn tā qùle yì jiā shāngdiàn. Shāngdiàn lǐbian de yīfu méiyǒu dà shāngchǎng lǐ hǎokàn. Wǒmen méiyǒu mǎidào xǐhuan de yīfu, cóng shāngdiàn chūlái jiù dào kāfēidiàn zuòle zuò. Yīnwèi xiǎng yùndòng yùndòng, suǒyǐ hēwán dōngxi, wǒmen jiù zǒu huí jiā le.",
        "vietnamese": "Tuần này Lưu Minh được nghỉ ngơi, sau khi tan làm tôi cùng anh ấy đến một cửa hàng. Quần áo trong tiệm không đẹp bằng trong trung tâm thương mại lớn. Chúng tôi không mua được bộ nào ưng ý, vừa ra khỏi tiệm liền ghé quán cà phê ngồi một lúc. Vì muốn vận động một chút nên sau khi uống đồ xong, hai vợ chồng liền cùng nhau đi bộ về nhà."
      }
    ]
  },
  "hsk2-l10-t1": {
    "id": "hsk2-l10-t1",
    "lesson": 10,
    "textIndex": 1,
    "title": "课文 1: 在房间 (Bài khóa 1: Ở trong phòng)",
    "context": "在房间，刘明在帮刘小明准备东西。(Trong phòng ngủ, Lưu Minh đang giúp con trai Lưu Tiểu Minh chuẩn bị đồ dùng đi học).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l10-t1_full.mp3",
    "totalDuration": 31.32,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.3,
        "duration": 4.3
      },
      {
        "lineIndex": 1,
        "start": 4.7,
        "end": 9.62,
        "duration": 4.92
      },
      {
        "lineIndex": 2,
        "start": 10.02,
        "end": 12.49,
        "duration": 2.47
      },
      {
        "lineIndex": 3,
        "start": 12.89,
        "end": 15.79,
        "duration": 2.9
      },
      {
        "lineIndex": 4,
        "start": 16.19,
        "end": 19.45,
        "duration": 3.26
      },
      {
        "lineIndex": 5,
        "start": 19.85,
        "end": 23.64,
        "duration": 3.79
      },
      {
        "lineIndex": 6,
        "start": 24.04,
        "end": 28.6,
        "duration": 4.56
      },
      {
        "lineIndex": 7,
        "start": 29.0,
        "end": 30.87,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line0.mp3",
        "duration": 4.3,
        "hanzi": "小明，你们明天开学，你准备好了吗？",
        "pinyin": "Xiǎomíng, nǐmen míngtiān kāixué, nǐ zhǔnbèi hǎo le ma?",
        "vietnamese": "Tiểu Minh, ngày mai các con khai giảng rồi, con đã chuẩn bị xong chưa?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line1.mp3",
        "duration": 4.92,
        "hanzi": "明天就开学啊？爸爸，我的书包你看见了吗？",
        "pinyin": "Míngtiān jiù kāixué a? Bàba, wǒ de shūbāo nǐ kànjiàn le ma?",
        "vietnamese": "Mai đã khai giảng rồi ạ? Bố ơi, bố có thấy cặp sách của con ở đâu không?"
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line2.mp3",
        "duration": 2.47,
        "hanzi": "书包在门后面。",
        "pinyin": "Shūbāo zài mén hòumiàn.",
        "vietnamese": "Cặp sách ở phía sau cánh cửa kìa."
      },
      {
        "lineIndex": 3,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line3.mp3",
        "duration": 2.9,
        "hanzi": "书在哪儿呢？笔呢？",
        "pinyin": "Shū zài nǎr ne? Bǐ ne?",
        "vietnamese": "Sách ở đâu thế ạ? Còn bút đâu rồi ạ?"
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line4.mp3",
        "duration": 3.26,
        "hanzi": "书在床上，笔在桌子上。",
        "pinyin": "Shū zài chuáng shang, bǐ zài zhuōzi shang.",
        "vietnamese": "Sách ở trên giường, bút ở trên bàn học."
      },
      {
        "lineIndex": 5,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line5.mp3",
        "duration": 3.79,
        "hanzi": "太好了！现在都准备好了。",
        "pinyin": "Tài hǎo le! Xiànzài dōu zhǔnbèi hǎo le.",
        "vietnamese": "Tuyệt quá! Bây giờ mọi thứ đều chuẩn bị xong xuôi rồi."
      },
      {
        "lineIndex": 6,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha trầm ấm, đĩnh đạc 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line6.mp3",
        "duration": 4.56,
        "hanzi": "这次爸爸帮你，下次你自己准备，好不好？",
        "pinyin": "Zhè cì bàba bāng nǐ, xià cì nǐ zìjǐ zhǔnbèi, hǎo bu hǎo?",
        "vietnamese": "Lần này bố giúp con, lần sau con tự mình chuẩn bị nhé, được không?"
      },
      {
        "lineIndex": 7,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t1_line7.mp3",
        "duration": 1.87,
        "hanzi": "好！",
        "pinyin": "Hǎo!",
        "vietnamese": "Dạ được ạ!"
      }
    ]
  },
  "hsk2-l10-t2": {
    "id": "hsk2-l10-t2",
    "lesson": 10,
    "textIndex": 2,
    "title": "课文 2: 在房间 (Bài khóa 2: Trong phòng học)",
    "context": "在房间，王一雪和刘小雪在聊学习。(Trong phòng học, Vương Nhất Tuyết và con gái Lưu Tiểu Tuyết trò chuyện về việc ôn thi).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l10-t2_full.mp3",
    "totalDuration": 23.05,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.1,
        "duration": 3.1
      },
      {
        "lineIndex": 1,
        "start": 3.5,
        "end": 6.31,
        "duration": 2.81
      },
      {
        "lineIndex": 2,
        "start": 6.71,
        "end": 9.3,
        "duration": 2.59
      },
      {
        "lineIndex": 3,
        "start": 9.7,
        "end": 12.58,
        "duration": 2.88
      },
      {
        "lineIndex": 4,
        "start": 12.98,
        "end": 18.48,
        "duration": 5.5
      },
      {
        "lineIndex": 5,
        "start": 18.88,
        "end": 22.74,
        "duration": 3.86
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t2_line0.mp3",
        "duration": 3.1,
        "hanzi": "小雪，你在做什么呢？",
        "pinyin": "Xiǎoxuě, nǐ zài zuò shénme ne?",
        "vietnamese": "Tiểu Tuyết, con đang làm gì đấy?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t2_line1.mp3",
        "duration": 2.81,
        "hanzi": "明天考试，我在看书呢。",
        "pinyin": "Míngtiān kǎoshì, wǒ zài kàn shū ne.",
        "vietnamese": "Ngày mai thi rồi, con đang đọc sách ôn bài đây ạ."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t2_line2.mp3",
        "duration": 2.59,
        "hanzi": "这些词要好好看看。",
        "pinyin": "Zhèxiē cí yào hǎohǎo kànkan.",
        "vietnamese": "Mấy từ vựng này con phải xem lại cho thật kỹ nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t2_line3.mp3",
        "duration": 2.88,
        "hanzi": "我看过了，意思也都懂了。",
        "pinyin": "Wǒ kànguo le, yìsi yě dōu dǒng le.",
        "vietnamese": "Con xem qua rồi, ý nghĩa cũng đều hiểu hết rồi ạ."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t2_line4.mp3",
        "duration": 5.5,
        "hanzi": "你的本子呢？本子上做错的题也要看一看。",
        "pinyin": "Nǐ de běnzi ne? Běnzi shang zuòcuò de tí yě yào kàn yi kàn.",
        "vietnamese": "Vở của con đâu? Những bài làm sai trong vở cũng phải xem lại đấy nhé."
      },
      {
        "lineIndex": 5,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t2_line5.mp3",
        "duration": 3.86,
        "hanzi": "妈妈，是您准备考试还是我准备考试？",
        "pinyin": "Māma, shì nín zhǔnbèi kǎoshì háishi wǒ zhǔnbèi kǎoshì?",
        "vietnamese": "Mẹ ơi, là mẹ chuẩn bị đi thi hay con chuẩn bị đi thi thế ạ?"
      }
    ]
  },
  "hsk2-l10-t3": {
    "id": "hsk2-l10-t3",
    "lesson": 10,
    "textIndex": 3,
    "title": "课文 3: 在家里 (Bài khóa 3: Ở nhà)",
    "context": "在家里，王一雪和孩子们在聊天儿。(Ở nhà, Vương Nhất Tuyết trò chuyện cùng hai con khi Tiểu Tuyết vừa thi xong về).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l10-t3_full.mp3",
    "totalDuration": 29.84,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.26,
        "duration": 2.26
      },
      {
        "lineIndex": 1,
        "start": 2.66,
        "end": 7.87,
        "duration": 5.21
      },
      {
        "lineIndex": 2,
        "start": 8.27,
        "end": 10.14,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 10.54,
        "end": 13.47,
        "duration": 2.93
      },
      {
        "lineIndex": 4,
        "start": 13.87,
        "end": 15.96,
        "duration": 2.09
      },
      {
        "lineIndex": 5,
        "start": 16.36,
        "end": 22.05,
        "duration": 5.69
      },
      {
        "lineIndex": 6,
        "start": 22.45,
        "end": 26.6,
        "duration": 4.15
      },
      {
        "lineIndex": 7,
        "start": 27.0,
        "end": 29.4,
        "duration": 2.4
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line0.mp3",
        "duration": 2.26,
        "hanzi": "妈妈，我回来了！",
        "pinyin": "Māma, wǒ huílái le!",
        "vietnamese": "Mẹ ơi, con về rồi ạ!"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line1.mp3",
        "duration": 5.21,
        "hanzi": "我买了奶茶，就在桌子上，自己去拿吧。",
        "pinyin": "Wǒ mǎile nǎichá, jiù zài zhuōzi shang, zìjǐ qù ná ba.",
        "vietnamese": "Mẹ có mua trà sữa để trên bàn đấy, con tự ra lấy uống nhé."
      },
      {
        "lineIndex": 2,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line2.mp3",
        "duration": 1.87,
        "hanzi": "谢谢妈妈！",
        "pinyin": "Xièxie māma!",
        "vietnamese": "Con cảm ơn mẹ!"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line3.mp3",
        "duration": 2.93,
        "hanzi": "今天考试考得怎么样？",
        "pinyin": "Jīntiān kǎoshì kǎo de zěnmeyàng?",
        "vietnamese": "Hôm nay con thi cử làm bài thế nào?"
      },
      {
        "lineIndex": 4,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line4.mp3",
        "duration": 2.09,
        "hanzi": "我觉得比上次好。",
        "pinyin": "Wǒ juéde bǐ shàng cì hǎo.",
        "vietnamese": "Con thấy làm tốt hơn lần trước ạ."
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line5.mp3",
        "duration": 5.69,
        "hanzi": "真不错！饭菜快要做好了，你叫弟弟一起去洗手吧。",
        "pinyin": "Zhēn búcuò! Fàncài kuàiyào zuòhǎo le, nǐ jiào dìdi yìqǐ qù xǐshǒu ba.",
        "vietnamese": "Giỏi lắm! Cơm canh mẹ sắp nấu xong rồi, con gọi em trai cùng đi rửa tay nhé."
      },
      {
        "lineIndex": 6,
        "speaker": "刘小明 (Lưu Tiểu Minh)",
        "speakerName": "刘小明 (Lưu Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Lưu Tiểu Minh (Vân Hạ - Con trai 8t ngộ nghĩnh)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line6.mp3",
        "duration": 4.15,
        "hanzi": "妈妈，我是第一名，姐姐还没洗完呢。",
        "pinyin": "Māma, wǒ shì dì-yī míng, jiějie hái méi xǐwán ne.",
        "vietnamese": "Mẹ ơi, con về nhất nhé, chị vẫn chưa rửa tay xong đâu."
      },
      {
        "lineIndex": 7,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t3_line7.mp3",
        "duration": 2.4,
        "hanzi": "你洗得真快啊！",
        "pinyin": "Nǐ xǐ de zhēn kuài a!",
        "vietnamese": "Con rửa tay nhanh thật đấy!"
      }
    ]
  },
  "hsk2-l10-t4": {
    "id": "hsk2-l10-t4",
    "lesson": 10,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
    "context": "在房间，刘小雪在写日记。(Trong phòng ngủ, Lưu Tiểu Tuyết nắn nót viết nhật ký kể về gia đình).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l10-t4_full.mp3",
    "totalDuration": 18.07,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 18.07,
        "duration": 18.07
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘小雪 (Lưu Tiểu Tuyết)",
        "speakerName": "刘小雪 (Lưu Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l10-t4_line0.mp3",
        "duration": 18.07,
        "hanzi": "快要开学了，爸爸帮弟弟准备书包、本子和笔。我就要考试了，妈妈让我看书、看做错的题。我们上学，爸爸、妈妈比我们还忙。我问他们：“是我和弟弟上学还是你们上学？”我问完，他们都笑了。",
        "pinyin": "Kuàiyào kāixué le, bàba bāng dìdi zhǔnbèi shūbāo, běnzi hé bǐ. Wǒ jiù yào kǎoshì le, māma ràng wǒ kàn shū, kàn zuòcuò de tí. Wǒmen shàngxué, bàba, māma bǐ wǒmen hái máng. Wǒ wèn tāmen: “Shì wǒ hé dìdi shàngxué háishi nǐmen shàngxué?” Wǒ wènwán, tāmen dōu xiào le.",
        "vietnamese": "Sắp khai giảng rồi, bố giúp em trai chuẩn bị cặp sách, tập vở và bút. Tôi thì sắp thi, mẹ bảo tôi đọc sách, xem lại các bài đã làm sai. Tụi con đi học mà bố mẹ còn bận rộn hơn cả tụi con. Tôi liền hỏi bố mẹ: 'Là con với em đi học hay là bố mẹ đi học thế ạ?' Tôi vừa hỏi xong, cả nhà đều bật cười."
      }
    ]
  },
  "hsk2-l11-t1": {
    "id": "hsk2-l11-t1",
    "lesson": 11,
    "textIndex": 1,
    "title": "课文 1: 在教室 (Bài khóa 1: Ở trong lớp học)",
    "context": "在教室，王一飞和白家月在聊天儿。(Trong lớp học, cô Vương Nhất Phi và Bạch Gia Nguyệt trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l11-t1_full.mp3",
    "totalDuration": 23.41,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.67,
        "duration": 3.67
      },
      {
        "lineIndex": 1,
        "start": 4.07,
        "end": 6.9,
        "duration": 2.83
      },
      {
        "lineIndex": 2,
        "start": 7.3,
        "end": 10.97,
        "duration": 3.67
      },
      {
        "lineIndex": 3,
        "start": 11.37,
        "end": 15.81,
        "duration": 4.44
      },
      {
        "lineIndex": 4,
        "start": 16.21,
        "end": 20.51,
        "duration": 4.3
      },
      {
        "lineIndex": 5,
        "start": 20.91,
        "end": 23.09,
        "duration": 2.18
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t1_line0.mp3",
        "duration": 3.67,
        "hanzi": "家月，都下课了，你怎么还不回家？",
        "pinyin": "Jiāyuè, dōu xiàkè le, nǐ zěnme hái bù huí jiā?",
        "vietnamese": "Gia Nguyệt, tan học rồi, sao em vẫn chưa về nhà thế?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t1_line1.mp3",
        "duration": 2.83,
        "hanzi": "我头疼，不太舒服。",
        "pinyin": "Wǒ tóu téng, bú tài shūfu.",
        "vietnamese": "Em bị đau đầu, trong người không được khỏe lắm cô ạ."
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t1_line2.mp3",
        "duration": 3.67,
        "hanzi": "你这几天经常头疼，去医院看看吧。",
        "pinyin": "Nǐ zhè jǐ tiān jīngcháng tóu téng, qù yīyuàn kànkan ba.",
        "vietnamese": "Mấy hôm nay em thường xuyên đau đầu, đi bệnh viện khám xem sao nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t1_line3.mp3",
        "duration": 4.44,
        "hanzi": "我想休息一下，现在不能动，一动就疼。",
        "pinyin": "Wǒ xiǎng xiūxi yíxià, xiànzài bù néng dòng, yí dòng jiù téng.",
        "vietnamese": "Em muốn nghỉ một chút, giờ em không cử động được, hễ động đậy là lại đau."
      },
      {
        "lineIndex": 4,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t1_line4.mp3",
        "duration": 4.3,
        "hanzi": "那你在这儿坐着，我去开车，一会儿送你去医院。",
        "pinyin": "Nà nǐ zài zhèr zuòzhe, wǒ qù kāichē, yíhuìr sòng nǐ qù yīyuàn.",
        "vietnamese": "Vậy em cứ ngồi đây nhé, cô đi lấy xe ô tô, lát nữa cô chở em đến bệnh viện."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t1_line5.mp3",
        "duration": 2.18,
        "hanzi": "谢谢王老师。",
        "pinyin": "Xièxie Wáng lǎoshī.",
        "vietnamese": "Em cảm ơn cô Vương ạ."
      }
    ]
  },
  "hsk2-l11-t2": {
    "id": "hsk2-l11-t2",
    "lesson": 11,
    "textIndex": 2,
    "title": "课文 2: 在车上 (Bài khóa 2: Trên xe ô tô)",
    "context": "在车上，王一飞、白家月和李文在打电话。(Trên xe ô tô đi bệnh viện, Bạch Gia Nguyệt nghe điện thoại của Lý Văn).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l11-t2_full.mp3",
    "totalDuration": 29.83,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.18,
        "duration": 4.18
      },
      {
        "lineIndex": 1,
        "start": 4.58,
        "end": 8.28,
        "duration": 3.7
      },
      {
        "lineIndex": 2,
        "start": 8.68,
        "end": 12.66,
        "duration": 3.98
      },
      {
        "lineIndex": 3,
        "start": 13.06,
        "end": 18.12,
        "duration": 5.06
      },
      {
        "lineIndex": 4,
        "start": 18.52,
        "end": 23.46,
        "duration": 4.94
      },
      {
        "lineIndex": 5,
        "start": 23.86,
        "end": 26.84,
        "duration": 2.98
      },
      {
        "lineIndex": 6,
        "start": 27.24,
        "end": 29.45,
        "duration": 2.21
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line0.mp3",
        "duration": 4.18,
        "hanzi": "现在路上车多，还下着雪，我开慢一点儿。",
        "pinyin": "Xiànzài lùshang chē duō, hái xiàzhe xuě, wǒ kāi màn yìdiǎnr.",
        "vietnamese": "Bây giờ trên đường đông xe, trời lại đang có tuyết rơi, cô lái chậm một chút nhé."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line1.mp3",
        "duration": 3.7,
        "hanzi": "没问题，现在头没那么疼了。",
        "pinyin": "Méi wèntí, xiànzài tóu méi nàme téng le.",
        "vietnamese": "Dạ vâng ạ, giờ đầu em cũng không đau nhiều như lúc nãy nữa."
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line2.mp3",
        "duration": 3.98,
        "hanzi": "好。李文来电话了，你帮我接一下。",
        "pinyin": "Hǎo. Lǐ Wén lái diànhuà le, nǐ bāng wǒ jiē yíxià.",
        "vietnamese": "Được rồi. Lý Văn gọi điện đến kìa, em nghe máy giúp cô nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line3.mp3",
        "duration": 5.06,
        "hanzi": "喂，李文，王老师开着车呢，你找她有事吗？",
        "pinyin": "Wèi, Lǐ Wén, Wáng lǎoshī kāizhe chē ne, nǐ zhǎo tā yǒu shì ma?",
        "vietnamese": "Alo, Lý Văn à, cô Vương đang lái xe, cậu tìm cô có việc gì không?"
      },
      {
        "lineIndex": 4,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line4.mp3",
        "duration": 4.94,
        "hanzi": "没什么事。今天雪这么大，你们开车去哪儿啊？",
        "pinyin": "Méi shénme shì. Jīntiān xuě zhème dà, nǐmen kāichē qù nǎr a?",
        "vietnamese": "Không có chuyện gì gấp đâu. Hôm nay tuyết rơi to thế này, mọi người lái xe đi đâu đấy?"
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line5.mp3",
        "duration": 2.98,
        "hanzi": "去医院，我头有点儿疼。",
        "pinyin": "Qù yīyuàn, wǒ tóu yǒudiǎnr téng.",
        "vietnamese": "Đi bệnh viện, đầu tớ hơi bị đau một chút."
      },
      {
        "lineIndex": 6,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t2_line6.mp3",
        "duration": 2.21,
        "hanzi": "那我一会儿去看看你。",
        "pinyin": "Nà wǒ yíhuìr qù kànkan nǐ.",
        "vietnamese": "Vậy lát nữa tớ qua thăm cậu nhé."
      }
    ]
  },
  "hsk2-l11-t3": {
    "id": "hsk2-l11-t3",
    "lesson": 11,
    "textIndex": 3,
    "title": "课文 3: 在王老师家 (Bài khóa 3: Tại nhà cô Vương)",
    "context": "在王老师家，白家月、李文和王一飞在聊天儿。(Tại nhà cô Vương Nhất Phi sau khi đi viện về, mọi người trò chuyện ấm cúng).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l11-t3_full.mp3",
    "totalDuration": 34.35,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.47,
        "duration": 2.47
      },
      {
        "lineIndex": 1,
        "start": 2.87,
        "end": 7.17,
        "duration": 4.3
      },
      {
        "lineIndex": 2,
        "start": 7.57,
        "end": 13.31,
        "duration": 5.74
      },
      {
        "lineIndex": 3,
        "start": 13.71,
        "end": 15.58,
        "duration": 1.87
      },
      {
        "lineIndex": 4,
        "start": 15.98,
        "end": 18.86,
        "duration": 2.88
      },
      {
        "lineIndex": 5,
        "start": 19.26,
        "end": 23.56,
        "duration": 4.3
      },
      {
        "lineIndex": 6,
        "start": 23.96,
        "end": 26.17,
        "duration": 2.21
      },
      {
        "lineIndex": 7,
        "start": 26.57,
        "end": 30.55,
        "duration": 3.98
      },
      {
        "lineIndex": 8,
        "start": 30.95,
        "end": 33.85,
        "duration": 2.9
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line0.mp3",
        "duration": 2.47,
        "hanzi": "李文，快请进！",
        "pinyin": "Lǐ Wén, kuài qǐng jìn!",
        "vietnamese": "Lý Văn, mau vào nhà đi!"
      },
      {
        "lineIndex": 1,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line1.mp3",
        "duration": 4.3,
        "hanzi": "家月，你怎么样了？头还疼吗？",
        "pinyin": "Jiāyuè, nǐ zěnmeyàng le? Tóu hái téng ma?",
        "vietnamese": "Gia Nguyệt, cậu thấy sao rồi? Đầu còn đau không?"
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line2.mp3",
        "duration": 5.74,
        "hanzi": "不那么疼了。医生开了一些药，吃完就好多了。",
        "pinyin": "Bú nàme téng le. Yīshēng kāile yìxiē yào, chīwán jiù hǎoduō le.",
        "vietnamese": "Không đau lắm nữa rồi. Bác sĩ kê cho ít thuốc, uống xong tớ thấy đỡ nhiều rồi."
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line3.mp3",
        "duration": 1.87,
        "hanzi": "那就好！",
        "pinyin": "Nà jiù hǎo!",
        "vietnamese": "Thế thì tốt quá!"
      },
      {
        "lineIndex": 4,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line4.mp3",
        "duration": 2.88,
        "hanzi": "家月，你想不想吃点儿东西？",
        "pinyin": "Jiāyuè, nǐ xiǎng bu xiǎng chī diǎnr dōngxi?",
        "vietnamese": "Gia Nguyệt, em có muốn ăn chút gì không?"
      },
      {
        "lineIndex": 5,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line5.mp3",
        "duration": 4.3,
        "hanzi": "吃点儿吧，身体不舒服时更要好好吃饭。",
        "pinyin": "Chī diǎnr ba, shēntǐ bù shūfu shí gèng yào hǎohǎo chī fàn.",
        "vietnamese": "Cậu ăn chút đi, lúc người không khỏe thì càng phải ăn uống đầy đủ."
      },
      {
        "lineIndex": 6,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line6.mp3",
        "duration": 2.21,
        "hanzi": "吃点儿什么呢？",
        "pinyin": "Chī diǎnr shénme ne?",
        "vietnamese": "Ăn món gì bây giờ nhỉ?"
      },
      {
        "lineIndex": 7,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line7.mp3",
        "duration": 3.98,
        "hanzi": "你最喜欢吃中国菜，我做几个中国菜吧。",
        "pinyin": "Nǐ zuì xǐhuan chī Zhōngguó cài, wǒ zuò jǐ gè Zhōngguó cài ba.",
        "vietnamese": "Em thích ăn món ăn Trung Quốc nhất, để cô nấu vài món Trung Quốc nhé."
      },
      {
        "lineIndex": 8,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t3_line8.mp3",
        "duration": 2.9,
        "hanzi": "好的，谢谢王老师。",
        "pinyin": "Hǎo de, xièxie Wáng lǎoshī.",
        "vietnamese": "Vâng ạ, em cảm ơn cô Vương nhiều."
      }
    ]
  },
  "hsk2-l11-t4": {
    "id": "hsk2-l11-t4",
    "lesson": 11,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
    "context": "在房间，白家月在写日记。(Trong phòng ngủ, Bạch Gia Nguyệt cảm động ghi nhật ký).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l11-t4_full.mp3",
    "totalDuration": 16.7,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 16.7,
        "duration": 16.7
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l11-t4_line0.mp3",
        "duration": 16.7,
        "hanzi": "我这几天经常头疼，从药店买了点儿药，没去医院。今天下课后，王老师看我不舒服，就送我去医院了。从医院回来，李文也来看我了。现在他们都回去了，我也要睡觉了。",
        "pinyin": "Wǒ zhè jǐ tiān jīngcháng tóu téng, cóng yàodiàn mǎile diǎnr yào, méi qù yīyuàn. Jīntiān xiàkè hòu, Wáng lǎoshī kàn wǒ bù shūfu, jiù sòng wǒ qù yīyuàn le. Cóng yīyuàn huílái, Lǐ Wén yě lái kàn wǒ le. Xiànzài tāmen dōu huíqù le, wǒ yě yào shuìjiào le.",
        "vietnamese": "Mấy hôm nay tôi thường xuyên đau đầu, có mua ít thuốc ở hiệu thuốc chứ chưa đi bệnh viện. Hôm nay sau khi tan học, cô giáo Vương thấy tôi mệt mỏi liền chở tôi đến bệnh viện khám. Từ bệnh viện trở về, Lý Văn cũng qua thăm tôi. Bây giờ mọi người đều về rồi, tôi cũng chuẩn bị đi ngủ đây."
      }
    ]
  },
  "hsk2-l12-t1": {
    "id": "hsk2-l12-t1",
    "lesson": 12,
    "textIndex": 1,
    "title": "课文 1: 在房间 (Bài khóa 1: Ở trong phòng)",
    "context": "在房间，王一雪接到白家月的电话。(Trong phòng, Vương Nhất Tuyết nhận điện thoại của Bạch Gia Nguyệt hỏi thăm thời tiết).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l12-t1_full.mp3",
    "totalDuration": 27.3,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.75,
        "duration": 4.75
      },
      {
        "lineIndex": 1,
        "start": 5.15,
        "end": 8.58,
        "duration": 3.43
      },
      {
        "lineIndex": 2,
        "start": 8.98,
        "end": 12.03,
        "duration": 3.05
      },
      {
        "lineIndex": 3,
        "start": 12.43,
        "end": 16.68,
        "duration": 4.25
      },
      {
        "lineIndex": 4,
        "start": 17.08,
        "end": 21.98,
        "duration": 4.9
      },
      {
        "lineIndex": 5,
        "start": 22.38,
        "end": 26.99,
        "duration": 4.61
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t1_line0.mp3",
        "duration": 4.75,
        "hanzi": "喂，家月，是你啊！有什么事情吗？",
        "pinyin": "Wèi, Jiāyuè, shì nǐ a! Yǒu shénme shìqing ma?",
        "vietnamese": "Alo, Gia Nguyệt, là em đấy à! Có chuyện gì thế em?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t1_line1.mp3",
        "duration": 3.43,
        "hanzi": "没什么事，就想跟您说说话。",
        "pinyin": "Méi shénme shì, jiù xiǎng gēn nín shuōshuo huà.",
        "vietnamese": "Dạ không có chuyện gì đâu ạ, em chỉ muốn gọi điện trò chuyện với chị thôi."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t1_line2.mp3",
        "duration": 3.05,
        "hanzi": "好啊。你今天没课吗？",
        "pinyin": "Hǎo a. Nǐ jīntiān méi kè ma?",
        "vietnamese": "Được chứ. Hôm nay em không có tiết học à?"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t1_line3.mp3",
        "duration": 4.25,
        "hanzi": "下午有课。您那里天气怎么样？",
        "pinyin": "Xiàwǔ yǒu kè. Nín nàlǐ tiānqì zěnmeyàng?",
        "vietnamese": "Dạ buổi chiều em mới có tiết. Thời tiết chỗ chị dạo này thế nào ạ?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t1_line4.mp3",
        "duration": 4.9,
        "hanzi": "北京这几天虽然是晴天，但是有点儿冷。",
        "pinyin": "Běijīng zhè jǐ tiān suīrán shì qíngtiān, dànshì yǒudiǎnr lěng.",
        "vietnamese": "Mấy hôm nay ở Bắc Kinh tuy trời nắng nhưng hơi lạnh em ạ."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t1_line5.mp3",
        "duration": 4.61,
        "hanzi": "我这里比北京冷多了，外边还正下着雪呢！",
        "pinyin": "Wǒ zhèlǐ bǐ Běijīng lěngduō le, wàibian hái zhèng xiàzhe xuě ne!",
        "vietnamese": "Chỗ em ở đây lạnh hơn Bắc Kinh nhiều, bên ngoài trời còn đang rơi tuyết nữa cơ!"
      }
    ]
  },
  "hsk2-l12-t2": {
    "id": "hsk2-l12-t2",
    "lesson": 12,
    "textIndex": 2,
    "title": "课文 2: 在客厅 (Bài khóa 2: Ở phòng khách)",
    "context": "在客厅，王一雪给王一飞打电话。(Tại phòng khách, Vương Nhất Tuyết gọi điện cho em gái Vương Nhất Phi dặn dò giữ ấm).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l12-t2_full.mp3",
    "totalDuration": 34.53,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 6.14,
        "duration": 6.14
      },
      {
        "lineIndex": 1,
        "start": 6.54,
        "end": 10.0,
        "duration": 3.46
      },
      {
        "lineIndex": 2,
        "start": 10.4,
        "end": 15.39,
        "duration": 4.99
      },
      {
        "lineIndex": 3,
        "start": 15.79,
        "end": 19.51,
        "duration": 3.72
      },
      {
        "lineIndex": 4,
        "start": 19.91,
        "end": 23.65,
        "duration": 3.74
      },
      {
        "lineIndex": 5,
        "start": 24.05,
        "end": 28.63,
        "duration": 4.58
      },
      {
        "lineIndex": 6,
        "start": 29.03,
        "end": 34.14,
        "duration": 5.11
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line0.mp3",
        "duration": 6.14,
        "hanzi": "喂，一飞，听家月说你那边下雪了，下得大不大？",
        "pinyin": "Wèi, Yīfēi, tīng Jiāyuè shuō nǐ nàbiān xià xuě le, xià de dà bu dà?",
        "vietnamese": "Alo, Nhất Phi à, chị nghe Gia Nguyệt bảo bên em tuyết rơi rồi, tuyết rơi có to không em?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line1.mp3",
        "duration": 3.46,
        "hanzi": "今天不大，昨天比今天下得大。",
        "pinyin": "Jīntiān bú dà, zuótiān bǐ jīntiān xià de dà.",
        "vietnamese": "Hôm nay không to lắm chị, hôm qua rơi to hơn hôm nay nhiều."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line2.mp3",
        "duration": 4.99,
        "hanzi": "天气不好，你去外面的时候多穿点儿衣服。",
        "pinyin": "Tiānqì bù hǎo, nǐ qù wàimiàn de shíhou duō chuān diǎnr yīfu.",
        "vietnamese": "Thời tiết không tốt, lúc ra ngoài em nhớ mặc thêm nhiều áo ấm nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line3.mp3",
        "duration": 3.72,
        "hanzi": "这几天我在网上上课，没出去过。",
        "pinyin": "Zhè jǐ tiān wǒ zài wǎngshang shàngkè, méi chūqu guo.",
        "vietnamese": "Mấy ngày nay em toàn dạy học trên mạng, chưa có bước chân ra ngoài ạ."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line4.mp3",
        "duration": 3.74,
        "hanzi": "那就好，有事记得给我打电话。",
        "pinyin": "Nà jiù hǎo, yǒu shì jìde gěi wǒ dǎ diànhuà.",
        "vietnamese": "Thế thì tốt rồi, có việc gì thì nhớ gọi điện thoại cho chị nhé."
      },
      {
        "lineIndex": 5,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line5.mp3",
        "duration": 4.58,
        "hanzi": "好的。现在不下雪了，我出去买点儿吃的。",
        "pinyin": "Hǎo de. Xiànzài bú xià xuě le, wǒ chūqu mǎi diǎnr chī de.",
        "vietnamese": "Dạ vâng. Bây giờ tạnh tuyết rồi, em tranh thủ ra ngoài mua chút đồ ăn."
      },
      {
        "lineIndex": 6,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Người mẹ/người vợ đằm thắm, chững chạc 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t2_line6.mp3",
        "duration": 5.11,
        "hanzi": "一次多买点儿，阴天下雪什么的就少出去吧。",
        "pinyin": "Yí cì duō mǎi diǎnr, yīntiān xià xuě shénmede jiù shǎo chūqu ba.",
        "vietnamese": "Một lần mua nhiều một chút, trời âm u tuyết rơi các thứ thì bớt ra ngoài đi em."
      }
    ]
  },
  "hsk2-l12-t3": {
    "id": "hsk2-l12-t3",
    "lesson": 12,
    "textIndex": 3,
    "title": "课文 3: 在电话里 (Bài khóa 3: Qua điện thoại)",
    "context": "在电话里，李文和白家月在聊天儿。(Qua điện thoại, Lý Văn rủ Bạch Gia Nguyệt cùng đi chạy bộ nâng cao sức khỏe).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l12-t3_full.mp3",
    "totalDuration": 29.11,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.92,
        "duration": 4.92
      },
      {
        "lineIndex": 1,
        "start": 5.32,
        "end": 9.28,
        "duration": 3.96
      },
      {
        "lineIndex": 2,
        "start": 9.68,
        "end": 13.16,
        "duration": 3.48
      },
      {
        "lineIndex": 3,
        "start": 13.56,
        "end": 16.97,
        "duration": 3.41
      },
      {
        "lineIndex": 4,
        "start": 17.37,
        "end": 21.52,
        "duration": 4.15
      },
      {
        "lineIndex": 5,
        "start": 21.92,
        "end": 24.68,
        "duration": 2.76
      },
      {
        "lineIndex": 6,
        "start": 25.08,
        "end": 28.73,
        "duration": 3.65
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line0.mp3",
        "duration": 4.92,
        "hanzi": "喂，家月，今天天气不错，我们去跑步吧！",
        "pinyin": "Wèi, Jiāyuè, jīntiān tiānqì búcuò, wǒmen qù pǎobù ba!",
        "vietnamese": "Alo, Gia Nguyệt, hôm nay thời tiết đẹp lắm, chúng mình đi chạy bộ đi!"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line1.mp3",
        "duration": 3.96,
        "hanzi": "你跑步跑得比我快，我们能一起跑吗？",
        "pinyin": "Nǐ pǎobù pǎo de bǐ wǒ kuài, wǒmen néng yìqǐ pǎo ma?",
        "vietnamese": "Cậu chạy nhanh hơn tớ nhiều, hai đứa mình có chạy cùng nhau được không?"
      },
      {
        "lineIndex": 2,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line2.mp3",
        "duration": 3.48,
        "hanzi": "可以的，我慢慢跑，等着你。",
        "pinyin": "Kěyǐ de, wǒ mànmàn pǎo, děngzhe nǐ.",
        "vietnamese": "Được chứ, tớ sẽ chạy chậm chậm chờ cậu mà."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line3.mp3",
        "duration": 3.41,
        "hanzi": "好吧。你真爱跑步啊！",
        "pinyin": "Hǎo ba. Nǐ zhēn ài pǎobù a!",
        "vietnamese": "Được rồi. Cậu mê chạy bộ thật đấy!"
      },
      {
        "lineIndex": 4,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line4.mp3",
        "duration": 4.15,
        "hanzi": "我从小就经常跟爸爸跑步，跑步能让人快乐！",
        "pinyin": "Wǒ cóngxiǎo jiù jīngcháng gēn bàba pǎobù, pǎobù néng ràng rén kuàilè!",
        "vietnamese": "Từ nhỏ tớ đã hay chạy bộ cùng bố rồi, chạy bộ làm cho con người ta vui vẻ yêu đời lắm!"
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line5.mp3",
        "duration": 2.76,
        "hanzi": "好，那我准备一下。",
        "pinyin": "Hǎo, nà wǒ zhǔnbèi yíxià.",
        "vietnamese": "Được, vậy để tớ chuẩn bị một chút nhé."
      },
      {
        "lineIndex": 6,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t3_line6.mp3",
        "duration": 3.65,
        "hanzi": "我现在坐地铁去找你，一会儿楼下见。",
        "pinyin": "Wǒ xiànzài zuò dìtiě qù zhǎo nǐ, yíhuìr lóu xià jiàn.",
        "vietnamese": "Bây giờ tớ đi tàu điện ngầm qua tìm cậu, lát nữa gặp nhau dưới sảnh tòa nhà nhé."
      }
    ]
  },
  "hsk2-l12-t4": {
    "id": "hsk2-l12-t4",
    "lesson": 12,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng ngủ)",
    "context": "在房间，白家月在写日记。(Trong phòng ngủ, Bạch Gia Nguyệt vui vẻ viết nhật ký).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l12-t4_full.mp3",
    "totalDuration": 18.26,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 18.26,
        "duration": 18.26
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l12-t4_line0.mp3",
        "duration": 18.26,
        "hanzi": "前几天天气不好，我没走路，每天坐两站地铁去学校。今天是个大晴天，李文让我跟他去外面跑步。他小时候经常跑步，跑得比我快，但是他会等我。跟李文一起跑步，我好高兴啊！",
        "pinyin": "Qián jǐ tiān tiānqì bù hǎo, wǒ méi zǒulù, měi tiān zuò liǎng zhàn dìtiě qù xuéxiào. Jīntiān shì gè dà qíngtiān, Lǐ Wén ràng wǒ gēn tā qù wàimiàn pǎobù. Tā xiǎoshíhou jīngcháng pǎobù, pǎo de bǐ wǒ kuài, dànshì tā huì děng wǒ. Gēn Lǐ Wén yìqǐ pǎobù, wǒ hǎo gāoxìng a!",
        "vietnamese": "Mấy hôm trước thời tiết xấu, tôi không đi bộ mà mỗi ngày đều đi hai trạm tàu điện ngầm đến trường. Hôm nay là một ngày nắng rực rỡ, Lý Văn rủ tôi cùng ra ngoài chạy bộ. Cậu ấy từ nhỏ đã hay chạy bộ nên chạy nhanh hơn tôi, nhưng cậu ấy luôn chạy chậm chờ tôi. Được chạy bộ cùng Lý Văn, tôi cảm thấy thật là vui sướng!"
      }
    ]
  },
  "hsk2-l13-t1": {
    "id": "hsk2-l13-t1",
    "lesson": 13,
    "textIndex": 1,
    "title": "课文 1: 在教室 (Bài khóa 1: Trong lớp học)",
    "context": "在教室，白家月和陈天中在聊天儿。(Trong lớp học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện về cô giáo Vương và chuẩn bị quà năm mới).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l13-t1_full.mp3",
    "totalDuration": 31.48,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.54,
        "duration": 4.54
      },
      {
        "lineIndex": 1,
        "start": 4.94,
        "end": 9.24,
        "duration": 4.3
      },
      {
        "lineIndex": 2,
        "start": 9.64,
        "end": 15.88,
        "duration": 6.24
      },
      {
        "lineIndex": 3,
        "start": 16.28,
        "end": 21.37,
        "duration": 5.09
      },
      {
        "lineIndex": 4,
        "start": 21.77,
        "end": 25.37,
        "duration": 3.6
      },
      {
        "lineIndex": 5,
        "start": 25.77,
        "end": 31.17,
        "duration": 5.4
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t1_line0.mp3",
        "duration": 4.54,
        "hanzi": "时间过得真快啊！新年就要到了。",
        "pinyin": "Shíjiān guò de zhēn kuài a! Xīnnián jiù yào dào le.",
        "vietnamese": "Thời gian trôi qua nhanh thật đấy! Năm mới sắp đến rồi."
      },
      {
        "lineIndex": 1,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t1_line1.mp3",
        "duration": 4.3,
        "hanzi": "这一年王老师教我们中文，每天工作都很累。",
        "pinyin": "Zhè yì nián Wáng lǎoshī jiāo wǒmen Zhōngwén, měitiān gōngzuò dōu hěn lèi.",
        "vietnamese": "Năm nay cô Vương dạy chúng mình tiếng Trung, mỗi ngày làm việc đều rất vất vả."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t1_line2.mp3",
        "duration": 6.24,
        "hanzi": "是啊，她教得很好。因为她，我们都非常爱上中文课。",
        "pinyin": "Shì a, tā jiāo de hěn hǎo. Yīnwèi tā, wǒmen dōu fēicháng ài shàng Zhōngwén kè.",
        "vietnamese": "Đúng vậy, cô dạy hay lắm. Nhờ có cô, chúng mình ai cũng vô cùng thích giờ học tiếng Trung."
      },
      {
        "lineIndex": 3,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t1_line3.mp3",
        "duration": 5.09,
        "hanzi": "我们给她准备个新年礼物吧。你觉得送给她什么好呢？",
        "pinyin": "Wǒmen gěi tā zhǔnbèi gè xīnnián lǐwù ba. Nǐ juéde sòng gěi tā shénme hǎo ne?",
        "vietnamese": "Chúng mình chuẩn bị món quà năm mới tặng cô đi. Cậu thấy tặng cô món gì thì hay nhỉ?"
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t1_line4.mp3",
        "duration": 3.6,
        "hanzi": "王老师喜欢花，就送给她花吧。",
        "pinyin": "Wáng lǎoshī xǐhuan huā, jiù sòng gěi tā huā ba.",
        "vietnamese": "Cô Vương thích hoa, hay là tặng cô hoa đi."
      },
      {
        "lineIndex": 5,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t1_line5.mp3",
        "duration": 5.4,
        "hanzi": "那我们去花店看看，现在买花的人多，希望花店还有漂亮的花。",
        "pinyin": "Nà wǒmen qù huādiàn kànkan, xiànzài mǎi huā de rén duō, xīwàng huādiàn hái yǒu piàoliang de huā.",
        "vietnamese": "Thế chúng mình ra tiệm hoa xem thử, bây giờ người mua hoa đông lắm, hy vọng tiệm hoa vẫn còn hoa đẹp."
      }
    ]
  },
  "hsk2-l13-t2": {
    "id": "hsk2-l13-t2",
    "lesson": 13,
    "textIndex": 2,
    "title": "课文 2: 在教室 (Bài khóa 2: Trong lớp học)",
    "context": "在教室，王一飞在上课。(Trong lớp học, cô Vương Nhất Phi đang hướng dẫn luyện viết chữ Hán).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l13-t2_full.mp3",
    "totalDuration": 29.68,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.37,
        "duration": 4.37
      },
      {
        "lineIndex": 1,
        "start": 4.77,
        "end": 7.79,
        "duration": 3.02
      },
      {
        "lineIndex": 2,
        "start": 8.19,
        "end": 10.69,
        "duration": 2.5
      },
      {
        "lineIndex": 3,
        "start": 11.09,
        "end": 15.51,
        "duration": 4.42
      },
      {
        "lineIndex": 4,
        "start": 15.91,
        "end": 21.67,
        "duration": 5.76
      },
      {
        "lineIndex": 5,
        "start": 22.07,
        "end": 26.49,
        "duration": 4.42
      },
      {
        "lineIndex": 6,
        "start": 26.89,
        "end": 29.31,
        "duration": 2.42
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line0.mp3",
        "duration": 4.37,
        "hanzi": "王老师，今天的词比昨天多了十个。",
        "pinyin": "Wáng lǎoshī, jīntiān de cí bǐ zuótiān duōle shí gè.",
        "vietnamese": "Cô Vương ơi, từ vựng hôm nay nhiều hơn hôm qua tận mười từ ạ."
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line1.mp3",
        "duration": 3.02,
        "hanzi": "是啊！你们都学会了吗？",
        "pinyin": "Shì a! Nǐmen dōu xuéhuì le ma?",
        "vietnamese": "Đúng vậy! Các em đều đã học thuộc hết chưa nào?"
      },
      {
        "lineIndex": 2,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line2.mp3",
        "duration": 2.5,
        "hanzi": "学会了，没有问题。",
        "pinyin": "Xuéhuì le, méiyǒu wèntí.",
        "vietnamese": "Bọn em học thuộc rồi ạ, không có vấn đề gì đâu cô."
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line3.mp3",
        "duration": 4.42,
        "hanzi": "好。现在我来说，你们在本子上面写。",
        "pinyin": "Hǎo. Xiànzài wǒ lái shuō, nǐmen zài běnzi shàngmiàn xiě.",
        "vietnamese": "Tốt lắm. Bây giờ cô đọc, các em viết vào trong vở nhé."
      },
      {
        "lineIndex": 4,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line4.mp3",
        "duration": 5.76,
        "hanzi": "同学们，“洗手间”的“间”字写错了，它的里面是“日”，不是“口”。",
        "pinyin": "Tóngxuémen, 'xǐshǒujiān' de 'jiān' zì xiěcuò le, tā de lǐmiàn shì 'rì', bú shì 'kǒu'.",
        "vietnamese": "Các em ơi, chữ 'Gian' trong 'nhà vệ sinh' viết sai rồi nhé, bên trong nó là chữ 'Nhật - 日', không phải chữ 'Khẩu - 口' đâu."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line5.mp3",
        "duration": 4.42,
        "hanzi": "“日”比“口”多一笔，写“口”就是“问题”的“问”了。",
        "pinyin": "'Rì' bǐ 'kǒu' duō yì bǐ, xiě 'kǒu' jiù shì 'wèntí' de 'wèn' le.",
        "vietnamese": "Chữ 'Nhật' nhiều hơn chữ 'Khẩu' một nét, nếu viết chữ 'Khẩu' thì thành chữ 'Vấn - 问' trong 'vấn đề' mất rồi ạ."
      },
      {
        "lineIndex": 6,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t2_line6.mp3",
        "duration": 2.42,
        "hanzi": "没错，你说得很对。",
        "pinyin": "Méi cuò, nǐ shuō de hěn duì.",
        "vietnamese": "Đúng rồi, em nói rất chính xác."
      }
    ]
  },
  "hsk2-l13-t3": {
    "id": "hsk2-l13-t3",
    "lesson": 13,
    "textIndex": 3,
    "title": "课文 3: 在教室 (Bài khóa 3: Trong lớp học)",
    "context": "在教室，安妮和白家月在聊天儿。(Trong lớp học, Annie và Bạch Gia Nguyệt khoe nhau cuốn sổ tay gấu trúc mua trên mạng và hẹn tặng quà).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l13-t3_full.mp3",
    "totalDuration": 33.46,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.14,
        "duration": 3.14
      },
      {
        "lineIndex": 1,
        "start": 3.54,
        "end": 6.54,
        "duration": 3.0
      },
      {
        "lineIndex": 2,
        "start": 6.94,
        "end": 10.23,
        "duration": 3.29
      },
      {
        "lineIndex": 3,
        "start": 10.63,
        "end": 14.42,
        "duration": 3.79
      },
      {
        "lineIndex": 4,
        "start": 14.82,
        "end": 20.68,
        "duration": 5.86
      },
      {
        "lineIndex": 5,
        "start": 21.08,
        "end": 24.85,
        "duration": 3.77
      },
      {
        "lineIndex": 6,
        "start": 25.25,
        "end": 28.68,
        "duration": 3.43
      },
      {
        "lineIndex": 7,
        "start": 29.08,
        "end": 33.02,
        "duration": 3.94
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line0.mp3",
        "duration": 3.14,
        "hanzi": "家月，你觉得这个本子怎么样？",
        "pinyin": "Jiāyuè, nǐ juéde zhèige běnzi zěnmeyàng?",
        "vietnamese": "Gia Nguyệt ơi, cậu thấy quyển sổ này thế nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line1.mp3",
        "duration": 3.0,
        "hanzi": "很漂亮，多少钱一个？",
        "pinyin": "Hěn piàoliang, duōshao qián yí gè?",
        "vietnamese": "Đẹp lắm, bao nhiêu tiền một quyển thế?"
      },
      {
        "lineIndex": 2,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line2.mp3",
        "duration": 3.29,
        "hanzi": "比我们一起买的那个本子贵一点儿。",
        "pinyin": "Bǐ wǒmen yìqǐ mǎi de nàge běnzi guì yìdiǎnr.",
        "vietnamese": "Đắt hơn quyển sổ hôm trước hai đứa mình cùng mua một chút."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line3.mp3",
        "duration": 3.79,
        "hanzi": "这么漂亮的本子，不可能贵一点儿吧？",
        "pinyin": "Zhème piàoliang de běnzi, bù kěnéng guì yìdiǎnr ba?",
        "vietnamese": "Quyển sổ xinh xắn thế này, làm sao mà chỉ đắt hơn có một chút được?"
      },
      {
        "lineIndex": 4,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line4.mp3",
        "duration": 5.86,
        "hanzi": "我是上网买的，真没那么贵。我买了两个，送你一个。",
        "pinyin": "Wǒ shì shàngwǎng mǎi de, zhēn méi nàme guì. Wǒ mǎile liǎng gè, sòng nǐ yí gè.",
        "vietnamese": "Tớ mua trên mạng đấy, thật sự không đắt đến thế đâu. Tớ mua hai quyển, tặng cậu một quyển này."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line5.mp3",
        "duration": 3.77,
        "hanzi": "谢谢！那我送给你什么呢？",
        "pinyin": "Xièxie! Nà wǒ sòng gěi nǐ shénme ne?",
        "vietnamese": "Cảm ơn cậu nhé! Thế tớ tặng lại cậu cái gì đây nhỉ?"
      },
      {
        "lineIndex": 6,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ sinh viên phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line6.mp3",
        "duration": 3.43,
        "hanzi": "咖啡杯吧，我最喜欢喝咖啡了。",
        "pinyin": "Kāfēibēi ba, wǒ zuì xǐhuan hē kāfēi le.",
        "vietnamese": "Tặng ly cà phê đi, tớ thích uống cà phê nhất trần đời."
      },
      {
        "lineIndex": 7,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t3_line7.mp3",
        "duration": 3.94,
        "hanzi": "好，那样我们就有新年礼物了！",
        "pinyin": "Hǎo, nàyàng wǒmen jiù dōu yǒu xīnnián lǐwù le!",
        "vietnamese": "Được thôi, thế thì cả hai đứa mình đều có quà năm mới rồi!"
      }
    ]
  },
  "hsk2-l13-t4": {
    "id": "hsk2-l13-t4",
    "lesson": 13,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
    "context": "在房间，白家月在写日记。(Trong phòng, Bạch Gia Nguyệt viết nhật ký ghi lại niềm vui nhận quà năm mới và tặng hoa cho cô giáo).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l13-t4_full.mp3",
    "totalDuration": 15.05,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 15.05,
        "duration": 15.05
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l13-t4_line0.mp3",
        "duration": 15.05,
        "hanzi": "新年就要到了，安妮送给我一个新本子。她告诉我是在网上买的，比我的本子贵一点儿。我们班同学也送了王老师漂亮的花，希望她高高兴兴地过个新年。",
        "pinyin": "Xīnnián jiù yào dào le, Ānnī sòng gěi wǒ yí gè xīn běnzi. Tā gàosu wǒ shì zài wǎngshang mǎi de, bǐ wǒ de běnzi guì yìdiǎnr. Wǒmen bān tóngxué yě sòngle Wáng lǎoshī piàoliang de huā, xīwàng tā gāogāoxìngxìng de guò gè xīnnián.",
        "vietnamese": "Năm mới sắp đến rồi, Annie đã tặng cho mình một quyển sổ mới. Cậu ấy bảo với mình là mua trên mạng, đắt hơn quyển sổ của mình một chút. Cả lớp chúng mình cũng tặng cô giáo Vương bó hoa tươi thắm, hy vọng cô sẽ đón một năm mới thật vui vẻ."
      }
    ]
  },
  "hsk2-l14-t1": {
    "id": "hsk2-l14-t1",
    "lesson": 14,
    "textIndex": 1,
    "title": "课文 1: 在回家路上 (Bài khóa 1: Trên đường về nhà)",
    "context": "在回家路上，李文和王一飞边走边聊。(Trên đường về nhà, Lý Văn và cô Vương Nhất Phi vừa đi vừa trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l14-t1_full.mp3",
    "totalDuration": 18.58,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.7,
        "duration": 3.7
      },
      {
        "lineIndex": 1,
        "start": 4.1,
        "end": 7.03,
        "duration": 2.93
      },
      {
        "lineIndex": 2,
        "start": 7.43,
        "end": 12.01,
        "duration": 4.58
      },
      {
        "lineIndex": 3,
        "start": 12.41,
        "end": 15.77,
        "duration": 3.36
      },
      {
        "lineIndex": 4,
        "start": 16.17,
        "end": 18.33,
        "duration": 2.16
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t1_line0.mp3",
        "duration": 3.7,
        "hanzi": "王老师，你家楼下站着一个人。",
        "pinyin": "Wáng lǎoshī, nǐ jiā lóu xià zhànzhe yí gè rén.",
        "vietnamese": "Cô Vương ơi, dưới chân tòa nhà của cô có một người đang đứng kìa."
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t1_line1.mp3",
        "duration": 2.93,
        "hanzi": "我家楼下？我看看。",
        "pinyin": "Wǒ jiā lóu xià? Wǒ kànkan.",
        "vietnamese": "Dưới nhà cô á? Để cô xem nào."
      },
      {
        "lineIndex": 2,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t1_line2.mp3",
        "duration": 4.58,
        "hanzi": "那个人穿着黑色的裤子，手里还拿着一个黑色的包。",
        "pinyin": "Nàge rén chuānzhe hēisè de kùzi, shǒuli hái názhe yí gè hēisè de bāo.",
        "vietnamese": "Người đó mặc quần màu đen, trên tay còn đang xách một chiếc túi màu đen nữa."
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t1_line3.mp3",
        "duration": 3.36,
        "hanzi": "我看见那个人了，他是我男朋友。",
        "pinyin": "Wǒ kànjiàn nàge rén le, tā shì wǒ nánpéngyou.",
        "vietnamese": "Cô nhìn thấy người đó rồi, anh ấy là bạn trai cô."
      },
      {
        "lineIndex": 4,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t1_line4.mp3",
        "duration": 2.16,
        "hanzi": "那我们快过去吧。",
        "pinyin": "Nà wǒmen kuài guòqù ba.",
        "vietnamese": "Thế thì chúng ta mau qua đó đi ạ."
      }
    ]
  },
  "hsk2-l14-t2": {
    "id": "hsk2-l14-t2",
    "lesson": 14,
    "textIndex": 2,
    "title": "课文 2: 在楼下 (Bài khóa 2: Dưới chân tòa nhà)",
    "context": "在楼下，王一飞见到杨同乐。(Ở dưới sảnh, cô Vương Nhất Phi gặp bạn trai Dương Đồng Nhạc và giới thiệu với Lý Văn).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l14-t2_full.mp3",
    "totalDuration": 34.75,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 7.34,
        "duration": 7.34
      },
      {
        "lineIndex": 1,
        "start": 7.74,
        "end": 12.76,
        "duration": 5.02
      },
      {
        "lineIndex": 2,
        "start": 13.16,
        "end": 15.7,
        "duration": 2.54
      },
      {
        "lineIndex": 3,
        "start": 16.1,
        "end": 18.4,
        "duration": 2.3
      },
      {
        "lineIndex": 4,
        "start": 18.8,
        "end": 25.81,
        "duration": 7.01
      },
      {
        "lineIndex": 5,
        "start": 26.21,
        "end": 28.56,
        "duration": 2.35
      },
      {
        "lineIndex": 6,
        "start": 28.96,
        "end": 34.36,
        "duration": 5.4
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line0.mp3",
        "duration": 7.34,
        "hanzi": "同乐，真是你啊！上次打电话，你说有时间过来看我，没想到这么快就来了！",
        "pinyin": "Tónglè, zhēn shì nǐ a! Shàng cì dǎ diànhuà, nǐ shuō yǒu shíjiān guòlái kàn wǒ, méi xiǎngdào zhème kuài jiù lái le!",
        "vietnamese": "Đồng Nhạc, đúng là anh thật này! Lần trước gọi điện, anh bảo khi nào rảnh sẽ qua thăm em, không ngờ lại đến nhanh thế!"
      },
      {
        "lineIndex": 1,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line1.mp3",
        "duration": 5.02,
        "hanzi": "就要过年了，你一个人在这儿多没意思啊，所以我就早早过来了。",
        "pinyin": "Jiù yào guònián le, nǐ yí gè rén zài zhèr duō méi yìsi a, suǒyǐ wǒ jiù zǎozǎo guòlái le.",
        "vietnamese": "Sắp đến Tết rồi, em thui thủi một mình ở đây buồn chán biết bao, thế nên anh mới tranh thủ sang đây thật sớm."
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line2.mp3",
        "duration": 2.54,
        "hanzi": "你能来，我太高兴了！",
        "pinyin": "Nǐ néng lái, wǒ tài gāoxìng le!",
        "vietnamese": "Anh sang được là em vui lắm rồi!"
      },
      {
        "lineIndex": 3,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line3.mp3",
        "duration": 2.3,
        "hanzi": "一飞，你旁边这位是？",
        "pinyin": "Yīfēi, nǐ pángbiān zhè wèi shì?",
        "vietnamese": "Nhất Phi à, người bên cạnh em đây là ai thế?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line4.mp3",
        "duration": 7.01,
        "hanzi": "同乐，这是李文，他在我们学校学医。李文，这是我男朋友杨同乐。",
        "pinyin": "Tónglè, zhè shì Lǐ Wén, tā zài wǒmen xuéxiào xué yī. Lǐ Wén, zhè shì wǒ nánpéngyou Yáng Tónglè.",
        "vietnamese": "Đồng Nhạc, đây là Lý Văn, em ấy học y ở trường em. Lý Văn, đây là bạn trai cô, anh Dương Đồng Nhạc."
      },
      {
        "lineIndex": 5,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line5.mp3",
        "duration": 2.35,
        "hanzi": "李文，很高兴认识你！",
        "pinyin": "Lǐ Wén, hěn gāoxìng rènshi nǐ!",
        "vietnamese": "Chào Lý Văn, rất vui được làm quen với em nhé!"
      },
      {
        "lineIndex": 6,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t2_line6.mp3",
        "duration": 5.4,
        "hanzi": "认识你我也很高兴！我家就在前面那个楼，有时间来玩。",
        "pinyin": "Rènshi nǐ wǒ yě hěn gāoxìng! Wǒ jiā jiù zài qiánmiàn nàge lóu, yǒu shíjiān lái wán.",
        "vietnamese": "Làm quen với anh em cũng rất vui! Nhà em ở ngay tòa nhà phía trước kia, khi nào rảnh mời anh qua chơi ạ."
      }
    ]
  },
  "hsk2-l14-t3": {
    "id": "hsk2-l14-t3",
    "lesson": 14,
    "textIndex": 3,
    "title": "课文 3: 在王一飞家里 (Bài khóa 3: Tại nhà cô Vương Nhất Phi)",
    "context": "在王一飞家里，王一飞和杨同乐在客厅聊天儿。(Tại nhà của Vương Nhất Phi, cô và Dương Đồng Nhạc đang ngồi trò chuyện ở phòng khách).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l14-t3_full.mp3",
    "totalDuration": 30.04,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.49,
        "duration": 4.49
      },
      {
        "lineIndex": 1,
        "start": 4.89,
        "end": 10.05,
        "duration": 5.16
      },
      {
        "lineIndex": 2,
        "start": 10.45,
        "end": 13.43,
        "duration": 2.98
      },
      {
        "lineIndex": 3,
        "start": 13.83,
        "end": 17.67,
        "duration": 3.84
      },
      {
        "lineIndex": 4,
        "start": 18.07,
        "end": 21.96,
        "duration": 3.89
      },
      {
        "lineIndex": 5,
        "start": 22.36,
        "end": 25.5,
        "duration": 3.14
      },
      {
        "lineIndex": 6,
        "start": 25.9,
        "end": 29.67,
        "duration": 3.77
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line0.mp3",
        "duration": 4.49,
        "hanzi": "一飞，你住的房子真不错，很大，离学校也不远。",
        "pinyin": "Yīfēi, nǐ zhù de fángzi zhēn búcuò, hěn dà, lí xuéxiào yě bù yuǎn.",
        "vietnamese": "Nhất Phi ơi, căn nhà em thuê thích thật đấy, vừa rộng lại còn gần trường nữa."
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line1.mp3",
        "duration": 5.16,
        "hanzi": "是啊！我楼下还住着一家中国人，他们人很好。",
        "pinyin": "Shì a! Wǒ lóu xià hái zhùzhe yì jiā Zhōngguó rén, tāmen rén hěn hǎo.",
        "vietnamese": "Vâng anh! Dưới tầng nhà em còn có một gia đình người Trung Quốc sinh sống, mọi người tốt bụng lắm."
      },
      {
        "lineIndex": 2,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line2.mp3",
        "duration": 2.98,
        "hanzi": "这样你有事情就可以找他们帮忙。",
        "pinyin": "Zhèyàng nǐ yǒu shìqing jiù kěyǐ zhǎo tāmen bāngmáng.",
        "vietnamese": "Như thế em có việc gì cần thì có thể nhờ họ giúp đỡ."
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line3.mp3",
        "duration": 3.84,
        "hanzi": "对，我也帮他们家的小孩儿学中文。",
        "pinyin": "Duì, wǒ yě bāng tāmen jiā de xiǎoháir xué Zhōngwén.",
        "vietnamese": "Vâng, em cũng thỉnh thoảng kèm con của họ học tiếng Trung nữa."
      },
      {
        "lineIndex": 4,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line4.mp3",
        "duration": 3.89,
        "hanzi": "我记得你跟我说过，是个女孩子，学得也很好。",
        "pinyin": "Wǒ jìde nǐ gēn wǒ shuōguo, shì gè nǚháir, xué de yě hěn hǎo.",
        "vietnamese": "Anh nhớ em từng kể với anh rồi, là một bé gái, học cũng giỏi lắm đúng không."
      },
      {
        "lineIndex": 5,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line5.mp3",
        "duration": 3.14,
        "hanzi": "没错，她经常跑上来找我玩。",
        "pinyin": "Méi cuò, tā jīngcháng pǎo shànglái zhǎo wǒ wán.",
        "vietnamese": "Đúng rồi anh, bé hay chạy tót lên nhà tìm em chơi đùa."
      },
      {
        "lineIndex": 6,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên công sở hiện đại 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t3_line6.mp3",
        "duration": 3.77,
        "hanzi": "你问问他们什么时候有时间，我请他们吃个饭。",
        "pinyin": "Nǐ wènwen tāmen shénme shíhou yǒu shíjiān, wǒ qǐng tāmen chī gè fàn.",
        "vietnamese": "Em hỏi xem khi nào họ rảnh rỗi, anh mời cả nhà họ đi ăn một bữa cơm nhé."
      }
    ]
  },
  "hsk2-l14-t4": {
    "id": "hsk2-l14-t4",
    "lesson": 14,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
    "context": "在房间，王一飞在写日记。(Trong phòng, cô Vương Nhất Phi viết nhật ký chia sẻ về bạn trai Dương Đồng Nhạc).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l14-t4_full.mp3",
    "totalDuration": 17.74,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 17.74,
        "duration": 17.74
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l14-t4_line0.mp3",
        "duration": 17.74,
        "hanzi": "我男朋友姓杨，叫杨同乐。他高个子、大眼睛，唱歌唱得很好，跳舞跳得也不错。他和我姐姐一起工作，是姐姐介绍我们认识的。他告诉我，从见到我的第一天开始，他就喜欢上我了。",
        "pinyin": "Wǒ nánpéngyou xìng Yáng, jiào Yáng Tónglè. Tā gāo gèzi, dà yǎnjing, chànggē chàng de hěn hǎo, tiàowǔ tiào de yě búcuò. Tā hé wǒ jiějie yìqǐ gōngzuò, shì jiějie jièshào wǒmen rènshi de. Tā gàosu wǒ, cóng jiàndào wǒ de dì-yī tiān kāishǐ, tā jiù xǐhuan shàng wǒ le.",
        "vietnamese": "Bạn trai của mình họ Dương, tên là Dương Đồng Nhạc. Anh ấy dáng người cao ráo, đôi mắt to sáng, hát rất hay và khiêu vũ cũng rất cừ. Anh ấy làm việc chung công ty với chị gái mình, và chính chị gái là người se duyên cho hai đứa quen nhau. Anh ấy thổ lộ rằng, ngay từ khoảnh khắc đầu tiên nhìn thấy mình, anh ấy đã đem lòng yêu mình rồi."
      }
    ]
  },
  "hsk2-l15-t1": {
    "id": "hsk2-l15-t1",
    "lesson": 15,
    "textIndex": 1,
    "title": "课文 1: 在教室 (Bài khóa 1: Trong lớp học)",
    "context": "在教室，同学们在考试。(Trong lớp học, các bạn học sinh đang thi và chia sẻ dự định sau kỳ thi).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l15-t1_full.mp3",
    "totalDuration": 25.4,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 5.71,
        "duration": 5.71
      },
      {
        "lineIndex": 1,
        "start": 6.11,
        "end": 8.8,
        "duration": 2.69
      },
      {
        "lineIndex": 2,
        "start": 9.2,
        "end": 11.26,
        "duration": 2.06
      },
      {
        "lineIndex": 3,
        "start": 11.66,
        "end": 14.64,
        "duration": 2.98
      },
      {
        "lineIndex": 4,
        "start": 15.04,
        "end": 20.58,
        "duration": 5.54
      },
      {
        "lineIndex": 5,
        "start": 20.98,
        "end": 25.08,
        "duration": 4.1
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t1_line0.mp3",
        "duration": 5.71,
        "hanzi": "考试就要开始了，请大家写上姓名，写好后就可以做题了。",
        "pinyin": "Kǎoshì jiù yào kāishǐ le, qǐng dàjiā xiěshàng xìngmíng, xiěhǎo hòu jiù kěyǐ zuò tí le.",
        "vietnamese": "Giờ thi sắp bắt đầu rồi, mời các em ghi rõ họ tên, ghi xong là có thể bắt đầu làm bài nhé."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t1_line1.mp3",
        "duration": 2.69,
        "hanzi": "老师，我做完了。",
        "pinyin": "Lǎoshī, wǒ zuòwán le.",
        "vietnamese": "Thưa cô, em làm bài xong rồi ạ."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Du học sinh Thái Lan 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t1_line2.mp3",
        "duration": 2.06,
        "hanzi": "老师，我也做完了。",
        "pinyin": "Lǎoshī, wǒ yě zuòwán le.",
        "vietnamese": "Thưa cô, em cũng làm xong rồi ạ."
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t1_line3.mp3",
        "duration": 2.98,
        "hanzi": "对了，你们考完试想做什么？",
        "pinyin": "Duìle, nǐmen kǎowán shì xiǎng zuò shénme?",
        "vietnamese": "Đúng rồi, thi cử xong xuôi các em định làm gì thế?"
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t1_line4.mp3",
        "duration": 5.54,
        "hanzi": "我很想去中国，虽然去过一次，但是很想再去一次。",
        "pinyin": "Wǒ hěn xiǎng qù Zhōngguó, suīrán qùguo yí cì, dànshì hěn xiǎng zài qù yí cì.",
        "vietnamese": "Em rất muốn đi Trung Quốc ạ, tuy đã từng đi một lần nhưng em vẫn rất muốn được đến đó thêm một lần nữa."
      },
      {
        "lineIndex": 5,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t1_line5.mp3",
        "duration": 4.1,
        "hanzi": "不错，到中国后你就可以经常说中文了。",
        "pinyin": "Búcuò, dào Zhōngguó hòu nǐ jiù kěyǐ jīngcháng shuō Zhōngwén le.",
        "vietnamese": "Ý kiến hay đó, sang tới Trung Quốc rồi em sẽ có nhiều cơ hội thường xuyên rèn luyện nói tiếng Trung."
      }
    ]
  },
  "hsk2-l15-t2": {
    "id": "hsk2-l15-t2",
    "lesson": 15,
    "textIndex": 2,
    "title": "课文 2: 在咖啡店 (Bài khóa 2: Ở quán cà phê)",
    "context": "在咖啡店，李文和白家月在聊天儿。(Tại quán cà phê, Lý Văn và Bạch Gia Nguyệt đang trò chuyện về kế hoạch du lịch Bắc Kinh sau kỳ thi).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l15-t2_full.mp3",
    "totalDuration": 39.39,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 4.27,
        "duration": 4.27
      },
      {
        "lineIndex": 1,
        "start": 4.67,
        "end": 6.54,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 6.94,
        "end": 9.44,
        "duration": 2.5
      },
      {
        "lineIndex": 3,
        "start": 9.84,
        "end": 12.07,
        "duration": 2.23
      },
      {
        "lineIndex": 4,
        "start": 12.47,
        "end": 19.31,
        "duration": 6.84
      },
      {
        "lineIndex": 5,
        "start": 19.71,
        "end": 22.16,
        "duration": 2.45
      },
      {
        "lineIndex": 6,
        "start": 22.56,
        "end": 27.62,
        "duration": 5.06
      },
      {
        "lineIndex": 7,
        "start": 28.02,
        "end": 33.52,
        "duration": 5.5
      },
      {
        "lineIndex": 8,
        "start": 33.92,
        "end": 38.89,
        "duration": 4.97
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line0.mp3",
        "duration": 4.27,
        "hanzi": "考完试了，我现在可以出国旅游了。",
        "pinyin": "Kǎowán shì le, wǒ xiànzài kěyǐ chūguó lǚyóu le.",
        "vietnamese": "Thi xong rồi, bây giờ tớ có thể đi du lịch nước ngoài rồi."
      },
      {
        "lineIndex": 1,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line1.mp3",
        "duration": 1.87,
        "hanzi": "你要去哪儿？",
        "pinyin": "Nǐ yào qù nǎr?",
        "vietnamese": "Cậu định đi đâu thế?"
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line2.mp3",
        "duration": 2.5,
        "hanzi": "我要再去一次北京。",
        "pinyin": "Wǒ yào zài qù yí cì Běijīng.",
        "vietnamese": "Tớ muốn đi Bắc Kinh thêm một lần nữa."
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line3.mp3",
        "duration": 2.23,
        "hanzi": "为什么还去北京？",
        "pinyin": "Wèishénme hái qù Běijīng?",
        "vietnamese": "Sao cậu lại muốn đi Bắc Kinh tiếp thế?"
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line4.mp3",
        "duration": 6.84,
        "hanzi": "因为我想再吃一次烤鸭，再喝一次奶茶，再去北京大学看一次电影……",
        "pinyin": "Yīnwèi wǒ xiǎng zài chī yí cì kǎoyā, zài hē yí cì nǎichá, zài qù Běijīng Dàxué kàn yí cì diànyǐng...",
        "vietnamese": "Bởi vì tớ muốn được ăn vịt quay Bắc Kinh một lần nữa, muốn uống trà sữa một lần nữa, và muốn vào Đại học Bắc Kinh xem phim thêm lần nữa..."
      },
      {
        "lineIndex": 5,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line5.mp3",
        "duration": 2.45,
        "hanzi": "你想做的事情很多啊！",
        "pinyin": "Nǐ xiǎng zuò de shìqing hěn duō a!",
        "vietnamese": "Những việc cậu muốn làm nhiều thật đấy!"
      },
      {
        "lineIndex": 6,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line6.mp3",
        "duration": 5.06,
        "hanzi": "是啊，你看，我还在网上买好颐和园的门票了呢。",
        "pinyin": "Shì a, nǐ kàn, wǒ hái zài wǎngshang mǎihǎo Yíhé Yuán de ménpiào le ne.",
        "vietnamese": "Đúng vậy, cậu nhìn xem, tớ còn mua xong cả vé tham quan Di Hòa Viên trên mạng rồi kìa."
      },
      {
        "lineIndex": 7,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line7.mp3",
        "duration": 5.5,
        "hanzi": "我的高中同学就在颐和园上班，可以让他给你好好介绍介绍。",
        "pinyin": "Wǒ de gāozhōng tóngxué jiù zài Yíhé Yuán shàngbān, kěyǐ ràng tā gěi nǐ hǎohāo jièshào jièshao.",
        "vietnamese": "Bạn học cấp ba của tớ đang làm việc ở Di Hòa Viên đấy, để tớ nhờ cậu ấy hướng dẫn giới thiệu cặn kẽ cho cậu."
      },
      {
        "lineIndex": 8,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t2_line8.mp3",
        "duration": 4.97,
        "hanzi": "太好了！出门旅游，多个朋友多条路。",
        "pinyin": "Tài hǎo le! Chūmén lǚyóu, duō gè péngyou duō tiáo lù.",
        "vietnamese": "Tuyệt vời quá! Ra ngoài đi du lịch, có thêm một người bạn là có thêm một lối đi mà."
      }
    ]
  },
  "hsk2-l15-t3": {
    "id": "hsk2-l15-t3",
    "lesson": 15,
    "textIndex": 3,
    "title": "课文 3: 在咖啡店 (Bài khóa 3: Ở quán cà phê)",
    "context": "在咖啡店，李文和白家月在聊天儿。(Tại quán cà phê, Lý Văn và Bạch Gia Nguyệt bàn về chuyện mua vé máy bay bay về Bắc Kinh).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l15-t3_full.mp3",
    "totalDuration": 32.01,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.34,
        "duration": 3.34
      },
      {
        "lineIndex": 1,
        "start": 3.74,
        "end": 8.13,
        "duration": 4.39
      },
      {
        "lineIndex": 2,
        "start": 8.53,
        "end": 13.28,
        "duration": 4.75
      },
      {
        "lineIndex": 3,
        "start": 13.68,
        "end": 15.55,
        "duration": 1.87
      },
      {
        "lineIndex": 4,
        "start": 15.95,
        "end": 19.48,
        "duration": 3.53
      },
      {
        "lineIndex": 5,
        "start": 19.88,
        "end": 24.56,
        "duration": 4.68
      },
      {
        "lineIndex": 6,
        "start": 24.96,
        "end": 31.63,
        "duration": 6.67
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line0.mp3",
        "duration": 3.34,
        "hanzi": "李文，你有一年没回国了吧？",
        "pinyin": "Lǐ Wén, nǐ yǒu yì nián méi huíguó le ba?",
        "vietnamese": "Lý Văn, cậu có đến một năm chưa về nước rồi nhỉ?"
      },
      {
        "lineIndex": 1,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line1.mp3",
        "duration": 4.39,
        "hanzi": "不到一年。我六月的时候回去了一次。",
        "pinyin": "Bú dào yì nián. Wǒ Liùyuè de shíhou huíqùle yí cì.",
        "vietnamese": "Chưa đến một năm đâu. Hồi tháng sáu tớ có bay về một lần rồi."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line2.mp3",
        "duration": 4.75,
        "hanzi": "我怎么忘了？还是我送你去的机场呢。",
        "pinyin": "Wǒ zěnme wàng le? Hái shì wǒ sòng nǐ qù de jīchǎng ne.",
        "vietnamese": "Sao tớ lại quên mất nhỉ? Hôm đó chính tớ là người tiễn cậu ra tận sân bay mà."
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line3.mp3",
        "duration": 1.87,
        "hanzi": "是啊。",
        "pinyin": "Shì a.",
        "vietnamese": "Đúng thế mà."
      },
      {
        "lineIndex": 4,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line4.mp3",
        "duration": 3.53,
        "hanzi": "我记得你那次的机票很便宜。",
        "pinyin": "Wǒ jìde nǐ nà cì de jīpiào hěn piányi.",
        "vietnamese": "Tớ nhớ vé máy bay đợt đấy của cậu rẻ lắm."
      },
      {
        "lineIndex": 5,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line5.mp3",
        "duration": 4.68,
        "hanzi": "没错，可能因为那个时候去北京的人不多吧。",
        "pinyin": "Méi cuò, kěnéng yīnwèi nàge shíhou qù Běijīng de rén bù duō ba.",
        "vietnamese": "Đúng vậy, chắc là vì đợt đó ít người bay đến Bắc Kinh."
      },
      {
        "lineIndex": 6,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t3_line6.mp3",
        "duration": 6.67,
        "hanzi": "这次的机票虽然有点儿贵，但想到就要飞北京了，我还是很高兴的。",
        "pinyin": "Zhè cì de jīpiào suīrán yǒudiǎnr guì, dàn xiǎngdào jiù yào fēi Běijīng le, wǒ hái shì hěn gāoxìng de.",
        "vietnamese": "Vé máy bay đợt này tuy hơi đắt một chút, nhưng cứ nghĩ sắp được bay đến Bắc Kinh là tớ lại thấy vui phơi phới rồi."
      }
    ]
  },
  "hsk2-l15-t4": {
    "id": "hsk2-l15-t4",
    "lesson": 15,
    "textIndex": 4,
    "title": "课文 4: 在房间 (Bài khóa 4: Trong phòng)",
    "context": "在房间，李文在写日记。(Trong phòng, Lý Văn viết nhật ký về cảm xúc nhớ nhà và kế hoạch cùng Bạch Gia Nguyệt bay về Bắc Kinh đón Tết).",
    "fullAudioUrl": "/audio/coursebook/hsk2-l15-t4_full.mp3",
    "totalDuration": 18.46,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 18.46,
        "duration": 18.46
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh viên y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk2-l15-t4_line0.mp3",
        "duration": 18.46,
        "hanzi": "我六月的时候回过一次北京，现在有半年多没回去了，我有点儿想家。就要过年了，我要回家过年。家月这次也要去北京，我们都是星期五的飞机。家月说我们好像小鸟，一起飞到北京，再一起飞回这里。",
        "pinyin": "Wǒ Liùyuè de shíhou huíguo yí cì Běijīng, xiànzài yǒu bàn nián duō méi huíqù le, wǒ yǒudiǎnr xiǎng jiā. Jiù yào guònián le, wǒ yào huí jiā guònián. Jiāyuè zhè cì yě yào qù Běijīng, wǒmen dōu shì Xīngqīwǔ de fēijī. Jiāyuè shuō wǒmen hǎoxiàng xiǎoniǎo, yìqǐ fēidào Běijīng, zài yìqǐ fēihuí zhèlǐ.",
        "vietnamese": "Hồi tháng sáu mình từng về Bắc Kinh một lần, đến nay đã hơn nửa năm chưa về lại rồi, mình thấy hơi nhớ nhà. Sắp đến Tết rồi, mình sẽ về quê ăn Tết. Đợt này Gia Nguyệt cũng đi Bắc Kinh, cả hai đứa mình đều bay chuyến thứ Sáu. Gia Nguyệt bảo tụi mình giống như đôi chim nhỏ, cùng bay tới Bắc Kinh rồi lại cùng nhau bay về lại nơi đây."
      }
    ]
  },
  "hsk1-l3-t1": {
    "id": "hsk1-l3-t1",
    "lesson": 3,
    "textIndex": 1,
    "title": "课文 1: 在校园里 (Bài khóa 1: Trên sân trường)",
    "context": "在校园里，李文和白家月第一次相遇，两人继续聊天儿。(Trên sân trường, Lý Văn và Bạch Gia Nguyệt lần đầu gặp nhau, hai người tiếp tục trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l3-t1_full.mp3",
    "totalDuration": 7.62,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.99,
        "duration": 1.99
      },
      {
        "lineIndex": 1,
        "start": 2.39,
        "end": 7.55,
        "duration": 5.16
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t1_line0.mp3",
        "duration": 1.99,
        "hanzi": "我是中国人。",
        "pinyin": "Wǒ shì Zhōngguó rén.",
        "vietnamese": "Tôi là người Trung Quốc."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t1_line1.mp3",
        "duration": 5.16,
        "hanzi": "我是法国人。我的中文老师也是中国人。",
        "pinyin": "Wǒ shì Fǎguó rén. Wǒ de Zhōngwén lǎoshī yě shì Zhōngguó rén.",
        "vietnamese": "Tôi là người Pháp. Giáo viên tiếng Trung của tôi cũng là người Trung Quốc."
      }
    ]
  },
  "hsk1-l3-t2": {
    "id": "hsk1-l3-t2",
    "lesson": 3,
    "textIndex": 2,
    "title": "课文 2: 在教室里 (Bài khóa 2: Trong lớp học)",
    "context": "在教室里，下课后，安妮在看陈天中手机里的照片。(Trong lớp học, sau giờ học, Annie xem ảnh trên điện thoại của Trần Thiên Trung).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l3-t2_full.mp3",
    "totalDuration": 9.5,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.87,
        "duration": 1.87
      },
      {
        "lineIndex": 1,
        "start": 2.27,
        "end": 4.14,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 4.54,
        "end": 7.04,
        "duration": 2.5
      },
      {
        "lineIndex": 3,
        "start": 7.44,
        "end": 9.31,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t2_line0.mp3",
        "duration": 1.87,
        "hanzi": "这是谁？",
        "pinyin": "Zhè shì shéi?",
        "vietnamese": "Đây là ai?"
      },
      {
        "lineIndex": 1,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t2_line1.mp3",
        "duration": 1.87,
        "hanzi": "这是我女朋友。",
        "pinyin": "Zhè shì wǒ nǚpéngyou.",
        "vietnamese": "Đây là bạn gái của tôi."
      },
      {
        "lineIndex": 2,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t2_line2.mp3",
        "duration": 2.5,
        "hanzi": "你女朋友是哪国人？",
        "pinyin": "Nǐ nǚpéngyou shì nǎ guó rén?",
        "vietnamese": "Bạn gái của bạn là người nước nào?"
      },
      {
        "lineIndex": 3,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t2_line3.mp3",
        "duration": 1.87,
        "hanzi": "她也是泰国人。",
        "pinyin": "Tā yě shì Tàiguó rén.",
        "vietnamese": "Cô ấy cũng là người Thái Lan."
      }
    ]
  },
  "hsk1-l3-t3": {
    "id": "hsk1-l3-t3",
    "lesson": 3,
    "textIndex": 3,
    "title": "课文 3: 在家里 (Bài khóa 3: Ở nhà)",
    "context": "在家里，王一雪给王一飞打视频电话。(Ở nhà, Vương Nhất Tuyết gọi điện thoại video cho cô giáo Vương Nhất Phi).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l3-t3_full.mp3",
    "totalDuration": 17.51,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.14,
        "duration": 2.14
      },
      {
        "lineIndex": 1,
        "start": 2.54,
        "end": 4.41,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 4.81,
        "end": 7.14,
        "duration": 2.33
      },
      {
        "lineIndex": 3,
        "start": 7.54,
        "end": 11.07,
        "duration": 3.53
      },
      {
        "lineIndex": 4,
        "start": 11.47,
        "end": 14.93,
        "duration": 3.46
      },
      {
        "lineIndex": 5,
        "start": 15.33,
        "end": 17.2,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t3_line0.mp3",
        "duration": 2.14,
        "hanzi": "喂，一飞！",
        "pinyin": "Wèi, Yīfēi!",
        "vietnamese": "A lô, Nhất Phi à!"
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t3_line1.mp3",
        "duration": 1.87,
        "hanzi": "姐姐！",
        "pinyin": "Jiějie!",
        "vietnamese": "Chị gái!"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t3_line2.mp3",
        "duration": 2.33,
        "hanzi": "你工作还忙吗？",
        "pinyin": "Nǐ gōngzuò hái máng ma?",
        "vietnamese": "Công việc của em còn bận không?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t3_line3.mp3",
        "duration": 3.53,
        "hanzi": "对，还很忙。你也很忙吗？",
        "pinyin": "Duì, hái hěn máng. Nǐ yě hěn máng ma?",
        "vietnamese": "Vâng, vẫn bận lắm ạ. Chị cũng bận lắm ạ?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t3_line4.mp3",
        "duration": 3.46,
        "hanzi": "我不太忙。我们很想你。",
        "pinyin": "Wǒ bú tài máng. Wǒmen hěn xiǎng nǐ.",
        "vietnamese": "Chị không bận lắm. Cả nhà nhớ em lắm đấy."
      },
      {
        "lineIndex": 5,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l3-t3_line5.mp3",
        "duration": 1.87,
        "hanzi": "我也很想你们。",
        "pinyin": "Wǒ yě hěn xiǎng nǐmen.",
        "vietnamese": "Em cũng rất nhớ mọi người ạ."
      }
    ]
  },
  "hsk1-l4-t1": {
    "id": "hsk1-l4-t1",
    "lesson": 4,
    "textIndex": 1,
    "title": "课文 1: 在家里 (Bài khóa 1: Ở nhà)",
    "context": "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l4-t1_full.mp3",
    "totalDuration": 10.15,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.92,
        "duration": 1.92
      },
      {
        "lineIndex": 1,
        "start": 2.32,
        "end": 4.19,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 4.59,
        "end": 7.04,
        "duration": 2.45
      },
      {
        "lineIndex": 3,
        "start": 7.44,
        "end": 9.96,
        "duration": 2.52
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t1_line0.mp3",
        "duration": 1.92,
        "hanzi": "一飞忙吗？",
        "pinyin": "Yīfēi máng ma?",
        "vietnamese": "Nhất Phi có bận không?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t1_line1.mp3",
        "duration": 1.87,
        "hanzi": "她很忙。",
        "pinyin": "Tā hěn máng.",
        "vietnamese": "Em ấy rất bận."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t1_line2.mp3",
        "duration": 2.45,
        "hanzi": "她有多少个学生？",
        "pinyin": "Tā yǒu duōshao gè xuésheng?",
        "vietnamese": "Em ấy có bao nhiêu học sinh?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t1_line3.mp3",
        "duration": 2.52,
        "hanzi": "她有二十个学生。",
        "pinyin": "Tā yǒu èrshí gè xuésheng.",
        "vietnamese": "Em ấy có hai mươi học sinh."
      }
    ]
  },
  "hsk1-l4-t2": {
    "id": "hsk1-l4-t2",
    "lesson": 4,
    "textIndex": 2,
    "title": "课文 2: 在公司里 (Bài khóa 2: Ở công ty)",
    "context": "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Lạc nghỉ giải lao trò chuyện).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l4-t2_full.mp3",
    "totalDuration": 12.62,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.14,
        "duration": 3.14
      },
      {
        "lineIndex": 1,
        "start": 3.54,
        "end": 5.41,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 5.81,
        "end": 7.99,
        "duration": 2.18
      },
      {
        "lineIndex": 3,
        "start": 8.39,
        "end": 12.42,
        "duration": 4.03
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t2_line0.mp3",
        "duration": 3.14,
        "hanzi": "我有两个哥哥，你呢？",
        "pinyin": "Wǒ yǒu liǎng gè gēge, nǐ ne?",
        "vietnamese": "Chị có hai người anh trai, còn em thì sao?"
      },
      {
        "lineIndex": 1,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t2_line1.mp3",
        "duration": 1.87,
        "hanzi": "我没有哥哥。",
        "pinyin": "Wǒ méiyǒu gēge.",
        "vietnamese": "Em không có anh trai."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t2_line2.mp3",
        "duration": 2.18,
        "hanzi": "你家有几口人？",
        "pinyin": "Nǐ jiā yǒu jǐ kǒu rén?",
        "vietnamese": "Nhà em có mấy người?"
      },
      {
        "lineIndex": 3,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t2_line3.mp3",
        "duration": 4.03,
        "hanzi": "我家有四口人，爸爸、妈妈、妹妹和我。",
        "pinyin": "Wǒ jiā yǒu sì kǒu rén, bàba, māma, mèimei hé wǒ.",
        "vietnamese": "Nhà em có bốn người: bố, mẹ, em gái và em."
      }
    ]
  },
  "hsk1-l4-t3": {
    "id": "hsk1-l4-t3",
    "lesson": 4,
    "textIndex": 3,
    "title": "课文 3: 在街上 (Bài khóa 3: Trên đường phố)",
    "context": "在街上，王一雪带着儿子偶遇杨同乐。(Trên đường, Vương Nhất Tuyết dắt con trai tình cờ gặp Dương Đồng Lạc).",
    "fullAudioUrl": "/audio/coursebook/hsk1-l4-t3_full.mp3",
    "totalDuration": 17.68,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.87,
        "duration": 1.87
      },
      {
        "lineIndex": 1,
        "start": 2.27,
        "end": 7.6,
        "duration": 5.33
      },
      {
        "lineIndex": 2,
        "start": 8.0,
        "end": 9.87,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 10.27,
        "end": 12.5,
        "duration": 2.23
      },
      {
        "lineIndex": 4,
        "start": 12.9,
        "end": 14.77,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 15.17,
        "end": 17.35,
        "duration": 2.18
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t3_line0.mp3",
        "duration": 1.87,
        "hanzi": "这是您儿子吗？",
        "pinyin": "Zhè shì nín érzi ma?",
        "vietnamese": "Đây là con trai chị phải không ạ?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t3_line1.mp3",
        "duration": 5.33,
        "hanzi": "是的。我有两个孩子，一个儿子，一个女儿。",
        "pinyin": "Shì de. Wǒ yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ'ér.",
        "vietnamese": "Đúng vậy. Chị có hai đứa con, một con trai, một con gái."
      },
      {
        "lineIndex": 2,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t3_line2.mp3",
        "duration": 1.87,
        "hanzi": "您儿子几岁？",
        "pinyin": "Nín érzi jǐ suì?",
        "vietnamese": "Cháu trai năm nay mấy tuổi rồi ạ?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t3_line3.mp3",
        "duration": 2.23,
        "hanzi": "他今年五岁。",
        "pinyin": "Tā jīnnián wǔ suì.",
        "vietnamese": "Cháu năm nay năm tuổi."
      },
      {
        "lineIndex": 4,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t3_line4.mp3",
        "duration": 1.87,
        "hanzi": "您女儿多大？",
        "pinyin": "Nín nǚ'ér duō dà?",
        "vietnamese": "Con gái chị bao nhiêu tuổi rồi ạ?"
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l4-t3_line5.mp3",
        "duration": 2.18,
        "hanzi": "她今年十二。",
        "pinyin": "Tā jīnnián shí'èr.",
        "vietnamese": "Cháu năm nay mười hai tuổi."
      }
    ]
  },
  "hsk1-l5-t1": {
    "id": "hsk1-l5-t1",
    "lesson": 5,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang trò chuyện.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l5-t1_full.mp3",
    "totalDuration": 11.23,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.02,
        "duration": 2.02
      },
      {
        "lineIndex": 1,
        "start": 2.42,
        "end": 4.87,
        "duration": 2.45
      },
      {
        "lineIndex": 2,
        "start": 5.27,
        "end": 7.14,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 7.54,
        "end": 11.04,
        "duration": 3.5
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t1_line0.mp3",
        "duration": 2.02,
        "hanzi": "今天几号？",
        "pinyin": "Jīntiān jǐ hào?",
        "vietnamese": "Hôm nay ngày mấy?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t1_line1.mp3",
        "duration": 2.45,
        "hanzi": "今天9月8号。",
        "pinyin": "Jīntiān jiǔ yuè bā hào.",
        "vietnamese": "Hôm nay ngày 8 tháng 9."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t1_line2.mp3",
        "duration": 1.87,
        "hanzi": "星期几？",
        "pinyin": "Xīngqī jǐ?",
        "vietnamese": "Thứ mấy?"
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t1_line3.mp3",
        "duration": 3.5,
        "hanzi": "星期日。今天我休息。",
        "pinyin": "Xīngqīrì. Jīntiān wǒ xiūxi.",
        "vietnamese": "Chủ nhật. Hôm nay tôi nghỉ."
      }
    ]
  },
  "hsk1-l5-t2": {
    "id": "hsk1-l5-t2",
    "lesson": 5,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在公司里，王一雪和杨同乐休息时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l5-t2_full.mp3",
    "totalDuration": 13.27,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.26,
        "duration": 2.26
      },
      {
        "lineIndex": 1,
        "start": 2.66,
        "end": 4.53,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 4.93,
        "end": 7.23,
        "duration": 2.3
      },
      {
        "lineIndex": 3,
        "start": 7.63,
        "end": 13.08,
        "duration": 5.45
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t2_line0.mp3",
        "duration": 2.26,
        "hanzi": "你会做饭吗？",
        "pinyin": "Nǐ huì zuòfàn ma?",
        "vietnamese": "Bạn có biết nấu ăn không?"
      },
      {
        "lineIndex": 1,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t2_line1.mp3",
        "duration": 1.87,
        "hanzi": "我会做。",
        "pinyin": "Wǒ huì zuò.",
        "vietnamese": "Tôi biết nấu."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t2_line2.mp3",
        "duration": 2.3,
        "hanzi": "你会做什么？",
        "pinyin": "Nǐ huì zuò shénme?",
        "vietnamese": "Bạn biết làm món gì?"
      },
      {
        "lineIndex": 3,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t2_line3.mp3",
        "duration": 5.45,
        "hanzi": "我会做面条儿、饺子，也会做一些菜。星期天我也做饭。",
        "pinyin": "Wǒ huì zuò miàntiáor, jiǎozi, yě huì zuò yīxiē cài. Xīngqītiān wǒ yě zuòfàn.",
        "vietnamese": "Tôi biết làm mì, sủi cảo và cũng biết làm một số món. Chủ nhật tôi cũng nấu ăn."
      }
    ]
  },
  "hsk1-l5-t3": {
    "id": "hsk1-l5-t3",
    "lesson": 5,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在公司里，王一雪和杨同乐下班时聊天儿。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc nói chuyện lúc tan ca.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l5-t3_full.mp3",
    "totalDuration": 15.59,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.52,
        "duration": 2.52
      },
      {
        "lineIndex": 1,
        "start": 2.92,
        "end": 4.79,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 5.19,
        "end": 8.09,
        "duration": 2.9
      },
      {
        "lineIndex": 3,
        "start": 8.49,
        "end": 10.72,
        "duration": 2.23
      },
      {
        "lineIndex": 4,
        "start": 11.12,
        "end": 12.99,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 13.39,
        "end": 15.26,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t3_line0.mp3",
        "duration": 2.52,
        "hanzi": "同乐，下班吗？",
        "pinyin": "Tónglè, xiàbān ma?",
        "vietnamese": "Đồng Nhạc, tan ca rồi à?"
      },
      {
        "lineIndex": 1,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t3_line1.mp3",
        "duration": 1.87,
        "hanzi": "下班。",
        "pinyin": "Xiàbān.",
        "vietnamese": "Tan ca rồi."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t3_line2.mp3",
        "duration": 2.9,
        "hanzi": "这是你的新电脑吗？",
        "pinyin": "Zhè shì nǐ de xīn diànnǎo ma?",
        "vietnamese": "Đây là máy tính mới của bạn à?"
      },
      {
        "lineIndex": 3,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t3_line3.mp3",
        "duration": 2.23,
        "hanzi": "是的，是我的新电脑。",
        "pinyin": "Shì de, shì wǒ de xīn diànnǎo.",
        "vietnamese": "Vâng, đây là máy tính mới của tôi."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t3_line4.mp3",
        "duration": 1.87,
        "hanzi": "真好看！",
        "pinyin": "Zhēn hǎokàn!",
        "vietnamese": "Đẹp thật!"
      },
      {
        "lineIndex": 5,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l5-t3_line5.mp3",
        "duration": 1.87,
        "hanzi": "我也很喜欢它。",
        "pinyin": "Wǒ yě hěn xǐhuan tā.",
        "vietnamese": "Tôi cũng rất thích nó."
      }
    ]
  },
  "hsk1-l6-t1": {
    "id": "hsk1-l6-t1",
    "lesson": 6,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在校园里，李文向白家月要手机号。(Trong khuôn viên trường, Lý Văn hỏi xin số điện thoại của Bạch Gia Nguyệt.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l6-t1_full.mp3",
    "totalDuration": 17.59,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.26,
        "duration": 3.26
      },
      {
        "lineIndex": 1,
        "start": 3.66,
        "end": 8.72,
        "duration": 5.06
      },
      {
        "lineIndex": 2,
        "start": 9.12,
        "end": 15.12,
        "duration": 6.0
      },
      {
        "lineIndex": 3,
        "start": 15.52,
        "end": 17.39,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t1_line0.mp3",
        "duration": 3.26,
        "hanzi": "家月，你的手机号是多少？",
        "pinyin": "Jiāyuè, nǐ de shǒujīhào shì duōshao?",
        "vietnamese": "Gia Nguyệt, số điện thoại của bạn là bao nhiêu?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t1_line1.mp3",
        "duration": 5.06,
        "hanzi": "我的手机号是+33 601493190。",
        "pinyin": "Wǒ de shǒujīhào shì +33 601493190.",
        "vietnamese": "Số điện thoại của tôi là +33 601493190."
      },
      {
        "lineIndex": 2,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t1_line2.mp3",
        "duration": 6.0,
        "hanzi": "我的手机号是+86 13552721160。",
        "pinyin": "Wǒ de shǒujīhào shì +86 13552721160.",
        "vietnamese": "Số điện thoại của tôi là +86 13552721160."
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t1_line3.mp3",
        "duration": 1.87,
        "hanzi": "好的。",
        "pinyin": "Hǎo de.",
        "vietnamese": "Được rồi."
      }
    ]
  },
  "hsk1-l6-t2": {
    "id": "hsk1-l6-t2",
    "lesson": 6,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l6-t2_full.mp3",
    "totalDuration": 10.44,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.06,
        "duration": 2.06
      },
      {
        "lineIndex": 1,
        "start": 2.46,
        "end": 5.17,
        "duration": 2.71
      },
      {
        "lineIndex": 2,
        "start": 5.57,
        "end": 7.49,
        "duration": 1.92
      },
      {
        "lineIndex": 3,
        "start": 7.89,
        "end": 10.24,
        "duration": 2.35
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t2_line0.mp3",
        "duration": 2.06,
        "hanzi": "家月，明天你去哪儿？",
        "pinyin": "Jiāyuè, míngtiān nǐ qù nǎr?",
        "vietnamese": "Gia Nguyệt, ngày mai bạn đi đâu?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t2_line1.mp3",
        "duration": 2.71,
        "hanzi": "我想去超市买东西。",
        "pinyin": "Wǒ xiǎng qù chāoshì mǎi dōngxi.",
        "vietnamese": "Tôi muốn đi siêu thị mua đồ."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t2_line2.mp3",
        "duration": 1.92,
        "hanzi": "你去超市买什么？",
        "pinyin": "Nǐ qù chāoshì mǎi shénme?",
        "vietnamese": "Bạn đi siêu thị mua gì vậy?"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t2_line3.mp3",
        "duration": 2.35,
        "hanzi": "我想买些牛奶。",
        "pinyin": "Wǒ xiǎng mǎi xiē niúnǎi.",
        "vietnamese": "Tôi muốn mua sữa."
      }
    ]
  },
  "hsk1-l6-t3": {
    "id": "hsk1-l6-t3",
    "lesson": 6,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在家里，王一雪全家在讨论周末晚餐安排。(Ở nhà, cả gia đình Vương Nhất Tuyết bàn về kế hoạch ăn tối cuối tuần.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l6-t3_full.mp3",
    "totalDuration": 21.16,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.48,
        "duration": 3.48
      },
      {
        "lineIndex": 1,
        "start": 3.88,
        "end": 6.45,
        "duration": 2.57
      },
      {
        "lineIndex": 2,
        "start": 6.85,
        "end": 10.5,
        "duration": 3.65
      },
      {
        "lineIndex": 3,
        "start": 10.9,
        "end": 14.88,
        "duration": 3.98
      },
      {
        "lineIndex": 4,
        "start": 15.28,
        "end": 18.28,
        "duration": 3.0
      },
      {
        "lineIndex": 5,
        "start": 18.68,
        "end": 20.84,
        "duration": 2.16
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t3_line0.mp3",
        "duration": 3.48,
        "hanzi": "星期天我们去哪儿吃晚饭？",
        "pinyin": "Xīngqītiān wǒmen qù nǎr chī wǎnfàn?",
        "vietnamese": "Chủ nhật chúng ta đi đâu ăn tối?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t3_line1.mp3",
        "duration": 2.57,
        "hanzi": "我还想去西安饭店。",
        "pinyin": "Wǒ hái xiǎng qù Xī'ān fàndiàn.",
        "vietnamese": "Anh vẫn muốn đến nhà hàng Tây An."
      },
      {
        "lineIndex": 2,
        "speaker": "刘小雪 (Bé Tiểu Tuyết)",
        "speakerName": "刘小雪 (Bé Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Bé Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t3_line2.mp3",
        "duration": 3.65,
        "hanzi": "那边的包子非常好吃，我想吃包子。",
        "pinyin": "Nà biān de bāozi fēicháng hǎochī, wǒ xiǎng chī bāozi.",
        "vietnamese": "Bánh bao ở đó ngon lắm, con muốn ăn bánh bao."
      },
      {
        "lineIndex": 3,
        "speaker": "刘小明 (Bé Tiểu Minh)",
        "speakerName": "刘小明 (Bé Tiểu Minh)",
        "gender": "male",
        "avatar": "👦",
        "persona": "Bé Lưu Tiểu Minh (Vân Hạ - Bé trai 8 tuổi)",
        "voice": "zh-CN-YunxiaNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t3_line3.mp3",
        "duration": 3.98,
        "hanzi": "妈妈，我想吃米饭，不想吃包子。",
        "pinyin": "Māma, wǒ xiǎng chī mǐfàn, bù xiǎng chī bāozi.",
        "vietnamese": "Mẹ ơi, con muốn ăn cơm, không muốn ăn bánh bao."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t3_line4.mp3",
        "duration": 3.0,
        "hanzi": "好的。我们怎么去？",
        "pinyin": "Hǎo de. Wǒmen zěnme qù?",
        "vietnamese": "Được rồi. Chúng ta đi thế nào?"
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l6-t3_line5.mp3",
        "duration": 2.16,
        "hanzi": "坐出租车去。",
        "pinyin": "Zuò chūzūchē qù.",
        "vietnamese": "Đi taxi đi."
      }
    ]
  },
  "hsk1-l7-t1": {
    "id": "hsk1-l7-t1",
    "lesson": 7,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "白家月和安妮在打电话。(Bạch Gia Nguyệt và An Ni đang gọi điện thoại cho nhau.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l7-t1_full.mp3",
    "totalDuration": 11.59,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.99,
        "duration": 1.99
      },
      {
        "lineIndex": 1,
        "start": 2.39,
        "end": 4.65,
        "duration": 2.26
      },
      {
        "lineIndex": 2,
        "start": 5.05,
        "end": 7.95,
        "duration": 2.9
      },
      {
        "lineIndex": 3,
        "start": 8.35,
        "end": 11.4,
        "duration": 3.05
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t1_line0.mp3",
        "duration": 1.99,
        "hanzi": "现在几点？",
        "pinyin": "Xiànzài jǐ diǎn?",
        "vietnamese": "Bây giờ là mấy giờ?"
      },
      {
        "lineIndex": 1,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t1_line1.mp3",
        "duration": 2.26,
        "hanzi": "早上八点四十。",
        "pinyin": "Zǎoshang bā diǎn sìshí.",
        "vietnamese": "Sáng tám giờ bốn mươi phút."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t1_line2.mp3",
        "duration": 2.9,
        "hanzi": "我上午十点十分有课。",
        "pinyin": "Wǒ shàngwǔ shí diǎn shí fēn yǒu kè.",
        "vietnamese": "Tôi có lớp học lúc mười giờ mười phút sáng."
      },
      {
        "lineIndex": 3,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t1_line3.mp3",
        "duration": 3.05,
        "hanzi": "好的，我们下午两点见吧。",
        "pinyin": "Hǎo de, wǒmen xiàwǔ liǎng diǎn jiàn ba.",
        "vietnamese": "Được rồi, chúng ta gặp nhau lúc hai giờ chiều nhé."
      }
    ]
  },
  "hsk1-l7-t2": {
    "id": "hsk1-l7-t2",
    "lesson": 7,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在校园里，李文遇到白家月。(Trong khuôn viên trường, Lý Văn tình cờ gặp Bạch Gia Nguyệt.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l7-t2_full.mp3",
    "totalDuration": 15.69,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.65,
        "duration": 3.65
      },
      {
        "lineIndex": 1,
        "start": 4.05,
        "end": 7.19,
        "duration": 3.14
      },
      {
        "lineIndex": 2,
        "start": 7.59,
        "end": 10.54,
        "duration": 2.95
      },
      {
        "lineIndex": 3,
        "start": 10.94,
        "end": 15.5,
        "duration": 4.56
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t2_line0.mp3",
        "duration": 3.65,
        "hanzi": "下午我想去电影院看电影，你去吗？",
        "pinyin": "Xiàwǔ wǒ xiǎng qù diànyǐngyuàn kàn diànyǐng, nǐ qù ma?",
        "vietnamese": "Chiều nay tôi muốn đi rạp xem phim, bạn có đi không?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t2_line1.mp3",
        "duration": 3.14,
        "hanzi": "我不想去，下午还有事。",
        "pinyin": "Wǒ bù xiǎng qù, xiàwǔ hái yǒu shì.",
        "vietnamese": "Tôi không muốn đi, chiều còn có việc."
      },
      {
        "lineIndex": 2,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t2_line2.mp3",
        "duration": 2.95,
        "hanzi": "好的。明天呢？",
        "pinyin": "Hǎo de. Míngtiān ne?",
        "vietnamese": "Được rồi. Còn ngày mai thì sao?"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t2_line3.mp3",
        "duration": 4.56,
        "hanzi": "我明天下午两点还上课呢，四点半下课。",
        "pinyin": "Wǒ míngtiān xiàwǔ liǎng diǎn hái shàngkè ne, sì diǎn bàn xiàkè.",
        "vietnamese": "Ngày mai chiều hai giờ tôi vẫn còn học, bốn rưỡi mới tan học."
      }
    ]
  },
  "hsk1-l7-t3": {
    "id": "hsk1-l7-t3",
    "lesson": 7,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "王一雪给丈夫刘明打电话。(Vương Nhất Tuyết gọi điện cho chồng là Lưu Minh.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l7-t3_full.mp3",
    "totalDuration": 18.78,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.62,
        "duration": 2.62
      },
      {
        "lineIndex": 1,
        "start": 3.02,
        "end": 5.13,
        "duration": 2.11
      },
      {
        "lineIndex": 2,
        "start": 5.53,
        "end": 8.22,
        "duration": 2.69
      },
      {
        "lineIndex": 3,
        "start": 8.62,
        "end": 11.4,
        "duration": 2.78
      },
      {
        "lineIndex": 4,
        "start": 11.8,
        "end": 15.18,
        "duration": 3.38
      },
      {
        "lineIndex": 5,
        "start": 15.58,
        "end": 18.46,
        "duration": 2.88
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t3_line0.mp3",
        "duration": 2.62,
        "hanzi": "喂，你在哪儿呢？",
        "pinyin": "Wèi, nǐ zài nǎr ne?",
        "vietnamese": "A-lô, anh đang ở đâu vậy?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t3_line1.mp3",
        "duration": 2.11,
        "hanzi": "我在家里呢。",
        "pinyin": "Wǒ zài jiā li ne.",
        "vietnamese": "Anh đang ở nhà."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t3_line2.mp3",
        "duration": 2.69,
        "hanzi": "我晚上六点半下班。",
        "pinyin": "Wǒ wǎnshang liù diǎn bàn xiàbān.",
        "vietnamese": "Em tan ca lúc sáu rưỡi tối."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t3_line3.mp3",
        "duration": 2.78,
        "hanzi": "我八点去医院上班。",
        "pinyin": "Wǒ bā diǎn qù yīyuàn shàngbān.",
        "vietnamese": "Anh đi làm ở bệnh viện lúc tám giờ."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t3_line4.mp3",
        "duration": 3.38,
        "hanzi": "好的，你去店里买些菜吧。",
        "pinyin": "Hǎo de, nǐ qù diàn lǐ mǎi xiē cài ba.",
        "vietnamese": "Được rồi, anh ra cửa hàng mua ít rau nhé."
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l7-t3_line5.mp3",
        "duration": 2.88,
        "hanzi": "好，我十分钟后去。",
        "pinyin": "Hǎo, wǒ shí fēnzhōng hòu qù.",
        "vietnamese": "Được, mười phút nữa anh đi."
      }
    ]
  },
  "hsk1-l8-t1": {
    "id": "hsk1-l8-t1",
    "lesson": 8,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在王一飞家，白家月和陈天中来做客。(Ở nhà Vương Nhất Phi, Bạch Gia Nguyệt và Trần Thiên Trung đến thăm.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l8-t1_full.mp3",
    "totalDuration": 10.87,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.64,
        "duration": 2.64
      },
      {
        "lineIndex": 1,
        "start": 3.04,
        "end": 5.42,
        "duration": 2.38
      },
      {
        "lineIndex": 2,
        "start": 5.82,
        "end": 8.17,
        "duration": 2.35
      },
      {
        "lineIndex": 3,
        "start": 8.57,
        "end": 10.68,
        "duration": 2.11
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t1_line0.mp3",
        "duration": 2.64,
        "hanzi": "房间外有一只小猫。",
        "pinyin": "Fángjiān wài yǒu yī zhī xiǎo māo.",
        "vietnamese": "Ngoài phòng có một con mèo nhỏ."
      },
      {
        "lineIndex": 1,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t1_line1.mp3",
        "duration": 2.38,
        "hanzi": "我没看见，它在哪儿呢？",
        "pinyin": "Wǒ méi kànjiàn, tā zài nǎr ne?",
        "vietnamese": "Tôi không thấy, nó đang ở đâu vậy?"
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t1_line2.mp3",
        "duration": 2.35,
        "hanzi": "它在桌子下呢。",
        "pinyin": "Tā zài zhuōzi xià ne.",
        "vietnamese": "Nó đang ở dưới bàn."
      },
      {
        "lineIndex": 3,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t1_line3.mp3",
        "duration": 2.11,
        "hanzi": "这只小猫真漂亮！",
        "pinyin": "Zhè zhī xiǎo māo zhēn piàoliang!",
        "vietnamese": "Con mèo nhỏ này đẹp quá!"
      }
    ]
  },
  "hsk1-l8-t2": {
    "id": "hsk1-l8-t2",
    "lesson": 8,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在教室里，下课后，白家月给李文打电话。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt gọi điện cho Lý Văn.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l8-t2_full.mp3",
    "totalDuration": 14.16,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.3,
        "duration": 2.3
      },
      {
        "lineIndex": 1,
        "start": 2.7,
        "end": 5.32,
        "duration": 2.62
      },
      {
        "lineIndex": 2,
        "start": 5.72,
        "end": 9.85,
        "duration": 4.13
      },
      {
        "lineIndex": 3,
        "start": 10.25,
        "end": 13.97,
        "duration": 3.72
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t2_line0.mp3",
        "duration": 2.3,
        "hanzi": "我们在哪儿见呢？",
        "pinyin": "Wǒmen zài nǎr jiàn ne?",
        "vietnamese": "Chúng ta gặp nhau ở đâu nhỉ?"
      },
      {
        "lineIndex": 1,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t2_line1.mp3",
        "duration": 2.62,
        "hanzi": "在学校书店前见吧。",
        "pinyin": "Zài xuéxiào shūdiàn qián jiàn ba.",
        "vietnamese": "Gặp nhau trước nhà sách trường nhé."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t2_line2.mp3",
        "duration": 4.13,
        "hanzi": "好的。下午两点你能到吗？",
        "pinyin": "Hǎo de. Xiàwǔ liǎng diǎn nǐ néng dào ma?",
        "vietnamese": "Được. Hai giờ chiều bạn đến được không?"
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t2_line3.mp3",
        "duration": 3.72,
        "hanzi": "我能到。我在学校吃午饭。",
        "pinyin": "Wǒ néng dào. Wǒ zài xuéxiào chī wǔfàn.",
        "vietnamese": "Tôi đến được. Tôi ăn trưa ở trường."
      }
    ]
  },
  "hsk1-l8-t3": {
    "id": "hsk1-l8-t3",
    "lesson": 8,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在医院里，刘明和同事小胡聊天儿。(Ở bệnh viện, Lưu Minh trò chuyện với đồng nghiệp là tiểu Hồ.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l8-t3_full.mp3",
    "totalDuration": 20.0,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.95,
        "duration": 2.95
      },
      {
        "lineIndex": 1,
        "start": 3.35,
        "end": 5.22,
        "duration": 1.87
      },
      {
        "lineIndex": 2,
        "start": 5.62,
        "end": 9.1,
        "duration": 3.48
      },
      {
        "lineIndex": 3,
        "start": 9.5,
        "end": 14.54,
        "duration": 5.04
      },
      {
        "lineIndex": 4,
        "start": 14.94,
        "end": 17.41,
        "duration": 2.47
      },
      {
        "lineIndex": 5,
        "start": 17.81,
        "end": 19.68,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t3_line0.mp3",
        "duration": 2.95,
        "hanzi": "小胡，还没吃饭呢？",
        "pinyin": "Xiǎo Hú, hái méi chīfàn ne?",
        "vietnamese": "Tiểu Hồ, chưa ăn cơm à?"
      },
      {
        "lineIndex": 1,
        "speaker": "小胡 (Bác sĩ Tiểu Hồ)",
        "speakerName": "小胡 (Bác sĩ Tiểu Hồ)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Tiểu Hồ (Vân Kiện - Bác sĩ đồng nghiệp)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t3_line1.mp3",
        "duration": 1.87,
        "hanzi": "没吃呢。",
        "pinyin": "Méi chī ne.",
        "vietnamese": "Chưa ăn."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t3_line2.mp3",
        "duration": 3.48,
        "hanzi": "大医院病人多，医生非常忙。",
        "pinyin": "Dà yīyuàn bìngrén duō, yīshēng fēicháng máng.",
        "vietnamese": "Bệnh viện lớn bệnh nhân nhiều, bác sĩ rất bận."
      },
      {
        "lineIndex": 3,
        "speaker": "小胡 (Bác sĩ Tiểu Hồ)",
        "speakerName": "小胡 (Bác sĩ Tiểu Hồ)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Tiểu Hồ (Vân Kiện - Bác sĩ đồng nghiệp)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t3_line3.mp3",
        "duration": 5.04,
        "hanzi": "是的。我爸爸也在医院工作，他也非常忙。",
        "pinyin": "Shì de. Wǒ bàba yě zài yīyuàn gōngzuò, tā yě fēicháng máng.",
        "vietnamese": "Đúng vậy. Bố tôi cũng làm ở bệnh viện, ông ấy cũng rất bận."
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t3_line4.mp3",
        "duration": 2.47,
        "hanzi": "你家有两个医生？",
        "pinyin": "Nǐ jiā yǒu liǎng gè yīshēng?",
        "vietnamese": "Nhà bạn có hai bác sĩ à?"
      },
      {
        "lineIndex": 5,
        "speaker": "小胡 (Bác sĩ Tiểu Hồ)",
        "speakerName": "小胡 (Bác sĩ Tiểu Hồ)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Tiểu Hồ (Vân Kiện - Bác sĩ đồng nghiệp)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l8-t3_line5.mp3",
        "duration": 1.87,
        "hanzi": "对。",
        "pinyin": "Duì.",
        "vietnamese": "Đúng vậy."
      }
    ]
  },
  "hsk1-l9-t1": {
    "id": "hsk1-l9-t1",
    "lesson": 9,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在校园里，李文和白家月在聊天儿。(Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt đang trò chuyện.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l9-t1_full.mp3",
    "totalDuration": 16.73,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.1,
        "duration": 3.1
      },
      {
        "lineIndex": 1,
        "start": 3.5,
        "end": 8.08,
        "duration": 4.58
      },
      {
        "lineIndex": 2,
        "start": 8.48,
        "end": 13.23,
        "duration": 4.75
      },
      {
        "lineIndex": 3,
        "start": 13.63,
        "end": 16.53,
        "duration": 2.9
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t1_line0.mp3",
        "duration": 3.1,
        "hanzi": "学校前边有一家电影院。",
        "pinyin": "Xuéxiào qiánbian yǒu yī jiā diànyǐngyuàn.",
        "vietnamese": "Phía trước trường có một rạp chiếu phim."
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t1_line1.mp3",
        "duration": 4.58,
        "hanzi": "对。我们晚上去那个电影院看电影吧。",
        "pinyin": "Duì. Wǒmen wǎnshang qù nàge diànyǐngyuàn kàn diànyǐng ba.",
        "vietnamese": "Đúng rồi. Tối nay chúng ta đến rạp đó xem phim nhé."
      },
      {
        "lineIndex": 2,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t1_line2.mp3",
        "duration": 4.75,
        "hanzi": "好！我们七点在电影院外边见，好吗？",
        "pinyin": "Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma?",
        "vietnamese": "Tốt! Bảy giờ chúng ta gặp nhau bên ngoài rạp, được không?"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t1_line3.mp3",
        "duration": 2.9,
        "hanzi": "好的，晚上七点见！",
        "pinyin": "Hǎo de, wǎnshang qī diǎn jiàn!",
        "vietnamese": "Được rồi, tối bảy giờ gặp nhau!"
      }
    ]
  },
  "hsk1-l9-t2": {
    "id": "hsk1-l9-t2",
    "lesson": 9,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在教室里，下课后，白家月和陈天中在聊天儿。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang trò chuyện.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l9-t2_full.mp3",
    "totalDuration": 16.2,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.46,
        "duration": 3.46
      },
      {
        "lineIndex": 1,
        "start": 3.86,
        "end": 9.02,
        "duration": 5.16
      },
      {
        "lineIndex": 2,
        "start": 9.42,
        "end": 12.49,
        "duration": 3.07
      },
      {
        "lineIndex": 3,
        "start": 12.89,
        "end": 16.01,
        "duration": 3.12
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t2_line0.mp3",
        "duration": 3.46,
        "hanzi": "椅子上有一本中文书，那是谁的书？",
        "pinyin": "Yǐzi shang yǒu yī běn Zhōngwén shū, nà shì shéi de shū?",
        "vietnamese": "Trên ghế có một quyển sách tiếng Trung, đó là sách của ai?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t2_line1.mp3",
        "duration": 5.16,
        "hanzi": "是我的书，谢谢。这是我的第二本中文书。",
        "pinyin": "Shì wǒ de shū, xièxie. Zhè shì wǒ de dì-èr běn Zhōngwén shū.",
        "vietnamese": "Là sách của tôi, cảm ơn. Đây là quyển sách tiếng Trung thứ hai của tôi."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t2_line2.mp3",
        "duration": 3.07,
        "hanzi": "不客气。你明天上午在哪儿？",
        "pinyin": "Bù kèqi. Nǐ míngtiān shàngwǔ zài nǎr?",
        "vietnamese": "Không có gì. Sáng mai bạn ở đâu?"
      },
      {
        "lineIndex": 3,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t2_line3.mp3",
        "duration": 3.12,
        "hanzi": "我明天上午在学校学习。",
        "pinyin": "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.",
        "vietnamese": "Sáng mai tôi ở trường học bài."
      }
    ]
  },
  "hsk1-l9-t3": {
    "id": "hsk1-l9-t3",
    "lesson": 9,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在公司里，王一雪和杨同乐休息时聊天儿，谈论周末生活。(Ở công ty, Vương Nhất Tuyết và Dương Đồng Nhạc trò chuyện lúc nghỉ giải lao về cuộc sống cuối tuần.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l9-t3_full.mp3",
    "totalDuration": 22.69,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.38,
        "duration": 3.38
      },
      {
        "lineIndex": 1,
        "start": 3.78,
        "end": 8.08,
        "duration": 4.3
      },
      {
        "lineIndex": 2,
        "start": 8.48,
        "end": 10.86,
        "duration": 2.38
      },
      {
        "lineIndex": 3,
        "start": 11.26,
        "end": 14.14,
        "duration": 2.88
      },
      {
        "lineIndex": 4,
        "start": 14.54,
        "end": 20.11,
        "duration": 5.57
      },
      {
        "lineIndex": 5,
        "start": 20.51,
        "end": 22.38,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t3_line0.mp3",
        "duration": 3.38,
        "hanzi": "明天星期六，你做什么？",
        "pinyin": "Míngtiān Xīngqīliù, nǐ zuò shénme?",
        "vietnamese": "Ngày mai thứ Bảy, bạn làm gì?"
      },
      {
        "lineIndex": 1,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t3_line1.mp3",
        "duration": 4.3,
        "hanzi": "我白天在家里读书，晚上和朋友们去外边唱歌。",
        "pinyin": "Wǒ báitiān zài jiā lǐ dúshū, wǎnshang hé péngyoumen qù wàibian chàng gē.",
        "vietnamese": "Tôi ban ngày ở nhà đọc sách, tối đi hát với bạn bè."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t3_line2.mp3",
        "duration": 2.38,
        "hanzi": "你唱歌很好听。",
        "pinyin": "Nǐ chànggē hěn hǎotīng.",
        "vietnamese": "Bạn hát rất hay."
      },
      {
        "lineIndex": 3,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t3_line3.mp3",
        "duration": 2.88,
        "hanzi": "谢谢！您星期六做什么？",
        "pinyin": "Xièxie! Nín Xīngqīliù zuò shénme?",
        "vietnamese": "Cảm ơn! Thứ Bảy chị làm gì?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t3_line4.mp3",
        "duration": 5.57,
        "hanzi": "我在家里做饭，看电视，和孩子们、小狗玩。",
        "pinyin": "Wǒ zài jiā lǐ zuòfàn, kàn diànshì, hé háizimen, xiǎo gǒu wán.",
        "vietnamese": "Tôi ở nhà nấu ăn, xem TV, chơi với các con và cún nhỏ."
      },
      {
        "lineIndex": 5,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l9-t3_line5.mp3",
        "duration": 1.87,
        "hanzi": "我也有一只小狗。",
        "pinyin": "Wǒ yě yǒu yī zhī xiǎo gǒu.",
        "vietnamese": "Tôi cũng có một con cún nhỏ."
      }
    ]
  },
  "hsk1-l10-t1": {
    "id": "hsk1-l10-t1",
    "lesson": 10,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在小店里，王一雪在买杯子。(Ở cửa hàng nhỏ, Vương Nhất Tuyết đang mua cốc.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l10-t1_full.mp3",
    "totalDuration": 14.69,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.71,
        "duration": 2.71
      },
      {
        "lineIndex": 1,
        "start": 3.11,
        "end": 5.46,
        "duration": 2.35
      },
      {
        "lineIndex": 2,
        "start": 5.86,
        "end": 7.88,
        "duration": 2.02
      },
      {
        "lineIndex": 3,
        "start": 8.28,
        "end": 11.98,
        "duration": 3.7
      },
      {
        "lineIndex": 4,
        "start": 12.38,
        "end": 14.44,
        "duration": 2.06
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t1_line0.mp3",
        "duration": 2.71,
        "hanzi": "请问，有杯子吗？",
        "pinyin": "Qǐngwèn, yǒu bēizi ma?",
        "vietnamese": "Cho hỏi, có cốc không ạ?"
      },
      {
        "lineIndex": 1,
        "speaker": "店员 (Nhân viên cửa hàng)",
        "speakerName": "店员 (Nhân viên cửa hàng)",
        "gender": "female",
        "avatar": "🧑‍💼",
        "persona": "Nhân viên bán hàng (Hiểu Y - Trẻ trung, niềm nở)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t1_line1.mp3",
        "duration": 2.35,
        "hanzi": "有，杯子在这边。",
        "pinyin": "Yǒu, bēizi zài zhèbian.",
        "vietnamese": "Có ạ, cốc ở phía này."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t1_line2.mp3",
        "duration": 2.02,
        "hanzi": "多少钱一个？",
        "pinyin": "Duōshao qián yī gè?",
        "vietnamese": "Mỗi cái bao nhiêu tiền?"
      },
      {
        "lineIndex": 3,
        "speaker": "店员 (Nhân viên cửa hàng)",
        "speakerName": "店员 (Nhân viên cửa hàng)",
        "gender": "female",
        "avatar": "🧑‍💼",
        "persona": "Nhân viên bán hàng (Hiểu Y - Trẻ trung, niềm nở)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t1_line3.mp3",
        "duration": 3.7,
        "hanzi": "这些五块钱一个，那些十块钱一个。",
        "pinyin": "Zhèxiē wǔ kuài qián yī gè, nàxiē shí kuài qián yī gè.",
        "vietnamese": "Những cái này năm tệ một cái, những cái kia mười tệ một cái."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t1_line4.mp3",
        "duration": 2.06,
        "hanzi": "我买这个吧。",
        "pinyin": "Wǒ mǎi zhège ba.",
        "vietnamese": "Tôi mua cái này nhé."
      }
    ]
  },
  "hsk1-l10-t2": {
    "id": "hsk1-l10-t2",
    "lesson": 10,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在集市上，王一雪在买水果。(Ở chợ, Vương Nhất Tuyết đang mua hoa quả.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l10-t2_full.mp3",
    "totalDuration": 16.61,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.45,
        "duration": 2.45
      },
      {
        "lineIndex": 1,
        "start": 2.85,
        "end": 4.39,
        "duration": 1.54
      },
      {
        "lineIndex": 2,
        "start": 4.79,
        "end": 7.31,
        "duration": 2.52
      },
      {
        "lineIndex": 3,
        "start": 7.71,
        "end": 12.41,
        "duration": 4.7
      },
      {
        "lineIndex": 4,
        "start": 12.81,
        "end": 16.36,
        "duration": 3.55
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t2_line0.mp3",
        "duration": 2.45,
        "hanzi": "这儿的水果真不少！",
        "pinyin": "Zhèr de shuǐguǒ zhēn bù shǎo!",
        "vietnamese": "Hoa quả ở đây thật là nhiều!"
      },
      {
        "lineIndex": 1,
        "speaker": "摊主 (Chủ sạp hoa quả)",
        "speakerName": "摊主 (Chủ sạp hoa quả)",
        "gender": "male",
        "avatar": "👨‍🌾",
        "persona": "Chủ sạp hoa quả (Vân Dương)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t2_line1.mp3",
        "duration": 1.54,
        "hanzi": "您想买什么？",
        "pinyin": "Nín xiǎng mǎi shénme?",
        "vietnamese": "Bà muốn mua gì ạ?"
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t2_line2.mp3",
        "duration": 2.52,
        "hanzi": "我想买两斤苹果。",
        "pinyin": "Wǒ xiǎng mǎi liǎng jīn píngguǒ.",
        "vietnamese": "Tôi muốn mua hai cân táo."
      },
      {
        "lineIndex": 3,
        "speaker": "摊主 (Chủ sạp hoa quả)",
        "speakerName": "摊主 (Chủ sạp hoa quả)",
        "gender": "male",
        "avatar": "👨‍🌾",
        "persona": "Chủ sạp hoa quả (Vân Dương)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t2_line3.mp3",
        "duration": 4.7,
        "hanzi": "苹果三块五一斤。这些七块二，七块钱吧。",
        "pinyin": "Píngguǒ sān kuài wǔ yī jīn. Zhèxiē qī kuài èr, qī kuài qián ba.",
        "vietnamese": "Táo ba phẩy năm tệ một cân. Những quả này bảy phẩy hai tệ, bảy tệ thôi nhé."
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t2_line4.mp3",
        "duration": 3.55,
        "hanzi": "好的，这儿的苹果真便宜！",
        "pinyin": "Hǎo de, zhèr de píngguǒ zhēn piányí!",
        "vietnamese": "Được rồi, táo ở đây thật rẻ!"
      }
    ]
  },
  "hsk1-l10-t3": {
    "id": "hsk1-l10-t3",
    "lesson": 10,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在商场里，刘明和王一雪在给孩子们买衣服。(Ở trung tâm thương mại, Lưu Minh và Vương Nhất Tuyết đang mua quần áo cho các con.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l10-t3_full.mp3",
    "totalDuration": 24.44,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 5.18,
        "duration": 5.18
      },
      {
        "lineIndex": 1,
        "start": 5.58,
        "end": 8.1,
        "duration": 2.52
      },
      {
        "lineIndex": 2,
        "start": 8.5,
        "end": 11.55,
        "duration": 3.05
      },
      {
        "lineIndex": 3,
        "start": 11.95,
        "end": 15.5,
        "duration": 3.55
      },
      {
        "lineIndex": 4,
        "start": 15.9,
        "end": 21.85,
        "duration": 5.95
      },
      {
        "lineIndex": 5,
        "start": 22.25,
        "end": 24.12,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t3_line0.mp3",
        "duration": 5.18,
        "hanzi": "这家商店衣服真多！这件一百元，怎么样？",
        "pinyin": "Zhè jiā shāngdiàn yīfu zhēn duō! Zhè jiàn yī bǎi yuán, zěnmeyàng?",
        "vietnamese": "Cửa hàng này quần áo thật nhiều! Cái này một trăm tệ, thế nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t3_line1.mp3",
        "duration": 2.52,
        "hanzi": "好看，也不贵。",
        "pinyin": "Hǎokàn, yě bù guì.",
        "vietnamese": "Đẹp, cũng không đắt."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t3_line2.mp3",
        "duration": 3.05,
        "hanzi": "小雪能穿，买一件吧。",
        "pinyin": "Xiǎo Xuě néng chuān, mǎi yī jiàn ba.",
        "vietnamese": "Tiểu Tuyết mặc được, mua một cái nhé."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t3_line3.mp3",
        "duration": 3.55,
        "hanzi": "好的。小明能穿吗？",
        "pinyin": "Hǎo de. Xiǎo Míng néng chuān ma?",
        "vietnamese": "Được. Tiểu Minh mặc được không?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t3_line4.mp3",
        "duration": 5.95,
        "hanzi": "不能。这些是女孩子穿的衣服，男孩子的衣服在那儿。",
        "pinyin": "Bù néng. Zhèxiē shì nǚ háizi chuān de yīfu, nán háizi de yīfu zài nàr.",
        "vietnamese": "Không được. Những cái này là quần áo con gái, quần áo con trai ở kia."
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l10-t3_line5.mp3",
        "duration": 1.87,
        "hanzi": "好的。",
        "pinyin": "Hǎo de.",
        "vietnamese": "Được rồi."
      }
    ]
  },
  "hsk1-l11-t1": {
    "id": "hsk1-l11-t1",
    "lesson": 11,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在路上，李文正在找饭店，王一飞给他打电话。(Trên đường, Lý Văn đang tìm nhà hàng, Vương Nhất Phi gọi điện cho anh.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l11-t1_full.mp3",
    "totalDuration": 15.67,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.48,
        "duration": 3.48
      },
      {
        "lineIndex": 1,
        "start": 3.88,
        "end": 8.75,
        "duration": 4.87
      },
      {
        "lineIndex": 2,
        "start": 9.15,
        "end": 12.34,
        "duration": 3.19
      },
      {
        "lineIndex": 3,
        "start": 12.74,
        "end": 15.48,
        "duration": 2.74
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t1_line0.mp3",
        "duration": 3.48,
        "hanzi": "喂，李文，你什么时候能到饭店？",
        "pinyin": "Wèi, Lǐ Wén, nǐ shénme shíhou néng dào fàndiàn?",
        "vietnamese": "A-lô, Lý Văn, bao giờ bạn đến nhà hàng được?"
      },
      {
        "lineIndex": 1,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t1_line1.mp3",
        "duration": 4.87,
        "hanzi": "还不知道，正在找呢。它是不是在超市后边？",
        "pinyin": "Hái bù zhīdào, zhèngzài zhǎo ne. Tā shì bu shì zài chāoshì hòubian?",
        "vietnamese": "Chưa biết, đang tìm. Nó có phải ở phía sau siêu thị không?"
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t1_line2.mp3",
        "duration": 3.19,
        "hanzi": "是的。你开车没开车？",
        "pinyin": "Shì de. Nǐ kāichē méi kāichē?",
        "vietnamese": "Đúng rồi. Bạn có lái xe không?"
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t1_line3.mp3",
        "duration": 2.74,
        "hanzi": "我没开车，坐车呢。",
        "pinyin": "Wǒ méi kāichē, zuò chē ne.",
        "vietnamese": "Tôi không lái xe, đang đi xe buýt."
      }
    ]
  },
  "hsk1-l11-t2": {
    "id": "hsk1-l11-t2",
    "lesson": 11,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在饭店里，王一飞和李文见面后聊天儿。(Ở nhà hàng, Vương Nhất Phi và Lý Văn gặp nhau và trò chuyện.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l11-t2_full.mp3",
    "totalDuration": 13.13,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.06,
        "duration": 2.06
      },
      {
        "lineIndex": 1,
        "start": 2.46,
        "end": 6.2,
        "duration": 3.74
      },
      {
        "lineIndex": 2,
        "start": 6.6,
        "end": 8.59,
        "duration": 1.99
      },
      {
        "lineIndex": 3,
        "start": 8.99,
        "end": 12.93,
        "duration": 3.94
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t2_line0.mp3",
        "duration": 2.06,
        "hanzi": "你还在上大学吗？",
        "pinyin": "Nǐ hái zài shàng dàxué ma?",
        "vietnamese": "Bạn có vẫn đang học đại học không?"
      },
      {
        "lineIndex": 1,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t2_line1.mp3",
        "duration": 3.74,
        "hanzi": "对，我上大学呢，还是大学生。",
        "pinyin": "Duì, wǒ shàng dàxué ne, hái shì dàxuéshēng.",
        "vietnamese": "Đúng vậy, tôi đang học đại học, vẫn còn là sinh viên."
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t2_line2.mp3",
        "duration": 1.99,
        "hanzi": "你们学习忙不忙？",
        "pinyin": "Nǐmen xuéxí máng bu máng?",
        "vietnamese": "Các bạn có bận học không?"
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t2_line3.mp3",
        "duration": 3.94,
        "hanzi": "非常忙，我学语言，我们的课很多。",
        "pinyin": "Fēicháng máng, wǒ xué yǔyán, wǒmen de kè hěn duō.",
        "vietnamese": "Rất bận, tôi học ngôn ngữ, chúng tôi có rất nhiều tiết học."
      }
    ]
  },
  "hsk1-l11-t3": {
    "id": "hsk1-l11-t3",
    "lesson": 11,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "星期六早上，刘明要去医院加班，出门前和女儿聊天儿。(Sáng thứ Bảy, Lưu Minh sắp đi làm thêm giờ ở bệnh viện, trước khi ra ngoài trò chuyện với con gái.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l11-t3_full.mp3",
    "totalDuration": 21.01,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.76,
        "duration": 2.76
      },
      {
        "lineIndex": 1,
        "start": 3.16,
        "end": 5.75,
        "duration": 2.59
      },
      {
        "lineIndex": 2,
        "start": 6.15,
        "end": 10.16,
        "duration": 4.01
      },
      {
        "lineIndex": 3,
        "start": 10.56,
        "end": 12.43,
        "duration": 1.87
      },
      {
        "lineIndex": 4,
        "start": 12.83,
        "end": 14.7,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 15.1,
        "end": 20.69,
        "duration": 5.59
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t3_line0.mp3",
        "duration": 2.76,
        "hanzi": "弟弟起床没起床呢？",
        "pinyin": "Dìdi qǐchuáng méi qǐchuáng ne?",
        "vietnamese": "Em trai dậy chưa?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘小雪 (Bé Tiểu Tuyết)",
        "speakerName": "刘小雪 (Bé Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Bé Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t3_line1.mp3",
        "duration": 2.59,
        "hanzi": "没起床呢，还在睡觉。",
        "pinyin": "Méi qǐchuáng ne, hái zài shuìjiào.",
        "vietnamese": "Chưa dậy, vẫn còn ngủ."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t3_line2.mp3",
        "duration": 4.01,
        "hanzi": "还睡呢？他今天去不去哪里？",
        "pinyin": "Hái shuì ne? Tā jīntiān qù bu qù nǎlǐ?",
        "vietnamese": "Còn ngủ à? Hôm nay nó có đi đâu không?"
      },
      {
        "lineIndex": 3,
        "speaker": "刘小雪 (Bé Tiểu Tuyết)",
        "speakerName": "刘小雪 (Bé Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Bé Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t3_line3.mp3",
        "duration": 1.87,
        "hanzi": "去哪里？",
        "pinyin": "Qù nǎlǐ?",
        "vietnamese": "Đi đâu ấy?"
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t3_line4.mp3",
        "duration": 1.87,
        "hanzi": "去超市。",
        "pinyin": "Qù chāoshì.",
        "vietnamese": "Đi siêu thị."
      },
      {
        "lineIndex": 5,
        "speaker": "刘小雪 (Bé Tiểu Tuyết)",
        "speakerName": "刘小雪 (Bé Tiểu Tuyết)",
        "gender": "female",
        "avatar": "👧",
        "persona": "Bé Lưu Tiểu Tuyết (Hiểu Y - Con gái 14t lí lắc, trong trẻo)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l11-t3_line5.mp3",
        "duration": 5.59,
        "hanzi": "我昨天晚问他，他对我说，他不去，他今天要和小朋友玩。",
        "pinyin": "Wǒ zuótiān wǎn wèn tā, tā duì wǒ shuō, tā bù qù, tā jīntiān yào hé xiǎopéngyou wán.",
        "vietnamese": "Tối qua tôi có hỏi nó, nó nói với tôi rằng nó không đi, hôm nay nó muốn chơi với bạn nhỏ."
      }
    ]
  },
  "hsk1-l12-t1": {
    "id": "hsk1-l12-t1",
    "lesson": 12,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "王一雪给王一飞打电话，问那边的情况。(Vương Nhất Tuyết gọi điện cho Vương Nhất Phi, hỏi về tình hình bên đó.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l12-t1_full.mp3",
    "totalDuration": 11.25,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.52,
        "duration": 2.52
      },
      {
        "lineIndex": 1,
        "start": 2.92,
        "end": 5.87,
        "duration": 2.95
      },
      {
        "lineIndex": 2,
        "start": 6.27,
        "end": 8.14,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 8.54,
        "end": 11.06,
        "duration": 2.52
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t1_line0.mp3",
        "duration": 2.52,
        "hanzi": "今天天气怎么样？",
        "pinyin": "Jīntiān tiānqì zěnmeyàng?",
        "vietnamese": "Hôm nay thời tiết thế nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t1_line1.mp3",
        "duration": 2.95,
        "hanzi": "这里的天不太好，下雨了。",
        "pinyin": "Zhèlǐ de tiān bù tài hǎo, xià yǔ le.",
        "vietnamese": "Thời tiết ở đây không tốt lắm, trời mưa rồi."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t1_line2.mp3",
        "duration": 1.87,
        "hanzi": "雨大吗？",
        "pinyin": "Yǔ dà ma?",
        "vietnamese": "Mưa to không?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t1_line3.mp3",
        "duration": 2.52,
        "hanzi": "有点儿大，我觉得很冷。",
        "pinyin": "Yǒudiǎnr dà, wǒ juéde hěn lěng.",
        "vietnamese": "Hơi to, tôi thấy rất lạnh."
      }
    ]
  },
  "hsk1-l12-t2": {
    "id": "hsk1-l12-t2",
    "lesson": 12,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在公司电梯里，王一雪和杨同乐在聊天儿。(Trong thang máy công ty, Vương Nhất Tuyết và Dương Đồng Nhạc đang trò chuyện.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l12-t2_full.mp3",
    "totalDuration": 11.83,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.35,
        "duration": 2.35
      },
      {
        "lineIndex": 1,
        "start": 2.75,
        "end": 4.72,
        "duration": 1.97
      },
      {
        "lineIndex": 2,
        "start": 5.12,
        "end": 8.7,
        "duration": 3.58
      },
      {
        "lineIndex": 3,
        "start": 9.1,
        "end": 11.64,
        "duration": 2.54
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t2_line0.mp3",
        "duration": 2.35,
        "hanzi": "昨天下雪了。",
        "pinyin": "Zuótiān xià xuě le.",
        "vietnamese": "Hôm qua có tuyết rơi."
      },
      {
        "lineIndex": 1,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t2_line1.mp3",
        "duration": 1.97,
        "hanzi": "是的，太冷了。",
        "pinyin": "Shì de, tài lěng le.",
        "vietnamese": "Đúng vậy, lạnh quá."
      },
      {
        "lineIndex": 2,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t2_line2.mp3",
        "duration": 3.58,
        "hanzi": "你昨天没来公司，生病了？",
        "pinyin": "Nǐ zuótiān méi lái gōngsī, shēngbìng le?",
        "vietnamese": "Hôm qua bạn không đến công ty, bị ốm à?"
      },
      {
        "lineIndex": 3,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t2_line3.mp3",
        "duration": 2.54,
        "hanzi": "对，我昨天去医院看病了。",
        "pinyin": "Duì, wǒ zuótiān qù yīyuàn kànbìng le.",
        "vietnamese": "Đúng vậy, hôm qua tôi đi bệnh viện khám bệnh."
      }
    ]
  },
  "hsk1-l12-t3": {
    "id": "hsk1-l12-t3",
    "lesson": 12,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "昨天在医院里，医生给杨同乐看病。(Hôm qua ở bệnh viện, bác sĩ khám bệnh cho Dương Đồng Nhạc.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l12-t3_full.mp3",
    "totalDuration": 18.16,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 1.87,
        "duration": 1.87
      },
      {
        "lineIndex": 1,
        "start": 2.27,
        "end": 5.77,
        "duration": 3.5
      },
      {
        "lineIndex": 2,
        "start": 6.17,
        "end": 8.04,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 8.44,
        "end": 12.45,
        "duration": 4.01
      },
      {
        "lineIndex": 4,
        "start": 12.85,
        "end": 14.72,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 15.12,
        "end": 17.83,
        "duration": 2.71
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t3_line0.mp3",
        "duration": 1.87,
        "hanzi": "医生，我病了。",
        "pinyin": "Yīshēng, wǒ bìng le.",
        "vietnamese": "Bác sĩ ơi, tôi bị ốm rồi."
      },
      {
        "lineIndex": 1,
        "speaker": "医生 (Bác sĩ)",
        "speakerName": "医生 (Bác sĩ)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ khám bệnh (Vân Kiện)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t3_line1.mp3",
        "duration": 3.5,
        "hanzi": "我看看。你觉得怎么样？",
        "pinyin": "Wǒ kànkan. Nǐ juéde zěnmeyàng?",
        "vietnamese": "Để tôi xem. Bạn cảm thấy thế nào?"
      },
      {
        "lineIndex": 2,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t3_line2.mp3",
        "duration": 1.87,
        "hanzi": "我很冷。",
        "pinyin": "Wǒ hěn lěng.",
        "vietnamese": "Tôi rất lạnh."
      },
      {
        "lineIndex": 3,
        "speaker": "医生 (Bác sĩ)",
        "speakerName": "医生 (Bác sĩ)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ khám bệnh (Vân Kiện)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t3_line3.mp3",
        "duration": 4.01,
        "hanzi": "好的，吃一点儿药，今天休息半天吧。",
        "pinyin": "Hǎo de, chī yīdiǎnr yào, jīntiān xiūxi bàn tiān ba.",
        "vietnamese": "Được rồi, uống một ít thuốc, hôm nay nghỉ nửa ngày nhé."
      },
      {
        "lineIndex": 4,
        "speaker": "杨同乐 (Dương Đồng Nhạc)",
        "speakerName": "杨同乐 (Dương Đồng Nhạc)",
        "gender": "male",
        "avatar": "🧑‍💼",
        "persona": "Dương Đồng Nhạc (Vân Dương tươi - Nam nhân viên văn phòng 28t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t3_line4.mp3",
        "duration": 1.87,
        "hanzi": "好的。",
        "pinyin": "Hǎo de.",
        "vietnamese": "Được rồi."
      },
      {
        "lineIndex": 5,
        "speaker": "医生 (Bác sĩ)",
        "speakerName": "医生 (Bác sĩ)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ khám bệnh (Vân Kiện)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l12-t3_line5.mp3",
        "duration": 2.71,
        "hanzi": "回家后再喝些热水。",
        "pinyin": "Huí jiā hòu zài hē xiē rè shuǐ.",
        "vietnamese": "Về nhà nhớ uống thêm nước ấm nhé."
      }
    ]
  },
  "hsk1-l13-t1": {
    "id": "hsk1-l13-t1",
    "lesson": 13,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在教室里，下课后，白家月向王老师问问题。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt hỏi cô giáo Vương một câu hỏi.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l13-t1_full.mp3",
    "totalDuration": 14.61,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.82,
        "duration": 3.82
      },
      {
        "lineIndex": 1,
        "start": 4.22,
        "end": 7.15,
        "duration": 2.93
      },
      {
        "lineIndex": 2,
        "start": 7.55,
        "end": 10.36,
        "duration": 2.81
      },
      {
        "lineIndex": 3,
        "start": 10.76,
        "end": 14.43,
        "duration": 3.67
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t1_line0.mp3",
        "duration": 3.82,
        "hanzi": "王老师，我可以再问您一个问题吗？",
        "pinyin": "Wáng lǎoshī, wǒ kěyǐ zài wèn nín yī gè wèntí ma?",
        "vietnamese": "Cô Vương ơi, em có thể hỏi cô thêm một câu không?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t1_line1.mp3",
        "duration": 2.93,
        "hanzi": "可以。你有什么问题？",
        "pinyin": "Kěyǐ. Nǐ yǒu shénme wèntí?",
        "vietnamese": "Được. Em có câu hỏi gì?"
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t1_line2.mp3",
        "duration": 2.81,
        "hanzi": "那个小店买不买手机？",
        "pinyin": "Nàge xiǎo diàn mǎi bu mǎi shǒujī?",
        "vietnamese": "Cái cửa hàng nhỏ đó có bán điện thoại không ạ?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t1_line3.mp3",
        "duration": 3.67,
        "hanzi": "我不知道。你可以打电话问一下。",
        "pinyin": "Wǒ bù zhīdào. Nǐ kěyǐ dǎ diànhuà wèn yīxià.",
        "vietnamese": "Cô không biết. Em có thể gọi điện hỏi xem."
      }
    ]
  },
  "hsk1-l13-t2": {
    "id": "hsk1-l13-t2",
    "lesson": 13,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在咖啡馆里，王一雪想吃早饭。(Ở quán cà phê, Vương Nhất Tuyết muốn ăn sáng.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l13-t2_full.mp3",
    "totalDuration": 15.6,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.38,
        "duration": 3.38
      },
      {
        "lineIndex": 1,
        "start": 3.78,
        "end": 7.4,
        "duration": 3.62
      },
      {
        "lineIndex": 2,
        "start": 7.8,
        "end": 10.63,
        "duration": 2.83
      },
      {
        "lineIndex": 3,
        "start": 11.03,
        "end": 15.4,
        "duration": 4.37
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍🍳",
        "persona": "Nhân viên phục vụ (Hiểu Y - Lịch thiệp, ân cần)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t2_line0.mp3",
        "duration": 3.38,
        "hanzi": "女士，请坐！您喝什么？",
        "pinyin": "Nǚshì, qǐng zuò! Nín hē shénme?",
        "vietnamese": "Thưa cô, mời ngồi! Cô muốn uống gì?"
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t2_line1.mp3",
        "duration": 3.62,
        "hanzi": "我看一下。请给我一杯牛奶。",
        "pinyin": "Wǒ kàn yīxià. Qǐng gěi wǒ yī bēi niúnǎi.",
        "vietnamese": "Để tôi xem đã. Làm ơn cho tôi một ly sữa."
      },
      {
        "lineIndex": 2,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍🍳",
        "persona": "Nhân viên phục vụ (Hiểu Y - Lịch thiệp, ân cần)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t2_line2.mp3",
        "duration": 2.83,
        "hanzi": "好的。您还要什么？",
        "pinyin": "Hǎo de. Nín hái yào shénme?",
        "vietnamese": "Được ạ. Cô còn muốn gì nữa không?"
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t2_line3.mp3",
        "duration": 4.37,
        "hanzi": "我还没吃早饭，再要这个面包和鸡蛋吧。",
        "pinyin": "Wǒ hái méi chī zǎofàn, zài yào zhège miànbāo hé jīdàn ba.",
        "vietnamese": "Tôi chưa ăn sáng, cho thêm bánh mì và trứng này nhé."
      }
    ]
  },
  "hsk1-l13-t3": {
    "id": "hsk1-l13-t3",
    "lesson": 13,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在餐厅里，刘明在点餐。(Ở nhà hàng, Lưu Minh đang gọi đồ ăn.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l13-t3_full.mp3",
    "totalDuration": 20.51,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.29,
        "duration": 3.29
      },
      {
        "lineIndex": 1,
        "start": 3.69,
        "end": 5.97,
        "duration": 2.28
      },
      {
        "lineIndex": 2,
        "start": 6.37,
        "end": 9.63,
        "duration": 3.26
      },
      {
        "lineIndex": 3,
        "start": 10.03,
        "end": 13.56,
        "duration": 3.53
      },
      {
        "lineIndex": 4,
        "start": 13.96,
        "end": 17.37,
        "duration": 3.41
      },
      {
        "lineIndex": 5,
        "start": 17.77,
        "end": 20.19,
        "duration": 2.42
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍🍳",
        "persona": "Nhân viên phục vụ (Hiểu Y - Lịch thiệp, ân cần)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t3_line0.mp3",
        "duration": 3.29,
        "hanzi": "先生，请坐！您要什么？",
        "pinyin": "Xiānsheng, qǐng zuò! Nín yào shénme?",
        "vietnamese": "Thưa anh, mời ngồi! Anh muốn gì ạ?"
      },
      {
        "lineIndex": 1,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t3_line1.mp3",
        "duration": 2.28,
        "hanzi": "我要一斤饺子。",
        "pinyin": "Wǒ yào yī jīn jiǎozi.",
        "vietnamese": "Cho tôi một cân sủi cảo."
      },
      {
        "lineIndex": 2,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍🍳",
        "persona": "Nhân viên phục vụ (Hiểu Y - Lịch thiệp, ân cần)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t3_line2.mp3",
        "duration": 3.26,
        "hanzi": "好的。一斤饺子40个。",
        "pinyin": "Hǎo de. Yī jīn jiǎozi sìshí gè.",
        "vietnamese": "Vâng. Một cân sủi cảo là 40 cái."
      },
      {
        "lineIndex": 3,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t3_line3.mp3",
        "duration": 3.53,
        "hanzi": "40个太多了，我要一半吧。",
        "pinyin": "Sìshí gè tài duō le, wǒ yào yībàn ba.",
        "vietnamese": "40 cái nhiều quá, cho tôi một nửa thôi."
      },
      {
        "lineIndex": 4,
        "speaker": "服务员 (Nhân viên phục vụ)",
        "speakerName": "服务员 (Nhân viên phục vụ)",
        "gender": "female",
        "avatar": "🧑‍🍳",
        "persona": "Nhân viên phục vụ (Hiểu Y - Lịch thiệp, ân cần)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t3_line4.mp3",
        "duration": 3.41,
        "hanzi": "半斤20个。您想喝什么？",
        "pinyin": "Bàn jīn èrshí gè. Nín xiǎng hē shénme?",
        "vietnamese": "Nửa cân 20 cái. Anh muốn uống gì?"
      },
      {
        "lineIndex": 5,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l13-t3_line5.mp3",
        "duration": 2.42,
        "hanzi": "请给我一杯茶吧。",
        "pinyin": "Qǐng gěi wǒ yī bēi chá ba.",
        "vietnamese": "Làm ơn cho tôi một chén trà nhé."
      }
    ]
  },
  "hsk1-l14-t1": {
    "id": "hsk1-l14-t1",
    "lesson": 14,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。(Ở lớp học, sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung đang nói về chuyến dã ngoại vừa rồi.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l14-t1_full.mp3",
    "totalDuration": 13.85,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.55,
        "duration": 3.55
      },
      {
        "lineIndex": 1,
        "start": 3.95,
        "end": 9.11,
        "duration": 5.16
      },
      {
        "lineIndex": 2,
        "start": 9.51,
        "end": 11.38,
        "duration": 1.87
      },
      {
        "lineIndex": 3,
        "start": 11.78,
        "end": 13.65,
        "duration": 1.87
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t1_line0.mp3",
        "duration": 3.55,
        "hanzi": "你们上火车后看见王老师了吗？",
        "pinyin": "Nǐmen shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?",
        "vietnamese": "Các bạn sau khi lên tàu có thấy cô Vương không?"
      },
      {
        "lineIndex": 1,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t1_line1.mp3",
        "duration": 5.16,
        "hanzi": "没看见。中午车开后，有些人在看书，有些人睡觉了。",
        "pinyin": "Méi kànjiàn. Zhōngwǔ chē kāi hòu, yǒuxiē rén zài kàn shū, yǒuxiē rén shuìjiào le.",
        "vietnamese": "Không thấy. Trưa tàu chạy rồi, có người đang đọc sách, có người ngủ."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t1_line2.mp3",
        "duration": 1.87,
        "hanzi": "你呢？",
        "pinyin": "Nǐ ne?",
        "vietnamese": "Còn bạn thì sao?"
      },
      {
        "lineIndex": 3,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t1_line3.mp3",
        "duration": 1.87,
        "hanzi": "我看了一个电影。",
        "pinyin": "Wǒ kànle yī gè diànyǐng.",
        "vietnamese": "Tôi đã xem một bộ phim."
      }
    ]
  },
  "hsk1-l14-t2": {
    "id": "hsk1-l14-t2",
    "lesson": 14,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在课堂上，王一飞在询问学生们的学习情况。(Trong lớp học, Vương Nhất Phi đang hỏi về tình hình học tập của học sinh.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l14-t2_full.mp3",
    "totalDuration": 17.93,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.5,
        "duration": 3.5
      },
      {
        "lineIndex": 1,
        "start": 3.9,
        "end": 6.13,
        "duration": 2.23
      },
      {
        "lineIndex": 2,
        "start": 6.53,
        "end": 8.5,
        "duration": 1.97
      },
      {
        "lineIndex": 3,
        "start": 8.9,
        "end": 14.88,
        "duration": 5.98
      },
      {
        "lineIndex": 4,
        "start": 15.28,
        "end": 17.68,
        "duration": 2.4
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t2_line0.mp3",
        "duration": 3.5,
        "hanzi": "你们会说汉语了，也会写汉字了吗？",
        "pinyin": "Nǐmen huì shuō Hànyǔ le, yě huì xiě Hànzì le ma?",
        "vietnamese": "Các em bây giờ đã biết nói tiếng Trung, vậy đã biết viết chữ Hán chưa?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t2_line1.mp3",
        "duration": 2.23,
        "hanzi": "我们都会写了。",
        "pinyin": "Wǒmen dōu huì xiě le.",
        "vietnamese": "Chúng em đều đã biết viết rồi ạ."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t2_line2.mp3",
        "duration": 1.97,
        "hanzi": "老师，我听不见。",
        "pinyin": "Lǎoshī, wǒ tīng bu jiàn.",
        "vietnamese": "Thưa cô, em không nghe thấy ạ."
      },
      {
        "lineIndex": 3,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t2_line3.mp3",
        "duration": 5.98,
        "hanzi": "请大家不要说话！请听老师的问题：你们都会写哪些汉字了？",
        "pinyin": "Qǐng dàjiā bùyào shuōhuà! Qǐng tīng lǎoshī de wèntí: Nǐmen dōu huì xiě nǎxiē Hànzì le?",
        "vietnamese": "Mọi người không được nói chuyện! Hãy nghe câu hỏi của cô: Các em đã biết viết những chữ Hán nào rồi?"
      },
      {
        "lineIndex": 4,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t2_line4.mp3",
        "duration": 2.4,
        "hanzi": "我会写这些字了，您看！",
        "pinyin": "Wǒ huì xiě zhèxiē zì le, nín kàn!",
        "vietnamese": "Em đã biết viết những chữ này rồi, cô xem này!"
      }
    ]
  },
  "hsk1-l14-t3": {
    "id": "hsk1-l14-t3",
    "lesson": 14,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在家里，刘明和王一雪在谈论孩子的升学情况。(Ở nhà, Lưu Minh và Vương Nhất Tuyết đang nói về việc con cái lên cấp học mới.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l14-t3_full.mp3",
    "totalDuration": 20.1,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.5,
        "duration": 2.5
      },
      {
        "lineIndex": 1,
        "start": 2.9,
        "end": 6.12,
        "duration": 3.22
      },
      {
        "lineIndex": 2,
        "start": 6.52,
        "end": 9.33,
        "duration": 2.81
      },
      {
        "lineIndex": 3,
        "start": 9.73,
        "end": 12.25,
        "duration": 2.52
      },
      {
        "lineIndex": 4,
        "start": 12.65,
        "end": 15.79,
        "duration": 3.14
      },
      {
        "lineIndex": 5,
        "start": 16.19,
        "end": 19.79,
        "duration": 3.6
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t3_line0.mp3",
        "duration": 2.5,
        "hanzi": "明年女儿上中学。",
        "pinyin": "Míngnián nǚ'ér shàng zhōngxué.",
        "vietnamese": "Năm sau con gái lên trung học."
      },
      {
        "lineIndex": 1,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t3_line1.mp3",
        "duration": 3.22,
        "hanzi": "对。儿子也上小学了。",
        "pinyin": "Duì. Érzi yě shàng xiǎoxué le.",
        "vietnamese": "Đúng rồi. Con trai cũng vào tiểu học rồi."
      },
      {
        "lineIndex": 2,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t3_line2.mp3",
        "duration": 2.81,
        "hanzi": "我们家有了一个中学生。",
        "pinyin": "Wǒmen jiā yǒule yī gè zhōngxuéshēng.",
        "vietnamese": "Nhà mình có một học sinh trung học rồi."
      },
      {
        "lineIndex": 3,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t3_line3.mp3",
        "duration": 2.52,
        "hanzi": "还有了一个小学生。",
        "pinyin": "Hái yǒule yī gè xiǎoxuéshēng.",
        "vietnamese": "Còn thêm một học sinh tiểu học nữa."
      },
      {
        "lineIndex": 4,
        "speaker": "刘明 (Bác sĩ Lưu Minh)",
        "speakerName": "刘明 (Bác sĩ Lưu Minh)",
        "gender": "male",
        "avatar": "👨‍⚕️",
        "persona": "Bác sĩ Lưu Minh (Vân Kiện - Bác sĩ/người cha 40t)",
        "voice": "zh-CN-YunjianNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t3_line4.mp3",
        "duration": 3.14,
        "hanzi": "上学后，他们都忙了。",
        "pinyin": "Shàngxué hòu, tāmen dōu máng le.",
        "vietnamese": "Sau khi đi học, chúng đều bận rồi."
      },
      {
        "lineIndex": 5,
        "speaker": "王一雪 (Vương Nhất Tuyết)",
        "speakerName": "王一雪 (Vương Nhất Tuyết)",
        "gender": "female",
        "avatar": "👩",
        "persona": "Vương Nhất Tuyết (Hiểu Bối - Phụ nữ gia đình đằm thắm 35t)",
        "voice": "zh-CN-liaoning-XiaobeiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l14-t3_line5.mp3",
        "duration": 3.6,
        "hanzi": "是的。太晚了，睡觉吧。",
        "pinyin": "Shì de. Tài wǎn le, shuìjiào ba.",
        "vietnamese": "Đúng vậy. Muộn rồi, đi ngủ thôi."
      }
    ]
  },
  "hsk1-l15-t1": {
    "id": "hsk1-l15-t1",
    "lesson": 15,
    "textIndex": 1,
    "title": "课文 1 (Bài khóa 1)",
    "context": "在李文家，李文邀请陈天中、白家月等朋友品尝中餐。(Ở nhà Lý Văn, Lý Văn mời Trần Thiên Trung, Bạch Gia Nguyệt và các bạn thưởng thức ẩm thực Trung Quốc.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l15-t1_full.mp3",
    "totalDuration": 14.28,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.16,
        "duration": 2.16
      },
      {
        "lineIndex": 1,
        "start": 2.56,
        "end": 5.8,
        "duration": 3.24
      },
      {
        "lineIndex": 2,
        "start": 6.2,
        "end": 8.96,
        "duration": 2.76
      },
      {
        "lineIndex": 3,
        "start": 9.36,
        "end": 14.09,
        "duration": 4.73
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t1_line0.mp3",
        "duration": 2.16,
        "hanzi": "你们爱吃哪个菜？",
        "pinyin": "Nǐmen ài chī nǎge cài?",
        "vietnamese": "Các bạn thích ăn món nào?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t1_line1.mp3",
        "duration": 3.24,
        "hanzi": "我喜欢这个，也喜欢那个。",
        "pinyin": "Wǒ xǐhuan zhège, yě xǐhuan nàge.",
        "vietnamese": "Tôi thích cái này, cũng thích cái kia."
      },
      {
        "lineIndex": 2,
        "speaker": "陈天中 (Trần Thiên Trung)",
        "speakerName": "陈天中 (Trần Thiên Trung)",
        "gender": "male",
        "avatar": "🧑‍🎓",
        "persona": "Trần Thiên Trung (Vân Dương trầm - Nam du học sinh Thái 20t)",
        "voice": "zh-CN-YunyangNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t1_line2.mp3",
        "duration": 2.76,
        "hanzi": "这些菜都好吃，还很好看。",
        "pinyin": "Zhèxiē cài dōu hǎochī, hái hěn hǎokàn.",
        "vietnamese": "Những món này đều ngon, lại còn rất đẹp mắt."
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t1_line3.mp3",
        "duration": 4.73,
        "hanzi": "我爱吃中国菜，也喜欢做。大家多吃点儿。",
        "pinyin": "Wǒ ài chī Zhōngguó cài, yě xǐhuan zuò. Dàjiā duō chī diǎnr.",
        "vietnamese": "Tôi thích ăn món Trung Quốc, cũng thích nấu. Mọi người ăn nhiều vào nhé."
      }
    ]
  },
  "hsk1-l15-t2": {
    "id": "hsk1-l15-t2",
    "lesson": 15,
    "textIndex": 2,
    "title": "课文 2 (Bài khóa 2)",
    "context": "在李文家，大家边吃饭边谈论假期计划。(Ở nhà Lý Văn, mọi người vừa ăn vừa bàn về kế hoạch nghỉ lễ.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l15-t2_full.mp3",
    "totalDuration": 17.97,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 2.09,
        "duration": 2.09
      },
      {
        "lineIndex": 1,
        "start": 2.49,
        "end": 7.12,
        "duration": 4.63
      },
      {
        "lineIndex": 2,
        "start": 7.52,
        "end": 13.4,
        "duration": 5.88
      },
      {
        "lineIndex": 3,
        "start": 13.8,
        "end": 17.78,
        "duration": 3.98
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t2_line0.mp3",
        "duration": 2.09,
        "hanzi": "你们都想去哪儿？",
        "pinyin": "Nǐmen dōu xiǎng qù nǎr?",
        "vietnamese": "Mọi người muốn đi đâu?"
      },
      {
        "lineIndex": 1,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t2_line1.mp3",
        "duration": 4.63,
        "hanzi": "去年我和男朋友去了西安，今年我想去北京。",
        "pinyin": "Qùnián wǒ hé nánpéngyou qùle Xī'ān, jīnnián wǒ xiǎng qù Běijīng.",
        "vietnamese": "Năm ngoái tôi và bạn trai đã đến Tây An, năm nay tôi muốn đến Bắc Kinh."
      },
      {
        "lineIndex": 2,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t2_line2.mp3",
        "duration": 5.88,
        "hanzi": "前几年我去了西安，非常好玩儿。今年我也想去北京。",
        "pinyin": "Qián jǐ nián wǒ qùle Xī'ān, fēicháng hǎowánr. Jīnnián wǒ yě xiǎng qù Běijīng.",
        "vietnamese": "Vài năm trước tôi đã đến Tây An, vui lắm. Năm nay tôi cũng muốn đến Bắc Kinh."
      },
      {
        "lineIndex": 3,
        "speaker": "李文 (Lý Văn)",
        "speakerName": "李文 (Lý Văn)",
        "gender": "male",
        "avatar": "👨‍🎓",
        "persona": "Lý Văn (Vân Hy - Nam sinh y khoa thanh nhã 20t)",
        "voice": "zh-CN-YunxiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t2_line3.mp3",
        "duration": 3.98,
        "hanzi": "我和王老师都是北京人，北京非常漂亮。",
        "pinyin": "Wǒ hé Wáng lǎoshī dōu shì Běijīng rén, Běijīng fēicháng piàoliang.",
        "vietnamese": "Tôi và cô giáo Vương đều là người Bắc Kinh, Bắc Kinh rất đẹp."
      }
    ]
  },
  "hsk1-l15-t3": {
    "id": "hsk1-l15-t3",
    "lesson": 15,
    "textIndex": 3,
    "title": "课文 3 (Bài khóa 3)",
    "context": "在教室外，白家月、安妮和王老师在谈论去北京旅游的事。(Ngoài lớp học, Bạch Gia Nguyệt, An Ni và cô giáo Vương đang nói về chuyện đi du lịch Bắc Kinh.)",
    "fullAudioUrl": "/audio/coursebook/hsk1-l15-t3_full.mp3",
    "totalDuration": 26.92,
    "lineTimings": [
      {
        "lineIndex": 0,
        "start": 0.0,
        "end": 3.17,
        "duration": 3.17
      },
      {
        "lineIndex": 1,
        "start": 3.57,
        "end": 5.61,
        "duration": 2.04
      },
      {
        "lineIndex": 2,
        "start": 6.01,
        "end": 13.81,
        "duration": 7.8
      },
      {
        "lineIndex": 3,
        "start": 14.21,
        "end": 18.53,
        "duration": 4.32
      },
      {
        "lineIndex": 4,
        "start": 18.93,
        "end": 20.8,
        "duration": 1.87
      },
      {
        "lineIndex": 5,
        "start": 21.2,
        "end": 26.6,
        "duration": 5.4
      }
    ],
    "lines": [
      {
        "lineIndex": 0,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t3_line0.mp3",
        "duration": 3.17,
        "hanzi": "你们的飞机到北京要几个小时？",
        "pinyin": "Nǐmen de fēijī dào Běijīng yào jǐ gè xiǎoshí?",
        "vietnamese": "Chuyến bay của các em đến Bắc Kinh mất mấy tiếng?"
      },
      {
        "lineIndex": 1,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t3_line1.mp3",
        "duration": 2.04,
        "hanzi": "九个小时。",
        "pinyin": "Jiǔ gè xiǎoshí.",
        "vietnamese": "Chín tiếng ạ."
      },
      {
        "lineIndex": 2,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t3_line2.mp3",
        "duration": 7.8,
        "hanzi": "我家人都在北京，星期天我姐姐也有时间，她可以去机场接你们，你们也可以住我家。",
        "pinyin": "Wǒ jiārén dōu zài Běijīng, Xīngqītiān wǒ jiějie yě yǒu shíjiān, tā kěyǐ qù jīchǎng jiē nǐmen, nǐmen yě kěyǐ zhù wǒ jiā.",
        "vietnamese": "Gia đình cô đều ở Bắc Kinh, Chủ nhật chị gái cô cũng có thời gian, chị ấy có thể ra sân bay đón các em, các em cũng có thể ở nhà cô."
      },
      {
        "lineIndex": 3,
        "speaker": "安妮 (Annie)",
        "speakerName": "安妮 (Annie)",
        "gender": "female",
        "avatar": "👩‍🦰",
        "persona": "Annie (Hiểu Y - Nữ du học sinh phương Tây hoạt bát 20t)",
        "voice": "zh-CN-XiaoyiNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t3_line3.mp3",
        "duration": 4.32,
        "hanzi": "我们星期日早上八点到大兴机场，早不早？",
        "pinyin": "Wǒmen Xīngqīrì zǎoshang bā diǎn dào Dàxīng Jīchǎng, zǎo bu zǎo?",
        "vietnamese": "Chúng em đến sân bay Đại Hưng lúc tám giờ sáng Chủ nhật, có sớm không ạ?"
      },
      {
        "lineIndex": 4,
        "speaker": "王一飞 (Cô Vương Nhất Phi)",
        "speakerName": "王一飞 (Cô Vương Nhất Phi)",
        "gender": "female",
        "avatar": "👩‍🏫",
        "persona": "Cô Vương Nhất Phi (Hiểu Hiểu - Nữ giáo viên chuẩn phát thanh Bắc Kinh 30t)",
        "voice": "zh-CN-XiaoxiaoNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t3_line4.mp3",
        "duration": 1.87,
        "hanzi": "不早。",
        "pinyin": "Bù zǎo.",
        "vietnamese": "Không sớm đâu."
      },
      {
        "lineIndex": 5,
        "speaker": "白家月 (Bạch Gia Nguyệt)",
        "speakerName": "白家月 (Bạch Gia Nguyệt)",
        "gender": "female",
        "avatar": "👱‍♀️",
        "persona": "Bạch Gia Nguyệt (Hiểu Ni - Nữ du học sinh dịu dàng, ngọt ngào 20t)",
        "voice": "zh-CN-shaanxi-XiaoniNeural",
        "audioUrl": "/audio/coursebook/hsk1-l15-t3_line5.mp3",
        "duration": 5.4,
        "hanzi": "谢谢老师！那我们和您姐姐在大兴机场见！",
        "pinyin": "Xièxie lǎoshī! Nà wǒmen hé nín jiějie zài Dàxīng Jīchǎng jiàn!",
        "vietnamese": "Cảm ơn cô! Vậy chúng em sẽ gặp chị của cô ở sân bay Đại Hưng!"
      }
    ]
  }
};
