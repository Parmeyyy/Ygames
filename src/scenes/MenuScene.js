import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { CALENDAR, CHEST } from '../rewards.js';
import { progress } from '../services/progress.js';
import { Hero } from '../ui/Hero.js';
import { addIconButton } from '../ui/icons.js';
import { addShape } from '../ui/shapes.js';
import { addBubble, addButton, addCoinCounter, addIconImage, addModal, addText } from '../ui/widgets.js';
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

    // Портрет: всё в столбик. Альбом: Валера слева, меню справа.
    const heroX = portrait ? W / 2 : W * 0.3;
    const heroY = portrait ? H * 0.41 : H * 0.6;
    const menuX = portrait ? W / 2 : W * 0.7;
    const titleY = portrait ? H * 0.075 : H * 0.13;
    const bubbleY = portrait ? H * 0.165 : H * 0.11;
    const buttonsY = portrait ? H * 0.615 : H * 0.28;

    const title = addText(this, menuX, titleY, t('game.title'), 72, { fontStyle: 'bold' });
    const maxTitle = (portrait ? W : W * 0.56) - 60 * u;
    if (title.width > maxTitle) title.setScale(maxTitle / title.width);
    addBubble(this, heroX, bubbleY, 460 * u, t('hero.menu'));
    addCoinCounter(this, W - 20 * u, 50 * u, progress.coins, 'right');
    // всего звёзд за пройденные уровни
    if (!addIconImage(this, 'iconStar', 44 * u, 50 * u, 52 * u)) {
      this.add.star(44 * u, 50 * u, 5, 12 * u, 25 * u, COLORS.coin).setStrokeStyle(2 * u, COLORS.outline);
    }
    addText(this, 78 * u, 50 * u, String(progress.totalStars), 30, { fontStyle: 'bold', color: TEXT.dark }).setOrigin(0, 0.5);
    new Hero(this, heroX, heroY, 310 * u).enableTaps();

    const w = 440 * u;
    const h = 80 * u;
    const step = 94 * u;
    const gap = 14 * u;

    addButton(this, menuX, buttonsY, w, h, t('ui.play'), () => {
      // продолжаем с первого непройденного уровня
      const level = progress.continueLevel();
      if (level) this.go('Level', { id: level.id });
    });

    // задача дня: один особый уровень в день
    const daily = progress.dailyLevel();
    if (daily) {
      const done = progress.dailyLevelDone;
      addButton(this, menuX, buttonsY + step, w, h, t(done ? 'ui.dailyLevelDone' : 'ui.dailyLevel'), () => this.go('Level', { id: daily.id }), {
        fill: done ? COLORS.secondary : COLORS.success,
        size: done ? 26 : 32,
      });
    }

    const half = (w - gap) / 2;
    addButton(this, menuX - half / 2 - gap / 2, buttonsY + step * 2, half, h, t('ui.levels'), () => this.go('SectionSelect'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addButton(this, menuX + half / 2 + gap / 2, buttonsY + step * 2, half, h, t('ui.wardrobe'), () => this.go('Wardrobe'), {
      fill: COLORS.secondary,
      size: 28,
    });

    // круглые кнопки: колесо удачи, сундук за звёзды, достижения, звук
    const icon = 92 * u;
    const iconsY = buttonsY + step * 3 + 8 * u;
    const iconX = (index) => menuX + (index - 1.5) * (icon + (w - icon * 4) / 3);
    addIconButton(this, iconX(0), iconsY, icon, 'wheel', () => this.go('Wheel'), { badge: progress.wheelFree });
    addIconButton(this, iconX(1), iconsY, icon, 'chest', () => this.openChest(), { badge: progress.chestsAvailable > 0 });
    addIconButton(this, iconX(2), iconsY, icon, 'medal', () => this.go('Achievements'), { badge: progress.achievementsReady > 0 });
    addIconButton(
      this,
      iconX(3),
      iconsY,
      icon,
      'sound',
      () => {
        progress.sound = !progress.sound;
        this.sound.mute = !progress.sound;
        audio.setEnabled(progress.sound);
        this.rebuild();
      },
      { args: [progress.sound] },
    );

    if (progress.dailyAvailable) this.addCalendar();
    else if (this.chestOpen) this.addChestWindow();
  }

  // ——— календарь подарков за вход: 7 дней подряд ———

  addCalendar() {
    const { W, H, u } = this;
    const day = progress.calendarDay;
    const reward = progress.calendarReward(day);

    const panelW = Math.min(W - 30 * u, 680 * u);
    const cell = (panelW - 40 * u - 6 * 8 * u) / 7;
    const cellH = cell * 1.5;
    const hasDouble = Boolean(reward.coins);
    const panelH = 150 * u + cellH + (hasDouble ? 2 : 1) * 100 * u;
    const top = H / 2 - panelH / 2;

    // подложка перехватывает нажатия, пока подарок не забран
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bg, 1).fillRoundedRect(W / 2 - panelW / 2, top, panelW, panelH, 28 * u);
    panel.lineStyle(3 * u, COLORS.outline, 1).strokeRoundedRect(W / 2 - panelW / 2, top, panelW, panelH, 28 * u);
    addText(this, W / 2, top + 50 * u, t('ui.calendarTitle'), 34, { fontStyle: 'bold' });
    addText(this, W / 2, top + 96 * u, t('ui.calendarHint'), 20, { color: TEXT.muted });

    CALENDAR.forEach((entry, index) => {
      const number = index + 1;
      const x = W / 2 - panelW / 2 + 20 * u + index * (cell + 8 * u) + cell / 2;
      const y = top + 130 * u + cellH / 2;
      const today = number === day;
      const claimed = number < day;
      const bg = this.add.graphics();
      bg.fillStyle(today ? COLORS.accent : claimed ? COLORS.success : COLORS.white, 1);
      bg.fillRoundedRect(x - cell / 2, y - cellH / 2, cell, cellH, 12 * u);
      bg.lineStyle((today ? 4 : 2) * u, COLORS.outline, 1).strokeRoundedRect(x - cell / 2, y - cellH / 2, cell, cellH, 12 * u);
      const color = today || claimed ? TEXT.light : TEXT.dark;
      addText(this, x, y - cellH * 0.3, String(number), 22, { fontStyle: 'bold', color });
      if (typeof entry === 'number') {
        addText(this, x, y + cellH * 0.12, String(entry), 24, { fontStyle: 'bold', color });
      } else {
        // седьмой день — вещь
        addShape(this, 'trophy', cell * 0.7).object.setPosition(x, y + cellH * 0.12);
      }
    });

    const buttonW = panelW - 120 * u;
    const buttonsTop = top + 150 * u + cellH + 44 * u;
    const claim = (double) => {
      if (!progress.dailyAvailable) return;
      const given = progress.claimDaily(double);
      audio[given.item ? 'buy' : 'coin']();
      this.rebuild();
    };
    const label = reward.item ? t('ui.dailyTakeItem', { name: t(`items.${reward.item}`) }) : t('ui.dailyTake', { n: reward.coins });
    addButton(this, W / 2, buttonsTop, buttonW, 84 * u, label, () => claim(false), { size: 28 });
    if (hasDouble) {
      addButton(this, W / 2, buttonsTop + 100 * u, buttonW, 84 * u, t('ui.dailyDouble'), async () => {
        if (await yandex.showRewarded()) claim(true);
      }, { fill: COLORS.success, size: 28 });
    }
  }

  // ——— сундук за звёзды ———

  openChest() {
    this.chestOpen = true;
    this.rebuild();
  }

  addChestWindow() {
    const ready = progress.chestsAvailable > 0;
    const close = () => {
      this.chestOpen = false;
      this.rebuild();
    };
    addModal(this, {
      title: ready
        ? t('ui.chestReady', { coins: CHEST.coins, hints: CHEST.hints })
        : t('ui.chestWait', { n: progress.starsToChest, total: CHEST.stars }),
      onClose: close,
      buttons: ready
        ? [
            {
              label: t('ui.chestOpen'),
              fill: COLORS.success,
              onTap: () => {
                progress.openChest();
                audio.buy();
                close();
              },
            },
          ]
        : [{ label: t('ui.ok'), fill: COLORS.secondary, onTap: close }],
    });
  }
}
