import Phaser from 'phaser';

export class HpBar {
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpBg!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpBg!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private lastHp = -1;
  private lastMaxHp = -1;
  private lastLevel = -1;
  private lastXp = -1;
  private lastXpToNext = -1;

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    // HP Bar
    const hpX = 20;
    const hpY = 20;
    const hpWidth = 200;
    const hpHeight = 20;

    this.hpBg = this.scene.add.graphics();
    this.hpBg.fillStyle(0x660000, 1);
    this.hpBg.fillRect(hpX, hpY, hpWidth, hpHeight);

    this.hpBar = this.scene.add.graphics();
    this.hpBar.fillStyle(0x00ff00, 1);
    this.hpBar.fillRect(hpX, hpY, hpWidth, hpHeight);

    this.hpText = this.scene.add.text(hpX + hpWidth / 2, hpY + hpHeight / 2, 'HP: 100/100', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.hpText.setOrigin(0.5);

    // XP Bar
    const xpX = 20;
    const xpY = 50;
    const xpWidth = 200;
    const xpHeight = 15;

    this.xpBg = this.scene.add.graphics();
    this.xpBg.fillStyle(0x333333, 1);
    this.xpBg.fillRect(xpX, xpY, xpWidth, xpHeight);

    this.xpBar = this.scene.add.graphics();
    this.xpBar.fillStyle(0x3333ff, 1);
    this.xpBar.fillRect(xpX, xpY, xpWidth * 0.5, xpHeight);

    this.xpText = this.scene.add.text(xpX + xpWidth / 2, xpY + xpHeight / 2, 'Level 1 (0/100)', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.xpText.setOrigin(0.5);

    // Stats Panel
    this.statsText = this.scene.add.text(20, 75, '', {
      fontSize: '11px',
      color: '#cccccc',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 }
    });
  }

  updateHp(hp: number, maxHp: number): void {
    if (hp === this.lastHp && maxHp === this.lastMaxHp) return;
    this.lastHp = hp;
    this.lastMaxHp = maxHp;
    const hpPercent = Math.max(0, hp / maxHp);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x00ff00, 1);
    this.hpBar.fillRect(20, 20, 200 * hpPercent, 20);
    this.hpText.setText(`HP: ${Math.ceil(hp)}/${maxHp}`);
  }

  updateXp(level: number, xp: number, xpToNext: number): void {
    if (level === this.lastLevel && xp === this.lastXp && xpToNext === this.lastXpToNext) return;
    this.lastLevel = level;
    this.lastXp = xp;
    this.lastXpToNext = xpToNext;
    const xpPercent = xpToNext > 0 ? xp / xpToNext : 1;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x3333ff, 1);
    this.xpBar.fillRect(20, 50, 200 * xpPercent, 15);
    this.xpText.setText(`Level ${level} (${xp}/${xpToNext})`);
  }

  updateStats(player: any): void {
    const statsText = [
      `ATK: ${Math.round(player.rawAttack || 0)}  SPELL: ${Math.round(player.rawSpell || 0)}`,
      `ARM: ${Math.round(player.armour || 0)}  MRES: ${Math.round(player.magicRes || 0)}`,
      `SPD: ${Math.round(player.moveSpeed || 0)}  ASPD: ${(player.attackSpeed || 0).toFixed(2)}`
    ].join('\n');
    this.statsText.setText(statsText);
  }
}
