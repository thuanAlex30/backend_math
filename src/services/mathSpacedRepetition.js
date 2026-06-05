/**
 * Spaced Repetition cho Toán - SM-2 Algorithm
 * Tích hợp với practice questions để tự động review bài sai
 */

/**
 * Cấu trúc card toán
 * {
 *   questionId: string,
 *   question: string,
 *   topic: string,
 *   createdAt: ISO date,
 *   lastReviewDate: ISO date,
 *   nextReviewDate: ISO date,
 *   interval: number (ngày),
 *   easeFactor: number (2.5 default),
 *   repetitions: number,
 *   quality: number (0-2),
 *   isCorrect: boolean,
 *   mistakeCount: number
 * }
 */

/**
 * Cập nhật card khi học sinh hoàn thành câu hỏi
 * @param {Object} card - Spaced repetition card
 * @param {number} quality - 0=Khó (sai), 1=Vừa (gợi ý), 2=Dễ (đúng luôn)
 * @returns {Object} Card updated
 */
export function sm2UpdateMath(card, quality) {
  let { interval = 0, easeFactor = 2.5, repetitions = 0, mistakeCount = 0 } = card;

  // Nếu sai (quality < 1): reset interval, tăng mistakeCount
  if (quality < 1) {
    repetitions = 0;
    interval = 1; // Review lại ngày hôm sau
    mistakeCount = (mistakeCount || 0) + 1;
  } else {
    // Đúng: tăng interval
    if (repetitions === 0) interval = 1; // Lần đầu đúng: review lại 1 ngày sau
    else if (repetitions === 1) interval = 3; // Lần 2 đúng: 3 ngày sau
    else interval = Math.round(interval * easeFactor); // Sau đó: nhân với easeFactor
    repetitions += 1;
  }

  // Tính easeFactor (độ khó tương đối)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (2 - quality) * (0.08 + (2 - quality) * 0.02))
  );

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    mistakeCount,
    quality,
    isCorrect: quality >= 1,
    lastReviewDate: new Date().toISOString().slice(0, 10),
    nextReviewDate: nextDate.toISOString().slice(0, 10),
  };
}

/**
 * Lấy danh sách câu hỏi cần ôn tập hôm nay (DUE)
 * @param {Array} cards - Danh sách toàn bộ cards
 * @param {string} today - Ngày hôm nay (YYYY-MM-DD), default: hôm nay
 * @returns {Array} Cards due today
 */
export function getMathCardsDue(cards, today = new Date().toISOString().slice(0, 10)) {
  return cards.filter((c) => {
    // Chưa review lần nào hoặc đến ngày review
    return !c.nextReviewDate || c.nextReviewDate <= today;
  });
}

/**
 * Lọc những bài sai nhiều lần (mistake > 2)
 */
export function getMathCardsWithMistakes(cards, minMistakes = 2) {
  return cards.filter((c) => (c.mistakeCount || 0) >= minMistakes);
}

/**
 * Tạo card mới cho một câu hỏi
 */
export function createMathCard(question) {
  return {
    questionId: question.id,
    question: question.question,
    topic: question.topic,
    options: question.options,
    correct: question.correct,
    explanation: question.explanation,
    createdAt: new Date().toISOString().slice(0, 10),
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString().slice(0, 10), // Due today (first time)
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    quality: null,
    isCorrect: null,
    mistakeCount: 0,
  };
}

/**
 * Phân tích thống kê SR cards
 */
export function analyzeSpacedRepetitionStats(cards) {
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = getMathCardsDue(cards, today);
  const withMistakes = getMathCardsWithMistakes(cards, 2);

  // Phân tích theo topic
  const topicStats = {};
  for (const card of cards) {
    if (!topicStats[card.topic]) {
      topicStats[card.topic] = {
        total: 0,
        dueToday: 0,
        withMistakes: 0,
        accuracy: 0,
        totalAttempts: 0,
        totalCorrect: 0,
      };
    }
    topicStats[card.topic].total += 1;
    if (dueToday.includes(card)) topicStats[card.topic].dueToday += 1;
    if (withMistakes.includes(card)) topicStats[card.topic].withMistakes += 1;
    if (card.isCorrect !== null) {
      topicStats[card.topic].totalAttempts += 1;
      if (card.isCorrect) topicStats[card.topic].totalCorrect += 1;
    }
  }

  // Tính accuracy
  for (const stats of Object.values(topicStats)) {
    stats.accuracy =
      stats.totalAttempts > 0
        ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
        : 0;
  }

  return {
    totalCards: cards.length,
    dueToday: dueToday.length,
    withMistakes: withMistakes.length,
    topicStats,
  };
}

/**
 * Tạo review plan cho hôm nay
 * Ưu tiên: 1) Bài sai lần trước, 2) Due today, 3) Bài có mistake count cao
 */
export function createDailyReviewPlan(cards, maxCards = 10) {
  const today = new Date().toISOString().slice(0, 10);

  // Phân loại
  const failing = cards.filter((c) => c.nextReviewDate === today && !c.isCorrect);
  const due = cards.filter((c) => c.nextReviewDate === today && c.isCorrect);
  const mistakes = cards.filter((c) => (c.mistakeCount || 0) >= 2);

  // Sắp xếp ưu tiên: failing → mistakes → due
  const planned = [
    ...failing.sort((a, b) => (b.mistakeCount || 0) - (a.mistakeCount || 0)),
    ...mistakes.filter((m) => !failing.includes(m) && !due.includes(m)),
    ...due.sort((a, b) => a.repetitions - b.repetitions), // Review cũ hơn trước
  ];

  return planned.slice(0, maxCards);
}

/**
 * Gợi ý kỳ ôn tập tiếp theo dựa trên hiệu suất
 */
export function suggestNextReviewSession(cards) {
  const stats = analyzeSpacedRepetitionStats(cards);
  const suggestions = [];

  // Nếu có nhiều bài due hôm nay
  if (stats.dueToday > 5) {
    suggestions.push({
      type: 'urgent_review',
      message: `Bạn có ${stats.dueToday} bài cần ôn tập hôm nay!`,
      cardsCount: stats.dueToday,
      estimatedMinutes: stats.dueToday * 2,
    });
  }

  // Nếu có bài sai nhiều lần
  if (stats.withMistakes > 3) {
    suggestions.push({
      type: 'mistake_review',
      message: `${stats.withMistakes} bài bạn hay sai. Cần học lại lý thuyết.`,
      cardsCount: stats.withMistakes,
      estimatedMinutes: stats.withMistakes * 3,
    });
  }

  // Accuracy < 60%
  for (const [topic, topicStats] of Object.entries(stats.topicStats)) {
    if (topicStats.accuracy > 0 && topicStats.accuracy < 60) {
      suggestions.push({
        type: 'weak_topic_review',
        topic,
        message: `Accuracy ${topicStats.accuracy}% trong ${topic}. Cần ôn tập!`,
        cardsCount: topicStats.withMistakes,
        estimatedMinutes: topicStats.withMistakes * 2,
      });
    }
  }

  return suggestions;
}
