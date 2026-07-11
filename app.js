/* ───────────────────────────────────────────────
   playgriff.io — app.js
   Lightweight vanilla JS: background canvas,
   filter bar, footer year
   ─────────────────────────────────────────────── */

/* ── Page entrance: fade in from black on return from game ─── */
(function pageEnter() {
  const curtain = document.getElementById('page-exit-curtain');
  if (!curtain) return;
  // If we're returning from a game, sessionStorage flag is set
  if (sessionStorage.getItem('pg-returning')) {
    sessionStorage.removeItem('pg-returning');
    curtain.classList.add('pg-exit-active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => curtain.classList.remove('pg-exit-active'));
    });
  }
})();

/* ── Footer: auto-year ────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Filter bar ───────────────────────────────── */
const filterBtns = document.querySelectorAll('.filter-btn');
const gameCards  = document.querySelectorAll('.game-card');
const countPill  = document.getElementById('game-count-pill');

function filterGames(category) {
  let visible = 0;
  gameCards.forEach(card => {
    const match = category === 'all' || card.dataset.category === category;
    card.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  if (countPill) {
    countPill.textContent = `${visible} game${visible !== 1 ? 's' : ''}`;
  }
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    filterGames(btn.dataset.filter);
  });
});

/* ── Play button: smooth exit transition ──────── */
/*
  Intercept every "Play Instantly" anchor click.
  1. Prevent default navigation immediately.
  2. Drop the exit curtain (opacity 0 → 1).
  3. After the CSS transition completes, follow the href.
  This creates the black-fade-out that game.html mirrors on entry.
*/
const EXIT_DURATION_MS = 340; // must match .pg-exit-active transition in style.css

document.querySelectorAll('.play-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const href = btn.getAttribute('href');
    // Only intercept real game links (not '#' placeholders)
    if (!href || href === '#') return;
    e.preventDefault();

    const curtain = document.getElementById('page-exit-curtain');
    if (!curtain) {
      window.location.href = href;
      return;
    }

    // Flag that we're navigating away so hub can fade-in on return
    sessionStorage.setItem('pg-returning', '1');

    // Animate the curtain in
    curtain.classList.add('pg-exit-active');

    // Navigate after transition
    setTimeout(() => {
      window.location.href = href;
    }, EXIT_DURATION_MS);
  });
});

/* ── Animated particle background ────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#7c3aed', '#06b6d4', '#a3e635', '#ec4899'];
  const PARTICLE_COUNT = 55;
  let particles = [];
  let W, H, raf;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticle() {
    return {
      x:     random(0, W),
      y:     random(0, H),
      r:     random(1, 2.8),
      vx:    random(-0.25, 0.25),
      vy:    random(-0.35, -0.1),
      alpha: random(0.15, 0.55),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      // move
      p.x += p.vx;
      p.y += p.vy;

      // gentle drift: slight sine wobble on x
      p.x += Math.sin(p.y * 0.012) * 0.2;

      // reset when off-screen
      if (p.y < -6 || p.x < -6 || p.x > W + 6) {
        Object.assign(p, createParticle(), { y: H + 4 });
      }

      // draw glow dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
      grd.addColorStop(0, p.color + 'cc');
      grd.addColorStop(1, p.color + '00');
      ctx.fillStyle = grd;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }

  function start() {
    cancelAnimationFrame(raf);
    resize();
    init();
    draw();
  }

  // Respect reduced motion preference
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mq.matches) {
    start();
    window.addEventListener('resize', () => { resize(); }, { passive: true });
  }
})();
