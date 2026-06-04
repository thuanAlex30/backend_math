import { Router } from 'express';
import { synthesizeSpeech } from '../services/tts.js';
import { VI_VOICES, EN_VOICES } from '../services/edgeTts.js';

const router = Router();

router.get('/tts/voices', (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'vi';
  res.json({ voices: lang === 'en' ? EN_VOICES : VI_VOICES, lang });
});

router.post('/tts', async (req, res) => {
  try {
    const { text, speed = 1, voice = 'female', lang = 'vi' } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: 'Thiếu nội dung đọc' });
    }
    const result = await synthesizeSpeech(text, Number(speed), voice, lang);
    res.json(result);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Lỗi tổng hợp giọng nói' });
  }
});

export default router;
