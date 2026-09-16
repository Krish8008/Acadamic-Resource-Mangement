const mongoose = require('mongoose')

const linkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: [100, 'Link label cannot exceed 100 characters'],
    },
    url: {
      type: String,
      required: [true, 'Link URL is required'],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['image', 'raw', 'video'],
      default: 'image',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
)

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      minlength: [1, 'Document title is required'],
      maxlength: [150, 'Document title cannot exceed 150 characters'],
    },
    name: {
      type: String,
      required: [true, 'Document name is required'],
      enum: {
        values: ['assignment', 'previous-year-question-paper', 'notes'],
        message: 'Document name must be assignment, previous-year-question-paper, or notes',
      },
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document owner is required'],
    },
    links: {
      type: [linkSchema],
      default: [],
    },
    defaultLink: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema)