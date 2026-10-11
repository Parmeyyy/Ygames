import { COLORS } from '../config.js';

// Картинки-заглушки для объектов уровней, нарисованные фигурами. У каждой своя функция draw<Имя>(g, s):
//   g — Graphics, начало координат — центр картинки
//   s — ширина картинки в пикселях; высота = s × aspect
// Чтобы заменить картинку на PNG, достаточно в addShape вернуть для неё scene.add.image(...).

const INK = COLORS.outline;
const line = (g, s) => g.lineStyle(Math.max(2, s * 0.025), INK, 1);

function drawSun(g, s) {
  g.lineStyle(Math.max(3, s * 0.05), COLORS.coin, 1);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    g.lineBetween(Math.cos(angle) * s * 0.37, Math.sin(angle) * s * 0.37, Math.cos(angle) * s * 0.5, Math.sin(angle) * s * 0.5);
  }
  line(g, s);
  g.fillStyle(COLORS.coin, 1).fillCircle(0, 0, s * 0.3);
  g.strokeCircle(0, 0, s * 0.3);
}

function drawCloud(g, s) {
  const puffs = [
    [-s * 0.25, s * 0.05, s * 0.2],
    [0, -s * 0.08, s * 0.26],
    [s * 0.25, s * 0.05, s * 0.2],
  ];
  line(g, s);
  // сначала все контуры, потом заливки — так внутри облака не остаётся линий
  for (const [x, y, r] of puffs) g.strokeCircle(x, y, r);
  g.strokeRoundedRect(-s * 0.42, 0, s * 0.84, s * 0.27, s * 0.13);
  g.fillStyle(COLORS.white, 1);
  for (const [x, y, r] of puffs) g.fillCircle(x, y, r);
  g.fillRoundedRect(-s * 0.42, 0, s * 0.84, s * 0.27, s * 0.13);
}

function drawNest(g, s) {
  line(g, s);
  g.fillStyle(0xa9713a, 1).slice(0, -s * 0.12, s * 0.5, 0, Math.PI).fillPath().strokePath();
  g.lineStyle(Math.max(2, s * 0.02), 0x6e4520, 1);
  for (const x of [-0.3, -0.1, 0.1, 0.3]) g.lineBetween(x * s, -s * 0.05, (x + 0.08) * s, s * 0.2);
}

function drawElephant(g, s) {
  const grey = 0x9aa0a6;
  g.fillStyle(grey, 1);
  g.fillRect(-s * 0.12, s * 0.1, s * 0.11, s * 0.28);
  g.fillRect(s * 0.2, s * 0.1, s * 0.11, s * 0.28);
  g.fillEllipse(s * 0.06, 0, s * 0.62, s * 0.44);
  g.fillCircle(-s * 0.28, -s * 0.1, s * 0.17);
  g.fillRect(-s * 0.46, -s * 0.1, s * 0.08, s * 0.4);
  g.fillStyle(0x7d848b, 1).fillEllipse(-s * 0.17, -s * 0.1, s * 0.14, s * 0.24);
  g.fillStyle(INK, 1).fillCircle(-s * 0.33, -s * 0.14, Math.max(1, s * 0.025));
}

function drawFeather(g, s) {
  line(g, s);
  g.fillStyle(0xcfe3f5, 1).fillEllipse(0, 0, s * 0.3, s * 0.9);
  g.strokeEllipse(0, 0, s * 0.3, s * 0.9);
  g.lineBetween(0, -s * 0.4, 0, s * 0.5);
  g.setAngle(30);
}

function drawLeaf(g, s) {
  line(g, s);
  g.fillStyle(COLORS.success, 1).fillEllipse(0, 0, s * 0.46, s * 0.9);
  g.strokeEllipse(0, 0, s * 0.46, s * 0.9);
  g.lineBetween(0, -s * 0.35, 0, s * 0.5);
  g.setAngle(-25);
}

function drawBalloon(g, s) {
  line(g, s);
  g.lineBetween(0, s * 0.28, 0, s * 0.5);
  g.fillStyle(0xe74c3c, 1).fillEllipse(0, -s * 0.1, s * 0.6, s * 0.72);
  g.strokeEllipse(0, -s * 0.1, s * 0.6, s * 0.72);
  g.fillTriangle(0, s * 0.25, -s * 0.05, s * 0.32, s * 0.05, s * 0.32);
}

function drawSwitch(g, s) {
  line(g, s);
  g.fillStyle(COLORS.white, 1).fillRoundedRect(-s * 0.4, -s * 0.6, s * 0.8, s * 1.2, s * 0.12);
  g.strokeRoundedRect(-s * 0.4, -s * 0.6, s * 0.8, s * 1.2, s * 0.12);
  g.fillStyle(COLORS.secondary, 1).fillRoundedRect(-s * 0.13, -s * 0.3, s * 0.26, s * 0.6, s * 0.06);
}

// Светофор: g.setLight(true) — зелёный, g.setLight(false) — красный
function drawLight(g, s) {
  g.setLight = (green) => {
    g.clear();
    g.fillStyle(INK, 1).fillRoundedRect(-s * 0.28, -s * 0.5, s * 0.56, s, s * 0.14);
    g.fillStyle(green ? 0x5a2f2f : 0xff3b30, 1).fillCircle(0, -s * 0.23, s * 0.18);
    g.fillStyle(green ? 0x34d058 : 0x2f5a3a, 1).fillCircle(0, s * 0.23, s * 0.18);
  };
  g.setLight(false);
}

const SHAPES = {
  sun: { draw: drawSun, aspect: 1 },
  cloud: { draw: drawCloud, aspect: 0.7 },
  nest: { draw: drawNest, aspect: 0.6 },
  elephant: { draw: drawElephant, aspect: 0.8 },
  feather: { draw: drawFeather, aspect: 1 },
  leaf: { draw: drawLeaf, aspect: 1 },
  balloon: { draw: drawBalloon, aspect: 1 },
  switch: { draw: drawSwitch, aspect: 1.2 },
  light: { draw: drawLight, aspect: 1 },
};

export const hasShape = (name) => name in SHAPES;

// Создаёт картинку шириной size с центром в (0, 0). Возвращает { object, w, h }.
export function addShape(scene, name, size) {
  const shape = SHAPES[name];
  const g = scene.add.graphics();
  shape.draw(g, size);
  return { object: g, w: size, h: size * shape.aspect };
}
