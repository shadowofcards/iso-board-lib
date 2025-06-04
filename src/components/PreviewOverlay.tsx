import React from 'react';
import type { DragState } from '../core/engine/DragController';
import { TILE_SIZE, TILE_HEIGHT } from '../core/constants';

/**
 * Overlay que renderiza um "ghost tile" flutuante baseado no estado de drag.
 * Deve ser posicionado com coord. de tela fornecidas pelo DragController (através do hook).
 */
interface PreviewOverlayProps {
  dragState: DragState;
}

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({ dragState }) => {
  if (!dragState.isDragging || !dragState.tile || !dragState.ghostPos) {
    return null;
  }

  let { x, y } = dragState.ghostPos;
  
  // 🔧 CORREÇÃO: Ao invés de retornar null, usar valores padrão para NaN
  if (typeof x !== 'number' || isNaN(x)) {
    console.warn('[PreviewOverlay] x inválido:', x, '- usando 0');
    x = 0;
  }
  if (typeof y !== 'number' || isNaN(y)) {
    console.warn('[PreviewOverlay] y inválido:', y, '- usando 0');
    y = 0;
  }
  
  const hexColor = dragState.tile.color.toString(16).padStart(6, '0');
  const label = dragState.tile.metadata?.label || dragState.tile.type;

  return (
    <div
      style={{
        position: 'fixed',
        left: x - TILE_SIZE / 2,
        top: y - TILE_HEIGHT / 2 - 10, // Offset para não ficar exatamente sob o mouse
        pointerEvents: 'none',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Tile preview */}
      <div
        style={{
          width: TILE_SIZE * 0.8, // Ligeiramente menor para feedback visual
          height: TILE_HEIGHT * 0.8,
          backgroundColor: `#${hexColor}`,
          opacity: 0.8,
          border: '2px solid white',
          borderRadius: '4px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          clipPath: `polygon(
            50% 0%, 
            100% 50%, 
            50% 100%, 
            0% 50%
          )`,
          transform: 'rotate(3deg)',
        }}
      />
      
      {/* Label do tile */}
      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default PreviewOverlay;
