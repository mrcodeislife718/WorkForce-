import React, { useEffect, useState } from 'react'
import api from '../api/client'

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {detail && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{detail}</p>}
    </div>
  )
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`
}

export default function Console() {
  const [overview, setOverview] = useState({ metrics: {}, deployments: [], recent_events: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const load = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const response = await api.get('/api/console/overview')
      setOverview(response.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load ORCA Console.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(true)
    const timer = window.setInterval(() => load(false), 15000)
    return () => window.clearInterval(timer)
  }, [])

  const runAction = async (deployment, action) => {
    if (action === 'uninstall' && !window.confirm('Uninstall this digital employee from every connected workspace?')) return
    setActionId(deployment.id)
    setError('')
    try {
      if (action === 'uninstall') await api.delete(`/api/deployments/${deployment.id}`)
      else await api.post(`/api/deployments/${deployment.id}/${action}`)
      await load(false)
    } catch (requestError) {
      const details = requestError.response?.data?.details || []
      setError([requestError.response?.data?.error || `Unable to ${action} digital employee.`, ...details.map((item) => item.error || item.message)].filter(Boolean).join(' '))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12">Loading real ORCA metrics…</div>

  const metrics = overview.metrics || {}

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">ORCA Console</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Real activity, reliability, outcomes, and control for digital employees working across customer-selected platforms.</p>
        </div>
        <button onClick={() => load(true)} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border-color)' }}>Refresh metrics</button>
      </div>

      {error && <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Active digital employees" value={metrics.active_deployments || 0} detail={`${metrics.deployment_count || 0} total deployments`} />
        <MetricCard label="Tasks completed" value={metrics.tasks_completed || 0} detail={`${percent(metrics.task_success_rate)} task success rate`} />
        <MetricCard label="Capability success" value={percent(metrics.capability_success_rate)} detail={`${metrics.capability_executions || 0} real external actions`} />
        <MetricCard label="Estimated time saved" value={`${Number(metrics.estimated_minutes_saved || 0).toFixed(0)} min`} detail="Reported by completed task telemetry" />
        <MetricCard label="Records read" value={metrics.records_read || 0} />
        <MetricCard label="Records created" value={metrics.records_created || 0} />
        <MetricCard label="Records updated" value={metrics.records_updated || 0} />
        <MetricCard label="Degraded deployments" value={metrics.degraded_deployments || 0} />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Digital employees</h2>
        {overview.deployments.length === 0 ? (
          <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <p className="font-semibold">No digital employees deployed yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Browse the Store, connect the tools you use, approve capabilities, and deploy your first digital employee.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {overview.deployments.map((deployment) => (
              <article key={deployment.id} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="flex justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="text-4xl">{deployment.Worker?.icon_url || '🤖'}</span>
                    <div>
                      <h3 className="font-bold text-lg">{deployment.name || deployment.Worker?.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{deployment.availability_target} availability target</p>
                    </div>
                  </div>
                  <span className={`h-fit rounded-full px-2.5 py-1 text-xs font-semibold ${deployment.status === 'active' ? 'bg-green-100 text-green-800' : deployment.status === 'degraded' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{deployment.status}</span>
                </div>

                <div className="mt-4 space-y-2">
                  {(deployment.DeploymentConnections || []).map((binding) => (
                    <div key={binding.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex justify-between gap-3">
                        <div>
                          <strong>{binding.WorkspaceConnection?.workspace_name}</strong>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{binding.WorkspaceConnection?.ConnectorDefinition?.name} · {binding.selected_resource_ids?.length || 0} selected resources</p>
                        </div>
                        <span className="text-xs font-semibold">{binding.status}</span>
                      </div>
                      {binding.last_health_check_at && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Last heartbeat {new Date(binding.last_health_check_at).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {deployment.status === 'active' && <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'pause')} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Pause</button>}
                  {['paused', 'degraded'].includes(deployment.status) && <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'resume')} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Resume and revalidate</button>}
                  <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'uninstall')} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600">Uninstall everywhere</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Recent real activity</h2>
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          {overview.recent_events.length === 0 ? (
            <p className="p-5" style={{ color: 'var(--text-secondary)' }}>No telemetry has been received yet.</p>
          ) : overview.recent_events.map((event) => (
            <div key={event.id} className="border-b last:border-b-0 p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{event.event_type}</strong>
                <time className="text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(event.createdAt).toLocaleString()}</time>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{event.message}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
