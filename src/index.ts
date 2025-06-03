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

export { BoardStateManager } from './core/engine/BoardStateManager';
export { DragController, type DragState } from './core/engine/DragController';
export { Camera as CameraModel } from './core/models/Camera';
export type { TileData } from './core/models/Tile';

export { useBoardController } from './hooks/useBoardController';
export { useDragTile } from './hooks/useDragTile';
