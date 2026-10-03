import { describe, expect, it } from "vitest";
import { buyPotion, createGameState, enterDungeon, startNewRun } from "../../src/domain/game";

describe("MVP progression gate", () => {
  it("uses gold to buy potions", () => {
    const state = buyPotion(createGameState());

    expect(state.player.gold).toBe(65);
    expect(state.player.potions).toBe(4);
  });

  it("starts a New Run with a fresh Run Seed while keeping character progress", () => {
    const complete = {
      ...createGameState(),
      player: { ...createGameState().player, level: 2, miniActComplete: true }
    };
    const state = startNewRun(complete);

    expect(state.player.level).toBe(2);
    expect(state.player.runCount).toBe(1);
    expect(state.dungeonSeed).not.toBe(complete.dungeonSeed);
  });

  it("scales dungeon pressure by Run Count and zone depth", () => {
    const baseline = enterDungeon(createGameState(), 1337);
    const later = enterDungeon(startNewRun(createGameState()), 1337);

    expect(later.enemies[0].maxHealth).toBeGreaterThan(baseline.enemies[0].maxHealth);
  });
});
