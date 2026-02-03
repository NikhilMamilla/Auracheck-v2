// Format timestamp to readable date/time
export const formatTimestamp = (timestamp, format = 'datetime') => {
    if (!timestamp || !timestamp.toDate) {
      return 'N/A';
    }
    
    const date = timestamp.toDate();
    
    switch (format) {
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      case 'relative':
        return getRelativeTimeString(date);
      default:
        return date.toLocaleString();
    }
  };
  
  // Get relative time string (e.g. "2 hours ago")
  export const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Truncate text with ellipsis
  export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength) + '...';
  };
  
  // Extract mentions from text (e.g. @username)
  export const extractMentions = (text) => {
    if (!text) return [];
    
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };
  
  // Check if user has permission for an action
  export const hasPermission = (membership, action) => {
    if (!membership) return false;
    
    const role = membership.role;
    
    switch (action) {
      case 'viewCommunity':
        return true; // All members can view
      case 'createPost':
        return true; // All members can post
      case 'deleteOwnPost':
        return true; // All members can delete their own posts
      case 'deleteAnyPost':
        return role === 'admin' || role === 'moderator';
      case 'inviteMembers':
        return true; // All members can invite
      case 'manageMembers':
        return role === 'admin' || role === 'moderator';
      case 'manageSettings':
        return role === 'admin';
      case 'assignRoles':
        return role === 'admin';
      default:
        return false;
    }
  };
  
  // Generate color based on string (for consistent avatar colors)
  export const stringToColor = (str) => {
    if (!str) return '#6366F1'; // Default indigo color
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };
  
  // Generate initials from name
  export const getInitials = (name) => {
    if (!name) return '?';
    
    const names = name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Get notification message based on type
  export const getNotificationMessage = (notification) => {
    if (!notification) return '';
    
    const { type, actorName, communityName } = notification;
    
    switch (type) {
      case 'newPost':
        return `${actorName} posted in ${communityName}`;
      case 'newComment':
        return `${actorName} commented on your post in ${communityName}`;
      case 'mention':
        return `${actorName} mentioned you in ${communityName}`;
      case 'like':
        return `${actorName} liked your post in ${communityName}`;
      case 'newMember':
        return `${actorName} joined ${communityName}`;
      case 'roleChange':
        return `Your role was changed in ${communityName}`;
      default:
        return notification.message || 'New notification';
    }
  };
  
  // Get appropriate icon for notification type
  export const getNotificationIcon = (type) => {
    switch (type) {
      case 'newPost':
        return '📝';
      case 'newComment':
        return '💬';
      case 'mention':
        return '@️';
      case 'like':
        return '❤️';
      case 'newMember':
        return '👋';
      case 'roleChange':
        return '👑';
      default:
        return '🔔';
    }
  };
  
  // Parse message text for mentions, links, and emojis
  export const parseMessageText = (text) => {
    if (!text) return { text: '', hasMentions: false, hasLinks: false };
    
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    
    let formattedText = text;
    const hasMentions = mentionRegex.test(text);
    const hasLinks = linkRegex.test(text);
    
    // Reset regex lastIndex
    mentionRegex.lastIndex = 0;
    linkRegex.lastIndex = 0;
    
    return {
      text: formattedText,
      hasMentions,
      hasLinks
    };
  };
  
  // Get predefined community groups
  export const getPredefinedCommunities = () => {
    return [
      {
        id: 'mindfulness',
        name: 'Mindfulness Practitioners',
        description: 'Share and learn mindfulness techniques to stay present and reduce anxiety.',
        imageUrl: '/images/mindfulness.jpg',
        bannerUrl: '/images/mindfulness-banner.jpg',
        tags: ['meditation', 'presence', 'awareness'],
        rules: [
          'Respect everyone\'s mindfulness journey',
          'No promotion of commercial products',
          'Keep discussions focused on mindfulness practices'
        ],
        isPredefined: true
      },
      {
        id: 'stress-management',
        name: 'Stress Management',
        description: 'Strategies and support for managing daily stress and building resilience.',
        imageUrl: '/images/stress.jpg',
        bannerUrl: '/images/stress-banner.jpg',
        tags: ['coping', 'relaxation', 'work-life balance'],
        rules: [
          'Be supportive of others struggling with stress',
          'No medical advice without proper qualifications',
          'Respect privacy and confidentiality'
        ],
        isPredefined: true
      },
      {
        id: 'sleep-improvement',
        name: 'Sleep Improvement',
        description: 'Tips and discussions about improving sleep quality and establishing healthy sleep routines.',
        imageUrl: '/images/sleep.jpg',
        bannerUrl: '/images/sleep-banner.jpg',
        tags: ['insomnia', 'rest', 'circadian rhythm'],
        rules: [
          'No promotion of sleep medications without proper context',
          'Respect different sleep needs and patterns',
          'Share personal experiences but no medical diagnoses'
        ],
        isPredefined: true
      },
      {
        id: 'mood-boosters',
        name: 'Mood Boosters',
        description: 'Activities, techniques and support for elevating mood and fighting depression.',
        imageUrl: '/images/mood.jpg',
        bannerUrl: '/images/mood-banner.jpg',
        tags: ['positivity', 'joy', 'emotional wellbeing'],
        rules: [
          'Focus on positive, uplifting content',
          'No downplaying of mental health struggles',
          'Respect triggers and provide content warnings when needed'
        ],
        isPredefined: true
      },
      {
        id: 'daily-gratitude',
        name: 'Daily Gratitude',
        description: 'Practice gratitude together and share what you\'re thankful for each day.',
        imageUrl: '/images/gratitude.jpg',
        bannerUrl: '/images/gratitude-banner.jpg',
        tags: ['thankfulness', 'appreciation', 'positive psychology'],
        rules: [
          'Post at least one thing you\'re grateful for daily',
          'No negativity or complaining',
          'Respect others\' gratitude expressions even if they seem small'
        ],
        isPredefined: true
      }
    ];
  };