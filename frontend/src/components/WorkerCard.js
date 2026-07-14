import React from 'react';
import { StarIcon } from '@heroicons/react/20/solid';

export default function WorkerCard({ worker, onDeploy }) {
  const stars = Math.round(worker.avg_rating);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition w-64 flex-shrink-0">
      <div className="flex items-start gap-3">
        <div className="text-4xl">{worker.icon_url || '🤖'}</div>
        <div>
          <h3 className="font-bold text-orca-black">{worker.name}</h3>
          <p className="text-sm text-orca-steel">ORCA Studios</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className={`h-4 w-4 ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`} />
            ))}
            <span className="text-xs text-orca-steel ml-1">({worker.total_reviews})</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs bg-orca-mist px-2 py-0.5 rounded-full text-orca-slate font-medium">
          Deploys to Slack
        </span>
        <button 
          onClick={() => onDeploy(worker.id)}
          className="bg-orca-deep-blue text-white text-sm font-semibold px-4 py-1 rounded-full hover:bg-blue-700 transition"
        >
          Deploy
        </button>
      </div>
      <div className="mt-2 text-sm font-semibold text-orca-black">From ${worker.base_price}/mo</div>
    </div>
  );
}
