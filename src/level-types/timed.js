import { buildDrag } from './drag.js';
import { buildTap } from './tap.js';

// timed — действие засчитывается только в нужный момент.
//   signal: { light, red, green } — id объекта-светофора и длительность сигналов в миллисекундах
// Само действие описывается как в drag (поле goal) или в tap (поле answer).
// Действие на красный — ошибка.
export function buildTimed(scene, level, field, api) {
  const { signal } = level;
  let green = false;

  const inner = (level.goal ? buildDrag : buildTap)(scene, level, field, {
    ...api,
    correct: () => {
      if (green) return api.correct();
      api.wrong();
      return false;
    },
  });

  const light = inner.objects.get(signal.light)?.picture;
  let timer = null;
  const setSignal = (value) => {
    green = value;
    light?.setLight?.(green);
    timer = scene.time.delayedCall(green ? signal.green : signal.red, () => setSignal(!green));
  };
  setSignal(false);

  return {
    objects: inner.objects,
    destroy: () => {
      timer?.remove();
      inner.destroy?.();
    },
  };
}
