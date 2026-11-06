# -*- coding: utf-8 -*-
with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '<div className="absolute inset-0 bg-gradient-to-t from-black/65' in line:
        skip = True
        continue
    if skip:
        if '</div>' in line:
            skip = False
        continue
    new_lines.append(line)

with open(r'd:\minnese\src\components\Coursebook\CoursebookView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Removed overlay successfully, total lines:', len(new_lines))
