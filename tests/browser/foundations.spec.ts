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
