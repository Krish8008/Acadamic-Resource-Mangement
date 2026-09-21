const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../model/user')
const Subject = require('../model/subject')
const Document = require('../model/documents')
const { removeUploadedLinks } = require('../utils/cloudinary')
const { clearAuthCookies, setAuthCookies } = require('../utils/authCookies')

const createToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  )

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  role: user.role,
})

const register = async (req, res) => {
  const { name, username, password } = req.body
  const role = typeof req.body.role === 'string' ? req.body.role.trim() : ''

  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'Name, username, password, and role are required' })
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' })
  }

  if (!['HOD', 'teacher', 'class-teacher'].includes(role)) {
    return res.status(400).json({ message: 'Role must be HOD, teacher, or class-teacher' })
  }

  const hodExists = await User.exists({ role: 'HOD' })

  if (!hodExists && role !== 'HOD') {
    return res.status(400).json({ message: 'The first registration must create an HOD account' })
  }

  if (hodExists && !req.auth) {
    return res.status(401).json({ message: 'Only an authenticated HOD can register users' })
  }

  if (hodExists && req.auth.role !== 'HOD') {
    return res.status(403).json({ message: 'Only an authenticated HOD can register users' })
  }

  if (hodExists && role === 'HOD') {
    return res.status(409).json({ message: 'Only one HOD account can be registered' })
  }

  const normalizedUsername = username.trim().toLowerCase()
  const existingUser = await User.findOne({ username: normalizedUsername })

  if (existingUser) {
    return res.status(409).json({ message: 'Username is already in use' })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await User.create({
    name,
    username: normalizedUsername,
    password: hashedPassword,
    role,
  })

  return res.status(201).json({
    message: 'User registered successfully',
    user: publicUser(user),
  })
}

const login = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' })
  }

  const user = await User.findOne({ username: username.trim().toLowerCase() }).select('+password')
  const passwordMatches = user && (await bcrypt.compare(password, user.password))

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid username or password' })
  }

  const userData = publicUser(user)
  setAuthCookies(res, createToken(user))

  return res.json({ message: 'Login successful', user: userData })
}

const logout = (req, res) => {
  clearAuthCookies(res)
  return res.json({ message: 'Logged out successfully' })
}

const listTeachers = async (req, res) => {
  const teachers = await User.find({ role: { $in: ['teacher', 'class-teacher'] } })
    .select('name username role createdAt')
    .sort({ name: 1 })

  return res.json({ teachers })
}

const deleteTeacher = async (req, res) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    role: { $in: ['teacher', 'class-teacher'] },
  })

  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' })
  }

  const subjects = await Subject.find({ owner: teacher._id }).select('_id')
  const subjectIds = subjects.map((subject) => subject._id)
  const subjectDocuments = subjectIds.length
    ? await Document.find({ subject: { $in: subjectIds } })
    : []
  const ownedDocuments = await Document.find({ owner: teacher._id })
  const documents = [...new Map(
    [...subjectDocuments, ...ownedDocuments].map((document) => [document._id.toString(), document]),
  ).values()]

  await removeUploadedLinks(documents)
  if (subjectIds.length) {
    await Document.deleteMany({ subject: { $in: subjectIds } })
    await Subject.deleteMany({ _id: { $in: subjectIds } })
  }
  await Document.deleteMany({ owner: teacher._id })
  await User.deleteOne({ _id: teacher._id })

  return res.json({ message: 'Teacher and associated resources deleted successfully' })
}

module.exports = { register, login, logout, listTeachers, deleteTeacher }
