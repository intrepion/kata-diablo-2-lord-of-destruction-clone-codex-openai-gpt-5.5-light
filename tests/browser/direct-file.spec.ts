import { expect, test } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

test("Direct Launch opens the root index through file protocol", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("index.html")).href);

  await expect(page.getByText("Ashen Reach")).toBeVisible();
  await page.getByTestId("boss").click();
  await expect(page.getByTestId("zone")).toContainText("Boss Room");
});
