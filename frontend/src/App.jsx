import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './components/Home.jsx'
import WorkerDetail from './components/WorkerDetail.jsx'
import Console from './components/Console.jsx'
import Protect from './components/Protect.jsx'
import Billing from './components/Billing.jsx'
import Payouts from './components/Payouts.jsx'
import PolicyCenter from './components/PolicyCenter.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Connections from './pages/Connections.jsx'
import Interview from './pages/Interview.jsx'
import SampleWork from './pages/SampleWork.jsx'
import Purchase from './pages/Purchase.jsx'
import PurchaseSuccess from './pages/PurchaseSuccess.jsx'
import DeploymentWizard from './pages/DeploymentWizard.jsx'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div id="app-root" style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            transition: 'background-color 0.2s ease, color 0.2s ease',
          }}>
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/store" element={<Home />} />
              <Route path="/worker/:id" element={<WorkerDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/interview/:workerId" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
              <Route path="/sample/:workerId" element={<ProtectedRoute><SampleWork /></ProtectedRoute>} />
              <Route path="/purchase/:workerId" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
              <Route path="/purchase/success" element={<ProtectedRoute><PurchaseSuccess /></ProtectedRoute>} />
              <Route path="/deploy/:workerId" element={<ProtectedRoute><DeploymentWizard /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/console" element={<ProtectedRoute><Console /></ProtectedRoute>} />
              <Route path="/protect" element={<Protect />} />
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/payouts" element={<Payouts />} />
              <Route path="/policy-center" element={<PolicyCenter />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
