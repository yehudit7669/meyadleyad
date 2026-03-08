import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './NewspaperSheetEditor.css';

// Demo data for visual regression testing
const DEMO_DATA = {
  title: 'לוח מודעות',
  headerImage: null,
  listings: [
    {
      id: '1',
      address: 'רח׳ הרצל 15, רמת גן',
      description: 'דירת 4 חדרים מרווחת ומוארת, מיקום מעולה, קרוב לשירותים ותחבורה ציבורית. המחיר כולל שיפוצים.',
      rooms: '4',
      floor: '3',
      size: '100',
      price: 2500000,
      isBrokerage: true,
      features: {
        parking: true,
        elevator: true,
        balcony: true,
        ac: true,
        storage: true,
      },
      contactName: 'יוסי כהן',
      contactPhone: '050-1234567',
    },
    {
      id: '2',
      address: 'שד׳ רוטשילד 88, תל אביב',
      description: 'דירת גן יוקרתית עם חצר פרטית, מושקעת ומעוצבת. נוף פתוח ומרהיב.',
      rooms: '5',
      floor: 'קרקע',
      size: '130',
      price: 4200000,
      isBrokerage: false,
      features: {
        parking: true,
        elevator: true,
        balcony: true,
        ac: true,
        yard: true,
        safeRoom: true,
        sukkaBalcony: true,
      },
      contactName: 'משה לוי',
      contactPhone: '052-9876543',
    },
    {
      id: '3',
      address: 'רח׳ אבן גבירול 123, תל אביב',
      description: 'דירה חדשה מקבלן, גימורי פרימיום, מיידי. במרכז העיר.',
      rooms: '3',
      floor: '8',
      size: '85',
      price: 3100000,
      isBrokerage: true,
      features: {
        parking: true,
        elevator: true,
        ac: true,
        parentalUnit: true,
      },
      contactName: 'דוד אברהם',
      contactPhone: '054-5556789',
    },
    {
      id: '4',
      address: 'רח׳ דיזנגוף 200, תל אביב',
      description: 'פנטהאוז מדהים עם מרפסת גג ענקית ונוף לים. מטבח מעוצב וחדרי שינה מרווחים.',
      rooms: '6',
      floor: '15',
      size: '180',
      price: 7800000,
      isBrokerage: false,
      features: {
        parking: true,
        elevator: true,
        balcony: true,
        ac: true,
        storage: true,
        safeRoom: true,
        view: true,
        sukkaBalcony: true,
      },
      contactName: 'רונית דוד',
      contactPhone: '053-1112233',
    },
    {
      id: '5',
      address: 'רח׳ הירקון 50, תל אביב',
      description: 'דירה חדשה מקבלן בשכונת מגורים שקטה. קרוב לחוף הים ולפארקים.',
      rooms: '3.5',
      floor: '2',
      size: '95',
      price: 3500000,
      isBrokerage: true,
      features: {
        parking: true,
        balcony: true,
        ac: true,
        elevator: true,
      },
      contactName: 'אלי מזרחי',
      contactPhone: '050-9998877',
    },
    {
      id: '6',
      address: 'רח׳ ויצמן 45, כפר סבא',
      description: 'דירת 4 חדרים במצב מצוין, משופצת לחלוטין. נוף יפה ומרווח.',
      rooms: '4',
      floor: '5',
      size: '105',
      price: 2700000,
      isBrokerage: false,
      features: {
        parking: true,
        elevator: true,
        ac: true,
        balcony: true,
        storage: true,
      },
      contactName: 'שרה גולדברג',
      contactPhone: '052-7778899',
    },
    {
      id: '7',
      address: 'רח׳ בן יהודה 30, תל אביב',
      description: 'דירה מעולה במיקום מרכזי, קרובה לים ולכל השירותים.',
      rooms: '3',
      floor: '4',
      size: '90',
      price: 2900000,
      isBrokerage: true,
      features: {
        parking: true,
        elevator: true,
        ac: true,
      },
      contactName: 'חיים כהן',
      contactPhone: '050-1231234',
    },
    {
      id: '8',
      address: 'רח׳ שפרינצק 12, רמת גן',
      description: 'דירת 5 חדרים משופצת ברמה גבוהה, עם חניה ומחסן.',
      rooms: '5',
      floor: '2',
      size: '120',
      price: 3200000,
      isBrokerage: false,
      features: {
        parking: true,
        storage: true,
        balcony: true,
        ac: true,
      },
      contactName: 'דינה לוי',
      contactPhone: '052-3334455',
    },
    {
      id: '9',
      address: 'רח׳ ארלוזורוב 77, תל אביב',
      description: 'דירה חדישה עם גימורים מעולים ונוף פתוח.',
      rooms: '4',
      floor: '6',
      size: '110',
      price: 3700000,
      isBrokerage: true,
      features: {
        elevator: true,
        ac: true,
        balcony: true,
        parking: true,
        safeRoom: true,
      },
      contactName: 'אריה גולד',
      contactPhone: '054-9876543',
    },
    {
      id: '10',
      address: 'רח׳ הנשיא 25, הרצליה',
      description: 'דירת יוקרה עם מרפסת גדולה וחניה כפולה.',
      rooms: '5',
      floor: '3',
      size: '140',
      price: 5200000,
      isBrokerage: false,
      features: {
        parking: true,
        balcony: true,
        ac: true,
        elevator: true,
        storage: true,
      },
      contactName: 'רחל אברהם',
      contactPhone: '053-7778899',
    },
    {
      id: '11',
      address: 'רח׳ נורדאו 88, תל אביב',
      description: 'דירה במיקום מעולה, קרובה לתחבורה ציבורית.',
      rooms: '3.5',
      floor: '1',
      size: '95',
      price: 2800000,
      isBrokerage: true,
      features: {
        ac: true,
        balcony: true,
        parking: true,
      },
      contactName: 'משה דוד',
      contactPhone: '050-5554433',
    },
    {
      id: '12',
      address: 'רח׳ קרליבך 15, תל אביב',
      description: 'דירת 4 חדרים מטופחת עם נוף לפארק.',
      rooms: '4',
      floor: '5',
      size: '105',
      price: 3100000,
      isBrokerage: false,
      features: {
        parking: true,
        elevator: true,
        balcony: true,
        ac: true,
      },
      contactName: 'יעל כהן',
      contactPhone: '052-1112233',
    },
    {
      id: '13',
      address: 'רח׳ אחד העם 50, תל אביב',
      description: 'דירה יפה ומוארת, משופצת לאחרונה.',
      rooms: '3',
      floor: '7',
      size: '85',
      price: 2600000,
      isBrokerage: true,
      features: {
        elevator: true,
        ac: true,
        balcony: true,
      },
      contactName: 'דן מזרחי',
      contactPhone: '054-6667788',
    },
    {
      id: '14',
      address: 'רח׳ פרישמן 33, תל אביב',
      description: 'דירת 5 חדרים מרווחת במיוחד עם חניה.',
      rooms: '5',
      floor: '4',
      size: '125',
      price: 4100000,
      isBrokerage: false,
      features: {
        parking: true,
        elevator: true,
        ac: true,
        storage: true,
        balcony: true,
      },
      contactName: 'שרון לוי',
      contactPhone: '053-9998877',
    },
    {
      id: '15',
      address: 'רח׳ גורדון 42, תל אביב',
      description: 'דירה קרובה לים עם מרפסת שמש ונוף מדהים.',
      rooms: '4',
      floor: '8',
      size: '115',
      price: 3900000,
      isBrokerage: true,
      features: {
        parking: true,
        elevator: true,
        balcony: true,
        ac: true,
        view: true,
      },
      contactName: 'אבי גולדשטיין',
      contactPhone: '050-2223344',
    },
  ],
};

function PropertyCard({ listing }: { listing: typeof DEMO_DATA.listings[0] }) {
  const features: string[] = [];
  
  if ('hasOption' in listing.features && listing.features.hasOption) features.push('אופציה');
  if (listing.features.parking) features.push('חניה');
  if ('parentalUnit' in listing.features && listing.features.parentalUnit) features.push('יחידת הורים');
  if ('storage' in listing.features && listing.features.storage) features.push('מחסן');
  if (listing.features.ac) features.push('מיזוג');
  if ('elevator' in listing.features && listing.features.elevator) features.push('מעלית');
  if ('balcony' in listing.features && listing.features.balcony) features.push('מרפסת');
  if ('safeRoom' in listing.features && listing.features.safeRoom) features.push('ממ״ד');
  if ('sukkaBalcony' in listing.features && listing.features.sukkaBalcony) features.push('מרפסת סוכה');
  if ('view' in listing.features && listing.features.view) features.push('נוף');
  if ('yard' in listing.features && listing.features.yard) features.push('חצר');
  if ('garden' in listing.features && listing.features.garden) features.push('גינה');
  if ('frontFacing' in listing.features && listing.features.frontFacing) features.push('חזית');
  if ('upgradedKitchen' in listing.features && listing.features.upgradedKitchen) features.push('מטבח משודרג');
  if ('accessibleForDisabled' in listing.features && listing.features.accessibleForDisabled) features.push('נגיש לנכים');
  if ('pool' in listing.features && listing.features.pool) features.push('בריכה');

  // Extract street and house number only (remove city)
  const formatAddress = (fullAddress: string) => {
    if (!fullAddress) return 'נכס';
    const parts = fullAddress.split(',');
    
    // אם יש רחוב (שני חלקים מופרדים בפסיק)
    if (parts.length >= 2) {
      let streetPart = parts[1].trim();  // "רח׳ הרצל 10 (נווה שרת)"
      
      // חילוץ השכונה מהסוגריים
      const neighborhoodMatch = streetPart.match(/\(([^)]+)\)/);
      const neighborhood = neighborhoodMatch ? neighborhoodMatch[1] : null;
      
      // הסרת הסוגריים מהרחוב
      const streetWithoutNeighborhood = streetPart.replace(/\s*\([^)]*\)/, '').trim();
      
      // אם יש שכונה, נציג גם רחוב וגם שכונה
      if (neighborhood) {
        return `${streetWithoutNeighborhood}, ${neighborhood}`;
      }
      
      return streetWithoutNeighborhood;
    }
    
    // אם אין פסיק - זו כנראה רק שכונה או עיר
    // נבדוק אם יש סוגריים
    const neighborhoodMatch = parts[0].match(/\(([^)]+)\)/);
    if (neighborhoodMatch) {
      return neighborhoodMatch[1];  // מחזיר רק את השכונה
    }
    
    return parts[0].trim();
  };

  return (
    <div className="newspaper-property-card">
      {/* Brokerage Badge */}
      {listing.isBrokerage && <div className="brokerage-badge">תיווך</div>}

      {/* Card Header: Address */}
      <div className="property-card-header">
        <div className="property-title">{formatAddress(listing.address)}</div>
      </div>

      {/* Card Body */}
      <div className="property-card-body">
        {/* Icons Row: Size, Floor, Rooms */}
        <div className="property-meta">
          {listing.size && (
            <div className="meta-item">
              <span className="meta-icon">📐</span>
              <span className="meta-value">{listing.size}</span>
            </div>
          )}
          {listing.floor && (
            <div className="meta-item">
              <span className="meta-icon">🏢</span>
              <span className="meta-value">{listing.floor}</span>
            </div>
          )}
          {listing.rooms && (
            <div className="meta-item">
              <span className="meta-icon">🚪</span>
              <span className="meta-value">{listing.rooms}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="property-description">
          {listing.description}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="property-features">
            {features.join(' · ')}
          </div>
        )}

        {/* Price */}
        {listing.price && (
          <div className="property-price">₪{listing.price.toLocaleString()}</div>
        )}
      </div>

      {/* Footer: Contact */}
      <div className="property-contact">
        <div className="contact-name">{listing.contactName}</div>
        <div className="contact-phone">{listing.contactPhone}</div>
      </div>
    </div>
  );
}

export default function NewspaperVisualTestPage() {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/newspaper')}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>חזרה</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-lg font-bold text-gray-900">בדיקת עיצוב - Visual Regression</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>רענן</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Preview */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div 
          className="mx-auto bg-white shadow-2xl newspaper-page"
          style={{
            width: `${(210 * zoom) / 100}mm`,
            minHeight: `${(297 * zoom) / 100}mm`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >

          {/* Header - Matching Reference HTML Design */}
          <div className="newspaper-header">
            {/* Title (Right Side) */}
            <h1 className="newspaper-title">{DEMO_DATA.title || 'לוח מודעות'}</h1>

            {/* Horizontal Line */}
            <div className="header-line"></div>

            {/* Issue Number & Date (Left Side) */}
            <div className="issue-number">גליון 1</div>
            <div className="issue-date">
              {new Date().toLocaleDateString('he-IL', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' })}
            </div>
          </div>

          {/* Content Area with Grid */}
          <div className="newspaper-content">
            {/* Vertical Ribbon - Category + City */}
            <div className="newspaper-ribbon">
              <span style={{ fontSize: '1.25rem' }}>דירות למכירה</span> <span style={{ marginBottom: '0.5rem' }}>תל אביב</span>
            </div>

            <div className="newspaper-grid">
              {DEMO_DATA.listings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
