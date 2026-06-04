import { SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from '../prompts/system.js';
import { getDemoSolution } from '../data/demoSolutions.js';
import { extractVisualization } from '../utils/parseSolution.js';
import {
  isDemoMode,
  chatComplete,
  chatCompleteStream,
} from './hfRouter.js';

export async function generateSolution(question) {
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
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ]);

  const { solution, visualization } = extractVisualization(raw);
  return { solution, visualization, question, demo: false };
}

/**
 * Stream lời giải. Nếu có personalizedContext (Graph RAG), prepend vào system prompt.
 * @param {string} question
 * @param {string} [personalizedContext] - context cá nhân hóa từ graphRag.buildPersonalizedContext
 */
export async function* streamSolution(question, personalizedContext) {
  const systemPrompt = personalizedContext
    ? `${personalizedContext}\n\n${SYSTEM_PROMPT}`
    : SYSTEM_PROMPT;

  if (isDemoMode()) {
    const demo = getDemoSolution(question);
    for (const w of demo.solution.split(/(\s+)/)) {
      yield { token: w };
      await new Promise((r) => setTimeout(r, 15));
    }
    yield { done: true, visualization: demo.visualization };
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

export async function chatWithContext(messages, context) {
  const contextBlock = context
    ? `\n\n[Bài toán gốc]\n${context.question}\n\n[Lời giải]\n${context.solution}`
    : '';

  if (isDemoMode()) {
    const last = messages[messages.length - 1]?.content || '';
    return {
      reply: `Chế độ demo: "${last}". Thêm HUGGINGFACE_API_KEY vào Backend/.env và khởi động lại server.`,
      demo: true,
    };
  }

  const reply = await chatComplete([
    { role: 'system', content: CHAT_SYSTEM_PROMPT + contextBlock },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ], { max_tokens: 1024, temperature: 0.6 });

  return { reply: reply || 'Xin lỗi, tôi chưa trả lời được.', demo: false };
}
