import React, { useEffect } from 'react';
import { Camera as CameraModel } from '../core/models/Camera';

interface CameraHandlerProps {
  cameraModel: CameraModel;
  containerRef: React.RefObject<HTMLDivElement>;
  isDragActive?: boolean;
  onCameraMove?: () => void;
}

/**
 *  ‼️  Mudanças relevantes
 *  ----------------------
 *  •   Panning agora divide dx / dy pelo zoom actual ⇒ movimento de mundo
 *      corresponde exactamente ao deslocamento no ecrã.
 *  •   Pinch-zoom continua inalterado.
 *  •   🔧 NOVO: Callback onCameraMove para notificar mudanças de câmera
 */
export const CameraHandler: React.FC<CameraHandlerProps> = ({
  cameraModel,
  containerRef,
  isDragActive = false,
  onCameraMove,
}) => {
  // 🔧 CORREÇÃO DO BUG: Throttling para onCameraMove para evitar chamadas excessivas
  const lastCameraMoveRef = React.useRef<number>(0);
  const cameraMoveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastCameraPositionRef = React.useRef<{ x: number; y: number; zoom: number } | null>(null);

  const throttledCameraMove = React.useCallback(() => {
    const now = Date.now();
    const currentPos = cameraModel.getPosition();
    const currentZoom = cameraModel.getZoom();
    
    // Verificar se realmente houve movimento significativo
    if (lastCameraPositionRef.current) {
      const deltaX = Math.abs(currentPos.x - lastCameraPositionRef.current.x);
      const deltaY = Math.abs(currentPos.y - lastCameraPositionRef.current.y);
      const deltaZoom = Math.abs(currentZoom - lastCameraPositionRef.current.zoom);
      
      // 🔧 CORREÇÃO: Threshold de zoom ajustado de 0.1 para 0.05 para melhor responsividade
      // - Movimento > 10px OU zoom mudou > 0.05
      if (deltaX < 10 && deltaY < 10 && deltaZoom < 0.05) {
        lastCameraPositionRef.current = { x: currentPos.x, y: currentPos.y, zoom: currentZoom };
        return; // Não é movimento significativo
      }
    }
    
    // Atualizar posição de referência
    lastCameraPositionRef.current = { x: currentPos.x, y: currentPos.y, zoom: currentZoom };
    
    // 🔧 CORREÇÃO: Throttling reduzido de 200ms para 100ms para melhor responsividade
    if (now - lastCameraMoveRef.current < 100) {
      // Se já há um timeout pendente, cancelar
      if (cameraMoveTimeoutRef.current) {
        clearTimeout(cameraMoveTimeoutRef.current);
      }
      
      // Agendar chamada para depois do throttling
      cameraMoveTimeoutRef.current = setTimeout(() => {
        lastCameraMoveRef.current = Date.now();
        onCameraMove?.();
      }, 100);
      return;
    }
    
    lastCameraMoveRef.current = now;
    onCameraMove?.();
  }, [onCameraMove, cameraModel]);

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
      throttledCameraMove();
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
      throttledCameraMove();
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
        throttledCameraMove();
      } else if (e.touches.length === 1 && isPanning && !isDragActive) {
        const dx = (lastX - e.touches[0].clientX) / cameraModel.getZoom();
        const dy = (lastY - e.touches[0].clientY) / cameraModel.getZoom();
        cameraModel.pan(dx, dy);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        throttledCameraMove();
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
  }, [cameraModel, isDragActive, containerRef, throttledCameraMove]);

  return null;
};

export default CameraHandler;
