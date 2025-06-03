import { useEffect, useRef } from 'react';
import type { CameraState } from '../core/models/Camera';

interface Props {
  /**
   * A ref to the HTMLCanvasElement rendered by IsoBoardCanvas.
   * Used to attach mouse and touch event listeners specifically to this canvas.
   */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current camera state, containing offsetX, offsetY, and zoom. */
  camera: CameraState;
  /**
   * Callback invoked when the camera should pan.
   * @param dx - Change in X (in world units)
   * @param dy - Change in Y (in world units)
   */
  onMove: (dx: number, dy: number) => void;
  /**
   * Callback invoked when the camera should zoom.
   * @param factor - Zoom multiplier (e.g. 1.1 for 10% zoom in, 0.9 for 10% zoom out)
   * @param centerX - X coordinate (in canvas pixels) around which to center the zoom
   * @param centerY - Y coordinate (in canvas pixels) around which to center the zoom
   */
  onZoom: (factor: number, centerX: number, centerY: number) => void;
}

/**
 * CameraHandler attaches event listeners for:
 *   1. Mouse wheel and arrow keys to zoom and pan the camera.
 *   2. Pointer drag on the canvas to pan by dragging.
 *
 * It only responds if the events occur within the specified canvasRef.
 */
export function CameraHandler({
  canvasRef,
  camera,
  onMove,
  onZoom,
}: Props) {
  // Tracks the last pointer position during a drag, in window coordinates.
  const ref = useRef<{ lastX: number | null; lastY: number | null }>({
    lastX: null,
    lastY: null,
  });

  /**
   * Attach wheel and keyboard listeners:
   *   - Wheel events over the canvas produce a zoom action.
   *   - Arrow keys pan the camera by a fixed amount.
   */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.contains(e.target as Node)) {
        return;
      }
      // Compute the zoom center relative to the canvas
      const rect = canvas.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;
      // Zoom in if scrolling up (deltaY < 0), else zoom out
      onZoom(e.deltaY < 0 ? 1.1 : 0.9, centerX, centerY);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const delta = 20;
      switch (e.key) {
        case 'ArrowUp':
          onMove(0, -delta);
          break;
        case 'ArrowDown':
          onMove(0, delta);
          break;
        case 'ArrowLeft':
          onMove(-delta, 0);
          break;
        case 'ArrowRight':
          onMove(delta, 0);
          break;
      }
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasRef, onMove, onZoom]);

  /**
   * Attach pointer event listeners to the canvas for panning via drag:
   *   - pointerdown: start tracking the pointer position
   *   - pointermove: if tracking, compute delta and pan
   *   - pointerup: stop tracking
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Only pan if we have a valid last pointer position and not a touch event
      if (
        ref.current.lastX !== null &&
        ref.current.lastY !== null &&
        e.pointerType !== 'touch'
      ) {
        const dx = (e.clientX - ref.current.lastX) / camera.zoom;
        const dy = (e.clientY - ref.current.lastY) / camera.zoom;
        onMove(-dx, -dy);
        ref.current.lastX = e.clientX;
        ref.current.lastY = e.clientY;
      }
    };

    const handlePointerUp = () => {
      ref.current.lastX = null;
      ref.current.lastY = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only react to left-click (button 0)
      if (e.button !== 0) return;
      if (!canvas.contains(e.target as Node)) return;
      ref.current.lastX = e.clientX;
      ref.current.lastY = e.clientY;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [camera.zoom, canvasRef, onMove]);

  return null;
}
