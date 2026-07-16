import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { StarIcon } from '@heroicons/react/20/solid'

export default function WorkerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/workers/${id}`)
      .then((response) => {
        setWorker(response.data)
        setPermissions(response.data.WorkerPermissions || [])
      })
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load digital employee.'))
  }, [id])

  if (error) return <div className="max-w-4xl mx-auto px-4 py-12 text-red-600">{error}</div>
  if (!worker) return <div className="max-w-4xl mx-auto px-4 py-12">Loading digital employee…</div>

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-orca-deep-blue rounded-2xl h-48 flex items-center justify-center text-white text-4xl font-bold relative overflow-hidden">
        {worker.hero_banner_url ? <img src={worker.hero_banner_url} alt={worker.name} className="w-full h-full object-cover" /> : <span className="opacity-25">24/7/365</span>}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <span className="text-6xl">{worker.icon_url || '🤖'}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{worker.name}</h1>
            <p className="text-sm text-white/80">ORCA Studios · Workspace-agnostic digital employee</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="flex items-center">
          <StarIcon className="h-5 w-5 text-yellow-400" />
          <span className="font-bold ml-1">{worker.avg_rating || 'New'}</span>
          <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>({worker.total_reviews || 0} reviews)</span>
        </div>
        <span className="font-bold">From ${worker.base_price}/mo</span>
        <span className="text-sm bg-orca-mist dark:bg-blue-900/20 text-orca-slate dark:text-blue-300 px-3 py-1 rounded-full">{worker.category}</span>
        <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">24/7/365</span>
      </div>

      <button onClick={() => navigate(`/interview/${worker.id}`)} className="w-full mt-4 bg-orca-deep-blue hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 rounded-full transition text-lg">
        Interview this digital employee
      </button>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
        {['Interview', 'Sample work', 'Purchase', 'Connect tools', 'Deploy'].map((step, index) => (
          <div key={step} className="rounded-lg border px-2 py-2" style={{ borderColor: 'var(--border-color)' }}>{index + 1}. {step}</div>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="font-bold text-lg">Capabilities and permissions</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>ORCA maps these universal capabilities to whichever compatible platforms and resources you connect.</p>
        <div className="space-y-2 mt-3">
          {permissions.map((permission) => (
            <article key={permission.id} className="rounded-xl border p-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{permission.name}</strong>
                <span className="text-xs rounded-full border px-2 py-1" style={{ borderColor: 'var(--border-color)' }}>{permission.is_required ? 'Required' : 'Optional'} · {permission.risk_level} risk</span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{permission.description}</p>
              <p className="text-xs mt-2 font-mono">{permission.capability_key}</p>
              {permission.requires_human_approval && <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">Human approval required before execution.</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-bold text-lg">About this digital employee</h2>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{worker.description}</p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Version {worker.version} — {worker.release_notes}</p>
      </section>
    </main>
  )
}
