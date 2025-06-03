export interface Camera {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/**
 * Aplica um delta de panning (arrastar).
 */
export function applyPan(
  camera: Camera,
  deltaX: number,
  deltaY: number
): Camera {
  return {
    ...camera,
    offsetX: camera.offsetX + deltaX,
    offsetY: camera.offsetY + deltaY,
  };
}

/**
 * Aplica um zoom relativo com limite.
 */
export function applyZoom(
  camera: Camera,
  deltaZoom: number,
  min = 0.5,
  max = 2
): Camera {
  const newZoom = Math.max(min, Math.min(max, camera.zoom + deltaZoom));
  return {
    ...camera,
    zoom: newZoom,
  };
}
