import React, { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import IsoScene from './scenes/IsoScene';
import IsoTileInventory from './IsoTileInventory';
import CameraHandler from './CameraHandler';
import PreviewOverlay from './PreviewOverlay';
import { useBoardController } from '../hooks/useBoardController';
import { useDragTile } from '../hooks/useDragTile';
import type { TileData } from '../core/models/Tile';
import { AVAILABLE_TILES } from '../core/constants';

interface IsoBoardCanvasProps {
  /** 
   * Number of tiles horizontally on the board. 
   * Determines the logical width (in tiles) for the board model.
   */
  boardWidth: number;
  
  /** 
   * Number of tiles vertically on the board.
   * Determines the logical height (in tiles) for the board model.
   */
  boardHeight: number;
}

/**
 * IsoBoardCanvas - Componente principal que renderiza um tabuleiro isométrico
 * usando Phaser.js para gráficos e React para UI.
 */
export const IsoBoardCanvas: React.FC<IsoBoardCanvasProps> = ({
  boardWidth,
  boardHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // Controladores do board, drag e câmera
  const { boardManager, dragController, cameraModel } = useBoardController({
    width: boardWidth,
    height: boardHeight,
  });

  // Estado de drag do React (para preview)
  const { dragState, onDragStart, onDragMove, onDragEnd } = useDragTile();

  // Handler para início do drag no inventário
  const handleInventoryDragStart = useCallback(
    (tile: TileData, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // Previne seleção de texto
      e.preventDefault();
      
      if (phaserGameRef.current) {
        // Pega a câmera Phaser para converter coordenadas de tela para coordenadas de mundo
        // Isso é necessário porque quando a câmera se move, as coordenadas mudam
        const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
        if (scene && scene.cameras) {
          const cam = scene.cameras.main;
          const rect = containerRef.current.getBoundingClientRect();
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          // Converte coordenadas de tela para coordenadas de mundo
          const worldX = screenX + cam.scrollX;
          const worldY = screenY + cam.scrollY;
          
          onDragStart(tile, { x: e.clientX, y: e.clientY }); // React preview usa coordenadas de tela
          dragController.startDrag(tile, { x: worldX, y: worldY }); // Phaser usa coordenadas de mundo
        } else {
          // Fallback para coordenadas de tela normais
          onDragStart(tile, { x: e.clientX, y: e.clientY });
          dragController.startDrag(tile, { x: e.clientX, y: e.clientY });
        }
      } else {
        // Fallback se o Phaser não estiver disponível
        onDragStart(tile, { x: e.clientX, y: e.clientY });
        dragController.startDrag(tile, { x: e.clientX, y: e.clientY });
      }
    },
    [dragController, onDragStart]
  );

  // Handler para início do drag de tiles do board
  const handleBoardTileDragStart = useCallback(
    (tile: TileData, boardX: number, boardY: number, e: { clientX: number; clientY: number }) => {
      // Remove o tile do board antes de iniciar o drag
      boardManager.removeTile(boardX, boardY);
      
      if (phaserGameRef.current) {
        const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
        if (scene && scene.cameras) {
          const cam = scene.cameras.main;
          const rect = containerRef.current.getBoundingClientRect();
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const worldX = screenX + cam.scrollX;
          const worldY = screenY + cam.scrollY;
          
          onDragStart(tile, { x: e.clientX, y: e.clientY });
          dragController.startDrag(tile, { x: worldX, y: worldY });
        } else {
          onDragStart(tile, { x: e.clientX, y: e.clientY });
          dragController.startDrag(tile, { x: e.clientX, y: e.clientY });
        }
      } else {
        onDragStart(tile, { x: e.clientX, y: e.clientY });
        dragController.startDrag(tile, { x: e.clientX, y: e.clientY });
      }
    },
    [boardManager, dragController, onDragStart]
  );

  // Handler para movimento do mouse durante drag
  const handleWindowMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging && phaserGameRef.current) {
        // Previne seleção de texto durante drag
        e.preventDefault();
        
        // Pega a câmera Phaser para converter coordenadas
        const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
        if (scene && scene.cameras) {
          const cam = scene.cameras.main;
          const rect = containerRef.current.getBoundingClientRect();
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const worldX = screenX + cam.scrollX;
          const worldY = screenY + cam.scrollY;
          
          onDragMove({ x: e.clientX, y: e.clientY }); // React preview usa coordenadas de tela 
          dragController.updateDrag({ x: worldX, y: worldY }); // Phaser usa coordenadas de mundo
        } else {
          // Fallback para coordenadas de tela normais
          onDragMove({ x: e.clientX, y: e.clientY });
          dragController.updateDrag({ x: e.clientX, y: e.clientY });
        }
      }
    },
    [dragController, dragState.isDragging, onDragMove]
  );

  // Handler para fim do drag
  const handleWindowMouseUp = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging && phaserGameRef.current) {
        // Pega a câmera Phaser para converter coordenadas
        const scene = phaserGameRef.current.scene.getScene('IsoScene') as any;
        if (scene && scene.cameras) {
          const cam = scene.cameras.main;
          const rect = containerRef.current.getBoundingClientRect();
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const worldX = screenX + cam.scrollX;
          const worldY = screenY + cam.scrollY;
          
          onDragEnd();
          dragController.endDrag({ x: worldX, y: worldY });
        } else {
          // Fallback para coordenadas de tela normais
          onDragEnd();
          dragController.endDrag({ x: e.clientX, y: e.clientY });
        }
      }
    },
    [dragController, dragState.isDragging, onDragEnd]
  );

  // Effect para listeners globais de drag
  useEffect(() => {
    if (dragState.isDragging) {
      // Adiciona estilos para prevenir seleção de texto
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      // Remove estilos de prevenção de seleção
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState.isDragging, handleWindowMouseMove, handleWindowMouseUp]);

  // Inicialização do Phaser
  useEffect(() => {
    if (!containerRef.current) return;

    // Criar instância da cena isométrica
    const isoScene = new IsoScene({
      boardConfig: { width: boardWidth, height: boardHeight },
      boardManager,
      dragController,
      cameraModel,
      onTileDragStart: handleBoardTileDragStart, // Passa o handler para drag de tiles do board
      onReadyCallback: () => {
        // Scene está pronta
      },
    });

    // Configuração do Phaser
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#023047',
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

    // Cleanup
    return () => {
      boardManager.clearBoard();
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, [boardManager, boardWidth, boardHeight, cameraModel, dragController, handleBoardTileDragStart]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      userSelect: 'none', // Previne seleção de texto no container principal
      WebkitUserSelect: 'none'
    }}>
      {/* Container do Phaser */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />

      {/* Inventário de tiles */}
      <IsoTileInventory
        tiles={AVAILABLE_TILES}
        onDragStart={handleInventoryDragStart}
      />

      {/* Preview de drag - Reabilitado para melhor experiência visual */}
      <PreviewOverlay dragState={dragState} />

      {/* Handler da câmera */}
      <CameraHandler 
        cameraModel={cameraModel} 
        containerRef={containerRef}
        isDragActive={dragState.isDragging} // Desabilita movimento da câmera durante drag
      />
    </div>
  );
};

export default IsoBoardCanvas;
