import { Router } from 'express';
import { classifyTopic, updateStudentProfile } from '../services/graphRag.js';
import { generatePracticeQuestions } from '../services/practice.js';
import { isDemoMode, chatComplete } from '../services/hfRouter.js';
import { isValidGrade } from '../data/curriculum.js';
import { NODE_BY_ID } from '../data/mathGraph.js';
import { verifyToken } from '../middleware/verifyToken.js';
import ExamSubmission from '../models/ExamSubmission.js';

const THPT_MATRIX = [
  { topic: 'dao_ham', weight: 0.18, label: 'Đạo hàm' },
  { topic: 'tich_phan', weight: 0.18, label: 'Tích phân' },
  { topic: 'hinh_hoc_khong_gian', weight: 0.14, label: 'Hình học không gian' },
  { topic: 'so_phuc', weight: 0.1, label: 'Số phức' },
  { topic: 'xac_suat', weight: 0.12, label: 'Xác suất' },
  { topic: 'ham_so', weight: 0.1, label: 'Hàm số' },
  { topic: 'luong_giac', weight: 0.08, label: 'Lượng giác' },
  { topic: 'logarit', weight: 0.1, label: 'Logarit' },
];

const router = Router();

/** Sinh đề THPT mock 50 câu */
router.post('/practice/generate-exam', async (req, res) => {
  try {
    const { type = 'thpt', grade = 12 } = req.body || {};
    if (type !== 'thpt') {
      return res.status(400).json({ error: 'Loại đề không hỗ trợ' });
    }
    if (!isValidGrade(grade)) {
      return res.status(400).json({ error: 'Lớp phải từ 6 đến 12' });
    }

    const questions = [];
    let qIndex = 0;

    for (const item of THPT_MATRIX) {
      const count = Math.max(1, Math.round(item.weight * 50));
      try {
        const result = await generatePracticeQuestions({
          grade: Number(grade),
          subject: 'math',
          topic: item.topic,
          numberOfQuestions: count,
        });
        for (const q of result.questions || []) {
          questions.push({
            ...q,
            id: qIndex++,
            topicId: item.topic,
            topicLabel: item.label,
          });
        }
      } catch {
        /* bỏ qua topic lỗi */
      }
    }

    while (questions.length < 50 && questions.length > 0) {
      questions.push({ ...questions[questions.length % questions.length], id: qIndex++ });
    }

    res.json({
      type: 'thpt',
      grade: Number(grade),
      durationMinutes: 90,
      totalQuestions: Math.min(50, questions.length),
      questions: questions.slice(0, 50),
      demo: isDemoMode(),
    });
  } catch (err) {
    console.error('[generate-exam]', err);
    res.status(500).json({ error: 'Không tạo được đề thi' });
  }
});

/** Phân tích đề đa trang — text đã OCR gộp */
router.post('/exam/analyze', async (req, res) => {
  try {
    const { text, grade = 12 } = req.body || {};
    if (!text?.trim()) {
      return res.status(400).json({ error: 'Thiếu nội dung đề thi' });
    }

    const lines = text.split(/\n+/).filter(Boolean);
    const topicCounts = {};
    for (const line of lines) {
      const topicId = await classifyTopic(line);
      if (topicId) {
        topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
      }
    }

    const total = Object.values(topicCounts).reduce((a, b) => a + b, 0) || 1;
    const breakdown = Object.entries(topicCounts)
      .map(([id, count]) => ({
        id,
        name: NODE_BY_ID[id]?.name || id,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);

    let summary = 'Phân tích theo từ khóa chủ đề.';
    if (!isDemoMode()) {
      try {
        summary = await chatComplete(
          [
            {
              role: 'system',
              content:
                'Bạn là giáo viên Toán VN. Tóm tắt ngắn (3-4 câu) đề thi và gợi ý ôn tập cho học sinh lớp ' +
                grade +
                '. Tiếng Việt.',
            },
            { role: 'user', content: text.slice(0, 4000) },
          ],
          { max_tokens: 300, temperature: 0.5 }
        );
      } catch {
        /* fallback summary */
      }
    }

    res.json({
      breakdown,
      summary,
      recommendReview: breakdown.slice(0, 3).map((b) => b.name),
      demo: isDemoMode(),
    });
  } catch (err) {
    console.error('[exam/analyze]', err);
    res.status(500).json({ error: 'Không phân tích được đề thi' });
  }
});

/** Cập nhật profile sau thi mock — lưu vào MongoDB */
router.post('/exam/submit', async (req, res) => {
  try {
    const { studentSessionId, answers, grade = 12, questions, timeSpentSeconds } = req.body || {};
    if (!answers?.length) {
      return res.status(400).json({ error: 'Thiếu dữ liệu bài thi' });
    }

    const byTopic = {};
    for (const a of answers) {
      if (!a.topicId) continue;
      if (!byTopic[a.topicId]) byTopic[a.topicId] = { correct: 0, total: 0 };
      byTopic[a.topicId].total += 1;
      if (a.correct) byTopic[a.topicId].correct += 1;
    }

    for (const [topicId, stat] of Object.entries(byTopic)) {
      const isCorrect = stat.correct / stat.total >= 0.6;
      await updateStudentProfile(studentSessionId, topicId, isCorrect);
    }

    const score = answers.filter((a) => a.correct).length;
    const scoreOutOf10 = Math.round((score / answers.length) * 10 * 10) / 10;

    // Lưu submission vào MongoDB
    const userId = req.user?.id ?? null;
    let submission = null;
    try {
      const qaList = (questions || answers).map((a, i) => ({
        questionNumber: i + 1,
        question: a.question || '',
        options: a.options || [],
        userAnswer: a.userAnswer ?? null,
        correctAnswer: a.correctAnswer ?? a.correct ?? null,
        isCorrect: a.correct ?? false,
        topicId: a.topicId || null,
        topicLabel: a.topicLabel || null,
      }));

      submission = await ExamSubmission.create({
        userId,
        sessionId: studentSessionId || null,
        type: 'thpt',
        grade: Number(grade),
        questions: qaList,
        score,
        totalQuestions: answers.length,
        scoreOutOf10,
        timeSpentSeconds: timeSpentSeconds ?? null,
      });
    } catch (saveErr) {
      console.warn('[exam/submit] MongoDB save failed:', saveErr.message);
    }

    res.json({
      score,
      total: answers.length,
      scoreOutOf10,
      submissionId: submission?._id?.toString() ?? null,
    });
  } catch (err) {
    console.error('[exam/submit]', err);
    res.status(500).json({ error: 'Không nộp được bài thi' });
  }
});

/** Lấy lịch sử thi của user */
router.get('/exam/history', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const submissions = await ExamSubmission.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      submissions: submissions.map((s) => ({
        id: s._id.toString(),
        type: s.type,
        grade: s.grade,
        date: s.date,
        score: s.score,
        totalQuestions: s.totalQuestions,
        scoreOutOf10: s.scoreOutOf10,
        durationMinutes: s.durationMinutes,
        timeSpentSeconds: s.timeSpentSeconds,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error('[exam/history]', err);
    res.status(500).json({ error: 'Không lấy được lịch sử thi' });
  }
});

/** Lấy chi tiết 1 bài thi */
router.get('/exam/history/:id', verifyToken, async (req, res) => {
  try {
    const submission = await ExamSubmission.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!submission) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi' });
    }

    res.json({
      id: submission._id.toString(),
      type: submission.type,
      grade: submission.grade,
      date: submission.date,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      scoreOutOf10: submission.scoreOutOf10,
      durationMinutes: submission.durationMinutes,
      timeSpentSeconds: submission.timeSpentSeconds,
      analysis: submission.analysis,
      questions: submission.questions,
      createdAt: submission.createdAt,
    });
  } catch (err) {
    console.error('[exam/history/:id]', err);
    res.status(500).json({ error: 'Không lấy được chi tiết bài thi' });
  }
});

export default router;
