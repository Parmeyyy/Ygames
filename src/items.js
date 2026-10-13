// Предметы гардероба Валеры. Как получить:
//   price   — купить за монеты
//   ads     — посмотреть рекламу столько раз (редкие)
//   section — награда за пройденный раздел
//   source  — выдаётся в другом месте: "wheel" — колесо удачи, "calendar" — подарок седьмого дня
// kind — куда надевается вещь:
//   нет    — шапка (вместо родной кепки)
//   badge  — значок (медаль, бабочка): занимает место шапки, но кепка при этом остаётся
//   top    — верх вместо майки, pants — низ вместо треников
//   hand   — вещь в руке; shape — её картинка из src/ui/shapes.js
// Названия — в src/i18n/*.json (items.<id>); шапки и значки нарисованы в src/ui/hats.js,
// одежда — в src/ui/clothes.js.
export const ITEMS = [
  { id: 'redcap', price: 50 },
  { id: 'bandana', price: 80 },
  { id: 'beanie', price: 120 },
  { id: 'ushanka', price: 200 },
  { id: 'fedora', price: 300 },
  { id: 'crown', ads: 3 },
  { id: 'chef', ads: 3 },
  { id: 'paper', ads: 3 },
  { id: 'medal', section: 'morning', kind: 'badge' },
  { id: 'helmet', section: 'factory' },
  { id: 'bowtie', section: 'date', kind: 'badge' },
  { id: 'panama', section: 'fishing' },
  { id: 'straw', section: 'dacha' },
  { id: 'telnyashka', price: 60, kind: 'top' },
  { id: 'tshirt', price: 90, kind: 'top' },
  { id: 'hawaii', price: 150, kind: 'top' },
  { id: 'sweater', price: 180, kind: 'top' },
  { id: 'jacket', price: 350, kind: 'top' },
  { id: 'shorts', price: 70, kind: 'pants' },
  { id: 'jeans', price: 110, kind: 'pants' },
  { id: 'camo', price: 160, kind: 'pants' },
  { id: 'tuxedo', ads: 3, kind: 'top' },
  { id: 'superhero', ads: 3, kind: 'top' },
  { id: 'pajama', ads: 3, kind: 'pants' },
  { id: 'mug', price: 60, kind: 'hand', shape: 'cupFull' },
  { id: 'hammer', price: 100, kind: 'hand', shape: 'hammer' },
  { id: 'flowers', price: 140, kind: 'hand', shape: 'bouquet' },
  { id: 'ballon', price: 180, kind: 'hand', shape: 'balloon' },
  { id: 'icecream', source: 'wheel', kind: 'hand', shape: 'icecream' },
  { id: 'umbrella', source: 'wheel', kind: 'hand', shape: 'umbrella' },
  { id: 'trophy', source: 'calendar', kind: 'hand', shape: 'trophy' },
];

// Слоты: в каждом одновременно надета одна вещь
export const SLOTS = ['hat', 'top', 'pants', 'hand'];

// Слот, который занимает вещь: шапки и значки делят один слот
export const slotOf = (item) => (['top', 'pants', 'hand'].includes(item.kind) ? item.kind : 'hat');

export const getItem = (id) => ITEMS.find((item) => item.id === id);
