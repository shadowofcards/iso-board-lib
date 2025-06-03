// IsoBoardCanvas.stories.tsx

import Phaser from 'phaser';
// Ensure every Scene instance has an EventEmitter so `scene.events.on(...)` won’t be undefined
;(Phaser.Scene.prototype as any).events = new Phaser.Events.EventEmitter();

import type { Meta, StoryObj } from '@storybook/react';
import IsoBoardCanvas from './IsoBoardCanvas';

const meta: Meta<typeof IsoBoardCanvas> = {
  title: 'Components/IsoBoardCanvas',
  component: IsoBoardCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'IsoBoardCanvas is a composite React component that initializes a Phaser game with an isometric scene, ' +
          'renders a draggable tile inventory, shows a ghost preview during drag, and wires up camera controls. ' +
          'Use the controls below to adjust the board dimensions (in tiles) and see how the isometric board resizes.',
      },
    },
  },
  argTypes: {
    boardWidth: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Number of tiles horizontally on the board.',
    },
    boardHeight: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Number of tiles vertically on the board.',
    },
  },
};
export default meta;

type Story = StoryObj<typeof IsoBoardCanvas>;

export const Default: Story = {
  args: {
    boardWidth: 10,
    boardHeight: 10,
  },
  render: ({ boardWidth, boardHeight }) => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <IsoBoardCanvas boardWidth={boardWidth} boardHeight={boardHeight} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'In this story, IsoBoardCanvas renders a Phaser game area for an isometric board of the specified dimensions. ' +
          'Use your mouse or touch to drag tiles from the inventory onto the board, and scroll or pinch to zoom/pan the camera. ' +
          'Try changing the `boardWidth` and `boardHeight` controls to see different grid sizes.',
      },
    },
  },
};
