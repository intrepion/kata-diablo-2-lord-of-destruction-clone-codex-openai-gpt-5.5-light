import { describe, expect, it } from "vitest";
import { advanceGame, castSkill, createGameState, enterWilderness, usePotion } from "../../src/domain/game";

describe("First Blood", () => {
  it("starts wilderness combat with Swarm Melee and Ranged Cultist enemies", () => {
    const state = enterWilderness(createGameState());

    expect(state.player.zone).toBe("wilderness");
    expect(state.enemies.map((enemy) => enemy.family)).toEqual(["swarmMelee", "swarmMelee", "rangedCultist"]);
  });

  it("lets Cleave damage clustered enemies", () => {
    const state = enterWilderness(createGameState());
    const close = {
      ...state,
      player: { ...state.player, position: { x: 5, y: 2 }, destination: { x: 5, y: 2 } }
    };

    const after = castSkill(close, "cleave");

    expect(after.enemies[0].health).toBeLessThan(after.enemies[0].maxHealth);
    expect(after.player.mana).toBeLessThan(close.player.mana);
  });

  it("uses a potion from the Potion Belt", () => {
    const state = createGameState();
    const hurt = { ...state, player: { ...state.player, health: 50 } };

    const after = usePotion(hurt);

    expect(after.player.health).toBe(95);
    expect(after.player.potions).toBe(2);
  });

  it("returns to town and pays the Death Toll when health reaches zero", () => {
    const state = enterWilderness(createGameState());
    const fallen = { ...state, player: { ...state.player, health: 0, gold: 80 } };

    const after = advanceGame(fallen, 0.1);

    expect(after.player.zone).toBe("town");
    expect(after.player.gold).toBe(60);
    expect(after.message).toContain("Death Toll");
  });
});
