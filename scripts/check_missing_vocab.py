# -*- coding: utf-8 -*-
from generate_hsk1_vocab_map import VOCAB_INDEX, PROPER_NOUNS
from build_hsk1_vocab_data import WORD_METADATA

missing = []
for item in VOCAB_INDEX + PROPER_NOUNS:
    hz = item[0]
    if hz not in WORD_METADATA:
        missing.append(hz)

print("Missing words count:", len(missing))
if missing:
    print("Missing:", missing)
else:
    print("ALL 100% OF WORDS ARE PRESENT AND MATCHED!")
