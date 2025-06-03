import { useState, useCallback } from 'react';
import {
  getTileAtPosition,
  getNeighborTiles,
  isTileOccupied
} from '../core/models/Board';
import type { TileData, TilePosition } from '../core/models/Tile';
import type { BoardState } from '../core/models/Board';

export interface UseBoardControllerResult {
  boardState: BoardState;
  tiles: TileData[];
  boardSize: { rows: number; cols: number };
  addTile: (tile: TileData) => void;
  removeTile: (tileId: string) => void;
  moveTile: (tileId: string, to: TilePosition) => void;
  getTileAt: (position: TilePosition) => TileData | undefined;
  getNeighbors: (position: TilePosition) => TileData[];
  canPlaceTileAt: (position: TilePosition) => boolean;
}

export function useBoardController(
  initialTiles: TileData[] = [],
  boardSize = { rows: 100, cols: 100 }
): UseBoardControllerResult {
  const [tiles, setTiles] = useState<TileData[]>(initialTiles);

  const boardState: BoardState = { tiles, size: boardSize };

  const addTile = useCallback((tile: TileData) => {
    setTiles(prev => [...prev, tile]);
  }, []);

  const removeTile = useCallback((tileId: string) => {
    setTiles(prev => prev.filter(t => t.id !== tileId));
  }, []);

  const moveTile = useCallback((tileId: string, to: TilePosition) => {
    setTiles(prev =>
      prev.map(t => (t.id === tileId ? { ...t, position: to } : t))
    );
  }, []);

  const getTileAt = useCallback(
    (position: TilePosition) => {
      return getTileAtPosition(boardState, position);
    },
    [boardState]
  );

  const getNeighbors = useCallback(
    (position: TilePosition) => {
      return getNeighborTiles(boardState, position);
    },
    [boardState]
  );

  const canPlaceTileAt = useCallback(
    (position: TilePosition) => {
      // Verifica limites
      if (
        position.row < 0 ||
        position.col < 0 ||
        position.row >= boardSize.rows ||
        position.col >= boardSize.cols
      ) {
        return false;
      }
      // Verifica ocupação
      return !isTileOccupied(boardState, position);
    },
    [boardState, boardSize]
  );

  return {
    boardState,
    tiles,
    boardSize,
    addTile,
    removeTile,
    moveTile,
    getTileAt,
    getNeighbors,
    canPlaceTileAt,
  };
}
