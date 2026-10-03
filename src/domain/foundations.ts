import { distance, type WorldPoint } from "./projection";

export type Zone = "town" | "wilderness" | "dungeon" | "boss";

export type PlayerState = {
  position: WorldPoint;
  destination: WorldPoint;
  zone: Zone;
  speed: number;
};

export type FoundationState = {
  player: PlayerState;
  message: string;
  tick: number;
};

export function createFoundationState(): FoundationState {
  return {
    player: {
      position: { x: 0, y: 0 },
      destination: { x: 0, y: 0 },
      zone: "town",
      speed: 5.4
    },
    message: "Town Hub ready. Click the isometric ground to move.",
    tick: 0
  };
}

export function setClickDestination(state: FoundationState, destination: WorldPoint): FoundationState {
  return {
    ...state,
    player: {
      ...state.player,
      destination
    },
    message: `Click-To-Move intent set: ${destination.x.toFixed(1)}, ${destination.y.toFixed(1)}`
  };
}

export function advanceFoundation(state: FoundationState, deltaSeconds: number): FoundationState {
  const { player } = state;
  const remaining = distance(player.position, player.destination);
  if (remaining < 0.02) {
    return {
      ...state,
      tick: state.tick + 1,
      player: {
        ...player,
        position: player.destination
      }
    };
  }

  const step = Math.min(remaining, player.speed * deltaSeconds);
  const ratio = step / remaining;
  return {
    ...state,
    tick: state.tick + 1,
    player: {
      ...player,
      position: {
        x: player.position.x + (player.destination.x - player.position.x) * ratio,
        y: player.position.y + (player.destination.y - player.position.y) * ratio
      }
    }
  };
}
