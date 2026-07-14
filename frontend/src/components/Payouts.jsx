import React from 'react'

export default function Payouts() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orca-black dark:text-white mb-4">ORCA Payouts</h1>
        <p className="text-lg text-orca-steel dark:text-gray-400 mb-2">Manage earnings and revenue distribution</p>
        <p className="text-gray-600 dark:text-gray-500">Coming soon</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Earnings</h3>
          <p className="text-orca-steel dark:text-gray-400">Track and manage your earnings from deployed digital employees.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">🏦</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Bank Accounts</h3>
          <p className="text-orca-steel dark:text-gray-400">Connect and manage your payout bank accounts securely.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📅</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Payout Schedule</h3>
          <p className="text-orca-steel dark:text-gray-400">Set your preferred payout schedule and payment method.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Transaction History</h3>
          <p className="text-orca-steel dark:text-gray-400">View detailed history of all payout transactions and earnings.</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
        <p className="text-orca-steel dark:text-gray-400 mb-4">Payouts management is currently in development. Check back soon for earnings and payout features.</p>
      </div>
    </div>
  )
}
