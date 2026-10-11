import { COLORS, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { chapters } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { addButton, addText, drawLock, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Сетка уровней одной главы: основной ("main") или секретной ("secret")
export class LevelSelectScene extends BaseScene {
  constructor() {
    super('LevelSelect');
  }

  init(data) {
    this.chapter = data.chapter ?? 'main';
  }

  build() {
    const { W, u } = this;
    const secret = this.chapter === 'secret';
    const levels = chapters[this.chapter];

    const back = () => (secret ? this.scene.start('LevelSelect') : this.scene.start('Menu'));
    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), back, { fill: COLORS.secondary, size: 28 });
    const title = addText(this, W / 2, 60 * u, t(secret ? 'ui.secretChapter' : 'ui.selectLevel'), 36, { fontStyle: 'bold' });
    // длинный заголовок не должен наезжать на кнопку «Назад»
    const maxTitle = W - 440 * u;
    if (title.width > maxTitle) title.setScale(maxTitle / title.width);

    const cell = 130 * u;
    const gap = 24 * u;
    const fit = Math.floor((W - 80 * u + gap) / (cell + gap));
    const cols = Math.max(1, Math.min(8, fit, levels.length));
    const rows = Math.ceil(levels.length / cols);
    const left = (W - (cols * cell + (cols - 1) * gap)) / 2;
    const top = 150 * u;

    levels.forEach((level, index) => {
      const x = left + (index % cols) * (cell + gap) + cell / 2;
      const y = top + Math.floor(index / cols) * (cell + gap) + cell / 2;
      this.addCell(x, y, cell, level);
    });

    if (!secret && chapters.secret.length) this.addSecretButton(top + rows * (cell + gap) + 70 * u);
  }

  addCell(x, y, size, level) {
    const u = this.u;
    const locked = !progress.isUnlocked(level);
    const fill = locked ? COLORS.locked : progress.isCompleted(level) ? COLORS.success : COLORS.accent;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-size / 2, -size / 2 + 6 * u, size, size, 24 * u);
    bg.fillStyle(fill, 1).fillRoundedRect(-size / 2, -size / 2, size, size, 24 * u);

    const cell = this.add.container(x, y, [bg]).setSize(size, size);

    if (locked) {
      drawLock(bg, 0, size * 0.03, size * 0.4);
      return;
    }

    cell.add(addText(this, 0, 0, String(level.number), 52, { color: TEXT.light, fontStyle: 'bold' }));
    makeTappable(cell, () => this.scene.start('Level', { id: level.id }));
  }

  // Секретная глава открывается одним просмотром рекламы — навсегда
  addSecretButton(y) {
    const { W, u } = this;
    const w = 500 * u;
    const h = 110 * u;

    if (progress.secretOpen) {
      addButton(this, W / 2, y, w, h, t('ui.secretChapter'), () => this.scene.start('LevelSelect', { chapter: 'secret' }), {
        fill: COLORS.special,
        size: 32,
      });
      return;
    }

    const button = addButton(this, W / 2, y, w, h, t('ui.secretChapterAd'), () => this.openSecret(), {
      fill: COLORS.special,
      size: 25,
    });
    const lock = this.add.graphics();
    drawLock(lock, -w / 2 + 50 * u, 4 * u, 36 * u, COLORS.white);
    button.add(lock);
  }

  async openSecret() {
    if (!(await yandex.showRewarded())) return;
    progress.openSecret();
    this.rebuild();
  }
}
