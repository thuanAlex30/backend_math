import {
  SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  CHAT_PERSONAS,
  resolveSystemPrompt,
  buildStudentContextPrompt,
} from '../prompts/system.js';
import { getDemoSolution } from '../data/demoSolutions.js';
import { extractVisualization } from '../utils/parseSolution.js';
import {
  isDemoMode,
  chatComplete,
  chatCompleteStream,
} from './hfRouter.js';

export async function generateSolution(question, options = {}) {
  const { personalizedContext, ...restOptions } = options;
  let systemPrompt = resolveSystemPrompt(restOptions);
  if (personalizedContext) {
    systemPrompt = `${personalizedContext}\n\n${systemPrompt}`;
  }

  if (isDemoMode()) {
    const demo = getDemoSolution(question);
    return {
      solution: demo.solution,
      visualization: demo.visualization,
      question,
      demo: true,
    };
  }

  const raw = await chatComplete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ]);

  const { solution, visualization } = extractVisualization(raw);
  return { solution, visualization, question, demo: false };
}

/**
 * Stream lời giải.
 * @param {string} question
 * @param {string} [personalizedContext] - Graph RAG context
 * @param {object} [options] - mode, compact, studentContext
 */
export async function* streamSolution(question, personalizedContext, options = {}) {
  let systemPrompt = resolveSystemPrompt(options);
  if (personalizedContext) {
    systemPrompt = `${personalizedContext}\n\n${systemPrompt}`;
  }

  if (isDemoMode()) {
    const demo = getDemoSolution(question);
    const text = options.mode === 'hint'
      ? `**Phân tích đề:**\n${question.slice(0, 80)}...\n\n**Câu hỏi gợi mở:**\nEm nghĩ ta cần áp dụng công thức nào?\n\n**Gợi ý công thức:**\nHãy thử liên hệ kiến thức đã học.\n\n**Em thử bước nào?**\nBấm **Xem lời giải đầy đủ** nếu em cần.`
      : demo.solution;
    for (const w of text.split(/(\s+)/)) {
      yield { token: w };
      await new Promise((r) => setTimeout(r, 15));
    }
    yield { done: true, visualization: options.mode === 'hint' ? null : demo.visualization };
    return;
  }

  let fullText = '';
  for await (const token of chatCompleteStream([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ])) {
    fullText += token;
    yield { token };
  }
  const { solution, visualization } = extractVisualization(fullText);
  yield { done: true, solution, visualization };
}

export async function chatWithContext(messages, context, options = {}) {
  const contextBlock = context
    ? `\n\n[Bài toán gốc]\n${context.question}\n\n[Lời giải]\n${context.solution}`
    : '';

  const persona = CHAT_PERSONAS[options.tutorPersona] || CHAT_PERSONAS.teacher;
  const studentBlock = buildStudentContextPrompt(options.studentContext);
  const gradeNote = options.grade
    ? `\nHọc sinh lớp ${options.grade}.`
    : '';

  if (isDemoMode()) {
    const last = messages[messages.length - 1]?.content || '';
    return {
      reply: `Chế độ demo: "${last}". Thêm HUGGINGFACE_API_KEY vào Backend/.env và khởi động lại server.`,
      demo: true,
    };
  }

  const systemContent = [
    studentBlock,
    CHAT_SYSTEM_PROMPT,
    persona,
    gradeNote,
    contextBlock,
  ]
    .filter(Boolean)
    .join('\n');

  const reply = await chatComplete(
    [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    { max_tokens: 1024, temperature: 0.6 }
  );

  return { reply: reply || 'Xin lỗi, tôi chưa trả lời được.', demo: false };
}

export { SYSTEM_PROMPT };
