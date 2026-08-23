import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams()
  const workerId = searchParams.get('worker_id')
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    let attempts = 0
    const check = async () => {
      attempts += 1
      try {
        const response = await api.get(`/api/billing/worker/${workerId}/status`)
        if (response.data.entitled) {
          setStatus('confirmed')
          return
        }
        if (attempts >= 15) {
          setStatus('pending')
          return
        }
        setTimeout(check, 2000)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to confirm subscription.')
        setStatus('error')
      }
    }
    if (workerId) check()
    else {
      setError('Missing digital employee reference.')
      setStatus('error')
    }
  }, [workerId])

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Subscription confirmation</h1>
      {status === 'checking' && <p className="mt-4">Waiting for Stripe’s signed webhook confirmation…</p>}
      {status === 'confirmed' && (
        <>
          <p className="mt-4 text-green-700 dark:text-green-300">Your subscription is active. ORCA can now continue to workspace selection and permissions.</p>
          <Link to={`/deploy/${workerId}`} className="inline-flex mt-6 rounded-lg bg-orca-deep-blue text-white font-bold px-5 py-3">Continue to deployment</Link>
        </>
      )}
      {status === 'pending' && (
        <>
          <p className="mt-4 text-amber-700 dark:text-amber-300">Payment returned successfully, but ORCA has not yet received the signed Stripe webhook. Deployment remains blocked until confirmation arrives.</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-lg border font-bold px-5 py-3" style={{ borderColor: 'var(--border-color)' }}>Check again</button>
        </>
      )}
      {status === 'error' && <p className="mt-4 text-red-600">{error}</p>}
    </main>
  )
}
