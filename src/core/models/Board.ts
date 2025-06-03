import type { TileData, TilePosition } from './Tile';

/**
 * BoardState
 *
 * Represents the full state of the board:
 *  - tiles: An array of TileData objects currently on the board
 *  - size: The board’s dimensions in grid units { rows, cols }
 */
export interface BoardState {
  tiles: TileData[];
  size: {
    rows: number;
    cols: number;
  };
}

/**
 * getTileAtPosition
 *
 * Returns the TileData at the exact grid position (row, col),
 * or undefined if out of bounds or no tile is present.
 *
 * @param state - The current board state (tiles + size)
 * @param position - The target grid coordinates
 * @returns The matching TileData, or undefined if none found or out of bounds
 */
export function getTileAtPosition(
  state: BoardState,
  position: TilePosition
): TileData | undefined {
  // Validate that the position is within the board boundaries
  if (
    position.row < 0 ||
    position.col < 0 ||
    position.row >= state.size.rows ||
    position.col >= state.size.cols
  ) {
    return undefined;
  }
  return state.tiles.find(
    (tile) =>
      tile.position.row === position.row &&
      tile.position.col === position.col
  );
}

/**
 * isTileOccupied
 *
 * Checks whether any tile occupies the specified grid position.
 *
 * @param state - The current board state (tiles + size)
 * @param position - The grid position to check
 * @returns True if a tile exists at that position; otherwise false
 */
export function isTileOccupied(
  state: BoardState,
  position: TilePosition
): boolean {
  return !!getTileAtPosition(state, position);
}

/**
 * getNeighborTiles
 *
 * Returns all orthogonally adjacent tiles (up to 4 neighbors)
 * for the given grid position. Diagonal neighbors are not included.
 *
 * @param state - The current board state (tiles + size)
 * @param position - The reference grid position
 * @returns An array of TileData objects that are adjacent orthogonally
 */
export function getNeighborTiles(
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
    .map((delta) => {
      const pos = {
        row: position.row + delta.row,
        col: position.col + delta.col,
      };
      return getTileAtPosition(state, pos);
    })
    .filter((tile): tile is TileData => tile !== undefined);
}
