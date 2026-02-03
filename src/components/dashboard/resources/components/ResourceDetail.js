import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { getCategoryName, formatDate, getReadingTime } from '../utils/resourceUtils';

const ResourceDetail = ({ 
  activeResource, 
  handleBackToResources, 
  isResourceSaved, 
  handleSaveResource, 
  handleRemoveSavedResource,
  categories
}) => {
  const { theme } = useTheme();
  
  if (!activeResource) return null;
  
  return (
    <div className={`${theme.card} rounded-xl p-6`}>
      <div className="flex items-center mb-4">
        <button
          onClick={handleBackToResources}
          className={`mr-3 p-2 rounded-full ${theme.background} hover:bg-gray-200 dark:hover:bg-gray-700`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={`text-xl font-bold ${theme.textBold}`}>{activeResource.title}</h1>
      </div>
      
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-0">
          {activeResource.categories && activeResource.categories.map(categoryId => (
            <span 
              key={categoryId} 
              className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {getCategoryName(categoryId, categories)}
            </span>
          ))}
          
          {activeResource.content && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 ml-1">
              {getReadingTime(activeResource.content)}
            </span>
          )}
        </div>
        
        <button
          onClick={() => isResourceSaved(activeResource.id) 
            ? handleRemoveSavedResource(activeResource.id) 
            : handleSaveResource(activeResource.id)
          }
          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
            isResourceSaved(activeResource.id)
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
              : `${theme.background} ${theme.text} border ${theme.border}`
          }`}
        >
          {isResourceSaved(activeResource.id) ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              <span>Saved</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Save</span>
            </>
          )}
        </button>
      </div>
      
      {activeResource.author && (
        <div className="flex items-center mb-4">
          <span className={`text-sm ${theme.textMuted}`}>
            By {activeResource.author}
          </span>
        </div>
      )}
      
      {activeResource.summary && (
        <div className={`${theme.text} font-medium my-6 p-4 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded`}>
          {activeResource.summary}
        </div>
      )}
      
      {activeResource.image && (
        <div className="my-6">
          <img 
            src={activeResource.image} 
            alt={activeResource.title} 
            className="w-full h-auto rounded-lg object-cover max-h-80"
          />
        </div>
      )}
      
      {activeResource.content && (
        <div 
          className={`${theme.text} mt-6 prose dark:prose-invert max-w-none`} 
          dangerouslySetInnerHTML={{ __html: activeResource.content }}
        />
      )}
      
      {activeResource.links && activeResource.links.length > 0 && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h2 className={`text-lg font-bold ${theme.textBold} mb-3`}>Additional Resources</h2>
          <div className="space-y-2">
            {activeResource.links.map((link, index) => (
              <a 
                key={index}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {link.title}
              </a>
            ))}
          </div>
        </div>
      )}
      
      {activeResource.tags && activeResource.tags.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-1">
            {activeResource.tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {activeResource.createdAt && (
        <div className={`text-xs ${theme.textMuted} mt-8 flex justify-between items-center pt-4 border-t ${theme.border}`}>
          <span>Last updated: {formatDate(activeResource.createdAt)}</span>
          <button
            onClick={handleBackToResources}
            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to resources
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceDetail;