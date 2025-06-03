import { useMemo } from 'react';
import { BoardStateManager } from '../core/engine/BoardStateManager';
import { DragController } from '../core/engine/DragController';
import { Camera } from '../core/models/Camera';
import { TILE_SIZE, TILE_HEIGHT } from '../core/constants';

/**
 * Hook que cria e expõe instâncias de BoardStateManager, DragController e Camera.
 * 
 * - boardConfig: dimensões do tabuleiro em número de tiles.
 * 
 * Retorna:
 * - boardManager: gerencia o estado lógico do board.
 * - dragController: gerencia a lógica de arraste.
 * - cameraModel: gerencia posição e zoom da câmera.
 */
export function useBoardController(boardConfig: { width: number; height: number }) {
  // 1) Cria o BoardStateManager e mantêm a instância imutável via useMemo
  const boardManager = useMemo(
    () => new BoardStateManager(boardConfig.width, boardConfig.height),
    [boardConfig.width, boardConfig.height]
  );

  // 2) Cria a Camera model com dimensões apropriadas
  const cameraModel = useMemo(
    () => {
      // Dimensões padrão para o viewport
      const defaultViewport = { width: 800, height: 600 };
      
      // Calcula o tamanho do board em pixels baseado nas dimensões isométricas
      const boardWidthPx = (boardConfig.width + boardConfig.height) * (TILE_SIZE / 2);
      const boardHeightPx = (boardConfig.width + boardConfig.height) * (TILE_HEIGHT / 2);
      
      return new Camera(
        { x: 0, y: 0 },
        1.0,
        defaultViewport,
        { width: boardWidthPx, height: boardHeightPx },
        false // Ativa navegação livre por padrão
      );
    },
    [boardConfig.width, boardConfig.height]
  );

  // 3) Cria o DragController
  const dragController = useMemo(
    () => new DragController(boardManager),
    [boardManager]
  );

  // 4) Retorno das instâncias
  return {
    boardManager,
    dragController,
    cameraModel,
  };
}
