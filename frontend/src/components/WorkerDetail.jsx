import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import DigitalEmployeeAvatar from './DigitalEmployeeAvatar.jsx'
import OrcaFooter from './OrcaFooter.jsx'
import { avatarSource, currency, employeePricing, employeeProfile, normalizeMode } from '../data/catalogFormatters.js'
import { useStoreCatalog } from '../contexts/StoreCatalogContext.jsx'

function array(value) { return Array.isArray(value) ? value : [] }

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

  const catalogEmployee = (catalog?.employees || []).find((employee) => employee.id === worker.id)
  const resolvedWorker = catalogEmployee ? { ...worker, ...catalogEmployee } : worker
  const profile = employeeProfile(resolvedWorker)
  const pricing = employeePricing(resolvedWorker)
  const systems = array(resolvedWorker.supported_systems)
  const channels = array(resolvedWorker.supported_channels)
  const evaluations = array(resolvedWorker.evaluation_options)
  const teamRoles = array(resolvedWorker.team_roles)

  return (
    <>
      <main className="orca-detail-shell">
        <Link className="orca-back-link" to="/store/employees">← Back to digital employees</Link>
        <section className="orca-detail-hero">
          <div className="orca-detail-hero__avatar"><DigitalEmployeeAvatar name={profile.displayName} variant={profile.avatarVariant} src={avatarSource(resolvedWorker)} /></div>
          <div className="orca-detail-hero__content">
            <span className="orca-section-eyebrow">{resolvedWorker.publisher_name || resolvedWorker.developer_name || 'ORCA Studios'} · {resolvedWorker.readiness_state || 'defined'} · {resolvedWorker.evidence_status === 'verified' ? 'verified evidence' : 'evidence pending'}</span>
            <h1>{profile.displayName}</h1>
            <h2>{profile.roleTitle}</h2>
            <p>{resolvedWorker.description}</p>
            <div className="orca-work-mode-row">{profile.workModes.map((mode) => <span key={mode}>{normalizeMode(mode)}</span>)}</div>
            <div className="orca-detail-hero__actions">
              <button type="button" className="orca-button orca-button--primary" onClick={() => navigate(`/interview/${resolvedWorker.id}`)}>Interview</button>
              <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate(`/sample/${resolvedWorker.id}`)}>Assign sample work</button>
              <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate(`/purchase/${resolvedWorker.id}`)}>Select plan</button>
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
              <div><dt>Availability</dt><dd>{resolvedWorker.availability || '24/7/365'}</dd></div>
              <div><dt>Publisher</dt><dd>{resolvedWorker.publisher_name || resolvedWorker.developer_name || 'ORCA Studios'}{resolvedWorker.publisher_type === 'third_party' ? ' (third-party)' : ' (first-party)'}</dd></div>
              <div><dt>Protection</dt><dd>{resolvedWorker.protect_level || 'ORCA Protect Standard'}</dd></div>
            </dl>
            <div className="orca-candidate-card__skills">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
          </article>
          <article>
            <h3>Human collaboration</h3>
            <p>{resolvedWorker.support_summary || 'Supports human teams and provides role coverage.'}</p>
            <strong>Oversight</strong>
            <p>{resolvedWorker.human_oversight || 'A customer-assigned human manager owns policy, approvals, escalation, and final decisions.'}</p>
            <strong>Execution limits</strong>
            <p>{resolvedWorker.execution_limits || 'Customer-approved scope, resources, permissions, and policies apply.'}</p>
          </article>
          <article>
            <h3>Launch pricing</h3>
            {pricing.orca_monthly_price > 0 ? <><p>Regular human salary benchmark: <strong>{currency(pricing.regular_salary_monthly)}/month</strong></p><p>ORCA launch rate: <strong>{currency(pricing.orca_monthly_price)}/month</strong></p><p>Approximate salary savings: <strong>{currency(pricing.monthly_salary_savings)}/month</strong></p>{Number(resolvedWorker.activation_fee || 0) > 0 ? <p>Activation fee: <strong>{currency(Number(resolvedWorker.activation_fee))}</strong></p> : null}</> : <p>A verified salary benchmark is required before purchase.</p>}
            <strong>Included workload</strong>
            <p>{resolvedWorker.included_workload || 'Finalized during role scoping.'}</p>
            {resolvedWorker.overage_pricing ? <><strong>Overage policy</strong><p>{resolvedWorker.overage_pricing}</p></> : null}
          </article>
          <article>
            <h3>Systems and channels</h3>
            <p><strong>Systems:</strong> {systems.length ? systems.join(' · ') : 'Selected during connection setup.'}</p>
            <p><strong>Channels:</strong> {channels.length ? channels.join(' · ') : 'Selected during deployment.'}</p>
            <p><strong>Included integrations:</strong> {Number(resolvedWorker.integrations_included || 0) || 'Scoped during onboarding'}</p>
          </article>
          <article>
            <h3>Evaluation before deployment</h3>
            <p>{resolvedWorker.evidence_status === 'verified' ? 'Verified evaluation evidence is available for this digital employee.' : 'Public evaluation evidence has not yet been marked verified. Interview and sample-work flows remain available before purchase.'}</p>
            <div className="orca-candidate-card__skills">{evaluations.map((option) => <span key={option}>{option}</span>)}</div>
          </article>
          {teamRoles.length ? <article><h3>Team composition</h3><p>This product is a coordinated multi-employee workforce.</p><div className="orca-candidate-card__skills">{teamRoles.map((role) => <span key={role}>{role}</span>)}</div></article> : null}
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
