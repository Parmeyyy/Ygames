import { COLORS, TEXT } from '../config.js';
import { labelOf, levelText } from '../i18n/index.js';
import { addButton } from '../ui/widgets.js';
import { countLetter, countTriangles } from './computed.js';
import { buildObjects } from './objects.js';

// Варианты ответа уровня. Обычно они заданы в файле (options + answer), но ответ может считаться кодом:
//   compute: "letterCount" — сколько раз буква levels.<id>.letter встречается в тексте вопроса
//   compute: "triangles"   — сколько треугольников в фигуре level.figure
// Тогда варианты строятся вокруг верного числа по сдвигам computeOffsets (0 — верный ответ).
export function resolveChoice(level) {
  if (!level.compute) return { options: level.options, answer: level.answer };

  const correct =
    level.compute === 'letterCount'
      ? countLetter(levelText(level, 'question'), levelText(level, 'letter'))
      : countTriangles(level.figure);
  const options = level.computeOffsets.map((offset) => ({ id: String(correct + offset), label: String(correct + offset) }));
  return { options, answer: String(correct) };
}

// choice — выбери вариант ответа. Если у уровня есть objects, они рисуются над вариантами как иллюстрация.
export function buildChoice(scene, level, field, api) {
  const u = scene.u;
  const { options, answer } = resolveChoice(level);

  let area = field;
  let objects = new Map();
  if (level.objects?.length) {
    const pictureH = field.h * 0.45;
    objects = buildObjects(scene, level, { ...field, h: pictureH }, api, pictureH * 0.9);
    area = { ...field, y: field.y + pictureH, h: field.h - pictureH };
  }

  const gap = 24 * u;
  const cols = area.w > area.h * 1.2 ? 2 : 1;
  const rows = Math.ceil(options.length / cols);

  const w = Math.min((area.w - gap * (cols - 1)) / cols, 560 * u);
  const h = Math.min((area.h - gap * (rows - 1)) / rows, 120 * u);
  const left = area.x + (area.w - (w * cols + gap * (cols - 1))) / 2;
  const top = area.y + (area.h - (h * rows + gap * (rows - 1))) / 2;

  options.forEach((option, index) => {
    const x = left + (index % cols) * (w + gap) + w / 2;
    const y = top + Math.floor(index / cols) * (h + gap) + h / 2;
    const onTap = option.id === answer ? api.correct : api.wrong;
    const button = addButton(scene, x, y, w, h, labelOf(level, option), onTap, {
      fill: COLORS.white,
      textColor: TEXT.dark,
      size: 38,
    });
    api.mark(`option:${option.id}`, button);
  });

  return { objects };
}
