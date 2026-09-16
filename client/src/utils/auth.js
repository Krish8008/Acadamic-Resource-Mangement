import { toast } from 'sonner'

export const clearAuthentication = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
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
  const token = localStorage.getItem('token')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, { ...options, headers }).then((response) => {
    if (response.status === 401) {
      handleAuthenticationFailure()
    }
    return response
  })
}
