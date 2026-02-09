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
  { id: "fireball", name: "Fireball", damageType: "spell", baseDamage: 25, cooldown: 2000, projectileSpeed: 400, sprite: "flame_0.png", description: "Launches a fireball" },
  { id: "ice_shard", name: "Ice Shard", damageType: "spell", baseDamage: 20, cooldown: 1500, projectileSpeed: 500, sprite: "icicle_0.png", description: "Fires an ice projectile" },
  { id: "lightning_bolt", name: "Lightning Bolt", damageType: "spell", baseDamage: 35, cooldown: 3000, projectileSpeed: 700, sprite: "zap_0.png", description: "A bolt of lightning" },
  { id: "poison_arrow", name: "Poison Arrow", damageType: "attack", baseDamage: 18, cooldown: 1200, projectileSpeed: 550, sprite: "poison_arrow_0.png", description: "Toxic projectile" },
  { id: "crystal_spear", name: "Crystal Spear", damageType: "attack", baseDamage: 30, cooldown: 2500, projectileSpeed: 450, sprite: "crystal_spear_0.png", description: "Piercing crystal" },
  { id: "magic_dart", name: "Magic Dart", damageType: "spell", baseDamage: 12, cooldown: 800, projectileSpeed: 600, sprite: "magic_dart_0.png", description: "Quick arcane bolt" },
  { id: "iron_shot", name: "Iron Shot", damageType: "attack", baseDamage: 28, cooldown: 2200, projectileSpeed: 350, sprite: "iron_shot_0.png", description: "Heavy metal slug" },
  { id: "acid_venom", name: "Acid Venom", damageType: "spell", baseDamage: 22, cooldown: 1800, projectileSpeed: 400, sprite: "acid_venom.png", description: "Corrosive spray" },
  { id: "searing_ray", name: "Searing Ray", damageType: "spell", baseDamage: 32, cooldown: 2800, projectileSpeed: 650, sprite: "searing_ray_0.png", description: "Beam of heat" },
  { id: "holy_arrow", name: "Holy Arrow", damageType: "divine", baseDamage: 24, cooldown: 2000, projectileSpeed: 500, sprite: "arrow_0.png", description: "Blessed arrow" },
  { id: "sandblast", name: "Sandblast", damageType: "attack", baseDamage: 15, cooldown: 1000, projectileSpeed: 450, sprite: "sandblast_0.png", description: "Ground shrapnel" },
  { id: "sting", name: "Sting", damageType: "spell", baseDamage: 10, cooldown: 600, projectileSpeed: 550, sprite: "sting_0.png", description: "Venomous sting" },
  { id: "stone_arrow", name: "Stone Arrow", damageType: "attack", baseDamage: 20, cooldown: 1500, projectileSpeed: 500, sprite: "stone_arrow_0.png", description: "Hardened stone bolt" },
  { id: "frost_nova", name: "Frost Nova", damageType: "spell", baseDamage: 28, cooldown: 2500, projectileSpeed: 350, sprite: "frost_0.png", description: "Burst of cold" },
  { id: "javelin_throw", name: "Javelin Throw", damageType: "attack", baseDamage: 26, cooldown: 2000, projectileSpeed: 480, sprite: "javelin_0_new.png", description: "Thrown javelin" },
  { id: "magic_bolt", name: "Magic Bolt", damageType: "spell", baseDamage: 22, cooldown: 1600, projectileSpeed: 520, sprite: "magic_bolt_1.png", description: "Pure arcane energy" },
  { id: "divine_judgment", name: "Divine Judgment", damageType: "divine", baseDamage: 40, cooldown: 3500, projectileSpeed: 400, sprite: "goldaura_0.png", description: "Golden smite" },
  { id: "crossbow_bolt", name: "Crossbow Bolt", damageType: "attack", baseDamage: 16, cooldown: 1000, projectileSpeed: 650, sprite: "crossbow_bolt_0.png", description: "Rapid bolt" },
  { id: "soul_drain", name: "Soul Drain", damageType: "divine", baseDamage: 30, cooldown: 2800, projectileSpeed: 400, sprite: "drain_0_new.png", description: "Life steal bolt" },
  { id: "chaos_orb", name: "Chaos Orb", damageType: "divine", baseDamage: 35, cooldown: 3000, projectileSpeed: 350, sprite: "orb_glow_0.png", description: "Chaotic energy" },
];
