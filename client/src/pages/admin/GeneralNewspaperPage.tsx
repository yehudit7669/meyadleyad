/**
 * GeneralNewspaperPage
 * דף ייעודי ליצירת לוח מודעות כללי
 */

import GeneralNewspaperSheet from '../../components/admin/GeneralNewspaperSheet';

export default function GeneralNewspaperPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          לוח מודעות כללי
        </h1>
        <p className="text-gray-600">
          צור קובץ PDF אחד המאחד את כל לוחות המודעות מכל הקטגוריות והערים
        </p>
      </div>

      <GeneralNewspaperSheet />

      {/* Additional Information Section */}
      <div className="mt-12 max-w-2xl mx-auto">
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-semibold mb-4">שאלות נפוצות</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                מה ההבדל בין "לפי עיר" ל"לפי קטגוריה"?
              </h3>
              <p className="text-sm text-gray-600">
                <strong>לפי עיר:</strong> כל הקטגוריות של עיר אחת מקובצות יחד, ואז עוברים לעיר הבאה.<br />
                <strong>לפי קטגוריה:</strong> כל הערים של קטגוריה אחת מקובצות יחד, ואז עוברים לקטגוריה הבאה.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                האם הלוח מתעדכן אוטומטית?
              </h3>
              <p className="text-sm text-gray-600">
                כן! כל פעם שתיצור לוח כללי חדש, הוא ייווצר עם כל הנכסים האחרונים מהמערכת.
                אין צורך בעדכון ידני.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                מה מופיע בעמוד הראשון?
              </h3>
              <p className="text-sm text-gray-600">
                בעמוד הראשון מופיעה כותרת "לוח מודעות כללי" יחד עם מידע על מספר הלוחות המקובצים.
                בדפים הבאים מופיעות רק המודעות עצמן עם סרגל צד המציג את העיר והקטגוריה.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                האם אפשר לייצר לוח רק מערים או קטגוריות ספציפיות?
              </h3>
              <p className="text-sm text-gray-600">
                בגרסה הנוכחית, הלוח הכללי כולל את כל הנכסים מכל הערים והקטגוריות.
                ניתן להוסיף פילטרים בגרסאות עתידיות.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                היכן הקובץ נשמר?
              </h3>
              <p className="text-sm text-gray-600">
                הקובץ נשמר בתיקייה <code className="bg-gray-100 px-1 py-0.5 rounded">/uploads/newspaper-sheets/</code> 
                עם שם ייחודי הכולל תאריך ושעת יצירה.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
