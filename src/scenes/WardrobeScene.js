import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { HATS } from '../hats.js';
import { t } from '../i18n/index.js';
import { progress } from '../services/progress.js';
import { Egg } from '../ui/Egg.js';
import { addHat } from '../ui/hats.js';
import { addButton, addCoinAmount, addCoinCounter, addText, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Гардероб: шапки за монеты и редкие шапки за просмотры рекламы
export class WardrobeScene extends BaseScene {
  constructor() {
    super('Wardrobe');
  }

  init() {
    this.info = 'wardrobe.info';
    this.eggMood = 'happy';
  }

  build() {
    const { W, H, u, portrait } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.wardrobe'), 36, { fontStyle: 'bold' });
    addCoinCounter(this, W - 20 * u, 60 * u, progress.coins, 'right');

    const cols = 4;
    const cardW = 150 * u;
    const cardH = 190 * u;
    const gap = 16 * u;
    const gridW = cols * cardW + (cols - 1) * gap;

    // Портрет: яйцо сверху, шапки под ним. Альбом: яйцо слева, шапки справа.
    const eggX = portrait ? W / 2 : W * 0.2;
    const eggY = portrait ? 360 * u : H * 0.58;
    const gridX = portrait ? W / 2 : W * 0.64;
    const gridTop = portrait ? 620 * u : 190 * u;
    const infoX = portrait ? W / 2 : gridX;
    const infoY = portrait ? 560 * u : 140 * u;

    this.egg = new Egg(this, eggX, eggY, 280 * u, this.eggMood).enableTaps();
    const equipped = progress.hat ? ` · ${t(`hats.${progress.hat}`)}` : '';
    addText(this, infoX, infoY, t(this.info) + (this.info === 'wardrobe.info' ? equipped : ''), 24, {
      color: TEXT.muted,
      wordWrap: { width: gridW },
    });

    HATS.forEach((hat, index) => {
      const x = gridX - gridW / 2 + (index % cols) * (cardW + gap) + cardW / 2;
      const y = gridTop + Math.floor(index / cols) * (cardH + gap) + cardH / 2;
      this.addCard(x, y, cardW, cardH, hat);
    });
  }

  addCard(x, y, w, h, hat) {
    const u = this.u;
    const owned = progress.ownsHat(hat.id);
    const equipped = progress.hat === hat.id;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22 * u);
    bg.lineStyle((equipped ? 6 : 3) * u, equipped ? COLORS.success : COLORS.outline, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 22 * u);

    // шапка рисуется от макушки воображаемого яйца шириной hatSize
    const hatSize = w * 0.6;
    const picture = addHat(this, hat.id, 0, -h * 0.1 + hatSize * 0.15, hatSize);

    const labelY = h / 2 - 34 * u;
    let label;
    if (equipped) {
      label = addText(this, 0, labelY, t('wardrobe.equipped'), 22, { color: '#3d8b37', fontStyle: 'bold' });
    } else if (owned) {
      label = addText(this, 0, labelY, t('wardrobe.equip'), 22, { fontStyle: 'bold' });
    } else if (hat.price) {
      const affordable = progress.coins >= hat.price;
      label = addCoinAmount(this, 0, labelY, hat.price, 26, affordable ? TEXT.dark : TEXT.muted);
    } else {
      const views = { n: progress.hatAdViews(hat.id), max: hat.ads };
      label = addText(this, 0, labelY, t('wardrobe.ad', views), 21, { color: '#7b5ea7', fontStyle: 'bold' });
    }

    const card = this.add.container(x, y, [bg, picture, label]).setSize(w, h);
    makeTappable(card, () => this.onHat(hat));
  }

  async onHat(hat) {
    this.info = 'wardrobe.info';
    this.eggMood = 'happy';
    const ownedBefore = progress.ownsHat(hat.id);
    if (ownedBefore) {
      // повторное нажатие на надетую шапку снимает её
      progress.equip(progress.hat === hat.id ? null : hat.id);
    } else if (hat.price) {
      if (!progress.buyHat(hat)) {
        this.info = 'wardrobe.noCoins';
        this.eggMood = 'sad';
        audio.wrong();
      }
    } else {
      if (!(await yandex.showRewarded())) return;
      progress.countHatAd(hat);
    }
    if (!ownedBefore && progress.ownsHat(hat.id)) audio.buy();
    this.rebuild();
  }
}
