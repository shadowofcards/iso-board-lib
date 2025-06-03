import type { TileData } from '../models/Tile';
import { CHUNK_SIZE } from '../config';

export interface TileEntry { x: number; y: number; tile: TileData }
export interface SpatialQuery { minX: number; maxX: number; minY: number; maxY: number }

/**
 * Índice espacial em grid de chunks.
 * Troca Set-por-Map para lookup O(1) por “x,y”.
 */
export class SpatialIndex {
  private chunkSize: number;
  private chunks: Map<string, Map<string, TileEntry>>;
  private boardW: number;
  private boardH: number;

  constructor(boardW: number, boardH: number, chunkSize: number = CHUNK_SIZE) {
    this.boardW = boardW;
    this.boardH = boardH;
    this.chunkSize = chunkSize;
    this.chunks = new Map();
  }

  /* helpers */
  private key(x: number, y: number)            { return `${x},${y}`; }
  private chunkKey(cx: number, cy: number)     { return `${cx},${cy}`; }
  private chunkCoords(x: number, y: number)    { return { cx: Math.floor(x / this.chunkSize), cy: Math.floor(y / this.chunkSize) }; }
  private getOrCreateChunk(cx: number, cy: number) {
    const key = this.chunkKey(cx, cy);
    let c = this.chunks.get(key);
    if (!c) { c = new Map(); this.chunks.set(key, c); }
    return c;
  }

  addTile(x: number, y: number, tile: TileData): void {
    if (x < 0 || x >= this.boardW || y < 0 || y >= this.boardH) return;
    const { cx, cy } = this.chunkCoords(x, y);
    this.getOrCreateChunk(cx, cy).set(this.key(x, y), { x, y, tile });
  }

  removeTile(x: number, y: number): boolean {
    const { cx, cy } = this.chunkCoords(x, y);
    const chunk = this.chunks.get(this.chunkKey(cx, cy));
    if (!chunk) return false;
    const ok = chunk.delete(this.key(x, y));
    if (chunk.size === 0) this.chunks.delete(this.chunkKey(cx, cy));
    return ok;
  }

  getTileAt(x: number, y: number): TileData | null {
    const { cx, cy } = this.chunkCoords(x, y);
    const chunk = this.chunks.get(this.chunkKey(cx, cy));
    return chunk?.get(this.key(x, y))?.tile ?? null;
  }

  /* queryRegion / queryRadius inalterados – usam Map agora */
  queryRegion(q: SpatialQuery): TileEntry[] {
    const res: TileEntry[] = [];
    const minCX = Math.floor(q.minX / this.chunkSize);
    const maxCX = Math.floor(q.maxX / this.chunkSize);
    const minCY = Math.floor(q.minY / this.chunkSize);
    const maxCY = Math.floor(q.maxY / this.chunkSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const chunk = this.chunks.get(this.chunkKey(cx, cy));
        if (!chunk) continue;
        chunk.forEach(entry => {
          if (entry.x >= q.minX && entry.x <= q.maxX &&
              entry.y >= q.minY && entry.y <= q.maxY) res.push(entry);
        });
      }
    }
    return res;
  }

  queryRadius(cx: number, cy: number, r: number): TileEntry[] {
    return this.queryRegion({
      minX: cx - r, maxX: cx + r,
      minY: cy - r, maxY: cy + r,
    }).filter(e => (Math.hypot(e.x - cx, e.y - cy) <= r));
  }

  clear() { this.chunks.clear(); }

  getStats() {
    let tiles = 0;
    this.chunks.forEach(c => tiles += c.size);
    return {
      totalChunks: this.chunks.size,
      totalTiles : tiles,
      chunkSize  : this.chunkSize,
      averageTilesPerChunk: this.chunks.size ? tiles / this.chunks.size : 0,
    };
  }
}
