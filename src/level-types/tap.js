import { makeTappable } from '../ui/widgets.js';
import { uiTarget } from './index.js';
import { buildObjects, makeDraggable } from './objects.js';

// tap — тапни правильный объект.
//   answer         — id объекта или элемент интерфейса ("ui:...")
//   answerMovesTo  — id объекта, за который правильный объект уезжает после нажатия (необязательно)
// Объекты с draggable можно сдвигать (под ними может прятаться ответ), с inert — просто декорации.
//   reveal: { on, count, show } — после count нажатий на объект on появляются спрятанные объекты show
//                                 (потряс яблоню — упали яблоки); эти нажатия ошибкой не считаются
export function buildTap(scene, level, field, api) {
  const objects = buildObjects(scene, level, field, api);

  const onAnswer = (entry) => {
    const cover = objects.get(level.answerMovesTo);
    if (cover && !scene.solved) {
      scene.tweens.add({ targets: entry.object, x: cover.object.x, y: cover.object.y, duration: 500, ease: 'Quad.easeInOut' });
    }
    api.correct();
  };

  const { reveal } = level;
  const showRevealed = () => {
    for (const id of reveal.show) objects.get(id)?.object.setVisible(true);
  };
  if (reveal && api.state.revealed) showRevealed();

  for (const entry of objects.values()) {
    const { def, object } = entry;
    if (def.inert) continue;
    if (reveal?.on === def.id) {
      let taps = 0;
      makeTappable(object, () => {
        taps += 1;
        scene.tweens.add({ targets: object, angle: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => object.setAngle(0) });
        if (taps >= reveal.count && !api.state.revealed) {
          api.state.revealed = true;
          showRevealed();
        }
      }, { cursor: false, feedback: false });
      continue;
    }
    // сдвигаемые объекты не должны закрыть собой кнопки «Меню» и «Подсказка»
    if (def.draggable) makeDraggable(scene, object, undefined, { minY: 130 * scene.u });
    else makeTappable(object, def.id === level.answer ? () => onAnswer(entry) : api.wrong);
  }

  const target = uiTarget(level.answer);
  if (target) api.bindTarget(target, api.correct);

  return { objects };
}
