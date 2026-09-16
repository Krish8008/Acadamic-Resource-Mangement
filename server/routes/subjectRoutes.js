const express = require('express')
const { createSubject, deleteSubject, getSubject, listSubjects } = require('../controller/subjectController')
const requireAuth = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/', listSubjects)
router.get('/:id', getSubject)
router.post('/', requireAuth, requireRole('teacher', 'HOD'), createSubject)
router.delete('/:id', requireAuth, requireRole('teacher', 'HOD'), deleteSubject)

module.exports = router
