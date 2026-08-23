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
  const [overview, setOverview] = useState({
    metrics: {},
    deployments: [],
    pending_approvals: [],
    runtime_jobs: [],
    recent_tasks: [],
    recent_events: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [taskDeploymentId, setTaskDeploymentId] = useState(null)
  const [task, setTask] = useState({ title: '', instructions: '', priority: 50 })

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
    const timer = window.setInterval(() => load(false), 10000)
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
      setError([
        requestError.response?.data?.error || `Unable to ${action} digital employee.`,
        ...details.map((item) => item.error || item.message),
      ].filter(Boolean).join(' '))
    } finally {
      setActionId(null)
    }
  }

  const assignTask = async (event) => {
    event.preventDefault()
    setActionId(taskDeploymentId)
    setError('')
    try {
      await api.post(`/api/runtime/assign/${taskDeploymentId}`, {
        title: task.title,
        instructions: task.instructions,
        priority: Number(task.priority),
      })
      setTask({ title: '', instructions: '', priority: 50 })
      setTaskDeploymentId(null)
      await load(false)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to assign task.')
    } finally {
      setActionId(null)
    }
  }

  const decideApproval = async (approval, decision) => {
    setActionId(approval.id)
    setError('')
    try {
      await api.post(`/api/approvals/${approval.id}/${decision}`)
      await load(false)
    } catch (requestError) {
      setError(requestError.response?.data?.error || `Unable to ${decision} action.`)
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
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Real work, reliability, approvals, outcomes, and control across customer-selected platforms.</p>
        </div>
        <button onClick={() => load(true)} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border-color)' }}>Refresh metrics</button>
      </div>

      {error && <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Active digital employees" value={metrics.active_deployments || 0} detail={`${metrics.deployment_count || 0} total deployments`} />
        <MetricCard label="Tasks completed" value={metrics.tasks_completed || 0} detail={`${percent(metrics.task_success_rate)} task success rate`} />
        <MetricCard label="Capability success" value={percent(metrics.capability_success_rate)} detail={`${metrics.capability_executions || 0} real external actions`} />
        <MetricCard label="Estimated time saved" value={`${Number(metrics.estimated_minutes_saved || 0).toFixed(0)} min`} detail="Based on completed task records" />
        <MetricCard label="Queued work" value={metrics.queued_jobs || 0} detail={`${metrics.running_jobs || 0} currently running`} />
        <MetricCard label="Pending approvals" value={metrics.pending_approvals || 0} detail={`${metrics.jobs_waiting_approval || 0} jobs waiting`} />
        <MetricCard label="Updates available" value={metrics.updates_available || 0} />
        <MetricCard label="Degraded deployments" value={metrics.degraded_deployments || 0} />
        <MetricCard label="Records read" value={metrics.records_read || 0} />
        <MetricCard label="Records created" value={metrics.records_created || 0} />
        <MetricCard label="Records updated" value={metrics.records_updated || 0} />
        <MetricCard label="Records deleted" value={metrics.records_deleted || 0} />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Actions requiring your approval</h2>
        {(overview.pending_approvals || []).length === 0 ? (
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No digital employee is waiting for approval.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overview.pending_approvals.map((approval) => (
              <article key={approval.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{approval.Deployment?.Worker?.name || approval.Deployment?.name}</h3>
                    <p className="text-sm mt-1">Requests permission to use <code>{approval.capability_key}</code></p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{approval.reason}</p>
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-semibold">Review requested action</summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(approval.requested_action, null, 2)}</pre>
                    </details>
                  </div>
                  <div className="flex gap-2 h-fit">
                    <button disabled={actionId === approval.id} onClick={() => decideApproval(approval, 'approve')} className="rounded-lg bg-orca-deep-blue text-white font-bold px-4 py-2 disabled:opacity-50">Approve</button>
                    <button disabled={actionId === approval.id} onClick={() => decideApproval(approval, 'deny')} className="rounded-lg border border-red-300 text-red-600 font-bold px-4 py-2 disabled:opacity-50">Deny</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Digital employees</h2>
        {overview.deployments.length === 0 ? (
          <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <p className="font-semibold">No digital employees deployed yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Browse the Store, interview a digital employee, review sample work, purchase it, then connect your real tools.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {overview.deployments.map((deployment) => {
              const updateAvailable = deployment.update_status === 'update_available' || deployment.installed_version !== deployment.Worker?.version
              return (
                <article key={deployment.id} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="text-4xl">{deployment.Worker?.icon_url || '🤖'}</span>
                      <div>
                        <h3 className="font-bold text-lg">{deployment.name || deployment.Worker?.name}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{deployment.availability_target} availability target</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Installed {deployment.installed_version} · Store {deployment.Worker?.version}</p>
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
                        {binding.last_health_check_at && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Last health check {new Date(binding.last_health_check_at).toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>

                  {taskDeploymentId === deployment.id ? (
                    <form onSubmit={assignTask} className="mt-4 rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                      <input className="w-full rounded-lg border px-3 py-2" placeholder="Task title" value={task.title} onChange={(event) => setTask((current) => ({ ...current, title: event.target.value }))} required minLength={3} />
                      <textarea className="w-full min-h-24 rounded-lg border px-3 py-2" placeholder="Detailed instructions for this digital employee" value={task.instructions} onChange={(event) => setTask((current) => ({ ...current, instructions: event.target.value }))} required minLength={10} />
                      <div className="flex gap-2">
                        <button disabled={actionId === deployment.id} className="flex-1 rounded-lg bg-orca-deep-blue text-white font-bold px-3 py-2 disabled:opacity-50">Queue real task</button>
                        <button type="button" onClick={() => setTaskDeploymentId(null)} className="rounded-lg border px-3 py-2">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {deployment.status === 'active' && <button onClick={() => setTaskDeploymentId(deployment.id)} className="rounded-lg bg-orca-deep-blue text-white px-3 py-1.5 text-sm font-semibold">Assign task</button>}
                      {deployment.status === 'active' && <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'pause')} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Pause</button>}
                      {['paused', 'degraded'].includes(deployment.status) && <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'resume')} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Resume and revalidate</button>}
                      {updateAvailable && <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'update')} className="rounded-lg border border-blue-300 text-blue-700 dark:text-blue-300 px-3 py-1.5 text-sm font-semibold">Update to {deployment.Worker?.version}</button>}
                      <button disabled={actionId === deployment.id} onClick={() => runAction(deployment, 'uninstall')} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600">Uninstall everywhere</button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Recent task queue</h2>
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          {(overview.runtime_jobs || []).length === 0 ? (
            <p className="p-5" style={{ color: 'var(--text-secondary)' }}>No runtime jobs have been queued yet.</p>
          ) : overview.runtime_jobs.slice(0, 25).map((job) => (
            <div key={job.id} className="border-b last:border-b-0 p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{job.payload?.title || job.job_type}</strong>
                <span className="text-xs font-semibold">{job.status}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Attempts {job.attempt_count}/{job.max_attempts} · queued {new Date(job.createdAt).toLocaleString()}</p>
              {job.last_error && <p className="text-sm mt-1 text-red-600">{job.last_error}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Recent real activity</h2>
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          {overview.recent_events.length === 0 ? (
            <p className="p-5" style={{ color: 'var(--text-secondary)' }}>No activity has been recorded yet.</p>
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
