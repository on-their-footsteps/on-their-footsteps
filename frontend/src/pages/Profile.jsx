import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGamification } from '../context/GamificationContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile, logout } = useAuth()
  const { getUserStats } = useGamification()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    language: 'ar',
    theme: 'light'
  })
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userStats, setUserStats] = useState(null)

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        language: user.language || 'ar',
        theme: user.theme || 'light'
      })
      
      // Load user stats
      const stats = getUserStats()
      setUserStats(stats)
    }
  }, [user, getUserStats])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await updateProfile(formData)
      if (result.success) {
        toast.success('تم تحديث الملف الشخصي بنجاح!')
        setIsEditing(false)
      } else {
        toast.error(result.error || 'فشل تحديث الملف الشخصي')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الملف الشخصي')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('هل أنت متأكد من أنك تريد تسجيل الخروج؟')) {
      setLoading(true)
      try {
        await logout()
        toast.success('تم تسجيل الخروج بنجاح')
        navigate('/login')
      } catch (error) {
        toast.error('حدث خطأ أثناء تسجيل الخروج')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancelEdit = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        language: user.language || 'ar',
        theme: user.theme || 'light'
      })
    }
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الملف الشخصي</h1>
          <p className="text-gray-600">إدارة معلوماتك وتتبع تقدمك</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">معلوماتي</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    تعديل الملف
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <LoadingSpinner size="small" /> : 'حفظ'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-20 w-20 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.full_name || 'مستخدم جديد'}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      عضو منذ {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                      اللغة
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                      المظهر
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="light">فاتح</option>
                      <option value="dark">داكن</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Stats Card */}
          <div className="space-y-6">
            {/* Progress Stats */}
            {userStats && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات التقدم</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">القصص المكتملة</span>
                    <span className="font-semibold text-purple-600">{userStats.completedStories || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">نقاط الخبرة</span>
                    <span className="font-semibold text-green-600">{userStats.totalXP || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">المستوى</span>
                    <span className="font-semibold text-purple-600">{userStats.level || 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">أيام متتالية</span>
                    <span className="font-semibold text-orange-600">{userStats.streak || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">الوقت الإجمالي</span>
                    <span className="font-semibold text-indigo-600">{Math.floor((userStats.totalTime || 0) / 60)} دقيقة</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-center"
                >
                  لوحة التحكم
                </button>
                <button
                  onClick={() => navigate('/characters')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
                >
                  استكشف الشخصيات
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-center disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="small" /> : 'تسجيل الخروج'}
                </button>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الإنجازات</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xl">🏆</span>
                  </div>
                  <p className="text-xs text-gray-600">بداية رائعة</p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xl">📚</span>
                  </div>
                  <p className="text-xs text-gray-600">قارئ نشط</p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xl">⭐</span>
                  </div>
                  <p className="text-xs text-gray-600">متعلم مثابر</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
