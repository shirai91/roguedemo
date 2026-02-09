// Game constants
export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 3000;
export const MAX_MONSTERS = 50;
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_SPEED = 200;
export const PLAYER_BASE_ATTACK_SPEED = 1.0;
export const PROJECTILE_SPEED = 500;
export const PROJECTILE_LIFETIME = 2000;
export const MONSTER_CHASE_RANGE = 300;
export const MONSTER_ATTACK_RANGE = 50;
export const TICK_RATE = 50; // 50ms = 20 ticks per second
export const EQUIPMENT_SLOTS = 6;
export const INVENTORY_SIZE = 20;
export const MONSTER_RESPAWN_DELAY = 3000;
export const PLAYER_RESPAWN_DELAY = 5000;
export const ITEM_PICKUP_RANGE = 50;
export const SKILL_AUTO_CAST_RANGE = 300;
export const MAX_SKILLS = 5;
export const MAX_SKILL_LEVEL = 10;
export const MAX_PLAYER_LEVEL = 30;

// Runtime state interfaces
export interface PlayerInput {
  dx: number;
  dy: number;
  shooting: boolean;
  angle: number;
}

export interface MonsterState {
  lastAttackTime: number;
  patrolTargetX: number;
  patrolTargetY: number;
  targetPlayerId: string | null;
  deathTime: number;
}

export interface ProjectileState {
  createdAt: number;
  damage: number;
  speed?: number;
  lifetime?: number;
}

export interface PlayerState {
  lastShootTime: number;
  deathTime: number;
  skillCooldowns: Map<string, number>;
}
