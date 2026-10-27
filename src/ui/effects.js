import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { addCoin } from './widgets.js';

// Лёгкие эффекты на твинах: без частиц и шейдеров, чтобы не тормозить на слабых телефонах.

// Красная вспышка по краям экрана при ошибке
export function flashError(scene) {
  const { W, H, u } = scene;
  const frame = scene.add.graphics();
  // несколько вложенных рамок с убывающей прозрачностью дают мягкий край
  for (let i = 0; i < 6; i += 1) {
    const inset = i * 9 * u;
    frame.lineStyle(10 * u, 0xff3b30, 0.34 - i * 0.055).strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  }
  scene.tweens.add({ targets: frame, alpha: 0, duration: 420, ease: 'Quad.easeIn', onComplete: () => frame.destroy() });
}

// Конфетти: цветные прямоугольники падают сверху
export function confetti(scene, count = 36) {
  const { W, H, u } = scene;
  const colors = [COLORS.accent, COLORS.success, COLORS.coin, COLORS.special, 0xff7eb6, 0x4aa3df];
  for (let i = 0; i < count; i += 1) {
    const piece = scene.add.rectangle(
      Phaser.Math.Between(0, W),
      -20 * u,
      Phaser.Math.Between(10, 18) * u,
      Phaser.Math.Between(6, 12) * u,
      Phaser.Utils.Array.GetRandom(colors),
    );
    scene.tweens.add({
      targets: piece,
      y: H + 30 * u,
      x: piece.x + Phaser.Math.Between(-120, 120) * u,
      angle: Phaser.Math.Between(-540, 540),
      duration: Phaser.Math.Between(1500, 2600),
      delay: Phaser.Math.Between(0, 500),
      ease: 'Quad.easeIn',
      onComplete: () => piece.destroy(),
    });
  }
}

// Монеты летят из точки from в точку to. onArrive() — на каждую долетевшую, onDone() — когда долетели все.
export function flyCoins(scene, from, to, count, onArrive, onDone) {
  const u = scene.u;
  for (let i = 0; i < count; i += 1) {
    const coin = addCoin(scene, from.x, from.y, 13 * u);
    scene.tweens.add({
      targets: coin,
      x: to.x,
      y: to.y,
      duration: 520,
      delay: 250 + i * 90,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        coin.destroy();
        onArrive();
        if (i === count - 1) onDone?.();
      },
    });
  }
}
