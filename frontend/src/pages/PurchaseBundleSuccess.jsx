import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function PurchaseBundleSuccess() {
  const [query] = useSearchParams()
  const slug = query.get('slug')
  const [state, setState] = useState('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!slug) { setState('error'); setMessage('Workforce plan reference is missing.'); return }
    let stopped = false
    let timeout
    let attempts = 0
    const poll = async () => {
      attempts += 1
      try {
        const response = await api.get(`/api/billing/bundle/${encodeURIComponent(slug)}/status`)
        if (stopped) return
        if (response.data.entitled) {
          setState('confirmed')
          return
        }
        if (attempts >= 15) {
          setState('pending')
          return
        }
        timeout = window.setTimeout(poll, 2000)
      } catch (err) {
        if (!stopped) {
          setMessage(err.response?.data?.error || 'Unable to confirm monthly team subscription.')
          setState('error')
        }
      }
    }
    poll()
    return () => { stopped = true; if (timeout) window.clearTimeout(timeout) }
  }, [slug])

  return <main className="max-w-2xl mx-auto px-4 py-16">
    <h1 className="text-3xl font-bold">Workforce subscription confirmation</h1>
    {state === 'checking' && <p className="mt-4">Verifying your team subscription with the payment system…</p>}
    {state === 'confirmed' && <>
      <p className="mt-4">Your monthly team subscription is confirmed. You can now deploy each employee into the approved workspace.</p>
      <Link className="inline-flex mt-5 rounded-lg bg-orca-deep-blue text-white font-bold px-5 py-3"
        to={`/store/bundles/${slug}`}>Choose employees to deploy</Link>
    </>}
    {state === 'pending' && <>
      <p className="mt-4">The secure checkout has returned, but subscription confirmation is still pending. No employee access has been granted early.</p>
      <button className="mt-5 rounded-lg border px-4 py-2" onClick={() => window.location.reload()}>Recheck payment status</button>
    </>}
    {state === 'error' && <p role="alert" className="mt-4 text-red-600">{message}</p>}
  </main>
}
