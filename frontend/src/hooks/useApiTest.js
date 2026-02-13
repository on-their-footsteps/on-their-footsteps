import { useState, useEffect } from 'react'
import { testApi } from '../services/dotnetApi'
import { API_CONFIG } from '../config/constants'

export const useApiTest = () => {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setStatus('testing')
    setError(null)

    try {
      console.log('Testing API connection to:', API_CONFIG.BASE_URL)
      const result = await testApi.health()
      setData(result)
      setStatus('success')
      console.log('API Connection Test Result:', result)
    } catch (err) {
      setError(err)
      setStatus('error')
      console.error('API Connection Test Error:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      })
    } finally {
      setLoading(false)
    }
  }

  const testCharacters = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await testApi.api.get('/characters')
      console.log('Characters API Test Result:', result)
      return result
    } catch (err) {
      setError(err)
      console.error('Characters API Test Error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-test connection on mount
    testConnection()
  }, [])

  return {
    status,
    data,
    error,
    loading,
    testConnection,
    testCharacters
  }
}
