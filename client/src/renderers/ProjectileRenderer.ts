import Phaser from 'phaser';
import { SKILL_SPRITES } from '../data/sprites';

const DAMAGE_TYPE_COLORS: Record<string, number> = {
  attack: 0xffffff,
  spell: 0x8888ff,
  divine: 0xffdd00,
};

export class ProjectileRenderer {
  private sprites: Map<string, Phaser.GameObjects.Arc | Phaser.GameObjects.Image> = new Map();
  private targets: Map<string, { x: number; y: number }> = new Map();

  constructor(private scene: Phaser.Scene) {}

  create(projectile: any, key: string): void {
    // 1. Use spriteKey from server (monster projectiles)
    if (projectile.spriteKey && this.scene.textures.exists(projectile.spriteKey)) {
      const img = this.scene.add.image(projectile.x, projectile.y, projectile.spriteKey);
      img.setScale(16 / 32);
      img.setRotation(projectile.angle);
      this.sprites.set(key, img);
      this.targets.set(key, { x: projectile.x, y: projectile.y });
      return;
    }

    // 2. Use skill sprite for player skill projectiles
    if (projectile.skillId) {
      const spriteKey = SKILL_SPRITES[projectile.skillId];
      if (spriteKey) {
        const img = this.scene.add.image(projectile.x, projectile.y, spriteKey);
        img.setScale(16 / 32);
        img.setRotation(projectile.angle);
        this.sprites.set(key, img);
        this.targets.set(key, { x: projectile.x, y: projectile.y });
        return;
      }
    }

    // 3. Fallback: colored circle based on damageType
    const color = DAMAGE_TYPE_COLORS[projectile.damageType] ?? 0xffffff;
    const arc = this.scene.add.arc(projectile.x, projectile.y, 4, 0, 360, false, color);
    this.sprites.set(key, arc);
    this.targets.set(key, { x: projectile.x, y: projectile.y });
  }

  update(projectile: any, key: string): void {
    const target = this.targets.get(key);
    if (target) {
      target.x = projectile.x;
      target.y = projectile.y;
    }
    const sprite = this.sprites.get(key);
    if (sprite && sprite instanceof Phaser.GameObjects.Image) {
      sprite.setRotation(projectile.angle);
    }
  }

  interpolate(dt: number): void {
    const factor = 0.45;
    this.sprites.forEach((sprite, key) => {
      const target = this.targets.get(key);
      if (!target) return;
      const cx = sprite.x;
      const cy = sprite.y;
      sprite.setPosition(
        cx + (target.x - cx) * factor,
        cy + (target.y - cy) * factor
      );
    });
  }

  remove(key: string): void {
    const sprite = this.sprites.get(key);
    if (sprite) {
      sprite.destroy();
      this.sprites.delete(key);
    }
    this.targets.delete(key);
  }

  setVisible(key: string, visible: boolean): void {
    const sprite = this.sprites.get(key);
    if (sprite) sprite.setVisible(visible);
  }

  destroyAll(): void {
    this.sprites.forEach(s => s.destroy());
    this.sprites.clear();
    this.targets.clear();
  }
}
