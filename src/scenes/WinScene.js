import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { levelText, t } from '../i18n/index.js';
import { getLevel, getSection, nextLevel, sections } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { confetti, flyCoins } from '../ui/effects.js';
import { Hero } from '../ui/Hero.js';
import { addBubble, addButton, addCoinAmount, addCoinCounter, addStars, addText } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Экран победы между уровнями: звёзды, монеты, удвоение за рекламу, переход дальше.
// После последнего уровня раздела — «Раздел пройден!» и предмет в гардероб.
export class WinScene extends BaseScene {
  constructor() {
    super('Win');
  }

  init(data) {
    this.level = getLevel(data.id);
    this.next = nextLevel(this.level);
    this.reward = data.reward ?? 0; // монеты за это прохождение (0 при повторном)
    this.stars = data.stars ?? 1; // оценка этого прохождения
    this.item = data.item ?? null; // предмет гардероба за пройденный раздел
    this.section = getSection(this.level.section);
    this.sectionDone = !this.next; // это был последний уровень раздела
    this.doubled = false;
    this.flying = this.reward; // монеты, которые ещё не «долетели» до счётчика
    this.celebrated = false;
  }

  build() {
    const { W, H, u, portrait } = this;

    const heroX = portrait ? W / 2 : W * 0.3;
    const heroY = portrait ? H * 0.42 : H * 0.56;
    const sideX = portrait ? W / 2 : W * 0.68;
    const titleY = portrait ? H * 0.08 : H * 0.12;
    const rewardY = portrait ? H * 0.585 : H * 0.24;
    const bubbleY = portrait ? H * 0.665 : H * 0.38;
    // после последнего уровня раздела строк больше — они стоят плотнее
    const compact = this.sectionDone;
    const buttonsY = portrait ? H * (compact ? 0.745 : 0.78) : H * 0.56;
    const bubbleW = portrait ? Math.min(W - 80 * u, 600 * u) : 520 * u;

    // последний уровень раздела — свой заголовок
    const title = addText(this, sideX, titleY, this.section.hidden ? t('ui.dailyLevelWin') : this.sectionDone ? t('ui.sectionDone') : t('ui.win'), this.sectionDone ? 56 : 72, {
      fontStyle: 'bold',
    });
    const maxTitle = (portrait ? W : W * 0.6) - 60 * u;
    if (title.width > maxTitle) title.setScale(maxTitle / title.width);
    new Hero(this, heroX, heroY, 340 * u, 'happy').enableTaps().react('happy');
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
    const h = (compact ? 70 : 80) * u;
    const step = (compact ? 82 : 94) * u;
    let y = buttonsY;
    const place = (label, onTap, options) => {
      addButton(this, sideX, y, w, h, label, onTap, { size: 30, ...options });
      y += step;
    };

    if (this.reward > 0 && !this.doubled) {
      place(t('ui.doubleAd'), () => this.double(), { fill: COLORS.success });
    }
    if (this.next) {
      place(t('ui.next'), () => this.goNext());
    } else {
      // раздел пройден: новый предмет в гардеробе или просто «продолжение следует»
      const line = this.item
        ? t('ui.newItem', { name: t(`items.${this.item}`) })
        : t(this.section.hidden ? 'ui.dailyLevelTomorrow' : 'ui.allDone');
      addText(this, sideX, y, line, 26, {
        color: this.item ? TEXT.dark : TEXT.muted,
        fontStyle: this.item ? 'bold' : 'normal',
        wordWrap: { width: bubbleW },
      });
      y += step;
      // если следующий раздел уже готов, зовём сразу туда
      const following = sections[sections.indexOf(this.section) + 1];
      if (following && !following.secret && following.levels.length && progress.isSectionOpen(following)) {
        place(t('ui.nextSection'), () => this.go('LevelSelect', { section: following.id }));
      }
    }
    // последняя строка — две кнопки рядом: пройти уровень ещё раз и выйти в меню
    const half = (w - 16 * u) / 2;
    const side = (half + 16 * u) / 2;
    addButton(this, sideX - side, y, half, h, t('ui.replay'), () => this.go('Level', { id: this.level.id }), { size: 28, fill: COLORS.secondary });
    addButton(this, sideX + side, y, half, h, t('ui.menu'), () => this.go('Menu'), { size: 28, fill: COLORS.secondary });

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
