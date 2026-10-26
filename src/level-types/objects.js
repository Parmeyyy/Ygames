import { COLORS, TEXT } from '../config.js';
import { labelOf } from '../i18n/index.js';
import { addHat } from '../ui/hats.js';
import { addShape, hasShape } from '../ui/shapes.js';
import { addText } from '../ui/widgets.js';

// Общий слой объектов уровня. Каждый объект из level.objects:
//   id, x, y        — центр в долях игрового поля (0..1)
//   at              — вместо x, y: [id, dx, dy] — относительно другого объекта, в долях его размера;
//                     id может быть частью Валеры: "hero:mouth", "hero:hand" и т. п.
//   shape           — вид (см. ниже); по умолчанию "chip" — кружок с подписью
//   label | labelKey — подпись для chip, word, button; у картинки — надпись поверх неё
//   size            — ширина в дизайн-единицах (для картинок, chip и word)
//   w, h            — размер в долях поля (для button, box, zone, card)
//   box             — вместо w, h: [w, h] в долях размера объекта из at
//   color           — цвет для box, textColor — цвет текста для word
//   item            — id предмета гардероба для вида "item"
//   hidden          — объект появится позже (его покажет шаг уровня)
//   draggable       — объект можно таскать
//   inert           — объект не реагирует на нажатия
//   wrong           — нажать (или стереть, или перетащить) этот объект — ошибка
//   erasable        — объект можно стереть (для типа erase)
//   fly             — объект кружит на месте (комары, бабочки)
// Виды: chip, word, button, figure, box (цветной прямоугольник), dot (цветной кружок),
// ring (кольцо-отметка), zone (невидимая зона),
// card (защитный слой), clock (часы со стрелкой), item (предмет гардероба)
// и картинки из src/ui/shapes.js.
// Объекты рисуются в порядке списка: следующий поверх предыдущего.
//
// Возвращает Map: id → { def, object, w, h, picture, size } (object — контейнер с центром в точке объекта).
// maxSize — предел размера картинок в пикселях (когда под объекты отведена узкая полоса).
export function buildObjects(scene, level, field, api, maxSize = Infinity) {
  const list = level.objects ?? [];
  const u = scene.u;
  const entries = new Map();

  for (const def of list) {
    let parent = def.at ? entries.get(def.at[0]) : null;
    if (def.at?.[0].startsWith('hero:')) {
      const zone = api.target('hero').zone(def.at[0].slice(5));
      parent = { object: zone, w: zone.radius * 2, h: zone.radius * 2 };
    }
    const x = parent ? parent.object.x + def.at[1] * parent.w : field.x + def.x * field.w;
    const y = parent ? parent.object.y + def.at[2] * parent.h : field.y + def.y * field.h;
    const shape = def.shape ?? 'chip';
    // картинка не должна вылезать из поля по высоте
    const size = Math.min((def.size ?? 140) * u, maxSize);
    const rectW = def.box && parent ? def.box[0] * parent.w : (def.w ?? 0.2) * field.w;
    const rectH = def.box && parent ? def.box[1] * parent.h : (def.h ?? 0.2) * field.h;
    let parts;
    let w = size;
    let h = size;

    if (shape === 'chip') {
      const bg = scene.add.graphics();
      bg.fillStyle(COLORS.white, 1).fillCircle(0, 0, size / 2);
      bg.lineStyle(3 * u, COLORS.outline, 1).strokeCircle(0, 0, size / 2);
      const text = addText(scene, 0, 0, labelOf(level, def), 48, { fontStyle: 'bold' });
      if (text.width > size * 0.75) text.setScale((size * 0.75) / text.width);
      parts = [bg, text];
    } else if (shape === 'word') {
      const text = addText(scene, 0, 0, labelOf(level, def), def.size ?? 46, {
        fontStyle: 'bold',
        color: def.textColor ?? TEXT.dark,
      });
      parts = [text];
      w = text.width;
      h = text.height;
    } else if (shape === 'button') {
      w = rectW;
      h = rectH;
      const radius = Math.min(h / 2, 28 * u);
      const bg = scene.add.graphics();
      bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-w / 2, -h / 2 + 6 * u, w, h, radius);
      bg.fillStyle(def.color ? Number(def.color) : COLORS.accent, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);
      const text = addText(scene, 0, 0, labelOf(level, def), 44, { fontStyle: 'bold', color: TEXT.light });
      if (text.width > w - 28 * u) text.setScale(Math.max(0, w - 28 * u) / text.width);
      parts = [bg, text];
    } else if (shape === 'figure') {
      parts = [drawFigure(scene, level.figure, size)];
    } else if (shape === 'box') {
      w = rectW;
      h = rectH;
      const g = scene.add.graphics();
      g.fillStyle(Number(def.color ?? COLORS.locked), 1).fillRoundedRect(-w / 2, -h / 2, w, h, 12 * u);
      g.lineStyle(4 * u, COLORS.outline, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * u);
      parts = [g];
    } else if (shape === 'dot' || shape === 'ring') {
      const g = scene.add.graphics();
      if (shape === 'dot') {
        g.fillStyle(Number(def.color ?? 0x9aa5b1), 1).fillCircle(0, 0, size / 2);
        g.lineStyle(3 * u, COLORS.outline, 1).strokeCircle(0, 0, size / 2);
      } else {
        g.lineStyle(7 * u, Number(def.color ?? 0xd63d3d), 1).strokeCircle(0, 0, size / 2);
      }
      parts = [g];
    } else if (shape === 'card') {
      w = rectW;
      h = rectH;
      const g = scene.add.graphics();
      g.fillStyle(0xb9bcc4, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 20 * u);
      g.lineStyle(4 * u, COLORS.outline, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 20 * u);
      const marks = addText(scene, 0, 0, '? ? ?', 64, { fontStyle: 'bold', color: TEXT.light });
      parts = [g, marks];
    } else if (shape === 'zone') {
      w = rectW;
      h = rectH;
      parts = [];
    } else if (shape === 'clock') {
      parts = [drawClock(scene, size)];
    } else if (shape === 'item') {
      parts = [addHat(scene, def.item, 0, 0, size, true)];
      h = size * 0.6;
    } else if (hasShape(shape)) {
      const picture = addShape(scene, shape, size, { fit: true });
      parts = [picture.object];
      w = picture.w;
      h = picture.h;
      if (def.label || def.labelKey) {
        // белая обводка, чтобы надпись читалась на любой картинке
        parts.push(
          addText(scene, 0, 0, labelOf(level, def), def.labelSize ?? 34, {
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 7 * u,
          }),
        );
      }
    } else {
      console.warn(`Уровень ${level.id}: неизвестный вид объекта "${shape}"`);
      continue;
    }

    const object = scene.add.container(x, y, parts).setSize(w, h);
    if (def.hidden) object.setVisible(false);
    if (def.fly) {
      // у каждого свой темп, чтобы не летали строем
      const pace = 700 + (entries.size % 5) * 130;
      scene.tweens.add({ targets: object, x: x + 34 * u, duration: pace, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
      scene.tweens.add({ targets: object, y: y - 26 * u, duration: pace * 0.7, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }
    entries.set(def.id, { def, object, w, h, picture: parts[0], size });
    api.mark(def.id, object);
  }

  return entries;
}

// Фигура из отрезков: координаты точек — доли квадрата size × size
function drawFigure(scene, figure, size) {
  const g = scene.add.graphics();
  g.lineStyle(Math.max(3, size * 0.02), COLORS.outline, 1);
  const at = (name) => [(figure.points[name][0] - 0.5) * size, (figure.points[name][1] - 0.5) * size];
  for (const [from, to] of figure.segments) g.lineBetween(...at(from), ...at(to));
  return g;
}

// Настенные часы. У результата есть setTurn(радианы) — повернуть минутную стрелку.
function drawClock(scene, size) {
  const face = scene.add.graphics();
  face.fillStyle(COLORS.white, 1).fillCircle(0, 0, size * 0.48);
  face.lineStyle(Math.max(4, size * 0.04), COLORS.outline, 1).strokeCircle(0, 0, size * 0.48);
  face.fillStyle(COLORS.outline, 1);
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    face.fillCircle(Math.sin(angle) * size * 0.4, -Math.cos(angle) * size * 0.4, size * (i % 3 ? 0.012 : 0.022));
  }
  // часовая стрелка стоит, минутная крутится
  face.lineStyle(Math.max(5, size * 0.035), COLORS.outline, 1).lineBetween(0, 0, size * 0.2, -size * 0.1);
  const hand = scene.add.graphics();
  hand.lineStyle(Math.max(4, size * 0.025), 0xd63d3d, 1).lineBetween(0, 0, 0, -size * 0.38);
  hand.fillStyle(COLORS.outline, 1).fillCircle(0, 0, size * 0.03);
  const clock = scene.add.container(0, 0, [face, hand]);
  clock.setTurn = (angle) => hand.setRotation(angle);
  return clock;
}

// Разрешает таскать объект. onDrop(object, start) вызывается, когда его отпустили;
// start — где он был, когда его взяли. minY — выше этой линии объект не поднимается.
export function makeDraggable(scene, object, onDrop = () => {}, { minY = -Infinity } = {}) {
  // объект мог уже стать интерактивным (Валера), тогда настройки из setInteractive не применятся
  object.setInteractive({ useHandCursor: true });
  scene.input.setDraggable(object);
  let start = { x: object.x, y: object.y };
  object.on('dragstart', () => {
    start = { x: object.x, y: object.y };
  });
  object.on('drag', (pointer, dragX, dragY) => object.setPosition(dragX, Math.max(dragY, minY)));
  object.on('dragend', () => onDrop(object, start));
}
