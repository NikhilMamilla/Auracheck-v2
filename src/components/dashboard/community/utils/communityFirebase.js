import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    increment
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage } from '../../../firebase';
  
  // Get a community by ID
  export const getCommunityById = async (communityId) => {
    try {
      const communityRef = doc(db, 'communities', communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (communitySnap.exists()) {
        return {
          id: communitySnap.id,
          ...communitySnap.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting community:', error);
      throw error;
    }
  };
  
  // Get all communities
  export const getAllCommunities = async () => {
    try {
      const communitiesRef = collection(db, 'communities');
      const q = query(communitiesRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting communities:', error);
      throw error;
    }
  };
  
  // Get communities for a user
  export const getUserCommunities = async (userId) => {
    try {
      const membershipsRef = collection(db, 'communityMembers');
      const q = query(membershipsRef, where('userId', '==', userId));
      
      const membershipSnapshot = await getDocs(q);
      
      const memberships = membershipSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get the full community details for each membership
      const communities = await Promise.all(
        memberships.map(async (membership) => {
          const community = await getCommunityById(membership.communityId);
          if (community) {
            return {
              ...community,
              membershipId: membership.id,
              role: membership.role
            };
          }
          return null;
        })
      );
      
      return communities.filter(Boolean);
    } catch (error) {
      console.error('Error getting user communities:', error);
      throw error;
    }
  };
  
  // Create a new community
  export const createCommunity = async (userId, communityData) => {
    try {
      // Create the community document
      const newCommunity = {
        name: communityData.name,
        description: communityData.description,
        tags: communityData.tags || [],
        rules: communityData.rules || [],
        isPublic: communityData.isPublic !== false, // default to true
        imageUrl: communityData.imageUrl || null,
        bannerUrl: communityData.bannerUrl || null,
        createdBy: userId,
        memberCount: 1, // Creator is the first member
        postCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const communityRef = await addDoc(collection(db, 'communities'), newCommunity);
      
      // Add creator as admin
      await addDoc(collection(db, 'communityMembers'), {
        communityId: communityRef.id,
        userId: userId,
        role: 'admin',
        joinedAt: serverTimestamp()
      });
      
      return communityRef.id;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  };
  
  // Update community details
  export const updateCommunity = async (communityId, updateData) => {
    try {
      const communityRef = doc(db, 'communities', communityId);
      
      await updateDoc(communityRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  };
  
  // Upload community image
  export const uploadCommunityImage = async (file, communityId, isProfile = true) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `communities/${communityId}/${isProfile ? 'profile' : 'banner'}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the community with the new image URL
      const updateField = isProfile ? { imageUrl: downloadURL } : { bannerUrl: downloadURL };
      await updateCommunity(communityId, updateField);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading community image:', error);
      throw error;
    }
  };
  
  // Join a community
  export const joinCommunity = async (communityId, userId) => {
    try {
      // Check if already a member
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef,
        where('communityId', '==', communityId),
        where('userId', '==', userId)
      );
      
      const memberSnap = await getDocs(q);
      
      if (!memberSnap.empty) {
        // Already a member
        return false;
      }
      
      // Add user as a member
      await addDoc(collection(db, 'communityMembers'), {
        communityId,
        userId,
        role: 'member',
        joinedAt: serverTimestamp()
      });
      
      // Update member count
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Get user data for notifications
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists() ? userSnap.data().displayName || 'New Member' : 'New Member';
      
      // Notify admins about new member
      const adminsQuery = query(
        membersRef,
        where('communityId', '==', communityId),
        where('role', '==', 'admin')
      );
      
      const adminsSnap = await getDocs(adminsQuery);
      const communitySnap = await getDoc(communityRef);
      const communityName = communitySnap.exists() ? communitySnap.data().name : 'Community';
      
      // Create notifications for all admins
      adminsSnap.forEach(async (adminDoc) => {
        const adminId = adminDoc.data().userId;
        
        // Don't notify self
        if (adminId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: adminId,
            type: 'newMember',
            communityId,
            communityName,
            actorId: userId,
            actorName: userName,
            read: false,
            link: `/dashboard/community/${communityId}/members`,
            createdAt: serverTimestamp()
          });
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  };
  
  // Leave a community
  export const leaveCommunity = async (communityId, userId) => {
    try {
      // Find membership
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef,
        where('communityId', '==', communityId),
        where('userId', '==', userId)
      );
      
      const memberSnap = await getDocs(q);
      
      if (memberSnap.empty) {
        // Not a member
        return false;
      }
      
      const memberDoc = memberSnap.docs[0];
      const role = memberDoc.data().role;
      
      // If admin, check if there are other admins
      if (role === 'admin') {
        const adminsQuery = query(
          membersRef,
          where('communityId', '==', communityId),
          where('role', '==', 'admin')
        );
        
        const adminsSnap = await getDocs(adminsQuery);
        
        if (adminsSnap.size <= 1) {
          // Last admin can't leave unless they assign a new admin
          return false;
        }
      }
      
      // Remove membership
      await deleteDoc(memberDoc.ref);
      
      // Update member count
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  };
  
  // Get community members
  export const getCommunityMembers = async (communityId) => {
    try {
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef,
        where('communityId', '==', communityId),
        orderBy('joinedAt', 'desc')
      );
      
      const memberSnap = await getDocs(q);
      
      const members = memberSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get user details for each member
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const userRef = doc(db, 'users', member.userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            return {
              ...member,
              user: {
                id: userSnap.id,
                ...userSnap.data()
              }
            };
          }
          
          return member;
        })
      );
      
      return membersWithDetails;
    } catch (error) {
      console.error('Error getting community members:', error);
      throw error;
    }
  };

  // Delete community post
export const deleteCommunityPost = async (postId) => {
    try {
      // Get the post data first (to update community stats)
      const postRef = doc(db, 'communityPosts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        return false;
      }
      
      const postData = postSnap.data();
      
      // Delete the post
      await deleteDoc(postRef);
      
      // Update community stats
      const communityRef = doc(db, 'communities', postData.communityId);
      await updateDoc(communityRef, {
        postCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting community post:', error);
      throw error;
    }
  };
  
  // Change member role
  export const changeMemberRole = async (membershipId, newRole) => {
    try {
      const memberRef = doc(db, 'communityMembers', membershipId);
      
      await updateDoc(memberRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Get membership details for notification
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        
        // Notify the user about role change
        const communityRef = doc(db, 'communities', memberData.communityId);
        const communitySnap = await getDoc(communityRef);
        
        if (communitySnap.exists()) {
          await addDoc(collection(db, 'notifications'), {
            userId: memberData.userId,
            type: 'roleChange',
            communityId: memberData.communityId,
            communityName: communitySnap.data().name,
            role: newRole,
            read: false,
            link: `/dashboard/community/${memberData.communityId}`,
            createdAt: serverTimestamp()
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error changing member role:', error);
      throw error;
    }
  };
  
  // Get community posts
  export const getCommunityPosts = async (communityId, limit = 20) => {
    try {
      const postsRef = collection(db, 'communityPosts');
      const q = query(
        postsRef,
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const postsSnap = await getDocs(q);
      
      return postsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting community posts:', error);
      throw error;
    }
  };
  
  // Create community post
  export const createCommunityPost = async (communityId, userId, content, images = []) => {
    try {
      // Get user info
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists() ? userSnap.data().displayName || 'Anonymous' : 'Anonymous';
      const userPhoto = userSnap.exists() ? userSnap.data().photoURL || null : null;
      
      // Create post
      const postRef = await addDoc(collection(db, 'communityPosts'), {
        communityId,
        authorId: userId,
        authorName: userName,
        authorPhoto: userPhoto,
        content,
        images,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update community stats
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        postCount: increment(1),
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create notifications for community members
      const membersRef = collection(db, 'communityMembers');
      const q = query(
        membersRef,
        where('communityId', '==', communityId),
        where('userId', '!=', userId) // Don't notify the author
      );
      
      const membersSnap = await getDocs(q);
      const communitySnap = await getDoc(communityRef);
      const communityName = communitySnap.exists() ? communitySnap.data().name : 'Community';
      
      // Create notifications (batch for efficiency in a real app)
      membersSnap.forEach(async (memberDoc) => {
        const memberId = memberDoc.data().userId;
        
        await addDoc(collection(db, 'notifications'), {
          userId: memberId,
          type: 'newPost',
          communityId,
          communityName,
          postId: postRef.id,
          actorId: userId,
          actorName: userName,
          postTitle: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          read: false,
          link: `/dashboard/community/${communityId}/post/${postRef.id}`,
          createdAt: serverTimestamp()
        });
      });
      
      return postRef.id;
    } catch (error) {
      console.error('Error creating community post:', error);
      throw error;
    }
  };
  
  // Get community chat messages
  export const getCommunityChat = async (communityId, limitCount = 100) => {
    try {
      const messagesRef = collection(db, 'communityChats', communityId, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const messagesSnap = await getDocs(q);
      
      // Return in chronological order
      return messagesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .reverse();
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  };
  
  // Send chat message
  export const sendChatMessage = async (communityId, userId, message) => {
    try {
      // Get user info
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists() ? userSnap.data().displayName || 'Anonymous' : 'Anonymous';
      const userPhoto = userSnap.exists() ? userSnap.data().photoURL || null : null;
      
      // Send message
      await addDoc(collection(db, 'communityChats', communityId, 'messages'), {
        userId,
        userName,
        userPhoto,
        content: message,
        createdAt: serverTimestamp()
      });
      
      // Update community last activity
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  };
  
  // Mark notification as read
  export const markNotificationRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };
  
  // Get user notifications
  export const getUserNotifications = async (userId, limit = 50) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const notificationsSnap = await getDocs(q);
      
      return notificationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  };

