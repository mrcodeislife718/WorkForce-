import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('orca-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (prefersDark) {
      setTheme('dark')
    }
    setMounted(true)
  }, [])

  // Apply theme to DOM - use html element for broad CSS custom property scope
  useEffect(() => {
    if (!mounted) return
    
    const html = document.documentElement
    const rootDiv = document.getElementById('app-root')
    
    if (theme === 'dark') {
      html.classList.add('dark')
      if (rootDiv) rootDiv.classList.add('dark')
    } else {
      html.classList.remove('dark')
      if (rootDiv) rootDiv.classList.remove('dark')
    }
    localStorage.setItem('orca-theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const value = { theme, toggleTheme, mounted }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
