import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'

export default function Interview() {
  const { workerId } = useParams()
  const navigate = useNavigate()
  const [goal, setGoal] = useState('')
  const [session, setSession] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const messages = useMemo(
    () => [...(session?.InterviewMessages || [])].sort((a, b) => a.sequence_number - b.sequence_number),
    [session],
  )

  const start = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await api.post('/api/interviews', { worker_id: workerId, goal })
      setSession(response.data.session)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to start interview.')
    } finally {
      setBusy(false)
    }
  }

  const send = async (event) => {
    event.preventDefault()
    if (!message.trim()) return
    setBusy(true)
    setError('')
    try {
      const response = await api.post(`/api/interviews/${session.id}/messages`, { content: message })
      setSession(response.data.session)
      setMessage('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to continue interview.')
    } finally {
      setBusy(false)
    }
  }

  const complete = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await api.post(`/api/interviews/${session.id}/complete`)
      setSession(response.data.session)
      navigate(`/sample/${workerId}?interview_id=${session.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to complete interview.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Interview the digital employee</h1>
      <p className="mt-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
        Discuss the real work, boundaries, approvals, success criteria, and escalation rules before hiring.
      </p>
      {error && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">{error}</div>}

      {!session ? (
        <form onSubmit={start} className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <label className="block">
            <span className="block font-semibold mb-2">What do you need this digital employee to accomplish?</span>
            <textarea
              className="w-full min-h-36 rounded-lg border px-3 py-2"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Describe the job, expected volume, current workflow, success measures, and any restrictions."
              required
              minLength={10}
            />
          </label>
          <button disabled={busy} className="w-full rounded-lg bg-orca-deep-blue text-white font-bold py-3 disabled:opacity-50">
            {busy ? 'Starting real interview…' : 'Start interview'}
          </button>
        </form>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border p-4 max-h-[32rem] overflow-y-auto space-y-3" style={{ borderColor: 'var(--border-color)' }}>
            {messages.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl p-3 ${item.role === 'customer' ? 'ml-8 bg-blue-50 dark:bg-blue-950/30' : 'mr-8'}`}
                style={item.role === 'digital_employee' ? { backgroundColor: 'var(--bg-secondary)' } : undefined}
              >
                <p className="text-xs font-bold mb-1">{item.role === 'customer' ? 'You' : 'Digital employee'}</p>
                <p className="whitespace-pre-wrap">{item.content}</p>
              </article>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <textarea
              className="flex-1 min-h-24 rounded-lg border px-3 py-2"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Answer the question or ask the digital employee about its approach."
              disabled={busy}
            />
            <button disabled={busy || !message.trim()} className="self-end rounded-lg bg-orca-deep-blue text-white font-bold px-5 py-3 disabled:opacity-50">Send</button>
          </form>
          <button onClick={complete} disabled={busy || messages.length < 4} className="w-full rounded-lg border font-bold py-3 disabled:opacity-50" style={{ borderColor: 'var(--border-color)' }}>
            {busy ? 'Completing interview…' : 'Complete interview and assign sample work'}
          </button>
        </section>
      )}
    </main>
  )
}
