import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PreviewOverlay } from './PreviewOverlay';
import type { TileData, TilePosition } from '../core/models/Tile';

const sampleTile: TileData = {
  id: 'p1',
  type: 'preview',
  image: 'https://placehold.co/64x64/FFA500/000000?text=P',
  position: { row: 2, col: 2 },
  size: { width: 64, height: 64 },
};

const meta: Meta<typeof PreviewOverlay> = {
  title: 'Components/PreviewOverlay',
  component: PreviewOverlay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PreviewOverlay>;

export const WithPreview: Story = {
  args: {
    preview: { tile: sampleTile, position: { row: 2, col: 2 } },
    tileSize: { width: 64, height: 64 },
    cameraOffset: { x: 0, y: 0 },
    cameraZoom: 1,
  },
};
