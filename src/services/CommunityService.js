import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    arrayUnion,
    arrayRemove,
    serverTimestamp, 
    onSnapshot 
  } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  class CommunityService {
    // Create a new community group
    static async createGroup(groupData, userId) {
      try {
        const groupRef = await addDoc(collection(db, 'community_groups'), {
          ...groupData,
          createdBy: userId,
          members: [userId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Also update user's joinedGroups
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          joinedGroups: arrayUnion(groupRef.id)
        });
        
        return groupRef.id;
      } catch (error) {
        console.error('Error creating community group:', error);
        throw error;
      }
    }
    
    // Get all community groups
    static async getGroups() {
      try {
        const groupsQuery = query(collection(db, 'community_groups'), orderBy('createdAt', 'desc'));
        const groupsSnapshot = await getDocs(groupsQuery);
        
        return groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting community groups:', error);
        throw error;
      }
    }
    
    // Set up real-time listener for community groups
    static listenToGroups(callback) {
      try {
        const groupsQuery = query(collection(db, 'community_groups'), orderBy('createdAt', 'desc'));
        
        return onSnapshot(groupsQuery, (snapshot) => {
          const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps to regular dates
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          }));
          
          callback(groups);
        });
      } catch (error) {
        console.error('Error setting up groups listener:', error);
        throw error;
      }
    }
    
    // Join a community group
    static async joinGroup(groupId, userId) {
      try {
        // Update group's members array
        const groupRef = doc(db, 'community_groups', groupId);
        await updateDoc(groupRef, {
          members: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        
        // Update user's joinedGroups array
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          joinedGroups: arrayUnion(groupId)
        });
        
        return true;
      } catch (error) {
        console.error('Error joining community group:', error);
        throw error;
      }
    }
    
    // Leave a community group
    static async leaveGroup(groupId, userId) {
      try {
        // Update group's members array
        const groupRef = doc(db, 'community_groups', groupId);
        await updateDoc(groupRef, {
          members: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        
        // Update user's joinedGroups array
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          joinedGroups: arrayRemove(groupId)
        });
        
        return true;
      } catch (error) {
        console.error('Error leaving community group:', error);
        throw error;
      }
    }
    
    // Create a new post
    static async createPost(postData, userId) {
      try {
        const post = {
          ...postData,
          userId,
          likes: [],
          commentCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const postRef = await addDoc(collection(db, 'community_posts'), post);
        return postRef.id;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
    }
    
    // Get posts for a specific group
    static async getGroupPosts(groupId) {
      try {
        const postsQuery = query(
          collection(db, 'community_posts'),
          where('groupId', '==', groupId),
          orderBy('createdAt', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        return postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting group posts:', error);
        throw error;
      }
    }
    
    // Set up real-time listener for posts
    static listenToPosts(groupId, callback) {
      try {
        const postsQuery = groupId 
          ? query(
              collection(db, 'community_posts'),
              where('groupId', '==', groupId),
              orderBy('createdAt', 'desc')
            )
          : query(
              collection(db, 'community_posts'),
              orderBy('createdAt', 'desc'),
              limit(50)
            );
        
        return onSnapshot(postsQuery, (snapshot) => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps to regular dates
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          }));
          
          callback(posts);
        });
      } catch (error) {
        console.error('Error setting up posts listener:', error);
        throw error;
      }
    }
    
    // Like a post
    static async likePost(postId, userId) {
      try {
        const postRef = doc(db, 'community_posts', postId);
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        
        return true;
      } catch (error) {
        console.error('Error liking post:', error);
        throw error;
      }
    }
    
    // Unlike a post
    static async unlikePost(postId, userId) {
      try {
        const postRef = doc(db, 'community_posts', postId);
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        
        return true;
      } catch (error) {
        console.error('Error unliking post:', error);
        throw error;
      }
    }
    
    // Add a comment to a post
    static async addComment(postId, comment, userId) {
      try {
        // Add comment to comments collection
        const commentData = {
          postId,
          userId,
          text: comment,
          likes: [],
          createdAt: serverTimestamp()
        };
        
        const commentRef = await addDoc(collection(db, 'community_comments'), commentData);
        
        // Update post's comment count
        const postRef = doc(db, 'community_posts', postId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          await updateDoc(postRef, {
            commentCount: (postDoc.data().commentCount || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
        
        return commentRef.id;
      } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
      }
    }
    
    // Get comments for a post
    static async getPostComments(postId) {
      try {
        const commentsQuery = query(
          collection(db, 'community_comments'),
          where('postId', '==', postId),
          orderBy('createdAt', 'asc')
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        
        return commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting post comments:', error);
        throw error;
      }
    }
    
    // Set up real-time listener for post comments
    static listenToComments(postId, callback) {
      try {
        const commentsQuery = query(
          collection(db, 'community_comments'),
          where('postId', '==', postId),
          orderBy('createdAt', 'asc')
        );
        
        return onSnapshot(commentsQuery, async (snapshot) => {
          const comments = [];
          
          for (const docSnapshot of snapshot.docs) {
            const commentData = {
              id: docSnapshot.id,
              ...docSnapshot.data(),
              createdAt: docSnapshot.data().createdAt?.toDate() || new Date()
            };
            
            // Get user info for each comment
            try {
              const userDoc = await getDoc(doc(db, 'users', commentData.userId));
              if (userDoc.exists()) {
                commentData.user = {
                  displayName: userDoc.data().displayName || 'User',
                  photoURL: userDoc.data().photoURL || null
                };
              }
            } catch (err) {
              console.error('Error fetching user for comment:', err);
              commentData.user = { displayName: 'User', photoURL: null };
            }
            
            comments.push(commentData);
          }
          
          callback(comments);
        });
      } catch (error) {
        console.error('Error setting up comments listener:', error);
        throw error;
      }
    }
    
    // Get user information for multiple users
    static async getUsersInfo(userIds) {
      try {
        const users = {};
        
        for (const userId of userIds) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          
          if (userDoc.exists()) {
            users[userId] = {
              displayName: userDoc.data().displayName || 'User',
              photoURL: userDoc.data().photoURL || null
            };
          }
        }
        
        return users;
      } catch (error) {
        console.error('Error getting users info:', error);
        throw error;
      }
    }
  }
  
  export default CommunityService;