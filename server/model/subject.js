const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [2, 'Subject name must be at least 2 characters'],
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subject owner is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 7'],
      max: [7, 'Semester must be between 1 and 7'],
      validate: {
        validator: Number.isInteger,
        message: 'Semester must be a whole number',
      },
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema)