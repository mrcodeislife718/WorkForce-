import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { currency } from '../data/catalogFormatters.js'

export default function PurchaseBundle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [bundle, setBundle] = useState(null)
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.get(`/api/store/bundles/${encodeURIComponent(slug)}`),
      api.get(`/api/billing/bundle/${encodeURIComponent(slug)}/status`),
    ]).then(([plan, subscription]) => {
      if (!mounted) return
      setBundle(plan.data)
      setState(subscription.data)
    }).catch((err) => {
      if (mounted) setError(err.response?.data?.error || 'Unable to load workforce plan.')
    })
    return () => { mounted = false }
  }, [slug])

  const checkout = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await api.post('/api/billing/bundle-checkout-session', { slug })
      if (response.data.already_entitled) {
        navigate('/console')
        return
      }
      if (!response.data.url) throw new Error('Monthly payment checkout is unavailable.')
      window.location.assign(response.data.url)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to create subscription.')
      setBusy(false)
    }
  }

  return <main className="max-w-4xl mx-auto px-4 py-10">
    <Link to={`/store/bundles/${slug}`} className="text-sm underline">Back to workforce plan</Link>
    <h1 className="text-3xl font-bold mt-4">Hire the complete digital workforce</h1>
    <p className="mt-2 mb-5" style={{ color: 'var(--text-secondary)' }}>
      One secure monthly subscription includes every listed team member.
      Each employee receives distinct customer-authorized workspace permissions.
    </p>
    {error && <p role="alert" className="p-3 text-red-600">{error}</p>}
    {!bundle || !state ? <p>Checking the actual employee roster and subscription status…</p> : (
      <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-xl font-bold">{bundle.name}</h2>
        <p className="text-sm mt-2">{bundle.member_count} named professional employees</p>
        <div className="mt-3 space-y-2">
          {bundle.members.map((member) => <div key={member.id} className="flex justify-between gap-3 border-b py-2">
            <span>{member.name} — {member.role_title}</span>
            <strong>{currency(member.base_price)}/mo</strong>
          </div>)}
        </div>
        <div className="flex justify-between gap-3 text-xl font-bold mt-5">
          <span>Recurring monthly price</span>
          <span>{currency(bundle.pricing?.orca_monthly_price)}/mo</span>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          Exact Stripe recurring prices are verified by the server before checkout. No employee access is activated until signed Stripe confirmation.
        </p>
        {state.entitled ? <Link to="/console" className="inline-flex mt-5 rounded-lg bg-orca-deep-blue text-white font-bold px-5 py-3">
          Manage your subscribed team
        </Link> : <button onClick={checkout} disabled={busy || bundle.pricing?.price_status === 'requires_monthly_pricing'}
          className="w-full mt-5 rounded-lg bg-orca-deep-blue text-white font-bold px-5 py-3 disabled:opacity-50">
          {busy ? 'Opening secure monthly checkout…' : 'Subscribe to the complete team'}
        </button>}
      </section>
    )}
  </main>
}
