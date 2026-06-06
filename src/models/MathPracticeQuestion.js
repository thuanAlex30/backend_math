/**
 * MathPracticeQuestion — MongoDB model cho câu hỏi luyện tập Toán
 *
 * Schema design:
 * - 1 document = 1 câu hỏi được AI sinh ra
 * - Dùng cho: question bank, SR card generation, practice history
 * - Cho phép reuse câu hỏi cho nhiều user (tránh AI sinh lại)
 *
 * Index strategy:
 *   - grade + topicId: query nhanh theo chủ đề
 *   - grade + difficulty: query theo độ khó
 *   - accuracyRate: descending → gợi ý câu khó/sai nhiều
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const optionSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const mathPracticeQuestionSchema = new mongoose.Schema(
  {
    // Nguồn gốc
    grade: {
      type: Number,
      min: 6,
      max: 12,
      required: true,
      index: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    topicLabel: {
      type: String,
      default: null,
    },

    // Câu hỏi
    question: { type: String, required: true },
    options: [optionSchema],         // 4 lựa chọn A B C D
    correctAnswer: { type: Number, default: null },  // index của đáp án đúng

    // Giải thích (AI generated)
    explanation: { type: String, default: '' },

    // Độ khó
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    difficultyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    // Metadata
    source: {
      type: String,
      enum: ['ai', 'fallback', 'manual'],
      default: 'ai',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Thống kê sử dụng (cho recommend)
    timesUsed: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },

    // Computed
    accuracyRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    // Cache cho SR
    srCardCreated: { type: Boolean, default: false },

    // Timestamps
    lastUsedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

mathPracticeQuestionSchema.index({ grade: 1, topicId: 1 });
mathPracticeQuestionSchema.index({ grade: 1, difficulty: 1 });
mathPracticeQuestionSchema.index({ accuracyRate: -1 });
mathPracticeQuestionSchema.index({ topicId: 1, difficulty: 1 });
mathPracticeQuestionSchema.index({ createdAt: -1 });

// ─── Pre-save ────────────────────────────────────────────────────────────────

mathPracticeQuestionSchema.pre('save', function (next) {
  const total = this.correctCount + this.incorrectCount;
  if (total > 0) {
    this.accuracyRate = Math.round((this.correctCount / total) * 100);
  }
  this.lastUsedAt = new Date();
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Ghi nhận kết quả làm bài (cho SR và thống kê)
 */
mathPracticeQuestionSchema.methods.recordResult = function (isCorrect) {
  this.timesUsed += 1;
  if (isCorrect) this.correctCount += 1;
  else this.incorrectCount += 1;
  return this;
};

/**
 * Chuyển thành SR card format
 */
mathPracticeQuestionSchema.methods.toSRDocument = function (userId) {
  return {
    questionId: this._id.toString(),
    question: this.question,
    topic: this.topicId,
    options: this.options.map((o) => o.text),
    correct: this.correctAnswer ?? 0,
    explanation: this.explanation,
    createdAt: new Date().toISOString().slice(0, 10),
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString().slice(0, 10),
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    quality: null,
    isCorrect: null,
    mistakeCount: 0,
  };
};

/**
 * Format cho practice API
 */
mathPracticeQuestionSchema.methods.toAPI = function () {
  return {
    id: this._id.toString(),
    question: this.question,
    options: this.options.map((o) => o.text),
    correct: this.correctAnswer,
    explanation: this.explanation,
    topicId: this.topicId,
    topicLabel: this.topicLabel,
    difficulty: this.difficulty,
    accuracyRate: this.accuracyRate,
  };
};

// ─── Statics ─────────────────────────────────────────────────────────────────

/**
 * Tạo câu hỏi từ AI response
 */
mathPracticeQuestionSchema.statics.createFromAI = async function ({
  grade,
  topicId,
  topicLabel,
  question,
  options,
  correctAnswer,
  explanation,
  difficulty,
  createdBy,
}) {
  const optionsWithCorrect = options.map((text, idx) => ({
    index: idx,
    text,
    isCorrect: idx === correctAnswer,
  }));

  const doc = new this({
    grade,
    topicId,
    topicLabel,
    question,
    options: optionsWithCorrect,
    correctAnswer,
    explanation: explanation || '',
    difficulty: difficulty || 'medium',
    source: 'ai',
    createdBy,
  });
  await doc.save();
  return doc;
};

/**
 * Tìm câu hỏi chưa dùng hoặc ít dùng nhất cho topic
 */
mathPracticeQuestionSchema.statics.findForPractice = async function (
  grade,
  topicId,
  { difficulty = null, excludeIds = [], limit = 5 }
) {
  const query = { grade, topicId };
  if (difficulty) query.difficulty = difficulty;
  if (excludeIds.length > 0) query._id = { $nin: excludeIds };

  return this.find(query)
    .sort({ timesUsed: 1, accuracyRate: 1 })  // ít dùng, hay sai → ưu tiên
    .limit(limit)
    .lean();
};

/**
 * Tìm câu hỏi yếu (accuracy thấp) cho ôn tập
 */
mathPracticeQuestionSchema.statics.findWeakQuestions = async function (
  grade,
  { topicId = null, limit = 10 }
) {
  const query = { grade, timesUsed: { $gt: 0 }, accuracyRate: { $lt: 60 } };
  if (topicId) query.topicId = topicId;

  return this.find(query)
    .sort({ accuracyRate: 1, timesUsed: -1 })
    .limit(limit)
    .lean();
};

/**
 * Bulk record results (khi submit practice)
 */
mathPracticeQuestionSchema.statics.recordBulkResults = async function (results) {
  // results: [{ questionId, isCorrect }]
  const bulkOps = results.map(({ questionId, isCorrect }) => ({
    updateOne: {
      filter: { _id: questionId },
      update: {
        $inc: {
          timesUsed: 1,
          ...(isCorrect ? { correctCount: 1 } : { incorrectCount: 1 }),
        },
        $set: { lastUsedAt: new Date() },
      },
    },
  }));
  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }
};

const MathPracticeQuestion = mongoose.model(
  'MathPracticeQuestion',
  mathPracticeQuestionSchema
);

export default MathPracticeQuestion;
