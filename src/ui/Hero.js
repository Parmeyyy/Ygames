import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { getItem } from '../items.js';
import { progress } from '../services/progress.js';
import { addHat } from './hats.js';
import { addShape } from './shapes.js';

// Валера — герой игры: мужик в трениках, майке и кепке, с пузиком и усами. Нарисован фигурами,
// позже заменится на спрайты из public/assets.
// Живой: дышит, моргает, следит глазами за пальцем или мышью, сплющивается от нажатия.
//
// Настроения (меняют глаза, брови, рот и румянец):
//   idle, happy (радость), scared (испуг), surprised (удивление), sly (хитрость),
//   sad (грусть), sleep (сон)

const SKIN = 0xf2c9a0;
const SKIN_DARK = 0xdba77c;
const PANTS = 0x2e4a8f;
const HAIR = 0x6b4423;

// eyes: dot — точки, wide — круглые от страха или удивления, arcUp — зажмурено от радости,
//       arcDown — закрыты, sly — прищур
const MOODS = {
  idle: { eyes: 'dot', blush: 0.5 },
  happy: { eyes: 'arcUp', blush: 0.9 },
  scared: { eyes: 'wide', eyeSize: 0.028, blush: 0.2 },
  surprised: { eyes: 'wide', eyeSize: 0.034, blush: 0.4 },
  sly: { eyes: 'sly', blush: 0.6 },
  sad: { eyes: 'dot', blush: 0.2 },
  sleep: { eyes: 'arcDown', blush: 0.4 },
};

// Точки на теле в долях роста: x от середины, y от подошв вверх (отрицательный)
const ANCHORS = {
  head: [0, -0.84],
  forehead: [0, -0.795],
  mouth: [0, -0.65],
  chest: [0, -0.47],
  hand: [0.27, -0.31],
  body: [0, -0.45],
};
// Радиусы зон вокруг этих точек (в долях роста): куда можно попасть предметом или пальцем
const ZONE_RADIUS = { head: 0.2, forehead: 0.09, mouth: 0.16, chest: 0.11, hand: 0.17, body: 0.25 };

export class Hero extends Phaser.GameObjects.Container {
  // (x, y) — центр фигуры, height — рост в пикселях (вместе с кепкой).
  // options: item — id надетого предмета гардероба (по умолчанию из прогресса), props — детали для уровня:
  //   socks: true         — вместо тапок носки
  //   glasses: "forehead" | "eyes"
  //   pass: "back" | "front" — пропуск на шнурке: перевёрнут или лицом
  constructor(scene, x, y, height, mood = 'idle', { item = progress.hat, props = {} } = {}) {
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;
    this.heroH = height;
    this.heroW = height * 0.56;
    this.baseMood = mood;
    this.props = { ...props };
    this.item = item;
    this.held = null;

    const k = height;

    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(COLORS.outline, 0.15).fillEllipse(0, k * 0.5, k * 0.5, k * 0.06);

    // Всё, что дышит и сплющивается. Начало координат — у подошв, поэтому при сжатии
    // Валера не отрывается от земли; шапка и предметы в руках двигаются вместе с ним.
    this.figure = scene.add.container(0, k / 2);
    this.torso = scene.add.graphics();
    this.blush = scene.add.graphics();
    this.face = scene.add.graphics();
    this.eyeShapes = scene.add.graphics();
    this.pupils = scene.add.graphics();
    this.eyes = scene.add.container(0, -k * 0.755, [this.eyeShapes, this.pupils]);
    this.extras = scene.add.graphics();
    this.hatLayer = scene.add.container(0, 0);
    this.handLayer = scene.add.container(k * ANCHORS.hand[0], k * ANCHORS.hand[1]);
    this.figure.add([this.torso, this.blush, this.face, this.eyes, this.hatLayer, this.extras, this.handLayer]);

    this.add([this.shadow, this.figure]);
    this.setSize(this.heroW, k);
    scene.add.existing(this);

    this.drawBody();
    this.drawHat();
    this.drawExtras();
    this.setMood(mood);

    this.startBreathing();
    this.scheduleBlink();
    scene.input.on('pointermove', this.lookAt, this);
    this.once('destroy', () => {
      this.blinkTimer?.remove();
      scene.input?.off('pointermove', this.lookAt, this);
    });
  }

  drawBody() {
    const k = this.heroH;
    const g = this.torso.clear();
    const stroke = Math.max(2, k * 0.012);
    g.lineStyle(stroke, COLORS.outline, 1);

    // ноги в трениках с лампасами
    for (const side of [-1, 1]) {
      g.fillStyle(PANTS, 1).fillRoundedRect(side * k * 0.1 - k * 0.075, -k * 0.34, k * 0.15, k * 0.31, k * 0.04);
      g.strokeRoundedRect(side * k * 0.1 - k * 0.075, -k * 0.34, k * 0.15, k * 0.31, k * 0.04);
      g.fillStyle(COLORS.white, 1).fillRect(side * k * 0.16 - k * 0.008, -k * 0.32, k * 0.016, k * 0.27);
    }
    // обувь: тапки или носки
    for (const side of [-1, 1]) {
      if (this.props.socks) {
        g.fillStyle(COLORS.white, 1).fillRoundedRect(side * k * 0.1 - k * 0.06, -k * 0.075, k * 0.14, k * 0.07, k * 0.03);
        g.strokeRoundedRect(side * k * 0.1 - k * 0.06, -k * 0.075, k * 0.14, k * 0.07, k * 0.03);
        g.fillStyle(0xd63d3d, 1).fillRect(side * k * 0.1 - k * 0.06, -k * 0.062, k * 0.14, k * 0.014);
      } else {
        g.fillStyle(0x8a5a2b, 1).fillEllipse(side * k * 0.11, -k * 0.025, k * 0.18, k * 0.06);
        g.strokeEllipse(side * k * 0.11, -k * 0.025, k * 0.18, k * 0.06);
      }
    }
    // руки
    for (const side of [-1, 1]) {
      g.fillStyle(SKIN, 1).fillEllipse(side * k * 0.265, -k * 0.44, k * 0.1, k * 0.3);
      g.strokeEllipse(side * k * 0.265, -k * 0.44, k * 0.1, k * 0.3);
    }
    // пузо в майке
    g.fillStyle(COLORS.white, 1).fillEllipse(0, -k * 0.45, k * 0.5, k * 0.4);
    g.strokeEllipse(0, -k * 0.45, k * 0.5, k * 0.4);
    // вырез майки
    g.fillStyle(SKIN, 1).slice(0, -k * 0.635, k * 0.1, 0, Math.PI).fillPath().strokePath();
    // голова и уши
    g.fillStyle(SKIN, 1);
    g.fillCircle(-k * 0.14, -k * 0.73, k * 0.03).fillCircle(k * 0.14, -k * 0.73, k * 0.03);
    g.strokeCircle(-k * 0.14, -k * 0.73, k * 0.03).strokeCircle(k * 0.14, -k * 0.73, k * 0.03);
    g.fillCircle(0, -k * 0.73, k * 0.14);
    g.strokeCircle(0, -k * 0.73, k * 0.14);
    // щетина
    g.fillStyle(SKIN_DARK, 0.5).slice(0, -k * 0.7, k * 0.125, 0.15 * Math.PI, 0.85 * Math.PI).fillPath();
  }

  // Головной убор: предмет из гардероба или родная кепка. Значки (медаль, бабочка) носятся вместе с кепкой.
  drawHat() {
    const k = this.heroH;
    const size = k * 0.46;
    const top = -k * 0.87;
    this.hatLayer.removeAll(true);
    const kind = getItem(this.item)?.kind;
    const hat = !this.item || kind === 'badge' ? 'cap' : this.item;
    for (const id of kind === 'badge' ? [hat, this.item] : [hat]) {
      const object = addHat(this.scene, id, 0, top, size);
      if (object) this.hatLayer.add(object);
    }
  }

  // Детали, которые нужны отдельным уровням
  drawExtras() {
    const k = this.heroH;
    const g = this.extras.clear();
    const stroke = Math.max(2, k * 0.012);

    if (this.props.glasses) {
      const y = this.props.glasses === 'eyes' ? -k * 0.755 : -k * 0.83;
      g.lineStyle(stroke, COLORS.outline, 1);
      g.fillStyle(0xbfe3ff, 0.6);
      for (const side of [-1, 1]) {
        g.fillCircle(side * k * 0.055, y, k * 0.036);
        g.strokeCircle(side * k * 0.055, y, k * 0.036);
      }
      g.lineBetween(-k * 0.02, y, k * 0.02, y);
    }

    if (this.props.pass) {
      g.lineStyle(stroke, 0x2e7d32, 1);
      g.lineBetween(-k * 0.07, -k * 0.61, 0, -k * 0.5);
      g.lineBetween(k * 0.07, -k * 0.61, 0, -k * 0.5);
      g.lineStyle(stroke, COLORS.outline, 1);
      const front = this.props.pass === 'front';
      g.fillStyle(front ? COLORS.white : 0x9aa0a6, 1).fillRoundedRect(-k * 0.05, -k * 0.5, k * 0.1, k * 0.12, k * 0.015);
      g.strokeRoundedRect(-k * 0.05, -k * 0.5, k * 0.1, k * 0.12, k * 0.015);
      if (front) {
        g.fillStyle(SKIN, 1).fillCircle(0, -k * 0.46, k * 0.02);
        g.fillStyle(COLORS.outline, 1).fillRect(-k * 0.03, -k * 0.42, k * 0.06, k * 0.008);
      }
    }
  }

  setMood(mood) {
    const k = this.heroH;
    const spec = MOODS[mood] ?? MOODS.idle;
    this.mood = mood;
    const eyeX = k * 0.055;
    const stroke = Math.max(2, k * 0.011);

    // румянец
    this.blush.clear().fillStyle(COLORS.blush, spec.blush);
    this.blush.fillEllipse(-k * 0.095, -k * 0.705, k * 0.05, k * 0.03);
    this.blush.fillEllipse(k * 0.095, -k * 0.705, k * 0.05, k * 0.03);

    // глаза: формы рисуются вокруг линии глаз, зрачки — отдельно, чтобы следить за пальцем
    const shapes = this.eyeShapes.clear();
    const pupils = this.pupils.clear().setPosition(0, 0);
    shapes.lineStyle(stroke, COLORS.outline, 1);
    pupils.fillStyle(COLORS.outline, 1);
    const arc = (g, x, y, radius, from, to) => g.beginPath().arc(x, y, radius, from, to).strokePath();

    this.eyesOpen = !spec.eyes.startsWith('arc');
    if (spec.eyes === 'arcUp') {
      for (const x of [-eyeX, eyeX]) arc(shapes, x, 0, k * 0.022, Math.PI * 1.1, Math.PI * 1.9);
    } else if (spec.eyes === 'arcDown') {
      for (const x of [-eyeX, eyeX]) arc(shapes, x, 0, k * 0.022, Math.PI * 0.1, Math.PI * 0.9);
    } else if (spec.eyes === 'wide') {
      for (const x of [-eyeX, eyeX]) {
        shapes.fillStyle(COLORS.white, 1).fillCircle(x, 0, k * spec.eyeSize);
        shapes.strokeCircle(x, 0, k * spec.eyeSize);
        pupils.fillCircle(x, 0, k * 0.012);
      }
    } else if (spec.eyes === 'sly') {
      for (const x of [-eyeX, eyeX]) {
        pupils.fillCircle(x + k * 0.01, k * 0.004, k * 0.016);
        shapes.lineBetween(x - k * 0.03, -k * 0.008, x + k * 0.03, -k * 0.008); // прикрытое веко
      }
    } else {
      for (const x of [-eyeX, eyeX]) pupils.fillCircle(x, 0, k * 0.018);
    }

    // брови, нос, рот и усы
    const g = this.face.clear();
    g.fillStyle(COLORS.outline, 1).lineStyle(stroke * 1.4, HAIR, 1);
    const browY = -k * 0.795;
    const brow = (side, inner, outer) =>
      g.lineBetween(side * (eyeX - k * 0.03), browY + inner * k, side * (eyeX + k * 0.03), browY + outer * k);

    if (mood === 'scared' || mood === 'sad') {
      brow(-1, -0.014, 0.006);
      brow(1, -0.014, 0.006);
    } else if (mood === 'surprised') {
      brow(-1, -0.016, -0.016);
      brow(1, -0.016, -0.016);
    } else if (mood === 'sly') {
      brow(-1, 0.006, 0);
      brow(1, -0.004, -0.02); // одна бровь приподнята
    } else {
      brow(-1, 0, 0);
      brow(1, 0, 0);
    }

    g.lineStyle(stroke, COLORS.outline, 1);
    const mouthY = -k * 0.648;
    if (mood === 'happy') {
      g.fillStyle(COLORS.outline, 1).slice(0, mouthY - k * 0.008, k * 0.045, 0, Math.PI).fillPath();
    } else if (mood === 'scared') {
      g.fillStyle(COLORS.outline, 1).fillEllipse(0, mouthY + k * 0.006, k * 0.04, k * 0.035);
    } else if (mood === 'surprised') {
      g.fillStyle(COLORS.outline, 1).fillEllipse(0, mouthY + k * 0.01, k * 0.05, k * 0.05);
    } else if (mood === 'sly') {
      arc(g, k * 0.012, mouthY - k * 0.012, k * 0.04, Math.PI * 0.1, Math.PI * 0.65); // ухмылка набок
    } else if (mood === 'sad') {
      arc(g, 0, mouthY + k * 0.035, k * 0.04, Math.PI * 1.2, Math.PI * 1.8);
    } else if (mood === 'sleep') {
      g.fillStyle(COLORS.outline, 1).fillCircle(0, mouthY + k * 0.004, k * 0.012);
    } else {
      arc(g, 0, mouthY - k * 0.016, k * 0.04, Math.PI * 0.15, Math.PI * 0.85);
    }

    // нос и усы поверх рта
    g.fillStyle(SKIN_DARK, 1).fillEllipse(0, -k * 0.712, k * 0.05, k * 0.04);
    g.fillStyle(HAIR, 1);
    g.fillEllipse(-k * 0.045, -k * 0.678, k * 0.1, k * 0.04);
    g.fillEllipse(k * 0.045, -k * 0.678, k * 0.1, k * 0.04);
    return this;
  }

  // ——— что уровень может менять на Валере ———

  // Надеть предмет гардероба (или вернуть родную кепку: null)
  setHat(id) {
    this.item = id;
    this.drawHat();
    return this;
  }

  // Дать в руку картинку из src/ui/shapes.js (null — забрать)
  hold(shape) {
    this.held = shape;
    this.handLayer.removeAll(true);
    if (shape) this.handLayer.add(addShape(this.scene, shape, this.heroH * 0.22).object);
    return this;
  }

  setProps(props) {
    Object.assign(this.props, props);
    this.drawBody();
    this.drawExtras();
    return this;
  }

  // Точка на теле в координатах сцены и радиус зоны вокруг неё. part: head, forehead, mouth, chest, hand, body
  zone(part) {
    const [x, y] = ANCHORS[part] ?? ANCHORS.body;
    const k = this.heroH;
    return { x: this.homeX + x * k, y: this.homeY + k / 2 + y * k, radius: (ZONE_RADIUS[part] ?? 0.2) * k };
  }

  // ——— жизнь в покое ———

  startBreathing() {
    const sleeping = this.baseMood === 'sleep';
    this.figure.setScale(1);
    this.breath = this.scene.tweens.add({
      targets: this.figure,
      scaleY: sleeping ? 1.035 : 1.02,
      scaleX: sleeping ? 0.98 : 0.99,
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
    const dy = pointer.y - (matrix.ty - this.heroH * 0.25);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = this.heroH * 0.008 * Math.min(1, distance / this.heroH);
    this.pupils.setPosition((dx / distance) * reach, (dy / distance) * reach);
  }

  // Сплющился и подпрыгнул. Двигается только фигура, сам Валера остаётся на месте.
  squash() {
    const { scene, figure, heroH: h } = this;
    this.bounce?.stop();
    this.breath?.stop();
    figure.setScale(1).setY(h / 2);
    this.bounce = scene.tweens.chain({
      targets: figure,
      tweens: [
        { scaleX: 1.14, scaleY: 0.86, duration: 70, ease: 'Quad.easeOut' },
        { scaleX: 0.94, scaleY: 1.07, y: h / 2 - h * 0.06, duration: 120, ease: 'Quad.easeOut' },
        { scaleX: 1.05, scaleY: 0.96, y: h / 2, duration: 110, ease: 'Quad.easeIn' },
        { scaleX: 1, scaleY: 1, duration: 160, ease: 'Back.easeOut' },
      ],
      onComplete: () => this.startBreathing(),
    });
  }

  // Валера реагирует на нажатия по себе
  enableTaps() {
    if (!this.input) this.setInteractive();
    this.on('pointerdown', () => this.squash());
    return this;
  }

  // Эмоция с анимацией: испуг с дрожью проходит сам, радость с прыжками остаётся
  react(mood) {
    const { scene, figure, heroH: h } = this;
    scene.tweens.killTweensOf(this);
    this.setPosition(this.homeX, this.homeY).setMood(mood);

    if (mood === 'happy') {
      this.bounce?.stop();
      this.breath?.stop();
      figure.setScale(1).setY(h / 2);
      scene.tweens.add({
        targets: this,
        y: this.homeY - h * 0.14,
        duration: 190,
        ease: 'Quad.easeOut',
        yoyo: true,
        repeat: 1,
      });
      // вытягивается в прыжке и сплющивается при приземлении
      this.bounce = scene.tweens.chain({
        targets: figure,
        tweens: [
          { scaleX: 0.94, scaleY: 1.08, duration: 190 },
          { scaleX: 1.08, scaleY: 0.92, duration: 190 },
          { scaleX: 0.94, scaleY: 1.08, duration: 190 },
          { scaleX: 1.08, scaleY: 0.92, duration: 190 },
          { scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' },
        ],
        onComplete: () => this.startBreathing(),
      });
    } else {
      // дрожь
      scene.tweens.add({
        targets: this,
        x: this.homeX + h * 0.03,
        duration: 50,
        yoyo: true,
        repeat: 5,
        onComplete: () => this.setMood(this.baseMood),
      });
    }
  }
}
