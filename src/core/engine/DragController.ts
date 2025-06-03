import { BoardStateManager } from './BoardStateManager';
import type { TileData } from '../models/Tile';
import { screenToTileWithSnap } from '../math/isoCoordinate';
import { TILE_SIZE, TILE_HEIGHT } from '../constants';

/**
 * Descreve o estado atual de drag & preview:
 * - isDragging: se já iniciamos arraste de um tile.
 * - tile: dados do tile que está sendo arrastado (ou null).
 * - ghostPos: posição de tela (em pixels) onde o "fantasma" do tile deve ser desenhado.
 *   Null se não estiver em arraste.
 */
export type DragState = {
  isDragging: boolean;
  tile: TileData | null;
  ghostPos: { x: number; y: number } | null; // em px na tela
};

/**
 * Controlador de arraste: recebe tile, rastreia movimento, calcula tileX/tileY finais
 * e dispara onDrop se posição válida. Precisa de BoardStateManager para gerenciar o estado.
 */
export class DragController {
  private boardManager: BoardStateManager;
  private listenersDrop: Set<(x: number, y: number, tile: TileData) => void>;
  private state: DragState;
  private offsets: { offsetX: number; offsetY: number } = { offsetX: 0, offsetY: 0 };

  constructor(boardManager: BoardStateManager) {
    this.boardManager = boardManager;
    this.listenersDrop = new Set();
    this.state = {
      isDragging: false,
      tile: null,
      ghostPos: null,
    };
  }

  /**
   * Define os offsets a serem usados para conversão de coordenadas.
   * Deve ser chamado pela IsoScene para sincronizar com o sistema de rendering.
   */
  setOffsets(offsetX: number, offsetY: number): void {
    this.offsets = { offsetX, offsetY };
  }

  /**
   * Inicia o arraste de um tile. `startScreen` são coordenadas de tela em px onde o
   * usuário clicou/começou o drag.
   */
  startDrag(tile: TileData, startScreen: { x: number; y: number }): void {
    this.state.isDragging = true;
    this.state.tile = tile;
    this.state.ghostPos = { x: startScreen.x, y: startScreen.y };
  }

  /**
   * Atualiza o posicionamento do "fantasma" conforme o mouse/toque se move.
   */
  updateDrag(screenPos: { x: number; y: number }): void {
    if (!this.state.isDragging || !this.state.tile) return;
    this.state.ghostPos = { x: screenPos.x, y: screenPos.y };
  }

  /**
   * Tenta finalizar o arraste: converte screenPos (em px) para (tileX,tileY), tenta inserir.
   * Se inserir com sucesso, retorna true e dispara listeners de drop.
   * Em qualquer caso, reinicia `state` para "sem arraste".
   */
  endDrag(screenPos: { x: number; y: number }): boolean {
    if (!this.state.isDragging || !this.state.tile) {
      this.clearState();
      return false;
    }

    // Usa exatamente a mesma lógica que o ghost visual para garantir consistência
    const tileCoords = screenToTileWithSnap(
      screenPos.x - this.offsets.offsetX,
      screenPos.y - this.offsets.offsetY,
      TILE_SIZE,
      TILE_HEIGHT,
      this.boardManager.getWidth(),
      this.boardManager.getHeight()
    );

    // Se não conseguiu encontrar um tile válido próximo, falha
    if (!tileCoords) {
      this.clearState();
      return false;
    }

    const { tileX: x, tileY: y } = tileCoords;
    const tileData = this.state.tile;
    
    console.log('Drop: ghost shows', { x, y }, 'placing at', { x, y });
    
    let success = false;
    
    // Tenta colocar no tabuleiro
    if (this.boardManager.placeTile(x, y, tileData)) {
      success = true;
      // Dispara callbacks de drop para renderização por quem estiver ouvindo
      for (const cb of this.listenersDrop) {
        cb(x, y, tileData);
      }
    }
    
    // independentemente de ter sido colocado, limpamos o estado
    this.clearState();
    return success;
  }

  /**
   * Limpa estado interno de arraste.
   */
  private clearState(): void {
    this.state = {
      isDragging: false,
      tile: null,
      ghostPos: null,
    };
  }

  /**
   * Retorna cópia do DragState atual.
   */
  getState(): DragState {
    return {
      isDragging: this.state.isDragging,
      tile: this.state.tile ? { ...this.state.tile } : null,
      ghostPos: this.state.ghostPos
        ? { x: this.state.ghostPos.x, y: this.state.ghostPos.y }
        : null,
    };
  }

  /**
   * Registra um listener que será chamado quando um tile for dropado com sucesso.
   * Callback recebe (x, y, tileData).
   */
  onDrop(callback: (x: number, y: number, tile: TileData) => void): void {
    this.listenersDrop.add(callback);
  }

  offDrop(callback: (x: number, y: number, tile: TileData) => void): void {
    this.listenersDrop.delete(callback);
  }
}
