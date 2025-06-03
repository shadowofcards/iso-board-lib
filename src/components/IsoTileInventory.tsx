import React from 'react';
import type { TileData } from '../core/models/Tile';

interface Props {
  availableTiles: TileData[];
  onSelect: (tile: TileData) => void;
}

export const IsoTileInventory: React.FC<Props> = ({ availableTiles, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {availableTiles.map(tile => (
        <div
          key={tile.id}
          onClick={() => onSelect(tile)}
          style={{ margin: 4, cursor: 'pointer' }}
        >
          <img src={tile.image} width={64} height={64} alt={tile.type} />
        </div>
      ))}
    </div>
  );
};
