import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/api';

export default function AppointmentsAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => adminService.getAdminAppointments(),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול תיאומי פגישות</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">מודעה</th>
              <th className="p-2 border">מבקש</th>
              <th className="p-2 border">סטטוס</th>
              <th className="p-2 border">תאריך</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center p-4">טוען...</td></tr>
            ) : (
              (data as any)?.appointments?.map((apt: any, i: number) => (
                <tr key={apt.id}>
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{apt.adTitle}</td>
                  <td className="p-2 border">{apt.requesterName}</td>
                  <td className="p-2 border">{apt.status}</td>
                  <td className="p-2 border">{new Date(apt.date).toLocaleString('he-IL')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
