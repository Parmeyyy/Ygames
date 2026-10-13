import { buildObjects, makeDraggable } from './objects.js';

// catch — успей подставить предмет, пока что-то падает.
//   catch: { fall, onto, with, ms, delay }
//     fall  — id падающего объекта, onto — id места, куда он упадёт,
//     with  — id предмета, который нужно туда подложить,
//     ms    — сколько длится падение, delay — пауза перед каждым падением,
//     avoid — наоборот: предмет with уже лежит на месте, и его нужно успеть убрать
// Если к концу движения предмет лежит на месте (или, при avoid, убран) — уровень решён.
// Иначе ошибка, и всё повторяется.
export function buildCatch(scene, level, field, api) {
  const objects = buildObjects(scene, level, field, api);
  const { fall, onto, with: catcherId, ms, delay = 1000, avoid = false } = level.catch;
  const falling = objects.get(fall);
  const spot = objects.get(onto);
  const catcher = objects.get(catcherId);
  const start = { x: falling.object.x, y: falling.object.y };
  // куда прилетает объект: падающий ложится на место сверху, идущий доходит до него по земле
  const end = { x: spot.object.x, y: avoid ? start.y : spot.object.y - falling.h * 0.3 };
  let timer = null;
  let tween = null;

  // предмет можно класть куда угодно: он остаётся там, где его отпустили
  makeDraggable(scene, catcher.object);
  catcher.object.on('dragstart', () => scene.children.bringToTop(catcher.object));

  const placed = () =>
    Math.abs(catcher.object.x - spot.object.x) <= spot.w / 2 + catcher.w * 0.25 &&
    Math.abs(catcher.object.y - spot.object.y) <= spot.h / 2 + catcher.h * 0.5;

  const drop = () => {
    if (scene.solved) return;
    falling.object.setPosition(start.x, start.y).setAngle(0);
    timer = scene.time.delayedCall(delay, () => {
      tween = scene.tweens.add({
        targets: falling.object,
        x: end.x,
        y: end.y,
        angle: avoid ? 0 : 40,
        duration: ms,
        ease: avoid ? 'Linear' : 'Quad.easeIn',
        onComplete: () => {
          if (placed() !== avoid) {
            api.correct();
          } else {
            api.wrong();
            drop();
          }
        },
      });
    });
  };

  if (scene.solved) falling.object.setPosition(end.x, end.y);
  else drop();

  return {
    objects,
    destroy: () => {
      timer?.remove();
      tween?.stop();
    },
  };
}
