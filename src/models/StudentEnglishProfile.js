/**
 * StudentEnglishProfile — MongoDB model cho Graph RAG English
 *
 * Schema design:
 * - 1 document = 1 student English profile
 * - Track 7 skills: vocabulary, grammar, pronunciation, listening, reading, writing, chat
 * - Dùng cho English Graph RAG (englishGraphRag.js)
 * - skillStatus: unknown → weak → learning → strong
 *
 * Index strategy:
 *   - userId: unique
 *   - studentSessionId: nullable (cho guest)
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const skillEntrySchema = new mongoose.Schema(
  {
    attempts: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    masteryLevel: { type: Number, default: 0, min: 0, max: 1 },
    status: {
      type: String,
      enum: ['unknown', 'weak', 'learning', 'strong'],
      default: 'unknown',
    },
    lastPracticed: { type: Date, default: null },
    // Skill-specific fields
    avgScore: { type: Number, default: 0 },        // pronunciation, writing, listening
    totalScore: { type: Number, default: 0 },     // cumulative score
    weakItemIds: { type: [String], default: [] }, // wordIds, topicIds tùy skill
    firstPracticed: { type: Date, default: null },
  },
  { _id: false }
);

const weakSkillSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },  // 'vocabulary', 'grammar', v.v.
    name: { type: String, required: true },
    masteryLevel: { type: Number, default: 0 },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  { _id: false }
);

const strongSkillSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    masteryLevel: { type: Number, default: 0 },
  },
  { _id: false }
);

const levelHistorySchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const studentEnglishProfileSchema = new mongoose.Schema(
  {
    // userId: unique — user đã đăng nhập
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      unique: true,
      sparse: true,
    },

    // studentSessionId: fallback cho guest
    studentSessionId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: null,
    },

    grade: { type: Number, min: 6, max: 12, default: 9 },

    // Skills map: key = skillId ('vocabulary', 'grammar', 'pronunciation', ...)
    skills: {
      type: Map,
      of: skillEntrySchema,
      default: () => {
        const defaults = {};
        for (const id of [
          'vocabulary', 'grammar', 'pronunciation', 'listening',
          'reading', 'writing', 'chat', 'speaking',
        ]) {
          defaults[id] = {};
        }
        return defaults;
      },
    },

    // Computed weak/strong skills
    weakSkills: [weakSkillSchema],
    strongSkills: [strongSkillSchema],

    // Adaptive level tracking
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    levelHistory: [levelHistorySchema],

    // Preferences
    preferredChatRole: {
      type: String,
      enum: ['teacher', 'native', 'ielts', 'friend'],
      default: 'teacher',
    },

    // Overall stats
    totalWordsLearned: { type: Number, default: 0 },
    totalStudyMinutes: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },

    // Timestamps
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
);

// ─── Compound index ────────────────────────────────────────────────────────────

// userId unique (sparse), studentSessionId nullable
studentEnglishProfileSchema.index({ userId: 1 }, { unique: true, sparse: true });
studentEnglishProfileSchema.index({ studentSessionId: 1 });
studentEnglishProfileSchema.index({ lastActiveAt: -1 });

// ─── Skill names map ───────────────────────────────────────────────────────────

const SKILL_NAMES = {
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
  pronunciation: 'Phát âm',
  listening: 'Nghe',
  reading: 'Đọc',
  writing: 'Viết',
  chat: 'Hội thoại',
  speaking: 'Nói',
};

// ─── Mastery thresholds (số attempt tối thiểu để đạt 'strong') ───────────────

const SKILL_THRESHOLDS = {
  vocabulary: 10,   // 10 lần học từ vựng
  grammar: 8,
  pronunciation: 6,
  listening: 6,
  reading: 6,
  writing: 5,
  chat: 10,
  speaking: 5,
};

const WEAK_THRESHOLD = {
  vocabulary: 3,
  grammar: 3,
  pronunciation: 3,
  listening: 3,
  reading: 3,
  writing: 3,
  chat: 3,
  speaking: 3,
};

// ─── Computed helpers ──────────────────────────────────────────────────────────

/**
 * Tính lại skill status từ entry
 */
function computeSkillStatus(skillId, entry) {
  const attempts = entry?.attempts ?? 0;
  const correct = entry?.correct ?? 0;
  const avgScore = entry?.avgScore ?? 0;

  if (attempts < WEAK_THRESHOLD[skillId] ?? 3) return 'unknown';
  const ratio = attempts > 0 ? correct / attempts : 0;
  if (avgScore >= 75 && attempts >= SKILL_THRESHOLDS[skillId] ?? 10) return 'strong';
  if (ratio < 0.5 || avgScore < 40) return 'weak';
  return 'learning';
}

function computeMasteryLevel(skillId, entry) {
  const attempts = entry?.attempts ?? 0;
  const correct = entry?.correct ?? 0;
  const avgScore = entry?.avgScore ?? 0;
  if (attempts === 0) return 0;
  const attemptRatio = Math.min(1, attempts / (SKILL_THRESHOLDS[skillId] ?? 10));
  const scoreRatio = avgScore / 100;
  return Math.round((attemptRatio * 0.3 + scoreRatio * 0.7) * 100) / 100;
}

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Ghi nhận 1 lần practice skill
 */
studentEnglishProfileSchema.methods.recordSkillPractice = function (
  skillId,
  score,   // 0-100
  isCorrect = null  // hoặc truyền isCorrect thay vì score
) {
  if (!this.skills.has(skillId)) {
    this.skills.set(skillId, {
      attempts: 0, correct: 0, masteryLevel: 0,
      status: 'unknown', lastPracticed: null,
      avgScore: 0, totalScore: 0, weakItemIds: [],
      firstPracticed: null,
    });
  }

  const entry = this.skills.get(skillId);
  const finalScore = isCorrect !== null ? (isCorrect ? 100 : 0) : score;

  entry.attempts += 1;
  if (isCorrect !== null) {
    if (isCorrect) entry.correct += 1;
  }
  entry.totalScore = (entry.totalScore || 0) + finalScore;
  entry.avgScore = Math.round(entry.totalScore / entry.attempts);
  entry.lastPracticed = new Date();
  if (!entry.firstPracticed) entry.firstPracticed = new Date();

  entry.masteryLevel = computeMasteryLevel(skillId, entry);
  entry.status = computeSkillStatus(skillId, entry);

  this.recomputeSkillStatuses();
  this.lastActiveAt = new Date();
  return this;
};

/**
 * Thêm từ vựng mới vào weak list
 */
studentEnglishProfileSchema.methods.addWeakWord = function (skillId, wordId) {
  const entry = this.skills.get(skillId);
  if (entry && !entry.weakItemIds.includes(wordId)) {
    entry.weakItemIds.push(wordId);
  }
  return this;
};

/**
 * Tính lại weakSkills + strongSkills
 */
studentEnglishProfileSchema.methods.recomputeSkillStatuses = function () {
  const weak = [];
  const strong = [];

  for (const skillId of this.skills.keys()) {
    const entry = this.skills.get(skillId);
    const status = computeSkillStatus(skillId, entry);
    const mastery = computeMasteryLevel(skillId, entry);
    entry.status = status;
    entry.masteryLevel = mastery;

    if (status === 'weak') {
      const severity =
        (entry.avgScore ?? 0) < 30 ? 'high'
        : (entry.avgScore ?? 0) < 50 ? 'medium'
        : 'low';
      weak.push({ id: skillId, name: SKILL_NAMES[skillId] || skillId, masteryLevel: mastery, severity });
    } else if (status === 'strong') {
      strong.push({ id: skillId, name: SKILL_NAMES[skillId] || skillId, masteryLevel: mastery });
    }
  }

  // Sắp xếp weak theo severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  weak.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  strong.sort((a, b) => b.masteryLevel - a.masteryLevel);

  this.weakSkills = weak;
  this.strongSkills = strong;
};

/**
 * Lấy weak skill yếu nhất (để AI cá nhân hóa)
 */
studentEnglishProfileSchema.methods.getWeakestSkill = function () {
  if (this.weakSkills.length === 0) return null;
  return this.weakSkills[0];
};

/**
 * Gợi ý skill cần cải thiện dựa trên prerequisites (từ englishGraph)
 */
studentEnglishProfileSchema.methods.getPrerequisiteSkillsToReview = function (skillId) {
  const PREREQS = {
    grammar: ['vocabulary'],
    writing: ['vocabulary', 'grammar'],
    listening: ['vocabulary'],
    reading: ['vocabulary', 'listening'],
    pronunciation: ['vocabulary'],
    conversation: ['vocabulary', 'grammar'],
  };
  const prereqs = PREREQS[skillId] || [];
  return prereqs
    .filter((prereqId) => {
      const entry = this.skills.get(prereqId);
      return entry && entry.status !== 'strong';
    })
    .map((prereqId) => ({
      id: prereqId,
      name: SKILL_NAMES[prereqId],
      status: this.skills.get(prereqId)?.status ?? 'unknown',
    }));
};

/**
 * Format để inject vào English AI prompt
 */
studentEnglishProfileSchema.methods.buildRagContext = function (module) {
  const parts = [];
  const weakest = this.getWeakestSkill();
  if (weakest) {
    parts.push(`Học sinh đang yếu: ${weakest.name} (mức ${weakest.severity}).`);
  }
  if (this.currentLevel) {
    parts.push(`Level hiện tại: ${this.currentLevel}.`);
  }
  if (this.strongSkills.length > 0) {
    const strongNames = this.strongSkills.map((s) => s.name).join(', ');
    parts.push(`Đã vững: ${strongNames}.`);
  }
  if (parts.length === 0) return '';
  return `[English RAG — Cá nhân hóa]\n${parts.join('\n')}`;
};

// ─── Statics ─────────────────────────────────────────────────────────────────

/**
 * Upsert profile
 */
studentEnglishProfileSchema.statics.upsert = async function (userId, sessionId, updates = {}) {
  const query = userId ? { userId } : { studentSessionId: sessionId };
  return this.findOneAndUpdate(
    query,
    { $set: { ...updates, userId: userId ?? undefined, studentSessionId: sessionId ?? undefined } },
    { upsert: true, new: true, runValidators: true }
  );
};

/**
 * Ghi nhận practice skill
 */
studentEnglishProfileSchema.statics.recordSkill = async function (userId, skillId, score) {
  let profile = await this.findOne({ userId });
  if (!profile) {
    profile = new this({ userId });
  }
  profile.recordSkillPractice(skillId, score);
  await profile.save();
  return profile;
};

/**
 * Link guest session → userId
 */
studentEnglishProfileSchema.statics.linkToUser = async function (sessionId, userId) {
  // Merge guest profile vào user profile
  const guestProfile = await this.findOne({ studentSessionId: sessionId });
  if (!guestProfile) return null;

  let userProfile = await this.findOne({ userId });

  if (userProfile) {
    // Merge skills: lấy max mastery
    for (const skillId of guestProfile.skills.keys()) {
      const guestEntry = guestProfile.skills.get(skillId);
      const userEntry = userProfile.skills.get(skillId);
      if (!userEntry || guestEntry.masteryLevel > userEntry.masteryLevel) {
        userProfile.skills.set(skillId, guestEntry);
      }
    }
    userProfile.recomputeSkillStatuses();
    await userProfile.save();
    await guestProfile.deleteOne();
    return userProfile;
  }

  // Chỉ link
  guestProfile.userId = userId;
  guestProfile.studentSessionId = null;
  await guestProfile.save();
  return guestProfile;
};

const StudentEnglishProfile = mongoose.model(
  'StudentEnglishProfile',
  studentEnglishProfileSchema
);

export default StudentEnglishProfile;
