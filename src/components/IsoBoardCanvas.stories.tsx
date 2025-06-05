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

export const PaineisBasicos: Story = {
  name: '🎛️ Painéis Básicos - Sistema Funcionando',
  args: {
    boardWidth: 10,
    boardHeight: 8,
    availableTiles: gameTiles.strategy,
    // 🔧 CORREÇÃO: Configuração unificada em config
    config: {
      components: {
        layout: { enabled: true },
        inventory: {
          enabled: true,
          position: 'bottom-left' as const,
          size: 'lg' as const,
          searchEnabled: true,
          categoriesEnabled: true,
          title: '🎒 Inventário',
          variant: 'bordered' as const,
        },
        controlsPanel: {
          enabled: true,
          position: 'top-right' as const,
          size: 'md' as const,
          title: '🎮 Controles',
          variant: 'floating' as const,
          showBasicControls: true,
          showTeleport: true,
          showBookmarks: true,
        }
      }
    }
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 12)]);
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onTilePlaced={(event) => {
              addEvent(`✅ ${event.tile.metadata?.label || event.tile.id} colocado em (${event.boardX}, ${event.boardY})`);
            }}
            onDragStart={(event) => {
              addEvent(`🎯 Arrastando: ${event.tile.metadata?.label || event.tile.id}`);
            }}
            onDragEnd={(event) => {
              if (event.success) {
                addEvent(`📍 Drop realizado com sucesso`);
              } else {
                addEvent(`❌ Drop cancelado`);
              }
            }}
            onTileClick={(event) => {
              addEvent(`👆 Click: ${event.tile.metadata?.label || event.tile.id}`);
            }}
          />
        </div>
        
        <div style={{
          width: '280px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '16px',
          borderLeft: '1px solid #333',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          overflow: 'auto',
        }}>
          <h3 style={{ color: '#4fc3f7', margin: '0 0 16px 0', fontSize: '16px' }}>
            🎛️ Painéis Ativos
          </h3>
          
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(79, 195, 247, 0.1)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4fc3f7' }}>
              ✅ Funcionalidades Ativas:
            </div>
            <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
              🎒 <strong>Inventário de Tiles</strong><br />
              • Busca por nome/tipo<br />
              • Filtros por categoria<br />
              • Drag & Drop para board<br />
              • Painel arrastável<br />
              <br />
              🎮 <strong>Controles do Board</strong><br />
              • Status da câmera<br />
              • Teleporte para coordenadas<br />
              • Sistema de bookmarks<br />
              • Centro e reset zoom<br />
              • Controles de teclado (WASD)<br />
              <br />
              📊 <strong>Estatísticas do Board</strong><br />
              • Resumo em tempo real<br />
              • Contagem por tipo<br />
              • Taxa de ocupação<br />
              • Lista de tiles colocados<br />
              • Distribuição por região<br />
            </div>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4caf50' }}>
              🎯 Como Usar:
            </div>
            <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
              1. <strong>Arrastar Tiles</strong>: Clique e arraste do inventário para o board<br />
              2. <strong>Mover Tiles</strong>: Arraste tiles já colocados<br />
              3. <strong>Buscar</strong>: Use a barra de busca no inventário<br />
              4. <strong>Teleporte</strong>: Digite coordenadas X,Y e clique em "Ir"<br />
              5. <strong>Bookmarks</strong>: Salve posições importantes<br />
              6. <strong>Teclado</strong>: Use WASD para mover câmera<br />
            </div>
          </div>
          
          <h4 style={{ color: '#4fc3f7', margin: '16px 0 8px 0' }}>📜 Log de Eventos</h4>
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '8px',
            borderRadius: '4px',
            height: '200px',
            overflow: 'auto',
            fontSize: '10px',
            lineHeight: 1.4,
            border: '1px solid #333',
          }}>
            {events.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', paddingTop: '40px' }}>
                🎮 Comece interagindo com o jogo!<br />
                Arraste tiles do inventário...
              </div>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{
                  color: index === 0 ? '#4fc3f7' : '#ccc',
                  opacity: Math.max(0.5, 1 - (index * 0.05)),
                  marginBottom: '3px',
                  padding: '2px 0',
                  borderBottom: index < 3 ? '1px solid #333' : 'none',
                }}>
                  {event}
                </div>
              ))
            )}
          </div>
          
          <div style={{ 
            marginTop: '12px', 
            fontSize: '10px', 
            color: '#888',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            💡 Os painéis são arrastáveis!<br />
            Clique no header e arraste para reorganizar
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🎛️ Sistema de Painéis Funcionando

Esta story demonstra o **sistema de painéis extensíveis** em funcionamento:

**🎒 Inventário de Tiles:**
- Lista todos os tiles disponíveis organizadamente
- Barra de busca funcional para encontrar tiles específicos
- Filtros automáticos por categoria (unit, building, etc)
- Drag & Drop completo - arraste do inventário para o board
- Painel totalmente arrastável pelo header

**🎮 Controles do Board:**
- **Status em tempo real** da posição e zoom da câmera
- **Sistema de teleporte** - digite coordenadas X,Y para ir instantaneamente
- **Bookmarks** - salve posições importantes e volte com um clique
- **Controles básicos** - centralize câmera e reset zoom
- **Suporte a teclado** - use WASD para navegar

**✨ Funcionalidades Visuais:**
- Painéis com design moderno e responsivo
- Animações suaves de transição
- Variantes visuais (bordered, floating, etc)
- Sistema de z-index inteligente
- Interface completamente arrastável

**⚙️ Configuração:**
\`\`\`typescript
config: {
  components: {
    layout: { enabled: true },
    inventory: { 
      enabled: true, 
      position: 'bottom-left',
      searchEnabled: true 
    },
    controlsPanel: { 
      enabled: true, 
      position: 'top-right',
      showTeleport: true 
    }
  }
}
\`\`\`

**🎯 Teste Agora:**
1. Arraste tiles do inventário (esquerda) para o board
2. Use a busca para filtrar tiles
3. Experimente o teleporte no painel de controles (direita)
4. Salve bookmarks de posições interessantes
5. Arraste os painéis pelos headers para reorganizar
        `
      }
    }
  }
};

export const SistemaPaineisCompleto: Story = {
  name: '🎛️ SISTEMA COMPLETO - Todos os Painéis',
  args: {
    boardWidth: 12,
    boardHeight: 10,
    availableTiles: [...gameTiles.strategy, ...gameTiles.resources, ...gameTiles.terrain],
    // 🔧 CORREÇÃO: Configuração unificada em config
    config: {
      components: {
        // Habilitar novo sistema de layout
        layout: {
          enabled: true,
          
          enableDragging: true,
          enableCollapsing: true,
          spacing: 12,
        },
        
        // Inventário com novo sistema
        inventory: {
          enabled: true,
          position: 'bottom-left' as const,
          size: 'lg' as const,
          searchEnabled: true,
          categoriesEnabled: true,
          showLabels: true,
          tilesPerRow: 3,
          tileSize: 'md' as const,
          sortBy: 'type' as const,
          viewMode: 'grid' as const,
          collapsible: true,
          draggable: true,
          variant: 'bordered' as const,
          title: '🎒 Arsenal de Tiles',
        },
        
        // Controles com novo sistema
        controlsPanel: {
          enabled: true,
          position: 'top-right' as const,
          size: 'md' as const,
          showBasicControls: true,
          showTeleport: true,
          showBookmarks: true,
          showFollowControls: true,
          enableAdvancedFeatures: true,
          collapsible: true,
          draggable: true,
          variant: 'floating' as const,
          title: '🎮 Centro de Comando',
        },
        
        // Configurações globais dos painéis
        globalSettings: {
          enableAnimations: true,
          animationDuration: 200,
          shadows: true,
          backdropBlur: true,
          fontSize: 'sm',
          spacing: 'normal',
        },
      },
    }
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    const [selectedTile, setSelectedTile] = React.useState<any>(null);
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 10)]);
    };

    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <IsoBoardCanvas
          {...args}
          onTilePlaced={(event) => {
            const tile = event.tile;
            addEvent(`✅ ${tile.metadata?.label || tile.id} → (${event.boardX}, ${event.boardY})`);
          }}
          onTileRemoved={(event) => {
            addEvent(`🗑️ ${event.tile.metadata?.label || event.tile.id} removido`);
          }}
          onDragStart={(event) => {
            addEvent(`🎯 Arrastando: ${event.tile.metadata?.label || event.tile.id}`);
          }}
          onDragEnd={(event) => {
            if (event.success) {
              addEvent(`📍 Drop realizado!`);
            } else {
              addEvent(`❌ Drop cancelado`);
            }
          }}
          onTileClick={(event) => {
            setSelectedTile({
              tile: event.tile,
              position: { x: event.boardX, y: event.boardY },
              button: event.button,
              timestamp: Date.now()
            });
            addEvent(`👆 ${event.button === 'left' ? 'Selecionado' : 'Info'}: ${event.tile.metadata?.label || event.tile.id}`);
          }}
          onTileHover={(event) => {
            if (event.type === 'tile-hover-start') {
              addEvent(`👀 Hovering: ${event.tile.metadata?.label || event.tile.id}`);
            }
          }}
        />
        
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          border: '2px solid #4fc3f7',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          minWidth: '300px',
          maxWidth: '400px',
        }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#4fc3f7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎛️ Sistema de Painéis Ativo
          </h3>
          
          <div style={{ marginBottom: '12px', fontSize: '12px', lineHeight: 1.5 }}>
            <div style={{ color: '#4caf50', marginBottom: '4px' }}>✅ <strong>3 Painéis Ativos:</strong></div>
            <div>• 🎒 Inventário (bottom-left) - Arrastável</div>
            <div>• 🎮 Controles (top-right) - Arrastável</div>
            <div>• 📊 Estatísticas (center-right) - Auto-refresh</div>
          </div>

          {selectedTile && (
            <div style={{
              padding: '8px',
              backgroundColor: 'rgba(79, 195, 247, 0.2)',
              borderRadius: '4px',
              marginBottom: '12px',
              border: '1px solid #4fc3f7',
            }}>
              <div style={{ fontWeight: 'bold', color: '#4fc3f7', marginBottom: '4px' }}>
                🎯 Tile Selecionado:
              </div>
              <div style={{ fontSize: '12px' }}>
                <div><strong>{selectedTile.tile.metadata?.label || selectedTile.tile.id}</strong></div>
                <div>Posição: ({selectedTile.position.x}, {selectedTile.position.y})</div>
                <div>Tipo: {selectedTile.tile.type}</div>
                <div>Botão: {selectedTile.button}</div>
              </div>
            </div>
          )}
          
          <div style={{
            maxHeight: '120px',
            overflow: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '11px',
            border: '1px solid #333',
          }}>
            <div style={{ color: '#4fc3f7', fontWeight: 'bold', marginBottom: '4px' }}>
              📜 Log de Eventos:
            </div>
            {events.length === 0 ? (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                Aguardando interações...
              </div>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{
                  color: index === 0 ? '#4caf50' : '#ccc',
                  opacity: Math.max(0.5, 1 - (index * 0.05)),
                  marginBottom: '2px',
                  padding: '1px 0',
                }}>
                  {event}
                </div>
              ))
            )}
          </div>
          
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            border: '1px solid #ffc107',
          }}>
            <div style={{ color: '#ffc107', fontWeight: 'bold', marginBottom: '4px' }}>
              💡 Dicas de Uso:
            </div>
            <div style={{ lineHeight: 1.4 }}>
              • Arraste tiles do inventário para o board<br />
              • Use busca no inventário para filtrar<br />
              • Teleporte: digite X,Y nos controles<br />
              • Bookmarks: salve posições importantes<br />
              • Arraste painéis pelos headers<br />
              • Use WASD para mover câmera
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🎛️ SISTEMA COMPLETO DE PAINÉIS

Esta é a demonstração **mais completa** do sistema de painéis extensíveis:

**🎒 INVENTÁRIO DE TILES** (bottom-left)
- **Busca inteligente** por nome ou tipo
- **Filtros automáticos** por categoria
- **Visualização em grid** com labels
- **Drag & Drop** completo para o board
- **Painel totalmente arrastável**

**🎮 CONTROLES AVANÇADOS** (top-right)  
- **Status em tempo real** da câmera (posição + zoom)
- **Sistema de teleporte** - digite coordenadas X,Y
- **Bookmarks inteligentes** - salve e volte a posições
- **Controles básicos** - centro e reset zoom
- **Suporte a teclado** - WASD para navegação

**📊 ESTATÍSTICAS DINÂMICAS** (center-right)
- **Métricas em tempo real** - total, ocupação, tipos
- **Distribuição visual** por tipo com barras
- **Análise por região** do board
- **Lista interativa** de todos os tiles
- **Auto-refresh** configurável
- **Filtros por categoria**

**✨ FUNCIONALIDADES VISUAIS:**
- **Design moderno** com variantes (bordered, floating, glass)
- **Animações suaves** de transição e hover
- **Sistema de z-index** inteligente
- **Responsividade** completa
- **Drag & Drop** entre painéis e board

**⚙️ CONFIGURAÇÃO SIMPLES:**
\`\`\`typescript
config: {
  components: {
    layout: { enabled: true },
    inventory: { 
      enabled: true,
      searchEnabled: true,
      categoriesEnabled: true 
    },
    controlsPanel: { 
      enabled: true,
      showTeleport: true,
      showBookmarks: true 
    }
  }
}
\`\`\`

**🎯 TESTE TODAS AS FUNCIONALIDADES:**
1. **Arraste tiles** do inventário para colocar no board
2. **Busque tiles** usando a barra de pesquisa
3. **Teleporte** digitando coordenadas X,Y no painel de controles
4. **Salve bookmarks** de posições importantes
5. **Mova os painéis** arrastando pelos headers
6. **Use o teclado** WASD para navegar pela câmera
7. **Veja estatísticas** sendo atualizadas em tempo real
8. **Explore todos os tipos** de tiles (strategy, resources, terrain)

**🚀 PERFORMANCE:**
- Otimizado para **boards grandes** (12x10+ tiles)
- **Throttling inteligente** de eventos
- **Auto-refresh configurável** das estatísticas
- **Viewport culling** para renderização eficiente
        `
      }
    }
  }
};

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
              controlsPanel: { enabled: true },
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
                enabled: true
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

export const ExtensiblePanelsSystem: Story = {
  name: '🎨 Sistema de Painéis Extensíveis',
  args: {
    boardWidth: 12,
    boardHeight: 10,
    availableTiles: [...gameTiles.strategy, ...gameTiles.resources, ...gameTiles.terrain],
    // 🔧 CORREÇÃO: Configuração unificada em config
    config: {
      components: {
        // Habilitar novo sistema de layout
        layout: {
          enabled: true,
          
          enableDragging: true,
          enableCollapsing: true,
          spacing: 12,
        },
        
        // Inventário com novo sistema
        inventory: {
          enabled: true,
          position: 'bottom-left' as const,
          size: 'lg' as const,
          searchEnabled: true,
          categoriesEnabled: true,
          showLabels: true,
          tilesPerRow: 3,
          tileSize: 'md' as const,
          sortBy: 'type' as const,
          viewMode: 'grid' as const,
          collapsible: true,
          draggable: true,
          variant: 'bordered' as const,
          title: '🎒 Arsenal de Tiles',
        },
        
        // Controles com novo sistema
        controlsPanel: {
          enabled: true,
          position: 'top-right' as const,
          size: 'md' as const,
          showBasicControls: true,
          showTeleport: true,
          showBookmarks: true,
          showFollowControls: true,
          enableAdvancedFeatures: true,
          collapsible: true,
          draggable: true,
          variant: 'floating' as const,
          title: '🎮 Centro de Comando',
        },
        
        // Configurações globais dos painéis
        globalSettings: {
          enableAnimations: true,
          animationDuration: 200,
          shadows: true,
          backdropBlur: true,
          fontSize: 'sm',
          spacing: 'normal',
        },
      },
    }
  },
  render: (args) => {
    const [events, setEvents] = React.useState<string[]>([]);
    const [gameStats, setGameStats] = React.useState({
      playerName: 'Arquiteto Master',
      level: 7,
      score: 15420,
      resources: { gold: 850, wood: 234, stone: 156 },
    });
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 15)]);
    };

    // Exemplo de painel customizado simples
    const CustomStatsPanel: React.FC<any> = (props) => {
      const renderContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>👤 {gameStats.playerName}</span>
            <span>Nv.{gameStats.level}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '10px' }}>
            <div style={{ textAlign: 'center', padding: '4px', backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: '3px' }}>
              <div>🪙</div>
              <div>{gameStats.resources.gold}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '4px', backgroundColor: 'rgba(139, 69, 19, 0.1)', borderRadius: '3px' }}>
              <div>🪵</div>
              <div>{gameStats.resources.wood}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '4px', backgroundColor: 'rgba(128, 128, 128, 0.1)', borderRadius: '3px' }}>
              <div>🗿</div>
              <div>{gameStats.resources.stone}</div>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Pontuação: {gameStats.score.toLocaleString()}
          </div>
        </div>
      );

      return React.createElement('div', {
        style: {
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '200px',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }
      }, [
        React.createElement('div', {
          key: 'header',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }
        }, ['📊 Status do Jogador']),
        React.createElement('div', { key: 'content' }, [renderContent()])
      ]);
    };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <IsoBoardCanvas
            {...args}
            onTilePlaced={(event) => {
              const tile = event.tile;
              addEvent(`🎮 ${tile.metadata?.label} colocado em (${event.boardX}, ${event.boardY})`);
              
              // Simular ganho de recursos
              setGameStats(prev => ({
                ...prev,
                score: prev.score + 100,
                resources: {
                  ...prev.resources,
                  gold: prev.resources.gold + 5,
                }
              }));
            }}
            onDragStart={(event) => {
              addEvent(`🎯 Iniciando: ${event.tile.metadata?.label}`);
            }}
            onDragEnd={(event) => {
              if (event.success) {
                addEvent(`✅ Sucesso: ${event.tile.metadata?.label}`);
              } else {
                addEvent(`❌ Cancelado: ${event.tile.metadata?.label}`);
              }
            }}
            onTileClick={(event) => {
              addEvent(`🖱️ Click: ${event.tile.metadata?.label}`);
            }}
          />
        </div>
        
        <GameEventLog 
          events={events}
          title="Sistema Extensível"
          maxHeight={400}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🎨 Sistema de Painéis Extensíveis

Esta story demonstra o **novo sistema de painéis extensíveis** da IsoBoardLib:

**🔧 Configuração do Layout:**
\`\`\`typescript
config: {
  components: {
    layout: {
      enabled: true,
      
      enableDragging: true,
      enableCollapsing: true,
      spacing: 12,
    }
  }
}
\`\`\`

**🎒 Inventário Avançado:**
- **Busca e Filtros**: Encontre tiles rapidamente
- **Categorização**: Organização automática por tipo
- **Visualizações**: Grid e lista intercambiáveis
- **Drag & Drop**: Interface moderna e responsiva
- **Tamanhos Customizáveis**: De xs até xl

**🎮 Controles Avançados:**
- **Bookmarks**: Salve posições importantes
- **Teleporte**: Navegação rápida por coordenadas
- **Auto-seguimento**: Câmera que segue ações
- **Animações Suaves**: Transições de câmera elegantes

**📊 Painéis Customizados:**
- **API Extensível**: Crie seus próprios painéis
- **Posicionamento Flexível**: 13 posições predefinidas
- **Temas Visuais**: 5 variantes de estilo
- **Estado Reativo**: Integração completa com React

**🎨 Funcionalidades do Sistema:**
- **Layout Inteligente**: Gerencia z-index e posições automaticamente
- **Compatibilidade**: Sistema antigo funciona normalmente
- **Performance**: Otimizado para muitos painéis simultâneos
- **Acessibilidade**: Suporte a teclado e screen readers

**📱 Responsividade:**
- Painéis se adaptam ao tamanho da tela
- Posicionamento automático em dispositivos móveis
- Redimensionamento dinâmico de conteúdo
        `
      }
    }
  }
};

export const ComparisonOldVsNew: Story = {
  name: '⚖️ Comparação: Sistema Antigo vs Novo',
  args: {
    boardWidth: 10,
    boardHeight: 8,
    availableTiles: gameTiles.strategy,
  },
  render: (args) => {
    const [useNewSystem, setUseNewSystem] = React.useState(false);
    const [events, setEvents] = React.useState<string[]>([]);
    
    const addEvent = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 8)]);
    };

    // Configuração para sistema novo
    const newSystemConfig = {
      components: {
        layout: {
          enabled: true,
          
          enableDragging: true,
          enableCollapsing: true,
          spacing: 16,
        },
        inventory: {
          enabled: true,
          position: 'bottom-left' as const,
          size: 'md' as const,
          searchEnabled: true,
          categoriesEnabled: true,
          variant: 'floating' as const,
          title: '🎒 Inventário Moderno',
        },
        controlsPanel: {
          enabled: true,
          position: 'top-right' as const,
          size: 'sm' as const,
          variant: 'bordered' as const,
          title: '⚙️ Controles Avançados',
        },
      },
    };

    // Configuração para sistema antigo (padrão)
    const oldSystemConfig = {
      controlsPanel: { enabled: true },
    };

    const currentConfig = useNewSystem 
      ? { config: newSystemConfig }
      : { components: oldSystemConfig };

    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header de Controle */}
        <div style={{
          padding: '16px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              ⚖️ Comparação: Sistema {useNewSystem ? 'Novo (Extensível)' : 'Antigo (Compatibilidade)'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
              {useNewSystem 
                ? 'Painéis arrastáveis, colapsáveis, com busca e filtros avançados'
                : 'Sistema original simples, sem funcionalidades avançadas'
              }
            </p>
          </div>
          
          <button
            onClick={() => setUseNewSystem(!useNewSystem)}
            style={{
              padding: '8px 16px',
              backgroundColor: useNewSystem ? '#4caf50' : '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {useNewSystem ? '🎨 Usar Sistema Antigo' : '🚀 Usar Sistema Novo'}
          </button>
        </div>

        {/* Area do Board */}
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <IsoBoardCanvas
              {...args}
              {...currentConfig}
              onTilePlaced={(event) => {
                addEvent(`✅ ${event.tile.metadata?.label} colocado (${useNewSystem ? 'Novo' : 'Antigo'})`);
              }}
              onDragStart={(event) => {
                addEvent(`🎯 Drag iniciado: ${event.tile.metadata?.label}`);
              }}
              onTileClick={(event) => {
                addEvent(`🖱️ Click: ${event.tile.metadata?.label}`);
              }}
            />
          </div>
          
          {/* Painel de Informações */}
          <div style={{
            width: '300px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            padding: '16px',
            borderLeft: '1px solid #333',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            overflow: 'auto',
          }}>
            <h4 style={{ color: useNewSystem ? '#4caf50' : '#ff9800', margin: '0 0 12px 0' }}>
              📊 Sistema {useNewSystem ? 'Novo' : 'Antigo'}
            </h4>

            {/* Funcionalidades Disponíveis */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4fc3f7' }}>
                🔧 Funcionalidades Disponíveis:
              </div>
              <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                {useNewSystem ? (
                  <>
                    ✅ Painéis arrastáveis<br />
                    ✅ Painéis colapsáveis<br />
                    ✅ Busca no inventário<br />
                    ✅ Filtros por categoria<br />
                    ✅ Múltiplas visualizações<br />
                    ✅ Controles avançados<br />
                    ✅ Bookmarks de posição<br />
                    ✅ Sistema de teleporte<br />
                    ✅ Temas visuais<br />
                    ✅ Posicionamento flexível<br />
                    ✅ API de extensibilidade<br />
                    ✅ Painéis customizados
                  </>
                ) : (
                  <>
                    ✅ Drag & Drop básico<br />
                    ✅ Inventário simples<br />
                    ✅ Controles de câmera<br />
                    ✅ Informações de tile<br />
                    ❌ Painéis arrastáveis<br />
                    ❌ Busca no inventário<br />
                    ❌ Filtros avançados<br />
                    ❌ Bookmarks<br />
                    ❌ Teleporte<br />
                    ❌ Temas visuais<br />
                    ❌ Extensibilidade<br />
                    ❌ Painéis customizados
                  </>
                )}
              </div>
            </div>

            {/* Vantagens do Sistema */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(0, 255, 0, 0.1)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4caf50' }}>
                🎯 Vantagens:
              </div>
              <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                {useNewSystem ? (
                  <>
                    • Interface totalmente customizável<br />
                    • Melhor organização visual<br />
                    • Produtividade aumentada<br />
                    • Experiência de usuário moderna<br />
                    • Fácil extensão para novos recursos<br />
                    • Suporte a múltiplos temas<br />
                    • Animações suaves<br />
                    • Responsivo para diferentes telas
                  </>
                ) : (
                  <>
                    • Simples de usar<br />
                    • Compatibilidade total<br />
                    • Carregamento rápido<br />
                    • Menos complexidade<br />
                    • Ideal para casos básicos
                  </>
                )}
              </div>
            </div>

            {/* Log de Eventos */}
            <h5 style={{ color: '#4fc3f7', margin: '16px 0 8px 0' }}>📜 Log de Eventos</h5>
            <div style={{
              backgroundColor: '#0a0a0a',
              padding: '8px',
              borderRadius: '4px',
              height: '120px',
              overflow: 'auto',
              fontSize: '10px',
              lineHeight: 1.4,
            }}>
              {events.length === 0 ? (
                <div style={{ color: '#666', textAlign: 'center', paddingTop: '20px' }}>
                  Interaja com o jogo para ver eventos...
                </div>
              ) : (
                events.map((event, index) => (
                  <div key={index} style={{
                    color: index === 0 ? (useNewSystem ? '#4caf50' : '#ff9800') : '#ccc',
                    opacity: Math.max(0.4, 1 - (index * 0.1)),
                    marginBottom: '2px',
                  }}>
                    {event}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### ⚖️ Comparação: Sistema Antigo vs Novo

Esta story permite comparar lado a lado o **sistema antigo** (compatibilidade) com o **novo sistema extensível**:

**📊 Sistema Antigo (Compatibilidade):**
- ✅ Funcionalidade básica mantida
- ✅ Código existente funciona sem mudanças
- ✅ Interface simples e direta
- ❌ Limitado em customização
- ❌ Sem funcionalidades avançadas

**🚀 Sistema Novo (Extensível):**
- ✅ Painéis totalmente customizáveis
- ✅ Interface moderna e interativa
- ✅ Busca e filtros avançados
- ✅ Sistema de layout inteligente
- ✅ API de extensibilidade completa

**🔄 Migração Gradual:**
\`\`\`typescript
// Habilitar novo sistema
config: {
  components: {
    layout: { enabled: true },
    inventory: { enabled: true },
    controlsPanel: { enabled: true }
  }
}

// Sistema antigo continua funcionando
// (sem configuração de layout)
\`\`\`

**💡 Casos de Uso:**
- **Sistema Antigo**: Projetos simples, prototipagem rápida
- **Sistema Novo**: Aplicações profissionais, jogos complexos

**🎯 Recomendação:**
Use o novo sistema para novos projetos e migre gradualmente projetos existentes.
        `
      }
    }
  }
};

export const TesteSimplesPaineis: Story = {
  name: '🧪 TESTE - Painéis Simples',
  args: {
    boardWidth: 8,
    boardHeight: 6,
    availableTiles: [
      {
        id: 'test-tile',
        type: 'unit',
        color: 0xff4444,
        metadata: { label: '🔴 Tile Teste' }
      },
      {
        id: 'test-tile-2',
        type: 'building',
        color: 0x44ff44,
        metadata: { label: '🟢 Tile Verde' }
      }
    ],
    // 🔧 CORREÇÃO: Configuração simplificada para teste
    config: {
      components: {
        layout: { 
          enabled: true,
          spacing: 16,
          enableDragging: true,
          enableCollapsing: true,
        },
        inventory: {
          enabled: true,
          position: 'bottom-left' as const,
          size: 'md' as const,
          title: '🎒 Inventário TESTE',
          searchEnabled: false,
          categoriesEnabled: false,
          draggable: true,
          collapsible: true,
        },
        controlsPanel: {
          enabled: true,
          position: 'top-right' as const,
          size: 'sm' as const,
          title: '🎮 Controles TESTE',
          showBasicControls: true,
          showTeleport: false,
          showBookmarks: false,
          draggable: true,
          collapsible: true,
        }
      }
    }
  },
  render: (args) => {
    console.log('🧪 Renderizando story de teste...', args.config);
    
    return (
      <div style={{ width: '100%', height: '100vh', backgroundColor: '#1a1a1a', position: 'relative' }}>
        <IsoBoardCanvas
          {...args}
          onTilePlaced={(event) => {
            console.log('✅ Tile colocado:', event.tile.metadata?.label);
          }}
          onDragStart={(event) => {
            console.log('🎯 Drag iniciado:', event.tile.metadata?.label);
          }}
        />
        
        {/* Indicador Visual de Debug */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 255, 0, 0.9)',
          color: 'black',
          padding: '8px 16px',
          borderRadius: '6px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9999,
          border: '2px solid #00ff00',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
        }}>
          🧪 TESTE PAINÉIS - Layout Ativado ✅
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🧪 Story de Teste para Painéis - CORRIGIDA

Esta story testa o sistema de painéis sem duplicação:

**✅ Funcionalidades Ativas:**
- Layout Manager ativado
- Inventário simples (bottom-left) - arrastável e colapsável
- Controles básicos (top-right) - arrastável e colapsável  
- Z-index corrigido (valores 1200+)
- Sem painéis duplicados

**🎯 O que testar:**
1. Arraste os painéis pelos headers
2. Collapse/expanda os painéis clicando no botão
3. Arraste tiles do inventário para o board
4. Use os controles básicos
5. Verifique se não há sobreposição

**🔧 Configuração:**
\`\`\`typescript
config: {
  components: {
    layout: { enabled: true },
    inventory: { enabled: true, position: 'bottom-left' },
    controlsPanel: { enabled: true, position: 'top-right' }
  }
}
\`\`\`
        `
      }
    }
  }
}; 