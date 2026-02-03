import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MemberCard = ({ member, isAdmin, onChangeRole, onRemoveMember }) => {
  const [showActions, setShowActions] = useState(false);
  
  // Format join date
  const formatJoinDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  };
  
  return (
    <div className="member-card bg-gray-50 rounded-lg p-4 flex justify-between items-center">
      <div className="member-info flex items-center gap-3">
        <div className="member-avatar w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          {member.userData?.photoURL ? (
            <img 
              src={member.userData.photoURL} 
              alt={member.userData.displayName || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-700 font-medium">
              {(member.userData?.displayName || 'A')[0].toUpperCase()}
            </div>
          )}
        </div>
        
        <div>
          <Link 
            to={`/dashboard/profile/${member.userId}`}
            className="font-medium hover:text-purple-700"
          >
            {member.userData?.displayName || 'Anonymous User'}
          </Link>
          
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
      
      {isAdmin && member.role !== 'admin' && (
        <div className="member-actions relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            ⋮
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                <button
                  onClick={() => {
                    onChangeRole(member.id, 'admin');
                    setShowActions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Make Admin
                </button>
                <button
                  onClick={() => {
                    onRemoveMember(member.id, member.userId);
                    setShowActions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Remove from Community
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberCard;