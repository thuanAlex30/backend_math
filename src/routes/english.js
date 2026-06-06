import { Router } from 'express';
import {
  getAllGrades,
  getCurriculum,
  getAllVocabularyTopics,
  getVocabulary,
  getGrammarTopics,
  explainGrammar,
  checkWriting,
  scorePronunciation,
  generateListening,
  generateReading,
  gradeListening,
  englishChat,
  getPronunciationPractice,
  expandVocabulary,
  getEnglishSkillProfile,
  recordEnglishSkill,
} from '../services/english.js';
import {
  getEnglishLeaderboard,
  syncEnglishStats,
  getEnglishStats,
} from '../services/englishLeaderboard.js';
import { isValidEnglishGrade } from '../data/englishCurriculum.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();

function parseGrade(queryOrBody) {
  const raw = queryOrBody?.grade ?? queryOrBody;
  const g = Number(raw);
  return isValidEnglishGrade(g) ? g : null;
}

router.get('/english/grades', (_req, res) => {
  res.json({ grades: getAllGrades() });
});

router.get('/english/curriculum', (req, res) => {
  const grade = parseGrade(req.query);
  if (grade == null) {
    return res.status(400).json({ error: 'Lớp phải từ 6 đến 12' });
  }
  res.json(getCurriculum(grade));
});

router.get('/english/topics/vocabulary', (req, res) => {
  const grade = parseGrade(req.query) ?? 9;
  res.json({ grade, topics: getAllVocabularyTopics(grade) });
});

router.get('/english/vocabulary/:topicId', (req, res) => {
  const grade = parseGrade(req.query) ?? 9;
  const topic = getVocabulary(req.params.topicId, grade);
  if (!topic) {
    return res.status(404).json({ error: 'Chủ đề không phù hợp với lớp đã chọn' });
  }
  res.json(topic);
});

router.post('/english/vocabulary/:topicId/expand', async (req, res) => {
  try {
    const grade = parseGrade(req.body) ?? parseGrade(req.query) ?? 9;
    const { exclude = [], count = 12 } = req.body;
    const result = await expandVocabulary(req.params.topicId, grade, { exclude, count });
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/english/topics/grammar', (req, res) => {
  const grade = parseGrade(req.query) ?? 9;
  res.json({ grade, topics: getGrammarTopics(grade) });
});

router.get('/english/pronunciation/practice', (req, res) => {
  const grade = parseGrade(req.query) ?? 9;
  const unitId = req.query.unitId;
  res.json(getPronunciationPractice(grade, unitId));
});

router.post('/english/grammar/explain', async (req, res) => {
  try {
    const { topicId, level, grade } = req.body;
    const g = parseGrade({ grade }) ?? 9;
    const result = await explainGrammar(topicId, g, level);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/english/writing/check', async (req, res) => {
  try {
    const { text, level, grade } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Thiếu nội dung' });
    const g = parseGrade({ grade }) ?? 9;
    const result = await checkWriting(text, g, level);
    const userId = req.user?.id ?? null;
    if (userId && result.score !== undefined) recordEnglishSkill(userId, 'writing', result.score).catch(() => {});
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/english/pronunciation/score', async (req, res) => {
  try {
    const { expected, spoken, level, grade } = req.body;
    if (!expected || !spoken) return res.status(400).json({ error: 'Thiếu câu mẫu hoặc bản ghi' });
    const g = parseGrade({ grade }) ?? 9;
    const result = await scorePronunciation(expected, spoken, g, level);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/english/listening/generate', async (req, res) => {
  try {
    const { level, grade, topicId } = req.body;
    const g = parseGrade({ grade }) ?? 9;
    const result = await generateListening(g, topicId, level);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/english/listening/grade', (req, res) => {
  const { questions, answers } = req.body;
  if (!questions?.length) return res.status(400).json({ error: 'Thiếu câu hỏi' });
  const result = gradeListening(questions, answers || []);
  const userId = req.user?.id ?? null;
  if (userId) recordEnglishSkill(userId, 'listening', result.score).catch(() => {});
  res.json(result);
});

router.post('/english/reading/generate', async (req, res) => {
  try {
    const { level, grade } = req.body;
    const g = parseGrade({ grade }) ?? 9;
    const result = await generateReading(g, level);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/english/reading/grade', (req, res) => {
  try {
    const { questions, answers } = req.body;
    if (!questions?.length) return res.status(400).json({ error: 'Thiếu câu hỏi' });
    let correct = 0;
    const results = questions.map((q, i) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) correct++;
      return { ...q, userAnswer: answers[i], isCorrect };
    });
    const score = Math.round((correct / questions.length) * 100);
    const userId = req.user?.id ?? null;
    if (userId) recordEnglishSkill(userId, 'reading', score).catch(() => {});
    res.json({ score, correct, total: questions.length, results });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/english/chat', async (req, res) => {
  try {
    const { messages, level, role, grade, topicId, studentContext } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Thiếu tin nhắn' });
    const g = parseGrade({ grade }) ?? 9;
    const userId = req.user?.id ?? null;
    const result = await englishChat(messages, { level, role, grade: g, topicId, studentContext, userId });
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/english/leaderboard', async (_req, res) => {
  try {
    const leaderboard = await getEnglishLeaderboard(50);
    res.json({ leaderboard });
  } catch (e) {
    console.error('[leaderboard]', e);
    res.status(500).json({ error: 'Lỗi lấy bảng xếp hạng' });
  }
});

/** Sync English stats lên MongoDB (gọi khi user đăng nhập hoặc kết thúc phiên học) */
router.post('/english/stats/sync', verifyToken, async (req, res) => {
  try {
    const { xp, level, streak, wordsLearned, lastStudyDate, pronunciationScore, listeningScore, writingScore, totalStudyMinutes, weeklyProgress, skillsPracticed } = req.body;
    const result = await syncEnglishStats(req.user.id, {
      xp, level, streak, wordsLearned, lastStudyDate,
      pronunciationScore, listeningScore, writingScore,
      totalStudyMinutes, weeklyProgress, skillsPracticed,
    });
    res.json(result);
  } catch (e) {
    console.error('[english/stats/sync]', e);
    res.status(500).json({ error: 'Lỗi sync stats' });
  }
});

/** Lấy English stats của user đang login */
router.get('/english/stats/me', verifyToken, async (req, res) => {
  try {
    const stats = await getEnglishStats(req.user.id);
    if (!stats) return res.status(404).json({ error: 'Không tìm thấy stats' });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Lấy skill profile English (Graph RAG) — weak skills, strong skills */
router.get('/english/skills', verifyToken, async (req, res) => {
  try {
    const profile = await getEnglishSkillProfile(req.user.id);
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
