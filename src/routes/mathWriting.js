import { Router } from 'express';
import { isDemoMode, chatComplete } from '../services/hfRouter.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { recordPracticeResult } from '../services/graphRag.js';
import User from '../models/User.js';

const router = Router();

const GRADING_PROMPT = `Bạn là giáo viên Toán chấm bài trình bày của học sinh Việt Nam.

Chấm theo tiêu chí (thang 10):
- Rõ ràng, đủ bước (3 điểm)
- Ký hiệu và công thức đúng (2 điểm)
- Logic suy luận (3 điểm)
- Kết luận/đáp án (2 điểm)

Trả lời JSON duy nhất:
{"score":8,"feedback":"...","suggestions":["..."]}

Toàn bộ feedback và suggestions bằng tiếng Việt, thân thiện.`;

router.post('/math/writing/check', verifyToken, async (req, res) => {
  try {
    const { problem, studentSolution, grade = 9, studentSessionId } = req.body || {};
    if (!problem?.trim() || !studentSolution?.trim()) {
      return res.status(400).json({ error: 'Cần đề bài và lời giải của học sinh' });
    }

    if (isDemoMode()) {
      return res.json({
        score: 7,
        feedback: 'Chế độ demo: Bài trình bày khá rõ ràng. Thêm HUGGINGFACE_API_KEY để chấm chi tiết.',
        suggestions: ['Ghi rõ từng bước', 'Kiểm tra lại ký hiệu'],
        demo: true,
      });
    }

    const raw = await chatComplete(
      [
        { role: 'system', content: GRADING_PROMPT },
        {
          role: 'user',
          content: `Lớp ${grade}\n\n[Đề]\n${problem}\n\n[Lời giải học sinh]\n${studentSolution}`,
        },
      ],
      { max_tokens: 800, temperature: 0.4 }
    );

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = { score: 6, feedback: raw, suggestions: [] };
    }

    const score = Math.max(0, Math.min(10, Number(parsed.score) || 0));
    const isCorrect = score >= 6;

    // 1) Cập nhật graphRag profile (session-based)
    if (studentSessionId) {
      try {
        await recordPracticeResult(studentSessionId, 'math_writing', isCorrect ? 1 : 0, 1);
      } catch (e) {
        console.warn('[math/writing] graphRag update failed:', e.message);
      }
    }

    // 2) Cập nhật practiceHistory vào MongoDB (nếu user đã đăng nhập)
    if (req.user?.id) {
      try {
        await User.findByIdAndUpdate(req.user.id, {
          $push: {
            practiceHistory: {
              $each: [{
                questionId: `writing-${Date.now()}`,
                topicId: 'math_writing',
                topicName: 'Trình bày Toán',
                question: problem.slice(0, 200),
                isCorrect,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
                timeSeconds: null,
                difficulty: 'medium',
              }],
              $position: 0,
              $slice: -500,
            },
          },
        });
      } catch (e) {
        console.warn('[math/writing] MongoDB update failed:', e.message);
      }
    }

    res.json({ ...parsed, score, demo: false });
  } catch (err) {
    console.error('[math/writing/check]', err);
    res.status(500).json({ error: 'Không chấm được bài viết' });
  }
});

export default router;
