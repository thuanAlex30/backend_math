import { Router } from 'express';
import { isDemoMode, chatComplete } from '../services/hfRouter.js';

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

router.post('/math/writing/check', async (req, res) => {
  try {
    const { problem, studentSolution, grade = 9 } = req.body || {};
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

    res.json({ ...parsed, demo: false });
  } catch (err) {
    console.error('[math/writing/check]', err);
    res.status(500).json({ error: 'Không chấm được bài viết' });
  }
});

export default router;
