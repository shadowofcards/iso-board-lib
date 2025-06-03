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

/* ------------------------------------------------------------------ */
/*  AJUSTES DE BUFFER E SAMPLING PARA NAVEGAÇÃO MAIS SUAVE            */
/* ------------------------------------------------------------------ */

function calculateAdaptiveBuffer(zoom: number): number {
  if (zoom < 0.15) return 12;
  if (zoom < 0.35) return 8;
  if (zoom < 0.65) return 6;
  if (zoom < 1.25) return 4;
  return 3;
}

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
  bufferTiles?: number
): VisibleTileRange {
  const buffer = bufferTiles ?? calculateAdaptiveBuffer(zoom);

  const effW = (viewportWidth / zoom) * 1.25; // 25 % extra
  const effH = (viewportHeight / zoom) * 1.25;

  const bounds = {
    minX: cameraX - effW / 2,
    maxX: cameraX + effW / 2,
    minY: cameraY - effH / 2,
    maxY: cameraY + effH / 2,
  };

  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.maxY },
  ];

  let minTileX = boardWidth;
  let maxTileX = -1;
  let minTileY = boardHeight;
  let maxTileY = -1;

  for (const c of corners) {
    const tc = toTilePos(c.x, c.y, tileSize, tileHeight);
    if (tc) {
      minTileX = Math.min(minTileX, tc.tileX);
      maxTileX = Math.max(maxTileX, tc.tileX);
      minTileY = Math.min(minTileY, tc.tileY);
      maxTileY = Math.max(maxTileY, tc.tileY);
    }
  }

  const startX = Math.max(0, Math.floor(minTileX) - buffer);
  const endX = Math.min(boardWidth - 1, Math.ceil(maxTileX) + buffer);
  const startY = Math.max(0, Math.floor(minTileY) - buffer);
  const endY = Math.min(boardHeight - 1, Math.ceil(maxTileY) + buffer);

  return {
    startX,
    endX,
    startY,
    endY,
    totalTiles: (endX - startX + 1) * (endY - startY + 1),
  };
}

/* ------------------------- VISIBILIDADE & LOD ------------------------- */

export function isTileVisible(
  tileX: number,
  tileY: number,
  v: VisibleTileRange
): boolean {
  return tileX >= v.startX && tileX <= v.endX && tileY >= v.startY && tileY <= v.endY;
}

export function calculateLevelOfDetail(zoom: number): number {
  if (zoom < 0.25) return 0;
  if (zoom < 0.50) return 1;
  if (zoom < 0.85) return 2;
  if (zoom < 1.50) return 3;
  return 4;
}

export function shouldRenderGrid(zoom: number, lod: number): boolean {
  return zoom >= 0.35 && lod >= 1;
}

export function shouldRenderDecorations(zoom: number, lod: number): boolean {
  return zoom >= 0.9 && lod >= 2;
}

export function getGridSamplingRate(zoom: number): number {
  if (zoom < 0.12) return 16;
  if (zoom < 0.30) return 8;
  if (zoom < 0.55) return 4;
  if (zoom < 1.1) return 2;
  return 1;
}

export function hasSignificantViewportChange(
  cur: VisibleTileRange,
  last: VisibleTileRange | null,
  curZoom: number,
  lastZoom: number
): boolean {
  if (!last) return true;

  const zoomTol = curZoom < 0.5 ? 0.002 : 0.001;
  const posTol = curZoom < 0.5 ? 3 : 2;

  const zoomChanged = Math.abs(curZoom - lastZoom) > zoomTol;
  const posChanged =
    Math.abs(cur.startX - last.startX) > posTol ||
    Math.abs(cur.endX - last.endX) > posTol ||
    Math.abs(cur.startY - last.startY) > posTol ||
    Math.abs(cur.endY - last.endY) > posTol;

  return zoomChanged || posChanged;
}

export function shouldUseViewportCulling(
  boardWidth: number,
  boardHeight: number
): boolean {
  return boardWidth * boardHeight > 100;
}
