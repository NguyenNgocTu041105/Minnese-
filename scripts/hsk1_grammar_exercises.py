# -*- coding: utf-8 -*-
"""
Grammar points, objectives, and exercises for all 15 lessons of New HSK 1 Course 3.0.
"""

LESSON_CONFIG = {
    1: {
        "titleHanzi": "AI小语，你好！",
        "titlePinyin": "AI Xiǎoyǔ, nǐ hǎo!",
        "titleVietnamese": "Chào AI Tiểu Ngữ!",
        "pageStart": 1,
        "objectives": [
            "能听懂并使用礼貌用语打招呼、致谢、告别 (Nghe hiểu và sử dụng lời nói lịch sự để chào hỏi, cảm ơn, tạm biệt).",
            "了解中文交际礼仪，能听懂并使用第二人称代词敬称“您” (Hiểu về nghi thức giao tiếp tiếng Trung, nghe hiểu và dùng đại từ tôn kính “您”)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l1-g1",
                "title": "1. 问候与礼貌表达 (Câu chào hỏi và cách xưng hô lịch sự)",
                "explanation": "Trong tiếng Trung, chào hỏi cơ bản nhất là dùng đại từ nhân xưng hoặc danh xưng + '好' (hǎo). Để thể hiện sự tôn trọng, lịch sự với người lớn tuổi, thầy cô giáo hoặc cấp trên, dùng đại từ kính trọng '您' (nín) thay cho '你' (nǐ). Khi chào nhiều người, dùng '你们' (nǐmen) hoặc '大家' (dàjiā).",
                "examples": [
                    {"hanzi": "你好！", "pinyin": "Nǐ hǎo!", "vietnamese": "Chào bạn!"},
                    {"hanzi": "老师，您好！", "pinyin": "Lǎoshī, nín hǎo!", "vietnamese": "Em chào thầy/cô ạ!"},
                    {"hanzi": "同学们好！", "pinyin": "Tóngxuémen hǎo!", "vietnamese": "Chào các em học sinh!"},
                    {"hanzi": "大家好！", "pinyin": "Dàjiā hǎo!", "vietnamese": "Chào mọi người!"}
                ]
            },
            {
                "id": "hsk1-l1-g2",
                "title": "2. Quy tắc biến điệu hai thanh 3 (Tone Sandhi)",
                "explanation": "Khi hai âm tiết mang thanh 3 (thanh hỏi) đi liền nhau, âm tiết thứ nhất sẽ biến điệu đọc thành thanh 2 (thanh sắc), âm tiết thứ hai vẫn giữ nguyên thanh 3. Ký hiệu phiên âm vẫn giữ nguyên thanh 3 gốc trên chữ viết. Công thức: 3 + 3 -> 2 + 3.",
                "examples": [
                    {"hanzi": "你好 (nǐ + hǎo)", "pinyin": "ní hǎo", "vietnamese": "Xin chào (nǐ đổi thành ní)"},
                    {"hanzi": "很好 (hěn + hǎo)", "pinyin": "hén hǎo", "vietnamese": "Rất tốt (hěn đổi thành hén)"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l1-ex1",
                "type": "multiple_choice",
                "question": "Khi chào thầy cô giáo hoặc người lớn tuổi hơn mình một cách tôn kính, nên nói thế nào?",
                "options": ["A. 你好！", "B. 您好！", "C. 你们好！", "D. 大家好！"],
                "correctAnswer": "B. 您好！",
                "explanation": "Dùng '您好！' (nín hǎo) để thể hiện sự kính trọng, lịch sự với người trên, thầy cô giáo."
            },
            {
                "id": "hsk1-l1-ex2",
                "type": "multiple_choice",
                "question": "Khi người khác nói '谢谢你！' (Cảm ơn bạn!), bạn nên đáp lại như thế nào?",
                "options": ["A. 再见！", "B. 不客气！", "C. 你好！", "D. 对不起！"],
                "correctAnswer": "B. 不客气！",
                "explanation": "Khi được cảm ơn ('谢谢'), ta đáp lại bằng '不客气！' (Đừng khách sáo / Không có chi)."
            }
        ]
    },
    2: {
        "titleHanzi": "我叫李文",
        "titlePinyin": "Wǒ jiào Lǐ Wén",
        "titleVietnamese": "Tôi tên là Lý Văn",
        "pageStart": 5,
        "objectives": [
            "能听懂并使用中文姓名自我介绍 (Nghe hiểu và sử dụng tên tiếng Trung để tự giới thiệu bản thân).",
            "能听懂并使用致歉语，用“对不起”和“没关系”表达歉意和回应 (Nghe hiểu và dùng “对不起” xin lỗi, “没关系” đáp lại).",
            "掌握汉语的基本语序 (Nắm vững trật tự từ cơ bản trong câu tiếng Trung).",
            "了解中文姓名的构成 (Hiểu rõ về cấu tạo họ và tên trong tiếng Trung)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l2-g1",
                "title": "1. 汉语的基本语序 (Trật tự từ cơ bản trong tiếng Trung)",
                "explanation": "Trật tự từ cơ bản trong câu tiếng Trung tương tự tiếng Việt: Chủ ngữ (S) + Vị ngữ (V) + Tân ngữ (O). Khi hỏi tên hoặc giới thiệu tên, dùng động từ '叫' (jiào): 'Chủ ngữ + 叫 + Tên'. Khi hỏi thông tin dùng đại từ nghi vấn '什么' (shénme): '你叫什么名字？'.",
                "examples": [
                    {"hanzi": "我叫李文。", "pinyin": "Wǒ jiào Lǐ Wén.", "vietnamese": "Tôi tên là Lý Văn."},
                    {"hanzi": "请问，你叫什么名字？", "pinyin": "Qǐngwèn, nǐ jiào shénme míngzi?", "vietnamese": "Xin hỏi, bạn tên là gì?"},
                    {"hanzi": "很高兴认识你！", "pinyin": "Hěn gāoxìng rènshi nǐ!", "vietnamese": "Rất vui được làm quen với bạn!"}
                ]
            },
            {
                "id": "hsk1-l2-g2",
                "title": "2. Lời xin lỗi và đáp lại (对不起 / 没关系 / 没事)",
                "explanation": "Khi cần xin lỗi vì làm phiền hoặc làm sai điều gì, ta nói '对不起' (duìbuqǐ). Người đối diện đáp lại sự tha thứ bằng '没关系' (méi guānxi) hoặc '没事' (méishì - không sao đâu).",
                "examples": [
                    {"hanzi": "对不起，我迟到了。", "pinyin": "Duìbuqǐ, wǒ chídào le.", "vietnamese": "Xin lỗi, tôi đến muộn."},
                    {"hanzi": "没关系，请坐。", "pinyin": "Méi guānxi, qǐng zuò.", "vietnamese": "Không sao đâu, mời ngồi."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l2-ex1",
                "type": "sentence_scramble",
                "question": "Sắp xếp các từ sau thành câu hoàn chỉnh giới thiệu tên:",
                "scrambleSegments": ["李文", "叫", "我"],
                "options": ["我叫李文", "李文叫我", "叫我李文"],
                "correctAnswer": "我叫李文",
                "explanation": "Trật tự câu giới thiệu tên: Chủ ngữ (我) + Động từ (叫) + Tên riêng (李文)."
            },
            {
                "id": "hsk1-l2-ex2",
                "type": "multiple_choice",
                "question": "Khi vô tình va vào ai đó, bạn nói '对不起！', người kia sẽ đáp lại:",
                "options": ["A. 不客气", "B. 没关系", "C. 谢谢", "D. 再见"],
                "correctAnswer": "B. 没关系",
                "explanation": "Đáp lại lời xin lỗi '对不起' là '没关系' (Không sao đâu)."
            }
        ]
    },
    3: {
        "titleHanzi": "我是中国人",
        "titlePinyin": "Wǒ shì Zhōngguó rén",
        "titleVietnamese": "Tôi là người Trung Quốc",
        "pageStart": 10,
        "objectives": [
            "能听懂并使用“是”字句表达等同或类属 (Nghe hiểu và sử dụng câu chữ “是” biểu đạt phán đoán, phân loại hoặc khẳng định quốc tịch).",
            "掌握结构助词“的”的用法 (Nắm vững cách dùng của trợ từ kết cấu “的”).",
            "掌握用“吗”的是非问句的用法 (Nắm vững cách dùng câu hỏi đúng-sai dùng “吗”)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l3-g1",
                "title": "1. “是”字句 (Cấu trúc câu phán đoán chữ “是”)",
                "explanation": "Câu chữ “是” (shì) biểu thị sự phán đoán, đồng nhất hoặc phân loại người/vật. Khẳng định: 'A 是 B'. Phủ định: 'A 不是 B'.",
                "examples": [
                    {"hanzi": "我是中国人。", "pinyin": "Wǒ shì Zhōngguó rén.", "vietnamese": "Tôi là người Trung Quốc."},
                    {"hanzi": "我不是法国人。", "pinyin": "Wǒ bú shì Fǎguó rén.", "vietnamese": "Tôi không phải người Pháp."},
                    {"hanzi": "他是我的中文老师。", "pinyin": "Tā shì wǒ de Zhōngwén lǎoshī.", "vietnamese": "Thầy ấy là giáo viên tiếng Trung của tôi."}
                ]
            },
            {
                "id": "hsk1-l3-g2",
                "title": "2. 结构助词“的” (Trợ từ kết cấu “的”)",
                "explanation": "Trợ từ '的' (de) dùng để nối định ngữ và trung tâm ngữ. Công thức: 'Định ngữ (người/vật sở hữu hoặc tính chất) + 的 + Trung tâm ngữ'. Khi biểu thị quan hệ họ hàng thân thuộc hoặc đơn vị gắn bó mật thiết, '的' có thể được lược bỏ.",
                "examples": [
                    {"hanzi": "这是我的书。", "pinyin": "Zhè shì wǒ de shū.", "vietnamese": "Đây là sách của tôi."},
                    {"hanzi": "我的女朋友是泰国人。", "pinyin": "Wǒ de nǚpéngyou shì Tàiguó rén.", "vietnamese": "Bạn gái tôi là người Thái Lan."}
                ]
            },
            {
                "id": "hsk1-l3-g3",
                "title": "3. 用“吗”的是非问句 (Câu hỏi đúng - sai dùng “吗”)",
                "explanation": "Thêm trợ từ nghi vấn '吗' (ma) vào cuối câu trần thuật để chuyển thành câu hỏi Có/Không (Yes-No Question). Trật tự từ trong câu không thay đổi.",
                "examples": [
                    {"hanzi": "你是中国人吗？", "pinyin": "Nǐ shì Zhōngguó rén ma?", "vietnamese": "Bạn là người Trung Quốc phải không?"},
                    {"hanzi": "你工作忙吗？", "pinyin": "Nǐ gōngzuò máng ma?", "vietnamese": "Công việc của bạn bận không?"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l3-ex1",
                "type": "multiple_choice",
                "question": "Chuyển câu '他是中国人。' thành câu hỏi Có/Không bằng cách thêm từ nào vào cuối câu?",
                "options": ["A. 呢", "B. 吗", "C. 吧", "D. 的"],
                "correctAnswer": "B. 吗",
                "explanation": "Thêm '吗' vào cuối câu khẳng định để tạo câu hỏi nghi vấn đúng sai: 他是中国人吗？"
            },
            {
                "id": "hsk1-l3-ex2",
                "type": "fill_blank",
                "question": "Điền trợ từ thích hợp vào chỗ trống: 这是我___中文老师。",
                "options": ["A. 的", "B. 吗", "C. 呢", "D. 个"],
                "correctAnswer": "A. 的",
                "explanation": "Dùng trợ từ kết cấu '的' biểu thị quan hệ sở hữu/xác định: 我的中文老师."
            }
        ]
    },
    4: {
        "titleHanzi": "我有两个孩子",
        "titlePinyin": "Wǒ yǒu liǎng gè háizi",
        "titleVietnamese": "Tôi có hai đứa con",
        "pageStart": 18,
        "objectives": [
            "能听懂并使用“有”字句（1）表达领有人或物品 (Nghe hiểu và dùng câu chữ “有” biểu đạt sự sở hữu người hoặc đồ vật).",
            "掌握“A……，B呢？”的用法 (Nắm vững cấu trúc hỏi tỉnh lược “A..., B呢?”).",
            "掌握本课数词、量词的用法 (Nắm vững cách dùng số từ và lượng từ).",
            "了解中国人如何问答年龄，能使用合适的词语进行年龄问答 (Biết cách hỏi và trả lời tuổi tác trong tiếng Trung)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l4-g1",
                "title": "1. “有”字句（1）(Cấu trúc câu biểu đạt sự sở hữu với “有”)",
                "explanation": "Động từ '有' (yǒu) dùng để biểu thị sự sở hữu (có ai/cái gì). Thể phủ định bắt buộc dùng '没有' (méiyǒu), tuyệt đối không dùng *不有.",
                "examples": [
                    {"hanzi": "我有两个孩子。", "pinyin": "Wǒ yǒu liǎng gè háizi.", "vietnamese": "Tôi có hai đứa con."},
                    {"hanzi": "我没有哥哥。", "pinyin": "Wǒ méiyǒu gēge.", "vietnamese": "Tôi không có anh trai."},
                    {"hanzi": "你有儿子吗？", "pinyin": "Nǐ yǒu érzi ma?", "vietnamese": "Bạn có con trai không?"}
                ]
            },
            {
                "id": "hsk1-l4-g2",
                "title": "2. 数字的表达与“两”和“二”的区别 (Cách dùng số đếm, '两' và '二')",
                "explanation": "Khi đứng trước lượng từ để chỉ số lượng 2 người/vật, ta dùng '两' (liǎng) chứ không dùng '二' (èr). '二' dùng khi đếm số thứ tự hoặc số nhà, số điện thoại.",
                "examples": [
                    {"hanzi": "两个孩子", "pinyin": "liǎng gè háizi", "vietnamese": "hai đứa con (dùng 两)"},
                    {"hanzi": "一、二、三", "pinyin": "yī, èr, sān", "vietnamese": "1, 2, 3 (đếm số dùng 二)"}
                ]
            },
            {
                "id": "hsk1-l4-g3",
                "title": "3. 语气助词“呢”（1）(Trợ từ ngữ khí “呢” hỏi tỉnh lược)",
                "explanation": "Khi ngữ cảnh đã rõ ràng, ta dùng cấu trúc 'A……, B 呢？' để hỏi lại về đối tượng B mà không cần lặp lại câu hỏi trước đó.",
                "examples": [
                    {"hanzi": "我有两个孩子，你呢？", "pinyin": "Wǒ yǒu liǎng gè háizi, nǐ ne?", "vietnamese": "Tôi có hai đứa con, còn bạn thì sao?"},
                    {"hanzi": "我很好，你呢？", "pinyin": "Wǒ hěn hǎo, nǐ ne?", "vietnamese": "Tôi rất khỏe, còn bạn?"}
                ]
            },
            {
                "id": "hsk1-l4-g4",
                "title": "4. 名量词和名量结构 (Danh lượng từ và kết cấu Số + Lượng + Danh)",
                "explanation": "Trong tiếng Trung, giữa số từ và danh từ bắt buộc phải có lượng từ: Số từ + Lượng từ + Danh từ. '个' (gè) là lượng từ thông dụng nhất; '口' (kǒu) dùng cho số nhân khẩu trong gia đình; '岁' (suì) dùng chỉ số tuổi.",
                "examples": [
                    {"hanzi": "我家有三口人。", "pinyin": "Wǒ jiā yǒu sān kǒu rén.", "vietnamese": "Nhà tôi có 3 người."},
                    {"hanzi": "他今年十岁。", "pinyin": "Tā jīnnián shí suì.", "vietnamese": "Năm nay cậu bé 10 tuổi."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l4-ex1",
                "type": "multiple_choice",
                "question": "Điền từ thích hợp vào chỗ trống để nói 'Tôi có hai người con': 我有___个孩子。",
                "options": ["A. 二", "B. 两", "C. 几", "D. 多少"],
                "correctAnswer": "B. 两",
                "explanation": "Đứng trước lượng từ '个' để chỉ số lượng 2, bắt buộc dùng '两' (liǎng gè)."
            },
            {
                "id": "hsk1-l4-ex2",
                "type": "multiple_choice",
                "question": "Câu phủ định của '我有哥哥。' (Tôi có anh trai) là:",
                "options": ["A. 我不有哥哥。", "B. 我没有哥哥。", "C. 我不哥哥。", "D. 我没哥哥有。"],
                "correctAnswer": "B. 我没有哥哥。",
                "explanation": "Phủ định của '有' bắt buộc là '没有' (méiyǒu)."
            }
        ]
    },
    5: {
        "titleHanzi": "今天我休息",
        "titlePinyin": "Jīntiān wǒ xiūxi",
        "titleVietnamese": "Hôm nay tôi nghỉ ngơi",
        "pageStart": 27,
        "objectives": [
            "能听懂、看懂并按照中文习惯描述事件、行为发生的日期 (Nghe hiểu, đọc hiểu và mô tả ngày tháng theo thói quen tiếng Trung).",
            "能听懂并使用能愿动词“会”表达懂得或有能力做事情 (Nghe hiểu và dùng động từ năng nguyện “会” biểu đạt kỹ năng, năng lực).",
            "掌握名词谓语句的用法 (Nắm vững cách dùng câu vị ngữ danh từ)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l5-g1",
                "title": "1. 时间的表达（1）(Cách biểu đạt ngày tháng trong tiếng Trung)",
                "explanation": "Trong tiếng Trung, trật tự biểu đạt thời gian luôn đi từ lớn đến nhỏ: Năm (年 nián) -> Tháng (月 yuè) -> Ngày (日 rì / 号 hào) -> Thứ trong tuần (星期 xīngqī). Trong khẩu ngữ hàng ngày, người ta thường dùng '号' thay cho '日'.",
                "examples": [
                    {"hanzi": "今天5月20号。", "pinyin": "Jīntiān wǔ yuè èrshí hào.", "vietnamese": "Hôm nay là ngày 20 tháng 5."},
                    {"hanzi": "今天星期日，我休息。", "pinyin": "Jīntiān Xīngqīrì, wǒ xiūxi.", "vietnamese": "Hôm nay Chủ nhật, tôi nghỉ ngơi."}
                ]
            },
            {
                "id": "hsk1-l5-g2",
                "title": "2. 名词谓语句 (Câu vị ngữ danh từ)",
                "explanation": "Câu vị ngữ danh từ là câu mà vị ngữ trực tiếp do danh từ, số từ hoặc cụm danh từ đảm nhiệm mà không cần dùng động từ '是'. Thường dùng để biểu thị ngày tháng, thời gian, thời tiết, tuổi tác hoặc giá cả.",
                "examples": [
                    {"hanzi": "今天星期几？", "pinyin": "Jīntiān xīngqī jǐ?", "vietnamese": "Hôm nay thứ mấy?"},
                    {"hanzi": "今天星期日。", "pinyin": "Jīntiān Xīngqīrì.", "vietnamese": "Hôm nay Chủ nhật."},
                    {"hanzi": "今天5月20号。", "pinyin": "Jīntiān wǔ yuè èrshí hào.", "vietnamese": "Hôm nay ngày 20 tháng 5."}
                ]
            },
            {
                "id": "hsk1-l5-g3",
                "title": "3. 能愿动词“会” (Động từ năng nguyện “会”)",
                "explanation": "Động từ năng nguyện '会' (huì) đứng trước động từ để biểu thị năng lực, kỹ năng có được thông qua quá trình học tập, rèn luyện. Dạng phủ định là '不会' (bú huì).",
                "examples": [
                    {"hanzi": "你会做饭吗？", "pinyin": "Nǐ huì zuò fàn ma?", "vietnamese": "Bạn biết nấu cơm không?"},
                    {"hanzi": "我会做中国菜。", "pinyin": "Wǒ huì zuò Zhōngguó cài.", "vietnamese": "Tôi biết nấu món ăn Trung Quốc."},
                    {"hanzi": "我不会包饺子。", "pinyin": "Wǒ bú huì bāo jiǎozi.", "vietnamese": "Tôi không biết gói sủi cảo."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l5-ex1",
                "type": "multiple_choice",
                "question": "Hỏi 'Hôm nay thứ mấy?', ta nói:",
                "options": ["A. 今天几号？", "B. 今天星期几？", "C. 今天几月？", "D. 今天多少号？"],
                "correctAnswer": "B. 今天星期几？",
                "explanation": "Hỏi thứ trong tuần dùng '星期几' (xīngqī jǐ). Còn '几号' dùng hỏi ngày trong tháng."
            },
            {
                "id": "hsk1-l5-ex2",
                "type": "fill_blank",
                "question": "Điền từ phủ định thích hợp: 我___会做饭。(Tôi không biết nấu ăn)",
                "options": ["A. 没", "B. 不", "C. 别", "D. 无"],
                "correctAnswer": "B. 不",
                "explanation": "Phủ định của động từ năng nguyện '会' luôn là '不会' (bú huì)."
            }
        ]
    },
    6: {
        "titleHanzi": "你的手机号是多少？",
        "titlePinyin": "Nǐ de shǒujīhào shì duōshao?",
        "titleVietnamese": "Số điện thoại của bạn là bao nhiêu?",
        "pageStart": 35,
        "objectives": [
            "能听懂手机号码并使用号码拨打手机 (Nghe hiểu số điện thoại và dùng số quay cuộc gọi).",
            "能听懂并使用两个或多个动词性短语表达动作的目的或方式 (Nghe hiểu và dùng cụm liên động biểu đạt mục đích, cách thức).",
            "掌握能愿动词“想”的用法 (Nắm vững cách dùng động từ năng nguyện “想”).",
            "掌握疑问代词“怎么”询问方式的用法 (Nắm vững cách dùng đại từ nghi vấn “怎么” hỏi cách thức)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l6-g1",
                "title": "1. 能愿动词“想” (Động từ năng nguyện “想”)",
                "explanation": "'想' (xiǎng) đứng trước động từ biểu thị nguyện vọng, ý muốn hoặc dự định chủ quan (muốn làm gì). Thể phủ định là '不想' (bù xiǎng).",
                "examples": [
                    {"hanzi": "我想去超市买东西。", "pinyin": "Wǒ xiǎng qù chāoshì mǎi dōngxi.", "vietnamese": "Tôi muốn đi siêu thị mua đồ."},
                    {"hanzi": "你晚饭想吃什么？", "pinyin": "Nǐ wǎnfàn xiǎng chī shénme?", "vietnamese": "Cơm tối bạn muốn ăn gì?"}
                ]
            },
            {
                "id": "hsk1-l6-g2",
                "title": "2. 连动句（1）(Câu liên động chỉ mục đích / phương thức)",
                "explanation": "Câu liên động gồm hai hành động liên tiếp nhau: Hành động 1 biểu thị phương thức hoặc đi đến đâu, hành động 2 biểu thị mục đích. Cấu trúc phổ biến: 'Chủ ngữ + 去 / 坐... + Nơi chốn + Động từ 2'.",
                "examples": [
                    {"hanzi": "我去超市买东西。", "pinyin": "Wǒ qù chāoshì mǎi dōngxi.", "vietnamese": "Tôi đi siêu thị mua đồ (đi siêu thị để mua đồ)."},
                    {"hanzi": "我们坐出租车去西安饭店。", "pinyin": "Wǒmen zuò chūzūchē qù Xī'ān Fàndiàn.", "vietnamese": "Chúng tôi đi taxi đến khách sạn Tây An."}
                ]
            },
            {
                "id": "hsk1-l6-g3",
                "title": "3. 疑问代词“怎么” (Đại từ nghi vấn “怎么” hỏi cách thức)",
                "explanation": "Đại từ '怎么' (zěnme) đứng trước động từ để hỏi về phương thức hoặc cách thức thực hiện hành động: '怎么 + Động từ?' (Làm thế nào?).",
                "examples": [
                    {"hanzi": "怎么去西安饭店？", "pinyin": "Zěnme qù Xī'ān Fàndiàn?", "vietnamese": "Đi đến nhà hàng Tây An như thế nào?"},
                    {"hanzi": "这个字怎么读？", "pinyin": "Zhè ge zì zěnme dú?", "vietnamese": "Chữ này đọc như thế nào?"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l6-ex1",
                "type": "multiple_choice",
                "question": "Hỏi số điện thoại của người khác, ta nói:",
                "options": ["A. 你的手机号是几？", "B. 你的手机号是多少？", "C. 你的手机号怎么？", "D. 你的手机号哪儿？"],
                "correctAnswer": "B. 你的手机号是多少？",
                "explanation": "Hỏi dãy số dài (như số điện thoại, số phòng lớn) dùng '是多少？' (shì duōshao)."
            },
            {
                "id": "hsk1-l6-ex2",
                "type": "sentence_scramble",
                "question": "Sắp xếp câu liên động sau: 去 / 买东西 / 超市 / 我",
                "scrambleSegments": ["我", "去超市", "买东西"],
                "options": ["我去超市买东西", "我买东西去超市", "超市我去买东西"],
                "correctAnswer": "我去超市买东西",
                "explanation": "Cấu trúc câu liên động: Chủ ngữ (我) + Đến địa điểm (去超市) + Làm gì (买东西)."
            }
        ]
    },
    7: {
        "titleHanzi": "我晚上六点半下班",
        "titlePinyin": "Wǒ wǎnshang liù diǎn bàn xiàbān",
        "titleVietnamese": "Buổi tối 6 rưỡi tôi tan làm",
        "pageStart": 45,
        "objectives": [
            "能听懂并描述事情发生的时间 (Nghe hiểu và miêu tả thời gian diễn ra sự việc).",
            "掌握语气助词“吧”（1）表达建议、商量等的用法 (Nắm vững cách dùng trợ từ “吧” biểu thị đề xuất, thương lượng).",
            "掌握语气助词“呢”（2）表达确认的事实的用法 (Nắm vững cách dùng trợ từ “呢” khẳng định sự thật xác thực).",
            "掌握副词、时间词语作状语的位置 (Nắm vững vị trí của phó từ, trạng từ chỉ thời gian trong câu)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l7-g1",
                "title": "1. 时间的表达（2）(Cách biểu đạt giờ giấc trong tiếng Trung)",
                "explanation": "Cách nói giờ: 'Số + 点 (diǎn)' (giờ), 'Số + 分 (fēn)' (phút). Nửa giờ (30 phút) dùng '半 (bàn)'. Khi biểu đạt thời điểm có cả buổi trong ngày, từ chỉ buổi (早上, 上午, 下午, 晚上) đứng trước giờ.",
                "examples": [
                    {"hanzi": "现在几点？", "pinyin": "Xiànzài jǐ diǎn?", "vietnamese": "Bây giờ là mấy giờ?"},
                    {"hanzi": "晚上六点半", "pinyin": "wǎnshang liù diǎn bàn", "vietnamese": "6 rưỡi tối (18:30)"},
                    {"hanzi": "上午八点十分", "pinyin": "shàngwǔ bā diǎn shí fēn", "vietnamese": "8 giờ 10 phút sáng"}
                ]
            },
            {
                "id": "hsk1-l7-g2",
                "title": "2. 语气助词“吧”（1）(Trợ từ ngữ khí “吧” biểu thị đề nghị)",
                "explanation": "Trợ từ '吧' (ba) đặt ở cuối câu trần thuật hoặc cầu khiến nhằm đưa ra lời đề nghị, gợi ý, rủ rê hoặc thương lượng một cách hòa nhã.",
                "examples": [
                    {"hanzi": "我们看电影吧！", "pinyin": "Wǒmen kàn diànyǐng ba!", "vietnamese": "Chúng mình đi xem phim đi!"},
                    {"hanzi": "我们走吧。", "pinyin": "Wǒmen zǒu ba.", "vietnamese": "Chúng ta đi thôi nào."}
                ]
            },
            {
                "id": "hsk1-l7-g3",
                "title": "3. 副词、时间词语作状语的位置 (Vị trí của từ chỉ thời gian làm trạng ngữ)",
                "explanation": "Từ chỉ thời gian khi làm trạng ngữ có thể đứng trước hoặc ngay sau chủ ngữ, nhưng luôn đứng TRƯỚC vị ngữ (động từ/tính từ). Tuyệt đối không đặt từ chỉ thời gian ở cuối câu như tiếng Anh hay tiếng Việt.",
                "examples": [
                    {"hanzi": "我晚上六点半下班。", "pinyin": "Wǒ wǎnshang liù diǎn bàn xiàbān.", "vietnamese": "Buổi tối 6 rưỡi tôi tan làm."},
                    {"hanzi": "晚上六点半我下班。", "pinyin": "Wǎnshang liù diǎn bàn wǒ xiàbān.", "vietnamese": "6 rưỡi tối tôi tan làm."}
                ]
            },
            {
                "id": "hsk1-l7-g4",
                "title": "4. 语气助词“呢”（2）(Trợ từ ngữ khí “呢” khẳng định sự việc)",
                "explanation": "Trợ từ '呢' (ne) đặt ở cuối câu để khẳng định một sự việc, thông tin xác thực với ngữ khí quả quyết hoặc vui tươi nhẹ nhàng.",
                "examples": [
                    {"hanzi": "我下午有课呢。", "pinyin": "Wǒ xiàwǔ yǒu kè ne.", "vietnamese": "Buổi chiều tôi có tiết học đấy."},
                    {"hanzi": "他在家呢。", "pinyin": "Tā zài jiā ne.", "vietnamese": "Anh ấy đang ở nhà đấy."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l7-ex1",
                "type": "multiple_choice",
                "question": "Diễn đạt '6 giờ 30 phút tối' trong tiếng Trung chuẩn là:",
                "options": ["A. 六点半晚上", "B. 晚上六点半", "C. 半六点晚上", "D. 晚上半六点"],
                "correctAnswer": "B. 晚上六点半",
                "explanation": "Quy tắc thời gian lớn trước, nhỏ sau: Buổi (晚上) + Giờ (六点) + Phút/Rưỡi (半)."
            },
            {
                "id": "hsk1-l7-ex2",
                "type": "fill_blank",
                "question": "Điền trợ từ thích hợp vào câu rủ bạn bè: 我们去看电影___！",
                "options": ["A. 吗", "B. 呢", "C. 吧", "D. 的"],
                "correctAnswer": "C. 吧",
                "explanation": "Dùng trợ từ ngữ khí '吧' ở cuối câu để gợi ý, rủ rê."
            }
        ]
    },
    8: {
        "titleHanzi": "我爸爸也在医院工作",
        "titlePinyin": "Wǒ bàba yě zài yīyuàn gōngzuò",
        "titleVietnamese": "Bố tôi cũng làm việc ở bệnh viện",
        "pageStart": 54,
        "objectives": [
            "能听懂并描述处所、位置等信息 (Nghe hiểu và miêu tả thông tin về nơi chốn, vị trí).",
            "掌握介词“在”表示方位的用法 (Nắm vững cách dùng giới từ “在” biểu thị phương vị, nơi chốn).",
            "掌握能愿动词“能”的用法 (Nắm vững cách dùng động từ năng nguyện “能”)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l8-g1",
                "title": "1. 方位词 (Từ chỉ phương vị)",
                "explanation": "Từ chỉ phương vị là những từ chỉ vị trí, phương hướng như: 上 (shàng - trên), 下 (xià - dưới), 前 (qián - trước), 后 (hòu - sau), 里 (lǐ - trong), 外 (wài - ngoài). Cấu trúc: 'Danh từ + Phương vị từ'.",
                "examples": [
                    {"hanzi": "房间外有一只小猫。", "pinyin": "Fángjiān wài yǒu yì zhī xiǎomāo.", "vietnamese": "Bên ngoài phòng có một chú mèo nhỏ."},
                    {"hanzi": "桌子上有两本书。", "pinyin": "Zhuōzi shang yǒu liǎng běn shū.", "vietnamese": "Trên bàn có hai quyển sách."}
                ]
            },
            {
                "id": "hsk1-l8-g2",
                "title": "2. 介词“在” (Giới từ “在” chỉ địa điểm hành động)",
                "explanation": "Giới từ '在' kết hợp với từ chỉ nơi chốn tạo thành cụm giới từ làm trạng ngữ, đứng trước động từ: 'Chủ ngữ + 在 + Nơi chốn + Động từ' (Ai làm việc gì ở đâu).",
                "examples": [
                    {"hanzi": "我爸爸在医院工作。", "pinyin": "Wǒ bàba zài yīyuàn gōngzuò.", "vietnamese": "Bố tôi làm việc ở bệnh viện."},
                    {"hanzi": "他在书店看书。", "pinyin": "Tā zài shūdiàn kàn shū.", "vietnamese": "Anh ấy đọc sách ở hiệu sách."}
                ]
            },
            {
                "id": "hsk1-l8-g3",
                "title": "3. 能愿动词“能” (Động từ năng nguyện “能”)",
                "explanation": "'能' (néng) đứng trước động từ biểu thị có đủ năng lực, điều kiện khách quan hoặc hoàn cảnh cho phép để thực hiện hành động. Phủ định là '不能' (bù néng).",
                "examples": [
                    {"hanzi": "你能来吗？", "pinyin": "Nǐ néng lái ma?", "vietnamese": "Bạn có thể đến không?"},
                    {"hanzi": "我明天能去学校。", "pinyin": "Wǒ míngtiān néng qù xuéxiào.", "vietnamese": "Ngày mai tôi có thể đến trường."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l8-ex1",
                "type": "sentence_scramble",
                "question": "Sắp xếp các từ sau thành câu đúng ngữ pháp: 在 / 工作 / 爸爸 / 我 / 医院",
                "scrambleSegments": ["我爸爸", "在医院", "工作"],
                "options": ["我爸爸在医院工作", "我爸爸工作在医院", "在医院我爸爸工作"],
                "correctAnswer": "我爸爸在医院工作",
                "explanation": "Quy tắc nơi chốn: Chủ ngữ (我爸爸) + Ở đâu (在医院) + Làm gì (工作)."
            },
            {
                "id": "hsk1-l8-ex2",
                "type": "multiple_choice",
                "question": "Để nói 'Bên ngoài phòng', ta nói thế nào trong tiếng Trung?",
                "options": ["A. 外房间", "B. 房间外", "C. 房间在", "D. 房间里"],
                "correctAnswer": "B. 房间外",
                "explanation": "Từ chỉ phương vị đứng sau danh từ: 房间 (phòng) + 外 (ngoài) = 房间外."
            }
        ]
    },
    9: {
        "titleHanzi": "我明天上午在学校学习",
        "titlePinyin": "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí",
        "titleVietnamese": "Sáng mai tôi học ở trường",
        "pageStart": 61,
        "objectives": [
            "能听懂并使用“有/是”表达存在 (Nghe hiểu và dùng “有/是” biểu đạt sự tồn tại của người/vật).",
            "掌握时间词语和处所词语同现时的顺序 (Nắm vững trật tự sắp xếp khi từ chỉ thời gian và địa điểm cùng xuất hiện).",
            "掌握“第”的用法 (Nắm vững cách dùng của tiền tố số thứ tự “第”).",
            "了解当代中国人的休闲活动 (Tìm hiểu các hoạt động giải trí của người Trung Quốc hiện đại)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l9-g1",
                "title": "1. 存现句（1）(Câu tồn hiện chỉ sự tồn tại với “有/是”)",
                "explanation": "Câu tồn hiện dùng để biểu thị ở một địa điểm nào đó có người hoặc sự vật xuất hiện. Cấu trúc: 'Nơi chốn / Phương vị + 有 / 是 + Danh từ'. '有' nhấn mạnh sự tồn tại khách quan, '是' nhấn mạnh sự xác định duy nhất.",
                "examples": [
                    {"hanzi": "学校前边有一家电影院。", "pinyin": "Xuéxiào qiánbian yǒu yì jiā diànyǐngyuàn.", "vietnamese": "Phía trước trường học có một rạp chiếu phim."},
                    {"hanzi": "桌子上是一本书。", "pinyin": "Zhuōzi shang shì yì běn shū.", "vietnamese": "Trên bàn là một cuốn sách."}
                ]
            },
            {
                "id": "hsk1-l9-g2",
                "title": "2. 时间词语和处所词语同时作状语的顺序 (Trật tự Thời gian & Địa điểm cùng làm trạng ngữ)",
                "explanation": "Khi trong câu có cả trạng ngữ chỉ thời gian và trạng ngữ chỉ nơi chốn, quy tắc bất di bất dịch của tiếng Trung là: THỜI GIAN ĐỨNG TRƯỚC NƠI CHỐN. Công thức: 'Chủ ngữ + Thời gian + Tại nơi chốn + Làm gì'.",
                "examples": [
                    {"hanzi": "我明天上午在学校学习。", "pinyin": "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.", "vietnamese": "Sáng mai tôi học ở trường."},
                    {"hanzi": "他今天晚上在家里看电视。", "pinyin": "Tā jīntiān wǎnshang zài jiā lǐ kàn diànshì.", "vietnamese": "Tối nay anh ấy xem ti vi ở nhà."}
                ]
            },
            {
                "id": "hsk1-l9-g3",
                "title": "3. 表示序数的“第” (Tiền tố chỉ số thứ tự “第”)",
                "explanation": "Thêm tiền tố '第' (dì) vào trước số từ để biểu thị thứ tự: '第 + Số từ [+ Lượng từ + Danh từ]'.",
                "examples": [
                    {"hanzi": "第一", "pinyin": "dì-yī", "vietnamese": "thứ nhất, số một"},
                    {"hanzi": "第一本书", "pinyin": "dì-yī běn shū", "vietnamese": "cuốn sách đầu tiên"},
                    {"hanzi": "第二只猫", "pinyin": "dì-èr zhī māo", "vietnamese": "con mèo thứ hai"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l9-ex1",
                "type": "sentence_scramble",
                "question": "Sắp xếp câu đúng trật tự thời gian và địa điểm: 在学校 / 我 / 明天上午 / 学习",
                "scrambleSegments": ["我", "明天上午", "在学校", "学习"],
                "options": ["我明天上午在学校学习", "我在学校明天上午学习", "明天上午学习我在学校"],
                "correctAnswer": "我明天上午在学校学习",
                "explanation": "Quy tắc vàng tiếng Trung: Thời gian (明天上午) đứng TRƯỚC địa điểm (在学校)."
            },
            {
                "id": "hsk1-l9-ex2",
                "type": "multiple_choice",
                "question": "Để nói 'bài hát thứ nhất', ta dùng:",
                "options": ["A. 一首歌", "B. 第一首歌", "C. 歌第一", "D. 头一首歌"],
                "correctAnswer": "B. 第一首歌",
                "explanation": "Tiền tố chỉ số thứ tự '第': 第 + 一 +  lượng từ 首 + danh từ 歌."
            }
        ]
    },
    10: {
        "titleHanzi": "这儿的苹果真便宜！",
        "titlePinyin": "Zhèr de píngguǒ zhēn piányi!",
        "titleVietnamese": "Táo ở đây thật rẻ!",
        "pageStart": 70,
        "objectives": [
            "能听懂、看懂并简单谈论商品价格 (Nghe hiểu, đọc hiểu và trao đổi đơn giản về giá cả hàng hóa).",
            "掌握形容词谓语句的用法 (Nắm vững cách dùng câu vị ngữ tính từ).",
            "掌握疑问代词“怎么样”的用法 (Nắm vững cách dùng đại từ nghi vấn “怎么样”).",
            "认识人民币 (Làm quen và nhận biết đồng Nhân dân tệ)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l10-g1",
                "title": "1. 钱数的表达 (Cách biểu đạt số tiền trong tiếng Trung)",
                "explanation": "Tiền tệ Trung Quốc (Nhân dân tệ RMB) có 3 đơn vị: Khẩu ngữ dùng 块 (kuài - đồng) / 毛 (máo - hào) / 分 (fēn - xu). Văn viết dùng 元 (yuán) / 角 (jiǎo) / 分 (fēn). Khi hỏi giá tiền, dùng '多少钱？' (duōshao qián?).",
                "examples": [
                    {"hanzi": "苹果多少钱一斤？", "pinyin": "Píngguǒ duōshao qián yì jīn?", "vietnamese": "Táo bao nhiêu tiền một cân (500g)?"},
                    {"hanzi": "三块五毛", "pinyin": "sān kuài wǔ máo", "vietnamese": "3 tệ 5 hào (3.5 RMB)"},
                    {"hanzi": "这件衣服一百元。", "pinyin": "Zhè jiàn yīfu yìbǎi yuán.", "vietnamese": "Bộ quần áo này 100 tệ."}
                ]
            },
            {
                "id": "hsk1-l10-g2",
                "title": "2. 形容词谓语句 (Câu vị ngữ tính từ)",
                "explanation": "Câu có vị ngữ do tính từ đảm nhiệm dùng để miêu tả đặc điểm, tính chất. Giữa chủ ngữ và tính từ KHÔNG dùng '是'. Thông thường, tính từ đi kèm các phó từ chỉ mức độ như '很' (rất), '真' (thật là), '非常' (vô cùng).",
                "examples": [
                    {"hanzi": "这儿的苹果真便宜！", "pinyin": "Zhèr de píngguǒ zhēn piányi!", "vietnamese": "Táo ở đây thật rẻ!"},
                    {"hanzi": "那件衣服非常贵。", "pinyin": "Nà jiàn yīfu fēicháng guì.", "vietnamese": "Chiếc áo kia vô cùng đắt."}
                ]
            },
            {
                "id": "hsk1-l10-g3",
                "title": "3. 疑问代词“怎么样” (Đại từ nghi vấn “怎么样”)",
                "explanation": "'怎么样' (zěnmeyàng) dùng để hỏi về tính chất, tình hình của người/vật hoặc trưng cầu ý kiến đề xuất của người khác.",
                "examples": [
                    {"hanzi": "这件衣服怎么样？", "pinyin": "Zhè jiàn yīfu zěnmeyàng?", "vietnamese": "Chiếc áo này thế nào?"},
                    {"hanzi": "我们去买水果，怎么样？", "pinyin": "Wǒmen qù mǎi shuǐguǒ, zěnmeyàng?", "vietnamese": "Chúng mình đi mua hoa quả nhé, thấy sao?"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l10-ex1",
                "type": "multiple_choice",
                "question": "Hỏi giá của một cân táo, câu nào chuẩn nhất?",
                "options": ["A. 苹果几钱？", "B. 苹果怎么钱？", "C. 苹果多少钱一斤？", "D. 苹果什么钱？"],
                "correctAnswer": "C. 苹果多少钱一斤？",
                "explanation": "Hỏi giá tiền trong tiếng Trung dùng '多少钱' (duōshao qián)."
            },
            {
                "id": "hsk1-l10-ex2",
                "type": "fill_blank",
                "question": "Chọn phó từ cảm thán: 这儿的水果___便宜！(Hoa quả ở đây thật là rẻ!)",
                "options": ["A. 是", "B. 真", "C. 个", "D. 吗"],
                "correctAnswer": "B. 真",
                "explanation": "'真' (zhēn) đứng trước tính từ biểu thị cảm thán: 真便宜 (thật là rẻ)."
            }
        ]
    },
    11: {
        "titleHanzi": "我读大学呢",
        "titlePinyin": "Wǒ dú dàxué ne",
        "titleVietnamese": "Tôi đang học đại học đấy",
        "pageStart": 78,
        "objectives": [
            "能听懂并使用三种结构表达正在做的事情 (Nghe hiểu và dùng 3 cấu trúc biểu đạt hành động đang tiếp diễn).",
            "能听懂并使用正反问格式进行提问 (Nghe hiểu và đặt câu hỏi theo thể chính phản).",
            "掌握能愿动词“要”表达想做、打算做的用法 (Nắm vững cách dùng động từ năng nguyện “要” biểu thị ý muốn, dự định)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l11-g1",
                "title": "1. 正反问 (Câu hỏi chính phản)",
                "explanation": "Câu hỏi chính phản kết hợp dạng khẳng định và phủ định của động từ hoặc tính từ: 'V + 不 + V?' hoặc 'A + 不 + A?'. Với '有' ta dùng '有没有?'. Khi dùng câu hỏi chính phản thì KHÔNG dùng '吗' ở cuối câu nữa.",
                "examples": [
                    {"hanzi": "你去不去学校？", "pinyin": "Nǐ qù bu qù xuéxiào?", "vietnamese": "Bạn có đi trường không?"},
                    {"hanzi": "你想不想吃中国菜？", "pinyin": "Nǐ xiǎng bu xiǎng chī Zhōngguó cài?", "vietnamese": "Bạn có muốn ăn món Trung Quốc không?"},
                    {"hanzi": "你有没有手机？", "pinyin": "Nǐ yǒu méiyǒu shǒujī?", "vietnamese": "Bạn có điện thoại di động không?"}
                ]
            },
            {
                "id": "hsk1-l11-g2",
                "title": "2. 时间副词“在/正在”与“呢” (Biểu đạt hành động đang tiếp diễn)",
                "explanation": "Có 3 cấu trúc biểu thị hành động đang diễn ra tại một thời điểm: (1) 在 + V; (2) 正在 + V; (3) [在/正在] + V + 呢. Thể phủ định dùng '没在 + V'.",
                "examples": [
                    {"hanzi": "我正在开车呢。", "pinyin": "Wǒ zhèngzài kāichē ne.", "vietnamese": "Tôi đang lái xe đây này."},
                    {"hanzi": "他在睡觉。", "pinyin": "Tā zài shuìjiào.", "vietnamese": "Anh ấy đang ngủ."},
                    {"hanzi": "我读大学呢。", "pinyin": "Wǒ dú dàxué ne.", "vietnamese": "Tôi đang học đại học đấy."}
                ]
            },
            {
                "id": "hsk1-l11-g3",
                "title": "3. 能愿动词“要” (Động từ năng nguyện “要”)",
                "explanation": "'要' (yào) đứng trước động từ biểu thị ý muốn, quyết tâm hoặc dự định cần làm điều gì đó (muốn / cần / sắp).",
                "examples": [
                    {"hanzi": "我要去饭店。", "pinyin": "Wǒ yào qù fàndiàn.", "vietnamese": "Tôi muốn / cần đi đến nhà hàng."},
                    {"hanzi": "你要喝水吗？", "pinyin": "Nǐ yào hē shuǐ ma?", "vietnamese": "Bạn có muốn uống nước không?"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l11-ex1",
                "type": "multiple_choice",
                "question": "Câu nào sau đây là câu hỏi chính phản đúng ngữ pháp?",
                "options": ["A. 你去不去学校吗？", "B. 你去不去学校？", "C. 你去学校不？", "D. 你去吗不？"],
                "correctAnswer": "B. 你去不去学校？",
                "explanation": "Câu hỏi chính phản (去不去) không được dùng thêm trợ từ '吗' ở cuối câu."
            },
            {
                "id": "hsk1-l11-ex2",
                "type": "fill_blank",
                "question": "Điền từ thích hợp để biểu thị hành động đang tiếp diễn: 他___在睡觉呢。",
                "options": ["A. 正", "B. 了", "C. 过", "D. 都"],
                "correctAnswer": "A. 正",
                "explanation": "Cụm '正在...呢' biểu thị hành động đang diễn ra."
            }
        ]
    },
    12: {
        "titleHanzi": "昨天下雪了",
        "titlePinyin": "Zuótiān xiàxuě le",
        "titleVietnamese": "Hôm qua tuyết rơi rồi",
        "pageStart": 86,
        "objectives": [
            "能听懂并描述天气情况 (Nghe hiểu và miêu tả tình hình thời tiết).",
            "能听懂并简单描述病情 (Nghe hiểu và miêu tả đơn giản tình trạng bệnh tật, ốm đau).",
            "掌握语气助词“了（1）”的用法 (Nắm vững cách dùng trợ từ ngữ khí “了” (1) ở cuối câu).",
            "掌握“太……了”格式的用法 (Nắm vững cách dùng cấu trúc cảm thán “太……了”).",
            "了解生病时中国人建议“喝些热水”的好处 (Tìm hiểu thói quen và lời khuyên uống nước ấm của người Trung Quốc khi bị ốm)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l12-g1",
                "title": "1. 非主谓句 (Câu không chủ vị miêu tả hiện tượng tự nhiên)",
                "explanation": "Câu không chủ vị là câu do một cụm từ biểu thị mà không cần chủ ngữ, thường dùng khi nói về thời tiết, tự nhiên hoặc lời gọi, cảm thán.",
                "examples": [
                    {"hanzi": "下雨了。", "pinyin": "Xiàyǔ le.", "vietnamese": "Mưa rồi."},
                    {"hanzi": "昨天下雪了。", "pinyin": "Zuótiān xiàxuě le.", "vietnamese": "Hôm qua tuyết rơi rồi."}
                ]
            },
            {
                "id": "hsk1-l12-g2",
                "title": "2. 语气助词“了（1）” (Trợ từ ngữ khí “了” chỉ sự biến đổi trạng thái)",
                "explanation": "Trợ từ '了' đặt ở cuối câu biểu thị một tình huống, trạng thái mới xuất hiện hoặc có sự thay đổi so với trước đó.",
                "examples": [
                    {"hanzi": "天气冷了。", "pinyin": "Tiānqì lěng le.", "vietnamese": "Trời trở lạnh rồi (trước đây không lạnh)."},
                    {"hanzi": "我生病了。", "pinyin": "Wǒ shēngbìng le.", "vietnamese": "Tôi bị ốm rồi."}
                ]
            },
            {
                "id": "hsk1-l12-g3",
                "title": "3. “太……了”格式 (Cấu trúc cảm thán “太……了”)",
                "explanation": "Cấu trúc '太 + Tính từ / Tâm lý + 了' biểu thị mức độ cực kỳ cao, thường dùng để khen ngợi, cảm thán hoặc phàn nàn.",
                "examples": [
                    {"hanzi": "今天天气太好了！", "pinyin": "Jīntiān tiānqì tài hǎo le!", "vietnamese": "Hôm nay thời tiết đẹp quá!"},
                    {"hanzi": "外面太冷了！", "pinyin": "Wàimiàn tài lěng le!", "vietnamese": "Bên ngoài lạnh quá!"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l12-ex1",
                "type": "multiple_choice",
                "question": "Để cảm thán 'Trời lạnh quá!', câu nào chuẩn nhất?",
                "options": ["A. 天气很大冷。", "B. 天气太冷了！", "C. 天气太冷吗？", "D. 天气了太冷。"],
                "correctAnswer": "B. 天气太冷了！",
                "explanation": "Cấu trúc cảm thán chuẩn: '太 + Tính từ + 了' (太冷了)."
            },
            {
                "id": "hsk1-l12-ex2",
                "type": "fill_blank",
                "question": "Điền từ vào chỗ trống: 昨天___雪了。(Hôm qua có tuyết rơi rồi)",
                "options": ["A. 上", "B. 下", "C. 出", "D. 来"],
                "correctAnswer": "B. 下",
                "explanation": "Rơi tuyết, rơi mưa trong tiếng Trung dùng động từ '下' (下雪, 下雨)."
            }
        ]
    },
    13: {
        "titleHanzi": "请给我一杯茶",
        "titlePinyin": "Qǐng gěi wǒ yì bēi chá",
        "titleVietnamese": "Xin cho tôi một tách trà",
        "pageStart": 95,
        "objectives": [
            "能听懂并使用双宾语句（1）表示向别人提问或给予别人东西等 (Nghe hiểu và dùng câu hai tân ngữ để hỏi hoặc cho/đưa đồ).",
            "掌握能愿动词“可以”的用法 (Nắm vững cách dùng động từ năng nguyện “可以”).",
            "掌握“动词+一下”结构的用法 (Nắm vững cấu trúc “Động từ + 一下”).",
            "了解点餐常用语 (Hiểu và nắm được các mẫu câu gọi món ăn trong nhà hàng)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l13-g1",
                "title": "1. 能愿动词“可以” (Động từ năng nguyện “可以”)",
                "explanation": "'可以' (kěyǐ) biểu thị sự cho phép, đồng ý hoặc khả năng được làm điều gì đó một cách lịch sự.",
                "examples": [
                    {"hanzi": "我可以再问您一个问题吗？", "pinyin": "Wǒ kěyǐ zài wèn nín yí gè wèntí ma?", "vietnamese": "Em có thể hỏi cô thêm một câu hỏi nữa được không ạ?"},
                    {"hanzi": "你可以坐这儿。", "pinyin": "Nǐ kěyǐ zuò zhèr.", "vietnamese": "Bạn có thể ngồi ở đây."}
                ]
            },
            {
                "id": "hsk1-l13-g2",
                "title": "2. “动词+一下”结构 (Cấu trúc “Động từ + 一下”)",
                "explanation": "Đặt '一下' (yíxià) ngay sau động từ để biểu thị hành động diễn ra trong thời gian ngắn hoặc làm thử, giúp ngữ khí câu trở nên nhẹ nhàng, lịch sự.",
                "examples": [
                    {"hanzi": "请等一下。", "pinyin": "Qǐng děng yíxià.", "vietnamese": "Xin vui lòng chờ một lát."},
                    {"hanzi": "我想看一下。", "pinyin": "Wǒ xiǎng kàn yíxià.", "vietnamese": "Tôi muốn xem thử một chút."}
                ]
            },
            {
                "id": "hsk1-l13-g3",
                "title": "3. 双宾语句（1）(Câu mang hai tân ngữ)",
                "explanation": "Một số động từ như '给' (cho), '问' (hỏi), '送' (tặng) có thể mang cùng lúc hai tân ngữ: Tân ngữ gián tiếp (Người) đứng trước, Tân ngữ trực tiếp (Vật) đứng sau: 'Chủ ngữ + V + Người + Vật'.",
                "examples": [
                    {"hanzi": "请给我一杯茶。", "pinyin": "Qǐng gěi wǒ yì bēi chá.", "vietnamese": "Xin cho tôi một tách trà."},
                    {"hanzi": "王老师问我一个问题。", "pinyin": "Wáng lǎoshī wèn wǒ yí gè wèntí.", "vietnamese": "Cô Vương hỏi tôi một câu hỏi."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l13-ex1",
                "type": "sentence_scramble",
                "question": "Sắp xếp câu hai tân ngữ sau: 一杯茶 / 请 / 我 / 给",
                "scrambleSegments": ["请", "给我", "一杯茶"],
                "options": ["请给我一杯茶", "请一杯茶给我", "给我请一杯茶"],
                "correctAnswer": "请给我一杯茶",
                "explanation": "Cấu trúc hai tân ngữ: Động từ (给) + Tân ngữ người (我) + Tân ngữ vật (一杯茶)."
            },
            {
                "id": "hsk1-l13-ex2",
                "type": "multiple_choice",
                "question": "Để xin phép ai đó xem thử đồ vật một cách lịch sự, bạn nói:",
                "options": ["A. 我看一下。", "B. 我看了一点儿。", "C. 我看太好了。", "D. 我看不到。"],
                "correctAnswer": "A. 我看一下。",
                "explanation": "Cấu trúc 'Động từ + 一下' biểu thị làm thử động tác trong thời gian ngắn: 看一下 (xem một chút)."
            }
        ]
    },
    14: {
        "titleHanzi": "我看了一个电影",
        "titlePinyin": "Wǒ kànle yí gè diànyǐng",
        "titleVietnamese": "Tôi đã xem một bộ phim",
        "pageStart": 103,
        "objectives": [
            "能听懂并使用动态助词“了（2）”表示动作行为已经发生或完成 (Nghe hiểu và dùng trợ từ động thái “了” (2) sau động từ biểu thị hành động đã hoàn thành).",
            "掌握范围副词“都”的用法 (Nắm vững cách dùng phó từ phạm vi “都”).",
            "掌握部分离合词的基本用法 (Nắm vững cách dùng cơ bản của một số từ ly hợp).",
            "了解并能描述学习情况 (Hiểu và có thể miêu tả tình hình học tập)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l14-g1",
                "title": "1. 动态助词“了（2）” (Trợ từ động thái “了” biểu thị hành động hoàn thành)",
                "explanation": "Trợ từ '了' đặt ngay sau động từ để biểu thị hành động đã hoàn thành hoặc đã thực hiện. Khi tân ngữ có số lượng từ hoặc định ngữ bổ nghĩa, cấu trúc chuẩn là: 'Chủ ngữ + Động từ + 了 + Số lượng + Tân ngữ'. Phủ định dùng '没 + Động từ', tuyệt đối bỏ '了'.",
                "examples": [
                    {"hanzi": "我看了一个电影。", "pinyin": "Wǒ kànle yí gè diànyǐng.", "vietnamese": "Tôi đã xem một bộ phim."},
                    {"hanzi": "我买了一本汉字书。", "pinyin": "Wǒ mǎile yì běn hànzì shū.", "vietnamese": "Tôi đã mua một cuốn sách chữ Hán."},
                    {"hanzi": "我没看电影。", "pinyin": "Wǒ méi kàn diànyǐng.", "vietnamese": "Tôi chưa xem phim (phủ định bỏ 了)."}
                ]
            },
            {
                "id": "hsk1-l14-g2",
                "title": "2. 离合词（1）(Khái niệm và cách dùng từ ly hợp)",
                "explanation": "Từ ly hợp là những từ gồm 2 âm tiết có kết cấu Động từ + Tân ngữ (như 上学, 睡觉, 说话, 唱歌, 上班). Khi cần thêm trợ từ '了' hoặc số lượng từ, ta chen chúng vào giữa hai âm tiết: '上 + 了 + 学', '睡 + 了一个好 + 觉'.",
                "examples": [
                    {"hanzi": "他们上学了。", "pinyin": "Tāmen shàngxué le.", "vietnamese": "Họ đã đi học rồi."},
                    {"hanzi": "上火车后看见王老师了吗？", "pinyin": "Shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?", "vietnamese": "Sau khi lên tàu bạn có nhìn thấy cô Vương không?"}
                ]
            },
            {
                "id": "hsk1-l14-g3",
                "title": "3. 范围副词“都” (Phó từ phạm vi “都”)",
                "explanation": "'都' (dōu) là phó từ biểu thị toàn bộ mọi thành viên hoặc sự vật trong phạm vi được nói đến đều có chung tính chất, hành động. '都' luôn đứng TRƯỚC vị ngữ động từ hoặc tính từ.",
                "examples": [
                    {"hanzi": "我们都是中学生。", "pinyin": "Wǒmen dōu shì zhōngxuéshēng.", "vietnamese": "Tất cả chúng tôi đều là học sinh trung học."},
                    {"hanzi": "那些汉字我都认识。", "pinyin": "Nàxiē hànzì wǒ dōu rènshi.", "vietnamese": "Những chữ Hán kia tôi đều nhận biết được."}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l14-ex1",
                "type": "fill_blank",
                "question": "Điền trợ từ thích hợp vào câu diễn đạt hành động đã làm: 我看___一个电影。",
                "options": ["A. 的", "B. 了", "C. 呢", "D. 吧"],
                "correctAnswer": "B. 了",
                "explanation": "Trợ từ động thái '了' đứng sau động từ (看了) biểu thị hành động xem đã diễn ra."
            },
            {
                "id": "hsk1-l14-ex2",
                "type": "sentence_scramble",
                "question": "Sắp xếp câu dùng phó từ phạm vi '都': 都是 / 我们 / 中学生",
                "scrambleSegments": ["我们", "都是", "中学生"],
                "options": ["我们都是中学生", "都是我们中学生", "中学生我们都是"],
                "correctAnswer": "Chúng tôi đều là học sinh trung học",
                "explanation": "Phó từ '都' đứng trước vị ngữ: 我们 (Chủ ngữ) + 都是 (Phó từ + Động từ) + 中学生 (Tân ngữ)."
            }
        ]
    },
    15: {
        "titleHanzi": "大兴机场见！",
        "titlePinyin": "Dàxīng Jīchǎng jiàn!",
        "titleVietnamese": "Hẹn gặp ở sân bay Đại Hưng!",
        "pageStart": 112,
        "objectives": [
            "能听懂并使用相关词语表达旅行意愿、计划 (Nghe hiểu và sử dụng từ ngữ biểu đạt nguyện vọng, kế hoạch đi du lịch).",
            "掌握并列复句“……，还/也……” (Nắm vững câu phức đẳng lập “..., 还/也...”).",
            "了解中国餐桌文化、待客礼仪 (Tìm hiểu văn hóa bàn ăn và nghi thức tiếp đãi khách của người Trung Quốc).",
            "了解中国的首都——北京 (Tìm hiểu về thủ đô Bắc Kinh của Trung Quốc)."
        ],
        "grammarPoints": [
            {
                "id": "hsk1-l15-g1",
                "title": "1. 并列复句“……，还/也……” (Câu phức đẳng lập “..., 还/也...”)",
                "explanation": "Câu phức đẳng lập nối hai phân câu có mối quan hệ song song, bổ sung thông tin cho nhau. '还' (hái) nhấn mạnh sự tăng tiến bổ sung (ngoài ra còn), '也' (yě) nhấn mạnh tính tương đồng (cũng).",
                "examples": [
                    {"hanzi": "我想去北京，还想去西安。", "pinyin": "Wǒ xiǎng qù Běijīng, hái xiǎng qù Xī'ān.", "vietnamese": "Tôi muốn đi Bắc Kinh, còn muốn đi cả Tây An nữa."},
                    {"hanzi": "他喜欢吃饺子，也喜欢吃米饭。", "pinyin": "Tā xǐhuan chī jiǎozi, yě xǐhuan chī mǐfàn.", "vietnamese": "Anh ấy thích ăn sủi cảo, cũng thích ăn cả cơm nữa."}
                ]
            },
            {
                "id": "hsk1-l15-g2",
                "title": "2. Cấu trúc hẹn gặp: Địa điểm / Thời gian + 见",
                "explanation": "Trong tiếng Trung, để hẹn gặp ai ở một địa điểm hoặc vào một thời gian nào đó, ta đặt từ chỉ địa điểm/thời gian trước động từ '见' (jiàn).",
                "examples": [
                    {"hanzi": "大兴机场见！", "pinyin": "Dàxīng Jīchǎng jiàn!", "vietnamese": "Hẹn gặp ở sân bay Đại Hưng nhé!"},
                    {"hanzi": "明天见！", "pinyin": "Míngtiān jiàn!", "vietnamese": "Hẹn ngày mai gặp lại!"},
                    {"hanzi": "学校见！", "pinyin": "Xuéxiào jiàn!", "vietnamese": "Hẹn gặp ở trường nhé!"}
                ]
            }
        ],
        "exercises": [
            {
                "id": "hsk1-l15-ex1",
                "type": "multiple_choice",
                "question": "Để nói 'Hẹn gặp ở sân bay Đại Hưng!', câu nào chuẩn nhất?",
                "options": ["A. 见大兴机场！", "B. 大兴机场见！", "C. 去大兴机场！", "D. 大兴机场到了！"],
                "correctAnswer": "B. 大兴机场见！",
                "explanation": "Cấu trúc hẹn gặp: Địa điểm + 见 (Dàxīng Jīchǎng jiàn)."
            },
            {
                "id": "hsk1-l15-ex2",
                "type": "fill_blank",
                "question": "Điền liên từ bổ sung thích hợp: 我想去北京，___想去西安。",
                "options": ["A. 还", "B. 吗", "C. 了", "D. 呢"],
                "correctAnswer": "A. 还",
                "explanation": "Câu phức đẳng lập bổ sung: '..., 还想...' (ngoài ra còn muốn...)."
            }
        ]
    }
}
