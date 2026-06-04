import { Router } from 'express';
import {
  getTopics,
  isValidGrade,
  isValidSubject,
  GRADES,
} from '../data/curriculum.js';
import { generatePracticeQuestions } from '../services/practice.js';

const router = Router();

/** Danh sách lớp 6–12 */
router.get('/grades', (_req, res) => {
  res.json({ grades: GRADES });
});

/** Chủ đề theo môn và lớp: ?subject=math|english&grade=6 */
router.get('/topics', (req, res) => {
  const { subject = 'math', grade } = req.query;

  if (!isValidSubject(subject)) {
    return res.status(400).json({ error: 'Môn học không hợp lệ (math hoặc english)' });
  }
  if (!isValidGrade(grade)) {
    return res.status(400).json({ error: 'Lớp phải từ 6 đến 12' });
  }

  const topics = getTopics(subject, Number(grade));
  res.json({ subject, grade: Number(grade), topics });
});

/** Sinh đề trắc nghiệm luyện tập */
router.post('/generate-questions', async (req, res) => {
  try {
    const {
      grade,
      subject = 'math',
      topic,
      numberOfQuestions = 5,
    } = req.body || {};

    if (!isValidSubject(subject)) {
      return res.status(400).json({ error: 'Môn học không hợp lệ' });
    }
    if (!isValidGrade(grade)) {
      return res.status(400).json({ error: 'Vui lòng chọn lớp từ 6 đến 12' });
    }
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Vui lòng chọn chủ đề' });
    }

    const topics = getTopics(subject, Number(grade));
    if (!topics.some((t) => t.id === topic)) {
      return res.status(400).json({ error: 'Chủ đề không thuộc chương trình lớp này' });
    }

    const result = await generatePracticeQuestions({
      grade: Number(grade),
      subject,
      topic,
      numberOfQuestions,
    });

    res.json({
      grade: Number(grade),
      subject,
      topic,
      ...result,
    });
  } catch (err) {
    console.error('[generate-questions]', err);
    res.status(500).json({
      error: 'Không tạo được đề luyện tập',
      message: err.message,
    });
  }
});

export default router;
