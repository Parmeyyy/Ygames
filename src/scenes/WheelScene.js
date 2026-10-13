import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { WHEEL, WHEEL_AD_SPINS } from '../rewards.js';
import { progress } from '../services/progress.js';
import { addButton, addCoinCounter, addText } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

const SLICE_COLORS = [COLORS.accent, 0x4aa3df, COLORS.success, 0xe8527a, COLORS.coin, COLORS.special, 0xd63d3d, 0x3f8f5a];

// Колесо удачи: одно бесплатное вращение в день и несколько — за рекламу
export class WheelScene extends BaseScene {
  constructor() {
    super('Wheel');
  }

  init() {
    this.result = null; // текст о последнем выигрыше
    this.spinning = false;
  }

  build() {
    const { W, H, u, portrait } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => !this.spinning && this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.wheel'), 36, { fontStyle: 'bold' });
    addCoinCounter(this, W - 20 * u, 60 * u, progress.coins, 'right');

    const radius = (portrait ? 290 : 230) * u;
    const cx = portrait ? W / 2 : W * 0.32;
    const cy = portrait ? 150 * u + radius + 40 * u : H * 0.55;
    const sideX = portrait ? W / 2 : W * 0.72;
    const infoY = portrait ? cy + radius + 70 * u : H * 0.36;

    // колесо: сектор 0 сверху, дальше по часовой стрелке
    const wheel = this.add.container(cx, cy);
    const slice = (Math.PI * 2) / WHEEL.length;
    const g = this.add.graphics();
    WHEEL.forEach((sector, index) => {
      const from = -Math.PI / 2 - slice / 2 + index * slice;
      g.fillStyle(SLICE_COLORS[index % SLICE_COLORS.length], 1).slice(0, 0, radius, from, from + slice).fillPath();
    });
    g.lineStyle(6 * u, COLORS.outline, 1).strokeCircle(0, 0, radius);
    wheel.add(g);
    WHEEL.forEach((sector, index) => {
      const angle = index * slice;
      const label = sector.item ? t('ui.wheelItem') : sector.hints ? t('ui.wheelHint') : String(sector.coins);
      const text = addText(this, Math.sin(angle) * radius * 0.66, -Math.cos(angle) * radius * 0.66, label, sector.coins ? 40 : 22, {
        fontStyle: 'bold',
        color: TEXT.light,
        stroke: '#3a2e39',
        strokeThickness: 5 * u,
      });
      text.setRotation(angle);
      wheel.add(text);
    });
    const hub = this.add.graphics();
    hub.fillStyle(COLORS.white, 1).fillCircle(0, 0, radius * 0.12);
    hub.lineStyle(4 * u, COLORS.outline, 1).strokeCircle(0, 0, radius * 0.12);
    wheel.add(hub);
    this.wheel = wheel;

    // указатель сверху
    const pointer = this.add.graphics();
    pointer.fillStyle(COLORS.outline, 1).fillTriangle(cx - 24 * u, cy - radius - 26 * u, cx + 24 * u, cy - radius - 26 * u, cx, cy - radius + 22 * u);

    addText(this, sideX, infoY, this.result ?? t('ui.wheelInfo'), 28, {
      fontStyle: this.result ? 'bold' : 'normal',
      color: this.result ? TEXT.dark : TEXT.muted,
      wordWrap: { width: (portrait ? W : W * 0.5) - 60 * u },
    });

    const buttonY = infoY + 110 * u;
    const w = 460 * u;
    const h = 92 * u;
    if (progress.wheelFree) {
      addButton(this, sideX, buttonY, w, h, t('ui.wheelSpin'), () => this.spin(true), { size: 32 });
    } else if (progress.wheelAdLeft > 0) {
      const label = t('ui.wheelSpinAd', { n: progress.wheelAdLeft, max: WHEEL_AD_SPINS });
      addButton(this, sideX, buttonY, w, h, label, () => this.spin(false), { fill: COLORS.success, size: 26 });
    } else {
      addButton(this, sideX, buttonY, w, h, t('ui.wheelTomorrow'), () => {}, { disabled: true, size: 26 });
    }
  }

  async spin(free) {
    if (this.spinning) return;
    this.spinning = true;
    if (!free && !(await yandex.showRewarded())) {
      this.spinning = false;
      return;
    }
    // приз выдаётся сразу: он не пропадёт, даже если игрок уйдёт, не дождавшись остановки
    const prize = progress.spin(free);
    const slice = 360 / WHEEL.length;
    this.tweens.add({
      targets: this.wheel,
      angle: 360 * 5 - prize.index * slice,
      duration: 3600,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.spinning = false;
        if (prize.item) this.result = t('ui.wheelWonItem', { name: t(`items.${prize.item}`) });
        else if (prize.hints) this.result = t('ui.wheelWonHint');
        else this.result = t('ui.wheelWonCoins', { n: prize.coins });
        audio[prize.item ? 'buy' : 'coin']();
        this.rebuild();
      },
    });
  }
}
