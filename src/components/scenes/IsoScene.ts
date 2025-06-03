import Phaser from 'phaser';
import { BoardStateManager, type BoardChangeListener } from '../../core/engine/BoardStateManager';
import { DragController, type DragState } from '../../core/engine/DragController';
import { Camera as CameraModel } from '../../core/models/Camera';
import { toScreenPos, screenToTileWithSnap } from '../../core/math/isoCoordinate';
import { TILE_SIZE, TILE_HEIGHT, calculateIsoOffsets } from '../../core/constants';
import type { TileData } from '../../core/models/Tile';

interface IsoSceneConfig {
  boardConfig: { width: number; height: number };
  boardManager: BoardStateManager;
  dragController: DragController;
  cameraModel: CameraModel;
  onTileDragStart?: (tile: TileData, boardX: number, boardY: number, e: { clientX: number; clientY: number }) => void;
  onReadyCallback: () => void;
}

/**
 * Cena principal do Phaser que desenha o tabuleiro isométrico
 */
export default class IsoScene extends Phaser.Scene {
  private boardManager!: BoardStateManager;
  private dragController!: DragController;
  private cameraModel!: CameraModel;
  private boardConfig!: { width: number; height: number };
  private graphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private ghostGraphics!: Phaser.GameObjects.Graphics;
  private changeListener!: BoardChangeListener;
  private onReadyCallback!: () => void;
  private onTileDragStart?: (tile: TileData, boardX: number, boardY: number, e: { clientX: number; clientY: number }) => void;

  constructor(config: IsoSceneConfig) {
    super({ key: 'IsoScene' });
    this.boardManager = config.boardManager;
    this.dragController = config.dragController;
    this.cameraModel = config.cameraModel;
    this.boardConfig = config.boardConfig;
    this.onReadyCallback = config.onReadyCallback;
    this.onTileDragStart = config.onTileDragStart;
  }

  preload(): void {
    // Não há assets externos
  }

  create(): void {
    // Adiciona um fundo para melhor visualização
    const background = this.add.graphics();
    background.fillStyle(0x1a1a1a, 1.0);
    background.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Adiciona texto de debug
    this.add.text(10, 10, 'Tabuleiro Isométrico Carregado!', {
      fontSize: '16px',
      color: '#ffffff'
    });

    // Graphics para o grid do tabuleiro
    this.gridGraphics = this.add.graphics();
    
    // Graphics para os tiles colocados
    this.graphics = this.add.graphics();
    
    // Graphics separado para o ghost tile (com maior depth para ficar por cima)
    this.ghostGraphics = this.add.graphics();
    this.ghostGraphics.setDepth(100);

    // Define os offsets no DragController para sincronização
    this.syncDragControllerOffsets();

    // Desenha o grid inicial do tabuleiro
    this.drawGrid();

    // Configura listener de mudança do Board
    this.changeListener = (tiles) => {
      this.redrawBoard(tiles);
    };
    this.boardManager.onChange(this.changeListener);

    // Desenha o board inicial (vazio)
    this.redrawBoard(this.boardManager.getState());

    // Configura input handlers
    this.setupInputHandlers();

    // Notifica que a cena está pronta
    this.onReadyCallback();
  }

  /**
   * Sincroniza os offsets com o DragController
   */
  private syncDragControllerOffsets(): void {
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width, 
      this.cameras.main.height
    );
    this.dragController.setOffsets(offsetX, offsetY);
  }

  /**
   * Desenha o grid do tabuleiro isométrico
   */
  private drawGrid(): void {
    this.gridGraphics.clear();
    
    // Offset para centralizar o grid na tela usando função utilitária
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width, 
      this.cameras.main.height
    );

    // Adiciona texto informativo sobre o board
    this.add.text(10, 40, `Board: ${this.boardConfig.width}x${this.boardConfig.height} tiles`, {
      fontSize: '14px',
      color: '#cccccc'
    });

    // Desenha as linhas do grid isométrico com cor mais visível
    this.gridGraphics.lineStyle(2, 0xaaaaaa, 1.0);

    for (let x = 0; x < this.boardConfig.width; x++) {
      for (let y = 0; y < this.boardConfig.height; y++) {
        const { x: screenX, y: screenY } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
        const worldX = screenX + offsetX;
        const worldY = screenY + offsetY;

        // Desenha o diamante do tile
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(worldX, worldY - TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(worldX + TILE_SIZE / 2, worldY);
        this.gridGraphics.lineTo(worldX, worldY + TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(worldX - TILE_SIZE / 2, worldY);
        this.gridGraphics.closePath();
        this.gridGraphics.strokePath();

        // Adiciona um pequeno ponto no centro de cada tile para melhor visualização
        this.gridGraphics.fillStyle(0x666666, 0.8);
        this.gridGraphics.fillCircle(worldX, worldY, 2);
      }
    }

    // Adiciona alguns tiles de exemplo para testar
    this.addExampleTiles();
  }

  /**
   * Adiciona alguns tiles de exemplo para mostrar que o sistema funciona
   */
  private addExampleTiles(): void {
    // Adiciona alguns tiles de exemplo
    const exampleTiles = [
      { x: 0, y: 0, color: 0x8ecae6 },
      { x: 1, y: 0, color: 0xffb703 },
      { x: 0, y: 1, color: 0x43a047 },
      { x: 2, y: 1, color: 0xff006e },
      { x: 1, y: 2, color: 0x8338ec },
    ];

    exampleTiles.forEach(({ x, y, color }) => {
      if (x < this.boardConfig.width && y < this.boardConfig.height) {
        this.boardManager.placeTile(x, y, {
          id: `example-${x}-${y}`,
          type: 'example',
          color: color,
        });
      }
    });
  }

  /**
   * Converte coordenadas de tela para coordenadas de mundo considerando a câmera
   */
  private screenToWorldCoords(screenX: number, screenY: number): { worldX: number; worldY: number } {
    const cam = this.cameras.main;
    const worldX = screenX + cam.scrollX;
    const worldY = screenY + cam.scrollY;
    return { worldX, worldY };
  }

  /**
   * Configura os handlers de input
   */
  private setupInputHandlers(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) {
        // Converte coordenadas da tela para coordenadas de mundo
        const { worldX, worldY } = this.screenToWorldCoords(pointer.x, pointer.y);
        this.dragController.updateDrag({ x: worldX, y: worldY });
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const state: DragState = this.dragController.getState();
      if (state.isDragging && state.tile) {
        // Converte coordenadas da tela para coordenadas de mundo
        const { worldX, worldY } = this.screenToWorldCoords(pointer.x, pointer.y);
        this.dragController.endDrag({ x: worldX, y: worldY });
      }
    });

    // Handler para clique em tiles do board (para drag de tiles existentes)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Só permite drag de tiles do board se não estiver já arrastando algo
      if (this.dragController.getState().isDragging) return;
      
      // Converte coordenadas da tela para coordenadas de mundo
      const { worldX, worldY } = this.screenToWorldCoords(pointer.x, pointer.y);
      
      // Encontra qual tile foi clicado
      const clickedTile = this.findTileAtPosition(worldX, worldY);
      if (clickedTile && this.onTileDragStart) {
        // Inicia o drag do tile do board
        this.onTileDragStart(
          clickedTile.tile, 
          clickedTile.x, 
          clickedTile.y, 
          { clientX: pointer.x, clientY: pointer.y }
        );
      }
    });
  }

  /**
   * Encontra o tile na posição especificada (coordenadas de mundo)
   */
  private findTileAtPosition(worldX: number, worldY: number): { tile: TileData; x: number; y: number } | null {
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width, 
      this.cameras.main.height
    );

    // Converte coordenadas de mundo para coordenadas de tile
    const tileCoords = screenToTileWithSnap(
      worldX - offsetX,
      worldY - offsetY,
      TILE_SIZE,
      TILE_HEIGHT,
      this.boardConfig.width,
      this.boardConfig.height
    );

    if (tileCoords) {
      // Verifica se há um tile nesta posição
      const tiles = this.boardManager.getState();
      const foundTile = tiles.find(t => t.x === tileCoords.tileX && t.y === tileCoords.tileY);
      if (foundTile) {
        return { tile: foundTile.tile, x: foundTile.x, y: foundTile.y };
      }
    }

    return null;
  }

  update(_: number, __: number): void {
    // Sincroniza a câmera Phaser com o modelo da câmera
    const cam = this.cameras.main;
    const camPos = this.cameraModel.getPosition();
    cam.setScroll(camPos.x, camPos.y);
    cam.setZoom(this.cameraModel.getZoom());

    // Desenha o ghost tile durante drag
    this.redrawGhost();
  }

  /**
   * Redesenha todos os tiles colocados no tabuleiro
   */
  private redrawBoard(tiles: Array<{ x: number; y: number; tile: TileData }>): void {
    this.graphics.clear();

    // Mesmo offset usado no grid
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width, 
      this.cameras.main.height
    );

    for (const { x: tx, y: ty, tile } of tiles) {
      const { x: screenX, y: screenY } = toScreenPos(tx, ty, TILE_SIZE, TILE_HEIGHT);
      const worldX = screenX + offsetX;
      const worldY = screenY + offsetY;

      // Desenha o tile preenchido
      this.graphics.fillStyle(tile.color, 1.0);
      this.graphics.beginPath();
      this.graphics.moveTo(worldX, worldY - TILE_HEIGHT / 2);
      this.graphics.lineTo(worldX + TILE_SIZE / 2, worldY);
      this.graphics.lineTo(worldX, worldY + TILE_HEIGHT / 2);
      this.graphics.lineTo(worldX - TILE_SIZE / 2, worldY);
      this.graphics.closePath();
      this.graphics.fillPath();

      // Borda
      this.graphics.lineStyle(2, 0x000000, 1.0);
      this.graphics.strokePath();
    }
  }

  /**
   * Desenha o tile fantasma durante o drag
   */
  private redrawGhost(): void {
    // Sempre limpa o ghost graphics primeiro
    this.ghostGraphics.clear();
    
    const state: DragState = this.dragController.getState();
    if (state.isDragging && state.tile && state.ghostPos) {
      // As coordenadas do ghostPos já estão em coordenadas de mundo (considerando câmera)
      // Precisa apenas ajustar pelos offsets do grid
      const { offsetX, offsetY } = calculateIsoOffsets(
        this.cameras.main.width, 
        this.cameras.main.height
      );

      const tileCoords = screenToTileWithSnap(
        state.ghostPos.x - offsetX,
        state.ghostPos.y - offsetY,
        TILE_SIZE,
        TILE_HEIGHT,
        this.boardConfig.width,
        this.boardConfig.height
      );

      if (tileCoords) {
        // Usa a posição exata do tile para o ghost (não a posição do mouse)
        const { x: centerX, y: centerY } = toScreenPos(
          tileCoords.tileX, 
          tileCoords.tileY, 
          TILE_SIZE, 
          TILE_HEIGHT
        );
        
        const ghostX = centerX + offsetX;
        const ghostY = centerY + offsetY;

        // Desenha o ghost na posição exata do tile
        this.ghostGraphics.fillStyle(state.tile.color, 0.7);
        this.ghostGraphics.beginPath();
        this.ghostGraphics.moveTo(ghostX, ghostY - TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(ghostX + TILE_SIZE / 2, ghostY);
        this.ghostGraphics.lineTo(ghostX, ghostY + TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(ghostX - TILE_SIZE / 2, ghostY);
        this.ghostGraphics.closePath();
        this.ghostGraphics.fillPath();

        // Borda mais visível para indicar posição válida
        this.ghostGraphics.lineStyle(3, 0x00ff00, 0.9); // Verde para indicar posição válida
        this.ghostGraphics.strokePath();
        
        // Borda interna escura
        this.ghostGraphics.lineStyle(1, 0x000000, 0.6);
        this.ghostGraphics.strokePath();
      } else {
        // Se não há posição válida, mostra ghost vermelho na posição do mouse
        this.ghostGraphics.fillStyle(state.tile.color, 0.3);
        this.ghostGraphics.beginPath();
        this.ghostGraphics.moveTo(state.ghostPos.x, state.ghostPos.y - TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(state.ghostPos.x + TILE_SIZE / 2, state.ghostPos.y);
        this.ghostGraphics.lineTo(state.ghostPos.x, state.ghostPos.y + TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(state.ghostPos.x - TILE_SIZE / 2, state.ghostPos.y);
        this.ghostGraphics.closePath();
        this.ghostGraphics.fillPath();

        // Borda vermelha para indicar posição inválida
        this.ghostGraphics.lineStyle(3, 0xff0000, 0.9); // Vermelho para indicar posição inválida
        this.ghostGraphics.strokePath();
      }
    }
  }

  shutdown(): void {
    // Remove listeners para evitar vazamentos
    this.boardManager.offChange(this.changeListener);
  }
}
