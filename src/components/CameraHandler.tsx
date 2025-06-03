import { useEffect, useRef } from 'react';
import type { CameraState } from '../core/models/Camera';

interface Props {
  camera: CameraState;
  onMove: (dx: number, dy: number) => void;
  onZoom: (factor: number, centerX: number, centerY: number) => void;
}

export function CameraHandler({ camera, onMove, onZoom }: Props) {
  const ref = useRef<{
    lastX: number | null;
    lastY: number | null;
  }>({ lastX: null, lastY: null });

  useEffect(() => {
    // Comportamento de roda do mouse e teclas de seta
    const handleWheel = (e: WheelEvent) => {
      // Calcula ponto central de zoom (na coordenada do elemento que disparou o evento)
      const rect = (e.target as HTMLElement).getBoundingClientRect();
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
  }, [onMove, onZoom]);

  useEffect(() => {
    // Seleciona o canvas na página
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Handler para movimento de pointer (arrastar a câmera)
    const handlePointerMove = (e: PointerEvent) => {
      if (ref.current.lastX !== null && ref.current.lastY !== null) {
        const dx = (e.clientX - ref.current.lastX) / camera.zoom;
        const dy = (e.clientY - ref.current.lastY) / camera.zoom;
        onMove(-dx, -dy);
        ref.current.lastX = e.clientX;
        ref.current.lastY = e.clientY;
      }
    };

    // Handler para término do pointerdown (soltou o botão)
    const handlePointerUp = () => {
      ref.current.lastX = null;
      ref.current.lastY = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    // Handler para início do arraste (pointerdown)
    const handlePointerDown = (e: PointerEvent) => {
      // Só considera botão esquerdo (0)
      if (e.button !== 0) return;
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
  }, [camera.zoom, onMove]);

  return null;
}
