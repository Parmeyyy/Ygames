import { COLORS } from '../config.js';
import { levelText, pick, t } from '../i18n/index.js';
import { getLevel } from '../levels/index.js';
import { LEVEL_TYPES } from '../level-types/index.js';
import { progress } from '../services/progress.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addText, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

export class LevelScene extends BaseScene {
  constructor() {
    super('Level');
  }

  init(data) {
    this.level = getLevel(data.number);
    this.mistakes = 0;
    this.solved = false;
    this.hintUnlocked = false;
    // у уровня может быть своя стартовая реплика (levels.<id>.start)
    const own = levelText(this.level, 'start');
    this.line = own.startsWith('levels.') ? pick('egg.start') : own;
  }

  create() {
    super.create();
    yandex.setGameplay(true);
    this.events.once('shutdown', () => yandex.setGameplay(false));
  }

  // Портрет: вопрос → поле → яйцо с репликой внизу.
  // Альбом: слева колонка с яйцом и репликой, справа вопрос и поле.
  computeLayout() {
    const { W, H, u, portrait } = this;
    if (portrait) {
      return {
        question: { x: W / 2, y: 200 * u, w: W - 80 * u },
        field: { x: 40 * u, y: 300 * u, w: W - 80 * u, h: H - 620 * u },
        egg: { x: 150 * u, y: H - 160 * u, h: 220 * u },
        bubble: { x: 280 * u + (W - 320 * u) / 2, y: H - 170 * u, w: W - 320 * u },
      };
    }
    const column = W * 0.34;
    return {
      question: { x: column + (W - column) / 2, y: 170 * u, w: W - column - 80 * u },
      field: { x: column + 20 * u, y: 250 * u, w: W - column - 60 * u, h: H - 280 * u },
      egg: { x: column / 2, y: H - 190 * u, h: 250 * u },
      bubble: { x: column / 2, y: 220 * u, w: column - 60 * u },
    };
  }

  build() {
    const { W, u, level } = this;
    const layout = (this.layout = this.computeLayout());
    this.bubble = null;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.menu'), () => this.scene.start('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    const title = addText(this, W / 2, 60 * u, t('ui.level', { n: level.number }), 34, { fontStyle: 'bold' });
    // Первая подсказка на уровне — за рекламу, дальше её можно перечитывать бесплатно
    if (this.hintUnlocked) {
      addButton(this, W - 130 * u, 60 * u, 220 * u, 72 * u, t('ui.hint'), () => this.showHint(), { size: 28 });
    } else {
      addButton(this, W - 130 * u, 60 * u, 220 * u, 72 * u, t('ui.hintAd'), () => this.showHint(), { size: 21 });
    }

    const question = addText(this, layout.question.x, layout.question.y, levelText(level, 'question'), 42, {
      fontStyle: 'bold',
      wordWrap: { width: layout.question.w },
    });

    this.egg = new Egg(this, layout.egg.x, layout.egg.y, layout.egg.h, level.eggMood);
    if (this.solved) this.egg.setMood('happy');
    this.say(this.line);

    // Элементы интерфейса, которые уровень может сделать ответом ("ui:<имя>")
    this.targets = { levelNumber: title, question, egg: this.egg };

    const buildType = LEVEL_TYPES[level.type];
    if (!buildType) {
      console.warn(`Уровень ${level.id}: неизвестный тип "${level.type}"`);
      return;
    }
    this.typeHandle = buildType(this, level, layout.field, {
      correct: () => this.correct(),
      wrong: () => this.wrong(),
      bindTarget: (name, onTap) => this.bindTarget(name, onTap),
    });
  }

  teardown() {
    this.typeHandle?.destroy?.();
    this.typeHandle = null;
  }

  bindTarget(name, onTap) {
    const target = this.targets[name];
    if (!target) {
      console.warn(`Уровень ${this.level.id}: нет элемента интерфейса "${name}"`);
      return;
    }
    makeTappable(target, onTap, { cursor: false, pad: target === this.egg ? 0 : 20 * this.u });
  }

  say(line) {
    this.line = line;
    this.bubble?.destroy();
    const { x, y, w } = this.layout.bubble;
    this.bubble = addBubble(this, x, y, w, line);
  }

  async showHint() {
    if (!this.hintUnlocked) {
      if (!(await yandex.showRewarded())) return;
      this.hintUnlocked = true;
    }
    this.line = levelText(this.level, 'hint');
    this.rebuild(); // кнопка меняет подпись на «Подсказка»
  }

  correct() {
    if (this.solved) return;
    this.solved = true;
    progress.complete(this.level.number);
    yandex.levelCompleted();
    yandex.setGameplay(false);
    this.egg.react('happy');
    this.time.delayedCall(800, () => this.scene.start('Win', { number: this.level.number }));
  }

  wrong() {
    if (this.solved) return;
    this.mistakes += 1;
    this.egg.react('scared');
    this.cameras.main.shake(200, 0.006);
    this.say(pick('egg.wrong'));
  }
}
