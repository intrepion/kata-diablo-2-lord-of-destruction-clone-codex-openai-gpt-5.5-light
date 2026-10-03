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
          <button data-testid="skill-cleave" type="button">Cleave</button>
          <button data-testid="skill-ember-bolt" type="button">Ember Bolt</button>
          <button data-testid="skill-bind-wretch" type="button">Bind Wretch</button>
          <button data-testid="potion" type="button">Potion</button>
          <button data-testid="inventory" type="button">Inventory</button>
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
  hud.querySelector("[data-testid='zone']")!.textContent = state.player.zone === "town" ? "Town Hub" : "Wilderness";
  hud.querySelector("[data-testid='health']")!.textContent = `Health ${Math.round(state.player.health)}/${state.player.maxHealth}`;
  hud.querySelector("[data-testid='mana']")!.textContent = `Mana ${Math.round(state.player.mana)}/${state.player.maxMana}`;
  hud.querySelector("[data-testid='gold']")!.textContent = `Gold ${state.player.gold}`;
  hud.querySelector("[data-testid='potion']")!.textContent = `Potion (${state.player.potions})`;
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
