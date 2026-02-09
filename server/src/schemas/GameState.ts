import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

// ALL schemas in ONE file to avoid circular dependencies

export class PlayerSkill extends Schema {
  @type("string") skillId: string = "";
  @type("uint8") level: number = 1;
}

export class DroppedSkill extends Schema {
  @type("string") instanceId: string = "";
  @type("string") skillId: string = "";
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
}

// Stats stored on items
export class ItemStats extends Schema {
  @type("float32") move_speed: number = 0;
  @type("float32") attack_speed: number = 0;
  @type("float32") raw_attack: number = 0;
  @type("float32") raw_spell: number = 0;
  @type("float32") increased_damage: number = 0;
  @type("float32") armour: number = 0;
  @type("float32") magic_res: number = 0;
  @type("float32") percent_attack_increase: number = 0;
  @type("float32") percent_spell_increase: number = 0;
  @type("float32") damage_block: number = 0;
}

export class InventoryItem extends Schema {
  @type("string") itemId: string = "";
  @type("string") name: string = "";
  @type("uint8") tier: number = 0;
  @type("string") color: string = "";
  @type(ItemStats) stats: ItemStats = new ItemStats();
}

export class Player extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("float32") hp: number = 100;
  @type("float32") maxHp: number = 100;
  @type("float32") armour: number = 0;
  @type("float32") magicRes: number = 0;
  @type("float32") attackSpeed: number = 1.0;
  @type("float32") moveSpeed: number = 200;
  @type("float32") rawAttack: number = 10;
  @type("float32") rawSpell: number = 0;
  @type("float32") increasedDamage: number = 0;
  @type("float32") percentAttackIncrease: number = 0;
  @type("float32") percentSpellIncrease: number = 0;
  @type("float32") damageBlock: number = 0;
  @type("uint16") level: number = 1;
  @type("uint32") xp: number = 0;
  @type("uint32") xpToNext: number = 100;
  @type("boolean") isDead: boolean = false;
  @type("string") name: string = "";
  // Equipment: 6 slots
  @type([InventoryItem]) equipment = new ArraySchema<InventoryItem>();
  @type([InventoryItem]) inventory = new ArraySchema<InventoryItem>();
  // Skills: max 5
  @type([PlayerSkill]) skills = new ArraySchema<PlayerSkill>();
  @type("uint16") skillPoints: number = 0;
}

export class Monster extends Schema {
  @type("string") monsterId: string = "";
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("float32") hp: number = 50;
  @type("float32") maxHp: number = 50;
  @type("string") monsterType: string = "";
  @type("uint8") level: number = 1;
  @type("string") rarity: string = "normal";  // normal, magic, rare
  @type("string") state: string = "patrol";
  @type("float32") size: number = 20;
  @type("string") color: string = "#ff0000";
}

export class Projectile extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("float32") angle: number = 0;
  @type("string") ownerId: string = "";
  @type("string") damageType: string = "attack";
  @type("boolean") isPlayerProjectile: boolean = true;
  @type("boolean") isMonsterProjectile: boolean = false;
  @type("string") skillId: string = "";
  @type("string") spriteKey: string = "";
}

export class DroppedItem extends Schema {
  @type("string") instanceId: string = "";
  @type("string") itemId: string = "";
  @type("string") name: string = "";
  @type("uint8") tier: number = 0;
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("string") color: string = "#ffffff";
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type({ map: Projectile }) projectiles = new MapSchema<Projectile>();
  @type({ map: DroppedItem }) droppedItems = new MapSchema<DroppedItem>();
  @type({ map: DroppedSkill }) droppedSkills = new MapSchema<DroppedSkill>();
}
