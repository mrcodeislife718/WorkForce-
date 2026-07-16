import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'

export default function DeploymentWizard() {
  const { workerId } = useParams()
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [connectionOptions, setConnectionOptions] = useState([])
  const [assignments, setAssignments] = useState({})
  const [resources, setResources] = useState({})
  const [selectedResources, setSelectedResources] = useState({})
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [workerResponse, prepareResponse] = await Promise.all([
          api.get(`/api/workers/${workerId}`),
          api.get(`/api/deployments/prepare/${workerId}`),
        ])
        if (cancelled) return
        const loadedWorker = workerResponse.data
        const loadedRequirements = prepareResponse.data.requirements || []
        const loadedConnections = prepareResponse.data.connections || []
        setWorker(loadedWorker)
        setName(loadedWorker.name)
        setEligibility(prepareResponse.data.eligibility)
        setRequirements(loadedRequirements)
        setConnectionOptions(loadedConnections)

        const defaults = {}
        for (const requirement of loadedRequirements) {
          const compatible = loadedConnections.find((item) => item.satisfied_capabilities.includes(requirement.capability_key))
          defaults[requirement.capability_key] = {
            connection_id: compatible?.connection?.id || '',
            approved: Boolean(requirement.is_required),
            constraints: {},
          }
        }
        setAssignments(defaults)
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.error || 'Unable to prepare deployment.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [workerId])

  const usedConnectionIds = useMemo(() => [...new Set(
    Object.values(assignments).map((assignment) => assignment.connection_id).filter(Boolean),
  )], [assignments])

  useEffect(() => {
    for (const connectionId of usedConnectionIds) {
      if (resources[connectionId]) continue
      api.get(`/api/connections/${connectionId}`)
        .then((response) => setResources((current) => ({
          ...current,
          [connectionId]: response.data.WorkspaceResources || [],
        })))
        .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load workspace resources.'))
    }
  }, [usedConnectionIds, resources])

  const compatibleFor = (capabilityKey) => connectionOptions.filter(
    (item) => item.satisfied_capabilities.includes(capabilityKey),
  )

  const updateAssignment = (capabilityKey, changes) => {
    setAssignments((current) => ({
      ...current,
      [capabilityKey]: { ...current[capabilityKey], ...changes },
    }))
  }

  const toggleResource = (connectionId, resourceId) => {
    setSelectedResources((current) => {
      const selected = new Set(current[connectionId] || [])
      if (selected.has(resourceId)) selected.delete(resourceId)
      else selected.add(resourceId)
      return { ...current, [connectionId]: [...selected] }
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!eligibility?.eligible) {
      setError('Interview, sample work, and purchase must all be complete before deployment.')
      return
    }
    const missingRequired = requirements.filter((requirement) => {
      const assignment = assignments[requirement.capability_key]
      return requirement.is_required && (!assignment?.approved || !assignment?.connection_id)
    })
    if (missingRequired.length > 0) {
      setError(`Required capabilities are incomplete: ${missingRequired.map((item) => item.capability_key).join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const bindings = usedConnectionIds.map((connectionId) => ({
        connection_id: connectionId,
        selected_resource_ids: selectedResources[connectionId] || [],
      }))
      const capabilityAssignments = requirements
        .filter((requirement) => assignments[requirement.capability_key]?.approved)
        .map((requirement) => ({
          capability_key: requirement.capability_key,
          connection_id: assignments[requirement.capability_key].connection_id,
          approved: true,
          constraints: assignments[requirement.capability_key].constraints || {},
        }))

      const response = await api.post('/api/deployments', {
        worker_id: workerId,
        name,
        bindings,
        capability_assignments: capabilityAssignments,
      })
      navigate(`/console?deployment=${response.data.deployment.id}`)
    } catch (requestError) {
      const details = requestError.response?.data?.details || []
      setError([requestError.response?.data?.error || 'Deployment failed.', ...details.map((item) => typeof item === 'string' ? item : item.message || item.error)].filter(Boolean).join(' '))
    } finally {
      setSubmitting(false)
    }
  }

  if (!worker && !error) return <div className="max-w-5xl mx-auto px-4 py-12">Preparing deployment…</div>

  if (eligibility && !eligibility.eligible) {
    const linkFor = (blocker) => {
      if (blocker.code === 'INTERVIEW_REQUIRED') return `/interview/${workerId}`
      if (blocker.code === 'SAMPLE_REVIEW_REQUIRED') return eligibility.interview_id ? `/sample/${workerId}?interview_id=${eligibility.interview_id}` : `/interview/${workerId}`
      return `/purchase/${workerId}`
    }
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Finish the hiring steps first</h1>
        <p className="mt-2 mb-6" style={{ color: 'var(--text-secondary)' }}>ORCA will not skip evaluation or billing and create a fake active deployment.</p>
        <div className="space-y-3">
          {eligibility.blockers.map((blocker) => (
            <Link key={blocker.code} to={linkFor(blocker)} className="block rounded-xl border p-4 font-semibold" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              {blocker.message} →
            </Link>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Deploy {worker?.name || 'digital employee'}</h1>
      <p className="mt-1 mb-6" style={{ color: 'var(--text-secondary)' }}>Choose the real tools, accounts, and resources where this digital employee will work 24/7/365.</p>
      {error && <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}

      {connectionOptions.length === 0 ? (
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold">Connect the tools you use first</h2>
          <p className="mt-2 mb-4" style={{ color: 'var(--text-secondary)' }}>ORCA found no validated workspace connections for this account.</p>
          <Link to="/connections" className="inline-flex rounded-lg bg-orca-deep-blue text-white font-bold px-4 py-2">Connect a real workspace</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <label className="block">
              <span className="block font-semibold mb-1">Deployment name</span>
              <input className="w-full rounded-lg border px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          </section>

          <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Capabilities and permissions</h2>
            <div className="space-y-4">
              {requirements.map((requirement) => {
                const compatible = compatibleFor(requirement.capability_key)
                const assignment = assignments[requirement.capability_key] || {}
                return (
                  <article key={requirement.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{requirement.name}</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{requirement.description}</p>
                        <p className="text-xs mt-2">{requirement.capability_key} · {requirement.risk_level} risk · {requirement.is_required ? 'required' : 'optional'}</p>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={Boolean(assignment.approved)} disabled={requirement.is_required} onChange={(event) => updateAssignment(requirement.capability_key, { approved: event.target.checked })} />
                        Approve
                      </label>
                    </div>
                    {assignment.approved && (
                      <label className="block mt-3">
                        <span className="block text-sm font-semibold mb-1">Use this real connection</span>
                        <select className="w-full rounded-lg border px-3 py-2" value={assignment.connection_id || ''} onChange={(event) => updateAssignment(requirement.capability_key, { connection_id: event.target.value })} required={requirement.is_required}>
                          <option value="">Select a compatible connection</option>
                          {compatible.map((item) => (
                            <option key={item.connection.id} value={item.connection.id}>{item.connection.workspace_name} — {item.connection.ConnectorDefinition?.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {assignment.approved && compatible.length === 0 && <p className="mt-3 text-sm text-red-600">No connected platform currently provides this capability.</p>}
                  </article>
                )
              })}
            </div>
          </section>

          {usedConnectionIds.map((connectionId) => {
            const option = connectionOptions.find((item) => item.connection.id === connectionId)
            const availableResources = resources[connectionId] || []
            return (
              <section key={connectionId} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-xl font-bold">Resources in {option?.connection.workspace_name}</h2>
                <p className="text-sm mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>Select only the channels, inboxes, stores, folders, or other resources this digital employee may use.</p>
                {availableResources.length === 0 ? (
                  <p className="text-sm">This connection reported no selectable resources. Its approved capabilities remain limited by the connection configuration.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {availableResources.map((resource) => (
                      <label key={resource.id} className="flex items-center gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--border-color)' }}>
                        <input type="checkbox" checked={(selectedResources[connectionId] || []).includes(resource.id)} onChange={() => toggleResource(connectionId, resource.id)} />
                        <span><strong>{resource.name}</strong><span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>{resource.resource_type}</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-bold">Final deployment check</h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>ORCA will revalidate every real connection, install the digital employee through each selected adapter, issue a protected runtime credential, and mark it active only after every installation succeeds.</p>
            <button className="mt-4 w-full rounded-lg bg-orca-deep-blue text-white font-bold py-3 disabled:opacity-50" disabled={submitting}>
              {submitting ? 'Installing and validating…' : 'Deploy digital employee'}
            </button>
          </section>
        </form>
      )}
    </main>
  )
}
