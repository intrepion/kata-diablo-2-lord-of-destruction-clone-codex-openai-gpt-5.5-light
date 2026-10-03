import { describe, expect, it } from "vitest";
import { screenToWorld, worldToScreen, type IsoCamera } from "../../src/domain/projection";

const camera: IsoCamera = {
  origin: { x: 400, y: 120 },
  tileWidth: 80,
  tileHeight: 40
};

describe("isometric projection", () => {
  it("round-trips world points through screen projection", () => {
    const world = { x: 6.5, y: -2.25 };
    const screen = worldToScreen(world, camera);

    expect(screenToWorld(screen, camera)).toEqual({
      x: expect.closeTo(world.x, 5),
      y: expect.closeTo(world.y, 5)
    });
  });
});
