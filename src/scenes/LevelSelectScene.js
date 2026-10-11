import { COLORS, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { levels } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { addButton, addText, makeTappable } from '../ui/widgets.js';
import { BaseScene } from './BaseScene.js';

export class LevelSelectScene extends BaseScene {
  constructor() {
    super('LevelSelect');
  }

  build() {
    const { W, u } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.scene.start('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.selectLevel'), 36, { fontStyle: 'bold' });

    const cell = 130 * u;
    const gap = 24 * u;
    const fit = Math.floor((W - 80 * u + gap) / (cell + gap));
    const cols = Math.max(1, Math.min(8, fit, levels.length));
    const left = (W - (cols * cell + (cols - 1) * gap)) / 2;
    const top = 150 * u;

    levels.forEach((level, index) => {
      const x = left + (index % cols) * (cell + gap) + cell / 2;
      const y = top + Math.floor(index / cols) * (cell + gap) + cell / 2;
      this.addCell(x, y, cell, level.number);
    });
  }

  addCell(x, y, size, number) {
    const u = this.u;
    const locked = number > progress.unlocked;
    const fill = locked ? COLORS.locked : progress.isCompleted(number) ? COLORS.success : COLORS.accent;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-size / 2, -size / 2 + 6 * u, size, size, 24 * u);
    bg.fillStyle(fill, 1).fillRoundedRect(-size / 2, -size / 2, size, size, 24 * u);

    const cell = this.add.container(x, y, [bg]).setSize(size, size);

    if (locked) {
      // замок: дужка и корпус
      bg.lineStyle(size * 0.06, COLORS.secondary, 1);
      bg.beginPath().arc(0, -size * 0.06, size * 0.12, Math.PI, 0).strokePath();
      bg.fillStyle(COLORS.secondary, 1).fillRoundedRect(-size * 0.2, -size * 0.06, size * 0.4, size * 0.3, size * 0.05);
      return;
    }

    cell.add(addText(this, 0, 0, String(number), 52, { color: TEXT.light, fontStyle: 'bold' }));
    makeTappable(cell, () => this.scene.start('Level', { number }));
  }
}
