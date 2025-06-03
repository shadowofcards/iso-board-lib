import { useState } from 'react';
import type { TileData, TilePosition } from '../core/models/Tile';

export function useDragTile() {
  const [dragging, setDragging] = useState<{
    tile: TileData;
    position: TilePosition;
  } | null>(null);

  const startDrag = (tile: TileData) => {
    setDragging({ tile, position: tile.position });
  };

  const updatePosition = (position: TilePosition) => {
    if (dragging) {
      setDragging({ ...dragging, position });
    }
  };

  const endDrag = () => {
    const result = dragging;
    setDragging(null);
    return result;
  };

  return { dragging, startDrag, updatePosition, endDrag };
}
