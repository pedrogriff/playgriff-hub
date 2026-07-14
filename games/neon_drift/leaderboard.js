const LEADERBOARD_KEY = 'neon_drift_leaderboard';

// In-memory fallback for testing in environments without localStorage (like Node.js)
let memoryStorage = {};

function getLeaderboard() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(LEADERBOARD_KEY);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
  }
  const mem = memoryStorage[LEADERBOARD_KEY];
  return Array.isArray(mem) ? mem : [];
}

function saveScore(name, score) {
  const leaderboard = getLeaderboard();
  leaderboard.push({ name, score, date: new Date().toISOString() });
  // Sort descending
  leaderboard.sort((a, b) => b.score - a.score);
  // Keep top 5
  const topScores = leaderboard.slice(0, 5);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topScores));
      return topScores;
    }
  } catch (e) {
    console.warn('Failed to write to localStorage:', e);
  }
  
  memoryStorage[LEADERBOARD_KEY] = topScores;
  return topScores;
}

function clearLeaderboard() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LEADERBOARD_KEY);
      return;
    }
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
  memoryStorage[LEADERBOARD_KEY] = [];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getLeaderboard, saveScore, clearLeaderboard, LEADERBOARD_KEY };
}
