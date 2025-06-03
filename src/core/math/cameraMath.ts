/**
 * Camera
 *
 * Represents the current camera state:
 *  - offsetX, offsetY: translation in world (grid) units
 *  - zoom: scaling factor
 */
export interface Camera {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/**
 * Applies a panning delta to the camera.
 *
 * @param camera - Current camera state
 * @param deltaX - Change in X (world units)
 * @param deltaY - Change in Y (world units)
 * @returns A new Camera object with updated offsetX/offsetY
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
 * Applies a relative zoom change to the camera, clamped to [min, max].
 *
 * @param camera - Current camera state
 * @param deltaZoom - Amount to change the zoom by (e.g. 0.1 to zoom in 10%)
 * @param min - Minimum allowed zoom (default 0.5)
 * @param max - Maximum allowed zoom (default 2)
 * @returns A new Camera object with updated zoom (clamped)
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
