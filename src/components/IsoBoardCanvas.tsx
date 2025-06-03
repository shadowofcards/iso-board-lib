import React, { useEffect, useRef, forwardRef } from 'react';
import type { Ref } from 'react';
import { gridToScreen } from '../core/math/isoCoordinate';
import type { TileData } from '../core/models/Tile';

export interface IsoBoardCanvasProps {
  /** Array of all tiles to render */
  tiles: TileData[];
  /** Tile dimensions in pixels */
  tileSize: { width: number; height: number };
  /** Camera offset in world coordinates (grid units) */
  cameraOffset?: { x: number; y: number };
  /** Camera zoom factor */
  cameraZoom?: number;
  /**
   * Callback to draw a single tile.
   * @param ctx - Canvas 2D rendering context
   * @param tile - Tile to draw
   * @param screenX - X coordinate on the canvas (world → screen)
   * @param screenY - Y coordinate on the canvas
   * @param zoom - Current zoom factor
   */
  renderTile: (
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    screenX: number,
    screenY: number,
    zoom: number
  ) => void;
  /** Background color of the canvas */
  backgroundColor?: string;
}

/**
 * IsoBoardCanvas renders an isometric board on a <canvas> element.
 *
 * - It exposes its <canvas> element via forwardRef, so that parent components
 *   (e.g. CameraHandler) can attach event listeners directly to it.
 * - All pan and zoom transformations are applied via the canvas context transform.
 */
export const IsoBoardCanvas = forwardRef(function IsoBoardCanvas(
  {
    tiles,
    tileSize,
    cameraOffset = { x: 0, y: 0 },
    cameraZoom = 1,
    renderTile,
    backgroundColor = '#1a1a1a',
  }: IsoBoardCanvasProps,
  ref: Ref<HTMLCanvasElement>
) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);

  // Link the external ref to our internal canvas ref
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(internalRef.current);
    } else if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<HTMLCanvasElement | null>).current =
        internalRef.current;
    }
  }, [ref]);

  // Redraw on any dependency change
  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size to fill the window, then draw
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    // Draw all tiles with the current pan/zoom
    const draw = () => {
      // 1) Clear entire canvas without zoom transform
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2) Apply pan and zoom via context transform
      ctx.setTransform(
        cameraZoom,
        0,
        0,
        cameraZoom,
        -cameraOffset.x * cameraZoom,
        -cameraOffset.y * cameraZoom
      );

      // 3) Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        0,
        0,
        canvas.width / cameraZoom,
        canvas.height / cameraZoom
      );

      // 4) Render each tile at its computed screen position
      for (const tile of tiles) {
        const { x, y } = gridToScreen(
          tile.position,
          tileSize.width,
          tileSize.height,
          cameraOffset.x,
          cameraOffset.y
        );
        renderTile(ctx, tile, x, y, cameraZoom);
      }
    };

    // Initial draw and size setup
    updateSize();
  }, [tiles, tileSize, cameraOffset, cameraZoom, renderTile, backgroundColor]);

  // Handle window resize to adjust canvas dimensions
  useEffect(() => {
    const handleResize = () => {
      const canvas = internalRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={internalRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});
