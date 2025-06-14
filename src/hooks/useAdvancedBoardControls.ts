import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Camera } from '../core/models/Camera';
import {
  KEYBOARD_PAN_SPEED,
  KEYBOARD_PAN_SPEED_FAST,
  KEYBOARD_ZOOM_STEP,
  CONTROLS_KEYS,
  TELEPORT_ANIMATION_MS,
  AUTO_FOLLOW_SMOOTH_FACTOR,
} from '../core/config';

/* ------------------------------------------------------------------ */
/*  Tipos públicos                                                     */
/* ------------------------------------------------------------------ */
export interface Point2D { x: number; y: number }
export interface BookmarkData {
  id: string;
  name: string;
  position: Point2D;
  zoom: number;
  timestamp: number;
}

export interface AdvancedControlsConfig {
  /**
   * Se habilita controles de teclado (WASD, setas, etc.).
   * Padrão: true
   */
  enableKeyboardControls?: boolean;

  /**
   * Se habilita animações suaves para teleporte/follow.
   * Padrão: true
   */
  enableSmoothAnimations?: boolean;

  /**
   * Ref do container onde ouvir eventos de teclado.
   * Se null/undefined, escuta no window.
   */
  containerRef?: React.RefObject<HTMLElement>;

  /**
   * 🔧 NOVO: Callback chamado quando a câmera se move (teclado, teleporte, etc.)
   * Útil para limpar popups ou atualizar UI
   */
  onCameraMove?: () => void;
}

export interface AdvancedBoardControls {
  // Estado atual
  getCurrentPosition: () => { x: number; y: number };
  getCurrentZoom: () => number;
  isAnimating: boolean;
  isFollowing: boolean;
  
  // Controles básicos
  centerCamera: () => void;
  resetZoom: () => void;
  
  // Teleporte
  teleportTo: (position: { x: number; y: number }) => void;
  
  // Bookmarks
  bookmarks: BookmarkData[];
  addBookmark: (name: string) => void;
  removeBookmark: (id: string) => void;
  goToBookmark: (id: string) => void;
  
  // Auto-seguimento
  startFollowing: (target: { x: number; y: number }) => void;
  stopFollowing: () => void;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export const useAdvancedBoardControls = (
  camera: Camera,
  config: AdvancedControlsConfig = {}
): AdvancedBoardControls => {
  /* ======================   STATE React   ======================= */
  const [bookmarks,  setBookmarks]  = useState<BookmarkData[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followTarget, setFollow]   = useState<Point2D | null>(null);

  /* ======================   REFS mutáveis  ====================== */
  const keysRef          = useRef<Set<string>>(new Set());
  const rafKeyboardRef   = useRef<number | null>(null);
  const rafTeleportRef   = useRef<number | null>(null);
  const rafFollowRef     = useRef<number | null>(null);

  // 🔧 CORREÇÃO DO BUG: Throttling para onCameraMove
  const lastCameraMoveRef = useRef<number>(0);
  const cameraMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCameraMove = useCallback(() => {
    const now = Date.now();
    
    // Throttling: só chamar onCameraMove a cada 300ms para teclado (menos agressivo)
    if (now - lastCameraMoveRef.current < 300) {
      // Se já há um timeout pendente, cancelar
      if (cameraMoveTimeoutRef.current) {
        clearTimeout(cameraMoveTimeoutRef.current);
      }
      
      // Agendar chamada para depois do throttling
      cameraMoveTimeoutRef.current = setTimeout(() => {
        lastCameraMoveRef.current = Date.now();
        config.onCameraMove?.();
      }, 300);
      return;
    }
    
    lastCameraMoveRef.current = now;
    config.onCameraMove?.();
  }, [config.onCameraMove]);

  /* =============================================================== */
  /*  Util: distinguir INPUT/TEXTAREA                                */
  /* =============================================================== */
  const isInputField = (t: EventTarget | null): t is HTMLElement =>
    t instanceof HTMLElement &&
    (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

  /* =============================================================== */
  /*  Teleporte (animado opcional)                                   */
  /* =============================================================== */
  const teleportTo = useCallback(
    (dest: Point2D, destZoom?: number) => {
      /* 1) simples, sem animação ---------------------------------- */
      if (!config.enableSmoothAnimations) {
        const endZoom = destZoom ?? camera.getZoom();
        const start   = camera.getPosition();
        camera.pan(dest.x - start.x, dest.y - start.y);
        camera.zoomBy(endZoom - camera.getZoom());
        throttledCameraMove();
        return;
      }

      /* 2) animação ------------------------------------------------ */
      setIsAnimating(true);
      const start     = camera.getPosition();
      const startZoom = camera.getZoom();
      const endZoom   = destZoom ?? startZoom;
      const t0        = performance.now();

      const step = (now: number) => {
        const p    = Math.min((now - t0) / TELEPORT_ANIMATION_MS, 1);
        const ease = 1 - Math.pow(1 - p, 3);

        const x = start.x + (dest.x - start.x) * ease;
        const y = start.y + (dest.y - start.y) * ease;
        const z = startZoom + (endZoom - startZoom) * ease;

        camera.pan(x - camera.getPosition().x,
                   y - camera.getPosition().y);
        camera.zoomBy(z - camera.getZoom());

        // 🔧 CORREÇÃO DO BUG: Notificar movimento de câmera durante animação
        throttledCameraMove();

        if (p < 1) {
          rafTeleportRef.current = requestAnimationFrame(step);
        } else {
          setIsAnimating(false);
          rafTeleportRef.current = null;
        }
      };

      if (rafTeleportRef.current !== null) {
        cancelAnimationFrame(rafTeleportRef.current);
      }
      rafTeleportRef.current = requestAnimationFrame(step);
    },
    [camera, config.enableSmoothAnimations, throttledCameraMove],
  );

  /* Atalhos prontos */
  const centerCamera = useCallback(
    () => teleportTo({ x: 0, y: 0 }),
    [teleportTo],
  );
  const resetZoom = useCallback(
    () => teleportTo(camera.getPosition(), 1),
    [teleportTo, camera],
  );

  /* =============================================================== */
  /*  Bookmarks                                                      */
  /* =============================================================== */
  const addBookmark = useCallback(
    (name: string) => {
      const b: BookmarkData = {
        id: `bm_${Date.now()}`,
        name: name || 'bookmark',
        position: camera.getPosition(),
        zoom: camera.getZoom(),
        timestamp: Date.now(),
      };
      setBookmarks(prev => [...prev, b]);
    },
    [camera],
  );

  const removeBookmark = useCallback(
    (id: string) => setBookmarks(bm => bm.filter(b => b.id !== id)),
    [],
  );

  const goToBookmark = useCallback(
    (id: string) => {
      const bm = bookmarks.find(b => b.id === id);
      if (bm) teleportTo(bm.position, bm.zoom);
    },
    [bookmarks, teleportTo],
  );

  /* =============================================================== */
  /*  Auto-follow                                                    */
  /* =============================================================== */
  const startFollowing = useCallback((p: Point2D) => setFollow(p), []);
  const stopFollowing  = useCallback(() => setFollow(null), []);

  /* Loop de follow */
  useEffect(() => {
    if (rafFollowRef.current !== null) {
      cancelAnimationFrame(rafFollowRef.current);
      rafFollowRef.current = null;
    }
    if (!followTarget) return;

    const loop = () => {
      const cur = camera.getPosition();
      const dx  = (followTarget.x - cur.x) * AUTO_FOLLOW_SMOOTH_FACTOR;
      const dy  = (followTarget.y - cur.y) * AUTO_FOLLOW_SMOOTH_FACTOR;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        camera.pan(dx, dy);
        // 🔧 CORREÇÃO DO BUG: Notificar movimento de câmera no follow
        throttledCameraMove();
      }
      rafFollowRef.current = requestAnimationFrame(loop);
    };
    rafFollowRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafFollowRef.current !== null) {
        cancelAnimationFrame(rafFollowRef.current);
        rafFollowRef.current = null;
      }
    };
  }, [followTarget, camera, throttledCameraMove]);

  /* =============================================================== */
  /*  Teclado: captura + loop                                         */
  /* =============================================================== */
  useEffect(() => {
    if (!config.enableKeyboardControls) return;

    /* ---------- captura ---------- */
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (isInputField(e.target)) return;

      keysRef.current.add(e.code);

      if ((CONTROLS_KEYS.CENTER as readonly string[]).includes(e.code)) {
        e.preventDefault(); centerCamera();
      }
      if ((CONTROLS_KEYS.RESET_ZOOM as readonly string[]).includes(e.code)) {
        e.preventDefault(); resetZoom();
      }
    };
    const onKeyUp = (e: globalThis.KeyboardEvent) => {
      if (isInputField(e.target)) return;
      keysRef.current.delete(e.code);
    };

    const tgt: Document | HTMLElement = config.containerRef?.current ?? document;
    tgt.addEventListener('keydown', onKeyDown as EventListener);
    tgt.addEventListener('keyup', onKeyUp as EventListener);

    /* Focus no container (se existir) */
    if (config.containerRef?.current) {
      const el = config.containerRef.current;
      el.tabIndex = 0;
      el.style.outline = 'none';
      el.focus({ preventScroll: true });
    }

    /* ---------- loop ---------- */
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 16.666; /* ≈ frames */
      last = now;

      const keys = keysRef.current;
      if (keys.size) {
        const fast   = (CONTROLS_KEYS.SPEED_MODIFIER as readonly string[])
                         .some(k => keys.has(k));
        const speed  = (fast ? KEYBOARD_PAN_SPEED_FAST : KEYBOARD_PAN_SPEED) * dt;
        const zoomSt = KEYBOARD_ZOOM_STEP * dt;

        let dx = 0, dy = 0, dz = 0;
        if ((CONTROLS_KEYS.PAN_LEFT  as readonly string[]).some(k => keys.has(k))) dx -= speed;
        if ((CONTROLS_KEYS.PAN_RIGHT as readonly string[]).some(k => keys.has(k))) dx += speed;
        if ((CONTROLS_KEYS.PAN_UP    as readonly string[]).some(k => keys.has(k))) dy -= speed;
        if ((CONTROLS_KEYS.PAN_DOWN  as readonly string[]).some(k => keys.has(k))) dy += speed;
        if ((CONTROLS_KEYS.ZOOM_IN   as readonly string[]).some(k => keys.has(k))) dz += zoomSt;
        if ((CONTROLS_KEYS.ZOOM_OUT  as readonly string[]).some(k => keys.has(k))) dz -= zoomSt;

        if (dx || dy) camera.pan(dx, dy);
        if (dz) camera.zoomBy(dz);
        
        // 🔧 CORREÇÃO DO BUG: Notificar movimento de câmera
        if ((dx || dy || dz) && config.onCameraMove) {
          throttledCameraMove();
        }
      }

      rafKeyboardRef.current = requestAnimationFrame(loop);
    };
    rafKeyboardRef.current = requestAnimationFrame(loop);

    /* cleanup */
    return () => {
      tgt.removeEventListener('keydown', onKeyDown as EventListener);
      tgt.removeEventListener('keyup', onKeyUp as EventListener);
      if (rafKeyboardRef.current !== null) {
        cancelAnimationFrame(rafKeyboardRef.current);
        rafKeyboardRef.current = null;
      }
    };
  }, [config.enableKeyboardControls, config.containerRef, centerCamera, resetZoom, camera, throttledCameraMove]);

  /* =============================================================== */
  /*  Limpeza global (unmount)                                        */
  /* =============================================================== */
  useEffect(() => () => {
    if (rafTeleportRef.current !== null) cancelAnimationFrame(rafTeleportRef.current);
    if (rafFollowRef.current   !== null) cancelAnimationFrame(rafFollowRef.current);
    if (rafKeyboardRef.current !== null) cancelAnimationFrame(rafKeyboardRef.current);
    // 🔧 CORREÇÃO: Limpar timeout pendente
    if (cameraMoveTimeoutRef.current !== null) clearTimeout(cameraMoveTimeoutRef.current);
  }, []);

  /* =============================================================== */
  /*  Return                                                          */
  /* =============================================================== */
  return {
    /* Estado */
    getCurrentPosition: () => camera.getPosition(),
    getCurrentZoom: () => camera.getZoom(),
    isAnimating,
    isFollowing,

    /* Controles básicos */
    centerCamera,
    resetZoom,

    /* Teleporte */
    teleportTo,

    /* Bookmarks */
    bookmarks,
    addBookmark,
    removeBookmark,
    goToBookmark,

    /* Auto-seguimento */
    startFollowing,
    stopFollowing,
  };
}
