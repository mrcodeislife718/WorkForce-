import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import WorkerCard from './WorkerCard.jsx'

const categories = [
  { label: 'For You', value: 'all' },
  { label: 'Customer Support', value: 'support' },
  { label: 'Sales and Growth', value: 'sales' },
  { label: 'Administration', value: 'admin' },
  { label: 'Content and Creative', value: 'design' },
  { label: 'New Employees', value: 'new' },
]

async function getCollection(primaryPath, fallbackPath) {
  try {
    const response = await axios.get(primaryPath)
    return response.data
  } catch (error) {
    if (!fallbackPath) throw error
    const response = await axios.get(fallbackPath)
    return response.data
  }
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [recommended, setRecommended] = useState([])
  const [popularFunctions, setPopularFunctions] = useState([])
  const [newEmployees, setNewEmployees] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const fetchCatalog = async () => {
      try {
        const [featuredData, recommendedData, popularData, newData] = await Promise.all([
          getCollection('/api/store/featured', '/api/store/top-deployed'),
          getCollection('/api/store/recommended', '/api/store/editors-choice'),
          getCollection('/api/store/popular-functions', '/api/store/trending'),
          getCollection('/api/store/new-employees', '/api/store/trending'),
        ])

        if (!mounted) return
        setFeatured(featuredData)
        setRecommended(recommendedData)
        setPopularFunctions(popularData)
        setNewEmployees(newData)
      } catch (catalogError) {
        console.error('Error fetching digital employees:', catalogError)
        if (mounted) setError('The ORCA catalog could not be loaded. Confirm that the backend is running on port 5000.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchCatalog()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      return undefined
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await axios.get('/api/store/search', {
          params: { q: query, category: activeCategory === 'all' || activeCategory === 'new' ? undefined : activeCategory },
          signal: controller.signal,
        })
        setSearchResults(response.data)
      } catch (searchError) {
        if (searchError.name !== 'CanceledError') {
          console.error('Digital employee search failed:', searchError)
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery, activeCategory])

  const filteredSections = useMemo(() => {
    const filter = (items) => {
      if (activeCategory === 'all') return items
      if (activeCategory === 'new') return items
      return items.filter((item) => item.category === activeCategory)
    }

    return {
      featured: filter(featured),
      recommended: filter(recommended),
      popularFunctions: filter(popularFunctions),
      newEmployees: filter(newEmployees),
    }
  }, [activeCategory, featured, recommended, popularFunctions, newEmployees])

  const isSearching = searchQuery.trim().length > 0

  return (
    <main className="orca-store-shell">
      <section className="orca-store-hero" aria-labelledby="orca-store-heading">
        <div>
          <p className="orca-eyebrow">Digital labor for every stage of business</p>
          <h1 id="orca-store-heading">Build Your Digital Labor Workforce</h1>
          <p className="orca-store-hero__copy">
            Discover, interview, test, hire, and deploy skilled digital employees for solopreneurs,
            small businesses, and enterprises.
          </p>
        </div>
        <div className="orca-store-hero__trust">
          <strong>Evaluate before deployment.</strong>
          <span>Interview and test every digital employee before you pay and deploy.</span>
        </div>
      </section>

      <section className="orca-search-panel" aria-label="Search the ORCA digital employee catalog">
        <label className="orca-search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Search for digital employees</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search for digital employees, roles, or business functions..."
          />
        </label>

        <div className="orca-category-tabs" role="tablist" aria-label="Digital employee categories">
          {categories.map((category) => (
            <button
              type="button"
              key={category.value}
              role="tab"
              aria-selected={activeCategory === category.value}
              className={activeCategory === category.value ? 'is-active' : ''}
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="orca-alert" role="alert">{error}</div>}
      {loading && <div className="orca-loading" aria-live="polite">Loading ORCA digital employees…</div>}

      {!loading && (
        <div id="catalog" className="orca-catalog">
          {isSearching ? (
            <Section
              title={`Search results for “${searchQuery.trim()}”`}
              description="Results are filtered by professional role, capability, publisher, and selected business function."
              digitalEmployees={searchResults}
            />
          ) : (
            <>
              <Section
                title="Featured Digital Employees"
                description="Launch candidates selected for clear business value, bounded scope, and evaluation readiness."
                digitalEmployees={filteredSections.featured}
              />
              <Section
                title="Recommended Roles"
                description="Professional digital employees for the functions growing businesses need most."
                digitalEmployees={filteredSections.recommended}
              />
              <Section
                title="Popular Business Functions"
                description="Browse digital labor by the work your business needs completed."
                digitalEmployees={filteredSections.popularFunctions}
              />
              <Section
                title="New Digital Employees"
                description="Recently added digital employees whose public evidence will grow through verified evaluations and deployments."
                digitalEmployees={filteredSections.newEmployees}
              />
            </>
          )}
        </div>
      )}

      <section className="orca-journey" aria-labelledby="orca-journey-heading">
        <div>
          <p className="orca-eyebrow">The ORCA hiring journey</p>
          <h2 id="orca-journey-heading">Evaluate demonstrated capability before deployment</h2>
        </div>
        <ol>
          {['Discover', 'Interview', 'Test', 'Review', 'Pay', 'Deploy', 'Manage'].map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

function Section({ title, description, digitalEmployees }) {
  return (
    <section className="orca-catalog-section">
      <div className="orca-catalog-section__heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <a href="#catalog">View all <span aria-hidden="true">›</span></a>
      </div>

      {digitalEmployees.length > 0 ? (
        <div className="digital-employee-grid">
          {digitalEmployees.map((digitalEmployee) => (
            <WorkerCard key={digitalEmployee.id} worker={digitalEmployee} />
          ))}
        </div>
      ) : (
        <div className="orca-empty-state">
          No published digital employees match this category yet.
        </div>
      )}
    </section>
  )
}
