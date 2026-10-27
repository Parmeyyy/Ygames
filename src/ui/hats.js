import { COLORS } from '../config.js';
import { heroTexture } from './images.js';

// Предметы гардероба, нарисованные фигурами. У каждого своя функция draw<Имя>(g, s):
//   g — Graphics, начало координат — макушка Валеры (ось y направлена вниз)
//   s — условная ширина головного убора в пикселях, все размеры считаются от неё;
//       край шапки проходит примерно на y = 0.12 s
// Чтобы заменить предмет на PNG, достаточно в addHat вернуть для него scene.add.image(...).

const INK = COLORS.outline;
const line = (g, s) => g.lineStyle(Math.max(2, s * 0.025), INK, 1);

// Кепка: цвет купола и козырька
const cap = (dome, visor) => (g, s) => {
  line(g, s);
  g.fillStyle(visor, 1).fillEllipse(s * 0.3, s * 0.13, s * 0.5, s * 0.1);
  g.strokeEllipse(s * 0.3, s * 0.13, s * 0.5, s * 0.1);
  g.fillStyle(dome, 1).slice(0, s * 0.15, s * 0.31, Math.PI, 0).fillPath().strokePath();
  g.fillStyle(COLORS.white, 1).fillCircle(0, -s * 0.16, s * 0.035);
};

function drawBandana(g, s) {
  line(g, s);
  g.fillStyle(0xd63d3d, 1).slice(0, s * 0.15, s * 0.31, Math.PI, 0).fillPath().strokePath();
  g.fillTriangle(-s * 0.3, s * 0.1, -s * 0.5, s * 0.02, -s * 0.46, s * 0.24);
  g.strokeTriangle(-s * 0.3, s * 0.1, -s * 0.5, s * 0.02, -s * 0.46, s * 0.24);
  g.fillStyle(COLORS.white, 1);
  for (const [x, y] of [[-0.12, 0.02], [0.08, -0.06], [0.16, 0.06], [-0.02, -0.1]]) g.fillCircle(x * s, y * s, s * 0.025);
}

function drawBeanie(g, s) {
  line(g, s);
  g.fillStyle(0x3498db, 1).slice(0, s * 0.12, s * 0.32, Math.PI, 0).fillPath().strokePath();
  g.fillStyle(COLORS.white, 1).fillRoundedRect(-s * 0.35, s * 0.07, s * 0.7, s * 0.11, s * 0.05);
  g.strokeRoundedRect(-s * 0.35, s * 0.07, s * 0.7, s * 0.11, s * 0.05);
  g.fillCircle(0, -s * 0.24, s * 0.08);
  g.strokeCircle(0, -s * 0.24, s * 0.08);
}

function drawUshanka(g, s) {
  line(g, s);
  g.fillStyle(0x8a5a2b, 1);
  // уши
  g.fillRoundedRect(-s * 0.42, s * 0.02, s * 0.16, s * 0.42, s * 0.07);
  g.strokeRoundedRect(-s * 0.42, s * 0.02, s * 0.16, s * 0.42, s * 0.07);
  g.fillRoundedRect(s * 0.26, s * 0.02, s * 0.16, s * 0.42, s * 0.07);
  g.strokeRoundedRect(s * 0.26, s * 0.02, s * 0.16, s * 0.42, s * 0.07);
  g.slice(0, s * 0.14, s * 0.34, Math.PI, 0).fillPath().strokePath();
  g.fillStyle(0xb98450, 1).fillRoundedRect(-s * 0.3, -s * 0.02, s * 0.6, s * 0.16, s * 0.06);
  g.strokeRoundedRect(-s * 0.3, -s * 0.02, s * 0.6, s * 0.16, s * 0.06);
}

function drawFedora(g, s) {
  line(g, s);
  g.fillStyle(0x5b5560, 1).fillRoundedRect(-s * 0.26, -s * 0.2, s * 0.52, s * 0.32, s * 0.1);
  g.strokeRoundedRect(-s * 0.26, -s * 0.2, s * 0.52, s * 0.32, s * 0.1);
  g.fillEllipse(0, s * 0.12, s * 0.92, s * 0.12);
  g.strokeEllipse(0, s * 0.12, s * 0.92, s * 0.12);
  g.fillStyle(INK, 1).fillRect(-s * 0.26, s * 0.0, s * 0.52, s * 0.07);
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

// Шапка из газеты
function drawPaper(g, s) {
  line(g, s);
  g.fillStyle(0xf3efe4, 1).fillTriangle(-s * 0.4, s * 0.14, s * 0.4, s * 0.14, 0, -s * 0.34);
  g.strokeTriangle(-s * 0.4, s * 0.14, s * 0.4, s * 0.14, 0, -s * 0.34);
  g.lineStyle(Math.max(1, s * 0.012), COLORS.secondary, 1);
  for (const y of [0.02, -0.06, -0.14]) g.lineBetween(-s * (0.24 + y), y * s, s * (0.24 + y), y * s);
}

// Каска
function drawHelmet(g, s) {
  line(g, s);
  g.fillStyle(0xf5b800, 1).slice(0, s * 0.14, s * 0.33, Math.PI, 0).fillPath().strokePath();
  g.fillRoundedRect(-s * 0.42, s * 0.08, s * 0.84, s * 0.09, s * 0.04);
  g.strokeRoundedRect(-s * 0.42, s * 0.08, s * 0.84, s * 0.09, s * 0.04);
  g.fillStyle(0xd99a00, 1).fillRoundedRect(-s * 0.04, -s * 0.2, s * 0.08, s * 0.3, s * 0.03);
}

function drawPanama(g, s) {
  line(g, s);
  g.fillStyle(0xb9b38a, 1);
  const brim = [[-0.48, 0.24], [-0.3, 0.06], [0.3, 0.06], [0.48, 0.24]].map(([x, y]) => ({ x: x * s, y: y * s }));
  g.fillPoints(brim, true);
  g.strokePoints(brim, true);
  g.slice(0, s * 0.1, s * 0.3, Math.PI, 0).fillPath().strokePath();
}

function drawStraw(g, s) {
  line(g, s);
  g.fillStyle(0xf2d16b, 1).fillEllipse(0, s * 0.13, s * 1.1, s * 0.14);
  g.strokeEllipse(0, s * 0.13, s * 1.1, s * 0.14);
  g.slice(0, s * 0.12, s * 0.29, Math.PI, 0).fillPath().strokePath();
  g.fillStyle(0xd63d3d, 1).fillRect(-s * 0.28, s * 0.03, s * 0.56, s * 0.06);
}

// Будильник-медаль: висит на груди
function drawMedal(g, s) {
  const x = -s * 0.24;
  const y = s * 0.92;
  line(g, s);
  g.fillStyle(0xd63d3d, 1).fillTriangle(x - s * 0.08, y - s * 0.2, x + s * 0.08, y - s * 0.2, x, y - s * 0.04);
  g.fillStyle(COLORS.coin, 1).fillCircle(x, y, s * 0.11);
  g.strokeCircle(x, y, s * 0.11);
  g.lineBetween(x, y, x, y - s * 0.06);
  g.lineBetween(x, y, x + s * 0.045, y);
}

// Галстук-бабочка: на шее
function drawBowtie(g, s) {
  const y = s * 0.62;
  line(g, s);
  g.fillStyle(0xd63d3d, 1);
  g.fillTriangle(0, y, -s * 0.2, y - s * 0.1, -s * 0.2, y + s * 0.1);
  g.strokeTriangle(0, y, -s * 0.2, y - s * 0.1, -s * 0.2, y + s * 0.1);
  g.fillTriangle(0, y, s * 0.2, y - s * 0.1, s * 0.2, y + s * 0.1);
  g.strokeTriangle(0, y, s * 0.2, y - s * 0.1, s * 0.2, y + s * 0.1);
  g.fillStyle(0x9c2b2b, 1).fillCircle(0, y, s * 0.045);
}

// Картинки шапок: ширина в долях s и где проходит их нижний край (в долях s от макушки)
const HAT_WIDTH = 0.78;
const HAT_BRIM = 0.2;
// Как шапка-картинка сидит на голове-картинке Валеры: w — ширина в долях ширины головы
// (низ шапки шире головы, чтобы она обхватывала голову, а не висела на лбу),
// y — где нижний край шапки (в долях высоты головы от макушки), x — сдвиг в долях ширины головы,
// angle — поворот в градусах, shadow — где на лбу тень от края, если не там, где низ шапки.
// Кепка сдвинута вправо, чтобы купол, а не козырёк, был над головой; бандана повёрнута узлом вбок.
const HAT_FIT = {
  cap: { w: 1.04, y: 0.36, x: 0.06 },
  redcap: { w: 1.04, y: 0.36, x: 0.06 },
  bandana: { w: 1.18, y: 0.62, angle: 10, shadow: 0.31 },
  beanie: { w: 1.06, y: 0.4 },
  ushanka: { w: 1.14, y: 0.54, shadow: 0.37 },
  fedora: { w: 1.2, y: 0.36 },
  crown: { w: 0.98, y: 0.33 },
  chef: { w: 1.2, y: 0.37 },
  paper: { w: 1.18, y: 0.36 },
  helmet: { w: 1.14, y: 0.39 },
  panama: { w: 1.14, y: 0.4 },
  straw: { w: 1.3, y: 0.38 },
};

// Мягкая тень: размытый тёмный овал, рисуется один раз на всю игру
function shadowTexture(scene) {
  const key = 'hat-shadow';
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, 128, 128);
  const ctx = canvas.getContext();
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(60, 30, 10, 0.3)');
  gradient.addColorStop(1, 'rgba(60, 30, 10, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  canvas.refresh();
  return key;
}

// Шапка-картинка на голове-картинке, с тенью от края на лбу. head — { top, w, h }: макушка и размеры головы.
// Для неизвестной шапки или без картинки вернёт null.
export function addHatOnHead(scene, id, head) {
  const texture = heroTexture(scene, `hat-${id}`);
  const fit = HAT_FIT[id];
  if (!texture || !fit) return null;
  const shadowY = head.top + head.h * ((fit.shadow ?? fit.y) + 0.0075);
  const shadow = scene.add.image(0, shadowY, shadowTexture(scene)).setDisplaySize(head.w * 0.64, head.h * 0.085);
  const hat = scene.add.image(head.w * (fit.x ?? 0), head.top + head.h * fit.y, texture).setOrigin(0.5, 1);
  hat.setScale((head.w * fit.w) / hat.width).setAngle(fit.angle ?? 0);
  return scene.add.container(0, 0, [shadow, hat]);
}

// Значки-картинки (медаль, бабочка) не на голове: ширина в долях s и середина в долях s от макушки,
// как у нарисованных кодом. Валера из картинок сам переносит их на грудь и шею (src/ui/Hero.js).
const BADGES = { medal: { width: 0.36, center: 0.85 }, bowtie: { width: 0.3, center: 0.62 } };

// center — где у рисунка середина по вертикали (в долях s): нужно, чтобы ровно показать предмет в карточке
const DRAWERS = {
  cap: { draw: cap(0x6f8fb3, 0x54708f), center: 0 },
  redcap: { draw: cap(0xe74c3c, 0xc0392b), center: 0 },
  bandana: { draw: drawBandana, center: 0 },
  beanie: { draw: drawBeanie, center: -0.05 },
  ushanka: { draw: drawUshanka, center: 0.12 },
  fedora: { draw: drawFedora, center: 0 },
  crown: { draw: drawCrown, center: -0.05 },
  chef: { draw: drawChef, center: -0.15 },
  paper: { draw: drawPaper, center: -0.1 },
  helmet: { draw: drawHelmet, center: 0 },
  panama: { draw: drawPanama, center: 0.04 },
  straw: { draw: drawStraw, center: 0 },
  medal: { draw: drawMedal, center: 0.85 },
  bowtie: { draw: drawBowtie, center: 0.62 },
};

// Создаёт предмет: (x, y) — макушка Валеры, size — условная ширина. Для неизвестного id вернёт null.
// centered: true — (x, y) это середина самого рисунка (для карточек и предметов на поле).
export function addHat(scene, id, x, y, size, centered = false) {
  // нарисованная шапка из Canva (src/assets/hero/hat-<id>.png): низ шапки ложится на лоб
  const texture = heroTexture(scene, `hat-${id}`);
  if (texture) {
    const image = scene.add.image(x, y, texture);
    const badge = BADGES[id];
    // в карточке значок крупнее, чем на груди
    image.setScale((size * (badge ? (centered ? 0.55 : badge.width) : HAT_WIDTH)) / image.width);
    if (centered) return image;
    if (badge) return image.setY(y + size * badge.center);
    return image.setOrigin(0.5, 1).setY(y + size * HAT_BRIM);
  }
  const drawer = DRAWERS[id];
  if (!drawer) return null;
  const g = scene.add.graphics({ x, y: centered ? y - drawer.center * size : y });
  drawer.draw(g, size);
  return g;
}
