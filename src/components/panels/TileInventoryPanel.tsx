import React, { useState, useMemo } from 'react';
import { BasePanelComponent, type BasePanelProps, type PanelAction } from './BasePanelComponent';
import type { TileData } from '../../core/models/Tile';
import { TILE_SIZE, TILE_HEIGHT } from '../../core/constants';

interface TileInventoryPanelProps extends Partial<BasePanelProps> {
  tiles: TileData[];
  onDragStart: (tile: TileData, e: React.MouseEvent<HTMLDivElement>) => void;
  
  // Configurações específicas do inventário
  searchEnabled?: boolean;
  categoriesEnabled?: boolean;
  showLabels?: boolean;
  tilesPerRow?: number;
  tileSize?: 'sm' | 'md' | 'lg';
  sortBy?: 'name' | 'type' | 'recent';
  maxItems?: number;
}

export const TileInventoryPanel: React.FC<TileInventoryPanelProps> = ({
  tiles,
  onDragStart,
  
  // Configurações específicas
  searchEnabled = true,
  categoriesEnabled = true,
  showLabels = true,
  tilesPerRow = 3,
  tileSize = 'md',
  sortBy = 'type',
  maxItems,
  
  // Props do BasePanel
  id = 'tile-inventory',
  title = 'Inventário de Tiles',
  icon = '🎒',
  position = 'bottom-left',
  size = 'lg',
  collapsible = true,
  draggable = true,
  priority = 'medium',
  ...basePanelProps
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ==================== COMPUTED DATA ====================

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(tiles.map(tile => tile.type));
    return Array.from(cats).sort();
  }, [tiles]);

  // Tiles filtrados
  const filteredTiles = useMemo(() => {
    let filtered = tiles;

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tile => tile.type === selectedCategory);
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tile => 
        tile.id.toLowerCase().includes(search) ||
        tile.type.toLowerCase().includes(search) ||
        tile.metadata?.label?.toLowerCase().includes(search) ||
        tile.metadata?.description?.toLowerCase().includes(search)
      );
    }

    // Ordenação
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => 
          (a.metadata?.label || a.id).localeCompare(b.metadata?.label || b.id)
        );
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'recent':
        // Manter ordem original (assumindo que é cronológica)
        break;
    }

    // Limite de itens
    if (maxItems && filtered.length > maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [tiles, selectedCategory, searchTerm, sortBy, maxItems]);

  // ==================== HEADER ACTIONS ====================

  const headerActions: PanelAction[] = [
    {
      id: 'view-grid',
      icon: '⊞',
      label: 'Grade',
      tooltip: 'Ver em grade',
      onClick: () => setViewMode('grid'),
      variant: viewMode === 'grid' ? 'primary' : 'ghost',
    },
    {
      id: 'view-list',
      icon: '☰',
      label: 'Lista',
      tooltip: 'Ver em lista',
      onClick: () => setViewMode('list'),
      variant: viewMode === 'list' ? 'primary' : 'ghost',
    },
    {
      id: 'refresh',
      icon: '🔄',
      label: 'Atualizar',
      tooltip: 'Atualizar inventário',
      onClick: () => {
        setSearchTerm('');
        setSelectedCategory('all');
      },
    },
  ];

  // ==================== TILE SIZE CONFIG ====================

  const tileSizeConfig = {
    sm: { width: 32, height: 20, fontSize: '8px' },
    md: { width: 48, height: 30, fontSize: '10px' },
    lg: { width: 64, height: 40, fontSize: '12px' },
  };

  const currentTileSize = tileSizeConfig[tileSize];

  // ==================== CUSTOM CONTENT RENDERER ====================

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
      {/* Search Bar */}
      {searchEnabled && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            placeholder="Buscar tiles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'inherit',
              fontSize: '12px',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Category Filter */}
      {categoriesEnabled && categories.length > 1 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <CategoryButton
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          >
            Todos ({tiles.length})
          </CategoryButton>
          {categories.map(category => {
            const count = tiles.filter(t => t.type === category).length;
            return (
              <CategoryButton
                key={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </CategoryButton>
            );
          })}
        </div>
      )}

      {/* Results Info */}
      <div style={{ 
        fontSize: '11px', 
        opacity: 0.7,
        padding: '4px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {filteredTiles.length} {filteredTiles.length === 1 ? 'tile' : 'tiles'}
        {searchTerm && ` para "${searchTerm}"`}
        {selectedCategory !== 'all' && ` em ${selectedCategory}`}
      </div>

      {/* Tiles Display */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredTiles.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            color: '#888',
            fontSize: '12px',
            textAlign: 'center',
          }}>
            {searchTerm || selectedCategory !== 'all' 
              ? 'Nenhum tile encontrado'
              : 'Inventário vazio'
            }
          </div>
        ) : (
          viewMode === 'grid' ? (
            <TileGrid
              tiles={filteredTiles}
              onDragStart={onDragStart}
              tilesPerRow={tilesPerRow}
              tileSize={currentTileSize}
              showLabels={showLabels}
            />
          ) : (
            <TileList
              tiles={filteredTiles}
              onDragStart={onDragStart}
              showLabels={showLabels}
            />
          )
        )}
      </div>
    </div>
  );

  // ==================== RENDER ====================

  return (
    <BasePanelComponent
      {...basePanelProps}
      id={id}
      title={title}
      subtitle={`${filteredTiles.length} / ${tiles.length} tiles`}
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

const CategoryButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 8px',
      border: `1px solid ${active ? '#007bff' : 'rgba(255, 255, 255, 0.3)'}`,
      borderRadius: '4px',
      backgroundColor: active ? '#007bff' : 'rgba(255, 255, 255, 0.1)',
      color: active ? 'white' : 'inherit',
      fontSize: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {children}
  </button>
);

const TileGrid: React.FC<{
  tiles: TileData[];
  onDragStart: (tile: TileData, e: React.MouseEvent<HTMLDivElement>) => void;
  tilesPerRow: number;
  tileSize: { width: number; height: number; fontSize: string };
  showLabels: boolean;
}> = ({ tiles, onDragStart, tilesPerRow, tileSize, showLabels }) => (
  <div 
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${tilesPerRow}, 1fr)`,
      gap: '8px',
      padding: '4px',
    }}
  >
    {tiles.map(tile => (
      <TileGridItem
        key={tile.id}
        tile={tile}
        onDragStart={onDragStart}
        size={tileSize}
        showLabel={showLabels}
      />
    ))}
  </div>
);

const TileGridItem: React.FC<{
  tile: TileData;
  onDragStart: (tile: TileData, e: React.MouseEvent<HTMLDivElement>) => void;
  size: { width: number; height: number; fontSize: string };
  showLabel: boolean;
}> = ({ tile, onDragStart, size, showLabel }) => {
  const hexColor = tile.color.toString(16).padStart(6, '0');
  const label = tile.metadata?.label || tile.type;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'grab',
        padding: '4px',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease',
      }}
      onMouseDown={e => onDragStart(tile, e)}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={tile.metadata?.description || `${label} (${tile.type})`}
    >
      <div
        style={{
          width: size.width,
          height: size.height,
          backgroundColor: `#${hexColor}`,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size.fontSize,
          fontWeight: 'bold',
          color: 'white',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      >
        {tile.metadata?.emoji || tile.type.charAt(0).toUpperCase()}
      </div>
      {showLabel && (
        <div
          style={{
            fontSize: '9px',
            textAlign: 'center',
            opacity: 0.8,
            maxWidth: size.width + 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const TileList: React.FC<{
  tiles: TileData[];
  onDragStart: (tile: TileData, e: React.MouseEvent<HTMLDivElement>) => void;
  showLabels: boolean;
}> = ({ tiles, onDragStart, showLabels }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    {tiles.map(tile => (
      <TileListItem
        key={tile.id}
        tile={tile}
        onDragStart={onDragStart}
        showLabel={showLabels}
      />
    ))}
  </div>
);

const TileListItem: React.FC<{
  tile: TileData;
  onDragStart: (tile: TileData, e: React.MouseEvent<HTMLDivElement>) => void;
  showLabel: boolean;
}> = ({ tile, onDragStart, showLabel }) => {
  const hexColor = tile.color.toString(16).padStart(6, '0');
  const label = tile.metadata?.label || tile.type;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: '4px',
        cursor: 'grab',
        transition: 'background-color 0.2s ease',
      }}
      onMouseDown={e => onDragStart(tile, e)}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={tile.metadata?.description || `${label} (${tile.type})`}
    >
      {/* Tile Preview */}
      <div
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: `#${hexColor}`,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          flexShrink: 0,
        }}
      >
        {tile.metadata?.emoji || tile.type.charAt(0).toUpperCase()}
      </div>

      {/* Tile Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 'bold',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '9px',
          opacity: 0.7,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {tile.type} • #{hexColor}
        </div>
      </div>
    </div>
  );
};

export default TileInventoryPanel; 