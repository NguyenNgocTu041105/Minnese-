import json

with open(r'C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 3800:
            d = json.loads(line)
            th = d.get('thinking', '')
            content = d.get('content', '')
            if 'Lesson 5' in th or 'Lesson 5' in content or '课号' in th or '词语表' in th:
                print(f"Match at line {i}: th={len(th)}, content={len(content)}")
