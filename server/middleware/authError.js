const sendAuthenticationError = (res, message, code = 'AUTH_TOKEN_INVALID') => {
  res.set('WWW-Authenticate', 'Bearer')
  return res.status(401).json({ code, message })
}

module.exports = sendAuthenticationError
