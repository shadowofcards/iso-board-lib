import React, { useEffect } from 'react';
import { Camera as CameraModel } from '../core/models/Camera';

interface CameraHandlerProps {
  cameraModel: CameraModel;
  containerRef: React.RefObject<HTMLDivElement>;
  isDragActive?: boolean;
}

/**
 *  ‼️  Mudanças relevantes
 *  ----------------------
 *  •   Panning agora divide dx / dy pelo zoom actual ⇒ movimento de mundo
 *      corresponde exactamente ao deslocamento no ecrã.
 *  •   Pinch-zoom continua inalterado.
 */
export const CameraHandler: React.FC<CameraHandlerProps> = ({
  cameraModel,
  containerRef,
  isDragActive = false,
}) => {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    /* -------- ZOOM (wheel) -------- */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraModel.zoomBy(-e.deltaY);
    };

    /* -------- MOUSE PAN -------- */
    const onMouseDown = (e: MouseEvent) => {
      if (isDragActive) return;
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning || isDragActive) return;
      const dx = (lastX - e.clientX) / cameraModel.getZoom();
      const dy = (lastY - e.clientY) / cameraModel.getZoom();
      cameraModel.pan(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseUp = () => (isPanning = false);

    /* -------- TOUCH PAN / PINCH -------- */
    let initialDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDist = Math.hypot(dx, dy);
      } else if (e.touches.length === 1 && !isDragActive) {
        isPanning = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        cameraModel.zoomBy(newDist - initialDist);
        initialDist = newDist;
      } else if (e.touches.length === 1 && isPanning && !isDragActive) {
        const dx = (lastX - e.touches[0].clientX) / cameraModel.getZoom();
        const dy = (lastY - e.touches[0].clientY) / cameraModel.getZoom();
        cameraModel.pan(dx, dy);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) initialDist = 0;
      if (e.touches.length === 0) isPanning = false;
    };

    /* -------- RESIZE -------- */
    const onResize = () => {
      if (el) {
        cameraModel.setViewport({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

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

  return null;
};

export default CameraHandler;
