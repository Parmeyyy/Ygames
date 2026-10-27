# Кулак поверх предмета: из каждой hold-<верх>.png (торс, у которого правая рука согнута и кулак
# перед животом) вырезает только кулак — кожу вокруг заданной точки вместе с её контуром — и сохраняет
# картинкой того же размера, что торс (fist-<верх>.png). Игра рисует торс, потом предмет в руке,
# потом кулак, и рукоятка проходит сквозь пальцы (src/ui/Hero.js, hold).
# Запуск: python3 scripts/hands.py — после того как поменялись картинки торсов.
import colorsys
import glob
from collections import deque
from PIL import Image, ImageFilter

FIST = (0.68, 0.64)  # примерно середина кулака, в долях торса
BOX = (0.55, 0.45, 0.8, 0.82)  # дальше кулак не ищется: справа начинается предплечье


def is_skin(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return 0.03 < h < 0.12 and 0.15 < s < 0.55 and v > 0.7


for path in sorted(glob.glob('src/assets/hero/hold-*.png')):
    torso = Image.open(path).convert('RGBA')
    w, h = torso.size
    px = torso.load()
    x0, y0, x1, y1 = (round(BOX[0] * w), round(BOX[1] * h), round(BOX[2] * w), round(BOX[3] * h))
    inside = lambda x, y: x0 <= x < x1 and y0 <= y < y1 and px[x, y][3] > 128 and is_skin(*px[x, y][:3])
    # кожа, связанная с серединой кулака (ближайшая к ней точка кожи — начало)
    cx, cy = round(FIST[0] * w), round(FIST[1] * h)
    start = min(((x, y) for x in range(x0, x1) for y in range(y0, y1) if inside(x, y)),
                key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2)
    mask = Image.new('L', torso.size, 0)
    m = mask.load()
    queue, seen = deque([start]), {start}
    while queue:
        x, y = queue.popleft()
        m[x, y] = 255
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in seen and inside(*n):
                seen.add(n)
                queue.append(n)
    # контур вокруг кожи и щели между пальцами, края мягкие; правый край (предплечье) гаснет плавно
    mask = mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    fade = Image.linear_gradient('L').rotate(90).resize((round(0.05 * w), h))
    edge = Image.new('L', torso.size, 255)
    edge.paste(fade.transpose(Image.FLIP_LEFT_RIGHT), (x1 - fade.width, 0))
    edge.paste(0, (x1, 0, w, h))
    # только там, где у торса что-то нарисовано
    alpha = Image.composite(mask, Image.new('L', torso.size, 0), edge)
    alpha = Image.composite(alpha, Image.new('L', torso.size, 0), torso.getchannel('A'))
    fist = torso.copy()
    fist.putalpha(alpha)
    out = path.replace('hold-', 'fist-')
    fist.save(out, optimize=True)
    box = fist.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()
    print(out, 'кулак', [round(box[0] / w, 3), round(box[1] / h, 3), round(box[2] / w, 3), round(box[3] / h, 3)])
