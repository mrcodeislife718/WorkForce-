import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const restOperationsExample = JSON.stringify({
  health: { method: 'GET', path: '/health' },
  'tickets.read': { method: 'GET', path: '/tickets' },
}, null, 2)

// Uses the customer's existing GitHub account and a repository-scoped token.
// The backend encrypts the token and verifies actual repository access.
function githubIssueOperations(owner, repo) {
  const fixed_path_params = { owner, repo }
  const issuesPath = '/repos/{owner}/{repo}/issues'
  return {
    health: { method: 'GET', path: '/user' },
    verify: { method: 'GET', path: issuesPath, fixed_path_params, fixed_query: { per_page: 1 } },
    'issues.read': { method: 'GET', path: issuesPath, fixed_path_params, fixed_query: { per_page: 30 }, description: 'Read existing repository issues' },
    'issues.create': {
      method: 'POST', path: issuesPath, fixed_path_params,
      description: 'Create a repository issue, subject to customer approval',
      example_input: { body: { title: 'Clear issue title', body: 'Reproducible observations, impact and requested next steps' } },
    },
  }
}

export default function Connections() {
  const [catalog, setCatalog] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedKey, setSelectedKey] = useState('generic-rest')
  const [form, setForm] = useState({
    workspace_name: '',
    base_url: '',
    webhook_url: '',
    allowed_hosts: '',
    capabilities: '',
    auth_type: 'bearer_token',
    credential: '',
    basic_username: '',
    basic_password: '',
    webhook_secret: '',
    github_repository: '',
    operations_json: restOperationsExample,
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selected = useMemo(() => catalog.find((item) => item.key === selectedKey), [catalog, selectedKey])

  const load = async () => {
    const [catalogResponse, connectionResponse] = await Promise.all([
      api.get('/api/connectors'),
      api.get('/api/connections'),
    ])
    setCatalog(catalogResponse.data)
    setConnections(connectionResponse.data)
  }

  useEffect(() => {
    load().catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load connections.'))
  }, [])

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const useGitHubIssues = () => {
    const parts = form.github_repository.trim().split('/')
    if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]{1,100}$/.test(part))) {
      setError('Enter the exact GitHub repository as owner/repository.')
      return
    }
    const [owner, repo] = parts
    setSelectedKey('generic-rest')
    setError('')
    setForm((current) => ({
      ...current,
      workspace_name: current.workspace_name || `GitHub ${owner}/${repo}`,
      base_url: 'https://api.github.com',
      allowed_hosts: 'api.github.com',
      capabilities: 'issues.read, issues.create',
      auth_type: 'bearer_token',
      operations_json: JSON.stringify(githubIssueOperations(owner, repo), null, 2),
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      let configuration
      let secrets

      if (selectedKey === 'generic-rest') {
        const operations = JSON.parse(form.operations_json)
        const allowedHosts = form.allowed_hosts.split(',').map((value) => value.trim()).filter(Boolean)
        const capabilities = form.capabilities.split(',').map((value) => value.trim()).filter(Boolean)
        configuration = {
          base_url: form.base_url,
          allowed_hosts: allowedHosts,
          capabilities,
          auth: { type: form.auth_type },
          operations,
        }
        secrets = form.auth_type === 'bearer_token'
          ? { bearer_token: form.credential }
          : form.auth_type === 'api_key'
            ? { api_key: form.credential }
            : form.auth_type === 'basic_auth'
              ? { basic_username: form.basic_username, basic_password: form.basic_password }
              : {}
      } else if (selectedKey === 'generic-webhook') {
        configuration = {
          webhook_url: form.webhook_url,
          allowed_hosts: form.allowed_hosts.split(',').map((value) => value.trim()).filter(Boolean),
          capabilities: form.capabilities.split(',').map((value) => value.trim()).filter(Boolean),
          require_challenge_echo: true,
        }
        secrets = { webhook_secret: form.webhook_secret }
      } else {
        throw new Error('This native connector is not configured yet.')
      }

      await api.post('/api/connections', {
        connector_key: selectedKey,
        workspace_name: form.workspace_name,
        configuration,
        secrets,
      })
      setMessage('Real workspace connection validated and saved.')
      setForm((current) => ({ ...current, workspace_name: '', credential: '', basic_password: '', webhook_secret: '' }))
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to connect workspace.')
    } finally {
      setSubmitting(false)
    }
  }

  const testConnection = async (id) => {
    setError('')
    setMessage('')
    try {
      await api.post(`/api/connections/${id}/test`)
      setMessage('Connection passed its real provider health check.')
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Connection test failed.')
    }
  }

  const discover = async (id) => {
    setError('')
    setMessage('')
    try {
      const response = await api.post(`/api/connections/${id}/discover`)
      setMessage(`${response.data.resources.length} real workspace resources discovered.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Resource discovery failed.')
    }
  }

  const disconnect = async (id) => {
    if (!window.confirm('Disconnect this real workspace and delete its encrypted credentials?')) return
    setError('')
    try {
      await api.delete(`/api/connections/${id}`)
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to disconnect workspace.')
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Connections</h1>
      <p className="mt-1 mb-6" style={{ color: 'var(--text-secondary)' }}>Connect the real platforms and resources where your digital employees will work.</p>

      {error && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}
      {message && <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 p-3">{message}</div>}

      <section className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold">Connect a workspace</h2>
          <label className="block">
            <span className="block text-sm font-semibold mb-1">Integration</span>
            <select className="w-full rounded-lg border px-3 py-2" value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
              {catalog.map((connector) => <option key={connector.key} value={connector.key}>{connector.name}{connector.available ? '' : ' — not configured'}</option>)}
            </select>
          </label>

          {!selected?.available && selectedKey !== 'generic-rest' && selectedKey !== 'generic-webhook' ? (
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-color)' }}>This native connector is listed honestly but cannot be used until its real adapter and provider credentials are configured.</div>
          ) : (
            <>
              <label className="block">
                <span className="block text-sm font-semibold mb-1">Workspace or account name</span>
                <input className="w-full rounded-lg border px-3 py-2" value={form.workspace_name} onChange={update('workspace_name')} required />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold mb-1">Declared capabilities</span>
                <input className="w-full rounded-lg border px-3 py-2" value={form.capabilities} onChange={update('capabilities')} placeholder="messages.read, messages.send" required />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold mb-1">Allowed hosts</span>
                <input className="w-full rounded-lg border px-3 py-2" value={form.allowed_hosts} onChange={update('allowed_hosts')} placeholder="api.example.com" required />
              </label>

              {selectedKey === 'generic-rest' ? (
                <>
                  <label className="block">
                    <span className="block text-sm font-semibold mb-1">Base API URL</span>
                    <input className="w-full rounded-lg border px-3 py-2" type="url" value={form.base_url} onChange={update('base_url')} placeholder="https://api.example.com" required />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold mb-1">Authentication</span>
                    <select className="w-full rounded-lg border px-3 py-2" value={form.auth_type} onChange={update('auth_type')}>
                      <option value="bearer_token">Bearer token</option>
                      <option value="api_key">API key</option>
                      <option value="basic_auth">Basic authentication</option>
                      <option value="none">No authentication</option>
                    </select>
                  </label>
                  {form.auth_type === 'basic_auth' ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="rounded-lg border px-3 py-2" value={form.basic_username} onChange={update('basic_username')} placeholder="Username" required />
                      <input className="rounded-lg border px-3 py-2" type="password" value={form.basic_password} onChange={update('basic_password')} placeholder="Password" required />
                    </div>
                  ) : form.auth_type !== 'none' ? (
                    <input className="w-full rounded-lg border px-3 py-2" type="password" value={form.credential} onChange={update('credential')} placeholder="Credential" required />
                  ) : null}
                  <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="font-semibold text-sm">Use an existing GitHub repository</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Configure real issue reading and approved issue creation without a new service account. Enter a narrowly scoped token below.
                    </p>
                    <input className="w-full rounded-lg border px-3 py-2" value={form.github_repository} onChange={update('github_repository')} placeholder="owner/repository" />
                    <button type="button" onClick={useGitHubIssues} className="rounded-lg border px-3 py-2 text-sm font-semibold">
                      Configure GitHub Issues operations
                    </button>
                  </div>
                  <label className="block">
                    <span className="block text-sm font-semibold mb-1">Real API operations</span>
                    <textarea className="w-full rounded-lg border px-3 py-2 font-mono text-sm" rows={13} value={form.operations_json} onChange={update('operations_json')} required />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="block text-sm font-semibold mb-1">Webhook URL</span>
                    <input className="w-full rounded-lg border px-3 py-2" type="url" value={form.webhook_url} onChange={update('webhook_url')} required />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-semibold mb-1">Shared signing secret</span>
                    <input className="w-full rounded-lg border px-3 py-2" type="password" value={form.webhook_secret} onChange={update('webhook_secret')} required />
                  </label>
                </>
              )}

              <button className="w-full rounded-lg bg-orca-deep-blue text-white font-bold py-2.5 disabled:opacity-50" disabled={submitting}>
                {submitting ? 'Validating real connection…' : 'Connect and validate'}
              </button>
            </>
          )}
        </form>

        <section>
          <h2 className="text-xl font-bold mb-3">Connected workspaces</h2>
          <div className="space-y-3">
            {connections.length === 0 && <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-color)' }}>No real workspace connections yet.</div>}
            {connections.map((connection) => (
              <article key={connection.id} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{connection.workspace_name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{connection.ConnectorDefinition?.name}</p>
                    <p className="text-sm mt-1">Status: <strong>{connection.status}</strong></p>
                    {connection.last_verified_at && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Verified {new Date(connection.last_verified_at).toLocaleString()}</p>}
                  </div>
                  <span className={`h-fit rounded-full px-2.5 py-1 text-xs font-semibold ${connection.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{connection.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button type="button" onClick={() => testConnection(connection.id)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Test</button>
                  <button type="button" onClick={() => discover(connection.id)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Discover resources</button>
                  <button type="button" onClick={() => disconnect(connection.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600">Disconnect</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
