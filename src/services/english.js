import { chatComplete } from './hfRouter.js';
import {
  ENGLISH_TUTOR_PROMPT,
  GRAMMAR_EXPLAIN_PROMPT,
  WRITING_CHECK_PROMPT,
  PRONUNCIATION_PROMPT,
  LISTENING_PROMPT,
  READING_PROMPT,
  VOCAB_EXPAND_PROMPT,
  CHAT_ROLES,
  LEVEL_HINTS,
} from '../prompts/english.js';
import { VOCABULARY_TOPICS, GRAMMAR_TOPICS } from '../data/englishData.js';
import { VOCAB_EXTRAS } from '../data/englishVocabExtras.js';
import { isDemoMode } from './hfRouter.js';
import {
  getEnglishCurriculum,
  gradeToEnglishLevel,
  buildCurriculumPrompt,
  buildPronunciationUnits,
  isValidEnglishGrade,
  GRADES,
} from '../data/englishCurriculum.js';

function parseJsonFromText(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function resolveGrade(grade) {
  const g = Number(grade);
  return isValidEnglishGrade(g) ? g : 9;
}

function normalizeWordKey(word) {
  return word.toLowerCase().trim();
}

function mergeTopicWords(topicId) {
  const base = VOCABULARY_TOPICS[topicId]?.words ?? [];
  const extra = VOCAB_EXTRAS[topicId] ?? [];
  const seen = new Set();
  const merged = [];
  for (const w of [...base, ...extra]) {
    const key = normalizeWordKey(w.word);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(w);
  }
  return merged;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lọc metadata theo lớp (không cắt số lượng từ) */
function enrichWords(words, vocabConfig) {
  return words.map((w) => {
    const out = { ...w };
    if (!vocabConfig.hasExamples) delete out.example;
    if (!vocabConfig.hasSynonyms) {
      delete out.synonym;
      delete out.antonym;
    }
    if (!vocabConfig.hasCollocations) delete out.collocation;
    if (!vocabConfig.hasWordFamilies) delete out.wordFamily;
    return out;
  });
}

export function getCurriculum(grade) {
  const g = resolveGrade(grade);
  return { grade: g, ...getEnglishCurriculum(g) };
}

export function getAllGrades() {
  return GRADES;
}

export function getVocabulary(topicId, grade = 9) {
  const g = resolveGrade(grade);
  const topic = VOCABULARY_TOPICS[topicId];
  if (!topic) return null;

  const curriculum = getEnglishCurriculum(g);
  const { vocabulary: v } = curriculum;
  if (!v.topics.includes(topicId)) {
    return null;
  }

  const merged = mergeTopicWords(topicId);
  const words = shuffleArray(enrichWords(merged, v));

  return {
    id: topic.id,
    label: topic.label,
    emoji: topic.emoji,
    words,
    grade: g,
    totalWords: words.length,
    unlimited: true,
    difficulty: v.difficulty,
    features: {
      hasImages: v.hasImages,
      hasExamples: v.hasExamples,
      hasSynonyms: v.hasSynonyms,
      hasCollocations: v.hasCollocations,
      hasWordFamilies: v.hasWordFamilies,
    },
  };
}

export function getAllVocabularyTopics(grade = 9) {
  const g = resolveGrade(grade);
  const { vocabulary: v } = getEnglishCurriculum(g);

  return v.topics
    .filter((id) => VOCABULARY_TOPICS[id])
    .map((id) => {
      const t = VOCABULARY_TOPICS[id];
      return {
        id: t.id,
        label: t.label,
        emoji: t.emoji,
        wordCount: mergeTopicWords(id).length,
      };
    });
}

/** Sinh thêm từ mới (AI hoặc ngân hàng demo) — không giới hạn số lần gọi */
export async function expandVocabulary(topicId, grade = 9, { exclude = [], count = 12 } = {}) {
  const g = resolveGrade(grade);
  const topic = VOCABULARY_TOPICS[topicId];
  if (!topic) throw new Error('Không tìm thấy chủ đề');

  const curriculum = getEnglishCurriculum(g);
  if (!curriculum.vocabulary.topics.includes(topicId)) {
    throw new Error('Chủ đề không phù hợp với lớp này');
  }

  const excludeSet = new Set(exclude.map(normalizeWordKey));
  const pool = enrichWords(mergeTopicWords(topicId), curriculum.vocabulary).filter(
    (w) => !excludeSet.has(normalizeWordKey(w.word))
  );

  const need = Math.min(Math.max(count, 4), 20);

  const excludeList = [...excludeSet].slice(0, 80).join(', ') || '(none)';

  if (isDemoMode()) {
    let picked = shuffleArray(pool).slice(0, need);
    if (picked.length < need) {
      const all = mergeTopicWords(topicId);
      for (const w of shuffleArray(all)) {
        if (picked.length >= need) break;
        picked.push({
          ...w,
          example: w.example ? `(Ôn lại) ${w.example}` : '(Ôn lại)',
        });
      }
    }
    return {
      words: enrichWords(picked.slice(0, need), curriculum.vocabulary),
      source: picked.length ? 'bank' : 'bank',
      grade: g,
    };
  }

  const curriculumHint = buildCurriculumPrompt('vocabulary', g);

  const raw = await chatComplete(
    [
      { role: 'system', content: VOCAB_EXPAND_PROMPT },
      {
        role: 'user',
        content: `Chủ đề: "${topic.label}" (${topicId}). Lớp ${g}. ${curriculumHint}\nSinh đúng ${need} từ MỚI, không trùng: ${excludeList}.`,
      },
    ],
    { max_tokens: 2000, temperature: 0.85 }
  );

  const parsed = parseJsonFromText(raw);
  let words = Array.isArray(parsed?.words) ? parsed.words : [];

  words = words
    .filter((w) => w?.word && !excludeSet.has(normalizeWordKey(w.word)))
    .map((w) => ({
      word: String(w.word).trim(),
      ipa: w.ipa || '',
      meaning: w.meaning || '',
      example: w.example || '',
      image: w.image || '📘',
    }));

  if (words.length < need) {
    const fallback = shuffleArray(pool).filter((w) => !words.some((x) => normalizeWordKey(x.word) === normalizeWordKey(w.word)));
    words = [...words, ...fallback].slice(0, need);
  }

  return {
    words: enrichWords(words.slice(0, need), curriculum.vocabulary),
    source: words.length ? 'ai' : 'bank',
    grade: g,
  };
}

export function getGrammarTopics(grade = 9) {
  const g = resolveGrade(grade);
  const { grammar } = getEnglishCurriculum(g);
  const order = new Map(grammar.topicIds.map((id, i) => [id, i]));
  return GRAMMAR_TOPICS.filter((t) => order.has(t.id)).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}

export async function explainGrammar(topicId, grade = 9, level) {
  const g = resolveGrade(grade);
  const topics = getGrammarTopics(g);
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) throw new Error('Chủ đề ngữ pháp không phù hợp với lớp này');

  const aiLevel = level || gradeToEnglishLevel(g);
  const curriculumHint = buildCurriculumPrompt('grammar', g);

  const text = await chatComplete(
    [
      { role: 'system', content: GRAMMAR_EXPLAIN_PROMPT },
      {
        role: 'user',
        content: `Giải thích ngữ pháp: "${topic.title}" (${topic.formula}).\n${curriculumHint}\nTrình độ AI: ${aiLevel}.`,
      },
    ],
    { max_tokens: 1500, temperature: 0.6 }
  );

  return { topic, explanation: text, grade: g };
}

export async function checkWriting(text, grade = 9, level) {
  const g = resolveGrade(grade);
  const aiLevel = level || gradeToEnglishLevel(g);
  const { writing } = getEnglishCurriculum(g);
  const curriculumHint = buildCurriculumPrompt('writing', g);

  const raw = await chatComplete(
    [
      { role: 'system', content: WRITING_CHECK_PROMPT },
      {
        role: 'user',
        content: `${curriculumHint}\nDạng bài: ${writing.type}. Độ dài mong đợi: ${writing.lengthWords || writing.lengthSentences} ${writing.lengthWords ? 'từ' : 'câu'}.\nTrình độ: ${aiLevel}.\n\nBài viết:\n${text}`,
      },
    ],
    { max_tokens: 1500, temperature: 0.4 }
  );

  const parsed = parseJsonFromText(raw);
  if (parsed) return { ...parsed, grade: g };

  return {
    corrected: text,
    errors: [],
    suggestions: ['AI trả lời dạng text:', raw],
    score: 70,
    grade: g,
  };
}

export async function scorePronunciation(expected, spoken, grade = 9, level) {
  const g = resolveGrade(grade);
  const aiLevel = level || gradeToEnglishLevel(g);
  const curriculumHint = buildCurriculumPrompt('pronunciation', g);

  const raw = await chatComplete(
    [
      { role: 'system', content: PRONUNCIATION_PROMPT },
      {
        role: 'user',
        content: `Câu mẫu: "${expected}"\nHọc sinh đọc: "${spoken}"\n${curriculumHint}\nTrình độ: ${aiLevel}.`,
      },
    ],
    { max_tokens: 800, temperature: 0.5 }
  );

  const parsed = parseJsonFromText(raw);
  if (parsed) return parsed;

  const similarity = simpleWordMatch(expected, spoken);
  return {
    score: similarity,
    wrongWords: [],
    feedback: raw || 'Hãy đọc chậm và rõ từng âm tiết.',
    tips: ['Nghe mẫu TTS trước khi đọc', 'Tập trung vào trọng âm'],
  };
}

function simpleWordMatch(expected, spoken) {
  const exp = expected.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const got = spoken.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  if (exp.length === 0) return 0;
  let match = 0;
  for (const w of exp) {
    if (got.some((g) => g.includes(w) || w.includes(g))) match++;
  }
  return Math.round((match / exp.length) * 100);
}

function optionsCountForGrade(grade) {
  const types = getEnglishCurriculum(grade).listening.questionTypes;
  if (types.includes('multiple_choice_4')) return 4;
  if (types.includes('multiple_choice_3')) return 3;
  return 4;
}

export async function generateListening(grade = 9, topicId, level) {
  const g = resolveGrade(grade);
  const aiLevel = level || gradeToEnglishLevel(g);
  const { listening } = getEnglishCurriculum(g);
  const topicHint =
    topicId && listening.topics.includes(topicId)
      ? `Chủ đề: ${topicId}.`
      : `Chủ đề gợi ý: ${listening.topics.join(', ')}.`;
  const curriculumHint = buildCurriculumPrompt('listening', g);
  const n = listening.questionCount;
  const optCount = optionsCountForGrade(g);

  const raw = await chatComplete(
    [
      { role: 'system', content: LISTENING_PROMPT },
      {
        role: 'user',
        content: `${curriculumHint}\n${topicHint}\nTạo bài nghe với ${n} câu hỏi, mỗi câu ${optCount} lựa chọn (nếu trắc nghiệm). Trình độ: ${aiLevel}.`,
      },
    ],
    { max_tokens: 1800, temperature: 0.7 }
  );

  const parsed = parseJsonFromText(raw);
  if (parsed) {
    return {
      ...parsed,
      grade: g,
      playbackSpeed: listening.speed,
      durationSec: listening.durationSec,
    };
  }

  return {
    title: 'Daily Conversation',
    type: 'dialogue',
    audioScript: 'Hello! How was your day? It was great, thank you. What did you do? I studied English.',
    questions: [
      {
        question: 'How was the day?',
        options: ['Great', 'Bad', 'Busy', 'Tired'].slice(0, optCount),
        answer: 0,
        explanation: 'The speaker said "It was great".',
      },
    ],
    grade: g,
    playbackSpeed: listening.speed,
    durationSec: listening.durationSec,
  };
}

export async function generateReading(grade = 9, level) {
  const g = resolveGrade(grade);
  const aiLevel = level || gradeToEnglishLevel(g);
  const { reading } = getEnglishCurriculum(g);
  const curriculumHint = buildCurriculumPrompt('reading', g);
  const n = reading.questionCount;
  const optCount = g >= 8 ? 4 : 3;

  const raw = await chatComplete(
    [
      { role: 'system', content: READING_PROMPT },
      {
        role: 'user',
        content: `${curriculumHint}\nTạo bài đọc hiểu với ${n} câu hỏi, ${optCount} lựa chọn mỗi câu. Trình độ: ${aiLevel}.`,
      },
    ],
    { max_tokens: 2000, temperature: 0.7 }
  );

  const parsed = parseJsonFromText(raw);
  if (parsed) {
    return {
      ...parsed,
      grade: g,
      targetLength: reading.lengthWords,
      newWordsPercent: reading.newWordsPercent,
    };
  }

  return {
    title: 'A Day at School',
    passage:
      'Every morning, students arrive at school at 7 AM. They attend classes and learn many subjects.',
    questions: [
      {
        question: 'When do students arrive?',
        options: ['6 AM', '7 AM', '8 AM', '9 AM'],
        answer: 1,
        explanation: 'The text says "at 7 AM".',
      },
    ],
    grade: g,
    targetLength: reading.lengthWords,
    newWordsPercent: reading.newWordsPercent,
  };
}

export function gradeListening(questions, answers) {
  let correct = 0;
  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.answer;
    if (isCorrect) correct++;
    return { ...q, userAnswer: answers[i], isCorrect };
  });
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return { score, correct, total: questions.length, results };
}

export function getPronunciationPractice(grade = 9, unitId) {
  const g = resolveGrade(grade);
  const { pronunciation } = getEnglishCurriculum(g);
  const units = buildPronunciationUnits(g, pronunciation);
  const unit = unitId ? units.find((u) => u.id === unitId) : units[0];
  const active = unit || units[0];
  return {
    grade: g,
    units,
    unitId: active?.id,
    unitTitle: active?.title,
    content: pronunciation.content,
    description: pronunciation.description,
    exercises: pronunciation.exercises,
    sentences: active?.sentences || pronunciation.sampleSentences,
  };
}

export async function englishChat(messages, { grade = 9, level, role = 'teacher', topicId, studentContext } = {}) {
  const g = resolveGrade(grade);
  const aiLevel = level || gradeToEnglishLevel(g);
  const roleHint = CHAT_ROLES[role] || CHAT_ROLES.teacher;
  const levelHint = LEVEL_HINTS[aiLevel] || LEVEL_HINTS.beginner;
  const curriculumHint = buildCurriculumPrompt('conversation', g);

  let studentHint = '';
  if (studentContext?.name) {
    studentHint = `Học sinh tên ${studentContext.name}. `;
  }
  if (studentContext?.goals?.includes('english_exam')) {
    studentHint += 'Mục tiêu nâng band/ôn thi — ưu tiên từ vựng học thuật và mẫu câu thi.';
  }

  const reply = await chatComplete(
    [
      {
        role: 'system',
        content: `${ENGLISH_TUTOR_PROMPT}\n\n${roleHint}\n\n${levelHint}\n\n${curriculumHint}${studentHint ? `\n\n${studentHint}` : ''}`,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    { max_tokens: 1024, temperature: 0.7 }
  );

  return { reply, grade: g };
}
