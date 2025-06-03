import { useEffect, useRef } from 'react';
import type { CameraState } from '../core/models/Camera';

interface Props {
  /** Agora aceitamos RefObject<HTMLCanvasElement | null> */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  camera: CameraState;
  onMove: (dx: number, dy: number) => void;
  onZoom: (factor: number, centerX: number, centerY: number) => void;
}

export function CameraHandler({
  canvasRef,
  camera,
  onMove,
  onZoom,
}: Props) {
  const ref = useRef<{
    lastX: number | null;
    lastY: number | null;
  }>({ lastX: null, lastY: null });

  // 1) Roda no mouse e setas do teclado
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Se não temos canvas ou o evento não veio do nosso canvas, ignoramos
      if (!canvasRef.current || !canvasRef.current.contains(e.target as Node)) {
        return;
      }
      // Ponto de zoom (relativo ao canvas)
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;
      onZoom(e.deltaY < 0 ? 1.1 : 0.9, centerX, centerY);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const delta = 20;
      if (e.key === 'ArrowUp') onMove(0, -delta);
      else if (e.key === 'ArrowDown') onMove(0, delta);
      else if (e.key === 'ArrowLeft') onMove(-delta, 0);
      else if (e.key === 'ArrowRight') onMove(delta, 0);
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasRef, onMove, onZoom]);

  // 2) Pointer para pan (arrastar a câmera)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: PointerEvent) => {
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
      if (e.button !== 0) return; // apenas botão esquerdo
      // Se o click não for dentro do nosso canvas, ignoramos
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
