/**
 * Newspaper Layout Calculator Service
 * אלגוריתם חישוב פריסה של לוח מודעות עם פרסומות
 * 
 * כללים:
 * - גריד קבוע: 3 קוביות לרוחב
 * - פרסומת לא יכולה לחצות עמוד
 * - פרסומות ממוקמות לפי עוגן (beforeIndex או pagePosition)
 * - נכסים ממלאים את התאים הפנויים לפי הסדר
 */

interface AdSlot {
  id: string;
  imageUrl: string;
  size: '1x1' | '2x1' | '3x1' | '2x2';
  anchorType: 'beforeIndex' | 'pagePosition';
  beforeListingId?: string;
  page?: number;
  row?: number;
  col?: number;
}

interface Listing {
  id: string;
  [key: string]: any;
}

export interface GridItem {
  type: 'listing' | 'ad' | 'empty';
  id: string;
  data?: any;
  colspan?: number; // How many columns this item spans
  rowspan?: number; // How many rows this item spans
}

export interface PageLayout {
  pageNumber: number;
  rows: GridItem[][]; // Each row has 3 columns
}

export interface LayoutResult {
  pages: PageLayout[];
  errors: string[];
}

const GRID_COLUMNS = 3;
const ITEMS_PER_PAGE = 21; // 7 rows × 3 columns

/**
 * Parse ad size to get dimensions
 */
function parseAdSize(size: string): { cols: number; rows: number } {
  const [cols, rows] = size.split('x').map(Number);
  return { cols, rows };
}

/**
 * Check if ad fits at a specific position in the grid
 */
function canFitAd(
  grid: GridItem[][],
  row: number,
  col: number,
  adSize: { cols: number; rows: number }
): boolean {
  // Check bounds
  if (col + adSize.cols > GRID_COLUMNS) return false;
  if (row + adSize.rows > grid.length) return false;

  // Check if all cells are empty
  for (let r = row; r < row + adSize.rows; r++) {
    for (let c = col; c < col + adSize.cols; c++) {
      if (grid[r][c].type !== 'empty') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Place ad in grid and mark occupied cells
 */
function placeAd(
  grid: GridItem[][],
  row: number,
  col: number,
  ad: AdSlot
): void {
  const { cols, rows } = parseAdSize(ad.size);
  
  // Place the main ad item
  grid[row][col] = {
    type: 'ad',
    id: ad.id,
    data: ad,
    colspan: cols,
    rowspan: rows
  };

  // Mark other cells as occupied (reference to main ad)
  for (let r = row; r < row + rows; r++) {
    for (let c = col; c < col + cols; c++) {
      if (r === row && c === col) continue; // Skip main cell
      grid[r][c] = {
        type: 'ad',
        id: `${ad.id}-occupied-${r}-${c}`,
        data: { isOccupied: true, mainAdId: ad.id }
      };
    }
  }
}

/**
 * Find next empty cell in grid
 */
function findNextEmptyCell(grid: GridItem[][], startRow: number = 0, startCol: number = 0): { row: number; col: number } | null {
  for (let r = startRow; r < grid.length; r++) {
    const colStart = r === startRow ? startCol : 0;
    for (let c = colStart; c < GRID_COLUMNS; c++) {
      if (grid[r][c].type === 'empty') {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

/**
 * Calculate newspaper layout with ads
 * מחשב פריסה מלאה של לוח מודעות עם פרסומות
 */
export function calculateNewspaperLayout(
  listings: Listing[],
  ads: AdSlot[]
): LayoutResult {
  const errors: string[] = [];
  const pages: PageLayout[] = [];
  
  // Sort ads by anchor type
  const beforeIndexAds = ads.filter(ad => ad.anchorType === 'beforeIndex');
  const pagePositionAds = ads.filter(ad => ad.anchorType === 'pagePosition');

  // Create a mapping of listing IDs to their index
  const listingIndexMap = new Map<string, number>();
  listings.forEach((listing, index) => {
    listingIndexMap.set(listing.id, index);
  });

  // Track which listings have been placed
  let currentListingIndex = 0;
  let currentPage = 1;
  
  // Initialize first page (7 rows × 3 cols)
  let currentGrid: GridItem[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: GRID_COLUMNS }, () => ({ type: 'empty', id: `empty-${Math.random()}` }))
  );

  /**
   * Try to place a pagePosition ad
   */
  function tryPlacePagePositionAd(ad: AdSlot): boolean {
    if (!ad.page || !ad.row || !ad.col) {
      errors.push(`פרסומת ${ad.id}: חסרים פרטי מיקום (עמוד/שורה/עמודה)`);
      return false;
    }

    // Convert to 0-indexed
    const targetPage = ad.page;
    const targetRow = ad.row - 1;
    const targetCol = ad.col - 1;

    // Make sure we're on the right page
    while (currentPage < targetPage) {
      // Save current page and start new one
      pages.push({
        pageNumber: currentPage,
        rows: currentGrid
      });
      currentPage++;
      currentGrid = Array.from({ length: 7 }, () =>
        Array.from({ length: GRID_COLUMNS }, () => ({ type: 'empty', id: `empty-${Math.random()}` }))
      );
    }

    if (currentPage !== targetPage) {
      errors.push(`פרסומת ${ad.id}: לא ניתן למקם בעמוד ${targetPage} - כבר עברנו אותו`);
      return false;
    }

    const adSize = parseAdSize(ad.size);
    
    if (!canFitAd(currentGrid, targetRow, targetCol, adSize)) {
      errors.push(`פרסומת ${ad.id}: אין מקום בעמוד ${targetPage}, שורה ${ad.row}, עמודה ${ad.col} (גודל ${ad.size})`);
      return false;
    }

    placeAd(currentGrid, targetRow, targetCol, ad);
    return true;
  }

  /**
   * Fill grid with listings until we need to place an ad or page is full
   */
  function fillListingsUntil(stopBeforeListingIndex?: number): void {
    while (currentListingIndex < listings.length) {
      // Check if we need to stop for a beforeIndex ad
      if (stopBeforeListingIndex !== undefined && currentListingIndex >= stopBeforeListingIndex) {
        break;
      }

      const listing = listings[currentListingIndex];
      const nextEmpty = findNextEmptyCell(currentGrid);

      if (!nextEmpty) {
        // Page is full, start new page
        pages.push({
          pageNumber: currentPage,
          rows: currentGrid
        });
        currentPage++;
        currentGrid = Array.from({ length: 7 }, () =>
          Array.from({ length: GRID_COLUMNS }, () => ({ type: 'empty', id: `empty-${Math.random()}` }))
        );
        continue;
      }

      // Place listing
      currentGrid[nextEmpty.row][nextEmpty.col] = {
        type: 'listing',
        id: listing.id,
        data: listing
      };
      currentListingIndex++;
    }
  }

  /**
   * Try to place a beforeIndex ad
   */
  function tryPlaceBeforeIndexAd(ad: AdSlot): boolean {
    if (!ad.beforeListingId) {
      errors.push(`פרסומת ${ad.id}: חסר מזהה נכס לעוגן`);
      return false;
    }

    const targetListingIndex = listingIndexMap.get(ad.beforeListingId);
    if (targetListingIndex === undefined) {
      errors.push(`פרסומת ${ad.id}: נכס ${ad.beforeListingId} לא נמצא`);
      return false;
    }

    // Fill listings until we reach the anchor
    fillListingsUntil(targetListingIndex);

    // Now try to place the ad
    const adSize = parseAdSize(ad.size);
    let adPlaced = false;

    // Try to find space in current grid
    for (let r = 0; r < currentGrid.length && !adPlaced; r++) {
      for (let c = 0; c < GRID_COLUMNS && !adPlaced; c++) {
        if (canFitAd(currentGrid, r, c, adSize)) {
          placeAd(currentGrid, r, c, ad);
          adPlaced = true;
        }
      }
    }

    // If no space, start new page and place there
    if (!adPlaced) {
      pages.push({
        pageNumber: currentPage,
        rows: currentGrid
      });
      currentPage++;
      currentGrid = Array.from({ length: 7 }, () =>
        Array.from({ length: GRID_COLUMNS }, () => ({ type: 'empty', id: `empty-${Math.random()}` }))
      );

      // Try to place at top of new page
      if (canFitAd(currentGrid, 0, 0, adSize)) {
        placeAd(currentGrid, 0, 0, ad);
        adPlaced = true;
      } else {
        errors.push(`פרסומת ${ad.id}: גדולה מדי גם לעמוד חדש (גודל ${ad.size})`);
      }
    }

    return adPlaced;
  }

  // Place pagePosition ads first (they have fixed positions)
  for (const ad of pagePositionAds) {
    tryPlacePagePositionAd(ad);
  }

  // Process beforeIndex ads and listings together
  // Sort beforeIndex ads by their anchor listing position
  const sortedBeforeIndexAds = beforeIndexAds
    .map(ad => ({
      ad,
      anchorIndex: ad.beforeListingId ? (listingIndexMap.get(ad.beforeListingId) ?? Infinity) : Infinity
    }))
    .sort((a, b) => a.anchorIndex - b.anchorIndex);

  for (const { ad } of sortedBeforeIndexAds) {
    tryPlaceBeforeIndexAd(ad);
  }

  // Fill remaining listings
  fillListingsUntil();

  // Save last page if it has content
  const hasContent = currentGrid.some(row => row.some(cell => cell.type !== 'empty'));
  if (hasContent) {
    pages.push({
      pageNumber: currentPage,
      rows: currentGrid
    });
  }

  return { pages, errors };
}
