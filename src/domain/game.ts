import { distance, type WorldPoint } from "./projection";

export type Zone = "town" | "wilderness" | "dungeon" | "boss";
export type SkillId = "cleave" | "emberBolt" | "bindWretch";
export type EnemyFamily = "swarmMelee" | "rangedCultist" | "durableBeast" | "ashenBrute";
export type Rarity = "common" | "magic" | "rare";
export type EquipmentSlot = "weapon" | "offhand" | "helm" | "chest" | "gloves" | "boots" | "amulet" | "ring";

export type ItemStats = {
  damage?: number;
  armor?: number;
  vitality?: number;
  focus?: number;
  firePower?: number;
  leech?: number;
  moveSpeed?: number;
};

export type Item = {
  id: string;
  name: string;
  rarity: Rarity;
  slot: EquipmentSlot;
  footprint: { w: number; h: number };
  value: number;
  stats: ItemStats;
  affixes: string[];
};

export type InventoryEntry = {
  item: Item;
  x: number;
  y: number;
};

export type DungeonRoom = {
  id: string;
  position: WorldPoint;
  kind: "entry" | "hall" | "champion" | "return";
};

export type Combatant = {
  id: string;
  family: EnemyFamily;
  position: WorldPoint;
  health: number;
  maxHealth: number;
  damage: number;
  range: number;
  speed: number;
  attackCooldown: number;
  bindSeconds: number;
};

export type FloatingText = {
  id: string;
  position: WorldPoint;
  label: string;
  ttl: number;
};

export type PlayerState = {
  position: WorldPoint;
  destination: WorldPoint;
  zone: Zone;
  speed: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  potions: number;
  gold: number;
  level: number;
  skillPoints: number;
  miniActComplete: boolean;
  runCount: number;
  inventoryOpen: boolean;
  inventory: InventoryEntry[];
  equipment: Partial<Record<EquipmentSlot, Item>>;
  stash: Item[];
  cooldowns: Record<SkillId, number>;
};

export type GameState = {
  player: PlayerState;
  enemies: Combatant[];
  floatingText: FloatingText[];
  dungeonSeed: number;
  dungeonRooms: DungeonRoom[];
  message: string;
  tick: number;
  nextId: number;
};

export function createGameState(): GameState {
  return {
    player: {
      position: { x: 0, y: 0 },
      destination: { x: 0, y: 0 },
      zone: "town",
      speed: 5.4,
      health: 120,
      maxHealth: 120,
      mana: 60,
      maxMana: 60,
      potions: 3,
      gold: 80,
      level: 1,
      skillPoints: 0,
      miniActComplete: false,
      runCount: 0,
      inventoryOpen: false,
      inventory: [],
      equipment: {},
      stash: [],
      cooldowns: {
        cleave: 0,
        emberBolt: 0,
        bindWretch: 0
      }
    },
    enemies: [],
    floatingText: [],
    dungeonSeed: 1337,
    dungeonRooms: [],
    message: "Town Hub ready. Click the isometric ground to move.",
    tick: 0,
    nextId: 1
  };
}

export function enterDungeon(state: GameState, seed = state.dungeonSeed): GameState {
  const dungeonRooms = generateDungeon(seed);
  const champion = dungeonRooms.find((room) => room.kind === "champion") ?? dungeonRooms[2];
  return {
    ...state,
    dungeonSeed: seed,
    dungeonRooms,
    player: {
      ...state.player,
      zone: "dungeon",
      position: dungeonRooms[0].position,
      destination: dungeonRooms[0].position
    },
    enemies: [
      scaleEnemy(makeEnemy("beast-1", "durableBeast", { x: champion.position.x - 0.8, y: champion.position.y }), state.player.runCount, 2),
      scaleEnemy(makeEnemy("champion-1", "durableBeast", champion.position), state.player.runCount, 3),
      scaleEnemy(makeEnemy("cultist-2", "rangedCultist", { x: champion.position.x + 1.1, y: champion.position.y + 0.6 }), state.player.runCount, 2)
    ],
    message: "Dungeon Descent: deterministic halls lead to a Champion Pack and Return Marker."
  };
}

export function useReturnMarker(state: GameState): GameState {
  if (state.player.zone !== "dungeon") {
    return { ...state, message: "Return Marker is only active in the Dungeon." };
  }
  return {
    ...state,
    player: {
      ...state.player,
      zone: "town",
      position: { x: 0, y: 0 },
      destination: { x: 0, y: 0 }
    },
    enemies: [],
    message: "Return Marker carried the Ashbound back to the Town Hub."
  };
}

export function enterBossRoom(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      zone: "boss",
      position: { x: 9, y: 6 },
      destination: { x: 9, y: 6 }
    },
    enemies: [
      makeEnemy("ashen-brute", "ashenBrute", { x: 10.2, y: 6 }),
      makeEnemy("brute-add-1", "swarmMelee", { x: 11.1, y: 5.2 }),
      makeEnemy("brute-add-2", "swarmMelee", { x: 11.2, y: 6.8 })
    ],
    message: "Brute Reckoning: Ashen Brute and reinforcements guard the Boss Room."
  };
}

export function chooseSkillLine(state: GameState, line: "Cinderblade" | "Embercraft" | "Gravebind"): GameState {
  if (state.player.skillPoints <= 0) {
    return { ...state, message: "No skill point is available." };
  }
  return {
    ...state,
    player: {
      ...state.player,
      skillPoints: state.player.skillPoints - 1
    },
    message: `${line} strengthened. Build Identity changed.`
  };
}

export function buyPotion(state: GameState): GameState {
  if (state.player.gold < 15) {
    return { ...state, message: "Vendor requires 15 gold for a potion." };
  }
  return {
    ...state,
    player: {
      ...state.player,
      gold: state.player.gold - 15,
      potions: state.player.potions + 1
    },
    message: "Vendor sold a potion for 15 gold."
  };
}

export function startNewRun(state: GameState): GameState {
  const runCount = state.player.runCount + 1;
  const dungeonSeed = state.dungeonSeed + 97 + runCount * 13;
  return {
    ...state,
    dungeonSeed,
    dungeonRooms: [],
    enemies: [],
    player: {
      ...state.player,
      runCount,
      zone: "town",
      position: { x: 0, y: 0 },
      destination: { x: 0, y: 0 },
      miniActComplete: false
    },
    message: `New Run ${runCount} prepared with Run Seed ${dungeonSeed}.`
  };
}

export function enterWilderness(state: GameState): GameState {
  if (state.player.zone === "wilderness") {
    return state;
  }
  return {
    ...state,
    player: {
      ...state.player,
      zone: "wilderness",
      position: { x: 2, y: 2 },
      destination: { x: 2, y: 2 }
    },
    enemies: [
      makeEnemy("swarm-1", "swarmMelee", { x: 5, y: 2 }),
      makeEnemy("swarm-2", "swarmMelee", { x: 6.1, y: 2.7 }),
      makeEnemy("cultist-1", "rangedCultist", { x: 7, y: 4.3 })
    ],
    message: "First Blood: Swarm Melee and Ranged Cultist enemies ahead."
  };
}

export function toggleInventory(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      inventoryOpen: !state.player.inventoryOpen
    },
    message: state.player.inventoryOpen ? "Inventory closed." : "Inventory paused the world for item comparison."
  };
}

export function addLootToInventory(state: GameState, item: Item): GameState {
  const position = findInventorySpace(state.player.inventory, item);
  if (!position) {
    return { ...state, message: "Grid Inventory is full." };
  }
  return {
    ...state,
    player: {
      ...state.player,
      inventory: [...state.player.inventory, { item, ...position }]
    },
    message: `${item.name} added to Grid Inventory.`
  };
}

export function equipInventoryItem(state: GameState, itemId: string): GameState {
  const entry = state.player.inventory.find((candidate) => candidate.item.id === itemId);
  if (!entry) {
    return { ...state, message: "Item is not in Inventory." };
  }
  const replaced = state.player.equipment[entry.item.slot];
  const remaining = state.player.inventory.filter((candidate) => candidate.item.id !== itemId);
  const inventory = replaced ? [...remaining, { item: replaced, x: entry.x, y: entry.y }] : remaining;
  return {
    ...state,
    player: {
      ...state.player,
      inventory,
      equipment: {
        ...state.player.equipment,
        [entry.item.slot]: entry.item
      }
    },
    message: `Equipped ${entry.item.name}.`
  };
}

export function sellInventoryItem(state: GameState, itemId: string): GameState {
  const entry = state.player.inventory.find((candidate) => candidate.item.id === itemId);
  if (!entry) {
    return { ...state, message: "Vendor needs an item in Inventory." };
  }
  return {
    ...state,
    player: {
      ...state.player,
      gold: state.player.gold + entry.item.value,
      inventory: state.player.inventory.filter((candidate) => candidate.item.id !== itemId)
    },
    message: `Vendor paid ${entry.item.value} gold for ${entry.item.name}.`
  };
}

export function stashInventoryItem(state: GameState, itemId: string): GameState {
  const entry = state.player.inventory.find((candidate) => candidate.item.id === itemId);
  if (!entry) {
    return { ...state, message: "Stash needs an item in Inventory." };
  }
  return {
    ...state,
    player: {
      ...state.player,
      stash: [...state.player.stash, entry.item],
      inventory: state.player.inventory.filter((candidate) => candidate.item.id !== itemId)
    },
    message: `${entry.item.name} moved to Stash.`
  };
}

export function createLootDrop(seed: number, slot: EquipmentSlot = "weapon"): Item {
  const rarity: Rarity = seed % 5 === 0 ? "rare" : seed % 2 === 0 ? "magic" : "common";
  const prefix = rarity === "rare" ? "Vivid" : rarity === "magic" ? "Ember" : "Worn";
  const baseName = slot === "weapon" ? "Hand Axe" : slot === "offhand" ? "Ward" : "Harness";
  const stats: ItemStats =
    slot === "weapon"
      ? { damage: 6 + (seed % 7), firePower: rarity === "common" ? 0 : 3 }
      : { armor: 4 + (seed % 5), vitality: rarity === "rare" ? 6 : 2 };
  return {
    id: `loot-${seed}-${slot}`,
    name: `${prefix} ${baseName}`,
    rarity,
    slot,
    footprint: slot === "weapon" ? { w: 1, h: 3 } : { w: 2, h: 2 },
    value: rarity === "rare" ? 55 : rarity === "magic" ? 32 : 14,
    stats,
    affixes: rarity === "common" ? [] : [rarity === "rare" ? "of Leech" : "of Focus"]
  };
}

export function generateDungeon(seed: number): DungeonRoom[] {
  let cursor = seed;
  const rooms: DungeonRoom[] = [{ id: "entry", position: { x: 3, y: 3 }, kind: "entry" }];
  let position = { x: 3, y: 3 };
  for (let index = 1; index <= 4; index += 1) {
    cursor = (cursor * 1664525 + 1013904223) >>> 0;
    position = {
      x: position.x + 1.8 + (cursor % 3) * 0.6,
      y: position.y + 0.9 + ((cursor >>> 3) % 3) * 0.5
    };
    rooms.push({
      id: `room-${index}`,
      position,
      kind: index === 3 ? "champion" : "hall"
    });
  }
  rooms.push({
    id: "return-marker",
    position: { x: position.x + 1.2, y: position.y + 0.5 },
    kind: "return"
  });
  return rooms;
}

export function setDestination(state: GameState, destination: WorldPoint): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      destination
    },
    message: `Click-To-Move intent set: ${destination.x.toFixed(1)}, ${destination.y.toFixed(1)}`
  };
}

export function usePotion(state: GameState): GameState {
  if (state.player.potions <= 0) {
    return { ...state, message: "Potion Belt is empty." };
  }
  if (state.player.health >= state.player.maxHealth) {
    return { ...state, message: "Health is already full." };
  }
  const healed = Math.min(45, state.player.maxHealth - state.player.health);
  return {
    ...state,
    player: {
      ...state.player,
      health: state.player.health + healed,
      potions: state.player.potions - 1
    },
    floatingText: addText(state, state.player.position, `+${healed}`),
    message: "Potion Belt restored health."
  };
}

export function castSkill(state: GameState, skill: SkillId): GameState {
  const spec = skillSpecs[skill];
  const player = state.player;
  if (player.cooldowns[skill] > 0) {
    return { ...state, message: `${spec.name} is cooling down.` };
  }
  if (player.mana < spec.manaCost) {
    return { ...state, message: `Not enough Mana for ${spec.name}.` };
  }

  const targets = state.enemies
    .filter((enemy) => enemy.health > 0 && distance(enemy.position, player.position) <= spec.range)
    .sort((a, b) => {
      if (player.zone === "boss" && a.family !== b.family) {
        if (a.family === "ashenBrute") return -1;
        if (b.family === "ashenBrute") return 1;
      }
      return distance(a.position, player.position) - distance(b.position, player.position);
    })
    .slice(0, spec.maxTargets);

  if (targets.length === 0) {
    return { ...state, message: `${spec.name} needs a target in range.` };
  }

  let next = {
    ...state,
    player: {
      ...player,
      mana: player.mana - spec.manaCost,
      cooldowns: {
        ...player.cooldowns,
        [skill]: spec.cooldown
      }
    }
  };

  for (const target of targets) {
    next = damageEnemy(next, target.id, spec.damage, spec.name);
    if (skill === "bindWretch") {
      next = bindEnemy(next, target.id, 2.5);
    }
  }

  return {
    ...next,
    message: `${spec.name} hit ${targets.length} target${targets.length === 1 ? "" : "s"}.`
  };
}

export function advanceGame(state: GameState, deltaSeconds: number): GameState {
  if (state.player.inventoryOpen) {
    return { ...state, tick: state.tick + 1 };
  }
  let next = movePlayer(state, deltaSeconds);
  next = {
    ...next,
    player: {
      ...next.player,
      mana: Math.min(next.player.maxMana, next.player.mana + deltaSeconds * 3),
      cooldowns: {
        cleave: Math.max(0, next.player.cooldowns.cleave - deltaSeconds),
        emberBolt: Math.max(0, next.player.cooldowns.emberBolt - deltaSeconds),
        bindWretch: Math.max(0, next.player.cooldowns.bindWretch - deltaSeconds)
      }
    },
    enemies: next.enemies.map((enemy) => ({
      ...enemy,
      attackCooldown: Math.max(0, enemy.attackCooldown - deltaSeconds),
      bindSeconds: Math.max(0, enemy.bindSeconds - deltaSeconds)
    })),
    floatingText: next.floatingText
      .map((text) => ({ ...text, ttl: text.ttl - deltaSeconds, position: { x: text.position.x, y: text.position.y - deltaSeconds * 0.7 } }))
      .filter((text) => text.ttl > 0),
    tick: next.tick + 1
  };
  next = advanceEnemies(next, deltaSeconds);
  if (next.player.health <= 0) {
    return returnToTownAfterDeath(next);
  }
  return next;
}

function makeEnemy(id: string, family: EnemyFamily, position: WorldPoint): Combatant {
  if (family === "rangedCultist") {
    return { id, family, position, health: 42, maxHealth: 42, damage: 9, range: 4.2, speed: 1.6, attackCooldown: 0, bindSeconds: 0 };
  }
  if (family === "durableBeast") {
    return { id, family, position, health: 95, maxHealth: 95, damage: 13, range: 1.1, speed: 2.1, attackCooldown: 0, bindSeconds: 0 };
  }
  if (family === "ashenBrute") {
    return { id, family, position, health: 60, maxHealth: 60, damage: 18, range: 1.4, speed: 1.5, attackCooldown: 0, bindSeconds: 0 };
  }
  return { id, family, position, health: 34, maxHealth: 34, damage: 7, range: 1.05, speed: 2.8, attackCooldown: 0, bindSeconds: 0 };
}

function scaleEnemy(enemy: Combatant, runCount: number, zoneDepth: number): Combatant {
  const scale = 1 + runCount * 0.12 + zoneDepth * 0.08;
  return {
    ...enemy,
    health: Math.round(enemy.health * scale),
    maxHealth: Math.round(enemy.maxHealth * scale),
    damage: Math.round(enemy.damage * (1 + runCount * 0.08 + zoneDepth * 0.04))
  };
}

function movePlayer(state: GameState, deltaSeconds: number): GameState {
  const remaining = distance(state.player.position, state.player.destination);
  if (remaining < 0.02) {
    return {
      ...state,
      player: { ...state.player, position: state.player.destination }
    };
  }
  const step = Math.min(remaining, state.player.speed * deltaSeconds);
  const ratio = step / remaining;
  return {
    ...state,
    player: {
      ...state.player,
      position: {
        x: state.player.position.x + (state.player.destination.x - state.player.position.x) * ratio,
        y: state.player.position.y + (state.player.destination.y - state.player.position.y) * ratio
      }
    }
  };
}

function advanceEnemies(state: GameState, deltaSeconds: number): GameState {
  let next = state;
  const enemies = state.enemies.map((enemy) => {
    if (enemy.health <= 0 || enemy.bindSeconds > 0) {
      return enemy;
    }

    const playerDistance = distance(enemy.position, state.player.position);
    if (playerDistance > enemy.range) {
      const step = Math.min(playerDistance, enemy.speed * deltaSeconds);
      const ratio = step / playerDistance;
      return {
        ...enemy,
        position: {
          x: enemy.position.x + (state.player.position.x - enemy.position.x) * ratio,
          y: enemy.position.y + (state.player.position.y - enemy.position.y) * ratio
        }
      };
    }

    if (enemy.attackCooldown <= 0) {
      next = damagePlayer(next, enemy.damage, enemy.family === "rangedCultist" ? "cultist bolt" : "claw");
      return { ...enemy, attackCooldown: enemy.family === "rangedCultist" ? 1.6 : 1.1 };
    }
    return enemy;
  });

  return {
    ...next,
    enemies
  };
}

function damageEnemy(state: GameState, enemyId: string, amount: number, source: string): GameState {
  const enemy = state.enemies.find((candidate) => candidate.id === enemyId);
  if (!enemy) {
    return state;
  }
  const nextHealth = Math.max(0, enemy.health - amount);
  let next: GameState = {
    ...state,
    enemies: state.enemies.map((candidate) => (candidate.id === enemyId ? { ...candidate, health: nextHealth } : candidate)),
    floatingText: addText(state, enemy.position, `${amount}`),
    message: `${source} dealt ${amount} damage.`
  };
  if (nextHealth === 0 && enemy.health > 0) {
    next = addLootToInventory(next, createLootDrop(state.nextId + amount, enemy.family === "rangedCultist" ? "offhand" : "weapon"));
    if (enemy.family === "ashenBrute") {
      next = completeMiniAct(next);
    }
  }
  return next;
}

function completeMiniAct(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      zone: "town",
      position: { x: 0, y: 0 },
      destination: { x: 0, y: 0 },
      level: state.player.level + 1,
      skillPoints: state.player.skillPoints + 1,
      miniActComplete: true,
      gold: state.player.gold + 100
    },
    enemies: [],
    message: "Ashen Brute defeated. Returned to town with a skill point and boss reward."
  };
}

function bindEnemy(state: GameState, enemyId: string, seconds: number): GameState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => (enemy.id === enemyId ? { ...enemy, bindSeconds: seconds } : enemy))
  };
}

function damagePlayer(state: GameState, amount: number, source: string): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      health: Math.max(0, state.player.health - amount)
    },
    floatingText: addText(state, state.player.position, `-${amount}`),
    message: `Ashbound took ${amount} from ${source}.`
  };
}

function returnToTownAfterDeath(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      zone: "town",
      position: { x: 0, y: 0 },
      destination: { x: 0, y: 0 },
      health: state.player.maxHealth,
      mana: state.player.maxMana,
      gold: Math.max(0, state.player.gold - 20)
    },
    enemies: [],
    message: "Death Toll paid. Returned to the Town Hub."
  };
}

function addText(state: GameState, position: WorldPoint, label: string): FloatingText[] {
  return [
    ...state.floatingText,
    {
      id: `text-${state.nextId}`,
      position,
      label,
      ttl: 0.9
    }
  ];
}

function findInventorySpace(inventory: InventoryEntry[], item: Item): { x: number; y: number } | null {
  const width = 6;
  const height = 4;
  for (let y = 0; y <= height - item.footprint.h; y += 1) {
    for (let x = 0; x <= width - item.footprint.w; x += 1) {
      if (fits(inventory, item, x, y)) {
        return { x, y };
      }
    }
  }
  return null;
}

function fits(inventory: InventoryEntry[], item: Item, x: number, y: number): boolean {
  return inventory.every((entry) => {
    const separated =
      x + item.footprint.w <= entry.x ||
      entry.x + entry.item.footprint.w <= x ||
      y + item.footprint.h <= entry.y ||
      entry.y + entry.item.footprint.h <= y;
    return separated;
  });
}

const skillSpecs: Record<SkillId, { name: string; manaCost: number; cooldown: number; damage: number; range: number; maxTargets: number }> = {
  cleave: { name: "Cleave", manaCost: 8, cooldown: 0.55, damage: 24, range: 1.7, maxTargets: 3 },
  emberBolt: { name: "Ember Bolt", manaCost: 12, cooldown: 0.85, damage: 30, range: 6, maxTargets: 1 },
  bindWretch: { name: "Bind Wretch", manaCost: 14, cooldown: 3.2, damage: 10, range: 4.4, maxTargets: 1 }
};
