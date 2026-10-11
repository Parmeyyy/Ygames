import { ECONOMY } from '../config.js';
import { HATS } from '../hats.js';
import { chapters } from '../levels/index.js';
import { yandex } from '../yandex.js';

// Прогресс игрока. Хранится в данных игрока SDK Яндекс Игр (облако),
// при локальном запуске — в localStorage (см. src/yandex.js).

const state = {
  unlocked: 1, // до какого номера открыты основные уровни
  secretOpen: false, // секретная глава открыта (навсегда)
  secretUnlocked: 1, // до какого номера открыты уровни секретной главы
  completed: [], // id пройденных уровней
  coins: 0,
  hats: [], // id купленных и полученных шапок
  hat: null, // id надетой шапки
  hatAds: {}, // id редкой шапки → сколько раз ради неё посмотрели рекламу
  sound: true,
};

const save = () => yandex.saveData({ ...state });

export const progress = {
  async load() {
    const data = await yandex.loadData();
    for (const key of ['unlocked', 'secretUnlocked', 'coins']) {
      if (Number.isInteger(data[key]) && data[key] >= 0) state[key] = data[key];
    }
    for (const key of ['secretOpen', 'sound']) {
      if (typeof data[key] === 'boolean') state[key] = data[key];
    }
    if (Array.isArray(data.completed)) state.completed = data.completed;
    // шапки, которых больше нет в игре, из сохранения отбрасываются
    if (Array.isArray(data.hats)) state.hats = data.hats.filter((id) => HATS.some((hat) => hat.id === id));
    if (data.hatAds && typeof data.hatAds === 'object') state.hatAds = data.hatAds;
    if (state.hats.includes(data.hat)) state.hat = data.hat;
  },

  // ——— уровни ———

  // Номер первого непройденного открытого уровня основной главы
  get unlocked() {
    return state.unlocked;
  },

  isUnlocked(level) {
    if (level.chapter === 'secret') return state.secretOpen && level.number <= state.secretUnlocked;
    return level.number <= state.unlocked;
  },

  isCompleted(level) {
    return state.completed.includes(level.id);
  },

  // Уровень пройден. Возвращает, сколько монет начислено: награда даётся только за первое прохождение.
  complete(level) {
    const first = !state.completed.includes(level.id);
    if (first) {
      state.completed.push(level.id);
      state.coins += ECONOMY.levelReward;
    }
    this.openNext(level, false);
    save();
    return first ? ECONOMY.levelReward : 0;
  },

  // Уровень пропущен: следующий открывается, но этот остаётся непройденным и монет не даёт
  skip(level) {
    this.openNext(level);
  },

  openNext(level, andSave = true) {
    const key = level.chapter === 'secret' ? 'secretUnlocked' : 'unlocked';
    const last = chapters[level.chapter].length;
    state[key] = Math.max(state[key], Math.min(level.number + 1, last));
    if (andSave) save();
  },

  get secretOpen() {
    return state.secretOpen;
  },

  openSecret() {
    state.secretOpen = true;
    save();
  },

  // ——— монеты ———

  get coins() {
    return state.coins;
  },

  addCoins(amount) {
    state.coins += amount;
    save();
  },

  // Списывает монеты, если их хватает. Возвращает, получилось ли.
  spend(amount) {
    if (state.coins < amount) return false;
    state.coins -= amount;
    save();
    return true;
  },

  // ——— шапки ———

  get hat() {
    return state.hat;
  },

  ownsHat(id) {
    return state.hats.includes(id);
  },

  hatAdViews(id) {
    return state.hatAds[id] ?? 0;
  },

  // Надеть шапку; null — снять
  equip(id) {
    state.hat = id;
    save();
  },

  // Покупка за монеты: шапка сразу надевается. Возвращает, получилось ли.
  buyHat(hat) {
    if (state.coins < hat.price) return false;
    state.coins -= hat.price;
    state.hats.push(hat.id);
    state.hat = hat.id;
    save();
    return true;
  },

  // Засчитывает просмотр рекламы ради редкой шапки; когда просмотров хватает, шапка выдаётся и надевается
  countHatAd(hat) {
    const views = this.hatAdViews(hat.id) + 1;
    state.hatAds[hat.id] = views;
    if (views >= hat.ads) {
      state.hats.push(hat.id);
      state.hat = hat.id;
    }
    save();
  },

  // ——— настройки ———

  get sound() {
    return state.sound;
  },

  set sound(value) {
    state.sound = value;
    save();
  },
};
