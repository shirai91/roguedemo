import Phaser from 'phaser';
import { networkClient } from '../network/Client';
import { HpBar } from '../ui/HpBar';
import { InventoryPanel } from '../ui/InventoryPanel';
import { SkillBar } from '../ui/SkillBar';
import { DeathOverlay } from '../ui/DeathOverlay';
import { MenuIcon } from '../ui/MenuIcon';

export class UIScene extends Phaser.Scene {
  private hpBar!: HpBar;
  private inventoryPanel!: InventoryPanel;
  private skillBar!: SkillBar;
  private deathOverlay!: DeathOverlay;
  private menuIcon!: MenuIcon;

  private playerCountText!: Phaser.GameObjects.Text;
  private nearbyItemText!: Phaser.GameObjects.Text;
  private pickupKey!: Phaser.Input.Keyboard.Key;
  private nearestItem: { instanceId: string; name: string; distance: number } | null = null;

  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapBg!: Phaser.GameObjects.Rectangle;
  private minimapGraphics!: Phaser.GameObjects.Graphics;

  private playerData: any = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Setup input
    this.pickupKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Create UI components
    this.hpBar = new HpBar(this);
    this.hpBar.create();

    this.inventoryPanel = new InventoryPanel(this);
    this.inventoryPanel.create();

    this.skillBar = new SkillBar(this);
    this.skillBar.create();

    this.deathOverlay = new DeathOverlay(this);

    this.menuIcon = new MenuIcon(this);
    this.menuIcon.create();

    this.createNearbyItemIndicator();
    this.createPlayerCount();
    this.createMinimap();

    // Listen for player updates from GameScene
    this.events.on('updatePlayer', this.handlePlayerUpdate, this);

    // Listen for keyboard input
    this.pickupKey.on('down', () => {
      if (this.nearestItem) {
        networkClient.sendPickup(this.nearestItem.instanceId);
      }
    });

    // Handle resize
    this.scale.on('resize', this.handleResize, this);

    // Clean up when stopped
    this.events.on('shutdown', this.cleanup, this);
  }

  private cleanup() {
    this.events.off('updatePlayer', this.handlePlayerUpdate, this);
    this.scale.off('resize', this.handleResize, this);
    this.events.off('shutdown', this.cleanup, this);
    this.playerData = null;
    this.nearestItem = null;
  }

  private createNearbyItemIndicator() {
    this.nearbyItemText = this.add.text(
      this.scale.width / 2,
      this.scale.height - 120,
      '',
      {
        fontSize: '16px',
        color: '#ffff00',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    );
    this.nearbyItemText.setOrigin(0.5);
    this.nearbyItemText.setVisible(false);
    this.nearbyItemText.setInteractive();
    this.nearbyItemText.on('pointerdown', () => {
      if (this.nearestItem) {
        networkClient.sendPickup(this.nearestItem.instanceId);
      }
    });
  }

  private createPlayerCount() {
    this.playerCountText = this.add.text(this.scale.width - 20, 20, 'Players: 0', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 }
    });
    this.playerCountText.setOrigin(1, 0);
  }

  private createMinimap() {
    const size = 150;
    const x = this.scale.width - size / 2 - 20;
    const y = this.scale.height - size / 2 - 20;

    this.minimapBg = this.add.rectangle(0, 0, size, size, 0x000000, 0.5);
    this.minimapBg.setStrokeStyle(2, 0x666666);

    this.minimapGraphics = this.add.graphics();

    this.minimapContainer = this.add.container(x, y, [this.minimapBg, this.minimapGraphics]);
  }

  private handlePlayerUpdate(player: any) {
    this.playerData = player;

    // Update HP bar
    this.hpBar.updateHp(player.hp, player.maxHp);

    // Update XP bar
    this.hpBar.updateXp(player.level, player.xp, player.xpToNext);

    // Update stats
    this.hpBar.updateStats(player);

    // Update equipment
    this.inventoryPanel.updateEquipment(player.equipment || []);

    // Update inventory
    this.inventoryPanel.updateInventory(player.inventory || []);

    // Update player data for inventory panel click handling
    this.inventoryPanel.setPlayerData(player);

    // Update skills
    this.skillBar.updateSkills(player.skills || [], player.skillPoints || 0);

    // Check for death
    if (player.isDead && !this.deathOverlay.isVisible) {
      this.deathOverlay.show();
    } else if (!player.isDead && this.deathOverlay.isVisible) {
      this.deathOverlay.hide();
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    // Update menu icon position
    this.menuIcon.handleResize(gameSize.width, gameSize.height);

    // Update player count position
    this.playerCountText.setPosition(gameSize.width - 20, 20);

    // Update inventory panel
    this.inventoryPanel.handleResize(gameSize.width, gameSize.height);

    // Update nearby item text position
    this.nearbyItemText.setPosition(gameSize.width / 2, gameSize.height - 120);

    // Update minimap position
    this.minimapContainer.setPosition(gameSize.width - 95, gameSize.height - 95);

    // Update skill bar position
    this.skillBar.handleResize(gameSize.width, gameSize.height);

    // Update death overlay if visible
    this.deathOverlay.handleResize(gameSize.width, gameSize.height);
  }

  update() {
    if (!networkClient.room) return;

    // Update player count
    const playerCount = networkClient.room.state.players.size;
    this.playerCountText.setText(`Players: ${playerCount}`);

    // Check for nearby items
    const player = networkClient.room.state.players.get(networkClient.sessionId);
    if (player && !player.isDead) {
      this.checkNearbyItems(player);
    } else {
      this.nearbyItemText.setVisible(false);
      this.nearestItem = null;
    }

    // Update minimap
    this.updateMinimap(player);
  }

  private checkNearbyItems(player: any) {
    let nearest: { instanceId: string; name: string; distance: number } | null = null;
    let nearestDistance = Infinity;

    networkClient.room?.state.droppedItems.forEach((item: any, key: string) => {
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 80 && distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          instanceId: key,
          name: item.name || 'Item',
          distance
        };
      }
    });

    if (nearest) {
      this.nearestItem = nearest;
      this.nearbyItemText.setText(`[E] Pick up: ${(nearest as any).name}`);
      this.nearbyItemText.setVisible(true);
    } else {
      this.nearestItem = null;
      this.nearbyItemText.setVisible(false);
    }
  }

  private updateMinimap(player: any) {
    if (!player) return;

    this.minimapGraphics.clear();

    const size = 150;
    const mapScale = size / 3000; // MAP is 3000x3000

    // Draw players (green)
    networkClient.room?.state.players.forEach((p: any, key: string) => {
      const x = (p.x - 1500) * mapScale;
      const y = (p.y - 1500) * mapScale;

      if (key === networkClient.sessionId) {
        // Local player (white)
        this.minimapGraphics.fillStyle(0xffffff, 1);
      } else {
        // Other players (green)
        this.minimapGraphics.fillStyle(0x00ff00, 1);
      }

      this.minimapGraphics.fillCircle(x, y, 2);
    });

    // Draw monsters (red)
    this.minimapGraphics.fillStyle(0xff0000, 1);
    networkClient.room?.state.monsters.forEach((monster: any) => {
      const x = (monster.x - 1500) * mapScale;
      const y = (monster.y - 1500) * mapScale;
      this.minimapGraphics.fillCircle(x, y, 1.5);
    });
  }
}
