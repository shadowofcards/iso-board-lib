import type { TileData, TilePosition } from '../models/Tile';

/**
 * Responsável apenas por gerenciar o estado de “arraste” e “preview” de um tile.
 */
export class DragController {
  private draggingTile: TileData | null = null;
  private previewPosition: TilePosition | null = null;

  /**
   * Inicia o arraste de um tile, gravando-o internamente e definindo posição inicial de preview.
   */
  startDrag(tile: TileData) {
    this.draggingTile = tile;
    this.previewPosition = tile.position;
  }

  /**
   * Atualiza, durante o arraste, a posição de preview (posição lógica no grid).
   */
  updatePreviewPosition(position: TilePosition) {
    if (this.draggingTile) {
      this.previewPosition = position;
    }
  }

  /**
   * Finaliza o arraste:
   * - Retorna os dados { tile, position } (posição final do preview).
   * - Limpa o estado interno.
   */
  endDrag(): { tile: TileData; position: TilePosition } | null {
    if (this.draggingTile && this.previewPosition) {
      const result = { tile: this.draggingTile, position: this.previewPosition };
      this.draggingTile = null;
      this.previewPosition = null;
      return result;
    }
    return null;
  }

  /**
   * Retorna o estado atual do preview, ou null se não estiver arrastando nada.
   */
  getPreview(): { tile: TileData; position: TilePosition } | null {
    if (this.draggingTile && this.previewPosition) {
      return { tile: this.draggingTile, position: this.previewPosition };
    }
    return null;
  }
}
