import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../ThemeContext'
import OrcaLogo from './OrcaLogo'

export default function Navigation() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Store', path: '/store' },
    { label: 'Console', path: '/console' },
    { label: 'Protect', path: '/protect' },
    { label: 'Billing', path: '/billing' },
    { label: 'Payouts', path: '/payouts' },
    { label: 'Policy Center', path: '/policy-center' },
  ]

  const isActive = (path) => {
    if (path === '/store') return location.pathname === '/' || location.pathname === '/store'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="orca-navigation">
      <div className="orca-navigation__inner">
        <Link to="/" className="orca-logo-link" aria-label="ORCA Store home">
          <span className="orca-logo-desktop"><OrcaLogo /></span>
          <span className="orca-logo-mobile"><OrcaLogo compact /></span>
        </Link>

        <div className="orca-navigation__links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`orca-navigation__link ${isActive(item.path) ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="orca-navigation__actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="orca-icon-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`${theme === 'light' ? 'Dark' : 'Light'} mode`}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.25 15.31A8.5 8.5 0 0 1 8.69 3.75 8.5 8.5 0 1 0 20.25 15.3Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="orca-icon-button orca-mobile-menu-button"
            aria-expanded={mobileMenuOpen}
            aria-controls="orca-mobile-navigation"
            aria-label="Toggle navigation menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={mobileMenuOpen ? 'M6 18 18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="orca-mobile-navigation" className="orca-mobile-navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`orca-mobile-navigation__link ${isActive(item.path) ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
