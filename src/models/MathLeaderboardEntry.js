/**
 * MathLeaderboardEntry — MongoDB model cho Math Leaderboard
 *
 * Tích hợp: profile.js route (math/leaderboard/global)
 * Schema design:
 * - 1 document = 1 user snapshot Math gamification
 * - Cập nhật mỗi khi user sync stats từ frontend
 * - Cho phép query top N nhanh (thay vì lean() trên User collection)
 *
 * Index strategy:
 *   - points: desc — primary leaderboard
 *   - streak: desc — streak leaderboard
 *   - userId: unique
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const badgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, required: true },
    unlocked: { type: Boolean, default: false },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const mathLeaderboardEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    grade: { type: Number, min: 6, max: 12, default: null },

    // Core Math gamification
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    selfSolveCount: { type: Number, default: 0 },

    // Topic correct counts (tổng số bài đúng theo topic)
    topicCorrectCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    // Badges
    badges: [badgeSchema],

    // Computed
    totalBadges: { type: Number, default: 0 },

    // Timestamps
    lastStudyDate: { type: String, default: null },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: false },
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

mathLeaderboardEntrySchema.index({ points: -1 });
mathLeaderboardEntrySchema.index({ streak: -1 });
mathLeaderboardEntrySchema.index({ lastUpdatedAt: -1 });

// ─── Pre-save ────────────────────────────────────────────────────────────────

mathLeaderboardEntrySchema.pre('save', function (next) {
  this.totalBadges = this.badges.filter((b) => b.unlocked).length;
  this.lastUpdatedAt = new Date();
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Cập nhật từ frontend mathGamificationStore payload
 */
mathLeaderboardEntrySchema.methods.updateFromStats = function (stats) {
  if (stats.points !== undefined) this.points = Math.max(this.points, stats.points);
  if (stats.streak !== undefined) this.streak = Math.max(this.streak, stats.streak);
  if (stats.selfSolveCount !== undefined) {
    this.selfSolveCount = Math.max(this.selfSolveCount, stats.selfSolveCount);
  }
  if (stats.lastStudyDate) this.lastStudyDate = stats.lastStudyDate;
  if (stats.topicCorrectCounts) {
    for (const [topicId, count] of Object.entries(stats.topicCorrectCounts)) {
      const existing = this.topicCorrectCounts.get(topicId) ?? 0;
      this.topicCorrectCounts.set(topicId, Math.max(existing, count));
    }
  }
  if (Array.isArray(stats.badges)) {
    // Merge badges: unlock thì giữ, chưa unlock thì bỏ qua
    const existing = new Map(this.badges.map((b) => [b.id, b]));
    for (const b of stats.badges) {
      if (b.unlocked && !existing.has(b.id)) {
        this.badges.push(b);
      }
    }
  }
  return this;
};

mathLeaderboardEntrySchema.methods.toAPI = function (rank = null) {
  return {
    rank: rank ?? this._rank ?? null,
    name: this.name,
    avatar: this.avatar,
    grade: this.grade,
    points: this.points,
    streak: this.streak,
    selfSolveCount: this.selfSolveCount ?? 0,
    totalBadges: this.totalBadges ?? 0,
  };
};

// ─── Statics ─────────────────────────────────────────────────────────────────

mathLeaderboardEntrySchema.statics.upsertFromUser = async function (user, stats) {
  const entry = await this.findOne({ userId: user._id });
  if (entry) {
    entry.name = user.name;
    entry.avatar = user.avatar;
    entry.grade = user.grade;
    entry.updateFromStats(stats);
    await entry.save();
    return entry;
  }
  const newEntry = new this({
    userId: user._id,
    name: user.name,
    avatar: user.avatar,
    grade: user.grade,
  });
  newEntry.updateFromStats(stats);
  await newEntry.save();
  return newEntry;
};

mathLeaderboardEntrySchema.statics.getTop = async function (limit = 50, sortBy = 'points') {
  const sortField = sortBy === 'streak' ? 'streak' : 'points';
  const entries = await this.find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();

  return entries.map((e, idx) => ({
    rank: idx + 1,
    name: e.name,
    avatar: e.avatar,
    grade: e.grade,
    points: e.points,
    streak: e.streak,
    selfSolveCount: e.selfSolveCount,
    totalBadges: e.totalBadges,
  }));
};

mathLeaderboardEntrySchema.statics.getRank = async function (userId) {
  const entry = await this.findOne({ userId });
  if (!entry) return null;
  const rankPoints = await this.countDocuments({ points: { $gt: entry.points } }) + 1;
  const rankStreak = await this.countDocuments({ streak: { $gt: entry.streak } }) + 1;
  return { rankPoints, rankStreak, entry };
};

mathLeaderboardEntrySchema.statics.removeByUserId = async function (userId) {
  return this.deleteOne({ userId });
};

const MathLeaderboardEntry = mongoose.model('MathLeaderboardEntry', mathLeaderboardEntrySchema);

export default MathLeaderboardEntry;
