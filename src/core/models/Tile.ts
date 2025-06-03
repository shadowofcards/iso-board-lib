/**
 * TilePosition
 *
 * Represents a tile’s location on the grid in row and column indices.
 */
export interface TilePosition {
  row: number;
  col: number;
}

/**
 * TileSize
 *
 * Represents the dimensions of a tile in pixels (width × height).
 */
export interface TileSize {
  width: number;
  height: number;
}

/**
 * TileMetadata
 *
 * An optional free-form dictionary for storing additional properties
 * about a tile (e.g., health, owner, or any game-specific data).
 */
export interface TileMetadata {
  [key: string]: unknown;
}

/**
 * TileData
 *
 * Describes a single tile instance on the board:
 *  - id: Unique identifier for this tile
 *  - type: A string to categorize the tile (e.g., "grass", "water", "wall")
 *  - image: URL or path to the tile’s image asset
 *  - position: The tile’s current grid position (row, col)
 *  - size: The tile’s rendered dimensions in pixels
 *  - locked: Optional flag—if true, this tile cannot be moved
 *  - metadata: Optional dictionary for any additional game-specific attributes
 */
export interface TileData {
  /** Unique identifier for the tile instance */
  id: string;
  /** Logical type/category of the tile (used for game logic or styling) */
  type: string;
  /** URL or path to the tile’s image for rendering */
  image: string;

  /** Current grid position of the tile */
  position: TilePosition;
  /** Pixel dimensions used when drawing the tile */
  size: TileSize;

  /** If true, this tile cannot be moved or overwritten */
  locked?: boolean;
  /** Optional additional data, keyed by strings */
  metadata?: TileMetadata;
}
