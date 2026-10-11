import { labelOf } from '../i18n/index.js';
import { addButton } from '../ui/widgets.js';
import { uiTarget } from './index.js';

// action — действие с экраном:
//   { kind: "wait", seconds }  — подождать, ничего не нажимая из приманок
//   { kind: "tap", target }    — нажать на элемент интерфейса ("ui:question", "ui:egg", ...)
// decoys — кнопки-приманки, нажатие на них считается ошибкой.
export function buildAction(scene, level, field, api) {
  const { action, decoys = [] } = level;
  const u = scene.u;
  let timer = null;

  const startWaiting = () => {
    timer?.remove();
    timer = scene.time.delayedCall(action.seconds * 1000, api.correct);
  };

  const gap = 24 * u;
  const w = Math.min(field.w, 480 * u);
  const h = Math.min((field.h - gap * (decoys.length - 1)) / Math.max(decoys.length, 1), 130 * u);
  const top = field.y + (field.h - (h * decoys.length + gap * (decoys.length - 1))) / 2;

  decoys.forEach((decoy, index) => {
    const y = top + index * (h + gap) + h / 2;
    addButton(scene, field.x + field.w / 2, y, w, h, labelOf(level, decoy), () => {
      api.wrong();
      if (action.kind === 'wait') startWaiting();
    });
  });

  if (action.kind === 'wait') {
    startWaiting();
  } else if (action.kind === 'tap') {
    api.bindTarget(uiTarget(action.target), api.correct);
  } else {
    console.warn(`Уровень ${level.id}: неизвестное действие "${action.kind}"`);
  }

  return { destroy: () => timer?.remove() };
}
