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
