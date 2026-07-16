import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { StarIcon } from '@heroicons/react/20/solid'
import { formatMoney, getDigitalEmployeePresentation } from '../lib/digitalEmployeePresentation'

export default function WorkerDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [worker, setWorker] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestedAction = searchParams.get('action')
  const [selectedEvaluation, setSelectedEvaluation] = useState(requestedAction || 'interview')

  useEffect(() => {
    let mounted = true

    const fetchDigitalEmployee = async () => {
      try {
        let response
        try {
          response = await axios.get(`/api/digital-employees/${id}`)
        } catch (primaryError) {
          response = await axios.get(`/api/workers/${id}`)
        }

        if (!mounted) return
        setWorker(response.data)
        setPermissions(response.data.WorkerPermissions || [])
      } catch (fetchError) {
        console.error('Digital employee profile failed to load:', fetchError)
        if (mounted) setError('This digital employee profile could not be loaded.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDigitalEmployee()
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    if (!worker || !requestedAction) return
    setSelectedEvaluation(requestedAction)
    window.setTimeout(() => {
      document.getElementById('evaluation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [requestedAction, worker])

  const digitalEmployee = useMemo(
    () => getDigitalEmployeePresentation(worker || {}),
    [worker],
  )

  const chooseEvaluation = (type) => {
    setSelectedEvaluation(type)
    document.getElementById('evaluation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return <div className="orca-loading">Loading digital employee profile…</div>
  if (error || !worker) return <div className="orca-alert" role="alert">{error || 'Digital employee not found.'}</div>

  return (
    <main className="digital-employee-profile">
      <section className="digital-employee-profile__hero">
        <div className="digital-employee-profile__hero-icon" aria-hidden="true">{digitalEmployee.icon}</div>
        <div className="digital-employee-profile__hero-copy">
          <p className="orca-eyebrow">{digitalEmployee.productTypeLabel}</p>
          <h1>{digitalEmployee.displayName}</h1>
          <p>{digitalEmployee.description}</p>
          <div className="digital-employee-profile__publisher">
            <strong>{digitalEmployee.publisherName}</strong>
            <span>{digitalEmployee.publisherTypeLabel}</span>
            {digitalEmployee.isVerified && <span>Verified publisher</span>}
            {digitalEmployee.isOrcaCertified && <span>ORCA-certified</span>}
          </div>
        </div>
      </section>

      <section className="digital-employee-profile__summary" aria-label="Digital employee commercial summary">
        <div className="digital-employee-profile__evidence">
          {digitalEmployee.hasVerifiedEvidence ? (
            <>
              <StarIcon className="rating-star" aria-hidden="true" />
              <strong>{digitalEmployee.rating.toFixed(1)} customer rating</strong>
              <span>{digitalEmployee.customerReviews.toLocaleString()} verified evaluations</span>
              <span>{digitalEmployee.activeDeployments.toLocaleString()} active deployments</span>
            </>
          ) : (
            <>
              <strong>New digital employee</strong>
              <span>Verified evaluation and deployment data will appear only after real customer activity.</span>
            </>
          )}
        </div>

        <div className="digital-employee-profile__price-card">
          <p className="digital-employee-profile__price">
            {formatMoney(digitalEmployee.employmentFee)}<span>/month</span>
          </p>
          <p>Monthly employment fee</p>
          {digitalEmployee.comparableMonthlySalary > 0 && (
            <div className="digital-employee-profile__salary">
              <span>Comparable human base salary</span>
              <strong>{formatMoney(digitalEmployee.comparableMonthlySalary)}/month</strong>
              <small>Approximately {digitalEmployee.salaryDifferencePercent}% below the comparable monthly base salary</small>
            </div>
          )}
        </div>
      </section>

      <section className="digital-employee-profile__actions" aria-label="Evaluate this digital employee">
        <button type="button" className="orca-button orca-button--primary" onClick={() => chooseEvaluation('interview')}>
          Interview
        </button>
        <button type="button" className="orca-button orca-button--secondary" onClick={() => chooseEvaluation('sample-work')}>
          Assign Sample Work
        </button>
        <button type="button" className="orca-button orca-button--disabled" disabled>
          Pay and Deploy After Evaluation
        </button>
      </section>

      <section className="digital-employee-profile__grid">
        <article className="orca-profile-panel">
          <h2>What the monthly fee includes</h2>
          <dl className="orca-profile-list">
            <div><dt>Included workload</dt><dd>{digitalEmployee.includedWorkload}</dd></div>
            <div><dt>Supported channels</dt><dd>{digitalEmployee.supportedChannels.join(' · ') || 'Configured during onboarding'}</dd></div>
            <div><dt>Included integrations</dt><dd>{digitalEmployee.integrationsIncluded} integrations</dd></div>
            <div><dt>Availability</dt><dd>{digitalEmployee.availability}</dd></div>
            <div><dt>Support</dt><dd>{digitalEmployee.supportLevel}</dd></div>
            <div><dt>Protection</dt><dd>{digitalEmployee.protectLevel}</dd></div>
            <div><dt>Execution limits</dt><dd>{digitalEmployee.executionLimits}</dd></div>
            <div><dt>Overage pricing</dt><dd>{digitalEmployee.overagePricing}</dd></div>
            <div><dt>Activation fee</dt><dd>{formatMoney(digitalEmployee.activationFee)} one time</dd></div>
          </dl>
        </article>

        <article className="orca-profile-panel">
          <h2>Professional profile</h2>
          <dl className="orca-profile-list">
            <div><dt>Business function</dt><dd>{digitalEmployee.categoryLabel}</dd></div>
            <div><dt>Product type</dt><dd>{digitalEmployee.productTypeLabel}</dd></div>
            <div><dt>Supported systems</dt><dd>{digitalEmployee.supportedSystems.join(' · ') || 'Configured during onboarding'}</dd></div>
            <div><dt>Publisher</dt><dd>{digitalEmployee.publisherName} · {digitalEmployee.publisherTypeLabel}</dd></div>
            <div><dt>Version</dt><dd>{digitalEmployee.version}</dd></div>
            <div><dt>Release notes</dt><dd>{digitalEmployee.releaseNotes}</dd></div>
          </dl>

          {digitalEmployee.teamRoles.length > 0 && (
            <div className="digital-employee-profile__team">
              <h3>Digital employees included in this team</h3>
              <div className="digital-employee-profile__team-roles">
                {digitalEmployee.teamRoles.map((role) => <span key={role}>{role}</span>)}
              </div>
            </div>
          )}
        </article>
      </section>

      <section id="evaluation" className="orca-profile-panel digital-employee-profile__evaluation">
        <div className="digital-employee-profile__evaluation-heading">
          <div>
            <p className="orca-eyebrow">Evaluate before deployment</p>
            <h2>{selectedEvaluation === 'sample-work' ? 'Assign Sample Work' : 'Interview This Digital Employee'}</h2>
          </div>
          <span>{digitalEmployee.protectLevel}</span>
        </div>

        <p>
          Use a bounded, reasonable evaluation to confirm role knowledge, judgment, policy compliance,
          communication quality, and supported-system readiness before paying and deploying.
        </p>

        <div className="digital-employee-profile__evaluation-options">
          {digitalEmployee.evaluationOptions.map((option) => (
            <button
              type="button"
              key={option}
              className={selectedEvaluation === option.toLowerCase().replaceAll(' ', '-') ? 'is-selected' : ''}
              onClick={() => setSelectedEvaluation(option.toLowerCase().replaceAll(' ', '-'))}
            >
              <strong>{option}</strong>
              <span>Define instructions, evidence requirements, completion limits, and review criteria.</span>
            </button>
          ))}
        </div>

        <div className="digital-employee-profile__evaluation-policy">
          <strong>Evaluation protects both sides.</strong>
          <span>Testing demonstrates capability; it cannot be used as a substitute for unpaid production work.</span>
        </div>
      </section>

      <section className="orca-profile-panel digital-employee-profile__permissions">
        <h2>Access requested before deployment</h2>
        <p>ORCA Protect presents every required permission for customer approval before workspace connection.</p>
        <div className="digital-employee-profile__permission-list">
          {permissions.length > 0 ? permissions.map((permission) => (
            <span key={permission.id}>
              <strong>{permission.tool.toUpperCase()}</strong>
              {permission.scope}
              {permission.is_required ? ' · Required' : ' · Optional'}
            </span>
          )) : <span>No production permissions are requested until deployment configuration begins.</span>}
        </div>
      </section>
    </main>
  )
}
