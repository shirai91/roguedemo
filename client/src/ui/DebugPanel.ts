import Phaser from 'phaser';

export class DebugPanel {
  private scene: Phaser.Scene;
  private bg!: Phaser.GameObjects.Rectangle;
  private text!: Phaser.GameObjects.Text;
  private timer!: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    const { width } = this.scene.scale;

    this.text = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      padding: { x: 4, y: 4 },
    }).setDepth(1000);

    this.bg = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setDepth(999);

    this.timer = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: this.refresh,
      callbackScope: this,
    });

    this.refresh();
    this.reposition();
  }

  private refresh() {
    const game = this.scene.game;
    const fps = Math.round(game.loop.actualFps);
    const frameTime = (1000 / game.loop.actualFps).toFixed(1);

    let lines = `FPS: ${fps}\nFrame: ${frameTime}ms`;

    const perf = performance as any;
    if (perf.memory) {
      const heapMB = (perf.memory.usedJSHeapSize / 1048576).toFixed(1);
      lines += `\nHeap: ${heapMB}MB`;
    }

    this.text.setText(lines);
    this.bg.setSize(this.text.width + 8, this.text.height + 8);
  }

  reposition() {
    const { width } = this.scene.scale;
    const x = width - this.text.width - 12;
    this.text.setPosition(x, 4);
    this.bg.setPosition(x - 4, 0);
  }

  destroy() {
    this.timer?.destroy();
    this.text?.destroy();
    this.bg?.destroy();
  }
}
