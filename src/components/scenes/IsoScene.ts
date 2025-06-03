import Phaser from 'phaser';
import {
  BoardStateManager,
  type BoardChangeListener,
} from '../../core/engine/BoardStateManager';
import { DragController } from '../../core/engine/DragController';
import { Camera as CameraModel } from '../../core/models/Camera';
import {
  toScreenPos,
  screenToTileWithSnap,
  isPointInIsometricTile,
  toTilePos,
} from '../../core/math/isoCoordinate';
import {
  TILE_SIZE,
  TILE_HEIGHT,
  calculateDynamicIsoOffsets,
} from '../../core/constants';
import {
  calculateVisibleTileRange,
  calculateLevelOfDetail,
  shouldRenderGrid,
  shouldRenderDecorations,
  getGridSamplingRate,
  hasSignificantViewportChange,
  shouldUseViewportCulling,
  type VisibleTileRange,
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

/* ------------------------------------------------------------------ */
const RERENDER_THROTTLE_MS = 35;
/* ------------------------------------------------------------------ */

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

  private isLargeBoard: boolean;
  private debugText?: Phaser.GameObjects.Text;

  private lastRenderAt = 0;
  private lastOffsets = { offsetX: 0, offsetY: 0 };

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
      config.boardConfig.width * config.boardConfig.height > 10_000;
  }

  /* =============================== LIFECYCLE =============================== */

  preload(): void {}

  create(): void {
    this.add.text(10, 10, 'Tabuleiro Isométrico Carregado!', {
      fontSize: '16px',
      color: '#ffffff',
    });

    this.debugText = this.add.text(10, 30, '', {
      fontSize: '12px',
      color: '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 }
    });

    this.gridGraphics = this.add.graphics();
    this.graphics = this.add.graphics();
    this.ghostGraphics = this.add.graphics().setDepth(100);

    this.syncDragControllerOffsets(true);
    if (!this.isLargeBoard) this.addExampleTiles();

    this.changeListener = (tiles) => this.redrawBoardOptimized(tiles);
    this.boardManager.onChange(this.changeListener);

    this.forceInitialRender();
    this.setupInputHandlers();

    this.onReadyCallback();
  }

  shutdown(): void {
    this.boardManager.offChange(this.changeListener);
  }

  /* =========================== CORE UPDATE LOOP =========================== */

  update(): void {
    const cam = this.cameras.main;
    const pos = this.cameraModel.getPosition();
    cam.setScroll(pos.x, pos.y);
    cam.setZoom(this.cameraModel.getZoom());

    this.syncDragControllerOffsets();
    this.updateViewportAndRender();
    this.redrawGhost();
  }

  /* =============================== HELPERS ================================ */

  private syncDragControllerOffsets(force = false): void {
    const cam = this.cameras.main;

    // agora o offset é fixo (só depende do zoom)
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width,
      cam.height,
      0,
      0,
      cam.zoom
    );

    const dx = Math.abs(offsetX - this.lastOffsets.offsetX);
    const dy = Math.abs(offsetY - this.lastOffsets.offsetY);

    if (force || dx > 0.25 || dy > 0.25) {
      this.lastOffsets = { offsetX, offsetY };
      this.dragController.setOffsets(offsetX, offsetY);
    }
  }

  private getCamCenter(): { cx: number; cy: number } {
    const cam = this.cameras.main;
    return {
      cx: cam.scrollX + (cam.width * 0.5) / cam.zoom,
      cy: cam.scrollY + (cam.height * 0.5) / cam.zoom,
    };
  }

  /* ============================ INPUT HANDLERS ============================ */

  private setupInputHandlers(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) {
        this.dragController.updateDrag({
          x: pointer.worldX,
          y: pointer.worldY,
        });
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const state = this.dragController.getState();
      if (state.isDragging && state.tile) {
        this.dragController.endDrag({
          x: pointer.worldX,
          y: pointer.worldY,
        });
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) return;

      const clicked = this.findTileAtPositionOptimized(
        pointer.worldX,
        pointer.worldY
      );

      if (pointer.rightButtonDown()) {
        if (clicked && this.onTileInfo) {
          const rect = this.game.canvas.getBoundingClientRect();
          this.onTileInfo(clicked.tile, {
            x: pointer.x + rect.left,
            y: pointer.y + rect.top,
          });
        }
      } else if (pointer.leftButtonDown()) {
        if (clicked && this.onTileDragStart) {
          const rect = this.game.canvas.getBoundingClientRect();
          this.onTileDragStart(clicked.tile, clicked.x, clicked.y, {
            clientX: pointer.x + rect.left,
            clientY: pointer.y + rect.top,
          });
        }
      }
    });
  }

  /* ============================== VIEWPORT ================================ */

  private shouldThrottle(now: number): boolean {
    const dt = now - this.lastRenderAt;
    return dt < (this.cameras.main.zoom < 0.4 ? 55 : RERENDER_THROTTLE_MS);
  }

  private updateViewportAndRender(): void {
    const now = this.time.now;
    if (this.shouldThrottle(now)) return;
    this.lastRenderAt = now;

    const cam = this.cameras.main;
    const zoom = cam.zoom;
    const { cx, cy } = this.getCamCenter();
    const useCulling = shouldUseViewportCulling(
      this.boardConfig.width,
      this.boardConfig.height
    );

    if (useCulling) {
      const visible = calculateVisibleTileRange(
        cx,
        cy,
        zoom,
        cam.width,
        cam.height,
        TILE_SIZE,
        TILE_HEIGHT,
        this.boardConfig.width,
        this.boardConfig.height
      );

      const lastZoom = this.lastCameraPosition?.zoom ?? 0;
      const changed = hasSignificantViewportChange(
        visible,
        this.lastVisibleRange,
        zoom,
        lastZoom
      );
      if (!changed) return;

      this.lastVisibleRange = visible;
      this.lastCameraPosition = { x: cx, y: cy, zoom };

      const query: SpatialQuery = {
        minX: visible.startX,
        maxX: visible.endX,
        minY: visible.startY,
        maxY: visible.endY,
      };
      const tiles = this.boardManager.getVisibleTiles(query);
      this.redrawBoardOptimized(tiles);

      const lod = calculateLevelOfDetail(zoom);
      this.drawGridOptimized(visible, lod);
    } else {
      const changed =
        !this.lastCameraPosition ||
        Math.abs(this.lastCameraPosition.zoom - zoom) > 0.002 ||
        Math.abs(this.lastCameraPosition.x - cx) > 8 ||
        Math.abs(this.lastCameraPosition.y - cy) > 8;

      if (!changed) return;

      this.lastCameraPosition = { x: cx, y: cy, zoom };

      this.redrawBoardOptimized(this.boardManager.getState());

      const lod = calculateLevelOfDetail(zoom);
      if (shouldRenderGrid(zoom, lod)) {
        const fullRange: VisibleTileRange = {
          startX: 0,
          endX: this.boardConfig.width - 1,
          startY: 0,
          endY: this.boardConfig.height - 1,
          totalTiles: this.boardConfig.width * this.boardConfig.height,
        };
        this.drawGridOptimized(fullRange, lod);
      } else {
        this.gridGraphics.clear();
      }
    }
  }

  private forceInitialRender(): void {
    this.updateViewportAndRender();
  }

  /* ============================= RENDER GRID ============================== */

  private drawGridOptimized(
    visible: VisibleTileRange,
    lod: number
  ): void {
    const zoom = this.cameras.main.zoom;
    if (!shouldRenderGrid(zoom, lod)) {
      this.gridGraphics.clear();
      return;
    }

    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(2, 0xaaaaaa, 0.5);

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width,
      cam.height,
      0,
      0,
      cam.zoom
    );

    const step = getGridSamplingRate(zoom);

    for (let x = visible.startX; x <= visible.endX; x += step) {
      for (let y = visible.startY; y <= visible.endY; y += step) {
        if (x >= this.boardConfig.width || y >= this.boardConfig.height) continue;

        const { x: sX, y: sY } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
        const wX = sX + offsetX;
        const wY = sY + offsetY;

        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(wX, wY - TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(wX + TILE_SIZE / 2, wY);
        this.gridGraphics.lineTo(wX, wY + TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(wX - TILE_SIZE / 2, wY);
        this.gridGraphics.closePath();
        this.gridGraphics.strokePath();

        if (lod >= 3 && step === 1) {
          this.gridGraphics.fillStyle(0x666666, 0.8);
          this.gridGraphics.fillCircle(wX, wY, 2);
        }
      }
    }
  }

  /* =========================== BOARD RENDERING ============================ */

  private redrawBoardOptimized(
    tiles: Array<{ x: number; y: number; tile: TileData }>
  ): void {
    if (!tiles.length) {
      this.graphics.clear();
      return;
    }

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width,
      cam.height,
      0,
      0,
      cam.zoom
    );

    const zoom = cam.zoom;
    const lod = calculateLevelOfDetail(zoom);
    const drawDecor = shouldRenderDecorations(zoom, lod);

    /* Debug */
    const total = this.boardConfig.width * this.boardConfig.height;
    if (this.debugText) {
      const useCull = shouldUseViewportCulling(
        this.boardConfig.width,
        this.boardConfig.height
      );
      this.debugText.setText([
        `Board: ${this.boardConfig.width} x ${this.boardConfig.height}`,
        useCull ? `Culling: ${tiles.length} / ${total}` : `No Culling`,
        `Zoom: ${zoom.toFixed(2)}`,
      ]);
    }

    /* Desenho */
    this.graphics.clear();

    const byColor = new Map<number, Array<{ x: number; y: number }>>();
    for (const { x, y, tile } of tiles) {
      const list = byColor.get(tile.color) ?? [];
      list.push({ x, y });
      byColor.set(tile.color, list);
    }

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

      if (drawDecor) {
        this.graphics.lineStyle(2, 0x000000, 1).strokePath();
      }

      this.graphics.beginPath();
    });
  }

  /* =============================== GHOST =================================== */

  private redrawGhost(): void {
    this.ghostGraphics.clear();

    const state = this.dragController.getState();
    if (!state.isDragging || !state.tile || !state.ghostPos) return;

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width,
      cam.height,
      0,
      0,
      cam.zoom
    );

    const coords = screenToTileWithSnap(
      state.ghostPos.x - offsetX,
      state.ghostPos.y - offsetY,
      TILE_SIZE,
      TILE_HEIGHT,
      this.boardConfig.width,
      this.boardConfig.height
    );

    const drawDia = (cx: number, cy: number, a: number, stroke: number) => {
      this.ghostGraphics.fillStyle(state.tile!.color, a);
      this.ghostGraphics.beginPath();
      this.ghostGraphics.moveTo(cx, cy - TILE_HEIGHT / 2);
      this.ghostGraphics.lineTo(cx + TILE_SIZE / 2, cy);
      this.ghostGraphics.lineTo(cx, cy + TILE_HEIGHT / 2);
      this.ghostGraphics.lineTo(cx - TILE_SIZE / 2, cy);
      this.ghostGraphics.closePath();
      this.ghostGraphics.fillPath();
      this.ghostGraphics.lineStyle(3, stroke, 0.9).strokePath();
    };

    if (coords) {
      const { x: sX, y: sY } = toScreenPos(
        coords.tileX,
        coords.tileY,
        TILE_SIZE,
        TILE_HEIGHT
      );
      drawDia(sX + offsetX, sY + offsetY, 0.7, 0x00ff00);
    } else {
      drawDia(state.ghostPos.x, state.ghostPos.y, 0.3, 0xff0000);
    }
  }

  /* ============================= FIND TILE ================================ */

  private findTileAtPositionOptimized(
    worldX: number,
    worldY: number
  ): { tile: TileData; x: number; y: number } | null {
    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width,
      cam.height,
      0,
      0,
      cam.zoom
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

      const tc = toTilePos(
        worldX - offsetX,
        worldY - offsetY,
        TILE_SIZE,
        TILE_HEIGHT
      );
      const nearby = this.boardManager.getTilesNearPoint(
        tc.tileX,
        tc.tileY,
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

  /* ============================ EXAMPLE TILES ============================ */

  private addExampleTiles(): void {
    [
      { x: 0, y: 0, color: 0x8ecae6 },
      { x: 1, y: 0, color: 0xffb703 },
      { x: 0, y: 1, color: 0x43a047 },
      { x: 2, y: 1, color: 0xff006e },
      { x: 1, y: 2, color: 0x8338ec },
    ].forEach(({ x, y, color }) => {
      if (x < this.boardConfig.width && y < this.boardConfig.height) {
        this.boardManager.placeTile(x, y, {
          id: `example-${x}-${y}`,
          type: 'example',
          color,
        });
      }
    });
  }
}
