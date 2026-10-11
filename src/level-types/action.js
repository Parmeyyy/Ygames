import { hasText, labelOf, levelText } from '../i18n/index.js';
import { addButton } from '../ui/widgets.js';
import { uiTarget } from './index.js';

// action — нажать на элемент интерфейса:
//   action: { kind: "tap", target, count, within }
//     target — "ui:egg", "ui:question" или "ui:levelNumber"
//     count  — сколько нажатий нужно (по умолчанию 1), within — за сколько миллисекунд
// decoys — кнопки-приманки на поле, нажатие на них считается ошибкой.
// Если нажатий нужно несколько, на каждое неполное яйцо отвечает репликой levels.<id>.partial.
export function buildAction(scene, level, field, api) {
  const { action, decoys = [] } = level;
  const u = scene.u;

  const gap = 24 * u;
  const w = Math.min(field.w, 480 * u);
  const h = Math.min((field.h - gap * (decoys.length - 1)) / Math.max(decoys.length, 1), 130 * u);
  const top = field.y + (field.h - (h * decoys.length + gap * (decoys.length - 1))) / 2;

  decoys.forEach((decoy, index) => {
    const y = top + index * (h + gap) + h / 2;
    const button = addButton(scene, field.x + field.w / 2, y, w, h, labelOf(level, decoy), api.wrong);
    api.mark(decoy.id, button);
  });

  if (action.kind !== 'tap') {
    console.warn(`Уровень ${level.id}: неизвестное действие "${action.kind}"`);
    return {};
  }

  const count = action.count ?? 1;
  let taps = [];
  api.bindTarget(uiTarget(action.target), () => {
    const now = scene.time.now;
    taps = [...taps.filter((time) => now - time <= (action.within ?? Infinity)), now];
    if (taps.length >= count) api.correct();
    else if (hasText(`levels.${level.id}.partial`)) api.say(levelText(level, 'partial'));
  });

  return {};
}
