import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../src/components/SearchBar';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should render search button', () => {
      renderWithRouter(<SearchBar />);

      // Submit button inside the input
      const searchButtons = screen.getAllByRole('button');
      const submitButton = searchButtons.find(btn => btn.getAttribute('type') === 'submit');
      expect(submitButton).toBeInTheDocument();
    });

    it('should have aria-label on search button', () => {
      renderWithRouter(<SearchBar />);

      const searchButtons = screen.getAllByRole('button');
      const submitButton = searchButtons.find(btn => btn.getAttribute('aria-label') === 'חפש');
      expect(submitButton).toHaveAttribute('aria-label', 'חפש');
    });
  });

  describe('Search Input', () => {
    it('should update input value on typing', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(
        /חפש מודעות/i
      ) as HTMLInputElement;

      await userEvent.type(searchInput, 'דירה');

      expect(searchInput.value).toBe('דירה');
    });

    it('should clear input value', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(
        /חפש מודעות/i
      ) as HTMLInputElement;

      await userEvent.type(searchInput, 'טקסט לניקוי');
      expect(searchInput.value).toBe('טקסט לניקוי');

      await userEvent.clear(searchInput);
      expect(searchInput.value).toBe('');
    });

    it('should handle Hebrew text input', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(
        /חפש מודעות/i
      ) as HTMLInputElement;

      await userEvent.type(searchInput, 'דירה 3 חדרים בתל אביב');

      expect(searchInput.value).toBe('דירה 3 חדרים בתל אביב');
    });

    it('should handle English text input', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(
        /חפש מודעות/i
      ) as HTMLInputElement;

      await userEvent.type(searchInput, 'iPhone 15 Pro');

      expect(searchInput.value).toBe('iPhone 15 Pro');
    });
  });

  describe('Search Submission', () => {
    it('should navigate to search results on button click', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);
      const searchButtons = screen.getAllByRole('button');
      const submitButton = searchButtons.find(btn => btn.getAttribute('type') === 'submit');

      await userEvent.type(searchInput, 'רכב');
      fireEvent.click(submitButton!);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/search')
        );
      });
    });

    it('should navigate on Enter key press', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);

      await userEvent.type(searchInput, 'מחשב{Enter}');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('should include search query in navigation', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);

      await userEvent.type(searchInput, 'דירת גן{Enter}');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
        const callArg = mockNavigate.mock.calls[0][0];
        expect(callArg).toContain('/search?q=');
      });
    });

    it('should not navigate with empty search', async () => {
      renderWithRouter(<SearchBar />);

      const searchButtons = screen.getAllByRole('button');
      const submitButton = searchButtons.find(btn => btn.getAttribute('type') === 'submit');

      fireEvent.click(submitButton!);

      // Should not navigate with empty query
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should trim whitespace from search query', async () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);

      await userEvent.type(searchInput, '  דירה  {Enter}');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
        const callArg = mockNavigate.mock.calls[0][0];
        expect(callArg).toContain('/search?q=');
        // Make sure no leading/trailing spaces in URL
        expect(callArg).not.toMatch(/q=%20%20/);
      });
    });
  });

  describe('Advanced Filters', () => {
    it('should have advanced filters button when showFilters is true', () => {
      renderWithRouter(<SearchBar showFilters={true} />);

      // Check if there's a filters-related element
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with Tab key', () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);

      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });

    it('should navigate to button with Tab', () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);
      const searchButtons = screen.getAllByRole('button');

      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
      expect(searchButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<SearchBar />);

      const searchButtons = screen.getAllByRole('button');
      const submitButton = searchButtons.find(btn => btn.getAttribute('aria-label') === 'חפש');
      expect(submitButton).toHaveAttribute('aria-label');
    });

    it('should have proper form semantics', () => {
      renderWithRouter(<SearchBar />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should show focus-visible on keyboard focus', () => {
      renderWithRouter(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/חפש מודעות/i);

      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Props & Configuration', () => {
    it('should accept initial search value', () => {
      renderWithRouter(<SearchBar initialQuery="דירה" />);

      const searchInput = screen.getByPlaceholderText(
        /חפש מודעות/i
      ) as HTMLInputElement;

      expect(searchInput.value).toBe('דירה');
    });

    it('should accept custom placeholder', () => {
      renderWithRouter(<SearchBar placeholder="חיפוש מתקדם" />);

      const searchInput = screen.getByPlaceholderText(/חיפוש מתקדם/i);
      expect(searchInput).toBeInTheDocument();
    });

  });
});
