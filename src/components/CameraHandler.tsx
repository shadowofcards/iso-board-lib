import React, { useEffect } from 'react';
import { Camera as CameraModel } from '../core/models/Camera';

/**
 * Props for the CameraHandler component.
 *
 * @property cameraModel  - An instance of CameraModel that manages the camera's position and zoom state.
 * @property containerRef - A React ref pointing to the HTML <div> that acts as the camera's interactive viewport.
 * @property isDragActive - Optional flag to disable camera movement when tiles are being dragged.
 */
interface CameraHandlerProps {
  cameraModel: CameraModel;
  containerRef: React.RefObject<HTMLDivElement>;
  isDragActive?: boolean; // Desabilita movimento da câmera quando true
}

/**
 * CameraHandler
 *
 * A React component that attaches mouse and touch event listeners to a specified container element,
 * translating wheel, drag, and pinch gestures into camera zoom and pan operations on the provided
 * CameraModel instance. This component does not render any visible DOM of its own; it exists purely
 * for side effects (attaching and cleaning up event listeners).
 *
 * Usage:
 * 1. Instantiate a CameraModel with initial position, zoom, viewport size, and world size.
 * 2. Render <CameraHandler cameraModel={...} containerRef={someRef} /> inside a component that
 *    provides a <div ref={someRef}>...</div> of the desired dimensions.
 * 3. CameraHandler will listen for:
 *    - Wheel events on the container to zoom the camera.
 *    - Mouse down/move/up on the container and window to pan the camera.
 *    - Touch start/move/end on the container for two-finger pinch-zoom and one-finger pan.
 *
 * @param cameraModel  The CameraModel instance to drive (must implement .pan(dx, dy) and .zoomBy(delta)).
 * @param containerRef A React ref to an HTML <div> that will receive pointer and wheel events.
 * @param isDragActive Optional flag to disable camera movement when tiles are being dragged.
 */
export const CameraHandler: React.FC<CameraHandlerProps> = ({
  cameraModel,
  containerRef,
  isDragActive = false,
}) => {
  useEffect(() => {
    // Retrieve the actual DOM element from the ref.
    const el = containerRef.current;
    // If ref is not yet attached or element is missing, do nothing.
    if (!el) return;

    // ------------------------------------------------------------
    // Internal state variables for tracking panning and last pointer
    // ------------------------------------------------------------
    let isPanning = false; // Whether the user is currently dragging to pan
    let lastX = 0;         // Last X-coordinate of pointer (mouse or touch)
    let lastY = 0;         // Last Y-coordinate of pointer (mouse or touch)

    // ------------------------------------------------------------
    // Wheel handler: zoom the camera based on wheel delta.
    // Prevents default scrolling behavior.
    // Allows zoom even during drag (zoom doesn't interfere with tile drag)
    // ------------------------------------------------------------
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Negative deltaY inverts typical scroll direction for zoom
      cameraModel.zoomBy(-e.deltaY);
    };

    // ------------------------------------------------------------
    // Mouse down handler: begin panning. Record initial pointer position.
    // DISABLED when isDragActive is true to prevent interference with tile drag.
    // ------------------------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
      // Não inicia panning se há drag ativo
      if (isDragActive) return;
      
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    // ------------------------------------------------------------
    // Mouse move handler: if panning, compute delta and pan camera.
    // DISABLED when isDragActive is true.
    // ------------------------------------------------------------
    const onMouseMove = (e: MouseEvent) => {
      // Não faz panning se há drag ativo
      if (!isPanning || isDragActive) return;
      
      // Compute how far pointer moved since last frame
      const dx = lastX - e.clientX;
      const dy = lastY - e.clientY;
      cameraModel.pan(dx, dy);
      // Update last-known coordinates
      lastX = e.clientX;
      lastY = e.clientY;
    };

    // ------------------------------------------------------------
    // Mouse up handler: end panning mode.
    // ------------------------------------------------------------
    const onMouseUp = () => {
      isPanning = false;
    };

    // ------------------------------------------------------------
    // Resize handler: update cameraModel's viewport to match element's new size.
    // Necessary so camera's clamping logic uses the correct dimensions.
    // ------------------------------------------------------------
    const onResize = () => {
      if (el) {
        cameraModel.setViewport({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }
    };

    // ------------------------------------------------------------
    // Register mouse-based event listeners:
    // - wheel on the container element
    // - mousedown on the container element
    // - mousemove on the window (so panning continues even if pointer leaves container)
    // - mouseup on the window
    // - resize on the window
    // ------------------------------------------------------------
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);

    // ------------------------------------------------------------
    // Variables for tracking pinch-zoom gesture (two-finger on touch).
    // ------------------------------------------------------------
    let initialDist = 0;

    // ------------------------------------------------------------
    // Touch start handler:
    // - If two fingers detected: compute initial distance for pinch zoom.
    // - If one finger: begin panning (similar to onMouseDown).
    // DISABLED when isDragActive is true to prevent interference with tile drag.
    // ------------------------------------------------------------
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Two-finger pinch: calculate initial distance (allowed even during drag)
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDist = Math.hypot(dx, dy);
      } else if (e.touches.length === 1 && !isDragActive) {
        // Single-finger: begin panning (disabled during drag)
        isPanning = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    // ------------------------------------------------------------
    // Touch move handler:
    // - If two fingers and existing initialDist: compute new distance, derive zoom delta, call zoomBy.
    // - If single finger and in panning mode: compute pan delta, call pan.
    // DISABLED when isDragActive is true for single-finger panning.
    // ------------------------------------------------------------
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        // Pinch zoom logic (allowed even during drag)
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const deltaDist = newDist - initialDist;
        cameraModel.zoomBy(deltaDist);
      } else if (e.touches.length === 1 && isPanning && !isDragActive) {
        // Single-finger pan logic (disabled during drag)
        const dx = lastX - e.touches[0].clientX;
        const dy = lastY - e.touches[0].clientY;
        cameraModel.pan(dx, dy);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    // ------------------------------------------------------------
    // Touch end handler:
    // - If fewer than two fingers remain, reset initialDist.
    // - If no fingers remain, end panning.
    // ------------------------------------------------------------
    const onTouchEnd = (_e: TouchEvent) => {
      if (_e.touches.length < 2) {
        initialDist = 0;
      }
      if (_e.touches.length === 0) {
        isPanning = false;
      }
    };

    // ------------------------------------------------------------
    // Register touch-based event listeners on the container element:
    // - touchstart, touchmove, touchend
    // ------------------------------------------------------------
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    // ------------------------------------------------------------
    // Cleanup function: remove all event listeners when component unmounts
    // or when dependencies (cameraModel or containerRef) change.
    // ------------------------------------------------------------
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [cameraModel, containerRef, isDragActive]);

  // This component does not render any visible JSX;
  // it exists solely to manage side effects (event listeners).
  return null;
};

export default CameraHandler;
