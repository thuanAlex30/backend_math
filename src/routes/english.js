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
import { getEnglishLeaderboard as getCachedLeaderboard } from '../services/leaderboardCache.js';
import { isValidEnglishGrade } from '../data/englishCurriculum.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { chatComplete, isDemoMode, chatCompleteStream } from '../services/hfRouter.js';
import { ENGLISH_TUTOR_PROMPT } from '../prompts/english.js';

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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
  }
});

router.post('/english/listening/generate', async (req, res) => {
  try {
    const { level, grade, topicId } = req.body;
    const g = parseGrade({ grade }) ?? 9;
    const result = await generateListening(g, topicId, level);
    res.json(result);
  } catch (e) {
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
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
    const status = e.message.includes('timeout') ? 504 : 502;
    res.status(status).json({ error: e.message });
  }
});

router.get('/english/leaderboard', async (_req, res) => {
  try {
    const leaderboard = await getCachedLeaderboard(50);
    res.json({ leaderboard });
  } catch (e) {
    console.error('[leaderboard]', e);
    res.status(500).json({ error: 'Lỗi lấy bảng xếp hạng' });
  }
});

/** Sync English stats lên MongoDB (gọi khi user đăng nhập hoặc kết thúc phiên học) */
router.post('/english/stats/sync', verifyToken, async (req, res) => {
  try {
    const { xp, level, streak, wordsLearned, lastStudyDate,
      pronunciationScore, listeningScore, writingScore,
      readingScore, grammarScore, chatScore,
      totalStudyMinutes, weeklyProgress, skillsPracticed } = req.body;
    const result = await syncEnglishStats(req.user.id, {
      xp, level, streak, wordsLearned, lastStudyDate,
      pronunciationScore, listeningScore, writingScore,
      readingScore, grammarScore, chatScore,
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

/** Grammar explain — SSE streaming (dùng cho UX typewriting effect) */
router.post('/english/grammar/explain-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const { topicId, level, grade } = req.body;
    const g = parseGrade({ grade }) ?? 9;

    if (isDemoMode()) {
      const demoText = `[Demo] Đang giải thích ngữ pháp cho chủ đề: ${topicId}\n\nTrong chế độ demo, vui lòng thêm HUGGINGFACE_API_KEY để xem giải thích chi tiết.`;
      for (const chunk of chunkText(demoText, 20)) {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
        await sleep(50);
      }
      res.write(`data: ${JSON.stringify({ done: true, topicId })}\n\n`);
      return res.end();
    }

    // Gọi AI với streaming
    const messages = [
      { role: 'system', content: ENGLISH_TUTOR_PROMPT },
      {
        role: 'user',
        content: `Hãy giải thích chi tiết chủ đề ngữ pháp: ${topicId}. Giới hạn 300 từ. Trình bày rõ ràng, có ví dụ minh họa.`,
      },
    ];

    for await (const chunk of chatCompleteStream(messages, { max_tokens: 800 })) {
      if (chunk.token && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ token: chunk.token })}\n\n`);
      }
    }

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true, topicId })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error('[grammar/explain-stream]', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Lỗi streaming' })}\n\n`);
      res.end();
    }
  }
});

/** Reading passage — SSE streaming */
router.post('/english/reading/generate-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const { level, grade } = req.body;
    const g = parseGrade({ grade }) ?? 9;

    if (isDemoMode()) {
      const demoText = `[Demo] Đang tạo bài đọc cho lớp ${g}...\n\nThêm HUGGINGFACE_API_KEY để tạo bài đọc thực sự.`;
      for (const chunk of chunkText(demoText, 25)) {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
        await sleep(60);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    const messages = [
      { role: 'system', content: ENGLISH_TUTOR_PROMPT },
      {
        role: 'user',
        content: `Tạo bài đọc tiếng Anh khoảng 200 từ cho học sinh lớp ${g}. Kèm 3 câu hỏi comprehension (trả lời ngắn). Trả lời JSON: { passage, questions: [{question, answer}] }.`,
      },
    ];

    let fullText = '';
    for await (const chunk of chatCompleteStream(messages, { max_tokens: 1000 })) {
      if (chunk.token && !res.writableEnded) {
        fullText += chunk.token;
        res.write(`data: ${JSON.stringify({ token: chunk.token })}\n\n`);
      }
    }

    if (!res.writableEnded) {
      // Parse JSON từ fullText
      let passage = '';
      let questions = [];
      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          passage = parsed.passage || fullText;
          questions = parsed.questions || [];
        } else {
          passage = fullText;
        }
      } catch {
        passage = fullText;
      }
      res.write(`data: ${JSON.stringify({ done: true, passage, questions })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error('[reading/generate-stream]', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Lỗi tạo bài đọc' })}\n\n`);
      res.end();
    }
  }
});

// Helper functions cho SSE
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function* chunkText(text, size) {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}

export default router;
