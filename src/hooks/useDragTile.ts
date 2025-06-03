import { useState, useRef, useCallback } from 'react';
import { DragController } from '../core/engine/DragController';
import type { TileData, TilePosition } from '../core/models/Tile';

interface DragPreview {
  tile: TileData;
  position: TilePosition;
}

/**
 * useDragTile
 *
 * React hook that encapsulates drag-and-preview logic for a single tile.
 * Internally delegates all state management to DragController, and exposes
 * methods to start, update, and end a drag operation. The hook returns
 * a `dragging` preview state so the UI can re-render a semi-transparent
 * preview of the tile at its current grid position.
 *
 * @returns An object with:
 *  - dragging: { tile, position } | null   // Current preview state
 *  - startDrag(tile): void                  // Begin dragging the specified tile
 *  - updatePosition(position): void         // Update preview to a new grid position
 *  - endDrag(): { tile, position } | null   // Finish drag and return final tile+position
 */
export function useDragTile() {
  // Single DragController instance for this hook’s lifetime
  const controllerRef = useRef<DragController>(new DragController());

  // React state that tracks the current preview (or null if no drag is in progress)
  const [preview, setPreview] = useState<DragPreview | null>(null);

  /**
   * startDrag
   *
   * Begins dragging a tile. Delegates to DragController, then updates the
   * preview state so that the UI can render the initial preview tile (at its
   * current grid position).
   *
   * @param tile - The TileData to begin dragging
   */
  const startDrag = useCallback((tile: TileData) => {
    controllerRef.current.startDrag(tile);
    const current = controllerRef.current.getPreview();
    setPreview(current);
  }, []);

  /**
   * updatePosition
   *
   * Updates the preview position during a drag operation. Expects the caller
   * (usually a mousemove or pointermove handler) to compute the new grid
   * position and pass it in. Delegates to DragController, then updates React
   * state so that the UI re-renders the preview tile at its new location.
   *
   * @param position - The new grid position to preview (row, col)
   */
  const updatePosition = useCallback((position: TilePosition) => {
    controllerRef.current.updatePreviewPosition(position);
    const current = controllerRef.current.getPreview();
    setPreview(current);
  }, []);

  /**
   * endDrag
   *
   * Ends the drag operation. Delegates to DragController to retrieve the final
   * tile and position. Clears the preview state (so the UI stops rendering a
   * semi-transparent tile). Returns the final { tile, position } or null if
   * no drag was in progress.
   *
   * @returns { tile, position } if there was an active drag; otherwise null
   */
  const endDrag = useCallback(() => {
    const result = controllerRef.current.endDrag();
    setPreview(null);
    return result;
  }, []);

  return {
    /** Current preview state (tile + grid position) or null */  
    dragging: preview,
    /** Call to begin dragging a specific tile */
    startDrag,
    /** Call to update the preview’s grid position during drag */
    updatePosition,
    /** Call to finalize the drag and retrieve the final tile+position */
    endDrag,
  };
}
