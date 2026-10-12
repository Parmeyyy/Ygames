import { uiTarget } from './index.js';
import { buildObjects, makeDraggable } from './objects.js';

// drag — перетащи объект в целевую зону.
//   goal: { drag, onto } — что тащить и куда; оба значения — id объекта или "ui:hero" (сам Валера)
// Засчитывается, когда центр объекта отпущен внутри цели. Отпустили мимо — ошибка, объект возвращается.
export function buildDrag(scene, level, field, api) {
  const u = scene.u;
  const objects = buildObjects(scene, level, field, api);

  // Объект уровня или элемент интерфейса в общем виде: { object, w, h }
  const resolve = (id) => {
    const name = uiTarget(id);
    if (!name) return objects.get(id);
    const object = api.target(name);
    return object && { object, w: object.width, h: object.height };
  };

  const dragged = resolve(level.goal.drag);
  const target = resolve(level.goal.onto);
  if (!dragged || !target) {
    console.warn(`Уровень ${level.id}: не найден объект цели перетаскивания`);
    return { objects };
  }

  const hero = dragged.object === api.target('hero');
  const home = { x: dragged.object.x, y: dragged.object.y };

  const onDrop = (object) => {
    const inside =
      Math.abs(object.x - target.object.x) <= target.w / 2 && Math.abs(object.y - target.object.y) <= target.h / 2;
    if (inside) {
      // Валера остаётся там, куда его поставили
      if (hero) Object.assign(object, { homeX: object.x, homeY: object.y });
      if (api.correct()) return;
    } else if (Math.hypot(object.x - home.x, object.y - home.y) > 40 * u) {
      api.wrong();
    }
    if (hero) Object.assign(object, { homeX: home.x, homeY: home.y });
    scene.tweens.add({ targets: object, x: home.x, y: home.y, duration: 250, ease: 'Quad.easeOut' });
  };

  makeDraggable(scene, dragged.object, onDrop);
  // Валера создан раньше объектов поля — поднимаем его наверх, чтобы не прятался под ними
  if (hero) dragged.object.on('dragstart', () => scene.children.bringToTop(dragged.object));

  for (const { def, object } of objects.values()) {
    if (def.draggable && object !== dragged.object) makeDraggable(scene, object);
  }

  return { objects };
}
