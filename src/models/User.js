import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    avatar: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student',
    },
    grade: {
      type: Number,
      min: 6,
      max: 12,
      default: null,
    },
    // Spaced Repetition for Math
    mathSRCards: [
      {
        questionId: String,
        question: String,
        topic: String,
        options: [String],
        correct: Number,
        explanation: String,
        createdAt: String,
        lastReviewDate: String,
        nextReviewDate: String,
        interval: { type: Number, default: 0 },
        easeFactor: { type: Number, default: 2.5 },
        repetitions: { type: Number, default: 0 },
        quality: Number,
        isCorrect: Boolean,
        mistakeCount: { type: Number, default: 0 },
      },
    ],
    // Smart Notifications
    notifications: [
      {
        id: String,
        type: String, // weak_topic, review_mistakes, great_progress, etc.
        priority: String, // high, medium, low
        title: String,
        message: String,
        action: {
          type: String,
          topicId: String,
          numberOfQuestions: Number,
          questionIds: [String],
        },
        xp_reward: Number,
        isRead: { type: Boolean, default: false },
        createdAt: String,
        expiresAt: String, // Notification hết hạn sau 7 ngày
      },
    ],
    // Notification settings
    notificationSettings: {
      enabled: { type: Boolean, default: true },
      maxPerDay: { type: Number, default: 3 },
      quietHours: {
        startTime: String, // HH:MM format
        endTime: String,
      },
    },
    // Practice history (cho SR + notifications)
    practiceHistory: [
      {
        questionId: String,
        topicId: String,
        topicName: String,
        topic: String,
        question: String,
        isCorrect: Boolean,
        timestamp: String,
        date: String,
        timeSeconds: Number,
        difficulty: String,
      },
    ],
    // Social Challenges
    socialChallenges: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        challengerId: mongoose.Schema.Types.ObjectId,
        opponentId: mongoose.Schema.Types.ObjectId,
        challengerName: String,
        opponentName: String,
        problem: String,
        difficulty: String,
        timeLimit: Number,
        status: { type: String, enum: ['pending', 'accepted', 'in-progress', 'completed'], default: 'pending' },
        createdAt: Date,
        expiresAt: Date,
        challengerScore: Number,
        opponentScore: Number,
        challengerTime: Number,
        opponentTime: Number,
        winner: mongoose.Schema.Types.ObjectId,
      },
    ],
    // QotD (Question of the Day) Submissions
    qotdSubmissions: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        dateString: String,
        answer: String,
        isCorrect: Boolean,
        timeSeconds: Number,
        submittedAt: Date,
        points: Number,
      },
    ],
    // QotD Statistics
    qotdStats: {
      correctCount: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      totalPoints: { type: Number, default: 0 },
      lastSubmissionDate: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    avatar: this.avatar,
    role: this.role,
    grade: this.grade,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
