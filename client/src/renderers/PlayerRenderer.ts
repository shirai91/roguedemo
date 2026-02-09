import Phaser from 'phaser';

interface PlayerSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  hpBg: Phaser.GameObjects.Graphics;
}

export class PlayerRenderer {
  private sprites: Map<string, PlayerSprite> = new Map();

  constructor(private scene: Phaser.Scene) {}

  create(player: any, key: string, isLocal: boolean): void {
    const image = this.scene.add.image(0, 0, 'player');
    image.setScale(30 / 32);
    if (!isLocal) {
      image.setTint(0x88ff88);
      image.setAlpha(0.8);
    }

    const nameText = this.scene.add.text(0, -30, player.name || 'Player', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 }
    });
    nameText.setOrigin(0.5);

    const hpBg = this.scene.add.graphics();
    hpBg.fillStyle(0x660000, 1);
    hpBg.fillRect(-15, -22, 30, 4);

    const hpBar = this.scene.add.graphics();
    const hpPercent = player.hp / player.maxHp;
    hpBar.fillStyle(0x00ff00, 1);
    hpBar.fillRect(-15, -22, 30 * hpPercent, 4);

    const container = this.scene.add.container(player.x, player.y, [image, nameText, hpBg, hpBar]);

    this.sprites.set(key, { container, image, nameText, hpBar, hpBg });
  }

  update(player: any, key: string): void {
    const sprite = this.sprites.get(key);
    if (!sprite) return;

    sprite.container.setPosition(player.x, player.y);

    // Update HP bar
    sprite.hpBar.clear();
    const hpPercent = Math.max(0, player.hp / player.maxHp);
    sprite.hpBar.fillStyle(0x00ff00, 1);
    sprite.hpBar.fillRect(-15, -22, 30 * hpPercent, 4);
  }

  remove(key: string): void {
    const sprite = this.sprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.sprites.delete(key);
    }
  }

  getContainer(key: string): Phaser.GameObjects.Container | undefined {
    return this.sprites.get(key)?.container;
  }

  destroyAll(): void {
    this.sprites.forEach(s => s.container.destroy());
    this.sprites.clear();
  }
}
