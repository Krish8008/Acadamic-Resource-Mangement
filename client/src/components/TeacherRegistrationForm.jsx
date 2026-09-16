const TeacherRegistrationForm = ({ form, message, isSubmitting, onChange, onSubmit }) => (
  <section className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
    <h2 className="text-xl font-bold text-slate-900">Register teacher</h2>
    <p className="mt-1 text-sm text-slate-500">Create a teacher or class teacher account.</p>
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <input className="w-full rounded-lg border border-slate-300 px-3.5 py-3" name="name" placeholder="Name" value={form.name} onChange={onChange} required />
      <input className="w-full rounded-lg border border-slate-300 px-3.5 py-3" name="username" placeholder="Username" value={form.username} onChange={onChange} required />
      <input className="w-full rounded-lg border border-slate-300 px-3.5 py-3" name="password" type="password" placeholder="Password (at least 6 characters)" minLength={6} value={form.password} onChange={onChange} required />
      <select className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3" name="role" value={form.role} onChange={onChange} required>
        <option value="" disabled>Select a role</option>
        <option value="teacher">Teacher</option>
        <option value="class-teacher">Class Teacher</option>
      </select>
      <button className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Registering...' : 'Register teacher'}
      </button>
      {message && <p className="text-sm text-slate-600" role="status">{message}</p>}
    </form>
  </section>
)

export default TeacherRegistrationForm
