import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">الصفحة غير موجودة</h2>
        <p className="text-gray-600 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link 
          to="/" 
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  )
}

export default NotFound
