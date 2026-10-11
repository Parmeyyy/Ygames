import { buildAction } from './action.js';
import { buildChoice } from './choice.js';
import { buildDrag } from './drag.js';
import { buildFlashlight } from './flashlight.js';
import { buildTap } from './tap.js';
import { buildTimed } from './timed.js';
import { buildWait } from './wait.js';

// Строитель типа уровня: (scene, level, field, api) → { objects, destroy() } (оба поля необязательны).
//   field — прямоугольник игрового поля { x, y, w, h } в пикселях
//   api   — что уровень может делать со сценой:
//     correct()             — уровень решён; возвращает true, если ответ принят
//     wrong()               — ошибка
//     bindTarget(name, fn)  — сделать элемент интерфейса нажимаемым
//     target(name)          — элемент интерфейса: "egg", "question", "levelNumber"
//     say(line)             — реплика яйца
//     isUiPress(over)       — нажатие пришлось на кнопки интерфейса
//     mark(id, object)      — запомнить объект под именем (нужно автотестам в режиме разработки)
// Строитель вызывается заново при каждом изменении размера окна.
// Новый тип — новый файл и строчка здесь.
export const LEVEL_TYPES = {
  tap: buildTap,
  choice: buildChoice,
  action: buildAction,
  drag: buildDrag,
  wait: buildWait,
  flashlight: buildFlashlight,
  timed: buildTimed,
};

// "ui:egg" → "egg"; для обычных id объектов — null
export const uiTarget = (id) => (typeof id === 'string' && id.startsWith('ui:') ? id.slice(3) : null);
