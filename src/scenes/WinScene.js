import { COLORS, TEXT } from '../config.js';
import { levelText, t } from '../i18n/index.js';
import { getLevel, nextLevel } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addCoinAmount, addText } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Экран победы между уровнями: награда, удвоение за рекламу, переход дальше.
export class WinScene extends BaseScene {
  constructor() {
    super('Win');
  }

  init(data) {
    this.level = getLevel(data.id);
    this.next = nextLevel(this.level);
    this.reward = data.reward ?? 0; // монеты за это прохождение (0 при повторном)
    this.doubled = false;
  }

  build() {
    const { W, H, u, portrait } = this;

    const eggX = portrait ? W / 2 : W * 0.3;
    const eggY = portrait ? H * 0.42 : H * 0.56;
    const sideX = portrait ? W / 2 : W * 0.68;
    const titleY = portrait ? H * 0.08 : H * 0.12;
    const rewardY = portrait ? H * 0.585 : H * 0.24;
    const bubbleY = portrait ? H * 0.665 : H * 0.38;
    const buttonsY = portrait ? H * 0.78 : H * 0.56;
    const bubbleW = portrait ? Math.min(W - 80 * u, 600 * u) : 520 * u;

    // финал главы — свой заголовок
    const title = this.level.finale ? t('ui.chapterDone', { n: this.level.finale }) : t('ui.win');
    addText(this, sideX, titleY, title, this.level.finale ? 52 : 72, { fontStyle: 'bold' });
    new Egg(this, eggX, eggY, 320 * u, 'happy').react('happy');
    addBubble(this, sideX, bubbleY, bubbleW, levelText(this.level, 'win'));

    if (this.reward > 0) {
      addCoinAmount(this, sideX, rewardY, `+${this.doubled ? this.reward * 2 : this.reward}`, 40);
    } else {
      addText(this, sideX, rewardY, t('ui.replay'), 26, { color: TEXT.muted });
    }

    const w = 420 * u;
    const h = 80 * u;
    let y = buttonsY;
    const place = (label, onTap, options) => {
      addButton(this, sideX, y, w, h, label, onTap, { size: 30, ...options });
      y += 94 * u;
    };

    if (this.reward > 0 && !this.doubled) {
      place(t('ui.doubleAd'), () => this.double(), { fill: COLORS.success });
    }
    if (this.next) {
      place(t('ui.next'), () => this.goNext());
    } else {
      addText(this, sideX, y, t('ui.allDone'), 28, { color: TEXT.muted, wordWrap: { width: bubbleW } });
      y += 94 * u;
    }
    place(t('ui.menu'), () => this.scene.start('Menu'), { fill: COLORS.secondary });
  }

  async double() {
    if (!(await yandex.showRewarded())) return;
    progress.addCoins(this.reward);
    this.doubled = true;
    this.rebuild();
  }

  async goNext() {
    // Сразу после рекламы за удвоение межстраничную не показываем
    if (!this.doubled) await yandex.showInterstitialIfDue();
    this.scene.start('Level', { id: this.next.id });
  }
}
