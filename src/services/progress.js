import { yandex } from '../yandex.js';

// Прогресс игрока. Хранится в данных игрока SDK Яндекс Игр (облако),
// при локальном запуске — в localStorage (см. src/yandex.js).

const state = {
  unlocked: 1, // до какого номера уровни открыты
  completed: [], // номера пройденных уровней
  sound: true,
};

const save = () => yandex.saveData({ ...state });

export const progress = {
  async load() {
    const data = await yandex.loadData();
    if (Number.isInteger(data.unlocked)) state.unlocked = data.unlocked;
    if (Array.isArray(data.completed)) state.completed = data.completed;
    if (typeof data.sound === 'boolean') state.sound = data.sound;
  },

  get unlocked() {
    return state.unlocked;
  },

  isCompleted(number) {
    return state.completed.includes(number);
  },

  complete(number) {
    if (!state.completed.includes(number)) state.completed.push(number);
    state.unlocked = Math.max(state.unlocked, number + 1);
    save();
  },

  get sound() {
    return state.sound;
  },

  set sound(value) {
    state.sound = value;
    save();
  },
};
