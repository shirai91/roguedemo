import { Room, Client } from "colyseus";
import { GameState, Player, InventoryItem, PlayerSkill } from "../schemas/GameState";
import { PlayerInput, MonsterState, ProjectileState, PlayerState } from "../data/constants";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  MAX_MONSTERS,
  PLAYER_BASE_HP,
  PLAYER_BASE_SPEED,
  PLAYER_BASE_ATTACK_SPEED,
  TICK_RATE,
  EQUIPMENT_SLOTS,
  PLAYER_RESPAWN_DELAY,
  ITEM_PICKUP_RANGE,
  INVENTORY_SIZE,
  MAX_SKILLS,
} from "../data/constants";
import { ITEM_DEFINITIONS } from "../data/items";
import { SKILL_DEFINITIONS } from "../data/skills";
import { CombatSystem } from "../systems/CombatSystem";
import { LootSystem } from "../systems/LootSystem";
import { MonsterAI } from "../systems/MonsterAI";
import { MovementSystem } from "../systems/MovementSystem";
import { SkillSystem } from "../systems/SkillSystem";
import { InventorySystem } from "../systems/InventorySystem";

export class GameRoom extends Room<GameState> {
  private playerInputs = new Map<string, PlayerInput>();
  private monsterStates = new Map<string, MonsterState>();
  private projectileStates = new Map<string, ProjectileState>();
  private playerStates = new Map<string, PlayerState>();

  // System instances
  private lootSystem = new LootSystem();
  private monsterAI = new MonsterAI();
  private movementSystem = new MovementSystem();
  private skillSystem = new SkillSystem();

  onCreate(options: any) {
    this.setState(new GameState());

    console.log("[GameRoom] Room created, spawning initial monsters");

    // Spawn initial monsters
    for (let i = 0; i < MAX_MONSTERS; i++) {
      this.monsterAI.spawnMonster(this.state, this.monsterStates);
    }

    // Setup message handlers (once, not per-client)
    this.onMessage("input", (client, message) => {
      this.playerInputs.set(client.sessionId, message);
    });

    this.onMessage("pickup", (client, message) => {
      this.lootSystem.handlePickup(client.sessionId, message.instanceId, this.state);
    });

    this.onMessage("equip", (client, message) => {
      InventorySystem.handleEquip(client.sessionId, message.inventoryIndex, message.slotIndex, this.state);
    });

    this.onMessage("unequip", (client, message) => {
      InventorySystem.handleUnequip(client.sessionId, message.slotIndex, this.state);
    });

    this.onMessage("levelSkill", (client, message) => {
      this.skillSystem.handleLevelSkill(client.sessionId, message.slotIndex, this.state);
    });

    this.onMessage("ping", (client, message) => {
      client.send("pong", { timestamp: message.timestamp });
    });

    // Start game loop
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), TICK_RATE);
  }

  onJoin(client: Client, options: any) {
    console.log(`[GameRoom] Client ${client.sessionId} joined`);

    const player = new Player();
    player.x = Math.random() * MAP_WIDTH;
    player.y = Math.random() * MAP_HEIGHT;
    player.hp = PLAYER_BASE_HP;
    player.maxHp = PLAYER_BASE_HP;
    player.moveSpeed = PLAYER_BASE_SPEED;
    player.attackSpeed = PLAYER_BASE_ATTACK_SPEED;
    player.rawAttack = 7;
    player.level = 1;
    player.xp = 0;
    player.xpToNext = 100;
    player.isDead = false;
    player.name = options.name || `Player_${client.sessionId.substring(0, 4)}`;

    // Initialize equipment with 6 empty placeholder items
    for (let i = 0; i < EQUIPMENT_SLOTS; i++) {
      const empty = new InventoryItem();
      player.equipment.push(empty);
    }

    // Give 1 random starting skill
    const randomSkillDef = SKILL_DEFINITIONS[Math.floor(Math.random() * SKILL_DEFINITIONS.length)];
    const startingSkill = new PlayerSkill();
    startingSkill.skillId = randomSkillDef.id;
    startingSkill.level = 1;
    player.skills.push(startingSkill);

    this.state.players.set(client.sessionId, player);

    this.playerStates.set(client.sessionId, {
      lastShootTime: 0,
      deathTime: 0,
      skillCooldowns: new Map(),
    });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`[GameRoom] Client ${client.sessionId} left`);

    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Drop all inventory items
      player.inventory.forEach(item => {
        if (item && item.itemId) {
          this.lootSystem.dropItem(item.itemId, player.x, player.y, this.state);
        }
      });

      // Drop all equipped items
      player.equipment.forEach(item => {
        if (item && item.itemId) {
          this.lootSystem.dropItem(item.itemId, player.x, player.y, this.state);
        }
      });

      this.state.players.delete(client.sessionId);
    }

    this.playerInputs.delete(client.sessionId);
    this.playerStates.delete(client.sessionId);
  }

  update(deltaTime: number) {
    const dt = deltaTime / 1000; // Convert to seconds
    const now = Date.now();

    // Handle player respawn
    this.state.players.forEach((player, sessionId) => {
      const playerState = this.playerStates.get(sessionId);
      if (!playerState) return;

      if (player.isDead) {
        if (now - playerState.deathTime >= PLAYER_RESPAWN_DELAY) {
          player.isDead = false;
          player.x = Math.random() * MAP_WIDTH;
          player.y = Math.random() * MAP_HEIGHT;

          // Full reset on death
          player.level = 1;
          player.xp = 0;
          player.xpToNext = 100;
          player.skillPoints = 0;

          // Clear all skills
          player.skills.splice(0, player.skills.length);

          // Clear all inventory
          player.inventory.splice(0, player.inventory.length);

          // Clear all equipment (replace with empty placeholders)
          for (let i = 0; i < EQUIPMENT_SLOTS; i++) {
            player.equipment.setAt(i, new InventoryItem());
          }

          // Reset stats to base level 1 values
          player.hp = PLAYER_BASE_HP;
          player.maxHp = PLAYER_BASE_HP;
          player.moveSpeed = PLAYER_BASE_SPEED;
          player.attackSpeed = PLAYER_BASE_ATTACK_SPEED;
          player.rawAttack = 7;
          player.rawSpell = 0;
          player.increasedDamage = 0;
          player.armour = 0;
          player.magicRes = 0;
          player.percentAttackIncrease = 0;
          player.percentSpellIncrease = 0;
          player.damageBlock = 0;

          // Give 1 random starting skill
          const randomSkillDef = SKILL_DEFINITIONS[Math.floor(Math.random() * SKILL_DEFINITIONS.length)];
          const startingSkill = new PlayerSkill();
          startingSkill.skillId = randomSkillDef.id;
          startingSkill.level = 1;
          player.skills.push(startingSkill);

          // Reset skill cooldowns
          playerState.skillCooldowns.clear();
        }
      }
    });

    // Update systems in order
    this.movementSystem.updatePlayers(dt, now, this.state, this.playerInputs, this.playerStates, this.projectileStates);

    this.movementSystem.updateProjectiles(dt, now, this.state, this.projectileStates, this.lootSystem, this.monsterStates, this.playerStates);

    this.monsterAI.updateMonsters(dt, now, this.state, this.monsterStates, this.playerStates, this.projectileStates);

    this.skillSystem.updateSkillAutoCast(now, this.state, this.playerStates, this.movementSystem, this.projectileStates);

    // Check item pickups (auto-pickup)
    this.state.players.forEach((player, sessionId) => {
      if (player.isDead) return;

      this.state.droppedItems.forEach((item, instanceId) => {
        const dist = CombatSystem.distance(player.x, player.y, item.x, item.y);
        if (dist <= ITEM_PICKUP_RANGE) {
          // Auto-pickup
          if (player.inventory.length < INVENTORY_SIZE) {
            const itemDef = ITEM_DEFINITIONS.find(i => i.id === item.itemId);
            if (itemDef) {
              const invItem = InventorySystem.createInventoryItem(itemDef);
              player.inventory.push(invItem);
              this.state.droppedItems.delete(instanceId);
            }
          }
        }
      });
    });

    // Check skill pickups (auto-pickup)
    this.state.players.forEach((player, sessionId) => {
      if (player.isDead) return;

      this.state.droppedSkills.forEach((droppedSkill, instanceId) => {
        const dist = CombatSystem.distance(player.x, player.y, droppedSkill.x, droppedSkill.y);
        if (dist <= ITEM_PICKUP_RANGE) {
          // Check max 5 skills
          if (player.skills.length >= MAX_SKILLS) return;
          // Check no duplicates
          let hasDuplicate = false;
          player.skills.forEach((ps) => {
            if (ps.skillId === droppedSkill.skillId) hasDuplicate = true;
          });
          if (hasDuplicate) return;

          const newSkill = new PlayerSkill();
          newSkill.skillId = droppedSkill.skillId;
          newSkill.level = 1;
          player.skills.push(newSkill);
          this.state.droppedSkills.delete(instanceId);
        }
      });
    });
  }
}
