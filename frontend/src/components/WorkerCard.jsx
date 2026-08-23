import React from 'react'
import { useNavigate } from 'react-router-dom'
import DigitalEmployeeAvatar from './DigitalEmployeeAvatar.jsx'
import { avatarSource, currency, employeePricing, employeeProfile, normalizeMode } from '../data/catalogFormatters.js'

function readinessLabel(employee) {
  const state = String(employee.readiness_state || 'defined').replaceAll('_', ' ')
  return state.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function evidenceLabel(worker) {
  if (worker.evidence_status === 'verified') return 'Verified evidence'
  if (worker.is_orca_certified) return 'ORCA certified · evidence pending'
  return 'Evaluation data pending'
}

export default function WorkerCard({ worker }) {
  const navigate = useNavigate()
  const profile = employeeProfile(worker)
  const pricing = employeePricing(worker)
  const systems = Array.isArray(worker.supported_systems) ? worker.supported_systems : []
  const evaluations = Array.isArray(worker.evaluation_options) ? worker.evaluation_options : []

  return (
    <article className="orca-employee-card" aria-label={`${profile.displayName}, ${profile.roleTitle}`}>
      <div className="orca-candidate-card__visual">
        <DigitalEmployeeAvatar name={profile.displayName} variant={profile.avatarVariant} src={avatarSource(worker)} />
        <div className="orca-employee-card__badges">
          <span className="orca-badge orca-badge--availability">{worker.availability || '24/7/365'}</span>
          <span className="orca-badge orca-badge--verified">{readinessLabel(worker)}</span>
        </div>
      </div>
      <div className="orca-employee-card__body">
        <p className="orca-employee-card__developer">{worker.publisher_name || worker.developer_name || 'ORCA Studios'}{worker.publisher_type === 'third_party' ? ' · Third-party' : ' · First-party'}</p>
        <h3>{profile.displayName}</h3>
        <p className="orca-candidate-card__role">{profile.roleTitle}</p>
        <div className="orca-candidate-card__facts">
          <span><small>Department</small><strong>{profile.department}</strong></span>
          <span><small>Career level</small><strong>{profile.careerLevel}</strong></span>
          <span><small>Experience</small><strong>{profile.experience}</strong></span>
        </div>
        <div className="orca-candidate-card__skills">
          {profile.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
        </div>
        <p className="orca-employee-card__description">{worker.description}</p>
        <div className="orca-candidate-card__collaboration">
          <strong>Works with your people</strong>
          <span>{worker.support_summary || 'Supports human teams, covers operational gaps, and reports to the assigned human manager.'}</span>
        </div>
        <div className="orca-work-mode-row">
          {profile.workModes.map((mode) => <span key={mode}>{normalizeMode(mode)}</span>)}
        </div>
        <div className="orca-candidate-card__collaboration">
          <strong>{evidenceLabel(worker)}</strong>
          <span>{worker.included_workload || 'Workload is defined during role scoping.'}</span>
          {systems.length ? <span>Systems: {systems.slice(0, 4).join(' · ')}</span> : null}
          <span>{worker.protect_level || 'ORCA Protect Standard'}</span>
        </div>
        {pricing.orca_monthly_price > 0 ? (
          <div className="orca-labor-price-box">
            <div><span>Regular human salary benchmark</span><s>{currency(pricing.regular_salary_monthly)}/mo</s></div>
            <div><span>ORCA launch rate ({pricing.launch_rate_percent}%)</span><strong>{currency(pricing.orca_monthly_price)}<small>/mo</small></strong></div>
            <p>{currency(pricing.monthly_salary_savings)} monthly salary savings at launch.</p>
            {Number(worker.activation_fee || 0) > 0 ? <p>Activation: {currency(Number(worker.activation_fee))} one-time.</p> : null}
          </div>
        ) : (
          <div className="orca-labor-price-box orca-labor-price-box--pending">
            <strong>Salary benchmark required</strong>
            <p>ORCA does not display a cheap placeholder price.</p>
          </div>
        )}
        {evaluations.length ? <div className="orca-candidate-card__skills">{evaluations.slice(0, 3).map((option) => <span key={option}>{option}</span>)}</div> : null}
        <div className="orca-employee-card__actions">
          <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate(`/interview/${worker.id}`)}>Interview</button>
          <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate(`/sample/${worker.id}`)}>Sample work</button>
          <button type="button" className="orca-button orca-button--primary" onClick={() => navigate(`/worker/${worker.id}`)}>View full profile</button>
        </div>
      </div>
    </article>
  )
}
