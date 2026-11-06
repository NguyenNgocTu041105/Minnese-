import { RAGDocument } from '../types';

export const INITIAL_RAG_DOCUMENTS: RAGDocument[] = [
  // 1. TONE SANDHI & PHONETICS
  {
    id: 'rag-tones-sandhi',
    title: 'Quy tắc Biến điệu Thanh điệu (Tone Sandhi: Thanh 3, 不, 一)',
    category: 'tones',
    tags: ['pinyin', 'pronunciation', 'tone sandhi', 'thanh 3', 'bu', 'yi', 'hsk1', 'hsk2', 'hsk3'],
    rulesSummary: 'Quy tắc biến điệu bắt buộc trong tiếng Trung: Hai thanh 3 đi liền nhau (3+3 -> 2+3); Biến điệu của 不 (bù -> bú trước thanh 4); Biến điệu của 一 (yī -> yí trước thanh 4, yī -> yì trước thanh 1,2,3).',
    content: `Quy tắc biến điệu thanh điệu chuẩn Phổ thông thoại (Putonghua):
1. Hai âm tiết thanh 3 đi liền nhau (3 + 3 -> 2 + 3):
- Âm tiết thanh 3 thứ nhất đọc thành thanh 2 (dấu sắc).
- Ví dụ: 你好 (nǐ + hǎo -> ní hǎo), 手表 (shǒu + biǎo -> shóubiǎo), 语法 (yǔ + fǎ -> yúfǎ).
2. Nửa thanh 3 (Half 3rd Tone):
- Khi thanh 3 đứng trước thanh 1, thanh 2, thanh 4 hoặc thanh nhẹ, ta chỉ đọc nửa đầu của thanh 3 (trầm xuống mà không lượn lên).
3. Biến điệu của chữ "不" (bù):
- Nguyên gốc mang thanh 4 (bù).
- Trước âm tiết mang THANH 4: "不" đổi thành thanh 2 (bú). Ví dụ: 不是 (bú shì), 不要 (bú yào), 对不起 (duìbuqǐ).
- Trước thanh 1, 2, 3: Giữ nguyên thanh 4 (bù). Ví dụ: 不吃 (bù chī), 不来 (bù lái), 不好 (bù hǎo).
4. Biến điệu của chữ "一" (yī):
- Đọc số đếm, số phòng, năm tháng đứng một mình: Đọc thanh 1 (yī). Ví dụ: 第一 (dì-yī), 一二三 (yī èr sān).
- Trước âm tiết THANH 4: "一" đổi thành thanh 2 (yí). Ví dụ: 一个 (yí gè), 一定 (yí dìng), 一样 (yí yàng).
- Trước âm tiết THANH 1, 2, 3: "一" đổi thành thanh 4 (yì). Ví dụ: 一天 (yì tiān), 一起 (yì qǐ), 一年 (yì nián).`,
    examples: [
      { chinese: '你好 (nǐ + hǎo)', pinyin: 'ní hǎo', english: 'Hello (3+3 -> 2+3)' },
      { chinese: '不是 (bù + shì)', pinyin: 'bú shì', english: 'Is not (4+4 -> 2+4)' },
      { chinese: '一个 (yī + gè)', pinyin: 'yí gè', english: 'One piece (1+4 -> 2+4)' },
      { chinese: '一起 (yī + qǐ)', pinyin: 'yì qǐ', english: 'Together (1+3 -> 4+3)' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 2. THE THREE "DE" PARTICLES (的, 得, 地)
  {
    id: 'rag-grammar-de-particles',
    title: 'Phân biệt 3 Trợ từ Kết cấu Trọng tâm: 的, 得, 地 (HSK 2 - HSK 3.0)',
    category: 'grammar',
    tags: ['de', 'tro tu', 'ngu phap', 'de de de', 'hsk2', 'hsk3', 'cau truc'],
    rulesSummary: '的 (định ngữ bổ nghĩa danh từ), 地 (trạng ngữ bổ nghĩa động từ/phó từ hóa tính từ), 得 (nối động từ/tính từ với bổ ngữ trạng thái/trình độ/kết quả).',
    content: `Cách dùng chính xác 3 chữ 'de' trong tiếng Trung:
1. 的 (Bạch thược Đích - Nối Định ngữ với Danh từ):
- Cấu trúc: [Tính từ / Đại từ / Cụm S-V / Phân câu] + 的 + [Danh từ]
- Biểu thị sở hữu, tính chất, đặc điểm hoặc mệnh đề quan hệ.
- Ví dụ: 我的书 (Sách của tôi), 红色的裙子 (Váy màu đỏ), 昨天买的衣服 (Quần áo mua hôm qua).
2. 地 (Thổ dã Địa - Nối Trạng ngữ miêu tả cách thức với Động từ):
- Cấu trúc: [Tính từ / Cụm miêu tả cách thức] + 地 + [Động từ]
- Biến tính từ thành phó từ chỉ cách thức hành động diễn ra (tương đương hậu tố -ly trong tiếng Anh).
- Ví dụ: 慢慢地走 (Đi từ từ), 认真地学习 (Học tập chăm chỉ), 高高兴兴地玩 (Chơi đùa vui vẻ).
3. 得 (Song nhân Đắc - Nối Động từ/Tính từ với Bổ ngữ chỉ Mức độ, Trạng thái):
- Cấu trúc: [Động từ / Tính từ] + 得 + [Bổ ngữ trạng thái / Mức độ / Khả năng]
- Đánh giá hành động thực hiện ra sao hoặc mức độ đạt đến thế nào.
- Ví dụ: 跑得很快 (Chạy rất nhanh), 睡得好 (Ngủ ngon), 累得不行 (Mệt không chịu nổi).
Mẹo nhớ nhanh: Sau là Danh từ dùng 的; Sau là Động từ dùng 地; Trước là Động từ đánh giá dùng 得!`,
    examples: [
      { chinese: '她穿了一件漂亮的短裙。', pinyin: 'Tā chuān le yí jiàn piàoliang de duǎnqún.', english: 'Cô ấy mặc một chiếc chân váy ngắn rất đẹp (Trước Danh từ: 的).' },
      { chinese: '他高兴地跳了起来。', pinyin: 'Tā gāoxìng de tiào le qǐlái.', english: 'Anh ấy vui mừng nhảy cẫng lên (Trước Động từ: 地).' },
      { chinese: '她的中文说得非常流利。', pinyin: 'Tā de Zhōngwén shuō de fēicháng liúlì.', english: 'Tiếng Trung của cô ấy nói rất lưu loát (Sau Động từ: 得).' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 3. CÂU CHỮ BẢ (把字句) - HSK 3 (HSK 3.0)
  {
    id: 'rag-grammar-ba-structure',
    title: 'Toàn tập Câu chữ 把 (把字句 - 4 Loại hình HSK 3 chuẩn 3.0)',
    category: 'grammar',
    tags: ['ba sentence', 'cau chu ba', 'ba', 'hsk3', 'ngu phap hsk3'],
    rulesSummary: 'Chủ ngữ + 把 + Tân ngữ xác định + Động từ + Thành phần khác (Bổ ngữ kết quả / Xu hướng / 给 / 了 / Nơi chốn). Dùng khi động tác tác động làm thay đổi vị trí, trạng thái hoặc quan hệ của sự vật.',
    content: `Câu chữ 把 (Disposal Construction) là điểm ngữ pháp quan trọng nhất trong HSK 3 (HSK 3.0):
Cấu trúc cơ bản: Chủ ngữ + (Phó từ phủ định 不/没 + Động từ năng nguyện 想/要/能) + 把 + Tân ngữ (Xác định) + Động từ + Thành phần khác.

4 Loại hình Câu chữ 把 chuẩn HSK 3.0:
1. Biến đổi vị trí của vật (Chuyển dịch nơi chốn):
   - Cấu trúc: 把 + Tân ngữ + Động từ + 在 / 到 + Nơi chốn.
   - Ví dụ: 老师把作业本放到桌子上了。(Cô giáo đặt vở bài tập lên bàn rồi).
2. Chuyển giao quan hệ (Trao tặng, hoàn trả):
   - Cấu trúc: 把 + Tân ngữ + Động từ + 给 + Đối tượng tiếp nhận.
   - Ví dụ: 你明天再把书还给我。(Ngày mai bạn hãy trả sách lại cho tôi nhé).
3. Động tác tạo ra kết quả rõ rệt (Bổ ngữ kết quả):
   - Cấu trúc: 把 + Tân ngữ + Động từ + Bổ ngữ kết quả (完, 好, 错, 干净...).
   - Ví dụ: 我跟你一起把这些工作做完。(Tôi cùng bạn làm xong hết những việc này).
   - 妈妈把衣服洗干净了。(Mẹ đã giặt sạch quần áo rồi).
4. Động tác mang Bổ ngữ xu hướng hoặc Trạng thái:
   - Cấu trúc: 把 + Tân ngữ + Động từ + Bổ ngữ xu hướng / 得 + Bổ ngữ trạng thái.
   - Ví dụ: 你把声音开得太大了。(Bạn mở âm lượng to quá mức rồi).
   - 他把球踢进去了。(Cậu ấy sút bóng vào trong rồi).

Quy tắc cấm kỵ:
- Không bao giờ để động từ đứng trơ trọi một mình (phải có 了, 完, 在, 给 hoặc bổ ngữ đi kèm).
- Từ phủ định 没/不 và động từ năng nguyện 想/要 PHẢI đứng TRƯỚC chữ 把 (Ví dụ: 我没把护照带上, KHÔNG nói: 我把护照没带上).`,
    examples: [
      { chinese: '请把你的护照拿出来。', pinyin: 'Qǐng bǎ nǐ de hùzhào ná chūlái.', english: 'Xin hãy lấy hộ chiếu của bạn ra.' },
      { chinese: '我明天一定把书还给你。', pinyin: 'Wǒ míngtiān yídìng bǎ shū huán gěi nǐ.', english: 'Ngày mai tôi nhất định sẽ trả lại sách cho bạn.' },
      { chinese: '妈妈把房间打扫得很干净。', pinyin: 'Māma bǎ fángjiān dǎsǎo de hěn gānjìng.', english: 'Mẹ dọn dẹp căn phòng vô cùng sạch sẽ.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 4. CÂU CHỮ BỊ (被字句) - CÂU BỊ ĐỘNG (HSK 3)
  {
    id: 'rag-grammar-bei-passive',
    title: 'Câu Bị động chữ 被 (被字句 - HSK 3 chuẩn 3.0)',
    category: 'grammar',
    tags: ['bei sentence', 'cau chu bi', 'bi dong', 'hsk3', 'ngu phap'],
    rulesSummary: 'Chủ ngữ (Đối tượng chịu tác động) + 被 + (Tác nhân gây ra) + Động từ + Thành phần khác. Thường biểu thị sự việc không mong muốn, bị động hoặc bất đắc dĩ.',
    content: `Câu bị động chữ 被 trong tiếng Trung:
Cấu trúc: Chủ ngữ + (Phó từ phủ định 没/不) + 被 + (Người/Tác nhân gây ra) + Động từ + Thành phần khác (走了, 吃了, 弄坏了...).

Đặc điểm quan trọng:
1. Tác nhân gây hành động có thể được lược bỏ nếu không rõ hoặc không cần thiết:
   - 这本书被别人借走了。(Cuốn sách này bị người khác mượn mất rồi).
   - 这本书被借走了。(Cuốn sách này đã bị mượn mất rồi - lược bỏ tác nhân).
2. Sắc thái biểu cảm:
   - Đa số mang sắc thái tiêu cực, bị động, bất ngờ, bất đắc dĩ hoặc chịu thiệt hại.
   - Ví dụ: 我的自行车被偷了 (Xe đạp của tôi bị trộm mất rồi).
   - 水果可能被弟弟吃了 (Hoa quả có thể đã bị em trai ăn hết rồi).
3. Trong khẩu ngữ hàng ngày, chữ 让 (ràng) hoặc 叫 (jiào) cũng có thể thay thế cho 被 mang nghĩa bị động, nhưng sau 让/叫 BẮT BUỘC phải có tác nhân.`,
    examples: [
      { chinese: '这本书被别人借走了。', pinyin: 'Zhè běn shū bèi biérén jièzǒu le.', english: 'Cuốn sách này bị người khác mượn đi mất rồi.' },
      { chinese: '我的手机被小偷偷走了。', pinyin: 'Wǒ de shǒujī bèi xiǎotōu tōuzǒu le.', english: 'Điện thoại của tôi đã bị kẻ trộm lấy cắp mất.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 5. CÁC DẠNG CÂU SO SÁNH (比较句 1 - 11) TRỌN BỘ HSK 2 & 3
  {
    id: 'rag-grammar-comparisons-complete',
    title: 'Trọn bộ 11 Cấu trúc Câu So sánh (比较句 1-11) HSK 2 & HSK 3 (HSK 3.0)',
    category: 'grammar',
    tags: ['so sanh', 'cau so sanh', 'bi', 'hsk2', 'hsk3', 'bijiaoju'],
    rulesSummary: 'Tổng hợp đầy đủ các mẫu câu so sánh: A比B+Adj; A比B+更/还+Adj; A没有B+Adj; A比B+Adj+多了/得多; A比B+Adj+Số lượng; 跟...一样/不一样; A不比B+Adj; A比B+多/少/早/晚+V+Số lượng.',
    content: `Hệ thống 11 Dạng câu So sánh trong Giáo trình Chuẩn HSK 3.0:
1. So sánh cơ bản (HSK 2): A + 比 + B + Tính từ.
   - Ví dụ: 今天比昨天冷。(Hôm nay lạnh hơn hôm qua).
2. Tăng cường mức độ bằng 更 / 还: A + 比 + B + 更 / 还 + Tính từ.
   - Tuyệt đối KHÔNG dùng 很, 非常, 特别 trong câu chữ 比.
   - Ví dụ: 他比我更高。(Cậu ấy còn cao hơn cả tôi).
3. So sánh kém với 没有: A + 没有 + B + (这么/那么) + Tính từ.
   - Ví dụ: 儿子没有他那么高。(Con trai không cao bằng cậu ấy).
4. So sánh chênh lệch lớn với 多了 / 得多: A + 比 + B + Tính từ + 多了 / 得多.
   - Ví dụ: 这里比北京冷多了。(Ở đây lạnh hơn Bắc Kinh nhiều).
5. So sánh kèm Bổ ngữ trạng thái: A + 比 + B + Động từ + 得 + Tính từ (hoặc: Động từ + 得 + 比 + B + Tính từ).
   - Ví dụ: 他跑步比我跑得快。(Cậu ấy chạy bộ nhanh hơn tôi).
6. So sánh đồng đẳng với 跟……一样 / 不一样 (HSK 3): A + 跟 / 和 + B + 一样 (+ Tính từ).
   - Ví dụ: 这家宾馆跟别的不一样。(Khách sạn này không giống những nơi khác).
   - 他买的新手机跟我的一样。(Điện thoại mới cậu ấy mua giống hệt của tôi).
7. So sánh chênh lệch cụ thể (Số lượng): A + 比 + B + Tính từ + Số lượng từ.
   - Ví dụ: 姐姐比我大三岁。(Chị gái lớn hơn tôi 3 tuổi).
   - 坐飞机比坐火车快五个多小时。(Đi máy bay nhanh hơn đi tàu hỏa hơn 5 tiếng).
8. So sánh chênh lệch nhỏ với 一点儿 / 一些: A + 比 + B + Tính từ + 一点儿 / 一些.
   - Ví dụ: 裙子比短裤贵一点儿。(Váy đắt hơn quần đùi một chút).
9. So sánh phản bác / xấp xỉ với 不比: A + 不比 + B + Tính từ.
   - Mang nghĩa A và B chênh lệch không đáng kể, hoặc dùng để phản bác ý kiến đối phương.
   - Ví dụ: 裙子不比短裤贵多少。(Váy chẳng đắt hơn quần đùi bao nhiêu đâu).
10. So sánh thời gian/số lượng hành động: A + 比 + B + 多/少/早/晚 + Động từ + Số lượng từ.
    - Ví dụ: 冬天比夏天早关门一个小时。(Mùa đông đóng cửa sớm hơn mùa hè 1 tiếng).
    - 哥哥比弟弟多吃了三个饺子。(Anh trai ăn nhiều hơn em trai 3 cái sủi cảo).`,
    examples: [
      { chinese: '这里比北京冷多了。', pinyin: 'Zhèlǐ bǐ Běijīng lěng duō le.', english: 'Ở đây lạnh hơn Bắc Kinh nhiều (Chênh lệch lớn).' },
      { chinese: '这家宾馆跟别的不一样。', pinyin: 'Zhè jiā bīnguǎn gēn biéde bù yíyàng.', english: 'Khách sạn này không giống những nơi khác (So sánh đồng đẳng).' },
      { chinese: '他跑得比我快得多。', pinyin: 'Tā pǎo de bǐ wǒ kuài de duō.', english: 'Anh ấy chạy nhanh hơn tôi rất nhiều.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 6. CÁC LOẠI BỔ NGỮ TRỌNG TÂM (KẾT QUẢ, XU HƯỚNG, KHẢ NĂNG, THỜI LƯỢNG)
  {
    id: 'rag-grammar-complements-hsk',
    title: 'Hệ thống Toàn diện Bổ ngữ tiếng Trung (Kết quả, Xu hướng mở rộng, Khả năng, Trình độ)',
    category: 'grammar',
    tags: ['bo ngu', 'bo ngu xu huong', 'bo ngu kha nang', 'bo ngu ket qua', 'hsk2', 'hsk3'],
    rulesSummary: 'Phân loại và cách sử dụng chính xác: Bổ ngữ kết quả (完, 好, 懂, 错), Bổ ngữ xu hướng đơn/kép (来, 去, 上来, 下去, 起来), Bổ ngữ khả năng (V+得/不+C), Bổ ngữ thời lượng.',
    content: `Tổng hợp các loại Bổ ngữ bắt buộc trong HSK 2 và HSK 3 (HSK 3.0):
1. Bổ ngữ kết quả (Kết quả của hành động):
   - Động từ + 完 (xong), 好 (hoàn tất thỏa đáng), 懂 (hiểu), 见 (thấy), 错 (nhầm).
   - Ví dụ: 饭做好了 (Cơm nấu xong rồi), 听懂了 (Nghe hiểu rồi), 拿错了 (Lấy nhầm rồi).
2. Bổ ngữ xu hướng mở rộng (引申用法 - HSK 3):
   - 下去 (tiếp tục hành động đang diễn ra): 读下去 (đọc tiếp đi), 不能再胖下去了 (không thể tiếp tục béo thêm nữa).
   - 起来 (bắt đầu và tiếp diễn / đánh giá góc độ): 天气热起来了 (trời bắt đầu nóng lên rồi), 看起来很好吃 (nhìn qua thấy rất ngon).
   - 下来 (hành động từ quá khứ kéo dài đến nay / hoàn thành tốn công sức): 这一年多住下来 (sống ở đây suốt hơn một năm qua).
3. Bổ ngữ khả năng (Có thể / Không thể đạt được kết quả):
   - Khẳng định: Động từ + 得 + Bổ ngữ (看得懂 - đọc hiểu được, 听得见 - nghe thấy được).
   - Phủ định: Động từ + 不 + Bổ ngữ (看不懂 - không đọc hiểu được, 打不好 - đánh không giỏi).
   - Nghi vấn: Động từ + 得 + Bổ ngữ + Động từ + 不 + Bổ ngữ? (你看得懂看不懂？).
4. Bổ ngữ thời lượng (Khoảng thời gian hành động diễn ra):
   - Động từ + Thời lượng + (Tân ngữ): 学了一年中文 (Học 1 năm tiếng Trung).
   - Động từ lặp lại khi có tân ngữ: 游泳游了一个下午 (Bơi lội suốt cả một buổi chiều).`,
    examples: [
      { chinese: '只要你坚持下去，就一定能成功。', pinyin: 'Zhǐyào nǐ jiānchí xiàqù, jiù yídìng néng chénggōng.', english: 'Chỉ cần bạn kiên trì tiếp tục thì nhất định sẽ thành công (Xu hướng 下去).' },
      { chinese: '这个问题太难了，我解决不了。', pinyin: 'Zhège wèntí tài nán le, wǒ jiějué bù liǎo.', english: 'Vấn đề này khó quá, tôi không thể giải quyết nổi (Khả năng 不了).' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 7. CÂU PHỨC LIÊN TỪ VÀ ĐỊNH THỨC CỐ ĐỊNH HSK 2 & 3
  {
    id: 'rag-grammar-complex-sentences',
    title: 'Hệ thống Liên từ và Câu phức Trọng điểm HSK 2, 3, 4, 5 (HSK 3.0)',
    category: 'grammar',
    tags: ['lien tu', 'cau phuc', 'dinh thuc', 'hsk2', 'hsk3', 'hsk4', 'hsk5'],
    rulesSummary: 'Các mẫu liên từ và câu phức: 因为...所以..., 虽然...但是..., 不但...而且..., 只要...就..., 只有...才..., 为了..., 一边...一边..., 越A越B, 除了...以外.',
    content: `Các mẫu câu phức và liên từ thông dụng nhất trong giao tiếp và đề thi HSK:
1. Quan hệ Điều kiện:
   - 只要……，就…… (Chỉ cần... thì... - Điều kiện đủ): 只要你努力，就能学好。(Chỉ cần bạn nỗ lực thì sẽ học giỏi).
   - 只有……，才…… (Chỉ có... mới... - Điều kiện cần duy nhất): 只有多听多说，汉语水平才能提高。(Chỉ có nghe nhiều nói nhiều thì trình độ mới nâng cao).
2. Quan hệ Tăng tiến:
   - 不但……，而且…… (Không những... mà còn...): 现在的高铁不但便宜，而且很舒服。(Tàu cao tốc bây giờ không những rẻ mà còn rất êm ái).
   - ……，更…… (..., lại càng...): 我不仅想学中文，更想了解中国文化。
3. Quan hệ Giả thiết:
   - 如果……，就…… / ……的话，就…… (Nếu... thì...): 如果明天不下雨，我们就去爬山。(Nếu mai không mưa thì tụi mình đi leo núi).
4. Quan hệ Mục đích:
   - 为了……，…… (Để, nhằm mục đích): 为了准备运动会，他们每天都练球。(Để chuẩn bị cho đại hội thể thao, họ ngày nào cũng luyện tập).
5. Các Cụm Định thức Cố định:
   - 越 A 越 B (Càng A càng B): 天气越来越冷 (Thời tiết càng ngày càng lạnh), 越看越着急 (Càng xem càng sốt ruột).
   - 一……也/都 + 不/没…… (Hoàn toàn phủ định): 我一点儿也不累 (Tôi chẳng mệt chút nào), 一分钱都没花 (Chưa tiêu một đồng nào).
   - 除了……(以外)，……都/还/也…… (Ngoài... ra): 除了他以外，大家都来了。(Ngoại trừ anh ấy ra, mọi người đều đã đến đông đủ).
   - 看来…… (Xem ra, dường như): 看来我没办法解决这个问题了。(Xem ra tôi không có cách nào giải quyết vấn đề này rồi).`,
    examples: [
      { chinese: '只要坚持练习，你的发音就会越来越好。', pinyin: 'Zhǐyào jiānchí liànxí, nǐ de fāyīn jiù huì yuèláiyuè hǎo.', english: 'Chỉ cần kiên trì luyện tập, phát âm của bạn sẽ ngày càng hay hơn.' },
      { chinese: '除了星期天以外，他每天都去图书馆。', pinyin: 'Chúle xīngqītiān yǐwài, tā měitiān dōu qù túshūguǎn.', english: 'Ngoại trừ ngày chủ nhật ra, ngày nào anh ấy cũng đến thư viện.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 8. LƯỢNG TỪ TOÀN DIỆN VÀ LƯỢNG TỪ TRÙNG ĐIỆP
  {
    id: 'rag-grammar-measure-words-all',
    title: 'Cẩm nang Lượng từ Tiếng Trung Toàn tập & Lượng từ Trùng điệp (HSK 1-5)',
    category: 'vocabulary',
    tags: ['luong tu', 'liangci', 'measure words', 'hsk1', 'hsk2', 'hsk3', 'hsk4'],
    rulesSummary: 'Bảng lượng từ chuẩn xác theo danh từ: 个, 本, 张, 条, 把, 辆, 只, 件, 间, 封, 碗, 双, 瓶, 块. Quy tắc trùng điệp lượng từ (张张, 个个, 天天) biểu thị "từng cái một / tất cả mọi...".',
    content: `Quy tắc ghép lượng từ chuẩn xác trong tiếng Trung:
Công thức: [Số từ / 这 / 那 / 哪] + [LƯỢNG TỪ] + [Danh từ]

Bảng tra cứu Lượng từ thông dụng nhất:
- 张 (zhāng): Đồ vật có mặt phẳng mỏng: 一张纸 (tờ giấy), 一张照片 (bức ảnh), 一张机票 (vé máy bay), 一张桌子 (cái bàn).
- 条 (tiáo): Đồ vật có hình dáng thon dài, mềm mại, uốn lượn: 一条裤子 (quần dài), 一条裙子 (váy), 一条鱼 (con cá), 一条河 (dòng sông), 一条路 (con đường).
- 把 (bǎ): Đồ vật có tay cầm, nắm được: 一把雨伞 (cái ô/dù), 一把椅子 (cái ghế), 一把刀 (con dao).
- 本 (běn): Sách vở đóng thành quyển có gáy: 一本书 (quyển sách), 一本词典 (quyển từ điển), 一本杂志 (tạp chí).
- 间 (jiān): Phòng ốc, gian nhà: 一间教室 (phòng học), 一间屋子 (căn phòng).
- 封 (fēng): Thư từ bọc kín: 一封信 (bức thư), 一封邮件 (email).
- 辆 (liàng): Phương tiện giao thông có bánh xe: 一辆自行车 (xe đạp), 一辆汽车 (ô tô).
- 只 (zhī): Động vật hoặc một chiếc lẻ trong cặp đôi: 一只猫 (con mèo), 一只鸟 (con chim), 一只鞋 (chiếc giày).
- 双 (shuāng): Đi theo cặp, đôi: 一双筷子 (đôi đũa), 一双鞋 (đôi giày), 一双手 (đôi tay).
- 件 (jiàn): Áo phía trên, sự việc, hành lý: 一件大衣 (áo khoác), 一件事 (một sự việc).

Quy tắc Trùng điệp Lượng từ (Lượng từ lặp lại):
- Khi lượng từ lặp lại dạng AA (个个, 张张, 天天, 件件), nó mang nghĩa là "mỗi một", "tất cả mọi cái đều...", phía sau thường đi với phó từ '都'.
- Ví dụ: 这些照片张张都好看。(Những bức ảnh này tấm nào tấm nấy đều rất đẹp).
- 这里的苹果个个都很大。(Táo ở đây quả nào quả nấy đều to).`,
    examples: [
      { chinese: '他给我们发了一封重要的邮件。', pinyin: 'Tā gěi wǒmen fāle yì fēng zhòngyào de yóujiàn.', english: 'Anh ấy đã gửi cho chúng tôi một email quan trọng (Email: 封).' },
      { chinese: '这些照片张张都非常漂亮。', pinyin: 'Zhèxiē zhàopiàn zhāngzhāng dōu fēicháng piàoliang.', english: 'Những bức ảnh này tấm nào cũng đều rất đẹp (Trùng điệp: 张张).' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 9. THÀNH NGỮ VÀ TỪ VỰNG CAO CẤP HSK 4 - 5
  {
    id: 'rag-chengyu-hsk45',
    title: 'Thành ngữ Hán ngữ (成语 - Chéngyǔ) & Nghệ thuật Diễn đạt Tự nhiên HSK 4 - 5',
    category: 'chengyu',
    tags: ['chengyu', 'thanh ngu', 'hsk4', 'hsk5', 'van hoa', 'dien dat'],
    rulesSummary: 'Các thành ngữ 4 chữ kinh điển thường gặp trong thi cử và đời sống: 恍然大悟 (bừng hiểu), 胸有成竹 (nắm chắc), 循序渐进 (từng bước vững chắc), 半途而废 (bỏ dở giữa chừng), 拔苗助长 (dục tốc bất đạt).',
    content: `Thành ngữ 4 chữ (成语) là tinh hoa ngôn ngữ và tư duy văn hóa của người Trung Quốc:
1. 恍然大悟 (huǎng rán dà wù - Hoảng nhiên đại ngộ):
   - Ý nghĩa: Bỗng nhiên bừng tỉnh, ngộ ra chân lý sau khi được gợi ý hoặc suy ngẫm kỹ.
   - Ví dụ: 听了老师的讲解，他恍然大悟。(Nghe thầy giáo giảng giải xong, anh ấy bừng hiểu ra ngay).
2. 胸有成竹 (xiōng yǒu chéng zhú - Hung hữu thành trúc):
   - Ý nghĩa: Trong lòng đã có sẵn kế hoạch chắc chắn và đầy tự tin trước khi bắt tay hành động.
   - Nguồn gốc: Họa sĩ Văn Đồng đời Tống quan sát trúc bốn mùa đến mức trong đầu đã hiện rõ từng nhánh trúc trước khi hạ bút vẽ.
3. 循序渐进 (xún xù jiàn jìn - Tuần tự tiệm tiến):
   - Ý nghĩa: Học tập và rèn luyện theo từng bước có trật tự, từ dễ đến khó, không nóng vội.
4. 半途而废 (bàn tú ér fèi - Bán đồ nhi phế):
   - Ý nghĩa: Bỏ dở giữa chừng, không kiên trì đến cùng.
5. 拔苗助长 (bá miáo zhù zhǎng - Bạt miêu trợ trưởng):
   - Ý nghĩa: Kéo mạ lên để giúp lúa mau lớn -> Dục tốc bất đạt, làm trái quy luật tự nhiên gây hỏng việc.`,
    examples: [
      { chinese: '学汉语要循序渐进，不能急于求成。', pinyin: 'Xué Hànyǔ yào xúnxùjiànjìn, bù néng jíyúqiúchéng.', english: 'Học tiếng Trung cần tuần tự tiệm tiến từng bước, không thể nóng vội cầu thành.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 10. CÁC CẶP LIÊN TỪ & CẤU TRÚC PHỨC HỢP TRỌNG TÂM HSK 4
  {
    id: 'rag-grammar-hsk4-conjunctions',
    title: 'Các Cặp Liên từ Phức hợp Trọng điểm HSK 4 (无论/不管, 尽管/虽然, 既然, 只要, 只有)',
    category: 'grammar',
    tags: ['hsk4', 'lien tu', 'ngu phap hsk4', 'wulun', 'jinguan', 'jiran', 'zhiyao', 'zhiyou', 'cau phuc'],
    rulesSummary: '1. 无论……都/也…… (Bất kể... đều... - đi với từ nghi vấn/lựa chọn); 2. 尽管……但是/还是…… (Dù rằng/mặc dù... nhưng...); 3. 既然……就…… (Đã... thì...); 4. 只要……就…… (Chỉ cần... là...); 5. 只有……才…… (Chỉ có... mới...).',
    content: `Cặp liên từ trong HSK 4 là xương sống giúp câu văn mạch lạc, chặt chẽ:
1. 无论 (wúlùn) / 不管 (bùguǎn) …… 都 / 也 …… (Bất kể... đều...):
- Biểu thị trong bất kỳ điều kiện nào thì kết quả vẫn không đổi.
- Lưu ý: Sau 无论/不管 PHẢI có thành phần biểu thị sự lựa chọn (A 还是 B, A 不 A) hoặc đại từ nghi vấn (什么, 谁, 怎么, 哪儿).
- Ví dụ: 无论是晴天还是下雨，他都坚持晨跑。(Bất kể trời nắng hay mưa, anh ấy đều kiên trì chạy bộ sáng).
- So sánh: '无论' mang tính văn viết trang trọng hơn; '不管' thường dùng trong khẩu ngữ.

2. 尽管 (jǐnguǎn) …… 但是 / 还是 …… (Dù rằng, mặc dù... nhưng...):
- Biểu thị nhượng bộ, công nhận một sự thật nhưng phân câu sau vẫn tiếp diễn.
- Ví dụ: 尽管外面下着大雨，但他还是准时到达了会议室。(Dù ngoài trời mưa to, anh ấy vẫn đến phòng họp đúng giờ).
- Phân biệt với 无论: '尽管' nói về một sự thật đã hoặc đang xảy ra (Dù thời tiết xấu...), còn '无论' nói về điều kiện giả định/bất định (Bất kể thời tiết thế nào...).

3. 既然 (jìrán) …… 就 / 也 / 那 …… (Đã... thì...):
- Dùng khi tiền đề/nguyên nhân đã là một thực tế hiển nhiên, đưa ra kết luận hoặc đề xuất giải quyết.
- Ví dụ: 既然你已经决定了，就大胆去尝试吧。(Đã quyết định rồi thì hãy mạnh dạn thử sức đi).

4. 只要 (zhǐyào) …… 就 …… (Chỉ cần... là...) vs 只有 (zhǐyǒu) …… 才 …… (Chỉ có... mới...):
- 只要……就……: Điều kiện đủ (chỉ cần thỏa mãn điều kiện này là có kết quả).
- 只有……才……: Điều kiện cần và duy nhất (chỉ duy nhất điều kiện này mới đem lại kết quả).
- Ví dụ: 只要努力，就会有收获。(Chỉ cần nỗ lực là sẽ có thu hoạch).
- Ví dụ: 只有坚持到底，才能取得成功。(Chỉ có kiên trì đến cùng mới gặt hái thành công).`,
    examples: [
      { chinese: '无论遇到什么困难，我们都要坚持下去。', pinyin: 'Wúlùn yùdào shénme kùnnan, wǒmen dōu yào jiānchí xiàqù.', english: 'Bất kể gặp khó khăn gì, chúng ta đều phải kiên trì tới cùng.' },
      { chinese: '尽管天气很冷，他仍然每天去游泳。', pinyin: 'Jǐnguǎn tiānqì hěn lěng, tā réngrán měitiān qù yóuyǒng.', english: 'Dù thời tiết rất lạnh, anh ấy vẫn mỗi ngày đi bơi.' },
      { chinese: '既然大家意见一致，那我们就这么决定了。', pinyin: 'Jìrán dàjiā yìjiàn yízhì, nà wǒmen jiù zhème juédìng le.', english: 'Đã mọi người đều thống nhất ý kiến thì chúng ta quyết định vậy nhé.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 11. CẤU TRÚC NHẤN MẠNH & SO SÁNH PHÓ TỪ HSK 4
  {
    id: 'rag-grammar-hsk4-structures',
    title: 'Các Cấu trúc Ngữ pháp Đặc thù HSK 4 (连……都……, 拿……来说, 对于/关于, 随着, 到底/究竟)',
    category: 'grammar',
    tags: ['hsk4', 'lian dou', 'na laishuo', 'duiyu', 'guanyu', 'suizhe', 'daodi', 'jiujing', 'ngu phap hsk4'],
    rulesSummary: '1. 连……都/也…… (Ngay cả/Đến cả... cũng...); 2. 拿……来说 (Lấy... làm ví dụ); 3. 对于 vs 关于 (Đối với vs Về); 4. 随着 (Cùng với/Theo đà...); 5. 到底 vs 究竟 (Rốt cuộc/cuối cùng).',
    content: `Các mẫu câu và phó từ đặc thù trong chuẩn HSK 4:
1. Cấu trúc nhấn mạnh: 连 (lián) …… 都 / 也 …… (Ngay cả... cũng...):
- Cấu trúc: 连 + Danh từ/Mệnh đề nhấn mạnh cực đoan + 都/也 + Phủ định/Khẳng định.
- Nhấn mạnh một ví dụ hiển nhiên nhất để suy ra các trường hợp khác.
- Ví dụ: 这道题太难了，连老师都不会做。(Câu hỏi này khó quá, ngay cả giáo viên cũng không giải nổi).
- 连三岁的小孩儿都懂这个道理。(Đến cả đứa trẻ 3 tuổi cũng hiểu đạo lý này).

2. Cấu trúc dẫn chứng: 拿 (ná) …… 来说 (láishuō) (Lấy... làm ví dụ / Xét về...):
- Dùng để đưa ra ví dụ tiêu biểu nhằm chứng minh cho luận điểm vừa nêu.
- Ví dụ: 现在的年轻人越来越注重健康，拿小李来说，他每天都坚持健身。(Thanh niên bây giờ ngày càng chú trọng sức khỏe, lấy Tiểu Lý làm ví dụ, ngày nào cậu ấy cũng tập gym).

3. Phân biệt 对于 (duìyú) và 关于 (guānyú):
- 对于: Chỉ đối tượng tiếp nhận sự tác động hoặc thái độ của chủ ngữ (Đối với...). Có thể đứng trước hoặc sau chủ ngữ.
- 关于: Chỉ phạm vi, chủ đề liên quan (Về/Liên quan đến...). Luôn đứng ở đầu câu, trước chủ ngữ.
- Ví dụ: 对于这个问题，大家有不同的看法。(Đối với vấn đề này, mọi người có quan điểm khác nhau).
- Ví dụ: 关于中国文化的历史，你可以读读这本书。(Về lịch sử văn hóa Trung Hoa, bạn có thể đọc cuốn sách này).

4. Cấu trúc biến đổi theo thời gian: 随着 (suízhe) …… (Cùng với... / Theo đà...):
- Đi với sự phát triển, biến chuyển của thời gian, công nghệ, kinh tế hoặc xã hội.
- Ví dụ: 随着科技的发展，人们的生活越来越方便。(Cùng với sự phát triển của công nghệ, đời sống con người ngày càng tiện lợi).

5. Phân biệt 到底 (dàodǐ) và 究竟 (jiūjìng) (Rốt cuộc, suy cho cùng):
- Cả hai đều là phó từ dùng trong câu hỏi nghi vấn để truy cứu đến cùng bản chất sự việc.
- '到底' có thể dùng làm động từ trong cụm '坚持到底' (kiên trì đến cùng) hoặc phó từ trần thuật (sau cùng thì).
- '究竟' trang trọng hơn, dùng nhiều trong văn viết và chỉ dùng làm phó từ.
- Ví dụ: 你到底想去哪儿？ / 你究竟去不去？(Rốt cuộc bạn muốn đi đâu? / Rốt cuộc bạn có đi hay không?).`,
    examples: [
      { chinese: '他工作太忙了，连早饭都顾不上吃。', pinyin: 'Tā gōngzuò tài máng le, lián zǎofàn dōu gù bú shàng chī.', english: 'Anh ấy bận quá, ngay cả bữa sáng cũng không kịp ăn (连……都……).' },
      { chinese: '随着汉语水平的提高，他看中文新闻越来越轻松了。', pinyin: 'Suízhe Hànyǔ shuǐpíng de tígāo, tā kàn Zhōngwén xīnwén yuèláiyuè qīngsōng le.', english: 'Cùng với trình độ tiếng Hán nâng cao, anh ấy đọc tin tức tiếng Trung ngày càng nhẹ nhàng (随着……).' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },

  // 12. PHÓ TỪ VÀ BỔ NGỮ KHẢ NĂNG HSK 4
  {
    id: 'rag-grammar-hsk4-adverbs-complements',
    title: 'Phó từ Ngữ khí & Bổ ngữ Khả năng Thường gặp HSK 4 (恐怕, 倒, 千万, 受不了, 来得及)',
    category: 'grammar',
    tags: ['hsk4', 'kongpa', 'dao', 'qianwan', 'shoubuliao', 'laideji', 'bo ngu kha nang', 'ngu phap hsk4'],
    rulesSummary: '1. 恐怕 (E rằng/Sợ rằng); 2. 倒 (Ngược lại/Được cái là); 3. 千万 (Vạn lần/Nhất thiết); 4. Bổ ngữ khả năng: 受得了/受不了, 来得及/来不及, 吃得上/吃不上, 想起来.',
    content: `Phó từ ngữ khí và Bổ ngữ khả năng tinh tế trong HSK 4:
1. Phó từ 恐怕 (kǒngpà) vs 怕 (pà):
- 恐怕: Phó từ biểu thị phỏng đoán kèm tâm lý lo lắng hoặc dự cảm kết quả không như ý ('e rằng, sợ rằng'). Đứng trước động từ hoặc đầu câu.
- 怕: Động từ biểu thị sự sợ hãi tâm lý (害怕) hoặc phó từ khẩu ngữ.
- Ví dụ: 今天路上堵车，我们恐怕要迟到了。(Hôm nay đường tắc xe, chúng ta e rằng sẽ đến muộn rồi).

2. Phó từ 倒 (dào):
- Biểu thị sự tương phản bất ngờ: 这里的西瓜虽然不大，味道倒挺甜。(Dưa hấu ở đây tuy không to nhưng vị lại rất ngọt).
- Biểu thị nhượng bộ hoặc biện minh: 东西倒是不贵，就是质量一般。(Đồ thì đúng là không đắt, có điều chất lượng bình thường).

3. Phó từ 千万 (qiānwàn) (Nhất thiết, vạn lần):
- Dùng trong câu khuyên can hoặc mệnh lệnh, nhấn mạnh tầm quan trọng tuyệt đối.
- Thường đi với câu phủ định: 千万别 (qiānwàn bié), 千万不要 (qiānwàn bú yào).
- Ví dụ: 明天是重要面试，你千万不要迟到。(Ngày mai là buổi phỏng vấn quan trọng, bạn tuyệt đối vạn lần đừng đi muộn).

4. Các Bổ ngữ Khả năng & Cố định trong HSK 4:
- 受得了 / 受不了 (shòudeliǎo / shòubuliǎo): Chịu đựng được / Không chịu đựng nổi.
- 来得及 / 来不及 (láidejí / láibùjí): Kịp thời gian / Không kịp thời gian.
- 买得起 / 买不起 (mǎideqǐ / mǎibuqǐ): Có đủ tiền mua / Không đủ tiền mua.
- 想起来 (xiǎng qǐlái): Nhớ ra (hồi tưởng lại chuyện đã quên).`,
    examples: [
      { chinese: '现在出发还来得及赶上下午两点的飞机。', pinyin: 'Xiànzài chūfā hái láidejí gǎnshang xiàwǔ liǎng diǎn de fēijī.', english: 'Bây giờ xuất phát vẫn kịp bắt chuyến bay lúc 2 giờ chiều.' },
      { chinese: '这间屋子夏天太热了，简直让人受不了。', pinyin: 'Zhè jiān wūzi xiàtiān tài rè le, jiǎnzhí ràng rén shòubuliǎo.', english: 'Căn phòng này mùa hè nóng quá, quả thực khiến người ta không chịu nổi.' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
  }
];

// ============================================================================
// VIETNAMESE NORMALIZATION & SEARCH UTILITIES FOR RAG
// ============================================================================

/**
 * Loại bỏ dấu tiếng Việt để chuyển chuỗi về dạng ký tự không dấu chuẩn ASCII.
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Kiểm tra một từ đứng độc lập trong văn bản theo ranh giới từ Unicode
 */
export function containsWord(text: string, word: string): boolean {
  if (!text || !word) return false;
  return new RegExp('(^|[^\\p{L}\\p{N}])' + escapeRegExp(word) + '([^\\p{L}\\p{N}]|$)', 'ui').test(text);
}

/**
 * Tập hợp các từ dừng giao tiếp phổ biến trong tiếng Việt nhằm tránh kích hoạt
 * sai tài liệu ngữ pháp khi người học chỉ chào hỏi hoặc trò chuyện thông thường.
 */
export const VIETNAMESE_STOP_WORDS = new Set([
  'chao', 'co', 'thay', 'giao', 'em', 'toi', 'minh', 'ban', 'chung',
  'muon', 'hoc', 'mot', 'bai', 'moi', 'hom', 'nay', 'ngay', 'mai', 'thoi',
  'tiet', 'dep', 'qua', 'la', 'va', 'cua', 'cho', 'trong', 'voi', 'cac',
  'nhung', 'duoc', 'khong', 'the', 'nao', 'giup', 'xin', 'hay',
  'hoi', 'gi', 'sao', 'nhe', 'a', 'oi', 'nhi', 'day', 'do', 'nua',
  'rat', 'de', 'lam'
]);

/**
 * Từ điển đồng nghĩa / thuật ngữ tương đương giữa tiếng Việt, tiếng Anh và HSK
 */
export const SEMANTIC_TERM_SYNONYMS: Record<string, string[]> = {
  // Biến điệu & Thanh điệu (Tones & Sandhi)
  'bien dieu thanh 3': ['tone sandhi', 'thanh 3'],
  'third tone sandhi': ['tone sandhi', 'thanh 3'],
  'bien dieu': ['tone sandhi', 'thanh 3', 'tones', 'bien am'],
  'tone sandhi': ['tone sandhi', 'thanh 3'],
  'thanh dieu': ['tone sandhi', 'thanh 3', 'tones', 'pinyin', 'pronunciation'],
  'thanh ba': ['thanh 3', 'tone sandhi'],
  'third tone': ['thanh 3', 'tone sandhi'],
  'thanh mot': ['thanh 1', 'yi'],
  'thanh hai': ['thanh 2'],
  'thanh bon': ['thanh 4', 'bu'],

  // Phát âm & Ngữ âm (Pronunciation & Phonetics)
  'phat am': ['pronunciation', 'pinyin', 'tone sandhi'],
  'pronunciation': ['pronunciation', 'pinyin', 'tone sandhi'],

  // Từ vựng & Lượng từ & Thành ngữ (Vocabulary, Measure words, Idioms)
  'tu vung': ['luong tu', 'liangci', 'measure words', 'chengyu', 'thanh ngu'],
  'vocabulary': ['luong tu', 'liangci', 'measure words', 'chengyu', 'thanh ngu'],
  'luong tu': ['luong tu', 'liangci', 'measure words'],
  'liangci': ['luong tu', 'liangci', 'measure words'],
  'measure words': ['luong tu', 'liangci', 'measure words'],
  'thanh ngu': ['chengyu', 'thanh ngu'],
  'chengyu': ['chengyu', 'thanh ngu'],
  'idioms': ['chengyu', 'thanh ngu'],

  // Ngữ pháp & Trợ từ & Cấu trúc câu (Grammar & Sentence Structures)
  'grammar': ['ngu phap', 'ngu phap hsk3', 'ngu phap hsk4', 'cau truc'],
  'tro tu': ['de', 'tro tu', 'de de de'],
  'cau chu ba': ['ba', 'cau chu ba', 'ba sentence'],
  'ba sentence': ['ba', 'cau chu ba', 'ba sentence'],
  'cau chu bi': ['bei sentence', 'cau chu bi', 'bi dong'],
  'bi dong': ['bei sentence', 'cau chu bi', 'bi dong'],
  'passive': ['bei sentence', 'cau chu bi', 'bi dong'],
  'so sanh': ['so sanh', 'cau so sanh', 'bijiaoju', 'bi'],
  'comparison': ['so sanh', 'cau so sanh', 'bijiaoju'],
  'bo ngu': ['bo ngu', 'bo ngu xu huong', 'bo ngu kha nang', 'bo ngu ket qua'],
  'complements': ['bo ngu', 'bo ngu xu huong', 'bo ngu kha nang', 'bo ngu ket qua'],
  'lien tu': ['lien tu', 'cau phuc', 'dinh thuc'],
  'conjunctions': ['lien tu', 'cau phuc', 'dinh thuc']
};

/**
 * Local Semantic/Keyword RAG Search helper
 * Retrieves top matching documents based on user query with Vietnamese accent support,
 * CJK Hanzi preservation, and boundary checking.
 */
export function queryKnowledgeBase(query: string, limit: number = 4): RAGDocument[] {
  if (!query || !query.trim()) return [];

  const rawClean = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const unaccentedQuery = removeVietnameseTones(rawClean);

  // Tách tokens: giữ lại từ tiếng Việt, Pinyin, và các chữ Hán riêng lẻ
  const rawTokens = rawClean.split(/[\s,，。！？?.,!?:;]+/g).filter((t) => t.length > 0);
  const unaccentedTokens = rawTokens.map((t) => removeVietnameseTones(t));

  // Phát hiện các chữ Hán đơn lẻ (ví dụ: 把, 被, 的, 得, 地, 比, 一, 不)
  const hanziTokens = rawTokens.flatMap((t) => t.match(/[\u4e00-\u9fa5]/g) || []);
  const hasChineseChar = hanziTokens.length > 0;
  const hasChineseContext =
    hasChineseChar ||
    /(câu chữ|cau chu|ngữ pháp|ngu phap|tiếng trung|tieng trung|tiếng hoa|tieng hoa|tiếng hán|tieng han|chữ hán|chu han|hsk|cấu trúc|cau truc|trợ từ|tro tu|bổ ngữ|bo ngu|liên từ|lien tu|thành ngữ|thanh ngu|lượng từ|luong tu|phát âm|phat am|thanh điệu|thanh dieu|biến điệu|bien dieu|pinyin|grammar|chinese)/i.test(
      rawClean
    );

  const scoredDocs = INITIAL_RAG_DOCUMENTS.map((doc) => {
    let score = 0;
    const docTitleLower = doc.title.toLowerCase();
    const docTitleUnaccented = removeVietnameseTones(docTitleLower);

    const fullText = (
      doc.title +
      ' ' +
      (doc.category || '') +
      ' ' +
      doc.rulesSummary +
      ' ' +
      doc.content +
      ' ' +
      doc.tags.join(' ')
    ).toLowerCase();
    const fullTextUnaccented = removeVietnameseTones(fullText);

    // 1. So khớp trực tiếp tiêu đề (Chính xác hoặc Bỏ dấu)
    if (docTitleLower.includes(rawClean) || docTitleUnaccented.includes(unaccentedQuery)) {
      score += 25;
    }

    // 2. So khớp từ đồng nghĩa / thuật ngữ chuyên môn (Semantic Synonyms)
    let synonymBonus = 0;
    for (const [keyTerm, mappedTags] of Object.entries(SEMANTIC_TERM_SYNONYMS)) {
      if (unaccentedQuery.includes(keyTerm)) {
        for (const mTag of mappedTags) {
          const docTagsLower = doc.tags.map((t) => t.toLowerCase());
          if (docTagsLower.includes(mTag)) {
            synonymBonus += 15;
            break;
          }
        }
      }
    }
    score += Math.min(synonymBonus, 20);

    // 3. So khớp Tags (Có ranh giới từ để tránh lỗi substring như 'bi' trong 'biến')
    const matchedTagTokens = new Set<string>();
    for (const rawTag of doc.tags) {
      const tagLower = rawTag.toLowerCase();
      const tagUnaccented = removeVietnameseTones(tagLower);

      // Nếu tag ngắn (<= 3 ký tự như 'ba', 'bi', 'bu', 'yi', 'de', 'bei'): Bắt buộc khớp nguyên từ / token
      // Không khớp khi token gốc mang dấu tiếng Việt (rawToken !== unaccentedToken). Ví dụ 'để', 'đề', 'dễ', 'bị', 'bù' không khớp 'de', 'bi', 'bu'.
      if (tagLower.length <= 3) {
        const hasExactAsciiToken = rawTokens.some(
          (rawTok, idx) => rawTok === tagLower && rawTok === unaccentedTokens[idx]
        );
        if (!hasExactAsciiToken) {
          continue;
        }

        // Chống xung đột các từ đồng âm tiếng Việt phổ biến:
        if (tagLower === 'ba') {
          if (
            unaccentedQuery.includes('ba me') ||
            unaccentedQuery.includes('ba ma') ||
            unaccentedQuery.includes('thu ba') ||
            unaccentedQuery.includes('ong ba') ||
            unaccentedQuery.includes('ba con')
          ) {
            continue;
          }
          const hasBaContext =
            hasChineseChar ||
            hasChineseContext ||
            /(câu chữ ba|cau chu ba|chữ ba|chu ba|ba sentence)/i.test(rawClean);
          if (!hasBaContext) {
            continue;
          }
        }

        if (tagLower === 'bi') {
          // Tag 'bi' (chữ 比 trong câu so sánh): không kích hoạt khi ngữ cảnh là 'bị động' hoặc 'chuẩn bị'
          if (
            unaccentedQuery.includes('bi dong') ||
            unaccentedQuery.includes('cau chu bi') ||
            unaccentedQuery.includes('chuan bi')
          ) {
            continue;
          }
          const hasBiContext =
            hasChineseChar ||
            /(so sánh|so sanh|câu so sánh|cau so sanh|chữ bi|chu bi|bijiaoju|bǐ)/i.test(rawClean);
          if (!hasBiContext) {
            continue;
          }
        }

        if (tagLower === 'de') {
          const hasDeContext =
            hasChineseChar ||
            hasChineseContext ||
            /(chữ de|chu de|trợ từ de|tro tu de|de de de|phân biệt de|phan biet de|trợ từ kết cấu)/i.test(
              rawClean
            );
          if (!hasDeContext) {
            continue;
          }
        }

        if (tagLower === 'bu') {
          const hasBuContext =
            hasChineseChar ||
            /(chữ bu|chu bu|biến điệu bu|bien dieu bu|phát âm bu|phat am bu|bù|bú)/i.test(rawClean);
          if (!hasBuContext) {
            continue;
          }
        }

        if (tagLower === 'yi') {
          const hasYiContext =
            hasChineseChar ||
            /(chữ yi|chu yi|biến điệu yi|bien dieu yi|phát âm yi|phat am yi|yī|yí|yì)/i.test(rawClean);
          if (!hasYiContext) {
            continue;
          }
        }

        if (tagLower === 'bei') {
          const hasBeiContext =
            hasChineseChar ||
            hasChineseContext ||
            /(bị động|bi dong|câu bị động|cau bi dong|bèi)/i.test(rawClean);
          if (!hasBeiContext) {
            continue;
          }
        }

        score += 15;
        matchedTagTokens.add(tagLower);
      } else {
        // Tag dài (cụm từ như 'tone sandhi', 'thanh 3', 'cau chu ba', 'bo ngu')
        const tagCompact = tagUnaccented.replace(/\s+/g, '');
        const queryCompact = unaccentedQuery.replace(/\s+/g, '');
        if (
          rawClean.includes(tagLower) ||
          unaccentedQuery.includes(tagUnaccented) ||
          (tagCompact.startsWith('hsk') && queryCompact.includes(tagCompact))
        ) {
          score += 12;
          tagLower.split(/\s+/).forEach((t) => matchedTagTokens.add(t));
          tagUnaccented.split(/\s+/).forEach((t) => matchedTagTokens.add(t));
        }
      }
    }

    // 4. So khớp chữ Hán đặc thù (把, 被, 的, 得, 地, 比, v.v.)
    for (const hz of hanziTokens) {
      if (docTitleLower.includes(hz)) {
        score += 15;
      }
      if (fullText.includes(hz)) {
        score += 10;
      }
    }

    // 5. So khớp Tokens từ vựng (bỏ qua stop words và các token đã khớp trong tag)
    for (const token of rawTokens) {
      const unaccentedToken = removeVietnameseTones(token);
      if (
        VIETNAMESE_STOP_WORDS.has(unaccentedToken) ||
        matchedTagTokens.has(token) ||
        matchedTagTokens.has(unaccentedToken)
      ) {
        continue;
      }

      // Khớp số thanh điệu / HSK đi kèm từ khóa (ví dụ: 'thanh 3' -> token '3')
      if (token.length === 1 && /[1-6]/.test(token)) {
        const num = Number(token);
        const numWords = ['', 'mot', 'hai', 'ba', 'bon', 'nam', 'sau'];
        if (
          unaccentedQuery.includes(`thanh ${token}`) &&
          (fullTextUnaccented.includes(`thanh ${token}`) || fullTextUnaccented.includes(`thanh ${numWords[num]}`))
        ) {
          score += 10;
        }
        if (
          (unaccentedQuery.includes(`hsk ${token}`) || unaccentedQuery.includes(`hsk${token}`)) &&
          (fullTextUnaccented.includes(`hsk ${token}`) || fullTextUnaccented.includes(`hsk${token}`))
        ) {
          score += 8;
        }
        continue;
      }

      if (token.length > 1) {
        // Với token ngắn (<= 3 ký tự), yêu cầu ranh giới từ để tránh khớp chuỗi con giả tạo
        if (token.length <= 3) {
          if (containsWord(fullText, token)) {
            score += 3;
          } else if (token === unaccentedToken && containsWord(fullTextUnaccented, unaccentedToken)) {
            score += 1;
          }
        } else {
          // Token dài (> 3 ký tự)
          if (fullText.includes(token)) {
            score += 3;
          } else if (fullTextUnaccented.includes(unaccentedToken)) {
            score += 1;
          }
        }
      }
    }

    return { doc, score };
  });

  // Chỉ lấy các tài liệu đạt ngưỡng điểm liên quan tối thiểu và deduplicate theo doc.id
  const MIN_SCORE_THRESHOLD = 15;
  const seenDocIds = new Set<string>();
  const finalDocs: RAGDocument[] = [];

  const sortedScored = scoredDocs
    .filter((item) => item.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  for (const item of sortedScored) {
    if (!seenDocIds.has(item.doc.id)) {
      seenDocIds.add(item.doc.id);
      finalDocs.push(item.doc);
      if (finalDocs.length >= limit) break;
    }
  }

  return finalDocs;
}
