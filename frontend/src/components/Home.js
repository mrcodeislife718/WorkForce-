import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkerCard from './WorkerCard';

export default function Home() {
  const [topWorkers, setTopWorkers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [editorsPick, setEditorsPick] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [top, trend, editors] = await Promise.all([
          axios.get('/api/store/top-deployed'),
          axios.get('/api/store/trending'),
          axios.get('/api/store/editors-choice'),
        ]);
        setTopWorkers(top.data);
        setTrending(trend.data);
        setEditorsPick(editors.data);
      } catch (error) {
        console.error('Error fetching workers:', error);
      }
    };
    fetchData();
  }, []);

  const handleDeploy = (id) => {
    alert(`Deploy worker ${id} – in production this opens the OAuth flow.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search for virtual employees..." 
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orca-deep-blue"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
        {['For You', 'Top Deployed', 'Trending', "Editors' Choice", 'New Workers'].map(cat => (
          <span key={cat} className="px-4 py-1.5 bg-white rounded-full border border-gray-200 text-sm font-medium whitespace-nowrap hover:border-orca-deep-blue cursor-pointer">
            {cat}
          </span>
        ))}
      </div>

      {/* Top Deployed */}
      <Section title="Top Deployed" workers={topWorkers} onDeploy={handleDeploy} />
      {/* Trending */}
      <Section title="Trending" workers={trending} onDeploy={handleDeploy} />
      {/* Editors' Choice */}
      <Section title="Editors' Choice" workers={editorsPick} onDeploy={handleDeploy} />
    </div>
  );
}

function Section({ title, workers, onDeploy }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-orca-black">{title}</h2>
        <a href="#" className="text-orca-deep-blue text-sm font-semibold">View all &gt;</a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {workers.map(w => (
          <WorkerCard key={w.id} worker={w} onDeploy={onDeploy} />
        ))}
      </div>
    </div>
  );
}
