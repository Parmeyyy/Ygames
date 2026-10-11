import { buildObjects } from './objects.js';

// wait — уровень проходится, если ничего не нажимать seconds секунд.
// Любое нажатие (кроме кнопок интерфейса: меню, подсказка, пропуск) — ошибка, отсчёт начинается заново.
export function buildWait(scene, level, field, api) {
  const objects = buildObjects(scene, level, field, api);
  let timer = null;

  const restart = () => {
    timer?.remove();
    timer = scene.time.delayedCall(level.seconds * 1000, api.correct);
  };

  const onPress = (pointer, over) => {
    if (api.isUiPress(over)) return;
    api.wrong();
    restart();
  };

  scene.input.on('pointerdown', onPress);
  restart();

  return {
    objects,
    destroy: () => {
      timer?.remove();
      scene.input.off('pointerdown', onPress);
    },
  };
}
