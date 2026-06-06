import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import solveRoutes from './src/routes/solve.js';
import chatRoutes from './src/routes/chat.js';
import ttsRoutes from './src/routes/tts.js';
import englishRoutes from './src/routes/english.js';
import practiceRoutes from './src/routes/practice.js';
import profileRoutes from './src/routes/profile.js';
import leaderboardRoutes from './src/routes/leaderboard.js';
import examRoutes from './src/routes/exam.js';
import mathWritingRoutes from './src/routes/mathWriting.js';
import authRoutes from './src/routes/auth.js';
import notificationRoutes from './src/routes/notifications.js';
import socialRoutes from './src/routes/social.js';
import { isDemoMode } from './src/services/hfRouter.js';
import { ensureProfilesDir } from './src/services/graphRag.js';
import { connectDatabase } from './src/config/database.js';
import { configurePassport } from './src/config/passport.js';

dotenv.config({ override: true });

await connectDatabase();
await ensureProfilesDir();

configurePassport();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_PRODUCTION = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

// Render chạy sau reverse proxy — cần trust proxy để express-rate-limit đọc IP thật
app.set('trust proxy', 1);

app.use(
  cors({
    origin: IS_PRODUCTION
      ? process.env.ALLOWED_ORIGIN || process.env.FRONTEND_URL
      : FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
app.use(passport.initialize());

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

app.use('/api', authRoutes);
app.use('/api', solveRoutes);
app.use('/api', chatRoutes);
app.use('/api', ttsRoutes);
app.use('/api', englishRoutes);
app.use('/api', practiceRoutes);
app.use('/api', profileRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api', examRoutes);
app.use('/api', mathWritingRoutes);
app.use('/api', notificationRoutes);
app.use('/api/social', socialRoutes);

// Serve static frontend (SPA) — cùng domain với API, tránh CORS & cookie cross-origin
const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const HAS_DIST = await checkDistExists();

async function checkDistExists() {
  try {
    await import('fs').then(fs => fs.promises.access(path.join(DIST_DIR, 'index.html')));
    return true;
  } catch {
    return false;
  }
}

if (HAS_DIST) {
  app.use(express.static(DIST_DIR));
}

// SPA fallback — chỉ khi có dist, mọi route không match API đều trả về index.html
if (HAS_DIST) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  const demo = isDemoMode();
  console.log(`MathMaster API: http://localhost:${PORT}`);
  console.log(
    demo
      ? '⚠️  DEMO MODE — chưa có API key hợp lệ'
      : `✅ AI: ${process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct'}`
  );
});
