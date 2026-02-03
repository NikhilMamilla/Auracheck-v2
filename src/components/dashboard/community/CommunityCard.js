import React, { useState, useEffect } from 'react';
import { useCommunity } from './CommunityContext';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Import images directly
import gratitudeImg from '../community/images/Gratitude.jpg';
import mindfullImg from '../community/images/mindfull.webp';
import moodBoostersImg from '../community/images/mood.jpg';
import sleepImg from '../community/images/sleep.jpg';
import stressManagementImg from '../community/images/stress.jpg';

const CommunityCard = ({ community, onClick }) => {
  const { userCommunities, joinCommunity } = useCommunity();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [actualMemberCount, setActualMemberCount] = useState(community.memberCount || 0);
  
  // Check if user is already a member
  const isMember = userCommunities.some(c => c.id === community.id);
  
  // Get appropriate default image based on community type or theme
  const getCommunityImage = () => {
    if (!community) return gratitudeImg;
    
    const name = (community.name || '').toLowerCase();
    
    // Map community tags or type to specific images
    if (community.tags) {
      if (community.tags.includes('mindfulness') || community.tags.includes('meditation') || community.tags.includes('presence')) {
        return mindfullImg;
      }
      if (community.tags.includes('positivity') || community.tags.includes('wellness') || community.tags.includes('joy')) {
        return moodBoostersImg;
      }
      if (community.tags.includes('insomnia') || community.tags.includes('rest')) {
        return sleepImg;
      }
      if (community.tags.includes('stress') || community.tags.includes('relaxation') || community.tags.includes('copying')) {
        return stressManagementImg;
      }
    }
    
    // Check by name if tags don't match
    if (name.includes('gratitude')) {
      return gratitudeImg;
    }
    if (name.includes('mindful')) {
      return mindfullImg;
    }
    if (name.includes('mood') || name.includes('boost')) {
      return moodBoostersImg;
    }
    if (name.includes('Sleep') || name.includes('improvement')) {
      return sleepImg;
    }
    if (name.includes('stress')) {
      return stressManagementImg;
    }
    
    // Default to gratitude image if no match is found
    return gratitudeImg;
  };
  
  // Get community image
  const communityImage = getCommunityImage();
  
  // Special handling for sleep community
  const isSleepCommunity = 
    community.name?.toLowerCase().includes('sleep') || 
    (community.tags && (community.tags.includes('insomnia') || community.tags.includes('rest')));
  
  // Fetch actual member count from members collection
  useEffect(() => {
    let isMounted = true;
    
    const fetchActualMemberCount = async () => {
      try {
        const membersRef = collection(db, 'communityMembers');
        const q = query(membersRef, where('communityId', '==', community.id));
        const querySnapshot = await getDocs(q);
        
        if (isMounted) {
          setActualMemberCount(querySnapshot.size);
        }
      } catch (error) {
        console.error('Error fetching member count for card:', error);
        if (isMounted) {
          setActualMemberCount(community.memberCount || 0);
        }
      }
    };
    
    fetchActualMemberCount();
    
    return () => {
      isMounted = false;
    };
  }, [community.id, community.memberCount]);
  
  const handleJoin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      console.log("User not logged in");
      return;
    }
    
    setJoining(true);
    setJoinError(null);
    
    try {
      const success = await joinCommunity(community.id, e);
      
      if (success) {
        console.log("Successfully joined community");
        setActualMemberCount(prev => prev + 1);
      } else {
        throw new Error("Couldn't join community");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      setJoinError(error.message || "Couldn't join community. Please try again.");
    } finally {
      setJoining(false);
    }
  };
  
  const handleCardClick = (e) => {
    if (onClick && !e.defaultPrevented) {
      onClick();
    }
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className={`${theme.card} rounded-xl border ${theme.border} overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer`}
    >
      {/* Card header with image */}
      <div className="h-32 md:h-40 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 relative">
        {community.imageUrl ? (
          <img 
            src={community.imageUrl} 
            alt={community.name} 
            className="w-full h-full object-cover"
          />
        ) : isSleepCommunity ? (
          // For sleep community, use <img> tag instead of background
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-indigo-500/50"></div>
            <img 
              src={sleepImg} 
              alt="Sleep Improvement" 
              className="w-full h-full object-contain z-10 relative"
            />
          </div>
        ) : (
          <div 
            className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600"
            style={{
              backgroundImage: `url(${communityImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay',
              opacity: '0.8'
            }}
          ></div>
        )}
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Tags on image */}
        {community.tags && community.tags.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[70%] z-20">
            {community.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index} 
                className="text-xs bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {community.tags.length > 2 && (
              <span className="text-xs bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                +{community.tags.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Official badge if predefined */}
        {community.isPredefined && (
          <div className="absolute top-2 left-2 z-20">
            <span className="text-xs bg-indigo-600/90 text-white px-2 py-1 rounded-full backdrop-blur-sm">
              Official
            </span>
          </div>
        )}
        
        {/* Community name at bottom of image */}
        <div className="absolute bottom-0 left-0 p-3 z-20">
          <h3 className="text-white font-medium text-lg truncate max-w-full">
            {community.name}
          </h3>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4">
        <p className={`${theme.text} text-sm line-clamp-2 h-10 mb-3`}>
          {community.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className={`${theme.textMuted} text-sm flex items-center`}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            {actualMemberCount} {actualMemberCount === 1 ? 'member' : 'members'}
          </div>
          
          {/* Join button that stops propagation */}
          {!isMember ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="text-sm bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          ) : (
            <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
              Joined
            </span>
          )}
        </div>
        
        {joinError && (
          <p className="mt-2 text-xs text-red-500">{joinError}</p>
        )}
      </div>
    </div>
  );
};

export default CommunityCard;