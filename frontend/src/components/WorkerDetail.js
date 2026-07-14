import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { StarIcon } from '@heroicons/react/20/solid';

export default function WorkerDetail() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    axios.get(`/api/workers/${id}`).then(res => {
      setWorker(res.data);
      setPermissions(res.data.WorkerPermissions || []);
    });
  }, [id]);

  if (!worker) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="bg-orca-deep-blue rounded-2xl h-48 flex items-center justify-center text-white text-4xl font-bold relative">
        {worker.hero_banner_url ? <img src={worker.hero_banner_url} alt={worker.name} className="w-full h-full object-cover rounded-2xl" /> : worker.name}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <span className="text-6xl">{worker.icon_url || '🤖'}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{worker.name}</h1>
            <p className="text-sm text-white/80">ORCA Studios</p>
          </div>
        </div>
      </div>

      {/* Rating & Price */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center">
          <StarIcon className="h-5 w-5 text-yellow-400" />
          <span className="font-bold ml-1">{worker.avg_rating}</span>
          <span className="text-orca-steel ml-1">({worker.total_reviews} reviews)</span>
        </div>
        <span className="font-bold text-orca-black">From ${worker.base_price}/mo</span>
        <span className="text-sm bg-orca-mist px-3 py-1 rounded-full">{worker.category}</span>
      </div>

      {/* Deploy Button */}
      <button className="w-full mt-4 bg-orca-deep-blue text-white font-bold py-3 rounded-full hover:bg-blue-700 transition text-lg">
        Deploy to Slack
      </button>

      {/* Permissions */}
      <div className="mt-6">
        <h3 className="font-bold text-lg">This worker requires access to:</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {permissions.map(p => (
            <span key={p.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm border border-gray-200">
              {p.tool.toUpperCase()}: {p.scope} {p.is_required ? '⚠️' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h3 className="font-bold text-lg">About this worker</h3>
        <p className="text-orca-steel mt-1">{worker.description}</p>
        <p className="text-sm text-orca-steel mt-2">Version {worker.version} – {worker.release_notes}</p>
      </div>
    </div>
  );
}
