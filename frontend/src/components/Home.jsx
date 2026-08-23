import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStoreCatalog } from '../contexts/StoreCatalogContext.jsx'
import OrcaLogo from './OrcaLogo.jsx'
import WorkerCard from './WorkerCard.jsx'
import WorkforceBundleCard from './WorkforceBundleCard.jsx'
import IntegrationCard from './IntegrationCard.jsx'
import CatalogCarousel from './CatalogCarousel.jsx'
import OrcaFooter from './OrcaFooter.jsx'

const VALID_VIEWS = new Set(['employees', 'teams', 'departments', 'integrations', 'business', 'enterprise', 'pricing'])

function searchableEmployee(employee) {
  return [
    employee.name,
    employee.role_title,
    employee.department,
    employee.career_level,
    employee.description,
    ...(Array.isArray(employee.skills) ? employee.skills : []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function searchableBundle(bundle) {
  return [
    bundle.name,
    bundle.description,
    bundle.department,
    ...(bundle.members || []).map(searchableEmployee),
  ].filter(Boolean).join(' ').toLowerCase()
}

export default function Home() {
  const { view: routeView } = useParams()
  const { catalog, loading, error, refresh } = useStoreCatalog()
  const [query, setQuery] = useState('')
  const view = VALID_VIEWS.has(routeView) ? routeView : 'employees'
  const normalizedQuery = query.trim().toLowerCase()

  const employees = useMemo(() => {
    const source = catalog?.employees || []
    return normalizedQuery ? source.filter((item) => searchableEmployee(item).includes(normalizedQuery)) : source
  }, [catalog, normalizedQuery])

  const teams = useMemo(() => {
    const source = catalog?.teams || []
    return normalizedQuery ? source.filter((item) => searchableBundle(item).includes(normalizedQuery)) : source
  }, [catalog, normalizedQuery])

  const departments = useMemo(() => {
    const source = catalog?.departments || []
    return normalizedQuery ? source.filter((item) => searchableBundle(item).includes(normalizedQuery)) : source
  }, [catalog, normalizedQuery])

  const integrations = useMemo(() => {
    const source = catalog?.integrations || []
    return normalizedQuery
      ? source.filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery))
      : source
  }, [catalog, normalizedQuery])

  return (
    <>
      <main className="orca-store">
        <section className="orca-hero">
          <div className="orca-hero__content">
            <span className="orca-kicker">ORCA DIGITAL WORKFORCE PLATFORM</span>
            <h1>Powering the AI Workforce</h1>
            <p>Discover, interview, test, and hire digital employees that support human teams and work inside the real tools your business authorizes.</p>
            <div className="orca-hero__actions">
              <Link className="orca-button orca-button--primary orca-button--large" to="/store/employees">Browse digital employees</Link>
              <Link className="orca-button orca-button--glass orca-button--large" to="/store/integrations">See supported tools</Link>
            </div>
            <div className="orca-hero__proof">
              <span><strong>{catalog?.counts?.employees || 0}</strong> published digital employees</span>
              <span><strong>{catalog?.counts?.teams || 0}</strong> teams</span>
              <span><strong>{catalog?.counts?.departments || 0}</strong> departments</span>
              <span><strong>35%</strong> launch salary rate</span>
            </div>
          </div>
          <div className="orca-hero__visual" aria-hidden="true">
            <div className="orca-hero__ring orca-hero__ring--one" />
            <div className="orca-hero__ring orca-hero__ring--two" />
            <div className="orca-hero__orb"><OrcaLogo compact /></div>
          </div>
        </section>

        <section className="orca-store-toolbar" aria-label="Store search and catalog navigation">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${view.replaceAll('-', ' ')}...`} aria-label="Search ORCA Store" />
          <nav className="orca-store-tabs" aria-label="Catalog types">
            {(catalog?.navigation || []).slice(0, 4).map((item) => (
              <Link key={item.key} to={item.href} className={view === item.key ? 'is-active' : ''}>{item.label}{Number.isFinite(item.count) ? ` (${item.count})` : ''}</Link>
            ))}
          </nav>
        </section>

        {error ? <div className="orca-error-state"><p>{error}</p><button type="button" className="orca-button orca-button--primary" onClick={refresh}>Retry</button></div> : null}
        {loading ? <div className="orca-loading-state">Loading the ORCA Store…</div> : null}

        {!loading && !error && view === 'employees' ? (
          <CatalogCarousel title="Digital Employees" subtitle="Named professionals with avatars, experience, skills, human oversight, and salary-based launch pricing." emptyMessage="No digital employees match this search.">
            {employees.map((employee) => <WorkerCard key={employee.id} worker={employee} />)}
          </CatalogCarousel>
        ) : null}

        {!loading && !error && view === 'teams' ? (
          <CatalogCarousel title="Digital Employee Teams" subtitle="Coordinated groups of digital employees with defined roles and one human authority." emptyMessage="No digital employee teams match this search.">
            {teams.map((team) => <WorkforceBundleCard key={team.id} bundle={team} />)}
          </CatalogCarousel>
        ) : null}

        {!loading && !error && view === 'departments' ? (
          <CatalogCarousel title="Digital Employee Departments" subtitle="Governed department plans with workforce makeup, salary benchmarks, and customer-controlled authority." emptyMessage="No digital employee departments match this search.">
            {departments.map((department) => <WorkforceBundleCard key={department.id} bundle={department} />)}
          </CatalogCarousel>
        ) : null}

        {!loading && !error && view === 'integrations' ? (
          <section className="orca-catalog-section">
            <div className="orca-catalog-section__heading"><div><h2>Works With Your Tools</h2><p>Every card comes from the live connector catalog and states whether the adapter is actually available or still requires provider configuration.</p></div></div>
            <div className="orca-integration-grid">{integrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} />)}</div>
          </section>
        ) : null}

        {!loading && !error && view === 'business' ? <BusinessSection /> : null}
        {!loading && !error && view === 'enterprise' ? <EnterpriseSection /> : null}
        {!loading && !error && view === 'pricing' ? <PricingSection policy={catalog?.pricing_policy} /> : null}
      </main>
      <OrcaFooter navigation={catalog?.navigation || []} />
    </>
  )
}

function BusinessSection() {
  return (
    <section className="orca-info-page">
      <span className="orca-section-eyebrow">FOR BUSINESS</span>
      <h2>Support your people. Cover gaps. Keep work moving.</h2>
      <p>Start with one digital employee, add a coordinated team, or build a governed department. Human managers retain policy, approval, escalation, and final decision authority.</p>
      <div className="orca-info-grid"><article><strong>Support mode</strong><span>Delegated work alongside human employees.</span></article><article><strong>Coverage mode</strong><span>Nights, weekends, absences, and demand surges.</span></article><article><strong>Role-fill mode</strong><span>A defined role when a business has an operational vacancy.</span></article></div>
    </section>
  )
}

function EnterpriseSection() {
  return (
    <section className="orca-info-page">
      <span className="orca-section-eyebrow">ENTERPRISE</span>
      <h2>Governed digital workforce infrastructure.</h2>
      <p>Enterprise deployment requires organization controls, isolated credentials, least-privilege permissions, approval workflows, audit history, monitoring, pause, rollback, and uninstall.</p>
      <div className="orca-info-grid"><article><strong>Human authority</strong><span>Named owners and approval policies.</span></article><article><strong>ORCA Protect</strong><span>Permission, runtime, and lifecycle controls.</span></article><article><strong>Verified outcomes</strong><span>Evidence-backed money made and money saved.</span></article></div>
    </section>
  )
}

function PricingSection({ policy }) {
  const rate = policy?.launch_rate_percent || 35
  const savings = policy?.customer_savings_percent || 65
  return (
    <section className="orca-info-page">
      <span className="orca-section-eyebrow">PRICING</span>
      <h2>Premium role-based pricing—not cheap app pricing.</h2>
      <p>Each digital employee begins at {rate}% of the comparable human role’s regular salary. That creates approximately {savings}% salary savings while preserving enough revenue to operate, govern, support, and improve the workforce.</p>
      <div className="orca-pricing-rule"><strong>ORCA monthly launch price</strong><span>{rate}% × comparable regular monthly salary</span></div>
    </section>
  )
}
