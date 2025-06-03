import React from 'react';
import type { TileData } from '../core/models/Tile';

/**
 * Camada invisível que cobre todo o canvas e intercepta eventos de toque/clique
 * sobre tiles específicos. Para simplificar, esta camada chama onPointerDown
 * com um tile "dummy" sempre que o usuário clica. Em cenários reais, você capturaria
 * a coordenada de clique e converteria para (tileX, tileY) para recuperar TileData.
 */
interface TileInteractionLayerProps {
  onPointerDown: (tile: TileData) => void;
}

export const TileInteractionLayer: React.FC<TileInteractionLayerProps> = ({
  onPointerDown,
}) => {
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
      onMouseDown={() => {
        onPointerDown({
          id: 'dummy',
          type: 'dummy',
          color: 0xffffff,
        });
      }}
    />
  );
};

export default TileInteractionLayer;
