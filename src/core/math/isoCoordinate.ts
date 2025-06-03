import type { TilePosition } from '../models/Tile';

export interface ScreenPosition {
  x: number;
  y: number;
}

/**
 * Converte uma posição no grid para posição na tela (isométrica).
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
 * Converte coordenadas de tela para posição no grid.
 * (útil para detectar clique/arraste)
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
  const col = Math.floor((tx / (tileWidth / 2) + ty / (tileHeight / 2)) / 2);
  const row = Math.floor((ty / (tileHeight / 2) - tx / (tileWidth / 2)) / 2);
  return { row, col };
}
