with open('src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import React, { useState } from 'react';", "import React, { useState, useRef, useEffect } from 'react';")
text = text.replace("  Pause,\n  Sparkles,\n  Radio,", "  Pause,\n  Radio,")
text = text.replace("  Pause,\r\n  Sparkles,\r\n  Radio,", "  Pause,\r\n  Radio,")

with open('src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed imports')
