// Весь звук игры синтезируется кодом через Web Audio API: звуковых файлов в проекте нет.
// Эффекты: tap, correct, wrong, coin, buy, win. Плюс тихая фоновая мелодия по кругу.
//
// Браузер разрешает звук только после первого действия игрока, поэтому AudioContext
// создаётся при первом нажатии (см. unlock).

let ctx = null;
let master = null;
let enabled = true;
let paused = false;
let musicTimer = null;
let nextNoteTime = 0;
let noteIndex = 0;

const SFX_VOLUME = 0.25;
const MUSIC_VOLUME = 0.05;

// Нота: частота в герцах, начало и длительность в секундах от «сейчас»
function tone(frequency, start, duration, { type = 'sine', volume = SFX_VOLUME, slideTo } = {}) {
  if (!ctx || !enabled || paused) return;
  const at = ctx.currentTime + start;
  playAt(frequency, at, duration, type, volume, slideTo);
}

function playAt(frequency, at, duration, type, volume, slideTo) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, at + duration);
  // короткая атака и плавное затухание, чтобы не было щелчков
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain).connect(master);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

// ——— фоновая мелодия: пентатоника, 16 шагов по кругу ———

const STEP = 0.32; // длительность шага в секундах
const C4 = 261.63;
const semitone = (n) => C4 * 2 ** (n / 12);
// [полутон от до первой октавы | null — пауза]
const MELODY = [0, 4, 7, 9, 7, 4, 2, null, 0, 2, 4, 7, 4, 2, 0, null];
const BASS = [-12, null, null, null, -5, null, null, null, -8, null, null, null, -5, null, null, null];

function scheduleMusic() {
  if (!ctx || !enabled || paused) return;
  // если таймер отстал (вкладка была в фоне), не пытаемся доиграть пропущенное
  nextNoteTime = Math.max(nextNoteTime, ctx.currentTime + 0.05);
  while (nextNoteTime < ctx.currentTime + 0.4) {
    const step = noteIndex % MELODY.length;
    if (MELODY[step] !== null) playAt(semitone(MELODY[step]), nextNoteTime, STEP * 0.95, 'triangle', MUSIC_VOLUME);
    if (BASS[step] !== null) playAt(semitone(BASS[step]), nextNoteTime, STEP * 3.5, 'sine', MUSIC_VOLUME * 1.2);
    nextNoteTime += STEP;
    noteIndex += 1;
  }
}

function syncMusic() {
  const shouldPlay = Boolean(ctx) && enabled && !paused;
  if (shouldPlay && !musicTimer) {
    musicTimer = setInterval(scheduleMusic, 120);
    scheduleMusic();
  } else if (!shouldPlay && musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export const audio = {
  // Вызвать при первом нажатии игрока: создаёт AudioContext и запускает мелодию
  unlock() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      ctx = new AudioContextClass();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (!paused && ctx.state === 'suspended') ctx.resume();
    syncMusic();
  },

  // Кнопка звука в меню: выключает и эффекты, и мелодию
  setEnabled(value) {
    enabled = value;
    syncMusic();
  },

  // Пауза на время рекламы и когда вкладка скрыта
  setPaused(value) {
    paused = value;
    if (ctx) {
      if (paused) ctx.suspend();
      else ctx.resume();
    }
    syncMusic();
  },

  tap() {
    tone(520, 0, 0.07, { type: 'triangle', slideTo: 380, volume: SFX_VOLUME * 0.6 });
  },

  correct() {
    tone(semitone(7), 0, 0.12, { type: 'triangle' });
    tone(semitone(12), 0.1, 0.2, { type: 'triangle' });
  },

  wrong() {
    tone(190, 0, 0.22, { type: 'sawtooth', slideTo: 110, volume: SFX_VOLUME * 0.6 });
  },

  coin() {
    tone(1320, 0, 0.06, { type: 'square', volume: SFX_VOLUME * 0.35 });
    tone(1760, 0.05, 0.14, { type: 'square', volume: SFX_VOLUME * 0.35 });
  },

  buy() {
    tone(semitone(12), 0, 0.09, { type: 'triangle' });
    tone(semitone(16), 0.08, 0.09, { type: 'triangle' });
    tone(semitone(19), 0.16, 0.22, { type: 'triangle' });
  },

  win() {
    [0, 4, 7, 12].forEach((note, i) => tone(semitone(note + 12), i * 0.11, 0.2, { type: 'triangle' }));
    tone(semitone(24), 0.44, 0.45, { type: 'triangle' });
  },
};
