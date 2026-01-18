import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { characters } from '../services/api';
import CharacterCard from '../components/characters/CharacterCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchBar from '../components/common/SearchBar';
import FilterDropdown from '../components/common/FilterDropdown';
import Pagination from '../components/common/Pagination';

const Characters = () => {
  const [charactersList, setCharactersList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const itemsPerPage = 12;

  const eras = [
    { value: '', label: 'كل العصور' },
    { value: 'prophetic', label: 'العصر النبوي' },
    { value: 'rashidun', label: 'العصر الراشدي' },
    { value: 'umayyad', label: 'العصر الأموي' },
    { value: 'abbasid', label: 'العصر العباسي' },
    { value: 'ottoman', label: 'العصر العثماني' },
    { value: 'modern', label: 'العصر الحديث' },
  ];

  const sortOptions = [
    { value: 'name', label: 'الاسم' },
    { value: 'birth_year', label: 'سنة الميلاد' },
    { value: 'death_year', label: 'سنة الوفاة' },
    { value: 'views_count', label: 'الأكثر مشاهدة' },
    { value: 'likes_count', label: 'الأكثر إعجاباً' },
  ];

  // Test character data for development
  const testCharacters = [
    {
      id: 1,
      name: 'Muhammad',
      arabic_name: 'محمد ﷺ',
      title: 'خاتم الأنبياء والمرسلين',
      description: 'محمد بن عبد الله بن عبد المطلب، خاتم الأنبياء والمرسلين، أرسله الله رحمة للعالمين، وهو المثل الأعلى للمسلمين في كل زمان ومكان.',
      category: 'الأنبياء',
      era: 'prophetic',
      profile_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mosque.svg/1200px-Mosque.svg.png',
      views_count: 10000,
      likes_count: 5000,
      birth_year: 571,
      death_year: 632,
      is_featured: true,
      is_verified: true
    },
    {
      id: 2,
      name: 'Abu Bakr',
      arabic_name: 'أبو بكر الصديق',
      title: 'أول الخلفاء الراشدين',
      description: 'أبو بكر الصديق هو عبد الله بن عثمان التيمي القرشي، أول الخلفاء الراشدين، وأحد العشرة المبشرين بالجنة، وهو صاحب النبي محمد ﷺ ورفيقه في الهجرة.',
      category: 'الصحابة',
      era: 'rashidun',
      profile_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Caliph_Abu_Bakr_-_Sulayman_al-Nadawi.jpg/220px-Caliph_Abu_Bakr_-_Sulayman_al-Nadawi.jpg',
      views_count: 5000,
      likes_count: 2500,
      birth_year: 573,
      death_year: 634,
      is_featured: true,
      is_verified: true
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch characters from API
        const response = await characters.getAll({
          page: currentPage,
          limit: itemsPerPage,
          sort: sortBy,
        });

        // Handle API response
        if (response && Array.isArray(response)) {
          setCharactersList(response);
          setTotal(response.length);
          setTotalPages(Math.ceil(response.length / itemsPerPage));
        } else {
          // Fallback to test data if API returns unexpected format
          console.warn('Unexpected API response format, using test data');
          setCharactersList(testCharacters);
          setTotal(testCharacters.length);
          setTotalPages(1);
        }

        // Fetch categories
        try {
          const categoriesResponse = await characters.getCategories();
          setCategories([
            { id: 1, name: 'الصحابة', arabic_name: 'الصحابة' },
            { id: 2, name: 'التابعون', arabic_name: 'التابعون' },
            ...(Array.isArray(categoriesResponse) ? categoriesResponse : [])
          ]);
        } catch (err) {
          console.error('Error fetching categories:', err);
          // Fallback categories
          setCategories([
            { id: 1, name: 'الصحابة', arabic_name: 'الصحابة' },
            { id: 2, name: 'التابعون', arabic_name: 'التابعون' },
            { id: 3, name: 'العلماء', arabic_name: 'العلماء' },
            { id: 4, name: 'القادة', arabic_name: 'القادة' }
          ]);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('فشل في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, sortBy]);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        
        // Fetch characters from API
        const response = await characters.getAll({
          page: currentPage,
          limit: itemsPerPage,
          sort: sortBy,
        });

        // Handle API response
        if (response && Array.isArray(response)) {
          setCharactersList(response);
          setTotal(response.length);
          setTotalPages(Math.ceil(response.length / itemsPerPage));
        } else {
          // Fallback to test data if API returns unexpected format
          console.warn('Unexpected API response format, using test data');
          setCharactersList(testCharacters);
          setTotal(testCharacters.length);
          setTotalPages(1);
        }

      } catch (err) {
        console.error('Error fetching characters:', err);
        setError('فشل في تحميل الشخصيات');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [currentPage, searchQuery, selectedCategory, selectedEra, sortBy]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleEraChange = (era) => {
    setSelectedEra(era);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryOptions = [
    { value: '', label: 'كل الفئات' },
    ...categories.map(cat => ({ value: cat.name, label: cat.arabic_name || cat.name })),
  ];

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
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

  // Get the character ID from the URL if present
  const getCharacterIdFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/characters\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Handle character click
  const handleCharacterClick = (characterId) => {
    window.location.href = `/characters/${characterId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              الشخصيات الإسلامية
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              استكشف قصص وحياة أعظم الشخصيات في تاريخ الإسلام
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <SearchBar
                onSearch={handleSearch}
                placeholder="ابحث عن شخصية..."
                value={searchQuery}
              />
            </div>

            {/* Category Filter */}
            <FilterDropdown
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder="الفئة"
            />

            {/* Era Filter */}
            <FilterDropdown
              value={selectedEra}
              onChange={handleEraChange}
              options={eras}
              placeholder="العصر"
            />

            {/* Sort Options */}
            <FilterDropdown
              value={sortBy}
              onChange={handleSortChange}
              options={sortOptions}
              placeholder="الترتيب حسب"
            />
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-600">
              {total > 0 ? (
                <>
                  عرض {charactersList.length} من {total} شخصية
                </>
              ) : (
                'لا توجد نتائج'
              )}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedEra('');
                setSortBy('name');
                setCurrentPage(1);
              }}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        </div>

        {/* Characters Grid */}
        {!loading && charactersList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {charactersList.map((character, index) => (
              <div 
                key={character.id} 
                onClick={() => handleCharacterClick(character.id)}
                className="cursor-pointer"
              >
                <CharacterCard 
                  character={character} 
                  index={index}
                  onImageError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لم يتم العثور على شخصيات
            </h3>
            <p className="text-gray-600 mb-4">
              جرب تغيير الفلاتر أو البحث بكلمات مختلفة
            </p>
            <Link
              to="/characters"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              عرض جميع الشخصيات
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Loading State for Pagination */}
        {loading && currentPage > 1 && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="medium" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Characters;