"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
};

type View = {
  x: number;
  y: number;
  scale: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  viewX: number;
  viewY: number;
};

type PinchState = {
  distance: number;
  scale: number;
  worldX: number;
  worldY: number;
};

const MIN_SCALE = 0.58;
const MAX_SCALE = 1.6;
const DEFAULT_VIEW: View = { x: 0, y: 0, scale: 1 };

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function blocksBoardPan(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, summary, [data-no-pan]",
      ),
    )
  );
}

function pointerDistance(pointers: Map<number, { x: number; y: number }>) {
  const [first, second] = Array.from(pointers.values());
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function pointerMidpoint(pointers: Map<number, { x: number; y: number }>) {
  const [first, second] = Array.from(pointers.values());
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export default function DreamMemoryBoard({ children }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const movedRef = useRef(false);
  const viewRef = useRef<View>(DEFAULT_VIEW);
  const renderedScaleRef = useRef(DEFAULT_VIEW.scale);
  const paintFrameRef = useRef<number | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [dragging, setDragging] = useState(false);

  const constrainView = useCallback((next: View): View => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return next;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    const contentBounds = content.getBoundingClientRect();
    const renderedScale = renderedScaleRef.current || 1;
    const scaledWidth = (contentBounds.width / renderedScale) * next.scale;
    const scaledHeight = (contentBounds.height / renderedScale) * next.scale;
    const horizontalMargin = 48;
    const topMargin = 32;
    const bottomMargin = 120;

    const x =
      scaledWidth <= viewportWidth
        ? (viewportWidth - scaledWidth) / 2
        : Math.min(
            horizontalMargin,
            Math.max(viewportWidth - scaledWidth - horizontalMargin, next.x),
          );
    const y =
      scaledHeight <= viewportHeight
        ? Math.max(0, (viewportHeight - scaledHeight) / 2)
        : Math.min(
            topMargin,
            Math.max(viewportHeight - scaledHeight - bottomMargin, next.y),
          );

    return { ...next, x, y };
  }, []);

  const applyView = useCallback(
    (next: View, updateZoomLabel = false) => {
      const constrained = constrainView(next);
      viewRef.current = constrained;
      if (paintFrameRef.current === null) {
        paintFrameRef.current = requestAnimationFrame(() => {
          paintFrameRef.current = null;
          const surface = surfaceRef.current;
          const content = contentRef.current;
          const current = viewRef.current;
          if (!surface || !content) return;
          const devicePixelRatio = window.devicePixelRatio || 1;
          const x =
            Math.round(current.x * devicePixelRatio) / devicePixelRatio;
          const y =
            Math.round(current.y * devicePixelRatio) / devicePixelRatio;

          content.style.setProperty("zoom", String(current.scale));
          renderedScaleRef.current = current.scale;
          surface.style.transform = `translate(${x}px, ${y}px)`;
          surface.dataset.viewX = String(x);
          surface.dataset.viewY = String(y);
          surface.dataset.viewScale = String(current.scale);
        });
      }
      if (updateZoomLabel) {
        setZoomPercent(Math.round(constrained.scale * 100));
      }
    },
    [constrainView],
  );

  const zoomByFactorAt = useCallback(
    (factor: number, clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      const focalX = clientX - bounds.left;
      const focalY = clientY - bounds.top;
      const current = viewRef.current;
      const scale = clampScale(current.scale * factor);
      const ratio = scale / current.scale;
      applyView({
        scale,
        x: focalX - (focalX - current.x) * ratio,
        y: focalY - (focalY - current.y) * ratio,
      });
      setZoomPercent(Math.round(scale * 100));
    },
    [applyView],
  );

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      zoomByFactorAt(
        factor,
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2,
      );
    },
    [zoomByFactorAt],
  );

  useEffect(() => {
    function keepBoardInView() {
      applyView(viewRef.current);
    }

    const viewport = viewportRef.current;
    function preventSelectionDuringPan(event: Event) {
      if (pointersRef.current.size > 0) {
        event.preventDefault();
      }
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const intensity = event.deltaMode === 1 ? 0.035 : 0.00125;
      zoomByFactorAt(
        Math.exp(-event.deltaY * intensity),
        event.clientX,
        event.clientY,
      );
    }

    viewport?.addEventListener("wheel", handleWheel, { passive: false });
    viewport?.addEventListener("selectstart", preventSelectionDuringPan);
    window.addEventListener("resize", keepBoardInView);
    return () => {
      viewport?.removeEventListener("wheel", handleWheel);
      viewport?.removeEventListener("selectstart", preventSelectionDuringPan);
      window.removeEventListener("resize", keepBoardInView);
      if (paintFrameRef.current !== null) {
        cancelAnimationFrame(paintFrameRef.current);
      }
    };
  }, [applyView, zoomByFactorAt]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (blocksBoardPan(event.target)) return;

    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    movedRef.current = false;
    setDragging(true);

    if (pointersRef.current.size === 2) {
      const midpoint = pointerMidpoint(pointersRef.current);
      const bounds = event.currentTarget.getBoundingClientRect();
      const current = viewRef.current;
      pinchRef.current = {
        distance: pointerDistance(pointersRef.current),
        scale: current.scale,
        worldX: (midpoint.x - bounds.left - current.x) / current.scale,
        worldY: (midpoint.y - bounds.top - current.y) / current.scale,
      };
      dragRef.current = null;
      return;
    }

    const current = viewRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      viewX: current.x,
      viewY: current.y,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const distance = pointerDistance(pointersRef.current);
      const midpoint = pointerMidpoint(pointersRef.current);
      const bounds = event.currentTarget.getBoundingClientRect();
      const scale = clampScale(
        pinchRef.current.scale * (distance / pinchRef.current.distance),
      );
      movedRef.current = true;
      applyView(
        {
          scale,
          x: midpoint.x - bounds.left - pinchRef.current.worldX * scale,
          y: midpoint.y - bounds.top - pinchRef.current.worldY * scale,
        },
        true,
      );
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.hypot(deltaX, deltaY) > 3) movedRef.current = true;
    applyView({
      ...viewRef.current,
      x: drag.viewX + deltaX,
      y: drag.viewY + deltaY,
    });
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [pointerId, point] = Array.from(pointersRef.current.entries())[0];
      dragRef.current = {
        pointerId,
        startX: point.x,
        startY: point.y,
        viewX: viewRef.current.x,
        viewY: viewRef.current.y,
      };
    } else {
      dragRef.current = null;
      setDragging(false);
      window.setTimeout(() => {
        movedRef.current = false;
      }, 0);
    }
  }

  return (
    <div
      ref={viewportRef}
      data-testid="memory-board-viewport"
      className={`dream-memory-board absolute inset-0 z-10 overflow-hidden ${
        dragging ? "dream-memory-board--dragging" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onDragStart={(event) => event.preventDefault()}
      onClickCapture={(event) => {
        if (blocksBoardPan(event.target)) return;
        if (!movedRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        movedRef.current = false;
      }}
    >
      <div
        ref={surfaceRef}
        data-testid="memory-board-surface"
        data-view-x="0"
        data-view-y="0"
        data-view-scale="1"
        className="dream-memory-board__surface min-h-full w-full"
        style={{ transform: "translate(0, 0)" }}
      >
        <div
          ref={contentRef}
          className="dream-memory-board__content min-h-full w-full"
          style={{ zoom: 1 }}
        >
          {children}
        </div>
      </div>

      <div
        className="dream-memory-board__hint pointer-events-none absolute bottom-5 left-5 z-50 hidden rounded-full border border-white/[0.1] bg-[#060812]/68 px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-white/34 backdrop-blur-xl sm:block"
        aria-hidden="true"
      >
        Scroll to zoom · drag to wander
      </div>

      <div
        className="absolute bottom-5 right-5 z-50 flex items-center gap-1 rounded-full border border-white/[0.12] bg-[#060812]/76 p-1.5 shadow-2xl backdrop-blur-xl"
        data-no-pan
      >
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full text-lg text-white/52 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomFromCenter(0.82)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          data-testid="memory-board-zoom"
          data-zoom-percent={zoomPercent}
          className="min-w-14 rounded-full px-2 py-2 text-[9px] tracking-[0.14em] text-white/38 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => applyView(DEFAULT_VIEW, true)}
          aria-label={`Reset view. Current zoom ${zoomPercent} percent`}
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full text-lg text-white/52 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomFromCenter(1.22)}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}
