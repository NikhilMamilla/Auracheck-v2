import React, { useState } from 'react';
import { useCommunity } from './CommunityContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const CreateCommunity = ({ onClose }) => {
  const { createCommunity } = useCommunity();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    isPublic: true,
    rules: ['Be respectful to all members', 'No spam or self-promotion'],
  });
  
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Add a tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Check for duplicates
    if (formData.tags.includes(tagInput.trim().toLowerCase())) {
      setErrors(prev => ({ ...prev, tags: 'Tag already exists' }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim().toLowerCase()]
    }));
    setTagInput('');
    
    // Clear error
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: null }));
    }
  };
  
  // Remove a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Add a rule
  const handleAddRule = () => {
    if (!ruleInput.trim()) return;
    
    // Check for duplicates
    if (formData.rules.includes(ruleInput.trim())) {
      setErrors(prev => ({ ...prev, rules: 'Rule already exists' }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, ruleInput.trim()]
    }));
    setRuleInput('');
    
    // Clear error
    if (errors.rules) {
      setErrors(prev => ({ ...prev, rules: null }));
    }
  };
  
  // Remove a rule
  const handleRemoveRule = (ruleToRemove) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule !== ruleToRemove)
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setCreateError("You must be logged in to create a community");
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setCreateError(null);
    
    try {
      console.log("Creating community with data:", formData);
      
      // Directly create the community in Firestore
      const communityData = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        rules: formData.rules,
        isPublic: formData.isPublic,
        createdBy: currentUser.uid,
        memberCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add the community document
      const communityRef = await addDoc(collection(db, 'communities'), communityData);
      console.log("Created community with ID:", communityRef.id);
      
      // Add the creator as a member and admin
      await addDoc(collection(db, 'communityMembers'), {
        communityId: communityRef.id,
        userId: currentUser.uid,
        role: 'admin',
        joinedAt: new Date()
      });
      
      console.log("Added creator as member with admin role");
      
      // Close the modal and optionally refresh
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error creating community:', error);
      setCreateError(error.message || "Failed to create community. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme.card} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4`}>
        <div className="p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Create New Community
            </h2>
            <button 
              onClick={onClose}
              className={`p-2 rounded-full ${theme.buttonSecondary} hover:bg-gray-200 dark:hover:bg-gray-700`}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {createError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {createError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block mb-2 font-medium ${theme.text}`}>
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : theme.inputBorder} ${theme.input}`}
                placeholder="Enter a name for your community"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className={`block mb-2 font-medium ${theme.text}`}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={`w-full px-4 py-2 rounded-lg border ${errors.description ? 'border-red-500' : theme.inputBorder} ${theme.input}`}
                placeholder="What is this community about?"
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
            
            <div>
              <label className={`block mb-2 font-medium ${theme.text}`}>
                Tags <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className={`flex-1 px-4 py-2 rounded-l-lg border ${errors.tags ? 'border-red-500' : theme.inputBorder} ${theme.input}`}
                  placeholder="Add tags (e.g., anxiety, meditation)"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg"
                >
                  Add
                </button>
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-500">{errors.tags}</p>
              )}
              
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className={`block mb-2 font-medium ${theme.text}`}>
                Community Rules
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                  className={`flex-1 px-4 py-2 rounded-l-lg border ${errors.rules ? 'border-red-500' : theme.inputBorder} ${theme.input}`}
                  placeholder="Add a community rule"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg"
                >
                  Add
                </button>
              </div>
              {errors.rules && (
                <p className="mt-1 text-sm text-red-500">{errors.rules}</p>
              )}
              
              {formData.rules.length > 0 && (
                <div className="mt-3">
                  <ul className="space-y-2">
                    {formData.rules.map((rule, index) => (
                      <li key={index} className={`flex items-start gap-2 ${theme.text}`}>
                        <span className="text-gray-600 dark:text-gray-400 mt-0.5">{index + 1}.</span>
                        <span className="flex-1">{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule)}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className={`ml-2 ${theme.text}`}>Make this community public</span>
              </label>
              <p className={`text-sm ${theme.textMuted} mt-1 ml-6`}>
                Public communities can be found by anyone. Private communities require an invitation.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border ${theme.inputBorder} rounded-lg ${theme.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;