import React from 'react'

export default function Protect() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orca-black dark:text-white mb-4">ORCA Protect</h1>
        <p className="text-lg text-orca-steel dark:text-gray-400 mb-2">Security and compliance for your digital employees</p>
        <p className="text-gray-600 dark:text-gray-500">Coming soon</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Security Monitoring</h3>
          <p className="text-orca-steel dark:text-gray-400">Real-time monitoring and alerts for your deployed digital employees.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">✅</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Compliance</h3>
          <p className="text-orca-steel dark:text-gray-400">Built-in compliance checks and audit logs for enterprise requirements.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Threat Protection</h3>
          <p className="text-orca-steel dark:text-gray-400">Advanced threat detection and automatic response capabilities.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Analytics</h3>
          <p className="text-orca-steel dark:text-gray-400">Detailed security analytics and reporting dashboard.</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
        <p className="text-orca-steel dark:text-gray-400 mb-4">Protect is currently in development. Check back soon for security features and compliance tools.</p>
      </div>
    </div>
  )
}
