/**
 * Funções puras para lidar com câmera: limites de panning, aplicação de zoom, etc.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface BoardSize {
  width: number;
  height: number;
}

/**
 * Garante que a câmera fique dentro dos limites do tabuleiro.
 * Recebe a posição desejada (pos), o tamanho do viewport (largura e altura em px),
 * e o tamanho total do tabuleiro (em px). Retorna nova posição (x,y) dentro dos limites.
 */
export function clampCamera(
  pos: Point,
  viewport: Viewport,
  boardSize: BoardSize
): Point {
  const halfW = viewport.width / 2;
  const halfH = viewport.height / 2;

  // limites para o centro da câmera
  const minX = -halfW;
  const maxX = boardSize.width - halfW;
  const minY = -halfH;
  const maxY = boardSize.height - halfH;

  const clampedX = Math.max(minX, Math.min(pos.x, maxX));
  const clampedY = Math.max(minY, Math.min(pos.y, maxY));
  return { x: clampedX, y: clampedY };
}

/**
 * Versão da câmera sem limites - permite navegação livre por qualquer parte do mundo.
 * Retorna a posição exatamente como foi fornecida, sem qualquer clamp.
 */
export function freeCameraMovement(pos: Point): Point {
  return { ...pos };
}

/**
 * Ajusta o valor de zoom de acordo com delta (por exemplo, wheelDelta ou pinch).
 * Apenas retorna novo scale; caps mínimo e máximo podem ser aplicados externamente.
 */
export function applyZoom(current: number, delta: number): number {
  /* sensibilidade ligeiramente menor para evitar saltos grandes */
  const factor = 0.0007;
  const next = current + delta * factor;
  return Math.max(0.3, Math.min(next, 4));
}
