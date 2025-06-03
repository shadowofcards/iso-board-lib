import React, { useRef } from 'react';
import { gridToScreen } from '../core/math/isoCoordinate';
import type { TileData } from '../core/models/Tile';

interface Props {
  tiles: TileData[];
  tileSize: { width: number; height: number };
  cameraOffset: { x: number; y: number };
  cameraZoom: number;
  onClick: (tile: TileData) => void;
  onDragStart: (tile: TileData) => void;
  onDrag: (tile: TileData, position: { x: number; y: number }) => void;
  onDragEnd: (tile: TileData, position: { x: number; y: number }) => void;
}

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
  const draggingRef = useRef<{ tile: TileData; pointerId: number } | null>(null);

  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    if (e.pointerId !== draggingRef.current.pointerId) return;
    const rawX = e.clientX;
    const rawY = e.clientY;
    onDrag(draggingRef.current.tile, { x: rawX, y: rawY });
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    if (e.pointerId !== draggingRef.current.pointerId) return;
    const rawX = e.clientX;
    const rawY = e.clientY;
    onDragEnd(draggingRef.current.tile, { x: rawX, y: rawY });
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    draggingRef.current = null;
  };

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
      {tiles.map(tile => {
        const { x, y } = gridToScreen(
          tile.position,
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
          <div
            key={tile.id}
            onPointerDown={createPointerDown(tile)}
            onClick={e => {
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
              touchAction: 'none',
            }}
          />
        );
      })}
    </>
  );
};
