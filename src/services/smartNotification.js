/**
 * Smart Notifications Service
 * Phát sinh thông báo thông minh dựa trên hiệu suất học sinh
 */

/**
 * Phân tích lỗi học sinh và tạo thông báo
 * @param {Object} userProfile - Hồ sơ học sinh
 * @param {Array} recentPracticeHistory - Lịch sử 10-20 bài gần đây
 * @returns {Array} Danh sách notifications
 */
export function generateSmartNotifications(userProfile, recentPracticeHistory = []) {
  const notifications = [];

  if (!recentPracticeHistory || recentPracticeHistory.length === 0) {
    return notifications;
  }

  // Phân tích từng chủ đề
  const topicPerformance = analyzeTopicPerformance(recentPracticeHistory);

  // 1. Chủ đề yếu - cần cải thiện
  for (const [topicId, stats] of Object.entries(topicPerformance)) {
    if (stats.accuracy < 0.4 && stats.attempts >= 3) {
      notifications.push({
        type: 'weak_topic',
        priority: 'high',
        topicId,
        topicName: stats.topicName,
        title: `Bạn yếu ${stats.topicName}`,
        message: `Bạn trả lời sai ${Math.round((1 - stats.accuracy) * 100)}% bài về ${stats.topicName}. Hãy giải 3 bài tập để nắm chắc!`,
        action: {
          type: 'practice',
          topicId,
          numberOfQuestions: 3,
        },
        xp_reward: 50, // Bonus nếu hoàn thành notification action
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 2. Bài tập sai lặp lại - kích hoạt SM-2 review
  const frequentMistakes = findFrequentMistakes(recentPracticeHistory);
  if (frequentMistakes.length > 0) {
    notifications.push({
      type: 'review_mistakes',
      priority: 'medium',
      title: `Ôn tập lại bài hay sai`,
      message: `Bạn sai ${frequentMistakes.length} dạng bài. Hãy ôn tập để nắm chắc!`,
      mistakes: frequentMistakes,
      action: {
        type: 'spaced_repetition_review',
        questionIds: frequentMistakes.map((m) => m.questionId),
      },
      xp_reward: 40,
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Tiến bộ nhanh - khuyến khích tiếp tục
  if (hasQuickProgress(topicPerformance, recentPracticeHistory)) {
    notifications.push({
      type: 'great_progress',
      priority: 'low',
      title: `🎉 Tiến bộ tuyệt vời!`,
      message: `Độ chính xác của bạn tăng 20% trong 2 ngày qua. Hãy tiếp tục!`,
      action: {
        type: 'view_progress',
      },
      xp_reward: 30,
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Cảnh báo điều kiện tiên quyết
  const prerequisiteWarnings = checkPrerequisites(topicPerformance);
  if (prerequisiteWarnings.length > 0) {
    notifications.push(...prerequisiteWarnings);
  }

  return notifications;
}

/**
 * Phân tích hiệu suất từng chủ đề
 */
function analyzeTopicPerformance(history) {
  const topicStats = {};

  for (const item of history) {
    if (!item.topicId) continue;

    if (!topicStats[item.topicId]) {
      topicStats[item.topicId] = {
        topicName: item.topicName || item.topicId,
        attempts: 0,
        correct: 0,
        timestamps: [],
        questions: [],
      };
    }

    const stats = topicStats[item.topicId];
    stats.attempts += 1;
    if (item.isCorrect) stats.correct += 1;
    stats.timestamps.push(new Date(item.timestamp));
    stats.questions.push({
      questionId: item.questionId,
      isCorrect: item.isCorrect,
    });
  }

  // Tính accuracy
  for (const stats of Object.values(topicStats)) {
    stats.accuracy = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
  }

  return topicStats;
}

/**
 * Tìm những bài hay sai lặp lại
 */
function findFrequentMistakes(history) {
  const mistakes = {};

  for (const item of history) {
    if (!item.isCorrect && item.questionId) {
      if (!mistakes[item.questionId]) {
        mistakes[item.questionId] = {
          questionId: item.questionId,
          question: item.question,
          count: 0,
          topicId: item.topicId,
        };
      }
      mistakes[item.questionId].count += 1;
    }
  }

  // Lọc những bài sai ≥ 2 lần
  return Object.values(mistakes)
    .filter((m) => m.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
}

/**
 * Kiểm tra tiến bộ nhanh
 */
function hasQuickProgress(topicPerformance, history) {
  if (history.length < 10) return false;

  // So sánh 5 bài gần nhất vs 5 bài cũ hơn
  const recent = history.slice(-5);
  const older = history.slice(-10, -5);

  const recentAccuracy =
    recent.filter((h) => h.isCorrect).length / recent.length;
  const olderAccuracy = older.filter((h) => h.isCorrect).length / older.length;

  return recentAccuracy - olderAccuracy >= 0.2;
}

/**
 * Kiểm tra điều kiện tiên quyết
 */
function checkPrerequisites(topicPerformance) {
  const warnings = [];
  const prerequisites = {
    // Ví dụ: tích phân yêu cầu đạo hàm
    integral: { requires: 'derivative', name: 'Tích phân yêu cầu Đạo hàm' },
    trigonometry: { requires: 'angles', name: 'Lượng giác yêu cầu Góc' },
  };

  for (const [topicId, required] of Object.entries(prerequisites)) {
    if (topicPerformance[topicId] && topicPerformance[topicId].accuracy > 0.5) {
      const prereqStats = topicPerformance[required.requires];
      if (!prereqStats || prereqStats.accuracy < 0.6) {
        warnings.push({
          type: 'prerequisite_warning',
          priority: 'high',
          title: required.name,
          message: `Bạn muốn học ${topicPerformance[topicId].topicName}, nhưng yếu ${prereqStats?.topicName || 'kiến thức cơ bản'}. Hãy ôn tập trước!`,
          action: {
            type: 'review_prerequisite',
            topicId: required.requires,
          },
          xp_reward: 50,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return warnings;
}

/**
 * Tạo thông báo "Question of the Day"
 */
export function generateQotDNotification(questionOfDay) {
  return {
    type: 'question_of_day',
    priority: 'medium',
    title: `📚 Câu hỏi của ngày`,
    message: `Hãy giải câu hỏi về ${questionOfDay.topic} hôm nay!`,
    question: questionOfDay,
    action: {
      type: 'solve_qotd',
      questionId: questionOfDay.id,
    },
    xp_reward: 100, // Bonus cao hơn nếu giải đúng
    createdAt: new Date().toISOString(),
  };
}

/**
 * Tạo thông báo streak
 */
export function generateStreakNotification(streakDays, isRecovering = false) {
  if (isRecovering) {
    return {
      type: 'streak_rescued',
      priority: 'high',
      title: `🔥 Streak được cứu!`,
      message: `Bạn đã dùng freeze streak. Hôm nay hãy làm bài để phục hồi streak!`,
      action: {
        type: 'maintain_streak',
      },
      xp_reward: 50,
      createdAt: new Date().toISOString(),
    };
  }

  if (streakDays > 0 && streakDays % 7 === 0) {
    return {
      type: 'streak_milestone',
      priority: 'medium',
      title: `🔥 Streak ${streakDays} ngày!`,
      message: `Bạn đã học liên tiếp ${streakDays} ngày! +20% XP hôm nay.`,
      bonus_multiplier: 1.2,
      xp_reward: 100,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Không spam - chỉ gửi 2-3 thông báo/ngày tối đa
 */
export function filterNotifications(notifications, existingNotificationsToday = []) {
  if (existingNotificationsToday.length >= 3) {
    return [];
  }

  // Ưu tiên high > medium > low
  return notifications
    .sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3 - existingNotificationsToday.length);
}
