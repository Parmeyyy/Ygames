import { audio } from '../audio.js';
import { COLORS, ECONOMY, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { chapters } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addCoinCounter, addModal, addText } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

export class MenuScene extends BaseScene {
  constructor() {
    super('Menu');
  }

  create() {
    super.create();
    // Меню показано, игра готова к взаимодействию
    yandex.gameReady();
  }

  build() {
    const { W, H, u, portrait } = this;

    // Портрет: всё в столбик. Альбом: яйцо слева, меню справа.
    const eggX = portrait ? W / 2 : W * 0.3;
    const eggY = portrait ? H * 0.44 : H * 0.6;
    const menuX = portrait ? W / 2 : W * 0.7;
    const titleY = portrait ? H * 0.08 : H * 0.17;
    const bubbleY = portrait ? H * 0.185 : H * 0.11;
    const buttonsY = portrait ? H * 0.645 : H * 0.36;

    addText(this, menuX, titleY, t('game.title'), 96, { fontStyle: 'bold' });
    addBubble(this, eggX, bubbleY, 460 * u, t('egg.menu'));
    addCoinCounter(this, W - 20 * u, 50 * u, progress.coins, 'right');
    // всего звёзд за пройденные уровни
    this.add.star(44 * u, 50 * u, 5, 12 * u, 25 * u, COLORS.coin).setStrokeStyle(2 * u, COLORS.outline);
    addText(this, 78 * u, 50 * u, String(progress.totalStars), 30, { fontStyle: 'bold', color: TEXT.dark }).setOrigin(0, 0.5);
    new Egg(this, eggX, eggY, 300 * u).enableTaps();

    const w = 420 * u;
    const h = 84 * u;
    const step = 100 * u;

    addButton(this, menuX, buttonsY, w, h, t('ui.play'), () => {
      // продолжаем с первого непройденного уровня
      const number = Math.min(progress.unlocked, chapters.main.length);
      this.go('Level', { id: chapters.main[number - 1].id });
    });

    addButton(this, menuX, buttonsY + step, w, h, t('ui.levels'), () => this.go('LevelSelect', { chapter: 'main' }), {
      fill: COLORS.secondary,
    });

    addButton(this, menuX, buttonsY + step * 2, w, h, t('ui.wardrobe'), () => this.go('Wardrobe'), {
      fill: COLORS.secondary,
    });

    const soundLabel = progress.sound ? t('ui.soundOn') : t('ui.soundOff');
    addButton(
      this,
      menuX,
      buttonsY + step * 3,
      w,
      h,
      soundLabel,
      () => {
        progress.sound = !progress.sound;
        this.sound.mute = !progress.sound;
        audio.setEnabled(progress.sound);
        this.rebuild();
      },
      { fill: COLORS.secondary },
    );

    if (progress.dailyAvailable) this.addDailyGift();
  }

  // Ежедневный подарок: раз в день, можно удвоить за рекламу
  addDailyGift() {
    const amount = ECONOMY.dailyBonus;
    const claim = (coins) => {
      progress.claimDaily(coins);
      audio.coin();
      this.rebuild();
    };
    addModal(this, {
      title: t('ui.dailyTitle', { n: amount }),
      onClose: () => {},
      buttons: [
        { label: t('ui.dailyTake'), onTap: () => claim(amount) },
        {
          label: t('ui.dailyDouble'),
          fill: COLORS.success,
          onTap: async () => {
            if (await yandex.showRewarded()) claim(amount * 2);
          },
        },
      ],
    });
  }
}
