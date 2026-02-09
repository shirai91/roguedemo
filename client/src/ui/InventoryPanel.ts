import Phaser from 'phaser';
import { networkClient } from '../network/Client';
import { getItemSpriteKey } from '../data/sprites';

export class InventoryPanel {
  private inventoryContainer!: Phaser.GameObjects.Container;
  private inventoryVisible = false;
  private inventorySlots: Phaser.GameObjects.Container[] = [];
  private equipmentSlots: Phaser.GameObjects.Container[] = [];
  private equipmentItems: (Phaser.GameObjects.Image | null)[] = [];
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private playerData: any = null;

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    this.inventoryKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.inventoryKey.on('down', () => {
      this.toggle();
    });

    this.createEquipmentPanel();
    this.createInventoryPanel();
  }

  private createEquipmentPanel(): void {
    const startX = 20;
    const startY = this.scene.scale.height - 80;
    const slotSize = 40;
    const gap = 5;

    for (let i = 0; i < 6; i++) {
      const x = startX + i * (slotSize + gap);
      const y = startY;

      const slotBg = this.scene.add.rectangle(0, 0, slotSize, slotSize, 0x333333);
      slotBg.setStrokeStyle(2, 0x666666);

      const slotText = this.scene.add.text(0, slotSize / 2 + 8, `${i + 1}`, {
        fontSize: '10px',
        color: '#888888'
      });
      slotText.setOrigin(0.5);

      const container = this.scene.add.container(x, y, [slotBg, slotText]);
      container.setSize(slotSize, slotSize);
      container.setInteractive();

      container.on('pointerdown', () => {
        this.handleUnequip(i);
      });

      this.equipmentSlots.push(container);
      this.equipmentItems.push(null);
    }
  }

  private createInventoryPanel(): void {
    const width = 300;
    const height = 400;
    const x = this.scene.scale.width / 2;
    const y = this.scene.scale.height / 2;

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x222222, 0.95);
    bg.setStrokeStyle(2, 0x666666);

    const title = this.scene.add.text(0, -height / 2 + 20, 'INVENTORY (I)', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const closeBtn = this.scene.add.text(width / 2 - 20, -height / 2 + 20, 'X', {
      fontSize: '18px',
      color: '#ff0000',
      fontStyle: 'bold'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      this.toggle();
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

        const slotBg = this.scene.add.rectangle(0, 0, slotSize, slotSize, 0x444444);
        slotBg.setStrokeStyle(2, 0x666666);

        const slotContainer = this.scene.add.container(slotX, slotY, [slotBg]);
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

    this.inventoryContainer = this.scene.add.container(x, y, children);
    this.inventoryContainer.setDepth(500);
    this.inventoryContainer.setVisible(false);
  }

  toggle(): void {
    this.inventoryVisible = !this.inventoryVisible;
    this.inventoryContainer.setVisible(this.inventoryVisible);
  }

  updateEquipment(equipment: any[]): void {
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
        const spriteKey = getItemSpriteKey(item.itemId);
        const itemImage = this.scene.add.image(0, -5, spriteKey);
        itemImage.setScale(30 / 32);

        slot.add(itemImage);
        this.equipmentItems[i] = itemImage;
      }
    }
  }

  updateInventory(inventory: any[]): void {
    this.inventorySlots.forEach((slot, index) => {
      // Clear existing item visuals
      const children = slot.getAll();
      children.forEach((child, i) => {
        if (i > 0) child.destroy(); // Keep the background
      });

      // Add new item visual
      const item = inventory[index];
      if (item && item.itemId) {
        const spriteKey = getItemSpriteKey(item.itemId);
        const itemImage = this.scene.add.image(0, 0, spriteKey);
        itemImage.setScale(40 / 32);

        // Tier indicator
        const tierText = this.scene.add.text(15, 15, `T${item.tier || 1}`, {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#000000'
        });
        tierText.setOrigin(1, 1);

        slot.add([itemImage, tierText]);
      }
    });
  }

  handleResize(width: number, height: number): void {
    // Update equipment panel position
    const startY = height - 80;
    this.equipmentSlots.forEach((slot, i) => {
      slot.setY(startY);
    });

    // Update inventory position
    this.inventoryContainer.setPosition(width / 2, height / 2);
  }

  setPlayerData(player: any): void {
    this.playerData = player;
  }

  private handleUnequip(slotIndex: number): void {
    networkClient.sendUnequip(slotIndex);
  }

  private handleInventoryClick(inventoryIndex: number): void {
    if (!this.playerData) return;

    const inventory = this.playerData.inventory || [];
    if (!inventory[inventoryIndex]) return;

    // Find first empty equipment slot
    const equipment = this.playerData.equipment || [];
    for (let i = 0; i < 6; i++) {
      if (!equipment[i] || !equipment[i].itemId) {
        networkClient.sendEquip(inventoryIndex, i);
        return;
      }
    }

    // If all slots full, replace slot 0
    networkClient.sendEquip(inventoryIndex, 0);
  }
}
