import { COLORS, TEXT } from '../config.js';
import { labelOf } from '../i18n/index.js';
import { addButton } from '../ui/widgets.js';

// choice — выбери вариант ответа
export function buildChoice(scene, level, field, api) {
  const u = scene.u;
  const gap = 24 * u;
  const cols = field.w > field.h * 1.2 ? 2 : 1;
  const rows = Math.ceil(level.options.length / cols);

  const w = Math.min((field.w - gap * (cols - 1)) / cols, 560 * u);
  const h = Math.min((field.h - gap * (rows - 1)) / rows, 120 * u);
  const left = field.x + (field.w - (w * cols + gap * (cols - 1))) / 2;
  const top = field.y + (field.h - (h * rows + gap * (rows - 1))) / 2;

  level.options.forEach((option, index) => {
    const x = left + (index % cols) * (w + gap) + w / 2;
    const y = top + Math.floor(index / cols) * (h + gap) + h / 2;
    const onTap = option.id === level.answer ? api.correct : api.wrong;
    addButton(scene, x, y, w, h, labelOf(level, option), onTap, {
      fill: COLORS.white,
      textColor: TEXT.dark,
      size: 38,
    });
  });
}
