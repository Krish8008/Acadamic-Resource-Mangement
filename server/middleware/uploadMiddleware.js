const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: process.env.CLOUDINARY_FOLDER || 'erp-documents',
    resource_type: (req, file) => (
      file.mimetype.startsWith('image/') ? 'image' : 'raw'
    ),
  },
})

const fileFilter = (req, file, callback) => {
  const allowedTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ])

  if (!allowedTypes.has(file.mimetype) && !file.mimetype.startsWith('image/')) {
    return callback(new Error('Only PDF, PowerPoint, Word, text, and image files are allowed'))
  }

  return callback(null, true)
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024) },
})
