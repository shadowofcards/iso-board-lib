import React from 'react';
import type { TileData } from '../core/models/Tile';

interface RealtimeTileDisplayProps {
  visibleTiles: Array<{ x: number; y: number; tile: TileData }>;
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Componente que exibe informações em tempo real de todos os tiles visíveis no momento.
 * Pode ser expandido/recolhido e mostra estatísticas e lista dos tiles.
 */
export const RealtimeTileDisplay: React.FC<RealtimeTileDisplayProps> = ({
  visibleTiles,
  isVisible,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Agrupar tiles por tipo para estatísticas
  const tileStats = React.useMemo(() => {
    const stats = new Map<string, { count: number; tiles: Array<{ x: number; y: number; tile: TileData }> }>();
    
    visibleTiles.forEach(tileInfo => {
      const type = tileInfo.tile.type;
      if (!stats.has(type)) {
        stats.set(type, { count: 0, tiles: [] });
      }
      const stat = stats.get(type)!;
      stat.count++;
      stat.tiles.push(tileInfo);
    });
    
    return Array.from(stats.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      tiles: data.tiles,
      color: data.tiles[0]?.tile.color || 0xffffff,
    }));
  }, [visibleTiles]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        📊 Mostrar Tiles ({visibleTiles.length})
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '280px',
        maxWidth: '400px',
        maxHeight: '70vh',
        overflow: 'auto',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          📊 Tiles Visíveis
        </h3>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            opacity: 0.7,
          }}
        >
          ✕
        </button>
      </div>

      {/* Estatísticas gerais */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Total: {visibleTiles.length} tiles
        </div>
        <div style={{ opacity: 0.8 }}>
          Tipos únicos: {tileStats.length}
        </div>
      </div>

      {/* Controles */}
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '11px',
            width: '100%',
          }}
        >
          {isExpanded ? '🔼 Recolher Lista' : '🔽 Expandir Lista'}
        </button>
      </div>

      {/* Estatísticas por tipo */}
      <div style={{ marginBottom: isExpanded ? '12px' : '0' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.8 }}>
          Por Tipo:
        </h4>
        {tileStats.map(({ type, count, color }) => {
          const hexColor = color.toString(16).padStart(6, '0');
          return (
            <div
              key={type}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
                padding: '4px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: `#${hexColor}`,
                    borderRadius: '2px',
                    marginRight: '6px',
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{type}</span>
              </div>
              <span style={{ fontWeight: 'bold' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Lista detalhada dos tiles */}
      {isExpanded && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.8 }}>
            Lista Detalhada:
          </h4>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {visibleTiles.map((tileInfo, index) => {
              const hexColor = tileInfo.tile.color.toString(16).padStart(6, '0');
              return (
                <div
                  key={`${tileInfo.x}-${tileInfo.y}-${index}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3px',
                    padding: '3px 6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '3px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: `#${hexColor}`,
                        borderRadius: '1px',
                        marginRight: '6px',
                      }}
                    />
                    <span>{tileInfo.tile.metadata?.label || tileInfo.tile.type}</span>
                  </div>
                  <span style={{ opacity: 0.7, fontSize: '10px' }}>
                    ({tileInfo.x}, {tileInfo.y})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeTileDisplay; 