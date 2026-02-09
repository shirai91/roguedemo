import { GameState, Projectile, Player } from "../schemas/GameState";
import { PlayerInput, PlayerState, ProjectileState, MonsterState } from "../data/constants";
import { MAP_WIDTH, MAP_HEIGHT, PROJECTILE_SPEED, PROJECTILE_LIFETIME } from "../data/constants";
import { SKILL_DEFINITIONS, SkillDefinition } from "../data/skills";
import { CombatSystem } from "./CombatSystem";
import { LootSystem } from "./LootSystem";

export class MovementSystem {
  private projectileIdCounter = 0;

  updatePlayers(dt: number, now: number, state: GameState, playerInputs: Map<string, PlayerInput>, playerStates: Map<string, PlayerState>, projectileStates: Map<string, ProjectileState>) {
    state.players.forEach((player, sessionId) => {
      const input = playerInputs.get(sessionId);
      const playerState = playerStates.get(sessionId);

      if (!playerState) return;

      // Handle respawn - skip if dead
      if (player.isDead) {
        return;
      }

      if (!input) return;

      // Movement using dx/dy from client (-1, 0, 1)
      let dx = input.dx || 0;
      let dy = input.dy || 0;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
      }

      player.x += dx * player.moveSpeed * dt;
      player.y += dy * player.moveSpeed * dt;

      // Clamp to map bounds
      player.x = Math.max(0, Math.min(MAP_WIDTH, player.x));
      player.y = Math.max(0, Math.min(MAP_HEIGHT, player.y));

      // Shooting - client sends angle directly
      if (input.shooting) {
        const cooldown = 1000 / player.attackSpeed;
        if (now - playerState.lastShootTime >= cooldown) {
          const targetX = player.x + Math.cos(input.angle) * 100;
          const targetY = player.y + Math.sin(input.angle) * 100;
          this.createProjectile(player.x, player.y, targetX, targetY, sessionId, "attack", true, state, projectileStates);
          playerState.lastShootTime = now;
        }
      }
    });
  }

  updateProjectiles(dt: number, now: number, state: GameState, projectileStates: Map<string, ProjectileState>, lootSystem: LootSystem, monsterStates: Map<string, MonsterState>, playerStates: Map<string, PlayerState>) {
    state.projectiles.forEach((projectile, id) => {
      const projectileState = projectileStates.get(id);
      if (!projectileState) {
        state.projectiles.delete(id);
        return;
      }

      // Check lifetime (use per-projectile lifetime if set)
      const lifetime = projectileState.lifetime ?? PROJECTILE_LIFETIME;
      if (now - projectileState.createdAt >= lifetime) {
        state.projectiles.delete(id);
        projectileStates.delete(id);
        return;
      }

      // Move projectile (use per-projectile speed, then skill-specific, then default)
      let projSpeed = projectileState.speed ?? PROJECTILE_SPEED;
      if (!projectileState.speed && projectile.skillId) {
        const skillDef = SKILL_DEFINITIONS.find(s => s.id === projectile.skillId);
        if (skillDef) projSpeed = skillDef.projectileSpeed;
      }
      const dx = Math.cos(projectile.angle) * projSpeed * dt;
      const dy = Math.sin(projectile.angle) * projSpeed * dt;

      projectile.x += dx;
      projectile.y += dy;

      // Check map bounds
      if (projectile.x < 0 || projectile.x > MAP_WIDTH || projectile.y < 0 || projectile.y > MAP_HEIGHT) {
        state.projectiles.delete(id);
        projectileStates.delete(id);
        return;
      }

      // Check collisions
      if (projectile.isPlayerProjectile) {
        // Check monster collisions
        state.monsters.forEach((monster, monsterId) => {
          if (CombatSystem.checkCollision(projectile.x, projectile.y, 5, monster.x, monster.y, monster.size)) {
            CombatSystem.damageMonster(monsterId, projectileState.damage, projectile.ownerId, projectile.damageType, state, monsterStates, playerStates, lootSystem);
            state.projectiles.delete(id);
            projectileStates.delete(id);
          }
        });

        // Check other player collisions (PVP)
        state.players.forEach((otherPlayer, otherId) => {
          if (otherId !== projectile.ownerId && !otherPlayer.isDead) {
            if (CombatSystem.checkCollision(projectile.x, projectile.y, 5, otherPlayer.x, otherPlayer.y, 20)) {
              CombatSystem.damagePlayer(otherId, projectileState.damage, projectile.damageType, state, playerStates);
              state.projectiles.delete(id);
              projectileStates.delete(id);
            }
          }
        });
      } else if (projectile.isMonsterProjectile) {
        // Monster projectile vs players
        state.players.forEach((player, playerId) => {
          if (!player.isDead) {
            if (CombatSystem.checkCollision(projectile.x, projectile.y, 5, player.x, player.y, 20)) {
              CombatSystem.damagePlayer(playerId, projectileState.damage, projectile.damageType, state, playerStates);
              state.projectiles.delete(id);
              projectileStates.delete(id);
            }
          }
        });
      }
    });
  }

  createProjectile(x: number, y: number, targetX: number, targetY: number, ownerId: string, damageType: string, isPlayerProjectile: boolean, state: GameState, projectileStates: Map<string, ProjectileState>): string {
    const projectileId = `projectile_${this.projectileIdCounter++}`;

    const angle = Math.atan2(targetY - y, targetX - x);

    const projectile = new Projectile();
    projectile.x = x;
    projectile.y = y;
    projectile.angle = angle;
    projectile.ownerId = ownerId;
    projectile.damageType = damageType;
    projectile.isPlayerProjectile = isPlayerProjectile;

    state.projectiles.set(projectileId, projectile);

    // Calculate damage
    let damage = 0;
    if (isPlayerProjectile) {
      const player = state.players.get(ownerId);
      if (player) {
        damage = CombatSystem.calculatePlayerDamage(player, damageType);
      }
    }

    projectileStates.set(projectileId, {
      createdAt: Date.now(),
      damage: damage,
    });

    return projectileId;
  }

  createSkillProjectile(x: number, y: number, targetX: number, targetY: number, ownerId: string, skillDef: SkillDefinition, damage: number, state: GameState, projectileStates: Map<string, ProjectileState>) {
    const projectileId = `projectile_${this.projectileIdCounter++}`;
    const angle = Math.atan2(targetY - y, targetX - x);

    const projectile = new Projectile();
    projectile.x = x;
    projectile.y = y;
    projectile.angle = angle;
    projectile.ownerId = ownerId;
    projectile.damageType = skillDef.damageType;
    projectile.isPlayerProjectile = true;
    projectile.skillId = skillDef.id;

    state.projectiles.set(projectileId, projectile);

    projectileStates.set(projectileId, {
      createdAt: Date.now(),
      damage: damage,
    });
  }

}
