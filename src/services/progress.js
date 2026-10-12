import { ECONOMY } from '../config.js';
import { dev } from '../dev.js';
import { ITEMS } from '../items.js';
import { getSection, sections } from '../levels/index.js';
import { yandex } from '../yandex.js';

// Прогресс игрока. Хранится в данных игрока SDK Яндекс Игр (облако),
// при локальном запуске — в localStorage (см. src/yandex.js).

const state = {
  opened: {}, // id раздела → до какого номера открыты его уровни (по умолчанию 1)
  secretOpen: false, // секретный раздел открыт (навсегда)
  completed: [], // id пройденных уровней
  stars: {}, // id уровня → лучшая оценка, от 1 до 3 звёзд
  bonusDay: 0, // номер дня, когда забрали последний ежедневный подарок
  coins: 0,
  hats: [], // id предметов гардероба, которые есть у игрока
  hat: null, // id надетого предмета
  hatAds: {}, // id редкого предмета → сколько раз ради него посмотрели рекламу
  sound: true,
};

const save = () => yandex.saveData({ ...state });
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

export const progress = {
  async load() {
    const data = await yandex.loadData();
    for (const key of ['coins', 'bonusDay']) {
      if (Number.isInteger(data[key]) && data[key] >= 0) state[key] = data[key];
    }
    for (const key of ['secretOpen', 'sound']) {
      if (typeof data[key] === 'boolean') state[key] = data[key];
    }
    for (const key of ['opened', 'stars', 'hatAds']) {
      if (isObject(data[key])) state[key] = data[key];
    }
    if (Array.isArray(data.completed)) state.completed = data.completed;
    // предметы, которых больше нет в игре, из сохранения отбрасываются
    if (Array.isArray(data.hats)) state.hats = data.hats.filter((id) => ITEMS.some((item) => item.id === id));
    if (state.hats.includes(data.hat)) state.hat = data.hat;
  },

  // ——— разделы и уровни ———

  // Раздел пройден, когда пройден его последний уровень
  isSectionDone(section) {
    const last = section.levels.at(-1);
    return Boolean(last) && state.completed.includes(last.id);
  },

  isSectionOpen(section) {
    if (dev.unlockAll) return true;
    if (section.secret) return state.secretOpen;
    const index = sections.indexOf(section);
    return index === 0 || this.isSectionDone(sections[index - 1]);
  },

  isUnlocked(level) {
    if (dev.unlockAll) return true;
    return this.isSectionOpen(getSection(level.section)) && level.number <= (state.opened[level.section] ?? 1);
  },

  isCompleted(level) {
    return state.completed.includes(level.id);
  },

  completedIn(section) {
    return section.levels.filter((level) => state.completed.includes(level.id)).length;
  },

  // Сколько звёзд у уровня (0 — не пройден)
  starsOf(level) {
    return state.stars[level.id] ?? 0;
  },

  get totalStars() {
    return Object.values(state.stars).reduce((sum, value) => sum + value, 0);
  },

  // Уровень, с которого продолжит кнопка «Играть»: первый непройденный из открытых
  continueLevel() {
    const playable = sections.filter((section) => !section.secret && section.levels.length);
    for (const section of playable) {
      if (!this.isSectionDone(section) || section === playable.at(-1)) {
        const number = Math.min(state.opened[section.id] ?? 1, section.levels.length);
        return section.levels[number - 1];
      }
    }
    return undefined;
  },

  // Уровень пройден на stars звёзд (хранится лучший результат).
  // Возвращает { coins, item }: монеты даются только за первое прохождение,
  // item — предмет гардероба, если этим уровнем закончен раздел.
  complete(level, stars = 1) {
    state.stars[level.id] = Math.max(state.stars[level.id] ?? 0, stars);
    const first = !state.completed.includes(level.id);
    if (first) {
      state.completed.push(level.id);
      state.coins += ECONOMY.levelReward;
    }
    this.openNext(level, false);

    const section = getSection(level.section);
    let item = null;
    if (first && section.reward && level === section.levels.at(-1) && !state.hats.includes(section.reward)) {
      item = section.reward;
      state.hats.push(item);
    }
    save();
    return { coins: first ? ECONOMY.levelReward : 0, item };
  },

  // Уровень пропущен: следующий открывается, но этот остаётся непройденным и монет не даёт
  skip(level) {
    this.openNext(level);
  },

  openNext(level, andSave = true) {
    const last = getSection(level.section).levels.length;
    state.opened[level.section] = Math.max(state.opened[level.section] ?? 1, Math.min(level.number + 1, last));
    if (andSave) save();
  },

  get secretOpen() {
    return state.secretOpen || dev.unlockAll;
  },

  openSecret() {
    state.secretOpen = true;
    save();
  },

  // ——— ежедневный подарок ———

  // Номер сегодняшнего дня (по UTC)
  today() {
    return Math.floor(yandex.now() / 86400000);
  },

  get dailyAvailable() {
    return state.bonusDay !== this.today();
  },

  claimDaily(amount) {
    state.bonusDay = this.today();
    state.coins += amount;
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

  // ——— гардероб ———

  // id надетого предмета (null — родная кепка)
  get hat() {
    return state.hat;
  },

  ownsHat(id) {
    return state.hats.includes(id);
  },

  hatAdViews(id) {
    return state.hatAds[id] ?? 0;
  },

  // Надеть предмет; null — снять
  equip(id) {
    state.hat = id;
    save();
  },

  // Покупка за монеты: предмет сразу надевается. Возвращает, получилось ли.
  buyHat(item) {
    if (state.coins < item.price) return false;
    state.coins -= item.price;
    state.hats.push(item.id);
    state.hat = item.id;
    save();
    return true;
  },

  // Засчитывает просмотр рекламы ради редкого предмета; когда просмотров хватает, он выдаётся и надевается
  countHatAd(item) {
    const views = this.hatAdViews(item.id) + 1;
    state.hatAds[item.id] = views;
    if (views >= item.ads) {
      state.hats.push(item.id);
      state.hat = item.id;
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
