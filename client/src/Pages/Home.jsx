import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { showError, showPermissionError } from '../utils/notifications'
import { authenticatedFetch, clearAuthentication, getStoredUser } from '../utils/auth'

const semesters = [1, 2, 3, 4, 5, 6, 7]
const accents = ['bg-amber-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500']

const Home = () => {
  const [activeSemester, setActiveSemester] = useState(1)
  const [search, setSearch] = useState('')
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const user = getStoredUser()
  const canManageSubjects = user?.role === 'teacher' || user?.role === 'HOD'

  const loadSubjects = useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/subjects`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Unable to load subjects')
    setSubjects(data.subjects)
  }, [apiUrl])

  useEffect(() => {
    loadSubjects()
      .catch((error) => {
        showError(error, 'Unable to load subjects')
        setMessage(error instanceof Error ? error.message : 'Unable to load subjects')
      })
      .finally(() => setIsLoading(false))
  }, [loadSubjects])

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    return subjects.filter(
      (subject) =>
        subject.semester === activeSemester &&
        (!query || subject.name.toLowerCase().includes(query)),
    )
  }, [activeSemester, search, subjects])

  const handleAddSubject = async (event) => {
    event.preventDefault()
    if (!newSubject.trim()) return
    setIsAdding(true)
    setMessage('')

    try {
      const response = await authenticatedFetch(`${apiUrl}/api/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubject.trim(), semester: activeSemester }),
      })
      const data = await response.json()
      if (response.status === 401) {
        return
      }
      if (response.status === 403) {
        showPermissionError()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to add subject')
      setSubjects((currentSubjects) => [...currentSubjects, data.subject])
      setNewSubject('')
      toast.success(`Subject added to semester ${activeSemester}.`)
      setMessage(`Subject added to semester ${activeSemester}.`)
    } catch (error) {
      showError(error, 'Unable to add subject')
      setMessage(error instanceof Error ? error.message : 'Unable to add subject')
    } finally {
      setIsAdding(false)
    }

  }

  const handleDeleteSubject = async (subjectId) => {
    setMessage('')

    try {
      const response = await authenticatedFetch(`${apiUrl}/api/subjects/${subjectId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.status === 401) {
        return
      }
      if (response.status === 403) {
        showPermissionError()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to delete subject')
      setSubjects((currentSubjects) => currentSubjects.filter((subject) => subject._id !== subjectId))
      toast.success('Subject deleted successfully.')
      setMessage('Subject deleted successfully.')
    } catch (error) {
      showError(error, 'Unable to delete subject')
      setMessage(error instanceof Error ? error.message : 'Unable to delete subject')
    }
  }

  const handleLogout = () => {
    clearAuthentication()
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-sky-300">Department</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl">Electrical Engineering</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
                Subjects and learning resources in one place.
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              {user ? (
                <>
                  <p className="text-xs text-slate-400">{user.role}</p>
                  <p className="mt-1 font-semibold">{user.name || user.username}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
                    {user.role === 'HOD' && (
                      <Link className="font-semibold text-sky-300 hover:text-sky-200" to="/register">
                        Register
                      </Link>
                    )}
                    <button
                      className="font-semibold text-sky-300 hover:text-sky-200"
                      type="button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link className="font-semibold text-sky-300 hover:text-sky-200" to="/login">
                  User
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="relative">
          <label className="sr-only" htmlFor="subject-search">Search subjects</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-3.5 px-4 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            id="subject-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for a subject"
          />
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Choose semester</h2>
            <span className="text-sm text-slate-500">{filteredSubjects.length} subjects</span>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {semesters.map((semester) => (
              <button
                className={`flex min-w-[5.5rem] shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                  activeSemester === semester
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'
                }`}
                key={semester}
                type="button"
                onClick={() => setActiveSemester(semester)}
                aria-pressed={activeSemester === semester}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${activeSemester === semester ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {semester}
                </span>
                Semester
              </button>
            ))}
          </div>
        </div>

        {canManageSubjects && (
          <form className="mt-5 flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 sm:flex-row" onSubmit={handleAddSubject}>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="new-subject">
                Add subject to Semester {activeSemester}
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                id="new-subject"
                value={newSubject}
                onChange={(event) => setNewSubject(event.target.value)}
                placeholder="e.g. Digital Electronics"
                required
              />
            </div>
            <button className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-60 sm:self-end" disabled={isAdding} type="submit">
              {isAdding ? 'Adding...' : 'Add subject'}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-slate-600" role="status">{message}</p>}

        <section className="mt-6" aria-labelledby="subjects-heading">
          <h2 className="sr-only" id="subjects-heading">Available subjects</h2>
          {isLoading ? (
            <div className="rounded-xl bg-white px-5 py-12 text-center text-slate-500">Loading subjects...</div>
          ) : filteredSubjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSubjects.map((subject, index) => (
                <article
                  className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  key={subject._id}
                  onClick={() => navigate(`/resources/${subject._id}`)}
                >
                  <div className={`h-1.5 ${accents[index % accents.length]}`} />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Semester {subject.semester}</p>
                    <h3 className="mt-3 text-lg font-bold leading-snug">{subject.name}</h3>
                    {(user?.role === 'HOD' || subject.owner?.toString() === user?.id) && (
                      <button
                        className="mt-5 text-sm font-semibold text-red-600 hover:text-red-700"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDeleteSubject(subject._id)
                        }}
                      >
                        Delete subject
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
              <p className="font-semibold text-slate-700">No subjects added yet</p>
              <p className="mt-1 text-sm text-slate-500">{canManageSubjects ? `Add the first subject to semester ${activeSemester}.` : 'Your teacher has not added subjects here yet.'}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Home
