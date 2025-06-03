import type { Meta, StoryObj } from '@storybook/react';
import { IsoBoard } from './IsoBoard';
import type { TileData } from '../core/models/Tile';
import type { CameraState } from '../core/models/Camera';

const tileA: TileData = {
  id: 'a',
  type: 'grass',
  image: 'https://placehold.co/64x64/00FF00/FFFFFF?text=G',
  position: { row: 0, col: 0 },
  size: { width: 64, height: 64 },
};
const tileB: TileData = {
  id: 'b',
  type: 'water',
  image: 'https://placehold.co/64x64/0000FF/FFFFFF?text=W',
  position: { row: 1, col: 1 },
  size: { width: 64, height: 64 },
};

const meta: Meta<typeof IsoBoard> = {
  title: 'Components/IsoBoard',
  component: IsoBoard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IsoBoard>;

export const Default: Story = {
  args: {
    initialTiles: [tileA, tileB],
    availableTiles: [
      {
        id: 'c',
        type: 'sand',
        image: 'https://placehold.co/64x64/FFD700/000000?text=S',
        position: { row: 0, col: 0 },
        size: { width: 64, height: 64 },
      },
    ] as TileData[],
    boardSize: { rows: 5, cols: 5 },
    tileSize: { width: 64, height: 64 },
    onTileClick: (tile) => console.log('IsoBoard onTileClick:', tile),
    onTileDrop: (from, to, tile, fullBoard) =>
      console.log('IsoBoard onTileDrop:', { from, to, tile, fullBoard }),
    onTilePreDrop: (to, tile, neighbors) => {
      console.log('IsoBoard onTilePreDrop:', { to, tile, neighbors });
      return true;
    },
    onCameraChange: (camera: CameraState) =>
      console.log('IsoBoard onCameraChange:', camera),
  },
};
