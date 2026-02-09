// Skill definitions
export interface SkillDefinition {
  id: string;
  name: string;
  damageType: "attack" | "spell" | "divine";
  baseDamage: number;
  cooldown: number;
  projectileSpeed: number;
  sprite: string;
  description: string;
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "fireball", name: "Fireball", damageType: "spell", baseDamage: 30, cooldown: 2200, projectileSpeed: 400, sprite: "flame_0.png", description: "Launches a fireball" },
  // Medium tier (500-550 speed): 15-22 dmg, 1200-1800ms cd
  { id: "ice_shard", name: "Ice Shard", damageType: "spell", baseDamage: 18, cooldown: 1500, projectileSpeed: 500, sprite: "icicle_0.png", description: "Fires an ice projectile" },
  // Fast tier (600-700 speed): 8-15 dmg, 600-1000ms cd
  { id: "lightning_bolt", name: "Lightning Bolt", damageType: "spell", baseDamage: 10, cooldown: 800, projectileSpeed: 700, sprite: "zap_0.png", description: "A bolt of lightning" },
  // Medium tier (500-550 speed): 15-22 dmg, 1200-1800ms cd
  { id: "poison_arrow", name: "Poison Arrow", damageType: "attack", baseDamage: 17, cooldown: 1400, projectileSpeed: 550, sprite: "poison_arrow_0.png", description: "Toxic projectile" },
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "crystal_spear", name: "Crystal Spear", damageType: "attack", baseDamage: 28, cooldown: 2200, projectileSpeed: 450, sprite: "crystal_spear_0.png", description: "Piercing crystal" },
  // Fast tier (600-700 speed): 8-15 dmg, 600-1000ms cd
  { id: "magic_dart", name: "Magic Dart", damageType: "spell", baseDamage: 12, cooldown: 700, projectileSpeed: 600, sprite: "magic_dart_0.png", description: "Quick arcane bolt" },
  // Very slow tier (300-350 speed): 35-45 dmg, 2500-3500ms cd
  { id: "iron_shot", name: "Iron Shot", damageType: "attack", baseDamage: 40, cooldown: 3000, projectileSpeed: 350, sprite: "iron_shot_0.png", description: "Heavy metal slug" },
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "acid_venom", name: "Acid Venom", damageType: "spell", baseDamage: 27, cooldown: 1900, projectileSpeed: 400, sprite: "acid_venom.png", description: "Corrosive spray" },
  // Fast tier (600-700 speed): 8-15 dmg, 600-1000ms cd
  { id: "searing_ray", name: "Searing Ray", damageType: "spell", baseDamage: 11, cooldown: 750, projectileSpeed: 650, sprite: "searing_ray_0.png", description: "Beam of heat" },
  // Medium tier (500-550 speed): 15-22 dmg, 1200-1800ms cd
  { id: "holy_arrow", name: "Holy Arrow", damageType: "divine", baseDamage: 20, cooldown: 1600, projectileSpeed: 500, sprite: "arrow_0.png", description: "Blessed arrow" },
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "sandblast", name: "Sandblast", damageType: "attack", baseDamage: 25, cooldown: 1800, projectileSpeed: 450, sprite: "sandblast_0.png", description: "Ground shrapnel" },
  // Medium tier (500-550 speed): 15-22 dmg, 1200-1800ms cd
  { id: "sting", name: "Sting", damageType: "spell", baseDamage: 15, cooldown: 1200, projectileSpeed: 550, sprite: "sting_0.png", description: "Venomous sting" },
  // Medium tier (500-550 speed): 15-22 dmg, 1200-1800ms cd
  { id: "stone_arrow", name: "Stone Arrow", damageType: "attack", baseDamage: 19, cooldown: 1500, projectileSpeed: 500, sprite: "stone_arrow_0.png", description: "Hardened stone bolt" },
  // Very slow tier (300-350 speed): 35-45 dmg, 2500-3500ms cd
  { id: "frost_nova", name: "Frost Nova", damageType: "spell", baseDamage: 38, cooldown: 2800, projectileSpeed: 350, sprite: "frost_0.png", description: "Burst of cold" },
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "javelin_throw", name: "Javelin Throw", damageType: "attack", baseDamage: 26, cooldown: 2000, projectileSpeed: 450, sprite: "javelin_0_new.png", description: "Thrown javelin" },
  // Medium tier (500-550 speed): 15-22 dmg, 1200-1800ms cd
  { id: "magic_bolt", name: "Magic Bolt", damageType: "spell", baseDamage: 18, cooldown: 1400, projectileSpeed: 520, sprite: "magic_bolt_1.png", description: "Pure arcane energy" },
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "divine_judgment", name: "Divine Judgment", damageType: "divine", baseDamage: 35, cooldown: 2500, projectileSpeed: 400, sprite: "goldaura_0.png", description: "Golden smite" },
  // Fast tier (600-700 speed): 8-15 dmg, 600-1000ms cd
  { id: "crossbow_bolt", name: "Crossbow Bolt", damageType: "attack", baseDamage: 13, cooldown: 800, projectileSpeed: 650, sprite: "crossbow_bolt_0.png", description: "Rapid bolt" },
  // Slow tier (400-450 speed): 25-35 dmg, 1800-2500ms cd
  { id: "soul_drain", name: "Soul Drain", damageType: "divine", baseDamage: 32, cooldown: 2400, projectileSpeed: 400, sprite: "drain_0_new.png", description: "Life steal bolt" },
  // Very slow tier (300-350 speed): 35-45 dmg, 2500-3500ms cd
  { id: "chaos_orb", name: "Chaos Orb", damageType: "divine", baseDamage: 45, cooldown: 3500, projectileSpeed: 350, sprite: "orb_glow_0.png", description: "Chaotic energy" },
];
