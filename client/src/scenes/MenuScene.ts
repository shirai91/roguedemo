import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;
  private startButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative border lines
    const border = this.add.graphics();
    border.lineStyle(2, 0x444466, 0.5);
    border.strokeRect(20, 20, width - 40, height - 40);
    border.lineStyle(1, 0x333355, 0.3);
    border.strokeRect(30, 30, width - 60, height - 60);

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'RogueDemo', {
      fontSize: '64px',
      color: '#ff6644',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#330000',
        blur: 8,
        fill: true,
      },
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.25 + 50, '~ Enter the Dungeon ~', {
      fontSize: '18px',
      color: '#888899',
      fontFamily: '"Courier New", monospace',
    });
    subtitle.setOrigin(0.5);

    // Title pulse animation
    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // "Enter your name" label
    const label = this.add.text(width / 2, height * 0.48, 'PLAYER NAME', {
      fontSize: '14px',
      color: '#aaaacc',
      fontFamily: '"Courier New", monospace',
      letterSpacing: 4,
    });
    label.setOrigin(0.5);

    // HTML input overlay for player name
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Anonymous';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      position: absolute;
      font-family: "Courier New", monospace;
      font-size: 20px;
      color: #eeddcc;
      background: #1a1a2e;
      border: 2px solid #444466;
      border-radius: 4px;
      padding: 8px 16px;
      text-align: center;
      outline: none;
      width: 260px;
      letter-spacing: 2px;
    `;
    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = '#ff6644';
    });
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = '#444466';
    });
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.startGame();
      }
    });

    const canvas = this.game.canvas;
    canvas.parentElement?.appendChild(this.nameInput);
    this.positionInput();

    // Start button
    this.startButton = this.add.text(width / 2, height * 0.62, '[ START ]', {
      fontSize: '28px',
      color: '#ff6644',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      backgroundColor: '#1a1a2e',
      padding: { x: 24, y: 12 },
      stroke: '#331100',
      strokeThickness: 2,
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      this.startButton.setColor('#ffaa88');
      this.startButton.setBackgroundColor('#2a1a3e');
    });
    this.startButton.on('pointerout', () => {
      this.startButton.setColor('#ff6644');
      this.startButton.setBackgroundColor('#1a1a2e');
    });
    this.startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Footer
    const footer = this.add.text(width / 2, height - 40, 'WASD to move  |  Mouse to aim  |  Click to shoot', {
      fontSize: '12px',
      color: '#555566',
      fontFamily: '"Courier New", monospace',
    });
    footer.setOrigin(0.5);

    // Handle resize
    this.scale.on('resize', this.handleResize, this);
  }

  private positionInput() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scale;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    const inputX = rect.left + (width / 2) * scaleX - 130;
    const inputY = rect.top + height * 0.52 * scaleY;

    this.nameInput.style.left = `${inputX}px`;
    this.nameInput.style.top = `${inputY}px`;
  }

  private handleResize() {
    this.positionInput();
  }

  private startGame() {
    const playerName = this.nameInput.value.trim() || 'Anonymous';

    // Remove HTML input
    this.nameInput.remove();

    // Clean up resize listener
    this.scale.off('resize', this.handleResize, this);

    // Start game scenes with player name
    this.scene.start('GameScene', { playerName });
  }
}
