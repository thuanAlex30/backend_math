/**
 * DailyPlan — MongoDB model cho kế hoạch học tập hàng ngày
 *
 * Thay thế: Backend/data/daily-plans/{sessionId}_{YYYY-MM-DD}.json
 *
 * Schema design:
 * - 1 document = 1 plan/ngày/session
 * - { studentSessionId, date } là unique compound key
 * - Tasks: embedded array (3 task/ngày)
 * - Streak rescue: 1 lần/tuần
 *
 * Index strategy:
 *   - compound unique index: { studentSessionId: 1, date: 1 }
 *   - query thường: find by sessionId + date
 */

import mongoose from 'mongoose';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const ctaParamsSchema = new mongoose.Schema(
  {
    mode: { type: String, default: null },
    topic: { type: String, default: null },
    topicName: { type: String, default: null },
    module: { type: String, default: null },
    grade: { type: Number, default: null },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    // Task id — deterministic hash: `${type}-${hashStr(sessionId + date)}`
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['math', 'english', 'review'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    ctaLabel: { type: String, default: 'Làm ngay' },
    ctaRoute: { type: String, default: '/tutor' },
    // ctaParams chứa: { mode, topic, topicName, module, grade }
    ctaParams: { type: ctaParamsSchema, default: {} },
    estimatedMinutes: { type: Number, default: 10 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const dailyPlanSchema = new mongoose.Schema(
  {
    // Unique compound key
    studentSessionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    grade: {
      type: Number,
      min: 6,
      max: 12,
      default: 9,
    },

    tasks: {
      type: [taskSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Tối đa 10 tasks/ngày',
      },
    },

    // Streak rescue
    streakRescueUsed: { type: Boolean, default: false },
    streakRescueUsedWeek: { type: String, default: null }, // ISO week key "YYYY-Www"

    // Metadata
    generatedAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: false },
    versionKey: false,
  }
);

// ─── Compound unique index ─────────────────────────────────────────────────────
dailyPlanSchema.index({ studentSessionId: 1, date: 1 }, { unique: true });
dailyPlanSchema.index({ userId: 1, date: 1 });
dailyPlanSchema.index({ date: 1 });

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Hoàn thành 1 task
 * @param {string} taskId
 * @returns {DailyPlan} this
 */
dailyPlanSchema.methods.completeTask = function (taskId) {
  const task = this.tasks.find((t) => t.id === taskId);
  if (task && !task.completed) {
    task.completed = true;
    task.completedAt = new Date();
    this.lastUpdatedAt = new Date();
  }
  return this;
};

/**
 * Lấy số task chưa hoàn thành
 */
dailyPlanSchema.methods.getPendingCount = function () {
  return this.tasks.filter((t) => !t.completed).length;
};

/**
 * Kiểm tra streak rescue có thể dùng không (1 lần/tuần)
 */
dailyPlanSchema.methods.canUseStreakRescue = function () {
  if (this.streakRescueUsed) return false;
  const weekKey = getISOWeekKey(new Date());
  return this.streakRescueUsedWeek !== weekKey;
};

/**
 * Dùng streak rescue
 */
dailyPlanSchema.methods.useStreakRescue = function () {
  this.streakRescueUsed = true;
  this.streakRescueUsedWeek = getISOWeekKey(new Date());
  this.lastUpdatedAt = new Date();
  return this;
};

// ─── Statics ─────────────────────────────────────────────────────────────────

/**
 * Lấy hoặc tạo plan mới cho ngày
 */
dailyPlanSchema.statics.getOrCreate = async function (sessionId, date, defaultPlan = {}) {
  let plan = await this.findOne({ studentSessionId: sessionId, date });
  if (!plan) {
    plan = new this({
      studentSessionId: sessionId,
      date,
      tasks: defaultPlan.tasks || [],
      grade: defaultPlan.grade || 9,
      userId: defaultPlan.userId || null,
    });
    await plan.save();
  }
  return plan;
};

/**
 * Hoàn thành 1 task
 */
dailyPlanSchema.statics.completeTask = async function (sessionId, taskId) {
  const today = new Date().toISOString().slice(0, 10);
  const plan = await this.findOne({ studentSessionId: sessionId, date: today });
  if (!plan) return null;
  plan.completeTask(taskId);
  await plan.save();
  return plan;
};

/**
 * Lấy plan hôm nay
 */
dailyPlanSchema.statics.getToday = async function (sessionId) {
  const today = new Date().toISOString().slice(0, 10);
  return this.findOne({ studentSessionId: sessionId, date: today });
};

/**
 * Lấy plan tuần (7 ngày gần nhất)
 */
dailyPlanSchema.statics.getWeek = async function (sessionId) {
  const plans = await this.find({ studentSessionId: sessionId })
    .sort({ date: -1 })
    .limit(7);
  return plans;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getISOWeekKey(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1); // Monday
  return start.toISOString().slice(0, 10);
}

const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);

export default DailyPlan;
