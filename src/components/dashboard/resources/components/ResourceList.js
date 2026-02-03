import React from 'react';
import ResourceCard from './ResourceCard';

const ResourceList = ({ 
  filteredResources, 
  isLoading, 
  handleSelectResource, 
  isResourceSaved, 
  handleSaveResource, 
  handleRemoveSavedResource, 
  categories,
  searchTerm,
  activeCategory,
  setSearchTerm,
  setActiveCategory,
  theme
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map(resource => (
            <ResourceCard 
              key={resource.id}
              resource={resource}
              handleSelectResource={handleSelectResource}
              isResourceSaved={isResourceSaved}
              handleSaveResource={handleSaveResource}
              handleRemoveSavedResource={handleRemoveSavedResource}
              categories={categories}
              theme={theme}
            />
          ))}
        </div>
      ) : (
        <div className={`${theme.card} rounded-xl p-6 text-center`}>
          <p className={theme.text}>
            {searchTerm || activeCategory !== 'all' 
              ? 'No resources match your search criteria.' 
              : 'No resources available at the moment.'}
          </p>
          
          {(searchTerm || activeCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceList;