import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useStoreCatalog } from '../contexts/StoreCatalogContext.jsx'
import OrcaLogo from './OrcaLogo.jsx'
import '../styles/orca-store.css'

export default function Navigation() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { catalog } = useStoreCatalog()
  const [open, setOpen] = useState(false)
  const links = catalog?.navigation || [
    { key: 'employees', label: 'Digital Employees', href: '/store/employees' },
    { key: 'teams', label: 'Teams', href: '/store/teams' },
    { key: 'departments', label: 'Departments', href: '/store/departments' },
    { key: 'integrations', label: 'Works With Your Tools', href: '/store/integrations' },
    { key: 'business', label: 'For Business', href: '/store/business' },
    { key: 'enterprise', label: 'Enterprise', href: '/store/enterprise' },
    { key: 'pricing', label: 'Pricing', href: '/store/pricing' },
  ]

  return (
    <header className="orca-navigation">
      <div className="orca-navigation__inner">
        <Link className="orca-navigation__brand" to="/store/employees" aria-label="ORCA Store"><OrcaLogo /></Link>
        <nav className="orca-navigation__desktop" aria-label="Primary navigation">
          {links.map((item) => (
            <NavLink key={item.key} to={item.href} className={({ isActive }) => isActive ? 'is-active' : ''}>{item.label}</NavLink>
          ))}
          <NavLink to="/console" className={({ isActive }) => isActive ? 'is-active' : ''}>For Creators</NavLink>
          {user ? <NavLink to="/connections" className={({ isActive }) => isActive ? 'is-active' : ''}>Connections</NavLink> : null}
        </nav>
        <div className="orca-navigation__actions">
          <button type="button" className="orca-icon-button" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button>
          {user ? <button type="button" className="orca-button orca-button--ghost" onClick={logout}>Sign out</button> : <Link className="orca-button orca-button--primary" to="/login">Sign in</Link>}
          <button type="button" className="orca-icon-button orca-navigation__menu" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? '×' : '☰'}</button>
        </div>
      </div>
      {open ? (
        <nav className="orca-navigation__mobile" aria-label="Mobile navigation">
          {links.map((item) => <Link key={item.key} to={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
          <Link to="/console" onClick={() => setOpen(false)}>For Creators</Link>
          {user ? <Link to="/connections" onClick={() => setOpen(false)}>Connections</Link> : null}
        </nav>
      ) : null}
    </header>
  )
}
