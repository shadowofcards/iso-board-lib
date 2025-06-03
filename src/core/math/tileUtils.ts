/**
 * Funções auxiliares para trabalho com tiles: vizinhança, adjacência, etc.
 */

/**
 * Retorna as 4 posições vizinhas (N, S, L, O) do tile (x,y).
 */
export function getNeighbors(
  tileX: number,
  tileY: number
): Array<{ x: number; y: number }> {
  return [
    { x: tileX, y: tileY - 1 }, // norte
    { x: tileX + 1, y: tileY }, // leste
    { x: tileX, y: tileY + 1 }, // sul
    { x: tileX - 1, y: tileY }, // oeste
  ];
}

/**
 * Retorna true se dois tiles (a e b) são adjacentes ortogonalmente.
 */
export function areTilesAdjacent(
  a: { x: number; y: number },
  b: { x: number; y: number }
): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}
