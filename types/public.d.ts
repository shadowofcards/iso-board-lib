/**
 * Tipos públicos expostos pela biblioteca. 
 * Consumidor poderá importar diretamente de "iso-board-lib".
 */

import { TileData } from '../src/core/models/Tile';
import { BoardStateManager } from '../src/core/engine/BoardStateManager';
import { DragController, DragState } from '../src/core/engine/DragController';
import { Camera } from '../src/core/models/Camera';

export interface BoardConfig {
  width: number;
  height: number;
}

export { TileData, BoardStateManager, DragController, DragState, Camera };
