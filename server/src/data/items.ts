// Item definitions
export interface ItemDefinition {
  id: string;
  name: string;
  tier: number;
  stats: {
    move_speed?: number;
    attack_speed?: number;
    raw_attack?: number;
    raw_spell?: number;
    increased_damage?: number;
    armour?: number;
    magic_res?: number;
    percent_attack_increase?: number;
    percent_spell_increase?: number;
    damage_block?: number;
  };
  color: string;
  description: string;
}

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  // Tier 1
  { id: "leather_boots", name: "Leather Boots", tier: 1, stats: { move_speed: 10 }, color: "#8b4513", description: "Basic footwear" },
  { id: "cloth_gloves", name: "Cloth Gloves", tier: 1, stats: { attack_speed: 0.05 }, color: "#deb887", description: "Simple gloves" },
  { id: "rusty_sword", name: "Rusty Sword", tier: 1, stats: { raw_attack: 5 }, color: "#cd853f", description: "Old blade" },
  { id: "wooden_wand", name: "Wooden Wand", tier: 1, stats: { raw_spell: 5 }, color: "#8b7355", description: "Beginner wand" },
  { id: "torn_cape", name: "Torn Cape", tier: 1, stats: { increased_damage: 3 }, color: "#696969", description: "Worn cape" },
  { id: "leather_vest", name: "Leather Vest", tier: 1, stats: { armour: 5 }, color: "#a0522d", description: "Light armor" },
  { id: "cloth_robe", name: "Cloth Robe", tier: 1, stats: { magic_res: 5 }, color: "#4682b4", description: "Simple robe" },
  { id: "bronze_ring", name: "Bronze Ring", tier: 1, stats: { percent_attack_increase: 3 }, color: "#cd7f32", description: "Basic ring" },
  { id: "amulet_shard", name: "Amulet Shard", tier: 1, stats: { percent_spell_increase: 3 }, color: "#9370db", description: "Broken amulet" },
  { id: "wooden_shield", name: "Wooden Shield", tier: 1, stats: { damage_block: 2 }, color: "#8b4513", description: "Basic shield" },

  // Tier 2
  { id: "swift_boots", name: "Swift Boots", tier: 2, stats: { move_speed: 25 }, color: "#00bfff", description: "Enhanced boots" },
  { id: "dextrous_gloves", name: "Dextrous Gloves", tier: 2, stats: { attack_speed: 0.12 }, color: "#ff8c00", description: "Quick gloves" },
  { id: "iron_sword", name: "Iron Sword", tier: 2, stats: { raw_attack: 12 }, color: "#c0c0c0", description: "Solid blade" },
  { id: "crystal_wand", name: "Crystal Wand", tier: 2, stats: { raw_spell: 12 }, color: "#00ced1", description: "Magic focus" },
  { id: "warrior_cape", name: "Warrior Cape", tier: 2, stats: { increased_damage: 8 }, color: "#dc143c", description: "Battle cape" },
  { id: "chainmail", name: "Chainmail", tier: 2, stats: { armour: 15 }, color: "#778899", description: "Metal armor" },
  { id: "mage_robe", name: "Mage Robe", tier: 2, stats: { magic_res: 15 }, color: "#6a5acd", description: "Enchanted robe" },
  { id: "silver_ring", name: "Silver Ring", tier: 2, stats: { percent_attack_increase: 8 }, color: "#c0c0c0", description: "Fine ring" },
  { id: "jade_amulet", name: "Jade Amulet", tier: 2, stats: { percent_spell_increase: 8 }, color: "#00fa9a", description: "Mystic amulet" },
  { id: "iron_shield", name: "Iron Shield", tier: 2, stats: { damage_block: 5 }, color: "#708090", description: "Heavy shield" },

  // Tier 3
  { id: "winged_boots", name: "Winged Boots", tier: 3, stats: { move_speed: 45 }, color: "#ffd700", description: "Enchanted footwear" },
  { id: "assassin_gloves", name: "Assassin Gloves", tier: 3, stats: { attack_speed: 0.22 }, color: "#8b0000", description: "Deadly gloves" },
  { id: "steel_sword", name: "Steel Sword", tier: 3, stats: { raw_attack: 22 }, color: "#4682b4", description: "Forged blade" },
  { id: "arcane_staff", name: "Arcane Staff", tier: 3, stats: { raw_spell: 22 }, color: "#9932cc", description: "Powerful staff" },
  { id: "battle_cloak", name: "Battle Cloak", tier: 3, stats: { increased_damage: 15 }, color: "#b22222", description: "Veteran's cloak" },
  { id: "plate_armor", name: "Plate Armor", tier: 3, stats: { armour: 30 }, color: "#2f4f4f", description: "Heavy plate" },
  { id: "silk_robe", name: "Silk Robe", tier: 3, stats: { magic_res: 30 }, color: "#9370db", description: "Masterwork robe" },
  { id: "gold_ring", name: "Gold Ring", tier: 3, stats: { percent_attack_increase: 15 }, color: "#ffd700", description: "Precious ring" },
  { id: "crystal_amulet", name: "Crystal Amulet", tier: 3, stats: { percent_spell_increase: 15 }, color: "#00ffff", description: "Radiant amulet" },
  { id: "tower_shield", name: "Tower Shield", tier: 3, stats: { damage_block: 10 }, color: "#4682b4", description: "Massive shield" },

  // Tier 4
  { id: "phantom_boots", name: "Phantom Boots", tier: 4, stats: { move_speed: 70 }, color: "#9370db", description: "Ghostly speed" },
  { id: "berserker_gloves", name: "Berserker Gloves", tier: 4, stats: { attack_speed: 0.35 }, color: "#ff4500", description: "Furious strikes" },
  { id: "flamebrand_sword", name: "Flamebrand Sword", tier: 4, stats: { raw_attack: 38 }, color: "#ff6347", description: "Burning blade" },
  { id: "void_staff", name: "Void Staff", tier: 4, stats: { raw_spell: 38 }, color: "#4b0082", description: "Dark magic" },
  { id: "titan_cloak", name: "Titan Cloak", tier: 4, stats: { increased_damage: 25 }, color: "#8b008b", description: "Giant's power" },
  { id: "dragon_armor", name: "Dragon Armor", tier: 4, stats: { armour: 50 }, color: "#ff4500", description: "Dragon scales" },
  { id: "archmage_robe", name: "Archmage Robe", tier: 4, stats: { magic_res: 50 }, color: "#4169e1", description: "Master's robe" },
  { id: "platinum_ring", name: "Platinum Ring", tier: 4, stats: { percent_attack_increase: 25 }, color: "#e5e4e2", description: "Rare ring" },
  { id: "soul_amulet", name: "Soul Amulet", tier: 4, stats: { percent_spell_increase: 25 }, color: "#9400d3", description: "Soul power" },
  { id: "aegis_shield", name: "Aegis Shield", tier: 4, stats: { damage_block: 18 }, color: "#4169e1", description: "Legendary shield" },

  // Tier 5
  { id: "godspeed_boots", name: "Godspeed Boots", tier: 5, stats: { move_speed: 100 }, color: "#ff00ff", description: "Divine swiftness" },
  { id: "infinity_gloves", name: "Infinity Gloves", tier: 5, stats: { attack_speed: 0.5 }, color: "#00ffff", description: "Endless assault" },
  { id: "excalibur", name: "Excalibur", tier: 5, stats: { raw_attack: 60 }, color: "#ffd700", description: "Legendary sword" },
  { id: "celestial_staff", name: "Celestial Staff", tier: 5, stats: { raw_spell: 60 }, color: "#ffffff", description: "Cosmic power" },
  { id: "overlord_cape", name: "Overlord Cape", tier: 5, stats: { increased_damage: 40 }, color: "#ff0000", description: "Supreme power" },
  { id: "immortal_plate", name: "Immortal Plate", tier: 5, stats: { armour: 80 }, color: "#ffd700", description: "Invincible armor" },
  { id: "eternal_robe", name: "Eternal Robe", tier: 5, stats: { magic_res: 80 }, color: "#ff1493", description: "Eternal protection" },
  { id: "divine_ring", name: "Divine Ring", tier: 5, stats: { percent_attack_increase: 40 }, color: "#ffff00", description: "God's blessing" },
  { id: "chaos_amulet", name: "Chaos Amulet", tier: 5, stats: { percent_spell_increase: 40 }, color: "#8b00ff", description: "Chaos magic" },
  { id: "bastion_shield", name: "Bastion Shield", tier: 5, stats: { damage_block: 30 }, color: "#ffd700", description: "Ultimate defense" },
];
