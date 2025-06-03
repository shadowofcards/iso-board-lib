import type { Meta, StoryObj } from '@storybook/react';
import { IsoTileInventory } from './IsoTileInventory';
import type { TileData } from '../core/models/Tile';

const meta: Meta<typeof IsoTileInventory> = {
  title: 'Components/IsoTileInventory',
  component: IsoTileInventory,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IsoTileInventory>;

export const Default: Story = {
  args: {
    availableTiles: [
      {
        id: 'tile-1',
        type: 'grass',
        image: 'https://placehold.co/64x64/00FF00/FFFFFF?text=G',
        position: { row: 0, col: 0 },
        size: { width: 64, height: 64 },
      },
      {
        id: 'tile-2',
        type: 'water',
        image: 'https://placehold.co/64x64/0000FF/FFFFFF?text=W',
        position: { row: 1, col: 0 },
        size: { width: 64, height: 64 },
      },
      {
        id: 'tile-3',
        type: 'sand',
        image: 'https://placehold.co/64x64/FFD700/000000?text=S',
        position: { row: 2, col: 0 },
        size: { width: 64, height: 64 },
      },
    ] as TileData[],
    onSelect: (tile) => {
      console.log('IsoTileInventory onSelect:', tile);
    },
  },
};
