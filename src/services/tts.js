import { HfInference } from '@huggingface/inference';
import { synthesizeEdgeSpeech, VI_VOICES, EN_VOICES } from './edgeTts.js';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const TTS_MODEL = process.env.HF_TTS_MODEL || 'hexgrad/Kokoro-82M';
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'edge';

const mathSpeakMap = [
  [/\^2/g, ' bình phương '],
  [/\^3/g, ' lập phương '],
  [/√/g, ' căn bậc hai '],
  [/±/g, ' cộng trừ '],
  [/≤/g, ' nhỏ hơn hoặc bằng '],
  [/≥/g, ' lớn hơn hoặc bằng '],
  [/≠/g, ' khác '],
  [/×/g, ' nhân '],
  [/÷/g, ' chia '],
  [/Δ/g, ' delta '],
  [/π/g, ' pi '],
];

/** Chuẩn hóa văn bản cho TTS tiếng Việt tự nhiên */
export function stripForSpeech(text) {
  let s = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]+\$/g, ' ');

  for (const [re, word] of mathSpeakMap) {
    s = s.replace(re, word);
  }

  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1. ')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2500);
}

export async function synthesizeSpeech(text, speed = 1, voice = 'female', lang = 'vi') {
  const clean =
    lang === 'en'
      ? text.replace(/\s+/g, ' ').trim().slice(0, 2500)
      : stripForSpeech(text);
  if (!clean) {
    return { audioBase64: null, format: null, fallback: true, text: '' };
  }

  if (TTS_PROVIDER === 'edge' || TTS_PROVIDER === 'auto') {
    try {
      const edge = await synthesizeEdgeSpeech(clean, voice, speed, lang);
      return {
        ...edge,
        fallback: false,
        text: clean,
        speed,
        lang,
        voices: lang === 'en' ? EN_VOICES : VI_VOICES,
      };
    } catch (err) {
      console.warn('Edge TTS failed:', err.message);
    }
  }

  const hasHfKey =
    process.env.HUGGINGFACE_API_KEY &&
    !process.env.HUGGINGFACE_API_KEY.includes('fake');

  if (hasHfKey && (TTS_PROVIDER === 'kokoro' || TTS_PROVIDER === 'auto')) {
    try {
      const blob = await hf.textToSpeech({
        model: TTS_MODEL,
        inputs: clean,
      });
      const buffer = Buffer.from(await blob.arrayBuffer());
      return {
        audioBase64: buffer.toString('base64'),
        format: 'audio/wav',
        fallback: false,
        text: clean,
        speed,
        provider: 'kokoro',
        voices: VI_VOICES,
      };
    } catch (err) {
      console.warn('Kokoro TTS failed:', err.message);
    }
  }

  return {
    audioBase64: null,
    format: null,
    fallback: true,
    text: clean,
    speed,
    message: 'Dùng giọng Edge trên trình duyệt',
    voices: VI_VOICES,
  };
}
