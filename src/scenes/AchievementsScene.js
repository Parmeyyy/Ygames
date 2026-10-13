import { audio } from '../audio.js';
import { COLORS, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { ACHIEVEMENTS } from '../rewards.js';
import { progress } from '../services/progress.js';
import { addButton, addCoinAmount, addCoinCounter, addText } from '../ui/widgets.js';
import { BaseScene } from './BaseScene.js';

// Достижения: за каждое — монеты, награду нужно забрать нажатием
export class AchievementsScene extends BaseScene {
  constructor() {
    super('Achievements');
  }

  build() {
    const { W, H, u, portrait } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.achievements'), 36, { fontStyle: 'bold' });
    addCoinCounter(this, W - 20 * u, 60 * u, progress.coins, 'right');

    // портрет — один столбец, альбом — два
    const cols = portrait ? 1 : 2;
    const rows = Math.ceil(ACHIEVEMENTS.length / cols);
    const gap = 12 * u;
    const top = 130 * u;
    const rowW = Math.min((W - 40 * u - gap * (cols - 1)) / cols, 660 * u);
    const rowH = Math.min((H - top - 20 * u - gap * (rows - 1)) / rows, 100 * u);
    const left = (W - (cols * rowW + (cols - 1) * gap)) / 2;

    ACHIEVEMENTS.forEach((achievement, index) => {
      const x = left + (index % cols) * (rowW + gap);
      const y = top + Math.floor(index / cols) * (rowH + gap);
      this.addRow(x, y, rowW, rowH, achievement);
    });
  }

  addRow(x, y, w, h, achievement) {
    const u = this.u;
    const value = Math.min(progress.achievementValue(achievement.id), achievement.goal);
    const done = progress.isAchieved(achievement.id);
    const ready = !done && value >= achievement.goal;

    const bg = this.add.graphics();
    bg.fillStyle(done ? 0xe6f2df : COLORS.white, 1).fillRoundedRect(x, y, w, h, 18 * u);
    bg.lineStyle(3 * u, ready ? COLORS.success : COLORS.outline, 1).strokeRoundedRect(x, y, w, h, 18 * u);

    const actionW = 170 * u;
    const textW = w - actionW - 50 * u;
    const name = addText(this, x + 20 * u, y + h * 0.32, t(`achievements.${achievement.id}`), 24, { fontStyle: 'bold' }).setOrigin(0, 0.5);
    if (name.width > textW) name.setScale(textW / name.width);
    addText(this, x + 20 * u, y + h * 0.72, `${value} / ${achievement.goal}`, 20, { color: TEXT.muted }).setOrigin(0, 0.5);

    const actionX = x + w - actionW / 2 - 14 * u;
    if (done) {
      addText(this, actionX, y + h / 2, t('ui.achievementDone'), 22, { color: '#3d8b37', fontStyle: 'bold' });
    } else if (ready) {
      addButton(this, actionX, y + h / 2, actionW, h - 28 * u, `+${achievement.reward}`, () => {
        if (progress.claimAchievement(achievement)) audio.coin();
        this.rebuild();
      }, { fill: COLORS.success, size: 28 });
    } else {
      addCoinAmount(this, actionX, y + h / 2, achievement.reward, 26, TEXT.muted);
    }
  }
}
