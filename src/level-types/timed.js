import { buildDrag } from './drag.js';
import { buildTap } from './tap.js';

// timed — действие засчитывается только в нужный момент.
//   signal: { light, red, green } — id объекта-светофора и длительность сигналов в миллисекундах
//   или signal: { frames: [{ id, ms }], good } — объекты показываются по очереди (вид за окном),
//   действие засчитывается, пока виден объект good
// Само действие описывается как в drag (поле goal) или в tap (поле answer).
// Действие не вовремя — ошибка.
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

  let timer = null;
  if (signal.frames) {
    const showFrame = (index) => {
      const frame = signal.frames[index];
      for (const { id } of signal.frames) inner.objects.get(id)?.object.setVisible(id === frame.id);
      green = frame.id === signal.good;
      timer = scene.time.delayedCall(frame.ms, () => showFrame((index + 1) % signal.frames.length));
    };
    showFrame(0);
  } else {
    const light = inner.objects.get(signal.light)?.picture;
    const setSignal = (value) => {
      green = value;
      light?.setLight?.(green);
      timer = scene.time.delayedCall(green ? signal.green : signal.red, () => setSignal(!green));
    };
    setSignal(false);
  }

  return {
    objects: inner.objects,
    destroy: () => {
      timer?.remove();
      inner.destroy?.();
    },
  };
}
