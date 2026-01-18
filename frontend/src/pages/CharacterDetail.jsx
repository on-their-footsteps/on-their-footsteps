import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Clock, MapPin, ChevronRight, BookOpen, Users, Volume2, Star } from 'lucide-react'
import Lottie from 'lottie-react'
import { useCharacter } from '../hooks/useCharacters'
import AudioPlayer from '../components/AudioPlayer'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import { getErrorMessage } from '../utils/errorHandler'

// Lazy load heavy components
const CharacterHero = lazy(() => import('../components/CharacterHero'));
const CharacterActions = lazy(() => import('../components/CharacterActions'));
const CharacterTabs = lazy(() => import('../components/CharacterTabs'));
const CharacterStats = lazy(() => import('../components/CharacterStats'));
const CharacterTimeline = lazy(() => import('../components/CharacterTimeline'));

const CharacterDetail = () => {
  const { idOrSlug } = useParams()
  // Ensure we're using the correct ID from the URL and it's a valid number
  const id = !isNaN(parseInt(idOrSlug)) ? parseInt(idOrSlug) : idOrSlug;
  const [activeTab, setActiveTab] = useState('story')
  const [bookmarked, setBookmarked] = useState(false)
  
  // Use the new character hook with error boundaries
  const { 
    character, 
    loading, 
    error, 
    toggleLike, 
    shareCharacter, 
    incrementViews,
    clearError 
  } = useCharacter(id, {
    onError: (err) => {
      console.error('Error loading character:', err);
    },
    onSuccess: (data) => {
      console.log('Character loaded successfully:', data?.name || 'Unknown character');
    }
  })

  // Increment views when character loads - only once per session
  useEffect(() => {
    if (!id) return; // Don't proceed if no valid ID
    
    const viewKey = `character_${id}_viewed`;
    const hasViewed = sessionStorage.getItem(viewKey);
    
    if (!hasViewed && character?.id === id) { // Only increment if the character matches the URL ID
      console.log('Incrementing views for character:', id);
      incrementViews().then(updatedChar => {
        if (updatedChar) {
          sessionStorage.setItem(viewKey, 'true');
          console.log('Views incremented successfully');
        }
      }).catch(err => {
        console.error('Failed to increment views:', err);
      });
    }
  }, [id, character?.id, incrementViews])

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!character) return
    
    try {
      const updatedCharacter = await toggleLike(!bookmarked)
      if (updatedCharacter) {
        setBookmarked(!bookmarked)
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }

  // Handle share
  const handleShare = async () => {
    if (!character) return
    
    try {
      const result = await shareCharacter()
      if (result) {
        // Implement native share or copy to clipboard
        if (navigator.share) {
          await navigator.share({
            title: character.arabic_name || character.name,
            text: character.description,
            url: window.location.href
          })
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(window.location.href)
        }
      }
    } catch (err) {
      console.error('Failed to share character:', err)
    }
  }

  // Handle retry
  const handleRetry = () => {
    clearError()
  }

  // Show loading state only on initial load
  if (loading && !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
        <span className="mr-4 text-lg">جاري تحميل بيانات الشخصية...</span>
      </div>
    )
  }

  // Error state
  if (error && !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="حدث خطأ في تحميل بيانات الشخصية"
        />
      </div>
    )
  }

  // No character found after loading
  if (!character && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">لم يتم العثور على الشخصية</h2>
        <p className="text-gray-600 mb-6">عذراً، تعذر تحميل بيانات الشخصية المطلوبة.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          العودة للخلف
        </button>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{`${character.arabic_name || character.name} - على خطاهم`}</title>
        <meta name="description" content={character.description} />
        <meta property="og:title" content={character.arabic_name || character.name} />
        <meta property="og:description" content={character.description} />
        {character.profile_image && (
          <meta property="og:image" content={character.profile_image} />
        )}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <Suspense fallback={<LoadingSpinner />}>
          <CharacterHero character={character} />
        </Suspense>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Story Content */}
            <div className="lg:col-span-2">
              {/* Actions */}
              <Suspense fallback={<LoadingSpinner />}>
                <CharacterActions
                  bookmarked={bookmarked}
                  onBookmark={handleBookmarkToggle}
                  onShare={handleShare}
                />
              </Suspense>

              {/* Tabs */}
              <Suspense fallback={<LoadingSpinner />}>
                <CharacterTabs
                  character={character}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </Suspense>

              {activeTab === 'story' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-lg max-w-none dark:prose-invert"
                >
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {character.full_story?.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <CharacterTimeline events={character.timeline_events} />
              )}

              {activeTab === 'achievements' && (
                <div className="space-y-4">
                  {character.key_achievements?.map((achievement, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-green-100 dark:border-gray-600"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Star className="text-green-600 dark:text-green-300" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{achievement}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'lessons' && (
                <div className="space-y-4">
                  {character.lessons?.map((lesson, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-blue-100 dark:border-gray-600"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <BookOpen className="text-blue-600 dark:text-blue-300" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{lesson}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Audio Stories */}
              {character.audio_stories?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Volume2 />
                    <span>قصص صوتية</span>
                  </h3>
                  <div className="space-y-4">
                    {character.audio_stories.map((audio, idx) => (
                      <AudioPlayer key={idx} src={audio.url} title={audio.title} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Stats and Info */}
            <div className="space-y-6">
              {/* Character Stats */}
              <CharacterStats character={character} />

              {/* Quick Facts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">معلومات سريعة</h3>
                <div className="space-y-4">
                  {character.birth_year && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={18} />
                        <span>سنة الميلاد</span>
                      </div>
                      <span className="font-medium">{character.birth_year} م</span>
                    </div>
                  )}

                  {character.birth_place && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={18} />
                        <span>مكان الميلاد</span>
                      </div>
                      <span className="font-medium">{character.birth_place}</span>
                    </div>
                  )}

                  {character.death_year && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={18} />
                        <span>سنة الوفاة</span>
                      </div>
                      <span className="font-medium">{character.death_year} م</span>
                    </div>
                  )}

                  {character.death_place && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={18} />
                        <span>مكان الوفاة</span>
                      </div>
                      <span className="font-medium">{character.death_place}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">الإحصائيات</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} />
                      <span>عدد المشاهدات</span>
                    </div>
                    <span className="font-bold text-2xl">
                      {character?.views_count?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={18} />
                      <span>عدد المعجبين</span>
                    </div>
                    <span className="font-bold text-2xl">
                      {character?.likes_count?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterDetail
