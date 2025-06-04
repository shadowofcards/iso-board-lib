/**
 * Sistema completo de eventos para IsoBoardLib
 * Permite escutar e reagir a todas as ações do board
 */

import type { TileData } from '../models/Tile';

// ==================== TIPOS BASE ====================

export interface BoardPosition {
  x: number;
  y: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface BoardTile {
  x: number;
  y: number;
  tile: TileData;
}

export interface EventContext {
  timestamp: number;
  boardPosition?: BoardPosition;
  screenPosition?: ScreenPosition;
  modifiers?: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

// ==================== EVENTOS DE TILE ====================

export interface TileEventData extends EventContext {
  tile: TileData;
  boardX: number;
  boardY: number;
}

export interface TilePlacedEvent extends TileEventData {
  type: 'tile-placed';
  previousTile?: TileData;
  isReplace: boolean;
}

export interface TileRemovedEvent extends TileEventData {
  type: 'tile-removed';
  reason: 'drag' | 'delete' | 'replace' | 'clear';
}

export interface TileSelectedEvent extends TileEventData {
  type: 'tile-selected';
  isMultiSelect: boolean;
  selectedTiles: BoardTile[];
}

export interface TileDeselectedEvent extends TileEventData {
  type: 'tile-deselected';
  remainingSelection: BoardTile[];
}

export interface TileHoverEvent extends TileEventData {
  type: 'tile-hover-start' | 'tile-hover-end';
  hoverDuration?: number;
}

export interface TileClickEvent extends TileEventData {
  type: 'tile-click' | 'tile-double-click' | 'tile-right-click';
  button: 'left' | 'right' | 'middle';
  clickCount: number;
}

// 🔧 NOVOS EVENTOS DE POPUP CUSTOMIZÁVEL
export interface TilePopupEvent extends TileEventData {
  type: 'tile-popup-show' | 'tile-popup-hide';
  popupType: 'hover' | 'click' | 'custom';
  screenPosition: ScreenPosition;
}

// ==================== EVENTOS DE DRAG & DROP ====================

export interface DragEventData extends EventContext {
  tile: TileData;
  startPosition: ScreenPosition;
  currentPosition: ScreenPosition;
  dragDistance: number;
}

export interface DragStartEvent extends DragEventData {
  type: 'drag-start';
  source: 'inventory' | 'board';
  sourceBoardPosition?: BoardPosition;
}

export interface DragMoveEvent extends DragEventData {
  type: 'drag-move';
  targetBoardPosition?: BoardPosition;
  isValidTarget: boolean;
  canPlace: boolean;
}

export interface DragEndEvent extends DragEventData {
  type: 'drag-end';
  success: boolean;
  targetBoardPosition?: BoardPosition;
  action: 'place' | 'replace' | 'cancel' | 'return';
}

// ==================== EVENTOS DE CÂMERA ====================

export interface CameraEventData extends EventContext {
  position: BoardPosition;
  zoom: number;
  viewport: {
    width: number;
    height: number;
  };
}

export interface CameraMoveEvent extends CameraEventData {
  type: 'camera-move-start' | 'camera-move' | 'camera-move-end';
  deltaX: number;
  deltaY: number;
  source: 'keyboard' | 'mouse' | 'touch' | 'api' | 'animation';
}

export interface CameraZoomEvent extends CameraEventData {
  type: 'camera-zoom-start' | 'camera-zoom' | 'camera-zoom-end';
  previousZoom: number;
  deltaZoom: number;
  source: 'wheel' | 'keyboard' | 'touch' | 'api' | 'animation';
  zoomCenter: ScreenPosition;
}

export interface CameraAnimationEvent extends CameraEventData {
  type: 'camera-animation-start' | 'camera-animation-update' | 'camera-animation-end';
  animationType: 'teleport' | 'center' | 'follow' | 'bookmark';
  duration: number;
  progress?: number; // 0-1 para update
}

// ==================== EVENTOS DE BOARD ====================

export interface BoardEventData extends EventContext {
  boardWidth: number;
  boardHeight: number;
  tileCount: number;
}

export interface BoardInitializedEvent extends BoardEventData {
  type: 'board-initialized';
  initialTiles: BoardTile[];
}

export interface BoardClearedEvent extends BoardEventData {
  type: 'board-cleared';
  clearedTiles: BoardTile[];
}

export interface BoardResizedEvent extends BoardEventData {
  type: 'board-resized';
  previousWidth: number;
  previousHeight: number;
  preservedTiles: BoardTile[];
  removedTiles: BoardTile[];
}

export interface BoardStateChangedEvent extends BoardEventData {
  type: 'board-state-changed';
  changes: Array<{
    type: 'add' | 'remove' | 'update';
    position: BoardPosition;
    tile?: TileData;
    previousTile?: TileData;
  }>;
}

// ==================== EVENTOS DE SELEÇÃO ====================

export interface SelectionEventData extends EventContext {
  selectedTiles: BoardTile[];
  selectionBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface SelectionChangedEvent extends SelectionEventData {
  type: 'selection-changed';
  addedTiles: BoardTile[];
  removedTiles: BoardTile[];
  action: 'select' | 'deselect' | 'clear' | 'toggle';
}

export interface SelectionAreaEvent extends SelectionEventData {
  type: 'selection-area-start' | 'selection-area-update' | 'selection-area-end';
  area: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
}

// ==================== EVENTOS DE PERFORMANCE ====================

export interface PerformanceEventData extends EventContext {
  frameRate: number;
  renderTime: number;
  tileCount: number;
  visibleTileCount: number;
  memoryUsage?: number;
}

export interface PerformanceEvent extends PerformanceEventData {
  type: 'performance-update';
  metrics: {
    fps: number;
    frameTime: number;
    renderCalls: number;
    spatialQueries: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export interface PerformanceWarningEvent extends PerformanceEventData {
  type: 'performance-warning';
  warningType: 'low-fps' | 'high-memory' | 'slow-render' | 'many-tiles';
  threshold: number;
  currentValue: number;
  suggestion: string;
}

// ==================== EVENTOS DE ERRO ====================

export interface ErrorEventData extends EventContext {
  error: Error;
  errorType: string;
  context?: Record<string, any>;
}

export interface ErrorEvent extends ErrorEventData {
  type: 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userMessage?: string;
}

// ==================== UNIÃO DE TODOS OS EVENTOS ====================

export type IsoBoardEvent = 
  // Tile events
  | TilePlacedEvent
  | TileRemovedEvent
  | TileSelectedEvent
  | TileDeselectedEvent
  | TileHoverEvent
  | TileClickEvent
  | TilePopupEvent
  
  // Drag events
  | DragStartEvent
  | DragMoveEvent
  | DragEndEvent
  
  // Camera events
  | CameraMoveEvent
  | CameraZoomEvent
  | CameraAnimationEvent
  
  // Board events
  | BoardInitializedEvent
  | BoardClearedEvent
  | BoardResizedEvent
  | BoardStateChangedEvent
  
  // Selection events
  | SelectionChangedEvent
  | SelectionAreaEvent
  
  // Performance events
  | PerformanceEvent
  | PerformanceWarningEvent
  
  // Error events
  | ErrorEvent;

// ==================== TIPOS DE EVENT LISTENERS ====================

export type EventListener<T extends IsoBoardEvent = IsoBoardEvent> = (event: T) => void;

export type EventListenerMap = {
  [K in IsoBoardEvent['type']]?: EventListener<Extract<IsoBoardEvent, { type: K }>>[];
};

// ==================== INTERFACE DO EVENT EMITTER ====================

export interface IsoBoardEventEmitter {
  // Métodos principais
  on<T extends IsoBoardEvent['type']>(
    eventType: T, 
    listener: EventListener<Extract<IsoBoardEvent, { type: T }>>
  ): void;
  
  off<T extends IsoBoardEvent['type']>(
    eventType: T, 
    listener: EventListener<Extract<IsoBoardEvent, { type: T }>>
  ): void;
  
  once<T extends IsoBoardEvent['type']>(
    eventType: T, 
    listener: EventListener<Extract<IsoBoardEvent, { type: T }>>
  ): void;
  
  emit<T extends IsoBoardEvent>(event: T): void;
  
  // Métodos utilitários
  removeAllListeners(eventType?: IsoBoardEvent['type']): void;
  listenerCount(eventType: IsoBoardEvent['type']): number;
  getEventTypes(): IsoBoardEvent['type'][];
  
  // Métodos de conveniência para grupos de eventos
  onTileEvent(listener: EventListener<TilePlacedEvent | TileRemovedEvent | TileSelectedEvent | TileDeselectedEvent | TileHoverEvent | TileClickEvent | TilePopupEvent>): void;
  onDragEvent(listener: EventListener<DragStartEvent | DragMoveEvent | DragEndEvent>): void;
  onCameraEvent(listener: EventListener<CameraMoveEvent | CameraZoomEvent | CameraAnimationEvent>): void;
  onBoardEvent(listener: EventListener<BoardInitializedEvent | BoardClearedEvent | BoardResizedEvent | BoardStateChangedEvent>): void;
  onSelectionEvent(listener: EventListener<SelectionChangedEvent | SelectionAreaEvent>): void;
  onPerformanceEvent(listener: EventListener<PerformanceEvent | PerformanceWarningEvent>): void;
  onError(listener: EventListener<ErrorEvent>): void;
}

// ==================== CONFIGURAÇÃO DE EVENTOS ====================

export interface EventConfiguration {
  // Habilitar/desabilitar grupos de eventos
  enableTileEvents?: boolean;
  enableDragEvents?: boolean;
  enableCameraEvents?: boolean;
  enableBoardEvents?: boolean;
  enableSelectionEvents?: boolean;
  enablePerformanceEvents?: boolean;
  enableErrorEvents?: boolean;
  
  // Configurações específicas
  performanceUpdateInterval?: number;
  performanceWarningThresholds?: {
    minFps?: number;
    maxMemoryMB?: number;
    maxRenderTimeMs?: number;
    maxTileCount?: number;
  };
  
  // Throttling de eventos
  throttleMs?: {
    drag?: number;
    camera?: number;
    performance?: number;
  };
  
  // Debugging
  enableEventLogging?: boolean;
  eventLogFilter?: IsoBoardEvent['type'][];
}

// ==================== PROPS PARA EVENTOS NO COMPONENTE ====================

export interface IsoBoardEventProps {
  // Event listeners individuais
  onTilePlaced?: EventListener<TilePlacedEvent>;
  onTileRemoved?: EventListener<TileRemovedEvent>;
  onTileSelected?: EventListener<TileSelectedEvent>;
  onTileDeselected?: EventListener<TileDeselectedEvent>;
  onTileHover?: EventListener<TileHoverEvent>;
  onTileClick?: EventListener<TileClickEvent>;
  onTilePopup?: EventListener<TilePopupEvent>;
  
  onDragStart?: EventListener<DragStartEvent>;
  onDragMove?: EventListener<DragMoveEvent>;
  onDragEnd?: EventListener<DragEndEvent>;
  
  onCameraMove?: EventListener<CameraMoveEvent>;
  onCameraZoom?: EventListener<CameraZoomEvent>;
  onCameraAnimation?: EventListener<CameraAnimationEvent>;
  
  onBoardInitialized?: EventListener<BoardInitializedEvent>;
  onBoardCleared?: EventListener<BoardClearedEvent>;
  onBoardResized?: EventListener<BoardResizedEvent>;
  onBoardStateChanged?: EventListener<BoardStateChangedEvent>;
  
  onSelectionChanged?: EventListener<SelectionChangedEvent>;
  onSelectionArea?: EventListener<SelectionAreaEvent>;
  
  onPerformanceUpdate?: EventListener<PerformanceEvent>;
  onPerformanceWarning?: EventListener<PerformanceWarningEvent>;
  
  onError?: EventListener<ErrorEvent>;
  
  // Event listeners de grupo
  onTileEvent?: EventListener<TilePlacedEvent | TileRemovedEvent | TileSelectedEvent | TileDeselectedEvent | TileHoverEvent | TileClickEvent | TilePopupEvent>;
  onDragEvent?: EventListener<DragStartEvent | DragMoveEvent | DragEndEvent>;
  onCameraEvent?: EventListener<CameraMoveEvent | CameraZoomEvent | CameraAnimationEvent>;
  onBoardEvent?: EventListener<BoardInitializedEvent | BoardClearedEvent | BoardResizedEvent | BoardStateChangedEvent>;
  onSelectionEvent?: EventListener<SelectionChangedEvent | SelectionAreaEvent>;
  onPerformanceEvent?: EventListener<PerformanceEvent | PerformanceWarningEvent>;
  
  // Listener geral
  onEvent?: EventListener<IsoBoardEvent>;
  
  // Configuração de eventos
  eventConfig?: EventConfiguration;
} 