import { audio } from '../audio.js';
import { COLORS, ECONOMY, TEXT } from '../config.js';
import { ITEMS, slotOf } from '../items.js';
import { t } from '../i18n/index.js';
import { progress } from '../services/progress.js';
import { addClothIcon } from '../ui/clothes.js';
import { addHat } from '../ui/hats.js';
import { Hero } from '../ui/Hero.js';
import { addShape } from '../ui/shapes.js';
import { flyCoins } from '../ui/effects.js';
import { addButton, addCoinAmount, addCoinCounter, addText, drawLock, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Вкладки гардероба: какие слоты вещей в них показываются
const TABS = [
  { id: 'hats', slots: ['hat'] },
  { id: 'clothes', slots: ['top', 'pants'] },
  { id: 'hand', slots: ['hand'] },
];

// Гардероб Валеры: шапки и одежда. Вещи — за монеты, редкие — за просмотры рекламы,
// наградные — за пройденные разделы. Монеты можно добыть просмотром рекламы.
export class WardrobeScene extends BaseScene {
  constructor() {
    super('Wardrobe');
  }

  init() {
    this.info = 'wardrobe.info';
    this.heroMood = 'happy';
    this.tab = TABS[0];
    this.flying = 0; // монеты за рекламу, которые ещё летят к счётчику
  }

  build() {
    const { W, H, u, portrait } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.wardrobe'), 36, { fontStyle: 'bold' });
    const counter = addCoinCounter(this, W - 20 * u, 60 * u, progress.coins, 'right', progress.coins - this.flying);

    // монеты за рекламу: портрет — внизу под вещами, альбом — под Валерой
    const adW = (portrait ? 420 : 250) * u;
    const adX = portrait ? W / 2 : W * 0.2;
    const adY = H - 60 * u;
    addButton(this, adX, adY, adW, 64 * u, t('wardrobe.coinsAd', { n: ECONOMY.adCoins }), () => this.coinsForAd(), {
      fill: COLORS.success,
      size: 26,
    });
    if (this.flying > 0) {
      this.flying = 0;
      flyCoins(this, { x: adX, y: adY }, counter.coinPoint, 5, () => {
        audio.coin();
        counter.bump();
      }, () => counter.tickTo(progress.coins));
    }

    const cols = 5;
    const cardW = 124 * u;
    const cardH = 160 * u;
    const gap = 12 * u;
    const gridW = cols * cardW + (cols - 1) * gap;

    // Портрет: Валера сверху, вещи под ним. Альбом: Валера слева, вещи справа.
    const heroX = portrait ? W / 2 : W * 0.2;
    const heroY = portrait ? 320 * u : H * 0.5;
    const gridX = portrait ? W / 2 : W * 0.64;
    const tabsY = portrait ? 590 * u : 130 * u;
    const gridTop = tabsY + 50 * u;
    const infoX = portrait ? W / 2 : heroX;
    const infoY = portrait ? 525 * u : H * 0.5 + 200 * u;
    const infoW = portrait ? gridW : W * 0.34;

    this.hero = new Hero(this, heroX, heroY, (portrait ? 320 : 340) * u, this.heroMood).enableTaps();
    addText(this, infoX, infoY, t(this.info), 24, { color: TEXT.muted, wordWrap: { width: infoW } });

    // вкладки
    const tabW = 200 * u;
    TABS.forEach((tab, index) => {
      const x = gridX + (index - (TABS.length - 1) / 2) * (tabW + gap);
      const active = tab === this.tab;
      addButton(this, x, tabsY, tabW, 64 * u, t(`wardrobe.${tab.id}`), () => this.openTab(tab), {
        fill: active ? COLORS.accent : COLORS.secondary,
        size: 26,
      });
    });

    ITEMS.filter((item) => this.tab.slots.includes(slotOf(item))).forEach((item, index) => {
      const x = gridX - gridW / 2 + (index % cols) * (cardW + gap) + cardW / 2;
      const y = gridTop + Math.floor(index / cols) * (cardH + gap) + cardH / 2;
      this.addCard(x, y, cardW, cardH, item);
    });
  }

  openTab(tab) {
    this.tab = tab;
    this.info = 'wardrobe.info';
    this.rebuild();
  }

  addCard(x, y, w, h, item) {
    const u = this.u;
    const owned = progress.ownsHat(item.id);
    const equipped = progress.isWearing(item);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 20 * u);
    bg.lineStyle((equipped ? 6 : 3) * u, equipped ? COLORS.success : COLORS.outline, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20 * u);

    const slot = slotOf(item);
    let picture;
    if (slot === 'hat') picture = addHat(this, item.id, 0, -h * 0.14, w * 0.62, true);
    else if (slot === 'hand') picture = addShape(this, item.shape, w * 0.5).object.setPosition(0, -h * 0.14);
    else picture = addClothIcon(this, item.id, 0, -h * 0.14, w * 0.62);

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
    } else if (item.source) {
      // вещь выдаётся на колесе удачи или в календаре подарков
      picture.setAlpha(0.35);
      const lock = this.add.graphics();
      drawLock(lock, w / 2 - 24 * u, -h / 2 + 26 * u, 22 * u);
      parts.push(lock, addText(this, 0, labelY, t(`wardrobe.from_${item.source}`), 16, { color: TEXT.muted, fontStyle: 'bold' }));
    } else {
      // награда за раздел: пока раздел не пройден, вещь под замком
      picture.setAlpha(0.35);
      const lock = this.add.graphics();
      drawLock(lock, w / 2 - 24 * u, -h / 2 + 26 * u, 22 * u);
      parts.push(lock, addText(this, 0, labelY, t(`sections.${item.section}`), 18, { color: TEXT.muted, fontStyle: 'bold' }));
    }

    const card = this.add.container(x, y, parts).setSize(w, h);
    makeTappable(card, () => this.onItem(item));
  }

  async coinsForAd() {
    if (!(await yandex.showRewarded())) return;
    progress.addCoins(ECONOMY.adCoins);
    this.flying = ECONOMY.adCoins;
    this.info = 'wardrobe.info';
    this.heroMood = 'happy';
    this.rebuild();
  }

  async onItem(item) {
    this.info = 'wardrobe.info';
    this.heroMood = 'happy';
    const ownedBefore = progress.ownsHat(item.id);
    if (ownedBefore) {
      // повторное нажатие на надетую вещь снимает её
      progress.toggle(item);
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
      this.info = item.source ? `wardrobe.info_${item.source}` : 'wardrobe.forSection';
      this.heroMood = 'sly';
    }
    if (!ownedBefore && progress.ownsHat(item.id)) audio.buy();
    this.rebuild();
  }
}
