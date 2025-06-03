import { useState, useCallback } from 'react';
import type { TileData, TilePosition } from '../core/models/Tile';
import type { BoardState } from '../core/models/Board';
import {
  getTileAt,
  getOrthogonalNeighbors,
  getSurroundingTiles,
  canPlaceTile,
} from '../core/math/tileUtils';

/**
 * UseBoardControllerResult
 *
 * Defines the API returned by the useBoardController hook.
 */
export interface UseBoardControllerResult {
  /** Current list of tiles on the board */
  tiles: TileData[];
  /** Board dimensions in grid units */
  boardSize: { rows: number; cols: number };
  /**
   * Adds a new tile to the board.
   * @param tile - The TileData to insert
   */
  addTile: (tile: TileData) => void;
  /**
   * Removes a tile by its unique ID.
   * @param tileId - ID of the tile to remove
   */
  removeTile: (tileId: string) => void;
  /**
   * Moves an existing tile to a new grid position.
   * @param tileId - ID of the tile to move
   * @param to - The destination grid position
   */
  moveTile: (tileId: string, to: TilePosition) => void;
  /**
   * Returns the tile occupying a given grid position, if any.
   * @param position - The grid coordinates to check
   * @returns TileData or undefined
   */
  getTileAt: (position: TilePosition) => TileData | undefined;
  /**
   * Returns orthogonally adjacent tiles (up, down, left, right).
   * @param position - The grid coordinates whose neighbors to retrieve
   * @returns Array of orthogonal TileData neighbors
   */
  getOrthogonalNeighbors: (position: TilePosition) => TileData[];
  /**
   * Returns all surrounding tiles (orthogonal + diagonal).
   * @param position - The grid coordinates whose surrounding tiles to retrieve
   * @returns Array of surrounding TileData
   */
  getSurroundingTiles: (position: TilePosition) => TileData[];
  /**
   * Checks if a new tile can be placed at the given grid position.
   * Conditions:
   *   - Within board bounds
   *   - No locked tile already occupies that position
   * @param position - The grid coordinates to check
   * @returns True if placement is allowed; otherwise false
   */
  canPlaceTileAt: (position: TilePosition) => boolean;
}

/**
 * useBoardController
 *
 * React hook that manages the list of tiles on an isometric board. Internally
 * tracks `tiles` in state, and provides utility functions for common board operations:
 *   - addTile, removeTile, moveTile
 *   - getTileAt, getOrthogonalNeighbors, getSurroundingTiles, canPlaceTileAt
 *
 * @param initialTiles - Optional initial array of TileData
 * @param boardSize - Dimensions of the board in grid units ({ rows, cols })
 * @returns UseBoardControllerResult
 */
export function useBoardController(
  initialTiles: TileData[] = [],
  boardSize = { rows: 100, cols: 100 }
): UseBoardControllerResult {
  // Component state: current array of TileData
  const [tiles, setTiles] = useState<TileData[]>(initialTiles);

  // NOTE: We do not store a persistent `boardState` object here because
  // it would be re-created on every render. Instead, we build it inline
  // when needed: { tiles, size: boardSize }.

  /**
   * Adds `tile` to the board (appends to the tiles array).
   */
  const addTile = useCallback((tile: TileData) => {
    setTiles((prev) => [...prev, tile]);
  }, []);

  /**
   * Removes the tile with the specified `tileId` from the board.
   */
  const removeTile = useCallback((tileId: string) => {
    setTiles((prev) => prev.filter((t) => t.id !== tileId));
  }, []);

  /**
   * Moves the tile with `tileId` to a new grid position `to`.
   */
  const moveTile = useCallback((tileId: string, to: TilePosition) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, position: to } : t))
    );
  }, []);

  /**
   * Returns the tile at the given `position`, or undefined if none found.
   */
  const getTileAtPos = useCallback(
    (position: TilePosition) => {
      const state: BoardState = { tiles, size: boardSize };
      return getTileAt(state, position);
    },
    [tiles, boardSize]
  );

  /**
   * Returns orthogonally adjacent tiles at the specified `position`.
   */
  const getOrthogonalNeighborsAt = useCallback(
    (position: TilePosition) => {
      const state: BoardState = { tiles, size: boardSize };
      return getOrthogonalNeighbors(state, position);
    },
    [tiles, boardSize]
  );

  /**
   * Returns all surrounding tiles (orthogonal + diagonal) at the specified `position`.
   */
  const getSurroundingAt = useCallback(
    (position: TilePosition) => {
      const state: BoardState = { tiles, size: boardSize };
      return getSurroundingTiles(state, position);
    },
    [tiles, boardSize]
  );

  /**
   * Checks if a tile can be placed at `position` (within bounds and not colliding with a locked tile).
   */
  const canPlaceTileAt = useCallback(
    (position: TilePosition) => {
      const state: BoardState = { tiles, size: boardSize };
      return canPlaceTile(state, position);
    },
    [tiles, boardSize]
  );

  return {
    tiles,
    boardSize,
    addTile,
    removeTile,
    moveTile,
    getTileAt: getTileAtPos,
    getOrthogonalNeighbors: getOrthogonalNeighborsAt,
    getSurroundingTiles: getSurroundingAt,
    canPlaceTileAt,
  };
}
