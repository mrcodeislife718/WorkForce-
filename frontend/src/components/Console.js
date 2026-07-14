import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Console() {
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    // For demo, we'll use a dummy token – in real app get from login
    const token = 'dummy_token';
    axios.get('/api/console/deployments', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setDeployments(res.data))
      .catch(() => setDeployments([]));
  }, []);

  const handleUninstall = async (id) => {
    if (!window.confirm('Remove this worker? It will revoke all access.')) return;
    const token = 'dummy_token';
    await axios.delete(`/api/deployments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDeployments(deployments.filter(d => d.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-orca-black mb-4">Console</h1>
      {deployments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-orca-steel">No workers deployed yet.</p>
          <p className="text-sm mt-1">Browse the store to hire your first virtual employee.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map(d => (
            <div key={d.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{d.Worker?.icon_url || '🤖'}</span>
                <div>
                  <p className="font-bold">{d.Worker?.name}</p>
                  <p className="text-sm text-orca-steel">Deployed to {d.tool}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {d.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-orca-deep-blue text-sm font-semibold">Open</button>
                <button onClick={() => handleUninstall(d.id)} className="text-red-500 text-sm font-semibold">Uninstall</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
