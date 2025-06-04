import React from 'react';
import type { TileData } from '../core/models/Tile';

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