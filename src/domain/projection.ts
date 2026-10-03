export type WorldPoint = {
  x: number;
  y: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type IsoCamera = {
  origin: ScreenPoint;
  tileWidth: number;
  tileHeight: number;
};

export const defaultCamera: IsoCamera = {
  origin: { x: 640, y: 220 },
  tileWidth: 64,
  tileHeight: 32
};

export function worldToScreen(point: WorldPoint, camera: IsoCamera = defaultCamera): ScreenPoint {
  return {
    x: camera.origin.x + (point.x - point.y) * (camera.tileWidth / 2),
    y: camera.origin.y + (point.x + point.y) * (camera.tileHeight / 2)
  };
}

export function screenToWorld(point: ScreenPoint, camera: IsoCamera = defaultCamera): WorldPoint {
  const dx = point.x - camera.origin.x;
  const dy = point.y - camera.origin.y;
  return {
    x: dy / camera.tileHeight + dx / camera.tileWidth,
    y: dy / camera.tileHeight - dx / camera.tileWidth
  };
}

export function distance(a: WorldPoint, b: WorldPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
