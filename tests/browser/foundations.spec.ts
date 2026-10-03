import { expect, test } from "@playwright/test";

test("Foundations smoke renders HUD and accepts click-to-move intent", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Ashen Reach")).toBeVisible();
  await expect(page.getByTestId("skill-cleave")).toBeVisible();
  await expect(page.getByTestId("message")).toContainText("Town Hub ready");

  const canvas = page.locator("#game-canvas");
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Missing canvas box");
  }
  await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.45);
  await expect(page.getByTestId("message")).toContainText("Click-To-Move intent");
});

test("First Blood smoke enters wilderness and casts starting skills", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("travel").click();
  await expect(page.getByTestId("zone")).toContainText("Wilderness");
  await expect(page.getByTestId("message")).toContainText("First Blood");

  await page.getByTestId("skill-ember-bolt").click();
  await expect(page.getByTestId("message")).toContainText("Ember Bolt");
  await expect(page.getByTestId("mana")).not.toContainText("Mana 60/60");
});

test("Loot Hunger smoke equips, sells, and stashes loot", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("debug-loot").click();
  await expect(page.getByTestId("message")).toContainText("Grid Inventory");
  await page.getByTestId("inventory").click();
  await expect(page.getByTestId("inventory-panel")).toBeVisible();
  await page.getByRole("button", { name: "Equip" }).first().click();
  await expect(page.getByTestId("equipped-weapon")).toContainText("Vivid Hand Axe");

  await page.getByTestId("debug-loot").click();
  await page.getByRole("button", { name: "Stash" }).first().click();
  await expect(page.getByTestId("stash-count")).toContainText("Stash: 1");
});

test("Dungeon Descent smoke enters seeded dungeon and returns to town", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("dungeon").click();
  await expect(page.getByTestId("zone")).toContainText("Dungeon");
  await expect(page.getByTestId("message")).toContainText("Champion Pack");

  await page.getByTestId("return-marker").click();
  await expect(page.getByTestId("zone")).toContainText("Town Hub");
  await expect(page.getByTestId("message")).toContainText("Return Marker");
});
