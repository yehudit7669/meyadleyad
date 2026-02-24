import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceProviderService, pendingApprovalsService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
  profile: any;
  onUpdate: () => void;
}

const SPPersonalDetailsTab: React.FC<Props> = ({ profile, onUpdate }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phonePersonal: profile.phonePersonal || '',
    phoneBusinessOffice: profile.phoneBusinessOffice || '',
  });
  const [newOfficeAddress, setNewOfficeAddress] = useState('');

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

  const updateMutation = useMutation({
    mutationFn: serviceProviderService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('הפרטים עודכנו בהצלחה');
      setIsEditing(false);
      onUpdate();
    },
    onError: () => {
      toast.error('שגיאה בעדכון הפרטים');
    },
  });

  const addressChangeMutation = useMutation({
    mutationFn: (address: string) => pendingApprovalsService.create({
      type: 'OFFICE_ADDRESS_UPDATE',
      requestData: {
        officeAddress: address,
      },
      oldData: {
        officeAddress: profile.officeAddress,
      },
      reason: 'עדכון כתובת משרד',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('בקשת שינוי כתובת נשלחה ומחכה לאישור מנהל');
      setNewOfficeAddress('');
      onUpdate();
    },
    onError: () => {
      toast.error('שגיאה בשליחת בקשת שינוי כתובת');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleAddressChange = () => {
    if (!newOfficeAddress.trim()) {
      toast.error('נא להזין כתובת משרד');
      return;
    }
    addressChangeMutation.mutate(newOfficeAddress);
  };

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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.name || 'לא צוין'}</p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
          <p className="text-gray-900 py-2">{profile.email}</p>
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
            <p className="text-gray-900 py-2">{profile.phonePersonal || 'לא צוין'}</p>
          )}
        </div>

        {/* Business Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">טלפון העסק</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phoneBusinessOffice}
              onChange={(e) => setFormData({ ...formData, phoneBusinessOffice: e.target.value })}
              placeholder="05XXXXXXXX או טלפון קווי"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.phoneBusinessOffice || 'לא צוין'}</p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: profile.name || '',
                phonePersonal: profile.phonePersonal || '',
                phoneBusinessOffice: profile.phoneBusinessOffice || '',
              });
            }}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            ביטול
          </button>
        </div>
      )}

      {/* Office Address Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">כתובת משרד</h3>
        
        {/* Pending Address - from registration or change request */}
        {profile.officeAddressPending && profile.officeAddressPending !== profile.officeAddress ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800">
              <strong>⏳ {profile.officeAddress && profile.officeAddress !== 'לא הוגדר' ? 'בקשת שינוי ממתינה לאישור מנהל' : 'כתובת ממתינה לאישור מנהל (מההרשמה)'}:</strong>
            </p>
            <p className="text-sm text-orange-700 mt-1">{profile.officeAddressPending}</p>
            {profile.officeAddress && profile.officeAddress !== 'לא הוגדר' && (
              <p className="text-xs text-gray-600 mt-2">
                <strong>כתובת נוכחית:</strong> {profile.officeAddress}
              </p>
            )}
          </div>
        ) : profile.officeAddress && profile.officeAddress !== 'לא הוגדר' ? (
          /* Approved Address */
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>✅ כתובת מאושרת:</strong> {profile.officeAddress}
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
        {addressApproved && profile.officeAddressStatus !== 'PENDING' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ עדכון כתובת משרד אושר!</p>
            <p className="text-sm text-green-700 mb-1">
              <strong>הכתובת החדשה:</strong> {addressApproved.requestData?.officeAddress || profile.officeAddress || profile.officeAddressPending}
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
          <div className="flex gap-4">
            <input
              type="text"
              value={newOfficeAddress}
              onChange={(e) => setNewOfficeAddress(e.target.value)}
              placeholder="הזן כתובת משרד חדשה"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddressChange}
              disabled={addressChangeMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {addressChangeMutation.isPending ? 'שולח...' : 'שלח בקשה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SPPersonalDetailsTab;
