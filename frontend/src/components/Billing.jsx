import React from 'react'

export default function Billing() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orca-black dark:text-white mb-4">ORCA Billing</h1>
        <p className="text-lg text-orca-steel dark:text-gray-400 mb-2">Manage invoices and billing settings</p>
        <p className="text-gray-600 dark:text-gray-500">Coming soon</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">💳</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Payment Methods</h3>
          <p className="text-orca-steel dark:text-gray-400">Securely manage your payment methods and billing information.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📄</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Invoices</h3>
          <p className="text-orca-steel dark:text-gray-400">View and download all your billing invoices and receipts.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📈</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Usage & Pricing</h3>
          <p className="text-orca-steel dark:text-gray-400">Track your digital employee usage and see billing details.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">⚙️</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Billing Settings</h3>
          <p className="text-orca-steel dark:text-gray-400">Configure billing cycles, alerts, and preferences.</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
        <p className="text-orca-steel dark:text-gray-400 mb-4">Billing management is currently in development. Check back soon for invoicing and payment features.</p>
      </div>
    </div>
  )
}
