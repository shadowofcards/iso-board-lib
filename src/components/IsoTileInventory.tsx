import React from 'react';
import type { TileData } from '../core/models/Tile';
import { TILE_SIZE, TILE_HEIGHT } from '../core/constants';

interface IsoTileInventoryProps {
  tiles: TileData[];
  onDragStart: (tile: TileData, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

/**
 * Renderiza uma lista simples de “tiles” clicáveis/arrastáveis.
 * Cada tile é um quadrado colorido que, ao clicar+arrastar, invoca onDragStart.
 */
export const IsoTileInventory: React.FC<IsoTileInventoryProps> = ({
  tiles,
  onDragStart,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 20,
      }}
    >
      {tiles.map((tile) => (
        <div
          key={tile.id}
          style={{
            width: TILE_SIZE / 2,
            height: TILE_HEIGHT / 2,
            backgroundColor: `#${tile.color.toString(16).padStart(6, '0')}`,
            border: '2px solid #000',
            borderRadius: 4,
            cursor: 'grab',
          }}
          onMouseDown={(e) => onDragStart(tile, e)}
        />
      ))}
    </div>
  );
};

export default IsoTileInventory;
