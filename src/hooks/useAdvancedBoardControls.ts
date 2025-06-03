import { useEffect, useCallback, useRef, useState } from 'react';
import { Camera } from '../core/models/Camera';
import { 
  KEYBOARD_PAN_SPEED, 
  KEYBOARD_PAN_SPEED_FAST, 
  KEYBOARD_ZOOM_STEP,
  CONTROLS_KEYS,
  TELEPORT_ANIMATION_MS,
  AUTO_FOLLOW_SMOOTH_FACTOR
} from '../core/config';

export interface Point2D {
  x: number;
  y: number;
}

export interface BookmarkData {
  id: string;
  name: string;
  position: Point2D;
  zoom: number;
  timestamp: number;
}

export interface AdvancedBoardControlsOptions {
  /** Se deve ativar controles por teclado */
  enableKeyboardControls?: boolean;
  /** Se deve ativar animações suaves */
  enableSmoothAnimations?: boolean;
  /** Referência do container para eventos de teclado */
  containerRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook avançado para controle de board isométrico com funcionalidades extras
 */
export function useAdvancedBoardControls(
  cameraModel: Camera,
  options: AdvancedBoardControlsOptions = {}
) {
  const {
    enableKeyboardControls = true,
    enableSmoothAnimations = true,
    containerRef
  } = options;

  // Estados
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [followTarget, setFollowTarget] = useState<Point2D | null>(null);
  
  // Refs para animações
  const animationRef = useRef<number | undefined>(undefined);
  const followAnimationRef = useRef<number | undefined>(undefined);
  const keyboardLoopRef = useRef<number | undefined>(undefined);

  // === TELEPORTE SUAVE ===
  const teleportTo = useCallback((targetPos: Point2D, targetZoom?: number) => {
    if (!enableSmoothAnimations) {
      cameraModel.pan(
        targetPos.x - cameraModel.getPosition().x,
        targetPos.y - cameraModel.getPosition().y
      );
      if (targetZoom !== undefined) {
        cameraModel.zoomBy((targetZoom - cameraModel.getZoom()) * 100);
      }
      return;
    }

    setIsAnimating(true);
    const startPos = cameraModel.getPosition();
    const startZoom = cameraModel.getZoom();
    const endZoom = targetZoom ?? startZoom;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / TELEPORT_ANIMATION_MS, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentX = startPos.x + (targetPos.x - startPos.x) * easeProgress;
      const currentY = startPos.y + (targetPos.y - startPos.y) * easeProgress;
      const currentZoom = startZoom + (endZoom - startZoom) * easeProgress;

      cameraModel.pan(currentX - cameraModel.getPosition().x, currentY - cameraModel.getPosition().y);
      
      if (Math.abs(currentZoom - cameraModel.getZoom()) > 0.01) {
        cameraModel.zoomBy((currentZoom - cameraModel.getZoom()) * 100);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [cameraModel, enableSmoothAnimations]);

  // === FUNÇÕES BÁSICAS ===
  const centerCamera = useCallback(() => {
    teleportTo({ x: 0, y: 0 });
  }, [teleportTo]);

  const resetZoom = useCallback(() => {
    const currentPos = cameraModel.getPosition();
    teleportTo(currentPos, 1.0);
  }, [teleportTo, cameraModel]);

  // === BOOKMARKS ===
  const addBookmark = useCallback((name: string, position?: Point2D, zoom?: number) => {
    const bookmarkPos = position ?? cameraModel.getPosition();
    const bookmarkZoom = zoom ?? cameraModel.getZoom();
    
    const newBookmark: BookmarkData = {
      id: `bookmark_${Date.now()}`,
      name,
      position: bookmarkPos,
      zoom: bookmarkZoom,
      timestamp: Date.now()
    };

    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark.id;
  }, [cameraModel]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const goToBookmark = useCallback((id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      teleportTo(bookmark.position, bookmark.zoom);
    }
  }, [bookmarks, teleportTo]);

  // === AUTO-SEGUIMENTO ===
  const startFollowing = useCallback((target: Point2D) => {
    setFollowTarget(target);
  }, []);

  const stopFollowing = useCallback(() => {
    setFollowTarget(null);
    if (followAnimationRef.current) {
      cancelAnimationFrame(followAnimationRef.current);
    }
  }, []);

  // === CONTROLES DE TECLADO ===
  useEffect(() => {
    if (!enableKeyboardControls) return;

    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target) return false;
      const element = target as HTMLElement;
      return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input/textarea
      if (isInputElement(e.target)) {
        return;
      }

      const key = e.code;
      
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(key);
        return newSet;
      });
      
      // Controles instantâneos
      if ((CONTROLS_KEYS.CENTER as readonly string[]).includes(key)) {
        e.preventDefault();
        centerCamera();
      } else if ((CONTROLS_KEYS.RESET_ZOOM as readonly string[]).includes(key)) {
        e.preventDefault();
        resetZoom();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input/textarea
      if (isInputElement(e.target)) {
        return;
      }
      
      const key = e.code;
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    // Sempre usar document como fallback para garantir captura
    const targetElement = containerRef?.current || document;
    
    // Se há containerRef, configurar para receber eventos
    if (containerRef?.current) {
      const container = containerRef.current;
      container.setAttribute('tabindex', '0');
      container.style.outline = 'none';
      
      // Tentar dar foco (sem forçar se já tiver)
      if (document.activeElement !== container) {
        container.focus();
      }
      
      // Listeners no container específico
      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('keyup', handleKeyUp);
    } else {
      // Fallback para document
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (containerRef?.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
        containerRef.current.removeEventListener('keyup', handleKeyUp);
      } else {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [enableKeyboardControls, containerRef, centerCamera, resetZoom]);

  // === LOOP DE MOVIMENTO CONTÍNUO ===
  useEffect(() => {
    if (!enableKeyboardControls || pressedKeys.size === 0) {
      if (keyboardLoopRef.current) {
        cancelAnimationFrame(keyboardLoopRef.current);
        keyboardLoopRef.current = undefined;
      }
      return;
    }

    const updateLoop = () => {
      // Verificar se ainda há teclas pressionadas
      if (pressedKeys.size === 0) {
        keyboardLoopRef.current = undefined;
        return;
      }

      const isSpeedModifierPressed = (CONTROLS_KEYS.SPEED_MODIFIER as readonly string[]).some(key => 
        pressedKeys.has(key)
      );
      const panSpeed = isSpeedModifierPressed ? KEYBOARD_PAN_SPEED_FAST : KEYBOARD_PAN_SPEED;
      
      let dx = 0, dy = 0, zoomDelta = 0;

      // Movimento
      if ((CONTROLS_KEYS.PAN_LEFT as readonly string[]).some(key => pressedKeys.has(key))) {
        dx -= panSpeed;
      }
      if ((CONTROLS_KEYS.PAN_RIGHT as readonly string[]).some(key => pressedKeys.has(key))) {
        dx += panSpeed;
      }
      if ((CONTROLS_KEYS.PAN_UP as readonly string[]).some(key => pressedKeys.has(key))) {
        dy -= panSpeed;
      }
      if ((CONTROLS_KEYS.PAN_DOWN as readonly string[]).some(key => pressedKeys.has(key))) {
        dy += panSpeed;
      }

      // Zoom
      if ((CONTROLS_KEYS.ZOOM_IN as readonly string[]).some(key => pressedKeys.has(key))) {
        zoomDelta += KEYBOARD_ZOOM_STEP;
      }
      if ((CONTROLS_KEYS.ZOOM_OUT as readonly string[]).some(key => pressedKeys.has(key))) {
        zoomDelta -= KEYBOARD_ZOOM_STEP;
      }

      // Aplicar movimentos
      if (dx !== 0 || dy !== 0) {
        cameraModel.pan(dx, dy);
      }
      if (zoomDelta !== 0) {
        cameraModel.zoomBy(zoomDelta * 100);
      }

      keyboardLoopRef.current = requestAnimationFrame(updateLoop);
    };

    keyboardLoopRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (keyboardLoopRef.current) {
        cancelAnimationFrame(keyboardLoopRef.current);
        keyboardLoopRef.current = undefined;
      }
    };
  }, [pressedKeys, enableKeyboardControls, cameraModel]);

  // === LOOP DE AUTO-SEGUIMENTO ===
  useEffect(() => {
    if (!followTarget) {
      if (followAnimationRef.current) {
        cancelAnimationFrame(followAnimationRef.current);
        followAnimationRef.current = undefined;
      }
      return;
    }

    const followLoop = () => {
      if (!followTarget) {
        followAnimationRef.current = undefined;
        return;
      }

      const currentPos = cameraModel.getPosition();
      const dx = (followTarget.x - currentPos.x) * AUTO_FOLLOW_SMOOTH_FACTOR;
      const dy = (followTarget.y - currentPos.y) * AUTO_FOLLOW_SMOOTH_FACTOR;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        cameraModel.pan(dx, dy);
      }

      followAnimationRef.current = requestAnimationFrame(followLoop);
    };

    followAnimationRef.current = requestAnimationFrame(followLoop);

    return () => {
      if (followAnimationRef.current) {
        cancelAnimationFrame(followAnimationRef.current);
        followAnimationRef.current = undefined;
      }
    };
  }, [followTarget, cameraModel]);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (followAnimationRef.current) {
        cancelAnimationFrame(followAnimationRef.current);
      }
      if (keyboardLoopRef.current) {
        cancelAnimationFrame(keyboardLoopRef.current);
      }
    };
  }, []);

  return {
    // Controles básicos
    teleportTo,
    centerCamera,
    resetZoom,
    
    // Bookmarks
    bookmarks,
    addBookmark,
    removeBookmark,
    goToBookmark,
    
    // Auto-seguimento
    startFollowing,
    stopFollowing,
    isFollowing: followTarget !== null,
    followTarget,
    
    // Estados
    isAnimating,
    pressedKeys: Array.from(pressedKeys),
    
    // Utilities
    getCurrentPosition: () => cameraModel.getPosition(),
    getCurrentZoom: () => cameraModel.getZoom()
  };
} 