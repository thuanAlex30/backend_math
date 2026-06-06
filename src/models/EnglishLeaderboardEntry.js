/**
 * EnglishLeaderboardEntry — MongoDB model cho English Leaderboard
 *
 * Thay thế: in-memory mock trong englishData.js (LEADERBOARD_MOCK)
 * Tích hợp: englishLeaderboard.js service (hiện đọc trực tiếp User.englishStats)
 *
 * Schema design:
 * - 1 document = 1 user snapshot
 * - Cập nhật mỗi khi user sync stats hoặc đăng nhập
 * - Cho phép query top N nhanh mà không cần lean() trên User collection
 *
 * Index strategy:
 *   - xp: desc — leaderboard by XP
 *   - streak: desc — leaderboard by streak
 *   - userId: unique
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const skillsPracticedSchema = new mongoose.Schema(
  {
    vocab: { type: Number, default: 0 },
    grammar: { type: Number, default: 0 },
    pronunciation: { type: Number, default: 0 },
    listening: { type: Number, default: 0 },
    reading: { type: Number, default: 0 },
    writing: { type: Number, default: 0 },
    chat: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const englishLeaderboardEntrySchema = new mongoose.Schema(
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

    // Core gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastStudyDate: { type: String, default: null },

    // Skills
    wordsLearned: { type: Number, default: 0 },
    pronunciationScore: { type: Number, default: 0 },
    listeningScore: { type: Number, default: 0 },
    readingScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    writingScore: { type: Number, default: 0 },
    chatScore: { type: Number, default: 0 },

    // Computed scores
    totalSkillScore: { type: Number, default: 0 },  // sum of all skill scores

    // Weekly progress (7 ngày)
    weeklyProgress: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0],
      validate: {
        validator: (v) => v.length === 7,
        message: 'weeklyProgress phải có 7 phần tử',
      },
    },

    // Skills practiced (số lần practice mỗi skill)
    skillsPracticed: { type: skillsPracticedSchema, default: () => ({}) },

    // Badges (unlocked count)
    unlockedBadges: { type: Number, default: 0 },

    // Timestamps
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: false },
    versionKey: false,
  }
);

// ─── Computed virtual ─────────────────────────────────────────────────────────

englishLeaderboardEntrySchema.virtual('rankXp').get(function () {
  // Được set khi query với aggregation pipeline
  return this._rankXp;
});

englishLeaderboardEntrySchema.virtual('rankStreak').get(function () {
  return this._rankStreak;
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

englishLeaderboardEntrySchema.index({ xp: -1 });
englishLeaderboardEntrySchema.index({ streak: -1 });
englishLeaderboardEntrySchema.index({ lastUpdatedAt: -1 });
englishLeaderboardEntrySchema.index({ grade: 1, xp: -1 }); // leaderboard theo lớp

// ─── Pre-save ────────────────────────────────────────────────────────────────

englishLeaderboardEntrySchema.pre('save', function (next) {
  this.totalSkillScore =
    (this.pronunciationScore || 0) +
    (this.listeningScore || 0) +
    (this.readingScore || 0) +
    (this.grammarScore || 0) +
    (this.writingScore || 0) +
    (this.chatScore || 0);
  this.lastUpdatedAt = new Date();
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Cập nhật từ EnglishStats payload (frontend englishStore)
 */
englishLeaderboardEntrySchema.methods.updateFromStats = function (stats) {
  if (stats.xp !== undefined) this.xp = Math.max(this.xp, stats.xp);
  if (stats.level !== undefined) this.level = Math.max(this.level, stats.level);
  if (stats.streak !== undefined) this.streak = Math.max(this.streak, stats.streak);
  if (stats.lastStudyDate) this.lastStudyDate = stats.lastStudyDate;
  if (stats.wordsLearned !== undefined) {
    this.wordsLearned = Math.max(this.wordsLearned, stats.wordsLearned);
  }
  if (stats.pronunciationScore !== undefined) {
    this.pronunciationScore = Math.max(this.pronunciationScore, stats.pronunciationScore);
  }
  if (stats.listeningScore !== undefined) {
    this.listeningScore = Math.max(this.listeningScore, stats.listeningScore);
  }
  if (stats.readingScore !== undefined) {
    this.readingScore = Math.max(this.readingScore, stats.readingScore);
  }
  if (stats.grammarScore !== undefined) {
    this.grammarScore = Math.max(this.grammarScore, stats.grammarScore);
  }
  if (stats.writingScore !== undefined) {
    this.writingScore = Math.max(this.writingScore, stats.writingScore);
  }
  if (stats.totalStudyMinutes !== undefined) {
    // Không cộng dồn — lấy max
  }
  if (Array.isArray(stats.weeklyProgress)) {
    this.weeklyProgress = stats.weeklyProgress;
  }
  if (stats.skillsPracticed) {
    this.skillsPracticed = {
      vocab: Math.max(this.skillsPracticed.vocab ?? 0, stats.skillsPracticed.vocab ?? 0),
      grammar: Math.max(this.skillsPracticed.grammar ?? 0, stats.skillsPracticed.grammar ?? 0),
      pronunciation: Math.max(this.skillsPracticed.pronunciation ?? 0, stats.skillsPracticed.pronunciation ?? 0),
      listening: Math.max(this.skillsPracticed.listening ?? 0, stats.skillsPracticed.listening ?? 0),
      reading: Math.max(this.skillsPracticed.reading ?? 0, stats.skillsPracticed.reading ?? 0),
      writing: Math.max(this.skillsPracticed.writing ?? 0, stats.skillsPracticed.writing ?? 0),
      chat: Math.max(this.skillsPracticed.chat ?? 0, stats.skillsPracticed.chat ?? 0),
    };
  }
  return this;
};

/**
 * Format response
 */
englishLeaderboardEntrySchema.methods.toAPI = function (rank = null) {
  return {
    rank: rank ?? this._rank,
    name: this.name,
    avatar: this.avatar,
    grade: this.grade,
    xp: this.xp,
    level: this.level,
    streak: this.streak,
    wordsLearned: this.wordsLearned,
    weeklyProgress: this.weeklyProgress,
    unlockedBadges: this.unlockedBadges,
  };
};

// ─── Statics ─────────────────────────────────────────────────────────────────

/**
 * Upsert từ User document (gọi khi user sync stats)
 */
englishLeaderboardEntrySchema.statics.upsertFromUser = async function (user, stats) {
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

/**
 * Lấy top N leaderboard kèm rank
 */
englishLeaderboardEntrySchema.statics.getTop = async function (limit = 50, sortBy = 'xp') {
  const sortField = sortBy === 'streak' ? 'streak' : 'xp';
  const entries = await this.find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();

  return entries.map((e, idx) => ({
    rank: idx + 1,
    name: e.name,
    avatar: e.avatar,
    grade: e.grade,
    xp: e.xp,
    level: e.level,
    streak: e.streak,
    wordsLearned: e.wordsLearned,
    weeklyProgress: e.weeklyProgress,
    unlockedBadges: e.unlockedBadges,
  }));
};

/**
 * Lấy rank hiện tại của user
 */
englishLeaderboardEntrySchema.statics.getRank = async function (userId) {
  const entry = await this.findOne({ userId });
  if (!entry) return null;

  const rankXp = await this.countDocuments({ xp: { $gt: entry.xp } }) + 1;
  const rankStreak = await this.countDocuments({ streak: { $gt: entry.streak } }) + 1;

  return {
    xp: rankXp,
    streak: rankStreak,
    entry,
  };
};

/**
 * Xoá entry (khi user xóa tài khoản)
 */
englishLeaderboardEntrySchema.statics.removeByUserId = async function (userId) {
  return this.deleteOne({ userId });
};

const EnglishLeaderboardEntry = mongoose.model(
  'EnglishLeaderboardEntry',
  englishLeaderboardEntrySchema
);

export default EnglishLeaderboardEntry;
