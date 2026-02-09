import { GameState, Monster, Player } from "../schemas/GameState";
import { PlayerState, ProjectileState, MAX_SKILL_LEVEL, SKILL_AUTO_CAST_RANGE } from "../data/constants";
import { SKILL_DEFINITIONS } from "../data/skills";
import { CombatSystem } from "./CombatSystem";
import { MovementSystem } from "./MovementSystem";

export class SkillSystem {
  updateSkillAutoCast(now: number, state: GameState, playerStates: Map<string, PlayerState>, movementSystem: MovementSystem, projectileStates: Map<string, ProjectileState>) {
    state.players.forEach((player, sessionId) => {
      if (player.isDead) return;
      const playerState = playerStates.get(sessionId);
      if (!playerState) return;

      player.skills.forEach((playerSkill) => {
        if (!playerSkill.skillId) return;

        const skillDef = SKILL_DEFINITIONS.find(s => s.id === playerSkill.skillId);
        if (!skillDef) return;

        const lastFire = playerState.skillCooldowns.get(playerSkill.skillId) || 0;
        if (now - lastFire < skillDef.cooldown) return;

        // Find nearest monster in range
        let nearestMonster: Monster | null = null;
        let nearestDist = Infinity;

        state.monsters.forEach((monster) => {
          if (monster.hp <= 0) return;
          const dist = CombatSystem.distance(player.x, player.y, monster.x, monster.y);
          if (dist < nearestDist && dist <= SKILL_AUTO_CAST_RANGE) {
            nearestDist = dist;
            nearestMonster = monster;
          }
        });

        if (!nearestMonster) return;

        // Fire skill projectile
        const nm = nearestMonster as Monster;
        const skillDamage = skillDef.baseDamage * (1 + (playerSkill.level - 1) * 0.1);
        movementSystem.createSkillProjectile(player.x, player.y, nm.x, nm.y, sessionId, skillDef, skillDamage, state, projectileStates);
        playerState.skillCooldowns.set(playerSkill.skillId, now);
      });
    });
  }

  handleLevelSkill(playerId: string, slotIndex: number, state: GameState) {
    const player = state.players.get(playerId);
    if (!player || player.isDead) return;
    if (slotIndex < 0 || slotIndex >= player.skills.length) return;
    if (player.skillPoints <= 0) return;

    const skill = player.skills[slotIndex];
    if (!skill || !skill.skillId) return;
    if (skill.level >= MAX_SKILL_LEVEL) return;

    skill.level += 1;
    player.skillPoints -= 1;
  }
}
