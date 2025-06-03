import React from 'react';
import { gridToScreen } from '../core/math/isoCoordinate';
import type { TileData, TilePosition } from '../core/models/Tile';

interface Props {
  /**
   * If non-null, contains the tile being dragged and its current grid position.
   * Used to render a semi-transparent preview image at that grid location.
   */
  preview: { tile: TileData; position: TilePosition } | null;
  /** Size of each tile in pixels */
  tileSize: { width: number; height: number };
  /** Camera offset in world (grid) coordinates */
  cameraOffset: { x: number; y: number };
  /** Current camera zoom factor */
  cameraZoom: number;
}

/**
 * PreviewOverlay
 *
 * Renders a semi-transparent <img> at the preview tile’s screen position
 * while the user is dragging. The image is absolutely positioned on top
 * of the board, scaled by cameraZoom. Pointer events are disabled so it
 * never intercepts clicks.
 */
export const PreviewOverlay: React.FC<Props> = ({
  preview,
  tileSize,
  cameraOffset,
  cameraZoom,
}) => {
  if (!preview) {
    return null;
  }

  // Convert the preview’s grid position to screen coordinates (ignoring zoom).
  const { x, y } = gridToScreen(
    preview.position,
    tileSize.width,
    tileSize.height,
    cameraOffset.x,
    cameraOffset.y
  );

  // Apply zoom to the computed screen coordinates and dimensions
  const scaledX = x * cameraZoom;
  const scaledY = y * cameraZoom;
  const scaledW = tileSize.width * cameraZoom;
  const scaledH = tileSize.height * cameraZoom;

  return (
    <img
      src={preview.tile.image}
      alt="tile preview"
      style={{
        position: 'absolute',
        left: scaledX,
        top: scaledY,
        opacity: 0.6,
        width: scaledW,
        height: scaledH,
        pointerEvents: 'none',
      }}
    />
  );
};
