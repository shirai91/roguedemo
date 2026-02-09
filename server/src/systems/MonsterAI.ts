import { GameState, Monster, Player } from "../schemas/GameState";
import { MonsterState, PlayerState } from "../data/constants";
import { MONSTER_TYPES, MonsterType } from "../data/monsters";
import { MAP_WIDTH, MAP_HEIGHT, MONSTER_RESPAWN_DELAY } from "../data/constants";
import { CombatSystem } from "./CombatSystem";

export class MonsterAI {
  private monsterIdCounter = 0;

  spawnMonster(state: GameState, monsterStates: Map<string, MonsterState>) {
    const monsterId = `monster_${this.monsterIdCounter++}`;

    // Select random monster type weighted by level
    const monsterType = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];

    // Random level within range
    const level = Math.floor(Math.random() * (monsterType.maxLevel - monsterType.minLevel + 1)) + monsterType.minLevel;

    // Random rarity
    const rarityRoll = Math.random();
    let rarity = "normal";
    let rarityMultiplier = 1.0;

    if (rarityRoll >= 0.95) {
      rarity = "rare";
      rarityMultiplier = 2.5;
    } else if (rarityRoll >= 0.70) {
      rarity = "magic";
      rarityMultiplier = 1.5;
    }

    const monster = new Monster();
    monster.monsterId = monsterId;
    monster.x = Math.random() * MAP_WIDTH;
    monster.y = Math.random() * MAP_HEIGHT;
    monster.monsterType = monsterType.type;
    monster.level = level;
    monster.rarity = rarity;
    monster.maxHp = Math.round(monsterType.baseHp * (1 + (level - 1) * 0.1) * rarityMultiplier);
    monster.hp = monster.maxHp;
    monster.state = "patrol";
    monster.size = monsterType.size;
    monster.color = monsterType.color;

    state.monsters.set(monsterId, monster);

    monsterStates.set(monsterId, {
      lastAttackTime: 0,
      patrolTargetX: Math.random() * MAP_WIDTH,
      patrolTargetY: Math.random() * MAP_HEIGHT,
      targetPlayerId: null,
      deathTime: 0,
    });
  }

  respawnMonster(monsterId: string, state: GameState, monsterStates: Map<string, MonsterState>) {
    const monster = state.monsters.get(monsterId);
    if (!monster) return;

    const monsterType = MONSTER_TYPES.find(t => t.type === monster.monsterType);
    if (!monsterType) return;

    // Reset monster
    monster.x = Math.random() * MAP_WIDTH;
    monster.y = Math.random() * MAP_HEIGHT;
    monster.hp = monster.maxHp;
    monster.state = "patrol";

    const monsterState = monsterStates.get(monsterId);
    if (monsterState) {
      monsterState.patrolTargetX = Math.random() * MAP_WIDTH;
      monsterState.patrolTargetY = Math.random() * MAP_HEIGHT;
      monsterState.targetPlayerId = null;
      monsterState.lastAttackTime = 0;
    }
  }

  updateMonsters(dt: number, now: number, state: GameState, monsterStates: Map<string, MonsterState>, playerStates: Map<string, PlayerState>) {
    state.monsters.forEach((monster, monsterId) => {
      const monsterState = monsterStates.get(monsterId);
      if (!monsterState) return;

      // Handle respawn
      if (monster.hp <= 0) {
        if (now - monsterState.deathTime >= MONSTER_RESPAWN_DELAY) {
          this.respawnMonster(monsterId, state, monsterStates);
        }
        return;
      }

      const monsterType = MONSTER_TYPES.find(t => t.type === monster.monsterType);
      if (!monsterType) return;

      // Find nearest player
      let nearestPlayer: Player | null = null;
      let nearestDistance = Infinity;

      state.players.forEach((player) => {
        if (player.isDead) return;
        const dist = CombatSystem.distance(monster.x, monster.y, player.x, player.y);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestPlayer = player;
        }
      });

      // AI behavior
      if (nearestPlayer && nearestDistance <= monsterType.chaseRange) {
        // Chase mode
        monster.state = "chase";
        monsterState.targetPlayerId = Array.from(state.players.entries())
          .find(([_, p]) => p === nearestPlayer)?.[0] || null;

        if (nearestDistance <= monsterType.attackRange) {
          // Attack
          const cooldown = 1000 / monsterType.attackSpeed;
          if (now - monsterState.lastAttackTime >= cooldown) {
            CombatSystem.damagePlayer(monsterState.targetPlayerId!, monsterType.baseDamage * (1 + (monster.level - 1) * 0.1), monsterType.damageType, state, playerStates);
            monsterState.lastAttackTime = now;
          }
        } else {
          // Move towards player
          const np = nearestPlayer as Player;
          const dx = (np.x - monster.x) / nearestDistance;
          const dy = (np.y - monster.y) / nearestDistance;

          monster.x += dx * monsterType.baseSpeed * dt;
          monster.y += dy * monsterType.baseSpeed * dt;
        }
      } else {
        // Patrol mode
        monster.state = "patrol";
        monsterState.targetPlayerId = null;

        const distToPatrol = CombatSystem.distance(monster.x, monster.y, monsterState.patrolTargetX, monsterState.patrolTargetY);

        if (distToPatrol < 20) {
          // Reached patrol point, pick new one
          monsterState.patrolTargetX = Math.random() * MAP_WIDTH;
          monsterState.patrolTargetY = Math.random() * MAP_HEIGHT;
        } else {
          // Move towards patrol point
          const dx = (monsterState.patrolTargetX - monster.x) / distToPatrol;
          const dy = (monsterState.patrolTargetY - monster.y) / distToPatrol;

          monster.x += dx * monsterType.baseSpeed * 0.5 * dt;
          monster.y += dy * monsterType.baseSpeed * 0.5 * dt;
        }
      }

      // Clamp to map bounds
      monster.x = Math.max(0, Math.min(MAP_WIDTH, monster.x));
      monster.y = Math.max(0, Math.min(MAP_HEIGHT, monster.y));
    });
  }
}
