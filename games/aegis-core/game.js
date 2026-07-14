/**
 * Aegis Core HTML5 Game Engine
 * 
 * This script runs the hypercasual HTML5 mobile-first game engine.
 * It manages:
 * 1. Global Game State: Exposed via `window.gameState` containing reactive properties
 *    using getters and setters (score, lives, isGameOver, shieldAngle, speedMultiplier).
 * 2. High Score Sync: Continuously checks and syncs high scores, persisted in LocalStorage
 *    under the key 'aegis_high_score'.
 * 3. Responsive Web Controls: Listens to click and touch events on the canvas,
 *    reversing the orbiting shield direction on interaction.
 * 4. Physics and Collision Detection: Uses concentric radial band and circular math to
 *    check projectile-shield intersections (checkCollision) and core collisions (checkCoreCollision).
 * 5. Update Loop and Drawing: Operates on requestAnimationFrame with delta-time calculations,
 *    updating state, moving projectiles, and rendering core/shield/projectiles.
 */
(function() {
  const ROTATION_SPEED = Math.PI; // radians per second
  const SHIELD_RADIUS = 100;
  const SHIELD_THICKNESS = 10;
  const SHIELD_ARC_WIDTH = 1.0;
  const CORE_RADIUS = 40;

  function updateHUD() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.innerText = gameState.score;
    }
    const livesEl = document.getElementById('lives');
    if (livesEl) {
      livesEl.innerText = "♥".repeat(gameState.lives);
    }
  }

  function updateSpeedMultiplier() {
    gameState.speedMultiplier = 1.0 + gameState.score * 0.02 + gameState.timeElapsed * 0.005;
  }

  const gameState = {
    _score: 0,
    get score() {
      return this._score;
    },
    set score(val) {
      this._score = val;
      this.speedMultiplier = 1.0 + val * 0.02 + (this.timeElapsed || 0) * 0.005;
      if (this._score > this.highScore) {
        this.highScore = this._score;
        try {
          localStorage.setItem('aegis_high_score', this.highScore.toString());
        } catch (e) {}
      }
      updateHUD();
    },
    _lives: 3,
    get lives() {
      return this._lives;
    },
    set lives(val) {
      this._lives = val;
      if (this._lives <= 0) {
        this._lives = 0;
        this.isGameOver = true;
      }
      updateHUD();
    },
    _isGameOver: false,
    get isGameOver() {
      return this._isGameOver;
    },
    set isGameOver(val) {
      this._isGameOver = val;
      const overlay = document.getElementById('game-over-overlay');
      if (val) {
        if (overlay) overlay.classList.remove('hidden');
        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) finalScoreEl.innerText = this.score;
        const highScoreEl = document.getElementById('high-score');
        if (highScoreEl) highScoreEl.innerText = this.highScore;
      } else {
        if (overlay) overlay.classList.add('hidden');
      }
    },
    highScore: 0,
    shieldAngle: 0,
    shieldDirection: 1,
    projectiles: [],
    speedMultiplier: 1.0,
    timeElapsed: 0,
    spawnTimer: 0,
    autoSpawn: !window.location.search.includes('test=true')
  };

  // Expose gameState globally
  window.gameState = gameState;

  // LocalStorage score persistence
  let savedHighScore = 0;
  try {
    const rawScore = localStorage.getItem('aegis_high_score');
    if (rawScore !== null) {
      const parsed = parseInt(rawScore, 10);
      if (!isNaN(parsed)) {
        savedHighScore = parsed;
      }
    }
  } catch (e) {
    // Ignore Storage/Security errors
  }
  gameState.highScore = savedHighScore;

  window.checkCollision = function(px, py, pr, shieldAngle, arcWidth, shieldRadius, thickness) {
    if (
      isNaN(px) || isNaN(py) || isNaN(pr) || isNaN(shieldAngle) ||
      isNaN(arcWidth) || isNaN(shieldRadius) || isNaN(thickness)
    ) {
      return false;
    }
    if (arcWidth <= 0 || shieldRadius <= 0 || thickness <= 0 || pr < 0) {
      return false;
    }

    const d = Math.sqrt(px * px + py * py);
    const R = shieldRadius;
    const threshold = pr + thickness / 2;

    // Early exit if radial distance is completely out of bounds
    const radialDist = Math.abs(d - R);
    if (radialDist > threshold) {
      return false;
    }

    const projAngle = Math.atan2(py, px);
    let diff = Math.abs(projAngle - shieldAngle);
    diff = diff % (2 * Math.PI);
    if (diff > Math.PI) {
      diff = 2 * Math.PI - diff;
    }

    const halfArc = arcWidth / 2;
    if (diff <= halfArc) {
      return true; // Inside the arc span, and radialDist <= threshold
    }

    // Distance to the closest rounded cap endpoint
    const thetaDiff = diff - halfArc;
    const distSq = d * d + R * R - 2 * d * R * Math.cos(thetaDiff);
    return distSq <= threshold * threshold;
  };

  window.checkCoreCollision = function(px, py, pr, cx, cy, cr) {
    const dx = px - cx;
    const dy = py - cy;
    return Math.sqrt(dx * dx + dy * dy) <= (pr + cr);
  };

  window.getProjectileSpeed = function() {
    return 150 * gameState.speedMultiplier;
  };

  // Setup DOM interactions
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  window.spawnProjectile = function() {
    if (!canvas) return;
    const theta = Math.random() * 2 * Math.PI;
    const spawnRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2 + 50;
    const x = spawnRadius * Math.cos(theta);
    const y = spawnRadius * Math.sin(theta);

    const typeRand = Math.random();
    const type = typeRand < 0.7 ? 'hazard' : 'gem';

    let color = '#ff007f';
    if (type === 'gem') {
      const gemRand = Math.random();
      color = gemRand < 0.7 ? '#00ff66' : '#00d2ff';
    }

    gameState.projectiles.push({
      x: x,
      y: y,
      radius: 15,
      type: type,
      color: color,
      destroyed: false
    });
  };
  const overlay = document.getElementById('game-over-overlay');
  const restartBtn = document.getElementById('restart-button');
  const finalScoreEl = document.getElementById('final-score');
  const highScoreEl = document.getElementById('high-score');

  // Reverse direction on tap/click
  if (canvas) {
    const reverseDirection = (e) => {
      if (gameState.isGameOver) return;
      gameState.shieldDirection *= -1;
    };
    canvas.addEventListener('click', reverseDirection);
    canvas.addEventListener('touchstart', (e) => {
      reverseDirection(e);
      e.preventDefault();
    }, { passive: false });
  }

  // Restart functionality
  if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
      // Order of updates: hide game over first to update classes properly, then reset properties
      gameState.isGameOver = false;
      gameState.timeElapsed = 0;
      gameState.spawnTimer = 0;
      gameState.projectiles = [];
      gameState.shieldAngle = 0;
      gameState.shieldDirection = 1;
      gameState.speedMultiplier = 1.0;

      let currentHighScore = gameState.highScore;
      try {
        const saved = localStorage.getItem('aegis_high_score');
        if (saved !== null) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) {
            currentHighScore = parsed;
          }
        }
      } catch (e) {
        // Ignore and keep using in-memory high score
      }
      gameState.highScore = currentHighScore;

      gameState.score = 0;
      gameState.lives = 3;
      updateHUD();
    });
  }

  // Initialize HUD
  updateHUD();

  // Game Loop
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
    }
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (!gameState.isGameOver) {
      gameState.timeElapsed += deltaTime;
      updateSpeedMultiplier();

      if (gameState.autoSpawn) {
        gameState.spawnTimer += deltaTime;
        const spawnInterval = Math.max(0.4, 2.0 / gameState.speedMultiplier);
        if (gameState.spawnTimer >= spawnInterval) {
          window.spawnProjectile();
          gameState.spawnTimer = 0;
        }
      }

      // Rotate shield angle by speed * direction * dt
      gameState.shieldAngle += gameState.shieldDirection * ROTATION_SPEED * deltaTime;
      gameState.shieldAngle = (gameState.shieldAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

      // Update and process projectiles
      let pendingScoreIncrease = 0;
      let pendingLivesDecrease = 0;
      const remainingProjectiles = [];
      for (let i = 0; i < gameState.projectiles.length; i++) {
        const p = gameState.projectiles[i];
        if (p.destroyed) continue;

        if (gameState.isGameOver) {
          remainingProjectiles.push(p);
          continue;
        }

        // Move projectile radially inward
        const d = Math.sqrt(p.x * p.x + p.y * p.y);
        const speed = p.speed !== undefined ? p.speed : window.getProjectileSpeed();
        if (d > 0) {
          p.x -= (p.x / d) * speed * deltaTime;
          p.y -= (p.y / d) * speed * deltaTime;
        }

        // Collision with shield
        const collidesShield = window.checkCollision(p.x, p.y, p.radius, gameState.shieldAngle, SHIELD_ARC_WIDTH, SHIELD_RADIUS, SHIELD_THICKNESS);
        if (collidesShield) {
          p.destroyed = true;
          continue;
        }

        // Collision with core
        const collidesCore = window.checkCoreCollision(p.x, p.y, p.radius, 0, 0, CORE_RADIUS);
        if (collidesCore) {
          if (p.type === 'hazard') {
            pendingLivesDecrease++;
          } else if (p.type === 'gem') {
            pendingScoreIncrease++;
          }
          p.destroyed = true;
          continue;
        }

        remainingProjectiles.push(p);
      }
      gameState.projectiles = remainingProjectiles;

      // Apply changes safely at the end of the frame
      if (!gameState.isGameOver) {
        if (pendingLivesDecrease > 0) {
          gameState.lives -= pendingLivesDecrease;
        }
        if (!gameState.isGameOver && pendingScoreIncrease > 0) {
          gameState.score += pendingScoreIncrease;
        }
      }
    }

    // Render screen
    if (ctx && canvas) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw central core
      ctx.beginPath();
      ctx.arc(cx, cy, CORE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffffff';
      ctx.fill();
      ctx.closePath();

      // Draw shield arc
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        SHIELD_RADIUS,
        gameState.shieldAngle - SHIELD_ARC_WIDTH / 2,
        gameState.shieldAngle + SHIELD_ARC_WIDTH / 2
      );
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = SHIELD_THICKNESS;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2fe';
      ctx.stroke();
      ctx.closePath();

      // Draw projectiles
      gameState.projectiles.forEach(p => {
        if (p.destroyed) return;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.radius, 0, 2 * Math.PI);
        ctx.fillStyle = p.color || (p.type === 'hazard' ? '#ff007f' : '#00ff66');
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color || (p.type === 'hazard' ? '#ff007f' : '#00ff66');
        ctx.fill();
        ctx.closePath();
      });

      // Reset shadow effects
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(gameLoop);
  }

  // Start loop
  requestAnimationFrame(gameLoop);
})();
