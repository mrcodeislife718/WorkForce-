import React from 'react'
import { StarIcon } from '@heroicons/react/20/solid'
import { useNavigate } from 'react-router-dom'

export default function WorkerCard({ worker, onDeploy }) {
  const stars = Math.round(worker.avg_rating || 0)
  const navigate = useNavigate()

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid var(--border-color)',
        padding: '1rem',
        width: '17rem',
        flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/worker/${worker.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="text-4xl">{worker.icon_url || '🤖'}</div>
        <div>
          <h3 className="font-bold m-0">{worker.name}</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>ORCA Studios · 24/7/365</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, index) => (
              <StarIcon key={index} className="h-4 w-4" style={{ color: index < stars ? '#fbbf24' : '#d1d5db' }} />
            ))}
            <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>({worker.total_reviews || 0})</span>
          </div>
        </div>
      </div>
      <p className="text-sm mt-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{worker.description}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs rounded-full px-2 py-1 font-semibold" style={{ backgroundColor: 'rgba(14, 77, 255, 0.1)', color: 'var(--accent)' }}>Works in your tools</span>
        <button
          onClick={(event) => {
            event.stopPropagation()
            onDeploy(worker.id)
          }}
          className="rounded-full bg-orca-deep-blue text-white text-sm font-semibold px-4 py-1.5"
        >
          Deploy
        </button>
      </div>
      <div className="mt-2 text-sm font-semibold">From ${worker.base_price}/mo</div>
    </article>
  )
}
