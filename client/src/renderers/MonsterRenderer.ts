import Phaser from 'phaser';

interface MonsterSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  hpBar: Phaser.GameObjects.Graphics;
  hpBg: Phaser.GameObjects.Graphics;
  glow?: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;
}

export class MonsterRenderer {
  private sprites: Map<string, MonsterSprite> = new Map();

  constructor(private scene: Phaser.Scene) {}

  create(monster: any, key: string): void {
    const size = monster.size || 20;
    const scale = size / 32;
    const spriteKey = `monster_${monster.monsterType}`;

    const children: Phaser.GameObjects.GameObject[] = [];

    // Add rarity glow behind sprite
    let glow: Phaser.GameObjects.Graphics | undefined;
    if (monster.rarity === 'magic') {
      glow = this.scene.add.graphics();
      glow.fillStyle(0x4444ff, 0.35);
      glow.fillCircle(0, 0, size / 2 + 6);
      children.push(glow);
      this.scene.tweens.add({ targets: glow, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });
    } else if (monster.rarity === 'rare') {
      glow = this.scene.add.graphics();
      glow.fillStyle(0xffff00, 0.35);
      glow.fillCircle(0, 0, size / 2 + 6);
      children.push(glow);
      this.scene.tweens.add({ targets: glow, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });
    }

    const image = this.scene.add.image(0, 0, spriteKey);
    image.setScale(scale);
    children.push(image);

    const levelText = this.scene.add.text(-size / 2 - 2, -size / 2 - 10, `Lv${monster.level || 1}`, {
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(1, 0);
    children.push(levelText);

    const hpBg = this.scene.add.graphics();
    hpBg.fillStyle(0x660000, 1);
    hpBg.fillRect(-size / 2, -size / 2 - 8, size, 4);

    const hpBar = this.scene.add.graphics();
    const hpPercent = monster.hp / monster.maxHp;
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(-size / 2, -size / 2 - 8, size * hpPercent, 4);

    children.push(hpBg, hpBar);

    const container = this.scene.add.container(monster.x, monster.y, children);

    this.sprites.set(key, { container, image, hpBar, hpBg, glow, levelText });
  }

  update(monster: any, key: string): void {
    const sprite = this.sprites.get(key);
    if (!sprite) return;

    sprite.container.setPosition(monster.x, monster.y);

    // Update HP bar
    const size = monster.size || 20;
    sprite.hpBar.clear();
    const hpPercent = Math.max(0, monster.hp / monster.maxHp);
    sprite.hpBar.fillStyle(0xff0000, 1);
    sprite.hpBar.fillRect(-size / 2, -size / 2 - 8, size * hpPercent, 4);
  }

  remove(key: string): void {
    const sprite = this.sprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.sprites.delete(key);
    }
  }

  destroyAll(): void {
    this.sprites.forEach(s => s.container.destroy());
    this.sprites.clear();
  }
}
