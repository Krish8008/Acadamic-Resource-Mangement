const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../model/user')
const sendAuthenticationError = require('./authError')
const { AUTH_COOKIE } = require('../utils/authCookies')

const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE]

  if (!token) return next()

  let auth
  try {
    auth = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return sendAuthenticationError(res, 'Invalid or expired authentication token')
  }

  if (
    !auth ||
    typeof auth !== 'object' ||
    typeof auth.userId !== 'string' ||
    !mongoose.isValidObjectId(auth.userId)
  ) {
    return sendAuthenticationError(res, 'Invalid authentication token')
  }

  const user = await User.findById(auth.userId).select('role')

  if (!user) {
    return sendAuthenticationError(res, 'User account is no longer active', 'AUTH_ACCOUNT_INACTIVE')
  }

  req.auth = {
    userId: user._id.toString(),
    role: user.role,
  }
  return next()
}

module.exports = optionalAuth
