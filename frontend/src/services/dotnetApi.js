import axios from 'axios'
import { API_CONFIG } from '../config/constants'

// Create axios instance for .NET backend
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Important for CORS
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.baseURL)
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Character API - matches .NET backend endpoints
export const charactersApi = {
  // GET /api/characters (using sample data for testing)
  getAll: async (params = {}) => {
    const response = await api.get('/sampledata/characters', { params })
    return response.data
  },

  // GET /api/characters/active
  getActive: async () => {
    const response = await api.get('/sampledata/characters')
    return response.data.filter(char => char.isActive)
  },

  // GET /api/characters/period/{period}
  getByPeriod: async (period) => {
    const response = await api.get('/sampledata/characters')
    return response.data.filter(char => 
      char.historicalPeriod.toLowerCase().includes(period.toLowerCase())
    )
  },

  // GET /api/characters/{id}
  getById: async (id) => {
    const response = await api.get('/sampledata/characters')
    return response.data.find(char => char.id === id)
  },

  // POST /api/characters
  create: async (characterData) => {
    const response = await api.post('/characters', characterData)
    return response.data
  },

  // PUT /api/characters/{id}
  update: async (id, characterData) => {
    const response = await api.put(`/characters/${id}`, characterData)
    return response.data
  },

  // DELETE /api/characters/{id}
  delete: async (id) => {
    await api.delete(`/characters/${id}`)
    return true
  }
}

// Story API - matches .NET backend endpoints
export const storiesApi = {
  // GET /api/stories/published (using sample data for testing)
  getPublished: async () => {
    const response = await api.get('/sampledata/stories')
    return response.data.filter(story => story.isPublished)
  },

  // GET /api/stories/popular
  getPopular: async (limit = 10) => {
    const response = await api.get('/sampledata/stories')
    return response.data
      .filter(story => story.isPublished)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit)
  },

  // GET /api/stories/character/{characterId}
  getByCharacter: async (characterId) => {
    const response = await api.get('/sampledata/stories')
    return response.data.filter(story => story.characterId === characterId)
  },

  // GET /api/stories/{id}
  getById: async (id) => {
    const response = await api.get('/sampledata/stories')
    return response.data.find(story => story.id === id)
  },

  // POST /api/stories
  create: async (storyData) => {
    const response = await api.post('/stories', storyData)
    return response.data
  },

  // PUT /api/stories/{id}
  update: async (id, storyData) => {
    const response = await api.put(`/stories/${id}`, storyData)
    return response.data
  },

  // DELETE /api/stories/{id}
  delete: async (id) => {
    await api.delete(`/stories/${id}`)
    return true
  }
}

// Test API - for testing connectivity
export const testApi = {
  // GET /api/test
  health: async () => {
    const response = await api.get('/test')
    return response.data
  }
}

// Export all APIs
export default {
  characters: charactersApi,
  stories: storiesApi,
  test: testApi,
  api // Export the raw axios instance for custom requests
}
