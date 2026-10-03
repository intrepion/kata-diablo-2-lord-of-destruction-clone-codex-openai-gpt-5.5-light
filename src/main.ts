import "./styles.css";
import {
  addLootToInventory,
  advanceGame,
  buyPotion,
  castSkill,
  createGameState,
  createLootDrop,
  enterDungeon,
  enterBossRoom,
  enterWilderness,
  equipInventoryItem,
  chooseSkillLine,
  sellInventoryItem,
  setDestination,
  stashInventoryItem,
  startNewRun,
  toggleInventory,
  useReturnMarker,
  usePotion,
  type SkillId
} from "./domain/game";
import { defaultCamera } from "./domain/projection";
import { bindCanvasClick, createShell, renderGame } from "./render";

const saveKey = "ashen-reach-local-save";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root");
}

const handles = createShell(root);
const context = handles.canvas.getContext("2d");
if (!context) {
  throw new Error("Canvas rendering is unavailable");
}

let state = loadGame();
let lastFrame = performance.now();
let lastSaved = 0;

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
] satisfies [string, SkillId][]) {
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

function frame(now: number): void {
  const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  state = advanceGame(state, deltaSeconds);
  if (now - lastSaved > 1000) {
    saveGame(state);
    lastSaved = now;
  }
  handles.message.textContent = state.message;
  renderGame(context as CanvasRenderingContext2D, handles.hud, state, defaultCamera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

function saveGame(nextState: typeof state): void {
  localStorage.setItem(saveKey, JSON.stringify(nextState.player));
}

function loadGame(): ReturnType<typeof createGameState> {
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

function playTone(frequency: number, duration: number): void {
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
