export interface TilePosition {
  row: number;
  col: number;
}

export interface TileSize {
  width: number;
  height: number;
}

export interface TileMetadata {
  [key: string]: unknown;
}

export interface TileData {
  id: string;
  type: string;
  image: string;

  position: TilePosition;
  size: TileSize;

  locked?: boolean;
  metadata?: TileMetadata;
}
