import { COLORS } from '../config.js';

// Одежда Валеры: как выглядит верх и низ. Используется и на самом Валере (src/ui/Hero.js),
// и в карточках гардероба. Список вещей с ценами — в src/items.js.
//
// Верх:  color — цвет; sleeves — 0 без рукавов, 1 короткие, 2 длинные;
//        узор: stripes (полоски), dots (цветы), zigzag (орнамент), tie (пиджак с галстуком),
//        bow (смокинг с бабочкой), emblem (значок на груди), buttons (пуговицы)
// Низ:   color — цвет; stripe — лампасы; short — шорты; spots — пятна камуфляжа; seam — шов;
//        vstripes — вертикальные полоски (пижама)
export const TOPS = {
  tank: { color: COLORS.white, sleeves: 0 },
  telnyashka: { color: COLORS.white, sleeves: 2, stripes: 0x2e4a8f },
  tshirt: { color: 0xe74c3c, sleeves: 1 },
  hawaii: { color: 0xff8c42, sleeves: 1, dots: 0xfff2a8 },
  sweater: { color: 0x3f8f5a, sleeves: 2, zigzag: COLORS.white },
  jacket: { color: 0x3a3f55, sleeves: 2, tie: true },
  tuxedo: { color: 0x1f1f29, sleeves: 2, bow: true },
  superhero: { color: 0x2f6fde, sleeves: 1, emblem: 0xffc93c },
  // пальто из уровня «Спрячь Валеру»: в гардеробе его нет
  coat: { color: 0x8a5a2b, sleeves: 2, buttons: 0x3a2a1a },
};

export const PANTS = {
  track: { color: 0x2e4a8f, stripe: COLORS.white },
  shorts: { color: 0x4aa3df, short: true },
  jeans: { color: 0x4a6fa5, seam: 0xf2d16b },
  camo: { color: 0x6b7a45, spots: 0x4a5630 },
  pajama: { color: 0xbfe3ff, vstripes: 0x4aa3df },
};

const INK = COLORS.outline;

// Значок вещи для карточки гардероба: (x, y) — центр, size — ширина
export function addClothIcon(scene, id, x, y, size) {
  const s = size;
  const g = scene.add.graphics({ x, y });
  g.lineStyle(Math.max(2, s * 0.03), INK, 1);

  const top = TOPS[id];
  if (top) {
    const sleeve = top.sleeves === 2 ? 0.34 : 0.14;
    if (top.sleeves) {
      for (const side of [-1, 1]) {
        const points = [
          [side * 0.26, -0.36],
          [side * 0.5, -0.24],
          [side * 0.44, -0.24 + sleeve],
          [side * 0.26, -0.1],
        ].map(([px, py]) => ({ x: px * s, y: py * s }));
        g.fillStyle(top.color, 1).fillPoints(points, true);
        g.strokePoints(points, true);
      }
    }
    g.fillStyle(top.color, 1).fillRoundedRect(-s * 0.28, -s * 0.38, s * 0.56, s * 0.76, s * 0.05);
    g.strokeRoundedRect(-s * 0.28, -s * 0.38, s * 0.56, s * 0.76, s * 0.05);
    if (top.stripes) {
      g.fillStyle(top.stripes, 1);
      for (let row = -0.28; row < 0.34; row += 0.12) g.fillRect(-s * 0.26, row * s, s * 0.52, s * 0.045);
    }
    if (top.dots) {
      g.fillStyle(top.dots, 1);
      for (const [px, py] of [[-0.14, -0.16], [0.12, -0.04], [-0.08, 0.16], [0.14, 0.24]]) g.fillCircle(px * s, py * s, s * 0.05);
    }
    if (top.zigzag) {
      g.lineStyle(Math.max(2, s * 0.035), top.zigzag, 1);
      g.strokePoints([-0.24, -0.12, 0, 0.12, 0.24].map((px, i) => ({ x: px * s, y: (i % 2 ? -0.06 : 0.04) * s })));
    }
    if (top.tie || top.bow) g.fillStyle(COLORS.white, 1).fillTriangle(-s * 0.12, -s * 0.38, s * 0.12, -s * 0.38, 0, -s * 0.12);
    if (top.tie) g.fillStyle(0xd63d3d, 1).fillTriangle(-s * 0.04, -s * 0.34, s * 0.04, -s * 0.34, 0, s * 0.02);
    if (top.bow) {
      g.fillStyle(INK, 1);
      g.fillTriangle(0, -s * 0.3, -s * 0.09, -s * 0.36, -s * 0.09, -s * 0.24);
      g.fillTriangle(0, -s * 0.3, s * 0.09, -s * 0.36, s * 0.09, -s * 0.24);
    }
    if (top.emblem) {
      g.fillStyle(top.emblem, 1).fillCircle(0, -s * 0.02, s * 0.13);
      g.strokeCircle(0, -s * 0.02, s * 0.13);
      g.fillStyle(top.color, 1).fillTriangle(-s * 0.06, s * 0.02, s * 0.06, s * 0.02, 0, -s * 0.1);
    }
    return g;
  }

  const pants = PANTS[id];
  if (pants) {
    const length = pants.short ? 0.3 : 0.74;
    for (const side of [-1, 1]) {
      g.fillStyle(pants.color, 1).fillRoundedRect(side * s * 0.14 - s * 0.13, -s * 0.36, s * 0.26, s * length, s * 0.04);
      g.strokeRoundedRect(side * s * 0.14 - s * 0.13, -s * 0.36, s * 0.26, s * length, s * 0.04);
      if (pants.stripe) g.fillStyle(pants.stripe, 1).fillRect(side * s * 0.24 - s * 0.012, -s * 0.3, s * 0.024, s * (length - 0.1));
      if (pants.seam) g.fillStyle(pants.seam, 1).fillRect(side * s * 0.14 - s * 0.006, -s * 0.2, s * 0.012, s * (length - 0.22));
      if (pants.vstripes) {
        g.fillStyle(pants.vstripes, 1);
        for (const dx of [-0.08, 0, 0.08]) g.fillRect(side * s * 0.14 + dx * s - s * 0.01, -s * 0.34, s * 0.02, s * (length - 0.04));
      }
      if (pants.spots) {
        g.fillStyle(pants.spots, 1);
        g.fillCircle(side * s * 0.12, -s * 0.16, s * 0.05).fillCircle(side * s * 0.18, s * 0.08, s * 0.045).fillCircle(side * s * 0.1, s * 0.26, s * 0.04);
      }
    }
    g.fillStyle(pants.color, 1).fillRect(-s * 0.26, -s * 0.38, s * 0.52, s * 0.12);
    g.strokeRect(-s * 0.26, -s * 0.38, s * 0.52, s * 0.12);
    return g;
  }

  g.destroy();
  return null;
}
