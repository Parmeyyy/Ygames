import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { progress } from '../services/progress.js';
import { addHat } from './hats.js';

// Яйцо-заглушка: нарисовано фигурами, позже заменится на спрайты из public/assets.
// Живое: дышит, моргает, следит глазами за пальцем или мышью, сплющивается от нажатия.
// Сверху надетая шапка, после финала главы на скорлупе появляется трещина.
//
// Настроения (меняют глаза, брови, рот и румянец):
//   idle, happy (радость), scared (испуг), surprised (удивление), sly (хитрость),
//   sad (грусть), sleep (сон), cold (замёрзло), hot (жарко)

// eyes: dot — точки, wide — круглые от страха или удивления, arcUp — зажмурено от радости,
//       arcDown — закрыты, sly — прищур
const MOODS = {
  idle: { eyes: 'dot', blush: [COLORS.blush, 0.7] },
  happy: { eyes: 'arcUp', blush: [COLORS.blush, 1] },
  scared: { eyes: 'wide', eyeSize: 0.05, blush: [COLORS.blush, 0.3] },
  surprised: { eyes: 'wide', eyeSize: 0.06, blush: [COLORS.blush, 0.5] },
  sly: { eyes: 'sly', blush: [COLORS.blush, 0.8] },
  sad: { eyes: 'dot', blush: [COLORS.blush, 0.3] },
  sleep: { eyes: 'arcDown', blush: [COLORS.blush, 0.5] },
  cold: { eyes: 'dot', blush: [0x8ecbff, 0.8] },
  hot: { eyes: 'dot', blush: [0xff7a6b, 0.9] },
};

export class Egg extends Phaser.GameObjects.Container {
  // (x, y) — центр яйца, height — его высота в пикселях, hat — id шапки (по умолчанию надетая),
  // cracks — сколько трещин (по умолчанию по прогрессу игрока: по одной за каждую пройденную главу)
  constructor(scene, x, y, height, mood = 'idle', hat = progress.hat, cracks = progress.cracks) {
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;
    this.eggH = height;
    this.eggW = height * 0.76;
    this.baseMood = mood;
    this.cracks = cracks;

    const h = this.eggH;
    const w = this.eggW;

    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(COLORS.outline, 0.15).fillEllipse(0, h * 0.5, w * 0.9, h * 0.1);

    // Всё, что дышит и сплющивается. Начало координат — в основании яйца, поэтому при сжатии
    // оно не отрывается от земли; шапка лежит здесь же и двигается вместе с яйцом.
    this.figure = scene.add.container(0, h / 2);
    this.shell = scene.add.graphics({ y: -h / 2 });
    this.blush = scene.add.graphics({ y: -h / 2 });
    this.face = scene.add.graphics({ y: -h / 2 });
    this.eyeShapes = scene.add.graphics();
    this.pupils = scene.add.graphics();
    this.eyes = scene.add.container(0, -h / 2 - h * 0.05, [this.eyeShapes, this.pupils]);
    this.figure.add([this.shell, this.blush, this.face, this.eyes]);
    const hatObject = addHat(scene, hat, 0, -h, w);
    if (hatObject) this.figure.add(hatObject);

    this.add([this.shadow, this.figure]);
    this.setSize(w, h);
    scene.add.existing(this);

    this.drawShell();
    this.setMood(mood);

    this.startBreathing();
    this.scheduleBlink();
    scene.input.on('pointermove', this.lookAt, this);
    this.once('destroy', () => {
      this.blinkTimer?.remove();
      scene.input?.off('pointermove', this.lookAt, this);
    });
  }

  drawShell() {
    const { eggW: w, eggH: h } = this;
    const g = this.shell;
    g.fillStyle(COLORS.egg, 1).fillEllipse(0, 0, w, h);
    g.lineStyle(Math.max(2, h * 0.02), COLORS.outline, 1).strokeEllipse(0, 0, w, h);
    // блик
    g.fillStyle(COLORS.white, 0.9).fillEllipse(-w * 0.2, -h * 0.26, w * 0.12, h * 0.07);

    // трещины: по одной за каждую пройденную главу
    const cracks = [
      [
        [-0.2, -0.43],
        [-0.12, -0.33],
        [-0.24, -0.26],
        [-0.13, -0.18],
        [-0.22, -0.1],
      ],
      [
        [0.24, -0.4],
        [0.15, -0.3],
        [0.27, -0.22],
        [0.17, -0.13],
      ],
      [
        [-0.05, 0.47],
        [0.04, 0.38],
        [-0.06, 0.3],
        [0.03, 0.22],
      ],
    ];
    g.lineStyle(Math.max(2, h * 0.014), COLORS.outline, 1);
    for (const crack of cracks.slice(0, this.cracks)) {
      g.strokePoints(crack.map(([x, y]) => ({ x: x * w, y: y * h })));
    }
  }

  setMood(mood) {
    const { eggW: w, eggH: h } = this;
    const spec = MOODS[mood] ?? MOODS.idle;
    this.mood = mood;
    const eyeX = w * 0.17;
    const stroke = Math.max(2, h * 0.018);

    // румянец
    const [blushColor, blushAlpha] = spec.blush;
    this.blush.clear().fillStyle(blushColor, blushAlpha);
    this.blush.fillEllipse(-w * 0.27, h * 0.07, w * 0.14, h * 0.05);
    this.blush.fillEllipse(w * 0.27, h * 0.07, w * 0.14, h * 0.05);

    // глаза: формы рисуются вокруг линии глаз, зрачки — отдельно, чтобы следить за пальцем
    const shapes = this.eyeShapes.clear();
    const pupils = this.pupils.clear().setPosition(0, 0);
    shapes.lineStyle(stroke, COLORS.outline, 1);
    pupils.fillStyle(COLORS.outline, 1);
    const arc = (g, x, y, radius, from, to) => g.beginPath().arc(x, y, radius, from, to).strokePath();

    this.eyesOpen = !spec.eyes.startsWith('arc');
    if (spec.eyes === 'arcUp') {
      for (const x of [-eyeX, eyeX]) arc(shapes, x, 0, h * 0.035, Math.PI * 1.1, Math.PI * 1.9);
    } else if (spec.eyes === 'arcDown') {
      for (const x of [-eyeX, eyeX]) arc(shapes, x, 0, h * 0.035, Math.PI * 0.1, Math.PI * 0.9);
    } else if (spec.eyes === 'wide') {
      for (const x of [-eyeX, eyeX]) {
        shapes.fillStyle(COLORS.white, 1).fillCircle(x, 0, h * spec.eyeSize);
        shapes.strokeCircle(x, 0, h * spec.eyeSize);
        pupils.fillCircle(x, 0, h * 0.02);
      }
    } else if (spec.eyes === 'sly') {
      for (const x of [-eyeX, eyeX]) {
        pupils.fillCircle(x + w * 0.025, h * 0.008, h * 0.028);
        shapes.lineBetween(x - w * 0.07, -h * 0.012, x + w * 0.07, -h * 0.012); // прикрытое веко
      }
    } else {
      for (const x of [-eyeX, eyeX]) pupils.fillCircle(x, 0, h * 0.032);
    }

    // брови и рот
    const g = this.face.clear();
    g.fillStyle(COLORS.outline, 1).lineStyle(stroke, COLORS.outline, 1);
    const browY = -h * 0.135;
    const brow = (side, inner, outer) =>
      g.lineBetween(side * (eyeX - w * 0.07), browY + inner * h, side * (eyeX + w * 0.07), browY + outer * h);

    if (mood === 'happy') {
      g.slice(0, h * 0.06, w * 0.11, 0, Math.PI).fillPath();
    } else if (mood === 'scared') {
      brow(-1, -0.025, 0.01);
      brow(1, -0.025, 0.01);
      g.fillEllipse(0, h * 0.11, w * 0.1, h * 0.07);
    } else if (mood === 'surprised') {
      for (const x of [-eyeX, eyeX]) arc(g, x, browY + h * 0.02, w * 0.08, Math.PI * 1.15, Math.PI * 1.85);
      g.fillEllipse(0, h * 0.12, w * 0.13, h * 0.1);
    } else if (mood === 'sly') {
      brow(-1, 0.015, 0);
      brow(1, -0.005, -0.035); // одна бровь приподнята
      arc(g, w * 0.03, h * 0.04, w * 0.1, Math.PI * 0.1, Math.PI * 0.65); // ухмылка набок
    } else if (mood === 'sad') {
      brow(-1, -0.03, 0.012);
      brow(1, -0.03, 0.012);
      arc(g, 0, h * 0.16, w * 0.09, Math.PI * 1.2, Math.PI * 1.8);
    } else if (mood === 'sleep') {
      g.fillCircle(0, h * 0.1, h * 0.018);
    } else if (mood === 'cold') {
      brow(-1, -0.02, 0.008);
      brow(1, -0.02, 0.008);
      // дрожащий рот зигзагом
      g.strokePoints([-0.12, -0.06, 0, 0.06, 0.12].map((x, i) => ({ x: x * w, y: h * (i % 2 ? 0.07 : 0.1) })));
    } else if (mood === 'hot') {
      g.fillEllipse(0, h * 0.1, w * 0.14, h * 0.05);
      g.fillStyle(0x4aa3df, 1).fillCircle(w * 0.3, -h * 0.12, h * 0.025).fillCircle(-w * 0.32, -h * 0.02, h * 0.02);
    } else {
      arc(g, 0, h * 0.06, w * 0.09, Math.PI * 0.15, Math.PI * 0.85);
    }
    return this;
  }

  // ——— жизнь в покое ———

  startBreathing() {
    const sleeping = this.baseMood === 'sleep';
    this.figure.setScale(1);
    this.breath = this.scene.tweens.add({
      targets: this.figure,
      scaleY: sleeping ? 1.05 : 1.03,
      scaleX: sleeping ? 0.97 : 0.985,
      duration: sleeping ? 2000 : 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  scheduleBlink() {
    this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
      if (!this.scene) return;
      if (this.eyesOpen) {
        this.scene.tweens.add({ targets: this.eyes, scaleY: 0.1, duration: 70, yoyo: true });
      }
      this.scheduleBlink();
    });
  }

  // Зрачки смотрят в сторону указателя
  lookAt(pointer) {
    if (!this.eyesOpen || this.mood === 'sly') return;
    const matrix = this.getWorldTransformMatrix();
    const dx = pointer.x - matrix.tx;
    const dy = pointer.y - (matrix.ty - this.eggH * 0.05);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = this.eggH * 0.014 * Math.min(1, distance / this.eggH);
    this.pupils.setPosition((dx / distance) * reach, (dy / distance) * reach);
  }

  // Сплющилось и подпрыгнуло. Двигается только фигура, само яйцо остаётся на месте.
  squash() {
    const { scene, figure, eggH: h } = this;
    this.bounce?.stop();
    this.breath?.stop();
    figure.setScale(1).setY(h / 2);
    this.bounce = scene.tweens.chain({
      targets: figure,
      tweens: [
        { scaleX: 1.16, scaleY: 0.84, duration: 70, ease: 'Quad.easeOut' },
        { scaleX: 0.93, scaleY: 1.09, y: h / 2 - h * 0.07, duration: 120, ease: 'Quad.easeOut' },
        { scaleX: 1.06, scaleY: 0.95, y: h / 2, duration: 110, ease: 'Quad.easeIn' },
        { scaleX: 1, scaleY: 1, duration: 160, ease: 'Back.easeOut' },
      ],
      onComplete: () => this.startBreathing(),
    });
  }

  // Яйцо реагирует на нажатия по себе (для яиц-героев; маленьким яйцам на поле это не нужно)
  enableTaps() {
    if (!this.input) this.setInteractive();
    this.on('pointerdown', () => this.squash());
    return this;
  }

  // Эмоция с анимацией: испуг с дрожью проходит сам, радость с прыжками остаётся
  react(mood) {
    const { scene, figure, eggH: h } = this;
    scene.tweens.killTweensOf(this);
    this.setPosition(this.homeX, this.homeY).setMood(mood);

    if (mood === 'happy') {
      this.bounce?.stop();
      this.breath?.stop();
      figure.setScale(1).setY(h / 2);
      scene.tweens.add({
        targets: this,
        y: this.homeY - h * 0.18,
        duration: 190,
        ease: 'Quad.easeOut',
        yoyo: true,
        repeat: 1,
      });
      // вытягивается в прыжке и сплющивается при приземлении
      this.bounce = scene.tweens.chain({
        targets: figure,
        tweens: [
          { scaleX: 0.92, scaleY: 1.1, duration: 190 },
          { scaleX: 1.1, scaleY: 0.9, duration: 190 },
          { scaleX: 0.92, scaleY: 1.1, duration: 190 },
          { scaleX: 1.1, scaleY: 0.9, duration: 190 },
          { scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' },
        ],
        onComplete: () => this.startBreathing(),
      });
    } else {
      // дрожь
      scene.tweens.add({
        targets: this,
        x: this.homeX + h * 0.045,
        duration: 50,
        yoyo: true,
        repeat: 5,
        onComplete: () => this.setMood(this.baseMood),
      });
    }
  }
}
