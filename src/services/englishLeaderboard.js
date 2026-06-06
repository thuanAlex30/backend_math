/**
 * englishLeaderboard.js — English Leaderboard Service
 *
 * Storage:
 *   1. EnglishLeaderboardEntry collection (primary) — query nhanh, cache
 *   2. User.englishStats (fallback) — khi collection chưa có data
 *
 * Sync strategy:
 *   - upsertFromUser() gọi khi user sync stats từ frontend
 *   - getLeaderboard() ưu tiên collection, fallback User
 */

import User from '../models/User.js';
import EnglishLeaderboardEntry from '../models/EnglishLeaderboardEntry.js';
import { invalidateLeaderboardCache } from './leaderboardCache.js';

/**
 * Lấy bảng xếp hạng English
 * Ưu tiên: EnglishLeaderboardEntry collection → User collection
 */
export async function getEnglishLeaderboard(limit = 50) {
  try {
    // Ưu tiên collection riêng (nhanh hơn, có rank computed)
    const entries = await EnglishLeaderboardEntry.getTop(limit, 'xp');
    if (entries.length > 0) return entries;
  } catch (err) {
    console.warn('[englishLeaderboard] Entry collection error, falling back to User:', err.message);
  }

  // Fallback: query User collection
  try {
    const users = await User.find({}, {
      name: 1,
      avatar: 1,
      grade: 1,
      englishStats: 1,
    })
      .sort({ 'englishStats.xp': -1 })
      .limit(limit)
      .lean();

    return users.map((u, idx) => ({
      rank: idx + 1,
      name: u.name || 'Học sinh ẩn danh',
      avatar: u.avatar || null,
      grade: u.grade || null,
      xp: u.englishStats?.xp ?? 0,
      streak: u.englishStats?.streak ?? 0,
      wordsLearned: u.englishStats?.wordsLearned ?? 0,
      level: u.englishStats?.level ?? 1,
    }));
  } catch (err) {
    console.error('[englishLeaderboard] User fallback error:', err.message);
    return [];
  }
}

/**
 * Sync stats Tiếng Anh từ frontend (englishStore) lên MongoDB
 * Gọi khi user đăng nhập hoặc kết thúc phiên học
 */
export async function syncEnglishStats(userId, stats) {
  try {
    // Upsert vào EnglishLeaderboardEntry collection
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    await EnglishLeaderboardEntry.upsertFromUser(user, stats);

    // Cũng cập nhật User.englishStats (backward compatible)
    if (!user.englishStats) user.englishStats = {};

    const es = user.englishStats;
    if (stats.xp !== undefined) es.xp = Math.max(es.xp ?? 0, stats.xp);
    if (stats.level !== undefined) es.level = Math.max(es.level ?? 1, stats.level);
    if (stats.streak !== undefined) es.streak = Math.max(es.streak ?? 0, stats.streak);
    if (stats.lastStudyDate) es.lastStudyDate = stats.lastStudyDate;
    if (stats.wordsLearned !== undefined) {
      es.wordsLearned = Math.max(es.wordsLearned ?? 0, stats.wordsLearned);
    }
    if (stats.pronunciationScore !== undefined) {
      es.pronunciationScore = Math.max(es.pronunciationScore ?? 0, stats.pronunciationScore);
    }
    if (stats.listeningScore !== undefined) {
      es.listeningScore = Math.max(es.listeningScore ?? 0, stats.listeningScore);
    }
    if (stats.writingScore !== undefined) {
      es.writingScore = Math.max(es.writingScore ?? 0, stats.writingScore);
    }
    if (stats.totalStudyMinutes !== undefined) {
      es.totalStudyMinutes = (es.totalStudyMinutes ?? 0) + stats.totalStudyMinutes;
    }
    if (Array.isArray(stats.weeklyProgress)) {
      es.weeklyProgress = stats.weeklyProgress;
    }
    if (stats.skillsPracticed) {
      es.skillsPracticed = {
        vocab: Math.max(es.skillsPracticed?.vocab ?? 0, stats.skillsPracticed.vocab ?? 0),
        grammar: Math.max(es.skillsPracticed?.grammar ?? 0, stats.skillsPracticed.grammar ?? 0),
        pronunciation: Math.max(es.skillsPracticed?.pronunciation ?? 0, stats.skillsPracticed.pronunciation ?? 0),
        listening: Math.max(es.skillsPracticed?.listening ?? 0, stats.skillsPracticed.listening ?? 0),
        reading: Math.max(es.skillsPracticed?.reading ?? 0, stats.skillsPracticed.reading ?? 0),
        writing: Math.max(es.skillsPracticed?.writing ?? 0, stats.skillsPracticed.writing ?? 0),
        chat: Math.max(es.skillsPracticed?.chat ?? 0, stats.skillsPracticed.chat ?? 0),
      };
    }
    await user.save();

    // Invalidate cache
    invalidateLeaderboardCache();

    return { ok: true, xp: es.xp, level: es.level };
  } catch (err) {
    console.error('[syncEnglishStats]', err);
    throw err;
  }
}

/**
 * Lấy stats English của 1 user
 */
export async function getEnglishStats(userId) {
  try {
    // Ưu tiên collection riêng
    const entry = await EnglishLeaderboardEntry.findOne({ userId }).lean();
    if (entry) {
      return {
        xp: entry.xp,
        level: entry.level,
        streak: entry.streak,
        lastStudyDate: entry.lastStudyDate,
        wordsLearned: entry.wordsLearned,
        pronunciationScore: entry.pronunciationScore,
        listeningScore: entry.listeningScore,
        readingScore: entry.readingScore,
        grammarScore: entry.grammarScore ?? 0,
        writingScore: entry.writingScore,
        chatScore: entry.chatScore ?? 0,
        totalStudyMinutes: 0,
        weeklyProgress: entry.weeklyProgress,
        skillsPracticed: entry.skillsPracticed ?? {
          vocab: 0, grammar: 0, pronunciation: 0,
          listening: 0, reading: 0, writing: 0, chat: 0,
        },
      };
    }
  } catch (err) {
    console.warn('[getEnglishStats] Entry lookup failed, falling back to User:', err.message);
  }

  // Fallback: User collection
  try {
    const user = await User.findById(userId).select('englishStats name grade').lean();
    if (!user) return null;
    return {
      xp: user.englishStats?.xp ?? 0,
      level: user.englishStats?.level ?? 1,
      streak: user.englishStats?.streak ?? 0,
      lastStudyDate: user.englishStats?.lastStudyDate ?? null,
      wordsLearned: user.englishStats?.wordsLearned ?? 0,
      pronunciationScore: user.englishStats?.pronunciationScore ?? 0,
      listeningScore: user.englishStats?.listeningScore ?? 0,
      readingScore: user.englishStats?.readingScore ?? 0,
      grammarScore: user.englishStats?.grammarScore ?? 0,
      writingScore: user.englishStats?.writingScore ?? 0,
      chatScore: user.englishStats?.chatScore ?? 0,
      totalStudyMinutes: user.englishStats?.totalStudyMinutes ?? 0,
      weeklyProgress: user.englishStats?.weeklyProgress ?? [0, 0, 0, 0, 0, 0, 0],
      skillsPracticed: user.englishStats?.skillsPracticed ?? {
        vocab: 0, grammar: 0, pronunciation: 0,
        listening: 0, reading: 0, writing: 0, chat: 0,
      },
    };
  } catch (err) {
    console.error('[getEnglishStats]', err);
    return null;
  }
}
