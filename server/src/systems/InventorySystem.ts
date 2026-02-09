import { GameState, Player, InventoryItem, ItemStats } from "../schemas/GameState";
import { ItemDefinition, ITEM_DEFINITIONS } from "../data/items";
import { EQUIPMENT_SLOTS, INVENTORY_SIZE, PLAYER_BASE_HP, PLAYER_BASE_SPEED, PLAYER_BASE_ATTACK_SPEED } from "../data/constants";

export class InventorySystem {
  static handleEquip(playerId: string, inventoryIndex: number, equipmentSlot: number, state: GameState) {
    const player = state.players.get(playerId);
    if (!player || player.isDead) return;

    if (inventoryIndex < 0 || inventoryIndex >= player.inventory.length) return;
    if (equipmentSlot < 0 || equipmentSlot >= EQUIPMENT_SLOTS) return;

    const item = player.inventory[inventoryIndex];
    if (!item || !item.itemId) return;

    // Unequip current item in slot (if occupied)
    const currentEquipped = player.equipment[equipmentSlot];
    if (currentEquipped && currentEquipped.itemId) {
      player.inventory.push(currentEquipped);
    }

    // Equip new item (clone into slot)
    const equippedItem = this.createInventoryItem(
      ITEM_DEFINITIONS.find(d => d.id === item.itemId)!
    );
    player.equipment.setAt(equipmentSlot, equippedItem);
    player.inventory.splice(inventoryIndex, 1);

    this.recalculateStats(playerId, state);
  }

  static handleUnequip(playerId: string, equipmentSlot: number, state: GameState) {
    const player = state.players.get(playerId);
    if (!player || player.isDead) return;

    if (equipmentSlot < 0 || equipmentSlot >= EQUIPMENT_SLOTS) return;
    if (player.inventory.length >= INVENTORY_SIZE) return;

    const item = player.equipment[equipmentSlot];
    if (!item || !item.itemId) return;

    // Move to inventory (clone)
    const invItem = this.createInventoryItem(
      ITEM_DEFINITIONS.find(d => d.id === item.itemId)!
    );
    player.inventory.push(invItem);

    // Replace with empty placeholder
    const empty = new InventoryItem();
    player.equipment.setAt(equipmentSlot, empty);

    this.recalculateStats(playerId, state);
  }

  static recalculateStats(playerId: string, state: GameState) {
    const player = state.players.get(playerId);
    if (!player) return;

    // Reset to base stats
    player.moveSpeed = PLAYER_BASE_SPEED;
    player.attackSpeed = PLAYER_BASE_ATTACK_SPEED;
    player.maxHp = PLAYER_BASE_HP + (player.level - 1) * 20;
    player.rawAttack = 7 + (player.level - 1) * 1;
    player.rawSpell = (player.level - 1) * 1;
    player.increasedDamage = 0;
    player.armour = 0;
    player.magicRes = 0;
    player.percentAttackIncrease = 0;
    player.percentSpellIncrease = 0;
    player.damageBlock = 0;

    // Sum equipment stats
    player.equipment.forEach(item => {
      if (!item || !item.itemId) return;

      player.moveSpeed += item.stats.move_speed || 0;
      player.attackSpeed += item.stats.attack_speed || 0;
      player.rawAttack += item.stats.raw_attack || 0;
      player.rawSpell += item.stats.raw_spell || 0;
      player.increasedDamage += item.stats.increased_damage || 0;
      player.armour += item.stats.armour || 0;
      player.magicRes += item.stats.magic_res || 0;
      player.percentAttackIncrease += item.stats.percent_attack_increase || 0;
      player.percentSpellIncrease += item.stats.percent_spell_increase || 0;
      player.damageBlock += item.stats.damage_block || 0;
    });
  }

  static createInventoryItem(itemDef: ItemDefinition): InventoryItem {
    const item = new InventoryItem();
    item.itemId = itemDef.id;
    item.name = itemDef.name;
    item.tier = itemDef.tier;
    item.color = itemDef.color;

    const stats = new ItemStats();
    stats.move_speed = itemDef.stats.move_speed || 0;
    stats.attack_speed = itemDef.stats.attack_speed || 0;
    stats.raw_attack = itemDef.stats.raw_attack || 0;
    stats.raw_spell = itemDef.stats.raw_spell || 0;
    stats.increased_damage = itemDef.stats.increased_damage || 0;
    stats.armour = itemDef.stats.armour || 0;
    stats.magic_res = itemDef.stats.magic_res || 0;
    stats.percent_attack_increase = itemDef.stats.percent_attack_increase || 0;
    stats.percent_spell_increase = itemDef.stats.percent_spell_increase || 0;
    stats.damage_block = itemDef.stats.damage_block || 0;

    item.stats = stats;

    return item;
  }
}
