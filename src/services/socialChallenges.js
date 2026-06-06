/**
 * socialChallenges.js — Social Challenge Service
 *
 * Storage: MongoDB (Challenge collection)
 * Migration: hiện dùng User.socialChallenges[], chuyển sang collection riêng
 *
 * Logic giữ nguyên — chỉ thay storage.
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';

/**
 * Tạo challenge mới
 */
async function createChallenge(challengerUserId, opponentUserId, problem, difficulty, timeLimit = 600) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const challenger = await User.findById(challengerUserId).session(session);
    const opponent = await User.findById(opponentUserId).session(session);
    if (!challenger) throw new Error('Challenger not found');
    if (!opponent) throw new Error('Opponent not found');

    const challenge = await Challenge.createChallenge({
      challengerId: challengerUserId,
      opponentId: opponentUserId,
      challengerName: challenger.name || 'Học sinh ẩn danh',
      opponentName: opponent.name || 'Học sinh ẩn danh',
      problem,
      difficulty,
      timeLimit,
    });

    await session.commitTransaction();
    return challenge;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Chấp nhận challenge
 */
async function acceptChallenge(userId, challengeId) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) throw new Error('Challenge not found');

  if (challenge.opponentId.toString() !== userId.toString()) {
    throw new Error('Bạn không phải người được nhận thách thức này');
  }
  if (challenge.status !== 'pending') {
    throw new Error('Challenge không còn ở trạng thái pending');
  }

  challenge.accept();
  await challenge.save();
  return challenge;
}

/**
 * Nộp kết quả challenge
 */
async function submitChallengeResult(userId, challengeId, score, timeSeconds) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) throw new Error('Challenge not found');

  const isParticipant =
    challenge.challengerId.toString() === userId.toString() ||
    challenge.opponentId.toString() === userId.toString();

  if (!isParticipant) throw new Error('Bạn không tham gia challenge này');

  challenge.submitResult(userId, score, timeSeconds);
  await challenge.save();
  return challenge;
}

/**
 * Lấy danh sách challenge của user
 */
async function getUserChallenges(userId, filter = 'all') {
  return Challenge.findByUser(userId, filter);
}

/**
 * Lấy challenge leaderboard — lean query + JS aggregation
 * Đáng tin cậy hơn pipeline phức tạp
 */
async function getChallengeLeaderboard(limit = 50) {
  try {
    const challenges = await Challenge.find({ status: 'completed' })
      .populate('challengerId', 'name avatar grade')
      .populate('opponentId', 'name avatar grade')
      .lean();

    const userStats = {};

    for (const ch of challenges) {
      const challengerId = ch.challengerId?._id?.toString();
      const opponentId = ch.opponentId?._id?.toString();

      for (const entry of [
        { uid: challengerId, role: 'challenger' },
        { uid: opponentId, role: 'opponent' },
      ]) {
        if (!entry.uid) continue;

        if (!userStats[entry.uid]) {
          const userDoc = entry.role === 'challenger' ? ch.challengerId : ch.opponentId;
          userStats[entry.uid] = {
            userId: entry.uid,
            name: userDoc?.name || 'Học sinh ẩn danh',
            avatar: userDoc?.avatar || null,
            grade: userDoc?.grade || null,
            wins: 0,
            totalScore: 0,
            totalTime: 0,
            played: 0,
          };
        }

        const stats = userStats[entry.uid];
        stats.played += 1;

        const myResult = entry.role === 'challenger'
          ? ch.challengerResult
          : ch.opponentResult;
        stats.totalScore += myResult?.score ?? 0;
        stats.totalTime += myResult?.timeSeconds ?? 0;

        if (ch.winnerId && ch.winnerId.toString() === entry.uid) {
          stats.wins += 1;
        } else if (ch.isDraw) {
          stats.wins += 0.5;
        }
      }
    }

    const entries = Object.values(userStats);
    entries.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aAvg = a.played > 0 ? a.totalScore / a.played : 0;
      const bAvg = b.played > 0 ? b.totalScore / b.played : 0;
      return bAvg - aAvg;
    });

    return entries.slice(0, limit).map((e, idx) => ({
      userId: e.userId,
      name: e.name,
      avatar: e.avatar,
      grade: e.grade,
      wins: Math.round(e.wins * 2) / 2,
      totalChallenges: e.played,
      winRate: e.played > 0
        ? ((e.wins / e.played) * 100).toFixed(2)
        : '0.00',
      totalScore: e.totalScore,
      avgScore: e.played > 0
        ? (e.totalScore / e.played).toFixed(2)
        : '0.00',
      rank: idx + 1,
    }));
  } catch (err) {
    console.error('[challenge leaderboard] error, using fallback:', err.message);
    return getChallengeLeaderboardFallback(limit);
  }
}

/**
 * Fallback: query User.collection (chạy khi Challenge collection chưa có data)
 */
async function getChallengeLeaderboardFallback(limit = 50) {
  const users = await User.find({}, {
    name: 1,
    avatar: 1,
    socialChallenges: 1,
    grade: 1,
  }).lean();

  const ranked = users
    .map((user) => {
      const challenges = user.socialChallenges || [];
      const completed = challenges.filter((c) => c.status === 'completed');

      let wins = 0;
      let totalScore = 0;

      for (const challenge of completed) {
        const isWinner =
          challenge.winner &&
          challenge.winner.toString() === user._id.toString();
        if (isWinner) wins++;

        if (challenge.challengerId?.toString() === user._id.toString()) {
          totalScore += challenge.challengerScore || 0;
        } else {
          totalScore += challenge.opponentScore || 0;
        }
      }

      return {
        userId: user._id.toString(),
        name: user.name || 'Học sinh ẩn danh',
        avatar: user.avatar,
        grade: user.grade,
        wins,
        totalChallenges: completed.length,
        winRate: completed.length > 0
          ? ((wins / completed.length) * 100).toFixed(2)
          : '0.00',
        totalScore,
        avgScore: completed.length > 0
          ? (totalScore / completed.length).toFixed(2)
          : '0.00',
      };
    })
    .filter((entry) => entry.totalChallenges > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return parseFloat(b.avgScore) - parseFloat(a.avgScore);
    })
    .slice(0, limit);

  return ranked.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export {
  createChallenge,
  acceptChallenge,
  submitChallengeResult,
  getUserChallenges,
  getChallengeLeaderboard,
};
