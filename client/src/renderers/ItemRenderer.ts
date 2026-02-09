import Phaser from 'phaser';
import { SKILL_SPRITES, getItemSpriteKey } from '../data/sprites';

interface ItemSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Graphics;
}

interface SkillSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Graphics;
}

export class ItemRenderer {
  private itemSprites: Map<string, ItemSprite> = new Map();
  private skillSprites: Map<string, SkillSprite> = new Map();

  constructor(private scene: Phaser.Scene) {}

  createItem(item: any, key: string): void {
    const color = parseInt(item.color?.replace('#', '0x') || '0xffffff');
    const spriteKey = getItemSpriteKey(item.itemId || '');

    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.25);
    glow.fillCircle(0, 0, 14);

    const image = this.scene.add.image(0, 0, spriteKey);
    image.setScale(16 / 32);

    const container = this.scene.add.container(item.x, item.y, [glow, image]);

    this.itemSprites.set(key, { container, image, glow });

    // Pulse effect on glow
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.5,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  updateItem(item: any, key: string): void {
    const sprite = this.itemSprites.get(key);
    if (sprite) {
      sprite.container.setPosition(item.x, item.y);
    }
  }

  removeItem(key: string): void {
    const sprite = this.itemSprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.itemSprites.delete(key);
    }
  }

  createSkill(skill: any, key: string): void {
    const spriteKey = SKILL_SPRITES[skill.skillId] || 'flame_0';

    const glow = this.scene.add.graphics();
    glow.fillStyle(0x00ffff, 0.3);
    glow.fillCircle(0, 0, 16);

    const image = this.scene.add.image(0, 0, spriteKey);
    image.setScale(20 / 32);

    const container = this.scene.add.container(skill.x, skill.y, [glow, image]);

    this.skillSprites.set(key, { container, image, glow });

    this.scene.tweens.add({
      targets: glow,
      alpha: 0.6,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }

  updateSkill(skill: any, key: string): void {
    const sprite = this.skillSprites.get(key);
    if (sprite) {
      sprite.container.setPosition(skill.x, skill.y);
    }
  }

  removeSkill(key: string): void {
    const sprite = this.skillSprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.skillSprites.delete(key);
    }
  }

  destroyAll(): void {
    this.itemSprites.forEach(s => s.container.destroy());
    this.itemSprites.clear();
    this.skillSprites.forEach(s => s.container.destroy());
    this.skillSprites.clear();
  }
}
