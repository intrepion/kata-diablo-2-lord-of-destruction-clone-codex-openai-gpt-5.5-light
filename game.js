"use strict";
(() => {
  // src/domain/projection.ts
  var defaultCamera = {
    origin: { x: 640, y: 220 },
    tileWidth: 64,
    tileHeight: 32
  };
  function worldToScreen(point, camera = defaultCamera) {
    return {
      x: camera.origin.x + (point.x - point.y) * (camera.tileWidth / 2),
      y: camera.origin.y + (point.x + point.y) * (camera.tileHeight / 2)
    };
  }
  function screenToWorld(point, camera = defaultCamera) {
    const dx = point.x - camera.origin.x;
    const dy = point.y - camera.origin.y;
    return {
      x: dy / camera.tileHeight + dx / camera.tileWidth,
      y: dy / camera.tileHeight - dx / camera.tileWidth
    };
  }
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // src/domain/game.ts
  function createGameState() {
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
  function enterDungeon(state2, seed = state2.dungeonSeed) {
    const dungeonRooms = generateDungeon(seed);
    const champion = dungeonRooms.find((room) => room.kind === "champion") ?? dungeonRooms[2];
    return {
      ...state2,
      dungeonSeed: seed,
      dungeonRooms,
      player: {
        ...state2.player,
        zone: "dungeon",
        position: dungeonRooms[0].position,
        destination: dungeonRooms[0].position
      },
      enemies: [
        scaleEnemy(makeEnemy("beast-1", "durableBeast", { x: champion.position.x - 0.8, y: champion.position.y }), state2.player.runCount, 2),
        scaleEnemy(makeEnemy("champion-1", "durableBeast", champion.position), state2.player.runCount, 3),
        scaleEnemy(makeEnemy("cultist-2", "rangedCultist", { x: champion.position.x + 1.1, y: champion.position.y + 0.6 }), state2.player.runCount, 2)
      ],
      message: "Dungeon Descent: deterministic halls lead to a Champion Pack and Return Marker."
    };
  }
  function useReturnMarker(state2) {
    if (state2.player.zone !== "dungeon") {
      return { ...state2, message: "Return Marker is only active in the Dungeon." };
    }
    return {
      ...state2,
      player: {
        ...state2.player,
        zone: "town",
        position: { x: 0, y: 0 },
        destination: { x: 0, y: 0 }
      },
      enemies: [],
      message: "Return Marker carried the Ashbound back to the Town Hub."
    };
  }
  function enterBossRoom(state2) {
    return {
      ...state2,
      player: {
        ...state2.player,
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
  function chooseSkillLine(state2, line) {
    if (state2.player.skillPoints <= 0) {
      return { ...state2, message: "No skill point is available." };
    }
    return {
      ...state2,
      player: {
        ...state2.player,
        skillPoints: state2.player.skillPoints - 1
      },
      message: `${line} strengthened. Build Identity changed.`
    };
  }
  function buyPotion(state2) {
    if (state2.player.gold < 15) {
      return { ...state2, message: "Vendor requires 15 gold for a potion." };
    }
    return {
      ...state2,
      player: {
        ...state2.player,
        gold: state2.player.gold - 15,
        potions: state2.player.potions + 1
      },
      message: "Vendor sold a potion for 15 gold."
    };
  }
  function startNewRun(state2) {
    const runCount = state2.player.runCount + 1;
    const dungeonSeed = state2.dungeonSeed + 97 + runCount * 13;
    return {
      ...state2,
      dungeonSeed,
      dungeonRooms: [],
      enemies: [],
      player: {
        ...state2.player,
        runCount,
        zone: "town",
        position: { x: 0, y: 0 },
        destination: { x: 0, y: 0 },
        miniActComplete: false
      },
      message: `New Run ${runCount} prepared with Run Seed ${dungeonSeed}.`
    };
  }
  function enterWilderness(state2) {
    if (state2.player.zone === "wilderness") {
      return state2;
    }
    return {
      ...state2,
      player: {
        ...state2.player,
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
  function toggleInventory(state2) {
    return {
      ...state2,
      player: {
        ...state2.player,
        inventoryOpen: !state2.player.inventoryOpen
      },
      message: state2.player.inventoryOpen ? "Inventory closed." : "Inventory paused the world for item comparison."
    };
  }
  function addLootToInventory(state2, item) {
    const position = findInventorySpace(state2.player.inventory, item);
    if (!position) {
      return { ...state2, message: "Grid Inventory is full." };
    }
    return {
      ...state2,
      player: {
        ...state2.player,
        inventory: [...state2.player.inventory, { item, ...position }]
      },
      message: `${item.name} added to Grid Inventory.`
    };
  }
  function equipInventoryItem(state2, itemId) {
    const entry = state2.player.inventory.find((candidate) => candidate.item.id === itemId);
    if (!entry) {
      return { ...state2, message: "Item is not in Inventory." };
    }
    const replaced = state2.player.equipment[entry.item.slot];
    const remaining = state2.player.inventory.filter((candidate) => candidate.item.id !== itemId);
    const inventory = replaced ? [...remaining, { item: replaced, x: entry.x, y: entry.y }] : remaining;
    return {
      ...state2,
      player: {
        ...state2.player,
        inventory,
        equipment: {
          ...state2.player.equipment,
          [entry.item.slot]: entry.item
        }
      },
      message: `Equipped ${entry.item.name}.`
    };
  }
  function sellInventoryItem(state2, itemId) {
    const entry = state2.player.inventory.find((candidate) => candidate.item.id === itemId);
    if (!entry) {
      return { ...state2, message: "Vendor needs an item in Inventory." };
    }
    return {
      ...state2,
      player: {
        ...state2.player,
        gold: state2.player.gold + entry.item.value,
        inventory: state2.player.inventory.filter((candidate) => candidate.item.id !== itemId)
      },
      message: `Vendor paid ${entry.item.value} gold for ${entry.item.name}.`
    };
  }
  function stashInventoryItem(state2, itemId) {
    const entry = state2.player.inventory.find((candidate) => candidate.item.id === itemId);
    if (!entry) {
      return { ...state2, message: "Stash needs an item in Inventory." };
    }
    return {
      ...state2,
      player: {
        ...state2.player,
        stash: [...state2.player.stash, entry.item],
        inventory: state2.player.inventory.filter((candidate) => candidate.item.id !== itemId)
      },
      message: `${entry.item.name} moved to Stash.`
    };
  }
  function createLootDrop(seed, slot = "weapon") {
    const rarity = seed % 5 === 0 ? "rare" : seed % 2 === 0 ? "magic" : "common";
    const prefix = rarity === "rare" ? "Vivid" : rarity === "magic" ? "Ember" : "Worn";
    const baseName = slot === "weapon" ? "Hand Axe" : slot === "offhand" ? "Ward" : "Harness";
    const stats = slot === "weapon" ? { damage: 6 + seed % 7, firePower: rarity === "common" ? 0 : 3 } : { armor: 4 + seed % 5, vitality: rarity === "rare" ? 6 : 2 };
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
  function generateDungeon(seed) {
    let cursor = seed;
    const rooms = [{ id: "entry", position: { x: 3, y: 3 }, kind: "entry" }];
    let position = { x: 3, y: 3 };
    for (let index = 1; index <= 4; index += 1) {
      cursor = cursor * 1664525 + 1013904223 >>> 0;
      position = {
        x: position.x + 1.8 + cursor % 3 * 0.6,
        y: position.y + 0.9 + (cursor >>> 3) % 3 * 0.5
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
  function setDestination(state2, destination) {
    return {
      ...state2,
      player: {
        ...state2.player,
        destination
      },
      message: `Click-To-Move intent set: ${destination.x.toFixed(1)}, ${destination.y.toFixed(1)}`
    };
  }
  function usePotion(state2) {
    if (state2.player.potions <= 0) {
      return { ...state2, message: "Potion Belt is empty." };
    }
    if (state2.player.health >= state2.player.maxHealth) {
      return { ...state2, message: "Health is already full." };
    }
    const healed = Math.min(45, state2.player.maxHealth - state2.player.health);
    return {
      ...state2,
      player: {
        ...state2.player,
        health: state2.player.health + healed,
        potions: state2.player.potions - 1
      },
      floatingText: addText(state2, state2.player.position, `+${healed}`),
      message: "Potion Belt restored health."
    };
  }
  function castSkill(state2, skill) {
    const spec = skillSpecs[skill];
    const player = state2.player;
    if (player.cooldowns[skill] > 0) {
      return { ...state2, message: `${spec.name} is cooling down.` };
    }
    if (player.mana < spec.manaCost) {
      return { ...state2, message: `Not enough Mana for ${spec.name}.` };
    }
    const targets = state2.enemies.filter((enemy) => enemy.health > 0 && distance(enemy.position, player.position) <= spec.range).sort((a, b) => {
      if (player.zone === "boss" && a.family !== b.family) {
        if (a.family === "ashenBrute") return -1;
        if (b.family === "ashenBrute") return 1;
      }
      return distance(a.position, player.position) - distance(b.position, player.position);
    }).slice(0, spec.maxTargets);
    if (targets.length === 0) {
      return { ...state2, message: `${spec.name} needs a target in range.` };
    }
    let next = {
      ...state2,
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
  function advanceGame(state2, deltaSeconds) {
    if (state2.player.inventoryOpen) {
      return { ...state2, tick: state2.tick + 1 };
    }
    let next = movePlayer(state2, deltaSeconds);
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
      floatingText: next.floatingText.map((text) => ({ ...text, ttl: text.ttl - deltaSeconds, position: { x: text.position.x, y: text.position.y - deltaSeconds * 0.7 } })).filter((text) => text.ttl > 0),
      tick: next.tick + 1
    };
    next = advanceEnemies(next, deltaSeconds);
    if (next.player.health <= 0) {
      return returnToTownAfterDeath(next);
    }
    return next;
  }
  function makeEnemy(id, family, position) {
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
  function scaleEnemy(enemy, runCount, zoneDepth) {
    const scale = 1 + runCount * 0.12 + zoneDepth * 0.08;
    return {
      ...enemy,
      health: Math.round(enemy.health * scale),
      maxHealth: Math.round(enemy.maxHealth * scale),
      damage: Math.round(enemy.damage * (1 + runCount * 0.08 + zoneDepth * 0.04))
    };
  }
  function movePlayer(state2, deltaSeconds) {
    const remaining = distance(state2.player.position, state2.player.destination);
    if (remaining < 0.02) {
      return {
        ...state2,
        player: { ...state2.player, position: state2.player.destination }
      };
    }
    const step = Math.min(remaining, state2.player.speed * deltaSeconds);
    const ratio = step / remaining;
    return {
      ...state2,
      player: {
        ...state2.player,
        position: {
          x: state2.player.position.x + (state2.player.destination.x - state2.player.position.x) * ratio,
          y: state2.player.position.y + (state2.player.destination.y - state2.player.position.y) * ratio
        }
      }
    };
  }
  function advanceEnemies(state2, deltaSeconds) {
    let next = state2;
    const enemies = state2.enemies.map((enemy) => {
      if (enemy.health <= 0 || enemy.bindSeconds > 0) {
        return enemy;
      }
      const playerDistance = distance(enemy.position, state2.player.position);
      if (playerDistance > enemy.range) {
        const step = Math.min(playerDistance, enemy.speed * deltaSeconds);
        const ratio = step / playerDistance;
        return {
          ...enemy,
          position: {
            x: enemy.position.x + (state2.player.position.x - enemy.position.x) * ratio,
            y: enemy.position.y + (state2.player.position.y - enemy.position.y) * ratio
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
  function damageEnemy(state2, enemyId, amount, source) {
    const enemy = state2.enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy) {
      return state2;
    }
    const nextHealth = Math.max(0, enemy.health - amount);
    let next = {
      ...state2,
      enemies: state2.enemies.map((candidate) => candidate.id === enemyId ? { ...candidate, health: nextHealth } : candidate),
      floatingText: addText(state2, enemy.position, `${amount}`),
      message: `${source} dealt ${amount} damage.`
    };
    if (nextHealth === 0 && enemy.health > 0) {
      next = addLootToInventory(next, createLootDrop(state2.nextId + amount, enemy.family === "rangedCultist" ? "offhand" : "weapon"));
      if (enemy.family === "ashenBrute") {
        next = completeMiniAct(next);
      }
    }
    return next;
  }
  function completeMiniAct(state2) {
    return {
      ...state2,
      player: {
        ...state2.player,
        zone: "town",
        position: { x: 0, y: 0 },
        destination: { x: 0, y: 0 },
        level: state2.player.level + 1,
        skillPoints: state2.player.skillPoints + 1,
        miniActComplete: true,
        gold: state2.player.gold + 100
      },
      enemies: [],
      message: "Ashen Brute defeated. Returned to town with a skill point and boss reward."
    };
  }
  function bindEnemy(state2, enemyId, seconds) {
    return {
      ...state2,
      enemies: state2.enemies.map((enemy) => enemy.id === enemyId ? { ...enemy, bindSeconds: seconds } : enemy)
    };
  }
  function damagePlayer(state2, amount, source) {
    return {
      ...state2,
      player: {
        ...state2.player,
        health: Math.max(0, state2.player.health - amount)
      },
      floatingText: addText(state2, state2.player.position, `-${amount}`),
      message: `Ashbound took ${amount} from ${source}.`
    };
  }
  function returnToTownAfterDeath(state2) {
    return {
      ...state2,
      player: {
        ...state2.player,
        zone: "town",
        position: { x: 0, y: 0 },
        destination: { x: 0, y: 0 },
        health: state2.player.maxHealth,
        mana: state2.player.maxMana,
        gold: Math.max(0, state2.player.gold - 20)
      },
      enemies: [],
      message: "Death Toll paid. Returned to the Town Hub."
    };
  }
  function addText(state2, position, label) {
    return [
      ...state2.floatingText,
      {
        id: `text-${state2.nextId}`,
        position,
        label,
        ttl: 0.9
      }
    ];
  }
  function findInventorySpace(inventory, item) {
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
  function fits(inventory, item, x, y) {
    return inventory.every((entry) => {
      const separated = x + item.footprint.w <= entry.x || entry.x + entry.item.footprint.w <= x || y + item.footprint.h <= entry.y || entry.y + entry.item.footprint.h <= y;
      return separated;
    });
  }
  var skillSpecs = {
    cleave: { name: "Cleave", manaCost: 8, cooldown: 0.55, damage: 24, range: 1.7, maxTargets: 3 },
    emberBolt: { name: "Ember Bolt", manaCost: 12, cooldown: 0.85, damage: 30, range: 6, maxTargets: 1 },
    bindWretch: { name: "Bind Wretch", manaCost: 14, cooldown: 3.2, damage: 10, range: 4.4, maxTargets: 1 }
  };

  // src/render.ts
  function createShell(root2) {
    root2.innerHTML = `
    <main class="game-shell">
      <canvas id="game-canvas" width="1280" height="720" aria-label="Ashen Reach playfield"></canvas>
      <section class="hud" aria-label="Ashen Reach HUD">
        <div>
          <strong>Ashen Reach</strong>
          <span data-testid="zone">Town Hub</span>
        </div>
        <div class="meters">
          <span data-testid="health">Health 120/120</span>
          <span data-testid="mana">Mana 60/60</span>
          <span data-testid="gold">Gold 80</span>
        </div>
        <div class="hud-row">
          <button data-testid="travel" type="button">Travel</button>
          <button data-testid="dungeon" type="button">Dungeon</button>
          <button data-testid="boss" type="button">Boss</button>
          <button data-testid="return-marker" type="button">Return</button>
          <button data-testid="skill-cleave" type="button">Cleave</button>
          <button data-testid="skill-ember-bolt" type="button">Ember Bolt</button>
          <button data-testid="skill-bind-wretch" type="button">Bind Wretch</button>
          <button data-testid="potion" type="button">Potion</button>
          <button data-testid="buy-potion" type="button">Buy Potion</button>
          <button data-testid="inventory" type="button">Inventory</button>
          <button data-testid="debug-loot" type="button">Find Loot</button>
        </div>
        <div class="inventory-panel" data-testid="inventory-panel" hidden></div>
        <div class="victory-panel" data-testid="victory-panel" hidden>
          <strong>Mini-Act Complete</strong>
          <button data-testid="choose-embercraft" type="button">Choose Embercraft</button>
          <button data-testid="new-run" type="button">New Run</button>
        </div>
        <p data-testid="message"></p>
      </section>
    </main>
  `;
    const canvas = root2.querySelector("#game-canvas");
    const hud = root2.querySelector(".hud");
    const message = root2.querySelector("[data-testid='message']");
    if (!canvas || !hud || !message) {
      throw new Error("Failed to create Ashen Reach shell");
    }
    return { canvas, hud, message };
  }
  function renderGame(context2, hud, state2, camera) {
    updateHud(hud, state2);
    const { canvas } = context2;
    context2.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context2.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#171814");
    gradient.addColorStop(1, "#07110f");
    context2.fillStyle = gradient;
    context2.fillRect(0, 0, canvas.width, canvas.height);
    drawIsoGrid(context2, camera);
    drawTownMarker(context2, camera);
    if (state2.player.zone === "wilderness") {
      drawWildernessPath(context2, camera);
    }
    if (state2.player.zone === "dungeon") {
      drawDungeon(context2, camera, state2);
    }
    if (state2.player.zone === "boss") {
      drawBossRoom(context2, camera);
    }
    const destination = worldToScreen(state2.player.destination, camera);
    context2.strokeStyle = "#f0b35a";
    context2.lineWidth = 2;
    context2.beginPath();
    context2.arc(destination.x, destination.y, 16, 0, Math.PI * 2);
    context2.stroke();
    for (const enemy of state2.enemies.filter((candidate) => candidate.health > 0)) {
      drawEnemy(context2, camera, enemy);
    }
    const player = worldToScreen(state2.player.position, camera);
    context2.fillStyle = "#f7d179";
    context2.strokeStyle = "#2b1608";
    context2.lineWidth = 3;
    context2.beginPath();
    context2.ellipse(player.x, player.y - 18, 14, 22, 0, 0, Math.PI * 2);
    context2.fill();
    context2.stroke();
    context2.fillStyle = "#f7eee3";
    context2.font = "16px system-ui";
    context2.fillText("Foundations: Canvas, isometric projection, Click-To-Move intent", 28, 42);
    context2.fillText("First Blood: skills, enemies, potion tension, Death Toll", 28, 66);
    context2.fillText("Loot Hunger: rarity drops, Grid Inventory, equipment, Vendor, Stash", 28, 90);
    context2.fillText("Dungeon Descent: seeded halls, Champion Pack, Durable Beast, Return Marker", 28, 114);
    context2.fillText("Brute Reckoning: Ashen Brute, adds, boss reward, level-up choice", 28, 138);
    for (const text of state2.floatingText) {
      const point = worldToScreen(text.position, camera);
      context2.fillStyle = text.label.startsWith("-") ? "#ff8c72" : "#f7d179";
      context2.font = "700 18px system-ui";
      context2.fillText(text.label, point.x - 8, point.y - 28);
    }
  }
  function bindCanvasClick(canvas, camera, onDestination) {
    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      onDestination(
        screenToWorld(
          {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
          },
          camera
        )
      );
    });
  }
  function updateHud(hud, state2) {
    hud.querySelector("[data-testid='zone']").textContent = zoneLabel(state2.player.zone);
    hud.querySelector("[data-testid='health']").textContent = `Health ${Math.round(state2.player.health)}/${state2.player.maxHealth}`;
    hud.querySelector("[data-testid='mana']").textContent = `Mana ${Math.round(state2.player.mana)}/${state2.player.maxMana}`;
    hud.querySelector("[data-testid='gold']").textContent = `Gold ${state2.player.gold} | Level ${state2.player.level} | SP ${state2.player.skillPoints}`;
    hud.querySelector("[data-testid='potion']").textContent = `Potion (${state2.player.potions})`;
    const victoryPanel = hud.querySelector("[data-testid='victory-panel']");
    if (victoryPanel) {
      victoryPanel.hidden = !state2.player.miniActComplete;
    }
    const panel = hud.querySelector("[data-testid='inventory-panel']");
    if (!panel) return;
    panel.hidden = !state2.player.inventoryOpen;
    if (!state2.player.inventoryOpen) return;
    const signature = JSON.stringify({
      inventory: state2.player.inventory.map((entry) => [entry.item.id, entry.x, entry.y]),
      equipment: Object.entries(state2.player.equipment).map(([slot, item]) => [slot, item?.id]),
      stash: state2.player.stash.map((item) => item.id)
    });
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    const equippedWeapon = state2.player.equipment.weapon?.name ?? "Empty";
    panel.innerHTML = `
    <div class="inventory-summary">
      <strong>Grid Inventory</strong>
      <span data-testid="equipped-weapon">Weapon: ${equippedWeapon}</span>
      <span data-testid="stash-count">Stash: ${state2.player.stash.length}</span>
    </div>
    <div class="inventory-grid">
      ${state2.player.inventory.map(
      (entry) => `
            <article class="item ${entry.item.rarity}" style="grid-column: ${entry.x + 1} / span ${entry.item.footprint.w}; grid-row: ${entry.y + 1} / span ${entry.item.footprint.h};" data-testid="item-${entry.item.id}">
              <strong>${entry.item.name}</strong>
              <span>${entry.item.slot} | ${entry.item.affixes.join(", ") || "plain"}</span>
              <span>${formatStats(entry.item.stats)}</span>
              <div>
                <button type="button" data-action="equip" data-item-id="${entry.item.id}">Equip</button>
                <button type="button" data-action="sell" data-item-id="${entry.item.id}">Sell</button>
                <button type="button" data-action="stash" data-item-id="${entry.item.id}">Stash</button>
              </div>
            </article>
          `
    ).join("")}
    </div>
  `;
  }
  function zoneLabel(zone) {
    if (zone === "town") return "Town Hub";
    if (zone === "wilderness") return "Wilderness";
    if (zone === "dungeon") return "Dungeon";
    return "Boss Room";
  }
  function formatStats(stats) {
    return Object.entries(stats).filter((entry) => typeof entry[1] === "number" && entry[1] > 0).map(([key, value]) => `${key} +${value}`).join(", ");
  }
  function drawIsoGrid(context2, camera) {
    context2.strokeStyle = "rgba(190, 148, 92, 0.22)";
    context2.lineWidth = 1;
    for (let x = -8; x <= 14; x += 1) {
      drawIsoLine(context2, camera, { x, y: -8 }, { x, y: 14 });
    }
    for (let y = -8; y <= 14; y += 1) {
      drawIsoLine(context2, camera, { x: -8, y }, { x: 14, y });
    }
  }
  function drawIsoLine(context2, camera, start, end) {
    const a = worldToScreen(start, camera);
    const b = worldToScreen(end, camera);
    context2.beginPath();
    context2.moveTo(a.x, a.y);
    context2.lineTo(b.x, b.y);
    context2.stroke();
  }
  function drawTownMarker(context2, camera) {
    const center = worldToScreen({ x: -2, y: -2 }, camera);
    context2.fillStyle = "rgba(68, 98, 74, 0.82)";
    context2.beginPath();
    context2.ellipse(center.x, center.y, 88, 38, 0, 0, Math.PI * 2);
    context2.fill();
    context2.fillStyle = "#d7c4a0";
    context2.font = "15px system-ui";
    context2.fillText("Town Hub", center.x - 34, center.y + 5);
  }
  function drawWildernessPath(context2, camera) {
    const center = worldToScreen({ x: 5.6, y: 3.2 }, camera);
    context2.fillStyle = "rgba(80, 55, 38, 0.7)";
    context2.beginPath();
    context2.ellipse(center.x, center.y, 180, 74, 0, 0, Math.PI * 2);
    context2.fill();
    context2.fillStyle = "#caa36a";
    context2.font = "15px system-ui";
    context2.fillText("Wilderness", center.x - 38, center.y + 4);
  }
  function drawEnemy(context2, camera, enemy) {
    const point = worldToScreen(enemy.position, camera);
    const fill = enemy.family === "rangedCultist" ? "#7a5cc4" : "#a43f35";
    context2.fillStyle = enemy.bindSeconds > 0 ? "#6590ff" : fill;
    context2.strokeStyle = "#1b0b08";
    context2.lineWidth = 2;
    context2.beginPath();
    context2.ellipse(point.x, point.y - 14, 13, 18, 0, 0, Math.PI * 2);
    context2.fill();
    context2.stroke();
    context2.fillStyle = "#1d0806";
    context2.fillRect(point.x - 18, point.y - 42, 36, 5);
    context2.fillStyle = "#d94c42";
    context2.fillRect(point.x - 18, point.y - 42, 36 * (enemy.health / enemy.maxHealth), 5);
  }
  function drawDungeon(context2, camera, state2) {
    context2.strokeStyle = "rgba(156, 131, 104, 0.72)";
    context2.lineWidth = 12;
    context2.lineCap = "round";
    context2.beginPath();
    state2.dungeonRooms.forEach((room, index) => {
      const point = worldToScreen(room.position, camera);
      if (index === 0) context2.moveTo(point.x, point.y);
      else context2.lineTo(point.x, point.y);
    });
    context2.stroke();
    for (const room of state2.dungeonRooms) {
      const point = worldToScreen(room.position, camera);
      context2.fillStyle = room.kind === "champion" ? "#7b3131" : room.kind === "return" ? "#3b6b77" : "#2a2924";
      context2.strokeStyle = "#c6aa79";
      context2.lineWidth = 2;
      context2.beginPath();
      context2.ellipse(point.x, point.y, 38, 19, 0, 0, Math.PI * 2);
      context2.fill();
      context2.stroke();
    }
  }
  function drawBossRoom(context2, camera) {
    const center = worldToScreen({ x: 11, y: 6 }, camera);
    context2.fillStyle = "rgba(66, 24, 20, 0.82)";
    context2.beginPath();
    context2.ellipse(center.x, center.y, 210, 92, 0, 0, Math.PI * 2);
    context2.fill();
    context2.strokeStyle = "rgba(240, 196, 90, 0.6)";
    context2.lineWidth = 3;
    context2.stroke();
    context2.fillStyle = "#f0c45a";
    context2.font = "15px system-ui";
    context2.fillText("Boss Room", center.x - 36, center.y + 5);
  }

  // src/main.ts
  var saveKey = "ashen-reach-local-save";
  var root = document.querySelector("#app");
  if (!root) {
    throw new Error("Missing #app root");
  }
  var handles = createShell(root);
  var context = handles.canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering is unavailable");
  }
  var state = loadGame();
  var lastFrame = performance.now();
  var lastSaved = 0;
  bindCanvasClick(handles.canvas, defaultCamera, (destination) => {
    state = setDestination(state, destination);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='travel']")?.addEventListener("click", () => {
    state = enterWilderness(state);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='dungeon']")?.addEventListener("click", () => {
    state = enterDungeon(state);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='return-marker']")?.addEventListener("click", () => {
    state = useReturnMarker(state);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='boss']")?.addEventListener("click", () => {
    state = enterBossRoom(state);
    handles.message.textContent = state.message;
  });
  for (const [testId, skill] of [
    ["skill-cleave", "cleave"],
    ["skill-ember-bolt", "emberBolt"],
    ["skill-bind-wretch", "bindWretch"]
  ]) {
    handles.hud.querySelector(`[data-testid='${testId}']`)?.addEventListener("click", () => {
      state = castSkill(state, skill);
      handles.message.textContent = state.message;
    });
  }
  handles.hud.querySelector("[data-testid='potion']")?.addEventListener("click", () => {
    state = usePotion(state);
    playTone(220, 0.08);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='inventory']")?.addEventListener("click", () => {
    state = toggleInventory(state);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='debug-loot']")?.addEventListener("click", () => {
    state = addLootToInventory(state, createLootDrop(20, "weapon"));
    playTone(880, 0.08);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='buy-potion']")?.addEventListener("click", () => {
    state = buyPotion(state);
    playTone(520, 0.06);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='new-run']")?.addEventListener("click", () => {
    state = startNewRun(state);
    saveGame(state);
    handles.message.textContent = state.message;
  });
  handles.hud.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const itemId = target.dataset.itemId;
    if (!itemId) return;
    if (target.dataset.action === "equip") state = equipInventoryItem(state, itemId);
    if (target.dataset.action === "sell") state = sellInventoryItem(state, itemId);
    if (target.dataset.action === "stash") state = stashInventoryItem(state, itemId);
    playTone(660, 0.05);
    handles.message.textContent = state.message;
  });
  handles.hud.querySelector("[data-testid='choose-embercraft']")?.addEventListener("click", () => {
    state = chooseSkillLine(state, "Embercraft");
    handles.message.textContent = state.message;
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "1") state = castSkill(state, "cleave");
    if (event.key === "2") state = castSkill(state, "emberBolt");
    if (event.key === "3") state = castSkill(state, "bindWretch");
    if (event.key.toLowerCase() === "q") state = usePotion(state);
    if (event.key.toLowerCase() === "t") state = enterWilderness(state);
    if (event.key.toLowerCase() === "d") state = enterDungeon(state);
    if (event.key.toLowerCase() === "r") state = useReturnMarker(state);
    if (event.key.toLowerCase() === "b") state = enterBossRoom(state);
    if (event.key.toLowerCase() === "i") state = toggleInventory(state);
    handles.message.textContent = state.message;
  });
  handles.message.textContent = state.message;
  function frame(now) {
    const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1e3);
    lastFrame = now;
    state = advanceGame(state, deltaSeconds);
    if (now - lastSaved > 1e3) {
      saveGame(state);
      lastSaved = now;
    }
    handles.message.textContent = state.message;
    renderGame(context, handles.hud, state, defaultCamera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function saveGame(nextState) {
    localStorage.setItem(saveKey, JSON.stringify(nextState.player));
  }
  function loadGame() {
    const fresh = createGameState();
    const saved = localStorage.getItem(saveKey);
    if (!saved) return fresh;
    try {
      return {
        ...fresh,
        player: {
          ...fresh.player,
          ...JSON.parse(saved),
          position: { x: 0, y: 0 },
          destination: { x: 0, y: 0 },
          zone: "town"
        },
        message: "Local Save restored in the Town Hub."
      };
    } catch {
      return fresh;
    }
  }
  function playTone(frequency, duration) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.035;
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }
})();
