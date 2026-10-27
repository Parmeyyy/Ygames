# Головы в шапках из листа art/canva/original/parts/hatheads.png (12 голов Валеры в шапках, порядок — HATS).
# Каждая голова совмещается с нашей head-idle по подбородку и челюсти, потом из неё делаются:
#   hathead-<шапка>.png — вся голова в шапке (лицо игра закроет своим);
#   hattop-<шапка>.png  — только шапка над лицом: кладётся поверх лица, чтобы край шапки был сверху;
#   face-<эмоция>.png   — наше лицо с эмоцией овалом с мягким краем (одно на все шапки).
# Все картинки одного размера и лежат одинаково: голова head-idle внутри них со сдвигом PAD (см. Hero.js).
# Запуск: python3 scripts/hatheads.py
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
HATS = ['cap', 'redcap', 'bandana', 'beanie', 'ushanka', 'fedora', 'crown', 'chef', 'paper', 'helmet', 'panama', 'straw']
MOODS = ['idle', 'blink', 'happy', 'sad', 'scared', 'sleep', 'sly', 'surprised']
READY = 'art/canva/ready/parts'
OUT = 'src/assets/hero'
BROW = 66  # край шапки над лицом ищется выше этой строки головы (брови начинаются с 56)

idle = Image.open(f'{READY}/head-idle.png').convert('RGBA')
hw, hh = idle.size
PADX, PADY = 120, 140
CW, CH = hw + 2 * PADX, hh + PADY + 20
ours = np.array(idle)


def heads():
    """Режет лист на 12 голов (по рядам слева направо)."""
    import subprocess
    tmp = 'art/canva/ready/hatheads'
    os.makedirs(tmp, exist_ok=True)
    subprocess.run([sys.executable, 'scripts/items.py', 'art/canva/original/parts/hatheads.png', tmp, '4', '3', '1', *HATS],
                   check=True, stdout=subprocess.DEVNULL)
    return {n: Image.open(f'{tmp}/{n}.png').convert('RGBA') for n in HATS}


def dark(a):
    return (a[..., 3] > 128) & (a[..., :3].sum(-1) < 200)


def align(g):
    """Масштаб и сдвиг, при которых челюсть и подбородок g ложатся на нашу голову."""
    y0 = 135
    oa, od = ours[y0:, :, 3] > 128, dark(ours)[y0:]
    best = None
    for s in np.arange(0.85, 1.02, 0.01):
        G = np.array(g.resize((round(g.width * s), round(g.height * s)), Image.LANCZOS))
        ga, gd = G[..., 3] > 128, dark(G)
        gh, gw = ga.shape
        bottom = np.where(ga.any(1))[0].max()
        for dy in range(-8, 9):
            oy = hh - 1 - bottom + dy
            gy = np.arange(y0, hh) - oy
            if gy.min() < 0 or gy.max() >= gh:
                continue
            for dx in range(-40, 41):
                ox = (hw - gw) // 2 + dx
                gx = np.arange(hw) - ox
                ok = (gx >= 0) & (gx < gw)
                A = np.zeros((len(gy), hw), bool)
                D = np.zeros((len(gy), hw), bool)
                A[:, ok] = ga[np.ix_(gy, gx[ok])]
                D[:, ok] = gd[np.ix_(gy, gx[ok])]
                score = (A & oa).sum() / max(1, (A | oa).sum()) + (D & od).sum() / max(1, (D | od).sum())
                if best is None or score > best[0]:
                    best = (score, s, ox, oy)
    return best[1:]


def hat_top(canvas):
    """Шапка над лицом: в каждом столбце над лицом — сверху до последней тёмной линии выше бровей."""
    a = np.array(canvas).astype(int)
    d = (a[..., 3] > 100) & (a[..., :3].sum(-1) < 260)
    yb = np.full(CW, -1)
    for x in range(CW):
        ys = np.where(d[:PADY + BROW, x])[0]
        if len(ys):
            yb[x] = ys.max()
    # провалы края (швы, отворот) закрываются: максимум, потом минимум по окну
    k = 7
    up = np.array([yb[max(0, x - k):x + k + 1].max() for x in range(CW)])
    yb = np.array([up[max(0, x - k):x + k + 1].min() for x in range(CW)])
    m = np.zeros((CH, CW), np.uint8)
    for x in range(PADX + int(hw * 0.14), PADX + int(hw * 0.86)):
        if yb[x] >= 0:
            m[:yb[x] + 1, x] = 255
    m = np.array(Image.fromarray(m).filter(ImageFilter.GaussianBlur(0.6)))
    top = canvas.copy()
    top.putalpha(Image.fromarray(np.minimum(m, a[..., 3]).astype(np.uint8)))
    return top


def save(image, path):
    image.quantize(256, method=Image.Quantize.FASTOCTREE).save(path, optimize=True)


images = {}
for name, g in heads().items():
    s, ox, oy = align(g)
    g = g.resize((round(g.width * s), round(g.height * s)), Image.LANCZOS)
    canvas = Image.new('RGBA', (CW, CH))
    canvas.alpha_composite(g, (PADX + ox, PADY + oy))
    images[f'hathead-{name}'] = canvas
    images[f'hattop-{name}'] = hat_top(canvas)
    print(name, 'масштаб', round(float(s), 2), 'сдвиг', ox, oy)

# общий обрез: все картинки шапок одного размера
box = None
for key, image in images.items():
    b = image.getbbox()
    box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
for key, image in images.items():
    save(image.crop(box), f'{OUT}/{key}.png')
print('голова внутри картинок шапок со сдвигом', PADX - box[0], PADY - box[1], 'размер', box[2] - box[0], box[3] - box[1])

oval = Image.new('L', (hw, hh), 0)
ImageDraw.Draw(oval).ellipse((hw * 0.13, hh * 0.19, hw * 0.87, hh * 0.86), fill=255)
oval = oval.filter(ImageFilter.GaussianBlur(5))
for mood in MOODS:
    face = Image.open(f'{READY}/head-{mood}.png').convert('RGBA').resize((hw, hh), Image.LANCZOS)
    face.putalpha(Image.fromarray(np.minimum(np.array(oval), np.array(face.getchannel('A')))))
    save(face, f'{OUT}/face-{mood}.png')
