import { toTilePos } from './isoCoordinate';
import { CULLING_TILE_THRESHOLD } from '../config';

export interface ViewportBounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

export interface VisibleTileRange {
  startX: number; endX: number;
  startY: number; endY: number;
  totalTiles: number;
}

/* ---------- buffer adaptativo ------------------------------------ */

function adaptiveBuffer(zoom: number): number {
  if (zoom < 0.15) return 12;
  if (zoom < 0.35) return 8;
  if (zoom < 0.65) return 6;
  if (zoom < 1.25) return 4;
  return 3;
}

/* ---------- range visível ---------------------------------------- */

export function calculateVisibleTileRange(
  cameraX: number, cameraY: number,
  zoom: number,
  viewportW: number, viewportH: number,
  tileW: number, tileH: number,
  boardW: number, boardH: number,
  bufferTiles?: number,
): VisibleTileRange {
  const buffer = bufferTiles ?? adaptiveBuffer(zoom);

  const effW = (viewportW / zoom) * 1.25;
  const effH = (viewportH / zoom) * 1.25;

  const bounds = {
    minX: cameraX - effW / 2,
    maxX: cameraX + effW / 2,
    minY: cameraY - effH / 2,
    maxY: cameraY + effH / 2,
  };

  let minTX = boardW, maxTX = -1,
      minTY = boardH, maxTY = -1;

  /* quatro cantos do viewport */
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.maxY },
  ];

  for (const c of corners) {
    const tc = toTilePos(c.x, c.y, tileW, tileH);
    minTX = Math.min(minTX, tc.tileX);
    maxTX = Math.max(maxTX, tc.tileX);
    minTY = Math.min(minTY, tc.tileY);
    maxTY = Math.max(maxTY, tc.tileY);
  }

  const startX = Math.max(0, Math.floor(minTX) - buffer);
  const endX   = Math.min(boardW - 1, Math.ceil(maxTX) + buffer);
  const startY = Math.max(0, Math.floor(minTY) - buffer);
  const endY   = Math.min(boardH - 1, Math.ceil(maxTY) + buffer);

  return {
    startX, endX, startY, endY,
    totalTiles: (endX - startX + 1) * (endY - startY + 1),
  };
}

/* ---------- LOD e helpers --------------------------------------- */

export function isTileVisible(
  x: number, y: number, v: VisibleTileRange,
): boolean {
  return x >= v.startX && x <= v.endX && y >= v.startY && y <= v.endY;
}

export function calculateLevelOfDetail(z: number): number {
  if (z < 0.25) return 0;
  if (z < 0.50) return 1;
  if (z < 0.85) return 2;
  if (z < 1.50) return 3;
  return 4;
}

export const shouldRenderGrid        = (z: number, lod: number) => z >= 0.35 && lod >= 1;
export const shouldRenderDecorations = (z: number, lod: number) => z >= 0.9  && lod >= 2;

export function getGridSamplingRate(z: number): number {
  if (z < 0.12) return 16;
  if (z < 0.30) return 8;
  if (z < 0.55) return 4;
  if (z < 1.10) return 2;
  return 1;
}

export function hasSignificantViewportChange(
  cur: VisibleTileRange,
  last: VisibleTileRange | null,
  curZoom: number,
  lastZoom: number,
): boolean {
  if (!last) return true;

  const zoomTol = curZoom < 0.5 ? 0.002 : 0.001;
  const posTol  = curZoom < 0.5 ? 3     : 2;

  const zoomChanged = Math.abs(curZoom - lastZoom) > zoomTol;
  const posChanged  =
    Math.abs(cur.startX - last.startX) > posTol ||
    Math.abs(cur.endX   - last.endX)   > posTol ||
    Math.abs(cur.startY - last.startY) > posTol ||
    Math.abs(cur.endY   - last.endY)   > posTol;

  return zoomChanged || posChanged;
}

/* ---------- ativa/desativa culling ------------------------------ */

export function shouldUseViewportCulling(
  boardW: number, boardH: number,
): boolean {
  return boardW * boardH > CULLING_TILE_THRESHOLD;
}
