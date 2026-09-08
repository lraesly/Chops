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

// Parse a user-entered time into milliseconds.
// Accepts "12" (minutes), "12:30" (m:ss), or "1:02:30" (h:mm:ss).
// Returns null if the input can't be parsed.
export function parseTimeInput(input) {
  const str = String(input ?? '').trim();
  if (!str) return null;
  const parts = str.split(':').map((p) => p.trim());
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  let seconds;
  if (nums.length === 1) {
    seconds = nums[0] * 60;
  } else if (nums.length === 2) {
    seconds = nums[0] * 60 + nums[1];
  } else {
    seconds = nums[0] * 3600 + nums[1] * 60 + nums[2];
  }
  return Math.max(0, Math.round(seconds * 1000));
}
