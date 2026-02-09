import Phaser from 'phaser';

export class MenuIcon {
  private icon!: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    this.icon = this.scene.add.text(this.scene.scale.width - 16, 16, '≡', {
      fontSize: '32px',
      color: '#aaaaaa',
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#00000066',
      padding: { x: 8, y: 2 },
    });
    this.icon.setOrigin(1, 0);
    this.icon.setDepth(900);
    this.icon.setInteractive({ useHandCursor: true });
    this.icon.on('pointerdown', () => {
      this.scene.events.emit('togglePause');
    });
  }

  handleResize(width: number, height: number): void {
    this.icon.setPosition(width - 16, 16);
  }
}
