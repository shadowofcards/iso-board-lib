import React, { useState, useCallback } from 'react';
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
  initialTiles: TileData[];
  availableTiles?: TileData[];
  boardSize: { rows: number; cols: number };
  tileSize: { width: number; height: number };
  onTileClick?: (tile: TileData) => void;
  onTileDrop?: (
    from: TilePosition,
    to: TilePosition,
    tile: TileData,
    fullBoard: TileData[]
  ) => void;
  onTilePreDrop?: (
    to: TilePosition,
    tile: TileData,
    neighbors: TileData[]
  ) => boolean | Promise<boolean>;
  onCameraChange?: (camera: CameraState) => void;
}

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
  // 1) Estado do board + hooks de controle
  const {
    tiles,
    addTile,
    removeTile,
    moveTile,
    getTileAt,
    getNeighbors,
    canPlaceTileAt,
  } = useBoardController(initialTiles, boardSize);

  // 2) Estado da câmera
  const [camera, setCamera] = useState<CameraState>(createDefaultCamera());

  // 3) Hook de arraste (para preview)
  const {
    dragging,
    startDrag,
    updatePosition: updateDragPosition,
    endDrag,
  } = useDragTile();

  // 4) Notifica mudança de câmera
  const handleCameraChange = useCallback(
    (newCam: CameraState) => {
      setCamera(newCam);
      if (onCameraChange) onCameraChange(newCam);
    },
    [onCameraChange]
  );

  // 5) Panning e zoom
  const handlePan = useCallback(
    (dx: number, dy: number) => {
      const newCam = applyPan(camera, dx, dy);
      handleCameraChange(newCam);
    },
    [camera, handleCameraChange]
  );

  const handleZoom = useCallback(
    (factor: number, centerX: number, centerY: number) => {
      // Converte ponto de tela → grid antes do zoom
      const before = screenToGrid(
        centerX / camera.zoom + camera.offsetX,
        centerY / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      const newCam = applyZoom(camera, factor);
      // Recalcula offset para manter 'before' fixo
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

  // 6) Clique em tile existente
  const handleTileClick = useCallback(
    (tile: TileData) => {
      if (onTileClick) onTileClick(tile);
    },
    [onTileClick]
  );

  // 7) Inicia arraste de tile existente
  const handleDragStart = useCallback(
    (tile: TileData) => {
      startDrag(tile);
    },
    [startDrag]
  );

  // 8) Enquanto arrasta, atualiza preview via tela → grid
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

  // 9) Ao terminar arraste, usa screenPos para calcular posição de drop
  const handleDragEnd = useCallback(
    (_tile: TileData, screenPos: { x: number; y: number }) => {
      // Finaliza preview interno
      endDrag();

      // Converte ponto de tela → grid (drop final)
      const to = screenToGrid(
        screenPos.x / camera.zoom + camera.offsetX,
        screenPos.y / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      const draggedTile = _tile;
      const neighbors = getNeighbors(to);

      // 9.1) Validação prévia
      if (onTilePreDrop) {
        const valid = onTilePreDrop(to, draggedTile, neighbors);
        if (typeof valid === 'boolean') {
          if (!valid) return;
        } else {
          valid.then(ok => {
            if (!ok) return;
            const from = draggedTile.position;
            moveTile(draggedTile.id, to);
            if (onTileDrop) onTileDrop(from, to, draggedTile, tiles);
          });
          return;
        }
      }

      // 9.2) Verifica limites e ocupação
      if (canPlaceTileAt(to)) {
        const from = draggedTile.position;
        moveTile(draggedTile.id, to);
        if (onTileDrop) onTileDrop(from, to, draggedTile, tiles);
      }
    },
    [
      camera,
      endDrag,
      getNeighbors,
      moveTile,
      onTileDrop,
      onTilePreDrop,
      tiles,
      canPlaceTileAt,
      tileSize,
    ]
  );

  // 10) Adiciona tile do inventário no centro do board
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

  // 11) Remove tile existente com clique direito (se não estiver locked)
  const handleTileRemove = useCallback(
    (tile: TileData) => {
      if (!tile.locked) {
        removeTile(tile.id);
      }
    },
    [removeTile]
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Inventário de tiles (caso exista) */}
      {availableTiles.length > 0 && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          <IsoTileInventory
            availableTiles={availableTiles}
            onSelect={handleSelectFromInventory}
          />
        </div>
      )}

      {/* Canvas isométrico */}
      <IsoBoardCanvas
        tiles={tiles}
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
        renderTile={(ctx, tile, x, y, zoom) => {
          const img = new Image();
          img.src = tile.image;
          ctx.drawImage(
            img,
            x * zoom,
            y * zoom,
            tileSize.width * zoom,
            tileSize.height * zoom
          );
        }}
      />

      {/* Camada de interação (hit boxes isométricas) */}
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

      {/* Preview do tile sendo arrastado */}
      <PreviewOverlay
        preview={
          dragging
            ? { tile: dragging.tile, position: dragging.position }
            : null
        }
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
      />

      {/* Camada invisível que captura clique direito para remover tile */}
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onContextMenu={e => {
          e.preventDefault();
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
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

      {/* Controlador de câmera (teclado, mouse, touch) */}
      <CameraHandler camera={camera} onMove={handlePan} onZoom={handleZoom} />
    </div>
  );
};
