import { screenToWorld, worldToScreen, type IsoCamera } from "./domain/projection";
import type { Combatant, GameState } from "./domain/game";

export type RenderHandles = {
  canvas: HTMLCanvasElement;
  hud: HTMLElement;
  message: HTMLElement;
};

export function createShell(root: HTMLElement): RenderHandles {
  root.innerHTML = `
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

  const canvas = root.querySelector<HTMLCanvasElement>("#game-canvas");
  const hud = root.querySelector<HTMLElement>(".hud");
  const message = root.querySelector<HTMLElement>("[data-testid='message']");
  if (!canvas || !hud || !message) {
    throw new Error("Failed to create Ashen Reach shell");
  }
  return { canvas, hud, message };
}

export function renderGame(
  context: CanvasRenderingContext2D,
  hud: HTMLElement,
  state: GameState,
  camera: IsoCamera
): void {
  updateHud(hud, state);
  const { canvas } = context;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#171814");
  gradient.addColorStop(1, "#07110f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawIsoGrid(context, camera);
  drawTownMarker(context, camera);
  if (state.player.zone === "wilderness") {
    drawWildernessPath(context, camera);
  }
  if (state.player.zone === "dungeon") {
    drawDungeon(context, camera, state);
  }
  if (state.player.zone === "boss") {
    drawBossRoom(context, camera);
  }

  const destination = worldToScreen(state.player.destination, camera);
  context.strokeStyle = "#f0b35a";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(destination.x, destination.y, 16, 0, Math.PI * 2);
  context.stroke();

  for (const enemy of state.enemies.filter((candidate) => candidate.health > 0)) {
    drawEnemy(context, camera, enemy);
  }

  const player = worldToScreen(state.player.position, camera);
  context.fillStyle = "#f7d179";
  context.strokeStyle = "#2b1608";
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(player.x, player.y - 18, 14, 22, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "#f7eee3";
  context.font = "16px system-ui";
  context.fillText("Foundations: Canvas, isometric projection, Click-To-Move intent", 28, 42);
  context.fillText("First Blood: skills, enemies, potion tension, Death Toll", 28, 66);
  context.fillText("Loot Hunger: rarity drops, Grid Inventory, equipment, Vendor, Stash", 28, 90);
  context.fillText("Dungeon Descent: seeded halls, Champion Pack, Durable Beast, Return Marker", 28, 114);
  context.fillText("Brute Reckoning: Ashen Brute, adds, boss reward, level-up choice", 28, 138);

  for (const text of state.floatingText) {
    const point = worldToScreen(text.position, camera);
    context.fillStyle = text.label.startsWith("-") ? "#ff8c72" : "#f7d179";
    context.font = "700 18px system-ui";
    context.fillText(text.label, point.x - 8, point.y - 28);
  }
}

export function bindCanvasClick(
  canvas: HTMLCanvasElement,
  camera: IsoCamera,
  onDestination: (world: { x: number; y: number }) => void
): void {
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

function updateHud(hud: HTMLElement, state: GameState): void {
  hud.querySelector("[data-testid='zone']")!.textContent = zoneLabel(state.player.zone);
  hud.querySelector("[data-testid='health']")!.textContent = `Health ${Math.round(state.player.health)}/${state.player.maxHealth}`;
  hud.querySelector("[data-testid='mana']")!.textContent = `Mana ${Math.round(state.player.mana)}/${state.player.maxMana}`;
  hud.querySelector("[data-testid='gold']")!.textContent = `Gold ${state.player.gold} | Level ${state.player.level} | SP ${state.player.skillPoints}`;
  hud.querySelector("[data-testid='potion']")!.textContent = `Potion (${state.player.potions})`;
  const victoryPanel = hud.querySelector<HTMLElement>("[data-testid='victory-panel']");
  if (victoryPanel) {
    victoryPanel.hidden = !state.player.miniActComplete;
  }
  const panel = hud.querySelector<HTMLElement>("[data-testid='inventory-panel']");
  if (!panel) return;
  panel.hidden = !state.player.inventoryOpen;
  if (!state.player.inventoryOpen) return;
  const signature = JSON.stringify({
    inventory: state.player.inventory.map((entry) => [entry.item.id, entry.x, entry.y]),
    equipment: Object.entries(state.player.equipment).map(([slot, item]) => [slot, item?.id]),
    stash: state.player.stash.map((item) => item.id)
  });
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;
  const equippedWeapon = state.player.equipment.weapon?.name ?? "Empty";
  panel.innerHTML = `
    <div class="inventory-summary">
      <strong>Grid Inventory</strong>
      <span data-testid="equipped-weapon">Weapon: ${equippedWeapon}</span>
      <span data-testid="stash-count">Stash: ${state.player.stash.length}</span>
    </div>
    <div class="inventory-grid">
      ${state.player.inventory
        .map(
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
        )
        .join("")}
    </div>
  `;
}

function zoneLabel(zone: GameState["player"]["zone"]): string {
  if (zone === "town") return "Town Hub";
  if (zone === "wilderness") return "Wilderness";
  if (zone === "dungeon") return "Dungeon";
  return "Boss Room";
}

function formatStats(stats: Record<string, number | undefined>): string {
  return Object.entries(stats)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0)
    .map(([key, value]) => `${key} +${value}`)
    .join(", ");
}

function drawIsoGrid(context: CanvasRenderingContext2D, camera: IsoCamera): void {
  context.strokeStyle = "rgba(190, 148, 92, 0.22)";
  context.lineWidth = 1;
  for (let x = -8; x <= 14; x += 1) {
    drawIsoLine(context, camera, { x, y: -8 }, { x, y: 14 });
  }
  for (let y = -8; y <= 14; y += 1) {
    drawIsoLine(context, camera, { x: -8, y }, { x: 14, y });
  }
}

function drawIsoLine(
  context: CanvasRenderingContext2D,
  camera: IsoCamera,
  start: { x: number; y: number },
  end: { x: number; y: number }
): void {
  const a = worldToScreen(start, camera);
  const b = worldToScreen(end, camera);
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

function drawTownMarker(context: CanvasRenderingContext2D, camera: IsoCamera): void {
  const center = worldToScreen({ x: -2, y: -2 }, camera);
  context.fillStyle = "rgba(68, 98, 74, 0.82)";
  context.beginPath();
  context.ellipse(center.x, center.y, 88, 38, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d7c4a0";
  context.font = "15px system-ui";
  context.fillText("Town Hub", center.x - 34, center.y + 5);
}

function drawWildernessPath(context: CanvasRenderingContext2D, camera: IsoCamera): void {
  const center = worldToScreen({ x: 5.6, y: 3.2 }, camera);
  context.fillStyle = "rgba(80, 55, 38, 0.7)";
  context.beginPath();
  context.ellipse(center.x, center.y, 180, 74, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#caa36a";
  context.font = "15px system-ui";
  context.fillText("Wilderness", center.x - 38, center.y + 4);
}

function drawEnemy(context: CanvasRenderingContext2D, camera: IsoCamera, enemy: Combatant): void {
  const point = worldToScreen(enemy.position, camera);
  const fill = enemy.family === "rangedCultist" ? "#7a5cc4" : "#a43f35";
  context.fillStyle = enemy.bindSeconds > 0 ? "#6590ff" : fill;
  context.strokeStyle = "#1b0b08";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(point.x, point.y - 14, 13, 18, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#1d0806";
  context.fillRect(point.x - 18, point.y - 42, 36, 5);
  context.fillStyle = "#d94c42";
  context.fillRect(point.x - 18, point.y - 42, 36 * (enemy.health / enemy.maxHealth), 5);
}

function drawDungeon(context: CanvasRenderingContext2D, camera: IsoCamera, state: GameState): void {
  context.strokeStyle = "rgba(156, 131, 104, 0.72)";
  context.lineWidth = 12;
  context.lineCap = "round";
  context.beginPath();
  state.dungeonRooms.forEach((room, index) => {
    const point = worldToScreen(room.position, camera);
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.stroke();
  for (const room of state.dungeonRooms) {
    const point = worldToScreen(room.position, camera);
    context.fillStyle = room.kind === "champion" ? "#7b3131" : room.kind === "return" ? "#3b6b77" : "#2a2924";
    context.strokeStyle = "#c6aa79";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(point.x, point.y, 38, 19, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}

function drawBossRoom(context: CanvasRenderingContext2D, camera: IsoCamera): void {
  const center = worldToScreen({ x: 11, y: 6 }, camera);
  context.fillStyle = "rgba(66, 24, 20, 0.82)";
  context.beginPath();
  context.ellipse(center.x, center.y, 210, 92, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(240, 196, 90, 0.6)";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#f0c45a";
  context.font = "15px system-ui";
  context.fillText("Boss Room", center.x - 36, center.y + 5);
}
