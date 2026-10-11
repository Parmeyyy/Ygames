// Каждый *.json в этой папке — один уровень. Порядок в игре задаёт поле id.
//
// Общие поля:   id, type ("tap" | "choice" | "action"), eggMood (необязательно)
// tap:          objects [{ id, label | labelKey, x, y }] (x, y — доли поля 0..1), answer
// choice:       options [{ id, label | labelKey }], answer
// action:       action { kind: "wait", seconds } или { kind: "tap", target }, decoys [{ id, label | labelKey }]
//
// answer / target — id объекта либо элемент интерфейса: "ui:levelNumber", "ui:question", "ui:egg".
// Тексты уровня — в src/i18n/*.json, раздел levels.<id> (question, hint, win, start и подписи labelKey).

const modules = import.meta.glob('./*.json', { eager: true, import: 'default' });

export const levels = Object.values(modules)
  .sort((a, b) => a.id - b.id)
  .map((level, index) => ({ ...level, number: index + 1 }));

// number — порядковый номер уровня в игре, с 1
export const getLevel = (number) => levels[number - 1];
