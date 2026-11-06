"""
Minnese Master Standard Art Generation Script
Standardizes illustrations for HSK 1 and HSK 2 textbooks with strict:
1. Character Design Consistency (Master Character Bible)
2. Accurate Conversational Context & Dialogue-matching Props
3. Authentic BLCUP Watercolor & Ink Wash Style (16:9 widescreen, zero text)
"""

import os
import sys
import json
import urllib.request
import urllib.error

# Ensure stdout handles utf-8 cleanly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Master Art Specifications for HSK 1 & HSK 2
ART_SPECS = {
    # ==========================================
    # HSK 1 - LESSON 9 (你儿子在哪儿工作)
    # ==========================================
    "hsk1-l9-t1": {
        "title": "HSK 1 Lesson 9 Text 1: Sân trường nhìn ra rạp chiếu phim đối diện",
        "output_path": "public/textbook_art/cartoon_hsk1_l9_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Outdoors on a sunlit university campus. A young male student (Li Wen: neat short black hair, "
            "wearing a sporty blue jacket) and a young female student (Bai Jiayue: dark hair in a neat ponytail, "
            "wearing a light blue cardigan) stand along a brick campus path lined with leafy trees. "
            "Li Wen points cheerfully towards the distance outside the school gate, where a modern movie cinema "
            "building is visible down the road. Bai Jiayue smiles and nods in agreement. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l9-t2": {
        "title": "HSK 1 Lesson 9 Text 2: Trả lại sách tiếng Trung trên ghế lớp học",
        "output_path": "public/textbook_art/cartoon_hsk1_l9_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a bright university classroom after class. "
            "Characters: Chen Tianzhong (friendly Thai international student: short black hair, casual orange and "
            "grey jacket) stands beside a wooden chair, holding up a blank red textbook he found on the chair, "
            "smiling and handing it to Bai Jiayue (dark ponytail, light blue sweater). "
            "Bai Jiayue places her hands together gratefully with a joyful smile. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l9-t3": {
        "title": "HSK 1 Lesson 9 Text 3: Nghỉ giải lao công ty trò chuyện về cuối tuần",
        "output_path": "public/textbook_art/cartoon_hsk1_l9_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a modern, bright office lounge with floor-to-ceiling windows looking out over sunny Beijing. "
            "Characters: Wang Yixue (mid-30s, long straight black hair, elegant soft cream knit sweater) and her colleague "
            "Yang Tongle (young man mid-20s, smart casual business attire) hold coffee mugs and chat cheerfully during a break. "
            "On the table is a small tablet or phone showing a cute cartoon puppy avatar. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },

    # ==========================================
    # HSK 1 - LESSON 11 (现在几点)
    # ==========================================
    "hsk1-l11-t1": {
        "title": "HSK 1 Lesson 11 Text 1: Lý Văn ngồi trên xe buýt tìm nhà hàng",
        "output_path": "public/textbook_art/cartoon_hsk1_l11_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a clean, bright city transit bus. "
            "Character: A young male university student (Li Wen: neat short black hair, sporty blue jacket) sits beside "
            "a large bus window, holding a smartphone to his ear, looking attentively outside at the city street. "
            "Outside the window, a large modern supermarket building and bustling pedestrian sidewalks are visible. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l11-t2": {
        "title": "HSK 1 Lesson 11 Text 2: Gặp cô giáo Vương ở nhà hàng ấm cúng",
        "output_path": "public/textbook_art/cartoon_hsk1_l11_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a warm, elegant Chinese restaurant. "
            "Characters: Teacher Wang Yifei (30-year-old female teacher: neat short black bob hair, stylish glasses, "
            "modest pastel blazer) sits across a wooden dining table from student Li Wen (sporty blue jacket). "
            "On the table rests a steaming porcelain teapot and two teacups. They chat warmly and amicably. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l11-t3": {
        "title": "HSK 1 Lesson 11 Text 3: Bác sĩ Lưu Minh đi làm thêm, dặn con gái",
        "output_path": "public/textbook_art/cartoon_hsk1_l11_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: In the bright entryway hallway of a warm family home on a Saturday morning. "
            "Characters: Father Dr. Liu Ming (mid-30s Chinese man, neat short black hair, glasses, wearing a smart collared "
            "shirt and jacket, carrying a medical briefcase, checking his wristwatch) turns with a warm smile to speak to his "
            "teenage daughter Liu Xiaoxue (14 years old, black hair in neat pigtails, wearing comfortable pink home clothes). "
            "In the background, a cozy living room with soft morning sunlight. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },

    # ==========================================
    # HSK 1 - LESSON 12 (明天天气怎么样)
    # ==========================================
    "hsk1-l12-t1": {
        "title": "HSK 1 Lesson 12 Text 1: Cửa sổ trời mưa rào rả rích (KHÔNG TUYẾT)",
        "output_path": "public/textbook_art/cartoon_hsk1_l12_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: A cozy, warm room on a chilly RAINY day (ABSOLUTELY NO SNOW). "
            "Character: Teacher Wang Yifei (30-year-old female Chinese teacher: neat short black bob hair, glasses, "
            "wearing a cozy soft knit cardigan) stands near a large glass window, holding a phone to her ear. "
            "Through the window, gentle steady RAIN is clearly falling with visible water droplets and streaks on the glass, "
            "overcast grey-blue sky, and wet green tree leaves outside. "
            "On a small side table is a steaming mug of hot tea. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },

    # ==========================================
    # HSK 1 - LESSON 13 (他在学做中国菜呢)
    # ==========================================
    "hsk1-l13-t1": {
        "title": "HSK 1 Lesson 13 Text 1: Bạch Gia Nguyệt hỏi cô giáo tiệm bán điện thoại",
        "output_path": "public/textbook_art/cartoon_hsk1_l13_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a quiet university classroom after lecture hours. "
            "Characters: Student Bai Jiayue (dark ponytail, light blue sweater, holding a textbook) stands respectfully "
            "beside the teacher's wooden desk, asking a question with a friendly smile. "
            "Teacher Wang Yifei (neat short black bob hair, glasses, pastel blazer) sits at the desk reviewing papers, "
            "looking up and gesturing gently with a welcoming smile to guide her. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l13-t2": {
        "title": "HSK 1 Lesson 13 Text 2: Vương Nhất Tuyết gọi bữa sáng (sữa, bánh mì, trứng)",
        "output_path": "public/textbook_art/cartoon_hsk1_l13_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a bright, sunny morning bakery cafe. "
            "Characters: Wang Yixue (mid-30s, long straight black hair, cream knit sweater) sits at a round wooden cafe table. "
            "A polite cafe server places a breakfast tray on her table: a tall glass of fresh white milk, a warm golden bread roll, "
            "and a boiled egg on a small dish. Morning sunlight streams through the window. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l13-t3": {
        "title": "HSK 1 Lesson 13 Text 3: Bác sĩ Lưu Minh gọi đĩa sủi cảo nóng hổi",
        "output_path": "public/textbook_art/cartoon_hsk1_l13_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a traditional, cozy Beijing dumpling eatery restaurant. "
            "Characters: Dr. Liu Ming (mid-30s Chinese man, neat short black hair, glasses, collared light blue polo shirt) "
            "sits at a wooden dining table. A smiling restaurant server in an apron places a steaming bamboo steamer or plate "
            "of fresh, plump Chinese dumplings (jiaozi) on the table, with chopsticks and a small dipping dish. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },

    # ==========================================
    # HSK 1 - LESSON 14 (她买了不少衣服)
    # ==========================================
    "hsk1-l14-t1": {
        "title": "HSK 1 Lesson 14 Text 1: Kể về chuyến tàu hỏa dã ngoại",
        "output_path": "public/textbook_art/cartoon_hsk1_l14_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a university classroom after class. "
            "Characters: Chen Tianzhong (sporty orange and grey jacket, short black hair) and Bai Jiayue (ponytail, light blue sweater) "
            "sit side-by-side at wooden desks. Chen Tianzhong cheerfully shows his smartphone screen, laughing as he recounts "
            "watching a fun movie during their recent school train excursion, while Bai Jiayue listens with an amused, bright smile. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l14-t2": {
        "title": "HSK 1 Lesson 14 Text 2: Cô giáo kiểm tra viết chữ Hán trong lớp",
        "output_path": "public/textbook_art/cartoon_hsk1_l14_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside an active, cheerful Chinese language classroom. "
            "Characters: Teacher Wang Yifei (short black bob hair, glasses, pastel blazer) stands by a clean chalkboard, smiling encouragingly. "
            "At the front desk, student Chen Tianzhong proudly holds up his open practice notebook to show the teacher, "
            "while Bai Jiayue sits beside him smiling and clapping softly. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere (the notebook pages should have abstract calligraphy stroke patterns). 16:9 widescreen."
        )
    },
    "hsk1-l14-t3": {
        "title": "HSK 1 Lesson 14 Text 3: Bố mẹ trò chuyện tự hào về các con đi học",
        "output_path": "public/textbook_art/cartoon_hsk1_l14_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a cozy family living room at night. "
            "Characters: Dr. Liu Ming (glasses, light blue polo) and his wife Wang Yixue (long black hair, cream sweater) "
            "sit together on a comfortable sofa, chatting with warm, proud smiles. "
            "On the wall behind them are framed photos of their two children (daughter Liu Xiaoxue and son Liu Xiaoming with school backpacks). "
            "A warm floor lamp casts a gentle evening glow over the room. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },

    # ==========================================
    # HSK 1 - LESSON 15 (我是坐飞机来的)
    # ==========================================
    "hsk1-l15-t1": {
        "title": "HSK 1 Lesson 15 Text 1: Bữa tiệc món ăn Trung Quốc tại nhà Lý Văn",
        "output_path": "public/textbook_art/cartoon_hsk1_l15_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside Li Wen's welcoming dining room. "
            "Characters: Host Li Wen (short black hair, wearing a striped kitchen apron over his casual clothes) "
            "stands smiling proudly, offering a dish of delicious home-cooked Chinese food to his guests. "
            "Sitting at the dining table are international friends Bai Jiayue (dark ponytail) and Chen Tianzhong (orange jacket), "
            "both smiling with delight as they admire the colorful banquet spread (sweet-and-sour fish, stir-fried vegetables, dumplings). "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l15-t2": {
        "title": "HSK 1 Lesson 15 Text 2: Mọi người vừa ăn vừa hào hứng bàn kế hoạch đi chơi",
        "output_path": "public/textbook_art/cartoon_hsk1_l15_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: A joyful gathering around the dining table at Li Wen's home. "
            "Characters: Li Wen, Annie (wavy golden-brown hair, pink top), and Bai Jiayue (dark ponytail, light blue sweater) "
            "cheerfully raise glasses of fruit juice in a friendly toast, laughing and discussing exciting holiday travel plans. "
            "Warm ambient room lighting and delicious food on the table create a heartwarming celebratory mood. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk1-l15-t3": {
        "title": "HSK 1 Lesson 15 Text 3: Hẹn gặp chị gái cô giáo ở sân bay Đại Hưng",
        "output_path": "public/textbook_art/cartoon_hsk1_l15_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: In a bright, sunlit university hallway outside the classroom by tall windows. "
            "Characters: Teacher Wang Yifei (neat short black bob hair, glasses, pastel blazer) smiles warmly as she speaks to "
            "two eager female students—Annie (wavy golden-brown hair, pink top) and Bai Jiayue (dark ponytail, light blue sweater). "
            "The two students bow slightly and beam with gratitude, excited to meet the teacher's sister at Daxing Airport. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },

    # ==========================================
    # HSK 2 - REMAINING CRITICAL FIXES
    # ==========================================
    "hsk2-l10-t1": {
        "title": "HSK 2 Lesson 10 Text 1: Bố Lưu Minh giúp con trai Tiểu Minh xếp cặp",
        "output_path": "public/textbook_art/cartoon_hsk2_l10_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: In a cheerful boy's bedroom. A loving father helps his young son pack for school. "
            "Characters: "
            "Father Dr. Liu Ming (mid-30s Chinese man, neat short black hair, glasses, wearing a light blue polo shirt and wristwatch) "
            "smiles warmly as he points towards a school backpack by the bedroom door and notebooks on the desk. "
            "Son Liu Xiaoming (8 years old, cute short black hair, wearing a striped casual t-shirt) excitedly picks up his backpack "
            "and pencil case, grinning happily before the first day of school. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l10-t4": {
        "title": "HSK 2 Lesson 10 Text 4: Con gái Lưu Tiểu Tuyết viết nhật ký về gia đình",
        "output_path": "public/textbook_art/cartoon_hsk2_l10_t4.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a cozy teenage girl's bedroom at night. "
            "Character: Daughter Liu Xiaoxue (14-year-old Chinese girl with dark hair in neat twin pigtails, "
            "wearing a modest soft pink home cardigan). She sits at a wooden study desk under the warm glow of a desk lamp, "
            "holding a pen and writing happily in an open blank diary journal. "
            "On her desk is a pencil holder, a cup of water, and a small framed photo of her family (parents, brother, and herself). "
            "Outside the window, a peaceful night sky with a gentle crescent moon. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l13-t4": {
        "title": "HSK 2 Lesson 13 Text 4: Bạch Gia Nguyệt viết nhật ký trong sổ gấu trúc",
        "output_path": "public/textbook_art/cartoon_hsk2_l13_t4.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a peaceful, warm student room at evening. "
            "Character: Bai Jiayue (dark ponytail, comfortable soft lavender home loungewear) sits contentedly at a wooden desk "
            "under a warm brass desk lamp. She writes in a charming open notebook with a cute panda face on the cover. "
            "Beside her on the desk is a lovely vase with fresh colorful flowers and a warm mug of tea. "
            "Her face is full of gratitude and peace as she writes her diary before New Year. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l14-t1": {
        "title": "HSK 2 Lesson 14 Text 1: Lý Văn và cô giáo Vương đi dạo về nhà",
        "output_path": "public/textbook_art/cartoon_hsk2_l14_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: A quiet Beijing residential sidewalk lined with winter trees during late afternoon. "
            "Characters: In the foreground, student Li Wen (sporty blue jacket, neat black hair) and Teacher Wang Yifei (short bob hair, thin glasses, "
            "warm beige winter coat and scarf) walk side-by-side. Li Wen points ahead toward an apartment building entrance where a tall man in dark clothing waits. Teacher Wang smiles happily recognizing her boyfriend. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l14-t2": {
        "title": "HSK 2 Lesson 14 Text 2: Gặp bạn trai Dương Đồng Nhạc dưới sảnh tòa nhà",
        "output_path": "public/textbook_art/cartoon_hsk2_l14_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Outside the bright glass lobby entrance of a modern Beijing apartment building. "
            "Characters: Teacher Wang Yifei (glasses, warm winter coat) introduces her boyfriend Yang Tongle "
            "(handsome young man in his late 20s, stylish warm dark green winter jacket, warm bright smile) to student Li Wen. "
            "All three smile warmly and greet each other politely. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l14-t3": {
        "title": "HSK 2 Lesson 14 Text 3: Cô giáo Vương và bạn trai đón Tết ở phòng khách",
        "output_path": "public/textbook_art/cartoon_hsk2_l14_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside Teacher Wang Yifei's warm, festively decorated apartment living room. "
            "Characters: Teacher Wang Yifei (short hair, glasses, cozy soft red sweater) and boyfriend Yang Tongle "
            "(warm green sweater) sit together by a coffee table with tea and Chinese New Year tangerine fruits. "
            "They chat happily and comfortably, enjoying the warm companionship of celebrating the holiday together. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l14-t4": {
        "title": "HSK 2 Lesson 14 Text 4: Cô giáo Vương viết nhật ký đêm giao thừa",
        "output_path": "public/textbook_art/cartoon_hsk2_l14_t4.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside Teacher Wang Yifei's cozy study room at night. "
            "Character: Teacher Wang Yifei (short bob hair, glasses, cozy soft sweater) sits at her desk under a gentle lamp, "
            "writing in her diary with a joyful, touched smile. On the table is a warm cup of tea and a small red New Year decoration. "
            "Outside the window, subtle festive lanterns glow warmly in the distance. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l15-t1": {
        "title": "HSK 2 Lesson 15 Text 1: Thi học kỳ xong trong lớp học",
        "output_path": "public/textbook_art/cartoon_hsk2_l15_t1.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a bright university examination classroom as the final test ends. "
            "Characters: Teacher Wang Yifei (glasses, blazer) collects test papers at the front desk with a proud, congratulatory smile. "
            "In the classroom, international students Bai Jiayue (dark ponytail), Li Wen (blue jacket), and Chen Tianzhong (orange jacket) "
            "pack their pens, smiling with massive relief and excitement at completing their Chinese course. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l15-t2": {
        "title": "HSK 2 Lesson 15 Text 2: Quán cà phê lên kế hoạch đi Bắc Kinh",
        "output_path": "public/textbook_art/cartoon_hsk2_l15_t2.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside a cozy sunlit cafe by large windows. "
            "Characters: Bai Jiayue (dark ponytail, light blue sweater) and Li Wen (sporty blue jacket) sit together at a cafe table "
            "with two warm drinks. Li Wen holds a travel guidebook or map open, pointing excitedly and describing the scenic beauty "
            "of Beijing, while Bai Jiayue listens with shining eyes of anticipation. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l15-t3": {
        "title": "HSK 2 Lesson 15 Text 3: Quán cà phê cùng đặt vé máy bay",
        "output_path": "public/textbook_art/cartoon_hsk2_l15_t3.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside the cafe, continuing their travel planning. "
            "Characters: Bai Jiayue and Li Wen lean over a tablet or laptop placed on the cafe table, happily checking flight "
            "tickets to Beijing together, beaming with excitement at the thought of flying home for the holidays. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    },
    "hsk2-l15-t4": {
        "title": "HSK 2 Lesson 15 Text 4: Lý Văn viết nhật ký hào hứng về Bắc Kinh",
        "output_path": "public/textbook_art/cartoon_hsk2_l15_t4.jpg",
        "prompt": (
            "Chinese language educational textbook watercolor cartoon illustration style. "
            "Scene: Inside Li Wen's student bedroom at night. "
            "Character: Student Li Wen (short black hair, casual comfortable clothing) sits at his wooden study desk under a warm lamp, "
            "writing joyfully in his journal. On his desk is a packed travel backpack, an airplane miniature model or ticket holder, "
            "and a warm cup of tea. He looks thrilled and touched, ready to embark on the journey to Beijing with his good friend. "
            "Style: Authentic BLCUP Chinese language textbook cartoon illustration, soft watercolor and ink wash, "
            "warm pastel tones, clean delicate line art. "
            "STRICT RULE: Absolutely NO text, NO Chinese characters (hanzi), NO English letters, NO numbers, "
            "NO speech bubbles, NO watermarks anywhere. 16:9 widescreen."
        )
    }
}

def print_specs():
    print(f"Tổng số bài cần chuẩn hóa trong Master Catalog: {len(ART_SPECS)} bài")
    for k, v in ART_SPECS.items():
        print(f"  [{k}] -> {v['title']} ({v['output_path']})")

import base64
import time

MODEL = os.environ.get("IMAGE_MODEL", "gemini-3.1-flash-image")


def _call_image_api(key, prompt):
    """Call Gemini image model; returns raw image bytes or raises HTTPError."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9"},
        },
    }
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise RuntimeError("No image returned")


def generate(only=None, overwrite=True):
    """Generate images using keys from env GEMINI_IMAGE_KEYS (comma-separated).
    Keys are rotated when one hits a 429 quota error. Keys are never stored on disk."""
    keys = [k.strip() for k in os.environ.get("GEMINI_IMAGE_KEYS", "").split(",") if k.strip()]
    if not keys:
        print("Set GEMINI_IMAGE_KEYS (comma-separated API keys) first.")
        return
    active = list(keys)
    for sid, spec in ART_SPECS.items():
        if only and sid not in only:
            continue
        if not overwrite and os.path.exists(spec["output_path"]):
            continue
        done = False
        while active and not done:
            key = active[0]
            try:
                img = _call_image_api(key, spec["prompt"])
                os.makedirs(os.path.dirname(spec["output_path"]), exist_ok=True)
                with open(spec["output_path"], "wb") as f:
                    f.write(img)
                print(f"OK   {sid} -> {spec['output_path']}")
                done = True
                time.sleep(2)
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", "ignore")[:200]
                if e.code == 429:
                    print(f"429 on key ...{key[-4:]} (quota). Rotating.")
                    active.pop(0)
                else:
                    print(f"FAIL {sid}: HTTP {e.code} {body}")
                    break
            except Exception as e:
                print(f"FAIL {sid}: {e}")
                break
        if not active:
            print("All keys exhausted (quota / free tier limit). Stopping.")
            return


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        generate(only=set(sys.argv[2:]) or None)
    else:
        print_specs()
