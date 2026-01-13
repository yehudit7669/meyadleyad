import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/api';

export default function MailingManager() {
  const [tab, setTab] = useState<'content' | 'subscribers' | 'stats'>('content');
  const { data: subscribers, isLoading: loadingSubs } = useQuery({
    queryKey: ['admin-mailing-subscribers'],
    queryFn: adminService.getMailingSubscribers,
  });
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-mailing-stats'],
    queryFn: adminService.getMailingStats,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול תפוצה ותוכן</h1>
      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('content')} className={tab==='content'?"font-bold underline":""}>תוכן</button>
        <button onClick={() => setTab('subscribers')} className={tab==='subscribers'?"font-bold underline":""}>תפוצה</button>
        <button onClick={() => setTab('stats')} className={tab==='stats'?"font-bold underline":""}>סטטיסטיקה</button>
      </div>
      {tab === 'content' && (
        <div>
          <h2 className="text-xl font-bold mb-4">תוכן אחרון</h2>
          {/* כאן יבוא preview של התוכן האחרון + כפתור resend */}
          <button className="bg-blue-600 text-white px-4 py-2 rounded">שלח מחדש</button>
        </div>
      )}
      {tab === 'subscribers' && (
        <div>
          <h2 className="text-xl font-bold mb-4">רשימת תפוצה</h2>
          {loadingSubs ? 'טוען...' : (
            <table className="min-w-full bg-white border">
              <thead><tr><th className="p-2 border">אימייל</th><th className="p-2 border">נרשם</th></tr></thead>
              <tbody>
                {subscribers?.map((s: any) => (
                  <tr key={s.email}><td className="p-2 border">{s.email}</td><td className="p-2 border">{new Date(s.createdAt).toLocaleDateString('he-IL')}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'stats' && (
        <div>
          <h2 className="text-xl font-bold mb-4">סטטיסטיקה</h2>
          {loadingStats ? 'טוען...' : (
            <div>
              <div>סה"כ תפוצה: {stats?.total || 0}</div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4">ייצוא CSV</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
