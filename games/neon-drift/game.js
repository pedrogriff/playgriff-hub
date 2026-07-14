// Neon Drift - Game Logic

// Handle environment-agnostic imports
let checkCollisionFunc = typeof checkCollision !== 'undefined' ? checkCollision : null;
let getLeaderboardFunc = typeof getLeaderboard !== 'undefined' ? getLeaderboard : null;
let saveScoreFunc = typeof saveScore !== 'undefined' ? saveScore : null;

if (typeof require !== 'undefined') {
  try {
    if (!checkCollisionFunc) checkCollisionFunc = require('./collision.js').checkCollision;
    if (!getLeaderboardFunc) getLeaderboardFunc = require('./leaderboard.js').getLeaderboard;
    if (!saveScoreFunc) saveScoreFunc = require('./leaderboard.js').saveScore;
  } catch (e) {
    // Ignore errors in browser
  }
}

class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Game dimensions
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Lanes configuration (3 lanes)
    this.lanesCount = 3;
    this.laneWidth = this.width / this.lanesCount;
    
    // Game speed & progression
    this.baseSpeed = 8;
    this.maxSpeed = 20;
    this.acceleration = 0.001;
    this.boostSpeed = 0;
    this.boostTimer = 0;
    this.boostDuration = 60; // ~1 second at 60fps (60 ticks)
    
    // Player setup
    this.player = {
      lane: 1, // Start in middle lane
      targetX: this.getLaneCenterX(1),
      x: this.getLaneCenterX(1),
      y: this.height - 100,
      width: 40,
      height: 60,
      speed: 8, // Current active speed (base + boost)
      color: '#00ffff', // Cyan
      scoreMultiplier: 1,
      baseScoreRate: 0.1,
    };
    
    // Game state
    this.score = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.obstacles = [];
    this.boosts = [];
    
    // Spawning timers (accumulate delta time)
    this.obstacleSpawnInterval = 90; // target frames
    this.obstacleSpawnTimer = 0;
    this.boostSpawnInterval = 200; // target frames
    this.boostSpawnTimer = 0;
    
    // Animation frame timing
    this.lastTime = 0;
    this.roadOffset = 0;
    
    // Input handling & UI buttons
    this.initInput();
    this.initUI();
  }
  
  getLaneCenterX(lane) {
    return lane * this.laneWidth + this.laneWidth / 2;
  }
  
  initInput() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (this.gameOver) {
        if (e.key === 'r' || e.key === 'R') {
          this.start();
        }
        return;
      }
      if (!this.gameStarted) {
        if (e.key === 'Enter' || e.key === ' ') {
          this.start();
        }
        return;
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.movePlayer(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.movePlayer(1);
      }
    });
    
    // Swipe/Mouse drag controls (handling mouseup on window to prevent lost releases)
    let startX = 0;
    let threshold = 30; // minimum distance for swipe
    let isDragging = false;
    
    this.canvas.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isDragging = true;
    });
    
    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      if (this.gameOver || !this.gameStarted) return;
      let diffX = e.clientX - startX;
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.movePlayer(1);
        } else {
          this.movePlayer(-1);
        }
      }
    });
    
    // Touch controls for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    this.canvas.addEventListener('touchend', (e) => {
      if (this.gameOver || !this.gameStarted) return;
      let diffX = e.changedTouches[0].clientX - startX;
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.movePlayer(1);
        } else {
          this.movePlayer(-1);
        }
      }
    });
  }
  
  initUI() {
    // Bind UI buttons inside the game constructor to keep index.html clean
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.onclick = () => this.start();
    }
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => this.start();
    }
    
    const submitBtn = document.getElementById('submit-score-btn');
    if (submitBtn) {
      submitBtn.onclick = () => {
        const nameInput = document.getElementById('player-name-input');
        const name = nameInput.value.trim().toUpperCase() || 'AAA';
        const score = Math.floor(this.score);
        if (saveScoreFunc) {
          saveScoreFunc(name, score);
        }
        this.showLeaderboardOnly();
        document.getElementById('leaderboard-input-area').style.display = 'none';
      };
    }
  }
  
  movePlayer(dir) {
    let newLane = this.player.lane + dir;
    if (newLane >= 0 && newLane < this.lanesCount) {
      this.player.lane = newLane;
      this.player.targetX = this.getLaneCenterX(newLane);
    }
  }
  
  start() {
    this.gameStarted = true;
    this.gameOver = false;
    this.reset();
    this.animate();
  }
  
  reset() {
    this.player.lane = 1;
    this.player.x = this.getLaneCenterX(1);
    this.player.targetX = this.player.x;
    this.player.scoreMultiplier = 1;
    
    this.baseSpeed = 8;
    this.boostSpeed = 0;
    this.boostTimer = 0;
    this.player.speed = 8;
    
    this.score = 0;
    this.obstacles = [];
    this.boosts = [];
    
    this.obstacleSpawnTimer = 0;
    this.boostSpawnTimer = 0;
    this.lastTime = 0;
    this.roadOffset = 0;
    this.gameOver = false;
    
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
  }
  
  spawnObstacle() {
    let lane = Math.floor(Math.random() * this.lanesCount);
    let size = 30 + Math.random() * 20;
    this.obstacles.push({
      lane: lane,
      x: this.getLaneCenterX(lane) - size / 2,
      y: -size,
      width: size,
      height: size,
      color: '#ff0055', // Neon Pink
    });
  }
  
  spawnBoost() {
    let lane = Math.floor(Math.random() * this.lanesCount);
    let size = 20;
    this.boosts.push({
      lane: lane,
      x: this.getLaneCenterX(lane) - size / 2,
      y: -size,
      width: size,
      height: size,
      color: '#ffff00', // Neon Yellow
    });
  }
  
  update(dt = 1) {
    if (this.gameOver || !this.gameStarted) return;
    
    // Smoothly interpolate player X to target lane X (adjusted for dt, clamped to 1.0)
    let dx = this.player.targetX - this.player.x;
    let lerpFactor = Math.min(0.25 * dt, 1.0);
    this.player.x += dx * lerpFactor;
    
    // Accelerate game base speed
    if (this.baseSpeed < this.maxSpeed) {
      this.baseSpeed += this.acceleration * dt;
    }
    
    // Handle boost timer and speed calculations
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      this.boostSpeed = 4; // Temporary flat speed increase during boost
    } else {
      this.boostSpeed = 0;
      this.boostTimer = 0;
    }
    this.player.speed = this.baseSpeed + this.boostSpeed;
    
    // Update road offset
    this.roadOffset += this.player.speed * dt;
    
    // Update score
    this.score += this.player.baseScoreRate * this.player.scoreMultiplier * (this.player.speed / 8) * dt;
    
    // Spawn timers
    this.obstacleSpawnTimer += dt;
    if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
      this.obstacleSpawnTimer = 0;
      this.spawnObstacle();
    }
    
    this.boostSpawnTimer += dt;
    if (this.boostSpawnTimer >= this.boostSpawnInterval) {
      this.boostSpawnTimer = 0;
      this.spawnBoost();
    }
    
    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.y += this.player.speed * dt;
      
      let playerBounds = {
        x: this.player.x - this.player.width / 2,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };
      
      if (checkCollisionFunc && checkCollisionFunc(playerBounds, obs)) {
        this.triggerGameOver();
        return;
      }
      
      if (obs.y > this.height) {
        this.obstacles.splice(i, 1);
      }
    }
    
    // Update boosts
    for (let i = this.boosts.length - 1; i >= 0; i--) {
      let boost = this.boosts[i];
      boost.y += this.player.speed * dt;
      
      let playerBounds = {
        x: this.player.x - this.player.width / 2,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };
      
      if (checkCollisionFunc && checkCollisionFunc(playerBounds, boost)) {
        this.player.scoreMultiplier += 1;
        this.boostTimer = this.boostDuration; // Trigger/reset boost timer
        this.boosts.splice(i, 1);
        continue;
      }
      
      if (boost.y > this.height) {
        this.boosts.splice(i, 1);
      }
    }
  }
  
  triggerGameOver() {
    this.gameOver = true;
    document.getElementById('final-score').innerText = Math.floor(this.score);
    document.getElementById('game-over-screen').style.display = 'flex';
    
    let currentLeaderboard = [];
    if (getLeaderboardFunc) {
      currentLeaderboard = getLeaderboardFunc();
    }
    
    const isHighScore = currentLeaderboard.length < 5 || Math.floor(this.score) > currentLeaderboard[currentLeaderboard.length - 1].score;
    
    const inputArea = document.getElementById('leaderboard-input-area');
    if (isHighScore) {
      inputArea.style.display = 'block';
    } else {
      inputArea.style.display = 'none';
      this.showLeaderboardOnly();
    }
  }
  
  showLeaderboardOnly() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    let leaderboard = [];
    if (getLeaderboardFunc) {
      leaderboard = getLeaderboardFunc();
    }
    
    leaderboard.forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${entry.name}</span> <span>${entry.score}</span>`;
      list.appendChild(li);
    });
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a16';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw lane divider lines
    this.ctx.strokeStyle = '#1f1f3d';
    this.ctx.lineWidth = 2;
    for (let i = 1; i < this.lanesCount; i++) {
      let x = i * this.laneWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Moving road dashes (speed effect)
    this.ctx.strokeStyle = '#3d3d7a';
    this.ctx.lineWidth = 4;
    let dashLength = 40;
    let gapLength = 30;
    let offset = this.roadOffset % (dashLength + gapLength);
    
    for (let i = 1; i < this.lanesCount; i++) {
      let x = i * this.laneWidth;
      this.ctx.beginPath();
      this.ctx.setLineDash([dashLength, gapLength]);
      this.ctx.lineDashOffset = -offset;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]); // Reset dash state
    
    // Glow effect
    this.ctx.shadowBlur = 15;
    
    // Draw boosts
    this.boosts.forEach(boost => {
      this.ctx.fillStyle = boost.color;
      this.ctx.shadowColor = boost.color;
      
      this.ctx.beginPath();
      this.ctx.moveTo(boost.x + boost.width / 2, boost.y);
      this.ctx.lineTo(boost.x + boost.width, boost.y + boost.height / 2);
      this.ctx.lineTo(boost.x + boost.width / 2, boost.y + boost.height);
      this.ctx.lineTo(boost.x, boost.y + boost.height / 2);
      this.ctx.closePath();
      this.ctx.fill();
    });
    
    // Draw obstacles
    this.obstacles.forEach(obs => {
      this.ctx.fillStyle = obs.color;
      this.ctx.shadowColor = obs.color;
      
      this.ctx.beginPath();
      this.ctx.moveTo(obs.x + obs.width / 2, obs.y);
      this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      this.ctx.lineTo(obs.x, obs.y + obs.height);
      this.ctx.closePath();
      this.ctx.fill();
    });
    
    // Draw player
    this.ctx.fillStyle = this.player.color;
    this.ctx.shadowColor = this.player.color;
    let px = this.player.x - this.player.width / 2;
    let py = this.player.y;
    
    this.ctx.beginPath();
    this.ctx.moveTo(px + this.player.width / 2, py);
    this.ctx.lineTo(px + this.player.width, py + this.player.height);
    this.ctx.lineTo(px + this.player.width / 2, py + this.player.height - 15);
    this.ctx.lineTo(px, py + this.player.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0; // Disable glow for HUD
    
    // Draw HUD
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Orbitron, Courier New, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 20, 30);
    this.ctx.fillText(`MULT: x${this.player.scoreMultiplier}`, 20, 55);
    
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`SPEED: ${Math.floor(this.player.speed * 10)} MPH`, this.width - 20, 30);
  }
  
  animate(timestamp = 0) {
    if (this.gameOver) return;
    
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = (timestamp - this.lastTime) / 16.666; // Normalize dt to ~1.0 at 60fps
    if (dt > 10) dt = 1; // Prevent jumps when switching back tabs
    this.lastTime = timestamp;
    
    this.update(dt);
    this.draw();
    
    requestAnimationFrame((t) => this.animate(t));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game };
}
