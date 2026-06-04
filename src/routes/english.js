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
} from '../services/english.js';
import { LEADERBOARD_MOCK } from '../data/englishData.js';
import { isValidEnglishGrade } from '../data/englishCurriculum.js';

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
  res.json(getPronunciationPractice(grade));
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
  res.json(gradeListening(questions, answers || []));
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

router.post('/english/chat', async (req, res) => {
  try {
    const { messages, level, role, grade, topicId } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Thiếu tin nhắn' });
    const g = parseGrade({ grade }) ?? 9;
    const result = await englishChat(messages, { level, role, grade: g, topicId });
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/english/leaderboard', (_req, res) => {
  res.json({ leaderboard: LEADERBOARD_MOCK });
});

export default router;
