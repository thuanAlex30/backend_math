import { Router } from 'express';
import { chatWithContext } from '../services/huggingface.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages?.length) {
      return res.status(400).json({ error: 'Thiếu tin nhắn' });
    }
    const result = await chatWithContext(messages, context);
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(502).json({ error: error.message || 'Không thể trả lời chat' });
  }
});

export default router;
