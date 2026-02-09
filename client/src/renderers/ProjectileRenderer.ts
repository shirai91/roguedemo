import Phaser from 'phaser';
import { SKILL_SPRITES } from '../data/sprites';

export class ProjectileRenderer {
  private sprites: Map<string, Phaser.GameObjects.Arc | Phaser.GameObjects.Image> = new Map();

  constructor(private scene: Phaser.Scene) {}

  create(projectile: any, key: string): void {
    if (projectile.skillId) {
      const spriteKey = SKILL_SPRITES[projectile.skillId];
      if (spriteKey) {
        const img = this.scene.add.image(projectile.x, projectile.y, spriteKey);
        img.setScale(16 / 32);
        img.setRotation(projectile.angle);
        this.sprites.set(key, img);
        return;
      }
    }
    const arc = this.scene.add.arc(projectile.x, projectile.y, 4, 0, 360, false, 0xffffff);
    this.sprites.set(key, arc);
  }

  update(projectile: any, key: string): void {
    const sprite = this.sprites.get(key);
    if (sprite) {
      sprite.setPosition(projectile.x, projectile.y);
      if (sprite instanceof Phaser.GameObjects.Image) {
        sprite.setRotation(projectile.angle);
      }
    }
  }

  remove(key: string): void {
    const sprite = this.sprites.get(key);
    if (sprite) {
      sprite.destroy();
      this.sprites.delete(key);
    }
  }

  destroyAll(): void {
    this.sprites.forEach(s => s.destroy());
    this.sprites.clear();
  }
}
