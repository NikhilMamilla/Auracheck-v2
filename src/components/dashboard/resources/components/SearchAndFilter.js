import React from 'react';

const SearchAndFilter = ({ 
  searchTerm, 
  handleSearchChange, 
  activeCategory, 
  setActiveCategory, 
  categories, 
  theme 
}) => {
  return (
    <div className={`${theme.card} rounded-xl p-6`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={`pl-10 pr-4 py-2 w-full rounded-lg ${theme.background} ${theme.text} border ${theme.border} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded-full text-xs ${
            activeCategory === 'all' 
              ? 'bg-indigo-600 text-white' 
              : `${theme.background} ${theme.text} border ${theme.border}`
          }`}
        >
          All Resources
        </button>
        
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 py-1 rounded-full text-xs ${
              activeCategory === category.id 
                ? 'bg-indigo-600 text-white' 
                : `${theme.background} ${theme.text} border ${theme.border}`
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchAndFilter;