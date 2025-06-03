import { BoardStateManager } from './BoardStateManager';
import type { TileData } from '../models/Tile';
import { screenToTileWithSnap } from '../math/isoCoordinate';
import { TILE_SIZE, TILE_HEIGHT } from '../constants';
import { __DEV__ } from '../config';

export type DragState = {
  isDragging: boolean;
  tile: TileData | null;
  ghostPos: { x: number; y: number } | null;
};

export class DragController {
  private board: BoardStateManager;
  private state: DragState = { isDragging: false, tile: null, ghostPos: null };
  private dropListeners = new Set<(x: number, y: number, t: TileData) => void>();
  private offsets = { offsetX: 0, offsetY: 0 };

  constructor(board: BoardStateManager) { this.board = board; }

  setOffsets(offsetX: number, offsetY: number) { this.offsets = { offsetX, offsetY }; }

  startDrag(tile: TileData, screen: { x: number; y: number }) {
    this.state = { isDragging: true, tile, ghostPos: { ...screen } };
  }
  updateDrag(screen: { x: number; y: number }) {
    if (!this.state.isDragging) return;
    this.state.ghostPos = { ...screen };
  }
  endDrag(screen: { x: number; y: number }): boolean {
    if (!this.state.isDragging || !this.state.tile) { this.clear(); return false; }

    const snapped = screenToTileWithSnap(
      screen.x - this.offsets.offsetX,
      screen.y - this.offsets.offsetY,
      TILE_SIZE, TILE_HEIGHT,
      this.board.getWidth(), this.board.getHeight(),
    );
    if (!snapped) { this.clear(); return false; }

    const { tile } = this.state;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[DragController] drop', snapped, tile.id);
    }

    const ok = this.board.placeTile(snapped.tileX, snapped.tileY, tile);
    if (ok) this.dropListeners.forEach(cb => cb(snapped.tileX, snapped.tileY, tile));
    this.clear();
    return ok;
  }

  private clear() { this.state = { isDragging: false, tile: null, ghostPos: null }; }

  getState(): DragState { return JSON.parse(JSON.stringify(this.state)); }

  onDrop(cb: (x: number, y: number, t: TileData) => void) { this.dropListeners.add(cb); }
  offDrop(cb: (x: number, y: number, t: TileData) => void) { this.dropListeners.delete(cb); }
}
