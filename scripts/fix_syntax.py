with open('src/data/newHsk1BookData.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_next = False
for i in range(len(lines)):
    if skip_next:
        skip_next = False
        continue
    if lines[i].strip() == '{' and i + 1 < len(lines) and lines[i+1].strip() == '{':
        new_lines.append(lines[i])
        skip_next = True
    else:
        new_lines.append(lines[i])

with open('src/data/newHsk1BookData.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Syntax fixed successfully.")
