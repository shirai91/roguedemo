import Phaser from 'phaser';
import { networkClient } from '../network/Client';
import { MAP_WIDTH, MAP_HEIGHT, GRID_SIZE, preloadAssets } from '../data/sprites';
import { PlayerRenderer } from '../renderers/PlayerRenderer';
import { MonsterRenderer } from '../renderers/MonsterRenderer';
import { ProjectileRenderer } from '../renderers/ProjectileRenderer';
import { ItemRenderer } from '../renderers/ItemRenderer';
import { MapRenderer } from '../renderers/MapRenderer';
import { PauseOverlay } from '../ui/PauseOverlay';

export class GameScene extends Phaser.Scene {
  private playerRenderer!: PlayerRenderer;
  private monsterRenderer!: MonsterRenderer;
  private projectileRenderer!: ProjectileRenderer;
  private itemRenderer!: ItemRenderer;
  private mapRenderer!: MapRenderer;
  private pauseOverlay!: PauseOverlay;

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

  // Menu / pause
  private playerName = 'Anonymous';
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    preloadAssets(this);
  }

  async create(data?: { playerName?: string }) {
    this.playerName = data?.playerName || 'Anonymous';

    // Detect mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Create renderers
    this.mapRenderer = new MapRenderer(this);
    this.playerRenderer = new PlayerRenderer(this);
    this.monsterRenderer = new MonsterRenderer(this);
    this.projectileRenderer = new ProjectileRenderer(this);
    this.itemRenderer = new ItemRenderer(this);

    // Create pause overlay
    this.pauseOverlay = new PauseOverlay(this, () => this.quitToMenu());

    // Draw grid
    this.mapRenderer.drawGrid(MAP_WIDTH, MAP_HEIGHT, GRID_SIZE);

    // Setup input
    this.setupInput();

    // Setup camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setZoom(1);

    // Connect to server with player name
    try {
      await networkClient.connect(this.playerName);
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

    // Setup ESC key for pause
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => {
      this.togglePause();
    });

    // Listen for pause toggle from UIScene menu icon
    const uiScene = this.scene.get('UIScene');
    uiScene.events.on('togglePause', this.togglePause, this);

    // Setup mobile controls if needed
    if (this.isMobile) {
      this.setupMobileControls();
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
      const isLocal = key === networkClient.sessionId;
      this.playerRenderer.create(player, key, isLocal);

      player.onChange(() => {
        this.playerRenderer.update(player, key);

        // Update UI if local player
        if (isLocal) {
          this.updateUIPlayer(player);

          // Handle death
          if (player.isDead && !this.deathText) {
            this.showDeathScreen();
          } else if (!player.isDead && this.deathText) {
            this.hideDeathScreen();
          }
        }
      });

      // If this is the local player, follow with camera
      if (isLocal) {
        this.cameras.main.startFollow(this.playerRenderer.getContainer(key) as Phaser.GameObjects.GameObject);
        this.updateUIPlayer(player);
      }
    });

    room.state.players.onRemove((player: any, key: string) => {
      this.playerRenderer.remove(key);
    });

    // Monsters
    room.state.monsters.onAdd((monster: any, key: string) => {
      this.monsterRenderer.create(monster, key);

      monster.onChange(() => {
        this.monsterRenderer.update(monster, key);
      });
    });

    room.state.monsters.onRemove((monster: any, key: string) => {
      this.monsterRenderer.remove(key);
    });

    // Projectiles
    room.state.projectiles.onAdd((projectile: any, key: string) => {
      this.projectileRenderer.create(projectile, key);

      projectile.onChange(() => {
        this.projectileRenderer.update(projectile, key);
      });
    });

    room.state.projectiles.onRemove((projectile: any, key: string) => {
      this.projectileRenderer.remove(key);
    });

    // Dropped Items
    room.state.droppedItems.onAdd((item: any, key: string) => {
      this.itemRenderer.createItem(item, key);

      item.onChange(() => {
        this.itemRenderer.updateItem(item, key);
      });
    });

    room.state.droppedItems.onRemove((item: any, key: string) => {
      this.itemRenderer.removeItem(key);
    });

    // Dropped Skills
    room.state.droppedSkills.onAdd((skill: any, key: string) => {
      this.itemRenderer.createSkill(skill, key);

      skill.onChange(() => {
        this.itemRenderer.updateSkill(skill, key);
      });
    });

    room.state.droppedSkills.onRemove((skill: any, key: string) => {
      this.itemRenderer.removeSkill(key);
    });
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

  private togglePause() {
    this.pauseOverlay.toggle();
  }

  private quitToMenu() {
    this.pauseOverlay.hide();

    // Disconnect from server
    networkClient.disconnect();

    // Remove event listener before stopping UIScene
    const uiScene = this.scene.get('UIScene');
    uiScene.events.off('togglePause', this.togglePause, this);

    // Stop UIScene
    this.scene.stop('UIScene');

    // Clean up renderers
    this.playerRenderer.destroyAll();
    this.monsterRenderer.destroyAll();
    this.projectileRenderer.destroyAll();
    this.itemRenderer.destroyAll();

    // Go back to menu
    this.scene.start('MenuScene');
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
