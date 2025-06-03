import { useState, useCallback } from 'react';
import type { TileData } from '../core/models/Tile';
import type { DragState } from '../core/engine/DragController';

/**
 * Hook leve para manter estado de drag/inventário no React
 * Antes de delegar ao Phaser, apenas atualiza estado de drag local (ghostPos, etc).
 */
export function useDragTile() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tile: null,
    ghostPos: null,
  });

  const onDragStart = useCallback(
    (tile: TileData, startPos: { x: number; y: number }) => {
      setDragState({
        isDragging: true,
        tile,
        ghostPos: { ...startPos },
      });
    },
    []
  );

  const onDragMove = useCallback((pos: { x: number; y: number }) => {
    setDragState((prev) => {
      if (!prev.isDragging) return prev;
      return {
        ...prev,
        ghostPos: { ...pos },
      };
    });
  }, []);

  const onDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      tile: null,
      ghostPos: null,
    });
  }, []);

  return {
    dragState,
    onDragStart,
    onDragMove,
    onDragEnd,
  };
}
