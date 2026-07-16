import React from 'react'
import { StarIcon } from '@heroicons/react/20/solid'
import { useNavigate } from 'react-router-dom'
import { formatMoney, getDigitalEmployeePresentation } from '../lib/digitalEmployeePresentation'

export default function WorkerCard({ worker }) {
  const navigate = useNavigate()
  const digitalEmployee = getDigitalEmployeePresentation(worker)
  const profilePath = `/worker/${digitalEmployee.id}`

  const openProfile = () => navigate(profilePath)
  const openInterview = () => navigate(`${profilePath}?action=interview#evaluation`)

  return (
    <article className="digital-employee-card">
      <div className="digital-employee-card__identity">
        <div className="digital-employee-card__icon" aria-hidden="true">
          {digitalEmployee.icon}
        </div>

        <div className="digital-employee-card__identity-copy">
          <div className="digital-employee-card__title-row">
            <h3>{digitalEmployee.displayName}</h3>
            {digitalEmployee.isVerified && (
              <span className="verified-mark" title="Verified publisher" aria-label="Verified publisher">✓</span>
            )}
          </div>

          <p className="digital-employee-card__publisher">
            {digitalEmployee.publisherName} · {digitalEmployee.publisherTypeLabel}
          </p>

          <div className="digital-employee-card__evidence">
            {digitalEmployee.hasVerifiedEvidence ? (
              <>
                <StarIcon className="rating-star" aria-hidden="true" />
                <span>{digitalEmployee.rating.toFixed(1)} customer rating</span>
                <span aria-hidden="true">·</span>
                <span>{digitalEmployee.customerReviews.toLocaleString()} verified evaluations</span>
              </>
            ) : (
              <span>New digital employee · evaluation data not yet published</span>
            )}
          </div>
        </div>
      </div>

      <p className="digital-employee-card__description">{digitalEmployee.description}</p>

      <div className="digital-employee-card__role-meta">
        <span>{digitalEmployee.categoryLabel}</span>
        <span>{digitalEmployee.productTypeLabel}</span>
      </div>

      <div className="digital-employee-card__chips" aria-label="Evaluation and trust options">
        {digitalEmployee.evaluationOptions.slice(0, 2).map((option) => (
          <span key={option} className="orca-chip">{option}</span>
        ))}
        <span className="orca-chip orca-chip--protect">{digitalEmployee.protectLevel}</span>
      </div>

      <dl className="digital-employee-card__operations">
        <div>
          <dt>Supported systems</dt>
          <dd>{digitalEmployee.supportedSystems.slice(0, 3).join(' · ') || 'Configured during onboarding'}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{digitalEmployee.availability}</dd>
        </div>
        <div>
          <dt>Included workload</dt>
          <dd>{digitalEmployee.includedWorkload}</dd>
        </div>
      </dl>

      <div className="digital-employee-card__pricing">
        <div>
          <p className="digital-employee-card__price">
            {formatMoney(digitalEmployee.employmentFee)}<span>/month</span>
          </p>
          <p className="digital-employee-card__price-label">Monthly employment fee</p>
        </div>

        {digitalEmployee.comparableMonthlySalary > 0 && (
          <div className="digital-employee-card__salary-comparison">
            <span>Comparable human base salary</span>
            <strong>{formatMoney(digitalEmployee.comparableMonthlySalary)}/month</strong>
            <small>Approximately {digitalEmployee.salaryDifferencePercent}% below the comparable monthly base salary</small>
          </div>
        )}
      </div>

      <div className="digital-employee-card__actions">
        <button type="button" className="orca-button orca-button--primary" onClick={openInterview}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12a8.4 8.4 0 0 1-9 8.38 9.1 9.1 0 0 1-3.8-.84L3 21l1.48-4.5A8.4 8.4 0 1 1 21 12Z" />
          </svg>
          Interview
        </button>
        <button type="button" className="orca-button orca-button--secondary" onClick={openProfile}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          View Profile
        </button>
      </div>
    </article>
  )
}
