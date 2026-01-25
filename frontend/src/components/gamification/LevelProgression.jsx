import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaLockOpen, FaTrophy, FaStar, FaArrowRight, FaCheck, FaTimes } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LevelProgression = () => {
  const { user: authUser } = useAuth();
  const { state, dispatch } = useGamification();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // Fetch levels and user progress
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/levels/`, {
          headers: {
            'Authorization': `Bearer ${authUser?.token}`
          }
        });
        setLevels(response.data);
      } catch (error) {
        console.error('Error fetching levels:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authUser?.token) {
      fetchLevels();
    }
  }, [authUser]);

  const isLevelUnlocked = (level) => {
    if (!state.user) return false;
    return state.user.current_xp >= level.xp_required;
  };

  const hasPassedQuiz = async (levelId) => {
    try {
      const response = await axios.get(`${API_URL}/api/levels/${levelId}/quiz/status`, {
        headers: {
          'Authorization': `Bearer ${authUser?.token}`
        }
      });
      return response.data.passed;
    } catch (error) {
      console.error('Error checking quiz status:', error);
      return false;
    }
  };

  const handleLevelClick = async (level) => {
    if (!isLevelUnlocked(level)) return;
    
    const passed = await hasPassedQuiz(level.id);
    if (!passed) {
      setSelectedLevel(level);
      setShowQuizModal(true);
    } else {
      // Level already completed, show details or navigate
      console.log('Level already completed:', level.name);
    }
  };

  const handleQuizComplete = async (result) => {
    setQuizResult(result);
    
    if (result.passed) {
      // Update user's level and XP
      dispatch({
        type: 'SET_USER_LEVEL',
        payload: {
          level: result.new_level.level,
          xp: result.new_xp
        }
      });
      
      // Show success message
      setTimeout(() => {
        setShowQuizModal(false);
        setQuizResult(null);
      }, 3000);
    }
  };

  const getLevelStatus = (level) => {
    if (!isLevelUnlocked(level)) return 'locked';
    if (hasPassedQuiz(level.id)) return 'completed';
    return 'unlocked';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-8">سجل تقدمك</h2>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 transform -translate-x-1/2"></div>
        
        <div className="space-y-12">
          {levels.map((level, index) => {
            const status = getLevelStatus(level);
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex ${isEven ? 'flex-row' : 'flex-row-reverse'} items-center`}
              >
                {/* Level Card */}
                <div 
                  className={`w-1/2 p-6 rounded-lg border-2 ${
                    status === 'completed' 
                      ? 'bg-green-50 border-green-300' 
                      : status === 'unlocked' 
                        ? 'bg-blue-50 border-blue-200 hover:border-blue-300 cursor-pointer' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleLevelClick(level)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">
                      {level.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{level.xp_required} XP</span>
                      {status === 'completed' ? (
                        <FaCheck className="text-green-500" />
                      ) : status === 'unlocked' ? (
                        <FaLockOpen className="text-blue-400" />
                      ) : (
                        <FaLock className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{level.description}</p>
                  
                  {status === 'unlocked' && (
                    <div className="mt-3 text-sm text-blue-600 font-medium">
                      إختبار مطلوب للانتقال للمستوى التالي
                    </div>
                  )}
                </div>
                
                {/* Level Indicator */}
                <div className={`absolute ${
                  isEven ? '-right-1' : '-left-1'
                } w-8 h-8 rounded-full flex items-center justify-center ${
                  status === 'completed' 
                    ? 'bg-green-500 text-white' 
                    : status === 'unlocked' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {status === 'completed' ? (
                    <FaCheck size={14} />
                  ) : status === 'unlocked' ? (
                    <FaStar size={14} />
                  ) : (
                    <FaLock size={12} />
                  )}
                </div>
                
                {/* Level Number */}
                <div className={`absolute ${
                  isEven ? 'right-0' : 'left-0'
                } -top-8 text-sm font-bold text-gray-500`}>
                  المستوى {level.level}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuizModal && selectedLevel && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !quizResult && setShowQuizModal(false)}
          >
            <motion.div 
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    اختبار المستوى {selectedLevel.level}: {selectedLevel.name}
                  </h3>
                  {!quizResult && (
                    <button 
                      onClick={() => setShowQuizModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                
                {!quizResult ? (
                  <Quiz 
                    levelId={selectedLevel.id}
                    onComplete={handleQuizComplete}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                      quizResult.passed ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
                    } mb-6`}>
                      {quizResult.passed ? (
                        <FaCheck size={32} />
                      ) : (
                        <FaTimes size={32} />
                      )}
                    </div>
                    
                    <h4 className="text-2xl font-bold mb-2">
                      {quizResult.passed ? 'تهانينا!' : 'حاول مرة أخرى'}
                    </h4>
                    
                    <p className="text-gray-600 mb-6">
                      {quizResult.passed 
                        ? `لقد أكملت اختبار المستوى بنجاح! لقد ربحت ${quizResult.xp_earned} نقطة خبرة.`
                        : 'لم تحقق النتيجة المطلوبة. يمكنك المحاولة مرة أخرى.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">درجتك</div>
                        <div className="text-2xl font-bold">{quizResult.score}%</div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 mb-1">النقاط المكتسبة</div>
                        <div className="text-2xl font-bold text-blue-600">+{quizResult.xp_earned} XP</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowQuizModal(false);
                        setQuizResult(null);
                      }}
                      className="mt-8 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {quizResult.passed ? 'متابعة' : 'حاول مرة أخرى'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LevelProgression;
