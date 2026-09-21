const Document = require('../model/documents')
const Subject = require('../model/subject')
const { removeUploadedLinks } = require('../utils/cloudinary')

const listSubjects = async (req, res) => {
  const subjects = await Subject.find().sort({ semester: 1, name: 1 })
  return res.json({ subjects })
}

const getSubject = async (req, res) => {
  const subject = await Subject.findById(req.params.id)
  if (!subject) return res.status(404).json({ message: 'Subject not found' })
  return res.json({ subject })
}

const createSubject = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const semester = Number(req.body.semester)

  if (!name || !Number.isInteger(semester) || semester < 1 || semester > 7) {
    return res.status(400).json({ message: 'A subject name and a semester from 1 to 7 are required' })
  }

  const subject = await Subject.create({
    name,
    semester,
    owner: req.auth.userId,
  })

  return res.status(201).json({ subject })
}

const deleteSubject = async (req, res) => {
  const subject = await Subject.findById(req.params.id)

  if (!subject) {
    return res.status(404).json({ message: 'Subject not found' })
  }

  if (req.auth.role !== 'HOD' && subject.owner.toString() !== req.auth.userId) {
    return res.status(403).json({ message: 'Only the subject owner or HOD can delete this subject' })
  }

  const documents = await Document.find({ subject: subject._id })
  await removeUploadedLinks(documents)
  await Document.deleteMany({ subject: subject._id })
  await subject.deleteOne()

  return res.json({ message: 'Subject deleted successfully' })
}

module.exports = { getSubject, listSubjects, createSubject, deleteSubject }
