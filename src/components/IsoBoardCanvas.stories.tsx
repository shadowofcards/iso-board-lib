import React from 'react';
import Phaser from 'phaser';
// Ensure every Scene instance has an EventEmitter so `scene.events.on(...)` won't be undefined
;(Phaser.Scene.prototype as any).events = new Phaser.Events.EventEmitter();

import type { Meta, StoryObj } from '@storybook/react';
import { IsoBoardCanvas } from './IsoBoardCanvas';

const meta: Meta<typeof IsoBoardCanvas> = {
  title: 'Components/IsoBoardCanvas',
  component: IsoBoardCanvas,
  tags: ['autodocs'],
  argTypes: {
    boardWidth: {
      control: { type: 'number', min: 10, max: 2000, step: 1 },
      description: 'Largura do tabuleiro em tiles',
    },
    boardHeight: {
      control: { type: 'number', min: 10, max: 2000, step: 1 },
      description: 'Altura do tabuleiro em tiles',
    },
    width: {
      control: 'text',
      description: 'Largura do canvas',
    },
    height: {
      control: 'text',
      description: 'Altura do canvas',
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'IsoBoardCanvas é o componente principal que renderiza um tabuleiro isométrico interativo usando Phaser.js com otimizações avançadas e sistema de eventos completo. ' +
          'Utiliza viewport culling, spatial indexing, Level of Detail (LOD) e batch rendering para suportar boards de qualquer tamanho mantendo 60 FPS. ' +
          'Suporte completo a drag & drop de tiles, navegação livre da câmera, clique direito para informações, renderização otimizada automática e sistema de eventos robusto. ' +
          'Inclui controles avançados: navegação por teclado, bookmarks, teleporte suave e auto-seguimento.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Board básico sem controles avançados - configuração clássica com eventos.
 */
export const BasicBoard: Story = {
  args: {
    boardWidth: 30,
    boardHeight: 30,
    components: {
      controlsPanel: { enabled: false },
    },
  },
  render: ({ boardWidth, boardHeight, components }) => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <IsoBoardCanvas 
        boardWidth={boardWidth} 
        boardHeight={boardHeight}
        components={components}
        onTilePlaced={(event) => console.log('🔷 Tile colocado:', event)}
        onTileRemoved={(event) => console.log('🗑️ Tile removido:', event)}
        onDragStart={(event) => console.log('🎯 Drag iniciado:', event)}
        onDragEnd={(event) => console.log('✅ Drag finalizado:', event)}
        onBoardInitialized={(event) => console.log('🎮 Board inicializado:', event)}
      />
      
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '250px',
          zIndex: 1000,
        }}
      >
        <h4 style={{ margin: '0 0 6px 0', color: '#00ff00' }}>🎮 Board Básico com Eventos</h4>
        <p style={{ margin: 0, fontSize: '11px' }}>
          Configuração clássica com navegação por mouse e eventos:
        </p>
        <ul style={{ margin: '6px 0 0 0', paddingLeft: '14px', fontSize: '11px' }}>
          <li>🖱️ Drag para navegar</li>
          <li>🔍 Scroll para zoom</li>
          <li>🎯 Clique direito para info</li>
          <li>📦 Drag tiles do inventário</li>
          <li>📡 Eventos no console do navegador</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Board básico (30×30) com sistema de eventos ativo. Use o mouse para navegar, scroll para zoom e drag & drop para colocar tiles. Todos os eventos são logados no console do navegador.',
      },
    },
  },
};

/**
 * Board com controles avançados - navegação por teclado, bookmarks e teleporte com eventos completos.
 */
export const AdvancedControls: Story = {
  args: {
    boardWidth: 50,
    boardHeight: 50,
    components: {
      controlsPanel: { enabled: true },
    },
  },
  render: ({ boardWidth, boardHeight, components }) => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <IsoBoardCanvas 
        boardWidth={boardWidth} 
        boardHeight={boardHeight}
        components={components}
        onTileEvent={(event) => console.log('🔷 Evento de Tile:', event)}
        onDragEvent={(event) => console.log('🎯 Evento de Drag:', event)}
        onCameraEvent={(event) => console.log('📷 Evento de Câmera:', event)}
        onBoardEvent={(event) => console.log('🎮 Evento do Board:', event)}
        onPerformanceEvent={(event) => console.log('⚡ Evento de Performance:', event)}
        onError={(event) => console.error('❌ Erro:', event)}
        eventConfig={{
          enableEventLogging: true,
          performanceUpdateInterval: 2000,
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 1000,
          border: '2px solid #00ff00',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', color: '#00ff00' }}>🎮 Controles + Eventos Avançados</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#ffaa00' }}>⌨️ Teclado:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px' }}>
            <li><strong>WASD/Setas:</strong> Navegação</li>
            <li><strong>Shift + movimento:</strong> Rápido</li>
            <li><strong>+/-:</strong> Zoom</li>
            <li><strong>C/Space:</strong> Centralizar</li>
            <li><strong>R/0:</strong> Reset zoom</li>
          </ul>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#ffaa00' }}>📡 Sistema de Eventos:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px' }}>
            <li>Eventos agregados por categoria</li>
            <li>Performance monitoring ativo</li>
            <li>Logging automático ativado</li>
            <li>Tratamento de erros robusto</li>
          </ul>
        </div>

        <p style={{ margin: 0, fontSize: '10px', color: '#aaffaa' }}>
          ✨ Use o painel à direita + verifique o console para ver os eventos!
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '🎮 **Board com Controles + Eventos Avançados:** Sistema completo de navegação por teclado, bookmarks, teleporte suave, auto-seguimento e monitoramento de eventos em tempo real. ' +
          'Use WASD para navegar, +/- para zoom, C para centralizar. Eventos são logados no console por categoria.',
      },
    },
  },
};

/**
 * Board pequeno otimizado - 50x50 tiles com eventos de performance.
 */
export const SmallOptimized: Story = {
  args: {
    boardWidth: 50,
    boardHeight: 50,
    components: {
      controlsPanel: { enabled: false },
      realtimeDisplay: { enabled: true },
    },
  },
  render: ({ boardWidth, boardHeight, components }) => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <IsoBoardCanvas 
        boardWidth={boardWidth} 
        boardHeight={boardHeight}
        components={components}
        onPerformanceUpdate={(event) => {
          console.log('⚡ Performance Update:', {
            timestamp: event.timestamp,
            frameRate: event.frameRate,
            renderTime: event.renderTime,
            tileCount: event.tileCount,
            visibleTileCount: event.visibleTileCount,
            memoryUsage: event.memoryUsage,
            metrics: event.metrics,
          });
        }}
        onPerformanceWarning={(event) => {
          console.warn('⚠️ Performance Warning:', event);
        }}
        eventConfig={{
          enablePerformanceEvents: true,
          performanceUpdateInterval: 1000,
          performanceWarningThresholds: {
            minFps: 45,
            maxMemoryMB: 200,
            maxRenderTimeMs: 20,
            maxTileCount: 5000,
          },
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '250px',
          zIndex: 1000,
        }}
      >
        <h4 style={{ margin: '0 0 6px 0', color: '#00ff00' }}>🚀 Performance + Eventos</h4>
        <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px' }}>
          <li>✅ Viewport Culling</li>
          <li>✅ Spatial Indexing</li>
          <li>✅ Batch Rendering</li>
          <li>✅ Cache Inteligente</li>
          <li>✅ Performance Monitoring</li>
          <li>✅ Display em Tempo Real</li>
        </ul>
        <p style={{ margin: '6px 0 0 0', fontSize: '10px' }}>
          {(boardWidth * boardHeight).toLocaleString()} tiles com eventos de performance
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Board pequeno (50×50 = 2.500 tiles) com monitoramento de performance ativo e display em tempo real. ' +
          'Eventos de performance são emitidos a cada segundo com métricas detalhadas.',
      },
    },
  },
};

/**
 * Board médio com eventos completos - demonstração da combinação de otimizações e sistema de eventos.
 */
export const MediumWithEvents: Story = {
  args: {
    boardWidth: 100,
    boardHeight: 100,
    components: {
      controlsPanel: { enabled: true },
      realtimeDisplay: { enabled: true },
    },
  },
  render: ({ boardWidth, boardHeight, components }) => {
    const [eventCount, setEventCount] = React.useState(0);
    const [lastEvent, setLastEvent] = React.useState<string>('Nenhum evento ainda');
    
    const handleEvent = React.useCallback((event: any) => {
      setEventCount(prev => prev + 1);
      setLastEvent(`${event.type} - ${new Date().toLocaleTimeString()}`);
      console.log('📡 Evento capturado:', event);
    }, []);

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <IsoBoardCanvas 
          boardWidth={boardWidth} 
          boardHeight={boardHeight}
          components={components}
          onEvent={handleEvent}
          eventConfig={{
            enableEventLogging: true,
            enableTileEvents: true,
            enableDragEvents: true,
            enableCameraEvents: true,
            enableBoardEvents: true,
            enablePerformanceEvents: true,
            performanceUpdateInterval: 3000,
          }}
        />
        
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            maxWidth: '250px',
            zIndex: 1000,
          }}
        >
          <h4 style={{ margin: '0 0 6px 0', color: '#ffaa00' }}>📡 Monitor de Eventos</h4>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px' }}>
            <strong>{(boardWidth * boardHeight).toLocaleString()}</strong> tiles totais
          </p>
          <div style={{ marginBottom: '8px' }}>
            <strong>Eventos capturados:</strong> {eventCount}
          </div>
          <div style={{ fontSize: '10px', color: '#aaffaa' }}>
            <strong>Último:</strong> {lastEvent}
          </div>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: '14px', fontSize: '11px' }}>
            <li>🎯 Só renderiza ~200-300 visíveis</li>
            <li>🚀 Level of Detail automático</li>
            <li>💾 Cache inteligente ativo</li>
            <li>🔄 60 FPS garantidos</li>
            <li>📡 Todos os eventos monitoreados</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Board médio (100×100 = 10.000 tiles) combinando otimizações de performance com sistema de eventos completo. ' +
          'Monitor em tempo real exibe contagem de eventos e último evento capturado.',
      },
    },
  },
};

/**
 * Board gigantesco otimizado - 1000x1000 tiles (1 MILHÃO!) com sistema de eventos robusto.
 */
export const GigantOptimized: Story = {
  args: {
    boardWidth: 1000,
    boardHeight: 1000,
    components: {
      controlsPanel: { enabled: true },
      realtimeDisplay: { enabled: true },
    },
  },
  render: ({ boardWidth, boardHeight, components }) => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <IsoBoardCanvas 
        boardWidth={boardWidth} 
        boardHeight={boardHeight}
        components={components}
        onPerformanceEvent={(event) => {
          if (event.type === 'performance-warning') {
            console.warn('⚠️ Performance Warning em board gigantesco:', event);
          }
        }}
        onError={(event) => {
          console.error('❌ Erro em board gigantesco:', event);
        }}
        eventConfig={{
          enablePerformanceEvents: true,
          enableErrorEvents: true,
          performanceUpdateInterval: 5000,
          performanceWarningThresholds: {
            minFps: 30,
            maxMemoryMB: 1000,
            maxRenderTimeMs: 30,
            maxTileCount: 1000000,
          },
          throttleMs: {
            drag: 32, // Menos responsivo em boards gigantes
            camera: 32,
            performance: 5000,
          },
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '320px',
          zIndex: 1000,
          border: '2px solid #00ff00',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', color: '#00ff00' }}>🔥 BOARD GIGANTESCO + EVENTOS</h3>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>{boardWidth.toLocaleString()} × {boardHeight.toLocaleString()}</strong> tiles
          <br />
          <strong style={{ color: '#ffff00' }}>{(boardWidth * boardHeight).toLocaleString()}</strong> tiles totais!
        </p>
        
        <div style={{ fontSize: '12px' }}>
          <h4 style={{ margin: '8px 0 4px 0', color: '#ffaa00' }}>🚀 Otimizações Extremas:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>✅ Viewport Culling Ultra-Rápido</li>
            <li>✅ Spatial Index (chunks 64×64)</li>
            <li>✅ LOD com 5 níveis automáticos</li>
            <li>✅ Batch Rendering por cor</li>
            <li>✅ Cache viewport inteligente</li>
            <li>✅ Throttling de re-renderização</li>
          </ul>
          
          <h4 style={{ margin: '8px 0 4px 0', color: '#ffaa00' }}>📡 Sistema de Eventos:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>✅ Performance monitoring robusto</li>
            <li>✅ Throttling inteligente de eventos</li>
            <li>✅ Detecção de warnings automática</li>
            <li>✅ Error handling avançado</li>
          </ul>
          
          <h4 style={{ margin: '8px 0 4px 0', color: '#ffaa00' }}>📊 Performance:</h4>
          <p style={{ margin: 0, fontSize: '11px', color: '#aaffaa' }}>
            <strong>60 FPS sólidos</strong> renderizando apenas ~300-500 tiles visíveis
            <br />
            Eventos otimizados para boards extremos
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '🔥 **BOARD EXTREMO COM EVENTOS OTIMIZADOS:** 1000×1000 tiles (1 MILHÃO de tiles!) rodando a 60 FPS com sistema de eventos completo! ' +
          '\n\n' +
          '**Sistema Completo:**\n' +
          '- **Performance Ultra-Otimizada**: Renderiza 0.03-0.05% dos tiles (300-500 de 1 milhão)\n' +
          '- **Eventos Inteligentes**: Throttling automático, performance monitoring, error handling\n' +
          '- **Controles Profissionais**: Navegação por teclado, bookmarks, teleporte, auto-seguimento\n' +
          '- **Experiência Fluida**: 60 FPS consistentes mesmo com milhões de tiles\n' +
          '\n\n' +
          '**Performance Monitoring:**\n' +
          '1. 📊 Métricas de performance a cada 5 segundos\n' +
          '2. ⚠️ Warnings automáticos se performance degradar\n' +
          '3. 🚨 Error handling robusto para casos extremos\n' +
          '4. ⚡ Throttling inteligente de eventos de drag/camera',
      },
    },
  },
};

/**
 * Board ultra-gigante - teste de stress para 2000x2000 tiles (4 MILHÕES!) com eventos throttled.
 */
export const UltraGigantOptimized: Story = {
  args: {
    boardWidth: 2000,
    boardHeight: 2000,
    components: {
      controlsPanel: { enabled: true },
      realtimeDisplay: { enabled: false }, // Desabilitado para performance máxima
    },
  },
  render: ({ boardWidth, boardHeight, components }) => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <IsoBoardCanvas 
        boardWidth={boardWidth} 
        boardHeight={boardHeight}
        components={components}
        onPerformanceWarning={(event) => {
          console.warn('🚨 Performance Critical em board ultra-gigante:', event);
        }}
        onError={(event) => {
          console.error('💥 Erro crítico:', event);
        }}
        eventConfig={{
          enablePerformanceEvents: true,
          enableErrorEvents: true,
          enableTileEvents: false, // Desabilitado para performance máxima
          enableDragEvents: true,
          enableCameraEvents: false, // Reduzido para performance
          performanceUpdateInterval: 10000, // 10 segundos
          performanceWarningThresholds: {
            minFps: 20, // Mais tolerante
            maxMemoryMB: 2000,
            maxRenderTimeMs: 50,
            maxTileCount: 4000000,
          },
          throttleMs: {
            drag: 64, // Muito throttled
            camera: 64,
            performance: 10000,
          },
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          fontSize: '14px',
          maxWidth: '350px',
          zIndex: 1000,
          border: '3px solid #ff0000',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', color: '#ff3333' }}>💥 TESTE DE STRESS EXTREMO</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong style={{ color: '#ffff00' }}>{(boardWidth * boardHeight).toLocaleString()}</strong> tiles
          <br />
          <strong style={{ color: '#ff6666' }}>4 MILHÕES DE TILES!</strong>
        </p>
        
        <div style={{ fontSize: '12px' }}>
          <h4 style={{ margin: '8px 0 4px 0', color: '#ffaa00' }}>⚡ Otimizações Extremas:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>🔥 Performance máxima</li>
            <li>🎯 Eventos críticos apenas</li>
            <li>⚠️ Throttling agressivo</li>
            <li>🚨 Monitoring de emergência</li>
          </ul>
          
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#ffaaaa' }}>
            ⚠️ <strong>Nota:</strong> Este é um teste de stress extremo.
            <br />
            Sistema otimizado para manter estabilidade.
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '💥 **TESTE DE STRESS ULTRA-EXTREMO:** 2000×2000 tiles (4 MILHÕES de tiles!) ' +
          'com sistema de eventos otimizado para performance máxima. Eventos não-críticos são desabilitados, ' +
          'throttling agressivo ativo e monitoring de emergência para detectar problemas.',
      },
    },
  },
};
