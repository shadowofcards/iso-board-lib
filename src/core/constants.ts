/**
 * Dimensões-base do grid isométrico,
 * lista de tiles de exemplo e utilitários de cor/offset.
 */

import type { TileData } from './models/Tile';

export const TILE_SIZE   = 128;
export const TILE_HEIGHT =  64;

/* ------------------------------------------------------------------ */
/*  OFFSETS                                                           */
/* ------------------------------------------------------------------ */

/**
 * Offset fixo para centralizar o grid.
 * A câmera do Phaser é que fará todo o pan/zoom;
 * aqui devolvemos apenas uma translação constante
 * para posicionar o tile (0,0) perto do centro da tela.
 *
 *  - viewportWidth/viewportHeight estão em pixels de tela
 *  - zoom: fator atual da câmera (1 = 100 %)
 *
 * Retorna coordenadas em unidades de “mundo” (não-escaladas).
 */
export function calculateDynamicIsoOffsets(
  viewportWidth:  number,
  viewportHeight: number,
  _cameraX: number = 0,   // << ignorado agora
  _cameraY: number = 0,   // << ignorado agora
  zoom: number    = 1
) {
  // converte metade da tela para unidades de mundo
  const halfW = (viewportWidth  * 0.5) / zoom;
  const halfH = (viewportHeight * 0.5) / zoom;

  return { offsetX: halfW, offsetY: halfH };
}

/**
 * Conversão 0xRRGGBB → "RRGGBB".
 */
export function formatHex(color: number): string {
  return color.toString(16).padStart(6, '0');
}

/* ------------------------------------------------------------------ */
/*  TILES DE EXEMPLO (mantidos)                                       */
/* ------------------------------------------------------------------ */

export const AVAILABLE_TILES: TileData[] = [
  {
    id: '1',
    type: 'grass',
    color: 0x8ecae6,
    metadata: {
      label: 'Grama',
      description: 'Terreno básico de grama, ideal para construções simples',
      dark: 0x3a86a8,
      light: 0xbde0fe,
      properties: {
        durabilidade: 75,
        custo: 10,
        tipo: 'Terreno',
        produção: 'Nenhuma',
        resistencia: 'Baixa',
      },
    },
  },
  {
    id: '2',
    type: 'sand',
    color: 0xffb703,
    metadata: {
      label: 'Areia',
      description: 'Terreno arenoso, facilita construção de estradas',
      dark: 0xc97a00,
      light: 0xffe066,
      properties: {
        durabilidade: 50,
        custo: 5,
        tipo: 'Terreno',
        produção: 'Vidro',
        resistencia: 'Muito Baixa',
      },
    },
  },
  {
    id: '3',
    type: 'tree',
    color: 0x43a047,
    metadata: {
      label: 'Árvore',
      description: 'Fonte de madeira renovável, produz oxigênio',
      dark: 0x2d6a4f,
      light: 0x74c69d,
      properties: {
        durabilidade: 100,
        custo: 25,
        tipo: 'Vegetal',
        produção: 'Madeira',
        resistencia: 'Média',
      },
    },
  },
  {
    id: '4',
    type: 'stone',
    color: 0x666666,
    metadata: {
      label: 'Pedra',
      description: 'Material resistente, ideal para fundações',
      dark: 0x333333,
      light: 0x999999,
      properties: {
        durabilidade: 200,
        custo: 30,
        tipo: 'Mineral',
        produção: 'Pedra',
        resistencia: 'Alta',
      },
    },
  },
  {
    id: '5',
    type: 'water',
    color: 0x219ebc,
    metadata: {
      label: 'Água',
      description: 'Fonte de água, necessária para agricultura',
      dark: 0x126782,
      light: 0x8ecae6,
      properties: {
        durabilidade: 'Infinita',
        custo: 0,
        tipo: 'Líquido',
        produção: 'Pesca',
        resistencia: 'Nenhuma',
      },
    },
  },
];
