# Режет лист с предметами (сетка cols x rows) на отдельные картинки без фона.
# В отличие от sheet.py не режет по клеткам: находит сами предметы, делит их на ряды и в ряду
# считает слева направо. Так вещь, вылезающая за свою клетку (грабли, удочка), не обрежется,
# а ряд, где генератор поставил вещи неровно или пропустил одну, всё равно разберётся.
# Все предметы уменьшаются в одном масштабе.
# Запуск: items.py <лист.png> <папка> <cols> <rows> <масштаб> <имя1> <имя2> ...
# Имя "-" — пропустить клетку.
import os
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

STEP = 4  # во сколько раз уменьшается маска при поиске предметов


def background_mask(image):
    """Маска предметов (L): 0 — фон, залитый от краёв листа, 255 — предмет."""
    w, h = image.size
    marker = (255, 0, 255)
    work = image.copy()
    seeds = [(x, 0) for x in range(0, w, 40)] + [(x, h - 1) for x in range(0, w, 40)]
    seeds += [(0, y) for y in range(0, h, 40)] + [(w - 1, y) for y in range(0, h, 40)]
    for seed in seeds:
        if work.getpixel(seed) != marker:
            ImageDraw.floodfill(work, seed, marker, thresh=42)
    return Image.frombytes('L', (w, h), bytes(0 if p == marker else 255 for p in work.get_flattened_data()))


def components(mask):
    """Связные куски уменьшенной маски: список множеств клеток (x, y)."""
    small = mask.resize((mask.width // STEP, mask.height // STEP), Image.BOX).point(lambda v: 255 if v > 40 else 0)
    w, h = small.size
    data = small.load()
    seen = set()
    found = []
    for y in range(h):
        for x in range(w):
            if data[x, y] and (x, y) not in seen:
                part, queue = set(), deque([(x, y)])
                seen.add((x, y))
                while queue:
                    cx, cy = queue.popleft()
                    part.add((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and data[nx, ny] and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            queue.append((nx, ny))
                found.append(part)
    return found


src, out_dir, cols, rows, scale = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
names = sys.argv[6:]
sheet = Image.open(src).convert('RGB')
mask = background_mask(sheet)

def box(parts):
    points = [p for part in parts for p in part]
    xs, ys = [x for x, _ in points], [y for _, y in points]
    return min(xs), min(ys), max(xs), max(ys)


def gap(a, b):
    return max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3], 0)


# крупные куски — предметы; мелкие (капли дождя, брызги, лепестки) — к ближайшему предмету
found = sorted(components(mask), key=len, reverse=True)
big = sorted(len(part) for part in found)[-len([n for n in names if n != '-']):]
limit = big[0] * 0.25 if big else 0
items = [[part] for part in found if len(part) >= limit]
for part in found:
    if len(part) < limit and len(part) >= 4:
        b = box([part])
        nearest = min(items, key=lambda item: gap(box(item), b))
        if gap(box(nearest), b) < 12:
            nearest.append(part)

# ряды: делим по самым большим промежуткам между серединами предметов по высоте
middle = lambda item: ((box(item)[0] + box(item)[2]) / 2, (box(item)[1] + box(item)[3]) / 2)
items.sort(key=lambda item: middle(item)[1])
ys = [middle(item)[1] for item in items]
cuts = sorted(sorted(range(1, len(ys)), key=lambda i: ys[i] - ys[i - 1])[-(rows - 1):]) if rows > 1 else []
cells = {}
for row, (start, end) in enumerate(zip([0] + cuts, cuts + [len(items)])):
    for col, item in enumerate(sorted(items[start:end], key=lambda item: middle(item)[0])):
        cells[row * cols + col] = item

edge = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
for index, name in enumerate(names):
    if name == '-':
        continue
    parts = cells.get(index)
    if not parts:
        print('нет предмета в клетке', index + 1, name)
        continue
    # маска только этого предмета: его куски, увеличенные обратно до размера листа
    own = Image.new('L', (sheet.width // STEP, sheet.height // STEP), 0)
    px = own.load()
    for part in parts:
        for x, y in part:
            px[x, y] = 255
    own = own.filter(ImageFilter.MaxFilter(3)).resize(sheet.size, Image.NEAREST)
    alpha = Image.composite(edge, Image.new('L', sheet.size, 0), own)
    item = sheet.convert('RGBA')
    item.putalpha(alpha)
    item = item.crop(alpha.point(lambda v: 255 if v > 16 else 0).getbbox())
    item = item.resize((round(item.width * scale), round(item.height * scale)), Image.LANCZOS)
    path = os.path.join(out_dir, f'{name}.png')
    item.save(path)
    print(path, item.size)
