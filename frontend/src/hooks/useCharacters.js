/**
 * Character Hook - Testable custom hook for character operations
 * Provides state management and data fetching for characters
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import CharacterRepository from '../repositories/characterRepository';

/**
 * Custom hook for character data management
 * @param {Object} options - Hook options
 * @param {CharacterRepository} options.repository - Character repository instance
 * @returns {Object} Hook state and methods
 */
export function useCharacters(options = {}) {
  const repository = options.repository || new CharacterRepository();
  
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Ref for request cancellation
  const abortControllerRef = useRef(null);

  /**
   * Fetch characters with optional parameters
   * @param {Object} params - Query parameters
   */
  const fetchCharacters = useCallback(async (params = {}) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await repository.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...params
      });

      setCharacters(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch characters');
      }
    } finally {
      setLoading(false);
    }
  }, [repository, pagination.page, pagination.limit]);

  /**
   * Search characters
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  const searchCharacters = useCallback(async (query, searchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await repository.search(query, searchOptions);
      return result;
    } catch (err) {
      setError(err.message || 'Search failed');
      return { results: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [repository]);

  /**
   * Get character by identifier
   * @param {string|number} identifier - Character ID or slug
   */
  const getCharacter = useCallback(async (identifier) => {
    setLoading(true);
    setError(null);

    try {
      const character = await repository.getByIdentifier(identifier);
      return character;
    } catch (err) {
      setError(err.message || 'Failed to fetch character');
      return null;
    } finally {
      setLoading(false);
    }
  }, [repository]);

  /**
   * Get featured characters
   * @param {Object} options - Featured options
   */
  const getFeatured = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const featured = await repository.getFeatured(options);
      return featured;
    } catch (err) {
      setError(err.message || 'Failed to fetch featured characters');
      return [];
    } finally {
      setLoading(false);
    }
  }, [repository]);

  /**
   * Get categories
   */
  const getCategories = useCallback(async () => {
    try {
      const categories = await repository.getCategories();
      return categories;
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      return [];
    }
  }, [repository]);

  /**
   * Get eras
   */
  const getEras = useCallback(async () => {
    try {
      const eras = await repository.getEras();
      return eras;
    } catch (err) {
      setError(err.message || 'Failed to fetch eras');
      return [];
    }
  }, [repository]);

  /**
   * Set page
   * @param {number} page - New page number
   */
  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Set limit
   * @param {number} limit - New limit
   */
  const setLimit = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refetch current page
   */
  const refetch = useCallback(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    characters,
    loading,
    error,
    pagination,
    
    // Methods
    fetchCharacters,
    searchCharacters,
    getCharacter,
    getFeatured,
    getCategories,
    getEras,
    setPage,
    setLimit,
    clearError,
    refetch
  };
}

/**
 * Hook for single character data
 * @param {string|number} identifier - Character ID or slug
 * @param {Object} options - Hook options
 * @returns {Object} Hook state and methods
 */
export function useCharacter(identifier, options = {}) {
  const repository = useRef(options.repository || new CharacterRepository());
  
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const previousIdentifier = useRef(identifier);

  // Refs for request tracking
  const abortControllerRef = useRef(null);
  const isMounted = useRef(true);

  /**
   * Fetch character data
   */
  const fetchCharacter = useCallback(async () => {
    if (!identifier) return;

    // Only update loading state on initial load or when identifier changes
    if (initialLoad || identifier !== previousIdentifier.current) {
      setLoading(true);
    }
    setError(null);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const characterData = await repository.current.getByIdentifier(identifier);
      
      if (isMounted.current) {
        setCharacter(characterData);
        setError(null);
        options.onSuccess?.(characterData);
      }
    } catch (err) {
      if (isMounted.current && err.name !== 'AbortError') {
        console.error('Error fetching character:', err);
        setError(err.message || 'Failed to fetch character');
        options.onError?.(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        if (initialLoad) setInitialLoad(false);
        previousIdentifier.current = identifier;
      }
    }
  }, [identifier, options, initialLoad]);

  /**
   * Like/unlike character
   * @param {boolean} liked - Like status
   */
  const toggleLike = useCallback(async (liked) => {
    if (!character) return;

    try {
      const updatedCharacter = await repository.current.setLike(character.id || character.slug, liked);
      setCharacter(updatedCharacter);
      return updatedCharacter;
    } catch (err) {
      setError(err.message || 'Failed to update like status');
      return null;
    }
  }, [character, repository]);

  /**
   * Increment view count
   */
  // Debounced view increment to prevent multiple rapid calls
  const incrementViews = useCallback(async () => {
    if (!character) {
      console.warn('Cannot increment views: No character data available');
      return null;
    }

    const characterId = character.id || character.slug;
    if (!characterId) {
      console.error('Cannot increment views: Missing character ID/slug');
      return null;
    }

    // Only increment views if we haven't done so recently for this character
    const lastViewKey = `lastView_${characterId}`;
    const lastViewTime = localStorage.getItem(lastViewKey);
    const now = Date.now();
    
    // Only increment views if it's been more than 5 minutes since last view
    if (lastViewTime && (now - parseInt(lastViewTime, 10)) < 300000) {
      console.log('View count not incremented - too soon since last view');
      return null;
    }

    try {
      console.log(`Incrementing views for character: ${characterId}`);
      const updatedCharacter = await repository.current.incrementViews(characterId);
      
      // Update the last view time
      localStorage.setItem(lastViewKey, now.toString());
      
      // Update the character data if still mounted
      if (isMounted.current) {
        setCharacter(prev => ({
          ...prev,
          views_count: updatedCharacter.views_count
        }));
      }
      console.log('Successfully incremented views:', updatedCharacter);
      setCharacter(updatedCharacter);
      return updatedCharacter;
    } catch (err) {
      // Enhanced error logging
      const errorDetails = {
        message: err.message,
        name: err.name,
        code: err.code,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
          timeout: err.config?.timeout,
          headers: err.config?.headers,
        },
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      };
      
      console.error('Failed to increment views:', {
        characterId,
        error: errorDetails,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        apiBaseURL: process.env.REACT_APP_API_URL || window.location.origin,
      });
      
      // Don't set error for view count failures to avoid UI disruption
      return null;
    }
  }, [character, repository]);

  /**
   * Share character
   */
  const shareCharacter = useCallback(async () => {
    if (!character) return;

    try {
      const result = await repository.current.share(character.id || character.slug);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to share character');
      return null;
    }
  }, [character, repository]);

  // Setup and cleanup
  useEffect(() => {
    isMounted.current = true;
    
    // Only fetch if we don't have data or if the identifier changed
    if (!character || identifier !== previousIdentifier.current) {
      fetchCharacter();
    } else if (initialLoad) {
      setInitialLoad(false);
    }
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCharacter, identifier, character, initialLoad]);

  return {
    // State
    character,
    loading,
    error,
    
    // Methods
    fetchCharacter,
    toggleLike,
    shareCharacter,
    incrementViews,
    clearError: () => setError(null)
  };
}

export default useCharacters;