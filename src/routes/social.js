/**
 * Social Features Routes
 * Handles social challenges, learning coach, and question of the day
 */

import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import * as socialChallenges from '../services/socialChallenges.js';
import * as learningCoach from '../services/learningCoach.js';
import * as qotd from '../services/qotd.js';

const router = express.Router();

// ============================================
// SOCIAL CHALLENGES ROUTES
// ============================================

/**
 * POST /api/social/challenges/create
 * Create a new challenge
 */
router.post('/challenges/create', verifyToken, async (req, res) => {
  try {
    const { opponentId, problem, difficulty, timeLimit } = req.body;
    const challengerId = req.user.id;
    
    if (!opponentId || !problem || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const challenge = await socialChallenges.createChallenge(
      challengerId,
      opponentId,
      problem,
      difficulty,
      timeLimit || 600
    );
    
    res.json({
      success: true,
      challenge: challenge
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/challenges/:challengeId/accept
 * Accept a challenge
 */
router.post('/challenges/:challengeId/accept', verifyToken, async (req, res) => {
  try {
    const challenge = await socialChallenges.acceptChallenge(req.user.id, req.params.challengeId);
    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/challenges/:challengeId/submit
 * Submit challenge result
 */
router.post('/challenges/:challengeId/submit', verifyToken, async (req, res) => {
  try {
    const { score, timeSeconds } = req.body;
    
    if (typeof score !== 'number' || typeof timeSeconds !== 'number') {
      return res.status(400).json({ error: 'Invalid score or timeSeconds' });
    }
    
    const challenge = await socialChallenges.submitChallengeResult(
      req.user.id,
      req.params.challengeId,
      score,
      timeSeconds
    );
    
    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Error submitting challenge result:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/challenges
 * Get user's challenges
 */
router.get('/challenges', verifyToken, async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const challenges = await socialChallenges.getUserChallenges(req.user.id, filter);
    res.json({ success: true, challenges });
  } catch (error) {
    console.error('Error getting challenges:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/challenges/leaderboard
 * Get global challenges leaderboard
 */
router.get('/challenges/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = await socialChallenges.getChallengeLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LEARNING COACH ROUTES
// ============================================

/**
 * GET /api/social/coach/analysis
 * Get learning analysis for user
 */
router.get('/coach/analysis', verifyToken, async (req, res) => {
  try {
    const analysis = await learningCoach.analyzePracticeHistory(req.user.id);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/coach/message
 * Get personalized coaching message
 */
router.get('/coach/message', verifyToken, async (req, res) => {
  try {
    const focusArea = req.query.focusArea || null;
    const coachingMessage = await learningCoach.generateCoachingMessage(req.user.id, focusArea);
    res.json({ success: true, coachingMessage });
  } catch (error) {
    console.error('Error generating coaching message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/coach/recommendations
 * Get personalized recommendations
 */
router.get('/coach/recommendations', verifyToken, async (req, res) => {
  try {
    const recommendations = await learningCoach.getPersonalizedRecommendations(req.user.id);
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// QUESTION OF THE DAY ROUTES
// ============================================

/**
 * GET /api/social/qotd
 * Get today's question
 */
router.get('/qotd', async (req, res) => {
  try {
    const question = await qotd.getTodayQuestion();
    res.json({ success: true, question });
  } catch (error) {
    console.error('Error getting QotD:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/qotd/submit
 * Submit answer to question of the day
 */
router.post('/qotd/submit', verifyToken, async (req, res) => {
  try {
    const { answer, timeSeconds } = req.body;
    const questionDate = req.body.questionDate || new Date().toISOString().split('T')[0];
    
    if (!answer || typeof timeSeconds !== 'number') {
      return res.status(400).json({ error: 'Missing answer or timeSeconds' });
    }
    
    const result = await qotd.submitQotDAnswer(req.user.id, questionDate, answer, timeSeconds);
    res.json({ success: true, result });
  } catch (error) {
    // "already submitted" là expected flow — không in error rác
    if (error.message.includes('already submitted')) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Error submitting QotD answer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/qotd/leaderboard
 * Get QotD leaderboard
 */
router.get('/qotd/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const leaderboard = await qotd.getQotDLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error getting QotD leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/qotd/stats
 * Get user's QotD statistics
 */
router.get('/qotd/stats', verifyToken, async (req, res) => {
  try {
    const stats = await qotd.getUserQotDStats(req.user.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting QotD stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
