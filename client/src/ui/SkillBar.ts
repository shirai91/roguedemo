import Phaser from 'phaser';
import { networkClient } from '../network/Client';
import { SKILL_SPRITES, SKILL_NAMES } from '../data/sprites';

export class SkillBar {
  private skillBarContainer!: Phaser.GameObjects.Container;
  private skillSlots: Phaser.GameObjects.Container[] = [];
  private skillPointsText!: Phaser.GameObjects.Text;
  private lastSkillPoints = -1;
  private lastSkillState: string[] = [];

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    const slotSize = 48;
    const gap = 4;
    const totalWidth = 5 * slotSize + 4 * gap;
    const startX = this.scene.scale.width / 2 - totalWidth / 2 + slotSize / 2;
    const y = this.scene.scale.height - 50;

    // Skill points label
    this.skillPointsText = this.scene.add.text(this.scene.scale.width / 2, y - slotSize / 2 - 14, 'SP: 0', {
      fontSize: '12px',
      color: '#00ffff',
      fontStyle: 'bold'
    });
    this.skillPointsText.setOrigin(0.5);

    for (let i = 0; i < 5; i++) {
      const x = startX + i * (slotSize + gap);

      const slotBg = this.scene.add.rectangle(0, 0, slotSize, slotSize, 0x1a1a2e);
      slotBg.setStrokeStyle(2, 0x00aaaa);

      const slotLabel = this.scene.add.text(0, slotSize / 2 + 10, '', {
        fontSize: '9px',
        color: '#aaaaaa'
      });
      slotLabel.setOrigin(0.5);

      const levelText = this.scene.add.text(slotSize / 2 - 2, -slotSize / 2 + 2, '', {
        fontSize: '10px',
        color: '#ffff00',
        fontStyle: 'bold'
      });
      levelText.setOrigin(1, 0);

      // "+" button for leveling
      const plusBg = this.scene.add.rectangle(slotSize / 2 - 2, slotSize / 2 - 2, 16, 16, 0x006600);
      plusBg.setStrokeStyle(1, 0x00ff00);
      plusBg.setInteractive();
      plusBg.setVisible(false);

      const plusText = this.scene.add.text(slotSize / 2 - 2, slotSize / 2 - 2, '+', {
        fontSize: '12px',
        color: '#00ff00',
        fontStyle: 'bold'
      });
      plusText.setOrigin(0.5);
      plusText.setVisible(false);

      const slotIndex = i;
      plusBg.on('pointerdown', () => {
        networkClient.sendLevelSkill(slotIndex);
      });

      const container = this.scene.add.container(x, y, [slotBg, slotLabel, levelText, plusBg, plusText]);
      container.setSize(slotSize, slotSize);

      this.skillSlots.push(container);
    }
  }

  updateSkills(skills: any[], skillPoints: number): void {
    if (skillPoints !== this.lastSkillPoints) {
      this.lastSkillPoints = skillPoints;
      this.skillPointsText.setText(`SP: ${skillPoints}`);
    }

    for (let i = 0; i < 5; i++) {
      const slot = this.skillSlots[i];
      const skill = skills[i];

      // Get slot children: [0]=bg, [1]=label, [2]=levelText, [3]=plusBg, [4]=plusText, then optional [5]=icon
      const slotLabel = slot.getAt(1) as Phaser.GameObjects.Text;
      const levelText = slot.getAt(2) as Phaser.GameObjects.Text;
      const plusBg = slot.getAt(3) as Phaser.GameObjects.Rectangle;
      const plusText = slot.getAt(4) as Phaser.GameObjects.Text;

      if (skill && skill.skillId) {
        const stateKey = `${skill.skillId}:${skill.level}:${skillPoints}`;
        const changed = this.lastSkillState[i] !== stateKey;
        this.lastSkillState[i] = stateKey;

        if (!changed) continue;

        // Remove old icon if exists (index 5+)
        while (slot.length > 5) {
          const old = slot.getAt(5);
          old.destroy();
          slot.removeAt(5);
        }

        const spriteKey = SKILL_SPRITES[skill.skillId] || 'flame_0';
        const icon = this.scene.add.image(0, 0, spriteKey);
        icon.setScale(36 / 32);
        slot.addAt(icon, 5);

        slotLabel.setText(SKILL_NAMES[skill.skillId] || skill.skillId);
        levelText.setText(`Lv${skill.level}`);

        // Show "+" button if can level up
        const canLevel = skillPoints > 0 && skill.level < 10;
        plusBg.setVisible(canLevel);
        plusText.setVisible(canLevel);
        if (canLevel) {
          plusBg.setFillStyle(0x006600);
        }
      } else {
        if (this.lastSkillState[i] !== '') {
          this.lastSkillState[i] = '';
          while (slot.length > 5) {
            const old = slot.getAt(5);
            old.destroy();
            slot.removeAt(5);
          }
          slotLabel.setText('');
          levelText.setText('');
          plusBg.setVisible(false);
          plusText.setVisible(false);
        }
      }
    }
  }

  handleResize(width: number, height: number): void {
    const slotSize = 48;
    const gap = 4;
    const totalWidth = 5 * slotSize + 4 * gap;
    const startX = width / 2 - totalWidth / 2 + slotSize / 2;
    const y = height - 50;

    this.skillSlots.forEach((slot, i) => {
      slot.setPosition(startX + i * (slotSize + gap), y);
    });
    this.skillPointsText.setPosition(width / 2, y - slotSize / 2 - 14);
  }
}
