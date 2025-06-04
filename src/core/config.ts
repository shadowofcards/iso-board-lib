/**
 * Todos os "magic-numbers" centralizados.
 * Ajuste aqui e toda a engine seguirá.
 */

export const CHUNK_SIZE             = 64;   // Spatial-index chunk (tiles)
export const CULLING_TILE_THRESHOLD = 900;  // ≥ 30 × 30 → ativa viewport-culling
export const RERENDER_THROTTLE_MS   = 35;   // 2 frames (~60 FPS)
export const MAX_QUADS_PER_BATCH    = 1500; // WebGL path safety (< 65 k vertices)

export const ZOOM_MIN           = 0.3;
export const ZOOM_MAX           = 4;
export const ZOOM_SCROLL_FACTOR = 0.001; // sensibilidade do wheel

// ==================== CONTROLES DE NAVEGAÇÃO ====================
export const KEYBOARD_PAN_SPEED      = 8;    // Velocidade base do pan por teclado (px/frame)
export const KEYBOARD_PAN_SPEED_FAST = 16;   // Velocidade rápida (com Shift)
export const KEYBOARD_ZOOM_STEP      = 0.1;  // Step do zoom por teclado
export const TELEPORT_ANIMATION_MS   = 500;  // Duração da animação de teleporte
export const AUTO_FOLLOW_SMOOTH_FACTOR = 0.08; // Suavização do auto-seguimento (0-1)
export const CENTER_ANIMATION_MS     = 300;  // Duração da animação de centralização

// Teclas de controle (configuráveis)
export const CONTROLS_KEYS = {
  PAN_UP:     ['ArrowUp', 'KeyW'],
  PAN_DOWN:   ['ArrowDown', 'KeyS'], 
  PAN_LEFT:   ['ArrowLeft', 'KeyA'],
  PAN_RIGHT:  ['ArrowRight', 'KeyD'],
  ZOOM_IN:    ['Equal', 'NumpadAdd'],
  ZOOM_OUT:   ['Minus', 'NumpadSubtract'],
  SPEED_MODIFIER: ['ShiftLeft', 'ShiftRight'], // Para velocidade rápida
  CENTER:     ['KeyC', 'Space'],
  RESET_ZOOM: ['KeyR', 'Digit0']
} as const;

/** Verdade em dev, falso em produção */
export const __DEV__ = process.env.NODE_ENV !== 'production';
