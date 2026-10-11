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
// feedback: false — не сжимать объект при нажатии.
export function makeTappable(obj, onTap, { cursor = true, pad = 0, feedback = true } = {}) {
  const config = { useHandCursor: cursor };
  if (pad) {
    config.hitArea = new Phaser.Geom.Rectangle(-pad, -pad, obj.width + pad * 2, obj.height + pad * 2);
    config.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
  }
  obj.setInteractive(config);

  const baseScale = obj.scale;
  const pressedScale = feedback ? baseScale * 0.95 : baseScale;
  let pressed = false;
  obj.on('pointerdown', () => {
    pressed = true;
    obj.setScale(pressedScale);
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
// disabled: true — серая и не нажимается
export function addButton(scene, x, y, w, h, label, onTap, options = {}) {
  const { size = 34, disabled = false } = options;
  const fill = disabled ? COLORS.locked : (options.fill ?? COLORS.accent);
  const textColor = disabled ? TEXT.muted : (options.textColor ?? TEXT.light);
  const u = scene.u;
  const radius = Math.min(h / 2, 28 * u);

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-w / 2, -h / 2 + 6 * u, w, h, radius);
  bg.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);

  const text = addText(scene, 0, 0, label, size, { color: textColor, fontStyle: 'bold' });
  const maxTextWidth = w - 28 * u;
  if (text.width > maxTextWidth) text.setScale(maxTextWidth / text.width);

  const button = scene.add.container(x, y, [bg, text]).setSize(w, h);
  return disabled ? button : makeTappable(button, onTap);
}

// Монетка с числом или подписью («120», «+10»), центр в (x, y). Ширина — в поле width.
export function addCoinAmount(scene, x, y, label, size = 28, color = TEXT.dark) {
  const u = scene.u;
  const radius = size * 0.5 * u;
  const gap = size * 0.3 * u;
  const text = addText(scene, 0, 0, String(label), size, { color, fontStyle: 'bold' }).setOrigin(0, 0.5);
  const width = radius * 2 + gap + text.width;
  text.setX(-width / 2 + radius * 2 + gap);

  const coin = scene.add.graphics();
  coin.fillStyle(COLORS.coin, 1).fillCircle(-width / 2 + radius, 0, radius);
  coin.lineStyle(Math.max(1, 2 * u), COLORS.outline, 1).strokeCircle(-width / 2 + radius, 0, radius);

  return scene.add.container(x, y, [coin, text]).setSize(width, radius * 2);
}

// Счётчик монет игрока в «таблетке». anchor — какой стороной он привязан к x: left, center или right.
export function addCoinCounter(scene, x, y, coins, anchor = 'center') {
  const u = scene.u;
  const amount = addCoinAmount(scene, 0, 0, coins, 28);
  const w = amount.width + 36 * u;
  const h = 52 * u;

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  bg.lineStyle(3 * u, COLORS.outline, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

  const shift = anchor === 'left' ? w / 2 : anchor === 'right' ? -w / 2 : 0;
  return scene.add.container(x + shift, y, [bg, amount]);
}

// Рисует замок с центром в (x, y)
export function drawLock(g, x, y, size, color = COLORS.secondary) {
  g.lineStyle(size * 0.15, color, 1);
  g.beginPath().arc(x, y - size * 0.15, size * 0.3, Math.PI, 0).strokePath();
  g.fillStyle(color, 1).fillRoundedRect(x - size * 0.5, y - size * 0.15, size, size * 0.75, size * 0.12);
}

// Окно поверх сцены: заголовок и кнопки в столбик. Нажатие мимо окна вызывает onClose.
// buttons: [{ label, onTap, fill, disabled }]. Возвращает контейнер — закрыть окно: destroy().
export function addModal(scene, { title, buttons, onClose }) {
  const { W, H, u } = scene;
  const w = Math.min(W - 60 * u, 560 * u);
  const buttonH = 88 * u;
  const step = buttonH + 20 * u;
  const h = 130 * u + buttons.length * step + 20 * u;
  const top = H / 2 - h / 2;

  const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55);
  makeTappable(shade, onClose, { cursor: false, feedback: false });
  // невидимая подложка: нажатия по самому окну не должны его закрывать
  const blocker = scene.add.rectangle(W / 2, H / 2, w, h).setInteractive();

  const panel = scene.add.graphics();
  panel.fillStyle(COLORS.bg, 1).fillRoundedRect(W / 2 - w / 2, top, w, h, 28 * u);
  panel.lineStyle(3 * u, COLORS.outline, 1).strokeRoundedRect(W / 2 - w / 2, top, w, h, 28 * u);

  const heading = addText(scene, W / 2, top + 70 * u, title, 36, {
    fontStyle: 'bold',
    wordWrap: { width: w - 60 * u },
  });

  const items = buttons.map((button, index) =>
    addButton(scene, W / 2, top + 130 * u + index * step + buttonH / 2, w - 80 * u, buttonH, button.label, button.onTap, {
      fill: button.fill,
      disabled: button.disabled,
      size: 30,
    }),
  );

  return scene.add.container(0, 0, [shade, blocker, panel, heading, ...items]);
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
