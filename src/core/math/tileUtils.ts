import type { TileData, TilePosition } from '../models/Tile';
import type { BoardState } from '../models/Board';

/**
 * Verifica se a posição dada está dentro dos limites do board.
 */
function isWithinBounds(state: BoardState, position: TilePosition): boolean {
  return (
    position.row >= 0 &&
    position.col >= 0 &&
    position.row < state.size.rows &&
    position.col < state.size.cols
  );
}

/**
 * Retorna o TileData que ocupa exatamente aquela posição (ou undefined).
 */
export function getTileAt(state: BoardState, position: TilePosition): TileData | undefined {
  if (!isWithinBounds(state, position)) return undefined;
  return state.tiles.find(
    tile => tile.position.row === position.row && tile.position.col === position.col
  );
}

/**
 * Verifica se a posição está livre para colocar um novo tile:
 * - Dentro dos limites
 * - Sem colisão com um tile que esteja locked
 */
export function canPlaceTile(state: BoardState, position: TilePosition): boolean {
  if (!isWithinBounds(state, position)) return false;
  return !state.tiles.some(
    tile =>
      tile.position.row === position.row &&
      tile.position.col === position.col &&
      tile.locked
  );
}

/**
 * Retorna os tiles adjacentes ortogonalmente (4 direções).
 */
export function getOrthogonalNeighbors(state: BoardState, position: TilePosition): TileData[] {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
  ];

  return deltas
    .map(delta => ({ row: position.row + delta.row, col: position.col + delta.col }))
    .map(pos => getTileAt(state, pos))
    .filter((tile): tile is TileData => tile !== undefined);
}

/**
 * Retorna os tiles adjacentes diagonalmente (4 direções diagonais).
 */
export function getDiagonalNeighbors(state: BoardState, position: TilePosition): TileData[] {
  const deltas = [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 }
  ];

  return deltas
    .map(delta => ({ row: position.row + delta.row, col: position.col + delta.col }))
    .map(pos => getTileAt(state, pos))
    .filter((tile): tile is TileData => tile !== undefined);
}

/**
 * Retorna todos os tiles ao redor (ortogonal + diagonal).
 */
export function getSurroundingTiles(state: BoardState, position: TilePosition): TileData[] {
  return [
    ...getOrthogonalNeighbors(state, position),
    ...getDiagonalNeighbors(state, position)
  ];
}
