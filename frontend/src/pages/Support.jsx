import React, { useEffect, useState } from 'react'
import api from '../api/client'

function Ticket({ ticket, onReply, onStatus, busy }) {
  const [message, setMessage] = useState('')
  return (
    <article className="rounded-xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-bold">{ticket.subject}</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {ticket.category} · {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
        <span className="text-sm font-bold">{ticket.status.replaceAll('_', ' ')}</span>
      </div>
      <div className="mt-4 space-y-3">
        {(ticket.messages || []).map((entry, index) => (
          <div key={index} className="rounded-lg border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-bold">{entry.sender === 'support' ? 'Workforce support' : 'Customer'}</p>
            <p className="whitespace-pre-wrap text-sm mt-1">{entry.body}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{new Date(entry.at).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <form className="mt-3" onSubmit={async (event) => {
        event.preventDefault()
        if (await onReply(ticket, message)) setMessage('')
      }}>
        <label className="block font-semibold text-sm">Your response</label>
        <textarea className="w-full border rounded-lg p-2 mt-1" rows={3} minLength={2}
          value={message} onChange={(event) => setMessage(event.target.value)} required />
        <button disabled={busy} className="rounded-lg bg-orca-deep-blue text-white px-4 py-2 mt-2 disabled:opacity-50">
          Send response
        </button>
      </form>
      {onStatus && (
        <div className="flex flex-wrap gap-2 mt-3">
          {['open', 'in_progress', 'resolved'].map((status) => (
            <button key={status} disabled={busy || status === ticket.status}
              onClick={() => onStatus(ticket, status)}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">
              Mark {status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [staffTickets, setStaffTickets] = useState(null)
  const [draft, setDraft] = useState({ subject: '', message: '', category: 'other' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    try {
      const response = await api.get('/api/support/tickets')
      setTickets(response.data.tickets || [])
      try {
        const admin = await api.get('/api/support/admin/tickets')
        setStaffTickets(admin.data.tickets || [])
      } catch (staffError) {
        if (staffError.response?.status !== 403) throw staffError
      }
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load support requests.')
    }
  }

  useEffect(() => { load() }, [])

  const createTicket = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/support/tickets', draft)
      setDraft({ subject: '', message: '', category: 'other' })
      setNotice('Support request received. Replies will appear on this page.')
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to send support request.')
    } finally {
      setBusy(false)
    }
  }

  const reply = async (ticket, message) => {
    setBusy(true)
    setError('')
    try {
      await api.post(`/api/support/tickets/${ticket.id}/reply`, { message })
      await load()
      return true
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save reply.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const setTicketStatus = async (ticket, status) => {
    setBusy(true)
    setError('')
    try {
      await api.post(`/api/support/admin/tickets/${ticket.id}/status`, { status })
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update status.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Workforce customer support</h1>
      <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
        Ask for help with an employee, an assignment, or a purchase. Your conversation stays in your account.
      </p>
      {error && <p className="mt-4 p-3 rounded-lg text-red-700 bg-red-50">{error}</p>}
      {notice && <p className="mt-4 p-3 rounded-lg text-green-700 bg-green-50">{notice}</p>}
      <form className="rounded-xl border p-5 space-y-3 mt-6" onSubmit={createTicket}
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xl font-bold">New support request</h2>
        <label className="block">Topic
          <select value={draft.category} className="w-full rounded-lg border p-2 mt-1"
            onChange={(event) => setDraft((old) => ({ ...old, category: event.target.value }))}>
            <option value="other">Other</option>
            <option value="billing">Billing</option>
            <option value="employee">Digital employee</option>
            <option value="assignment">Assignment or delivery</option>
          </select>
        </label>
        <label className="block">Subject
          <input className="w-full rounded-lg border p-2 mt-1" required minLength={5} maxLength={200}
            value={draft.subject} onChange={(event) => setDraft((old) => ({ ...old, subject: event.target.value }))} />
        </label>
        <label className="block">Describe the problem
          <textarea className="w-full rounded-lg border p-2 mt-1" rows={4} required minLength={10} maxLength={5000}
            value={draft.message} onChange={(event) => setDraft((old) => ({ ...old, message: event.target.value }))} />
        </label>
        <button disabled={busy} className="rounded-lg bg-orca-deep-blue text-white px-4 py-2 disabled:opacity-50">
          Send support request
        </button>
      </form>
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Your support conversations</h2>
        {tickets.length === 0 && <p>No support requests yet.</p>}
        {tickets.map((ticket) => <Ticket key={ticket.id} ticket={ticket} onReply={reply} busy={busy} />)}
      </section>
      {staffTickets && (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold">Support staff queue</h2>
          {staffTickets.length === 0 && <p>No customer requests waiting.</p>}
          {staffTickets.map((ticket) => (
            <Ticket key={ticket.id} ticket={ticket} onReply={reply}
              onStatus={setTicketStatus} busy={busy} />
          ))}
        </section>
      )}
    </main>
  )
}
