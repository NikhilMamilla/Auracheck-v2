import React, { useState, useEffect } from 'react';
import { useCommunity } from './CommunityContext';
import { useTheme } from '../../../context/ThemeContext';
import CommunityCard from './CommunityCard';
import CreateCommunity from './CreateCommunity';

const CommunityList = ({ onSelectCommunity }) => {
  const { communities, userCommunities, loading, getPredefinedGroups } = useCommunity();
  const { theme } = useTheme();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'my', 'popular'
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedCommunities, setDisplayedCommunities] = useState([]);
  
  // Get predefined communities
  const predefinedCommunities = getPredefinedGroups();
  
  // Effect to filter communities based on criteria
  useEffect(() => {
    // Create a Map to deduplicate communities by ID
    const communityMap = new Map();
    
    // Add user-created communities first (they take precedence)
    communities.forEach(community => {
      communityMap.set(community.id, community);
    });
    
    // Add predefined communities only if they don't already exist
    predefinedCommunities.forEach(community => {
      if (!communityMap.has(community.id)) {
        communityMap.set(community.id, community);
      }
    });
    
    // Convert Map back to array
    let allCommunities = Array.from(communityMap.values());
    
    // Apply filters
    let filtered = [];
    
    if (filter === 'all') {
      filtered = allCommunities;
    } else if (filter === 'my') {
      const userCommunityIds = userCommunities.map(c => c.id);
      filtered = allCommunities.filter(c => userCommunityIds.includes(c.id));
    } else if (filter === 'popular') {
      filtered = [...allCommunities].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        c => c.name?.toLowerCase().includes(term) || 
             c.description?.toLowerCase().includes(term) ||
             (c.tags && c.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    setDisplayedCommunities(filtered);
  }, [communities, userCommunities, filter, searchTerm, predefinedCommunities]);
  
  return (
    <div className="community-list">
      {/* Header with controls */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-4 mb-5`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="filter-tabs flex flex-wrap">
            <button 
              onClick={() => setFilter('all')}
              className={`mr-4 pb-2 ${filter === 'all' ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' : theme.textMuted}`}
            >
              All Communities
            </button>
            <button 
              onClick={() => setFilter('my')}
              className={`mr-4 pb-2 ${filter === 'my' ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' : theme.textMuted}`}
            >
              My Communities
            </button>
            <button 
              onClick={() => setFilter('popular')}
              className={`pb-2 ${filter === 'popular' ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' : theme.textMuted}`}
            >
              Popular
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="search-box">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.input}`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Create Community
            </button>
          </div>
        </div>
      </div>
      
      {/* Communities grid */}
      {loading ? (
        <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme.text}`}>Loading communities...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedCommunities.length > 0 ? (
            displayedCommunities.map((community) => (
              <CommunityCard 
                key={community.id} 
                community={community} 
                onClick={() => onSelectCommunity(community.id)} 
              />
            ))
          ) : (
            <div className={`col-span-full ${theme.card} rounded-xl border ${theme.border} p-8 text-center`}>
              <div className={`w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4`}>
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No communities found</h3>
              <p className={`mb-4 ${theme.textMuted}`}>
                {filter === 'my' 
                  ? "You haven't joined any communities yet." 
                  : "No communities match your search criteria."}
              </p>
              {filter === 'my' && (
                <button 
                  onClick={() => setFilter('all')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Explore Communities
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Create community modal */}
      {showCreateModal && (
        <CreateCommunity onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default CommunityList;