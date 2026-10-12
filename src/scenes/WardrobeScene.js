import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { ITEMS } from '../items.js';
import { t } from '../i18n/index.js';
import { progress } from '../services/progress.js';
import { addHat } from '../ui/hats.js';
import { Hero } from '../ui/Hero.js';
import { addButton, addCoinAmount, addCoinCounter, addText, drawLock, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Гардероб Валеры: предметы за монеты, редкие — за просмотры рекламы, наградные — за пройденные разделы
export class WardrobeScene extends BaseScene {
  constructor() {
    super('Wardrobe');
  }

  init() {
    this.info = 'wardrobe.info';
    this.heroMood = 'happy';
  }

  build() {
    const { W, H, u, portrait } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.wardrobe'), 36, { fontStyle: 'bold' });
    addCoinCounter(this, W - 20 * u, 60 * u, progress.coins, 'right');

    const cols = 5;
    const cardW = 124 * u;
    const cardH = 160 * u;
    const gap = 12 * u;
    const gridW = cols * cardW + (cols - 1) * gap;

    // Портрет: Валера сверху, предметы под ним. Альбом: Валера слева, предметы справа.
    const heroX = portrait ? W / 2 : W * 0.2;
    const heroY = portrait ? 340 * u : H * 0.57;
    const gridX = portrait ? W / 2 : W * 0.64;
    const gridTop = portrait ? 600 * u : 170 * u;
    const infoX = portrait ? W / 2 : gridX;
    const infoY = portrait ? 550 * u : 130 * u;

    this.hero = new Hero(this, heroX, heroY, 340 * u, this.heroMood).enableTaps();
    const equipped = progress.hat ? ` · ${t(`items.${progress.hat}`)}` : '';
    addText(this, infoX, infoY, t(this.info) + (this.info === 'wardrobe.info' ? equipped : ''), 24, {
      color: TEXT.muted,
      wordWrap: { width: gridW },
    });

    ITEMS.forEach((item, index) => {
      const x = gridX - gridW / 2 + (index % cols) * (cardW + gap) + cardW / 2;
      const y = gridTop + Math.floor(index / cols) * (cardH + gap) + cardH / 2;
      this.addCard(x, y, cardW, cardH, item);
    });
  }

  addCard(x, y, w, h, item) {
    const u = this.u;
    const owned = progress.ownsHat(item.id);
    const equipped = progress.hat === item.id;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 20 * u);
    bg.lineStyle((equipped ? 6 : 3) * u, equipped ? COLORS.success : COLORS.outline, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20 * u);

    const picture = addHat(this, item.id, 0, -h * 0.14, w * 0.62, true);

    const labelY = h / 2 - 30 * u;
    const parts = [bg, picture];
    if (equipped) {
      parts.push(addText(this, 0, labelY, t('wardrobe.equipped'), 20, { color: '#3d8b37', fontStyle: 'bold' }));
    } else if (owned) {
      parts.push(addText(this, 0, labelY, t('wardrobe.equip'), 20, { fontStyle: 'bold' }));
    } else if (item.price) {
      const affordable = progress.coins >= item.price;
      parts.push(addCoinAmount(this, 0, labelY, item.price, 24, affordable ? TEXT.dark : TEXT.muted));
    } else if (item.ads) {
      const views = { n: progress.hatAdViews(item.id), max: item.ads };
      parts.push(addText(this, 0, labelY, t('wardrobe.ad', views), 18, { color: '#7b5ea7', fontStyle: 'bold' }));
    } else {
      // награда за раздел: пока раздел не пройден, предмет под замком
      picture.setAlpha(0.35);
      const lock = this.add.graphics();
      drawLock(lock, w / 2 - 24 * u, -h / 2 + 26 * u, 22 * u);
      parts.push(lock, addText(this, 0, labelY, t(`sections.${item.section}`), 18, { color: TEXT.muted, fontStyle: 'bold' }));
    }

    const card = this.add.container(x, y, parts).setSize(w, h);
    makeTappable(card, () => this.onItem(item));
  }

  async onItem(item) {
    this.info = 'wardrobe.info';
    this.heroMood = 'happy';
    const ownedBefore = progress.ownsHat(item.id);
    if (ownedBefore) {
      // повторное нажатие на надетый предмет снимает его
      progress.equip(progress.hat === item.id ? null : item.id);
    } else if (item.price) {
      if (!progress.buyHat(item)) {
        this.info = 'wardrobe.noCoins';
        this.heroMood = 'sad';
        audio.wrong();
      }
    } else if (item.ads) {
      if (!(await yandex.showRewarded())) return;
      progress.countHatAd(item);
    } else {
      this.info = 'wardrobe.forSection';
      this.heroMood = 'sly';
    }
    if (!ownedBefore && progress.ownsHat(item.id)) audio.buy();
    this.rebuild();
  }
}
