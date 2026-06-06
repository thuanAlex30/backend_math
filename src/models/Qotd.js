import mongoose from 'mongoose';

const qotdQuestionSchema = new mongoose.Schema(
  {
    dateString: { type: String, required: true, unique: true, index: true },
    problem: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topic: { type: String, default: 'mixed' },
    solution: { type: String, default: '' },
    explanation: { type: String, default: '' },
    grade: { type: Number, min: 6, max: 12, default: 9 },
  },
  { timestamps: true }
);

const qotdSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateString: { type: String, required: true },
    answer: { type: String, default: '' },
    isCorrect: { type: Boolean, required: true },
    timeSeconds: { type: Number, default: null },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

qotdSubmissionSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export const QotdQuestion = mongoose.model('QotdQuestion', qotdQuestionSchema);
export const QotdSubmission = mongoose.model('QotdSubmission', qotdSubmissionSchema);
