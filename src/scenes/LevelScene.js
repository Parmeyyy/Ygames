import { audio } from '../audio.js';
import { COLORS, ECONOMY } from '../config.js';
import { hasText, levelText, pick, t } from '../i18n/index.js';
import { getLevel, getSection, nextLevel } from '../levels/index.js';
import { LEVEL_TYPES } from '../level-types/index.js';
import { progress } from '../services/progress.js';
import { addBackground } from '../ui/background.js';
import { flashError } from '../ui/effects.js';
import { Hero } from '../ui/Hero.js';
import { addBubble, addButton, addCoinCounter, addModal, addText, addWordFlow, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

export class LevelScene extends BaseScene {
  constructor() {
    super('Level');
  }

  init(data) {
    this.level = getLevel(data.id);
    this.section = getSection(this.level.section);
    this.mistakes = 0;
    this.solved = false;
    this.hintUnlocked = false;
    this.hintDialogOpen = false;
    this.levelState = {}; // прогресс внутри уровня, переживает пересборку сцены
    // у уровня может быть своя стартовая реплика (levels.<id>.start)
    this.line = hasText(`levels.${this.level.id}.start`) ? levelText(this.level, 'start') : pick('hero.start');
  }

  create() {
    super.create();
    yandex.setGameplay(true);
    this.events.once('shutdown', () => yandex.setGameplay(false));
  }

  // Фон уровня: level.background, иначе фон раздела; после решения — level.backgroundSolved.
  // Плывущих облаков нет там, где облака — часть загадки.
  backgroundTheme() {
    const { level } = this;
    const theme = (this.solved && level.backgroundSolved) || level.background || this.section.theme;
    const clouds = !level.objects?.some((object) => object.shape === 'cloud' || object.shape === 'raincloud');
    return [theme, { clouds }];
  }

  // Портрет: вопрос → поле → Валера с репликой внизу.
  // Альбом: слева колонка с Валерой и репликой, справа вопрос и поле.
  computeLayout() {
    const { W, H, u, portrait } = this;
    if (portrait) {
      const side = W - 320 * u;
      return {
        coins: { x: W / 2, y: 122 * u, anchor: 'center' },
        question: { x: W / 2, y: 215 * u, w: W - 80 * u },
        field: { x: 40 * u, y: 310 * u, w: W - 80 * u, h: H - 650 * u },
        hero: { x: 140 * u, y: H - 165 * u, h: 290 * u },
        bubble: { x: 280 * u + side / 2, y: H - 150 * u, w: side },
        skip: { x: 280 * u + side / 2, y: H - 295 * u, w: Math.min(side, 380 * u), h: 60 * u },
      };
    }
    const column = W * 0.34;
    return {
      coins: { x: 220 * u, y: 60 * u, anchor: 'left' },
      question: { x: column + (W - column) / 2, y: 170 * u, w: W - column - 80 * u },
      field: { x: column + 20 * u, y: 250 * u, w: W - column - 60 * u, h: H - 280 * u },
      hero: { x: column / 2, y: H - 175 * u, h: 270 * u },
      bubble: { x: column / 2, y: 190 * u, w: column - 60 * u },
      skip: { x: column / 2, y: 290 * u, w: Math.min(column - 60 * u, 380 * u), h: 56 * u },
    };
  }

  build() {
    const { W, u, level } = this;
    const layout = (this.layout = this.computeLayout());
    this.bubble = null;
    this.modal = null;
    this.marks = {};
    this.coinDrag = null;

    // isUi: нажатия на кнопки интерфейса не считаются действиями игрока на уровне
    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.menu'), () => this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    }).isUi = true;
    const titleKey = this.section.hidden ? 'ui.dailyLevel' : this.section.secret ? 'ui.secretLevel' : 'ui.level';
    const title = addText(this, W / 2, 60 * u, t(titleKey, { n: level.number }), 34, { fontStyle: 'bold' });
    const hint = addButton(this, W - 130 * u, 60 * u, 220 * u, 72 * u, t('ui.hint'), () => this.onHintTap(), { size: 28 });
    hint.isUi = true;
    // hideCoins: на уровнях про числа счётчик монет был бы лишним числом на экране
    this.coinCounter = level.hideCoins
      ? null
      : addCoinCounter(this, layout.coins.x, layout.coins.y, progress.coins, layout.coins.anchor);

    const question = this.addQuestion();

    // heroHat — шапка, которую уровень надевает на Валеру вместо его собственной
    this.hero = new Hero(this, layout.hero.x, layout.hero.y, layout.hero.h, level.heroMood, {
      props: level.heroProps,
      hand: null, // на уровне руки свободны: в них кладут предметы по ходу загадки
      ...(level.heroHat ? { item: level.heroHat } : {}),
    }).enableTaps();
    if (this.solved) this.hero.setMood('happy');
    this.say(this.line);
    if (this.mistakes >= ECONOMY.mistakesToSkip) this.addSkipButton();

    // Элементы интерфейса, которые уровень может сделать ответом ("ui:<имя>")
    this.targets = { levelNumber: title, question, hero: this.hero, word: this.word };
    Object.assign(this.marks, { 'ui:hero': this.hero, 'ui:levelNumber': title, 'ui:hint': hint });
    if (this.word) this.marks.word = this.word;

    const buildType = LEVEL_TYPES[level.type];
    if (buildType) {
      this.typeHandle = buildType(this, level, layout.field, {
        correct: () => this.correct(),
        wrong: (line) => this.wrong(line),
        bindTarget: (name, onTap) => this.bindTarget(name, onTap),
        target: (name) => this.targets[name],
        coinSource: () => this.coinSource(),
        say: (line) => this.say(line),
        state: this.levelState,
        isUiPress: (over) => this.hintDialogOpen || over.some((object) => object.isUi),
        mark: (id, object) => {
          this.marks[id] = object;
        },
      });
    } else {
      console.warn(`Уровень ${level.id}: неизвестный тип "${level.type}"`);
    }

    if (this.hintDialogOpen) this.openHintDialog();

    // режим разработки: координаты объектов уровня в CSS-пикселях — для автотестов
    if (import.meta.env.DEV) {
      const zoom = this.scale.zoom;
      window.__level = {
        id: level.id,
        solved: () => this.solved,
        mistakes: () => this.mistakes,
        size: () => ({ w: this.W * zoom, h: this.H * zoom }),
        points: () =>
          Object.fromEntries(
            Object.entries(this.marks).map(([id, o]) => [
              id,
              // у слова из вопроса начало координат слева — отдаём его середину
              { x: (o.x + (o === this.word ? o.width / 2 : 0)) * zoom, y: o.y * zoom, visible: o.visible },
            ]),
          ),
      };
    }
  }

  // Текст задания. Если у уровня есть level.word (ключ в текстах уровня), это слово становится
  // отдельным объектом, который уровень может сделать перетаскиваемым.
  addQuestion() {
    const { level, layout } = this;
    const { x, y, w } = layout.question;
    const text = levelText(level, 'question');
    this.word = null;
    if (!level.word) return addText(this, x, y, text, 42, { fontStyle: 'bold', wordWrap: { width: w } });

    const wanted = levelText(level, level.word).toLowerCase();
    const words = addWordFlow(this, x, y, text, 42, w, { fontStyle: 'bold' });
    // знаки препинания при сравнении не считаются
    this.word = words.find((word) => word.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === wanted) ?? null;
    if (!this.word) console.warn(`Уровень ${level.id}: в вопросе нет слова "${wanted}"`);
    // уже вытащенное слово в вопрос не возвращается
    if (this.word && this.solved) this.word.setVisible(false);
    return words[0];
  }

  // Монета, которую можно вытащить из счётчика монет (для уровней, где интерфейс — часть загадки).
  // Монеты игрока при этом не тратятся.
  coinSource() {
    if (!this.coinCounter) return null;
    if (!this.coinDrag) {
      const radius = 16 * this.u;
      const { x, y } = this.coinCounter.coinPoint;
      const coin = this.add.graphics();
      coin.fillStyle(COLORS.coin, 1).fillCircle(0, 0, radius);
      coin.lineStyle(Math.max(1, 2 * this.u), COLORS.outline, 1).strokeCircle(0, 0, radius);
      // зона нажатия больше самой монетки, чтобы в неё легко попасть пальцем
      this.coinDrag = this.add.container(x, y, [coin]).setSize(radius * 4, radius * 4);
      this.coinDrag.isUi = true;
      this.marks['ui:coin'] = this.coinDrag;
    }
    return this.coinDrag;
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
    // у Валеры своя анимация нажатия
    const isHero = target === this.hero;
    makeTappable(target, onTap, { cursor: false, pad: isHero ? 0 : 20 * this.u, feedback: !isHero });
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
        // бесплатные подсказки (с колеса удачи и из сундуков) тратятся первыми
        ...(progress.hints > 0
          ? [
              {
                label: t('ui.hintFree', { n: progress.hints }),
                fill: COLORS.special,
                onTap: () => {
                  if (progress.useHint()) this.unlockHint();
                },
              },
            ]
          : []),
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
    const button = addButton(this, x, y, w, h, t('ui.skipAd'), () => this.skip(), { fill: COLORS.secondary, size: 24 });
    button.isUi = true;
    this.marks['ui:skip'] = button;
  }

  async skip() {
    if (this.solved || !(await yandex.showRewarded())) return;
    progress.skip(this.level);
    const next = nextLevel(this.level);
    if (next) this.go('Level', { id: next.id });
    else if (this.section.hidden) this.go('Menu');
    else this.go('LevelSelect', { section: this.level.section });
  }

  // Возвращает true: ответ принят (типы уровней могут оборачивать correct своей проверкой)
  correct() {
    if (this.solved) return true;
    this.solved = true;
    // 3 звезды — без ошибок и без подсказки, 2 — не больше двух ошибок, иначе 1
    const stars = this.mistakes === 0 && !this.hintUnlocked ? 3 : this.mistakes <= 2 ? 2 : 1;
    const { coins, item } = progress.complete(this.level, stars);
    yandex.levelCompleted();
    yandex.setGameplay(false);
    audio.correct();
    this.hero.react('happy');
    if (this.level.backgroundSolved) {
      // новый фон плавно проступает поверх старого
      const next = addBackground(this, this.level.backgroundSolved).setAlpha(0);
      this.children.moveTo(next, this.children.getIndex(this.background) + 1);
      this.tweens.add({ targets: next, alpha: 1, duration: 600 });
    }
    this.time.delayedCall(800, () => this.go('Win', { id: this.level.id, reward: coins, stars, item }));
    return true;
  }

  // line — своя реплика на эту ошибку; иначе реплика уровня (levels.<id>.wrong) или общая
  wrong(line) {
    if (this.solved) return;
    this.mistakes += 1;
    audio.wrong();
    this.hero.react('scared');
    this.cameras.main.shake(180, 0.005);
    flashError(this);
    const own = `levels.${this.level.id}.wrong`;
    this.say(line || (hasText(own) ? pick(own) : pick('hero.wrong')));
    if (this.mistakes === ECONOMY.mistakesToSkip) this.addSkipButton();
  }
}
