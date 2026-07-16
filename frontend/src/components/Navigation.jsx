import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../ThemeContext'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { authenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Store', path: '/store' },
    ...(authenticated ? [
      { label: 'Console', path: '/console' },
      { label: 'Connections', path: '/connections' },
    ] : []),
    { label: 'Protect', path: '/protect' },
    { label: 'Billing', path: '/billing' },
    { label: 'Payouts', path: '/payouts' },
    { label: 'Policy Center', path: '/policy-center' },
  ]

  const isActive = (path) => {
    if (path === '/store') return location.pathname === '/' || location.pathname === '/store'
    return location.pathname.startsWith(path)
  }

  const NavLink = ({ item, mobile = false }) => (
    <Link
      to={item.path}
      onClick={() => mobile && setMobileMenuOpen(false)}
      style={{
        display: mobile ? 'block' : undefined,
        backgroundColor: isActive(item.path) ? 'rgba(14, 77, 255, 0.1)' : 'transparent',
        color: isActive(item.path) ? 'var(--accent)' : 'var(--text-primary)',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: isActive(item.path) ? '600' : '400',
        textDecoration: 'none',
      }}
    >
      {item.label}
    </Link>
  )

  return (
    <nav style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} className="border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>ORCA<span style={{ color: 'var(--accent)' }}>.</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => <NavLink key={item.path} item={item} />)}
          </div>

          <div className="flex items-center gap-2">
            {authenticated ? (
              <>
                <span className="hidden sm:inline text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.name || user?.email}</span>
                <button onClick={logout} className="hidden sm:inline rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border-color)' }}>Sign out</button>
              </>
            ) : (
              <Link to="/login" className="rounded-lg bg-orca-deep-blue text-white px-3 py-2 text-sm font-semibold">Sign in</Link>
            )}

            <button
              onClick={toggleTheme}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="lg:hidden"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pb-3 space-y-1 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
            {navItems.map((item) => <NavLink key={item.path} item={item} mobile />)}
            {authenticated && <button onClick={() => { logout(); setMobileMenuOpen(false) }} className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-red-600">Sign out</button>}
          </div>
        )}
      </div>
    </nav>
  )
}
