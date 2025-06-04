import React, { useState, useEffect } from 'react';
import { BasePanelComponent, type BasePanelProps, type PanelAction } from './BasePanelComponent';
import type { TileData } from '../../core/models/Tile';

interface BoardStatsPanelProps extends Partial<BasePanelProps> {
  boardTiles: Array<{ x: number; y: number; tile: TileData }>;
  boardWidth: number;
  boardHeight: number;
  onTileSelect?: (x: number, y: number) => void;
  showDetailedStats?: boolean;
  showTileList?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const BoardStatsPanel: React.FC<BoardStatsPanelProps> = ({
  boardTiles,
  boardWidth,
  boardHeight,
  onTileSelect,
  
  // Configurações específicas
  showDetailedStats = true,
  showTileList = true,
  autoRefresh = true,
  refreshInterval = 1000,
  
  // Props do BasePanel
  id = 'board-stats',
  title = 'Estatísticas do Board',
  icon = '📊',
  position = 'center-right',
  size = 'md',
  collapsible = true,
  draggable = true,
  priority = 'medium',
  ...basePanelProps
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ==================== CALCULATED STATS ====================

  const stats = React.useMemo(() => {
    const totalTiles = boardTiles.length;
    const totalCells = boardWidth * boardHeight;
    const occupancyRate = totalCells > 0 ? (totalTiles / totalCells) * 100 : 0;
    
    // Contar por tipo
    const byType = boardTiles.reduce((acc, { tile }) => {
      acc[tile.type] = (acc[tile.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Contar por cor (hex)
    const byColor = boardTiles.reduce((acc, { tile }) => {
      const hexColor = `#${tile.color.toString(16).padStart(6, '0')}`;
      acc[hexColor] = (acc[hexColor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Tiles únicos
    const uniqueTiles = new Set(boardTiles.map(({ tile }) => tile.id)).size;
    
    // Distribuição por região do board
    const regions = {
      'Top-Left': 0,
      'Top-Right': 0,
      'Bottom-Left': 0,
      'Bottom-Right': 0,
      'Center': 0,
    };
    
    const midX = boardWidth / 2;
    const midY = boardHeight / 2;
    
    boardTiles.forEach(({ x, y }) => {
      if (x < midX && y < midY) regions['Top-Left']++;
      else if (x >= midX && y < midY) regions['Top-Right']++;
      else if (x < midX && y >= midY) regions['Bottom-Left']++;
      else if (x >= midX && y >= midY) regions['Bottom-Right']++;
      else regions['Center']++;
    });
    
    return {
      totalTiles,
      totalCells,
      occupancyRate,
      uniqueTiles,
      byType,
      byColor,
      regions,
      mostUsedType: Object.entries(byType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nenhum',
      averagePerType: Object.keys(byType).length > 0 ? totalTiles / Object.keys(byType).length : 0,
    };
  }, [boardTiles, boardWidth, boardHeight, refreshKey]);

  // ==================== HEADER ACTIONS ====================

  const headerActions: PanelAction[] = [
    {
      id: 'refresh',
      icon: '🔄',
      label: 'Atualizar',
      tooltip: 'Atualizar estatísticas',
      onClick: () => setRefreshKey(prev => prev + 1),
    },
    {
      id: 'export',
      icon: '📋',
      label: 'Exportar',
      tooltip: 'Exportar dados',
      onClick: () => {
        const data = {
          timestamp: new Date().toISOString(),
          boardSize: { width: boardWidth, height: boardHeight },
          stats,
          tiles: boardTiles,
        };
        console.log('Board Stats Export:', data);
      },
    },
  ];

  // Filtros por categoria
  const categories = ['all', ...Object.keys(stats.byType)];
  const filteredTiles = selectedCategory === 'all' 
    ? boardTiles 
    : boardTiles.filter(({ tile }) => tile.type === selectedCategory);

  // ==================== CUSTOM CONTENT RENDERER ====================

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Overview Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        padding: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
      }}>
        <StatCard
          label="Total de Tiles"
          value={stats.totalTiles}
          icon="🎲"
          color="#4fc3f7"
        />
        <StatCard
          label="Ocupação"
          value={`${stats.occupancyRate.toFixed(1)}%`}
          icon="📍"
          color="#4caf50"
        />
        <StatCard
          label="Tiles Únicos"
          value={stats.uniqueTiles}
          icon="✨"
          color="#ff9800"
        />
        <StatCard
          label="Tipos"
          value={Object.keys(stats.byType).length}
          icon="📂"
          color="#9c27b0"
        />
      </div>

      {/* Detailed Stats */}
      {showDetailedStats && (
        <>
          {/* Distribution by Type */}
          <StatsSection title="Por Tipo" icon="📊">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <span style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                  {type}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: `${(count / stats.totalTiles) * 60}px`,
                    height: '6px',
                    backgroundColor: '#4fc3f7',
                    borderRadius: '3px',
                    minWidth: '2px',
                  }} />
                  <span style={{ fontSize: '11px', color: '#4fc3f7', fontWeight: 'bold' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </StatsSection>

          {/* Distribution by Region */}
          <StatsSection title="Por Região" icon="🗺️">
            {Object.entries(stats.regions)
              .filter(([, count]) => count > 0)
              .map(([region, count]) => (
                <div key={region} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  fontSize: '11px',
                }}>
                  <span>{region}</span>
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{count}</span>
                </div>
              ))}
          </StatsSection>
        </>
      )}

      {/* Tile List */}
      {showTileList && (
        <StatsSection title="Lista de Tiles" icon="📋">
          <div style={{ marginBottom: '8px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'inherit',
                fontSize: '11px',
              }}
            >
              <option value="all">Todos os tipos ({stats.totalTiles})</option>
              {Object.entries(stats.byType).map(([type, count]) => (
                <option key={type} value={type}>
                  {type} ({count})
                </option>
              ))}
            </select>
          </div>

          <div style={{
            maxHeight: '120px',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          }}>
            {filteredTiles.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#666',
                fontSize: '11px',
              }}>
                Nenhum tile encontrado
              </div>
            ) : (
              filteredTiles.map(({ x, y, tile }, index) => (
                <div
                  key={`${x}-${y}-${index}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderBottom: index < filteredTiles.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    fontSize: '10px',
                    cursor: onTileSelect ? 'pointer' : 'default',
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => onTileSelect?.(x, y)}
                  onMouseEnter={(e) => {
                    if (onTileSelect) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: `#${tile.color.toString(16).padStart(6, '0')}`,
                        borderRadius: '2px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    <span>{tile.metadata?.label || tile.id}</span>
                  </div>
                  <span style={{ color: '#888' }}>({x}, {y})</span>
                </div>
              ))
            )}
          </div>
        </StatsSection>
      )}
    </div>
  );

  // ==================== RENDER ====================

  return (
    <BasePanelComponent
      {...basePanelProps}
      id={id}
      title={title}
      subtitle={`${stats.totalTiles} tiles • ${stats.occupancyRate.toFixed(1)}% ocupado`}
      icon={icon}
      position={position}
      size={size}
      collapsible={collapsible}
      draggable={draggable}
      priority={priority}
      headerActions={headerActions}
      renderContent={renderContent}
    />
  );
};

// ==================== HELPER COMPONENTS ====================

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div style={{
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    textAlign: 'center',
    border: `1px solid ${color}30`,
  }}>
    <div style={{ fontSize: '14px', marginBottom: '2px' }}>{icon}</div>
    <div style={{ fontSize: '11px', color, fontWeight: 'bold' }}>
      {value}
    </div>
    <div style={{ fontSize: '9px', color: '#ccc', opacity: 0.8 }}>
      {label}
    </div>
  </div>
);

const StatsSection: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#4fc3f7',
    }}>
      <span>{icon}</span>
      <span>{title}</span>
    </div>
    <div style={{ paddingLeft: '8px' }}>
      {children}
    </div>
  </div>
);

export default BoardStatsPanel; 