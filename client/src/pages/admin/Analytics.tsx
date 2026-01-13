import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/api';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics-pages'],
    queryFn: adminService.getAnalyticsPages,
  });

  const handleExport = async () => {
    const blob = await adminService.getAnalyticsExport();
    const url = window.URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-export.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">אנליטיקות צפיות</h1>
      <button onClick={handleExport} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded">ייצוא לאקסל</button>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="p-2 border">עמוד</th>
              <th className="p-2 border">צפיות</th>
              <th className="p-2 border">זמן ממוצע</th>
              <th className="p-2 border">פעולות נפוצות</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center p-4">טוען...</td></tr>
            ) : (
              data?.map((row: any) => (
                <tr key={row.page}>
                  <td className="p-2 border">{row.page}</td>
                  <td className="p-2 border">{row.views}</td>
                  <td className="p-2 border">{row.avgTime || '—'}</td>
                  <td className="p-2 border">{row.commonActions || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
