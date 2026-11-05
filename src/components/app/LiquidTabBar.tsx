import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "./icons";

type Tab = { to: string; label: string; icon: LucideIcon };

function indexFor(tabs: readonly Tab[], pathname: string) {
  const exact = tabs.findIndex((t) => t.to === pathname);
  if (exact >= 0) return exact;
  // Sub-pages (e.g. /talebe/...) belong to the first tab.
  const prefix = tabs.findIndex((t) => t.to !== "/" && pathname.startsWith(t.to));
  return prefix >= 0 ? prefix : 0;
}

/**
 * Bottom tab bar. The indicator is positioned with pure CSS percentages
 * (no measuring), so it is visible in the very first server render and
 * moves instantly on tap, before the next page finishes loading.
 *
 * The whole bar is swipeable (Telegram style): press and slide across
 * the bar with a finger or the mouse, the highlight follows the pointer,
 * and releasing navigates to the tab under it. Tapping a tab still works.
 */
export function LiquidTabBar({ tabs }: { tabs: readonly Tab[] }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const routeIndex = indexFor(tabs, pathname);
  const [tapped, setTapped] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // Continuous bubble position (float, in tab units) so it glides like water.
  const [pos, setPos] = useState<number | null>(null);
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    setTapped(null);
    setDragging(false);
    setPos(null);
    setSettling(false);
  }, [routeIndex]);
  const active = tapped ?? routeIndex;
  const shown = pos ?? active;
  const n = tabs.length;
  const barRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);

  const posAt = (clientX: number): number | null => {
    const el = barRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return null;
    const t = ((clientX - r.left) / r.width) * n - 0.5;
    return Math.min(n - 1, Math.max(0, t));
  };

  const endDrag = () => {
    pointerId.current = null;
    setDragging(false);
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-[6px] z-20 mx-auto max-w-md px-2 pb-0 pt-1 sm:px-3">
      <div
        ref={barRef}
        className="pointer-events-auto touch-none select-none rounded-[2rem] border border-border bg-card p-1.5 shadow-md"
        onPointerDown={(e) => {
          if (pointerId.current !== null) return;
          pointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          setSettling(false);
          setTapped(null);
          setPos(posAt(e.clientX));
        }}
        onPointerMove={(e) => {
          if (pointerId.current !== e.pointerId) return;
          setPos(posAt(e.clientX));
        }}
        onPointerUp={(e) => {
          if (pointerId.current !== e.pointerId) return;
          const p = posAt(e.clientX);
          const idx = p == null ? null : Math.round(p);
          endDrag();
          // Let the bubble spring from wherever the finger left it.
          setSettling(true);
          if (idx != null && idx !== active) {
            const tab = tabs[idx];
            if (tab) {
              setTapped(idx);
              navigate({ to: tab.to });
            }
          } else {
            setPos(active);
          }
        }}
        onPointerCancel={() => {
          if (pointerId.current === null) return;
          endDrag();
        }}
      >
        <div
          className="relative grid select-none"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden
            className="glass-bubble absolute inset-y-0 left-0 rounded-[1.6rem]"
            style={{
              width: `${100 / n}%`,
              transform: `translate3d(${shown * 100}%,0,0) scale(${
                dragging ? "1.06, 0.92" : "1, 1"
              })`,
              transition: dragging
                ? "none"
                : settling
                  ? "transform 520ms cubic-bezier(0.22, 1.6, 0.36, 1)"
                  : "transform 380ms cubic-bezier(0.22, 1.45, 0.36, 1)",
              willChange: "transform",
            }}
          />
          {tabs.map(({ to, label, icon: Icon }, i) => {
            const on = i === Math.round(shown);
            return (
              <Link
                key={to}
                to={to}
                draggable={false}
                preload="render"
                aria-current={i === active ? "page" : undefined}
                className={`relative z-10 flex flex-col items-center gap-0.5 rounded-[1.6rem] py-2 text-[11px] transition-[color,transform] duration-200 active:scale-95 ${
                  on ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-transform duration-200 ${
                    on ? "scale-110" : ""
                  }`}
                  strokeWidth={on ? 2.4 : 1.8}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
