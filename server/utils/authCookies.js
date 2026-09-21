const AUTH_COOKIE = 'auth_token'
const USER_COOKIE = 'auth_user'
const isProduction = process.env.NODE_ENV === 'production'

const cookieOptions = {
  httpOnly: true,
  // A deployed frontend and API can be on different origins. `none` permits
  // credentialed API requests between them; browsers require it to be secure.
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
}

const userCookieOptions = {
  ...cookieOptions,
  httpOnly: false,
}

const setAuthCookies = (res, token) => {
  res.cookie(AUTH_COOKIE, token, cookieOptions)
}

const clearAuthCookies = (res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined })
  res.clearCookie(USER_COOKIE, { ...userCookieOptions, maxAge: undefined })
}

module.exports = {
  AUTH_COOKIE,
  USER_COOKIE,
  setAuthCookies,
  clearAuthCookies,
}
