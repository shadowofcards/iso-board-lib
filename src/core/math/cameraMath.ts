/**
 * Funções matemáticas puras para pan/zoom e limites de câmera.
 */

import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_SCROLL_FACTOR,
} from '../config';

export interface Point { x: number; y: number }
export interface Viewport { width: number; height: number }
export interface BoardSize { width: number; height: number }

/* ------------------------------------------------------------------ */
/*  PANNING – mantém a câmera dentro do tabuleiro  (ou não)           */
/* ------------------------------------------------------------------ */

export function clampCamera(
  pos: Point,
  viewport: Viewport,
  boardSize: BoardSize,
): Point {
  const halfW = viewport.width  / 2;
  const halfH = viewport.height / 2;

  const minX = -halfW;
  const maxX = boardSize.width  - halfW;
  const minY = -halfH;
  const maxY = boardSize.height - halfH;

  return {
    x: Math.max(minX, Math.min(pos.x, maxX)),
    y: Math.max(minY, Math.min(pos.y, maxY)),
  };
}

export function freeCameraMovement(pos: Point): Point {
  return { ...pos };
}

/* ------------------------------------------------------------------ */
/*  ZOOM                                                               */
/* ------------------------------------------------------------------ */

export function applyZoom(current: number, delta: number): number {
  const next = current + delta * ZOOM_SCROLL_FACTOR;
  return Math.max(ZOOM_MIN, Math.min(next, ZOOM_MAX));
}
