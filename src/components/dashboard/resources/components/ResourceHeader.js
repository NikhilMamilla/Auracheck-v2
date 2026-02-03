import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';

const ResourceHeader = ({ title, activeView, setActiveView, savedCount }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`${theme.card} rounded-xl p-6`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h1 className={`text-2xl font-bold ${theme.textBold}`}>{title}</h1>
        
        <div className="flex mt-2 sm:mt-0 space-x-2">
          <button
            onClick={() => setActiveView('browse')}
            className={`px-3 py-1 rounded-lg text-sm ${activeView === 'browse' ? 'bg-indigo-600 text-white' : theme.button}`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveView('saved')}
            className={`px-3 py-1 rounded-lg text-sm ${activeView === 'saved' ? 'bg-indigo-600 text-white' : theme.button}`}
          >
            Saved ({savedCount})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceHeader;