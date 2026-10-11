import Phaser from 'phaser';

// Адаптив: сцена целиком пересобирается в build() при каждом изменении размера окна.
// Всё, что должно пережить пересборку (ошибки, текущая реплика), хранится в полях сцены.
//
// Размеры задаются в «дизайн-единицах» и умножаются на this.u:
// портрет рассчитан на макет 720×1280, альбом — на 1280×720.
export class BaseScene extends Phaser.Scene {
  create() {
    this.scale.on('resize', this.rebuild, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.rebuild, this));
    this.rebuild();
  }

  rebuild() {
    this.teardown();
    this.tweens.killAll();
    [...this.children.list].forEach((child) => child.destroy());

    const { width, height } = this.scale;
    this.W = width;
    this.H = height;
    this.portrait = height >= width;
    this.u = this.portrait
      ? Math.min(width / 720, height / 1280)
      : Math.min(width / 1280, height / 720);

    this.build();
  }

  // Создаёт все объекты сцены под текущий размер
  build() {}

  // Останавливает то, что не является объектом сцены (таймеры и т. п.)
  teardown() {}
}
