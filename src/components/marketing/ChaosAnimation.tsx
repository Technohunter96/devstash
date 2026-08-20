"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Brand/literal logos — not generic UI icons, so lucide-react has no equivalents. Ported from prototypes/homepage/index.html
const CHAOS_ICONS: { id: string; svg: ReactNode }[] = [
  {
    id: "notion",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 8h1l6 8V8h1" />
      </svg>
    ),
  },
  {
    id: "github",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.22-3.37-1.22-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
      </svg>
    ),
  },
  {
    id: "slack",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="4" height="8" rx="2" />
        <rect x="9" y="14" width="4" height="8" rx="2" />
        <rect x="2" y="9" width="8" height="4" rx="2" />
        <rect x="14" y="9" width="8" height="4" rx="2" />
      </svg>
    ),
  },
  {
    id: "vscode",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "tabs",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="15" rx="2" />
        <path d="M2 6l3-3h5l3 3" />
      </svg>
    ),
  },
  {
    id: "terminal",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    id: "file",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: "bookmark",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "figma",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2h6a4 4 0 0 1 0 8H9z" />
        <path d="M9 10h5a4 4 0 0 1 0 8 4 4 0 0 1-4-4v-4Z" />
        <path d="M9 18a4 4 0 1 1-4-4h4Z" />
        <path d="M9 2a4 4 0 1 0 0 8Z" />
      </svg>
    ),
  },
  {
    id: "docker",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="10" rx="2" />
        <path d="M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        <line x1="7" y1="14" x2="17" y2="14" />
      </svg>
    ),
  },
  {
    id: "trello",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <rect x="6" y="7" width="5" height="8" rx="1" />
        <rect x="13" y="7" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: "mail",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 6 10-6" />
      </svg>
    ),
  },
];

const DESKTOP_ICON_SIZE = 76;
const REPEL_RADIUS = 100;
const REPEL_STRENGTH = 450;
const MAX_SPEED = 0.5;
const COLS = 4;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Ports the drift/bounce/repel physics from prototypes/homepage/script.js into a React-owned rAF loop
export function ChaosAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Icon size is responsive (smaller on mobile via Tailwind breakpoints) — measure the actual
    // rendered size instead of assuming the desktop constant, so the physics match reality
    const iconSize = iconRefs.current[0]?.getBoundingClientRect().width || DESKTOP_ICON_SIZE;

    let bounds = container.getBoundingClientRect();
    const resizeBounds = () => {
      bounds = container.getBoundingClientRect();
    };
    window.addEventListener("resize", resizeBounds);

    const rows = Math.ceil(CHAOS_ICONS.length / COLS);
    const particles: Particle[] = CHAOS_ICONS.map((_, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return {
        x: (col + 0.5) * (bounds.width / COLS) - iconSize / 2,
        y: (row + 0.5) * (bounds.height / rows) - iconSize / 2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      };
    });

    let mouseX = -9999;
    let mouseY = -9999;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;

      particles.forEach((p, i) => {
        const cx = p.x + iconSize / 2;
        const cy = p.y + iconSize / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.hypot(dx, dy);

        if (dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          const nx = dist === 0 ? 1 : dx / dist;
          const ny = dist === 0 ? 0 : dy / dist;
          p.vx += (nx * force * dt) / 100000;
          p.vy += (ny * force * dt) / 100000;
        }

        // tiny random jitter keeps icons wandering instead of settling still
        p.vx += (Math.random() - 0.5) * 0.008;
        p.vy += (Math.random() - 0.5) * 0.008;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // drag pulls repulsion bursts back down to the ambient drift speed
        p.vx *= 0.99;
        p.vy *= 0.99;

        // cap speed so a cursor pass doesn't fling icons across the panel
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        const maxX = bounds.width - iconSize;
        const maxY = bounds.height - iconSize;

        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x > maxX) {
          p.x = maxX;
          p.vx = -Math.abs(p.vx);
        }

        if (p.y < 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y > maxY) {
          p.y = maxY;
          p.vy = -Math.abs(p.vy);
        }

        const el = iconRefs.current[i];
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeBounds);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[340px] overflow-hidden rounded-xl border border-border bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.07),_transparent_60%)] max-sm:h-[220px]"
    >
      {CHAOS_ICONS.map((icon, i) => (
        <div
          key={icon.id}
          ref={(el) => {
            iconRefs.current[i] = el;
          }}
          className="absolute top-0 left-0 size-12 will-change-transform sm:size-[76px]"
        >
          <div
            className="flex size-full animate-[icon-pulse_3.5s_ease-in-out_infinite] items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg [&_svg]:size-8"
            style={{ animationDelay: `${-0.4 * i}s` }}
          >
            {icon.svg}
          </div>
        </div>
      ))}
    </div>
  );
}