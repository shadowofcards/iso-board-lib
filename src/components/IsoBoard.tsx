import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TileData, TilePosition } from '../core/models/Tile';
import type { CameraState } from '../core/models/Camera';
import { createDefaultCamera } from '../core/models/Camera';
import { gridToScreen, screenToGrid } from '../core/math/isoCoordinate';
import { applyPan, applyZoom } from '../core/math/cameraMath';
import { PreviewOverlay } from './PreviewOverlay';
import { TileInteractionLayer } from './TileInteractionLayer';
import { IsoBoardCanvas } from './IsoBoardCanvas';
import { CameraHandler } from './CameraHandler';
import { IsoTileInventory } from './IsoTileInventory';
import { useBoardController } from '../hooks/useBoardController';
import { useDragTile } from '../hooks/useDragTile';

export interface IsoBoardProps {
  /**
   * Initial set of tiles on the board.
   * Each TileData has id, type, image, position, size, etc.
   */
  initialTiles: TileData[];
  /**
   * Optional inventory of tiles that the user can add.
   * When provided, tiles appear in the top-left and can be placed on the board.
   */
  availableTiles?: TileData[];
  /**
   * Dimensions of the board in grid units (rows × cols).
   */
  boardSize: { rows: number; cols: number };
  /**
   * Size of each tile in pixels (width × height).
   */
  tileSize: { width: number; height: number };
  /**
   * Callback when an existing tile is clicked.
   */
  onTileClick?: (tile: TileData) => void;
  /**
   * Callback when a tile has been successfully dropped/moved.
   * @param from - Original grid position
   * @param to - Target grid position
   * @param tile - The tile being moved
   * @param fullBoard - Current full list of tiles after move
   */
  onTileDrop?: (
    from: TilePosition,
    to: TilePosition,
    tile: TileData,
    fullBoard: TileData[]
  ) => void;
  /**
   * Optional pre-drop validation. Called before the move is finalized.
   * @param to - Proposed grid position
   * @param tile - The tile being moved
   * @param neighbors - All neighboring tiles (orthogonal + diagonal)
   * @returns false or Promise<false> to cancel the drop
   */
  onTilePreDrop?: (
    to: TilePosition,
    tile: TileData,
    neighbors: TileData[]
  ) => boolean | Promise<boolean>;
  /**
   * Callback whenever the camera state (offset or zoom) changes.
   */
  onCameraChange?: (camera: CameraState) => void;
}

/**
 * IsoBoard
 *
 * Renders an isometric tile board with:
 *  - A canvas for drawing tiles (IsoBoardCanvas),
 *  - A transparent HTML overlay for hit detection and drag events (TileInteractionLayer),
 *  - A semi-transparent preview image during drag (PreviewOverlay),
 *  - Optional inventory panel (IsoTileInventory),
 *  - Camera controls for pan/zoom (CameraHandler).
 *
 * All pan/zoom transformations are applied on the canvas context; hit boxes and preview
 * are positioned in absolute coordinates based on the same transform.
 */
export const IsoBoard: React.FC<IsoBoardProps> = ({
  initialTiles,
  availableTiles = [],
  boardSize,
  tileSize,
  onTileClick,
  onTileDrop,
  onTilePreDrop,
  onCameraChange,
}) => {
  // 1) Board state and utility hooks
  const {
    tiles,
    addTile,
    removeTile,
    moveTile,
    getTileAt,
    getOrthogonalNeighbors,
    getSurroundingTiles,
    canPlaceTileAt,
  } = useBoardController(initialTiles, boardSize);

  // 2) Camera state
  const [camera, setCamera] = useState<CameraState>(createDefaultCamera());

  // 3) Drag/preview state using DragController under the hood
  const {
    dragging,
    startDrag,
    updatePosition: updateDragPosition,
    endDrag,
  } = useDragTile();

  // Notify external listener when camera changes
  const handleCameraChange = useCallback(
    (newCam: CameraState) => {
      setCamera(newCam);
      if (onCameraChange) onCameraChange(newCam);
    },
    [onCameraChange]
  );

  // Pan the camera by dx, dy (in world units)
  const handlePan = useCallback(
    (dx: number, dy: number) => {
      const newCam = applyPan(camera, dx, dy);
      handleCameraChange(newCam);
    },
    [camera, handleCameraChange]
  );

  // Zoom the camera, keeping a specific canvas pixel as the zoom center
  const handleZoom = useCallback(
    (factor: number, centerX: number, centerY: number) => {
      // Convert canvas pixel → grid position before zoom
      const before = screenToGrid(
        centerX / camera.zoom + camera.offsetX,
        centerY / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      // Apply zoom factor
      const newCam = applyZoom(camera, factor);
      // Recompute offset so that 'before' remains at the same canvas pixel
      const afterScreen = gridToScreen(
        before,
        tileSize.width,
        tileSize.height,
        newCam.offsetX,
        newCam.offsetY
      );
      newCam.offsetX = afterScreen.x - centerX / newCam.zoom;
      newCam.offsetY = afterScreen.y - centerY / newCam.zoom;
      handleCameraChange(newCam);
    },
    [camera, handleCameraChange, tileSize]
  );

  // 6) Tile click handler
  const handleTileClick = useCallback(
    (tile: TileData) => {
      if (onTileClick) onTileClick(tile);
    },
    [onTileClick]
  );

  // 7) Start dragging an existing tile
  const handleDragStart = useCallback(
    (tile: TileData) => {
      startDrag(tile);
    },
    [startDrag]
  );

  // 8) Update preview position while dragging (screen → grid)
  const handleDrag = useCallback(
    (_tile: TileData, screenPos: { x: number; y: number }) => {
      const pos = screenToGrid(
        screenPos.x / camera.zoom + camera.offsetX,
        screenPos.y / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      updateDragPosition(pos);
    },
    [camera, tileSize, updateDragPosition]
  );

  // 9) Finalize drop when drag ends
  const handleDragEnd = useCallback(
    (_tile: TileData, screenPos: { x: number; y: number }) => {
      // Retrieve final preview position (tile & grid position)
      const result = endDrag();
      if (!result) return;

      // Convert canvas pixel to grid coordinates for drop
      const to = screenToGrid(
        screenPos.x / camera.zoom + camera.offsetX,
        screenPos.y / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      const draggedTile = _tile;

      // 9.a) Gather orthogonal neighbors (4 directions)
      const orthoNeighbors = getOrthogonalNeighbors(to);

      // 9.b) Gather diagonal neighbors (any surrounding not in orthogonal list)
      const diagonalNeighbors = getSurroundingTiles(to).filter(
        (n) =>
          !orthoNeighbors.some(
            (o) =>
              o.position.row === n.position.row &&
              o.position.col === n.position.col
          )
      );

      // Combine all neighbors
      const allNeighbors = [...orthoNeighbors, ...diagonalNeighbors];

      // 9.c) Pre-drop validation if provided
      if (onTilePreDrop) {
        const valid = onTilePreDrop(to, draggedTile, allNeighbors);
        if (typeof valid === 'boolean') {
          if (!valid) return;
        } else {
          valid.then((ok) => {
            if (!ok) return;
            if (!canPlaceTileAt(to)) return;
            const from = draggedTile.position;
            moveTile(draggedTile.id, to);
            if (onTileDrop) onTileDrop(from, to, draggedTile, tiles);
          });
          return;
        }
      }

      // 9.d) Synchronous flow: check bounds & occupancy
      if (canPlaceTileAt(to)) {
        const from = draggedTile.position;
        moveTile(draggedTile.id, to);
        if (onTileDrop) onTileDrop(from, to, draggedTile, tiles);
      }
    },
    [
      camera,
      endDrag,
      getOrthogonalNeighbors,
      getSurroundingTiles,
      moveTile,
      onTileDrop,
      onTilePreDrop,
      tiles,
      canPlaceTileAt,
      tileSize,
    ]
  );

  // 10) Add a tile from the inventory to the center of the board
  const handleSelectFromInventory = useCallback(
    (tile: TileData) => {
      const centerPos: TilePosition = {
        row: Math.floor(boardSize.rows / 2),
        col: Math.floor(boardSize.cols / 2),
      };
      const newTile: TileData = {
        ...tile,
        position: centerPos,
        size: tileSize,
      };
      addTile(newTile);
    },
    [addTile, boardSize, tileSize]
  );

  // 11) Remove a tile on right-click, if not locked
  const handleTileRemove = useCallback(
    (tile: TileData) => {
      if (!tile.locked) {
        removeTile(tile.id);
      }
    },
    [removeTile]
  );

  // 12) Canvas ref and image cache for performant rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map from image URL → loaded HTMLImageElement
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  // State to force a re-render when a new image finishes loading
  const [, setRenderTrigger] = useState<number>(0);

  // Preload tile images whenever `tiles` changes
  useEffect(() => {
    tiles.forEach((tile) => {
      if (!imageCacheRef.current.has(tile.image)) {
        const img = new Image();
        img.src = tile.image;
        img.onload = () => {
          // Once loaded, trigger a re-render so the canvas can draw it
          setRenderTrigger((r) => r + 1);
        };
        imageCacheRef.current.set(tile.image, img);
      }
    });
  }, [tiles]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Inventory panel in top-left (if provided) */}
      {availableTiles.length > 0 && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          <IsoTileInventory
            availableTiles={availableTiles}
            onSelect={handleSelectFromInventory}
          />
        </div>
      )}

      {/* Isometric canvas renderer */}
      <IsoBoardCanvas
        ref={canvasRef}
        tiles={tiles}
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
        renderTile={(ctx, tile, x, y, _zoom) => {
          // Use cached HTMLImageElement instead of new Image() each frame
          let img = imageCacheRef.current.get(tile.image);
          if (!img) {
            img = new Image();
            img.src = tile.image;
            img.onload = () => setRenderTrigger((r) => r + 1);
            imageCacheRef.current.set(tile.image, img);
          }
          if (img.complete) {
            // Since zoom/pan are handled by canvas transform, draw at (x, y)
            ctx.drawImage(img, x, y, tileSize.width, tileSize.height);
          }
        }}
      />

      {/* Transparent divs for hit detection & drag events */}
      <TileInteractionLayer
        tiles={tiles}
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
        onClick={handleTileClick}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      />

      {/* Semi-transparent preview of the tile being dragged */}
      <PreviewOverlay
        preview={
          dragging ? { tile: dragging.tile, position: dragging.position } : null
        }
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
      />

      {/* Invisible overlay to capture right-clicks for tile removal */}
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const gridPos = screenToGrid(
            (e.clientX - rect.left) / camera.zoom + camera.offsetX,
            (e.clientY - rect.top) / camera.zoom + camera.offsetY,
            tileSize.width,
            tileSize.height,
            0,
            0
          );
          const clickedTile = getTileAt(gridPos);
          if (clickedTile) {
            handleTileRemove(clickedTile);
          }
        }}
      />

      {/* Camera controls for mouse, touch, and keyboard */}
      <CameraHandler
        canvasRef={canvasRef}
        camera={camera}
        onMove={handlePan}
        onZoom={handleZoom}
      />
    </div>
  );
};
