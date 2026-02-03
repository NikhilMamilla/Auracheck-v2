import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserData } from '../../context/UserDataContext';
import { useTheme } from '../../context/ThemeContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const Profile = ({ userData }) => {
  const { currentUser, updateEmail, updatePassword } = useAuth();
  const { moodData, sleepData, stressData, journalEntries, updateUserData } = useUserData();
  const { theme, isDark } = useTheme();
  
  // Form state
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(userData?.profileImageUrl || '');
  const [birthdate, setBirthdate] = useState(userData?.birthdate || '');
  const [gender, setGender] = useState(userData?.gender || '');
  const [notificationPreferences, setNotificationPreferences] = useState(
    userData?.notificationPreferences || {
      email: true,
      moodReminders: true,
      weeklyReport: true,
      communityMessages: true
    }
  );
  const [wellnessGoals, setWellnessGoals] = useState(userData?.wellnessGoals || '');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalEntries: 0,
    moodEntries: 0,
    sleepEntries: 0,
    stressEntries: 0,
    journalEntries: 0,
    streakDays: 0,
    joinedDays: 0,
    entriesDistribution: [],
    weekdayActivity: [],
    mostActiveWeekday: '',
    completionRate: 0
  });
  
  // Calculate streak of consecutive days with entries
  const calculateStreak = () => {
    if (!moodData || moodData.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all dates with entries
    const datesWithEntries = moodData.map(entry => {
      const date = new Date(entry.timestamp);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });
    
    // Sort and remove duplicates
    const uniqueDates = [...new Set(datesWithEntries)].sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = today.getTime();
    
    // Check if there's an entry for today
    if (uniqueDates.includes(currentDate)) {
      streak = 1;
      
      // Check previous days
      let prevDate = new Date(today);
      while (true) {
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateTime = prevDate.getTime();
        
        if (uniqueDates.includes(prevDateTime)) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
  };
  
  // Calculate all stats
  const calculateStats = () => {
    // Get counts for each type of entry
    const moodCount = moodData?.length || 0;
    const sleepCount = sleepData?.length || 0;
    const stressCount = stressData?.length || 0;
    const journalCount = journalEntries?.length || 0;
    
    // Total entries
    const totalEntries = moodCount + sleepCount + stressCount + journalCount;
    
    // Calculate days since user joined
    const joinedTimestamp = userData?.createdAt?.toDate?.() || new Date();
    const now = new Date();
    const diffTime = Math.abs(now - joinedTimestamp);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate streak
    const streakDays = calculateStreak();
    
    // Calculate completion rate (percentage of days with at least one entry)
    const datesWithEntries = new Set();
    
    // Collect all unique dates with any entry
    const addDatesToSet = (entries) => {
      if (!entries) return;
      entries.forEach(entry => {
        const date = new Date(entry.timestamp);
        date.setHours(0, 0, 0, 0);
        datesWithEntries.add(date.getTime());
      });
    };
    
    addDatesToSet(moodData);
    addDatesToSet(sleepData);
    addDatesToSet(stressData);
    addDatesToSet(journalEntries);
    
    const daysWithEntries = datesWithEntries.size;
    const completionRate = diffDays > 0 ? Math.round((daysWithEntries / diffDays) * 100) : 0;
    
    // Calculate entries distribution for pie chart
    const entriesDistribution = [
      { name: 'Mood', value: moodCount, color: '#4F46E5' },
      { name: 'Sleep', value: sleepCount, color: '#8B5CF6' },
      { name: 'Stress', value: stressCount, color: '#EC4899' },
      { name: 'Journal', value: journalCount, color: '#10B981' }
    ];
    
    // Calculate weekday activity
    const weekdayActivity = [
      { name: 'Sunday', entries: 0 },
      { name: 'Monday', entries: 0 },
      { name: 'Tuesday', entries: 0 },
      { name: 'Wednesday', entries: 0 },
      { name: 'Thursday', entries: 0 },
      { name: 'Friday', entries: 0 },
      { name: 'Saturday', entries: 0 }
    ];
    
    // Helper function to count entries by weekday
    const countEntriesByWeekday = (entries) => {
      if (!entries) return;
      entries.forEach(entry => {
        const date = new Date(entry.timestamp);
        const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday
        weekdayActivity[weekday].entries += 1;
      });
    };
    
    countEntriesByWeekday(moodData);
    countEntriesByWeekday(sleepData);
    countEntriesByWeekday(stressData);
    countEntriesByWeekday(journalEntries);
    
    // Find most active weekday
    let maxEntries = 0;
    let mostActiveDay = 'None';
    
    weekdayActivity.forEach(day => {
      if (day.entries > maxEntries) {
        maxEntries = day.entries;
        mostActiveDay = day.name;
      }
    });
    
    setStats({
      totalEntries,
      moodEntries: moodCount,
      sleepEntries: sleepCount,
      stressEntries: stressCount,
      journalEntries: journalCount,
      streakDays,
      joinedDays: diffDays,
      entriesDistribution,
      weekdayActivity,
      mostActiveWeekday: mostActiveDay,
      completionRate
    });
  };
  
  // Effects
  useEffect(() => {
    // Set initial values when userData changes
    if (userData) {
      setDisplayName(userData.displayName || '');
      setBirthdate(userData.birthdate || '');
      setGender(userData.gender || '');
      setNotificationPreferences(userData.notificationPreferences || {
        email: true,
        moodReminders: true,
        weeklyReport: true,
        communityMessages: true
      });
      setWellnessGoals(userData.wellnessGoals || '');
      setProfileImage(userData.profileImageUrl || '');
    }
  }, [userData]);
  
  // Calculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [moodData, sleepData, stressData, journalEntries, userData]);
  
  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Update Firestore document
      await updateDoc(userDocRef, {
        displayName,
        birthdate,
        gender,
        notificationPreferences,
        wellnessGoals,
        lastUpdated: serverTimestamp()
      });
      
      // Update user data in context
      updateUserData({
        ...userData,
        displayName,
        birthdate,
        gender,
        notificationPreferences,
        wellnessGoals
      });
      
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: `Error updating profile: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };// Handle email update
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    if (!email) {
      setMessage({ type: 'error', text: 'Email is required' });
      setLoading(false);
      return;
    }
    
    try {
      // Update auth email
      await updateEmail(email);
      
      // Update Firestore document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        email,
        lastUpdated: serverTimestamp()
      });
      
      setMessage({
        type: 'success',
        text: 'Email updated successfully!'
      });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error updating email:', error);
      
      let errorMessage = 'Failed to update email';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log back in before changing your email';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    if (!password) {
      setMessage({ type: 'error', text: 'Password is required' });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }
    
    try {
      // Update auth password
      await updatePassword(password);
      
      setMessage({
        type: 'success',
        text: 'Password updated successfully!'
      });
      
      // Clear password fields
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      
      let errorMessage = 'Failed to update password';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log back in before changing your password';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Please choose a stronger password';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create storage reference
    const storageRef = ref(storage, `profile-images/${currentUser.uid}/${file.name}`);
    
    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        // Track upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        // Handle upload error
        console.error('Error uploading image:', error);
        setMessage({
          type: 'error',
          text: `Error uploading image: ${error.message}`
        });
        setIsUploading(false);
      },
      async () => {
        // On complete
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update Firestore document
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            profileImageUrl: downloadURL,
            lastUpdated: serverTimestamp()
          });
          
          // Update profile image state
          setProfileImage(downloadURL);
          
          // Update user data in context
          updateUserData({
            ...userData,
            profileImageUrl: downloadURL
          });
          
          setMessage({
            type: 'success',
            text: 'Profile image updated successfully!'
          });
          
          setTimeout(() => {
            setMessage({ type: '', text: '' });
          }, 5000);
          
        } catch (error) {
          console.error('Error updating profile image:', error);
          setMessage({
            type: 'error',
            text: `Error updating profile image: ${error.message}`
          });
        } finally {
          setIsUploading(false);
        }
      }
    );
  };
  
  // Handle notification preference change
  const handleNotificationChange = (key) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [key]: !notificationPreferences[key]
    });
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 ${theme.card} border ${theme.border} rounded-md shadow-md`}>
          <p className={`font-bold ${theme.textBold}`}>{payload[0].name}</p>
          <p className={theme.text}>
            <span className="font-medium">Entries:</span> {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Render UI
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Profile Header with Stats Cards */}
      <div className={`${theme.card} rounded-xl p-6 border ${theme.border} shadow-md mb-6 relative overflow-hidden`}>
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mr-0 md:mr-4 ring-4 ring-white dark:ring-gray-800 shadow-xl overflow-hidden">
              {profileImage || previewUrl ? (
                <img 
                  src={previewUrl || profileImage} 
                  alt={userData?.displayName || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="currentColor" className="text-gray-700 dark:text-gray-300" />
                  <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="currentColor" className="text-gray-700 dark:text-gray-300" />
                </svg>
              )}
            </div>
            
            {/* Upload overlay */}
            <div className="absolute bottom-0 right-0 h-6 w-6">
              <label htmlFor="upload-profile" className={`w-8 h-8 rounded-full ${theme.accent} ${theme.textReverse} shadow-md flex items-center justify-center cursor-pointer border-2 border-white dark:border-gray-800`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </label>
              <input 
                id="upload-profile" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
            
            {/* Upload progress indicator */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <div className="w-full h-full relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E0E0E0"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="6"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (uploadProgress / 100) * 283}
                      className="transform -rotate-90 origin-center"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {Math.round(uploadProgress)}%
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="text-center md:text-left">
            <h2 className={`text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden text-ellipsis`}>
              {userData?.displayName || 'User Profile'}
            </h2>
            <p className={`${theme.textMuted} text-sm`}>{currentUser?.email}</p>
            <div className={`mt-2 ${theme.textMuted} text-xs`}>
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Member since: {userData?.createdAt ? formatDate(userData.createdAt.toDate()) : 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Entry Stats Summary */}
          <div className="md:ml-auto mt-4 md:mt-0 flex flex-col md:items-end w-full md:w-auto">
            <div className="grid grid-cols-2 gap-2 md:flex md:space-x-4">
              <div className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 rounded-lg shadow-md">
                <div className="text-xs font-medium uppercase tracking-wide opacity-80">Total Entries</div>
                <div className="text-2xl font-bold">{stats.totalEntries}</div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-2 rounded-lg shadow-md">
                <div className="text-xs font-medium uppercase tracking-wide opacity-80">Current Streak</div>
                <div className="text-2xl font-bold flex justify-center items-center">
                  {stats.streakDays} {stats.streakDays > 0 && <span className="ml-1">🔥</span>}
                </div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg shadow-md">
                <div className="text-xs font-medium uppercase tracking-wide opacity-80">Completion</div>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 rounded-lg shadow-md">
                <div className="text-xs font-medium uppercase tracking-wide opacity-80">Days Active</div>
                <div className="text-2xl font-bold">{stats.joinedDays}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Section */}
      <div className={`${theme.card} rounded-xl p-6 border ${theme.border} shadow-md mb-6`}>
        <h2 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-4`}>
          Tracking Activity
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entry Type Distribution */}
          <div>
            <h3 className={`text-lg font-semibold ${theme.textBold} mb-3`}>
              Entry Type Distribution
            </h3>
            <div className="h-64">
              {stats.entriesDistribution.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.entriesDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.entriesDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={`${theme.text} text-center`}>No entries recorded yet</p>
                </div>
              )}
            </div>
            
            {/* Entry Type Counts */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className={`p-3 rounded-lg ${theme.background} border ${theme.border}`}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                  <span className={`${theme.text} text-sm font-medium`}>Mood Entries</span>
                </div>
                <div className={`${theme.textBold} text-lg font-bold`}>{stats.moodEntries}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme.background} border ${theme.border}`}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className={`${theme.text} text-sm font-medium`}>Sleep Entries</span>
                </div>
                <div className={`${theme.textBold} text-lg font-bold`}>{stats.sleepEntries}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme.background} border ${theme.border}`}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                  <span className={`${theme.text} text-sm font-medium`}>Stress Entries</span>
                </div>
                <div className={`${theme.textBold} text-lg font-bold`}>{stats.stressEntries}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme.background} border ${theme.border}`}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className={`${theme.text} text-sm font-medium`}>Journal Entries</span>
                </div>
                <div className={`${theme.textBold} text-lg font-bold`}>{stats.journalEntries}</div>
              </div>
            </div>
          </div>{/* Weekday Activity */}
          <div>
            <h3 className={`text-lg font-semibold ${theme.textBold} mb-3`}>
              Weekday Activity
            </h3>
            <div className="h-64">
              {stats.weekdayActivity.some(day => day.entries > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.weekdayActivity}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDark ? '#e5e7eb' : '#374151' }}
                      tickLine={{ stroke: isDark ? '#e5e7eb' : '#374151' }}
                    />
                    <YAxis 
                      tick={{ fill: isDark ? '#e5e7eb' : '#374151' }}
                      tickLine={{ stroke: isDark ? '#e5e7eb' : '#374151' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="entries" fill="#6366F1">
                      {stats.weekdayActivity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === stats.mostActiveWeekday ? '#4F46E5' : '#6366F1'} 
                          opacity={entry.name === stats.mostActiveWeekday ? 1 : 0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={`${theme.text} text-center`}>No entries recorded yet</p>
                </div>
              )}
            </div>
            <div className={`mt-3 p-3 rounded-lg ${theme.background} border ${theme.border}`}>
              <div className="flex justify-between items-center">
                <span className={`${theme.text} text-sm`}>Most active day:</span>
                <span className={`${theme.textBold} font-semibold`}>
                  {stats.mostActiveWeekday !== 'None' ? stats.mostActiveWeekday : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${theme.card} rounded-xl p-4 border ${theme.border} shadow-md`}>
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mr-3">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h3 className={`font-semibold ${theme.textBold}`}>Engagement Score</h3>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
              {stats.completionRate}%
            </div>
            <div className={`text-sm ${theme.textMuted}`}>
              {stats.joinedDays > 0 ? 
                `${Math.round((stats.totalEntries / stats.joinedDays) * 100) / 100} entries/day` : 
                'Just started'}
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" 
                style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className={`${theme.card} rounded-xl p-4 border ${theme.border} shadow-md`}>
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
              </svg>
            </div>
            <h3 className={`font-semibold ${theme.textBold}`}>Entry Breakdown</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
              <span className={`text-sm ${theme.text}`}>Mood: {Math.round((stats.moodEntries / stats.totalEntries) * 100) || 0}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
              <span className={`text-sm ${theme.text}`}>Sleep: {Math.round((stats.sleepEntries / stats.totalEntries) * 100) || 0}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
              <span className={`text-sm ${theme.text}`}>Stress: {Math.round((stats.stressEntries / stats.totalEntries) * 100) || 0}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className={`text-sm ${theme.text}`}>Journal: {Math.round((stats.journalEntries / stats.totalEntries) * 100) || 0}%</span>
            </div>
          </div>
        </div>
        
        <div className={`${theme.card} rounded-xl p-4 border ${theme.border} shadow-md`}>
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className={`font-semibold ${theme.textBold}`}>Streak Statistics</h3>
          </div>
          <div className="mt-1">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm ${theme.text}`}>Current streak:</span>
              <span className={`font-semibold ${theme.textBold}`}>{stats.streakDays} day{stats.streakDays !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm ${theme.text}`}>Days tracked:</span>
              <span className={`font-semibold ${theme.textBold}`}>{stats.joinedDays} day{stats.joinedDays !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme.text}`}>Perfect week:</span>
              <span className={`font-semibold ${theme.textBold}`}>{stats.streakDays >= 7 ? 'Yes! 🎉' : 'Not yet'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status message display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 
          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        } flex items-start`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      {/* Profile Tabs */}
      <div className={`mb-6 flex flex-wrap border-b ${theme.border}`}>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 font-medium text-sm relative ${
            activeTab === 'general' 
              ? `${theme.accent} border-b-2 border-indigo-500` 
              : theme.textMuted
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-3 font-medium text-sm relative ${
            activeTab === 'preferences' 
              ? `${theme.accent} border-b-2 border-indigo-500` 
              : theme.textMuted
          }`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 font-medium text-sm relative ${
            activeTab === 'security' 
              ? `${theme.accent} border-b-2 border-indigo-500` 
              : theme.textMuted
          }`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-3 font-medium text-sm relative ${
            activeTab === 'badges' 
              ? `${theme.accent} border-b-2 border-indigo-500` 
              : theme.textMuted
          }`}
        >
          Badges & Achievements
        </button>
      </div>
      
      {/* Tab Content */}
      <div className={`${theme.card} rounded-xl p-6 border ${theme.border} shadow-md`}>
        {/* General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="displayName" className={`block text-sm font-medium ${theme.textBold} mb-1`}>Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                  placeholder="Your display name"
                />
              </div>
              
              <div>
                <label htmlFor="birthdate" className={`block text-sm font-medium ${theme.textBold} mb-1`}>Birthdate</label>
                <input
                  type="date"
                  id="birthdate"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                />
              </div>
              
              <div>
                <label htmlFor="gender" className={`block text-sm font-medium ${theme.textBold} mb-1`}>Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="wellnessGoals" className={`block text-sm font-medium ${theme.textBold} mb-1`}>Wellness Goals</label>
                <textarea
                  id="wellnessGoals"
                  value={wellnessGoals}
                  onChange={(e) => setWellnessGoals(e.target.value)}
                  rows="4"
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                  placeholder="What are your wellness goals and aspirations?"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-full font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:opacity-90 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${loading ? 'animate-pulse' : ''}`}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </div>
          </form>
        )}
        
        {/* Notification Preferences */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${theme.textBold} mb-2`}>Notification Preferences</h3>
              
              <div className={`p-3 rounded-lg border ${theme.border}`}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.email}
                    onChange={() => handleNotificationChange('email')}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className={`ml-3 ${theme.text}`}>Email Notifications</span>
                </label>
                <p className={`mt-1 text-xs ${theme.textMuted} ml-7`}>Receive important account updates and announcements</p>
              </div>
              
              <div className={`p-3 rounded-lg border ${theme.border}`}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.moodReminders}
                    onChange={() => handleNotificationChange('moodReminders')}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className={`ml-3 ${theme.text}`}>Mood Check-in Reminders</span>
                </label>
                <p className={`mt-1 text-xs ${theme.textMuted} ml-7`}>Get reminded to track your mood and wellbeing</p>
              </div>
              
              <div className={`p-3 rounded-lg border ${theme.border}`}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.weeklyReport}
                    onChange={() => handleNotificationChange('weeklyReport')}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className={`ml-3 ${theme.text}`}>Weekly Wellness Reports</span>
                </label>
                <p className={`mt-1 text-xs ${theme.textMuted} ml-7`}>Receive a summary of your wellness trends each week</p>
              </div>
              
              <div className={`p-3 rounded-lg border ${theme.border}`}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.communityMessages}
                    onChange={() => handleNotificationChange('communityMessages')}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className={`ml-3 ${theme.text}`}>Community Messages</span>
                </label>
                <p className={`mt-1 text-xs ${theme.textMuted} ml-7`}>Get notified when someone responds to your community posts</p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-full font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:opacity-90 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${loading ? 'animate-pulse' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </form>
        )}
        
        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div>
              <h3 className={`text-lg font-semibold ${theme.textBold} mb-4`}>Update Email</h3>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium ${theme.textBold} mb-1`}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || email === currentUser?.email}
                    className={`px-4 py-2 rounded-full font-medium ${
                      loading || email === currentUser?.email 
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:opacity-90 transform hover:scale-105'
                    } text-white transition-all duration-300`}
                  >
                    {loading ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className={`border-t ${theme.border} pt-6`}>
              <h3 className={`text-lg font-semibold ${theme.textBold} mb-4`}>Change Password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium ${theme.textBold} mb-1`}>New Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className={`block text-sm font-medium ${theme.textBold} mb-1`}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.input} focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500`}
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !password || password !== confirmPassword}
                    className={`px-4 py-2 rounded-full font-medium ${
                      loading || !password || password !== confirmPassword
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:opacity-90 transform hover:scale-105'
                    } text-white transition-all duration-300`}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className={`border-t ${theme.border} pt-6`}>
              <h3 className={`text-lg font-semibold ${theme.textBold} mb-4`}>Account Security</h3>
              
              <div className={`p-4 rounded-lg ${theme.card} border ${theme.border} mb-4`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'} mr-4`}>
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-base font-medium ${theme.textBold}`}>Session Management</h4>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Manage your active sessions and sign out from other devices</p>
                  </div>
                  <button 
                    className={`ml-auto px-3 py-1 text-xs rounded-full ${theme.buttonSecondary}`}
                    onClick={() => alert("Feature coming soon!")}
                  >
                    Manage
                  </button>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${theme.card} border ${theme.border} mb-4`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'} mr-4`}>
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-base font-medium ${theme.textBold}`}>Two-Factor Authentication</h4>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Add an extra layer of security to your account</p>
                  </div>
                  <button 
                    className={`ml-auto px-3 py-1 text-xs rounded-full ${theme.buttonSecondary}`}
                    onClick={() => alert("Feature coming soon!")}
                  >
                    Enable
                  </button>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'} mr-4`}>
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-base font-medium ${theme.textBold}`}>Login Alerts</h4>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Get notified when a new login is detected</p>
                  </div>
                  <div className="ml-auto flex items-center">
                    <span className={`text-xs mr-2 ${theme.textMuted}`}>
                      {userData?.loginAlerts ? 'Enabled' : 'Disabled'}
                    </span>
                    <button 
                      className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                        userData?.loginAlerts ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      onClick={() => alert("Feature coming soon!")}
                    ><span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      userData?.loginAlerts ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Badges & Achievements Tab */}
    {activeTab === 'badges' && (
      <div className="space-y-6">
        <h3 className={`text-lg font-semibold ${theme.textBold} mb-4`}>Your Badges & Achievements</h3>
        
        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Streak Badge */}
          <div className={`${stats.streakDays >= 3 ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-white text-2xl shadow-lg">
              🔥
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Streak Master</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {stats.streakDays >= 3 ? `${stats.streakDays} day streak` : 'Get a 3-day streak'}
            </p>
          </div>
          
          {/* Entry Count Badge */}
          <div className={`${stats.totalEntries >= 10 ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-xl shadow-lg">
              📊
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Data Collector</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {stats.totalEntries >= 10 ? `${stats.totalEntries} entries recorded` : 'Record 10 entries'}
            </p>
          </div>
          
          {/* Balanced Tracker Badge */}
          <div className={`${(stats.moodEntries > 0 && stats.sleepEntries > 0 && stats.stressEntries > 0) ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-500 text-white text-xl shadow-lg">
              ⚖️
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Balanced Tracker</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {(stats.moodEntries > 0 && stats.sleepEntries > 0 && stats.stressEntries > 0) ? 
                'Tracking all metrics' : 'Track mood, sleep & stress'}
            </p>
          </div>
          
          {/* Journal Writer Badge */}
          <div className={`${stats.journalEntries >= 3 ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xl shadow-lg">
              📝
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Journal Writer</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {stats.journalEntries >= 3 ? `${stats.journalEntries} journal entries` : 'Write 3 journal entries'}
            </p>
          </div>
          
          {/* Profile Completer Badge */}
          <div className={`${(displayName && birthdate && gender && wellnessGoals) ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xl shadow-lg">
              👤
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Profile Pro</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {(displayName && birthdate && gender && wellnessGoals) ? 
                'Profile completed' : 'Complete your profile'}
            </p>
          </div>
          
          {/* Perfect Week Badge */}
          <div className={`${stats.streakDays >= 7 ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xl shadow-lg">
              🏆
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Perfect Week</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {stats.streakDays >= 7 ? 'Achieved! Congrats!' : 'Track for 7 days in a row'}
            </p>
          </div>
          
          {/* Consistent Tracker */}
          <div className={`${stats.completionRate >= 50 ? '' : 'opacity-40'} rounded-lg border ${theme.border} p-4 text-center`}>
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white text-xl shadow-lg">
              📈
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Consistent</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              {stats.completionRate >= 50 ? `${stats.completionRate}% completion rate` : 'Reach 50% completion rate'}
            </p>
          </div>
          
          {/* Coming Soon Badge */}
          <div className="opacity-40 rounded-lg border ${theme.border} p-4 text-center">
            <div className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-gray-500 text-white text-xl shadow-lg">
              🔒
            </div>
            <h4 className={`${theme.textBold} font-medium`}>Coming Soon</h4>
            <p className={`text-xs ${theme.textMuted}`}>
              More achievements to unlock
            </p>
          </div>
        </div>
        
        {/* Achievement Progress */}
        <div className={`rounded-lg border ${theme.border} p-4 mt-6`}>
          <h4 className={`font-semibold ${theme.textBold} mb-3`}>Your Progress</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.text}`}>Daily Streak</span>
                <span className={`text-sm ${theme.textBold}`}>{stats.streakDays}/30 days</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" 
                  style={{ width: `${Math.min((stats.streakDays / 30) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.text}`}>Entries Recorded</span>
                <span className={`text-sm ${theme.textBold}`}>{stats.totalEntries}/100 entries</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                  style={{ width: `${Math.min((stats.totalEntries / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.text}`}>Completion Rate</span>
                <span className={`text-sm ${theme.textBold}`}>{stats.completionRate}/80%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" 
                  style={{ width: `${Math.min((stats.completionRate / 80) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  
  {/* Data Download Section */}
  <div className={`${theme.card} rounded-xl p-6 border ${theme.border} shadow-md mt-6`}>
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div>
        <h3 className={`text-lg font-semibold ${theme.textBold}`}>Your Data</h3>
        <p className={`${theme.textMuted} text-sm mt-1`}>Download a copy of your data or delete your account</p>
      </div>
      <div className="flex mt-4 md:mt-0 space-x-3">
        <button 
          className={`px-4 py-2 rounded-lg font-medium ${theme.buttonSecondary} text-sm`}
          onClick={() => alert("Download feature coming soon!")}
        >
          Download Data
        </button>
        <button 
          className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors text-sm"
          onClick={() => alert("Account deletion feature coming soon!")}
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
</div>
);
};

export default Profile;