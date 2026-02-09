import Phaser from 'phaser';
import { networkClient } from '../network/Client';

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const GRID_SIZE = 100;

interface PlayerSprite {
  container: Phaser.GameObjects.Container;
  rect: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  hpBg: Phaser.GameObjects.Graphics;
}

interface MonsterSprite {
  container: Phaser.GameObjects.Container;
  rect: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Graphics;
  hpBg: Phaser.GameObjects.Graphics;
  border?: Phaser.GameObjects.Graphics;
}

interface ItemSprite {
  container: Phaser.GameObjects.Container;
  rect: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Arc;
}

export class GameScene extends Phaser.Scene {
  private playerSprites: Map<string, PlayerSprite> = new Map();
  private monsterSprites: Map<string, MonsterSprite> = new Map();
  private projectileSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
  private itemSprites: Map<string, ItemSprite> = new Map();

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any = {};
  private mousePointer!: Phaser.Input.Pointer;

  private currentInput = { dx: 0, dy: 0, shooting: false, angle: 0 };
  private lastSentInput = { dx: 0, dy: 0, shooting: false, angle: 0 };

  // Virtual joystick for mobile
  private joystickBase?: Phaser.GameObjects.Arc;
  private joystickThumb?: Phaser.GameObjects.Arc;
  private joystickPointer?: Phaser.Input.Pointer;
  private joystickActive = false;
  private joystickBasePos = { x: 0, y: 0 };

  // Mobile attack button
  private attackButton?: Phaser.GameObjects.Container;
  private attackButtonActive = false;

  private deathText?: Phaser.GameObjects.Text;
  private isMobile = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  async create() {
    // Detect mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw grid
    this.drawGrid();

    // Setup input
    this.setupInput();

    // Setup camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setZoom(1);

    // Connect to server
    try {
      await networkClient.connect();
      console.log('Connected to server');
      this.setupNetworkListeners();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.add.text(400, 300, 'Failed to connect to server', {
        fontSize: '32px',
        color: '#ff0000'
      }).setScrollFactor(0);
    }

    // Launch UI scene
    this.scene.launch('UIScene');

    // Setup mobile controls if needed
    if (this.isMobile) {
      this.setupMobileControls();
    }
  }

  private drawGrid() {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x222222, 1);

    // Vertical lines
    for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE) {
      this.gridGraphics.lineBetween(x, 0, x, MAP_HEIGHT);
    }

    // Horizontal lines
    for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE) {
      this.gridGraphics.lineBetween(0, y, MAP_WIDTH, y);
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.mousePointer = this.input.activePointer;

    // Mouse click to shoot
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isMobile) {
        // Mobile handles shooting differently
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const player = networkClient.room?.state.players.get(networkClient.sessionId);
      if (player && !player.isDead) {
        const angle = Math.atan2(worldPoint.y - player.y, worldPoint.x - player.x);
        this.currentInput.shooting = true;
        this.currentInput.angle = angle;
      }
    });

    this.input.on('pointerup', () => {
      if (!this.isMobile) {
        this.currentInput.shooting = false;
      }
    });
  }

  private setupMobileControls() {
    // Create virtual joystick (initially hidden)
    this.joystickBase = this.add.arc(0, 0, 60, 0, 360, false, 0x444444, 0.3);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(1000);
    this.joystickBase.setVisible(false);

    this.joystickThumb = this.add.arc(0, 0, 30, 0, 360, false, 0x888888, 0.5);
    this.joystickThumb.setScrollFactor(0);
    this.joystickThumb.setDepth(1001);
    this.joystickThumb.setVisible(false);

    // Create attack button (right side)
    const attackBtnX = this.cameras.main.width - 80;
    const attackBtnY = this.cameras.main.height - 80;

    const attackBtnCircle = this.add.arc(0, 0, 50, 0, 360, false, 0x660000, 0.5);
    attackBtnCircle.setStrokeStyle(3, 0xff0000, 0.8);

    // Draw crosshair
    const crosshair = this.add.graphics();
    crosshair.lineStyle(3, 0xffffff, 0.8);
    crosshair.lineBetween(-15, 0, 15, 0);
    crosshair.lineBetween(0, -15, 0, 15);
    crosshair.arc(0, 0, 10, 0, Math.PI * 2);
    crosshair.strokePath();

    this.attackButton = this.add.container(attackBtnX, attackBtnY, [attackBtnCircle, crosshair]);
    this.attackButton.setScrollFactor(0);
    this.attackButton.setDepth(1000);
    this.attackButton.setSize(100, 100);
    this.attackButton.setInteractive();

    this.attackButton.on('pointerdown', () => {
      this.attackButtonActive = true;
      this.handleMobileAttack();
    });

    this.attackButton.on('pointerup', () => {
      this.attackButtonActive = false;
      this.currentInput.shooting = false;
    });

    this.attackButton.on('pointerout', () => {
      this.attackButtonActive = false;
      this.currentInput.shooting = false;
    });

    // Joystick controls
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Left 40% of screen is joystick area
      if (pointer.x < this.cameras.main.width * 0.4) {
        this.joystickActive = true;
        this.joystickPointer = pointer;
        this.joystickBasePos.x = pointer.x;
        this.joystickBasePos.y = pointer.y;

        if (this.joystickBase && this.joystickThumb) {
          this.joystickBase.setPosition(pointer.x, pointer.y);
          this.joystickThumb.setPosition(pointer.x, pointer.y);
          this.joystickBase.setVisible(true);
          this.joystickThumb.setVisible(true);
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickActive && pointer.id === this.joystickPointer?.id) {
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickActive && pointer.id === this.joystickPointer?.id) {
        this.joystickActive = false;
        this.currentInput.dx = 0;
        this.currentInput.dy = 0;

        if (this.joystickBase && this.joystickThumb) {
          this.joystickBase.setVisible(false);
          this.joystickThumb.setVisible(false);
        }
      }
    });
  }

  private updateJoystick(pointer: Phaser.Input.Pointer) {
    if (!this.joystickBase || !this.joystickThumb) return;

    const deltaX = pointer.x - this.joystickBasePos.x;
    const deltaY = pointer.y - this.joystickBasePos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 60;

    if (distance < maxDistance) {
      this.joystickThumb.setPosition(pointer.x, pointer.y);
    } else {
      const angle = Math.atan2(deltaY, deltaX);
      this.joystickThumb.setPosition(
        this.joystickBasePos.x + Math.cos(angle) * maxDistance,
        this.joystickBasePos.y + Math.sin(angle) * maxDistance
      );
    }

    // Normalize input
    const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
    const angle = Math.atan2(deltaY, deltaX);

    this.currentInput.dx = Math.cos(angle) * normalizedDistance;
    this.currentInput.dy = Math.sin(angle) * normalizedDistance;

    // Convert to -1, 0, 1
    if (Math.abs(this.currentInput.dx) > 0.3) {
      this.currentInput.dx = this.currentInput.dx > 0 ? 1 : -1;
    } else {
      this.currentInput.dx = 0;
    }

    if (Math.abs(this.currentInput.dy) > 0.3) {
      this.currentInput.dy = this.currentInput.dy > 0 ? 1 : -1;
    } else {
      this.currentInput.dy = 0;
    }
  }

  private handleMobileAttack() {
    const player = networkClient.room?.state.players.get(networkClient.sessionId);
    if (!player || player.isDead) return;

    // Find nearest monster
    let nearestMonster: any = null;
    let nearestDistance = Infinity;

    networkClient.room?.state.monsters.forEach((monster: any) => {
      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance && distance < 500) {
        nearestDistance = distance;
        nearestMonster = monster;
      }
    });

    if (nearestMonster) {
      const angle = Math.atan2(nearestMonster.y - player.y, nearestMonster.x - player.x);
      this.currentInput.shooting = true;
      this.currentInput.angle = angle;
    } else {
      // Shoot straight right if no monsters
      this.currentInput.shooting = true;
      this.currentInput.angle = 0;
    }
  }

  private setupNetworkListeners() {
    const room = networkClient.room;
    if (!room) return;

    // Players
    room.state.players.onAdd((player: any, key: string) => {
      this.createPlayer(player, key);

      player.onChange(() => {
        this.updatePlayer(player, key);
      });

      // If this is the local player, follow with camera
      if (key === networkClient.sessionId) {
        this.cameras.main.startFollow(this.playerSprites.get(key)?.container as Phaser.GameObjects.GameObject);
        this.updateUIPlayer(player);
      }
    });

    room.state.players.onRemove((player: any, key: string) => {
      this.removePlayer(key);
    });

    // Monsters
    room.state.monsters.onAdd((monster: any, key: string) => {
      this.createMonster(monster, key);

      monster.onChange(() => {
        this.updateMonster(monster, key);
      });
    });

    room.state.monsters.onRemove((monster: any, key: string) => {
      this.removeMonster(key);
    });

    // Projectiles
    room.state.projectiles.onAdd((projectile: any, key: string) => {
      this.createProjectile(projectile, key);

      projectile.onChange(() => {
        this.updateProjectile(projectile, key);
      });
    });

    room.state.projectiles.onRemove((projectile: any, key: string) => {
      this.removeProjectile(key);
    });

    // Dropped Items
    room.state.droppedItems.onAdd((item: any, key: string) => {
      this.createDroppedItem(item, key);

      item.onChange(() => {
        this.updateDroppedItem(item, key);
      });
    });

    room.state.droppedItems.onRemove((item: any, key: string) => {
      this.removeDroppedItem(key);
    });
  }

  private createPlayer(player: any, key: string) {
    const isLocal = key === networkClient.sessionId;
    const color = isLocal ? 0x00ff00 : 0x006600;

    const rect = this.add.rectangle(0, 0, 30, 30, color);
    rect.setStrokeStyle(2, 0x000000);

    const nameText = this.add.text(0, -30, player.name || 'Player', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 }
    });
    nameText.setOrigin(0.5);

    const hpBg = this.add.graphics();
    hpBg.fillStyle(0x660000, 1);
    hpBg.fillRect(-15, -22, 30, 4);

    const hpBar = this.add.graphics();
    const hpPercent = player.hp / player.maxHp;
    hpBar.fillStyle(0x00ff00, 1);
    hpBar.fillRect(-15, -22, 30 * hpPercent, 4);

    const container = this.add.container(player.x, player.y, [rect, nameText, hpBg, hpBar]);

    this.playerSprites.set(key, { container, rect, nameText, hpBar, hpBg });
  }

  private updatePlayer(player: any, key: string) {
    const sprite = this.playerSprites.get(key);
    if (!sprite) return;

    sprite.container.setPosition(player.x, player.y);

    // Update HP bar
    sprite.hpBar.clear();
    const hpPercent = Math.max(0, player.hp / player.maxHp);
    sprite.hpBar.fillStyle(0x00ff00, 1);
    sprite.hpBar.fillRect(-15, -22, 30 * hpPercent, 4);

    // Update UI if local player
    if (key === networkClient.sessionId) {
      this.updateUIPlayer(player);

      // Handle death
      if (player.isDead && !this.deathText) {
        this.showDeathScreen();
      } else if (!player.isDead && this.deathText) {
        this.hideDeathScreen();
      }
    }
  }

  private removePlayer(key: string) {
    const sprite = this.playerSprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.playerSprites.delete(key);
    }
  }

  private createMonster(monster: any, key: string) {
    const size = monster.size || 20;
    const color = parseInt(monster.color?.replace('#', '0x') || '0xff0000');

    const rect = this.add.rectangle(0, 0, size, size, color);
    rect.setStrokeStyle(2, 0x000000);

    // Add rarity border
    let border: Phaser.GameObjects.Graphics | undefined;
    if (monster.rarity && monster.rarity !== 'normal') {
      border = this.add.graphics();
      const borderColor = monster.rarity === 'magic' ? 0x4444ff : 0xffff00;
      border.lineStyle(3, borderColor, 1);
      border.strokeRect(-size / 2 - 2, -size / 2 - 2, size + 4, size + 4);
    }

    const hpBg = this.add.graphics();
    hpBg.fillStyle(0x660000, 1);
    hpBg.fillRect(-size / 2, -size / 2 - 8, size, 4);

    const hpBar = this.add.graphics();
    const hpPercent = monster.hp / monster.maxHp;
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(-size / 2, -size / 2 - 8, size * hpPercent, 4);

    const children: Phaser.GameObjects.GameObject[] = [rect, hpBg, hpBar];
    if (border) children.push(border);

    const container = this.add.container(monster.x, monster.y, children);

    this.monsterSprites.set(key, { container, rect, hpBar, hpBg, border });
  }

  private updateMonster(monster: any, key: string) {
    const sprite = this.monsterSprites.get(key);
    if (!sprite) return;

    sprite.container.setPosition(monster.x, monster.y);

    // Update HP bar
    const size = monster.size || 20;
    sprite.hpBar.clear();
    const hpPercent = Math.max(0, monster.hp / monster.maxHp);
    sprite.hpBar.fillStyle(0xff0000, 1);
    sprite.hpBar.fillRect(-size / 2, -size / 2 - 8, size * hpPercent, 4);
  }

  private removeMonster(key: string) {
    const sprite = this.monsterSprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.monsterSprites.delete(key);
    }
  }

  private createProjectile(projectile: any, key: string) {
    const arc = this.add.arc(projectile.x, projectile.y, 4, 0, 360, false, 0xffffff);
    this.projectileSprites.set(key, arc);
  }

  private updateProjectile(projectile: any, key: string) {
    const sprite = this.projectileSprites.get(key);
    if (sprite) {
      sprite.setPosition(projectile.x, projectile.y);
    }
  }

  private removeProjectile(key: string) {
    const sprite = this.projectileSprites.get(key);
    if (sprite) {
      sprite.destroy();
      this.projectileSprites.delete(key);
    }
  }

  private createDroppedItem(item: any, key: string) {
    const color = parseInt(item.color?.replace('#', '0x') || '0xffffff');

    const glow = this.add.arc(0, 0, 10, 0, 360, false, color, 0.2);
    const rect = this.add.rectangle(0, 0, 12, 12, color);
    rect.setStrokeStyle(1, 0xffffff);

    const container = this.add.container(item.x, item.y, [glow, rect]);

    this.itemSprites.set(key, { container, rect, glow });

    // Pulse effect
    this.tweens.add({
      targets: glow,
      alpha: 0.5,
      scale: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  private updateDroppedItem(item: any, key: string) {
    const sprite = this.itemSprites.get(key);
    if (sprite) {
      sprite.container.setPosition(item.x, item.y);
    }
  }

  private removeDroppedItem(key: string) {
    const sprite = this.itemSprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.itemSprites.delete(key);
    }
  }

  private showDeathScreen() {
    this.deathText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'YOU DIED',
      {
        fontSize: '64px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    this.deathText.setOrigin(0.5);
    this.deathText.setScrollFactor(0);
    this.deathText.setDepth(2000);
  }

  private hideDeathScreen() {
    if (this.deathText) {
      this.deathText.destroy();
      this.deathText = undefined;
    }
  }

  private updateUIPlayer(player: any) {
    const uiScene = this.scene.get('UIScene') as any;
    if (uiScene && uiScene.events) {
      uiScene.events.emit('updatePlayer', player);
    }
  }

  update() {
    if (!networkClient.room) return;

    const player = networkClient.room.state.players.get(networkClient.sessionId);
    if (!player || player.isDead) {
      // Don't send input if dead
      return;
    }

    // Get keyboard input (if not using mobile controls)
    if (!this.isMobile || !this.joystickActive) {
      this.currentInput.dx = 0;
      this.currentInput.dy = 0;

      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        this.currentInput.dx = -1;
      } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
        this.currentInput.dx = 1;
      }

      if (this.cursors.up.isDown || this.wasd.W.isDown) {
        this.currentInput.dy = -1;
      } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
        this.currentInput.dy = 1;
      }
    }

    // Get mouse angle for shooting (desktop only)
    if (!this.isMobile && this.currentInput.shooting) {
      const worldPoint = this.cameras.main.getWorldPoint(
        this.mousePointer.x,
        this.mousePointer.y
      );
      this.currentInput.angle = Math.atan2(worldPoint.y - player.y, worldPoint.x - player.x);
    }

    // Mobile attack button continuous shooting
    if (this.isMobile && this.attackButtonActive) {
      this.handleMobileAttack();
    }

    // Only send if input changed
    if (
      this.currentInput.dx !== this.lastSentInput.dx ||
      this.currentInput.dy !== this.lastSentInput.dy ||
      this.currentInput.shooting !== this.lastSentInput.shooting ||
      (this.currentInput.shooting && Math.abs(this.currentInput.angle - this.lastSentInput.angle) > 0.01)
    ) {
      networkClient.sendInput(this.currentInput);
      this.lastSentInput = { ...this.currentInput };
    }

    // Update mobile controls position on resize
    if (this.isMobile && this.attackButton) {
      const attackBtnX = this.cameras.main.width - 80;
      const attackBtnY = this.cameras.main.height - 80;
      this.attackButton.setPosition(attackBtnX, attackBtnY);
    }
  }
}
