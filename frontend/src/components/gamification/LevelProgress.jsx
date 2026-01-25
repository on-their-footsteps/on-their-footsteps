import React, { useState, useEffect, useContext } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaArrowUp, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LevelProgress = () => {
  const { user: authUser } = useAuth();
  const { state, dispatch } = useGamification();
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [nextLevel, setNextLevel] = useState(null);

  // Fetch user level data
  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/levels/user/current`, {
          headers: {
            'Authorization': `Bearer ${authUser?.token}`
          }
        });
        
        const { current_level, current_xp, next_level, xp_to_next_level, progress_percentage } = response.data;
        
        setLevelData({
          currentLevel: current_level,
          currentXP: current_xp,
          nextLevel: next_level,
          xpToNextLevel: xp_to_next_level,
          progress: progress_percentage
        });
        
        if (next_level) {
          setNextLevel(next_level);
        }
        
        // Update global state
        dispatch({
          type: 'SET_USER_LEVEL',
          payload: {
            level: current_level?.level || 1,
            xp: current_xp || 0
          }
        });
        
      } catch (error) {
        console.error('Error fetching level data:', error);
        toast.error('فشل تحميل بيانات المستوى');
      } finally {
        setLoading(false);
      }
    };

    if (authUser?.token) {
      fetchLevelData();
    }
  }, [authUser, dispatch]);

  // Handle level up animation
  useEffect(() => {
    if (levelData?.currentLevel?.level > 1 && !showLevelUp) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [levelData?.currentLevel?.level, showLevelUp]);

  if (loading || !levelData) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { currentLevel, currentXP, nextLevel: nextLvl, xpToNextLevel, progress } = levelData;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Level Up Animation */}
      {showLevelUp && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.5 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <div className="bg-white p-8 rounded-lg text-center">
            <FaTrophy className="text-6xl text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">تهانينا!</h2>
            <p className="text-lg mb-4">لقد وصلت إلى المستوى {currentLevel?.level}!</p>
            <button 
              onClick={() => setShowLevelUp(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ممتاز!
            </button>
          </div>
        </motion.div>
      )}

      {/* Level Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <FaStar className="text-yellow-500 mr-2" />
            <span className="font-bold">المستوى {currentLevel?.level}</span>
          </div>
          <div className="text-gray-600">
            {currentXP} / {nextLvl?.xp_required || currentLevel.xp_required * 2} XP
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        
        {nextLvl && (
          <div className="mt-2 text-sm text-gray-600 text-left">
            {xpToNextLevel} XP متبقي للمستوى {nextLvl.level}
          </div>
        )}
      </div>

      {/* Achievements Preview */}
      <div className="border-t pt-4">
        <h3 className="font-bold text-lg mb-3 flex items-center">
          <FaTrophy className="text-yellow-500 ml-2" />
          الإنجازات
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 font-bold text-xl">{state.user.completedQuizzes || 0}</div>
            <div className="text-sm text-gray-600">كويز مكتمل</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-600 font-bold text-xl">{state.user.streak || 0}</div>
            <div className="text-sm text-gray-600">يوم متتالي</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-purple-600 font-bold text-xl">{state.user.achievements?.length || 0}</div>
            <div className="text-sm text-gray-600">إنجاز</div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="text-amber-600 font-bold text-xl">{currentLevel?.level || 1}</div>
            <div className="text-sm text-gray-600">المستوى الحالي</div>
          </div>
        </div>
      </div>
      
      {/* Level Rewards */}
      {nextLvl && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <FaArrowUp className="text-green-500 ml-2" />
            المكافآت القادمة
          </h3>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="bg-white p-3 rounded-full shadow-sm mr-3">
                <FaCheckCircle className="text-green-500 text-xl" />
              </div>
              <div>
                <h4 className="font-bold">المستوى {nextLvl.level}</h4>
                <p className="text-sm text-gray-600">{nextLvl.description || 'وصف المكافأة'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelProgress;
