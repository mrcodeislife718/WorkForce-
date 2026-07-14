import React from 'react'

export default function PolicyCenter() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orca-black dark:text-white mb-4">ORCA Policy Center</h1>
        <p className="text-lg text-orca-steel dark:text-gray-400 mb-2">Manage policies and permissions for your account</p>
        <p className="text-gray-600 dark:text-gray-500">Coming soon</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Team Management</h3>
          <p className="text-orca-steel dark:text-gray-400">Manage team members and their permissions across ORCA products.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">🔐</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Access Control</h3>
          <p className="text-orca-steel dark:text-gray-400">Define granular access control policies and role assignments.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Policy Rules</h3>
          <p className="text-orca-steel dark:text-gray-400">Create and manage organization-wide policies and restrictions.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-3xl mb-3">📜</div>
          <h3 className="font-bold text-orca-black dark:text-white mb-2">Audit Log</h3>
          <p className="text-orca-steel dark:text-gray-400">Review comprehensive audit logs of all policy changes and access.</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
        <p className="text-orca-steel dark:text-gray-400 mb-4">Policy Center is currently in development. Check back soon for policy management and team controls.</p>
      </div>
    </div>
  )
}
