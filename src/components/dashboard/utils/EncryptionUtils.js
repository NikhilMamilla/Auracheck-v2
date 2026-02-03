// EncryptionUtils.js
// This file contains utilities for client-side encryption of journal entries

/**
 * Generates a cryptographic key derived from user-specific information
 * @param {string} userId - The user's unique ID
 * @param {string} secret - A user-specific secret (can be stored in localStorage)
 * @returns {Promise<CryptoKey>} A cryptographic key for encryption/decryption
 */
export const generateEncryptionKey = async (userId, secret) => {
    // Create a consistent salt from the user ID
    const encoder = new TextEncoder();
    const salt = encoder.encode(userId);
    
    // Generate a key from the user's secret
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive the actual encryption key
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };
  
  /**
   * Encrypts text content using AES-GCM
   * @param {string} text - The text to encrypt
   * @param {CryptoKey} key - The encryption key
   * @returns {Promise<string>} Base64-encoded encrypted data
   */
  export const encryptText = async (text, key) => {
    try {
      // Generate a random IV (Initialization Vector)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encode the text
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // Encrypt the data
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );
      
      // Combine IV and encrypted data and convert to Base64
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  };
  
  /**
   * Decrypts text content using AES-GCM
   * @param {string} encryptedText - Base64-encoded encrypted data
   * @param {CryptoKey} key - The decryption key
   * @returns {Promise<string>} Decrypted text
   */
  export const decryptText = async (encryptedText, key) => {
    try {
      // Convert Base64 back to array buffer
      const binaryString = atob(encryptedText);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Extract IV and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedData = bytes.slice(12);
      
      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encryptedData
      );
      
      // Decode the data
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  };
  
  /**
   * Stores a user's encryption key in localStorage
   * @param {string} userId - The user's unique ID
   * @param {string} secret - The secret to store
   */
  export const storeEncryptionSecret = (userId, secret) => {
    localStorage.setItem(`encryption_secret_${userId}`, secret);
  };
  
  /**
   * Retrieves a user's encryption secret from localStorage
   * @param {string} userId - The user's unique ID
   * @returns {string|null} The encryption secret or null if not found
   */
  export const getEncryptionSecret = (userId) => {
    return localStorage.getItem(`encryption_secret_${userId}`);
  };
  
  /**
   * Generates a new random encryption secret
   * @returns {string} A random encryption secret
   */
  export const generateEncryptionSecret = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  
  /**
   * Checks if an entry is encrypted
   * @param {string} text - The text to check
   * @returns {boolean} True if the text appears to be encrypted
   */
  export const isEncrypted = (text) => {
    // Check if the text is Base64 encoded and has the expected format
    if (!text) return false;
    
    try {
      const decoded = atob(text);
      // Encrypted text should have at least IV (12 bytes) + some data
      return decoded.length > 12;
    } catch (e) {
      // If it fails to decode as Base64, it's not encrypted
      return false;
    }
  };