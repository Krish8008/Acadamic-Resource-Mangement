const express = require('express')
const { deleteTeacher, listTeachers, login, register } = require('../controller/authController')
const requireAuth = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')
const optionalAuth = require('../middleware/optionalAuthMiddleware')

const router = express.Router()

router.post('/register', optionalAuth, register)
router.post('/login', login)
router.get('/teachers', requireAuth, requireRole('HOD'), listTeachers)
router.delete('/teachers/:id', requireAuth, requireRole('HOD'), deleteTeacher)

module.exports = router
