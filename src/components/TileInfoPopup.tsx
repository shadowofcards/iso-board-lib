import React from 'react';
import type { TileData } from '../core/models/Tile';
import { __DEV__ } from '../core/config';

interface TileInfoPopupProps {
  tile: TileData | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  isHover?: boolean; // Nova prop para indicar se é hover ou clique
}

/**
 * Popup que exibe informações detalhadas de um tile quando clicado com botão direito ou em hover.
 * Aparece próximo ao cursor e pode ser fechado clicando fora ou pressionando ESC.
 */
export const TileInfoPopup: React.FC<TileInfoPopupProps> = ({
  tile,
  position,
  onClose,
  isHover = false,
}) => {
  // 🔧 CORREÇÃO DO BUG: Ref para rastrear posição anterior e timestamp de criação
  const previousPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const creationTimeRef = React.useRef<number>(Date.now());
  const previousTileRef = React.useRef<TileData | null>(null); // 🔧 NOVA REF: Para detectar mudança de tile

  // 🔧 CORREÇÃO DO BUG DO HOVER: Detectar mudança de tile e resetar posição
  React.useEffect(() => {
    if (tile && previousTileRef.current) {
      // Se o tile mudou, resetar posição anterior para evitar fechamento indevido
      if (tile.id !== previousTileRef.current.id) {
        if (__DEV__) {
          console.debug(`[TileInfoPopup] Tile mudou: ${previousTileRef.current.id} -> ${tile.id}, resetando posição`);
        }
        previousPositionRef.current = null;
        creationTimeRef.current = Date.now();
      }
    }
    
    if (tile) {
      previousTileRef.current = tile;
    }
  }, [tile]);

  // 🔧 CORREÇÃO DO BUG: Fechar popup se posição mudou significativamente (board movement)
  // Mas só depois de um tempo mínimo para não fechar imediatamente
  React.useEffect(() => {
    // Resetar timestamp quando o popup é criado/atualizado
    if (tile && position) {
      if (!previousPositionRef.current) {
        creationTimeRef.current = Date.now();
        previousPositionRef.current = { ...position };
        return;
      }

      // Só verificar movimento depois de 500ms da criação do popup
      const timeSinceCreation = Date.now() - creationTimeRef.current;
      if (timeSinceCreation < 500) {
        previousPositionRef.current = { ...position };
        return;
      }

      const deltaX = Math.abs(position.x - previousPositionRef.current.x);
      const deltaY = Math.abs(position.y - previousPositionRef.current.y);
      
      // 🔧 CORREÇÃO: Para hover, usar threshold ainda maior para evitar fechamentos acidentais
      const threshold = isHover ? 150 : 100;
      if (deltaX > threshold || deltaY > threshold) {
        if (__DEV__) {
          console.debug(`[TileInfoPopup] Posição mudou muito: delta(${deltaX}, ${deltaY}) > ${threshold}, fechando popup`);
        }
        onClose();
        return;
      }
      
      previousPositionRef.current = { ...position };
    }
  }, [tile, position, onClose, isHover]);

  // 🔧 CORREÇÃO: Reset refs quando popup é fechado
  React.useEffect(() => {
    if (!tile || !position) {
      previousPositionRef.current = null;
      previousTileRef.current = null;
      creationTimeRef.current = Date.now();
    }
  }, [tile, position]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isHover) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Fecha o popup se clicar fora dele (apenas para popup não-hover)
      if (!isHover) {
        const target = e.target as HTMLElement;
        if (!target.closest('.tile-info-popup')) {
          onClose();
        }
      }
    };

    if (tile && position && !isHover) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tile, position, onClose, isHover]);

  if (!tile || !position) {
    return null;
  }

  const hexColor = tile.color.toString(16).padStart(6, '0');

  // Estilos diferentes para hover vs popup normal
  const popupStyle = {
    position: 'fixed' as const,
    left: position.x + 10,
    top: position.y + 10,
    backgroundColor: isHover ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: isHover ? '8px 12px' : '16px',
    borderRadius: isHover ? '6px' : '8px',
    minWidth: isHover ? '200px' : '250px',
    maxWidth: isHover ? '300px' : '400px',
    zIndex: isHover ? 5000 : 10000,
    boxShadow: isHover ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: isHover ? '12px' : '14px',
    pointerEvents: isHover ? 'none' as const : 'auto' as const,
  };

  return (
    <div
      className="tile-info-popup"
      style={popupStyle}
    >
      {/* Cabeçalho com cor do tile */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: isHover ? '8px' : '12px' }}>
        <div
          style={{
            width: isHover ? '16px' : '24px',
            height: isHover ? '16px' : '24px',
            backgroundColor: `#${hexColor}`,
            borderRadius: '4px',
            marginRight: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        />
        <div>
          <h3 style={{ margin: 0, fontSize: isHover ? '13px' : '16px', fontWeight: 'bold' }}>
            {tile.metadata?.label || tile.type}
          </h3>
          <p style={{ margin: 0, fontSize: isHover ? '10px' : '12px', opacity: 0.7 }}>
            ID: {tile.id}
          </p>
        </div>
      </div>

      {/* Descrição - apenas no popup completo */}
      {!isHover && tile.metadata?.description && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
            {tile.metadata.description}
          </p>
        </div>
      )}

      {/* Propriedades */}
      {tile.metadata?.properties && (
        <div>
          <h4 style={{ margin: `0 0 ${isHover ? '4px' : '8px'} 0`, fontSize: isHover ? '11px' : '14px', fontWeight: 'bold', opacity: 0.8 }}>
            Propriedades:
          </h4>
          <div style={{ fontSize: isHover ? '10px' : '13px' }}>
            {Object.entries(tile.metadata.properties).slice(0, isHover ? 3 : 10).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: isHover ? '2px' : '4px',
                  padding: '2px 0',
                }}
              >
                <span style={{ opacity: 0.8, textTransform: 'capitalize' }}>
                  {key}:
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  {String(value)}
                </span>
              </div>
            ))}
            {isHover && tile.metadata.properties && Object.keys(tile.metadata.properties).length > 3 && (
              <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
                ... e mais {Object.keys(tile.metadata.properties).length - 3} propriedades
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informações técnicas - apenas no popup completo */}
      {!isHover && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            <div>Tipo: {tile.type}</div>
            <div>Cor: #{hexColor}</div>
          </div>
        </div>
      )}

      {/* Instrução para fechar - apenas no popup completo */}
      {!isHover && (
        <div style={{ 
          marginTop: '8px',
          fontSize: '11px',
          opacity: 0.5,
          textAlign: 'center'
        }}>
          Pressione ESC ou clique fora para fechar
        </div>
      )}
    </div>
  );
};

export default TileInfoPopup; 