import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { levelText, t } from '../i18n/index.js';
import { getLevel, nextLevel } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { confetti, flyCoins } from '../ui/effects.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addCoinAmount, addCoinCounter, addStars, addText } from '../ui/widgets.js';
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
    this.stars = data.stars ?? 1; // оценка этого прохождения
    this.doubled = false;
    this.flying = this.reward; // монеты, которые ещё не «долетели» до счётчика
    this.celebrated = false;
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
    new Egg(this, eggX, eggY, 320 * u, 'happy').enableTaps().react('happy');
    addBubble(this, sideX, bubbleY, bubbleW, levelText(this.level, 'win'));

    // Счётчик показывает сумму без летящих монет и докручивается, когда они долетят
    const flying = this.flying;
    this.flying = 0;
    const counter = addCoinCounter(this, W - 20 * u, 50 * u, progress.coins, 'right', progress.coins - flying);

    // слева звёзды за прохождение, справа монеты (при повторном прохождении +0)
    const firstShow = !this.celebrated;
    addStars(this, sideX - 110 * u, rewardY, this.stars, 30 * u, { animate: firstShow, onPop: (i) => audio.star(i) });
    const coinX = sideX + 110 * u;
    addCoinAmount(this, coinX, rewardY, `+${this.doubled ? this.reward * 2 : this.reward}`, 40);
    if (flying > 0) {
      flyCoins(this, { x: coinX, y: rewardY }, counter.coinPoint, 5, () => {
        audio.coin();
        counter.bump();
      }, () => counter.tickTo(progress.coins));
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
    place(t('ui.menu'), () => this.go('Menu'), { fill: COLORS.secondary });

    if (!this.celebrated) {
      this.celebrated = true;
      audio.win();
      confetti(this);
    }
  }

  async double() {
    if (!(await yandex.showRewarded())) return;
    progress.addCoins(this.reward);
    this.doubled = true;
    this.flying = this.reward;
    this.rebuild();
  }

  async goNext() {
    // Сразу после рекламы за удвоение межстраничную не показываем
    if (!this.doubled) await yandex.showInterstitialIfDue();
    this.go('Level', { id: this.next.id });
  }
}
