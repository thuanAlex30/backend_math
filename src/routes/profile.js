import { Router } from 'express';
import {
  getStudentProfile,
  getWeakTopics,
  getStrongTopics,
  getPrerequisitesToReview,
  getKnowledgeMap,
  recordPracticeResult,
  updateStudentProfile,
} from '../services/graphRag.js';
import { generateDailyPlan, completeDailyTask } from '../services/dailyPlan.js';
import { verifyToken } from '../middleware/verifyToken.js';
import User from '../models/User.js';

const router = Router();

router.get('/profile/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const profile = await getStudentProfile(sessionId);
    if (!profile || Object.keys(profile.topics || {}).length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    }
    const weakTopics = getWeakTopics(profile);
    const strongTopics = getStrongTopics(profile);
    const prerequisitesToReview = getPrerequisitesToReview(
      profile,
      weakTopics.map((t) => t.id)
    );
    res.json({
      sessionId: profile.sessionId,
      topics: profile.topics,
      weakTopics,
      strongTopics,
      prerequisitesToReview,
    });
  } catch (err) {
    console.error('[profile]', err);
    res.status(500).json({ error: 'Không tải được hồ sơ học sinh' });
  }
});

router.get('/profile/:sessionId/knowledge-map', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { grade } = req.query;
    const profile = await getStudentProfile(sessionId);
    const map = getKnowledgeMap(profile || { topics: {} }, grade);
    res.json(map);
  } catch (err) {
    console.error('[knowledge-map]', err);
    res.status(500).json({ error: 'Không tải được bản đồ kiến thức' });
  }
});

router.get('/profile/:sessionId/daily-plan', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const grade = Number(req.query.grade) || 9;
    const preferredFormat = req.query.preferredFormat || undefined;
    const plan = await generateDailyPlan(sessionId, grade, preferredFormat);
    res.json(plan);
  } catch (err) {
    console.error('[daily-plan]', err);
    res.status(500).json({ error: 'Không tạo được kế hoạch hôm nay' });
  }
});

router.post('/profile/:sessionId/daily-plan/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { taskId } = req.body || {};
    if (!taskId) {
      return res.status(400).json({ error: 'Thiếu taskId' });
    }
    const plan = await completeDailyTask(sessionId, taskId);
    res.json(plan);
  } catch (err) {
    console.error('[daily-plan/complete]', err);
    res.status(500).json({ error: 'Không cập nhật được tiến độ' });
  }
});

router.post('/profile/:sessionId/record-practice', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { topicId, correct, total } = req.body || {};
    if (!topicId) {
      return res.status(400).json({ error: 'Thiếu topicId' });
    }
    const profile = await recordPracticeResult(
      sessionId,
      topicId,
      Number(correct) || 0,
      Number(total) || 1
    );
    res.json({ ok: true, profile });
  } catch (err) {
    console.error('[record-practice]', err);
    res.status(500).json({ error: 'Không ghi nhận kết quả luyện tập' });
  }
});

/** Cập nhật profile thủ công (Socratic understood / skip answer) */
router.post('/profile/:sessionId/record-topic', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { topicId, isCorrect } = req.body || {};
    if (!topicId) {
      return res.status(400).json({ error: 'Thiếu topicId' });
    }
    const profile = await updateStudentProfile(sessionId, topicId, isCorrect === true);
    res.json({ ok: true, profile });
  } catch (err) {
    console.error('[record-topic]', err);
    res.status(500).json({ error: 'Không cập nhật được chủ đề' });
  }
});

/** Sync Math gamification stats lên MongoDB */
router.post('/math/stats/sync', verifyToken, async (req, res) => {
  try {
    const { points, selfSolveCount, streak, lastStudyDate, topicCorrectCounts, badges } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      mathStats: {
        points: Number(points) || 0,
        selfSolveCount: Number(selfSolveCount) || 0,
        streak: Number(streak) || 0,
        lastStudyDate: lastStudyDate || null,
        topicCorrectCounts: topicCorrectCounts || {},
        badges: badges || [],
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[math/stats/sync]', err);
    res.status(500).json({ error: 'Lỗi sync stats Toán' });
  }
});

/** Lấy Math stats của user đang login */
router.get('/math/stats/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('mathStats');
    res.json({ mathStats: user?.mathStats || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Global Math Leaderboard */
router.get('/math/leaderboard/global', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const users = await User.find({ 'mathStats.points': { $gt: 0 } })
      .sort({ 'mathStats.points': -1 })
      .limit(limit)
      .select('name avatar grade mathStats')
      .lean();

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      avatar: u.avatar,
      grade: u.grade,
      points: u.mathStats?.points || 0,
      streak: u.mathStats?.streak || 0,
      selfSolveCount: u.mathStats?.selfSolveCount || 0,
      badges: (u.mathStats?.badges || []).filter((b) => b.unlocked).length,
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('[math/leaderboard/global]', err);
    res.status(500).json({ error: 'Lỗi lấy bảng xếp hạng' });
  }
});

export default router;
