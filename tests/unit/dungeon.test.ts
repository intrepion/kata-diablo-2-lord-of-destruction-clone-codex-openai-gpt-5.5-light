import { describe, expect, it } from "vitest";
import { createGameState, enterDungeon, generateDungeon, useReturnMarker } from "../../src/domain/game";

describe("Dungeon Descent", () => {
  it("generates deterministic dungeon rooms with a champion and return marker", () => {
    const first = generateDungeon(1337);
    const second = generateDungeon(1337);

    expect(first).toEqual(second);
    expect(first.map((room) => room.kind)).toContain("champion");
    expect(first[first.length - 1]?.kind).toBe("return");
  });

  it("enters a Dungeon with a Durable Beast Champion Pack", () => {
    const state = enterDungeon(createGameState(), 1337);

    expect(state.player.zone).toBe("dungeon");
    expect(state.enemies.map((enemy) => enemy.family)).toEqual(["durableBeast", "durableBeast", "rangedCultist"]);
    expect(state.message).toContain("Champion Pack");
  });

  it("uses the Return Marker to travel back to the Town Hub", () => {
    const state = useReturnMarker(enterDungeon(createGameState(), 1337));

    expect(state.player.zone).toBe("town");
    expect(state.enemies).toHaveLength(0);
    expect(state.message).toContain("Return Marker");
  });
});
