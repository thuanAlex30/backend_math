import { Router } from 'express';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEADERBOARD_DIR = path.join(__dirname, '../../data/leaderboards');

async function ensureDir() {
  await mkdir(LEADERBOARD_DIR, { recursive: true });
}

function classFile(code) {
  const safe = String(code).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  return path.join(LEADERBOARD_DIR, `${safe}.json`);
}

function weekKey() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return start.toISOString().slice(0, 10);
}

const router = Router();

router.post('/leaderboard/class/join', async (req, res) => {
  try {
    const { classCode, displayName, xp = 0, mathPoints = 0 } = req.body || {};
    if (!classCode || !displayName) {
      return res.status(400).json({ error: 'Cần mã lớp và tên hiển thị' });
    }
    await ensureDir();
    const fp = classFile(classCode);
    let data = { classCode: classCode.toUpperCase(), week: weekKey(), entries: [] };
    try {
      const raw = await readFile(fp, 'utf-8');
      data = JSON.parse(raw);
      if (data.week !== weekKey()) {
        data = { classCode: classCode.toUpperCase(), week: weekKey(), entries: [] };
      }
    } catch {
      /* file mới */
    }

    const id = `${displayName}-${Date.now()}`.slice(0, 32);
    const existing = data.entries.find((e) => e.displayName === displayName);
    if (existing) {
      existing.xp = Math.max(existing.xp, xp);
      existing.mathPoints = Math.max(existing.mathPoints, mathPoints);
    } else {
      data.entries.push({
        id,
        displayName: String(displayName).slice(0, 24),
        xp: Number(xp) || 0,
        mathPoints: Number(mathPoints) || 0,
        joinedAt: new Date().toISOString(),
      });
    }

    data.entries.sort((a, b) => b.xp + b.mathPoints - (a.xp + a.mathPoints));
    await writeFile(fp, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ ok: true, classCode: data.classCode });
  } catch (err) {
    console.error('[leaderboard/join]', err);
    res.status(500).json({ error: 'Không tham gia được bảng xếp hạng' });
  }
});

router.get('/leaderboard/class/:code', async (req, res) => {
  try {
    await ensureDir();
    const fp = classFile(req.params.code);
    let data = { classCode: req.params.code.toUpperCase(), week: weekKey(), entries: [] };
    try {
      data = JSON.parse(await readFile(fp, 'utf-8'));
      if (data.week !== weekKey()) {
        data.entries = [];
        data.week = weekKey();
      }
    } catch {
      /* chưa có dữ liệu */
    }
    const top = data.entries.slice(0, 20).map((e, i) => ({
      rank: i + 1,
      name: e.displayName,
      xp: e.xp,
      mathPoints: e.mathPoints,
    }));
    res.json({ classCode: data.classCode, week: data.week, entries: top });
  } catch (err) {
    console.error('[leaderboard/get]', err);
    res.status(500).json({ error: 'Không tải được bảng xếp hạng' });
  }
});

export default router;
