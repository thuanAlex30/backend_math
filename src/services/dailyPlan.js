import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getStudentProfile,
  getWeakTopics,
  sanitizeSessionId,
} from './graphRag.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLANS_DIR = path.join(__dirname, '../../data/daily-plans');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function planPath(sessionId, date) {
  return path.join(PLANS_DIR, `${sanitizeSessionId(sessionId)}_${date}.json`);
}

async function ensurePlansDir() {
  await mkdir(PLANS_DIR, { recursive: true });
}

/** Hash đơn giản cho task id deterministic */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/**
 * Sinh 3 việc/ngày từ profile Graph RAG.
 * preferredFormat: 'tts' | 'graph' | 'read' | 'chat' — ưu tiên loại task Toán
 */
export async function generateDailyPlan(sessionId, grade = 9, preferredFormat) {
  const date = todayKey();
  await ensurePlansDir();
  const fp = planPath(sessionId, date);

  try {
    const cached = await readFile(fp, 'utf-8');
    return JSON.parse(cached);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const profile = (await getStudentProfile(sessionId)) || { topics: {} };
  const weak = getWeakTopics(profile);
  const weakTopic = weak[0];

  const mathTitle = weakTopic
    ? preferredFormat === 'tts'
      ? `Nghe 1 bài mẫu ${weakTopic.name}`
      : `Luyện 5 câu ${weakTopic.name}`
    : 'Giải 1 bài Toán mẫu';

  const mathTask = {
    id: `math-${hashStr(sessionId + date)}`,
    type: 'math',
    title: mathTitle,
    description: weakTopic
      ? `Chủ đề em đang cần củng cố: ${weakTopic.name}`
      : 'Bắt đầu xây dựng hồ sơ học tập',
    ctaLabel: weakTopic ? 'Luyện ngay' : 'Giải bài',
    ctaRoute: weakTopic ? '/tutor' : '/tutor',
    ctaParams: weakTopic
      ? { mode: 'practice', topic: weakTopic.id, topicName: weakTopic.name }
      : {},
    estimatedMinutes: 15,
    completed: false,
  };

  const englishTask = {
    id: `english-${hashStr(sessionId + date + 'en')}`,
    type: 'english',
    title: 'Ôn 10 từ vựng hoặc nghe 3 phút',
    description: `Theo chương trình lớp ${grade}`,
    ctaLabel: 'Học Anh',
    ctaRoute: '/english',
    ctaParams: { module: 'vocab', grade },
    estimatedMinutes: 10,
    completed: false,
  };

  const reviewTask = {
    id: `review-${hashStr(sessionId + date + 'rev')}`,
    type: 'review',
    title: 'Ôn nhanh 3 câu',
    description: 'Quiz mixed từ các bài đã giải gần đây',
    ctaLabel: 'Ôn ngay',
    ctaRoute: '/tutor',
    ctaParams: { mode: 'practice' },
    estimatedMinutes: 8,
    completed: false,
  };

  const plan = {
    sessionId: sanitizeSessionId(sessionId),
    date,
    grade: Number(grade),
    tasks: [mathTask, englishTask, reviewTask],
  };

  await writeFile(fp, JSON.stringify(plan, null, 2), 'utf-8');
  return plan;
}

/** Đánh dấu hoàn thành 1 task trong plan hôm nay */
export async function completeDailyTask(sessionId, taskId) {
  const date = todayKey();
  await ensurePlansDir();
  const fp = planPath(sessionId, date);
  let plan;
  try {
    plan = JSON.parse(await readFile(fp, 'utf-8'));
  } catch {
    plan = await generateDailyPlan(sessionId);
  }
  const task = plan.tasks.find((t) => t.id === taskId);
  if (task) task.completed = true;
  await writeFile(fp, JSON.stringify(plan, null, 2), 'utf-8');
  return plan;
}
