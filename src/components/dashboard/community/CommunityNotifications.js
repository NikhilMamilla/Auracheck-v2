import React from 'react';
import { useCommunity } from './CommunityContext';
import { useTheme } from '../../../context/ThemeContext';

const CommunityNotifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useCommunity();
  const { theme } = useTheme();
  
  // Group notifications by date
  const groupNotificationsByDate = () => {
    const groups = {};
    
    notifications.forEach(notification => {
      if (!notification.createdAt) return;
      
      const date = notification.createdAt.toDate();
      const day = date.toLocaleDateString();
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(notification);
    });
    
    return groups;
  };
  
  // Format notification time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'newPost':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        );
      case 'newComment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        );
      case 'mention':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
          </svg>
        );
      case 'like':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        );
      case 'newMember':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
        );
      case 'roleChange':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        );
    }
  };
  
  // Get notification description
  const getNotificationText = (notification) => {
    const { type, actorName, communityName, postTitle } = notification;
    
    switch (type) {
      case 'newPost':
        return `${actorName} posted in ${communityName}: "${postTitle || ''}"`;
      case 'newComment':
        return `${actorName} commented on your post in ${communityName}`;
      case 'mention':
        return `${actorName} mentioned you in ${communityName}`;
      case 'like':
        return `${actorName} liked your post in ${communityName}`;
      case 'newMember':
        return `${actorName} joined ${communityName}`;
      case 'roleChange':
        return `You were made an admin in ${communityName}`;
      default:
        return notification.message || 'New notification';
    }
  };
  
  const notificationGroups = groupNotificationsByDate();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="notifications-container">
      <div className={`${theme.card} rounded-xl border ${theme.border} overflow-hidden`}>
        {/* Header with mark all read button */}
        <div className="notifications-header p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <h3 className={`font-medium ${theme.text}`}>Notifications</h3>
            {unreadCount > 0 && (
              <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllNotificationsAsRead}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        {/* Notifications content */}
        <div className="notifications-content max-h-[70vh] overflow-y-auto">
          {Object.keys(notificationGroups).length > 0 ? (
            Object.keys(notificationGroups).map(day => (
              <div key={day} className="notification-group">
                <div className="day-divider flex items-center justify-center py-3 px-4">
                  <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                  <span className="px-3 text-xs text-gray-500 dark:text-gray-400">{day}</span>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                </div>
                
                <div>
                  {notificationGroups[day].map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                        !notification.read ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`notification-icon flex-shrink-0 w-10 h-10 rounded-full ${
                          !notification.read 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        } flex items-center justify-center`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`${!notification.read ? 'font-medium' : ''} ${theme.text}`}>
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600 self-center"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3`}>
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </div>
              <p className={theme.textMuted}>
                No notifications yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Join communities and interact with others to receive notifications
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityNotifications;