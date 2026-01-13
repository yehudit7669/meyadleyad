import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { adsService } from '../services/api';
import AdForm from '../components/AdForm';

export default function CreateAd() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (data: any) => adsService.createAd(data),
    onSuccess: (data) => {
      const adNumber = data.adNumber || data.id;
      navigate(`/ads/${data.id}`, {
        state: { message: `מודעה מס' ${adNumber} הועלתה בהצלחה!` },
      });
    },
  });

  // Extract error message from backend
  const getErrorMessage = () => {
    if (!createMutation.error) return '';
    
    const error = createMutation.error as any;
    
    console.error('Create ad error details:', error);
    
    // Try to get message from response
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      return 'נדרש להתחבר למערכת כדי לפרסם מודעה';
    }
    
    if (error.response?.status === 403) {
      return 'אין לך הרשאה לפרסם מודעה';
    }
    
    if (error.response?.status === 413) {
      return 'התמונות גדולות מדי. אנא צמצם אותן או העלה פחות תמונות';
    }
    
    if (error.response?.status === 400) {
      return error.response?.data?.message || 'נתונים לא תקינים. אנא בדוק את כל השדות';
    }
    
    if (error.response?.status === 404) {
      return 'הקטגוריה או העיר שנבחרו לא נמצאו במערכת';
    }
    
    if (error.response?.status === 500) {
      return 'שגיאת שרת. אנא נסה שוב מאוחר יותר';
    }
    
    // Try to get error message from error object
    if (error.message) {
      return error.message;
    }
    
    // Show status code if available
    if (error.response?.status) {
      return `שגיאה: קוד ${error.response.status} - ${error.response.statusText || 'שגיאה לא מזוהה'}`;
    }
    
    // Fallback
    return 'שגיאה בפרסום המודעה. אנא נסה שוב.';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">פרסום מודעה חדשה</h1>
          <AdForm
            onSubmit={createMutation.mutate}
            isLoading={createMutation.isPending}
            submitButtonText="פרסם מודעה"
          />
          {createMutation.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-1">שגיאה בפרסום המודעה</p>
              <p className="text-red-600 text-sm">{getErrorMessage()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
