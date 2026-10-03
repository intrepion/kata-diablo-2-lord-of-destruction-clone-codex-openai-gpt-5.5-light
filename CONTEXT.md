# Ashen Reach

Ashen Reach is an original browser action RPG inspired by the feel and systems pressure of Diablo II: Lord of Destruction. This context captures the project language for its world, combat loop, loot, progression, and delivery model.

## Language

**Original Homage**:
A game that preserves a reference game's mechanical identity and pacing while using original names, lore, art, places, classes, monsters, and items.
_Avoid_: Diablo clone, Diablo assets, Lord of Destruction content

**Mini-Act Loop**:
The first complete playable journey from town to hostile zone, dungeon, champion encounter, loot upgrade, boss victory, and return to town.
_Avoid_: Demo level, prototype, vertical slice

**Town Hub**:
A safe settlement where the player prepares, reviews gear, interacts with non-combat services, and returns after dangerous expeditions.
_Avoid_: Lobby, menu, base

**Wilderness**:
The outdoor hostile area between the Town Hub and deeper dungeon spaces, used to establish combat rhythm, monster density, and loot tempo.
_Avoid_: Overworld, field, map

**Dungeon**:
A compact hostile interior space with denser encounters, tighter navigation, stronger loot pressure, and a boss path.
_Avoid_: Cave, level, instance

**Boss Room**:
A deliberately authored final combat space for the Mini-Act Loop.
_Avoid_: Arena, final screen

**Click-To-Move**:
The primary control contract where pointer clicks issue movement and attack intent in an isometric playfield.
_Avoid_: WASD movement, twin-stick movement

**Skill Line**:
A themed progression branch for the player class that supports a distinct combat build.
_Avoid_: Talent tab, subclass, ability category

**Cinderblade**:
The Ashbound Skill Line focused on close-range weapon arcs and aggressive blade combat.
_Avoid_: Melee tree, warrior skills

**Embercraft**:
The Ashbound Skill Line focused on fire magic, ranged pressure, and burning damage.
_Avoid_: Fire tree, mage skills

**Gravebind**:
The Ashbound Skill Line focused on curses, control, and bound helper effects.
_Avoid_: Necromancy tree, summoner skills

**Cleave**:
The starting Cinderblade skill, a close-range arc attack that rewards positioning against clustered enemies.
_Avoid_: Slash, basic attack

**Ember Bolt**:
The starting Embercraft skill, a ranged fire projectile used to pressure enemies before they close.
_Avoid_: Fireball, magic missile

**Bind Wretch**:
The starting Gravebind skill, a short control effect that slows or briefly binds a hostile presence.
_Avoid_: Summon skeleton, root spell

**Ashbound**:
The starter player class, an oath-burned exile whose Build Identity can lean into blade combat, ember magic, or binding curses.
_Avoid_: Warrior, mage, necromancer

**Build Identity**:
The recognizable combat style created by a player's skill choices, equipment, and tactical habits.
_Avoid_: Loadout, character type

**Affix**:
A generated modifier attached to equipment that changes stats or combat behavior.
_Avoid_: Perk, trait, bonus

**Stat**:
A named numeric property that shapes combat performance, item comparison, or Build Identity.
_Avoid_: Attribute, modifier

**Rarity**:
The broad quality tier of an item, expressed through loot color, affix capacity, and player expectation.
_Avoid_: Item level, value

**Equipment Slot**:
A place on the character where one item can be worn to affect combat performance.
_Avoid_: Inventory cell, gear bucket

**Weapon**:
The Equipment Slot that primarily defines attack damage and basic combat reach.
_Avoid_: Main hand

**Offhand**:
The Equipment Slot for a secondary defensive, magical, or utility item.
_Avoid_: Shield slot, second hand

**Inventory**:
The player's carried item collection, separate from equipped items.
_Avoid_: Bag, stash

**Grid Inventory**:
An Inventory represented as spatial cells where item footprint and placement matter.
_Avoid_: List inventory, item feed

**Potion Belt**:
The hotkey-accessible potion supply that turns survival into a tactical resource during combat.
_Avoid_: Healing bar, consumable tray

**Mana**:
The replenishable resource spent on Ashbound skills and supported by potion economy.
_Avoid_: Energy, spell points

**Cooldown**:
The short timing gate that prevents an active skill from being repeated continuously.
_Avoid_: Reload, timer

**Death Toll**:
The penalty paid when the player dies and returns to the Town Hub.
_Avoid_: Lives, game over, corpse run

**Healer**:
The Town Hub service that restores the player's combat readiness between dangerous outings.
_Avoid_: Priest, medic

**Vendor**:
The Town Hub service that buys and sells ordinary equipment and consumables.
_Avoid_: Shop, merchant

**Stash**:
The Town Hub service that stores items outside the player's carried Inventory.
_Avoid_: Bank, chest

**Return Marker**:
The Town Hub service or location that anchors return travel from the Mini-Act Loop.
_Avoid_: Waypoint, town portal

**Champion Pack**:
A stronger monster group inside the Mini-Act Loop that tests readiness before the Boss Room.
_Avoid_: Elite mob, miniboss

**Swarm Melee**:
A monster family defined by fragile close-range enemies that threaten through numbers.
_Avoid_: Fodder, trash mobs

**Ranged Cultist**:
A monster family defined by ranged pressure and target-priority decisions.
_Avoid_: Archer, caster

**Durable Beast**:
A monster family defined by high endurance and close-range body pressure.
_Avoid_: Tank, brute

**Ashen Brute**:
The first boss archetype: a slow, heavy melee enemy that pressures the player with summoned reinforcements.
_Avoid_: Final boss, demon lord

**Canvas Silhouette**:
The visual style for combat entities, using clean browser-drawn shapes, lighting, colors, and telegraphs instead of asset-heavy sprite art.
_Avoid_: Pixel art, painted sprite, placeholder shape

**Milestone Slice**:
An independently playable, verified, committed, and pushed development step that adds a coherent piece of the game.
_Avoid_: Batch, phase, checkpoint

**Foundations**:
The Milestone Slice that proves the technical playfield: Vite, TypeScript, Canvas loop, isometric projection, Click-To-Move intent, HUD shell, and deterministic test harness.
_Avoid_: Setup, scaffolding

**First Blood**:
The Milestone Slice that proves combat readability, player resources, starting skills, first enemy families, potion use, damage feedback, and Death Toll.
_Avoid_: Combat phase, battle demo

**Loot Hunger**:
The Milestone Slice that proves drops, Rarity, Affixes, Grid Inventory, Equipment Slots, item comparison, Vendor selling, and Stash storage.
_Avoid_: Loot phase, inventory demo

**Dungeon Descent**:
The Milestone Slice that proves deterministic Dungeon generation, Champion Pack pressure, Durable Beast encounters, Return Marker use, and town-to-dungeon traversal.
_Avoid_: Dungeon phase, map demo

**Brute Reckoning**:
The Milestone Slice that proves the authored Boss Room, Ashen Brute combat, summoned reinforcements, potion pressure, boss reward, level-up choice, and return-to-town completion.
_Avoid_: Boss phase, final fight

**Direct Launch**:
The Milestone Slice that proves the game runs from the root page through a direct-file-safe browser bundle.
_Avoid_: Build phase, packaging

**Verification Contract**:
The required evidence that a Milestone Slice is done, including deterministic tests, real browser gameplay smoke, production build, whitespace check, commit, push, and remote SHA verification.
_Avoid_: QA checklist, done criteria

**Local Save**:
The browser-stored player progress for level, equipped gear, Stash contents, gold, and completed Mini-Act state.
_Avoid_: Save file, account, profile

**Run Seed**:
The deterministic value used to regenerate the Dungeon for a New Run.
_Avoid_: Random seed, map code

**New Run**:
The post-victory action that keeps character progress while generating a fresh Dungeon from a new Run Seed.
_Avoid_: Restart, new game

**Run Count**:
The number of completed or started New Runs used with zone depth to scale enemy pressure.
_Avoid_: Difficulty level, prestige

**Gold Economy**:
The MVP money loop covering potion and basic gear purchases, Vendor sell value, and Death Toll payment.
_Avoid_: Currency system, gambling

**HUD Button**:
A visible on-screen control for skills, potions, or panels that mirrors keyboard hotkeys.
_Avoid_: Shortcut, mobile control

**Mini-Act Smoke**:
The canonical browser test route that proves town departure, combat, loot equip, dungeon entry, boss defeat, return, and persistence reload.
_Avoid_: E2E test, browser smoke

**Implementation Start Gate**:
The point where design grilling stops and the next unsettled questions are answered through Milestone Slice implementation and verification.
_Avoid_: Handoff, planning complete
