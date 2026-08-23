import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import WorkerCard from './WorkerCard.jsx'
import CatalogCarousel from './CatalogCarousel.jsx'
import OrcaFooter from './OrcaFooter.jsx'
import { currency } from '../data/catalogFormatters.js'
import { useStoreCatalog } from '../contexts/StoreCatalogContext.jsx'

export default function WorkforceBundleDetail() {
  const { slug } = useParams()
  const { catalog } = useStoreCatalog()
  const [bundle, setBundle] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get(`/api/store/bundles/${slug}`)
      .then((response) => { if (!cancelled) setBundle(response.data) })
      .catch((requestError) => { if (!cancelled) setError(requestError.response?.data?.error || 'Unable to load workforce plan.') })
    return () => { cancelled = true }
  }, [slug])

  if (error) return <main className="orca-detail-shell"><div className="orca-error-state">{error}</div></main>
  if (!bundle) return <main className="orca-detail-shell"><div className="orca-loading-state">Loading workforce plan…</div></main>

  return (
    <>
      <main className="orca-detail-shell">
        <Link className="orca-back-link" to={bundle.type === 'team' ? '/store/teams' : '/store/departments'}>← Back to {bundle.type === 'team' ? 'teams' : 'departments'}</Link>
        <section className="orca-bundle-detail-hero">
          <span className="orca-section-eyebrow">DIGITAL EMPLOYEE {bundle.type.toUpperCase()}</span>
          <h1>{bundle.name}</h1>
          <p>{bundle.description}</p>
          <div className="orca-bundle-detail-hero__facts">
            <span><small>Digital employees</small><strong>{bundle.member_count}</strong></span>
            <span><small>Human authority</small><strong>{bundle.human_authority_required ? 'Required' : 'Customer configured'}</strong></span>
            <span><small>Launch price</small><strong>{currency(bundle.pricing?.orca_monthly_price)}/mo</strong></span>
            <span><small>Salary savings</small><strong>{currency(bundle.pricing?.monthly_salary_savings)}/mo</strong></span>
          </div>
        </section>
        <CatalogCarousel title="Workforce Makeup" subtitle="Every member has a separate profile, interview, sample-work flow, permissions, and salary benchmark.">
          {(bundle.members || []).map((worker) => <WorkerCard key={worker.id} worker={worker} />)}
        </CatalogCarousel>
      </main>
      <OrcaFooter navigation={catalog?.navigation || []} />
    </>
  )
}
