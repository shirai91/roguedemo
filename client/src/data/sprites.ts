import Phaser from 'phaser';

export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 3000;
export const GRID_SIZE = 100;

export const SKILL_SPRITES: Record<string, string> = {
  fireball: 'flame_0',
  ice_shard: 'icicle_0',
  lightning_bolt: 'zap_0',
  poison_arrow: 'poison_arrow_0',
  crystal_spear: 'crystal_spear_0',
  magic_dart: 'magic_dart_0',
  iron_shot: 'iron_shot_0',
  acid_venom: 'acid_venom',
  searing_ray: 'searing_ray_0',
  holy_arrow: 'arrow_0',
  sandblast: 'sandblast_0',
  sting: 'sting_0',
  stone_arrow: 'stone_arrow_0',
  frost_nova: 'frost_0',
  javelin_throw: 'javelin_0_new',
  magic_bolt: 'magic_bolt_1',
  divine_judgment: 'goldaura_0',
  crossbow_bolt: 'crossbow_bolt_0',
  soul_drain: 'drain_0_new',
  chaos_orb: 'orb_glow_0',
};

export const SKILL_NAMES: Record<string, string> = {
  fireball: 'Fireball',
  ice_shard: 'Ice Shard',
  lightning_bolt: 'Lightning',
  poison_arrow: 'Poison',
  crystal_spear: 'Crystal',
  magic_dart: 'Dart',
  iron_shot: 'Iron Shot',
  acid_venom: 'Acid',
  searing_ray: 'Searing',
  holy_arrow: 'Holy',
  sandblast: 'Sand',
  sting: 'Sting',
  stone_arrow: 'Stone',
  frost_nova: 'Frost',
  javelin_throw: 'Javelin',
  magic_bolt: 'Magic',
  divine_judgment: 'Divine',
  crossbow_bolt: 'Crossbow',
  soul_drain: 'Drain',
  chaos_orb: 'Chaos',
};

export const MONSTER_TYPES = [
  'slime',
  'bat',
  'imp',
  'spider',
  'skeleton',
  'goblin',
  'wolf',
  'zombie',
  'ghost',
  'orc',
  'wraith',
  'harpy',
  'troll',
  'demon',
  'basilisk',
  'minotaur',
  'lich',
  'drake',
  'golem',
  'hydra'
];

export const ITEM_SPRITE_KEYS = [
  'item_weapon',
  'item_armor',
  'item_ring',
  'item_amulet',
  'item_potion'
];

export const SKILL_SPRITE_KEYS = [
  'flame_0',
  'icicle_0',
  'zap_0',
  'poison_arrow_0',
  'crystal_spear_0',
  'magic_dart_0',
  'iron_shot_0',
  'acid_venom',
  'searing_ray_0',
  'arrow_0',
  'sandblast_0',
  'sting_0',
  'stone_arrow_0',
  'frost_0',
  'javelin_0_new',
  'magic_bolt_1',
  'goldaura_0',
  'crossbow_bolt_0',
  'drain_0_new',
  'orb_glow_0'
];

export function getItemSpriteKey(itemId: string): string {
  if (itemId.includes('sword') || itemId.includes('wand') || itemId.includes('staff')) {
    return 'item_weapon';
  }
  if (itemId.includes('ring')) {
    return 'item_ring';
  }
  if (itemId.includes('amulet')) {
    return 'item_amulet';
  }
  if (itemId.includes('potion')) {
    return 'item_potion';
  }
  return 'item_armor';
}

export function preloadAssets(scene: Phaser.Scene): void {
  // Player
  scene.load.image('player', 'sprites/player/player.png');

  // Monsters
  MONSTER_TYPES.forEach(type => {
    scene.load.image(`monster_${type}`, `sprites/monsters/${type}.png`);
  });

  // Items
  scene.load.image('item_weapon', 'sprites/items/weapon.png');
  scene.load.image('item_armor', 'sprites/items/armor.png');
  scene.load.image('item_ring', 'sprites/items/ring.png');
  scene.load.image('item_amulet', 'sprites/items/amulet.png');
  scene.load.image('item_potion', 'sprites/items/potion.png');

  // Dungeon
  scene.load.image('floor', 'sprites/dungeon/floor.png');

  // Skill effect sprites
  SKILL_SPRITE_KEYS.forEach(name => {
    scene.load.image(name, `sprites/${name}.png`);
  });
}
