import React from 'react';
import { IsoBoardCanvas } from '../components/IsoBoardCanvas';
import type { TileData } from '../core/models/Tile';

const testTiles: TileData[] = [
  {
    id: 'water-1',
    type: 'water',
    color: 0x4a90e2,
    metadata: {
      label: 'Água',
      description: 'Tile de água para teste'
    }
  },
  {
    id: 'grass-1',
    type: 'grass',
    color: 0x7cb342,
    metadata: {
      label: 'Grama',
      description: 'Tile de grama para teste'
    }
  },
  {
    id: 'stone-1',
    type: 'stone',
    color: 0x757575,
    metadata: {
      label: 'Pedra',
      description: 'Tile de pedra para teste'
    }
  }
];

export const DragDropTest: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Inventário de tiles */}
      <div style={{ 
        width: '200px', 
        backgroundColor: '#f0f0f0', 
        padding: '20px',
        borderRight: '1px solid #ccc'
      }}>
        <h3>Tiles Disponíveis</h3>
        {testTiles.map(tile => (
          <div
            key={tile.id}
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: `#${tile.color.toString(16).padStart(6, '0')}`,
              margin: '10px 0',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              textAlign: 'center',
              borderRadius: '4px'
            }}
            draggable
            onDragStart={(e) => {
              console.log('Drag start:', tile.id);
              e.dataTransfer.setData('application/json', JSON.stringify(tile));
            }}
          >
            {tile.metadata?.label}
          </div>
        ))}
      </div>

      {/* Board isométrico */}
      <div style={{ flex: 1 }}>
        <IsoBoardCanvas
          boardWidth={10}
          boardHeight={10}
          availableTiles={testTiles}
          onDragStart={(event) => {
            console.log('🎯 Drag iniciado:', event);
          }}
          onDragMove={(event) => {
            console.log('🔄 Drag movendo:', event);
          }}
          onDragEnd={(event) => {
            console.log('✅ Drag finalizado:', event);
          }}
          onTilePlaced={(event) => {
            console.log('🎯 Tile colocado:', event);
          }}
          onError={(event) => {
            console.error('❌ Erro:', event);
          }}
          components={{
            inventory: {},
            controlsPanel: { enabled: true },
            realtimeDisplay: { enabled: true }
          }}
        />
      </div>
    </div>
  );
};

export default DragDropTest; 