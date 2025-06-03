import { Board, type TileAtXY } from '../models/Board';
import type { TileData } from '../models/Tile';

/**
 * Gerencia o estado do tabuleiro e notifica listeners sempre que há mudança.
 * Pode-se conectar lógica de rede (socket) ou validações mais complexas.
 */

export type BoardChangeListener = (tiles: TileAtXY[]) => void;

export class BoardStateManager {
  private board: Board;
  private listeners: Set<BoardChangeListener>;

  constructor(width: number, height: number) {
    this.board = new Board(width, height);
    this.listeners = new Set();
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
   * Coloca um tile em (x,y). Se sucesso, notifica listeners com lista atualizada.
   */
  placeTile(x: number, y: number, tile: TileData): boolean {
    const success = this.board.addTile(x, y, tile);
    if (success) {
      this.emitChange();
    }
    return success;
  }

  /**
   * Remove um tile em (x,y). Se existia e foi removido, notifica listeners.
   */
  removeTile(x: number, y: number): boolean {
    const success = this.board.removeTile(x, y);
    if (success) {
      this.emitChange();
    }
    return success;
  }

  /**
   * Retorna o estado imutável atual do board (lista de TileAtXY).
   */
  getState(): TileAtXY[] {
    return this.board.getAllTiles();
  }

  /**
   * Notifica todos listeners com o array completo de TileAtXY.
   */
  private emitChange(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /**
   * Limpa o board por completo e notifica listeners.
   */
  clearBoard(): void {
    this.board.clear();
    this.emitChange();
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
}
