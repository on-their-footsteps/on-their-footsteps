import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-purple-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          على خطاهم
        </Link>
        <nav className="space-x-4 flex items-center">
          <Link to="/" className="hover:underline">الرئيسية</Link>
          <Link to="/characters" className="hover:underline">الشخصيات</Link>
          <Link to="/categories" className="hover:underline">الأقسام</Link>
          <Link to="/timeline" className="hover:underline">الخط الزمني</Link>
          <Link to="/about" className="hover:underline">من نحن</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:underline">لوحة التحكم</Link>
              <Link to="/profile" className="hover:underline">الملف الشخصي</Link>
              {user?.is_superuser && (
                <Link to="/admin" className="hover:underline text-red-600">لوحة الإدارة</Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors">
                إنشاء حساب
              </Link>
              <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm transition-colors">
                تسجيل الدخول
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
