/**
 * Constantes básicas de dimensões e lista de tiles disponíveis.
 */

import type { TileData } from './models/Tile';

export const TILE_SIZE = 128;
export const TILE_HEIGHT = 64;

/**
 * Calcula os offsets para centralizar o tabuleiro isométrico
 * @param viewportWidth Largura do viewport em pixels
 * @param viewportHeight Altura do viewport em pixels
 * @returns Offsets X e Y para centralizar o grid
 */
export function calculateIsoOffsets(viewportWidth: number, viewportHeight: number) {
  return {
    offsetX: viewportWidth / 2,
    offsetY: viewportHeight / 2 - 50, // Ajustado para melhor precisão de drop
  };
}

/**
 * Tiles disponíveis por padrão. Cada tile tem id, tipo, cor (hex) e metadados opcionais.
 */
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
        resistencia: 'Baixa'
      }
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
        resistencia: 'Muito Baixa'
      }
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
        resistencia: 'Média'
      }
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
        resistencia: 'Alta'
      }
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
        resistencia: 'Nenhuma'
      }
    },
  },
];

/**
 * Converte número inteiro de cor (0xRRGGBB) para string hexadecimal de 6 dígitos,
 * sem o prefixo '#', útil em CSS inline.
 */
export function formatHex(color: number): string {
  const hex = color.toString(16).padStart(6, '0');
  return hex;
}
