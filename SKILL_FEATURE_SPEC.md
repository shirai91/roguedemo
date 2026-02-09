# Skill System Feature Spec

## Overview
Skills are power-ups that drop from monsters when killed. Players pick them up to learn them. Max 5 skills per player. Skills have levels (max 10) and cost skill points to level up.

## 20 Skill Definitions

| ID | Name | DamageType | BaseDamage | Cooldown(ms) | ProjectileSpeed | Sprite | Description |
|----|------|-----------|------------|-------------|----------------|--------|-------------|
| fireball | Fireball | spell | 25 | 2000 | 400 | flame_0.png | Launches a fireball |
| ice_shard | Ice Shard | spell | 20 | 1500 | 500 | icicle_0.png | Fires an ice projectile |
| lightning_bolt | Lightning Bolt | spell | 35 | 3000 | 700 | zap_0.png | A bolt of lightning |
| poison_arrow | Poison Arrow | attack | 18 | 1200 | 550 | poison_arrow_0.png | Toxic projectile |
| crystal_spear | Crystal Spear | attack | 30 | 2500 | 450 | crystal_spear_0.png | Piercing crystal |
| magic_dart | Magic Dart | spell | 12 | 800 | 600 | magic_dart_0.png | Quick arcane bolt |
| iron_shot | Iron Shot | attack | 28 | 2200 | 350 | iron_shot_0.png | Heavy metal slug |
| acid_venom | Acid Venom | spell | 22 | 1800 | 400 | acid_venom.png | Corrosive spray |
| searing_ray | Searing Ray | spell | 32 | 2800 | 650 | searing_ray_0.png | Beam of heat |
| holy_arrow | Holy Arrow | divine | 24 | 2000 | 500 | arrow_0.png | Blessed arrow |
| sandblast | Sandblast | attack | 15 | 1000 | 450 | sandblast_0.png | Ground shrapnel |
| sting | Sting | spell | 10 | 600 | 550 | sting_0.png | Venomous sting |
| stone_arrow | Stone Arrow | attack | 20 | 1500 | 500 | stone_arrow_0.png | Hardened stone bolt |
| frost_nova | Frost Nova | spell | 28 | 2500 | 350 | frost_0.png | Burst of cold |
| javelin_throw | Javelin Throw | attack | 26 | 2000 | 480 | javelin_0_new.png | Thrown javelin |
| magic_bolt | Magic Bolt | spell | 22 | 1600 | 520 | magic_bolt_1.png | Pure arcane energy |
| divine_judgment | Divine Judgment | divine | 40 | 3500 | 400 | goldaura_0.png | Golden smite |
| crossbow_bolt | Crossbow Bolt | attack | 16 | 1000 | 650 | crossbow_bolt_0.png | Rapid bolt |
| soul_drain | Soul Drain | divine | 30 | 2800 | 400 | drain_0_new.png | Life steal bolt |
| chaos_orb | Chaos Orb | divine | 35 | 3000 | 350 | orb_glow_0.png | Chaotic energy |

## Mechanics

### Skill Drop
- When a monster is killed by a player, there's a chance to drop a skill (separate from item drops)
- Drop chance: 10% base, 20% for magic, 40% for rare monsters
- Random skill from the 20 defined skills
- Dropped skill appears on ground with its effect sprite
- Dropped skill has a `skillId` field

### Skill Pickup
- Player walks over a dropped skill (same pickup range as items: 50px)
- NOT auto-pickup — player must send a "pickupSkill" message (like manual pickup)
- Actually, to keep it simple: auto-pickup like items
- If player already has 5 skills, skill stays on ground (can't pick up)
- If player already knows this skill, the skill is NOT picked up (stays on ground) — no duplicates
- When picked up, skill is added to player's skills array at level 1

### Skill Points
- Player starts with 0 skill points
- Each level up grants +1 skill point (modify existing level-up logic)
- Skill points are shown in UI

### Skill Leveling
- Player sends "levelSkill" message with skill slot index (0-4)
- Costs 1 skill point
- Skill level increases by 1 (max 10)
- Each level increases skill damage by 10% (multiplicative with base)
- Formula: `finalDamage = baseDamage * (1 + (skillLevel - 1) * 0.1)`

### Skill Usage (Auto-cast)
- Skills fire automatically on a cooldown timer (like an auto-attack but separate)
- Each skill has its own cooldown
- Skills fire toward the nearest monster within range (300px)
- If no monster in range, skills don't fire
- Skill projectiles use the skill's sprite instead of the default projectile circle
- Skill projectiles have `skillId` field on the Projectile schema so the client knows which sprite to render

### Schema Changes

#### GameState.ts
- New `PlayerSkill` schema: `skillId (string)`, `level (uint8)`
- New `DroppedSkill` schema: `instanceId (string)`, `skillId (string)`, `x (float32)`, `y (float32)`
- Add to `Player`: `skills: ArraySchema<PlayerSkill>` (max 5), `skillPoints: uint16`
- Add to `GameState`: `droppedSkills: MapSchema<DroppedSkill>`
- Add to `Projectile`: `skillId: string` (empty string for normal attacks)

#### GameRoom.ts
- Add SKILL_DEFINITIONS array (from table above)
- Add skill drop logic in `damageMonster` (when monster dies)
- Add skill pickup in update loop (auto-pickup, check <5 skills and not duplicate)
- Add "levelSkill" message handler
- Add skill auto-cast logic in update loop (per player, per skill, check cooldown, find nearest monster)
- Add `skillPoints` grant on level up (+1)
- Track skill cooldowns in playerStates

#### GameScene.ts
- Load all 20 effect sprite images in preload
- Render dropped skills on ground (use sprite image)
- Render skill projectiles with their sprite (check `projectile.skillId`)

#### UIScene.ts
- Add skill bar UI (bottom of screen or near inventory)
- Show 5 skill slots with skill icon, level, and name
- "+" button on each slot to level up (sends "levelSkill" message)
- Show skill points count
- Gray out "+" button if no skill points or skill at max level

### Sprite Locations
All effect sprites are already in `client/public/sprites/`:
flame_0.png, icicle_0.png, zap_0.png, poison_arrow_0.png, crystal_spear_0.png, magic_dart_0.png, iron_shot_0.png, acid_venom.png, searing_ray_0.png, arrow_0.png, sandblast_0.png, sting_0.png, stone_arrow_0.png, frost_0.png, javelin_0_new.png, magic_bolt_1.png, goldaura_0.png, crossbow_bolt_0.png, drain_0_new.png, orb_glow_0.png

### Important Notes
- Do NOT use co-authoring in git commits
- Keep existing functionality working (items, monsters, PvP, etc.)
- Server-authoritative: all skill logic on server, client just renders
- The skill projectiles should look visually distinct from the player's basic attack
