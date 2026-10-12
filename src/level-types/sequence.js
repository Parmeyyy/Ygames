import { audio } from '../audio.js';
import { levelText } from '../i18n/index.js';
import { redrawShape } from '../ui/shapes.js';
import { makeTappable } from '../ui/widgets.js';
import { buildObjects, makeDraggable } from './objects.js';

// Уровень из шагов. На этом строителе работают типы combine, wordDrag, offscreen, rotate и sequence:
// название типа говорит, в чём главная хитрость уровня, а устроены они одинаково.
//
//   steps: [{ do, ..., then, early }] — что должен сделать игрок
//   ordered: false — шаги можно выполнять в любом порядке (по умолчанию — строго по очереди)
//
// Виды шагов (поле do):
//   combine   { drag, onto }        — перетащить один объект на другой
//                 keep: [dx, dy]    — объект остаётся на цели, со сдвигом в долях её размера
//                 back: true        — объект возвращается на место (иначе исчезает)
//                 tip: [dx, dy]     — к цели нужно поднести не середину объекта, а эту его точку
//                                     (в долях размера объекта: кончик щётки, носик лейки)
//   offscreen { drag }              — увести объект за край экрана
//   uncover   { drag, from }        — сдвинуть объект с того, что он закрывает
//   tap       { target }            — нажать
//   hold      { target, ms }        — удерживать палец
//   rotate    { target, turns }     — круговое движение вокруг объекта; turns — сколько оборотов,
//                                     со знаком: минус — против часовой стрелки
//
// Кого можно указывать в drag / onto / target / from:
//   id объекта уровня; "hero" — Валера целиком; "hero:head", "hero:hand", "hero:mouth",
//   "hero:forehead", "hero:chest" — части Валеры; "word" — слово из текста задания
//   (см. level.word); "ui:coin" — монета из счётчика монет.
//
// then — что происходит после шага:
//   hide: [id], show: [id], swap: { id: вид }, say: ключ реплики,
//   hero: { mood, hat, hand, props } — настроение, шапка, предмет в руке, детали Валеры
// early — ключ реплики, если шаг сделали раньше времени.
//
// Ошибки: объект отпустили не там; нажали на объект с wrong: true; сделали шаг раньше времени;
// покрутили не в ту сторону.
export function buildSequence(scene, level, field, api) {
  const u = scene.u;
  const objects = buildObjects(scene, level, field, api);
  const steps = level.steps;
  const ordered = level.ordered !== false;
  const hero = api.target('hero');
  // прогресс переживает пересборку сцены при повороте экрана
  const state = api.state;
  state.done ??= [];
  const timers = [];
  const listeners = [];

  // ——— кто есть кто ———

  const zones = new Map();
  const resolve = (id) => {
    if (objects.has(id)) return objects.get(id);
    if (id === 'hero') return { object: hero, w: hero.heroW, h: hero.heroH };
    if (id === 'word') {
      const word = api.target('word');
      return word && { object: word, w: word.width, h: word.height };
    }
    if (id === 'ui:coin') {
      const coin = api.coinSource();
      return coin && { object: coin, w: coin.width, h: coin.height };
    }
    if (id?.startsWith('hero:')) {
      if (!zones.has(id)) {
        const zone = hero.zone(id.slice(5));
        const object = scene.add.zone(zone.x, zone.y, zone.radius * 2, zone.radius * 2);
        zones.set(id, { object, w: zone.radius * 2, h: zone.radius * 2 });
        api.mark(id, object);
      }
      return zones.get(id);
    }
    return null;
  };

  // все участники шагов создаются сразу, а не при первом обращении
  for (const step of steps) {
    for (const key of ['drag', 'onto', 'target', 'from']) if (step[key]) resolve(step[key]);
  }

  const inside = (object, target) =>
    Math.abs(object.x - target.object.x) <= target.w / 2 && Math.abs(object.y - target.object.y) <= target.h / 2;

  // ——— что меняет выполненный шаг ———

  const applyEffects = (step) => {
    const dragged = step.drag ? resolve(step.drag) : null;
    if (step.do === 'combine' && dragged) {
      const target = resolve(step.onto);
      if (step.keep) {
        dragged.object.setPosition(target.object.x + step.keep[0] * target.w, target.object.y + step.keep[1] * target.h);
        // Валера запоминает новое место, иначе после прыжка вернётся на старое
        if (dragged.object === hero) Object.assign(hero, { homeX: hero.x, homeY: hero.y });
        else dragged.object.disableInteractive();
      } else if (!step.back) {
        dragged.object.setVisible(false).disableInteractive();
      }
    }
    if (step.do === 'offscreen' && dragged) dragged.object.setVisible(false).disableInteractive();

    const effects = step.then ?? {};
    for (const id of effects.hide ?? []) objects.get(id)?.object.setVisible(false).disableInteractive();
    for (const id of effects.show ?? []) {
      const entry = objects.get(id);
      if (!entry) continue;
      entry.object.setVisible(true);
      // появившееся видно поверх остального (огонь под кастрюлей, колбаса в холодильнике)
      scene.children.bringToTop(entry.object);
      if (entry.object.input) entry.object.setInteractive();
    }
    for (const [id, shape] of Object.entries(effects.swap ?? {})) {
      const entry = objects.get(id);
      if (entry) redrawShape(entry.picture, shape, entry.size);
    }
    if (effects.hero) {
      const { mood, hat, hand, props } = effects.hero;
      if (hat !== undefined) hero.setHat(hat);
      if (hand !== undefined) hero.hold(hand);
      if (props) hero.setProps(props);
      if (mood) {
        hero.baseMood = mood;
        hero.setMood(mood);
      }
    }
  };

  const pending = () => steps.map((step, index) => ({ step, index })).filter(({ index }) => !state.done.includes(index));

  const complete = (index) => {
    const step = steps[index];
    state.done.push(index);
    applyEffects(step);
    if (state.done.length === steps.length) {
      api.correct();
      return;
    }
    // промежуточный шаг: Валера подбадривает
    audio.star(0);
    hero.squash();
    if (step.then?.say) api.say(levelText(level, step.then.say));
  };

  // Игрок сделал действие, подходящее к шагу index. Если шаги строго по очереди, а этот ещё рано — ошибка.
  const attempt = (index) => {
    if (scene.solved) return false;
    if (ordered && index !== pending()[0].index) {
      api.wrong(steps[index].early && levelText(level, steps[index].early));
      return false;
    }
    complete(index);
    return true;
  };

  // ——— перетаскивание ———

  const nearEdge = (object) =>
    object.x < 30 * u || object.y < 30 * u || object.x > scene.W - 30 * u || object.y > scene.H - 30 * u;

  const matchDrop = (id, object) =>
    pending().find(({ step }) => {
      if (step.drag !== id) return false;
      if (step.do === 'combine') {
        const entry = resolve(id);
        const [dx, dy] = step.tip ?? [0, 0];
        return inside({ x: object.x + dx * entry.w, y: object.y + dy * entry.h }, resolve(step.onto));
      }
      if (step.do === 'offscreen') return nearEdge(object);
      if (step.do === 'uncover') {
        const cover = resolve(step.from);
        return Math.abs(object.x - cover.object.x) > cover.w * 0.75 || Math.abs(object.y - cover.object.y) > cover.h * 0.75;
      }
      return false;
    });

  const draggableIds = new Set(steps.filter((step) => step.drag).map((step) => step.drag));
  // объекты, которые просто двигаются по полю и остаются там, где их отпустили
  const freeIds = new Set(steps.filter((step) => step.do === 'uncover' || step.do === 'offscreen').map((step) => step.drag));
  for (const { def } of objects.values()) {
    if (def.draggable) draggableIds.add(def.id);
    if (def.draggable && !def.wrong) freeIds.add(def.id);
  }

  for (const id of draggableIds) {
    const entry = resolve(id);
    if (!entry) continue;
    // то, что просто двигают по полю, не должно закрыть собой кнопки «Меню» и «Подсказка»
    const options = freeIds.has(id) && !steps.some((step) => step.drag === id) ? { minY: 130 * u } : {};
    makeDraggable(scene, entry.object, (object, start) => {
      const match = matchDrop(id, object);
      const goHome = () => scene.tweens.add({ targets: object, x: start.x, y: start.y, duration: 250, ease: 'Quad.easeOut' });
      if (match && attempt(match.index)) {
        if (match.step.back) goHome();
        return;
      }
      const moved = Math.hypot(object.x - start.x, object.y - start.y) > 40 * u;
      if (!match && freeIds.has(id)) return;
      if (!match && moved) api.wrong();
      goHome();
    }, options);
    entry.object.on('dragstart', () => scene.children.bringToTop(entry.object));
  }

  // ——— нажатие и удержание ———

  steps.forEach((step, index) => {
    if (step.do !== 'tap' && step.do !== 'hold') return;
    const target = resolve(step.target);
    if (!target) return;
    const object = target.object;

    if (step.do === 'tap') {
      makeTappable(object, () => !state.done.includes(index) && attempt(index), { cursor: false, feedback: false });
      return;
    }

    // удержание: объект растёт, пока палец на нём
    object.setInteractive({ useHandCursor: true });
    let timer = null;
    let grow = null;
    const release = () => {
      timer?.remove();
      grow?.stop();
      timer = null;
      if (object.active) object.setScale(1);
    };
    object.on('pointerdown', () => {
      if (state.done.includes(index) || scene.solved) return;
      if (ordered && index !== pending()[0].index) {
        api.wrong(step.early && levelText(level, step.early));
        return;
      }
      grow = scene.tweens.add({ targets: object, scale: 1.2, duration: step.ms });
      timer = scene.time.delayedCall(step.ms, () => {
        release();
        attempt(index);
      });
      timers.push(timer);
    });
    object.on('pointerup', release);
    object.on('pointerout', release);
  });

  // объекты-обманки: нажатие на них — ошибка
  for (const { def, object } of objects.values()) {
    if (def.wrong && !def.draggable && !def.erasable) {
      // большие подложки не сжимаются от нажатия: на них лежат другие объекты
      const flat = def.shape === 'box' || def.shape === 'zone';
      makeTappable(object, () => api.wrong(), { cursor: false, feedback: !flat });
    }
  }

  // ——— вращение ———

  steps.forEach((step, index) => {
    if (step.do !== 'rotate') return;
    const target = resolve(step.target);
    const goal = step.turns * Math.PI * 2;
    const reach = Math.max(target.w, target.h) * 0.9;
    let last = null;
    let total = 0;
    const setTurn = (angle) => target.picture.setTurn?.(angle) ?? target.picture.setRotation(angle);
    const angleTo = (pointer) => Math.atan2(pointer.y - target.object.y, pointer.x - target.object.x);
    const near = (pointer) => Math.hypot(pointer.x - target.object.x, pointer.y - target.object.y) <= reach;

    const onDown = (pointer) => {
      if (state.done.includes(index) || scene.solved || api.isUiPress([]) || !near(pointer)) return;
      last = angleTo(pointer);
    };
    const onMove = (pointer) => {
      if (last === null || !pointer.isDown) return;
      const angle = angleTo(pointer);
      // кратчайшая разница углов, чтобы не было скачка при переходе через ±180°
      total += Math.atan2(Math.sin(angle - last), Math.cos(angle - last));
      last = angle;
      setTurn(total);
      if (total / goal >= 1) {
        last = null;
        attempt(index);
      } else if (total / goal <= -1) {
        // докрутили в другую сторону
        last = null;
        total = 0;
        setTurn(0);
        api.wrong();
      }
    };
    const onUp = () => {
      if (last === null) return;
      last = null;
      total = 0;
      if (!state.done.includes(index)) setTurn(0);
    };
    if (state.done.includes(index)) setTurn(goal);

    scene.input.on('pointerdown', onDown);
    scene.input.on('pointermove', onMove);
    scene.input.on('pointerup', onUp);
    listeners.push(['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp]);
  });

  // после пересборки сцены возвращаем всё, что уже сделано
  for (const index of state.done) applyEffects(steps[index]);

  return {
    objects,
    destroy: () => {
      timers.forEach((timer) => timer.remove());
      listeners.forEach(([event, handler]) => scene.input.off(event, handler));
    },
  };
}
