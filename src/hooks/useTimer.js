import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  // Controls read these refs rather than state, so calling several in a row within
  // one render (pause then start, reset then start) behaves correctly. Reading
  // `isRunning` from state there made start() a no-op right after pause().
  const runningRef = useRef(false);
  const startTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);

  // Exact elapsed time right now (the `time` state only refreshes every 100 ms)
  const getTime = useCallback(
    () => accumulatedTimeRef.current + (runningRef.current ? Date.now() - startTimeRef.current : 0),
    []
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => setTime(getTime()), 100);
    setIsRunning(true);
  }, [getTime]);

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    accumulatedTimeRef.current = getTime();
    runningRef.current = false;
    clearInterval(intervalRef.current);
    setTime(accumulatedTimeRef.current);
    setIsRunning(false);
  }, [getTime]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    runningRef.current = false;
    accumulatedTimeRef.current = 0;
    setTime(0);
    setIsRunning(false);
  }, []);

  const setInitialTime = useCallback((initialTime) => {
    accumulatedTimeRef.current = initialTime;
    if (runningRef.current) startTimeRef.current = Date.now();
    setTime(initialTime);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    toggle,
    setInitialTime,
    getTime,
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
