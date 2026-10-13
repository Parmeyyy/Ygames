import { COLORS } from '../config.js';
import { makeTappable } from './widgets.js';

// Значки для круглых кнопок меню. Каждый рисуется функцией (g, s): центр в (0, 0), s — размер значка.
const INK = COLORS.outline;

const ICONS = {
  wheel(g, s) {
    const colors = [COLORS.accent, COLORS.coin, COLORS.success, 0x4aa3df, COLORS.special, 0xe8527a];
    colors.forEach((color, i) => {
      g.fillStyle(color, 1).slice(0, 0, s * 0.46, (Math.PI * 2 * i) / 6, (Math.PI * 2 * (i + 1)) / 6).fillPath();
    });
    g.lineStyle(Math.max(2, s * 0.05), INK, 1).strokeCircle(0, 0, s * 0.46);
    g.fillStyle(COLORS.white, 1).fillCircle(0, 0, s * 0.1);
    g.fillStyle(INK, 1).fillTriangle(-s * 0.1, -s * 0.52, s * 0.1, -s * 0.52, 0, -s * 0.32);
  },
  chest(g, s) {
    g.lineStyle(Math.max(2, s * 0.05), INK, 1);
    g.fillStyle(0xa9713a, 1).fillRoundedRect(-s * 0.44, -s * 0.34, s * 0.88, s * 0.68, s * 0.08);
    g.strokeRoundedRect(-s * 0.44, -s * 0.34, s * 0.88, s * 0.68, s * 0.08);
    g.lineBetween(-s * 0.44, -s * 0.06, s * 0.44, -s * 0.06);
    g.fillStyle(COLORS.coin, 1).fillRoundedRect(-s * 0.09, -s * 0.16, s * 0.18, s * 0.22, s * 0.03);
    g.strokeRoundedRect(-s * 0.09, -s * 0.16, s * 0.18, s * 0.22, s * 0.03);
  },
  medal(g, s) {
    g.lineStyle(Math.max(2, s * 0.05), INK, 1);
    g.fillStyle(0xd63d3d, 1).fillTriangle(-s * 0.26, -s * 0.48, s * 0.26, -s * 0.48, 0, -s * 0.04);
    g.fillStyle(COLORS.coin, 1).fillCircle(0, s * 0.12, s * 0.32);
    g.strokeCircle(0, s * 0.12, s * 0.32);
    g.fillStyle(COLORS.white, 0.9).fillCircle(0, s * 0.12, s * 0.14);
  },
  // динамик: со звуковыми волнами или перечёркнутый
  sound(g, s, on = true) {
    g.lineStyle(Math.max(2, s * 0.05), INK, 1);
    const body = [[-0.42, -0.14], [-0.2, -0.14], [0.06, -0.38], [0.06, 0.38], [-0.2, 0.14], [-0.42, 0.14]].map(([x, y]) => ({ x: x * s, y: y * s }));
    g.fillStyle(COLORS.white, 1).fillPoints(body, true);
    g.strokePoints(body, true);
    g.lineStyle(Math.max(3, s * 0.07), INK, 1);
    if (on) {
      g.beginPath().arc(s * 0.08, 0, s * 0.2, -0.3 * Math.PI, 0.3 * Math.PI).strokePath();
      g.beginPath().arc(s * 0.08, 0, s * 0.36, -0.3 * Math.PI, 0.3 * Math.PI).strokePath();
    } else {
      g.lineBetween(s * 0.2, -s * 0.2, s * 0.46, s * 0.2);
      g.lineBetween(s * 0.46, -s * 0.2, s * 0.2, s * 0.2);
    }
  },
};

// Круглая кнопка со значком: (x, y) — центр, size — диаметр.
// badge: true — красная точка «тут что-то ждёт»; args — что передать рисовальщику значка.
export function addIconButton(scene, x, y, size, icon, onTap, { badge = false, args = [] } = {}) {
  const u = scene.u;
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.outline, 0.18).fillCircle(0, 5 * u, size / 2);
  bg.fillStyle(COLORS.white, 1).fillCircle(0, 0, size / 2);
  bg.lineStyle(3 * u, COLORS.outline, 1).strokeCircle(0, 0, size / 2);
  const picture = scene.add.graphics();
  ICONS[icon](picture, size * 0.56, ...args);
  const parts = [bg, picture];
  if (badge) {
    const dot = scene.add.graphics();
    dot.fillStyle(0xff3b30, 1).fillCircle(size * 0.34, -size * 0.34, size * 0.13);
    dot.lineStyle(2 * u, COLORS.white, 1).strokeCircle(size * 0.34, -size * 0.34, size * 0.13);
    parts.push(dot);
  }
  const button = scene.add.container(x, y, parts).setSize(size, size);
  return makeTappable(button, onTap);
}
