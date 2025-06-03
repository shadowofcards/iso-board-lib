/* src/scenes/IsoScene.ts */
import Phaser from 'phaser';
import { BoardStateManager, type BoardChangeListener } from '../../core/engine/BoardStateManager';
import { DragController, type DragState } from '../../core/engine/DragController';
import { Camera as CameraModel } from '../../core/models/Camera';
import { toScreenPos, screenToTileWithSnap, isPointInIsometricTile } from '../../core/math/isoCoordinate';
import { TILE_SIZE, TILE_HEIGHT, calculateIsoOffsets } from '../../core/constants';
import type { TileData } from '../../core/models/Tile';

interface IsoSceneConfig {
  boardConfig: { width: number; height: number };
  boardManager: BoardStateManager;
  dragController: DragController;
  cameraModel: CameraModel;
  onTileDragStart?: (tile: TileData, boardX: number, boardY: number, e: { clientX: number; clientY: number }) => void;
  onTileInfo?: (tile: TileData, position: { x: number; y: number }) => void;
  onReadyCallback: () => void;
}

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
  private onTileInfo?: (tile: TileData, position: { x: number; y: number }) => void;

  constructor(config: IsoSceneConfig) {
    super({ key: 'IsoScene' });
    this.boardManager = config.boardManager;
    this.dragController = config.dragController;
    this.cameraModel = config.cameraModel;
    this.boardConfig = config.boardConfig;
    this.onReadyCallback = config.onReadyCallback;
    this.onTileDragStart = config.onTileDragStart;
    this.onTileInfo = config.onTileInfo;
  }

  preload(): void {}

  create(): void {
    this.add.text(10, 10, 'Tabuleiro Isométrico Carregado!', { fontSize: '16px', color: '#ffffff' });

    this.gridGraphics = this.add.graphics();
    this.graphics = this.add.graphics();
    this.ghostGraphics = this.add.graphics();
    this.ghostGraphics.setDepth(100);

    this.syncDragControllerOffsets();
    this.drawGrid();

    this.changeListener = (tiles) => this.redrawBoard(tiles);
    this.boardManager.onChange(this.changeListener);
    this.redrawBoard(this.boardManager.getState());

    this.setupInputHandlers();
    this.onReadyCallback();
  }

  private syncDragControllerOffsets(): void {
    const { offsetX, offsetY } = calculateIsoOffsets(this.cameras.main.width, this.cameras.main.height);
    this.dragController.setOffsets(offsetX, offsetY);
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    const { offsetX, offsetY } = calculateIsoOffsets(this.cameras.main.width, this.cameras.main.height);

    this.add.text(10, 40, `Board: ${this.boardConfig.width}x${this.boardConfig.height} tiles`, { fontSize: '14px', color: '#cccccc' });
    this.gridGraphics.lineStyle(2, 0xaaaaaa, 1.0);

    for (let x = 0; x < this.boardConfig.width; x++) {
      for (let y = 0; y < this.boardConfig.height; y++) {
        const { x: sX, y: sY } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
        const worldX = sX + offsetX;
        const worldY = sY + offsetY;

        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(worldX, worldY - TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(worldX + TILE_SIZE / 2, worldY);
        this.gridGraphics.lineTo(worldX, worldY + TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(worldX - TILE_SIZE / 2, worldY);
        this.gridGraphics.closePath();
        this.gridGraphics.strokePath();

        this.gridGraphics.fillStyle(0x666666, 0.8);
        this.gridGraphics.fillCircle(worldX, worldY, 2);
      }
    }
    this.addExampleTiles();
  }

  private addExampleTiles(): void {
    const exampleTiles = [
      { x: 0, y: 0, color: 0x8ecae6 },
      { x: 1, y: 0, color: 0xffb703 },
      { x: 0, y: 1, color: 0x43a047 },
      { x: 2, y: 1, color: 0xff006e },
      { x: 1, y: 2, color: 0x8338ec },
    ];
    exampleTiles.forEach(({ x, y, color }) => {
      if (x < this.boardConfig.width && y < this.boardConfig.height) {
        this.boardManager.placeTile(x, y, { id: `example-${x}-${y}`, type: 'example', color });
      }
    });
  }

  private setupInputHandlers(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) {
        this.dragController.updateDrag({ x: pointer.worldX, y: pointer.worldY });
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const state: DragState = this.dragController.getState();
      if (state.isDragging && state.tile) {
        this.dragController.endDrag({ x: pointer.worldX, y: pointer.worldY });
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) return;

      const { worldX, worldY } = pointer;
      const clickedTile = this.findTileAtPosition(worldX, worldY);

      // Verifica qual botão foi clicado
      if (pointer.rightButtonDown()) {
        // Clique direito - mostra informações do tile
        if (clickedTile && this.onTileInfo) {
          const canvasRect = this.game.canvas.getBoundingClientRect();
          const globalX = pointer.x + canvasRect.left;
          const globalY = pointer.y + canvasRect.top;
          
          // Adiciona metadados ao tile para demonstração
          const enrichedTile = {
            ...clickedTile.tile,
            metadata: {
              label: `Tile ${clickedTile.tile.type}`,
              description: `Tile localizado em (${clickedTile.x}, ${clickedTile.y})`,
              properties: {
                posicaoX: clickedTile.x,
                posicaoY: clickedTile.y,
                tipo: clickedTile.tile.type,
                durabilidade: Math.floor(Math.random() * 100) + 1,
                custo: Math.floor(Math.random() * 50) + 10
              }
            }
          };
          
          this.onTileInfo(enrichedTile, { x: globalX, y: globalY });
        }
      } else if (pointer.leftButtonDown()) {
        // Clique esquerdo - inicia drag do tile
        if (clickedTile && this.onTileDragStart) {
          const canvasRect = this.game.canvas.getBoundingClientRect();
          const globalX = pointer.x + canvasRect.left;
          const globalY = pointer.y + canvasRect.top;
          this.onTileDragStart(clickedTile.tile, clickedTile.x, clickedTile.y, { clientX: globalX, clientY: globalY });
        }
      }
    });
  }

  private findTileAtPosition(worldX: number, worldY: number): { tile: TileData; x: number; y: number } | null {
    const { offsetX, offsetY } = calculateIsoOffsets(this.cameras.main.width, this.cameras.main.height);
    const tiles = this.boardManager.getState();

    for (const t of tiles) {
      if (isPointInIsometricTile(worldX, worldY, t.x, t.y, TILE_SIZE, TILE_HEIGHT, offsetX, offsetY)) {
        return { tile: t.tile, x: t.x, y: t.y };
      }
    }

    const coords = screenToTileWithSnap(worldX - offsetX, worldY - offsetY, TILE_SIZE, TILE_HEIGHT, this.boardConfig.width, this.boardConfig.height);
    if (coords) {
      const found = tiles.find(t => t.x === coords.tileX && t.y === coords.tileY);
      if (found) return { tile: found.tile, x: found.x, y: found.y };
    }
    return null;
  }

  update(): void {
    const cam = this.cameras.main;
    const camPos = this.cameraModel.getPosition();
    cam.setScroll(camPos.x, camPos.y);
    cam.setZoom(this.cameraModel.getZoom());
    this.redrawGhost();
  }

  private redrawBoard(tiles: Array<{ x: number; y: number; tile: TileData }>): void {
    this.graphics.clear();
    const { offsetX, offsetY } = calculateIsoOffsets(this.cameras.main.width, this.cameras.main.height);

    for (const { x, y, tile } of tiles) {
      const { x: sX, y: sY } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
      const worldX = sX + offsetX;
      const worldY = sY + offsetY;

      this.graphics.fillStyle(tile.color, 1.0);
      this.graphics.beginPath();
      this.graphics.moveTo(worldX, worldY - TILE_HEIGHT / 2);
      this.graphics.lineTo(worldX + TILE_SIZE / 2, worldY);
      this.graphics.lineTo(worldX, worldY + TILE_HEIGHT / 2);
      this.graphics.lineTo(worldX - TILE_SIZE / 2, worldY);
      this.graphics.closePath();
      this.graphics.fillPath();

      this.graphics.lineStyle(2, 0x000000, 1.0);
      this.graphics.strokePath();
    }
  }

  private redrawGhost(): void {
    this.ghostGraphics.clear();
    const state: DragState = this.dragController.getState();
    if (state.isDragging && state.tile && state.ghostPos) {
      const { offsetX, offsetY } = calculateIsoOffsets(this.cameras.main.width, this.cameras.main.height);
      const coords = screenToTileWithSnap(state.ghostPos.x - offsetX, state.ghostPos.y - offsetY, TILE_SIZE, TILE_HEIGHT, this.boardConfig.width, this.boardConfig.height);

      if (coords) {
        const { x: centerX, y: centerY } = toScreenPos(coords.tileX, coords.tileY, TILE_SIZE, TILE_HEIGHT);
        const gX = centerX + offsetX;
        const gY = centerY + offsetY;

        this.ghostGraphics.fillStyle(state.tile.color, 0.7);
        this.ghostGraphics.beginPath();
        this.ghostGraphics.moveTo(gX, gY - TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(gX + TILE_SIZE / 2, gY);
        this.ghostGraphics.lineTo(gX, gY + TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(gX - TILE_SIZE / 2, gY);
        this.ghostGraphics.closePath();
        this.ghostGraphics.fillPath();
        this.ghostGraphics.lineStyle(3, 0x00ff00, 0.9);
        this.ghostGraphics.strokePath();
        this.ghostGraphics.lineStyle(1, 0x000000, 0.6);
        this.ghostGraphics.strokePath();
      } else {
        this.ghostGraphics.fillStyle(state.tile.color, 0.3);
        this.ghostGraphics.beginPath();
        this.ghostGraphics.moveTo(state.ghostPos.x, state.ghostPos.y - TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(state.ghostPos.x + TILE_SIZE / 2, state.ghostPos.y);
        this.ghostGraphics.lineTo(state.ghostPos.x, state.ghostPos.y + TILE_HEIGHT / 2);
        this.ghostGraphics.lineTo(state.ghostPos.x - TILE_SIZE / 2, state.ghostPos.y);
        this.ghostGraphics.closePath();
        this.ghostGraphics.fillPath();
        this.ghostGraphics.lineStyle(3, 0xff0000, 0.9);
        this.ghostGraphics.strokePath();
      }
    }
  }

  shutdown(): void {
    this.boardManager.offChange(this.changeListener);
  }
}
