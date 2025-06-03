import { Board, type TileAtXY } from '../models/Board';
import type { TileData } from '../models/Tile';
import { SpatialIndex, type SpatialQuery } from '../math/spatialIndex';

/**
 * Gerencia o estado do tabuleiro e notifica listeners sempre que há mudança.
 * Pode-se conectar lógica de rede (socket) ou validações mais complexas.
 */

export type BoardChangeListener = (tiles: TileAtXY[]) => void;

/**
 * Versão otimizada do BoardStateManager com spatial indexing para boards gigantescos.
 * Usa chunks para acelerar buscas e renderização viewport-based.
 */
export class BoardStateManager {
  private board: Board;
  private spatialIndex: SpatialIndex;
  private listeners: Set<BoardChangeListener>;
  private dirtyRegions: Set<string>; // Regiões que mudaram desde a última atualização
  private lastViewportQuery: SpatialQuery | null = null;
  private lastViewportResult: TileAtXY[] = [];
  private isDragOperation: boolean = false; // Flag para detectar operações de drag

  constructor(width: number, height: number, chunkSize: number = 64) {
    this.board = new Board(width, height);
    this.spatialIndex = new SpatialIndex(width, height, chunkSize);
    this.listeners = new Set();
    this.dirtyRegions = new Set();
    this.isDragOperation = false;
  }

  /**
   * Registra um listener para mudanças: sempre que houver placeTile ou removeTile,
   * chamamos todos os listeners com a lista completa de tiles posicionados.
   */
  onChange(listener: BoardChangeListener): void {
    this.listeners.add(listener);
  }

  offChange(listener: BoardChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Marca início de uma operação de drag para otimizações especiais.
   */
  startDragOperation(): void {
    this.isDragOperation = true;
  }

  /**
   * Marca fim de uma operação de drag.
   */
  endDragOperation(): void {
    this.isDragOperation = false;
    this.invalidateCache(); // Força limpeza do cache ao final do drag
  }

  /**
   * Força invalidação completa do cache.
   */
  invalidateCache(): void {
    this.lastViewportQuery = null;
    this.lastViewportResult = [];
    this.dirtyRegions.clear();
  }

  /**
   * Coloca um tile em (x,y). Se sucesso, notifica listeners com lista atualizada.
   * Versão otimizada que só atualiza a região afetada.
   */
  placeTile(x: number, y: number, tile: TileData): boolean {
    const success = this.board.addTile(x, y, tile);
    if (success) {
      this.spatialIndex.addTile(x, y, tile);
      this.markRegionDirty(x, y);
      
      // Durante drag, força re-renderização imediata sem cache
      if (this.isDragOperation) {
        this.invalidateCache();
      }
      
      this.emitChangeOptimized();
    }
    return success;
  }

  /**
   * Remove um tile em (x,y). Se existia e foi removido, notifica listeners.
   * Versão otimizada que só atualiza a região afetada.
   */
  removeTile(x: number, y: number): boolean {
    const success = this.board.removeTile(x, y);
    if (success) {
      this.spatialIndex.removeTile(x, y);
      this.markRegionDirty(x, y);
      
      // Durante drag, força re-renderização imediata sem cache
      if (this.isDragOperation) {
        this.invalidateCache();
      }
      
      this.emitChangeOptimized();
    }
    return success;
  }

  /**
   * Retorna o estado imutável atual do board (lista de TileAtXY).
   * ATENÇÃO: Para boards gigantescos, use getVisibleTiles() em vez disso!
   */
  getState(): TileAtXY[] {
    if (!this.isDragOperation && this.board.getAllTiles().length > 10000) {
      console.warn('getState() pode ser lento para boards gigantescos. Use getVisibleTiles() para melhor performance.');
    }
    return this.board.getAllTiles();
  }

  /**
   * Busca otimizada de tiles dentro de uma região específica.
   * Muito mais eficiente para boards grandes.
   */
  getVisibleTiles(query: SpatialQuery): TileAtXY[] {
    // Durante operações de drag, sempre busca dados frescos para evitar inconsistências
    if (this.isDragOperation) {
      const entries = this.spatialIndex.queryRegion(query);
      return entries.map(entry => ({
        x: entry.x,
        y: entry.y,
        tile: entry.tile
      }));
    }

    // Cache simples para o mesmo viewport (apenas fora de operações de drag)
    if (this.lastViewportQuery && 
        this.lastViewportQuery.minX === query.minX &&
        this.lastViewportQuery.maxX === query.maxX &&
        this.lastViewportQuery.minY === query.minY &&
        this.lastViewportQuery.maxY === query.maxY &&
        this.dirtyRegions.size === 0) {
      return this.lastViewportResult;
    }

    const entries = this.spatialIndex.queryRegion(query);
    const result = entries.map(entry => ({
      x: entry.x,
      y: entry.y,
      tile: entry.tile
    }));

    // Cache o resultado apenas se não estiver em drag
    if (!this.isDragOperation) {
      this.lastViewportQuery = { ...query };
      this.lastViewportResult = result;
      this.dirtyRegions.clear();
    }

    return result;
  }

  /**
   * Busca tiles próximos a um ponto dentro de um raio.
   * Útil para IA, pathfinding, etc.
   */
  getTilesNearPoint(centerX: number, centerY: number, radius: number): TileAtXY[] {
    const entries = this.spatialIndex.queryRadius(centerX, centerY, radius);
    return entries.map(entry => ({
      x: entry.x,
      y: entry.y,
      tile: entry.tile
    }));
  }

  /**
   * Busca eficiente de um tile específico.
   */
  getTileAt(x: number, y: number): TileData | undefined {
    return this.spatialIndex.getTileAt(x, y) || undefined;
  }

  /**
   * Marca uma região como "suja" (que precisa ser re-renderizada).
   */
  private markRegionDirty(x: number, y: number): void {
    // Marca o chunk que contém este tile como sujo
    const chunkSize = 64; // Deveria ser configurável, mas para simplicidade...
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);
    this.dirtyRegions.add(`${chunkX},${chunkY}`);
  }

  /**
   * Notifica listeners de forma otimizada - só envia tiles visíveis se possível.
   */
  private emitChangeOptimized(): void {
    // Durante operações de drag, sempre força refresh completo para evitar bugs visuais
    if (this.isDragOperation) {
      if (this.lastViewportQuery) {
        // Re-busca tiles visíveis sem cache
        const visibleTiles = this.getVisibleTiles(this.lastViewportQuery);
        for (const listener of this.listeners) {
          listener(visibleTiles);
        }
      } else {
        // Fallback para o comportamento original
        const snapshot = this.getState();
        for (const listener of this.listeners) {
          listener(snapshot);
        }
      }
      return;
    }

    // Para boards pequenos ou quando não há viewport definido, sempre usa dados completos
    const totalTiles = this.board.getAllTiles().length;
    const isSmallBoard = totalTiles <= 10000;
    
    if (isSmallBoard || !this.lastViewportQuery) {
      const snapshot = this.getState();
      for (const listener of this.listeners) {
        listener(snapshot);
      }
      return;
    }

    // Para boards grandes com viewport ativo, usa tiles visíveis
    const visibleTiles = this.getVisibleTiles(this.lastViewportQuery);
    for (const listener of this.listeners) {
      listener(visibleTiles);
    }
  }

  /**
   * Define o viewport atual para otimizações.
   * Chame isso quando a câmera se mover para manter o cache atualizado.
   */
  setViewport(query: SpatialQuery): void {
    // Durante drag, não atualiza cache para evitar inconsistências
    if (this.isDragOperation) {
      return;
    }

    this.lastViewportQuery = query;
    this.lastViewportResult = this.getVisibleTiles(query);
  }

  /**
   * Limpa o board por completo e notifica listeners.
   */
  clearBoard(): void {
    this.board.clear();
    this.spatialIndex.clear();
    this.dirtyRegions.clear();
    this.lastViewportQuery = null;
    this.lastViewportResult = [];
    this.isDragOperation = false;
    this.emitChangeOptimized();
  }

  /**
   * Retorna largura e altura do tabuleiro (em tiles).
   */
  getWidth(): number {
    return this.board.getWidth();
  }
  
  getHeight(): number {
    return this.board.getHeight();
  }

  /**
   * Retorna estatísticas de performance do sistema.
   */
  getPerformanceStats(): {
    spatialIndex: ReturnType<SpatialIndex['getStats']>;
    dirtyRegions: number;
    hasCachedViewport: boolean;
    cachedTileCount: number;
    isDragOperation: boolean;
  } {
    return {
      spatialIndex: this.spatialIndex.getStats(),
      dirtyRegions: this.dirtyRegions.size,
      hasCachedViewport: this.lastViewportQuery !== null,
      cachedTileCount: this.lastViewportResult.length,
      isDragOperation: this.isDragOperation,
    };
  }
}
