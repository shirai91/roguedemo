import { GameState, DroppedItem, DroppedSkill } from "../schemas/GameState";
import { ITEM_DEFINITIONS } from "../data/items";
import { SKILL_DEFINITIONS } from "../data/skills";
import { ITEM_PICKUP_RANGE, INVENTORY_SIZE } from "../data/constants";
import { InventorySystem } from "./InventorySystem";

export class LootSystem {
  private itemInstanceCounter = 0;
  private skillInstanceCounter = 0;

  dropItem(itemId: string, x: number, y: number, state: GameState) {
    const instanceId = `item_${this.itemInstanceCounter++}`;
    const itemDef = ITEM_DEFINITIONS.find(i => i.id === itemId);
    if (!itemDef) return;

    const droppedItem = new DroppedItem();
    droppedItem.instanceId = instanceId;
    droppedItem.itemId = itemId;
    droppedItem.name = itemDef.name;
    droppedItem.tier = itemDef.tier;
    droppedItem.x = x + (Math.random() * 40 - 20);
    droppedItem.y = y + (Math.random() * 40 - 20);
    droppedItem.color = itemDef.color;

    state.droppedItems.set(instanceId, droppedItem);
  }

  dropItemByMonsterLevel(monsterLevel: number, x: number, y: number, state: GameState) {
    const tier = Math.min(5, Math.max(1, Math.floor(monsterLevel / 5) + 1));
    const tierItems = ITEM_DEFINITIONS.filter(i => i.tier === tier);

    if (tierItems.length > 0) {
      const itemDef = tierItems[Math.floor(Math.random() * tierItems.length)];
      this.dropItem(itemDef.id, x, y, state);
    }
  }

  dropSkill(skillId: string, x: number, y: number, state: GameState) {
    const instanceId = `skill_${this.skillInstanceCounter++}`;
    const droppedSkill = new DroppedSkill();
    droppedSkill.instanceId = instanceId;
    droppedSkill.skillId = skillId;
    droppedSkill.x = x + (Math.random() * 40 - 20);
    droppedSkill.y = y + (Math.random() * 40 - 20);
    state.droppedSkills.set(instanceId, droppedSkill);
  }

  dropRandomSkill(x: number, y: number, state: GameState) {
    const skillDef = SKILL_DEFINITIONS[Math.floor(Math.random() * SKILL_DEFINITIONS.length)];
    this.dropSkill(skillDef.id, x, y, state);
  }

  handlePickup(playerId: string, instanceId: string, state: GameState) {
    const player = state.players.get(playerId);
    const item = state.droppedItems.get(instanceId);

    if (!player || !item || player.isDead) return;

    const dist = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);
    if (dist > ITEM_PICKUP_RANGE) return;

    if (player.inventory.length >= INVENTORY_SIZE) return;

    const itemDef = ITEM_DEFINITIONS.find(i => i.id === item.itemId);
    if (!itemDef) return;

    const invItem = InventorySystem.createInventoryItem(itemDef);
    player.inventory.push(invItem);
    state.droppedItems.delete(instanceId);
  }
}
