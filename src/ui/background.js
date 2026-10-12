import Phaser from 'phaser';

// Фон сцены: мягкий вертикальный градиент и медленно плывущие облака (ночью — звёзды).
// Градиент рисуется один раз в маленькую текстуру и растягивается на весь экран — это дёшево.
const THEMES = {
  day: { top: '#fff9e6', bottom: '#ffe8c2', clouds: true },
  sunny: { top: '#fff2bf', bottom: '#ffd9a8', clouds: true },
  sky: { top: '#dcefff', bottom: '#fff1d6', clouds: true },
  dusk: { top: '#ffcfb0', bottom: '#ffe9c4', clouds: true },
  night: { top: '#8b90c9', bottom: '#dccbea', stars: true },
  rain: { top: '#b9c6d3', bottom: '#e6e2d8' },
  // фоны разделов
  morning: { top: '#ffe9b8', bottom: '#ffd3a8', clouds: true },
  factory: { top: '#cfd8e3', bottom: '#eee6da', clouds: true },
  date: { top: '#ffd6e3', bottom: '#fff0e0', clouds: true },
  lake: { top: '#cdeaf7', bottom: '#e3f4e1', clouds: true },
  garden: { top: '#dff3c8', bottom: '#fff1c9', clouds: true },
};

function gradientTexture(scene, name) {
  const key = `bg-${name}`;
  if (!scene.textures.exists(key)) {
    const theme = THEMES[name];
    const texture = scene.textures.createCanvas(key, 4, 256);
    const context = texture.getContext();
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(1, theme.bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 4, 256);
    texture.refresh();
  }
  return key;
}

// theme — имя из THEMES; clouds: false убирает облака (например, на уровнях, где облака — часть загадки)
export function addBackground(scene, theme = 'day', { clouds = true } = {}) {
  const { W, H, u } = scene;
  const name = THEMES[theme] ? theme : 'day';
  const layer = scene.add.container(0, 0);
  layer.add(scene.add.image(0, 0, gradientTexture(scene, name)).setOrigin(0).setDisplaySize(W, H));

  if (THEMES[name].stars) {
    const stars = scene.add.graphics();
    stars.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 30; i += 1) {
      stars.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.6), Phaser.Math.Between(1, 3) * u);
    }
    layer.add(stars);
  }

  if (THEMES[name].clouds && clouds) {
    [
      { y: 0.12, size: 200, seconds: 80, start: 0.15 },
      { y: 0.3, size: 150, seconds: 110, start: 0.6 },
      { y: 0.5, size: 240, seconds: 95, start: 0.85 },
    ].forEach(({ y, size, seconds, start }) => {
      const s = size * u;
      const cloud = scene.add.graphics({ y: H * y });
      cloud.fillStyle(0xffffff, 0.55);
      cloud.fillCircle(-s * 0.25, s * 0.05, s * 0.2).fillCircle(0, -s * 0.08, s * 0.26).fillCircle(s * 0.25, s * 0.05, s * 0.2);
      cloud.fillRoundedRect(-s * 0.42, 0, s * 0.84, s * 0.27, s * 0.13);
      layer.add(cloud);

      // плывёт слева направо по кругу; start — с какой части пути начинает
      const from = -s;
      const to = W + s;
      const drift = scene.tweens.add({ targets: cloud, x: { from, to }, duration: seconds * 1000, repeat: -1 });
      drift.seek(seconds * 1000 * start);
    });
  }

  return layer;
}
