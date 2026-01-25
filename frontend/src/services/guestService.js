/**
 * Guest Mode Service - Handles guest user functionality
 * Provides access to content without data persistence
 */

class GuestService {
  constructor() {
    this.isGuestMode = false;
    this.guestSessionId = null;
    this.guestData = {
      viewedLessons: [],
      currentPath: null,
      startTime: null
    };
  }

  /**
   * Initialize guest mode
   * @returns {Promise<Object>} Guest session data
   */
  async initializeGuestMode() {
    try {
      // Generate unique guest session ID
      this.guestSessionId = this.generateGuestId();
      this.guestData.startTime = new Date().toISOString();
      this.isGuestMode = true;

      // Store guest data in sessionStorage (not localStorage)
      sessionStorage.setItem('guestSession', JSON.stringify({
        sessionId: this.guestSessionId,
        startTime: this.guestData.startTime,
        isGuest: true
      }));

      // Call backend to create guest user
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: '',
          password: '',
          isGuest: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          user: data.user,
          token: data.access_token,
          sessionId: this.guestSessionId
        };
      } else {
        throw new Error('Failed to initialize guest mode');
      }
    } catch (error) {
      console.error('Guest mode initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize guest mode'
      };
    }
  }

  /**
   * Track lesson view for guest (stored in memory only)
   * @param {number} lessonId - Lesson ID
   */
  trackLessonView(lessonId) {
    if (!this.isGuestMode) return;

    if (!this.guestData.viewedLessons.includes(lessonId)) {
      this.guestData.viewedLessons.push(lessonId);
    }
  }

  /**
   * Get guest viewing history (session only)
   * @returns {Array} Array of viewed lesson IDs
   */
  getViewingHistory() {
    return this.guestData.viewedLessons;
  }

  /**
   * Check if guest has viewed a lesson
   * @param {number} lessonId - Lesson ID
   * @returns {boolean} Whether lesson was viewed
   */
  hasViewedLesson(lessonId) {
    return this.guestData.viewedLessons.includes(lessonId);
  }

  /**
   * Set current learning path for guest
   * @param {Object} path - Learning path object
   */
  setCurrentPath(path) {
    if (!this.isGuestMode) return;
    this.guestData.currentPath = path;
  }

  /**
   * Get current learning path
   * @returns {Object|null} Current path or null
   */
  getCurrentPath() {
    return this.guestData.currentPath;
  }

  /**
   * Get guest session duration
   * @returns {number} Duration in minutes
   */
  getSessionDuration() {
    if (!this.guestData.startTime) return 0;
    const start = new Date(this.guestData.startTime);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60));
  }

  /**
   * Check if currently in guest mode
   * @returns {boolean} Guest mode status
   */
  isInGuestMode() {
    return this.isGuestMode;
  }

  /**
   * Get guest limitations info
   * @returns {Object} Limitations information
   */
  getLimitations() {
    return {
      noProgressSaving: true,
      noHistorySaving: true,
      noProfileSaving: true,
      noAchievements: true,
      noBadges: true,
      noCompanionSelection: true,
      noPathSelection: true,
      sessionOnly: true
    };
  }

  /**
   * Show guest mode warning
   * @param {string} action - Action being attempted
   * @returns {boolean} Whether action should proceed
   */
  showGuestWarning(action) {
    const warnings = {
      progress: 'في وضع الضيف، لا يتم حفظ التقدم. هل تريد المتابعة؟',
      profile: 'في وضع الضيف، لا يمكن حفظ ملف التعريف. سجل دخولك للحصول على ملف تعريف شخصي.',
      achievements: 'في وضع الضيف، لا يمكنك كسب الإنجازات. سجل دخولك لتتبع إنجازاتك.',
      companion: 'في وضع الضيف، لا يمكنك اختيار مرافق. سجل دخولك لاختيار مرافقك.',
      path: 'في وضع الضيف، لا يتم حفظ المسار المختار.'
    };

    const message = warnings[action] || 'هذه الميزة غير متاحة في وضع الضيف.';
    
    // Show confirmation dialog
    return confirm(message);
  }

  /**
   * Exit guest mode
   */
  exitGuestMode() {
    this.isGuestMode = false;
    this.guestSessionId = null;
    this.guestData = {
      viewedLessons: [],
      currentPath: null,
      startTime: null
    };
    
    // Clear session storage
    sessionStorage.removeItem('guestSession');
    
    // Clear any authentication tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Generate unique guest ID
   * @returns {string} Unique guest ID
   */
  generateGuestId() {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Restore guest session from sessionStorage
   * @returns {boolean} Whether session was restored
   */
  restoreGuestSession() {
    try {
      const sessionData = sessionStorage.getItem('guestSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.isGuest) {
          this.guestSessionId = session.sessionId;
          this.guestData.startTime = session.startTime;
          this.isGuestMode = true;
          return true;
        }
      }
    } catch (error) {
      console.error('Error restoring guest session:', error);
    }
    return false;
  }

  /**
   * Get guest statistics (session only)
   * @returns {Object} Guest session statistics
   */
  getGuestStats() {
    return {
      lessonsViewed: this.guestData.viewedLessons.length,
      sessionDuration: this.getSessionDuration(),
      currentPath: this.guestData.currentPath?.name || null,
      startTime: this.guestData.startTime
    };
  }
}

export default GuestService;
