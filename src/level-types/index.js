import { buildTap } from './tap.js';
import { buildChoice } from './choice.js';
import { buildAction } from './action.js';

// Строитель типа уровня: (scene, level, field, api) → необязательный { destroy() }.
//   field — прямоугольник игрового поля { x, y, w, h } в пикселях
//   api   — { correct(), wrong(), bindTarget(name, onTap) }
// Строитель вызывается заново при каждом изменении размера окна.
// Новый тип (например drag) — новый файл и строчка здесь.
export const LEVEL_TYPES = {
  tap: buildTap,
  choice: buildChoice,
  action: buildAction,
};

// "ui:egg" → "egg"; для обычных id объектов — null
export const uiTarget = (id) => (typeof id === 'string' && id.startsWith('ui:') ? id.slice(3) : null);
