import React from 'react';
import { getCategoryName, formatDate } from '../utils/resourceUtils';

const ResourceCard = ({ 
  resource, 
  handleSelectResource, 
  isResourceSaved, 
  handleSaveResource, 
  handleRemoveSavedResource, 
  categories,
  theme
}) => {
  return (
    <div 
      className={`${theme.card} rounded-xl p-6 border ${theme.border} hover:border-indigo-300 transition-colors`}
    >
      <div className="flex justify-between items-start">
        <h2 
          className={`text-lg font-bold ${theme.textBold} cursor-pointer hover:text-indigo-500`}
          onClick={() => handleSelectResource(resource)}
        >
          {resource.title}
        </h2>
        
        <button
          onClick={() => isResourceSaved(resource.id) 
            ? handleRemoveSavedResource(resource.id) 
            : handleSaveResource(resource.id)
          }
          className={`p-2 rounded-full ${theme.background} hover:bg-gray-200 dark:hover:bg-gray-700`}
          aria-label={isResourceSaved(resource.id) ? "Unsave resource" : "Save resource"}
        >
          {isResourceSaved(resource.id) ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </button>
      </div>
      
      {resource.categories && resource.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {resource.categories.map(categoryId => (
            <span 
              key={categoryId} 
              className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {getCategoryName(categoryId, categories)}
            </span>
          ))}
        </div>
      )}
      
      <p className={`${theme.text} mt-3 line-clamp-3`}>
        {resource.summary}
      </p>
      
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => handleSelectResource(resource)}
          className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
        >
          Read more
        </button>
        
        {resource.createdAt && (
          <span className={`text-xs ${theme.text}`}>
            {formatDate(resource.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;