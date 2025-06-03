import React from 'react';
import type { TileData } from '../core/models/Tile';

/**
 * Camada invisível que cobre todo o canvas e intercepta eventos de toque/clique
 * sobre tiles específicos. Suporta clique esquerdo para drag e clique direito
 * para carregar informações do tile.
 */
interface TileInteractionLayerProps {
  onPointerDown: (tile: TileData) => void;
  onRightClick?: (tile: TileData, event: React.MouseEvent) => void;
  onTileInfo?: (tile: TileData, position: { x: number; y: number }) => void;
}

export const TileInteractionLayer: React.FC<TileInteractionLayerProps> = ({
  onPointerDown,
  onRightClick,
  onTileInfo,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    // Previne o menu contextual padrão do navegador
    e.preventDefault();
    e.stopPropagation();
    
    // Simula um tile para demonstração - em cenários reais, você detectaria
    // qual tile foi clicado baseado na coordenada do mouse
    const dummyTile: TileData = {
      id: 'clicked-tile',
      type: 'info-tile',
      color: 0x4a90e2,
      metadata: {
        label: 'Tile Clicado',
        description: 'Informações detalhadas do tile',
        properties: {
          durabilidade: 100,
          tipo: 'Estrutural',
          custo: 50
        }
      }
    };

    if (onRightClick) {
      onRightClick(dummyTile, e);
    }

    if (onTileInfo) {
      onTileInfo(dummyTile, { x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Apenas processa clique esquerdo para drag
    if (e.button === 0) {
      onPointerDown({
        id: 'dummy',
        type: 'dummy',
        color: 0xffffff,
      });
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        background: 'transparent',
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    />
  );
};

export default TileInteractionLayer;
