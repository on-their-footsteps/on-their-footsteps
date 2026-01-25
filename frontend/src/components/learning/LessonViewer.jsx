import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LessonViewer.css';

const LessonViewer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [lessonBrief, setLessonBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBrief, setShowBrief] = useState(true);
  const [companionMessage, setCompanionMessage] = useState('');

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch lesson brief first
      const briefResponse = await fetch(`/api/learning-paths/lessons/${lessonId}/brief`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (briefResponse.ok) {
        const brief = await briefResponse.json();
        setLessonBrief(brief);
        generateCompanionMessage(brief);
      }
      
      // Fetch full lesson details
      const lessonResponse = await fetch(`/api/learning-paths/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();
        setLesson(lessonData);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCompanionMessage = (brief) => {
    const messages = [
      `يا سلام! هنتعلم النهارده عن ${brief.arabic_title || brief.title}! هل أنت مستعد؟`,
      `ممتع! الدرس الجاي حيكون عن ${brief.arabic_title || brief.title}، درس مهم جداً!`,
      `هيا بنا! النهارده هنتعلم إزاي ${brief.arabic_title || brief.title}، قصة ممتعة بتنتظرنا!`,
      `أكيد هتحب الدرس الجاي! هنتعلم عن ${brief.arabic_title || brief.title}`
    ];
    
    setCompanionMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const handleStartLesson = () => {
    setShowBrief(false);
  };

  const handleCompleteLesson = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/learning-paths/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_completed: true,
          score: 85.0, // Default score for lesson completion
          time_spent: 600 // 10 minutes in seconds
        })
      });
      
      if (response.ok) {
        // Navigate back to learning paths
        navigate('/learning-paths');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const renderLessonBrief = () => (
    <div className="lesson-brief">
      <div className="brief-container">
        <div className="companion-message">
          <div className="companion-avatar">
            🦉
          </div>
          <div className="message-bubble">
            {companionMessage}
          </div>
        </div>

        <div className="brief-content">
          <h2>قبل ما ندخل الدرس 📚</h2>
          
          <div className="brief-info">
            <div className="info-item">
              <h3>إنت هتتعلم إيه؟</h3>
              <p>{lessonBrief?.arabic_title || lessonBrief?.title}</p>
              <p>{lessonBrief?.description}</p>
            </div>

            <div className="info-item">
              <h3>الدرس مدته قد إيه؟</h3>
              <p>⏱️ حوالي {lessonBrief?.duration || 15} دقيقة</p>
            </div>

            <div className="info-item">
              <h3>هل فيه كويز في الآخر؟</h3>
              <p>{lessonBrief?.has_quiz ? '📝 نعم، فيه كويز صغير في الآخر' : '📖 لا، مجرد قراءة ومتعة'}</p>
            </div>

            {lessonBrief?.character_arabic_name && (
              <div className="info-item">
                <h3>الشخصية الرئيسية</h3>
                <p>👤 {lessonBrief.character_arabic_name}</p>
              </div>
            )}
          </div>

          <div className="brief-example">
            <h3>مثال:</h3>
            <p>"النهارده هنتعلم إزاي سيدنا نوح صبر، وليه ربنا أنجاه بالسفينة"</p>
          </div>

          <div className="brief-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={handleStartLesson}
            >
              ابدأ الدرس 🚀
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/learning-paths')}
            >
              العودة للمسارات
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLessonContent = () => (
    <div className="lesson-content">
      <div className="lesson-header">
        <button 
          className="btn-back"
          onClick={() => setShowBrief(true)}
        >
          العودة للملخص
        </button>
        
        <h1>{lesson?.arabic_title || lesson?.title}</h1>
        <p>{lesson?.description}</p>
      </div>

      <div className="lesson-body">
        {lesson?.content && (
          <div className="content-sections">
            {lesson.content.introduction && (
              <section className="content-section">
                <h2>مقدمة</h2>
                <p>{lesson.content.introduction}</p>
              </section>
            )}

            {lesson.content.main_content && (
              <section className="content-section">
                <h2>المحتوى الرئيسي</h2>
                <div dangerouslySetInnerHTML={{ __html: lesson.content.main_content }} />
              </section>
            )}

            {lesson.content.moral && (
              <section className="content-section">
                <h2>العبرة والموعظة</h2>
                <p>{lesson.content.moral}</p>
              </section>
            )}

            {lesson.content.interactive_elements && (
              <section className="content-section">
                <h2>أنشطة تفاعلية</h2>
                <div className="interactive-elements">
                  {lesson.content.interactive_elements.map((element, index) => (
                    <div key={index} className="interactive-item">
                      <span className="element-icon">
                        {element === 'drag_drop' && '🎯'}
                        {element === 'timeline' && '📅'}
                        {element === 'quiz' && '📝'}
                        {element === 'video' && '🎬'}
                        {element === 'reflection' && '💭'}
                      </span>
                      <span className="element-name">
                        {element === 'drag_drop' && 'سحب وإفلات'}
                        {element === 'timeline' && 'الخط الزمني'}
                        {element === 'quiz' && 'اختبار'}
                        {element === 'video' && 'فيديو'}
                        {element === 'reflection' && 'تأمل'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <div className="lesson-footer">
        <button 
          className="btn btn-success btn-large"
          onClick={handleCompleteLesson}
        >
          أكملت الدرس ✅
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/learning-paths')}
        >
          العودة للمسارات
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="lesson-viewer loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>جاري تحميل الدرس...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-viewer">
      {showBrief ? renderLessonBrief() : renderLessonContent()}
    </div>
  );
};

export default LessonViewer;
