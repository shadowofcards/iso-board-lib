import React, { useRef } from 'react';
import { gridToScreen } from '../core/math/isoCoordinate';
import type { TileData } from '../core/models/Tile';

interface Props {
  /** Array of tiles currently on the board */
  tiles: TileData[];
  /** Dimensions of each tile in pixels */
  tileSize: { width: number; height: number };
  /** Camera offset in world (grid) coordinates */
  cameraOffset: { x: number; y: number };
  /** Current camera zoom factor */
  cameraZoom: number;
  /**
   * Called when a tile is clicked.
   * @param tile - The TileData that was clicked
   */
  onClick: (tile: TileData) => void;
  /**
   * Called when a drag operation for a given tile begins.
   * @param tile - The TileData being dragged
   */
  onDragStart: (tile: TileData) => void;
  /**
   * Called continuously while dragging a tile.
   * @param tile - The TileData being dragged
   * @param position - Raw screen coordinates `{ x, y }` of the pointer
   */
  onDrag: (tile: TileData, position: { x: number; y: number }) => void;
  /**
   * Called when a drag operation ends (pointer up).
   * @param tile - The TileData that was dragged
   * @param position - Final raw screen coordinates `{ x, y }` of the pointer
   */
  onDragEnd: (tile: TileData, position: { x: number; y: number }) => void;
}

/**
 * TileInteractionLayer
 *
 * Renders transparent, absolutely positioned `<div>`s over each tile’s isometric area.
 * These hitboxes capture pointer events for click, drag-start, drag, and drag-end.
 *
 * All coordinate conversions from grid → screen (and zoom applied by parent) happen here,
 * so parent callbacks receive raw screen coordinates during drag.
 */
export const TileInteractionLayer: React.FC<Props> = ({
  tiles,
  tileSize,
  cameraOffset,
  cameraZoom,
  onClick,
  onDragStart,
  onDrag,
  onDragEnd,
}) => {
  // Tracks the currently dragging tile and its pointerId
  const draggingRef = useRef<{ tile: TileData; pointerId: number } | null>(
    null
  );

  // Pointer move listener: calls onDrag with raw clientX/Y
  const handlePointerMove = (e: PointerEvent) => {
    const info = draggingRef.current;
    if (!info || e.pointerId !== info.pointerId) return;
    onDrag(info.tile, { x: e.clientX, y: e.clientY });
  };

  // Pointer up listener: ends drag and calls onDragEnd
  const handlePointerUp = (e: PointerEvent) => {
    const info = draggingRef.current;
    if (!info || e.pointerId !== info.pointerId) return;
    onDragEnd(info.tile, { x: e.clientX, y: e.clientY });
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    draggingRef.current = null;
  };

  /**
   * Returns a pointer-down handler for a specific tile.
   * - Stops propagation so clicks don’t bubble up.
   * - Registers global pointermove and pointerup listeners.
   */
  const createPointerDown =
    (tile: TileData) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      draggingRef.current = { tile, pointerId: e.pointerId };
      onDragStart(tile);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };

  return (
    <>
      {tiles.map((tile) => {
        // Convert grid position → screen position (ignoring zoom)
        const { x, y } = gridToScreen(
          tile.position,
          tileSize.width,
          tileSize.height,
          cameraOffset.x,
          cameraOffset.y
        );

        // Apply camera zoom to position and dimensions
        const scaledX = x * cameraZoom;
        const scaledY = y * cameraZoom;
        const scaledW = tileSize.width * cameraZoom;
        const scaledH = tileSize.height * cameraZoom;

        return (
          <div
            key={tile.id}
            onPointerDown={createPointerDown(tile)}
            onClick={(e) => {
              e.stopPropagation();
              onClick(tile);
            }}
            style={{
              position: 'absolute',
              left: scaledX,
              top: scaledY,
              width: scaledW,
              height: scaledH,
              cursor: 'pointer',
              backgroundColor: 'transparent',
              touchAction: 'none', // Prevent default touch actions
            }}
          />
        );
      })}
    </>
  );
};
