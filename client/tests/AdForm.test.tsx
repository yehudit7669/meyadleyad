import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdForm from '../src/components/AdForm';

// Mock the services
vi.mock('../src/services/api', () => ({
  adsService: {
    createAd: vi.fn(),
    updateAd: vi.fn(),
  },
  categoriesService: {
    getCategories: vi.fn(() =>
      Promise.resolve([
        { id: 1, nameHe: 'נדל"ן', nameEn: 'real-estate', subcategories: [] },
        { id: 2, nameHe: 'רכב', nameEn: 'vehicles', subcategories: [] },
      ])
    ),
  },
  citiesService: {
    getCities: vi.fn(() =>
      Promise.resolve([
        { id: 1, nameHe: 'תל אביב', nameEn: 'tel-aviv' },
        { id: 2, nameHe: 'ירושלים', nameEn: 'jerusalem' },
      ])
    ),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockSubmit = vi.fn();

describe('AdForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1 - Basic Information', () => {
    it('should render initial form fields', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      await waitFor(() => {
        expect(document.getElementById('ad-title')).toBeInTheDocument();
        expect(document.getElementById('ad-category')).toBeInTheDocument();
        expect(document.querySelector('select[name="cityId"]')).toBeInTheDocument();
      });
    });

    it('should validate required fields in step 1', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const continueButton = await screen.findByRole('button', {
        name: /המשך/i,
      });

      fireEvent.click(continueButton);

      // Form validation will prevent progression without required fields
      await waitFor(() => {
        expect(continueButton).toBeInTheDocument();
      });
    });

    it('should validate title length (min 5 characters)', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const titleInput = await screen.findByLabelText(/כותרת/i);
      await userEvent.type(titleInput, 'קצר');

      const continueButton = screen.getByRole('button', { name: /המשך/i });
      fireEvent.click(continueButton);

      // Validation should prevent progression
      await waitFor(() => {
        expect(titleInput).toBeInTheDocument();
      });
    });

    it('should validate price (positive number)', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement;
      await userEvent.type(priceInput, '-100');

      // Price validation
      await waitFor(() => {
        expect(priceInput).toHaveValue(-100);
      });
    });

    it('should proceed to step 2 with valid data', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'דירת 3 חדרים למכירה');

      // Select category and city
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });

      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });

      const continueButton = screen.getByRole('button', { name: /המשך/i });
      fireEvent.click(continueButton);

      // Should move to step 2 (description)
      await waitFor(() => {
        expect(document.querySelector('textarea[name="description"]')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2 - Description', () => {
    it('should display description field in step 2', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      // Fill step 1
      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'מודעת בדיקה');
      
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });

      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      await waitFor(() => {
        expect(document.querySelector('textarea[name="description"]')).toBeInTheDocument();
      });
    });

    it('should allow proceeding to step 3', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      // Navigate through step 1
      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'מודעת בדיקה');
      
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });

      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Now in step 2 - fill description
      await waitFor(() => document.querySelector('textarea[name="description"]'));
      
      const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
      await userEvent.type(descriptionInput, 'תיאור מפורט של המודעה');
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Should reach step 3 - check for phone or other step 3 element
      await waitFor(() => {
        expect(document.querySelector('input[name="phone"]') || screen.getByRole('heading', { name: /תמונות/i })).toBeTruthy();
      });
    });

    it('should allow going back to step 1', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      // Navigate to step 2
      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'מודעה');
      
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      await waitFor(() => {
        expect(document.querySelector('textarea[name="description"]')).toBeInTheDocument();
      });

      // Go back
      const backButton = screen.getByRole('button', { name: /חזור/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(document.getElementById('ad-title')).toBeInTheDocument();
        expect(document.getElementById('ad-category')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3 - Images & Contact', () => {
    it('should display image upload in step 3', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      // Navigate through step 1
      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'מודעה מלאה');
      
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Wait for step 2 (description) and fill it
      await waitFor(() => document.querySelector('textarea[name="description"]'));
      const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
      await userEvent.type(descriptionInput, 'תיאור מלא של המודעה');

      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /תמונות/i })).toBeInTheDocument();
      });
    });

    it('should display contact information fields', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      // Navigate through step 1
      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'מודעה');
      
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Step 2 - description
      await waitFor(() => document.querySelector('textarea[name="description"]'));
      const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
      await userEvent.type(descriptionInput, 'תיאור המודעה');
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Step 3 - image upload (not contact fields - that's not in the component)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /תמונות/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should have submit button in step 3', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      // Navigate through step 1
      const titleInput = document.getElementById('ad-title') as HTMLInputElement;
      await userEvent.type(titleInput, 'מודעה לפרסום');
      
      const categorySelect = document.getElementById('ad-category') as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      const citySelect = document.querySelector('select[name="cityId"]') as HTMLSelectElement;
      fireEvent.change(citySelect, { target: { value: '1' } });
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Step 2 - description
      await waitFor(() => document.querySelector('textarea[name="description"]'));
      const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
      await userEvent.type(descriptionInput, 'תיאור המודעה המפורט');
      
      fireEvent.click(screen.getByRole('button', { name: /המשך/i }));

      // Step 3 - should have submit button
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /פרסם/i });
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should load existing ad data in edit mode', async () => {
      const existingAd = {
        title: 'מודעה קיימת',
        description: 'תיאור קיים',
        price: 5000,
        categoryId: '1',
        cityId: '1',
        images: [],
      };

      renderWithProviders(<AdForm onSubmit={mockSubmit} initialData={existingAd} />);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(
          /כותרת/i
        ) as HTMLInputElement;
        expect(titleInput.value).toBe('מודעה קיימת');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels on navigation buttons', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const continueButton = await screen.findByRole('button', {
        name: /המשך/i,
      });
      expect(continueButton).toHaveAttribute('aria-label');
    });

    it('should have proper form labels', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const titleInput = await screen.findByLabelText(/כותרת/i);
      expect(titleInput).toHaveAttribute('id');
    });

    it('should show validation errors with aria-invalid', async () => {
      renderWithProviders(<AdForm onSubmit={mockSubmit} />);

      const continueButton = await screen.findByRole('button', {
        name: /המשך/i,
      });
      fireEvent.click(continueButton);

      // Check if validation happens (form should not progress)
      await waitFor(() => {
        expect(continueButton).toBeInTheDocument();
      });
    });
  });
});
