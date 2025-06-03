// src/scenes/IsoScene.ts
import Phaser from 'phaser';
import { BoardStateManager, type BoardChangeListener } from '../../core/engine/BoardStateManager';
import { DragController, type DragState } from '../../core/engine/DragController';
import { Camera as CameraModel } from '../../core/models/Camera';
import { 
  toScreenPos,
  screenToTileWithSnap,
  isPointInIsometricTile,
  toTilePos
} from '../../core/math/isoCoordinate';
import {
  TILE_SIZE,
  TILE_HEIGHT,
  calculateIsoOffsets
} from '../../core/constants';
import {
  calculateVisibleTileRange,
  calculateLevelOfDetail,
  shouldRenderGrid,
  shouldRenderDecorations,
  getGridSamplingRate,
  type VisibleTileRange
} from '../../core/math/viewportCulling';
import type { SpatialQuery } from '../../core/math/spatialIndex';
import type { TileData } from '../../core/models/Tile';

interface IsoSceneConfig {
  boardConfig: { width: number; height: number };
  boardManager: BoardStateManager;
  dragController: DragController;
  cameraModel: CameraModel;
  onTileDragStart?: (
    tile: TileData,
    boardX: number,
    boardY: number,
    e: { clientX: number; clientY: number }
  ) => void;
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
  private onTileDragStart?: (
    tile: TileData,
    boardX: number,
    boardY: number,
    e: { clientX: number; clientY: number }
  ) => void;
  private onTileInfo?: (tile: TileData, position: { x: number; y: number }) => void;

  private lastVisibleRange: VisibleTileRange | null = null;
  private lastCameraPosition: { x: number; y: number; zoom: number } | null =
    null;
  private frameCount = 0;
  private performanceDebugText?: Phaser.GameObjects.Text;
  private isLargeBoard: boolean;

  constructor(config: IsoSceneConfig) {
    super({ key: 'IsoScene' });
    this.boardManager = config.boardManager;
    this.dragController = config.dragController;
    this.cameraModel = config.cameraModel;
    this.boardConfig = config.boardConfig;
    this.onReadyCallback = config.onReadyCallback;
    this.onTileDragStart = config.onTileDragStart;
    this.onTileInfo = config.onTileInfo;

    this.isLargeBoard =
      config.boardConfig.width * config.boardConfig.height > 10000;
  }

  preload(): void {}

  create(): void {
    this.add.text(10, 10, 'Tabuleiro Isométrico Carregado!', {
      fontSize: '16px',
      color: '#ffffff'
    });

    if (this.isLargeBoard) {
      this.performanceDebugText = this.add.text(10, 30, '', {
        fontSize: '12px',
        color: '#ffff00',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 4, y: 2 }
      });
    }

    this.gridGraphics = this.add.graphics();
    this.graphics = this.add.graphics();
    this.ghostGraphics = this.add.graphics().setDepth(100);

    this.syncDragControllerOffsets();

    this.drawGrid(); // grid inicial

    if (!this.isLargeBoard) this.addExampleTiles();

    this.changeListener = (tiles) => this.redrawBoardOptimized(tiles);
    this.boardManager.onChange(this.changeListener);

    this.forceInitialRender();
    this.setupInputHandlers();

    this.onReadyCallback();
  }

  private syncDragControllerOffsets(): void {
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width,
      this.cameras.main.height
    );
    this.dragController.setOffsets(offsetX, offsetY);
  }

  /* ---------------- GRID ---------------- */

  private drawGridOptimized(
    visibleRange: VisibleTileRange,
    lod: number
  ): void {
    this.gridGraphics.clear();

    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width,
      this.cameras.main.height
    );
    const samplingRate = getGridSamplingRate(this.cameraModel.getZoom());
    if (!shouldRenderGrid(this.cameraModel.getZoom(), lod)) return;

    this.gridGraphics.lineStyle(2, 0xaaaaaa, 0.5);
    for (let x = visibleRange.startX; x <= visibleRange.endX; x += samplingRate) {
      for (let y = visibleRange.startY; y <= visibleRange.endY; y += samplingRate) {
        if (x >= this.boardConfig.width || y >= this.boardConfig.height) continue;

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

        if (lod >= 3 && samplingRate === 1) {
          this.gridGraphics.fillStyle(0x666666, 0.8);
          this.gridGraphics.fillCircle(worldX, worldY, 2);
        }
      }
    }
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width,
      this.cameras.main.height
    );

    this.add.text(
      10,
      40,
      `Board: ${this.boardConfig.width}x${this.boardConfig.height} tiles`,
      { fontSize: '14px', color: '#cccccc' }
    );

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
  }

  /* ---------------- INPUT ---------------- */

  private setupInputHandlers(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) {
        this.dragController.updateDrag({
          x: pointer.worldX,
          y: pointer.worldY
        });
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const state = this.dragController.getState();
      if (state.isDragging && state.tile) {
        this.dragController.endDrag({
          x: pointer.worldX,
          y: pointer.worldY
        });
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) return;

      const { worldX, worldY } = pointer;
      const clickedTile = this.findTileAtPositionOptimized(worldX, worldY);

      if (pointer.rightButtonDown()) {
        if (clickedTile && this.onTileInfo) {
          const rect = this.game.canvas.getBoundingClientRect();
          const globalX = pointer.x + rect.left;
          const globalY = pointer.y + rect.top;

          this.onTileInfo(
            {
              ...clickedTile.tile,
              metadata: {
                label: `Tile ${clickedTile.tile.type}`,
                description: `Tile localizado em (${clickedTile.x}, ${clickedTile.y})`
              }
            },
            { x: globalX, y: globalY }
          );
        }
      } else if (pointer.leftButtonDown()) {
        if (clickedTile && this.onTileDragStart) {
          const rect = this.game.canvas.getBoundingClientRect();
          const globalX = pointer.x + rect.left;
          const globalY = pointer.y + rect.top;

          this.onTileDragStart(
            clickedTile.tile,
            clickedTile.x,
            clickedTile.y,
            { clientX: globalX, clientY: globalY }
          );
        }
      }
    });
  }

  /* ---------------- FIND TILE ---------------- */

  private findTileAtPositionOptimized(
    worldX: number,
    worldY: number
  ): { tile: TileData; x: number; y: number } | null {
    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width,
      this.cameras.main.height
    );

    if (this.isLargeBoard) {
      const coords = screenToTileWithSnap(
        worldX - offsetX,
        worldY - offsetY,
        TILE_SIZE,
        TILE_HEIGHT,
        this.boardConfig.width,
        this.boardConfig.height
      );
      if (coords) {
        const tile = this.boardManager.getTileAt(coords.tileX, coords.tileY);
        if (tile) return { tile, x: coords.tileX, y: coords.tileY };
      }

      const tileCoord = toTilePos(
        worldX - offsetX,
        worldY - offsetY,
        TILE_SIZE,
        TILE_HEIGHT
      );
      const nearby = this.boardManager.getTilesNearPoint(
        tileCoord.tileX,
        tileCoord.tileY,
        1.5
      );

      for (const t of nearby) {
        if (
          isPointInIsometricTile(
            worldX,
            worldY,
            t.x,
            t.y,
            TILE_SIZE,
            TILE_HEIGHT,
            offsetX,
            offsetY
          )
        ) {
          return { tile: t.tile, x: t.x, y: t.y };
        }
      }
      return null;
    }

    const tiles = this.boardManager.getState();
    for (const t of tiles) {
      if (
        isPointInIsometricTile(
          worldX,
          worldY,
          t.x,
          t.y,
          TILE_SIZE,
          TILE_HEIGHT,
          offsetX,
          offsetY
        )
      ) {
        return { tile: t.tile, x: t.x, y: t.y };
      }
    }

    const coords = screenToTileWithSnap(
      worldX - offsetX,
      worldY - offsetY,
      TILE_SIZE,
      TILE_HEIGHT,
      this.boardConfig.width,
      this.boardConfig.height
    );
    if (coords) {
      const found = tiles.find(
        (t) => t.x === coords.tileX && t.y === coords.tileY
      );
      if (found) return { tile: found.tile, x: found.x, y: found.y };
    }

    return null;
  }

  /* ---------------- RENDER ---------------- */

  /**
   * Retorna o centro da câmera em coordenadas de mundo levando em conta o zoom.
   */
  private getCameraCenter(): { cx: number; cy: number } {
    const cam = this.cameras.main;
    // scrollX/Y são o canto superior-esquerdo em world-coords
    // O centro é deslocado pela metade do viewport, corrigindo pelo zoom
    const cx = cam.scrollX + cam.width * 0.5 / cam.zoom;
    const cy = cam.scrollY + cam.height * 0.5 / cam.zoom;
    return { cx, cy };
  }

/* ------------------------------------------------------------------ */
/*  1. Novo helper – centro da câmara em world-coords                 */
/* ------------------------------------------------------------------ */
private getCamCenter(): { cx: number; cy: number } {
  const cam = this.cameras.main;
  return {
    cx: cam.scrollX + cam.width * 0.5 / cam.zoom,
    cy: cam.scrollY + cam.height * 0.5 / cam.zoom,
  };
}

/**
   * Atualiza o viewport visível e (re)renderiza os tiles conforme necessidade.
   * Corrigido: usa o **centro** da câmera em vez do scroll (top-left) para calcular
   * a região visível — evitando o bug de “tiles sumindo” em boards muito grandes.
   */
private updateViewportAndRender(): void {
  const cam = this.cameras.main;
  const zoom = cam.zoom;
  const { cx, cy } = this.getCamCenter();

  const visible = calculateVisibleTileRange(
    cx, cy, zoom,
    cam.width, cam.height,
    TILE_SIZE, TILE_HEIGHT,
    this.boardConfig.width, this.boardConfig.height
  );

  /* -- detecta mudança de range / zoom -------------------------------- */
  const changed =
    !this.lastVisibleRange ||
    visible.startX !== this.lastVisibleRange.startX ||
    visible.endX   !== this.lastVisibleRange.endX   ||
    visible.startY !== this.lastVisibleRange.startY ||
    visible.endY   !== this.lastVisibleRange.endY   ||
    !this.lastCameraPosition ||
    Math.abs(this.lastCameraPosition.zoom - zoom) > 0.0005;

  if (!changed) return;

  this.lastVisibleRange = visible;
  this.lastCameraPosition = { x: cx, y: cy, zoom };

  const query: SpatialQuery = {
    minX: visible.startX,
    maxX: visible.endX,
    minY: visible.startY,
    maxY: visible.endY,
  };

  /* -- sempre usa SpatialIndex – até para boards pequenos ------------- */
  const tilesToDraw =
    this.boardManager.getVisibleTiles(query);

  this.redrawBoardOptimized(tilesToDraw);

  /* grid LOD adaptativo para TODOS os tamanhos */
  const lod = calculateLevelOfDetail(zoom);
  this.drawGridOptimized(visible, lod);
}

  private forceInitialRender(): void {
    if (this.isLargeBoard) {
      this.updateViewportAndRender();
    } else {
      this.redrawBoardOptimized(this.boardManager.getState());
    }
  }

update(): void {
  const cam = this.cameras.main;
  /* aplica posição/zoom model->Phaser */
  const pos = this.cameraModel.getPosition();
  cam.setScroll(pos.x, pos.y);
  cam.setZoom(this.cameraModel.getZoom());

  this.updateViewportAndRender();
  this.redrawGhost();
}

  /* ---------- **OPTIMIZED BOARD DRAW** ---------- */
  private redrawBoardOptimized(
    tiles: Array<{ x: number; y: number; tile: TileData }>
  ): void {
    this.graphics.clear();
    if (!tiles.length) return;

    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width,
      this.cameras.main.height
    );
    const zoom = this.cameraModel.getZoom();
    const lod = calculateLevelOfDetail(zoom);
    const drawDecorations = shouldRenderDecorations(zoom, lod);

    /* --- batch by color --- */
    const byColor = new Map<
      number,
      Array<{ x: number; y: number }>
    >();
    for (const { x, y, tile } of tiles) {
      const list = byColor.get(tile.color) ?? [];
      list.push({ x, y });
      byColor.set(tile.color, list);
    }

    /* --- filled polygons --- */
    byColor.forEach((list, color) => {
      this.graphics.fillStyle(color, 1).beginPath();

      for (const { x, y } of list) {
        const { x: sX, y: sY } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
        const wX = sX + offsetX;
        const wY = sY + offsetY;

        this.graphics.moveTo(wX, wY - TILE_HEIGHT / 2);
        this.graphics.lineTo(wX + TILE_SIZE / 2, wY);
        this.graphics.lineTo(wX, wY + TILE_HEIGHT / 2);
        this.graphics.lineTo(wX - TILE_SIZE / 2, wY);
        this.graphics.closePath();
      }

      this.graphics.fillPath();

      if (drawDecorations) {
        this.graphics.lineStyle(2, 0x000000, 1).strokePath();
      }

      this.graphics.beginPath(); // reset for next color
    });
  }

  /* ------------- GHOST ------------- */

  private redrawGhost(): void {
    this.ghostGraphics.clear();

    const state = this.dragController.getState();
    if (!state.isDragging || !state.tile || !state.ghostPos) return;

    const { offsetX, offsetY } = calculateIsoOffsets(
      this.cameras.main.width,
      this.cameras.main.height
    );
    const coords = screenToTileWithSnap(
      state.ghostPos.x - offsetX,
      state.ghostPos.y - offsetY,
      TILE_SIZE,
      TILE_HEIGHT,
      this.boardConfig.width,
      this.boardConfig.height
    );

    const drawDiamond = (
      cx: number,
      cy: number,
      alpha: number,
      strokeColor: number
    ) => {
      this.ghostGraphics.fillStyle(state.tile?.color ?? 0x000000, alpha);
      this.ghostGraphics.beginPath();
      this.ghostGraphics.moveTo(cx, cy - TILE_HEIGHT / 2);
      this.ghostGraphics.lineTo(cx + TILE_SIZE / 2, cy);
      this.ghostGraphics.lineTo(cx, cy + TILE_HEIGHT / 2);
      this.ghostGraphics.lineTo(cx - TILE_SIZE / 2, cy);
      this.ghostGraphics.closePath();
      this.ghostGraphics.fillPath();
      this.ghostGraphics.lineStyle(3, strokeColor, 0.9).strokePath();
    };

    if (coords) {
      const { x: cX, y: cY } = toScreenPos(
        coords.tileX,
        coords.tileY,
        TILE_SIZE,
        TILE_HEIGHT
      );
      drawDiamond(cX + offsetX, cY + offsetY, 0.7, 0x00ff00);
    } else {
      drawDiamond(
        state.ghostPos.x,
        state.ghostPos.y,
        0.3,
        0xff0000
      );
    }
  }

  shutdown(): void {
    this.boardManager.offChange(this.changeListener);
  }

  /* ---------------- EXAMPLES ---------------- */

  private addExampleTiles(): void {
    [
      { x: 0, y: 0, color: 0x8ecae6 },
      { x: 1, y: 0, color: 0xffb703 },
      { x: 0, y: 1, color: 0x43a047 },
      { x: 2, y: 1, color: 0xff006e },
      { x: 1, y: 2, color: 0x8338ec }
    ].forEach(({ x, y, color }) => {
      if (x < this.boardConfig.width && y < this.boardConfig.height) {
        this.boardManager.placeTile(x, y, {
          id: `example-${x}-${y}`,
          type: 'example',
          color
        });
      }
    });
  }
}
