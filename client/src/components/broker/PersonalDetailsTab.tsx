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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update personal details
      await updatePersonal.mutateAsync({
        fullName: formData.fullName,
        phonePersonal: formData.phonePersonal,
        businessPhone: formData.businessPhone,
      });

      // Update office address only if it actually changed
      const currentOfficeAddress = profile.office?.businessAddressPending || profile.office?.businessAddressApproved || '';
      if (formData.businessAddressPending && formData.businessAddressPending !== currentOfficeAddress) {
        await updateOffice.mutateAsync({
          businessAddressPending: formData.businessAddressPending,
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating details:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">פרטים אישיים</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ערוך פרטים
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="phonePersonal" className="block text-sm font-medium text-gray-700 mb-1">
              טלפון אישי *
            </label>
            <input
              type="tel"
              id="phonePersonal"
              name="phonePersonal"
              value={formData.phonePersonal}
              onChange={handleChange}
              pattern="05[0-9]{8}"
              placeholder="0501234567"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-1">
              טלפון עסק
            </label>
            <input
              type="tel"
              id="businessPhone"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleChange}
              pattern="0[2-9][0-9]{7,8}"
              placeholder="021234567"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="businessAddressPending" className="block text-sm font-medium text-gray-700 mb-1">
              כתובת משרד
            </label>
            <input
              type="text"
              id="businessAddressPending"
              name="businessAddressPending"
              value={formData.businessAddressPending}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {profile.office?.businessAddressPending && profile.office?.businessAddressPending !== profile.office?.businessAddressApproved && (
              <p className="text-sm text-orange-600 mt-1">
                ⏳ שינוי כתובת ממתין לאישור
              </p>
            )}
            {addressApproved && !(profile.office?.businessAddressPending && profile.office?.businessAddressPending !== profile.office?.businessAddressApproved) && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-1">✅ עדכון כתובת משרד אושר!</p>
                {addressApproved.adminNotes && (
                  <p className="text-sm text-green-700">הערת מנהל: {addressApproved.adminNotes}</p>
                )}
              </div>
            )}
            {addressRejection && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-1">❌ עדכון כתובת המשרד נדחה</p>
                {addressRejection.adminNotes && (
                  <p className="text-sm text-red-700">הערת מנהל: {addressRejection.adminNotes}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updatePersonal.isPending || updateOffice.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {updatePersonal.isPending || updateOffice.isPending ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  fullName: profile.user.name || '',
                  phonePersonal: profile.user.phonePersonal || '',
                  businessPhone: profile.user.businessPhone || '',
                  businessAddressPending: profile.office?.businessAddressPending || profile.office?.businessAddressApproved || '',
                });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">שם מלא</p>
            <p className="text-lg font-semibold">{profile.user.name || 'לא הוגדר'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">אימייל</p>
            <p className="text-lg font-semibold">{profile.user.email}</p>
            {profile.user.pendingEmail && (
              <p className="text-sm text-orange-600 mt-1">
                ⏳ שינוי ל-{profile.user.pendingEmail} ממתין לאישור
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">טלפון אישי</p>
            <p className="text-lg font-semibold">{profile.user.phonePersonal || 'לא הוגדר'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">טלפון עסק</p>
            <p className="text-lg font-semibold">{profile.user.businessPhone || 'לא הוגדר'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">כתובת משרד (מאושרת)</p>
            <p className="text-lg font-semibold">{profile.office?.businessAddressApproved || 'לא הוגדרה'}</p>
            {profile.office?.businessAddressPending && profile.office?.businessAddressPending !== profile.office?.businessAddressApproved && (
              <p className="text-sm text-orange-600 mt-2">
                ⏳ שינוי ל-{profile.office?.businessAddressPending} ממתין לאישור
              </p>
            )}
            {addressApproved && !(profile.office?.businessAddressPending && profile.office?.businessAddressPending !== profile.office?.businessAddressApproved) && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-1">✅ עדכון כתובת משרד אושר!</p>
                {addressApproved.adminNotes && (
                  <p className="text-sm text-green-700">הערת מנהל: {addressApproved.adminNotes}</p>
                )}
              </div>
            )}
            {addressRejection && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-1">❌ הבקשה לעדכון כתובת משרד נדחתה</p>
                {addressRejection.adminNotes && (
                  <p className="text-sm text-red-700">הערת מנהל: {addressRejection.adminNotes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDetailsTab;
