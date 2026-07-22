import React from 'react'
import { useNavigate } from 'react-router-dom'
import shopifyLogo from '../assets/integrations/shopify.svg'
import slackLogo from '../assets/integrations/slack.svg'
import microsoft365Logo from '../assets/integrations/microsoft365.svg'
import googleWorkspaceLogo from '../assets/integrations/googleworkspace.svg'
import hubspotLogo from '../assets/integrations/hubspot.svg'
import notionLogo from '../assets/integrations/notion.svg'
import apiLogo from '../assets/integrations/api.svg'

const LOGOS = {
  shopify: shopifyLogo,
  slack: slackLogo,
  'microsoft-365': microsoft365Logo,
  'google-workspace': googleWorkspaceLogo,
  hubspot: hubspotLogo,
  notion: notionLogo,
  'generic-rest': apiLogo,
  'generic-webhook': apiLogo,
}

export default function IntegrationCard({ integration }) {
  const navigate = useNavigate()
  const logo = LOGOS[integration.icon_key] || apiLogo
  return (
    <article className="orca-integration-card">
      <div className="orca-integration-card__logo"><img src={logo} alt="" aria-hidden="true" /></div>
      <div><p>{integration.category}</p><h3>{integration.name}</h3><span>{integration.description}</span></div>
      <div className={`orca-integration-card__status ${integration.available ? 'is-available' : ''}`}>{integration.availability_label}</div>
      <button type="button" className="orca-button orca-button--ghost" onClick={() => navigate('/connections')}>{integration.available ? 'Connect' : 'View configuration'}</button>
    </article>
  )
}
