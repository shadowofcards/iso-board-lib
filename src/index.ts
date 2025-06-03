/**
 * Pontos de entrada público da biblioteca.
 * Exportamos apenas componentes React principais, hooks e tipos públicos.
 */

export { IsoBoardCanvas } from './components/IsoBoardCanvas';
export { IsoTileInventory } from './components/IsoTileInventory';
export { PreviewOverlay } from './components/PreviewOverlay';
export { CameraHandler } from './components/CameraHandler';
export { TileInteractionLayer } from './components/TileInteractionLayer';
export { TileInfoPopup } from './components/TileInfoPopup';
export { BoardControlsPanel } from './components/BoardControlsPanel';

export { BoardStateManager } from './core/engine/BoardStateManager';
export { DragController, type DragState } from './core/engine/DragController';
export { Camera as CameraModel } from './core/models/Camera';
export type { TileData } from './core/models/Tile';

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
  type AdvancedBoardControlsOptions 
} from './hooks/useAdvancedBoardControls';

// Configurações centralizadas
export * from './core/config';
