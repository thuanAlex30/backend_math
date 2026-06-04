/**
 * Chương trình Tiếng Anh theo lớp 6–12 — mọi kỹ năng (từ vựng → hội thoại)
 */

export const GRADES = [6, 7, 8, 9, 10, 11, 12];

/** Nhãn hiển thị chủ đề từ vựng / nghe / hội thoại */
export const TOPIC_LABELS = {
  family: 'Gia đình',
  school: 'Trường học',
  colors: 'Màu sắc',
  animals: 'Động vật',
  hobbies: 'Sở thích',
  weather: 'Thời tiết',
  work: 'Công việc',
  travel: 'Du lịch',
  health: 'Sức khỏe',
  technology: 'Công nghệ',
  environment: 'Môi trường',
  daily: 'Giao tiếp hàng ngày',
  idioms: 'Thành ngữ',
  academic: 'Từ học thuật',
  education: 'Giáo dục',
  society: 'Xã hội',
  science: 'Khoa học',
  culture: 'Văn hóa',
  academic_debate: 'Học thuật & tranh luận',
};

const ALL_CORE_TOPICS = ['family', 'school', 'work', 'travel', 'technology', 'daily'];

export const englishByGrade = {
  6: {
    vocabulary: {
      wordsPerSession: 5,
      topics: ['family', 'school', 'colors', 'animals'],
      difficulty: 'beginner',
      hasImages: true,
      hasExamples: false,
      hasSynonyms: false,
      hasCollocations: false,
      hasWordFamilies: false,
    },
    grammar: {
      topicIds: ['present-simple', 'present-continuous'],
      tenses: ['present_simple', 'present_continuous'],
      structures: ['affirmative', 'negative', 'interrogative'],
      difficulty: 'beginner',
    },
    pronunciation: {
      content: 'basic_phonetics',
      description: 'Bảng phiên âm cơ bản (22 phụ âm, 5 nguyên âm đơn)',
      exercises: ['matching', 'repeat'],
      sampleSentences: ['cat', 'dog', 'book', 'hello', 'thank you'],
    },
    listening: {
      durationSec: 45,
      speed: 0.8,
      topics: ['family', 'school'],
      questionTypes: ['fill_blank'],
      questionCount: 3,
    },
    reading: {
      lengthWords: 80,
      newWordsPercent: 2,
      questionTypes: ['true_false'],
      questionCount: 3,
    },
    writing: {
      type: 'simple_sentences',
      lengthSentences: 3,
      lengthWords: null,
      requirements: ['spelling', 'basic_structure'],
      promptHint: 'Viết 2–3 câu đơn tiếng Anh đúng chính tả và cấu trúc.',
    },
    conversation: {
      contexts: ['family', 'friends'],
      turns: 3,
      functions: ['greeting', 'self_intro'],
      topicHint: 'Gia đình, bạn bè — chào hỏi và giới thiệu bản thân.',
    },
  },
  7: {
    vocabulary: {
      wordsPerSession: 7,
      topics: ['family', 'school', 'hobbies', 'weather'],
      difficulty: 'beginner',
      hasImages: true,
      hasExamples: true,
      hasSynonyms: false,
      hasCollocations: false,
      hasWordFamilies: false,
    },
    grammar: {
      topicIds: ['past-simple', 'future-going-to', 'comparatives'],
      tenses: ['past_simple', 'future_going_to'],
      structures: ['comparative', 'superlative'],
      difficulty: 'beginner',
    },
    pronunciation: {
      content: 'diphthongs_stress2',
      description: 'Nguyên âm đôi (8 âm), trọng âm từ 2 âm tiết',
      exercises: ['minimal_pairs', 'repeat'],
      sampleSentences: [
        'I feel happy today.',
        'She reads a book every night.',
        'This is easier than that one.',
      ],
    },
    listening: {
      durationSec: 60,
      speed: 0.9,
      topics: ['hobbies', 'weather'],
      questionTypes: ['true_false'],
      questionCount: 4,
    },
    reading: {
      lengthWords: 120,
      newWordsPercent: 3,
      questionTypes: ['main_idea'],
      questionCount: 3,
    },
    writing: {
      type: 'short_paragraph_self',
      lengthSentences: null,
      lengthWords: 50,
      requirements: ['correct_tense', 'main_idea'],
      promptHint: 'Viết đoạn văn ngắn 40–50 từ kể về bản thân.',
    },
    conversation: {
      contexts: ['classroom', 'shop'],
      turns: 4,
      functions: ['asking_directions', 'shopping'],
      topicHint: 'Lớp học, cửa hàng — hỏi đường và mua đồ.',
    },
  },
  8: {
    vocabulary: {
      wordsPerSession: 10,
      topics: ['family', 'school', 'work', 'travel', 'health'],
      difficulty: 'intermediate',
      hasImages: false,
      hasExamples: true,
      hasSynonyms: true,
      hasCollocations: false,
      hasWordFamilies: false,
    },
    grammar: {
      topicIds: ['present-perfect', 'passive', 'conditionals-1'],
      tenses: ['present_perfect', 'passive_voice'],
      structures: ['conditional_type_1'],
      difficulty: 'intermediate',
    },
    pronunciation: {
      content: 'stress3_linking',
      description: 'Trọng âm từ 3+ âm tiết, nối âm cơ bản',
      exercises: ['read_sentence', 'detect_error'],
      sampleSentences: [
        'I have finished my homework already.',
        'The letter was sent yesterday.',
        'If it rains, we will stay home.',
      ],
    },
    listening: {
      durationSec: 90,
      speed: 1.0,
      topics: ['travel', 'work'],
      questionTypes: ['multiple_choice_3'],
      questionCount: 4,
    },
    reading: {
      lengthWords: 180,
      newWordsPercent: 4,
      questionTypes: ['inference_simple'],
      questionCount: 4,
    },
    writing: {
      type: 'description',
      lengthSentences: null,
      lengthWords: 70,
      requirements: ['adjectives', 'comparison'],
      promptHint: 'Miêu tả người hoặc vật 50–70 từ, dùng tính từ và so sánh.',
    },
    conversation: {
      contexts: ['restaurant', 'post_office'],
      turns: 5,
      functions: ['ordering_food', 'sending_mail'],
      topicHint: 'Nhà hàng, bưu điện — gọi món và gửi thư.',
    },
  },
  9: {
    vocabulary: {
      wordsPerSession: 12,
      topics: ['family', 'school', 'work', 'travel', 'technology', 'environment'],
      difficulty: 'intermediate',
      hasImages: false,
      hasExamples: true,
      hasSynonyms: false,
      hasCollocations: true,
      hasWordFamilies: false,
    },
    grammar: {
      topicIds: ['past-perfect', 'reported-speech', 'conditionals-2', 'relative-clauses'],
      tenses: ['past_perfect', 'reported_speech'],
      structures: ['conditional_type_2', 'relative_clause'],
      difficulty: 'intermediate',
    },
    pronunciation: {
      content: 'endings_s_z',
      description: 'Âm cuối /s/, /z/, /ɪz/, /t/, /d/, /ɪd/',
      exercises: ['voiced_unvoiced', 'read_sentence'],
      sampleSentences: [
        'She watched three movies last week.',
        'The dogs barked loudly at night.',
        'He decided to visit the museum.',
      ],
    },
    listening: {
      durationSec: 120,
      speed: 1.0,
      topics: ['technology', 'environment'],
      questionTypes: ['multiple_choice_4'],
      questionCount: 5,
    },
    reading: {
      lengthWords: 250,
      newWordsPercent: 5,
      questionTypes: ['detail_inference'],
      questionCount: 5,
    },
    writing: {
      type: 'email_letter',
      lengthSentences: null,
      lengthWords: 100,
      requirements: ['format', 'complete_information'],
      promptHint: 'Viết thư hoặc email ngắn 80–100 từ, đúng format.',
    },
    conversation: {
      contexts: ['hospital', 'bank'],
      turns: 6,
      functions: ['medical_visit', 'open_account'],
      topicHint: 'Bệnh viện, ngân hàng — khám bệnh và mở tài khoản.',
    },
  },
  10: {
    vocabulary: {
      wordsPerSession: 15,
      topics: [...ALL_CORE_TOPICS, 'idioms'],
      difficulty: 'upper_intermediate',
      hasImages: false,
      hasExamples: true,
      hasSynonyms: true,
      hasCollocations: true,
      hasWordFamilies: true,
    },
    grammar: {
      topicIds: [
        'present-simple',
        'past-simple',
        'present-perfect',
        'conditionals-3',
        'inversion-basic',
      ],
      tenses: ['review_all_tenses'],
      structures: ['conditional_type_3', 'inversion_basic'],
      difficulty: 'upper_intermediate',
    },
    pronunciation: {
      content: 'intonation_statements',
      description: 'Ngữ điệu câu kể, câu hỏi',
      exercises: ['read_paragraph', 'intonation'],
      sampleSentences: [
        'Could you explain your opinion on climate change?',
        'Education plays a vital role in modern society.',
        'What do you think about online learning?',
      ],
    },
    listening: {
      durationSec: 150,
      speed: 1.1,
      topics: ['education', 'society'],
      questionTypes: ['fill_blank', 'short_answer'],
      questionCount: 5,
    },
    reading: {
      lengthWords: 350,
      newWordsPercent: 6,
      questionTypes: ['structure_analysis'],
      questionCount: 5,
    },
    writing: {
      type: 'opinion_paragraph',
      lengthSentences: null,
      lengthWords: 150,
      requirements: ['thesis', 'supporting_points'],
      promptHint: 'Đoạn văn trình bày ý kiến 120–150 từ, có luận điểm và luận cứ.',
    },
    conversation: {
      contexts: ['job_interview', 'presentation'],
      turns: 8,
      functions: ['job_interview', 'short_presentation'],
      topicHint: 'Phỏng vấn xin việc và thuyết trình ngắn.',
    },
  },
  11: {
    vocabulary: {
      wordsPerSession: 15,
      topics: [...ALL_CORE_TOPICS, 'idioms', 'academic'],
      difficulty: 'upper_intermediate',
      hasImages: false,
      hasExamples: true,
      hasSynonyms: true,
      hasSynonymsAcademic: true,
      hasCollocations: true,
      hasWordFamilies: true,
    },
    grammar: {
      topicIds: ['future-perfect', 'inversion-advanced', 'subjunctive'],
      tenses: ['future_perfect'],
      structures: ['inversion_advanced', 'subjunctive'],
      difficulty: 'upper_intermediate',
    },
    pronunciation: {
      content: 'complex_intonation',
      description: 'Ngữ điệu câu phức, nhấn mạm',
      exercises: ['dialogue', 'emotion'],
      sampleSentences: [
        'Although the research was challenging, we achieved remarkable results.',
        'I strongly believe that technology should serve humanity.',
        'Would you mind elaborating on your previous statement?',
      ],
    },
    listening: {
      durationSec: 180,
      speed: 1.2,
      topics: ['science', 'culture'],
      questionTypes: ['summary'],
      questionCount: 5,
    },
    reading: {
      lengthWords: 450,
      newWordsPercent: 7,
      questionTypes: ['skimming_academic'],
      questionCount: 6,
    },
    writing: {
      type: 'short_essay',
      lengthSentences: null,
      lengthWords: 200,
      requirements: ['introduction', 'body', 'conclusion'],
      promptHint: 'Bài luận ngắn 150–200 từ, có mở bài, thân bài, kết luận.',
    },
    conversation: {
      contexts: ['debate', 'negotiation'],
      turns: 10,
      functions: ['express_opinion', 'rebuttal'],
      topicHint: 'Tranh luận và đàm phán — bày tỏ quan điểm, phản biện.',
    },
  },
  12: {
    vocabulary: {
      wordsPerSession: 20,
      topics: [...ALL_CORE_TOPICS, 'idioms', 'academic'],
      difficulty: 'advanced',
      hasImages: false,
      hasExamples: true,
      hasSynonyms: true,
      hasSynonymsAcademic: true,
      hasCollocations: true,
      hasWordFamilies: true,
      hasAdvancedUsage: true,
    },
    grammar: {
      topicIds: [
        'tense-review',
        'emphasis-structures',
        'inversion-full',
        'conditionals-mixed',
      ],
      tenses: ['all_tenses_review'],
      structures: ['emphasis', 'full_inversion'],
      difficulty: 'advanced',
    },
    pronunciation: {
      content: 'british_american_reduction',
      description: 'Phát âm chuẩn Anh–Mỹ, giảm âm',
      exercises: ['long_speech', 'reduction'],
      sampleSentences: [
        'The conference addressed sustainable development and global inequality.',
        'Scholars have debated whether artificial intelligence poses existential risks.',
        'I would like to apply for a scholarship to study abroad next year.',
      ],
    },
    listening: {
      durationSec: 240,
      speed: 1.3,
      topics: ['academic_debate'],
      questionTypes: ['speaker_opinion'],
      questionCount: 6,
    },
    reading: {
      lengthWords: 600,
      newWordsPercent: 8,
      questionTypes: ['viewpoint_analysis'],
      questionCount: 6,
    },
    writing: {
      type: 'academic_essay',
      lengthSentences: null,
      lengthWords: 250,
      requirements: ['logical_argument', 'academic_vocabulary'],
      promptHint: 'Bài luận học thuật 200–250 từ, lập luận chặt chẽ.',
    },
    conversation: {
      contexts: ['seminar', 'study_abroad_interview'],
      turns: 12,
      functions: ['academic_debate', 'study_abroad'],
      topicHint: 'Hội thảo và phỏng vấn du học — tranh luận học thuật.',
    },
  },
};

export function isValidEnglishGrade(grade) {
  return GRADES.includes(Number(grade));
}

export function getEnglishCurriculum(grade) {
  const g = Number(grade);
  return englishByGrade[g] || englishByGrade[9];
}

/** Map lớp → trình độ AI (tương thích EnglishLevel cũ) */
export function gradeToEnglishLevel(grade) {
  const g = Number(grade);
  if (g <= 7) return 'beginner';
  if (g <= 9) return 'intermediate';
  return 'advanced';
}

export function getTopicLabel(topicId) {
  return TOPIC_LABELS[topicId] || topicId;
}

/** Gợi ý prompt AI theo kỹ năng */
export function buildCurriculumPrompt(skill, grade, extra = {}) {
  const c = getEnglishCurriculum(grade);
  const g = Number(grade);
  switch (skill) {
    case 'grammar': {
      const t = c.grammar;
      return `Học sinh lớp ${g} (VN). Thì/cấu trúc: ${t.tenses.join(', ')}. Cấu trúc: ${t.structures.join(', ')}. Độ khó: ${t.difficulty}.`;
    }
    case 'listening': {
      const t = c.listening;
      const topics = t.topics.map((id) => getTopicLabel(id)).join(', ');
      return `Lớp ${g}. Bài nghe ~${t.durationSec}s, tốc độ TTS ${t.speed}x. Chủ đề: ${topics}. Dạng: ${t.questionTypes.join(', ')}. ${t.questionCount} câu hỏi.`;
    }
    case 'reading': {
      const t = c.reading;
      return `Lớp ${g}. Đoạn văn ~${t.lengthWords} từ, từ mới ≤${t.newWordsPercent}%. Dạng: ${t.questionTypes.join(', ')}. ${t.questionCount} câu.`;
    }
    case 'writing':
      return `Lớp ${g}. ${c.writing.promptHint} Yêu cầu: ${c.writing.requirements.join(', ')}.`;
    case 'pronunciation':
      return `Lớp ${g}. ${c.pronunciation.description}. Bài tập: ${c.pronunciation.exercises.join(', ')}.`;
    case 'conversation':
      return `Lớp ${g}. ${c.conversation.topicHint} ~${c.conversation.turns} lượt hội thoại. Chức năng: ${c.conversation.functions.join(', ')}.`;
    case 'vocabulary':
      return `Lớp ${g}. Độ khó ${c.vocabulary.difficulty}. Từ vựng đa dạng, không giới hạn số lượng.`;
    default:
      return `Lớp ${g}.`;
  }
}
