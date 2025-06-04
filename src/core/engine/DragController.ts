import { BoardStateManager } from './BoardStateManager';
import type { TileData } from '../models/Tile';
import { screenToTileWithSnap } from '../math/isoCoordinate';
import { TILE_SIZE, TILE_HEIGHT } from '../constants';
import { __DEV__ } from '../config';

export type DragState = {
  isDragging: boolean;
  tile: TileData | null;
  ghostPos: { x: number; y: number } | null;
  originalPosition?: { x: number; y: number } | null; // Para restaurar em caso de cancelamento
};

export class DragController {
  private board: BoardStateManager;
  private state: DragState = { isDragging: false, tile: null, ghostPos: null, originalPosition: null };
  private dropListeners = new Set<(x: number, y: number, t: TileData) => void>();
  private offsets = { offsetX: 0, offsetY: 0 };

  constructor(board: BoardStateManager) {
    this.board = board;
  }

  /** Recebe os offsets calculados pelo IsoScene a cada frame */
  setOffsets(offsetX: number, offsetY: number) {
    this.offsets = { offsetX, offsetY };
  }

  /* --------------------------------------------------------- *
   *                       CICLO DE DRAG                       *
   * --------------------------------------------------------- */
  startDrag(tile: TileData, screen: { x: number; y: number }, originalPosition?: { x: number; y: number }) {
    if (__DEV__) {
      console.debug(`[DragController] startDrag: tile=${tile.id}, screen(${screen.x.toFixed(1)}, ${screen.y.toFixed(1)}), original=${originalPosition ? `(${originalPosition.x}, ${originalPosition.y})` : 'none'}`);
    }
    this.board.startDragOperation();                         // 🔑
    this.state = { isDragging: true, tile, ghostPos: { ...screen }, originalPosition: originalPosition || null };
  }

  updateDrag(screen: { x: number; y: number }) {
    if (this.state.isDragging) {
      this.state.ghostPos = { ...screen };
      if (__DEV__ && Math.random() < 0.01) { // Log apenas 1% das vezes para não spammar
        console.debug(`[DragController] updateDrag: screen(${screen.x.toFixed(1)}, ${screen.y.toFixed(1)})`);
      }
    }
  }

  endDrag(screen: { x: number; y: number }): boolean {
    if (__DEV__) {
      console.debug(`[DragController] endDrag: screen(${screen.x.toFixed(1)}, ${screen.y.toFixed(1)}), isDragging=${this.state.isDragging}, tile=${this.state.tile?.id}`);
    }
    
    if (!this.state.isDragging || !this.state.tile) {
      if (__DEV__) {
        console.debug(`[DragController] endDrag: Abortando - não está arrastando ou sem tile`);
      }
      this.clean();
      return false;
    }

    /* Mouse → tile com snap */
    const snapped = screenToTileWithSnap(
      screen.x - this.offsets.offsetX,
      screen.y - this.offsets.offsetY,
      TILE_SIZE,
      TILE_HEIGHT,
      this.board.getWidth(),
      this.board.getHeight()
    );

    if (__DEV__) {
      console.debug(`[DragController] endDrag: offsets(${this.offsets.offsetX.toFixed(1)}, ${this.offsets.offsetY.toFixed(1)}), adjusted(${(screen.x - this.offsets.offsetX).toFixed(1)}, ${(screen.y - this.offsets.offsetY).toFixed(1)}), snapped=${snapped ? `(${snapped.tileX}, ${snapped.tileY})` : 'null'}`);
    }

    const ok =
      !!snapped &&
      this.board.placeTile(snapped.tileX, snapped.tileY, this.state.tile);

    if (__DEV__) {
      console.debug(`[DragController] endDrag: placeTile result=${ok}`);
    }

    // 🔧 CORREÇÃO: Se falhou e havia posição original, restaurar o tile
    if (!ok && this.state.originalPosition) {
      const restored = this.board.placeTile(
        this.state.originalPosition.x, 
        this.state.originalPosition.y, 
        this.state.tile
      );
      if (__DEV__) {
        console.debug(`[DragController] endDrag: Restaurando tile na posição original (${this.state.originalPosition.x}, ${this.state.originalPosition.y}): ${restored}`);
      }
    }

    /* Sempre encerra a operação para liberar o cache */
    this.board.endDragOperation();                           // 🔑
    const placedTile = this.state.tile;                      // guardar antes de limpar
    this.clean();

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[DragController] drop', snapped, placedTile?.id, ok ? '✔️' : '✖️');
    }

    if (ok && snapped) {
      this.dropListeners.forEach(cb =>
        cb(snapped.tileX, snapped.tileY, placedTile!)
      );
    }

    return ok;
  }

  /* --------------------------------------------------------- *
   *                      UTILITÁRIOS                          *
   * --------------------------------------------------------- */
  private clean() {
    this.state = { isDragging: false, tile: null, ghostPos: null, originalPosition: null };
  }

  getState(): DragState {
    return JSON.parse(JSON.stringify(this.state));
  }

  onDrop(cb: (x: number, y: number, t: TileData) => void) {
    this.dropListeners.add(cb);
  }
  offDrop(cb: (x: number, y: number, t: TileData) => void) {
    this.dropListeners.delete(cb);
  }
}
