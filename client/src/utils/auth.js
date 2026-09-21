import { toast } from 'sonner'

const USER_STORAGE_KEY = 'auth_user'

export const getApiUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

export const storeUser = (user) => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }
}

export const clearAuthentication = () => {
  void fetch(`${getApiUrl()}/api/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  localStorage.removeItem(USER_STORAGE_KEY)
}

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(USER_STORAGE_KEY)
    return user ? JSON.parse(user) : null
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
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
