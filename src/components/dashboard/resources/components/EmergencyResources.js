import React from 'react';
import emergencyResources from '../data/emergencyResources';

const EmergencyResources = ({ theme }) => {
  return (
    <div className={`${theme.card} rounded-xl p-6 border-l-4 border-red-500`}>
      <h2 className={`text-lg font-bold ${theme.textBold} mb-4`}>Emergency Resources</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emergencyResources.map(resource => (
          <div key={resource.id} className={`p-4 rounded-lg ${theme.background} ${theme.border} border`}>
            <h3 className={`font-medium ${theme.textBold}`}>{resource.title}</h3>
            <p className={`${theme.text} text-sm my-2`}>{resource.description}</p>
            <div className="flex flex-col space-y-2 mt-3">
              <a 
                href={`tel:${resource.phone}`} 
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {resource.phone}
              </a>
              <a 
                href={resource.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Website
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyResources;