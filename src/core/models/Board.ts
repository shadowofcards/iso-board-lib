import type { TileData } from './Tile';

/**
 * Representa o tabuleiro de forma genérica: mantém uma matriz interna ou map
 * que associa coordenadas (x,y) a um TileData.
 * 
 * Esta classe NÃO se preocupa com renderização nem Phaser – apenas regras de domínio.
 */

export interface TileAtXY {
  x: number;
  y: number;
  tile: TileData;
}

export class Board {
  private width: number;
  private height: number;
  // Representação interna: Map de “x,y” → TileData
  private grid: Map<string, TileData>;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = new Map();
  }

  /**
   * Gera a chave interna “x,y” para o Map.
   */
  private static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Retorna true se (x,y) está dentro dos limites do tabuleiro (0 <= x < width, 0 <= y < height).
   */
  isInside(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Adiciona (ou substitui) um tile em (x,y). Retorna false se coordenada inválida.
   */
  addTile(x: number, y: number, tile: TileData): boolean {
    if (!this.isInside(x, y)) return false;
    const k = Board.key(x, y);
    this.grid.set(k, tile);
    return true;
  }

  /**
   * Remove o tile em (x,y). Retorna true se existia e foi removido; false caso contrário.
   */
  removeTile(x: number, y: number): boolean {
    if (!this.isInside(x, y)) return false;
    const k = Board.key(x, y);
    return this.grid.delete(k);
  }

  /**
   * Retorna o tile em (x,y) ou undefined se estiver vazio ou fora.
   */
  getTile(x: number, y: number): TileData | undefined {
    if (!this.isInside(x, y)) return undefined;
    return this.grid.get(Board.key(x, y));
  }

  /**
   * Retorna uma lista de todos tiles posicionados no board, no formato {x, y, tile}.
   */
  getAllTiles(): TileAtXY[] {
    const result: TileAtXY[] = [];
    for (const [key, tile] of this.grid.entries()) {
      const [xs, ys] = key.split(',').map((n) => parseInt(n, 10));
      result.push({ x: xs, y: ys, tile });
    }
    return result;
  }

  /**
   * Retorna o tamanho do tabuleiro (em tiles).
   */
  getWidth(): number {
    return this.width;
  }
  getHeight(): number {
    return this.height;
  }

  /**
   * Limpa todo o tabuleiro.
   */
  clear(): void {
    this.grid.clear();
  }
}
