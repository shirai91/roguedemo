/**
 * Game Constants for RogueDemo
 * Shared between client and server
 */

// Map dimensions
export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 3000;

// Monster spawning
export const MAX_MONSTERS = 50;

// Player base stats
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_SPEED = 200;
export const PLAYER_BASE_ATTACK_SPEED = 1.0; // attacks per second

// Projectile properties
export const PROJECTILE_SPEED = 500;
export const PROJECTILE_LIFETIME = 2000; // milliseconds

// Monster behavior
export const MONSTER_CHASE_RANGE = 300;
export const MONSTER_ATTACK_RANGE = 50;
export const MONSTER_PATROL_SPEED = 50;
export const MONSTER_CHASE_SPEED = 120;

// Item interaction
export const ITEM_PICKUP_RANGE = 50;

// Leveling system
export const XP_PER_LEVEL = 100; // multiplied by current level

// World grid
export const GRID_SIZE = 100;

// Network
export const TICK_RATE = 20; // server updates per second

// Inventory system
export const EQUIPMENT_SLOTS = 6;
export const INVENTORY_SIZE = 20;

// Respawn timers
export const RESPAWN_DELAY = 3000; // monsters/items
export const PLAYER_RESPAWN_DELAY = 5000; // players
