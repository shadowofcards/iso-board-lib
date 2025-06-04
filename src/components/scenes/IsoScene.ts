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

import {
  RERENDER_THROTTLE_MS,
  MAX_QUADS_PER_BATCH,
} from '../../core/config';

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
  onTileHover?: (tile: TileData | null, position: { x: number; y: number } | null) => void;
  onReadyCallback: () => void;
}

export default class IsoScene extends Phaser.Scene {
  /* ------------------------------------------------------------------ */
  /*  CAMPOS                                                             */
  /* ------------------------------------------------------------------ */
  private boardManager!: BoardStateManager;
  private dragController!: DragController;
  private cameraModel!: CameraModel;
  private boardConfig!: { width: number; height: number };

  private graphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private ghostGraphics!: Phaser.GameObjects.Graphics;

  private onReadyCallback!: () => void;
  private onTileDragStart?: (
    tile: TileData,
    boardX: number,
    boardY: number,
    e: { clientX: number; clientY: number }
  ) => void;
  private onTileInfo?: (tile: TileData, position: { x: number; y: number }) => void;
  private onTileHover?: (tile: TileData | null, position: { x: number; y: number } | null) => void;

  private changeListener!: BoardChangeListener;

  private lastVisibleRange: VisibleTileRange | null = null;
  private lastCameraPosition: { x: number; y: number; zoom: number } | null =
    null;

  private lastRenderAt = 0;
  private lastOffsets  = { offsetX: 0, offsetY: 0 };
  private forceRedraw  = false;

  private isLargeBoard: boolean;
  private debugText?: Phaser.GameObjects.Text;

  // Novos campos para hover
  private lastHoveredTile: { tile: TileData; x: number; y: number } | null = null;
  private hoverCheckInterval: number = 0;

  /* ------------------------------------------------------------------ */
  /*  CONSTRUTOR                                                         */
  /* ------------------------------------------------------------------ */
  constructor(cfg: IsoSceneConfig) {
    super({ key: 'IsoScene' });

    this.boardManager   = cfg.boardManager;
    this.dragController = cfg.dragController;
    this.cameraModel    = cfg.cameraModel;
    this.boardConfig    = cfg.boardConfig;
    this.onReadyCallback = cfg.onReadyCallback;
    this.onTileDragStart = cfg.onTileDragStart;
    this.onTileInfo      = cfg.onTileInfo;
    this.onTileHover     = cfg.onTileHover;

    this.isLargeBoard =
      cfg.boardConfig.width * cfg.boardConfig.height > 10_000;
  }

  /* ================================================================== */
  /*  CICLO DE VIDA                                                     */
  /* ================================================================== */

  preload(): void { /* nada */ }

  create(): void {
    /* texto de status */
    this.add.text(10, 10, 'Tabuleiro Isométrico Carregado!', {
      fontSize: '16px',
      color   : '#ffffff',
    });

    this.debugText = this.add.text(10, 30, '', {
      fontSize       : '12px',
      color          : '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding        : { x: 4, y: 2 },
    });

    /* layers */
    this.gridGraphics  = this.add.graphics();
    this.graphics      = this.add.graphics();
    this.ghostGraphics = this.add.graphics().setDepth(100);

    /* offsets iniciais */
    this.syncDragControllerOffsets(true);

    if (!this.isLargeBoard) this.addExampleTiles();

    /* listener de mudança no board */
    this.changeListener = () => { this.forceRedraw = true; };
    this.boardManager.onChange(this.changeListener);

    /* render inicial */
    this.forceInitialRender();

    /* input */
    this.setupInputHandlers();

    this.onReadyCallback();
  }

  shutdown(): void {
    this.boardManager.offChange(this.changeListener);
    this.debugText?.destroy();
  }

  /* ------------------------------------------------------------------ */
  /*  LOOP DE ATUALIZAÇÃO                                                */
  /* ------------------------------------------------------------------ */
  update(): void {
    const cam = this.cameras.main;
    const pos = this.cameraModel.getPosition();
    cam.setScroll(pos.x, pos.y);
    cam.setZoom(this.cameraModel.getZoom());

    this.syncDragControllerOffsets();
    this.updateViewportAndRender();
    this.redrawGhost();
  }

  /* ================================================================== */
  /*  OFFSETs / CENTRO DE CÂMERA                                        */
  /* ================================================================== */

  private syncDragControllerOffsets(force = false): void {
    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width,
      cam.height,
      0,
      0,
      cam.zoom
    );

    if (
      force ||
      Math.abs(offsetX - this.lastOffsets.offsetX) > 0.25 ||
      Math.abs(offsetY - this.lastOffsets.offsetY) > 0.25
    ) {
      this.lastOffsets = { offsetX, offsetY };
      this.dragController.setOffsets(offsetX, offsetY);
    }
  }

  private getCamCenter(): { cx: number; cy: number } {
    const cam = this.cameras.main;
    return {
      cx: cam.scrollX + (cam.width  * 0.5) / cam.zoom,
      cy: cam.scrollY + (cam.height * 0.5) / cam.zoom,
    };
  }

  /* ================================================================== */
  /*  INPUT                                                              */
  /* ================================================================== */

  private setupInputHandlers(): void {
    /* drag fantasma move */
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) {
        this.dragController.updateDrag({ x: p.worldX, y: p.worldY });
      } else {
        // Verificar hover quando não estiver arrastando
        this.checkTileHover(p.worldX, p.worldY, p.x, p.y);
      }
    });

    /* mouse up → finaliza drag */
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const st = this.dragController.getState();
      if (st.isDragging && st.tile) {
        this.dragController.endDrag({ x: p.worldX, y: p.worldY });
      }
    });

    /* pointer down */
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.dragController.getState().isDragging) return;

      const clicked = this.findTileAtPositionOptimized(p.worldX, p.worldY);

      // Remover lógica de clique direito e manter apenas clique esquerdo para drag
      if (p.leftButtonDown()) {
        if (clicked && this.onTileDragStart) {
          const r = this.game.canvas.getBoundingClientRect();
          this.onTileDragStart(clicked.tile, clicked.x, clicked.y, {
            clientX: p.x + r.left,
            clientY: p.y + r.top,
          });
        }
      }
    });

    /* detectar quando mouse sai do canvas para limpar hover */
    this.input.on('pointerout', () => {
      this.clearTileHover();
    });
  }

  /* ================================================================== */
  /*  VIEWPORT & RENDER                                                  */
  /* ================================================================== */

  private shouldThrottle(now: number): boolean {
    return now - this.lastRenderAt < (
      this.cameras.main.zoom < 0.4 ? 55 : RERENDER_THROTTLE_MS
    );
  }

  private updateViewportAndRender(): void {
    const now = this.time.now;
    if (!this.forceRedraw && this.shouldThrottle(now)) return;
    this.lastRenderAt = now;

    const cam  = this.cameras.main;
    const zoom = cam.zoom;

    const { cx, cy } = this.getCamCenter();
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width, cam.height, 0, 0, zoom
    );
    const boardCx = cx - offsetX;
    const boardCy = cy - offsetY;

    const useCull = shouldUseViewportCulling(
      this.boardConfig.width, this.boardConfig.height
    );

    if (useCull) {
      const visible = calculateVisibleTileRange(
        boardCx, boardCy, zoom,
        cam.width, cam.height,
        TILE_SIZE, TILE_HEIGHT,
        this.boardConfig.width, this.boardConfig.height
      );

      const lastZoom = this.lastCameraPosition?.zoom ?? 0;
      const changed  =
        this.forceRedraw ||
        hasSignificantViewportChange(
          visible, this.lastVisibleRange, zoom, lastZoom
        );

      if (!changed) { this.forceRedraw = false; return; }

      this.lastVisibleRange  = visible;
      this.lastCameraPosition = { x: boardCx, y: boardCy, zoom };

      const q: SpatialQuery = {
        minX: visible.startX, maxX: visible.endX,
        minY: visible.startY, maxY: visible.endY,
      };

      const tilesToDraw = this.boardManager.getVisibleTiles(q);
      this.redrawBoardOptimized(tilesToDraw);

      const lod = calculateLevelOfDetail(zoom);
      this.drawGridOptimized(visible, lod);
    } else {
      const changed =
        this.forceRedraw ||
        !this.lastCameraPosition ||
        Math.abs(this.lastCameraPosition.zoom - zoom) > 0.002 ||
        Math.abs(this.lastCameraPosition.x - boardCx)   > 8 ||
        Math.abs(this.lastCameraPosition.y - boardCy)   > 8;

      if (!changed) { this.forceRedraw = false; return; }

      this.lastCameraPosition = { x: boardCx, y: boardCy, zoom };

      this.redrawBoardOptimized(this.boardManager.getState());

      const lod = calculateLevelOfDetail(zoom);
      if (shouldRenderGrid(zoom, lod)) {
        const full: VisibleTileRange = {
          startX: 0,
          endX  : this.boardConfig.width  - 1,
          startY: 0,
          endY  : this.boardConfig.height - 1,
          totalTiles: this.boardConfig.width * this.boardConfig.height,
        };
        this.drawGridOptimized(full, lod);
      } else {
        this.gridGraphics.clear();
      }
    }

    this.forceRedraw = false;
  }

  private forceInitialRender() {
    this.forceRedraw = true;
    this.updateViewportAndRender();
  }

  /* ================================================================== */
  /*  GRID                                                               */
  /* ================================================================== */

  private drawGridOptimized(v: VisibleTileRange, lod: number) {
    const zoom = this.cameras.main.zoom;
    if (!shouldRenderGrid(zoom, lod)) { this.gridGraphics.clear(); return; }

    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(2, 0xaaaaaa, 0.5);

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width, cam.height, 0, 0, zoom
    );

    const step = getGridSamplingRate(zoom);

    for (let x = v.startX; x <= v.endX; x += step) {
      for (let y = v.startY; y <= v.endY; y += step) {
        if (x >= this.boardConfig.width || y >= this.boardConfig.height) continue;

        const { x: sx, y: sy } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
        const wx = sx + offsetX;
        const wy = sy + offsetY;

        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(wx, wy - TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(wx + TILE_SIZE / 2, wy);
        this.gridGraphics.lineTo(wx, wy + TILE_HEIGHT / 2);
        this.gridGraphics.lineTo(wx - TILE_SIZE / 2, wy);
        this.gridGraphics.closePath();
        this.gridGraphics.strokePath();

        if (lod >= 3 && step === 1) {
          this.gridGraphics.fillStyle(0x666666, 0.8);
          this.gridGraphics.fillCircle(wx, wy, 2);
        }
      }
    }
  }

  /* ================================================================== */
  /*  RENDER DO TABULEIRO                                                */
  /* ================================================================== */

  private redrawBoardOptimized(
    tiles: Array<{ x: number; y: number; tile: TileData }>
  ): void {
    if (!tiles.length) { this.graphics.clear(); return; }

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width, cam.height, 0, 0, cam.zoom
    );

    const zoom = cam.zoom;
    const lod  = calculateLevelOfDetail(zoom);
    const drawDecor = shouldRenderDecorations(zoom, lod);

    /* DEBUG HUD */
    if (this.debugText) {
      const total = this.boardConfig.width * this.boardConfig.height;
      this.debugText.setText([
        `Board: ${this.boardConfig.width}×${this.boardConfig.height}`,
        shouldUseViewportCulling(this.boardConfig.width, this.boardConfig.height)
          ? `Culling: ${tiles.length}/${total}`
          : `No Culling`,
        `Zoom: ${zoom.toFixed(2)}`,
      ]);
    }

    /* agrupa por cor */
    const byColor = new Map<number, Array<{ x: number; y: number }>>();
    tiles.forEach(t => {
      const arr = byColor.get(t.tile.color) ?? [];
      arr.push({ x: t.x, y: t.y });
      byColor.set(t.tile.color, arr);
    });

    this.graphics.clear();

    /* desenha cada cor em lote */
    byColor.forEach((list, color) => {
      this.graphics.fillStyle(color, 1).beginPath();

      let quads = 0;
      list.forEach(({ x, y }) => {
        if (quads >= MAX_QUADS_PER_BATCH) {
          this.graphics.fillPath();
          if (drawDecor) this.graphics.lineStyle(2, 0x000000, 1).strokePath();
          this.graphics.beginPath();
          quads = 0;
        }

        const { x: sx, y: sy } = toScreenPos(x, y, TILE_SIZE, TILE_HEIGHT);
        const wx = sx + offsetX;
        const wy = sy + offsetY;

        this.graphics.moveTo(wx, wy - TILE_HEIGHT / 2);
        this.graphics.lineTo(wx + TILE_SIZE / 2, wy);
        this.graphics.lineTo(wx, wy + TILE_HEIGHT / 2);
        this.graphics.lineTo(wx - TILE_SIZE / 2, wy);
        this.graphics.closePath();
        quads++;
      });

      this.graphics.fillPath();
      if (drawDecor) this.graphics.lineStyle(2, 0x000000, 1).strokePath();
    });
  }

  /* ================================================================== */
  /*  GHOST TILE                                                         */
  /* ================================================================== */

  private redrawGhost(): void {
    this.ghostGraphics.clear();

    const st = this.dragController.getState();
    if (!st.isDragging || !st.tile || !st.ghostPos) return;

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width, cam.height, 0, 0, cam.zoom
    );

    const snapped = screenToTileWithSnap(
      st.ghostPos.x - offsetX,
      st.ghostPos.y - offsetY,
      TILE_SIZE, TILE_HEIGHT,
      this.boardConfig.width, this.boardConfig.height
    );

    const drawDia = (cx: number, cy: number, a: number, stroke: number) => {
      this.ghostGraphics.fillStyle(st.tile!.color, a);
      this.ghostGraphics.beginPath();
      this.ghostGraphics.moveTo(cx, cy - TILE_HEIGHT / 2);
      this.ghostGraphics.lineTo(cx + TILE_SIZE / 2, cy);
      this.ghostGraphics.lineTo(cx, cy + TILE_HEIGHT / 2);
      this.ghostGraphics.lineTo(cx - TILE_SIZE / 2, cy);
      this.ghostGraphics.closePath();
      this.ghostGraphics.fillPath();
      this.ghostGraphics.lineStyle(3, stroke, 0.9).strokePath();
    };

    if (snapped) {
      const { x: sx, y: sy } = toScreenPos(
        snapped.tileX, snapped.tileY, TILE_SIZE, TILE_HEIGHT
      );
      drawDia(sx + offsetX, sy + offsetY, 0.7, 0x00ff00);
    } else {
      drawDia(st.ghostPos.x, st.ghostPos.y, 0.3, 0xff0000);
    }
  }

  /* ================================================================== */
  /*  TILE PICKING                                                       */
  /* ================================================================== */

  private checkTileHover(worldX: number, worldY: number, screenX: number, screenY: number): void {
    const hoveredTile = this.findTileAtPositionOptimized(worldX, worldY);
    
    // Verificar se mudou o tile sob hover
    const changed = !this.tilesEqual(hoveredTile, this.lastHoveredTile);
    
    if (changed) {
      this.lastHoveredTile = hoveredTile;
      
      if (hoveredTile && this.onTileHover) {
        const r = this.game.canvas.getBoundingClientRect();
        this.onTileHover(hoveredTile.tile, {
          x: screenX + r.left,
          y: screenY + r.top,
        });
      } else if (this.onTileHover) {
        this.onTileHover(null, null);
      }
    }
  }

  private clearTileHover(): void {
    if (this.lastHoveredTile && this.onTileHover) {
      this.onTileHover(null, null);
      this.lastHoveredTile = null;
    }
  }

  private tilesEqual(
    a: { tile: TileData; x: number; y: number } | null,
    b: { tile: TileData; x: number; y: number } | null
  ): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.tile.id === b.tile.id && a.x === b.x && a.y === b.y;
  }

  private findTileAtPositionOptimized(
    worldX: number, worldY: number
  ): { tile: TileData; x: number; y: number } | null {
    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width, cam.height, 0, 0, cam.zoom
    );

    /* --- abordagem para boards grandes usa spatial index --- */
    if (this.isLargeBoard) {
      const snap = screenToTileWithSnap(
        worldX - offsetX, worldY - offsetY,
        TILE_SIZE, TILE_HEIGHT,
        this.boardConfig.width, this.boardConfig.height
      );
      if (snap) {
        const tile = this.boardManager.getTileAt(snap.tileX, snap.tileY);
        if (tile) return { tile, x: snap.tileX, y: snap.tileY };
      }

      const tc = toTilePos(
        worldX - offsetX, worldY - offsetY,
        TILE_SIZE, TILE_HEIGHT
      );
      const nearby = this.boardManager.getTilesNearPoint(
        tc.tileX, tc.tileY, 1.5
      );

      for (const t of nearby) {
        if (isPointInIsometricTile(
          worldX, worldY,
          t.x, t.y,
          TILE_SIZE, TILE_HEIGHT,
          offsetX, offsetY
        )) {
          return { tile: t.tile, x: t.x, y: t.y };
        }
      }
      return null;
    }

    /* --- boards pequenos: brute-force --- */
    const tiles = this.boardManager.getState();
    for (const t of tiles) {
      if (isPointInIsometricTile(
        worldX, worldY,
        t.x, t.y,
        TILE_SIZE, TILE_HEIGHT,
        offsetX, offsetY
      ))
        return { tile: t.tile, x: t.x, y: t.y };
    }

    /* fallback snap */
    const snap = screenToTileWithSnap(
      worldX - offsetX, worldY - offsetY,
      TILE_SIZE, TILE_HEIGHT,
      this.boardConfig.width, this.boardConfig.height
    );
    if (snap) {
      const found = tiles.find(t => t.x === snap.tileX && t.y === snap.tileY);
      if (found) return { tile: found.tile, x: found.x, y: found.y };
    }

    return null;
  }

  /* ================================================================== */
  /*  EXEMPLO DE TILES                                                   */
  /* ================================================================== */
  private addExampleTiles() {
    [
      { 
        x: 0, 
        y: 0, 
        color: 0x8ecae6,
        metadata: {
          label: 'Água Cristalina',
          description: 'Uma fonte de água pura e cristalina, essencial para a vida.',
          properties: {
            pureza: 95,
            temperatura: 18,
            profundidade: 3,
            tipo: 'Natural'
          }
        }
      },
      { 
        x: 1, 
        y: 0, 
        color: 0xffb703,
        metadata: {
          label: 'Areia Dourada',
          description: 'Areia fina e dourada, perfeita para construção.',
          properties: {
            granulacao: 'Fina',
            dureza: 7,
            origem: 'Deserto',
            valor: 150
          }
        }
      },
      { 
        x: 0, 
        y: 1, 
        color: 0x43a047,
        metadata: {
          label: 'Grama Verde',
          description: 'Grama exuberante que cresce em solos férteis.',
          properties: {
            fertilidade: 85,
            altura: 12,
            estacao: 'Primavera',
            crescimento: 'Rápido'
          }
        }
      },
      { 
        x: 2, 
        y: 1, 
        color: 0xff006e,
        metadata: {
          label: 'Cristal Mágico',
          description: 'Um cristal raro que emana energia mística.',
          properties: {
            energia: 250,
            raridade: 'Épico',
            magia: 'Fogo',
            valor: 1000,
            brilho: 'Intenso'
          }
        }
      },
      { 
        x: 1, 
        y: 2, 
        color: 0x8338ec,
        metadata: {
          label: 'Pedra Roxa',
          description: 'Uma pedra misteriosa com propriedades desconhecidas.',
          properties: {
            peso: 45,
            dureza: 9,
            origem: 'Vulcânica',
            magnetismo: 'Fraco',
            idade: '1000 anos'
          }
        }
      },
    ].forEach(({ x, y, color, metadata }) => {
      if (x < this.boardConfig.width && y < this.boardConfig.height) {
        this.boardManager.placeTile(x, y, {
          id: `example-${x}-${y}`,
          type: 'example',
          color,
          metadata,
        });
      }
    });
  }

  /* ================================================================== */
  /*  MÉTODOS PÚBLICOS                                                   */
  /* ================================================================== */

  public getVisibleTiles(): Array<{ x: number; y: number; tile: TileData }> {
    if (!this.lastVisibleRange) {
      // Se não há range visível definido, retorna todos os tiles
      return this.boardManager.getState();
    }

    const cam = this.cameras.main;
    const { offsetX, offsetY } = calculateDynamicIsoOffsets(
      cam.width, cam.height, 0, 0, cam.zoom
    );
    const { cx, cy } = this.getCamCenter();
    const boardCx = cx - offsetX;
    const boardCy = cy - offsetY;

    const useCull = shouldUseViewportCulling(
      this.boardConfig.width, this.boardConfig.height
    );

    if (useCull && this.lastVisibleRange) {
      const q: SpatialQuery = {
        minX: this.lastVisibleRange.startX, 
        maxX: this.lastVisibleRange.endX,
        minY: this.lastVisibleRange.startY, 
        maxY: this.lastVisibleRange.endY,
      };
      return this.boardManager.getVisibleTiles(q);
    }

    return this.boardManager.getState();
  }
}
