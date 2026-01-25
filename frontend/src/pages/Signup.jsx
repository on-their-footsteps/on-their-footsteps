import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGamification } from '../context/GamificationContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  
  const { register } = useAuth()
  const { addXP } = useGamification()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، ورقم'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة'
    }
    
    // Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'الاسم الكامل مطلوب'
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'الاسم يجب أن يكون حرفين على الأقل'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name.trim()
      })
      
      if (result.success) {
        addXP(20) // Registration bonus
        toast.success('تم إنشاء الحساب بنجاح! مرحباً بك في منصة على خطاهم')
        navigate('/dashboard')
      } else {
        toast.error(result.error || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
    
    const strengthLevels = [
      { text: 'ضعيفة جداً', color: 'red' },
      { text: 'ضعيفة', color: 'orange' },
      { text: 'متوسطة', color: 'yellow' },
      { text: 'جيدة', color: 'blue' },
      { text: 'قوية', color: 'green' },
      { text: 'قوية جداً', color: 'green' }
    ]
    
    return {
      strength: (strength / 6) * 100,
      text: strengthLevels[Math.min(strength - 1, 5)]?.text || '',
      color: strengthLevels[Math.min(strength - 1, 5)]?.color || ''
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-96 -left-96 w-full h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-96 -right-96 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      
      <motion.div 
        className="w-full max-w-md space-y-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <motion.div 
            className="mx-auto h-20 w-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-2">
            إنشاء حساب جديد
          </h2>
          <p className="text-purple-100">
            انضم إلى رحلتك في تعلم سيرة الرسول والصحابة
          </p>
        </motion.div>

        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10"
          variants={itemVariants}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <div className="relative z-0 mb-6 group">
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-500 focus:outline-none focus:ring-0 focus:border-purple-400 peer ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder=" "
                  />
                  <label 
                    htmlFor="email" 
                    className="peer-focus:font-medium absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 right-0 origin-[0] peer-focus:text-purple-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    البريد الإلكتروني
                  </label>
                  <div className="absolute left-0 bottom-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300 flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="relative z-0 mb-6 group">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-500 focus:outline-none focus:ring-0 focus:border-purple-400 peer ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    placeholder=" "
                  />
                  <label 
                    htmlFor="password" 
                    className="peer-focus:font-medium absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 right-0 origin-[0] peer-focus:text-purple-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-0 bottom-2 text-gray-400 hover:text-white focus:outline-none transition-colors duration-200"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {errors.password ? (
                  <p className="mt-1 text-sm text-red-300 flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">قوة كلمة المرور:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className={`h-2 rounded-full ${passwordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.strength}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      ></motion.div>
                    </div>
                    <ul className="grid grid-cols-2 gap-1 text-xs text-gray-400 mt-2">
                      <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-400' : ''}`}>
                        <svg className={`w-3 h-3 ml-1 ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {formData.password.length >= 8 ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                        8 أحرف على الأقل
                      </li>
                      <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-400' : ''}`}>
                        <svg className={`w-3 h-3 ml-1 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {/[A-Z]/.test(formData.password) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                        حرف كبير واحد على الأقل
                      </li>
                      <li className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-400' : ''}`}>
                        <svg className={`w-3 h-3 ml-1 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {/[0-9]/.test(formData.password) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                        رقم واحد على الأقل
                      </li>
                      <li className={`flex items-center ${/[!@#$%^&*]/.test(formData.password) ? 'text-green-400' : ''}`}>
                        <svg className={`w-3 h-3 ml-1 ${/[!@#$%^&*]/.test(formData.password) ? 'text-green-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {/[!@#$%^&*]/.test(formData.password) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                        رمز خاص
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                تأكيد كلمة المرور
              <motion.div variants={itemVariants}>
              <div className="relative z-0 mb-6 group">
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-500 focus:outline-none focus:ring-0 focus:border-purple-400 peer ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder=" "
                  />
                  <label 
                    htmlFor="confirmPassword" 
                    className="peer-focus:font-medium absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 right-0 origin-[0] peer-focus:text-purple-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    تأكيد كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-0 bottom-2 text-gray-400 hover:text-white focus:outline-none transition-colors duration-200"
                    aria-label={showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {errors.confirmPassword ? (
                  <p className="mt-1 text-sm text-red-300 flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                ) : formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? (
                  <p className="mt-1 text-sm text-yellow-300 flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    كلمات المرور غير متطابقة
                  </p>
                ) : formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? (
                  <p className="mt-1 text-sm text-green-400 flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    كلمات المرور متطابقة
                  </p>
                ) : null}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="mr-2">جاري إنشاء الحساب...</span>
                  </div>
                ) : (
                  <>
                    <span>إنشاء حساب</span>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </>
                )}
              </button>
            </motion.div>
          </form>

          <motion.div 
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <p className="text-sm text-gray-300">
              لديك حساب بالفعل؟{' '}
              <Link 
                to="/login" 
                className="font-medium text-purple-300 hover:text-white transition-colors duration-200"
              >
                سجل الدخول هنا
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg"
          variants={itemVariants}
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 text-white p-2 rounded-lg mr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </span>
            مزايا الانضمام
          </h3>
          <ul className="space-y-3">
            {[
              { text: 'تتبع تقدمك التعليمي', icon: '📊' },
              { text: 'الحصول على نقاط خبرة ومكافآت', icon: '🏆' },
              { text: 'حفظ القصص المفضلة', icon: '❤️' },
              { text: 'الوصول لمحتوى حصري', icon: '🔒' },
              { text: 'مشاركة إنجازاتك مع الآخرين', icon: '👥' }
            ].map((feature, index) => (
              <motion.li 
                key={index}
                className="flex items-center text-gray-200 text-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="ml-2 text-yellow-300">{feature.icon}</span>
                {feature.text}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Terms */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <p className="text-xs text-gray-400">
            بإنشاء حساب، فإنك توافق على{' '}
            <Link 
              to="/terms" 
              className="text-purple-300 hover:text-white transition-colors duration-200"
            >
              الشروط والأحكام
            </Link>
            {' '}و{' '}
            <Link 
              to="/privacy" 
              className="text-purple-300 hover:text-white transition-colors duration-200"
            >
              سياسة الخصوصية
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Signup
