import { describe, expect, it } from "vitest";
import { castSkill, chooseSkillLine, createGameState, enterBossRoom } from "../../src/domain/game";

describe("Brute Reckoning", () => {
  it("enters an authored Boss Room with Ashen Brute reinforcements", () => {
    const state = enterBossRoom(createGameState());

    expect(state.player.zone).toBe("boss");
    expect(state.enemies.map((enemy) => enemy.family)).toEqual(["ashenBrute", "swarmMelee", "swarmMelee"]);
  });

  it("defeats the Ashen Brute and returns to town with reward and skill point", () => {
    let state = enterBossRoom(createGameState());
    state = castSkill(state, "emberBolt");
    state = { ...state, player: { ...state.player, cooldowns: { ...state.player.cooldowns, emberBolt: 0 }, mana: 60 } };
    state = castSkill(state, "emberBolt");

    expect(state.player.zone).toBe("town");
    expect(state.player.level).toBe(2);
    expect(state.player.skillPoints).toBe(1);
    expect(state.player.miniActComplete).toBe(true);
  });

  it("spends a level-up skill point on a Skill Line choice", () => {
    const rewarded = { ...createGameState(), player: { ...createGameState().player, skillPoints: 1 } };

    const state = chooseSkillLine(rewarded, "Embercraft");

    expect(state.player.skillPoints).toBe(0);
    expect(state.message).toContain("Embercraft");
  });
});
