import { describe, expect, it } from "vitest";
import {
  addLootToInventory,
  createGameState,
  createLootDrop,
  equipInventoryItem,
  sellInventoryItem,
  stashInventoryItem,
  toggleInventory
} from "../../src/domain/game";

describe("Loot Hunger", () => {
  it("adds generated affix loot into the Grid Inventory", () => {
    const item = createLootDrop(20, "weapon");
    const state = addLootToInventory(createGameState(), item);

    expect(item.rarity).toBe("rare");
    expect(item.affixes).toEqual(["of Leech"]);
    expect(state.player.inventory[0]).toMatchObject({ x: 0, y: 0 });
  });

  it("equips inventory loot into its Equipment Slot", () => {
    const item = createLootDrop(20, "weapon");
    const state = equipInventoryItem(addLootToInventory(createGameState(), item), item.id);

    expect(state.player.equipment.weapon?.id).toBe(item.id);
    expect(state.player.inventory).toHaveLength(0);
  });

  it("sells and stashes inventory items through town services", () => {
    const weapon = createLootDrop(20, "weapon");
    const offhand = createLootDrop(22, "offhand");
    const stocked = addLootToInventory(addLootToInventory(createGameState(), weapon), offhand);
    const sold = sellInventoryItem(stocked, weapon.id);
    const stashed = stashInventoryItem(sold, offhand.id);

    expect(sold.player.gold).toBe(135);
    expect(stashed.player.stash[0].id).toBe(offhand.id);
  });

  it("pauses the world while inventory comparison is open", () => {
    const state = toggleInventory(createGameState());

    expect(state.player.inventoryOpen).toBe(true);
    expect(state.message).toContain("paused");
  });
});
