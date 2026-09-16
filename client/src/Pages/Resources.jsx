import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthActions from '../components/AuthActions'
import { toast } from 'sonner'
import { showError, showPermissionError } from '../utils/notifications'
import { authenticatedFetch } from '../utils/auth'

const tabs = [
  { id: 'notes', label: 'Notes', description: 'Study material and chapter notes' },
  { id: 'previous-year-question-paper', label: 'Question Papers', description: 'Previous year question papers' },
  { id: 'assignment', label: 'Assignments', description: 'Practice work and submissions' },
]

const Resources = () => {
  const { subjectId } = useParams()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [subject, setSubject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('notes')
  const [form, setForm] = useState({ title: '', name: 'notes', link: '' })
  const [files, setFiles] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const canManage = user?.role === 'HOD' || subject?.owner?.toString() === user?.id

  const filePreviews = useMemo(() => files.map((selectedFile) => (
      selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null
    )), [files])

  useEffect(() => {
    return () => filePreviews.forEach((preview) => preview && URL.revokeObjectURL(preview))
  }, [filePreviews])

  const loadResources = async () => {
    const [subjectResponse, documentsResponse] = await Promise.all([
      fetch(`${apiUrl}/api/subjects/${subjectId}`),
      fetch(`${apiUrl}/api/documents`),
    ])
    const subjectData = await subjectResponse.json()
    const documentsData = await documentsResponse.json()
    if (!subjectResponse.ok) throw new Error(subjectData.message || 'Unable to load subject')
    if (!documentsResponse.ok) throw new Error(documentsData.message || 'Unable to load documents')
    setSubject(subjectData.subject)
    setDocuments(documentsData.documents.filter((document) => document.subject?._id === subjectId))
  }

  useEffect(() => {
    loadResources()
      .catch((error) => {
        showError(error, 'Unable to load resources')
        setMessage(error instanceof Error ? error.message : 'Unable to load resources')
      })
      .finally(() => setIsLoading(false))
  }, [subjectId])

  const currentDocuments = useMemo(
    () => documents.filter((document) => document.name === activeTab),
    [activeTab, documents],
  )

  const getLinkUrl = (document, link, linkIndex) =>
    link.publicId
      ? `${apiUrl}/api/documents/${document._id}/file/${linkIndex}`
      : link.url

  const isImageLink = (link) => (
    !/\.pdf(?:$|\?)/i.test(link.label || link.url)
    && (link.resourceType === 'image' || /\.(?:png|jpe?g|gif|webp|bmp|svg)(?:$|\?)/i.test(link.url))
  )

  const isUploadedDocument = (link) => Boolean(link.publicId) && !isImageLink(link)

  const getResourceLabel = (link) => (
    isUploadedDocument(link) ? 'Open PDF' : link.label || 'Open link'
  )

  const canDeleteDocument = (document) => (
    user?.role === 'HOD'
    || (document.owner?._id || document.owner)?.toString() === user?.id?.toString()
  )

  const getDefaultLink = (document) => {
    const linkIndex = document.links.findIndex((link) => link.url === document.defaultLink)
    const safeIndex = linkIndex >= 0 ? linkIndex : 0
    return { link: document.links[safeIndex], linkIndex: safeIndex }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    const body = new FormData()
    body.append('title', form.title)
    body.append('name', form.name)
    body.append('subject', subjectId)
    body.append('semester', String(subject.semester))
    if (form.link.trim()) body.append('links', JSON.stringify([{ label: 'External link', url: form.link.trim() }]))
    files.forEach((selectedFile) => body.append('files', selectedFile))

    try {
      const response = await authenticatedFetch(`${apiUrl}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body,
      })
      const data = await response.json()
      if (response.status === 401) {
        return
      }
      if (response.status === 403) {
        showPermissionError()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to save document')
      setDocuments((current) => [
        data.document,
        ...current.filter((document) => document._id !== data.document._id),
      ])
      setForm({ title: '', name: activeTab, link: '' })
      setFiles([])
      event.target.reset()
      toast.success('Document saved successfully.')
      setMessage('Document saved successfully.')
    } catch (error) {
      showError(error, 'Unable to save document')
      setMessage(error instanceof Error ? error.message : 'Unable to save document')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (documentId) => {
    try {
      const response = await authenticatedFetch(`${apiUrl}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data = await response.json()
      if (response.status === 401) {
        return
      }
      if (response.status === 403) {
        showPermissionError()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to delete document')
      setDocuments((current) => current.filter((document) => document._id !== documentId))
      toast.success('Document deleted successfully.')
      setMessage('Document deleted successfully.')
    } catch (error) {
      showError(error, 'Unable to delete document')
      setMessage(error instanceof Error ? error.message : 'Unable to delete document')
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-slate-500">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" role="status" aria-label="Loading resources" />
        <p>Loading resources...</p>
      </main>
    )
  }

  if (!subject) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-slate-100 px-4 text-center text-slate-600">
        <div>
          <p>{message || 'This subject is no longer available.'}</p>
          <Link className="mt-4 inline-block font-semibold text-sky-700 hover:text-sky-900" to="/">Back to subjects</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100svh] bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <Link className="text-sm text-sky-300 hover:text-sky-200" to="/">← All subjects</Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{subject.name}</h1>
              <p className="mt-2 text-sm text-slate-300">Semester {subject.semester} · Resources</p>
            </div>
            <AuthActions user={user} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:grid-cols-3" role="tablist">
          {tabs.map((tab) => (
            <button
              className={`min-h-12 rounded-lg px-3 py-3 text-sm font-semibold leading-tight transition sm:min-h-14 sm:px-2 sm:py-2 ${activeTab === tab.id ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setForm((current) => ({ ...current, name: tab.id }))
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message && <p className="mt-4 text-sm text-slate-600" role="status">{message}</p>}

        <section className="mt-6">
          <p className="text-sm text-slate-500">{tabs.find((tab) => tab.id === activeTab).description}</p>
          <div className="mt-4 space-y-3">
            {currentDocuments.map((document) => (
              <article className="flex flex-col gap-3 rounded-xl border border-slate-200 border-l-4 border-l-sky-600 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" key={document._id}>
                <div>
                  <h2 className="font-bold">{document.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{document.links.length} resource link{document.links.length === 1 ? '' : 's'}</p>
                  {document.links.some(isImageLink) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {document.links.map((link, linkIndex) => isImageLink(link) && (
                        <button
                          className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                          key={`${link.url}-${linkIndex}`}
                          type="button"
                          onClick={() => setSelectedDocument(document)}
                        >
                          <img className="h-full w-full object-cover" src={getLinkUrl(document, link, linkIndex)} alt={link.label || document.title} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {document.links.map((link, linkIndex) => (
                      !isImageLink(link) && (
                        <a className="text-sm font-semibold text-sky-700 underline hover:text-sky-900" href={getLinkUrl(document, link, linkIndex)} key={`${link.url}-${linkIndex}`} target="_blank" rel="noreferrer">
                          {getResourceLabel(link)}
                        </a>
                      )
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {document.defaultLink && (
                    isImageLink(getDefaultLink(document).link) ? (
                      <button
                        className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                        type="button"
                        onClick={() => setSelectedDocument(document)}
                      >
                        Open images
                      </button>
                    ) : (
                      <a
                        className="text-sm font-semibold text-sky-700 underline hover:text-sky-900"
                        href={getLinkUrl(document, getDefaultLink(document).link, getDefaultLink(document).linkIndex)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {getResourceLabel(getDefaultLink(document).link)}
                      </a>
                    )
                  )}
                  {canDeleteDocument(document) && (
                    <button className="text-sm font-semibold text-red-600 hover:text-red-700" type="button" onClick={() => handleDelete(document._id)}>Delete</button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {currentDocuments.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-slate-500">No resources in this tab yet.</div>}
        </section>

        {canManage && (
          <form className="mt-6 space-y-4 rounded-xl border border-sky-100 bg-sky-50 p-4 sm:p-5" onSubmit={handleSave}>
            <h2 className="font-bold text-slate-800">Add {tabs.find((tab) => tab.id === activeTab).label}</h2>
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Document title (e.g. Unit 1)" required />
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type="url" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="External link (optional)" />
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
              multiple
              onChange={(event) => {
                const selectedFiles = Array.from(event.target.files || [])
                const documentFiles = selectedFiles.filter((selectedFile) => !selectedFile.type.startsWith('image/'))
                if (documentFiles.length > 1) {
                  setMessage('Select only one PDF or document file. Multiple images are supported.')
                  event.target.value = ''
                  setFiles([])
                  return
                }
                setMessage('')
                setFiles(selectedFiles)
              }}
            />
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {files.map((selectedFile, fileIndex) => (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={`${selectedFile.name}-${selectedFile.lastModified}`}>
                    {selectedFile.type.startsWith('image/') ? (
                      <img className="h-24 w-full object-cover" src={filePreviews[fileIndex]} alt={selectedFile.name} />
                    ) : (
                      <div className="flex h-24 items-center justify-center px-2 text-center text-xs font-medium text-slate-600">{selectedFile.name}</div>
                    )}
                    {!selectedFile.type.startsWith('image/') && (
                      <p className="truncate px-2 py-2 text-center text-xs font-semibold text-slate-600">{selectedFile.name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : 'Save resource'}</button>
          </form>
        )}
      </div>
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-label={`${selectedDocument.title} images`}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">{selectedDocument.title}</h2>
              <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" type="button" onClick={() => setSelectedDocument(null)}>Close</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {selectedDocument.links.map((link, linkIndex) => isImageLink(link) && (
                <img className="max-h-[70vh] w-full rounded-lg border border-slate-200 object-contain" key={`${link.url}-${linkIndex}`} src={getLinkUrl(selectedDocument, link, linkIndex)} alt={link.label || selectedDocument.title} />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Resources
