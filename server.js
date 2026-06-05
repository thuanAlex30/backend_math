import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import solveRoutes from './src/routes/solve.js';
import chatRoutes from './src/routes/chat.js';
import ttsRoutes from './src/routes/tts.js';
import englishRoutes from './src/routes/english.js';
import practiceRoutes from './src/routes/practice.js';
import profileRoutes from './src/routes/profile.js';
import leaderboardRoutes from './src/routes/leaderboard.js';
import examRoutes from './src/routes/exam.js';
import mathWritingRoutes from './src/routes/mathWriting.js';
import { isDemoMode } from './src/services/hfRouter.js';
import { ensureProfilesDir } from './src/services/graphRag.js';

dotenv.config({ override: true });

// Đảm bảo thư mục lưu profile Graph RAG tồn tại
await ensureProfilesDir();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '15mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
});
app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  const demo = isDemoMode();
  res.json({
    ok: true,
    model: process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
    router: process.env.HF_ROUTER_URL || 'https://router.huggingface.co/v1',
    demo,
    aiConnected: !demo,
    message: demo
      ? 'Chế độ demo — thêm HUGGINGFACE_API_KEY vào .env'
      : 'Đã kết nối Hugging Face Router',
  });
});

app.use('/api', solveRoutes);
app.use('/api', chatRoutes);
app.use('/api', ttsRoutes);
app.use('/api', englishRoutes);
app.use('/api', practiceRoutes);
app.use('/api', profileRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api', examRoutes);
app.use('/api', mathWritingRoutes);

app.listen(PORT, () => {
  const demo = isDemoMode();
  console.log(`MathMaster API: http://localhost:${PORT}`);
  console.log(
    demo
      ? '⚠️  DEMO MODE — chưa có API key hợp lệ'
      : `✅ AI: ${process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct'}`
  );
});
