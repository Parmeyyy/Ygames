// Готовые картинки вместо нарисованных кодом.
//
// Положи PNG в src/assets/shapes/ с именем картинки из src/ui/shapes.js (например alarm.png) —
// и игра покажет его вместо фигуры. Фон: src/assets/backgrounds/<имя>.jpg или .png,
// где имя — тема из src/ui/background.js (morning, factory, …) или значение level.background.
// Картинки, которых в папках нет, по-прежнему рисуются кодом, так что добавлять их можно по одной.
//
// Валера из частей: src/assets/hero/ — head-<эмоция>.png (idle, happy, scared, surprised, sly, sad, sleep, blink),
// torso-<верх>.png (tank — родная майка), legs-<низ>.png (track — родные треники), hat-<шапка>.png (cap — родная кепка).
// Части берутся листами из Canva и режутся scripts/sheet.py (подробности — в src/ui/Hero.js).
//
// Текстуры для полей уровня (вода, земля, трава…): src/assets/textures/<имя>.png — бесшовный квадрат,
// им заливается box с полем texture (src/level-types/objects.js).
const shapeFiles = import.meta.glob('../assets/shapes/*.png', { eager: true, query: '?url', import: 'default' });
const backgroundFiles = import.meta.glob('../assets/backgrounds/*.{png,jpg}', { eager: true, query: '?url', import: 'default' });
const heroFiles = import.meta.glob('../assets/hero/*.png', { eager: true, query: '?url', import: 'default' });
const textureFiles = import.meta.glob('../assets/textures/*.png', { eager: true, query: '?url', import: 'default' });

const nameOf = (path) => path.split('/').pop().replace(/\.\w+$/, '');

const shapeKey = (name) => `shape-${name}`;
const backgroundKey = (name) => `bg-image-${name}`;
const heroKey = (name) => `hero-${name}`;
const fillKey = (name) => `fill-${name}`;

// Загрузка всех картинок: вызывается на экране загрузки
export function preloadImages(scene) {
  for (const [path, url] of Object.entries(shapeFiles)) scene.load.image(shapeKey(nameOf(path)), url);
  for (const [path, url] of Object.entries(backgroundFiles)) scene.load.image(backgroundKey(nameOf(path)), url);
  for (const [path, url] of Object.entries(heroFiles)) scene.load.image(heroKey(nameOf(path)), url);
  for (const [path, url] of Object.entries(textureFiles)) scene.load.image(fillKey(nameOf(path)), url);
}

// Ключ текстуры для картинки объекта или фона; null, если готовой картинки нет
export const shapeTexture = (scene, name) => (scene.textures.exists(shapeKey(name)) ? shapeKey(name) : null);
export const backgroundTexture = (scene, name) => (scene.textures.exists(backgroundKey(name)) ? backgroundKey(name) : null);
export const heroTexture = (scene, name) => (scene.textures.exists(heroKey(name)) ? heroKey(name) : null);
export const fillTexture = (scene, name) => (scene.textures.exists(fillKey(name)) ? fillKey(name) : null);
