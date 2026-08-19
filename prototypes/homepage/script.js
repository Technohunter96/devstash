// ---------- Footer year ----------
document.getElementById("currentYear").textContent = new Date().getFullYear();

// ---------- Navbar opacity on scroll ----------
const navbar = document.getElementById("navbar");
const onScroll = () => {
  navbar.classList.toggle("scrolled", window.scrollY > 24);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ---------- Mobile nav toggle ----------
const mobileToggle = document.getElementById("mobileToggle");
const mobileMenu = document.getElementById("mobileMenu");
mobileToggle.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
});
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileMenu.classList.remove("open"));
});

// ---------- Scroll fade-in ----------
const fadeEls = document.querySelectorAll(".fade-in");
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
fadeEls.forEach((el) => fadeObserver.observe(el));

// ---------- Pricing monthly/yearly toggle ----------
const pricingToggle = document.getElementById("pricingToggle");
const toggleLabels = document.querySelectorAll(".toggle-label");
const priceAmount = document.querySelector(".price-amount[data-monthly]");
const pricePeriod = document.querySelector(".price-period[data-monthly]");

const setPricingPeriod = (yearly) => {
  pricingToggle.setAttribute("aria-checked", String(yearly));
  toggleLabels.forEach((label) => {
    const isActive = label.dataset.period === (yearly ? "yearly" : "monthly");
    label.classList.toggle("active", isActive);
  });
  priceAmount.textContent = yearly ? priceAmount.dataset.yearly : priceAmount.dataset.monthly;
  pricePeriod.textContent = yearly ? pricePeriod.dataset.yearly : pricePeriod.dataset.monthly;
};

setPricingPeriod(false);
pricingToggle.addEventListener("click", () => {
  const yearly = pricingToggle.getAttribute("aria-checked") !== "true";
  setPricingPeriod(yearly);
});

// ---------- Chaos icons: drift, bounce, repel from cursor ----------
const chaosContainer = document.getElementById("chaosContainer");

if (chaosContainer) {
  const icons = Array.from(chaosContainer.querySelectorAll(".chaos-icon"));
  const ICON_SIZE = 76;
  const REPEL_RADIUS = 100;
  const REPEL_STRENGTH = 450;
  const MAX_SPEED = 0.5;

  let bounds = chaosContainer.getBoundingClientRect();
  const resizeBounds = () => {
    bounds = chaosContainer.getBoundingClientRect();
  };
  window.addEventListener("resize", resizeBounds);

  const cols = 4;
  const rows = Math.ceil(icons.length / cols);
  const particles = icons.map((el, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      el,
      x: (col + 0.5) * (bounds.width / cols) - ICON_SIZE / 2,
      y: (row + 0.5) * (bounds.height / rows) - ICON_SIZE / 2,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    };
  });

  let mouseX = -9999;
  let mouseY = -9999;

  chaosContainer.addEventListener("mousemove", (e) => {
    const rect = chaosContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  chaosContainer.addEventListener("mouseleave", () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  let lastTime = performance.now();

  const tick = (now) => {
    const dt = Math.min(now - lastTime, 32); // clamp to avoid big jumps on tab switch
    lastTime = now;

    particles.forEach((p) => {
      const cx = p.x + ICON_SIZE / 2;
      const cy = p.y + ICON_SIZE / 2;
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

      const maxX = bounds.width - ICON_SIZE;
      const maxY = bounds.height - ICON_SIZE;

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

      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}