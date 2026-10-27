import { audio } from '../audio.js';
import { COLORS, ECONOMY, TEXT } from '../config.js';
import { t } from '../i18n/index.js';
import { sections } from '../levels/index.js';
import { progress } from '../services/progress.js';
import { addShape } from '../ui/shapes.js';
import { addButton, addCoinCounter, addModal, addLock, addText, makeTappable } from '../ui/widgets.js';
import { yandex } from '../yandex.js';
import { BaseScene } from './BaseScene.js';

// Значок раздела: картинка из src/ui/shapes.js
const ICONS = { morning: 'alarm', factory: 'factory', date: 'heart', fishing: 'fish', dacha: 'house' };

// Выбор раздела: Утро, Завод, Ухажёр, Рыбалка, Дача и секретный раздел.
// Закрытый раздел открывается тремя способами: пройти предыдущий, заплатить монетами
// или посмотреть рекламу несколько раз. Секретный — одной рекламой.
export class SectionSelectScene extends BaseScene {
  constructor() {
    super('SectionSelect');
  }

  init() {
    this.unlocking = null; // id раздела, для которого открыто окно «Как открыть»
  }

  build() {
    const { W, H, u, portrait } = this;

    addButton(this, 110 * u, 60 * u, 180 * u, 72 * u, t('ui.back'), () => this.go('Menu'), {
      fill: COLORS.secondary,
      size: 28,
    });
    addText(this, W / 2, 60 * u, t('ui.sections'), 36, { fontStyle: 'bold' });
    this.coins = addCoinCounter(this, W - 20 * u, 60 * u, progress.coins, 'right');

    // раздел с задачами дня в списке не показывается
    const shown = sections.filter((section) => !section.hidden);
    const cols = portrait ? 2 : 3;
    const rows = Math.ceil(shown.length / cols);
    const gap = 24 * u;
    const top = 130 * u;
    const cardW = Math.min((W - 60 * u - gap * (cols - 1)) / cols, 380 * u);
    const cardH = Math.min((H - top - 30 * u - gap * (rows - 1)) / rows, 330 * u);
    const left = (W - (cols * cardW + (cols - 1) * gap)) / 2;

    shown.forEach((section, index) => {
      const x = left + (index % cols) * (cardW + gap) + cardW / 2;
      const y = top + Math.floor(index / cols) * (cardH + gap) + cardH / 2;
      this.addCard(x, y, cardW, cardH, section);
    });

    // окно «Как открыть» — поверх карточек
    const unlocking = shown.find((section) => section.id === this.unlocking);
    if (unlocking && !progress.isSectionOpen(unlocking)) this.addUnlockWindow(unlocking);
  }

  addCard(x, y, w, h, section) {
    const u = this.u;
    const open = progress.isSectionOpen(section);
    const empty = section.levels.length === 0;
    const playable = open && !empty;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.outline, 0.18).fillRoundedRect(-w / 2, -h / 2 + 6 * u, w, h, 28 * u);
    // закрытый раздел, который можно открыть рекламой, остаётся цветным
    const adUnlock = !open && !empty;
    bg.fillStyle(playable || adUnlock ? section.color : COLORS.locked, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 28 * u);
    const card = this.add.container(x, y, [bg]).setSize(w, h);

    // значок раздела в светлом кружке
    const iconSize = Math.min(h * 0.36, w * 0.4);
    bg.fillStyle(COLORS.white, 0.85).fillCircle(0, -h * 0.17, iconSize * 0.75);
    if (ICONS[section.id]) {
      card.add(addShape(this, ICONS[section.id], iconSize).object.setPosition(0, -h * 0.17));
    } else {
      card.add(addText(this, 0, -h * 0.17, '?', 90, { fontStyle: 'bold', color: '#7b5ea7' }));
    }

    const name = addText(this, 0, h * 0.2, t(`sections.${section.id}`), 34, { fontStyle: 'bold', color: TEXT.light });
    if (name.width > w - 30 * u) name.setScale((w - 30 * u) / name.width);
    card.add(name);

    let status;
    if (section.secret && !open) status = t('ui.secretAd');
    else if (empty) status = t('ui.soon');
    else if (!open) status = t('ui.sectionLocked');
    else status = `${progress.completedIn(section)} / ${section.levels.length}`;
    const label = addText(this, 0, h * 0.37, status, adUnlock && !section.secret ? 18 : 22, { fontStyle: 'bold', color: TEXT.light, wordWrap: { width: w - 30 * u } });
    card.add(label);

    if (!open) {
      card.add(addLock(this, w / 2 - 44 * u, -h / 2 + 44 * u, 40 * u, COLORS.white));
    }

    if (playable) makeTappable(card, () => this.go('LevelSelect', { section: section.id }));
    else if (adUnlock && section.secret) makeTappable(card, () => this.openSecretForAd());
    else if (adUnlock) makeTappable(card, () => this.showUnlock(section));

  }

  showUnlock(section) {
    this.unlocking = section.id;
    this.rebuild();
  }

  // Окно «Как открыть раздел»: три способа, у каждого виден прогресс
  addUnlockWindow(section) {
    const close = () => {
      this.unlocking = null;
      this.rebuild();
    };
    const previous = sections[sections.indexOf(section) - 1];
    const views = progress.sectionAdViews(section);
    const price = ECONOMY.sectionPrice;
    const enough = progress.coins >= price;
    addModal(this, {
      title: t('ui.unlockTitle', { name: t(`sections.${section.id}`) }),
      onClose: close,
      buttons: [
        {
          label: t('ui.unlockLevels', {
            name: t(`sections.${previous.id}`),
            n: progress.completedIn(previous),
            total: previous.levels.length,
          }),
          disabled: !progress.isSectionOpen(previous),
          onTap: () => this.go('LevelSelect', { section: previous.id }),
        },
        {
          label: enough ? t('ui.unlockCoins', { n: price }) : t('ui.unlockNoCoins', { n: price, have: progress.coins }),
          fill: COLORS.coin,
          textColor: TEXT.dark,
          disabled: !enough,
          onTap: () => {
            if (!progress.buySection(section)) return;
            audio.buy();
            close();
          },
        },
        {
          label: t('ui.unlockAd', { n: views, total: ECONOMY.sectionAds }),
          fill: COLORS.success,
          onTap: () => this.watchForSection(section),
        },
      ],
    });
  }

  // Каждый просмотр засчитывается; после последнего раздел открывается навсегда
  async watchForSection(section) {
    if (!(await yandex.showRewarded())) return;
    progress.countSectionAd(section);
    if (progress.isSectionOpen(section)) {
      audio.buy();
      this.unlocking = null;
    }
    this.rebuild();
  }

  // Секретный раздел открывается одним просмотром рекламы — навсегда
  async openSecretForAd() {
    if (!(await yandex.showRewarded())) return;
    progress.openSecret();
    this.rebuild();
  }
}
