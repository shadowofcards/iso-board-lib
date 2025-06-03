export interface CameraState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export function createDefaultCamera(): CameraState {
  return {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  };
}
