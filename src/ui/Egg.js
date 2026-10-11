import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { progress } from '../services/progress.js';
import { addHat } from './hats.js';

// Яйцо-заглушка: нарисовано фигурами, позже заменится на спрайты из public/assets.
// Настроения: idle, happy, scared, sleep, cold, hot. Сверху рисуется надетая шапка,
// а после финала главы на скорлупе появляется трещина.
export class Egg extends Phaser.GameObjects.Container {
  // (x, y) — центр яйца, height — его высота в пикселях, hat — id шапки (по умолчанию надетая),
  // cracks — сколько трещин (по умолчанию по прогрессу игрока)
  constructor(scene, x, y, height, mood = 'idle', hat = progress.hat, cracks = progress.cracks) {
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;
    this.eggH = height;
    this.eggW = height * 0.76;
    this.baseMood = mood;
    this.cracks = cracks;

    this.shell = scene.add.graphics();
    this.face = scene.add.graphics();
    this.add([this.shell, this.face]);
    const hatObject = addHat(scene, hat, 0, -height / 2, this.eggW);
    if (hatObject) this.add(hatObject);
    this.setSize(this.eggW, this.eggH);
    scene.add.existing(this);

    this.drawShell();
    this.setMood(mood);
  }

  drawShell() {
    const { eggW: w, eggH: h } = this;
    const g = this.shell;
    g.fillStyle(COLORS.outline, 0.15).fillEllipse(0, h * 0.5, w * 0.9, h * 0.1);
    g.fillStyle(COLORS.egg, 1).fillEllipse(0, 0, w, h);
    g.lineStyle(Math.max(2, h * 0.02), COLORS.outline, 1).strokeEllipse(0, 0, w, h);
    g.fillStyle(COLORS.blush, 0.7);
    g.fillEllipse(-w * 0.27, h * 0.07, w * 0.14, h * 0.05);
    g.fillEllipse(w * 0.27, h * 0.07, w * 0.14, h * 0.05);

    if (this.cracks > 0) {
      const points = [
        [-0.2, -0.43],
        [-0.12, -0.33],
        [-0.24, -0.26],
        [-0.13, -0.18],
        [-0.22, -0.1],
      ].map(([x, y]) => ({ x: x * w, y: y * h }));
      g.lineStyle(Math.max(2, h * 0.014), COLORS.outline, 1).strokePoints(points);
    }
  }

  setMood(mood) {
    const { eggW: w, eggH: h } = this;
    const g = this.face.clear();
    const eyeX = w * 0.17;
    const eyeY = -h * 0.05;
    const line = Math.max(2, h * 0.018);
    const arc = (x, y, radius, from, to) => g.beginPath().arc(x, y, radius, from, to).strokePath();

    g.fillStyle(COLORS.outline, 1).lineStyle(line, COLORS.outline, 1);

    if (mood === 'happy') {
      arc(-eyeX, eyeY, h * 0.035, Math.PI * 1.1, Math.PI * 1.9);
      arc(eyeX, eyeY, h * 0.035, Math.PI * 1.1, Math.PI * 1.9);
      g.slice(0, h * 0.06, w * 0.11, 0, Math.PI).fillPath();
    } else if (mood === 'scared') {
      for (const x of [-eyeX, eyeX]) {
        g.fillStyle(COLORS.white, 1).fillCircle(x, eyeY, h * 0.05);
        g.strokeCircle(x, eyeY, h * 0.05);
        g.fillStyle(COLORS.outline, 1).fillCircle(x, eyeY, h * 0.018);
      }
      g.fillEllipse(0, h * 0.11, w * 0.1, h * 0.07);
    } else if (mood === 'cold' || mood === 'hot') {
      g.fillCircle(-eyeX, eyeY, h * 0.03);
      g.fillCircle(eyeX, eyeY, h * 0.03);
      if (mood === 'cold') {
        // дрожащий рот зигзагом
        const zigzag = [-0.12, -0.06, 0, 0.06, 0.12].map((x, i) => ({ x: x * w, y: h * (i % 2 ? 0.07 : 0.1) }));
        g.strokePoints(zigzag);
      } else {
        g.fillEllipse(0, h * 0.1, w * 0.14, h * 0.05);
        g.fillStyle(0x4aa3df, 1).fillCircle(w * 0.3, -h * 0.12, h * 0.025).fillCircle(-w * 0.32, -h * 0.02, h * 0.02);
      }
    } else if (mood === 'sleep') {
      arc(-eyeX, eyeY, h * 0.035, Math.PI * 0.1, Math.PI * 0.9);
      arc(eyeX, eyeY, h * 0.035, Math.PI * 0.1, Math.PI * 0.9);
      g.fillCircle(0, h * 0.1, h * 0.018);
    } else {
      g.fillCircle(-eyeX, eyeY, h * 0.032);
      g.fillCircle(eyeX, eyeY, h * 0.032);
      arc(0, h * 0.06, w * 0.09, Math.PI * 0.15, Math.PI * 0.85);
    }
    return this;
  }

  // Эмоция с анимацией: испуг проходит сам, радость остаётся
  react(mood) {
    const { scene, eggH: h } = this;
    scene.tweens.killTweensOf(this);
    this.setPosition(this.homeX, this.homeY).setMood(mood);

    if (mood === 'scared') {
      scene.tweens.add({
        targets: this,
        x: this.homeX + h * 0.05,
        duration: 60,
        yoyo: true,
        repeat: 4,
        onComplete: () => this.setMood(this.baseMood),
      });
    } else if (mood === 'happy') {
      scene.tweens.add({
        targets: this,
        y: this.homeY - h * 0.15,
        duration: 180,
        ease: 'Quad.easeOut',
        yoyo: true,
        repeat: 1,
      });
    }
  }
}
