/**
 * Question of the Day (QotD) Service
 * Lưu câu hỏi + submission vào MongoDB
 */
import { QotdQuestion, QotdSubmission } from '../models/Qotd.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

/** Lấy câu hỏi hôm nay — ưu tiên MongoDB, fallback demo */
async function getTodayQuestion() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const existing = await QotdQuestion.findOne({ dateString: today });
    if (existing) return existing.toObject();

    // Tạo mới bằng AI hoặc fallback
    const q = await generateDailyQuestion(today);
    await QotdQuestion.create(q);
    return q;
  } catch (err) {
    console.error('[qotd] getTodayQuestion error:', err.message);
    return getFallbackQuestion(today);
  }
}

/** Sinh câu hỏi bằng AI hoặc fallback demo */
async function generateDailyQuestion(dateString) {
  const grade = 9;
  const topics = ['phương trình bậc hai', 'xác suất', 'hàm số', 'lượng giác', 'tích phân'];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const doc = {
    dateString,
    problem: `Hôm nay thử sức với bài ${topic} nhé! Tìm hiểu thêm bằng cách giải các bài tập trong mục Toán.`,
    difficulty: 'medium',
    topic,
    solution: 'Hãy thử giải và kiểm tra đáp án với Gia sư AI!',
    explanation: 'Câu hỏi mỗi ngày giúp bạn ôn tập đều đặn.',
    grade,
  };
  return doc;
}

function getFallbackQuestion(dateString) {
  return {
    dateString,
    problem: 'Giá trị tuyệt đối của −7 là bao nhiêu?',
    difficulty: 'easy',
    topic: 'số học',
    solution: '7',
    explanation: 'Giá trị tuyệt đối của số âm là số đối của nó.',
    grade: 6,
  };
}

async function submitQotDAnswer(userId, questionDate, answer, timeSeconds) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const existing = await QotdSubmission.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    dateString: questionDate,
  });
  if (existing) throw new Error('Bạn đã trả lời hôm nay rồi!');

  const q = await getTodayQuestion();
  const isCorrect = String(answer).trim().toLowerCase() === String(q.solution).trim().toLowerCase();
  const points = isCorrect
    ? Math.max(0, Math.round(50 * (1 - Math.min(timeSeconds || 0, 300) / 300)) + 50)
    : 0;

  await QotdSubmission.create({
    userId,
    dateString: questionDate,
    answer: String(answer),
    isCorrect,
    timeSeconds: timeSeconds ?? null,
    points,
  });

  if (isCorrect) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const yesterdayCorrect = await QotdSubmission.findOne({
      userId,
      dateString: yStr,
      isCorrect: true,
    });

    const currentStreak = yesterdayCorrect ? (user.qotdStats?.streak || 0) + 1 : 1;
    const totalPoints = (user.qotdStats?.totalPoints || 0) + points;

    await User.findByIdAndUpdate(userId, {
      'qotdStats.streak': currentStreak,
      'qotdStats.correctCount': (user.qotdStats?.correctCount || 0) + 1,
      'qotdStats.totalPoints': totalPoints,
      'qotdStats.lastSubmissionDate': questionDate,
    });
  }

  return {
    isCorrect,
    explanation: q.explanation,
    correctAnswer: q.solution,
    points,
  };
}

async function getQotDLeaderboard(limit = 50) {
  const today = new Date().toISOString().split('T')[0];

  const users = await User.find({ 'qotdStats.streak': { $gt: 0 } })
    .sort({ 'qotdStats.streak': -1, 'qotdStats.totalPoints': -1 })
    .limit(limit)
    .select('name avatar grade qotdStats qotdSubmissions')
    .lean();

  return {
    dateString: today,
    leaderboard: users.map((u) => {
      const todaySub = (u.qotdSubmissions || []).find((s) => s.dateString === today);
      return {
        userId: u._id.toString(),
        name: u.name || 'Học sinh ẩn danh',
        avatar: u.avatar,
        grade: u.grade,
        todayCorrect: todaySub?.isCorrect ?? false,
        todayTime: todaySub?.timeSeconds ?? undefined,
        todayPoints: todaySub?.points ?? 0,
        totalStreak: u.qotdStats?.streak || 0,
        totalCorrect: u.qotdStats?.correctCount || 0,
        totalPoints: u.qotdStats?.totalPoints || 0,
      };
    }),
  };
}

async function getUserQotDStats(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const stats = user.qotdStats || { correctCount: 0, streak: 0, totalPoints: 0, lastSubmissionDate: null };
  const submissions = user.qotdSubmissions || [];

  // Build last7Days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const sub = submissions.find((s: any) => s.dateString === ds);
    last7Days.push({
      date: ds,
      correct: sub?.isCorrect ?? false,
      points: sub?.points ?? 0,
    });
  }

  return {
    ...stats,
    totalSubmissions: submissions.length,
    successRate: submissions.length > 0
      ? ((stats.correctCount / submissions.length) * 100).toFixed(1)
      : '0',
    last7Days,
  };
}

export {
  getTodayQuestion,
  generateDailyQuestion,
  submitQotDAnswer,
  getQotDLeaderboard,
  getUserQotDStats,
};
