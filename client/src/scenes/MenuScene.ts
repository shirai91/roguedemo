import Phaser from 'phaser';
import { networkClient } from '../network/Client';

export class MenuScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;
  private startButton!: Phaser.GameObjects.Text;

  // Connection check UI
  private connectingText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private retryButton!: Phaser.GameObjects.Text;

  // Menu elements (stored for deferred creation)
  private menuElements: Phaser.GameObjects.GameObject[] = [];
  private bg!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Dark gradient background
    this.bg = this.add.graphics();
    this.bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    this.bg.fillRect(0, 0, width, height);

    // Decorative border lines
    this.border = this.add.graphics();
    this.border.lineStyle(2, 0x444466, 0.5);
    this.border.strokeRect(20, 20, width - 40, height - 40);
    this.border.lineStyle(1, 0x333355, 0.3);
    this.border.strokeRect(30, 30, width - 60, height - 60);

    // Show connecting state
    this.showConnecting();
    this.attemptConnection();
  }

  private showConnecting() {
    const { width, height } = this.scale;

    // Hide any previous error UI
    this.errorText?.destroy();
    this.retryButton?.destroy();

    this.connectingText = this.add.text(width / 2, height / 2, 'Connecting...', {
      fontSize: '24px',
      color: '#888899',
      fontFamily: '"Courier New", monospace',
    });
    this.connectingText.setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: this.connectingText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private async attemptConnection() {
    try {
      const room = await networkClient.connect();
      room.leave();
      networkClient.room = null;
      networkClient.sessionId = '';

      // Connection succeeded - show menu
      this.connectingText.destroy();
      this.showMenu();
    } catch (_err) {
      // Connection failed - show error
      this.connectingText.destroy();
      this.showConnectionError();
    }
  }

  private showConnectionError() {
    const { width, height } = this.scale;

    this.errorText = this.add.text(width / 2, height / 2 - 20, 'Connection Failed', {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.errorText.setOrigin(0.5);

    this.retryButton = this.add.text(width / 2, height / 2 + 30, '[ RETRY ]', {
      fontSize: '22px',
      color: '#ff6644',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
      stroke: '#331100',
      strokeThickness: 2,
    });
    this.retryButton.setOrigin(0.5);
    this.retryButton.setInteractive({ useHandCursor: true });

    this.retryButton.on('pointerover', () => {
      this.retryButton.setColor('#ffaa88');
      this.retryButton.setBackgroundColor('#2a1a3e');
    });
    this.retryButton.on('pointerout', () => {
      this.retryButton.setColor('#ff6644');
      this.retryButton.setBackgroundColor('#1a1a2e');
    });
    this.retryButton.on('pointerdown', () => {
      this.errorText.destroy();
      this.retryButton.destroy();
      this.showConnecting();
      this.attemptConnection();
    });
  }

  private showMenu() {
    const { width, height } = this.scale;

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
    this.menuElements.push(title);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.25 + 50, '~ Enter the Dungeon ~', {
      fontSize: '18px',
      color: '#888899',
      fontFamily: '"Courier New", monospace',
    });
    subtitle.setOrigin(0.5);
    this.menuElements.push(subtitle);

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
    this.menuElements.push(label);

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
    this.menuElements.push(this.startButton);

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
    this.menuElements.push(footer);

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
