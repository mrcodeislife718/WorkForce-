import React from 'react'
import { StarIcon } from '@heroicons/react/20/solid'
import { useNavigate } from 'react-router-dom'

export default function WorkerCard({ worker, onDeploy }) {
  const stars = Math.round(worker.avg_rating)
  const navigate = useNavigate()

  const handleCardClick = () => {
    console.log('Navigating to worker:', worker.id)
    navigate(`/worker/${worker.id}`)
  }

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid var(--border-color)',
        padding: '1rem',
        width: '16rem',
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}
    >
      <div className="flex items-start gap-3">
        <div className="text-4xl">{worker.icon_url || '🤖'}</div>
        <div>
          <h3 style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{worker.name}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>ORCA Studios</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className={`h-4 w-4`} style={{ color: i < stars ? '#fbbf24' : '#d1d5db' }} />
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>({worker.total_reviews})</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span style={{
          fontSize: '0.75rem',
          backgroundColor: 'rgba(14, 77, 255, 0.1)',
          color: 'var(--accent)',
          padding: '0.25rem 0.5rem',
          borderRadius: '9999px',
          fontWeight: '500'
        }}>
          Deploys to Slack
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onDeploy(worker.id)
          }}
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            padding: '0.25rem 1rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Deploy
        </button>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>From ${worker.base_price}/mo</div>
    </div>
  )
}
