// Eased rAF scroll — gives a deliberate, consistent animated transition instead of relying on
// browser-default smooth-scroll behavior (which varies in speed/feel across browsers)
export function smoothScrollToId(id: string, duration = 700) {
  const el = document.getElementById(id);
  if (!el) return;

  // Measured live instead of a hardcoded guess, so the target lands flush against the fixed nav's
  // actual height — any mismatch here shows up as a dead strip of page background before the section
  const offset = document.querySelector("nav")?.getBoundingClientRect().height ?? 0;

  const startY = window.scrollY;
  const targetY = el.getBoundingClientRect().top + startY - offset;
  const distance = targetY - startY;
  let startTime: number | null = null;

  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const step = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // `behavior: "instant"` bypasses the page's CSS `scroll-behavior: smooth` (from `scroll-smooth`
    // on <html>) — without it, the browser re-triggers its own smooth animation on every one of these
    // per-frame calls, stacking on top of our easing and causing a stutter before it "catches up"
    window.scrollTo({ top: startY + distance * easeInOutCubic(progress), left: 0, behavior: "instant" });
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}