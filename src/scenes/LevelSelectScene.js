import { COLORS, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { getSection } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { addButton, addLock, addStars, addText, makeTappable } from '../ui/widgets.js';
import { BaseScene } from './BaseScene.js';

// Сетка уровней одного раздела
export class LevelSelectScene extends BaseScene {
  constructor() {
    super('LevelSelect');
  }

  init(data) {
    this.section = getSection(data.section) ?? getSection('morning');
  }

  backgroundTheme() {
    return [this.section.theme];
  }

  build() {
    const { W, u } = this;
    const levels = this.section.levels;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.go('SectionSelect'), {
      fill: COLORS.secondary,
      size: 28,
    });
    const title = addText(this, W / 2, 60 * u, t(`sections.${this.section.id}`), 36, { fontStyle: 'bold' });
    // длинный заголовок не должен наезжать на кнопку «Назад»
    const maxTitle = W - 440 * u;
    if (title.width > maxTitle) title.setScale(maxTitle / title.width);

    const top = 150 * u;
    const gap = 24 * u;
    // Ячейки уменьшаются, пока вся сетка не поместится по высоте
    const room = this.H - top - 20 * u;
    let cell;
    let cols;
    let rows;
    for (let size = 130; size >= 60; size -= 10) {
      cell = size * u;
      const fit = Math.floor((W - 80 * u + gap) / (cell + gap));
      cols = Math.max(1, Math.min(10, fit, levels.length));
      rows = Math.ceil(levels.length / cols);
      if (rows * (cell + gap) <= room) break;
    }
    const left = (W - (cols * cell + (cols - 1) * gap)) / 2;

    levels.forEach((level, index) => {
      const x = left + (index % cols) * (cell + gap) + cell / 2;
      const y = top + Math.floor(index / cols) * (cell + gap) + cell / 2;
      this.addCell(x, y, cell, level);
    });
  }

  addCell(x, y, size, level) {
    const u = this.u;
    const locked = !progress.isUnlocked(level);
    const fill = locked ? COLORS.locked : progress.isCompleted(level) ? COLORS.success : this.section.color;

    const bg = this.add.graphics();
    const radius = size * 0.18;
    bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-size / 2, -size / 2 + 6 * u, size, size, radius);
    bg.fillStyle(fill, 1).fillRoundedRect(-size / 2, -size / 2, size, size, radius);

    const cell = this.add.container(x, y, [bg]).setSize(size, size);

    if (locked) {
      cell.add(addLock(this, 0, size * 0.03, size * 0.4));
      return;
    }

    const stars = progress.starsOf(level);
    if (stars > 0) cell.add(addStars(this, 0, size * 0.3, stars, size * 0.1));
    cell.add(
      addText(this, 0, stars > 0 ? -size * 0.1 : 0, String(level.number), 52 * (size / (130 * u)), {
        color: TEXT.light,
        fontStyle: 'bold',
      }),
    );
    makeTappable(cell, () => this.go('Level', { id: level.id }));
  }
}
