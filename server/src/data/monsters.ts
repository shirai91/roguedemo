// Monster type definitions
export interface MonsterType {
  type: string;
  name: string;
  baseHp: number;
  baseDamage: number;
  damageType: "attack" | "spell" | "divine";
  baseSpeed: number;
  baseArmour: number;
  baseMagicRes: number;
  chaseRange: number;
  attackRange: number;
  attackSpeed: number;
  color: string;
  size: number;
  xpReward: number;
  minLevel: number;
  maxLevel: number;
  projectileSprite: string;
  projectileSpeed: number;
}

export const MONSTER_TYPES: MonsterType[] = [
  { type: "slime", name: "Slime", baseHp: 30, baseDamage: 5, damageType: "attack", baseSpeed: 80, baseArmour: 0, baseMagicRes: 0, chaseRange: 250, attackRange: 40, attackSpeed: 1.0, color: "#00ff00", size: 15, xpReward: 10, minLevel: 1, maxLevel: 3, projectileSprite: "rock_0", projectileSpeed: 800 },
  { type: "bat", name: "Bat", baseHp: 20, baseDamage: 8, damageType: "attack", baseSpeed: 180, baseArmour: 0, baseMagicRes: 5, chaseRange: 350, attackRange: 35, attackSpeed: 1.5, color: "#4a4a4a", size: 12, xpReward: 15, minLevel: 1, maxLevel: 4, projectileSprite: "needle_0", projectileSpeed: 800 },
  { type: "imp", name: "Imp", baseHp: 35, baseDamage: 12, damageType: "spell", baseSpeed: 120, baseArmour: 0, baseMagicRes: 10, chaseRange: 300, attackRange: 60, attackSpeed: 0.8, color: "#ff6600", size: 18, xpReward: 20, minLevel: 2, maxLevel: 5, projectileSprite: "flame_0", projectileSpeed: 450 },
  { type: "spider", name: "Spider", baseHp: 45, baseDamage: 10, damageType: "attack", baseSpeed: 140, baseArmour: 5, baseMagicRes: 0, chaseRange: 280, attackRange: 45, attackSpeed: 1.2, color: "#8b4513", size: 20, xpReward: 25, minLevel: 3, maxLevel: 6, projectileSprite: "needle_0", projectileSpeed: 800 },
  { type: "skeleton", name: "Skeleton", baseHp: 60, baseDamage: 15, damageType: "attack", baseSpeed: 100, baseArmour: 15, baseMagicRes: 5, chaseRange: 300, attackRange: 50, attackSpeed: 1.0, color: "#e0e0e0", size: 22, xpReward: 35, minLevel: 4, maxLevel: 8, projectileSprite: "stone_0", projectileSpeed: 800 },
  { type: "goblin", name: "Goblin", baseHp: 50, baseDamage: 18, damageType: "attack", baseSpeed: 160, baseArmour: 8, baseMagicRes: 2, chaseRange: 320, attackRange: 48, attackSpeed: 1.3, color: "#228b22", size: 20, xpReward: 30, minLevel: 4, maxLevel: 7, projectileSprite: "rock_0", projectileSpeed: 800 },
  { type: "wolf", name: "Wolf", baseHp: 55, baseDamage: 20, damageType: "attack", baseSpeed: 200, baseArmour: 5, baseMagicRes: 0, chaseRange: 400, attackRange: 45, attackSpeed: 1.5, color: "#696969", size: 22, xpReward: 40, minLevel: 5, maxLevel: 9, projectileSprite: "needle_0", projectileSpeed: 900 },
  { type: "zombie", name: "Zombie", baseHp: 100, baseDamage: 25, damageType: "attack", baseSpeed: 70, baseArmour: 10, baseMagicRes: 15, chaseRange: 250, attackRange: 50, attackSpeed: 0.7, color: "#556b2f", size: 24, xpReward: 50, minLevel: 6, maxLevel: 10, projectileSprite: "rock_0", projectileSpeed: 800 },
  { type: "ghost", name: "Ghost", baseHp: 70, baseDamage: 30, damageType: "spell", baseSpeed: 130, baseArmour: 0, baseMagicRes: 25, chaseRange: 350, attackRange: 70, attackSpeed: 1.0, color: "#9370db", size: 20, xpReward: 60, minLevel: 7, maxLevel: 12, projectileSprite: "drain_0_new", projectileSpeed: 450 },
  { type: "orc", name: "Orc", baseHp: 120, baseDamage: 35, damageType: "attack", baseSpeed: 110, baseArmour: 20, baseMagicRes: 5, chaseRange: 300, attackRange: 55, attackSpeed: 0.9, color: "#8b0000", size: 28, xpReward: 70, minLevel: 8, maxLevel: 13, projectileSprite: "stone_0", projectileSpeed: 800 },
  { type: "wraith", name: "Wraith", baseHp: 90, baseDamage: 40, damageType: "spell", baseSpeed: 140, baseArmour: 5, baseMagicRes: 30, chaseRange: 350, attackRange: 75, attackSpeed: 1.1, color: "#483d8b", size: 22, xpReward: 80, minLevel: 9, maxLevel: 14, projectileSprite: "orb_glow_0", projectileSpeed: 450 },
  { type: "harpy", name: "Harpy", baseHp: 80, baseDamage: 38, damageType: "attack", baseSpeed: 170, baseArmour: 8, baseMagicRes: 12, chaseRange: 380, attackRange: 65, attackSpeed: 1.4, color: "#ff1493", size: 24, xpReward: 85, minLevel: 10, maxLevel: 15, projectileSprite: "needle_0", projectileSpeed: 900 },
  { type: "troll", name: "Troll", baseHp: 180, baseDamage: 45, damageType: "attack", baseSpeed: 90, baseArmour: 30, baseMagicRes: 10, chaseRange: 280, attackRange: 60, attackSpeed: 0.8, color: "#2f4f4f", size: 32, xpReward: 100, minLevel: 11, maxLevel: 16, projectileSprite: "stone_0", projectileSpeed: 800 },
  { type: "demon", name: "Demon", baseHp: 140, baseDamage: 55, damageType: "attack", baseSpeed: 150, baseArmour: 15, baseMagicRes: 20, chaseRange: 350, attackRange: 55, attackSpeed: 1.2, color: "#8b0000", size: 30, xpReward: 120, minLevel: 12, maxLevel: 18, projectileSprite: "flame_0", projectileSpeed: 500 },
  { type: "basilisk", name: "Basilisk", baseHp: 160, baseDamage: 50, damageType: "spell", baseSpeed: 100, baseArmour: 25, baseMagicRes: 35, chaseRange: 320, attackRange: 80, attackSpeed: 1.0, color: "#006400", size: 28, xpReward: 130, minLevel: 13, maxLevel: 19, projectileSprite: "acid_venom", projectileSpeed: 450 },
  { type: "minotaur", name: "Minotaur", baseHp: 200, baseDamage: 60, damageType: "attack", baseSpeed: 120, baseArmour: 35, baseMagicRes: 15, chaseRange: 300, attackRange: 58, attackSpeed: 1.0, color: "#8b4513", size: 35, xpReward: 150, minLevel: 14, maxLevel: 20, projectileSprite: "stone_0", projectileSpeed: 1000 },
  { type: "lich", name: "Lich", baseHp: 150, baseDamage: 70, damageType: "spell", baseSpeed: 110, baseArmour: 10, baseMagicRes: 50, chaseRange: 400, attackRange: 100, attackSpeed: 0.9, color: "#4b0082", size: 26, xpReward: 180, minLevel: 15, maxLevel: 22, projectileSprite: "magic_bolt_1", projectileSpeed: 400 },
  { type: "drake", name: "Drake", baseHp: 250, baseDamage: 65, damageType: "spell", baseSpeed: 130, baseArmour: 40, baseMagicRes: 30, chaseRange: 350, attackRange: 85, attackSpeed: 1.1, color: "#ff4500", size: 40, xpReward: 200, minLevel: 16, maxLevel: 24, projectileSprite: "flame_0", projectileSpeed: 500 },
  { type: "golem", name: "Golem", baseHp: 350, baseDamage: 55, damageType: "attack", baseSpeed: 60, baseArmour: 60, baseMagicRes: 40, chaseRange: 250, attackRange: 65, attackSpeed: 0.6, color: "#708090", size: 45, xpReward: 220, minLevel: 17, maxLevel: 25, projectileSprite: "rock_0", projectileSpeed: 800 },
  { type: "hydra", name: "Hydra", baseHp: 400, baseDamage: 80, damageType: "divine", baseSpeed: 100, baseArmour: 45, baseMagicRes: 45, chaseRange: 380, attackRange: 90, attackSpeed: 1.0, color: "#8b008b", size: 50, xpReward: 300, minLevel: 18, maxLevel: 30, projectileSprite: "goldaura_0", projectileSpeed: 500 },
];
