/**
 * Sistema de Spatial Indexing para acelerar buscas de tiles em boards gigantescos.
 * Utiliza uma grade de chunks para organizar tiles em regiões menores.
 */

import type { TileData } from '../models/Tile';

export interface TileEntry {
  x: number;
  y: number;
  tile: TileData;
}

export interface ChunkCoords {
  chunkX: number;
  chunkY: number;
}

export interface SpatialQuery {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Índice espacial baseado em chunks para busca eficiente de tiles.
 * Divide o mundo em pedaços menores (chunks) para acelerar consultas.
 */
export class SpatialIndex {
  private chunkSize: number;
  private chunks: Map<string, Set<TileEntry>>;
  private boardWidth: number;
  private boardHeight: number;

  constructor(boardWidth: number, boardHeight: number, chunkSize: number = 64) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.chunkSize = chunkSize;
    this.chunks = new Map();
  }

  /**
   * Converte coordenadas de tile para coordenadas de chunk.
   */
  private getChunkCoords(tileX: number, tileY: number): ChunkCoords {
    return {
      chunkX: Math.floor(tileX / this.chunkSize),
      chunkY: Math.floor(tileY / this.chunkSize),
    };
  }

  /**
   * Gera a chave única para um chunk.
   */
  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  /**
   * Obtém ou cria um chunk na coordenada especificada.
   */
  private getOrCreateChunk(chunkX: number, chunkY: number): Set<TileEntry> {
    const key = this.getChunkKey(chunkX, chunkY);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Set();
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  /**
   * Adiciona um tile ao índice.
   */
  addTile(x: number, y: number, tile: TileData): void {
    if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) {
      return; // Fora dos limites
    }

    const { chunkX, chunkY } = this.getChunkCoords(x, y);
    const chunk = this.getOrCreateChunk(chunkX, chunkY);
    const entry: TileEntry = { x, y, tile };
    chunk.add(entry);
  }

  /**
   * Remove um tile do índice.
   */
  removeTile(x: number, y: number): boolean {
    const { chunkX, chunkY } = this.getChunkCoords(x, y);
    const key = this.getChunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);
    
    if (!chunk) return false;

    // Encontra e remove o tile
    for (const entry of chunk) {
      if (entry.x === x && entry.y === y) {
        chunk.delete(entry);
        
        // Remove o chunk se estiver vazio
        if (chunk.size === 0) {
          this.chunks.delete(key);
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Encontra um tile em uma posição específica.
   */
  getTileAt(x: number, y: number): TileData | null {
    const { chunkX, chunkY } = this.getChunkCoords(x, y);
    const key = this.getChunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);
    
    if (!chunk) return null;

    for (const entry of chunk) {
      if (entry.x === x && entry.y === y) {
        return entry.tile;
      }
    }
    
    return null;
  }

  /**
   * Busca tiles dentro de uma região retangular.
   * Muito mais eficiente que buscar tile por tile.
   */
  queryRegion(query: SpatialQuery): TileEntry[] {
    const results: TileEntry[] = [];
    
    // Calcula quais chunks intersectam com a região
    const minChunkX = Math.floor(query.minX / this.chunkSize);
    const maxChunkX = Math.floor(query.maxX / this.chunkSize);
    const minChunkY = Math.floor(query.minY / this.chunkSize);
    const maxChunkY = Math.floor(query.maxY / this.chunkSize);

    // Itera apenas pelos chunks relevantes
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
      for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
        const key = this.getChunkKey(chunkX, chunkY);
        const chunk = this.chunks.get(key);
        
        if (!chunk) continue;

        // Filtra tiles dentro da região específica
        for (const entry of chunk) {
          if (
            entry.x >= query.minX &&
            entry.x <= query.maxX &&
            entry.y >= query.minY &&
            entry.y <= query.maxY
          ) {
            results.push(entry);
          }
        }
      }
    }

    return results;
  }

  /**
   * Busca tiles próximos a um ponto específico dentro de um raio.
   */
  queryRadius(centerX: number, centerY: number, radius: number): TileEntry[] {
    const query: SpatialQuery = {
      minX: centerX - radius,
      maxX: centerX + radius,
      minY: centerY - radius,
      maxY: centerY + radius,
    };

    const candidates = this.queryRegion(query);
    
    // Filtra por distância real (círculo, não quadrado)
    return candidates.filter((entry) => {
      const dx = entry.x - centerX;
      const dy = entry.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Retorna todos os tiles (cuidado com boards grandes!).
   * Use apenas para debug ou boards pequenos.
   */
  getAllTiles(): TileEntry[] {
    const results: TileEntry[] = [];
    for (const chunk of this.chunks.values()) {
      results.push(...Array.from(chunk));
    }
    return results;
  }

  /**
   * Limpa todo o índice.
   */
  clear(): void {
    this.chunks.clear();
  }

  /**
   * Retorna estatísticas de performance do índice.
   */
  getStats(): {
    totalChunks: number;
    totalTiles: number;
    chunkSize: number;
    averageTilesPerChunk: number;
  } {
    const totalChunks = this.chunks.size;
    let totalTiles = 0;
    
    for (const chunk of this.chunks.values()) {
      totalTiles += chunk.size;
    }

    return {
      totalChunks,
      totalTiles,
      chunkSize: this.chunkSize,
      averageTilesPerChunk: totalChunks > 0 ? totalTiles / totalChunks : 0,
    };
  }
} 