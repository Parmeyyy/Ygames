// Каждый *.json — один уровень. Основные уровни лежат прямо в этой папке (порядок задаёт числовой id),
// уровни секретной главы — в папке secret/ (порядок по имени файла, id вида "s1").
//
// Общие поля:   id, type, eggMood, background, hideCoins (последние три необязательны)
// tap:          objects [{ id, label | labelKey, x, y }] (x, y — доли поля 0..1), answer
// choice:       options [{ id, label | labelKey }], answer
// action:       action { kind: "tap", target, count, within }, decoys [{ id, label | labelKey }]
// остальные типы (drag, wait, flashlight, timed, erase) описаны в начале своих файлов в src/level-types/
//
// answer / target — id объекта либо элемент интерфейса: "ui:levelNumber", "ui:question", "ui:egg".
// Тексты уровня — в src/i18n/*.json, раздел levels.<id> (question, hint, win, start и подписи labelKey).

const mainModules = import.meta.glob('./*.json', { eager: true, import: 'default' });
const secretModules = import.meta.glob('./secret/*.json', { eager: true, import: 'default' });

// number — порядковый номер уровня внутри главы, с 1
const toChapter = (list, chapter) => list.map((level, index) => ({ ...level, chapter, number: index + 1 }));

export const chapters = {
  main: toChapter(
    Object.values(mainModules).sort((a, b) => a.id - b.id),
    'main',
  ),
  secret: toChapter(
    Object.keys(secretModules)
      .sort()
      .map((path) => secretModules[path]),
    'secret',
  ),
};

const byId = new Map([...chapters.main, ...chapters.secret].map((level) => [level.id, level]));

export const getLevel = (id) => byId.get(id);

// Следующий уровень той же главы или undefined
export const nextLevel = (level) => chapters[level.chapter][level.number];
