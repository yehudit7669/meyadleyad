import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUpdatePersonalDetails, useUpdateOfficeDetails } from '../../hooks/useBroker';
import { BrokerProfile } from '../../services/brokerService';
import { pendingApprovalsService } from '../../services/api';

interface Props {
  profile: BrokerProfile;
}

const PersonalDetailsTab: React.FC<Props> = ({ profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [addressErrorMessage, setAddressErrorMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: profile.user.name || '',
    phonePersonal: profile.user.phonePersonal || '',
    businessPhone: profile.user.businessPhone || '',
    businessAddressPending: profile.office?.businessAddressPending || profile.office?.businessAddressApproved || '',
  });

  const updatePersonal = useUpdatePersonalDetails();
  const updateOffice = useUpdateOfficeDetails();

  // Fetch user's approval requests
  const { data: myApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: pendingApprovalsService.getMyApprovals,
    refetchInterval: 5000, // רענון כל 5 שניות
  });

  // Find address rejection - get the most recent one
  const getLatestRejection = (type: string) => {
    const rejections = myApprovals?.filter((a: any) => a.type === type && a.status === 'REJECTED') || [];
    if (rejections.length === 0) return null;
    return rejections.sort((a: any, b: any) => 
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    )[0];
  };

  const addressRejection = getLatestRejection('OFFICE_ADDRESS_UPDATE');
  const addressApproved = myApprovals?.find((a: any) => a.type === 'OFFICE_ADDRESS_UPDATE' && a.status === 'APPROVED');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">פרטים אישיים</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ערוך פרטים
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.user.name || 'לא צוין'}</p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
          <p className="text-gray-900 py-2">{profile.user.email}</p>
          <p className="text-xs text-gray-500 mt-1">לשינוי אימייל, השתמש בתהליך האימות</p>
        </div>

        {/* Personal Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">טלפון אישי</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phonePersonal}
              onChange={(e) => setFormData({ ...formData, phonePersonal: e.target.value })}
              placeholder="05XXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.user.phonePersonal || 'לא צוין'}</p>
          )}
        </div>

        {/* Business Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">טלפון העסק</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.businessPhone}
              onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
              placeholder="05XXXXXXXX או טלפון קווי"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.user.businessPhone || 'לא צוין'}</p>
          )}
        </div>
      </div>

      {isEditing && (
        <>
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">שגיאה בשמירת הנתונים:</h3>
                  <p className="text-sm text-red-700 whitespace-pre-line">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={async () => {
                try {
                  setErrorMessage('');
                  await updatePersonal.mutateAsync({
                    fullName: formData.fullName,
                    phonePersonal: formData.phonePersonal,
                    businessPhone: formData.businessPhone,
                  });
                  setIsEditing(false);
                } catch (error: any) {
                  console.error('Error updating details:', error);
                  
                  // Parse error message
                  let errorMsg = 'אירעה שגיאה בשמירת הפרטים';
                  
                  if (error.response?.data?.message) {
                    try {
                      // Try to parse as JSON array of validation errors
                      const validationErrors = JSON.parse(error.response.data.message);
                      if (Array.isArray(validationErrors)) {
                        errorMsg = validationErrors
                          .map((err: any) => err.message)
                          .join('\n');
                      } else {
                        errorMsg = error.response.data.message;
                      }
                    } catch {
                      // If not JSON, use as is
                      errorMsg = error.response.data.message;
                    }
                  } else if (error.message) {
                    errorMsg = error.message;
                  }
                  
                  setErrorMessage(errorMsg);
                }
              }}
              disabled={updatePersonal.isPending}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {updatePersonal.isPending ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setErrorMessage('');
                setFormData({
                  fullName: profile.user.name || '',
                  phonePersonal: profile.user.phonePersonal || '',
                  businessPhone: profile.user.businessPhone || '',
                  businessAddressPending: profile.office?.businessAddressPending || profile.office?.businessAddressApproved || '',
                });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              ביטול
            </button>
          </div>
        </>
      )}

      {/* Office Address Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">כתובת משרד</h3>
        
        {/* Pending Address - from registration or change request */}
        {(profile.office?.businessAddressPending && profile.office?.businessAddressPending !== profile.office?.businessAddressApproved) ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800">
              <strong>⏳ {profile.office?.businessAddressApproved && profile.office.businessAddressApproved !== 'לא הוגדר' ? 'בקשת שינוי ממתינה לאישור מנהל' : 'כתובת ממתינה לאישור מנהל (מההרשמה)'}:</strong>
            </p>
            <p className="text-sm text-orange-700 mt-1">{profile.office.businessAddressPending}</p>
            {profile.office?.businessAddressApproved && profile.office.businessAddressApproved !== 'לא הוגדר' && (
              <p className="text-xs text-gray-600 mt-2">
                <strong>כתובת נוכחית:</strong> {profile.office.businessAddressApproved}
              </p>
            )}
          </div>
        ) : (profile.office?.businessAddressApproved && profile.office.businessAddressApproved !== 'לא הוגדר') ? (
          /* Approved Address */
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>✅ כתובת מאושרת:</strong> {profile.office.businessAddressApproved}
            </p>
          </div>
        ) : (
          /* No Address at all */
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>כתובת משרד:</strong> לא הוגדרה
            </p>
          </div>
        )}

        {/* Recently Approved */}
        {addressApproved && !(profile.office?.businessAddressPending && profile.office?.businessAddressPending !== profile.office?.businessAddressApproved) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ עדכון כתובת משרד אושר!</p>
            <p className="text-sm text-green-700 mb-1">
              <strong>הכתובת החדשה:</strong> {profile.office?.businessAddressApproved}
            </p>
            {addressApproved.adminNotes && (
              <p className="text-sm text-green-700">הערת מנהל: {addressApproved.adminNotes}</p>
            )}
          </div>
        )}

        {/* Rejected */}
        {addressRejection && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-red-800 mb-1">❌ הבקשה לעדכון כתובת משרד נדחתה</p>
            {addressRejection.adminNotes && (
              <p className="text-sm text-red-700">הערת מנהל: {addressRejection.adminNotes}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">בקשת שינוי כתובת משרד</label>
          <p className="text-xs text-gray-500 mb-2">
            שינוי כתובת המשרד דורש אישור מנהל. הכתובת תעודכן רק לאחר אישור.
          </p>
          {addressErrorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">שגיאה בשליחת הבקשה:</h3>
                  <p className="text-sm text-red-700 whitespace-pre-line">{addressErrorMessage}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <input
              type="text"
              value={formData.businessAddressPending}
              onChange={(e) => setFormData({ ...formData, businessAddressPending: e.target.value })}
              placeholder="הזן כתובת משרד חדשה"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={async () => {
                const currentOfficeAddress = profile.office?.businessAddressPending || profile.office?.businessAddressApproved || '';
                if (formData.businessAddressPending && formData.businessAddressPending !== currentOfficeAddress) {
                  try {
                    setAddressErrorMessage('');
                    await updateOffice.mutateAsync({
                      businessAddressPending: formData.businessAddressPending,
                    });
                  } catch (error: any) {
                    console.error('Error updating office address:', error);
                    
                    // Parse error message
                    let errorMsg = 'אירעה שגיאה בשליחת הבקשה';
                    
                    if (error.response?.data?.message) {
                      try {
                        // Try to parse as JSON array of validation errors
                        const validationErrors = JSON.parse(error.response.data.message);
                        if (Array.isArray(validationErrors)) {
                          errorMsg = validationErrors
                            .map((err: any) => err.message)
                            .join('\n');
                        } else {
                          errorMsg = error.response.data.message;
                        }
                      } catch {
                        // If not JSON, use as is
                        errorMsg = error.response.data.message;
                      }
                    } else if (error.message) {
                      errorMsg = error.message;
                    }
                    
                    setAddressErrorMessage(errorMsg);
                  }
                }
              }}
              disabled={updateOffice.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {updateOffice.isPending ? 'שולח...' : 'שלח בקשה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsTab;
