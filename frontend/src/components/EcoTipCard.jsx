import React from 'react';

function EcoTipCard({ tip, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 border border-green-100">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-700 font-medium">{tip}</span>
    </div>
  );
}

export default EcoTipCard;