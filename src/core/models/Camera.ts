import { type Point, type Viewport, type BoardSize, clampCamera, freeCameraMovement, applyZoom } from '../math/cameraMath';

/**
 * Classe que armazena estado da câmera (posição e zoom) e expõe
 * métodos para pan e zoom, garantindo limites via cameraMath.
 */

export interface CameraState {
  pos: Point;
  zoom: number;
}

export class Camera {
  private pos: Point;
  private zoom: number;
  private viewport: Viewport;
  private boardSizeInPx: BoardSize;
  private freeNavigation: boolean; // Flag para navegação livre

  /**
   * @param initPos Posição inicial da câmera (x,y) em px.
   * @param initZoom Zoom inicial.
   * @param viewport Tamanho do viewport (aparência) em px.
   * @param boardSizeInPx Tamanho total do tabuleiro (em px).
   * @param freeNavigation Se true, permite navegação livre sem limites.
   */
  constructor(
    initPos: Point,
    initZoom: number,
    viewport: Viewport,
    boardSizeInPx: BoardSize,
    freeNavigation: boolean = true // Padrão é navegação livre
  ) {
    this.pos = { ...initPos };
    this.zoom = initZoom;
    this.viewport = { ...viewport };
    this.boardSizeInPx = { ...boardSizeInPx };
    this.freeNavigation = freeNavigation;
    this.clamp(); // garante limites já no construtor (se necessário)
  }

  /**
   * Ajusta a posição (pan) somando dx, dy; depois aplica clamp se necessário.
   */
  pan(dx: number, dy: number): void {
    this.pos = { x: this.pos.x + dx, y: this.pos.y + dy };
    this.clamp();
  }

  /**
   * Ajusta o zoom com delta; usa applyZoom para limitar e depois clamp.
   */
  zoomBy(delta: number): void {
    this.zoom = applyZoom(this.zoom, delta);
    this.clamp();
  }

  /**
   * Força a câmera a ficar dentro dos limites do tabuleiro (em px), usando cameraMath.clampCamera.
   * Se freeNavigation estiver ativado, não aplica qualquer limite.
   */
  private clamp(): void {
    if (this.freeNavigation) {
      // Navegação livre - não aplica nenhum limite
      this.pos = freeCameraMovement(this.pos);
    } else {
      // Navegação com limites tradicionais
      const clamped = clampCamera(
        this.pos,
        this.viewport,
        this.boardSizeInPx
      );
      this.pos = clamped;
    }
  }

  /** Retorna posição atual. */
  getPosition(): Point {
    return { ...this.pos };
  }

  /** Retorna zoom atual. */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Atualiza o tamanho do viewport (por ex., após resize na tela do usuário).
   */
  setViewport(viewport: Viewport): void {
    this.viewport = { ...viewport };
    this.clamp();
  }

  /**
   * Atualiza o tamanho total do tabuleiro (em px). Útil se o tabuleiro mudar de dimensões.
   */
  setBoardSize(boardSize: BoardSize): void {
    this.boardSizeInPx = { ...boardSize };
    this.clamp();
  }

  /**
   * Ativa ou desativa a navegação livre.
   */
  setFreeNavigation(enabled: boolean): void {
    this.freeNavigation = enabled;
    this.clamp(); // Reaplica os limites com a nova configuração
  }

  /**
   * Retorna se a navegação livre está ativada.
   */
  isFreeNavigationEnabled(): boolean {
    return this.freeNavigation;
  }
}
