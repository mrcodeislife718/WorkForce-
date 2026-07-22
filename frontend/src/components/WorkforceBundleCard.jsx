import React from 'react'
import { useNavigate } from 'react-router-dom'
import DigitalEmployeeAvatar from './DigitalEmployeeAvatar.jsx'
import { currency, employeeProfile } from '../data/catalogFormatters.js'

export default function WorkforceBundleCard({ bundle }) {
  const navigate = useNavigate()
  const isTeam = bundle.type === 'team'
  const pricing = bundle.pricing || {}
  return (
    <article className={`orca-bundle-card orca-bundle-card--${bundle.type}`}>
      <div className="orca-bundle-card__header"><span className="orca-bundle-card__type">{isTeam ? 'DIGITAL EMPLOYEE TEAM' : 'DIGITAL EMPLOYEE DEPARTMENT'}</span><span className="orca-bundle-card__status">Published workforce plan</span></div>
      <div className="orca-bundle-card__avatars" aria-label={`${bundle.name} members`}>
        {(bundle.members || []).slice(0, 4).map((worker) => {
          const profile = employeeProfile(worker)
          return <div className="orca-bundle-card__avatar" key={worker.id} title={`${profile.displayName} — ${profile.roleTitle}`}><DigitalEmployeeAvatar name={profile.displayName} variant={profile.avatarVariant} /></div>
        })}
        {bundle.member_count > 4 ? <span className="orca-bundle-card__more">+{bundle.member_count - 4}</span> : null}
      </div>
      <h3>{bundle.name}</h3>
      <p className="orca-bundle-card__description">{bundle.description}</p>
      <div className="orca-bundle-card__facts"><span><small>Digital employees</small><strong>{bundle.member_count}</strong></span><span><small>Human authority</small><strong>{bundle.human_authority_required ? 'Required' : 'Customer configured'}</strong></span><span><small>Availability</small><strong>24/7/365</strong></span></div>
      <div className="orca-bundle-card__member-summary">{(bundle.members || []).slice(0, 4).map((worker) => { const profile = employeeProfile(worker); return <div key={worker.id}><strong>{profile.displayName}</strong><span>{profile.roleTitle}</span></div> })}</div>
      {pricing.orca_monthly_price > 0 ? <div className="orca-bundle-card__pricing"><span>Combined human salary benchmark <s>{currency(pricing.regular_salary_monthly)}/mo</s></span><strong>ORCA launch rate {currency(pricing.orca_monthly_price)}<small>/mo</small></strong><p>{currency(pricing.monthly_salary_savings)} monthly salary savings at launch.</p></div> : null}
      <div className="orca-bundle-card__actions"><button type="button" className="orca-button orca-button--primary" onClick={() => navigate(`/store/bundles/${bundle.slug}`)}>View {isTeam ? 'team' : 'department'}</button></div>
    </article>
  )
}
