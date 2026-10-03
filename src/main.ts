import "./styles.css";
import { createFoundationState, advanceFoundation, setClickDestination } from "./domain/foundations";
import { defaultCamera } from "./domain/projection";
import { bindCanvasClick, createShell, renderFoundation } from "./render";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root");
}

const handles = createShell(root);
const context = handles.canvas.getContext("2d");
if (!context) {
  throw new Error("Canvas rendering is unavailable");
}

let state = createFoundationState();
let lastFrame = performance.now();

bindCanvasClick(handles.canvas, defaultCamera, (destination) => {
  state = setClickDestination(state, destination);
  handles.message.textContent = state.message;
});

handles.message.textContent = state.message;

function frame(now: number): void {
  const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  state = advanceFoundation(state, deltaSeconds);
  handles.message.textContent = state.message;
  renderFoundation(context as CanvasRenderingContext2D, state, defaultCamera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
