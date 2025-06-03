import type { Meta, StoryObj } from '@storybook/react';
import { IsoBoardCanvas } from './IsoBoardCanvas';
import type { TileData } from '../core/models/Tile';

const sampleTile: TileData = {
  id: 'sample-1',
  type: 'grass',
  image: '', // no image needed; drawing a solid color in renderTile
  position: { row: 1, col: 1 },
  size: { width: 64, height: 64 },
};

const meta: Meta<typeof IsoBoardCanvas> = {
  title: 'Components/IsoBoardCanvas',
  component: IsoBoardCanvas,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IsoBoardCanvas>;

export const SingleTile: Story = {
  args: {
    tiles: [sampleTile],
    tileSize: { width: 64, height: 64 },
    cameraOffset: { x: 0, y: 0 },
    cameraZoom: 1,
    backgroundColor: '#222222',
    renderTile: (ctx, tile, x, y, _zoom) => {
      // Draw a simple green square instead of an image
      ctx.fillStyle = '#00cc00';
      ctx.fillRect(x, y, tile.size.width, tile.size.height);
    },
  },
};
