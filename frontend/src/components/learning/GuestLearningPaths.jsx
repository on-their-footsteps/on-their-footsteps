import React, { useState, useEffect } from 'react';
import GuestService from '../../services/guestService';
import './GuestLearningPaths.css';

const GuestLearningPaths = () => {
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestService] = useState(() => new GuestService());

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      // For guest mode, we can use mock data or public API
      // Since guest doesn't have authentication, we'll use mock data
      const mockPaths = [
        {
          id: 1,
          name: "Chronological Islamic History",
          arabic_name: "التاريخ الإسلامي الزمني",
          description: "تعلم التاريخ الإسلامي بالترتيب الزمني من سيدنا آدم إلى يومنا هذا",
          cover_image: "/images/paths/history.jpg"
        },
        {
          id: 2,
          name: "Character-based Learning",
          arabic_name: "التعلم من خلال الشخصيات",
          description: "تعلم من خلال حياة الشخصيات الإسلامية المهمة",
          cover_image: "/images/paths/characters.jpg"
        }
      ];
      
      setPaths(mockPaths);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePathSelect = async (pathId) => {
    try {
      const path = paths.find(p => p.id === pathId);
      setSelectedPath(path);
      guestService.setCurrentPath(path);
      await fetchPathLessons(pathId);
    } catch (error) {
      console.error('Error selecting path:', error);
    }
  };

  const fetchPathLessons = async (pathId) => {
    try {
      // Mock lessons for guest mode
      const mockLessons = [
        {
          id: 1,
          title: "The Story of Prophet Adam",
          arabic_title: "قصة سيدنا آدم",
          description: "Learn about the first human and prophet",
          duration: 15,
          has_quiz: true,
          sort_order: 1
        },
        {
          id: 2,
          title: "The Story of Prophet Noah",
          arabic_title: "قصة سيدنا نوح",
          description: "Learn about Noah's patience and the great flood",
          duration: 20,
          has_quiz: true,
          sort_order: 2
        },
        {
          id: 3,
          title: "The Story of Prophet Abraham",
          arabic_title: "قصة سيدنا إبراهيم",
          description: "Learn about the father of prophets",
          duration: 25,
          has_quiz: true,
          sort_order: 3
        }
      ];
      
      setLessons(mockLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleLessonClick = async (lessonId) => {
    try {
      // Track lesson view for guest
      guestService.trackLessonView(lessonId);
      
      // Navigate to lesson viewer
      window.location.href = `/guest-lesson/${lessonId}`;
    } catch (error) {
      console.error('Error loading lesson:', error);
    }
  };

  const renderGuestNotice = () => (
    <div className="guest-notice">
      <div className="notice-content">
        <span className="notice-icon">👤</span>
        <div className="notice-text">
          <h3>أنت في وضع الضيف</h3>
          <p>يمكنك تصفح المحتوى بحرية، ولكن لن يتم حفظ تقدمك</p>
        </div>
      </div>
    </div>
  );

  const renderPathSelection = () => (
    <div className="paths-selection">
      <div className="section-header">
        <h2>اختر مسار التعلم 🧭</h2>
        <p>استكشف المحتوى التعليمي المتاح (وضع الضيف)</p>
      </div>

      <div className="paths-grid">
        {paths.map((path) => (
          <div 
            key={path.id} 
            className={`path-card ${selectedPath?.id === path.id ? 'selected' : ''}`}
            onClick={() => handlePathSelect(path.id)}
          >
            <div className="path-image">
              <img 
                src={path.cover_image || '/images/default-path.jpg'} 
                alt={path.arabic_name}
                onError={(e) => e.target.src = '/images/default-path.jpg'}
              />
            </div>
            <div className="path-content">
              <h3>{path.arabic_name}</h3>
              <p>{path.description}</p>
              <button className="btn-select-path">
                {selectedPath?.id === path.id ? 'المسار المختار' : 'استكشف هذا المسار'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLessonsList = () => (
    <div className="lessons-container">
      <div className="section-header">
        <h2>{selectedPath?.arabic_name}</h2>
        <p>الدروس المتاحة في هذا المسار (وضع الضيف)</p>
        <button 
          className="btn-back"
          onClick={() => {
            setSelectedPath(null);
            setLessons([]);
          }}
        >
          العودة للمسارات
        </button>
      </div>

      <div className="lessons-list">
        {lessons.map((lesson, index) => {
          const isViewed = guestService.hasViewedLesson(lesson.id);
          
          return (
            <div 
              key={lesson.id} 
              className={`lesson-item ${isViewed ? 'viewed' : ''}`}
              onClick={() => handleLessonClick(lesson.id)}
            >
              <div className="lesson-number">
                {index + 1}
              </div>
              <div className="lesson-content">
                <h3>{lesson.arabic_title || lesson.title}</h3>
                <p>{lesson.description}</p>
                <div className="lesson-meta">
                  <span className="duration">⏱️ {lesson.duration} دقيقة</span>
                  {lesson.has_quiz && <span className="quiz">📝 كويز</span>}
                  {isViewed && <span className="viewed-badge">✅ تمت المشاهدة</span>}
                </div>
              </div>
              <div className="lesson-status">
                {isViewed ? (
                  <span className="status-icon viewed">👁️</span>
                ) : (
                  <span className="status-icon available">▶️</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="guest-reminder">
        <h4>تذكير وضع الضيف</h4>
        <ul>
          <li>❌ لا يتم حفظ التقدم</li>
          <li>❌ لا يتم حفظ سجل المشاهدة</li>
          <li>❌ لا يمكن كسب الإنجازات</li>
        </ul>
        <p>سجل دخولك أو أنشئ حساب جديد لتتبع تقدمك!</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="guest-learning-paths loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-learning-paths">
      {renderGuestNotice()}
      <div className="container">
        {!selectedPath ? renderPathSelection() : renderLessonsList()}
      </div>
    </div>
  );
};

export default GuestLearningPaths;
