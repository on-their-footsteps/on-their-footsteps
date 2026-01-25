import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaTrophy, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { dispatch } = useGamification();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/levels/quiz/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${authUser?.token}`
          }
        });
        
        setQuiz(response.data);
        if (response.data.time_limit) {
          setTimeLeft(response.data.time_limit * 60); // Convert minutes to seconds
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('فشل تحميل الكويز');
      } finally {
        setLoading(false);
      }
    };

    if (authUser?.token) {
      fetchQuiz();
    }
  }, [quizId, authUser]);

  // Timer effect
  useEffect(() => {
    if (!quiz?.time_limit || quizCompleted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, quizCompleted]);

  const handleTimeUp = () => {
    toast.warning('انتهى الوقت! سيتم تقديم إجاباتك الحالية.');
    handleSubmit();
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    // Check if answer is correct
    const currentQ = quiz.questions[currentQuestion];
    if (selectedAnswer === currentQ.correct_answer) {
      setScore(prev => prev + 1);
    }
    
    // Move to next question or finish quiz
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/levels/complete-quiz/${quizId}`,
        {
          answers: quiz.questions.map((q, idx) => 
            idx === currentQuestion ? selectedAnswer : null
          )
        },
        {
          headers: {
            'Authorization': `Bearer ${authUser?.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { score: finalScore, passed, xp_earned, leveled_up, new_level } = response.data;
      
      setScore(finalScore);
      setXpEarned(xp_earned);
      setLeveledUp(leveled_up);
      setNewLevel(new_level);
      
      // Update global state
      if (xp_earned > 0) {
        dispatch({ type: 'ADD_XP', payload: xp_earned });
      }
      
      if (passed) {
        dispatch({ type: 'COMPLETE_QUIZ' });
        
        // Check for achievements
        if (finalScore === 100) {
          dispatch({
            type: 'UNLOCK_ACHIEVEMENT',
            payload: {
              id: `perfect_score_${quizId}`,
              title: 'درجة كاملة!',
              description: `حصلت على درجة كاملة في اختبار ${quiz.title}`,
              icon: 'star',
              xp: 50
            }
          });
        }
      }
      
      setShowResult(true);
      setQuizCompleted(true);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('حدث خطأ أثناء تقديم الإجابات');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-700">لم يتم العثور على الكويز</h2>
        <button 
          onClick={() => navigate('/levels')}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          العودة إلى المستويات
        </button>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const isCorrect = selectedAnswer === currentQ.correct_answer;
  const showFeedback = showResult && currentQuestion < quiz.questions.length;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
          {timeLeft !== null && (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + (showResult ? 1 : 0)) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1 text-left">
            السؤال {currentQuestion + 1} من {quiz.questions.length}
          </div>
        </div>
        
        {!quizCompleted ? (
          <>
            {/* Question */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-right">{currentQ.question}</h2>
              
              {/* Answer Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === currentQ.correct_answer;
                  let optionClass = "p-4 border rounded-lg cursor-pointer transition-colors ";
                  
                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      optionClass += "bg-green-100 border-green-300";
                    } else if (isSelected && !isCorrect) {
                      optionClass += "bg-red-100 border-red-300";
                    } else {
                      optionClass += "bg-gray-50 hover:bg-gray-100";
                    }
                  } else {
                    optionClass += isSelected 
                      ? "bg-blue-50 border-blue-300" 
                      : "bg-white hover:bg-gray-50";
                  }
                  
                  return (
                    <motion.div
                      key={index}
                      className={optionClass}
                      onClick={() => !showFeedback && handleAnswerSelect(index)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center ${
                          showFeedback 
                            ? isCorrectAnswer 
                              ? 'bg-green-500 border-green-600 text-white' 
                              : isSelected 
                                ? 'bg-red-500 border-red-600 text-white' 
                                : 'border-gray-300'
                            : isSelected 
                              ? 'bg-blue-500 border-blue-600' 
                              : 'border-gray-300'
                        }`}>
                          {showFeedback ? (
                            isCorrectAnswer ? (
                              <FaCheckCircle size={14} />
                            ) : isSelected ? (
                              <FaTimesCircle size={14} />
                            ) : null
                          ) : null}
                        </div>
                        <span className="text-right flex-1">{option}</span>
                      </div>
                      
                      {showFeedback && isCorrectAnswer && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded"
                        >
                          {currentQ.explanation || 'إجابة صحيحة!'}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(prev => prev - 1);
                    setSelectedAnswer(null);
                  }
                }}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 rounded-lg ${currentQuestion === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                السابق
              </button>
              
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className={`px-6 py-2 rounded-lg flex items-center ${selectedAnswer === null ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isLastQuestion ? 'إنهاء الاختبار' : 'التالي'}
                <FaArrowRight className="mr-2" />
              </button>
            </div>
          </>
        ) : (
          /* Quiz Results */
          <div className="text-center py-8">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6 rounded-2xl inline-block mb-6">
              <FaTrophy className="text-5xl text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {score >= quiz.passing_score ? 'تهانينا!' : 'حاول مرة أخرى'}
              </h2>
              <p className="text-gray-600 mb-4">
                {score >= quiz.passing_score 
                  ? 'لقد أكملت الاختبار بنجاح!' 
                  : 'لم تحصل على النجاح هذه المرة. يمكنك المحاولة مرة أخرى.'}
              </p>
              
              <div className="bg-white rounded-lg p-4 shadow-sm inline-block mb-4">
                <div className="text-4xl font-bold text-blue-600">{score}%</div>
                <div className="text-sm text-gray-500">درجتك</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <FaStar className="text-yellow-500 mr-2" />
                  <span className="font-bold">+{xpEarned} XP</span>
                </div>
                {leveledUp && newLevel && (
                  <div className="mt-2 text-green-700 font-medium">
                    لقد وصلت إلى المستوى {newLevel.level}!
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إعادة المحاولة
              </button>
              
              <button
                onClick={() => navigate('/levels')}
                className="block w-full px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                العودة إلى المستويات
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Quiz Instructions */}
      {!quizCompleted && (
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-6">
          <h3 className="font-bold mb-2">تعليمات:</h3>
          <ul className="list-disc pr-5 space-y-1">
            <li>اختر الإجابة الصحيحة لكل سؤال</li>
            <li>يجب الإجابة على جميع الأسئلة</li>
            <li>لن تتمكن من العودة إلى السؤال السابق بعد الإجابة عليه</li>
            {quiz.time_limit && (
              <li>الوقت المتبقي: {formatTime(timeLeft)}</li>
            )}
            <li>درجة النجاح: {quiz.passing_score}%</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Quiz;
