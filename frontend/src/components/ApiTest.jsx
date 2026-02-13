import React, { useState } from 'react'
import { useApiTest } from '../hooks/useApiTest'
import { charactersApi, storiesApi } from '../services/dotnetApi'

const ApiTest = () => {
  const { status, data, error, loading, testConnection } = useApiTest()
  const [characters, setCharacters] = useState([])
  const [stories, setStories] = useState([])
  const [testResults, setTestResults] = useState({})

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'testing': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'success': return 'Connected'
      case 'error': return 'Connection Failed'
      case 'testing': return 'Testing...'
      default: return 'Not Tested'
    }
  }

  const testCharactersApi = async () => {
    try {
      const result = await charactersApi.getAll()
      setCharacters(result)
      setTestResults(prev => ({ ...prev, characters: 'Success' }))
      console.log('Characters API Result:', result)
    } catch (err) {
      setTestResults(prev => ({ ...prev, characters: `Error: ${err.message}` }))
      console.error('Characters API Error:', err)
    }
  }

  const testStoriesApi = async () => {
    try {
      const result = await storiesApi.getPublished()
      setStories(result)
      setTestResults(prev => ({ ...prev, stories: 'Success' }))
      console.log('Stories API Result:', result)
    } catch (err) {
      setTestResults(prev => ({ ...prev, stories: `Error: ${err.message}` }))
      console.error('Stories API Error:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">API Connection Status</h2>
      
      <div className="mb-6">
        <span className="font-semibold">Status: </span>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {loading && (
        <div className="mb-6 text-blue-600">
          Testing connection...
        </div>
      )}

      {data && (
        <div className="mb-6 p-4 bg-green-50 rounded border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Connection Successful!</h3>
          <pre className="text-sm text-green-700 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded border border-red-200">
          <h3 className="font-semibold text-red-800 mb-2">Connection Error</h3>
          <p className="text-sm text-red-700">
            {error.message || 'Failed to connect to the API'}
          </p>
          {error.response && (
            <details className="mt-2">
              <summary className="text-sm cursor-pointer text-red-600">
                View Details
              </summary>
              <pre className="text-xs text-red-600 mt-1 overflow-auto">
                {JSON.stringify(error.response.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Connection
          </button>
          
          <button
            onClick={testCharactersApi}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Characters API
          </button>
          
          <button
            onClick={testStoriesApi}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Stories API
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Characters API</h3>
          <div className={`p-2 rounded text-sm ${testResults.characters === 'Success' ? 'bg-green-100 text-green-800' : testResults.characters?.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
            {testResults.characters || 'Not tested'}
          </div>
          {characters.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Found {characters.length} characters:</p>
              <ul className="text-xs mt-1 space-y-1">
                {characters.slice(0, 3).map(char => (
                  <li key={char.id} className="truncate">
                    • {char.name} ({char.historicalPeriod})
                  </li>
                ))}
                {characters.length > 3 && <li>• ... and {characters.length - 3} more</li>}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Stories API</h3>
          <div className={`p-2 rounded text-sm ${testResults.stories === 'Success' ? 'bg-green-100 text-green-800' : testResults.stories?.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
            {testResults.stories || 'Not tested'}
          </div>
          {stories.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Found {stories.length} stories:</p>
              <ul className="text-xs mt-1 space-y-1">
                {stories.slice(0, 3).map(story => (
                  <li key={story.id} className="truncate">
                    • {story.title} ({story.viewCount} views)
                  </li>
                ))}
                {stories.length > 3 && <li>• ... and {stories.length - 3} more</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiTest
