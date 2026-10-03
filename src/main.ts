import "./styles.css";
import { advanceGame, castSkill, createGameState, enterWilderness, setDestination, usePotion, type SkillId } from "./domain/game";
import { defaultCamera } from "./domain/projection";
import { bindCanvasClick, createShell, renderGame } from "./render";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root");
}

const handles = createShell(root);
const context = handles.canvas.getContext("2d");
if (!context) {
  throw new Error("Canvas rendering is unavailable");
}

let state = createGameState();
let lastFrame = performance.now();

bindCanvasClick(handles.canvas, defaultCamera, (destination) => {
  state = setDestination(state, destination);
  handles.message.textContent = state.message;
});

handles.hud.querySelector("[data-testid='travel']")?.addEventListener("click", () => {
  state = enterWilderness(state);
  handles.message.textContent = state.message;
});

for (const [testId, skill] of [
  ["skill-cleave", "cleave"],
  ["skill-ember-bolt", "emberBolt"],
  ["skill-bind-wretch", "bindWretch"]
] satisfies [string, SkillId][]) {
  handles.hud.querySelector(`[data-testid='${testId}']`)?.addEventListener("click", () => {
    state = castSkill(state, skill);
    handles.message.textContent = state.message;
  });
}

handles.hud.querySelector("[data-testid='potion']")?.addEventListener("click", () => {
  state = usePotion(state);
  handles.message.textContent = state.message;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "1") state = castSkill(state, "cleave");
  if (event.key === "2") state = castSkill(state, "emberBolt");
  if (event.key === "3") state = castSkill(state, "bindWretch");
  if (event.key.toLowerCase() === "q") state = usePotion(state);
  if (event.key.toLowerCase() === "t") state = enterWilderness(state);
  handles.message.textContent = state.message;
});

handles.message.textContent = state.message;

function frame(now: number): void {
  const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  state = advanceGame(state, deltaSeconds);
  handles.message.textContent = state.message;
  renderGame(context as CanvasRenderingContext2D, handles.hud, state, defaultCamera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
