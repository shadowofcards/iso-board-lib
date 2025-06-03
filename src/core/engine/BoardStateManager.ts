import type { TileData } from '../models/Tile';

export class BoardStateManager {
  private tiles: TileData[];

  constructor(initialTiles: TileData[] = []) {
    this.tiles = [...initialTiles];
  }

  getTiles(): TileData[] {
    return [...this.tiles];
  }

  applyEvent(event: { type: 'add' | 'remove' | 'move'; payload: any }) {
    switch (event.type) {
      case 'add':
        this.tiles.push(event.payload);
        break;
      case 'remove':
        this.tiles = this.tiles.filter(t => t.id !== event.payload.id);
        break;
      case 'move':
        this.tiles = this.tiles.map(t =>
          t.id === event.payload.id
            ? { ...t, position: event.payload.to }
            : t
        );
        break;
    }
  }
}
