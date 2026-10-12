import { COLORS } from '../config.js';

// Уровни лежат по папкам разделов: src/levels/<раздел>/NN.json, порядок — по имени файла.
// У каждого уровня свой id (например "m7"); тексты — в src/i18n/*.json, раздел levels.<id>:
// question, hint, win, wrong, start, partial и подписи labelKey.
//
// Общие поля уровня: id, type, heroMood, heroProps, background, hideCoins, word.
// Что нужно каждому типу, описано в начале его файла в src/level-types/.

// Разделы по порядку. Следующий открывается, когда пройден последний уровень предыдущего.
//   theme  — фон раздела (src/ui/background.js), color — цвет карточки и кнопок раздела
//   reward — предмет гардероба за прохождение раздела (src/items.js)
//   secret — открывается просмотром рекламы, а не прохождением
const SECTIONS = [
  { id: 'morning', theme: 'morning', color: 0xffb347, reward: 'medal' },
  { id: 'factory', theme: 'factory', color: 0x7f8fa6, reward: 'helmet' },
  { id: 'date', theme: 'date', color: 0xff8fab, reward: 'bowtie' },
  { id: 'fishing', theme: 'lake', color: 0x5fa8d3, reward: 'panama' },
  { id: 'dacha', theme: 'garden', color: 0x7fb069, reward: 'straw' },
  { id: 'secret', theme: 'night', color: COLORS.special, secret: true },
];

const modules = import.meta.glob('./*/*.json', { eager: true, import: 'default' });

export const sections = SECTIONS.map((def) => ({
  ...def,
  // number — порядковый номер уровня внутри раздела, с 1
  levels: Object.keys(modules)
    .filter((path) => path.startsWith(`./${def.id}/`))
    .sort()
    .map((path, index) => ({ ...modules[path], section: def.id, number: index + 1 })),
}));

const byId = new Map(sections.flatMap((section) => section.levels).map((level) => [level.id, level]));

export const getSection = (id) => sections.find((section) => section.id === id);

export const getLevel = (id) => byId.get(id);

// Следующий уровень того же раздела или undefined
export const nextLevel = (level) => getSection(level.section).levels[level.number];
