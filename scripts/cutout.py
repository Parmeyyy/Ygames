# Убирает однотонный фон вокруг предмета (заливкой от углов), обрезает по краям и уменьшает.
# Запуск: cutout.py <вход.png> <выход.png> [макс. сторона]
import sys
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 640
# дополнительные точки заливки в долях ширины и высоты: x,y x,y — для «дырок» внутри предмета
extra = [tuple(float(v) for v in arg.split(',')) for arg in sys.argv[4:]]
image = Image.open(src).convert('RGB')
w, h = image.size
marker = (255, 0, 255)
work = image.copy()
seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
seeds += [(int(x * w), int(y * h)) for x, y in extra]
for corner in seeds:
    if work.getpixel(corner) != marker:
        ImageDraw.floodfill(work, corner, marker, thresh=42)
mask = Image.new('L', (w, h), 255)
mask = Image.eval(Image.frombytes('L', (w, h), bytes(0 if p == marker else 255 for p in work.getdata())), lambda v: v)
# край чуть поджат и сглажен, чтобы не осталось светлой каймы
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
out = image.convert('RGBA')
out.putalpha(mask)
box = mask.point(lambda v: 255 if v > 16 else 0).getbbox()
out = out.crop(box)
scale = min(1, limit / max(out.size))
out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
out.save(dst)
print(dst, out.size)
