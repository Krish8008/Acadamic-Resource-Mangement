import { toast } from 'sonner'

export const clearAuthentication = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  void fetch(`${apiUrl}/api/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  document.cookie = 'auth_user=; Max-Age=0; Path=/'
}

export const getStoredUser = () => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('auth_user='))

  if (!cookie) return null

  try {
    return JSON.parse(decodeURIComponent(cookie.slice('auth_user='.length)))
  } catch {
    return null
  }
}

export const handleAuthenticationFailure = () => {
  clearAuthentication()
  toast.error('Your session has expired. Please sign in again.')

  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

export const authenticatedFetch = (url, options = {}) => {
  const headers = new Headers(options.headers)

  return fetch(url, { ...options, headers, credentials: 'include' }).then((response) => {
    if (response.status === 401) {
      handleAuthenticationFailure()
    }
    return response
  })
}
