// Всё, что возвращает игрока в игру: что и за что выдаётся. Сама логика — в src/services/progress.js.

// Календарь подарков за вход: 7 дней подряд, потом по кругу. Пропустил день — начинай с первого.
// Число — монеты; { item, coins } — вещь в гардероб (или монеты, если она уже есть).
export const CALENDAR = [10, 15, 20, 30, 40, 50, { item: 'trophy', coins: 60 }];

// Колесо удачи: секторы по кругу, weight — как часто выпадает.
// { coins } — монеты, { hints } — бесплатные подсказки, { item: true } — вещь из WHEEL_ITEMS.
export const WHEEL = [
  { coins: 10, weight: 5 },
  { coins: 30, weight: 3 },
  { hints: 1, weight: 3 },
  { coins: 5, weight: 5 },
  { coins: 50, weight: 2 },
  { coins: 15, weight: 4 },
  { item: true, weight: 1 },
  { coins: 20, weight: 4 },
];
// Вещи, которые можно выиграть только на колесе. Когда все собраны, вместо вещи дают монеты.
export const WHEEL_ITEMS = ['icecream', 'umbrella'];
export const WHEEL_ITEM_COINS = 100;
// Сколько раз в день можно крутить за рекламу (кроме одного бесплатного раза)
export const WHEEL_AD_SPINS = 3;

// Сундук за звёзды: каждые stars звёзд
export const CHEST = { stars: 15, coins: 40, hints: 1 };

// Задача дня: монет за решение (раз в день)
export const DAILY_LEVEL_COINS = 30;

// Достижения: goal — сколько нужно, reward — монет за получение.
// Откуда берётся текущее значение — см. achievementValue в src/services/progress.js.
export const ACHIEVEMENTS = [
  { id: 'firstLevel', goal: 1, reward: 10 },
  { id: 'levels20', goal: 20, reward: 30 },
  { id: 'levels50', goal: 50, reward: 60 },
  { id: 'stars30', goal: 30, reward: 40 },
  { id: 'stars100', goal: 100, reward: 80 },
  { id: 'perfect10', goal: 10, reward: 40 },
  { id: 'wardrobe5', goal: 5, reward: 40 },
  { id: 'streak7', goal: 7, reward: 60 },
  { id: 'spins5', goal: 5, reward: 30 },
  { id: 'secret', goal: 1, reward: 20 },
];
