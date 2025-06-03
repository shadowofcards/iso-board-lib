import type { TilePosition } from '../models/Tile';

/**
 * ScreenPosition
 *
 * Represents a point in screen (pixel) coordinates.
 */
export interface ScreenPosition {
  x: number;
  y: number;
}

/**
 * Converts a grid-based position to isometric screen coordinates.
 *
 * The formula:
 *   screenX = (col - row) * (tileWidth / 2) + offsetX
 *   screenY = (col + row) * (tileHeight / 2) + offsetY
 *
 * @param position - The tile’s grid position (row, col)
 * @param tileWidth - Width of a tile in pixels
 * @param tileHeight - Height of a tile in pixels
 * @param offsetX - World‐to‐screen X offset (in pixels)
 * @param offsetY - World‐to‐screen Y offset (in pixels)
 * @returns The corresponding screen coordinates (x, y)
 */
export function gridToScreen(
  position: TilePosition,
  tileWidth: number,
  tileHeight: number,
  offsetX = 0,
  offsetY = 0
): ScreenPosition {
  const x = (position.col - position.row) * (tileWidth / 2) + offsetX;
  const y = (position.col + position.row) * (tileHeight / 2) + offsetY;
  return { x, y };
}

/**
 * Converts screen (pixel) coordinates back to a grid position.
 *
 * This is useful for hit detection or dragging, where you need to map
 * a pointer’s (x, y) back into the underlying (row, col).
 *
 * The inverse formulas of the above:
 *   tx = screenX - offsetX
 *   ty = screenY - offsetY
 *   col = floor((tx / (tileWidth/2) + ty / (tileHeight/2)) / 2)
 *   row = floor((ty / (tileHeight/2) - tx / (tileWidth/2)) / 2)
 *
 * @param x - Screen X coordinate (in pixels)
 * @param y - Screen Y coordinate (in pixels)
 * @param tileWidth - Width of a tile in pixels
 * @param tileHeight - Height of a tile in pixels
 * @param offsetX - World‐to‐screen X offset (in pixels)
 * @param offsetY - World‐to‐screen Y offset (in pixels)
 * @returns The approximated grid position (row, col)
 */
export function screenToGrid(
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
  offsetX = 0,
  offsetY = 0
): TilePosition {
  const tx = x - offsetX;
  const ty = y - offsetY;
  const col = Math.floor(
    (tx / (tileWidth / 2) + ty / (tileHeight / 2)) / 2
  );
  const row = Math.floor(
    (ty / (tileHeight / 2) - tx / (tileWidth / 2)) / 2
  );
  return { row, col };
}
