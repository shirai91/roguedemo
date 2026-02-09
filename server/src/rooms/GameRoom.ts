import { Room, Client } from "colyseus";
import { GameState, Player, Monster, Projectile, DroppedItem, InventoryItem, ItemStats } from "../schemas/GameState";

// Game constants
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const MAX_MONSTERS = 50;
const PLAYER_BASE_HP = 100;
const PLAYER_BASE_SPEED = 200;
const PLAYER_BASE_ATTACK_SPEED = 1.0;
const PROJECTILE_SPEED = 500;
const PROJECTILE_LIFETIME = 2000;
const MONSTER_CHASE_RANGE = 300;
const MONSTER_ATTACK_RANGE = 50;
const TICK_RATE = 50; // 50ms = 20 ticks per second
const EQUIPMENT_SLOTS = 6;
const INVENTORY_SIZE = 20;
const MONSTER_RESPAWN_DELAY = 3000;
const PLAYER_RESPAWN_DELAY = 5000;
const ITEM_PICKUP_RANGE = 50;

// Monster type definitions
interface MonsterType {
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
}

const MONSTER_TYPES: MonsterType[] = [
  { type: "slime", name: "Slime", baseHp: 30, baseDamage: 5, damageType: "attack", baseSpeed: 80, baseArmour: 0, baseMagicRes: 0, chaseRange: 250, attackRange: 40, attackSpeed: 1.0, color: "#00ff00", size: 15, xpReward: 10, minLevel: 1, maxLevel: 3 },
  { type: "bat", name: "Bat", baseHp: 20, baseDamage: 8, damageType: "attack", baseSpeed: 180, baseArmour: 0, baseMagicRes: 5, chaseRange: 350, attackRange: 35, attackSpeed: 1.5, color: "#4a4a4a", size: 12, xpReward: 15, minLevel: 1, maxLevel: 4 },
  { type: "imp", name: "Imp", baseHp: 35, baseDamage: 12, damageType: "spell", baseSpeed: 120, baseArmour: 0, baseMagicRes: 10, chaseRange: 300, attackRange: 60, attackSpeed: 0.8, color: "#ff6600", size: 18, xpReward: 20, minLevel: 2, maxLevel: 5 },
  { type: "spider", name: "Spider", baseHp: 45, baseDamage: 10, damageType: "attack", baseSpeed: 140, baseArmour: 5, baseMagicRes: 0, chaseRange: 280, attackRange: 45, attackSpeed: 1.2, color: "#8b4513", size: 20, xpReward: 25, minLevel: 3, maxLevel: 6 },
  { type: "skeleton", name: "Skeleton", baseHp: 60, baseDamage: 15, damageType: "attack", baseSpeed: 100, baseArmour: 15, baseMagicRes: 5, chaseRange: 300, attackRange: 50, attackSpeed: 1.0, color: "#e0e0e0", size: 22, xpReward: 35, minLevel: 4, maxLevel: 8 },
  { type: "goblin", name: "Goblin", baseHp: 50, baseDamage: 18, damageType: "attack", baseSpeed: 160, baseArmour: 8, baseMagicRes: 2, chaseRange: 320, attackRange: 48, attackSpeed: 1.3, color: "#228b22", size: 20, xpReward: 30, minLevel: 4, maxLevel: 7 },
  { type: "wolf", name: "Wolf", baseHp: 55, baseDamage: 20, damageType: "attack", baseSpeed: 200, baseArmour: 5, baseMagicRes: 0, chaseRange: 400, attackRange: 45, attackSpeed: 1.5, color: "#696969", size: 22, xpReward: 40, minLevel: 5, maxLevel: 9 },
  { type: "zombie", name: "Zombie", baseHp: 100, baseDamage: 25, damageType: "attack", baseSpeed: 70, baseArmour: 10, baseMagicRes: 15, chaseRange: 250, attackRange: 50, attackSpeed: 0.7, color: "#556b2f", size: 24, xpReward: 50, minLevel: 6, maxLevel: 10 },
  { type: "ghost", name: "Ghost", baseHp: 70, baseDamage: 30, damageType: "spell", baseSpeed: 130, baseArmour: 0, baseMagicRes: 25, chaseRange: 350, attackRange: 70, attackSpeed: 1.0, color: "#9370db", size: 20, xpReward: 60, minLevel: 7, maxLevel: 12 },
  { type: "orc", name: "Orc", baseHp: 120, baseDamage: 35, damageType: "attack", baseSpeed: 110, baseArmour: 20, baseMagicRes: 5, chaseRange: 300, attackRange: 55, attackSpeed: 0.9, color: "#8b0000", size: 28, xpReward: 70, minLevel: 8, maxLevel: 13 },
  { type: "wraith", name: "Wraith", baseHp: 90, baseDamage: 40, damageType: "spell", baseSpeed: 140, baseArmour: 5, baseMagicRes: 30, chaseRange: 350, attackRange: 75, attackSpeed: 1.1, color: "#483d8b", size: 22, xpReward: 80, minLevel: 9, maxLevel: 14 },
  { type: "harpy", name: "Harpy", baseHp: 80, baseDamage: 38, damageType: "attack", baseSpeed: 170, baseArmour: 8, baseMagicRes: 12, chaseRange: 380, attackRange: 65, attackSpeed: 1.4, color: "#ff1493", size: 24, xpReward: 85, minLevel: 10, maxLevel: 15 },
  { type: "troll", name: "Troll", baseHp: 180, baseDamage: 45, damageType: "attack", baseSpeed: 90, baseArmour: 30, baseMagicRes: 10, chaseRange: 280, attackRange: 60, attackSpeed: 0.8, color: "#2f4f4f", size: 32, xpReward: 100, minLevel: 11, maxLevel: 16 },
  { type: "demon", name: "Demon", baseHp: 140, baseDamage: 55, damageType: "attack", baseSpeed: 150, baseArmour: 15, baseMagicRes: 20, chaseRange: 350, attackRange: 55, attackSpeed: 1.2, color: "#8b0000", size: 30, xpReward: 120, minLevel: 12, maxLevel: 18 },
  { type: "basilisk", name: "Basilisk", baseHp: 160, baseDamage: 50, damageType: "spell", baseSpeed: 100, baseArmour: 25, baseMagicRes: 35, chaseRange: 320, attackRange: 80, attackSpeed: 1.0, color: "#006400", size: 28, xpReward: 130, minLevel: 13, maxLevel: 19 },
  { type: "minotaur", name: "Minotaur", baseHp: 200, baseDamage: 60, damageType: "attack", baseSpeed: 120, baseArmour: 35, baseMagicRes: 15, chaseRange: 300, attackRange: 58, attackSpeed: 1.0, color: "#8b4513", size: 35, xpReward: 150, minLevel: 14, maxLevel: 20 },
  { type: "lich", name: "Lich", baseHp: 150, baseDamage: 70, damageType: "spell", baseSpeed: 110, baseArmour: 10, baseMagicRes: 50, chaseRange: 400, attackRange: 100, attackSpeed: 0.9, color: "#4b0082", size: 26, xpReward: 180, minLevel: 15, maxLevel: 22 },
  { type: "drake", name: "Drake", baseHp: 250, baseDamage: 65, damageType: "spell", baseSpeed: 130, baseArmour: 40, baseMagicRes: 30, chaseRange: 350, attackRange: 85, attackSpeed: 1.1, color: "#ff4500", size: 40, xpReward: 200, minLevel: 16, maxLevel: 24 },
  { type: "golem", name: "Golem", baseHp: 350, baseDamage: 55, damageType: "attack", baseSpeed: 60, baseArmour: 60, baseMagicRes: 40, chaseRange: 250, attackRange: 65, attackSpeed: 0.6, color: "#708090", size: 45, xpReward: 220, minLevel: 17, maxLevel: 25 },
  { type: "hydra", name: "Hydra", baseHp: 400, baseDamage: 80, damageType: "divine", baseSpeed: 100, baseArmour: 45, baseMagicRes: 45, chaseRange: 380, attackRange: 90, attackSpeed: 1.0, color: "#8b008b", size: 50, xpReward: 300, minLevel: 18, maxLevel: 30 },
];

// Item definitions
interface ItemDefinition {
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

const ITEM_DEFINITIONS: ItemDefinition[] = [
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

interface PlayerInput {
  dx: number;
  dy: number;
  shooting: boolean;
  angle: number;
}

interface MonsterState {
  lastAttackTime: number;
  patrolTargetX: number;
  patrolTargetY: number;
  targetPlayerId: string | null;
  deathTime: number;
}

interface ProjectileState {
  createdAt: number;
  damage: number;
}

interface PlayerState {
  lastShootTime: number;
  deathTime: number;
}

export class GameRoom extends Room<GameState> {
  private playerInputs = new Map<string, PlayerInput>();
  private monsterStates = new Map<string, MonsterState>();
  private projectileStates = new Map<string, ProjectileState>();
  private playerStates = new Map<string, PlayerState>();
  private monsterIdCounter = 0;
  private projectileIdCounter = 0;
  private itemInstanceCounter = 0;

  onCreate(options: any) {
    this.setState(new GameState());

    console.log("[GameRoom] Room created, spawning initial monsters");

    // Spawn initial monsters
    for (let i = 0; i < MAX_MONSTERS; i++) {
      this.spawnMonster();
    }

    // Setup message handlers (once, not per-client)
    this.onMessage("input", (client, message) => {
      this.playerInputs.set(client.sessionId, message);
    });

    this.onMessage("pickup", (client, message) => {
      this.handlePickup(client.sessionId, message.instanceId);
    });

    this.onMessage("equip", (client, message) => {
      this.handleEquip(client.sessionId, message.inventoryIndex, message.slotIndex);
    });

    this.onMessage("unequip", (client, message) => {
      this.handleUnequip(client.sessionId, message.slotIndex);
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

    this.state.players.set(client.sessionId, player);

    this.playerStates.set(client.sessionId, {
      lastShootTime: 0,
      deathTime: 0,
    });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`[GameRoom] Client ${client.sessionId} left`);

    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Drop all inventory items
      player.inventory.forEach(item => {
        if (item && item.itemId) {
          this.dropItem(item.itemId, player.x, player.y);
        }
      });

      // Drop all equipped items
      player.equipment.forEach(item => {
        if (item && item.itemId) {
          this.dropItem(item.itemId, player.x, player.y);
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

    // Update players
    this.state.players.forEach((player, sessionId) => {
      const input = this.playerInputs.get(sessionId);
      const playerState = this.playerStates.get(sessionId);

      if (!playerState) return;

      // Handle respawn
      if (player.isDead) {
        if (now - playerState.deathTime >= PLAYER_RESPAWN_DELAY) {
          player.isDead = false;
          player.hp = player.maxHp;
          player.x = Math.random() * MAP_WIDTH;
          player.y = Math.random() * MAP_HEIGHT;
        }
        return;
      }

      if (!input) return;

      // Movement using dx/dy from client (-1, 0, 1)
      let dx = input.dx || 0;
      let dy = input.dy || 0;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
      }

      player.x += dx * player.moveSpeed * dt;
      player.y += dy * player.moveSpeed * dt;

      // Clamp to map bounds
      player.x = Math.max(0, Math.min(MAP_WIDTH, player.x));
      player.y = Math.max(0, Math.min(MAP_HEIGHT, player.y));

      // Shooting - client sends angle directly
      if (input.shooting) {
        const cooldown = 1000 / player.attackSpeed;
        if (now - playerState.lastShootTime >= cooldown) {
          const targetX = player.x + Math.cos(input.angle) * 100;
          const targetY = player.y + Math.sin(input.angle) * 100;
          this.createProjectile(player.x, player.y, targetX, targetY, sessionId, "attack", true);
          playerState.lastShootTime = now;
        }
      }
    });

    // Update projectiles
    this.state.projectiles.forEach((projectile, id) => {
      const state = this.projectileStates.get(id);
      if (!state) {
        this.state.projectiles.delete(id);
        return;
      }

      // Check lifetime
      if (now - state.createdAt >= PROJECTILE_LIFETIME) {
        this.state.projectiles.delete(id);
        this.projectileStates.delete(id);
        return;
      }

      // Move projectile
      const dx = Math.cos(projectile.angle) * PROJECTILE_SPEED * dt;
      const dy = Math.sin(projectile.angle) * PROJECTILE_SPEED * dt;

      projectile.x += dx;
      projectile.y += dy;

      // Check map bounds
      if (projectile.x < 0 || projectile.x > MAP_WIDTH || projectile.y < 0 || projectile.y > MAP_HEIGHT) {
        this.state.projectiles.delete(id);
        this.projectileStates.delete(id);
        return;
      }

      // Check collisions
      if (projectile.isPlayerProjectile) {
        // Check monster collisions
        this.state.monsters.forEach((monster, monsterId) => {
          if (this.checkCollision(projectile.x, projectile.y, 5, monster.x, monster.y, monster.size)) {
            this.damageMonster(monsterId, state.damage, projectile.ownerId, projectile.damageType);
            this.state.projectiles.delete(id);
            this.projectileStates.delete(id);
          }
        });

        // Check other player collisions (PVP)
        this.state.players.forEach((otherPlayer, otherId) => {
          if (otherId !== projectile.ownerId && !otherPlayer.isDead) {
            if (this.checkCollision(projectile.x, projectile.y, 5, otherPlayer.x, otherPlayer.y, 20)) {
              this.damagePlayer(otherId, state.damage, projectile.damageType);
              this.state.projectiles.delete(id);
              this.projectileStates.delete(id);
            }
          }
        });
      }
    });

    // Update monsters
    this.state.monsters.forEach((monster, monsterId) => {
      const monsterState = this.monsterStates.get(monsterId);
      if (!monsterState) return;

      // Handle respawn
      if (monster.hp <= 0) {
        if (now - monsterState.deathTime >= MONSTER_RESPAWN_DELAY) {
          this.respawnMonster(monsterId);
        }
        return;
      }

      const monsterType = MONSTER_TYPES.find(t => t.type === monster.monsterType);
      if (!monsterType) return;

      // Find nearest player
      let nearestPlayer: Player | null = null;
      let nearestDistance = Infinity;

      this.state.players.forEach((player) => {
        if (player.isDead) return;
        const dist = this.distance(monster.x, monster.y, player.x, player.y);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestPlayer = player;
        }
      });

      // AI behavior
      if (nearestPlayer && nearestDistance <= monsterType.chaseRange) {
        // Chase mode
        monster.state = "chase";
        monsterState.targetPlayerId = Array.from(this.state.players.entries())
          .find(([_, p]) => p === nearestPlayer)?.[0] || null;

        if (nearestDistance <= monsterType.attackRange) {
          // Attack
          const cooldown = 1000 / monsterType.attackSpeed;
          if (now - monsterState.lastAttackTime >= cooldown) {
            this.damagePlayer(monsterState.targetPlayerId!, monsterType.baseDamage * (1 + (monster.level - 1) * 0.1), monsterType.damageType);
            monsterState.lastAttackTime = now;
          }
        } else {
          // Move towards player
          const np = nearestPlayer as Player;
          const dx = (np.x - monster.x) / nearestDistance;
          const dy = (np.y - monster.y) / nearestDistance;

          monster.x += dx * monsterType.baseSpeed * dt;
          monster.y += dy * monsterType.baseSpeed * dt;
        }
      } else {
        // Patrol mode
        monster.state = "patrol";
        monsterState.targetPlayerId = null;

        const distToPatrol = this.distance(monster.x, monster.y, monsterState.patrolTargetX, monsterState.patrolTargetY);

        if (distToPatrol < 20) {
          // Reached patrol point, pick new one
          monsterState.patrolTargetX = Math.random() * MAP_WIDTH;
          monsterState.patrolTargetY = Math.random() * MAP_HEIGHT;
        } else {
          // Move towards patrol point
          const dx = (monsterState.patrolTargetX - monster.x) / distToPatrol;
          const dy = (monsterState.patrolTargetY - monster.y) / distToPatrol;

          monster.x += dx * monsterType.baseSpeed * 0.5 * dt;
          monster.y += dy * monsterType.baseSpeed * 0.5 * dt;
        }
      }

      // Clamp to map bounds
      monster.x = Math.max(0, Math.min(MAP_WIDTH, monster.x));
      monster.y = Math.max(0, Math.min(MAP_HEIGHT, monster.y));
    });

    // Check item pickups
    this.state.players.forEach((player, sessionId) => {
      if (player.isDead) return;

      this.state.droppedItems.forEach((item, instanceId) => {
        const dist = this.distance(player.x, player.y, item.x, item.y);
        if (dist <= ITEM_PICKUP_RANGE) {
          // Auto-pickup
          if (player.inventory.length < INVENTORY_SIZE) {
            const itemDef = ITEM_DEFINITIONS.find(i => i.id === item.itemId);
            if (itemDef) {
              const invItem = this.createInventoryItem(itemDef);
              player.inventory.push(invItem);
              this.state.droppedItems.delete(instanceId);
            }
          }
        }
      });
    });
  }

  spawnMonster() {
    const monsterId = `monster_${this.monsterIdCounter++}`;

    // Select random monster type weighted by level
    const monsterType = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];

    // Random level within range
    const level = Math.floor(Math.random() * (monsterType.maxLevel - monsterType.minLevel + 1)) + monsterType.minLevel;

    // Random rarity
    const rarityRoll = Math.random();
    let rarity = "normal";
    let rarityMultiplier = 1.0;

    if (rarityRoll >= 0.95) {
      rarity = "rare";
      rarityMultiplier = 2.5;
    } else if (rarityRoll >= 0.70) {
      rarity = "magic";
      rarityMultiplier = 1.5;
    }

    const monster = new Monster();
    monster.monsterId = monsterId;
    monster.x = Math.random() * MAP_WIDTH;
    monster.y = Math.random() * MAP_HEIGHT;
    monster.monsterType = monsterType.type;
    monster.level = level;
    monster.rarity = rarity;
    monster.maxHp = Math.round(monsterType.baseHp * (1 + (level - 1) * 0.1) * rarityMultiplier);
    monster.hp = monster.maxHp;
    monster.state = "patrol";
    monster.size = monsterType.size;
    monster.color = monsterType.color;

    this.state.monsters.set(monsterId, monster);

    this.monsterStates.set(monsterId, {
      lastAttackTime: 0,
      patrolTargetX: Math.random() * MAP_WIDTH,
      patrolTargetY: Math.random() * MAP_HEIGHT,
      targetPlayerId: null,
      deathTime: 0,
    });
  }

  respawnMonster(monsterId: string) {
    const monster = this.state.monsters.get(monsterId);
    if (!monster) return;

    const monsterType = MONSTER_TYPES.find(t => t.type === monster.monsterType);
    if (!monsterType) return;

    // Reset monster
    monster.x = Math.random() * MAP_WIDTH;
    monster.y = Math.random() * MAP_HEIGHT;
    monster.hp = monster.maxHp;
    monster.state = "patrol";

    const monsterState = this.monsterStates.get(monsterId);
    if (monsterState) {
      monsterState.patrolTargetX = Math.random() * MAP_WIDTH;
      monsterState.patrolTargetY = Math.random() * MAP_HEIGHT;
      monsterState.targetPlayerId = null;
      monsterState.lastAttackTime = 0;
    }
  }

  createProjectile(x: number, y: number, targetX: number, targetY: number, ownerId: string, damageType: string, isPlayerProjectile: boolean) {
    const projectileId = `projectile_${this.projectileIdCounter++}`;

    const angle = Math.atan2(targetY - y, targetX - x);

    const projectile = new Projectile();
    projectile.x = x;
    projectile.y = y;
    projectile.angle = angle;
    projectile.ownerId = ownerId;
    projectile.damageType = damageType;
    projectile.isPlayerProjectile = isPlayerProjectile;

    this.state.projectiles.set(projectileId, projectile);

    // Calculate damage
    let damage = 0;
    if (isPlayerProjectile) {
      const player = this.state.players.get(ownerId);
      if (player) {
        damage = this.calculatePlayerDamage(player, damageType);
      }
    }

    this.projectileStates.set(projectileId, {
      createdAt: Date.now(),
      damage: damage,
    });
  }

  calculatePlayerDamage(player: Player, damageType: string): number {
    let baseDamage = 0;

    if (damageType === "attack") {
      baseDamage = player.rawAttack;
      baseDamage *= (1 + player.percentAttackIncrease / 100);
    } else if (damageType === "spell") {
      baseDamage = player.rawSpell;
      baseDamage *= (1 + player.percentSpellIncrease / 100);
    }

    baseDamage *= (1 + player.increasedDamage / 100);
    baseDamage *= (1 + (player.level - 1) * 0.1);

    return baseDamage;
  }

  damageMonster(monsterId: string, damage: number, attackerId: string, damageType: string) {
    const monster = this.state.monsters.get(monsterId);
    if (!monster || monster.hp <= 0) return;

    const monsterType = MONSTER_TYPES.find(t => t.type === monster.monsterType);
    if (!monsterType) return;

    // Apply damage formula
    let finalDamage = damage;

    if (damageType === "attack") {
      finalDamage = damage * 100 / (100 + monsterType.baseArmour);
    } else if (damageType === "spell") {
      finalDamage = damage * 100 / (100 + monsterType.baseMagicRes);
    }
    // divine ignores resistances

    finalDamage = Math.max(1, finalDamage);

    monster.hp -= finalDamage;

    if (monster.hp <= 0) {
      monster.hp = 0;

      const monsterState = this.monsterStates.get(monsterId);
      if (monsterState) {
        monsterState.deathTime = Date.now();
      }

      // Give XP
      const player = this.state.players.get(attackerId);
      if (player) {
        let rarityMultiplier = 1;
        if (monster.rarity === "magic") rarityMultiplier = 1.5;
        if (monster.rarity === "rare") rarityMultiplier = 2.5;

        const xpGain = monsterType.xpReward * monster.level * rarityMultiplier;
        player.xp += xpGain;

        // Check level up
        while (player.xp >= player.xpToNext) {
          player.xp -= player.xpToNext;
          player.level++;
          player.maxHp += 20;
          player.hp = player.maxHp;
          player.rawAttack += 1;
          player.rawSpell += 1;
          player.xpToNext = 100 * player.level;
        }
      }

      // Drop loot
      const rarityDropMultiplier = monster.rarity === "rare" ? 4 : monster.rarity === "magic" ? 2 : 1;
      const dropChance = 0.3 * rarityDropMultiplier;

      if (Math.random() < dropChance) {
        // Drop item
        const tier = Math.min(5, Math.max(1, Math.floor(monster.level / 5) + 1));
        const tierItems = ITEM_DEFINITIONS.filter(i => i.tier === tier);

        if (tierItems.length > 0) {
          const itemDef = tierItems[Math.floor(Math.random() * tierItems.length)];
          this.dropItem(itemDef.id, monster.x, monster.y);
        }
      }
    }
  }

  damagePlayer(playerId: string, damage: number, damageType: string) {
    const player = this.state.players.get(playerId);
    if (!player || player.isDead) return;

    // Apply damage formula
    let finalDamage = damage;

    if (damageType === "attack") {
      finalDamage = damage * 100 / (100 + player.armour);
    } else if (damageType === "spell") {
      finalDamage = damage * 100 / (100 + player.magicRes);
    }
    // divine ignores resistances

    finalDamage -= player.damageBlock;
    finalDamage = Math.max(1, finalDamage);

    player.hp -= finalDamage;

    if (player.hp <= 0) {
      player.hp = 0;
      player.isDead = true;

      const playerState = this.playerStates.get(playerId);
      if (playerState) {
        playerState.deathTime = Date.now();
      }
    }
  }

  dropItem(itemId: string, x: number, y: number) {
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

    this.state.droppedItems.set(instanceId, droppedItem);
  }

  handlePickup(playerId: string, instanceId: string) {
    const player = this.state.players.get(playerId);
    const item = this.state.droppedItems.get(instanceId);

    if (!player || !item || player.isDead) return;

    const dist = this.distance(player.x, player.y, item.x, item.y);
    if (dist > ITEM_PICKUP_RANGE) return;

    if (player.inventory.length >= INVENTORY_SIZE) return;

    const itemDef = ITEM_DEFINITIONS.find(i => i.id === item.itemId);
    if (!itemDef) return;

    const invItem = this.createInventoryItem(itemDef);
    player.inventory.push(invItem);
    this.state.droppedItems.delete(instanceId);
  }

  handleEquip(playerId: string, inventoryIndex: number, equipmentSlot: number) {
    const player = this.state.players.get(playerId);
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

    this.recalculateStats(playerId);
  }

  handleUnequip(playerId: string, equipmentSlot: number) {
    const player = this.state.players.get(playerId);
    if (!player || player.isDead) return;

    if (equipmentSlot < 0 || equipmentSlot >= EQUIPMENT_SLOTS) return;
    if (player.inventory.length >= INVENTORY_SIZE) return;

    const item = player.equipment[equipmentSlot];
    if (!item || !item.itemId) return;

    // Move to inventory
    const invItem = this.createInventoryItem(
      ITEM_DEFINITIONS.find(d => d.id === item.itemId)!
    );
    player.inventory.push(invItem);

    // Replace with empty placeholder
    const empty = new InventoryItem();
    player.equipment.setAt(equipmentSlot, empty);

    this.recalculateStats(playerId);
  }

  recalculateStats(playerId: string) {
    const player = this.state.players.get(playerId);
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

  createInventoryItem(itemDef: ItemDefinition): InventoryItem {
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

  distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    return this.distance(x1, y1, x2, y2) < r1 + r2;
  }
}
