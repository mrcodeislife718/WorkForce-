import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../ThemeContext'

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
    <nav style={{
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)'
    }} className="border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              ORCA<span style={{ color: 'var(--accent)' }}>.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  backgroundColor: isActive(item.path) ? 'rgba(14, 77, 255, 0.1)' : 'transparent',
                  color: isActive(item.path) ? 'var(--accent)' : 'var(--text-primary)',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive(item.path) ? '500' : '400',
                  transition: 'all 0.2s ease'
                }}
                className="hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
                onMouseEnter={(e) => !isActive(item.path) && (e.target.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                onMouseLeave={(e) => !isActive(item.path) && (e.target.style.backgroundColor = 'transparent')}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`${theme === 'light' ? 'Dark' : 'Light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#fbbf24' }}>
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm.707 5.657a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM9 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 space-y-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: isActive(item.path) ? 'rgba(14, 77, 255, 0.1)' : 'transparent',
                  color: isActive(item.path) ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: isActive(item.path) ? '500' : '400',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
