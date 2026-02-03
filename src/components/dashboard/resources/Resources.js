import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import useResources from './hooks/useResources';

// Components
import ResourceHeader from './components/ResourceHeader';
import SearchAndFilter from './components/SearchAndFilter';
import EmergencyResources from './components/EmergencyResources';
import ResourceList from './components/ResourceList';
import SavedResources from './components/SavedResources';
import ResourceDetail from './components/ResourceDetail';

const Resources = () => {
  const { theme } = useTheme();
  const [activeView, setActiveView] = useState('browse'); // 'browse', 'saved', 'resource'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeResource, setActiveResource] = useState(null);
  
  const { 
    resources,
    categories, 
    savedResources, 
    isLoading, 
    error, 
    handleSaveResource, 
    handleRemoveSavedResource,
    getFilteredResources,
    getSavedResourcesData,
    isResourceSaved
  } = useResources(activeCategory, searchTerm);

  // Handle resource selection
  const handleSelectResource = (resource) => {
    setActiveResource(resource);
    setActiveView('resource');
    window.scrollTo(0, 0);
  };
  
  // Handle back button in resource view
  const handleBackToResources = () => {
    setActiveResource(null);
    setActiveView('browse');
  };
  
  // Handle search term change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Main render logic
  return (
    <div>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {activeView === 'resource' && activeResource ? (
        <ResourceDetail 
          activeResource={activeResource}
          handleBackToResources={handleBackToResources}
          isResourceSaved={isResourceSaved}
          handleSaveResource={handleSaveResource}
          handleRemoveSavedResource={handleRemoveSavedResource}
          categories={categories}
        />
      ) : activeView === 'saved' ? (
        <div className="space-y-6">
          <ResourceHeader 
            title="Saved Resources"
            activeView={activeView}
            setActiveView={setActiveView}
            savedCount={savedResources.length}
          />
          
          <SavedResources 
            savedResourcesData={getSavedResourcesData()}
            isLoading={isLoading}
            handleSelectResource={handleSelectResource}
            handleRemoveSavedResource={handleRemoveSavedResource}
            categories={categories}
            setActiveView={setActiveView}
            theme={theme}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <ResourceHeader 
            title="Mental Health Resources"
            activeView={activeView}
            setActiveView={setActiveView}
            savedCount={savedResources.length}
          />
          
          <SearchAndFilter 
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categories={categories}
            theme={theme}
          />
          
          <EmergencyResources theme={theme} />
          
          <ResourceList 
            filteredResources={getFilteredResources()}
            isLoading={isLoading}
            handleSelectResource={handleSelectResource}
            isResourceSaved={isResourceSaved}
            handleSaveResource={handleSaveResource}
            handleRemoveSavedResource={handleRemoveSavedResource}
            categories={categories}
            searchTerm={searchTerm}
            activeCategory={activeCategory}
            setSearchTerm={setSearchTerm}
            setActiveCategory={setActiveCategory}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};

export default Resources;