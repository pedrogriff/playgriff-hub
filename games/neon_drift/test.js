const { checkCollision } = require('./collision.js');
const { getLeaderboard, saveScore, clearLeaderboard } = require('./leaderboard.js');

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log('Running tests...');

  // --- Collision Tests ---
  console.log('\n--- Collision Detection ---');
  
  const player = { x: 100, y: 100, width: 50, height: 50 };
  const obstacle1 = { x: 120, y: 120, width: 30, height: 30 }; // Colliding
  const obstacle2 = { x: 200, y: 200, width: 30, height: 30 }; // Not colliding
  const obstacleOverlap = { x: 149, y: 100, width: 30, height: 30 }; // Overlapping by 1px
  const obstacleTouch = { x: 150, y: 100, width: 30, height: 30 }; // Just touching

  assert(checkCollision(player, obstacle1) === true, 'Should detect overlap collision');
  assert(checkCollision(player, obstacle2) === false, 'Should not detect collision when separated');
  assert(checkCollision(player, obstacleOverlap) === true, 'Should detect collision on edge overlap');
  assert(checkCollision(player, obstacleTouch) === false, 'Should not detect collision on just touching');

  // --- Leaderboard Tests ---
  console.log('\n--- Leaderboard Persistence ---');
  
  clearLeaderboard();
  assert(getLeaderboard().length === 0, 'Leaderboard should start empty');

  saveScore('AAA', 100);
  saveScore('BBB', 250);
  saveScore('CCC', 50);

  let current = getLeaderboard();
  assert(current.length === 3, 'Should save 3 scores');
  assert(current[0].name === 'BBB' && current[0].score === 250, 'Highest score should be first');
  assert(current[2].name === 'CCC' && current[2].score === 50, 'Lowest score should be last');

  // Add more to test truncation to top 5
  saveScore('DDD', 300);
  saveScore('EEE', 150);
  saveScore('FFF', 200); // 6th score added

  current = getLeaderboard();
  assert(current.length === 5, 'Leaderboard should be truncated to top 5');
  assert(current[0].name === 'DDD' && current[0].score === 300, 'New highest score (300) should be first');
  assert(current[4].name === 'AAA' && current[4].score === 100, 'Score 50 (CCC) should be dropped, AAA (100) should be 5th');

  // --- Corrupted Leaderboard Test ---
  console.log('\n--- Corrupted Leaderboard Safety ---');
  
  clearLeaderboard(); // Clear memoryStorage before mocking window
  
  // Mock window and localStorage with corrupted non-array string
  global.window = {
    localStorage: {
      getItem: () => "this is not valid JSON",
      setItem: () => {},
      removeItem: () => {}
    }
  };

  try {
    const corruptedList = getLeaderboard();
    assert(Array.isArray(corruptedList), 'Should handle invalid JSON and return an array');
    assert(corruptedList.length === 0, 'Corrupted leaderboard should fall back to empty array');
    
    // Attempt save on corrupted
    const saved = saveScore('ERR', 999);
    assert(Array.isArray(saved), 'Should successfully save even if previous storage was corrupted');
    assert(saved[0].name === 'ERR' && saved[0].score === 999, 'Saved score should be correct');
  } catch (e) {
    assert(false, `Should not crash on corrupted storage: ${e.message}`);
  }

  // Mock window with JSON that is NOT an array
  global.window.localStorage.getItem = () => JSON.stringify({ name: "SingleEntry", score: 10 });
  try {
    const corruptedObj = getLeaderboard();
    assert(Array.isArray(corruptedObj), 'Should handle JSON objects (non-arrays) and return an array');
    assert(corruptedObj.length === 0, 'Non-array JSON should fall back to empty array');
  } catch (e) {
    assert(false, `Should not crash on non-array object storage: ${e.message}`);
  }

  // Clean up mock
  delete global.window;

  console.log(`\nTests finished. Failures: ${failures}`);
  process.exit(failures > 0 ? 1 : 0);
}

runTests();
