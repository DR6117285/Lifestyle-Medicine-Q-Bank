import { useEffect, useRef, useState } from 'react';

interface TimeTrackingData {
  questionId: string;
  timeSpent: number; // in seconds
  startTime: Date;
  endTime?: Date;
}

interface UseTimeTrackingOptions {
  questionId?: string;
  userId?: string;
  onTimeUpdate?: (timeSpent: number) => void;
  saveInterval?: number; // Auto-save interval in seconds
}

export const useTimeTracking = (options: UseTimeTrackingOptions = {}) => {
  const { questionId, userId, onTimeUpdate, saveInterval = 30 } = options;
  
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  // Start tracking time for a question
  const startTracking = (newQuestionId?: string) => {
    const trackingId = newQuestionId || questionId;
    if (!trackingId) return;

    startTimeRef.current = new Date();
    setIsTracking(true);
    setTimeSpent(0);

    // Start interval to update time
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const currentTime = new Date();
        const elapsed = (currentTime.getTime() - startTimeRef.current.getTime()) / 1000;
        setTimeSpent(elapsed);
        
        if (onTimeUpdate) {
          onTimeUpdate(elapsed);
        }

        // Auto-save at intervals
        if (elapsed - lastSaveRef.current >= saveInterval) {
          saveTimeSpent(trackingId, elapsed, false);
          lastSaveRef.current = elapsed;
        }
      }
    }, 1000);
  };

  // Stop tracking and save final time
  const stopTracking = async (): Promise<number> => {
    if (!isTracking || !startTimeRef.current || !questionId) {
      return timeSpent;
    }

    const endTime = new Date();
    const finalTimeSpent = (endTime.getTime() - startTimeRef.current.getTime()) / 1000;
    
    setIsTracking(false);
    setTimeSpent(finalTimeSpent);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Save final time
    await saveTimeSpent(questionId, finalTimeSpent, true);
    
    return finalTimeSpent;
  };

  // Save time spent to backend or local storage
  const saveTimeSpent = async (qId: string, seconds: number, isFinal: boolean = false) => {
    const timeData: TimeTrackingData = {
      questionId: qId,
      timeSpent: seconds,
      startTime: startTimeRef.current!,
      endTime: isFinal ? new Date() : undefined
    };

    try {
      // For now, save to localStorage - replace with API call later
      const existingData = localStorage.getItem('questionTimeTracking') || '[]';
      const timeHistory = JSON.parse(existingData);
      
      // Update existing entry or add new one
      const existingIndex = timeHistory.findIndex(
        (entry: TimeTrackingData) => entry.questionId === qId
      );
      
      if (existingIndex >= 0) {
        timeHistory[existingIndex] = { ...timeHistory[existingIndex], ...timeData };
      } else {
        timeHistory.push(timeData);
      }
      
      localStorage.setItem('questionTimeTracking', JSON.stringify(timeHistory));

      // Also log to console for debugging
      console.log(`Time tracking - Question ${qId}: ${seconds.toFixed(1)}s ${isFinal ? '(final)' : '(interim)'}`);
      
      // TODO: Replace with actual API call
      /*
      if (userId) {
        await fetch('/api/save-time', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            question_id: qId,
            time_spent: seconds,
            is_final: isFinal
          })
        });
      }
      */
    } catch (error) {
      console.error('Failed to save time tracking data:', error);
    }
  };

  // Get time history for analysis
  const getTimeHistory = (): TimeTrackingData[] => {
    try {
      const data = localStorage.getItem('questionTimeTracking') || '[]';
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  // Get average time for a specific question or user
  const getAverageTime = (qId?: string): number => {
    const history = getTimeHistory();
    const relevantEntries = qId 
      ? history.filter(entry => entry.questionId === qId)
      : history;
    
    if (relevantEntries.length === 0) return 0;
    
    const totalTime = relevantEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    return totalTime / relevantEntries.length;
  };

  // Reset tracking (useful for question changes)
  const resetTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
    setIsTracking(false);
    setTimeSpent(0);
    lastSaveRef.current = 0;
  };

  // Auto-start tracking when questionId changes
  useEffect(() => {
    if (questionId) {
      resetTracking();
      startTracking(questionId);
    }
    
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [questionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isTracking && questionId) {
        // Save final time synchronously if possible
        saveTimeSpent(questionId, timeSpent, true);
      }
    };
  }, []);

  return {
    timeSpent,
    isTracking,
    startTracking,
    stopTracking,
    resetTracking,
    saveTimeSpent,
    getTimeHistory,
    getAverageTime
  };
};

export default useTimeTracking;