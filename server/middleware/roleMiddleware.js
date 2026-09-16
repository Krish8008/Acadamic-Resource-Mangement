const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.auth?.role)) {
    return res.status(403).json({ message: `Only these roles can perform this action: ${roles.join(', ')}` })
  }

  return next()
}

module.exports = requireRole
