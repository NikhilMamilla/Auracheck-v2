/**
 * Get category name from ID
 * @param {string} categoryId - The category ID
 * @param {Array} categories - List of categories
 * @returns {string} Category name
 */
export const getCategoryName = (categoryId, categories) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };
  
  /**
   * Format date for display
   * @param {Object|number} timestamp - Firestore timestamp or Date object
   * @returns {string} Formatted date string
   */
  export const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  /**
   * Truncate text to a specific length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  /**
   * Create a unique list of tags from resources
   * @param {Array} resources - List of resources
   * @returns {Array} Unique tags
   */
  export const extractTags = (resources) => {
    if (!resources || !resources.length) return [];
    
    const tags = new Set();
    resources.forEach(resource => {
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags);
  };
  
  /**
   * Generate a reading time estimate for content
   * @param {string} content - HTML or text content
   * @returns {string} Reading time estimate
   */
  export const getReadingTime = (content) => {
    if (!content) return '1 min read';
    
    // Remove HTML tags for more accurate word count
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return `${minutes} min read`;
  };
  
  /**
   * Group resources by category
   * @param {Array} resources - List of resources
   * @param {Array} categories - List of categories
   * @returns {Object} Resources grouped by category
   */
  export const groupResourcesByCategory = (resources, categories) => {
    if (!resources || !resources.length) return {};
    
    const grouped = {};
    
    // Initialize categories
    categories.forEach(category => {
      grouped[category.id] = {
        name: category.name,
        resources: []
      };
    });
    
    // Group resources
    resources.forEach(resource => {
      if (resource.categories && Array.isArray(resource.categories)) {
        resource.categories.forEach(categoryId => {
          if (grouped[categoryId]) {
            grouped[categoryId].resources.push(resource);
          }
        });
      } else {
        // Handle uncategorized resources
        if (!grouped['uncategorized']) {
          grouped['uncategorized'] = {
            name: 'Uncategorized',
            resources: []
          };
        }
        grouped['uncategorized'].resources.push(resource);
      }
    });
    
    return grouped;
  };