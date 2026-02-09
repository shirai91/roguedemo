import Phaser from 'phaser';
import { networkClient } from '../network/Client';

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const GRID_SIZE = 100;

const SKILL_SPRITES: Record<string, string> = {
  fireball: 'flame_0', ice_shard: 'icicle_0', lightning_bolt: 'zap_0',
  poison_arrow: 'poison_arrow_0', crystal_spear: 'crystal_spear_0',
  magic_dart: 'magic_dart_0', iron_shot: 'iron_shot_0', acid_venom: 'acid_venom',
  searing_ray: 'searing_ray_0', holy_arrow: 'arrow_0', sandblast: 'sandblast_0',
  sting: 'sting_0', stone_arrow: 'stone_arrow_0', frost_nova: 'frost_0',
  javelin_throw: 'javelin_0_new', magic_bolt: 'magic_bolt_1',
  divine_judgment: 'goldaura_0', crossbow_bolt: 'crossbow_bolt_0',
  soul_drain: 'drain_0_new', chaos_orb: 'orb_glow_0',
};

interface PlayerSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  hpBg: Phaser.GameObjects.Graphics;
}

interface MonsterSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  hpBar: Phaser.GameObjects.Graphics;
  hpBg: Phaser.GameObjects.Graphics;
  glow?: Phaser.GameObjects.Graphics;
}

interface ItemSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Graphics;
}

interface SkillSprite {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private playerSprites: Map<string, PlayerSprite> = new Map();
  private monsterSprites: Map<string, MonsterSprite> = new Map();
  private projectileSprites: Map<string, Phaser.GameObjects.Arc | Phaser.GameObjects.Image> = new Map();
  private itemSprites: Map<string, ItemSprite> = new Map();
  private droppedSkillSprites: Map<string, SkillSprite> = new Map();

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

  // Menu / pause
  private playerName = 'Anonymous';
  private pauseOverlay?: Phaser.GameObjects.Container;
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Player
    this.load.image('player', 'sprites/player/player.png');

    // Monsters
    const monsterTypes = [
      'slime', 'bat', 'imp', 'spider', 'skeleton', 'goblin', 'wolf',
      'zombie', 'ghost', 'orc', 'wraith', 'harpy', 'troll', 'demon',
      'basilisk', 'minotaur', 'lich', 'drake', 'golem', 'hydra'
    ];
    monsterTypes.forEach(type => {
      this.load.image(`monster_${type}`, `sprites/monsters/${type}.png`);
    });

    // Items
    this.load.image('item_weapon', 'sprites/items/weapon.png');
    this.load.image('item_armor', 'sprites/items/armor.png');
    this.load.image('item_ring', 'sprites/items/ring.png');
    this.load.image('item_amulet', 'sprites/items/amulet.png');
    this.load.image('item_potion', 'sprites/items/potion.png');

    // Dungeon
    this.load.image('floor', 'sprites/dungeon/floor.png');

    // Skill effect sprites
    const skillSprites = [
      'flame_0', 'icicle_0', 'zap_0', 'poison_arrow_0', 'crystal_spear_0',
      'magic_dart_0', 'iron_shot_0', 'acid_venom', 'searing_ray_0', 'arrow_0',
      'sandblast_0', 'sting_0', 'stone_arrow_0', 'frost_0', 'javelin_0_new',
      'magic_bolt_1', 'goldaura_0', 'crossbow_bolt_0', 'drain_0_new', 'orb_glow_0'
    ];
    skillSprites.forEach(name => {
      this.load.image(name, `sprites/${name}.png`);
    });
  }

  async create(data?: { playerName?: string }) {
    this.playerName = data?.playerName || 'Anonymous';

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

    // Dropped Skills
    room.state.droppedSkills.onAdd((skill: any, key: string) => {
      this.createDroppedSkill(skill, key);

      skill.onChange(() => {
        this.updateDroppedSkill(skill, key);
      });
    });

    room.state.droppedSkills.onRemove((skill: any, key: string) => {
      this.removeDroppedSkill(key);
    });
  }

  private createPlayer(player: any, key: string) {
    const isLocal = key === networkClient.sessionId;

    const image = this.add.image(0, 0, 'player');
    image.setScale(30 / 32);
    if (!isLocal) {
      image.setTint(0x88ff88);
      image.setAlpha(0.8);
    }

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

    const container = this.add.container(player.x, player.y, [image, nameText, hpBg, hpBar]);

    this.playerSprites.set(key, { container, image, nameText, hpBar, hpBg });
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
    const scale = size / 32;
    const spriteKey = `monster_${monster.monsterType}`;

    const children: Phaser.GameObjects.GameObject[] = [];

    // Add rarity glow behind sprite
    let glow: Phaser.GameObjects.Graphics | undefined;
    if (monster.rarity === 'magic') {
      glow = this.add.graphics();
      glow.fillStyle(0x4444ff, 0.35);
      glow.fillCircle(0, 0, size / 2 + 6);
      children.push(glow);
      this.tweens.add({ targets: glow, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });
    } else if (monster.rarity === 'rare') {
      glow = this.add.graphics();
      glow.fillStyle(0xffff00, 0.35);
      glow.fillCircle(0, 0, size / 2 + 6);
      children.push(glow);
      this.tweens.add({ targets: glow, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });
    }

    const image = this.add.image(0, 0, spriteKey);
    image.setScale(scale);
    children.push(image);

    // Normal monsters get a subtle white border
    if (!monster.rarity || monster.rarity === 'normal') {
      const border = this.add.graphics();
      border.lineStyle(1, 0xffffff, 0.4);
      border.strokeRect(-size / 2, -size / 2, size, size);
      children.push(border);
    }

    const hpBg = this.add.graphics();
    hpBg.fillStyle(0x660000, 1);
    hpBg.fillRect(-size / 2, -size / 2 - 8, size, 4);

    const hpBar = this.add.graphics();
    const hpPercent = monster.hp / monster.maxHp;
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(-size / 2, -size / 2 - 8, size * hpPercent, 4);

    children.push(hpBg, hpBar);

    const container = this.add.container(monster.x, monster.y, children);

    this.monsterSprites.set(key, { container, image, hpBar, hpBg, glow });
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
    if (projectile.skillId) {
      const spriteKey = SKILL_SPRITES[projectile.skillId];
      if (spriteKey) {
        const img = this.add.image(projectile.x, projectile.y, spriteKey);
        img.setScale(16 / 32);
        img.setRotation(projectile.angle);
        this.projectileSprites.set(key, img);
        return;
      }
    }
    const arc = this.add.arc(projectile.x, projectile.y, 4, 0, 360, false, 0xffffff);
    this.projectileSprites.set(key, arc);
  }

  private updateProjectile(projectile: any, key: string) {
    const sprite = this.projectileSprites.get(key);
    if (sprite) {
      sprite.setPosition(projectile.x, projectile.y);
      if (sprite instanceof Phaser.GameObjects.Image) {
        sprite.setRotation(projectile.angle);
      }
    }
  }

  private removeProjectile(key: string) {
    const sprite = this.projectileSprites.get(key);
    if (sprite) {
      sprite.destroy();
      this.projectileSprites.delete(key);
    }
  }

  private getItemSpriteKey(itemId: string): string {
    if (itemId.includes('sword') || itemId.includes('wand') || itemId.includes('staff')) return 'item_weapon';
    if (itemId.includes('ring')) return 'item_ring';
    if (itemId.includes('amulet')) return 'item_amulet';
    if (itemId.includes('potion')) return 'item_potion';
    return 'item_armor';
  }

  private createDroppedItem(item: any, key: string) {
    const color = parseInt(item.color?.replace('#', '0x') || '0xffffff');
    const spriteKey = this.getItemSpriteKey(item.itemId || '');

    const glow = this.add.graphics();
    glow.fillStyle(color, 0.25);
    glow.fillCircle(0, 0, 14);

    const image = this.add.image(0, 0, spriteKey);
    image.setScale(16 / 32);

    const container = this.add.container(item.x, item.y, [glow, image]);

    this.itemSprites.set(key, { container, image, glow });

    // Pulse effect on glow
    this.tweens.add({
      targets: glow,
      alpha: 0.5,
      scaleX: 1.3,
      scaleY: 1.3,
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

  private createDroppedSkill(skill: any, key: string) {
    const spriteKey = SKILL_SPRITES[skill.skillId] || 'flame_0';

    const glow = this.add.graphics();
    glow.fillStyle(0x00ffff, 0.3);
    glow.fillCircle(0, 0, 16);

    const image = this.add.image(0, 0, spriteKey);
    image.setScale(20 / 32);

    const container = this.add.container(skill.x, skill.y, [glow, image]);

    this.droppedSkillSprites.set(key, { container, image, glow });

    this.tweens.add({
      targets: glow,
      alpha: 0.6,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }

  private updateDroppedSkill(skill: any, key: string) {
    const sprite = this.droppedSkillSprites.get(key);
    if (sprite) {
      sprite.container.setPosition(skill.x, skill.y);
    }
  }

  private removeDroppedSkill(key: string) {
    const sprite = this.droppedSkillSprites.get(key);
    if (sprite) {
      sprite.container.destroy();
      this.droppedSkillSprites.delete(key);
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

  private togglePause() {
    if (this.pauseOverlay) {
      this.hidePause();
    } else {
      this.showPause();
    }
  }

  private showPause() {
    if (this.pauseOverlay) return;
    const { width, height } = this.cameras.main;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    bg.setScrollFactor(0);
    bg.setInteractive(); // block clicks through

    const title = this.add.text(width / 2, height / 2 - 60, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);

    const resumeBtn = this.add.text(width / 2, height / 2 + 10, '[ RESUME ]', {
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
    resumeBtn.on('pointerdown', () => this.hidePause());

    const quitBtn = this.add.text(width / 2, height / 2 + 70, '[ QUIT ]', {
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
    quitBtn.on('pointerdown', () => this.quitToMenu());

    this.pauseOverlay = this.add.container(0, 0, [bg, title, resumeBtn, quitBtn]);
    this.pauseOverlay.setDepth(3000);
    this.pauseOverlay.setScrollFactor(0);
  }

  private hidePause() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = undefined;
    }
  }

  private quitToMenu() {
    this.hidePause();

    // Disconnect from server
    networkClient.disconnect();

    // Remove event listener before stopping UIScene
    const uiScene = this.scene.get('UIScene');
    uiScene.events.off('togglePause', this.togglePause, this);

    // Stop UIScene
    this.scene.stop('UIScene');

    // Clean up sprites
    this.playerSprites.forEach(s => s.container.destroy());
    this.playerSprites.clear();
    this.monsterSprites.forEach(s => s.container.destroy());
    this.monsterSprites.clear();
    this.projectileSprites.forEach(s => s.destroy());
    this.projectileSprites.clear();
    this.itemSprites.forEach(s => s.container.destroy());
    this.itemSprites.clear();
    this.droppedSkillSprites.forEach(s => s.container.destroy());
    this.droppedSkillSprites.clear();

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
