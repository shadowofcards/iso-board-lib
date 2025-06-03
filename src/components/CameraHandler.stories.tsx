import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CameraHandler from './CameraHandler';
import { Camera } from '../core/models/Camera';

/**
 * Story metadata for CameraHandler.
 *
 * - title: The path under which this component appears in the Storybook sidebar.
 * - component: The actual React component being documented.
 * - parameters.layout: 'fullscreen' ensures the story occupies the entire Storybook viewport,
 *                     which is helpful for components that rely on container dimensions.
 */
const meta: Meta<typeof CameraHandler> = {
  title: 'Components/CameraHandler',
  component: CameraHandler,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

/**
 * Story type for CameraHandler, inferred from the component's props.
 * StoryObj<CameraHandler> allows us to specify custom rendering or args.
 */
type Story = StoryObj<typeof CameraHandler>;

/**
 * Default story: demonstrates CameraHandler in a simple container.
 *
 * - We create a <div> of fixed size (400×300px) to simulate a game viewport.
 * - A CameraModel instance is created with initial position (0,0), zoom=1,
 *   viewport size matching the <div>, and a larger board size (800×600) for panning.
 * - CameraHandler attaches event listeners (wheel, mouse drag, touch gestures)
 *   to that <div>, enabling interactive pan/zoom on the CameraModel.
 */
export const Default: Story = {
  render: () => {
    // ------------------------------------------------------------------------
    // Step 1: Create a ref to the <div> that will be the interactive viewport.
    // 
    // We use `useRef<HTMLDivElement>(null!)` because:
    // - We know this ref will be assigned to a DOM element after the first render.
    // - The `!` (non-null assertion) silences TypeScript's "possibly null" warning,
    //   since Storybook always renders the container before CameraHandler mounts.
    // ------------------------------------------------------------------------
    const containerRef = useRef<HTMLDivElement>(null!);

    // ------------------------------------------------------------------------
    // Step 2: Instantiate a CameraModel.
    //
    // Camera constructor parameters:
    //   initPos: { x: 0, y: 0 } → Starting camera position (world coordinates).
    //   initZoom: 1 → Starting zoom level (1×).
    //   viewport: { width: 400, height: 300 } → The size (in pixels) of the visible area.
    //   boardSize: { width: 800, height: 600 } → The total "world" size (in pixels),
    //       which defines the boundaries for panning and zooming clamping.
    //
    // In this example:
    //   - The "board" is twice as wide and twice as tall as the visible area,
    //     so the camera can pan within that 800×600 world.
    // ------------------------------------------------------------------------
    const cameraModel = new Camera(
      { x: 0, y: 0 },            // initial camera position
      1,                         // initial zoom (1×)
      { width: 400, height: 300 }, // viewport size in pixels
      { width: 800, height: 600 }  // total board/world size in pixels
    );

    // ------------------------------------------------------------------------
    // Step 3: Render the JSX structure:
    //
    //   <div ref={containerRef} style={...}>
    //     <p>Instructions for the user</p>
    //     <CameraHandler ... />
    //   </div>
    //
    // - The outer <div> must:
    //     • Have a ref attached (containerRef), so CameraHandler can register listeners.
    //     • Be positioned and sized in CSS, so events like "wheel" and "mousedown"
    //       fire only when the pointer is over that <div>.
    //   • We give it a visible border (1px solid #333) to see its boundaries in Storybook.
    //   • We set `overflow: hidden` so panning won't show scrollbars.
    //   • `position: relative` ensures any absolute children (like instructions text)
    //     are positioned correctly within that container.
    // ------------------------------------------------------------------------
    return (
      <div
        ref={containerRef}
        style={{
          border: '1px solid #333',
          width: '400px',
          height: '300px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/*
          Instructional text:
          - Positioned absolutely within the container to remain visible.
          - `zIndex: 10` ensures it sits above any other content.
          */}
        <p style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
          Scroll (wheel) to zoom; click-and-drag to pan.
        </p>

        {/*
          CameraHandler:
          - Receives the CameraModel instance and containerRef.
          - Attaches event listeners (wheel/mousedown/touch) to containerRef.current.
          - On interactions, updates cameraModel (pan/zoom).
          - Renders nothing itself (returns null), solely for side effects.
        */}
        <CameraHandler cameraModel={cameraModel} containerRef={containerRef} />
      </div>
    );
  },
};
