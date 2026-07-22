import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const StoreCatalogContext = createContext(null)

export function StoreCatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/store/catalog')
      setCatalog(response.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load the ORCA Store catalog.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const value = useMemo(() => ({ catalog, loading, error, refresh: loadCatalog }), [catalog, loading, error, loadCatalog])
  return <StoreCatalogContext.Provider value={value}>{children}</StoreCatalogContext.Provider>
}

export function useStoreCatalog() {
  const context = useContext(StoreCatalogContext)
  if (!context) throw new Error('useStoreCatalog must be used inside StoreCatalogProvider')
  return context
}
