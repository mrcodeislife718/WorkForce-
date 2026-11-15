import React, { useEffect, useState } from 'react'
import api from '../api/client'

export default function Billing() {
  const [subscriptions, setSubscriptions] = useState([])
  const [purchases, setPurchases] = useState([])
  const [portalBusy, setPortalBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/billing/subscriptions'),
      api.get('/api/billing/purchases'),
    ])
      .then(([subscriptionsResponse, purchasesResponse]) => {
        setSubscriptions(subscriptionsResponse.data.subscriptions || [])
        setPurchases(purchasesResponse.data.purchases || [])
      })
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load billing history.'))
      .finally(() => setLoading(false))
  }, [])

  const openPortal = async () => {
    setPortalBusy(true)
    setError('')
    try {
      const response = await api.post('/api/billing/portal')
      if (!response.data.url) throw new Error('Billing management link was not returned.')
      window.location.assign(response.data.url)
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to open billing management.')
      setPortalBusy(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ORCA Billing</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Confirmed subscriptions, one-time licenses and secure payment management.</p>
        <button type="button" disabled={portalBusy || (subscriptions.length === 0 && purchases.length === 0)}
          onClick={openPortal} className="mt-4 rounded-lg bg-orca-deep-blue px-4 py-2 text-white font-bold disabled:opacity-50">
          {portalBusy ? 'Opening…' : 'Manage billing securely'}
        </button>
      </div>
      {error && <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">{error}</div>}

      {loading ? (
        <p>Loading subscriptions…</p>
      ) : subscriptions.length === 0 ? (
        <section className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold">No subscriptions yet</h2>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Browse a digital employee, choose its listed plan, and complete secure checkout.</p>
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
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">One-time licenses</h2>
        {purchases.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No one-time purchases on this account.</p>
        ) : purchases.map((purchase) => (
          <article key={purchase.id} className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="font-bold">{purchase.Worker?.name || 'Digital employee'}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString() : 'Payment confirmation pending'}
                </p>
              </div>
              <span className="font-semibold">{purchase.status.replaceAll('_', ' ')}</span>
            </div>
            <p className="mt-3 font-bold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: purchase.currency.toUpperCase() }).format(purchase.amount_cents / 100)}
            </p>
            {purchase.status === 'refunded' || purchase.status === 'disputed'
              ? <p className="mt-2 text-sm text-amber-700">Access is suspended until billing is resolved.</p>
              : null}
          </article>
        ))}
      </section>
    </main>
  )
}
