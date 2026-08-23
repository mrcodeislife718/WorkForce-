import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signup(form)
      navigate(location.state?.from?.pathname || '/console', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-3xl font-bold mb-2">Create your ORCA account</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Deploy digital employees into the real tools your business already uses.</p>
        {error && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold mb-1">Name</span>
            <input className="w-full rounded-lg border px-3 py-2" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold mb-1">Email</span>
            <input className="w-full rounded-lg border px-3 py-2" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold mb-1">Password</span>
            <input className="w-full rounded-lg border px-3 py-2" type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </label>
          <button className="w-full rounded-lg bg-orca-deep-blue text-white font-bold py-2.5 disabled:opacity-50" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Already have an account? <Link className="font-semibold text-orca-deep-blue" to="/login">Sign in</Link></p>
      </div>
    </main>
  )
}
