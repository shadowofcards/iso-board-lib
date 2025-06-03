/**
 * Interface pura para representar os metadados de um tile no tabuleiro.
 * 
 * - id: string único (pode ser UUID ou simples “1”, “2”).
 * - type: nome do tipo de tile (por ex., “grass”).
 * - color: número (0xRRGGBB) para cor principal de exibição.
 * - metadata: campos extras (ex.: label, cores clara/escura, etc).
 */

export interface TileData {
  id: string;
  type: string;
  color: number;
  metadata?: Record<string, any>;
}
