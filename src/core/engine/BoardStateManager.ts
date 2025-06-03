import { Board, type TileAtXY } from '../models/Board';
import type { TileData } from '../models/Tile';
import { SpatialIndex, type SpatialQuery } from '../math/spatialIndex';
import { CHUNK_SIZE, __DEV__ } from '../config';

export type BoardChangeListener = (tiles: TileAtXY[]) => void;

export class BoardStateManager {
  private board: Board;
  private spatial: SpatialIndex;
  private listeners = new Set<BoardChangeListener>();

  private lastViewportQuery: SpatialQuery | null = null;
  private lastViewportResult: TileAtXY[] = [];
  private dirtyChunks = new Set<string>();

  private dragging = false;

  constructor(width: number, height: number) {
    this.board   = new Board(width, height);
    this.spatial = new SpatialIndex(width, height, CHUNK_SIZE);
  }

  /* -------------- listeners ---------------- */

  onChange(l: BoardChangeListener)  { this.listeners.add(l); }
  offChange(l: BoardChangeListener) { this.listeners.delete(l); }

  /* -------------- drag flag ---------------- */

  startDragOperation() { this.dragging = true; }
  endDragOperation()   { this.dragging = false; this.invalidateCache(); }

  /* -------------- helpers ------------------ */

  private markDirty(x: number, y: number) {
    const key = `${Math.floor(x / CHUNK_SIZE)},${Math.floor(y / CHUNK_SIZE)}`;
    this.dirtyChunks.add(key);
  }
  private invalidateCache() {
    this.lastViewportQuery  = null;
    this.lastViewportResult = [];
    this.dirtyChunks.clear();
  }

  /* -------------- mutations ---------------- */

  placeTile(x: number, y: number, tile: TileData): boolean {
    if (!this.board.addTile(x, y, tile)) return false;
    this.spatial.addTile(x, y, tile);
    this.markDirty(x, y);
    if (this.dragging) this.invalidateCache();
    this.emitChange();
    return true;
  }

  removeTile(x: number, y: number): boolean {
    if (!this.board.removeTile(x, y)) return false;
    this.spatial.removeTile(x, y);
    this.markDirty(x, y);
    if (this.dragging) this.invalidateCache();
    this.emitChange();
    return true;
  }

  /* -------------- queries ------------------ */

  getState(): TileAtXY[] {
    const all = this.board.getAllTiles();
    if (__DEV__ && all.length > 10_000)
      // eslint-disable-next-line no-console
      console.warn('getState() em board grande – use getVisibleTiles()');
    return all;
  }

  getVisibleTiles(q: SpatialQuery): TileAtXY[] {
    if (!this.dragging &&
        this.lastViewportQuery &&
        !this.dirtyChunks.size &&
        JSON.stringify(q) === JSON.stringify(this.lastViewportQuery))
      return this.lastViewportResult;

    const result = this.spatial.queryRegion(q).map(e => ({ x: e.x, y: e.y, tile: e.tile }));

    if (!this.dragging) {
      this.lastViewportQuery  = { ...q };
      this.lastViewportResult = result;
      this.dirtyChunks.clear();
    }
    return result;
  }

  getTilesNearPoint(x: number, y: number, r: number) {
    return this.spatial.queryRadius(x, y, r).map(e => ({ x: e.x, y: e.y, tile: e.tile }));
  }

  getTileAt(x: number, y: number) { return this.spatial.getTileAt(x, y) ?? undefined; }

  /* -------------- emit --------------------- */

  private emitChange() {
    if (this.lastViewportQuery && !this.dragging) {
      const vis = this.getVisibleTiles(this.lastViewportQuery);
      this.listeners.forEach(l => l(vis));
    } else {
      this.listeners.forEach(l => l(this.getState()));
    }
  }

  clearBoard() {
    this.board.clear();
    this.spatial.clear();
    this.invalidateCache();
    this.listeners.forEach(l => l([]));
  }

  /* -------------- getters ------------------ */

  getWidth()  { return this.board.getWidth(); }
  getHeight() { return this.board.getHeight(); }
}
