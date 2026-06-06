import mongoose from 'mongoose';

const questionAnswerSchema = new mongoose.Schema(
  {
    questionNumber: Number,
    question: String,
    options: [String],
    userAnswer: { type: Number, default: null },
    correctAnswer: Number,
    isCorrect: Boolean,
    topicId: String,
    topicLabel: String,
  },
  { _id: false }
);

const examSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['thpt', 'practice'],
      default: 'thpt',
    },
    grade: {
      type: Number,
      min: 6,
      max: 12,
      default: 12,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    questions: [questionAnswerSchema],
    score: Number,
    totalQuestions: Number,
    scoreOutOf10: Number,
    durationMinutes: {
      type: Number,
      default: 90,
    },
    timeSpentSeconds: {
      type: Number,
      default: null,
    },
    analysis: {
      breakdown: [
        {
          id: String,
          name: String,
          percent: Number,
          _id: false,
        },
      ],
      summary: String,
      recommendReview: [String],
      _id: false,
    },
  },
  {
    timestamps: true,
  }
);

examSubmissionSchema.index({ userId: 1, date: -1 });
examSubmissionSchema.index({ sessionId: 1 });

examSubmissionSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    type: this.type,
    grade: this.grade,
    date: this.date,
    score: this.score,
    totalQuestions: this.totalQuestions,
    scoreOutOf10: this.scoreOutOf10,
    durationMinutes: this.durationMinutes,
    timeSpentSeconds: this.timeSpentSeconds,
    analysis: this.analysis,
  };
};

export default mongoose.model('ExamSubmission', examSubmissionSchema);
