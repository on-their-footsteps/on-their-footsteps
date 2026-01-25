import React, { useState, useEffect } from 'react';
import './LearningPaths.css';

const LearningPaths = () => {
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});

  useEffect(() => {
    fetchLearningPaths();
    fetchUserProgress();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/learning-paths/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaths(data);
      }
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/learning-paths/my-progress', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const progressMap = {};
        data.forEach(progress => {
          progressMap[progress.lesson_id] = progress;
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const handlePathSelect = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/learning-paths/select-path/${pathId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const path = paths.find(p => p.id === pathId);
        setSelectedPath(path);
        await fetchPathLessons(pathId);
      }
    } catch (error) {
      console.error('Error selecting path:', error);
    }
  };

  const fetchPathLessons = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/learning-paths/${pathId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleLessonClick = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/learning-paths/lessons/${lessonId}/brief`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const lessonBrief = await response.json();
        // Navigate to lesson view with brief
        window.location.href = `/lesson/${lessonId}`;
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    }
  };

  const renderPathSelection = () => (
    <div className="paths-selection">
      <div className="section-header">
        <h2>اختر مسار التعلم 🧭</h2>
        <p>الطفل يختار هو ماشي إزاي، مفيش فرض</p>
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
                {selectedPath?.id === path.id ? 'المسار المختار' : 'اختر هذا المسار'}
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
        <p>الدروس المتاحة في هذا المسار</p>
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
          const progress = userProgress[lesson.id];
          const isCompleted = progress?.is_completed;
          const isLocked = index > 0 && !userProgress[lessons[index - 1]?.id]?.is_completed;
          
          return (
            <div 
              key={lesson.id} 
              className={`lesson-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => !isLocked && handleLessonClick(lesson.id)}
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
                </div>
              </div>
              <div className="lesson-status">
                {isCompleted && <span className="status-icon completed">✅</span>}
                {isLocked && <span className="status-icon locked">🔒</span>}
                {!isCompleted && !isLocked && <span className="status-icon available">▶️</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="learning-paths loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-paths">
      <div className="container">
        {!selectedPath ? renderPathSelection() : renderLessonsList()}
      </div>
    </div>
  );
};

export default LearningPaths;
