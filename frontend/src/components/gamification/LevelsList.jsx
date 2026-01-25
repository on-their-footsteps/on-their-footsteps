import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaLock, FaLockOpen, FaTrophy, FaCheck, FaStar, FaBook } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LevelsList = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const { user: authUser } = useAuth();
  const { state } = useGamification();
  const navigate = useNavigate();

  // Fetch levels and user progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsRes, progressRes] = await Promise.all([
          axios.get(`${API_URL}/api/levels/`),
          axios.get(`${API_URL}/api/levels/user/current`, {
            headers: {
              'Authorization': `Bearer ${authUser?.token}`
            }
          })
        ]);
        
        setLevels(levelsRes.data);
        setUserProgress(progressRes.data);
      } catch (error) {
        console.error('Error fetching levels:', error);
        toast.error('فشل تحميل المستويات');
      } finally {
        setLoading(false);
      }
    };

    if (authUser?.token) {
      fetchData();
    }
  }, [authUser]);

  const isLevelUnlocked = (level) => {
    if (!userProgress) return false;
    return userProgress.current_xp >= level.xp_required;
  };

  const getLevelProgress = (level) => {
    if (!userProgress) return 0;
    
    // If this is the current level, show progress to next level
    if (level.level === userProgress.current_level?.level) {
      return userProgress.progress_percentage || 0;
    }
    
    // If level is completed
    if (userProgress.current_xp >= level.xp_required) {
      return 100;
    }
    
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">المستويات التعليمية</h1>
        <p className="text-gray-600">اختر مستوى لبدء رحلتك التعليمية</p>
      </div>

      {/* User Progress Summary */}
      {userProgress && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 mb-10 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-right mb-4 md:mb-0">
              <div className="text-4xl font-bold">
                المستوى {userProgress.current_level?.level || 1}
              </div>
              <div className="text-blue-100">
                {userProgress.current_level?.name || 'مبتدئ'}
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="flex justify-between text-sm mb-1">
                <span>{userProgress.current_xp} XP</span>
                <span>{userProgress.next_level?.xp_required || userProgress.current_level?.xp_required * 2} XP</span>
              </div>
              <div className="w-full bg-blue-500 bg-opacity-50 rounded-full h-2.5">
                <div 
                  className="bg-white h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${userProgress.progress_percentage}%` }}
                ></div>
              </div>
              <div className="text-center text-blue-100 text-sm mt-2">
                {userProgress.next_level 
                  ? `${userProgress.xp_to_next_level} XP للوصول للمستوى ${userProgress.next_level.level}` 
                  : 'أعلى مستوى!'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Levels Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => {
          const isUnlocked = isLevelUnlocked(level);
          const progress = getLevelProgress(level);
          const isCurrentLevel = userProgress?.current_level?.id === level.id;
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-xl border-2 ${
                isCurrentLevel 
                  ? 'border-blue-500 shadow-lg' 
                  : isUnlocked 
                    ? 'border-gray-200 hover:border-blue-300' 
                    : 'border-gray-100 bg-gray-50'
              }`}
            >
              {/* Level Card */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                      isCurrentLevel 
                        ? 'bg-blue-500' 
                        : isUnlocked 
                          ? 'bg-green-500' 
                          : 'bg-gray-400'
                    }`}>
                      {isCurrentLevel ? (
                        <FaStar className="text-xl" />
                      ) : isUnlocked ? (
                        <FaCheck className="text-xl" />
                      ) : (
                        <FaLock className="text-xl" />
                      )}
                    </div>
                    <div className="mr-3">
                      <h3 className="font-bold text-lg">المستوى {level.level}</h3>
                      <span className="text-sm text-gray-500">{level.name}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {level.xp_required} XP
                    </div>
                    {isCurrentLevel && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        الحالي
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  {level.description || 'وصف المستوى'}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isUnlocked ? (isCurrentLevel ? '#3B82F6' : '#10B981') : '#9CA3AF'
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-left">
                    {progress}% مكتمل
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (isUnlocked) {
                        navigate(`/levels/${level.id}/quizzes`);
                      }
                    }}
                    disabled={!isUnlocked}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center ${
                      isUnlocked
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaBook className="ml-1" />
                    <span>الكويزات</span>
                  </button>
                </div>
              </div>
              
              {/* Level Badge */}
              {isCurrentLevel && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                  أنت هنا
                </div>
              )}
              
              {/* Lock Overlay */}
              {!isUnlocked && !isCurrentLevel && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                  <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                    <FaLock className="inline ml-1" />
                    مقفل
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Achievements Preview */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FaTrophy className="text-yellow-500 ml-2" />
          إنجازاتي
        </h2>
        
        {state.user.achievements?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.user.achievements.map((achievement, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 flex items-start">
                <div className="bg-yellow-100 p-3 rounded-full mr-3">
                  <FaTrophy className="text-yellow-500 text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <div className="flex items-center mt-2">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="text-xs text-gray-500">+{achievement.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FaTrophy className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد إنجازات بعد. أكمل الكويزات لكسب الإنجازات!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelsList;
