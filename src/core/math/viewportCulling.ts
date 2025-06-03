/**
 * Sistema de Viewport Culling para otimizar renderização de boards gigantescos.
 * Só calcula e renderiza tiles que estão visíveis na tela + uma margem de segurança.
 */

import { toTilePos } from './isoCoordinate';

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface VisibleTileRange {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  totalTiles: number;
}

/**
 * Calcula quais tiles estão visíveis baseado na posição da câmera, zoom e tamanho da tela.
 * Retorna apenas o range de coordenadas que precisa ser renderizado.
 */
export function calculateVisibleTileRange(
  cameraX: number,
  cameraY: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
  tileSize: number,
  tileHeight: number,
  boardWidth: number,
  boardHeight: number,
  bufferTiles: number = 2 // Margem extra para tiles fora da tela
): VisibleTileRange {
  // Ajusta as dimensões do viewport baseado no zoom
  const effectiveViewportWidth = viewportWidth / zoom;
  const effectiveViewportHeight = viewportHeight / zoom;

  // Calcula os bounds do viewport em coordenadas do mundo
  const viewportBounds: ViewportBounds = {
    minX: cameraX - effectiveViewportWidth / 2,
    maxX: cameraX + effectiveViewportWidth / 2,
    minY: cameraY - effectiveViewportHeight / 2,
    maxY: cameraY + effectiveViewportHeight / 2,
  };

  // Converte os bounds do viewport para coordenadas de tile
  // Como o sistema isométrico é rotacionado, precisamos ser conservadores
  const corners = [
    { x: viewportBounds.minX, y: viewportBounds.minY },
    { x: viewportBounds.maxX, y: viewportBounds.minY },
    { x: viewportBounds.minX, y: viewportBounds.maxY },
    { x: viewportBounds.maxX, y: viewportBounds.maxY },
  ];

  let minTileX = boardWidth;
  let maxTileX = -1;
  let minTileY = boardHeight;
  let maxTileY = -1;

  // Converte cada canto do viewport para coordenadas de tile
  for (const corner of corners) {
    const tileCoord = toTilePos(corner.x, corner.y, tileSize, tileHeight);
    if (tileCoord) {
      minTileX = Math.min(minTileX, tileCoord.tileX);
      maxTileX = Math.max(maxTileX, tileCoord.tileX);
      minTileY = Math.min(minTileY, tileCoord.tileY);
      maxTileY = Math.max(maxTileY, tileCoord.tileY);
    }
  }

  // Adiciona buffer e clipa aos limites do board
  const startX = Math.max(0, Math.floor(minTileX) - bufferTiles);
  const endX = Math.min(boardWidth - 1, Math.ceil(maxTileX) + bufferTiles);
  const startY = Math.max(0, Math.floor(minTileY) - bufferTiles);
  const endY = Math.min(boardHeight - 1, Math.ceil(maxTileY) + bufferTiles);

  const totalTiles = (endX - startX + 1) * (endY - startY + 1);

  return {
    startX,
    endX,
    startY,
    endY,
    totalTiles,
  };
}

/**
 * Verifica se um tile específico está dentro do range visível.
 */
export function isTileVisible(
  tileX: number,
  tileY: number,
  visibleRange: VisibleTileRange
): boolean {
  return (
    tileX >= visibleRange.startX &&
    tileX <= visibleRange.endX &&
    tileY >= visibleRange.startY &&
    tileY <= visibleRange.endY
  );
}

/**
 * Calcula o nível de detalhe (LOD) baseado no zoom.
 * Zoom menor = LOD menor (menos detalhes).
 */
export function calculateLevelOfDetail(zoom: number): number {
  if (zoom < 0.25) return 0; // Muito longe - sem detalhes
  if (zoom < 0.5) return 1;  // Longe - poucos detalhes
  if (zoom < 1.0) return 2;  // Normal - detalhes médios
  if (zoom < 2.0) return 3;  // Perto - todos os detalhes
  return 4; // Muito perto - máximo detalhe
}

/**
 * Determina se devemos renderizar o grid baseado no zoom e LOD.
 */
export function shouldRenderGrid(zoom: number, lod: number): boolean {
  return zoom >= 0.5 && lod >= 2;
}

/**
 * Determina se devemos renderizar decorações (bordas, sombras) baseado no zoom.
 */
export function shouldRenderDecorations(zoom: number, lod: number): boolean {
  return zoom >= 1.0 && lod >= 3;
}

/**
 * Calcula a densidade de amostragem para o grid.
 * Com zoom muito baixo, renderiza apenas alguns tiles do grid.
 */
export function getGridSamplingRate(zoom: number): number {
  if (zoom < 0.1) return 16; // Renderiza 1 a cada 16 tiles
  if (zoom < 0.25) return 8;  // Renderiza 1 a cada 8 tiles
  if (zoom < 0.5) return 4;   // Renderiza 1 a cada 4 tiles
  if (zoom < 1.0) return 2;   // Renderiza 1 a cada 2 tiles
  return 1; // Renderiza todos os tiles
} 