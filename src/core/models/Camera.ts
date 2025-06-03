/**
 * CameraState
 *
 * Represents the current camera transform:
 *  - offsetX, offsetY: translation in world (grid) units
 *  - zoom: scaling factor (1 = 100%)
 */
export interface CameraState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/**
 * createDefaultCamera
 *
 * Returns a new CameraState with default values:
 *  - offsetX: 0
 *  - offsetY: 0
 *  - zoom: 1
 *
 * This represents an untransformed view.
 *
 * @returns A CameraState object with default offset and zoom.
 */
export function createDefaultCamera(): CameraState {
  return {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  };
}
