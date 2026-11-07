import { WordItem } from '../types';
import { DetailedTextbookLesson } from './newHsk1BookData';

export const NEW_HSK3_FULL_LESSONS: DetailedTextbookLesson[] = [
  // =========================================================================
  // LESSON 1: 我们去机场接你们
  // =========================================================================
  {
      "lessonNumber": 1,
      "titleHanzi": "我们去机场接你们",
      "titlePinyin": "Wǒmen qù jīchǎng jiē nǐmen",
      "titleVietnamese": "Chúng tôi đến sân bay đón các bạn",
      "pageStart": 1,
      "objectives": [
          "Nghe hiểu và dùng đa tầng định ngữ để miêu tả người hoặc sự vật.",
          "Dùng '看上去 / 看起来' để miêu tả ấn tượng ngoại quan.",
          "Nắm vững cách dùng phi nghi vấn của đại từ nghi vấn (哪儿, 什么, 谁)."
      ],
      "texts": [
          {
              "id": "hsk3-l1-t1",
              "title": "课文 1: 在家里 (Bài khóa 1: Ở nhà)",
              "context": "在家里，刘明和王一雪在沙发上聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết ngồi trên sofa trò chuyện).",
              "lines": [
                  {
                      "speaker": "刘明",
                      "hanzi": "这是杨同乐吗？他怎么跟白家月在一起？",
                      "pinyin": "Zhè shì Yáng Tónglè ma? Tā zěnme gēn Bái Jiāyuè zài yìqǐ?",
                      "vietnamese": "Đây là Dương Đồng Lạc à? Sao cậu ấy lại ở cùng Bạch Gia Nguyệt thế?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "他不是杨同乐，他叫李文，是白家月的好朋友。",
                      "pinyin": "Tā bú shì Yáng Tónglè, tā jiào Lǐ Wén, shì Bái Jiāyuè de hǎo péngyou.",
                      "vietnamese": "Cậu ấy không phải là Dương Đồng Lạc, cậu ấy tên là Lý Văn, là bạn thân của Bạch Gia Nguyệt."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "我还以为是同乐呢，他们看上去有点儿像。",
                      "pinyin": "Wǒ hái yǐwéi shì Tónglè ne, tāmen kàn shàngqu yǒudiǎnr xiàng.",
                      "vietnamese": "Tôi cứ tưởng là Đồng Lạc chứ, trông hai người họ có nét hơi giống nhau."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "是长得有点儿像，但是他比同乐高，身高有一米八。",
                      "pinyin": "Shì zhǎng de yǒudiǎnr xiàng, dànshì tā bǐ Tónglè gāo, shēngāo yǒu yì mǐ bā.",
                      "vietnamese": "Đúng là trông hơi giống, nhưng cậu ấy cao hơn Đồng Lạc, chiều cao một mét tám cơ."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "看起来也比同乐瘦一点儿。",
                      "pinyin": "Kàn qǐlai yě bǐ Tónglè shòu yìdiǎnr.",
                      "vietnamese": "Trông có vẻ cũng gầy hơn Đồng Lạc một chút."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "下个星期家月和李文要来北京，我去机场接他们。",
                      "pinyin": "Xià ge xīngqī Jiāyuè hé Lǐ Wén yào lái Běijīng, wǒ qù jīchǎng jiē tāmen.",
                      "vietnamese": "Tuần sau Gia Nguyệt và Lý Văn sẽ đến Bắc Kinh, chị sẽ ra sân bay đón các em ấy."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "他们哪天到北京？我跟你一起去机场接他们吧。",
                      "pinyin": "Tāmen nǎ tiān dào Běijīng? Wǒ gēn nǐ yìqǐ qù jīchǎng jiē tāmen ba.",
                      "vietnamese": "Họ ngày nào đến Bắc Kinh? Em đi cùng chị ra sân bay đón họ nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l1-t2",
              "title": "课文 2: 在行李领取处 (Bài khóa 2: Tại khu lấy hành lý)",
              "context": "在机场，李文和白家月在行李领取处。(Tại sân bay, Lý Văn và Bạch Gia Nguyệt ở khu nhận hành lý).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "我的行李怎么还没出来？是不是丢了？",
                      "pinyin": "Wǒ de xíngli zěnme hái méi chūlái? Shì bu shì diū le?",
                      "vietnamese": "Hành lý của em sao vẫn chưa ra nhỉ? Liệu có phải bị thất lạc rồi không?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "你的行李箱是什么样的？",
                      "pinyin": "Nǐ de xínglixiāng shì shénmeyàng de?",
                      "vietnamese": "Vali hành lý của em trông như thế nào?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "是一个黑色的箱子，上面写着我的名字和电话号码。",
                      "pinyin": "Shì yí ge hēisè de xiāngzi, shàngmiàn xiězhe wǒ de míngzi hé diànhuà hàomǎ.",
                      "vietnamese": "Là một chiếc vali màu đen, bên trên có viết tên và số điện thoại của em."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "我好像在哪儿看见过。是不是别人拿错了？",
                      "pinyin": "Wǒ hǎoxiàng zài nǎr kànjiàn guo. Shì bu shì biérén ná cuò le?",
                      "vietnamese": "Anh hình như từng nhìn thấy ở đâu đó rồi. Có khi nào người khác cầm nhầm không?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "我们快去找人问问吧，里面有不少重要的东西。",
                      "pinyin": "Wǒmen kuài qù zhǎo rén wènwen ba, lǐmiàn yǒu bù shǎo zhòngyào de dōngxi.",
                      "vietnamese": "Chúng ta mau đi tìm người hỏi xem sao, bên trong có không ít đồ đạc quan trọng."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "别着急，我们拿着护照和机票去服务台问问吧。",
                      "pinyin": "Bié zháojí, wǒmen názhe hùzhào hé jīpiào qù fúwùtái wènwen ba.",
                      "vietnamese": "Đừng lo, chúng ta cầm hộ chiếu và vé máy bay đến quầy dịch vụ hỏi xem nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l1-t3",
              "title": "课文 3: 在机场大厅 (Bài khóa 3: Tại sảnh đón sân bay)",
              "context": "在机场大厅，刘明和王一雪接机。(Tại sảnh sân bay, Lưu Minh và Vương Nhất Tuyết đón người).",
              "lines": [
                  {
                      "speaker": "刘明",
                      "hanzi": "飞机早就到了，你看见白家月他们了吗？",
                      "pinyin": "Fēijī zǎojiù dào le, nǐ kànjiàn Bái Jiāyuè tāmen le ma?",
                      "vietnamese": "Máy bay đã hạ cánh từ sớm rồi, chị đã nhìn thấy nhóm Bạch Gia Nguyệt chưa?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "还没呢，应该马上就出来了。",
                      "pinyin": "Hái méi ne, yīnggāi mǎshàng jiù chūlái le.",
                      "vietnamese": "Vẫn chưa thấy, chắc là sắp bước ra ngay rồi."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "我们站到中间去吧，这样他们容易看见我们。",
                      "pinyin": "Wǒmen zhàn dào zhōngjiān qù ba, zhèyàng tāmen róngyì kànjiàn wǒmen.",
                      "vietnamese": "Chúng ta đứng vào giữa đi, như thế họ sẽ dễ dàng nhìn thấy chúng ta hơn."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "你看，那个个子高高的是不是李文？",
                      "pinyin": "Nǐ kàn, nàge gèzi gāogāo de shì bu shì Lǐ Wén?",
                      "vietnamese": "Em nhìn kìa, người dáng cao cao kia có phải là Lý Văn không?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "哪个？是那个穿黑衣服短头发的年轻人吗？",
                      "pinyin": "Nǎge? Shì nàge chuān hēi yīfu duǎn tóufa de niánqīngrén ma?",
                      "vietnamese": "Người nào cơ? Có phải chàng thanh niên mặc áo đen tóc ngắn kia không?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "对，就是李文！你看，家月在他后边呢。",
                      "pinyin": "Duì, jiù shì Lǐ Wén! Nǐ kàn, Jiāyuè zài tā hòubian ne.",
                      "vietnamese": "Đúng rồi, chính là Lý Văn! Em nhìn xem, Gia Nguyệt đang ở ngay phía sau cậu ấy kìa."
                  }
              ]
          },
          {
              "id": "hsk3-l1-t4",
              "title": "课文 4: 在宾馆房间 (Bài khóa 4: Tại phòng khách sạn)",
              "context": "在宾馆房间，李文在写日记。(Trong phòng khách sạn, Lý Văn viết nhật ký).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "昨天我到了北京。路上虽然坐了十几个小时的飞机，但是跟家月坐在一起，觉得时间过得挺快的。",
                      "pinyin": "Zuótiān wǒ dào le Běijīng. Lùshang suīrán zuò le shí jǐ ge xiǎoshí de fēijī, dànshì gēn Jiāyuè zuò zài yìqǐ, juéde shíjiān guò de tǐng kuài de.",
                      "vietnamese": "Hôm qua tôi đã đến Bắc Kinh. Suốt dọc đường tuy phải ngồi máy bay hơn mười tiếng đồng hồ, nhưng vì ngồi cạnh Gia Nguyệt nên cảm thấy thời gian trôi qua khá nhanh."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "到了机场以后，家月发现她的箱子不见了，我就带她去服务台，帮她找回了行李箱。",
                      "pinyin": "Dào le jīchǎng yǐhòu, Jiāyuè fāxiàn tā de xiāngzi bú jiàn le, wǒ jiù dài tā qù fúwùtái, bāng tā zhǎohuí le xínglixiāng.",
                      "vietnamese": "Sau khi tới sân bay, Gia Nguyệt phát hiện chiếc vali của mình biến mất, tôi liền dẫn cô ấy đến quầy dịch vụ và giúp cô ấy tìm lại vali hành lý."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "出了机场的时候，已经晚上八点多了。一出门，我们就看见了王老师的姐姐，她看上去比照片上更年轻。",
                      "pinyin": "Chū le jīchǎng de shíhou, yǐjīng wǎnshang bā diǎn duō le. Yì chū mén, wǒmen jiù kànjiàn le Wáng lǎoshī de jiějie, tā kàn shàngqu bǐ zhàopiàn shang gèng niánqīng.",
                      "vietnamese": "Lúc ra khỏi sân bay thì đã hơn tám giờ tối. Vừa bước ra cửa, chúng tôi đã nhìn thấy chị gái của cô giáo Vương, chị ấy trông trẻ hơn cả trong ảnh."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "晚上，一雪带我们去了一家中国饭馆，菜非常好吃。",
                      "pinyin": "Wǎnshang, Yīxuě dài wǒmen qù le yì jiā Zhōngguó fànguǎn, cài fēicháng hǎochī.",
                      "vietnamese": "Buổi tối, Nhất Tuyết dẫn chúng tôi đến một nhà hàng Trung Quốc, các món ăn ngon tuyệt vời."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l1-g1",
              "title": "1. 固定短语“看上去/看起来” (Cụm cố định 'Trông có vẻ / Nhìn qua')",
              "explanation": "Dùng để diễn tả ấn tượng, nhận xét hoặc phán đoán của người nói dựa trên quan sát bề ngoài của người hoặc sự vật.",
              "examples": [
                  {
                      "hanzi": "他们看上去有点儿像。",
                      "pinyin": "Tāmen kàn shàngqu yǒudiǎnr xiàng.",
                      "vietnamese": "Họ trông có vẻ hơi giống nhau."
                  },
                  {
                      "hanzi": "这些菜看起来都很好吃。",
                      "pinyin": "Zhèxiē cài kàn qǐlai dōu hěn hǎochī.",
                      "vietnamese": "Những món ăn này trông có vẻ đều rất ngon."
                  },
                  {
                      "hanzi": "那个新来的老师看上去很年轻。",
                      "pinyin": "Nàge xīn lái de lǎoshī kàn shàngqu hěn niánqīng.",
                      "vietnamese": "Thầy giáo mới đến kia trông có vẻ rất trẻ."
                  }
              ]
          },
          {
              "id": "hsk3-l1-g2",
              "title": "2. 疑问代词的非疑问用法（1） (Cách dùng phi nghi vấn của đại từ nghi vấn - Biểu thị phiếm chỉ)",
              "explanation": "Đại từ nghi vấn (什么, 哪儿, 谁...) không dùng để hỏi mà dùng để chỉ một người hoặc sự vật không xác định hoặc bất kỳ ('ai đó, cái gì đó, nơi nào đó').",
              "examples": [
                  {
                      "hanzi": "我好像在哪儿看见过这个箱子。",
                      "pinyin": "Wǒ hǎoxiàng zài nǎr kànjiàn guo zhè ge xiāngzi.",
                      "vietnamese": "Tôi hình như từng nhìn thấy chiếc vali này ở đâu đó rồi."
                  },
                  {
                      "hanzi": "你想吃点儿什么吗？",
                      "pinyin": "Nǐ xiǎng chī diǎnr shénme ma?",
                      "vietnamese": "Bạn có muốn ăn chút gì đó không?"
                  },
                  {
                      "hanzi": "你去问问谁吧。",
                      "pinyin": "Nǐ qù wènwen shuí ba.",
                      "vietnamese": "Bạn đi hỏi ai đó xem sao đi."
                  }
              ]
          },
          {
              "id": "hsk3-l1-g3",
              "title": "3. 多项定语 (Đa tầng định ngữ)",
              "explanation": "Khi có nhiều định ngữ cùng bổ nghĩa cho một danh từ trung tâm ngữ, thứ tự thông thường là: Sở hữu/Chỉ định + Số lượng + Miêu tả (hình dáng, màu sắc, chất liệu) + Danh từ.",
              "examples": [
                  {
                      "hanzi": "李文是那个穿着黑衣服的短头发的年轻人。",
                      "pinyin": "Lǐ Wén shì nàge chuānzhe hēi yīfu de duǎn tóufa de niánqīngrén.",
                      "vietnamese": "Lý Văn là chàng thanh niên tóc ngắn mặc áo đen kia."
                  },
                  {
                      "hanzi": "那是他昨天买的一本很有趣的书。",
                      "pinyin": "Nà shì tā zuótiān mǎi de yì běn hěn yǒuqù de shū.",
                      "vietnamese": "Đó là cuốn sách rất thú vị mà hôm qua anh ấy đã mua."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l1-w1",
              "hanzi": "以为",
              "pinyin": "yǐ wéi",
              "hanViet": "Dĩ Vi",
              "vietnamese": "cứ ngỡ, cứ tưởng rằng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "以为",
              "exampleTranslation": "cứ ngỡ, cứ tưởng rằng",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w2",
              "hanzi": "像",
              "pinyin": "xiàng",
              "hanViet": "Tượng",
              "vietnamese": "giống như",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "像",
              "exampleTranslation": "giống như",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w3",
              "hanzi": "长",
              "pinyin": "zhǎng",
              "hanViet": "Trường",
              "vietnamese": "trưởng, lớn lên, trông (về tướng mạo)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "长",
              "exampleTranslation": "trưởng, lớn lên, trông (về tướng mạo)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w4",
              "hanzi": "身高",
              "pinyin": "shēn gāo",
              "hanViet": "Thân Cao",
              "vietnamese": "chiều cao cơ thể",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "身高",
              "exampleTranslation": "chiều cao cơ thể",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l1-w5",
              "hanzi": "米",
              "pinyin": "mǐ",
              "hanViet": "Mễ",
              "vietnamese": "mét (đơn vị đo)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "米",
              "exampleTranslation": "mét (đơn vị đo)",
              "tags": [
                  "Lượng từ"
              ]
          },
          {
              "id": "hsk3-l1-w6",
              "hanzi": "瘦",
              "pinyin": "shòu",
              "hanViet": "Sấu",
              "vietnamese": "gầy, ốm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "瘦",
              "exampleTranslation": "gầy, ốm",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l1-w7",
              "hanzi": "接",
              "pinyin": "jiē",
              "hanViet": "Tiếp",
              "vietnamese": "đón, nhận",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "接",
              "exampleTranslation": "đón, nhận",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w8",
              "hanzi": "行李",
              "pinyin": "xíng lǐ",
              "hanViet": "Hành Lí",
              "vietnamese": "hành lý",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "行李",
              "exampleTranslation": "hành lý",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l1-w9",
              "hanzi": "箱子",
              "pinyin": "xiāng zi",
              "hanViet": "Tương Tử",
              "vietnamese": "hòm, rương, vali",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "箱子",
              "exampleTranslation": "hòm, rương, vali",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l1-w10",
              "hanzi": "丢",
              "pinyin": "diū",
              "hanViet": "Đâu",
              "vietnamese": "mất, thất lạc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "丢",
              "exampleTranslation": "mất, thất lạc",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w11",
              "hanzi": "号码",
              "pinyin": "hào mǎ",
              "hanViet": "Hiệu Mã",
              "vietnamese": "con số, số hiệu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "号码",
              "exampleTranslation": "con số, số hiệu",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l1-w12",
              "hanzi": "好像",
              "pinyin": "hǎo xiàng",
              "hanViet": "Hảo Tượng",
              "vietnamese": "hình như, dường như",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "好像",
              "exampleTranslation": "hình như, dường như",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l1-w13",
              "hanzi": "重要",
              "pinyin": "zhòng yào",
              "hanViet": "Trọng Yếu",
              "vietnamese": "quan trọng, trọng yếu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "重要",
              "exampleTranslation": "quan trọng, trọng yếu",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l1-w14",
              "hanzi": "护照",
              "pinyin": "hù zhào",
              "hanViet": "Hộ Chiếu",
              "vietnamese": "hộ chiếu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "护照",
              "exampleTranslation": "hộ chiếu",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l1-w15",
              "hanzi": "早就",
              "pinyin": "zǎo jiù",
              "hanViet": "",
              "vietnamese": "từ sớm, đã sớm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "早就",
              "exampleTranslation": "từ sớm, đã sớm",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l1-w16",
              "hanzi": "应该",
              "pinyin": "yīng gāi",
              "hanViet": "Ứng Cai",
              "vietnamese": "nên, chắc hẳn phải",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "应该",
              "exampleTranslation": "nên, chắc hẳn phải",
              "tags": [
                  "Động từ năng nguyện"
              ]
          },
          {
              "id": "hsk3-l1-w17",
              "hanzi": "马上",
              "pinyin": "mǎ shàng",
              "hanViet": "Mã Thượng",
              "vietnamese": "ngay lập tức, tức thì",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "马上",
              "exampleTranslation": "ngay lập tức, tức thì",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l1-w18",
              "hanzi": "容易",
              "pinyin": "róng yì",
              "hanViet": "Dung Dịch",
              "vietnamese": "dễ dàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "容易",
              "exampleTranslation": "dễ dàng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l1-w19",
              "hanzi": "短",
              "pinyin": "duǎn",
              "hanViet": "Đoản",
              "vietnamese": "ngắn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "短",
              "exampleTranslation": "ngắn",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l1-w20",
              "hanzi": "头发",
              "pinyin": "tóu fà",
              "hanViet": "Đầu Phát",
              "vietnamese": "tóc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "头发",
              "exampleTranslation": "tóc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l1-w21",
              "hanzi": "穿",
              "pinyin": "chuān",
              "hanViet": "Xuyên",
              "vietnamese": "mặc, đi (giày dép)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "穿",
              "exampleTranslation": "mặc, đi (giày dép)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w22",
              "hanzi": "发现",
              "pinyin": "fā xiàn",
              "hanViet": "Phát Hiện",
              "vietnamese": "phát hiện, nhận ra",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "发现",
              "exampleTranslation": "phát hiện, nhận ra",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l1-w23",
              "hanzi": "帮助",
              "pinyin": "bāng zhù",
              "hanViet": "Bang Trợ",
              "vietnamese": "giúp đỡ, tương trợ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "帮助",
              "exampleTranslation": "giúp đỡ, tương trợ",
              "tags": [
                  "Động từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l1-ex1",
              "type": "multiple_choice",
              "question": "Điền cụm từ phù hợp: '这个西瓜很大，______ 很好吃。'",
              "options": [
                  "A. 看上去",
                  "B. 跑起来",
                  "C. 站起来",
                  "D. 听上去"
              ],
              "correctAnswer": "A. 看上去",
              "explanation": "看上去 / 看起来 dùng để miêu tả ấn tượng ngoại quan trực tiếp bằng mắt nhìn.",
              "grammarFocus": "Cụm '看上去 / 看起来'"
          },
          {
              "id": "hsk3-l1-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '我的行李箱上面写着我的名字和电话 ______ (số)。'",
              "options": [
                  "号码",
                  "护照",
                  "机票",
                  "身高"
              ],
              "correctAnswer": "号码",
              "explanation": "电话号码 (diànhuà hàomǎ): số điện thoại.",
              "grammarFocus": "Từ vựng Bài 1"
          },
          {
              "id": "hsk3-l1-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "他们",
              "看起来",
              "像",
              "有点儿",
              "都"
              ],
              "question": "Sắp xếp câu: '他们 / 看起来 / 像 / 有点儿 / 都'",
              "correctAnswer": "他们看起来都有点儿像。",
              "explanation": "Cấu trúc: Chủ ngữ + 看起来 + 都 + phó từ chỉ mức độ + tính từ/động từ.",
              "grammarFocus": "Ngữ pháp 看起来"
          },
          {
              "id": "hsk3-l1-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào chỗ trống: '李文是那个穿着黑衣服、留着 ______ 头发的年轻人。'",
              "options": [
                  "A. 短",
                  "B. 瘦",
                  "C. 容易",
                  "D. 重要"
              ],
              "correctAnswer": "A. 短",
              "explanation": "短头发 (duǎn tóufa): tóc ngắn. Phù hợp để miêu tả đặc điểm ngoại hình.",
              "grammarFocus": "Đa tầng định ngữ"
          }
      ],
      "cultureBonus": {
          "title": "💡 Văn hóa tiếp đón tại sân bay (中国接机文化)",
          "summary": "Người Trung Quốc rất coi trọng lễ nghi đón khách phương xa (接机/接风洗尘).",
          "content": "Trong văn hóa Trung Hoa, khi người thân hoặc bạn bè từ xa tới, bạn bè hoặc chủ nhà thường đích thân ra tận sân bay hoặc nhà ga để đón (接机/接站), sau đó mời một bữa cơm thân mật gọi là '接风' (tẩy trần đón gió) để xóa tan mệt mỏi đường trường."
      }
  },
  // =========================================================================
  // LESSON 2: 你们想吃什么就点什么
  // =========================================================================
  {
      "lessonNumber": 2,
      "titleHanzi": "你们想吃什么就点什么",
      "titlePinyin": "Nǐmen xiǎng chī shénme jiù diǎn shénme",
      "titleVietnamese": "Các bạn muốn ăn gì thì gọi nấy",
      "pageStart": 10,
      "objectives": [
          "Dùng câu phức liên kết '又……又……' diễn tả hai đặc điểm song hành.",
          "Sử dụng đại từ nghi vấn biểu thị ý phi nghi vấn linh hoạt.",
          "Biết cách gọi món ăn và diễn đạt sở thích ẩm thực Trung Hoa."
      ],
      "texts": [
          {
              "id": "hsk3-l2-t1",
              "title": "课文 1: 在饭馆点菜 (Bài khóa 1: Gọi món tại nhà hàng)",
              "context": "在饭馆，王一雪、刘明、白家月和李文在点菜。(Tại nhà hàng, Vương Nhất Tuyết, Lưu Minh, Bạch Gia Nguyệt và Lý Văn gọi món).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "家月、李文，你们看看菜单，想吃什么？",
                      "pinyin": "Jiāyuè, Lǐ Wén, nǐmen kànkan càidān, xiǎng chī shénme?",
                      "vietnamese": "Gia Nguyệt, Lý Văn, hai em xem thực đơn đi, muốn ăn món gì nào?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "谢谢一雪。我什么都行，你们点吧。",
                      "pinyin": "Xièxie Yīxuě. Wǒ shénme dōu xíng, nǐmen diǎn ba.",
                      "vietnamese": "Cảm ơn chị Nhất Tuyết. Em ăn gì cũng được, mọi người gọi đi ạ."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "坐了这么长时间飞机，我现在又饿又渴。",
                      "pinyin": "Zuò le zhème cháng shíjiān fēijī, wǒ xiànzài yòu è yòu kě.",
                      "vietnamese": "Ngồi máy bay lâu như thế, giờ em vừa đói vừa khát."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "那就多点几个菜，别客气。想喝点儿什么？",
                      "pinyin": "Nà jiù duō diǎn jǐ ge cài, bié kèqi. Xiǎng hē diǎnr shénme?",
                      "vietnamese": "Vậy thì gọi nhiều món vào, đừng khách sáo nhé. Em muốn uống gì nào?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "我很久没喝过中国茶、吃过饺子了。我想喝绿茶，吃饺子，可以吗？",
                      "pinyin": "Wǒ hěn jiǔ méi hē guo Zhōngguó chá, chī guo jiǎozi le. Wǒ xiǎng hē lǜchá, chī jiǎozi, kěyǐ ma?",
                      "vietnamese": "Đã lâu lắm rồi em chưa được uống trà Trung Quốc và ăn sủi cảo. Em muốn uống trà xanh và ăn sủi cảo, có được không ạ?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "没问题。你们再看看，还想吃什么？",
                      "pinyin": "Méi wèntí. Nǐmen zài kànkan, hái xiǎng chī shénme?",
                      "vietnamese": "Không vấn đề gì cả. Hai em xem thêm đi, còn muốn ăn món gì nữa không?"
                  }
              ]
          },
          {
              "id": "hsk3-l2-t2",
              "title": "课文 2: 用餐交流 (Bài khóa 2: Giao tiếp trong bữa ăn)",
              "context": "在饭馆，王一雪、刘明、白家月和李文一起吃饭。(Tại nhà hàng, mọi người cùng nhau dùng bữa).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "服务员，再给我们拿一双筷子、一个勺子和一个碗。",
                      "pinyin": "Fúwùyuán, zài gěi wǒmen ná yì shuāng kuàizi, yí ge sháozi hé yí ge wǎn.",
                      "vietnamese": "Phục vụ ơi, lấy thêm cho chúng tôi một đôi đũa, một chiếc thìa và một cái bát nhé."
                  },
                  {
                      "speaker": "服务员",
                      "hanzi": "好的，请稍等，马上给您拿来。",
                      "pinyin": "Hǎo de, qǐng shāoděng, mǎshàng gěi nín nálái.",
                      "vietnamese": "Dạ vâng, xin quý khách đợi một lát, em sẽ mang ra ngay ạ."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "这儿的服务员又热情又周到，菜也做得特别好吃。你们快尝尝！",
                      "pinyin": "Zhèr de fúwùyuán yòu rèqíng yòu zhōudào, cài yě zuò de tèbié hǎochī. Nǐmen kuài chángchang!",
                      "vietnamese": "Nhân viên ở đây vừa nhiệt tình vừa chu đáo, món ăn nấu cũng cực kỳ ngon. Các em nếm thử nhanh đi!"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "每个菜都很好吃，一雪，你点的菜太棒了！",
                      "pinyin": "Měi ge cài dōu hěn hǎochī, Yīxuě, nǐ diǎn de cài tài bàng le!",
                      "vietnamese": "Món nào cũng ngon hết, chị Nhất Tuyết, chị gọi món đỉnh thật đấy!"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "这家饭馆的菜又便宜又好吃，我们经常来，服务员都认识我们了。",
                      "pinyin": "Zhè jiā fànguǎn de cài yòu piányi yòu hǎochī, wǒmen jīngcháng lái, fúwùyuán dōu rènshi wǒmen le.",
                      "vietnamese": "Món của nhà hàng này vừa rẻ vừa ngon, bọn chị thường xuyên tới đây, nhân viên phục vụ đều quen mặt hết rồi."
                  },
                  {
                      "speaker": "服务员",
                      "hanzi": "王小姐，您是我们的老顾客了，今天送你们一盘水果，请慢用！",
                      "pinyin": "Wáng xiǎojiě, nín shì wǒmen de lǎo gùkè le, jīntiān sòng nǐmen yì pán shuǐguǒ, qǐng mànyòng!",
                      "vietnamese": "Chị Vương, chị là khách quen của quán em rồi, hôm nay quán tặng bàn mình một đĩa hoa quả, chúc quý khách ngon miệng ạ!"
                  }
              ]
          },
          {
              "id": "hsk3-l2-t3",
              "title": "课文 3: 外卖的便利 (Bài khóa 3: Tiện ích của đồ ăn mang về)",
              "context": "在饭馆，王一雪、刘明、白家月和李文继续边吃边聊。(Tại nhà hàng, mọi người tiếp tục vừa ăn vừa trò chuyện).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "这个鸡肉饭太好吃了！我以后还要来吃一次。",
                      "pinyin": "Zhè ge jīròufàn tài hǎochī le! Wǒ yǐhòu hái yào lái chī yí cì.",
                      "vietnamese": "Món cơm gà này ngon quá! Sau này em nhất định phải đến ăn thêm lần nữa."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "你可以把这个菜单带走，看看下次还想吃什么。",
                      "pinyin": "Nǐ kěyǐ bǎ zhè ge càidān dàizǒu, kànkan xià cì hái xiǎng chī shénme.",
                      "vietnamese": "Em có thể mang thực đơn này về, xem lần sau còn muốn ăn món gì."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "不用拿菜单，在手机上就能看，还能点外卖呢。",
                      "pinyin": "Bú yòng ná càidān, zài shǒujī shang jiù néng kàn, hái néng diǎn wàimài ne.",
                      "vietnamese": "Không cần cầm thực đơn đâu, xem trên điện thoại là được, lại còn đặt đồ ăn giao tận nơi nữa đấy."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "这儿也能送外卖？",
                      "pinyin": "Zhèr yě néng sòng wàimài?",
                      "vietnamese": "Ở đây cũng giao hàng tận nơi được ạ?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "对啊！现在很多饭馆都可以送外卖，你们想吃什么就点什么。",
                      "pinyin": "Duì a! Xiànzài hěn duō fànguǎn dōu kěyǐ sòng wàimài, nǐmen xiǎng chī shénme jiù diǎn shénme.",
                      "vietnamese": "Đúng thế! Bây giờ rất nhiều nhà hàng đều có dịch vụ giao tận nơi, các em thích ăn gì thì gọi nấy."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "那太方便了！",
                      "pinyin": "Nà tài fāngbiàn le!",
                      "vietnamese": "Thế thì thuận tiện quá rồi!"
                  }
              ]
          },
          {
              "id": "hsk3-l2-t4",
              "title": "课文 4: 李文的留学日记 (Bài khóa 4: Nhật ký du học của Lý Văn)",
              "context": "在李文家，李文在写日记。(Tại nhà mình, Lý Văn viết nhật ký).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "在国外的几年里，我很少自己做饭。早上一般吃一片面包，有时吃一块蛋糕，喝一杯咖啡。中午和晚上都在外边吃。",
                      "pinyin": "Zài guówài de jǐ nián lǐ, wǒ hěn shǎo zìjǐ zuòfàn. Zǎoshang yìbān chī yí piàn miànbāo, yǒushí chī yí kuài dàngāo, hē yì bēi kāfēi. Zhōngwǔ hé wǎnshang dōu zài wàibian chī.",
                      "vietnamese": "Trong mấy năm ở nước ngoài, tôi rất ít khi tự nấu ăn. Buổi sáng thường ăn một lát bánh mì, đôi khi ăn một miếng bánh ngọt, uống một tách cà phê. Buổi trưa và tối đều ăn ở bên ngoài."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "快要考试的时候，又忙又累，没时间去外边吃，家里又什么都没有，我常常连着几天只吃方便面。",
                      "pinyin": "Kuài yào kǎoshì de shíhou, yòu máng yòu lèi, méi shíjiān qù wàibian chī, jiālǐ yòu shénme dōu méiyǒu, wǒ chángcháng liánzhe jǐ tiān zhǐ chī fāngbiànmiàn.",
                      "vietnamese": "Mỗi khi sắp tới kỳ thi, vừa bận vừa mệt, không có thời gian ra ngoài ăn mà ở nhà cũng chẳng có gì, tôi thường xuyên ăn mì tôm liền mấy ngày."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "现在回到中国，每天都能吃到妈妈做的饭，我觉得特别幸福！",
                      "pinyin": "Xiànzài huídào Zhōngguó, měitiān dōu néng chīdào māma zuò de fàn, wǒ juéde tèbié xìngfú!",
                      "vietnamese": "Bây giờ trở về Trung Quốc, mỗi ngày đều được ăn cơm mẹ nấu, tôi cảm thấy vô cùng hạnh phúc!"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "虽然只是几个简单的菜，但我都爱吃，因为世界上最香的饭菜，就是妈妈做的味道。",
                      "pinyin": "Suīrán zhǐ shì jǐ ge jiǎndān de cài, dàn wǒ dōu ài chī, yīnwèi shìjiè shang zuì xiāng de fàncài, jiù shì māma zuò de wèidao.",
                      "vietnamese": "Dẫu chỉ là vài món ăn giản dị, nhưng món nào tôi cũng thích ăn, bởi vì món ăn thơm ngon nhất trên đời chính là hương vị do mẹ nấu."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l2-g1",
              "title": "1. 并列复句“又……又……” (Câu phức liên kết 'Vừa... vừa...')",
              "explanation": "Dùng để biểu thị hai trạng thái, tính chất hoặc hành động tồn tại đồng thời ở cùng một chủ thể. Hai từ đi sau thường cùng mang sắc thái tích cực hoặc tiêu cực.",
              "examples": [
                  {
                      "hanzi": "坐了这么长时间飞机，我现在又饿又渴。",
                      "pinyin": "Zuò le zhème cháng shíjiān fēijī, wǒ xiànzài yòu è yòu kě.",
                      "vietnamese": "Ngồi máy bay lâu như thế, giờ tôi vừa đói vừa khát."
                  },
                  {
                      "hanzi": "这儿的服务员又热情又周到。",
                      "pinyin": "Zhèr de fúwùyuán yòu rèqíng yòu zhōudào.",
                      "vietnamese": "Nhân viên phục vụ ở đây vừa nhiệt tình vừa chu đáo."
                  },
                  {
                      "hanzi": "这家饭馆的菜又便宜又好吃。",
                      "pinyin": "Zhè jiā fànguǎn de cài yòu piányi yòu hǎochī.",
                      "vietnamese": "Món ăn quán này vừa rẻ vừa ngon."
                  }
              ]
          },
          {
              "id": "hsk3-l2-g2",
              "title": "2. 疑问代词的非疑问用法（2）—— 全指 (Biểu thị toàn chỉ: Đại từ + 也/都)",
              "explanation": "Đại từ nghi vấn (什么, 谁, 哪儿) kết hợp với 也/都 biểu thị toàn bộ không ngoại lệ ('cái gì cũng...', 'ai cũng...', 'ở đâu cũng...').",
              "examples": [
                  {
                      "hanzi": "我什么都行，你们点吧。",
                      "pinyin": "Wǒ shénme dōu xíng, nǐmen diǎn ba.",
                      "vietnamese": "Tôi cái gì cũng được, mọi người gọi đi."
                  },
                  {
                      "hanzi": "这儿谁都知道这件事情。",
                      "pinyin": "Zhèr shuí dōu zhīdào zhè jiàn shìqing.",
                      "vietnamese": "Ở đây ai cũng biết chuyện này."
                  },
                  {
                      "hanzi": "家里什么吃的都没有。",
                      "pinyin": "Jiālǐ shénme chī de dōu méiyǒu.",
                      "vietnamese": "Trong nhà chẳng có bất cứ đồ ăn gì."
                  }
              ]
          },
          {
              "id": "hsk3-l2-g3",
              "title": "3. 疑问代词的非疑问用法（3）—— 配合使用 (Cấu trúc tương ứng: ...gì thì...nấy)",
              "explanation": "Hai đại từ nghi vấn giống nhau xuất hiện trong hai phân câu, phân câu sau dùng '就' liên kết, biểu thị vế sau phụ thuộc hoàn toàn vào vế trước.",
              "examples": [
                  {
                      "hanzi": "你们想吃什么就点什么。",
                      "pinyin": "Nǐmen xiǎng chī shénme jiù diǎn shénme.",
                      "vietnamese": "Các bạn muốn ăn gì thì gọi nấy."
                  },
                  {
                      "hanzi": "哪儿好玩儿我们就去哪儿。",
                      "pinyin": "Nǎr hǎowánr wǒmen jiù qù nǎr.",
                      "vietnamese": "Chỗ nào vui thì chúng ta đi chỗ đó."
                  },
                  {
                      "hanzi": "谁想去谁就去。",
                      "pinyin": "Shuí xiǎng qù shuí jiù qù.",
                      "vietnamese": "Ai muốn đi thì người đó đi."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l2-w1",
              "hanzi": "菜单",
              "pinyin": "cài dān",
              "hanViet": "Thái Đan",
              "vietnamese": "thực đơn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "菜单",
              "exampleTranslation": "thực đơn",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w2",
              "hanzi": "行",
              "pinyin": "xíng",
              "hanViet": "Hành",
              "vietnamese": "được, ổn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "行",
              "exampleTranslation": "được, ổn",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l2-w3",
              "hanzi": "渴",
              "pinyin": "kě",
              "hanViet": "Khát",
              "vietnamese": "khát nước",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "渴",
              "exampleTranslation": "khát nước",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w4",
              "hanzi": "饿",
              "pinyin": "è",
              "hanViet": "Ngạ",
              "vietnamese": "đói bụng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "饿",
              "exampleTranslation": "đói bụng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w5",
              "hanzi": "客气",
              "pinyin": "kè qì",
              "hanViet": "Khách Khí",
              "vietnamese": "khách sáo, lịch sự",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "客气",
              "exampleTranslation": "khách sáo, lịch sự",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w6",
              "hanzi": "绿茶",
              "pinyin": "lǜ chá",
              "hanViet": "Lục Trà",
              "vietnamese": "trà xanh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "绿茶",
              "exampleTranslation": "trà xanh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w7",
              "hanzi": "筷子",
              "pinyin": "kuài zi",
              "hanViet": "Khoái Tử",
              "vietnamese": "đôi đũa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "筷子",
              "exampleTranslation": "đôi đũa",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w8",
              "hanzi": "勺子",
              "pinyin": "sháo zi",
              "hanViet": "Chước Tử",
              "vietnamese": "cái thìa, muỗng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "勺子",
              "exampleTranslation": "cái thìa, muỗng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w9",
              "hanzi": "碗",
              "pinyin": "wǎn",
              "hanViet": "Oản",
              "vietnamese": "cái bát, chén",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "碗",
              "exampleTranslation": "cái bát, chén",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w10",
              "hanzi": "稍",
              "pinyin": "shāo",
              "hanViet": "Sảo",
              "vietnamese": "hơi, một chút",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "稍",
              "exampleTranslation": "hơi, một chút",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l2-w11",
              "hanzi": "热情",
              "pinyin": "rè qíng",
              "hanViet": "Nhiệt Tình",
              "vietnamese": "nhiệt tình",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "热情",
              "exampleTranslation": "nhiệt tình",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w12",
              "hanzi": "周到",
              "pinyin": "zhōu dào",
              "hanViet": "Chu Đáo",
              "vietnamese": "chu đáo, tận tình",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "周到",
              "exampleTranslation": "chu đáo, tận tình",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w13",
              "hanzi": "尝",
              "pinyin": "cháng",
              "hanViet": "Thường",
              "vietnamese": "nếm thử",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "尝",
              "exampleTranslation": "nếm thử",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l2-w14",
              "hanzi": "棒",
              "pinyin": "bàng",
              "hanViet": "Bổng",
              "vietnamese": "tuyệt vời, giỏi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "棒",
              "exampleTranslation": "tuyệt vời, giỏi",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w15",
              "hanzi": "便宜",
              "pinyin": "pián yi",
              "hanViet": "Tiện Nghi",
              "vietnamese": "rẻ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "便宜",
              "exampleTranslation": "rẻ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w16",
              "hanzi": "盘",
              "pinyin": "pán",
              "hanViet": "Bàn",
              "vietnamese": "đĩa (đựng đồ ăn)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "盘",
              "exampleTranslation": "đĩa (đựng đồ ăn)",
              "tags": [
                  "Lượng từ"
              ]
          },
          {
              "id": "hsk3-l2-w17",
              "hanzi": "水果",
              "pinyin": "shuǐ guǒ",
              "hanViet": "Thủy Quả",
              "vietnamese": "trái cây, hoa quả",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "水果",
              "exampleTranslation": "trái cây, hoa quả",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w18",
              "hanzi": "鸡肉",
              "pinyin": "jī ròu",
              "hanViet": "",
              "vietnamese": "thịt gà",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "鸡肉",
              "exampleTranslation": "thịt gà",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w19",
              "hanzi": "外卖",
              "pinyin": "wài mài",
              "hanViet": "Ngoại Mại",
              "vietnamese": "đồ ăn mang về, giao tận nơi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "外卖",
              "exampleTranslation": "đồ ăn mang về, giao tận nơi",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w20",
              "hanzi": "方便",
              "pinyin": "fāng biàn",
              "hanViet": "Phương Tiện",
              "vietnamese": "thuận tiện, tiện lợi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "方便",
              "exampleTranslation": "thuận tiện, tiện lợi",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w21",
              "hanzi": "面包",
              "pinyin": "miàn bāo",
              "hanViet": "Diện Bao",
              "vietnamese": "bánh mì",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "面包",
              "exampleTranslation": "bánh mì",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w22",
              "hanzi": "蛋糕",
              "pinyin": "dàn gāo",
              "hanViet": "Đản Cao",
              "vietnamese": "bánh ngọt, bánh gato",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "蛋糕",
              "exampleTranslation": "bánh ngọt, bánh gato",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w23",
              "hanzi": "咖啡",
              "pinyin": "kā fēi",
              "hanViet": "Già Phê",
              "vietnamese": "cà phê",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "咖啡",
              "exampleTranslation": "cà phê",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w24",
              "hanzi": "考试",
              "pinyin": "kǎo shì",
              "hanViet": "Khảo Thí",
              "vietnamese": "thi cử, kỳ thi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "考试",
              "exampleTranslation": "thi cử, kỳ thi",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l2-w25",
              "hanzi": "累",
              "pinyin": "lèi",
              "hanViet": "Luy",
              "vietnamese": "mệt mỏi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "累",
              "exampleTranslation": "mệt mỏi",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w26",
              "hanzi": "方便面",
              "pinyin": "fāng biàn miàn",
              "hanViet": "Phương Tiện Diện",
              "vietnamese": "mì ăn liền, mì tôm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "方便面",
              "exampleTranslation": "mì ăn liền, mì tôm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l2-w27",
              "hanzi": "幸福",
              "pinyin": "xìng fú",
              "hanViet": "Hạnh Phước",
              "vietnamese": "hạnh phúc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "幸福",
              "exampleTranslation": "hạnh phúc",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l2-w28",
              "hanzi": "味道",
              "pinyin": "wèi dào",
              "hanViet": "Vị Đạo",
              "vietnamese": "mùi vị, hương vị",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "味道",
              "exampleTranslation": "mùi vị, hương vị",
              "tags": [
                  "Danh từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l2-ex1",
              "type": "multiple_choice",
              "question": "Chọn cặp liên từ điền vào chỗ trống: '跑了半天步，我现在 ______ 累 ______ 渴。'",
              "options": [
                  "A. 又……又……",
                  "B. 虽然……但是……",
                  "C. 因为……所以……",
                  "D. 不但……而且……"
              ],
              "correctAnswer": "A. 又……又……",
              "explanation": "Cấu trúc '又……又……' diễn tả hai trạng thái cùng tồn tại đồng thời.",
              "grammarFocus": "Liên từ 又……又……"
          },
          {
              "id": "hsk3-l2-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '服务员，请再给我们拿一双 ______ (đũa)。'",
              "options": [
                  "筷子",
                  "勺子",
                  "菜单",
                  "盘子"
              ],
              "correctAnswer": "筷子",
              "explanation": "筷子 (kuàizi): đôi đũa. Lượng từ đi kèm là 双 (shuāng).",
              "grammarFocus": "Từ vựng Bài 2"
          },
          {
              "id": "hsk3-l2-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "想吃什么",
              "你们",
              "就点什么",
              "吧"
              ],
              "question": "Sắp xếp câu: '想吃什么 / 你们 / 就点什么 / 吧'",
              "correctAnswer": "你们想吃什么就点什么吧。",
              "explanation": "Cấu trúc tương ứng: Đại từ nghi vấn + 就 + đại từ nghi vấn.",
              "grammarFocus": "Đại từ nghi vấn tương ứng"
          },
          {
              "id": "hsk3-l2-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '世界上最美味的饭菜，就是妈妈做的 ______。'",
              "options": [
                  "A. 味道",
                  "B. 速度",
                  "C. 数量",
                  "D. 价格"
              ],
              "correctAnswer": "A. 味道",
              "explanation": "妈妈做的味道: hương vị mẹ nấu.",
              "grammarFocus": "Từ vựng Bài 2"
          }
      ],
      "cultureBonus": {
          "title": "🥟 Văn hóa gọi món và ẩm thực Trung Hoa (中国点菜文化)",
          "summary": "Người Trung Quốc gọi món thường chú trọng cân đối nóng-lạnh, mặn-chay và chia sẻ món ăn.",
          "content": "Trong bữa ăn của người Trung Quốc, các món ăn thường được đặt ở giữa bàn tròn để mọi người cùng thưởng thức chung. Khi gọi món, chủ nhà thường cân đối giữa món nguội (凉菜), món xào nấu nóng (热菜), canh (汤) và món chính (主食)."
      }
  },
  // =========================================================================
  // LESSON 3: 这个小区挺好的
  // =========================================================================
  {
      "lessonNumber": 3,
      "titleHanzi": "这个小区挺好的",
      "titlePinyin": "Zhège xiǎoqū tǐng hǎo de",
      "titleVietnamese": "Khu phố này khá tốt",
      "pageStart": 19,
      "objectives": [
          "Dùng phó từ mức độ '挺……的' để biểu thị mức độ khá cao.",
          "Vận dụng bổ ngữ mức độ miêu tả trạng thái môi trường sống.",
          "Phân biệt rõ cách dùng và sắc thái thời gian của '就' và '才'."
      ],
      "texts": [
          {
              "id": "hsk3-l3-t1",
              "title": "课文 1: 商量租房 (Bài khóa 1: Bàn bạc thuê nhà)",
              "context": "在家里，刘明和王一雪在聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "小雪的初中离家有点儿远，我们换个离学校近点儿的地方住吧。",
                      "pinyin": "Xiǎoxuě de chūzhōng lí jiā yǒudiǎnr yuǎn, wǒmen huàn ge lí xuéxiào jìn diǎnr de dìfang zhù ba.",
                      "vietnamese": "Trường cấp hai của Tiểu Tuyết cách nhà hơi xa, chúng ta đổi sang chỗ nào gần trường hơn một chút để ở đi."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "行，我在网上查查。你看这个小区怎么样？",
                      "pinyin": "Xíng, wǒ zài wǎngshang chácha. Nǐ kàn zhè ge xiǎoqū zěnmeyàng?",
                      "vietnamese": "Được chứ, để anh tra trên mạng xem. Em xem khu chung cư này thế nào?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "周围环境挺好的，离地铁站也不远。",
                      "pinyin": "Zhōuwéi huánjìng tǐng hǎo de, lí dìtiězhàn yě bù yuǎn.",
                      "vietnamese": "Môi trường xung quanh khá tốt, cách ga tàu điện ngầm cũng không xa."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "房间里面也不错，空调和洗衣机都是新的。",
                      "pinyin": "Fángjiān lǐmiàn yě búcuò, kōngtiáo hé xǐyījī dōu shì xīn de.",
                      "vietnamese": "Bên trong căn hộ cũng rất ổn, điều hòa và máy giặt đều là đồ mới."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "好是好，但是我不想住一楼。",
                      "pinyin": "Hǎo shì hǎo, dànshì wǒ bù xiǎng zhù yī lóu.",
                      "vietnamese": "Tốt thì tốt thật, nhưng em lại không muốn ở tầng một."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "这个一楼带个小花园呢，我们还是去看看吧。",
                      "pinyin": "Zhè ge yī lóu dài ge xiǎo huāyuán ne, wǒmen háishì qù kànkan ba.",
                      "vietnamese": "Căn tầng một này có kèm cả một khu vườn nhỏ cơ đấy, chúng ta cứ qua xem thử xem sao."
                  }
              ]
          },
          {
              "id": "hsk3-l3-t2",
              "title": "课文 2: 收拾新家 (Bài khóa 2: Thu dọn nhà mới)",
              "context": "在新家，王一雪在收拾房间，刘明进来了。(Tại nhà mới, Vương Nhất Tuyết dọn dẹp, Lưu Minh bước vào).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "今天早上我进来的时候，灯还亮着呢。",
                      "pinyin": "Jīntiān zǎoshang wǒ jìnlái de shíhou, dēng hái liàngzhe ne.",
                      "vietnamese": "Sáng nay lúc em vào nhà, đèn vẫn còn đang sáng đấy."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "这几天太忙了，我出门的时候可能忘关了。",
                      "pinyin": "Zhè jǐ tiān tài máng le, wǒ chū mén de shíhou kěnéng wàng guān le.",
                      "vietnamese": "Mấy hôm nay bận quá, lúc anh ra khỏi cửa có lẽ đã quên tắt."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "冰箱也不工作了，买的菜往哪儿放啊？",
                      "pinyin": "Bīngxiāng yě bù gōngzuò le, mǎi de cài wǎng nǎr fàng a?",
                      "vietnamese": "Tủ lạnh cũng không chạy nữa, đồ ăn mua về biết để vào đâu bây giờ?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "不可能吧？冰箱是刚买的，我来看看。",
                      "pinyin": "Bù kěnéng ba? Bīngxiāng shì gāng mǎi de, wǒ lái kànkan.",
                      "vietnamese": "Không thể nào chứ? Tủ lạnh mới mua mà, để anh xem thử xem."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "洗衣机也坏了吗？",
                      "pinyin": "Xǐyījī yě huài le ma?",
                      "vietnamese": "Máy giặt cũng hỏng rồi à?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "没坏，但是卫生间还没打扫干净，先别洗衣服。",
                      "pinyin": "Méi huài, dànshì wèishēngjiān hái méi dǎsǎo gānjìng, xiān bié xǐ yīfu.",
                      "vietnamese": "Chưa hỏng, nhưng nhà vệ sinh vẫn chưa dọn dẹp sạch sẽ, khoan hãy giặt quần áo đã."
                  }
              ]
          },
          {
              "id": "hsk3-l3-t3",
              "title": "课文 3: 打算办卡 (Bài khóa 3: Dự định làm thẻ ngân hàng)",
              "context": "在家里，刘明和王一雪在客厅聊天儿。(Ở nhà, Lưu Minh và Vương Nhất Tuyết trò chuyện tại phòng khách).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "这个月我们花了不少钱，办张信用卡吧。",
                      "pinyin": "Zhè ge yuè wǒmen huā le bù shǎo qián, bàn zhāng xìnyòngkǎ ba.",
                      "vietnamese": "Tháng này chúng ta tiêu tốn không ít tiền, hay là làm một chiếc thẻ tín dụng đi."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "好啊，你想办哪家银行的？",
                      "pinyin": "Hǎo a, nǐ xiǎng bàn nǎ jiā yínháng de?",
                      "vietnamese": "Được chứ, em muốn làm của ngân hàng nào?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "中国银行的吧，听说用信用卡买东西有打折。",
                      "pinyin": "Zhōngguó Yínháng de ba, tīngshuō yòng xìnyòngkǎ mǎi dōngxi yǒu dǎzhé.",
                      "vietnamese": "Của Ngân hàng Trung Quốc đi, nghe nói dùng thẻ tín dụng mua đồ được giảm giá đấy."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "你打算什么时候去办？",
                      "pinyin": "Nǐ dǎsuàn shénme shíhou qù bàn?",
                      "vietnamese": "Em định khi nào đi làm thẻ?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "我想今天下午就去，你陪我一起去吧。",
                      "pinyin": "Wǒ xiǎng jīntiān xiàwǔ jiù qù, nǐ péi wǒ yìqǐ qù ba.",
                      "vietnamese": "Em muốn chiều nay đi luôn, anh đi cùng em nhé."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "今天下午我得去开会，明天下午我才有时间。",
                      "pinyin": "Jīntiān xiàwǔ wǒ děi qù kāihuì, míngtiān xiàwǔ wǒ cái yǒu shíjiān.",
                      "vietnamese": "Chiều nay anh phải đi họp mất rồi, chiều mai anh mới có thời gian."
                  }
              ]
          },
          {
              "id": "hsk3-l3-t4",
              "title": "课文 4: 搬家计划 (Bài khóa 4: Kế hoạch chuyển nhà)",
              "context": "在家里，刘明和王一雪讨论搬家计划。(Ở nhà, bàn kế hoạch chuyển dọn nhà cửa).",
              "lines": [
                  {
                      "speaker": "刘明",
                      "hanzi": "我们下周六搬家怎么样？",
                      "pinyin": "Wǒmen xià zhōuliù bānjiā zěnmeyàng?",
                      "vietnamese": "Thứ Bảy tuần sau chúng ta chuyển nhà thế nào?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "下周六有点儿急吧？很多东西还没收拾好呢。",
                      "pinyin": "Xià zhōuliù yǒudiǎnr jí ba? Hěn duō dōngxi hái méi shōushi hǎo ne.",
                      "vietnamese": "Thứ Bảy tuần sau có gấp quá không anh? Nhiều đồ đạc vẫn chưa thu dọn xong cơ mà."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "慢慢收拾，每天收拾一点儿。我明天先去买一些大纸箱。",
                      "pinyin": "Mànman shōushi, měitiān shōushi yìdiǎnr. Wǒ míngtiān xiān qù mǎi yìxiē dà zhǐxiāng.",
                      "vietnamese": "Cứ dọn từ từ, mỗi ngày dọn một ít. Ngày mai anh sẽ đi mua trước vài chiếc thùng các-tông to."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "行，那我这几天先把衣服和书装箱。",
                      "pinyin": "Xíng, nà wǒ zhè jǐ tiān xiān bǎ yīfu hé shū zhuāng xiāng.",
                      "vietnamese": "Được, vậy mấy hôm nay em sẽ đóng gói quần áo và sách vở vào thùng trước."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "搬家公司我已经找好了，他们周六早上八点就到。",
                      "pinyin": "Bānjiā gōngsī wǒ yǐjīng zhǎohǎo le, tāmen zhōuliù zǎoshang bā diǎn jiù dào.",
                      "vietnamese": "Công ty chuyển nhà anh đã liên hệ xong rồi, sáng thứ Bảy tám giờ là họ tới ngay."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "那太好了，搬完家我们请朋友们来新家吃饭！",
                      "pinyin": "Nà tài hǎo le, bānwán jiā wǒmen qǐng péngyoumen lái xīn jiā chīfàn!",
                      "vietnamese": "Thế thì tốt quá rồi, dọn nhà xong chúng mình mời bạn bè tới nhà mới liên hoan nhé!"
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l3-g1",
              "title": "1. 程度副词“挺” (Phó từ mức độ '挺……的')",
              "explanation": "Biểu thị mức độ tương đối cao, thường đi kèm với '的' ở cuối cụm từ mang tính khẩu ngữ ('rất, khá').",
              "examples": [
                  {
                      "hanzi": "周围环境挺好的。",
                      "pinyin": "Zhōuwéi huánjìng tǐng hǎo de.",
                      "vietnamese": "Môi trường xung quanh khá là tốt."
                  },
                  {
                      "hanzi": "这个房间挺大挺干净的。",
                      "pinyin": "Zhè ge fángjiān tǐng dà tǐng gānjìng de.",
                      "vietnamese": "Căn phòng này khá rộng và khá sạch sẽ."
                  },
                  {
                      "hanzi": "他汉语说得挺流利的。",
                      "pinyin": "Tā Hànyǔ shuō de tǐng liúlì de.",
                      "vietnamese": "Anh ấy nói tiếng Trung khá lưu loát."
                  }
              ]
          },
          {
              "id": "hsk3-l3-g2",
              "title": "2. 程度补语（1） (Bổ ngữ mức độ: 得 + Tính từ/Cụm từ)",
              "explanation": "Đứng sau động từ hoặc tính từ để miêu tả hoặc đánh giá mức độ đạt được của hành động, trạng thái.",
              "examples": [
                  {
                      "hanzi": "卫生间打扫得干干净净。",
                      "pinyin": "Wèishēngjiān dǎsǎo de gāngānjìngjìng.",
                      "vietnamese": "Nhà vệ sinh được quét dọn sạch bong kin kít."
                  },
                  {
                      "hanzi": "今天搬家，把大家都累坏了。",
                      "pinyin": "Jīntiān bānjiā, bǎ dàjiā dōu lèi huài le.",
                      "vietnamese": "Hôm nay chuyển nhà làm ai nấy đều mệt lử."
                  }
              ]
          },
          {
              "id": "hsk3-l3-g3",
              "title": "3. “就”和“才”的区别 (Phân biệt '就' và '才')",
              "explanation": "'就' biểu thị hành động diễn ra sớm, nhanh, thuận lợi; '才' biểu thị hành động diễn ra muộn, chậm, gặp khó khăn.",
              "examples": [
                  {
                      "hanzi": "搬家公司早上八点就到了。",
                      "pinyin": "Bānjiā gōngsī zǎoshang bā diǎn jiù dào le.",
                      "vietnamese": "Công ty dọn nhà tám giờ sáng đã tới rồi (sớm)."
                  },
                  {
                      "hanzi": "明天下午我才有时间。",
                      "pinyin": "Míngtiān xiàwǔ wǒ cái yǒu shíjiān.",
                      "vietnamese": "Chiều mai tôi mới có thời gian (muộn)."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l3-w1",
              "hanzi": "初中",
              "pinyin": "chū zhōng",
              "hanViet": "Sơ Trung",
              "vietnamese": "trường trung học cơ sở",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "初中",
              "exampleTranslation": "trường trung học cơ sở",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w2",
              "hanzi": "换",
              "pinyin": "huàn",
              "hanViet": "Hoán",
              "vietnamese": "đổi, thay thế",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "换",
              "exampleTranslation": "đổi, thay thế",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l3-w3",
              "hanzi": "小区",
              "pinyin": "xiǎo qū",
              "hanViet": "Tiểu Khu",
              "vietnamese": "khu dân cư, khu chung cư",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "小区",
              "exampleTranslation": "khu dân cư, khu chung cư",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w4",
              "hanzi": "环境",
              "pinyin": "huán jìng",
              "hanViet": "Hoàn Cảnh",
              "vietnamese": "môi trường xung quanh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "环境",
              "exampleTranslation": "môi trường xung quanh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w5",
              "hanzi": "空调",
              "pinyin": "kōng tiáo",
              "hanViet": "Không Điều",
              "vietnamese": "máy điều hòa không khí",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "空调",
              "exampleTranslation": "máy điều hòa không khí",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w6",
              "hanzi": "洗衣机",
              "pinyin": "xǐ yī jī",
              "hanViet": "Tẩy Y Cơ",
              "vietnamese": "máy giặt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "洗衣机",
              "exampleTranslation": "máy giặt",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w7",
              "hanzi": "花园",
              "pinyin": "huā yuán",
              "hanViet": "Hoa Viên",
              "vietnamese": "vườn hoa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "花园",
              "exampleTranslation": "vườn hoa",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w8",
              "hanzi": "亮",
              "pinyin": "liàng",
              "hanViet": "Lượng",
              "vietnamese": "sáng, chiếu sáng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "亮",
              "exampleTranslation": "sáng, chiếu sáng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l3-w9",
              "hanzi": "关",
              "pinyin": "guān",
              "hanViet": "Quan",
              "vietnamese": "đóng, tắt (đèn, máy móc)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "关",
              "exampleTranslation": "đóng, tắt (đèn, máy móc)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l3-w10",
              "hanzi": "冰箱",
              "pinyin": "bīng xiāng",
              "hanViet": "Băng Tương",
              "vietnamese": "tủ lạnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "冰箱",
              "exampleTranslation": "tủ lạnh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w11",
              "hanzi": "刚",
              "pinyin": "gāng",
              "hanViet": "Cương",
              "vietnamese": "vừa mới",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "刚",
              "exampleTranslation": "vừa mới",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l3-w12",
              "hanzi": "卫生间",
              "pinyin": "wèi shēng jiān",
              "hanViet": "Vệ Sinh Gian",
              "vietnamese": "nhà vệ sinh, phòng tắm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "卫生间",
              "exampleTranslation": "nhà vệ sinh, phòng tắm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w13",
              "hanzi": "打扫",
              "pinyin": "dǎ sǎo",
              "hanViet": "Đả Tảo",
              "vietnamese": "quét dọn, vệ sinh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "打扫",
              "exampleTranslation": "quét dọn, vệ sinh",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l3-w14",
              "hanzi": "干净",
              "pinyin": "gān jìng",
              "hanViet": "Kiền Tịnh",
              "vietnamese": "sạch sẽ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "干净",
              "exampleTranslation": "sạch sẽ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l3-w15",
              "hanzi": "信用卡",
              "pinyin": "xìn yòng kǎ",
              "hanViet": "Tín Dụng Tạp",
              "vietnamese": "thẻ tín dụng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "信用卡",
              "exampleTranslation": "thẻ tín dụng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w16",
              "hanzi": "银行",
              "pinyin": "yín háng",
              "hanViet": "Ngân Hành",
              "vietnamese": "ngân hàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "银行",
              "exampleTranslation": "ngân hàng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l3-w17",
              "hanzi": "打折",
              "pinyin": "dǎ zhé",
              "hanViet": "Đả Chiết",
              "vietnamese": "chiết khấu, giảm giá",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "打折",
              "exampleTranslation": "chiết khấu, giảm giá",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l3-w18",
              "hanzi": "陪",
              "pinyin": "péi",
              "hanViet": "Bồi",
              "vietnamese": "đi cùng, bồi cùng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "陪",
              "exampleTranslation": "đi cùng, bồi cùng",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l3-w19",
              "hanzi": "得",
              "pinyin": "dé",
              "hanViet": "Đắc",
              "vietnamese": "phải (đọc là děi)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "得",
              "exampleTranslation": "phải (đọc là děi)",
              "tags": [
                  "Động từ năng nguyện"
              ]
          },
          {
              "id": "hsk3-l3-w20",
              "hanzi": "搬家",
              "pinyin": "bān jiā",
              "hanViet": "Bàn Gia",
              "vietnamese": "chuyển nhà",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "搬家",
              "exampleTranslation": "chuyển nhà",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l3-w21",
              "hanzi": "急",
              "pinyin": "jí",
              "hanViet": "Cấp",
              "vietnamese": "vội, gấp gáp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "急",
              "exampleTranslation": "vội, gấp gáp",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l3-w22",
              "hanzi": "搬家公司",
              "pinyin": "bān jiā gōng sī",
              "hanViet": "",
              "vietnamese": "công ty chuyển nhà",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "搬家公司",
              "exampleTranslation": "công ty chuyển nhà",
              "tags": [
                  "Danh từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l3-ex1",
              "type": "multiple_choice",
              "question": "Điền từ thích hợp: '这个新小区的绿化环境 ______ 好的。'",
              "options": [
                  "A. 挺……的",
                  "B. 太……了",
                  "C. 很……啊",
                  "D. 最……的"
              ],
              "correctAnswer": "A. 挺……的",
              "explanation": "Cấu trúc '挺 + tính từ + 的' biểu thị mức độ khá cao trong khẩu ngữ.",
              "grammarFocus": "Phó từ 挺"
          },
          {
              "id": "hsk3-l3-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '出门的时候请记得把灯 ______ (tắt) 上。'",
              "options": [
                  "关",
                  "开",
                  "换",
                  "亮"
              ],
              "correctAnswer": "关",
              "explanation": "关灯 (guāndēng): tắt đèn.",
              "grammarFocus": "Từ vựng Bài 3"
          },
          {
              "id": "hsk3-l3-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "他",
              "晚上九点",
              "才",
              "回家"
              ],
              "question": "Sắp xếp câu: '他 / 晚上九点 / 才 / 回家'",
              "correctAnswer": "他晚上九点才回家。",
              "explanation": "Phó từ '才' đứng trước động từ biểu thị hành động xảy ra muộn.",
              "grammarFocus": "Phó từ 才"
          },
          {
              "id": "hsk3-l3-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '把房间打扫 ______ 了再搬进去住。'",
              "options": [
                  "A. 干净",
                  "B. 方便",
                  "C. 容易",
                  "D. 热情"
              ],
              "correctAnswer": "A. 干净",
              "explanation": "打扫干净: quét dọn sạch sẽ (bổ ngữ kết quả).",
              "grammarFocus": "Bổ ngữ kết quả"
          }
      ],
      "cultureBonus": {
          "title": "🏡 Văn hóa mừng tân gia ở Trung Quốc (乔迁之喜)",
          "summary": "Người Trung Quốc gọi việc chuyển sang nhà mới là 'Kiều thiên chi hỉ' (乔迁之喜).",
          "content": "Khi chuyển đến nhà mới, gia chủ thường chọn ngày lành tháng tốt (吉日) và mời bạn bè, họ hàng đến ăn bữa cơm tân gia gọi là '暖房' (ôn phòng - làm ấm ngôi nhà), mang theo lời chúc an cư lạc nghiệp, vạn sự cát tường."
      }
  },
  // =========================================================================
  // LESSON 4: 这家宾馆跟别的都不一样
  // =========================================================================
  {
      "lessonNumber": 4,
      "titleHanzi": "这家宾馆跟别的都不一样",
      "titlePinyin": "Zhè jiā bīnguǎn gēn bié de dōu bù yīyàng",
      "titleVietnamese": "Khách sạn này khác hẳn những khách sạn khác",
      "pageStart": 29,
      "objectives": [
          "Dùng cấu trúc phủ định hoàn toàn '……也/都 + 不/没……'.",
          "Vận dụng câu so sánh '跟……一样/不一样' để đối chiếu nơi chốn, dịch vụ.",
          "Sử dụng thành thạo cấu trúc '除了……（以外），都/还/也……'."
      ],
      "texts": [
          {
              "id": "hsk3-l4-t1",
              "title": "课文 1: 商量去草原 (Bài khóa 1: Bàn đi thảo nguyên)",
              "context": "在客厅，杨同乐和李文在商量去内蒙古旅游。(Ở phòng khách, Dương Đồng Lạc và Lý Văn bàn đi Nội Mông).",
              "lines": [
                  {
                      "speaker": "杨同乐",
                      "hanzi": "李文，放假你打算去哪儿玩儿？",
                      "pinyin": "Lǐ Wén, fàngjià nǐ dǎsuàn qù nǎr wánr?",
                      "vietnamese": "Lý Văn, nghỉ lễ cậu định đi đâu chơi?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "我想去内蒙古看大草原，你跟我一起去吧。",
                      "pinyin": "Wǒ xiǎng qù Nèi Měnggǔ kàn dà cǎoyuán, nǐ gēn wǒ yìqǐ qù ba.",
                      "vietnamese": "Tôi muốn đi Nội Mông ngắm đại thảo nguyên, cậu đi cùng tôi nhé."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "好主意！我也一直想去骑马呢。我们坐飞机去还是坐火车去？",
                      "pinyin": "Hǎo zhǔyi! Wǒ yě yìzhí xiǎng qù qímǎ ne. Wǒmen zuò fēijī qù háishì zuò huǒchē qù?",
                      "vietnamese": "Ý kiến hay đấy! Tôi cũng luôn muốn đi cưỡi ngựa. Chúng ta đi máy bay hay đi tàu hỏa?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "坐飞机快，两个小时就到了。",
                      "pinyin": "Zuò fēijī kuài, liǎng ge xiǎoshí jiù dào le.",
                      "vietnamese": "Đi máy bay nhanh, hai tiếng là tới nơi rồi."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "那我们今天就把机票买了吧。",
                      "pinyin": "Nà wǒmen jīntiān jiù bǎ jīpiào mǎi le ba.",
                      "vietnamese": "Vậy thì hôm nay chúng ta mua vé máy bay luôn đi."
                  }
              ]
          },
          {
              "id": "hsk3-l4-t2",
              "title": "课文 2: 草原宾馆特色 (Bài khóa 2: Đặc sắc khách sạn thảo nguyên)",
              "context": "在宾馆前台，李文和杨同乐办理入住。(Tại quầy lễ tân khách sạn, nhận phòng).",
              "lines": [
                  {
                      "speaker": "杨同乐",
                      "hanzi": "这家宾馆看起来跟别的不太一样。",
                      "pinyin": "Zhè jiā bīnguǎn kàn qǐlai gēn bié de bú tài yíyàng.",
                      "vietnamese": "Khách sạn này trông có vẻ không giống lắm với những khách sạn khác."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "是啊，这里的房间都是蒙古包的样子，太有特色了！",
                      "pinyin": "Shì a, zhèlǐ de fángjiān dōu shì Měnggǔbāo de yàngzi, tài yǒu tèsè le!",
                      "vietnamese": "Đúng thế, phòng ở đây đều mang hình dáng lều Mông Cổ, đặc sắc quá chừng!"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "房间里一件现代家具都没有，但是挺舒服的。",
                      "pinyin": "Fángjiān lǐ yí jiàn xiàndài jiājù dōu méiyǒu, dànshì tǐng shūfu de.",
                      "vietnamese": "Trong phòng một món đồ nội thất hiện đại cũng không có, nhưng ở khá là dễ chịu."
                  },
                  {
                      "speaker": "服务员",
                      "hanzi": "两位先生好，欢迎来到草原宾馆！这是你们的房卡。",
                      "pinyin": "Liǎng wèi xiānsheng hǎo, huānyíng láidào cǎoyuán bīnguǎn! Zhè shì nǐmen de fángkǎ.",
                      "vietnamese": "Chào hai quý khách, hoan nghênh đến với khách sạn Thảo Nguyên! Đây là thẻ phòng của hai vị."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "请问，宾馆里有无线网络吗？",
                      "pinyin": "Qǐngwèn, bīnguǎn lǐ yǒu wúxiàn wǎngluò ma?",
                      "vietnamese": "Xin hỏi, trong khách sạn có mạng không dây không ạ?"
                  },
                  {
                      "speaker": "服务员",
                      "hanzi": "有的，除了卫生间，房间里到处都有信号。",
                      "pinyin": "Yǒu de, chúle wèishēngjiān, fángjiān lǐ dàochù dōu yǒu xìnhào.",
                      "vietnamese": "Có chứ ạ, trừ nhà vệ sinh ra thì trong phòng chỗ nào cũng có sóng."
                  }
              ]
          },
          {
              "id": "hsk3-l4-t3",
              "title": "课文 3: 草原骑马 (Bài khóa 3: Cưỡi ngựa trên thảo nguyên)",
              "context": "在草原上，李文和杨同乐在骑马散步。(Trên thảo nguyên, Lý Văn và Dương Đồng Lạc cưỡi ngựa).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "这里的草长得真绿啊，一眼望不到边。",
                      "pinyin": "Zhèlǐ de cǎo zhǎng de zhēn lǜ a, yì yǎn wàng bú dào biān.",
                      "vietnamese": "Cỏ ở đây mọc xanh thật đấy, nhìn một cái ngút ngàn không thấy chân trời."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "天空也很蓝，一点儿云彩都没有。",
                      "pinyin": "Tiānkōng yě hěn lán, yìdiǎnr yúncai dōu méiyǒu.",
                      "vietnamese": "Bầu trời cũng rất xanh, một gợn mây cũng không có."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "你骑过马吗？",
                      "pinyin": "Nǐ qí guo mǎ ma?",
                      "vietnamese": "Cậu từng cưỡi ngựa bao giờ chưa?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "我小时候骑过一次，跟在公园里骑完全不一样。",
                      "pinyin": "Wǒ xiǎoshíhou qí guo yí cì, gēn zài gōngyuán lǐ qí wánquán bù yíyàng.",
                      "vietnamese": "Hồi nhỏ tôi cưỡi một lần rồi, so với cưỡi trong công viên hoàn toàn khác biệt."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "这里的马跑得真快，我都快追不上了！",
                      "pinyin": "Zhèlǐ de mǎ pǎo de zhēn kuài, wǒ dōu kuài zhuī bu shàng le!",
                      "vietnamese": "Ngựa ở đây chạy nhanh quá, tôi sắp đuổi không kịp rồi!"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "慢一点儿骑，小心别摔下来。",
                      "pinyin": "Màn yìdiǎnr qí, xiǎoxīn bié shuāi xiàlái.",
                      "vietnamese": "Cưỡi chậm lại một chút, cẩn thận kẻo ngã đấy."
                  }
              ]
          },
          {
              "id": "hsk3-l4-t4",
              "title": "课文 4: 草原之夜日记 (Bài khóa 4: Nhật ký đêm thảo nguyên)",
              "context": "在宾馆餐厅，李文在写旅行日记。(Tại nhà hàng khách sạn, Lý Văn viết nhật ký).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "今天是我第一次来到内蒙古大草原。这里的天空比北京的更蓝，空气也更清新。",
                      "pinyin": "Jīntiān shì wǒ dì-yī cì láidào Nèi Měnggǔ dà cǎoyuán. Zhèlǐ de tiānkōng bǐ Běijīng de gèng lán, kōngqì yě gèng qīngxīn.",
                      "vietnamese": "Hôm nay là lần đầu tiên tôi đến đại thảo nguyên Nội Mông. Bầu trời nơi đây xanh hơn ở Bắc Kinh, không khí cũng trong lành hơn."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "除了草原上的羊群和马群，几乎看不到别的东西。晚上，宾馆的主人请我们喝了奶茶，吃了烤全羊。",
                      "pinyin": "Chúle cǎoyuán shang de yángqún hé mǎqún, jīhū kàn bú dào bié de dōngxi. Wǎnshang, bīnguǎn de zhǔrén qǐng wǒmen hē le nǎichá, chī le kǎoquányáng.",
                      "vietnamese": "Trừ những đàn cừu và đàn ngựa trên đồng cỏ, hầu như không nhìn thấy bất cứ thứ gì khác. Buổi tối, chủ khách sạn mời chúng tôi uống trà sữa và ăn thịt cừu nướng nguyên con."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "虽然今天骑马跑了一整天，身体很累，但心里一点儿都不觉得累。",
                      "pinyin": "Suīrán jīntiān qímǎ pǎo le yì zhěng tiān, shēntǐ hěn lèi, dàn xīnlǐ yìdiǎnr dōu bù juéde lèi.",
                      "vietnamese": "Tuy rằng hôm nay cưỡi ngựa cả ngày mệt rã rời về thể xác, nhưng trong lòng lại chẳng hề cảm thấy mệt mỏi chút nào."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "躺在具有蒙古特色的房间里，听着窗外的风声，我感到特别安静和放松。",
                      "pinyin": "Tǎng zài jùyǒu Měnggǔ tèsè de fángjiān lǐ, tīngzhe chuāngwài de fēngshēng, wǒ gǎndào tèbié ānjìng hé fàngsōng.",
                      "vietnamese": "Nằm trong căn phòng mang đậm phong vị Mông Cổ, lắng nghe tiếng gió rít ngoài cửa sổ, tôi cảm thấy tâm hồn vô cùng tĩnh lặng và thư thái."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l4-g1",
              "title": "1. 固定格式“一……也/都+不/没……” (Cấu trúc phủ định hoàn toàn)",
              "explanation": "Dùng 'Số từ (一) + Lượng từ + Danh từ + 也/都 + 不/没 + Động từ/Tính từ' để biểu thị sự phủ định tuyệt đối ('một chút cũng không...').",
              "examples": [
                  {
                      "hanzi": "房间里一件现代家具都没有。",
                      "pinyin": "Fángjiān lǐ yí jiàn xiàndài jiājù dōu méiyǒu.",
                      "vietnamese": "Trong phòng một món đồ nội thất hiện đại cũng chẳng có."
                  },
                  {
                      "hanzi": "天空很蓝，一点儿云彩都没有。",
                      "pinyin": "Tiānkōng hěn lán, yìdiǎnr yúncai dōu méiyǒu.",
                      "vietnamese": "Bầu trời rất xanh, chẳng có lấy một gợn mây."
                  },
                  {
                      "hanzi": "今天太忙了，我一口水都没喝。",
                      "pinyin": "Jīntiān tài máng le, wǒ yì kǒu shuǐ dōu méi hē.",
                      "vietnamese": "Hôm nay bận quá, một ngụm nước tôi cũng chưa uống."
                  }
              ]
          },
          {
              "id": "hsk3-l4-g2",
              "title": "2. 比较句（9）“A 跟 B 一样/不一样” (Câu so sánh ngang bằng và khác biệt)",
              "explanation": "Dùng để so sánh sự đồng nhất hoặc khác biệt giữa hai đối tượng A và B.",
              "examples": [
                  {
                      "hanzi": "这家宾馆跟别的不太一样。",
                      "pinyin": "Zhè jiā bīnguǎn gēn bié de bú tài yíyàng.",
                      "vietnamese": "Khách sạn này so với nơi khác không giống nhau lắm."
                  },
                  {
                      "hanzi": "在草原上骑马跟在公园里骑完全不一样。",
                      "pinyin": "Zài cǎoyuán shang qímǎ gēn zài gōngyuán lǐ qí wánquán bù yíyàng.",
                      "vietnamese": "Cưỡi ngựa trên thảo nguyên với cưỡi ở công viên hoàn toàn khác biệt."
                  }
              ]
          },
          {
              "id": "hsk3-l4-g3",
              "title": "3. 固定格式“除了……（以外），……都/还/也……” (Cấu trúc 'Ngoài... ra')",
              "explanation": "Biểu thị trừ trường hợp nêu ra thì các trường hợp khác đều như nhau (loại trừ với '都') hoặc bổ sung thêm trường hợp khác (bổ sung với '还/也').",
              "examples": [
                  {
                      "hanzi": "除了卫生间，房间里到处都有信号。",
                      "pinyin": "Chúle wèishēngjiān, fángjiān lǐ dàochù dōu yǒu xìnhào.",
                      "vietnamese": "Ngoài nhà vệ sinh ra, trong phòng chỗ nào cũng có sóng (loại trừ)."
                  },
                  {
                      "hanzi": "除了汉语以外，他还会说法语和英语。",
                      "pinyin": "Chúle Hànyǔ yǐwài, tā hái huì shuō Fǎyǔ hé Yīngyǔ.",
                      "vietnamese": "Ngoài tiếng Trung ra, anh ấy còn biết nói tiếng Pháp và tiếng Anh (bổ sung)."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l4-w1",
              "hanzi": "放假",
              "pinyin": "fàng jià",
              "hanViet": "Phóng Giả",
              "vietnamese": "nghỉ lễ, nghỉ phép",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "放假",
              "exampleTranslation": "nghỉ lễ, nghỉ phép",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l4-w2",
              "hanzi": "草原",
              "pinyin": "cǎo yuán",
              "hanViet": "Thảo Nguyên",
              "vietnamese": "thảo nguyên, đồng cỏ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "草原",
              "exampleTranslation": "thảo nguyên, đồng cỏ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w3",
              "hanzi": "主意",
              "pinyin": "zhǔ yì",
              "hanViet": "Chủ Ý",
              "vietnamese": "chủ ý, ý kiến",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "主意",
              "exampleTranslation": "chủ ý, ý kiến",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w4",
              "hanzi": "骑",
              "pinyin": "qí",
              "hanViet": "Kị",
              "vietnamese": "cưỡi (ngựa, xe đạp)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "骑",
              "exampleTranslation": "cưỡi (ngựa, xe đạp)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l4-w5",
              "hanzi": "马",
              "pinyin": "mǎ",
              "hanViet": "Mã",
              "vietnamese": "con ngựa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "马",
              "exampleTranslation": "con ngựa",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w6",
              "hanzi": "宾馆",
              "pinyin": "bīn guǎn",
              "hanViet": "Tân Quán",
              "vietnamese": "khách sạn, nhà khách",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "宾馆",
              "exampleTranslation": "khách sạn, nhà khách",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w7",
              "hanzi": "前台",
              "pinyin": "qián tái",
              "hanViet": "",
              "vietnamese": "quầy lễ tân",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "前台",
              "exampleTranslation": "quầy lễ tân",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w8",
              "hanzi": "办理",
              "pinyin": "bàn lǐ",
              "hanViet": "Biện Lí",
              "vietnamese": "xử lý, làm thủ tục",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "办理",
              "exampleTranslation": "xử lý, làm thủ tục",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l4-w9",
              "hanzi": "特色",
              "pinyin": "tè sè",
              "hanViet": "Đặc Sắc",
              "vietnamese": "đặc sắc, nét đặc trưng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "特色",
              "exampleTranslation": "đặc sắc, nét đặc trưng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w10",
              "hanzi": "家具",
              "pinyin": "jiā jù",
              "hanViet": "Gia Cụ",
              "vietnamese": "đồ gia dụng, nội thất",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "家具",
              "exampleTranslation": "đồ gia dụng, nội thất",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w11",
              "hanzi": "舒服",
              "pinyin": "shū fú",
              "hanViet": "Thư Phục",
              "vietnamese": "dễ chịu, thoải mái",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "舒服",
              "exampleTranslation": "dễ chịu, thoải mái",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l4-w12",
              "hanzi": "房卡",
              "pinyin": "fáng kǎ",
              "hanViet": "",
              "vietnamese": "thẻ phòng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "房卡",
              "exampleTranslation": "thẻ phòng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w13",
              "hanzi": "信号",
              "pinyin": "xìn hào",
              "hanViet": "Tín Hiệu",
              "vietnamese": "tín hiệu, sóng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "信号",
              "exampleTranslation": "tín hiệu, sóng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w14",
              "hanzi": "蓝",
              "pinyin": "lán",
              "hanViet": "Lam",
              "vietnamese": "màu xanh da trời",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "蓝",
              "exampleTranslation": "màu xanh da trời",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l4-w15",
              "hanzi": "云",
              "pinyin": "yún",
              "hanViet": "Vân",
              "vietnamese": "mây",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "云",
              "exampleTranslation": "mây",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w16",
              "hanzi": "完全",
              "pinyin": "wán quán",
              "hanViet": "Hoàn Toàn",
              "vietnamese": "hoàn toàn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "完全",
              "exampleTranslation": "hoàn toàn",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l4-w17",
              "hanzi": "摔",
              "pinyin": "shuāi",
              "hanViet": "Suất",
              "vietnamese": "ngã, rơi rớt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "摔",
              "exampleTranslation": "ngã, rơi rớt",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l4-w18",
              "hanzi": "空气",
              "pinyin": "kōng qì",
              "hanViet": "Không Khí",
              "vietnamese": "không khí",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "空气",
              "exampleTranslation": "không khí",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w19",
              "hanzi": "新鲜",
              "pinyin": "xīn xiān",
              "hanViet": "Tân Tiên",
              "vietnamese": "tươi mới, trong lành",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "新鲜",
              "exampleTranslation": "tươi mới, trong lành",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l4-w20",
              "hanzi": "几乎",
              "pinyin": "jī hū",
              "hanViet": "Kỉ Hồ",
              "vietnamese": "hầu như, suýt nữa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "几乎",
              "exampleTranslation": "hầu như, suýt nữa",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l4-w21",
              "hanzi": "羊",
              "pinyin": "yáng",
              "hanViet": "Dương",
              "vietnamese": "con cừu, dê",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "羊",
              "exampleTranslation": "con cừu, dê",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w22",
              "hanzi": "奶茶",
              "pinyin": "nǎi chá",
              "hanViet": "Nãi Trà",
              "vietnamese": "trà sữa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "奶茶",
              "exampleTranslation": "trà sữa",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l4-w23",
              "hanzi": "安静",
              "pinyin": "ān jìng",
              "hanViet": "An Tĩnh",
              "vietnamese": "yên tĩnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "安静",
              "exampleTranslation": "yên tĩnh",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l4-w24",
              "hanzi": "放松",
              "pinyin": "fàng sōng",
              "hanViet": "Phóng Tùng",
              "vietnamese": "thư giãn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "放松",
              "exampleTranslation": "thư giãn",
              "tags": [
                  "Động từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l4-ex1",
              "type": "multiple_choice",
              "question": "Điền từ phủ định: '今天天气太热了，我一点儿胃口 ______。'",
              "options": [
                  "A. 都没有",
                  "B. 还有",
                  "C. 也很",
                  "D. 都太"
              ],
              "correctAnswer": "A. 都没有",
              "explanation": "Cấu trúc '一点儿 + Danh từ + 也没有': một chút cũng không có.",
              "grammarFocus": "Cấu trúc 一点儿也没有"
          },
          {
              "id": "hsk3-l4-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '这家宾馆的房间跟别处的完全不 ______ (khác nhau)。'",
              "options": [
                  "一样",
                  "一样好",
                  "相同",
                  "特色"
              ],
              "correctAnswer": "一样",
              "explanation": "跟……不一样: không giống với...",
              "grammarFocus": "So sánh 跟……一样"
          },
          {
              "id": "hsk3-l4-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "除了小明",
              "都去踢足球了",
              "以外",
              "大家都"
              ],
              "question": "Sắp xếp câu: '除了小明 / 都去踢足球了 / 以外 / 大家都'",
              "correctAnswer": "除了小明以外大家都去踢足球了。",
              "explanation": "Cấu trúc: 除了……（以外），主语 + 都 + 谓语.",
              "grammarFocus": "Cấu trúc 除了……以外"
          },
          {
              "id": "hsk3-l4-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '大草原上的空气格外 ______。'",
              "options": [
                  "A. 新鲜",
                  "B. 便宜",
                  "C. 热情",
                  "D. 糊涂"
              ],
              "correctAnswer": "A. 新鲜",
              "explanation": "空气新鲜: không khí trong lành.",
              "grammarFocus": "Từ vựng Bài 4"
          }
      ],
      "cultureBonus": {
          "title": "⛺ Lều Mông Cổ và lòng hiếu khách (蒙古包与奶茶礼仪)",
          "summary": "Người Mông Cổ sống du mục trên đồng cỏ với những chiếc lều tròn độc đáo (蒙古包).",
          "content": "Lều Mông Cổ được thiết kế thông minh để dễ tháo dỡ, chống lại gió rét khắc nghiệt. Khi khách bước vào lều, chủ nhà người Mông Cổ luôn bưng bát trà sữa mặn nóng hổi cùng đĩa phô mai khô để tiếp đãi bằng sự chân thành nồng nhiệt nhất."
      }
  },
  // =========================================================================
  // LESSON 5: 这样的照片才好看
  // =========================================================================
  {
      "lessonNumber": 5,
      "titleHanzi": "这样的照片才好看",
      "titlePinyin": "Zhèyàng de zhàopiàn cái hǎokàn",
      "titleVietnamese": "Bức ảnh như thế này mới đẹp",
      "pageStart": 38,
      "objectives": [
          "Vận dụng bổ ngữ mức độ (2) để đánh giá thẩm mỹ và chất lượng.",
          "Dùng lượng từ lặp lại biểu thị ý 'từng cái một, mỗi một'.",
          "Nắm cấu trúc câu tồn hiện miêu tả sự vật tồn tại ở vị trí nhất định.",
          "Dùng câu phức rút gọn '……了……就……'."
      ],
      "texts": [
          {
              "id": "hsk3-l5-t1",
              "title": "课文 1: 在公园散步拍照 (Bài khóa 1: Dạo công viên chụp ảnh)",
              "context": "在公园，白家月和李文在散步拍照。(Ở công viên, Bạch Gia Nguyệt và Lý Văn đi dạo chụp ảnh).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "今天天气好极了，阳光很舒服。",
                      "pinyin": "Jīntiān tiānqì hǎo jí le, yángguāng hěn shūfu.",
                      "vietnamese": "Thời tiết hôm nay đẹp cực kỳ, ánh nắng ấm áp dễ chịu."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "是啊，公园里的花开得真漂亮，一朵朵都特别鲜艳。",
                      "pinyin": "Shì a, gōngyuán lǐ de huā kāi de zhēn piàoliang, yì duǒduǒ dōu tèbié xiānyàn.",
                      "vietnamese": "Đúng thế, hoa trong công viên nở đẹp thật đấy, từng bông từng bông đều rực rỡ vô cùng."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "李文，快帮我拍几张照片吧！",
                      "pinyin": "Lǐ Wén, kuài bāng wǒ pāi jǐ zhāng zhàopiàn ba!",
                      "vietnamese": "Lý Văn, mau chụp giúp em mấy tấm ảnh đi!"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "好啊，你站在那棵大树旁边，笑一笑。",
                      "pinyin": "Hǎo a, nǐ zhàn zài nà kē dà shù pángbiān, xiàoyíxiào.",
                      "vietnamese": "Được chứ, em đứng cạnh gốc cây to kia đi, cười lên nào."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "拍好了吗？让我看看。",
                      "pinyin": "Pāihǎo le ma? Ràng wǒ kànkan.",
                      "vietnamese": "Chụp xong chưa? Để em xem với."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "拍得好极了，你看看这张，多自然啊！",
                      "pinyin": "Pāi de hǎo jí le, nǐ kànkan zhè zhāng, duō zìrán a!",
                      "vietnamese": "Chụp đẹp tuyệt cú mèo luôn, em xem tấm này này, tự nhiên biết bao!"
                  }
              ]
          },
          {
              "id": "hsk3-l5-t2",
              "title": "课文 2: 湖边选景 (Bài khóa 2: Chọn góc bên hồ)",
              "context": "在湖边，李文帮白家月看照片。(Bên bờ hồ, Lý Văn cùng xem ảnh).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "这几张照片背景里人太多了，有点儿乱。",
                      "pinyin": "Zhè jǐ zhāng zhàopiàn bèijǐng lǐ rén tài duō le, yǒudiǎnr luàn.",
                      "vietnamese": "Mấy tấm ảnh này hậu cảnh đông người quá, hơi bị lộn xộn."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "那我们去湖边拍吧，那边人少，背景干净。",
                      "pinyin": "Nà wǒmen qù húbiān pāi ba, nàbiān rén shǎo, bèijǐng gānjìng.",
                      "vietnamese": "Vậy thì chúng mình ra bờ hồ chụp nhé, đằng đó vắng người, phông nền lại gọn gàng sạch sẽ."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "好的，到了湖边我们先找个好角度。",
                      "pinyin": "Hǎo de, dào le húbiān wǒmen xiān zhǎo ge hǎo jiǎodù.",
                      "vietnamese": "Vâng ạ, ra đến bờ hồ mình tìm một góc chụp thật đẹp trước."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "你坐在湖边的长椅上，手里拿本书，这样的照片才好看呢。",
                      "pinyin": "Nǐ zuò zài húbiān de chángyǐ shang, shǒulǐ ná běn shū, zhèyàng de zhàopiàn cái hǎokàn ne.",
                      "vietnamese": "Em ngồi lên chiếc ghế dài bên hồ, tay cầm một cuốn sách, bức ảnh như thế này mới đẹp này."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "听你的，拍完了我们就去那边的咖啡馆坐坐。",
                      "pinyin": "Tīng nǐ de, pāiwán le wǒmen jiù qù nàbiān de kāfēiguǎn zuòzuo.",
                      "vietnamese": "Nghe anh đấy, chụp xong là chúng mình ghé qua quán cà phê đằng kia ngồi nghỉ nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l5-t3",
              "title": "课文 3: 分享朋友圈 (Bài khóa 3: Chia sẻ lên mạng xã hội)",
              "context": "在咖啡馆，白家月和李文选照片发朋友圈。(Tại quán cà phê, chọn ảnh đăng khoảnh khắc bạn bè).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "这张照片照得真好，墙上挂着几幅画，光线特别柔和。",
                      "pinyin": "Zhè zhāng zhàopiàn zhào de zhēn hǎo, qiángshang guàzhe jǐ fú huà, guāngxiàn tèbié róuhé.",
                      "vietnamese": "Tấm ảnh này chụp đẹp thật đấy, trên tường treo mấy bức tranh, ánh sáng lại cực kỳ dịu nhẹ."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "张张都很精彩，你打算发到朋友圈吗？",
                      "pinyin": "Zhāngzhāng dōu hěn jīngcǎi, nǐ dǎsuàn fā dào péngyouquān ma?",
                      "vietnamese": "Tấm nào tấm nấy đều rất xuất sắc, em định đăng lên mạng xã hội à?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "对啊，选四张最漂亮的，修一修就发。",
                      "pinyin": "Duì a, xuǎn sì zhāng zuì piàoliang de, xiūyixiū jiù fā.",
                      "vietnamese": "Vâng, chọn bốn tấm đẹp nhất, chỉnh sửa một chút là đăng luôn."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "朋友们看了肯定都会点赞的。",
                      "pinyin": "Péngyoumen kàn le kěndìng dōu huì diǎnzàn de.",
                      "vietnamese": "Bạn bè mà xem thì chắc chắn ai cũng bấm like cho xem."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "哈哈，主要是你这个摄影师水平高！",
                      "pinyin": "Hāhā, zhǔyào shì nǐ zhè ge shèyǐngshī shuǐpíng gāo!",
                      "vietnamese": "Haha, chủ yếu là do tay nghề của phó nháy như anh quá cừ thôi!"
                  }
              ]
          },
          {
              "id": "hsk3-l5-t4",
              "title": "课文 4: 摄影日记 (Bài khóa 4: Nhật ký nhiếp ảnh)",
              "context": "在日记里，白家月写今天的摄影体会。(Viết nhật ký về cảm nhận chụp ảnh hôm nay).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "今天我和李文去奥林匹克森林公园玩儿。公园里到处都是绿树和鲜花，空气清新极了。",
                      "pinyin": "Jīntiān wǒ hé Lǐ Wén qù Àolínpǐkè Sēnlín Gōngyuán wánr. Gōngyuán lǐ dàochù dōu shì lǜshù hé xiānhuā, kōngqì qīngxīn jí le.",
                      "vietnamese": "Hôm nay tôi và Lý Văn đi công viên Rừng Olympic chơi. Trong công viên chỗ nào cũng là cây xanh và hoa tươi, không khí trong lành vô cùng."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "李文给我拍了许多漂亮的照片。以前我总觉得照相只要人笑得好看就行，今天听了李文的建议才明白，背景、光线和动作都特别重要。",
                      "pinyin": "Lǐ Wén gěi wǒ pāi le xǔduō piàoliang de zhàopiàn. Yǐqián wǒ zǒng juéde zhàoxiàng zhǐyào rén xiào de hǎokàn jiù xíng, jīntiān tīng le Lǐ Wén de jiànyì cái míngbai, bèijǐng, guāngxiàn hé dòngzuò dōu tèbié zhòngyào.",
                      "vietnamese": "Lý Văn đã chụp cho tôi rất nhiều bức ảnh xinh xắn. Trước đây tôi cứ nghĩ chụp ảnh chỉ cần người cười tươi là được, hôm nay nghe lời góp ý của Lý Văn mới hiểu ra rằng hậu cảnh, ánh sáng và cử chỉ tạo dáng đều hết sức quan trọng."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "桌子上摆着一杯热咖啡，看着手机里一张张生动的照片，今天过得开心极了！",
                      "pinyin": "Zhuōzi shang bǎizhe yì bēi rè kāfēi, kànzhe shǒujī lǐ yì zhāngzhāng shēngdòng de zhàopiàn, jīntiān guò de kāixīn jí le!",
                      "vietnamese": "Trên bàn đặt một tách cà phê nóng, ngắm nhìn từng bức ảnh sống động trên điện thoại, ngày hôm nay trôi qua thật vui vẻ biết bao!"
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l5-g1",
              "title": "1. 程度补语（2）“形容词+极了” (Bổ ngữ mức độ: Tính từ + 极了)",
              "explanation": "Đứng sau tính từ để biểu thị mức độ cao nhất ('cực kỳ, vô cùng').",
              "examples": [
                  {
                      "hanzi": "今天天气好极了。",
                      "pinyin": "Jīntiān tiānqì hǎo jí le.",
                      "vietnamese": "Hôm nay thời tiết đẹp vô cùng."
                  },
                  {
                      "hanzi": "空气清新极了。",
                      "pinyin": "Kōngqì qīngxīn jí le.",
                      "vietnamese": "Không khí trong lành hết sức."
                  }
              ]
          },
          {
              "id": "hsk3-l5-g2",
              "title": "2. 量词重叠 (Lặp lại lượng từ: AA式)",
              "explanation": "Biểu thị ý nghĩa 'mỗi một, từng cái một' với tính chất nhấn mạnh số lượng toàn thể.",
              "examples": [
                  {
                      "hanzi": "公园里的花一朵朵都特别鲜艳。",
                      "pinyin": "Gōngyuán lǐ de huā yì duǒduǒ dōu tèbié xiānyàn.",
                      "vietnamese": "Hoa trong công viên từng bông từng bông đều rực rỡ."
                  },
                  {
                      "hanzi": "手机里张张照片都很精彩。",
                      "pinyin": "Shǒujī lǐ zhāngzhāng zhàopiàn dōu hěn jīngcǎi.",
                      "vietnamese": "Trong điện thoại tấm ảnh nào tấm nấy đều rất tuyệt."
                  }
              ]
          },
          {
              "id": "hsk3-l5-g3",
              "title": "3. 存现句（3） (Câu tồn hiện miêu tả trạng thái tĩnh)",
              "explanation": "Cấu trúc: Từ chỉ nơi chốn + Động từ + 着 + Danh từ biểu thị sự vật đang tồn tại ở trạng thái nhất định tại nơi đó.",
              "examples": [
                  {
                      "hanzi": "墙上挂着几幅画。",
                      "pinyin": "Qiángshang guàzhe jǐ fú huà.",
                      "vietnamese": "Trên tường đang treo mấy bức tranh."
                  },
                  {
                      "hanzi": "桌子上摆着一杯热咖啡。",
                      "pinyin": "Zhuōzi shang bǎizhe yì bēi rè kāfēi.",
                      "vietnamese": "Trên bàn đang đặt một tách cà phê nóng."
                  }
              ]
          },
          {
              "id": "hsk3-l5-g4",
              "title": "4. 紧缩复句“……了……就……” (Câu phức rút gọn: Xong... là...)",
              "explanation": "Biểu thị hành động thứ hai diễn ra ngay sau khi hành động thứ nhất hoàn thành.",
              "examples": [
                  {
                      "hanzi": "拍完了我们就去那边的咖啡馆坐坐。",
                      "pinyin": "Pāiwán le wǒmen jiù qù nàbiān de kāfēiguǎn zuòzuo.",
                      "vietnamese": "Chụp xong là chúng ta qua quán cà phê đằng kia ngồi nghỉ ngay."
                  },
                  {
                      "hanzi": "选好了照片修一修就发。",
                      "pinyin": "Xuǎnhǎo le zhàopiàn xiūyixiū jiù fā.",
                      "vietnamese": "Chọn xong ảnh chỉnh sửa một chút là đăng ngay."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l5-w1",
              "hanzi": "阳光",
              "pinyin": "yáng guāng",
              "hanViet": "Dương Quang",
              "vietnamese": "ánh nắng mặt trời",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "阳光",
              "exampleTranslation": "ánh nắng mặt trời",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w2",
              "hanzi": "极了",
              "pinyin": "jí le",
              "hanViet": "",
              "vietnamese": "cực kỳ, vô cùng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "极了",
              "exampleTranslation": "cực kỳ, vô cùng",
              "tags": [
                  "Trợ từ"
              ]
          },
          {
              "id": "hsk3-l5-w3",
              "hanzi": "朵",
              "pinyin": "duǒ",
              "hanViet": "Đóa",
              "vietnamese": "bông, đóa (lượng từ của hoa)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "朵",
              "exampleTranslation": "bông, đóa (lượng từ của hoa)",
              "tags": [
                  "Lượng từ"
              ]
          },
          {
              "id": "hsk3-l5-w4",
              "hanzi": "鲜艳",
              "pinyin": "xiān yàn",
              "hanViet": "Tiên Diễm",
              "vietnamese": "tươi tắn, rực rỡ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "鲜艳",
              "exampleTranslation": "tươi tắn, rực rỡ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l5-w5",
              "hanzi": "拍",
              "pinyin": "pāi",
              "hanViet": "Phách",
              "vietnamese": "chụp (ảnh), đập",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "拍",
              "exampleTranslation": "chụp (ảnh), đập",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l5-w6",
              "hanzi": "旁边",
              "pinyin": "páng biān",
              "hanViet": "Bàng Biên",
              "vietnamese": "bên cạnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "旁边",
              "exampleTranslation": "bên cạnh",
              "tags": [
                  "Danh từ chỉ vị trí"
              ]
          },
          {
              "id": "hsk3-l5-w7",
              "hanzi": "自然",
              "pinyin": "zì rán",
              "hanViet": "Tự Nhiên",
              "vietnamese": "tự nhiên",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "自然",
              "exampleTranslation": "tự nhiên",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l5-w8",
              "hanzi": "背景",
              "pinyin": "bèi jǐng",
              "hanViet": "Bối Cảnh",
              "vietnamese": "bối cảnh, phông nền",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "背景",
              "exampleTranslation": "bối cảnh, phông nền",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w9",
              "hanzi": "乱",
              "pinyin": "luàn",
              "hanViet": "Loạn",
              "vietnamese": "lộn xộn, bừa bãi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "乱",
              "exampleTranslation": "lộn xộn, bừa bãi",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l5-w10",
              "hanzi": "湖",
              "pinyin": "hú",
              "hanViet": "Hồ",
              "vietnamese": "hồ nước",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "湖",
              "exampleTranslation": "hồ nước",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w11",
              "hanzi": "角度",
              "pinyin": "jiǎo dù",
              "hanViet": "Giác Độ",
              "vietnamese": "góc độ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "角度",
              "exampleTranslation": "góc độ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w12",
              "hanzi": "椅子",
              "pinyin": "yǐ zi",
              "hanViet": "Y Tử",
              "vietnamese": "cái ghế",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "椅子",
              "exampleTranslation": "cái ghế",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w13",
              "hanzi": "挂",
              "pinyin": "guà",
              "hanViet": "Quải",
              "vietnamese": "treo, móc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "挂",
              "exampleTranslation": "treo, móc",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l5-w14",
              "hanzi": "画",
              "pinyin": "huà",
              "hanViet": "Họa",
              "vietnamese": "bức tranh, vẽ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "画",
              "exampleTranslation": "bức tranh, vẽ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w15",
              "hanzi": "柔和",
              "pinyin": "róu hé",
              "hanViet": "",
              "vietnamese": "dịu nhẹ, nhu hòa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "柔和",
              "exampleTranslation": "dịu nhẹ, nhu hòa",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l5-w16",
              "hanzi": "精彩",
              "pinyin": "jīng cǎi",
              "hanViet": "Tinh Thải",
              "vietnamese": "đặc sắc, xuất sắc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "精彩",
              "exampleTranslation": "đặc sắc, xuất sắc",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l5-w17",
              "hanzi": "选",
              "pinyin": "xuǎn",
              "hanViet": "Tuyển",
              "vietnamese": "chọn, lựa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "选",
              "exampleTranslation": "chọn, lựa",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l5-w18",
              "hanzi": "修",
              "pinyin": "xiū",
              "hanViet": "Tu",
              "vietnamese": "chỉnh sửa, sửa chữa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "修",
              "exampleTranslation": "chỉnh sửa, sửa chữa",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l5-w19",
              "hanzi": "点赞",
              "pinyin": "diǎn zàn",
              "hanViet": "Điểm Tán",
              "vietnamese": "bấm thích, thả tim",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "点赞",
              "exampleTranslation": "bấm thích, thả tim",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l5-w20",
              "hanzi": "摄影师",
              "pinyin": "shè yǐng shī",
              "hanViet": "",
              "vietnamese": "nhiếp ảnh gia",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "摄影师",
              "exampleTranslation": "nhiếp ảnh gia",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w21",
              "hanzi": "水平",
              "pinyin": "shuǐ píng",
              "hanViet": "Thủy Bình",
              "vietnamese": "trình độ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "水平",
              "exampleTranslation": "trình độ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w22",
              "hanzi": "森林",
              "pinyin": "sēn lín",
              "hanViet": "Sâm Lâm",
              "vietnamese": "rừng rậm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "森林",
              "exampleTranslation": "rừng rậm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w23",
              "hanzi": "建议",
              "pinyin": "jiàn yì",
              "hanViet": "Kiến Nghị",
              "vietnamese": "kiến nghị, lời khuyên",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "建议",
              "exampleTranslation": "kiến nghị, lời khuyên",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l5-w24",
              "hanzi": "摆",
              "pinyin": "bǎi",
              "hanViet": "Bãi",
              "vietnamese": "bày biện, đặt để",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "摆",
              "exampleTranslation": "bày biện, đặt để",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l5-w25",
              "hanzi": "生动",
              "pinyin": "shēng dòng",
              "hanViet": "Sinh Động",
              "vietnamese": "sinh động",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "生动",
              "exampleTranslation": "sinh động",
              "tags": [
                  "Tính từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l5-ex1",
              "type": "multiple_choice",
              "question": "Điền từ bổ ngữ mức độ: '听到这个喜讯，大家高兴 ______。'",
              "options": [
                  "A. 极了",
                  "B. 挺好",
                  "C. 一样",
                  "D. 几乎"
              ],
              "correctAnswer": "A. 极了",
              "explanation": "高兴极了: vui mừng khôn xiết (bổ ngữ mức độ).",
              "grammarFocus": "Bổ ngữ 极了"
          },
          {
              "id": "hsk3-l5-ex2",
              "type": "fill_blank",
              "question": "Điền lượng từ thích hợp: '公园里的鲜花一 ______ 朵争奇斗艳。'",
              "options": [
                  "朵",
                  "张",
                  "条",
                  "本"
              ],
              "correctAnswer": "朵",
              "explanation": "Lượng từ của hoa là 朵 (duǒ). Lặp lại: 一朵朵.",
              "grammarFocus": "Lặp lại lượng từ"
          },
          {
              "id": "hsk3-l5-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "桌子上",
              "一杯",
              "摆着",
              "热茶"
              ],
              "question": "Sắp xếp câu: '桌子上 / 一杯 / 摆着 / 热茶'",
              "correctAnswer": "桌子上摆着一杯热茶。",
              "explanation": "Câu tồn hiện: Nơi chốn + Động từ + 着 + Tân ngữ.",
              "grammarFocus": "Câu tồn hiện"
          },
          {
              "id": "hsk3-l5-ex4",
              "type": "multiple_choice",
              "question": "Chọn liên từ: '下了课我们 ______ 去吃晚饭。'",
              "options": [
                  "A. 就",
                  "B. 才",
                  "C. 还",
                  "D. 又"
              ],
              "correctAnswer": "A. 就",
              "explanation": "Cấu trúc '……了……就……': xong việc gì là làm việc tiếp theo ngay.",
              "grammarFocus": "Cấu trúc ……了……就……"
          }
      ],
      "cultureBonus": {
          "title": "📸 Xu hướng chụp ảnh và 'Check-in' của giới trẻ Trung Quốc (打卡与修图)",
          "summary": "Giới trẻ Trung Quốc rất yêu thích phong cách chụp ảnh check-in và đăng mạng xã hội.",
          "content": "Từ '打卡' (dǎkǎ - điểm danh/check-in) và '朋友圈' (WeChat Moments) đã trở thành nét văn hóa đời sống phổ biến tại các thành phố lớn. Khi đi cà phê hay du lịch, việc chọn góc ánh sáng đẹp, chỉnh màu nhẹ nhàng để lưu lại khoảnh khắc thanh xuân là thói quen thú vị của nhiều bạn trẻ."
      }
  },
  // =========================================================================
  // LESSON 6: 高铁上还可以点外卖
  // =========================================================================
  {
      "lessonNumber": 6,
      "titleHanzi": "高铁上还可以点外卖",
      "titlePinyin": "Gāotiě shang hái kěyǐ diǎn wàimài",
      "titleVietnamese": "Trên tàu cao tốc còn có thể gọi đồ ăn mang về",
      "pageStart": 47,
      "objectives": [
          "Dùng cấu trúc '该……了' biểu thị đã đến lúc thực hiện hành động.",
          "Vận dụng câu điều kiện giả thiết '如果……，就……'.",
          "Dùng cụm cố định '越来越……' diễn tả sự biến đổi theo thời gian."
      ],
      "texts": [
          {
              "id": "hsk3-l6-t1",
              "title": "课文 1: 在火车站候车 (Bài khóa 1: Chờ tàu tại nhà ga)",
              "context": "在火车站候车室，刘明和王一雪等车。(Tại phòng chờ ga tàu hỏa, Lưu Minh và Vương Nhất Tuyết đợi tàu).",
              "lines": [
                  {
                      "speaker": "刘明",
                      "hanzi": "离发车还有半个小时，该检票了吧？",
                      "pinyin": "Lí fāchē hái yǒu bàn ge xiǎoshí, gāi jiǎnpiào le ba?",
                      "vietnamese": "Còn nửa tiếng nữa là tàu chạy rồi, chắc đến giờ soát vé rồi nhỉ?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "广播说再过五分钟开始检票。",
                      "pinyin": "Guǎngbō shuō zài guò wǔ fēnzhōng kāishǐ jiǎnpiào.",
                      "vietnamese": "Loa phát thanh vừa báo là năm phút nữa bắt đầu soát vé."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "现在的火车站修得越来越漂亮了，跟机场差不多。",
                      "pinyin": "Xiànzài de huǒchēzhàn xiū de yuèláiyuè piàoliang le, gēn jīchǎng chàbuduō.",
                      "vietnamese": "Ga tàu hỏa bây giờ xây dựng ngày càng đẹp đẽ, chẳng khác nào sân bay."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "是啊，高铁的速度也越来越快，到上海只要四个多小时。",
                      "pinyin": "Shì a, gāotiě de sùdù yě yuèláiyuè kuài, dào Shànghǎi zhǐ yào sì ge duō xiǎoshí.",
                      "vietnamese": "Đúng thế, tốc độ tàu cao tốc cũng ngày càng nhanh, đến Thượng Hải chỉ mất hơn bốn tiếng."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "如果路上想吃东西，车上有卖饭的吗？",
                      "pinyin": "Rúguǒ lùshang xiǎng chī dōngxi, chē shang yǒu mài fàn de ma?",
                      "vietnamese": "Nếu trên đường muốn ăn gì đó, trên tàu có bán cơm không chị?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "当然有，而且在高铁上还可以用手机点外卖呢！",
                      "pinyin": "Dāngrán yǒu, érqiě zài gāotiě shang hái kěyǐ yòng shǒujī diǎn wàimài ne!",
                      "vietnamese": "Đương nhiên là có chứ, hơn nữa trên tàu cao tốc còn có thể dùng điện thoại đặt đồ ăn giao tận nơi nữa đấy!"
                  }
              ]
          },
          {
              "id": "hsk3-l6-t2",
              "title": "课文 2: 车厢点外卖 (Bài khóa 2: Đặt đồ ăn trong toa tàu)",
              "context": "在高铁车厢里，刘明体验点外卖。(Trong toa tàu, Lưu Minh thử đặt đồ ăn giao tới).",
              "lines": [
                  {
                      "speaker": "刘明",
                      "hanzi": "我刚才在手机软件上查了，下一站是济南西站，真的能点济南的外卖！",
                      "pinyin": "Wǒ gāngcái zài shǒujī ruǎnjiàn shang chá le, xià yí zhàn shì Jǐnán Xī Zhàn, zhēnde néng diǎn Jǐnán de wàimài!",
                      "vietnamese": "Vừa rồi em tra trên ứng dụng điện thoại, ga tiếp theo là ga Tế Nam Tây, thật sự đặt được món ăn của Tế Nam luôn này!"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "对啊，如果你现在下单，到了济南站，外卖员就会把热乎乎的饭送到车厢门口。",
                      "pinyin": "Duì a, rúguǒ nǐ xiànzài xiàdān, dào le Jǐnán Zhàn, wàimàiyuán jiù huì bǎ rèhūhū de fàn sòng dào chēxiāng ménkǒu.",
                      "vietnamese": "Đúng vậy, nếu bây giờ em đặt đơn, tới ga Tế Nam là nhân viên giao hàng sẽ mang bữa cơm nóng sốt tới tận cửa toa tàu."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "太神奇了！我要一份把子肉套餐，你想吃什么？",
                      "pinyin": "Tài shénqí le! Wǒ yào yí fèn bǎziròu tàocān, nǐ xiǎng chī shénme?",
                      "vietnamese": "Vi diệu quá đi mất! Em gọi một suất cơm thịt kho bả tử nhục, chị muốn ăn gì nào?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "我要一份蔬菜沙拉和一杯热豆浆。",
                      "pinyin": "Wǒ yào yí fèn shūcài shālā hé yì bēi rè dòujiāng.",
                      "vietnamese": "Chị gọi một phần salad rau củ và một cốc sữa đậu nành nóng."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "好了，下单成功！现代科技真是越来越发达了。",
                      "pinyin": "Hǎo le, xiàdān chénggōng! Xiàndài kējì zhēn shì yuèláiyuè fādá le.",
                      "vietnamese": "Xong rồi, đặt đơn thành công! Khoa học công nghệ hiện đại đúng là ngày càng phát triển."
                  }
              ]
          },
          {
              "id": "hsk3-l6-t3",
              "title": "课文 3: 乘务员送餐 (Bài khóa 3: Tiếp viên mang suất ăn tới)",
              "context": "在高铁上，乘务员送外卖。(Trên tàu, tiếp viên trao bữa ăn cho hành khách).",
              "lines": [
                  {
                      "speaker": "乘务员",
                      "hanzi": "请问哪位是7车厢12A的刘先生？",
                      "pinyin": "Qǐngwèn nǎ wèi shì qī chēxiāng shí'èr A de Liú xiānsheng?",
                      "vietnamese": "Xin hỏi ai là anh Lưu ở số ghế 12A toa số 7 ạ?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "我是！",
                      "pinyin": "Wǒ shì!",
                      "vietnamese": "Dạ là tôi!"
                  },
                  {
                      "speaker": "乘务员",
                      "hanzi": "这是您在济南站订的外卖，请拿好，小心烫。",
                      "pinyin": "Zhè shì nín zài Jǐnán Zhàn dìng de wàimài, qǐng ná hǎo, xiǎoxīn tàng.",
                      "vietnamese": "Đây là suất đồ ăn anh đặt tại ga Tế Nam, xin anh cầm chắc, cẩn thận bỏng ạ."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "谢谢您，这么快就送到了！",
                      "pinyin": "Xièxie nín, zhème kuài jiù sòngdào le!",
                      "vietnamese": "Cảm ơn chị nhiều, nhanh thế mà đã giao đến rồi!"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "闻起来真香啊，快尝尝正宗的把子肉！",
                      "pinyin": "Wén qǐlai zhēn xiāng a, kuài chángchang zhèngzōng de bǎziròu!",
                      "vietnamese": "Ngửi mùi thơm lừng luôn, nếm thử món thịt kho chính hiệu mau đi em!"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "味道好极了，肥而不腻，如果每次坐高铁都能吃上地方特色菜，那旅行就太美好了。",
                      "pinyin": "Wèidao hǎo jí le, féi ér bú nì, rúguǒ měi cì zuò gāotiě dōu néng chīshàng dìfāng tèsècài, nà lǚxíng jiù tài měihǎo le.",
                      "vietnamese": "Vị ngon tuyệt vời, béo mà không ngấy, nếu mỗi lần đi tàu cao tốc đều được ăn đặc sản các vùng miền thế này thì chuyến đi tuyệt vời biết bao."
                  }
              ]
          },
          {
              "id": "hsk3-l6-t4",
              "title": "课文 4: 中国高铁日记 (Bài khóa 4: Nhật ký tàu cao tốc Trung Quốc)",
              "context": "在日记中，刘明记录中国高铁的发展。(Lưu Minh ghi chép về đường sắt cao tốc).",
              "lines": [
                  {
                      "speaker": "刘明",
                      "hanzi": "今天我和一雪坐高铁去上海出差。一路上列车运行得非常平稳，桌上的水杯连一点儿晃动都没有。",
                      "pinyin": "Jīntiān wǒ hé Yīxuě zuò gāotiě qù Shànghǎi chūchāi. Yílù shang lièchē yùnxíng de fēicháng píngwěn, zhuō shang de shuǐbēi lián yìdiǎnr huàngdòng dōu méiyǒu.",
                      "vietnamese": "Hôm nay tôi và Nhất Tuyết đi tàu cao tốc đến Thượng Hải công tác. Suốt dọc đường đoàn tàu chạy vô cùng êm ả, ly nước trên bàn đến một chút lay động cũng không có."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "窗外的风景像画卷一样飞速掠过。最让我惊叹的是，在时速三百五十公里的列车上，不仅网络信号非常好，还能点沿途各站的外卖。",
                      "pinyin": "Chuāngwài de fēngjǐng xiàng huàjuàn yíyàng fēisù lüèguò. Zuì ràng wǒ jīngtàn de shì, zài shísù sānbǎi wǔshí gōnglǐ de lièchē shang, bùjǐn wǎngluò xìnhào fēicháng hǎo, hái néng diǎn yántú gè zhàn de wàimài.",
                      "vietnamese": "Phong cảnh ngoài cửa sổ như bức tranh cuộn lướt qua nhanh như bay. Điều khiến tôi kinh ngạc nhất là trên đoàn tàu chạy với vận tốc 350 km/h, không chỉ sóng mạng internet rất tốt mà còn có thể gọi đồ ăn của từng nhà ga dọc đường."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "中国的高铁网络越来越密集，人民的生活也越来越便利。如果世界上每个国家的交通都这么发达，人们的出行该多么幸福啊！",
                      "pinyin": "Zhōngguó de gāotiě wǎngluò yuèláiyuè mījì, rénmín de shēnghuó yě yuèláiyuè biànlì. Rúguǒ shìjiè shang měi ge guójiā de jiāotōng dōu zhème fādá, rénmen de chūxíng gāi duōme xìngfú a!",
                      "vietnamese": "Mạng lưới đường sắt cao tốc của Trung Quốc ngày càng dày đặc, đời sống của người dân cũng ngày càng tiện lợi. Nếu như giao thông của mọi quốc gia trên thế giới đều phát triển như thế này thì việc đi lại của con người sẽ hạnh phúc biết bao!"
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l6-g1",
              "title": "1. 固定格式“该……了” (Cấu trúc 'Đã đến lúc / Phải... rồi')",
              "explanation": "Dùng để biểu thị một thời điểm hoặc sự việc đã đến lúc cần phải làm.",
              "examples": [
                  {
                      "hanzi": "该检票了吧？",
                      "pinyin": "Gāi jiǎnpiào le ba?",
                      "vietnamese": "Đã đến lúc soát vé rồi nhỉ?"
                  },
                  {
                      "hanzi": "时间不早了，我们该出发了。",
                      "pinyin": "Shíjiān bù zǎo le, wǒmen gāi chūfā le.",
                      "vietnamese": "Thời gian không còn sớm nữa, chúng ta phải xuất phát rồi."
                  }
              ]
          },
          {
              "id": "hsk3-l6-g2",
              "title": "2. 假设复句“如果……，就……” (Câu điều kiện giả thiết: 'Nếu... thì...')",
              "explanation": "Phân câu trước nêu giả thiết với '如果', phân câu sau chỉ ra kết quả kéo theo với '就'.",
              "examples": [
                  {
                      "hanzi": "如果你现在下单，到了车站就能拿到饭。",
                      "pinyin": "Rúguǒ nǐ xiànzài xiàdān, dào le chēzhàn jiù néng nádào fàn.",
                      "vietnamese": "Nếu em đặt đơn bây giờ thì đến nhà ga là nhận được cơm ngay."
                  },
                  {
                      "hanzi": "如果明天下雨，比赛就推迟。",
                      "pinyin": "Rúguǒ míngtiān xiàyǔ, bǐsài jiù tuīchí.",
                      "vietnamese": "Nếu ngày mai trời mưa thì trận đấu sẽ hoãn lại."
                  }
              ]
          },
          {
              "id": "hsk3-l6-g3",
              "title": "3. 固定短语“越来越……” (Cụm cố định 'Ngày càng...')",
              "explanation": "Đứng trước tính từ hoặc động từ tâm lý để biểu thị mức độ biến đổi tăng dần theo thời gian.",
              "examples": [
                  {
                      "hanzi": "高铁的速度越来越快。",
                      "pinyin": "Gāotiě de sùdù yuèláiyuè kuài.",
                      "vietnamese": "Tốc độ của tàu cao tốc ngày càng nhanh."
                  },
                  {
                      "hanzi": "科技真是越来越发达了。",
                      "pinyin": "Kējì zhēn shì yuèláiyuè fādá le.",
                      "vietnamese": "Khoa học công nghệ quả thực ngày càng phát triển."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l6-w1",
              "hanzi": "高铁",
              "pinyin": "gāo tiě",
              "hanViet": "Cao Thiết",
              "vietnamese": "tàu hỏa cao tốc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "高铁",
              "exampleTranslation": "tàu hỏa cao tốc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w2",
              "hanzi": "发车",
              "pinyin": "fā chē",
              "hanViet": "",
              "vietnamese": "xe/tàu khởi hành",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "发车",
              "exampleTranslation": "xe/tàu khởi hành",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l6-w3",
              "hanzi": "检票",
              "pinyin": "jiǎn piào",
              "hanViet": "Kiểm Phiếu",
              "vietnamese": "soát vé",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "检票",
              "exampleTranslation": "soát vé",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l6-w4",
              "hanzi": "广播",
              "pinyin": "guǎng bō",
              "hanViet": "Quảng Bá",
              "vietnamese": "phát thanh, loa đài",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "广播",
              "exampleTranslation": "phát thanh, loa đài",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w5",
              "hanzi": "速度",
              "pinyin": "sù dù",
              "hanViet": "Tốc Độ",
              "vietnamese": "tốc độ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "速度",
              "exampleTranslation": "tốc độ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w6",
              "hanzi": "差不多",
              "pinyin": "chà bu duō",
              "hanViet": "Soa Bất Đa",
              "vietnamese": "xấp xỉ, tương đương",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "差不多",
              "exampleTranslation": "xấp xỉ, tương đương",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l6-w7",
              "hanzi": "车厢",
              "pinyin": "chē xiāng",
              "hanViet": "Xa Sương",
              "vietnamese": "toa xe, toa tàu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "车厢",
              "exampleTranslation": "toa xe, toa tàu",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w8",
              "hanzi": "软件",
              "pinyin": "ruǎn jiàn",
              "hanViet": "Nhuyễn Kiện",
              "vietnamese": "phần mềm, ứng dụng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "软件",
              "exampleTranslation": "phần mềm, ứng dụng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w9",
              "hanzi": "下单",
              "pinyin": "xià dān",
              "hanViet": "Hạ Đan",
              "vietnamese": "đặt đơn hàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "下单",
              "exampleTranslation": "đặt đơn hàng",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l6-w10",
              "hanzi": "神奇",
              "pinyin": "shén qí",
              "hanViet": "Thần Kì",
              "vietnamese": "thần kỳ, kỳ diệu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "神奇",
              "exampleTranslation": "thần kỳ, kỳ diệu",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l6-w11",
              "hanzi": "套餐",
              "pinyin": "tào cān",
              "hanViet": "Sáo Xan",
              "vietnamese": "suất ăn theo set, combo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "套餐",
              "exampleTranslation": "suất ăn theo set, combo",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w12",
              "hanzi": "蔬菜",
              "pinyin": "shū cài",
              "hanViet": "Sơ Thái",
              "vietnamese": "rau củ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "蔬菜",
              "exampleTranslation": "rau củ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w13",
              "hanzi": "沙拉",
              "pinyin": "shā lā",
              "hanViet": "",
              "vietnamese": "món salad",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "沙拉",
              "exampleTranslation": "món salad",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w14",
              "hanzi": "豆浆",
              "pinyin": "dòu jiāng",
              "hanViet": "Đậu Tương",
              "vietnamese": "sữa đậu nành",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "豆浆",
              "exampleTranslation": "sữa đậu nành",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w15",
              "hanzi": "科技",
              "pinyin": "kē jì",
              "hanViet": "Khoa Kĩ",
              "vietnamese": "khoa học công nghệ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "科技",
              "exampleTranslation": "khoa học công nghệ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w16",
              "hanzi": "发达",
              "pinyin": "fā dá",
              "hanViet": "Phát Đạt",
              "vietnamese": "phát đạt, phát triển",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "发达",
              "exampleTranslation": "phát đạt, phát triển",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l6-w17",
              "hanzi": "乘务员",
              "pinyin": "chéng wù yuán",
              "hanViet": "Thừa Vụ Viên",
              "vietnamese": "nhân viên phục vụ trên tàu xe",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "乘务员",
              "exampleTranslation": "nhân viên phục vụ trên tàu xe",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l6-w18",
              "hanzi": "烫",
              "pinyin": "tàng",
              "hanViet": "Năng",
              "vietnamese": "nóng, bỏng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "烫",
              "exampleTranslation": "nóng, bỏng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l6-w19",
              "hanzi": "闻",
              "pinyin": "wén",
              "hanViet": "Văn",
              "vietnamese": "ngửi thấy",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "闻",
              "exampleTranslation": "ngửi thấy",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l6-w20",
              "hanzi": "正宗",
              "pinyin": "zhèng zōng",
              "hanViet": "",
              "vietnamese": "chính tông, chuẩn vị",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "正宗",
              "exampleTranslation": "chính tông, chuẩn vị",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l6-w21",
              "hanzi": "出差",
              "pinyin": "chū chāi",
              "hanViet": "Xuất Soa",
              "vietnamese": "đi công tác",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "出差",
              "exampleTranslation": "đi công tác",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l6-w22",
              "hanzi": "平稳",
              "pinyin": "píng wěn",
              "hanViet": "",
              "vietnamese": "êm ái, bằng phẳng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "平稳",
              "exampleTranslation": "êm ái, bằng phẳng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l6-w23",
              "hanzi": "晃动",
              "pinyin": "huàng dòng",
              "hanViet": "",
              "vietnamese": "rung lắc, chao đảo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "晃动",
              "exampleTranslation": "rung lắc, chao đảo",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l6-w24",
              "hanzi": "便利",
              "pinyin": "biàn lì",
              "hanViet": "Tiện Lợi",
              "vietnamese": "tiện lợi, thuận tiện",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "便利",
              "exampleTranslation": "tiện lợi, thuận tiện",
              "tags": [
                  "Tính từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l6-ex1",
              "type": "multiple_choice",
              "question": "Điền cấu trúc thích hợp: '天黑了，我们 ______ 回宿舍了。'",
              "options": [
                  "A. 该……了",
                  "B. 越……越……",
                  "C. 一边……一边……",
                  "D. 不但……而且……"
              ],
              "correctAnswer": "A. 该……了",
              "explanation": "Cấu trúc '该……了' biểu thị đã tới lúc phải làm gì.",
              "grammarFocus": "Cấu trúc 该……了"
          },
          {
              "id": "hsk3-l6-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '现代城市的交通越 ______ 越便利。'",
              "options": [
                  "来",
                  "去",
                  "过",
                  "到"
              ],
              "correctAnswer": "来",
              "explanation": "越来越 (yuèláiyuè): ngày càng.",
              "grammarFocus": "Cụm 越来越"
          },
          {
              "id": "hsk3-l6-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "如果你喜欢",
              "就买下来",
              "这件衣服",
              "吧"
              ],
              "question": "Sắp xếp câu: '如果你喜欢 / 就买下来 / 这件衣服 / 吧'",
              "correctAnswer": "如果你喜欢这件衣服就买下来吧。",
              "explanation": "Cấu trúc: 如果……就…… biểu thị quan hệ điều kiện giả thiết.",
              "grammarFocus": "Cấu trúc 如果……就……"
          },
          {
              "id": "hsk3-l6-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '列车行驶得非常 ______，杯子里的水一点儿都没洒出来。'",
              "options": [
                  "A. 平稳",
                  "B. 麻烦",
                  "C. 糊涂",
                  "D. 难过"
              ],
              "correctAnswer": "A. 平稳",
              "explanation": "行驶平稳: di chuyển êm ả, vững vàng.",
              "grammarFocus": "Từ vựng Bài 6"
          }
      ],
      "cultureBonus": {
          "title": "🚄 Tàu cao tốc Trung Quốc - 'Danh thiếp quốc gia' (中国高铁网)",
          "summary": "Mạng lưới đường sắt cao tốc Trung Quốc (中国高铁) là hệ thống đường sắt cao tốc lớn nhất thế giới.",
          "content": "Với vận tốc lên tới 350 km/h của dòng tàu Phục Hưng (复兴号) cùng dịch vụ đặt món ăn đặc sản dọc đường giao tận chỗ ngồi, đi tàu cao tốc đã trở thành phương tiện di chuyển ưu tiên số 1 của người dân Trung Quốc, nối liền các đại đô thị chỉ trong vài giờ đồng hồ."
      }
  },
  // =========================================================================
  // LESSON 7: 那条裙子比短裤更好看
  // =========================================================================
  {
      "lessonNumber": 7,
      "titleHanzi": "那条裙子比短裤更好看",
      "titlePinyin": "Nà tiáo qúnzi bǐ duǎnkù gèng hǎokàn",
      "titleVietnamese": "Chiếc váy đó đẹp hơn quần soóc",
      "pageStart": 57,
      "objectives": [
          "Dùng câu liên động (2) miêu tả chuỗi hành động hoặc phương thức.",
          "Vận dụng câu so sánh hơn '比' kết hợp '更/还'.",
          "Dùng câu phức tăng tiến '不但……，而且……'."
      ],
      "texts": [
          {
              "id": "hsk3-l7-t1",
              "title": "课文 1: 挑选夏装 (Bài khóa 1: Chọn trang phục hè)",
              "context": "在服装店，王一雪和刘明挑衣服。(Tại tiệm thời trang, Vương Nhất Tuyết và Lưu Minh chọn đồ).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "刘明，你看这件短袖衬衫怎么样？",
                      "pinyin": "Liú Míng, nǐ kàn zhè jiàn duǎnxiù chènshān zěnmeyàng?",
                      "vietnamese": "Lưu Minh, anh xem chiếc áo sơ mi cộc tay này thế nào?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "颜色挺素雅的，很适合你。",
                      "pinyin": "Yánsè tǐng sùyǎ de, hěn shìhé nǐ.",
                      "vietnamese": "Màu sắc khá nhã nhặn, rất hợp với em."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "我想再挑一条裙子，那条蓝色的百褶裙好看，还是这条白色的短裤好看？",
                      "pinyin": "Wǒ xiǎng zài tiāo yì tiáo qúnzi, nà tiáo lánsè de bǎizhěqún hǎokàn, háishì zhè tiáo báisè de duǎnkù hǎokàn?",
                      "vietnamese": "Em muốn chọn thêm một chiếc váy nữa, chiếc váy xếp ly màu xanh kia đẹp hơn hay chiếc quần soóc trắng này đẹp hơn?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "我觉得那条裙子比短裤更好看，穿起来显得更有气质。",
                      "pinyin": "Wǒ juéde nà tiáo qúnzi bǐ duǎnkù gèng hǎokàn, chuān qǐlai xiǎnde gèng yǒu qìzhì.",
                      "vietnamese": "Anh thấy chiếc váy đó đẹp hơn quần soóc, mặc lên trông thanh lịch và có khí chất hơn."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "那我拿去试衣间试穿一下。",
                      "pinyin": "Nà wǒ ná qù shìyījiān shìchuān yíxià.",
                      "vietnamese": "Vậy em cầm vào phòng thử đồ mặc thử xem sao nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l7-t2",
              "title": "课文 2: 试穿效果 (Bài khóa 2: Hiệu quả sau khi thử đồ)",
              "context": "在试衣镜前，王一雪征求刘明的意见。(Trước gương thử đồ, hỏi ý kiến).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "怎么样？合适吗？",
                      "pinyin": "Zěnmeyàng? Héshì ma?",
                      "vietnamese": "Thế nào anh? Vừa vặn không ạ?"
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "太合适了！不但显瘦，而且显得个子更高了。",
                      "pinyin": "Tài héshì le! Búdàn xiǎn shòu, érqiě xiǎnde gèzi gèng gāo le.",
                      "vietnamese": "Vừa vặn quá đi chứ! Không những trông thon gọn mà còn tôn dáng cao ráo hơn nữa."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "这条裙子的料子摸起来软软的，舒服极了。",
                      "pinyin": "Zhè tiáo qúnzi de liàozi mō qǐlai ruǎnruǎn de, shūfu jí le.",
                      "vietnamese": "Chất vải của chiếc váy này sờ vào mềm mịn, dễ chịu vô cùng."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "价格贵不贵？",
                      "pinyin": "Jiàgé guì bu guì?",
                      "vietnamese": "Giá cả có đắt không em?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "原价五百块，现在打七折，比原来便宜多了。",
                      "pinyin": "Yuánjià wǔbǎi kuài, xiànzài dǎ qī zhé, bǐ yuánlái piányi duō le.",
                      "vietnamese": "Giá gốc năm trăm tệ, bây giờ giảm giá 30%, rẻ hơn ban đầu nhiều lắm."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "那就买这条吧！",
                      "pinyin": "Nà jiù mǎi zhè tiáo ba!",
                      "vietnamese": "Vậy thì lấy chiếc này đi!"
                  }
              ]
          },
          {
              "id": "hsk3-l7-t3",
              "title": "课文 3: 选购男装 (Bài khóa 3: Mua đồ nam cho Lưu Minh)",
              "context": "在男装区，王一雪帮刘明选衣服。(Tại khu đồ nam, chọn trang phục).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "你也买一件吧，你身上那件夹克穿了好几年了。",
                      "pinyin": "Nǐ yě mǎi yí jiàn ba, nǐ shēnshang nà jiàn jiákè chuān le hǎo jǐ nián le.",
                      "vietnamese": "Anh cũng mua một chiếc đi, chiếc áo khoác trên người anh mặc mấy năm trời rồi đấy."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "我觉得这件还可以穿嘛，不用买新的。",
                      "pinyin": "Wǒ juéde zhè jiàn hái kěyǐ chuān ma, bú yòng mǎi xīn de.",
                      "vietnamese": "Anh thấy cái này vẫn còn mặc tốt mà, không cần mua mới đâu."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "你看这件深蓝色的西装，样式比你原来那件新颖得多。",
                      "pinyin": "Nǐ kàn zhè jiàn shēnlánsè de xīzhuāng, yàngshì bǐ nǐ yuánlái nà jiàn xīnyǐng de duō.",
                      "vietnamese": "Anh xem bộ vest màu xanh đậm này này, kiểu dáng mới mẻ hơn bộ cũ của anh nhiều."
                  },
                  {
                      "speaker": "刘明",
                      "hanzi": "试一下倒可以……咦，穿着挺合身，一点儿也不紧。",
                      "pinyin": "Shì yíxià dào kěyǐ... Yí, chuānzhe tǐng héshēn, yìdiǎnr yě bù jǐn.",
                      "vietnamese": "Thử một chút thì cũng được... Ôi, mặc vừa vặn phết, chẳng bị chật chút nào."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "先生穿这套不但帅气，而且很有精神，一起买了吧！",
                      "pinyin": "Xiānsheng chuān zhè tào búdàn shuàiqì, érqiě hěn yǒu jīngshen, yìqǐ mǎi le ba!",
                      "vietnamese": "Anh mặc bộ này không những đẹp trai mà còn rất phong độ sáng sủa, mua luôn cả bộ này nhé!"
                  }
              ]
          },
          {
              "id": "hsk3-l7-t4",
              "title": "课文 4: 购物日记 (Bài khóa 4: Nhật ký mua sắm)",
              "context": "在日记中，王一雪写购物心得。(Nhật ký chia sẻ trải nghiệm mua sắm).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "今天下午我和刘明去商场逛街。换季的时候商场里打折的衣服特别多。",
                      "pinyin": "Jīntiān xiàwǔ wǒ hé Liú Míng qù shāngchǎng guàngjiē. Huànjì de shíhou shāngchǎng lǐ dǎzhé de yīfu tèbié duō.",
                      "vietnamese": "Chiều nay tôi và Lưu Minh đi trung tâm thương mại dạo phố. Vào dịp chuyển mùa quần áo giảm giá trong trung tâm thương mại nhiều vô kể."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "我挑了一条心仪已久的蓝色长裙，试穿之后效果比我想象的还要好得多。",
                      "pinyin": "Wǒ tiāo le yì tiáo xīnyí yǐ jiǔ de lánsè chángqún, shìchuān zhīhòu xiàoguǒ bǐ wǒ xiǎngxiàng de hái yào hǎo de duō.",
                      "vietnamese": "Tôi đã chọn một chiếc váy dài màu xanh mà mình yêu thích bấy lâu, sau khi thử đồ hiệu quả còn đẹp hơn cả tưởng tượng của tôi rất nhiều."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "不仅如此，我还给刘明选了一套得体的西装。刘明平时总舍不得给自己买好衣服，但今天换上新西装后，整个人看上去精神多了。",
                      "pinyin": "Bùjǐn rúcǐ, wǒ hái gěi Liú Míng xuǎn le yí tào détǐ de xīzhuāng. Liú Míng píngshí zǒng shěbude gěi zìjǐ mǎi hǎo yīfu, dàn jīntiān huànshang xīn xīzhuāng hòu, zhěng ge rén kàn shàngqu jīngshen duō le.",
                      "vietnamese": "Không những thế, tôi còn chọn cho Lưu Minh một bộ âu phục rất vừa mắt. Ngày thường anh ấy luôn tiếc tiền không nỡ mua đồ tốt cho mình, nhưng hôm nay sau khi khoác lên bộ vest mới, cả người trông phong độ hơn hẳn."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "买到了喜欢的衣服，又享受了折扣，今天的购物经历真是太愉快了！",
                      "pinyin": "Mǎidào le xǐhuan de yīfu, yòu xiǎngshòu le zhékòu, jīntiān de gòuwù jīnglì zhēn shì tài yúkuài le!",
                      "vietnamese": "Mua được trang phục ưng ý, lại được hưởng ưu đãi giảm giá, trải nghiệm mua sắm hôm nay quả thực vô cùng vui vẻ!"
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l7-g1",
              "title": "1. 连动句（2） (Câu liên động biểu thị phương thức, mục đích)",
              "explanation": "Động từ 1 biểu thị phương thức hoặc hành động chuẩn bị để thực hiện động từ 2.",
              "examples": [
                  {
                      "hanzi": "我拿去试衣间试穿一下。",
                      "pinyin": "Wǒ ná qù shìyījiān shìchuān yíxià.",
                      "vietnamese": "Em cầm vào phòng thử đồ mặc thử một chút."
                  },
                  {
                      "hanzi": "我们去商场逛街买衣服。",
                      "pinyin": "Wǒmen qù shāngchǎng guàngjiē mǎi yīfu.",
                      "vietnamese": "Chúng tôi đi trung tâm thương mại dạo phố mua quần áo."
                  }
              ]
          },
          {
              "id": "hsk3-l7-g2",
              "title": "2. 比较句（10）“A 比 B 更/还……” (Câu so sánh hơn có '更/还')",
              "explanation": "Thêm '更' hoặc '还' trước vị ngữ của câu chữ '比' để nhấn mạnh mức độ vượt trội hơn nữa trên nền tảng sẵn có.",
              "examples": [
                  {
                      "hanzi": "那条裙子比短裤更好看。",
                      "pinyin": "Nà tiáo qúnzi bǐ duǎnkù gèng hǎokàn.",
                      "vietnamese": "Chiếc váy kia đẹp hơn chiếc quần soóc."
                  },
                  {
                      "hanzi": "效果比我想象的还要好得多。",
                      "pinyin": "Xiàoguǒ bǐ wǒ xiǎngxiàng de hái yào hǎo de duō.",
                      "vietnamese": "Hiệu quả còn tốt hơn tưởng tượng của tôi nhiều."
                  }
              ]
          },
          {
              "id": "hsk3-l7-g3",
              "title": "3. 程度补语（3）“多了 / 得多” (Bổ ngữ mức độ biểu thị chênh lệch lớn)",
              "explanation": "Đứng sau tính từ so sánh để diễn tả sự cách biệt rất lớn giữa hai đối tượng.",
              "examples": [
                  {
                      "hanzi": "比原来便宜多了。",
                      "pinyin": "Bǐ yuánlái piányi duō le.",
                      "vietnamese": "Rẻ hơn so với ban đầu nhiều lắm."
                  },
                  {
                      "hanzi": "样式比你原来那件新颖得多。",
                      "pinyin": "Yàngshì bǐ nǐ yuánlái nà jiàn xīnyǐng de duō.",
                      "vietnamese": "Kiểu dáng mới mẻ hơn cái cũ của anh nhiều."
                  }
              ]
          },
          {
              "id": "hsk3-l7-g4",
              "title": "4. 递进复句“不但……，而且……” (Câu phức tăng tiến 'Không những... mà còn...')",
              "explanation": "Biểu thị vế sau có mức độ tiến xa hơn, sâu sắc hơn so với vế trước.",
              "examples": [
                  {
                      "hanzi": "不但显瘦，而且显得个子更高了。",
                      "pinyin": "Búdàn xiǎn shòu, érqiě xiǎnde gèzi gèng gāo le.",
                      "vietnamese": "Không những tôn dáng thon thả mà còn trông cao hơn."
                  },
                  {
                      "hanzi": "穿这套不但帅气，而且很有精神。",
                      "pinyin": "Chuān zhè tào búdàn shuàiqì, érqiě hěn yǒu jīngshen.",
                      "vietnamese": "Mặc bộ này không những bảnh bao mà còn rất có tinh thần."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l7-w1",
              "hanzi": "短袖",
              "pinyin": "duǎn xiù",
              "hanViet": "",
              "vietnamese": "áo cộc tay, ngắn tay",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "短袖",
              "exampleTranslation": "áo cộc tay, ngắn tay",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w2",
              "hanzi": "衬衫",
              "pinyin": "chèn shān",
              "hanViet": "Sấn Sam",
              "vietnamese": "áo sơ mi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "衬衫",
              "exampleTranslation": "áo sơ mi",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w3",
              "hanzi": "素雅",
              "pinyin": "sù yǎ",
              "hanViet": "",
              "vietnamese": "nhã nhặn, thanh lịch",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "素雅",
              "exampleTranslation": "nhã nhặn, thanh lịch",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w4",
              "hanzi": "裙子",
              "pinyin": "qún zi",
              "hanViet": "Quần Tử",
              "vietnamese": "váy",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "裙子",
              "exampleTranslation": "váy",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w5",
              "hanzi": "短裤",
              "pinyin": "duǎn kù",
              "hanViet": "Đoản Khố",
              "vietnamese": "quần soóc, quần cộc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "短裤",
              "exampleTranslation": "quần soóc, quần cộc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w6",
              "hanzi": "显得",
              "pinyin": "xiǎn de",
              "hanViet": "Hiển Đắc",
              "vietnamese": "lộ rõ, trông có vẻ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "显得",
              "exampleTranslation": "lộ rõ, trông có vẻ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l7-w7",
              "hanzi": "气质",
              "pinyin": "qì zhì",
              "hanViet": "Khí Chất",
              "vietnamese": "khí chất",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "气质",
              "exampleTranslation": "khí chất",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w8",
              "hanzi": "试衣间",
              "pinyin": "shì yī jiān",
              "hanViet": "",
              "vietnamese": "phòng thử đồ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "试衣间",
              "exampleTranslation": "phòng thử đồ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w9",
              "hanzi": "试穿",
              "pinyin": "shì chuān",
              "hanViet": "",
              "vietnamese": "mặc thử",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "试穿",
              "exampleTranslation": "mặc thử",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l7-w10",
              "hanzi": "料子",
              "pinyin": "liào zi",
              "hanViet": "",
              "vietnamese": "chất liệu vải",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "料子",
              "exampleTranslation": "chất liệu vải",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w11",
              "hanzi": "摸",
              "pinyin": "mō",
              "hanViet": "Mạc",
              "vietnamese": "sờ, chạm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "摸",
              "exampleTranslation": "sờ, chạm",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l7-w12",
              "hanzi": "软",
              "pinyin": "ruǎn",
              "hanViet": "Nhuyễn",
              "vietnamese": "mềm mại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "软",
              "exampleTranslation": "mềm mại",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w13",
              "hanzi": "原价",
              "pinyin": "yuán jià",
              "hanViet": "",
              "vietnamese": "giá gốc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "原价",
              "exampleTranslation": "giá gốc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w14",
              "hanzi": "折扣",
              "pinyin": "zhé kòu",
              "hanViet": "Chiết Khấu",
              "vietnamese": "mức giảm giá",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "折扣",
              "exampleTranslation": "mức giảm giá",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w15",
              "hanzi": "夹克",
              "pinyin": "jiá kè",
              "hanViet": "",
              "vietnamese": "áo khoác jacket",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "夹克",
              "exampleTranslation": "áo khoác jacket",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w16",
              "hanzi": "西装",
              "pinyin": "xī zhuāng",
              "hanViet": "Tây Trang",
              "vietnamese": "âu phục, bộ vest",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "西装",
              "exampleTranslation": "âu phục, bộ vest",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w17",
              "hanzi": "样式",
              "pinyin": "yàng shì",
              "hanViet": "Dạng Thức",
              "vietnamese": "kiểu dáng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "样式",
              "exampleTranslation": "kiểu dáng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w18",
              "hanzi": "新颖",
              "pinyin": "xīn yǐng",
              "hanViet": "Tân Dĩnh",
              "vietnamese": "mới mẻ, tân kỳ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "新颖",
              "exampleTranslation": "mới mẻ, tân kỳ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w19",
              "hanzi": "合身",
              "pinyin": "hé shēn",
              "hanViet": "",
              "vietnamese": "vừa vặn với người",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "合身",
              "exampleTranslation": "vừa vặn với người",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w20",
              "hanzi": "紧",
              "pinyin": "jǐn",
              "hanViet": "Khẩn",
              "vietnamese": "chật, bó sát",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "紧",
              "exampleTranslation": "chật, bó sát",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w21",
              "hanzi": "帅气",
              "pinyin": "shuài qì",
              "hanViet": "",
              "vietnamese": "đẹp trai, bảnh bao",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "帅气",
              "exampleTranslation": "đẹp trai, bảnh bao",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w22",
              "hanzi": "精神",
              "pinyin": "jīng shén",
              "hanViet": "Tinh Thần",
              "vietnamese": "phong độ, tinh thần",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "精神",
              "exampleTranslation": "phong độ, tinh thần",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l7-w23",
              "hanzi": "商场",
              "pinyin": "shāng chǎng",
              "hanViet": "Thương Tràng",
              "vietnamese": "trung tâm mua sắm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "商场",
              "exampleTranslation": "trung tâm mua sắm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l7-w24",
              "hanzi": "换季",
              "pinyin": "huàn jì",
              "hanViet": "",
              "vietnamese": "chuyển mùa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "换季",
              "exampleTranslation": "chuyển mùa",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l7-w25",
              "hanzi": "愉快",
              "pinyin": "yú kuài",
              "hanViet": "Du Khoái",
              "vietnamese": "vui vẻ, hân hoan",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "愉快",
              "exampleTranslation": "vui vẻ, hân hoan",
              "tags": [
                  "Tính từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l7-ex1",
              "type": "multiple_choice",
              "question": "Điền từ so sánh: '今天的天气比昨天 ______ 冷得多。'",
              "options": [
                  "A. 更",
                  "B. 很",
                  "C. 太",
                  "D. 极"
              ],
              "correctAnswer": "A. 更",
              "explanation": "Trong câu chữ 比, có thể dùng '更' hoặc '还' để bổ nghĩa cho tính từ.",
              "grammarFocus": "Câu chữ 比 kết hợp 更"
          },
          {
              "id": "hsk3-l7-ex2",
              "type": "fill_blank",
              "question": "Điền liên từ thích hợp: '他 ______ 会唱歌，而且跳舞也跳得极好。'",
              "options": [
                  "不但",
                  "因为",
                  "虽然",
                  "如果"
              ],
              "correctAnswer": "不但",
              "explanation": "Cặp liên từ tăng tiến: 不但……，而且……",
              "grammarFocus": "Cặp liên từ 不但……而且……"
          },
          {
              "id": "hsk3-l7-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "便宜多了",
              "现在的价格",
              "比原来"
              ],
              "question": "Sắp xếp câu: '便宜多了 / 现在的价格 / 比原来'",
              "correctAnswer": "现在的价格比原来便宜多了。",
              "explanation": "Cấu trúc: A + 比 + B + Tính từ + 多了.",
              "grammarFocus": "Bổ ngữ 多了 trong câu so sánh"
          },
          {
              "id": "hsk3-l7-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '这件衣服穿在你身上非常 ______，一点儿都不显胖。'",
              "options": [
                  "A. 合身",
                  "B. 糊涂",
                  "C. 方便",
                  "D. 认真"
              ],
              "correctAnswer": "A. 合身",
              "explanation": "合身 (héshēn): vừa vặn với vóc dáng.",
              "grammarFocus": "Từ vựng Bài 7"
          }
      ],
      "cultureBonus": {
          "title": "👗 Lịch sử trang phục truyền thống Trung Quốc (从旗袍到新中式)",
          "summary": "Thời trang Trung Quốc hiện đại đang rộ lên trào lưu 'Tân Trung thức' (新中式风格).",
          "content": "Bên cạnh xường xám (旗袍) kinh điển và Hán phục (汉服) duyên dáng, phong cách 'Tân Trung thức' kết hợp cổ áo truyền thống, nút thắt hoa mẫu đơn trên nền vải âu phục hiện đại đang được giới trẻ vô cùng ưa chuộng tại các tuần lễ thời trang Thượng Hải và Bắc Kinh."
      }
  },
  // =========================================================================
  // LESSON 8: 今天我出院了
  // =========================================================================
  {
      "lessonNumber": 8,
      "titleHanzi": "今天我出院了",
      "titlePinyin": "Jīntiān wǒ chūyuàn le",
      "titleVietnamese": "Hôm nay tôi xuất viện rồi",
      "pageStart": 67,
      "objectives": [
          "Nắm nghĩa phái sinh của bổ ngữ xu hướng (1).",
          "Sử dụng chính xác từ ly hợp (2) khi xen kẽ thành phần bổ ngữ, tân ngữ.",
          "Dùng bổ ngữ thời lượng (2) và cấu trúc thời gian '以前/以后/前/后'."
      ],
      "texts": [
          {
              "id": "hsk3-l8-t1",
              "title": "课文 1: 医生查房 (Bài khóa 1: Bác sĩ khám buồng bệnh)",
              "context": "在病房，医生来给陈天中做检查。(Tại buồng bệnh, bác sĩ đến kiểm tra).",
              "lines": [
                  {
                      "speaker": "医生",
                      "hanzi": "天中，今天感觉怎么样？头还疼吗？",
                      "pinyin": "Tiānzhōng, jīntiān gǎnjué zěnmeyàng? Tóu hái téng ma?",
                      "vietnamese": "Thiên Trung, hôm nay cảm thấy thế nào rồi? Đầu còn đau không em?"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "已经完全不疼了，精神也好多了。",
                      "pinyin": "Yǐjīng wánquán bù téng le, jīngshen yě hǎo duō le.",
                      "vietnamese": "Dạ hoàn toàn không đau nữa rồi, tinh thần cũng đã đỡ hơn nhiều ạ."
                  },
                  {
                      "speaker": "医生",
                      "hanzi": "伤口长得很好，体温也正常，今天可以办理出院手续了。",
                      "pinyin": "Shāngkǒu zhǎng de hěn hǎo, tǐwēn yě zhèngcháng, jīntiān kěyǐ bànlǐ chūyuàn shǒuxù le.",
                      "vietnamese": "Vết mổ hồi phục rất tốt, thân nhiệt cũng bình thường, hôm nay có thể làm thủ tục xuất viện rồi."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "太好了！在医院住了整整一个星期，我都快闷死了。",
                      "pinyin": "Tài hǎo le! Zài yīyuàn zhù le zhěngzhěng yí ge xīngqī, wǒ dōu kuài mèn sǐ le.",
                      "vietnamese": "Tuyệt quá rồi! Ở trong bệnh viện tròn một tuần lễ, em sắp cuồng chân cuồng tay đến nơi rồi."
                  },
                  {
                      "speaker": "医生",
                      "hanzi": "回去以后还要坚持按时吃药，两个星期以后来复查。",
                      "pinyin": "Huíqù yǐhòu hái yào jiānchí ànshí chīyào, liǎng ge xīngqī yǐhòu lái fùchá.",
                      "vietnamese": "Sau khi về nhà vẫn phải kiên trì uống thuốc đúng giờ nhé, hai tuần sau đến tái khám."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "好的，谢谢医生！",
                      "pinyin": "Hǎo de, xièxie yīshēng!",
                      "vietnamese": "Vâng, em cảm ơn bác sĩ nhiều ạ!"
                  }
              ]
          },
          {
              "id": "hsk3-l8-t2",
              "title": "课文 2: 朋友接出院 (Bài khóa 2: Bạn bè đón xuất viện)",
              "context": "在医院大厅，安妮和李文来接陈天中。(Ở sảnh bệnh viện, Annie và Lý Văn đến đón).",
              "lines": [
                  {
                      "speaker": "安妮",
                      "hanzi": "天中！恭喜你康复出院！",
                      "pinyin": "Tiānzhōng! Gōngxǐ nǐ kāngfù chūyuàn!",
                      "vietnamese": "Thiên Trung! Chúc mừng cậu đã bình phục xuất viện nhé!"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "谢谢你们专门跑来接我。",
                      "pinyin": "Xièxie nǐmen zhuānmén pǎolái jiē wǒ.",
                      "vietnamese": "Cảm ơn các cậu đã cất công tới tận đây đón tớ."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "你的行李多不多？我都帮你拿上去。",
                      "pinyin": "Nǐ de xíngli duō bu duō? Wǒ dōu bāng nǐ ná shàngqu.",
                      "vietnamese": "Hành lý của cậu có nhiều không? Để tớ xách hết lên xe cho."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "就一个背包，我自己背着就行。",
                      "pinyin": "Jiù yí ge bèibāo, wǒ zìjǐ bēizhe jiù xíng.",
                      "vietnamese": "Chỉ có một chiếc ba lô thôi, tớ tự đeo là được rồi."
                  },
                  {
                      "speaker": "安妮",
                      "hanzi": "医生有没有说回去要注意什么？",
                      "pinyin": "Yīshēng yǒu méiyǒu shuō huíqù yào zhùyì shénme?",
                      "vietnamese": "Bác sĩ có dặn về nhà cần chú ý điều gì không?"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "医生说三个月以内不能做剧烈运动，平时多散步。",
                      "pinyin": "Yīshēng shuō sān ge yuè yǐnèi bù néng zuò jùliè yùndòng, píngshí duō sànbù.",
                      "vietnamese": "Bác sĩ dặn trong vòng ba tháng không được vận động mạnh, thường ngày nên đi dạo nhiều hơn."
                  }
              ]
          },
          {
              "id": "hsk3-l8-t3",
              "title": "课文 3: 车上谈健康 (Bài khóa 3: Bàn về sức khỏe trên xe)",
              "context": "在出租车上，大家聊住院期间的感受。(Trên xe taxi, chia sẻ cảm nhận lúc nằm viện).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "这次生病住院，把你给吓坏了吧？",
                      "pinyin": "Zhè cì shēngbìng zhùyuàn, bǎ nǐ gěi xià huài le ba?",
                      "vietnamese": "Lần ốm phải nằm viện này chắc làm cậu sợ phát khiếp rồi đúng không?"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "可不是嘛，刚送进医院的时候，我疼得话都说不出来。",
                      "pinyin": "Kě bú shì ma, gāng sòng jìn yīyuàn de shíhou, wǒ téng de huà dōu shuō bu chūlái.",
                      "vietnamese": "Chứ còn gì nữa, lúc mới đưa vào bệnh viện, tớ đau đến mức không thốt nên lời."
                  },
                  {
                      "speaker": "安妮",
                      "hanzi": "幸亏送来得及时，动了个小手术就没事了。",
                      "pinyin": "Xìngkuī sòng lái de jíshí, dòng le ge xiǎo shǒushù jiù méi shì le.",
                      "vietnamese": "May mà đưa tới kịp thời, làm một cuộc phẫu thuật nhỏ là không sao rồi."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "这次住院让我深刻体会到健康有多么重要。以后我再也不熬夜打游戏了。",
                      "pinyin": "Zhè cì zhùyuàn ràng wǒ shēnkè tǐhuì dào jiànkāng yǒu duōme zhòngyào. Yǐhòu wǒ zài yě bù áoyè dǎ yóuxì le.",
                      "vietnamese": "Lần nằm viện này khiến tớ thấm thía sức khỏe quan trọng đến nhường nào. Sau này tớ quyết không thức khuya chơi điện tử nữa."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "早就该这样了！身体是革命的本钱。",
                      "pinyin": "Zǎojiù gāi zhèyàng le! Shēntǐ shì gémìng de běnqián.",
                      "vietnamese": "Sớm nên như thế rồi! Sức khỏe chính là vốn liếng quý giá nhất."
                  }
              ]
          },
          {
              "id": "hsk3-l8-t4",
              "title": "课文 4: 出院感悟日记 (Bài khóa 4: Nhật ký chiêm nghiệm ngày xuất viện)",
              "context": "在日记中，陈天中感悟健康与友情。(Nhật ký về sức khỏe và tình bạn).",
              "lines": [
                  {
                      "speaker": "陈天中",
                      "hanzi": "今天我终于出院回家了。在医院住了一个星期，每天闻着消毒水的味道，看着白色的墙壁，心里特别盼望能早点儿走出去。",
                      "pinyin": "Jīntiān wǒ zhōngyú chūyuàn huí jiā le. Zài yīyuàn zhù le yí ge xīngqī, měitiān wénzhe xiāodúshuǐ de wèidao, kànzhe báisè de qiángbì, xīnlǐ tèbié pànwàng néng zǎodiǎnr zǒuchūqù.",
                      "vietnamese": "Hôm nay tôi cuối cùng đã được xuất viện về nhà. Nằm trong bệnh viện một tuần, ngày ngày ngửi mùi thuốc sát trùng, nhìn những bức tường trắng toát, trong lòng chỉ tha thiết mong được sớm bước ra ngoài."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "今天走出医院大门，阳光照在身上的那一刻，我真真切切地感到自由和美好。",
                      "pinyin": "Jīntiān zǒuchū yīyuàn dàmén, yángguāng zhào zài shēnshang de nà yí kè, wǒ zhēnzhēnqièqiè de gǎndào zìyóu hé měihǎo.",
                      "vietnamese": "Hôm nay sải bước ra khỏi cổng bệnh viện, khoảnh khắc ánh nắng chiếu rọi lên người, tôi cảm nhận được một cách chân thực nhất sự tự do và tươi đẹp."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "住院期间，老师和同学们好几次来看望我，李文和安妮今天还专门来接我出院。生了一场病，让我不仅明白了健康是最宝贵的财富，更懂得了友情的珍贵。",
                      "pinyin": "Zhùyuàn qījiān, lǎoshī hé tóngxuémen hǎo jǐ cì lái kànwàng wǒ, Lǐ Wén hé Ānnī jīntiān hái zhuānmén lái jiē wǒ chūyuàn. Shēng le yì cháng bìng, ràng wǒ bùjǐn míngbai le jiànkāng shì zuì bǎoguì de cáifù, gèng dǒngde le yǒuqíng de zhēnguì.",
                      "vietnamese": "Trong suốt thời gian nằm viện, thầy cô và bạn bè đã nhiều lần đến thăm hỏi tôi, Lý Văn và Annie hôm nay còn đặc biệt tới đón tôi về. Trải qua một trận ốm đau, không chỉ giúp tôi hiểu rằng sức khỏe là tài sản vô giá nhất, mà còn thấm thía sâu sắc sự quý giá của tình bạn bè."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "从今天起，我要好好锻炼身体，珍惜身边的每一个人。",
                      "pinyin": "Cóng jīntiān qǐ, wǒ yào hǎohǎo duànliàn shēntǐ, zhēnxī shēnbiān de měi yí ge rén.",
                      "vietnamese": "Bắt đầu từ hôm nay, tôi sẽ tích cực rèn luyện thân thể và trân trọng từng người bên cạnh mình."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l8-g1",
              "title": "1. 趋向补语的引申用法（1） (Nghĩa mở rộng của bổ ngữ xu hướng)",
              "explanation": "Động từ kết hợp với 出来 biểu thị nhận biết, phát hiện ra điều gì đó thông qua giác quan hoặc hành động.",
              "examples": [
                  {
                      "hanzi": "我疼得话都说不出来了。",
                      "pinyin": "Wǒ téng de huà dōu shuō bu chūlái le.",
                      "vietnamese": "Tôi đau đến mức không thốt nên lời."
                  },
                  {
                      "hanzi": "你看出来这是谁了吗？",
                      "pinyin": "Nǐ kàn chūlái zhè shì shuí le ma?",
                      "vietnamese": "Bạn nhìn ra đây là ai chưa?"
                  }
              ]
          },
          {
              "id": "hsk3-l8-g2",
              "title": "2. 离合词（2） (Từ ly hợp: Động từ + Thành phần xen giữa + Tân ngữ)",
              "explanation": "Các từ ly hợp như 住院, 出院, 生病, 散步 khi có số lượng từ, trợ từ thì đặt xen vào giữa hai âm tiết.",
              "examples": [
                  {
                      "hanzi": "在医院住了整整一个星期。",
                      "pinyin": "Zài yīyuàn zhù le zhěngzhěng yí ge xīngqī.",
                      "vietnamese": "Ở trong bệnh viện tròn một tuần lễ."
                  },
                  {
                      "hanzi": "生了一场大病。",
                      "pinyin": "Shēng le yì cháng dà bìng.",
                      "vietnamese": "Trải qua một trận ốm nặng."
                  }
              ]
          },
          {
              "id": "hsk3-l8-g3",
              "title": "3. 时量补语（2） (Bổ ngữ thời lượng)",
              "explanation": "Dùng để biểu thị khoảng thời gian hành động diễn ra hoặc trạng thái kéo dài.",
              "examples": [
                  {
                      "hanzi": "在医院住了一个星期。",
                      "pinyin": "Zài yīyuàn zhù le yí ge xīngqī.",
                      "vietnamese": "Nằm viện được một tuần."
                  },
                  {
                      "hanzi": "他坚持跑步跑了半个小时。",
                      "pinyin": "Tā jiānchí pǎobù pǎo le bàn ge xiǎoshí.",
                      "vietnamese": "Anh ấy kiên trì chạy bộ suốt nửa tiếng đồng hồ."
                  }
              ]
          },
          {
              "id": "hsk3-l8-g4",
              "title": "4. 固定格式“……以前/以后/前/后” (Cấu trúc chỉ thời gian)",
              "explanation": "Đặt sau danh từ hoặc mệnh đề hành động để biểu thị mốc thời gian trước hoặc sau.",
              "examples": [
                  {
                      "hanzi": "回去以后还要坚持按时吃药。",
                      "pinyin": "Huíqù yǐhòu hái yào jiānchí ànshí chīyào.",
                      "vietnamese": "Sau khi về nhà vẫn phải kiên trì uống thuốc đúng giờ."
                  },
                  {
                      "hanzi": "两个星期以后来复查。",
                      "pinyin": "Liǎng ge xīngqī yǐhòu lái fùchá.",
                      "vietnamese": "Hai tuần sau tới tái khám."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l8-w1",
              "hanzi": "出院",
              "pinyin": "chū yuàn",
              "hanViet": "Xuất Viện",
              "vietnamese": "xuất viện",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "出院",
              "exampleTranslation": "xuất viện",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l8-w2",
              "hanzi": "检查",
              "pinyin": "jiǎn chá",
              "hanViet": "Kiểm Tra",
              "vietnamese": "kiểm tra",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "检查",
              "exampleTranslation": "kiểm tra",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w3",
              "hanzi": "伤口",
              "pinyin": "shāng kǒu",
              "hanViet": "Thương Khẩu",
              "vietnamese": "vết thương, vết mổ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "伤口",
              "exampleTranslation": "vết thương, vết mổ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w4",
              "hanzi": "体温",
              "pinyin": "tǐ wēn",
              "hanViet": "Thể Ôn",
              "vietnamese": "thân nhiệt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "体温",
              "exampleTranslation": "thân nhiệt",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w5",
              "hanzi": "手续",
              "pinyin": "shǒu xù",
              "hanViet": "Thủ Tục",
              "vietnamese": "thủ tục giấy tờ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "手续",
              "exampleTranslation": "thủ tục giấy tờ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w6",
              "hanzi": "整整",
              "pinyin": "zhěng zhěng",
              "hanViet": "Chỉnh Chỉnh",
              "vietnamese": "tròn, trọn vẹn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "整整",
              "exampleTranslation": "tròn, trọn vẹn",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l8-w7",
              "hanzi": "闷",
              "pinyin": "mèn",
              "hanViet": "",
              "vietnamese": "bức bối, cuồng chân",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "闷",
              "exampleTranslation": "bức bối, cuồng chân",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l8-w8",
              "hanzi": "坚持",
              "pinyin": "jiān chí",
              "hanViet": "Kiên Trì",
              "vietnamese": "kiên trì",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "坚持",
              "exampleTranslation": "kiên trì",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w9",
              "hanzi": "复查",
              "pinyin": "fù chá",
              "hanViet": "",
              "vietnamese": "tái khám",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "复查",
              "exampleTranslation": "tái khám",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w10",
              "hanzi": "康复",
              "pinyin": "kāng fù",
              "hanViet": "Khang Phục",
              "vietnamese": "bình phục, hồi phục",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "康复",
              "exampleTranslation": "bình phục, hồi phục",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w11",
              "hanzi": "专门",
              "pinyin": "zhuān mén",
              "hanViet": "Chuyên Môn",
              "vietnamese": "chuyên môn, đặc biệt (dành riêng)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "专门",
              "exampleTranslation": "chuyên môn, đặc biệt (dành riêng)",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l8-w12",
              "hanzi": "背包",
              "pinyin": "bēi bāo",
              "hanViet": "Bối Bao",
              "vietnamese": "ba lô",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "背包",
              "exampleTranslation": "ba lô",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w13",
              "hanzi": "剧烈",
              "pinyin": "jù liè",
              "hanViet": "Kịch Liệt",
              "vietnamese": "dữ dội, mạnh mẽ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "剧烈",
              "exampleTranslation": "dữ dội, mạnh mẽ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l8-w14",
              "hanzi": "散步",
              "pinyin": "sàn bù",
              "hanViet": "Tán Bộ",
              "vietnamese": "đi dạo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "散步",
              "exampleTranslation": "đi dạo",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l8-w15",
              "hanzi": "手术",
              "pinyin": "shǒu shù",
              "hanViet": "Thủ Thuật",
              "vietnamese": "phẫu thuật, mổ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "手术",
              "exampleTranslation": "phẫu thuật, mổ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w16",
              "hanzi": "体会",
              "pinyin": "tǐ huì",
              "hanViet": "Thể Hội",
              "vietnamese": "thấm thía, trải nghiệm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "体会",
              "exampleTranslation": "thấm thía, trải nghiệm",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w17",
              "hanzi": "健康",
              "pinyin": "jiàn kāng",
              "hanViet": "Kiện Khang",
              "vietnamese": "sức khỏe, khỏe mạnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "健康",
              "exampleTranslation": "sức khỏe, khỏe mạnh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w18",
              "hanzi": "熬夜",
              "pinyin": "áo yè",
              "hanViet": "Ngao Dạ",
              "vietnamese": "thức khuya",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "熬夜",
              "exampleTranslation": "thức khuya",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l8-w19",
              "hanzi": "本钱",
              "pinyin": "běn qián",
              "hanViet": "",
              "vietnamese": "vốn liếng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "本钱",
              "exampleTranslation": "vốn liếng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w20",
              "hanzi": "消毒水",
              "pinyin": "xiāo dú shuǐ",
              "hanViet": "",
              "vietnamese": "nước khử trùng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "消毒水",
              "exampleTranslation": "nước khử trùng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w21",
              "hanzi": "盼望",
              "pinyin": "pàn wàng",
              "hanViet": "Phán Vọng",
              "vietnamese": "trông mong, tha thiết chờ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "盼望",
              "exampleTranslation": "trông mong, tha thiết chờ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w22",
              "hanzi": "自由",
              "pinyin": "zì yóu",
              "hanViet": "Tự Do",
              "vietnamese": "tự do",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "自由",
              "exampleTranslation": "tự do",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w23",
              "hanzi": "看望",
              "pinyin": "kàn wàng",
              "hanViet": "Khán Vọng",
              "vietnamese": "thăm hỏi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "看望",
              "exampleTranslation": "thăm hỏi",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l8-w24",
              "hanzi": "财富",
              "pinyin": "cái fù",
              "hanViet": "Tài Phú",
              "vietnamese": "của cải, tài sản",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "财富",
              "exampleTranslation": "của cải, tài sản",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l8-w25",
              "hanzi": "珍贵",
              "pinyin": "zhēn guì",
              "hanViet": "Trân Quý",
              "vietnamese": "quý giá",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "珍贵",
              "exampleTranslation": "quý giá",
              "tags": [
                  "Tính từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l8-ex1",
              "type": "multiple_choice",
              "question": "Điền từ thích hợp: '他在医院里住了 ______ 一个月。'",
              "options": [
                  "A. 整整",
                  "B. 终于",
                  "C. 几乎",
                  "D. 马上"
              ],
              "correctAnswer": "A. 整整",
              "explanation": "整整一个星期 / 一个月: tròn một tuần / một tháng.",
              "grammarFocus": "Phó từ 整整"
          },
          {
              "id": "hsk3-l8-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '身体是革命的 ______ (vốn liếng)，千万不能熬夜。'",
              "options": [
                  "本钱",
                  "财富",
                  "手续",
                  "精神"
              ],
              "correctAnswer": "本钱",
              "explanation": "Thành ngữ quen thuộc: 身体是革命的本钱 (Sức khỏe là vốn quý nhất).",
              "grammarFocus": "Từ vựng Bài 8"
          },
          {
              "id": "hsk3-l8-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "坚持跑步",
              "两个月",
              "他",
              "了",
              "已经"
              ],
              "question": "Sắp xếp câu: '坚持跑步 / 两个月 / 他 / 了 / 已经'",
              "correctAnswer": "他已经坚持跑步两个月了。",
              "explanation": "Bổ ngữ thời lượng: Chủ ngữ + Động từ + Thời lượng + 了.",
              "grammarFocus": "Bổ ngữ thời lượng"
          },
          {
              "id": "hsk3-l8-ex4",
              "type": "multiple_choice",
              "question": "Chọn bổ ngữ xu hướng: '他疼得话都说不 ______ 了。'",
              "options": [
                  "A. 出来",
                  "B. 过去",
                  "C. 起来",
                  "D. 下去"
              ],
              "correctAnswer": "A. 出来",
              "explanation": "说不出来: không thốt nên lời (bổ ngữ khả năng/xu hướng).",
              "grammarFocus": "Bổ ngữ xu hướng 出来"
          }
      ],
      "cultureBonus": {
          "title": "🏥 Văn hóa thăm bệnh nhân ở Trung Quốc (探病礼仪)",
          "summary": "Người Trung Quốc đi thăm người ốm (探望病人) thường mang theo hoa quả tươi hoặc canh bổ dưỡng.",
          "content": "Khi đến viện thăm bệnh nhân, người Trung Quốc thường mang theo một giỏ hoa quả tươi (果篮) hoặc sữa dinh dưỡng, tránh tặng hoa màu trắng hoặc quả lê (vì 梨 đồng âm với 离 - ly tán). Lời chúc quen thuộc nhất là '早日康复' (chúc sớm bình phục)."
      }
  },
  // =========================================================================
  // LESSON 9: 打不好没关系
  // =========================================================================
  {
      "lessonNumber": 9,
      "titleHanzi": "打不好没关系",
      "titlePinyin": "Dǎ bù hǎo méiguānxi",
      "titleVietnamese": "Đánh không tốt cũng không sao",
      "pageStart": 76,
      "objectives": [
          "Dùng câu phức mục đích '为了……，……'.",
          "Vận dụng bổ ngữ khả năng biểu thị khả năng thực hiện kết quả.",
          "Dùng kết cấu tương quan '越 A 越 B' diễn đạt mức độ tỉ lệ thuận."
      ],
      "texts": [
          {
              "id": "hsk3-l9-t1",
              "title": "课文 1: 准备打球 (Bài khóa 1: Chuẩn bị chơi cầu lông)",
              "context": "在羽毛球馆门口，李文和白家月准备打球。(Trước cửa nhà thi đấu, chuẩn bị chơi cầu).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "家月，你以前打过羽毛球吗？",
                      "pinyin": "Jiāyuè, nǐ yǐqián dǎ guo yǔmáoqiú ma?",
                      "vietnamese": "Gia Nguyệt, trước đây em từng chơi cầu lông chưa?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "小时候打过几次，不过水平很差，打不好。",
                      "pinyin": "Xiǎoshíhou dǎ guo jǐ cì, búguò shuǐpíng hěn chà, dǎ bù hǎo.",
                      "vietnamese": "Hồi nhỏ em có chơi vài lần, nhưng trình độ kém lắm, đánh chẳng ra sao."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "打不好没关系，我们主要是为了活动活动身体，出出汗。",
                      "pinyin": "Dǎ bù hǎo méiguānxi, wǒmen zhǔyào shì wèile huódong huodong shēntǐ, chūchū hàn.",
                      "vietnamese": "Đánh không hay cũng chẳng sao cả, chúng mình chủ yếu là để vận động thân thể, toát mồ hôi thôi mà."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "我带了球拍和运动鞋，你看这双鞋跑得开吗？",
                      "pinyin": "Wǒ dài le qiúpāi hé yùndòngxié, nǐ kàn zhè shuāng xié pǎo de kāi ma?",
                      "vietnamese": "Em mang theo vợt và giày thể thao rồi, anh xem đôi giày này chạy có thoải mái không?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "挺专业的！走，我们先进去热身。",
                      "pinyin": "Tǐng zhuānyè de! Zǒu, wǒmen xiān jìnqù rèshēn.",
                      "vietnamese": "Trông chuyên nghiệp phết đấy chứ! Đi thôi, chúng mình vào khởi động trước đã."
                  }
              ]
          },
          {
              "id": "hsk3-l9-t2",
              "title": "课文 2: 球场指导 (Bài khóa 2: Hướng dẫn kỹ thuật trên sân)",
              "context": "在球场上，李文教白家月打球技巧。(Trên sân thi đấu, hướng dẫn kỹ thuật).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "发球的时候身体要放松，眼睛看着球，这样才能接得住。",
                      "pinyin": "Fāqiú de shíhou shēntǐ yào fàngsōng, yǎnjing kànzhe qiú, zhèyàng cái néng jiē de zhù.",
                      "vietnamese": "Lúc phát cầu cơ thể cần thả lỏng, mắt chú ý nhìn quả cầu, như thế mới đỡ trúng được."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "哎呀，这个球太高了，我够不着！",
                      "pinyin": "Āiyā, zhè ge qiú tài gāo le, wǒ gòu bu zháo!",
                      "vietnamese": "Ối trời, quả cầu này cao quá, em với không tới!"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "没关系，脚步快一点儿就能接到了。",
                      "pinyin": "Méiguānxi, jiǎobù kuài yìdiǎnr jiù néng jiēdào le.",
                      "vietnamese": "Không sao đâu, bước chân nhanh hơn một chút là đỡ được ngay."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "哇，你打过来的球速度太快了，我跑不过去。",
                      "pinyin": "Wā, nǐ dǎ guòlái de qiú sùdù tài kuài le, wǒ pǎo bu guòqù.",
                      "vietnamese": "Chà, quả cầu anh đánh sang nhanh quá, em chạy không kịp tới nơi."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "多练习几遍就好了。你看，你打得一次比一次好，越打越有感觉了！",
                      "pinyin": "Duō liànxí jǐ biàn jiù hǎo le. Nǐ kàn, nǐ dǎ de yí cì bǐ yí cì hǎo, yuè dǎ yuè yǒu gǎnjué le!",
                      "vietnamese": "Luyện thêm vài lần là ổn ngay thôi. Em thấy chưa, em đánh một lần lại hay hơn một lần, càng đánh càng vào tay rồi đấy!"
                  }
              ]
          },
          {
              "id": "hsk3-l9-t3",
              "title": "课文 3: 休息畅谈 (Bài khóa 3: Uống nước nghỉ ngơi)",
              "context": "在休息区，李文和白家月喝水休息。(Tại khu nghỉ ngơi uống nước).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "累死我了，全身都是汗，不过真痛快！",
                      "pinyin": "Lèi sǐ wǒ le, quánshēn dōu shì hàn, búguò zhēn tòngkuai!",
                      "vietnamese": "Mệt chết đi được, toàn thân đẫm mồ hôi, nhưng mà thật sảng khoái!"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "喝点儿水补充体力。打羽毛球需要全身协调，运动量挺大的。",
                      "pinyin": "Hē diǎnr shuǐ bǔchōng tǐlì. Dǎ yǔmáoqiú xūyào quánshēn xiétiáo, yùndòngliàng tǐng dà de.",
                      "vietnamese": "Uống chút nước nạp lại thể lực nào. Đánh cầu lông đòi hỏi phối hợp toàn thân, cường độ vận động khá lớn."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "我发现运动真是个好办法，出了一身汗，心情变得好多了。",
                      "pinyin": "Wǒ fāxiàn yùndòng zhēn shì ge hǎo bànfǎ, chū le yì shēn hàn, xīnqíng biàn de hǎo duō le.",
                      "vietnamese": "Em nhận ra thể thao đúng là một phương pháp tuyệt vời, toát hết mồ hôi ra là tâm trạng phấn chấn hẳn lên."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "现代人为了工作总是坐着不动，容易颈椎疼。",
                      "pinyin": "Xiàndàirén wèile gōngzuò zǒngshì zuòzhe bú dòng, róngyì jǐngzhuī téng.",
                      "vietnamese": "Người hiện đại vì công việc mà cứ ngồi lì một chỗ không vận động, rất dễ bị đau đốt sống cổ."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "以后每个周末我们都来打一次吧，越早坚持越好！",
                      "pinyin": "Yǐhòu měi ge zhōumò wǒmen dōu lái dǎ yí cì ba, yuè zǎo jiānchí yuè hǎo!",
                      "vietnamese": "Sau này cuối tuần nào chúng mình cũng đến đánh một buổi nhé, duy trì càng sớm càng tốt!"
                  }
              ]
          },
          {
              "id": "hsk3-l9-t4",
              "title": "课文 4: 运动日记 (Bài khóa 4: Nhật ký rèn luyện)",
              "context": "在日记中，白家月写打羽毛球的收获。(Nhật ký về lợi ích thể thao).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "今天下午李文约我去打羽毛球。刚开始的时候我连球都接不住，常常把球打到界外，心里有点儿着急。",
                      "pinyin": "Jīntiān xiàwǔ Lǐ Wén yuē wǒ qù dǎ yǔmáoqiú. Gāng kāishǐ de shíhou wǒ lián qiú dōu jiē bu zhù, chángcháng bǎ qiú dǎ dào jièwài, xīnlǐ yǒudiǎnr zháojí.",
                      "vietnamese": "Chiều nay Lý Văn hẹn tôi đi đánh cầu lông. Lúc ban đầu tôi đến quả cầu cũng không đỡ nổi, thường xuyên đánh ra ngoài vạch biên, trong lòng có đôi phần sốt ruột."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "李文耐心地教我怎样发球、怎样跑位。慢慢地，我也能打出几个漂亮的回合了。",
                      "pinyin": "Lǐ Wén nàixīn de jiāo wǒ zěnyàng fāqiú, zěnyàng pǎowèi. Mànman de, wǒ yě néng dǎchū jǐ ge piàoliang de huíhé le.",
                      "vietnamese": "Lý Văn đã kiên nhẫn chỉ cho tôi cách phát cầu, cách di chuyển chọn vị trí. Dần dà, tôi cũng có thể đánh qua lại được mấy đường cầu rất đẹp mắt."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "运动真的有一种神奇的力量，随着汗水流出，平时学习和生活中的压力似乎全都不翼而飞了。",
                      "pinyin": "Yùndòng zhēn de yǒu yì zhǒng shénqí de lìliang, suízhe hànshuǐ liúchū, píngshí xuéxí hé shēnghuó zhōng de yālì sìhū quándōu búyì'érfēi le.",
                      "vietnamese": "Thể dục thể thao quả thực sở hữu một nguồn sức mạnh kỳ diệu, cùng với mồ hôi tuôn rơi, những áp lực học tập và đời sống thường nhật dường như đều tan biến không dấu vết."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "打球不仅锻炼了身体，还让我体会到了挑战自己的乐趣。只要肯下功夫，任何事情都是熟能生巧！",
                      "pinyin": "Dǎqiú bùjǐn duànliàn le shēntǐ, hái ràng wǒ tǐhuì dào le tiǎozhàn zìjǐ de lèqù. Zhǐyào kěn xià gōngfu, rènhé shìqing dōu shì shúnéngshēngqiǎo!",
                      "vietnamese": "Chơi cầu không chỉ rèn luyện sức khỏe mà còn cho tôi cảm nhận được niềm vui thú khi vượt lên thử thách bản thân. Chỉ cần chịu khó bỏ công sức, mọi việc ắt trăm hay không bằng tay quen!"
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l9-g1",
              "title": "1. 目的复句“为了……，……” (Câu phức mục đích 'Để... / Vì...')",
              "explanation": "Dùng '为了' đặt ở đầu phân câu thứ nhất để nêu rõ mục đích đạt tới của hành động ở phân câu sau.",
              "examples": [
                  {
                      "hanzi": "我们主要是为了活动活动身体，出出汗。",
                      "pinyin": "Wǒmen zhǔyào shì wèile huódong huodong shēntǐ, chūchū hàn.",
                      "vietnamese": "Chúng tôi chủ yếu là để vận động thân thể, toát chút mồ hôi."
                  },
                  {
                      "hanzi": "为了提高汉语水平，他每天坚持读报纸。",
                      "pinyin": "Wèile tígāo Hànyǔ shuǐpíng, tā měitiān jiānchí dú bàozhǐ.",
                      "vietnamese": "Để nâng cao trình độ tiếng Hán, ngày nào anh ấy cũng kiên trì đọc báo."
                  }
              ]
          },
          {
              "id": "hsk3-l9-g2",
              "title": "2. 可能补语 (Bổ ngữ khả năng: Động từ + 得/不 + Bổ ngữ kết quả/xu hướng)",
              "explanation": "Biểu thị điều kiện chủ quan hoặc khách quan có cho phép thực hiện được kết quả nào đó hay không.",
              "examples": [
                  {
                      "hanzi": "这样才能接得住。",
                      "pinyin": "Zhèyàng cái néng jiē de zhù.",
                      "vietnamese": "Như thế mới đỡ trúng được."
                  },
                  {
                      "hanzi": "这个球太高了，我够不着。",
                      "pinyin": "Zhè ge qiú tài gāo le, wǒ gòu bu zháo.",
                      "vietnamese": "Quả cầu này cao quá, tôi với không tới."
                  },
                  {
                      "hanzi": "速度太快了，我跑不过去。",
                      "pinyin": "Sùdù tài kuài le, wǒ pǎo bu guòqù.",
                      "vietnamese": "Tốc độ nhanh quá, tôi chạy không kịp sang."
                  }
              ]
          },
          {
              "id": "hsk3-l9-g3",
              "title": "3. 固定格式“越 A 越 B” (Cấu trúc tương quan 'Càng A càng B')",
              "explanation": "Biểu thị mức độ của B sẽ tăng tiến theo sự biến chuyển hoặc tiến hành của A.",
              "examples": [
                  {
                      "hanzi": "越打越有感觉了。",
                      "pinyin": "Yuè dǎ yuè yǒu gǎnjué le.",
                      "vietnamese": "Càng đánh lại càng thấy vào tay."
                  },
                  {
                      "hanzi": "越早坚持越好。",
                      "pinyin": "Yuè zǎo jiānchí yuè hǎo.",
                      "vietnamese": "Càng duy trì sớm càng tốt."
                  },
                  {
                      "hanzi": "风越刮越大。",
                      "pinyin": "Fēng yuè guā yuè dà.",
                      "vietnamese": "Gió càng thổi càng to."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l9-w1",
              "hanzi": "羽毛球",
              "pinyin": "yǔ máo qiú",
              "hanViet": "Vũ Mao Cầu",
              "vietnamese": "môn cầu lông",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "羽毛球",
              "exampleTranslation": "môn cầu lông",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w2",
              "hanzi": "差",
              "pinyin": "chà",
              "hanViet": "Soa",
              "vietnamese": "kém, tồi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "差",
              "exampleTranslation": "kém, tồi",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l9-w3",
              "hanzi": "主要是",
              "pinyin": "zhǔ yào shì",
              "hanViet": "",
              "vietnamese": "chủ yếu là",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "主要是",
              "exampleTranslation": "chủ yếu là",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l9-w4",
              "hanzi": "为了",
              "pinyin": "wèi le",
              "hanViet": "Vi Liễu",
              "vietnamese": "vì, để",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "为了",
              "exampleTranslation": "vì, để",
              "tags": [
                  "Giới từ"
              ]
          },
          {
              "id": "hsk3-l9-w5",
              "hanzi": "出汗",
              "pinyin": "chū hàn",
              "hanViet": "",
              "vietnamese": "toát mồ hôi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "出汗",
              "exampleTranslation": "toát mồ hôi",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l9-w6",
              "hanzi": "球拍",
              "pinyin": "qiú pāi",
              "hanViet": "",
              "vietnamese": "cây vợt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "球拍",
              "exampleTranslation": "cây vợt",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w7",
              "hanzi": "热身",
              "pinyin": "rè shēn",
              "hanViet": "",
              "vietnamese": "khởi động làm nóng người",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "热身",
              "exampleTranslation": "khởi động làm nóng người",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l9-w8",
              "hanzi": "发球",
              "pinyin": "fā qiú",
              "hanViet": "",
              "vietnamese": "phát bóng, giao cầu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "发球",
              "exampleTranslation": "phát bóng, giao cầu",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l9-w9",
              "hanzi": "够",
              "pinyin": "gòu",
              "hanViet": "Cú",
              "vietnamese": "với tới, đủ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "够",
              "exampleTranslation": "với tới, đủ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l9-w10",
              "hanzi": "练习",
              "pinyin": "liàn xí",
              "hanViet": "Luyện Tập",
              "vietnamese": "luyện tập",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "练习",
              "exampleTranslation": "luyện tập",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l9-w11",
              "hanzi": "感觉",
              "pinyin": "gǎn jué",
              "hanViet": "Cảm Giác",
              "vietnamese": "cảm giác, cảm nhận",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "感觉",
              "exampleTranslation": "cảm giác, cảm nhận",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w12",
              "hanzi": "痛快",
              "pinyin": "tòng kuài",
              "hanViet": "Thống Khoái",
              "vietnamese": "sảng khoái, thống khoái",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "痛快",
              "exampleTranslation": "sảng khoái, thống khoái",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l9-w13",
              "hanzi": "补充",
              "pinyin": "bǔ chōng",
              "hanViet": "Bổ Sung",
              "vietnamese": "bổ sung, bù đắp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "补充",
              "exampleTranslation": "bổ sung, bù đắp",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l9-w14",
              "hanzi": "体力",
              "pinyin": "tǐ lì",
              "hanViet": "Thể Lực",
              "vietnamese": "thể lực",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "体力",
              "exampleTranslation": "thể lực",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w15",
              "hanzi": "协调",
              "pinyin": "xié tiáo",
              "hanViet": "Hiệp Điều",
              "vietnamese": "phối hợp nhịp nhàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "协调",
              "exampleTranslation": "phối hợp nhịp nhàng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l9-w16",
              "hanzi": "运动量",
              "pinyin": "yùn dòng liàng",
              "hanViet": "",
              "vietnamese": "cường độ vận động",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "运动量",
              "exampleTranslation": "cường độ vận động",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w17",
              "hanzi": "颈椎",
              "pinyin": "jǐng chuí",
              "hanViet": "Cảnh Truy",
              "vietnamese": "đốt sống cổ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "颈椎",
              "exampleTranslation": "đốt sống cổ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w18",
              "hanzi": "界外",
              "pinyin": "jiè wài",
              "hanViet": "",
              "vietnamese": "ngoài vạch biên",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "界外",
              "exampleTranslation": "ngoài vạch biên",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w19",
              "hanzi": "耐心",
              "pinyin": "nài xīn",
              "hanViet": "Nại Tâm",
              "vietnamese": "nhẫn nại, kiên nhẫn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "耐心",
              "exampleTranslation": "nhẫn nại, kiên nhẫn",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l9-w20",
              "hanzi": "跑位",
              "pinyin": "pǎo wèi",
              "hanViet": "",
              "vietnamese": "di chuyển vị trí",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "跑位",
              "exampleTranslation": "di chuyển vị trí",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l9-w21",
              "hanzi": "回合",
              "pinyin": "huí hé",
              "hanViet": "",
              "vietnamese": "hiệp đấu, đường cầu qua lại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "回合",
              "exampleTranslation": "hiệp đấu, đường cầu qua lại",
              "tags": [
                  "Lượng từ"
              ]
          },
          {
              "id": "hsk3-l9-w22",
              "hanzi": "压力",
              "pinyin": "yā lì",
              "hanViet": "Áp Lực",
              "vietnamese": "áp lực",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "压力",
              "exampleTranslation": "áp lực",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l9-w23",
              "hanzi": "挑战",
              "pinyin": "tiǎo zhàn",
              "hanViet": "Thiêu Chiến",
              "vietnamese": "thách thức",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "挑战",
              "exampleTranslation": "thách thức",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l9-w24",
              "hanzi": "熟能生巧",
              "pinyin": "shú néng shēng qiǎo",
              "hanViet": "",
              "vietnamese": "trăm hay không bằng tay quen",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "熟能生巧",
              "exampleTranslation": "trăm hay không bằng tay quen",
              "tags": [
                  "Thành ngữ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l9-ex1",
              "type": "multiple_choice",
              "question": "Điền bổ ngữ khả năng: '黑板上的字太小了，我看不 ______。'",
              "options": [
                  "A. 清楚",
                  "B. 明白",
                  "C. 干净",
                  "D. 容易"
              ],
              "correctAnswer": "A. 清楚",
              "explanation": "看不清楚: nhìn không rõ (bổ ngữ khả năng).",
              "grammarFocus": "Bổ ngữ khả năng"
          },
          {
              "id": "hsk3-l9-ex2",
              "type": "fill_blank",
              "question": "Điền giới từ: '______ (Để) 保持健康，爷爷每天早晨都去公园打太极拳。'",
              "options": [
                  "为了",
                  "因为",
                  "关于",
                  "对于"
              ],
              "correctAnswer": "为了",
              "explanation": "为了 + Mục đích: để làm gì...",
              "grammarFocus": "Giới từ 为了"
          },
          {
              "id": "hsk3-l9-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "这本小说",
              "越看",
              "越有意思"
              ],
              "question": "Sắp xếp câu: '这本小说 / 越看 / 越有意思'",
              "correctAnswer": "这本小说越看越有意思。",
              "explanation": "Cấu trúc: 越 A 越 B biểu thị mức độ tăng dần theo hành động.",
              "grammarFocus": "Cấu trúc 越A越B"
          },
          {
              "id": "hsk3-l9-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '运动后出了一身汗，感觉非常 ______。'",
              "options": [
                  "A. 痛快",
                  "B. 麻烦",
                  "C. 粗心",
                  "D. 难过"
              ],
              "correctAnswer": "A. 痛快",
              "explanation": "痛快 (tòngkuai): sảng khoái, nhẹ nhõm.",
              "grammarFocus": "Từ vựng Bài 9"
          }
      ],
      "cultureBonus": {
          "title": "🏸 Phong trào thể thao toàn dân tại Trung Quốc (全民健身热)",
          "summary": "Cầu lông và bóng bàn là hai môn thể thao quốc dân được yêu thích hàng đầu tại Trung Quốc.",
          "content": "Tại các công viên hay nhà thi đấu thể thao ở Trung Quốc, từ sáng sớm đến tối muộn luôn tấp nập các câu lạc bộ cầu lông và bóng bàn. Chiến dịch 'Toàn dân kiện thân' (全民健身) khuyến khích mọi người vận động mỗi ngày để nâng cao thể chất và giải tỏa áp lực làm việc."
      }
  },
  // =========================================================================
  // LESSON 10: 你明天再把书还给我
  // =========================================================================
  {
      "lessonNumber": 10,
      "titleHanzi": "你明天再把书还给我",
      "titlePinyin": "Nǐ míngtiān zài bǎ shū huán gěi wǒ",
      "titleVietnamese": "Ngày mai bạn hãy trả lại sách cho tôi",
      "pageStart": 86,
      "objectives": [
          "Nắm vững cấu trúc câu chữ '把' cơ bản (1): chủ ngữ + 把 + tân ngữ + động từ + thành phần khác.",
          "Dùng cấu trúc định vị không gian '在……上/中/下'.",
          "Vận dụng câu chữ '把' (2) kết hợp với các bổ ngữ chỉ phương hướng/kết quả."
      ],
      "texts": [
          {
              "id": "hsk3-l10-t1",
              "title": "课文 1: 借阅语法书 (Bài khóa 1: Mượn sách ngữ pháp)",
              "context": "在教室里，刘小雪向同学借书。(Trong lớp học, Lưu Tiểu Tuyết mượn sách).",
              "lines": [
                  {
                      "speaker": "刘小雪",
                      "hanzi": "张天，你把那本汉语语法书带来了吗？",
                      "pinyin": "Zhāng Tiān, nǐ bǎ nà běn Hànyǔ yǔfǎ shū dàilái le ma?",
                      "vietnamese": "Trương Thiên, cậu có mang cuốn sách ngữ pháp tiếng Hán kia đến không?"
                  },
                  {
                      "speaker": "张天",
                      "hanzi": "带来了，就在我的书包里，我拿给你。",
                      "pinyin": "Dàilái le, jiù zài wǒ de shūbāo lǐ, wǒ ná gěi nǐ.",
                      "vietnamese": "Có mang chứ, ở ngay trong cặp sách của tớ này, để tớ lấy cho cậu."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "太好了，我有几个语法问题一直没搞懂，想看看书上的例句。",
                      "pinyin": "Tài hǎo le, wǒ yǒu jǐ ge yǔfǎ wèntí yìzhí méi gǎodǒng, xiǎng kànkan shū shang de lìjù.",
                      "vietnamese": "Tuyệt quá, tớ có mấy vấn đề ngữ pháp mãi vẫn chưa hiểu rõ, muốn xem câu ví dụ trong sách."
                  },
                  {
                      "speaker": "张天",
                      "hanzi": "你慢慢看吧，不用着急还。",
                      "pinyin": "Nǐ mànman kàn ba, bú yòng zháojí huán.",
                      "vietnamese": "Cậu cứ từ từ mà xem, không cần vội trả đâu."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "我今天晚上就看完，你明天再把书收回去，我明天早上就把书还给你。",
                      "pinyin": "Wǒ jīntiān wǎnshang jiù kànwán, nǐ míngtiān zài bǎ shū shōuhuíqù, wǒ míngtiān zǎoshang jiù bǎ shū huán gěi nǐ.",
                      "vietnamese": "Tối nay là tớ xem xong ngay rồi, sáng mai tớ sẽ mang sách trả lại cho cậu ngay."
                  }
              ]
          },
          {
              "id": "hsk3-l10-t2",
              "title": "课文 2: 图书馆借书 (Bài khóa 2: Mượn sách ở thư viện)",
              "context": "在图书馆阅览室，刘小雪查阅资料。(Tại phòng đọc thư viện, tra cứu tài liệu).",
              "lines": [
                  {
                      "speaker": "刘小雪",
                      "hanzi": "管理员老师，请问语言学类的书在哪个书架上？",
                      "pinyin": "Guǎnlǐyuán lǎoshī, qǐngwèn yǔyánxué lèi de shū zài nǎge shūjià shang?",
                      "vietnamese": "Thưa thầy thủ thư, xin hỏi sách chuyên ngành ngôn ngữ học nằm ở giá sách nào ạ?"
                  },
                  {
                      "speaker": "老师",
                      "hanzi": "在三楼中文阅览室的第三排书架上。",
                      "pinyin": "Zài sān lóu Zhōngwén yuèlǎnshì de dì-sān pái shūjià shang.",
                      "vietnamese": "Ở hàng giá sách số ba trong phòng đọc tiếng Trung tầng ba em nhé."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "借书需要什么证件？",
                      "pinyin": "Jiè shū xūyào shénme zhèngjiàn?",
                      "vietnamese": "Mượn sách cần giấy tờ gì ạ?"
                  },
                  {
                      "speaker": "老师",
                      "hanzi": "把你的学生卡在感应器上刷一下就可以了。",
                      "pinyin": "Bǎ nǐ de xuéshengkǎ zài gǎnyìngqì shang shuā yíxià jiù kěyǐ le.",
                      "vietnamese": "Quẹt thẻ sinh viên của em lên máy cảm ứng một cái là được."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "一次最多可以借几本书呢？",
                      "pinyin": "Yí cì zuìduō kěyǐ jiè jǐ běn shū ne?",
                      "vietnamese": "Một lần được mượn tối đa mấy cuốn sách ạ?"
                  },
                  {
                      "speaker": "老师",
                      "hanzi": "在规定的期限内，一次最多可以借五本。看完以后记得把书放回原处。",
                      "pinyin": "Zài guīdìng de qīxiàn nèi, yí cì zuìduō kěyǐ jiè wǔ běn. Kànwán yǐhòu jìde bǎ shū fànghuí yuánchù.",
                      "vietnamese": "Trong thời hạn quy định, mỗi lần mượn tối đa được năm cuốn. Đọc xong em nhớ đặt sách trở lại chỗ cũ nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l10-t3",
              "title": "课文 3: 检查修改作业 (Bài khóa 3: Kiểm tra sửa bài tập)",
              "context": "在自习室，刘小雪和张天讨论作业。(Ở phòng tự học, sửa bài).",
              "lines": [
                  {
                      "speaker": "张天",
                      "hanzi": "小雪，你把老师留的作文写完了吗？",
                      "pinyin": "Xiǎoxuě, nǐ bǎ lǎoshī liú de zuòwén xiěwán le ma?",
                      "vietnamese": "Tiểu Tuyết, cậu đã viết xong bài văn thầy giao chưa?"
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "刚写完草稿。你帮我看看，我把几个生词用得对不对？",
                      "pinyin": "Gāng xiěwán cǎogǎo. Nǐ bāng wǒ kànkan, wǒ bǎ jǐ ge shēngcí yòng de duì bu duì?",
                      "vietnamese": "Tớ mới viết xong bản nháp thôi. Cậu xem giúp tớ xem tớ dùng mấy từ mới này đã đúng chưa?"
                  },
                  {
                      "speaker": "张天",
                      "hanzi": "我来看看……这几个句子写得挺通顺的，不过你把这个字写错了。",
                      "pinyin": "Wǒ lái kànkan... Zhè jǐ ge jùzi xiě de tǐng tōngshùn de, búguò nǐ bǎ zhè ge zì xiě cuò le.",
                      "vietnamese": "Để tớ xem nào... Mấy câu này viết khá trôi chảy đấy, nhưng cậu viết sai chữ này mất rồi."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "哎呀，粗心了，我马上把这个错别字改过来。",
                      "pinyin": "Āiyā, cūxīn le, wǒ mǎshàng bǎ zhè ge cuòbiézì gǎi guòlái.",
                      "vietnamese": "Ấy chết, đoảng quá, tớ sửa lại chữ viết sai này ngay đây."
                  },
                  {
                      "speaker": "张天",
                      "hanzi": "写完以后最好把作业存到电脑里，别弄丢了。",
                      "pinyin": "Xiěwán yǐhòu zuìhǎo bǎ zuòyè cún dào diànnǎo lǐ, bié nòng diū le.",
                      "vietnamese": "Viết xong tốt nhất là lưu bài tập vào trong máy tính, đừng để làm mất nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l10-t4",
              "title": "课文 4: 充实的一天日记 (Bài khóa 4: Nhật ký một ngày bổ ích)",
              "context": "在日记中，刘小雪记录充实的一天。(Ghi chép về ngày học tập tại thư viện).",
              "lines": [
                  {
                      "speaker": "刘小雪",
                      "hanzi": "今天是在图书馆度过的一天。早上一到阅览室，我就把借来的参考书整整齐齐地摆在桌子上，认真查阅资料。",
                      "pinyin": "Jīntiān shì zài túshūguǎn dùguò de yì tiān. Zǎoshang yí dào yuèlǎnshì, wǒ jiù bǎ jièlai de cānkǎoshū zhěngzhěngqíqí de bǎi zài zhuōzi shang, rènzhēn cháyuè zīliào.",
                      "vietnamese": "Hôm nay là một ngày tôi trải qua trọn vẹn ở thư viện. Buổi sáng vừa đến phòng đọc, tôi liền xếp những cuốn sách tham khảo vừa mượn thật ngay ngắn lên bàn, chăm chú tra cứu tài liệu."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "在安静的环境下学习，效率格外高。中午我和张天一起讨论了课后思考题，互相指出了作业里的错误。",
                      "pinyin": "Zài ānjìng de huánjìng xià xuéxí, xiàolǜ géwài gāo. Zhōngwǔ wǒ hé Zhāng Tiān yìqǐ tǎolùn le kèhòu sīkǎotí, hùxiāng zhǐchū le zuòyè lǐ de cuòwù.",
                      "vietnamese": "Học tập dưới môi trường yên tĩnh, hiệu suất học tập cao lạ kỳ. Buổi trưa tôi cùng Trương Thiên thảo luận câu hỏi tư duy sau bài học, cùng chỉ ra những lỗi sai trong bài tập của nhau."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "不知不觉中，一下午的时间就悄悄溜走了。傍晚收拾书包时，我把每一本书都小心地放回了书包。",
                      "pinyin": "Bùzhī bùjué zhōng, yí xiàwǔ de shíjiān jiù qiāoqiāo liūzǒu le. Bàngwǎn shōushi shūbāo shí, wǒ bǎ měi yì běn shū dōu xiǎoxīn de fànghuí le shūbāo.",
                      "vietnamese": "Thấm thoát chẳng hay biết, thời gian của cả buổi chiều đã lặng lẽ trôi đi mất. Chập tối khi thu dọn cặp sách, tôi cẩn thận xếp từng cuốn sách đặt lại vào trong cặp."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "今天虽然过得很忙碌，但学到了很多新知识，心里感到十分踏实。",
                      "pinyin": "Jīntiān suīrán guò de hěn mánglù, dàn xuédào le hěn duō xīn zhīshi, xīnlǐ gǎndào shífēn tāshi.",
                      "vietnamese": "Hôm nay dẫu trôi qua vô cùng bận rộn, nhưng lại tiếp thu được bao kiến thức mới, trong lòng cảm thấy vô cùng an tâm và thanh thản."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l10-g1",
              "title": "1. “把”字句（1）—— 基础结构 (Cấu trúc cơ bản của câu chữ 把)",
              "explanation": "Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác. Biểu thị hành động tác động lên tân ngữ xác định và tạo ra kết quả hoặc làm thay đổi trạng thái của tân ngữ.",
              "examples": [
                  {
                      "hanzi": "你把那本书带来了吗？",
                      "pinyin": "Nǐ bǎ nà běn shū dàilái le ma?",
                      "vietnamese": "Cậu đã mang cuốn sách kia tới chưa?"
                  },
                  {
                      "hanzi": "我明天早上就把书还给你。",
                      "pinyin": "Wǒ míngtiān zǎoshang jiù bǎ shū huán gěi nǐ.",
                      "vietnamese": "Sáng mai tớ sẽ đem sách trả lại cho cậu."
                  },
                  {
                      "hanzi": "我马上把这个错别字改过来。",
                      "pinyin": "Wǒ mǎshàng bǎ zhè ge cuòbiézì gǎi guòlái.",
                      "vietnamese": "Tớ sửa ngay lỗi chính tả này lại."
                  }
              ]
          },
          {
              "id": "hsk3-l10-g2",
              "title": "2. 固定格式“在……上/中/下” (Định vị không gian và phạm vi)",
              "explanation": "Dùng để biểu thị điều kiện, phạm vi hoặc bối cảnh tiến hành hành động ('dưới sự...', 'trong quá trình...').",
              "examples": [
                  {
                      "hanzi": "把你的学生卡在感应器上刷一下。",
                      "pinyin": "Bǎ nǐ de xuéshengkǎ zài gǎnyìngqì shang shuā yíxià.",
                      "vietnamese": "Quẹt thẻ học sinh của bạn lên máy cảm ứng."
                  },
                  {
                      "hanzi": "在老师的帮助下，他的进步很快。",
                      "pinyin": "Zài lǎoshī de bāngzhù xià, tā de jìnbù hěn kuài.",
                      "vietnamese": "Dưới sự giúp đỡ của thầy cô, bạn ấy tiến bộ rất nhanh."
                  }
              ]
          },
          {
              "id": "hsk3-l10-g3",
              "title": "3. “把”字句（2）—— 配合趋向/结果补语 (Câu chữ 把 kết hợp bổ ngữ kết quả/xu hướng)",
              "explanation": "Động từ trong câu chữ 把 bắt buộc phải có thành phần bổ ngữ chỉ rõ nơi chốn hoặc người tiếp nhận: 把 + Tân ngữ + Động từ + 在/到/给 + Nơi chốn/Người.",
              "examples": [
                  {
                      "hanzi": "把书放回原处。",
                      "pinyin": "Bǎ shū fànghuí yuánchù.",
                      "vietnamese": "Để sách lại chỗ cũ."
                  },
                  {
                      "hanzi": "把作业存到电脑里。",
                      "pinyin": "Bǎ zuòyè cún dào diànnǎo lǐ.",
                      "vietnamese": "Lưu bài tập vào trong máy tính."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l10-w1",
              "hanzi": "借",
              "pinyin": "jiè",
              "hanViet": "Tá",
              "vietnamese": "mượn, vay",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "借",
              "exampleTranslation": "mượn, vay",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w2",
              "hanzi": "还",
              "pinyin": "hái",
              "hanViet": "Hoàn",
              "vietnamese": "trả lại, hoàn trả",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "还",
              "exampleTranslation": "trả lại, hoàn trả",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w3",
              "hanzi": "搞",
              "pinyin": "gǎo",
              "hanViet": "Cảo",
              "vietnamese": "làm, xử lý",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "搞",
              "exampleTranslation": "làm, xử lý",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w4",
              "hanzi": "例句",
              "pinyin": "lì jù",
              "hanViet": "",
              "vietnamese": "câu ví dụ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "例句",
              "exampleTranslation": "câu ví dụ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w5",
              "hanzi": "管理员",
              "pinyin": "guǎn lǐ yuán",
              "hanViet": "",
              "vietnamese": "người quản lý, thủ thư",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "管理员",
              "exampleTranslation": "người quản lý, thủ thư",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w6",
              "hanzi": "类",
              "pinyin": "lèi",
              "hanViet": "Loại",
              "vietnamese": "loại, chủng loại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "类",
              "exampleTranslation": "loại, chủng loại",
              "tags": [
                  "Lượng từ"
              ]
          },
          {
              "id": "hsk3-l10-w7",
              "hanzi": "书架",
              "pinyin": "shū jià",
              "hanViet": "Thư Giá",
              "vietnamese": "giá sách, kệ sách",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "书架",
              "exampleTranslation": "giá sách, kệ sách",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w8",
              "hanzi": "排",
              "pinyin": "pái",
              "hanViet": "Bài",
              "vietnamese": "hàng, dãy",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "排",
              "exampleTranslation": "hàng, dãy",
              "tags": [
                  "Lượng từ"
              ]
          },
          {
              "id": "hsk3-l10-w9",
              "hanzi": "证件",
              "pinyin": "zhèng jiàn",
              "hanViet": "Chứng Kiện",
              "vietnamese": "giấy tờ chứng nhận, thẻ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "证件",
              "exampleTranslation": "giấy tờ chứng nhận, thẻ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w10",
              "hanzi": "刷",
              "pinyin": "shuā",
              "hanViet": "Xoát",
              "vietnamese": "quẹt (thẻ), chải (răng)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "刷",
              "exampleTranslation": "quẹt (thẻ), chải (răng)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w11",
              "hanzi": "规定",
              "pinyin": "guī dìng",
              "hanViet": "Quy Định",
              "vietnamese": "quy định",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "规定",
              "exampleTranslation": "quy định",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w12",
              "hanzi": "期限",
              "pinyin": "qī xiàn",
              "hanViet": "Kì Hạn",
              "vietnamese": "kỳ hạn, thời hạn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "期限",
              "exampleTranslation": "kỳ hạn, thời hạn",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w13",
              "hanzi": "原处",
              "pinyin": "yuán chù",
              "hanViet": "",
              "vietnamese": "chỗ cũ, vị trí ban đầu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "原处",
              "exampleTranslation": "chỗ cũ, vị trí ban đầu",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w14",
              "hanzi": "草稿",
              "pinyin": "cǎo gǎo",
              "hanViet": "",
              "vietnamese": "bản nháp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "草稿",
              "exampleTranslation": "bản nháp",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w15",
              "hanzi": "通顺",
              "pinyin": "tōng shùn",
              "hanViet": "",
              "vietnamese": "trôi chảy, thông suốt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "通顺",
              "exampleTranslation": "trôi chảy, thông suốt",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l10-w16",
              "hanzi": "粗心",
              "pinyin": "cū xīn",
              "hanViet": "Thô Tâm",
              "vietnamese": "sơ ý, bất cẩn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "粗心",
              "exampleTranslation": "sơ ý, bất cẩn",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l10-w17",
              "hanzi": "错别字",
              "pinyin": "cuò bié zì",
              "hanViet": "",
              "vietnamese": "chữ viết sai chính tả",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "错别字",
              "exampleTranslation": "chữ viết sai chính tả",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w18",
              "hanzi": "改",
              "pinyin": "gǎi",
              "hanViet": "Cải",
              "vietnamese": "sửa chữa, thay đổi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "改",
              "exampleTranslation": "sửa chữa, thay đổi",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w19",
              "hanzi": "存",
              "pinyin": "cún",
              "hanViet": "Tồn",
              "vietnamese": "lưu trữ, gửi (tiền)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "存",
              "exampleTranslation": "lưu trữ, gửi (tiền)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l10-w20",
              "hanzi": "参考书",
              "pinyin": "cān kǎo shū",
              "hanViet": "",
              "vietnamese": "sách tham khảo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "参考书",
              "exampleTranslation": "sách tham khảo",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w21",
              "hanzi": "整齐",
              "pinyin": "zhěng qí",
              "hanViet": "Chỉnh Tề",
              "vietnamese": "ngay ngắn, gọn gàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "整齐",
              "exampleTranslation": "ngay ngắn, gọn gàng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l10-w22",
              "hanzi": "效率",
              "pinyin": "xiào lǜ",
              "hanViet": "Hiệu Suất",
              "vietnamese": "hiệu suất, hiệu quả",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "效率",
              "exampleTranslation": "hiệu suất, hiệu quả",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l10-w23",
              "hanzi": "格外",
              "pinyin": "gé wài",
              "hanViet": "Cách Ngoại",
              "vietnamese": "đặc biệt, hết sức",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "格外",
              "exampleTranslation": "đặc biệt, hết sức",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l10-w24",
              "hanzi": "忙碌",
              "pinyin": "máng lù",
              "hanViet": "Mang Lục",
              "vietnamese": "bận rộn tất bật",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "忙碌",
              "exampleTranslation": "bận rộn tất bật",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l10-w25",
              "hanzi": "踏实",
              "pinyin": "tà shí",
              "hanViet": "Đạp Thật",
              "vietnamese": "an tâm, vững dạ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "踏实",
              "exampleTranslation": "an tâm, vững dạ",
              "tags": [
                  "Tính từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l10-ex1",
              "type": "multiple_choice",
              "question": "Điền từ vào câu chữ 把: '请你把作业本 ______ 老师。'",
              "options": [
                  "A. 交给",
                  "B. 借走",
                  "C. 看完",
                  "D. 忘记"
              ],
              "correctAnswer": "A. 交给",
              "explanation": "把 + Tân ngữ + 交给 + Người nhận: nộp cái gì cho ai.",
              "grammarFocus": "Câu chữ 把"
          },
          {
              "id": "hsk3-l10-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '离开阅览室前，请把书放回 ______ (chỗ cũ)。'",
              "options": [
                  "原处",
                  "书包",
                  "桌子",
                  "旁边"
              ],
              "correctAnswer": "原处",
              "explanation": "放回原处: để lại vị trí ban đầu.",
              "grammarFocus": "Từ vựng Bài 10"
          },
          {
              "id": "hsk3-l10-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "请把",
              "关好",
              "窗户",
              "离开前"
              ],
              "question": "Sắp xếp câu: '请把 / 关好 / 窗户 / 离开前'",
              "correctAnswer": "离开前请把窗户关好。",
              "explanation": "Cấu trúc: Trạng ngữ thời gian + 请把 + Tân ngữ + Động từ + Bổ ngữ kết quả.",
              "grammarFocus": "Câu chữ 把"
          },
          {
              "id": "hsk3-l10-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '在安静的环境 ______ 学习，效率更高。'",
              "options": [
                  "A. 下",
                  "B. 上",
                  "C. 中",
                  "D. 里"
              ],
              "correctAnswer": "A. 下",
              "explanation": "在……下: dưới điều kiện/hoàn cảnh nào đó.",
              "grammarFocus": "Định vị 在……下"
          }
      ],
      "cultureBonus": {
          "title": "📚 Văn hóa đọc sách tại thư viện Trung Quốc (高校图书馆与自习文化)",
          "summary": "Thư viện các trường đại học Trung Quốc luôn là thánh địa học tập sôi động nhất.",
          "content": "Ở các trường đại học Trung Quốc, sinh viên có thói quen '抢座' (đặt chỗ ngồi tự học) từ sáng sớm tại thư viện. Không gian thư viện hiện đại với hệ thống mượn trả tự động qua nhận diện khuôn mặt và thẻ sinh viên là niềm tự hào của văn hóa học đường."
      }
  },
  // =========================================================================
  // LESSON 11: 看来我没办法解决这个问题
  // =========================================================================
  {
      "lessonNumber": 11,
      "titleHanzi": "看来我没办法解决这个问题",
      "titlePinyin": "Kànlai wǒ méi bànfǎ jiějué zhè ge wèntí",
      "titleVietnamese": "Xem ra tôi không có cách nào giải quyết vấn đề này",
      "pageStart": 95,
      "objectives": [
          "Phân biệt rành mạch giữa '还是' (lựa chọn nghi vấn) và '或者' (lựa chọn trần thuật).",
          "Dùng phó từ tình thái '看来' đưa ra phán đoán khách quan.",
          "Nắm cấu trúc câu chữ '把' (3) với tân ngữ gián tiếp hoặc nơi chốn.",
          "Dùng cấu trúc '对……来说' nêu góc nhìn/đối tượng."
      ],
      "texts": [
          {
              "id": "hsk3-l11-t1",
              "title": "课文 1: 电脑故障 (Bài khóa 1: Máy tính gặp sự cố)",
              "context": "在办公室，王一雪和杨同乐讨论电脑故障。(Tại văn phòng, thảo luận máy tính hỏng).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "同乐，你的电脑修好了吗？",
                      "pinyin": "Tónglè, nǐ de diànnǎo xiūhǎo le ma?",
                      "vietnamese": "Đồng Lạc, máy tính của em đã sửa xong chưa?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "还没有呢，按了开机键一点儿反应都没有。",
                      "pinyin": "Hái méiyǒu ne, àn le kāijījiàn yìdiǎnr fǎnyìng dōu méiyǒu.",
                      "vietnamese": "Vẫn chưa chị ạ, bấm nút nguồn mà chẳng có lấy một chút phản ứng nào."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "是不是电源线没插好，还是电池没电了？",
                      "pinyin": "Shì bu shì diànyuánxiàn méi chā hǎo, háishì diànchí méi diàn le?",
                      "vietnamese": "Liệu có phải dây nguồn cắm chưa chặt, hay là pin hết điện rồi?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "我都检查过了，电源插头插得很紧。看来我没办法自己解决这个问题了。",
                      "pinyin": "Wǒ dōu jiǎnchá guo le, diànyuán chātóu chā de hěn jǐn. Kànlai wǒ méi bànfǎ zìjǐ jiějué zhè ge wèntí le.",
                      "vietnamese": "Em kiểm tra hết rồi, phích cắm nguồn cắm rất chặt. Xem ra em chẳng có cách nào tự giải quyết vấn đề này được rồi."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "那还是把电脑送到维修中心去吧，让专业人员看看。",
                      "pinyin": "Nà háishì bǎ diànnǎo sòng dào wéixiū zhōngxīn qù ba, ràng zhuānyè rényuán kànkan.",
                      "vietnamese": "Vậy thì mang máy tính đến trung tâm bảo hành sửa chữa đi, để nhân viên chuyên nghiệp kiểm tra xem."
                  }
              ]
          },
          {
              "id": "hsk3-l11-t2",
              "title": "课文 2: 送修咨询 (Bài khóa 2: Tư vấn thợ kỹ thuật)",
              "context": "在维修中心，杨同乐咨询工程师。(Tại trung tâm sửa chữa, hỏi kỹ sư).",
              "lines": [
                  {
                      "speaker": "工程师",
                      "hanzi": "先生，您的电脑是什么时候出现问题的？",
                      "pinyin": "Xiānsheng, nín de diànnǎo shì shénme shíhou chūxiàn wèntí de?",
                      "vietnamese": "Thưa anh, máy tính của anh bị xuất hiện lỗi từ khi nào vậy ạ?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "昨天下午用着好好的，突然就黑屏关机了。",
                      "pinyin": "Zuótiān xiàwǔ yòngzhe hǎohǎo de, tūrán jiù hēipíng guānjī le.",
                      "vietnamese": "Chiều hôm qua đang dùng ngon lành, tự dưng màn hình đen xì rồi sập nguồn luôn."
                  },
                  {
                      "speaker": "工程师",
                      "hanzi": "可能是主板或者显卡烧坏了，我需要把机器拆开检查一下。",
                      "pinyin": "Kěnéng shì zhǔbǎn huòzhě xiǎnkǎ shāohuài le, wǒ xūyào bǎ jīqì chāikāi jiǎnchá yíxià.",
                      "vietnamese": "Có khả năng bo mạch chủ hoặc card đồ họa bị chập cháy rồi, tôi cần tháo máy ra để kiểm tra."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "里面的文件会不会丢失？对我们来说，数据非常重要！",
                      "pinyin": "Lǐmiàn de wénjiàn huì bu huì diūshī? Duì wǒmen láishuō, shùjù fēicháng zhòngyào!",
                      "vietnamese": "Tài liệu bên trong liệu có bị mất không anh? Đối với chúng tôi, dữ liệu cực kỳ quan trọng đấy!"
                  },
                  {
                      "speaker": "工程师",
                      "hanzi": "放心吧，只要硬盘没坏，数据都能保住。如果需要换零件，可能要等两天。",
                      "pinyin": "Fàngxīn ba, zhǐyào yìngpán méi huài, shùjù dōu néng bǎozhù. Rúguǒ xūyào huàn língjiàn, kěnéng yào děng liǎng tiān.",
                      "vietnamese": "Anh cứ yên tâm, chỉ cần ổ cứng chưa hỏng thì dữ liệu đều giữ lại được hết. Nếu cần thay linh kiện thì có thể phải đợi hai ngày."
                  }
              ]
          },
          {
              "id": "hsk3-l11-t3",
              "title": "课文 3: 应急备份 (Bài khóa 3: Sao lưu khẩn cấp)",
              "context": "在咖啡厅，杨同乐和王一雪商量应急方案。(Tại quán cà phê, bàn phương án tạm thời).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "电脑修得怎么样了？明天开会要用的方案还在里面吗？",
                      "pinyin": "Diànnǎo xiū de zěnmeyàng le? Míngtiān kāihuì yào yòng de fāng'àn hái zài lǐmiàn ma?",
                      "vietnamese": "Máy tính sửa sao rồi em? Bản phương án dùng cho cuộc họp ngày mai còn ở trong đó không?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "硬盘里的数据已经导出来了，工程师帮我把文件拷贝到了U盘里。",
                      "pinyin": "Yìngpán lǐ de shùjù yǐjīng dǎochūlái le, gōngchéngshī bāng wǒ bǎ wénjiàn kǎobèi dào le Yōupán lǐ.",
                      "vietnamese": "Dữ liệu trong ổ cứng đã trích xuất ra được rồi, anh kỹ sư đã giúp em sao chép tệp vào chiếc USB rồi ạ."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "太好了！那我们今晚用我的笔记本电脑继续修改吧。",
                      "pinyin": "Tài hǎo le! Nà wǒmen jīnwǎn yòng wǒ de bǐjìběn diànnǎo jìxù xiūgǎi ba.",
                      "vietnamese": "Tốt quá rồi! Vậy tối nay chúng ta dùng máy tính xách tay của chị tiếp tục chỉnh sửa nhé."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "行，或者用投影仪直接演练一遍。",
                      "pinyin": "Xíng, huòzhě yòng tóuyǐngyí zhíjiē yǎnliàn yí biàn.",
                      "vietnamese": "Vâng, hoặc là dùng máy chiếu tập dượt trực tiếp một lần luôn."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "对我们团队来说，明天的汇报至关重要，今晚辛苦一点儿也值得！",
                      "pinyin": "Duì wǒmen tuánduì láishuō, míngtiān de huìbào zhìguān zhòngyào, jīnwǎn xīnkǔ yìdiǎnr yě zhídé!",
                      "vietnamese": "Đối với cả nhóm chúng ta, bài báo cáo ngày mai tối quan trọng, tối nay vất vả một chút cũng hoàn toàn xứng đáng!"
                  }
              ]
          },
          {
              "id": "hsk3-l11-t4",
              "title": "课文 4: 备份警示日记 (Bài khóa 4: Nhật ký bài học sao lưu dữ liệu)",
              "context": "在日记中，杨同乐总结数据备份的重要性。(Nhật ký rút kinh nghiệm).",
              "lines": [
                  {
                      "speaker": "杨同乐",
                      "hanzi": "今天的电脑故障真是虚惊一场。由于平时没有养成定期备份文件的习惯，当电脑突然黑屏无法启动时，我急得满头大汗。",
                      "pinyin": "Jīntiān de diànnǎo gùzhàng zhēn shì xūjīng yì chǎng. Yóuyú píngshí méiyǒu yǎngchéng dìngqī bèifèn wénjiàn de xíguàn, dāng diànnǎo tūrán hēipíng wúfǎ qǐdòng shí, wǒ jí de mǎntóu dàhàn.",
                      "vietnamese": "Sự cố máy tính hôm nay đúng là một phen hú vía. Do thường ngày không rèn luyện thói quen định kỳ sao lưu tài liệu, nên khi máy tính bất ngờ đen màn hình không thể khởi động, tôi cuống cuồng toát cả mồ hôi hột."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "幸运的是，售后维修工程师技术精湛，不仅把故障排除了，还完整地把重要工作文件都恢复了回来。",
                      "pinyin": "Xìngyùn de shì, shòuhòu wéixiū gōngchéngshī jìshù jīngzhàn, bùjǐn bǎ gùzhàng páichú le, hái wánzhěng de bǎ zhòngyào gōngzuò wénjiàn dōu huìfù le huílái.",
                      "vietnamese": "May mắn thay, anh kỹ sư dịch vụ bảo hành tay nghề điêu luyện, không chỉ khắc phục được sự cố mà còn khôi phục lại trọn vẹn mọi tài liệu công việc quan trọng."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "这件事情给我敲响了警钟：对现代职场人来说，定期备份数据是不可忽视的基本技能。从今往后，我一定要把重要资料及时同步到云端硬盘中。",
                      "pinyin": "Zhè jiàn shìqing gěi wǒ qiāoxiǎng le jǐngzhōng: duì xiàndài zhíchǎngrén láishuō, dìngqī bèifèn shùjù shì bùkě hūshì de jīběn jìnéng. Cóngjīn wǎnghòu, wǒ yídìng yào bǎ zhòngyào zīliào jíshí tóngbù dào yúnduān yìngpán zhōng.",
                      "vietnamese": "Chuyện này đã gióng lên một hồi chuông cảnh tỉnh cho tôi: đối với dân công sở hiện đại, định kỳ sao lưu dữ liệu là một kỹ năng cơ bản không thể xem nhẹ. Từ nay về sau, tôi nhất định sẽ kịp thời đồng bộ các tài liệu trọng yếu lên bộ nhớ đám mây."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l11-g1",
              "title": "1. “还是”和“或者”的区别 (Phân biệt '还是' và '或者')",
              "explanation": "'还是' dùng trong câu nghi vấn hoặc lựa chọn băn khoăn; '或者' dùng trong câu trần thuật biểu thị một trong các khả năng.",
              "examples": [
                  {
                      "hanzi": "是不是电源线没插好，还是电池没电了？",
                      "pinyin": "Shì bu shì diànyuánxiàn méi chā hǎo, háishì diànchí méi diàn le?",
                      "vietnamese": "Là dây nguồn cắm chưa chặt, hay là pin hết điện rồi? (câu hỏi)."
                  },
                  {
                      "hanzi": "可能是主板或者显卡烧坏了。",
                      "pinyin": "Kěnéng shì zhǔbǎn huòzhě xiǎnkǎ shāohuài le.",
                      "vietnamese": "Có thể là bo mạch chủ hoặc card đồ họa bị cháy (trần thuật)."
                  }
              ]
          },
          {
              "id": "hsk3-l11-g2",
              "title": "2. 固定短语“看来” (Cụm phó từ tình thái 'Xem ra')",
              "explanation": "Đứng ở đầu câu để đưa ra phán đoán hoặc ước lượng dựa trên các dấu hiệu khách quan quan sát được.",
              "examples": [
                  {
                      "hanzi": "看来我没办法自己解决这个问题了。",
                      "pinyin": "Kànlai wǒ méi bànfǎ zìjǐ jiějué zhè ge wèntí le.",
                      "vietnamese": "Xem ra tôi không có cách nào tự giải quyết vấn đề này rồi."
                  },
                  {
                      "hanzi": "看来今天不会下雨了。",
                      "pinyin": "Kànlai jīntiān bú huì xiàyǔ le.",
                      "vietnamese": "Xem ra hôm nay trời sẽ không mưa đâu."
                  }
              ]
          },
          {
              "id": "hsk3-l11-g3",
              "title": "3. “把”字句（3） (Câu chữ 把 biểu thị sự dịch chuyển hoặc lưu trữ)",
              "explanation": "Cấu trúc: 主语 + 把 + 宾语 + 动词 + 到/进 + 处所.",
              "examples": [
                  {
                      "hanzi": "工程师帮我把文件拷贝到了U盘里。",
                      "pinyin": "Gōngchéngshī bāng wǒ bǎ wénjiàn kǎobèi dào le Yōupán lǐ.",
                      "vietnamese": "Kỹ sư giúp tôi sao chép tệp vào trong USB."
                  },
                  {
                      "hanzi": "把电脑送到维修中心去吧。",
                      "pinyin": "Bǎ diànnǎo sòng dào wéixiū zhōngxīn qù ba.",
                      "vietnamese": "Hãy mang máy tính tới trung tâm sửa chữa đi."
                  }
              ]
          },
          {
              "id": "hsk3-l11-g4",
              "title": "4. 固定格式“对……来说” (Cấu trúc 'Đối với... mà nói')",
              "explanation": "Dùng để giới thiệu đối tượng nhận định hoặc góc nhìn của một người, một tập thể.",
              "examples": [
                  {
                      "hanzi": "对我们来说，数据非常重要。",
                      "pinyin": "Duì wǒmen láishuō, shùjù fēicháng zhòngyào.",
                      "vietnamese": "Đối với chúng tôi, dữ liệu cực kỳ quan trọng."
                  },
                  {
                      "hanzi": "对学生来说，学好专业知识是最关键的。",
                      "pinyin": "Duì xuésheng láishuō, xuéhǎo zhuānyè zhīshi shì zuì guānjiàn de.",
                      "vietnamese": "Đối với học sinh, học tốt kiến thức chuyên ngành là then chốt nhất."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l11-w1",
              "hanzi": "解决",
              "pinyin": "jiě jué",
              "hanViet": "Giải Quyết",
              "vietnamese": "giải quyết",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "解决",
              "exampleTranslation": "giải quyết",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w2",
              "hanzi": "办法",
              "pinyin": "bàn fǎ",
              "hanViet": "Biện Pháp",
              "vietnamese": "biện pháp, phương cách",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "办法",
              "exampleTranslation": "biện pháp, phương cách",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w3",
              "hanzi": "看来",
              "pinyin": "kàn lái",
              "hanViet": "Khán Lai",
              "vietnamese": "xem ra",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "看来",
              "exampleTranslation": "xem ra",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l11-w4",
              "hanzi": "反应",
              "pinyin": "fǎn yìng",
              "hanViet": "Phản Ứng",
              "vietnamese": "phản ứng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "反应",
              "exampleTranslation": "phản ứng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w5",
              "hanzi": "电源",
              "pinyin": "diàn yuán",
              "hanViet": "Điện Nguyên",
              "vietnamese": "nguồn điện",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "电源",
              "exampleTranslation": "nguồn điện",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w6",
              "hanzi": "插",
              "pinyin": "chā",
              "hanViet": "Sáp",
              "vietnamese": "cắm (phích điện)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "插",
              "exampleTranslation": "cắm (phích điện)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w7",
              "hanzi": "维修",
              "pinyin": "wéi xiū",
              "hanViet": "Duy Tu",
              "vietnamese": "bảo trì, sửa chữa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "维修",
              "exampleTranslation": "bảo trì, sửa chữa",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w8",
              "hanzi": "专业",
              "pinyin": "zhuān yè",
              "hanViet": "Chuyên Nghiệp",
              "vietnamese": "chuyên nghiệp, chuyên ngành",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "专业",
              "exampleTranslation": "chuyên nghiệp, chuyên ngành",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l11-w9",
              "hanzi": "突然",
              "pinyin": "tū rán",
              "hanViet": "Đột Nhiên",
              "vietnamese": "đột nhiên, bất ngờ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "突然",
              "exampleTranslation": "đột nhiên, bất ngờ",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l11-w10",
              "hanzi": "显卡",
              "pinyin": "xiǎn kǎ",
              "hanViet": "",
              "vietnamese": "card màn hình",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "显卡",
              "exampleTranslation": "card màn hình",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w11",
              "hanzi": "拆",
              "pinyin": "chāi",
              "hanViet": "Chiết",
              "vietnamese": "tháo rời, dỡ ra",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "拆",
              "exampleTranslation": "tháo rời, dỡ ra",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w12",
              "hanzi": "零件",
              "pinyin": "líng jiàn",
              "hanViet": "",
              "vietnamese": "linh kiện, phụ tùng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "零件",
              "exampleTranslation": "linh kiện, phụ tùng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w13",
              "hanzi": "硬盘",
              "pinyin": "yìng pán",
              "hanViet": "",
              "vietnamese": "ổ cứng máy tính",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "硬盘",
              "exampleTranslation": "ổ cứng máy tính",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w14",
              "hanzi": "保住",
              "pinyin": "bǎo zhù",
              "hanViet": "",
              "vietnamese": "giữ lại được",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "保住",
              "exampleTranslation": "giữ lại được",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w15",
              "hanzi": "方案",
              "pinyin": "fāng àn",
              "hanViet": "Phương Án",
              "vietnamese": "phương án, đề án",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "方案",
              "exampleTranslation": "phương án, đề án",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w16",
              "hanzi": "拷贝",
              "pinyin": "kǎo bèi",
              "hanViet": "",
              "vietnamese": "sao chép, copy",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "拷贝",
              "exampleTranslation": "sao chép, copy",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w17",
              "hanzi": "U盘",
              "pinyin": "U pán",
              "hanViet": "",
              "vietnamese": "chiếc USB",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "U盘",
              "exampleTranslation": "chiếc USB",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w18",
              "hanzi": "投影仪",
              "pinyin": "tóu yǐng yí",
              "hanViet": "",
              "vietnamese": "máy chiếu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "投影仪",
              "exampleTranslation": "máy chiếu",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w19",
              "hanzi": "至关重要",
              "pinyin": "zhì guān zhòng yào",
              "hanViet": "Chí Quan Trọng Yếu",
              "vietnamese": "tối quan trọng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "至关重要",
              "exampleTranslation": "tối quan trọng",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l11-w20",
              "hanzi": "值得",
              "pinyin": "zhí de",
              "hanViet": "Trị Đắc",
              "vietnamese": "xứng đáng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "值得",
              "exampleTranslation": "xứng đáng",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w21",
              "hanzi": "虚惊一场",
              "pinyin": "xū jīng yī cháng",
              "hanViet": "",
              "vietnamese": "một phen hú vía",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "虚惊一场",
              "exampleTranslation": "một phen hú vía",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l11-w22",
              "hanzi": "备份",
              "pinyin": "bèi fèn",
              "hanViet": "",
              "vietnamese": "sao lưu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "备份",
              "exampleTranslation": "sao lưu",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w23",
              "hanzi": "售后",
              "pinyin": "shòu hòu",
              "hanViet": "",
              "vietnamese": "hậu mãi, sau bán hàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "售后",
              "exampleTranslation": "hậu mãi, sau bán hàng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l11-w24",
              "hanzi": "同步",
              "pinyin": "tóng bù",
              "hanViet": "",
              "vietnamese": "đồng bộ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "同步",
              "exampleTranslation": "đồng bộ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l11-w25",
              "hanzi": "云端",
              "pinyin": "yún duān",
              "hanViet": "",
              "vietnamese": "đám mây (công nghệ)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "云端",
              "exampleTranslation": "đám mây (công nghệ)",
              "tags": [
                  "Danh từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l11-ex1",
              "type": "multiple_choice",
              "question": "Điền liên từ câu hỏi: '你想喝咖啡 ______ 喝热茶？'",
              "options": [
                  "A. 还是",
                  "B. 或者",
                  "C. 如果",
                  "D. 只要"
              ],
              "correctAnswer": "A. 还是",
              "explanation": "Trong câu hỏi lựa chọn, bắt buộc phải dùng '还是'.",
              "grammarFocus": "Phân biệt 还是 và 或者"
          },
          {
              "id": "hsk3-l11-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '天阴得厉害，______ (xem ra) 马上就要下大雨了。'",
              "options": [
                  "看来",
                  "以为",
                  "好像",
                  "觉得"
              ],
              "correctAnswer": "看来",
              "explanation": "看来: xem ra (đưa ra phán đoán khách quan dựa trên quan sát).",
              "grammarFocus": "Phó từ 看来"
          },
          {
              "id": "hsk3-l11-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "对我们来说",
              "时间",
              "是最宝贵的",
              "财富"
              ],
              "question": "Sắp xếp câu: '对我们来说 / 时间 / 是最宝贵的 / 财富'",
              "correctAnswer": "对我们来说时间是最宝贵的财富。",
              "explanation": "Cấu trúc: 对……来说 + Nhận định.",
              "grammarFocus": "Cấu trúc 对……来说"
          },
          {
              "id": "hsk3-l11-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '工程师把重要文件都拷贝到了 ______ 里。'",
              "options": [
                  "A. U盘",
                  "B. 报纸",
                  "C. 衣服",
                  "D. 菜单"
              ],
              "correctAnswer": "A. U盘",
              "explanation": "拷贝到U盘: sao chép vào USB.",
              "grammarFocus": "Từ vựng Bài 11"
          }
      ],
      "cultureBonus": {
          "title": "💻 Đời sống công nghệ số tại Trung Quốc (数字化生活与云时代)",
          "summary": "Trung Quốc là một trong những quốc gia đi đầu thế giới về điện toán đám mây và lối sống số.",
          "content": "Tại Trung Quốc hiện nay, mọi dữ liệu học tập và làm việc đều được tích hợp trên các dịch vụ lưu trữ đám mây như Baidu Netdisk (百度网盘) hay Tencent Cloud. Việc làm việc cộng tác không cần mang theo máy tính vật lý đã trở thành phong cách làm việc quen thuộc của giới trẻ văn phòng."
      }
  },
  // =========================================================================
  // LESSON 12: 这个季节天气变化很快
  // =========================================================================
  {
      "lessonNumber": 12,
      "titleHanzi": "这个季节天气变化很快",
      "titlePinyin": "Zhè ge jìjié tiānqì biànhuà hěn kuài",
      "titleVietnamese": "Mùa này thời tiết thay đổi rất nhanh",
      "pageStart": 104,
      "objectives": [
          "Dùng câu phức lựa chọn '或者……，或者……'.",
          "Nắm nghĩa mở rộng của bổ ngữ xu hướng (2) và (3) (như 起来, 下去).",
          "Dùng phó từ phạm vi '就' để nhấn mạnh giới hạn hoặc thời điểm."
      ],
      "texts": [
          {
              "id": "hsk3-l12-t1",
              "title": "课文 1: 骤雨突至 (Bài khóa 1: Cơn mưa rào bất chợt)",
              "context": "在阳台，白家月和李文看天气。(Ở ban công, nhìn ngắm thời tiết).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "刚才还是大晴天呢，怎么突然刮起大风来了？",
                      "pinyin": "Gāngcái hái shì dà qíngtiān ne, zěnme tūrán guā qǐ dà fēng lái le?",
                      "vietnamese": "Vừa rồi trời vẫn còn nắng to rực rỡ, sao bỗng dưng lại nổi cơn gió lớn thế này?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "这个季节天气变化很快，天气预报说下午可能有雷阵雨。",
                      "pinyin": "Zhè ge jìjié tiānqì biànhuà hěn kuài, tiānqì yùbào shuō xiàwǔ kěnéng yǒu léizhènyǔ.",
                      "vietnamese": "Mùa này thời tiết biến đổi thất thường và rất nhanh, dự báo thời tiết nói buổi chiều có thể có mưa rào kèm sấm sét."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "那我们阳台上的衣服该收进来了吧？",
                      "pinyin": "Nà wǒmen yángtái shang de yīfu gāi shōu jìnlái le ba?",
                      "vietnamese": "Vậy thì quần áo phơi ngoài ban công phải thu vào rồi nhỉ?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "对，快把衣服收进来，天一下子就阴下来了。",
                      "pinyin": "Duì, kuài bǎ yīfu shōu jìnlái, tiān yíxiàzi jiù yīn xiàlái le.",
                      "vietnamese": "Đúng đấy, mau thu quần áo vào đi, bầu trời trong chớp mắt đã sầm tối lại rồi."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "幸好我们没出门，不然就要被淋湿了。",
                      "pinyin": "Xìnghǎo wǒmen méi chū mén, bùrán jiù yào bèi línshī le.",
                      "vietnamese": "May mà chúng mình chưa ra khỏi nhà, không thì bị ướt như chuột lột rồi."
                  }
              ]
          },
          {
              "id": "hsk3-l12-t2",
              "title": "课文 2: 室内听雨 (Bài khóa 2: Nghe tiếng mưa rơi)",
              "context": "在客厅，李文和白家月听雨声聊天。(Tại phòng khách, nghe mưa rơi trò chuyện).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "外面下起大雨来了，雨点打在玻璃上噼里啪啦的。",
                      "pinyin": "Wàimiàn xià qǐ dà yǔ lái le, yǔdiǎn dǎ zài bōli shang pīlipālā de.",
                      "vietnamese": "Bên ngoài bắt đầu đổ mưa lớn rồi, hạt mưa đập vào cửa kính lộp bộp."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "春天就是这样，一场春雨一场暖。等这场雨下过去，气温就要回升了。",
                      "pinyin": "Chūntiān jiù shì zhèyàng, yì cháng chūnyǔ yì cháng nuǎn. Děng zhè cháng yǔ xià guòqù, qìwēn jiù yào huíshēng le.",
                      "vietnamese": "Mùa xuân chính là như vậy đấy, 'một trận mưa xuân một đợt ấm'. Đợi cơn mưa này tạnh đi là nhiệt độ sẽ tăng ấm trở lại ngay."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "下了雨空气变得好清新啊，花草树木都绿起来了。",
                      "pinyin": "Xià le yǔ kōngqì biàn de hǎo qīngxīn a, huācǎo shùmù dōu lǜ qǐlai le.",
                      "vietnamese": "Sau cơn mưa không khí trở nên trong lành quá, hoa cỏ cây cối đều bừng lên sắc xanh mơn mởn."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "是啊，如果这个雨一直下下去，明天周末我们就在家看书或者看电影吧。",
                      "pinyin": "Shì a, rúguǒ zhè ge yǔ yìzhí xià xiàqu, míngtiān zhōumò wǒmen jiù zài jiā kàn shū huòzhě kàn diànyǐng ba.",
                      "vietnamese": "Đúng thế, nếu cơn mưa này cứ tiếp tục rơi mãi thế này thì cuối tuần ngày mai chúng mình ở nhà đọc sách hoặc xem phim đi."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "这样也挺惬意的！",
                      "pinyin": "Zhèyàng yě tǐng qièyì de!",
                      "vietnamese": "Như thế cũng thật là thi vị và dễ chịu!"
                  }
              ]
          },
          {
              "id": "hsk3-l12-t3",
              "title": "课文 3: 雨后林荫道 (Bài khóa 3: Đường rợp bóng cây sau mưa)",
              "context": "在校园林荫道，雨后散步。(Dạo bước sau cơn mưa rào).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "雨停了，太阳又照出来了，你看天边还挂着一道彩虹呢！",
                      "pinyin": "Yǔ tíng le, tàiyáng yòu zhào chūlái le, nǐ kàn tiānbiān hái guàzhe yí dào cǎihóng ne!",
                      "vietnamese": "Mưa tạnh rồi, mặt trời lại chiếu rọi ra rồi kìa, em nhìn phía chân trời còn treo cả một dải cầu vồng nữa này!"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "真漂亮！微风吹在脸上凉丝丝的，舒服极了。",
                      "pinyin": "Zhēn piàoliang! Wēifēng chuī zài liǎn shang liángsīsī de, shūfu jí le.",
                      "vietnamese": "Đẹp quá chừng! Làn gió thoảng mơn man trên mặt man mát, dễ chịu vô cùng."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "地面有点儿滑，走慢一点儿。",
                      "pinyin": "Dìmiàn yǒudiǎnr huá, zǒu màn yìdiǎnr.",
                      "vietnamese": "Mặt đường hơi trơn trượt đấy, bước chậm lại một chút nhé."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "春天给人的感觉真是充满了生机，心情也跟着好起来了。",
                      "pinyin": "Chūntiān gěi rén de gǎnjué zhēn shì chōngmǎn le shēngjī, xīnqíng yě gēnzhe hǎo qǐlai le.",
                      "vietnamese": "Cảm giác mùa xuân mang lại cho con người ta tràn ngập sức sống, tâm trạng cũng theo đó mà phấn chấn hẳn lên."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "只要坚持锻炼下去，人的精气神就会越来越好。",
                      "pinyin": "Zhǐyào jiānchí duànliàn xiàqu, rén de jīngqìshén jiù huì yuèláiyuè hǎo.",
                      "vietnamese": "Chỉ cần kiên trì tập luyện thể thao tiếp tục, tinh khí thần của con người sẽ ngày càng tuyệt vời hơn."
                  }
              ]
          },
          {
              "id": "hsk3-l12-t4",
              "title": "课文 4: 四季更迭感悟日记 (Bài khóa 4: Nhật ký cảm ngộ bốn mùa)",
              "context": "在日记中，白家月描写春天的变化。(Cảm xúc về thiên nhiên và thời tiết).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "北京的春天短暂而多变。前几天还春寒料峭，需要穿厚外套，今天气温一下子就升到了二十度。",
                      "pinyin": "Běijīng de chūntiān duǎnzàn ér duōbiàn. Qián jǐ tiān hái chūnhán liàoqiào, xūyào chuān hòu wàitào, jīntiān qìwēn yíxiàzi jiù shēng dào le èrshí dù.",
                      "vietnamese": "Mùa xuân ở Bắc Kinh ngắn ngủi mà lại lắm đổi thay. Mới mấy hôm trước trời vẫn còn se lạnh cắt da, cần phải mặc áo khoác dày cộp, hôm nay nhiệt độ đã vọt một phát lên tận hai mươi độ."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "午后一场疾风骤雨突然来袭，但来得快去得也快。雨过天晴之后，整座城市仿佛被洗刷一新。",
                      "pinyin": "Wǔhòu yì cháng jífēng zhòuyǔ tūrán láixí, dàn lái de kuài qù de yě kuài. Yǔ guò tiān qíng zhīhòu, zhěng zuò chéngshì fǎngfú bèi xǐshuā yì xīn.",
                      "vietnamese": "Sau buổi trưa một cơn mưa dông gió giật ập đến bất ngờ, nhưng đến nhanh mà đi cũng vội. Khi mưa tạnh trời quang, toàn bộ thành phố dường như được gột rửa sạch tinh tươm."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "小草从泥土里探出头来，树枝上也冒出了嫩绿的新芽，满园春色让人流连忘返。大自然的四季更迭是如此神奇，每一个季节都有它独特的美丽与韵味。",
                      "pinyin": "Xiǎocǎo cóng nítǔ lǐ tànchū tóu lái, shùzhī shang yě màochū le nènlǜ de xīnyá, mǎnyuán chūnsè ràng rén liúlián wàng fǎn. Dàzìrán de sìjì gēngdié shì rúcǐ shénqí, měi yí ge jìjié dōu yǒu tā dútè de měilì yǔ yùnwèi.",
                      "vietnamese": "Những ngọn cỏ non nhú đầu ra khỏi lớp đất bùn, cành cây cũng đâm chồi những mầm non xanh biếc, sắc xuân ngập tràn khắp vườn khiến người ta vấn vương quên cả lối về. Sự luân chuyển bốn mùa của mẹ thiên nhiên thật kỳ diệu biết bao, mỗi một mùa đều mang trong mình vẻ đẹp và phong vị độc đáo riêng."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l12-g1",
              "title": "1. 选择复句“或者……，或者……” (Câu phức lựa chọn 'Hoặc là... hoặc là...')",
              "explanation": "Dùng trong câu trần thuật để liệt kê hai hoặc nhiều khả năng có thể lựa chọn.",
              "examples": [
                  {
                      "hanzi": "明天周末我们就在家看书或者看电影吧。",
                      "pinyin": "Míngtiān zhōumò wǒmen jiù zài jiā kàn shū huòzhě kàn diànyǐng ba.",
                      "vietnamese": "Cuối tuần ngày mai chúng mình ở nhà đọc sách hoặc xem phim đi."
                  },
                  {
                      "hanzi": "你可以发邮件或者打电话告诉我。",
                      "pinyin": "Nǐ kěyǐ fā yóujiàn huòzhě dǎ diànhuà gàosu wǒ.",
                      "vietnamese": "Bạn có thể gửi email hoặc gọi điện thoại cho tôi."
                  }
              ]
          },
          {
              "id": "hsk3-l12-g2",
              "title": "2. 趋向补语的引申用法（2）—— 动词/形容词 + 起来 (Bắt đầu và tiếp diễn)",
              "explanation": "Biểu thị động tác hoặc trạng thái bắt đầu xuất hiện và tiếp tục phát triển theo chiều hướng tăng lên.",
              "examples": [
                  {
                      "hanzi": "突然刮起大风来了。",
                      "pinyin": "Tūrán guā qǐ dà fēng lái le.",
                      "vietnamese": "Đột nhiên nổi cơn gió to."
                  },
                  {
                      "hanzi": "花草树木都绿起来了。",
                      "pinyin": "Huācǎo shùmù dōu lǜ qǐlai le.",
                      "vietnamese": "Cây cối hoa cỏ đều bắt đầu xanh tươi trở lại."
                  },
                  {
                      "hanzi": "心情也跟着好起来了。",
                      "pinyin": "Xīnqíng yě gēnzhe hǎo qǐlai le.",
                      "vietnamese": "Tâm trạng cũng theo đó mà phấn chấn lên."
                  }
              ]
          },
          {
              "id": "hsk3-l12-g3",
              "title": "3. 范围副词“就” (Phó từ phạm vi và nhấn mạnh)",
              "explanation": "Dùng để nhấn mạnh thời gian diễn ra nhanh chóng hoặc giới hạn phạm vi.",
              "examples": [
                  {
                      "hanzi": "天一下子就阴下来了。",
                      "pinyin": "Tiān yíxiàzi jiù yīn xiàlái le.",
                      "vietnamese": "Trời trong chớp mắt đã sầm tối lại ngay."
                  },
                  {
                      "hanzi": "春天就是这样。",
                      "pinyin": "Chūntiān jiù shì zhèyàng.",
                      "vietnamese": "Mùa xuân chính là như vậy."
                  }
              ]
          },
          {
              "id": "hsk3-l12-g4",
              "title": "4. 趋向补语的引申用法（3）—— 动词 + 下去 (Tiếp tục duy trì)",
              "explanation": "Biểu thị hành động hoặc trạng thái đang diễn ra sẽ tiếp tục được duy trì không ngừng nghỉ.",
              "examples": [
                  {
                      "hanzi": "如果这个雨一直下下去。",
                      "pinyin": "Rúguǒ zhè ge yǔ yìzhí xià xiàqu.",
                      "vietnamese": "Nếu như cơn mưa này cứ tiếp tục rơi mãi."
                  },
                  {
                      "hanzi": "只要坚持锻炼下去，身体就会越来越好。",
                      "pinyin": "Zhǐyào jiānchí duànliàn xiàqu, shēntǐ jiù huì yuèláiyuè hǎo.",
                      "vietnamese": "Chỉ cần kiên trì tập luyện tiếp tục, sức khỏe sẽ ngày càng tốt hơn."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l12-w1",
              "hanzi": "季节",
              "pinyin": "jì jié",
              "hanViet": "Quý Tiết",
              "vietnamese": "mùa màng trong năm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "季节",
              "exampleTranslation": "mùa màng trong năm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w2",
              "hanzi": "变化",
              "pinyin": "biàn huà",
              "hanViet": "Biến Hóa",
              "vietnamese": "thay đổi, biến hóa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "变化",
              "exampleTranslation": "thay đổi, biến hóa",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w3",
              "hanzi": "刮",
              "pinyin": "guā",
              "hanViet": "Quát",
              "vietnamese": "thổi (gió)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "刮",
              "exampleTranslation": "thổi (gió)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w4",
              "hanzi": "雷阵雨",
              "pinyin": "léi zhèn yǔ",
              "hanViet": "",
              "vietnamese": "mưa rào có sấm sét",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "雷阵雨",
              "exampleTranslation": "mưa rào có sấm sét",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w5",
              "hanzi": "阳台",
              "pinyin": "yáng tái",
              "hanViet": "Dương Thai",
              "vietnamese": "ban công",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "阳台",
              "exampleTranslation": "ban công",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w6",
              "hanzi": "收",
              "pinyin": "shōu",
              "hanViet": "Thu",
              "vietnamese": "thu dọn, gom lại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "收",
              "exampleTranslation": "thu dọn, gom lại",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w7",
              "hanzi": "阴",
              "pinyin": "yīn",
              "hanViet": "Âm",
              "vietnamese": "âm u, râm mát",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "阴",
              "exampleTranslation": "âm u, râm mát",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l12-w8",
              "hanzi": "淋",
              "pinyin": "lín",
              "hanViet": "Lâm",
              "vietnamese": "bị dầm ướt (mưa)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "淋",
              "exampleTranslation": "bị dầm ướt (mưa)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w9",
              "hanzi": "玻璃",
              "pinyin": "bō lí",
              "hanViet": "Pha Li",
              "vietnamese": "kính, thủy tinh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "玻璃",
              "exampleTranslation": "kính, thủy tinh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w10",
              "hanzi": "气温",
              "pinyin": "qì wēn",
              "hanViet": "Khí Ôn",
              "vietnamese": "nhiệt độ không khí",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "气温",
              "exampleTranslation": "nhiệt độ không khí",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w11",
              "hanzi": "回升",
              "pinyin": "huí shēng",
              "hanViet": "",
              "vietnamese": "tăng trở lại (nhiệt độ)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "回升",
              "exampleTranslation": "tăng trở lại (nhiệt độ)",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w12",
              "hanzi": "惬意",
              "pinyin": "qiè yì",
              "hanViet": "",
              "vietnamese": "thỏa ý, thi vị",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "惬意",
              "exampleTranslation": "thỏa ý, thi vị",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l12-w13",
              "hanzi": "彩虹",
              "pinyin": "cǎi hóng",
              "hanViet": "Thải Hồng",
              "vietnamese": "cầu vồng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "彩虹",
              "exampleTranslation": "cầu vồng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w14",
              "hanzi": "微风",
              "pinyin": "wēi fēng",
              "hanViet": "",
              "vietnamese": "làn gió nhẹ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "微风",
              "exampleTranslation": "làn gió nhẹ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w15",
              "hanzi": "滑",
              "pinyin": "huá",
              "hanViet": "Hoạt",
              "vietnamese": "trơn trượt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "滑",
              "exampleTranslation": "trơn trượt",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l12-w16",
              "hanzi": "生机",
              "pinyin": "shēng jī",
              "hanViet": "",
              "vietnamese": "sức sống",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "生机",
              "exampleTranslation": "sức sống",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w17",
              "hanzi": "春寒料峭",
              "pinyin": "chūn hán liào qiào",
              "hanViet": "",
              "vietnamese": "rét nàng Bân, se lạnh đầu xuân",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "春寒料峭",
              "exampleTranslation": "rét nàng Bân, se lạnh đầu xuân",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l12-w18",
              "hanzi": "外套",
              "pinyin": "wài tào",
              "hanViet": "Ngoại Sáo",
              "vietnamese": "áo khoác ngoài",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "外套",
              "exampleTranslation": "áo khoác ngoài",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w19",
              "hanzi": "洗刷",
              "pinyin": "xǐ shuā",
              "hanViet": "",
              "vietnamese": "gột rửa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "洗刷",
              "exampleTranslation": "gột rửa",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w20",
              "hanzi": "泥土",
              "pinyin": "ní tǔ",
              "hanViet": "",
              "vietnamese": "đất bùn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "泥土",
              "exampleTranslation": "đất bùn",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l12-w21",
              "hanzi": "嫩绿",
              "pinyin": "nèn lǜ",
              "hanViet": "",
              "vietnamese": "xanh non mơn mởn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "嫩绿",
              "exampleTranslation": "xanh non mơn mởn",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l12-w22",
              "hanzi": "流连忘返",
              "pinyin": "liú lián wàng fǎn",
              "hanViet": "",
              "vietnamese": "lưu luyến quên lối về",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "流连忘返",
              "exampleTranslation": "lưu luyến quên lối về",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l12-w23",
              "hanzi": "更迭",
              "pinyin": "gēng dié",
              "hanViet": "",
              "vietnamese": "thay thế, luân chuyển",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "更迭",
              "exampleTranslation": "thay thế, luân chuyển",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l12-w24",
              "hanzi": "独特",
              "pinyin": "dú tè",
              "hanViet": "Độc Đặc",
              "vietnamese": "độc đáo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "独特",
              "exampleTranslation": "độc đáo",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l12-w25",
              "hanzi": "韵味",
              "pinyin": "yùn wèi",
              "hanViet": "",
              "vietnamese": "phong vị, dư vị",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "韵味",
              "exampleTranslation": "phong vị, dư vị",
              "tags": [
                  "Danh từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l12-ex1",
              "type": "multiple_choice",
              "question": "Điền bổ ngữ xu hướng thích hợp: '天黑了，天气慢慢凉 ______ 了。'",
              "options": [
                  "A. 起来",
                  "B. 下去",
                  "C. 出来",
                  "D. 过去"
              ],
              "correctAnswer": "A. 起来",
              "explanation": "凉起来: bắt đầu trở lạnh (bổ ngữ xu hướng 起来 biểu thị trạng thái bắt đầu phát sinh).",
              "grammarFocus": "Bổ ngữ 起来"
          },
          {
              "id": "hsk3-l12-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '只要你坚持学 ______ (tiếp tục)，汉语水平一定会大幅提高。'",
              "options": [
                  "下去",
                  "起来",
                  "过来",
                  "回去"
              ],
              "correctAnswer": "下去",
              "explanation": "学下去: tiếp tục học tiếp (bổ ngữ 下去 biểu thị hành động duy trì tiếp diễn).",
              "grammarFocus": "Bổ ngữ 下去"
          },
          {
              "id": "hsk3-l12-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "或者喝咖啡",
              "你可以",
              "或者喝热茶"
              ],
              "question": "Sắp xếp câu: '或者喝咖啡 / 你可以 / 或者喝热茶'",
              "correctAnswer": "你可以或者喝咖啡或者喝热茶。",
              "explanation": "Cấu trúc: 或者……或者…… biểu thị sự lựa chọn trong câu trần thuật.",
              "grammarFocus": "Cấu trúc 或者……或者……"
          },
          {
              "id": "hsk3-l12-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '大雨过后，天边挂起了一道美丽的 ______。'",
              "options": [
                  "A. 彩虹",
                  "B. 阳台",
                  "C. 玻璃",
                  "D. 泥土"
              ],
              "correctAnswer": "A. 彩虹",
              "explanation": "彩虹 (cǎihóng): cầu vồng.",
              "grammarFocus": "Từ vựng Bài 12"
          }
      ],
      "cultureBonus": {
          "title": "🌧️ 24 Tiết khí và văn hóa thời tiết Trung Hoa (二十四节气)",
          "summary": "Người Trung Quốc cổ đại đã sáng tạo ra 24 Tiết khí để định hướng canh tác nông nghiệp và dự báo thời tiết.",
          "content": "Những tiết khí như Lập Xuân (立春), Vũ Thủy (雨水), Kinh Trập (惊蛰), Thanh Minh (清明) phản ánh sinh động sự thay đổi tinh tế của khí hậu và vạn vật thiên nhiên. Câu tục ngữ 'Một trận mưa xuân một đợt ấm' (一场春雨一场暖) là đúc kết kinh nghiệm dân gian sâu sắc về sự hồi sinh của mặt đất."
      }
  },
  // =========================================================================
  // LESSON 13: 我的新邻居来自英国
  // =========================================================================
  {
      "lessonNumber": 13,
      "titleHanzi": "我的新邻居来自英国",
      "titlePinyin": "Wǒ de xīn línjū láizì Yīngguó",
      "titleVietnamese": "Người hàng xóm mới của tôi đến từ nước Anh",
      "pageStart": 115,
      "objectives": [
          "Dùng câu điều kiện giả thiết khẩu ngữ '……的话，就……'.",
          "Mở rộng cấu trúc câu chữ '把' (4) với các tân ngữ chỉ trạng thái biến đổi.",
          "Dùng câu phức song hành '一边……，一边……' diễn tả hai động tác đồng thời."
      ],
      "texts": [
          {
              "id": "hsk3-l13-t1",
              "title": "课文 1: 结识新邻居 (Bài khóa 1: Làm quen hàng xóm mới)",
              "context": "在小区花园，王一雪和邻居大卫打招呼。(Ở hoa viên khu phố, chào hỏi người hàng xóm David).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "您好！您是新搬来的邻居吧？",
                      "pinyin": "Nín hǎo! Nín shì xīn bānlái de línjū ba?",
                      "vietnamese": "Chào anh! Anh là người hàng xóm mới chuyển tới đúng không ạ?"
                  },
                  {
                      "speaker": "大卫",
                      "hanzi": "您好！是的，我上周刚搬过来，我叫大卫，来自英国。",
                      "pinyin": "Nín hǎo! Shì de, wǒ shàng zhōu gāng bān guòlái, wǒ jiào Dàwèi, láizì Yīngguó.",
                      "vietnamese": "Chào chị! Vâng đúng rồi, tôi tuần trước vừa mới dọn sang đây, tôi tên là David, đến từ nước Anh."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "欢迎欢迎！我叫王一雪，就住在您对门。在中国的饮食起居还习惯吗？",
                      "pinyin": "Huānyíng huānyíng! Wǒ jiào Wáng Yīxuě, jiù zhù zài nín duìmén. Zài Zhōngguó de yǐnshí qǐjū hái xíguàn ma?",
                      "vietnamese": "Nhiệt liệt chào mừng anh! Tôi tên là Vương Nhất Tuyết, ở ngay đối diện cửa nhà anh. Sinh hoạt ăn uống ở Trung Quốc anh đã quen chưa?"
                  },
                  {
                      "speaker": "大卫",
                      "hanzi": "挺好的，这边的邻里之间非常友好热情。",
                      "pinyin": "Tǐng hǎo de, zhèbiān de línlǐ zhījiān fēicháng yǒuhǎo rèqíng.",
                      "vietnamese": "Khá tốt chị ạ, tình cảm bà con lối xóm quanh đây vô cùng thân thiện và nhiệt tình."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "如果遇到什么困难的话，就随时来找我帮忙。",
                      "pinyin": "Rúguǒ yùdào shénme kùnnan dehuà, jiù suíshí lái zhǎo wǒ bāngmáng.",
                      "vietnamese": "Nếu có gặp khó khăn gì, anh cứ thoải mái sang tìm tôi giúp đỡ bất cứ lúc nào nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l13-t2",
              "title": "课文 2: 互相帮助 (Bài khóa 2: Tương trợ lẫn nhau)",
              "context": "在走廊，王一雪帮大卫搬东西。(Tại hành lang, giúp đỡ mang vác đồ đạc).",
              "lines": [
                  {
                      "speaker": "大卫",
                      "hanzi": "一雪，真不好意思麻烦你，这个包裹有点儿沉。",
                      "pinyin": "Yīxuě, zhēn bù hǎoyìsi máfan nǐ, zhè ge bāoguǒ yǒudiǎnr chén.",
                      "vietnamese": "Nhất Tuyết, thật ngại quá khi làm phiền chị, kiện hàng này có hơi nặng một chút."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "没关系，邻里之间互相帮助是应该的。我们一起把这个箱子抬进屋吧。",
                      "pinyin": "Méi guānxi, línlǐ zhījiān hùxiāng bāngzhù shì yīnggāi de. Wǒmen yìqǐ bǎ zhè ge xiāngzi tái jìn wū ba.",
                      "vietnamese": "Không sao đâu, hàng xóm láng giềng giúp đỡ lẫn nhau là việc đương nhiên mà. Chúng ta cùng khiêng chiếc thùng này vào trong nhà nhé."
                  },
                  {
                      "speaker": "大卫",
                      "hanzi": "好的，小心别把地板划伤了。",
                      "pinyin": "Hǎo de, xiǎoxīn bié bǎ dìbǎn huáshāng le.",
                      "vietnamese": "Vâng, cẩn thận kẻo làm xước sàn nhà nhé chị."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "放在客厅中间就可以了吗？",
                      "pinyin": "Fàng zài kètīng zhōngjiān jiù kěyǐ le ma?",
                      "vietnamese": "Đặt ở giữa phòng khách là được rồi đúng không?"
                  },
                  {
                      "speaker": "大卫",
                      "hanzi": "对，放这儿就行。多亏了你，不然我一个人可真拿不上来。",
                      "pinyin": "Duì, fàng zhèr jiù xíng. Duōkuī le nǐ, bùrán wǒ yí ge rén kě zhēn ná bu shànglái.",
                      "vietnamese": "Đúng rồi, để đây là được ạ. May nhờ có chị, không thì một mình tôi chẳng thể nào vác nổi lên đây."
                  }
              ]
          },
          {
              "id": "hsk3-l13-t3",
              "title": "课文 3: 英式下午茶 (Bài khóa 3: Tiệc trà chiều kiểu Anh)",
              "context": "在客厅，大卫泡红茶招待王一雪。(Tại phòng khách, David pha hồng trà thết đãi).",
              "lines": [
                  {
                      "speaker": "大卫",
                      "hanzi": "请坐，我给你泡一杯地道的英式红茶，尝尝合不合口味。",
                      "pinyin": "Qǐng zuò, wǒ gěi nǐ pào yì bēi dìdao de Yīngshì hóngchá, chángchang hé bu hé kǒuwèi.",
                      "vietnamese": "Mời chị ngồi, tôi pha cho chị một tách hồng trà chuẩn vị Anh quốc, chị nếm thử xem có hợp khẩu vị không nhé."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "闻着好香啊，味道醇厚甘甜。",
                      "pinyin": "Wénzhe hǎo xiāng a, wèidao chúnhòu gāntián.",
                      "vietnamese": "Ngửi thơm quá, vị đậm đà thơm ngọt."
                  },
                  {
                      "speaker": "大卫",
                      "hanzi": "我们英国人喜欢一边喝下午茶，一边聊天儿，特别放松。",
                      "pinyin": "Wǒmen Yīngguórén xǐhuan yìbiān hē xiàwǔchá, yìbiān liáotiānr, tèbié fàngsōng.",
                      "vietnamese": "Người Anh chúng tôi thích vừa uống trà chiều vừa hàn huyên trò chuyện, cảm giác rất thư thái."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "我们中国人也喜欢一边品茶，一边谈天说地，文化虽然不同，但对美好生活的追求是一样的。",
                      "pinyin": "Wǒmen Zhōngguórén yě xǐhuan yìbiān pǐnchá, yìbiān tántiānshuōdì, wénhuà suīrán bù tóng, dàn duì měihǎo shēnghuó de zhuīqiú shì yíyàng de.",
                      "vietnamese": "Người Trung Quốc bọn tôi cũng thích vừa thưởng trà vừa đàm đạo chuyện trên trời dưới đất, văn hóa dẫu khác biệt nhưng sự hướng tới cuộc sống tốt đẹp thì đều như nhau cả."
                  },
                  {
                      "speaker": "大卫",
                      "hanzi": "说得太对了！能遇到你这样的邻居真是我的荣幸。",
                      "pinyin": "Shuō de tài duì le! Néng yùdào nǐ zhèyàng de línjū zhēn shì wǒ de róngxìng.",
                      "vietnamese": "Chị nói chuẩn quá đi mất! Gặp được người hàng xóm như chị thực sự là vinh hạnh lớn của tôi."
                  }
              ]
          },
          {
              "id": "hsk3-l13-t4",
              "title": "课文 4: 邻里温情日记 (Bài khóa 4: Nhật ký tình làng nghĩa xóm)",
              "context": "在日记中，王一雪写邻里温情。(Nhật ký về sự ấm áp giữa những người hàng xóm).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "俗话说“远亲不如近邻”。我的新邻居大卫是个非常有礼貌且开朗的英国小伙子。",
                      "pinyin": "Súhuà shuō 'yuǎnqīn bùrú jìnlín'. Wǒ de xīn línjū Dàwèi shì ge fēicháng yǒu lǐmào qiě kāilǎng de Yīngguó xiǎohuǒzi.",
                      "vietnamese": "Tục ngữ có câu 'Bà con xa không bằng láng giềng gần'. Người hàng xóm mới David của tôi là một chàng trai người Anh rất lễ phép và cởi mở."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "今天我去他家做客，他热情地给我泡了英式红茶，还拿出了从英国带来的传统饼干。我们一边喝着下午茶，一边交流着中英两国不同的风俗习惯。",
                      "pinyin": "Jīntiān wǒ qù tā jiā zuòkè, tā rèqíng de gěi wǒ pào le Yīngshì hóngchá, hái náchū le cóng Yīngguó dàilái de chuántǒng bǐnggān. Wǒmen yìbiān hēzhe xiàwǔchá, yìbiān jiāoliúzhe Zhōng Yīng liǎng guó bù tóng de fēngsú xíguàn.",
                      "vietnamese": "Hôm nay tôi sang nhà cậu ấy làm khách, cậu ấy nhiệt tình pha trà đen kiểu Anh và còn mang cả bánh quy truyền thống đem từ nước Anh sang chiêu đãi. Chúng tôi vừa thưởng thức trà chiều vừa chuyện trò trao đổi về những phong tục tập quán khác nhau giữa hai nước Trung - Anh."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "虽然他的汉语还不是很流利，但我们沟通起来毫无障碍。友善和微笑是跨越国界的通用语言，良好的邻里关系让平凡的日子充满了温暖。",
                      "pinyin": "Suīrán tā de Hànyǔ hái bú shì hěn liúlì, dàn wǒmen gōutōng qǐlai háowú zhàng'ài. Yǒushàn hé wēixiào shì kuàyuè guójiè de tōngyòng yǔyán, liánghǎo de línlǐ guānxì ràng píngfán de rìzi chōngmǎn le wēnnuǎn.",
                      "vietnamese": "Tuy rằng tiếng Trung của cậu ấy chưa thật lưu loát, nhưng chúng tôi trò chuyện chẳng hề có bất cứ rào cản nào. Sự thân thiện và nụ cười chính là ngôn ngữ chung vượt qua mọi biên giới quốc gia, mối quan hệ láng giềng tốt đẹp khiến những ngày tháng bình dị ngập tràn sự ấm áp."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l13-g1",
              "title": "1. 假设复句“……的话，就……” (Câu giả thiết khẩu ngữ 'Nếu... thì...')",
              "explanation": "Được dùng rất phổ biến trong khẩu ngữ tiếng Hán để biểu thị giả định điều kiện ở vế trước và kết quả tương ứng ở vế sau.",
              "examples": [
                  {
                      "hanzi": "如果遇到什么困难的话，就随时来找我。",
                      "pinyin": "Rúguǒ yùdào shénme kùnnan dehuà, jiù suíshí lái zhǎo wǒ.",
                      "vietnamese": "Nếu gặp phải khó khăn gì thì cứ tìm tôi bất cứ lúc nào."
                  },
                  {
                      "hanzi": "有空儿的话，就来我家玩儿吧。",
                      "pinyin": "Yǒu kòngr dehuà, jiù lái wǒ jiā wánr ba.",
                      "vietnamese": "Nếu có thời gian rảnh thì ghé nhà mình chơi nhé."
                  }
              ]
          },
          {
              "id": "hsk3-l13-g2",
              "title": "2. “把”字句（4）—— 导致结果变化 (Câu chữ 把 biểu thị sự tác động làm biến đổi)",
              "explanation": "Cấu trúc: 主语 + 把 + 宾语 + 动词 + 结果补语 (như 伤, 碎, 破, 丢).",
              "examples": [
                  {
                      "hanzi": "小心别把地板划伤了。",
                      "pinyin": "Xiǎoxīn bié bǎ dìbǎn huáshāng le.",
                      "vietnamese": "Cẩn thận đừng làm xước sàn nhà."
                  },
                  {
                      "hanzi": "他不小心把杯子打破了。",
                      "pinyin": "Tā bù xiǎoxīn bǎ bēizi dǎpò le.",
                      "vietnamese": "Anh ấy sơ ý làm vỡ chiếc cốc."
                  }
              ]
          },
          {
              "id": "hsk3-l13-g3",
              "title": "3. 并列复句“一边……，一边……” (Câu song hành 'Vừa... vừa...')",
              "explanation": "Biểu thị cùng một chủ ngữ thực hiện song song hai hành động tại cùng một thời điểm.",
              "examples": [
                  {
                      "hanzi": "我们一边喝下午茶，一边聊天儿。",
                      "pinyin": "Wǒmen yìbiān hē xiàwǔchá, yìbiān liáotiānr.",
                      "vietnamese": "Chúng tôi vừa uống trà chiều vừa trò chuyện."
                  },
                  {
                      "hanzi": "他喜欢一边听音乐，一边写作业。",
                      "pinyin": "Tā xǐhuan yìbiān tīng yīnyuè, yìbiān xiě zuòyè.",
                      "vietnamese": "Cậu ấy thích vừa nghe nhạc vừa làm bài tập."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l13-w1",
              "hanzi": "邻居",
              "pinyin": "lín jū",
              "hanViet": "Lân Cư",
              "vietnamese": "người hàng xóm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "邻居",
              "exampleTranslation": "người hàng xóm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w2",
              "hanzi": "来自",
              "pinyin": "lái zì",
              "hanViet": "Lai Tự",
              "vietnamese": "đến từ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "来自",
              "exampleTranslation": "đến từ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l13-w3",
              "hanzi": "对门",
              "pinyin": "duì mén",
              "hanViet": "",
              "vietnamese": "nhà đối diện cửa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "对门",
              "exampleTranslation": "nhà đối diện cửa",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w4",
              "hanzi": "饮食",
              "pinyin": "yǐn shí",
              "hanViet": "Ẩm Thực",
              "vietnamese": "ẩm thực, ăn uống",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "饮食",
              "exampleTranslation": "ẩm thực, ăn uống",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w5",
              "hanzi": "起居",
              "pinyin": "qǐ jū",
              "hanViet": "",
              "vietnamese": "sinh hoạt thường nhật",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "起居",
              "exampleTranslation": "sinh hoạt thường nhật",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w6",
              "hanzi": "习惯",
              "pinyin": "xí guàn",
              "hanViet": "Tập Quán",
              "vietnamese": "thói quen, tập quán",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "习惯",
              "exampleTranslation": "thói quen, tập quán",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l13-w7",
              "hanzi": "邻里",
              "pinyin": "lín lǐ",
              "hanViet": "",
              "vietnamese": "hàng xóm láng giềng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "邻里",
              "exampleTranslation": "hàng xóm láng giềng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w8",
              "hanzi": "友好",
              "pinyin": "yǒu hǎo",
              "hanViet": "Hữu Hảo",
              "vietnamese": "thân thiện, hữu hảo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "友好",
              "exampleTranslation": "thân thiện, hữu hảo",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w9",
              "hanzi": "包裹",
              "pinyin": "bāo guǒ",
              "hanViet": "Bao Khỏa",
              "vietnamese": "bưu phẩm, bọc hàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "包裹",
              "exampleTranslation": "bưu phẩm, bọc hàng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w10",
              "hanzi": "沉",
              "pinyin": "chén",
              "hanViet": "Trầm",
              "vietnamese": "nặng trịch",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "沉",
              "exampleTranslation": "nặng trịch",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w11",
              "hanzi": "抬",
              "pinyin": "tái",
              "hanViet": "Sĩ",
              "vietnamese": "khiêng, nâng lên",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "抬",
              "exampleTranslation": "khiêng, nâng lên",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l13-w12",
              "hanzi": "划伤",
              "pinyin": "huà shāng",
              "hanViet": "",
              "vietnamese": "làm trầy xước",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "划伤",
              "exampleTranslation": "làm trầy xước",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l13-w13",
              "hanzi": "地板",
              "pinyin": "dì bǎn",
              "hanViet": "",
              "vietnamese": "sàn nhà gỗ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "地板",
              "exampleTranslation": "sàn nhà gỗ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w14",
              "hanzi": "地道",
              "pinyin": "dì dào",
              "hanViet": "Địa Đạo",
              "vietnamese": "chuẩn vị, chính cống",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "地道",
              "exampleTranslation": "chuẩn vị, chính cống",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w15",
              "hanzi": "红茶",
              "pinyin": "hóng chá",
              "hanViet": "Hồng Trà",
              "vietnamese": "hồng trà, trà đen",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "红茶",
              "exampleTranslation": "hồng trà, trà đen",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w16",
              "hanzi": "口味",
              "pinyin": "kǒu wèi",
              "hanViet": "Khẩu Vị",
              "vietnamese": "khẩu vị",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "口味",
              "exampleTranslation": "khẩu vị",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w17",
              "hanzi": "醇厚",
              "pinyin": "chún hòu",
              "hanViet": "",
              "vietnamese": "đậm đà thuần hậu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "醇厚",
              "exampleTranslation": "đậm đà thuần hậu",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w18",
              "hanzi": "甘甜",
              "pinyin": "gān tián",
              "hanViet": "",
              "vietnamese": "ngọt dịu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "甘甜",
              "exampleTranslation": "ngọt dịu",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w19",
              "hanzi": "下午茶",
              "pinyin": "xià wǔ chá",
              "hanViet": "",
              "vietnamese": "trà chiều",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "下午茶",
              "exampleTranslation": "trà chiều",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w20",
              "hanzi": "品茶",
              "pinyin": "pǐn chá",
              "hanViet": "",
              "vietnamese": "thưởng thức trà",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "品茶",
              "exampleTranslation": "thưởng thức trà",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l13-w21",
              "hanzi": "荣幸",
              "pinyin": "róng xìng",
              "hanViet": "",
              "vietnamese": "vinh hạnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "荣幸",
              "exampleTranslation": "vinh hạnh",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w22",
              "hanzi": "礼貌",
              "pinyin": "lǐ mào",
              "hanViet": "Lễ Mạo",
              "vietnamese": "lễ phép, lịch thiệp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "礼貌",
              "exampleTranslation": "lễ phép, lịch thiệp",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w23",
              "hanzi": "开朗",
              "pinyin": "kāi lǎng",
              "hanViet": "",
              "vietnamese": "cởi mở, hoạt bát",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "开朗",
              "exampleTranslation": "cởi mở, hoạt bát",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l13-w24",
              "hanzi": "饼干",
              "pinyin": "bǐng gān",
              "hanViet": "Bính Kiền",
              "vietnamese": "bánh quy",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "饼干",
              "exampleTranslation": "bánh quy",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l13-w25",
              "hanzi": "障碍",
              "pinyin": "zhàng ài",
              "hanViet": "Chướng Ngại",
              "vietnamese": "rào cản, chướng ngại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "障碍",
              "exampleTranslation": "rào cản, chướng ngại",
              "tags": [
                  "Danh từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l13-ex1",
              "type": "multiple_choice",
              "question": "Điền từ vào câu giả thiết: '明天不下雨 ______，我们就去公园野餐。'",
              "options": [
                  "A. 的话",
                  "B. 可是",
                  "C. 无论",
                  "D. 虽然"
              ],
              "correctAnswer": "A. 的话",
              "explanation": "Cấu trúc giả định trong khẩu ngữ: ……的话 (nếu như...).",
              "grammarFocus": "Cấu trúc ……的话"
          },
          {
              "id": "hsk3-l13-ex2",
              "type": "fill_blank",
              "question": "Điền từ thích hợp: '大家一边吃水果，一 ______ (vừa) 聊天儿。'",
              "options": [
                  "边",
                  "面",
                  "齐",
                  "同"
              ],
              "correctAnswer": "边",
              "explanation": "Cặp liên từ song hành: 一边……，一边…… (vừa... vừa...).",
              "grammarFocus": "Liên từ 一边……一边……"
          },
          {
              "id": "hsk3-l13-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "别把",
              "弄湿了",
              "小心地板"
              ],
              "question": "Sắp xếp câu: '别把 / 弄湿了 / 小心地板'",
              "correctAnswer": "小心别把地板弄湿了。",
              "explanation": "Cấu trúc câu chữ 把: 主语 + 把 + 宾语 + 动词 + 结果补语.",
              "grammarFocus": "Câu chữ 把"
          },
          {
              "id": "hsk3-l13-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '俗话说“远亲不如 ______”，大家相处得十分融洽。'",
              "options": [
                  "A. 近邻",
                  "B. 朋友",
                  "C. 同事",
                  "D. 老师"
              ],
              "correctAnswer": "A. 近邻",
              "explanation": "Tục ngữ nổi tiếng: 远亲不如近邻 (Bà con xa không bằng láng giềng gần).",
              "grammarFocus": "Từ vựng Bài 13"
          }
      ],
      "cultureBonus": {
          "title": "🍵 Nghệ thuật thưởng trà Trung Hoa và phương Tây (中西茶文化交融)",
          "summary": "Trà Trung Quốc chú trọng sự tĩnh tại nguyên bản, trà phương Tây ưa chuộng sự tao nhã ngọt ngào.",
          "content": "Trong khi người Trung Quốc yêu thích nghệ thuật 'công phu trà' (功夫茶) với các loại trà xanh, trà ô long nguyên chất nhâm nhi bên tri kỷ, thì tiệc trà chiều kiểu Anh (English Afternoon Tea) lại kết hợp trà đen với sữa tươi, đường và bánh ngọt. Sự giao lưu giữa hai nền văn hóa trà mang lại trải nghiệm thi vị độc đáo."
      }
  },
  // =========================================================================
  // LESSON 14: 这本书被别人借走了
  // =========================================================================
  {
      "lessonNumber": 14,
      "titleHanzi": "这本书被别人借走了",
      "titlePinyin": "Zhè běn shū bèi biérén jiè zǒu le",
      "titleVietnamese": "Cuốn sách này bị người khác mượn đi rồi",
      "pageStart": 124,
      "objectives": [
          "Nắm bản chất và cấu trúc câu bị động chữ '被' (1).",
          "Dùng câu phức tiếp nối '先……，再/然后……' thuật lại trình tự sự việc.",
          "Dùng khẩu ngữ '……什么（啊）' biểu thị ý phản bác hoặc phủ định nhẹ."
      ],
      "texts": [
          {
              "id": "hsk3-l14-t1",
              "title": "课文 1: 查阅词典 (Bài khóa 1: Tìm kiếm từ điển)",
              "context": "在图书馆，李文查阅借阅记录。(Tại thư viện, Lý Văn tra cứu hồ sơ mượn).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "白家月，你要找的那本现代汉语词典找到了吗？",
                      "pinyin": "Bái Jiāyuè, nǐ yào zhǎo de nà běn Xiàndài Hànyǔ Cídiǎn zhǎodào le ma?",
                      "vietnamese": "Bạch Gia Nguyệt, cuốn Từ điển Hán ngữ hiện đại mà em muốn tìm đã thấy chưa?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "没找到，系统显示昨天下午这本书被别人借走了。",
                      "pinyin": "Méi zhǎodào, xìtǒng xiǎnshì zuótiān xiàwǔ zhè běn shū bèi biérén jiè zǒu le.",
                      "vietnamese": "Chưa tìm thấy anh ạ, hệ thống hiển thị chiều hôm qua cuốn sách này đã bị người khác mượn đi mất rồi."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "那太不凑巧了。别的分馆还有没有藏书？",
                      "pinyin": "Nà tài bú còuqiǎo le. Bié de fēnguǎn hái yǒu méiyǒu cángshū?",
                      "vietnamese": "Thế thì không may quá rồi. Các chi nhánh thư viện khác còn lưu trữ bản nào không?"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "还有一个分馆有，但是离得挺远的。",
                      "pinyin": "Hái yǒu yí ge fēnguǎn yǒu, dànshì lí de tǐng yuǎn de.",
                      "vietnamese": "Còn một phân viện có sách, nhưng mà nằm khá là xa."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "我们可以先在网上预约，等书被还回来了，系统就会发短信通知你。",
                      "pinyin": "Wǒmen kěyǐ xiān zài wǎngshang yùyuē, děng shū bèi huánhuílái le, xìtǒng jiù huì fā duǎnxìn tōngzhī nǐ.",
                      "vietnamese": "Chúng mình có thể đặt chỗ trước qua mạng, đợi tới khi sách được người ta đem trả, hệ thống sẽ gửi tin nhắn báo cho em biết."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "好主意，那我现在就在手机上先预约，然后再查别的参考资料。",
                      "pinyin": "Hǎo zhǔyi, nà wǒ xiànzài jiù zài shǒujī shang xiān yùyuē, ránhòu zài chá bié de cānkǎo zīliào.",
                      "vietnamese": "Ý hay đấy ạ, vậy bây giờ em sẽ đặt trước trên điện thoại, sau đó tiếp tục tra cứu các tài liệu tham khảo khác."
                  }
              ]
          },
          {
              "id": "hsk3-l14-t2",
              "title": "课文 2: 打翻水杯 (Bài khóa 2: Vô ý đổ cốc nước)",
              "context": "在阅览室，白家月不小心打翻水杯。(Tại phòng đọc, sơ ý gạt đổ ly nước).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "哎呀，糟糕！水杯不小心被我碰倒了，桌上的报纸被水弄湿了！",
                      "pinyin": "Āiyā, zāogāo! Shuǐbēi bù xiǎoxīn bèi wǒ pèngdǎo le, zhuō shang de bàozhǐ bèi shuǐ nòngshī le!",
                      "vietnamese": "Ôi thôi chết, nguy rồi! Cốc nước sơ ý bị em gạt đổ mất rồi, tờ báo trên bàn bị nước làm ướt sũng rồi!"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "别慌，快把笔记本拿开，我用纸巾擦一下。",
                      "pinyin": "Bié huāng, kuài bǎ bǐjìběn nákāi, wǒ yòng zhǐjīn cā yíxià.",
                      "vietnamese": "Đừng hoảng, mau nhấc cuốn sổ tay ra, anh dùng khăn giấy lau cho."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "真不好意思，把公共阅览室的报纸弄坏了。",
                      "pinyin": "Zhēn bù hǎoyìsi, bǎ gōnggòng yuèlǎnshì de bàozhǐ nònghuài le.",
                      "vietnamese": "Thật là áy náy quá, em làm hỏng mất tờ báo của phòng đọc chung rồi."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "弄坏什么啊！只是湿了一点儿边角，晒干了就能看，别自责了。",
                      "pinyin": "Nònghuài shénme a! Zhǐshì shī le yìdiǎnr biānjiǎo, shàigān le jiù néng kàn, bié zìzé le.",
                      "vietnamese": "Hỏng hóc cái gì cơ chứ! Chỉ ướt một tí xíu ngoài mép thôi, phơi khô là đọc được bình thường ngay, đừng tự trách mình nữa."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "幸好书本没被弄湿，以后放在桌上的水杯一定要拧紧盖子。",
                      "pinyin": "Xìnghǎo shūběn méi bèi nòngshī, yǐhòu fàng zài zhuō shang de shuǐbēi yídìng yào nǐngjǐn gàizi.",
                      "vietnamese": "May mà sách không bị dính nước, từ nay về sau cốc nước đặt trên bàn nhất định phải vặn chặt nắp lại."
                  }
              ]
          },
          {
              "id": "hsk3-l14-t3",
              "title": "课文 3: 优秀读书笔记 (Bài khóa 3: Bản ghi chép xuất sắc)",
              "context": "在自习室，李文和白家月整理读书笔记。(Tại phòng tự học, sắp xếp bài học).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "这篇文章的结构非常有条理。作者先提出了中心论点，然后分三段论述，最后做总结。",
                      "pinyin": "Zhè piān wénzhāng de jiégòu fēicháng yǒu tiáolǐ. Zuòzhě xiān tíchū le zhōngxīn lùndiǎn, ránhòu fēn sān duàn lùnshù, zuìhòu zuò zǒngjié.",
                      "vietnamese": "Kết cấu của bài văn này vô cùng mạch lạc chặt chẽ. Tác giả trước tiên nêu ra luận điểm trung tâm, sau đó chia làm ba đoạn để luận chứng, và cuối cùng đưa ra kết luận."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "这种写作方法非常值得我们借鉴。",
                      "pinyin": "Zhè zhǒng xiězuò fāngfǎ fēicháng zhídé wǒmen jièjiàn.",
                      "vietnamese": "Phương pháp viết luận này vô cùng xứng đáng để chúng ta học tập tham khảo."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "你的这篇读书笔记被导师当成优秀作业在课堂上展示了呢！",
                      "pinyin": "Nǐ de zhè piān dúshū bǐjì bèi dǎoshī dāngchéng yōuxiù zuòyè zài kètáng shang zhǎnshì le ne!",
                      "vietnamese": "Bài ghi chép đọc sách này của em đã được thầy giáo hướng dẫn chọn làm bài tập xuất sắc để trình chiếu trước cả lớp đấy!"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "真的吗？我还以为写得不够深刻呢。",
                      "pinyin": "Zhēn de ma? Wǒ hái yǐwéi xiě de bú gòu shēnkè ne.",
                      "vietnamese": "Thật thế hả anh? Em cứ tưởng mình viết chưa đủ sâu sắc cơ đấy."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "谦虚什么啊，大家一致觉得你总结得既全面又生动！",
                      "pinyin": "Qiānxū shénme a, dàjiā yízhì juéde nǐ zǒngjié de jì quánmiàn yòu shēngdòng!",
                      "vietnamese": "Khiêm tốn cái gì chứ, mọi người đều nhất trí đánh giá là em tổng kết vừa toàn diện vừa vô cùng sinh động!"
                  }
              ]
          },
          {
              "id": "hsk3-l14-t4",
              "title": "课文 4: 图书馆自习日记 (Bài khóa 4: Nhật ký tự học tại thư viện)",
              "context": "在日记中，李文记录图书馆的一天。(Ghi chép về trải nghiệm học tập).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "今天在图书馆度过了安静而充实的大半天。虽然最想借的那本词典被别人抢先借走了，但通过线上预约系统，问题很快得到了妥善解决。",
                      "pinyin": "Jīntiān zài túshūguǎn dùguò le ānjìng ér chōngshí de dàbàn tiān. Suīrán zuì xiǎng jiè de nà běn cídiǎn bèi biérén qiǎngxiān jiè zǒu le, dàn tōngguò xiànshàng yùyuē xìtǒng, wèntí hěn kuài dédào le tuǒshàn jiějué.",
                      "vietnamese": "Hôm nay tôi đã trải qua hơn nửa ngày đầy tĩnh lặng và bổ ích tại thư viện. Tuy rằng cuốn từ điển muốn mượn nhất đã bị người khác nhanh chân mượn trước, nhưng nhờ hệ thống đặt trước trực tuyến mà vấn đề đã nhanh chóng được giải quyết ổn thỏa."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "在自习的过程中，偶尔发生的小意外也在互相帮助中化解了。学习写文章就像造房子，先打好坚实的地基，再一砖一瓦地搭建框架，最后才能建成坚固漂亮的大厦。",
                      "pinyin": "Zài zìxí de guòchéng zhōng, ǒu'ěr fāshēng de xiǎo yìwài yě zài hùxiāng bāngzhù zhōng huàjiě le. Xuéxí xiě wénzhāng jiù xiàng zào fángzi, xiān dǎ hǎo jiānshí de dìjī, zài yì zhuān yì wǎ de dājiàn kuàngjià, zuìhòu cái néng jiànchéng jiāngù piàoliang de dàshà.",
                      "vietnamese": "Trong quá trình tự học, những sự cố nhỏ bất ngờ xảy ra cũng được hóa giải nhờ sự tương trợ lẫn nhau. Học viết văn cũng giống như xây một ngôi nhà, trước hết phải đặt nền móng thật vững chắc, sau đó xây từng viên gạch lợp từng viên ngói để dựng khung sườn, cuối cùng mới xây nên một tòa cao ốc kiên cố và lộng lẫy."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "每一天的积累，都是通往成功的坚实台阶。",
                      "pinyin": "Měi yì tiān de jīlěi, dōu shì tōngwǎng chénggōng de jiānshí táijiē.",
                      "vietnamese": "Sự tích lũy bền bỉ qua từng ngày đều là những bậc thang kiên cố dẫn lối bước tới thành công."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l14-g1",
              "title": "1. 被动句（1）—— “被”字句 (Câu bị động chữ '被')",
              "explanation": "Cấu trúc: 受事 (Chủ ngữ tiếp nhận) + 被 + (施事 - Chủ thể tác động) + 动词 + 其他成分. Dùng để biểu thị chủ ngữ bị tác động và chịu kết quả nào đó (thường mang sắc thái không như mong muốn).",
              "examples": [
                  {
                      "hanzi": "这本书被别人借走了。",
                      "pinyin": "Zhè běn shū bèi biérén jiè zǒu le.",
                      "vietnamese": "Cuốn sách này bị người khác mượn đi mất rồi."
                  },
                  {
                      "hanzi": "水杯被我碰倒了。",
                      "pinyin": "Shuǐbēi bèi wǒ pèngdǎo le.",
                      "vietnamese": "Chiếc cốc bị tôi gạt đổ."
                  },
                  {
                      "hanzi": "报纸被水弄湿了。",
                      "pinyin": "Bàozhǐ bèi shuǐ nòngshī le.",
                      "vietnamese": "Tờ báo bị nước làm ướt sũng."
                  }
              ]
          },
          {
              "id": "hsk3-l14-g2",
              "title": "2. 承接复句“先……，再/然后……” (Câu phức tiếp nối theo trình tự thời gian)",
              "explanation": "Dùng để diễn tả một chuỗi các hành động diễn ra nối tiếp nhau theo thứ tự trước sau rõ ràng.",
              "examples": [
                  {
                      "hanzi": "我们先在网上预约，然后再查别的资料。",
                      "pinyin": "Wǒmen xiān zài wǎngshang yùyuē, ránhòu zài chá bié de zīliào.",
                      "vietnamese": "Chúng ta đặt trước qua mạng trước, sau đó mới tra tài liệu khác."
                  },
                  {
                      "hanzi": "先打好地基，再搭建框架。",
                      "pinyin": "Xiān dǎ hǎo dìjī, zài dājiàn kuàngjià.",
                      "vietnamese": "Trước tiên làm móng vững vàng, sau đó dựng bộ khung."
                  }
              ]
          },
          {
              "id": "hsk3-l14-g3",
              "title": "3. 固定格式“……什么（啊）” (Khẩu ngữ phản bác / phủ định nhẹ)",
              "explanation": "Được dùng phổ biến trong khẩu ngữ khi người nói muốn phản bác nhẹ nhàng hoặc an ủi người khác đừng lo lắng, đừng ngại ngùng.",
              "examples": [
                  {
                      "hanzi": "弄坏什么啊！只是湿了一点儿。",
                      "pinyin": "Nònghuài shénme a! Zhǐshì shī le yìdiǎnr.",
                      "vietnamese": "Hỏng hóc cái gì cơ chứ! Chỉ ướt có một chút thôi mà."
                  },
                  {
                      "hanzi": "客气什么啊，我们都是好朋友！",
                      "pinyin": "Kèqi shénme a, wǒmen dōu shì hǎo péngyou!",
                      "vietnamese": "Khách sáo cái gì chứ, chúng mình đều là bạn tốt của nhau cả mà!"
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l14-w1",
              "hanzi": "被",
              "pinyin": "bèi",
              "hanViet": "Bị",
              "vietnamese": "bị, được (giới từ câu bị động)",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "被",
              "exampleTranslation": "bị, được (giới từ câu bị động)",
              "tags": [
                  "Giới từ"
              ]
          },
          {
              "id": "hsk3-l14-w2",
              "hanzi": "系统",
              "pinyin": "xì tǒng",
              "hanViet": "Hệ Thống",
              "vietnamese": "hệ thống",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "系统",
              "exampleTranslation": "hệ thống",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w3",
              "hanzi": "凑巧",
              "pinyin": "còu qiǎo",
              "hanViet": "",
              "vietnamese": "tình cờ, may mắn trùng hợp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "凑巧",
              "exampleTranslation": "tình cờ, may mắn trùng hợp",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l14-w4",
              "hanzi": "分馆",
              "pinyin": "fēn guǎn",
              "hanViet": "",
              "vietnamese": "phân nhánh, chi nhánh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "分馆",
              "exampleTranslation": "phân nhánh, chi nhánh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w5",
              "hanzi": "藏书",
              "pinyin": "cáng shū",
              "hanViet": "",
              "vietnamese": "sách lưu trữ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "藏书",
              "exampleTranslation": "sách lưu trữ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w6",
              "hanzi": "预约",
              "pinyin": "yù yuē",
              "hanViet": "Dự Ước",
              "vietnamese": "đặt trước hẹn trước",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "预约",
              "exampleTranslation": "đặt trước hẹn trước",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w7",
              "hanzi": "短信",
              "pinyin": "duǎn xìn",
              "hanViet": "Đoản Tín",
              "vietnamese": "tin nhắn văn bản SMS",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "短信",
              "exampleTranslation": "tin nhắn văn bản SMS",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w8",
              "hanzi": "糟糕",
              "pinyin": "zāo gāo",
              "hanViet": "Tao Cao",
              "vietnamese": "hỏng bét, gay go",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "糟糕",
              "exampleTranslation": "hỏng bét, gay go",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l14-w9",
              "hanzi": "碰倒",
              "pinyin": "pèng dào",
              "hanViet": "",
              "vietnamese": "va quệt làm đổ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "碰倒",
              "exampleTranslation": "va quệt làm đổ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w10",
              "hanzi": "弄湿",
              "pinyin": "nòng shī",
              "hanViet": "",
              "vietnamese": "làm ướt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "弄湿",
              "exampleTranslation": "làm ướt",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w11",
              "hanzi": "边角",
              "pinyin": "biān jiǎo",
              "hanViet": "",
              "vietnamese": "góc cạnh, góc mép",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "边角",
              "exampleTranslation": "góc cạnh, góc mép",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w12",
              "hanzi": "自责",
              "pinyin": "zì zé",
              "hanViet": "",
              "vietnamese": "tự trách mình",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "自责",
              "exampleTranslation": "tự trách mình",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w13",
              "hanzi": "拧紧",
              "pinyin": "nǐng jǐn",
              "hanViet": "",
              "vietnamese": "vặn chặt",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "拧紧",
              "exampleTranslation": "vặn chặt",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w14",
              "hanzi": "条理",
              "pinyin": "tiáo lǐ",
              "hanViet": "",
              "vietnamese": "trật tự mạch lạc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "条理",
              "exampleTranslation": "trật tự mạch lạc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w15",
              "hanzi": "论点",
              "pinyin": "lùn diǎn",
              "hanViet": "",
              "vietnamese": "luận điểm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "论点",
              "exampleTranslation": "luận điểm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w16",
              "hanzi": "论述",
              "pinyin": "lùn shù",
              "hanViet": "",
              "vietnamese": "luận述, bàn luận giải thích",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "论述",
              "exampleTranslation": "luận述, bàn luận giải thích",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w17",
              "hanzi": "借鉴",
              "pinyin": "jiè jiàn",
              "hanViet": "Tá Giám",
              "vietnamese": "soi chiếu, học hỏi tham khảo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "借鉴",
              "exampleTranslation": "soi chiếu, học hỏi tham khảo",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w18",
              "hanzi": "导师",
              "pinyin": "dǎo shī",
              "hanViet": "Đạo Sư",
              "vietnamese": "giáo viên hướng dẫn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "导师",
              "exampleTranslation": "giáo viên hướng dẫn",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w19",
              "hanzi": "展示",
              "pinyin": "zhǎn shì",
              "hanViet": "Triển Thị",
              "vietnamese": "trưng bày, trình chiếu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "展示",
              "exampleTranslation": "trưng bày, trình chiếu",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w20",
              "hanzi": "谦虚",
              "pinyin": "qiān xū",
              "hanViet": "Khiêm Hư",
              "vietnamese": "khiêm tốn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "谦虚",
              "exampleTranslation": "khiêm tốn",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l14-w21",
              "hanzi": "妥善",
              "pinyin": "tuǒ shàn",
              "hanViet": "",
              "vietnamese": "thỏa đáng, ổn thỏa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "妥善",
              "exampleTranslation": "thỏa đáng, ổn thỏa",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l14-w22",
              "hanzi": "化解",
              "pinyin": "huà jiě",
              "hanViet": "",
              "vietnamese": "hóa giải, làm tiêu tan",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "化解",
              "exampleTranslation": "hóa giải, làm tiêu tan",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l14-w23",
              "hanzi": "地基",
              "pinyin": "dì jī",
              "hanViet": "",
              "vietnamese": "nền móng công trình",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "地基",
              "exampleTranslation": "nền móng công trình",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l14-w24",
              "hanzi": "积累",
              "pinyin": "jī lěi",
              "hanViet": "Tích Luy",
              "vietnamese": "tích lũy",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "积累",
              "exampleTranslation": "tích lũy",
              "tags": [
                  "Động từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l14-ex1",
              "type": "multiple_choice",
              "question": "Điền giới từ bị động: '那本词典已经 ______ 别人借走了。'",
              "options": [
                  "A. 被",
                  "B. 把",
                  "C. 让",
                  "D. 给"
              ],
              "correctAnswer": "A. 被",
              "explanation": "Câu bị động: Chủ ngữ chịu tác động + 被 + Tác nhân + Động từ.",
              "grammarFocus": "Câu bị động chữ 被"
          },
          {
              "id": "hsk3-l14-ex2",
              "type": "fill_blank",
              "question": "Điền liên từ thích hợp: '写文章时，我们要 ______ (trước tiên) 列出提纲，然后再写正文。'",
              "options": [
                  "先",
                  "又",
                  "也",
                  "才"
              ],
              "correctAnswer": "先",
              "explanation": "Cấu trúc thứ tự: 先……，再/然后…… (trước tiên... sau đó...).",
              "grammarFocus": "Cấu trúc 先……然后……"
          },
          {
              "id": "hsk3-l14-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "被小猫",
              "喝光了",
              "牛奶"
              ],
              "question": "Sắp xếp câu: '被小猫 / 喝光了 / 牛奶'",
              "correctAnswer": "牛奶被小猫喝光了。",
              "explanation": "Cấu trúc câu chữ 被: 受事 + 被 + 施事 + 动词 + 结果补语.",
              "grammarFocus": "Câu chữ 被"
          },
          {
              "id": "hsk3-l14-ex4",
              "type": "multiple_choice",
              "question": "Chọn khẩu ngữ thích hợp: '谢 ______ 啊！举手之劳而已。'",
              "options": [
                  "A. 什么",
                  "B. 哪里",
                  "C. 多少",
                  "D. 怎样"
              ],
              "correctAnswer": "A. 什么",
              "explanation": "Khẩu ngữ 谢什么啊: Cảm ơn cái gì chứ, có gì phải cảm ơn đâu.",
              "grammarFocus": "Khẩu ngữ ……什么啊"
          }
      ],
      "cultureBonus": {
          "title": "📖 Truyền thống 'Tôn sư trọng đạo' và đức tính khiêm tốn (尊师重道与谦逊美德)",
          "summary": "Người Trung Quốc luôn đề cao sự khiêm tốn: 'Mãn chiêu tổn, khiêm thụ ích' (满招损，谦受益).",
          "content": "Trong văn hóa truyền thống Á Đông, đức tính khiêm tốn được coi là cốt cách hàng đầu của bậc trí giả. Khi được khen ngợi, người ta thường nói '哪里哪里' (đâu có đâu có) hoặc tự thấy mình còn cần học hỏi nhiều hơn, thể hiện tinh thần cầu thị không ngừng vươn lên."
      }
  },
  // =========================================================================
  // LESSON 15: 我是半个南京人
  // =========================================================================
  {
      "lessonNumber": 15,
      "titleHanzi": "我是半个南京人",
      "titlePinyin": "Wǒ shì bàn ge Nánjīng rén",
      "titleVietnamese": "Tôi là nửa người Nam Kinh",
      "pageStart": 133,
      "objectives": [
          "Dùng giới từ '根据' dẫn xuất căn cứ, cơ sở khách quan.",
          "Vận dụng cấu trúc lặp số lượng từ 'số từ + lượng từ + số từ + lượng từ'.",
          "Dùng cụm cố định '在……看来' và '不一会儿'."
      ],
      "texts": [
          {
              "id": "hsk3-l15-t1",
              "title": "课文 1: 畅谈南京印象 (Bài khóa 1: Ấn tượng về Nam Kinh)",
              "context": "在办公室，王一雪和杨同乐聊南京文化。(Tại văn phòng, trò chuyện về văn hóa Nam Kinh).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "同乐，听说你在南京读了四年大学？",
                      "pinyin": "Tónglè, tīngshuō nǐ zài Nánjīng dú le sì nián dàxué?",
                      "vietnamese": "Đồng Lạc, nghe nói em đã học đại học bốn năm ở Nam Kinh à?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "是啊，我在南京生活了那么久，对那里的风土人情再熟悉不过了，可以说是半个南京人了！",
                      "pinyin": "Shì a, wǒ zài Nánjīng shēnghuó le nàme jiǔ, duì nàlǐ de fēngtǔ rénqíng zài shúxī búguò le, kěyǐ shuō shì bàn ge Nánjīng rén le!",
                      "vietnamese": "Đúng thế chị ạ, em sống ở Nam Kinh ngần ấy năm trời, phong thổ tập quán con người nơi đó em quen thuộc đến không thể quen thuộc hơn, có thể nói em là nửa người Nam Kinh rồi đấy!"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "根据你的经验，去南京旅游最佳的季节是什么时候？",
                      "pinyin": "Gēnjù nǐ de jīngyàn, qù Nánjīng lǚyóu zuì jiā de jìjié shì shénme shíhou?",
                      "vietnamese": "Dựa theo kinh nghiệm của em, thời điểm đẹp nhất để đi du lịch Nam Kinh là vào mùa nào?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "在我看来，秋天的南京最美。栖霞山的枫叶一片一片全红了，景色迷人极了。",
                      "pinyin": "Zài wǒ kànlái, qiūtiān de Nánjīng zuì měi. Qīxiá Shān de fēngyè yí piàn yí piàn quán hóng le, jǐngsè mírén jí le.",
                      "vietnamese": "Theo quan điểm của em, mùa thu ở Nam Kinh là tuyệt mỹ nhất. Lá phong trên núi Tê Hà từng chiếc từng chiếc đỏ rực khắp non sông, cảnh sắc mê đắm lòng người."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "那南京有什么特色美食推荐吗？",
                      "pinyin": "Nà Nánjīng yǒu shénme tèsè měishí tuījiàn ma?",
                      "vietnamese": "Vậy Nam Kinh có món ẩm thực đặc sắc nào giới thiệu không em?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "盐水鸭、鸭血粉丝汤，保证你吃一次就会爱上！",
                      "pinyin": "Yánshuǐyā, yāxiě fěnsītāng, bǎozhèng nǐ chī yí cì jiù huì àishàng!",
                      "vietnamese": "Vịt muối Nam Kinh, miến tiết vịt, đảm bảo chị nếm thử một lần là mê đắm liền!"
                  }
              ]
          },
          {
              "id": "hsk3-l15-t2",
              "title": "课文 2: 古今交融之城 (Bài khóa 2: Thành phố cổ kim giao thoa)",
              "context": "在会议室，杨同乐介绍南京的城市变迁。(Tại phòng họp, giới thiệu nét biến đổi Nam Kinh).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "近年来南京的发展速度真是令人赞叹。",
                      "pinyin": "Jìnniánlái Nánjīng de fāzhǎn sùdù zhēn shì lìng rén zàntàn.",
                      "vietnamese": "Những năm gần đây tốc độ phát triển của Nam Kinh thực sự khiến người ta phải trầm trồ khen ngợi."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "根据最新的统计数据，南京的经济和高新产业都在飞速增长。",
                      "pinyin": "Gēnjù zuìxīn de tǒngjì shùjù, Nánjīng de jīngjì hé gāoxīn chǎnyè dōu zài fēisù zēngzhǎng.",
                      "vietnamese": "Căn cứ theo số liệu thống kê mới nhất, nền kinh tế và các ngành công nghệ cao của Nam Kinh đều đang tăng trưởng thần tốc."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "高铁和地铁线一截一截地向外延伸，出行变得越来越快捷。",
                      "pinyin": "Gāotiě hé dìtiěxiàn yì jié yì jié de xiàng wài yánshēn, chūxíng biàn de yuèláiyuè kuàijié.",
                      "vietnamese": "Các tuyến tàu cao tốc và đường tàu điện ngầm cứ từng đoạn từng đoạn vươn dài ra ngoại ô, việc đi lại ngày càng nhanh chóng tiện lợi."
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "站在玄武湖畔，一边是古典的明城墙，一边是现代化的摩天大楼，古今交融的气息扑面而来。",
                      "pinyin": "Zhàn zài Xuánwǔ Húpàn, yìbiān shì gǔdiǎn de Míng chéngqiáng, yìbiān shì xiàndàihuà de mótiān dàlóu, gǔjīn jiāoróng de qìxī pūmiàn'érlái.",
                      "vietnamese": "Đứng bên bờ hồ Huyền Vũ, một bên là bức tường thành cổ kính thời nhà Minh, một bên là những tòa nhà chọc trời hiện đại, hơi thở giao thoa giữa cổ kính và văn minh ùa thẳng vào lòng."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "听你这么一描绘，我真想马上订张高铁票去看看。",
                      "pinyin": "Tīng nǐ zhème yì miáohuì, wǒ zhēn xiǎng mǎshàng dìng zhāng gāotiěpiào qù kànkan.",
                      "vietnamese": "Nghe em miêu tả như thế, chị thực sự muốn lập tức đặt ngay một vé tàu cao tốc đến đó chiêm ngưỡng."
                  }
              ]
          },
          {
              "id": "hsk3-l15-t3",
              "title": "课文 3: 品尝金陵美味 (Bài khóa 3: Thưởng thức mỹ vị Kim Lăng)",
              "context": "在餐厅，王一雪品尝南京盐水鸭。(Tại quán ăn, thưởng thức vịt muối Nam Kinh).",
              "lines": [
                  {
                      "speaker": "杨同乐",
                      "hanzi": "这家店的南京菜做得非常正宗，你尝尝这块盐水鸭。",
                      "pinyin": "Zhè jiā diàn de Nánjīng cài zuò de fēicháng zhèngzōng, nǐ chángchang zhè kuài yánshuǐyā.",
                      "vietnamese": "Món ăn Nam Kinh của quán này nấu vô cùng chuẩn vị, chị nếm thử miếng thịt vịt muối này xem."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "嗯！皮白肉嫩，肥而不腻，咸香可口，果然名不虚传！",
                      "pinyin": "En! Pí bái ròu nèn, féi ér bú nì, xiánxiāng kěkǒu, guǒrán míngbùxūchuán!",
                      "vietnamese": "Chà! Da trắng thịt mềm thơm, ngậy mà không hề ngấy, mặn ngọt đậm đà vừa miệng, quả nhiên danh bất hư truyền!"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "再喝一口热气腾腾的鸭血粉丝汤，不一会儿，全身就暖洋洋的了。",
                      "pinyin": "Zài hē yì kǒu rèqìténgténg de yāxiě fěnsītāng, bùyíhuìr, quánshēn jiù nuǎnyángyáng de le.",
                      "vietnamese": "Lại húp thêm một thìa canh miến tiết vịt bốc khói nghi ngút, chẳng mấy chốc mà cả người ấm sực lên ngay."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "在你看来，南京人的性格有什么特点？",
                      "pinyin": "Zài nǐ kànlái, Nánjīng rén de xìnggé yǒu shénme tèdiǎn?",
                      "vietnamese": "Dưới góc nhìn của em, tính cách của người dân Nam Kinh có nét gì đặc trưng?"
                  },
                  {
                      "speaker": "杨同乐",
                      "hanzi": "南京人性格豪爽厚道，又带着水乡人的温和细腻，非常好相处。",
                      "pinyin": "Nánjīng rén xìnggé háoshuǎng hòudào, yòu dàizhe shuǐxiāng rén de wēnhé xìnì, fēicháng hǎo xiāngchǔ.",
                      "vietnamese": "Người Nam Kinh tính tình hào sảng thật thà, lại mang nét đôn hậu tỉ mỉ ôn hòa của con người vùng sông nước, cực kỳ dễ mến dễ gần."
                  }
              ]
          },
          {
              "id": "hsk3-l15-t4",
              "title": "课文 4: 古都金陵向往日记 (Bài khóa 4: Nhật ký hướng về cố đô Kim Lăng)",
              "context": "在日记中，王一雪记录对南京的向往。(Ghi chép về lòng mến mộ thành Nam Kinh).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "今天听同乐聊了许多关于南京的往事，让我对这座六朝古都充满了向往。根据历史记载，南京历经沧桑，留下了丰厚的文化遗产。",
                      "pinyin": "Jīntiān tīng Tónglè liáo le xǔduō guānyú Nánjīng de wǎngshì, ràng wǒ duì zhè zuò liùcháo gǔdū chōngmǎn le xiàngwǎng. Gēnjù lìshǐ jìzǎi, Nánjīng lìjīng cāngsāng, liúxià le fēnghòu de wénhuà yíchǎn.",
                      "vietnamese": "Hôm nay nghe Đồng Lạc kể bao câu chuyện xưa về Nam Kinh, khiến tôi ngập tràn niềm say mê hướng về cố đô của sáu triều đại này. Căn cứ theo ghi chép lịch sử, Nam Kinh đã trải qua biết bao thăng trầm dâu bể, để lại một kho tàng di sản văn hóa phong phú vô ngần."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "中山陵的肃穆、秦淮河的夜泊、夫子庙的繁华，都在同乐的描述中变得鲜活生动。",
                      "pinyin": "Zhōngshān Líng de sùmù, Qínhuái Hé de yèbó, Fūzǐ Miào de fánhuá, dōu zài Tónglè de miáoshù zhōng biàn de xiānhuó shēngdòng.",
                      "vietnamese": "Sự trang nghiêm tôn kính của lăng Tôn Trung Sơn, bến thuyền đêm lững lờ trên sông Tần Hoài, cảnh phồn hoa tấp nập của miếu Khổng Tử, tất cả đều trở nên sống động mồn một qua lời kể của Đồng Lạc."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "一座优秀的城市，在于它既能完整地守护住历史文脉，又能大踏步地融入现代化进程。期待不久的将来，我也能漫步在金陵的梧桐大道下，细细品味那份独特的韵致。",
                      "pinyin": "Yí zuò yōuxiù de chéngshì, zàiyú tā jì néng wánzhěng de shǒuhù zhù lìshǐ wénmài, yòu néng dàtàbù de róngrù xiàndàihuà jìnchéng. Qīdài bùjiǔ de jiānglái, wǒ yě néng mànbù zài Jīnlíng de wútóng dàdào xià, xìxì pǐnwèi nà fèn dútè de yùnzhì.",
                      "vietnamese": "Một thành phố tuyệt vời chính là ở chỗ nó vừa có thể gìn giữ nguyên vẹn mạch nguồn văn hóa lịch sử, lại vừa có thể sải bước vững chắc hòa mình vào tiến trình hiện đại hóa. Rất mong trong một ngày không xa, tôi cũng có thể thả bước dưới hàng cây ngô đồng của đất Kim Lăng, chậm rãi cảm nhận phong vị tao nhã độc đáo ấy."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l15-g1",
              "title": "1. 介词“根据” (Giới từ 'Căn cứ vào / Dựa theo')",
              "explanation": "Đứng trước danh từ hoặc mệnh đề để dẫn ra căn cứ, cơ sở khách quan của nhận định hoặc hành động.",
              "examples": [
                  {
                      "hanzi": "根据你的经验，去南京旅游最佳的季节是什么时候？",
                      "pinyin": "Gēnjù nǐ de jīngyàn, qù Nánjīng lǚyóu zuì jiā de jìjié shì shénme shíhou?",
                      "vietnamese": "Dựa theo kinh nghiệm của bạn, thời điểm tốt nhất đi du lịch Nam Kinh là khi nào?"
                  },
                  {
                      "hanzi": "根据天气预报，明天要降温。",
                      "pinyin": "Gēnjù tiānqì yùbào, míngtiān yào jiàngwēn.",
                      "vietnamese": "Căn cứ dự báo thời tiết, ngày mai nhiệt độ sẽ giảm."
                  }
              ]
          },
          {
              "id": "hsk3-l15-g2",
              "title": "2. 数量重叠“数词+量词+数词+量词” (Lặp cấu trúc số lượng)",
              "explanation": "Biểu thị tính chất liên tiếp, từng cái từng cái nối nhau xuất hiện ('từng mảnh từng chiếc', 'từng đoạn từng khúc').",
              "examples": [
                  {
                      "hanzi": "枫叶一片一片全红了。",
                      "pinyin": "Fēngyè yí piàn yí piàn quán hóng le.",
                      "vietnamese": "Lá phong từng chiếc từng chiếc đỏ thắm cả rừng cây."
                  },
                  {
                      "hanzi": "地铁线一截一截向外延伸。",
                      "pinyin": "Dìtiěxiàn yì jié yì jié xiàng wài yánshēn.",
                      "vietnamese": "Tuyến tàu điện ngầm từng đoạn từng đoạn vươn dài ra phía ngoài."
                  }
              ]
          },
          {
              "id": "hsk3-l15-g3",
              "title": "3. 固定短语“在……看来” (Cụm cố định 'Dưới góc nhìn của...')",
              "explanation": "Dùng để biểu đạt quan điểm, nhận xét cá nhân hoặc tập thể về một vấn đề.",
              "examples": [
                  {
                      "hanzi": "在我看来，秋天的南京最美。",
                      "pinyin": "Zài wǒ kànlái, qiūtiān de Nánjīng zuì měi.",
                      "vietnamese": "Theo quan điểm của tôi, mùa thu ở Nam Kinh là đẹp nhất."
                  },
                  {
                      "hanzi": "在老师看来，态度决定一切。",
                      "pinyin": "Zài lǎoshī kànlái, tàidu juédìng yíqiè.",
                      "vietnamese": "Dưới góc nhìn của thầy giáo, thái độ quyết định tất cả."
                  }
              ]
          },
          {
              "id": "hsk3-l15-g4",
              "title": "4. 固定短语“不一会儿” (Cụm từ chỉ thời gian 'Chẳng mấy chốc')",
              "explanation": "Biểu thị một khoảng thời gian rất ngắn ngủi trôi qua trước khi hành động tiếp theo diễn ra.",
              "examples": [
                  {
                      "hanzi": "不一会儿，全身就暖洋洋的了。",
                      "pinyin": "Bùyíhuìr, quánshēn jiù nuǎnyángyáng de le.",
                      "vietnamese": "Chẳng mấy chốc mà toàn thân đã ấm áp dễ chịu."
                  },
                  {
                      "hanzi": "他喝了药，不一会儿就睡着了。",
                      "pinyin": "Tā hē le yào, bùyíhuìr jiù shuìzháo le.",
                      "vietnamese": "Cậu ấy uống thuốc xong, chẳng mấy chốc đã ngủ say."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l15-w1",
              "hanzi": "风土人情",
              "pinyin": "fēng tǔ rén qíng",
              "hanViet": "",
              "vietnamese": "phong thổ tập quán con người",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "风土人情",
              "exampleTranslation": "phong thổ tập quán con người",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l15-w2",
              "hanzi": "根据",
              "pinyin": "gēn jù",
              "hanViet": "Căn Cư",
              "vietnamese": "căn cứ vào, dựa theo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "根据",
              "exampleTranslation": "căn cứ vào, dựa theo",
              "tags": [
                  "Giới từ"
              ]
          },
          {
              "id": "hsk3-l15-w3",
              "hanzi": "经验",
              "pinyin": "jīng yàn",
              "hanViet": "Kinh Nghiệm",
              "vietnamese": "kinh nghiệm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "经验",
              "exampleTranslation": "kinh nghiệm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w4",
              "hanzi": "在……看来",
              "pinyin": "zài …… kàn lái",
              "hanViet": "",
              "vietnamese": "dưới góc nhìn của...",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 20,
              "example": "在……看来",
              "exampleTranslation": "dưới góc nhìn của...",
              "tags": [
                  "Cụm từ"
              ]
          },
          {
              "id": "hsk3-l15-w5",
              "hanzi": "枫叶",
              "pinyin": "fēng yè",
              "hanViet": "",
              "vietnamese": "lá phong",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "枫叶",
              "exampleTranslation": "lá phong",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w6",
              "hanzi": "迷人",
              "pinyin": "mí rén",
              "hanViet": "Mê Nhân",
              "vietnamese": "mê hồn, cuốn hút",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "迷人",
              "exampleTranslation": "mê hồn, cuốn hút",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l15-w7",
              "hanzi": "盐水鸭",
              "pinyin": "yán shuǐ yā",
              "hanViet": "",
              "vietnamese": "món vịt muối Nam Kinh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "盐水鸭",
              "exampleTranslation": "món vịt muối Nam Kinh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w8",
              "hanzi": "粉丝汤",
              "pinyin": "fěn sī tāng",
              "hanViet": "",
              "vietnamese": "canh miến",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "粉丝汤",
              "exampleTranslation": "canh miến",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w9",
              "hanzi": "统计",
              "pinyin": "tǒng jì",
              "hanViet": "Thống Kế",
              "vietnamese": "thống kê",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "统计",
              "exampleTranslation": "thống kê",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l15-w10",
              "hanzi": "产业",
              "pinyin": "chǎn yè",
              "hanViet": "Sản Nghiệp",
              "vietnamese": "ngành công nghiệp, sản nghiệp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "产业",
              "exampleTranslation": "ngành công nghiệp, sản nghiệp",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w11",
              "hanzi": "延伸",
              "pinyin": "yán shēn",
              "hanViet": "Duyên Thân",
              "vietnamese": "kéo dài, trải dài",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "延伸",
              "exampleTranslation": "kéo dài, trải dài",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l15-w12",
              "hanzi": "湖畔",
              "pinyin": "hú pàn",
              "hanViet": "",
              "vietnamese": "bờ hồ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "湖畔",
              "exampleTranslation": "bờ hồ",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w13",
              "hanzi": "摩天大楼",
              "pinyin": "mó tiān dà lóu",
              "hanViet": "",
              "vietnamese": "tòa nhà chọc trời",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "摩天大楼",
              "exampleTranslation": "tòa nhà chọc trời",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w14",
              "hanzi": "古今交融",
              "pinyin": "gǔ jīn jiāo róng",
              "hanViet": "",
              "vietnamese": "cổ kim giao hòa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "古今交融",
              "exampleTranslation": "cổ kim giao hòa",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l15-w15",
              "hanzi": "名不虚传",
              "pinyin": "míng bù xū chuán",
              "hanViet": "",
              "vietnamese": "danh bất hư truyền",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "名不虚传",
              "exampleTranslation": "danh bất hư truyền",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l15-w16",
              "hanzi": "暖洋洋",
              "pinyin": "nuǎn yáng yáng",
              "hanViet": "",
              "vietnamese": "ấm sực, ấm áp",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "暖洋洋",
              "exampleTranslation": "ấm sực, ấm áp",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l15-w17",
              "hanzi": "豪爽",
              "pinyin": "háo shuǎng",
              "hanViet": "",
              "vietnamese": "hào sảng, phóng khoáng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "豪爽",
              "exampleTranslation": "hào sảng, phóng khoáng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l15-w18",
              "hanzi": "厚道",
              "pinyin": "hòu dào",
              "hanViet": "",
              "vietnamese": "thật thà, đôn hậu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "厚道",
              "exampleTranslation": "thật thà, đôn hậu",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l15-w19",
              "hanzi": "细腻",
              "pinyin": "xì nì",
              "hanViet": "",
              "vietnamese": "tinh tế, tỉ mỉ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "细腻",
              "exampleTranslation": "tinh tế, tỉ mỉ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l15-w20",
              "hanzi": "沧桑",
              "pinyin": "cāng sāng",
              "hanViet": "",
              "vietnamese": "thương hải tang điền, dâu bể",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "沧桑",
              "exampleTranslation": "thương hải tang điền, dâu bể",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w21",
              "hanzi": "遗产",
              "pinyin": "yí chǎn",
              "hanViet": "Di Sản",
              "vietnamese": "di sản",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "遗产",
              "exampleTranslation": "di sản",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l15-w22",
              "hanzi": "鲜活",
              "pinyin": "xiān huó",
              "hanViet": "",
              "vietnamese": "sống động tươi mới",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "鲜活",
              "exampleTranslation": "sống động tươi mới",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l15-w23",
              "hanzi": "融入",
              "pinyin": "róng rù",
              "hanViet": "Dung Nhập",
              "vietnamese": "hòa nhập vào",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "融入",
              "exampleTranslation": "hòa nhập vào",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l15-w24",
              "hanzi": "韵致",
              "pinyin": "yùn zhì",
              "hanViet": "",
              "vietnamese": "phong vị tao nhã",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "韵致",
              "exampleTranslation": "phong vị tao nhã",
              "tags": [
                  "Danh từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l15-ex1",
              "type": "multiple_choice",
              "question": "Điền giới từ thích hợp: '______ 调查，很多年轻人喜欢在线阅读。'",
              "options": [
                  "A. 根据",
                  "B. 为了",
                  "C. 关于",
                  "D. 随着"
              ],
              "correctAnswer": "A. 根据",
              "explanation": "根据 + Căn cứ/Khảo sát: Dựa theo khảo sát...",
              "grammarFocus": "Giới từ 根据"
          },
          {
              "id": "hsk3-l15-ex2",
              "type": "fill_blank",
              "question": "Điền cụm từ: '在老师 ______ (theo quan điểm của), 每一个学生都有独特的闪光点。'",
              "options": [
                  "看来",
                  "以为",
                  "想到",
                  "觉得"
              ],
              "correctAnswer": "看来",
              "explanation": "在……看来: theo quan điểm của ai đó.",
              "grammarFocus": "Cụm 在……看来"
          },
          {
              "id": "hsk3-l15-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "一片一片",
              "树叶",
              "飘落下来了",
              "变黄的"
              ],
              "question": "Sắp xếp câu: '一片一片 / 树叶 / 飘落下来了 / 变黄的'",
              "correctAnswer": "变黄的树叶一片一片飘落下来了。",
              "explanation": "Cấu trúc số lượng từ lặp lại: 一片一片.",
              "grammarFocus": "Cấu trúc lặp số lượng từ"
          },
          {
              "id": "hsk3-l15-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '这道南京名菜味道绝佳，果然是 ______。'",
              "options": [
                  "A. 名不虚传",
                  "B. 熟能生巧",
                  "C. 虚惊一场",
                  "D. 粗心大意"
              ],
              "correctAnswer": "A. 名不虚传",
              "explanation": "名不虚传 (míngbùxūchuán): danh bất hư truyền, quả đúng như danh tiếng.",
              "grammarFocus": "Thành ngữ Bài 15"
          }
      ],
      "cultureBonus": {
          "title": "🦆 'Thủ phủ vịt' Nam Kinh và dòng sông Tần Hoài (六朝古都与金陵风华)",
          "summary": "Nam Kinh được mệnh danh là 'Kim Lăng cố đô' với di sản nghìn năm bên bờ sông Tần Hoài.",
          "content": "Nam Kinh (南京) từng là kinh đô của 6 triều đại phong kiến Trung Hoa. Nơi đây nổi tiếng với văn hóa ẩm thực từ vịt (không chú vịt nào có thể sống sót rời Nam Kinh) với món Vịt muối (盐水鸭) nức tiếng và dòng sông Tần Hoài lãng mạn đi vào thi ca Đường Tống."
      }
  },
  // =========================================================================
  // LESSON 16: 我听说有的熊猫出国了
  // =========================================================================
  {
      "lessonNumber": 16,
      "titleHanzi": "我听说有的熊猫出国了",
      "titlePinyin": "Wǒ tīngshuō yǒude xióngmāo chūguó le",
      "titleVietnamese": "Tôi nghe nói có những chú gấu trúc đã ra nước ngoài",
      "pageStart": 144,
      "objectives": [
          "Dùng câu phức song hành biến đổi '一会儿……，一会儿……'.",
          "Dùng giới từ '关于' giới thiệu chủ đề, đối tượng nghiên cứu/bàn luận.",
          "Dùng cụm cố định '一般来说' và câu so sánh (11)."
      ],
      "texts": [
          {
              "id": "hsk3-l16-t1",
              "title": "课文 1: 憨态可掬大熊猫 (Bài khóa 1: Gấu trúc ngộ nghĩnh đáng yêu)",
              "context": "在动物园大熊猫馆，刘小雪和刘小明看大熊猫。(Tại nhà gấu trúc vườn thú, hai chị em xem gấu trúc).",
              "lines": [
                  {
                      "speaker": "刘小明",
                      "hanzi": "姐姐，你看大熊猫胖乎乎的，吃竹子的样子真好玩儿！",
                      "pinyin": "Jiějie, nǐ kàn dàxióngmāo pànghūhū de, chī zhúzi de yàngzi zhēn hǎowánr!",
                      "vietnamese": "Chị ơi, chị nhìn chú gấu trúc to béo núc ních kìa, dáng vẻ gặm cây trúc trông buồn cười thật đấy!"
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "熊猫是中国的国宝，它一会儿坐在地上大嚼竹子，一会儿又爬上树枝呼呼大睡。",
                      "pinyin": "Xióngmāo shì Zhōngguó de guóbǎo, tā yíhuìr zuò zài dì shang dàjiáo zhúzi, yíhuìr yòu pá shàng shùzhī hūhū dàshuì.",
                      "vietnamese": "Gấu trúc là quốc bảo của Trung Quốc đấy, nó chốc lát thì ngồi bệt dưới đất nhai lá trúc ngấu nghiến, chốc lát lại leo tót lên cành cây ngủ khò khò."
                  },
                  {
                      "speaker": "刘小明",
                      "hanzi": "我听说有的熊猫出国了，是真的吗？",
                      "pinyin": "Wǒ tīngshuō yǒude xióngmāo chūguó le, shì zhēn de ma?",
                      "vietnamese": "Em nghe nói có những chú gấu trúc đã ra nước ngoài, có thật không chị?"
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "是真的，中国为了促进友好交流，把熊猫租借给一些国家进行科学研究。",
                      "pinyin": "Shì zhēn de, Zhōngguó wèile cùjìn yǒuhǎo jiāoliú, bǎ xióngmāo zūjiè gěi yìxiē guójiā jìnxíng kēxué yánjiū.",
                      "vietnamese": "Thật đấy, Trung Quốc vì muốn thúc đẩy giao lưu hữu nghị nên đã cho một số quốc gia thuê mượn gấu trúc để tiến hành nghiên cứu khoa học."
                  },
                  {
                      "speaker": "刘小明",
                      "hanzi": "外国小朋友肯定也特别喜欢熊猫吧！",
                      "pinyin": "Wàiguó xiǎopéngyou kěndìng yě tèbié xǐhuan xióngmāo ba!",
                      "vietnamese": "Các bạn nhỏ nước ngoài chắc chắn cũng cực kỳ mê gấu trúc chị nhỉ!"
                  }
              ]
          },
          {
              "id": "hsk3-l16-t2",
              "title": "课文 2: 科普大熊猫生活习性 (Bài khóa 2: Tìm hiểu tập tính gấu trúc)",
              "context": "在科普展厅，王一雪给孩子们讲解大熊猫知识。(Tại phòng triển lãm, giảng giải kiến thức).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "你们看这里的展板，上面有许多关于大熊猫生活习性的科普介绍。",
                      "pinyin": "Nǐmen kàn zhèlǐ de zhǎnbǎn, shàngmiàn yǒu xǔduō guānyú dàxióngmāo shēnghuó xíxìng de kēpǔ jièshào.",
                      "vietnamese": "Các con nhìn bảng trưng bày ở đây này, phía trên có rất nhiều lời giới thiệu phổ biến khoa học về tập tính sinh hoạt của gấu trúc lớn đấy."
                  },
                  {
                      "speaker": "刘小明",
                      "hanzi": "妈妈，大熊猫每天要吃多少竹子啊？",
                      "pinyin": "Māma, dàxióngmāo měitiān yào chī duōshao zhúzi a?",
                      "vietnamese": "Mẹ ơi, gấu trúc mỗi ngày phải ăn bao nhiêu cây trúc hả mẹ?"
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "一般来说，一只成年大熊猫每天要花十几个小时吃十几公斤竹子。",
                      "pinyin": "Yìbān láishuō, yì zhī chéngnián dàxióngmāo měitiān yào huā shí jǐ ge xiǎoshí chī shí jǐ gōngjīn zhúzi.",
                      "vietnamese": "Nói chung thông thường, một con gấu trúc trưởng thành mỗi ngày phải dành hơn mười tiếng đồng hồ để ăn mười mấy cân trúc."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "它的消化能力比起别的哺乳动物来要弱得多，所以必须不停地吃。",
                      "pinyin": "Tā de xiāohuà nénglì bǐqǐ bié de bǔrǔ dòngwù lái yào ruò de duō, suǒyǐ bìxū bùtíng de chī.",
                      "vietnamese": "Khả năng tiêu hóa của nó so với các loài động vật có vú khác yếu hơn rất nhiều, thế nên nó buộc phải liên tục ăn không ngừng nghỉ."
                  },
                  {
                      "speaker": "刘小明",
                      "hanzi": "哇，原来熊猫是个大胃王啊！",
                      "pinyin": "Wā, yuánlái xióngmāo shì ge dàwèiwáng a!",
                      "vietnamese": "Oa, hóa ra gấu trúc là một 'vua ăn khỏe' ạ!"
                  }
              ]
          },
          {
              "id": "hsk3-l16-t3",
              "title": "课文 3: 选购熊猫纪念品 (Bài khóa 3: Mua quà lưu niệm gấu trúc)",
              "context": "在纪念品商店，选购熊猫玩偶。(Tại tiệm lưu niệm, chọn đồ chơi gấu trúc).",
              "lines": [
                  {
                      "speaker": "刘小明",
                      "hanzi": "妈妈，我想买这个抱着小竹笋的熊猫玩偶。",
                      "pinyin": "Māma, wǒ xiǎng mǎi zhè ge bàozhe xiǎo zhúsǔn de xióngmāo wán'ǒu.",
                      "vietnamese": "Mẹ ơi, con muốn mua chú gấu bông ôm măng tre nhỏ này."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "这个玩偶做工比那个更精致，毛茸茸的摸起来挺舒服。",
                      "pinyin": "Zhè ge wán'ǒu zuògōng bǐ nàge gèng jīngzhì, máorōngrōng de mō qǐlai tǐng shūfu.",
                      "vietnamese": "Con thú bông này đường kim mũi chỉ tinh xảo hơn con kia, lông mềm mại sờ vào rất thích tay."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "我挑这本关于野生动物保护的图册，里面的插图画得真逼真。",
                      "pinyin": "Wǒ tiāo zhè běn guānyú yěshēng dòngwù bǎohù de túcè, lǐmiàn de chātú huà de zhēn bīzhēn.",
                      "vietnamese": "Con chọn cuốn tập tranh về bảo vệ động vật hoang dã này, các tranh minh họa bên trong vẽ sống động như thật."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "很好，一般来说多读科普书籍能开阔你们的眼界。",
                      "pinyin": "Hěn hǎo, yìbān láishuō duō dú kēpǔ shūjí néng kāikuò nǐmen de yǎnjiè.",
                      "vietnamese": "Rất tốt, nói chung chăm đọc sách phổ biến kiến thức khoa học sẽ mở rộng tầm mắt cho các con."
                  },
                  {
                      "speaker": "刘小明",
                      "hanzi": "今天看熊猫真是太开心了，一会儿我们再去看看长颈鹿吧！",
                      "pinyin": "Jīntiān kàn xióngmāo zhēn shì tài kāixīn le, yíhuìr wǒmen zài qù kànkan chángjǐnglù ba!",
                      "vietnamese": "Hôm nay ngắm gấu trúc thật sự quá vui, lát nữa chúng mình lại qua xem hươu cao cổ nhé mẹ!"
                  }
              ]
          },
          {
              "id": "hsk3-l16-t4",
              "title": "课文 4: 人与自然和谐日记 (Bài khóa 4: Nhật ký con người và thiên nhiên hòa hợp)",
              "context": "在日记中，王一雪写保护生物多样性。(Nhật ký về bảo tồn tự nhiên).",
              "lines": [
                  {
                      "speaker": "王一雪",
                      "hanzi": "今天带着小雪和小明参观了北京动物园的大熊猫馆。憨态可掬的大熊猫无论走到哪里，都是最耀眼的明星。",
                      "pinyin": "Jīntiān dàizhe Xiǎoxuě hé Xiǎomíng cānguān le Běijīng Dòngwùyuán de dàxióngmāo guǎn. Hāntàikějū de dàxióngmāo wúlùn zǒu dào nǎlǐ, dōu shì zuì yàoyǎn de míngxīng.",
                      "vietnamese": "Hôm nay tôi dẫn Tiểu Tuyết và Tiểu Minh tham quan nhà gấu trúc tại vườn bách thú Bắc Kinh. Những chú gấu trúc ngộ nghĩnh đáng yêu bất luận đi đến nơi nào cũng đều là ngôi sao sáng chói nhất."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "看着孩子们纯真好奇的眼神，我深深地感到生态环境保护教育的重要意义。一般来说，人与自然的和谐共生需要几代人持之以恒的共同努力。",
                      "pinyin": "Kànzhe háizimen chúnzhēn hàoqí de yǎnshén, wǒ shēnshēn de gǎndào shēngtài huánjìng bǎohù jiàoyù de zhòngyào yìyì. Yìbān láishuō, rén yǔ zìrán de héxié gòngshēng xūyào jǐ dài rén chízhīyǐhéng de gòngtóng nǔlì.",
                      "vietnamese": "Nhìn ánh mắt ngây thơ hiếu kỳ của các con, tôi cảm nhận sâu sắc ý nghĩa to lớn của việc giáo dục bảo vệ môi trường sinh thái. Thông thường, sự chung sống hòa hợp giữa con người và thiên nhiên đòi hỏi sự nỗ lực bền bỉ không ngừng của nhiều thế hệ."
                  },
                  {
                      "speaker": "王一雪",
                      "hanzi": "保护大熊猫不仅是保护一个物种，更是保护我们赖以生存的美丽地球家园。希望孩子们在亲近自然中学会敬畏生命、热爱生命。",
                      "pinyin": "Bǎohù dàxióngmāo bùjǐn shì bǎohù yí ge wùzhǒng, gèng shì bǎohù wǒmen làiyǐ shēngcún de měilì dìqiú jiāyuán. Xīwàng háizimen zài qīnjìn zìrán zhōng xuéhuì jìngwèi shēngmìng, rè'ài shēngmìng.",
                      "vietnamese": "Bảo vệ gấu trúc không chỉ là bảo vệ một giống loài quý hiếm, mà hơn thế nữa chính là bảo vệ mái nhà Trái Đất tươi đẹp mà chúng ta nương tựa để sinh tồn. Hy vọng các con thông qua việc gần gũi thiên nhiên sẽ học được cách kính trọng và yêu quý muôn loài sinh linh."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l16-g1",
              "title": "1. 并列复句“一会儿……，一会儿……” (Câu phức song hành biến đổi 'Lúc thì... lúc thì...')",
              "explanation": "Dùng để diễn tả hai hành động hoặc trạng thái khác nhau thay phiên nhau xuất hiện trong một khoảng thời gian ngắn.",
              "examples": [
                  {
                      "hanzi": "它一会儿坐在地上大嚼竹子，一会儿又爬上树枝呼呼大睡。",
                      "pinyin": "Tā yíhuìr zuò zài dì shang dàjiáo zhúzi, yíhuìr yòu pá shàng shùzhī hūhū dàshuì.",
                      "vietnamese": "Nó lúc thì ngồi dưới đất nhai trúc, lúc lại trèo lên cành cây ngủ say."
                  },
                  {
                      "hanzi": "这几天天气一会儿晴，一会儿阴。",
                      "pinyin": "Zhè jǐ tiān tiānqì yíhuìr qíng, yíhuìr yīn.",
                      "vietnamese": "Mấy hôm nay thời tiết lúc thì nắng ráo, lúc lại âm u."
                  }
              ]
          },
          {
              "id": "hsk3-l16-g2",
              "title": "2. 介词“关于” (Giới từ 'Về / Liên quan đến')",
              "explanation": "Dùng để giới thiệu chủ đề, phạm vi hoặc đối tượng mà sự việc hoặc cuốn sách, báo cáo liên quan tới.",
              "examples": [
                  {
                      "hanzi": "上面有许多关于大熊猫生活习性的介绍。",
                      "pinyin": "Shàngmiàn yǒu xǔduō guānyú dàxióngmāo shēnghuó xíxìng de jièshào.",
                      "vietnamese": "Phía trên có nhiều lời giới thiệu về tập tính sống của gấu trúc."
                  },
                  {
                      "hanzi": "关于这件事情，我们明天再开会讨论。",
                      "pinyin": "Guānyú zhè jiàn shìqing, wǒmen míngtiān zài kāihuì tǎolùn.",
                      "vietnamese": "Về vấn đề này, ngày mai chúng ta sẽ họp bàn sau."
                  }
              ]
          },
          {
              "id": "hsk3-l16-g3",
              "title": "3. 固定短语“一般来说” (Cụm cố định 'Nói chung / Thông thường')",
              "explanation": "Được dùng ở đầu câu để đưa ra nhận định mang tính khái quát, dựa trên quy luật chung.",
              "examples": [
                  {
                      "hanzi": "一般来说，大熊猫每天要吃十几公斤竹子。",
                      "pinyin": "Yìbān láishuō, dàxióngmāo měitiān yào chī shí jǐ gōngjīn zhúzi.",
                      "vietnamese": "Thông thường, gấu trúc mỗi ngày phải ăn mười mấy cân trúc."
                  },
                  {
                      "hanzi": "一般来说，多运动对健康非常有益。",
                      "pinyin": "Yìbān láishuō, duō yùndòng duì jiànkāng fēicháng yǒuyì.",
                      "vietnamese": "Nói chung, vận động nhiều rất có lợi cho sức khỏe."
                  }
              ]
          },
          {
              "id": "hsk3-l16-g4",
              "title": "4. 比较句（11）“比起来” (So sánh tương quan)",
              "explanation": "Cấu trúc: A 比起 B 来 + Tính từ biểu thị việc đặt hai đối tượng lên bàn cân so sánh.",
              "examples": [
                  {
                      "hanzi": "它的消化能力比起别的动物来要弱得多。",
                      "pinyin": "Tā de xiāohuà nénglì bǐqǐ bié de dòngwù lái yào ruò de duō.",
                      "vietnamese": "Khả năng tiêu hóa của nó so với loài vật khác yếu hơn nhiều."
                  },
                  {
                      "hanzi": "这个玩偶比起那个来更精致。",
                      "pinyin": "Zhè ge wán'ǒu bǐqǐ nàge lái gèng jīngzhì.",
                      "vietnamese": "Con gấu bông này so với con kia tinh xảo hơn."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l16-w1",
              "hanzi": "熊猫",
              "pinyin": "xióng māo",
              "hanViet": "",
              "vietnamese": "gấu trúc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "熊猫",
              "exampleTranslation": "gấu trúc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w2",
              "hanzi": "胖乎乎",
              "pinyin": "pàng hū hū",
              "hanViet": "",
              "vietnamese": "mũm mĩm, béo núc ních",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "胖乎乎",
              "exampleTranslation": "mũm mĩm, béo núc ních",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l16-w3",
              "hanzi": "竹子",
              "pinyin": "zhú zi",
              "hanViet": "Trúc Tử",
              "vietnamese": "cây tre, cây trúc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "竹子",
              "exampleTranslation": "cây tre, cây trúc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w4",
              "hanzi": "国宝",
              "pinyin": "guó bǎo",
              "hanViet": "Quốc Bảo",
              "vietnamese": "báu vật quốc gia, quốc bảo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "国宝",
              "exampleTranslation": "báu vật quốc gia, quốc bảo",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w5",
              "hanzi": "嚼",
              "pinyin": "jué",
              "hanViet": "",
              "vietnamese": "nhai ngấu nghiến",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "嚼",
              "exampleTranslation": "nhai ngấu nghiến",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l16-w6",
              "hanzi": "呼呼大睡",
              "pinyin": "hū hū dà shuì",
              "hanViet": "",
              "vietnamese": "ngủ say khò khò",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "呼呼大睡",
              "exampleTranslation": "ngủ say khò khò",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l16-w7",
              "hanzi": "促进",
              "pinyin": "cù jìn",
              "hanViet": "Xúc Tiến",
              "vietnamese": "thúc đẩy, xúc tiến",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "促进",
              "exampleTranslation": "thúc đẩy, xúc tiến",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l16-w8",
              "hanzi": "交流",
              "pinyin": "jiāo liú",
              "hanViet": "Giao Lưu",
              "vietnamese": "giao lưu",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "交流",
              "exampleTranslation": "giao lưu",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l16-w9",
              "hanzi": "租借",
              "pinyin": "zū jiè",
              "hanViet": "",
              "vietnamese": "thuê mượn",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "租借",
              "exampleTranslation": "thuê mượn",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l16-w10",
              "hanzi": "展板",
              "pinyin": "zhǎn bǎn",
              "hanViet": "",
              "vietnamese": "bảng triển lãm trưng bày",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "展板",
              "exampleTranslation": "bảng triển lãm trưng bày",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w11",
              "hanzi": "关于",
              "pinyin": "guān yú",
              "hanViet": "Quan Vu",
              "vietnamese": "về, liên quan tới",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "关于",
              "exampleTranslation": "về, liên quan tới",
              "tags": [
                  "Giới từ"
              ]
          },
          {
              "id": "hsk3-l16-w12",
              "hanzi": "习性",
              "pinyin": "xí xìng",
              "hanViet": "",
              "vietnamese": "tập tính thói quen",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "习性",
              "exampleTranslation": "tập tính thói quen",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w13",
              "hanzi": "科普",
              "pinyin": "kē pǔ",
              "hanViet": "Khoa Phổ",
              "vietnamese": "phổ biến khoa học",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "科普",
              "exampleTranslation": "phổ biến khoa học",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w14",
              "hanzi": "一般来说",
              "pinyin": "yì bān lái shuō",
              "hanViet": "",
              "vietnamese": "nói chung, thông thường",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "一般来说",
              "exampleTranslation": "nói chung, thông thường",
              "tags": [
                  "Cụm từ"
              ]
          },
          {
              "id": "hsk3-l16-w15",
              "hanzi": "成年",
              "pinyin": "chéng nián",
              "hanViet": "Thành Niên",
              "vietnamese": "trưởng thành",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "成年",
              "exampleTranslation": "trưởng thành",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l16-w16",
              "hanzi": "消化",
              "pinyin": "xiāo huà",
              "hanViet": "Tiêu Hóa",
              "vietnamese": "tiêu hóa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "消化",
              "exampleTranslation": "tiêu hóa",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l16-w17",
              "hanzi": "哺乳",
              "pinyin": "bǔ rǔ",
              "hanViet": "",
              "vietnamese": "cho con bú, có vú",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "哺乳",
              "exampleTranslation": "cho con bú, có vú",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l16-w18",
              "hanzi": "玩偶",
              "pinyin": "wán ǒu",
              "hanViet": "",
              "vietnamese": "thú nhồi bông, búp bê",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "玩偶",
              "exampleTranslation": "thú nhồi bông, búp bê",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w19",
              "hanzi": "做工",
              "pinyin": "zuò gōng",
              "hanViet": "",
              "vietnamese": "tay nghề gia công chế tác",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "做工",
              "exampleTranslation": "tay nghề gia công chế tác",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w20",
              "hanzi": "精致",
              "pinyin": "jīng zhì",
              "hanViet": "Tinh Trí",
              "vietnamese": "tinh xảo, tinh tế",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "精致",
              "exampleTranslation": "tinh xảo, tinh tế",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l16-w21",
              "hanzi": "毛茸茸",
              "pinyin": "máo róng róng",
              "hanViet": "",
              "vietnamese": "lông xù xù mềm mại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "毛茸茸",
              "exampleTranslation": "lông xù xù mềm mại",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l16-w22",
              "hanzi": "图册",
              "pinyin": "tú cè",
              "hanViet": "",
              "vietnamese": "tập tranh ảnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "图册",
              "exampleTranslation": "tập tranh ảnh",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l16-w23",
              "hanzi": "逼真",
              "pinyin": "bī zhēn",
              "hanViet": "",
              "vietnamese": "sống động như thật",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "逼真",
              "exampleTranslation": "sống động như thật",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l16-w24",
              "hanzi": "憨态可掬",
              "pinyin": "hān tài kě jū",
              "hanViet": "",
              "vietnamese": "ngây thơ đáng yêu ngộ nghĩnh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "憨态可掬",
              "exampleTranslation": "ngây thơ đáng yêu ngộ nghĩnh",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l16-w25",
              "hanzi": "和谐",
              "pinyin": "hé xié",
              "hanViet": "Hòa Hài",
              "vietnamese": "hòa hợp, hài hòa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "和谐",
              "exampleTranslation": "hòa hợp, hài hòa",
              "tags": [
                  "Tính từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l16-ex1",
              "type": "multiple_choice",
              "question": "Điền liên từ thích hợp: '天上的云彩变幻莫测，______ 像小狗，一会儿像小羊。'",
              "options": [
                  "A. 一会儿",
                  "B. 刚刚",
                  "C. 一直",
                  "D. 渐渐"
              ],
              "correctAnswer": "A. 一会儿",
              "explanation": "Cấu trúc thay phiên: 一会儿……，一会儿…… (lúc thì... lúc thì...).",
              "grammarFocus": "Liên từ 一会儿……一会儿……"
          },
          {
              "id": "hsk3-l16-ex2",
              "type": "fill_blank",
              "question": "Điền giới từ: '这是一部 ______ (về) 保护生态环境的纪录片。'",
              "options": [
                  "关于",
                  "为了",
                  "对于",
                  "由"
              ],
              "correctAnswer": "关于",
              "explanation": "关于 + Chủ đề: liên quan tới điều gì.",
              "grammarFocus": "Giới từ 关于"
          },
          {
              "id": "hsk3-l16-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "多读好书",
              "一般来说",
              "能开阔眼界"
              ],
              "question": "Sắp xếp câu: '多读好书 / 一般来说 / 能开阔眼界'",
              "correctAnswer": "一般来说多读好书能开阔眼界。",
              "explanation": "Cụm 一般来说 thường đặt ở đầu câu để nêu quy luật chung.",
              "grammarFocus": "Cụm từ 一般来说"
          },
          {
              "id": "hsk3-l16-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ điền vào câu: '大熊猫胖乎乎、圆滚滚的，样子真是 ______。'",
              "options": [
                  "A. 憨态可掬",
                  "B. 熟能生巧",
                  "C. 粗心大意",
                  "D. 虚惊一场"
              ],
              "correctAnswer": "A. 憨态可掬",
              "explanation": "憨态可掬 (hāntàikějū): ngây thơ ngộ nghĩnh đáng yêu (chuyên dùng miêu tả gấu trúc).",
              "grammarFocus": "Thành ngữ Bài 16"
          }
      ],
      "cultureBonus": {
          "title": "🐼 Ngoại giao gấu trúc của Trung Quốc (大熊猫外交与保护)",
          "summary": "Đại bàng tượng trưng cho nước Mỹ, chuột túi cho nước Úc, còn gấu trúc là 'đại sứ hòa bình' của Trung Quốc.",
          "content": "Chương trình 'Ngoại giao gấu trúc' (熊猫外交) bắt đầu từ những năm 1970 khi Trung Quốc gửi tặng gấu trúc cho các nước như Mỹ, Nhật Bản, Pháp... Ngày nay, các trung tâm bảo tồn ở Thành Đô (Tứ Xuyên) đã nhân giống và nuôi dưỡng hàng trăm cá thể gấu trúc, giúp loài động vật đáng yêu này thoát khỏi nguy cơ tuyệt chủng."
      }
  },
  // =========================================================================
  // LESSON 17: 我要多向认真的人学习
  // =========================================================================
  {
      "lessonNumber": 17,
      "titleHanzi": "我要多向认真的人学习",
      "titlePinyin": "Wǒ yào duō xiàng rènzhēn de rén xuéxí",
      "titleVietnamese": "Tôi phải học tập nhiều từ những người chăm chỉ nghiêm túc",
      "pageStart": 154,
      "objectives": [
          "Dùng giới từ chỉ phương hướng/đối tượng '向'.",
          "Vận dụng câu phản vấn '不是……吗？' để củng cố luận điểm.",
          "Dùng câu phức tăng tiến '……，更……' và câu phức điều kiện duy nhất '只有……，才……'."
      ],
      "texts": [
          {
              "id": "hsk3-l17-t1",
              "title": "课文 1: 期末复习心得 (Bài khóa 1: Kinh nghiệm ôn thi cuối kỳ)",
              "context": "在教学楼走廊，刘小雪和同学讨论期末复习。(Tại hành lang, bàn chuyện ôn tập).",
              "lines": [
                  {
                      "speaker": "刘小雪",
                      "hanzi": "期末考试越来越近了，你复习得怎么样了？",
                      "pinyin": "Qīmò kǎoshì yuèláiyuè jìn le, nǐ fùxí de zěnmeyàng le?",
                      "vietnamese": "Kỳ thi cuối kỳ ngày càng đến gần rồi, cậu ôn tập thế nào rồi?"
                  },
                  {
                      "speaker": "同学",
                      "hanzi": "还有好几门课没看完呢，真有点儿发愁。",
                      "pinyin": "Hái yǒu hǎo jǐ mén kè méi kànwán ne, zhēn yǒudiǎnr fāchóu.",
                      "vietnamese": "Vẫn còn mấy môn học nữa tớ chưa đọc hết, thực sự hơi sốt ruột lo lắng đây."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "你看李老师班上的班长，每天早晨都最早到教室背单词。",
                      "pinyin": "Nǐ kàn Lǐ lǎoshī bān shang de bānzhǎng, měitiān zǎochen dōu zuì zǎo dào jiàoshì bèi dāncí.",
                      "vietnamese": "Cậu nhìn bạn lớp trưởng lớp thầy Lý xem, sáng nào bạn ấy cũng tới lớp học sớm nhất để học thuộc từ vựng."
                  },
                  {
                      "speaker": "同学",
                      "hanzi": "是啊，他做事特别有条理，我们真应该多向他学习。",
                      "pinyin": "Shì a, tā zuòshì tèbié yǒu tiáolǐ, wǒmen zhēn yīnggāi duō xiàng tā xuéxí.",
                      "vietnamese": "Đúng vậy, bạn ấy làm việc cực kỳ ngăn nắp mạch lạc, chúng mình thực sự phải học hỏi bạn ấy thật nhiều."
                  },
                  {
                      "speaker": "刘小雪",
                      "hanzi": "只有平时认真积累，考试的时候才能胸有成竹。",
                      "pinyin": "Zhǐyào píngshí rènzhēn jīlěi, kǎoshì de shíhou cái néng xiōngyǒuchéngzhú.",
                      "vietnamese": "Chỉ có ngày thường chăm chỉ tích lũy, khi đi thi mới có thể nắm chắc phần thắng trong tay."
                  }
              ]
          },
          {
              "id": "hsk3-l17-t2",
              "title": "课文 2: 请教难题 (Bài khóa 2: Thỉnh giáo bài toán khó)",
              "context": "在自习室，白家月向陈天中请教高数题。(Tại phòng tự học, hỏi bài giải toán).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "天中，这道高数微积分题我算了三遍都没算对，你能帮我看一下吗？",
                      "pinyin": "Tiānzhōng, zhè dào gāoshù wēijīfēn tí wǒ suàn le sān biàn dōu méi suàn duì, nǐ néng bāng wǒ kàn yíxià ma?",
                      "vietnamese": "Thiên Trung, bài toán vi tích phân toán cao cấp này tớ tính ba lần rồi mà vẫn chưa ra đúng, cậu xem giúp tớ một chút được không?"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "没问题，让我看看你的解题步骤……这儿公式套错了。",
                      "pinyin": "Méi wèntí, ràng wǒ kànkan nǐ de jiětí bùzhòu... Zhèr gōngshì tàocuò le.",
                      "vietnamese": "Không thành vấn đề, để tớ xem các bước giải của cậu... Chỗ này áp dụng sai công thức rồi."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "哎呀，这么基础的公式我怎么给忽略了呢！",
                      "pinyin": "Āiyā, zhème jīchǔ de gōngshì wǒ zěnme gěi hūlüè le ne!",
                      "vietnamese": "Ấy chết, công thức cơ bản thế này sao tớ lại bỏ sót được nhỉ!"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "做学问来不得半点马虎，不仅要细心，更要严谨。",
                      "pinyin": "Zuò xuéwen láibude bàndiǎnr mǎhu, bùjǐn yào xìxīn, gèng yào yánjǐn.",
                      "vietnamese": "Làm nghiên cứu học thuật không thể có nửa phần cẩu thả, không những phải cẩn thận mà càng cần phải nghiêm cẩn chuẩn xác."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "你分析得太透彻了，不是说“三人行必有我师”吗？今天你就是我的良师益友！",
                      "pinyin": "Nǐ fēnxī de tài tòuchè le, bú shì shuō 'sān rén xíng bì yǒu wǒ shī' ma? Jīntiān nǐ jiù shì wǒ de liángshīyìyǒu!",
                      "vietnamese": "Cậu phân tích thấu đáo quá, chẳng phải người xưa có câu 'Ba người cùng đi ắt có người là thầy ta' đó sao? Hôm nay cậu chính là người thầy tốt bạn hiền của tớ rồi!"
                  }
              ]
          },
          {
              "id": "hsk3-l17-t3",
              "title": "课文 3: 职场经验谈 (Bài khóa 3: Trao đổi kinh nghiệm công sở)",
              "context": "在校园林荫道，李文和陈天中交流实习心得。(Trên đường rợp bóng mát, trao đổi thực tập).",
              "lines": [
                  {
                      "speaker": "李文",
                      "hanzi": "天中，听说你最近去了一家外资企业实习？",
                      "pinyin": "Tiānzhōng, tīngshuō nǐ zuìjìn qù le yì jiā wàizī qǐyè shíxí?",
                      "vietnamese": "Thiên Trung, nghe nói dạo này cậu tới thực tập tại một doanh nghiệp có vốn đầu tư nước ngoài à?"
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "对，刚去了一个星期，感觉职场对专业能力的要求非常高。",
                      "pinyin": "Duì, gāng qù le yí ge xīngqī, gǎnjué zhíchǎng duì zhuānyè nénglì de yāoqiú fēicháng gāo.",
                      "vietnamese": "Đúng thế, mới đi được một tuần thôi, tớ cảm thấy môi trường công sở đòi hỏi năng lực chuyên môn cực kỳ khắt khe."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "遇到困难不要退缩，多向前辈请教，虚心听取意见。",
                      "pinyin": "Yùdào kùnnan bú yào tuìsuō, duō xiàng qiánbèi qǐngjiào, xūxīn tīngqǔ yìjiàn.",
                      "vietnamese": "Gặp phải khó khăn đừng vội chùn bước, hãy thỉnh giáo các bậc tiền bối thật nhiều, khiêm tốn lắng nghe ý kiến đóng góp."
                  },
                  {
                      "speaker": "陈天中",
                      "hanzi": "没错！领导说，只有真正热爱自己工作的人，才能把事情做到极致。",
                      "pinyin": "Méi cuò! Lǐngdǎo shuō, zhǐyào zhēnzhèng rè'ài zìjǐ gōngzuò de rén, cái néng bǎ shìqing zuò dào jízhì.",
                      "vietnamese": "Chuẩn luôn! Sếp tớ bảo rằng, chỉ có những ai thực sự yêu tha thiết công việc của mình mới có thể làm nên những thành tựu chạm tới đỉnh cao hoàn mỹ."
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "这句话很有道理，脚踏实地比什么都强。",
                      "pinyin": "Zhè jù huà hěn yǒu dàolǐ, jiǎotàshídì bǐ shénme dōu qiáng.",
                      "vietnamese": "Câu nói này chí lý lắm, từng bước chắc chắn đặt chân lên mặt đất thực tế hơn bất cứ thứ gì."
                  }
              ]
          },
          {
              "id": "hsk3-l17-t4",
              "title": "课文 4: 严谨治学日记 (Bài khóa 4: Nhật ký tinh thần học tập nghiêm cẩn)",
              "context": "在日记中，白家月写学习态度与成长。(Nhật ký về thái độ học hỏi và nỗ lực).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "随着学习的逐步深入，我越来越深刻地体会到严谨态度的重要性。今天在向天中请教问题的过程中，他严谨的治学风格深深感染了我。",
                      "pinyin": "Suízhe xuéxí de zhúbù shēnrù, wǒ yuèláiyuè shēnkè de tǐhuì dào yánjǐn tàidu de zhòngyàoxìng. Jīntiān zài xiàng Tiānzhōng qǐngjiào wèntí de guòchéng zhōng, tā yánjǐn de zhìxué fēnggé shēnshēn gǎnrǎn le wǒ.",
                      "vietnamese": "Cùng với việc học tập ngày càng đi vào chiều sâu, tôi càng thấm thía sâu sắc tầm quan trọng của thái độ nghiêm cẩn. Hôm nay trong quá trình thỉnh giáo bài vở từ Thiên Trung, phong cách học tập chặt chẽ của cậu ấy đã truyền cảm hứng sâu sắc cho tôi."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "不是常说“细节决定成败”吗？学习如此，做人做事更是如此。一味追求速度而忽视质量，往往欲速则不达。",
                      "pinyin": "Bú shì cháng shuō 'xìjié juédìng chéngbài' ma? Xuéxí rúcǐ, zuòrén zuòshì gèng shì rúcǐ. Yíwèi zhuīqiú sùdù ér hūshì zhìliàng, wǎngwǎng yù sù zé bù dá.",
                      "vietnamese": "Chẳng phải người ta vẫn thường nói 'Chi tiết quyết định sự thành bại' đó sao? Việc học đã vậy, đối nhân xử thế lại càng như thế. Nếu chỉ chăm chăm đuổi theo tốc độ mà bỏ qua chất lượng thì thường dục tốc bất đạt."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "只有脚踏实地、精益求精，才能在求知的道路上不断突破自我。我要以优秀的人为榜样，多向认真负责的人汲取前行的力量。",
                      "pinyin": "Zhǐyào jiǎotàshídì, jīngyìqiújīng, cái néng zài qiúzhī de dàolù shang búduàn tūpò zìwǒ. Wǒ yào yǐ yōuxiù de rén wéi bǎngyàng, duō xiàng rènzhēn fùzé de rén jíqǔ qiánxíng de lìliang.",
                      "vietnamese": "Chỉ có bước đi vững chãi bằng đôi chân trên mặt đất, không ngừng hoàn thiện vươn tới sự tinh hoa, mới có thể liên tục bứt phá giới hạn bản thân trên con đường kiếm tìm tri thức. Tôi phải lấy những tấm gương xuất sắc làm ngọn hải đăng, học hỏi nhiều hơn từ những người nghiêm túc có trách nhiệm để tiếp thêm sức mạnh tiến bước."
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l17-g1",
              "title": "1. 介词“向” (Giới từ 'Hướng tới / Học hỏi từ...')",
              "explanation": "Đứng trước danh từ chỉ người hoặc phương hướng để biểu thị phương hướng vận động hoặc đối tượng học tập, hỏi han.",
              "examples": [
                  {
                      "hanzi": "我们真应该多向他学习。",
                      "pinyin": "Wǒmen zhēn yīnggāi duō xiàng tā xuéxí.",
                      "vietnamese": "Chúng ta thực sự nên học hỏi cậu ấy nhiều hơn."
                  },
                  {
                      "hanzi": "遇到困难多向前辈请教。",
                      "pinyin": "Yùdào kùnnan duō xiàng qiánbèi qǐngjiào.",
                      "vietnamese": "Gặp khó khăn hãy thỉnh giáo các bậc tiền bối."
                  },
                  {
                      "hanzi": "向前走五百米就到了。",
                      "pinyin": "Xiàng qián zǒu wǔbǎi mǐ jiù dào le.",
                      "vietnamese": "Đi về phía trước năm trăm mét là tới."
                  }
              ]
          },
          {
              "id": "hsk3-l17-g2",
              "title": "2. 反问句“不是……吗？” (Câu phản vấn 'Chẳng phải... hay sao?')",
              "explanation": "Dùng hình thức nghi vấn để khẳng định một sự thật hiển nhiên hoặc củng cố lập luận của người nói.",
              "examples": [
                  {
                      "hanzi": "不是说“三人行必有我师”吗？",
                      "pinyin": "Bú shì shuō 'sān rén xíng bì yǒu wǒ shī' ma?",
                      "vietnamese": "Chẳng phải người xưa nói 'Ba người cùng đi ắt có thầy ta' đó sao?"
                  },
                  {
                      "hanzi": "明天不是周末吗？你怎么还要上班？",
                      "pinyin": "Míngtiān bú shì zhōumò ma? Nǐ zěnme hái yào shàngbān?",
                      "vietnamese": "Ngày mai chẳng phải cuối tuần hay sao? Sao bạn vẫn phải đi làm?"
                  }
              ]
          },
          {
              "id": "hsk3-l17-g3",
              "title": "3. 递进复句“……，更……” (Câu tăng tiến '...càng...')",
              "explanation": "Biểu thị vế sau có mức độ đòi hỏi hoặc tầm quan trọng cao hơn hẳn so với vế trước.",
              "examples": [
                  {
                      "hanzi": "不仅要细心，更要严谨。",
                      "pinyin": "Bùjǐn yào xìxīn, gèng yào yánjǐn.",
                      "vietnamese": "Không chỉ cần cẩn thận, mà càng cần phải nghiêm cẩn."
                  },
                  {
                      "hanzi": "做人做事更是如此。",
                      "pinyin": "Zuòrén zuòshì gèng shì rúcǐ.",
                      "vietnamese": "Đối nhân xử thế lại càng như vậy."
                  }
              ]
          },
          {
              "id": "hsk3-l17-g4",
              "title": "4. 条件复句“只有……，才……” (Câu điều kiện duy nhất 'Chỉ có... mới...')",
              "explanation": "Biểu thị điều kiện nêu ở vế trước là điều kiện duy nhất bắt buộc phải có để dẫn tới kết quả ở vế sau.",
              "examples": [
                  {
                      "hanzi": "只有平时认真积累，考试的时候才能胸有成竹。",
                      "pinyin": "Zhǐyào píngshí rènzhēn jīlěi, kǎoshì de shíhou cái néng xiōngyǒuchéngzhú.",
                      "vietnamese": "Chỉ có ngày thường chăm chỉ tích lũy, khi thi mới tự tin chắc thắng."
                  },
                  {
                      "hanzi": "只有真正热爱工作的人，才能把事情做到极致。",
                      "pinyin": "Zhǐyào zhēnzhèng rè'ài gōngzuò de rén, cái néng bǎ shìqing zuò dào jízhì.",
                      "vietnamese": "Chỉ có người thực sự say mê công việc mới có thể làm nên đỉnh cao."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l17-w1",
              "hanzi": "发愁",
              "pinyin": "fā chóu",
              "hanViet": "Phát Sầu",
              "vietnamese": "lo lắng sốt ruột",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "发愁",
              "exampleTranslation": "lo lắng sốt ruột",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l17-w2",
              "hanzi": "班长",
              "pinyin": "bān zhǎng",
              "hanViet": "",
              "vietnamese": "lớp trưởng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "班长",
              "exampleTranslation": "lớp trưởng",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w3",
              "hanzi": "向",
              "pinyin": "xiàng",
              "hanViet": "Hướng",
              "vietnamese": "hướng về, học hỏi từ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "向",
              "exampleTranslation": "hướng về, học hỏi từ",
              "tags": [
                  "Giới từ"
              ]
          },
          {
              "id": "hsk3-l17-w4",
              "hanzi": "胸有成竹",
              "pinyin": "xiōng yǒu chéng zhú",
              "hanViet": "",
              "vietnamese": "tự tin nắm chắc phần thắng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "胸有成竹",
              "exampleTranslation": "tự tin nắm chắc phần thắng",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l17-w5",
              "hanzi": "微积分",
              "pinyin": "wēi jī fēn",
              "hanViet": "",
              "vietnamese": "phép tính vi tích phân",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "微积分",
              "exampleTranslation": "phép tính vi tích phân",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w6",
              "hanzi": "步骤",
              "pinyin": "bù zhòu",
              "hanViet": "Bộ Sậu",
              "vietnamese": "các bước tiến hành",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "步骤",
              "exampleTranslation": "các bước tiến hành",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w7",
              "hanzi": "公式",
              "pinyin": "gōng shì",
              "hanViet": "",
              "vietnamese": "công thức",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "公式",
              "exampleTranslation": "công thức",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w8",
              "hanzi": "忽略",
              "pinyin": "hū lüè",
              "hanViet": "Hốt Lược",
              "vietnamese": "bỏ qua, xem nhẹ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "忽略",
              "exampleTranslation": "bỏ qua, xem nhẹ",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l17-w9",
              "hanzi": "马虎",
              "pinyin": "mǎ hǔ",
              "hanViet": "Mã Hổ",
              "vietnamese": "cẩu thả, qua loa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "马虎",
              "exampleTranslation": "cẩu thả, qua loa",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l17-w10",
              "hanzi": "细心",
              "pinyin": "xì xīn",
              "hanViet": "Tế Tâm",
              "vietnamese": "tỉ mỉ chu đáo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "细心",
              "exampleTranslation": "tỉ mỉ chu đáo",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l17-w11",
              "hanzi": "严谨",
              "pinyin": "yán jǐn",
              "hanViet": "",
              "vietnamese": "nghiêm cẩn, chặt chẽ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "严谨",
              "exampleTranslation": "nghiêm cẩn, chặt chẽ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l17-w12",
              "hanzi": "透彻",
              "pinyin": "tòu chè",
              "hanViet": "",
              "vietnamese": "thấu đáo, triệt để",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "透彻",
              "exampleTranslation": "thấu đáo, triệt để",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l17-w13",
              "hanzi": "良师益友",
              "pinyin": "liáng shī yì yǒu",
              "hanViet": "",
              "vietnamese": "thầy tốt bạn hiền",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "良师益友",
              "exampleTranslation": "thầy tốt bạn hiền",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l17-w14",
              "hanzi": "外资",
              "pinyin": "wài zī",
              "hanViet": "",
              "vietnamese": "vốn đầu tư nước ngoài",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "外资",
              "exampleTranslation": "vốn đầu tư nước ngoài",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w15",
              "hanzi": "实习",
              "pinyin": "shí xí",
              "hanViet": "Thật Tập",
              "vietnamese": "thực tập",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "实习",
              "exampleTranslation": "thực tập",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l17-w16",
              "hanzi": "退缩",
              "pinyin": "tuì suō",
              "hanViet": "",
              "vietnamese": "chùn bước, lùi bước",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "退缩",
              "exampleTranslation": "chùn bước, lùi bước",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l17-w17",
              "hanzi": "前辈",
              "pinyin": "qián bèi",
              "hanViet": "",
              "vietnamese": "tiền bối, bậc đi trước",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "前辈",
              "exampleTranslation": "tiền bối, bậc đi trước",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w18",
              "hanzi": "极致",
              "pinyin": "jí zhì",
              "hanViet": "",
              "vietnamese": "đỉnh cao tuyệt đối",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "极致",
              "exampleTranslation": "đỉnh cao tuyệt đối",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w19",
              "hanzi": "脚踏实地",
              "pinyin": "jiǎo tà shí dì",
              "hanViet": "",
              "vietnamese": "chân đạp đất vững vàng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "脚踏实地",
              "exampleTranslation": "chân đạp đất vững vàng",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l17-w20",
              "hanzi": "成败",
              "pinyin": "chéng bài",
              "hanViet": "",
              "vietnamese": "thành bại",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "成败",
              "exampleTranslation": "thành bại",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l17-w21",
              "hanzi": "精益求精",
              "pinyin": "jīng yì qiú jīng",
              "hanViet": "",
              "vietnamese": "đã tốt lại muốn tốt hơn nữa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "精益求精",
              "exampleTranslation": "đã tốt lại muốn tốt hơn nữa",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l17-w22",
              "hanzi": "汲取",
              "pinyin": "jí qǔ",
              "hanViet": "",
              "vietnamese": "hút lấy, chắt lọc học hỏi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "汲取",
              "exampleTranslation": "hút lấy, chắt lọc học hỏi",
              "tags": [
                  "Động từ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l17-ex1",
              "type": "multiple_choice",
              "question": "Điền giới từ đối tượng: '我们要虚心 ______ 有经验的老同志请教。'",
              "options": [
                  "A. 向",
                  "B. 对",
                  "C. 跟",
                  "D. 往"
              ],
              "correctAnswer": "A. 向",
              "explanation": "向……请教 / 学习: thỉnh giáo / học hỏi từ ai đó.",
              "grammarFocus": "Giới từ 向"
          },
          {
              "id": "hsk3-l17-ex2",
              "type": "fill_blank",
              "question": "Điền liên từ điều kiện duy nhất: '______ (Chỉ có) 努力拼搏，才能创造美好的未来。'",
              "options": [
                  "只有",
                  "只要",
                  "如果",
                  "虽然"
              ],
              "correctAnswer": "只有",
              "explanation": "Cặp liên từ điều kiện duy nhất: 只有……才…… (chỉ có... mới...).",
              "grammarFocus": "Liên từ 只有……才……"
          },
          {
              "id": "hsk3-l17-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "今天不是星期五吗",
              "还要去上课",
              "你怎么"
              ],
              "question": "Sắp xếp câu: '今天不是星期五吗 / 还要去上课 / 你怎么'",
              "correctAnswer": "今天不是星期五吗，你怎么还要去上课？",
              "explanation": "Câu phản vấn: 不是……吗 biểu thị sự việc hiển nhiên.",
              "grammarFocus": "Câu phản vấn 不是……吗"
          },
          {
              "id": "hsk3-l17-ex4",
              "type": "multiple_choice",
              "question": "Chọn thành ngữ điền vào câu: '做科学研究必须 ______，来不得半点马虎。'",
              "options": [
                  "A. 脚踏实地",
                  "B. 名不虚传",
                  "C. 粗心大意",
                  "D. 熟能生巧"
              ],
              "correctAnswer": "A. 脚踏实地",
              "explanation": "脚踏实地 (jiǎotàshídì): chắc chắn, nghiêm túc thực tế.",
              "grammarFocus": "Thành ngữ Bài 17"
          }
      ],
      "cultureBonus": {
          "title": "📜 Nho gia và tinh thần 'Tam nhân hành tất hữu ngã sư' (三人行必有我师)",
          "summary": "Lời dạy nổi tiếng của Khổng Tử trong sách Luận Ngữ nhắc nhở tinh thần khiêm tốn học hỏi muôn người.",
          "content": "Khổng Tử từng dạy: 'Trong ba người cùng đi, ắt có một người có thể làm thầy ta. Hãy chọn điều tốt của họ mà noi theo, thấy điều chưa tốt của họ mà tự sửa mình'. Tinh thần hiếu học, cầu thị và trọng tri thức đã thấm đượm vào huyết quản bao thế hệ học sĩ Á Đông."
      }
  },
  // =========================================================================
  // LESSON 18: 我学会了包饺子
  // =========================================================================
  {
      "lessonNumber": 18,
      "titleHanzi": "我学会了包饺子",
      "titlePinyin": "Wǒ xuéhuì le bāo jiǎozi",
      "titleVietnamese": "Tôi đã học được cách gói sủi cảo",
      "pageStart": 163,
      "objectives": [
          "Nắm vững các phương thức biểu thị số ước lượng (概数) trong tiếng Hán.",
          "Phân biệt chuẩn xác giữa danh từ thời gian '刚才' và phó từ '刚刚'.",
          "Dùng câu phức điều kiện đầy đủ '只要……，就……'.",
          "Sử dụng kết cấu thời gian/không gian '从……起'."
      ],
      "texts": [
          {
              "id": "hsk3-l18-t1",
              "title": "课文 1: 春节的期盼 (Bài khóa 1: Mong chờ ngày Tết cổ truyền)",
              "context": "在飞机上，白家月和李文聊春节习俗。(Trên máy bay, trò chuyện về phong tục Tết).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "我马上就要在中国过春节了，心里特别兴奋！",
                      "pinyin": "Wǒ mǎshàng jiù yào zài Zhōngguó guò Chūnjié le, xīnlǐ tèbié xīngfèn!",
                      "vietnamese": "Em sắp sửa được đón Tết Nguyên đán ở Trung Quốc rồi, trong lòng hào hứng quá chừng!"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "这是我第一次邀请外国朋友来我家过年，全家人都很高兴。",
                      "pinyin": "Zhè shì wǒ dì-yī cì yāoqǐng wàiguó péngyou lái wǒ jiā guònián, quán jiā rén dōu hěn gāoxìng.",
                      "vietnamese": "Đây là lần đầu tiên anh mời một người bạn nước ngoài về nhà đón Tết cùng, cả gia đình anh ai nấy đều vô cùng phấn khởi."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "你们家过年一般做些什么？",
                      "pinyin": "Nǐmen jiā guònián yìbān zuò xiē shénme?",
                      "vietnamese": "Nhà anh ngày Tết thường làm những hoạt động gì ạ?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "春节是中国最重要的传统节日。除夕夜我们全家一边看春晚，一边包饺子，一直守岁到半夜。",
                      "pinyin": "Chūnjié shì Zhōngguó zuì zhòngyào de chuántǒng jiérì. Chúxī yè wǒmen quán jiā yìbiān kàn Chūnwǎn, yìbiān bāo jiǎozi, yìzhí shǒusuì dào bànyè.",
                      "vietnamese": "Tết Nguyên Đán là ngày lễ truyền thống trọng đại nhất của Trung Quốc. Đêm Giao thừa cả nhà anh vừa xem gala đón xuân vừa gói sủi cảo, thức đón giao thừa đến tận nửa đêm."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "听起来真有意思！你们春节放几天假？",
                      "pinyin": "Tīng qǐlai zhēn yǒu yìsi! Nǐmen Chūnjié fàng jǐ tiān jià?",
                      "vietnamese": "Nghe thú vị thật đấy! Tết Nguyên Đán các anh được nghỉ mấy ngày?"
                  },
                  {
                      "speaker": "李文",
                      "hanzi": "大概七八天吧。",
                      "pinyin": "Dàgài qī-bā tiān ba.",
                      "vietnamese": "Khoảng chừng bảy tám ngày gì đó."
                  }
              ]
          },
          {
              "id": "hsk3-l18-t2",
              "title": "课文 2: 到家拜年 (Bài khóa 2: Về nhà chúc Tết)",
              "context": "在李文家客厅，白家月拜年赠礼。(Tại phòng khách nhà Lý Văn, chúc Tết tặng quà).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "张阿姨、李叔叔，过年好！这是我给您二位带来的小礼物，希望你们喜欢。",
                      "pinyin": "Zhāng āyí, Lǐ shūshu, guònián hǎo! Zhè shì wǒ gěi nín èr wèi dàilái de xiǎo lǐwù, xīwàng nǐmen xǐhuan.",
                      "vietnamese": "Dì Trương, chú Lý, chúc mừng năm mới hai bác ạ! Đây là món quà nhỏ cháu mang đến biếu hai bác, mong hai bác sẽ thích."
                  },
                  {
                      "speaker": "李叔叔",
                      "hanzi": "谢谢家月，你太客气了！",
                      "pinyin": "Xièxie Jiāyuè, nǐ tài kèqi le!",
                      "vietnamese": "Cảm ơn Gia Nguyệt, cháu khách sáo quá rồi!"
                  },
                  {
                      "speaker": "张阿姨",
                      "hanzi": "小文总在电话里提起你，今天一见，真是个漂亮懂事的好姑娘。",
                      "pinyin": "Xiǎowén zǒng zài diànhuà lǐ tíqǐ nǐ, jīntiān yí jiàn, zhēn shì ge piàoliang dǒngshì de hǎo gūniang.",
                      "vietnamese": "Thằng Văn cứ hay nhắc về cháu qua điện thoại suốt, hôm nay gặp mặt, quả đúng là một cô bé vừa xinh xắn vừa hiểu chuyện."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "谢谢阿姨夸奖。",
                      "pinyin": "Xièxie āyí kuājiǎng.",
                      "vietnamese": "Cháu cảm ơn dì đã khen ạ."
                  },
                  {
                      "speaker": "李叔叔",
                      "hanzi": "桌上有刚洗好的水果和瓜子，别拘束，当成自己家一样。",
                      "pinyin": "Zhuō shang yǒu gāng xǐhǎo de shuǐguǒ hé guāzǐ, bié jūshù, dāngchéng zìjǐ jiā yíyàng.",
                      "vietnamese": "Trên bàn có hoa quả và hạt dưa chú vừa rửa sạch, cháu đừng gò bó nhé, cứ tự nhiên như ở nhà mình."
                  },
                  {
                      "speaker": "张阿姨",
                      "hanzi": "快坐下看会儿电视，饺子馅儿刚调好，马上就包！",
                      "pinyin": "Kuài zuòxia kàn huìr diànshì, jiǎozixiànr gāng tiáohǎo, mǎshàng jiù bāo!",
                      "vietnamese": "Mau ngồi xuống xem tivi một lát đi cháu, nhân sủi cảo dì vừa trộn xong, gói ngay bây giờ đây!"
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "我在视频里学过包饺子，我也来帮您一起包吧！",
                      "pinyin": "Wǒ zài shìpín lǐ xué guo bāo jiǎozi, wǒ yě lái bāng nín yìqǐ bāo ba!",
                      "vietnamese": "Cháu từng học gói sủi cảo trên video rồi đấy, để cháu vào giúp dì gói cùng một tay nhé!"
                  }
              ]
          },
          {
              "id": "hsk3-l18-t3",
              "title": "课文 3: 厨房包饺子 (Bài khóa 3: Gói sủi cảo trong bếp)",
              "context": "在厨房，包饺子聊李文小时候。(Trong gian bếp, gói bánh ôn chuyện cũ).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "这张照片是李文出国前拍的吗？",
                      "pinyin": "Zhè zhāng zhàopiàn shì Lǐ Wén chūguó qián pāi de ma?",
                      "vietnamese": "Bức ảnh này là chụp trước lúc anh Lý Văn ra nước ngoài đúng không dì?"
                  },
                  {
                      "speaker": "张阿姨",
                      "hanzi": "对，这是三四年前他在北京机场准备出发时，全家人一起送他拍的合影。",
                      "pinyin": "Duì, zhè shì sān-sì nián qián tā zài Běijīng jīchǎng zhǔnbèi chūfā shí, quán jiā rén yìqǐ sòng tā pāi de héyǐng.",
                      "vietnamese": "Đúng rồi, đó là ba bốn năm trước lúc nó ở sân bay Bắc Kinh chuẩn bị lên đường, cả nhà cùng ra tiễn và chụp chung tấm ảnh kỷ niệm đấy."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "时间过得真快啊，一晃三四年就过去了。阿姨，您当时一定特别想他吧？",
                      "pinyin": "Shíjiān guò de zhēn kuài a, yì huǎng sān-sì nián jiù guòqù le. Āyí, nín dāngshí yídìng tèbié xiǎng tā ba?",
                      "vietnamese": "Thời gian trôi nhanh thật đấy dì nhỉ, thoáng một cái ba bốn năm đã qua đi rồi. Dì ơi, hồi đó dì chắc hẳn nhớ anh ấy lắm đúng không ạ?"
                  },
                  {
                      "speaker": "张阿姨",
                      "hanzi": "他刚离开家那会儿，我心里空落落的，好几天不通个视频电话就惦记着。",
                      "pinyin": "Tā gāng líkāi jiā nà huìr, wǒ xīnlǐ kōngluòluò de, hǎo jǐ tiān bù tōng ge shìpín diànhuà jiù diànjìzhe.",
                      "vietnamese": "Hồi nó mới rời nhà đi, trong lòng dì trống trải hụt hẫng lắm, mấy hôm mà không gọi được cuộc điện thoại video là ruột gan cứ bồn chồn nhớ mong."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "李文还有半年就要毕业了，很快就能天天陪在您身边了。",
                      "pinyin": "Lǐ Wén hái yǒu bàn nián jiù yào bìyè le, hěn kuài jiù néng tiāntiān péi zài nín shēnbiān le.",
                      "vietnamese": "Anh Lý Văn còn nửa năm nữa là tốt nghiệp rồi, rất nhanh thôi là có thể ngày ngày ở bên cạnh chăm sóc dì rồi."
                  },
                  {
                      "speaker": "张阿姨",
                      "hanzi": "只要他平平安安、前程似锦，做父母的就心满意足了。",
                      "pinyin": "Zhǐyào tā píngpíng'ān'ān, qiánchéngsìjǐn, zuò fùmǔ de jiù xīnmǎnyìzú le.",
                      "vietnamese": "Chỉ cần nó bình an vô sự, tiền đồ rộng mở xán lạn là phận làm cha mẹ như dì đã mãn nguyện lắm rồi."
                  }
              ]
          },
          {
              "id": "hsk3-l18-t4",
              "title": "课文 4: 温暖中国年日记 (Bài khóa 4: Nhật ký Tết ấm áp tại Trung Quốc)",
              "context": "在日记中，白家月回顾中国之旅与心灵收获。(Nhật ký tổng kết hành trình Trung Quốc).",
              "lines": [
                  {
                      "speaker": "白家月",
                      "hanzi": "这次中国之行最让我感到幸福的事情，就是认识了李文淳朴善良的父母，并在他们家度过了一个温馨难忘的中国年。",
                      "pinyin": "Zhè cì Zhōngguó zhī xíng zuì ràng wǒ gǎndào xìngfú de shìqing, jiù shì rènshi le Lǐ Wén chúnpǔ shànliáng de fùmǔ, bìng zài tāmen jiā dùguò le yí ge wēnxīn nánwàng de Zhōngguó nián.",
                      "vietnamese": "Chuyến đi Trung Quốc lần này điều khiến tôi cảm thấy hạnh phúc nhất chính là được làm quen với bố mẹ thuần hậu lương thiện của Lý Văn, và được trải qua một cái Tết Trung Quốc ấm cúng khó quên tại ngôi nhà của họ."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "在阿姨的耐心指点下，我学会了擀皮和包饺子。看着一个个圆滚滚、像元宝一样的饺子在沸水里翻滚，成就感油然而生。",
                      "pinyin": "Zài āyí de nàixīn zhǐdiǎn xià, wǒ xuéhuì le gǎnpí hé bāo jiǎozi. Kànzhe yí gègè yuángǔngǔn, xiàng yuánbǎo yíyàng de jiǎozǐ zài fèishuǐ lǐ fāngǔn, chéngjiùgǎn yóurán'érshēng.",
                      "vietnamese": "Dưới sự chỉ bảo kiên nhẫn của dì, tôi đã học được cách cán vỏ bột và gói sủi cảo. Nhìn từng chiếc sủi cảo tròn vo, căng mọng như những thỏi vàng nén nhấp nhô lặn ngụp trong nồi nước sôi sùng sục, niềm tự hào và cảm giác thành tựu bỗng dâng trào trong lòng."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "在李文身上，我看到了中国青年自强不息、执着追求梦想的坚韧品质。只要心中有目标，持之以恒地努力下去，梦想终将照进现实。",
                      "pinyin": "Zài Lǐ Wén shēnshang, wǒ kàndào le Zhōngguó qīngnián zìqiángbùxī, zhízhuó zhuīqiú mèngxiǎng de jiānrèn pǐnzhì. Zhǐyào xīnzhōng yǒu mùbiāo, chízhīyǐhéng de nǔlì xiàqu, mèngxiǎng zhōngjiāng zhàojìn xiànshí.",
                      "vietnamese": "Ở nơi Lý Văn, tôi nhìn thấy phẩm chất kiên cường của tuổi trẻ Trung Quốc - luôn tự lực tự cường và bền bỉ kiên định theo đuổi ước mơ. Chỉ cần trong tim có mục tiêu rõ ràng và kiên trì nỗ lực tới cùng, giấc mơ chắc chắn sẽ trở thành hiện thực."
                  },
                  {
                      "speaker": "白家月",
                      "hanzi": "从今天起，带着这份温暖与力量，我将勇敢地奔向下一段人生旅途！",
                      "pinyin": "Cóng jīntiān qǐ, dàizhe zhè fèn wēnnuǎn yǔ lìliang, wǒ jiāng yǒnggǎn de bēnxiàng xià yí duàn rénshēng lǚtú!",
                      "vietnamese": "Bắt đầu từ hôm nay, mang theo sự ấm áp và sức mạnh ngập tràn này, tôi sẽ dũng cảm sải bước tiến tới chặng đường tiếp theo của cuộc đời!"
                  }
              ]
          }
      ],
      "grammarPoints": [
          {
              "id": "hsk3-l18-g1",
              "title": "1. 概数表达法 (Cách diễn đạt số ước lượng)",
              "explanation": "Dùng hai số tự nhiên liền kề nhau để biểu thị số lượng ước chừng không chính xác (như 三四天, 七八个, 五六十).",
              "examples": [
                  {
                      "hanzi": "你们春节放几天假？——大概七八天吧。",
                      "pinyin": "Nǐmen Chūnjié fàng jǐ tiān jià? -- Dàgài qī-bā tiān ba.",
                      "vietnamese": "Tết các bạn được nghỉ mấy ngày? -- Khoảng chừng bảy tám ngày."
                  },
                  {
                      "hanzi": "这是三四年前拍的合影。",
                      "pinyin": "Zhè shì sān-sì nián qián pāi de héyǐng.",
                      "vietnamese": "Đây là bức ảnh chụp chung từ ba bốn năm trước."
                  }
              ]
          },
          {
              "id": "hsk3-l18-g2",
              "title": "2. “刚才”和“刚刚”的区别 (Phân biệt danh từ '刚才' và phó từ '刚刚')",
              "explanation": "'刚才' là danh từ chỉ thời gian (vừa nãy, cách đây ít phút); '刚刚' là phó từ chỉ hành động vừa mới xảy ra theo cảm nhận của người nói (có thể là vài phút trước, cũng có thể là mấy ngày/mấy tháng trước).",
              "examples": [
                  {
                      "hanzi": "刚才还是大晴天呢。",
                      "pinyin": "Gāngcái hái shì dà qíngtiān ne.",
                      "vietnamese": "Vừa nãy trời vẫn còn nắng chang chang."
                  },
                  {
                      "hanzi": "水和瓜子是刚刚准备好的。",
                      "pinyin": "Shuǐ hé guāzǐ shì gānggāng zhǔnbèihǎo de.",
                      "vietnamese": "Nước và hạt dưa vừa mới được chuẩn bị xong."
                  }
              ]
          },
          {
              "id": "hsk3-l18-g3",
              "title": "3. 条件复句“只要……，就……” (Câu điều kiện đủ 'Chỉ cần... là...')",
              "explanation": "Biểu thị chỉ cần có được điều kiện nêu ở vế trước là ắt sẽ xuất hiện kết quả tất yếu ở vế sau.",
              "examples": [
                  {
                      "hanzi": "只要他平平安安，做父母的就心满意足了。",
                      "pinyin": "Zhǐyào tā píngpíng'ān'ān, zuò fùmǔ de jiù xīnmǎnyìzú le.",
                      "vietnamese": "Chỉ cần nó bình an vô sự là bố mẹ đã mãn nguyện rồi."
                  },
                  {
                      "hanzi": "只要努力，就一定能学会包饺子。",
                      "pinyin": "Zhǐyào nǔlì, jiù yídìng néng xuéhuì bāo jiǎozi.",
                      "vietnamese": "Chỉ cần cố gắng là nhất định sẽ học được cách gói sủi cảo."
                  }
              ]
          },
          {
              "id": "hsk3-l18-g4",
              "title": "4. 固定格式“从……起” (Cấu trúc 'Bắt đầu từ... trở đi')",
              "explanation": "Biểu thị điểm mốc bắt đầu của một khoảng thời gian hoặc một giai đoạn hành động mới.",
              "examples": [
                  {
                      "hanzi": "从今天起，我将勇敢地奔向下一段旅途。",
                      "pinyin": "Cóng jīntiān qǐ, wǒ jiāng yǒnggǎn de bēnxiàng xià yí duàn lǚtú.",
                      "vietnamese": "Kể từ hôm nay trở đi, tôi sẽ dũng cảm tiến tới chặng đường tiếp theo."
                  },
                  {
                      "hanzi": "从下周起，我们要开始期末复习了。",
                      "pinyin": "Cóng xià zhōu qǐ, wǒmen yào kāishǐ qīmò fùxí le.",
                      "vietnamese": "Kể từ tuần sau, chúng tôi sẽ bắt đầu ôn tập cuối kỳ."
                  }
              ]
          }
      ],
      "vocabulary": [
          {
              "id": "hsk3-l18-w1",
              "hanzi": "春节",
              "pinyin": "chūn jié",
              "hanViet": "",
              "vietnamese": "Tết Nguyên Đán",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "春节",
              "exampleTranslation": "Tết Nguyên Đán",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w2",
              "hanzi": "兴奋",
              "pinyin": "xīng fèn",
              "hanViet": "Hưng Phấn",
              "vietnamese": "phấn khích, hào hứng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "兴奋",
              "exampleTranslation": "phấn khích, hào hứng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l18-w3",
              "hanzi": "传统",
              "pinyin": "chuán tǒng",
              "hanViet": "Truyền Thống",
              "vietnamese": "truyền thống",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "传统",
              "exampleTranslation": "truyền thống",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w4",
              "hanzi": "节日",
              "pinyin": "jié rì",
              "hanViet": "Tiết Nhật",
              "vietnamese": "ngày lễ tết",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "节日",
              "exampleTranslation": "ngày lễ tết",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w5",
              "hanzi": "除夕",
              "pinyin": "chú xī",
              "hanViet": "Trừ Tịch",
              "vietnamese": "đêm Giao thừa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "除夕",
              "exampleTranslation": "đêm Giao thừa",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w6",
              "hanzi": "春晚",
              "pinyin": "chūn wǎn",
              "hanViet": "",
              "vietnamese": "gala chào xuân",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "春晚",
              "exampleTranslation": "gala chào xuân",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w7",
              "hanzi": "守岁",
              "pinyin": "shǒu suì",
              "hanViet": "",
              "vietnamese": "thức đón giao thừa",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "守岁",
              "exampleTranslation": "thức đón giao thừa",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l18-w8",
              "hanzi": "半夜",
              "pinyin": "bàn yè",
              "hanViet": "Bán Dạ",
              "vietnamese": "nửa đêm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "半夜",
              "exampleTranslation": "nửa đêm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w9",
              "hanzi": "拜年",
              "pinyin": "bài nián",
              "hanViet": "Bái Niên",
              "vietnamese": "chúc Tết",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "拜年",
              "exampleTranslation": "chúc Tết",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l18-w10",
              "hanzi": "夸奖",
              "pinyin": "kuā jiǎng",
              "hanViet": "Khoa Tưởng",
              "vietnamese": "khen ngợi",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "夸奖",
              "exampleTranslation": "khen ngợi",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l18-w11",
              "hanzi": "拘束",
              "pinyin": "jū shù",
              "hanViet": "",
              "vietnamese": "gò bó, câu nệ",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "拘束",
              "exampleTranslation": "gò bó, câu nệ",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l18-w12",
              "hanzi": "饺子馅",
              "pinyin": "jiǎo zi xiàn",
              "hanViet": "",
              "vietnamese": "nhân sủi cảo",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "饺子馅",
              "exampleTranslation": "nhân sủi cảo",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w13",
              "hanzi": "调",
              "pinyin": "diào",
              "hanViet": "Điều",
              "vietnamese": "trộn, nêm gia vị",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 4,
              "example": "调",
              "exampleTranslation": "trộn, nêm gia vị",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l18-w14",
              "hanzi": "合影",
              "pinyin": "hé yǐng",
              "hanViet": "Hợp Ảnh",
              "vietnamese": "ảnh chụp chung kỷ niệm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "合影",
              "exampleTranslation": "ảnh chụp chung kỷ niệm",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w15",
              "hanzi": "一晃",
              "pinyin": "yī huǎng",
              "hanViet": "",
              "vietnamese": "thoáng chốc, loáng một cái",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "一晃",
              "exampleTranslation": "thoáng chốc, loáng một cái",
              "tags": [
                  "Phó từ"
              ]
          },
          {
              "id": "hsk3-l18-w16",
              "hanzi": "空落落",
              "pinyin": "kōng luò luò",
              "hanViet": "",
              "vietnamese": "trống trải hụt hẫng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 12,
              "example": "空落落",
              "exampleTranslation": "trống trải hụt hẫng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l18-w17",
              "hanzi": "惦记",
              "pinyin": "diàn jì",
              "hanViet": "",
              "vietnamese": "nhớ mong, bồn chồn lo lắng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "惦记",
              "exampleTranslation": "nhớ mong, bồn chồn lo lắng",
              "tags": [
                  "Động từ"
              ]
          },
          {
              "id": "hsk3-l18-w18",
              "hanzi": "平安",
              "pinyin": "píng ān",
              "hanViet": "Bình An",
              "vietnamese": "bình an",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "平安",
              "exampleTranslation": "bình an",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l18-w19",
              "hanzi": "前程似锦",
              "pinyin": "qián chéng shì jǐn",
              "hanViet": "",
              "vietnamese": "tiền đồ xán lạn như gấm",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "前程似锦",
              "exampleTranslation": "tiền đồ xán lạn như gấm",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l18-w20",
              "hanzi": "心满意足",
              "pinyin": "xīn mǎn yì zú",
              "hanViet": "",
              "vietnamese": "mãn nguyện vô cùng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "心满意足",
              "exampleTranslation": "mãn nguyện vô cùng",
              "tags": [
                  "Thành ngữ"
              ]
          },
          {
              "id": "hsk3-l18-w21",
              "hanzi": "淳朴",
              "pinyin": "chún pǔ",
              "hanViet": "",
              "vietnamese": "thuần hậu, mộc mạc chất phác",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "淳朴",
              "exampleTranslation": "thuần hậu, mộc mạc chất phác",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l18-w22",
              "hanzi": "温馨",
              "pinyin": "wēn xīn",
              "hanViet": "",
              "vietnamese": "ấm áp ấm cúng",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "温馨",
              "exampleTranslation": "ấm áp ấm cúng",
              "tags": [
                  "Tính từ"
              ]
          },
          {
              "id": "hsk3-l18-w23",
              "hanzi": "擀皮",
              "pinyin": "gǎn pí",
              "hanViet": "",
              "vietnamese": "cán vỏ bánh",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "擀皮",
              "exampleTranslation": "cán vỏ bánh",
              "tags": [
                  "Động từ li hợp"
              ]
          },
          {
              "id": "hsk3-l18-w24",
              "hanzi": "元宝",
              "pinyin": "yuán bǎo",
              "hanViet": "",
              "vietnamese": "thỏi vàng nén nén bạc",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 8,
              "example": "元宝",
              "exampleTranslation": "thỏi vàng nén nén bạc",
              "tags": [
                  "Danh từ"
              ]
          },
          {
              "id": "hsk3-l18-w25",
              "hanzi": "自强不息",
              "pinyin": "zì qiáng bù xī",
              "hanViet": "",
              "vietnamese": "tự lực tự cường vươn lên",
              "hskLevel": 3,
              "radical": "字",
              "strokeCount": 16,
              "example": "自强不息",
              "exampleTranslation": "tự lực tự cường vươn lên",
              "tags": [
                  "Thành ngữ"
              ]
          }
      ],
      "exercises": [
          {
              "id": "hsk3-l18-ex1",
              "type": "multiple_choice",
              "question": "Điền biểu thị số ước lượng: '我们班大概有 ______ 个同学报名参加汉语桥比赛。'",
              "options": [
                  "A. 七八",
                  "B. 七和八",
                  "C. 七或者八",
                  "D. 七乘八"
              ],
              "correctAnswer": "A. 七八",
              "explanation": "Biểu thị số ước lượng liền kề: 七八个 (khoảng 7-8 người).",
              "grammarFocus": "Ước lượng số từ"
          },
          {
              "id": "hsk3-l18-ex2",
              "type": "fill_blank",
              "question": "Điền liên từ điều kiện đủ: '______ (Chỉ cần) 心中有目标，持之以恒，梦想就一定能实现。'",
              "options": [
                  "只要",
                  "只有",
                  "虽然",
                  "不管"
              ],
              "correctAnswer": "只要",
              "explanation": "Cặp liên từ: 只要……，就…… (chỉ cần... là...).",
              "grammarFocus": "Liên từ 只要……就……"
          },
          {
              "id": "hsk3-l18-ex3",
              "type": "sentence_scramble",
              "options": [],
              "scrambleSegments": [
                  "从今天起",
              "我要每天早起",
              "锻炼身体"
              ],
              "question": "Sắp xếp câu: '从今天起 / 我要每天早起 / 锻炼身体'",
              "correctAnswer": "从今天起我要每天早起锻炼身体。",
              "explanation": "Cấu trúc: 从……起 biểu thị mốc thời gian bắt đầu.",
              "grammarFocus": "Cấu trúc 从……起"
          },
          {
              "id": "hsk3-l18-ex4",
              "type": "multiple_choice",
              "question": "Chọn từ thích hợp: '看着孩子平平安安地长大，父母感到十分 ______。'",
              "options": [
                  "A. 心满意足",
                  "B. 熟能生巧",
                  "C. 虚惊一场",
                  "D. 粗心大意"
              ],
              "correctAnswer": "A. 心满意足",
              "explanation": "心满意足 (xīnmǎnyìzú): thỏa lòng mãn nguyện.",
              "grammarFocus": "Thành ngữ Bài 18"
          }
      ],
      "cultureBonus": {
          "title": "🎉 祝贺完成新 HSK 3 全部 18 课！ (Chúc mừng hoàn thành toàn bộ 18 bài HSK 3!)",
          "summary": "Bạn đã xuất sắc chinh phục trọn vẹn 18 bài học chuẩn giáo trình Bắc Ngữ BLCUP 新HSK教程 3!",
          "content": "Với vốn từ vựng nền tảng vững chắc, toàn bộ các điểm ngữ pháp trọng yếu (câu chữ 把, câu chữ 被, bổ ngữ khả năng, bổ ngữ xu hướng phái sinh, câu điều kiện giả thiết, so sánh nâng cao...) bạn đã hoàn toàn sẵn sàng tự tin bước tiếp lên hành trình New HSK 4 đỉnh cao!"
      }
  }
];

export function getAllNewHsk3Vocabulary(): WordItem[] {
  const allVocab: WordItem[] = [];
  const seen = new Set<string>();
  for (const lesson of NEW_HSK3_FULL_LESSONS) {
    for (const word of lesson.vocabulary) {
      if (!seen.has(word.hanzi)) {
        seen.add(word.hanzi);
        allVocab.push(word);
      }
    }
  }
  return allVocab;
}
