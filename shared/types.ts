/**
 * Shared Type Definitions for RogueDemo
 * Pure TypeScript types with no external dependencies
 */

export type DamageType = 'attack' | 'spell' | 'divine';

export type MonsterRarity = 'normal' | 'magic' | 'rare';

export type MonsterState = 'patrol' | 'chase' | 'attack' | 'dead';

export interface Stats {
  move_speed: number;
  attack_speed: number;
  raw_attack: number;
  raw_spell: number;
  increased_damage: number;  // percentage
  armour: number;
  magic_res: number;
  percent_attack_increase: number;
  percent_spell_increase: number;
  damage_block: number;  // flat damage reduction
}

export interface ItemDefinition {
  id: string;
  name: string;
  tier: number;  // 1-5
  stats: Partial<Stats>;
  color: string;  // for placeholder art
  description: string;
}

export interface MonsterDefinition {
  type: string;
  name: string;
  baseHp: number;
  baseDamage: number;
  damageType: DamageType;
  baseSpeed: number;
  baseArmour: number;
  baseMagicRes: number;
  chaseRange: number;
  attackRange: number;
  attackSpeed: number;  // attacks per second
  color: string;  // base color for placeholder art
  size: number;   // radius in pixels
  xpReward: number;
  minLevel: number;
  maxLevel: number;
}

export interface PlayerInput {
  dx: number;  // -1, 0, or 1
  dy: number;  // -1, 0, or 1
  shootX?: number;  // world x target
  shootY?: number;  // world y target
  shooting?: boolean;
  pickupItem?: string;  // item instance id
  equipItem?: number;   // inventory index
  unequipItem?: number; // equipment slot index
}

export interface LootDrop {
  itemId: string;
  x: number;
  y: number;
}
