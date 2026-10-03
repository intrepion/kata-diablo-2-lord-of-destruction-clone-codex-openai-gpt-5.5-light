import { describe, expect, it } from "vitest";
import { advanceFoundation, createFoundationState, setClickDestination } from "../../src/domain/foundations";

describe("Foundations", () => {
  it("records Click-To-Move intent", () => {
    const state = setClickDestination(createFoundationState(), { x: 3, y: 2 });

    expect(state.player.destination).toEqual({ x: 3, y: 2 });
    expect(state.message).toContain("Click-To-Move intent");
  });

  it("advances the Ashbound toward the destination deterministically", () => {
    const state = setClickDestination(createFoundationState(), { x: 10, y: 0 });
    const advanced = advanceFoundation(state, 1);

    expect(advanced.player.position.x).toBeGreaterThan(5);
    expect(advanced.player.position.x).toBeLessThan(6);
    expect(advanced.player.position.y).toBe(0);
  });
});
