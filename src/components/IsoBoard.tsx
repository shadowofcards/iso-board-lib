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
    getOrthogonalNeighbors,
    getSurroundingTiles,
    canPlaceTileAt,
  } = useBoardController(initialTiles, boardSize);

  // 2) Estado da câmera
  const [camera, setCamera] = useState<CameraState>(createDefaultCamera());

  // 3) Hook de arraste (preview) usando DragController
  const {
    dragging,
    startDrag,
    updatePosition: updateDragPosition,
    endDrag,
  } = useDragTile();

  // 4) Notifica mudança de câmera ao callback externo
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
      // Converte ponto da tela para grid antes do zoom
      const before = screenToGrid(
        centerX / camera.zoom + camera.offsetX,
        centerY / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      // Aplica zoom
      const newCam = applyZoom(camera, factor);
      // Recalcula offset para manter “before” no mesmo ponto de tela
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

  // 8) Enquanto arrasta, atualiza preview (screen → grid)
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
      // Finaliza preview interno e obtém { tile, position }
      const result = endDrag();
      if (!result) return;

      // Converte ponto final de tela para posição de grid (drop)
      const to = screenToGrid(
        screenPos.x / camera.zoom + camera.offsetX,
        screenPos.y / camera.zoom + camera.offsetY,
        tileSize.width,
        tileSize.height,
        0,
        0
      );
      const draggedTile = _tile;

      // 9.a) Buscar vizinhos ortogonais (4 direções)
      const orthoNeighbors = getOrthogonalNeighbors(to);

      // 9.b) Buscar vizinhos diagonais (sem incluir ortogonais)
      const diagonalNeighbors = getSurroundingTiles(to).filter(
        (n) =>
          !orthoNeighbors.some(
            (o) =>
              o.position.row === n.position.row &&
              o.position.col === n.position.col
          )
      );

      // Concatena ortogonais + diagonais para lista completa
      const allNeighbors = [...orthoNeighbors, ...diagonalNeighbors];

      // 9.c) Validação prévia (callback)
      if (onTilePreDrop) {
        const valid = onTilePreDrop(to, draggedTile, allNeighbors);
        if (typeof valid === 'boolean') {
          if (!valid) return;
          // Se valid for true, prossegue
        } else {
          valid.then((ok) => {
            if (!ok) return;
            // Recheca colisão/limites antes de mover
            if (!canPlaceTileAt(to)) return;
            const from = draggedTile.position;
            moveTile(draggedTile.id, to);
            if (onTileDrop) onTileDrop(from, to, draggedTile, tiles);
          });
          return;
        }
      }

      // 9.d) Fluxo síncrono: verifica limites e ocupação
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

  // 12) Ref para o <canvas> e cache de imagens
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cache de imagens: URL → HTMLImageElement
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  // Estado para forçar re-render quando uma nova imagem carrega
  const [, setRenderTrigger] = useState<number>(0);

  // Pré-carrega as imagens sempre que `tiles` mudar
  useEffect(() => {
    tiles.forEach((tile) => {
      if (!imageCacheRef.current.has(tile.image)) {
        const img = new Image();
        img.src = tile.image;
        img.onload = () => {
          // Quando carregar, forçar re-render para desenhar o canvas com imagem pronta
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
      {/* Inventário de tiles (se fornecido) */}
      {availableTiles.length > 0 && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          <IsoTileInventory
            availableTiles={availableTiles}
            onSelect={handleSelectFromInventory}
          />
        </div>
      )}

      {/* Canvas isométrico que desenha todos os tiles */}
      <IsoBoardCanvas
        ref={canvasRef}
        tiles={tiles}
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
        renderTile={(ctx, tile, x, y, _zoom) => {
          // Usa o cache de imagens em vez de criar new Image() a cada frame
          let img = imageCacheRef.current.get(tile.image);
          if (!img) {
            img = new Image();
            img.src = tile.image;
            img.onload = () => setRenderTrigger((r) => r + 1);
            imageCacheRef.current.set(tile.image, img);
          }
          if (img.complete) {
            ctx.drawImage(img, x, y, tileSize.width, tileSize.height);
          }
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

      {/* Preview semi-transparente do tile em arraste */}
      <PreviewOverlay
        preview={
          dragging ? { tile: dragging.tile, position: dragging.position } : null
        }
        tileSize={tileSize}
        cameraOffset={{ x: camera.offsetX, y: camera.offsetY }}
        cameraZoom={camera.zoom}
      />

      {/* Camada transparente que captura clique direito para remover tile */}
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

      {/* Controlador de câmera (teclado, mouse, touch) */}
      <CameraHandler
        canvasRef={canvasRef}
        camera={camera}
        onMove={handlePan}
        onZoom={handleZoom}
      />
    </div>
  );
};
