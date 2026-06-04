import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { ProsodyOptions } from 'msedge-tts';

export const VI_VOICES = {
  female: { id: 'vi-VN-HoaiMyNeural', label: 'Cô My (nữ, ấm áp)' },
  male: { id: 'vi-VN-NamMinhNeural', label: 'Thầy Minh (nam, rõ ràng)' },
};

export const EN_VOICES = {
  female: { id: 'en-US-JennyNeural', label: 'Jenny (US)' },
  male: { id: 'en-US-GuyNeural', label: 'Guy (US)' },
};

function resolveVoice(voiceId, lang = 'vi') {
  const map = lang === 'en' ? EN_VOICES : VI_VOICES;
  if (voiceId === 'male') return map.male.id;
  if (voiceId === 'female') return map.female.id;
  if (typeof voiceId === 'string' && voiceId.includes('-')) return voiceId;
  return map.female.id;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function synthesizeEdgeSpeech(text, voiceId, speed = 1, lang = 'vi') {
  const resolvedVoice = resolveVoice(voiceId, lang);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    resolvedVoice,
    OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
  );

  const prosody = new ProsodyOptions();
  prosody.rate = Math.min(1.5, Math.max(0.75, speed));
  prosody.pitch = '+0Hz';
  prosody.volume = 100;

  const { audioStream } = tts.toStream(text, prosody);
  const buffer = await streamToBuffer(audioStream);
  tts.close();

  return {
    audioBase64: buffer.toString('base64'),
    format: 'audio/mpeg',
    provider: 'edge',
    voice: resolvedVoice,
  };
}
