import Phaser from 'phaser';

export class MapRenderer {
  private gridGraphics!: Phaser.GameObjects.Graphics;

  constructor(private scene: Phaser.Scene) {}

  drawGrid(mapWidth: number, mapHeight: number, gridSize: number): void {
    this.gridGraphics = this.scene.add.graphics();
    this.gridGraphics.lineStyle(1, 0x222222, 1);

    // Vertical lines
    for (let x = 0; x <= mapWidth; x += gridSize) {
      this.gridGraphics.lineBetween(x, 0, x, mapHeight);
    }

    // Horizontal lines
    for (let y = 0; y <= mapHeight; y += gridSize) {
      this.gridGraphics.lineBetween(0, y, mapWidth, y);
    }
  }
}
