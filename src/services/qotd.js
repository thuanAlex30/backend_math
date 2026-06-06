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

  const questionBank = [
    // Phương trình bậc hai
    {
      problem: 'Nghiệm của phương trình x² − 5x + 6 = 0 là?',
      solution: 'x = 2 hoặc x = 3',
      explanation: 'x² − 5x + 6 = (x−2)(x−3) = 0 ⇒ x = 2 hoặc x = 3.',
      topic: 'phương trình bậc hai',
      difficulty: 'easy',
    },
    {
      problem: 'Biệt thức Δ của phương trình x² + 2x + 1 = 0 bằng bao nhiêu?',
      solution: '0',
      explanation: 'Δ = b² − 4ac = 4 − 4 = 0. Khi Δ = 0, phương trình có nghiệm kép.',
      topic: 'phương trình bậc hai',
      difficulty: 'easy',
    },
    {
      problem: 'Phương trình x² + x + 1 = 0 có nghiệm thực không?',
      solution: 'Không',
      explanation: 'Δ = 1 − 4 = −3 < 0 ⇒ phương trình vô nghiệm thực.',
      topic: 'phương trình bậc hai',
      difficulty: 'medium',
    },
    {
      problem: 'Tổng và tích hai nghiệm của x² − 7x + 10 = 0 theo Viète lần lượt là?',
      solution: '7 và 10',
      explanation: 'x₁ + x₂ = −b/a = 7, x₁·x₂ = c/a = 10.',
      topic: 'phương trình bậc hai',
      difficulty: 'medium',
    },
    // Xác suất
    {
      problem: 'Gieo một đồng xu cân đối. Xác suất ra mặt ngửa là?',
      solution: '1/2',
      explanation: 'Có 2 trường hợp (sấp/ngửa), 1 trường hợp ngửa ⇒ P = 1/2.',
      topic: 'xác suất',
      difficulty: 'easy',
    },
    {
      problem: 'Gieo 2 đồng xu cân đối. Xác suất cả 2 đều ngửa là?',
      solution: '1/4',
      explanation: 'Có 4 trường hợp (SS, SN, NS, NN), 1 trường hợp NN ⇒ P = 1/4.',
      topic: 'xác suất',
      difficulty: 'easy',
    },
    {
      problem: 'Một hộp có 3 bi đỏ và 2 bi xanh. Lấy ngẫu nhiên 1 bi. Xác suất lấy bi đỏ là?',
      solution: '3/5',
      explanation: 'P(đỏ) = 3/(3+2) = 3/5.',
      topic: 'xác suất',
      difficulty: 'easy',
    },
    // Hàm số
    {
      problem: 'Hệ số góc của đường thẳng y = 2x − 1 là?',
      solution: '2',
      explanation: 'Dạng y = kx + b ⇒ hệ số góc k = 2.',
      topic: 'hàm số',
      difficulty: 'easy',
    },
    {
      problem: 'Hàm số y = −x + 3 đồng biến hay nghịch biến trên R?',
      solution: 'Nghịch biến',
      explanation: 'Hệ số a = −1 < 0 ⇒ hàm nghịch biến trên R.',
      topic: 'hàm số',
      difficulty: 'easy',
    },
    {
      problem: 'Đỉnh của parabol y = x² − 4x + 3 có tọa độ là?',
      solution: '(2; −1)',
      explanation: 'x₀ = −b/(2a) = 4/2 = 2, y₀ = 4 − 8 + 3 = −1.',
      topic: 'hàm số',
      difficulty: 'medium',
    },
    // Lượng giác
    {
      problem: 'sin 30° bằng bao nhiêu?',
      solution: '1/2',
      explanation: 'sin 30° = 1/2 (giá trị lượng giác cơ bản).',
      topic: 'lượng giác',
      difficulty: 'easy',
    },
    {
      problem: 'cot(90°) bằng bao nhiêu?',
      solution: '0',
      explanation: 'cot 90° = cos 90° / sin 90° = 0/1 = 0.',
      topic: 'lượng giác',
      difficulty: 'easy',
    },
    {
      problem: 'sin²x + cos²x bằng bao nhiêu (với mọi x)?',
      solution: '1',
      explanation: 'Đẳng thức lượng giác cơ bản: sin²x + cos²x = 1.',
      topic: 'lượng giác',
      difficulty: 'easy',
    },
    // Tích phân
    {
      problem: 'Nguyên hàm của f(x) = 2x là?',
      solution: 'x² + C',
      explanation: '∫2x dx = x² + C (vì (x²)\' = 2x).',
      topic: 'tích phân',
      difficulty: 'easy',
    },
    {
      problem: 'Giá trị của ∫₀¹ x dx bằng bao nhiêu?',
      solution: '1/2',
      explanation: '∫₀¹ x dx = [x²/2]₀¹ = 1/2 − 0 = 1/2.',
      topic: 'tích phân',
      difficulty: 'easy',
    },
    {
      problem: 'Nguyên hàm của cos x là?',
      solution: 'sin x + C',
      explanation: '∫cos x dx = sin x + C (vì (sin x)\' = cos x).',
      topic: 'tích phân',
      difficulty: 'easy',
    },
  ];

  const q = questionBank[Math.floor(Math.random() * questionBank.length)];

  const doc = {
    dateString,
    problem: q.problem,
    difficulty: q.difficulty,
    topic: q.topic,
    solution: q.solution,
    explanation: q.explanation,
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
    const sub = submissions.find((s) => s.dateString === ds);
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
