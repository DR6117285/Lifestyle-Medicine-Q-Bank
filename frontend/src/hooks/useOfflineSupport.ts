import { useState, useEffect, useCallback } from 'react';

interface OfflineQueueItem {
  id: string;
  type: 'quiz_answer' | 'quiz_completion' | 'user_action';
  data: any;
  timestamp: number;
  retries: number;
}

interface ConnectionInfo {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// Hook for online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Hook for connection quality monitoring
export const useConnectionInfo = (): ConnectionInfo => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  useEffect(() => {
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      setConnectionInfo({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      });
    };

    updateConnectionInfo();
    
    window.addEventListener('online', updateConnectionInfo);
    window.addEventListener('offline', updateConnectionInfo);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionInfo);
      
      return () => {
        window.removeEventListener('online', updateConnectionInfo);
        window.removeEventListener('offline', updateConnectionInfo);
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
    
    return () => {
      window.removeEventListener('online', updateConnectionInfo);
      window.removeEventListener('offline', updateConnectionInfo);
    };
  }, []);

  return connectionInfo;
};

// Hook for offline queue management
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const isOnline = useOnlineStatus();

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offline_queue');
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
        localStorage.removeItem('offline_queue');
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('offline_queue', JSON.stringify(queue));
  }, [queue]);

  // Add item to queue
  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retries: 0
    };
    
    setQueue(prev => [...prev, queueItem]);
    return queueItem.id;
  }, []);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Process queue when online
  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0) return;
    
    const maxRetries = 3;
    const itemsToProcess = [...queue];
    
    for (const item of itemsToProcess) {
      try {
        // Process based on item type
        switch (item.type) {
          case 'quiz_answer':
            await processQuizAnswer(item.data);
            break;
          case 'quiz_completion':
            await processQuizCompletion(item.data);
            break;
          case 'user_action':
            await processUserAction(item.data);
            break;
          default:
            console.warn('Unknown queue item type:', item.type);
        }
        
        // Remove successful item
        removeFromQueue(item.id);
        
      } catch (error) {
        console.error('Failed to process queue item:', error);
        
        // Increment retry count
        setQueue(prev => prev.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, retries: queueItem.retries + 1 }
            : queueItem
        ));
        
        // Remove item if max retries reached
        if (item.retries >= maxRetries) {
          removeFromQueue(item.id);
          console.error('Max retries reached for queue item, removing:', item);
        }
      }
    }
  }, [isOnline, queue, removeFromQueue]);

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    processQueue,
    queueLength: queue.length
  };
};

// Processing functions for different queue item types
const processQuizAnswer = async (data: any) => {
  const response = await fetch('/api/quiz/submit-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit answer');
  }
  
  return response.json();
};

const processQuizCompletion = async (data: any) => {
  const response = await fetch('/api/quiz/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to complete quiz');
  }
  
  return response.json();
};

const processUserAction = async (data: any) => {
  const response = await fetch('/api/user/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to process user action');
  }
  
  return response.json();
};

// Hook for local storage management
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Hook for cache management with TTL
export const useCache = <T>() => {
  const get = useCallback((key: string): T | null => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const { data, expiry } = JSON.parse(item);
      if (Date.now() > expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }, []);

  const set = useCallback((key: string, data: T, ttlMs: number = 5 * 60 * 1000) => {
    try {
      const expiry = Date.now() + ttlMs;
      localStorage.setItem(`cache_${key}`, JSON.stringify({ data, expiry }));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }, []);

  const remove = useCallback((key: string) => {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }, []);

  const clear = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }, []);

  return { get, set, remove, clear };
};

// Hook for service worker management
export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState('serviceWorker' in navigator);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const register = useCallback(async (swUrl: string) => {
    if (!isSupported) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register(swUrl);
      setRegistration(reg);
      setIsRegistered(true);
      
      console.log('Service Worker registered successfully');
      return reg;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, [isSupported]);

  const unregister = useCallback(async () => {
    if (!registration) return false;
    
    try {
      const result = await registration.unregister();
      setIsRegistered(false);
      setRegistration(null);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }, [registration]);

  return {
    isSupported,
    isRegistered,
    registration,
    register,
    unregister
  };
};