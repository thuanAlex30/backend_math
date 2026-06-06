import { Router } from 'express';
import { generateSolution, streamSolution } from '../services/huggingface.js';
import { extractTextFromImage } from '../services/ocr.js';
import { parseSteps, extractVisualization } from '../utils/parseSolution.js';
import { isDemoMode } from '../services/hfRouter.js';
import {
  buildPersonalizedContext,
  classifyTopic,
  updateStudentProfile,
} from '../services/graphRag.js';

const router = Router();

router.post('/solve', async (req, res) => {
  try {
    let { question, image, grade, mode, studentContext, compact, studentSessionId } = req.body;

    if (image && !question?.trim()) {
      question = await extractTextFromImage(image);
    } else if (image && question?.trim()) {
      const ocrText = await extractTextFromImage(image);
      question = `${question}\n\n[Nội dung từ ảnh OCR]\n${ocrText}`;
    }

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập đề bài hoặc tải ảnh' });
    }

    // Graph RAG: xây context cá nhân hóa
    const topicId = studentSessionId ? await classifyTopic(question) : null;
    const personalizedContext = studentSessionId
      ? await buildPersonalizedContext(studentSessionId, question)
      : '';

    const result = await generateSolution(question, {
      mode: mode || 'full',
      grade,
      studentContext,
      compact: compact === true,
      personalizedContext,
    });
    const steps = parseSteps(result.solution);

    // Cập nhật profile sau khi solve xong
    if (studentSessionId && topicId && mode !== 'hint') {
      try {
        await updateStudentProfile(studentSessionId, topicId, false);
      } catch {}
    }

    res.json({ ...result, steps, topicId });
  } catch (error) {
    console.error('Solve error:', error.message);
    res.status(502).json({
      error: error.message || 'Không kết nối được Hugging Face',
      hint: 'Kiểm tra HUGGINGFACE_API_KEY và khởi động lại Backend (npm run dev)',
      demo: isDemoMode(),
    });
  }
});

router.post('/solve-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    let {
      question,
      image,
      studentSessionId,
      grade,
      mode = 'full',
      studentContext,
      compact,
      skipProfileUpdate,
      profileCorrect,
    } = req.body;

    if (image) {
      const ocrText = await extractTextFromImage(image);
      question = question?.trim()
        ? `${question}\n\n[OCR]\n${ocrText}`
        : ocrText;
    }

    if (!question?.trim()) {
      res.write(`data: ${JSON.stringify({ error: 'Thiếu đề bài' })}\n\n`);
      return res.end();
    }

    const topicId = await classifyTopic(question);
    const personalizedContext = studentSessionId
      ? await buildPersonalizedContext(studentSessionId, question)
      : '';

    const streamOptions = {
      mode: mode === 'hint' ? 'hint' : 'full',
      grade,
      studentContext,
      compact: compact === true,
    };

    let fullText = '';
    for await (const chunk of streamSolution(question, personalizedContext, streamOptions)) {
      if (chunk.token) {
        fullText += chunk.token;
        res.write(`data: ${JSON.stringify({ token: chunk.token })}\n\n`);
      }
      if (chunk.done) {
        const parsed = chunk.solution
          ? { solution: chunk.solution, visualization: chunk.visualization }
          : extractVisualization(fullText);
        const steps = parseSteps(parsed.solution);
        res.write(
          `data: ${JSON.stringify({
            done: true,
            solution: parsed.solution,
            visualization: parsed.visualization,
            steps,
            question,
            topicId,
            mode: streamOptions.mode,
            demo: isDemoMode(),
          })}\n\n`
        );

        // Cập nhật profile theo mode
        if (studentSessionId && topicId && !skipProfileUpdate) {
          try {
            if (profileCorrect === true) {
              await updateStudentProfile(studentSessionId, topicId, true);
            } else if (mode !== 'hint') {
              await updateStudentProfile(studentSessionId, topicId, false);
            }
          } catch (profileErr) {
            console.warn('Graph RAG profile update failed:', profileErr.message);
          }
        }
      }
    }
    res.end();
  } catch (error) {
    console.error('Stream error:', error.message);
    res.write(
      `data: ${JSON.stringify({
        error: error.message || 'Lỗi kết nối AI',
        hint: 'Kiểm tra API key tại https://huggingface.co/settings/tokens',
      })}\n\n`
    );
    res.end();
  }
});

export default router;
