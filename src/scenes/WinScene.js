import { COLORS, TEXT } from '../config.js';
import { levelText, t } from '../i18n/index.js';
import { getLevel } from '../levels/index.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addText } from '../ui/widgets.js';
import { BaseScene } from './BaseScene.js';

// Экран победы между уровнями. Позже здесь же — межстраничная реклама.
export class WinScene extends BaseScene {
  constructor() {
    super('Win');
  }

  init(data) {
    this.level = getLevel(data.number);
    this.next = getLevel(data.number + 1);
  }

  build() {
    const { W, H, u, portrait } = this;

    const eggX = portrait ? W / 2 : W * 0.3;
    const eggY = portrait ? H * 0.4 : H * 0.52;
    const sideX = portrait ? W / 2 : W * 0.68;
    const titleY = portrait ? H * 0.13 : H * 0.18;
    const bubbleY = portrait ? H * 0.64 : H * 0.4;
    const buttonsY = portrait ? H * 0.8 : H * 0.66;
    const bubbleW = portrait ? Math.min(W - 80 * u, 600 * u) : 520 * u;

    addText(this, sideX, titleY, t('ui.win'), 72, { fontStyle: 'bold' });
    new Egg(this, eggX, eggY, 320 * u, 'happy').react('happy');
    addBubble(this, sideX, bubbleY, bubbleW, levelText(this.level, 'win'));

    const w = 420 * u;
    const h = 92 * u;

    if (this.next) {
      addButton(this, sideX, buttonsY, w, h, t('ui.next'), () =>
        this.scene.start('Level', { number: this.next.number }),
      );
    } else {
      addText(this, sideX, buttonsY, t('ui.allDone'), 28, {
        color: TEXT.muted,
        wordWrap: { width: bubbleW },
      });
    }

    addButton(this, sideX, buttonsY + 112 * u, w, h, t('ui.menu'), () => this.scene.start('Menu'), {
      fill: COLORS.secondary,
    });
  }
}
