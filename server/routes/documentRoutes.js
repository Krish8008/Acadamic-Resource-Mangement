const express = require('express')
const { createDocument, deleteDocument, listDocuments, streamDocumentFile } = require('../controller/documentController')
const requireAuth = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')
const upload = require('../middleware/uploadMiddleware')

const router = express.Router()

router.get('/', listDocuments)
router.get('/:id/file/:linkIndex', streamDocumentFile)
router.post(
  '/',
  requireAuth,
  requireRole('teacher', 'HOD'),
  upload.array('files', 10),
  createDocument,
)
router.delete('/:id', requireAuth, deleteDocument)

module.exports = router
