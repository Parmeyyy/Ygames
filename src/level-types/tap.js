import { makeTappable } from '../ui/widgets.js';
import { uiTarget } from './index.js';
import { buildObjects, makeDraggable } from './objects.js';

// tap — тапни правильный объект.
//   answer         — id объекта или элемент интерфейса ("ui:...")
//   answerMovesTo  — id объекта, за который правильный объект уезжает после нажатия (необязательно)
// Объекты с draggable можно сдвигать (под ними может прятаться ответ), с inert — просто декорации.
export function buildTap(scene, level, field, api) {
  const objects = buildObjects(scene, level, field, api);

  const onAnswer = (entry) => {
    const cover = objects.get(level.answerMovesTo);
    if (cover && !scene.solved) {
      scene.tweens.add({ targets: entry.object, x: cover.object.x, y: cover.object.y, duration: 500, ease: 'Quad.easeInOut' });
    }
    api.correct();
  };

  for (const entry of objects.values()) {
    const { def, object } = entry;
    if (def.inert) continue;
    if (def.draggable) makeDraggable(scene, object);
    else makeTappable(object, def.id === level.answer ? () => onAnswer(entry) : api.wrong);
  }

  const target = uiTarget(level.answer);
  if (target) api.bindTarget(target, api.correct);

  return { objects };
}
