import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import WorkerCard from './WorkerCard.jsx'

export default function Home() {
  const navigate = useNavigate()
  const [topWorkers, setTopWorkers] = useState([])
  const [trending, setTrending] = useState([])
  const [editorsPick, setEditorsPick] = useState([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [top, trend, editors] = await Promise.all([
          api.get('/api/store/top-deployed'),
          api.get('/api/store/trending'),
          api.get('/api/store/editors-choice'),
        ])
        setTopWorkers(top.data)
        setTrending(trend.data)
        setEditorsPick(editors.data)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load the ORCA Store.')
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const trimmed = query.trim()
      if (!trimmed) {
        setSearchResults(null)
        return
      }
      try {
        const response = await api.get('/api/store/search', { params: { q: trimmed } })
        setSearchResults(response.data)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Search failed.')
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const handleDeploy = (id) => navigate(`/deploy/${id}`)

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <section className="rounded-3xl bg-orca-deep-blue text-white p-7 mb-7">
        <p className="text-sm font-semibold text-white/75">ORCA STORE</p>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 max-w-4xl">Hire digital employees that work 24/7/365 in the tools your business already uses.</h1>
        <p className="mt-3 text-white/80 max-w-3xl">Start with a single digital employee. Grow into coordinated teams, departments, and a complete digital workforce.</p>
      </section>

      {error && <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3">{error}</div>}

      <div className="mb-6">
        <input
          type="search"
          placeholder="Search digital employees..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: '100%',
            maxWidth: '34rem',
            padding: '0.65rem 1rem',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {searchResults ? (
        <Section title={`Search results (${searchResults.length})`} workers={searchResults} onDeploy={handleDeploy} />
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
            {['Single digital employees', '24/7/365', 'Workspace agnostic', 'Human governed', 'ORCA Protect'].map((category) => (
              <span key={category} className="px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>{category}</span>
            ))}
          </div>
          <Section title="Top Deployed" workers={topWorkers} onDeploy={handleDeploy} />
          <Section title="Trending" workers={trending} onDeploy={handleDeploy} />
          <Section title="Editors' Choice" workers={editorsPick} onDeploy={handleDeploy} />
        </>
      )}
    </main>
  )
}

function Section({ title, workers, onDeploy }) {
  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {workers.map((worker) => <WorkerCard key={worker.id} worker={worker} onDeploy={onDeploy} />)}
        {workers.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No digital employees matched this search.</p>}
      </div>
    </section>
  )
}
