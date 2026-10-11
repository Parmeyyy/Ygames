import { COLORS } from '../config.js';
import { t } from '../i18n/index.js';
import { progress } from '../services/progress.js';
import { addText } from '../ui/widgets.js';
import { BaseScene } from './BaseScene.js';

// Полоса заполняется не быстрее этого времени, чтобы экран не мелькал
const MIN_DURATION = 600;

// Экран загрузки. Позже здесь: инициализация SDK, загрузка графики и звука, вызов Game Ready.
export class BootScene extends BaseScene {
  constructor() {
    super('Boot');
  }

  init() {
    this.ready = false;
    this.startedAt = performance.now();
  }

  preload() {
    // this.load.image('egg', 'assets/egg.png');
  }

  create() {
    super.create();
    progress.load().then(() => {
      this.sound.mute = !progress.sound;
      this.ready = true;
    });
  }

  build() {
    const { W, H, u } = this;
    addText(this, W / 2, H / 2 - 50 * u, t('ui.loading'), 40, { fontStyle: 'bold' });
    this.bar = this.add.graphics();
    this.drawBar();
  }

  drawBar() {
    const { W, H, u } = this;
    const w = 420 * u;
    const h = 28 * u;
    const x = (W - w) / 2;
    const y = H / 2 + 20 * u;
    const value = Math.min(1, (performance.now() - this.startedAt) / MIN_DURATION);

    this.bar.clear();
    this.bar.fillStyle(COLORS.locked, 1).fillRoundedRect(x, y, w, h, h / 2);
    if (value > 0.08) this.bar.fillStyle(COLORS.accent, 1).fillRoundedRect(x, y, w * value, h, h / 2);
    return value;
  }

  update() {
    if (this.drawBar() >= 1 && this.ready) this.scene.start('Menu');
  }
}
