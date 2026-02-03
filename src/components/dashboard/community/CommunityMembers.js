import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const CommunityMembers = ({ communityId, isAdmin, actualMemberCount }) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'admin', 'member'
  
  // Fetch community members
  useEffect(() => {
    if (!communityId) return;
    
    let isMounted = true;
    
    const membersRef = collection(db, 'communityMembers');
    const q = query(
      membersRef,
      where('communityId', '==', communityId),
      orderBy('joinedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!isMounted) return;
      
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate() // Convert Firestore timestamp to Date
      }));
      
      // Fetch user details for each member
      try {
        const membersWithDetails = await Promise.all(
          membersData.map(async (member) => {
            try {
              const userRef = doc(db, 'users', member.userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                return {
                  ...member,
                  userData: {
                    id: userSnap.id,
                    ...userSnap.data()
                  }
                };
              }
              
              return {
                ...member,
                userData: {
                  displayName: 'Anonymous User',
                  photoURL: null
                }
              };
            } catch (error) {
              console.error('Error fetching user data:', error);
              return {
                ...member,
                userData: {
                  displayName: 'Anonymous User',
                  photoURL: null
                }
              };
            }
          })
        );
        
        if (isMounted) {
          setMembers(membersWithDetails);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error processing members data:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Error in members listener:', error);
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [communityId]);
  
  // Filter members based on search and role
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      (member.userData?.displayName || 'Anonymous User')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
        
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    
    return matchesSearch && matchesRole;
  });
  
  // Change member role (admin only)
  const changeMemberRole = async (memberId, newRole) => {
    if (!isAdmin) return;
    
    try {
      const memberRef = doc(db, 'communityMembers', memberId);
      await updateDoc(memberRef, {
        role: newRole
      });
    } catch (error) {
      console.error('Error changing member role:', error);
    }
  };
  
  // Remove member from community (admin only)
  const removeMember = async (memberId, userId) => {
    if (!isAdmin) return;
    
    try {
      // Get confirmation first
      if (!window.confirm('Are you sure you want to remove this member?')) {
        return;
      }
      
      const memberRef = doc(db, 'communityMembers', memberId);
      await deleteDoc(memberRef);
      
      // We no longer need to update the memberCount directly here
      // The realtime listener in CommunityDetail will handle the count update
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };
  
  // Format join date
  const formatJoinDate = (date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
        <p className={`mt-4 ${theme.text}`}>Loading members...</p>
      </div>
    );
  }
  
  // Use actualMemberCount if provided, otherwise use members.length
  const displayedMemberCount = typeof actualMemberCount !== 'undefined' ? actualMemberCount : members.length;
  
  return (
    <div className={`${theme.card} rounded-xl border ${theme.border} p-5`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent`}>
          Community Members
        </h3>
        <div className={`text-sm ${theme.textMuted}`}>
          {displayedMemberCount} {displayedMemberCount === 1 ? 'member' : 'members'}
        </div>
      </div>
      
      <div className="filters mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="search-box flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${theme.inputBorder} ${theme.input} rounded-lg`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="role-filter">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={`px-4 py-2 border ${theme.inputBorder} ${theme.input} rounded-lg`}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
          </select>
        </div>
      </div>
      
      <div className="members-list space-y-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map(member => (
            <div 
              key={member.id} 
              className={`${theme.cardAlt} rounded-lg p-4 flex justify-between items-center`}
            >
              <div className="member-info flex items-center gap-3">
                <div className="member-avatar w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  {member.userData?.photoURL ? (
                    <img 
                      src={member.userData.photoURL} 
                      alt={member.userData.displayName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium">
                      {(member.userData?.displayName || 'A')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className={`font-medium ${theme.text}`}>
                    {member.userData?.displayName || 'Anonymous User'}
                    {member.userId === currentUser?.uid && 
                      <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    }
                  </div>
                  
                  <div className="text-sm text-gray-500 flex flex-wrap gap-x-4">
                    <span className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        member.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                      }`}></span>
                      <span className="capitalize">{member.role}</span>
                    </span>
                    <span>Joined {formatJoinDate(member.joinedAt)}</span>
                  </div>
                </div>
              </div>
              
              {isAdmin && member.userId !== currentUser?.uid && (
                <div className="member-actions relative">
                  <div className="dropdown inline-block relative">
                    <button
                      className={`p-2 rounded-full ${theme.buttonSecondary} hover:bg-gray-200 dark:hover:bg-gray-700`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                      </svg>
                    </button>
                    <div className={`dropdown-menu absolute right-0 mt-2 w-48 ${theme.card} rounded-md shadow-lg z-10 border ${theme.border} hidden group-hover:block`}>
                      <div className="py-1">
                        {member.role !== 'admin' && (
                          <button
                            onClick={() => changeMemberRole(member.id, 'admin')}
                            className={`block w-full text-left px-4 py-2 text-sm ${theme.text} hover:bg-gray-100 dark:hover:bg-gray-700`}
                          >
                            Make Admin
                          </button>
                        )}
                        {member.role === 'admin' && (
                          <button
                            onClick={() => changeMemberRole(member.id, 'member')}
                            className={`block w-full text-left px-4 py-2 text-sm ${theme.text} hover:bg-gray-100 dark:hover:bg-gray-700`}
                          >
                            Remove Admin
                          </button>
                        )}
                        <button
                          onClick={() => removeMember(member.id, member.userId)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Remove from Community
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className={`w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3`}>
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <p className={theme.textMuted}>
              No members found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMembers;