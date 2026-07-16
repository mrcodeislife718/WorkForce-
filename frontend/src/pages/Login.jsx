import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/console', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-3xl font-bold mb-2">Sign in to ORCA</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Manage real workspace connections and deployed digital employees.</p>
        {error && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold mb-1">Email</span>
            <input className="w-full rounded-lg border px-3 py-2" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold mb-1">Password</span>
            <input className="w-full rounded-lg border px-3 py-2" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </label>
          <button className="w-full rounded-lg bg-orca-deep-blue text-white font-bold py-2.5 disabled:opacity-50" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>New to ORCA? <Link className="font-semibold text-orca-deep-blue" to="/signup">Create an account</Link></p>
      </div>
    </main>
  )
}
