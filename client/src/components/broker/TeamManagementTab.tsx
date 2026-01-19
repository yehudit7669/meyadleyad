import React, { useState } from 'react';
import {
  useBrokerTeam,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
} from '../../hooks/useBroker';

const TeamManagementTab: React.FC = () => {
  const { data: teamMembers = [], isLoading } = useBrokerTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // When editing, don't send password
      const { password, ...updateData } = formData;
      await updateMember.mutateAsync({ id: editingId, data: updateData });
      setEditingId(null);
    } else {
      // When creating, include password
      await createMember.mutateAsync(formData);
      setShowAddForm(false);
    }
    
    setFormData({ fullName: '', email: '', phone: '', password: '' });
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setFormData({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      password: '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך להסיר את איש הצוות?')) {
      await deleteMember.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניהול צוות</h2>
          <p className="text-gray-600 text-sm mt-1">
            הוסף מתווכים נוספים המשויכים למשרד שלך
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData({ fullName: '', email: '', phone: '', password: '' });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + הוסף מתווך
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">
            {editingId ? 'ערוך איש צוות' : 'הוסף איש צוות חדש'}
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!editingId}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
            {editingId && (
              <p className="text-xs text-gray-500 mt-1">לא ניתן לשנות כתובת מייל</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טלפון *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              pattern="05[0-9]{8}"
              placeholder="0501234567"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה ראשונית *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="לפחות 6 תווים"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                זו הסיסמה שאיש הצוות ישתמש בה להתחברות למערכת
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createMember.isPending || updateMember.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {createMember.isPending || updateMember.isPending ? 'שומר...' : 'שמור'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setFormData({ fullName: '', email: '', phone: '', password: '' });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {teamMembers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">טרם נוספו אנשי צוות</p>
            <p className="text-sm text-gray-500 mt-2">
              אנשי צוות אינם יכולים לנהל משרד, אך ניתן לשייך אותם למודעות
            </p>
          </div>
        ) : (
          teamMembers.map((member: any) => (
            <div
              key={member.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow"
            >
              <div>
                <h4 className="font-semibold text-lg">{member.fullName}</h4>
                <p className="text-sm text-gray-600">{member.email}</p>
                <p className="text-sm text-gray-600">{member.phone}</p>
                {!member.isActive && (
                  <span className="inline-block mt-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                    לא פעיל
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50"
                >
                  ערוך
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={deleteMember.isPending}
                  className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  הסר
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamManagementTab;
