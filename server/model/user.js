const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9._-]+$/, 'Username can contain only letters, numbers, dots, underscores, and hyphens'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['HOD', 'teacher', 'class-teacher'],
        message: 'Role must be HOD, teacher, or class-teacher',
      },
      required: [true, 'Role is required'],
    },
  },
  {
    timestamps: true,
  },
)

userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'HOD' } },
)

module.exports = mongoose.models.User || mongoose.model('User', userSchema)