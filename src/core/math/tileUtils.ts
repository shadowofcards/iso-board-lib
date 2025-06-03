import type { TileData, TilePosition } from '../models/Tile';
import type { BoardState } from '../models/Board';

/**
 * Checks whether a given grid position is within the board’s bounds.
 *
 * @param state - The current board state, including size and tiles
 * @param position - The grid position to validate
 * @returns True if 0 ≤ row < rows and 0 ≤ col < cols; otherwise false
 */
function isWithinBounds(
  state: BoardState,
  position: TilePosition
): boolean {
  return (
    position.row >= 0 &&
    position.col >= 0 &&
    position.row < state.size.rows &&
    position.col < state.size.cols
  );
}

/**
 * Returns the TileData occupying exactly the specified grid position, or undefined if none.
 *
 * @param state - The board state, including all tiles and dimensions
 * @param position - The target grid position
 * @returns The TileData at that position, or undefined if out-of-bounds or empty
 */
export function getTileAt(
  state: BoardState,
  position: TilePosition
): TileData | undefined {
  if (!isWithinBounds(state, position)) return undefined;
  return state.tiles.find(
    (tile) =>
      tile.position.row === position.row &&
      tile.position.col === position.col
  );
}

/**
 * Determines if a new tile can be placed at the given position.
 * Conditions:
 *   1. The position must be within the board’s bounds.
 *   2. There must not already be a locked tile at that position.
 *
 * @param state - The board state, including all tiles and dimensions
 * @param position - The grid position to check
 * @returns True if placement is allowed; otherwise false
 */
export function canPlaceTile(
  state: BoardState,
  position: TilePosition
): boolean {
  if (!isWithinBounds(state, position)) return false;
  return !state.tiles.some(
    (tile) =>
      tile.position.row === position.row &&
      tile.position.col === position.col &&
      tile.locked
  );
}

/**
 * Returns an array of all orthogonally adjacent tiles (up, down, left, right).
 *
 * @param state - The board state, including all tiles
 * @param position - The grid position whose neighbors to retrieve
 * @returns An array of TileData for each orthogonal neighbor (could be empty)
 */
export function getOrthogonalNeighbors(
  state: BoardState,
  position: TilePosition
): TileData[] {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  return deltas
    .map((delta) => ({
      row: position.row + delta.row,
      col: position.col + delta.col,
    }))
    .map((pos) => getTileAt(state, pos))
    .filter((tile): tile is TileData => tile !== undefined);
}

/**
 * Returns an array of all diagonally adjacent tiles (4 diagonal directions).
 *
 * @param state - The board state, including all tiles
 * @param position - The grid position whose diagonal neighbors to retrieve
 * @returns An array of TileData for each diagonal neighbor (could be empty)
 */
export function getDiagonalNeighbors(
  state: BoardState,
  position: TilePosition
): TileData[] {
  const deltas = [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ];

  return deltas
    .map((delta) => ({
      row: position.row + delta.row,
      col: position.col + delta.col,
    }))
    .map((pos) => getTileAt(state, pos))
    .filter((tile): tile is TileData => tile !== undefined);
}

/**
 * Returns all tiles adjacent to a given position, both orthogonally and diagonally.
 *
 * @param state - The board state, including all tiles
 * @param position - The grid position whose surrounding tiles to retrieve
 * @returns An array of TileData for every neighboring tile (orthogonal + diagonal)
 */
export function getSurroundingTiles(
  state: BoardState,
  position: TilePosition
): TileData[] {
  return [
    ...getOrthogonalNeighbors(state, position),
    ...getDiagonalNeighbors(state, position),
  ];
}
