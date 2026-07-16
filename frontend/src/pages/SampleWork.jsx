import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function SampleWork() {
  const { workerId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const interviewId = searchParams.get('interview_id')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [inputJson, setInputJson] = useState('{}')
  const [assignment, setAssignment] = useState(null)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!assignment || !['queued', 'running'].includes(assignment.status)) return undefined
    const timer = setInterval(async () => {
      try {
        const response = await api.get(`/api/sample-assignments/${assignment.id}`)
        setAssignment(response.data.assignment)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to refresh sample work.')
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [assignment])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      let inputData
      try {
        inputData = JSON.parse(inputJson || '{}')
      } catch {
        throw new Error('Input data must be valid JSON.')
      }
      const response = await api.post('/api/sample-assignments', {
        worker_id: workerId,
        interview_session_id: interviewId,
        title,
        instructions,
        input_data: inputData,
      })
      setAssignment(response.data.assignment)
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to assign sample work.')
    } finally {
      setBusy(false)
    }
  }

  const review = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await api.post(`/api/sample-assignments/${assignment.id}/review`, { rating, feedback })
      setAssignment(response.data.assignment)
      navigate(`/purchase/${workerId}`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to review sample work.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Assign real sample work</h1>
      <p className="mt-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
        Give the digital employee a bounded piece of real work before purchasing. The result comes from the configured model provider—there is no canned fallback.
      </p>
      {error && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">{error}</div>}

      {!assignment ? (
        <form onSubmit={submit} className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {!interviewId && <p className="text-red-600">A completed interview is required. Return to the digital employee profile and start the interview.</p>}
          <label className="block">
            <span className="block font-semibold mb-1">Assignment title</span>
            <input className="w-full rounded-lg border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} />
          </label>
          <label className="block">
            <span className="block font-semibold mb-1">Detailed instructions</span>
            <textarea className="w-full min-h-40 rounded-lg border px-3 py-2" value={instructions} onChange={(event) => setInstructions(event.target.value)} required minLength={20} />
          </label>
          <label className="block">
            <span className="block font-semibold mb-1">Structured input data (JSON)</span>
            <textarea className="w-full min-h-28 rounded-lg border px-3 py-2 font-mono text-sm" value={inputJson} onChange={(event) => setInputJson(event.target.value)} />
          </label>
          <button disabled={busy || !interviewId} className="w-full rounded-lg bg-orca-deep-blue text-white font-bold py-3 disabled:opacity-50">
            {busy ? 'Queuing sample…' : 'Assign sample work'}
          </button>
        </form>
      ) : (
        <section className="space-y-5">
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{assignment.title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{assignment.instructions}</p>
              </div>
              <span className="rounded-full border px-3 py-1 h-fit text-sm font-semibold" style={{ borderColor: 'var(--border-color)' }}>{assignment.status}</span>
            </div>
          </div>

          {['queued', 'running'].includes(assignment.status) && (
            <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <p className="font-bold">The digital employee is completing the real sample.</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>This page refreshes automatically. Failed provider calls are reported instead of replaced with fabricated output.</p>
            </div>
          )}

          {assignment.status === 'failed' && (
            <div className="rounded-2xl border border-red-300 p-5 text-red-700 dark:text-red-300">
              <h2 className="font-bold">Sample work failed</h2>
              <p className="mt-2">{assignment.failure_reason}</p>
            </div>
          )}

          {assignment.status === 'completed' && (
            <>
              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-xl font-bold mb-3">Completed sample result</h2>
                <pre className="whitespace-pre-wrap font-sans text-sm">{assignment.result?.output || JSON.stringify(assignment.result, null, 2)}</pre>
              </div>
              <form onSubmit={review} className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <label className="block">
                  <span className="block font-semibold mb-1">Rating</span>
                  <select className="rounded-lg border px-3 py-2" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block font-semibold mb-1">Feedback</span>
                  <textarea className="w-full min-h-24 rounded-lg border px-3 py-2" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
                </label>
                <button disabled={busy} className="w-full rounded-lg bg-orca-deep-blue text-white font-bold py-3 disabled:opacity-50">
                  Review sample and continue to purchase
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </main>
  )
}
