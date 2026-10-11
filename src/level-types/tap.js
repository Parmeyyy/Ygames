import { COLORS } from '../config.js';
import { labelOf } from '../i18n/index.js';
import { addText, makeTappable } from '../ui/widgets.js';
import { uiTarget } from './index.js';

// tap — тапни правильный объект. Ответом может быть и элемент интерфейса (answer: "ui:...").
export function buildTap(scene, level, field, api) {
  const u = scene.u;
  const radius = Math.min(70 * u, field.w / 8, field.h / 5);

  for (const object of level.objects) {
    const x = field.x + radius + object.x * (field.w - radius * 2);
    const y = field.y + radius + object.y * (field.h - radius * 2);

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.white, 1).fillCircle(0, 0, radius);
    bg.lineStyle(3 * u, COLORS.outline, 1).strokeCircle(0, 0, radius);
    const text = addText(scene, 0, 0, labelOf(level, object), 48, { fontStyle: 'bold' });
    if (text.width > radius * 1.5) text.setScale((radius * 1.5) / text.width);

    const chip = scene.add.container(x, y, [bg, text]).setSize(radius * 2, radius * 2);
    makeTappable(chip, object.id === level.answer ? api.correct : api.wrong);
  }

  const target = uiTarget(level.answer);
  if (target) api.bindTarget(target, api.correct);
}
