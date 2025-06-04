/**
 * Implementação robusta do sistema de eventos para IsoBoardLib
 */

import type { 
  IsoBoardEvent, 
  IsoBoardEventEmitter, 
  EventListener, 
  EventConfiguration,
  TilePlacedEvent,
  TileRemovedEvent,
  TileSelectedEvent,
  TileDeselectedEvent,
  TileHoverEvent,
  TileClickEvent,
  TilePopupEvent,
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
  ErrorEvent
} from '../types/Events';

// Simplificar o mapeamento de listeners para evitar problemas de tipos
type SimpleEventListenerMap = {
  [K in IsoBoardEvent['type']]?: EventListener<IsoBoardEvent>[];
};

export class BoardEventEmitter implements IsoBoardEventEmitter {
  private listeners: SimpleEventListenerMap = {};
  private onceListeners = new Set<EventListener<IsoBoardEvent>>();
  private config: EventConfiguration = {};
  private throttledEvents = new Map<string, number>();
  
  constructor(config: EventConfiguration = {}) {
    this.config = {
      enableTileEvents: true,
      enableDragEvents: true,
      enableCameraEvents: true,
      enableBoardEvents: true,
      enableSelectionEvents: true,
      enablePerformanceEvents: true,
      enableErrorEvents: true,
      performanceUpdateInterval: 1000,
      performanceWarningThresholds: {
        minFps: 30,
        maxMemoryMB: 500,
        maxRenderTimeMs: 16,
        maxTileCount: 10000,
      },
      throttleMs: {
        drag: 16, // ~60fps
        camera: 16,
        performance: 1000,
      },
      enableEventLogging: false,
      eventLogFilter: [],
      ...config
    };
  }

  // ==================== MÉTODOS PRINCIPAIS ====================

  on<T extends IsoBoardEvent['type']>(
    eventType: T, 
    listener: EventListener<Extract<IsoBoardEvent, { type: T }>>
  ): void {
    if (!this.isEventEnabled(eventType)) return;
    
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    // Cast o listener para o tipo mais genérico que usamos internamente
    this.listeners[eventType]!.push(listener as EventListener<IsoBoardEvent>);
  }

  off<T extends IsoBoardEvent['type']>(
    eventType: T, 
    listener: EventListener<Extract<IsoBoardEvent, { type: T }>>
  ): void {
    const eventListeners = this.listeners[eventType];
    if (!eventListeners) return;
    
    const index = eventListeners.indexOf(listener as EventListener<IsoBoardEvent>);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
    
    if (eventListeners.length === 0) {
      delete this.listeners[eventType];
    }
  }

  once<T extends IsoBoardEvent['type']>(
    eventType: T, 
    listener: EventListener<Extract<IsoBoardEvent, { type: T }>>
  ): void {
    const onceWrapper = (event: IsoBoardEvent) => {
      // Verificar se o evento é do tipo correto antes de processar
      if (event.type === eventType) {
        this.off(eventType, onceWrapper as EventListener<Extract<IsoBoardEvent, { type: T }>>);
        this.onceListeners.delete(onceWrapper);
        (listener as EventListener<IsoBoardEvent>)(event);
      }
    };
    
    this.onceListeners.add(onceWrapper);
    this.on(eventType, onceWrapper as EventListener<Extract<IsoBoardEvent, { type: T }>>);
  }

  emit(event: IsoBoardEvent): void {
    if (!this.isEventEnabled(event.type)) return;
    
    // Throttling
    if (this.shouldThrottleEvent(event)) return;
    
    // Logging
    if (this.config.enableEventLogging && this.shouldLogEvent(event.type)) {
      console.log(`[IsoBoardEvent] ${event.type}:`, event);
    }
    
    const listeners = this.listeners[event.type];
    if (!listeners || listeners.length === 0) return;
    
    // Criar cópia dos listeners para evitar problemas se listeners forem removidos durante a emissão
    const listenersCopy = [...listeners];
    
    for (const listener of listenersCopy) {
      try {
        // Agora o cast é seguro porque sabemos que o evento tem o tipo correto
        listener(event);
      } catch (error) {
        console.error(`[IsoBoardEvent] Error in listener for ${event.type}:`, error);
        
        // Emitir evento de erro se não for já um evento de erro
        if (event.type !== 'error' && this.config.enableErrorEvents) {
          const errorEvent: ErrorEvent = {
            type: 'error',
            timestamp: Date.now(),
            error: error as Error,
            errorType: 'listener-error',
            severity: 'medium',
            recoverable: true,
            context: { originalEventType: event.type },
          };
          this.emit(errorEvent);
        }
      }
    }
  }

  // ==================== MÉTODOS UTILITÁRIOS ====================

  removeAllListeners(eventType?: IsoBoardEvent['type']): void {
    if (eventType) {
      delete this.listeners[eventType];
    } else {
      this.listeners = {};
      this.onceListeners.clear();
    }
  }

  listenerCount(eventType: IsoBoardEvent['type']): number {
    return this.listeners[eventType]?.length || 0;
  }

  getEventTypes(): IsoBoardEvent['type'][] {
    return Object.keys(this.listeners) as IsoBoardEvent['type'][];
  }

  // ==================== MÉTODOS DE CONVENIÊNCIA ====================

  onTileEvent(listener: EventListener<TilePlacedEvent | TileRemovedEvent | TileSelectedEvent | TileDeselectedEvent | TileHoverEvent | TileClickEvent | TilePopupEvent>): void {
    this.on('tile-placed', listener as EventListener<TilePlacedEvent>);
    this.on('tile-removed', listener as EventListener<TileRemovedEvent>);
    this.on('tile-selected', listener as EventListener<TileSelectedEvent>);
    this.on('tile-deselected', listener as EventListener<TileDeselectedEvent>);
    this.on('tile-hover-start', listener as EventListener<TileHoverEvent>);
    this.on('tile-hover-end', listener as EventListener<TileHoverEvent>);
    this.on('tile-click', listener as EventListener<TileClickEvent>);
    this.on('tile-double-click', listener as EventListener<TileClickEvent>);
    this.on('tile-right-click', listener as EventListener<TileClickEvent>);
    this.on('tile-popup-show', listener as EventListener<TilePopupEvent>);
    this.on('tile-popup-hide', listener as EventListener<TilePopupEvent>);
  }

  onDragEvent(listener: EventListener<DragStartEvent | DragMoveEvent | DragEndEvent>): void {
    this.on('drag-start', listener as EventListener<DragStartEvent>);
    this.on('drag-move', listener as EventListener<DragMoveEvent>);
    this.on('drag-end', listener as EventListener<DragEndEvent>);
  }

  onCameraEvent(listener: EventListener<CameraMoveEvent | CameraZoomEvent | CameraAnimationEvent>): void {
    this.on('camera-move-start', listener as EventListener<CameraMoveEvent>);
    this.on('camera-move', listener as EventListener<CameraMoveEvent>);
    this.on('camera-move-end', listener as EventListener<CameraMoveEvent>);
    this.on('camera-zoom-start', listener as EventListener<CameraZoomEvent>);
    this.on('camera-zoom', listener as EventListener<CameraZoomEvent>);
    this.on('camera-zoom-end', listener as EventListener<CameraZoomEvent>);
    this.on('camera-animation-start', listener as EventListener<CameraAnimationEvent>);
    this.on('camera-animation-update', listener as EventListener<CameraAnimationEvent>);
    this.on('camera-animation-end', listener as EventListener<CameraAnimationEvent>);
  }

  onBoardEvent(listener: EventListener<BoardInitializedEvent | BoardClearedEvent | BoardResizedEvent | BoardStateChangedEvent>): void {
    this.on('board-initialized', listener as EventListener<BoardInitializedEvent>);
    this.on('board-cleared', listener as EventListener<BoardClearedEvent>);
    this.on('board-resized', listener as EventListener<BoardResizedEvent>);
    this.on('board-state-changed', listener as EventListener<BoardStateChangedEvent>);
  }

  onSelectionEvent(listener: EventListener<SelectionChangedEvent | SelectionAreaEvent>): void {
    this.on('selection-changed', listener as EventListener<SelectionChangedEvent>);
    this.on('selection-area-start', listener as EventListener<SelectionAreaEvent>);
    this.on('selection-area-update', listener as EventListener<SelectionAreaEvent>);
    this.on('selection-area-end', listener as EventListener<SelectionAreaEvent>);
  }

  onPerformanceEvent(listener: EventListener<PerformanceEvent | PerformanceWarningEvent>): void {
    this.on('performance-update', listener as EventListener<PerformanceEvent>);
    this.on('performance-warning', listener as EventListener<PerformanceWarningEvent>);
  }

  onError(listener: EventListener<ErrorEvent>): void {
    this.on('error', listener);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private isEventEnabled(eventType: IsoBoardEvent['type']): boolean {
    if (eventType.startsWith('tile-')) return this.config.enableTileEvents !== false;
    if (eventType.startsWith('drag-')) return this.config.enableDragEvents !== false;
    if (eventType.startsWith('camera-')) return this.config.enableCameraEvents !== false;
    if (eventType.startsWith('board-')) return this.config.enableBoardEvents !== false;
    if (eventType.startsWith('selection-')) return this.config.enableSelectionEvents !== false;
    if (eventType.startsWith('performance-')) return this.config.enablePerformanceEvents !== false;
    if (eventType === 'error') return this.config.enableErrorEvents !== false;
    
    return true;
  }

  private shouldThrottleEvent(event: IsoBoardEvent): boolean {
    const throttleConfig = this.config.throttleMs;
    if (!throttleConfig) return false;
    
    let throttleMs: number | undefined;
    
    if (event.type.startsWith('drag-') && throttleConfig.drag) {
      throttleMs = throttleConfig.drag;
    } else if (event.type.startsWith('camera-') && throttleConfig.camera) {
      throttleMs = throttleConfig.camera;
    } else if (event.type.startsWith('performance-') && throttleConfig.performance) {
      throttleMs = throttleConfig.performance;
    }
    
    if (!throttleMs) return false;
    
    const key = event.type;
    const now = Date.now();
    const lastEmitted = this.throttledEvents.get(key) || 0;
    
    if (now - lastEmitted < throttleMs) {
      return true; // Throttle
    }
    
    this.throttledEvents.set(key, now);
    return false; // Don't throttle
  }

  private shouldLogEvent(eventType: IsoBoardEvent['type']): boolean {
    if (!this.config.eventLogFilter || this.config.eventLogFilter.length === 0) {
      return true;
    }
    
    return this.config.eventLogFilter.includes(eventType);
  }

  // ==================== MÉTODOS PÚBLICOS PARA CONFIGURAÇÃO ====================

  updateConfig(config: Partial<EventConfiguration>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): EventConfiguration {
    return { ...this.config };
  }

  // ==================== MÉTODOS UTILITÁRIOS PARA CRIAÇÃO DE EVENTOS ====================

  createEventContext(options: {
    boardPosition?: { x: number; y: number };
    screenPosition?: { x: number; y: number };
    modifiers?: {
      shift?: boolean;
      ctrl?: boolean;
      alt?: boolean;
      meta?: boolean;
    };
  } = {}) {
    return {
      timestamp: Date.now(),
      boardPosition: options.boardPosition,
      screenPosition: options.screenPosition,
      modifiers: {
        shift: false,
        ctrl: false,
        alt: false,
        meta: false,
        ...options.modifiers,
      },
    };
  }

  // Métodos de conveniência para emitir eventos comuns
  emitTilePlaced(data: Omit<TilePlacedEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'tile-placed',
      timestamp: Date.now(),
      ...data,
    });
  }

  emitTileRemoved(data: Omit<TileRemovedEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'tile-removed',
      timestamp: Date.now(),
      ...data,
    });
  }

  emitDragStart(data: Omit<DragStartEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'drag-start',
      timestamp: Date.now(),
      ...data,
    });
  }

  emitDragMove(data: Omit<DragMoveEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'drag-move',
      timestamp: Date.now(),
      ...data,
    });
  }

  emitDragEnd(data: Omit<DragEndEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'drag-end',
      timestamp: Date.now(),
      ...data,
    });
  }

  // 🔧 NOVOS: Métodos para eventos de proximidade e validação
  emitTileProximity(data: Omit<import('../types/Events').TileProximityEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: data.proximityType === 'adjacent' ? 'tile-proximity-detected' : 'tile-proximity-detected',
      timestamp: Date.now(),
      ...data,
    } as import('../types/Events').TileProximityEvent);
  }

  emitPositionValidationRequest(data: Omit<import('../types/Events').PositionValidationEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'position-validation-request',
      timestamp: Date.now(),
      ...data,
    } as import('../types/Events').PositionValidationEvent);
  }

  emitPositionValidationResponse(data: Omit<import('../types/Events').PositionValidationEvent, 'type' | 'timestamp'>): void {
    this.emit({
      type: 'position-validation-response',
      timestamp: Date.now(),
      ...data,
    } as import('../types/Events').PositionValidationEvent);
  }

  emitError(error: Error, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', context?: Record<string, any>): void {
    this.emit({
      type: 'error',
      timestamp: Date.now(),
      error,
      errorType: error.name || 'UnknownError',
      severity,
      recoverable: severity !== 'critical',
      context,
    });
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    this.removeAllListeners();
    this.throttledEvents.clear();
  }
}