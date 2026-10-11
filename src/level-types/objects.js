import { COLORS, TEXT } from '../config.js';
import { labelOf } from '../i18n/index.js';
import { Egg } from '../ui/Egg.js';
import { addShape, hasShape } from '../ui/shapes.js';
import { addText } from '../ui/widgets.js';

// Общий слой объектов уровня. Каждый объект из level.objects:
//   id, x, y        — центр в долях игрового поля (0..1)
//   shape           — вид (см. ниже); по умолчанию "chip" — кружок с подписью
//   label | labelKey — подпись для chip, word, button
//   size            — ширина в дизайн-единицах (для картинок, chip и word)
//   w, h            — размер в долях поля (для button, road, ground, zone, goal, arrow)
//   textColor       — цвет текста для word
//   draggable       — объект можно таскать
//   inert           — объект не реагирует на нажатия
//   erasable        — объект можно стереть (для типа erase)
// Виды: chip, word, button, egg, figure, road, ground, zone (невидимая зона), goal (подсвеченная зона-цель),
// arrow (пунктирная стрелка вправо), card (защитный слой, как на лотерейном билете)
// и картинки из src/ui/shapes.js.
// Объекты рисуются в порядке списка: следующий поверх предыдущего.
//
// Возвращает Map: id → { def, object, w, h } (object — контейнер с центром в точке объекта).
// maxSize — предел размера картинок в пикселях (когда под объекты отведена узкая полоса).
export function buildObjects(scene, level, field, api, maxSize = Infinity) {
  const list = level.objects ?? [];
  const u = scene.u;
  const entries = new Map();

  for (const def of list) {
    const x = field.x + def.x * field.w;
    const y = field.y + def.y * field.h;
    const shape = def.shape ?? 'chip';
    const size = Math.min((def.size ?? 140) * u, maxSize);
    const rectW = (def.w ?? 0.2) * field.w;
    const rectH = (def.h ?? 0.2) * field.h;
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
      bg.fillStyle(COLORS.accent, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);
      const text = addText(scene, 0, 0, labelOf(level, def), 44, { fontStyle: 'bold', color: TEXT.light });
      if (text.width > w - 28 * u) text.setScale(Math.max(0, w - 28 * u) / text.width);
      parts = [bg, text];
    } else if (shape === 'egg') {
      // маленькое яйцо без шапки и трещин; size — его высота
      const egg = new Egg(scene, 0, 0, size, def.mood ?? 'idle', null, 0);
      parts = [egg];
      w = egg.eggW;
    } else if (shape === 'figure') {
      parts = [drawFigure(scene, level.figure, size)];
    } else if (shape === 'road') {
      w = rectW;
      h = rectH;
      const g = scene.add.graphics();
      g.fillStyle(0x5c5c66, 1).fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle(COLORS.white, 1);
      for (let dash = -h / 2 + h * 0.04; dash < h / 2; dash += h * 0.14) g.fillRect(-w * 0.03, dash, w * 0.06, h * 0.08);
      parts = [g];
    } else if (shape === 'ground') {
      w = rectW;
      h = rectH;
      const g = scene.add.graphics();
      g.fillStyle(0x7fb069, 1).fillRect(-w / 2, -h / 2, w, h);
      g.lineStyle(4 * u, COLORS.outline, 1).lineBetween(-w / 2, -h / 2, w / 2, -h / 2);
      parts = [g];
    } else if (shape === 'goal') {
      w = rectW;
      h = rectH;
      const g = scene.add.graphics();
      g.fillStyle(0xb9f2a4, 0.85).fillRect(-w / 2, -h / 2, w, h);
      // пунктирная рамка
      g.fillStyle(COLORS.success, 1);
      const dash = 18 * u;
      const thick = 5 * u;
      for (let d = -w / 2; d < w / 2; d += dash * 2) {
        const len = Math.min(dash, w / 2 - d);
        g.fillRect(d, -h / 2, len, thick).fillRect(d, h / 2 - thick, len, thick);
      }
      for (let d = -h / 2; d < h / 2; d += dash * 2) {
        const len = Math.min(dash, h / 2 - d);
        g.fillRect(-w / 2, d, thick, len).fillRect(w / 2 - thick, d, thick, len);
      }
      // мягко мигает, чтобы цель было видно сразу
      scene.tweens.add({ targets: g, alpha: 0.55, duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
      parts = [g];
    } else if (shape === 'arrow') {
      w = rectW;
      h = 40 * u;
      const g = scene.add.graphics();
      g.fillStyle(COLORS.white, 0.95);
      const dash = 22 * u;
      const head = 34 * u;
      for (let d = -w / 2; d < w / 2 - head - dash * 0.5; d += dash * 1.7) g.fillRect(d, -5 * u, dash, 10 * u);
      g.fillTriangle(w / 2, 0, w / 2 - head, -head * 0.6, w / 2 - head, head * 0.6);
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
    } else if (hasShape(shape)) {
      const picture = addShape(scene, shape, size);
      parts = [picture.object];
      w = picture.w;
      h = picture.h;
    } else {
      console.warn(`Уровень ${level.id}: неизвестный вид объекта "${shape}"`);
      continue;
    }

    const object = scene.add.container(x, y, parts).setSize(w, h);
    entries.set(def.id, { def, object, w, h, picture: parts[0] });
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

// Разрешает таскать объект. onDrop(object) вызывается, когда его отпустили.
export function makeDraggable(scene, object, onDrop = () => {}) {
  // объект мог уже стать интерактивным (яйцо-герой), тогда настройки из setInteractive не применятся
  object.setInteractive({ useHandCursor: true });
  scene.input.setDraggable(object);
  object.on('drag', (pointer, dragX, dragY) => object.setPosition(dragX, dragY));
  object.on('dragend', () => onDrop(object));
}
