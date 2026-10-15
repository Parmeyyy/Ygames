# Режет лист с частями персонажа (сетка cols x rows) на отдельные картинки без фона.
# Все части уменьшаются в одном масштабе, чтобы при сборке совпадали размеры.
# Запуск: sheet.py <лист.png> <папка> <cols> <rows> <масштаб> <имя1> <имя2> ...
# Имя "-" — пропустить ячейку.
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from cutout import cut  # noqa: E402

src, out_dir, cols, rows, scale = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
names = sys.argv[6:]
sheet = Image.open(src).convert('RGB')
cw, ch = sheet.width / cols, sheet.height / rows
for index, name in enumerate(names):
    if name == '-':
        continue
    col, row = index % cols, index // cols
    cell = sheet.crop((round(col * cw), round(row * ch), round((col + 1) * cw), round((row + 1) * ch)))
    part = cut(cell)
    part = part.resize((round(part.width * scale), round(part.height * scale)), Image.LANCZOS)
    path = os.path.join(out_dir, f'{name}.png')
    part.save(path)
    print(path, part.size)
