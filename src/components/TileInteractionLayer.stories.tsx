import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TileInteractionLayer } from './TileInteractionLayer';
import type { TileData } from '../core/models/Tile';

const sampleTiles: TileData[] = [
  {
    id: 't1',
    type: 'tile1',
    image: 'https://placehold.co/64x64/00FF00/FFFFFF?text=1',
    position: { row: 0, col: 0 },
    size: { width: 64, height: 64 },
  },
  {
    id: 't2',
    type: 'tile2',
    image: 'https://placehold.co/64x64/0000FF/FFFFFF?text=2',
    position: { row: 1, col: 1 },
    size: { width: 64, height: 64 },
  },
];

const meta: Meta<typeof TileInteractionLayer> = {
  title: 'Components/TileInteractionLayer',
  component: TileInteractionLayer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TileInteractionLayer>;

export const Default: Story = {
  args: {
    tiles: sampleTiles,
    tileSize: { width: 64, height: 64 },
    cameraOffset: { x: 0, y: 0 },
    cameraZoom: 1,
    onClick: (tile) => console.log('TileInteractionLayer onClick:', tile.id),
    onDragStart: (tile) => console.log('TileInteractionLayer onDragStart:', tile.id),
    onDrag: (tile, pos) => console.log('TileInteractionLayer onDrag:', tile.id, pos),
    onDragEnd: (tile, pos) =>
      console.log('TileInteractionLayer onDragEnd:', tile.id, pos),
  },
};
