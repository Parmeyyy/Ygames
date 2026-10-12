import { addShape } from '../ui/shapes.js';
import { buildObjects } from './objects.js';

// erase — сотри часть картинки пальцем или мышью (как стирают защитный слой).
//   объекты с erasable: true можно стирать
//   erase: { target, percent, tool } — какой объект нужно стереть и на какую долю (по умолчанию 0.5);
//                                      tool — картинка, которая ездит под пальцем (утюг и т. п.)
//   объект с wrong: true — стирать его нельзя: это ошибка, и он восстанавливается
//   объект с wiggle: true слегка шевелится, пока его не начали стирать
// Под стираемым объектом может лежать то, что он прячет (объекты рисуются в порядке списка).
export function buildErase(scene, level, field, api) {
  const u = scene.u;
  const objects = buildObjects(scene, level, field, api);
  const threshold = level.erase.percent ?? 0.5;
  const radius = 36 * u;
  const GRID = 8;

  // кисть не в списке отрисовки: ею только «вытирают» текстуру
  const brush = scene.make.graphics();
  brush.fillStyle(0xffffff, 1).fillCircle(0, 0, radius);

  const covers = [];
  // после ошибки стирание выключено, пока палец не отпустят: иначе одно движение даст несколько ошибок
  let locked = false;
  for (const entry of objects.values()) {
    if (!entry.def.erasable) continue;
    const { object, def } = entry;
    object.setVisible(false);
    // после решения стёртая цель не возвращается
    if (scene.solved && def.id === level.erase.target) continue;

    const w = entry.w + 12 * u;
    const h = entry.h + 12 * u;
    // объект перерисован в текстуру, которую можно стирать
    const texture = scene.add.renderTexture(object.x, object.y, w, h);
    texture.draw(object, w / 2, h / 2);
    const cover = { def, object, texture, w, h, cells: new Set(), wiggle: null };
    if (def.wiggle) {
      cover.wiggle = scene.tweens.add({ targets: texture, angle: { from: -3, to: 3 }, duration: 160, yoyo: true, repeat: -1 });
    }
    covers.push(cover);
  }

  let tool = null;
  if (level.erase.tool && !scene.solved) {
    tool = addShape(scene, level.erase.tool, 150 * u).object.setPosition(field.x + field.w * 0.85, field.y + field.h * 0.88);
    scene.children.bringToTop(tool);
  }

  const eraseAt = (cover, x, y) => {
    const localX = x - (cover.texture.x - cover.w / 2);
    const localY = y - (cover.texture.y - cover.h / 2);
    if (localX < -radius || localY < -radius || localX > cover.w + radius || localY > cover.h + radius) return;

    if (cover.wiggle) {
      cover.wiggle.stop();
      cover.wiggle = null;
      cover.texture.setAngle(0);
    }
    cover.texture.erase(brush, localX, localY);
    // доля стёртого считается по сетке GRID × GRID
    for (let row = 0; row < GRID; row += 1) {
      for (let col = 0; col < GRID; col += 1) {
        const cx = ((col + 0.5) * cover.w) / GRID;
        const cy = ((row + 0.5) * cover.h) / GRID;
        if (Math.hypot(cx - localX, cy - localY) <= radius) cover.cells.add(row * GRID + col);
      }
    }
  };

  const check = (cover) => {
    if (cover.cells.size / (GRID * GRID) < threshold) return;
    if (cover.def.id === level.erase.target) {
      scene.tweens.add({ targets: cover.texture, alpha: 0, duration: 250 });
      api.correct();
    } else if (cover.def.wrong) {
      // стёрли не то: объект возвращается
      cover.cells.clear();
      cover.texture.clear().draw(cover.object, cover.w / 2, cover.h / 2);
      locked = true;
      api.wrong();
    }
  };

  const onPointer = (pointer) => {
    if (!pointer.isDown || locked || scene.solved || api.isUiPress([])) return;
    tool?.setPosition(pointer.x, pointer.y - 20 * u);
    // между двумя событиями палец мог уйти далеко — стираем по всему отрезку
    const from = pointer.prevPosition;
    const steps = Math.max(1, Math.ceil(Math.hypot(pointer.x - from.x, pointer.y - from.y) / (radius * 0.5)));
    for (const cover of covers) {
      for (let i = 1; i <= steps; i += 1) {
        eraseAt(cover, from.x + ((pointer.x - from.x) * i) / steps, from.y + ((pointer.y - from.y) * i) / steps);
      }
      check(cover);
      if (scene.solved || locked) break;
    }
  };

  const unlock = () => {
    locked = false;
  };

  scene.input.on('pointermove', onPointer);
  scene.input.on('pointerdown', onPointer);
  scene.input.on('pointerup', unlock);

  return {
    objects,
    destroy: () => {
      scene.input.off('pointermove', onPointer);
      scene.input.off('pointerdown', onPointer);
      scene.input.off('pointerup', unlock);
      brush.destroy();
    },
  };
}
