import { useEffect, useRef, useCallback, useState } from 'react';

interface UseDropdownA11yOptions {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onSelect?: (index: number) => void;
  itemCount: number;
  closeOnSelect?: boolean;
}

/**
 * Hook for managing dropdown/menu accessibility
 * - Keyboard navigation (Enter/Space to toggle, Arrow keys to navigate, Escape to close)
 * - Click outside to close
 * - Proper ARIA attributes support
 */
export function useDropdownA11y({
  isOpen,
  onToggle,
  onSelect,
  itemCount,
  closeOnSelect = true,
}: UseDropdownA11yOptions) {
  const triggerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Handle keyboard navigation on trigger
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onToggle(!isOpen);
        if (!isOpen) {
          setActiveIndex(0);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          onToggle(false);
          setActiveIndex(-1);
          triggerRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        if (!isOpen) {
          e.preventDefault();
          onToggle(true);
          setActiveIndex(0);
        }
        break;
    }
  }, [isOpen, onToggle]);

  // Handle keyboard navigation within menu
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && onSelect) {
          onSelect(activeIndex);
          if (closeOnSelect) {
            onToggle(false);
            setActiveIndex(-1);
            triggerRef.current?.focus();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onToggle(false);
        setActiveIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        // Allow Tab to close dropdown and continue normal tab flow
        onToggle(false);
        setActiveIndex(-1);
        break;
    }
  }, [activeIndex, itemCount, onSelect, onToggle, closeOnSelect]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        menuRef.current &&
        !triggerRef.current.contains(target) &&
        !menuRef.current.contains(target)
      ) {
        onToggle(false);
        setActiveIndex(-1);
      }
    };

    // Small delay to avoid immediate closing on open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Reset active index when menu closes
  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  return {
    triggerRef,
    menuRef,
    activeIndex,
    handleTriggerKeyDown,
    handleMenuKeyDown,
  };
}
