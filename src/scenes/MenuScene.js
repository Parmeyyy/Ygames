import { COLORS } from '../config.js';
import { t } from '../i18n/index.js';
import { levels } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addText } from '../ui/widgets.js';
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
    const eggY = portrait ? H * 0.42 : H * 0.58;
    const menuX = portrait ? W / 2 : W * 0.7;
    const titleY = portrait ? H * 0.1 : H * 0.2;
    const bubbleY = portrait ? H * 0.23 : H * 0.17;
    const buttonsY = portrait ? H * 0.66 : H * 0.44;

    addText(this, menuX, titleY, t('game.title'), 96, { fontStyle: 'bold' });
    addBubble(this, eggX, bubbleY, 460 * u, t('egg.menu'));
    new Egg(this, eggX, eggY, 300 * u);

    const w = 420 * u;
    const h = 92 * u;
    const step = 112 * u;

    addButton(this, menuX, buttonsY, w, h, t('ui.play'), () => {
      // продолжаем с первого непройденного уровня
      const number = Math.min(progress.unlocked, levels.length);
      this.scene.start('Level', { number });
    });

    addButton(this, menuX, buttonsY + step, w, h, t('ui.levels'), () => this.scene.start('LevelSelect'), {
      fill: COLORS.secondary,
    });

    const soundLabel = progress.sound ? t('ui.soundOn') : t('ui.soundOff');
    addButton(
      this,
      menuX,
      buttonsY + step * 2,
      w,
      h,
      soundLabel,
      () => {
        progress.sound = !progress.sound;
        this.sound.mute = !progress.sound;
        this.rebuild();
      },
      { fill: COLORS.secondary },
    );
  }
}
