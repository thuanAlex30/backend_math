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
import {
  buildEnglishPersonalizedContext,
  updateSkillPracticed,
  getEnglishSkillStatuses,
  getWeakEnglishSkills,
} from './englishGraphRag.js';
import User from '../models/User.js';

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

  try {
    const raw = await chatComplete(
      [
        { role: 'system', content: LISTENING_PROMPT },
        {
          role: 'user',
          content: `${curriculumHint}\n${topicHint}\nTạo bài nghe với ${n} câu hỏi, mỗi câu ${optCount} lựa chọn. Trình độ: ${aiLevel}.`,
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
  } catch (err) {
    console.warn('[generateListening] AI failed, retrying once:', err.message);
    try {
      const raw2 = await chatComplete(
        [
          { role: 'system', content: LISTENING_PROMPT },
          {
            role: 'user',
            content: `Lớp ${g}. Viết một đoạn hội thoại ngắn 5-8 câu về chủ đề ${listening.topics[0] || 'giao tiếp hàng ngày'}. Sau đó tạo ${n} câu hỏi trắc nghiệm ${optCount} lựa chọn. Trả lời JSON {title, audioScript, questions: [{question, options, answer, explanation}]}.`,
          },
        ],
        { max_tokens: 1800, temperature: 0.8 }
      );
      const parsed2 = parseJsonFromText(raw2);
      if (parsed2) {
        return {
          ...parsed2,
          grade: g,
          playbackSpeed: listening.speed,
          durationSec: listening.durationSec,
        };
      }
    } catch (err2) {
      console.error('[generateListening] AI retry failed:', err2.message);
    }
  }

  // Fallback: tạo đoạn hội thoại đơn giản theo grade
  const dialogues = {
    beginner: [
      'Hello, my name is Nam. I am a student. I go to school every day. I like English class.',
      'Good morning! How are you today? I am fine, thank you. What is your name?',
      'This is my family. I have a mother and a father. We live in Hanoi. It is a big city.',
    ],
    intermediate: [
      'Yesterday, I went to the market with my mother. We bought some fruits and vegetables. The weather was sunny and warm.',
      'I would like to order a cup of coffee, please. With milk or black? Just black, thank you. Anything else? No, that is all.',
      'Next week, I am going to visit my grandparents in the countryside. They live near the river. I am very excited.',
    ],
    advanced: [
      'According to recent research, climate change has significantly affected agricultural productivity in developing countries, which raises important questions about sustainable development policies and food security strategies for the future.',
      'While technology has undoubtedly transformed education, critics argue that excessive screen time may negatively impact cognitive development and social skills in young learners, particularly when digital literacy is not adequately integrated into curricula.',
    ],
  };
  const pool = dialogues[aiLevel] || dialogues.intermediate;
  const audioScript = pool[Math.floor(Math.random() * pool.length)];
  const questions = Array.from({ length: Math.min(n, 5) }, (_, i) => ({
    question: `Câu hỏi ${i + 1} về đoạn hội thoại trên`,
    options: Array.from({ length: optCount }, (_, j) => `Đáp án ${String.fromCharCode(65 + j)}`),
    answer: 0,
    explanation: 'AI đang bận — thử lại sau hoặc tải trang.',
  }));

  return {
    title: `Bài nghe – Lớp ${g}`,
    type: 'dialogue',
    audioScript,
    questions,
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

  try {
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
  } catch (err) {
    console.warn('[generateReading] AI failed, retrying once:', err.message);
    try {
      const raw2 = await chatComplete(
        [
          { role: 'system', content: READING_PROMPT },
          {
            role: 'user',
            content: `Lớp ${g}. Viết một bài đọc ~${reading.lengthWords} từ. Tạo ${n} câu hỏi trắc nghiệm ${optCount} lựa chọn. Trả lời JSON {title, passage, questions: [{question, options, answer, explanation}]}.`,
          },
        ],
        { max_tokens: 2000, temperature: 0.8 }
      );
      const parsed2 = parseJsonFromText(raw2);
      if (parsed2) {
        return {
          ...parsed2,
          grade: g,
          targetLength: reading.lengthWords,
          newWordsPercent: reading.newWordsPercent,
        };
      }
    } catch (err2) {
      console.error('[generateReading] AI retry failed:', err2.message);
    }
  }

  // Fallback: bài đọc đơn giản theo grade
  const passages = {
    beginner: {
      title: `A Day at School – Lớp ${g}`,
      passage: `My name is Nam. I am a student in grade ${g}. Every morning, I wake up at six o'clock. I have breakfast with my family at six thirty. I go to school by bike. School starts at seven o'clock. I have four classes in the morning and two classes in the afternoon. My favorite subject is Mathematics. After school, I play soccer with my friends. I study English every day because I want to improve my skills.`,
    },
    intermediate: {
      title: `My Hometown – Lớp ${g}`,
      passage: `I live in a small town near Hanoi. It is not very big, but it has everything we need. There is a market, a hospital, and several schools. The people here are friendly and helpful. Every weekend, my family visits my grandparents who live in the countryside. We often go there by motorbike. The journey takes about one hour. I love my hometown because it is peaceful and the food is delicious. Recently, the town has developed a lot. New roads and shops have been built. However, we still keep our traditions and culture.`,
    },
    advanced: {
      title: `The Impact of Technology on Education – Lớp ${g}`,
      passage: `In recent years, technology has transformed the way we approach education in profound and multifaceted ways. Online learning platforms have democratized access to knowledge, allowing students in remote areas to benefit from quality instruction. Virtual classrooms and AI-powered tutoring systems provide personalized learning experiences that adapt to individual needs. Nevertheless, concerns remain about the digital divide, as not all students have equal access to technology. Moreover, the over-reliance on screens may affect concentration and social development. Experts suggest a balanced approach that combines technological tools with traditional teaching methods. The future of education likely lies in thoughtfully integrating technology while preserving the human elements of learning.`,
    },
  };

  const p = passages[aiLevel] || passages.intermediate;
  const questions = Array.from({ length: Math.min(n, 6) }, (_, i) => ({
    question: `Câu hỏi ${i + 1}: ${p.passage.slice(0, 50)}...`,
    options: Array.from({ length: optCount }, (_, j) => `Đáp án ${String.fromCharCode(65 + j)}`),
    answer: 0,
    explanation: 'AI đang bận — thử lại sau.',
  }));

  return {
    ...p,
    questions,
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

export async function englishChat(messages, { grade = 9, level, role = 'teacher', topicId, studentContext, userId } = {}) {
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

  // Graph RAG: load skill profile từ MongoDB
  let skillContext = '';
  if (userId) {
    try {
      const user = await User.findById(userId).select('englishStats').lean();
      if (user?.englishStats?.skillsPracticed) {
        skillContext = buildEnglishPersonalizedContext(user.englishStats.skillsPracticed, 'chat', g);
      }
    } catch {}
  }

  const systemParts = [ENGLISH_TUTOR_PROMPT, roleHint, levelHint, curriculumHint];
  if (skillContext) systemParts.push(skillContext);
  if (studentHint) systemParts.push(studentHint);

  const reply = await chatComplete(
    [{ role: 'system', content: systemParts.join('\n\n') }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    { max_tokens: 1024, temperature: 0.7 }
  );

  return { reply, grade: g };
}

/** Lấy skill profile từ MongoDB (hoặc mock nếu không có userId) */
export async function getEnglishSkillProfile(userId) {
  if (userId) {
    try {
      const user = await User.findById(userId).select('englishStats').lean();
      if (user?.englishStats?.skillsPracticed) {
        return {
          skillsPracticed: user.englishStats.skillsPracticed,
          skills: getEnglishSkillStatuses(user.englishStats.skillsPracticed),
          weakSkills: getWeakEnglishSkills(user.englishStats.skillsPracticed),
        };
      }
    } catch {}
  }
  return {
    skillsPracticed: { vocab: 0, grammar: 0, pronunciation: 0, listening: 0, reading: 0, writing: 0, chat: 0 },
    skills: getEnglishSkillStatuses(null),
    weakSkills: [],
  };
}

/**
 * Cập nhật skill practiced sau khi hoàn thành bài tập
 * @param {string|null} userId
 * @param {string} module
 * @param {number} score 0-100
 */
export async function recordEnglishSkill(userId, module, score) {
  if (!userId || !module) return;
  try {
    const user = await User.findById(userId);
    if (!user) return;
    if (!user.englishStats) user.englishStats = {};
    if (!user.englishStats.skillsPracticed) {
      user.englishStats.skillsPracticed = { vocab: 0, grammar: 0, pronunciation: 0, listening: 0, reading: 0, writing: 0, chat: 0 };
    }
    user.englishStats.skillsPracticed = updateSkillPracticed(
      user.englishStats.skillsPracticed,
      module,
      score
    );
    await user.save();
  } catch (err) {
    console.warn('[recordEnglishSkill]', err.message);
  }
}
