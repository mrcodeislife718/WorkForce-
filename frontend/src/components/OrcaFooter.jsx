import React from 'react'
import { Link } from 'react-router-dom'
import OrcaLogo from './OrcaLogo.jsx'

export default function OrcaFooter({ navigation = [] }) {
  const year = new Date().getFullYear()
  const workforceLinks = navigation.filter((item) => ['employees', 'teams', 'departments', 'integrations'].includes(item.key))
  const businessLinks = navigation.filter((item) => ['business', 'enterprise', 'pricing'].includes(item.key))
  return (
    <footer className="orca-footer">
      <div className="orca-footer__inner">
        <div className="orca-footer__brand"><Link to="/store/employees"><OrcaLogo /></Link><p>Digital employees that support human teams, cover operational gaps, and work under customer-defined authority.</p><strong>Powering the AI Workforce</strong></div>
        <div className="orca-footer__links">
          <div><h3>Workforce</h3>{workforceLinks.map((item) => <Link key={item.key} to={item.href}>{item.label}</Link>)}</div>
          <div><h3>Business</h3>{businessLinks.map((item) => <Link key={item.key} to={item.href}>{item.label}</Link>)}<Link to="/console">For Creators</Link></div>
          <div><h3>Trust and Operations</h3><Link to="/protect">ORCA Protect</Link><Link to="/policy-center">Policy Center</Link><Link to="/billing">Billing</Link><Link to="/payouts">Payouts</Link></div>
        </div>
      </div>
      <div className="orca-footer__bottom"><span>© {year} Charles Castillo. ORCA is independently developed.</span><span>Orcavenue Ventures is the planned parent company.</span></div>
    </footer>
  )
}
