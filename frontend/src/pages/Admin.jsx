import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Admin = () => {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [characters, setCharacters] = useState([])
  const [logs, setLogs] = useState([])
  const [systemHealth, setSystemHealth] = useState({})

  // Check if user is admin (you might want to add an admin role check)
  const isAdmin = user?.is_superuser || false

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return
    }
    
    loadDashboardData()
  }, [isAuthenticated, isAdmin])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load dashboard stats
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load system health
      const healthResponse = await fetch('/api/admin/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData)
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
      toast.error('فشل تحميل بيانات الإدارة')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      } else {
        toast.error('فشل تحميل المستخدمين')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('فشل تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/characters')
      if (response.ok) {
        const charactersData = await response.json()
        setCharacters(charactersData)
      } else {
        toast.error('فشل تحميل الشخصيات')
      }
    } catch (error) {
      console.error('Failed to load characters:', error)
      toast.error('فشل تحميل الشخصيات')
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/logs')
      if (response.ok) {
        const logsData = await response.json()
        setLogs(logsData)
      } else {
        toast.error('فشل تحميل السجلات')
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
      toast.error('فشل تحميل السجلات')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId, action, userData = {}) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...userData }),
      })

      if (response.ok) {
        toast.success(`تم ${action} بنجاح`)
        loadUsers()
      } else {
        toast.error('فشل تنفيذ الإجراء')
      }
    } catch (error) {
      console.error('Failed to perform user action:', error)
      toast.error('فشل تنفيذ الإجراء')
    }
  }

  const handleCharacterAction = async (characterId, action, characterData = {}) => {
    try {
      const response = await fetch(`/api/admin/characters/${characterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...characterData }),
      })

      if (response.ok) {
        toast.success(`تم ${action} بنجاح`)
        loadCharacters()
      } else {
        toast.error('فشل تنفيذ الإجراء')
      }
    } catch (error) {
      console.error('Failed to perform character action:', error)
      toast.error('فشل تنفيذ الإجراء')
    }
  }

  const runHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/health-check', {
        method: 'POST',
      })

      if (response.ok) {
        const healthData = await response.json()
        setSystemHealth(healthData)
        toast.success('تم فحص النظام بنجاح')
      } else {
        toast.error('فشل فحص النظام')
      }
    } catch (error) {
      console.error('Failed to run health check:', error)
      toast.error('فشل فحص النظام')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">مطلوب تسجيل الدخول</h1>
          <p className="text-gray-600 mb-6">يجب تسجيل الدخول للوصول إلى لوحة الإدارة</p>
          <Link
            to="/login"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح بالوصول</h1>
          <p className="text-gray-600 mb-6">ليس لديك صلاحية الوصول إلى لوحة الإدارة</p>
          <Link
            to="/dashboard"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    )
  }

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-full">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v2m0 0V8a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 00-5.356 1.857M12 12V4a3 3 0 00-5.356 1.857M12 12v8a3 3 0 005.356 1.857" />
            </svg>
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600">المستخدمون</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600">الشخصيات</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalCharacters || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600">القصص المكتملة</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.completedStories || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7m0 0V3m0 0l9 14h-7V3z" />
            </svg>
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600">حجم قاعدة البيانات</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.databaseSize || '0 MB'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">إدارة المستخدمين</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المعرف</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القصص</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name || 'غير محدد'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.completed_stories || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleUserAction(user.id, 'toggle')}
                    className={`mr-2 px-3 py-1 rounded text-xs ${
                      user.is_active 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {user.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button
                    onClick={() => handleUserAction(user.id, 'reset_password')}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    إعادة تعيين كلمة المرور
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderCharacters = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">إدارة الشخصيات</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المعرف</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
              <th className="px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشاهدات</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {characters.map((character) => (
              <tr key={character.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{character.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{character.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{character.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    character.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {character.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{character.views_count || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleCharacterAction(character.id, 'toggle')}
                    className={`mr-2 px-3 py-1 rounded text-xs ${
                      character.is_active 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {character.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderSystemHealth = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">صحة النظام</h3>
          <button
            onClick={runHealthCheck}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="small" /> : 'فحص الآن'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">الخادم الخلفي</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                systemHealth.backend?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth.backend?.status || 'غير معروف'}
              </span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">الواجهة الأمامية</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                systemHealth.frontend?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth.frontend?.status || 'غير معروف'}
              </span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">قاعدة البيانات</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                systemHealth.database?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth.database?.status || 'غير معروف'}
              </span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">الموارد</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                systemHealth.system?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {systemHealth.system?.status || 'غير معروف'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات النظام</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">استخدام المعالج:</span>
            <span className="text-sm font-medium">{systemHealth.system?.cpu_percent || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">استخدام الذاكرة:</span>
            <span className="text-sm font-medium">{systemHealth.system?.memory_percent || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">مساحة القرص:</span>
            <span className="text-sm font-medium">{systemHealth.system?.disk_percent || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">حجم قاعدة البيانات:</span>
            <span className="text-sm font-medium">{systemHealth.database?.file_size_mb || 0} MB</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLogs = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">السجلات النظام</h3>
      </div>
      <div className="p-6">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className={`p-3 rounded border ${
              log.level === 'ERROR' ? 'border-red-200 bg-red-50' :
              log.level === 'WARNING' ? 'border-yellow-200 bg-yellow-50' :
              log.level === 'INFO' ? 'border-blue-200 bg-blue-50' :
              'border-gray-200'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold ${
                      log.level === 'ERROR' ? 'text-red-600' :
                      log.level === 'WARNING' ? 'text-yellow-600' :
                      log.level === 'INFO' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-sm text-gray-900">{log.message}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {log.timestamp} - {log.service}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة الإدارة</h1>
          <p className="mt-2 text-gray-600">إدارة وتحكم في تطبيق على خطاهم</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'لوحة التحكم', icon: '📊' },
              { id: 'users', name: 'المستخدمون', icon: '👥' },
              { id: 'characters', name: 'الشخصيات', icon: '📚' },
              { id: 'system', name: 'صحة النظام', icon: '🏥' },
              { id: 'logs', name: 'السجلات', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === 'users') loadUsers()
                  if (tab.id === 'characters') loadCharacters()
                  if (tab.id === 'logs') loadLogs()
                }}
                className={`flex items-center px-1 py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'characters' && renderCharacters()}
            {activeTab === 'system' && renderSystemHealth()}
            {activeTab === 'logs' && renderLogs()}
          </>
        )}
      </div>
    </div>
  )
}

export default Admin
