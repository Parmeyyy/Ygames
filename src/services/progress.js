// Прогресс игрока. Сейчас хранится в localStorage; позже здесь же появится
// облачное сохранение через SDK Яндекс Игр (поэтому load асинхронный).

const KEY = 'egg-progress-v1';

const state = {
  unlocked: 1, // до какого номера уровни открыты
  completed: [], // номера пройденных уровней
  sound: true,
};

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // хранилище может быть недоступно (приватный режим) — играем без сохранения
  }
}

export const progress = {
  async load() {
    try {
      Object.assign(state, JSON.parse(localStorage.getItem(KEY)) ?? {});
    } catch {
      // нет сохранения или оно повреждено — начинаем с нуля
    }
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
