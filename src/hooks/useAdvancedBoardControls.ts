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

export interface AdvancedBoardControlsOptions {
  enableKeyboardControls?: boolean;
  enableSmoothAnimations?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useAdvancedBoardControls(
  camera: Camera,
  {
    enableKeyboardControls = true,
    enableSmoothAnimations = true,
    containerRef,
  }: AdvancedBoardControlsOptions = {},
) {
  /* ======================   STATE React   ======================= */
  const [bookmarks,  setBookmarks]  = useState<BookmarkData[]>([]);
  const [isAnimating, setAnimating] = useState(false);
  const [followTarget, setFollow]   = useState<Point2D | null>(null);

  /* ======================   REFS mutáveis  ====================== */
  const keysRef          = useRef<Set<string>>(new Set());
  const rafKeyboardRef   = useRef<number | null>(null);
  const rafTeleportRef   = useRef<number | null>(null);
  const rafFollowRef     = useRef<number | null>(null);

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
      if (!enableSmoothAnimations) {
        camera.pan(dest.x - camera.getPosition().x,
                   dest.y - camera.getPosition().y);
        if (destZoom !== undefined) {
          camera.zoomBy((destZoom - camera.getZoom()) * 100);
        }
        return;
      }

      /* 2) animado ------------------------------------------------- */
      const start     = camera.getPosition();
      const startZoom = camera.getZoom();
      const endZoom   = destZoom ?? startZoom;
      const t0        = performance.now();

      setAnimating(true);

      const step = (now: number) => {
        const p    = Math.min((now - t0) / TELEPORT_ANIMATION_MS, 1);
        const ease = 1 - Math.pow(1 - p, 3);

        const x = start.x + (dest.x - start.x) * ease;
        const y = start.y + (dest.y - start.y) * ease;
        const z = startZoom + (endZoom - startZoom) * ease;

        camera.pan(x - camera.getPosition().x,
                   y - camera.getPosition().y);
        camera.zoomBy((z - camera.getZoom()) * 100);

        if (p < 1) {
          rafTeleportRef.current = requestAnimationFrame(step);
        } else {
          setAnimating(false);
          rafTeleportRef.current = null;
        }
      };

      if (rafTeleportRef.current !== null) {
        cancelAnimationFrame(rafTeleportRef.current);
      }
      rafTeleportRef.current = requestAnimationFrame(step);
    },
    [camera, enableSmoothAnimations],
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
    (name: string, pos?: Point2D, zoom?: number) => {
      const b: BookmarkData = {
        id: `bm_${Date.now()}`,
        name: name || 'bookmark',
        position: pos  ?? camera.getPosition(),
        zoom:     zoom ?? camera.getZoom(),
        timestamp: Date.now(),
      };
      setBookmarks(prev => [...prev, b]);
      return b.id;
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
  }, [followTarget, camera]);

  /* =============================================================== */
  /*  Teclado: captura + loop                                         */
  /* =============================================================== */
  useEffect(() => {
    if (!enableKeyboardControls) return;

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

    const tgt: Document | HTMLElement = containerRef?.current ?? document;
    tgt.addEventListener('keydown', onKeyDown as EventListener);
    tgt.addEventListener('keyup', onKeyUp as EventListener);

    /* Focus no container (se existir) */
    if (containerRef?.current) {
      const el = containerRef.current;
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
        if (dz)       camera.zoomBy(dz * 100);
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
  }, [enableKeyboardControls, containerRef, centerCamera, resetZoom, camera]);

  /* =============================================================== */
  /*  Limpeza global (unmount)                                        */
  /* =============================================================== */
  useEffect(() => () => {
    if (rafTeleportRef.current !== null) cancelAnimationFrame(rafTeleportRef.current);
    if (rafFollowRef.current   !== null) cancelAnimationFrame(rafFollowRef.current);
    if (rafKeyboardRef.current !== null) cancelAnimationFrame(rafKeyboardRef.current);
  }, []);

  /* =============================================================== */
  /*  API exposto                                                     */
  /* =============================================================== */
  return {
    /* navegação básica */
    teleportTo,
    centerCamera,
    resetZoom,

    /* follow */
    startFollowing,
    stopFollowing,
    isFollowing : followTarget !== null,
    followTarget,

    /* bookmarks */
    bookmarks,
    addBookmark,
    removeBookmark,
    goToBookmark,

    /* estado */
    isAnimating,
    getCurrentPosition: () => camera.getPosition(),
    getCurrentZoom   : () => camera.getZoom(),
  };
}
