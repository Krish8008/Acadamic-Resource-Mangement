import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TeacherList from '../components/TeacherList'
import TeacherRegistrationForm from '../components/TeacherRegistrationForm'
import { toast } from 'sonner'
import { showError, showPermissionError } from '../utils/notifications'
import { authenticatedFetch, clearAuthentication, getStoredUser } from '../utils/auth'

const initialForm = { name: '', username: '', password: '', role: '' }

const Register = () => {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const [form, setForm] = useState(initialForm)
  const [teachers, setTeachers] = useState([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState('')
  const [teacherToDelete, setTeacherToDelete] = useState(null)

  const logout = () => {
    clearAuthentication()
    toast.success('Logged out successfully')
    navigate('/', { replace: true })
  }

  const loadTeachers = async () => {
    const response = await authenticatedFetch(`${apiUrl}/api/teachers`, {
    })
    const data = await response.json()
    if (response.status === 401) return
    if (!response.ok) throw new Error(data.message || 'Unable to load teachers')
    setTeachers(data.teachers)
  }

  useEffect(() => {
    try {
      const user = getStoredUser()
      if (!user || user.role !== 'HOD') {
        showPermissionError()
        navigate('/', { replace: true })
        return
      }
      loadTeachers()
        .catch((error) => {
          showError(error, 'Unable to load teachers')
          setMessage(error instanceof Error ? error.message : 'Unable to load teachers')
        })
        .finally(() => setIsLoading(false))
    } catch {
      clearAuthentication()
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    try {
      const response = await authenticatedFetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (response.status === 401) return
      if (response.status === 403) {
        showPermissionError()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to register teacher')
      setTeachers((current) => [...current, { ...data.user, _id: data.user.id }].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(initialForm)
      toast.success(data.message || 'Teacher registered successfully.')
      setMessage('Teacher registered successfully.')
    } catch (error) {
      showError(error, 'Unable to register teacher')
      setMessage(error instanceof Error ? error.message : 'Unable to register teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (teacher) => {
    setIsDeleting(teacher._id)
    setMessage('')
    try {
      const response = await authenticatedFetch(`${apiUrl}/api/teachers/${teacher._id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.status === 401) return
      if (response.status === 403) {
        showPermissionError()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to delete teacher')
      setTeachers((current) => current.filter((item) => item._id !== teacher._id))
      toast.success(data.message || 'Teacher and associated resources deleted successfully.')
      setMessage('Teacher and associated resources deleted successfully.')
    } catch (error) {
      showError(error, 'Unable to delete teacher')
      setMessage(error instanceof Error ? error.message : 'Unable to delete teacher')
    } finally {
      setIsDeleting('')
    }
  }

  const requestDelete = (teacher) => setTeacherToDelete(teacher)

  if (isLoading) return <main className="min-h-screen bg-slate-100 p-8 text-center text-slate-500">Loading...</main>

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-sm text-sky-300">HOD administration</p>
            <h1 className="text-xl font-bold sm:text-2xl">Teacher management</h1>
          </div>
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <Link className="text-sky-300 hover:text-sky-200" to="/">Subjects</Link>
            <button className="font-semibold text-white hover:text-sky-200" type="button" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {message && <p className="mb-5 text-sm text-slate-600" role="status">{message}</p>}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <TeacherList teachers={teachers} onDelete={requestDelete} isDeleting={isDeleting} />
          <TeacherRegistrationForm form={form} message="" isSubmitting={isSubmitting} onChange={handleChange} onSubmit={handleSubmit} />
        </div>
      </div>
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4" role="presentation">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-teacher-title"
          >
            <h2 className="text-xl font-bold text-slate-900" id="delete-teacher-title">Delete teacher?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete {teacherToDelete.name} and all their subjects and documents?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => setTeacherToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                type="button"
                disabled={Boolean(isDeleting)}
                onClick={() => {
                  const teacher = teacherToDelete
                  setTeacherToDelete(null)
                  handleDelete(teacher)
                }}
              >
                Delete teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Register
