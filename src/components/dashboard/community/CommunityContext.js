import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';

const CommunityContext = createContext();

export const useCommunity = () => {
  return useContext(CommunityContext);
};

export const CommunityProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // Fetch all communities
  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        const communitiesRef = collection(db, 'communities');
        const q = query(communitiesRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const communitiesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("Fetched communities:", communitiesData.length);
          setCommunities(communitiesData);
          setLoading(false);
        }, error => {
          console.error("Error in communities snapshot:", error);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error fetching communities:", error);
        setLoading(false);
      }
    };
    
    fetchCommunities();
    
    return () => unsubscribe();
  }, []);
  
  // Fetch communities the user is a member of
  useEffect(() => {
    if (!currentUser) {
      setUserCommunities([]);
      return;
    }
    
    let unsubscribe = () => {};
    
    const fetchUserCommunities = async () => {
      try {
        console.log("Fetching user communities for:", currentUser.uid);
        const userCommunitiesRef = collection(db, 'communityMembers');
        const q = query(userCommunitiesRef, where('userId', '==', currentUser.uid));
        
        unsubscribe = onSnapshot(q, async (snapshot) => {
          const memberData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log("User memberships found:", memberData.length);
          
          // Get full community details for each membership
          const communitiesData = await Promise.all(
            memberData.map(async (member) => {
              try {
                const communityRef = doc(db, 'communities', member.communityId);
                const communitySnap = await getDoc(communityRef);
                
                if (communitySnap.exists()) {
                  return {
                    id: communitySnap.id,
                    ...communitySnap.data(),
                    membershipId: member.id,
                    role: member.role
                  };
                }
                console.log(`Community ${member.communityId} not found`);
                return null;
              } catch (error) {
                console.error(`Error fetching community ${member.communityId}:`, error);
                return null;
              }
            })
          );
          
          const validCommunities = communitiesData.filter(Boolean);
          console.log("Valid user communities:", validCommunities.length);
          setUserCommunities(validCommunities);
        }, error => {
          console.error("Error in userCommunities snapshot:", error);
        });
      } catch (error) {
        console.error("Error fetching user communities:", error);
      }
    };
    
    fetchUserCommunities();
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Fetch notifications related to communities
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    
    let unsubscribe = () => {};
    
    const fetchNotifications = async () => {
      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef, 
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            read: doc.data().read || false
          }));
          setNotifications(notificationsData);
        }, error => {
          console.error("Error in notifications snapshot:", error);
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Create a new community
  const createCommunity = async (communityData) => {
    if (!currentUser) return null;
    
    try {
      // Add the community to Firestore
      const newCommunity = {
        ...communityData,
        createdBy: currentUser.uid,
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const communityRef = await addDoc(collection(db, 'communities'), newCommunity);
      console.log("Created new community:", communityRef.id);
      
      // Add the creator as a member and admin
      await addDoc(collection(db, 'communityMembers'), {
        communityId: communityRef.id,
        userId: currentUser.uid,
        role: 'admin',
        joinedAt: serverTimestamp()
      });
      
      return communityRef.id;
    } catch (error) {
      console.error('Error creating community:', error);
      return null;
    }
  };
  
  // Join a community
  const joinCommunity = async (communityId, e) => {
    // Prevent default browser behavior if this is called from an event handler
    if (e && e.preventDefault) e.preventDefault();
    
    if (!currentUser) {
      console.log("No user logged in to join community");
      return false;
    }
    
    try {
      console.log(`Attempting to join community: ${communityId} for user: ${currentUser.uid}`);
      
      // Check if already a member
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef, 
        where('communityId', '==', communityId),
        where('userId', '==', currentUser.uid)
      );
      
      const memberSnap = await getDocs(q);
      
      if (!memberSnap.empty) {
        console.log("User is already a member of this community");
        return true; // Already a member, consider this a success
      }
      
      // Add as a member
      const membershipDoc = await addDoc(collection(db, 'communityMembers'), {
        communityId: communityId,
        userId: currentUser.uid,
        role: 'member',
        joinedAt: serverTimestamp()
      });
      
      console.log("Added membership:", membershipDoc.id);
      
      // Update member count
      const communityRef = doc(db, 'communities', communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (communitySnap.exists()) {
        await updateDoc(communityRef, {
          memberCount: increment(1),
          updatedAt: serverTimestamp()
        });
        console.log("Updated community member count");
      }
      
      // Optimistically update the UI
      setCommunities(prevCommunities => 
        prevCommunities.map(community => 
          community.id === communityId 
            ? { ...community, memberCount: (community.memberCount || 0) + 1 } 
            : community
        )
      );
      
      // Add this community to userCommunities (optimistic update)
      const communityData = communities.find(c => c.id === communityId);
      if (communityData) {
        setUserCommunities(prev => [
          ...prev, 
          {
            ...communityData,
            membershipId: membershipDoc.id,
            role: 'member'
          }
        ]);
      }
      
      return true;
    } catch (error) {
      console.error('Error joining community:', error);
      return false;
    }
  };
  
  // Leave a community
  const leaveCommunity = async (communityId, e) => {
    // Prevent default browser behavior if this is called from an event handler
    if (e && e.preventDefault) e.preventDefault();
    
    if (!currentUser) return false;
    
    try {
      console.log(`Attempting to leave community: ${communityId}`);
      
      // Find membership document
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef, 
        where('communityId', '==', communityId),
        where('userId', '==', currentUser.uid)
      );
      
      const memberSnap = await getDocs(q);
      if (memberSnap.empty) {
        console.log("User is not a member of this community");
        return false; // Not a member
      }
      
      // Check if last admin
      const memberData = memberSnap.docs[0].data();
      if (memberData.role === 'admin') {
        // Check if there are other admins
        const adminsQuery = query(
          membersRef,
          where('communityId', '==', communityId),
          where('role', '==', 'admin')
        );
        
        const adminsSnap = await getDocs(adminsQuery);
        if (adminsSnap.size <= 1) {
          console.log("Cannot leave as last admin");
          // Last admin can't leave unless they assign a new admin or delete the community
          return false;
        }
      }
      
      // Remove membership
      await deleteDoc(memberSnap.docs[0].ref);
      console.log("Removed membership document");
      
      // Update member count
      const communityRef = doc(db, 'communities', communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (communitySnap.exists()) {
        await updateDoc(communityRef, {
          memberCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        console.log("Updated community member count");
      }
      
      // Optimistically update the UI
      setCommunities(prevCommunities => 
        prevCommunities.map(community => 
          community.id === communityId 
            ? { ...community, memberCount: Math.max((community.memberCount || 1) - 1, 0) } 
            : community
        )
      );
      
      // Remove from user communities
      setUserCommunities(prevUserCommunities => 
        prevUserCommunities.filter(community => community.id !== communityId)
      );
      
      return true;
    } catch (error) {
      console.error('Error leaving community:', error);
      return false;
    }
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!currentUser) return;
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Send a chat message
  const sendChatMessage = async (communityId, message) => {
    if (!currentUser) return false;
    
    try {
      // Use flat collection structure for chat messages
      await addDoc(collection(db, 'chatMessages'), {
        communityId,
        content: message,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userPhotoURL: currentUser.photoURL || null,
        createdAt: serverTimestamp()
      });
      
      // Update community last activity
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending chat message:', error);
      return false;
    }
  };
  
  // Create a community post
  const createPost = async (communityId, content) => {
    if (!currentUser) return null;
    
    try {
      const postRef = await addDoc(collection(db, 'communityPosts'), {
        communityId,
        content,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update post count in community
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        postCount: increment(1),
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return postRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  };

  // Delete a community (can only be performed by an admin)
  const deleteCommunity = async (communityId, e) => {
    // Prevent default browser behavior if this is called from an event handler
    if (e && e.preventDefault) e.preventDefault();
    
    if (!currentUser) return false;
    
    try {
      console.log(`Attempting to delete community: ${communityId}`);
      
      // Check if user is an admin of this community
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef, 
        where('communityId', '==', communityId),
        where('userId', '==', currentUser.uid),
        where('role', '==', 'admin')
      );
      
      const memberSnap = await getDocs(q);
      if (memberSnap.empty) {
        console.log("User is not an admin of this community");
        return false; // Not an admin, can't delete
      }
      
      // Delete all community members
      const allMembersQuery = query(
        membersRef,
        where('communityId', '==', communityId)
      );
      
      const allMembersSnap = await getDocs(allMembersQuery);
      const deleteMemberPromises = allMembersSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMemberPromises);
      console.log(`Deleted ${allMembersSnap.size} community members`);
      
      // Delete all community posts
      const postsRef = collection(db, 'communityPosts');
      const postsQuery = query(postsRef, where('communityId', '==', communityId));
      const postsSnap = await getDocs(postsQuery);
      const deletePostPromises = postsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePostPromises);
      console.log(`Deleted ${postsSnap.size} community posts`);
      
      // Delete all chat messages
      const chatRef = collection(db, 'chatMessages');
      const chatQuery = query(chatRef, where('communityId', '==', communityId));
      const chatSnap = await getDocs(chatQuery);
      const deleteChatPromises = chatSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteChatPromises);
      console.log(`Deleted ${chatSnap.size} chat messages`);
      
      // Finally, delete the community itself
      const communityRef = doc(db, 'communities', communityId);
      await deleteDoc(communityRef);
      console.log("Deleted community document");
      
      // Optimistically update the UI
      setCommunities(prevCommunities => 
        prevCommunities.filter(community => community.id !== communityId)
      );
      
      // Remove from user communities
      setUserCommunities(prevUserCommunities => 
        prevUserCommunities.filter(community => community.id !== communityId)
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting community:', error);
      return false;
    }
  };
  
  // Get predefined groups
  const getPredefinedGroups = () => {
    return [
      {
        id: 'mindfulness',
        name: 'Mindfulness Practitioners',
        description: 'Share and learn mindfulness techniques to stay present and reduce anxiety.',
        imageUrl: '/images/mindfulness.jpg',
        tags: ['meditation', 'presence', 'awareness'],
        isPredefined: true
      },
      {
        id: 'stress-management',
        name: 'Stress Management',
        description: 'Strategies and support for managing daily stress and building resilience.',
        imageUrl: '/images/stress.jpg',
        tags: ['coping', 'relaxation', 'work-life balance'],
        isPredefined: true
      },
      {
        id: 'sleep-improvement',
        name: 'Sleep Improvement',
        description: 'Tips and discussions about improving sleep quality and establishing healthy sleep routines.',
        imageUrl: '/images/sleep.jpg',
        tags: ['insomnia', 'rest', 'circadian rhythm'],
        isPredefined: true
      },
      {
        id: 'mood-boosters',
        name: 'Mood Boosters',
        description: 'Activities, techniques and support for elevating mood and fighting depression.',
        imageUrl: '/images/mood.jpg',
        tags: ['positivity', 'joy', 'emotional wellbeing'],
        isPredefined: true
      },
      {
        id: 'daily-gratitude',
        name: 'Daily Gratitude',
        description: 'Practice gratitude together and share what you\'re thankful for each day.',
        imageUrl: '/images/gratitude.jpg',
        tags: ['thankfulness', 'appreciation', 'positive psychology'],
        isPredefined: true
      }
    ];
  };
  
  const value = {
    communities,
    userCommunities,
    notifications,
    loading,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteCommunity,
    sendChatMessage,
    createPost,
    getPredefinedGroups
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};