import Phaser from 'phaser';
import { COLORS } from './config.js';
import { setLang } from './i18n/index.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { LevelScene } from './scenes/LevelScene.js';
import { WinScene } from './scenes/WinScene.js';
import { yandex } from './yandex.js';

// Пока SDK не инициализирован — язык браузера; BootScene потом возьмёт язык из SDK
setLang(yandex.lang);

// Канвас рисуется в физических пикселях (чёткий текст на retina),
// а zoom возвращает его к размеру окна в CSS-пикселях.
function viewport() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    width: Math.round(window.innerWidth * dpr),
    height: Math.round(window.innerHeight * dpr),
    zoom: 1 / dpr,
  };
}

const initial = viewport();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.bg,
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.NONE,
    width: initial.width,
    height: initial.height,
    zoom: initial.zoom,
  },
  scene: [BootScene, MenuScene, LevelSelectScene, LevelScene, WinScene],
});

// Паузой звука управляем сами (реклама, уход со вкладки), иначе Phaser
// включит его обратно при возврате фокуса, даже если реклама ещё открыта.
game.sound.pauseOnBlur = false;

yandex.onPauseChange((paused) => {
  if (paused) {
    game.sound.pauseAll();
    game.pause();
  } else {
    game.resume();
    game.sound.resumeAll();
  }
});

window.addEventListener('resize', () => {
  const { width, height, zoom } = viewport();
  // CSS-размер ставим сами: при zoom = 1 Phaser в resize() его не обновляет
  game.canvas.style.width = `${window.innerWidth}px`;
  game.canvas.style.height = `${window.innerHeight}px`;
  game.scale.zoom = zoom;
  game.scale.resize(width, height);
});
