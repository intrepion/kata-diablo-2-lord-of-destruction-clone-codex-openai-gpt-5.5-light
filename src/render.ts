import { screenToWorld, worldToScreen, type IsoCamera } from "./domain/projection";
import type { FoundationState } from "./domain/foundations";

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
        <div class="hud-row">
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

export function renderFoundation(
  context: CanvasRenderingContext2D,
  state: FoundationState,
  camera: IsoCamera
): void {
  const { canvas } = context;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#171814");
  gradient.addColorStop(1, "#07110f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawIsoGrid(context, camera);
  drawTownMarker(context, camera);

  const destination = worldToScreen(state.player.destination, camera);
  context.strokeStyle = "#f0b35a";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(destination.x, destination.y, 16, 0, Math.PI * 2);
  context.stroke();

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
