import { COLORS, ECONOMY } from '../config.js';
import { levelText, pick, t } from '../i18n/index.js';
import { getLevel, nextLevel } from '../levels/index.js';
import { LEVEL_TYPES } from '../level-types/index.js';
import { progress } from '../services/progress.js';
import { Egg } from '../ui/Egg.js';
import { addBubble, addButton, addCoinCounter, addModal, addText, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

export class LevelScene extends BaseScene {
  constructor() {
    super('Level');
  }

  init(data) {
    this.level = getLevel(data.id);
    this.mistakes = 0;
    this.solved = false;
    this.hintUnlocked = false;
    this.hintDialogOpen = false;
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
      const side = W - 320 * u;
      return {
        coins: { x: W / 2, y: 122 * u, anchor: 'center' },
        question: { x: W / 2, y: 215 * u, w: W - 80 * u },
        field: { x: 40 * u, y: 310 * u, w: W - 80 * u, h: H - 650 * u },
        egg: { x: 150 * u, y: H - 150 * u, h: 200 * u },
        bubble: { x: 280 * u + side / 2, y: H - 150 * u, w: side },
        skip: { x: 280 * u + side / 2, y: H - 295 * u, w: Math.min(side, 380 * u), h: 60 * u },
      };
    }
    const column = W * 0.34;
    return {
      coins: { x: 220 * u, y: 60 * u, anchor: 'left' },
      question: { x: column + (W - column) / 2, y: 170 * u, w: W - column - 80 * u },
      field: { x: column + 20 * u, y: 250 * u, w: W - column - 60 * u, h: H - 280 * u },
      egg: { x: column / 2, y: H - 170 * u, h: 220 * u },
      bubble: { x: column / 2, y: 200 * u, w: column - 60 * u },
      skip: { x: column / 2, y: 305 * u, w: Math.min(column - 60 * u, 380 * u), h: 56 * u },
    };
  }

  build() {
    const { W, u, level } = this;
    const layout = (this.layout = this.computeLayout());
    this.bubble = null;
    this.modal = null;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.menu'), () => this.scene.start('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    const titleKey = level.chapter === 'secret' ? 'ui.secretLevel' : 'ui.level';
    const title = addText(this, W / 2, 60 * u, t(titleKey, { n: level.number }), 34, { fontStyle: 'bold' });
    addButton(this, W - 130 * u, 60 * u, 220 * u, 72 * u, t('ui.hint'), () => this.onHintTap(), { size: 28 });
    addCoinCounter(this, layout.coins.x, layout.coins.y, progress.coins, layout.coins.anchor);

    const question = addText(this, layout.question.x, layout.question.y, levelText(level, 'question'), 42, {
      fontStyle: 'bold',
      wordWrap: { width: layout.question.w },
    });

    this.egg = new Egg(this, layout.egg.x, layout.egg.y, layout.egg.h, level.eggMood);
    if (this.solved) this.egg.setMood('happy');
    this.say(this.line);
    if (this.mistakes >= ECONOMY.mistakesToSkip) this.addSkipButton();

    // Элементы интерфейса, которые уровень может сделать ответом ("ui:<имя>")
    this.targets = { levelNumber: title, question, egg: this.egg };

    const buildType = LEVEL_TYPES[level.type];
    if (buildType) {
      this.typeHandle = buildType(this, level, layout.field, {
        correct: () => this.correct(),
        wrong: () => this.wrong(),
        bindTarget: (name, onTap) => this.bindTarget(name, onTap),
      });
    } else {
      console.warn(`Уровень ${level.id}: неизвестный тип "${level.type}"`);
    }

    if (this.hintDialogOpen) this.openHintDialog();
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

  // ——— подсказка: за монеты или за рекламу, после получения на этом уровне бесплатна ———

  onHintTap() {
    if (this.hintUnlocked) this.say(levelText(this.level, 'hint'));
    else this.openHintDialog();
  }

  openHintDialog() {
    this.hintDialogOpen = true;
    this.modal = addModal(this, {
      title: t('ui.hintTitle'),
      onClose: () => this.closeHintDialog(),
      buttons: [
        {
          label: t('ui.hintForCoins', { n: ECONOMY.hintPrice }),
          disabled: progress.coins < ECONOMY.hintPrice,
          onTap: () => {
            if (progress.spend(ECONOMY.hintPrice)) this.unlockHint();
          },
        },
        {
          label: t('ui.hintForAd'),
          fill: COLORS.success,
          onTap: async () => {
            if (await yandex.showRewarded()) this.unlockHint();
          },
        },
        { label: t('ui.cancel'), fill: COLORS.secondary, onTap: () => this.closeHintDialog() },
      ],
    });
  }

  closeHintDialog() {
    this.hintDialogOpen = false;
    this.modal?.destroy();
    this.modal = null;
  }

  unlockHint() {
    this.hintUnlocked = true;
    this.hintDialogOpen = false;
    this.line = levelText(this.level, 'hint');
    this.rebuild(); // обновить счётчик монет и показать подсказку
  }

  // ——— пропуск уровня за рекламу: появляется после нескольких ошибок ———

  addSkipButton() {
    const { x, y, w, h } = this.layout.skip;
    addButton(this, x, y, w, h, t('ui.skipAd'), () => this.skip(), { fill: COLORS.secondary, size: 24 });
  }

  async skip() {
    if (this.solved || !(await yandex.showRewarded())) return;
    progress.skip(this.level);
    const next = nextLevel(this.level);
    if (next) this.scene.start('Level', { id: next.id });
    else this.scene.start('LevelSelect', { chapter: this.level.chapter });
  }

  correct() {
    if (this.solved) return;
    this.solved = true;
    const reward = progress.complete(this.level);
    yandex.levelCompleted();
    yandex.setGameplay(false);
    this.egg.react('happy');
    this.time.delayedCall(800, () => this.scene.start('Win', { id: this.level.id, reward }));
  }

  wrong() {
    if (this.solved) return;
    this.mistakes += 1;
    this.egg.react('scared');
    this.cameras.main.shake(200, 0.006);
    this.say(pick('egg.wrong'));
    if (this.mistakes === ECONOMY.mistakesToSkip) this.addSkipButton();
  }
}
