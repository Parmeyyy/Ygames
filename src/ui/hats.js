import { COLORS } from '../config.js';

// Шапки-заглушки, нарисованные фигурами. У каждой шапки своя функция draw<Имя>(g, s):
//   g — Graphics, начало координат — макушка яйца (ось y направлена вниз)
//   s — ширина яйца в пикселях, все размеры считаются от неё
// Чтобы заменить шапку на PNG, достаточно в addHat вернуть для неё scene.add.image(...).

const INK = COLORS.outline;
const line = (g, s) => g.lineStyle(Math.max(2, s * 0.02), INK, 1);

function drawCap(g, s) {
  line(g, s);
  g.fillStyle(0xc0392b, 1).fillEllipse(s * 0.3, s * 0.13, s * 0.5, s * 0.1);
  g.strokeEllipse(s * 0.3, s * 0.13, s * 0.5, s * 0.1);
  g.fillStyle(0xe74c3c, 1).slice(0, s * 0.15, s * 0.31, Math.PI, 0).fillPath().strokePath();
  g.fillStyle(COLORS.white, 1).fillCircle(0, -s * 0.16, s * 0.035);
}

function drawBow(g, s) {
  line(g, s);
  g.fillStyle(0xff7eb6, 1);
  g.fillTriangle(0, s * 0.02, -s * 0.3, -s * 0.14, -s * 0.3, s * 0.18);
  g.strokeTriangle(0, s * 0.02, -s * 0.3, -s * 0.14, -s * 0.3, s * 0.18);
  g.fillTriangle(0, s * 0.02, s * 0.3, -s * 0.14, s * 0.3, s * 0.18);
  g.strokeTriangle(0, s * 0.02, s * 0.3, -s * 0.14, s * 0.3, s * 0.18);
  g.fillStyle(0xe84393, 1).fillCircle(0, s * 0.02, s * 0.07);
  g.strokeCircle(0, s * 0.02, s * 0.07);
}

function drawBeanie(g, s) {
  line(g, s);
  g.fillStyle(0x3498db, 1).slice(0, s * 0.12, s * 0.32, Math.PI, 0).fillPath().strokePath();
  g.fillStyle(COLORS.white, 1).fillRoundedRect(-s * 0.35, s * 0.07, s * 0.7, s * 0.11, s * 0.05);
  g.strokeRoundedRect(-s * 0.35, s * 0.07, s * 0.7, s * 0.11, s * 0.05);
  g.fillCircle(0, -s * 0.24, s * 0.08);
  g.strokeCircle(0, -s * 0.24, s * 0.08);
}

function drawTophat(g, s) {
  g.fillStyle(INK, 1);
  g.fillRect(-s * 0.26, -s * 0.38, s * 0.52, s * 0.48);
  g.fillRoundedRect(-s * 0.42, s * 0.07, s * 0.84, s * 0.08, s * 0.04);
  g.fillStyle(0xe74c3c, 1).fillRect(-s * 0.26, -s * 0.05, s * 0.52, s * 0.09);
}

function drawWizard(g, s) {
  line(g, s);
  g.fillStyle(0x7b5ea7, 1);
  g.fillTriangle(-s * 0.3, s * 0.13, s * 0.3, s * 0.13, s * 0.06, -s * 0.55);
  g.strokeTriangle(-s * 0.3, s * 0.13, s * 0.3, s * 0.13, s * 0.06, -s * 0.55);
  g.fillEllipse(0, s * 0.13, s * 0.88, s * 0.12);
  g.strokeEllipse(0, s * 0.13, s * 0.88, s * 0.12);
  g.fillStyle(COLORS.coin, 1);
  g.fillCircle(-s * 0.04, -s * 0.08, s * 0.045);
  g.fillCircle(s * 0.09, -s * 0.24, s * 0.03);
}

function drawCrown(g, s) {
  const points = [
    [-0.3, 0.14],
    [-0.36, -0.2],
    [-0.16, -0.03],
    [0, -0.28],
    [0.16, -0.03],
    [0.36, -0.2],
    [0.3, 0.14],
  ].map(([x, y]) => ({ x: x * s, y: y * s }));
  line(g, s);
  g.fillStyle(COLORS.coin, 1).fillPoints(points, true);
  g.strokePoints(points, true);
  g.fillStyle(0xe74c3c, 1).fillCircle(0, s * 0.03, s * 0.045);
  g.fillStyle(0x3498db, 1).fillCircle(-s * 0.17, s * 0.05, s * 0.035).fillCircle(s * 0.17, s * 0.05, s * 0.035);
}

function drawChef(g, s) {
  const puffs = [
    [-s * 0.2, -s * 0.2],
    [s * 0.2, -s * 0.2],
    [0, -s * 0.3],
  ];
  line(g, s);
  // сначала все контуры, потом заливки — так внутри колпака не остаётся линий
  for (const [x, y] of puffs) g.strokeCircle(x, y, s * 0.18);
  g.strokeRect(-s * 0.26, -s * 0.12, s * 0.52, s * 0.26);
  g.fillStyle(COLORS.white, 1);
  for (const [x, y] of puffs) g.fillCircle(x, y, s * 0.18);
  g.fillRect(-s * 0.26, -s * 0.12, s * 0.52, s * 0.26);
  g.lineBetween(-s * 0.26, s * 0.02, s * 0.26, s * 0.02);
}

function drawFlower(g, s) {
  const cx = s * 0.12;
  const cy = -s * 0.14;
  g.lineStyle(Math.max(3, s * 0.035), COLORS.success, 1).lineBetween(cx, cy, s * 0.04, s * 0.08);
  g.fillStyle(0xff7eb6, 1);
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    g.fillCircle(cx + Math.cos(angle) * s * 0.13, cy + Math.sin(angle) * s * 0.13, s * 0.1);
  }
  g.fillStyle(COLORS.coin, 1).fillCircle(cx, cy, s * 0.08);
}

const DRAWERS = {
  cap: drawCap,
  bow: drawBow,
  beanie: drawBeanie,
  tophat: drawTophat,
  wizard: drawWizard,
  crown: drawCrown,
  chef: drawChef,
  flower: drawFlower,
};

// Создаёт шапку: (x, y) — где у яйца макушка, eggWidth — ширина яйца. Для неизвестного id вернёт null.
export function addHat(scene, id, x, y, eggWidth) {
  const draw = DRAWERS[id];
  if (!draw) return null;
  const g = scene.add.graphics({ x, y });
  draw(g, eggWidth);
  return g;
}
