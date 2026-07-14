import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import Navigation from './components/Navigation'
import Home from './components/Home.jsx'
import WorkerDetail from './components/WorkerDetail.jsx'
import Console from './components/Console.jsx'
import Protect from './components/Protect.jsx'
import Billing from './components/Billing.jsx'
import Payouts from './components/Payouts.jsx'
import PolicyCenter from './components/PolicyCenter.jsx'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div id="app-root" style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          transition: 'background-color 0.2s ease, color 0.2s ease'
        }}>
          <Navigation />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Home />} />
            <Route path="/worker/:id" element={<WorkerDetail />} />
            <Route path="/console" element={<Console />} />
            <Route path="/protect" element={<Protect />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/policy-center" element={<PolicyCenter />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
