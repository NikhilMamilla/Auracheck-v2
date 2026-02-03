import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useCommunity } from '../community/CommunityContext';
import CommunityList from '../community/CommunityList';
import CommunityDetail from '../community/CommunityDetail';
import CommunityNotifications from '../community/CommunityNotifications';

const Community = ({ userData }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { notifications } = useCommunity();
  
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get unread notifications count
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);
  
  // Handle community selection
  const handleSelectCommunity = (communityId) => {
    setSelectedCommunity(communityId);
  };
  
  // Go back to community list
  const handleBackToList = () => {
    setSelectedCommunity(null);
  };
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  return (
    <div className="relative">
      {/* Page intro section */}
      <div className={`mb-6 ${theme.card} rounded-xl p-5 border ${theme.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Community Connection
            </h1>
            <p className={`${theme.text} text-sm md:text-base opacity-80`}>
              Connect with others on their mental wellness journey, share experiences, and find support.
            </p>
          </div>
          
          {/* Notifications button with badge for unread count */}
          <button 
            onClick={toggleNotifications}
            className={`p-2 rounded-full ${theme.buttonSecondary} relative transition-colors hover:bg-gray-200 dark:hover:bg-gray-700`}
            aria-label="View notifications"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              ></path>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Main content with optional notifications panel */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* Notifications panel */}
        {showNotifications && (
          <div className={`md:w-1/3 ${theme.card} rounded-xl border ${theme.border} p-4 mb-4 md:mb-0 h-fit`}>
            <CommunityNotifications />
          </div>
        )}
        
        {/* Community content */}
        <div className={`${showNotifications ? 'md:w-2/3' : 'w-full'} transition-all duration-300`}>
          {selectedCommunity ? (
            <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
              <button 
                onClick={handleBackToList}
                className={`mb-4 flex items-center gap-2 px-3 py-1 rounded-lg ${theme.buttonSecondary} transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-sm`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Communities
              </button>
              <CommunityDetail communityId={selectedCommunity} />
            </div>
          ) : (
            <CommunityList onSelectCommunity={handleSelectCommunity} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;