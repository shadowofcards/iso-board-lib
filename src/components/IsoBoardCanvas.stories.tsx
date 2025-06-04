import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IsoBoardCanvas } from './IsoBoardCanvas';
import type { TileData } from '../core/models/Tile';

const meta: Meta<typeof IsoBoardCanvas> = {
  title: 'IsoBoardLib/Exemplos de Jogos',
  component: IsoBoardCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# 🎮 IsoBoardLib - Biblioteca para Jogos Isométricos

Uma biblioteca React/Phaser para criar jogos de tabuleiro isométricos com sistema completo de drag & drop, 
eventos, validação e controles de câmera.

## 🚀 Funcionalidades Principais

- **Drag & Drop**: Arraste tiles do inventário para o board
- **Movimentação**: Mova tiles já colocados no board
- **Eventos**: Sistema completo de callbacks para todas as ações
- **Validação**: Sistema de proximidade e validação de posições
- **Câmera**: Controles de pan e zoom
- **Performance**: Otimizado para boards grandes com viewport culling

## 📖 Como Usar

Todas as stories abaixo demonstram diferentes aspectos da biblioteca através de exemplos práticos de jogos.
        `
      }
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== TILES DE EXEMPLO ====================

const gameTiles: Record<string, TileData[]> = {
  // Tiles básicos para estratégia
  strategy: [
    {
      id: 'unit-warrior',
      type: 'unit',
      color: 0xff4444,
      metadata: {
        label: '⚔️ Guerreiro',
        description: 'Unidade de combate corpo-a-corpo',
        properties: {
          attack: 5,
          defense: 3,
          movement: 2,
          health: 15,
          cost: 3
        }
      }
    },
    {
      id: 'unit-archer',
      type: 'unit', 
      color: 0x44ff44,
      metadata: {
        label: '🏹 Arqueiro',
        description: 'Unidade de ataque à distância',
        properties: {
          attack: 4,
          defense: 1,
          movement: 3,
          health: 10,
          range: 3,
          cost: 2
        }
      }
    },
    {
      id: 'building-castle',
      type: 'building',
      color: 0x8B4513,
      metadata: {
        label: '🏰 Castelo',
        description: 'Estrutura defensiva principal',
        properties: {
          defense: 10,
          health: 50,
          produces: 'units',
          cost: 10
        }
      }
    }
  ],

  // Tiles de recursos para city-building
  resources: [
    {
      id: 'resource-wood',
      type: 'resource',
      color: 0x8B4513,
      metadata: {
        label: '🪵 Madeira',
        description: 'Recurso básico para construção',
        properties: {
          value: 1,
          renewable: true,
          extractionRate: 2
        }
      }
    },
    {
      id: 'resource-stone',
      type: 'resource',
      color: 0x808080,
      metadata: {
        label: '🗿 Pedra',
        description: 'Recurso para construções avançadas',
        properties: {
          value: 2,
          renewable: false,
          extractionRate: 1
        }
      }
    },
    {
      id: 'resource-gold',
      type: 'resource',
      color: 0xFFD700,
      metadata: {
        label: '💰 Ouro',
        description: 'Moeda para comércio e contratação',
        properties: {
          value: 5,
          renewable: false,
          extractionRate: 1
        }
      }
    }
  ],

  // Tiles de terreno
  terrain: [
    {
      id: 'terrain-grass',
      type: 'terrain',
      color: 0x32CD32,
      metadata: {
        label: '🌱 Grama',
        description: 'Terreno básico transitável',
        properties: {
          movementCost: 1,
          buildable: true,
          fertile: true
        }
      }
    },
    {
      id: 'terrain-water',
      type: 'terrain',
      color: 0x4169E1,
      metadata: {
        label: '🌊 Água',
        description: 'Terreno aquático',
        properties: {
          movementCost: 3,
          buildable: false,
          naval: true
        }
      }
    },
    {
      id: 'terrain-mountain',
      type: 'terrain',
      color: 0x696969,
      metadata: {
        label: '⛰️ Montanha',
        description: 'Terreno elevado e defensivo',
        properties: {
          movementCost: 2,
          buildable: false,
          defensiveBonus: 2
        }
      }
    }
  ]
};

// ==================== COMPONENTE DE LOG ====================

const GameEventLog: React.FC<{
  events: string[];
  title: string;
  maxHeight?: number;
}> = ({ events, title, maxHeight = 300 }) => (
  <div style={{
    width: '320px',
    background: '#1a1a1a',
    color: 'white',
    padding: '15px',
    borderLeft: '1px solid #333',
    fontFamily: 'monospace',
    fontSize: '12px',
  }}>
    <h3 style={{ color: '#00ff00', margin: '0 0 15px 0', fontSize: '14px' }}>
      🎮 {title}
    </h3>
    
    <div style={{
      background: '#0a0a0a',
      padding: '10px',
      borderRadius: '4px',
      maxHeight: `${maxHeight}px`,
      overflowY: 'auto',
      fontSize: '11px',
      lineHeight: '1.4',
      border: '1px solid #333'
    }}>
      {events.length === 0 ? (
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          Nenhum evento ainda...
        </div>
      ) : (
        events.map((event, index) => (
          <div key={index} style={{
            color: index === 0 ? '#00ff00' : '#ccc',
            opacity: Math.max(0.4, 1 - (index * 0.05)),
            marginBottom: '3px',
            padding: '2px 0',
            borderBottom: index === 0 ? '1px solid #333' : 'none'
          }}>
            {event}
          </div>
        ))
      )}
    </div>
    
    <div style={{ 
      marginTop: '10px', 
      fontSize: '10px', 
      color: '#666',
      borderTop: '1px solid #333',
      paddingTop: '8px'
    }}>
      💡 Arraste tiles do inventário ou mova tiles do board
    </div>
  </div>
);

// ==================== STORIES ====================

// 📝 NOTA IMPORTANTE: Para que o inventário apareça, NÃO configure components.inventory
// A lógica é: shouldShowInventory = !components.inventory
// Se components.inventory for definido (mesmo como {}), o inventário NÃO aparece
// Deixe components.inventory undefined para mostrar o inventário automaticamente

export const BasicDragAndDrop: Story = {
  name: '🎯 Básico: Drag & Drop',
  args: {
    boardWidth: 8,
    boardHeight: 6,
    availableTiles: gameTiles.strategy,
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onDragStart={(event) => {
              addEvent(`🎯 DRAG START: ${event.tile.metadata?.label} (${event.source})`);
            }}
            onDragEnd={(event) => {
              addEvent(`${event.success ? '✅' : '❌'} DRAG END: ${event.action} - ${event.success ? 'sucesso' : 'cancelado'}`);
            }}
            onTilePlaced={(event) => {
              addEvent(`🎮 TILE PLACED: ${event.tile.metadata?.label} → (${event.boardX}, ${event.boardY})`);
            }}
            onTileHover={(event) => {
              if (event.type === 'tile-hover-start') {
                addEvent(`👆 HOVER: ${event.tile.metadata?.label} em (${event.boardX}, ${event.boardY})`);
              }
            }}
            onTileClick={(event) => {
              addEvent(`🖱️ CLICK: ${event.tile.metadata?.label} [${event.button}] (${event.clickCount}x)`);
            }}
            components={{
              controlsPanel: { enabled: true },
              tileInfoPopup: { showOnHover: true }
            }}
          />
        </div>
        
        <GameEventLog 
          events={events}
          title="Eventos Básicos"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🎯 Funcionalidade Básica de Drag & Drop

Demonstra as funcionalidades essenciais:

- **Arrastar do Inventário**: Clique e arraste tiles do inventário para o board
- **Mover no Board**: Clique e arraste tiles já colocados para nova posição  
- **Eventos**: Todos os eventos são logados em tempo real
- **Hover**: Passe o mouse sobre tiles para ver informações
- **Click**: Clique direito para detalhes, esquerdo para selecionar

**Eventos Disponíveis:**
- \`onDragStart\` - Quando inicia um drag
- \`onDragEnd\` - Quando termina um drag (sucesso ou falha)
- \`onTilePlaced\` - Quando um tile é colocado no board
- \`onTileHover\` - Quando passa mouse sobre um tile
- \`onTileClick\` - Quando clica em um tile
        `
      }
    }
  }
};

export const StrategyGame: Story = {
  name: '⚔️ Jogo de Estratégia',
  args: {
    boardWidth: 10,
    boardHeight: 8,
    availableTiles: gameTiles.strategy,
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    const [gameState, setGameState] = React.useState({
      selectedUnit: null as TileData | null,
      turn: 1,
      player: 'Jogador 1',
      resources: { gold: 10, units: 0 }
    });
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 15)]);
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onTilePlaced={(event) => {
              const unit = event.tile;
              const cost = unit.metadata?.properties?.cost || 0;
              
              if (gameState.resources.gold >= cost) {
                setGameState(prev => ({
                  ...prev,
                  resources: {
                    ...prev.resources,
                    gold: prev.resources.gold - cost,
                    units: prev.resources.units + 1
                  }
                }));
                addEvent(`🎖️ ${unit.metadata?.label} recrutado por ${cost} ouro`);
                addEvent(`💰 Ouro restante: ${gameState.resources.gold - cost}`);
              } else {
                addEvent(`❌ Ouro insuficiente para ${unit.metadata?.label} (${cost})`);
              }
            }}
            onTileClick={(event) => {
              if (event.button === 'left') {
                setGameState(prev => ({ ...prev, selectedUnit: event.tile }));
                addEvent(`👆 Selecionado: ${event.tile.metadata?.label}`);
              } else if (event.button === 'right') {
                const unit = event.tile;
                const props = unit.metadata?.properties;
                addEvent(`📋 ${unit.metadata?.label}: ATK ${props?.attack}, DEF ${props?.defense}, MOV ${props?.movement}`);
              }
            }}
            onDragStart={(event) => {
              if (event.source === 'board') {
                addEvent(`🔄 Movendo ${event.tile.metadata?.label}`);
              } else {
                addEvent(`🎯 Recrutando ${event.tile.metadata?.label}`);
              }
            }}
            components={{
              controlsPanel: { enabled: true },
              tileInfoPopup: { showOnHover: true, showProperties: true }
            }}
          />
        </div>
        
        <div style={{
          width: '320px',
          background: '#1a1a1a',
          color: 'white',
          padding: '15px',
          borderLeft: '1px solid #333',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <h3 style={{ color: '#ff6b6b', margin: '0 0 15px 0' }}>
            ⚔️ Estado do Jogo
          </h3>
          
          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a2a2a', borderRadius: '4px' }}>
            <div>🏆 Turno: {gameState.turn}</div>
            <div>👤 {gameState.player}</div>
            <div>💰 Ouro: {gameState.resources.gold}</div>
            <div>🎖️ Unidades: {gameState.resources.units}</div>
          </div>

          {gameState.selectedUnit && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#2a4a2a', borderRadius: '4px' }}>
              <div style={{ color: '#4fc3f7', fontWeight: 'bold' }}>🎯 Selecionado:</div>
              <div>{gameState.selectedUnit.metadata?.label}</div>
              <div style={{ fontSize: '10px', color: '#aaa', marginTop: '5px' }}>
                ATK: {gameState.selectedUnit.metadata?.properties?.attack} | 
                DEF: {gameState.selectedUnit.metadata?.properties?.defense} |
                MOV: {gameState.selectedUnit.metadata?.properties?.movement}
              </div>
            </div>
          )}
          
          <h4 style={{ color: '#4fc3f7', margin: '15px 0 10px 0' }}>📜 Log de Batalha</h4>
          <div style={{
            background: '#0a0a0a',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '250px',
            overflowY: 'auto',
            fontSize: '10px',
            lineHeight: '1.4',
          }}>
            {events.length === 0 ? (
              <div style={{ color: '#666' }}>Aguardando ações...</div>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{
                  color: index === 0 ? '#4fc3f7' : '#ccc',
                  opacity: Math.max(0.4, 1 - (index * 0.05)),
                  marginBottom: '2px',
                }}>
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### ⚔️ Exemplo: Jogo de Estratégia

Demonstra como usar a biblioteca para um jogo de estratégia militar:

**Funcionalidades:**
- **Recrutamento**: Arrastar unidades do inventário gasta ouro
- **Seleção**: Clicar em unidades mostra estatísticas  
- **Movimentação**: Arrastar unidades no board para reposicionar
- **Estado do Jogo**: Interface mostra recursos e informações
- **Sistema de Custo**: Cada unidade tem custo em ouro

**Tipos de Unidade:**
- **Guerreiro** ⚔️: Combate corpo-a-corpo (ATK: 5, DEF: 3, MOV: 2)
- **Arqueiro** 🏹: Ataque à distância (ATK: 4, DEF: 1, MOV: 3, Alcance: 3)  
- **Castelo** 🏰: Estrutura defensiva (DEF: 10, HP: 50)

**Controles:**
- Arrastar do inventário = Recrutar unidade
- Arrastar no board = Mover unidade
- Clique esquerdo = Selecionar
- Clique direito = Ver estatísticas
        `
      }
    }
  }
};

export const CityBuilding: Story = {
  name: '🏗️ City Building',
  args: {
    boardWidth: 12,
    boardHeight: 10,
    availableTiles: [...gameTiles.terrain, ...gameTiles.resources],
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    const [resources, setResources] = React.useState({
      wood: 10,
      stone: 5,
      gold: 100,
      population: 0
    });
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 12)]);
    };

    const validatePlacement = (event: any) => {
      const tile = event.draggedTile;
      const nearbyTiles = event.nearbyTiles || [];
      
      if (tile.type === 'resource') {
        // Recursos precisam de terreno adequado
        const hasGoodTerrain = nearbyTiles.some((nearby: any) => 
          nearby.tile.type === 'terrain' && nearby.tile.metadata?.properties?.fertile
        );
        
        if (hasGoodTerrain) {
          addEvent(`✅ Local adequado para ${tile.metadata?.label}`);
        } else {
          addEvent(`⚠️ ${tile.metadata?.label} precisa de terreno fértil próximo`);
        }
      }
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onTilePlaced={(event) => {
              const tile = event.tile;
              const rate = tile.metadata?.properties?.extractionRate || 0;
              
              if (tile.type === 'resource') {
                addEvent(`🏗️ ${tile.metadata?.label} construído em (${event.boardX}, ${event.boardY})`);
                addEvent(`📈 +${rate}/turno de ${tile.metadata?.label.toLowerCase()}`);
              } else if (tile.type === 'terrain') {
                addEvent(`🌍 Terreno ${tile.metadata?.label} colocado`);
              }
            }}
            onTileProximity={validatePlacement}
            onTileClick={(event) => {
              if (event.button === 'right') {
                const tile = event.tile;
                const props = tile.metadata?.properties;
                
                if (tile.type === 'resource') {
                  addEvent(`📊 ${tile.metadata?.label}: Valor ${props?.value}, Taxa ${props?.extractionRate}/turno`);
                } else if (tile.type === 'terrain') {
                  addEvent(`🗺️ ${tile.metadata?.label}: Custo movimento ${props?.movementCost}, Construível: ${props?.buildable ? 'Sim' : 'Não'}`);
                }
              }
            }}
            onDragStart={(event) => {
              addEvent(`🎯 Planejando: ${event.tile.metadata?.label}`);
            }}
            components={{
              controlsPanel: { enabled: true, showPosition: true },
              tileInfoPopup: { showOnHover: true, showProperties: true, showDescription: true }
            }}
          />
        </div>
        
        <div style={{
          width: '320px',
          background: '#1a1a1a',
          color: 'white',
          padding: '15px',
          borderLeft: '1px solid #333',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <h3 style={{ color: '#4fc3f7', margin: '0 0 15px 0' }}>
            🏗️ Cidade
          </h3>
          
          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a2a2a', borderRadius: '4px' }}>
            <div style={{ color: '#8B4513' }}>🪵 Madeira: {resources.wood}</div>
            <div style={{ color: '#808080' }}>🗿 Pedra: {resources.stone}</div>
            <div style={{ color: '#FFD700' }}>💰 Ouro: {resources.gold}</div>
            <div style={{ color: '#87CEEB' }}>👥 População: {resources.population}</div>
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a4a2a', borderRadius: '4px' }}>
            <div style={{ color: '#4fc3f7', fontWeight: 'bold', marginBottom: '8px' }}>
              📋 Guia de Construção
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#ccc' }}>
              • 🌱 Grama: Terreno básico para construção
              <br />
              • 🌊 Água: Navegação, não construível
              <br />
              • ⛰️ Montanha: Defesa +2, não construível
              <br />
              • 🪵 Madeira: +2/turno, precisa terreno fértil
              <br />
              • 🗿 Pedra: +1/turno, qualquer terreno
              <br />
              • 💰 Ouro: +1/turno, muito valioso
            </div>
          </div>
          
          <h4 style={{ color: '#4fc3f7', margin: '15px 0 10px 0' }}>📜 Log de Construção</h4>
          <div style={{
            background: '#0a0a0a',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '10px',
            lineHeight: '1.4',
          }}>
            {events.length === 0 ? (
              <div style={{ color: '#666' }}>Comece construindo...</div>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{
                  color: index === 0 ? '#4fc3f7' : '#ccc',
                  opacity: Math.max(0.4, 1 - (index * 0.05)),
                  marginBottom: '2px',
                }}>
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🏗️ Exemplo: City Building

Demonstra mecânicas de construção de cidade com validação de terreno:

**Funcionalidades:**
- **Terrenos**: Diferentes tipos com propriedades únicas
- **Recursos**: Cada recurso tem taxa de extração e valor
- **Validação**: Sistema de proximidade valida colocação adequada
- **Economia**: Interface mostra recursos acumulados
- **Categorias**: Inventário organizado por tipo

**Sistema de Terreno:**
- **Grama** 🌱: Construível, fértil para agricultura
- **Água** 🌊: Naval, não construível
- **Montanha** ⛰️: Defensivo, não construível

**Sistema de Recursos:**
- **Madeira** 🪵: Renovável, precisa terreno fértil
- **Pedra** 🗿: Finito, qualquer terreno
- **Ouro** 💰: Valioso, raro
        `
      }
    }
  }
};

export const ProximityValidation: Story = {
  name: '🔗 Sistema de Proximidade',
  args: {
    boardWidth: 8,
    boardHeight: 6,
    availableTiles: gameTiles.strategy,
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    const [proximityData, setProximityData] = React.useState<any>(null);
    const [validationFeedback, setValidationFeedback] = React.useState<string>('');
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 10)]);
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onTileProximity={(event) => {
              setProximityData(event);
              const nearbyCount = event.nearbyTiles.length;
              const adjacentCount = event.nearbyTiles.filter(t => t.distance <= 1.5).length;
              
              addEvent(`🔗 Proximidade: ${nearbyCount} tiles próximos, ${adjacentCount} adjacentes`);
              
              if (event.proximityType === 'adjacent') {
                setValidationFeedback('✅ Posição estratégica - tiles adjacentes encontrados');
              } else if (nearbyCount > 0) {
                setValidationFeedback('⚠️ Posição com apoio - tiles próximos');
              } else {
                setValidationFeedback('❌ Posição isolada - sem apoio próximo');
              }
            }}
            onPositionValidation={(event) => {
              if (event.type === 'position-validation-request') {
                addEvent(`🔍 Validando posição (${event.targetPosition.x}, ${event.targetPosition.y})`);
                
                // Simular resposta de validação
                setTimeout(() => {
                  const nearbyCount = event.nearbyTiles.length;
                  const isValid = nearbyCount > 0;
                  
                  // Simular resposta
                  setValidationFeedback(
                    isValid 
                      ? '✅ Posição aprovada pelo sistema' 
                      : '❌ Posição rejeitada - isolada demais'
                  );
                }, 200);
              }
            }}
            onTilePlaced={(event) => {
              addEvent(`🎮 ${event.tile.metadata?.label} colocado em (${event.boardX}, ${event.boardY})`);
              setValidationFeedback('');
              setProximityData(null);
            }}
            onDragStart={(event) => {
              addEvent(`🎯 Iniciando validação para ${event.tile.metadata?.label}`);
            }}
            onDragEnd={(event) => {
              if (!event.success) {
                addEvent(`❌ Colocação cancelada`);
                setValidationFeedback('');
                setProximityData(null);
              }
            }}
            components={{
              controlsPanel: { enabled: true },
              tileInfoPopup: { showOnHover: true }
            }}
          />
        </div>
        
        <div style={{
          width: '350px',
          background: '#1a1a1a',
          color: 'white',
          padding: '15px',
          borderLeft: '1px solid #333',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <h3 style={{ color: '#ff9800', margin: '0 0 15px 0' }}>
            🔗 Sistema de Proximidade
          </h3>
          
          {validationFeedback && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              background: validationFeedback.includes('✅') ? '#1b5e20' : 
                         validationFeedback.includes('⚠️') ? '#e65100' : '#b71c1c',
              borderRadius: '4px',
              border: '1px solid #333'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🎯 Validação Ativa:</div>
              <div style={{ fontSize: '11px' }}>{validationFeedback}</div>
            </div>
          )}
          
          {proximityData && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#2a2a2a', borderRadius: '4px' }}>
              <div style={{ color: '#ff9800', fontWeight: 'bold', marginBottom: '8px' }}>
                📊 Análise de Proximidade
              </div>
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <div>🎯 Tile: {proximityData.draggedTile.metadata?.label}</div>
                <div>📍 Posição: ({proximityData.targetPosition.x}, {proximityData.targetPosition.y})</div>
                <div>📏 Raio: {proximityData.radius} tiles</div>
                <div>🔗 Tipo: {proximityData.proximityType === 'adjacent' ? 'Adjacente' : 'Próximo'}</div>
                <div style={{ marginTop: '8px', color: '#ff9800' }}>
                  🗂️ Tiles Próximos ({proximityData.nearbyTiles.length}):
                </div>
                {proximityData.nearbyTiles.map((tile: any, index: number) => (
                  <div key={index} style={{
                    fontSize: '10px',
                    color: '#ccc',
                    marginLeft: '8px',
                    marginTop: '3px',
                    padding: '2px 0',
                    borderBottom: '1px solid #333'
                  }}>
                    • {tile.tile.metadata?.label} 
                    <span style={{ color: '#888' }}> - {tile.distance.toFixed(1)} tiles</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a4a2a', borderRadius: '4px' }}>
            <div style={{ color: '#ff9800', fontWeight: 'bold', marginBottom: '8px' }}>
              📋 Como Funciona
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#ccc' }}>
              1. **Arraste** um tile sobre o board
              <br />
              2. **Sistema detecta** tiles próximos automaticamente
              <br />
              3. **Validação** roda em tempo real
              <br />
              4. **Feedback visual** mostra resultado
              <br />
              5. **Eventos** permitem lógica customizada
            </div>
          </div>
          
          <h4 style={{ color: '#ff9800', margin: '15px 0 10px 0' }}>📜 Log de Proximidade</h4>
          <div style={{
            background: '#0a0a0a',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '10px',
            lineHeight: '1.4',
          }}>
            {events.length === 0 ? (
              <div style={{ color: '#666' }}>Arraste um tile para testar...</div>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{
                  color: index === 0 ? '#ff9800' : '#ccc',
                  opacity: Math.max(0.4, 1 - (index * 0.05)),
                  marginBottom: '2px',
                }}>
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🔗 Sistema de Proximidade e Validação

Demonstra o sistema avançado de detecção de proximidade e validação:

**Funcionalidades:**
- **Detecção Automática**: Detecta tiles próximos durante o drag
- **Raio Configurável**: Define distância para detecção
- **Tipos de Proximidade**: Adjacent (≤1.5) vs Nearby (>1.5)
- **Validação em Tempo Real**: Feedback instantâneo durante drag
- **Eventos Customizáveis**: \`onTileProximity\` e \`onPositionValidation\`

**Eventos do Sistema:**
- **onTileProximity**: Disparado quando tiles próximos são detectados
- **onPositionValidation**: Permite validação customizada de posições
- **Feedback Visual**: Interface mostra resultado da validação

**Casos de Uso:**
- Jogos de estratégia com formações
- Sistemas de construção com requisitos
- Mecânicas de influência territorial
- Validação de posicionamento de unidades
        `
      }
    }
  }
};

export const CompleteGameDemo: Story = {
  name: '🎮 Demo Completo',
  args: {
    boardWidth: 15,
    boardHeight: 12,
    availableTiles: [...gameTiles.strategy, ...gameTiles.terrain, ...gameTiles.resources],
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    const [selectedTile, setSelectedTile] = React.useState<any>(null);
    const [gameMode, setGameMode] = React.useState<'build' | 'battle' | 'resource'>('build');
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 8)]);
    };

    const modeConfig = {
      build: { color: '#4fc3f7', icon: '🏗️', name: 'Construção' },
      battle: { color: '#f44336', icon: '⚔️', name: 'Batalha' },
      resource: { color: '#4caf50', icon: '💰', name: 'Recursos' }
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onTilePlaced={(event) => {
              addEvent(`✨ ${event.tile.metadata?.label} colocado`);
            }}
            onTileClick={(event) => {
              setSelectedTile({
                tile: event.tile,
                position: { x: event.boardX, y: event.boardY },
                timestamp: Date.now()
              });
              addEvent(`👆 Selecionado: ${event.tile.metadata?.label}`);
            }}
            onDragStart={(event) => {
              const mode = event.tile.type === 'unit' ? 'battle' : 
                          event.tile.type === 'resource' ? 'resource' : 'build';
              setGameMode(mode);
              addEvent(`🎯 Modo: ${modeConfig[mode].name}`);
            }}
            onTileProximity={(event) => {
              const count = event.nearbyTiles.length;
              if (count > 2) {
                addEvent(`🏘️ Área desenvolvida detectada (${count} tiles)`);
              }
            }}
            onCameraMove={(event) => {
              if (event.type === 'camera-move-end') {
                addEvent(`📷 Câmera reposicionada`);
              }
            }}
            onDragEnd={(event) => {
              if (event.success) {
                addEvent(`✅ Ação ${modeConfig[gameMode].name.toLowerCase()} concluída`);
              }
            }}
            components={{
              controlsPanel: { 
                enabled: true,
                showPosition: true,
                showZoom: true,
                showBookmarks: true
              },
              tileInfoPopup: { 
                showOnHover: true, 
                showProperties: true, 
                showDescription: true 
              },
              realtimeDisplay: { 
                enabled: true,
                showFPS: true,
                showTileCount: true
              }
            }}
          />
        </div>
        
        <div style={{
          width: '350px',
          background: '#1a1a1a',
          color: 'white',
          padding: '15px',
          borderLeft: '1px solid #333',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <h3 style={{ color: '#00ff00', margin: '0 0 15px 0' }}>
            🎮 Demo Completo
          </h3>
          
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            background: modeConfig[gameMode].color + '20',
            borderRadius: '4px',
            border: `1px solid ${modeConfig[gameMode].color}`
          }}>
            <div style={{ color: modeConfig[gameMode].color, fontWeight: 'bold' }}>
              {modeConfig[gameMode].icon} Modo: {modeConfig[gameMode].name}
            </div>
            <div style={{ fontSize: '10px', color: '#ccc', marginTop: '5px' }}>
              {gameMode === 'build' && 'Construa terrenos e estruturas'}
              {gameMode === 'battle' && 'Posicione e mova unidades'}
              {gameMode === 'resource' && 'Gerencie recursos e economia'}
            </div>
          </div>

          {selectedTile && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#2a2a2a', borderRadius: '4px' }}>
              <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginBottom: '5px' }}>
                🎯 Tile Selecionado
              </div>
              <div>{selectedTile.tile.metadata?.label}</div>
              <div style={{ fontSize: '10px', color: '#ccc' }}>
                Posição: ({selectedTile.position.x}, {selectedTile.position.y})
              </div>
              <div style={{ fontSize: '10px', color: '#ccc' }}>
                Tipo: {selectedTile.tile.type}
              </div>
              {selectedTile.tile.metadata?.properties && (
                <div style={{ marginTop: '5px', fontSize: '10px' }}>
                  {Object.entries(selectedTile.tile.metadata.properties).map(([key, value]) => (
                    <div key={key} style={{ color: '#aaa' }}>
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a4a2a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '8px' }}>
              🛠️ Funcionalidades Ativas
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.6', color: '#ccc' }}>
              ✅ Drag & Drop completo
              <br />
              ✅ Sistema de proximidade
              <br />
              ✅ Validação em tempo real
              <br />
              ✅ Controles de câmera
              <br />
              ✅ Inventário categorizado
              <br />
              ✅ Popups informativos
              <br />
              ✅ Display de performance
              <br />
              ✅ Sistema de eventos
            </div>
          </div>
          
          <h4 style={{ color: '#00ff00', margin: '15px 0 10px 0' }}>📜 Eventos Recentes</h4>
          <div style={{
            background: '#0a0a0a',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '180px',
            overflowY: 'auto',
            fontSize: '10px',
            lineHeight: '1.4',
          }}>
            {events.length === 0 ? (
              <div style={{ color: '#666' }}>Interaja com o jogo...</div>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{
                  color: index === 0 ? '#00ff00' : '#ccc',
                  opacity: Math.max(0.4, 1 - (index * 0.05)),
                  marginBottom: '2px',
                }}>
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🎮 Demo Completo da IsoBoardLib

Esta story demonstra todas as funcionalidades da biblioteca integradas:

**🎯 Funcionalidades Principais:**
- **Drag & Drop**: Sistema completo de arrastar e soltar
- **Movimentação**: Mover tiles já posicionados no board  
- **Seleção**: Sistema de seleção com feedback visual
- **Proximidade**: Detecção automática de tiles próximos
- **Validação**: Sistema de validação em tempo real
- **Eventos**: Captura todos os eventos do jogo
- **Câmera**: Controles completos de pan e zoom
- **Performance**: Monitoramento em tempo real

**🎨 Interface Completa:**
- **Inventário**: Organizado por categorias com busca
- **Controles**: Panel com bookmarks e informações
- **Popups**: Informativos com propriedades detalhadas
- **Performance**: Display de FPS e contadores
- **Estado**: Interface reativa ao estado do jogo

**🎮 Tipos de Jogo Suportados:**
- Jogos de estratégia militar
- City builders e simuladores
- Jogos de recursos e economia
- Puzzles e quebra-cabeças isométricos
- RPGs táticos

**⚡ Performance:**
- Viewport culling para boards grandes
- Throttling inteligente de eventos
- Spatial indexing para consultas rápidas
- Otimização automática baseada no zoom
        `
      }
    }
  }
}; 