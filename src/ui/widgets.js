import Phaser from 'phaser';
import { COLORS, FONT, TEXT } from '../config.js';

// Текст по центру точки (x, y); size — в дизайн-единицах
export function addText(scene, x, y, str, size, style = {}) {
  const fontSize = Math.round(size * scene.u);
  return scene.add
    .text(x, y, str, {
      fontFamily: FONT,
      fontSize: `${fontSize}px`,
      color: TEXT.dark,
      align: 'center',
      // запас сверху и снизу, чтобы не срезались «Й» и «у»
      padding: { y: Math.ceil(fontSize * 0.15) },
      ...style,
    })
    .setOrigin(0.5);
}

// Делает объект нажимаемым. Срабатывает, только если палец и опустился, и поднялся на объекте.
// cursor: false — не показывать «руку» на десктопе (для спрятанных ответов).
// pad — расширение зоны нажатия для мелких объектов.
export function makeTappable(obj, onTap, { cursor = true, pad = 0 } = {}) {
  const config = { useHandCursor: cursor };
  if (pad) {
    config.hitArea = new Phaser.Geom.Rectangle(-pad, -pad, obj.width + pad * 2, obj.height + pad * 2);
    config.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
  }
  obj.setInteractive(config);

  const baseScale = obj.scale;
  let pressed = false;
  obj.on('pointerdown', () => {
    pressed = true;
    obj.setScale(baseScale * 0.95);
  });
  obj.on('pointerout', () => {
    pressed = false;
    obj.setScale(baseScale);
  });
  obj.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    obj.setScale(baseScale);
    onTap();
  });
  return obj;
}

// Кнопка с центром в (x, y); w и h — уже в пикселях
export function addButton(scene, x, y, w, h, label, onTap, options = {}) {
  const { fill = COLORS.accent, textColor = TEXT.light, size = 34 } = options;
  const u = scene.u;
  const radius = Math.min(h / 2, 28 * u);

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-w / 2, -h / 2 + 6 * u, w, h, radius);
  bg.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);

  const text = addText(scene, 0, 0, label, size, { color: textColor, fontStyle: 'bold' });
  const maxTextWidth = w - 28 * u;
  if (text.width > maxTextWidth) text.setScale(maxTextWidth / text.width);

  const button = scene.add.container(x, y, [bg, text]).setSize(w, h);
  return makeTappable(button, onTap);
}

// Облачко с репликой, центр в (x, y), ширина не больше maxW
export function addBubble(scene, x, y, maxW, str) {
  const u = scene.u;
  const pad = 22 * u;
  const text = addText(scene, 0, 0, str, 28, { wordWrap: { width: maxW - pad * 2 } });
  const w = Math.min(maxW, text.width + pad * 2);
  const h = text.height + pad * 2;

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22 * u);
  bg.lineStyle(3 * u, COLORS.outline, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 22 * u);

  return scene.add.container(x, y, [bg, text]);
}
