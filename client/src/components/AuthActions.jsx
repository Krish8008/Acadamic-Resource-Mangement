import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { clearAuthentication } from '../utils/auth'

const AuthActions = ({ user }) => {
  const navigate = useNavigate()

  const logout = () => {
    clearAuthentication()
    toast.success('Logged out successfully')
    navigate('/', { replace: true })
  }

  if (!user) {
    return <Link className="font-semibold text-sky-300 hover:text-sky-200" to="/login">Login</Link>
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-300">{user.name || user.username}</span>
      <button className="font-semibold text-sky-300 hover:text-sky-200" type="button" onClick={logout}>Logout</button>
    </div>
  )
}

export default AuthActions
