import Phaser from 'phaser';
import { networkClient } from '../network/Client';

export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpBg!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;

  private xpBar!: Phaser.GameObjects.Graphics;
  private xpBg!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;

  private statsText!: Phaser.GameObjects.Text;
  private playerCountText!: Phaser.GameObjects.Text;

  private equipmentSlots: Phaser.GameObjects.Container[] = [];
  private equipmentItems: (Phaser.GameObjects.Rectangle | null)[] = [];

  private inventoryContainer!: Phaser.GameObjects.Container;
  private inventoryVisible = false;
  private inventorySlots: Phaser.GameObjects.Container[] = [];
  private inventoryKey!: Phaser.Input.Keyboard.Key;

  private nearbyItemText!: Phaser.GameObjects.Text;
  private pickupKey!: Phaser.Input.Keyboard.Key;
  private nearestItem: { instanceId: string; name: string; distance: number } | null = null;

  private deathOverlay?: Phaser.GameObjects.Container;

  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapBg!: Phaser.GameObjects.Rectangle;
  private minimapGraphics!: Phaser.GameObjects.Graphics;

  private playerData: any = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Setup input
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.pickupKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Create UI elements
    this.createHPBar();
    this.createXPBar();
    this.createStatsPanel();
    this.createEquipmentPanel();
    this.createInventoryPanel();
    this.createNearbyItemIndicator();
    this.createPlayerCount();
    this.createMinimap();

    // Listen for player updates from GameScene
    this.events.on('updatePlayer', this.handlePlayerUpdate, this);

    // Listen for keyboard input
    this.inventoryKey.on('down', () => {
      this.toggleInventory();
    });

    this.pickupKey.on('down', () => {
      if (this.nearestItem) {
        networkClient.sendPickup(this.nearestItem.instanceId);
      }
    });

    // Handle resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createHPBar() {
    const x = 20;
    const y = 20;
    const width = 200;
    const height = 20;

    this.hpBg = this.add.graphics();
    this.hpBg.fillStyle(0x660000, 1);
    this.hpBg.fillRect(x, y, width, height);

    this.hpBar = this.add.graphics();
    this.hpBar.fillStyle(0x00ff00, 1);
    this.hpBar.fillRect(x, y, width, height);

    this.hpText = this.add.text(x + width / 2, y + height / 2, 'HP: 100/100', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.hpText.setOrigin(0.5);
  }

  private createXPBar() {
    const x = 20;
    const y = 50;
    const width = 200;
    const height = 15;

    this.xpBg = this.add.graphics();
    this.xpBg.fillStyle(0x333333, 1);
    this.xpBg.fillRect(x, y, width, height);

    this.xpBar = this.add.graphics();
    this.xpBar.fillStyle(0x3333ff, 1);
    this.xpBar.fillRect(x, y, width * 0.5, height);

    this.xpText = this.add.text(x + width / 2, y + height / 2, 'Level 1 (0/100)', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.xpText.setOrigin(0.5);
  }

  private createStatsPanel() {
    this.statsText = this.add.text(20, 75, '', {
      fontSize: '11px',
      color: '#cccccc',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 }
    });
  }

  private createEquipmentPanel() {
    const startX = 20;
    const startY = this.scale.height - 80;
    const slotSize = 40;
    const gap = 5;

    for (let i = 0; i < 6; i++) {
      const x = startX + i * (slotSize + gap);
      const y = startY;

      const slotBg = this.add.rectangle(0, 0, slotSize, slotSize, 0x333333);
      slotBg.setStrokeStyle(2, 0x666666);

      const slotText = this.add.text(0, slotSize / 2 + 8, `${i + 1}`, {
        fontSize: '10px',
        color: '#888888'
      });
      slotText.setOrigin(0.5);

      const container = this.add.container(x, y, [slotBg, slotText]);
      container.setSize(slotSize, slotSize);
      container.setInteractive();

      container.on('pointerdown', () => {
        this.handleUnequip(i);
      });

      this.equipmentSlots.push(container);
      this.equipmentItems.push(null);
    }
  }

  private createInventoryPanel() {
    const width = 300;
    const height = 400;
    const x = this.scale.width / 2;
    const y = this.scale.height / 2;

    const bg = this.add.rectangle(0, 0, width, height, 0x222222, 0.95);
    bg.setStrokeStyle(2, 0x666666);

    const title = this.add.text(0, -height / 2 + 20, 'INVENTORY (I)', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const closeBtn = this.add.text(width / 2 - 20, -height / 2 + 20, 'X', {
      fontSize: '18px',
      color: '#ff0000',
      fontStyle: 'bold'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      this.toggleInventory();
    });

    const children: Phaser.GameObjects.GameObject[] = [bg, title, closeBtn];

    // Create inventory slots (5x4 grid = 20 slots)
    const slotSize = 50;
    const gap = 5;
    const cols = 5;
    const rows = 4;
    const gridWidth = cols * slotSize + (cols - 1) * gap;
    const gridHeight = rows * slotSize + (rows - 1) * gap;
    const startX = -gridWidth / 2 + slotSize / 2;
    const startY = -height / 2 + 60;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const slotX = startX + col * (slotSize + gap);
        const slotY = startY + row * (slotSize + gap);

        const slotBg = this.add.rectangle(0, 0, slotSize, slotSize, 0x444444);
        slotBg.setStrokeStyle(2, 0x666666);

        const slotContainer = this.add.container(slotX, slotY, [slotBg]);
        slotContainer.setSize(slotSize, slotSize);
        slotContainer.setInteractive();

        const index = row * cols + col;
        slotContainer.setData('index', index);

        slotContainer.on('pointerdown', () => {
          this.handleInventoryClick(index);
        });

        this.inventorySlots.push(slotContainer);
        children.push(slotContainer);
      }
    }

    this.inventoryContainer = this.add.container(x, y, children);
    this.inventoryContainer.setDepth(500);
    this.inventoryContainer.setVisible(false);
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
    const hpPercent = Math.max(0, player.hp / player.maxHp);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x00ff00, 1);
    this.hpBar.fillRect(20, 20, 200 * hpPercent, 20);
    this.hpText.setText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`);

    // Update XP bar
    const xpPercent = player.xpToNext > 0 ? player.xp / player.xpToNext : 1;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x3333ff, 1);
    this.xpBar.fillRect(20, 50, 200 * xpPercent, 15);
    this.xpText.setText(`Level ${player.level} (${player.xp}/${player.xpToNext})`);

    // Update stats from player schema properties
    const statsText = [
      `ATK: ${Math.round(player.rawAttack || 0)}  SPELL: ${Math.round(player.rawSpell || 0)}`,
      `ARM: ${Math.round(player.armour || 0)}  MRES: ${Math.round(player.magicRes || 0)}`,
      `SPD: ${Math.round(player.moveSpeed || 0)}  ASPD: ${(player.attackSpeed || 0).toFixed(2)}`
    ].join('\n');
    this.statsText.setText(statsText);

    // Update equipment
    this.updateEquipment(player.equipment || []);

    // Update inventory
    this.updateInventory(player.inventory || []);

    // Check for death
    if (player.isDead && !this.deathOverlay) {
      this.showDeathOverlay();
    } else if (!player.isDead && this.deathOverlay) {
      this.hideDeathOverlay();
    }
  }

  private updateEquipment(equipment: any[]) {
    for (let i = 0; i < 6; i++) {
      const slot = this.equipmentSlots[i];
      const item = equipment[i];

      // Remove old item visual
      if (this.equipmentItems[i]) {
        this.equipmentItems[i]?.destroy();
        this.equipmentItems[i] = null;
      }

      // Add new item visual (check itemId to distinguish from empty placeholder)
      if (item && item.itemId) {
        const color = parseInt((item.color || '#ffffff').replace('#', '0x'));
        const itemRect = this.add.rectangle(0, -5, 30, 30, color);
        itemRect.setStrokeStyle(1, 0xffffff);

        slot.add(itemRect);
        this.equipmentItems[i] = itemRect;
      }
    }
  }

  private updateInventory(inventory: any[]) {
    this.inventorySlots.forEach((slot, index) => {
      // Clear existing item visuals
      const children = slot.getAll();
      children.forEach((child, i) => {
        if (i > 0) child.destroy(); // Keep the background
      });

      // Add new item visual
      const item = inventory[index];
      if (item && item.itemId) {
        const color = parseInt((item.color || '#ffffff').replace('#', '0x'));
        const itemRect = this.add.rectangle(0, 0, 40, 40, color);
        itemRect.setStrokeStyle(2, 0xffffff);

        // Tier indicator
        const tierText = this.add.text(15, 15, `T${item.tier || 1}`, {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#000000'
        });
        tierText.setOrigin(1, 1);

        slot.add([itemRect, tierText]);
      }
    });
  }

  private handleUnequip(slotIndex: number) {
    networkClient.sendUnequip(slotIndex);
  }

  private handleInventoryClick(inventoryIndex: number) {
    if (!this.playerData) return;

    const inventory = this.playerData.inventory || [];
    if (!inventory[inventoryIndex]) return;

    // Find first empty equipment slot
    const equipment = this.playerData.equipment || [];
    for (let i = 0; i < 6; i++) {
      if (!equipment[i]) {
        networkClient.sendEquip(inventoryIndex, i);
        return;
      }
    }

    // If all slots full, replace slot 0
    networkClient.sendEquip(inventoryIndex, 0);
  }

  private toggleInventory() {
    this.inventoryVisible = !this.inventoryVisible;
    this.inventoryContainer.setVisible(this.inventoryVisible);
  }

  private showDeathOverlay() {
    const bg = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    );

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'YOU DIED\nRespawning...',
      {
        fontSize: '48px',
        color: '#ff0000',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    text.setOrigin(0.5);

    this.deathOverlay = this.add.container(0, 0, [bg, text]);
    this.deathOverlay.setDepth(1000);
  }

  private hideDeathOverlay() {
    if (this.deathOverlay) {
      this.deathOverlay.destroy();
      this.deathOverlay = undefined;
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    // Update player count position
    this.playerCountText.setPosition(gameSize.width - 20, 20);

    // Update equipment panel position
    const startY = gameSize.height - 80;
    this.equipmentSlots.forEach((slot, i) => {
      slot.setY(startY);
    });

    // Update inventory position
    this.inventoryContainer.setPosition(gameSize.width / 2, gameSize.height / 2);

    // Update nearby item text position
    this.nearbyItemText.setPosition(gameSize.width / 2, gameSize.height - 120);

    // Update minimap position
    this.minimapContainer.setPosition(gameSize.width - 95, gameSize.height - 95);

    // Update death overlay if visible
    if (this.deathOverlay) {
      const bg = this.deathOverlay.getAt(0) as Phaser.GameObjects.Rectangle;
      const text = this.deathOverlay.getAt(1) as Phaser.GameObjects.Text;
      bg.setSize(gameSize.width, gameSize.height);
      bg.setPosition(gameSize.width / 2, gameSize.height / 2);
      text.setPosition(gameSize.width / 2, gameSize.height / 2);
    }
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
