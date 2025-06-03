/**
 * Conversões puramente matemáticas entre coordenadas de tile (linha/coluna)
 * e coordenadas de tela (x, y) em projeção isométrica.
 */

/**
 * Converte de (tileX, tileY) no grid para (screenX, screenY) em pixels.
 * - tileSize: largura do tile (em px) na parte larga (X).
 * - tileHeight: altura "empinada" do tile (em px) na parte vertical (Y).
 */
export function toScreenPos(
  tileX: number,
  tileY: number,
  tileSize: number,
  tileHeight: number
): { x: number; y: number } {
  const halfWidth = tileSize / 2;
  const halfHeight = tileHeight / 2;
  const screenX = (tileX - tileY) * halfWidth;
  const screenY = (tileX + tileY) * halfHeight;
  return { x: screenX, y: screenY };
}

/**
 * Converte de (screenX, screenY) em pixels para (tileX, tileY) no grid.
 * - tileSize e tileHeight devem ser os mesmos usados em toScreenPos.
 *
 * Atenção: retorna valores flutuantes; para "colocar" em um tile exato, arredonde após
 * chamar este método (por exemplo, Math.round ou Math.floor, dependendo da sua regra).
 */
export function toTilePos(
  screenX: number,
  screenY: number,
  tileSize: number,
  tileHeight: number
): { tileX: number; tileY: number } {
  const halfWidth = tileSize / 2;
  const halfHeight = tileHeight / 2;

  // Fórmulas invertendo as equações de toScreenPos
  const tileX = (screenX / halfWidth + screenY / halfHeight) / 2;
  const tileY = (screenY / halfHeight - screenX / halfWidth) / 2;
  return { tileX, tileY };
}

/**
 * Converte coordenadas de tela para coordenadas de tile com snap inteligente.
 * Usa distância para encontrar o tile mais próximo, melhorando a precisão.
 */
export function screenToTileWithSnap(
  screenX: number,
  screenY: number,
  tileSize: number,
  tileHeight: number,
  boardWidth: number,
  boardHeight: number
): { tileX: number; tileY: number } | null {
  // Conversão inicial
  const { tileX: fx, tileY: fy } = toTilePos(screenX, screenY, tileSize, tileHeight);
  
  // Candidatos para snap (tile atual e tiles adjacentes)
  const candidates = [
    { x: Math.floor(fx), y: Math.floor(fy) },
    { x: Math.ceil(fx), y: Math.floor(fy) },
    { x: Math.floor(fx), y: Math.ceil(fy) },
    { x: Math.ceil(fx), y: Math.ceil(fy) },
  ];

  let bestCandidate = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    // Verifica se está dentro dos limites
    if (candidate.x >= 0 && candidate.x < boardWidth && 
        candidate.y >= 0 && candidate.y < boardHeight) {
      
      // Calcula a posição de tela do centro deste tile
      const { x: centerX, y: centerY } = toScreenPos(
        candidate.x, candidate.y, tileSize, tileHeight
      );
      
      // Calcula distância do mouse até o centro do tile
      const distance = Math.sqrt(
        Math.pow(screenX - centerX, 2) + Math.pow(screenY - centerY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    }
  }

  // Só retorna se a distância for razoável (dentro de meio tile)
  if (bestCandidate && minDistance < Math.max(tileSize, tileHeight) / 2) {
    return { tileX: bestCandidate.x, tileY: bestCandidate.y };
  }

  return null;
}

/**
 * Verifica se um ponto de tela está dentro do diamante isométrico de um tile
 */
export function isPointInIsometricTile(
  pointX: number,
  pointY: number,
  tileX: number,
  tileY: number,
  tileSize: number,
  tileHeight: number,
  offsetX: number,
  offsetY: number
): boolean {
  const { x: centerX, y: centerY } = toScreenPos(tileX, tileY, tileSize, tileHeight);
  const worldX = centerX + offsetX;
  const worldY = centerY + offsetY;

  // Converte para coordenadas locais do diamante
  const localX = pointX - worldX;
  const localY = pointY - worldY;

  // Verifica se está dentro do diamante usando a fórmula do losango
  const halfWidth = tileSize / 2;
  const halfHeight = tileHeight / 2;
  
  return Math.abs(localX / halfWidth) + Math.abs(localY / halfHeight) <= 1;
}
