import type { TileData, TilePosition } from '../models/Tile';

/**
 * DragController
 *
 * Manages the internal state of dragging a tile and providing a “preview” position.
 * This class does not perform any rendering; it only tracks which tile is being dragged
 * and what its current preview position (grid coordinates) is.
 */
export class DragController {
  private draggingTile: TileData | null = null;
  private previewPosition: TilePosition | null = null;

  /**
   * Begins dragging the specified tile.
   * Sets both the internal draggingTile and initial previewPosition.
   *
   * @param tile - The TileData that the user has started dragging
   */
  startDrag(tile: TileData) {
    this.draggingTile = tile;
    this.previewPosition = tile.position;
  }

  /**
   * Updates the preview position during a drag operation.
   * Calling this method should correspond to recalculating the tile’s grid position
   * based on the current pointer location (converted to grid coordinates externally).
   *
   * @param position - The new grid position to preview
   */
  updatePreviewPosition(position: TilePosition) {
    if (this.draggingTile) {
      this.previewPosition = position;
    }
  }

  /**
   * Ends the drag operation:
   *  - Returns an object containing the tile and its final preview position.
   *  - Clears the internal dragging state (draggingTile and previewPosition).
   *
   * @returns An object { tile, position } if a drag was in progress, otherwise null.
   */
  endDrag(): { tile: TileData; position: TilePosition } | null {
    if (this.draggingTile && this.previewPosition) {
      const result = {
        tile: this.draggingTile,
        position: this.previewPosition,
      };
      this.draggingTile = null;
      this.previewPosition = null;
      return result;
    }
    return null;
  }

  /**
   * Returns the current preview information without ending the drag.
   * If no drag is in progress, returns null.
   *
   * @returns An object { tile, position } if dragging, otherwise null.
   */
  getPreview(): { tile: TileData; position: TilePosition } | null {
    if (this.draggingTile && this.previewPosition) {
      return {
        tile: this.draggingTile,
        position: this.previewPosition,
      };
    }
    return null;
  }
}
