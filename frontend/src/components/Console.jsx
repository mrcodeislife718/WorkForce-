import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Console() {
  const [deployments, setDeployments] = useState([])

  useEffect(() => {
    const token = 'dummy_token'
    axios.get('/api/console/deployments', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setDeployments(res.data))
      .catch(() => setDeployments([]))
  }, [])

  const handleUninstall = async (id) => {
    if (!window.confirm('Remove this worker? It will revoke all access.')) return
    const token = 'dummy_token'
    await axios.delete(`/api/deployments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setDeployments(deployments.filter(d => d.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-orca-black dark:text-white mb-4">Console</h1>
      {deployments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-orca-steel dark:text-gray-400">No digital employees deployed yet.</p>
          <p className="text-sm mt-1 text-orca-steel dark:text-gray-400">Browse the store to hire your first digital employee.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map(d => (
            <div key={d.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{d.Worker?.icon_url || '🤖'}</span>
                <div>
                  <p className="font-bold text-orca-black dark:text-white">{d.Worker?.name}</p>
                  <p className="text-sm text-orca-steel dark:text-gray-400">Deployed to {d.tool}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                    {d.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-orca-deep-blue text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-400 transition-colors">Open</button>
                <button onClick={() => handleUninstall(d.id)} className="text-red-500 text-sm font-semibold hover:text-red-700 dark:hover:text-red-400 transition-colors">Uninstall</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
