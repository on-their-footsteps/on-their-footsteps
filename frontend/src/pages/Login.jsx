import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGamification } from '../context/GamificationContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  
  const { login, register } = useAuth()
  const { addXP } = useGamification()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isGuest) {
        // Guest login - create temporary session
        await login({
          email: 'guest@example.com',
          password: 'guest',
          isGuest: true
        })
        addXP(5) // Welcome bonus for guests
        toast.success('مرحباً بك كضيف! يمكنك البدء في التعلم')
      } else {
        // Regular login
        await login(formData)
        addXP(10) // Welcome bonus for registered users
        toast.success('تم تسجيل الدخول بنجاح!')
      }
      navigate('/dashboard')
    } catch (error) {
      toast.error('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await register(formData)
      addXP(20) // Registration bonus
      toast.success('تم إنشاء الحساب بنجاح!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            على خطاهم
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ابدأ رحلتك في تعلم سيرة الرسول والصحابة
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Guest Mode Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">الدخول كضيف</span>
              <button
                onClick={() => setIsGuest(!isGuest)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isGuest ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isGuest ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {isGuest && (
              <p className="mt-2 text-xs text-gray-500">
                الدخول كضيف يتيح لك التجربة بدون تسجيل، لكن التقدم لن يحفظ
              </p>
            )}
          </div>

          <form className="space-y-6" onSubmit={isGuest ? handleSubmit : (e) => {
            e.preventDefault()
            // Switch between login and register based on button clicked
          }}>
            {!isGuest && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    كلمة المرور
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  isGuest ? 'دخول كضيف' : 'تسجيل الدخول'
                )}
              </button>

              {!isGuest && (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="small" /> : 'إنشاء حساب'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
                إنشاء حساب جديد
              </Link>
            </p>
            <div className="mt-2">
              <Link to="/about" className="text-sm text-purple-600 hover:text-purple-500">
                تعرف المزيد عن المنصة
              </Link>
            </div>
          </div>
        </div>

        {/* Features for Kids */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">🎮 للأطفال</h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• مستويات وألعاب تعليمية</li>
            <li>• فيديوهات قصيرة ومسلية</li>
            <li>• مكافآت وشارات تحفيزية</li>
            <li>• تعلم آمن وممتع</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login
