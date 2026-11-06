with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = "textItem.lines.map((l) => `${l.speaker}：${l.hanzi}`).join('。 ')"
replacement = "textItem.lines.map((l) => l.hanzi).join('。 ')"

if target in text:
    new_text = text.replace(target, replacement)
    with open('d:/minnese/src/components/Coursebook/CoursebookView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Successfully removed speaker name from audio playback text in CoursebookView.tsx!")
else:
    print("Target string not found in CoursebookView.tsx")
