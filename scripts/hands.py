# Пальцы правой руки поверх предмета: из каждого torso-<верх>.png вырезает кисть
# (правый нижний угол картинки) и плавно гасит её верх. Игра рисует этот кусок поверх предмета
# в руке, и кажется, что Валера его держит (src/ui/Hero.js, hold).
# Запуск: python3 scripts/hands.py — после того как поменялись картинки торса.
import glob
import os
from PIL import Image

LEFT, TOP = 0.79, 0.86  # где начинается кусок: доли ширины и высоты торса
FADE = (0.87, 0.92)  # между этими долями высоты кисть плавно проявляется

for path in sorted(glob.glob('src/assets/hero/torso-*.png')):
    torso = Image.open(path).convert('RGBA')
    w, h = torso.size
    hand = torso.crop((round(w * LEFT), round(h * TOP), w, h))
    alpha = hand.getchannel('A')
    top = round(h * TOP)
    ramp = [min(1, max(0, ((top + y) / h - FADE[0]) / (FADE[1] - FADE[0]))) for y in range(hand.height)]
    alpha = Image.frombytes('L', hand.size, bytes(
        round(a * ramp[i // hand.width]) for i, a in enumerate(alpha.tobytes())))
    hand.putalpha(alpha)
    out = path.replace('torso-', 'hand-')
    hand.save(out)
    print(out, hand.size)
