/* ───────────────────────────────────────────────
   playgriff.io — game.js
   Game runner shell logic:
     • Page entrance / exit transitions
     • URL param → game catalog lookup
     • iframe load / error / timeout handling
     • Nav bar collapse / expand + auto-hide
     • Top-edge reveal zone
     • Fullscreen API (with vendor prefix fallbacks)
     • Double-tap zoom prevention on UI chrome
   ─────────────────────────────────────────────── */

'use strict';

/* ══════════════════════════════════════════════
   GAME CATALOG
   Map URL ?id= values to game metadata.
   Add new entries here as you build more games.
   src is relative to the playgriff/ root.
   ══════════════════════════════════════════════ */
const GAMES = {
  'neon-drift': {
    title:       'Neon Drift',
    src:         'games/neon-drift/index.html',
    themeColor:  '#7c3aed',
  },
  'ember-keep': {
    title:       'Ember Keep',
    src:         'games/ember-keep/index.html',
    themeColor:  '#f59e0b',
  },
  'voidshift': {
    title:       'VoidShift',
    src:         'games/voidshift/index.html',
    themeColor:  '#06b6d4',
  },
};

/* ══════════════════════════════════════════════
   DOM REFERENCES
   ══════════════════════════════════════════════ */
const curtain       = document.getElementById('page-curtain');
const gnav          = document.getElementById('gnav');
const gnavBack      = document.getElementById('gnav-back');
const gnavTitle     = document.getElementById('gnav-title');
const gnavHandle    = document.getElementById('gnav-handle');
const gnavFullscr   = document.getElementById('gnav-fullscreen');
const gameStage     = document.getElementById('game-stage');
const gameFrame     = document.getElementById('game-frame');
const gameLoading   = document.getElementById('game-loading');
const loadingTitle  = document.getElementById('loading-title');
const loadingBar    = document.getElementById('loading-bar');
const gameError     = document.getElementById('game-error');
const errorMsg      = document.getElementById('error-msg');
const fsPath        = document.getElementById('fs-path');

/* ══════════════════════════════════════════════
   PAGE ENTRANCE ANIMATION
   The curtain starts at opacity:1 (see game.css).
   We lift it on the next frame so the CSS
   transition actually plays. This creates the
   "fade in from hub" effect.
   ══════════════════════════════════════════════ */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    curtain.classList.add('lifted');
  });
});

/* ══════════════════════════════════════════════
   PARSE URL & LOAD GAME
   ══════════════════════════════════════════════ */
const params = new URLSearchParams(window.location.search);
const gameId = params.get('id') || '';
const game   = GAMES[gameId];

if (!game) {
  // Unknown game ID — show error immediately
  showError(`Unknown game: "${gameId}". Check the URL.`);
} else {
  /* Update visible title in nav and loading screen */
  gnavTitle.textContent    = game.title;
  loadingTitle.textContent = game.title;
  document.title           = `Playing ${game.title} — playgriff.io`;

  /* Tint the browser chrome to match the game's accent */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', game.themeColor);

  /* ── Wire iframe ── */
  const TIMEOUT_MS = 15_000;  // 15 s before we give up waiting

  const loadTimer = setTimeout(() => {
    showError('The game is taking too long to load. Try again later.');
  }, TIMEOUT_MS);

  gameFrame.addEventListener('load', () => {
    clearTimeout(loadTimer);

    /*
      Brief delay gives the game's own JS time to initialise
      before we reveal the canvas (avoids flash of blank screen).
    */
    setTimeout(revealGame, 500);
  }, { once: true });

  gameFrame.addEventListener('error', () => {
    clearTimeout(loadTimer);
    showError('The game failed to load. Make sure the file exists.');
  }, { once: true });

  /* Setting src triggers the browser to load the game */
  gameFrame.src = game.src;
}

/* ══════════════════════════════════════════════
   STATE HELPERS
   ══════════════════════════════════════════════ */
function revealGame() {
  gameLoading.classList.add('done');
  gameFrame.classList.add('loaded');
  scheduleNavAutoHide();    // start the hide timer once game is visible
}

function showError(message) {
  gameLoading.style.display = 'none';
  errorMsg.textContent      = message;
  gameError.hidden          = false;
}

/* ══════════════════════════════════════════════
   EXIT ANIMATION → NAVIGATE BACK
   Drops the curtain, then changes location.
   This gives a smooth "sink into black" feel
   matching the entrance lift.
   ══════════════════════════════════════════════ */
function exitToHub(destination = 'index.html') {
  curtain.classList.remove('lifted');
  curtain.classList.add('dropping');
  // Navigate after the drop transition finishes (~320ms in game.css)
  setTimeout(() => {
    window.location.href = destination;
  }, 350);
}

gnavBack.addEventListener('click', e => {
  e.preventDefault();
  exitToHub('index.html');
});

/* Handle browser back button (swipe-back on iOS / Android) */
window.addEventListener('popstate', () => exitToHub('index.html'));

/* ══════════════════════════════════════════════
   NAV BAR COLLAPSE / EXPAND
   ══════════════════════════════════════════════ */
let navVisible = true;
let autoHideTimer = null;

/* Create the invisible top-edge reveal zone in JS so it only exists
   when actually needed (nav is hidden). */
const revealZone = document.createElement('div');
revealZone.className = 'gnav-reveal-zone';
revealZone.setAttribute('aria-label', 'Tap to show navigation');
revealZone.setAttribute('role', 'button');
revealZone.setAttribute('tabindex', '0');
document.body.appendChild(revealZone);

function showNav() {
  gnav.classList.remove('hidden');
  gnav.setAttribute('aria-hidden', 'false');
  gnavHandle.setAttribute('aria-label', 'Hide navigation bar');
  gnavHandle.setAttribute('aria-expanded', 'true');
  revealZone.style.display = 'none';
  navVisible = true;
  scheduleNavAutoHide();
}

function hideNav() {
  clearTimeout(autoHideTimer);
  gnav.classList.add('hidden');
  gnav.setAttribute('aria-hidden', 'true');
  gnavHandle.setAttribute('aria-label', 'Show navigation bar');
  gnavHandle.setAttribute('aria-expanded', 'false');
  revealZone.style.display = 'block';
  navVisible = false;
}

function scheduleNavAutoHide() {
  clearTimeout(autoHideTimer);
  // Auto-hide after 5 s of inactivity so the nav doesn't obscure gameplay
  autoHideTimer = setTimeout(hideNav, 5000);
}

/* Toggle on handle tap / keyboard */
function toggleNav() {
  navVisible ? hideNav() : showNav();
}

gnavHandle.addEventListener('click', toggleNav);
gnavHandle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNav(); }
});

/* Reveal zone (top-edge) brings nav back */
revealZone.addEventListener('click', showNav);
revealZone.addEventListener('touchstart', showNav, { passive: true });
revealZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showNav(); }
});

/*
  Any touch on the stage resets the auto-hide timer so the nav
  doesn't vanish mid-swipe if the player touches near the top.
*/
gameStage.addEventListener('touchstart', () => {
  if (navVisible) scheduleNavAutoHide();
}, { passive: true });

/* ══════════════════════════════════════════════
   FULLSCREEN API
   (vendor-prefixed for Safari / older Android)
   ══════════════════════════════════════════════ */

/* SVG path data for enter vs. exit fullscreen icons */
const FS_ENTER = 'M2 6V2H6M12 2H16V6M16 12V16H12M6 16H2V12';
const FS_EXIT  = 'M6 2V6H2M16 6V2H12M12 16V16H16M2 12V16H6';

let isFullscreen = false;

function requestFullscreen() {
  const el  = document.documentElement;
  const req = el.requestFullscreen
            || el.webkitRequestFullscreen
            || el.mozRequestFullScreen
            || el.msRequestFullscreen;
  if (req) req.call(el).catch(() => {});
}

function cancelFullscreen() {
  const ex = document.exitFullscreen
           || document.webkitExitFullscreen
           || document.mozCancelFullScreen
           || document.msExitFullscreen;
  if (ex) ex.call(document).catch(() => {});
}

function updateFullscreenIcon() {
  isFullscreen = !!(
    document.fullscreenElement      ||
    document.webkitFullscreenElement
  );
  if (fsPath) {
    fsPath.setAttribute('d', isFullscreen ? FS_EXIT : FS_ENTER);
  }
  gnavFullscr.setAttribute(
    'aria-label',
    isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
  );
}

gnavFullscr.addEventListener('click', () => {
  isFullscreen ? cancelFullscreen() : requestFullscreen();
});

document.addEventListener('fullscreenchange',       updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);

/* ══════════════════════════════════════════════
   DOUBLE-TAP ZOOM PREVENTION
   Prevents accidental zoom on the nav bar and
   overlay elements without disabling zoom inside
   the game iframe (which manages its own events).
   ══════════════════════════════════════════════ */
let lastTouchEndTime = 0;

document.addEventListener('touchend', e => {
  const now = Date.now();
  const dt  = now - lastTouchEndTime;

  if (dt < 300 && dt > 0) {
    // Only suppress on UI chrome — never on the iframe itself
    const onUIChrome = e.target.closest(
      '.gnav, .game-loading, .game-error, .gnav__handle, .gnav-reveal-zone'
    );
    if (onUIChrome) {
      e.preventDefault();
    }
  }

  lastTouchEndTime = now;
}, { passive: false });

/*
  Block touchmove on the outer body so the browser never scrolls
  the shell document. The iframe handles its own scrolling internally.
*/
document.addEventListener('touchmove', e => {
  // Only block if the event originates outside the iframe
  if (e.target !== gameFrame) {
    e.preventDefault();
  }
}, { passive: false });
