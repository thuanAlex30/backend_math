/**
 * StudentMathProfile — MongoDB model cho Graph RAG Math
 *
 * Thay thế: Backend/data/profiles/{sessionId}.json
 *
 * Schema design:
 * - 1 document = 1 student session (localStorage key "mathmaster-student-session")
 * - topics: Map<topicId, { errorCount, correctCount, lastSeen, masteryLevel, status }>
 * - Preferences: preferredStyle, goals, dailyMinutes, studySlots, preferredVoice, speechRate
 *
 * Index strategy:
 *   - sessionId: unique (fast lookup)
 *   - userId: nullable, cho user đã đăng nhập
 *   - topics._id (Map keys): text index nếu cần tìm kiếm topic
 *
 * Backward compatible: Khi migrate từ file JSON, chỉ cần upsert document mới.
 * graphRag.js hiện tại vẫn hoạt động — chỉ cần thay đổi get/set storage.
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const topicEntrySchema = new mongoose.Schema(
  {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    lastAttempt: { type: Date, default: null },
    masteryLevel: { type: Number, default: 0, min: 0, max: 1 },
    status: {
      type: String,
      enum: ['unknown', 'learning', 'weak', 'strong'],
      default: 'unknown',
    },
    // SM-2 style tracking
    consecutiveCorrect: { type: Number, default: 0 },
    consecutiveWrong: { type: Number, default: 0 },
    lastCorrect: { type: Date, default: null },
    lastWrong: { type: Date, default: null },
    // Priority score cho thứ tự ôn tập (computed)
    priority: { type: Number, default: 0 },
    // Timestamps
    firstSeen: { type: Date, default: null },
  },
  { _id: false }
);

const weakTopicSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    grade: { type: Number, default: null },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  { _id: false }
);

const strongTopicSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    grade: { type: Number, default: null },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const studentMathProfileSchema = new mongoose.Schema(
  {
    // Unique session ID (từ localStorage "mathmaster-student-session")
    studentSessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 64,
      index: true,
    },

    // userId: null → guest (chưa đăng nhập)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Grade hiện tại của học sinh (6–12)
    grade: {
      type: Number,
      min: 6,
      max: 12,
      default: 9,
    },

    // Topics map: key = topicId (từ mathGraph), value = topicEntry
    // Dùng Map để O(1) lookup/update, dễ iterate
    topics: {
      type: Map,
      of: topicEntrySchema,
      default: {},
    },

    // Computed weak/strong topics (cache để tránh tính lại mỗi request)
    weakTopics: [weakTopicSchema],
    strongTopics: [strongTopicSchema],

    // Preferences từ onboarding + learning style
    preferredStyle: {
      type: String,
      enum: ['read', 'tts', 'graph', 'chat'],
      default: null,
    },
    goals: {
      type: [String],
      enum: ['on_grade', 'thpt', 'english_exam', 'daily_practice'],
      default: ['on_grade'],
    },
    dailyMinutes: {
      type: Number,
      enum: [15, 30, 45, 60],
      default: 30,
    },
    studySlots: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'weekend'],
      default: ['evening'],
    },
    preferredVoice: {
      type: String,
      enum: ['male', 'female'],
      default: 'female',
    },
    speechRate: {
      type: Number,
      min: 0.5,
      max: 2.0,
      default: 1.0,
    },

    // Metadata
    totalSolveCount: { type: Number, default: 0 },
    totalPracticeCount: { type: Number, default: 0 },
    totalStudyMinutes: { type: Number, default: 0 },

    // Last active
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    // Không version document (không cần optimistic locking)
    versionKey: false,
  }
);

// ─── Virtuals & Methods ────────────────────────────────────────────────────────

/**
 * Tính lại weakTopics + strongTopics từ topics Map
 * Gọi sau khi update profile
 */
studentMathProfileSchema.methods.recomputeTopicStatuses = function () {
  const MASTERY_THRESHOLD = 3;

  const weak = [];
  const strong = [];

  for (const [topicId, entry] of this.topics) {
    // Dùng đúng field từ topicEntrySchema: consecutiveWrong, consecutiveCorrect
    const errCount = entry.consecutiveWrong ?? 0;
    const correctCount = entry.consecutiveCorrect ?? 0;
    const total = correctCount + errCount;
    if (total === 0) continue;

    const mastery = correctCount / total;

    // Status
    let status = 'unknown';
    if (errCount > correctCount || errCount >= 2) {
      status = 'weak';
    } else if (correctCount >= MASTERY_THRESHOLD) {
      status = 'strong';
    } else {
      status = 'learning';
    }

    // Severity
    let severity = 'low';
    const diff = errCount - correctCount;
    if (diff >= 3 || errCount >= 4) severity = 'high';
    else if (diff >= 1 || errCount >= 2) severity = 'medium';

    // Priority: cao = cần ôn trước
    const priority = errCount * 2 + (total >= 5 ? -correctCount : 0);

    // Update entry in Map
    entry.masteryLevel = mastery;
    entry.status = status;
    entry.priority = priority;

    if (status === 'weak') {
      weak.push({ id: topicId, name: topicId, grade: null, severity });
    } else if (status === 'strong') {
      strong.push({ id: topicId, name: topicId, grade: null });
    }
  }

  // Sort weak by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  weak.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  strong.sort((a, b) => b.id.localeCompare(a.id));

  this.weakTopics = weak;
  this.strongTopics = strong;
};

/**
 * Update topic sau 1 attempt
 * @param {string} topicId
 * @param {boolean} isCorrect
 */
studentMathProfileSchema.methods.recordAttempt = function (topicId, isCorrect) {
  if (!this.topics.has(topicId)) {
    this.topics.set(topicId, {
      totalAttempts: 0,
      correctAttempts: 0,
      lastAttempt: null,
      masteryLevel: 0,
      status: 'unknown',
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      lastCorrect: null,
      lastWrong: null,
      priority: 0,
      firstSeen: new Date(),
    });
  }

  const entry = this.topics.get(topicId);
  entry.totalAttempts += 1;
  entry.lastAttempt = new Date();

  if (isCorrect) {
    entry.correctAttempts += 1;
    entry.consecutiveCorrect += 1;
    entry.consecutiveWrong = 0;
    entry.lastCorrect = new Date();
  } else {
    entry.consecutiveWrong += 1;
    entry.consecutiveCorrect = 0;
    entry.lastWrong = new Date();
  }

  this.recomputeTopicStatuses();
  this.totalSolveCount += 1;
  this.lastActiveAt = new Date();
};

/**
 * Lấy weak topics xếp theo priority (cao nhất trước)
 */
studentMathProfileSchema.methods.getWeakTopicsSorted = function () {
  const entries = [];
  for (const [topicId] of this.topics) {
    const entry = this.topics.get(topicId);
    if (entry.status === 'weak') {
      entries.push({ id: topicId, priority: entry.priority });
    }
  }
  return entries.sort((a, b) => b.priority - a.priority).map((e) => e.id);
};

/**
 * Lấy profile data format cũ (backward compatible với graphRag.js logic)
 * Dùng cho các hàm traverseWeakPrerequisites, getTopicStatus trong graphRag.js
 */
studentMathProfileSchema.methods.toLegacyFormat = function () {
  const legacyTopics = {};
  for (const [topicId, entry] of this.topics) {
    legacyTopics[topicId] = {
      errorCount: entry.consecutiveWrong > 0 ? entry.consecutiveWrong : 0,
      correctCount: entry.consecutiveCorrect > 0 ? entry.consecutiveCorrect : 0,
      lastSeen: entry.lastAttempt?.toISOString() ?? null,
    };
  }
  return {
    sessionId: this.studentSessionId,
    topics: legacyTopics,
  };
};

// ─── Statics ──────────────────────────────────────────────────────────────────

/**
 * Upsert profile — tạo mới hoặc cập nhật existing
 */
studentMathProfileSchema.statics.upsert = async function (sessionId, updates = {}) {
  return this.findOneAndUpdate(
    { studentSessionId: sessionId },
    { $set: { ...updates, studentSessionId: sessionId } },
    { upsert: true, new: true, runValidators: true }
  );
};

/**
 * Record 1 attempt cho topic
 */
studentMathProfileSchema.statics.recordAttempt = async function (sessionId, topicId, isCorrect) {
  const profile = await this.findOne({ studentSessionId: sessionId });
  if (!profile) {
    // Tạo profile mới nếu chưa có
    const newProfile = new this({ studentSessionId: sessionId });
    newProfile.recordAttempt(topicId, isCorrect);
    await newProfile.save();
    return newProfile;
  }
  profile.recordAttempt(topicId, isCorrect);
  await profile.save();
  return profile;
};

/**
 * Link sessionId → userId (khi user đăng nhập)
 */
studentMathProfileSchema.statics.linkToUser = async function (sessionId, userId) {
  return this.findOneAndUpdate(
    { studentSessionId: sessionId },
    { $set: { userId } },
    { new: true }
  );
};

/**
 * Migrate từ JSON file lên MongoDB
 */
studentMathProfileSchema.statics.migrateFromJson = async function (sessionId, jsonTopics) {
  const profile = await this.findOne({ studentSessionId: sessionId });
  if (profile) return profile; // Đã migrate rồi

  const newProfile = new this({ studentSessionId: sessionId });
  for (const [topicId, data] of Object.entries(jsonTopics)) {
    newProfile.topics.set(topicId, {
      totalAttempts: (data.correctCount || 0) + (data.errorCount || 0),
      correctAttempts: data.correctCount || 0,
      errorCount: data.errorCount || 0,
      lastAttempt: data.lastSeen ? new Date(data.lastSeen) : null,
      masteryLevel: data.correctCount >= 3 ? 1 : 0,
      status: data.correctCount >= 3 ? 'strong' : 'unknown',
      consecutiveCorrect: data.correctCount || 0,
      consecutiveWrong: data.errorCount || 0,
      lastCorrect: data.lastSeen && data.correctCount > 0 ? new Date(data.lastSeen) : null,
      lastWrong: data.lastSeen && data.errorCount > 0 ? new Date(data.lastSeen) : null,
      priority: (data.errorCount || 0) * 2,
      firstSeen: data.lastSeen ? new Date(data.lastSeen) : null,
    });
  }
  newProfile.recomputeTopicStatuses();
  await newProfile.save();
  return newProfile;
};

// ─── Indexes ─────────────────────────────────────────────────────────────────

// topics Map keys → text index cho trường hợp cần search
studentMathProfileSchema.index({ 'topics._id': 1 });
studentMathProfileSchema.index({ lastActiveAt: -1 });

const StudentMathProfile = mongoose.model('StudentMathProfile', studentMathProfileSchema);

export default StudentMathProfile;
