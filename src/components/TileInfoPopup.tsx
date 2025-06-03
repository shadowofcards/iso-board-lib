import React from 'react';
import type { TileData } from '../core/models/Tile';

interface TileInfoPopupProps {
  tile: TileData | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

/**
 * Popup que exibe informações detalhadas de um tile quando clicado com botão direito.
 * Aparece próximo ao cursor e pode ser fechado clicando fora ou pressionando ESC.
 */
export const TileInfoPopup: React.FC<TileInfoPopupProps> = ({
  tile,
  position,
  onClose,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Fecha o popup se clicar fora dele
      const target = e.target as HTMLElement;
      if (!target.closest('.tile-info-popup')) {
        onClose();
      }
    };

    if (tile && position) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tile, position, onClose]);

  if (!tile || !position) {
    return null;
  }

  const hexColor = tile.color.toString(16).padStart(6, '0');

  return (
    <div
      className="tile-info-popup"
      style={{
        position: 'fixed',
        left: position.x + 10,
        top: position.y + 10,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        minWidth: '250px',
        maxWidth: '400px',
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Cabeçalho com cor do tile */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: `#${hexColor}`,
            borderRadius: '4px',
            marginRight: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        />
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            {tile.metadata?.label || tile.type}
          </h3>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
            ID: {tile.id}
          </p>
        </div>
      </div>

      {/* Descrição */}
      {tile.metadata?.description && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
            {tile.metadata.description}
          </p>
        </div>
      )}

      {/* Propriedades */}
      {tile.metadata?.properties && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', opacity: 0.8 }}>
            Propriedades:
          </h4>
          <div style={{ fontSize: '13px' }}>
            {Object.entries(tile.metadata.properties).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
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
          </div>
        </div>
      )}

      {/* Informações técnicas */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ fontSize: '12px', opacity: 0.6 }}>
          <div>Tipo: {tile.type}</div>
          <div>Cor: #{hexColor}</div>
        </div>
      </div>

      {/* Instrução para fechar */}
      <div style={{ 
        marginTop: '8px',
        fontSize: '11px',
        opacity: 0.5,
        textAlign: 'center'
      }}>
        Pressione ESC ou clique fora para fechar
      </div>
    </div>
  );
};

export default TileInfoPopup; 