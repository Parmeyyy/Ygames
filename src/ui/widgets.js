import Phaser from 'phaser';
import { audio } from '../audio.js';
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

// Текст, разложенный на отдельные слова: строки по центру вокруг (x, y), перенос по ширине maxW.
// Нужен, когда одно из слов становится предметом, который можно утащить. Возвращает массив слов-объектов.
export function addWordFlow(scene, x, y, str, size, maxW, style = {}) {
  const words = str.split(' ').map((word) => addText(scene, 0, 0, word, size, style).setOrigin(0, 0.5));
  const space = size * scene.u * 0.3;
  const lines = [[]];
  let lineWidth = 0;
  for (const word of words) {
    const extra = lines.at(-1).length ? space + word.width : word.width;
    if (lineWidth + extra > maxW && lines.at(-1).length) {
      lines.push([]);
      lineWidth = 0;
    }
    lineWidth += lines.at(-1).length ? space + word.width : word.width;
    lines.at(-1).push(word);
  }
  const lineHeight = size * scene.u * 1.25;
  lines.forEach((line, row) => {
    const width = line.reduce((sum, word) => sum + word.width, 0) + space * (line.length - 1);
    let cursor = x - width / 2;
    for (const word of line) {
      word.setPosition(cursor, y + (row - (lines.length - 1) / 2) * lineHeight);
      cursor += word.width + space;
    }
  });
  return words;
}

// Делает объект нажимаемым. Срабатывает, только если палец и опустился, и поднялся на объекте.
// При нажатии объект сжимается и пружинит обратно, при наведении мыши чуть увеличивается.
// cursor: false — не показывать «руку» и не увеличивать при наведении (для спрятанных ответов).
// pad — расширение зоны нажатия для мелких объектов.
// feedback: false — объект не сжимается и не пружинит.
export function makeTappable(obj, onTap, { cursor = true, pad = 0, feedback = true } = {}) {
  const config = { useHandCursor: cursor };
  if (pad) {
    config.hitArea = new Phaser.Geom.Rectangle(-pad, -pad, obj.width + pad * 2, obj.height + pad * 2);
    config.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
  }
  obj.setInteractive(config);

  const scene = obj.scene;
  const baseScale = obj.scale;
  let pressed = false;
  let hovered = false;
  let scaleTween = null;
  const scaleTo = (factor, duration, ease = 'Quad.easeOut') => {
    if (!feedback || !obj.scene) return;
    scaleTween?.stop();
    scaleTween = scene.tweens.add({ targets: obj, scale: baseScale * factor, duration, ease });
  };
  const rest = () => (hovered && cursor ? 1.04 : 1);

  obj.on('pointerover', () => {
    hovered = true;
    if (!pressed) scaleTo(rest(), 120);
  });
  obj.on('pointerdown', () => {
    pressed = true;
    scaleTo(0.92, 70);
  });
  obj.on('pointerout', () => {
    pressed = false;
    hovered = false;
    scaleTo(1, 150);
  });
  obj.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    scaleTo(rest(), 320, 'Back.easeOut'); // пружинит обратно
    audio.tap();
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

  const amount = scene.add.container(x, y, [coin, text]).setSize(width, radius * 2);
  amount.label = text;
  return amount;
}

// Счётчик монет игрока в «таблетке». anchor — какой стороной он привязан к x: left, center или right.
// from — с какого числа начать показ (если монеты ещё «летят»); потом вызвать tickTo(coins).
// У результата: coinPoint — куда лететь монетам, tickTo(value) — докрутить число, bump() — подпрыгнуть.
export function addCoinCounter(scene, x, y, coins, anchor = 'center', from = coins) {
  const u = scene.u;
  const amount = addCoinAmount(scene, 0, 0, coins, 28);
  const w = amount.width + 36 * u;
  const h = 52 * u;

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  bg.lineStyle(3 * u, COLORS.outline, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

  const shift = anchor === 'left' ? w / 2 : anchor === 'right' ? -w / 2 : 0;
  const counter = scene.add.container(x + shift, y, [bg, amount]);
  amount.label.setText(String(from));

  counter.coinPoint = { x: counter.x - amount.width / 2 + 14 * u, y };
  counter.bump = () => {
    counter.setScale(1.15);
    scene.tweens.add({ targets: counter, scale: 1, duration: 160, ease: 'Quad.easeOut' });
  };
  counter.tickTo = (value) => {
    scene.tweens.addCounter({
      from,
      to: value,
      duration: 500,
      onUpdate: (tween) => amount.label.active && amount.label.setText(String(Math.round(tween.getValue()))),
    });
  };
  return counter;
}

// Три звезды в ряд с центром в (x, y): count золотых, остальные серые. radius — в пикселях.
// animate: true — золотые по очереди «выпрыгивают», на каждую вызывается onPop(номер).
export function addStars(scene, x, y, count, radius, { animate = false, onPop } = {}) {
  const row = scene.add.container(x, y);
  for (let i = 0; i < 3; i += 1) {
    const filled = i < count;
    const star = scene.add.star((i - 1) * radius * 2.3, 0, 5, radius * 0.48, radius, filled ? COLORS.coin : COLORS.locked);
    if (filled) star.setStrokeStyle(Math.max(1, radius * 0.1), COLORS.outline);
    row.add(star);
    if (filled && animate) {
      star.setScale(0);
      scene.tweens.add({
        targets: star,
        scale: 1,
        duration: 320,
        delay: 350 + i * 260,
        ease: 'Back.easeOut',
        onStart: () => onPop?.(i),
      });
    }
  }
  return row;
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
      textColor: button.textColor,
      size: 30,
    }),
  );

  return scene.add.container(0, 0, [shade, blocker, panel, heading, ...items]);
}

// Облачко с репликой, центр в (x, y), ширина не больше maxW. Текст печатается по буквам.
export function addBubble(scene, x, y, maxW, str) {
  const u = scene.u;
  const pad = 22 * u;
  const text = addText(scene, 0, 0, str, 28, { align: 'left', wordWrap: { width: maxW - pad * 2 } });
  const textW = text.width;
  const textH = text.height;
  const w = Math.min(maxW, textW + pad * 2);
  const h = textH + pad * 2;

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22 * u);
  bg.lineStyle(3 * u, COLORS.outline, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 22 * u);

  // Размер облачка посчитан по полному тексту. Дальше текст печатается от левого края:
  // строки зафиксированы заранее, чтобы слова не прыгали между строками.
  const full = text.getWrappedText(str).join('\n');
  text.setWordWrapWidth(null).setOrigin(0, 0).setPosition(-textW / 2, -textH / 2).setText('');
  const typing = scene.tweens.addCounter({
    from: 0,
    to: full.length,
    duration: Math.min(1400, full.length * 22),
    onUpdate: (tween) => text.active && text.setText(full.slice(0, Math.round(tween.getValue()))),
  });

  const bubble = scene.add.container(x, y, [bg, text]);
  // облачко могут заменить новым, не дожидаясь конца печати
  bubble.once('destroy', () => typing.stop());
  // появляется, слегка подпрыгнув
  bubble.setScale(0.85);
  scene.tweens.add({ targets: bubble, scale: 1, duration: 220, ease: 'Back.easeOut' });
  return bubble;
}
