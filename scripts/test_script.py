import json

with open(r'C:\Users\Tunn\.gemini\antigravity\brain\83876778-6cee-4b77-ad06-7ebd339ce89f\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'check_page_136' in line:
            d = json.loads(line)
            print(f'Line {i}: type={d.get("type")}, source={d.get("source")}')
            if d.get("thinking"):
                print("Thinking snippet:", d.get("thinking")[:300])
            if d.get("tool_calls"):
                print("Tool calls:", d.get("tool_calls"))
