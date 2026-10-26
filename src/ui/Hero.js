import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { getItem } from '../items.js';
import { progress } from '../services/progress.js';
import { PANTS, TOPS } from './clothes.js';
import { addHat } from './hats.js';
import { heroTexture } from './images.js';
import { addShape } from './shapes.js';

// Валера — герой игры: мужик в трениках, майке и кепке, с пузиком и усами.
// Живой: дышит, моргает, следит глазами за пальцем или мышью, сплющивается от нажатия.
//
// Два способа нарисовать:
//   картинки из Canva (src/assets/hero/): ноги, торс с руками и голова на каждую эмоцию складываются
//     друг на друга, шапка сверху. Так Валера рисуется, когда есть картинки для всего, что на нём надето;
//   фигуры кодом — во всех остальных случаях (например, для одежды, у которой ещё нет картинки).
//
// Настроения (меняют глаза, брови, рот и румянец):
//   idle, happy (радость), scared (испуг), surprised (удивление), sly (хитрость),
//   sad (грусть), sleep (сон)

const SKIN = 0xf2c9a0;
const SKIN_DARK = 0xdba77c;
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
  pocket: [0.13, -0.3],
  body: [0, -0.45],
};
// Как части из Canva складываются друг с другом (в долях размеров самих картинок)
const ART = {
  height: 0.88, // рост без шапки в долях height
  neck: 0.33, // голова заходит на торс на эту долю своей высоты
  waist: 0.75, // ноги начинаются на этой высоте торса
  face: { y: 0.47, radius: 0.38 }, // середина лица и его радиус (в долях ширины головы)
  forehead: 0.28,
  mouth: 0.72,
  chin: 0.93,
  chest: 0.35,
  hand: { x: 0.4, y: 0.9 },
  pocket: { x: 0.2, y: 0.12 },
};

// Радиусы зон вокруг этих точек (в долях роста): куда можно попасть предметом или пальцем
const ZONE_RADIUS = { head: 0.2, forehead: 0.09, mouth: 0.16, chest: 0.11, hand: 0.17, pocket: 0.1, body: 0.25 };

export class Hero extends Phaser.GameObjects.Container {
  // (x, y) — центр фигуры, height — рост в пикселях (вместе с кепкой).
  // options: item, top, pants, hand — id надетых вещей (по умолчанию из прогресса; hand: null — руки пустые),
  // props — детали для уровня:
  //   socks: true         — вместо тапок носки
  //   glasses: "forehead" | "eyes"
  //   pass: "back" | "front" — пропуск на шнурке: перевёрнут или лицом
  //   dirty: true         — пятна на шапке, sweat: true — капли пота, hook: true — крючок на кепке,
  //   beetle: true        — колорадский жук на кепке
  constructor(scene, x, y, height, mood = 'idle', options = {}) {
    const { item = progress.hat, top = progress.top, pants = progress.pants, hand = progress.hand, props = {} } = options;
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;
    this.heroH = height;
    this.heroW = height * 0.56;
    this.baseMood = mood;
    this.props = { ...props };
    this.item = item;
    this.top = top;
    this.pants = pants;
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
    // части-картинки: ноги, торс и голова (используются, если для наряда есть картинки)
    this.legsImage = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.torsoImage = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.headImage = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.anchors = ANCHORS;
    this.figure.add([this.legsImage, this.torsoImage, this.headImage]);
    this.figure.add([this.torso, this.blush, this.face, this.eyes, this.hatLayer, this.extras, this.handLayer]);

    this.add([this.shadow, this.figure]);
    this.setSize(this.heroW, k);
    scene.add.existing(this);

    this.drawBody();
    this.drawHat();
    this.drawExtras();
    this.setMood(mood);
    if (hand) this.hold(getItem(hand)?.shape ?? null);

    this.startBreathing();
    this.scheduleBlink();
    scene.input.on('pointermove', this.lookAt, this);
    this.once('destroy', () => {
      this.blinkTimer?.remove();
      scene.input?.off('pointermove', this.lookAt, this);
    });
  }

  // Картинки для того, что сейчас надето; null — каких-то нет, и Валера рисуется кодом
  artParts() {
    const scene = this.scene;
    const head = heroTexture(scene, 'head-idle');
    const torso = heroTexture(scene, `torso-${this.top ?? 'tank'}`);
    const legs = heroTexture(scene, `legs-${this.pants ?? 'track'}${this.props.socks ? '-socks' : ''}`);
    return head && torso && legs ? { head, torso, legs } : null;
  }

  // Складывает Валеру из картинок и запоминает, где у него голова, рот, руки и прочее
  drawArt(parts) {
    const k = this.heroH;
    const { legsImage: legs, torsoImage: torso, headImage: head } = this;
    legs.setTexture(parts.legs).setOrigin(0.5, 1);
    torso.setTexture(parts.torso).setOrigin(0.5, 0);
    head.setTexture(parts.head).setOrigin(0.5, 0);
    // общий масштаб: части нарисованы одним листом в одном размере
    const px = legs.height + torso.height * ART.waist + head.height * (1 - ART.neck);
    const scale = (k * ART.height) / px;
    for (const image of [legs, torso, head]) image.setScale(scale).setVisible(true);
    const legsH = legs.height * scale;
    const torsoH = torso.height * scale;
    const torsoW = torso.width * scale;
    const headH = head.height * scale;
    const headW = head.width * scale;
    legs.setPosition(0, 0);
    const torsoTop = -legsH - torsoH * ART.waist;
    torso.setPosition(0, torsoTop);
    const headTop = torsoTop - headH * (1 - ART.neck);
    head.setPosition(0, headTop);

    // точки на теле в долях роста — как ANCHORS у нарисованного кодом
    const at = (x, y) => [x / k, y / k];
    this.anchors = {
      head: at(0, headTop + headH * ART.face.y),
      forehead: at(0, headTop + headH * ART.forehead),
      mouth: at(0, headTop + headH * ART.mouth),
      chest: at(0, torsoTop + torsoH * ART.chest),
      hand: at(torsoW * ART.hand.x, torsoTop + torsoH * ART.hand.y),
      pocket: at(legs.width * scale * ART.pocket.x, -legsH * (1 - ART.pocket.y)),
      body: at(0, torsoTop + torsoH * 0.5),
    };
    // голова для шапки и деталей уровня: макушка, середина лица, радиус
    this.headArt = { top: headTop, y: headTop + headH * ART.face.y, radius: headW * ART.face.radius };
    // значки: бабочка под подбородком, медаль на груди
    this.badgeArt = { bowtie: headTop + headH * ART.chin, medal: torsoTop + torsoH * ART.chest, width: torsoW };
  }

  drawBody() {
    const parts = this.artParts();
    this.art = Boolean(parts);
    for (const image of [this.legsImage, this.torsoImage, this.headImage]) image.setVisible(false);
    for (const layer of [this.blush, this.face, this.eyes]) layer.setVisible(!this.art);
    this.anchors = ANCHORS;
    if (this.art) {
      this.torso.clear();
      this.drawArt(parts);
    }
    const [handX, handY] = this.anchors.hand;
    this.handLayer.setPosition(handX * this.heroH, handY * this.heroH);
    // детали уровня (очки, пот, крючок…) нарисованы для головы-фигуры: переносим их на голову-картинку
    if (this.art) {
      const k = this.heroH;
      const f = this.headArt.radius / (k * 0.14);
      this.extras.setScale(f).setPosition(0, this.headArt.y + k * 0.73 * f);
    } else {
      this.extras.setScale(1).setPosition(0, 0);
    }
    if (this.art) {
      if (this.mood) this.setMood(this.mood);
      return;
    }
    this.drawCodeBody();
  }

  drawCodeBody() {
    const k = this.heroH;
    const g = this.torso.clear();
    const stroke = Math.max(2, k * 0.012);
    const top = TOPS[this.top] ?? TOPS.tank;
    const pants = PANTS[this.pants] ?? PANTS.track;
    g.lineStyle(stroke, COLORS.outline, 1);

    // ноги: штаны или шорты
    for (const side of [-1, 1]) {
      const x = side * k * 0.1 - k * 0.075;
      if (pants.short) {
        g.fillStyle(SKIN, 1).fillRoundedRect(x + k * 0.02, -k * 0.24, k * 0.11, k * 0.21, k * 0.04);
        g.strokeRoundedRect(x + k * 0.02, -k * 0.24, k * 0.11, k * 0.21, k * 0.04);
      }
      const length = pants.short ? 0.14 : 0.31;
      g.fillStyle(pants.color, 1).fillRoundedRect(x, -k * 0.34, k * 0.15, k * length, k * 0.04);
      g.strokeRoundedRect(x, -k * 0.34, k * 0.15, k * length, k * 0.04);
      if (pants.stripe) g.fillStyle(pants.stripe, 1).fillRect(side * k * 0.16 - k * 0.008, -k * 0.32, k * 0.016, k * (length - 0.04));
      if (pants.seam) g.fillStyle(pants.seam, 1).fillRect(side * k * 0.1 - k * 0.004, -k * 0.26, k * 0.008, k * (length - 0.1));
      if (pants.vstripes) {
        g.fillStyle(pants.vstripes, 1);
        for (const dx of [-0.045, 0, 0.045]) g.fillRect(side * k * 0.1 + dx * k - k * 0.006, -k * 0.33, k * 0.012, k * (length - 0.02));
      }
      if (pants.spots) {
        g.fillStyle(pants.spots, 1);
        g.fillCircle(side * k * 0.09, -k * 0.26, k * 0.022).fillCircle(side * k * 0.12, -k * 0.16, k * 0.02).fillCircle(side * k * 0.08, -k * 0.08, k * 0.018);
      }
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

    // руки: плечо → локоть → запястье, потом кисть. Часть руки — «капсула» с обводкой.
    const limb = (x1, y1, x2, y2, thick, color) => {
      g.lineStyle(thick + stroke * 2, COLORS.outline, 1).lineBetween(x1, y1, x2, y2);
      g.fillStyle(COLORS.outline, 1).fillCircle(x1, y1, thick / 2 + stroke).fillCircle(x2, y2, thick / 2 + stroke);
      g.lineStyle(thick, color, 1).lineBetween(x1, y1, x2, y2);
      g.fillStyle(color, 1).fillCircle(x1, y1, thick / 2).fillCircle(x2, y2, thick / 2);
    };
    for (const side of [-1, 1]) {
      const shoulder = [side * k * 0.2, -k * 0.57];
      const elbow = [side * k * 0.285, -k * 0.45];
      const wrist = [side * k * 0.272, -k * 0.345];
      limb(...elbow, ...wrist, k * 0.062, top.sleeves === 2 ? top.color : SKIN);
      limb(...shoulder, ...elbow, k * 0.07, top.sleeves ? top.color : SKIN);
      // кисть: ладонь, большой палец к телу и пальцы
      const [hx, hy] = [side * k * 0.27, -k * 0.305];
      g.lineStyle(stroke, COLORS.outline, 1);
      g.fillStyle(SKIN, 1).fillCircle(hx - side * k * 0.036, hy - k * 0.008, k * 0.018);
      g.strokeCircle(hx - side * k * 0.036, hy - k * 0.008, k * 0.018);
      g.fillEllipse(hx, hy, k * 0.075, k * 0.085);
      g.strokeEllipse(hx, hy, k * 0.075, k * 0.085);
      g.lineStyle(Math.max(1, stroke * 0.7), SKIN_DARK, 1);
      for (const dx of [-0.014, 0.006]) g.lineBetween(hx + dx * k, hy + k * 0.012, hx + dx * k, hy + k * 0.038);
    }

    // туловище с пузиком
    g.lineStyle(stroke, COLORS.outline, 1);
    g.fillStyle(top.color, 1).fillEllipse(0, -k * 0.45, k * 0.5, k * 0.4);
    g.strokeEllipse(0, -k * 0.45, k * 0.5, k * 0.4);
    // узоры ложатся по форме пуза: половина ширины на высоте y
    const half = (y) => k * 0.25 * Math.sqrt(Math.max(0, 1 - ((y + k * 0.45) / (k * 0.2)) ** 2)) - stroke;
    if (top.stripes) {
      g.lineStyle(k * 0.016, top.stripes, 1);
      for (let y = -k * 0.6; y < -k * 0.27; y += k * 0.04) g.lineBetween(-half(y), y, half(y), y);
    }
    if (top.dots) {
      g.fillStyle(top.dots, 1);
      for (const [x, y] of [[-0.1, -0.52], [0.08, -0.46], [-0.06, -0.38], [0.13, -0.36], [-0.15, -0.44], [0.02, -0.31]]) {
        g.fillCircle(x * k, y * k, k * 0.02);
      }
    }
    if (top.zigzag) {
      g.lineStyle(k * 0.014, top.zigzag, 1);
      g.strokePoints([-0.2, -0.12, -0.04, 0.04, 0.12, 0.2].map((x, i) => ({ x: x * k, y: (i % 2 ? -0.5 : -0.46) * k })));
    }
    g.lineStyle(stroke, COLORS.outline, 1);
    // шея и вырез
    g.fillStyle(SKIN, 1).slice(0, -k * 0.635, k * (top.sleeves ? 0.07 : 0.1), 0, Math.PI).fillPath().strokePath();
    if (top.tie || top.bow) {
      g.fillStyle(COLORS.white, 1).fillTriangle(-k * 0.07, -k * 0.63, k * 0.07, -k * 0.63, 0, -k * 0.5);
      g.strokeTriangle(-k * 0.07, -k * 0.63, k * 0.07, -k * 0.63, 0, -k * 0.5);
    }
    if (top.tie) g.fillStyle(0xd63d3d, 1).fillTriangle(-k * 0.022, -k * 0.6, k * 0.022, -k * 0.6, 0, -k * 0.42);
    if (top.bow) {
      g.fillStyle(COLORS.outline, 1);
      g.fillTriangle(0, -k * 0.6, -k * 0.045, -k * 0.625, -k * 0.045, -k * 0.575);
      g.fillTriangle(0, -k * 0.6, k * 0.045, -k * 0.625, k * 0.045, -k * 0.575);
    }
    if (top.emblem) {
      g.fillStyle(top.emblem, 1).fillCircle(0, -k * 0.46, k * 0.06);
      g.strokeCircle(0, -k * 0.46, k * 0.06);
      g.fillStyle(top.color, 1).fillTriangle(-k * 0.03, -k * 0.44, k * 0.03, -k * 0.44, 0, -k * 0.5);
    }
    if (top.buttons) {
      g.fillStyle(top.buttons, 1);
      for (const y of [-0.54, -0.46, -0.38]) g.fillCircle(0, y * k, k * 0.012);
    }
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
    // у Валеры из картинок шапка ложится на голову-картинку: размер — от ширины лица
    const size = this.art ? this.headArt.radius * 3.3 : k * 0.46;
    const top = this.art ? this.headArt.top + this.headArt.radius * 0.18 : -k * 0.87;
    this.hatLayer.removeAll(true);
    if (this.item === 'none') return; // уровень снял с Валеры кепку
    const kind = getItem(this.item)?.kind;
    const hat = !this.item || kind === 'badge' ? 'cap' : this.item;
    for (const id of kind === 'badge' ? [hat, this.item] : [hat]) {
      const badge = id === this.item && kind === 'badge' && this.art;
      // значок-картинка на Валере из картинок: по месту на теле, ширина в долях ширины торса
      const object = badge
        ? addHat(this.scene, id, 0, this.badgeArt[id], 1, true)?.setDisplaySize(...this.badgeSize(id))
        : addHat(this.scene, id, 0, top, size);
      if (object) this.hatLayer.add(object);
    }
  }

  // Размер значка-картинки на груди: медаль — 0.27 ширины торса, бабочка — 0.22
  badgeSize(id) {
    const texture = this.scene.textures.get(heroTexture(this.scene, `hat-${id}`)).getSourceImage();
    const w = this.badgeArt.width * (id === 'medal' ? 0.27 : 0.22);
    return [w, (w * texture.height) / texture.width];
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

    if (this.props.dirty) {
      g.fillStyle(0x3a2a1a, 0.85);
      for (const [x, y, r] of [[-0.06, -0.93, 0.02], [0.05, -0.9, 0.026], [0.0, -0.955, 0.016], [0.09, -0.94, 0.014]]) {
        g.fillCircle(x * k, y * k, r * k);
      }
    }

    if (this.props.hook) {
      // крючок воткнут в кепку сбоку: тёмная обводка, чтобы его было видно на любой шапке
      for (const [width, color] of [[k * 0.03, COLORS.outline], [k * 0.014, 0xd9dee4]]) {
        g.lineStyle(Math.max(2, width), color, 1);
        g.lineBetween(-k * 0.1, -k * 1.0, -k * 0.1, -k * 0.92);
        g.beginPath().arc(-k * 0.135, -k * 0.92, k * 0.035, 0, Math.PI).strokePath();
      }
    }

    if (this.props.beetle) {
      const [x, y] = [-k * 0.09, -k * 0.94];
      g.lineStyle(stroke, COLORS.outline, 1);
      g.fillStyle(0xf2d16b, 1).fillEllipse(x, y, k * 0.07, k * 0.08);
      g.strokeEllipse(x, y, k * 0.07, k * 0.08);
      g.fillStyle(COLORS.outline, 1).fillCircle(x, y - k * 0.045, k * 0.018);
      for (const dx of [-0.018, 0, 0.018]) g.fillRect(x + dx * k - k * 0.004, y - k * 0.03, k * 0.008, k * 0.06);
    }

    if (this.props.sweat) {
      g.fillStyle(0x4aa3df, 1);
      for (const [x, y] of [[-0.13, -0.8], [0.14, -0.78], [-0.16, -0.72], [0.17, -0.7]]) {
        g.fillTriangle((x - 0.012) * k, y * k, (x + 0.012) * k, y * k, x * k, (y - 0.03) * k);
        g.fillCircle(x * k, y * k, 0.012 * k);
      }
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
    if (this.art) {
      // у Валеры из картинок эмоция — это своя голова
      this.headImage.setTexture(heroTexture(this.scene, `head-${mood}`) ?? heroTexture(this.scene, 'head-idle'));
      this.eyesOpen = !spec.eyes.startsWith('arc');
      return this;
    }
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

  // Переодеть верх: id из src/ui/clothes.js (null — родная майка)
  setTop(id) {
    this.top = id;
    this.drawBody();
    this.drawHat();
    return this;
  }

  // Дать в руку картинку из src/ui/shapes.js (null — забрать)
  hold(shape) {
    this.held = shape;
    this.handLayer.removeAll(true);
    if (shape) this.handLayer.add(addShape(this.scene, shape, this.heroH * (this.art ? 0.19 : 0.24)).object);
    return this;
  }

  setProps(props) {
    Object.assign(this.props, props);
    this.drawBody();
    this.drawHat();
    this.drawExtras();
    return this;
  }

  // Точка на теле в координатах сцены и радиус зоны вокруг неё. part: head, forehead, mouth, chest, hand, body
  zone(part) {
    const [x, y] = this.anchors[part] ?? this.anchors.body;
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
      const blink = this.art && heroTexture(this.scene, 'head-blink');
      if (this.eyesOpen && blink) {
        // у Валеры из картинок моргание — голова с закрытыми глазами на миг
        const mood = this.mood;
        this.headImage.setTexture(blink);
        this.scene.time.delayedCall(120, () => {
          if (this.scene && this.art && this.mood === mood) this.setMood(mood);
        });
      } else if (this.eyesOpen && !this.art) {
        this.scene.tweens.add({ targets: this.eyes, scaleY: 0.1, duration: 70, yoyo: true });
      }
      this.scheduleBlink();
    });
  }

  // Зрачки смотрят в сторону указателя
  lookAt(pointer) {
    if (this.art || !this.eyesOpen || this.mood === 'sly') return;
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
