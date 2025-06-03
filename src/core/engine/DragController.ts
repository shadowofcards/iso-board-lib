import type { TileData, TilePosition } from '../models/Tile';

export class DragController {
  private draggingTile: TileData | null = null;
  private previewPosition: TilePosition | null = null;

  startDrag(tile: TileData) {
    this.draggingTile = tile;
    this.previewPosition = tile.position;
  }

  updatePreviewPosition(position: TilePosition) {
    if (this.draggingTile) {
      this.previewPosition = position;
    }
  }

  endDrag(): { tile: TileData; to: TilePosition } | null {
    if (this.draggingTile && this.previewPosition) {
      const result = { tile: this.draggingTile, to: this.previewPosition };
      this.draggingTile = null;
      this.previewPosition = null;
      return result;
    }
    return null;
  }

  getPreview(): { tile: TileData; position: TilePosition } | null {
    if (this.draggingTile && this.previewPosition) {
      return { tile: this.draggingTile, position: this.previewPosition };
    }
    return null;
  }
}
