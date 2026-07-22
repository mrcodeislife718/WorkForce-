import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import DigitalEmployeeAvatar from './DigitalEmployeeAvatar.jsx'
import OrcaFooter from './OrcaFooter.jsx'
import { avatarSource, currency, employeePricing, employeeProfile, normalizeMode } from '../data/catalogFormatters.js'
import { useStoreCatalog } from '../contexts/StoreCatalogContext.jsx'

export default function WorkerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { catalog } = useStoreCatalog()
  const [worker, setWorker] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get(`/api/workers/${id}`)
      .then((response) => {
        if (cancelled) return
        setWorker(response.data)
        setPermissions(response.data.WorkerPermissions || [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.response?.data?.error || 'Unable to load digital employee.')
      })
    return () => { cancelled = true }
  }, [id])

  if (error) return <main className="orca-detail-shell"><div className="orca-error-state">{error}</div></main>
  if (!worker) return <main className="orca-detail-shell"><div className="orca-loading-state">Loading digital employee…</div></main>

  const profile = employeeProfile(worker)
  const pricing = employeePricing(worker)

  return (
    <>
      <main className="orca-detail-shell">
        <Link className="orca-back-link" to="/store/employees">← Back to digital employees</Link>
        <section className="orca-detail-hero">
          <div className="orca-detail-hero__avatar"><DigitalEmployeeAvatar name={profile.displayName} variant={profile.avatarVariant} src={avatarSource(worker)} /></div>
          <div className="orca-detail-hero__content">
            <span className="orca-section-eyebrow">{worker.developer_name || 'ORCA Studios'} · {worker.readiness_state || 'defined'}</span>
            <h1>{profile.displayName}</h1>
            <h2>{profile.roleTitle}</h2>
            <p>{worker.description}</p>
            <div className="orca-work-mode-row">{profile.workModes.map((mode) => <span key={mode}>{normalizeMode(mode)}</span>)}</div>
            <div className="orca-detail-hero__actions">
              <button type="button" className="orca-button orca-button--primary" onClick={() => navigate(`/interview/${worker.id}`)}>Interview</button>
              <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate(`/sample/${worker.id}`)}>Assign sample work</button>
              <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate(`/purchase/${worker.id}`)}>Select plan</button>
            </div>
          </div>
        </section>

        <section className="orca-profile-grid">
          <article>
            <h3>Professional profile</h3>
            <dl>
              <div><dt>Department</dt><dd>{profile.department}</dd></div>
              <div><dt>Career level</dt><dd>{profile.careerLevel}</dd></div>
              <div><dt>Experience</dt><dd>{profile.experience}</dd></div>
              <div><dt>Availability</dt><dd>24/7/365</dd></div>
            </dl>
            <div className="orca-candidate-card__skills">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
          </article>
          <article>
            <h3>Human collaboration</h3>
            <p>{worker.support_summary || 'Supports human teams and provides role coverage.'}</p>
            <strong>Oversight</strong>
            <p>{worker.human_oversight || 'A customer-assigned human manager owns policy, approvals, escalation, and final decisions.'}</p>
          </article>
          <article>
            <h3>Launch pricing</h3>
            {pricing.orca_monthly_price > 0 ? <><p>Regular human salary benchmark: <strong>{currency(pricing.regular_salary_monthly)}/month</strong></p><p>ORCA launch rate: <strong>{currency(pricing.orca_monthly_price)}/month</strong></p><p>Approximate salary savings: <strong>{currency(pricing.monthly_salary_savings)}/month</strong></p></> : <p>A verified salary benchmark is required before purchase.</p>}
          </article>
        </section>

        <section className="orca-permissions-section">
          <h2>Capabilities and permissions</h2>
          <p>Permissions map to the customer’s connected platforms and are limited to approved resources.</p>
          <div className="orca-permission-list">
            {permissions.map((permission) => <article key={permission.id}><div><strong>{permission.name}</strong><span>{permission.is_required ? 'Required' : 'Optional'} · {permission.risk_level} risk</span></div><p>{permission.description}</p>{permission.requires_human_approval ? <small>Human approval required before execution.</small> : null}</article>)}
          </div>
        </section>
      </main>
      <OrcaFooter navigation={catalog?.navigation || []} />
    </>
  )
}
