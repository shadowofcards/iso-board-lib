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
  // Inventory
  inventory?: {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    width?: number;
    height?: number;
    maxItems?: number;
    enableSearch?: boolean;
    enableCategories?: boolean;
    showLabels?: boolean;
    style?: React.CSSProperties;
    className?: string;
  };
  
  // Controls Panel
  controlsPanel?: {
    enabled?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showPosition?: boolean;
    showZoom?: boolean;
    showBookmarks?: boolean;
    showTeleport?: boolean;
    style?: React.CSSProperties;
    className?: string;
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
    style?: React.CSSProperties;
    className?: string;
  };
  
  // Preview Overlay
  previewOverlay?: {
    enabled?: boolean;
    showGhost?: boolean;
    ghostOpacity?: number;
    showValidation?: boolean;
    validColor?: string;
    invalidColor?: string;
    style?: React.CSSProperties;
  };
  
  // Realtime Display
  realtimeDisplay?: {
    enabled?: boolean;
    updateInterval?: number;
    showFPS?: boolean;
    showTileCount?: boolean;
    showMemoryUsage?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
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