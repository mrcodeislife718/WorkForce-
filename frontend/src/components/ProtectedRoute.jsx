import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-12">Loading ORCA…</div>
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
