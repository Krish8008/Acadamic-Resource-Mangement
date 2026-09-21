const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const mongoose = require('mongoose')
const authRoutes = require('./routes/authRoutes')
const subjectRoutes = require('./routes/subjectRoutes')
const documentRoutes = require('./routes/documentRoutes')

const app = express()
const port = process.env.PORT || 3000
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL || 'https://acadamic-resource-mangement.onrender.com')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    const error = new Error('This origin is not allowed to access the API')
    error.status = 403
    return callback(error)
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/', (req, res) => {
  res.json({ message: 'API is running' })
})

app.use('/api', authRoutes)
app.use('/api/subjects', subjectRoutes)
app.use('/api/documents', documentRoutes)

app.use((error, req, res, next) => {
  if (error.status === 403) {
    return res.status(403).json({ message: error.message })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must contain valid JSON' })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' })
  }

  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ message: error.message })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'The requested record ID is invalid' })
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 10 MB or smaller' : error.message })
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with those details already exists' })
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(error.errors).map((validationError) => validationError.message).join(', '),
    })
  }

  console.error(error)
  return res.status(500).json({ message: 'Internal server error' })
})

app.use((req, res) => res.status(404).json({ message: 'API route not found' }))

const startServer = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured')
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  for (const variable of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!process.env[variable]) {
      throw new Error(`${variable} is not configured`)
    }
  }

  await mongoose.connect(process.env.MONGO_URI)
  app.listen(port, () => {
    console.log(`API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Unable to start server:', error.message)
  process.exit(1)
})
