/**
 * Tipos centralizados para configuração da biblioteca IsoBoardLib
 * Permite configuração completa de todos os aspectos do sistema
 */

import type { TileData } from '../models/Tile';

// ==================== CONFIGURAÇÕES PRINCIPAIS ====================

export interface IsoBoardConfiguration {
  // Configurações do board
  board: BoardConfiguration;
  
  // Configurações de renderização
  rendering: RenderingConfiguration;
  
  // Configurações de câmera
  camera: CameraConfiguration;
  
  // Configurações de interação
  interaction: InteractionConfiguration;
  
  // Configurações de performance
  performance: PerformanceConfiguration;
  
  // Configurações visuais
  visual: VisualConfiguration;
}

// ==================== BOARD ====================

export interface BoardConfiguration {
  width: number;
  height: number;
  tileSize?: number;
  tileHeight?: number;
  initialTiles?: Array<{ x: number; y: number; tile: TileData }>;
  enableValidation?: boolean;
  maxTiles?: number;
}

// ==================== RENDERIZAÇÃO ====================

export interface RenderingConfiguration {
  enablePixelArt?: boolean;
  enableAntialias?: boolean;
  backgroundColor?: string | number;
  enableTransparency?: boolean;
  enableWebGL?: boolean;
  autoResize?: boolean;
  preserveDrawingBuffer?: boolean;
}

// ==================== CÂMERA ====================

export interface CameraConfiguration {
  initialPosition?: { x: number; y: number };
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  zoomScrollFactor?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  enableKeyboardControls?: boolean;
  keyboardPanSpeed?: number;
  keyboardPanSpeedFast?: number;
  panBounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  animationDuration?: number;
  smoothFollow?: boolean;
  smoothFollowFactor?: number;
}

// ==================== INTERAÇÃO ====================

export interface InteractionConfiguration {
  enableDragAndDrop?: boolean;
  enableTileSelection?: boolean;
  enableMultiSelection?: boolean;
  enableRightClick?: boolean;
  enableDoubleClick?: boolean;
  enableHover?: boolean;
  enableTouch?: boolean;
  dragThreshold?: number;
  hoverDelay?: number;
  clickThreshold?: number;
  preventContextMenu?: boolean;
}

// ==================== PERFORMANCE ====================

export interface PerformanceConfiguration {
  chunkSize?: number;
  cullingThreshold?: number;
  rerenderThrottleMs?: number;
  maxQuadsPerBatch?: number;
  enableViewportCulling?: boolean;
  enableSpatialIndex?: boolean;
  maxVisibleTiles?: number;
  levelOfDetailEnabled?: boolean;
  
  // 🔧 NOVO: Configurações de otimização de eventos
  eventOptimization?: EventOptimizationConfiguration;
}

// ==================== OTIMIZAÇÃO DE EVENTOS ====================

export interface EventOptimizationConfiguration {
  // Throttling de eventos (em ms)
  throttling?: {
    // Eventos de drag & drop
    dragMove?: number;           // Padrão: 100ms - Frequência de drag-move events
    dragHover?: number;          // Padrão: 150ms - Frequência de hover durante drag
    dragValidation?: number;     // Padrão: 50ms - Frequência de validação de posição
    
    // Eventos de tile
    tileHover?: number;          // Padrão: 150ms - Frequência de tile hover events
    tileSelection?: number;      // Padrão: 100ms - Frequência de seleção múltipla
    
    // Eventos de câmera
    cameraMove?: number;         // Padrão: 50ms - Frequência de camera-move events
    cameraZoom?: number;         // Padrão: 100ms - Frequência de camera-zoom events
    
    // Eventos de performance
    performanceUpdate?: number;  // Padrão: 1000ms - Frequência de performance updates
    performanceWarning?: number; // Padrão: 5000ms - Frequência de performance warnings
    
    // Eventos de board
    boardStateChange?: number;   // Padrão: 200ms - Frequência de board state changes
    visibleTilesUpdate?: number; // Padrão: 100ms - Frequência de visible tiles updates
  };
  
  // Debouncing de eventos (em ms)
  debouncing?: {
    boardResize?: number;        // Padrão: 300ms - Debounce de resize events
    configChange?: number;       // Padrão: 500ms - Debounce de config changes
    themeChange?: number;        // Padrão: 200ms - Debounce de theme changes
    selectionArea?: number;      // Padrão: 100ms - Debounce de selection area
  };
  
  // Batching de eventos
  batching?: {
    enableBatching?: boolean;    // Padrão: true - Habilitar batching de eventos
    batchSize?: number;          // Padrão: 10 - Máximo de eventos por batch
    batchInterval?: number;      // Padrão: 16ms (~60fps) - Intervalo entre batches
    batchableEvents?: string[];  // Eventos que podem ser batcheados
  };
  
  // Filtros de eventos
  filtering?: {
    enablePositionFilter?: boolean;     // Padrão: true - Filtrar eventos por mudança de posição
    positionThreshold?: number;         // Padrão: 1.0 - Threshold mínimo para mudança de posição
    enableDuplicateFilter?: boolean;    // Padrão: true - Filtrar eventos duplicados
    duplicateTimeWindow?: number;       // Padrão: 50ms - Janela de tempo para detectar duplicatas
    enableValidationFilter?: boolean;   // Padrão: true - Filtrar eventos de posições inválidas
  };
  
  // Prioridades de eventos
  priorities?: {
    high?: string[];    // Eventos de alta prioridade (nunca throttled)
    medium?: string[];  // Eventos de média prioridade (throttling normal)
    low?: string[];     // Eventos de baixa prioridade (throttling agressivo)
  };
  
  // Debug e monitoramento
  monitoring?: {
    enableEventMetrics?: boolean;      // Padrão: false - Coletar métricas de eventos
    enableThrottleLogging?: boolean;   // Padrão: false - Log de eventos throttled
    enablePerformanceAlerts?: boolean; // Padrão: true - Alertas de performance
    maxEventQueueSize?: number;        // Padrão: 1000 - Tamanho máximo da fila de eventos
    alertThresholds?: {
      eventsPerSecond?: number;        // Padrão: 500 - Threshold de eventos/segundo
      queueSize?: number;              // Padrão: 100 - Threshold de tamanho da fila
      memoryUsage?: number;            // Padrão: 50MB - Threshold de uso de memória
    };
  };
  
  // Configurações avançadas
  advanced?: {
    enableEventPooling?: boolean;      // Padrão: true - Pool de objetos de evento
    poolSize?: number;                 // Padrão: 100 - Tamanho do pool
    enableLazyEvaluation?: boolean;    // Padrão: true - Avaliação lazy de eventos
    enableEventCompression?: boolean;  // Padrão: false - Compressão de eventos similares
    compressionWindow?: number;        // Padrão: 100ms - Janela para compressão
  };
}

// ==================== VISUAL ====================

export interface VisualConfiguration {
  // Grid
  showGrid?: boolean;
  gridColor?: string | number;
  gridOpacity?: number;
  gridLineWidth?: number;
  
  // Tiles
  tileOutlineColor?: string | number;
  tileOutlineWidth?: number;
  enableTileAnimations?: boolean;
  tileAnimationDuration?: number;
  
  // Shadows
  enableShadows?: boolean;
  shadowColor?: string | number;
  shadowOpacity?: number;
  shadowOffset?: { x: number; y: number };
  
  // Selection
  selectionColor?: string | number;
  selectionWidth?: number;
  selectionStyle?: 'solid' | 'dashed' | 'dotted';
  
  // Hover effects
  hoverColor?: string | number;
  hoverOpacity?: number;
  enableHoverGlow?: boolean;
}

// ==================== TEMAS ====================

export interface IsoBoardTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// ==================== CONFIGURAÇÕES DE COMPONENTE ====================

export interface ComponentConfiguration {
  // Layout Configuration
  layout?: {
    enabled?: boolean;
    theme?: 'auto' | 'light' | 'dark';
    spacing?: number;
    zIndexBase?: number;
    enableDragging?: boolean;
    enableResizing?: boolean;
    enableCollapsing?: boolean;
    conflictResolution?: 'priority' | 'timestamp' | 'manual';
  };

  // Inventory Panel
  inventory?: {
    enabled?: boolean;
    position?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'floating' | 'docked-left' | 'docked-right' | 'docked-bottom';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'custom';
    
    // Inventory-specific features
    searchEnabled?: boolean;
    categoriesEnabled?: boolean;
    showLabels?: boolean;
    tilesPerRow?: number;
    tileSize?: 'sm' | 'md' | 'lg';
    sortBy?: 'name' | 'type' | 'recent';
    maxItems?: number;
    viewMode?: 'grid' | 'list';
    
    // Panel configuration
    collapsible?: boolean;
    draggable?: boolean;
    priority?: 'high' | 'medium' | 'low';
    title?: string;
    icon?: string;
    variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
    
    // Custom styling
    style?: React.CSSProperties;
    className?: string;
    customSize?: { width: number; height: number };
    customPosition?: { x: number; y: number };
  };
  
  // Controls Panel
  controlsPanel?: {
    enabled?: boolean;
    position?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'floating' | 'docked-left' | 'docked-right' | 'docked-bottom';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'custom';
    
    // Controls-specific features
    showBasicControls?: boolean;
    showTeleport?: boolean;
    showBookmarks?: boolean;
    showFollowControls?: boolean;
    enableAdvancedFeatures?: boolean;
    
    // Panel configuration
    collapsible?: boolean;
    draggable?: boolean;
    priority?: 'high' | 'medium' | 'low';
    title?: string;
    icon?: string;
    variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
    
    // Custom styling
    style?: React.CSSProperties;
    className?: string;
    customSize?: { width: number; height: number };
    customPosition?: { x: number; y: number };
  };
  
  // Tile Info Popup
  tileInfoPopup?: {
    enabled?: boolean;
    showOnHover?: boolean;
    showOnRightClick?: boolean;
    hoverDelay?: number;
    maxWidth?: number;
    showProperties?: boolean;
    showDescription?: boolean;
    
    // Popup positioning
    position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset?: { x: number; y: number };
    
    // Custom styling
    style?: React.CSSProperties;
    className?: string;
    variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
  };
  
  // Preview Overlay
  previewOverlay?: {
    enabled?: boolean;
    showGhost?: boolean;
    ghostOpacity?: number;
    showValidation?: boolean;
    validColor?: string;
    invalidColor?: string;
    showLabel?: boolean;
    followCursor?: boolean;
    offset?: { x: number; y: number };
    
    // Custom styling
    style?: React.CSSProperties;
    variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
  };
  
  // Realtime Display Panel
  realtimeDisplay?: {
    enabled?: boolean;
    position?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'floating' | 'docked-left' | 'docked-right' | 'docked-bottom';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'custom';
    
    // Realtime-specific features
    updateInterval?: number;
    showFPS?: boolean;
    showTileCount?: boolean;
    showMemoryUsage?: boolean;
    showVisibleTiles?: boolean;
    maxEntries?: number;
    autoRefresh?: boolean;
    
    // Panel configuration
    collapsible?: boolean;
    draggable?: boolean;
    priority?: 'high' | 'medium' | 'low';
    title?: string;
    icon?: string;
    variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
    
    // Custom styling
    style?: React.CSSProperties;
    className?: string;
    customSize?: { width: number; height: number };
    customPosition?: { x: number; y: number };
  };

  // Drag Feedback Overlay
  dragFeedback?: {
    enabled?: boolean;
    showAnimations?: boolean;
    feedbackSize?: 'small' | 'medium' | 'large';
    opacity?: number;
    showBenefits?: boolean;
    showPenalties?: boolean;
    showSuggestions?: boolean;
    maxSuggestions?: number;
    
    // Custom styling
    style?: React.CSSProperties;
    variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
  };

  // Custom Panels - Permite extensibilidade total
  customPanels?: {
    [panelId: string]: {
      enabled?: boolean;
      position?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'floating' | 'docked-left' | 'docked-right' | 'docked-bottom';
      size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'custom';
      collapsible?: boolean;
      draggable?: boolean;
      resizable?: boolean;
      priority?: 'high' | 'medium' | 'low';
      title?: string;
      subtitle?: string;
      icon?: string;
      variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
      
      // Styling
      style?: React.CSSProperties;
      className?: string;
      customSize?: { width: number; height: number };
      customPosition?: { x: number; y: number };
      
      // Custom component
      component?: React.ComponentType<any>;
      props?: Record<string, any>;
    };
  };

  // Global Panel Settings
  globalSettings?: {
    enableAnimations?: boolean;
    animationDuration?: number;
    borderRadius?: number;
    shadows?: boolean;
    backdropBlur?: boolean;
    fontSize?: 'xs' | 'sm' | 'md' | 'lg';
    spacing?: 'compact' | 'normal' | 'relaxed';
    theme?: 'auto' | 'light' | 'dark';
  };
}

// ==================== CONFIGURAÇÃO COMPLETA ====================

export interface CompleteIsoBoardConfiguration 
  extends Partial<IsoBoardConfiguration> {
  theme?: IsoBoardTheme;
  components?: ComponentConfiguration;
}

// ==================== PRESETS ====================

export const DEFAULT_CONFIG: IsoBoardConfiguration = {
  board: {
    width: 20,
    height: 20,
    tileSize: 128,
    tileHeight: 64,
    enableValidation: true,
  },
  rendering: {
    enablePixelArt: true,
    enableAntialias: false,
    backgroundColor: '#023047',
    enableTransparency: true,
    enableWebGL: true,
    autoResize: true,
  },
  camera: {
    initialPosition: { x: 0, y: 0 },
    initialZoom: 1.0,
    minZoom: 0.3,
    maxZoom: 4.0,
    zoomStep: 0.1,
    zoomScrollFactor: 0.0007,
    enablePan: true,
    enableZoom: true,
    enableKeyboardControls: true,
    keyboardPanSpeed: 8,
    keyboardPanSpeedFast: 16,
    animationDuration: 300,
    smoothFollow: true,
    smoothFollowFactor: 0.08,
  },
  interaction: {
    enableDragAndDrop: true,
    enableTileSelection: true,
    enableMultiSelection: false,
    enableRightClick: true,
    enableDoubleClick: true,
    enableHover: true,
    enableTouch: true,
    dragThreshold: 5,
    hoverDelay: 300,
    clickThreshold: 200,
    preventContextMenu: true,
  },
  performance: {
    chunkSize: 64,
    cullingThreshold: 900,
    rerenderThrottleMs: 35,
    maxQuadsPerBatch: 1500,
    enableViewportCulling: true,
    enableSpatialIndex: true,
    maxVisibleTiles: 10000,
    levelOfDetailEnabled: true,
    
    // 🔧 NOVO: Configurações padrão de otimização de eventos
    eventOptimization: {
      throttling: {
        // Eventos de drag & drop
        dragMove: 100,           // 100ms - Frequência de drag-move events
        dragHover: 150,          // 150ms - Frequência de hover durante drag
        dragValidation: 50,      // 50ms - Frequência de validação de posição
        
        // Eventos de tile
        tileHover: 150,          // 150ms - Frequência de tile hover events
        tileSelection: 100,      // 100ms - Frequência de seleção múltipla
        
        // Eventos de câmera
        cameraMove: 50,          // 50ms - Frequência de camera-move events
        cameraZoom: 100,         // 100ms - Frequência de camera-zoom events
        
        // Eventos de performance
        performanceUpdate: 1000, // 1000ms - Frequência de performance updates
        performanceWarning: 5000, // 5000ms - Frequência de performance warnings
        
        // Eventos de board
        boardStateChange: 200,   // 200ms - Frequência de board state changes
        visibleTilesUpdate: 100, // 100ms - Frequência de visible tiles updates
      },
      
      debouncing: {
        boardResize: 300,        // 300ms - Debounce de resize events
        configChange: 500,       // 500ms - Debounce de config changes
        themeChange: 200,        // 200ms - Debounce de theme changes
        selectionArea: 100,      // 100ms - Debounce de selection area
      },
      
      batching: {
        enableBatching: true,    // Habilitar batching de eventos
        batchSize: 10,           // Máximo de eventos por batch
        batchInterval: 16,       // 16ms (~60fps) - Intervalo entre batches
        batchableEvents: [
          'drag-move',
          'camera-move',
          'tile-hover',
          'performance-update',
          'visible-tiles-update'
        ],
      },
      
      filtering: {
        enablePositionFilter: true,     // Filtrar eventos por mudança de posição
        positionThreshold: 1.0,         // Threshold mínimo para mudança de posição
        enableDuplicateFilter: true,    // Filtrar eventos duplicados
        duplicateTimeWindow: 50,        // 50ms - Janela de tempo para detectar duplicatas
        enableValidationFilter: true,   // Filtrar eventos de posições inválidas
      },
      
      priorities: {
        high: [
          'error',
          'tile-placed',
          'tile-removed',
          'drag-start',
          'drag-end',
          'board-initialized'
        ],
        medium: [
          'tile-selected',
          'tile-deselected',
          'camera-zoom',
          'board-state-changed'
        ],
        low: [
          'drag-move',
          'tile-hover',
          'camera-move',
          'performance-update'
        ],
      },
      
      monitoring: {
        enableEventMetrics: false,      // Coletar métricas de eventos
        enableThrottleLogging: false,   // Log de eventos throttled (apenas em dev)
        enablePerformanceAlerts: true,  // Alertas de performance
        maxEventQueueSize: 1000,        // Tamanho máximo da fila de eventos
        alertThresholds: {
          eventsPerSecond: 500,         // Threshold de eventos/segundo
          queueSize: 100,               // Threshold de tamanho da fila
          memoryUsage: 50,              // 50MB - Threshold de uso de memória
        },
      },
      
      advanced: {
        enableEventPooling: true,       // Pool de objetos de evento
        poolSize: 100,                  // Tamanho do pool
        enableLazyEvaluation: true,     // Avaliação lazy de eventos
        enableEventCompression: false,  // Compressão de eventos similares
        compressionWindow: 100,         // 100ms - Janela para compressão
      },
    },
  },
  visual: {
    showGrid: false,
    gridColor: 0x444444,
    gridOpacity: 0.3,
    gridLineWidth: 1,
    tileOutlineColor: 0xffffff,
    tileOutlineWidth: 1,
    enableTileAnimations: true,
    tileAnimationDuration: 200,
    enableShadows: false,
    shadowColor: 0x000000,
    shadowOpacity: 0.3,
    shadowOffset: { x: 2, y: 2 },
    selectionColor: 0xff6b35,
    selectionWidth: 2,
    selectionStyle: 'solid',
    hoverColor: 0xffffff,
    hoverOpacity: 0.2,
    enableHoverGlow: true,
  },
};

export const THEMES = {
  DEFAULT: {
    name: 'Default',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#023047',
      surface: 'rgba(0, 0, 0, 0.8)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.2)',
      accent: '#ff6b35',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 12 },
    shadows: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
      md: '0 4px 8px rgba(0, 0, 0, 0.2)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.3)',
    },
  } as IsoBoardTheme,
  
  DARK: {
    name: 'Dark',
    colors: {
      primary: '#bb86fc',
      secondary: '#03dac6',
      background: '#121212',
      surface: 'rgba(18, 18, 18, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.12)',
      accent: '#cf6679',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 12 },
    shadows: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
      md: '0 4px 8px rgba(0, 0, 0, 0.4)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
    },
  } as IsoBoardTheme,
  
  LIGHT: {
    name: 'Light',
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      background: '#f5f5f5',
      surface: 'rgba(255, 255, 255, 0.9)',
      text: '#212121',
      textSecondary: 'rgba(0, 0, 0, 0.6)',
      border: 'rgba(0, 0, 0, 0.12)',
      accent: '#ff5722',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 12 },
    shadows: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
      md: '0 4px 8px rgba(0, 0, 0, 0.15)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    },
  } as IsoBoardTheme,
}; 