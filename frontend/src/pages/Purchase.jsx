import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'

export default function Purchase() {
  const { workerId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/api/billing/worker/${workerId}/status`)
      .then((response) => {
        setStatus(response.data)
        if (response.data.entitled) navigate(`/deploy/${workerId}`, { replace: true })
      })
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load purchase status.'))
  }, [workerId, navigate])

  const checkout = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await api.post('/api/billing/checkout-session', { worker_id: workerId })
      if (!response.data.url) throw new Error('Stripe did not return a checkout URL.')
      window.location.assign(response.data.url)
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to start checkout.')
      setBusy(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Hire this digital employee</h1>
      <p className="mt-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
        Choose the listed purchase option. After secure payment is confirmed, choose the employee’s workspace and permissions.
      </p>
      {error && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">{error}</div>}
      <section className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        {!status ? (
          <p>Checking billing status…</p>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{status.price_model === 'one_time' ? 'One-time digital employee license' : status.price_model === 'free' ? 'Free digital employee' : 'Monthly digital employee subscription'}</h2>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>The employee is activated only after purchase confirmation and your workspace approval.</p>
              </div>
              <p className="text-xl font-bold">${status.base_price}{status.price_model === 'subscription' ? '/mo' : ''}</p>
            </div>
            {!status.stripe_price_configured && status.price_model !== 'free' && (
              <p className="mt-4 text-amber-700 dark:text-amber-300">A real Stripe price must be configured by ORCA before checkout can begin.</p>
            )}
            <button
              onClick={checkout}
              disabled={busy || (!status.stripe_price_configured && status.price_model !== 'free')}
              className="mt-6 w-full rounded-lg bg-orca-deep-blue text-white font-bold py-3 disabled:opacity-50"
            >
              {busy ? 'Opening secure checkout…' : status.price_model === 'free' ? 'Continue to deployment' : status.price_model === 'one_time' ? 'Buy securely' : 'Subscribe securely'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
}{status.base_price}{status.price_model === 'subscription' ? '/mo' : ''}</p>
            </div>
            {!status.stripe_price_configured && status.price_model !== 'free' && (
              <p className="mt-4 text-amber-700 dark:text-amber-300">A real Stripe price must be configured by ORCA before checkout can begin.</p>
            )}
            <button
              onClick={checkout}
              disabled={busy || (!status.stripe_price_configured && status.price_model !== 'free')}
              className="mt-6 w-full rounded-lg bg-orca-deep-blue text-white font-bold py-3 disabled:opacity-50"
            >
              {busy ? 'Opening secure checkout…' : status.price_model === 'free' ? 'Continue to deployment' : status.price_model === 'one_time' ? 'Buy securely' : 'Subscribe securely'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
