import Phaser from 'phaser';

export class PauseOverlay {
  private overlay?: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private onQuit: () => void
  ) {}

  show(): void {
    if (this.overlay) return;

    const { width, height } = this.scene.cameras.main;

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    bg.setScrollFactor(0);
    bg.setInteractive(); // block clicks through

    const title = this.scene.add.text(width / 2, height / 2 - 60, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);

    const resumeBtn = this.scene.add.text(width / 2, height / 2 + 10, '[ RESUME ]', {
      fontSize: '24px',
      color: '#88ff88',
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    });
    resumeBtn.setOrigin(0.5);
    resumeBtn.setScrollFactor(0);
    resumeBtn.setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover', () => resumeBtn.setColor('#aaffaa'));
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#88ff88'));
    resumeBtn.on('pointerdown', () => this.hide());

    const quitBtn = this.scene.add.text(width / 2, height / 2 + 70, '[ QUIT ]', {
      fontSize: '24px',
      color: '#ff6644',
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    });
    quitBtn.setOrigin(0.5);
    quitBtn.setScrollFactor(0);
    quitBtn.setInteractive({ useHandCursor: true });
    quitBtn.on('pointerover', () => quitBtn.setColor('#ffaa88'));
    quitBtn.on('pointerout', () => quitBtn.setColor('#ff6644'));
    quitBtn.on('pointerdown', () => this.onQuit());

    this.overlay = this.scene.add.container(0, 0, [bg, title, resumeBtn, quitBtn]);
    this.overlay.setDepth(3000);
    this.overlay.setScrollFactor(0);
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
    }
  }

  toggle(): void {
    if (this.overlay) {
      this.hide();
    } else {
      this.show();
    }
  }

  get isVisible(): boolean {
    return !!this.overlay;
  }
}
