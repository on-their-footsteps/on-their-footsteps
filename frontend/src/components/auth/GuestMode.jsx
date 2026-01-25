import React, { useState, useEffect } from 'react';
import GuestService from '../../services/guestService';
import './GuestMode.css';

const GuestMode = ({ onExit, onStartLearning }) => {
  const [guestService] = useState(() => new GuestService());
  const [guestStats, setGuestStats] = useState(null);
  const [showLimitations, setShowLimitations] = useState(true);

  useEffect(() => {
    // Restore guest session if exists
    guestService.restoreGuestSession();
    
    // Update stats every 30 seconds
    const interval = setInterval(() => {
      if (guestService.isInGuestMode()) {
        setGuestStats(guestService.getGuestStats());
      }
    }, 30000);

    // Initial stats
    if (guestService.isInGuestMode()) {
      setGuestStats(guestService.getGuestStats());
    }

    return () => clearInterval(interval);
  }, [guestService]);

  const handleExitGuestMode = () => {
    guestService.exitGuestMode();
    onExit();
  };

  const handleStartLearning = () => {
    onStartLearning();
  };

  const limitations = guestService.getLimitations();

  return (
    <div className="guest-mode">
      <div className="guest-header">
        <div className="guest-badge">
          <span className="guest-icon">👤</span>
          <span className="guest-text">وضع الضيف</span>
        </div>
        
        <button 
          className="btn-exit-guest"
          onClick={handleExitGuestMode}
          title="خروج من وضع الضيف"
        >
          <span>🚪</span>
          <span>خروج</span>
        </button>
      </div>

      {showLimitations && (
        <div className="limitations-notice">
          <div className="notice-header">
            <h3>مرحباً بك في وضع الضيف 👋</h3>
            <button 
              className="btn-close-notice"
              onClick={() => setShowLimitations(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="limitations-content">
            <p>أنت الآن في وضع الضيف، يمكنك تصفح المحتوى بحرية ولكن:</p>
            
            <div className="limitations-list">
              <div className="limitation-item">
                <span className="limitation-icon">❌</span>
                <span>مفيش حفظ بروجريس</span>
              </div>
              <div className="limitation-item">
                <span className="limitation-icon">❌</span>
                <span>مفيش هيستوري للتعلم</span>
              </div>
              <div className="limitation-item">
                <span className="limitation-icon">❌</span>
                <span>مفيش بروفايل شخصي</span>
              </div>
              <div className="limitation-item">
                <span className="limitation-icon">❌</span>
                <span>مفيش إنجازات أو شارات</span>
              </div>
            </div>

            <div className="upgrade-prompt">
              <h4>تريد الحصول على تجربة كاملة؟</h4>
              <p>سجل دخولك أو أنشئ حساب جديد لحفظ تقدمك وكسب الإنجازات!</p>
              <button 
                className="btn btn-primary"
                onClick={handleExitGuestMode}
              >
                إنشاء حساب أو تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="guest-actions">
        <div className="action-card">
          <div className="action-icon">📚</div>
          <h3>تصفح الدروس</h3>
          <p>استكشف جميع الدروس والمحتوى التعليمي المتاح</p>
          <button 
            className="btn btn-secondary"
            onClick={handleStartLearning}
          >
            بدء التعلم
          </button>
        </div>

        <div className="action-card">
          <div className="action-icon">👥</div>
          <h3>تعرف على الشخصيات</h3>
          <p>اقرأ عن الشخصيات الإسلامية المهمة وقصصهم</p>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/characters'}
          >
            استكشف الشخصيات
          </button>
        </div>
      </div>

      {guestStats && (
        <div className="guest-stats">
          <h4>إحصائيات الجلسة الحالية</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">الدروس المشاهدة</span>
              <span className="stat-value">{guestStats.lessonsViewed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">مدة الجلسة</span>
              <span className="stat-value">{guestStats.sessionDuration} دقيقة</span>
            </div>
            {guestStats.currentPath && (
              <div className="stat-item">
                <span className="stat-label">المسار الحالي</span>
                <span className="stat-value">{guestStats.currentPath}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="guest-footer">
        <div className="footer-info">
          <p>💡 <strong>نصيحة:</strong> يمكنك دائماً إنشاء حساب لاحقاً لحفظ تقدمك!</p>
        </div>
      </div>
    </div>
  );
};

export default GuestMode;
