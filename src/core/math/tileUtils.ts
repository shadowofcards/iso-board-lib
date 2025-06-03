import type { TileData, TilePosition } from '../models/Tile';
import type { BoardState } from '../models/Board';

/**
 * Verifica se o tile pode ser colocado em uma posição válida (sem colisão com 'locked').
 */
export function canPlaceTile(
  state: BoardState,
  position: TilePosition
): boolean {
  return !state.tiles.some(tile => {
    return (
      tile.position.row === position.row &&
      tile.position.col === position.col &&
      tile.locked
    );
  });
}

/**
 * Retorna todos os tiles ao redor de uma posição (ortogonal + diagonal).
 */
export function getSurroundingTiles(
  state: BoardState,
  position: TilePosition
): TileData[] {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 }
  ];

  return deltas
    .map(delta => {
      const pos = { row: position.row + delta.row, col: position.col + delta.col };
      return state.tiles.find(
        tile => tile.position.row === pos.row && tile.position.col === pos.col
      );
    })
    .filter((tile): tile is TileData => tile !== undefined);
}
