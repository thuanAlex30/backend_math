/**
 * Social Challenges Service
 * Manages peer-to-peer math challenges and competitions
 */

import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Create a new social challenge
 */
async function createChallenge(challengerUserId, opponentUserId, problem, difficulty, timeLimit = 600) {
  try {
    
    // Get challenger info
    const challenger = await User.findById(challengerUserId);
    if (!challenger) throw new Error('Challenger not found');
    
    // Get opponent info
    const opponent = await User.findById(opponentUserId);
    if (!opponent) throw new Error('Opponent not found');
    
    // Create challenge object
    const challenge = {
      _id: new mongoose.Types.ObjectId(),
      challengerId: challengerUserId,
      opponentId: opponentUserId,
      challengerName: challenger.name || 'Anonymous',
      opponentName: opponent.name || 'Anonymous',
      problem: problem,
      difficulty: difficulty,
      timeLimit: timeLimit,
      status: 'pending', // pending, accepted, completed
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      challengerScore: null,
      opponentScore: null,
      challengerTime: null,
      opponentTime: null,
      winner: null
    };
    
    // Add to both users' challenges arrays
    if (!challenger.socialChallenges) challenger.socialChallenges = [];
    if (!opponent.socialChallenges) opponent.socialChallenges = [];
    
    challenger.socialChallenges.push(challenge);
    opponent.socialChallenges.push(challenge);
    
    await challenger.save();
    await opponent.save();
    
    return challenge;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
}

/**
 * Accept a challenge
 */
async function acceptChallenge(userId, challengeId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) throw new Error('User not found');
    if (!user.socialChallenges) user.socialChallenges = [];
    
    const challenge = user.socialChallenges.find(c => c._id.toString() === challengeId);
    if (!challenge) throw new Error('Challenge not found');
    
    challenge.status = 'accepted';
    await user.save();
    
    return challenge;
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw error;
  }
}

/**
 * Submit challenge result
 */
async function submitChallengeResult(userId, challengeId, score, timeSeconds) {
  try {
    const user = await User.findById(userId);
    
    if (!user) throw new Error('User not found');
    if (!user.socialChallenges) user.socialChallenges = [];
    
    const challenge = user.socialChallenges.find(c => c._id.toString() === challengeId);
    if (!challenge) throw new Error('Challenge not found');
    
    // Record the result
    if (challenge.challengerId.toString() === userId.toString()) {
      challenge.challengerScore = score;
      challenge.challengerTime = timeSeconds;
    } else {
      challenge.opponentScore = score;
      challenge.opponentTime = timeSeconds;
    }
    
    // Determine winner if both have submitted
    if (challenge.challengerScore !== null && challenge.opponentScore !== null) {
      challenge.status = 'completed';
      
      if (challenge.challengerScore > challenge.opponentScore) {
        challenge.winner = challenge.challengerId;
      } else if (challenge.opponentScore > challenge.challengerScore) {
        challenge.winner = challenge.opponentId;
      } else {
        challenge.winner = 'draw';
      }
    } else {
      challenge.status = 'in-progress';
    }
    
    await user.save();
    
    // Update opponent user as well
    const opponent = await User.findById(challenge.opponentId);
    if (opponent && opponent.socialChallenges) {
      const opponentChallenge = opponent.socialChallenges.find(c => c._id.toString() === challengeId);
      if (opponentChallenge) {
        Object.assign(opponentChallenge, challenge);
        await opponent.save();
      }
    }
    
    return challenge;
  } catch (error) {
    console.error('Error submitting challenge result:', error);
    throw error;
  }
}

/**
 * Get user's challenges
 */
async function getUserChallenges(userId, filter = 'all') {
  try {
    const user = await User.findById(userId);
    
    if (!user) throw new Error('User not found');
    if (!user.socialChallenges) return [];
    
    let challenges = [...user.socialChallenges];
    
    if (filter === 'pending') {
      challenges = challenges.filter(c => c.status === 'pending');
    } else if (filter === 'active') {
      challenges = challenges.filter(c => c.status === 'in-progress');
    } else if (filter === 'completed') {
      challenges = challenges.filter(c => c.status === 'completed');
    }
    
    return challenges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting user challenges:', error);
    throw error;
  }
}

/**
 * Get leaderboard for challenges
 */
async function getChallengeLeaderboard(limit = 50) {
  try {
    const users = await User.find({}, { 
      name: 1, 
      avatar: 1, 
      socialChallenges: 1,
      grade: 1,
      subject: 1
    });
    
    const leaderboard = users
      .map(user => {
        const challenges = user.socialChallenges || [];
        const completedChallenges = challenges.filter(c => c.status === 'completed');
        
        let wins = 0;
        let totalScore = 0;
        
        completedChallenges.forEach(challenge => {
          if (challenge.winner === user._id.toString()) {
            wins++;
          }
          if (challenge.challengerId.toString() === user._id.toString()) {
            totalScore += challenge.challengerScore || 0;
          } else {
            totalScore += challenge.opponentScore || 0;
          }
        });
        
        return {
          userId: user._id,
          name: user.name || 'Anonymous',
          avatar: user.avatar,
          grade: user.grade,
          subject: user.subject,
          wins: wins,
          totalChallenges: completedChallenges.length,
          winRate: completedChallenges.length > 0 ? (wins / completedChallenges.length * 100).toFixed(2) : 0,
          totalScore: totalScore,
          avgScore: completedChallenges.length > 0 ? (totalScore / completedChallenges.length).toFixed(2) : 0
        };
      })
      .filter(entry => entry.totalChallenges > 0)
      .sort((a, b) => b.wins - a.wins || b.avgScore - a.avgScore)
      .slice(0, limit);
    
    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

export {
  createChallenge,
  acceptChallenge,
  submitChallengeResult,
  getUserChallenges,
  getChallengeLeaderboard
};
