import Phaser from 'phaser';

export class DeathOverlay {
  private overlay?: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {}

  show(): void {
    if (this.overlay) return;

    const bg = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0x000000,
      0.7
    );

    const text = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      'YOU DIED\nRespawning...',
      {
        fontSize: '48px',
        color: '#ff0000',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    text.setOrigin(0.5);

    this.overlay = this.scene.add.container(0, 0, [bg, text]);
    this.overlay.setDepth(1000);
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
    }
  }

  handleResize(width: number, height: number): void {
    if (this.overlay) {
      const bg = this.overlay.getAt(0) as Phaser.GameObjects.Rectangle;
      const text = this.overlay.getAt(1) as Phaser.GameObjects.Text;
      bg.setSize(width, height);
      bg.setPosition(width / 2, height / 2);
      text.setPosition(width / 2, height / 2);
    }
  }

  get isVisible(): boolean {
    return !!this.overlay;
  }
}
