import { useState, useRef, useCallback } from 'react';

export function useTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setTime(accumulatedTimeRef.current + elapsed);
      }, 100);
      setIsRunning(true);
    }
  }, [isRunning]);

  const pause = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      accumulatedTimeRef.current = time;
      setIsRunning(false);
    }
  }, [isRunning, time]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setTime(0);
    setIsRunning(false);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
  }, []);

  const setInitialTime = useCallback((initialTime) => {
    setTime(initialTime);
    accumulatedTimeRef.current = initialTime;
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    toggle,
    setInitialTime,
  };
}

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
