import React, { useEffect, useState } from 'react'
import api from '../api/client'

export default function Billing() {
  const [subscriptions, setSubscriptions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/billing/subscriptions')
      .then((response) => setSubscriptions(response.data.subscriptions || []))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load subscriptions.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ORCA Billing</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Real Stripe subscription status for your digital employees.</p>
      </div>
      {error && <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">{error}</div>}

      {loading ? (
        <p>Loading subscriptions…</p>
      ) : subscriptions.length === 0 ? (
        <section className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold">No subscriptions yet</h2>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Interview a digital employee, review its sample work, then complete checkout from its hiring flow.</p>
        </section>
      ) : (
        <section className="space-y-4">
          {subscriptions.map((subscription) => (
            <article key={subscription.id} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex flex-wrap justify-between gap-4">
                <div className="flex gap-3">
                  <span className="text-4xl">{subscription.Worker?.icon_url || '🤖'}</span>
                  <div>
                    <h2 className="text-lg font-bold">{subscription.Worker?.name || 'Digital employee'}</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Provider: {subscription.provider}</p>
                  </div>
                </div>
                <span className={`h-fit rounded-full px-3 py-1 text-sm font-bold ${['active', 'trialing'].includes(subscription.status) ? 'bg-green-100 text-green-800' : ['past_due', 'unpaid'].includes(subscription.status) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {subscription.status}
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-5 text-sm">
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Price</p>
                  <p className="font-bold">${subscription.Worker?.base_price || '0.00'}/mo</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Current period ends</p>
                  <p className="font-bold">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'Not reported'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Cancellation</p>
                  <p className="font-bold">{subscription.cancel_at_period_end ? 'Ends after current period' : 'Renews automatically'}</p>
                </div>
              </div>
              {subscription.status === 'pending' && (
                <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">ORCA is waiting for Stripe’s signed webhook confirmation. Deployment remains blocked.</p>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
