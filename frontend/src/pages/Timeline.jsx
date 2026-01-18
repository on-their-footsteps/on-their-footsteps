import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { characters } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TimelineView from '../components/stories/TimelineView';
import FilterDropdown from '../components/common/FilterDropdown';

const Timeline = () => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [charactersList, setCharactersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('timeline'); // timeline, list, map

  const eras = [
    { value: 'all', label: 'كل العصور' },
    { value: 'prophetic', label: 'العصر النبوي (570-632 م)' },
    { value: 'rashidun', label: 'العصر الراشدي (632-661 م)' },
    { value: 'umayyad', label: 'العصر الأموي (661-750 م)' },
    { value: 'abbasid', label: 'العصر العباسي (750-1258 م)' },
    { value: 'ottoman', label: 'العصر العثماني (1299-1922 م)' },
    { value: 'modern', label: 'العصر الحديث (1922-الآن)' },
  ];

  const categories = [
    { value: 'all', label: 'كل الفئات' },
    { value: 'نبي', label: 'الأنبياء' },
    { value: 'صحابي', label: 'الصحابة' },
    { value: 'تابعي', label: 'التابعون' },
    { value: 'عالم', label: 'العلماء' },
    { value: 'خليفة', label: 'الخلفاء' },
    { value: 'قائد', label: 'القادة' },
  ];

  const viewModes = [
    { value: 'timeline', label: 'خط زمني', icon: 'clock' },
    { value: 'list', label: 'قائمة', icon: 'list' },
    { value: 'map', label: 'خريطة', icon: 'map' },
  ];

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        
        // Fetch characters with simple parameters
        const response = await characters.getAll({ limit: 100 });
        const charactersData = response.data || [];
        
        console.log('Timeline - Characters data:', charactersData);
        
        // Process timeline events from characters
        const events = [];
        charactersData.forEach(character => {
          // Add birth event
          if (character.birth_year) {
            events.push({
              id: `birth-${character.id}`,
              year: character.birth_year,
              type: 'birth',
              title: `مولد ${character.arabic_name || character.name}`,
              description: `ولادة ${character.arabic_name || character.name} ${character.birth_place ? `في ${character.birth_place}` : ''}`,
              character: character,
              category: character.category || 'غير محدد',
              era: character.era || 'غير محدد'
            });
          }

          // Add death event
          if (character.death_year) {
            events.push({
              id: `death-${character.id}`,
              year: character.death_year,
              type: 'death',
              title: `وفاة ${character.arabic_name || character.name}`,
              description: `وفاة ${character.arabic_name || character.name} ${character.death_place ? `في ${character.death_place}` : ''}`,
              character: character,
              category: character.category || 'غير محدد',
              era: character.era || 'غير محدد'
            });
          }

          // Add timeline events if available
          if (character.timeline_events && Array.isArray(character.timeline_events)) {
            character.timeline_events.forEach((event, index) => {
              events.push({
                id: `event-${character.id}-${index}`,
                year: event.year,
                type: 'event',
                title: event.title || `حدث في حياة ${character.arabic_name || character.name}`,
                description: event.description || '',
                character: character,
                category: character.category || 'غير محدد',
                era: character.era || 'غير محدد'
              });
            });
          }
        });

        // Sort events by year
        events.sort((a, b) => a.year - b.year);

        console.log('Timeline - Processed events:', events);

        setTimelineEvents(events);
        setCharactersList(charactersData);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Timeline - Error details:', err);
        setError('فشل في تحميل بيانات الخط الزمني');
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [selectedEra, selectedCategory]);

  const handleEraChange = (era) => {
    setSelectedEra(era);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              الخط الزمني للتاريخ الإسلامي
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              استكشف الأحداث المهمة والشخصيات الإسلامية عبر العصور المختلفة
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Era Filter */}
            <FilterDropdown
              value={selectedEra}
              onChange={handleEraChange}
              options={eras}
              placeholder="اختر العصر"
            />

            {/* Category Filter */}
            <FilterDropdown
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categories}
              placeholder="اختر الفئة"
            />

            {/* View Mode */}
            <div className="flex gap-2">
              {viewModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => handleViewModeChange(mode.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    viewMode === mode.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center text-gray-600">
              <span>
                {timelineEvents.length} حدث • {charactersList.length} شخصية
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {viewMode === 'timeline' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <TimelineView events={timelineEvents} />
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السنة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحدث
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الشخصية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفئة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العصر
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timelineEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.year} م
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-gray-500">{event.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/characters/${event.character.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {event.character.arabic_name || event.character.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.era}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'map' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                الخريطة التفاعلية
              </h3>
              <p className="text-gray-600 mb-6">
                سيتم إضافة خريطة تفاعلية لعرض الأحداث الجغرافية قريباً
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {timelineEvents.length}
                  </div>
                  <div className="text-sm text-gray-600">أحداث إجمالية</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {characters.length}
                  </div>
                  <div className="text-sm text-gray-600">شخصية</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {eras.length - 1}
                  </div>
                  <div className="text-sm text-gray-600">عصر تاريخي</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {timelineEvents.length}
            </div>
            <div className="text-gray-600">أحداث مسجلة</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {charactersList.length}
            </div>
            <div className="text-gray-600">شخصية</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {Math.max(...timelineEvents.map(e => e.year), 0) - Math.min(...timelineEvents.map(e => e.year), 0)}
            </div>
            <div className="text-gray-600">سنة من التاريخ</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {selectedEra === 'all' ? 'كل العصور' : eras.find(e => e.value === selectedEra)?.label}
            </div>
            <div className="text-gray-600">العصر المحدد</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;