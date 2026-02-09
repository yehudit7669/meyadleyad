import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Newspaper, 
  Save, 
  Eye,
  RefreshCw,
  ArrowLeft,
  Upload,
  ZoomIn,
  ZoomOut,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  rectSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import AdvertisementManager from '../../components/admin/AdvertisementManager';
import './NewspaperSheetEditor.css';

// Helper to get full image URL
const getImageUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove /api from the end if it exists, since uploads are served from root
  const baseUrl = apiUrl.replace(/\/api$/, '');
  return `${baseUrl}${url}`;
};

interface Listing {
  id: string;
  listingId: string;
  positionIndex: number;
  listing: {
    id: string;
    title: string;
    address: string;
    price: number;
    customFields?: any;
    User?: {
      name: string | null;
      email: string;
      phone: string | null;
    };
  };
}

interface NewspaperSheet {
  id: string;
  title: string;
  headerImage: string | null;
  layoutConfig?: string | null;
  version: number;
  status: string;
  pdfPath: string | null;
  category: {
    nameHe: string;
  };
  city: {
    nameHe: string;
  };
  listings: Listing[];
  ads?: Advertisement[];
  _count: {
    listings: number;
  };
}

interface Advertisement {
  id: string;
  imageUrl: string;
  size: '1x1' | '2x1' | '3x1' | '2x2';
  anchorType: 'beforeIndex' | 'pagePosition';
  beforeListingId?: string;
  page?: number;
  row?: number;
  col?: number;
}

// Sortable Property Card in Grid (with newspaper styling)
function SortablePropertyCard({ listing, onRemove }: { listing: Listing; onRemove: (listing: Listing) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: listing.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Extract data
  const customFields = (listing.listing as any).customFields || {};
  const rooms = customFields.rooms || '';
  const size = customFields.size || '';
  const floor = customFields.floor || '';
  const isBrokerage = customFields.isBrokerage === true || customFields.brokerage === true;

  // Features
  const features: string[] = [];
  const featuresObj = customFields.features || {};
  
  if (featuresObj.hasOption) features.push('אופציה');
  if (featuresObj.parking) features.push('חניה');
  if (featuresObj.parentalUnit || featuresObj.masterUnit) features.push('יחידת הורים');
  if (featuresObj.storage) features.push('מחסן');
  if (featuresObj.ac || featuresObj.airConditioning) features.push('מיזוג');
  if (featuresObj.elevator) features.push('מעלית');
  if (featuresObj.balcony) features.push('מרפסת');
  if (featuresObj.safeRoom) features.push('ממ״ד');
  if (featuresObj.sukkaBalcony) features.push('מרפסת סוכה');
  if (featuresObj.view) features.push('נוף');
  if (featuresObj.yard) features.push('חצר');
  if (featuresObj.housingUnit) features.push('יח׳ דיור');

  const contactName = customFields.contactName || 'פרטים נוספים';
  const contactPhone = customFields.contactPhone || (listing.listing as any).User?.phone || '050-000-0000';

  // Extract street and house number only (remove city)
  const formatAddress = (fullAddress: string) => {
    if (!fullAddress) return 'נכס';
    const parts = fullAddress.split(',');
    return parts[0].trim();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-id={listing.id}
      className={`newspaper-property-card cursor-move group ${isDragging ? 'dragging' : ''}`}
    >
      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm('האם להסיר כרטיס זה מהגיליון?')) {
            onRemove(listing);
          }
        }}
        className="absolute top-2 left-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-20 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        title="הסר כרטיס מהגיליון"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Brokerage Badge */}
      {isBrokerage && <div className="brokerage-badge">תיווך</div>}

      {/* Card Header: Address */}
      <div className="property-card-header">
        <div className="property-title">{formatAddress(listing.listing.address)}</div>
      </div>

      {/* Card Body */}
      <div className="property-card-body">
        {/* Icons Row: Size, Floor, Rooms */}
        <div className="property-meta">
          {size && (
            <div className="meta-item">
              <span className="meta-icon">📐</span>
              <span className="meta-value">{size}</span>
            </div>
          )}
          {floor && (
            <div className="meta-item">
              <span className="meta-icon">🏢</span>
              <span className="meta-value">{floor}</span>
            </div>
          )}
          {rooms && (
            <div className="meta-item">
              <span className="meta-icon">🚪</span>
              <span className="meta-value">{rooms}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="property-description">
          {listing.listing.title}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="property-features">
            {features.join(' · ')}
          </div>
        )}

        {/* Price */}
        {listing.listing.price && (
          <div className="property-price">₪{listing.listing.price.toLocaleString()}</div>
        )}
      </div>

      {/* Footer: Contact */}
      <div className="property-contact">
        <div className="contact-name">{contactName}</div>
        <div className="contact-phone">{contactPhone}</div>
      </div>
    </div>
  );
}

// PropertyCardOverlay - for DragOverlay (simple clone without drag handlers)
function PropertyCardOverlay({ listing }: { listing: Listing }) {
  const customFields = (listing.listing as any).customFields || {};
  const rooms = customFields.rooms || '';
  const size = customFields.size || '';
  const floor = customFields.floor || '';
  const isBrokerage = customFields.isBrokerage === true || customFields.brokerage === true;

  const features: string[] = [];
  const featuresObj = customFields.features || {};
  
  if (featuresObj.hasOption) features.push('אופציה');
  if (featuresObj.parking) features.push('חניה');
  if (featuresObj.parentalUnit || featuresObj.masterUnit) features.push('יחידת הורים');
  if (featuresObj.storage) features.push('מחסן');
  if (featuresObj.ac || featuresObj.airConditioning) features.push('מיזוג');
  if (featuresObj.elevator) features.push('מעלית');
  if (featuresObj.balcony) features.push('מרפסת');
  if (featuresObj.safeRoom) features.push('ממ״ד');
  if (featuresObj.sukkaBalcony) features.push('מרפסת סוכה');
  if (featuresObj.view) features.push('נוף');
  if (featuresObj.yard) features.push('חצר');
  if (featuresObj.housingUnit) features.push('יח׳ דיור');

  const contactName = customFields.contactName || 'פרטים נוספים';
  const contactPhone = customFields.contactPhone || (listing.listing as any).User?.phone || '050-000-0000';

  const formatAddress = (fullAddress: string) => {
    if (!fullAddress) return 'נכס';
    const parts = fullAddress.split(',');
    return parts[0].trim();
  };

  return (
    <div 
      className="newspaper-property-card" 
      style={{ 
        cursor: 'grabbing'
      }}
    >
      {isBrokerage && <div className="brokerage-badge">תיווך</div>}
      
      <div className="property-card-header">
        <div className="property-title">{formatAddress(listing.listing.address)}</div>
      </div>

      <div className="property-card-body">
        <div className="property-meta">
          {size && (
            <div className="meta-item">
              <span className="meta-icon">📐</span>
              <span className="meta-value">{size}</span>
            </div>
          )}
          {floor && (
            <div className="meta-item">
              <span className="meta-icon">🏢</span>
              <span className="meta-value">{floor}</span>
            </div>
          )}
          {rooms && (
            <div className="meta-item">
              <span className="meta-icon">🚪</span>
              <span className="meta-value">{rooms}</span>
            </div>
          )}
        </div>

        <div className="property-description">
          {listing.listing.title}
        </div>

        {features.length > 0 && (
          <div className="property-features">
            {features.join(' · ')}
          </div>
        )}

        {listing.listing.price && (
          <div className="property-price">₪{listing.listing.price.toLocaleString()}</div>
        )}
      </div>

      <div className="property-contact">
        <div className="contact-name">{contactName}</div>
        <div className="contact-phone">{contactPhone}</div>
      </div>
    </div>
  );
}

// Ad Slot Card - displays advertisement in grid
function AdSlotCard({ ad, onRemove }: { ad: Advertisement; onRemove: () => void }) {
  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  };

  // Parse size to get grid span
  const [cols, rows] = ad.size.split('x').map(Number);

  return (
    <div 
      className="newspaper-property-card group" 
      style={{ 
        position: 'relative', 
        gridColumn: `span ${cols}`,
        gridRow: `span ${rows}`,
        height: '100%'
      }}
    >
      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 left-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-20 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        title="הסר פרסומת"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Ad Badge */}
      <div className="absolute top-2 right-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow z-10">
        פרסומת {ad.size}
      </div>

      {/* Ad Image */}
      <div style={{ 
        width: '100%', 
        height: '100%', 
        padding: '0.5rem',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'stretch'
      }}>
        <img
          src={getImageUrl(ad.imageUrl)}
          alt="Advertisement"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Crop image to fit card dimensions
            borderRadius: '8px',
            display: 'block'
          }}
        />
      </div>

      {/* Ad Info */}
      <div style={{ 
        position: 'absolute', 
        bottom: '8px', 
        left: '8px', 
        right: '8px', 
        background: 'rgba(255, 193, 7, 0.9)', 
        padding: '4px 8px', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {ad.anchorType === 'beforeIndex' ? 'עוגן: לפני נכס' : `עמוד ${ad.page}, שורה ${ad.row}, עמודה ${ad.col}`}
      </div>
    </div>
  );
}

export default function NewspaperSheetEditorPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('לוח מודעות');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [issueNumber, setIssueNumber] = useState('');
  const [isEditingIssueNumber, setIsEditingIssueNumber] = useState(false);
  const [issueDate, setIssueDate] = useState('');
  const [isEditingIssueDate, setIsEditingIssueDate] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerImageHeight, setHeaderImageHeight] = useState(120); // Height in pixels
  const [isResizingHeader, setIsResizingHeader] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [useCalculatedLayout, setUseCalculatedLayout] = useState(false);

  // Sensors with proper activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  // Fetch sheet data
  const { data: sheet, isLoading } = useQuery({
    queryKey: ['newspaper-sheet', sheetId],
    queryFn: async () => {
      const response = await api.get<NewspaperSheet>(`/admin/newspaper-sheets/${sheetId}`);
      return response.data;
    },
    enabled: !!sheetId,
  });

  // Initialize state when data loads
  useEffect(() => {
    if (sheet) {
      setTitle(sheet.title || 'לוח מודעות');
      setIssueNumber((sheet as any).issueNumber || `גליון ${sheet.version}`);
      setIssueDate((sheet as any).issueDate || new Date().toLocaleDateString('he-IL', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' }));
      setHeaderImage(sheet.headerImage);
      // Initialize header image height from layoutConfig or use default
      try {
        const layoutConfig = sheet.layoutConfig 
          ? (typeof sheet.layoutConfig === 'string' 
              ? JSON.parse(sheet.layoutConfig) 
              : sheet.layoutConfig)
          : {};
        setHeaderImageHeight(layoutConfig.headerImageHeight || 120);
      } catch (e) {
        console.error('Failed to parse layoutConfig:', e);
        setHeaderImageHeight(120);
      }
      setListings([...sheet.listings].sort((a, b) => a.positionIndex - b.positionIndex));
      // Enable calculated layout if there are ads
      setUseCalculatedLayout((sheet.ads?.length || 0) > 0);
    }
  }, [sheet]);

  // Fetch calculated layout when there are ads
  const { data: calculatedLayout } = useQuery<any>({
    queryKey: ['newspaper-layout', sheetId, sheet?.ads?.length],
    queryFn: async () => {
      const response = await api.get(`/admin/newspaper-sheets/${sheetId}/calculate-layout`);
      return response.data;
    },
    enabled: !!sheetId && useCalculatedLayout && (sheet?.ads?.length || 0) > 0,
  });

  // Update sheet mutation
  const updateSheetMutation = useMutation({
    mutationFn: async (data: { 
      title?: string; 
      headerImage?: string | null; 
      layoutConfig?: string;
      issueNumber?: string;
      issueDate?: string;
    }) => {
      const response = await api.patch(`/admin/newspaper-sheets/${sheetId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-sheet', sheetId] });
      alert('✅ השינויים נשמרו בהצלחה');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
    },
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async ({ listingId, newPosition }: { listingId: string; newPosition: number }) => {
      const response = await api.patch(
        `/admin/newspaper-sheets/${sheetId}/listings/${listingId}/position`,
        { newPosition }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-sheet', sheetId] });
    },
    onError: (error: any) => {
      alert(`❌ שגיאה בעדכון מיקום: ${error.response?.data?.error || error.message}`);
    },
  });

  // Remove listing from sheet mutation
  const removeListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await api.delete(
        `/admin/newspaper-sheets/${sheetId}/listings/${listingId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-sheet', sheetId] });
    },
    onError: (error: any) => {
      alert(`❌ שגיאה בהסרת כרטיס: ${error.response?.data?.error || error.message}`);
    },
  });

  // Generate PDF mutation
  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/admin/newspaper-sheets/${sheetId}/generate-pdf`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-sheet', sheetId] });
      alert('✅ PDF נוצר בהצלחה!');
    },
    onError: (error: any) => {
      alert(`❌ שגיאה ביצירת PDF: ${error.response?.data?.error || error.message}`);
    },
  });

  // Header image resize handlers
  const handleResizeStart = (e: React.MouseEvent, _direction: 'top' | 'bottom') => {
    e.preventDefault();
    setIsResizingHeader(true);
    setResizeStartY(e.clientY);
    setResizeStartHeight(headerImageHeight);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizingHeader) return;
    
    const deltaY = e.clientY - resizeStartY;
    const scaleAdjustedDelta = deltaY / (zoom / 100);
    const newHeight = Math.max(80, Math.min(300, resizeStartHeight + scaleAdjustedDelta));
    setHeaderImageHeight(newHeight);
  };

  const handleResizeEnd = () => {
    if (isResizingHeader) {
      setIsResizingHeader(false);
    }
  };

  useEffect(() => {
    if (isResizingHeader) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizingHeader, resizeStartY, resizeStartHeight, headerImageHeight, zoom]);

  // Handle remove listing from sheet
  const handleRemoveListing = (listing: Listing) => {
    // Update local state immediately for responsive UI
    setListings(prev => prev.filter(l => l.id !== listing.id));
    // Update server with the actual listing ID (not the junction table ID)
    removeListingMutation.mutate(listing.listingId);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = listings.findIndex((item) => item.id === active.id);
    const newIndex = listings.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newListings = arrayMove(listings, oldIndex, newIndex);
    
    // Update local state immediately
    setListings(newListings);

    // Update position in backend - use the junction table ID (NewspaperSheetListing.id)
    const movedListing = newListings[newIndex];
    updatePositionMutation.mutate({
      listingId: movedListing.id, // This is the NewspaperSheetListing ID, not the Listing ID
      newPosition: newIndex,
    });
  };

  // Handle save title (inline edit)
  const handleSaveTitle = () => {
    if (!title.trim()) {
      alert('❌ כותרת לא יכולה להיות ריקה');
      setTitle('לוח מודעות');
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<{ url: string; filename: string; size: number; mimetype: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setHeaderImage(response.data.url);
    } catch (error: any) {
      alert(`❌ שגיאה בהעלאת תמונה: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save and generate PDF
  const handleSaveAndGeneratePdf = async () => {
    try {
      await updateSheetMutation.mutateAsync({ 
        title, 
        headerImage,
        layoutConfig: JSON.stringify({ headerImageHeight }),
        issueNumber,
        issueDate
      });
      await generatePdfMutation.mutateAsync();
    } catch (error) {
      // Errors already handled in mutations
    }
  };

  // Handle view PDF
  const handleViewPdf = async () => {
    if (!sheet?.pdfPath) {
      alert('אין PDF זמין. יש ליצור PDF חדש.');
      return;
    }

    try {
      const response = await api.get<Blob>(`/admin/newspaper/${sheetId}/view`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      alert(`שגיאה בטעינת PDF: ${error.response?.data?.error || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 text-lg">טוען...</div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-lg">גיליון לא נמצא</div>
      </div>
    );
  }

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
            <Newspaper className="w-6 h-6 text-[#1F3F3A]" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">עריכת גיליון - {sheet.category.nameHe}</h1>
              <p className="text-sm text-gray-500">{sheet.city.nameHe} • {listings.length} מודעות</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-3 py-2 hover:bg-gray-100 text-gray-900"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 text-sm font-medium border-x border-gray-300 min-w-[60px] text-center text-gray-900">
                {zoom}%
              </div>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="px-3 py-2 hover:bg-gray-100 text-gray-900"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: A4 Preview Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100">
          {/* Zoom wrapper - isolated from DnD */}
          <div 
            className="mx-auto"
            style={{
              width: `${(210 * zoom) / 100}mm`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Newspaper page - NO transform here for accurate DnD */}
            <div 
              className="bg-white shadow-2xl newspaper-page"
              style={{
                width: '210mm',
                minHeight: '297mm',
              }}
            >
            {/* Header - Matching Reference HTML Design */}
            <div className="newspaper-header">
              {/* Title (Right Side) - Editable */}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitle(sheet.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="newspaper-title-input"
                />
              ) : (
                <h1 
                  className="newspaper-title"
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {title}
                </h1>
              )}

              {/* Horizontal Line */}
              <div className="header-line"></div>

              {/* Issue Number & Date (Left Side) */}
              {isEditingIssueNumber ? (
                <input
                  type="text"
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  onBlur={() => setIsEditingIssueNumber(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingIssueNumber(false);
                    if (e.key === 'Escape') {
                      setIssueNumber(`גליון ${sheet.version}`);
                      setIsEditingIssueNumber(false);
                    }
                  }}
                  autoFocus
                  className="issue-number"
                  style={{ background: '#eff6ff', border: '1px dashed #3b82f6', cursor: 'text' }}
                />
              ) : (
                <div 
                  className="issue-number" 
                  onClick={() => setIsEditingIssueNumber(true)}
                  style={{ cursor: 'pointer' }}
                >
                  {issueNumber}
                </div>
              )}
              {isEditingIssueDate ? (
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  onBlur={() => setIsEditingIssueDate(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingIssueDate(false);
                    if (e.key === 'Escape') {
                      setIssueDate(new Date().toLocaleDateString('he-IL', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' }));
                      setIsEditingIssueDate(false);
                    }
                  }}
                  autoFocus
                  className="issue-date"
                  style={{ background: '#eff6ff', border: '1px dashed #3b82f6', cursor: 'text' }}
                />
              ) : (
                <div 
                  className="issue-date" 
                  onClick={() => setIsEditingIssueDate(true)}
                  style={{ cursor: 'pointer' }}
                >
                  {issueDate}
                </div>
              )}
            </div>

            {/* Header Image Section */}
            {headerImage && (
              <div 
                style={{ 
                  position: 'relative',
                  width: '100%',
                  height: `${headerImageHeight}px`,
                  marginTop: '1rem',
                  marginBottom: '1rem',
                }}
              >
                {/* Top Resize Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, 'top')}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: 0,
                    right: 0,
                    height: '8px',
                    cursor: 'ns-resize',
                    zIndex: 10,
                    background: isResizingHeader ? '#3b82f6' : 'transparent',
                  }}
                />
                
                {/* Image */}
                <img
                  src={getImageUrl(headerImage) || ''}
                  alt="Header"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                
                {/* Bottom Resize Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    right: 0,
                    height: '8px',
                    cursor: 'ns-resize',
                    zIndex: 10,
                    background: isResizingHeader ? '#3b82f6' : 'transparent',
                  }}
                />
              </div>
            )}

            {/* Content Area with Ribbon + Grid */}
            <div className="newspaper-content">
              {/* Vertical Ribbon - Category + City */}
              <div className="newspaper-ribbon">
                <span style={{ fontSize: '1.25rem' }}>{sheet.category.nameHe}</span> <span style={{ marginBottom: '0.5rem' }}>{sheet.city.nameHe}</span>
              </div>

              {/* Drag & Drop Grid with Absolute Positioning (3x5) */}
              {listings.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg">אין מודעות בגיליון</p>
                  <p className="text-sm mt-2">מודעות שאושרו יתווספו אוטומטית</p>
                </div>
              ) : useCalculatedLayout && calculatedLayout ? (
                /* Render using calculated layout when there are ads */
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  modifiers={[snapCenterToCursor]}
                >
                  <SortableContext items={listings.map(l => l.id)} strategy={rectSortingStrategy}>
                    <div className="newspaper-grid">
                      {calculatedLayout.pages.flatMap((page: any, pageIdx: number) =>
                        page.rows.flatMap((row: any[], rowIdx: number) =>
                          row.map((item: any, colIdx: number) => {
                            // Skip occupied cells
                            if (item.type === 'empty' || item.data?.isOccupied) {
                              return null;
                            }

                            if (item.type === 'listing') {
                              const listing = listings.find(l => l.listingId === item.id);
                              if (!listing) return null;
                              return (
                                <div key={`${pageIdx}-${rowIdx}-${colIdx}-${item.id}`}>
                                  <SortablePropertyCard
                                    listing={listing}
                                    onRemove={handleRemoveListing}
                                  />
                                </div>
                              );
                            } else if (item.type === 'ad') {
                              const ad = sheet.ads?.find(a => a.id === item.id);
                              if (!ad) return null;
                              return (
                                <div 
                                  key={`${pageIdx}-${rowIdx}-${colIdx}-${item.id}`} 
                                  style={{ 
                                    gridColumn: `span ${item.colspan || 1}`, 
                                    gridRow: `span ${item.rowspan || 1}` 
                                  }}
                                >
                                  <AdSlotCard
                                    ad={ad}
                                    onRemove={async () => {
                                        try {
                                          await api.delete(`/admin/newspaper-sheets/${sheetId}/ads/${ad.id}`);
                                          queryClient.invalidateQueries({ queryKey: ['newspaper-sheet', sheetId] });
                                          queryClient.invalidateQueries({ queryKey: ['newspaper-layout', sheetId] });
                                        } catch (error: any) {
                                          alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
                                        }
                                    }}
                                  />
                                </div>
                              );
                            }
                            return null;
                          })
                        )
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                /* Render normally without ads */
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  modifiers={[snapCenterToCursor]}
                >
                  <SortableContext items={listings.map(l => l.id)} strategy={rectSortingStrategy}>
                    <div className="newspaper-grid">
                      {listings.map((listing) => (
                        <SortablePropertyCard
                          key={listing.id}
                          listing={listing}
                          onRemove={handleRemoveListing}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div> {/* End newspaper-content */}

          </div> {/* End newspaper-page */}
          </div> {/* End zoom wrapper */}
        </div>

        {/* RIGHT: Action Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-6">פעולות</h2>

          <div className="space-y-4">
            {/* Upload/Replace Header Image */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                תמונת כותרת
              </h3>
              <label className="block">
                <div className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-center transition-colors">
                  {isUploading ? 'מעלה...' : 'העלה / החלף תמונה'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              {headerImage && (
                <button
                  onClick={() => {
                    setHeaderImage(null);
                    updateSheetMutation.mutate({ headerImage: null });
                  }}
                  className="w-full mt-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  הסר תמונה
                </button>
              )}
            </div>

            {/* Save (JSON only) */}
            <button
              onClick={() => updateSheetMutation.mutate({ 
                title, 
                headerImage,
                layoutConfig: JSON.stringify({ headerImageHeight }),
                issueNumber,
                issueDate
              })}
              disabled={updateSheetMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-5 h-5" />
              {updateSheetMutation.isPending ? 'שומר...' : 'שמירה'}
            </button>

            {/* Save & Generate PDF */}
            <button
              onClick={handleSaveAndGeneratePdf}
              disabled={updateSheetMutation.isPending || generatePdfMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${generatePdfMutation.isPending ? 'animate-spin' : ''}`} />
              {generatePdfMutation.isPending ? 'יוצר PDF...' : 'שמור + יצר PDF'}
            </button>

            {/* View PDF */}
            <button
              onClick={handleViewPdf}
              disabled={!sheet.pdfPath}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
            >
              <Eye className="w-5 h-5" />
              צפה ב-PDF
            </button>

            {/* Reset to Default */}
            <button
              onClick={() => {
                if (confirm('האם לאפס את הכותרת, התמונה וגובה התמונה לברירת מחדל?')) {
                  // Reset to defaults
                  const defaultTitle = 'לוח מודעות';
                  setTitle(defaultTitle);
                  setHeaderImage(null);
                  setHeaderImageHeight(120);
                  setIssueNumber(`גליון ${sheet.version}`);
                  setIssueDate(new Date().toLocaleDateString('he-IL', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric' 
                  }));
                  
                  // Save to server
                  updateSheetMutation.mutate({
                    title: defaultTitle,
                    headerImage: null,
                    layoutConfig: JSON.stringify({ headerImageHeight: 120 })
                  });
                }
              }}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              איפוס לברירת מחדל
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">גרסה:</span>
                <span className="font-semibold text-gray-900">{sheet.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סטטוס:</span>
                <span className="font-semibold text-green-600">{sheet.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">מודעות:</span>
                <span className="font-semibold text-gray-900">{listings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advertisement Manager */}
      <AdvertisementManager
        sheetId={sheetId!}
        advertisements={sheet.ads || []}
        listings={listings}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['newspaper-sheet', sheetId] });
          queryClient.invalidateQueries({ queryKey: ['newspaper-layout', sheetId] });
        }}
      />

      {/* DragOverlay Portal - rendered at document.body for accurate positioning */}
      {createPortal(
        <DragOverlay dropAnimation={null} adjustScale={false}>
          {activeId ? (
            <PropertyCardOverlay 
              listing={listings.find(l => l.id === activeId)!} 
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </div>
  );
}
