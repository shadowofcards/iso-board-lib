import type { TileData } from '../models/Tile';

interface BoardEvent {
  /** Event type: "add", "remove", or "move" */
  type: 'add' | 'remove' | 'move';
  /**
   * Payload for the event:
   *  - "add": payload is a TileData to insert
   *  - "remove": payload is an object with `id` of the tile to remove
   *  - "move": payload is an object with `id` and `to: TilePosition`
   */
  payload: any;
}

/**
 * BoardStateManager
 *
 * Handles an in‐memory array of TileData and applies simple CRUD events:
 *  - "add": pushes a new tile
 *  - "remove": filters out a tile by id
 *  - "move": updates an existing tile’s position
 *
 * Provides:
 *  - getTiles(): returns a shallow copy of the current tile list
 *  - applyEvent(): mutates the internal tile array according to the event
 */
export class BoardStateManager {
  private tiles: TileData[];

  /**
   * @param initialTiles - Optional array of TileData to seed the board state
   */
  constructor(initialTiles: TileData[] = []) {
    // Clone the initial array so external changes don’t affect internal state
    this.tiles = [...initialTiles];
  }

  /**
   * Returns a shallow copy of the internal TileData array.
   * @returns Array<TileData>
   */
  getTiles(): TileData[] {
    return [...this.tiles];
  }

  /**
   * Applies a board event to mutate the internal tiles list.
   * Supports three event types:
   *  - "add": payload is the new TileData to append
   *  - "remove": payload should contain { id: string } to filter out
   *  - "move": payload must contain { id: string, to: TilePosition }
   *
   * @param event - The board event to apply
   */
  applyEvent(event: BoardEvent) {
    switch (event.type) {
      case 'add':
        // Append the new tile
        this.tiles.push(event.payload);
        break;

      case 'remove':
        // Remove any tile whose id matches payload.id
        this.tiles = this.tiles.filter((t) => t.id !== event.payload.id);
        break;

      case 'move':
        // Map through tiles, updating the matching tile’s position
        this.tiles = this.tiles.map((t) =>
          t.id === event.payload.id
            ? { ...t, position: event.payload.to }
            : t
        );
        break;
    }
  }
}
