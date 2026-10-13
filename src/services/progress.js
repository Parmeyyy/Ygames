import { ECONOMY } from '../config.js';
import { dev } from '../dev.js';
import { ITEMS, SLOTS, slotOf } from '../items.js';
import { getSection, sections } from '../levels/index.js';
import {
  ACHIEVEMENTS,
  CALENDAR,
  CHEST,
  DAILY_LEVEL_COINS,
  WHEEL,
  WHEEL_AD_SPINS,
  WHEEL_ITEM_COINS,
  WHEEL_ITEMS,
} from '../rewards.js';
import { yandex } from '../yandex.js';

// Прогресс игрока. Хранится в данных игрока SDK Яндекс Игр (облако),
// при локальном запуске — в localStorage (см. src/yandex.js).

const state = {
  opened: {}, // id раздела → до какого номера открыты его уровни (по умолчанию 1)
  secretOpen: false, // секретный раздел открыт (навсегда)
  adSections: [], // id разделов, открытых просмотром рекламы (навсегда)
  completed: [], // id пройденных уровней
  stars: {}, // id уровня → лучшая оценка, от 1 до 3 звёзд
  coins: 0,
  hints: 0, // бесплатные подсказки (с колеса удачи и из сундуков)
  hats: [], // id вещей гардероба, которые есть у игрока
  hat: null, // id надетой шапки или значка
  top: null, // id надетого верха (null — родная майка)
  pants: null, // id надетого низа (null — родные треники)
  hand: null, // id вещи в руке
  hatAds: {}, // id редкой вещи → сколько раз ради неё посмотрели рекламу
  // календарь подарков
  bonusDay: 0, // номер дня, когда забрали последний подарок
  streak: 0, // сколько дней подряд забирали подарок
  bestStreak: 0,
  // колесо удачи
  wheelDay: 0, // день последнего бесплатного вращения
  wheelAdDay: 0, // день, за который считаются вращения за рекламу
  wheelAdCount: 0,
  spins: 0, // всего вращений
  // прочее
  chests: 0, // сколько сундуков за звёзды уже открыто
  dailyDay: 0, // день, когда решена последняя задача дня
  achieved: [], // id полученных достижений
  sound: true,
};

const save = () => yandex.saveData({ ...state });
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const NUMBERS = ['coins', 'hints', 'bonusDay', 'streak', 'bestStreak', 'wheelDay', 'wheelAdDay', 'wheelAdCount', 'spins', 'chests', 'dailyDay'];

export const progress = {
  async load() {
    const data = await yandex.loadData();
    for (const key of NUMBERS) {
      if (Number.isInteger(data[key]) && data[key] >= 0) state[key] = data[key];
    }
    for (const key of ['secretOpen', 'sound']) {
      if (typeof data[key] === 'boolean') state[key] = data[key];
    }
    for (const key of ['opened', 'stars', 'hatAds']) {
      if (isObject(data[key])) state[key] = data[key];
    }
    for (const key of ['completed', 'adSections', 'achieved']) {
      if (Array.isArray(data[key])) state[key] = data[key];
    }
    // вещи, которых больше нет в игре, из сохранения отбрасываются
    if (Array.isArray(data.hats)) state.hats = data.hats.filter((id) => ITEMS.some((item) => item.id === id));
    for (const slot of SLOTS) {
      if (state.hats.includes(data[slot])) state[slot] = data[slot];
    }
  },

  // ——— разделы и уровни ———

  // Раздел пройден, когда пройден его последний уровень
  isSectionDone(section) {
    const last = section.levels.at(-1);
    return Boolean(last) && state.completed.includes(last.id);
  },

  isSectionOpen(section) {
    if (dev.unlockAll || section.hidden) return true;
    if (section.secret) return state.secretOpen;
    if (state.adSections.includes(section.id)) return true;
    const index = sections.indexOf(section);
    return index === 0 || this.isSectionDone(sections[index - 1]);
  },

  isUnlocked(level) {
    if (dev.unlockAll) return true;
    if (level.section === 'daily') return level === this.dailyLevel();
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
    const playable = sections.filter((section) => !section.secret && !section.hidden && section.levels.length);
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
  // item — вещь гардероба, если этим уровнем закончен раздел.
  complete(level, stars = 1) {
    // задача дня: награда раз в день, в пройденные и в звёзды не идёт
    if (level.section === 'daily') {
      const first = state.dailyDay !== this.today();
      if (first) {
        state.dailyDay = this.today();
        state.coins += DAILY_LEVEL_COINS;
        save();
      }
      return { coins: first ? DAILY_LEVEL_COINS : 0, item: null };
    }

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
    if (level.section !== 'daily') this.openNext(level);
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

  // Раздел открыт просмотром рекламы, не дожидаясь прохождения предыдущего
  openSection(section) {
    if (!state.adSections.includes(section.id)) state.adSections.push(section.id);
    save();
  },

  // ——— время ———

  // Номер сегодняшнего дня (по UTC)
  today() {
    return Math.floor(yandex.now() / 86400000);
  },

  // ——— календарь подарков за вход ———

  get dailyAvailable() {
    return state.bonusDay !== this.today();
  },

  // Какой по счёту день календаря сейчас можно забрать (1..7). Пропустил день — снова первый.
  get calendarDay() {
    const kept = state.bonusDay === this.today() - 1;
    return kept ? (state.streak % CALENDAR.length) + 1 : 1;
  },

  // Какой день календаря забран последним в текущей серии (0 — серия прервана или не начата)
  get calendarClaimed() {
    const alive = state.bonusDay === this.today() || state.bonusDay === this.today() - 1;
    if (!alive || state.streak === 0) return 0;
    return ((state.streak - 1) % CALENDAR.length) + 1;
  },

  // Что лежит в подарке дня: { coins } или { item } (если вещь уже есть — монеты)
  calendarReward(day) {
    const entry = CALENDAR[day - 1];
    if (typeof entry === 'number') return { coins: entry };
    return state.hats.includes(entry.item) ? { coins: entry.coins } : { item: entry.item };
  },

  // Забрать подарок дня; double — удвоить монеты (после рекламы). Возвращает то, что выдано.
  claimDaily(double = false) {
    const day = this.calendarDay;
    const reward = this.calendarReward(day);
    state.streak = state.bonusDay === this.today() - 1 ? state.streak + 1 : 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.bonusDay = this.today();
    if (reward.coins) {
      reward.coins *= double ? 2 : 1;
      state.coins += reward.coins;
    } else {
      this.grant(reward.item);
    }
    save();
    return reward;
  },

  // ——— колесо удачи ———

  get wheelFree() {
    return state.wheelDay !== this.today();
  },

  // Сколько вращений за рекламу осталось сегодня
  get wheelAdLeft() {
    return WHEEL_AD_SPINS - (state.wheelAdDay === this.today() ? state.wheelAdCount : 0);
  },

  // Крутит колесо: free — бесплатное вращение дня, иначе вращение за рекламу.
  // Награда выдаётся сразу. Возвращает { index, coins | hints | item } — какой сектор выпал и что дали.
  spin(free) {
    const total = WHEEL.reduce((sum, sector) => sum + sector.weight, 0);
    let roll = Math.random() * total;
    const index = WHEEL.findIndex((sector) => (roll -= sector.weight) < 0);
    const sector = WHEEL[index];

    const prize = { index };
    if (sector.item) {
      const item = WHEEL_ITEMS.find((id) => !state.hats.includes(id));
      if (item) prize.item = item;
      else prize.coins = WHEEL_ITEM_COINS;
    } else if (sector.hints) {
      prize.hints = sector.hints;
    } else {
      prize.coins = sector.coins;
    }
    if (prize.coins) state.coins += prize.coins;
    if (prize.hints) state.hints += prize.hints;
    if (prize.item) this.grant(prize.item);

    if (free) {
      state.wheelDay = this.today();
    } else {
      state.wheelAdCount = (state.wheelAdDay === this.today() ? state.wheelAdCount : 0) + 1;
      state.wheelAdDay = this.today();
    }
    state.spins += 1;
    save();
    return prize;
  },

  // ——— сундуки за звёзды ———

  get chestsAvailable() {
    return Math.floor(this.totalStars / CHEST.stars) - state.chests;
  },

  // Сколько звёзд осталось до следующего сундука
  get starsToChest() {
    return (state.chests + 1) * CHEST.stars - this.totalStars;
  },

  openChest() {
    if (this.chestsAvailable <= 0) return false;
    state.chests += 1;
    state.coins += CHEST.coins;
    state.hints += CHEST.hints;
    save();
    return true;
  },

  // ——— задача дня ———

  // Сегодняшний уровень из раздела daily: уровни идут по кругу
  dailyLevel() {
    const pool = getSection('daily')?.levels ?? [];
    return pool.length ? pool[this.today() % pool.length] : undefined;
  },

  get dailyLevelDone() {
    return state.dailyDay === this.today();
  },

  // ——— достижения ———

  // Текущее значение для достижения
  achievementValue(id) {
    const values = {
      firstLevel: state.completed.length,
      levels20: state.completed.length,
      levels50: state.completed.length,
      stars30: this.totalStars,
      stars100: this.totalStars,
      perfect10: Object.values(state.stars).filter((value) => value === 3).length,
      wardrobe5: state.hats.length,
      streak7: state.bestStreak,
      spins5: state.spins,
      secret: state.secretOpen ? 1 : 0,
    };
    return values[id] ?? 0;
  },

  isAchieved(id) {
    return state.achieved.includes(id);
  },

  // Достижения, награду за которые можно забрать прямо сейчас
  get achievementsReady() {
    return ACHIEVEMENTS.filter((a) => !state.achieved.includes(a.id) && this.achievementValue(a.id) >= a.goal).length;
  },

  claimAchievement(achievement) {
    if (state.achieved.includes(achievement.id) || this.achievementValue(achievement.id) < achievement.goal) return false;
    state.achieved.push(achievement.id);
    state.coins += achievement.reward;
    save();
    return true;
  },

  // ——— монеты и подсказки ———

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

  get hints() {
    return state.hints;
  },

  // Тратит бесплатную подсказку. Возвращает, получилось ли.
  useHint() {
    if (state.hints <= 0) return false;
    state.hints -= 1;
    save();
    return true;
  },

  // ——— гардероб ———

  // id надетой шапки или значка (null — родная кепка), верха, низа и вещи в руке
  get hat() {
    return state.hat;
  },

  get top() {
    return state.top;
  },

  get pants() {
    return state.pants;
  },

  get hand() {
    return state.hand;
  },

  ownsHat(id) {
    return state.hats.includes(id);
  },

  isWearing(item) {
    return state[slotOf(item)] === item.id;
  },

  hatAdViews(id) {
    return state.hatAds[id] ?? 0;
  },

  // Надеть вещь; если она уже надета — снять
  toggle(item) {
    const slot = slotOf(item);
    state[slot] = state[slot] === item.id ? null : item.id;
    save();
  },

  // Выдать вещь (подарок, приз): она сразу надевается. Сохранение — на вызывающем.
  grant(id) {
    const item = ITEMS.find((entry) => entry.id === id);
    if (!item || state.hats.includes(id)) return;
    state.hats.push(id);
    state[slotOf(item)] = id;
  },

  // Покупка за монеты: вещь сразу надевается. Возвращает, получилось ли.
  buyHat(item) {
    if (state.coins < item.price) return false;
    state.coins -= item.price;
    this.grant(item.id);
    save();
    return true;
  },

  // Засчитывает просмотр рекламы ради редкой вещи; когда просмотров хватает, она выдаётся и надевается
  countHatAd(item) {
    const views = this.hatAdViews(item.id) + 1;
    state.hatAds[item.id] = views;
    if (views >= item.ads) this.grant(item.id);
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
