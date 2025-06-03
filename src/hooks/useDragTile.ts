import { useState, useRef, useCallback } from 'react';
import { DragController } from '../core/engine/DragController';
import type { TileData, TilePosition } from '../core/models/Tile';

/**
 * Hook que encapsula a lógica de “arraste” de um tile,
 * delegando todo o gerenciamento de preview ao DragController.
 */
export function useDragTile() {
  // Instancia única de DragController
  const controllerRef = useRef<DragController>(new DragController());
  // Estado React que reflete o preview (para rerenderizar a UI)
  const [preview, setPreview] = useState<{ tile: TileData; position: TilePosition } | null>(null);

  /**
   * Inicia o arraste de um dado tile.
   */
  const startDrag = useCallback((tile: TileData) => {
    controllerRef.current.startDrag(tile);
    const current = controllerRef.current.getPreview();
    setPreview(current);
  }, []);

  /**
   * Atualiza a posição de preview (screen → grid no componente que chama).
   */
  const updatePosition = useCallback((position: TilePosition) => {
    controllerRef.current.updatePreviewPosition(position);
    const current = controllerRef.current.getPreview();
    setPreview(current);
  }, []);

  /**
   * Finaliza o arraste, limpa o preview e retorna { tile, position } final.
   */
  const endDrag = useCallback(() => {
    const result = controllerRef.current.endDrag();
    setPreview(null);
    return result;
  }, []);

  return {
    dragging: preview,
    startDrag,
    updatePosition,
    endDrag,
  };
}
