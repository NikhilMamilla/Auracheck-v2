import React, { useState, useEffect } from 'react';
// Import images directly - adjust paths as needed based on your folder structure
import gratitudeImg from '../community/images/Gratitude.jpg';
import mindfullImg from '../community/images/mindfull.webp';
import moodBoostersImg from '../community/images/mood.jpg';
import sleepImg from '../community/images/sleep.jpg';
import stressManagementImg from '../community/images/stress.jpg';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  Timestamp,
  deleteDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useCommunity } from './CommunityContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import CommunityChat from './CommunityChat';
import CommunityMembers from './CommunityMembers';

const CommunityDetail = ({ communityId }) => {
  const { joinCommunity, leaveCommunity, deleteCommunity, userCommunities, getPredefinedGroups } = useCommunity();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');
  const [membership, setMembership] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [actualMemberCount, setActualMemberCount] = useState(0);
  const [postError, setPostError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteCommunityDialog, setShowDeleteCommunityDialog] = useState(false);
  const [deletingCommunity, setDeletingCommunity] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Check if user is a member and get their role
  useEffect(() => {
    const userMembership = userCommunities.find(c => c.id === communityId);
    setMembership(userMembership);
  }, [userCommunities, communityId]);
  
  // Fetch community details
  useEffect(() => {
    const fetchCommunity = async () => {
      setLoading(true);
      
      try {
        // Check predefined communities first
        const predefinedCommunities = getPredefinedGroups();
        const predefined = predefinedCommunities.find(c => c.id === communityId);
        
        if (predefined) {
          setCommunity(predefined);
        } else {
          // Fetch from Firestore
          const communityRef = doc(db, 'communities', communityId);
          const communitySnap = await getDoc(communityRef);
          
          if (communitySnap.exists()) {
            setCommunity({
              id: communitySnap.id,
              ...communitySnap.data()
            });
          } else {
            // Community not found
            console.error('Community not found');
            setCommunity(null);
          }
        }
      } catch (error) {
        console.error('Error fetching community:', error);
        setCommunity(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunity();
  }, [communityId, getPredefinedGroups]);
  
  // Fetch actual member count directly from members collection
  useEffect(() => {
    if (!communityId) return;
    
    let isMounted = true;
    
    const fetchMemberCount = async () => {
      try {
        const membersRef = collection(db, 'communityMembers');
        const q = query(membersRef, where('communityId', '==', communityId));
        const querySnapshot = await getDocs(q);
        
        if (isMounted) {
          setActualMemberCount(querySnapshot.size);
        }
      } catch (error) {
        console.error('Error fetching member count:', error);
      }
    };
    
    // Initial fetch
    fetchMemberCount();
    
    // Set up realtime listener for member changes
    const membersRef = collection(db, 'communityMembers');
    const q = query(membersRef, where('communityId', '==', communityId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isMounted) {
        setActualMemberCount(snapshot.size);
      }
    }, (error) => {
      console.error("Error in member count listener:", error);
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [communityId]);
  
  // Fetch community posts with improved error handling and debugging
  useEffect(() => {
    if (!communityId) return;
    
    let isMounted = true;
    setPostsLoading(true);
    setPostError(null);
    
    console.log(`Fetching posts for community: ${communityId}`);
    
    // First try a direct query without a snapshot
    const fetchPostsDirectly = async () => {
      try {
        const postsRef = collection(db, 'communityPosts');
        const q = query(
          postsRef,
          where('communityId', '==', communityId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (isMounted) {
          // Log some information about the posts being retrieved
          console.log(`Found ${querySnapshot.size} posts directly`);
          
          const postsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            let createdDate = null;
            
            // Handle Firestore timestamp conversion with extra care
            if (data.createdAt) {
              if (data.createdAt instanceof Timestamp) {
                createdDate = data.createdAt.toDate();
              } else if (data.createdAt.seconds) {
                // Handle manually if it's a raw timestamp object
                createdDate = new Date(data.createdAt.seconds * 1000);
              }
            }
            
            return {
              id: doc.id,
              ...data,
              createdAt: createdDate,
              _debug_raw_timestamp: data.createdAt ? { ...data.createdAt } : null
            };
          });
          
          // Log first post for debugging if available
          if (postsData.length > 0) {
            console.log("First post sample:", {
              id: postsData[0].id,
              content: postsData[0].content?.substring(0, 50) + '...',
              author: postsData[0].authorName,
              timestamp: postsData[0]._debug_raw_timestamp,
              date: postsData[0].createdAt
            });
          }
          
          setPosts(postsData);
          setPostsLoading(false);
        }
      } catch (error) {
        console.error('Error in direct posts query:', error);
        if (isMounted) {
          setPostError(`Error loading posts: ${error.message}`);
          setPostsLoading(false);
        }
      }
    };
    
    fetchPostsDirectly();
    
    // Then set up a real-time listener
    const postsRef = collection(db, 'communityPosts');
    const q = query(
      postsRef,
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isMounted) {
        console.log(`Real-time update: ${snapshot.size} posts`);
        
        const postsData = snapshot.docs.map(doc => {
          const data = doc.data();
          let createdDate = null;
          
          // Handle Firestore timestamp conversion with extra care
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) {
              createdDate = data.createdAt.toDate();
            } else if (data.createdAt.seconds) {
              // Handle manually if it's a raw timestamp object
              createdDate = new Date(data.createdAt.seconds * 1000);
            }
          }
          
          return {
            id: doc.id,
            ...data,
            createdAt: createdDate
          };
        });
        
        setPosts(postsData);
        setPostsLoading(false);
      }
    }, (error) => {
      console.error("Error in posts listener:", error);
      if (isMounted) {
        setPostError(`Error in real-time posts: ${error.message}`);
        setPostsLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [communityId]);
  
  // New function to handle post deletion
  const handleDeletePost = async (postId) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeletePostId(postId);
    
    try {
      // Get the post reference
      const postRef = doc(db, 'communityPosts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        alert('Post not found');
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }
      
      const postData = postSnap.data();
      
      // Delete the post
      await deleteDoc(postRef);
      
      // Update community stats
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        postCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      // Update local state to remove the deleted post
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(`Failed to delete post: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeletePostId(null);
      setShowDeleteConfirm(false);
    }
  };
  
  // Check if the current user can delete a post
  const canDeletePost = (post) => {
    if (!currentUser) return false;
    
    // User can delete if they are the author
    if (post.authorId === currentUser.uid) return true;
    
    // User can delete if they are an admin of the community
    if (membership && membership.role === 'admin') return true;
    
    return false;
  };
  
  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser || isJoining) return;
    
    setIsJoining(true);
    
    try {
      await joinCommunity(communityId, e);
      console.log("Successfully joined community");
      // State will be updated via the useEffect hooks that listen to userCommunities
    } catch (error) {
      console.error("Error joining community:", error);
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeave = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser || !membership || isLeaving) return;
    
    // Show confirmation if they're an admin
    if (membership.role === 'admin') {
      if (!window.confirm('As an admin, leaving might affect the community. Are you sure?')) {
        return;
      }
    }
    
    setIsLeaving(true);
    
    try {
      const success = await leaveCommunity(communityId, e);
      
      if (!success && membership.role === 'admin') {
        // If unable to leave (likely last admin), prompt to delete instead
        if (window.confirm('As the last admin, you cannot leave this community. Would you like to delete it instead?')) {
          setShowDeleteCommunityDialog(true);
        }
      }
    } catch (error) {
      console.error("Error leaving community:", error);
    } finally {
      setIsLeaving(false);
    }
  };
  
  // New function to handle community deletion
  const handleDeleteCommunity = async (e) => {
    if (e) e.preventDefault();
    if (deletingCommunity) return;
    
    setDeletingCommunity(true);
    
    try {
      const success = await deleteCommunity(communityId, e);
      
      if (success) {
        // Redirect to communities list after successful deletion
        navigate('/communities');
      } else {
        alert('Failed to delete community. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      alert(`Error deleting community: ${error.message}`);
    } finally {
      setDeletingCommunity(false);
      setShowDeleteCommunityDialog(false);
    }
  };
  
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim() || !currentUser || !membership) return;
    
    try {
      // Add post to Firestore
      const postData = {
        communityId,
        content: newPostContent,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || null,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('Creating new post with data:', postData);
      
      const docRef = await addDoc(collection(db, 'communityPosts'), postData);
      console.log('Post created with ID:', docRef.id);
      
      // Clear the input
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message}`);
    }
  };
  
  // Format date for readability
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    try {
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (seconds < 60) {
        return 'just now';
      } else if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (days < 7) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Date error';
    }
  };
  
  // Get appropriate default banner image based on community type or theme
  const getDefaultBanner = () => {
    if (!community) return gratitudeImg;
    
    // Map community tags or type to specific images
    if (community.tags) {
      if (community.tags.includes('mindfulness') || community.tags.includes('meditation')) {
        return mindfullImg;
      }
      if (community.tags.includes('wellness') || community.tags.includes('joy')) {
        return moodBoostersImg;
      }
      if (community.tags.includes('sleep') || community.tags.includes('rest')) {
        return sleepImg;
      }
      if (community.tags.includes('stress') || community.tags.includes('relaxation')) {
        return stressManagementImg;
      }
    }
    
    // Default to gratitude image if no match is found
    return gratitudeImg;
  };
  
  const defaultBanner = getDefaultBanner();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!community) {
    return (
      <div className={`${theme.card} rounded-xl border ${theme.border} p-8 text-center`}>
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Community Not Found</h2>
        <p className={`${theme.textMuted} mb-4`}>This community may have been removed or you don't have permission to view it.</p>
      </div>
    );
  }
  
  return (
    <div className="community-detail-container">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl overflow-hidden mb-5">
        {community.bannerUrl ? (
          <img 
            src={community.bannerUrl} 
            alt={community.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={defaultBanner} 
            alt="Community Banner" 
            className="w-full h-full object-cover opacity-70"
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {community.name}
          </h1>
          <div className="flex flex-wrap gap-2 mb-2">
            {community.tags && community.tags.map((tag, index) => (
              <span 
                key={index} 
                className="text-xs bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-white text-opacity-90 text-sm">
            {actualMemberCount || 0} {actualMemberCount === 1 ? 'member' : 'members'}
          </p>
        </div>
        
        {/* Join/Leave/Delete buttons in top right */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {!membership ? (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-75"
            >
              {isJoining ? 'Joining...' : 'Join Community'}
            </button>
          ) : (
            <>
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                className="bg-white/90 hover:bg-white text-indigo-700 px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-75"
              >
                {isLeaving ? 'Leaving...' : membership.role === 'admin' ? 'Leave (Admin)' : 'Leave'}
              </button>
              
              {/* Add Delete Community button for admins */}
              {membership.role === 'admin' && (
                <button
                  onClick={() => setShowDeleteCommunityDialog(true)}
                  disabled={deletingCommunity}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-75"
                >
                  {deletingCommunity ? 'Deleting...' : 'Delete Community'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Community Dialog */}
      {showDeleteCommunityDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.card} rounded-xl border ${theme.border} p-6 max-w-md w-full`}>
            <h3 className="text-xl font-bold mb-2 text-red-600">Delete Community</h3>
            <p className={`${theme.text} mb-4`}>
              Are you sure you want to delete this community? This action cannot be undone and will remove all posts, chats, and member records.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteCommunityDialog(false)}
                className={`px-4 py-2 rounded-lg ${theme.buttonSecondary}`}
                disabled={deletingCommunity}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={deletingCommunity}
              >
                {deletingCommunity ? 'Deleting...' : 'Delete Community'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs navigation */}
      <div className={`flex border-b ${theme.border} mb-5 overflow-x-auto hide-scrollbar`}>
        <button 
          onClick={() => setActiveTab('discussion')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'discussion' 
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : theme.textMuted
          }`}
        >
          Discussion
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'chat' 
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : theme.textMuted
          }`}
        >
          Live Chat
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'members' 
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : theme.textMuted
          }`}
        >
          Members
        </button>
        <button 
          onClick={() => setActiveTab('about')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'about' 
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : theme.textMuted
          }`}
        >
          About
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'discussion' && (
          <div className="discussion-tab">
            {!membership && (
              <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-5 text-center`}>
                <p className="text-yellow-800 dark:text-yellow-200">Join this community to participate in discussions</p>
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-75"
                >
                  {isJoining ? 'Joining...' : 'Join Now'}
                </button>
              </div>
            )}
            
            {/* Post creation form */}
            {membership && (
              <div className={`${theme.card} rounded-xl border ${theme.border} p-4 mb-5`}>
                <form onSubmit={handleSubmitPost}>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share something with the community..."
                    className={`w-full p-3 border ${theme.inputBorder} ${theme.input} rounded-lg resize-none min-h-[100px]`}
                    required
                  ></textarea>
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newPostContent.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Posts list with loading and error states */}
            {postsLoading ? (
              <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                <p className={`mt-3 ${theme.text}`}>Loading posts...</p>
              </div>
            ) : postError ? (
              <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center text-red-500`}>
                <p>Error loading posts: {postError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
                >
                  Refresh page
                </button>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-5">
                {posts.map(post => (
                  <div key={post.id} className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {post.authorPhotoURL ? (
                          <img 
                            src={post.authorPhotoURL} 
                            alt={post.authorName} 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium">
                            {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'A'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-medium ${theme.text}`}>{post.authorName || 'Anonymous'}</h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(post.createdAt)}
                            </p>
                          </div>
                          
                          {/* Delete Button */}
                          {canDeletePost(post) && (
                            <div className="relative">
                              <button 
                                onClick={() => {
                                  setDeletePostId(post.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                                disabled={isDeleting && deletePostId === post.id}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </button>
                              
                              {showDeleteConfirm && deletePostId === post.id && (
                                <div className={`absolute right-0 top-6 z-10 w-48 p-3 ${theme.card} border ${theme.border} rounded-lg shadow-lg`}>
                                  <p className={`text-sm ${theme.text} mb-2`}>Delete this post?</p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleDeletePost(post.id)}
                                      disabled={isDeleting}
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors flex-1"
                                    >
                                      {isDeleting && deletePostId === post.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowDeleteConfirm(false);setDeletePostId(null);
                                      }}
                                      className={`bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs py-1 px-2 rounded transition-colors flex-1`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <p className={`${theme.text} whitespace-pre-line`}>{post.content}</p>
                        </div>
                        
                        <div className="mt-4 flex gap-4">
                          <button className={`${theme.textMuted} hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center gap-1`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                            {post.likes || 0}
                          </button>
                          <button className={`${theme.textMuted} hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center gap-1`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            {post.commentCount || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
                <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                  </svg>
                </div>
                <h3 className={`text-lg font-medium ${theme.text}`}>No posts yet</h3>
                <p className={`${theme.textMuted} mt-1`}>Be the first to start a discussion!</p>
                
                {membership && (
                  <button
                    onClick={() => document.querySelector('textarea')?.focus()}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'chat' && (
          <div className="chat-tab">
            <CommunityChat communityId={communityId} membership={membership} />
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="members-tab">
            <CommunityMembers 
              communityId={communityId} 
              isAdmin={membership?.role === 'admin'} 
              actualMemberCount={actualMemberCount} 
            />
          </div>
        )}
        
        {activeTab === 'about' && (
          <div className="about-tab">
            <div className={`${theme.card} rounded-xl border ${theme.border} p-5`}>
              <h3 className="text-xl font-medium mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">About this Community</h3>
              
              <div className="mb-6">
                <h4 className={`text-lg font-medium mb-2 ${theme.text}`}>Description</h4>
                <p className={`${theme.text}`}>{community.description}</p>
              </div>
              
              {community.rules && community.rules.length > 0 && (
                <div className="mb-6">
                  <h4 className={`text-lg font-medium mb-2 ${theme.text}`}>Community Rules</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {community.rules.map((rule, index) => (
                      <li key={index} className={theme.text}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {community.resources && community.resources.length > 0 && (
                <div className="mb-6">
                  <h4 className={`text-lg font-medium mb-2 ${theme.text}`}>Resources</h4>
                  <ul className="space-y-2">
                    {community.resources.map((resource, index) => (
                      <li key={index}>
                        <a 
                          href={resource.url} 
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {resource.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h4 className={`text-lg font-medium mb-2 ${theme.text}`}>Community Info</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={theme.textMuted}>Created</p>
                    <p className={theme.text}>{community.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={theme.textMuted}>Members</p>
                    <p className={theme.text}>{actualMemberCount || 0}</p>
                  </div>
                  {membership && (
                    <div>
                      <p className={theme.textMuted}>Your Role</p>
                      <p className={`capitalize ${theme.text}`}>{membership.role}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;