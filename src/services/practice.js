import { chatComplete, isDemoMode } from './hfRouter.js';
import { getTopicLabel } from '../data/curriculum.js';
import { getFallbackQuestions } from '../data/questionBank.js';

const PRACTICE_MODEL =
  process.env.HF_PRACTICE_MODEL ||
  process.env.HF_MODEL ||
  'Qwen/Qwen2.5-7B-Instruct';

/** Trích JSON từ phản hồi AI (có thể kèm markdown) */
export function extractJsonFromText(text) {
  if (!text?.trim()) return null;

  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* thử object */
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      /* thử array */
    }
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return { questions: JSON.parse(arrayMatch[0]) };
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeQuestion(raw, index) {
  const options = Array.isArray(raw.options) ? raw.options.slice(0, 4) : [];
  while (options.length < 4) {
    options.push(`Lựa chọn ${String.fromCharCode(65 + options.length)}`);
  }

  let correct = Number(raw.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
    correct = 0;
  }

  return {
    id: raw.id ?? index + 1,
    question: String(raw.question || `Câu ${index + 1}`).trim(),
    options: options.map((o) => String(o).trim()),
    correct,
    explanation: String(raw.explanation || 'Xem lại lý thuyết chủ đề này.').trim(),
  };
}

function buildMathPrompt(grade, topicLabel, count) {
  return `Bạn là giáo viên Toán lớp ${grade} tại Việt Nam. Hãy tạo đúng ${count} câu hỏi trắc nghiệm về chủ đề "${topicLabel}" cho học sinh lớp ${grade}.

Yêu cầu:
- Mỗi câu có đúng 4 lựa chọn (không cần prefix A. B. nếu không muốn)
- Chỉ 1 đáp án đúng, trường "correct" là chỉ số 0-3
- Giải thích ngắn bằng tiếng Việt
- Độ khó phù hợp chương trình lớp ${grade}

Trả về CHỈ JSON hợp lệ, không markdown, không giải thích ngoài JSON:
{
  "questions": [
    {
      "question": "nội dung câu hỏi",
      "options": ["đáp án 1", "đáp án 2", "đáp án 3", "đáp án 4"],
      "correct": 0,
      "explanation": "giải thích"
    }
  ]
}`;
}

function buildEnglishPrompt(grade, topicLabel, count) {
  return `You are an English teacher for grade ${grade} students in Vietnam. Create exactly ${count} multiple-choice questions about "${topicLabel}".

Requirements:
- 4 options per question, field "correct" is index 0-3
- Mix Vietnamese instructions in explanations when helpful for learners
- Appropriate difficulty for grade ${grade}

Return ONLY valid JSON, no markdown:
{
  "questions": [
    {
      "question": "question text in English",
      "options": ["opt1", "opt2", "opt3", "opt4"],
      "correct": 0,
      "explanation": "short explanation (can include Vietnamese)"
    }
  ]
}`;
}

/**
 * Sinh đề luyện tập — AI hoặc fallback
 */
export async function generatePracticeQuestions({
  grade,
  subject,
  topic,
  numberOfQuestions = 5,
  lastScore,
}) {
  const count = Math.min(Math.max(Number(numberOfQuestions) || 5, 1), 10);
  const topicLabel = getTopicLabel(subject, grade, topic);

  let difficultyHint = '';
  if (lastScore != null) {
    if (lastScore >= 80) difficultyHint = ' Tăng độ khó so với lần trước (học sinh đạt >=80%).';
    else if (lastScore < 50) difficultyHint = ' Giảm độ khó, tập trung nền tảng (học sinh <50%).';
  }

  if (isDemoMode()) {
    const questions = getFallbackQuestions(subject, grade, topic, count);
    return { questions, source: 'fallback', demo: true };
  }

  const prompt =
    subject === 'english'
      ? buildEnglishPrompt(grade, topicLabel, count) + difficultyHint
      : buildMathPrompt(grade, topicLabel, count) + difficultyHint;

  try {
    const raw = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You output only valid JSON. No prose before or after the JSON object.',
        },
        { role: 'user', content: prompt },
      ],
      {
        model: PRACTICE_MODEL,
        max_tokens: 4096,
        temperature: 0.75,
      }
    );

    const parsed = extractJsonFromText(raw);
    const list = parsed?.questions;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('AI không trả về danh sách câu hỏi hợp lệ');
    }

    const questions = list
      .slice(0, count)
      .map((q, i) => normalizeQuestion(q, i));

    while (questions.length < count) {
      const extra = getFallbackQuestions(subject, grade, topic, count - questions.length);
      questions.push(...extra.map((q, i) => normalizeQuestion(q, questions.length + i)));
    }

    return { questions: questions.slice(0, count), source: 'ai', demo: false };
  } catch (err) {
    console.warn('[practice] AI lỗi, dùng fallback:', err.message);
    const questions = getFallbackQuestions(subject, grade, topic, count);
    return {
      questions,
      source: 'fallback',
      demo: false,
      warning: 'Không kết nối được AI, đang dùng câu hỏi mẫu.',
    };
  }
}
