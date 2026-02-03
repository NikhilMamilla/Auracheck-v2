import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useCommunity } from './CommunityContext';

const CommunityChat = ({ communityId, membership }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { sendChatMessage } = useCommunity();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(Math.floor(Math.random() * 5) + 3); // Mock value
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch chat messages - Using flat collection structure
  useEffect(() => {
    if (!communityId) return;
    
    let unsubscribe = () => {};
    
    const fetchMessages = async () => {
      try {
        console.log(`Fetching chat messages for community: ${communityId}`);
        
        // Use a flat collection with filter instead of nested subcollections
        const messagesRef = collection(db, 'chatMessages');
        const q = query(
          messagesRef, 
          where('communityId', '==', communityId),
          orderBy('createdAt', 'asc'), 
          limit(100)
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() // Convert Firestore timestamp to Date
          }));
          console.log(`Fetched ${messagesData.length} chat messages`);
          setMessages(messagesData);
          setLoading(false);
          
          // Scroll to bottom on new messages
          setTimeout(scrollToBottom, 100);
        }, error => {
          console.error("Error in messages snapshot:", error);
          setError(`Error loading messages: ${error.message}`);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error fetching chat messages:', err);
        setError(`Failed to load chat messages: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    return () => unsubscribe();
  }, [communityId]);
  
  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !membership) return;
    
    try {
      console.log(`Sending message to community: ${communityId}`);
      const success = await sendChatMessage(communityId, newMessage.trim());
      
      if (success) {
        // Clear the input
        setNewMessage('');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message}`);
    }
  };
  
  // Format timestamp for messages
  const formatMessageTime = (date) => {
    if (!date) return '';
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Group messages by day
  const groupMessagesByDay = () => {
    const groups = {};
    
    messages.forEach(message => {
      if (!message.createdAt) return;
      
      const day = message.createdAt.toLocaleDateString();
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(message);
    });
    
    return groups;
  };
  
  // Check if the message is from the current user
  const isCurrentUser = (userId) => {
    return currentUser && userId === currentUser.uid;
  };
  
  if (loading) {
    return (
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
        <p className={`mt-4 ${theme.text}`}>Loading chat...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!membership) {
    return (
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6 text-center`}>
        <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full inline-flex">
          <svg className="w-8 h-8 text-yellow-700 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className={`text-lg font-medium ${theme.text}`}>Join to Access Chat</h3>
        <p className={`${theme.textMuted} mt-2 mb-4`}>You need to join this community to participate in the live chat</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Join Community
        </button>
      </div>
    );
  }
  
  const messageGroups = groupMessagesByDay();
  
  return (
    <div className={`chat-container ${theme.card} rounded-xl border ${theme.border} flex flex-col h-[70vh]`}>
      {/* Chat header */}
      <div className={`chat-header p-4 border-b ${theme.border} flex justify-between items-center`}>
        <h3 className={`font-medium ${theme.text}`}>Community Chat</h3>
        <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          {onlineUsers} online
        </div>
      </div>
      
      {/* Chat messages */}
      <div 
        ref={chatContainerRef}
        className="chat-messages flex-1 overflow-y-auto p-4 space-y-4"
      >
        {Object.keys(messageGroups).length > 0 ? (
          Object.keys(messageGroups).map(day => (
            <div key={day} className="message-group">
              <div className="day-divider flex items-center justify-center my-4">
                <div className={`h-px ${theme.border} flex-1`}></div>
                <span className={`px-3 text-xs ${theme.textMuted}`}>{day}</span>
                <div className={`h-px ${theme.border} flex-1`}></div>
              </div>
              
              <div className="space-y-3">
                {messageGroups[day].map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${isCurrentUser(message.userId) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${
                        isCurrentUser(message.userId) 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {!isCurrentUser(message.userId) && (
                        <div className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {message.userName || 'Anonymous'}
                        </div>
                      )}
                      <p className="whitespace-pre-line">{message.content}</p>
                      <div className="text-xs text-right mt-1 opacity-75">
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className={`${theme.textMuted} mb-2`}>
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <p className={`${theme.textMuted}`}>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input */}
      <div className={`chat-input border-t ${theme.border} p-4`}>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 border ${theme.inputBorder} ${theme.input} rounded-lg px-4 py-2`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChat;