import { useEffect, useRef, useCallback } from 'react';

interface UseDialogA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook for managing dialog/modal accessibility
 * - Traps focus within the dialog
 * - Handles Escape key to close
 * - Restores focus when closed
 */
export function useDialogA11y({ isOpen, onClose, initialFocusRef }: UseDialogA11yOptions) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the dialog
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!dialogRef.current) return [];
    
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
    ).filter(el => {
      // Filter out hidden elements
      return el.offsetParent !== null;
    });
  }, []);

  // Focus trap handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || !dialogRef.current) return;

    // Handle Escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    // Handle Tab key for focus trap
    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose, getFocusableElements]);

  // Setup focus trap and restore focus on close
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Focus initial element or first focusable element
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 0);

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus when dialog closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [isOpen, handleKeyDown, getFocusableElements, initialFocusRef]);

  return { dialogRef };
}
