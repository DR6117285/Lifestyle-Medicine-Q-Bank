import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  focusVisible: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  focusVisible: true,
  screenReaderOptimized: false,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    
    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    return {
      ...defaultSettings,
      reduceMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    };
  });

  const [liveRegion, setLiveRegion] = useState<HTMLDivElement | null>(null);

  // Create live region for screen reader announcements
  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
    setLiveRegion(region);

    return () => {
      if (document.body.contains(region)) {
        document.body.removeChild(region);
      }
    };
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduce motion
    if (settings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
      root.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

    // Screen reader optimized
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegion) return;
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [liveRegion]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  }, []);

  return (
    <AccessibilityContext.Provider 
      value={{
        settings,
        updateSetting,
        announceToScreenReader,
        resetSettings
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  const updateFocusableElements = useCallback((container?: HTMLElement) => {
    const focusableSelectors = [
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = Array.from(
      (container || document).querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];

    const visibleElements = elements.filter(element => {
      const style = window.getComputedStyle(element);
      const isButton = element.tagName === 'BUTTON';
      const isInput = element.tagName === 'INPUT';
      const disabled = isButton || isInput ? (element as HTMLButtonElement | HTMLInputElement).disabled : false;
      
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             !disabled &&
             element.offsetParent !== null;
    });

    setFocusableElements(visibleElements);
  }, []);

  const focusNext = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
    setCurrentFocusIndex(nextIndex);
    focusableElements[nextIndex]?.focus();
  }, [currentFocusIndex, focusableElements]);

  const focusPrevious = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const prevIndex = currentFocusIndex <= 0 
      ? focusableElements.length - 1 
      : currentFocusIndex - 1;
    setCurrentFocusIndex(prevIndex);
    focusableElements[prevIndex]?.focus();
  }, [currentFocusIndex, focusableElements]);

  const focusFirst = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    setCurrentFocusIndex(0);
    focusableElements[0]?.focus();
  }, [focusableElements]);

  const focusLast = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const lastIndex = focusableElements.length - 1;
    setCurrentFocusIndex(lastIndex);
    focusableElements[lastIndex]?.focus();
  }, [focusableElements]);

  return {
    currentFocusIndex,
    focusableElements,
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  };
};

// Hook for focus trap (useful for modals, dialogs)
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { updateFocusableElements, focusFirst } = useKeyboardNavigation();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    updateFocusableElements(container);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = Array.from(
          container.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
          )
        ) as HTMLElement[];

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

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

      if (e.key === 'Escape') {
        // Allow escape to be handled by parent component
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap becomes active
    setTimeout(() => focusFirst(), 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, updateFocusableElements, focusFirst]);

  return containerRef;
};

// Hook for screen reader announcements
export const useScreenReaderAnnouncements = () => {
  const { announceToScreenReader } = useAccessibility();

  const announceNavigation = useCallback((destination: string) => {
    announceToScreenReader(`Navigated to ${destination}`, 'polite');
  }, [announceToScreenReader]);

  const announceAction = useCallback((action: string, result?: string) => {
    const message = result ? `${action}. ${result}` : action;
    announceToScreenReader(message, 'assertive');
  }, [announceToScreenReader]);

  const announceError = useCallback((error: string) => {
    announceToScreenReader(`Error: ${error}`, 'assertive');
  }, [announceToScreenReader]);

  const announceSuccess = useCallback((message: string) => {
    announceToScreenReader(`Success: ${message}`, 'polite');
  }, [announceToScreenReader]);

  const announceProgress = useCallback((current: number, total: number, context?: string) => {
    const percentage = Math.round((current / total) * 100);
    const message = context 
      ? `${context}: ${current} of ${total}, ${percentage} percent complete`
      : `${current} of ${total}, ${percentage} percent complete`;
    announceToScreenReader(message, 'polite');
  }, [announceToScreenReader]);

  return {
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
    announceProgress
  };
};