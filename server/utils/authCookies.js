const AUTH_COOKIE = 'auth_token'
const USER_COOKIE = 'auth_user'

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
}

const userCookieOptions = {
  ...cookieOptions,
  httpOnly: false,
}

const setAuthCookies = (res, token, user) => {
  res.cookie(AUTH_COOKIE, token, cookieOptions)
  res.cookie(USER_COOKIE, JSON.stringify(user), userCookieOptions)
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
