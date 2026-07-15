// engine.js - Pure game logic (shared between browser and validator)

export function cloneBlocks(blocks) {
    return blocks.map(b => ({ ...b }));
}

export function isOccupied(blocks, x, y, excludeBlockId = null) {
    return blocks.some(b => b.id !== excludeBlockId && b.x === x && b.y === y);
}

export function getBlockAt(blocks, gridX, gridY) {
    return blocks.find(b => b.x === gridX && b.y === gridY);
}

// Calculates the result of sliding a block.
// Returns the final {x, y} and whether it moved.
export function calculateSlide(block, dirX, dirY, gameState) {
    if (dirX === 0 && dirY === 0) return { x: block.x, y: block.y, moved: false };

    let currentX = block.x;
    let currentY = block.y;
    let moved = false;
    const visited = new Set();
    visited.add(`${currentX},${currentY}`);

    while (true) {
        let nextX = currentX + dirX;
        let nextY = currentY + dirY;

        // Check bounds
        if (nextX < 0 || nextX >= gameState.width || nextY < 0 || nextY >= gameState.height) {
            break;
        }

        // Check collision with other blocks
        if (isOccupied(gameState.blocks, nextX, nextY, block.id)) {
            break;
        }

        // Check Portal
        const portalKey = `${nextX},${nextY}`;
        if (gameState.portalMap.has(portalKey)) {
            const dest = gameState.portalMap.get(portalKey);
            
            // Check if destination is occupied
            if (isOccupied(gameState.blocks, dest.x, dest.y, block.id)) {
                // Portal exit is blocked, treat portal entry as blocked
                break;
            }

            // Check loop
            const destKey = `${dest.x},${dest.y}`;
            if (visited.has(destKey)) {
                break;
            }

            // Teleport
            currentX = dest.x;
            currentY = dest.y;
            visited.add(destKey);
            moved = true;
            continue; // Continue slide from destination
        }

        // Normal move
        const nextKey = `${nextX},${nextY}`;
        if (visited.has(nextKey)) {
            break;
        }
        currentX = nextX;
        currentY = nextY;
        visited.add(nextKey);
        moved = true;
    }

    return { x: currentX, y: currentY, moved };
}
