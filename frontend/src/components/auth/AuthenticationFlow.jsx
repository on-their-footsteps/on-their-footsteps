import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import GuestService from '../../services/guestService';
import GuestMode from './GuestMode';
import './AuthenticationFlow.css';

const AuthenticationFlow = () => {
  const { login, register, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState('choice'); // choice, guest, login, register, guest-mode
  const [formData, setFormData] = useState({});
  const [guestService] = useState(() => new GuestService());
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  const handleGuestMode = async () => {
    const result = await guestService.initializeGuestMode();
    if (result.success) {
      setIsGuestMode(true);
      setMode('guest-mode');
    }
  };

  const handleExitGuestMode = () => {
    guestService.exitGuestMode();
    setIsGuestMode(false);
    setMode('choice');
  };

  const handleStartLearning = () => {
    window.location.href = '/learning-paths';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login({
      email: formData.email,
      password: formData.password,
      isGuest: false
    });
    if (result.success) {
      window.location.href = '/dashboard';
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const result = await register({
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      username: formData.username,
      gender: formData.gender,
      companion_character_id: selectedCompanion?.id,
      selected_path: selectedPath?.name
    });
    if (result.success) {
      window.location.href = '/dashboard';
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const renderChoiceMode = () => (
    <div className="auth-choice">
      <div className="auth-header">
        <h1>مرحباً بك في تطبيق "على خُطاهم" 🔐</h1>
        <p>اختر طريقة الدخول لبدء رحلة التعلم</p>
      </div>
      
      <div className="choice-buttons">
        <button 
          className="choice-btn guest-btn"
          onClick={() => setMode('guest')}
          disabled={loading}
        >
          <div className="btn-icon">👤</div>
          <div className="btn-content">
            <h3>وضع الضيف</h3>
            <p>تتصفح المحتوى بدون حفظ التقدم</p>
          </div>
        </button>

        <button 
          className="choice-btn login-btn"
          onClick={() => setMode('login')}
          disabled={loading}
        >
          <div className="btn-icon">🔑</div>
          <div className="btn-content">
            <h3>تسجيل الدخول</h3>
            <p>لديك حساب بالفعل؟ سجل دخولك</p>
          </div>
        </button>

        <button 
          className="choice-btn register-btn"
          onClick={() => setMode('register')}
          disabled={loading}
        >
          <div className="btn-icon">✨</div>
          <div className="btn-content">
            <h3>إنشاء حساب جديد</h3>
            <p>انضم إلينا وابدأ رحلتك التعليمية</p>
          </div>
        </button>
      </div>

      <div className="auth-features">
        <h3>مميزات التطبيق 🌟</h3>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📚</span>
            <span>تعلم التاريخ الإسلامي</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎮</span>
            <span>أنشطة تفاعلية ممتعة</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏆</span>
            <span>نظام الإنجازات والمكافآت</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🦉</span>
            <span>مرافق كرتوني في الرحلة</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuestMode = () => (
    <div className="auth-guest">
      <div className="auth-header">
        <h2>وضع الضيف 👤</h2>
        <p>ستتمكن من تصفح المحتوى ولكن لن يتم حفظ تقدمك</p>
      </div>

      <div className="guest-limitations">
        <h3>مفيش ❌:</h3>
        <ul>
          <li>حفظ البروجريس</li>
          <li>هيستوري التعلم</li>
          <li>بروفايل شخصي</li>
          <li>إنجازات وشارات</li>
        </ul>
      </div>

      <div className="guest-actions">
        <button 
          className="btn btn-primary"
          onClick={handleGuestMode}
          disabled={loading}
        >
          {loading ? 'جاري الدخول...' : 'دخول كضيف'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => setMode('choice')}
          disabled={loading}
        >
          العودة
        </button>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="auth-login">
      <div className="auth-header">
        <h2>تسجيل الدخول 🔑</h2>
        <p>أدخل بيانات حسابك للدخول</p>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">البريد الإلكتروني</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">كلمة المرور</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password || ''}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
          
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => setMode('choice')}
            disabled={loading}
          >
            العودة
          </button>
        </div>
      </form>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="auth-register">
      <div className="auth-header">
        <h2>إنشاء حساب جديد ✨</h2>
        <p>انضم إلينا وابدأ رحلتك في تعلم التاريخ الإسلامي</p>
      </div>

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">الاسم الكامل</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName || ''}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">اسم المستخدم (اختياري)</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ''}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">البريد الإلكتروني</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">كلمة المرور</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password || ''}
            onChange={handleInputChange}
            required
            minLength="8"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">الجنس</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender || ''}
            onChange={handleInputChange}
            required
            disabled={loading}
          >
            <option value="">اختر...</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
          
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => setMode('choice')}
            disabled={loading}
          >
            العودة
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="authentication-flow">
      <div className="auth-container">
        {mode === 'choice' && renderChoiceMode()}
        {mode === 'guest' && renderGuestMode()}
        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'guest-mode' && (
          <GuestMode 
            onExit={handleExitGuestMode}
            onStartLearning={handleStartLearning}
          />
        )}
      </div>
    </div>
  );
};

export default AuthenticationFlow;
