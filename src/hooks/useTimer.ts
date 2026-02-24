import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isWarning: boolean;  // < 60 sec
  isCritical: boolean; // < 30 sec
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newTime?: number) => void;
  formatTime: () => string; // "MM:SS"
}

export function useTimer(
  initialSeconds: number,
  onTimeUp?: () => void
): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the callback ref up to date without re-triggering effects
  onTimeUpRef.current = onTimeUp;

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manage the countdown interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time is up
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setIsRunning(false);
            onTimeUpRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  }, [timeLeft]);

  const reset = useCallback(
    (newTime?: number) => {
      setIsRunning(false);
      setTimeLeft(newTime ?? initialSeconds);
    },
    [initialSeconds]
  );

  const formatTime = useCallback((): string => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    isRunning,
    isWarning: timeLeft > 0 && timeLeft < 60,
    isCritical: timeLeft > 0 && timeLeft < 30,
    start,
    pause,
    resume,
    reset,
    formatTime,
  };
}
