with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = "'hsk2-l3-t4': {"
pos = text.find(target)
if pos == -1:
    print("Target not found")
    exit(1)

# Find closing brace of hsk2-l3-t4
close_brace = text.find('},', pos) + 2

addition = '''
  // HSK 2 - Bài 4: 你穿红色的很好看
  'hsk2-l4-t1': {
    src: '/textbook_art/cartoon_hsk2_l4_t1.jpg',
    caption: '在商场外，王一雪和刘小雪在走路。(Bên ngoài trung tâm thương mại mới mở, hai mẹ con vui vẻ cùng nhau đi dạo sắm đồ).',
  },
  'hsk2-l4-t2': {
    src: '/textbook_art/cartoon_hsk2_l4_t2.jpg',
    caption: '在服装店，王一雪和刘小雪在买裤子。(Ở tiệm thời trang, mẹ gợi ý Tiểu Tuyết thử chiếc quần màu đỏ tươi tắn).',
  },
  'hsk2-l4-t3': {
    src: '/textbook_art/cartoon_hsk2_l4_t3.jpg',
    caption: '在商场店里，王一雪和刘小雪在买书包。(Trong cửa hàng, Tiểu Tuyết chọn chiếc ba lô màu xanh lá cây rất ưng ý).',
  },
  'hsk2-l4-t4': {
    src: '/textbook_art/cartoon_hsk2_l4_t4.jpg',
    caption: '在房间，刘小雪在写日记。(Trong phòng ngủ ấm cúng, Lưu Tiểu Tuyết vui vẻ viết nhật ký về chiếc ba lô xanh và quần đỏ vừa mua).',
  },
  // HSK 2 - Bài 5: 第一次去中国朋友家
  'hsk2-l5-t1': {
    src: '/textbook_art/cartoon_hsk2_l5_t1.jpg',
    caption: '在宾馆楼下，安妮给白家月打电话。(Ở dưới sảnh khách sạn, Annie gọi điện hối Bạch Gia Nguyệt xuống để kịp sang nhà bạn Trung Quốc).',
  },
  'hsk2-l5-t2': {
    src: '/textbook_art/cartoon_hsk2_l5_t2.jpg',
    caption: '在王一雪家，白家月和安妮来做客。(Tại nhà chị Nhất Tuyết, Bạch Gia Nguyệt và Annie chào hỏi và tặng quà ông bà nội).',
  },
  'hsk2-l5-t3': {
    src: '/textbook_art/cartoon_hsk2_l5_t3.jpg',
    caption: '在王一雪家，白家月和安妮在吃饭。(Tại bàn ăn, mọi người quây quần thưởng thức bữa cơm ấm cúng và trà sữa thơm ngon).',
  },
  'hsk2-l5-t4': {
    src: '/textbook_art/cartoon_hsk2_l5_t4.jpg',
    caption: '在宾馆，白家月给李文发信息。(Ở khách sạn, Bạch Gia Nguyệt vui vẻ nhắn tin cho Lý Văn kể về chuyến thăm nhà và đi bộ về khách sạn).',
  },'''

new_text = text[:close_brace] + addition + text[close_brace:]

with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Successfully updated CoursebookView.tsx!")
