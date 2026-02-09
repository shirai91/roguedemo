import { GameState, Player, Monster } from "../schemas/GameState";
import { MonsterState, PlayerState, MAX_PLAYER_LEVEL } from "../data/constants";
import { MONSTER_TYPES } from "../data/monsters";
import { LootSystem } from "./LootSystem";

export class CombatSystem {
  static calculatePlayerDamage(player: Player, damageType: string): number {
    let baseDamage = 0;

    if (damageType === "attack") {
      baseDamage = player.rawAttack;
      baseDamage *= (1 + player.percentAttackIncrease / 100);
    } else if (damageType === "spell") {
      baseDamage = player.rawSpell;
      baseDamage *= (1 + player.percentSpellIncrease / 100);
    }

    baseDamage *= (1 + player.increasedDamage / 100);
    baseDamage *= (1 + (player.level - 1) * 0.1);

    return baseDamage;
  }

  static damageMonster(
    monsterId: string,
    damage: number,
    attackerId: string,
    damageType: string,
    state: GameState,
    monsterStates: Map<string, MonsterState>,
    playerStates: Map<string, PlayerState>,
    lootSystem: LootSystem
  ) {
    const monster = state.monsters.get(monsterId);
    if (!monster || monster.hp <= 0) return;

    const monsterType = MONSTER_TYPES.find(t => t.type === monster.monsterType);
    if (!monsterType) return;

    // Apply damage formula
    let finalDamage = damage;

    if (damageType === "attack") {
      finalDamage = damage * 100 / (100 + monsterType.baseArmour);
    } else if (damageType === "spell") {
      finalDamage = damage * 100 / (100 + monsterType.baseMagicRes);
    }
    // divine ignores resistances

    finalDamage = Math.max(1, finalDamage);

    monster.hp -= finalDamage;

    if (monster.hp <= 0) {
      monster.hp = 0;

      const monsterState = monsterStates.get(monsterId);
      if (monsterState) {
        monsterState.deathTime = Date.now();
      }

      // Give XP
      const player = state.players.get(attackerId);
      if (player) {
        let rarityMultiplier = 1;
        if (monster.rarity === "magic") rarityMultiplier = 1.5;
        if (monster.rarity === "rare") rarityMultiplier = 2.5;

        const xpGain = monsterType.xpReward * monster.level * rarityMultiplier;
        player.xp += xpGain;

        // Check level up
        while (player.xp >= player.xpToNext && player.level < MAX_PLAYER_LEVEL) {
          player.xp -= player.xpToNext;
          player.level++;
          player.skillPoints += 1;
          player.maxHp += 20;
          player.hp = player.maxHp;
          player.rawAttack += 1;
          player.rawSpell += 1;
          player.xpToNext = 100 * player.level;
        }
      }

      // Drop loot
      const rarityDropMultiplier = monster.rarity === "rare" ? 4 : monster.rarity === "magic" ? 2 : 1;
      const dropChance = 0.3 * rarityDropMultiplier;

      if (Math.random() < dropChance) {
        // Drop item - delegate to loot system
        lootSystem.dropItemByMonsterLevel(monster.level, monster.x, monster.y, state);
      }

      // Drop skill
      const skillDropChance = monster.rarity === "rare" ? 0.4 : monster.rarity === "magic" ? 0.2 : 0.1;
      if (Math.random() < skillDropChance) {
        lootSystem.dropRandomSkill(monster.x, monster.y, state);
      }
    }
  }

  static damagePlayer(playerId: string, damage: number, damageType: string, state: GameState, playerStates: Map<string, PlayerState>) {
    const player = state.players.get(playerId);
    if (!player || player.isDead) return;

    // Apply damage formula
    let finalDamage = damage;

    if (damageType === "attack") {
      finalDamage = damage * 100 / (100 + player.armour);
    } else if (damageType === "spell") {
      finalDamage = damage * 100 / (100 + player.magicRes);
    }
    // divine ignores resistances

    finalDamage -= player.damageBlock;
    finalDamage = Math.max(1, finalDamage);

    player.hp -= finalDamage;

    if (player.hp <= 0) {
      player.hp = 0;
      player.isDead = true;

      const playerState = playerStates.get(playerId);
      if (playerState) {
        playerState.deathTime = Date.now();
      }
    }
  }

  static checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    return this.distance(x1, y1, x2, y2) < r1 + r2;
  }

  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
}
