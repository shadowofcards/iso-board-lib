import React, { useEffect, useRef, forwardRef } from 'react';
import type { Ref } from 'react';
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

/**
 * Este componente agora usa `forwardRef` para expor a referência do <canvas>
 * para o CameraHandler, evitando `document.querySelector('canvas')`.
 */
export const IsoBoardCanvas = forwardRef(function IsoBoardCanvas(
  {
    tiles,
    tileSize,
    cameraOffset = { x: 0, y: 0 },
    cameraZoom = 1,
    renderTile,
    backgroundColor = '#1a1a1a',
  }: IsoBoardCanvasProps,
  ref: Ref<HTMLCanvasElement>
) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);

  // Se o usuário passou um ref externo, ligamos a ambos
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(internalRef.current);
    } else if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<HTMLCanvasElement | null>).current =
        internalRef.current;
    }
  }, [ref]);

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ---- 1) Ajusta tamanho do canvas para preencher a janela ----
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Depois de ajustar o tamanho, vamos redesenhar o conteúdo
      draw();
    };

    // ---- 2) Desenha todo o conteúdo do canvas (pan/zoom + tiles) ----
    const draw = () => {
      // Primeiro, limpamos TODO o canvas SEM zoom aplicado
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 3) Agora aplicamos transform do zoom e pan via setTransform
      //    Mover o contexto pela tradução (offsetX, offsetY), depois escalar
      //    Note que o offset é multiplicado pelo zoom para funcionar corretamente
      ctx.setTransform(
        cameraZoom,
        0,
        0,
        cameraZoom,
        -cameraOffset.x * cameraZoom,
        -cameraOffset.y * cameraZoom
      );

      // 4) Pinta o fundo (já em escala normal, mas como checamos antes, vai cobrir tudo)
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width / cameraZoom, canvas.height / cameraZoom);

      // 5) Renderiza cada tile nas coordenadas calculadas
      for (const tile of tiles) {
        // Converte posição lógica para tela (sem considerar zoom, pois aplicamos via transform)
        const { x, y } = gridToScreen(
          tile.position,
          tileSize.width,
          tileSize.height,
          cameraOffset.x,
          cameraOffset.y
        );
        renderTile(ctx, tile, x, y, cameraZoom);
      }
    };

    // Desenha pela primeira vez
    updateSize();

    // Sempre que alguma dependência mudar, redesenha
    // (tileSize não entra no cálculo diretamente, mas pode afetar se renderTile usar)
  }, [tiles, tileSize, cameraOffset, cameraZoom, renderTile, backgroundColor]);

  // Escutamos redimensionamento de janela para ajustar canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = internalRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Note: o draw já está embutido no useEffect anterior via mudança de cameraZoom, etc.
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={internalRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});
