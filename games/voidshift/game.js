// game.js - UI and Rendering (imports logic from engine.js)

import { cloneBlocks, isOccupied, getBlockAt, calculateSlide } from './engine.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const levelNameEl = document.getElementById('level-name');
const moveCounterEl = document.getElementById('move-counter');
const levelSelectEl = document.getElementById('level-select');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnReset = document.getElementById('btn-reset');

const CELL_SIZE = 60;
const PADDING = 10;

let levels = [];
let currentLevelIndex = 0;
let gameState = {
    width: 0,
    height: 0,
    goal: { x: 0, y: 0 },
    targetBlock: null,
    blocks: [],
    portals: [],
    portalMap: new Map(), // Maps "x,y" to { destX, destY }
    moves: 0,
    undoStack: [],
    redoStack: []
};

let dragStart = null;
let selectedBlock = null;

// Initialize the game
async function init() {
    try {
        const response = await fetch('levels.json');
        levels = await response.json();
        populateLevelSelect();
        loadLevel(0);
        setupEventListeners();
    } catch (error) {
        console.error("Failed to load levels, using fallback level.", error);
        levels = [getFallbackLevel()];
        populateLevelSelect();
        loadLevel(0);
        setupEventListeners();
    }
}

function getFallbackLevel() {
    return {
        "id": 1,
        "name": "Fallback Level",
        "width": 5,
        "height": 5,
        "goal": { "x": 4, "y": 2 },
        "target": { "x": 0, "y": 2 },
        "blocks": [
            { "id": 1, "x": 2, "y": 1, "type": "obstacle" }
        ],
        "portals": []
    };
}

function populateLevelSelect() {
    levelSelectEl.innerHTML = '';
    levels.forEach((level, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${level.id}. ${level.name}`;
        levelSelectEl.appendChild(option);
    });
}

function loadLevel(index) {
    currentLevelIndex = index;
    const levelData = levels[index];
    levelSelectEl.value = index;
    levelNameEl.textContent = levelData.name;

    // Reset game state
    gameState.width = levelData.width;
    gameState.height = levelData.height;
    gameState.goal = { ...levelData.goal };
    gameState.moves = 0;
    gameState.undoStack = [];
    gameState.redoStack = [];
    
    // Set canvas size
    canvas.width = gameState.width * CELL_SIZE + PADDING * 2;
    canvas.height = gameState.height * CELL_SIZE + PADDING * 2;

    // Load blocks
    gameState.blocks = [];
    // Target block is always id 0 in our runtime representation
    gameState.targetBlock = {
        id: 0,
        x: levelData.target.x,
        y: levelData.target.y,
        isTarget: true
    };
    gameState.blocks.push(gameState.targetBlock);

    levelData.blocks.forEach(b => {
        gameState.blocks.push({
            id: b.id,
            x: b.x,
            y: b.y,
            isTarget: false
        });
    });

    // Load portals
    gameState.portals = levelData.portals || [];
    gameState.portalMap.clear();
    gameState.portals.forEach(p => {
        gameState.portalMap.set(`${p.a.x},${p.a.y}`, { x: p.b.x, y: p.b.y });
        gameState.portalMap.set(`${p.b.x},${p.b.y}`, { x: p.a.x, y: p.a.y });
    });

    updateUI();
    render();
}

function updateUI() {
    moveCounterEl.textContent = `Moves: ${gameState.moves}`;
    btnUndo.disabled = gameState.undoStack.length === 0;
    btnRedo.disabled = gameState.redoStack.length === 0;
}

function saveStateToUndo() {
    gameState.undoStack.push({
        blocks: cloneBlocks(gameState.blocks),
        moves: gameState.moves
    });
    gameState.redoStack = []; // Clear redo on new move
    updateUI();
}

function undo() {
    if (gameState.undoStack.length > 0) {
        const prevState = gameState.undoStack.pop();
        gameState.redoStack.push({
            blocks: cloneBlocks(gameState.blocks),
            moves: gameState.moves
        });
        gameState.blocks = prevState.blocks;
        gameState.targetBlock = gameState.blocks.find(b => b.isTarget);
        gameState.moves = prevState.moves;
        updateUI();
        render();
    }
}

function redo() {
    if (gameState.redoStack.length > 0) {
        const nextState = gameState.redoStack.pop();
        gameState.undoStack.push({
            blocks: cloneBlocks(gameState.blocks),
            moves: gameState.moves
        });
        gameState.blocks = nextState.blocks;
        gameState.targetBlock = gameState.blocks.find(b => b.isTarget);
        gameState.moves = nextState.moves;
        updateUI();
        render();
    }
}

function resetLevel() {
    if (gameState.moves > 0) {
        saveStateToUndo();
        loadLevel(currentLevelIndex);
    }
}

// Rendering
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Background
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(PADDING, PADDING, gameState.width * CELL_SIZE, gameState.height * CELL_SIZE);

    // Draw Grid Lines
    ctx.strokeStyle = '#2d2d37';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gameState.width; i++) {
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + gameState.height * CELL_SIZE);
        ctx.stroke();
    }
    for (let j = 0; j <= gameState.height; j++) {
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + j * CELL_SIZE);
        ctx.lineTo(PADDING + gameState.width * CELL_SIZE, PADDING + j * CELL_SIZE);
        ctx.stroke();
    }

    // Draw Portals (Warping Void)
    gameState.portals.forEach(p => {
        drawPortal(p.a.x, p.a.y);
        drawPortal(p.b.x, p.b.y);
    });

    // Draw Goal
    drawGoal(gameState.goal.x, gameState.goal.y);

    // Draw Blocks
    gameState.blocks.forEach(b => {
        drawBlock(b);
    });
}

function drawBlock(block) {
    const x = PADDING + block.x * CELL_SIZE;
    const y = PADDING + block.y * CELL_SIZE;
    const size = CELL_SIZE - 4;
    const offset = 2;

    ctx.save();
    if (block.isTarget) {
        // Gold target block
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        roundRect(ctx, x + offset, y + offset, size, size, 12, true, true);
        
        // Inner detail
        ctx.fillStyle = '#ffb300';
        roundRect(ctx, x + offset + 6, y + offset + 6, size - 12, size - 12, 8, true, false);
    } else {
        // Obstacle block
        ctx.fillStyle = '#4e4e54';
        ctx.strokeStyle = '#3e3e42';
        ctx.lineWidth = 2;
        roundRect(ctx, x + offset, y + offset, size, size, 8, true, true);
        
        // Inner detail
        ctx.fillStyle = '#3e3e42';
        roundRect(ctx, x + offset + 6, y + offset + 6, size - 12, size - 12, 4, true, false);
    }
    ctx.restore();
}

function drawPortal(gridX, gridY) {
    const x = PADDING + gridX * CELL_SIZE + CELL_SIZE / 2;
    const y = PADDING + gridY * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 3;

    ctx.save();
    // Pulsing effect using time (simple animation loop keeps portals pulsing)
    const glow = 5 + Math.sin(Date.now() / 200) * 2;
    
    // Outer glow
    const grad = ctx.createRadialGradient(x, y, 2, x, y, radius + glow/2);
    grad.addColorStop(0, '#7c4dff');
    grad.addColorStop(0.5, '#00e5ff');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + glow/2, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawGoal(gridX, gridY) {
    const x = PADDING + gridX * CELL_SIZE + CELL_SIZE / 2;
    const y = PADDING + gridY * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 4;

    ctx.save();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 3;
    
    // Draw crosshair/target
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00e676';
    ctx.fill();

    // Corner ticks
    ctx.beginPath();
    ctx.moveTo(x - radius - 4, y); ctx.lineTo(x - radius + 2, y);
    ctx.moveTo(x + radius + 4, y); ctx.lineTo(x + radius - 2, y);
    ctx.moveTo(x, y - radius - 4); ctx.lineTo(x, y - radius + 2);
    ctx.moveTo(x, y + radius + 4); ctx.lineTo(x, y + radius - 2);
    ctx.stroke();
    ctx.restore();
}

// Helper for rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

function slideBlock(block, dirX, dirY) {
    const result = calculateSlide(block, dirX, dirY, gameState);
    if (result.moved) {
        saveStateToUndo();
        block.x = result.x;
        block.y = result.y;
        gameState.moves++;
        updateUI();
        render();
        checkWin();
    }
}

function checkWin() {
    if (gameState.targetBlock.x === gameState.goal.x && gameState.targetBlock.y === gameState.goal.y) {
        setTimeout(() => {
            alert(`Level Completed in ${gameState.moves} moves!`);
            if (currentLevelIndex + 1 < levels.length) {
                loadLevel(currentLevelIndex + 1);
            } else {
                alert("Congratulations! You completed all levels!");
            }
        }, 100);
    }
}

// Event Listeners
function setupEventListeners() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    levelSelectEl.addEventListener('change', (e) => {
        loadLevel(parseInt(e.target.value));
    });

    btnUndo.addEventListener('click', undo);
    btnRedo.addEventListener('click', redo);
    btnReset.addEventListener('click', resetLevel);

    window.addEventListener('keydown', onKeyDown);

    // Simple animation loop to keep portals pulsing
    function animate() {
        render();
        requestAnimationFrame(animate);
    }
    // Start animation loop
    requestAnimationFrame(animate);
}

function getGridCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    const gridX = Math.floor((canvasX - PADDING) / CELL_SIZE);
    const gridY = Math.floor((canvasY - PADDING) / CELL_SIZE);
    
    return { x: gridX, y: gridY };
}

function onMouseDown(e) {
    const coords = getGridCoords(e);
    selectedBlock = getBlockAt(gameState.blocks, coords.x, coords.y);
    if (selectedBlock) {
        dragStart = { x: e.clientX, y: e.clientY };
    }
}

function onMouseMove(e) {
    // We don't do real-time dragging, just wait for mouseup to trigger slide
}

function onMouseUp(e) {
    if (selectedBlock && dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        handleSwipe(selectedBlock, dx, dy);
    }
    selectedBlock = null;
    dragStart = null;
}

function onTouchStart(e) {
    e.preventDefault();
    const coords = getGridCoords(e);
    selectedBlock = getBlockAt(gameState.blocks, coords.x, coords.y);
    if (selectedBlock) {
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
}

function onTouchMove(e) {
    e.preventDefault();
}

// Fixed missing parameter and logic in touchEnd
function onTouchEnd(e) {
    if (selectedBlock && dragStart && e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - dragStart.x;
        const dy = e.changedTouches[0].clientY - dragStart.y;
        handleSwipe(selectedBlock, dx, dy);
    }
    selectedBlock = null;
    dragStart = null;
}

function handleSwipe(block, dx, dy) {
    const threshold = 20; // Min drag distance to trigger move
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    let dirX = 0;
    let dirY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal move
        dirX = dx > 0 ? 1 : -1;
    } else {
        // Vertical move
        dirY = dy > 0 ? 1 : -1;
    }

    slideBlock(block, dirX, dirY);
}

function onKeyDown(e) {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
    } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
    } else if (e.key === 'r' || e.key === 'R') {
        resetLevel();
    }
}

// Start the game
init();
