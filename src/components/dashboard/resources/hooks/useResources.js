import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useUserData } from '../../../../context/UserDataContext';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';

const useResources = (activeCategory, searchTerm) => {
  const { currentUser } = useAuth();
  const { userData } = useUserData();
  
  // State for resources
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch resources from Firestore
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all resource categories
        const categoriesSnapshot = await getDocs(collection(db, 'resourceCategories'));
        const categoriesData = [];
        
        categoriesSnapshot.forEach((doc) => {
          categoriesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setCategories(categoriesData);
        
        // Get all resources
        const resourcesQuery = query(
          collection(db, 'resources'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = [];
        
        resourcesSnapshot.forEach((doc) => {
          resourcesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setResources(resourcesData);
        
        // Get saved resources if user is logged in
        if (currentUser && userData && userData.savedResources) {
          setSavedResources(userData.savedResources || []);
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResources();
  }, [currentUser, userData]);
  
  // Handle saving a resource
  const handleSaveResource = async (resourceId) => {
    if (!currentUser) return;
    
    try {
      // Update user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userDocRef, {
        savedResources: arrayUnion(resourceId),
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      setSavedResources(prev => [...prev, resourceId]);
    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save resource. Please try again.');
    }
  };
  
  // Handle removing a saved resource
  const handleRemoveSavedResource = async (resourceId) => {
    if (!currentUser) return;
    
    try {
      // Update user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userDocRef, {
        savedResources: arrayRemove(resourceId),
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      setSavedResources(prev => prev.filter(id => id !== resourceId));
    } catch (err) {
      console.error('Error removing saved resource:', err);
      setError('Failed to remove saved resource. Please try again.');
    }
  };
  
  // Filter resources based on category and search term
  const getFilteredResources = () => {
    let filtered = [...resources];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(resource => 
        resource.categories && resource.categories.includes(activeCategory)
      );
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(term) || 
        resource.summary.toLowerCase().includes(term) ||
        (resource.content && resource.content.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };
  
  // Get saved resources data
  const getSavedResourcesData = () => {
    return resources.filter(resource => savedResources.includes(resource.id));
  };
  
  // Check if a resource is saved
  const isResourceSaved = (resourceId) => {
    return savedResources.includes(resourceId);
  };

  return {
    resources,
    categories,
    savedResources,
    isLoading,
    error,
    handleSaveResource,
    handleRemoveSavedResource,
    getFilteredResources,
    getSavedResourcesData,
    isResourceSaved
  };
};

export default useResources;