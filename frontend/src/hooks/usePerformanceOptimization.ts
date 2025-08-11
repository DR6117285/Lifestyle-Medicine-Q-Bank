import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

// Hook for debouncing values (useful for search, API calls)
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling function calls
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  
  return useCallback(((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }) as T, [callback, delay]);
};

// Hook for intersection observer (lazy loading, infinite scroll)
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return { elementRef, isIntersecting, entry };
};

// Hook for virtual scrolling (performance optimization for large lists)
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    })),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

// Hook for caching API responses
export const useApiCache = <T>() => {
  const cache = useRef<Map<string, { data: T; timestamp: number; ttl: number }>>(new Map());

  const get = useCallback((key: string): T | null => {
    const cached = cache.current.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      cache.current.delete(key);
      return null;
    }

    return cached.data;
  }, []);

  const set = useCallback((key: string, data: T, ttl: number = 5 * 60 * 1000) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  const remove = useCallback((key: string) => {
    cache.current.delete(key);
  }, []);

  return { get, set, clear, remove };
};

// Hook for image preloading
export const useImagePreloader = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve();
        };
        
        img.onerror = () => {
          setFailedImages(prev => new Set(prev).add(url));
          resolve();
        };
        
        img.src = url;
      });
    };

    const preloadImages = async () => {
      const promises = imageUrls
        .filter(url => !loadedImages.has(url) && !failedImages.has(url))
        .map(loadImage);
      
      await Promise.allSettled(promises);
    };

    if (imageUrls.length > 0) {
      preloadImages();
    }
  }, [imageUrls, loadedImages, failedImages]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isFailed: (url: string) => failedImages.has(url)
  };
};

// Hook for lazy component loading
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const module = await importFunc();
      setComponent(() => module.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFunc]);

  return { Component, loading, error, loadComponent };
};

// Hook for performance monitoring
export const usePerformanceMonitor = (name: string) => {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    
    // Log performance data (in production, send to analytics)
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    // Performance budget check
    if (duration > 100) {
      console.warn(`Performance warning: ${name} exceeded 100ms (${duration.toFixed(2)}ms)`);
    }
    
    return duration;
  }, [name]);

  const measure = useCallback(async <T>(operation: () => Promise<T> | T): Promise<T> => {
    start();
    try {
      const result = await operation();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }, [start, end]);

  return { start, end, measure };
};

// Hook for memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  const updateMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const info = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: info.usedJSHeapSize,
        totalJSHeapSize: info.totalJSHeapSize,
        jsHeapSizeLimit: info.jsHeapSizeLimit
      });
    }
  }, []);

  useEffect(() => {
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [updateMemoryInfo]);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    memoryInfo,
    formatBytes,
    updateMemoryInfo
  };
};

// Hook for connection quality monitoring
export const useConnectionMonitor = () => {
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null>(null);

  useEffect(() => {
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        });
      }
    };

    updateConnectionInfo();
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionInfo);
      
      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  return connectionInfo;
};