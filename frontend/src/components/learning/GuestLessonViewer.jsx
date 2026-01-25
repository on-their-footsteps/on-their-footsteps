import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuestService from '../../services/guestService';
import './GuestLessonViewer.css';

const GuestLessonViewer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBrief, setShowBrief] = useState(true);
  const [guestService] = useState(() => new GuestService());
  const [companionMessage, setCompanionMessage] = useState('');

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      // Mock lesson data for guest mode
      const mockLesson = {
        id: parseInt(lessonId),
        title: "The Story of Prophet Adam",
        arabic_title: "قصة سيدنا آدم",
        description: "Learn about the first human and prophet",
        duration: 15,
        has_quiz: true,
        content: {
          introduction: "آدم هو أول البشر وأول الأنبياء. خلقه الله بيديه وأسجد له الملائكة.",
          main_content: `
            <h3>خلق آدم عليه السلام</h3>
            <p>خلق الله سيدنا آدم من طين، وأسجد له الملائكة تكريماً له، لكن إبليس استكبر ورفض السجود.</p>
            
            <h3>في الجنة</h3>
            <p>أسكن الله آدم وحواء في الجنة، وأباح لهما كل شيء إلا شجرة واحدة.</p>
            
            <h3>الأكل من الشجرة المحرمة</h3>
            <p>وسوس لهما الشيطان فأكلا من الشجرة، فأنزلهما الله إلى الأرض.</p>
            
            <h3>التوبة والغفران</h3>
            <p>تاب آدم وحواء إلى الله، فقبل الله توبتهما وغفر لهما.</p>
          `,
          moral: "قصة آدم تعلمنا أهمية التوبة والعودة إلى الله، وأن باب التوبة مفتوح دائماً للمؤمنين.",
          interactive_elements: ["reflection", "timeline"]
        }
      };
      
      setLesson(mockLesson);
      generateCompanionMessage(mockLesson);
      
      // Track lesson view for guest
      guestService.trackLessonView(parseInt(lessonId));
      
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCompanionMessage = (lesson) => {
    const messages = [
      `هيا بنا نتعرف على قصة ${lesson.arabic_title}! قصة ممتعة انتظرك!`,
      `يا سلام! الدرس الجاي عن ${lesson.arabic_title}، هل أنت مستعد للمغامرة؟`,
      `ممتع! هنتعلم النهارده عن ${lesson.arabic_title}، قصة مهمة جداً!`,
      `أكيد هتحب القصة الجاية! هنتعلم عن ${lesson.arabic_title}`
    ];
    
    setCompanionMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const handleStartLesson = () => {
    setShowBrief(false);
  };

  const handleCompleteLesson = () => {
    // Show guest mode message instead of saving progress
    alert('شكراً لمشاهدة الدرس! في وضع الضيف، لا يتم حفظ التقدم. سجل دخولك لتتبع تقدمك!');
    navigate('/guest-learning-paths');
  };

  const renderGuestNotice = () => (
    <div className="guest-notice">
      <div className="notice-content">
        <span className="notice-icon">👤</span>
        <div className="notice-text">
          <h3>وضع الضيف</h3>
          <p>أنت تشاهد هذا الدرس في وضع الضيف - لا يتم حفظ التقدم</p>
        </div>
      </div>
    </div>
  );

  const renderLessonBrief = () => (
    <div className="lesson-brief">
      <div className="brief-container">
        {renderGuestNotice()}
        
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
              <p>{lesson?.arabic_title || lesson?.title}</p>
              <p>{lesson?.description}</p>
            </div>

            <div className="info-item">
              <h3>الدرس مدته قد إيه؟</h3>
              <p>⏱️ حوالي {lesson?.duration || 15} دقيقة</p>
            </div>

            <div className="info-item">
              <h3>هل فيه كويز في الآخر؟</h3>
              <p>{lesson?.has_quiz ? '📝 نعم، فيه كويز صغير في الآخر' : '📖 لا، مجرد قراءة ومتعة'}</p>
            </div>
          </div>

          <div className="brief-example">
            <h3>مثال:</h3>
            <p>"النهارده هنتعلم إزاي سيدنا آدم تاب، وليه ربنا قبل توبته"</p>
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
              onClick={() => navigate('/guest-learning-paths')}
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
        {renderGuestNotice()}
        
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
        <div className="guest-reminder">
          <h4>تذكير وضع الضيف</h4>
          <p>لن يتم حفظ تقدمك في هذا الدرس. سجل دخولك لتتبع تعلمك!</p>
        </div>
        
        <div className="footer-actions">
          <button 
            className="btn btn-success btn-large"
            onClick={handleCompleteLesson}
          >
            أنهيت المشاهدة ✅
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/guest-learning-paths')}
          >
            العودة للمسارات
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="guest-lesson-viewer loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>جاري تحميل الدرس...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-lesson-viewer">
      {showBrief ? renderLessonBrief() : renderLessonContent()}
    </div>
  );
};

export default GuestLessonViewer;
