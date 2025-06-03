/**
 * Todos os “magic-numbers” centralizados.
 * Ajuste aqui e toda a engine seguirá.
 */

export const CHUNK_SIZE             = 64;   // Spatial-index chunk (tiles)
export const CULLING_TILE_THRESHOLD = 900;  // ≥ 30 × 30 → ativa viewport-culling
export const RERENDER_THROTTLE_MS   = 35;   // 2 frames (~60 FPS)
export const MAX_QUADS_PER_BATCH    = 1500; // WebGL path safety (< 65 k vertices)

export const ZOOM_MIN           = 0.3;
export const ZOOM_MAX           = 4;
export const ZOOM_SCROLL_FACTOR = 0.0007; // sensibilidade do wheel

/** Verdade em dev, falso em produção */
export const __DEV__ = process.env.NODE_ENV !== 'production';
