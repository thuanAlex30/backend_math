import { Router } from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  generateSmartNotifications,
  filterNotifications,
  generateStreakNotification,
  generateQotDNotification,
} from '../services/smartNotification.js';
import {
  sm2UpdateMath,
  getMathCardsDue,
  createMathCard,
  getMathCardsWithMistakes,
  createDailyReviewPlan,
  suggestNextReviewSession,
} from '../services/mathSpacedRepetition.js';

const router = Router();

/**
 * GET /notifications - Lấy thông báo của học sinh
 * Query: ?unreadOnly=true (default: false)
 */
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly = false } = req.query;

    const user = await User.findById(userId).select('notifications');
    let notifications = user?.notifications || [];

    // Lọc chưa đọc
    if (unreadOnly === 'true') {
      notifications = notifications.filter((n) => !n.isRead);
    }

    // Lọc hết hạn (> 7 ngày)
    const now = new Date();
    notifications = notifications.filter((n) => {
      if (!n.expiresAt) return true;
      return new Date(n.expiresAt) > now;
    });

    res.json({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length });
  } catch (err) {
    console.error('[notifications GET]', err);
    res.status(500).json({ error: 'Lỗi lấy thông báo', message: err.message });
  }
});

/**
 * POST /notifications/mark-read - Đánh dấu thông báo đã đọc
 * Body: { notificationId: string }
 */
router.post('/notifications/mark-read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    const user = await User.findById(userId);
    const notification = user.notifications.find((n) => n.id === notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Thông báo không tìm thấy' });
    }

    notification.isRead = true;
    await user.save();

    res.json({ message: 'Đánh dấu đã đọc', notification });
  } catch (err) {
    console.error('[notifications mark-read]', err);
    res.status(500).json({ error: 'Lỗi cập nhật thông báo' });
  }
});

/**
 * POST /notifications/generate - Tạo thông báo thông minh
 * Trigger sau mỗi lần học sinh hoàn thành bài tập
 * Body: { topicId?, recentPracticeCount?: 20 }
 */
router.post('/notifications/generate', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recentPracticeCount = 20 } = req.body;

    const user = await User.findById(userId).select('practiceHistory notificationSettings notifications');

    // Lấy lịch sử gần nhất
    const recentHistory = user.practiceHistory?.slice(-recentPracticeCount) || [];

    // Tạo thông báo
    let newNotifications = generateSmartNotifications(user, recentHistory);

    // Lọc để không spam (max 3 thông báo/ngày)
    const today = new Date().toISOString().slice(0, 10);
    const todayNotifications = (user.notifications || []).filter(
      (n) => n.createdAt?.slice(0, 10) === today && !n.isRead
    );

    newNotifications = filterNotifications(newNotifications, todayNotifications);

    // Thêm vào database
    if (newNotifications.length > 0) {
      newNotifications = newNotifications.map((n) => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ...n,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ngày
      }));

      user.notifications.push(...newNotifications);
      await user.save();
    }

    res.json({
      newNotifications,
      totalNotifications: user.notifications.length,
    });
  } catch (err) {
    console.error('[notifications generate]', err);
    res.status(500).json({ error: 'Lỗi tạo thông báo', message: err.message });
  }
});

/**
 * GET /math-sr - Lấy danh sách SR cards
 * Query: ?dueOnly=true (chỉ lấy bài due hôm nay)
 */
router.get('/math-sr', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dueOnly = false } = req.query;

    const user = await User.findById(userId).select('mathSRCards');
    let cards = user?.mathSRCards || [];

    if (dueOnly === 'true') {
      cards = getMathCardsDue(cards);
    }

    const stats = {
      total: user.mathSRCards?.length || 0,
      dueToday: getMathCardsDue(user?.mathSRCards || []).length,
      withMistakes: getMathCardsWithMistakes(user?.mathSRCards || []).length,
    };

    res.json({
      cards: cards.slice(0, 20), // Trả 20 cards đầu tiên
      stats,
      reviewPlan: createDailyReviewPlan(user?.mathSRCards || []),
    });
  } catch (err) {
    console.error('[math-sr GET]', err);
    res.status(500).json({ error: 'Lỗi lấy SR cards', message: err.message });
  }
});

/**
 * POST /math-sr - Thêm SR card mới (khi sinh đề luyện tập)
 * Body: { questionId, question, topic, options, correct, explanation }
 */
router.post('/math-sr', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const questionData = req.body;

    const user = await User.findById(userId);
    const newCard = createMathCard(questionData);

    user.mathSRCards = user.mathSRCards || [];
    user.mathSRCards.push(newCard);
    await user.save();

    res.json({ message: 'Thêm card SR', card: newCard });
  } catch (err) {
    console.error('[math-sr POST]', err);
    res.status(500).json({ error: 'Lỗi thêm SR card', message: err.message });
  }
});

/**
 * PUT /math-sr/:cardId - Cập nhật card (khi học sinh hoàn thành câu hỏi)
 * Body: { quality: 0|1|2, isCorrect: boolean }
 * quality: 0=Khó/Sai, 1=Vừa/Gợi ý, 2=Dễ/Đúng
 */
router.put('/math-sr/:cardId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { quality, isCorrect } = req.body;

    if (quality === undefined || ![0, 1, 2].includes(quality)) {
      return res.status(400).json({ error: 'quality phải là 0, 1, hoặc 2' });
    }

    const user = await User.findById(userId);
    const card = user.mathSRCards.find((c) => c.questionId === cardId || c._id?.toString() === cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card không tìm thấy' });
    }

    // Update card theo SM-2
    const updatedCard = sm2UpdateMath(card, quality);
    Object.assign(card, updatedCard);

    // Lưu vào practiceHistory
    user.practiceHistory = user.practiceHistory || [];
    user.practiceHistory.push({
      questionId: card.questionId,
      topicId: card.topic,
      topicName: card.topic,
      question: card.question,
      isCorrect: quality >= 1,
      timestamp: new Date().toISOString(),
    });

    await user.save();

    res.json({
      message: 'Card updated',
      card: updatedCard,
      nextReviewDate: updatedCard.nextReviewDate,
      interval: updatedCard.interval,
    });
  } catch (err) {
    console.error('[math-sr PUT]', err);
    res.status(500).json({ error: 'Lỗi cập nhật card', message: err.message });
  }
});

/**
 * GET /math-sr/review-suggestions - Gợi ý ôn tập
 */
router.get('/math-sr/review-suggestions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('mathSRCards');

    const suggestions = suggestNextReviewSession(user?.mathSRCards || []);
    const reviewPlan = createDailyReviewPlan(user?.mathSRCards || [], 10);

    res.json({
      suggestions,
      reviewPlan,
      totalCards: user.mathSRCards?.length || 0,
    });
  } catch (err) {
    console.error('[review-suggestions]', err);
    res.status(500).json({ error: 'Lỗi lấy gợi ý' });
  }
});

export default router;
