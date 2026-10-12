import { COLORS } from '../config.js';

// Картинки-заглушки для объектов уровней, нарисованные фигурами. У каждой своя функция draw<Имя>(g, s):
//   g — Graphics, начало координат — центр картинки
//   s — ширина картинки в пикселях; высота = s × aspect
// Чтобы заменить картинку на PNG, достаточно в addShape вернуть для неё scene.add.image(...).

const INK = COLORS.outline;
const line = (g, s) => g.lineStyle(Math.max(2, s * 0.025), INK, 1);
// прямоугольник со скруглением и обводкой, координаты в долях s
const box = (g, s, color, x, y, w, h, r = 0.04) => {
  g.fillStyle(color, 1).fillRoundedRect(x * s, y * s, w * s, h * s, r * s);
  g.strokeRoundedRect(x * s, y * s, w * s, h * s, r * s);
};
const disc = (g, s, color, x, y, r) => {
  g.fillStyle(color, 1).fillCircle(x * s, y * s, r * s);
  g.strokeCircle(x * s, y * s, r * s);
};

// ——— природа и погода ———

function drawSun(g, s) {
  g.lineStyle(Math.max(3, s * 0.05), COLORS.coin, 1);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    g.lineBetween(Math.cos(angle) * s * 0.37, Math.sin(angle) * s * 0.37, Math.cos(angle) * s * 0.5, Math.sin(angle) * s * 0.5);
  }
  line(g, s);
  disc(g, s, COLORS.coin, 0, 0, 0.3);
}

// Облако: цвет и y, на который оно сдвинуто (дождевая туча выше, под ней дождь)
function cloudAt(g, s, color, dy) {
  const puffs = [
    [-0.25, 0.05 + dy, 0.2],
    [0, -0.08 + dy, 0.26],
    [0.25, 0.05 + dy, 0.2],
  ];
  line(g, s);
  // сначала все контуры, потом заливки — так внутри облака не остаётся линий
  for (const [x, y, r] of puffs) g.strokeCircle(x * s, y * s, r * s);
  g.strokeRoundedRect(-s * 0.42, dy * s, s * 0.84, s * 0.27, s * 0.13);
  g.fillStyle(color, 1);
  for (const [x, y, r] of puffs) g.fillCircle(x * s, y * s, r * s);
  g.fillRoundedRect(-s * 0.42, dy * s, s * 0.84, s * 0.27, s * 0.13);
}

function drawCloud(g, s) {
  cloudAt(g, s, COLORS.white, 0);
}

function drawRaincloud(g, s) {
  g.lineStyle(Math.max(3, s * 0.02), 0x4aa3df, 1);
  for (let i = 0; i < 6; i += 1) {
    const x = (-0.32 + i * 0.13) * s;
    for (const y of [0.12, 0.32]) g.lineBetween(x, y * s, x - s * 0.04, (y + 0.12) * s);
  }
  cloudAt(g, s, 0x9aa5b1, -0.3);
}

function drawBush(g, s) {
  const puffs = [
    [-0.28, 0.08, 0.22],
    [0, -0.06, 0.3],
    [0.28, 0.08, 0.22],
  ];
  line(g, s);
  for (const [x, y, r] of puffs) g.strokeCircle(x * s, y * s, r * s);
  g.strokeRoundedRect(-s * 0.46, s * 0.05, s * 0.92, s * 0.28, s * 0.12);
  g.fillStyle(COLORS.success, 1);
  for (const [x, y, r] of puffs) g.fillCircle(x * s, y * s, r * s);
  g.fillRoundedRect(-s * 0.46, s * 0.05, s * 0.92, s * 0.28, s * 0.12);
  g.fillStyle(0x4c9644, 1).fillCircle(-s * 0.1, s * 0.02, s * 0.05).fillCircle(s * 0.16, s * 0.12, s * 0.04);
}

function drawTree(g, s) {
  line(g, s);
  box(g, s, 0x8a5a2b, -0.06, 0.1, 0.12, 0.4, 0.02);
  disc(g, s, COLORS.success, 0, -0.12, 0.3);
}

function drawBalloon(g, s) {
  line(g, s);
  g.lineBetween(0, s * 0.28, 0, s * 0.5);
  g.fillStyle(0xe74c3c, 1).fillEllipse(0, -s * 0.1, s * 0.6, s * 0.72);
  g.strokeEllipse(0, -s * 0.1, s * 0.6, s * 0.72);
  g.fillTriangle(0, s * 0.25, -s * 0.05, s * 0.32, s * 0.05, s * 0.32);
}

// ——— дом ———

function drawAlarm(g, s) {
  line(g, s);
  disc(g, s, 0xe74c3c, -0.22, -0.3, 0.11);
  disc(g, s, 0xe74c3c, 0.22, -0.3, 0.11);
  g.lineBetween(-s * 0.2, s * 0.3, -s * 0.28, s * 0.42);
  g.lineBetween(s * 0.2, s * 0.3, s * 0.28, s * 0.42);
  disc(g, s, 0xe74c3c, 0, 0.02, 0.34);
  disc(g, s, COLORS.white, 0, 0.02, 0.26);
  g.lineBetween(0, s * 0.02, 0, -s * 0.16);
  g.lineBetween(0, s * 0.02, s * 0.12, s * 0.02);
}

function drawWindow(g, s) {
  line(g, s);
  box(g, s, 0x8a5a2b, -0.5, -0.5, 1, 1, 0.03);
  box(g, s, 0xbfe3ff, -0.43, -0.43, 0.86, 0.86, 0.01);
  disc(g, s, COLORS.coin, 0.12, -0.1, 0.2);
  g.lineBetween(0, -s * 0.43, 0, s * 0.43);
  g.lineBetween(-s * 0.43, 0, s * 0.43, 0);
}

function drawCurtain(g, s) {
  line(g, s);
  box(g, s, 0x9b6bb3, -0.5, -0.55, 1, 1.1, 0.03);
  g.lineStyle(Math.max(2, s * 0.012), 0x7b4f93, 1);
  for (let x = -0.36; x < 0.4; x += 0.18) g.lineBetween(x * s, -s * 0.5, x * s, s * 0.5);
  g.fillStyle(0x6e4520, 1).fillRect(-s * 0.54, -s * 0.6, s * 1.08, s * 0.06);
}

// Спящий кот
function drawCat(g, s) {
  const fur = 0xf0a04b;
  line(g, s);
  g.fillStyle(fur, 1).fillEllipse(s * 0.05, s * 0.05, s * 0.8, s * 0.4);
  g.strokeEllipse(s * 0.05, s * 0.05, s * 0.8, s * 0.4);
  g.fillTriangle(-s * 0.42, -s * 0.12, -s * 0.36, -s * 0.28, -s * 0.28, -s * 0.14);
  g.fillTriangle(-s * 0.26, -s * 0.14, -s * 0.2, -s * 0.28, -s * 0.14, -s * 0.12);
  disc(g, s, fur, -0.28, 0, 0.17);
  g.beginPath().arc(-s * 0.34, 0, s * 0.03, 0.1 * Math.PI, 0.9 * Math.PI).strokePath();
  g.beginPath().arc(-s * 0.22, 0, s * 0.03, 0.1 * Math.PI, 0.9 * Math.PI).strokePath();
  g.fillStyle(0xd17f2c, 1).fillEllipse(s * 0.3, s * 0.2, s * 0.34, s * 0.09);
}

function drawSlipper(g, s) {
  line(g, s);
  g.fillStyle(0x8a5a2b, 1).fillEllipse(0, 0, s * 0.96, s * 0.4);
  g.strokeEllipse(0, 0, s * 0.96, s * 0.4);
  g.fillStyle(0xc0392b, 1).fillEllipse(s * 0.18, -s * 0.02, s * 0.5, s * 0.36);
  g.strokeEllipse(s * 0.18, -s * 0.02, s * 0.5, s * 0.36);
}

function drawSock(g, s) {
  line(g, s);
  box(g, s, COLORS.white, -0.22, -0.48, 0.3, 0.7, 0.06);
  box(g, s, COLORS.white, -0.22, 0.18, 0.62, 0.28, 0.12);
  g.fillStyle(COLORS.white, 1).fillRect(-s * 0.2, s * 0.1, s * 0.26, s * 0.14);
  g.fillStyle(0xd63d3d, 1).fillRect(-s * 0.22, -s * 0.4, s * 0.3, s * 0.07).fillRect(-s * 0.22, -s * 0.26, s * 0.3, s * 0.07);
}

function drawPillow(g, s) {
  line(g, s);
  box(g, s, COLORS.white, -0.46, -0.26, 0.92, 0.52, 0.14);
  g.lineStyle(Math.max(1, s * 0.012), COLORS.locked, 1);
  g.lineBetween(-s * 0.3, -s * 0.1, s * 0.3, -s * 0.1);
  g.lineBetween(-s * 0.3, s * 0.08, s * 0.3, s * 0.08);
}

function drawRug(g, s) {
  line(g, s);
  box(g, s, 0x7fb069, -0.5, -0.24, 1, 0.48, 0.05);
  g.lineStyle(Math.max(2, s * 0.015), 0xf2d16b, 1).strokeRoundedRect(-s * 0.42, -s * 0.16, s * 0.84, s * 0.32, s * 0.03);
}

function drawNightstand(g, s) {
  line(g, s);
  box(g, s, 0xa9713a, -0.42, -0.45, 0.84, 0.82, 0.03);
  box(g, s, 0xc48a4f, -0.34, -0.36, 0.68, 0.28, 0.02);
  box(g, s, 0xc48a4f, -0.34, 0, 0.68, 0.28, 0.02);
  g.fillStyle(INK, 1).fillCircle(0, -s * 0.22, s * 0.03).fillCircle(0, s * 0.14, s * 0.03);
  g.fillStyle(0x6e4520, 1).fillRect(-s * 0.36, s * 0.37, s * 0.08, s * 0.1).fillRect(s * 0.28, s * 0.37, s * 0.08, s * 0.1);
}

function drawDoor(g, s) {
  line(g, s);
  box(g, s, 0xa9713a, -0.5, -1, 1, 2, 0.04);
  box(g, s, 0xc48a4f, -0.34, -0.82, 0.68, 0.7, 0.03);
  box(g, s, 0xc48a4f, -0.34, 0.06, 0.68, 0.7, 0.03);
  disc(g, s, COLORS.coin, 0.34, 0, 0.06);
}

function drawShirt(g, s) {
  const blue = 0x8ec5ff;
  line(g, s);
  g.fillStyle(blue, 1);
  g.fillTriangle(-s * 0.3, -s * 0.42, -s * 0.5, -s * 0.2, -s * 0.3, -s * 0.1);
  g.strokeTriangle(-s * 0.3, -s * 0.42, -s * 0.5, -s * 0.2, -s * 0.3, -s * 0.1);
  g.fillTriangle(s * 0.3, -s * 0.42, s * 0.5, -s * 0.2, s * 0.3, -s * 0.1);
  g.strokeTriangle(s * 0.3, -s * 0.42, s * 0.5, -s * 0.2, s * 0.3, -s * 0.1);
  box(g, s, blue, -0.3, -0.44, 0.6, 0.9, 0.04);
  g.fillStyle(COLORS.white, 1).fillTriangle(-s * 0.1, -s * 0.44, s * 0.1, -s * 0.44, 0, -s * 0.3);
  g.fillStyle(COLORS.white, 1);
  for (const y of [-0.16, 0, 0.16, 0.32]) g.fillCircle(0, y * s, s * 0.018);
}

// Складки на рубашке: рисуются отдельным слоем, который можно стереть
function drawWrinkles(g, s) {
  g.lineStyle(Math.max(3, s * 0.03), 0x3f6fa8, 1);
  for (const [x, y] of [[-0.3, -0.3], [0.05, -0.34], [-0.2, -0.02], [0.12, 0.02], [-0.32, 0.26], [0.02, 0.3]]) {
    g.strokePoints([0, 0.08, 0.16, 0.24, 0.32].map((dx, i) => ({ x: (x + dx) * s, y: (y + (i % 2 ? 0.07 : 0)) * s })));
  }
}

function drawIron(g, s) {
  line(g, s);
  const sole = [[-0.48, 0.3], [0.48, 0.3], [0.3, -0.05], [-0.2, -0.05]].map(([x, y]) => ({ x: x * s, y: y * s }));
  g.fillStyle(0x9aa5b1, 1).fillPoints(sole, true);
  g.strokePoints(sole, true);
  g.lineStyle(Math.max(4, s * 0.07), 0x3f6fa8, 1);
  g.beginPath().arc(0, -s * 0.05, s * 0.2, Math.PI, 0).strokePath();
}

function drawKeys(g, s) {
  g.lineStyle(Math.max(3, s * 0.06), 0x9aa5b1, 1).strokeCircle(-s * 0.2, -s * 0.12, s * 0.16);
  line(g, s);
  for (const [dx, dy] of [[0.1, 0.02], [0.02, 0.16]]) {
    g.fillStyle(COLORS.coin, 1).fillRoundedRect((-0.08 + dx) * s, (-0.02 + dy) * s, s * 0.46, s * 0.09, s * 0.03);
    g.strokeRoundedRect((-0.08 + dx) * s, (-0.02 + dy) * s, s * 0.46, s * 0.09, s * 0.03);
    g.fillRect((0.26 + dx) * s, (0.06 + dy) * s, s * 0.05, s * 0.08);
  }
}

function drawWallet(g, s) {
  line(g, s);
  box(g, s, 0x8a5a2b, -0.46, -0.3, 0.92, 0.6, 0.08);
  g.fillStyle(0x3a2a1a, 1).fillRect(-s * 0.4, -s * 0.22, s * 0.8, s * 0.2);
  disc(g, s, COLORS.coin, 0.36, 0.06, 0.06);
}

// ——— кухня и ванная ———

function drawJar(g, s) {
  line(g, s);
  box(g, s, 0x6e4520, -0.34, -0.5, 0.68, 1.1, 0.08);
  box(g, s, 0xd63d3d, -0.38, -0.65, 0.76, 0.2, 0.05);
  box(g, s, 0xf3efe4, -0.26, -0.2, 0.52, 0.5, 0.03);
  g.fillStyle(0x6e4520, 1).fillEllipse(0, s * 0.05, s * 0.18, s * 0.26);
}

// Кружка: пустая или с кофе
const cup = (full) => (g, s) => {
  line(g, s);
  g.lineStyle(Math.max(4, s * 0.07), INK, 1);
  g.beginPath().arc(s * 0.36, 0, s * 0.14, -0.5 * Math.PI, 0.5 * Math.PI).strokePath();
  line(g, s);
  box(g, s, COLORS.white, -0.4, -0.4, 0.76, 0.84, 0.08);
  g.fillStyle(full ? 0x6e4520 : 0xd9cfc1, 1).fillEllipse(-s * 0.02, -s * 0.36, s * 0.66, s * 0.14);
  g.strokeEllipse(-s * 0.02, -s * 0.36, s * 0.66, s * 0.14);
  if (full) {
    g.lineStyle(Math.max(2, s * 0.02), COLORS.white, 0.9);
    g.beginPath().arc(-s * 0.1, -s * 0.6, s * 0.06, 0.5 * Math.PI, 1.5 * Math.PI).strokePath();
    g.beginPath().arc(s * 0.08, -s * 0.62, s * 0.06, 1.5 * Math.PI, 0.5 * Math.PI).strokePath();
  }
};

function drawTube(g, s) {
  line(g, s);
  box(g, s, COLORS.white, -0.4, -0.2, 0.72, 0.4, 0.06);
  g.fillStyle(0x4aa3df, 1).fillRect(-s * 0.2, -s * 0.2, s * 0.14, s * 0.4);
  box(g, s, 0xd63d3d, 0.32, -0.1, 0.16, 0.2, 0.03);
}

// Зубная щётка: без пасты или с пастой
const brush = (paste) => (g, s) => {
  line(g, s);
  box(g, s, 0x4aa3df, -0.2, -0.04, 0.7, 0.1, 0.04);
  box(g, s, COLORS.white, -0.5, -0.14, 0.32, 0.12, 0.02);
  if (paste) {
    g.fillStyle(0x7fe0c3, 1).fillEllipse(-s * 0.34, -s * 0.18, s * 0.26, s * 0.09);
    g.strokeEllipse(-s * 0.34, -s * 0.18, s * 0.26, s * 0.09);
  }
};

function drawFridge(g, s) {
  line(g, s);
  box(g, s, COLORS.white, -0.5, -0.75, 1, 1.5, 0.06);
  g.lineBetween(-s * 0.5, -s * 0.3, s * 0.5, -s * 0.3);
  g.fillStyle(0x9aa5b1, 1).fillRoundedRect(s * 0.32, -s * 0.62, s * 0.06, s * 0.22, s * 0.02);
  g.fillRoundedRect(s * 0.32, -s * 0.18, s * 0.06, s * 0.4, s * 0.02);
}

function drawPelmeni(g, s) {
  line(g, s);
  box(g, s, 0x4aa3df, -0.48, -0.32, 0.96, 0.64, 0.05);
  box(g, s, COLORS.white, -0.36, -0.2, 0.72, 0.4, 0.03);
  for (const x of [-0.2, 0, 0.2]) disc(g, s, 0xf3e3b5, x, 0, 0.08);
}

function drawSausage(g, s) {
  line(g, s);
  box(g, s, 0xe88a8a, -0.42, -0.16, 0.84, 0.32, 0.16);
  g.lineBetween(-s * 0.42, 0, -s * 0.5, -s * 0.08);
  g.lineBetween(s * 0.42, 0, s * 0.5, s * 0.08);
  g.fillStyle(COLORS.white, 0.6).fillCircle(-s * 0.15, -s * 0.03, s * 0.03).fillCircle(s * 0.1, s * 0.04, s * 0.03);
}

function drawPot(g, s) {
  line(g, s);
  box(g, s, 0x9aa5b1, -0.56, -0.12, 0.14, 0.1, 0.03);
  box(g, s, 0x9aa5b1, 0.42, -0.12, 0.14, 0.1, 0.03);
  box(g, s, 0x9aa5b1, -0.42, -0.26, 0.84, 0.6, 0.05);
  g.fillStyle(0x8ecbff, 1).fillEllipse(0, -s * 0.24, s * 0.8, s * 0.16);
  g.strokeEllipse(0, -s * 0.24, s * 0.8, s * 0.16);
}

function drawStove(g, s) {
  line(g, s);
  box(g, s, COLORS.white, -0.5, -0.4, 1, 0.85, 0.03);
  box(g, s, 0x3a2e39, -0.5, -0.45, 1, 0.12, 0.02);
  box(g, s, 0x3a2e39, -0.36, 0.02, 0.72, 0.32, 0.03);
  for (const x of [-0.1, 0.1, 0.3]) disc(g, s, 0x9aa5b1, x, -0.2, 0.04);
  // ручка нужной конфорки заметнее остальных
  disc(g, s, 0xd63d3d, -0.32, -0.2, 0.07);
}

function drawFlame(g, s) {
  g.fillStyle(0xff7a1a, 1).fillTriangle(-s * 0.4, s * 0.4, s * 0.4, s * 0.4, 0, -s * 0.5);
  g.fillStyle(COLORS.coin, 1).fillTriangle(-s * 0.2, s * 0.4, s * 0.2, s * 0.4, 0, -s * 0.1);
}

// ——— улица ———

function drawBus(g, s) {
  line(g, s);
  box(g, s, COLORS.coin, -0.5, -0.24, 1, 0.42, 0.05);
  for (const x of [-0.42, -0.2, 0.02]) box(g, s, 0xbfe3ff, x, -0.18, 0.18, 0.16, 0.02);
  box(g, s, 0xbfe3ff, 0.26, -0.18, 0.18, 0.3, 0.02);
  disc(g, s, INK, -0.28, 0.2, 0.08);
  disc(g, s, INK, 0.26, 0.2, 0.08);
}

function drawHouse(g, s) {
  line(g, s);
  box(g, s, 0xf3e3b5, -0.36, -0.08, 0.72, 0.52, 0.02);
  g.fillStyle(0xc0392b, 1).fillTriangle(-0.46 * s, -0.08 * s, 0.46 * s, -0.08 * s, 0, -0.46 * s);
  g.strokeTriangle(-0.46 * s, -0.08 * s, 0.46 * s, -0.08 * s, 0, -0.46 * s);
  box(g, s, 0xbfe3ff, -0.24, 0.04, 0.2, 0.2, 0.01);
  box(g, s, 0x8a5a2b, 0.08, 0.1, 0.18, 0.34, 0.01);
}

function drawFactory(g, s) {
  line(g, s);
  g.fillStyle(0xd9d9d9, 0.9).fillCircle(-s * 0.2, -s * 0.44, s * 0.08).fillCircle(-s * 0.1, -s * 0.52, s * 0.06);
  box(g, s, 0xc0392b, -0.3, -0.4, 0.14, 0.4, 0.01);
  box(g, s, 0xc0392b, 0.08, -0.3, 0.12, 0.3, 0.01);
  box(g, s, 0x9aa5b1, -0.46, -0.04, 0.92, 0.48, 0.02);
  for (const x of [-0.36, -0.12, 0.12]) box(g, s, 0xbfe3ff, x, 0.08, 0.16, 0.14, 0.01);
}

// Человек в форме: цвет одежды, цвет фуражки (null — без неё), галстук,
// back — стоит спиной (лица не видно), crumbs — крошки на усах
const person = (clothes, capColor, tie, back = false, crumbs = false) => (g, s) => {
  line(g, s);
  box(g, s, 0x3a2e39, -0.22, 0.5, 0.18, 0.48, 0.04);
  box(g, s, 0x3a2e39, 0.04, 0.5, 0.18, 0.48, 0.04);
  box(g, s, clothes, -0.32, -0.3, 0.64, 0.86, 0.12);
  if (tie) {
    g.fillStyle(COLORS.white, 1).fillTriangle(-s * 0.12, -s * 0.3, s * 0.12, -s * 0.3, 0, -s * 0.06);
    g.fillStyle(0xd63d3d, 1).fillTriangle(-s * 0.04, -s * 0.26, s * 0.04, -s * 0.26, 0, s * 0.12);
  }
  disc(g, s, 0xf2c9a0, 0, -0.56, 0.24);
  if (back) {
    // затылок: волосы вместо лица
    g.fillStyle(0x6b4423, 1).slice(0, -s * 0.56, s * 0.22, Math.PI, 0).fillPath();
  } else {
    g.fillStyle(INK, 1).fillCircle(-s * 0.09, -s * 0.58, s * 0.025).fillCircle(s * 0.09, -s * 0.58, s * 0.025);
    g.fillStyle(0x6b4423, 1).fillEllipse(0, -s * 0.47, s * 0.26, s * 0.06);
    if (crumbs) {
      g.fillStyle(COLORS.coin, 1);
      for (const [x, y] of [[-0.09, -0.47], [0.02, -0.45], [0.1, -0.48], [-0.02, -0.4]]) g.fillCircle(x * s, y * s, s * 0.022);
    }
  }
  if (capColor !== null) {
    box(g, s, capColor, -0.26, -0.9, 0.52, 0.2, 0.05);
    box(g, s, INK, -0.3, -0.74, 0.6, 0.06, 0.02);
  }
};

function drawWrench(g, s) {
  line(g, s);
  box(g, s, 0x9aa5b1, -0.34, -0.06, 0.68, 0.12, 0.03);
  disc(g, s, 0x9aa5b1, -0.38, 0, 0.13);
  disc(g, s, 0x9aa5b1, 0.38, 0, 0.13);
  g.fillStyle(COLORS.bg, 1).fillRect(-s * 0.52, -s * 0.05, s * 0.14, s * 0.1).fillRect(s * 0.38, -s * 0.05, s * 0.14, s * 0.1);
}

// ——— завод ———

function drawLever(g, s) {
  line(g, s);
  box(g, s, 0x9aa5b1, -0.3, -0.1, 0.6, 0.6, 0.06);
  g.lineStyle(Math.max(4, s * 0.1), INK, 1).lineBetween(0, s * 0.2, s * 0.2, -s * 0.4);
  line(g, s);
  disc(g, s, 0xd63d3d, 0.2, -0.4, 0.12);
}

function drawCrate(g, s) {
  line(g, s);
  box(g, s, 0xc48a4f, -0.5, -0.4, 1, 0.8, 0.03);
  g.lineBetween(-s * 0.5, -s * 0.14, s * 0.5, -s * 0.14);
  g.lineBetween(-s * 0.5, s * 0.14, s * 0.5, s * 0.14);
  g.lineBetween(-s * 0.36, -s * 0.4, -s * 0.36, s * 0.4);
  g.lineBetween(s * 0.36, -s * 0.4, s * 0.36, s * 0.4);
}

// Шестерёнка: part — "full", левая или правая половина (уезжает за край), broken — с отколотым зубом
const gear = (part, broken) => (g, s) => {
  const from = part === 'right' ? -Math.PI / 2 : part === 'left' ? Math.PI / 2 : 0;
  const sweep = part === 'full' ? Math.PI * 2 : Math.PI;
  line(g, s);
  g.fillStyle(0x9aa5b1, 1);
  const teeth = 8;
  for (let i = 0; i < teeth; i += 1) {
    const angle = (Math.PI * 2 * i) / teeth;
    const local = (angle - from + Math.PI * 2) % (Math.PI * 2);
    if (local > sweep + 0.01 || (broken && i === 1)) continue;
    g.fillCircle(Math.cos(angle) * s * 0.4, Math.sin(angle) * s * 0.4, s * 0.09);
    g.strokeCircle(Math.cos(angle) * s * 0.4, Math.sin(angle) * s * 0.4, s * 0.09);
  }
  g.slice(0, 0, s * 0.38, from, from + sweep).fillPath().strokePath();
  g.fillStyle(COLORS.white, 1).slice(0, 0, s * 0.13, from, from + sweep).fillPath().strokePath();
  if (broken) {
    g.lineStyle(Math.max(2, s * 0.03), INK, 1);
    g.strokePoints([[0.1, -0.36], [0.02, -0.2], [0.14, -0.1], [0.04, 0.02]].map(([x, y]) => ({ x: x * s, y: y * s })));
  }
};

// Болт с шестигранной головкой: по шлицу видно, что он крутится
function drawBolt(g, s) {
  line(g, s);
  const hex = [...Array(6)].map((_, i) => ({ x: Math.cos((Math.PI * i) / 3) * s * 0.46, y: Math.sin((Math.PI * i) / 3) * s * 0.46 }));
  g.fillStyle(0x9aa5b1, 1).fillPoints(hex, true);
  g.strokePoints(hex, true);
  disc(g, s, 0xc5ccd4, 0, 0, 0.28);
  g.lineStyle(Math.max(4, s * 0.06), INK, 1).lineBetween(-s * 0.2, 0, s * 0.2, 0);
}

function drawExtinguisher(g, s) {
  line(g, s);
  box(g, s, 0x3a2e39, -0.14, -0.96, 0.28, 0.18, 0.04);
  g.lineBetween(s * 0.1, -s * 0.86, s * 0.46, -s * 0.7);
  box(g, s, 0xd63d3d, -0.36, -0.78, 0.72, 1.7, 0.16);
  box(g, s, COLORS.white, -0.24, -0.3, 0.48, 0.4, 0.03);
}

function drawSmoke(g, s) {
  g.fillStyle(0x6b6470, 0.75);
  for (const [x, y, r] of [[-0.2, 0.25, 0.2], [0.1, 0.1, 0.24], [-0.08, -0.15, 0.2], [0.18, -0.3, 0.16]]) g.fillCircle(x * s, y * s, r * s);
}

function drawThermos(g, s) {
  line(g, s);
  box(g, s, 0x9aa5b1, -0.3, -1.05, 0.6, 0.3, 0.08);
  box(g, s, 0x3f8f5a, -0.4, -0.8, 0.8, 1.8, 0.14);
  g.fillStyle(COLORS.white, 0.7).fillRect(-s * 0.4, -s * 0.2, s * 0.8, s * 0.14);
}

// Труба: горячая (над ней дрожит воздух) или с дыркой, из которой брызжет вода
const pipe = (leak) => (g, s) => {
  line(g, s);
  box(g, s, leak ? 0x9aa5b1 : 0xd9654a, -0.5, -0.08, 1, 0.16, 0.02);
  for (const x of [-0.42, 0.34]) box(g, s, leak ? 0x7d848b : 0xb8482f, x, -0.11, 0.08, 0.22, 0.02);
  if (leak) {
    g.fillStyle(INK, 1).fillCircle(s * 0.1, -s * 0.02, s * 0.025);
    g.lineStyle(Math.max(3, s * 0.012), 0x4aa3df, 1);
    for (const [dx, dy] of [[-0.06, -0.14], [0, -0.18], [0.06, -0.14], [0.11, -0.08]]) g.lineBetween(s * 0.1, -s * 0.04, (0.1 + dx) * s, dy * s);
  } else {
    g.lineStyle(Math.max(2, s * 0.008), 0xd9654a, 0.9);
    for (const x of [-0.2, 0, 0.2]) {
      g.strokePoints([0, 1, 2, 3].map((i) => ({ x: (x + (i % 2 ? 0.02 : -0.02)) * s, y: (-0.12 - i * 0.03) * s })));
    }
  }
};

function drawForklift(g, s) {
  line(g, s);
  // мачта и вилы справа
  box(g, s, 0x3a2e39, 0.22, -0.36, 0.05, 0.62, 0.01);
  box(g, s, 0x3a2e39, 0.22, 0.2, 0.28, 0.04, 0.01);
  // кабина и корпус
  g.lineStyle(Math.max(4, s * 0.025), 0x3a2e39, 1).strokeRect(-s * 0.3, -s * 0.36, s * 0.36, s * 0.34);
  line(g, s);
  box(g, s, COLORS.coin, -0.46, -0.04, 0.68, 0.24, 0.04);
  disc(g, s, INK, -0.3, 0.24, 0.09);
  disc(g, s, INK, 0.08, 0.24, 0.09);
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

function drawOilcan(g, s) {
  line(g, s);
  g.lineStyle(Math.max(4, s * 0.05), INK, 1).lineBetween(s * 0.1, -s * 0.1, s * 0.46, -s * 0.34);
  line(g, s);
  box(g, s, 0x6b6470, -0.4, -0.12, 0.6, 0.42, 0.08);
  g.fillStyle(0x3a2a1a, 1).fillCircle(s * 0.46, -s * 0.24, s * 0.04);
}

function drawSpray(g, s) {
  line(g, s);
  box(g, s, 0x3a2e39, -0.2, -0.86, 0.5, 0.2, 0.04);
  box(g, s, 0x4aa3df, -0.3, -0.64, 0.6, 1.3, 0.1);
  g.fillStyle(0x4aa3df, 1).fillCircle(s * 0.44, -s * 0.82, s * 0.04).fillCircle(s * 0.56, -s * 0.7, s * 0.03);
}

// ——— значки разделов ———

function drawHeart(g, s) {
  line(g, s);
  g.fillStyle(0xe8527a, 1);
  g.fillCircle(-s * 0.17, -s * 0.12, s * 0.2).fillCircle(s * 0.17, -s * 0.12, s * 0.2);
  g.fillTriangle(-s * 0.35, -s * 0.02, s * 0.35, -s * 0.02, 0, s * 0.4);
}

function drawFish(g, s) {
  line(g, s);
  g.fillStyle(0x4aa3df, 1).fillTriangle(s * 0.2, 0, s * 0.48, -s * 0.2, s * 0.48, s * 0.2);
  g.strokeTriangle(s * 0.2, 0, s * 0.48, -s * 0.2, s * 0.48, s * 0.2);
  g.fillEllipse(-s * 0.08, 0, s * 0.7, s * 0.4);
  g.strokeEllipse(-s * 0.08, 0, s * 0.7, s * 0.4);
  g.fillStyle(INK, 1).fillCircle(-s * 0.26, -s * 0.04, s * 0.03);
}

const SHAPES = {
  sun: { draw: drawSun, aspect: 1 },
  cloud: { draw: drawCloud, aspect: 0.7 },
  raincloud: { draw: drawRaincloud, aspect: 1.1 },
  bush: { draw: drawBush, aspect: 0.75 },
  tree: { draw: drawTree, aspect: 1 },
  balloon: { draw: drawBalloon, aspect: 1 },
  alarm: { draw: drawAlarm, aspect: 1 },
  window: { draw: drawWindow, aspect: 1 },
  curtain: { draw: drawCurtain, aspect: 1.15 },
  cat: { draw: drawCat, aspect: 0.6 },
  slipper: { draw: drawSlipper, aspect: 0.45 },
  sock: { draw: drawSock, aspect: 1 },
  pillow: { draw: drawPillow, aspect: 0.55 },
  rug: { draw: drawRug, aspect: 0.5 },
  nightstand: { draw: drawNightstand, aspect: 0.95 },
  door: { draw: drawDoor, aspect: 2 },
  shirt: { draw: drawShirt, aspect: 0.95 },
  wrinkles: { draw: drawWrinkles, aspect: 0.9 },
  iron: { draw: drawIron, aspect: 0.6 },
  keys: { draw: drawKeys, aspect: 0.6 },
  wallet: { draw: drawWallet, aspect: 0.65 },
  jar: { draw: drawJar, aspect: 1.3 },
  cup: { draw: cup(false), aspect: 0.9 },
  cupFull: { draw: cup(true), aspect: 0.9 },
  tube: { draw: drawTube, aspect: 0.45 },
  brush: { draw: brush(false), aspect: 0.3 },
  brushPaste: { draw: brush(true), aspect: 0.3 },
  fridge: { draw: drawFridge, aspect: 1.5 },
  pelmeni: { draw: drawPelmeni, aspect: 0.66 },
  sausage: { draw: drawSausage, aspect: 0.36 },
  pot: { draw: drawPot, aspect: 0.62 },
  stove: { draw: drawStove, aspect: 0.9 },
  flame: { draw: drawFlame, aspect: 1 },
  bus: { draw: drawBus, aspect: 0.55 },
  house: { draw: drawHouse, aspect: 0.9 },
  factory: { draw: drawFactory, aspect: 1 },
  conductor: { draw: person(0x3f6fa8, 0x2e4a8f, false), aspect: 2 },
  boss: { draw: person(0x4a4a55, null, true), aspect: 2 },
  bossBack: { draw: person(0x4a4a55, null, false, true), aspect: 2 },
  worker: { draw: person(0x3f6fa8, 0xf5b800, false), aspect: 2 },
  workerCrumbs: { draw: person(0x3f6fa8, 0xf5b800, false, false, true), aspect: 2 },
  guard: { draw: person(0x4a4a55, 0x2a2a33, false), aspect: 2 },
  wrench: { draw: drawWrench, aspect: 0.3 },
  lever: { draw: drawLever, aspect: 1.1 },
  crate: { draw: drawCrate, aspect: 0.8 },
  gear: { draw: gear('full', false), aspect: 1 },
  gearLeft: { draw: gear('left', false), aspect: 1 },
  gearRight: { draw: gear('right', false), aspect: 1 },
  gearBroken: { draw: gear('full', true), aspect: 1 },
  bolt: { draw: drawBolt, aspect: 1 },
  extinguisher: { draw: drawExtinguisher, aspect: 2 },
  smoke: { draw: drawSmoke, aspect: 1 },
  thermos: { draw: drawThermos, aspect: 2.1 },
  pipe: { draw: pipe(false), aspect: 0.3 },
  pipeLeak: { draw: pipe(true), aspect: 0.3 },
  forklift: { draw: drawForklift, aspect: 0.75 },
  light: { draw: drawLight, aspect: 1 },
  oilcan: { draw: drawOilcan, aspect: 0.7 },
  spray: { draw: drawSpray, aspect: 1.8 },
  heart: { draw: drawHeart, aspect: 0.8 },
  fish: { draw: drawFish, aspect: 0.5 },
};

export const hasShape = (name) => name in SHAPES;

// Создаёт картинку шириной size с центром в (0, 0). Возвращает { object, w, h }.
export function addShape(scene, name, size) {
  const shape = SHAPES[name];
  const g = scene.add.graphics();
  shape.draw(g, size);
  return { object: g, w: size, h: size * shape.aspect };
}

// Перерисовывает уже созданную картинку другой (кружка стала полной и т. п.)
export function redrawShape(g, name, size) {
  SHAPES[name].draw(g.clear(), size);
}
