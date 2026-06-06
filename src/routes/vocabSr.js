import { Router } from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { sm2Update } from '../services/spacedRepetition.js';

const router = Router();

/**
 * GET /vocab-sr — Lấy tất cả vocab SRS cards của user
 */
router.get('/vocab-sr', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('vocabSRCards');
    const cards = user?.vocabSRCards || [];
    const today = new Date().toISOString().slice(0, 10);
    const due = cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today);
    res.json({
      cards,
      dueCount: due.length,
      totalCount: cards.length,
    });
  } catch (err) {
    console.error('[vocab-sr GET]', err);
    res.status(500).json({ error: 'Lỗi lấy thẻ từ vựng SRS' });
  }
});

/**
 * POST /vocab-sr/sync — Sync toàn bộ vocab SRS từ localStorage lên MongoDB
 * Body: { cards: SrsCard[] } — SrsCard từ vocabSrsStore
 */
router.post('/vocab-sr/sync', verifyToken, async (req, res) => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'cards phải là mảng' });
    }

    const user = await User.findById(req.user.id);
    const existingMap = new Map(
      (user.vocabSRCards || []).map((c) => [c.wordId, c])
    );

    for (const card of cards) {
      const existing = existingMap.get(card.wordId);
      if (existing) {
        // Chỉ cập nhật nếu backend có ngày review mới hơn (hoặc card mới hơn)
        if (!existing.nextReviewDate || card.nextReviewDate >= existing.nextReviewDate) {
          existing.interval = card.interval;
          existing.easeFactor = card.easeFactor;
          existing.repetitions = card.repetitions;
          existing.nextReviewDate = card.nextReviewDate;
          existing.lastReviewDate = card.lastReviewDate || new Date().toISOString().slice(0, 10);
        }
      } else {
        // Thêm card mới
        if (!user.vocabSRCards) user.vocabSRCards = [];
        user.vocabSRCards.push({
          wordId: card.wordId,
          word: card.word,
          topicId: card.topicId,
          interval: card.interval ?? 0,
          easeFactor: card.easeFactor ?? 2.5,
          repetitions: card.repetitions ?? 0,
          nextReviewDate: card.nextReviewDate ?? new Date().toISOString().slice(0, 10),
          lastReviewDate: card.lastReviewDate ?? new Date().toISOString().slice(0, 10),
          createdAt: card.createdAt ?? new Date().toISOString().slice(0, 10),
          ipa: card.ipa ?? '',
          meaning: card.meaning ?? '',
          example: card.example ?? '',
        });
      }
    }

    await user.save();
    res.json({
      ok: true,
      syncedCount: cards.length,
      totalCards: user.vocabSRCards?.length ?? 0,
    });
  } catch (err) {
    console.error('[vocab-sr sync]', err);
    res.status(500).json({ error: 'Lỗi sync vocab SRS' });
  }
});

/**
 * PUT /vocab-sr/:wordId — Cập nhật 1 card vocab SRS
 * Body: { quality: 0|1|2, nextReviewDate: string, interval, easeFactor, repetitions }
 */
router.put('/vocab-sr/:wordId', verifyToken, async (req, res) => {
  try {
    const { wordId } = req.params;
    const { quality, nextReviewDate, interval, easeFactor, repetitions } = req.body;

    const user = await User.findById(req.user.id);
    const card = user.vocabSRCards?.find((c) => c.wordId === wordId);

    if (!card) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ từ vựng' });
    }

    // Chạy SM-2 algorithm nếu có quality
    if (quality !== undefined) {
      const sm2Result = sm2Update(
        {
          interval: card.interval ?? 0,
          easeFactor: card.easeFactor ?? 2.5,
          repetitions: card.repetitions ?? 0,
        },
        Number(quality)
      );
      card.interval = sm2Result.interval;
      card.easeFactor = sm2Result.easeFactor;
      card.repetitions = sm2Result.repetitions;
      card.nextReviewDate = sm2Result.nextReviewDate;
    }

    // Override bằng giá trị client gửi (nếu có)
    if (nextReviewDate) card.nextReviewDate = nextReviewDate;
    if (interval !== undefined) card.interval = interval;
    if (easeFactor !== undefined) card.easeFactor = easeFactor;
    card.lastReviewDate = new Date().toISOString().slice(0, 10);

    await user.save();
    res.json({ ok: true, card });
  } catch (err) {
    console.error('[vocab-sr PUT]', err);
    res.status(500).json({ error: 'Lỗi cập nhật thẻ từ vựng' });
  }
});

export default router;
