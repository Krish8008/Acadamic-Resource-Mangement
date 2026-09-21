const TeacherList = ({ teachers, onDelete, isDeleting }) => (
  <section className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
    <h2 className="text-xl font-bold text-slate-900">Registered teachers</h2>
    <p className="mt-1 text-sm text-slate-500">Manage teacher accounts and their resources.</p>
    <div className="mt-5 space-y-3">
      {teachers.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No teachers registered yet.</p>
      ) : teachers.map((teacher) => {
        const teacherId = teacher._id || teacher.id
        return (
        <article className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between" key={teacherId}>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{teacher.name}</p>
            <p className="break-words text-sm text-slate-500">@{teacher.username} · {teacher.role}</p>
          </div>
          <button
            className="self-start rounded-md py-1 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 sm:self-auto"
            type="button"
            disabled={isDeleting === teacherId}
            onClick={() => onDelete({ ...teacher, _id: teacherId })}
          >
            {isDeleting === teacherId ? 'Deleting...' : 'Delete'}
          </button>
        </article>
        )
      })}
    </div>
  </section>
)

export default TeacherList
