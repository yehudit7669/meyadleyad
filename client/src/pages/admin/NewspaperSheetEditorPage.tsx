import { useState, useEffect, useRef, useCallback } from 'react';
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
  ZoomOut
} from 'lucide-react';
import { api } from '../../services/api';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, type Modifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './NewspaperSheetEditor.css';

interface Listing {
  id: string;
  listingId: string;
  positionIndex: number;
  listing: {
    id: string;
    title: string;
    address: string;
    price: number;
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
  _count: {
    listings: number;
  };
}

// Sortable Property Card in Grid (with newspaper styling)
function SortablePropertyCard({ listing }: { listing: Listing }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-id={listing.id}
      className={`newspaper-property-card cursor-move ${isDragging ? 'dragging' : ''}`}
    >
      <h4 className="property-title">{listing.listing.title}</h4>
      <p className="property-address">{listing.listing.address}</p>
      <p className="property-price">₪{listing.listing.price.toLocaleString()}</p>
    </div>
  );
}

export default function NewspaperSheetEditorPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerImageHeight, setHeaderImageHeight] = useState(120); // Height in pixels
  const [isResizingHeader, setIsResizingHeader] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag only starts after moving 8px
      },
    })
  );

  // Mouse move handler with useCallback
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPosition({ x: e.clientX, y: e.clientY });
  }, []);

  // Effect to manage mousemove listener
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Modifier to snap cursor to dragged item
  // @ts-expect-error - Modifier for future use
  const _snapCursorToDraggedItem: Modifier = ({ transform }) => {
    const offset = dragOffsetRef.current;
    if (!offset) {
      console.log('⚠️ Modifier: no offset in ref');
      return transform;
    }
    
    const adjusted = {
      ...transform,
      x: transform.x - offset.x,
      y: transform.y - offset.y,
      scaleX: 1,
      scaleY: 1,
    };
    
    console.log(`🔧 Modifier: offset(${offset.x.toFixed(1)}, ${offset.y.toFixed(1)}) | orig(${transform.x.toFixed(1)}, ${transform.y.toFixed(1)}) -> adj(${adjusted.x.toFixed(1)}, ${adjusted.y.toFixed(1)})`);
    
    return adjusted;
  };

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
      setTitle(sheet.title);
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
    }
  }, [sheet]);

  // Update sheet mutation
  const updateSheetMutation = useMutation({
    mutationFn: async (data: { title?: string; headerImage?: string | null; layoutConfig?: string }) => {
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
      // Save the new height to backend
      const layoutConfig = { headerImageHeight };
      updateSheetMutation.mutate({ 
        layoutConfig: JSON.stringify(layoutConfig) 
      } as any);
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

  // Handle drag start
  const handleDragStart = (event: any) => {
    console.log('🚀 Drag started:', event.active.id);
    setActiveId(event.active.id);
    
    // Calculate offset using the actual dragged element
    const draggedElement = document.querySelector(`[data-id="${event.active.id}"]`);
    if (draggedElement && event.activatorEvent) {
      const rect = draggedElement.getBoundingClientRect();
      const offsetX = event.activatorEvent.clientX - rect.left;
      const offsetY = event.activatorEvent.clientY - rect.top;
      dragOffsetRef.current = { x: offsetX, y: offsetY };
      // Store initial cursor position
      setCursorPosition({
        x: event.activatorEvent.clientX,
        y: event.activatorEvent.clientY
      });
      setIsDragging(true);
      console.log('🎯 Offset:', { x: offsetX, y: offsetY });
    } else {
      dragOffsetRef.current = null;
      setCursorPosition(null);
    }
  };

  // Handle drag move - no longer needed, using mousemove instead
  const handleDragMove = (_event: any) => {
    // Using document mousemove listener instead
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    dragOffsetRef.current = null;
    setCursorPosition(null);
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    const oldIndex = listings.findIndex((item) => item.id === active.id);
    const newIndex = listings.findIndex((item) => item.id === over.id);

    const newListings = arrayMove(listings, oldIndex, newIndex);
    
    // Update local state immediately
    setListings(newListings);

    // Update position in backend
    const movedListing = newListings[newIndex];
    updatePositionMutation.mutate({
      listingId: movedListing.id,
      newPosition: newIndex,
    });
  };

  // Handle save title (inline edit)
  const handleSaveTitle = () => {
    if (!title.trim()) {
      alert('❌ כותרת לא יכולה להיות ריקה');
      setTitle(sheet?.title || '');
      setIsEditingTitle(false);
      return;
    }
    updateSheetMutation.mutate({ title });
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
      updateSheetMutation.mutate({ headerImage: response.data.url });
    } catch (error: any) {
      alert(`❌ שגיאה בהעלאת תמונה: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save and generate PDF
  const handleSaveAndGeneratePdf = async () => {
    try {
      await updateSheetMutation.mutateAsync({ title, headerImage });
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

  const activeListing = activeId ? listings.find(l => l.id === activeId) : null;

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
                className="px-3 py-2 hover:bg-gray-100"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 text-sm font-medium border-x border-gray-300 min-w-[60px] text-center">
                {zoom}%
              </div>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="px-3 py-2 hover:bg-gray-100"
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
          <div 
            className="mx-auto bg-white shadow-2xl newspaper-page"
            style={{
              width: `${(210 * zoom) / 100}mm`,
              minHeight: `${(297 * zoom) / 100}mm`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Inline Editable Title */}
            <div className="newspaper-header">
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
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    border: '2px dashed #3b82f6',
                    background: '#eff6ff',
                    padding: '8px',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}
                />
              ) : (
                <h1 
                  className="newspaper-title"
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {title}
                </h1>
              )}
            </div>

            {/* Click-to-Upload Header Image with Resize Handles */}
            <div className="newspaper-banner relative">
              {headerImage ? (
                <div 
                  className="relative group"
                  style={{ height: `${headerImageHeight}px` }}
                >
                  {/* Top Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'top')}
                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10 hover:bg-blue-400 transition-colors"
                    style={{ 
                      background: isResizingHeader ? '#3b82f6' : 'transparent',
                      marginTop: '-4px'
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-blue-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  
                  {/* Image Container */}
                  <div 
                    className="relative cursor-pointer overflow-hidden h-full"
                    onClick={() => document.getElementById('header-image-upload')?.click()}
                  >
                    <img 
                      src={headerImage.startsWith('http') ? headerImage : `http://localhost:5000${headerImage}`} 
                      alt="Header" 
                      onError={(e) => {
                        console.error('Image failed to load:', headerImage);
                        console.log('Full URL:', headerImage.startsWith('http') ? headerImage : `http://localhost:5000${headerImage}`);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => console.log('Image loaded successfully')}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all rounded-md">
                      <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>

                  {/* Bottom Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10 hover:bg-blue-400 transition-colors"
                    style={{ 
                      background: isResizingHeader ? '#3b82f6' : 'transparent',
                      marginBottom: '-4px'
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-blue-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('header-image-upload')?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  style={{ height: '120px' }}
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">לחץ להעלאת תמונת כותרת</span>
                </div>
              )}
              <input
                id="header-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            {/* Drag & Drop Grid */}
            <div className="newspaper-content">
              {listings.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg">אין מודעות בגיליון</p>
                  <p className="text-sm mt-2">מודעות שאושרו יתווספו אוטומטית</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={listings.map((l) => l.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="newspaper-grid">
                      {listings.map((listing) => (
                        <SortablePropertyCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {(() => {
                      console.log('📦 DragOverlay render:', { 
                        hasActiveListing: !!activeListing, 
                        cursorPosition, 
                        hasOffset: !!dragOffsetRef.current 
                      });
                      
                      if (!activeListing) return null;
                      
                      if (!cursorPosition || !dragOffsetRef.current) {
                        return <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', padding: '10px', color: 'white' }}>❌ No cursor or offset</div>;
                      }
                      
                      const left = cursorPosition.x - dragOffsetRef.current.x;
                      const top = cursorPosition.y - dragOffsetRef.current.y;
                      
                      console.log(`📍 Positioning card at: left=${left}, top=${top}`);
                      
                      return (
                        <div 
                          className="newspaper-property-card dragging-overlay"
                          style={{ 
                            cursor: 'grabbing',
                            position: 'fixed',
                            left: `${left}px`,
                            top: `${top}px`,
                            pointerEvents: 'none',
                            zIndex: 9999,
                          }}
                        >
                          <h4 className="property-title">{activeListing.listing.title}</h4>
                          <p className="property-address">{activeListing.listing.address}</p>
                          <p className="property-price">₪{activeListing.listing.price.toLocaleString()}</p>
                        </div>
                      );
                    })()}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            {/* Footer / Logo */}
            <div className="newspaper-footer">
              <p>מעודכן ל-{new Date().toLocaleDateString('he-IL')}</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Action Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">

        {/* Dragging card portal - outside of everything */}
        {activeListing && cursorPosition && dragOffsetRef.current && (
          <div 
            className="newspaper-property-card dragging-overlay"
            style={{ 
              cursor: 'grabbing',
              position: 'fixed',
              left: `${cursorPosition.x - dragOffsetRef.current.x}px`,
              top: `${cursorPosition.y - dragOffsetRef.current.y}px`,
              pointerEvents: 'none',
              zIndex: 99999,
              width: '312px',
            }}
          >
            <h4 className="property-title">{activeListing.listing.title}</h4>
            <p className="property-address">{activeListing.listing.address}</p>
            <p className="property-price">\u20aa{activeListing.listing.price.toLocaleString()}</p>
          </div>
        )}
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
              onClick={() => updateSheetMutation.mutate({ title, headerImage })}
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

            {/* Reset to Default (conceptual) */}
            <button
              onClick={() => {
                if (confirm('האם לאפס את הכותרת והתמונה?')) {
                  setTitle(sheet.title);
                  setHeaderImage(sheet.headerImage);
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
                <span className="font-semibold">{sheet.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סטטוס:</span>
                <span className="font-semibold text-green-600">{sheet.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">מודעות:</span>
                <span className="font-semibold">{listings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
