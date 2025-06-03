import React, { useEffect, useRef } from 'react';
import { gridToScreen } from '../core/math/isoCoordinate';
import type { TileData } from '../core/models/Tile';

export interface IsoBoardCanvasProps {
  tiles: TileData[];
  tileSize: { width: number; height: number };
  cameraOffset?: { x: number; y: number };
  cameraZoom?: number;
  renderTile: (
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    screenX: number,
    screenY: number,
    zoom: number
  ) => void;
  backgroundColor?: string;
}

export const IsoBoardCanvas: React.FC<IsoBoardCanvasProps> = ({
  tiles,
  tileSize,
  cameraOffset = { x: 0, y: 0 },
  cameraZoom = 1,
  renderTile,
  backgroundColor = '#1a1a1a',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajusta o tamanho do canvas para a janela
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Centro de zoom aplicado
    ctx.setTransform(cameraZoom, 0, 0, cameraZoom, 0, 0);

    // Limpa e pinta fundo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderiza todos os tiles
    for (const tile of tiles) {
      const { x, y } = gridToScreen(
        tile.position,
        tile.size.width,
        tile.size.height,
        cameraOffset.x,
        cameraOffset.y
      );
      renderTile(ctx, tile, x, y, cameraZoom);
    }
  }, [tiles, tileSize, cameraOffset, cameraZoom, renderTile, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onContextMenu={e => e.preventDefault()}
    />
  );
};
