# Убирает однотонный фон вокруг предмета (заливкой от углов), обрезает по краям и уменьшает.
# Запуск: cutout.py <вход.png> <выход.png> [макс. сторона] [x,y ...]
import sys
from PIL import Image, ImageDraw, ImageFilter


def cut(image, extra=()):
    """Картинка без фона (RGBA), обрезанная по предмету.
    extra — дополнительные точки заливки в долях ширины и высоты: для «дырок» внутри предмета."""
    image = image.convert('RGB')
    w, h = image.size
    marker = (255, 0, 255)
    work = image.copy()
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
    seeds += [(int(x * w), int(y * h)) for x, y in extra]
    for corner in seeds:
        if work.getpixel(corner) != marker:
            ImageDraw.floodfill(work, corner, marker, thresh=42)
    mask = Image.frombytes('L', (w, h), bytes(0 if p == marker else 255 for p in work.get_flattened_data()))
    # край чуть поджат и сглажен, чтобы не осталось светлой каймы
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = image.convert('RGBA')
    out.putalpha(mask)
    box = mask.point(lambda v: 255 if v > 16 else 0).getbbox()
    return out.crop(box)


def fit(image, limit):
    scale = min(1, limit / max(image.size))
    return image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 640
    extra = [tuple(float(v) for v in arg.split(',')) for arg in sys.argv[4:]]
    out = fit(cut(Image.open(src), extra), limit)
    out.save(dst)
    print(dst, out.size)
