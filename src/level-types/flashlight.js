import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { makeTappable } from '../ui/widgets.js';
import { buildObjects } from './objects.js';

// flashlight — поле тёмное, палец или мышь светит кругом, объекты видны только в круге света.
//   answer — id объекта, на который нужно нажать; остальные объекты — декорации
// После верного ответа свет включается: темнота исчезает.
export function buildFlashlight(scene, level, field, api) {
  const u = scene.u;
  const radius = 120 * u;
  const lit = scene.solved;

  const dark = scene.add.graphics();
  dark.fillStyle(0x17131c, 1).fillRoundedRect(field.x, field.y, field.w, field.h, 24 * u);
  const spot = scene.add.graphics();
  spot.fillStyle(COLORS.bg, 1).fillCircle(0, 0, radius);
  // маска не в списке отрисовки: объекты видны только там, где её круг
  const maskShape = scene.make.graphics();
  maskShape.fillStyle(0xffffff, 1).fillCircle(0, 0, radius);
  const mask = maskShape.createGeometryMask();

  const objects = buildObjects(scene, level, field, api);

  const turnOn = () => {
    for (const { object } of objects.values()) object.clearMask();
    scene.tweens.add({ targets: [dark, spot], alpha: 0, duration: 300 });
  };

  for (const { def, object } of objects.values()) {
    if (!lit) object.setMask(mask);
    if (def.id === level.answer) {
      makeTappable(object, () => {
        turnOn();
        api.correct();
      }, { cursor: false });
    }
  }

  // круг света не выходит за поле
  const moveLight = (pointer) => {
    const x = Phaser.Math.Clamp(pointer.x, field.x + radius, field.x + field.w - radius);
    const y = Phaser.Math.Clamp(pointer.y, field.y + radius, field.y + field.h - radius);
    spot.setPosition(x, y);
    maskShape.setPosition(x, y);
  };
  moveLight({ x: field.x + field.w / 2, y: field.y + field.h / 2 });
  scene.input.on('pointermove', moveLight);
  scene.input.on('pointerdown', moveLight);

  if (lit) dark.setAlpha(0) && spot.setAlpha(0);

  return {
    objects,
    destroy: () => {
      scene.input.off('pointermove', moveLight);
      scene.input.off('pointerdown', moveLight);
      for (const { object } of objects.values()) object.clearMask();
      maskShape.destroy();
    },
  };
}
