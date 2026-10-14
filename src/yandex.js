// Обёртка над SDK Яндекс Игр. Остальная игра обращается к платформе только через этот модуль.
//
// Если YaGames не определён (локальный запуск), работает заглушка:
// данные игрока лежат в localStorage, вместо рекламы — серый экран на 2 секунды,
// вместо стики-баннера — серая полоса внизу.

const STORAGE_KEY = 'valera-progress-v1';
const LEVELS_PER_INTERSTITIAL = 3;
const STUB_AD_DURATION = 2000;
const STUB_BANNER_HEIGHT = 50;

let ysdk = null;
let player = null;
let readySent = false;
let levelsSinceInterstitial = 0;

// Сколько CSS-пикселей внизу окна занято баннером, который рисует сама игра (только заглушка)
let bannerHeight = 0;
let layoutListener = () => {};

// Игра на паузе, пока есть хотя бы одна причина: 'ad', 'hidden', 'platform'
const pauseReasons = new Set();
let pauseListener = () => {};

// Идёт ли игровой процесс с точки зрения игры (открыт уровень) и что уже сообщено платформе
let gameplayWanted = false;
let gameplayReported = false;

function syncGameplay() {
  const active = gameplayWanted && pauseReasons.size === 0;
  if (active === gameplayReported) return;
  gameplayReported = active;
  const api = ysdk?.features?.GameplayAPI;
  if (active) api?.start();
  else api?.stop();
}

function setPause(reason, on) {
  const wasPaused = pauseReasons.size > 0;
  if (on) pauseReasons.add(reason);
  else pauseReasons.delete(reason);
  const paused = pauseReasons.size > 0;
  if (paused !== wasPaused) pauseListener(paused);
  syncGameplay();
}

function showStubAd() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.textContent = 'РЕКЛАМА (тест)';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;' +
      'background:#808080;color:#fff;font:bold 32px system-ui,sans-serif;';
    document.body.append(overlay);
    setTimeout(() => {
      overlay.remove();
      resolve();
    }, STUB_AD_DURATION);
  });
}

// Держит игру и звук на паузе, пока реклама не закроется
async function runAd(show) {
  if (pauseReasons.has('ad')) return false;
  setPause('ad', true);
  try {
    return await show();
  } catch (error) {
    console.warn('Реклама: ошибка показа', error);
    return false;
  } finally {
    setPause('ad', false);
  }
}

export const yandex = {
  // Код языка: до init() — язык браузера, после — язык из SDK
  lang: navigator.language || 'ru',

  get isStub() {
    return !ysdk;
  },

  async init() {
    document.addEventListener('visibilitychange', () => setPause('hidden', document.hidden));

    if (typeof YaGames === 'undefined') {
      console.info('YaGames не найден - включена заглушка SDK');
      return;
    }
    try {
      ysdk = await YaGames.init();
      this.lang = ysdk.environment?.i18n?.lang || this.lang;
      // Платформа сама просит паузу, когда перекрывает игру своим окном
      ysdk.on?.('game_api_pause', () => setPause('platform', true));
      ysdk.on?.('game_api_resume', () => setPause('platform', false));
      player = await ysdk.getPlayer();
    } catch (error) {
      console.warn('SDK Яндекс Игр: ошибка инициализации', error);
    }
  },

  // Текущее время в миллисекундах. На платформе — серверное, чтобы подарки нельзя было
  // получить, переведя часы на устройстве.
  now() {
    return ysdk?.serverTime?.() ?? Date.now();
  },

  // listener(paused) вызывается, когда игру и звук нужно остановить или продолжить
  onPauseChange(listener) {
    pauseListener = listener;
  },

  // listener() вызывается, когда меняется место, доступное игре (появился баннер)
  onLayoutChange(listener) {
    layoutListener = listener;
  },

  // Высота полосы внизу окна, которую игра должна оставить свободной под баннер
  get bannerHeight() {
    return bannerHeight;
  },

  // Стики-баннер. На платформе его рисует Яндекс рядом с игрой (включается в Консоли, вкладка «Реклама»;
  // для управления отсюда нужна опция «Использовать API для показа sticky-баннера»).
  async showBanner() {
    if (!ysdk) {
      if (bannerHeight) return;
      const banner = document.createElement('div');
      banner.textContent = 'БАННЕР (тест)';
      banner.style.cssText =
        `position:fixed;left:0;right:0;bottom:0;height:${STUB_BANNER_HEIGHT}px;z-index:900;display:flex;` +
        'align-items:center;justify-content:center;background:#9e9e9e;color:#fff;font:bold 16px system-ui,sans-serif;';
      document.body.append(banner);
      bannerHeight = STUB_BANNER_HEIGHT;
      layoutListener();
      return;
    }
    try {
      const status = await ysdk.adv.getBannerAdvStatus();
      // reason есть, когда баннер показать нельзя (например, не подключён в Консоли)
      if (!status.stickyAdvIsShowing && !status.reason) await ysdk.adv.showBannerAdv();
    } catch (error) {
      console.warn('SDK Яндекс Игр: не удалось показать стики-баннер', error);
    }
  },

  // Game Ready: игра загружена и готова к взаимодействию. Отправляется один раз.
  gameReady() {
    if (readySent) return;
    readySent = true;
    ysdk?.features?.LoadingAPI?.ready();
  },

  // Игрок начал или закончил играть уровень
  setGameplay(active) {
    gameplayWanted = active;
    syncGameplay();
  },

  async loadData() {
    if (player) {
      try {
        return (await player.getData()) ?? {};
      } catch (error) {
        console.warn('SDK Яндекс Игр: не удалось загрузить данные игрока', error);
        return {};
      }
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
      // нет сохранения или оно повреждено
      return {};
    }
  },

  saveData(data) {
    if (player) {
      // flush = true: сразу отправить в облако. Лимит SDK — 100 запросов за 5 минут.
      player.setData(data, true).catch((error) => {
        console.warn('SDK Яндекс Игр: не удалось сохранить данные игрока', error);
      });
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // хранилище может быть недоступно (приватный режим) — играем без сохранения
    }
  },

  // Вызывать при каждом пройденном уровне: по этому счётчику решается, пора ли показать рекламу
  levelCompleted() {
    levelsSinceInterstitial += 1;
  },

  // Межстраничная реклама — не чаще раза в LEVELS_PER_INTERSTITIAL пройденных уровней.
  // Вызывать только на переходе между уровнями. Промис завершается, когда можно продолжать.
  async showInterstitialIfDue() {
    if (levelsSinceInterstitial < LEVELS_PER_INTERSTITIAL) return;
    const shown = await runAd(() => {
      if (!ysdk) return showStubAd().then(() => true);
      return new Promise((resolve) => {
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: (wasShown) => resolve(wasShown),
            onError: () => resolve(false),
          },
        });
      });
    });
    // Если платформа рекламу не показала, попробуем снова после следующего уровня
    if (shown) levelsSinceInterstitial = 0;
  },

  // Реклама за вознаграждение. Возвращает true, если игрок досмотрел и заслужил награду.
  showRewarded() {
    return runAd(() => {
      if (!ysdk) return showStubAd().then(() => true);
      return new Promise((resolve) => {
        let rewarded = false;
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onRewarded: () => {
              rewarded = true;
            },
            onClose: () => resolve(rewarded),
            onError: () => resolve(false),
          },
        });
      });
    });
  },
};
