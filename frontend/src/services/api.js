import axios from 'axios'
import ApiService from './apiService'
import { requestDeduplication } from '../utils/requestDeduplicator'
import { apiCache, cacheUtils } from '../utils/cacheManager'
import { API_CONFIG } from '../config/constants'

// Create ApiService instance for dependency injection
const apiService = new ApiService()

// Create axios instance with base URL and timeout
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: false, // Disable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
})

// Add retry logic for failed requests
const retryRequest = async (config, retryCount = 0) => {
  try {
    return await api(config)
  } catch (error) {
    if (retryCount < API_CONFIG.MAX_RETRIES && 
        (error.code === 'ECONNABORTED' || 
         error.code === 'ENOTFOUND' || 
         error.response?.status >= 500)) {
      
      console.warn(`Retrying request (attempt ${retryCount + 1}/${API_CONFIG.MAX_RETRIES}):`, config.url)
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY))
      
      return retryRequest(config, retryCount + 1)
    }
    
    throw error
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = apiService.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Set language
    const language = apiService.getLanguage()
    config.headers['Accept-Language'] = language
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET requests
    if (response.config.method?.toLowerCase() === 'get') {
      const url = response.config.url
      const params = response.config.params
      
      // Don't cache sensitive data
      if (!url.includes('/auth/') && !url.includes('/admin/')) {
        apiCache.cacheAPIResponse(url, params, response.data)
      }
    }
    
    return response
  },
  (error) => {
    // Handle cache invalidation on errors
    if (error.config?.method?.toLowerCase() === 'post' || 
        error.config?.method?.toLowerCase() === 'put' || 
        error.config?.method?.toLowerCase() === 'delete') {
      
      // Invalidate related cache entries
      const url = error.config.url
      
      if (url.includes('/admin/characters')) {
        apiCache.invalidateEndpoint('/characters')
        apiCache.invalidateEndpoint('/featured')
        apiCache.invalidateEndpoint('/search')
      } else if (url.includes('/admin/')) {
        // Invalidate all cache for any admin operation
        apiCache.clear()
      }
    }
    
    return Promise.reject(error)
  }
)

// Enhanced API request function with caching and deduplication
const apiRequest = async (method, endpoint, data = null, options = {}) => {
  const {
    params = {},
    headers = {},
    useCache = true,
    cacheKey = null,
    retry = true,
    timeout = null
  } = options
  
  // Generate cache key
  const cacheKeyStr = cacheKey || `${method}:${endpoint}:${JSON.stringify(params)}`
  
  // Check cache for GET requests
  if (method.toLowerCase() === 'get' && useCache) {
    const cachedData = apiCache.getCachedAPIResponse(endpoint, params)
    if (cachedData) {
      console.log(`Cache hit for ${endpoint}`)
      return { data: cachedData, cached: true }
    }
  }
  
  // Check for ongoing request (deduplication)
  const ongoingRequest = apiCache.getOngoingRequest(cacheKeyStr)
  if (ongoingRequest) {
    console.log(`Request deduplication for ${endpoint}`)
    return ongoingRequest
  }
  
  // Create request config
  const config = {
    method,
    url: endpoint,
    params,
    headers: {
      ...headers,
      'X-Request-ID': generateRequestId(),
    },
    ...(data && { data }),
    ...(timeout && { timeout }),
  }
  
  // Create request promise
  const requestPromise = (retry ? retryRequest(config) : api(config))
    .then(response => ({ data: response.data, cached: false }))
    .catch(async (error) => {
      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        const errorData = {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          config: error.config
        }
        
        // Log error for debugging
        console.error('API Error Response:', errorData)
        
        // Handle specific error cases
        if (error.response.status === 401) {
          // Unauthorized - clear token and redirect to login
          apiService.removeToken()
          window.location.href = '/login'
        } else if (error.response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.response.headers['retry-after']
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000
          
          console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          
          // Retry once
          return apiRequest(method, endpoint, data, { ...options, retry: false })
        }
        
        throw errorData
      } else if (error.request) {
        // Request was made but no response received
        console.error('API Request Error:', error.request)
        throw { status: 0, message: 'Network error', error: 'NO_RESPONSE' }
      } else {
        // Something else happened
        console.error('API Error:', error.message)
        throw { status: -1, message: error.message, error: 'UNKNOWN_ERROR' }
      }
    })
  
  // Store ongoing request for deduplication
  if (method.toLowerCase() === 'get') {
    apiCache.setOngoingRequest(cacheKeyStr, requestPromise)
  }
  
  return requestPromise
}

// Utility function to generate unique request IDs
const generateRequestId = () => {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Preload critical data
export const preloadCriticalData = async () => {
  try {
    // Preload featured characters and categories in parallel
    const criticalRequests = [
      apiRequest('get', '/content/featured/general', null, { useCache: true, params: { limit: 6 } }),
      apiRequest('get', '/content/categories', null, { useCache: true })
    ]
    
    const results = await Promise.allSettled(criticalRequests)
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Preloaded critical data ${index + 1}`)
      } else {
        console.warn(`Failed to preload critical data ${index + 1}:`, result.reason)
      }
    })
    
    return results
  } catch (error) {
    console.error('Error preloading critical data:', error)
  }
}

// Cache warming utility
export const warmCache = async (endpoints) => {
  const warmPromises = endpoints.map(async ({ endpoint, params = {}, ttl }) => {
    try {
      const result = await apiRequest('get', endpoint, null, { params, useCache: true })
      if (ttl && !result.cached) {
        // Update TTL for this specific cache entry
        const key = apiCache._generateAPIKey(endpoint, params)
        apiCache.updateTTL(key, ttl)
      }
      return { endpoint, success: true, data: result.data }
    } catch (error) {
      console.warn(`Failed to warm cache for ${endpoint}:`, error)
      return { endpoint, success: false, error }
    }
  })
  
  return Promise.all(warmPromises)
}

// Cache statistics and monitoring
export const getCacheStats = () => {
  return {
    api: apiCache.getStats(),
    component: componentCache.getStats(),
    default: defaultCache.getStats()
  }
}

// Cache cleanup utilities
export const cleanupCache = () => {
  // Clear expired entries
  apiCache.clear()
  componentCache.clear()
  
  // Clear all caches
  defaultCache.clear()
  
  console.log('All caches cleared')
}

// Export API modules with enhanced caching
export const characters = {
  getAll: (params = {}) => apiRequest('get', '/characters', null, { params }),
  getById: (id) => apiRequest('get', `/characters/${id}`),
  getBySlug: (slug) => apiRequest('get', `/characters/${slug}`),
  getFeatured: (limit = 6, category = null) => {
    const params = { limit }
    if (category) params.category = category
    return apiRequest('get', '/content/featured/general', null, { params })
  },
  getCategories: () => apiRequest('get', '/content/categories'),
  getEras: () => apiRequest('get', '/content/eras'),
  getSubcategories: (category) => apiRequest('get', `/content/subcategories/${category}`),
  search: (query, filters = {}) => {
    const params = { q: query, ...filters }
    return apiRequest('get', '/content/search', null, { params })
  },
  create: (data) => apiRequest('post', '/admin/characters', data),
  update: (id, data) => apiRequest('put', `/admin/characters/${id}`, data),
  delete: (id) => apiRequest('delete', `/admin/characters/${id}`),
  
  // Batch operations
  getMultiple: (ids) => {
    const promises = ids.map(id => apiRequest('get', `/characters/${id}`))
    return Promise.allSettled(promises)
  },
  
  // Advanced search with caching
  advancedSearch: cacheUtils.memoizeWithCache((query, filters = {}) => {
    const params = { q: query, ...filters }
    return apiRequest('get', '/content/search', null, { params })
  }, 'advanced-search')
}

export const progress = {
  getProgress: (characterId) => apiRequest('get', `/progress/${characterId}`),
  updateProgress: (characterId, data) => apiRequest('put', `/progress/${characterId}`, data),
  updateBookmark: (characterId, bookmarked) => apiRequest('patch', `/progress/${characterId}/bookmark`, { bookmarked }),
  getSummary: () => apiRequest('get', '/progress/summary'),
  
  // Batch operations
  getMultipleProgress: (characterIds) => {
    const promises = characterIds.map(id => apiRequest('get', `/progress/${id}`))
    return Promise.allSettled(promises)
  }
}

export const stats = {
  getStats: () => apiRequest('get', '/stats'),
  getDashboard: () => apiRequest('get', '/stats/dashboard'),
  getLeaderboard: (limit = 10) => apiRequest('get', '/stats/leaderboard', null, { params: { limit } }),
  
  // Cached stats with longer TTL
  getCachedStats: cacheUtils.memoizeWithCache(() => apiRequest('get', '/stats'), 'stats'),
  getCachedDashboard: cacheUtils.memoizeWithCache(() => apiRequest('get', '/stats/dashboard'), 'dashboard')
}

export const auth = {
  login: (credentials) => apiRequest('post', '/auth/login', credentials),
  register: (userData) => apiRequest('post', '/auth/register', userData),
  logout: () => {
    apiService.removeToken()
    return apiRequest('post', '/auth/logout')
  },
  getProfile: () => apiRequest('get', '/auth/me'),
  refreshToken: () => apiRequest('post', '/auth/refresh'),
  forgotPassword: (email) => apiRequest('post', '/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiRequest('post', '/auth/reset-password', { token, password }),
  
  // Cached profile data
  getCachedProfile: cacheUtils.memoizeWithCache(() => apiRequest('get', '/auth/me'), 'profile')
}

export const admin = {
  getStats: () => apiRequest('get', '/admin/stats'),
  getUsers: (params = {}) => apiRequest('get', '/admin/users', null, { params }),
  getCharacters: (params = {}) => apiRequest('get', '/admin/characters', null, { params }),
  createCharacter: (data) => apiRequest('post', '/admin/characters', data),
  updateCharacter: (id, data) => apiRequest('put', `/admin/characters/${id}`, data),
  deleteCharacter: (id) => apiRequest('delete', `/admin/characters/${id}`),
  
  // Bulk operations
  bulkCreateCharacters: (characters) => {
    const promises = characters.map(char => apiRequest('post', '/admin/characters', char))
    return Promise.allSettled(promises)
  },
  
  bulkDeleteCharacters: (ids) => {
    const promises = ids.map(id => apiRequest('delete', `/admin/characters/${id}`))
    return Promise.allSettled(promises)
  }
}

export const media = {
  uploadImage: (file, type = 'character') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return apiRequest('post', '/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteImage: (url) => apiRequest('delete', '/media/image', { url }),
  getGallery: (characterId) => apiRequest('get', `/media/gallery/${characterId}`)
}

export const analytics = {
  trackEvent: (event, data) => apiRequest('post', '/analytics/events', { event, data }),
  trackPageView: (page, data = {}) => apiRequest('post', '/analytics/pageview', { page, ...data }),
  getAnalytics: (params = {}) => apiRequest('get', '/analytics', null, { params }),
  
  // Batch analytics
  trackEvents: (events) => {
    const promises = events.map(event => apiRequest('post', '/analytics/events', event))
    return Promise.allSettled(promises)
  }
}

export const recommendations = {
  getForUser: (userId) => apiRequest('get', `/recommendations/user/${userId}`),
  getForCharacter: (characterId) => apiRequest('get', `/recommendations/character/${characterId}`),
  getSimilar: (characterId) => apiRequest('get', `/recommendations/similar/${characterId}`),
  
  // Cached recommendations
  getCachedRecommendations: cacheUtils.memoizeWithCache((characterId) => 
    apiRequest('get', `/recommendations/character/${characterId}`), 'recommendations'
  )
}

export const performance = {
  getMetrics: () => apiRequest('get', '/performance/metrics'),
  getHealth: () => apiRequest('get', '/performance/health'),
  optimize: () => apiRequest('post', '/performance/optimize')
}

export const learning_paths = {
  getAll: () => apiRequest('get', '/learning-paths'),
  getById: (id) => apiRequest('get', `/learning-paths/${id}`),
  create: (data) => apiRequest('post', '/learning-paths', data),
  update: (id, data) => apiRequest('put', `/learning-paths/${id}`, data),
  delete: (id) => apiRequest('delete', `/learning-paths/${id}`),
  
  // Progress tracking
  getProgress: (pathId) => apiRequest('get', `/learning-paths/${pathId}/progress`),
  updateProgress: (pathId, data) => apiRequest('put', `/learning-paths/${pathId}/progress`, data)
}

export const content_pipeline = {
  getStatus: () => apiRequest('get', '/content-pipeline/status'),
  processContent: (data) => apiRequest('post', '/content-pipeline/process', data),
  getQueue: () => apiRequest('get', '/content-pipeline/queue'),
  
  // Cached pipeline status
  getCachedStatus: cacheUtils.memoizeWithCache(() => 
    apiRequest('get', '/content-pipeline/status'), 'pipeline-status'
  )
}

export default {
  characters,
  progress,
  stats,
  auth,
  admin,
  media,
  analytics,
  recommendations,
  performance,
  learning_paths,
  content_pipeline,
  preloadCriticalData,
  warmCache,
  getCacheStats,
  cleanupCache,
  apiRequest,
  api,
  apiService
}