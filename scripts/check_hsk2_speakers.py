# -*- coding: utf-8 -*-
import re
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ts = open("src/data/newHsk2BookData.ts", encoding="utf-8").read()
man = json.load(open("src/data/coursebookAudioManifest.json", encoding="utf-8"))

for l in range(1, 16):
    for t in range(1, 5):
        tid = f"hsk2-l{l}-t{t}"
        m = re.search(r"id:\s*['\"]" + tid + r"['\"].*?lines:\s*\[(.*?)\]\s*\}", ts, re.DOTALL)
        if not m:
            print("Missing in TS:", tid)
            continue
        spks_ts = [s.split("(")[0].strip() for s in re.findall(r"speaker:\s*['\"]([^'\"]+)['\"]", m.group(1))]
        spks_man = [x["speaker"].split("(")[0].strip() for x in man[tid]["lines"]]
        if spks_ts != spks_man:
            print(f"Diff in {tid}: TS={spks_ts} vs MAN={spks_man}")

print("Done checking TS vs Manifest speaker sync for HSK 2!")
