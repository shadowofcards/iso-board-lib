import type { TileData, TilePosition } from './Tile';

export interface BoardState {
  tiles: TileData[];
  size: {
    rows: number;
    cols: number;
  };
}

/**
 * Retorna um tile que esteja na posição exata (row, col).
 */
export function getTileAtPosition(
  state: BoardState,
  position: TilePosition
): TileData | undefined {
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
 * Verifica se uma posição está ocupada por algum tile.
 */
export function isTileOccupied(
  state: BoardState,
  position: TilePosition
): boolean {
  return !!getTileAtPosition(state, position);
}

/**
 * Retorna os tiles adjacentes a uma posição (máximo 4 direções ortogonais).
 */
export function getNeighborTiles(
  state: BoardState,
  position: TilePosition
): TileData[] {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
  ];

  return deltas
    .map((delta) => {
      const pos = { row: position.row + delta.row, col: position.col + delta.col };
      return getTileAtPosition(state, pos);
    })
    .filter((tile): tile is TileData => tile !== undefined);
}
