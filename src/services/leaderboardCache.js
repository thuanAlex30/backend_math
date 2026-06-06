/**
 * In-memory TTL cache cho English Leaderboard
 * Cache 5 phút, tránh query MongoDB mỗi request
 */
import { getEnglishLeaderboard as fetchFromDb } from './englishLeaderboard.js';

const LEADERBOARD_TTL_MS = 5 * 60 * 1000; // 5 phút

let cachedLeaderboard = null;
let cacheTimestamp = 0;

export async function getEnglishLeaderboard(limit = 50) {
  const now = Date.now();
  if (cachedLeaderboard && now - cacheTimestamp < LEADERBOARD_TTL_MS) {
    return cachedLeaderboard.slice(0, limit);
  }

  try {
    cachedLeaderboard = await fetchFromDb(200); // fetch extra for future limits
    cacheTimestamp = now;
  } catch (err) {
    console.error('[leaderboard cache] fetch error:', err.message);
    if (cachedLeaderboard) return cachedLeaderboard.slice(0, limit);
    throw err;
  }

  return cachedLeaderboard.slice(0, limit);
}

export function invalidateLeaderboardCache() {
  cachedLeaderboard = null;
  cacheTimestamp = 0;
}
