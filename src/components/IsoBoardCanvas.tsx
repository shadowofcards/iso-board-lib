import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Phaser from 'phaser';
import IsoScene from './scenes/IsoScene';
import IsoTileInventory from './IsoTileInventory';
import CameraHandler from './CameraHandler';
import PreviewOverlay from './PreviewOverlay';
import TileInfoPopup from './TileInfoPopup';
import RealtimeTileDisplay from './RealtimeTileDisplay';
import BoardControlsPanel from './BoardControlsPanel';
import { useBoardController } from '../hooks/useBoardController';
import { useDragTile } from '../hooks/useDragTile';
import { BoardEventEmitter } from '../core/engine/EventEmitter';
import type { TileData } from '../core/models/Tile';
import type { 
  CompleteIsoBoardConfiguration,
  IsoBoardTheme,
  ComponentConfiguration 
} from '../core/types/Configuration';
import type { IsoBoardEventProps } from '../core/types/Events';
import { DEFAULT_CONFIG, THEMES } from '../core/types/Configuration';
import { AVAILABLE_TILES } from '../core/constants';
import { __DEV__ } from '../core/config';

// ==================== INTERFACE COMPLETA ====================

export interface IsoBoardCanvasProps extends IsoBoardEventProps {
  // Configurações básicas (obrigatórias)
  boardWidth: number;
  boardHeight: number;
  
  // Configurações avançadas (opcionais)
  config?: Partial<CompleteIsoBoardConfiguration>;
  theme?: IsoBoardTheme | keyof typeof THEMES;
  
  // Tiles disponíveis
  availableTiles?: TileData[];
  
  // Controle de componentes
  components?: ComponentConfiguration;
  
  // Props de container
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  canvasProps?: React.HTMLAttributes<HTMLDivElement>;
  
  // Callbacks de estado
  onReady?: () => void;
  onConfigChange?: (config: CompleteIsoBoardConfiguration) => void;
  onThemeChange?: (theme: IsoBoardTheme) => void;
  
  // Ref para acesso à API
  ref?: React.Ref<IsoBoardCanvasAPI>;
}

// ==================== API PÚBLICA ====================

export interface IsoBoardCanvasAPI {
  // Controle do board
  placeTile: (x: number, y: number, tile: TileData) => boolean;
  removeTile: (x: number, y: number) => boolean;
  getTileAt: (x: number, y: number) => TileData | undefined;
  clearBoard: () => void;
  
  // Controle da câmera
  centerCamera: () => void;
  setCameraPosition: (x: number, y: number, animated?: boolean) => void;
  setCameraZoom: (zoom: number, animated?: boolean) => void;
  getCameraPosition: () => { x: number; y: number };
  getCameraZoom: () => number;
  
  // Configuração dinâmica
  updateConfig: (config: Partial<CompleteIsoBoardConfiguration>) => void;
  getConfig: () => CompleteIsoBoardConfiguration;
  setTheme: (theme: IsoBoardTheme | keyof typeof THEMES) => void;
  getTheme: () => IsoBoardTheme;
  
  // Eventos
  addEventListener: <T extends keyof IsoBoardEventProps>(
    event: T, 
    listener: NonNullable<IsoBoardEventProps[T]>
  ) => void;
  removeEventListener: <T extends keyof IsoBoardEventProps>(
    event: T, 
    listener: NonNullable<IsoBoardEventProps[T]>
  ) => void;
  
  // Performance
  getPerformanceMetrics: () => {
    fps: number;
    tileCount: number;
    visibleTileCount: number;
    memoryUsage: number;
  };
  
  // Utilitários
  exportBoardState: () => Array<{ x: number; y: number; tile: TileData }>;
  importBoardState: (tiles: Array<{ x: number; y: number; tile: TileData }>) => void;
  captureScreenshot: (width?: number, height?: number) => string; // base64
}

// ==================== COMPONENTE PRINCIPAL ====================

export const IsoBoardCanvas = React.forwardRef<IsoBoardCanvasAPI, IsoBoardCanvasProps>(
  ({
  boardWidth,
  boardHeight,
    config: userConfig = {},
    theme: userTheme = 'DEFAULT',
    availableTiles = AVAILABLE_TILES,
    components = {},
  width = '100%',
  height = '100%',
    className = '',
    style = {},
    canvasProps = {},
    onReady,
    onConfigChange,
    onThemeChange,
    // Event props - todas usadas no EVENT EMITTER SETUP
    onTilePlaced,
    onTileRemoved,
    onTileSelected,
    onTileDeselected,
    onTileHover,
    onTileClick,
    onDragStart,
    onDragMove,
    onDragEnd,
    onCameraMove,
    onCameraZoom,
    onCameraAnimation,
    onBoardInitialized,
    onBoardCleared,
    onBoardResized,
    onBoardStateChanged,
    onSelectionChanged,
    onSelectionArea,
    onPerformanceUpdate,
    onPerformanceWarning,
    onError,
    onTileEvent,
    onDragEvent,
    onCameraEvent,
    onBoardEvent,
    onSelectionEvent,
    onPerformanceEvent,
    onEvent,
    eventConfig,
  }, ref) => {
    
    // ==================== ESTADO E REFS ====================
    
    const containerRef = useRef<HTMLDivElement>(null!);
    const mainContainerRef = useRef<HTMLDivElement>(null!);
    const phaserGameRef = useRef<Phaser.Game | null>(null);
    const apiRef = useRef<IsoBoardCanvasAPI | null>(null);
    const eventEmitterRef = useRef<BoardEventEmitter | null>(null);
    
    // 🔧 CORREÇÃO: Controle de eventos para evitar duplicatas e excesso
    const dragEventStateRef = useRef({
      isDragStartEmitted: false,
      lastValidPosition: null as { x: number; y: number } | null,
      lastMoveEmitTime: 0,
      dragSource: null as 'inventory' | 'board' | null,
    });
    
    const eventThrottleRef = useRef({
      dragMove: 0,
      tileHover: 0,
    });
    
    // ==================== CONFIGURAÇÃO DINÂMICA ====================
    
    // Estado para configuração combinada
    const [currentConfig, setCurrentConfig] = useState<CompleteIsoBoardConfiguration>(() => {
      const config = {
        ...DEFAULT_CONFIG,
        board: {
          ...DEFAULT_CONFIG.board,
          width: boardWidth,
          height: boardHeight,
        },
        ...userConfig,
      };
      
      // Garantir que board sempre existe
      if (!config.board) {
        config.board = {
          width: boardWidth,
          height: boardHeight,
          tileSize: 128,
          tileHeight: 64,
          enableValidation: true,
        };
      }
      
      return config;
    });
    
    // Estado para tema atual
    const [currentTheme, setCurrentTheme] = useState<IsoBoardTheme>(() => {
      if (typeof userTheme === 'string') {
        return THEMES[userTheme] || THEMES.DEFAULT;
      }
      return userTheme;
    });
    
    // 🔧 CORREÇÃO: Refs para configurações atuais - evita recriação do Phaser
    const currentConfigRef = useRef(currentConfig);
    const currentThemeRef = useRef(currentTheme);
    const componentsRef = useRef(components);
    
    // Atualizar refs quando estado muda
    useEffect(() => {
      currentConfigRef.current = currentConfig;
    }, [currentConfig]);
    
    useEffect(() => {
      currentThemeRef.current = currentTheme;
    }, [currentTheme]);
    
    useEffect(() => {
      componentsRef.current = components;
    }, [components]);
    
    // Estados dos componentes
  const [tileInfoPopup, setTileInfoPopup] = useState<{
    tile: TileData;
    position: { x: number; y: number };
  } | null>(null);

  const [hoveredTile, setHoveredTile] = useState<{
    tile: TileData;
    position: { x: number; y: number };
  } | null>(null);

    const [showRealtimeDisplay, setShowRealtimeDisplay] = useState(
      components.realtimeDisplay?.enabled ?? false
    );
    
  const [visibleTiles, setVisibleTiles] = useState<Array<{ x: number; y: number; tile: TileData }>>([]);
    
    // ==================== HOOKS ====================

  const { boardManager, dragController, cameraModel } = useBoardController({
        width: currentConfig.board?.width || boardWidth,
        height: currentConfig.board?.height || boardHeight,
      });
      
    const { dragState, onDragStart: onDragStateStart, onDragMove: onDragStateMove, onDragEnd: onDragStateEnd } = useDragTile();
    
    // ==================== EVENT EMITTER SETUP ====================
    
    useEffect(() => {
      // Inicializar o EventEmitter
      eventEmitterRef.current = new BoardEventEmitter(eventConfig);
      
      const emitter = eventEmitterRef.current;
      
      // Registrar todos os event listeners fornecidos via props
      if (onTilePlaced) emitter.on('tile-placed', onTilePlaced);
      if (onTileRemoved) emitter.on('tile-removed', onTileRemoved);
      if (onTileSelected) emitter.on('tile-selected', onTileSelected);
      if (onTileDeselected) emitter.on('tile-deselected', onTileDeselected);
      if (onTileHover) {
        emitter.on('tile-hover-start', onTileHover);
        emitter.on('tile-hover-end', onTileHover);
      }
      if (onTileClick) {
        emitter.on('tile-click', onTileClick);
        emitter.on('tile-double-click', onTileClick);
        emitter.on('tile-right-click', onTileClick);
      }
      if (onDragStart) emitter.on('drag-start', onDragStart);
      if (onDragMove) emitter.on('drag-move', onDragMove);
      if (onDragEnd) emitter.on('drag-end', onDragEnd);
      if (onCameraMove) {
        emitter.on('camera-move-start', onCameraMove);
        emitter.on('camera-move', onCameraMove);
        emitter.on('camera-move-end', onCameraMove);
      }
      if (onCameraZoom) {
        emitter.on('camera-zoom-start', onCameraZoom);
        emitter.on('camera-zoom', onCameraZoom);
        emitter.on('camera-zoom-end', onCameraZoom);
      }
      if (onCameraAnimation) {
        emitter.on('camera-animation-start', onCameraAnimation);
        emitter.on('camera-animation-update', onCameraAnimation);
        emitter.on('camera-animation-end', onCameraAnimation);
      }
      if (onBoardInitialized) emitter.on('board-initialized', onBoardInitialized);
      if (onBoardCleared) emitter.on('board-cleared', onBoardCleared);
      if (onBoardResized) emitter.on('board-resized', onBoardResized);
      if (onBoardStateChanged) emitter.on('board-state-changed', onBoardStateChanged);
      if (onSelectionChanged) emitter.on('selection-changed', onSelectionChanged);
      if (onSelectionArea) {
        emitter.on('selection-area-start', onSelectionArea);
        emitter.on('selection-area-update', onSelectionArea);
        emitter.on('selection-area-end', onSelectionArea);
      }
      if (onPerformanceUpdate) emitter.on('performance-update', onPerformanceUpdate);
      if (onPerformanceWarning) emitter.on('performance-warning', onPerformanceWarning);
      if (onError) emitter.on('error', onError);
      
      // Event aggregators
      if (onTileEvent) emitter.onTileEvent(onTileEvent);
      if (onDragEvent) emitter.onDragEvent(onDragEvent);
      if (onCameraEvent) emitter.onCameraEvent(onCameraEvent);
      if (onBoardEvent) emitter.onBoardEvent(onBoardEvent);
      if (onSelectionEvent) emitter.onSelectionEvent(onSelectionEvent);
      if (onPerformanceEvent) emitter.onPerformanceEvent(onPerformanceEvent);
      if (onEvent) {
        // Capturar todos os eventos
        const allEventTypes = [
          'tile-placed', 'tile-removed', 'tile-selected', 'tile-deselected',
          'tile-hover-start', 'tile-hover-end', 'tile-click', 'tile-double-click', 'tile-right-click',
          'drag-start', 'drag-move', 'drag-end',
          'camera-move-start', 'camera-move', 'camera-move-end',
          'camera-zoom-start', 'camera-zoom', 'camera-zoom-end',
          'camera-animation-start', 'camera-animation-update', 'camera-animation-end',
          'board-initialized', 'board-cleared', 'board-resized', 'board-state-changed',
          'selection-changed', 'selection-area-start', 'selection-area-update', 'selection-area-end',
          'performance-update', 'performance-warning', 'error',
        ] as const;
        
        allEventTypes.forEach(eventType => {
          emitter.on(eventType, onEvent as any);
        });
      }
      
      return () => {
        emitter?.destroy();
      };
    }, [
      eventConfig,
      onTilePlaced, onTileRemoved, onTileSelected, onTileDeselected, onTileHover, onTileClick,
      onDragStart, onDragMove, onDragEnd, onCameraMove, onCameraZoom, onCameraAnimation,
      onBoardInitialized, onBoardCleared, onBoardResized, onBoardStateChanged,
      onSelectionChanged, onSelectionArea, onPerformanceUpdate, onPerformanceWarning, onError,
      onTileEvent, onDragEvent, onCameraEvent, onBoardEvent, onSelectionEvent, onPerformanceEvent, onEvent
    ]);
    
    // ==================== CONFIGURAÇÃO DINÂMICA ====================
    
    // Aplicar configurações de performance
    useEffect(() => {
      if (currentConfig.performance) {
        // Aplicar configurações de performance ao board manager
        // Isso seria implementado nos managers
      }
    }, [currentConfig.performance, boardManager]);
    
    // Aplicar configurações de câmera
    useEffect(() => {
      if (currentConfig.camera && cameraModel) {
        if (currentConfig.camera.minZoom !== undefined) {
          // cameraModel.setMinZoom(currentConfig.camera.minZoom);
        }
        if (currentConfig.camera.maxZoom !== undefined) {
          // cameraModel.setMaxZoom(currentConfig.camera.maxZoom);
        }
        // Aplicar outras configurações...
      }
    }, [currentConfig.camera, cameraModel]);
    
    // 🔧 NOVO: Configuração de throttling dinâmica baseada na config do usuário
    const throttleConfig = useMemo(() => {
      const eventOpt = currentConfig.performance?.eventOptimization;
      return {
        dragMove: eventOpt?.throttling?.dragMove ?? 100,
        dragHover: eventOpt?.throttling?.dragHover ?? 150,
        dragValidation: eventOpt?.throttling?.dragValidation ?? 50,
        tileHover: eventOpt?.throttling?.tileHover ?? 150,
        tileSelection: eventOpt?.throttling?.tileSelection ?? 100,
        cameraMove: eventOpt?.throttling?.cameraMove ?? 50,
        cameraZoom: eventOpt?.throttling?.cameraZoom ?? 100,
        performanceUpdate: eventOpt?.throttling?.performanceUpdate ?? 1000,
        performanceWarning: eventOpt?.throttling?.performanceWarning ?? 5000,
        boardStateChange: eventOpt?.throttling?.boardStateChange ?? 200,
        visibleTilesUpdate: eventOpt?.throttling?.visibleTilesUpdate ?? 100,
      };
    }, [currentConfig.performance?.eventOptimization]);
    
    // 🔧 NOVO: Configuração de monitoramento dinâmica
    const monitoringConfig = useMemo(() => {
      const eventOpt = currentConfig.performance?.eventOptimization;
      return {
        enableEventMetrics: eventOpt?.monitoring?.enableEventMetrics ?? false,
        enableThrottleLogging: eventOpt?.monitoring?.enableThrottleLogging ?? (__DEV__ && false),
        enablePerformanceAlerts: eventOpt?.monitoring?.enablePerformanceAlerts ?? true,
        maxEventQueueSize: eventOpt?.monitoring?.maxEventQueueSize ?? 1000,
      };
    }, [currentConfig.performance?.eventOptimization]);
    
    // ==================== EVENT HANDLERS - OTIMIZADOS ====================
    
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      if (currentConfigRef.current.interaction?.preventContextMenu !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, []);

    // 🔧 CORREÇÃO: Handlers estáveis usando refs para evitar recriação do Phaser
    const handleTileInfo = useCallback((tile: TileData, position: { x: number; y: number }) => {
      if (componentsRef.current.tileInfoPopup?.enabled !== false) {
        setTileInfoPopup({ tile, position });
      }
      
      // Emitir evento
      if (eventEmitterRef.current) {
        eventEmitterRef.current.emit({
          type: 'tile-right-click',
          timestamp: Date.now(),
          tile,
          boardX: Math.floor(position.x),
          boardY: Math.floor(position.y),
          button: 'right',
          clickCount: 1,
        });
      }
    }, []); // 🔧 Dependências vazias - usa refs para acessar estado atual
    
    const handleTileHover = useCallback((tile: TileData | null, position: { x: number; y: number } | null) => {
      // 🔧 CORREÇÃO: Throttling para hover events
      const now = Date.now();
      const lastEmit = eventThrottleRef.current.tileHover;
      const timeDiff = now - lastEmit;
      
      // Debug do throttling
      if (__DEV__ && timeDiff < throttleConfig.tileHover) {
        console.debug(`[Throttling] Bloqueado tile-hover: ${timeDiff}ms < ${throttleConfig.tileHover}ms`);
      }
      
      if (timeDiff < throttleConfig.tileHover) return;
      
      // Atualizar timestamp apenas quando emitir
      eventThrottleRef.current.tileHover = now;
      
      if (tile && position) {
        setHoveredTile({ tile, position });
        
        // Emitir evento de hover
        if (eventEmitterRef.current) {
          if (__DEV__) {
            console.debug(`[TileHover] Emitindo hover-start para tile: ${tile.id} em (${Math.floor(position.x)}, ${Math.floor(position.y)})`);
          }
          
          eventEmitterRef.current.emit({
            type: 'tile-hover-start',
            timestamp: Date.now(),
            tile,
            boardX: Math.floor(position.x),
            boardY: Math.floor(position.y),
          });
        }
      } else {
        setHoveredTile(prev => {
          if (prev && eventEmitterRef.current) {
            if (__DEV__) {
              console.debug(`[TileHover] Emitindo hover-end para tile: ${prev.tile.id}`);
            }
            
            eventEmitterRef.current.emit({
              type: 'tile-hover-end',
              timestamp: Date.now(),
              tile: prev.tile,
              boardX: Math.floor(prev.position.x),
              boardY: Math.floor(prev.position.y),
              hoverDuration: Date.now() - (prev as any).startTime || 0,
            });
          }
          return null;
        });
      }
    }, []);

    const handleClosePopup = useCallback(() => {
      setTileInfoPopup(null);
    }, []);
    
    // ==================== COORDINATE CONVERSION E VALIDAÇÃO ====================

    const convertToWorldCoords = useCallback((clientX: number, clientY: number) => {
      if (!phaserGameRef.current || !containerRef.current) {
        return { worldX: clientX, worldY: clientY };
      }
      const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
      if (!scene || !scene.cameras) {
        return { worldX: clientX, worldY: clientY };
      }
      const cam = scene.cameras.main;
      const rect = containerRef.current.getBoundingClientRect();

      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const { x: worldX, y: worldY } = cam.getWorldPoint(localX, localY);
      return { worldX, worldY };
    }, []);
    
    // 🔧 NOVA FUNÇÃO: Verificar se posição é válida para drop e se mudou significativamente
    const checkValidDropPosition = useCallback((worldX: number, worldY: number) => {
      if (!phaserGameRef.current) return null;
      
      const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
      if (!scene) return null;
      
      // Obter offsets atuais da scene
      const cam = scene.cameras.main;
      const zoom = cam.zoom;
      
      // Calcular offsets dinamicamente (similar ao IsoScene)
      const offsetX = (cam.width * 0.5) / zoom;
      const offsetY = (cam.height * 0.5) / zoom;
      
      // Converter para coordenadas locais do board
      const localX = worldX - offsetX;
      const localY = worldY - offsetY;
      
      // Aproximação para tile usando a lógica isométrica
      // Esta é uma simplificação - no IsoScene usa screenToTileWithSnap
      const tileSize = 128; // TILE_SIZE
      const tileHeight = 64; // TILE_HEIGHT
      
      // Conversão isométrica aproximada
      const tempX = (localX / (tileSize / 2)) + (localY / (tileHeight / 2));
      const tempY = (localY / (tileHeight / 2)) - (localX / (tileSize / 2));
      
      const tileX = Math.floor(tempX / 2);
      const tileY = Math.floor(tempY / 2);
      
      // Verificar se está dentro dos bounds do board
      const isValid = tileX >= 0 && tileX < boardWidth && tileY >= 0 && tileY < boardHeight;
      
      if (__DEV__) {
        console.debug(`[ValidPosition] world(${worldX.toFixed(1)}, ${worldY.toFixed(1)}) -> local(${localX.toFixed(1)}, ${localY.toFixed(1)}) -> tile(${tileX}, ${tileY}) valid=${isValid}`);
      }
      
      return { tileX, tileY, isValid };
    }, [boardWidth, boardHeight]);
    
    // ==================== DRAG HANDLERS - CORRIGIDO E OTIMIZADO ====================

    const handleInventoryDragStart = useCallback(
      (tile: TileData, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (currentConfigRef.current.interaction?.enableDragAndDrop === false) return;
        
        // 🔧 CORREÇÃO: Evitar drag-start duplicado
        if (dragEventStateRef.current.isDragStartEmitted) return;
        
        e.preventDefault();
        const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
        onDragStateStart(tile, { x: e.clientX, y: e.clientY });
        dragController.startDrag(tile, { x: worldX, y: worldY });
        
        // Marcar drag como iniciado e fonte
        dragEventStateRef.current.isDragStartEmitted = true;
        dragEventStateRef.current.dragSource = 'inventory';
        dragEventStateRef.current.lastValidPosition = null;
        
        // Emitir evento via EventEmitter
        if (eventEmitterRef.current) {
          eventEmitterRef.current.emitDragStart({
            tile,
            startPosition: { x: e.clientX, y: e.clientY },
            currentPosition: { x: e.clientX, y: e.clientY },
            dragDistance: 0,
            source: 'inventory',
          });
        }
      },
      [convertToWorldCoords, onDragStateStart, dragController] // 🔧 Dependências mínimas
    );

    const handleBoardTileDragStart = useCallback(
      (tile: TileData, boardX: number, boardY: number, e: { clientX: number; clientY: number }) => {
        if (currentConfigRef.current.interaction?.enableDragAndDrop === false) return;
        
        // 🔧 CORREÇÃO: Evitar drag-start duplicado
        if (dragEventStateRef.current.isDragStartEmitted) return;
        
        // 🔧 CORREÇÃO DO BUG: Não usar startDragOperation que limpa o board
        // Simplesmente remove o tile específico sem recriar o board
        boardManager.removeTile(boardX, boardY);
        
        const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
        onDragStateStart(tile, { x: e.clientX, y: e.clientY });
        dragController.startDrag(tile, { x: worldX, y: worldY });
        
        // Marcar drag como iniciado e fonte
        dragEventStateRef.current.isDragStartEmitted = true;
        dragEventStateRef.current.dragSource = 'board';
        dragEventStateRef.current.lastValidPosition = null;
        
        // Emitir evento via EventEmitter
        if (eventEmitterRef.current) {
          eventEmitterRef.current.emitDragStart({
            tile,
            startPosition: { x: e.clientX, y: e.clientY },
            currentPosition: { x: e.clientX, y: e.clientY },
            dragDistance: 0,
            source: 'board',
            sourceBoardPosition: { x: boardX, y: boardY },
          });
        }
      },
      [boardManager, convertToWorldCoords, onDragStateStart, dragController] // 🔧 Dependências estáveis
    );
    
    // ==================== WINDOW EVENTS - CORRIGIDOS ====================

    const handleWindowMouseMove = useCallback(
      (e: MouseEvent) => {
        if (dragState.isDragging && dragEventStateRef.current.isDragStartEmitted) {
          e.preventDefault();
          const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
          onDragStateMove({ x: e.clientX, y: e.clientY });
          dragController.updateDrag({ x: worldX, y: worldY });
          
          // 🔧 CORREÇÃO: Throttling inteligente para drag-move
          const now = Date.now();
          const lastEmit = eventThrottleRef.current.dragMove;
          const timeDiff = now - lastEmit;
          
          // Debug do throttling (apenas se habilitado na configuração)
          if (timeDiff < throttleConfig.dragMove) {
            if (monitoringConfig.enableThrottleLogging) {
              console.debug(`[THROTTLING] Bloqueando drag-move: ${timeDiff}ms < ${throttleConfig.dragMove}ms`);
            }
            return;
          }
          
          // 🔧 CORREÇÃO: Verificar se está em posição válida antes de emitir
          const validPosition = checkValidDropPosition(worldX, worldY);
          
          // Só emitir se estiver em posição válida OU se mudou significativamente de válida para inválida
          const lastValid = dragEventStateRef.current.lastValidPosition;
          const shouldEmit = validPosition?.isValid || 
                           (lastValid && !validPosition?.isValid) || 
                           !lastValid;
          
          if (!shouldEmit) {
            if (monitoringConfig.enableThrottleLogging) {
              console.debug(`[VALIDATION] Posição inválida ignorada: tile(${validPosition?.tileX}, ${validPosition?.tileY})`);
            }
            return;
          }
          
          // Atualizar timestamp do throttling APENAS quando emitir
          eventThrottleRef.current.dragMove = now;
          
          if (eventEmitterRef.current && dragState.tile && dragState.ghostPos) {
            const startPos = dragState.ghostPos;
            
            // Atualizar última posição válida
            if (validPosition?.isValid) {
              dragEventStateRef.current.lastValidPosition = {
                x: validPosition.tileX,
                y: validPosition.tileY,
              };
            }
            
            // Debug de emissão (apenas se habilitado)
            if (monitoringConfig.enableThrottleLogging) {
              console.debug(`[DRAG-MOVE] Emitindo: isValid=${validPosition?.isValid}, tile(${validPosition?.tileX}, ${validPosition?.tileY})`);
            }
            
            eventEmitterRef.current.emitDragMove({
              tile: dragState.tile,
              startPosition: startPos,
              currentPosition: { x: e.clientX, y: e.clientY },
              dragDistance: Math.hypot(
                e.clientX - startPos.x,
                e.clientY - startPos.y
              ),
              isValidTarget: validPosition?.isValid || false,
              canPlace: validPosition?.isValid || false,
              targetBoardPosition: validPosition?.isValid ? {
                x: validPosition.tileX,
                y: validPosition.tileY,
              } : undefined,
            });
          }
        }
      },
      [dragController, dragState, onDragStateMove, convertToWorldCoords, checkValidDropPosition]
    );

    const handleWindowMouseUp = useCallback(
      (e: MouseEvent) => {
        if (dragState.isDragging && dragEventStateRef.current.isDragStartEmitted) {
          const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
          onDragStateEnd();
          
          const success = dragController.endDrag({ x: worldX, y: worldY });
          
          // 🔧 CORREÇÃO: Só emitir drag-end se drag-start foi emitido e ainda não foi finalizado
          if (eventEmitterRef.current && dragState.tile && dragState.ghostPos) {
            const startPos = dragState.ghostPos;
            const validPosition = checkValidDropPosition(worldX, worldY);
            
            if (__DEV__) {
              console.debug(`[DragEnd] success=${success}, validPosition=${validPosition?.isValid}, tile(${validPosition?.tileX}, ${validPosition?.tileY})`);
            }
            
            eventEmitterRef.current.emitDragEnd({
              tile: dragState.tile,
              startPosition: startPos,
              currentPosition: { x: e.clientX, y: e.clientY },
              dragDistance: Math.hypot(
                e.clientX - startPos.x,
                e.clientY - startPos.y
              ),
              success,
              action: success ? 'place' : 'cancel',
              targetBoardPosition: success && validPosition?.isValid ? {
                x: validPosition.tileX,
                y: validPosition.tileY,  
              } : undefined,
            });
            
            // 🔧 NOVO: Emitir tile-placed quando tile é efetivamente colocado
            if (success && validPosition?.isValid) {
              if (__DEV__) {
                console.debug(`[TilePlaced] Emitindo tile-placed para tile(${validPosition.tileX}, ${validPosition.tileY})`);
              }
              
              eventEmitterRef.current.emitTilePlaced({
                tile: dragState.tile,
                boardX: validPosition.tileX,
                boardY: validPosition.tileY,
                isReplace: false,
              });
            }
          }
          
          // 🔧 CORREÇÃO: Resetar estado de drag para evitar duplicatas
          dragEventStateRef.current.isDragStartEmitted = false;
          dragEventStateRef.current.dragSource = null;
          dragEventStateRef.current.lastValidPosition = null;
          dragEventStateRef.current.lastMoveEmitTime = 0;
        }
      },
      [dragController, dragState, onDragStateEnd, convertToWorldCoords, checkValidDropPosition]
    );
      
    // ==================== EFFECTS - CORRIGIDOS ====================

    useEffect(() => {
      if (dragState.isDragging) {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
      } else {
        // 🔧 CORREÇÃO: Resetar estado quando drag termina
        if (dragEventStateRef.current.isDragStartEmitted) {
          dragEventStateRef.current.isDragStartEmitted = false;
          dragEventStateRef.current.dragSource = null;
          dragEventStateRef.current.lastValidPosition = null;
          dragEventStateRef.current.lastMoveEmitTime = 0;
        }
      }
      
      return () => {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    }, [dragState.isDragging, handleWindowMouseMove, handleWindowMouseUp]);

    // 🔧 NOVO: Cleanup de eventos na desmontagem
    useEffect(() => {
      return () => {
        // Resetar todos os estados de eventos na desmontagem
        dragEventStateRef.current.isDragStartEmitted = false;
        dragEventStateRef.current.dragSource = null;
        dragEventStateRef.current.lastValidPosition = null;
        dragEventStateRef.current.lastMoveEmitTime = 0;
        eventThrottleRef.current.dragMove = 0;
        eventThrottleRef.current.tileHover = 0;
      };
    }, []);

    // Atualizar tiles visíveis em tempo real
    useEffect(() => {
      if (!phaserGameRef.current || !showRealtimeDisplay) return;

      const updateVisibleTiles = () => {
        const scene = phaserGameRef.current?.scene.getScene('IsoScene') as any;
        if (scene && scene.getVisibleTiles) {
          const tiles = scene.getVisibleTiles();
          setVisibleTiles(tiles);
        }
      };

      updateVisibleTiles();
      const interval = setInterval(updateVisibleTiles, components.realtimeDisplay?.updateInterval || 100);

      return () => clearInterval(interval);
    }, [phaserGameRef.current, showRealtimeDisplay, components.realtimeDisplay]);

    // ==================== PHASER INITIALIZATION - CORRIGIDO ====================

    // 🔧 CORREÇÃO: Função de inicialização estável para evitar recriação
    const initializePhaser = useCallback(() => {
      if (!containerRef.current) return null;

    const isoScene = new IsoScene({
        boardConfig: { 
          width: boardWidth, 
          height: boardHeight 
        },
      boardManager,
      dragController,
      cameraModel,
      onTileDragStart: handleBoardTileDragStart,
      onTileInfo: handleTileInfo,
      onTileHover: handleTileHover,
        onReadyCallback: () => {
          onReady?.();
          
          // Emitir evento de inicialização via EventEmitter
          if (eventEmitterRef.current) {
            eventEmitterRef.current.emit({
              type: 'board-initialized',
              timestamp: Date.now(),
              boardWidth,
              boardHeight,
              tileCount: 0,
              initialTiles: [],
            });
          }
        },
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      transparent: true,
        backgroundColor: '#1a1a1a',
      scene: [isoScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
      },
    });

      return game;
    }, [
      // 🔧 CORREÇÃO: Apenas dependências que realmente precisam recriar o Phaser
      boardManager,
      dragController,
      cameraModel,
      boardWidth,
      boardHeight,
      // onReady removido pois pode mudar
    ]);

    // Inicializar Phaser - apenas uma vez
    useEffect(() => {
      const game = initializePhaser();
      if (!game) return;

    phaserGameRef.current = game;

    return () => {
        if (phaserGameRef.current) {
      boardManager.clearBoard();
          phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
        }
      };
    }, [initializePhaser]);
      
    // ==================== API IMPLEMENTATION ====================
    
    const api: IsoBoardCanvasAPI = useMemo(() => ({
      // Board control
      placeTile: (x: number, y: number, tile: TileData) => {
        const success = boardManager.placeTile(x, y, tile);
        if (success && eventEmitterRef.current) {
          eventEmitterRef.current.emitTilePlaced({
            tile,
            boardX: x,
            boardY: y,
            isReplace: false,
          });
        }
        return success;
      },
      
      removeTile: (x: number, y: number) => {
        const tile = boardManager.getTileAt(x, y);
        const success = boardManager.removeTile(x, y);
        if (success && tile && eventEmitterRef.current) {
          eventEmitterRef.current.emitTileRemoved({
            tile,
            boardX: x,
            boardY: y,
            reason: 'delete',
          });
        }
        return success;
      },
      
      getTileAt: (x: number, y: number) => boardManager.getTileAt(x, y),
      
      clearBoard: () => {
        const tiles = boardManager.getState();
        boardManager.clearBoard();
        if (eventEmitterRef.current) {
          eventEmitterRef.current.emit({
            type: 'board-cleared',
            timestamp: Date.now(),
            boardWidth: currentConfig.board?.width || boardWidth,
            boardHeight: currentConfig.board?.height || boardHeight,
            tileCount: 0,
            clearedTiles: tiles,
          });
        }
      },
      
      // Camera control
      centerCamera: () => {
        const currentPos = cameraModel.getPosition();
        const boardCenterX = ((currentConfig.board?.width || boardWidth) * 128) / 2;
        const boardCenterY = ((currentConfig.board?.height || boardHeight) * 64) / 2;
        const deltaX = boardCenterX - currentPos.x;
        const deltaY = boardCenterY - currentPos.y;
        cameraModel.pan(deltaX, deltaY);
      },
      setCameraPosition: (x: number, y: number, _animated = true) => {
        const currentPos = cameraModel.getPosition();
        const deltaX = x - currentPos.x;
        const deltaY = y - currentPos.y;
        cameraModel.pan(deltaX, deltaY);
      },
      setCameraZoom: (zoom: number, _animated = true) => {
        const currentZoom = cameraModel.getZoom();
        const deltaZoom = zoom - currentZoom;
        cameraModel.zoomBy(deltaZoom);
      },
      getCameraPosition: () => cameraModel.getPosition(),
      getCameraZoom: () => cameraModel.getZoom(),
      
      // Configuration
      updateConfig: (config: Partial<CompleteIsoBoardConfiguration>) => {
        const newConfig = { ...currentConfig, ...config };
        setCurrentConfig(newConfig);
        onConfigChange?.(newConfig);
      },
      
      getConfig: () => currentConfig,
      
      setTheme: (theme: IsoBoardTheme | keyof typeof THEMES) => {
        const newTheme = typeof theme === 'string' ? THEMES[theme] || THEMES.DEFAULT : theme;
        setCurrentTheme(newTheme);
        onThemeChange?.(newTheme);
      },
      
      getTheme: () => currentTheme,
      
      // Events
      addEventListener: <T extends keyof IsoBoardEventProps>(
        event: T, 
        listener: NonNullable<IsoBoardEventProps[T]>
      ) => {
        if (eventEmitterRef.current) {
          const eventTypeMap: Record<string, string> = {
            onTilePlaced: 'tile-placed',
            onTileRemoved: 'tile-removed',
            onDragStart: 'drag-start',
            onDragMove: 'drag-move',
            onDragEnd: 'drag-end',
          };
          
          const eventType = eventTypeMap[event as string];
          if (eventType) {
            (eventEmitterRef.current as any).on(eventType, listener);
          }
        }
      },
      
      removeEventListener: <T extends keyof IsoBoardEventProps>(
        event: T, 
        listener: NonNullable<IsoBoardEventProps[T]>
      ) => {
        if (eventEmitterRef.current) {
          const eventTypeMap: Record<string, string> = {
            onTilePlaced: 'tile-placed',
            onTileRemoved: 'tile-removed',
            onDragStart: 'drag-start',
            onDragMove: 'drag-move',
            onDragEnd: 'drag-end',
          };
          
          const eventType = eventTypeMap[event as string];
          if (eventType) {
            (eventEmitterRef.current as any).off(eventType, listener);
          }
        }
      },
      
      // Performance
      getPerformanceMetrics: () => ({
        fps: 60, // Would be calculated
        tileCount: boardManager.getState().length,
        visibleTileCount: visibleTiles.length,
        memoryUsage: 0, // Would be calculated
      }),
      
      // Utilities
      exportBoardState: () => boardManager.getState(),
      importBoardState: (tiles) => {
        boardManager.clearBoard();
        tiles.forEach(({ x, y, tile }) => {
          boardManager.placeTile(x, y, tile);
        });
      },
      captureScreenshot: () => '', // Would be implemented
    }), [
      boardManager,
      cameraModel,
      currentConfig,
      currentTheme,
      visibleTiles,
      boardWidth,
      boardHeight,
      onConfigChange,
      onThemeChange,
    ]);
    
    // Expor API via ref
    useEffect(() => {
      apiRef.current = api;
      if (typeof ref === 'function') {
        ref(api);
      } else if (ref) {
        ref.current = api;
      }
    }, [api, ref]);
    
    // ==================== STYLES ====================
    
    const containerStyle: React.CSSProperties = {
    width,
    height,
      position: 'relative',
      backgroundColor: currentTheme.colors.background,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      ...style,
    };
    
    const shouldShowInventory = !components.inventory;
    const shouldShowControlsPanel = components.controlsPanel?.enabled === true;
    const shouldShowPreview = !components.previewOverlay || (typeof components.previewOverlay === 'object' && components.previewOverlay.enabled !== false);
    const shouldShowTileInfo = !components.tileInfoPopup || (typeof components.tileInfoPopup === 'object' && components.tileInfoPopup.enabled !== false);
    const shouldShowRealtimeDisplay = components.realtimeDisplay?.enabled === true;
    
    // ==================== RENDER ====================

  return (
    <div 
      ref={mainContainerRef}
        className={`iso-board-canvas ${className}`}
      style={containerStyle}
      onContextMenu={handleContextMenu}
        tabIndex={0}
        {...canvasProps}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
        
        {shouldShowInventory && (
          <IsoTileInventory 
            tiles={availableTiles} 
            onDragStart={handleInventoryDragStart}
          />
        )}
        
        {shouldShowPreview && (
          <PreviewOverlay 
            dragState={dragState}
          />
        )}
        
        <CameraHandler 
          cameraModel={cameraModel} 
          containerRef={containerRef} 
          isDragActive={dragState.isDragging} 
        />
        
        {shouldShowTileInfo && (
          <>
      <TileInfoPopup 
        tile={tileInfoPopup?.tile || null}
        position={tileInfoPopup?.position || null}
        onClose={handleClosePopup}
      />
            
            {components.tileInfoPopup?.showOnHover !== false && (
      <TileInfoPopup 
        tile={hoveredTile?.tile || null}
        position={hoveredTile?.position || null}
        onClose={() => setHoveredTile(null)}
        isHover={true}
      />
            )}
          </>
        )}
        
        {shouldShowRealtimeDisplay && (
      <RealtimeTileDisplay
        visibleTiles={visibleTiles}
        isVisible={showRealtimeDisplay}
        onToggle={() => setShowRealtimeDisplay(!showRealtimeDisplay)}
      />
        )}
        
        {shouldShowControlsPanel && (
        <BoardControlsPanel
          cameraModel={cameraModel}
          containerRef={mainContainerRef}
        />
      )}
    </div>
  );
  }
);

IsoBoardCanvas.displayName = 'IsoBoardCanvas';

export default IsoBoardCanvas;