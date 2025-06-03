import { useState, useCallback } from 'react';
import type { TileData, TilePosition } from '../core/models/Tile';
import type { BoardState } from '../core/models/Board';
import {
  getTileAt,
  getOrthogonalNeighbors,
  getSurroundingTiles,
  canPlaceTile
} from '../core/math/tileUtils';

export interface UseBoardControllerResult {
  tiles: TileData[];
  boardSize: { rows: number; cols: number };
  addTile: (tile: TileData) => void;
  removeTile: (tileId: string) => void;
  moveTile: (tileId: string, to: TilePosition) => void;
  getTileAt: (position: TilePosition) => TileData | undefined;
  getOrthogonalNeighbors: (position: TilePosition) => TileData[];
  getSurroundingTiles: (position: TilePosition) => TileData[];
  canPlaceTileAt: (position: TilePosition) => boolean;
}

export function useBoardController(
  initialTiles: TileData[] = [],
  boardSize = { rows: 100, cols: 100 }
): UseBoardControllerResult {
  const [tiles, setTiles] = useState<TileData[]>(initialTiles);

  // NOTA: não colocamos `boardState` aqui, pois ele é recriado a cada render.
  // Quando precisamos dele, montamos inline: { tiles, size: boardSize }.

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

  const getTileAtPos = useCallback(
    (position: TilePosition) => {
      // Montamos o estado do board inline, sempre atualizado
      const state: BoardState = { tiles, size: boardSize };
      return getTileAt(state, position);
    },
    [tiles, boardSize]
  );

  const getOrthogonalNeighborsAt = useCallback(
    (position: TilePosition) => {
      const state: BoardState = { tiles, size: boardSize };
      return getOrthogonalNeighbors(state, position);
    },
    [tiles, boardSize]
  );

  const getSurroundingAt = useCallback(
    (position: TilePosition) => {
      const state: BoardState = { tiles, size: boardSize };
      return getSurroundingTiles(state, position);
    },
    [tiles, boardSize]
  );

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
