import React from 'react';

const ProgressBar = ({ progress, className = '' }) => {
  const percentage = Math.min(Math.max(progress || 0, 0), 100);
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
    </div>
  );
};

export default ProgressBar;
