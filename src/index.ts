/**
 * Pontos de entrada público da biblioteca.
 * Exportamos apenas componentes React principais, hooks e tipos públicos.
 */

export { 
  IsoBoardCanvas,
  type IsoBoardCanvasProps,
  type IsoBoardCanvasAPI
} from './components/IsoBoardCanvas';
export { IsoTileInventory } from './components/IsoTileInventory';
export { PreviewOverlay } from './components/PreviewOverlay';
export { CameraHandler } from './components/CameraHandler';
export { TileInteractionLayer } from './components/TileInteractionLayer';
export { TileInfoPopup } from './components/TileInfoPopup';
export { BoardControlsPanel } from './components/BoardControlsPanel';

export { BoardStateManager } from './core/engine/BoardStateManager';
export { DragController, type DragState } from './core/engine/DragController';

// ==================== SISTEMA DE EVENTOS ====================
export { BoardEventEmitter } from './core/engine/EventEmitter';

export { Camera as CameraModel } from './core/models/Camera';
export type { TileData } from './core/models/Tile';

export type {
  // Tipos principais de eventos
  IsoBoardEvent,
  IsoBoardEventEmitter,
  EventListener,
  EventConfiguration,
  IsoBoardEventProps,
  
  // Tipos de posição
  BoardPosition,
  ScreenPosition,
  BoardTile,
  EventContext,
  
  // Eventos específicos
  TilePlacedEvent,
  TileRemovedEvent,
  TileSelectedEvent,
  TileDeselectedEvent,
  TileHoverEvent,
  TileClickEvent,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  CameraMoveEvent,
  CameraZoomEvent,
  CameraAnimationEvent,
  BoardInitializedEvent,
  BoardClearedEvent,
  BoardResizedEvent,
  BoardStateChangedEvent,
  SelectionChangedEvent,
  SelectionAreaEvent,
  PerformanceEvent,
  PerformanceWarningEvent,
  ErrorEvent,
} from './core/types/Events';

// ==================== SISTEMA DE CONFIGURAÇÃO ====================
export type {
  // Configurações principais
  IsoBoardConfiguration,
  CompleteIsoBoardConfiguration,
  BoardConfiguration,
  RenderingConfiguration,
  CameraConfiguration,
  InteractionConfiguration,
  PerformanceConfiguration,
  VisualConfiguration,
  ComponentConfiguration,
  
  // Temas
  IsoBoardTheme,
} from './core/types/Configuration';

export { 
  DEFAULT_CONFIG,
  THEMES 
} from './core/types/Configuration';

// Novas funcionalidades de otimização
export { SpatialIndex, type TileEntry, type SpatialQuery } from './core/math/spatialIndex';
export { 
  calculateVisibleTileRange, 
  calculateLevelOfDetail, 
  shouldRenderGrid, 
  shouldRenderDecorations,
  getGridSamplingRate,
  type VisibleTileRange,
  type ViewportBounds
} from './core/math/viewportCulling';

export { useBoardController } from './hooks/useBoardController';
export { useDragTile } from './hooks/useDragTile';
export { 
  useAdvancedBoardControls, 
  type Point2D, 
  type BookmarkData, 
  type AdvancedControlsConfig 
} from './hooks/useAdvancedBoardControls';

// Configurações centralizadas
export * from './core/config';

// ==================== CONSTANTES E UTILITÁRIOS ====================
export { AVAILABLE_TILES } from './core/constants';
