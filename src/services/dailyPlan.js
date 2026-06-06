/**
 * dailyPlan.js — Daily Plan Service
 *
 * Storage: MongoDB (DailyPlan collection)
 * Fallback: file JSON nếu MongoDB chưa migrate
 *
 * Logic giữ nguyên — chỉ thay storage backend.
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import DailyPlan from '../models/DailyPlan.js';
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

async function ensurePlansDir() {
  await mkdir(PLANS_DIR, { recursive: true });
}

function planPath(sessionId, date) {
  return path.join(PLANS_DIR, `${sanitizeSessionId(sessionId)}_${date}.json`);
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

  // ── Primary: MongoDB ────────────────────────────────────────────────────────
  try {
    let plan = await DailyPlan.findOne({ studentSessionId: sessionId, date });
    if (plan) return formatPlanResponse(plan);

    // Tạo plan mới từ profile
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
      ctaRoute: '/tutor',
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

    const newPlan = new DailyPlan({
      studentSessionId: sanitizeSessionId(sessionId),
      date,
      grade: Number(grade),
      tasks: [mathTask, englishTask, reviewTask],
    });
    await newPlan.save();
    return formatPlanResponse(newPlan);
  } catch (err) {
    // Fallback: file JSON
    console.warn('[dailyPlan] MongoDB unavailable, falling back to JSON file:', err.message);
    return generateDailyPlanFromJson(sessionId, grade, preferredFormat);
  }
}

/**
 * Đánh dấu hoàn thành 1 task trong plan hôm nay
 */
export async function completeDailyTask(sessionId, taskId) {
  // ── Primary: MongoDB ──────────────────────────────────────────────────────
  try {
    const today = todayKey();
    const plan = await DailyPlan.findOne({ studentSessionId: sessionId, date: today });
    if (!plan) {
      // Plan chưa tạo → tạo mới
      return generateDailyPlan(sessionId).then((p) => p);
    }
    plan.completeTask(taskId);
    await plan.save();
    return formatPlanResponse(plan);
  } catch (err) {
    console.warn('[dailyPlan] MongoDB completeTask failed, falling back to JSON:', err.message);
    return completeDailyTaskJson(sessionId, taskId);
  }
}

// ─── File JSON Fallback ─────────────────────────────────────────────────────────

async function generateDailyPlanFromJson(sessionId, grade = 9, preferredFormat) {
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

  const plan = {
    sessionId: sanitizeSessionId(sessionId),
    date,
    grade: Number(grade),
    tasks: [
      {
        id: `math-${hashStr(sessionId + date)}`,
        type: 'math',
        title: mathTitle,
        description: weakTopic
          ? `Chủ đề em đang cần củng cố: ${weakTopic.name}`
          : 'Bắt đầu xây dựng hồ sơ học tập',
        ctaLabel: weakTopic ? 'Luyện ngay' : 'Giải bài',
        ctaRoute: '/tutor',
        ctaParams: weakTopic
          ? { mode: 'practice', topic: weakTopic.id, topicName: weakTopic.name }
          : {},
        estimatedMinutes: 15,
        completed: false,
      },
      {
        id: `english-${hashStr(sessionId + date + 'en')}`,
        type: 'english',
        title: 'Ôn 10 từ vựng hoặc nghe 3 phút',
        description: `Theo chương trình lớp ${grade}`,
        ctaLabel: 'Học Anh',
        ctaRoute: '/english',
        ctaParams: { module: 'vocab', grade },
        estimatedMinutes: 10,
        completed: false,
      },
      {
        id: `review-${hashStr(sessionId + date + 'rev')}`,
        type: 'review',
        title: 'Ôn nhanh 3 câu',
        description: 'Quiz mixed từ các bài đã giải gần đây',
        ctaLabel: 'Ôn ngay',
        ctaRoute: '/tutor',
        ctaParams: { mode: 'practice' },
        estimatedMinutes: 8,
        completed: false,
      },
    ],
  };

  await writeFile(fp, JSON.stringify(plan, null, 2), 'utf-8');
  return plan;
}

async function completeDailyTaskJson(sessionId, taskId) {
  const date = todayKey();
  await ensurePlansDir();
  const fp = planPath(sessionId, date);
  let plan;
  try {
    plan = JSON.parse(await readFile(fp, 'utf-8'));
  } catch {
    plan = await generateDailyPlanFromJson(sessionId);
  }
  const task = plan.tasks.find((t) => t.id === taskId);
  if (task) task.completed = true;
  await writeFile(fp, JSON.stringify(plan, null, 2), 'utf-8');
  return plan;
}

// ─── Format response helper ─────────────────────────────────────────────────────

function formatPlanResponse(plan) {
  return {
    sessionId: plan.studentSessionId,
    date: plan.date,
    grade: plan.grade,
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      description: t.description,
      ctaLabel: t.ctaLabel,
      ctaRoute: t.ctaRoute,
      ctaParams: t.ctaParams instanceof Map
        ? Object.fromEntries(t.ctaParams)
        : t.ctaParams,
      estimatedMinutes: t.estimatedMinutes,
      completed: t.completed,
    })),
  };
}
