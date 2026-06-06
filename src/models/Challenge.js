/**
 * Challenge — MongoDB model cho Social Challenge đấu bài Toán
 *
 * Thay thế: User.socialChallenges (embedded array)
 *
 * Schema design:
 * - 1 document = 1 challenge
 * - Thay vì lưu trong User.socialChallenges[], dùng collection riêng
 *   để query leaderboard, filter theo status, expire dễ dàng
 *
 * Migrations:
 * - hiện tại: socialChallenges.js ghi vào User.socialChallenges[]
 * - tương lai: ghi vào Challenge collection
 * - Khi user đăng nhập, upsert document với userId thật
 *
 * Index strategy:
 *   - challengerId + status, opponentId + status: query dashboard
 *   - expiresAt: TTL index tự động xóa challenge hết hạn sau 30 ngày
 *   - winner, score: leaderboard queries
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const resultSchema = new mongoose.Schema(
  {
    score: { type: Number, default: null },    // 0-100
    timeSeconds: { type: Number, default: null },
    submittedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const challengeSchema = new mongoose.Schema(
  {
    // Hai người chơi
    challengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    opponentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    challengerName: { type: String, default: 'Học sinh ẩn danh' },
    opponentName: { type: String, default: 'Học sinh ẩn danh' },

    // Bài toán
    problem: { type: String, required: true },
    problemTopic: { type: String, default: null },  // topicId từ mathGraph
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },

    // Thời gian
    timeLimit: { type: Number, default: 600 },   // giây
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in-progress', 'completed', 'expired', 'declined'],
      default: 'pending',
    },

    // Ai tạo challenge
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Kết quả
    challengerResult: { type: resultSchema, default: () => ({}) },
    opponentResult: { type: resultSchema, default: () => ({}) },

    // Ai thắng
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winnerName: { type: String, default: null },
    isDraw: { type: Boolean, default: false },

    // Thời hạn (TTL: auto-delete sau 30 ngày)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Query theo user (là challenger hoặc opponent)
challengeSchema.index({ challengerId: 1, status: 1 });
challengeSchema.index({ opponentId: 1, status: 1 });

// User dashboard — tất cả challenge của user (dù là challenger hay opponent)
challengeSchema.index({ $or: [{ challengerId: 1 }, { opponentId: 1 }], status: 1 });

// Leaderboard — query tất cả completed challenge
challengeSchema.index({ status: 1, winnerId: 1 });

// TTL index — auto-delete document khi expiresAt <= now (sau 30 ngày kể từ expiresAt)
// Mặc định expiresAt = Date.now() + 7 ngày → xóa sau 7 ngày, hoặc sau 30 ngày nếu expiresAt bị gán lại
challengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ─── Virtuals ────────────────────────────────────────────────────────────────

challengeSchema.virtual('totalScore').get(function () {
  return (this.challengerResult.score ?? 0) + (this.opponentResult.score ?? 0);
});

challengeSchema.virtual('winnerScore').get(function () {
  if (!this.winnerId) return null;
  if (this.winnerId.toString() === this.challengerId.toString()) {
    return this.challengerResult.score;
  }
  return this.opponentResult.score;
});

challengeSchema.virtual('loserScore').get(function () {
  if (!this.winnerId || this.isDraw) return null;
  if (this.winnerId.toString() === this.challengerId.toString()) {
    return this.opponentResult.score;
  }
  return this.challengerResult.score;
});

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Accept challenge → status: 'accepted'
 */
challengeSchema.methods.accept = function () {
  this.status = 'accepted';
  return this;
};

/**
 * Bắt đầu làm bài → status: 'in-progress'
 */
challengeSchema.methods.start = function () {
  this.status = 'in-progress';
  return this;
};

/**
 * Nộp kết quả
 * @param {string} userId — challengerId hoặc opponentId
 * @param {number} score — điểm 0-100
 * @param {number} timeSeconds
 */
challengeSchema.methods.submitResult = function (userId, score, timeSeconds) {
  const isChallenger = this.challengerId.toString() === userId.toString();
  const result = isChallenger ? 'challengerResult' : 'opponentResult';
  this[result] = { score, timeSeconds, submittedAt: new Date() };

  const bothSubmitted =
    this.challengerResult.score !== null && this.opponentResult.score !== null;

  if (bothSubmitted) {
    this.status = 'completed';
    this.determineWinner();
  } else {
    this.status = 'in-progress';
  }
  return this;
};

/**
 * Xác định người thắng
 */
challengeSchema.methods.determineWinner = function () {
  const cScore = this.challengerResult.score ?? 0;
  const oScore = this.opponentResult.score ?? 0;

  if (cScore > oScore) {
    this.winnerId = this.challengerId;
    this.winnerName = this.challengerName;
    this.isDraw = false;
  } else if (oScore > cScore) {
    this.winnerId = this.opponentId;
    this.winnerName = this.opponentName;
    this.isDraw = false;
  } else {
    // Hoà
    this.winnerId = null;
    this.winnerName = null;
    this.isDraw = true;
  }
  return this;
};

/**
 * Format cho response API
 */
challengeSchema.methods.toAPI = function (currentUserId) {
  const isChallenger = this.challengerId?.toString() === currentUserId?.toString();
  return {
    _id: this._id.toString(),
    challengerId: this.challengerId?.toString(),
    opponentId: this.opponentId?.toString(),
    challengerName: this.challengerName,
    opponentName: this.opponentName,
    problem: this.problem,
    problemTopic: this.problemTopic,
    difficulty: this.difficulty,
    timeLimit: this.timeLimit,
    status: this.status,
    createdAt: this.createdAt?.toISOString(),
    expiresAt: this.expiresAt?.toISOString(),
    // User-specific result
    myResult: isChallenger
      ? this.challengerResult
      : this.opponentResult,
    opponentResult: isChallenger
      ? this.opponentResult
      : this.challengerResult,
    myScore: isChallenger
      ? this.challengerResult.score
      : this.opponentResult.score,
    opponentScore: isChallenger
      ? this.opponentResult.score
      : this.challengerResult.score,
    challengerScore: this.challengerResult.score,
    opponentScore: this.opponentResult.score,
    challengerTime: this.challengerResult.timeSeconds,
    opponentTime: this.opponentResult.timeSeconds,
    winnerId: this.winnerId?.toString() ?? null,
    winnerName: this.winnerName,
    isDraw: this.isDraw,
    isChallenger,
  };
};

// ─── Statics ─────────────────────────────────────────────────────────────────

/**
 * Tạo challenge mới
 */
challengeSchema.statics.createChallenge = async function ({
  challengerId,
  opponentId,
  challengerName,
  opponentName,
  problem,
  difficulty,
  timeLimit = 600,
}) {
  const challenge = new this({
    challengerId,
    opponentId,
    challengerName,
    opponentName,
    problem,
    difficulty,
    timeLimit,
    createdBy: challengerId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await challenge.save();
  return challenge;
};

/**
 * Lấy tất cả challenge của user
 */
challengeSchema.statics.findByUser = function (userId, filter = 'all') {
  const query = {
    $or: [{ challengerId: userId }, { opponentId: userId }],
  };
  if (filter === 'pending') query.status = 'pending';
  else if (filter === 'active') query.status = { $in: ['accepted', 'in-progress'] };
  else if (filter === 'completed') query.status = 'completed';

  return this.find(query).sort({ createdAt: -1 }).lean();
};

/**
 * Lấy challenge leaderboard
 */
challengeSchema.statics.getLeaderboard = function (limit = 50) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    // Unwind results để tính per-user
    {
      $facet: {
        byChallenger: [
          { $group: { _id: '$challengerId', wins: { $sum: 1 }, totalScore: { $sum: '$challengerResult.score' }, losses: { $sum: { $cond: [{ $ne: ['$winnerId', '$challengerId'] }, 1, 0] } } } },
        ],
        byOpponent: [
          { $group: { _id: '$opponentId', wins: { $sum: 1 }, totalScore: { $sum: '$opponentResult.score' }, losses: { $sum: { $cond: [{ $ne: ['$winnerId', '$opponentId'] }, 1, 0] } } } },
        ],
      },
    },
    // Merge và compute stats...
  ]);
};

/**
 * Lấy challenge đang chờ (pending) của opponent
 */
challengeSchema.statics.getPendingForUser = function (userId) {
  return this.find({
    opponentId: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
