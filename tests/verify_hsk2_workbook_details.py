import re
import os
import sys

def verify_hsk2_workbook():
    target_file = os.path.join(os.getcwd(), 'src', 'data', 'hsk2WorkbookData.ts')
    if not os.path.exists(target_file):
        print(f"Error: {target_file} does not exist")
        sys.exit(1)

    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Placeholders
    placeholders = re.findall(r'\b(TODO|dummy|placeholder|mock_fallback|temp_question)\b', content, re.IGNORECASE)
    print(f"Placeholders found: {set(placeholders)} (count: {len(placeholders)})")

    # 2. Check lessons
    lessons = re.findall(r'lessonNumber:\s*(\d+)', content)
    unique_lessons = sorted(list(set(map(int, lessons))))
    print(f"Unique lesson numbers in file: {unique_lessons}")

    # 3. Match the actual ID patterns in hsk2WorkbookData.ts
    # Listening: h2-l\d+-l\d+
    listening_ids = re.findall(r"id:\s*['\"](h2-l\d+-l\d+)['\"]", content)
    # Reading: h2-l\d+-r\d+
    reading_ids = re.findall(r"id:\s*['\"](h2-l\d+-r\d+)['\"]", content)
    # Writing: h2-l\d+-w\d+
    writing_ids = re.findall(r"id:\s*['\"](h2-l\d+-w\d+)['\"]", content)
    # Word expansion: w\d+_e\d+ or similar
    we_ids = re.findall(r"id:\s*['\"](w\d+_e\d+)['\"]", content)

    print(f"\n--- Aggregated Counts ---")
    print(f"Listening exercise IDs count: {len(listening_ids)} (unique: {len(set(listening_ids))})")
    print(f"Reading exercise IDs count:   {len(reading_ids)} (unique: {len(set(reading_ids))})")
    print(f"Writing exercise IDs count:   {len(writing_ids)} (unique: {len(set(writing_ids))})")
    print(f"Word expansion IDs count:     {len(we_ids)} (unique: {len(set(we_ids))})")

    total = len(listening_ids) + len(reading_ids) + len(writing_ids) + len(we_ids)
    print(f"Total authentic workbook questions: {total}")

    # Verify per lesson
    print(f"\n--- Per Lesson Breakdown ---")
    all_passed = True
    for l in range(1, 16):
        prefix = f"h2-l{l:02d}-"
        l_list = [i for i in listening_ids if i.startswith(prefix)]
        l_read = [i for i in reading_ids if i.startswith(prefix)]
        l_wr = [i for i in writing_ids if i.startswith(prefix)]
        we_prefix = f"w{l}_"
        l_we = [i for i in we_ids if i.startswith(we_prefix)]
        
        ok = (len(l_list) == 10 and len(l_read) == 14 and len(l_wr) == 6 and len(l_we) == 3)
        if not ok:
            all_passed = False
        status = "OK" if ok else "FAIL"
        print(f"Lesson {l:2d}: Listen={len(l_list):2d}/10, Read={len(l_read):2d}/14, Writing={len(l_wr):2d}/6, WE={len(l_we):2d}/3 => Total={len(l_list)+len(l_read)+len(l_wr)+len(l_we):2d}/33 [{status}]")

    if not all_passed or total != 495:
        print("\n[FAIL] Discrepancy found in workbook question counts!")
        sys.exit(1)
    else:
        print("\n[SUCCESS] Exact count of 495 questions verified across 15 lessons!")

if __name__ == '__main__':
    verify_hsk2_workbook()
