import React, { useState, useEffect } from 'react'
import axios from 'axios'
import WorkerCard from './WorkerCard.jsx'

export default function Home() {
  const [topWorkers, setTopWorkers] = useState([])
  const [trending, setTrending] = useState([])
  const [editorsPick, setEditorsPick] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [top, trend, editors] = await Promise.all([
          axios.get('/api/store/top-deployed'),
          axios.get('/api/store/trending'),
          axios.get('/api/store/editors-choice'),
        ])
        setTopWorkers(top.data)
        setTrending(trend.data)
        setEditorsPick(editors.data)
      } catch (error) {
        console.error('Error fetching workers:', error)
      }
    }
    fetchData()
  }, [])

  const handleDeploy = async (id) => {
    try {
      // For demo, we'll use a dummy token
      const token = 'dummy_token'
      const response = await axios.post('/api/deployments/initiate', 
        { worker_id: id, tool: 'slack' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(`✅ Worker ${id} deployed successfully! Check Console.`)
      console.log('Deployment response:', response.data)
    } catch (error) {
      console.error('Deployment error:', error)
      alert('❌ Deployment failed. Check console for details.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search for digital employees..." 
          style={{
            width: '100%',
            maxWidth: '28rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            outlineColor: 'var(--accent)'
          }}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
        {['For You', 'Top Deployed', 'Trending', "Editors' Choice", 'New Employees'].map(cat => (
          <span 
            key={cat} 
            style={{
              padding: '0.375rem 1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              fontSize: '0.875rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
          >
            {cat}
          </span>
        ))}
      </div>

      <Section title="Top Deployed" workers={topWorkers} onDeploy={handleDeploy} />
      <Section title="Trending" workers={trending} onDeploy={handleDeploy} />
      <Section title="Editors' Choice" workers={editorsPick} onDeploy={handleDeploy} />
    </div>
  )
}

function Section({ title, workers, onDeploy }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</h2>
        <a href="#" style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '600', transition: 'opacity 0.2s ease' }} onMouseEnter={(e) => e.target.style.opacity = '0.8'} onMouseLeave={(e) => e.target.style.opacity = '1'}>View all &gt;</a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {workers.map(w => (
          <WorkerCard key={w.id} worker={w} onDeploy={onDeploy} />
        ))}
      </div>
    </div>
  )
}
