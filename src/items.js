// Предметы гардероба Валеры. Как получить:
//   price   — купить за монеты
//   ads     — посмотреть рекламу столько раз (редкие)
//   section — награда за пройденный раздел
// kind: "badge" — предмет носится не на голове (медаль, бабочка): кепка при этом остаётся.
// Названия — в src/i18n/*.json (items.<id>), внешний вид — в src/ui/hats.js.
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
];

export const getItem = (id) => ITEMS.find((item) => item.id === id);
