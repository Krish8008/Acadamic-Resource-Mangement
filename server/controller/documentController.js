const Document = require('../model/documents')
const Subject = require('../model/subject')
const { removeUploadedLinks } = require('../utils/cloudinary')

const createDocument = async (req, res) => {
  const { title, name, subject, semester, links = '[]', defaultLink = '' } = req.body
  const subjectRecord = await Subject.findById(subject)

  if (!subjectRecord) {
    return res.status(404).json({ message: 'Subject not found' })
  }

  if (req.auth.role !== 'HOD' && subjectRecord.owner.toString() !== req.auth.userId) {
    return res.status(403).json({ message: 'Only the subject owner or HOD can add documents' })
  }
  let externalLinks

  try {
    externalLinks = typeof links === 'string' ? JSON.parse(links) : links
  } catch {
    return res.status(400).json({ message: 'links must be a valid JSON array' })
  }

  if (!Array.isArray(externalLinks)) {
    return res.status(400).json({ message: 'links must be an array' })
  }

  const normalizedLinks = externalLinks.map((link) =>
    typeof link === 'string' ? { url: link } : link,
  )
  const uploadedLinks = (req.files || []).map((file) => ({
    label: file.originalname,
    url: file.path,
    publicId: file.filename,
    resourceType: file.resource_type || (file.mimetype.startsWith('image/') ? 'image' : 'raw'),
  }))
  const uploadedDocuments = uploadedLinks.filter((link) => link.resourceType !== 'image')
  if (uploadedDocuments.length > 1) {
    return res.status(400).json({ message: 'Only one PDF or document file can be uploaded for the same document title' })
  }

  const existingDocument = await Document.findOne({ subject, name, title })
  if (existingDocument && uploadedDocuments.length > 0 && existingDocument.links.some((link) => link.resourceType !== 'image' && link.publicId)) {
    return res.status(400).json({ message: 'Only one PDF or document file can be uploaded for the same document title' })
  }

  if (existingDocument) {
    existingDocument.links.push(...normalizedLinks, ...uploadedLinks)
    if (!existingDocument.defaultLink) existingDocument.defaultLink = existingDocument.links[0]?.url || ''
    await existingDocument.save()
    return res.status(201).json({ document: existingDocument })
  }

  const allLinks = [...normalizedLinks, ...uploadedLinks]
  const documentDefaultLink = defaultLink || allLinks[0]?.url || ''

  const document = await Document.create({
    title,
    name,
    subject,
    semester,
    owner: req.auth.userId,
    links: allLinks,
    defaultLink: documentDefaultLink,
  })

  return res.status(201).json({ document })
}

const listDocuments = async (req, res) => {
  const documents = await Document.find()
    .populate('subject', 'name semester')
    .populate('owner', 'name username role')
    .sort({ semester: 1, createdAt: -1 })

  return res.json({ documents })
}

const deleteDocument = async (req, res) => {
  const document = await Document.findById(req.params.id)

  if (!document) {
    return res.status(404).json({ message: 'Document not found' })
  }

  if (req.auth.role !== 'HOD' && document.owner.toString() !== req.auth.userId) {
    return res.status(403).json({ message: 'Only the document owner or HOD can delete this document' })
  }

  await removeUploadedLinks([document])
  await document.deleteOne()

  return res.json({ message: 'Document deleted successfully' })
}

const streamDocumentFile = async (req, res) => {
  const linkIndex = Number(req.params.linkIndex)
  const document = await Document.findById(req.params.id).select('links')

  if (!document || !Number.isInteger(linkIndex) || linkIndex < 0 || linkIndex >= document.links.length) {
    return res.status(404).json({ message: 'Document file not found' })
  }

  const link = document.links[linkIndex]
  if (!link.publicId) {
    return res.redirect(link.url)
  }

  const response = await fetch(link.url)
  if (!response.ok || !response.body) {
    return res.status(502).json({ message: 'Unable to load uploaded file' })
  }

  const contentType = link.resourceType === 'raw' && /\.pdf(?:$|\?)/i.test(link.url)
    ? 'application/pdf'
    : response.headers.get('content-type') || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(link.label || 'document')}"`)
  return res.send(Buffer.from(await response.arrayBuffer()))
}

module.exports = { createDocument, deleteDocument, listDocuments, streamDocumentFile }
