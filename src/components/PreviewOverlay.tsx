import React from 'react';
import { gridToScreen } from '../core/math/isoCoordinate';
import type { TileData, TilePosition } from '../core/models/Tile';

interface Props {
  preview: { tile: TileData; position: TilePosition } | null;
  tileSize: { width: number; height: number };
  cameraOffset: { x: number; y: number };
  cameraZoom: number;
}

export const PreviewOverlay: React.FC<Props> = ({
  preview,
  tileSize,
  cameraOffset,
  cameraZoom,
}) => {
  if (!preview) return null;

  const { x, y } = gridToScreen(
    preview.position,
    tileSize.width,
    tileSize.height,
    cameraOffset.x,
    cameraOffset.y
  );

  const scaledX = x * cameraZoom;
  const scaledY = y * cameraZoom;
  const scaledW = tileSize.width * cameraZoom;
  const scaledH = tileSize.height * cameraZoom;

  return (
    <img
      src={preview.tile.image}
      alt="preview"
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
