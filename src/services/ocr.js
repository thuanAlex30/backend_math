import Tesseract from 'tesseract.js';

export async function extractTextFromImage(base64Image) {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const {
    data: { text },
  } = await Tesseract.recognize(buffer, 'vie+eng', {
    logger: () => {},
  });

  return (text || '').trim();
}
