import React from 'react';
import { IsoBoardCanvas } from '../components/IsoBoardCanvas';
import type { TileData } from '../core/models/Tile';

const testTiles: TileData[] = [
  {
    id: 'test-red',
    type: 'test',
    color: 0xff0000,
    metadata: {
      label: '🔴 Vermelho',
      description: 'Tile vermelho para teste'
    }
  },
  {
    id: 'test-green',
    type: 'test',
    color: 0x00ff00,
    metadata: {
      label: '🟢 Verde',
      description: 'Tile verde para teste'
    }
  },
  {
    id: 'test-blue',
    type: 'test',
    color: 0x0000ff,
    metadata: {
      label: '🔵 Azul',
      description: 'Tile azul para teste'
    }
  }
];

export const TestInventory: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <IsoBoardCanvas
        boardWidth={6}
        boardHeight={4}
        availableTiles={testTiles}
        onTilePlaced={(event) => {
          console.log('✅ Tile colocado:', event.tile.metadata?.label);
        }}
        onDragStart={(event) => {
          console.log('🎯 Drag iniciado:', event.tile.metadata?.label);
        }}
        // ⚠️ NÃO definir components.inventory para que apareça
        components={{
          controlsPanel: { enabled: true }
        }}
      />
    </div>
  );
};

export default TestInventory; 