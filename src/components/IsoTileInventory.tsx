import React from 'react';
import type { TileData } from '../core/models/Tile';

interface Props {
  /**
   * Array of tile definitions available for placement.
   * Each TileData includes id, type, image URL, etc.
   */
  availableTiles: TileData[];
  /**
   * Callback invoked when the user selects (clicks) a tile from the inventory.
   * @param tile - The TileData object that was clicked
   */
  onSelect: (tile: TileData) => void;
}

/**
 * IsoTileInventory
 *
 * Displays a simple grid of available tiles (as 64×64 images).
 * When a tile is clicked, calls onSelect(tile) so the parent can
 * handle adding that tile to the board.
 */
export const IsoTileInventory: React.FC<Props> = ({ availableTiles, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {availableTiles.map((tile) => (
        <div
          key={tile.id}
          onClick={() => onSelect(tile)}
          style={{
            margin: 4,
            cursor: 'pointer',
            /* 
              A fixed size is used here so the inventory stays consistent.
              Parent components may choose to override via CSS if desired.
            */
          }}
        >
          <img
            src={tile.image}
            width={64}
            height={64}
            alt={tile.type}
            /* 
              alt text uses the tile.type, as it conveys the tile’s identity.
            */
          />
        </div>
      ))}
    </div>
  );
};
