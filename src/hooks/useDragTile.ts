import { useState, useCallback, useRef } from 'react';
import type { TileData } from '../core/models/Tile';
import type { DragState } from '../core/engine/DragController';

/**
 * Mantém apenas transições de estado em React; posição do mouse em ref →
 * evita repaint a cada movimento.
 */
export function useDragTile() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tile: null,
    ghostPos: null,
  });

  const ghostPosRef = useRef<{ x: number; y: number } | null>(null);

  const onDragStart = useCallback((tile: TileData, start: { x: number; y: number }) => {
    ghostPosRef.current = start;
    setDragState({ isDragging: true, tile, ghostPos: start });
  }, []);

  const onDragMove = useCallback((pos: { x: number; y: number }) => {
    if (!dragState.isDragging) return;
    ghostPosRef.current = pos;
    requestAnimationFrame(() => {
      setDragState(prev => prev.isDragging ? { ...prev, ghostPos: ghostPosRef.current } : prev);
    });
  }, [dragState.isDragging]);

  const onDragEnd = useCallback(() => {
    setDragState({ isDragging: false, tile: null, ghostPos: null });
    ghostPosRef.current = null;
  }, []);

  return { dragState, onDragStart, onDragMove, onDragEnd };
}
