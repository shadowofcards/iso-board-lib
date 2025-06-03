/* src/components/IsoBoardCanvas.tsx */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import IsoScene from './scenes/IsoScene';
import IsoTileInventory from './IsoTileInventory';
import CameraHandler from './CameraHandler';
import PreviewOverlay from './PreviewOverlay';
import TileInfoPopup from './TileInfoPopup';
import { useBoardController } from '../hooks/useBoardController';
import { useDragTile } from '../hooks/useDragTile';
import type { TileData } from '../core/models/Tile';
import { AVAILABLE_TILES } from '../core/constants';

interface IsoBoardCanvasProps {
  boardWidth: number;
  boardHeight: number;
}

export const IsoBoardCanvas: React.FC<IsoBoardCanvasProps> = ({
  boardWidth,
  boardHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // Estado para o popup de informações
  const [tileInfoPopup, setTileInfoPopup] = useState<{
    tile: TileData;
    position: { x: number; y: number };
  } | null>(null);

  const { boardManager, dragController, cameraModel } = useBoardController({
    width: boardWidth,
    height: boardHeight,
  });

  const { dragState, onDragStart, onDragMove, onDragEnd } = useDragTile();

  // Previne o menu contextual padrão no container principal
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handler para informações do tile
  const handleTileInfo = useCallback((tile: TileData, position: { x: number; y: number }) => {
    setTileInfoPopup({ tile, position });
  }, []);

  // Handler para fechar popup
  const handleClosePopup = useCallback(() => {
    setTileInfoPopup(null);
  }, []);

  const convertToWorldCoords = useCallback((clientX: number, clientY: number) => {
    if (!phaserGameRef.current || !containerRef.current) {
      return { worldX: clientX, worldY: clientY };
    }
    const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
    if (!scene || !scene.cameras) {
      return { worldX: clientX, worldY: clientY };
    }
    const cam = scene.cameras.main;
    const rect = containerRef.current.getBoundingClientRect();

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const { x: worldX, y: worldY } = cam.getWorldPoint(localX, localY);
    return { worldX, worldY };
  }, []);

  const handleInventoryDragStart = useCallback(
    (tile: TileData, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
      onDragStart(tile, { x: e.clientX, y: e.clientY });
      dragController.startDrag(tile, { x: worldX, y: worldY });
    },
    [dragController, onDragStart, convertToWorldCoords]
  );

  const handleBoardTileDragStart = useCallback(
    (tile: TileData, boardX: number, boardY: number, e: { clientX: number; clientY: number }) => {
      // Marca início da operação de drag para otimizações especiais
      boardManager.startDragOperation();
      
      // Remove o tile do board
      boardManager.removeTile(boardX, boardY);
      
      // Inicia o drag
      const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
      onDragStart(tile, { x: e.clientX, y: e.clientY });
      dragController.startDrag(tile, { x: worldX, y: worldY });
    },
    [boardManager, dragController, onDragStart, convertToWorldCoords]
  );

  const handleWindowMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
        onDragMove({ x: e.clientX, y: e.clientY });
        dragController.updateDrag({ x: worldX, y: worldY });
      }
    },
    [dragController, dragState.isDragging, onDragMove, convertToWorldCoords]
  );

  const handleWindowMouseUp = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        const { worldX, worldY } = convertToWorldCoords(e.clientX, e.clientY);
        onDragEnd();
        
        // Finaliza o drag
        dragController.endDrag({ x: worldX, y: worldY });
        
        // Marca fim da operação de drag sempre, independente do sucesso
        boardManager.endDragOperation();
      }
    },
    [dragController, dragState.isDragging, onDragEnd, convertToWorldCoords, boardManager]
  );

  useEffect(() => {
    if (dragState.isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState.isDragging, handleWindowMouseMove, handleWindowMouseUp]);

  useEffect(() => {
    if (!containerRef.current) return;

    const isoScene = new IsoScene({
      boardConfig: { width: boardWidth, height: boardHeight },
      boardManager,
      dragController,
      cameraModel,
      onTileDragStart: handleBoardTileDragStart,
      onTileInfo: handleTileInfo,
      onReadyCallback: () => {},
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      transparent: true,
      scene: [isoScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
      },
    });

    phaserGameRef.current = game;

    return () => {
      boardManager.clearBoard();
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, [boardManager, boardWidth, boardHeight, cameraModel, dragController, handleBoardTileDragStart, handleTileInfo]);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        backgroundColor: '#023047', 
        userSelect: 'none', 
        WebkitUserSelect: 'none' 
      }}
      onContextMenu={handleContextMenu}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
      <IsoTileInventory tiles={AVAILABLE_TILES} onDragStart={handleInventoryDragStart} />
      <PreviewOverlay dragState={dragState} />
      <CameraHandler cameraModel={cameraModel} containerRef={containerRef} isDragActive={dragState.isDragging} />
      <TileInfoPopup 
        tile={tileInfoPopup?.tile || null}
        position={tileInfoPopup?.position || null}
        onClose={handleClosePopup}
      />
    </div>
  );
};

export default IsoBoardCanvas;
