import { buildAction } from './action.js';
import { buildCatch } from './catch.js';
import { buildChoice } from './choice.js';
import { buildDrag } from './drag.js';
import { buildErase } from './erase.js';
import { buildFlashlight } from './flashlight.js';
import { buildSequence } from './sequence.js';
import { buildTap } from './tap.js';
import { buildTimed } from './timed.js';
import { buildWait } from './wait.js';

// Строитель типа уровня: (scene, level, field, api) → { objects, destroy() } (оба поля необязательны).
//   field — прямоугольник игрового поля { x, y, w, h } в пикселях
//   api   — что уровень может делать со сценой:
//     correct()             — уровень решён; возвращает true, если ответ принят
//     wrong(line)           — ошибка; line — своя реплика Валеры (необязательно)
//     bindTarget(name, fn)  — сделать элемент интерфейса нажимаемым
//     target(name)          — элемент интерфейса: "hero", "question", "levelNumber", "word"
//     coinSource()          — монета, которую можно вытащить из счётчика монет
//     say(line)             — реплика Валеры
//     state                 — объект, который переживает пересборку сцены (прогресс внутри уровня)
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
  erase: buildErase,
  catch: buildCatch,
  // уровни из шагов: один строитель, тип называет главную хитрость
  sequence: buildSequence,
  combine: buildSequence,
  wordDrag: buildSequence,
  offscreen: buildSequence,
  rotate: buildSequence,
};

// "ui:hero" → "hero"; для обычных id объектов — null
export const uiTarget = (id) => (typeof id === 'string' && id.startsWith('ui:') ? id.slice(3) : null);
