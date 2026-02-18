import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adsService, categoriesService, citiesService, streetsService, neighborhoodsService } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import AvailabilityEditor from '../components/appointments/AvailabilityEditor';

export default function EditAd() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const streetDropdownRef = useRef<HTMLDivElement>(null);
  const neighborhoodDropdownRef = useRef<HTMLDivElement>(null);
  
  const [streetSearch, setStreetSearch] = useState('');
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    adType: '',
    cityId: '',
    streetId: '',
    neighborhood: '',
    images: [] as any[],
    customFields: {} as any,
  });

  // Fetch full ad data
  const { data: ad, isLoading: adLoading } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsService.getAd(id!),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
  });

  // Get selected category details
  const selectedCategory = categories?.find((cat: any) => cat.id === formData.categoryId);
  const categorySlug = selectedCategory?.slug || '';

  console.log('EditAd - Category info:', {
    categoryId: formData.categoryId,
    selectedCategory,
    categorySlug
  });

  // Define features based on category
  const getCategoryFeatures = () => {
    // דירות נופש / שבת
    if (categorySlug.includes('holiday') || categorySlug.includes('shabbat') || categorySlug.includes('vacation')) {
      return [
        { key: 'plata', label: 'פלטה' },
        { key: 'urn', label: 'מיחם' },
        { key: 'linens', label: 'מצעים' },
        { key: 'pool', label: 'בריכה' },
        { key: 'kidsGames', label: 'משחקי ילדים' },
        { key: 'babyBed', label: 'מיטת תינוק' },
        { key: 'masterUnit', label: 'יחידת הורים' },
        { key: 'sleepingOnly', label: 'לינה בלבד' },
        { key: 'parking', label: 'חניה' },
        { key: 'balcony', label: 'מרפסת' },
        { key: 'airConditioning', label: 'מיזוג אוויר' },
      ];
    }
    
    // דירה למכירה
    if (categorySlug.includes('sale') || categorySlug.includes('for-sale')) {
      return [
        { key: 'parking', label: 'חניה' },
        { key: 'elevator', label: 'מעלית' },
        { key: 'balcony', label: 'מרפסת' },
        { key: 'storage', label: 'מחסן' },
        { key: 'airConditioning', label: 'מיזוג אוויר' },
        { key: 'mamad', label: 'ממ"ד' },
        { key: 'view', label: 'נוף' },
        { key: 'masterUnit', label: 'יחידת הורים' },
        { key: 'housingUnit', label: 'יחידת דיור' },
        { key: 'yard', label: 'חצר' },
        { key: 'garden', label: 'גינה' },
        { key: 'frontFacing', label: 'חזית' },
        { key: 'upgradedKitchen', label: 'מטבח משודרג' },
        { key: 'accessibleForDisabled', label: 'נגיש לנכים' },
        { key: 'hasOption', label: 'אופציה' },
      ];
    }
    
    // דירה להשכרה (דיפולט לנדל"ן)
    return [
      { key: 'parking', label: 'חניה' },
      { key: 'elevator', label: 'מעלית' },
      { key: 'balcony', label: 'מרפסת' },
      { key: 'storage', label: 'מחסן' },
      { key: 'airConditioning', label: 'מיזוג אוויר' },
      { key: 'mamad', label: 'ממ"ד' },
      { key: 'view', label: 'נוף' },
      { key: 'masterUnit', label: 'יחידת הורים' },
      { key: 'housingUnit', label: 'יחידת דיור' },
      { key: 'yard', label: 'חצר' },
      { key: 'garden', label: 'גינה' },
      { key: 'frontFacing', label: 'חזית' },
      { key: 'upgradedKitchen', label: 'מטבח משודרג' },
      { key: 'accessibleForDisabled', label: 'נגיש לנכים' },
    ];
  };

  const categoryFeatures = getCategoryFeatures();

  const { data: beitShemeshCity } = useQuery({
    queryKey: ['beit-shemesh-city'],
    queryFn: citiesService.getBeitShemesh,
  });

  // Get neighborhoods for selected city
  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods', formData.cityId],
    queryFn: () => neighborhoodsService.getNeighborhoods(formData.cityId!),
    enabled: !!formData.cityId,
  });

  const { data: allStreets } = useQuery({
    queryKey: ['all-streets', formData.cityId],
    queryFn: () => streetsService.getStreets({
      cityId: formData.cityId,
      limit: 500,
    }),
    enabled: !!formData.cityId,
  });

  const { data: searchedStreets } = useQuery({
    queryKey: ['streets-search', streetSearch, formData.cityId],
    queryFn: () => streetsService.getStreets({
      query: streetSearch,
      cityId: formData.cityId,
      limit: 50,
    }),
    enabled: !!formData.cityId && streetSearch.length >= 2,
  });

  // Load ad data into form
  useEffect(() => {
    if (ad) {
      const loadedCustomFields = ad.customFields || {};
      
      // Extract features from nested structure if they exist
      const features = (loadedCustomFields as any).features || {};
      
      console.log('=== FULL DEBUG ===');
      console.log('Full ad object:', ad);
      console.log('ad.customFields:', loadedCustomFields);
      console.log('ad.customFields.features:', features);
      console.log('All keys in customFields:', Object.keys(loadedCustomFields));
      console.log('All keys in features:', Object.keys(features));
      
      // Merge features to root level for form binding
      const mergedCustomFields = {
        ...loadedCustomFields,
        ...features, // Spread nested features to root level
      };
      
      console.log('mergedCustomFields:', mergedCustomFields);
      console.log('All keys in merged:', Object.keys(mergedCustomFields));
      
      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price ? String(ad.price) : '',
        categoryId: ad.category?.id || ad.categoryId || '',
        adType: ad.adType || '',
        cityId: ad.city?.id || ad.cityId || '',
        streetId: ad.street?.id || ad.streetId || '',
        neighborhood: ad.neighborhood || '',
        images: ad.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
        })) || [],
        customFields: mergedCustomFields,
      });
      
      if (ad.street?.name) {
        setStreetSearch(ad.street.name);
      }
      if (ad.neighborhood) {
        setNeighborhoodSearch(ad.neighborhood);
      }
    }
  }, [ad]);

  // Set Beit Shemesh as default city
  useEffect(() => {
    if (beitShemeshCity && !formData.cityId && ad) {
      setFormData(prev => ({
        ...prev,
        cityId: beitShemeshCity.id,
      }));
    }
  }, [beitShemeshCity, ad]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (streetDropdownRef.current && !streetDropdownRef.current.contains(event.target as Node)) {
        setShowStreetDropdown(false);
      }
      if (neighborhoodDropdownRef.current && !neighborhoodDropdownRef.current.contains(event.target as Node)) {
        setShowNeighborhoodDropdown(false);
      }
    };
    if (showStreetDropdown || showNeighborhoodDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStreetDropdown, showNeighborhoodDropdown]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => adsService.updateAd(id!, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      
      // בדיקה אם יש שינויים ממתינים
      const updatedAd = response?.data || response;
      if (updatedAd?.hasPendingChanges) {
        navigate(`/ads/${id}`, {
          state: { 
            message: '✅ השינויים נשמרו והועברו לאישור מנהל!\n\n📢 המודעה המקורית נשארת פעילה באתר עד לאישור השינויים.\n\n⏱️ לאחר שמנהל יאשר את השינויים, המודעה המעודכנת תופיע באתר.',
            type: 'pending-changes'
          },
        });
      } else {
        navigate(`/ads/${id}`, {
          state: { message: 'המודעה עודכנה בהצלחה!' },
        });
      }
    },
  });

  // Extract error message from backend
  const getErrorMessage = () => {
    if (!updateMutation.error) return '';
    
    const error = updateMutation.error as any;
    
    // Try to get message from response
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      return 'נדרש להתחבר למערכת כדי לעדכן מודעה';
    }
    
    if (error.response?.status === 403) {
      return 'אין לך הרשאה לעדכן מודעה זו';
    }
    
    if (error.response?.status === 413) {
      return 'התמונות גדולות מדי. אנא צמצם אותן או העלה פחות תמונות';
    }
    
    if (error.response?.status === 400) {
      return error.response?.data?.message || 'נתונים לא תקינים. אנא בדוק את כל השדות';
    }
    
    if (error.response?.status === 404) {
      return 'המודעה, הקטגוריה או העיר שנבחרו לא נמצאו במערכת';
    }
    
    if (error.response?.status === 500) {
      return 'שגיאת שרת. אנא נסה שוב מאוחר יותר';
    }
    
    // Try to get error message from error object
    if (error.message) {
      return error.message;
    }
    
    // Fallback
    return 'שגיאה בעדכון המודעה. אנא נסה שוב.';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomFieldChange = (field: string, value: any) => {
    const updatedFields = {
      ...formData.customFields,
      [field]: value,
    };
    
    // Handle alternative field names - update both the new name and the old name
    if (field === 'mamad') {
      updatedFields['safeRoom'] = value;
    } else if (field === 'safeRoom') {
      updatedFields['mamad'] = value;
    }
    
    if (field === 'masterUnit') {
      updatedFields['parentalUnit'] = value;
    } else if (field === 'parentalUnit') {
      updatedFields['masterUnit'] = value;
    }
    
    if (field === 'balcony') {
      updatedFields['sukkaBalcony'] = value;
    } else if (field === 'sukkaBalcony') {
      updatedFields['balcony'] = value;
    }
    
    if (field === 'hasOption') {
      updatedFields['option'] = value;
    } else if (field === 'option') {
      updatedFields['hasOption'] = value;
    }
    
    setFormData({
      ...formData,
      customFields: updatedFields,
    });
  };

  const handleStreetSelect = (streetId: string) => {
    const selectedStreet = allStreets?.find((s: any) => s.id === streetId) || 
                          searchedStreets?.find((s: any) => s.id === streetId);
    setFormData({
      ...formData,
      streetId,
      neighborhood: selectedStreet?.neighborhoodName || '',
    });
    setStreetSearch(selectedStreet?.name || '');
    setNeighborhoodSearch(selectedStreet?.neighborhoodName || '');
    setShowStreetDropdown(false);
  };

  const handleNeighborhoodSelect = (neighborhoodName: string) => {
    setFormData({
      ...formData,
      neighborhood: neighborhoodName,
    });
    setNeighborhoodSearch(neighborhoodName);
    setShowNeighborhoodDropdown(false);
  };

  const handleCityChange = (cityId: string) => {
    setFormData({
      ...formData,
      cityId,
      streetId: '',
      neighborhood: '',
    });
    setStreetSearch('');
    setNeighborhoodSearch('');
  };

  const handleImagesChange = (images: any[]) => {
    setFormData({
      ...formData,
      images,
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    // אם המודעה מאושרת (ACTIVE), לא מוחקים תמונות ישירות
    // השינויים יישמרו ב-pendingChanges ויחכו לאישור מנהל
    if (ad?.status === 'ACTIVE') {
      // לא עושים כלום - המחיקה תתבצע רק אחרי אישור מנהל
      return;
    }
    
    // רק אם המודעה לא מאושרת - מוחקים ישירות
    try {
      await adsService.deleteImage(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ולידציה - שדות חובה: כותרת, קטגוריה, ורחוב או שכונה
    if (!formData.title || !formData.categoryId) {
      alert('נא למלא את כל השדות החובה: כותרת וקטגוריה');
      return;
    }

    // Validate either streetId or neighborhood is provided
    if (!formData.streetId && !formData.neighborhood) {
      alert('נא למלא רחוב או שכונה');
      return;
    }
    
    // ולידציה - תיאור אופציונלי, אם יש - מקסימום 16 מילים
    if (formData.description && formData.description.trim()) {
      const wordCount = formData.description.trim().split(/\s+/).length;
      if (wordCount > 16) {
        alert('התיאור חייב להיות עד 16 מילים');
        return;
      }
    }
    
    // תמונות אופציונליות - אין מינימום
    
    try {
      // Prepare customFields: separate features from other fields
      // Map field names to their database equivalents
      const fieldNameMapping: any = {
        'mamad': 'safeRoom',
        'masterUnit': 'parentalUnit',
        'balcony': 'sukkaBalcony',
        'hasOption': 'hasOption', // This one stays the same
      };
      
      const featureKeys = categoryFeatures.map(f => f.key);
      const features: any = {};
      const otherFields: any = {};
      
      Object.keys(formData.customFields).forEach(key => {
        if (featureKeys.includes(key)) {
          // Use the database field name if there's a mapping, otherwise use the key as-is
          const dbFieldName = fieldNameMapping[key] || key;
          features[dbFieldName] = formData.customFields[key];
        } else if (!['safeRoom', 'parentalUnit', 'sukkaBalcony', 'option'].includes(key)) {
          // Skip the old alternative names if they exist (we already mapped them above)
          otherFields[key] = formData.customFields[key];
        }
      });
      
      // Reconstruct customFields with features nested
      const customFieldsToSave = {
        ...otherFields,
        features: features,
      };
      
      console.log('Saving customFields:', customFieldsToSave);
      
      updateMutation.mutate({
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : undefined,
        categoryId: formData.categoryId,
        adType: formData.adType,
        cityId: formData.cityId,
        streetId: formData.streetId,
        customFields: customFieldsToSave,
        images: formData.images,
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  if (adLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">המודעה לא נמצאה</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">עריכת מודעה</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* כותרת */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כותרת המודעה *
                <span className="text-sm text-gray-500 font-normal mr-2">(לא ניתן לשינוי)</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="לדוגמה: דירת 3 חדרים למכירה"
              />
            </div>

            {/* קטגוריה */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קטגוריה * 
                <span className="text-sm text-gray-500 font-normal mr-2">(לא ניתן לשינוי)</span>
              </label>
              <select
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              >
                <option value="">בחר קטגוריה</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameHe}
                  </option>
                ))}
              </select>
            </div>

            {/* עיר */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                עיר *
                {(formData.streetId || formData.neighborhood) && (
                  <span className="text-sm text-gray-500 font-normal mr-2">(ניתן לשינוי רק אם לא נבחרו רחוב או שכונה)</span>
                )}
              </label>
              <select
                name="cityId"
                required
                value={formData.cityId}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!!formData.streetId || !!formData.neighborhood}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  formData.streetId || formData.neighborhood ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''
                }`}
              >
                <option value="">בחר עיר</option>
                {cities?.map((city: any) => (
                  <option key={city.id} value={city.id}>
                    {city.nameHe}
                  </option>
                ))}
              </select>
            </div>

            {/* רחוב */}
            <div ref={streetDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">רחוב (אופציונלי)</label>
              <div className="relative">
                <input
                  type="text"
                  value={streetSearch}
                  onChange={(e) => {
                    setStreetSearch(e.target.value);
                    // אם מחקו את הטקסט לגמרי, איפוס רחוב ושכונה
                    if (e.target.value === '') {
                      setFormData({
                        ...formData,
                        streetId: '',
                        neighborhood: '',
                      });
                    }
                    // תמיד פותח את הדרופדאון כשמקלידים
                    setShowStreetDropdown(true);
                  }}
                  onFocus={() => setShowStreetDropdown(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="חפש רחוב או השאר ריק לראות את כל הרחובות"
                />
                
                {showStreetDropdown && (() => {
                  // אם יש חיפוש של 2+ תווים, הצג רק תוצאות חיפוש
                  // אחרת, הצג את כל הרחובות
                  const streetsToShow = streetSearch.length >= 2 ? searchedStreets : allStreets;
                  return streetsToShow && streetsToShow.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {streetsToShow.map((street: any) => (
                        <button
                          key={street.id}
                          type="button"
                          onClick={() => handleStreetSelect(street.id)}
                          className="w-full text-right px-4 py-2 hover:bg-blue-50 transition text-black"
                        >
                          {street.name}
                          {street.neighborhoodName && (
                            <span className="text-sm text-gray-500 mr-2">({street.neighborhoodName})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* שכונה - מופעל רק אם לא נבחר רחוב */}
            <div ref={neighborhoodDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שכונה {!formData.streetId && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={neighborhoodSearch}
                  onChange={(e) => {
                    setNeighborhoodSearch(e.target.value);
                    if (e.target.value === '') {
                      setFormData({
                        ...formData,
                        neighborhood: '',
                      });
                    }
                    setShowNeighborhoodDropdown(true);
                  }}
                  onFocus={() => setShowNeighborhoodDropdown(true)}
                  disabled={!!formData.streetId}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formData.streetId ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="חפש שכונה או השאר ריק לראות את כל השכונות"
                />
                
                {showNeighborhoodDropdown && !formData.streetId && (() => {
                  const neighborhoodsToShow = neighborhoods?.filter((n: any) => 
                    n.name.includes(neighborhoodSearch)
                  ) || [];
                  return neighborhoodsToShow.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {neighborhoodsToShow.map((neighborhood: any) => (
                        <button
                          key={neighborhood.id}
                          type="button"
                          onClick={() => handleNeighborhoodSelect(neighborhood.name)}
                          className="w-full text-right px-4 py-2 hover:bg-blue-50 transition text-black"
                        >
                          {neighborhood.name}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              {formData.streetId && (
                <p className="text-sm text-gray-500 mt-1">השכונה מתמלאת אוטומטית מהרחוב שנבחר</p>
              )}
            </div>

            {/* מחיר */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            {/* פרטי נכס דינמיים */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">פרטי הנכס</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* חדרים */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">חדרים</label>
                  <input
                    type="number"
                    value={formData.customFields?.rooms || ''}
                    onChange={(e) => handleCustomFieldChange('rooms', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.5"
                    min="0"
                  />
                </div>

                {/* קומה */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">קומה</label>
                  <input
                    type="number"
                    value={formData.customFields?.floor || ''}
                    onChange={(e) => handleCustomFieldChange('floor', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* שטח */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שטח (מ״ר)</label>
                  <input
                    type="number"
                    value={formData.customFields?.squareMeters || formData.customFields?.size || ''}
                    onChange={(e) => handleCustomFieldChange('squareMeters', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* מספר בית */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מספר בית</label>
                  <input
                    type="text"
                    value={formData.customFields?.houseNumber || ''}
                    onChange={(e) => handleCustomFieldChange('houseNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* מצב הנכס */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מצב הנכס</label>
                  <select
                    value={formData.customFields?.condition || ''}
                    onChange={(e) => handleCustomFieldChange('condition', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר מצב</option>
                    <option value="NEW">חדש</option>
                    <option value="EXCELLENT">מצוין</option>
                    <option value="GOOD">טוב</option>
                    <option value="MAINTAINED">מתוחזק</option>
                    <option value="RENOVATED">משופץ</option>
                    <option value="NEEDS_RENOVATION">דרוש שיפוץ</option>
                    <option value="OLD">ישן</option>
                  </select>
                </div>

                {/* סוג נכס */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סוג נכס</label>
                  <select
                    value={formData.customFields?.propertyType || ''}
                    onChange={(e) => handleCustomFieldChange('propertyType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר סוג</option>
                    <option value="APARTMENT">דירה</option>
                    <option value="DUPLEX">דופלקס</option>
                    <option value="PENTHOUSE">פנטהאוז</option>
                    <option value="TWO_STORY">דו קומתי</option>
                    <option value="SEMI_DETACHED">דו משפחתי</option>
                    <option value="GARDEN_APARTMENT">דירת גן</option>
                    <option value="PRIVATE_HOUSE">בית פרטי</option>
                    <option value="STUDIO">סטודיו</option>
                    <option value="COTTAGE">קוטג'</option>
                    <option value="VILLA">וילה</option>
                    <option value="UNIT">יחידת דיור</option>
                  </select>
                </div>

                {/* ריהוט */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ריהוט</label>
                  <select
                    value={formData.customFields?.furniture || ''}
                    onChange={(e) => handleCustomFieldChange('furniture', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר</option>
                    <option value="NONE">ללא</option>
                    <option value="PARTIAL">חלקי</option>
                    <option value="FULL">מלא</option>
                    <option value="FURNISHED">מרוהט</option>
                    <option value="UNFURNISHED">לא מרוהט</option>
                  </select>
                </div>

                {/* ארנונה */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ארנונה (₪)</label>
                  <input
                    type="number"
                    value={formData.customFields?.arnona || ''}
                    onChange={(e) => handleCustomFieldChange('arnona', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ועד בית */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ועד בית (₪)</label>
                  <input
                    type="number"
                    value={formData.customFields?.vaad || ''}
                    onChange={(e) => handleCustomFieldChange('vaad', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* תאריך כניסה */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך כניסה</label>
                  <input
                    type="date"
                    value={formData.customFields?.entryDate || ''}
                    onChange={(e) => handleCustomFieldChange('entryDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* פרטי קשר */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">פרטי קשר נוספים</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם איש קשר</label>
                    <input
                      type="text"
                      value={formData.customFields?.contactName || ''}
                      onChange={(e) => handleCustomFieldChange('contactName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="שם מלא"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">טלפון ליצירת קשר</label>
                    <input
                      type="tel"
                      value={formData.customFields?.contactPhone || ''}
                      onChange={(e) => handleCustomFieldChange('contactPhone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="05X-XXXXXXX"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">השלמת כתובת</label>
                    <input
                      type="text"
                      value={formData.customFields?.addressSupplement || ''}
                      onChange={(e) => handleCustomFieldChange('addressSupplement', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="למשל: קומה 3, דירה 8 או כניסה ב'"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">מאפיינים נוספים</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryFeatures.map((feature) => {
                    // Handle alternative field names for backwards compatibility
                    let isChecked = formData.customFields?.[feature.key] || false;
                    
                    // Map alternative names
                    if (feature.key === 'mamad' && !isChecked) {
                      isChecked = formData.customFields?.['safeRoom'] || false;
                    }
                    if (feature.key === 'masterUnit' && !isChecked) {
                      isChecked = formData.customFields?.['parentalUnit'] || false;
                    }
                    if (feature.key === 'balcony' && !isChecked) {
                      isChecked = formData.customFields?.['sukkaBalcony'] || false;
                    }
                    if (feature.key === 'hasOption' && !isChecked) {
                      isChecked = formData.customFields?.['option'] || false;
                    }
                    
                    return (
                      <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCustomFieldChange(feature.key, e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-900">{feature.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* תיאור */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (אופציונלי, עד 16 מילים)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="תאר את הנכס בפירוט..."
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.description.trim().length > 0 
                  ? `${formData.description.trim().split(/\s+/).length} מילים (מתוך 16)` 
                  : '0 מילים (מתוך 16)'}
              </div>
            </div>

            {/* תמונות */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">תמונות</h2>
              <ImageUpload 
                images={formData.images} 
                onChange={handleImagesChange} 
                onDeleteExisting={handleDeleteImage}
              />
            </div>

            {/* זמינות לפגישות */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">זמינות לפגישות</h2>
              <AvailabilityEditor adId={id!} />
            </div>

            {/* כפתורים */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                ביטול
              </button>
            </div>

            {updateMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-1">שגיאה בעדכון המודעה</p>
                <p className="text-red-600 text-sm">{getErrorMessage()}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
